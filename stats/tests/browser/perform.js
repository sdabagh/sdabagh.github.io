// Perform: hypothesis test, or the confidence interval on its own (no test value), as StatCrunch offers; and sample
// size written n. Reference (one-sample t from summary, xbar 52, s 10, n 25): SE = 2, t* at 95 percent on 24 df =
// 2.0639, so the interval is 52 +/- 4.1278 = 47.872 to 56.128. Proportion x 40 of n 100, Wald 95 percent: SE = 0.04899,
// z* = 1.96, 0.4 +/- 0.09602 = 0.30398 to 0.49602.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
async function cancel(page) { await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const firstCard = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); const t = c.querySelector("table.res"); return { title: c.querySelector("h3, .title") ? c.querySelector("h3, .title").textContent : "", heads: Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent), cells: Array.from(t.querySelector("tbody tr").children).map((td) => td.textContent), text: c.textContent }; });
const visible = (page, id) => page.evaluate((id) => { const el = document.getElementById(id); if (!el) return null; const row = el.closest(".field, .row, label, div"); return !!(el.offsetParent || (row && row.offsetParent)); }, id);
const ciEnds = (r, pc) => { const i = r.heads.findIndex((h) => new RegExp(pc + "% CI lower").test(h)); return i < 0 ? null : [Number(r.cells[i]), Number(r.cells[i + 1])]; };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); const alerts = []; page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  // ---- the dialog: Perform first, test value / hypothesis / alpha hidden in interval mode, n not N
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary");
  const labels = await page.evaluate(() => Array.from(document.querySelectorAll("#dlgForm label")).map((l) => l.textContent.trim()));
  ok(labels.includes("n") && !labels.includes("N"), "the sample size box is labelled n, not N", labels.filter((l) => /^n$|^N$/.test(l)));
  ok(await page.evaluate(() => document.querySelector("#f_perform") && document.querySelector("#f_perform").value) === "test", "Perform defaults to the hypothesis test");
  ok(await visible(page, "f_mu0") && await visible(page, "f_alt") && await visible(page, "f_alpha"), "test mode shows the test value, the hypothesis and alpha");
  await page.selectOption("#f_perform", "ci"); await page.waitForTimeout(150);
  ok(!(await visible(page, "f_mu0")) && !(await visible(page, "f_alt")) && !(await visible(page, "f_alpha")) && (await visible(page, "f_conf")), "interval only: test value, hypothesis and alpha disappear, the confidence level stays");
  // ---- one-sample t interval with no test value typed
  await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.evaluate(() => (document.querySelector("#f_mu0").value = "")); await run(page);
  ok(alerts.length === 0, "no 'type a test value' complaint in interval mode", alerts);
  let r = await firstCard(page); let e = ciEnds(r, 95);
  ok(/One Sample T Interval/.test(r.text) && e && near(e[0], 47.872, 0.002) && near(e[1], 56.128, 0.002), "one-sample t interval card: 47.87 to 56.13 at 95 percent", { heads: r.heads, cells: r.cells });
  ok(r.heads.includes("n") && !r.heads.includes("N") && r.heads.includes("Margin of error") && r.heads.includes("t*"), "the card lists n, t* and the margin of error", r.heads);
  ok(/95% CI \[47\.87, 56\.13\]/.test(r.text) && /We are 95 percent confident/.test(r.text) && !/p-value|H0/.test(r.text), "APA line and a reading sentence; no p-value, no H0", r.text.slice(0, 200));
  // the R script has no mu = in interval mode
  await page.click('nav.menu .dd[data-name="Results"] .top'); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(400);
  const script = await page.evaluate(() => Array.from(document.querySelector("#out .card").querySelectorAll("pre")).map((p) => p.textContent).join("\n"));
  ok(/tsum\.test\(/.test(script) && !/mu =/.test(script) && !/Test value: 0/.test(script) && !/Alpha/.test(script) && /Perform: Confidence interval only/.test(script), "the R call has no mu =, and the step list omits the hidden test value and alpha", script.match(/tsum\.test[^\n]*/) && script.match(/tsum\.test[^\n]*/)[0]);
  // ---- the hypothesis test path is unchanged (same interval, plus t and p)
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary");
  await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "50"); await run(page);
  r = await firstCard(page);
  ok(/One Sample T-Test/.test(r.text) && r.heads.includes("Statistic") && r.heads.includes("p") && /H₀|H0|fail to reject|reject H/.test(r.text), "test mode still gives the full test card", r.heads);
  // a missing test value in test mode is still refused
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary");
  await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "");
  await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForTimeout(300);
  const stillOpen = await page.evaluate(() => document.querySelector("#dlg").open), msg = await page.evaluate(() => document.querySelector("#dlg").textContent);
  ok(stillOpen && /test value/i.test(msg + alerts.join(" ")), "test mode without a test value: the dialog asks for one", (msg.match(/[^.]*test value[^.]*/i) || alerts).toString().slice(0, 120));
  await cancel(page);
  // ---- independent t interval from summary: equals the interval of the test with the same numbers
  const indep = async (perform) => { await clear(page); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", perform); for (const [k, v] of [["m1", 10], ["s1", 2], ["n1", 20], ["m2", 8], ["s2", 3], ["n2", 25]]) await page.fill("#f_" + k, String(v)); await run(page); return firstCard(page); };
  const ti = await indep("ci"), tt = await indep("test");
  const ei = ciEnds(ti, 95), et = ciEnds(tt, 95);
  ok(/Independent Samples T Interval/.test(ti.text) && ei && et && near(ei[0], et[0], 1e-6) && near(ei[1], et[1], 1e-6) && /does not include 0/.test(ti.text), "independent t: the interval-only card matches the test's interval and reads whether 0 is inside", { ci: ei, test: et });
  ok(ti.heads.includes("Margin of error") && /Group Descriptives/.test(ti.text) && ti.text.includes(" n") && !/\bN\b/.test(ti.heads.join(" ")), "independent t interval card has the margin of error and n in the descriptives", ti.heads);
  // ---- one proportion interval (Wald) with no test value
  await clear(page); await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci");
  ok(!(await visible(page, "f_p0")) && (await visible(page, "f_cim")), "proportion dialog: interval only hides the test value and keeps the interval method");
  await page.fill("#f_xs", "40"); await page.fill("#f_n", "100"); await run(page);
  r = await firstCard(page); e = ciEnds(r, 95);
  ok(/One Proportion Interval/.test(r.text) && e && near(e[0], 0.30398, 0.0005) && near(e[1], 0.49602, 0.0005) && /z\* \(95 percent\) = 1\.96/.test(r.text), "proportion interval 0.304 to 0.496 with the worked z* line", { heads: r.heads, cells: r.cells });
  // ---- two proportions and the variance dialog in interval mode produce cards, no errors
  await clear(page); await menu(page, "Frequencies", "Two proportions: z test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci");
  for (const [k, v] of [["x1", 30], ["n1", 50], ["x2", 20], ["n2", 60]]) await page.fill("#f_" + k, String(v)); await run(page);
  r = await firstCard(page);
  ok(/Two Proportions Interval/.test(r.text) && /We are 95 percent confident/.test(r.text) && /z\*/.test(r.text), "two proportions interval card", r.text.slice(0, 120));
  await clear(page); await menu(page, "Advanced", "Variance tests (one SD or two SDs)"); await page.selectOption("#f_mode", "summary").catch(() => {}); await page.selectOption("#f_perform", "ci");
  ok(!(await visible(page, "f_sigma0")), "variance dialog: the claimed sigma hides in interval mode");
  await page.fill("#f_s1", "4"); await page.fill("#f_n1", "16"); await run(page);
  r = await firstCard(page);
  ok(/One Sample Variance Interval/.test(r.text) && /CI for (σ|sigma)/.test(r.text) && !/Claimed (σ|sigma)/.test(r.text), "one-sample variance interval card without a claimed sigma", r.text.slice(0, 140));
  // ---- edit a card made in interval mode: the dialog comes back in interval mode
  await page.click('#out .card [data-act="edit"]'); await page.waitForSelector("#dlg.open");
  ok(await page.evaluate(() => document.querySelector("#f_perform").value) === "ci", "edit restores Perform = interval only");
  await cancel(page);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
