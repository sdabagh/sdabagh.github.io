const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(200); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), text: c.textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL);
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('nav.menu .dd[data-name="Frequencies"] [role=menuitem]')).map((e) => e.textContent.trim()));
  ok(items.includes("One proportion: z test") && items.indexOf("One proportion: z test") < items.indexOf("Two proportions: z test"), "Frequencies menu lists One proportion: z test before Two proportions", items);
  // x = 60, n = 100, p0 = 0.5. R: prop.test(60,100,correct=FALSE): X-squared = 4, p = 0.0455; z = 2, SE0 = 0.05; binom.test p = 0.05689
  await menu(page, "Frequencies", "One proportion: z test");
  ok(await page.evaluate(() => /One proportion, z test/.test(document.querySelector("#dlg").textContent) && !document.querySelector("#f_z")), "dialog is titled as the z test and has no z tick box");
  await page.fill("#f_xs", "60"); await page.fill("#f_n", "100"); await run(page);
  let c = await cardInfo(page);
  ok(c.title.startsWith("One Proportion z Test"), "card title", c.title);
  ok(c.caps[0] === "One proportion z test" && /Exact binomial/.test(c.caps[1]), "z table first, exact binomial second", c.caps);
  const z = c.rows[0][0]; ok(near(z[1], 0.05, 1e-6) && near(z[2], 2, 1e-6) && near(z[3].replace(/[^0-9.]/g, ""), 0.0455, 0.0002) && z[4] === "yes", "SE0 .05, z = 2, p = .0455 (R prop.test correct=FALSE), conditions yes", z);
  ok(near(c.rows[1][0][5].replace(/[^0-9.]/g, ""), 0.05689, 0.0002), "exact binomial p = .0569 (R binom.test)", c.rows[1][0]);
  ok(/n p₀ = 50 and n\(1 minus p₀\) = 50, both at least 10/.test(c.text) && /SE0 = √\(0\.5 × 0\.5 \/ 100\)/.test(c.text), "conditions line and worked numbers present");
  ok(/Reject H0|reject the null|p-value is at or below/i.test(c.text) || /There is evidence/.test(c.text), "decision uses the z p-value (.0455 < .05): evidence", c.text.slice(-400));
  // conditions fail: x = 3, n = 12, p0 = 0.5 -> n p0 = 6
  await menu(page, "Frequencies", "One proportion: z test"); await page.fill("#f_xs", "3"); await page.fill("#f_n", "12"); await run(page); c = await cardInfo(page);
  ok(/Conditions for the z test fail: n p₀ = 6 and n\(1 minus p₀\) = 6/.test(c.text) && c.rows[0][0][4] === "no", "small n: conditions flagged as failing, points to the exact p", c.rows[0][0]);
  // binomial item unchanged: exact table first, z table second
  await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.fill("#f_xs", "60"); await page.fill("#f_n", "100"); await run(page); c = await cardInfo(page);
  ok(c.title.startsWith("Binomial Test") && c.caps[0] === "Binomial Test" && /z test for a proportion/.test(c.caps[1]), "binomial item: exact first, z second, as before", c.caps);
  // Ask routes "z test for a proportion"
  await page.click("#askBtn"); await page.fill("#botIn", "z test for one proportion"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(300);
  const bot = await page.evaluate(() => document.querySelector("#botLog").textContent);
  ok(/One proportion: z test/.test(bot), "Ask names One proportion: z test", bot.slice(-300));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
