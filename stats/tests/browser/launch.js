// Store readiness: the manifest carries an id, categories, a maskable icon and screenshots that exist; the privacy
// policy is its own page and linked; the iOS metas are present; a script error shows on the page with the build stamp.
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE + "index.html");
  const m = await page.evaluate(async () => (await fetch("manifest.json")).json());
  ok(m.id === "./index.html" && m.lang === "en" && Array.isArray(m.categories) && m.categories.includes("education") && m.display === "standalone", "manifest has id, lang, categories, standalone display", { id: m.id, lang: m.lang, categories: m.categories });
  ok(m.icons.some((i) => i.sizes === "512x512" && /maskable/.test(i.purpose || "")) && m.icons.some((i) => i.sizes === "512x512" && !i.purpose), "manifest lists a maskable 512 icon and a plain one", m.icons);
  ok(Array.isArray(m.screenshots) && m.screenshots.length === 3 && m.screenshots.filter((s) => s.form_factor === "narrow").length === 2 && m.screenshots.some((s) => s.form_factor === "wide"), "manifest lists two phone screenshots and one wide", m.screenshots && m.screenshots.map((s) => s.src));
  for (const s of m.screenshots || []) { const r = await page.evaluate(async (u) => { const r = await fetch(u); return { ok: r.ok, type: r.headers.get("content-type") }; }, s.src); ok(r.ok && /png/.test(r.type), "screenshot exists: " + s.src, r); }
  const metas = await page.evaluate(() => ({ apple: !!document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]'), title: (document.querySelector('meta[name="apple-mobile-web-app-title"]') || {}).content, viewport: document.querySelector('meta[name="viewport"]').content }));
  ok(metas.apple && metas.title === "Stats" && /viewport-fit=cover/.test(metas.viewport), "iOS home-screen metas and viewport-fit=cover", metas);
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('header .hlinks a')).map((a) => [a.textContent, a.getAttribute("href")]));
  ok(links.some((l) => l[0] === "Privacy" && l[1] === "privacy.html"), "header links to the privacy page", links);
  // the error bar
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop completed with undelivered notifications." })));
  ok(await page.evaluate(() => document.querySelector("#errBar").hidden), "a ResizeObserver notice does not show the error bar");
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "boom from a test" })));
  const bar = await page.evaluate(() => ({ hidden: document.querySelector("#errBar").hidden, text: document.querySelector("#errBar").textContent }));
  ok(!bar.hidden && /Something went wrong \(build \d+\): boom from a test/.test(bar.text) && /Ctrl\+Shift\+R/.test(bar.text), "a script error shows on the page with the build stamp", bar);
  await page.click("#errNo"); ok(await page.evaluate(() => document.querySelector("#errBar").hidden), "Dismiss hides the error bar");
  await page.evaluate(() => window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.resolve(), reason: new Error("late failure") })));
  ok(await page.evaluate(() => !document.querySelector("#errBar").hidden && /late failure/.test(document.querySelector("#errBar").textContent)), "an unhandled rejection shows too");
  // the privacy page
  await page.goto(BASE + "privacy.html");
  const priv = await page.evaluate(() => ({ title: document.title, text: document.body.textContent, app: !!document.querySelector('a[href="index.html"]'), mail: !!document.querySelector('a[href^="mailto:"]') }));
  ok(/Privacy/.test(priv.title) && /no server and no account/.test(priv.text) && /Lexend/.test(priv.text) && priv.app && priv.mail, "privacy page: no server, the font fetch named, links back and a contact", { title: priv.title, app: priv.app, mail: priv.mail });
  // the guide and the download page link to it
  for (const p of ["guide.html", "download.html"]) { await page.goto(BASE + p); ok(await page.evaluate(() => !!document.querySelector('a[href="privacy.html"]')), p + " links to the privacy page"); }
  // the service worker precaches it
  const sw = await page.evaluate(async () => (await fetch("sw.js")).text());
  ok(/"\.\/privacy\.html"/.test(sw) && /"\.\/lang-es\.js"/.test(sw), "service worker precaches privacy.html and lang-es.js");
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
