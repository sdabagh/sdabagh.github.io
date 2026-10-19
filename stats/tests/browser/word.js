// Copy for Word: a table, and a whole card, go on the clipboard as HTML (APA table style) with a plain-text twin.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
const clip = (page) => page.evaluate(async () => { const items = await navigator.clipboard.read(); const out = {}; for (const it of items) for (const ty of it.types) out[ty] = await (await it.getType(ty)).text(); return out; });
(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } }); await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL);
  await menu(page, "Data", "Sample datasets"); await run(page);
  await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_g", "Employed"); await page.fill("#f_lv", "Part-time, Full-time"); await run(page);
  const btns = await page.evaluate(() => ({ tools: Array.from(document.querySelectorAll("#out .card .tools button")).map((b) => b.textContent), tbl: Array.from(document.querySelectorAll("#out .card .tblbtns")[0].querySelectorAll("button")).map((b) => b.textContent) }));
  ok(btns.tools.includes("copy for Word") && btns.tbl.includes("copy for Word"), "card tools and every table offer copy for Word", btns);
  // a table
  await page.click('#out .card .tblbtns button[data-act="doc"]'); await page.waitForTimeout(300);
  let c = await clip(page);
  ok(/<table style="border-collapse:collapse/.test(c["text/html"] || "") && /<i>Independent Samples T-Test<\/i>/.test(c["text/html"]) && /border-top:1\.5pt solid #000;border-bottom:1pt solid #000/.test(c["text/html"]) && /text-align:right/.test(c["text/html"]), "table: HTML with an italic title, header rules and right-aligned numbers", Object.keys(c));
  ok(/Statistic\tdf\tp/.test(c["text/plain"] || ""), "table: plain-text twin is tab separated", (c["text/plain"] || "").slice(0, 80));
  ok(await page.evaluate(() => document.querySelector('#out .card .tblbtns button[data-act="doc"]').textContent) === "Copied", "the button says Copied");
  // the whole card
  await page.click('#out .card .tools button[data-act="doc"]'); await page.waitForTimeout(500);
  c = await clip(page); const h = c["text/html"] || "";
  ok(/<b>Independent Samples T-Test<\/b>/.test(h) && (h.match(/<table /g) || []).length >= 2 && /Report it as \(APA style\)/.test(h) && /fail to reject|Reject H|reject the null/i.test(h), "card: title, both tables, the APA line and the conclusion", { tables: (h.match(/<table /g) || []).length });
  ok(!/copy as CSV|check my work|copy text/.test(h), "card: no buttons in the copy");
  ok(/Independent Samples T-Test/.test(c["text/plain"] || "") && /Report it as/.test(c["text/plain"] || ""), "card: plain-text twin carries the text");
  // a card with a graph: the picture goes along
  await menu(page, "Graph", "Histogram"); await page.selectOption("#f_x", "GPA"); await run(page);
  await page.click("#tabG"); await page.waitForTimeout(200);
  await page.click('#outG .card .tools button[data-act="doc"]'); await page.waitForTimeout(1500);
  c = await clip(page);
  ok(/<img src="data:image\/png;base64,/.test(c["text/html"] || ""), "graph card: the graph is in the copy as a PNG picture", (c["text/html"] || "").slice(0, 60));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
