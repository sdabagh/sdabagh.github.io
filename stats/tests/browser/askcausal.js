// Ask knows the Causal menu: a confounder question lands on the diagram and standardization first, propensity,
// matching, instrument, difference in differences, cutoff and bounds each open their tool, the glossary explains
// colliders and ATE versus ATT, and the same works in Spanish.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function ask(page, q) { const before = await page.evaluate(() => document.querySelectorAll("#botLog .bmsg").length); await page.fill("#botIn", q); await page.click("#botForm button[type=submit]"); await page.waitForFunction((n) => document.querySelectorAll("#botLog .bmsg").length > n + 1, before, { timeout: 5000 }); return page.evaluate((n) => Array.from(document.querySelectorAll("#botLog .bmsg")).slice(n + 1).map((m) => ({ text: m.textContent, buttons: Array.from(m.querySelectorAll("button")).map((b) => b.textContent) })), before); }
const first = (a) => a.find((m) => m.buttons.some((b) => /^(Open|Abrir) /.test(b))) || a[0];
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(URL); await page.click("#askBtn");
  let a = await ask(page, "I think a confounder explains the difference"); let r = first(a);
  ok(r && /Could a third variable explain the difference/.test(r.text) && r.buttons.includes("Open Draw a DAG: paths, d-separation, backdoor") && r.buttons.includes("Open Adjust by groups (standardization)"), "a confounder: the diagram and standardization come first", r && r.buttons);
  a = await ask(page, "confounder"); r = first(a);
  ok(r && /Could a third variable explain the difference/.test(r.text) && a.some((m) => /sensitivity analysis/.test(m.text)), "the one word: the same route first, the sensitivity analysis still offered", r && r.text.slice(0, 60));
  a = await ask(page, "propensity score"); r = first(a);
  ok(r && /Propensity scores: weighting/.test(r.text) && r.buttons.includes("Open Propensity score and inverse probability weighting"), "propensity score: weighting, with matching as an alternative", r && r.buttons);
  a = await ask(page, "match each treated student to a similar one"); r = first(a);
  ok(r && /Matching on the propensity score/.test(r.text), "matching route", r && r.text.slice(0, 60));
  a = await ask(page, "tutoring was offered by lottery, can I use that as an instrument?"); r = a.find((m) => /An instrument/.test(m.text));
  ok(r && r.buttons.includes("Open Instrumental variables (Wald ratio, 2SLS)"), "a question about a lottery as an instrument: the IV tool is offered", r && r.buttons);
  a = await ask(page, "lottery"); r = first(a);
  ok(r && /An instrument/.test(r.text), "lottery alone: the IV route first", r && r.text.slice(0, 40));
  a = await ask(page, "difference in differences"); r = first(a);
  ok(r && /difference in differences/.test(r.text) && r.buttons.includes("Open Difference in differences (2 by 2)"), "difference in differences", r && r.buttons);
  a = await ask(page, "scholarship given at a GPA cutoff"); r = first(a);
  ok(r && /regression discontinuity/.test(r.text) && r.buttons.includes("Open Regression discontinuity (sharp)"), "a cutoff: regression discontinuity", r && r.buttons);
  a = await ask(page, "what can the data say with no assumptions"); r = first(a);
  ok(r && /bounds/.test(r.text) && r.buttons.includes("Open Bounds with no assumptions (Manski)"), "no assumptions: the bounds", r && r.buttons);
  a = await ask(page, "what is a collider?"); r = a.find((m) => /Chains, forks and colliders/.test(m.text));
  ok(r && /conditioning on a collider, or on its descendant, opens it/.test(r.text), "glossary: colliders", r && r.text.slice(0, 60));
  a = await ask(page, "what is the difference between ATE and ATT?"); r = a.find((m) => /Propensity scores, ATE and ATT/.test(m.text));
  ok(r && /ATT is the average effect for the people who were actually treated/.test(r.text), "glossary: ATE versus ATT", r && r.text.slice(0, 60));
  // Spanish
  await page.click("#langBtn"); await page.waitForTimeout(400);
  a = await ask(page, "hay una variable de confusión"); r = first(a);
  ok(r && /Podría una tercera variable explicar la diferencia/.test(r.text) && r.buttons.includes("Abrir Dibujar un DAG: caminos, d-separación, puerta trasera"), "Spanish: confusor lands on the diagram, button says Abrir", r && r.buttons);
  a = await ask(page, "diferencias en diferencias"); r = first(a);
  ok(r && /Una política alcanzó a un grupo/.test(r.text) && r.buttons.includes("Abrir Diferencias en diferencias (2 por 2)"), "Spanish: diferencias en diferencias", r && r.buttons);
  a = await ask(page, "¿qué es un colisionador?"); r = a.find((m) => /Cadenas, bifurcaciones y colisionadores/.test(m.text));
  ok(r && /condicionar en un colisionador/.test(r.text), "Spanish glossary: colisionador", r && r.text.slice(0, 60));
  ok(errs.length === 0, "no page errors", errs);
  await browser.close(); console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})();
