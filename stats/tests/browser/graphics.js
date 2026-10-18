const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(600); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
// Plotly keeps the full layout on the element
const plots = (page) => page.evaluate(() => Array.from(document.querySelector("#outG .card").querySelectorAll(".plot")).map((p) => { const L = p._fullLayout || p.layout || {}; return { title: L.title && (L.title.text || L.title), font: L.font && L.font.size, ann: (L.annotations || []).map((a) => a.text), shapes: (L.shapes || []).length, xtype: L.xaxis && L.xaxis.type, yrange: L.yaxis && L.yaxis.range, showlegend: L.showlegend, legend: L.legend && L.legend.orientation, axes: Object.keys(L).filter((k) => /^xaxis\d*$/.test(k)).length, colors: (p.data || []).map((t) => (t.marker && t.marker.color) || (t.line && t.line.color)), ntr: (p.data || []).length, xgrid: L.xaxis && L.xaxis.showgrid }; }));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL); await sample(page, "STATC1000_Class_Data.csv", 40);
  // histogram with title, font, reference line, small multiples by Year
  await menu(page, "Graph", "Histogram");
  ok(await page.evaluate(() => ["f_palette", "f_facet", "f_legend", "f_theme", "f_fsize", "f_xrange", "f_yrange", "f_logx", "f_logy", "f_ref"].every((id) => !!document.getElementById(id)) && Array.from(document.querySelector("#f_facet").options).some((o) => o.value === "Year")), "Appearance has the new fields; facet lists Year");
  await page.selectOption("#f_x", "GPA"); await page.fill("#f_gtitle", "GPA of the class"); await page.fill("#f_fsize", "14"); await page.fill("#f_ref", "x = 3.0 (B average)"); await page.selectOption("#f_facet", "Year"); await page.selectOption("#f_theme", "minimal"); await run(page);
  let P = await plots(page);
  ok(P.length === 2, "histogram card has the full graph and the small multiples", P.length);
  ok(P[0].title === "GPA of the class" && P[0].font === 14 && P[0].shapes >= 1 && P[0].ann.includes("B average") && P[0].xgrid !== false, "full graph: title, 14pt font, labelled reference line", [P[0].title, P[0].font, P[0].shapes, P[0].ann]);
  ok(P[1].axes === 4 && P[1].ann.filter((a) => /^Year = /.test(a)).length === 4 && /GPA of the class: by Year/.test(P[1].title), "small multiples: four panels titled Year = ..., shared title", [P[1].axes, P[1].ann]);
  ok(await page.evaluate(() => /facet_wrap\(~ Year\)/.test(document.querySelector("#outG .card").textContent) && document.querySelectorAll("#outG .card .svgbtn").length === 2 && document.querySelectorAll("#outG .card h2").length === 1), "card: facet_wrap note, SVG buttons, a single card");
  // boxplot by Year with the Okabe-Ito palette and legend at the bottom
  await menu(page, "Graph", "Boxplot"); await page.selectOption("#f_vars", ["GPA"]); await page.selectOption("#f_by", "Year"); await page.selectOption("#f_palette", "okabe"); await run(page); P = await plots(page);
  ok(P[0].ntr >= 4 && P[0].colors.slice(0, 2).join() === "#0072B2,#E69F00", "boxplot groups take the Okabe-Ito palette", [P[0].colors]);
  await menu(page, "Graph", "Scatter Plot"); await page.selectOption("#f_x", "Hours_Study"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_by", "Year"); await page.selectOption("#f_legend", "bottom"); await page.selectOption("#f_palette", "gray"); await run(page); P = await plots(page);
  ok(P[0].legend === "h" && P[0].colors[0] === "#222222", "scatter colored by Year: legend at the bottom, grayscale palette", [P[0].legend, P[0].colors]);
  // scatter with y range and log x, classic theme, hidden legend
  await menu(page, "Graph", "Scatter Plot"); await page.selectOption("#f_x", "Hours_Study"); await page.selectOption("#f_y", "GPA"); await page.fill("#f_yrange", "0, 4"); await page.check("#f_logx"); await page.selectOption("#f_theme", "classic"); await page.selectOption("#f_legend", "none"); await run(page); P = await plots(page);
  ok(P[0].xtype === "log" && P[0].yrange && Math.abs(P[0].yrange[0]) < 1e-9 && Math.abs(P[0].yrange[1] - 4) < 1e-9 && P[0].showlegend === false && P[0].xgrid === false, "scatter: log x, y range 0 to 4, classic theme, no legend", [P[0].xtype, P[0].yrange, P[0].showlegend, P[0].xgrid]);
  // bar plot small multiples by Employed: categories aligned
  await menu(page, "Graph", "Bar Plot"); await page.selectOption("#f_x", "Year"); await page.selectOption("#f_facet", "Employed"); await run(page); P = await plots(page);
  ok(P.length === 2 && P[1].axes === 3 && P[1].ann.filter((a) => /^Employed = /.test(a)).length === 3, "bar plot: three panels by Employed", P[1] && P[1].ann);
  // edit reopens with the choices
  await page.click('#outG .card [data-act="edit"]'); await page.waitForSelector("#dlg.open");
  ok(await page.evaluate(() => document.querySelector("#f_facet").value === "Employed"), "edit keeps the small-multiples choice"); await page.click("#dlgCancel");
  // Ask
  await page.click("#askBtn"); await page.fill("#botIn", "can I make one panel per group with colorblind safe colors?"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(150);
  ok(/Graph appearance/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask routes facet and colorblind vocabulary");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
