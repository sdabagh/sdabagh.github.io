// Crash sweep: every menu item on every sample dataset with the dialog's default choices. A validation message is
// fine (the app refusing bad input); a page error, an error bar, an alert that reads like a crash (undefined, NaN,
// "is not a function"), a dialog that never closes, or a run that closes with no card is a suspect and is listed.
// Usage: node stats/tests/sweep/sweep.js [datasetFilter]   (SWW_PORT as in the other tests)
const { chromium } = require("playwright");
const URL = "http://127.0.0.1:" + (process.env.SWW_PORT || 8765) + "/stats/index.html";
const SKIP_MENUS = new Set(["Data", "Results"]), ONCE_MENUS = new Set(["Learn", "distrACTION"]);
const BUGLIKE = /undefined|NaN|is not a function|is not defined|Cannot read|null|TypeError|RangeError|Maximum call|Invalid array length|not iterable|of undefined/i;
const filter = process.argv[2] || "";
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = [], alerts = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(URL);
  const menus = await page.evaluate(() => Array.from(document.querySelectorAll("nav.menu .dd[data-name]")).map((d) => d.dataset.name));
  const items = {}; for (const m of menus) { if (SKIP_MENUS.has(m)) continue; await page.click(`nav.menu .dd[data-name="${m}"] .top`); items[m] = await page.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"]')).filter((x) => x.offsetParent).map((x) => x.textContent.trim())); await page.keyboard.press("Escape"); await page.waitForTimeout(100); }
  const datasets = await (async () => { await page.click('nav.menu .dd[data-name="Data"] .top'); await page.getByRole("menuitem", { name: "Sample datasets", exact: true }).click(); await page.waitForSelector("#dlg.open"); const d = await page.evaluate(() => Array.from(document.querySelector("#f_f").options).map((o) => o.value)); await page.click("#dlgCancel"); await page.waitForFunction(() => !document.querySelector("#dlg").open); return d; })();
  const suspects = []; let runs = 0, onceDone = false;
  const closeAll = async () => { await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) { const c = document.querySelector("#dlgCancel"); if (c) c.click(); else d.close(); } }); await page.evaluate(() => { document.querySelector("#out").innerHTML = ""; const g = document.querySelector("#outG"); if (g) g.innerHTML = ""; const b = document.querySelector("#errBar"); if (b) b.remove(); }); };
  for (const ds of datasets) {
    if (filter && !ds.includes(filter)) continue;
    await closeAll(); errs.length = 0; alerts.length = 0;
    await page.click('nav.menu .dd[data-name="Data"] .top'); await page.getByRole("menuitem", { name: "Sample datasets", exact: true }).click(); await page.waitForSelector("#dlg.open"); await page.selectOption("#f_f", ds); await page.evaluate(() => document.querySelector("#dlg button.go").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 30000 }); await page.waitForTimeout(300);
    for (const m of Object.keys(items)) {
      if (ONCE_MENUS.has(m) && onceDone) continue;
      for (const it of items[m]) {
        errs.length = 0; alerts.length = 0; runs++;
        const before = await page.evaluate(() => document.querySelectorAll(".card").length);
        let outcome = "", detail = "";
        try {
          await page.click(`nav.menu .dd[data-name="${m}"] .top`); await page.getByRole("menuitem", { name: it, exact: true }).click();
          const opened = await page.waitForSelector("#dlg.open", { timeout: 4000 }).then(() => true).catch(() => false);
          if (!opened) { const live = await page.evaluate(() => Array.from(document.querySelectorAll(".card")).filter((c) => c.offsetParent).length); outcome = live > 0 ? "live card" : alerts.length ? "alert" : "nothing"; detail = alerts.join(" | "); } // a live calculator or applet replaces its previous card, so any visible card counts
          else {
            await page.evaluate(() => document.querySelectorAll("#dlgForm details").forEach((d) => (d.open = true)));
            const hasGo = await page.evaluate(() => !!document.querySelector("#dlg button.go"));
            if (!hasGo) { outcome = "dialog without Run (live)"; await page.evaluate(() => document.querySelector("#dlgCancel") && document.querySelector("#dlgCancel").click()); }
            else {
              await page.evaluate(() => document.querySelector("#dlg button.go").click());
              const closed = await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 15000 }).then(() => true).catch(() => false);
              await page.waitForTimeout(150);
              if (closed) { const after = await page.evaluate(() => document.querySelectorAll(".card").length); outcome = after > before ? "card" : "closed, no card"; }
              else { const msgs = await page.evaluate(() => Array.from(document.querySelectorAll("#dlg .fldmsg")).map((x) => x.textContent.trim()).filter(Boolean)); outcome = alerts.length ? "alert" : msgs.length ? "field message" : "still open"; detail = alerts.concat(msgs).join(" | "); await page.evaluate(() => document.querySelector("#dlgCancel") && document.querySelector("#dlgCancel").click()); await page.waitForFunction(() => !document.querySelector("#dlg").open, null, { timeout: 5000 }).catch(() => {}); }
            }
          }
        } catch (e) { outcome = "driver error"; detail = String(e.message || e).slice(0, 200); await closeAll(); }
        const bar = await page.evaluate(() => { const b = document.querySelector("#errBar"); return b ? b.textContent.trim() : ""; });
        const wizard = it === "Which test?"; const bad = errs.length || bar || (outcome === "alert" && BUGLIKE.test(detail)) || (outcome === "still open" && !wizard) || outcome === "closed, no card" || outcome === "driver error" || outcome === "nothing";
        const line = `${bad ? "SUSPECT" : "ok     "}  ${ds} | ${m} > ${it} | ${outcome}${detail ? " | " + detail.slice(0, 160) : ""}${errs.length ? " | PAGEERR " + errs.join("; ").slice(0, 200) : ""}${bar ? " | ERRBAR " + bar.slice(0, 160) : ""}`;
        console.log(line); if (bad) suspects.push(line);
        if (runs % 8 === 0) await page.evaluate(() => { document.querySelector("#out").innerHTML = ""; const g = document.querySelector("#outG"); if (g) g.innerHTML = ""; });
      }
    }
    onceDone = true;
  }
  await browser.close();
  console.log(`\n${runs} runs, ${suspects.length} suspects`); suspects.forEach((s) => console.log(s));
  process.exit(0);
})();
