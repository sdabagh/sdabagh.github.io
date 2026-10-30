// The numbers printed in Safaa's lab handout (STAT C1000E POPP, 8.3, Oct 29 2026) must keep coming out of the app:
// Calls for service, Binomial test, call_type = Traffic collision, Wald 95: 54 of 240, 0.225, 0.1722 to 0.2778;
// from counts 56 of 320 at 99 percent: 0.175, 0.1203 to 0.2297; the Team Work: mean 5.60, SD 2.36, n 230 gives
// 5.30 to 5.91 (t, df 229); 119 of 230 gives 0.517, 0.453 to 0.582. Both the handout's path (the default, a test with
// the interval alongside) and the interval-only path, whose worked box follows her four steps.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const card = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); const t = c.querySelector("table.res"); return { heads: Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent), cells: Array.from(t.querySelector("tbody tr").children).map((td) => td.textContent), text: c.textContent, worked: Array.from(c.querySelectorAll(".worked .formula")).map((f) => f.textContent) }; });
const at = (r, head) => { const i = r.heads.findIndex((h) => h === head || new RegExp("^" + head).test(h)); return i < 0 ? NaN : Number(r.cells[i]); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  // page 5 of the handout: the calls log, the handout's own path (Binomial test, default Perform)
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_calls_for_service.csv"); await run(page);
  await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_x", "call_type"); await page.fill("#f_succ", "Traffic collision"); await run(page); let r = await card(page);
  ok(at(r, "Count") === 54 && at(r, "Total") === 240 && near(at(r, "Proportion"), 0.225, 1e-9) && near(at(r, "95% CI lower"), 0.1722, 0.00005) && near(at(r, "upper"), 0.2778, 0.00005), "handout page 5: 54 of 240, 0.225, 0.1722 to 0.2778 on the handout's path", { heads: r.heads, cells: r.cells });
  // the same, interval only: the four steps, the sentence as a percent, the 20 percent claim inside
  await clear(page); await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_x", "call_type"); await page.fill("#f_succ", "Traffic collision"); await page.selectOption("#f_perform", "ci"); await run(page); r = await card(page);
  ok(near(at(r, "95% CI lower"), 0.1722, 0.00005) && near(at(r, "upper"), 0.2778, 0.00005) && near(at(r, "SE"), 0.0270, 0.0001), "interval only: the same ends, SE 0.0270", { heads: r.heads, cells: r.cells });
  ok(r.worked.length === 4 && /^Step 1: parameter p = the proportion of all cases that are call_type = Traffic collision .*(p hat|p̂) = x \/ n = 54 \/ 240 = 0\.225; confidence level 95 percent/.test(r.worked[0]) && /^Step 2: conditions: a random sample; successes 54 and failures 186, both at least 10 \(met\); SE = /.test(r.worked[1]) && /^Step 3: .*z\* \(95 percent\) = 1\.96; margin of error = z\* (times|×) SE = 1\.96 (times|×) 0\.027 = 0\.0528/.test(r.worked[2]) && /^Step 4: interval = (p hat|p̂) (plus or minus|±) ME = 0\.225 (plus or minus|±) 0\.0528 = 0\.1722 to 0\.2778/.test(r.worked[3]), "the worked box follows her four steps with the handout's numbers", r.worked);
  ok(/We are 95 percent confident that between 17\.2% and 27\.8% of all cases are call_type = Traffic collision/.test(r.text) && /The whole interval is below 0\.5: less than half/.test(r.text), "the sentence as a percent, and the more-than-half reading", r.text.match(/We are 95 percent[^.]*\./)[0]);
  // page 6: cameras on late, from counts, 99 percent
  await clear(page); await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xs", "56"); await page.fill("#f_n", "320"); await page.fill("#f_conf", "99"); await run(page); r = await card(page);
  ok(near(at(r, "Proportion"), 0.175, 1e-9) && near(at(r, "99% CI lower"), 0.1203, 0.00005) && near(at(r, "upper"), 0.2297, 0.00005), "handout page 6: 56 of 320 at 99 percent, 0.175, 0.1203 to 0.2297", { heads: r.heads, cells: r.cells });
  await clear(page); await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); await page.fill("#f_xs", "56"); await page.fill("#f_n", "320"); await page.fill("#f_conf", "99"); await run(page); r = await card(page);
  ok(near(at(r, "99% CI lower"), 0.1203, 0.00005) && near(at(r, "upper"), 0.2297, 0.00005) && /z\* \(99 percent\) = 2\.5758/.test(r.worked[2]), "interval only at 99 percent: the same ends and z* 2.5758", r.worked[2]);
  // page 7: the thumbtack, 96 of 150: more than half
  await clear(page); await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); await page.fill("#f_xs", "96"); await page.fill("#f_n", "150"); await run(page); r = await card(page);
  ok(near(at(r, "95% CI lower"), 0.5633, 0.0005) && /The whole interval is above 0\.5: more than half/.test(r.text), "handout page 7: 96 of 150, the whole interval above 0.5", r.text.match(/The whole interval[^.]*\./) && r.text.match(/The whole interval[^.]*\./)[0]);
  // page 8, Team Work: the mean (t, df 229) and the proportion
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); await page.fill("#f_xbar", "5.60"); await page.fill("#f_s", "2.36"); await page.fill("#f_n", "230"); await run(page); r = await card(page);
  ok(at(r, "df") === 229 && near(at(r, "95% CI lower"), 5.30, 0.0075) && near(at(r, "upper"), 5.91, 0.0075), "Team Work: mean 5.60, SD 2.36, n 230 gives 5.30 to 5.91 with df 229", { heads: r.heads, cells: r.cells });
  ok(r.worked.length === 4 && /^Step 1: parameter (mu|μ) = the mean of all value/.test(r.worked[0]) && /^Step 2: conditions: a random sample; n = 230 is at least 30 \(met\); SE = s \/ (sqrt|√)\(n\) = 2\.36 \/ (sqrt|√)\(230\) = 0\.1556/.test(r.worked[1]) && /^Step 3: (sigma|σ) not given, so t\* with df = n (minus|−) 1 = 229: t\* \(95 percent, df = 229\) = 1\.9704/.test(r.worked[2]) && /^Step 4: interval = (x bar|x̄) (plus or minus|±) ME = 5\.6 (plus or minus|±) 0\.3066 = 5\.2934 to 5\.9066/.test(r.worked[3]), "the mean interval's worked box follows the four steps", r.worked);
  await clear(page); await menu(page, "Frequencies", "2 Outcomes: Binomial test"); await page.selectOption("#f_mode", "summary"); await page.selectOption("#f_perform", "ci"); await page.fill("#f_xs", "119"); await page.fill("#f_n", "230"); await run(page); r = await card(page);
  ok(near(at(r, "Proportion"), 0.517, 0.0005) && near(at(r, "95% CI lower"), 0.453, 0.0005) && near(at(r, "upper"), 0.582, 0.0005) && /The interval includes 0\.5, so neither/.test(r.text), "Team Work: 119 of 230 gives 0.517, 0.453 to 0.582, and 'most riders' is not supported", { cells: r.cells });
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
