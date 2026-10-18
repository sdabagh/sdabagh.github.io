// Share link, Which test?, course profiles: end-to-end checks in headless Chromium.
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:8765/stats/index.html";
let fails = 0;
const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
async function loadSample(page) { await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Sample datasets" }).click(); await page.selectOption("#f_f", "STATC1000_Class_Data.csv"); await page.click("#dlg button.go"); await page.waitForFunction(() => document.querySelectorAll("table.grid tbody tr").length > 0); }
async function menu(page, top, item) { await page.click(`nav.menu .dd[data-name="${top}"] .top`); await page.getByRole("menuitem", { name: item, exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true))); }
async function run(page) { await page.click("#dlg button.go"); await page.waitForFunction(() => !document.querySelector("#dlg").open); }
const errs = [], dialogs = [];
const watch = (p) => { p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); }); p.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); }); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 800 }, permissions: ["clipboard-read", "clipboard-write"], acceptDownloads: true });
  const page = await ctx.newPage(); watch(page);
  await page.goto(URL); await loadSample(page);

  // ---- share link with a sample dataset, a filter and three analyses
  await page.fill("#filterBox", 'Year == "Freshman" or Year == "Senior"'); await page.press("#filterBox", "Enter"); await page.waitForTimeout(100);
  await menu(page, "Exploration", "Descriptives"); await page.selectOption("#f_vars", ["GPA"]); await run(page);
  await menu(page, "T-Tests", "Independent Samples T-Test"); await page.selectOption("#f_x", "GPA"); await page.selectOption("#f_g", "Pet_Owner"); await run(page);
  await menu(page, "Graph", "Histogram"); await page.selectOption("#f_x", "Hours_Sleep"); await run(page);
  await page.waitForTimeout(200);
  const tStat = await page.evaluate(() => document.querySelector("#out .card table.res tbody td:nth-child(3)").textContent);
  await menu(page, "Results", "Share link (data + analyses)");
  const hint = await page.textContent("#dlgForm .hint");
  ok(/3 analyses, filter Year/.test(hint) && /names the sample dataset/.test(hint), "share dialog describes the link (a filtered sample is still the sample)", hint.slice(0, 120));
  await run(page); await page.waitForTimeout(150);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const linkCard = await page.evaluate(() => document.querySelector("#out .card h2").textContent);
  ok(/#s=[A-Za-z0-9_-]+$/.test(link) && linkCard === "Share link", "Copy link puts a #s= link on the clipboard and leaves a card", link.length);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sww_last")).cards.length);
  ok(saved === 3, "the share-link card is not autosaved", saved);

  // open it in a fresh browser
  const ctx2 = await browser.newContext({ viewport: { width: 1300, height: 800 } });
  const p2 = await ctx2.newPage(); watch(p2);
  await p2.goto(link); await p2.waitForTimeout(300);
  const bar = await p2.evaluate(() => ({ hidden: document.querySelector("#restoreBar").hidden, text: document.querySelector("#restoreText").textContent, yes: document.querySelector("#restoreYes").textContent, rows: document.querySelectorAll("table.grid tbody tr").length }));
  ok(!bar.hidden && /Open the shared setup\? 3 analyses on STATC1000_Class_Data \(filter: Year/.test(bar.text) && bar.yes === "Open" && bar.rows === 0, "fresh browser: Open bar, nothing run yet", bar);
  await p2.click("#restoreYes");
  await p2.waitForFunction(() => document.querySelectorAll("#out .card, #outG .card").length >= 3, null, { timeout: 15000 }); await p2.waitForTimeout(400);
  const got = await p2.evaluate(() => ({ a: Array.from(document.querySelectorAll("#out .card h2")).map((h) => h.textContent), g: document.querySelectorAll("#outG .card").length, rows: document.querySelectorAll("table.grid tbody tr").length, kept: document.querySelectorAll("table.grid tbody tr:not(.off)").length, filter: document.querySelector("#filterBox").value, hash: location.hash, t: document.querySelector("#out .card table.res tbody td:nth-child(3)").textContent, plots: document.querySelectorAll("#out .plot, #outG .plot").length }));
  ok(got.a.join("|") === "Independent Samples T-Test|Descriptives" && got.g === 1 && got.rows === 40 && got.kept === 16 && got.filter.startsWith("Year ==") && got.hash === "" && got.t === tStat && got.plots >= 3, "shared setup opens: data, filter, three cards in order, same t, hash dropped", got);
  await ctx2.close();

  // ---- share link with the user's own table inside
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(200);
  await page.click("#mtop0"); await page.getByRole("menuitem", { name: "Paste data" }).click(); await page.waitForSelector("#dlg.open");
  const csv = "x,y,grp\n" + Array.from({ length: 40 }, (_, i) => `${i},${(i * 7) % 13},${i % 2 ? "A" : "B"}`).join("\n");
  const ta = await page.evaluate(() => { const t = document.querySelector("#dlgForm textarea"); return t ? t.id : null; });
  ok(!!ta, "paste dialog has a textarea", ta);
  await page.fill("#" + ta, csv); await run(page); await page.waitForTimeout(200);
  await menu(page, "Regression", "Linear Regression"); await page.selectOption("#f_y", "y"); await page.selectOption("#f_x", "x"); await run(page); await page.waitForTimeout(200);
  await menu(page, "Results", "Share link (data + analyses)"); const hint2 = await page.textContent("#dlgForm .hint"); await run(page); await page.waitForTimeout(150);
  const link2 = await page.evaluate(() => navigator.clipboard.readText());
  ok(/travels inside the link/.test(hint2), "own data: the link carries the table", hint2.slice(0, 100));
  const ctx3 = await browser.newContext({ viewport: { width: 1300, height: 800 } }); const p3 = await ctx3.newPage(); watch(p3);
  await p3.goto(link2); await p3.waitForTimeout(300);
  const t3 = await p3.textContent("#restoreText");
  ok(/with the table \(40 rows\) inside the link/.test(t3), "own-data link: bar says the table is inside", t3);
  await p3.click("#restoreYes"); await p3.waitForFunction(() => document.querySelectorAll("#out .card").length >= 1, null, { timeout: 15000 }); await p3.waitForTimeout(300);
  const g3 = await p3.evaluate(() => ({ rows: document.querySelectorAll("table.grid tbody tr").length, cols: document.querySelectorAll("table.grid thead th").length, name: document.querySelector("#dsname").textContent, card: document.querySelector("#out .card h2").textContent }));
  ok(g3.rows === 40 && g3.cols === 4 && g3.card === "Linear Regression", "own-data link opens with the rows and the regression", g3);
  await ctx3.close();

  // ---- a bad or tampered link is ignored quietly
  const ctx4 = await browser.newContext(); const p4 = await ctx4.newPage(); watch(p4);
  await p4.goto(URL + "#s=not_base64!!"); await p4.waitForTimeout(200);
  ok(await p4.evaluate(() => document.querySelector("#restoreBar").hidden && document.body.classList.contains("view-data")), "a broken #s= link opens the plain data page");
  await ctx4.close();

  // ---- Which test?
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector("#whichBtn").getClientRects().length > 0), "Which test? button shows with no data");
  await page.click("#whichBtn"); await page.waitForSelector("#dlg.open");
  const rec = async () => page.evaluate(() => document.querySelector("#f_rec").textContent);
  ok(/^Independent Samples T-Test \(T-Tests menu\)/.test(await rec()), "default answers name the independent t", await rec());
  await page.selectOption("#f_pair", "pair"); ok(/^Paired Samples T-Test/.test(await rec()), "paired answer names the paired t");
  await page.selectOption("#f_y", "two"); ok(/^McNemar test/.test(await rec()), "yes/no paired names McNemar");
  await page.selectOption("#f_pair", "ind"); ok(/^Two proportions: z test/.test(await rec()), "yes/no two groups names the two-proportion z");
  await page.selectOption("#f_q", "rel"); ok((await page.evaluate(() => document.querySelector("#f_x").getClientRects().length > 0)) && /^Logistic Regression/.test(await rec()), "relationship shows the other-variable box; yes/no by a number names logistic");
  await page.selectOption("#f_x", "cat"); ok(/^Contingency Tables/.test(await rec()), "two categories name the chi-square table");
  await page.selectOption("#f_y", "many"); await page.selectOption("#f_q", "one"); ok(/^N Outcomes: chi-square Goodness of fit/.test(await rec()), "category against claimed proportions names goodness of fit");
  ok(await page.evaluate(() => document.querySelector("#dlg button.go").textContent) === "Note it", "with no data the button says Note it");
  await run(page); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector("#out .card h2").textContent === "Which test?" && !localStorage.getItem("sww_last")), "no data: a note card, not autosaved");
  await loadSample(page);
  await menu(page, "T-Tests", "Which test?");
  await page.selectOption("#f_pair", "pair");
  ok(await page.evaluate(() => document.querySelector("#dlg button.go").textContent) === "Open it", "with data the button says Open it");
  await page.click("#dlg button.go"); await page.waitForTimeout(300);
  const opened = await page.evaluate(() => ({ open: document.querySelector("#dlg").open, title: document.querySelector("#dlgTitle").textContent }));
  ok(opened.open && opened.title === "T-Tests: Paired Samples T-Test", "Open it opens the paired t dialog", opened);
  await page.click("#dlgCancel");

  // ---- course profile
  await menu(page, "Results", "Course profile");
  await page.fill("#f_name", "STAT C1000"); await page.selectOption("#f_welch", "pooled"); await page.selectOption("#f_dec", "3"); await page.selectOption("#f_alpha", "0.01");
  await page.evaluate(() => { const s = document.querySelector("#f_menus"); [...s.options].forEach((o) => (o.selected = o.value !== "Advanced" && o.value !== "Nonparametric")); });
  await page.selectOption("#f_how", "link"); await run(page); await page.waitForTimeout(200);
  const prof = await page.evaluate(() => ({ name: document.querySelector("#profName").textContent, adv: document.querySelector('nav.menu .dd[data-name="Advanced"]').style.display, learn: document.querySelector('nav.menu .dd[data-name="Learn"]').style.display, card: document.querySelector("#out .card h2").textContent, stored: JSON.parse(localStorage.getItem("sww_profile")) }));
  ok(prof.name === "Profile: STAT C1000" && prof.adv === "none" && prof.learn === "" && prof.card === "Course profile" && prof.stored.welch === false && prof.stored.dec === 3 && prof.stored.menus.length === 8, "profile applied: name shown, Advanced hidden, stored", prof);
  const plink = await page.evaluate(() => navigator.clipboard.readText());
  ok(/#s=/.test(plink), "profile link copied", plink.length);
  await menu(page, "T-Tests", "Independent Samples T-Test");
  const welch = await page.evaluate(() => ({ on: document.querySelector("#f_welch").checked, label: document.querySelector("#f_welch").parentNode.textContent.trim(), alpha: document.querySelector("#f_alpha").value }));
  ok(!welch.on && /in STAT C1000/.test(welch.label) && welch.alpha === "0.01", "profile defaults: pooled t unticked, label names the profile, alpha 0.01", welch);
  await page.click("#dlgCancel");
  await menu(page, "Exploration", "Descriptives"); await page.selectOption("#f_vars", ["GPA"]); await run(page); await page.waitForTimeout(100);
  const dec3 = await page.evaluate(() => document.querySelector("#out .card table.res tbody tr:nth-child(3) td:nth-child(2)").textContent);
  ok(/^\d+\.\d{1,3}$/.test(dec3) && dec3.split(".")[1].length <= 3, "profile decimals: mean shown to 3 places", dec3);
  await page.reload(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelector("#profName").textContent === "Profile: STAT C1000" && document.querySelector('nav.menu .dd[data-name="Advanced"]').style.display === "none"), "profile survives a reload");
  // the profile link in a fresh browser
  const ctx5 = await browser.newContext({ viewport: { width: 1300, height: 800 } }); const p5 = await ctx5.newPage(); watch(p5);
  await p5.goto(plink); await p5.waitForTimeout(300);
  const t5 = await p5.textContent("#restoreText");
  ok(/This link sets the course profile STAT C1000/.test(t5), "profile-only link offers the profile", t5.slice(0, 80));
  await p5.click("#restoreYes"); await p5.waitForTimeout(200);
  ok(await p5.evaluate(() => document.querySelector("#profName").textContent === "Profile: STAT C1000" && document.querySelector("#out .card h2").textContent === "Course profile" && location.hash === ""), "Open applies the profile from the link");
  await ctx5.close();
  // remove
  await menu(page, "Results", "Course profile"); await page.selectOption("#f_how", "off"); await run(page); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector("#profName").textContent === "" && document.querySelector('nav.menu .dd[data-name="Advanced"]').style.display === "" && !localStorage.getItem("sww_profile")), "Remove restores every menu and forgets the profile");
  // profile file round trip
  await menu(page, "Results", "Course profile"); await page.fill("#f_name", "From file"); await page.selectOption("#f_qm", "type7"); await page.selectOption("#f_how", "file");
  const [dl] = await Promise.all([page.waitForEvent("download"), run(page)]);
  const path = await dl.path(); const fs = require("fs"); const json = JSON.parse(fs.readFileSync(path, "utf8"));
  ok(dl.suggestedFilename() === "From_file.sww-profile.json" && json.sww_profile === 1 && json.qm === "type7", "profile file downloaded", dl.suggestedFilename());
  await menu(page, "Results", "Course profile"); await page.selectOption("#f_how", "off"); await run(page);
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), (async () => { await page.click('nav.menu .dd[data-name="Results"] .top'); await page.getByRole("menuitem", { name: "Open a profile file" }).click(); })()]);
  await chooser.setFiles(path); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelector("#profName").textContent === "Profile: From file"), "Open a profile file applies it");
  await loadSample(page); await menu(page, "Exploration", "Descriptives");
  ok(await page.evaluate(() => document.querySelector("#f_qm").value) === "type7", "profile quartile rule is the Descriptives default");
  await page.click("#dlgCancel");

  ok(errs.length === 0, "no page or console errors", errs);
  ok(dialogs.length === 0, "no alert dialogs", dialogs);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
