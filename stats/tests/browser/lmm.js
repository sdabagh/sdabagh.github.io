const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function sample(page, f) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 180); }
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(400); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), plots: c.querySelectorAll(".plot").length, apa: (c.querySelector(".apa code") || {}).textContent, say: Array.from(c.querySelectorAll(".say, .ok, .warn")).map((s) => s.textContent.slice(0, 100)) }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL); await sample(page, "sleepstudy.csv");
  await menu(page, "Advanced", "Mixed-Effects Model (nested or repeated data)"); await page.selectOption("#f_y", "reaction_ms"); await page.selectOption("#f_xs", ["day"]); await page.selectOption("#f_g", "subject"); await run(page);
  let c = await cardInfo(page); const day = c.rows[0].find((r) => r[0] === "day"), icpt = c.rows[0].find((r) => r[0] === "Intercept");
  ok(c.title === "Mixed-Effects Model" && near(day[1], 10.4673, 0.001) && near(day[2], 0.8042, 0.001) && near(day[3], 13.015, 0.01) && day[4] === "161.0" && day[5] === "< 0.0001", "random intercept: day 10.467 (SE 0.804), t 13.02 on 161.0 df", day);
  ok(near(icpt[1], 251.405, 0.001) && icpt[4] === "22.8", "intercept 251.405 on 22.8 df", icpt);
  const re = c.rows[1]; ok(near(re[0][1], 1378.18, 0.05) && near(re[re.length - 1][1], 960.46, 0.05), "random effects: subject variance 1378.2, residual 960.5", re);
  const fit = Object.fromEntries(c.rows[2].map((r) => [r[0], r[1]])); ok(near(fit["REML criterion"], 1786.47, 0.01) && near(fit["ICC of subject (empty model)"], 0.3949, 0.002) && near(fit["Marginal R² (fixed effects)"], 0.2797, 0.003) && near(fit["Conditional R² (fixed + random)"], 0.7043, 0.003), "fit: REML 1786.47, ICC .395, R² marginal .280 conditional .704", fit);
  ok(c.rows[3] && Number(c.rows[3][0][1]) > 100 && c.rows[3][0][3] === "< 0.0001", "likelihood-ratio test for the random effects", c.rows[3]);
  ok(/t\(161\.0\) = 13\.02, p < \.001; ICC = \.39/.test(c.apa), "APA line", c.apa);
  ok(c.rows[4].length === 18 && c.plots === 2, "18 BLUP rows, caterpillar and residual plots", [c.rows[4].length, c.plots]);
  // random slope for day
  await menu(page, "Advanced", "Mixed-Effects Model (nested or repeated data)"); await page.selectOption("#f_y", "reaction_ms"); await page.selectOption("#f_xs", ["day"]); await page.selectOption("#f_g", "subject"); await page.selectOption("#f_slope", "day"); await run(page);
  c = await cardInfo(page); const d2 = c.rows[0].find((r) => r[0] === "day");
  ok(near(d2[2], 1.5458, 0.001) && d2[4] === "17.0" && near(d2[3], 6.771, 0.005), "random slope: SE 1.546, t 6.77 on 17.0 df", d2);
  const re2 = c.rows[1]; ok(near(re2[0][1], 612.09, 0.05) && near(re2[1][1], 35.07, 0.02) && near(re2[2][3], 0.0656, 0.002) && near(re2[3][1], 654.94, 0.05), "random slope: 612.1, 35.07, corr .066, residual 654.9", re2);
  // guard: slope not among fixed effects
  await menu(page, "Advanced", "Mixed-Effects Model (nested or repeated data)"); await page.selectOption("#f_y", "reaction_ms"); await page.selectOption("#f_g", "subject"); await page.selectOption("#f_slope", "day"); const dialogs = []; page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); }); await page.click("#dlg button.go"); await page.waitForTimeout(200); await page.click("#dlgCancel");
  ok(dialogs.length === 1 && /add day to the numeric predictors/.test(dialogs[0]), "a random slope without the fixed effect is refused", dialogs);
  // Ask routes the vocabulary
  await page.click("#askBtn"); await page.fill("#botIn", "students nested within classes"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => /Mixed-Effects Model/.test(Array.from(document.querySelectorAll("#botLog .bmsg.bot")).pop().textContent)), "Ask: 'students nested within classes' finds the mixed model");
  ok(errs.length === 0, "no page errors", errs);
  await page.keyboard.press("Escape"); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/lmm.png", clip: { x: 470, y: 90, width: 830, height: 810 } });
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
