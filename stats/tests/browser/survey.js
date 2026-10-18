const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(400); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), text: c.textContent, apa: (c.querySelector(".apa code") || {}).textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL);
  // stratified sample: stratum a (N = 100, n = 3), stratum b (N = 300, n = 4); weights N_h / n_h; a yes/no column too
  await menu(page, "Data", "Paste data"); await page.fill("#f_txt", "stratum,wt,score,agree\na,33.3333333333,10,yes\na,33.3333333333,12,no\na,33.3333333333,15,yes\nb,75,30,yes\nb,75,35,yes\nb,75,31,no\nb,75,40,yes"); await run(page);
  await menu(page, "Advanced", "Survey estimates with weights (design-based)"); await page.selectOption("#f_vars", ["score"]); await page.selectOption("#f_cats", ["agree"]); await page.selectOption("#f_w", "wt"); await page.selectOption("#f_strata", "stratum"); await run(page);
  const c = await cardInfo(page);
  const sd = (a) => { const m = a.reduce((s, q) => s + q, 0) / a.length; return Math.sqrt(a.reduce((s, q) => s + (q - m) ** 2, 0) / (a.length - 1)); };
  const ybar = (100 * (37 / 3) + 300 * 34) / 400, v = (100 / 400) ** 2 * sd([10, 12, 15]) ** 2 / 3 + (300 / 400) ** 2 * sd([30, 35, 31, 40]) ** 2 / 4;
  const m = c.rows[0][0]; ok(/Survey Estimates/.test(c.title) && m[0] === "score" && m[1] === "7" && near(m[2], ybar, 1e-3) && near(m[3], Math.sqrt(v), 1e-3), "weighted mean and design SE equal the textbook stratified values", [m.slice(0, 4), ybar, Math.sqrt(v)]);
  ok(near(m[6], (10 + 12 + 15 + 30 + 35 + 31 + 40) / 7, 1e-3), "unweighted mean shown beside it", m[6]);
  const pyes = c.rows[1].find((r) => r[0] === "agree = yes"); const pw = (100 * (2 / 3) + 300 * 0.75) / 400;
  ok(pyes && near(pyes[2], pw, 1e-3) && Number(pyes[3]) > 0 && near(pyes[6], 5 / 7, 1e-3), "weighted proportion of yes with the unweighted one", pyes);
  ok(c.rows[2][0][1] === "400" && c.rows[2][0][2] === "2" && /none/.test(c.rows[2][0][3]), "design table: population 400, 2 strata, no clusters", c.rows[2][0]);
  ok(/design effect/.test(c.apa || "") && /weighted M = 28\.58/.test(c.apa || ""), "APA line", c.apa);
  // script view
  await page.click(`nav.menu .dd[data-name="Results"] .top`); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(300);
  const R = await page.evaluate(() => document.querySelectorAll("#out .card pre.script")[1].textContent);
  ok(/svydesign\(ids = ~1, strata = ~stratum, weights = ~wt, data = d\)/.test(R) && /svymean\(~score, dsn, deff = TRUE\)/.test(R) && /svymean\(~factor\(agree\), dsn/.test(R), "R script writes svydesign and svymean", R.match(/svydesign[^\n]*/) && R.match(/svydesign[^\n]*/)[0]);
  await page.click("#askBtn"); await page.fill("#botIn", "my survey has sampling weights"); await page.press("#botIn", "Enter"); await page.waitForTimeout(150);
  ok(/Survey weights/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask routes survey weights");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
