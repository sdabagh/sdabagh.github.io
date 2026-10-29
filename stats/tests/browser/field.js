// The field setting puts an example sentence from that field under the first box of the main test dialogs (none in the
// general field), and Ask understands the phrasing a nurse or a clinician uses: an infection rate, time until
// readmission, before and after the intervention, the risk of the outcome.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
async function cancel(page) { await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open); }
const hints = (page) => page.evaluate(() => Array.from(document.querySelectorAll("#dlgForm .hint")).map((h) => h.textContent));
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForFunction((n) => document.querySelectorAll("#botLog .bmsg").length > n + 1, before, { timeout: 5000 }); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent), before); }
async function setField(page, field) { await page.click("#modeBtn"); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_field", field); await run(page); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page);
  // general field: no example hint
  await menu(page, "T-Tests", "Independent Samples T-Test"); let h = await hints(page);
  ok(!h.some((x) => /^Example in/.test(x)), "general field: no example sentence in the dialog", h);
  await cancel(page);
  // health and nursing: an example under the first box of each main dialog
  await setField(page, "health");
  const cases = [["T-Tests", "Independent Samples T-Test", /length of stay/], ["T-Tests", "Paired Samples T-Test", /same patients before and after/], ["Frequencies", "Two proportions: z test", /infection rate/], ["Frequencies", "Contingency Tables: Independent Samples", /Odds ratio and relative risk/], ["Frequencies", "One proportion: z test", /readmission rate/], ["ANOVA", "One-Way ANOVA", /pain score/], ["Advanced", "Logistic Regression", /fall or a readmission/], ["Advanced", "Survival Analysis: Kaplan-Meier, log-rank, Cox", /time until readmission/]];
  for (const [m, l, re] of cases) { await menu(page, m, l); h = await hints(page); const ex = h.find((x) => /^Example in health and nursing:/.test(x)); ok(ex && re.test(ex), `${l}: example in health and nursing`, ex || h); await cancel(page); }
  // another field gives its own example; the hint is the first hint, under the first box
  await setField(page, "business"); await menu(page, "T-Tests", "Independent Samples T-Test"); h = await hints(page);
  ok(h[0] && /^Example in business and finance: did the mean sale differ/.test(h[0]), "business field: its own example, under the first box", h[0]); await cancel(page);
  await setField(page, "health");
  // Ask: nursing phrasing
  await page.click("#askBtn");
  const q = [
    ["did the infection rate drop after the new hand-hygiene protocol", /^Did a rate differ between two groups or two periods/, "Open Two proportions: z test"],
    ["how long until patients are readmitted", /^Time to an event/, "Open Survival Analysis: Kaplan-Meier, log-rank, Cox"],
    ["pain scores before and after the intervention", /^The same people measured twice/, "Open Paired Samples T-Test"],
    ["what is the risk of the outcome in the exposed group", /^Risk in two groups: relative risk and odds ratio/, "Open Contingency Tables: Independent Samples"],
    ["length of stay for the intervention group versus usual care", /^Two different groups, a number/, "Open Independent Samples T-Test"],
    ["relative risk or odds ratio?", /^Relative risk and the odds ratio/, null],
  ];
  for (const [question, title, btn] of q) {
    const a = await ask(page, question); const t = a.join(" | ");
    const hasBtn = !btn || (await page.evaluate((b) => Array.from(document.querySelectorAll("#botLog .bmsg button")).some((x) => x.textContent === b), btn));
    ok(title.test(a[0] || "") && hasBtn, `Ask: "${question}"`, (a[0] || "").slice(0, 90));
  }
  // the older routes still win their own questions
  let a = await ask(page, "compare two groups"); ok(/^Two different groups, a number/.test(a[0] || ""), "Ask: 'compare two groups' still the independent t", (a[0] || "").slice(0, 60));
  a = await ask(page, "predict a count of incidents per month"); ok(/^Predict a count of events/.test(a[0] || ""), "Ask: a count question still goes to count regression", (a[0] || "").slice(0, 60));
  await setField(page, "general");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
