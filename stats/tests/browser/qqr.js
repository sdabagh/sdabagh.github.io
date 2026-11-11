// The QQ Plot card prints the QQ correlation r (R's cor(qqnorm(x)$x, qqnorm(x)$y)) on each plot, top left, and in the card
// text with n, one per group when Group by is used; the text says to compare r with the critical value in the QQ critical r
// table. Reference values: push-ups week 12, all 60: 0.992; by sex: F (15) 0.962, M (45) 0.991.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(600); }
const read = (page) => page.evaluate(() => { const c = document.querySelector("#outG .card"); return { says: Array.from(c.querySelectorAll(".say")).map((s) => s.textContent), plots: c.querySelectorAll(".plot").length, ann: Array.from(c.querySelectorAll(".plot .annotation-text")).map((a) => a.textContent), titles: Array.from(c.querySelectorAll(".plot .gtitle")).map((t) => t.textContent) }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_academy_fitness.csv"); await run(page);
  await menu(page, "Graph", "QQ Plot"); await page.selectOption("#f_x", "pushups_week12"); await run(page);
  let r = await read(page); let line = r.says.find((s) => /QQ correlation/.test(s)) || "";
  ok(r.plots === 1 && r.ann.length === 1 && r.ann[0] === "r = 0.992", "one plot, r = 0.992 printed on it", r.ann);
  ok(/QQ correlation r = 0\.992 \(n = 60\)/.test(line) && /critical value for n in the QQ critical r table/.test(line) && /below the critical value suggests the data are not normal/.test(line), "the card text gives r with n and says to compare it with the critical r table", line);
  // by sex: one r per group, on each plot and in the text
  await page.evaluate(() => (document.querySelector("#outG").innerHTML = ""));
  await menu(page, "Graph", "QQ Plot"); await page.selectOption("#f_x", "pushups_week12"); await page.selectOption("#f_by", "sex"); await run(page);
  r = await read(page); line = r.says.find((s) => /QQ correlation/.test(s)) || "";
  ok(r.plots === 2 && r.ann.join("|") === "r = 0.962|r = 0.991", "two plots, r = 0.962 (F) and 0.991 (M) printed on them", { ann: r.ann, titles: r.titles });
  ok(/r = 0\.962 \(F, n = 15\); r = 0\.991 \(M, n = 45\)/.test(line), "the card text lists r per group with n", line);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
