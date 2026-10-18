const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(500); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), plots: Array.from(c.querySelectorAll(".plot")).map((p) => (p._fullLayout.title && p._fullLayout.title.text) || ""), text: c.textContent, apa: (c.querySelector(".apa code") || {}).textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL); await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "Advanced", "Logistic Regression");
  ok(await page.evaluate(() => { const d = document.querySelector('#dlgForm details.more[data-group="Diagnostics"]'); return !!d && document.getElementById("f_roc").checked && document.getElementById("f_cal").checked && !document.getElementById("f_dres").checked && document.getElementById("f_cls").value === "0.5"; }), "Diagnostics folded, ROC and calibration on by default, cutoff 0.5");
  await page.selectOption("#f_y", "Pet_Owner"); await page.fill("#f_succ", "Yes"); await page.selectOption("#f_xs", ["Hours_Study", "Hours_Sleep"]); await page.check("#f_dres"); await run(page);
  const c = await cardInfo(page);
  ok(c.caps.some((q) => /Pseudo R² and discrimination/.test(q)) && c.caps.some((q) => /^Classification: predicted Yes/.test(q)) && c.caps.some((q) => /Calibration by decile/.test(q)) && c.caps.some((q) => /Hosmer-Lemeshow goodness of fit/.test(q)), "tables: pseudo R2 with AUC, classification, calibration deciles, Hosmer-Lemeshow", c.caps);
  const r2 = c.rows[1][0]; ok(r2.length === 7 && Number(r2[4]) > 0.5 && Number(r2[4]) < 1 && Number(r2[5]) <= Number(r2[4]) && Number(r2[6]) >= Number(r2[4]), "AUC between 0.5 and 1 with an interval around it", r2);
  const cls = c.rows[3]; ok(cls.length === 2 && /^chosen/.test(cls[0][0]) && /^Youden/.test(cls[1][0]) && Number(cls[0][2]) + Number(cls[0][3]) + Number(cls[0][4]) + Number(cls[0][5]) === 40, "classification rows at the chosen and Youden cuts add to n", cls.map((r) => r.slice(0, 6)));
  const hl = c.rows.find((t) => t.length === 1 && t[0].length === 3 && /^[0-9.]+$/.test(t[0][1])); ok(hl && hl[0][1] === "8", "Hosmer-Lemeshow on 8 df (10 deciles)", hl && hl[0]);
  ok(/Events per predictor: 8\.5/.test(c.text) && /below the working minimum of 10/.test(c.text), "events per predictor 17/2 = 8.5 flagged");
  ok(c.plots.length === 4 && /ROC curve/.test(c.plots[0]) && /Calibration/.test(c.plots[1]) && /Deviance residuals/.test(c.plots[2]) && /Predicted probability/.test(c.plots[3]), "four graphs: ROC, calibration, deviance residuals, histogram", c.plots);
  ok(/Nagelkerke R² = \./.test(c.apa || "") && /AUC = \.\d\d, 95% CI \[/.test(c.apa || "") && /Hosmer-Lemeshow χ²\(8\)/.test(c.apa || ""), "APA line carries Nagelkerke, AUC with CI, Hosmer-Lemeshow", c.apa);
  // script view carries the R diagnostics
  await page.click(`nav.menu .dd[data-name="Results"] .top`); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(300);
  const R = await page.evaluate(() => document.querySelectorAll("#out .card pre.script")[1].textContent);
  ok(/pROC::roc\(fit\$y, fitted\(fit\)\)/.test(R) && /hoslem\.test\(fit\$y, fitted\(fit\), g = 10\)/.test(R) && /PseudoR2/.test(R) && /residuals\(fit, type = "deviance"\)/.test(R), "R script: pROC, hoslem.test, PseudoR2, deviance residuals");
  // Ask
  await page.click("#askBtn"); await page.fill("#botIn", "what is AUC?"); await page.press("#botIn", "Enter"); await page.waitForTimeout(150);
  ok(/Judging a logistic model/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask explains AUC and calibration");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
