const { chromium } = require("playwright");
const B = "http://127.0.0.1:8765/";
const PAGES = ["index.html", "about.html", "free-courses.html", "publications.html", "stats/index.html", "learn/intro-stats/index.html", "learn/intro-stats/module-01/lesson-01-what-is-stats.html", "learn/intro-stats/module-01/post-assessment.html", "instructor/data-science/grade-1/session-01-slides.html", "learn/differential-equations/index.html", "learn/differential-equations/module-7/index.html", "learn/differential-equations/module-6/index.html", "ai-tutor/simple-tutor.html", "research.html", "404.html", "learn/financial-literacy/index.html"];
(async () => {
  const browser = await chromium.launch(); let bad = 0;
  for (const p of PAGES) {
    const page = await browser.newPage(); const errs = [], failed = [];
    page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(B)) failed.push(r.status() + " " + r.url().replace(B, "")); });
    await page.goto(B + p, { waitUntil: "load" }); await page.waitForTimeout(400);
    const info = await page.evaluate(() => ({ title: document.title, url: location.pathname, canonical: (document.querySelector('link[rel=canonical]') || {}).href || "", og: !!document.querySelector('meta[property="og:title"]'), ld: document.querySelectorAll('script[type="application/ld+json"]').length, nav: !!document.querySelector("nav"), h1: (document.querySelector("h1") || {}).textContent || "" }));
    const ok = errs.length === 0 && failed.length === 0; if (!ok) bad++;
    console.log((ok ? "PASS " : "FAIL ") + p + "  -> " + info.url + " | " + info.title.slice(0, 50) + " | canon:" + (info.canonical ? "y" : "n") + " og:" + (info.og ? "y" : "n") + " ld:" + info.ld + (errs.length ? " | ERR " + errs.join("; ").slice(0, 160) : "") + (failed.length ? " | 404s " + failed.join(", ").slice(0, 160) : ""));
    await page.close();
  }
  await browser.close(); console.log(bad ? `\n${bad} FAILED` : "\nALL PASSED"); process.exit(bad ? 1 : 0);
})();
