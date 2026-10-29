// Every inferential card carries its related graph: the sampling-distribution curve (t, z, chi-square or F) with the
// statistic and the shaded p-value, the data graph that fits, and for an interval-only card the interval drawn with
// the estimate and the reference value.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(500); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const plots = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: (c.querySelector("h2") || {}).textContent, plots: Array.from(c.querySelectorAll(".plot")).map((p) => { const L = p._fullLayout || p.layout || {}; const t = L.title && (L.title.text || L.title); return { title: String(t || p.getAttribute("aria-label") || "").replace(/<br>/g, " "), traces: (p.data || []).length, shapes: (L.shapes || []).length }; }) }; });
const has = (r, re) => r.plots.some((p) => re.test(p.title));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); const alerts = []; page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page);
  let r;
  // contingency table: chi-square curve + row-percentage bars
  await clear(page); await menu(page, "Frequencies", "Contingency Tables: Independent Samples"); await page.selectOption("#f_r", "Employed"); await page.selectOption("#f_c", "Pet_Owner"); await run(page); r = await plots(page);
  ok(has(r, /chi-square distribution.*shaded area is the p-value/) && has(r, /row percentages/), "contingency table: chi-square curve and row-percentage bars", r);
  // goodness of fit: observed/expected bars + chi-square curve
  await clear(page); await menu(page, "Frequencies", "N Outcomes: chi-square Goodness of fit"); await page.selectOption("#f_x", "Year"); await run(page); r = await plots(page);
  ok(has(r, /chi-square distribution/) && r.plots.length >= 2, "goodness of fit: chi-square curve added to the bars", r);
  // one-way ANOVA: F curve + box plots
  await clear(page); await menu(page, "ANOVA", "One-Way ANOVA"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Year"); await run(page); r = await plots(page);
  ok(has(r, /^F distribution, df = \d+ and \d+; shaded area is the p-value/) && r.plots.length >= 2, "one-way ANOVA: F curve with the two df", r);
  // Kruskal-Wallis: chi-square (H) curve + box plots
  await clear(page); await menu(page, "Nonparametric", "Kruskal-Wallis (three or more groups)"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Year"); await run(page); r = await plots(page);
  ok(has(r, /chi-square distribution \(H\)/) && r.plots.length >= 2, "Kruskal-Wallis: H curve and box plots", r);
  // Mann-Whitney: z curve + box plots
  await clear(page); await menu(page, "Nonparametric", "Mann-Whitney U (two groups)"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Employed"); await run(page); r = await plots(page);
  ok(has(r, /standard normal; shaded area is the p-value/) && r.plots.length >= 2, "Mann-Whitney: z curve and box plots", r);
  // linear regression: slope t curve + scatter
  await clear(page); await menu(page, "Regression", "Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Study"); await run(page); r = await plots(page);
  ok(has(r, /slope test: t distribution, df = \d+/) && r.plots.length >= 2, "linear regression: t curve for the slope", r);
  // McNemar from counts: chi-square curve + discordant bars
  await clear(page); await menu(page, "Advanced", "McNemar test (paired yes or no)"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_bc", "15"); await page.fill("#f_cb", "5"); await run(page); r = await plots(page);
  ok(has(r, /chi-square distribution, df = 1/) && has(r, /discordant pairs/), "McNemar: chi-square curve and the discordant pairs", r);
  // variance test (one sample, two-sided): chi-square curve, half the p-value in the shaded tail
  await clear(page); await menu(page, "Advanced", "Variance tests (one SD or two SDs)"); await page.selectOption("#f_mode", "summary").catch(() => {}); await page.fill("#f_s1", "4"); await page.fill("#f_n1", "16"); await page.fill("#f_sigma0", "3"); await run(page); r = await plots(page);
  ok(has(r, /chi-square distribution, df = 15; shaded area is half the two-sided p-value/), "one-sample variance test: chi-square curve, two-sided wording", r);
  // interval-only cards: the interval drawn with the estimate and the reference line
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await run(page); r = await plots(page);
  ok(has(r, /95% confidence interval for the mean \(dot = sample mean\)/) && r.plots[0].traces === 2 && r.plots[0].shapes === 0, "one-sample t interval: the interval drawn, no reference line", r);
  await clear(page); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_perform", "ci"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Employed"); await run(page); r = await plots(page);
  ok(has(r, /95% confidence interval for the difference in means \(dashed line = 0/) && r.plots.find((p) => /difference in means/.test(p.title)).shapes === 1, "independent t interval: the interval with the 0 line, plus the box plots", r);
  await clear(page); await menu(page, "Frequencies", "Two proportions: z test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); for (const [k, v] of [["x1", 30], ["n1", 50], ["x2", 20], ["n2", 60]]) await page.fill("#f_" + k, String(v)); await run(page); r = await plots(page);
  ok(has(r, /difference in proportions \(dashed line = 0/), "two-proportion interval: the interval drawn with the 0 line", r);
  await clear(page); await menu(page, "Advanced", "Variance tests (one SD or two SDs)"); await page.selectOption("#f_mode", "summary").catch(() => {}); await page.selectOption("#f_perform", "ci"); await page.selectOption("#f_which", "two"); await page.fill("#f_s1", "4"); await page.fill("#f_n1", "16"); await page.fill("#f_s2", "3"); await page.fill("#f_n2", "21"); await run(page); r = await plots(page);
  ok(has(r, /ratio of variances \(dashed line = 1/), "variance-ratio interval: the interval drawn with the 1 line", r);
  // hypothesis-test cards keep their curve (one-sample t)
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "50"); await run(page); r = await plots(page);
  ok(has(r, /t distribution, df = 24; shaded area is the p-value/), "one-sample t test still draws the t curve", r);
  ok(alerts.length === 0 && errs.length === 0, "no alerts, no page errors", { alerts, errs });
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
