// Stats Without Walls: the R page. Real R in the browser through webR (R compiled to WebAssembly), loaded only when
// the page is opened, from a pinned version on the jsDelivr CDN (or from ?webr=<folder> for a local copy, which the
// tests use). Every sample dataset is available in R by its name as a data frame, and the open table as `data`.
// Nothing leaves the device: webR runs in a worker inside the browser. app.js calls window.SWW_R.install(api).
(function () {
  "use strict";
  const WEBR_VERSION = "0.6.1";
  const base = () => { const q = new URLSearchParams(location.search).get("webr"); return q ? q.replace(/\/?$/, "/") : `https://cdn.jsdelivr.net/npm/webr@${WEBR_VERSION}/dist/`; };
  const SNIPPETS = [
    ["Start here", "# Type R code and press Run (or Ctrl+Enter; Cmd+Enter on a Mac).\n# The datasets on the left are ready by name, as data frames.\nhead(popp_academy_fitness)\nmean(popp_academy_fitness$pushups_week12)"],
    ["Example: one-sample t test", "# Is the mean number of push-ups at week 12 different from 40?\nx <- popp_academy_fitness$pushups_week12\nt.test(x, mu = 40)"],
    ["Example: paired t test", "# The same cadets at week 1 and week 12: did push-ups change?\n# paired = TRUE because each row is one person measured twice.\nt.test(popp_academy_fitness$pushups_week12, popp_academy_fitness$pushups_week1, paired = TRUE)"],
    ["Example: Welch two-sample t test", "# Test scores for students with and without tutoring (two separate groups).\n# R uses Welch's t by default, which does not assume equal spreads.\nt.test(test_score ~ tutoring, data = causal_tutoring)"],
    ["Example: chi-square test", "# Is passing related to tutoring? First the two-way table, then the test.\ntab <- table(causal_tutoring$tutoring, causal_tutoring$passed)\ntab\nchisq.test(tab)"],
    ["Example: Fisher exact test", "# The same table with Fisher's exact test: exact, so fine when counts are small.\ntab <- table(causal_tutoring$tutoring, causal_tutoring$passed)\nfisher.test(tab)"],
    ["Example: linear regression", "# Predict beak length from beak depth, then draw the line on the scatterplot.\nfit <- lm(beak_length_mm ~ beak_depth_mm, data = Dataset1_Finch_Beaks)\nsummary(fit)\nplot(beak_length_mm ~ beak_depth_mm, data = Dataset1_Finch_Beaks)\nabline(fit, col = \"red\")"],
    ["Example: histogram and QQ plot", "# The shape of the data: a histogram and a normal QQ plot side by side.\nx <- popp_academy_fitness$pushups_week12\npar(mfrow = c(1, 2))\nhist(x, main = \"Push-ups, week 12\", xlab = \"push-ups\")\nqqnorm(x)\nqqline(x, col = \"red\")"],
  ];
  function install(api) {
    const { esc, announce, setView, samples } = api, D = api.D, $ = (s) => document.querySelector(s);
    let webR = null, shelter = null, starting = null, ready = false, runs = 0, dataKey = "";
    const info = []; // the datasets loaded into R: name, rows, columns
    const status = (t) => { const el = $("#rStatus"); if (el) el.textContent = t; };
    const stem = (f) => f.replace(/\.csv$/i, "");
    const csvText = () => { const d = D(), q = (v) => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v)); return [d.cols.map(q).join(",")].concat(d.rows.map((r) => r.map(q).join(","))).join("\n"); };
    async function writeCSV(name, text) { await webR.FS.writeFile(`/home/web_user/${name}.csv`, new TextEncoder().encode(text)); await webR.evalRVoid(`${name} <- read.csv("/home/web_user/${name}.csv", stringsAsFactors = FALSE)`); }
    async function loadDatasets() {
      for (const [f] of samples) { try { const txt = await (await fetch("data/" + f)).text(); const name = stem(f); await writeCSV(name, txt); const lines = txt.split(/\r?\n/).filter((l) => l.trim()); info.push({ name, rows: lines.length - 1, cols: lines[0].split(",").map((c) => c.replace(/^"|"$/g, "")) }); } catch (e) { /* a dataset that will not load is left out of the list */ } }
      renderData();
    }
    // the open table travels to R as `data` before every run, when it has changed
    async function syncData() { const d = D(); if (!d.rows.length) return; const key = d.name + "|" + d.rows.length + "|" + d.cols.join(",") + "|" + (d.filter || ""); if (key === dataKey) return; await writeCSV("data", csvText()); dataKey = key; renderData(); }
    function renderData() {
      const d = D(), el = $("#rData"); if (!el) return;
      const open = d.rows.length ? `<details open><summary><code>data</code>: the open table (${esc(d.name || "your data")}, ${d.rows.length} rows)</summary><p>${d.cols.map((c) => `<code>${esc(c)}</code>`).join(", ")}</p></details>` : `<p class="muted">Open or paste a table and it is available here as <code>data</code>.</p>`;
      el.innerHTML = `<h3>Datasets in R</h3>${open}` + info.map((q) => `<details><summary><code>${esc(q.name)}</code> (${q.rows} rows) <button type="button" class="rins" data-n="${esc(q.name)}" aria-label="Insert ${esc(q.name)} into the code">insert</button></summary><p>${q.cols.map((c) => `<code>${esc(c)}</code>`).join(", ")}</p></details>`).join("");
      el.querySelectorAll(".rins").forEach((b) => (b.onclick = (e) => { e.preventDefault(); insert(b.dataset.n); }));
    }
    function insert(text) { const ta = $("#rCode"); const s = ta.selectionStart || 0, e = ta.selectionEnd || 0; ta.value = ta.value.slice(0, s) + text + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + text.length; ta.focus(); }
    async function ensureR() {
      if (ready) return webR; if (starting) return starting;
      status("Starting R, a few seconds the first time (about 25 MB on the first visit, then cached).");
      starting = (async () => {
        const mod = await import(/* webpackIgnore: true */ base() + "webr.js");
        const w = new mod.WebR({ baseUrl: base() }); await w.init(); webR = w; shelter = await new w.Shelter();
        await loadDatasets(); ready = true; status(`R is ready (webR ${WEBR_VERSION}, R ${await rVersion()}). ${info.length} datasets loaded.`); return w;
      })().catch((e) => { starting = null; status("R could not start: " + ((e && e.message) || e) + ". Check the connection and press Run to try again."); throw e; });
      return starting;
    }
    async function rVersion() { try { const r = await webR.evalRString("paste(R.version$major, R.version$minor, sep = '.')"); return r; } catch (e) { return "?"; } }
    // the code runs inside R's own handlers, so errors, warnings and messages come back as text in the output and
    // every top-level value prints as at the console
    const wrap = (code) => `withCallingHandlers(tryCatch(withAutoprint({\n${code}\n}, echo = FALSE), error = function(e) cat("Error:", conditionMessage(e), "\\n")), warning = function(w) { cat("Warning:", conditionMessage(w), "\\n"); invokeRestart("muffleWarning") }, message = function(m) { cat(conditionMessage(m)); invokeRestart("muffleMessage") })`;
    async function run() {
      const ta = $("#rCode"), code = ta.value; if (!code.trim()) { status("Type some R code first."); return; }
      const btn = $("#rRun"); btn.disabled = true;
      try {
        await ensureR(); await syncData(); status("Running...");
        const res = await shelter.captureR(wrap(code), { withAutoprint: false, captureStreams: true, captureConditions: false, captureGraphics: { width: 600, height: 420, bg: "white" } });
        await render(code, res); status(`Done (run ${runs}).`);
      } catch (e) { await render(code, { output: [{ type: "stderr", data: "Error: " + ((e && e.message) || String(e)) }], images: [] }); status("That run stopped with an error; the message is in the output."); }
      finally { try { await shelter.purge(); } catch (e) { } btn.disabled = false; }
    }
    async function render(code, res) {
      runs++; const out = $("#rOut"), block = document.createElement("section"); block.className = "rrun"; block.setAttribute("aria-label", `Run ${runs}`);
      const lines = (res.output || []).map((o) => ({ type: o.type, text: typeof o.data === "string" ? o.data : String(o.data) }));
      const text = lines.map((l) => l.text).join("\n");
      block.innerHTML = `<div class="rhead">Run ${runs}</div><pre class="rcode" aria-label="Code of run ${runs}">${esc(code)}</pre>` + (text.trim() ? `<pre class="rtext ${lines.some((l) => /^Error:/.test(l.text)) ? "rerr" : ""}">${esc(text)}</pre>` : `<p class="muted">No printed output${(res.images || []).length ? ", only the plot" : ""}.</p>`);
      (res.images || []).forEach((img, i) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.className = "rplot"; c.setAttribute("role", "img"); c.setAttribute("aria-label", `Plot ${i + 1} of run ${runs}`); c.getContext("2d").drawImage(img, 0, 0); block.appendChild(c); });
      out.prepend(block); announce(`Run ${runs} finished. ` + (text.trim() ? text.slice(0, 240) : "A plot was drawn."));
    }
    function openR(code) { setView("r", "push"); if (code != null) $("#rCode").value = code; else if (!$("#rCode").value) $("#rCode").value = SNIPPETS[0][1]; ensureR().catch(() => { }); const h = $("#toolTitle"); if (h) h.focus(); }
    // the page's controls
    const rr = $("#rRun"); if (rr) rr.onclick = run;
    const ta = $("#rCode"); if (ta) ta.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); } });
    const rc = $("#rClear"); if (rc) rc.onclick = () => { $("#rOut").innerHTML = ""; announce("Output cleared."); };
    const sel = $("#rSnip"); if (sel) { sel.innerHTML = `<option value="">Load an example</option>` + SNIPPETS.map((s, i) => `<option value="${i}">${esc(s[0])}</option>`).join(""); sel.onchange = (e) => { const s = SNIPPETS[+e.target.value]; e.target.value = ""; if (s) { $("#rCode").value = s[1]; $("#rCode").focus(); } }; }
    renderData();
    const items = [["Run R code", () => openR(null)], null].concat(SNIPPETS.slice(1).map((s) => [s[0], () => openR(s[1])]));
    return { items, openR, renderData, isReady: () => ready };
  }
  window.SWW_R = { install, SNIPPETS };
})();
