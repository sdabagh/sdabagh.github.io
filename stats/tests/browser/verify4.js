// A filtered sample dataset is not remembered; a remembered copy identical to a sample is forgotten.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function loadSample(page) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await page.click("#dlg button.go"); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length > 0); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL); await loadSample(page);
  await page.fill("#filterBox", 'Year == "Freshman"'); await page.press("#filterBox", "Enter"); await page.waitForTimeout(100);
  const st = await page.evaluate(() => ({ info: document.querySelector("#dsinfo").textContent, stored: localStorage.getItem("sww_data") }));
  ok(/filter keeps/.test(st.info) && st.stored === null, "filtering the sample keeps the rows but stores nothing", st.info);
  await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelectorAll("table.grid tbody tr").length === 0 && /No data yet/.test(document.querySelector("#grid").textContent)), "after a reload the table is empty");
  // Data, Filters dialog path
  await loadSample(page); await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Filters" }).click(); await page.waitForSelector("#dlg.open");
  await page.fill("#f_f", "GPA > 3"); await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(100);
  ok(await page.evaluate(() => localStorage.getItem("sww_data") === null && /filter keeps/.test(document.querySelector("#dsinfo").textContent)), "the Filters dialog stores nothing for a sample either");
  // an edit still makes it the student's own
  await page.evaluate(() => { const td = document.querySelector("table.grid tbody tr td[contenteditable]"); td.focus(); td.textContent = "99"; td.dispatchEvent(new Event("input", { bubbles: true })); td.blur(); });
  await page.waitForTimeout(200);
  const own = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("sww_data") || "null"); return s && s.origin; });
  ok(own === "own", "an edited cell still makes the sample the student's own", own);
  // a remembered copy that is exactly the sample (the old rule's leftover) is forgotten on open
  await page.evaluate(async () => { const t = await (await fetch("data/STATC1000_Class_Data.csv")).text(); const rows = t.trim().split(/\r?\n/).map((l) => l.split(",")); localStorage.setItem("sww_data", JSON.stringify({ name: "STATC1000_Class_Data", cols: rows[0], rows: rows.slice(1), filter: 'Year == "Freshman"', manual: {}, origin: "own" })); });
  await page.reload(); await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.querySelectorAll("table.grid tbody tr").length === 0 && localStorage.getItem("sww_data") === null), "a stored copy identical to the sample (with a filter) is forgotten on open");
  // a changed copy under the sample's name is kept
  await page.evaluate(async () => { const t = await (await fetch("data/STATC1000_Class_Data.csv")).text(); const rows = t.trim().split(/\r?\n/).map((l) => l.split(",")); rows[1][3] = "99"; localStorage.setItem("sww_data", JSON.stringify({ name: "STATC1000_Class_Data", cols: rows[0], rows: rows.slice(1), filter: "", manual: {}, origin: "own" })); });
  await page.reload(); await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.querySelectorAll("table.grid tbody tr").length === 40 && /remembered from your last visit/.test(document.querySelector("#dsinfo").textContent)), "a changed copy under the sample's name is still remembered");
  // share link of a filtered sample names the sample
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(200); await loadSample(page);
  await page.fill("#filterBox", 'Year == "Freshman"'); await page.press("#filterBox", "Enter"); await page.waitForTimeout(100);
  await page.click('nav.menu .dd[data-name="Results"] .top'); await page.getByRole("menuitem", { name: "Share link (data + analyses)" }).click(); await page.waitForSelector("#dlg.open");
  const hint = await page.textContent("#dlgForm .hint"); await page.click("#dlgCancel");
  ok(/names the sample dataset/.test(hint) && !/travels inside/.test(hint), "share link of a filtered sample names the sample", hint.slice(0, 110));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
