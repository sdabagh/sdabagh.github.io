const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, t) => Math.abs(Number(a) - b) <= t;
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 60000 }); await page.waitForTimeout(500); }
async function sample(page, f, n) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", f); await page.click("#dlg button.go"); await page.waitForFunction((n) => document.querySelectorAll("table.grid tbody tr").length === n, n); await page.waitForTimeout(100); }
const cardInfo = (page) => page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, caps: Array.from(c.querySelectorAll(".cap")).map((x) => x.textContent), rows: Array.from(c.querySelectorAll("table.res")).map((t) => Array.from(t.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent))), plots: c.querySelectorAll(".plot").length, text: c.textContent, apa: (c.querySelector(".apa code") || {}).textContent }; });
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.accept(); });
  await page.goto(URL); await sample(page, "cbpp.csv", 56);
  await menu(page, "Advanced", "Mixed-Effects Model for yes/no or counts (glmer)");
  await page.selectOption("#f_fam", "trials"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.getElementById("f_ys").checkVisibility() && document.getElementById("f_tr").checkVisibility() && !document.getElementById("f_y").checkVisibility() && !document.getElementById("f_yc").checkVisibility()), "trials mode shows successes and trials, hides the other outcome fields");
  await page.selectOption("#f_ys", "incidence"); await page.selectOption("#f_tr", "size"); await page.selectOption("#f_cs", ["period"]); await page.selectOption("#f_g", "herd"); await run(page);
  const c = await cardInfo(page);
  ok(/Mixed-Effects Logistic Regression/.test(c.title), "card title", c.title);
  const fe = Object.fromEntries(c.rows[0].map((r) => [r[0], r.slice(1).map(Number)]));
  const R = { Intercept: [-1.3983, 0.2312], "period = 2 (vs 1)": [-0.9919, 0.3032], "period = 3 (vs 1)": [-1.1282, 0.3228], "period = 4 (vs 1)": [-1.5797, 0.4220] };
  ok(Object.keys(R).every((k) => fe[k] && near(fe[k][0], R[k][0], 0.002) && Math.abs(fe[k][1] / R[k][1] - 1) < 0.015), "fixed effects match glmer (estimates to 3 decimals, SEs within 1.5 percent)", fe);
  ok(near(c.rows[1][0][1], 0.4123, 0.002) && near(c.rows[1][0][2], 0.6421, 0.002) && near(c.rows[1][0][3], 0.4123 / (0.4123 + Math.PI ** 2 / 3), 0.002), "herd variance 0.4123, SD 0.6421, latent ICC", c.rows[1][0]);
  const fit = Object.fromEntries(c.rows[2].map((r) => [r[0], r[1]])); ok(near(fit["AIC"], 194.1, 0.1) && near(fit["BIC"], 204.2, 0.1) && fit["Residual df"] === "51" && fit["Clusters (herd)"] === "15", "AIC 194.1, BIC 204.2, 51 residual df, 15 herds", fit);
  ok(c.rows[3].length === 1 && Number(c.rows[3][0][1]) > 10 && c.rows[3][0][2] === "1", "likelihood-ratio test for the random intercept on 1 df", c.rows[3][0]);
  ok(c.plots === 1 && /Cluster effects/.test(c.caps.join("|")) && /OR = 0\.37/.test(c.apa || "") && /ICC = \.11/.test(c.apa || ""), "caterpillar plot, cluster effects table, APA line with OR and ICC", c.apa);
  ok(/15 clusters: the between-cluster variance is estimable/.test(c.text) && /glmer, nAGQ = 1/.test(c.text), "conditions and method stated");
  // Script view line
  await page.click(`nav.menu .dd[data-name="Results"] .top`); await page.getByRole("menuitem", { name: "Script: every step, with the R code", exact: true }).click(); await page.waitForTimeout(300);
  const Rs = await page.evaluate(() => document.querySelectorAll("#out .card pre.script")[1].textContent);
  ok(/lme4::glmer\(cbind\(incidence, size - incidence\) ~ period \+ \(1 \| herd\), data = d, family = binomial\)/.test(Rs), "R script writes the glmer call", Rs.match(/glmer[^\n]*/) && Rs.match(/glmer[^\n]*/)[0]);
  // binary mode on the class data
  await sample(page, "STATC1000_Class_Data.csv", 40); await menu(page, "Advanced", "Mixed-Effects Model for yes/no or counts (glmer)"); await page.selectOption("#f_y", "Pet_Owner"); await page.fill("#f_succ", "Yes"); await page.selectOption("#f_xs", ["Hours_Study"]); await page.selectOption("#f_g", "Year"); await run(page);
  const c2 = await cardInfo(page); ok(/Mixed-Effects Logistic Regression/.test(c2.title) && c2.rows[0].length === 2 && /Events per predictor/.test(c2.text) && /4 clusters: fewer than 10/.test(c2.text), "binary mode runs with the few-clusters warning", c2.rows[0].map((r) => r.slice(0, 3)));
  await page.click("#askBtn"); await page.fill("#botIn", "logistic regression for patients within hospitals"); await page.press("#botIn", "Enter"); await page.waitForTimeout(150);
  ok(/glmer/.test(await page.evaluate(() => document.querySelector("#botLog").textContent)), "Ask routes to glmer");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
