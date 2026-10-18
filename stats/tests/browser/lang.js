// Spanish interface: Results > Language / Idioma (or the header button) translates menus, dialogs, buttons and the shell;
// result cards and internal keys stay English; the choice persists across a reload; Ask reads Spanish questions.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(250); }
const tops = (page) => page.evaluate(() => Array.from(document.querySelectorAll("nav.menu .dd .top")).map((b) => b.textContent.trim()));
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { await d.dismiss(); });
  await page.goto(URL);
  ok((await tops(page))[3] === "T-Tests" && (await page.evaluate(() => document.documentElement.lang)) === "en", "English by default in an en-US browser", await tops(page));
  const lb = await page.evaluate(() => { const b = document.querySelector("#langBtn"); return b && { text: b.textContent, lang: b.getAttribute("lang") }; });
  ok(lb && lb.text === "Español" && lb.lang === "es", "header offers Español", lb);
  // Switch through the Results menu
  await menu(page, "Results", "Language / Idioma");
  const opts = await page.evaluate(() => Array.from(document.querySelectorAll("#f_l option")).map((o) => o.textContent));
  ok(opts.join("|") === "English|Español", "language dialog lists English and Español", opts);
  await page.selectOption("#f_l", "es"); await run(page);
  let t = await tops(page);
  ok(t[0] === "Datos" && t[3] === "Pruebas t" && t[8] === "No paramétricas" && t[10] === "Avanzado" && t[11] === "Resultados", "menu bar in Spanish", t);
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('nav.menu .dd[data-name="T-Tests"] [role=menuitem]')).map((e) => e.textContent.trim()));
  ok(items.includes("Prueba t para una muestra") && items.includes("¿Qué prueba?"), "menu items in Spanish, data-name key still English", items);
  const shell = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector("header h1 span").textContent, tabA: document.querySelector("#tabA").textContent.trim(), dsname: document.querySelector("#dsname").textContent, widen: document.querySelector("#paneToggle").textContent, ask: document.querySelector("#askBtn").textContent, ph: document.querySelector("#botIn").placeholder, guide: document.querySelector('header .hlinks a[href="guide.html"]').textContent, btn: document.querySelector("#langBtn").textContent, empty: (document.querySelector("#grid .empty h2") || {}).textContent, card: document.querySelector("#out .card h2").textContent }));
  ok(shell.lang === "es" && /herramienta estadística gratuita/.test(shell.h1) && /^Análisis/.test(shell.tabA) && shell.dsname === "Sin datos cargados" && shell.widen === "Ampliar la tabla" && shell.ask === "Preguntar" && /comparar dos grupos/.test(shell.ph) && shell.guide === "Guía de uso" && shell.btn === "English" && shell.empty === "Aún no hay datos", "page shell translated (html lang, header, tabs, data bar, Ask, start screen)", shell);
  ok(shell.card === "Language", "the result card title stays English", shell.card);
  // A dialog: One Sample T-Test from summary statistics
  await page.click('nav.menu .dd[data-name="T-Tests"] .top'); await page.getByRole("menuitem", { name: "Prueba t para una muestra", exact: true }).click(); await page.waitForSelector("#dlg.open");
  await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true)));
  const dlg = await page.evaluate(() => ({ title: document.querySelector("#dlgTitle").textContent, labels: Array.from(document.querySelectorAll("#dlgForm label")).map((l) => l.textContent.trim()), legends: Array.from(document.querySelectorAll("#dlgForm legend, #dlgForm summary")).map((l) => l.textContent.trim()), go: document.querySelector("#dlg button.go").textContent.trim(), cancel: document.querySelector("#dlgCancel").textContent.trim(), hyp: Array.from(document.querySelectorAll("#f_alt option")).map((o) => o.textContent) }));
  ok(dlg.title === "Pruebas t: Prueba t para una muestra", "dialog title in Spanish", dlg.title);
  ok(dlg.labels.includes("Valor de prueba") && dlg.labels.includes("Intervalo de confianza") && dlg.labels.includes("Hipótesis"), "field labels in Spanish", dlg.labels);
  ok(dlg.legends.some((l) => /^Estadísticos de resumen/.test(l)), "group legends in Spanish", dlg.legends);
  ok(dlg.go === "Ejecutar" && dlg.cancel === "Cancelar", "Run and Cancel in Spanish", [dlg.go, dlg.cancel]);
  ok(dlg.hyp[0] === "La media es distinta del valor de prueba", "hypothesis options in Spanish", dlg.hyp);
  await page.selectOption("#f_mode", "summary"); await page.fill("#f_xbar", "52"); await page.fill("#f_s", "10"); await page.fill("#f_n", "25"); await page.fill("#f_mu0", "50"); await run(page);
  const c = await page.evaluate(() => { const c = document.querySelector("#out .card"); return { title: c.querySelector("h2").textContent, tools: Array.from(c.querySelectorAll(".tools button")).map((b) => b.textContent), stat: c.querySelector("table.res tbody tr").children[2].textContent }; });
  ok(c.title === "One Sample T-Test" && Number(c.stat) === 1, "the card is the same English card with the same numbers", c);
  ok(c.tools.includes("editar") && c.tools.includes("revisar mi trabajo") && c.tools.includes("quitar"), "card tool buttons in Spanish", c.tools);
  // A folded group reads "más opciones"
  await page.click('nav.menu .dd[data-name="Frequencies"] .top'); await page.getByRole("menuitem", { name: "Tablas de contingencia: muestras independientes", exact: true }).click(); await page.waitForSelector("#dlg.open");
  const sums = await page.evaluate(() => Array.from(document.querySelectorAll("#dlgForm details.more summary")).map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  ok(sums.some((l) => /^Porcentajes más opciones$/.test(l)), "folded groups read 'más opciones'", sums);
  await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open);
  // Ask in Spanish
  await page.click("#askBtn"); await page.fill("#botIn", "quiero comparar dos grupos de personas distintas"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(400);
  const bot = await page.evaluate(() => document.querySelector("#botLog").textContent);
  ok(/Leído como: "I want compare two groups of different people"/.test(bot) && /Independent Samples T-Test/.test(bot), "Ask reads the Spanish question and routes to the independent t-test", bot.slice(-400));
  await page.fill("#botIn", "antes y después"); await page.click("#botForm button[type=submit]"); await page.waitForTimeout(400);
  const bot2 = await page.evaluate(() => document.querySelector("#botLog").textContent);
  ok(/Paired Samples T-Test/.test(bot2), "'antes y después' routes to the paired t-test", bot2.slice(-300));
  // Persists across a reload
  await page.reload(); await page.waitForSelector("nav.menu .dd");
  t = await tops(page); ok(t[3] === "Pruebas t" && (await page.evaluate(() => document.documentElement.lang)) === "es", "Spanish persists after a reload", t);
  // Header button switches back
  await page.click("#langBtn"); await page.waitForTimeout(200);
  t = await tops(page);
  const back = await page.evaluate(() => ({ lang: document.documentElement.lang, dsname: document.querySelector("#dsname").textContent, btn: document.querySelector("#langBtn").textContent, h1: document.querySelector("header h1 span").textContent, ph: document.querySelector("#botIn").placeholder }));
  ok(t[3] === "T-Tests" && back.lang === "en" && back.dsname === "No data loaded" && back.btn === "Español" && /free statistical tool/.test(back.h1) && /compare two groups/.test(back.ph), "header button switches back to English in place", back);
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
