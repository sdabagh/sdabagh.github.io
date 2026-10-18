const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menuRaw(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(500); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const details = (page) => page.evaluate(() => Array.from(document.querySelectorAll("#dlgForm details.more")).map((d) => [d.dataset.group, d.open]));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL); await sample(page, "STATC1000_Class_Data.csv", 40);
  // ---- folded groups
  await menuRaw(page, "Graph", "Histogram");
  let d = await details(page);
  ok(d.length === 1 && d[0][0] === "More appearance" && d[0][1] === false, "histogram: More appearance folded, Appearance essentials visible", d);
  ok(await page.evaluate(() => { const vis = (id) => { const el = document.getElementById(id); return !!el && el.checkVisibility(); }; return vis("f_gtitle") && vis("f_gcolor") && !vis("f_palette") && !vis("f_facet"); }), "title and color visible, palette and facet hidden until opened");
  await page.click('#dlgForm details.more[data-group="More appearance"] > summary'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.getElementById("f_facet").checkVisibility()), "clicking the heading reveals the fields");
  await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_facet", "Year"); await run(page);
  await menuRaw(page, "Graph", "Boxplot"); d = await details(page); ok(d[0][1] === true, "an opened section stays open in the next dialog (remembered)", d); await page.click("#dlgCancel");
  await page.evaluate(() => localStorage.removeItem("sww_more"));
  await menuRaw(page, "Graph", "Boxplot"); d = await details(page); ok(d[0][1] === false, "forgetting the memory folds it again", d); await page.click("#dlgCancel");
  // edit a card whose facet was set: the section opens by itself
  await page.click('#outG .card [data-act="edit"]'); await page.waitForSelector("#dlg.open"); d = await details(page);
  ok(d[0][1] === true && (await page.evaluate(() => document.getElementById("f_facet").value)) === "Year", "edit opens the section where a choice was made", d); await page.click("#dlgCancel");
  await menuRaw(page, "Advanced", "Multiple Linear Regression"); d = await details(page);
  ok(d.map((q) => q[0]).join(",") === "Model terms,Checks,Model comparison" && d.every((q) => !q[1]), "multiple regression folds Model terms, Checks, Model comparison", d);
  ok(await page.evaluate(() => { const v = (id) => document.getElementById(id).checkVisibility(); return v("f_y") && v("f_xs") && v("f_cs") && v("f_conf") && !v("f_ix") && !v("f_vif"); }), "its essentials stay visible"); await page.click("#dlgCancel");
  await menuRaw(page, "T-Tests", "Independent Samples T-Test"); d = await details(page); ok(d.length === 0, "the t test dialog keeps every section open (the course needs them)", d); await page.click("#dlgCancel");
  // ---- accessibility panel
  const a = await page.evaluate(() => { const t = document.getElementById("a11y-trigger"), r = t && t.getBoundingClientRect(); return { has: !!t, left: r && r.left, bottom: r && innerHeight - r.bottom, skip: !!document.querySelector(".skip-link"), panelHidden: getComputedStyle(document.getElementById("a11y-panel")).display === "none" }; });
  ok(a.has && a.left < 60 && a.bottom < 60 && a.skip && a.panelHidden, "accessibility button bottom left, panel closed, skip link present", a);
  await page.click("#a11y-trigger"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => getComputedStyle(document.getElementById("a11y-panel")).display !== "none" && !document.getElementById("a11y-reading-btn").closest(".a11y-row").checkVisibility()), "panel opens; the reading-mode row is hidden in the app");
  await page.click("#a11y-dark-btn"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.body.classList.contains("dark-mode") && getComputedStyle(document.body).backgroundColor === "rgb(18, 25, 34)" && getComputedStyle(document.querySelector("#out .card, #outG .card")).backgroundColor === "rgb(27, 36, 51)"), "dark mode: body and cards go dark");
  await page.click("#a11y-trigger"); await menuRaw(page, "Graph", "Histogram"); await page.selectOption("#f_x", "GPA"); await run(page);
  ok(await page.evaluate(() => { const p = document.querySelector("#outG .card .plot"); return p._fullLayout.paper_bgcolor === "#1B2433" && p._fullLayout.font.color === "#E6E9EE"; }), "a graph drawn in dark mode uses the dark paper and light text");
  await page.click("#a11y-trigger"); await page.click("#a11y-dark-btn"); await page.click('[data-font="large"]'); await page.waitForTimeout(50);
  ok(await page.evaluate(() => !document.body.classList.contains("dark-mode") && document.body.classList.contains("font-large") && localStorage.getItem("a11y-fontsize") === "large"), "dark off, large text on and remembered");
  await page.click("#a11y-dyslexia-btn"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.body.classList.contains("dyslexia-font") && !!document.getElementById("lexendCss")), "Lexend stylesheet is added only when the font is switched on");
  await page.click("#a11y-reset-btn"); await page.click("#a11y-trigger");
  // ---- update bar
  await page.evaluate(() => document.dispatchEvent(new Event("sww:update")));
  ok(await page.evaluate(() => { const b = document.getElementById("updateBar"); return !b.hidden && /new version/.test(b.textContent) && !!document.getElementById("updateYes"); }), "update bar appears with Reload now");
  await page.click("#updateNo"); ok(await page.evaluate(() => document.getElementById("updateBar").hidden), "Later hides it");
  // Ask knows the panel
  await page.click("#askBtn"); await page.fill("#botIn", "dark mode"); await page.press("#botIn", "Enter"); await page.waitForTimeout(150);
  ok(/round button at the bottom left/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask points to the accessibility panel");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
