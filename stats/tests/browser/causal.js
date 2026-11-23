// The Causal menu: each of the eight tools runs on its sample dataset and the card carries the numbers the engine check
// pinned against statsmodels, numpy and networkx (tests/checks/causal_check.js), plus the parts only a browser shows:
// the DAG picture, the saved propensity-score column, the plots, and the Spanish menu names.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(500); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const sample = async (page, f) => { await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", f); await run(page); };
const read = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); const tabs = Array.from(c.querySelectorAll("table.res")).map((t) => ({ cap: t.previousElementSibling && t.previousElementSibling.classList.contains("cap") ? t.previousElementSibling.textContent : "", heads: Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent), rows: Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)) })); return { title: c.querySelector("h2").textContent, tables: tabs, says: Array.from(c.querySelectorAll(".say, .ok, .warn")).map((s) => s.className + ": " + s.textContent), plots: c.querySelectorAll(".plot").length, svg: c.querySelectorAll("svg.dag").length, nodes: c.querySelectorAll("svg.dag rect").length, arrows: c.querySelectorAll("svg.dag line").length, text: c.textContent }; });
const tab = (r, re) => r.tables.find((t) => re.test(t.cap));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('nav.menu .dd[data-name="Causal"] .items button')).map((b) => b.textContent));
  ok(items.length === 8 && items[0].startsWith("Draw a DAG") && items[7].startsWith("Bounds"), "the Causal menu has the eight tools", items);
  // 1. DAG: the tutoring example, d-separation and backdoor with nothing conditioned on
  await menu(page, "Causal", "Draw a DAG: paths, d-separation, backdoor"); await run(page); let r = await read(page);
  ok(r.svg === 1 && r.nodes === 4 && r.arrows === 5, "the DAG is drawn: 4 variables, 5 arrows", { nodes: r.nodes, arrows: r.arrows });
  let t = tab(r, /3 paths between Tutoring and Test score/);
  ok(t && t.rows.length === 3 && t.rows.every((row) => row[1] === "open") && /not d-separated/.test(r.text), "d-separation: three paths, all open with nothing conditioned on", t && t.rows.map((x) => x.slice(0, 2)));
  t = tab(r, /Valid adjustment sets/);
  ok(t && t.rows.length === 1 && t.rows[0][0] === "{Family income, Prior GPA}" && t.rows[0][2] === "yes" && /Adjust for \{Family income, Prior GPA\}/.test(r.text), "backdoor: the one valid set is {Family income, Prior GPA}, minimal", t && t.rows);
  ok(/Family income -> Tutoring/.test(r.text) && (await page.$('#out .card [data-act="dagdl"]')) !== null, "the graph is shown as text with a download button");
  // the same graph conditioned on both confounders: d-separation fails only through the direct arrow
  await clear(page); await menu(page, "Causal", "Draw a DAG: paths, d-separation, backdoor"); await page.fill("#f_cond", "Family income, Prior GPA"); await run(page); r = await read(page);
  t = tab(r, /3 paths between/); ok(t && t.rows.filter((row) => row[1] === "open").length === 1 && t.rows.filter((row) => /blocked/.test(row[1])).length === 2 && /fork that is conditioned on: blocked/.test(r.text) && r.nodes === 4, "conditioned on both confounders: the two backdoor paths are blocked at the forks, the direct arrow stays open; shaded nodes drawn", t && t.rows.map((x) => x.slice(0, 2)));
  // an unobserved confounder: no valid set
  await clear(page); await menu(page, "Causal", "Draw a DAG: paths, d-separation, backdoor"); await page.fill("#f_edges", "Motivation -> Tutoring\nMotivation -> Test score\nTutoring -> Test score"); await page.fill("#f_cond", ""); await page.fill("#f_unobs", "Motivation"); await run(page); r = await read(page);
  ok(/No valid adjustment set from the measured variables/.test(r.text) && /unobserved Motivation/.test(r.text), "an unobserved confounder: the card says no valid set from measured variables and names it", r.says.filter((s) => /warn/.test(s)));
  // a bad line is caught in the dialog
  await menu(page, "Causal", "Draw a DAG: paths, d-separation, backdoor"); await page.fill("#f_edges", "A -> B\nB -> A"); await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForTimeout(300);
  const dlgOpen = await page.evaluate(() => document.querySelector("#dlg").open), msg = await page.evaluate(() => (document.querySelector("#f_edges_msg") || {}).textContent || "");
  ok(dlgOpen && /loop/.test(msg), "a loop is refused under the field", msg); await page.click("#dlgCancel");
  // 2. standardization on the bike lanes
  await sample(page, "causal_bike_lanes.csv"); await clear(page);
  await menu(page, "Causal", "Adjust by groups (standardization)"); await page.selectOption("#f_y", "crashes_per_year"); await page.selectOption("#f_t", "bike_lane"); await page.fill("#f_tlv", "yes"); await page.selectOption("#f_s", ["street_type"]); await run(page); r = await read(page);
  t = tab(r, /Crude and standardized/); ok(t && near(t.rows[0][3], 2.8104, 0.001) && near(t.rows[1][3], -2.2144, 0.001) && /Simpson/.test(r.text), "standardization: crude 2.81, standardized -2.21, Simpson named", t && t.rows.map((x) => x[3]));
  // 3. IPW on tutoring, with the saved column and the overlap plot
  await sample(page, "causal_tutoring.csv"); await clear(page);
  await menu(page, "Causal", "Propensity score and inverse probability weighting"); await page.selectOption("#f_t", "tutoring"); await page.fill("#f_tlv", "yes"); await page.selectOption("#f_xs", ["family_income", "prior_gpa"]); await page.selectOption("#f_y", "test_score"); await page.fill("#f_reps", "200"); await run(page); r = await read(page);
  t = tab(r, /^Effects/); ok(t && near(t.rows[0][1], 7.374, 0.01) && near(t.rows[1][1], 5.862, 0.01) && near(t.rows[2][1], 6.045, 0.01) && Number(t.rows[1][2]) < 5.862 && Number(t.rows[1][3]) > 5.862, "IPW: crude 7.37, ATE 5.86 with a bootstrap interval around it, ATT 6.05", t && t.rows.map((x) => x.slice(0, 4)));
  t = tab(r, /Balance/); ok(t && t.rows.length === 2 && Math.abs(Number(t.rows[0][6])) < 0.1 && Math.abs(Number(t.rows[1][6])) < 0.1 && t.rows.every((x) => x[7] === "balanced"), "balance table: both covariates balanced after weighting", t && t.rows.map((x) => [x[0], x[3], x[6]]));
  const cols = await page.evaluate(() => Array.from(document.querySelectorAll("#grid thead th")).map((h) => h.textContent.trim().split("\n")[0]));
  ok(r.plots === 1 && cols.some((c) => /^ps_tutoring/.test(c)) && /saved in the new column ps_tutoring/.test(r.text), "the overlap plot is drawn and the propensity score is saved as a column", cols.filter((c) => /ps_/.test(c)));
  // 4. matching
  await clear(page); await menu(page, "Causal", "Matching on the propensity score"); await page.selectOption("#f_t", "tutoring"); await page.fill("#f_tlv", "yes"); await page.selectOption("#f_xs", ["family_income", "prior_gpa"]); await page.selectOption("#f_y", "test_score"); await run(page); r = await read(page);
  t = tab(r, /Effect on the treated/); ok(t && near(t.rows[0][1], 6.613, 0.01) && near(t.rows[0][2], 0.968, 0.01), "matching: ATT 6.61 with the paired SE 0.97", t && t.rows[0].slice(0, 3));
  t = tab(r, /^Matches/); ok(t && Number(t.rows[0][0]) === 87 && Number(t.rows[0][1]) === 87 && Number(t.rows[0][4]) === 27, "87 treated all matched, 27 distinct untreated rows used", t && t.rows[0]);
  // 5. instrumental variables: Wald and 2SLS without covariates, then with
  await clear(page); await menu(page, "Causal", "Instrumental variables (Wald ratio, 2SLS)"); await page.selectOption("#f_y", "test_score"); await page.selectOption("#f_t", "tutoring"); await page.fill("#f_tlv", "yes"); await page.selectOption("#f_z", "lottery_offer"); await page.fill("#f_zlv", "yes"); await run(page); r = await read(page);
  t = tab(r, /Two-stage least squares/); const w = tab(r, /Wald ratio/);
  ok(w && t && near(t.rows[1][1], 4.862, 0.01) && /= 4\.86/.test(r.text) && /above 10/.test(r.text) && near(w.rows[2][1], Number(w.rows[0][1]) - Number(w.rows[1][1]), 1e-6), "IV: Wald ratio 4.86 equals the 2SLS slope; first-stage F above 10", { tsls: t && t.rows[1].slice(0, 3), wald: w && w.rows });
  await clear(page); await menu(page, "Causal", "Instrumental variables (Wald ratio, 2SLS)"); await page.selectOption("#f_y", "test_score"); await page.selectOption("#f_t", "tutoring"); await page.fill("#f_tlv", "yes"); await page.selectOption("#f_z", "lottery_offer"); await page.fill("#f_zlv", "yes"); await page.selectOption("#f_xs", ["family_income", "prior_gpa"]); await run(page); r = await read(page);
  t = tab(r, /Two-stage least squares/); ok(t && near(t.rows[1][1], 5.894, 0.01) && t.rows.length === 4 && !tab(r, /Wald ratio/), "2SLS with covariates: 5.89, no Wald table", t && t.rows.map((x) => x.slice(0, 2)));
  // 8. bounds on passed
  await clear(page); await menu(page, "Causal", "Bounds with no assumptions (Manski)"); await page.selectOption("#f_y", "passed"); await page.fill("#f_ylv", "yes"); await page.selectOption("#f_t", "tutoring"); await page.fill("#f_tlv", "yes"); await run(page); r = await read(page);
  t = tab(r, /Bounds that use no assumption/); ok(t && near(t.rows[2][1], -0.2667, 0.001) && near(t.rows[2][2], 0.7333, 0.001) && near(t.rows[2][3], 1, 1e-6), "Manski: effect between -0.267 and 0.733, width 1", t && t.rows[2]);
  // 6. difference in differences on the bus routes
  await sample(page, "causal_bus_routes.csv"); await clear(page);
  await menu(page, "Causal", "Difference in differences (2 by 2)"); await page.selectOption("#f_y", "riders_per_day"); await page.selectOption("#f_g", "route_group"); await page.fill("#f_glv", "new schedule"); await page.selectOption("#f_p", "period"); await page.fill("#f_plv", "after"); await run(page); r = await read(page);
  t = tab(r, /^Difference in differences/); ok(t && near(t.rows[0][0], 83.6, 0.01) && near(t.rows[0][1], 40.72, 0.01) && r.plots === 1, "DiD 83.6, SE 40.7, picture drawn", t && t.rows[0].slice(0, 2));
  // 7. regression discontinuity on the scholarship
  await sample(page, "causal_scholarship_rd.csv"); await clear(page);
  await menu(page, "Causal", "Regression discontinuity (sharp)"); await page.selectOption("#f_y", "credits_completed"); await page.selectOption("#f_x", "hs_gpa"); await page.fill("#f_c", "3"); await page.fill("#f_h", "0.5"); await run(page); r = await read(page);
  t = tab(r, /Effect at the cutoff/); ok(t && near(t.rows[0][0], 5.881, 0.01) && near(t.rows[0][1], 1.009, 0.01) && r.plots === 1, "RD: jump 5.88, SE 1.01 within bandwidth 0.5, picture drawn", t && t.rows[0].slice(0, 2));
  // Spanish menu names
  await page.click("#langBtn"); await page.waitForTimeout(400);
  const es = await page.evaluate(() => ({ top: document.querySelector('nav.menu .dd[data-name="Causal"] .top').textContent, items: Array.from(document.querySelectorAll('nav.menu .dd[data-name="Causal"] .items button')).map((b) => b.textContent) }));
  ok(es.top === "Causal" && es.items[0].startsWith("Dibujar un DAG") && es.items[7].startsWith("Cotas"), "menu names in Spanish", es.items);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
