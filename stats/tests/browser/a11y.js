const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/fonts.googleapis|ERR_|net::/i.test(m.text())) errs.push(m.text()); });
  await p.goto("http://127.0.0.1:8765/learn/intro-stats/module-01/index.html");
  ok(await p.evaluate(() => { const ss = Array.from(document.styleSheets).find(s => (s.href || "").endsWith("style.css")); return ss && ss.cssRules[0] instanceof CSSImportRule; }), "style.css: @import is the first rule");
  ok(await p.evaluate(() => { const s = document.querySelector(".skip-link"); return s && s.getAttribute("href") === "#" + document.querySelector("main").id && getComputedStyle(s).top === "-60px"; }), "skip link present, hidden until focused");
  await p.keyboard.press("Tab"); await p.waitForFunction(() => getComputedStyle(document.activeElement).top === "8px"); ok(await p.evaluate(() => document.activeElement.classList.contains("skip-link")), "first Tab lands on the skip link and reveals it");
  await p.keyboard.press("Enter"); ok(await p.evaluate(() => document.activeElement === document.querySelector("main")), "activating it focuses main");
  await p.click("#a11y-trigger"); await p.click("#a11y-ruler-btn");
  ok(await p.evaluate(() => document.body.classList.contains("reading-ruler") && getComputedStyle(document.getElementById("a11y-ruler")).display === "block" && localStorage.getItem("a11y-ruler") === "true"), "reading ruler toggles on and persists");
  await p.mouse.move(100, 300); ok(await p.evaluate(() => Math.abs(parseFloat(document.getElementById("a11y-ruler").style.top) + document.getElementById("a11y-ruler").offsetHeight / 2 - 300) < 2), "ruler follows the pointer");
  await p.click("#a11y-dyslexia-btn"); ok(await p.evaluate(() => getComputedStyle(document.body).fontFamily.includes("Lexend")), "dyslexia toggle applies the Lexend family");
  await p.click("#a11y-reset-btn"); ok(await p.evaluate(() => !document.body.classList.contains("reading-ruler") && localStorage.getItem("a11y-ruler") === null), "reset clears the ruler");
  await p.emulateMedia({ reducedMotion: "reduce" }); ok(await p.evaluate(() => getComputedStyle(document.querySelector(".btn") || document.body).transitionDuration.match(/^(1e-06s|0\.001ms)$/) !== null), "reduced motion zeroes transitions");
  await p.emulateMedia({ reducedMotion: "no-preference" });
  for (const f of ["learn/math-young-minds/index.html", "learn/yalla-arabic/index.html", "learn/financial-literacy-stats/module-01/index.html", "learn/hayya-beena-naqraa/index.html", "learn/calculus-1/module-1/index.html", "learn/financial-literacy/horizon-bucks/currency.html", "free-courses.html", "learn/college-algebra/module-01/post-assessment.html", "learn/stats-with-r/index.html"]) {
    const r = await p.goto("http://127.0.0.1:8765/" + f); const has = await p.$("#a11y-trigger"), skip = await p.$(".skip-link");
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    ok(r.status() === 200 && !!has && !!skip, "panel + skip link on " + f, { wide });
  }
  await p.goto("http://127.0.0.1:8765/free-courses.html"); ok((await p.request.get("http://127.0.0.1:8765/learn/stats-with-r/index.html")).status() === 200 && await p.$('a[href="learn/stats-with-r/index.html"]'), "Statistics with R listed on the catalogue");
  await p.goto("http://127.0.0.1:8765/learn/college-algebra/module-01/post-assessment.html"); ok((await p.request.get("http://127.0.0.1:8765/learn/college-algebra/module-02/index.html")).status() === 200 && await p.$('a[href="../module-02/index.html"]'), "post-assessment links to Module 2");
  ok(errs.length === 0, "no page errors", errs);
  await b.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
})();
