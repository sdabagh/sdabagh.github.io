const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function menuRun(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForTimeout(300); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL); await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "Data", "Compute"); await page.fill("#f_nm", "Study_Week"); await page.fill("#f_f", "Hours_Study * 7"); await run(page);
  await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_g", "Pet_Owner"); await run(page);
  await menu(page, "Graph", "Histogram"); await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_facet", "Year"); await page.fill("#f_gtitle", "GPA by year"); await run(page);
  await menu(page, "Advanced", "Count Regression: Poisson and Negative Binomial"); await page.selectOption("#f_y", "Siblings"); await page.selectOption("#f_cs", ["Year"]); await page.fill("#f_refs", "Year = Freshman"); await page.selectOption("#f_fam", "poisson"); await run(page);
  await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xs", "60"); await page.fill("#f_n", "100"); await run(page);
  await menuRun(page, "Results", "Script: every step, with the R code");
  const t = await page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, pre: Array.from(c.querySelectorAll("pre.script")).map((p) => p.textContent), btns: Array.from(c.querySelectorAll("[data-act^=dl-]")).map((b) => b.textContent) }; });
  ok(/^Script: every step/.test(t.title) && t.pre.length === 2 && t.btns.length === 2, "script card with two blocks and two downloads", [t.title, t.btns]);
  const S = t.pre[0], R = t.pre[1];
  const order = ["1. Data › Compute", "2. T-Tests › Independent Samples T-Test", "3. Graph › Histogram (graph)", "4. Advanced › Count Regression", "5. Frequencies › One proportion: z test"];
  ok(order.every((o) => S.includes(o)) && order.map((o) => S.indexOf(o)).every((p, i, a) => i === 0 || p > a[i - 1]), "five steps listed oldest first, analyses and graphs interleaved", S.split("\n").filter((l) => /^\d\./.test(l)));
  ok(/Dependent variable: GPA/.test(S) && /Grouping variable: Pet_Owner/.test(S) && /Graph title: GPA by year/.test(S) && /Small multiples: one panel per level of: Year/.test(S) && /Reference levels[^\n]*: Year = Freshman/.test(S), "choices listed with the dialog's labels", S.slice(0, 600));
  ok(/d <- read\.csv\("https:\/\/learnwithoutwalls\.com\/stats\/data\/STATC1000_Class_Data\.csv"\)/.test(R), "R script reads the sample by its address");
  ok(/d\$Study_Week <- with\(d, Hours_Study \* 7\)/.test(R), "R: compute");
  ok(/t\.test\(GPA ~ Pet_Owner, data = d, var\.equal = FALSE, alternative = "two\.sided"\)/.test(R), "R: Welch t test", R.match(/t\.test[^\n]*/) && R.match(/t\.test[^\n]*/)[0]);
  ok(/ggplot\(d, aes\(x = GPA\)\) \+ geom_histogram\([^\n]*\) \+ labs\(title = "GPA by year"\) \+ facet_wrap\(~ Year\)/.test(R), "R: ggplot with labs and facet_wrap", R.match(/ggplot[^\n]*/) && R.match(/ggplot[^\n]*/)[0]);
  ok(/d\$Year <- relevel\(factor\(d\$Year\), ref = "Freshman"\)/.test(R) && /glm\(Siblings ~ Year, family = poisson, data = d\)/.test(R), "R: relevel and glm poisson");
  ok(/prop\.test\(60, 100, p = 0\.5, correct = FALSE, alternative = "two\.sided"\)/.test(R), "R: prop.test for the z test");
  // the script card itself is not a step: run it again and count
  await menuRun(page, "Results", "Script: every step, with the R code");
  const S2 = await page.evaluate(() => document.querySelector("#out .card pre.script").textContent);
  ok(!/Script: every step/.test(S2.split("\n").slice(3).join("\n")) && S2.split("\n").filter((l) => /^\d\./.test(l)).length === 5, "the script card is not listed as a step");
  // Ask routes
  await page.click("#askBtn"); await page.fill("#botIn", "show me the R code for what I did"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(150);
  ok(/Script: every step on the page/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask routes 'R code'");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
