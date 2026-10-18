// Check my work: a student's by-hand numbers against a result card.
// One Sample T-Test from summary statistics: mean 52, SD 10, n 25, test value 50.
// By hand: SE = 10/sqrt(25) = 2, t = (52-50)/2 = 1.0, df 24, two-sided p = 0.3273 (R: 2*pt(-1,24)),
// 95% CI for the difference = 2 ± 2.0639*2 = -2.128 to 6.128; Descriptives SE 2.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(200); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); const alerts = []; page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  await menu(page, "T-Tests", "One Sample T-Test");
  await page.selectOption("#f_mode", "summary");
  await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "50"); await run(page);
  const btn = await page.evaluate(() => { const b = document.querySelector('#out .card [data-act="check"]'); return b ? { text: b.textContent, aria: b.getAttribute("aria-label"), beforeCopy: b.nextElementSibling && b.nextElementSibling.dataset.act } : null; });
  ok(btn && btn.text === "check my work" && /^Check my work: One Sample T-Test/.test(btn.aria) && btn.beforeCopy === "copy", "card has a 'check my work' tool button before copy", btn);
  await page.click('#out .card [data-act="check"]'); await page.waitForSelector("#dlg.open");
  const labels = await page.evaluate(() => Array.from(document.querySelectorAll("#dlgForm label")).map((l) => l.textContent.trim()).filter(Boolean));
  ok(/Check my work: One Sample T-Test/.test(await page.evaluate(() => document.querySelector("#dlg h2, #dlg .title, #dlg").textContent)), "dialog is titled Check my work");
  ok(labels.some((l) => /Statistic$/.test(l)) && labels.some((l) => /· p$/.test(l)) && labels.some((l) => /CI lower/.test(l)) && labels.some((l) => /SE$/.test(l)), "dialog lists the card's numbers (statistic, p, CI lower, SE)", labels);
  const goLabel = await page.evaluate(() => document.querySelector("#dlg button.go").textContent.trim());
  ok(goLabel === "Check", "go button says Check", goLabel);
  // Index of each field by label
  const ix = await page.evaluate(() => { const m = {}; document.querySelectorAll("#dlgForm input[type=number]").forEach((inp) => { const lab = inp.closest("label") || document.querySelector(`label[for="${inp.id}"]`); const t = (lab ? lab.textContent : inp.id).trim(); m[t] = "#" + inp.id; }); return m; });
  const sel = (re) => { const k = Object.keys(ix).find((t) => re.test(t)); return k ? ix[k] : null; };
  const fStat = sel(/Statistic$/), fP = sel(/· p$/), fLo = sel(/CI lower/), fSE = sel(/SE$/), fSD = sel(/SD$/);
  ok(fStat && fP && fLo && fSE && fSD, "found the fields to fill", { fStat, fP, fLo, fSE, fSD });
  await page.fill(fStat, "1");            // right
  await page.fill(fP, "0.164");           // one-tailed p (0.3273 / 2)
  await page.fill(fLo, "-2.13");          // right within rounding
  await page.fill(fSE, "0.4");            // SD / n instead of SD / sqrt(n)
  await page.fill(fSD, "9.8");            // population SD: 10 * sqrt(24/25) = 9.798
  await run(page);
  const res = await page.evaluate(() => { const b = document.querySelector("#out .card .mycheck"); if (!b) return null; return { caps: Array.from(b.querySelectorAll(".cap")).map((c) => c.textContent), rows: Array.from(b.querySelectorAll("table.res tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)), text: b.textContent, count: document.querySelectorAll("#out .card .mycheck").length }; });
  ok(res && res.count === 1 && res.caps.length === 1 && res.caps[0] === "Check my work", "one Check my work block with a single caption", res && res.caps);
  const row = (re) => (res.rows || []).find((r) => re.test(r[0]));
  ok(row(/Statistic$/) && /✓ matches/.test(row(/Statistic$/)[3]), "t = 1 matches", row(/Statistic$/));
  ok(row(/· p$/) && /one-tailed p-value/.test(row(/· p$/)[3]), "p = .164 flagged as the one-tailed value", row(/· p$/));
  ok(row(/CI lower/) && /✓ matches/.test(row(/CI lower/)[3]), "CI lower -2.13 matches within rounding", row(/CI lower/));
  ok(row(/SE$/) && /square root of n/.test(row(/SE$/)[3]), "SE 0.4 flagged as missing the square root of n", row(/SE$/));
  ok(row(/SD$/) && /n − 1/.test(row(/SD$/)[3]) && /population/.test(row(/SD$/)[3]), "SD 9.8 flagged as the population formula", row(/SD$/));
  ok(/2 of 5 match/.test(res.text), "summary says 2 of 5 match", res.text.slice(-300));
  // Rerun replaces the block rather than stacking a second one
  await page.click('#out .card [data-act="check"]'); await page.waitForSelector("#dlg.open");
  await page.fill(fStat, "1"); await page.fill(fP, "0.327"); await run(page);
  const res2 = await page.evaluate(() => ({ count: document.querySelectorAll("#out .card .mycheck").length, text: document.querySelector("#out .card .mycheck").textContent }));
  ok(res2.count === 1 && /All 2 match/.test(res2.text), "second check replaces the first block; all 2 match", res2.text.slice(-200));
  // Sign flip and far off
  await page.click('#out .card [data-act="check"]'); await page.waitForSelector("#dlg.open");
  await page.fill(fStat, "-1"); await page.fill(fSE, "37"); await run(page);
  const res3 = await page.evaluate(() => Array.from(document.querySelectorAll("#out .card .mycheck table.res tbody tr")).map((tr) => Array.from(tr.children).map((td) => td.textContent)));
  ok(res3.some((r) => /Statistic$/.test(r[0]) && /sign is flipped/.test(r[3])), "t = -1 flagged as a flipped sign", res3);
  ok(res3.some((r) => /SE$/.test(r[0]) && /Far off/.test(r[3])), "SE 37 flagged as far off", res3);
  // Nothing typed
  await page.click('#out .card [data-act="check"]'); await page.waitForSelector("#dlg.open"); await page.click("#dlg button.go"); await page.waitForTimeout(300);
  const res4 = await page.evaluate(() => ({ open: document.querySelector("#dlg").open, blocks: document.querySelectorAll("#out .card .mycheck").length }));
  ok(res4.open && alerts.some((a) => /Type at least one number/.test(a)) && res4.blocks === 1, "empty check says to type a number, keeps the dialog open, does not stack blocks", { open: res4.open, blocks: res4.blocks, alerts });
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  ok(await page.evaluate(() => !document.querySelector("#out .card .mycheck .tblbtns")), "verdict table has no copy buttons");
  // Ask knows about it
  await page.click("#askBtn"); await page.fill("#botIn", "can you check my work?"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(300);
  const bot = await page.evaluate(() => document.querySelector("#botLog").textContent);
  ok(/check my work/i.test(bot) && /button/.test(bot), "Ask explains the check my work button", bot.slice(-300));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
