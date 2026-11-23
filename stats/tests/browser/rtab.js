// The R page: webR starts when the page opens (served locally from the test folder's webr package through ?webr=),
// the sample datasets are in R by name and the open table as `data`, a t test prints the numbers the app's engine
// gives, a plot comes back as a canvas, an error is shown as text, Ctrl+Enter runs, and the controls are labeled.
const { chromium } = require("playwright");
const PORT = process.env.SWW_PORT || 8765, URL = `http://127.0.0.1:${PORT}/stats/index.html?webr=/stats/tests/node_modules/webr/dist/`;
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); }
async function runCode(page, code) { const n = await page.evaluate(() => document.querySelectorAll("#rOut .rrun").length); await page.fill("#rCode", code); await page.click("#rRun"); await page.waitForFunction((k) => document.querySelectorAll("#rOut .rrun").length > k, n, { timeout: 120000 }); return page.evaluate(() => { const b = document.querySelector("#rOut .rrun"); return { text: (b.querySelector(".rtext") || {}).textContent || "", err: !!b.querySelector(".rerr"), plots: b.querySelectorAll("canvas.rplot").length, status: document.querySelector("#rStatus").textContent }; }); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('nav.menu .dd[data-name="R"] .items button')).map((b) => b.textContent));
  ok(items.length === 8 && items[0] === "Run R code" && items.slice(1).every((t) => /^Example: /.test(t)), "the R menu: Run R code and seven examples", items);
  await menu(page, "R", "Run R code");
  ok(await page.evaluate(() => document.body.classList.contains("view-r") && document.querySelector("#toolTitle").textContent === "R" && /Starting R/.test(document.querySelector("#rStatus").textContent)), "the R page opens and says R is starting");
  await page.waitForFunction(() => /R is ready/.test(document.querySelector("#rStatus").textContent) || /could not start/.test(document.querySelector("#rStatus").textContent), null, { timeout: 180000 });
  const st = await page.evaluate(() => document.querySelector("#rStatus").textContent);
  ok(/R is ready \(webR 0\.6\.1, R 4\./.test(st) && /24 datasets loaded/.test(st), "webR 0.6.1 starts and loads the 24 sample datasets", st);
  const dl = await page.evaluate(() => ({ n: document.querySelectorAll("#rData details").length, first: document.querySelector("#rData details summary").textContent.trim().slice(0, 40), cols: document.querySelector("#rData details p").textContent.slice(0, 60) }));
  ok(dl.n === 24 && dl.cols.length > 10, "the datasets list shows every dataset with its columns", dl);
  // the one-sample t test prints the same numbers as the app's engine (mean 44.85, t 4.4761 against 40)
  let r = await runCode(page, "t.test(popp_academy_fitness$pushups_week12, mu = 40)");
  ok(/t = 4\.476/.test(r.text) && /df = 59/.test(r.text) && /44\.85/.test(r.text) && !r.err, "t.test on the push-ups: t = 4.476, df = 59, mean 44.85", r.text.slice(0, 200));
  // a plot
  r = await runCode(page, "hist(popp_academy_fitness$pushups_week12)\nqqnorm(popp_academy_fitness$pushups_week12)");
  ok(r.plots >= 1 && !r.err, "a histogram and a QQ plot come back as a canvas", { plots: r.plots });
  // an error is text, not a crash; a warning too
  r = await runCode(page, "mean(nothere)");
  ok(r.err && /Error: object 'nothere' not found/.test(r.text), "an error prints as text in the output", r.text);
  r = await runCode(page, "as.numeric(\"abc\")");
  ok(/Warning: NAs introduced/.test(r.text) && /NA/.test(r.text), "a warning prints as text with the result", r.text);
  // the open table as data
  await page.click("#backData"); await menu(page, "Data", "Sample datasets"); await page.selectOption("#f_f", "causal_bus_routes.csv"); await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open); await page.waitForTimeout(300);
  await menu(page, "R", "Run R code");
  r = await runCode(page, "nrow(data); names(data)[1]");
  ok(/\[1\] 40/.test(r.text) && /route_id/.test(r.text), "the open table is `data` in R (40 rows, first column route_id)", r.text);
  // an example loads into the box; Ctrl+Enter runs it
  await menu(page, "R", "Example: Welch two-sample t test");
  const code = await page.inputValue("#rCode"); ok(/t\.test\(test_score ~ tutoring/.test(code), "an example loads into the code box", code.split("\n")[0]);
  const before = await page.evaluate(() => document.querySelectorAll("#rOut .rrun").length); await page.focus("#rCode"); await page.keyboard.press("Control+Enter"); await page.waitForFunction((k) => document.querySelectorAll("#rOut .rrun").length > k, before, { timeout: 60000 });
  r = await page.evaluate(() => ({ text: document.querySelector("#rOut .rrun .rtext").textContent })); ok(/Welch Two Sample t-test/.test(r.text) && /tutoring/.test(r.text), "Ctrl+Enter runs the Welch example", r.text.slice(0, 80));
  // accessibility: labeled code box, status region, output region
  const a11y = await page.evaluate(() => ({ label: (document.querySelector('label[for="rCode"]') || {}).textContent, status: document.querySelector("#rStatus").getAttribute("role"), live: document.querySelector("#rOut").getAttribute("aria-live"), plotRole: (document.querySelector("#rOut canvas") || {}).getAttribute && document.querySelector("#rOut canvas").getAttribute("role") }));
  ok(a11y.label === "R code" && a11y.status === "status" && a11y.live === "polite" && a11y.plotRole === "img", "labeled code box, status region, live output, plots as images", a11y);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
