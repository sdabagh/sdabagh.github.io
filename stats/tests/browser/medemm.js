const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(400); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), plots: c.querySelectorAll(".plot").length, text: c.textContent, apa: (c.querySelector(".apa code") || {}).textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL);
  // balanced 2 x 2 with 3 per cell: marginal means equal raw marginal means, SE = sqrt(MSE / 6)
  await menu(page, "Data", "Paste data"); await page.fill("#f_txt", "A,B,y\na1,b1,10\na1,b1,12\na1,b1,14\na1,b2,20\na1,b2,21\na1,b2,25\na2,b1,30\na2,b1,33\na2,b1,36\na2,b2,40\na2,b2,42\na2,b2,47"); await run(page);
  await menu(page, "ANOVA", "Two-Way ANOVA"); await page.selectOption("#f_y", "y"); await page.selectOption("#f_a", "A"); await page.selectOption("#f_b", "B"); await run(page);
  let c = await cardInfo(page);
  const emA = c.rows.find((t, i) => /Estimated marginal means of y by A/.test(c.caps[i] || "")), resid = c.rows[0].find((r) => r[0] === "Residuals"), mse = Number(resid[3]);
  ok(emA && near(emA[0][1], (10 + 12 + 14 + 20 + 21 + 25) / 6, 1e-3) && near(emA[1][1], (30 + 33 + 36 + 40 + 42 + 47) / 6, 1e-3) && near(emA[0][2], Math.sqrt(mse / 6), 1e-3), "balanced: marginal means equal raw means, SE = sqrt(MSE/6)", emA);
  const prA = c.rows.find((t, i) => /Pairwise comparisons of A marginal means/.test(c.caps[i] || "")); ok(prA && prA.length === 1 && prA[0][0] === "a1 vs a2" && Number(prA[0][5].replace(/[^0-9.]/g, "")) < 0.001 && prA[0][6] === "yes", "Tukey pairwise for A", prA && prA[0]);
  ok(/emmeans' default/.test(c.text), "marginal means explained");
  // mediation on the class data: c = c' + a b identity, bootstrap CI, R line
  await sample(page, "STATC1000_Class_Data.csv", 40);
  await menu(page, "Regression", "Mediation (indirect effect through a mediator)"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_m", "Hours_Study"); await page.fill("#f_reps", "1000"); await page.fill("#f_seed", "7"); await run(page); c = await cardInfo(page);
  const paths = Object.fromEntries(c.rows[0].map((r) => [r[0], Number(r[2])])), ind = c.rows[1][0];
  ok(/^Mediation/.test(c.title) && near(paths["c (total)"], paths["c' (direct)"] + paths["a"] * paths["b"], 2e-4) && near(ind[0], paths["a"] * paths["b"], 2e-4), "c = c' + a*b and the indirect effect", [paths, ind[0]]);
  ok(Number(ind[4]) <= Number(ind[0]) && Number(ind[5]) >= Number(ind[0]) && /1000 percentile bootstrap resamples, seed 7/.test(c.caps[1]) && c.plots === 1, "bootstrap interval brackets the estimate; seeded; histogram", [ind[4], ind[0], ind[5]]);
  ok(/indirect effect = /.test(c.apa || "") && /bootstrap CI \[/.test(c.apa || "") && /X before M before Y|come before/.test(c.text.replace(/\s+/g, " ")) , "APA line and the causal caveat", c.apa);
  // same seed, same interval
  const first = ind.slice(4, 6).join(); await menu(page, "Regression", "Mediation (indirect effect through a mediator)"); await page.selectOption("#f_y", "GPA"); await page.selectOption("#f_x", "Hours_Sleep"); await page.selectOption("#f_m", "Hours_Study"); await page.fill("#f_reps", "1000"); await page.fill("#f_seed", "7"); await run(page); c = await cardInfo(page);
  ok(c.rows[1][0].slice(4, 6).join() === first, "the seed reproduces the interval");
  await page.click(`nav.menu .dd[data-name="Results"] .top`); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(300);
  const R = await page.evaluate(() => document.querySelectorAll("#out .card pre.script")[1].textContent);
  ok(/mediation::mediate\(med\.fit, out\.fit, treat = "Hours_Sleep", mediator = "Hours_Study", boot = TRUE, sims = 1000\)/.test(R) && /set\.seed\(7\)/.test(R), "R script: mediate with boot", R.match(/mediate[^\n]*/) && R.match(/mediate[^\n]*/)[0]);
  await page.click("#askBtn"); await page.fill("#botIn", "does study time mediate the effect of sleep on GPA"); await page.press("#botIn", "Enter"); await page.waitForTimeout(150);
  ok(/Mediation: does X work through M/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask routes mediation");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
