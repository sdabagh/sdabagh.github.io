// The sample mean comes first. In class the One Sample T-Test card's first number, the t statistic against the default
// test value 0, was read as the sample mean (41.39 for the push-up data, whose mean is 44.85). The card now leads with
// n, the mean, SD, SE, df and the interval for the mean; the test table with Statistic, df and p follows, with a note
// when the test value is the default 0. Reference (popp_academy_fitness, pushups_week12, n 60): mean 44.85, s 8.3925,
// SE 1.0835, 95% CI 42.682 to 47.018 (t* on 59 df = 2.0010), t against 0 = 41.39. R: t.test(x) gives the same.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const tables = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); const sc = c.querySelector(".scblock"); return { sc: sc ? { title: sc.querySelector(".sctitle").textContent, lines: Array.from(sc.querySelectorAll(".scline")).map((l) => l.textContent), res: sc.querySelector(".scres").textContent, heads: Array.from(sc.querySelectorAll("thead th")).map((h) => h.textContent), rows: Array.from(sc.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)), first: c.querySelector(".scblock, table.res, .cap") === sc } : null, tables: Array.from(c.querySelectorAll("table.res")).filter((t) => !t.closest(".scblock")).map((t) => ({ cap: (t.previousElementSibling && t.previousElementSibling.classList.contains("cap")) ? t.previousElementSibling.textContent : "", heads: Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent), rows: Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)) })), notes: Array.from(c.querySelectorAll(".note")).map((n) => n.textContent) }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_academy_fitness.csv"); await run(page);
  // the class case: One Sample T-Test on pushups_week12 with the default test value 0
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "pushups_week12"); await run(page); let r = await tables(page);
  ok(r.sc && r.sc.first && r.sc.title === "One sample T hypothesis test:" && /^(μ|mu) : Mean of population \(pushups_week12\)$/.test(r.sc.lines[0]) && /^H[0₀] : (μ|mu) = 0$/.test(r.sc.lines[1]) && /^HA : (μ|mu) (≠|not equal to) 0$/.test(r.sc.lines[2]) && r.sc.res === "Hypothesis test results:", "the card opens StatCrunch-style: the parameter in words, H0 and HA, then the results", r.sc && { title: r.sc.title, lines: r.sc.lines, res: r.sc.res });
  ok(r.sc && r.sc.heads.join("|") === "Mean|Sample Mean|Std. Dev.|n|Std. Err.|DF|T-Stat|P-value", "results columns in StatCrunch order, the sample mean second", r.sc && r.sc.heads);
  const c = r.sc ? r.sc.rows[0] : [];
  ok(/^(μ|mu)$/.test(c[0]) && near(c[1], 44.85, 1e-9) && near(c[2], 8.3925, 0.00005) && Number(c[3]) === 60 && near(c[4], 1.0835, 0.00005) && Number(c[5]) === 59 && near(c[6], 41.3947, 0.0005) && /< 0\.0001/.test(c[7]), "pushups_week12: mean 44.85, s 8.3925, n 60, SE 1.0835, df 59, T-Stat 41.39", c);
  const t2 = r.tables[0];
  ok(t2 && /One Sample T-Test/.test(t2.cap) && t2.heads.includes("Statistic"), "the course-named One Sample T-Test table follows, so instructions and check my work still match", t2 && { cap: t2.cap, heads: t2.heads });
  ok(r.notes.some((n) => /Test value 0 is the dialog's default/.test(n) && /Confidence interval only/.test(n) && /95% interval for the mean itself is 42\.682 to 47\.018/.test(n)), "the note explains the default test value, points to Confidence interval only and gives the interval for the mean", r.notes);
  // interval only: the StatCrunch confidence interval block with Critical t and the limits
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "pushups_week12"); await page.selectOption("#f_perform", "ci"); await run(page); r = await tables(page);
  ok(r.sc && r.sc.title === "One sample T confidence interval:" && r.sc.res === "95% confidence interval results:" && r.sc.heads.join("|") === "Mean|Sample Mean|Std. Dev.|n|Std. Err.|DF|Critical t|L. Limit|U. Limit", "interval only: the StatCrunch confidence interval block", r.sc && { title: r.sc.title, heads: r.sc.heads });
  const ci = r.sc ? r.sc.rows[0] : [];
  ok(near(ci[1], 44.85, 1e-9) && near(ci[4], 1.0835, 0.00005) && Number(ci[5]) === 59 && near(ci[6], 2.001, 0.0005) && near(ci[7], 42.682, 0.0005) && near(ci[8], 47.018, 0.0005), "Critical t 2.001, L. Limit 42.682, U. Limit 47.018", ci);
  // with a real test value the note gives Ha and says which interval is which
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "pushups_week12"); await page.fill("#f_mu0", "40"); await run(page); r = await tables(page);
  ok(r.sc && /^H[0₀] : (μ|mu) = 40$/.test(r.sc.lines[1]) && near(r.sc.rows[0][1], 44.85, 1e-9) && r.notes.some((n) => /mean difference \(mean minus 40\)/.test(n) && /interval for the mean itself is 42\.682 to 47\.018/.test(n)), "test value 40: H0 names it, the mean still comes first and the note names both intervals", { lines: r.sc && r.sc.lines, notes: r.notes });
  // independent t: the group means come first
  await clear(page); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "pushups_week12"); const g = await page.evaluate(() => Array.from(document.querySelector("#f_g").options).map((o) => o.value)); await page.selectOption("#f_g", g.find((x) => /sex|gender|squad|group|shift/i.test(x)) || g[0]); await run(page); r = await tables(page);
  ok(r.sc && r.sc.title === "Two sample T hypothesis test:" && r.sc.heads.join("|") === "Difference|Sample Diff.|Std. Err.|DF|T-Stat|P-value" && r.tables[0] && /Group means/.test(r.tables[0].cap) && r.tables[0].rows.length === 2 && /Independent Samples T-Test/.test(r.tables[1].cap), "independent t: the StatCrunch block, the group means, then the test table", { sc: r.sc && r.sc.title, caps: r.tables.map((t) => t.cap) });
  // paired t: the two measures and their difference come first
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "STATC1000_Sleep_Followup.csv"); await run(page);
  await clear(page); await menu(page, "T-Tests", "Paired Samples T-Test"); await run(page); r = await tables(page);
  ok(r.sc && r.sc.title === "Paired T hypothesis test:" && r.sc.heads.join("|") === "Difference|Mean|Std. Err.|DF|T-Stat|P-value" && r.tables[0] && /The two measures and their difference/.test(r.tables[0].cap) && r.tables[0].rows.length === 3 && /Paired Samples T-Test/.test(r.tables[1].cap), "paired t: the StatCrunch block, the two measures and the difference, then the test table", { sc: r.sc && r.sc.title, caps: r.tables.map((t) => t.cap) });
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
