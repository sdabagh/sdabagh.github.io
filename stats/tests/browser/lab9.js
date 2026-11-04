// Chapter 9, the hypothesis test, the way the course's own examples run: the calls log against the dispatch plan's
// claim of 20 percent (54 of 240 traffic collisions: p hat 0.225, SE0 = sqrt(0.2 x 0.8 / 240) = 0.0258, z = 0.968,
// two-sided p = 0.333, so the claim is believable), and the push-up mean against a claimed 44 (t = 0.78, p = 0.44).
// The StatCrunch-style block carries H0, HA and the Z-Stat or T-Stat; the course-named tables carry the same numbers.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300); }
const clear = (page) => page.evaluate(() => (document.querySelector("#out").innerHTML = ""));
const sc = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"), b = c.querySelector(".scblock"); return { title: b.querySelector(".sctitle").textContent, lines: Array.from(b.querySelectorAll(".scline")).map((l) => l.textContent), res: b.querySelector(".scres").textContent, heads: Array.from(b.querySelectorAll("thead th")).map((h) => h.textContent), rows: Array.from(b.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)), text: c.textContent }; });
const pnum = (t) => Number(String(t).replace(/[<>=\s]/g, ""));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  // the calls log: is 20 percent believable? one-proportion z test, Traffic collision, p0 0.20
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_calls_for_service.csv"); await run(page);
  await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_x", "call_type"); await page.fill("#f_succ", "Traffic collision"); await page.fill("#f_p0", "0.20"); await run(page); let r = await sc(page);
  ok(r.title === "One sample proportion hypothesis test:" && r.lines[0] === "p : Proportion of successes (call_type = Traffic collision)" && /^H[0₀] : p = 0\.2$/.test(r.lines[1]) && /^HA : p (≠|not equal to) 0\.2$/.test(r.lines[2]) && r.res === "Hypothesis test results:", "the block names p, H0: p = 0.2 and HA", { title: r.title, lines: r.lines });
  ok(r.heads.join("|") === "Proportion|Count|Total|Sample Prop.|Std. Err.|Z-Stat|P-value" && r.rows[0][0] === "p" && Number(r.rows[0][1]) === 54 && Number(r.rows[0][2]) === 240 && near(r.rows[0][3], 0.225, 1e-9) && near(r.rows[0][4], 0.0258, 0.00005) && near(r.rows[0][5], 0.9682, 0.0005) && near(pnum(r.rows[0][6]), 0.3329, 0.0005), "54 of 240 against 0.20: SE0 0.0258 from the claimed p, Z-Stat 0.968, P-value 0.333", r.rows[0]);
  ok(/fail to reject/i.test(r.text) && /not enough evidence/i.test(r.text), "the conclusion: fail to reject, the 20 percent claim is believable", r.text.match(/[^.]*fail to reject[^.]*\./i) && r.text.match(/[^.]*fail to reject[^.]*\./i)[0]);
  // one-sided: HA p greater than 0.20, p-value 0.1665
  await clear(page); await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_x", "call_type"); await page.fill("#f_succ", "Traffic collision"); await page.fill("#f_p0", "0.20"); await page.selectOption("#f_alt", "greater"); await run(page); r = await sc(page);
  ok(/^HA : p (>|greater than) 0\.2$/.test(r.lines[2]) && near(pnum(r.rows[0][6]), 0.1665, 0.0005), "one-sided greater: HA says so and the P-value halves to 0.1665", { line: r.lines[2], p: r.rows[0][6] });
  // overtime from counts: 39 of 200 against last year's 18 percent, z 0.55, p 0.58
  await clear(page); await menu(page, "Frequencies", "One proportion: z test"); await page.selectOption("#f_mode", "summary"); await page.fill("#f_xs", "39"); await page.fill("#f_n", "200"); await page.fill("#f_p0", "0.18"); await run(page); r = await sc(page);
  ok(r.title === "One sample proportion summary hypothesis test:" && near(r.rows[0][3], 0.195, 1e-9) && near(r.rows[0][5], 0.5522, 0.0005) && near(pnum(r.rows[0][6]), 0.5808, 0.0005), "39 of 200 against 0.18 from counts: Z-Stat 0.55, P-value 0.58", r.rows[0]);
  // the push-up mean against a claimed 44: T-Stat 0.78, p 0.44; H0 names 44
  await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "popp_academy_fitness.csv"); await run(page);
  await clear(page); await menu(page, "T-Tests", "One Sample T-Test"); await page.selectOption("#f_x", "pushups_week12"); await page.fill("#f_mu0", "44"); await run(page); r = await sc(page);
  ok(r.title === "One sample T hypothesis test:" && /^H[0₀] : (μ|mu) = 44$/.test(r.lines[1]) && near(r.rows[0][6], 0.7845, 0.0005) && near(pnum(r.rows[0][7]), 0.4359, 0.001), "push-ups against 44: T-Stat 0.78, P-value 0.44", { line: r.lines[1], row: r.rows[0] });
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
