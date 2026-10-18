// Sensitivity to a lurking variable: reproduce Cinelli and Hazlett (2020) Table 2 on the Darfur data in the browser.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(Number(a) - b) <= tol;
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], dialogs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  // engine unit checks against the NumPy reference
  const eng = await page.evaluate(() => { const R = SW.robustness({ t: 4.184, df: 783, q: 1, alpha: 0.05 }); const b = SW.ovbBound(0.00908, 0.10903, 1, 1); const a = SW.ovbAdjust({ est: 0.0973, se: 0.0233, df: 783, r2dz: b.r2dz, r2yz: b.r2yz }); return { r2yd: R.r2yd, rv: R.rv, rva: R.rva, r2dz: b.r2dz, r2yz: b.r2yz, adj: a.est, se: a.se, t: a.t }; });
  ok(near(eng.r2yd, 0.0219, 0.0002) && near(eng.rv, 0.1388, 0.0002) && near(eng.rva, 0.0763, 0.0003), "engine: partial R2, RV, RV alpha match the reference", eng);
  ok(near(eng.r2dz, 0.0092, 0.0001) && near(eng.r2yz, 0.1246, 0.0003) && near(eng.adj, 0.0752, 0.0003) && near(eng.se, 0.0219, 0.0002) && near(eng.t, 3.44, 0.02), "engine: 1x female bound matches the reference", eng);
  // the dialog on the Darfur sample
  await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", "darfur.csv"); await page.click("#dlg button.go");
  await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length === 1276);
  await page.click('nav.menu .dd[data-name="Regression"] .top'); await page.getByRole("menuitem", { name: "Sensitivity to a lurking variable", exact: true }).click(); await page.waitForSelector("#dlg.open");
  await page.selectOption("#f_y", "peacefactor"); await page.selectOption("#f_d", "directlyharmed");
  await page.selectOption("#f_xs", ["age", "farmer_dar", "herder_dar", "pastvoted", "hhsize_darfur", "female"]); await page.selectOption("#f_cs", ["village"]); await page.selectOption("#f_bench", "female");
  const t0 = Date.now(); await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 120000 }); const ms = Date.now() - t0;
  await page.waitForTimeout(500);
  const c = await page.evaluate(() => { const cd = document.querySelector("#out .card"); const tbs = cd.querySelectorAll("table.res"); const row = (t, i) => Array.from(t.querySelectorAll("tbody tr")[i].children).map((x) => x.textContent); return { title: cd.querySelector("h2").textContent, s: row(tbs[0], 0), b1: row(tbs[1], 0), b2: row(tbs[1], 1), b3: row(tbs[1], 2), cap: tbs[1].previousElementSibling.textContent, plots: cd.querySelectorAll(".plot").length, apa: cd.querySelector(".apa code").textContent, worked: cd.querySelectorAll("details.worked .formula").length, say: Array.from(cd.querySelectorAll(".say")).map((s) => s.textContent) }; });
  ok(c.title === "Sensitivity to a lurking variable" && ms < 120000, "card made on 1276 rows with a 485-dummy village fixed effect", { ms });
  ok(near(c.s[1], 0.0973, 0.0001) && near(c.s[2], 0.0233, 0.0001) && near(c.s[3], 4.184, 0.001) && c.s[4] === "783" && c.s[5] === "2.2%" && c.s[6] === "13.9%" && c.s[7] === "7.6%", "Table 2: estimate, SE, t, df, partial R2, RV, RV alpha", c.s);
  ok(/R2 0\.9% with directlyharmed and 10\.9% with peacefactor/.test(c.cap), "benchmark: female's own partial R2s", c.cap);
  ok(c.b1[0] === "1 × female" && c.b1[1] === "0.9%" && c.b1[2] === "12.5%" && near(c.b1[3], 0.0752, 0.0001) && near(c.b1[4], 0.0219, 0.0001) && near(c.b1[5], 3.44, 0.005), "1x female bound: 0.9%, 12.5%, 0.0752, 0.0219, 3.44", c.b1);
  ok(near(c.b2[3], 0.0529, 0.0001) && near(c.b3[3], 0.0304, 0.0001), "2x and 3x female bounds 0.0529 and 0.0304", [c.b2[3], c.b3[3]]);
  ok(c.plots === 1 && c.worked === 4 && /RV = 13\.9%/.test(c.apa), "contour plot, worked numbers and APA line present", c.apa);
  ok(c.say.some((s) => /explains 13\.9% of what is left of both directlyharmed and peacefactor would bring the estimate to zero/.test(s)) && c.say.some((s) => /One about 3 times as strong as female would make it not significant at α 0\.05, and none changes its sign/.test(s)), "plain-English reading", c.say.map((s) => s.slice(0, 90)));
  // no covariates, no benchmark: still a card
  await page.click('nav.menu .dd[data-name="Regression"] .top'); await page.getByRole("menuitem", { name: "Sensitivity to a lurking variable", exact: true }).click(); await page.waitForSelector("#dlg.open");
  await page.selectOption("#f_y", "peacefactor"); await page.selectOption("#f_d", "directlyharmed"); await page.selectOption("#f_bench", "");
  await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(200);
  const c2 = await page.evaluate(() => { const cd = document.querySelector("#out .card"); return { n: cd.querySelectorAll("table.res").length, say: cd.querySelector(".say").textContent.slice(0, 40), cap: cd.querySelector(".cap").textContent }; });
  ok(c2.n === 1 && /no covariates/.test(c2.cap), "no covariates: one table, says so", c2);
  // same column twice: message, no card
  await page.click('nav.menu .dd[data-name="Regression"] .top'); await page.getByRole("menuitem", { name: "Sensitivity to a lurking variable", exact: true }).click(); await page.waitForSelector("#dlg.open");
  await page.selectOption("#f_y", "age"); await page.selectOption("#f_d", "age"); await page.click("#dlg button.go"); await page.waitForTimeout(200);
  ok(dialogs.length === 1 && /same column/.test(dialogs[0]), "outcome = treatment is refused (the existing alert path for dialog errors)", dialogs);
  await page.click("#dlgCancel");
  await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/sens.png" });
  ok(errs.length === 0, "no page or console errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
