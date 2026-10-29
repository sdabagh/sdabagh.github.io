// Ask answers in Spanish when the interface is Spanish: every route and glossary entry has a Spanish title and answer
// (lang-es-ask.js), the buttons say "Abrir", the connectives are Spanish, and English mode is unchanged.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForFunction((n) => document.querySelectorAll("#botLog .bmsg").length > n + 1, before, { timeout: 5000 }); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => ({ text: m.textContent, buttons: Array.from(m.querySelectorAll("button")).map((b) => b.textContent), links: Array.from(m.querySelectorAll("a")).map((a) => a.textContent) })), before); }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL);
  // the dictionary covers every entry
  const cover = await page.evaluate(() => { const M = window.SWW_ES_ANSWERS || {}; return { n: Object.keys(M).length, allPairs: Object.values(M).every((v) => Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && v[0].length > 3) }; });
  ok(cover.n >= 120 && cover.allPairs, "the Spanish answer file has an entry for every route and glossary item", cover);
  // English first
  await page.click("#askBtn");
  let a = await ask(page, "what is a p-value?");
  ok(/^The p-value/.test(a[0].text) && !/El valor p/.test(a[0].text), "English interface: the English answer", a[0].text.slice(0, 50));
  // switch to Spanish
  await page.click("#langBtn"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.lang) === "es", "interface switched to Spanish");
  a = await ask(page, "¿qué es el valor p?");
  const note = a.find((m) => /Leído como/.test(m.text)), ans = a.find((m) => /^El valor p/.test(m.text));
  ok(note && !/en inglés por ahora/.test(note.text), "the 'read as' note no longer says the answers are in English", note && note.text);
  ok(ans && /Si H₀ fuera exactamente verdadera/.test(ans.text), "glossary: 'El valor p' with the Spanish explanation", ans && ans.text.slice(0, 80));
  ok(ans && ans.links.some((l) => /Glosario en la Guía de métodos|Más en la Guía de métodos/.test(l)), "the Methods Guide link is in Spanish", ans && ans.links);
  a = await ask(page, "comparar dos grupos");
  const route = a.find((m) => /^Dos grupos distintos, un número/.test(m.text));
  ok(route && /t de Welch/.test(route.text), "route: the independent t in Spanish", route ? route.text.slice(0, 90) : a.map((m) => m.text.slice(0, 40)));
  ok(route && route.buttons.some((b) => b === "Abrir Prueba t para muestras independientes"), "the Open button reads 'Abrir' with the Spanish menu name", route && route.buttons);
  ok(route && /Si los datos son sesgados o pocos:/.test(route.text) && route.links.some((l) => /Leer los pasos en la Guía de métodos/.test(l)), "the alternatives line and the guide link are Spanish", route && route.text.slice(-120));
  a = await ask(page, "antes y después");
  const paired = a.find((m) => /^Las mismas personas medidas dos veces/.test(m.text));
  ok(!!paired, "route: paired t in Spanish", a.map((m) => m.text.slice(0, 50)));
  a = await ask(page, "¿qué es la desviación estándar?");
  ok(a.some((m) => /^Desviación estándar y varianza/.test(m.text)), "glossary: standard deviation in Spanish", a.map((m) => m.text.slice(0, 50)));
  a = await ask(page, "riesgo relativo o razón de momios");
  ok(a.some((m) => /^Riesgo relativo y razón de momios|^Riesgo en dos grupos/.test(m.text)), "relative risk reaches a Spanish answer", a.map((m) => m.text.slice(0, 60)));
  // the 'also possible' connective
  const alsoEs = await page.evaluate(() => Array.from(document.querySelectorAll("#botLog .balso")).map((x) => x.textContent));
  ok(alsoEs.length > 0 && alsoEs.every((x) => /^(Además|Para ejecutarlo|También posible|En palabras sencillas)$/.test(x)), "the connectives between answers are Spanish", alsoEs.slice(0, 6));
  // back to English: English again
  await page.click("#langBtn"); await page.waitForTimeout(300);
  a = await ask(page, "what is a p-value?");
  ok(/^The p-value/.test(a[0].text), "back in English: the English answer again", a[0].text.slice(0, 40));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
