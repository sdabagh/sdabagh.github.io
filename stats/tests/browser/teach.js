const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  let fails = 0; const errs = []; p.on("pageerror", e => errs.push(e.message));
  for (const [f, needle] of [["students.html", "Math 205 -- Applied Statistics in R"], ["math54.html", "Math C1000 – Introduction to Statistics"], ["about.html", "POPP"], ["publications.html", "Math 205, Applied Statistics in R"], ["math4.html", "not teaching Math 4 in Fall 2026"]]) {
    await p.goto("http://127.0.0.1:8765/" + f); const t = await p.textContent("body");
    const has = t.includes(needle), stale = /Summer 2025|Spring 2025/.test(t) && f !== "students.html" && f !== "math54.html";
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    console.log((has && !stale && !wide ? "PASS " : "FAIL ") + f, { has, stale, wide }); if (!(has && !stale && !wide)) fails++;
    for (const a of await p.$$eval("main a[href]", as => as.map(a => a.getAttribute("href")))) if (!/^(https?:|mailto:|#)/.test(a)) { const r = await p.request.get("http://127.0.0.1:8765/" + a.replace(/^\//, "")); if (r.status() !== 200) { console.log("FAIL link", f, a, r.status()); fails++; } }
  }
  console.log("errors", errs); if (errs.length) fails++;
  await b.close(); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0);
})();
