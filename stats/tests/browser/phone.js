// A phone (390 px wide): each result table scrolls sideways on its own, with a hint under a table wider than the screen
// (the card itself no longer scrolls, so the text and the conclusion stay put); the copy buttons fit one row; the
// accessibility button sits at the bottom right, clear of the Sample datasets button, with room under the pane. Turning
// the phone (a resize to desktop width) takes the hint away again. In Spanish the hint is in Spanish.
const { chromium, devices } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(400); }
const probe = (page) => page.evaluate(() => {
  const c = document.querySelector("#out .card"), ts = Array.from(c.querySelectorAll("table.res")), b = c.querySelector(".scblock table.res");
  const r = document.getElementById("a11y-trigger").getBoundingClientRect(), btn = c.querySelector(".tblbtns button").getBoundingClientRect();
  const row = Array.from(c.querySelector(".tblbtns").children).map((x) => x.getBoundingClientRect().top);
  return { tables: ts.length, wide: ts.filter((t) => t.classList.contains("wide")).length, swipe: b.dataset.swipe, after: getComputedStyle(b, "::after").content, blockScrolls: b.scrollWidth > b.clientWidth + 1, blockDisplay: getComputedStyle(b).display, cardScrolls: c.scrollWidth > c.clientWidth + 1, heads: Array.from(b.querySelectorAll("thead th")).map((h) => h.textContent), trigRight: innerWidth - r.right, trigBottom: innerHeight - r.bottom, btnH: btn.height, oneRow: row.every((y) => Math.abs(y - row[0]) < 1), padBottom: getComputedStyle(c.closest(".pane")).paddingBottom };
});
(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext({ ...devices["iPhone 13"] }); const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL); await page.waitForTimeout(500);
  // the home screen: the accessibility button does not cover the Sample datasets button
  const home = await page.evaluate(() => { const t = document.getElementById("a11y-trigger").getBoundingClientRect(), s = document.querySelector(".emptybtns button[data-go=\"Sample datasets\"]"); const r = s && s.getBoundingClientRect(); return { right: innerWidth - t.right, overlap: !!r && !(r.right < t.left || r.left > t.right || r.bottom < t.top || r.top > t.bottom), found: !!s }; });
  ok(home.found && home.right < 60 && !home.overlap, "home screen on a phone: the accessibility button is at the right and does not cover Sample datasets", home);
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_academy_fitness.csv"); await run(page);
  await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "pushups_week12"); await page.fill("#f_mu0", "44"); await run(page);
  let p = await probe(page);
  ok(p.blockDisplay === "block" && p.blockScrolls && !p.cardScrolls, "the block's table scrolls sideways on its own; the card does not", { display: p.blockDisplay, blockScrolls: p.blockScrolls, cardScrolls: p.cardScrolls });
  ok(p.wide >= 1 && p.swipe === "swipe sideways for the remaining columns" && /swipe sideways/.test(p.after), "a table wider than the screen carries the swipe hint", { wide: p.wide, tables: p.tables, swipe: p.swipe, after: p.after });
  ok(p.heads.includes("P-value"), "the P-value column is in the table (reachable by swiping)", p.heads);
  ok(p.btnH <= 30 && p.oneRow, "the three copy buttons are compact and on one row", { h: p.btnH, oneRow: p.oneRow });
  ok(p.trigRight < 60 && p.trigBottom < 60 && parseFloat(p.padBottom) >= 60, "the accessibility button is bottom right and the pane leaves room under the last card", { right: p.trigRight, bottom: p.trigBottom, pad: p.padBottom });
  // the swipe moves only the table: the conclusion stays where it was
  const moved = await page.evaluate(() => { const c = document.querySelector("#out .card"), b = c.querySelector(".scblock table.res"), say = c.querySelector(".say"); const x0 = say.getBoundingClientRect().left; b.scrollLeft = 200; return { scrolled: b.scrollLeft > 100, sayMoved: Math.abs(say.getBoundingClientRect().left - x0) > 0.5 }; });
  ok(moved.scrolled && !moved.sayMoved, "swiping the table leaves the conclusion in place", moved);
  // turned sideways or on a desktop: no hint, the table is a table again
  await page.setViewportSize({ width: 1300, height: 900 }); await page.waitForTimeout(500);
  const wide = await page.evaluate(() => { const b = document.querySelector("#out .card .scblock table.res"); return { display: getComputedStyle(b).display, wide: b.classList.contains("wide"), after: getComputedStyle(b, "::after").content }; });
  ok(wide.display === "table" && !wide.wide && !/swipe/.test(wide.after), "at desktop width the hint goes away and the table is a plain table", wide);
  // Spanish: the hint is in Spanish
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector("#out").innerHTML = "");
  await page.click("#langBtn"); await page.waitForTimeout(400);
  await menu(page, "T-Tests", "Prueba t para una muestra"); await page.selectOption("#f_x", "pushups_week12"); await page.fill("#f_mu0", "44"); await run(page);
  const es = await page.evaluate(() => { const b = document.querySelector("#out .card .scblock table.res"); return { swipe: b.dataset.swipe, wide: b.classList.contains("wide") }; });
  ok(es.wide && es.swipe === "deslice la tabla hacia los lados para ver las demás columnas", "in Spanish the hint is in Spanish", es);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
