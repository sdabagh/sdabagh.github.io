// ANOVA menu regroup, ANCOVA, MANOVA, Friedman dialogs.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); }
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(300); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), plots: c.querySelectorAll(".plot").length, apa: (c.querySelector(".apa code") || {}).textContent, say: Array.from(c.querySelectorAll(".say, .ok, .warn")).map((s) => s.textContent.slice(0, 80)) }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], dialogs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  const items = await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll("nav.menu .dd")).map((d) => [d.dataset.name, Array.from(d.querySelectorAll(".items button")).map((b) => b.textContent)])));
  ok(items.ANOVA.join("|") === "One-Way ANOVA|Two-Way ANOVA|ANCOVA|Repeated Measures and Mixed ANOVA|MANOVA|Kruskal-Wallis (three or more groups)|Friedman (nonparametric repeated measures)", "ANOVA menu holds the family", items.ANOVA);
  ok(!items.Advanced.includes("Two-Way ANOVA") && !items.Advanced.includes("Repeated Measures and Mixed ANOVA") && items.Advanced.includes("Logistic Regression"), "Two-Way and Repeated Measures left Advanced", items.Advanced.length);
  ok(items.Nonparametric.includes("Friedman (nonparametric repeated measures)") && items.Nonparametric.includes("Kruskal-Wallis (three or more groups)"), "Friedman also under Nonparametric");
  await sample(page, "STATC1000_Class_Data.csv", 40);
  // ANCOVA: GPA by Year adjusting for Hours_Study
  await menu(page, "ANOVA", "ANCOVA"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_g", "Year"); await page.selectOption("#f_xs", ["Hours_Study"]); await run(page);
  let c = await cardInfo(page);
  const yearRow = c.rows[0].find((r) => r[0] === "Year"), hRow = c.rows[0].find((r) => r[0] === "Hours_Study");
  ok(c.title === "ANCOVA" && near(yearRow[4], 1.6777, 0.001) && yearRow[2] === "3" && near(hRow[4], 2.5529, 0.001), "ANCOVA table: F Year 1.6777 (3 df), F Hours_Study 2.5529", { yearRow, hRow });
  const fresh = c.rows[1].find((r) => r[0] === "Freshman");
  ok(near(fresh[3], 3.409, 0.001) && c.rows[1].length === 4 && c.rows[2].length === 6 && c.plots === 1 && /partial η²/.test(c.apa), "adjusted means, six pairwise rows, plot, APA line", { fresh, apa: c.apa });
  ok(c.say.some((s) => /Homogeneity of regression slopes: the group by covariate interaction/.test(s)), "slopes check reported", c.say);
  // MANOVA: GPA and Hours_Sleep by Year
  await menu(page, "ANOVA", "MANOVA"); await page.selectOption("#f_ys", ["GPA", "Hours_Sleep", "Hours_Study"]); await page.selectOption("#f_g", "Year"); await run(page);
  c = await cardInfo(page);
  ok(c.title === "MANOVA" && c.rows[0].map((r) => r[0]).join("|") === "Pillai's trace|Wilks' Λ|Hotelling-Lawley trace|Roy's largest root" && c.rows[0].every((r) => Number.isFinite(Number(r[2])) && Number(r[5] === "< 0.0001" ? 0 : r[5]) <= 1), "MANOVA: four statistics with F and p", c.rows[0]);
  ok(c.rows[1].length === 4 && c.rows[2].length === 3 && c.plots === 1 && /Pillai's trace = /.test(c.apa), "MANOVA: group means, three follow-up rows, profile plot, APA", c.apa);
  // MANOVA with one DV is refused; one DV equals Y would be singular: a message, no crash
  await menu(page, "ANOVA", "MANOVA"); await page.selectOption("#f_ys", ["GPA"]); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === 1 && /at least two dependent variables/.test(dialogs[0]), "one outcome is refused with a message", dialogs); await page.click("#dlgCancel");
  // Friedman on the cadet mile times (weeks 1, 4, 8, 12)
  await sample(page, "cadet_mile_times.csv", await page.evaluate(async () => (await (await fetch("data/cadet_mile_times.csv")).text()).trim().split(/\r?\n/).length - 1));
  const weekCols = await page.evaluate(() => Array.from(document.querySelectorAll("#f_cols option")).map((o) => o.value)).catch(() => null);
  await menu(page, "ANOVA", "Friedman (nonparametric repeated measures)");
  const opts = await page.evaluate(() => Array.from(document.querySelectorAll("#f_cols option")).map((o) => o.value));
  const weeks = opts.filter((o) => /week|wk|w\d|time|mile/i.test(o)).slice(0, 4);
  ok(weeks.length >= 3, "cadet data has the repeated columns", opts);
  await page.selectOption("#f_cols", weeks); await run(page);
  c = await cardInfo(page);
  const fr = c.rows[0][0];
  ok(c.title === "Friedman" && Number(fr[1]) > 0 && fr[2] === String(weeks.length - 1) && Number(fr[4]) >= 0 && Number(fr[4]) <= 1, "Friedman: chi-square, df, p, W", fr);
  ok(c.rows[1].length === weeks.length && c.rows[2].length === (weeks.length * (weeks.length - 1)) / 2 && c.plots === 1 && /Kendall's W/.test(c.apa), "Friedman: per-condition rows, pairwise rows, box plot, APA", c.apa);
  // Two-Way ANOVA still runs from its new home, with the new title
  await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "ANOVA", "Two-Way ANOVA");
  ok((await page.textContent("#dlgTitle")) === "ANOVA: Two-Way ANOVA", "Two-Way dialog title says ANOVA");
  await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_a", "Year"); await page.selectOption("#f_b", "Employed"); await run(page);
  c = await cardInfo(page); ok(c.title === "Two-Way ANOVA" && c.rows[0].length === 4, "Two-Way ANOVA runs from the ANOVA menu", c.rows[0].map((r) => r[0]));
  // Which test? still routes three or more groups to One-Way ANOVA (unchanged)
  ok(errs.length === 0, "no page or console errors", errs);
  await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/anova.png" });
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
