const { chromium } = require("playwright");
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1200, height: 900 } }); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("http://127.0.0.1:8765/stats/methods.html");
  const vis = (sel) => page.evaluate((s) => Array.from(document.querySelectorAll(s)).filter((e) => e.offsetParent !== null).length, sel);
  ok(await page.evaluate(() => document.body.classList.contains("ed-student")) && (await vis("main .pro")) === 0 && (await vis("main .stu")) > 0, "student edition by default: pro content hidden");
  await page.click("#edPro");
  ok(await page.evaluate(() => document.body.classList.contains("ed-pro")) && (await vis("main .pro")) > 10 && (await vis("main .stu")) === 0, "professional edition shows the pro sections");
  await page.reload(); ok(await page.evaluate(() => document.body.classList.contains("ed-pro")), "edition remembered");
  await page.click("#edStu"); await page.goto("http://127.0.0.1:8765/stats/methods.html#pro"); ok(await page.evaluate(() => document.body.classList.contains("ed-pro")), "#pro hash opens the professional edition");
  // every TOC link lands on a heading, every in-page link resolves
  const missing = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="#"]')).map((a) => a.getAttribute("href").slice(1)).filter((id) => !document.getElementById(id)));
  ok(missing.length === 0, "all in-page anchors resolve", missing);
  for (const f of ["stats/index.html", "stats/guide.html"]) { await page.goto("http://127.0.0.1:8765/" + f); const href = await page.evaluate(() => { const a = Array.from(document.querySelectorAll("a")).find((x) => /Methods guide/i.test(x.textContent)); return a && a.getAttribute("href"); }); ok(href === "methods.html", "Methods guide linked from " + f, href); }
  await page.goto("http://127.0.0.1:8765/stats/index.html"); ok(await page.evaluate(() => { const a = document.querySelector(".empty a[href^='methods.html']"); return !!a; }), "start screen links the Methods Guide");
  ok(errs.length === 0, "no page errors", errs);
  await page.goto("http://127.0.0.1:8765/stats/methods.html#pro"); await page.screenshot({ path: "/tmp/claude-0/-home-user-sdabagh-github-io/d1f78727-976a-5563-9438-424a059d401d/scratchpad/pw/methods.png", clip: { x: 0, y: 0, width: 1200, height: 900 } });
  await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
