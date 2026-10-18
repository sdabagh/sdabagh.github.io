const ROOT = require("path").resolve(__dirname, "../../..");
const { chromium } = require("playwright");
const fs = require("fs"); const csv = (f) => fs.readFileSync(ROOT + "/stats/data/" + f, "utf8").trim().split("\n").map((l) => l.split(","));
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const grid = (page) => page.evaluate(() => ({ cols: Array.from(document.querySelectorAll("table.grid thead th[data-col]")).map((t) => t.dataset.col), rows: Array.from(document.querySelectorAll("table.grid tbody tr")).map((tr) => Array.from(tr.querySelectorAll("td[data-j]")).map((td) => td.textContent)) }));
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), text: c.textContent }; });
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(100); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => m.textContent), before); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], dialogs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { dialogs.push(d.message()); await d.accept(); });
  await page.goto(URL);
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('nav.menu .dd[data-name="Data"] [role=menuitem]')).map((e) => e.textContent.trim()));
  ok(["Reshape: wide to long", "Reshape: long to wide", "Merge with another table (join)", "Group by and summarize", "Clean rows (blanks, duplicates)"].every((x) => items.includes(x)), "Data menu has the five wrangling items", items);
  // ---- wide to long on the sleep follow-up (40 students, 2 weeks)
  const SL = csv("STATC1000_Sleep_Followup.csv"); await sample(page, "STATC1000_Sleep_Followup.csv", SL.length - 1);
  await menu(page, "Data", "Reshape: wide to long"); await page.selectOption("#f_vars", ["Sleep_Week2", "Sleep_FinalsWeek"]); await page.selectOption("#f_ids", ["Student_ID"]); await page.fill("#f_nn", "week"); await page.fill("#f_vn", "sleep"); await run(page);
  let g = await grid(page); let c = await cardInfo(page);
  ok(g.cols.join(",") === "Student_ID,week,sleep" && g.rows.length === 2 * (SL.length - 1) && g.rows[0].join(",") === "S01,Sleep_Week2,7.5" && g.rows[1].join(",") === "S01,Sleep_FinalsWeek,7.0", "wide to long: 80 rows of Student_ID, week, sleep", [g.cols, g.rows.length, g.rows.slice(0, 2)]);
  ok(/pivot_longer\(data, cols = c\(Sleep_Week2, Sleep_FinalsWeek\), names_to = "week", values_to = "sleep"\)/.test(c.text) && /became 80/.test(c.text), "card shows the tidyr line");
  // ---- and back to wide
  await menu(page, "Data", "Reshape: long to wide"); await page.selectOption("#f_ids", ["Student_ID"]); await page.selectOption("#f_nf", "week"); await page.selectOption("#f_vf", "sleep"); await run(page); g = await grid(page); c = await cardInfo(page);
  ok(g.cols.join(",") === "Student_ID,Sleep_Week2,Sleep_FinalsWeek" && g.rows.length === SL.length - 1 && g.rows.every((r, i) => r.join(",") === SL[i + 1].join(",")), "long to wide restores the original table exactly", [g.cols, g.rows.length]);
  ok(/pivot_wider\(data, id_cols = c\(Student_ID\), names_from = week, values_from = sleep\)/.test(c.text), "card shows the pivot_wider line");
  // ---- duplicates: stop by default, average on request
  const CD = csv("STATC1000_Class_Data.csv"); await sample(page, "STATC1000_Class_Data.csv", 40);
  const nd = dialogs.length; await menu(page, "Data", "Reshape: long to wide"); await page.selectOption("#f_ids", ["Year"]); await page.selectOption("#f_nf", "Employed"); await page.selectOption("#f_vf", "GPA"); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === nd + 1 && /cells have more than one value \(for example Year = /.test(dialogs[nd]), "several values in a cell: stops with an example, like R", dialogs[nd]);
  await page.selectOption("#f_dup", "mean"); await run(page); g = await grid(page);
  const iy = CD[0].indexOf("Year"), ie = CD[0].indexOf("Employed"), ig = CD[0].indexOf("GPA"); const cell = CD.slice(1).filter((r) => r[iy] === "Freshman" && r[ie] === "Part-time").map((r) => +r[ig]); const want = cell.reduce((s, q) => s + q, 0) / cell.length;
  const fr = g.rows.find((r) => r[0] === "Freshman"); const jpt = g.cols.indexOf("Part-time");
  ok(g.cols.includes("Full-time") && g.cols.includes("Part-time") && g.cols.includes("Not_employed") && fr && near(fr[jpt], want, 1e-3), "averaged cells: Freshman Part-time GPA mean", [g.cols, fr, want]);
  // ---- join: class data with the Exam 1 file on Student_ID = StudentID
  await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "Data", "Merge with another table (join)"); await page.selectOption("#f_src", "sample"); await page.selectOption("#f_f2", "STATC1000_Class_Data_Exam1.csv"); await page.selectOption("#f_k1", "Student_ID"); await page.fill("#f_k2", "StudentID"); await run(page);
  await page.waitForFunction(() => Array.from(document.querySelectorAll("table.grid thead th[data-col]")).some((t) => t.dataset.col === "Exam1Score"), null, { timeout: 10000 }); await page.waitForTimeout(200); g = await grid(page); c = await cardInfo(page);
  const EX = csv("STATC1000_Class_Data_Exam1.csv"); const s01 = g.rows.find((r) => r[0] === "S01");
  ok(g.rows.length === 40 && g.cols.length === CD[0].length + EX[0].length - 1 && s01[g.cols.indexOf("Exam1Score")] === EX.find((r) => r[0] === "S01")[2], "left join adds the five exam columns to all 40 students", [g.cols.length, s01 && s01.slice(-5)]);
  ok(c.rows[0][0][1] === "40" && c.rows[0][1][1] === "0" && /left_join\(data, other, by = c\("Student_ID" = "StudentID"\)\)/.test(c.text), "match summary 40 matched, 0 unmatched; dplyr line", c.rows[0]);
  // ---- group by on the merged table
  await menu(page, "Data", "Group by and summarize"); await page.selectOption("#f_g", "Year"); await page.selectOption("#f_ys", ["GPA", "Exam1Score"]); await page.selectOption("#f_st", ["n", "mean", "sd"]); await run(page); c = await cardInfo(page);
  const byYear = {}; CD.slice(1).forEach((r) => { (byYear[r[iy]] = byYear[r[iy]] || []).push(+r[ig]); }); const soph = byYear["Sophomore"], sophMean = soph.reduce((s, q) => s + q, 0) / soph.length;
  const sophRow = c.rows[0].find((r) => r[0] === "Sophomore");
  ok(c.rows[0].length === 4 && c.rows[0].map((r) => r[0]).join(",") === "Freshman,Junior,Senior,Sophomore" && sophRow[1] === String(soph.length) && near(sophRow[2], sophMean, 1e-3), "group by Year: n and GPA mean match", sophRow);
  ok(/group_by\(Year\) %>% summarise\(n = n\(\), GPA_mean = mean\(GPA, na.rm = TRUE\), GPA_sd = sd\(GPA, na.rm = TRUE\), Exam1Score_mean/.test(c.text), "card shows the dplyr line");
  // ---- clean rows on pasted data with NA codes, spaces, duplicates, an empty row
  await menu(page, "Data", "Paste data"); await page.fill("#f_txt", "x,y\n1,NA\n1,NA\n2, 3 \n,\n4,."); await run(page); g = await grid(page);
  await menu(page, "Data", "Clean rows (blanks, duplicates)"); await page.check("#f_dup"); await run(page); g = await grid(page); c = await cardInfo(page);
  ok(g.rows.length === 3 && g.rows[0].join(",") === "1," && g.rows[1].join(",") === "2,3" && g.rows[2].join(",") === "4,", "NA and . became blanks, spaces trimmed, duplicate and empty rows removed", g.rows);
  ok(/3 missing-value codes/.test(c.text) && /1 duplicate row removed/.test(c.text) && /distinct\(data\)/.test(c.text), "clean card counts each change", c.text.slice(0, 300));
  // ---- Ask routes the vocabulary and explains long vs wide
  await page.click("#askBtn"); let a = await ask(page, "how do I merge two files by student id"); ok(/Merge with another table/.test(a[0]), "Ask: merge", (a[0] || "").slice(0, 80));
  a = await ask(page, "what is long format?"); ok(/^Long and wide layouts/.test(a[0]) && /one row per measurement/.test(a[0]), "Ask: long vs wide explained", (a[0] || "").slice(0, 80));
  a = await ask(page, "means by group"); ok(/Group by and summarize/.test(a[0]), "Ask: group by");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
