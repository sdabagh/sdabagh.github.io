// Messy files, as spreadsheets export them: semicolon delimiters with decimal commas, pipes, a BOM and CRLF, quoted commas
// and newlines, currency and percent and thousands separators, NA tokens, duplicate column names, hex that is not a number.
// Each tidy-up is named on an "Opened" card; a sample dataset gets no such card.
const { chromium } = require("playwright"); const path = require("path");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const DATA = path.join(__dirname, "data", "messy");
async function open(page, f) { const before = await page.evaluate(() => document.querySelector("#dsinfo").textContent + "|" + document.querySelector("#dsname").textContent); await page.setInputFiles("#fileInput", path.join(DATA, f)); await page.waitForFunction((b) => document.querySelector("#dsinfo").textContent + "|" + document.querySelector("#dsname").textContent !== b, before, { timeout: 10000 }); await page.waitForTimeout(150); }
const grid = (page) => page.evaluate(() => { const cols = Array.from(document.querySelectorAll("table.grid thead th[data-col]")).map((t) => t.dataset.col); const types = cols.map((c) => ((document.querySelector(`small.ty[data-col="${CSS.escape(c)}"]`) || {}).textContent || "").replace(/\s*▾$/, "")); const rows = Array.from(document.querySelectorAll("table.grid tbody tr")).map((tr) => Array.from(tr.querySelectorAll("td[data-i]")).map((td) => td.textContent)); const c = document.querySelector("#out .card"); return { cols, types, rows, card: c ? { title: c.querySelector("h2").textContent, text: c.textContent } : null }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL);
  await open(page, "semicolon_eu.csv"); let g = await grid(page);
  ok(g.cols.join("|") === "name|score|group" && g.rows[0].join("|") === "Ana|85.5|A" && g.rows[2].join("|") === "Cy||A" && /continuous/.test(g.types[1]), "semicolon file with decimal commas: three columns, 85,5 is 85.5, continuous", { cols: g.cols, rows: g.rows, types: g.types });
  ok(g.card && /^Opened semicolon_eu/.test(g.card.title) && /score: decimal commas became decimal points/.test(g.card.text), "an Opened card names the decimal-comma change", g.card && g.card.text.slice(0, 200));
  await open(page, "currency.csv"); g = await grid(page);
  ok(g.rows[0].join("|") === "85|1200|45|2024-01-05" && g.rows[1].join("|") === "90|950|50|2024-02-10", "currency, thousands and percent stripped to numbers", g.rows);
  ok(/amount: \$ and thousands separators removed/.test(g.card.text) && /pct: % \(45% is kept as 45\) removed/.test(g.card.text) && !/score:/.test(g.card.text) && !/date:/.test(g.card.text), "the card names amount and pct only", g.card.text.slice(0, 300));
  ok(g.types[1] !== "nominal" && g.types[2] !== "nominal" && g.types[3] === "nominal", "amount and pct are numeric, date stays nominal", g.types);
  await open(page, "na_values.csv"); g = await grid(page);
  ok(g.types[0] !== "nominal" && g.rows.map((r) => r[0]).join("|") === "85|NA|n/a|-||90", "NA, n/a and - leave the column numeric and stay in the cells", { types: g.types, col: g.rows.map((r) => r[0]) });
  ok(!(g.card && /^Opened na_values/.test(g.card.title)), "no Opened card when nothing was changed", g.card && g.card.title);
  await open(page, "dupcols.csv"); g = await grid(page);
  ok(g.cols.join("|") === "score|score_2|group" && /"score" appeared twice, so the second is "score_2"/.test(g.card.text), "a duplicate column name becomes score_2 and the card says so", { cols: g.cols });
  await open(page, "scientific.csv"); g = await grid(page);
  ok(g.types[0] === "nominal" && g.rows[2][0] === "0x10", "a hex code keeps the column as text; 1e3 and 2.5E-1 untouched", { types: g.types, rows: g.rows });
  await open(page, "bom_crlf.csv"); g = await grid(page);
  ok(g.cols[0] === "name" && g.rows.length === 2 && g.rows[1].join("|") === "Bo|90|B", "BOM and CRLF: clean header, two rows", { cols: g.cols, rows: g.rows });
  await open(page, "pipes.csv"); g = await grid(page);
  ok(g.cols.join("|") === "name|score|group" && g.rows[0][1] === "85", "pipe-separated file splits on pipes", g.cols);
  await open(page, "quotes.csv"); g = await grid(page);
  ok(g.rows[0][0] === "Lee, Ann" && g.rows[0][2] === 'said "hi"' && /two\nlines/.test(g.rows[1][2]), "quoted commas, doubled quotes and a newline inside quotes survive", g.rows);
  // paste: tab separated, with a thousands separator
  await page.click('nav.menu .dd[data-name="Data"] .top'); await page.getByRole("menuitem", { name: "Paste data", exact: true }).click(); await page.waitForSelector("#dlg.open");
  await page.fill("#f_txt", "city\tpop\nLima\t1,200\nQuito\t950\n"); await page.fill("#f_nm", "pasted"); await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(200); g = await grid(page);
  ok(g.cols.join("|") === "city|pop" && g.rows[0][1] === "1200" && /pop: thousands separators removed/.test(g.card.text), "pasted tab-separated data: two columns, 1,200 is 1200, card says so", { cols: g.cols, rows: g.rows });
  // a sample dataset: no Opened card
  await page.evaluate(() => document.querySelector("#out").innerHTML = "");
  await page.click('nav.menu .dd[data-name="Data"] .top'); await page.getByRole("menuitem", { name: "Sample datasets", exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(400);
  ok(await page.evaluate(() => document.querySelectorAll("#out .card").length === 0 && /40 rows/.test(document.querySelector("#dsinfo").textContent)), "a sample dataset loads without an Opened card");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
