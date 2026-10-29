// Simulation route when a condition is not met: the card runs a bootstrap interval and a permutation (or binomial
// simulation) p-value from the same data and compares them with the formula answer. Present only when the condition
// fails; absent when it holds. Reference: 4 successes of 12 at p0 = 0.5, exact binomial two-sided p = 0.3877.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(500); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const sim = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"), s = c.querySelector(".simroute"); if (!s) return null; const rows = Array.from(s.querySelectorAll("table.res tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)); const plots = Array.from(c.querySelectorAll(".plot")).map((p) => { const L = p._fullLayout || p.layout || {}; const t = L.title && (L.title.text || L.title); return String(t || "").replace(/<br>/g, " "); }); return { head: s.querySelector(".simhead").textContent, rows, say: (s.querySelector(".say") || {}).textContent || "", plots, warnBefore: !!c.querySelector(".warn") }; });
const num = (t) => { const m = /^(-?[\d.]+) to (-?[\d.]+)$/.exec(t.trim()); return m ? [Number(m[1]), Number(m[2])] : null; };
const pnum = (t) => { const m = /([\d.]+)/.exec(t.replace(/^[<=\s]*/, "")); return m ? Number(m[1]) : NaN; };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); const alerts = []; page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page);
  let r;
  // n = 40: the condition holds, no simulation block
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "Hours_Sleep"); await page.fill("#f_mu0", "7"); await run(page); r = await sim(page);
  ok(r === null, "one-sample t with n = 40: the condition holds, no simulation block", r);
  // independent t: groups of 23 and 17 (Pet_Owner), the condition fails
  await clear(page); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Pet_Owner"); await run(page); r = await sim(page);
  ok(r && r.warnBefore && /^Simulation route: a group has n under 30 \((23|17) and (17|23)\)/.test(r.head), "independent t with small groups: the simulation block under the pink box", r && r.head);
  const ci = r && r.rows.find((x) => /interval for the difference in means/.test(x[0])), pv = r && r.rows.find((x) => x[0] === "p-value");
  ok(ci && num(ci[1]) && num(ci[2]) && Math.abs(num(ci[1])[0] - num(ci[2])[0]) < 1.5, "a formula interval and a bootstrap interval, close to each other", ci);
  ok(pv && Number.isFinite(pnum(pv[1])) && Number.isFinite(pnum(pv[2])) && Math.abs(pnum(pv[1]) - pnum(pv[2])) < 0.08, "a formula p-value and a permutation p-value, close to each other", pv);
  ok(/agrees with the formula|differ noticeably|opposite sides/.test(r.say) && /Advanced \(Bootstrap confidence interval, Permutation test\)/.test(r.say), "the sentence compares the two and points to Advanced and Learn", r.say.slice(0, 160));
  ok(r.plots.some((t) => /shuffled differences/.test(t)), "the permutation distribution is drawn with the observed value", r.plots);
  // the same data, interval only: bootstrap interval, no p-value row
  await clear(page); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_perform", "ci"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Pet_Owner"); await run(page); r = await sim(page);
  ok(r && r.rows.length === 1 && /interval/.test(r.rows[0][0]) && r.plots.some((t) => /bootstrap differences/.test(t)), "interval-only card: the bootstrap interval alone, with the bootstrap distribution", r && r.rows);
  // one proportion from counts: 4 of 12 at p0 = 0.5, a count under 10; exact binomial p = 0.3877
  await clear(page); await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xs", "4"); await page.fill("#f_n", "12"); await run(page); r = await sim(page);
  ok(r && /^Simulation route: a count is under 10 \(4 successes, 8 failures\)/.test(r.head), "one proportion 4 of 12: the simulation block", r && r.head);
  const pp = r && r.rows.find((x) => x[0] === "p-value"), pc = r && r.rows.find((x) => /interval for the proportion/.test(x[0]));
  ok(pp && Math.abs(pnum(pp[2]) - 0.3877) < 0.06 && pc && num(pc[2]) && num(pc[2])[0] >= 0 && num(pc[2])[1] <= 1, "binomial simulation p near 0.39 (exact 0.3877) and a bootstrap interval inside 0 to 1", { pp, pc });
  ok(r.plots.some((t) => /simulated at p0 = 0\.5/.test(t)), "the simulated proportions under H0 are drawn", r.plots);
  // one proportion from counts with every count at least 10: no block
  await clear(page); await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xs", "40"); await page.fill("#f_n", "100"); await run(page); r = await sim(page);
  ok(r === null, "one proportion 40 of 100: no simulation block", r);
  // two proportions 3 of 10 against 8 of 12
  await clear(page); await menu(page, "Frequencies", "Two proportions: z test"); await page.selectOption("#f_mode", "summary"); for (const [k, v] of [["x1", 3], ["n1", 10], ["x2", 8], ["n2", 12]]) await page.fill("#f_" + k, String(v)); await run(page); r = await sim(page);
  ok(r && /^Simulation route: a count is under 10 \(3\/7 and 8\/4\)/.test(r.head) && r.rows.length === 2, "two proportions with small counts: interval and p-value rows", r && { head: r.head, rows: r.rows });
  // contingency table Year by Pet_Owner: an expected count under 5
  await clear(page); await menu(page, "Frequencies", "Contingency Tables: Independent Samples"); await page.selectOption("#f_r", "Year"); await page.selectOption("#f_c", "Pet_Owner"); await run(page); r = await sim(page);
  ok(r && /^Simulation route: the smallest expected count is [\d.]+, under 5/.test(r.head) && r.rows.length === 1 && r.rows[0][0] === "p-value" && r.plots.some((t) => /second column shuffled/.test(t)), "contingency table with a small expected count: permutation chi-square", r && { head: r.head, rows: r.rows });
  const pc2 = r && r.rows[0]; ok(pc2 && Math.abs(pnum(pc2[1]) - pnum(pc2[2])) < 0.12, "permutation chi-square p near the formula p", pc2);
  // one-way ANOVA Hours_Sleep by Year: every group under 30, so a size condition (new) and the permutation F
  await clear(page); await menu(page, "ANOVA", "One-Way ANOVA"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Year"); await run(page); r = await sim(page);
  ok(r && /^Simulation route: every group has n under 30/.test(r.head) && r.rows[0][0] === "p-value" && r.plots.some((t) => /group labels shuffled/.test(t)), "one-way ANOVA with small groups: permutation F", r && r.head);
  const warnTxt = await page.evaluate(() => Array.from(document.querySelectorAll("#out .card .warn")).map((w) => w.textContent).join(" | "));
  ok(/Every group has n under 30 \(.*Sophomore: 15.*\)/.test(warnTxt), "the ANOVA card names the small groups in its new size condition", warnTxt.slice(0, 200));
  // regression on a filtered subset (Sophomore, n = 15): slope bootstrap and permutation
  await page.fill("#filterBox", 'Year == "Sophomore"'); await page.dispatchEvent("#filterBox", "change"); await page.waitForTimeout(400);
  await clear(page); await menu(page, "Regression", "Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Study"); await run(page); r = await sim(page);
  ok(r && /^Simulation route: n = 15 is under 30/.test(r.head) && r.rows.length === 2 && /interval for the slope/.test(r.rows[0][0]) && r.plots.some((t) => /slopes with y shuffled/.test(t)), "regression with n = 15: bootstrap slope interval and permutation p", r && { head: r.head, rows: r.rows });
  // one-sample t on the subset: interval for the mean itself (not the difference) against the bootstrap
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "Hours_Sleep"); await page.fill("#f_mu0", "7"); await run(page); r = await sim(page);
  const cm = r && r.rows.find((x) => /interval for the mean/.test(x[0]));
  ok(r && /^Simulation route: n = 15 is under 30/.test(r.head) && cm && num(cm[1]) && num(cm[1])[0] > 3 && num(cm[1])[1] < 12 && Math.abs(num(cm[1])[0] - num(cm[2])[0]) < 1, "one-sample t with n = 15: the formula interval is for the mean itself and the bootstrap interval is close", cm);
  await page.fill("#filterBox", ""); await page.dispatchEvent("#filterBox", "change"); await page.waitForTimeout(300);
  // Ask tip mentions the simulation route on such a card
  await page.click("#askBtn"); await page.waitForTimeout(300);
  const tips = await page.evaluate(() => Array.from(document.querySelectorAll("#botLog .bmsg.tip")).map((m) => m.textContent));
  ok(tips.some((t) => /already ran the simulation route/.test(t)), "the Ask tip on a small-sample card points to the simulation block", tips.slice(-2));
  ok(alerts.length === 0 && errs.length === 0, "no alerts, no page errors", { alerts, errs });
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
