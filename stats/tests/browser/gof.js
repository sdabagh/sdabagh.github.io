const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(200); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), text: c.textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], dialogs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  // from counts, equally likely (default): 11,15,9,5 -> n=40, E=10 each, chi = 0.1+2.5+0.1+2.5 = 5.2, df 3, p = 0.1577
  await menu(page, "Frequencies", "N Outcomes: chi-square Goodness of fit");
  ok(await page.evaluate(() => document.querySelector("#f_expected").value === "equal" && document.querySelector("#f_props").closest(".fld").style.display === "none"), "Equally likely is the default and the proportions box is hidden");
  await page.fill("#f_counts", "Freshman: 11\nSophomore: 15\nJunior: 9\nSenior: 5"); await run(page);
  let c = await cardInfo(page);
  ok(near(c.rows[1][0][0], 5.2, 0.001) && c.rows[1][0][1] === "3" && near(c.rows[1][0][2].replace(/[^0-9.]/g, ""), 0.1577, 0.001) && c.rows[0].every((r) => near(r[2], 10, 1e-9)), "equal: chi-square 5.2 on 3 df, p .158, E = 10 each", c.rows[1][0]);
  ok(/each expected proportion is 1 \/ 4 = 0\.25/.test(c.text) && /all 4 levels are equally likely/.test(c.text), "card says the equally likely null was used");
  // custom, blank -> error, no card
  await menu(page, "Frequencies", "N Outcomes: chi-square Goodness of fit"); await page.selectOption("#f_expected", "custom");
  ok(await page.evaluate(() => document.querySelector("#f_props").closest(".fld").style.display !== "none"), "choosing custom reveals the proportions box");
  await page.fill("#f_counts", "Freshman: 11\nSophomore: 15\nJunior: 9\nSenior: 5"); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === 1 && /Type the expected proportions/.test(dialogs[0]), "blank custom proportions is refused with a message", dialogs);
  // custom proportions 0.3,0.25,0.15,0.3 on sorted keys Freshman, Junior, Senior, Sophomore -> E = 12,10,6,12 ; O = 11,9,5,15
  await page.fill("#f_props", "0.30, 0.25, 0.15, 0.30"); await run(page); c = await cardInfo(page);
  const chi = (1 / 12) + (25 / 10) + (9 / 6) + (49 / 12); // typed order: E = 12, 10, 6, 12 for O = 11, 15, 9, 5
  ok(near(c.rows[1][0][0], chi, 0.001) && /the population follows the stated proportions/.test(c.text), "custom proportions used: chi-square " + chi.toFixed(4), c.rows[1][0]);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
