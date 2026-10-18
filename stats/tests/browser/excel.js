const { chromium } = require("playwright"); const path = require("path");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const grid = (page) => page.evaluate(() => ({ cols: Array.from(document.querySelectorAll("table.grid thead th[data-col]")).map((t) => t.dataset.col), rows: Array.from(document.querySelectorAll("table.grid tbody tr")).map((tr) => Array.from(tr.querySelectorAll("td[data-j]")).map((td) => td.textContent)), name: document.querySelector("#dsname").textContent }));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } }); const errs = [], alerts = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { alerts.push(d.message()); await d.accept(); });
  await page.goto(URL);
  ok(await page.evaluate(() => document.getElementById("fileInput").accept.includes(".xlsx") && !!Array.from(document.querySelectorAll('nav.menu .dd[data-name="Data"] [role=menuitem]')).find((e) => e.textContent.trim() === "Open CSV or Excel file")), "file input accepts .xlsx; menu item renamed");
  // a workbook written the way Excel writes it: shared strings (one rich text), a cached formula, a date style, a formula string, a boolean, a blank
  await page.setInputFiles("#fileInput", path.join(__dirname, "data", "excel_style.xlsx")); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 3, null, { timeout: 10000 }); await page.waitForTimeout(200);
  let g = await grid(page);
  ok(g.cols.join(",") === "city,temp,when" && g.rows[0].join("|") === "Los Angeles|71.6|2026-01-09" && g.rows[1].join("|") === "Santa Monica|143.2|2026-01-10 12:00" && g.rows[2].join("|") === "Malibu|TRUE|", "shared and rich strings, cached formula value, date serials, formula string, boolean, blank", g.rows);
  ok(/excel_style/.test(g.name), "table named after the file", g.name);
  ok(await page.evaluate(() => /Read in the browser; nothing was uploaded/.test(document.querySelector("#out .card").textContent)), "a note card says the file stayed on the computer");
  // openpyxl workbook with two sheets: the picker appears; inline strings, dates, booleans, a formula without a cached value
  await page.setInputFiles("#fileInput", path.join(__dirname, "data", "scores.xlsx")); await page.waitForSelector("#dlg.open", { timeout: 10000 });
  const opts = await page.evaluate(() => Array.from(document.querySelector("#f_sheet").options).map((o) => o.textContent));
  ok(opts.length === 2 && /Scores \(4 rows, 5 columns\)/.test(opts[0]) && /Notes \(2 rows, 2 columns\)/.test(opts[1]), "sheet picker lists both sheets with sizes", opts);
  await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(300); g = await grid(page);
  ok(g.cols.join(",") === "name,score,date,passed,note" && g.rows[0].join("|") === "Ana|87.5|2026-01-15|TRUE|first row" && g.rows[1][3] === "FALSE" && g.rows[2][0] === "Cy, Jr." && g.rows[2][2] === "2026-03-03 14:30" && g.rows[2][4] === 'has a comma, and "quotes"' && g.rows[3][0] === "mean" && g.rows[3][1] === "", "inline strings, dates and datetimes, booleans, commas and quotes, a formula with no cached value", g.rows);
  ok(/scores \(Scores\)/.test(g.name), "name carries the sheet", g.name);
  // a single-sheet workbook opens straight away
  await page.setInputFiles("#fileInput", path.join(__dirname, "data", "one_sheet.xlsx")); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 2, null, { timeout: 10000 }); g = await grid(page);
  ok(g.cols.join(",") === "a,b" && g.rows[1].join("|") === "2|y" && !(await page.evaluate(() => document.querySelector("#dlg").open)), "one sheet: no picker", g.rows);
  // CSV still works
  await page.setInputFiles("#fileInput", { name: "tiny.csv", mimeType: "text/csv", buffer: Buffer.from("p,q\n1,2\n3,4\n") }); await page.waitForFunction(() => document.querySelector("#dsname").textContent.includes("tiny"), null, { timeout: 10000 }); g = await grid(page);
  ok(g.cols.join(",") === "p,q" && g.rows.length === 2, "CSV path unchanged");
  ok(alerts.length === 0 && errs.length === 0, "no alerts, no page errors", [alerts, errs]);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
