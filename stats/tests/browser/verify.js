// End-to-end checks of the review fixes in headless Chromium.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0;
const ok = (cond, msg, extra) => { console.log((cond ? "PASS " : "FAIL ") + msg + (extra !== undefined ? "  [" + JSON.stringify(extra) + "]" : "")); if (!cond) fails++; };

async function loadSample(page) {
  await page.click("#mtop0");
  await page.getByRole("menuitem", { name: "Sample datasets" }).click();
  await page.selectOption("#f_f", "STATC1000_Class_Data.csv");
  await page.click("#dlg button.go");
  await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length > 0);
}
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 800 }, permissions: ["clipboard-read", "clipboard-write"], acceptDownloads: true });
  const page = await ctx.newPage();
  const dialogs = [], errors = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(URL);
  await loadSample(page);

  // ---- 1. filter spellings and the inline message
  const tryFilter = async (f) => { await page.fill("#filterBox", f); await page.press("#filterBox", "Enter"); await page.waitForTimeout(150); return { msg: await page.textContent("#filterMsg"), kept: await page.evaluate(() => document.querySelectorAll("table.grid tbody tr:not(.off)").length), info: await page.textContent("#dsinfo"), box: await page.inputValue("#filterBox") }; };
  let r = await tryFilter('Year == "Freshman" and GPA > 3');
  ok(r.msg === "" && r.info.includes("filter keeps"), "filter with lowercase and works", r);
  const keptAnd = r.kept;
  r = await tryFilter('Year == "Freshman" && GPA > 3');
  ok(r.kept === keptAnd, "&& keeps the same rows as and", r.kept);
  r = await tryFilter('Year == "Freshman" & GPA > 3');
  ok(r.kept === keptAnd, "single & keeps the same rows", r.kept);
  r = await tryFilter('Year == "Freshman" OR Year == "Senior"');
  const keptOr = r.kept;
  r = await tryFilter('Year == "Freshman" | Year == "Senior"');
  ok(r.kept === keptOr && keptOr > 0, "| matches OR", r.kept);
  r = await tryFilter('Year = "Freshman" or Year = "Senior"');
  ok(r.kept === keptOr, "lone = and lowercase or", r.kept);
  r = await tryFilter('Year == Freshman and GPA > 3');
  ok(r.msg.startsWith("Filter could not be read") && r.box === 'Year == Freshman and GPA > 3' && !r.info.includes("filter keeps"), "bad filter: inline message, typed text kept, all rows in use", r.msg);
  ok(await page.getAttribute("#filterBox", "aria-invalid") === "true", "bad filter marks the box invalid");
  r = await tryFilter("");
  ok(r.msg === "" && !r.info.includes("filter keeps"), "clearing the box clears the message");
  ok(dialogs.length === 0, "no alert() during filter tests", dialogs);

  // Data > Filters dialog: message under the field, not an alert
  await menu(page, "Data", "Filters");
  await page.fill("#f_f", "Year == Freshman");
  await page.click("#dlg button.go");
  await page.waitForTimeout(100);
  const fm = await page.textContent("#f_f_msg");
  ok(fm.startsWith("Filter could not be read") && dialogs.length === 0, "filter dialog shows the problem under its box", fm);
  await page.click("#dlgCancel");

  // the filter tests made the sample "your own data"; start again from a clean browser so the sample path is tested
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(200); await loadSample(page);
  // ---- 2. dialog defaults pair different variables
  await menu(page, "Regression", "Linear Regression");
  const reg = await page.evaluate(() => [document.querySelector("#f_y").value, document.querySelector("#f_x").value]);
  ok(reg[0] !== reg[1], "regression opens with different dependent variable and covariate", reg);
  await page.click("#dlgCancel");
  await menu(page, "Frequencies", "Contingency Tables: Independent Samples");
  const ct = await page.evaluate(() => [document.querySelector("#f_r").value, document.querySelector("#f_c").value]);
  ok(ct[0] !== ct[1], "contingency opens with different rows and columns", ct);
  await page.click("#dlgCancel");
  await menu(page, "T-Tests", "Paired Samples T-Test");
  const pr = await page.evaluate(() => [document.querySelector("#f_a").value, document.querySelector("#f_b").value]);
  ok(pr[0] !== pr[1], "paired t opens with two different variables", pr);
  await page.click("#dlgCancel");

  // ---- 3. summary fields hidden until chosen
  await menu(page, "T-Tests", "Independent Samples T-Test");
  const vis = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return !!el && el.getClientRects().length > 0; }, sel);
  ok(!(await vis("#f_m1")) && (await vis("#f_x")) && (await vis("#f_g")), "t-test: Mean 1 hidden, variable boxes shown, with data mode");
  const welchLabel = await page.evaluate(() => document.querySelector("#f_welch").parentNode.textContent.trim());
  ok(welchLabel.includes("the default here") && !welchLabel.includes("course"), "Welch label no longer says 'in this course'", welchLabel);
  await page.selectOption("#f_mode", "summary");
  ok((await vis("#f_m1")) && !(await vis("#f_x")), "t-test: summary boxes shown and variable boxes hidden in summary mode");
  await page.click("#dlgCancel");

  // ---- 4/6. descriptives: no quartile note without quartiles; box plot axis covers the outliers
  await menu(page, "Exploration", "Descriptives");
  await page.selectOption("#f_vars", ["Commute_Minutes"]);
  await run(page);
  let cardText = await page.evaluate(() => document.querySelector("#out .card").innerText);
  ok(!/Quartiles by the/.test(cardText), "descriptives without quartiles has no quartile note");
  ok(/copy as CSV/.test(cardText), "descriptives table has copy as CSV button");
  await menu(page, "Exploration", "Descriptives");
  await page.selectOption("#f_vars", ["Commute_Minutes"]);
  await page.check("#f_box");
  await run(page);
  await page.waitForTimeout(300);
  cardText = await page.evaluate(() => document.querySelector("#out .card").innerText);
  ok(/Quartiles \(used by the box plot\) by the textbook rule/.test(cardText), "box plot brings the quartile note back");
  const yr = await page.evaluate(() => { const p = document.querySelector("#out .card .plot"); const l = p && p._fullLayout; const vals = Array.from(document.querySelectorAll("table.grid tbody tr")).map((tr) => Number(tr.children[Array.from(document.querySelectorAll("table.grid thead th")).findIndex((th) => th.textContent.startsWith("Commute_Minutes"))].textContent)).filter(Number.isFinite); return { range: l && l.yaxis.range, dtick: l && l.yaxis.dtick, max: Math.max(...vals), min: Math.min(...vals) }; });
  ok(yr.range && yr.range[1] >= yr.max && yr.range[0] <= yr.min && yr.range[1] - yr.max <= 2 * yr.dtick, "box plot y axis covers the data with a labelled tick above the max", yr);
  ok((await page.locator("#out .card .modebar").count()) === 0, "no Plotly modebar on the box plot");
  ok((await page.locator("#out .card .pngbtn").count()) === 1, "download PNG button under the graph");

  // ---- 7. regression r with its sign; worked numbers; APA line
  await menu(page, "Regression", "Linear Regression");
  await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Study");
  await run(page);
  await page.waitForTimeout(300);
  const regCard = await page.evaluate(() => { const c = document.querySelector("#out .card"); const t = c.querySelector("table.res"); const row = t.querySelectorAll("tbody td"); return { hdr: Array.from(t.querySelectorAll("th")).map((x) => x.textContent), r: row[1].textContent, r2: row[2].textContent, slope: c.querySelectorAll("table.res")[1].querySelectorAll("tbody tr")[1].children[1].textContent, worked: !!c.querySelector("details.worked"), apa: (c.querySelector(".apa") || {}).textContent, modebars: c.querySelectorAll(".modebar").length, plots: c.querySelectorAll(".plot").length }; });
  ok(regCard.hdr[1] === "r" && Math.sign(Number(regCard.r)) === Math.sign(Number(regCard.slope)) && Number(regCard.slope) < 0, "regression reports signed r matching the slope", regCard);
  ok(regCard.worked && /Report it as/.test(regCard.apa || ""), "regression has worked numbers and an APA line", regCard.apa);
  ok(regCard.modebars === 0 && regCard.plots === 3, "regression plots: three plots (scatter, residuals, the slope t curve), no modebar", regCard);

  // ---- t-test card: worked numbers equal SciPy-style recomputation, APA line
  await menu(page, "T-Tests", "Independent Samples T-Test");
  await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_g", "Pet_Owner");
  await run(page);
  await page.waitForTimeout(200);
  const tt = await page.evaluate(() => { const c = document.querySelector("#out .card"); return { worked: Array.from(c.querySelectorAll("details.worked .formula")).map((f) => f.textContent), apa: c.querySelector(".apa code").textContent, row: Array.from(c.querySelector("table.res").querySelectorAll("tbody td")).map((x) => x.textContent) }; });
  ok(tt.worked.length === 4 && tt.worked[0].includes("= " + tt.row[2]), "t-test worked line ends with the t in the table", tt.worked[0]);
  ok(/^t\(\d+(\.\d+)?\) = [−-]?\d+\.\d\d, p (= \.\d{3}|< \.001), d = /.test(tt.apa), "t-test APA line format", tt.apa);

  // ---- Graphs tab empty text; Graph menu box plot
  const emptyG = await page.evaluate(() => getComputedStyle(document.querySelector("#outG"), "::before").content);
  ok(/Graph menu/.test(emptyG) && /Analyses/.test(emptyG), "empty Graphs tab explains where plots go", emptyG);
  await menu(page, "Graph", "Boxplot");
  await page.selectOption("#f_vars", ["Commute_Minutes"]);
  await run(page);
  await page.waitForTimeout(300);
  const gb = await page.evaluate(() => { const p = document.querySelector("#outG .card .plot"); return { range: p._fullLayout.yaxis.range, tab: document.querySelector("#tabG").classList.contains("active") }; });
  ok(gb.tab && gb.range[1] >= 70, "Graph menu box plot lands in Graphs with an axis past 70", gb);

  // ---- 5/10. copy as CSV and Markdown
  await page.click("#tabA");
  const csvBtn = page.locator("#out .card").first().locator('button[data-act="csv"]').first();
  await csvBtn.click();
  await page.waitForTimeout(100);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok(clip.split("\n").length > 1 && clip.split("\n")[0].includes(","), "copy as CSV puts a CSV table on the clipboard", clip.split("\n")[0]);
  ok(await csvBtn.textContent() === "Copied", "CSV button says Copied");
  await page.locator("#out .card").first().locator('button[data-act="md"]').first().click();
  await page.waitForTimeout(100);
  const md = await page.evaluate(() => navigator.clipboard.readText());
  ok(md.startsWith("| ") && md.split("\n")[1].includes("---"), "copy as Markdown gives a Markdown table", md.split("\n").slice(0, 2));

  // ---- PNG download
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 15000 }), page.locator("#out .card .pngbtn").first().click()]);
  ok(/\.png$/.test(dl.suggestedFilename()), "download PNG saves a .png", dl.suggestedFilename());

  // ---- 9. autosave and restore after a reload
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sww_last")));
  ok(saved && saved.cards.length === 5 && saved.name === "STATC1000_Class_Data" && saved.origin === "sample", "autosave holds the five cards and the data name", saved && { n: saved.cards.length, keys: saved.cards.map((c) => c.k) });
  await page.reload();
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelectorAll("table.grid tbody tr").length) === 0, "reload opens with the empty table (sample not remembered)");
  ok(!(await page.evaluate(() => document.querySelector("#restoreBar").hidden)), "restore bar is offered after reload");
  const barText = await page.textContent("#restoreText");
  ok(/5 analyses on STATC1000_Class_Data/.test(barText), "restore bar names the count and the data", barText);
  await page.click("#restoreYes");
  await page.waitForFunction(() => document.querySelectorAll("#out .card, #outG .card").length >= 5, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ a: document.querySelectorAll("#out .card").length, g: document.querySelectorAll("#outG .card").length, rows: document.querySelectorAll("table.grid tbody tr").length, plots: document.querySelectorAll("#out .plot, #outG .plot").length, edits: document.querySelectorAll('#out [data-act="edit"]').length, titles: Array.from(document.querySelectorAll("#out .card h2")).map((h) => h.textContent), bar: document.querySelector("#restoreBar").hidden, dlg: document.querySelector("#dlg").open }));
  ok(after.a === 4 && after.g === 1 && after.rows === 40 && after.plots >= 4 && after.edits === 4 && after.bar && !after.dlg, "restore re-runs the cards with plots and edit buttons, no dialog left open", after);
  ok(after.titles[0] === "Independent Samples T-Test" && after.titles[3] === "Descriptives", "restored cards keep their order (newest on top)", after.titles);
  // dismiss path
  await page.reload(); await page.waitForTimeout(300);
  await page.click("#restoreNo");
  ok(await page.evaluate(() => document.querySelector("#restoreBar").hidden && !localStorage.getItem("sww_last")), "No thanks hides the bar and forgets the session");
  await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelector("#restoreBar").hidden), "nothing offered after dismissing");

  // ---- 10. widen table
  await loadSample(page);
  await page.click("#paneToggle");
  let wide = await page.evaluate(() => ({ cls: document.body.classList.contains("tablewide"), outw: document.querySelector("#outwrap").getClientRects().length, label: document.querySelector("#paneToggle").textContent, gridw: document.querySelector("#datapane").getBoundingClientRect().width }));
  ok(wide.cls && wide.outw === 0 && wide.label === "Show results" && wide.gridw > 1200, "Widen table folds the results away", wide);
  await menu(page, "Exploration", "Descriptives"); await page.selectOption("#f_vars", ["GPA"]); await run(page);
  wide = await page.evaluate(() => ({ cls: document.body.classList.contains("tablewide"), label: document.querySelector("#paneToggle").textContent }));
  ok(!wide.cls && wide.label === "Widen table", "a new result brings the results pane back", wide);

  // ---- session file still loads (cleaner keeps the new buttons harmless)
  await page.evaluate(() => { localStorage.clear(); });

  ok(errors.length === 0, "no page or console errors", errors);
  ok(dialogs.length === 0, "no alert dialogs at all", dialogs);

  // ---- 12. phone layout: no horizontal overflow
  const phone = await ctx.newPage(); const perr = []; phone.on("pageerror", (e) => perr.push(e.message));
  await phone.setViewportSize({ width: 390, height: 844 });
  await phone.goto(URL);
  await phone.click("#mtop0"); await phone.getByRole("menuitem", { name: "Sample datasets" }).click(); await phone.selectOption("#f_f", "STATC1000_Class_Data.csv"); await phone.click("#dlg button.go");
  await phone.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length > 0);
  await phone.click('nav.menu .dd[data-name="T-Tests"] .top'); await phone.getByRole("menuitem", { name: "Independent Samples T-Test", exact: true }).click(); await phone.waitForSelector("#dlg.open");
  await phone.selectOption("#f_x", "GPA"); await phone.selectOption("#f_g", "Pet_Owner"); await phone.click("#dlg button.go"); await phone.waitForFunction(() => !document.querySelector("#dlg").open); await phone.waitForTimeout(500);
  const ov = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, toggle: document.querySelector("#paneToggle").getClientRects().length, wide: Array.from(document.querySelectorAll("body *")).filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== "fixed" && !el.closest(".plot") && !el.closest("#grid")).slice(0, 5).map((el) => el.tagName + "." + el.className) }));
  ok(ov.sw <= ov.iw && ov.toggle === 0, "phone: no horizontal page overflow, no Widen button", ov);
  await phone.screenshot({ path: require("os").tmpdir() + "/sww-phone-data.png", fullPage: false });
  await phone.evaluate(() => document.querySelector("#out .card").scrollIntoView());
  await phone.screenshot({ path: require("os").tmpdir() + "/sww-phone-card.png", fullPage: false });
  await phone.goto(URL + "#distraction"); await phone.waitForTimeout(300);
  await phone.click("#distPick button"); await phone.waitForTimeout(500);
  const ov2 = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  ok(ov2.sw <= ov2.iw, "phone: distrACTION page has no horizontal overflow", ov2);
  await phone.screenshot({ path: require("os").tmpdir() + "/sww-phone-dist.png", fullPage: false });
  ok(perr.length === 0, "phone: no page errors", perr);

  await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/desktop.png" });
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
