const ROOT = require("path").resolve(__dirname, "../../..");
const { chromium } = require("playwright");
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; require(ROOT + "/stats/stats.js"); const SWN = global.SW; const fs = require("fs");
const CSV = fs.readFileSync(ROOT + "/stats/data/STATC1000_Class_Data.csv", "utf8").trim().split("\n").map((l) => l.split(",")); const COLS = CSV[0], ROWS = CSV.slice(1); const colOf = (n) => ROWS.map((r) => r[COLS.indexOf(n)]);
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), text: c.textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], dialogs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  // ---- ships: Poisson with offset against R (MASS, Venables & Ripley 4th ed. 7.3)
  await sample(page, "ships.csv", 40);
  ok(await page.evaluate(() => ["type", "year", "period"].every((c) => ["nominal", "ordinal"].includes(window.__D ? window.__D.types[c] : "ordinal"))), "ships loaded");
  await menu(page, "Advanced", "Count Regression: Poisson and Negative Binomial");
  ok(await page.evaluate(() => !!document.querySelector("#f_exp") && !!document.querySelector("#f_ix") && !!document.querySelector("#f_refs") && !!document.querySelector("#f_sq")), "count dialog has Exposure and Model terms fields");
  await page.selectOption("#f_y", "incidents"); await page.selectOption("#f_cs", ["type", "year", "period"]); await page.selectOption("#f_exp", "service"); await page.fill("#f_refs", "year = 60, period = 60"); await page.selectOption("#f_fam", "poisson"); await run(page);
  let c = await cardInfo(page);
  const fit = c.rows[0][0], coef = c.rows[1];
  ok(near(fit[0], 38.695, 0.001) && fit[1] === "25", "residual deviance 38.695 on 25 df (R)", fit.slice(0, 2));
  const R = { "Intercept": [-6.40590, 0.21744], "type = B (vs A)": [-0.54334, 0.17759], "type = C (vs A)": [-0.68740, 0.32904], "type = D (vs A)": [-0.07596, 0.29058], "type = E (vs A)": [0.32558, 0.23588], "year = 65 (vs 60)": [0.69714, 0.14964], "year = 70 (vs 60)": [0.81843, 0.16977], "year = 75 (vs 60)": [0.45343, 0.23317], "period = 75 (vs 60)": [0.38447, 0.11827] };
  const got = Object.fromEntries(coef.map((r) => [r[0], [Number(r[1]), Number(r[2])]]));
  ok(Object.keys(R).every((k) => got[k] && near(got[k][0], R[k][0], 0.0002) && near(got[k][1], R[k][1], 0.0002)), "all nine coefficients and SEs match glm with offset(log(service)) to 4 decimals", got);
  ok(/6 rows with service of 0 or blank left out/.test(c.text) && /offset log\(service\)/.test(c.text) && /incidents per service/.test(c.text), "card explains the six dropped rows and the offset");
  // a bad reference level is refused with the levels listed
  await menu(page, "Advanced", "Count Regression: Poisson and Negative Binomial"); await page.selectOption("#f_y", "incidents"); await page.selectOption("#f_cs", ["type"]); await page.fill("#f_refs", "type = Z"); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === 1 && /type has no level "Z". Levels: A, B, C, D, E/.test(dialogs[0]), "bad reference level refused", dialogs);
  await page.click("#dlgCancel");
  // ---- class data: numeric by categorical interaction equals separate slopes per group
  await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "Advanced", "Multiple Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_xs", ["Hours_Study"]); await page.selectOption("#f_cs", ["Year"]); await page.fill("#f_ix", "Hours_Study * Year"); await run(page); c = await cardInfo(page);
  const coefs = Object.fromEntries(c.rows[1].map((r) => [r[0], Number(r[1])]));
  const check = (() => { const gpa = colOf("GPA"), hs = colOf("Hours_Study"), yr = colOf("Year"); const groups = {}; yr.forEach((g, i) => { if (gpa[i] !== "" && hs[i] !== "") (groups[g] = groups[g] || []).push([+hs[i], +gpa[i]]); });
    const slope = (pts) => { const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length; return pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0); };
    const ref = (Object.keys(coefs).find((n) => /^Year = .* \(vs /.test(n)) || "").match(/\(vs (.*)\)/)[1];
    return Object.keys(groups).map((g) => { const model = coefs["Hours_Study"] + (g === ref ? 0 : coefs[`Hours_Study × Year = ${g}`]); return [g, groups[g].length, slope(groups[g]), model]; }); })();
  ok(check.length >= 3 && check.every((q) => Math.abs(q[2] - q[3]) < 1.5e-4), "numeric × categorical interaction reproduces each group's own slope", check.map((q) => [q[0], q[1], +q[2].toFixed(5), +q[3].toFixed(5)]));
  // categorical by categorical: the regression R² equals the two-way ANOVA (cell means) model's
  await menu(page, "Advanced", "Multiple Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_cs", ["Year", "Employed"]); await page.fill("#f_ix", "Year * Employed"); await run(page); c = await cardInfo(page);
  const r2 = Number(c.rows[0][0][2]);
  const r2anova = (() => { const gpa = colOf("GPA"), a = colOf("Year"), b = colOf("Employed"); const keep = ROWS.map((_, i) => i).filter((i) => gpa[i] !== "" && a[i] !== "" && b[i] !== ""); const r = SWN.anova2(keep.map((i) => +gpa[i]), keep.map((i) => a[i]), keep.map((i) => b[i]), true); const yy = keep.map((i) => +gpa[i]), my = yy.reduce((a, b) => a + b, 0) / yy.length, tot = yy.reduce((a, b) => a + (b - my) ** 2, 0), res = r.rows.find((q) => q.source === "Residuals").ss; return 1 - res / tot; })();
  ok(near(r2, r2anova, 6e-5) && c.rows[1].some((r) => /^Year = \w+ × Employed = [\w -]+$/.test(r[0])), "categorical × categorical interaction: R² equals the two-way ANOVA model's", [r2, r2anova]);
  // interaction without a main effect warns; a * a is refused
  await menu(page, "Advanced", "Multiple Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_xs", ["Hours_Study"]); await page.fill("#f_ix", "Hours_Study * Hours_Sleep"); await run(page); c = await cardInfo(page);
  ok(/without the main effect Hours_Sleep/.test(c.text) && c.rows[1].some((r) => r[0] === "Hours_Study × Hours_Sleep"), "missing main effect: warned, product column present");
  await menu(page, "Advanced", "Multiple Linear Regression"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_xs", ["Hours_Study"]); await page.fill("#f_ix", "Hours_Study * Hours_Study"); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === 2 && /squared term/.test(dialogs[1]), "a * a is refused and points to Squared terms", dialogs[1]); await page.click("#dlgCancel");
  // logistic has Model terms and runs with an interaction
  await menu(page, "Advanced", "Logistic Regression"); ok(await page.evaluate(() => !!document.querySelector("#f_ix") && !!document.querySelector("#f_refs")), "logistic dialog has Model terms");
  await page.selectOption("#f_y", "Pet_Owner"); await page.fill("#f_succ", "Yes"); await page.selectOption("#f_xs", ["Hours_Study", "Hours_Sleep"]); await page.fill("#f_ix", "Hours_Study * Hours_Sleep"); await run(page); c = await cardInfo(page);
  ok(/Logistic Regression/.test(c.title) && c.rows[2].some((r) => r[0] === "Hours_Study × Hours_Sleep"), "logistic with a numeric × numeric interaction runs", c.rows[2].map((r) => r[0]));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
