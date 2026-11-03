// The StatCrunch-style block on the Chapter 9 to 11 cards: goodness of fit, contingency table, one-way ANOVA and
// simple linear regression open with the parameter or model named in words and one results table in StatCrunch's
// layout; the course-named tables follow with the same numbers.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const sc = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"), b = c.querySelector(".scblock"); if (!b) return null; const course = Array.from(c.querySelectorAll("table.res")).filter((t) => !t.closest(".scblock")).map((t) => ({ cap: t.previousElementSibling && t.previousElementSibling.classList.contains("cap") ? t.previousElementSibling.textContent : "", rows: Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)), heads: Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent) })); return { first: c.querySelector(".scblock, table.res, .cap") === b, title: b.querySelector(".sctitle").textContent, lines: Array.from(b.querySelectorAll(".scline")).map((l) => l.textContent), res: b.querySelector(".scres").textContent, heads: Array.from(b.querySelectorAll("thead th")).map((h) => h.textContent), rows: Array.from(b.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)), course }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page);
  // goodness of fit on Year
  await menu(page, "Frequencies", "N Outcomes: chi-square Goodness of fit"); await page.selectOption("#f_x", "Year"); await run(page); let r = await sc(page);
  const gofCourse = r && r.course.find((t) => /(Chi-square|χ²) Goodness of Fit/.test(t.cap));
  ok(r && r.first && /^(Chi-Square|χ²) goodness-of-fit results:$/.test(r.title) && r.lines[0] === "Observed: Year" && r.lines[1] === "Expected: all categories equally likely" && /^n\|DF\|(Chi-Square|χ²) Stat\|P-value$/.test(r.heads.join("|")) && Number(r.rows[0][0]) === 40 && Number(r.rows[0][1]) === 3, "goodness of fit: the block first, n 40 and DF 3", r && { title: r.title, lines: r.lines, heads: r.heads, row: r.rows[0] });
  ok(gofCourse && r.rows[0][2] === gofCourse.rows[0][0] && r.rows[0][3] === gofCourse.rows[0][2], "goodness of fit: the block's chi-square and p equal the course table's", { block: r && r.rows[0], course: gofCourse && gofCourse.rows[0] });
  // contingency table Year by Pet_Owner
  await clear(page); await menu(page, "Frequencies", "Contingency Tables: Independent Samples"); await page.selectOption("#f_r", "Year"); await page.selectOption("#f_c", "Pet_Owner"); await run(page); r = await sc(page);
  const ctCourse = r && r.course.find((t) => /(chi-square|χ²) Tests/.test(t.cap));
  ok(r && r.first && r.title === "Contingency table results:" && r.lines.join("|") === "Rows: Year|Columns: Pet_Owner" && /^(Chi-Square|χ²) test:$/.test(r.res) && r.heads.join("|") === "Statistic|DF|Value|P-value" && Number(r.rows[0][1]) === 3, "contingency table: the block first with DF 3", r && { title: r.title, lines: r.lines, heads: r.heads, row: r.rows[0] });
  ok(ctCourse && r.rows[0][2] === ctCourse.rows[0][1] && r.rows[0][3] === ctCourse.rows[0][3], "contingency table: the block's value and p equal the course table's", { block: r && r.rows[0], course: ctCourse && ctCourse.rows[0] });
  // one-way ANOVA Hours_Sleep by Year
  await clear(page); await menu(page, "ANOVA", "One-Way ANOVA"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_g", "Year"); await run(page); r = await sc(page);
  const anCourse = r && r.course.find((t) => /^ANOVA/.test(t.cap));
  ok(r && r.first && r.title === "Analysis of Variance results:" && r.lines.join("|") === "Responses: Hours_Sleep|Factors: Year" && r.res === "ANOVA table:" && r.heads.join("|") === "Source|DF|SS|MS|F-Stat|P-value" && r.rows.length === 3 && r.rows[0][0] === "Year" && r.rows[1][0] === "Error" && r.rows[2][0] === "Total" && Number(r.rows[0][1]) + Number(r.rows[1][1]) === Number(r.rows[2][1]), "one-way ANOVA: the block first with the Year, Error and Total rows and df adding up", r && { heads: r.heads, rows: r.rows });
  ok(anCourse && r.rows[0][4] === anCourse.rows[0][4] && r.rows[0][5] === anCourse.rows[0][5], "one-way ANOVA: the block's F and p equal the course table's", { block: r && r.rows[0], course: anCourse && anCourse.rows[0] });
  // simple linear regression GPA on Hours_Study
  await clear(page); await menu(page, "Regression", "Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Study"); await run(page); r = await sc(page);
  const coef = r && r.course.find((t) => t.heads.includes("Estimate") || /Coefficients/.test(t.cap));
  ok(r && r.first && r.title === "Simple linear regression results:" && r.lines[0] === "Dependent Variable: GPA" && r.lines[1] === "Independent Variable: Hours_Study" && /^GPA = -?[\d.]+ \+ -?[\d.]+ Hours_Study$/.test(r.lines[2]) && r.lines[3] === "Sample size: 40" && /^R \(correlation coefficient\) = /.test(r.lines[4]) && /^R-sq = /.test(r.lines[5]) && /^Estimate of error standard deviation: /.test(r.lines[6]), "regression: the block first with the equation, n, R, R-sq and the error SD", r && r.lines);
  ok(r && r.res === "Parameter estimates:" && r.heads.join("|") === "Parameter|Estimate|Std. Err.|Alternative|DF|T-Stat|P-value" && r.rows.length === 2 && r.rows[0][0] === "Intercept" && r.rows[1][0] === "Slope" && Number(r.rows[1][4]) === 38, "regression: Parameter estimates with Intercept and Slope rows on 38 df", r && r.rows);
  ok(coef && near(r.rows[1][1], Number(coef.rows[1][1]), 1e-9) && r.rows[1][6] === coef.rows[1][coef.heads.indexOf("p")], "regression: the slope estimate and p equal the course table's", { block: r && r.rows[1], course: coef && coef.rows[1] });
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
