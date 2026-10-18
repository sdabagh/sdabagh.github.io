// A big file: 20,000 rows load in well under the twenty-five seconds they used to take, the table shows its first 300
// rows and pages the rest on scroll, on the button and under the keyboard, edits in a later page reach the data, and an
// analysis that reads columns per row (the independent t-test) finishes in under three seconds instead of minutes.
const { chromium } = require("playwright");
const fs = require("fs"), os = require("os"), path = require("path");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(150); }
(async () => {
  // a deterministic 20,000-row file
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const lines = ["id,group,score,hours,major"]; for (let i = 0; i < 20000; i++) lines.push([i, "ABC"[Math.floor(rnd() * 3)], (60 + rnd() * 30).toFixed(1), (rnd() * 40).toFixed(1), ["Math", "Bio", "Nursing"][Math.floor(rnd() * 3)]].join(","));
  const file = path.join(os.tmpdir(), "sww-big-" + process.pid + ".csv"); fs.writeFileSync(file, lines.join("\n"));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL);
  let t = Date.now(); await page.setInputFiles("#fileInput", file);
  await page.waitForFunction(() => /20000 rows/.test(document.querySelector("#dsinfo").textContent), null, { timeout: 60000 }); const loadMs = Date.now() - t;
  ok(loadMs < 5000, "20,000 rows load in under 5 s", loadMs);
  const g1 = await page.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, note: (document.querySelector("#gridMore span") || {}).textContent, btn: (document.querySelector("#gridMoreBtn") || {}).textContent }));
  ok(g1.rows === 300 && /Showing the first 300 of 20,000 rows/.test(g1.note) && /uses all 20,000/.test(g1.note) && g1.btn === "Show 2,000 more rows", "table shows 300 rows with the paging note and button", g1);
  // scrolling to the bottom pages more rows in
  await page.evaluate(() => { const g = document.querySelector("#grid"); g.scrollTop = g.scrollHeight; }); await page.waitForTimeout(500);
  const g2 = await page.evaluate(() => document.querySelectorAll("table.grid tbody tr").length);
  ok(g2 > 300 && g2 <= 1200, "scrolling to the end adds a page of rows", g2);
  // the button adds 2,000 and moves focus to the first new row
  await page.click("#gridMoreBtn"); await page.waitForTimeout(200);
  const g3 = await page.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.i : null }));
  ok(g3.rows === g2 + 2000 && Number(g3.focus) === g2, "button adds 2,000 rows and focuses the first new cell", g3);
  // keyboard: from the last rendered row, ArrowDown renders the next one and moves there
  await page.evaluate((n) => { const td = document.querySelector(`td[data-i="${n - 1}"][data-j="0"]`); td.setAttribute("tabindex", "0"); td.focus(); }, g3.rows);
  await page.keyboard.press("ArrowDown"); await page.waitForTimeout(100);
  const g4 = await page.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, focus: document.activeElement.dataset.i }));
  ok(g4.rows > g3.rows && Number(g4.focus) === g3.rows, "ArrowDown past the last rendered row renders more and moves there", g4);
  // editing a cell on a later page reaches the data (and the remembered copy)
  await page.evaluate(() => { const td = document.querySelector('td[data-i="400"][data-j="2"]'); td.focus(); td.textContent = "99.5"; td.blur(); }); await page.waitForTimeout(200);
  const edited = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("sww_data") || "null"); return s && s.rows[400][2]; });
  ok(edited === "99.5", "an edit on row 401 is in the data", edited);
  // the t-test reads two columns for every row: seconds, not minutes
  t = Date.now(); await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "score"); await page.selectOption("#f_g", "group"); await page.fill("#f_lv", "A, B"); await run(page); const tMs = Date.now() - t;
  const card = await page.evaluate(() => { const c = document.querySelector("#out .card"); return c ? c.querySelector("h2").textContent : null; });
  ok(card === "Independent Samples T-Test" && tMs < 3000, "independent t-test on 20,000 rows in under 3 s", { card, tMs });
  // a filter re-renders the first page with the kept count
  t = Date.now(); await page.fill("#filterBox", 'group == "A"'); await page.press("#filterBox", "Enter"); await page.waitForFunction(() => /filter keeps/.test(document.querySelector("#dsinfo").textContent), null, { timeout: 30000 }); const fMs = Date.now() - t;
  const g5 = await page.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, off: document.querySelectorAll("table.grid tbody tr.off").length, info: document.querySelector("#dsinfo").textContent }));
  ok(g5.rows >= 300 && g5.rows < g4.rows && g5.off > 100 && g5.off < g5.rows && /filter keeps 6\d\d\d/.test(g5.info) && fMs < 3000, "filter: back to the first page (plus the focused row), filtered-out rows greyed, kept count, under 3 s", { ...g5, fMs });
  // a small file still shows every row and no note
  const small = path.join(os.tmpdir(), "sww-small-" + process.pid + ".csv"); fs.writeFileSync(small, "a,b\n1,2\n3,4\n5,6\n");
  await page.setInputFiles("#fileInput", small); await page.waitForFunction(() => /3 rows/.test(document.querySelector("#dsinfo").textContent));
  const g6 = await page.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, note: !!document.querySelector("#gridMore") }));
  ok(g6.rows === 3 && !g6.note, "a small file shows every row and no paging note", g6);
  ok(errs.length === 0, "no page errors", errs);
  fs.unlinkSync(file); fs.unlinkSync(small);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
