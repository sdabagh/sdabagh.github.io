const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.press("#botIn", "Enter"); await page.waitForTimeout(150); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent), before); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } }); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL); await page.click("#askBtn");
  const cases = [["befor and after", /I read that as "before and after"/, /paired t test/i], ["annova", /I read that as "anova"/, /one-way ANOVA/], ["corelation", /I read that as "correlation"/, /correlation/i], ["logisitc regresion", /I read that as "logistic regression"/, /logistic regression/i], ["what is a p-valeu", /I read that as "what is a p-value"/, /^The p-value/]];
  for (const [q, note, body] of cases) { const a = await ask(page, q); ok(note.test(a[0] || "") && body.test(a.slice(1).join(" ")), `"${q}" is read right and answered`, a.map((s) => s.slice(0, 60))); }
  const a = await ask(page, "before and after"); ok(!/I read that as/.test(a.join(" ")), "a correct question gets no correction note");
  const b = await ask(page, "xyzzy plugh"); ok(/did not catch that/.test(b[0]), "nonsense still gets the fallback, no false correction", (b[0] || "").slice(0, 60));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
