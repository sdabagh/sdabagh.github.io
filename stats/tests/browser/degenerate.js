// Degenerate data says so in words: a constant variable, a group with one value, one level, identical pairs, all ties.
// Before this, the cards showed NaN sixteen times and one case crashed with "Cannot read properties of null".
const { chromium } = require("playwright"); const fs = require("fs"), os = require("os"), path = require("path");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
(async () => {
  const file = path.join(os.tmpdir(), "sww-degenerate-" + process.pid + ".csv");
  fs.writeFileSync(file, "const,x,y,grp2,grp1,one,tie,x2\n" + [[5, 1, 2, "a", "a", "a", 1, 2], [5, 2, 4, "a", "a", "a", 1, 3], [5, 3, 6, "a", "a", "a", 1, 4], [5, 4, 8, "b", "a", "a", 1, 5], [5, 5, 10, "b", "a", "a", 1, 6], [5, 6, 12, "b", "a", "b", 1, 7]].map((r) => r.join(",")).join("\n"));
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); let alert = null; page.on("dialog", async (d) => { alert = d.message(); await d.dismiss(); });
  await page.goto(URL); await page.setInputFiles("#fileInput", file); await page.waitForFunction(() => /6 rows/.test(document.querySelector("#dsinfo").textContent));
  async function run(top, item, fill) {
    alert = null; await page.evaluate(() => { document.querySelector("#out").innerHTML = ""; });
    await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true)));
    await fill(); await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForTimeout(400);
    if (await page.evaluate(() => document.querySelector("#dlg").open)) await page.evaluate(() => document.querySelector("#dlg").close());
    const card = await page.evaluate(() => { const c = document.querySelector("#out .card"); return c ? c.textContent : null; });
    return { alert, card };
  }
  const sel = (id, v) => page.selectOption(id, v);
  let r = await run("T-Tests", "One Sample T-Test", async () => { await sel("#f_x", "const"); });
  ok(/const has no variation: every value is 5, so there is nothing to test/.test(r.alert), "one-sample t on a constant: message, no card", r.alert);
  r = await run("T-Tests", "Independent Samples T-Test", async () => { await sel("#f_x", "const"); await sel("#f_g", "grp2"); });
  ok(/no variation in either group \(every value is 5 in a and 5 in b\)/.test(r.alert), "independent t with constant groups", r.alert);
  r = await run("T-Tests", "Independent Samples T-Test", async () => { await sel("#f_x", "x"); await sel("#f_g", "one"); });
  ok(/Group b has only one numeric value of x; each group needs at least two/.test(r.alert), "independent t with a group of one: message instead of a crash", r.alert);
  r = await run("ANOVA", "One-Way ANOVA", async () => { await sel("#f_x", "const"); await sel("#f_g", "grp2"); });
  ok(/const has no variation within any group, so F is not defined/.test(r.alert), "ANOVA with a constant outcome", r.alert);
  r = await run("ANOVA", "One-Way ANOVA", async () => { await sel("#f_x", "x"); await sel("#f_g", "one"); });
  ok(/one needs at least two groups with two or more values of x; it has 1 \(b has fewer than two\)/.test(r.alert), "ANOVA with a group of one names the thin group", r.alert);
  r = await run("Regression", "Linear Regression", async () => { await sel("#f_x", "const"); await sel("#f_y", "y"); });
  ok(/const has no variation: every value is 5, so there is nothing to fit/.test(r.alert), "regression on a constant x", r.alert);
  r = await run("Regression", "Linear Regression", async () => { await sel("#f_x", "x"); await sel("#f_y", "y"); });
  ok(!r.alert && r.card && /Some numbers could not be computed \(shown as n\/a\)/.test(r.card) && /∞/.test(r.card) && !/NaN/.test(r.card), "a perfect fit: card with ∞ and n/a plus the note, no NaN", r.card && r.card.slice(0, 160));
  r = await run("Regression", "Correlation Matrix", async () => { await sel("#f_vars", ["x", "const"]); });
  ok(/No variation in const: a correlation needs values that differ/.test(r.alert), "correlation with a constant column", r.alert);
  r = await run("Nonparametric", "Mann-Whitney U (two groups)", async () => { await sel("#f_x", "const"); await sel("#f_g", "grp2"); });
  ok(/ranks are all tied/.test(r.alert), "Mann-Whitney with all ties", r.alert);
  r = await run("Nonparametric", "Kruskal-Wallis (three or more groups)", async () => { await sel("#f_x", "const"); await sel("#f_g", "grp2"); });
  ok(/ranks are all tied/.test(r.alert), "Kruskal-Wallis with all ties", r.alert);
  r = await run("Frequencies", "Contingency Tables: Independent Samples", async () => { await sel("#f_r", "grp2"); await sel("#f_c", "grp1"); });
  ok(/grp1 has only one level \(a\), so there is no association to test/.test(r.alert), "chi-square with a one-level column", r.alert);
  r = await run("Advanced", "Principal Component Analysis", async () => { await sel("#f_vars", ["x", "y", "const"]); });
  ok(/const has no variation; leave it out/.test(r.alert), "PCA with a constant column", r.alert);
  r = await run("Advanced", "Reliability (Cronbach's alpha)", async () => { await sel("#f_vars", ["x", "y", "const"]); });
  ok(/const has no variation; an item everyone answers the same way/.test(r.alert), "Cronbach's alpha with a constant item", r.alert);
  // paired: every pair differs by exactly 1
  r = await run("T-Tests", "Paired Samples T-Test", async () => { await sel("#f_a", "x2"); await sel("#f_b", "x"); });
  ok(/Every pair differs by the same amount \(1\), so the SD of the differences is 0/.test(r.alert), "paired t with a constant difference", r.alert);
  // the ordinary case still runs
  r = await run("T-Tests", "Independent Samples T-Test", async () => { await sel("#f_x", "x"); await sel("#f_g", "grp2"); });
  ok(!r.alert && r.card && /Independent Samples T-Test/.test(r.card) && !/n\/a|NaN/.test(r.card), "an ordinary t-test still runs with no n/a", r.alert);
  ok(errs.length === 0, "no page errors", errs);
  fs.unlinkSync(file); await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
