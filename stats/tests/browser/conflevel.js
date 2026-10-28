// Any confidence level: typed as a percent (or a proportion), used by the card, the APA line and the R script, shown
// again as a percent on edit, validated with a message under the box, and set by a course profile.
// Reference (one-sample t from summary, xbar 52, s 10, n 25, mu0 50): SE = 2; t* at 98 percent, df 24 = 2.4922, so
// the interval for the mean difference is 2 +/- 4.9844 = -2.9844 to 6.9844; at 80 percent t* = 1.3178, 2 +/- 2.6356.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
const cardRow = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); const tr = c.querySelector("table.res tbody tr"); return { heads: Array.from(c.querySelectorAll("table.res thead th")).map((h) => h.textContent), cells: Array.from(tr.children).map((td) => td.textContent), text: c.textContent }; });
async function oneSample(page, conf) { await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "50"); if (conf != null) await page.fill("#f_conf", String(conf)); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); const alerts = []; page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  await menu(page, "T-Tests", "One Sample T-Test");
  const field = await page.evaluate(() => { const i = document.querySelector("#f_conf"); return { type: i.type, value: i.value, label: document.querySelector('label[for="f_conf"]').textContent.trim() }; });
  ok(field.type === "number" && field.value === "95" && /Confidence level \(percent\)/.test(field.label), "the confidence level is a number box, 95 by default", field);
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  // 98 percent
  await oneSample(page, 98); await run(page); let r = await cardRow(page);
  const lo = r.heads.findIndex((h) => /98% CI lower/.test(h));
  ok(lo > 0 && near(r.cells[lo], -2.9844, 0.002) && near(r.cells[lo + 1], 6.9844, 0.002), "98 percent: header says 98% CI and the ends match t* = 2.4922", { heads: r.heads, cells: r.cells });
  ok(/98% CI \[47\.02, 56\.98\]/.test(r.text), "98 percent: the APA line says 98% CI [47.02, 56.98]", r.text.match(/98% CI \[[^\]]*\]/) && r.text.match(/98% CI \[[^\]]*\]/)[0]);
  // the R script carries conf.level = 0.98
  await page.click('nav.menu .dd[data-name="Results"] .top'); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(400);
  const script = await page.evaluate(() => Array.from(document.querySelector("#out .card").querySelectorAll("pre")).map((p) => p.textContent).join("\n"));
  ok(/conf\.level = 0\.98/.test(script) && /Confidence level \(percent\): 98\b/.test(script), "the script lists the level as 98 and the R call says conf.level = 0.98", script.match(/conf\.level[^\n]*/) && script.match(/conf\.level[^\n]*/)[0]);
  // edit shows 98 in the box again
  await page.click('#out .card [data-act="edit"]'); await page.waitForSelector("#dlg.open");
  ok(await page.evaluate(() => document.querySelector("#f_conf").value) === "98", "edit shows 98 (not 0.98) in the box");
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  // 0.8 as a proportion works like 80
  await page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
  await oneSample(page, "0.8"); await run(page); r = await cardRow(page);
  const lo8 = r.heads.findIndex((h) => /80% CI lower/.test(h));
  ok(lo8 > 0 && near(r.cells[lo8], -0.6356, 0.002) && near(r.cells[lo8 + 1], 4.6356, 0.002), "0.8 typed as a proportion gives the 80 percent interval (t* = 1.3178)", { heads: r.heads, cells: r.cells });
  // an impossible level: a message under the box, no card
  await page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
  await oneSample(page, 120); await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForTimeout(300);
  const bad = await page.evaluate(() => ({ open: document.querySelector("#dlg").open, msg: (document.querySelector("#f_conf_msg") || {}).textContent || "", cards: document.querySelectorAll("#out .card").length }));
  ok(bad.open && /between 50 and 99\.99 percent/.test(bad.msg) && bad.cards === 0 && alerts.length === 0, "120 keeps the dialog open with a message under the box", bad);
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  // a course profile sets the level offered first
  await page.click('nav.menu .dd[data-name="Results"] .top'); await page.getByRole("menuitem", { name: "Course profile", exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true)));
  ok(await page.evaluate(() => document.querySelector("#f_conf").type) === "number", "the profile dialog takes a typed level");
  await page.fill("#f_conf", "90"); await page.fill("#f_name", "Stats 101"); await run(page);
  await menu(page, "T-Tests", "Independent Samples T-Test");
  ok(await page.evaluate(() => document.querySelector("#f_conf").value) === "90", "after the profile, dialogs offer 90 first");
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  // the t* calculator takes a percent
  await page.click('nav.menu .dd[data-name="distrACTION"] .top'); await page.getByRole("menuitem", { name: "T-Distribution", exact: true }).click(); await page.waitForTimeout(500);
  const tstar = await page.evaluate(() => { const k = document.querySelector("#d_kind"); if (!k) return null; k.value = "tstar"; k.dispatchEvent(new Event("change", { bubbles: true })); const c = document.querySelector("#d_conf"); return c ? { value: c.value, label: (document.querySelector('label[for="d_conf"]') || {}).textContent } : null; });
  ok(tstar && tstar.value === "95" && /percent/.test(tstar.label || ""), "the t* calculator's level box is a percent, 95 by default", tstar);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
