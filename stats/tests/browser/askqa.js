const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(100); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent), before); }
const first = (a) => (a[0] || "").slice(0, 120);
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1300, height: 900 } }); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL); await page.click("#askBtn");
  ok(await page.evaluate(() => document.querySelectorAll("#botLog .bchips button").length === 6 && Array.from(document.querySelectorAll("#botLog .bchips button")).some((x) => x.textContent === "what is a p-value")), "opener has six chips including a question");
  const cases = [
    ["what is a p-value?", /^The p-value/, /probability of getting a result at least as far/, "See it: What a p-value is"],
    ["what does standard error mean", /^Standard error/, /s\/√n/, null],
    ["SE or SD?", /^Standard error/, /SD describes the people/, null],
    ["when do I use t instead of z", /^t or z/, /σ is known/, "Open One Sample T-Test"],
    ["what is an odds ratio", /^Odds, log odds/, /exp\(b\) is an odds ratio/, "Open Logistic Regression"],
    ["what is the ICC", /^Fixed effects, random effects and the ICC/, /share of the total variance/, null],
    ["why is my df 22.8 and not a whole number", /^Fractional degrees of freedom/, /Satterthwaite/, null],
    ["what is overdispersion", /^Rate ratios, overdispersion/, /variance = mean/, null],
    ["mean or median?", /^Mean, median, mode/, /skewed data/, "See it: Mean versus median (click to add values)"],
    ["correlation is not causation", /^Correlation and causation/, /randomized experiment/, null],
    ["what is an interaction", /^Interactions \(moderation\)/, /depends on the level of another/, "Open Two-Way ANOVA"],
    ["difference between type 1 and type 2 error", /^Type I and Type II errors/, /power = 1 − β/, null],
    ["is my data private", /^About Stats Without Walls/, /nothing you type or load is sent anywhere/, null],
    ["what is reml", /^ML and REML/, /n − 1 instead of n/, null],
    ["how do I read the card", /^How to read a result card/, /APA line/, null],
  ];
  for (const [q, title, body, btn] of cases) {
    const a = await ask(page, q); const t = a[0] || "";
    ok(title.test(t) && body.test(t), `Q: ${q}`, first(a));
    if (btn) ok(await page.evaluate((lab) => Array.from(document.querySelectorAll("#botLog .bmsg:last-of-type button, #botLog .bmsg button")).slice(-12).some((x) => x.textContent === lab), btn), `  offers "${btn}"`);
  }
  // a request (not a question) still gets the method first; a bare term gets the method plus plain words
  let a = await ask(page, "compare two groups"); ok(/independent-samples t test/i.test(a[0]), "a request still routes first", first(a));
  a = await ask(page, "what test compares two groups?"); ok(/independent-samples t test/i.test(a.join(" ")), "a question with no glossary hit still routes", first(a));
  // explain my result: before and after a card
  a = await ask(page, "explain my result"); ok(/No result yet/.test(a[0]), "explain with no card: says so", first(a));
  await page.click("#botClose"); await menu(page, "Frequencies", "One proportion: z test"); await page.fill("#f_xs", "60"); await page.fill("#f_n", "100"); await run(page);
  await page.click("#askBtn"); a = await ask(page, "what does this mean?");
  ok(/One Proportion z Test, in plain words/.test(a[0]) && /In one line:/.test(a[0]) && /reject H₀/.test(a[0]) && /evidence against H₀/.test(a[0]) && /does not say how big/.test(a[0]), "explain reads the card: title, APA line, conclusion, p-value note", first(a));
  a = await ask(page, "is it significant"); ok(/One Proportion z Test, in plain words/.test(a[0]), "'is it significant' reads the card too");
  // question about a term with no entry falls back with the glossary pointer
  a = await ask(page, "what is a flurbo?"); ok(/did not catch that/.test(a[0]) && /glossary/.test(a[0]), "unknown question: fallback mentions the glossary", first(a));
  ok(errs.length === 0, "no page errors", errs);
  await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
