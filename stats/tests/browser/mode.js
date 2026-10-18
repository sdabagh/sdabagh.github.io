const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1300, height: 900 } }); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  ok(await page.evaluate(() => document.querySelector("#modeBtn").textContent === "Student" && document.querySelector('.empty [data-who="student"]').classList.contains("on") && document.querySelectorAll(".empty .typical button").length === 6), "default: Student, General, six starter analyses");
  // field via dialog
  await page.click('.empty [data-field]'); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_field", "health"); await run(page);
  ok(await page.evaluate(() => document.querySelector("#modeBtn").textContent === "Student in Health and nursing" && /^Field: Health and nursing/.test(document.querySelector(".empty [data-field]").textContent) && Array.from(document.querySelectorAll(".empty .typical button")).map((x) => x.textContent).includes("Survival Analysis: Kaplan-Meier, log-rank, Cox") && /Relative risk/.test(document.querySelector(".empty").textContent)), "health field: label, typical analyses, pointer");
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("sww_mode")).field === "health"), "field remembered");
  // sample datasets: health first
  await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.waitForSelector("#dlg.open");
  const first = await page.evaluate(() => Array.from(document.querySelectorAll("#f_f option")).slice(0, 2).map((o) => [o.value, o.textContent]));
  ok(first[0][0] === "lung_cancer_survival.csv" && /Health and nursing/.test(first[0][1]), "health datasets listed first with the field label", first);
  await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 40);
  // student card: formula visible
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "GPA"); await run(page);
  ok(await page.evaluate(() => { const c = document.querySelector("#out .card"); return !c.querySelector("details.method") && !!c.querySelector(":scope > .formula"); }), "student card keeps the formula in the open");
  // researcher: via the data-bar button
  await page.click("#modeBtn"); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_who", "researcher"); await run(page);
  ok(await page.evaluate(() => document.body.classList.contains("who-researcher") && document.querySelector("#modeBtn").textContent === "Researcher in Health and nursing" && /Set up for Researcher/.test(document.querySelector("#out .card h2").textContent)), "researcher mode set from the data bar");
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "GPA"); await run(page);
  const r = await page.evaluate(() => { const c = document.querySelector("#out .card"); const kids = Array.from(c.children).map((k) => k.className || k.tagName); const det = c.querySelector("details.method"); return { title: c.querySelector("h2").textContent, kids, hasDet: !!det, open: det && det.open, inDet: det ? Array.from(det.children).map((k) => k.className || k.tagName) : [], dec: Array.from(c.querySelectorAll("table.res td.num")).map((x) => x.textContent).find((x) => /^\d/.test(x)) }; });
  ok(r.title === "One Sample T-Test" && r.hasDet && !r.open && r.inDet.includes("formula") && r.inDet.includes("worked") && r.kids.indexOf("apa") < r.kids.indexOf("method") && r.kids.indexOf("say") < r.kids.indexOf("method"), "researcher card: APA and conclusion before the folded Method", r.kids);
  ok(/^\d+\.\d{3}$/.test(r.dec), "researcher default is 3 decimals", r.dec);
  // back to student from the start screen after clearing data
  await page.reload(); ok(await page.evaluate(() => document.body.classList.contains("who-researcher") && document.querySelector("#modeBtn").textContent.startsWith("Researcher")), "mode survives reload");
  await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await run(page); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 40);
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "GPA"); await run(page);
  const dec2 = await page.evaluate(() => Array.from(document.querySelectorAll("#out .card table.res td.num")).map((x) => x.textContent).find((x) => /^\d/.test(x)));
  ok(/^\d+\.\d{3}$/.test(dec2), "after a reload the researcher still gets 3 decimals", dec2);
  ok(errs.length === 0, "no page errors", errs);
  await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/mode_card.png", clip: { x: 0, y: 0, width: 1300, height: 900 } });
  await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
