const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(100); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent), before); }
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1300, height: 900 } }); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  ok(await page.evaluate(() => !document.querySelector("#bot").classList.contains("open") && document.querySelector("#askBtn").textContent === "Ask"), "panel closed at start");
  await page.click("#askBtn"); ok(await page.evaluate(() => document.querySelector("#bot").classList.contains("open") && document.activeElement.id === "botIn" && document.querySelectorAll("#botLog .bchips button").length === 6), "Ask opens with the input focused and example chips");
  let a = await ask(page, "compare two groups"); ok(/independent-samples t test/i.test(a[0]) && /Welch/.test(a[0]), "'compare two groups' names Welch's t", a[0].slice(0, 80));
  ok(await page.evaluate(() => Array.from(document.querySelectorAll("#botLog .bgo button")).some((x) => /Open Independent Samples T-Test/.test(x.textContent)) && !!document.querySelector('#botLog a[href^="methods.html#two"]')), "answer offers an Open button and a guide link");
  a = await ask(page, "what columns do I have"); ok(/No data is loaded yet/.test(a[0]), "no data: says so");
  a = await ask(page, "xyzzy plugh"); ok(/did not catch that/.test(a[0]) && (await page.evaluate(() => document.querySelectorAll("#botLog .bchips button").length)) >= 12, "nonsense gets the fallback with chips");
  // chip click asks; Open button runs the dialog and closes the panel
  const nb = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.click('#botLog [data-bask="before and after"]'); await page.waitForTimeout(100);
  ok(/paired t test/i.test(await page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent)[0], nb)), "a chip asks the question");
  await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 40);
  await page.click("#askBtn"); if (!(await page.evaluate(() => document.querySelector("#bot").classList.contains("open")))) await page.click("#askBtn");
  a = await ask(page, "what columns do I have"); ok(/40 rows\. Numeric: .*GPA/.test(a[0]) && /Categorical: .*Year/.test(a[0]), "with data: lists columns by type", a[0].slice(0, 90));
  await ask(page, "compare two groups"); await page.click('#botLog [data-brun="T-Tests|Independent Samples T-Test"]'); await page.waitForSelector("#dlg.open");
  ok(await page.evaluate(() => /Independent Samples T-Test/.test(document.querySelector("#dlgTitle").textContent) && !document.querySelector("#bot").classList.contains("open")), "Open button runs the dialog and closes the panel");
  await page.click("#dlgCancel");
  // a tip from a card's warning: goodness of fit with expected counts under 5
  await menu(page, "Frequencies", "N Outcomes: chi-square Goodness of fit"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_counts", "A: 2\nB: 3\nC: 4"); await run(page); await page.waitForTimeout(100);
  ok(await page.evaluate(() => /Ask · 1 tip/.test(document.querySelector("#askBtn").textContent) && /expected count is under 5/.test((document.querySelector("#botLog .bmsg.tip") || {}).textContent || "")), "a small expected count produces a tip and a badge", await page.textContent("#askBtn"));
  await page.click("#askBtn"); ok(await page.evaluate(() => document.querySelector("#askBtn").textContent === "Ask"), "opening the panel clears the badge");
  await page.keyboard.press("Escape"); ok(await page.evaluate(() => !document.querySelector("#bot").classList.contains("open") && document.activeElement.id === "askBtn"), "Escape closes the panel and returns focus to the button");
  ok(errs.length === 0, "no page errors", errs);
  await page.click("#askBtn"); await ask(page, "my counts are small"); await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/ask.png", clip: { x: 850, y: 300, width: 450, height: 600 } });
  await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
