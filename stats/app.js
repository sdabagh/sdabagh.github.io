/* Stats Without Walls: interface. Menus, option names and result tables match the course
   instructions as written. Engine in stats.js (window.SW); jStat and Plotly vendored. */
(function () {
  const $ = (s) => document.querySelector(s);
  const D = { name: "", cols: [], rows: [], types: {}, manual: {}, filter: "", sortCol: null, sortDir: 1 };
  let CUR_FN = null, PREFILL = null, REPLACE = null, PENDING = null; // edit support: which menu function made a card, its values, and the card being replaced
  let DEC = 4; try { DEC = Number(localStorage.getItem("sww_dec")) || 4; } catch (e) { }
  const fmt = (x, d) => (typeof x === "number" && Number.isFinite(x) ? Number(x.toFixed(d == null ? DEC : d)).toString() : x == null ? "" : String(x));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ================= data =================
  function parseCSV(text) {
    const rows = []; let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
      else if (c === '"') q = true;
      else if (c === "," || c === "\t") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ""));
  }
  function inferTypes() {
    D.types = {};
    D.manual = D.manual || {};
    D.cols.forEach((c, j) => {
      if (D.manual[c]) { D.types[c] = D.manual[c]; return; } // a type the user set by hand is kept
      const vals = D.rows.map((r) => r[j]).filter((v) => v !== "" && v != null);
      const nums = vals.filter((v) => Number.isFinite(Number(v)));
      const distinct = new Set(vals).size;
      if (!vals.length) D.types[c] = "nominal";
      else if (/(^|_)(zip|zipcode|postal|phone|ssn|id|code|number|num|no)$|^(zip|id)/i.test(c.replace(/\s+/g, "_"))) D.types[c] = distinct === vals.length ? "id" : "nominal";
      else if (nums.length === vals.length) D.types[c] = distinct <= 6 && vals.every((v) => Number.isInteger(Number(v))) ? "ordinal" : "continuous";
      else D.types[c] = distinct === vals.length && vals.length > 12 ? "id" : "nominal";
    });
  }
  function loadTable(name, rows) {
    D.name = name; D.cols = rows[0].map((h, i) => (h.trim() || "col" + (i + 1)));
    D.rows = rows.slice(1).map((r) => D.cols.map((_, j) => (r[j] == null ? "" : String(r[j]).trim())));
    D.filter = ""; D.sortCol = null; inferTypes(); renderGrid(); persist();
  }
  function persist() { try { localStorage.setItem("sww_data", JSON.stringify({ name: D.name, cols: D.cols, rows: D.rows, filter: D.filter, manual: D.manual || {} })); } catch (e) { } }
  function restore() { try { const s = JSON.parse(localStorage.getItem("sww_data") || "null"); if (s && s.rows && s.rows.length) { D.name = s.name; D.cols = s.cols; D.rows = s.rows; D.filter = s.filter || ""; D.manual = s.manual || {}; inferTypes(); renderGrid(); } } catch (e) { } }
  // active rows: those passing the filter
  function activeIdx() {
    if (!D.filter.trim()) return D.rows.map((_, i) => i);
    let f; try { f = SW.compileFormula(D.filter, D.cols, (c) => D.rows.map((r) => r[D.cols.indexOf(c)])); } catch (e) { throw new Error("Filter could not be read: " + e.message); }
    const out = []; D.rows.forEach((r, i) => { try { if (f(r)) out.push(i); } catch (e) { } }); return out;
  }
  function col(name) { const j = D.cols.indexOf(name); if (j < 0) throw new Error("Column not found: " + name); const idx = activeIdx(); return idx.map((i) => D.rows[i][j]); }
  const isNum = (c) => D.types[c] === "continuous" || D.types[c] === "ordinal";
  function numCols() { return D.cols.filter(isNum); }
  function catCols() { return D.cols.filter((c) => D.types[c] === "nominal" || D.types[c] === "ordinal"); }
  function renderGrid() {
    $("#dsname").textContent = D.name || "No data loaded";
    const act = D.filter.trim() ? (() => { try { return activeIdx().length; } catch (e) { return "?"; } })() : D.rows.length;
    $("#dsinfo").textContent = D.rows.length ? `${D.rows.length} rows, ${D.cols.length} columns${D.filter.trim() ? `, filter keeps ${act}` : ""}` : "";
    $("#filterBox").value = D.filter;
    const g = $("#grid"); if (!D.rows.length) return;
    const icon = { continuous: "ruler, continuous", ordinal: "ordinal", nominal: "nominal", id: "ID" };
    let h = '<table class="grid"><thead><tr><th></th>' + D.cols.map((c) => `<th data-col="${esc(c)}" title="click the name to sort; click the type to change it">${esc(c)}<small class="ty" data-col="${esc(c)}" title="Change the type">${icon[D.types[c]]} &#9662;</small></th>`).join("") + "</tr></thead><tbody>";
    let keep = null; try { keep = new Set(activeIdx()); } catch (e) { }
    D.rows.forEach((r, i) => { h += `<tr class="${keep && !keep.has(i) ? "off" : ""}"><td class="rn">${i + 1}</td>` + r.map((v, j) => `<td contenteditable data-i="${i}" data-j="${j}">${esc(v)}</td>`).join("") + "</tr>"; });
    g.innerHTML = h + "</tbody></table>";
    g.querySelectorAll("td[contenteditable]").forEach((td) => td.addEventListener("blur", () => { D.rows[+td.dataset.i][+td.dataset.j] = td.textContent.trim(); inferTypes(); persist(); }));
    g.querySelectorAll("th[data-col]").forEach((th) => (th.onclick = () => sortBy(th.dataset.col)));
    g.querySelectorAll("small.ty").forEach((sm) => (sm.onclick = (e) => { e.stopPropagation(); typePicker(sm, sm.dataset.col); }));
  }
  function typePicker(anchor, c) { // inline menu under the column name, the same job as a data setup panel
    document.querySelectorAll(".typemenu").forEach((m) => m.remove());
    const m = document.createElement("div"); m.className = "typemenu";
    const opts = [["continuous", "Continuous (ruler): numbers you can average"], ["ordinal", "Ordinal: ordered categories"], ["nominal", "Nominal: names, no order"], ["id", "ID: a label, never analysed"]];
    m.innerHTML = `<div class="tm-title">${esc(c)}</div>` + opts.map(([k, l]) => `<div class="tm-opt${D.types[c] === k ? " on" : ""}" data-k="${k}">${l}</div>`).join("") + `<div class="tm-opt tm-auto" data-k="">Back to automatic</div>`;
    const r = anchor.getBoundingClientRect(); m.style.left = Math.min(r.left, window.innerWidth - 300) + "px"; m.style.top = r.bottom + 4 + "px";
    document.body.appendChild(m);
    m.querySelectorAll(".tm-opt").forEach((o) => (o.onclick = (e) => { e.stopPropagation(); const k = o.dataset.k; if (k) D.manual[c] = k; else delete D.manual[c]; inferTypes(); renderGrid(); persist(); m.remove(); }));
    setTimeout(() => document.addEventListener("click", () => m.remove(), { once: true }), 0);
  }
  function sortBy(c) {
    const j = D.cols.indexOf(c); D.sortDir = D.sortCol === c ? -D.sortDir : 1; D.sortCol = c;
    const numeric = isNum(c);
    D.rows.sort((a, b) => { const x = a[j], y = b[j]; if (x === "") return 1; if (y === "") return -1; return (numeric ? Number(x) - Number(y) : String(x).localeCompare(String(y))) * D.sortDir; });
    renderGrid(); persist();
  }
  function addColumn(name, values) { if (D.cols.includes(name)) throw new Error("A column named " + name + " already exists."); D.cols.push(name); D.rows.forEach((r, i) => r.push(values[i] == null || values[i] === "" || Number.isNaN(values[i]) ? "" : typeof values[i] === "number" ? fmt(values[i], 4) : String(values[i]))); inferTypes(); renderGrid(); persist(); }
  function downloadText(txt, filename, type = "text/plain") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = filename; a.click(); }
  function downloadCSV() { const q = (v) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v); downloadText([D.cols.map(q).join(",")].concat(D.rows.map((r) => r.map(q).join(","))).join("\n"), (D.name || "data") + ".csv", "text/csv"); }
  const SAMPLES = [
    ["STATC1000_Class_Data.csv", "Our class data (40 students)"], ["STATC1000_Sleep_Followup.csv", "Sleep follow-up (paired)"],
    ["Dataset1_Finch_Beaks.csv", "Galapagos finches (300 birds)"], ["Dataset4_Global_Health.csv", "Global health (50 countries)"],
    ["popp_calls_for_service.csv", "Calls for service (240 calls)"], ["popp_academy_fitness.csv", "Academy fitness (60 cadets)"], ["popp_community_survey.csv", "Community survey (180 residents)"], ["STATC1000_Class_Data_Exam1.csv", "Class data with Exam 1 scores (lab M8)"],
    ["yrbs2023_teens_1500.csv", "CDC teen survey 2023: marijuana, sleep, grades, mood (1500 students)"], ["gss2018_beliefs_politics.csv", "General Social Survey 2018: astrology, science, politics (2348 adults)"], ["gss2022_politics_wellbeing.csv", "General Social Survey 2022: politics and wellbeing (3544 adults)"], ["big5_personality_1200.csv", "Big Five personality (1200 respondents)"], ["cadet_mile_times.csv", "Cadet mile times at weeks 1, 4, 8, 12, two groups (repeated measures)"], ["mauna_loa_co2_monthly.csv", "NOAA Mauna Loa monthly CO2, 2000 to 2026 (time series)"], ["big5_items_500.csv", "Big Five, 50 raw items, 500 respondents (reliability, factor analysis)"], ["lung_cancer_survival.csv", "Lung cancer survival, 227 patients (survival analysis)"]];

  // ================= output =================
  let cardN = 0;
  let TARGET = "#out";
  function showTab(name) { document.querySelectorAll(".tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name)); $("#out").classList.toggle("active", name === "analyses"); $("#outG").classList.toggle("active", name === "graphs"); document.querySelectorAll("#outG .plot").forEach((p) => { try { Plotly.Plots.resize(p); } catch (e) { } }); }
  function counts() { $("#cntA").textContent = $("#out").children.length || ""; $("#cntG").textContent = $("#outG").children.length || ""; }
  function card(title, meta, html) {
    const div = document.createElement("div"); div.className = "card"; div.id = "card" + ++cardN;
    div.innerHTML = `<div class="tools">${PENDING && PENDING.fn ? '<button data-act="edit" title="Reopen this analysis with the same choices, change anything, run again">edit</button>' : ""}<button data-act="copy">copy text</button><button data-act="close">remove</button></div><h2>${esc(title)}</h2><div class="meta">${esc(meta)}</div>${html}`;
    div.querySelector('[data-act="close"]').onclick = () => { div.remove(); counts(); };
    div.querySelector('[data-act="copy"]').onclick = () => navigator.clipboard.writeText(div.innerText);
    if (PENDING && PENDING.fn) { div._redo = { fn: PENDING.fn, values: Object.assign({}, PENDING.values), target: TARGET }; div.querySelector('[data-act="edit"]').onclick = () => editCard(div); }
    if (REPLACE && REPLACE.isConnected) { REPLACE._last = div; showTab(TARGET === "#outG" ? "graphs" : "analyses"); counts(); return div; }
    const out = $(TARGET); out.prepend(div); out.scrollTop = 0; showTab(TARGET === "#outG" ? "graphs" : "analyses"); counts(); return div;
  }
  function editCard(div) { // StatCrunch-style edit: same dialog, previous choices filled in, result replaces this card
    const r = div._redo; if (!r) return; CUR_FN = r.fn; PREFILL = r.values; REPLACE = div; const prev = TARGET; TARGET = r.target || "#out";
    try { r.fn(); } catch (err) { alert(err.message || err); } finally { TARGET = prev; }
  }
  function table(headers, rows, caption) {
    return (caption ? `<div class="cap">${esc(caption)}</div>` : "") + `<table class="res"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((r) => `<tr>${r.map((v, i) => `<td class="${i ? "num" : ""}">${typeof v === "number" ? fmt(v) : esc(v)}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
  }
  function plotDiv(div, traces, layout, h = 320) {
    const p = document.createElement("div"); p.className = "plot"; p.style.height = h + "px"; div.appendChild(p);
    Plotly.newPlot(p, traces, Object.assign({ margin: { t: 36, l: 50, r: 20, b: 50 }, font: { family: "Segoe UI, Arial", size: 12 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff" }, layout), { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["lasso2d", "select2d"] });
  }
  const pWord = (p) => (p < 0.0001 ? "p < 0.0001" : `p = ${p.toFixed(4)}`);
  const decision = (p, alpha) => (p <= alpha ? `${pWord(p)} is at or below alpha = ${alpha}: reject H0.` : `${pWord(p)} is above alpha = ${alpha}: fail to reject H0.`) + (p < 0.0001 ? " Write p < 0.001 in a report; a p-value is never exactly 0." : "");
  const altWord = (alt) => (alt === "two" ? "not equal to" : alt === "less" ? "less than" : "greater than");
  const say = (t) => `<div class="say">${t}</div>`, warn = (t) => `<div class="warn">${t}</div>`, ok = (t) => `<div class="ok">${t}</div>`, formula = (t) => `<div class="formula">${esc(t)}</div>`;
  const cond = (pass, yes, no) => (pass ? ok(yes) : warn(no));
  const smallGroups = (pairs, min = 5) => { const s = pairs.filter(([n]) => n < min); return s.length ? warn(`Small group: ${s.map(([n, g]) => `${g} has N = ${n}`).join("; ")}. A mean, SD or test from fewer than ${min} people is fragile and any normality check on it is meaningless. Say so in the write-up.`) : ""; };

  // ================= dialog =================
  function dialog(title, fields, onGo, goLabel = "Run") {
    const f = $("#dlgForm"); $("#dlgTitle").textContent = title; f.innerHTML = ""; f.dataset.target = TARGET;
    const groups = {}; let html = "";
    if (PREFILL) fields.filter(Boolean).forEach((fd) => { if (fd.name in PREFILL) fd = Object.assign(fd, { value: PREFILL[fd.name] }); });
    fields.filter(Boolean).forEach((fd) => {
      const id = "f_" + fd.name; let ctl = "";
      if (fd.type === "select" || fd.type === "multi") ctl = `<select id="${id}" name="${fd.name}" ${fd.type === "multi" ? "multiple" : ""}>${(fd.options || []).map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; const on = Array.isArray(fd.value) ? fd.value.map(String).includes(String(v)) : String(fd.value) === String(v); return `<option value="${esc(v)}" ${on ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
      else if (fd.type === "textarea") ctl = `<textarea id="${id}" name="${fd.name}" rows="${fd.rows || 6}" placeholder="${esc(fd.placeholder || "")}">${esc(fd.value || "")}</textarea>`;
      else if (fd.type === "check") ctl = `<label class="chk"><input type="checkbox" id="${id}" name="${fd.name}" ${fd.value ? "checked" : ""}> ${esc(fd.label)}</label>`;
      else ctl = `<input type="${fd.type || "text"}" id="${id}" name="${fd.name}" value="${fd.value == null ? "" : esc(fd.value)}" step="any" placeholder="${esc(fd.placeholder || "")}">`;
      const lab = fd.type === "check" ? "" : `<label for="${id}">${esc(fd.label)}</label>`;
      const block = `<div class="fld">${lab}${ctl}${fd.hint ? `<div class="hint">${esc(fd.hint)}</div>` : ""}</div>`;
      if (fd.group) { groups[fd.group] = (groups[fd.group] || "") + block; html += `<!--G:${fd.group}-->`; } else html += block;
    });
    const seen = new Set();
    html = html.replace(/<!--G:([^>]+)-->/g, (m, g) => { if (seen.has(g)) return ""; seen.add(g); const n = (groups[g].match(/class="fld"/g) || []).length; return `<fieldset><legend>${esc(g)}</legend><div class="${n >= 3 ? "row3" : n === 2 ? "row" : ""}">${groups[g]}</div></fieldset>`; });
    f.innerHTML = html + `<div class="actions"><button type="button" id="dlgCancel">Cancel</button><button type="submit" class="go">${esc(goLabel)}</button></div>`;
    $("#dlgCancel").onclick = () => $("#dlg").classList.remove("open");
    f.onsubmit = (e) => {
      e.preventDefault(); const v = {};
      fields.filter(Boolean).forEach((fd) => { const el = f.elements[fd.name]; if (!el) return; if (fd.type === "multi") v[fd.name] = [...el.selectedOptions].map((o) => o.value); else if (fd.type === "check") v[fd.name] = el.checked; else if (fd.type === "number") v[fd.name] = el.value === "" ? NaN : Number(el.value); else v[fd.name] = el.value; });
      const tgt = f.dataset.target || "#out"; const prev = TARGET; TARGET = tgt; PENDING = { fn: CUR_FN, values: v, title };
      try { onGo(v); $("#dlg").classList.remove("open"); if (REPLACE && REPLACE.isConnected && REPLACE._last) { REPLACE.replaceWith(REPLACE._last); } } catch (err) { alert(err.message || err); } finally { TARGET = prev; PENDING = null; REPLACE = null; PREFILL = null; }
    };
    $("#dlg").classList.add("open");
  }
  const needData = () => { if (!D.rows.length) throw new Error("Open a data file first (Data menu)."); };
  const sel = (name, label, options, value) => ({ name, label, type: "select", options, value });
  const selNum = (name, label) => sel(name, label, numCols());
  const selCat = (name, label) => sel(name, label, catCols());
  const lvField = { name: "lv", label: "If the grouping variable has more than two levels, name the two to compare, comma separated (blank = the first two)", type: "text" };
  const pickTwo = (g, lvText) => { let lv = [...new Set(col(g).filter((q) => q !== ""))]; if (lvText && lvText.trim()) { const pick = lvText.split(",").map((t) => t.trim()); const bad = pick.filter((t) => !lv.includes(t)); if (pick.length !== 2 || bad.length) throw new Error(`Levels of ${g}: ${lv.join(", ")}. Name exactly two of them.`); return pick; } if (lv.length > 2) return lv.slice(0, 2); if (lv.length !== 2) throw new Error(`${g} has ${lv.length} level.`); return lv; };
  const selAny = (name, label, none = true) => sel(name, label, (none ? [["", "(none)"]] : []).concat(D.cols));
  const hypField = (what) => sel("alt", "Hypothesis", [["two", what + " is not equal to Test value"], ["greater", what + " is greater than Test value"], ["less", what + " is less than Test value"]], "two");
  const confField = { name: "conf", label: "Confidence interval", type: "select", options: [["0.90", "90 percent"], ["0.95", "95 percent"], ["0.99", "99 percent"]], value: "0.95" };
  const alphaField = { name: "alpha", label: "Alpha (decision level)", type: "select", options: [["0.05", "0.05"], ["0.01", "0.01"], ["0.10", "0.10"]], value: "0.05" };
  const src = (extra) => `${D.name}${D.filter.trim() ? " [filter: " + D.filter + "]" : ""}${extra ? ", " + extra : ""}`;

  // ================= Exploration: Descriptives =================
  function descriptives() {
    needData();
    dialog("Exploration: Descriptives", [
      { name: "vars", label: "Variables (hold Cmd or Ctrl to pick several)", type: "multi", options: D.cols.filter((c) => D.types[c] !== "id") },
      selAny("by", "Split by"),
      { name: "freq", label: "Frequency tables (for nominal and ordinal variables)", type: "check", value: true, group: "Tables" },
      sel("qm", "Quartile method", [["halves", "Textbook rule: median of each half, overall median excluded (default)"], ["type7", "R rule (type 7, interpolated)"]], "halves"),
      ...[["n", "N", true], ["missing", "Missing", true], ["skew", "Skewness with its standard error", false], ["mean", "Mean", true], ["median", "Median", true], ["mode", "Mode", false], ["sum", "Sum", false], ["sd", "Std. deviation (sample, n minus 1)", true], ["variance", "Variance (sample)", false], ["sdpop", "Population std. deviation (divides by N)", false], ["range", "Range", false], ["min", "Minimum", true], ["max", "Maximum", true], ["se", "Std. error of mean (SE: spread of sample means, not of people)", false], ["iqr", "IQR", false], ["q", "Quartiles (25th, 50th, 75th)", false], ["fence", "Fences (1.5 IQR)", false]].map(([k, l, v]) => ({ name: k, label: l, type: "check", value: v, group: "Statistics" })),
      ...[["hist", "Histogram"], ["dens", "Density"], ["box", "Box plot"], ["dot", "Dot plot"], ["qq", "Q-Q plot"], ["bar", "Bar plot"]].map(([k, l]) => ({ name: k, label: l, type: "check", value: false, group: "Plots" })),
      { name: "lines", label: "Mark mean (solid) and median (dashed) on histograms", type: "check", value: true, group: "Plots" }], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const groups = v.by ? [...new Set(col(v.by).filter((g) => g !== ""))] : [null];
      const numV = v.vars.filter(isNum), catV = v.vars.filter((c) => !isNum(c));
      const cd = card("Descriptives", src(v.by ? "split by " + v.by : ""), "");
      if (numV.length) {
        const statList = [["n", "N", "n"], ["missing", "Missing", "missing"], ["mean", "Mean", "mean"], ["median", "Median", "median"], ["mode", "Mode (all ties shown)", "mode"], ["sum", "Sum", "sum"], ["sd", "Standard deviation (sample, n - 1)", "sd"], ["variance", "Variance (sample)", "variance"], ["sdpop", "Population SD (divides by N)", "sdPop"], ["sdpop", "Population variance", "variancePop"], ["skew", "Skewness", "skew"], ["skew", "Std. error skewness", "skewSE"], ["range", "Range", "range"], ["min", "Minimum", "min"], ["max", "Maximum", "max"], ["se", "Std. error of the mean (SE)", "se"], ["iqr", "IQR", "iqr"], ["q", "25th percentile", "q1"], ["q", "50th percentile", "median"], ["q", "75th percentile", "q3"], ["fence", "Lower fence", "lowerFence"], ["fence", "Upper fence", "upperFence"]].filter(([k]) => v[k]);
        const hdr = ["Statistic"].concat(numV.flatMap((x) => groups.map((g) => (g == null ? x : `${x} (${g})`))));
        const cells = numV.flatMap((x) => groups.map((g) => { const vals = g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); const d = SW.describe(vals, v.qm) || {}; d.sum = (d.mean || 0) * (d.n || 0); return d; }));
        const rows = statList.map(([k, lab, key]) => [lab].concat(cells.map((d) => (d[key] == null ? "" : d[key]))));
        cd.insertAdjacentHTML("beforeend", table(hdr, rows, "Descriptives") + (groups.length > 1 ? smallGroups(cells.map((d, i) => [d.n || 0, hdr[i + 1]])) : "") + (v.qm === "halves" ? say("Quartiles by the textbook rule: Q1 is the median of the lower half and Q3 the median of the upper half, with the overall median left out when n is odd. R and most software interpolate instead, so their quartiles can differ in the first decimal; neither is wrong, say which rule you used.") : say("Quartiles by the R interpolation rule (type 7). The textbook rule (median of each half) can differ in the first decimal.")) + (v.skew ? say("Skewness smaller than about twice its standard error is weak evidence of skew; do not call a distribution skewed on a number that small. Look at the histogram.") : "") + (cells.some((d) => d.missing > 0) ? warn("Some rows are blank for a variable and were dropped from that column only, so N differs across columns. Check N before comparing.") : "") + (v.sdpop ? say("Two standard deviations are shown. The sample one divides by n minus 1 and is the one this course reports (the data are a sample). The population one divides by N; calculators and spreadsheets sometimes use it, which is why a hand calculation can disagree with the table.") : "") + (v.mode ? say("Mode: when two or more values tie for most frequent, all of them are printed with the count. Most software prints only one and does not say so.") : "") + say("Shape from two numbers: mean above median points to a right tail, mean below median to a left tail. Report a pair: mean with standard deviation when symmetric, median with IQR when skewed or with outliers."));
      }
      if (v.freq && catV.length) catV.forEach((x) => { groups.forEach((g) => { const vals = g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); const c = SW.counts(vals), keys = Object.keys(c).sort(), n = keys.reduce((s, k) => s + c[k], 0); let cum = 0; const miss = vals.filter((q) => q === "").length; cd.insertAdjacentHTML("beforeend", table(["Levels", "Counts", "Relative frequency", "Percent", "Cumulative percent"], keys.map((k) => { cum += c[k]; return [k, c[k], fmt(c[k] / n, 3), fmt((100 * c[k]) / n, 1) + "%", fmt((100 * cum) / n, 1) + "%"]; }).concat([["Total (non-missing)", n, "1.000", "100%", ""]]), `Frequencies of ${x}${g == null ? "" : " (" + g + ")"}`) + (miss ? warn(`${miss} blank${miss > 1 ? "s" : ""} excluded: percentages are out of ${n}, not ${n + miss}.`) : "")); }); });
      // plots
      numV.forEach((x) => {
        const d = SW.describe(col(x)) || {};
        if (v.hist || v.dens) { const B = SW.histBins(col(x)); const traces = groups.map((g) => { const vals = g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); const counts = SW.countsWith(B.edges, vals), n = counts.reduce((s, q) => s + q, 0); return { x: B.mids, y: counts.map((c) => (v.dens ? c / (n * B.width) : c)), width: B.width, type: "bar", name: g == null ? x : String(g), opacity: groups.length > 1 ? 0.6 : 1, text: v.dens ? undefined : counts.map(String), textposition: "outside", cliponaxis: false, marker: { color: groups.length > 1 ? undefined : "#3A7CA5", line: { color: "#fff", width: 1 } }, hovertext: B.labels.map((l, j) => `${l}: ${counts[j]}`), hoverinfo: "text+name" }; });
          const ymaxH = Math.max(...traces.flatMap((t) => t.y));
          const shapes = v.lines && groups.length === 1 ? [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }] : [];
          plotDiv(cd, traces, { barmode: "overlay", bargap: 0, title: `Histogram of ${x} (bin width ${B.width})`, xaxis: { title: x, tickvals: B.edges.length <= 16 ? B.edges : undefined }, yaxis: { title: v.dens ? "density" : "Count", range: [0, ymaxH * 1.18], fixedrange: true }, shapes }); }
        if (v.box) plotDiv(cd, groups.map((g) => ({ y: SW.num(g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g)), type: "box", hoveron: "points", hoverinfo: "y+name", quartilemethod: "exclusive", name: g == null ? x : String(g), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { title: `Box plot of ${x}`, yaxis: { title: x }, showlegend: false });
        if (v.dot) { const xs = SW.num(col(x)).sort((a, b) => a - b), bw = (d.range || 1) / 40 || 1, bins = {}; const ys = xs.map((val) => { const b = Math.round(val / bw); bins[b] = (bins[b] || 0) + 1; return bins[b]; }); plotDiv(cd, [{ x: xs, y: ys, mode: "markers", type: "scatter", marker: { size: 9, color: "#3A7CA5" } }], { title: `Dot plot of ${x}`, yaxis: { visible: false }, xaxis: { title: x } }); }
        if (v.qq) { const q = SW.qq(col(x)), lo = Math.min(...q.map((p) => p.theo)), hi = Math.max(...q.map((p) => p.theo)); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" }, name: "data" }, { x: [lo, hi], y: [d.mean + lo * d.sd, d.mean + hi * d.sd], mode: "lines", line: { color: "#C0392B" }, name: "normal" }], { title: `Q-Q plot of ${x} (points on the line means roughly normal)`, xaxis: { title: "theoretical quantiles" }, yaxis: { title: x } }); }
      });
      if (v.bar) catV.forEach((x) => { const c = SW.counts(col(x)), keys = Object.keys(c); plotDiv(cd, [{ x: keys, y: keys.map((k) => c[k]), type: "bar", marker: { color: "#3A7CA5" } }], { title: `Bar plot of ${x}`, yaxis: { title: "Count" } }); });
    });
  }
  function scatterUI() {
    needData();
    dialog("Exploration: Scatterplot", [selNum("x", "X axis"), selNum("y", "Y axis"), selAny("by", "Group (colour)"), sel("line", "Regression line", [["none", "None"], ["linear", "Linear"]], "linear")], (v) => {
      const r = SW.regress(col(v.x), col(v.y));
      const cd = card("Scatterplot", src(`${v.y} against ${v.x}, r = ${fmt(r.r)}`), say("Describe direction, form, strength, and outliers. Correlation measures linear association only; it is not causation."));
      const groups = v.by ? [...new Set(col(v.by))] : [null];
      const traces = groups.map((g) => { const keep = (i) => g == null || col(v.by)[i] === g; return { x: col(v.x).filter((_, i) => keep(i)), y: col(v.y).filter((_, i) => keep(i)), mode: "markers", type: "scatter", name: g == null ? "data" : String(g) }; });
      if (v.line === "linear") { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: `y = ${fmt(r.b0, 3)} + ${fmt(r.b1, 4)} x`, line: { color: "#C0392B" } }); }
      plotDiv(cd, traces, { xaxis: { title: v.x }, yaxis: { title: v.y } });
    });
  }


  // ================= Graph (StatCrunch-style) =================
  const toGraphs = (fn) => () => { TARGET = "#outG"; try { fn(); } finally { setTimeout(() => (TARGET = "#out"), 0); } };
  const appearanceFields = () => [{ name: "gtitle", label: "Graph title (optional)", type: "text", group: "Appearance" }, { name: "xlab", label: "X axis label (optional)", type: "text", group: "Appearance" }, { name: "ylab", label: "Y axis label (optional)", type: "text", group: "Appearance" }, { name: "gcolor", label: "Color", type: "color", value: "#3A7CA5", group: "Appearance" }];
  const C = (v) => (v && v.gcolor) || "#3A7CA5";
  function applyAppearance(layout, v) { if (v.gtitle) layout.title = v.gtitle; if (v.xlab) { layout.xaxis = Object.assign(layout.xaxis || {}, { title: v.xlab }); } if (v.ylab) { layout.yaxis = Object.assign(layout.yaxis || {}, { title: v.ylab }); } return layout; }
  function groupsOf(v) { return v.by ? [...new Set(col(v.by).filter((g) => g !== ""))] : [null]; }
  function subset(x, v, g) { return g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); }
  function meanMedianShapes(d) { return [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }]; }
  const honest = (items) => `<div class="formula">${esc("Honest-graph rules applied: " + items.join(" "))}</div>`;
  function gBar() {
    needData();
    dialog("Graph: Bar Plot", [selCat("x", "Categorical variable"), selAny("by", "Group by"), sel("type", "Type", [["count", "Frequency (counts)"], ["rel", "Percent (relative frequency times 100)"]], "count"), sel("order", "Order", [["auto", "automatic (tallest first; ordinal scales keep their natural order)"], ["count", "tallest first"], ["alpha", "alphabetical"], ["data", "order of first appearance"]], "auto"), { name: "labels", label: "Show the count (or percent) above each bar", type: "check", value: true }, { name: "tbl", label: "Frequency table under the graph", type: "check", value: true }, { name: "horiz", label: "Horizontal bars", type: "check", value: false }, ...appearanceFields()], (v) => {
      const groups = groupsOf(v); const c0 = SW.counts(col(v.x)); let keys = Object.keys(c0); const nat = SW.naturalOrder(keys), ordinal = D.types[v.x] === "ordinal" || !!nat;
      let order = v.order; if (order === "auto") order = ordinal ? "natural" : "count";
      if (order === "count") keys.sort((a, b) => c0[b] - c0[a]); else if (order === "alpha") keys.sort(); else if (order === "natural" && nat) keys = nat;
      const nAll = Object.values(c0).reduce((s, q) => s + q, 0);
      const traces = groups.map((g) => { const c = SW.counts(subset(v.x, v, g)), n = Object.values(c).reduce((s, q) => s + q, 0); const y = keys.map((k) => (v.type === "rel" ? (100 * (c[k] || 0)) / n : c[k] || 0)); const text = v.labels ? y.map((q) => (v.type === "rel" ? fmt(q, 1) + "%" : String(q))) : undefined; const base = { type: "bar", name: g == null ? v.x : String(g), text, textposition: "outside", cliponaxis: false, marker: g == null ? { color: C(v) } : {} }; return v.horiz ? Object.assign(base, { y: keys, x: y, orientation: "h" }) : Object.assign(base, { x: keys, y }); });
      const ymax = Math.max(...traces.flatMap((t) => (v.horiz ? t.x : t.y)));
      let html = say("Bars are separated because the categories are separate things. " + (order === "natural" ? "This variable is an ordered scale, so the bars keep their natural order; sorting an ordered scale by height would hide its shape." : "Tallest first tells the eye what the story is.") + " Relative frequency lets you compare groups of different sizes.");
      if (v.tbl) { const rows = keys.map((k) => [k, c0[k], fmt(c0[k] / nAll, 3), fmt((100 * c0[k]) / nAll, 1) + "%"]); rows.push(["Total", nAll, "1.000", "100%"]); html += table([v.x, "Frequency", "Relative frequency", "Percent"], rows, "Frequency table" + (groups.length > 1 ? " (all groups together)" : "")); }
      const cd = card("Bar Plot: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${nAll}`), html);
      const axis = { title: v.type === "rel" ? (groups.length > 1 ? "Percent within group" : "Percent") : "Count", range: [0, ymax * 1.18], fixedrange: true };
      plotDiv(cd, traces, applyAppearance({ barmode: "group", [v.horiz ? "xaxis" : "yaxis"]: axis, [v.horiz ? "yaxis" : "xaxis"]: { type: "category", title: v.x }, showlegend: groups.length > 1 }, v));
      cd.insertAdjacentHTML("beforeend", honest(["The count axis starts at zero and cannot be zoomed, so a small difference cannot be stretched into a big one.", "All bars have the same width; only height carries information.", v.type === "rel" && groups.length > 1 ? "Percents are within each group, so groups of different sizes compare fairly." : "", "No 3D, no pictures for bars."].filter(Boolean)));
    });
  }
  function gPie() {
    needData();
    dialog("Graph: Pie Chart", [selCat("x", "Categorical variable"), { name: "labels", label: "Show percent and count", type: "check", value: true }], (v) => {
      const c = SW.counts(col(v.x)), keys = Object.keys(c).sort((a, b) => c[b] - c[a]), n = Object.values(c).reduce((s, q) => s + q, 0);
      const cd = card("Pie Chart: " + v.x, src(`n = ${n}`), say("A pie is only for parts of one whole, and similar slices are hard to compare by eye. A bar chart is almost always the safer choice."));
      plotDiv(cd, [{ labels: keys, values: keys.map((k) => c[k]), type: "pie", textinfo: v.labels ? "label+percent+value" : "label", sort: false, direction: "clockwise" }], {});
      cd.insertAdjacentHTML("beforeend", honest(["Flat, not 3D: a tilted pie makes the front slices look bigger than they are.", "Slices add to 100 percent of one group of " + n + ".", "Percent and count are printed so nobody has to judge angles by eye."]));
    });
  }
  function gHist() {
    needData();
    dialog("Graph: Histogram", [selNum("x", "Numeric variable"), selAny("by", "Group by"), sel("type", "Type", [["count", "Frequency"], ["rel", "Percent (relative frequency times 100)"], ["dens", "Density"]], "count"), { name: "bw", label: "Bin width (blank = automatic)", type: "number", value: "" }, { name: "start", label: "Start bins at (blank = automatic)", type: "number", value: "" }, { name: "labels", label: "Show the frequency above each bin", type: "check", value: true }, { name: "tbl", label: "Frequency table under the graph", type: "check", value: true }, { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }, ...appearanceFields()], (v) => {
      const groups = groupsOf(v); const d = SW.describe(col(v.x)) || {};
      const B = SW.histBins(col(v.x), Number.isFinite(v.bw) && v.bw > 0 ? v.bw : null, Number.isFinite(v.start) ? v.start : null); if (!B) throw new Error("No numeric values.");
      if (B.counts.length > 200) throw new Error("That bin width gives more than 200 bins. Use a wider bin.");
      const traces = groups.map((g) => { const counts = g == null ? B.counts : SW.countsWith(B.edges, subset(v.x, v, g)), n = counts.reduce((s, q) => s + q, 0); const y = counts.map((c) => (v.type === "rel" ? (100 * c) / n : v.type === "dens" ? c / (n * B.width) : c)); return { x: B.mids, y, width: B.width, type: "bar", name: g == null ? v.x : String(g), opacity: groups.length > 1 ? 0.6 : 1, text: v.labels ? y.map((q, j) => (v.type === "count" ? String(counts[j]) : fmt(q, v.type === "rel" ? 1 : 3))) : undefined, textposition: "outside", cliponaxis: false, marker: { color: groups.length > 1 ? undefined : C(v), line: { color: "#fff", width: 1 } }, hovertext: B.labels.map((l, j) => `${l}: ${counts[j]}`), hoverinfo: "text+name" }; });
      const ymax = Math.max(...traces.flatMap((t) => t.y));
      let html = say("Bars touch because the number line has no gaps. Bin width is a decision: too few bins hide structure, too many turn noise into peaks. Try two or three widths before believing a feature. Read shape (symmetric, skewed, peaks), centre, spread, and anything unusual.");
      if (v.tbl) { let cum = 0; html += table(["Class", "Frequency", "Relative frequency", "Percent", "Cumulative frequency"], B.counts.map((c, j) => { cum += c; return [B.labels[j], c, fmt(c / B.n, 3), fmt((100 * c) / B.n, 1) + "%", cum]; }).concat([["Total", B.n, "1.000", "100%", ""]]), `Frequency table, bin width ${B.width}` + (groups.length > 1 ? " (all groups together)" : "")); }
      const cd = card("Histogram: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}, s = ${fmt(d.sd)}; ${B.counts.length} bins of width ${B.width} from ${B.start}`), html);
      plotDiv(cd, traces, applyAppearance({ barmode: "overlay", bargap: 0, xaxis: { title: v.x, tickvals: B.edges.length <= 16 ? B.edges : undefined, tickangle: B.edges.length > 8 ? -45 : 0 }, yaxis: { title: v.type === "rel" ? "Percent" : v.type === "dens" ? "Density" : "Count", range: [0, ymax * 1.18], fixedrange: true }, shapes: v.lines && groups.length === 1 ? meanMedianShapes(d) : [], showlegend: groups.length > 1 }, v));
      cd.insertAdjacentHTML("beforeend", honest([`Every bin has the same width (${B.width}), so area equals height and the eye is not fooled by a wide bin.`, "Each class includes its left edge; the last class also includes the maximum, so every value is counted once.", "The count axis starts at zero and cannot be zoomed.", groups.length > 1 ? "All groups share the same bin edges; different bins per group would make the shapes incomparable." : "", "Tick marks sit on the bin edges, so you can read exactly where each class begins and ends."].filter(Boolean)));
    });
  }
  function gDot() {
    needData();
    dialog("Graph: Dotplot", [selNum("x", "Numeric variable"), selAny("by", "Group by"), { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }, ...appearanceFields()], (v) => {
      const groups = groupsOf(v); const d = SW.describe(col(v.x)) || {}; const bw = (d.range || 1) / 45 || 1;
      const traces = groups.map((g, gi) => { const xs = SW.num(subset(v.x, v, g)).sort((a, b) => a - b), bins = {}; const ys = xs.map((val) => { const b = Math.round(val / bw); bins[b] = (bins[b] || 0) + 1; return bins[b] + gi * 0; }); return { x: xs, y: ys, mode: "markers", type: "scatter", name: g == null ? v.x : String(g), marker: { size: 9, color: groups.length > 1 ? undefined : C(v) }, xaxis: "x", yaxis: groups.length > 1 ? "y" + (gi + 1) : "y" }; });
      const layout = { xaxis: { title: v.x }, showlegend: false, grid: groups.length > 1 ? { rows: groups.length, columns: 1, pattern: "coupled" } : undefined, shapes: v.lines && groups.length === 1 ? meanMedianShapes(d) : [] };
      groups.forEach((g, gi) => { layout["yaxis" + (gi ? gi + 1 : "")] = { visible: false, title: g == null ? "" : String(g) }; });
      const cd = card("Dotplot: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}`), say("One dot per observation, nothing hidden. The picture behind every summary number."));
      plotDiv(cd, traces, applyAppearance(layout, v), groups.length > 1 ? 120 * groups.length + 80 : 300);
    });
  }
  function gBox() {
    needData();
    dialog("Graph: Boxplot", [{ name: "vars", label: "Numeric variables (several draw side by side)", type: "multi", options: numCols() }, selAny("by", "Group by"), { name: "pts", label: "Show all points", type: "check", value: false }, { name: "horiz", label: "Horizontal", type: "check", value: false }, ...appearanceFields()], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const groups = groupsOf(v); const traces = [];
      v.vars.forEach((x) => groups.forEach((g) => { const vals = SW.num(subset(x, v, g)); traces.push(Object.assign({ type: "box", quartilemethod: "exclusive", name: (v.vars.length > 1 ? x : "") + (g == null ? (v.vars.length > 1 ? "" : x) : (v.vars.length > 1 ? " " : "") + String(g)), boxpoints: v.pts ? "all" : "outliers", jitter: 0.3, hoveron: "points", hoverinfo: v.horiz ? "x+name" : "y+name", marker: { color: C(v) } }, v.horiz ? { x: vals } : { y: vals })); }));
      const fences = v.vars.map((x) => { const d = SW.describe(col(x)); return `${x}: Q1 ${fmt(d.q1)}, median ${fmt(d.median)}, Q3 ${fmt(d.q3)}, fences ${fmt(d.lowerFence)} and ${fmt(d.upperFence)}`; }).join("; ");
      const cd = card("Boxplot: " + v.vars.join(", ") + (v.by ? " by " + v.by : ""), src(fences), say("Box from Q1 to Q3 (textbook rule: median of each half, overall median excluded), line at the median, whiskers to the last values inside the fences, dots beyond. Dots are worth a look, not wrong. Shape decides the summary: symmetric, mean with s; skewed or with dots, median with IQR."));
      plotDiv(cd, traces, applyAppearance({ [v.horiz ? "xaxis" : "yaxis"]: { title: v.vars.length === 1 ? v.vars[0] : "" }, showlegend: false }, v));
    });
  }
  function gScatter() {
    needData();
    dialog("Graph: Scatter Plot", [selNum("x", "X variable"), selNum("y", "Y variable"), selAny("by", "Color by"), { name: "line", label: "Least-squares line", type: "check", value: true }, { name: "label", label: "Label points with (optional column)", type: "select", options: [["", "(none)"]].concat(D.cols) }, ...appearanceFields()], (v) => {
      const r = SW.regress(col(v.x), col(v.y)); const groups = groupsOf(v);
      const traces = groups.map((g) => { const keep = (i) => g == null || col(v.by)[i] === g; const tr = { x: col(v.x).filter((_, i) => keep(i)), y: col(v.y).filter((_, i) => keep(i)), mode: v.label ? "markers+text" : "markers", type: "scatter", name: g == null ? "data" : String(g), textposition: "top center", textfont: { size: 9 } }; if (v.label) tr.text = col(v.label).filter((_, i) => keep(i)); if (g == null) tr.marker = { color: C(v) }; return tr; });
      if (v.line) { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: `y = ${fmt(r.b0, 3)} + ${fmt(r.b1, 4)} x`, line: { color: "#C0392B" } }); }
      const cd = card(`Scatter Plot: ${v.y} against ${v.x}`, src(`n = ${r.n}, r = ${fmt(r.r)}, r squared = ${fmt(r.r2)}`), say("Describe direction, form, strength, and outliers, in that order. r measures linear association only. Correlation is not causation."));
      plotDiv(cd, traces, applyAppearance({ xaxis: { title: v.x }, yaxis: { title: v.y }, showlegend: groups.length > 1 || v.line }, v));
    });
  }
  function gQQ() {
    needData();
    dialog("Graph: QQ Plot (normality check)", [selNum("x", "Numeric variable"), selAny("by", "Group by")], (v) => {
      const groups = groupsOf(v); const cd = card("QQ Plot: " + v.x, src(), say("Points along the line: roughly normal. A curve at one end: skew. Points peeling off at both ends: heavy tails or outliers. Use this to justify a t procedure when n is under 30."));
      groups.forEach((g) => { const vals = subset(v.x, v, g), d = SW.describe(vals), q = SW.qq(vals), lo = Math.min(...q.map((p) => p.theo)), hi = Math.max(...q.map((p) => p.theo)); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" }, name: "data" }, { x: [lo, hi], y: [d.mean + lo * d.sd, d.mean + hi * d.sd], mode: "lines", line: { color: "#C0392B" }, name: "normal" }], { title: g == null ? v.x : `${v.x} (${g})`, xaxis: { title: "theoretical quantiles" }, yaxis: { title: v.x }, showlegend: false }, 280); });
    });
  }
  function gStem() {
    needData();
    dialog("Graph: Stem and Leaf", [selNum("x", "Numeric variable"), sel("unit", "Leaf unit", [["auto", "automatic"], ["0.01", "0.01"], ["0.1", "0.1"], ["1", "1"], ["10", "10"]], "auto")], (v) => {
      const x = SW.num(col(v.x)).sort((a, b) => a - b); const d = SW.describe(x);
      let unit = v.unit === "auto" ? Math.pow(10, Math.floor(Math.log10(Math.max(d.range, 1e-9) / 15))) : Number(v.unit);
      const stems = {}; x.forEach((val) => { const q = Math.round(val / unit); const s = Math.floor(q / 10), l = Math.abs(q - s * 10); (stems[s] = stems[s] || []).push(l); });
      const keys = Object.keys(stems).map(Number).sort((a, b) => a - b); const lo = keys[0], hi = keys[keys.length - 1]; let txt = "";
      for (let s = lo; s <= hi; s++) txt += String(s).padStart(5) + " | " + (stems[s] || []).sort((a, b) => a - b).join(" ") + "\n";
      const cd = card("Stem and Leaf: " + v.x, src(`leaf unit = ${unit}; ${v.x} = (stem times 10 + leaf) times ${unit}`), `<pre style="font-family:var(--mono);font-size:13px;line-height:1.35;margin:6px 0">${esc(txt)}</pre>` + say("A histogram that keeps every value. Read the shape sideways: a long tail of stems with few leaves is the skew."));
    });
  }

  // ================= T-Tests =================
  function tOneSample() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: One Sample T-Test", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      hasData ? selNum("x", "Dependent variable") : null,
      { name: "xbar", label: "Mean", type: "number", group: "Summary statistics" }, { name: "s", label: "Std. deviation", type: "number", group: "Summary statistics" }, { name: "n", label: "N", type: "number", group: "Summary statistics" },
      { name: "mu0", label: "Test value", type: "number", value: 0 }, hypField("Mean"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size (Cohen's d)", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      let xbar = v.xbar, s = v.s, n = v.n, label = "value", from = "summary statistics";
      if (v.mode === "data") { const d = SW.describe(col(v.x)); if (!d) throw new Error("Need at least two numeric values."); xbar = d.mean; s = d.sd; n = d.n; label = v.x; from = src(); }
      const r = SW.oneMean({ xbar, s, n, mu0: v.mu0, alt: v.alt, conf: +v.conf });
      const hdr = ["", "", "Statistic", "df", "p"], row = [label, "Student's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference"); row.push(xbar - v.mu0); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower - v.mu0, r.upper - v.mu0); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "One Sample T-Test") + `<div class="note">Note. H<sub>a</sub> mu ${altWord(v.alt)} ${v.mu0}. Confidence interval is for the mean difference; the interval for the mean itself is ${fmt(r.lower)} to ${fmt(r.upper)}.</div>`;
      if (v.desc) html += table(["", "N", "Mean", "Median", "SD", "SE"], [[label, n, xbar, v.mode === "data" ? SW.describe(col(v.x)).median : "", s, r.se]], "Descriptives");
      html += formula(`t = (x bar minus test value) / (s / sqrt(n)), df = n minus 1. Sigma is not given, so t, never z.`);
      html += say(`H0: mu = ${v.mu0}. Ha: mu ${altWord(v.alt)} ${v.mu0}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population mean of ${label} is ${altWord(v.alt)} ${v.mu0}.` : `There is not enough evidence that the population mean of ${label} is ${altWord(v.alt)} ${v.mu0}.`} The sample mean is ${fmt(xbar)}, ${fmt(Math.abs(r.d), 2)} standard deviations from ${v.mu0}.`);
      html += cond(n >= 30, "N is at least 30: the t procedure is fine whatever the population shape.", "N is under 30: this needs a roughly normal population (check the Q-Q plot in Descriptives); state that the assumptions are met.");
      const cd = card("One Sample T-Test", from, html); tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function tIndependent() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: Independent Samples T-Test", [
      hasData ? sel("mode", "Data", [["data", "dependent variable and grouping variable"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      hasData ? selNum("x", "Dependent variable") : null, hasData ? selCat("g", "Grouping variable") : null, hasData ? { name: "lv", label: "If the grouping variable has more than two levels, name the two to compare, comma separated (blank = the first two)", type: "text" } : null,
      { name: "m1", label: "Mean 1", type: "number", group: "Group 1" }, { name: "s1", label: "SD 1", type: "number", group: "Group 1" }, { name: "n1", label: "N 1", type: "number", group: "Group 1" },
      { name: "m2", label: "Mean 2", type: "number", group: "Group 2" }, { name: "s2", label: "SD 2", type: "number", group: "Group 2" }, { name: "n2", label: "N 2", type: "number", group: "Group 2" },
      { name: "welch", label: "Welch's (unequal variances, the default in this course)", type: "check", value: true, group: "Tests" },
      sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" }, { name: "plot", label: "Descriptives plots", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      let a, b, names = ["Group 1", "Group 2"], from = "summary statistics", ga = [], gb = [];
      if (v.mode === "data") { let lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (v.lv && v.lv.trim()) { const pick = v.lv.split(",").map((s) => s.trim()); const bad = pick.filter((s) => !lv.includes(s)); if (pick.length !== 2 || bad.length) throw new Error(`Levels of ${v.g}: ${lv.join(", ")}. Name exactly two of them.`); lv = pick; } else if (lv.length > 2) lv = lv.slice(0, 2); if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} level.`); names = lv; ga = col(v.x).filter((_, i) => col(v.g)[i] === lv[0]); gb = col(v.x).filter((_, i) => col(v.g)[i] === lv[1]); a = SW.describe(ga); b = SW.describe(gb); from = src(`${v.x} by ${v.g}`); }
      else { a = { mean: v.m1, sd: v.s1, n: v.n1 }; b = { mean: v.m2, sd: v.s2, n: v.n2 }; }
      const r = SW.twoMeans({ m1: a.mean, s1: a.sd, n1: a.n, m2: b.mean, s2: b.sd, n2: b.n, alt: v.alt, conf: +v.conf, pooled: !v.welch });
      const hdr = ["", "", "Statistic", "df", "p"], row = [v.mode === "data" ? v.x : "value", v.welch ? "Welch's t" : "Student's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference", "SE difference"); row.push(r.diff, r.se); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower, r.upper); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "Independent Samples T-Test") + `<div class="note">Note. H<sub>a</sub> mu<sub>${esc(names[0])}</sub> ${altWord(v.alt)} mu<sub>${esc(names[1])}</sub>. ${v.welch ? "Welch's df comes from the two standard errors, so it is a decimal." : "Student's t pools the two variances and uses df = n1 + n2 minus 2; it assumes the two groups have equal spread."}</div>`;
      if (v.desc) html += table(["", "Group", "N", "Mean", "SD", "SE"], [[v.mode === "data" ? v.x : "", names[0], a.n, a.mean, a.sd, a.sd / Math.sqrt(a.n)], ["", names[1], b.n, b.mean, b.sd, b.sd / Math.sqrt(b.n)]], "Group Descriptives");
      html += formula(v.welch ? `t = (x bar 1 minus x bar 2) / sqrt(s1^2 / n1 + s2^2 / n2)` : `t = (x bar 1 minus x bar 2) / (sp sqrt(1/n1 + 1/n2)), sp^2 = ((n1 minus 1) s1^2 + (n2 minus 1) s2^2) / (n1 + n2 minus 2)`);
      html += say(`H0: the two population means are equal. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${names[0]} is ${altWord(v.alt)} the mean of ${names[1]}.` : `There is not enough evidence of a difference between the means of ${names[0]} and ${names[1]}.`} We are ${Math.round(r.conf * 100)} percent confident the difference in population means is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      if (v.mode === "data") { const all = [...new Set(col(v.g).filter((q) => q !== ""))]; if (all.length > 2) html += say(`${v.g} has ${all.length} levels (${all.join(", ")}); this test compares ${names[0]} with ${names[1]} only. Choosing which two is your decision to defend; for all groups at once use One-Way ANOVA.`); }
      html += smallGroups([[a.n, names[0]], [b.n, names[1]]]) + cond(a.n >= 30 && b.n >= 30, "Both groups have N at least 30.", "A group has N under 30: needs roughly normal populations (check box plots); state that the assumptions are met.") + say("Independent samples: different individuals in each group. If the same individuals were measured twice, use the Paired Samples T-Test.");
      const cd = card("Independent Samples T-Test", from, html);
      if (v.plot && v.mode === "data") plotDiv(cd, [{ y: SW.num(ga), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(names[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(gb), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(names[1]), marker: { color: "#D97D54" } }], { yaxis: { title: v.x }, showlegend: false });
      tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function tPaired() {
    needData();
    dialog("T-Tests: Paired Samples T-Test", [selNum("a", "Paired variable 1"), selNum("b", "Paired variable 2"), sel("alt", "Hypothesis", [["two", "Measure 1 not equal to Measure 2"], ["greater", "Measure 1 greater than Measure 2"], ["less", "Measure 1 less than Measure 2"]], "two"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" }, { name: "plot", label: "Histogram of differences", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      if (v.a === v.b) throw new Error("Pick two different variables: the two measurements on the same people.");
      const r = SW.paired(col(v.a), col(v.b), { alt: v.alt, conf: +v.conf });
      if (!r || !(r.n > 1)) throw new Error(`Need at least 2 rows where both ${v.a} and ${v.b} are numbers.`);
      const hdr = ["", "", "", "Statistic", "df", "p"], row = [v.a, v.b, "Student's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference", "SE difference"); row.push(r.dbar, r.se); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower, r.upper); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "Paired Samples T-Test") + `<div class="note">Note. H<sub>a</sub> mu<sub>Measure 1 minus Measure 2</sub> ${altWord(v.alt)} 0. Difference = ${esc(v.a)} minus ${esc(v.b)}.</div>`;
      if (v.desc) { const da = SW.describe(col(v.a)), db = SW.describe(col(v.b)); html += table(["", "N", "Mean", "Median", "SD", "SE"], [[v.a, da.n, da.mean, da.median, da.sd, da.se], [v.b, db.n, db.mean, db.median, db.sd, db.se]], "Descriptives"); }
      html += formula(`d = ${v.a} minus ${v.b} for each pair; t = d bar / (s_d / sqrt(n)), df = n minus 1`);
      html += say(`H0: the mean difference is 0. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${v.a} is ${altWord(v.alt)} the mean of ${v.b} for the same individuals.` : `There is not enough evidence of a difference between ${v.a} and ${v.b}.`} Mean difference ${fmt(r.dbar)}, ${Math.round(r.conf * 100)} percent interval ${fmt(r.lower)} to ${fmt(r.upper)}.`) + say("Paired because each row is one unit measured twice. Pairing removes unit-to-unit variability, which is why the SE is small.");
      const cd = card("Paired Samples T-Test", src(), html);
      if (v.plot) plotDiv(cd, [{ x: r.differences, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 1 } } }], { xaxis: { title: `difference: ${v.a} minus ${v.b}` }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: 0, x1: 0, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash", width: 2 } }] });
      tPlot(cd, r.t, r.df, v.alt);
    });
  }

  // ================= ANOVA =================
  function anovaUI() {
    needData();
    dialog("ANOVA: One-Way ANOVA", [selNum("x", "Dependent variable"), selCat("g", "Grouping variable"),
      { name: "fisher", label: "Assume equal (Fisher's)", type: "check", value: true, group: "Variances" }, { name: "welch", label: "Don't assume equal (Welch's)", type: "check", value: false, group: "Variances" },
      { name: "desc", label: "Descriptives table", type: "check", value: true, group: "Additional statistics" }, { name: "plot", label: "Descriptives plots", type: "check", value: true, group: "Additional statistics" },
      { name: "tukey", label: "Post-Hoc Tests: Tukey", type: "check", value: true, group: "Post-Hoc" }, { name: "homo", label: "Homogeneity test (largest SD over smallest)", type: "check", value: true, group: "Assumption Checks" }, alphaField], (v) => {
      const groups = {}; col(v.g).forEach((g, i) => { if (g !== "") (groups[g] = groups[g] || []).push(col(v.x)[i]); });
      const r = SW.anova(groups);
      let html = "";
      if (v.fisher) html += table(["", "", "F", "df1", "df2", "p"], [[v.x, "Fisher's", r.F, r.df1, r.df2, SW.fmtP(r.p)]], "One-Way ANOVA");
      if (v.welch) { const w = welchAnova(r); html += table(["", "", "F", "df1", "df2", "p"], [[v.x, "Welch's", w.F, w.df1, w.df2, SW.fmtP(w.p)]], "One-Way ANOVA (Welch's)"); }
      html += table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p"], [[v.g, r.ssb, r.df1, r.msb, r.F, SW.fmtP(r.p)], ["Residuals", r.ssw, r.df2, r.msw, "", ""]], `ANOVA - ${v.x}`);
      if (v.desc) html += table(["", v.g, "N", "Mean", "SD", "SE"], r.groups.map((q, i) => [i ? "" : v.x, q.name, q.n, q.mean, q.sd, q.sd / Math.sqrt(q.n)]), "Group Descriptives");
      html += formula(`H0: all group means equal. F = MS between / MS within, df = (k minus 1, N minus k). R squared = SS between / SS total = ${fmt(r.r2)}.`);
      html += say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `At least one group mean of ${v.x} differs across ${v.g}; the F test does not say which. Read the post-hoc table.` : `There is not enough evidence that the mean of ${v.x} differs across ${v.g}.`}`);
      html += smallGroups(r.groups.map((q) => [q.n, q.name]));
      if (v.homo) html += cond(r.sdRatio <= 2, `Largest SD over smallest SD = ${fmt(r.sdRatio, 2)}, under 2: equal-spread condition holds.`, `Largest SD over smallest SD = ${fmt(r.sdRatio, 2)}, above 2: equal-spread condition fails; use Welch's and read with caution.`);
      if (v.tukey) html += table([v.g, "", v.g, "Mean Difference", "SE", "df", "t", "p-tukey"], r.tukey.map((t) => [t.a, "-", t.b, t.diff, t.se, r.df2, t.diff / t.se, Number.isFinite(t.p) ? SW.fmtP(t.p) : "n/a"]), `Post Hoc Comparisons - ${v.g}`) + `<div class="note">Note. p-tukey is adjusted for all ${r.tukey.length} pairwise comparisons.</div>`;
      const cd = card("One-Way ANOVA", src(`${v.x} by ${v.g}`), html);
      if (v.plot) plotDiv(cd, r.groups.map((q) => ({ y: q.x, type: "box", hoveron: "points", hoverinfo: "y+name", quartilemethod: "exclusive", name: String(q.name), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: { title: v.x }, showlegend: false });
    });
  }
  function welchAnova(r) {
    const w = r.groups.map((g) => g.n / (g.sd * g.sd)), W = w.reduce((s, x) => s + x, 0);
    const gm = r.groups.reduce((s, g, i) => s + w[i] * g.mean, 0) / W, k = r.k;
    const num = r.groups.reduce((s, g, i) => s + w[i] * (g.mean - gm) ** 2, 0) / (k - 1);
    const lam = r.groups.reduce((s, g, i) => s + (1 - w[i] / W) ** 2 / (g.n - 1), 0);
    const F = num / (1 + (2 * (k - 2) * lam) / (k * k - 1)), df2 = (k * k - 1) / (3 * lam);
    return { F, df1: k - 1, df2, p: 1 - SW.pf(F, k - 1, df2) };
  }

  // ================= Regression =================
  function corrUI() {
    needData();
    dialog("Regression: Correlation Matrix", [{ name: "vars", label: "Variables (two or more)", type: "multi", options: numCols() }, { name: "pear", label: "Pearson", type: "check", value: true, group: "Correlation Coefficients" }, { name: "spear", label: "Spearman", type: "check", value: false, group: "Correlation Coefficients" }, { name: "sig", label: "Report significance", type: "check", value: true, group: "Additional Options" }, { name: "plot", label: "Scatter plots (pairs)", type: "check", value: true, group: "Plot" }], (v) => {
      if (v.vars.length < 2) throw new Error("Pick at least two variables.");
      const rows = [];
      v.vars.forEach((a) => { const row = [a]; v.vars.forEach((b) => { if (a === b) { row.push("1"); return; } const r = SW.regress(col(a), col(b)); let s = v.pear ? fmt(r.r) + (v.sig ? ` (p = ${SW.fmtP(r.pr)})` : "") : ""; if (v.spear) { const sp = SW.spearman(col(a), col(b)); s += (s ? "; " : "") + `rho ${fmt(sp.rs)}` + (v.sig ? ` (p = ${SW.fmtP(sp.p)})` : ""); } row.push(s); }); rows.push(row); });
      const cd = card("Correlation Matrix", src(), table([""].concat(v.vars), rows, "Correlation Matrix" + (v.pear ? " (Pearson's r" + (v.spear ? ", Spearman's rho)" : ")") : " (Spearman's rho)")) + formula("Test of each r: H0 rho = 0, t = r sqrt(n minus 2) / sqrt(1 minus r^2), df = n minus 2") + say("r measures linear association, from minus 1 to 1, and is pulled by outliers. Look at the scatterplot before believing any r. Correlation is not causation."));
      if (v.plot) for (let i = 0; i < v.vars.length; i++) for (let j = i + 1; j < v.vars.length; j++) { const r = SW.regress(col(v.vars[i]), col(v.vars[j])); plotDiv(cd, [{ x: r.x, y: r.y, mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }], { title: `${v.vars[j]} against ${v.vars[i]}, r = ${fmt(r.r, 3)}`, xaxis: { title: v.vars[i] }, yaxis: { title: v.vars[j] } }, 280); }
    });
  }
  function linRegUI() {
    needData();
    dialog("Regression: Linear Regression", [selNum("y", "Dependent variable"), selNum("x", "Covariate (explanatory)"), { name: "ci", label: "Confidence interval for coefficients", type: "check", value: true, group: "Model Coefficients" }, { name: "r2", label: "R and R squared (Model Fit)", type: "check", value: true, group: "Model Fit" }, { name: "resid", label: "Residual plots", type: "check", value: true, group: "Assumption Checks" }, { name: "qq", label: "Q-Q plot of residuals", type: "check", value: false, group: "Assumption Checks" }, { name: "pred", label: "Predict at x = (optional)", type: "number", value: "" }, confField, alphaField], (v) => {
      const r = SW.regress(col(v.x), col(v.y), +v.conf);
      let html = "";
      if (v.r2) html += table(["Model", "R", "R squared"], [["1", Math.abs(r.r), r.r2]], "Model Fit Measures");
      const hdr = ["Predictor", "Estimate", "SE", "t", "p"]; if (v.ci) hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper");
      const b0row = ["Intercept", r.b0, r.seb0, r.b0 / r.seb0, SW.fmtP(2 * (1 - SW.pt(Math.abs(r.b0 / r.seb0), r.df)))], b1row = [v.x, r.b1, r.seb1, r.t, SW.fmtP(r.p)];
      if (v.ci) { b0row.push(r.b0 - r.tstar * r.seb0, r.b0 + r.tstar * r.seb0); b1row.push(r.b1lower, r.b1upper); }
      html += table(hdr, [b0row, b1row], `Model Coefficients - ${v.y}`);
      html += formula(`${v.y} hat = ${fmt(r.b0)} + ${fmt(r.b1)} ${v.x}. b1 = r s_y / s_x, b0 = y bar minus b1 x bar. Slope test: H0 beta1 = 0, t = b1 / SE, df = n minus 2 = ${r.df}.`);
      html += say(`Slope: each one-unit increase in ${v.x} predicts a change of ${fmt(r.b1)} in ${v.y}. ${fmt(100 * r.r2, 1)} percent of the variation in ${v.y} is explained by the line. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence of a linear relationship between ${v.x} and ${v.y}.` : `There is not enough evidence of a linear relationship between ${v.x} and ${v.y}.`} Correlation is not causation.`);
      if (Number.isFinite(v.pred)) { const inR = v.pred >= Math.min(...r.x) && v.pred <= Math.max(...r.x); html += (inR ? say : warn)(`Predicted ${v.y} at ${v.x} = ${v.pred}: ${fmt(r.predict(v.pred))}.${inR ? "" : " That x is outside the data range: extrapolation, do not trust it."}`); }
      const cd = card("Linear Regression", src(`${v.y} on ${v.x}`), html);
      const xs = [Math.min(...r.x), Math.max(...r.x)];
      plotDiv(cd, [{ x: r.x, y: r.y, mode: "markers", type: "scatter", name: "data", marker: { color: "#3A7CA5" } }, { x: xs, y: xs.map(r.predict), mode: "lines", name: "least squares", line: { color: "#C0392B" } }], { xaxis: { title: v.x }, yaxis: { title: v.y } });
      if (v.resid) plotDiv(cd, [{ x: r.fitted, y: r.resid, mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }], { title: "Residuals against fitted values (want a formless band around 0)", xaxis: { title: "fitted" }, yaxis: { title: "residual" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0, y1: 0, line: { color: "#1A3A4D", dash: "dash" } }] }, 280);
      if (v.qq) { const q = SW.qq(r.resid), sd = SW.sd(r.resid); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }, { x: [-2.5, 2.5], y: [-2.5 * sd, 2.5 * sd], mode: "lines", line: { color: "#C0392B" } }], { title: "Q-Q plot of residuals", xaxis: { title: "theoretical quantiles" }, yaxis: { title: "residual" } }, 280); }
    });
  }

  // ================= Frequencies =================
  function binomialTest() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: 2 Outcomes, Binomial test", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      hasData ? selCat("x", "Variable") : null, hasData ? { name: "succ", label: "Level to test (leave blank for every level)", type: "text" } : null,
      { name: "xs", label: "Count of successes", type: "number", group: "Counts" }, { name: "n", label: "N", type: "number", group: "Counts" },
      { name: "p0", label: "Test value", type: "number", value: 0.5 }, hypField("Proportion"), { name: "ci", label: "Confidence intervals", type: "check", value: true }, { name: "z", label: "Also show the z test (the course's by-hand method)", type: "check", value: true }, confField, alphaField], (v) => {
      let levels = [], from = "counts";
      if (v.mode === "data") { const vals = col(v.x).filter((q) => q !== ""); const c = SW.counts(vals); const keys = v.succ.trim() ? [v.succ.trim()] : Object.keys(c).sort(); if (v.succ.trim() && !c[v.succ.trim()]) throw new Error(`No rows have ${v.x} = ${v.succ}. Check spelling and case.`); levels = keys.map((k) => ({ level: k, x: c[k] || 0, n: vals.length })); from = src(v.x); }
      else levels = [{ level: "success", x: v.xs, n: v.n }];
      const rows = [], zrows = []; let last;
      levels.forEach((L, i) => { const r = SW.oneProp({ x: L.x, n: L.n, p0: v.p0, alt: v.alt, conf: +v.conf }); last = r; const row = [i ? "" : v.mode === "data" ? v.x : "", L.level, L.x, L.n, r.phat, SW.fmtP(r.exact)]; if (v.ci) row.push(r.lower, r.upper); rows.push(row); zrows.push([L.level, r.se0, r.z, SW.fmtP(r.p), r.condTest ? "yes" : "no", r.condCI ? "yes" : "no"]); });
      const hdr = ["", "Level", "Count", "Total", "Proportion", "p"]; if (v.ci) hdr.push(`${Math.round(+v.conf * 100)}% CI lower`, "upper");
      let html = table(hdr, rows, "Binomial Test") + `<div class="note">Note. H<sub>a</sub> is proportion ${altWord(v.alt)} ${v.p0}. p is the exact binomial p-value.</div>`;
      if (v.z) html += table(["Level", "SE0 = sqrt(p0(1 minus p0)/n)", "z", "p (z test)", "n p0 and n(1 minus p0) at least 10", "successes and failures at least 10"], zrows, "z test for a proportion (by hand method)") + formula("z = (p hat minus p0) / sqrt(p0 (1 minus p0) / n); interval p hat plus or minus z* sqrt(p hat (1 minus p hat) / n)");
      const r = last, L = levels[levels.length - 1];
      html += say(`H0: p = ${v.p0}. ${decision(v.z ? r.p : r.exact, +v.alpha)} ${(v.z ? r.p : r.exact) <= +v.alpha ? `There is evidence that the population proportion of ${L.level} is ${altWord(v.alt)} ${v.p0}.` : `There is not enough evidence that the population proportion of ${L.level} is ${altWord(v.alt)} ${v.p0}.`}${v.ci ? ` We are ${Math.round(+v.conf * 100)} percent confident the population proportion is between ${fmt(r.lower)} and ${fmt(r.upper)}.` : ""}`);
      html += cond(r.condCI, `Success-failure check: ${L.x} successes and ${L.n - L.x} failures, both at least 10.`, `Success-failure check fails (${L.x} and ${L.n - L.x}): this course does not build a z interval here. Report the proportion descriptively.`);
      const cd = card("Binomial Test (2 Outcomes)", from, html); zPlot(cd, r.z, v.alt);
    });
  }
  function gofUI() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: N Outcomes, Chi-square Goodness of fit", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      hasData ? selCat("x", "Variable") : null,
      { name: "counts", label: "Counts, one per line as  level: count", type: "textarea", rows: 5, placeholder: "Freshman: 11\nSophomore: 15\nJunior: 9\nSenior: 5", group: "Counts (for the counts option)" },
      { name: "props", label: "Expected proportions, comma separated in the level order shown (blank = equal)", type: "text", placeholder: "0.30, 0.25, 0.15, 0.30", hint: "Levels are sorted alphabetically, the order the frequency table shows them." },
      { name: "exp", label: "Expected counts", type: "check", value: true }, alphaField], (v) => {
      let obs = {}, from = "counts";
      if (v.mode === "data") { const c = SW.counts(col(v.x)); Object.keys(c).sort().forEach((k) => (obs[k] = c[k])); from = src(v.x); }
      else v.counts.split("\n").map((l) => l.split(":")).filter((p) => p.length === 2).forEach(([k, n]) => (obs[k.trim()] = Number(n)));
      const keys = Object.keys(obs); if (keys.length < 2) throw new Error("Need at least two levels.");
      let props = null, propNote = ""; if (v.props.trim()) { const ps = v.props.split(/[,\s]+/).filter(Boolean).map(Number); if (ps.length !== keys.length) throw new Error(`Levels in order: ${keys.join(", ")}. You gave ${ps.length} proportions for ${keys.length} levels.`); const tot = ps.reduce((s, q) => s + q, 0); if (Math.abs(tot - 1) > 0.02) propNote = tot > 1.5 ? say(`You typed values that add to ${fmt(tot, 2)}, so they were read as expected counts (or percents) and rescaled to proportions: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}. Other software would rescale silently; this card says so.`) : warn(`Your proportions add to ${fmt(tot, 3)}, not 1. They were rescaled to add to 1: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}.`); props = Object.fromEntries(keys.map((k, i) => [k, ps[i]])); }
      const r = SW.gof(obs, props);
      let html = propNote + table(["Level", "Count", "Expected", "Proportion", "(O minus E)^2 / E"], r.rows.map((q) => [q.cat, q.o, v.exp ? q.e : "", q.o / r.n, q.contrib]), "Proportions") + table(["chi-square", "df", "p"], [[r.chi, r.df, SW.fmtP(r.p)]], "Chi-square Goodness of Fit");
      html += formula(`chi-square = sum of (O minus E)^2 / E, E = n times expected proportion, df = levels minus 1`);
      html += cond(r.minE >= 5, "Every expected count is at least 5.", `Smallest expected count is ${fmt(r.minE, 2)}, below 5: the test is not trustworthy.`);
      html += say(`H0: the population follows the stated proportions${props ? "" : " (all equal)"}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the distribution differs from the stated one.` : `There is not enough evidence that the distribution departs from the stated one; that is not proof that it matches.`}`);
      const cd = card("Chi-square Goodness of Fit (N Outcomes)", from, html);
      plotDiv(cd, [{ x: keys, y: r.rows.map((q) => q.o), type: "bar", name: "Observed", marker: { color: "#3A7CA5" } }, { x: keys, y: r.rows.map((q) => q.e), type: "bar", name: "Expected", marker: { color: "#D97D54" } }], { barmode: "group", yaxis: { title: "Count" } });
    });
  }
  function contTables() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: Contingency Tables, Independent Samples (chi-square test of association)", [
      hasData ? sel("mode", "Data", [["data", "from two columns"], ["summary", "from a table of counts"]], "data") : sel("mode", "Data", [["summary", "from a table of counts"]]),
      hasData ? selCat("r", "Rows") : null, hasData ? selCat("c", "Columns") : null,
      { name: "tbl", label: "Table of counts: first row = column names, first column = row names", type: "textarea", rows: 5, placeholder: "employment, Pet No, Pet Yes\nFull-time, 4, 6\nNot employed, 3, 6\nPart-time, 10, 11", group: "Counts (for the table option)" },
      { name: "chi", label: "chi-square", type: "check", value: true, group: "Tests" }, { name: "fisher", label: "Fisher's exact test (2 by 2)", type: "check", value: false, group: "Tests" }, { name: "orrr", label: "Odds ratio and relative risk (2 by 2)", type: "check", value: false, group: "Comparative Measures" }, { name: "obs", label: "Observed counts", type: "check", value: true, group: "Cells" }, { name: "exp", label: "Expected counts", type: "check", value: false, group: "Cells" },
      { name: "pcRow", label: "Row percentages", type: "check", value: false, group: "Percentages" }, { name: "pcCol", label: "Column percentages", type: "check", value: false, group: "Percentages" }, { name: "pcTot", label: "Total percentages", type: "check", value: false, group: "Percentages" }, alphaField], (v) => {
      let t, from = "counts", rn = "rows", cn = "columns";
      if (v.mode === "data") { t = SW.twoWay(col(v.r), col(v.c)); rn = v.r; cn = v.c; from = src(`${v.r} by ${v.c}`); }
      else { const rows = parseCSV(v.tbl); if (rows.length < 3) throw new Error("Need a header row and at least two rows of counts."); cn = rows[0][0] || "columns"; const rv = [], cv = []; rows.slice(1).forEach((r) => rows[0].slice(1).forEach((c, j) => { const n = Number(r[j + 1]); for (let k = 0; k < n; k++) { rv.push(r[0]); cv.push(c); } })); t = SW.twoWay(rv, cv); }
      const cell = (i, j) => { const o = t.O[i][j]; const parts = []; if (v.obs) parts.push(String(o)); if (v.exp) parts.push(`E ${fmt(t.E[i][j], 2)}`); if (v.pcRow) parts.push(`${fmt((100 * o) / t.rt[i], 1)}% row`); if (v.pcCol) parts.push(`${fmt((100 * o) / t.ct[j], 1)}% col`); if (v.pcTot) parts.push(`${fmt((100 * o) / t.n, 1)}% total`); return parts.join(" | "); };
      const rows = t.rows.map((r, i) => [r].concat(t.cols.map((_, j) => cell(i, j)), [t.rt[i]])); rows.push(["Total"].concat(t.ct, [t.n]));
      let html = table([rn + " \\ " + cn].concat(t.cols, ["Total"]), rows, "Contingency Tables");
      if (v.mode === "data") { const dropped = col(v.r).length - t.n; if (dropped > 0) html += warn(`${dropped} row${dropped > 1 ? "s" : ""} with a blank in ${rn} or ${cn} were left out of the whole table, so N = ${t.n}. Every percentage here is on that base.`); }
      html += say("A row percentage is a conditional probability given the row; a total percentage is the 'and' probability. Under independence every row shows the same percentages.");
      if (v.chi) {
        html += table(["", "Value", "df", "p"], [["chi-square", t.chi, t.df, SW.fmtP(t.p)], ["N", t.n, "", ""]], "chi-square Tests");
        html += formula(`chi-square = sum of (O minus E)^2 / E, E = row total times column total / N, df = (rows minus 1)(columns minus 1) = ${t.df}`);
        html += cond(t.minE >= 5, "Every expected count is at least 5.", `Smallest expected count is ${fmt(t.minE, 2)}, below 5: the test is not trustworthy. Combine categories or collect more data.`);
        html += say(`H0: ${rn} and ${cn} are independent. ${decision(t.p, +v.alpha)} ${t.p <= +v.alpha ? `There is evidence of an association between ${rn} and ${cn}.` : `There is not enough evidence of an association between ${rn} and ${cn}.`}`);
      }
      if (t.rows.length === 2 && t.cols.length === 2 && (v.fisher || v.orrr)) {
        const [a, b] = t.O[0], [c, dd] = t.O[1];
        if (v.fisher) { const pf = SW.fisher2x2(a, b, c, dd); html += table(["", "Value", "p"], [["Fisher's exact test", "", SW.fmtP(pf)]], "Fisher's exact test (2 by 2)") + say(`Exact p-value for the 2 by 2 table, no expected-count condition needed. ${decision(pf, +v.alpha)}`); }
        if (v.orrr) { const m = SW.measures2x2(a, b, c, dd); html += table(["", "Value", "95% CI lower", "upper"], [[`Risk of ${t.cols[0]} in ${t.rows[0]}`, m.p1, "", ""], [`Risk of ${t.cols[0]} in ${t.rows[1]}`, m.p2, "", ""], ["Relative risk (row 1 over row 2)", m.rr, m.rrLower, m.rrUpper], ["Odds ratio", m.or, m.orLower, m.orUpper]], "Comparative Measures") + formula("RR = p1 / p2. Odds = p / (1 minus p); OR = (a d) / (b c). Intervals on the log scale. RR needs the rows to be groups whose risks were measured (cohort); OR is valid in case-control designs too.") + say(m.or > 1 ? `The odds of ${t.cols[0]} are ${fmt(m.or, 2)} times higher in ${t.rows[0]} than in ${t.rows[1]}; a confidence interval that includes 1 means no clear association.` : `The odds of ${t.cols[0]} are ${fmt(1 / m.or, 2)} times lower in ${t.rows[0]} than in ${t.rows[1]}; a confidence interval that includes 1 means no clear association.`); }
      }
      card("Contingency Tables (Independent Samples)", from, html);
    });
  }
  function twoPropsUI() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: Two proportions, z test (course method)", [
      hasData ? sel("mode", "Data", [["data", "outcome column split by a group"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      hasData ? selCat("x", "Outcome variable") : null, hasData ? { name: "succ", label: "Success level (exactly as in the data)", type: "text" } : null, hasData ? selCat("g", "Grouping variable (two levels)") : null, hasData ? lvField : null,
      { name: "x1", label: "Successes 1", type: "number", group: "Group 1" }, { name: "n1", label: "N 1", type: "number", group: "Group 1" }, { name: "x2", label: "Successes 2", type: "number", group: "Group 2" }, { name: "n2", label: "N 2", type: "number", group: "Group 2" },
      sel("alt", "Hypothesis", [["two", "p1 not equal to p2"], ["greater", "p1 greater than p2"], ["less", "p1 less than p2"]], "two"), confField, alphaField], (v) => {
      let x1 = v.x1, n1 = v.n1, x2 = v.x2, n2 = v.n2, names = ["Group 1", "Group 2"], from = "counts";
      if (v.mode === "data") { const lv = pickTwo(v.g, v.lv); names = lv; const gv = col(v.g), xv = col(v.x); const inG = (l) => xv.filter((_, i) => gv[i] === l && xv[i] !== ""); n1 = inG(lv[0]).length; x1 = inG(lv[0]).filter((q) => q === v.succ).length; n2 = inG(lv[1]).length; x2 = inG(lv[1]).filter((q) => q === v.succ).length; from = src(`${v.x} = ${v.succ} by ${v.g}`); }
      const r = SW.twoProps({ x1, n1, x2, n2, alt: v.alt, conf: +v.conf });
      let html = table(["Group", "Successes", "N", "Proportion"], [[names[0], x1, n1, r.p1], [names[1], x2, n2, r.p2]], "Proportions");
      html += table(["Difference", "Pooled p hat", "SE0 (pooled)", "z", "p", "SE (unpooled)", `${Math.round(r.conf * 100)}% CI lower`, "upper"], [[r.diff, r.pooled, r.se0, r.z, SW.fmtP(r.p), r.se, r.lower, r.upper]], "Two proportions z test");
      html += formula("z = (p1 hat minus p2 hat) / sqrt(pooled p (1 minus pooled p)(1/n1 + 1/n2)); interval uses the unpooled SE. The same test as Contingency Tables on a 2 by 2 table, where chi-square = z squared.");
      html += cond(r.cond, `Success-failure check: ${x1}/${n1 - x1} and ${x2}/${n2 - x2}, all at least 10.`, `A count is below 10 (${x1}/${n1 - x1} and ${x2}/${n2 - x2}): this course does not run the z procedure here. Report the two proportions and say the sample is too small.`);
      html += say(`H0: p1 = p2. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the proportion in ${names[0]} is ${altWord(v.alt)} the proportion in ${names[1]}.` : `There is not enough evidence of a difference between the two population proportions.`} We are ${Math.round(r.conf * 100)} percent confident the difference is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      const cd = card("Two proportions (z)", from, html); zPlot(cd, r.z, v.alt);
    });
  }


  // ================= Nonparametric =================
  function mannWhitneyUI() {
    needData();
    dialog("Nonparametric: Mann-Whitney U (two independent groups)", [selNum("x", "Dependent variable"), selCat("g", "Grouping variable (two levels)"), lvField, sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"), alphaField], (v) => {
      const lv = pickTwo(v.g, v.lv);
      const a = col(v.x).filter((_, i) => col(v.g)[i] === lv[0]), b = col(v.x).filter((_, i) => col(v.g)[i] === lv[1]); const r = SW.mannWhitney(a, b, v.alt);
      const html = table(["", "", "Statistic", "z", "p"], [[v.x, "Mann-Whitney U", r.U, r.z, SW.fmtP(r.p)]], "Independent Samples T-Test (nonparametric)") + table(["Group", "N", "Median"], [[lv[0], r.n1, r.med1], [lv[1], r.n2, r.med2]], "Group Descriptives") + formula("Ranks all values together and compares the rank sums; no normality assumption. Normal approximation with tie correction, as in R.") + say(`H0: the two distributions are the same. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that ${v.x} tends to be ${altWord(v.alt) === "not equal to" ? "different" : altWord(v.alt)} in ${lv[0]} compared with ${lv[1]}.` : `There is not enough evidence of a difference in ${v.x} between ${lv[0]} and ${lv[1]}.`} Use this when the groups are small and clearly skewed, or when the data are ranks.`);
      const cd = card("Mann-Whitney U", src(`${v.x} by ${v.g}`), html); plotDiv(cd, [{ y: SW.num(a), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(lv[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(b), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(lv[1]), marker: { color: "#D97D54" } }], { yaxis: { title: v.x }, showlegend: false }, 260);
    });
  }
  function wilcoxonUI() {
    needData();
    dialog("Nonparametric: Wilcoxon signed-rank and sign test (paired)", [selNum("a", "Paired variable 1"), selNum("b", "Paired variable 2 (or leave the constant below)"), { name: "const", label: "Or compare variable 1 with a constant (one-sample use)", type: "number", value: "" }, sel("alt", "Hypothesis", [["two", "Measure 1 not equal to Measure 2"], ["greater", "Measure 1 greater than Measure 2"], ["less", "Measure 1 less than Measure 2"]], "two"), alphaField], (v) => {
      const a = col(v.a), b = Number.isFinite(v.const) ? a.map(() => v.const) : col(v.b), lab = Number.isFinite(v.const) ? `${v.a} minus ${v.const}` : `${v.a} minus ${v.b}`;
      const w = SW.wilcoxonSigned(a, b, v.alt), s = SW.signTest(a, b, v.alt);
      const html = table(["", "", "Statistic", "z", "p"], [[lab, "Wilcoxon W", w.Wplus, w.z, SW.fmtP(w.p)], [lab, "Sign test (exact binomial)", `${s.pos} positive, ${s.neg} negative`, "", SW.fmtP(s.p)]], "Paired Samples T-Test (nonparametric)") + formula("Wilcoxon: rank the absolute differences, sum the ranks of the positive ones; zeros dropped. Sign test: count positive against negative differences, binomial with p = 0.5.") + say(`H0: the differences are centred at 0 (median difference ${fmt(w.medianDiff)}). Wilcoxon: ${decision(w.p, +v.alpha)} Sign test: ${decision(s.p, +v.alpha)} The sign test uses only directions, so it is the weaker of the two but needs the fewest assumptions.`);
      const cd = card("Wilcoxon signed-rank and sign test", src(lab), html);
      const diffs = []; for (let i = 0; i < a.length; i++) { const x = Number(a[i]), y = Number(b[i]); if (a[i] !== "" && b[i] !== "" && Number.isFinite(x) && Number.isFinite(y)) diffs.push(x - y); }
      plotDiv(cd, [{ x: diffs, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 1 } } }], { xaxis: { title: "difference" }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: 0, x1: 0, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }] }, 240);
    });
  }
  function kruskalUI() {
    needData();
    dialog("Nonparametric: Kruskal-Wallis (three or more groups)", [selNum("x", "Dependent variable"), selCat("g", "Grouping variable"), alphaField], (v) => {
      const groups = {}; col(v.g).forEach((g, i) => { if (g !== "") (groups[g] = groups[g] || []).push(col(v.x)[i]); }); const r = SW.kruskal(groups);
      card("Kruskal-Wallis", src(`${v.x} by ${v.g}`), table(["", "chi-square (H)", "df", "p"], [[v.x, r.H, r.df, SW.fmtP(r.p)]], "One-Way ANOVA (Non-parametric)") + table(["Group", "N", "Median"], r.groups.map((q) => [q.name, q.n, q.median]), "Group Descriptives") + formula("Rank-based version of one-way ANOVA; H is compared with chi-square on k minus 1 df.") + say(`H0: all groups have the same distribution. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? "At least one group tends to differ." : "There is not enough evidence that the groups differ."} Use when spreads differ badly or the data are skewed with small groups.`));
    });
  }


  // ================= Advanced =================
  function designMatrix(numVars, catVars) {
    const names = [], parts = [], notes = [];
    numVars.forEach((v) => { names.push(v); parts.push(col(v).map((x) => [x])); });
    catVars.forEach((v) => {
      const raw = col(v), c = SW.counts(raw), rare = Object.keys(c).filter((l) => c[l] < 3);
      const vals = raw.map((x) => (rare.includes(x) ? "" : x));
      if (rare.length) notes.push(`${v}: level${rare.length > 1 ? "s" : ""} ${rare.join(", ")} (fewer than 3 rows) set to missing; a category that small cannot be estimated.`);
      const d = SW.dummies(vals); d.cols.forEach((l) => names.push(`${v} = ${l} (vs ${d.levels[0]})`));
      parts.push(d.rows.map((r, i) => (vals[i] === "" ? r.map(() => "") : r)));
    });
    const rows = D.rows.length ? activeIdx().map((_, i) => parts.flatMap((p) => p[i])) : [];
    return { names, rows, notes };
  }
  const dmNotes = (dm) => (dm.notes || []).map((n) => warn(n)).join("");
  function pruneEmpty(X, names, keep) { // dummy columns with fewer than 3 rows in the kept data: drop the column and those rows
    const sums = names.map((_, j) => X.reduce((s, r) => s + (Number(r[j]) === 1 && names[j].includes(" = ") ? 1 : 0), 0));
    const dropCol = names.map((nm, j) => nm.includes(" = ") && sums[j] < 3);
    const rowOK = X.map((r) => !r.some((v, j) => dropCol[j] && Number(v) === 1));
    return { X: X.filter((_, i) => rowOK[i]).map((r) => r.filter((_, j) => !dropCol[j])), names: names.filter((_, j) => !dropCol[j]), keep: keep.filter((_, i) => rowOK[i]), dropped: names.filter((_, j) => dropCol[j]) };
  }
  function keepComplete(X, y, extra = []) { const keep = []; for (let i = 0; i < y.length; i++) { const ok = y[i] !== "" && Number.isFinite(Number(y[i])) && X[i].every((v) => v !== "" && Number.isFinite(Number(v))) && extra.every((e) => e[i] !== ""); if (ok) keep.push(i); } return keep; }
  function multRegUI() {
    needData(); let html0 = "";
    dialog("Advanced: Multiple Linear Regression", [selNum("y", "Dependent variable"), { name: "xs", label: "Numeric predictors (Cmd or Ctrl for several)", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors (dummy coded, first level is the reference)", type: "multi", options: catCols() },
      { name: "sq", label: "Add squared terms for (numeric, optional)", type: "multi", options: numCols(), group: "Model terms" }, { name: "ix", label: "Interaction between two numeric predictors, e.g. Hours_Study * Hours_Sleep (optional)", type: "text", group: "Model terms" },
      { name: "resid", label: "Residual plot", type: "check", value: true, group: "Checks" }, { name: "vif", label: "VIF (collinearity)", type: "check", value: true, group: "Checks" }, { name: "diag", label: "Influence diagnostics (leverage, standardized residuals, Cook's distance)", type: "check", value: true, group: "Checks" }, { name: "qq", label: "Q-Q plot of residuals", type: "check", value: false, group: "Checks" },
      { name: "red", label: "Compare with a reduced model using only these numeric predictors (nested F test)", type: "multi", options: numCols(), group: "Model comparison" }, { name: "step", label: "Show backward elimination steps (teaching demo)", type: "check", value: false, group: "Model comparison" },
      confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const dm = designMatrix(v.xs, v.cs), yv = col(v.y);
      (v.sq || []).forEach((s) => { const c = col(s); dm.names.push(`${s} squared`); dm.rows.forEach((r, i) => r.push(c[i] === "" ? "" : Number(c[i]) ** 2)); });
      if (v.ix && v.ix.trim()) { const [a, b] = v.ix.split("*").map((s) => s.trim()); if (!numCols().includes(a) || !numCols().includes(b)) throw new Error("Interaction must be two numeric column names joined by *."); const ca = col(a), cb = col(b); dm.names.push(`${a} x ${b}`); dm.rows.forEach((r, i) => r.push(ca[i] === "" || cb[i] === "" ? "" : Number(ca[i]) * Number(cb[i]))); if (!v.xs.includes(a) || !v.xs.includes(b)) html0 = warn("An interaction is usually entered with both main effects also in the model."); }
      let keep = keepComplete(dm.rows, yv);
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => Number(yv[i])); dm.names = pr.names; html0 += dmNotes(dm); if (pr.dropped.length) html0 += warn(`Dropped ${pr.dropped.join(", ")} and its rows: fewer than 3 usable rows in that category, which cannot be estimated.`);
      if (X.length <= dm.names.length + 1) throw new Error("Not enough complete rows for this many predictors.");
      const m = SW.ols(X, y, dm.names, +v.conf);
      let html = table(["Model", "R", "R squared", "Adjusted R squared", "F", "df1", "df2", "p"], [["1", Math.sqrt(m.r2), m.r2, m.adj, m.F, m.dfF[0], m.dfF[1], SW.fmtP(m.pF)]], "Model Fit Measures");
      const hdr = ["Predictor", "Estimate", "SE", "t", "p", `${Math.round(m.conf * 100)}% CI lower`, "upper"]; if (v.vif) hdr.push("VIF");
      html += table(hdr, m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.t[i], SW.fmtP(m.p[i]), m.lower[i], m.upper[i]].concat(v.vif ? [i ? m.vif[i - 1] : ""] : [])), `Model Coefficients - ${v.y}`);
      html += formula(`${v.y} hat = ${m.b.map((b, i) => (i ? `${b >= 0 ? "+ " : "- "}${fmt(Math.abs(b))} (${m.names[i]})` : fmt(b))).join(" ")}. Each slope is the change in ${v.y} per unit of that predictor holding the others fixed. df = n minus (predictors + 1) = ${m.df}; n = ${m.n} complete rows${m.n < yv.length ? ` (${yv.length - m.n} dropped for blanks)` : ""}.`);
      html += say(`Overall: ${decision(m.pF, +v.alpha)} ${m.pF <= +v.alpha ? "At least one predictor is linearly related to " + v.y + "." : "No evidence that the predictors together explain " + v.y + "."} Adjusted R squared ${fmt(m.adj)} is the share of variation explained after charging for the number of predictors; compare models on that, not on R squared.`);
      if (v.vif && m.vif.some((q) => q > 5)) html += warn("A VIF above 5 means that predictor is largely explained by the others; its slope and SE are unstable. Consider dropping one of the overlapping predictors."); else if (v.vif) html += ok("All VIF below 5: predictors are not badly collinear.");
      html += cond(m.n >= 10 * (m.names.length - 1) + 10, `n = ${m.n} for ${m.names.length - 1} predictors: at least 10 rows per predictor.`, `n = ${m.n} for ${m.names.length - 1} predictors: fewer than 10 rows per predictor, so the model is fragile.`);
      html += table(["AIC", "BIC", "Residual SE"], [[m.aic, m.bic, m.se_res]], "Information criteria (lower is better when comparing models on the same rows)");
      if (v.diag) {
        const p = m.k, cut = 2 * p / m.n, flagged = m.cook.map((c, i) => ({ i, c, h: m.hat[i], r: m.rstd[i] })).filter((q) => q.c > 4 / m.n || q.h > cut || Math.abs(q.r) > 2).sort((a, b) => b.c - a.c).slice(0, 12);
        html += table(["Row", "Standardized residual", "Leverage", "Cook's distance", "Why flagged"], flagged.map((q) => [String(keep[q.i] + 1), q.r, q.h, q.c, [Math.abs(q.r) > 2 ? "|resid| > 2" : "", q.h > cut ? "leverage > 2p/n" : "", q.c > 4 / m.n ? "Cook > 4/n" : ""].filter(Boolean).join(", ")]), `Influence diagnostics (${flagged.length} rows flagged; cutoffs: |std resid| 2, leverage ${fmt(cut, 3)}, Cook ${fmt(4 / m.n, 3)})`);
        html += say("A high leverage row has unusual predictor values; a large standardized residual is poorly fit; Cook's distance combines both and says how much the coefficients move if that row is dropped. Flagged means look, not delete. Refit without the row and report whether the conclusion changes.");
      }
      if (v.red && v.red.length) {
        const dmr = designMatrix(v.red, []), Xr = keep.map((i) => dmr.rows[i].map(Number));
        if (Xr[0].length >= X[0].length) html += warn("The reduced model must have fewer predictors than the full model."); else { const mr = SW.ols(Xr, y, dmr.names, +v.conf), nf = SW.nestedF(mr, m); html += table(["Reduced model", "Full model", "F", "df1", "df2", "p", "Reduced AIC", "Full AIC"], [[v.red.join(" + "), dm.names.join(" + "), nf.F, nf.df1, nf.df2, SW.fmtP(nf.p), mr.aic, m.aic]], "Nested model comparison") + formula("F = ((SS_res reduced minus SS_res full) / extra predictors) / (SS_res full / df full). H0: the extra predictors add nothing.") + say(`${decision(nf.p, +v.alpha)} ${nf.p <= +v.alpha ? "The extra predictors improve the model." : "The extra predictors do not improve the model; prefer the simpler one."}`); }
      }
      if (v.step) { const steps = SW.backward(X, y, dm.names, +v.alpha); html += table(["Step", "Predictors in model", "Adjusted R squared", "AIC", "Largest p", "Dropped next"], steps.map((s, i) => [String(i + 1), s.predictors.join(", "), s.adj, s.aic, `${s.worst} (${SW.fmtP(s.worstP)})`, i < steps.length - 1 ? s.worst : "stop"]), "Backward elimination by p-value") + warn("Teaching demo only. Stepwise selection inflates every remaining p-value and can drop a variable your question needs. Choose predictors from the research question, then report the model you chose and why."); }
      const cd = card("Multiple Linear Regression", src(v.y + " on " + dm.names.length + " predictors"), html0 + html);
      if (v.qq) { const q = SW.qq(m.resid), sd = SW.sd(m.resid); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }, { x: [-2.5, 2.5], y: [-2.5 * sd, 2.5 * sd], mode: "lines", line: { color: "#C0392B" } }], { title: "Q-Q plot of residuals", xaxis: { title: "theoretical quantiles" }, yaxis: { title: "residual" }, showlegend: false }, 260); }
      if (v.diag) plotDiv(cd, [{ x: m.hat, y: m.rstd, mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: m.cook.map((c) => 6 + 40 * Math.min(c, 1)) }, text: keep.map((i) => "row " + (i + 1)) }], { title: "Standardized residual against leverage (bubble size = Cook's distance)", xaxis: { title: "leverage" }, yaxis: { title: "standardized residual" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 2, y1: 2, line: { dash: "dot", color: "#B5476B" } }, { type: "line", x0: 0, x1: 1, xref: "paper", y0: -2, y1: -2, line: { dash: "dot", color: "#B5476B" } }] }, 280);
      if (v.resid) plotDiv(cd, [{ x: m.fitted, y: m.resid, mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }], { title: "Residuals against fitted values (want a formless band around 0)", xaxis: { title: "fitted" }, yaxis: { title: "residual" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0, y1: 0, line: { color: "#1A3A4D", dash: "dash" } }] }, 280);
    });
  }
  function logitUI() {
    needData();
    dialog("Advanced: Logistic Regression (binary outcome)", [selCat("y", "Outcome variable (two levels)"), { name: "succ", label: "Level to model as 1 (exactly as in the data)", type: "text" }, { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const yv = col(v.y), lv = [...new Set(yv.filter((q) => q !== ""))]; if (!lv.includes(v.succ.trim())) throw new Error(`Levels of ${v.y}: ${lv.join(", ")}. Type one of them.`);
      const dm = designMatrix(v.xs, v.cs); let keep = keepComplete(dm.rows, yv.map((q) => (q === "" ? "" : "0")));
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => (yv[i] === v.succ.trim() ? 1 : 0)); dm.names = pr.names;
      const m = SW.logistic(X, y, dm.names, +v.conf);
      let html = dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${pr.dropped.join(", ")} and its rows: fewer than 3 usable rows in that category.`) : "") + table(["Model", "Deviance", "AIC", "McFadden R squared", "chi-square (vs intercept only)", "df", "p", "Correctly classified"], [["1", -2 * m.ll, m.aic, m.mcfadden, m.chi, m.dfChi, SW.fmtP(m.pChi), fmt(100 * m.accuracy, 1) + " percent"]], "Model Fit Measures");
      html += table(["Predictor", "Estimate (log odds)", "SE", "z", "p", "Odds ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.z[i], SW.fmtP(m.p[i]), m.or[i], m.orLower[i], m.orUpper[i]]), `Model Coefficients - ${v.y} = ${v.succ}`);
      html += formula(`log(odds of ${v.succ}) = b0 + b1 x1 + ... Each odds ratio is exp(b): the factor by which the odds of ${v.succ} multiply per unit of that predictor, others fixed. An odds ratio interval that includes 1 means no clear effect. n = ${m.n}, ${y.reduce((s, q) => s + q, 0)} are ${v.succ}.`);
      html += say(`${decision(m.pChi, +v.alpha)} ${m.pChi <= +v.alpha ? "The predictors together improve on guessing the base rate." : "The predictors together do not improve on guessing the base rate."}`);
      const cd = card("Logistic Regression", src(`${v.y} = ${v.succ}`), html);
      plotDiv(cd, [{ x: m.fitted.filter((_, i) => y[i] === 0), type: "histogram", name: `actual ${lv.find((l) => l !== v.succ.trim()) || "other"}`, opacity: 0.6, marker: { color: "#3A7CA5" } }, { x: m.fitted.filter((_, i) => y[i] === 1), type: "histogram", name: `actual ${v.succ}`, opacity: 0.6, marker: { color: "#D97D54" } }], { barmode: "overlay", title: "Predicted probability by actual outcome (good separation = little overlap)", xaxis: { title: `predicted P(${v.succ})`, range: [0, 1] }, yaxis: { title: "Count" } }, 260);
    });
  }
  function anova2UI() {
    needData();
    dialog("Advanced: Two-Way ANOVA", [selNum("y", "Dependent variable"), selCat("a", "Factor A"), selCat("b", "Factor B"), { name: "inter", label: "Include the A x B interaction", type: "check", value: true }, alphaField], (v) => {
      const yv = col(v.y), A = col(v.a), B = col(v.b), keep = keepComplete(yv.map((q) => [q]), yv, [A, B]);
      const r = SW.anova2(keep.map((i) => Number(yv[i])), keep.map((i) => A[i]), keep.map((i) => B[i]), v.inter);
      let html = table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p"], r.rows.map((q) => [q.source === "A" ? v.a : q.source === "B" ? v.b : q.source === "A x B" ? `${v.a} x ${v.b}` : q.source, q.ss, q.df, q.ms, q.F == null ? "" : q.F, q.p == null ? "" : SW.fmtP(q.p)]), `ANOVA - ${v.y} (Type II sums of squares, as R's car::Anova)`);
      html += table([`${v.a} | ${v.b}`, "N", "Mean", "SD"], r.cells.map((c) => [c.cell, c.n, c.mean, c.sd]), "Cell Descriptives");
      const inter = r.rows.find((q) => q.source === "A x B");
      html += formula("Type II: each main effect is tested after the other main effect; the interaction is tested after both. Unbalanced cells are handled correctly.");
      html += say(inter && inter.p <= +v.alpha ? `Interaction ${pWord(inter.p)}: the effect of ${v.a} depends on the level of ${v.b}. Read the cell means, not the main effects.` : `${inter ? "No evidence of interaction (" + pWord(inter.p) + "), so the main effects can be read on their own. " : ""}${v.a}: ${decision(r.rows[0].p, +v.alpha)} ${v.b}: ${decision(r.rows[1].p, +v.alpha)}`);
      html += smallGroups(r.cells.map((c) => [c.n, c.cell]));
      const cd = card("Two-Way ANOVA", src(`${v.y} by ${v.a} and ${v.b}`), html);
      const la = r.levelsA, lb = r.levelsB;
      plotDiv(cd, lb.map((b) => ({ x: la, y: la.map((a) => { const c = r.cells.find((q) => q.cell === a + " | " + b); return c ? c.mean : null; }), mode: "lines+markers", name: `${v.b} = ${b}` })), { title: "Cell means (parallel lines = no interaction)", xaxis: { title: v.a }, yaxis: { title: `mean ${v.y}` } }, 280);
    });
  }


  function rmAnovaUI() {
    needData();
    dialog("Advanced: Repeated Measures ANOVA (wide data: one column per condition)", [{ name: "cols", label: "Repeated measures columns, in order (2 or more)", type: "multi", options: numCols() }, selAny("g", "Between-subjects factor (optional)"), { name: "post", label: "Pairwise paired t-tests with Holm correction", type: "check", value: true }, alphaField], (v) => {
      if (v.cols.length < 2) throw new Error("Pick at least two columns.");
      const cols = v.cols.map((c) => col(c)), gcol = v.g ? col(v.g) : null;
      const keep = cols[0].map((_, i) => i).filter((i) => cols.every((c) => c[i] !== "" && Number.isFinite(Number(c[i]))) && (!gcol || gcol[i] !== ""));
      const Y = keep.map((i) => cols.map((c) => Number(c[i]))), G = gcol ? keep.map((i) => gcol[i]) : null;
      const r = SW.rmAnova(Y, G);
      let html = table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p", "p (Greenhouse-Geisser)", "p (Huynh-Feldt)"], r.rows.map((q) => [q.source, q.ss, q.df, q.ms, q.F == null ? "" : q.F, q.p == null ? "" : SW.fmtP(q.p), q.pGG == null ? "" : SW.fmtP(q.pGG), q.pHF == null ? "" : SW.fmtP(q.pHF)]), G ? "Mixed ANOVA: within-subjects factor by between-subjects factor" : "Within-Subjects Effects");
      html += table(["Mauchly's W", "p", "Greenhouse-Geisser epsilon", "Huynh-Feldt epsilon"], [[r.W, r.k > 2 ? SW.fmtP(r.pW) : "n/a (2 levels)", r.gg, r.hf]], "Sphericity");
      html += cond(r.k <= 2 || r.pW > 0.05, r.k <= 2 ? "With two conditions sphericity is automatic." : "Mauchly's test does not reject: sphericity holds, read the uncorrected p.", `Mauchly's test rejects (p = ${SW.fmtP(r.pW)}): the differences between conditions do not all have the same variance. Report the Greenhouse-Geisser p (epsilon ${fmt(r.gg, 3)} scales the df down).`);
      html += table(["Condition", "Mean", "n"], v.cols.map((c, j) => [c, r.condMean[j], r.n]), "Condition means");
      if (G) html += table([v.g].concat(v.cols, ["n"]), r.groups.map((g, j) => [g].concat(r.cellMean[j], [r.ng[j]])), "Cell means");
      html += formula(`Each subject is measured under every condition, so subject-to-subject variation (SS subjects = ${fmt(r.ssSubj)}) is removed from the error before testing the condition effect. That is why repeated measures has far more power than treating the columns as independent groups.`);
      const condRow = r.rows.find((q) => q.source.startsWith("Condition")), pUse = r.k > 2 && r.pW <= 0.05 ? condRow.pGG : condRow.p;
      html += say(`Condition effect: ${decision(pUse, +v.alpha)} ${pUse <= +v.alpha ? "The mean differs across conditions." : "There is not enough evidence that the mean changes across conditions."}` + (G ? ` Group: ${decision(r.rows[0].p, +v.alpha)} Interaction: ${decision(r.rows[3].p, +v.alpha)}${r.rows[3].p <= +v.alpha ? " The change across conditions differs by group; read the cell means, not the main effects." : ""}` : ""));
      html += table(["Subject variance", "Residual variance", "ICC (share of variance between subjects)"], [[r.varSubject, r.varResid, r.icc]], "Random-intercept view (variance components, REML-equivalent for balanced data)") + say(`ICC ${fmt(r.icc, 3)}: ${fmt(100 * r.icc, 0)} percent of the variation is stable differences between subjects. That is the correlation between any two measurements on the same subject, and the reason pairing pays.`);
      if (v.post) html += table(["Comparison", "Mean difference", "t", "df", "p", "p (Holm)", `differs at ${v.alpha}?`], r.pairs.map((q) => [`${v.cols[q.a]} vs ${v.cols[q.b]}`, q.diff, q.t, q.df, SW.fmtP(q.p), SW.fmtP(q.pHolm), q.pHolm <= +v.alpha ? "yes" : "no"]), "Post hoc: paired comparisons (Holm adjusted)");
      const cd = card(G ? "Mixed ANOVA" : "Repeated Measures ANOVA", src(v.cols.join(", ") + (G ? " by " + v.g : "")), html);
      const traces = G ? r.groups.map((g, j) => ({ x: v.cols, y: r.cellMean[j], mode: "lines+markers", name: `${v.g} = ${g}` })) : [{ x: v.cols, y: r.condMean, mode: "lines+markers", name: "mean", line: { color: "#3A7CA5" } }];
      plotDiv(cd, traces, { title: "Mean by condition" + (G ? " (parallel lines = no interaction)" : ""), yaxis: { title: "mean" } }, 280);
      plotDiv(cd, keep.map((i, s) => ({ x: v.cols, y: Y[s], mode: "lines", line: { width: 1, color: G ? (r.groups.indexOf(G[s]) ? "#D97D54" : "#3A7CA5") : "#3A7CA5" }, opacity: 0.35, showlegend: false, hoverinfo: "y" })), { title: "Every subject's own line (spaghetti plot)", yaxis: { title: "value" } }, 280);
    });
  }


  function countRegUI() {
    needData();
    dialog("Advanced: Count Regression (Poisson and Negative Binomial)", [selNum("y", "Count outcome (non-negative whole numbers)"), { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, sel("fam", "Model", [["auto", "Poisson, then negative binomial if overdispersed (recommended)"], ["poisson", "Poisson only"], ["nb", "Negative binomial only"]], "auto"), confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const dm = designMatrix(v.xs, v.cs), yv = col(v.y); let keep = keepComplete(dm.rows, yv);
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => Number(yv[i])); dm.names = pr.names;
      if (y.some((q) => q < 0 || !Number.isInteger(q))) throw new Error("The outcome must be counts: 0, 1, 2, ...");
      const po = SW.poisson(X, y, dm.names, +v.conf); let html = dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${pr.dropped.join(", ")} and its rows: fewer than 3 usable rows in that category.`) : "");
      const coefTable = (m, label) => table(["Predictor", "Estimate (log rate)", "SE", "z", "p", "Rate ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.z[i], SW.fmtP(m.p[i]), m.irr[i], m.irrLower[i], m.irrUpper[i]]), label);
      const useNB = v.fam === "nb" || (v.fam === "auto" && po.dispersion > 1.5);
      if (v.fam !== "nb") {
        html += table(["Deviance", "df", "Pearson dispersion", "AIC", "chi-square (vs intercept only)", "df", "p"], [[po.dev, po.df, po.dispersion, po.aic, po.chi, po.dfChi, SW.fmtP(po.pChi)]], "Poisson model fit") + coefTable(po, `Poisson coefficients - ${v.y}`);
        html += cond(po.dispersion <= 1.5, `Dispersion ${fmt(po.dispersion, 2)} is near 1: the Poisson assumption (variance equals mean) is reasonable.`, `Dispersion ${fmt(po.dispersion, 2)} is well above 1: the counts vary more than a Poisson allows (overdispersion). Poisson standard errors are too small and its p-values too optimistic. Use the negative binomial below.`);
      }
      if (useNB) { const nb = SW.negbin(X, y, dm.names, +v.conf); html += table(["theta (dispersion parameter)", "Log-likelihood", "AIC", "Poisson AIC", "LR test NB vs Poisson", "p"], [[nb.theta, nb.ll, nb.aic, nb.poissonAic, nb.lrtVsPoisson, SW.fmtP(nb.pLrt)]], "Negative binomial model fit") + coefTable(nb, `Negative binomial coefficients - ${v.y}`) + say(`Negative binomial adds a dispersion parameter theta; smaller theta means more extra variation. ${nb.pLrt <= +v.alpha ? "The likelihood-ratio test prefers the negative binomial over Poisson." : "The two models fit about equally; Poisson is the simpler choice."}`); }
      html += formula(`log(expected ${v.y}) = b0 + b1 x1 + ... A rate ratio exp(b) is the multiplicative change in the expected count per unit of the predictor, others fixed. n = ${po.n}.`);
      html += say(`${decision(po.pChi, +v.alpha)} ${po.pChi <= +v.alpha ? "The predictors together explain variation in the count." : "No evidence the predictors explain the count."}`);
      const cd = card(useNB ? "Count Regression (Poisson and Negative Binomial)" : "Poisson Regression", src(v.y), html);
      plotDiv(cd, [{ x: y, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 1 } }, name: "observed" }], { title: `Distribution of ${v.y} (mean ${fmt(SW.mean(y), 2)}, variance ${fmt(SW.sd(y) ** 2, 2)})`, xaxis: { title: v.y }, yaxis: { title: "Count" } }, 240);
    });
  }
  function multinomUI() {
    needData();
    dialog("Advanced: Multinomial Logistic Regression (3 or more unordered outcome levels)", [selCat("y", "Outcome variable"), { name: "base", label: "Baseline level (blank = first alphabetically)", type: "text" }, { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const dm = designMatrix(v.xs, v.cs), yv = col(v.y); let keep = keepComplete(dm.rows, yv.map((q) => (q === "" ? "" : "0")));
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, yl = keep.map((i) => yv[i]); dm.names = pr.names;
      const lv = [...new Set(yl)].sort(); if (lv.length < 3) throw new Error(`${v.y} has ${lv.length} levels; use Logistic Regression for two.`);
      const base = v.base.trim() || lv[0]; if (!lv.includes(base)) throw new Error(`Levels: ${lv.join(", ")}.`);
      const m = SW.multinom(X, yl.map((l) => (l === base ? " " + l : l)), dm.names, +v.conf); m.eq.forEach((e) => (e.level = e.level.trim()));
      let html = dmNotes(dm) + table(["Deviance", "AIC", "McFadden R squared", "chi-square (vs intercept only)", "df", "p", "n"], [[-2 * m.ll, m.aic, m.mcfadden, m.chi, m.dfChi, SW.fmtP(m.pChi), m.n]], "Model fit");
      m.eq.forEach((e) => { html += table(["Predictor", "Estimate (log relative risk)", "SE", "z", "p", "Relative risk ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, e.b[i], e.se[i], e.z[i], SW.fmtP(e.p[i]), e.rrr[i], e.lower[i], e.upper[i]]), `${e.level} versus ${base}`); });
      html += formula(`One equation per level against the baseline ${base}. A relative risk ratio exp(b) is the factor by which the odds of that level (relative to ${base}) multiply per unit of the predictor.`);
      html += say(`${decision(m.pChi, +v.alpha)} ${m.pChi <= +v.alpha ? "The predictors help distinguish the outcome levels." : "No evidence the predictors distinguish the outcome levels."} Levels of ${v.y}: ${lv.join(", ")}.`);
      card("Multinomial Logistic Regression", src(v.y), html);
    });
  }
  function ordinalUI() {
    needData();
    dialog("Advanced: Ordinal Logistic Regression (proportional odds)", [selCat("y", "Ordered outcome variable"), { name: "order", label: "Levels from lowest to highest, comma separated (exactly as in the data)", type: "text", placeholder: "F, D, C, B, A" }, { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const order = v.order.split(",").map((s) => s.trim()).filter(Boolean); const yv = col(v.y), lv = [...new Set(yv.filter((q) => q !== ""))];
      if (order.length < 3 || order.some((l) => !lv.includes(l)) || lv.some((l) => !order.includes(l))) throw new Error(`Type every level of ${v.y} in order. Levels present: ${lv.join(", ")}.`);
      const dm = designMatrix(v.xs, v.cs); let keep = keepComplete(dm.rows, yv.map((q) => (q === "" ? "" : "0")));
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; dm.names = pr.names;
      const m = SW.ordinal(pr.X, keep.map((i) => yv[i]), order, dm.names, +v.conf);
      let html = dmNotes(dm) + table(["Deviance", "AIC", "chi-square (vs intercept only)", "df", "p", "n"], [[-2 * m.ll, m.aic, m.chi, m.dfChi, SW.fmtP(m.pChi), m.n]], "Model fit");
      html += table(["Predictor", "Estimate", "SE", "z", "p", "Odds ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.z[i], SW.fmtP(m.p[i]), m.or[i], m.lower[i], m.upper[i]]), `Coefficients - ${v.y}`);
      html += table(["Threshold", "Estimate"], m.cuts.map((c, i) => [`${order[i]} | ${order[i + 1]}`, c]), "Thresholds (cutpoints on the latent scale)");
      html += formula(`logit P(${v.y} at or below level k) = threshold_k minus (b1 x1 + ...). One slope per predictor for every cut (proportional odds). Odds ratio exp(b) above 1 means higher predictor values push the outcome toward ${order[order.length - 1]}.`);
      html += say(`${decision(m.pChi, +v.alpha)} ${m.pChi <= +v.alpha ? "The predictors are related to the ordered outcome." : "No evidence the predictors relate to the ordered outcome."} The proportional odds assumption (same slope at every cut) is assumed here, not tested; compare with the multinomial model if in doubt.`);
      card("Ordinal Logistic Regression", src(v.y), html);
    });
  }
  function mcnemarUI() {
    const hasData = D.rows.length > 0;
    dialog("Advanced: McNemar test (paired yes or no)", [hasData ? sel("mode", "Data", [["data", "two paired categorical columns"], ["summary", "from the two discordant counts"]], "data") : sel("mode", "Data", [["summary", "from the two discordant counts"]]), hasData ? selCat("a", "Before (or measure 1)") : null, hasData ? selCat("b", "After (or measure 2)") : null, hasData ? { name: "succ", label: "Level that counts as yes", type: "text" } : null, { name: "bc", label: "Yes before, No after", type: "number", group: "Discordant counts" }, { name: "cb", label: "No before, Yes after", type: "number", group: "Discordant counts" }, alphaField], (v) => {
      let b = v.bc, c = v.cb, from = "counts", tab = null;
      if (v.mode === "data") { const A = col(v.a), B = col(v.b), s = v.succ.trim(); let yy = 0, yn = 0, ny = 0, nn = 0; for (let i = 0; i < A.length; i++) { if (A[i] === "" || B[i] === "") continue; const a1 = A[i] === s, b1 = B[i] === s; if (a1 && b1) yy++; else if (a1) yn++; else if (b1) ny++; else nn++; } b = yn; c = ny; tab = [[yy, yn], [ny, nn]]; from = src(`${v.a} to ${v.b}, yes = ${s}`); if (yy + yn + ny + nn === 0) throw new Error("No matching rows; check the yes level."); }
      const r = SW.mcnemar(b, c);
      let html = tab ? table(["Before \\ After", "Yes", "No"], [["Yes", tab[0][0], tab[0][1]], ["No", tab[1][0], tab[1][1]]], "Paired table") : "";
      html += table(["Changed yes to no", "Changed no to yes", "chi-square (continuity corrected)", "p", "Exact binomial p"], [[b, c, r.chi, SW.fmtP(r.p), SW.fmtP(r.exact)]], "McNemar test");
      html += formula("Only the discordant pairs matter: H0 says changes in each direction are equally likely. chi-square = (|b minus c| minus 1)^2 / (b + c) on 1 df; the exact version is a binomial test of b against b + c at p = 0.5.");
      const pUse = b + c < 25 ? r.exact : r.p;
      html += say(`${decision(pUse, +v.alpha)} ${pUse <= +v.alpha ? "The proportion saying yes changed between the two measurements." : "No evidence that the proportion saying yes changed."}${b + c < 25 ? " (Fewer than 25 discordant pairs, so the exact p is used.)" : ""}`);
      card("McNemar test", from, html);
    });
  }
  function trendUI() {
    const hasData = D.rows.length > 0;
    dialog("Advanced: Cochran-Armitage trend test (proportion across ordered groups)", [hasData ? sel("mode", "Data", [["data", "outcome column by an ordered group column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]), hasData ? selCat("x", "Outcome variable") : null, hasData ? { name: "succ", label: "Level that counts as success", type: "text" } : null, hasData ? selCat("g", "Ordered group variable") : null, hasData ? { name: "order", label: "Group levels in order, comma separated (blank = alphabetical)", type: "text" } : null, { name: "s", label: "Successes per group, comma separated", type: "text", group: "Counts" }, { name: "n", label: "Totals per group, comma separated", type: "text", group: "Counts" }, alphaField], (v) => {
      let succ, tot, labels, from = "counts";
      if (v.mode === "data") { const xv = col(v.x), gv = col(v.g); labels = v.order.trim() ? v.order.split(",").map((s) => s.trim()) : [...new Set(gv.filter((q) => q !== ""))].sort(); succ = labels.map((l) => xv.filter((q, i) => gv[i] === l && q === v.succ.trim()).length); tot = labels.map((l) => xv.filter((q, i) => gv[i] === l && q !== "").length); from = src(`${v.x} = ${v.succ} across ${v.g}`); }
      else { succ = v.s.split(",").map(Number); tot = v.n.split(",").map(Number); labels = succ.map((_, i) => "group " + (i + 1)); }
      if (succ.length < 3) throw new Error("Need at least three ordered groups.");
      const r = SW.trendTest(succ, tot);
      let html = table(["Group", "Successes", "Total", "Proportion"], labels.map((l, i) => [l, succ[i], tot[i], r.props[i]]), "Proportions by ordered group") + table(["z", "chi-square", "df", "p"], [[r.z, r.chi, 1, SW.fmtP(r.p)]], "Cochran-Armitage trend test (scores 1, 2, 3, ...)");
      html += formula("Tests whether the proportion rises or falls steadily across the ordered groups, which is more powerful than the general chi-square when a trend is the question.") + say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence of a ${r.z > 0 ? "rising" : "falling"} trend in the proportion across the groups.` : "No evidence of a linear trend across the groups."}`);
      const cd = card("Cochran-Armitage trend test", from, html);
      plotDiv(cd, [{ x: labels, y: r.props, mode: "lines+markers", line: { color: "#3A7CA5" } }], { yaxis: { title: "proportion", rangemode: "tozero" } }, 240);
    });
  }


  function powerUI() {
    dialog("Advanced: Power and Sample Size", [
      sel("test", "Test", [["t1", "One-sample or paired t (effect d = mean difference / SD)"], ["t2", "Two independent means, t (d = difference / SD, n per group)"], ["prop1", "One proportion (p0 against p1)"], ["prop2", "Two proportions (n per group)"], ["anova", "One-way ANOVA (Cohen's f, n per group)"], ["corr", "Correlation (r)"], ["chisq", "Chi-square (Cohen's w, df)"]], "t2"),
      sel("mode", "Find", [["power", "power, given the sample size"], ["n", "sample size, for a target power"]], "n"),
      { name: "d", label: "Effect size: d, f, w, or r (Cohen: d 0.2 small, 0.5 medium, 0.8 large; f 0.1, 0.25, 0.4; w 0.1, 0.3, 0.5; r 0.1, 0.3, 0.5)", type: "number", value: 0.5, group: "Effect" },
      { name: "p0", label: "p0 or p1 (proportions)", type: "number", value: 0.5, group: "Effect" }, { name: "p1", label: "p1 or p2 (proportions)", type: "number", value: 0.65, group: "Effect" },
      { name: "k", label: "Groups (ANOVA) or df (chi-square)", type: "number", value: 3, group: "Effect" },
      { name: "n", label: "Sample size n (per group where relevant)", type: "number", value: 30, group: "Design" }, { name: "pow", label: "Target power", type: "number", value: 0.8, group: "Design" }, alphaField,
      sel("alt", "Alternative", [["two", "two-sided"], ["one", "one-sided"]], "two")], (v) => {
      const a = +v.alpha, alt = v.alt === "two" ? "two" : "greater";
      const P = S => S; const fn = {
        t1: (n) => SW.power.t1(v.d, n, a, alt), t2: (n) => SW.power.t2(v.d, n, a, alt), prop1: (n) => SW.power.prop1(v.p0, v.p1, n, a, alt), prop2: (n) => SW.power.prop2(v.p0, v.p1, n, a, alt),
        anova: (n) => SW.power.anova(v.d, v.k, n, a), corr: (n) => SW.power.corr(v.d, n, a, alt), chisq: (n) => SW.power.chisq(v.d, v.k, n, a) }[v.test];
      const effLabel = { t1: `d = ${v.d}`, t2: `d = ${v.d}`, prop1: `p0 = ${v.p0}, p1 = ${v.p1}`, prop2: `p1 = ${v.p0}, p2 = ${v.p1}`, anova: `f = ${v.d}, ${v.k} groups`, corr: `r = ${v.d}`, chisq: `w = ${v.d}, df = ${v.k}` }[v.test];
      const perGroup = ["t2", "prop2", "anova"].includes(v.test);
      let html, nUse;
      if (v.mode === "n") { nUse = SW.solveN(fn, v.pow, v.test === "corr" ? 5 : 3); html = table(["Test", "Effect", "Alpha", "Target power", perGroup ? "n per group" : "n", "Power at that n"], [[v.test, effLabel, a, v.pow, Number.isFinite(nUse) ? nUse : "over 100,000", Number.isFinite(nUse) ? fn(nUse) : ""]], "Sample size"); }
      else { nUse = Math.round(v.n); html = table(["Test", "Effect", "Alpha", perGroup ? "n per group" : "n", "Power"], [[v.test, effLabel, a, nUse, fn(nUse)]], "Power"); }
      html += formula("Power = P(reject H0 | the effect is real) = 1 minus beta. Computed from the noncentral t, F, or chi-square distribution (normal approximation for proportions and correlation), the same as R's power.t.test family.");
      html += say(`${v.mode === "n" ? `You need ${Number.isFinite(nUse) ? nUse : "more than 100,000"}${perGroup ? " per group" : ""} for ${Math.round(100 * v.pow)} percent power to detect ${effLabel} at alpha ${a}.` : `With ${nUse}${perGroup ? " per group" : ""}, the chance of detecting ${effLabel} is ${fmt(100 * fn(nUse), 1)} percent.`} Power below 80 percent means a real effect of this size will often be missed; a non-significant result then says little. Effect sizes should come from prior studies or the smallest difference that matters, not from the data you are about to collect.`);
      const cd = card("Power and Sample Size", effLabel, html);
      const maxN = Math.max(10, Math.min(2000, Number.isFinite(nUse) ? Math.ceil(nUse * 2.2) : 500)), xs = [], ys = []; for (let n = 3; n <= maxN; n += Math.max(1, Math.floor(maxN / 120))) { xs.push(n); ys.push(fn(n)); }
      plotDiv(cd, [{ x: xs, y: ys, mode: "lines", line: { color: "#3A7CA5", width: 2 }, name: "power" }], { title: `Power curve, ${effLabel}, alpha ${a}`, xaxis: { title: perGroup ? "n per group" : "n" }, yaxis: { title: "power", range: [0, 1.02] }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: v.mode === "n" ? v.pow : 0.8, y1: v.mode === "n" ? v.pow : 0.8, line: { color: "#C0392B", dash: "dash" } }].concat(Number.isFinite(nUse) ? [{ type: "line", x0: nUse, x1: nUse, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dot" } }] : []) }, 280);
      // effect-size sensitivity: power at this n across effect sizes
      if (["t1", "t2", "anova", "corr", "chisq"].includes(v.test) && Number.isFinite(nUse)) { const es = [], pw = []; const top = v.test === "corr" ? 0.9 : v.test === "anova" ? 0.6 : v.test === "chisq" ? 0.7 : 1.5; for (let e = 0.02; e <= top; e += top / 60) { es.push(e); pw.push({ t1: SW.power.t1(e, nUse, a, alt), t2: SW.power.t2(e, nUse, a, alt), anova: SW.power.anova(e, v.k, nUse, a), corr: SW.power.corr(e, nUse, a, alt), chisq: SW.power.chisq(e, v.k, nUse, a) }[v.test]); } plotDiv(cd, [{ x: es, y: pw, mode: "lines", line: { color: "#D97D54", width: 2 } }], { title: `Power against effect size at n = ${nUse}${perGroup ? " per group" : ""}`, xaxis: { title: "effect size" }, yaxis: { title: "power", range: [0, 1.02] }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0.8, y1: 0.8, line: { color: "#C0392B", dash: "dash" } }] }, 260); }
    });
  }


  function bootUI() {
    needData();
    dialog("Advanced: Bootstrap confidence interval", [sel("stat", "Statistic", [["mean", "mean of one variable"], ["median", "median of one variable"], ["sd", "standard deviation of one variable"], ["prop", "proportion of one level"], ["diffmean", "difference in means between two groups"], ["diffmed", "difference in medians between two groups"], ["corr", "correlation between two variables"], ["slope", "regression slope of y on x"]], "mean"),
      selNum("x", "Numeric variable (or x)"), selNum("y2", "Second numeric variable (y, for correlation or slope)"), selCat("g", "Grouping variable (two levels, for differences) or the categorical variable (for a proportion)"), lvField, { name: "succ", label: "Level for the proportion", type: "text" },
      { name: "reps", label: "Resamples", type: "number", value: 2000 }, { name: "seed", label: "Random seed (same seed, same answer)", type: "number", value: 1 }, confField], (v) => {
      let x, y = null, paired = false, stat, label;
      const lv2 = () => pickTwo(v.g, v.lv);
      if (["mean", "median", "sd"].includes(v.stat)) { x = SW.num(col(v.x)); stat = { mean: SW.mean, median: SW.median, sd: SW.sd }[v.stat]; label = `${v.stat} of ${v.x}`; }
      else if (v.stat === "prop") { x = col(v.g).filter((q) => q !== "").map((q) => (q === v.succ.trim() ? 1 : 0)); if (!x.some((q) => q)) throw new Error("No rows match that level."); stat = SW.mean; label = `proportion of ${v.g} = ${v.succ}`; }
      else if (v.stat === "diffmean" || v.stat === "diffmed") { const lv = lv2(); x = SW.num(col(v.x).filter((_, i) => col(v.g)[i] === lv[0])); y = SW.num(col(v.x).filter((_, i) => col(v.g)[i] === lv[1])); const f = v.stat === "diffmean" ? SW.mean : SW.median; stat = (a, b) => f(a) - f(b); label = `${v.stat === "diffmean" ? "mean" : "median"} ${v.x}: ${lv[0]} minus ${lv[1]}`; }
      else { const xa = col(v.x), ya = col(v.y2); const keep = xa.map((_, i) => i).filter((i) => xa[i] !== "" && ya[i] !== ""); x = keep.map((i) => Number(xa[i])); y = keep.map((i) => Number(ya[i])); paired = true; stat = v.stat === "corr" ? (a, b) => SW.regress(a, b).r : (a, b) => SW.regress(a, b).b1; label = v.stat === "corr" ? `correlation of ${v.x} and ${v.y2}` : `slope of ${v.y2} on ${v.x}`; }
      const r = SW.bootstrap({ x, y, stat, reps: Math.min(20000, Math.max(200, v.reps)), conf: +v.conf, seed: v.seed, paired });
      let html = table(["Statistic", "Observed", "Bootstrap SE", "Bias", `${Math.round(r.conf * 100)}% percentile interval`, "", "Resamples"], [[label, r.observed, r.se, r.bias, r.lower, r.upper, r.reps]], "Bootstrap");
      html += formula("Resample the data with replacement, the same size as the original, recompute the statistic, repeat. The spread of those values is the sampling variation you would have seen with new data. The percentile interval takes the middle 95 percent of the bootstrap values. No formula for the standard error, no normality assumption.");
      html += say(`We are ${Math.round(r.conf * 100)} percent confident the population ${label} is between ${fmt(r.lower)} and ${fmt(r.upper)}. ${Math.abs(r.bias) > 0.25 * r.se ? "The bootstrap distribution is noticeably off-centre (bias larger than a quarter of the SE), so treat the interval as approximate; the basic interval is " + fmt(r.basicLower) + " to " + fmt(r.basicUpper) + "." : "Bias is small relative to the SE, so the percentile interval is trustworthy."}`);
      const cd = card("Bootstrap confidence interval", src(label), html);
      plotDiv(cd, [{ x: r.dist, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 0.5 } }, name: "bootstrap values" }], { title: `${r.reps} bootstrap ${label}s`, xaxis: { title: label }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: r.observed, x1: r.observed, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: r.lower, x1: r.lower, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }, { type: "line", x0: r.upper, x1: r.upper, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }] }, 280);
    });
  }
  function permUI() {
    needData();
    dialog("Advanced: Permutation (randomization) test", [sel("kind", "Design", [["twoGroup", "two independent groups: difference in means"], ["twoMed", "two independent groups: difference in medians"], ["paired", "paired: mean of differences"], ["corr", "two numeric variables: correlation"]], "twoGroup"),
      selNum("x", "Numeric variable (or measure 1, or x)"), selNum("y2", "Second numeric variable (measure 2, or y)"), selCat("g", "Grouping variable (two levels)"), lvField,
      sel("alt", "Alternative", [["two", "two-sided"], ["greater", "observed statistic greater than 0"], ["less", "observed statistic less than 0"]], "two"), { name: "reps", label: "Shuffles", type: "number", value: 2000 }, { name: "seed", label: "Random seed", type: "number", value: 1 }, alphaField], (v) => {
      let r, label, kind = v.kind;
      if (kind === "twoGroup" || kind === "twoMed") { const lv = pickTwo(v.g, v.lv); const keep = col(v.x).map((_, i) => i).filter((i) => col(v.x)[i] !== "" && lv.includes(col(v.g)[i])); const f = kind === "twoGroup" ? SW.mean : SW.median; r = SW.permutation({ x: keep.map((i) => Number(col(v.x)[i])), y: keep.map((i) => col(v.g)[i]), stat: (A, B) => f(A) - f(B), reps: Math.min(20000, Math.max(200, v.reps)), seed: v.seed, kind: "twoGroup", alt: v.alt }); label = `${kind === "twoGroup" ? "mean" : "median"} ${v.x}: ${lv[0]} minus ${lv[1]}`; }
      else if (kind === "paired") { const xa = col(v.x), ya = col(v.y2); const keep = xa.map((_, i) => i).filter((i) => xa[i] !== "" && ya[i] !== ""); r = SW.permutation({ x: keep.map((i) => Number(xa[i])), y: keep.map((i) => Number(ya[i])), stat: SW.mean, reps: Math.min(20000, Math.max(200, v.reps)), seed: v.seed, kind: "paired", alt: v.alt }); label = `mean of ${v.x} minus ${v.y2}`; }
      else { const xa = col(v.x), ya = col(v.y2); const keep = xa.map((_, i) => i).filter((i) => xa[i] !== "" && ya[i] !== ""); r = SW.permutation({ x: keep.map((i) => Number(xa[i])), y: keep.map((i) => Number(ya[i])), stat: (a, b) => SW.regress(a, b).r, reps: Math.min(20000, Math.max(200, v.reps)), seed: v.seed, kind: "corr", alt: v.alt }); label = `correlation of ${v.x} and ${v.y2}`; }
      let html = table(["Statistic", "Observed", "Shuffles", "Shuffles at least as extreme", "p-value"], [[label, r.observed, r.reps, Math.round(r.p * (r.reps + 1) - 1), SW.fmtP(r.p)]], "Permutation test");
      html += formula(kind === "paired" ? "If H0 is true, each difference is as likely to be positive as negative. Flip the signs at random, recompute the mean difference, repeat. The p-value is the share of shuffled results at least as extreme as the observed one (with the observed result counted once)." : kind === "corr" ? "If H0 is true, the pairing of x with y is arbitrary. Shuffle y, recompute r, repeat. The p-value is the share of shuffles with |r| at least as large as observed." : "If H0 is true, the group labels are arbitrary. Shuffle the labels, recompute the difference, repeat. The p-value is the share of shuffles at least as extreme as the observed difference. This is what a p-value means, made visible.");
      html += say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `A ${label} of ${fmt(r.observed)} would be rare if the groups (or pairs) were interchangeable.` : `A ${label} of ${fmt(r.observed)} happens easily by chance when the labels are shuffled.`} No normality assumption; this is the exact logic the t-test approximates.`);
      const cd = card("Permutation test", src(label), html);
      const lo = v.alt === "two" ? -Math.abs(r.observed) : null;
      plotDiv(cd, [{ x: r.dist, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 0.5 } }, name: "shuffled" }], { title: `${r.reps} shuffles under H0; observed value in red`, xaxis: { title: label }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: r.observed, x1: r.observed, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }].concat(lo != null ? [{ type: "line", x0: lo, x1: lo, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2, dash: "dot" } }] : []) }, 280);
    });
  }


  function tsUI() {
    needData();
    dialog("Advanced: Time Series", [selNum("y", "Series (numeric, in time order as the rows are sorted)"), selAny("t", "Time label column (optional, for the axis)"), { name: "period", label: "Seasonal period (12 monthly, 4 quarterly, 7 daily; blank = none)", type: "number", value: 12 }, { name: "ma", label: "Moving average window", type: "number", value: 12 }, { name: "lags", label: "Lags for ACF and PACF", type: "number", value: 24 },
      sel("dtype", "Decomposition", [["additive", "additive (seasonal swing constant)"], ["multiplicative", "multiplicative (seasonal swing grows with the level)"]], "additive"),
      { name: "acf", label: "Autocorrelation (ACF and PACF)", type: "check", value: true, group: "Show" }, { name: "dec", label: "Decomposition (trend, seasonal, remainder)", type: "check", value: true, group: "Show" }, { name: "lag", label: "Lag-1 plot", type: "check", value: true, group: "Show" }, { name: "trend", label: "Linear trend and Durbin-Watson", type: "check", value: true, group: "Show" }, { name: "smooth", label: "Exponential smoothing forecast (Holt)", type: "check", value: true, group: "Show" }, { name: "h", label: "Forecast steps ahead", type: "number", value: 12, group: "Show" }], (v) => {
      const raw = col(v.y), keep = raw.map((_, i) => i).filter((i) => raw[i] !== "" && Number.isFinite(Number(raw[i]))), x = keep.map((i) => Number(raw[i])), n = x.length;
      const tl = v.t ? keep.map((i) => col(v.t)[i]) : keep.map((i) => String(i + 1));
      if (n < 10) throw new Error("Need at least 10 observations.");
      const period = Number.isFinite(v.period) && v.period >= 2 && n >= 2 * v.period ? Math.round(v.period) : null;
      const cd = card("Time Series", src(`${v.y}, ${n} observations${period ? ", period " + period : ""}`), "");
      const ma = S => S; const win = Math.max(2, Math.round(v.ma)), m = SW.movingAverage(x, win);
      plotDiv(cd, [{ x: tl, y: x, mode: "lines", name: v.y, line: { color: "#3A7CA5" } }, { x: tl, y: m, mode: "lines", name: `${win}-point moving average`, line: { color: "#C0392B", width: 2 } }], { title: "Time plot", yaxis: { title: v.y } }, 300);
      cd.insertAdjacentHTML("beforeend", say("Read the time plot first: level, trend, seasonality (a repeating shape), and anything odd. The moving average smooths out the seasonal swing when its window equals the period."));
      if (v.acf) {
        const L = Math.min(Math.round(v.lags), Math.floor(n / 2)), a = SW.acf(x, L), p = SW.pacf(x, L), band = 1.96 / Math.sqrt(n);
        cd.insertAdjacentHTML("beforeend", table(["Lag"].concat(Array.from({ length: Math.min(L, 12) }, (_, i) => String(i + 1))), [["ACF"].concat(a.slice(1, 13)), ["PACF"].concat(p.slice(0, 12))], "Autocorrelation") + formula(`ACF at lag k is the correlation between the series and itself k steps earlier. Bars outside plus or minus ${fmt(band, 3)} (1.96 / sqrt(n)) are distinguishable from zero. Slowly decaying ACF = trend; spikes at the period = seasonality; PACF cutting off after lag p suggests an AR(p) structure.`));
        plotDiv(cd, [{ x: Array.from({ length: L }, (_, i) => i + 1), y: a.slice(1), type: "bar", name: "ACF", marker: { color: "#3A7CA5" } }], { title: "ACF", xaxis: { title: "lag" }, yaxis: { range: [-1, 1] }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: band, y1: band, line: { dash: "dash", color: "#C0392B" } }, { type: "line", x0: 0, x1: 1, xref: "paper", y0: -band, y1: -band, line: { dash: "dash", color: "#C0392B" } }] }, 240);
        plotDiv(cd, [{ x: Array.from({ length: L }, (_, i) => i + 1), y: p, type: "bar", name: "PACF", marker: { color: "#D97D54" } }], { title: "PACF", xaxis: { title: "lag" }, yaxis: { range: [-1, 1] }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: band, y1: band, line: { dash: "dash", color: "#C0392B" } }, { type: "line", x0: 0, x1: 1, xref: "paper", y0: -band, y1: -band, line: { dash: "dash", color: "#C0392B" } }] }, 240);
      }
      if (v.lag) plotDiv(cd, [{ x: x.slice(0, -1), y: x.slice(1), mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: 5 } }], { title: `Lag-1 plot (r = ${fmt(SW.acf(x, 1)[1], 3)}): each value against the previous one`, xaxis: { title: "value at t minus 1" }, yaxis: { title: "value at t" } }, 280);
      if (v.dec && period) {
        const d = SW.decompose(x, period, v.dtype);
        cd.insertAdjacentHTML("beforeend", table(["Season"].concat(d.indices.map((_, i) => String(i + 1))), [[v.dtype === "additive" ? "Effect (added)" : "Factor (multiplied)"].concat(d.indices)], `Seasonal indices, period ${period}`) + formula(v.dtype === "additive" ? "series = trend + seasonal + remainder. Trend is a centred moving average over one period; the seasonal effect for each season is the average of (series minus trend) at that season, centred on zero." : "series = trend x seasonal x remainder. Seasonal factors average to 1."));
        plotDiv(cd, [{ x: tl, y: d.trend, mode: "lines", name: "trend", line: { color: "#C0392B" } }], { title: "Trend", yaxis: { title: v.y } }, 200);
        plotDiv(cd, [{ x: tl, y: d.seasonal, mode: "lines", name: "seasonal", line: { color: "#2E7D5B" } }], { title: "Seasonal", yaxis: { title: v.dtype === "additive" ? "effect" : "factor" } }, 200);
        plotDiv(cd, [{ x: tl, y: d.remainder, mode: "markers", name: "remainder", marker: { color: "#5A5A5A", size: 4 } }], { title: "Remainder (what trend and season do not explain)", yaxis: { title: "remainder" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: v.dtype === "additive" ? 0 : 1, y1: v.dtype === "additive" ? 0 : 1, line: { dash: "dash", color: "#1A3A4D" } }] }, 200);
      } else if (v.dec) cd.insertAdjacentHTML("beforeend", warn("No decomposition: give a seasonal period and at least two full periods of data."));
      if (v.trend) {
        const r = SW.regress(x.map((_, i) => i + 1), x), dw = SW.durbinWatson(r.resid);
        cd.insertAdjacentHTML("beforeend", table(["Slope per step", "SE", "p", "R squared", "Durbin-Watson"], [[r.b1, r.seb1, SW.fmtP(r.p), r.r2, dw]], "Linear trend") + formula("Durbin-Watson near 2 means independent residuals; near 0 means strong positive autocorrelation, so the regression p-value and SE are not trustworthy (each observation is not new information). Use differences, or a model with the autocorrelation in it.") + cond(dw > 1.5 && dw < 2.5, `DW = ${fmt(dw, 2)}: residuals look independent; the trend test can be read as usual.`, `DW = ${fmt(dw, 2)}: residuals are autocorrelated. Report the slope as a description; do not trust its p-value.`));
        const dx = SW.diff(x); plotDiv(cd, [{ x: tl.slice(1), y: dx, mode: "lines", line: { color: "#3A7CA5" } }], { title: `First differences (mean ${fmt(SW.mean(dx), 3)}, SD ${fmt(SW.sd(dx), 3)}): the series with the trend removed`, yaxis: { title: "change" } }, 220);
      }
      if (v.smooth) {
        const hh = Math.max(1, Math.round(v.h)), flab = Array.from({ length: hh }, (_, k) => "+" + (k + 1));
        let d = null, base = x; if (period) { d = SW.decompose(x, period, v.dtype); base = x.map((val, i) => (v.dtype === "additive" ? val - d.seasonal[i] : val / d.seasonal[i])); }
        const ho = SW.holt(base); const fc = Array.from({ length: hh }, (_, k) => ho.level + (k + 1) * ho.trend);
        let fcS = null; if (period) { fcS = fc.map((f, k) => (v.dtype === "additive" ? f + d.indices[(n + k) % period] : f * d.indices[(n + k) % period])); ho.fitted = ho.fitted.map((f, i) => (v.dtype === "additive" ? f + d.seasonal[i] : f * d.seasonal[i])); }
        cd.insertAdjacentHTML("beforeend", table(["alpha (level)", "beta (trend)", "RMSE of one-step forecasts", "Last level", "Trend per step", `Forecast +${hh}`], [[ho.alpha, ho.beta, ho.rmse, ho.level, ho.trend, fcS ? fcS[hh - 1] : fc[hh - 1]]], "Holt exponential smoothing" + (fcS ? " on the deseasonalized series, seasonal pattern added back" : "")) + formula("Holt's method updates a level and a trend after every observation, weighting recent values more (alpha, beta chosen to minimise one-step forecast error). Forecasts extend the last level and trend; the seasonal indices are added back when a period is given. A forecast is a projection of the pattern, not a prediction of surprises."));
        plotDiv(cd, [{ x: tl, y: x, mode: "lines", name: "observed", line: { color: "#3A7CA5" } }, { x: tl, y: ho.fitted, mode: "lines", name: "one-step fitted", line: { color: "#5A5A5A", dash: "dot" } }, { x: flab, y: fcS || fc, mode: "lines+markers", name: "forecast", line: { color: "#C0392B", width: 2 } }], { title: `Forecast ${hh} steps ahead`, yaxis: { title: v.y } }, 300);
      }
    });
  }


  function numMatrix(vars) { const cols = vars.map((v) => col(v)); const keep = cols[0].map((_, i) => i).filter((i) => cols.every((c) => c[i] !== "" && Number.isFinite(Number(c[i])))); return { cols: cols.map((c) => keep.map((i) => Number(c[i]))), keep }; }
  function pcaUI() {
    needData();
    dialog("Advanced: Principal Component Analysis", [{ name: "vars", label: "Variables (3 or more numeric)", type: "multi", options: numCols() }, { name: "m", label: "Components to show loadings for (blank = eigenvalues above 1)", type: "number", value: "" }, { name: "rot", label: "Varimax rotation of the shown components", type: "check", value: false }, selAny("by", "Colour the score plot by (optional)")], (v) => {
      if (v.vars.length < 3) throw new Error("Pick at least three variables.");
      const { cols, keep } = numMatrix(v.vars); const r = SW.pca(cols, v.vars); const p = v.vars.length;
      const m = Number.isFinite(v.m) && v.m >= 1 ? Math.min(p, Math.round(v.m)) : Math.max(1, r.values.filter((e) => e > 1).length);
      let L = r.loadings.map((row) => row.slice(0, m)); let rotNote = ""; if (v.rot && m > 1) { L = SW.varimax(L).loadings; rotNote = " (varimax rotated)"; }
      let html = table(["Component"].concat(r.values.slice(0, Math.min(p, 10)).map((_, k) => "PC" + (k + 1))), [["Eigenvalue"].concat(r.values.slice(0, 10)), ["Proportion of variance"].concat(r.prop.slice(0, 10)), ["Cumulative"].concat(r.cum.slice(0, 10))], "Eigenvalues (on the correlation matrix, variables standardized)");
      html += table(["Variable"].concat(Array.from({ length: m }, (_, k) => "PC" + (k + 1)), ["Communality"]), v.vars.map((nm, i) => [nm].concat(L[i], [L[i].reduce((s, q) => s + q * q, 0)])), `Loadings${rotNote}: correlation of each variable with each component`);
      html += formula(`Components are new axes through the standardized data, each capturing the most remaining variance, uncorrelated with the others. Kaiser's rule keeps eigenvalues above 1 (${r.values.filter((e) => e > 1).length} here); the scree plot's elbow is the other guide. n = ${keep.length} complete rows.`);
      html += say(`The first ${m} component${m > 1 ? "s" : ""} carry ${fmt(100 * r.cum[m - 1], 1)} percent of the variation in ${p} variables. Name each component from the variables that load above about 0.4 on it${v.rot ? "; rotation makes each variable load mainly on one component" : ""}.`);
      const cd = card("Principal Component Analysis", src(v.vars.length + " variables"), html);
      plotDiv(cd, [{ x: r.values.map((_, k) => k + 1), y: r.values, mode: "lines+markers", line: { color: "#3A7CA5" } }], { title: "Scree plot", xaxis: { title: "component", dtick: 1 }, yaxis: { title: "eigenvalue" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 1, y1: 1, line: { dash: "dash", color: "#C0392B" } }] }, 260);
      if (m >= 2) {
        const groups = v.by ? [...new Set(keep.map((i) => col(v.by)[i]))] : [null]; const sc = r.scores;
        const traces = groups.map((g) => { const idx = keep.map((_, s) => s).filter((s) => g == null || col(v.by)[keep[s]] === g); return { x: idx.map((s) => sc[s][0]), y: idx.map((s) => sc[s][1]), mode: "markers", type: "scatter", name: g == null ? "scores" : String(g), marker: { size: 5, opacity: 0.7 } }; });
        const scale = Math.max(...sc.map((s) => Math.abs(s[0]))) * 0.8; v.vars.forEach((nm, i) => { traces.push({ x: [0, r.loadings[i][0] * scale], y: [0, r.loadings[i][1] * scale], mode: "lines+text", text: ["", nm], textposition: "top center", line: { color: "#C0392B", width: 1.5 }, showlegend: false, hoverinfo: "text" }); });
        plotDiv(cd, traces, { title: "Biplot: scores on PC1 and PC2 with variable arrows", xaxis: { title: `PC1 (${fmt(100 * r.prop[0], 1)}%)` }, yaxis: { title: `PC2 (${fmt(100 * r.prop[1], 1)}%)` } }, 360);
      }
    });
  }
  function efaUI() {
    needData();
    dialog("Advanced: Exploratory Factor Analysis (principal axis, varimax)", [{ name: "vars", label: "Items (3 or more numeric)", type: "multi", options: numCols() }, { name: "m", label: "Number of factors", type: "number", value: 2 }, { name: "rot", label: "Varimax rotation", type: "check", value: true }, { name: "cut", label: "Hide loadings below (absolute)", type: "number", value: 0.3 }], (v) => {
      if (v.vars.length < 3) throw new Error("Pick at least three items.");
      const { cols, keep } = numMatrix(v.vars); const m = Math.max(1, Math.min(Math.round(v.m), Math.floor(v.vars.length / 2))); const r = SW.efa(cols, v.vars, m, v.rot);
      let html = table(["Factor"].concat(r.ss.map((_, k) => "F" + (k + 1))), [["Sum of squared loadings"].concat(r.ss), ["Proportion of variance"].concat(r.prop), ["Cumulative"].concat(r.cum)], `Variance explained${r.rotated ? " (after varimax)" : ""}`);
      html += table(["Item"].concat(r.ss.map((_, k) => "F" + (k + 1)), ["Communality", "Uniqueness"]), v.vars.map((nm, i) => [nm].concat(r.loadings[i].map((l) => (Math.abs(l) < v.cut ? "" : fmt(l))), [r.communality[i], r.uniqueness[i]])), `Factor loadings (blank = below ${v.cut})`);
      html += table(["Eigenvalue of the correlation matrix"].concat(r.eigen.slice(0, Math.min(10, r.eigen.length)).map((_, k) => String(k + 1))), [["value"].concat(r.eigen.slice(0, 10))], "Eigenvalues, for choosing the number of factors");
      html += formula("Principal axis factoring: only the shared variance (communality) of each item is analysed, unlike PCA which uses all of it. Communality = share of an item's variance the factors explain; uniqueness = the rest. Varimax rotates the factors so each item loads mainly on one.");
      const weak = v.vars.filter((_, i) => r.communality[i] < 0.2);
      html += say(`${m} factor${m > 1 ? "s" : ""} explain ${fmt(100 * r.cum[m - 1], 1)} percent of the item variance. Name each factor from the items loading above ${v.cut} on it; a negative loading means the item is reverse-keyed.${weak.length ? ` Items with communality under 0.2 (${weak.join(", ")}) belong to none of the factors and may not fit the scale.` : ""} Use the scree plot: factors beyond the elbow (eigenvalue near 1 or below) add little.`);
      const cd = card("Exploratory Factor Analysis", src(`${v.vars.length} items, ${m} factors`), html);
      plotDiv(cd, [{ x: r.eigen.map((_, k) => k + 1), y: r.eigen, mode: "lines+markers", line: { color: "#3A7CA5" } }], { title: "Scree plot", xaxis: { title: "factor", dtick: 1 }, yaxis: { title: "eigenvalue" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 1, y1: 1, line: { dash: "dash", color: "#C0392B" } }] }, 240);
      plotDiv(cd, [{ z: r.loadings, x: r.ss.map((_, k) => "F" + (k + 1)), y: v.vars, type: "heatmap", colorscale: [[0, "#B5476B"], [0.5, "#ffffff"], [1, "#2C5F7C"]], zmin: -1, zmax: 1, colorbar: { title: "loading" } }], { title: "Loading pattern", yaxis: { autorange: "reversed" } }, Math.max(260, 16 * v.vars.length + 60));
    });
  }
  function alphaUI() {
    needData();
    dialog("Advanced: Reliability (Cronbach's alpha)", [{ name: "vars", label: "Items of one scale (3 or more numeric)", type: "multi", options: numCols() }, { name: "rev", label: "Reverse-keyed items, comma separated (flipped as max + min minus x)", type: "text", placeholder: "E2, E4, E6" }], (v) => {
      if (v.vars.length < 3) throw new Error("Pick at least three items.");
      let { cols } = numMatrix(v.vars); const rev = v.rev.split(",").map((s) => s.trim()).filter(Boolean); const bad = rev.filter((s) => !v.vars.includes(s)); if (bad.length) throw new Error(`Not among the items: ${bad.join(", ")}`);
      const allv = cols.flat(), lo = Math.min(...allv), hi = Math.max(...allv);
      cols = cols.map((c, j) => (rev.includes(v.vars[j]) ? c.map((x) => hi + lo - x) : c));
      const r = SW.alpha(cols);
      let html = table(["Cronbach's alpha", "Standardized alpha", "Items", "n", "Mean inter-item correlation"], [[r.alpha, r.standardized, r.k, r.n, r.meanR]], "Scale reliability");
      html += table(["Item", "Mean", "SD", "Item-rest correlation", "Alpha if item dropped"], v.vars.map((nm, i) => [nm + (rev.includes(nm) ? " (reversed)" : ""), r.items[i].mean, r.items[i].sd, r.items[i].itemTotal, r.items[i].alphaIfDropped]), "Item statistics");
      html += formula("alpha = (k / (k minus 1)) (1 minus sum of item variances / variance of the total). It measures internal consistency: how much the items agree with each other. Rough guide: 0.7 acceptable, 0.8 good, 0.9 and above excellent; above 0.95 suggests redundant items.");
      const drops = v.vars.filter((_, i) => r.items[i].alphaIfDropped > r.alpha + 0.01), neg = v.vars.filter((_, i) => r.items[i].itemTotal < 0);
      html += cond(r.alpha >= 0.7, `Alpha ${fmt(r.alpha, 3)}: the items hang together well enough to be summed into one score.`, `Alpha ${fmt(r.alpha, 3)}: below 0.7, the items do not agree enough to be one scale.`) + (neg.length ? warn(`Negative item-rest correlation for ${neg.join(", ")}: these items are probably reverse-keyed. Add them to the reverse list and run again.`) : "") + (drops.length ? say(`Dropping ${drops.join(" or ")} would raise alpha; consider whether those items belong.`) : "");
      card("Reliability (Cronbach's alpha)", src(`${v.vars.length} items`), html);
    });
  }
  function survivalUI() {
    needData();
    dialog("Advanced: Survival Analysis (Kaplan-Meier, log-rank, Cox)", [selNum("t", "Time to event or censoring (numeric)"), selCat("e", "Event indicator (two levels)"), { name: "succ", label: "Level that means the event happened (exactly as in the data)", type: "text", placeholder: "Yes" }, selAny("g", "Group (optional: one Kaplan-Meier curve per level, log-rank test)"),
      { name: "xs", label: "Cox model: numeric predictors (optional)", type: "multi", options: numCols() }, { name: "cs", label: "Cox model: categorical predictors (optional)", type: "multi", options: catCols() },
      { name: "risk", label: "Risk table (numbers at risk over time)", type: "check", value: true, group: "Show" }, { name: "ci", label: "Confidence band on the curves", type: "check", value: true, group: "Show" }, confField, alphaField], (v) => {
      const tv = col(v.t), ev = col(v.e), lv = [...new Set(ev.filter((q) => q !== ""))]; if (!lv.includes(v.succ.trim())) throw new Error(`Levels of ${v.e}: ${lv.join(", ")}. Type one of them.`);
      const gv = v.g ? col(v.g) : null; let keep = tv.map((_, i) => i).filter((i) => tv[i] !== "" && Number.isFinite(Number(tv[i])) && Number(tv[i]) >= 0 && ev[i] !== "" && (!gv || gv[i] !== ""));
      if (keep.length < 5) throw new Error("Need at least 5 usable rows.");
      const time = keep.map((i) => Number(tv[i])), event = keep.map((i) => (ev[i] === v.succ.trim() ? 1 : 0)), group = gv ? keep.map((i) => gv[i]) : keep.map(() => "All");
      const levels = [...new Set(group)], conf = +v.conf, colors = ["#3A7CA5", "#C0392B", "#2E7D5B", "#D97D54", "#6C4AB6", "#5A5A5A"];
      const fits = levels.map((L) => { const idx = group.map((g, i) => (g === L ? i : -1)).filter((i) => i >= 0); return { L, km: SW.kaplanMeier(idx.map((i) => time[i]), idx.map((i) => event[i]), conf) }; });
      let html = table(["Group", "n", "Events", "Censored", "Median survival time", `Survival at the last event time`], fits.map((f) => [f.L, f.km.n, f.km.events, f.km.n - f.km.events, f.km.median == null ? "not reached" : f.km.median, f.km.rows[f.km.rows.length - 1].surv]), "Kaplan-Meier summary");
      html += formula("S(t) = product over event times of (1 minus d / n at risk). Censored rows (the event had not happened when observation stopped) still count in the at-risk group until their time, then leave. Median survival is the first time the curve drops to 0.5 or below. Greenwood standard errors; log-log confidence limits so the band stays inside 0 and 1.");
      const cd = card("Survival Analysis", src(`${v.t}, event ${v.e} = ${v.succ.trim()}${v.g ? ", by " + v.g : ""}, ${keep.length} rows`), html);
      const traces = [];
      fits.forEach((f, k) => { const xs = [], ys = [], lo = [], hi = []; f.km.rows.forEach((r) => { xs.push(r.time); ys.push(r.surv); lo.push(r.lower); hi.push(r.upper); }); xs.push(f.km.maxTime); ys.push(ys[ys.length - 1]); lo.push(lo[lo.length - 1]); hi.push(hi[hi.length - 1]);
        if (v.ci) traces.push({ x: xs.concat(xs.slice().reverse()), y: hi.concat(lo.slice().reverse()), fill: "toself", fillcolor: colors[k % colors.length] + "22", line: { width: 0, shape: "hv" }, hoverinfo: "skip", showlegend: false, type: "scatter" });
        traces.push({ x: xs, y: ys, mode: "lines", line: { color: colors[k % colors.length], shape: "hv", width: 2 }, name: `${f.L} (n = ${f.km.n})`, type: "scatter" });
        if (f.km.censTimes.length) { const at = f.km.censTimes.map((ct) => { const r = f.km.rows.filter((q) => q.time <= ct).pop(); return r.surv; }); traces.push({ x: f.km.censTimes, y: at, mode: "markers", marker: { symbol: "line-ns-open", color: colors[k % colors.length], size: 7 }, name: `${f.L} censored`, showlegend: false, type: "scatter" }); } });
      plotDiv(cd, traces, { title: "Kaplan-Meier survival curves (tick marks = censored)", xaxis: { title: v.t, rangemode: "tozero" }, yaxis: { title: "Proportion surviving", range: [0, 1.02] }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0.5, y1: 0.5, line: { color: "#1A3A4D", dash: "dot", width: 1 } }] }, 340);
      if (v.risk) { const maxT = Math.max(...time), raw = maxT / 6, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((c) => c >= raw), pts = []; for (let t = 0; t <= maxT; t += step) pts.push(+t.toFixed(6));
        cd.insertAdjacentHTML("beforeend", table(["Group"].concat(pts.map(String)), fits.map((f) => [f.L].concat(pts.map((t) => { const idx = group.map((g, i) => (g === f.L ? i : -1)).filter((i) => i >= 0); return idx.filter((i) => time[i] >= t).length; }))), "Number at risk over time") + table(["Group"].concat(pts.map(String)), fits.map((f) => [f.L].concat(pts.map((t) => { const r = f.km.rows.filter((q) => q.time <= t).pop(); return fmt(r.surv, 3); }))), "Estimated proportion surviving")); }
      if (levels.length > 1) { const lr = SW.logRank(time, event, group);
        cd.insertAdjacentHTML("beforeend", table(["Group", "n", "Observed events", "Expected events", "(O minus E) squared / E"], lr.groups.map((g, j) => [g, group.filter((q) => q === g).length, lr.observed[j], lr.expected[j], Math.pow(lr.observed[j] - lr.expected[j], 2) / lr.expected[j]]), "Log-rank test") + table(["chi-square", "df", "p"], [[lr.chi, lr.df, SW.fmtP(lr.p)]], "") + formula("H0: the survival curves are the same in every group. At each event time the log-rank test compares the events observed in each group with the number expected if the groups shared one hazard, then sums over all event times. It weights every event time equally (same as R's survdiff).") + say(`${decision(lr.p, +v.alpha)} ${lr.p <= +v.alpha ? "The groups have different survival curves." : "No evidence that survival differs between the groups."} Medians: ${lr.groups.map((g, j) => `${g} ${lr.medians[j] == null ? "not reached" : lr.medians[j]}`).join(", ")}.`)); }
      if (v.xs.length || v.cs.length) { const dm = designMatrix(v.xs, v.cs); let k2 = keep.filter((i) => dm.rows[i].every((q) => q !== "" && Number.isFinite(Number(q))));
        const pr = pruneEmpty(k2.map((i) => dm.rows[i].map(Number)), dm.names, k2); k2 = pr.keep;
        const m = SW.cox(k2.map((i) => Number(tv[i])), k2.map((i) => (ev[i] === v.succ.trim() ? 1 : 0)), pr.X, pr.names, conf);
        const pct = Math.round(conf * 100);
        cd.insertAdjacentHTML("beforeend", dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${pr.dropped.join(", ")} and its rows: fewer than 3 usable rows in that category.`) : "") + table(["Predictor", "Coefficient (log hazard ratio)", "SE", "z", "p", "Hazard ratio", `${pct}% CI lower`, `${pct}% CI upper`], m.names.map((nm, j) => [nm, m.b[j], m.se[j], m.z[j], SW.fmtP(m.p[j]), m.hr[j], m.hrLower[j], m.hrUpper[j]]), `Cox proportional hazards model (${m.n} rows, ${m.events} events)`) + table(["Likelihood ratio chi-square", "df", "p", "Log-likelihood (null)", "Log-likelihood (model)"], [[m.lrt, m.dfLrt, SW.fmtP(m.pLrt), m.ll0, m.ll]], "Model fit") + formula("h(t | x) = h0(t) times exp(b1 x1 + ... + bk xk). A hazard ratio of 1.5 means a 50 percent higher instantaneous risk of the event at every time, holding the other predictors fixed; below 1 means lower risk. No shape is assumed for the baseline hazard h0(t). Partial likelihood with Efron's correction for tied times (R's coxph default).") + say(m.names.map((nm, j) => `${nm}: HR ${fmt(m.hr[j], 3)} (${pct}% CI ${fmt(m.hrLower[j], 3)} to ${fmt(m.hrUpper[j], 3)}), ${m.p[j] <= +v.alpha ? "significant" : "not significant"} at alpha ${v.alpha}. ${nm.includes(" = ") ? (m.hr[j] > 1 ? `This group has a ${fmt(100 * (m.hr[j] - 1), 1)} percent higher hazard than the reference group.` : `This group has a ${fmt(100 * (1 - m.hr[j]), 1)} percent lower hazard than the reference group.`) : (m.hr[j] > 1 ? `Each one-unit increase raises the hazard by ${fmt(100 * (m.hr[j] - 1), 1)} percent.` : `Each one-unit increase lowers the hazard by ${fmt(100 * (1 - m.hr[j]), 1)} percent.`)}`).join(" ")) + warn("The model assumes proportional hazards: the curves should not cross. Check the Kaplan-Meier plot by group; crossing curves mean a hazard ratio is not a fair summary."));
        plotDiv(cd, [{ x: m.hr, y: m.names, mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: 9 }, error_x: { type: "data", symmetric: false, array: m.hrUpper.map((u, j) => u - m.hr[j]), arrayminus: m.hr.map((h, j) => h - m.hrLower[j]), color: "#3A7CA5" }, name: "HR" }], { title: `Hazard ratios with ${pct}% confidence intervals`, xaxis: { title: "hazard ratio (log scale)", type: "log" }, yaxis: { automargin: true }, shapes: [{ type: "line", y0: 0, y1: 1, yref: "paper", x0: 1, x1: 1, line: { color: "#C0392B", dash: "dash" } }], margin: { l: 160 } }, 80 + 40 * m.names.length); }
    });
  }
  function bayesUI() {
    const hasData = D.rows.length > 0;
    dialog("Advanced: Bayesian Inference (conjugate priors)", [sel("kind", "Parameter", [["prop", "a proportion p (beta prior, binomial data)"], ["mean", "a mean mu (normal prior, sigma known or estimated by s)"]], "prop"),
      sel("srcMode", "Data come from", (hasData ? [["data", "a column of the loaded data"]] : []).concat([["typed", "numbers typed below"]]), hasData ? "data" : "typed"),
      selCat("g", "Categorical column (proportion)"), { name: "succ", label: "Success level (exactly as in the data)", type: "text" }, selNum("x", "Numeric column (mean)"),
      { name: "xs", label: "Typed: successes x (proportion) or sample mean x bar (mean)", type: "number", value: 14, group: "Typed data" }, { name: "n", label: "Typed: sample size n", type: "number", value: 20, group: "Typed data" }, { name: "sigma", label: "Typed: sigma (mean only)", type: "number", value: 15, group: "Typed data" },
      { name: "a", label: "Prior: beta a (proportion) or prior mean (mean). Beta(1, 1) is flat; Beta(2, 2) leans to the middle.", type: "number", value: 1, group: "Prior" }, { name: "b", label: "Prior: beta b (proportion) or prior SD (mean). A big prior SD says you know little.", type: "number", value: 1, group: "Prior" },
      { name: "h0", label: "Compare with a value (optional): p0 or mu0", type: "text", placeholder: "0.5", group: "Prior" }, confField], (v) => {
      const conf = +v.conf, pct = Math.round(conf * 100), h0 = v.h0 && v.h0.trim() !== "" ? Number(v.h0) : null;
      let cd;
      if (v.kind === "prop") {
        let x, n, label;
        if (v.srcMode === "data") { const gv = col(v.g).filter((q) => q !== ""); if (!gv.includes(v.succ.trim())) throw new Error(`Levels of ${v.g}: ${[...new Set(gv)].join(", ")}. Type one of them.`); n = gv.length; x = gv.filter((q) => q === v.succ.trim()).length; label = `${v.g} = ${v.succ.trim()}, ${x} of ${n}`; }
        else { x = Math.round(v.xs); n = Math.round(v.n); if (!(n > 0) || x < 0 || x > n) throw new Error("Need 0 <= x <= n."); label = `${x} successes in ${n} trials`; }
        if (!(v.a > 0 && v.b > 0)) throw new Error("Beta prior parameters must be positive.");
        const r = SW.betaBinom(v.a, v.b, x, n, conf, h0);
        let html = table(["", "Mean", "SD", `${pct}% interval lower`, `${pct}% interval upper`], [[`Prior Beta(${v.a}, ${v.b})`, r.prior.mean, r.prior.sd, r.prior.lower, r.prior.upper], [`Data: p hat`, r.phat, Math.sqrt((r.phat * (1 - r.phat)) / n), "", ""], [`Posterior Beta(${r.post.a}, ${r.post.b})`, r.post.mean, r.post.sd, r.post.lower, r.post.upper]], "Prior, data, posterior for p");
        html += formula(`Posterior = prior x likelihood, rescaled. With a Beta(a, b) prior and x successes in n trials the posterior is Beta(a + x, b + n minus x): the prior acts like a + b earlier trials with a successes. Posterior mean = (a + x) / (a + b + n) = ${fmt(r.post.mean, 4)}. The ${pct}% credible interval is the middle ${pct}% of the posterior.`);
        html += say(`Given the data and the prior, there is a ${pct} percent probability that p is between ${fmt(r.post.lower, 3)} and ${fmt(r.post.upper, 3)}. That is a direct probability statement about p, which a confidence interval cannot make. ${v.a + v.b <= 2 ? "With a flat prior the posterior is driven by the data alone." : `The prior counts as ${v.a + v.b} pseudo-observations against ${n} real ones, so the posterior mean sits ${fmt(100 * (v.a + v.b) / (v.a + v.b + n), 1)} percent of the way from p hat toward the prior mean.`}`);
        if (h0 != null) html += table([`P(p > ${h0}) before the data`, `P(p > ${h0}) after the data`, `P(p < ${h0}) after the data`], [[r.priorAbove, r.postAbove, 1 - r.postAbove]], "Posterior probability") + say(`After seeing the data, the probability that p is above ${h0} is ${fmt(100 * r.postAbove, 1)} percent (it was ${fmt(100 * r.priorAbove, 1)} percent before).`);
        cd = card("Bayesian Inference: a proportion", src(label), html);
        plotDiv(cd, [{ x: r.grid, y: r.dprior, mode: "lines", name: "prior", line: { color: "#5A5A5A", dash: "dot" } }, { x: r.grid, y: r.dlik, mode: "lines", name: "likelihood (scaled)", line: { color: "#D97D54" } }, { x: r.grid, y: r.dpost, mode: "lines", name: "posterior", line: { color: "#3A7CA5", width: 3 }, fill: "tozeroy", fillcolor: "rgba(58,124,165,0.15)" }], { title: "Prior, likelihood and posterior for p", xaxis: { title: "p", range: [0, 1] }, yaxis: { title: "density" }, shapes: [{ type: "line", x0: r.post.lower, x1: r.post.lower, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }, { type: "line", x0: r.post.upper, x1: r.post.upper, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }].concat(h0 != null ? [{ type: "line", x0: h0, x1: h0, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B" } }] : []) }, 320);
      } else {
        let xbar, n, sigma, label, sigNote;
        if (v.srcMode === "data") { const xv = SW.num(col(v.x)); n = xv.length; if (n < 2) throw new Error("Need at least 2 values."); xbar = SW.mean(xv); sigma = v.sigma > 0 ? v.sigma : SW.sd(xv); sigNote = v.sigma > 0 ? `sigma = ${v.sigma} (typed)` : `sigma estimated by s = ${fmt(SW.sd(xv), 3)}`; label = `${v.x}, n = ${n}, x bar = ${fmt(xbar, 3)}, ${sigNote}`; }
        else { xbar = v.xs; n = Math.round(v.n); sigma = v.sigma; if (!(n > 0 && sigma > 0)) throw new Error("Need n > 0 and sigma > 0."); label = `x bar = ${xbar}, n = ${n}, sigma = ${sigma}`; }
        if (!(v.b > 0)) throw new Error("Prior SD must be positive.");
        const r = SW.normalNormal(v.a, v.b, xbar, sigma, n, conf, h0);
        let html = table(["", "Mean", "SD", `${pct}% interval lower`, `${pct}% interval upper`], [[`Prior Normal(${v.a}, ${v.b})`, r.prior.mean, r.prior.sd, r.prior.lower, r.prior.upper], ["Data: x bar with SE sigma / sqrt(n)", xbar, r.se, "", ""], ["Posterior", r.post.mean, r.post.sd, r.post.lower, r.post.upper]], "Prior, data, posterior for mu");
        html += formula(`Precision = 1 / variance. Posterior precision = prior precision + n / sigma squared. Posterior mean = weighted average of the prior mean and x bar, weights proportional to the precisions: the data get weight ${fmt(100 * r.post.weightData, 1)} percent here. Posterior SD = ${fmt(r.post.sd, 4)}. The ${pct}% credible interval is posterior mean plus or minus z times posterior SD.`);
        html += say(`Given the data and the prior, there is a ${pct} percent probability that mu is between ${fmt(r.post.lower, 3)} and ${fmt(r.post.upper, 3)}. ${r.post.weightData > 0.9 ? "The data dominate; the prior barely moves the answer." : "The prior pulls the estimate noticeably toward " + v.a + "; with more data its influence fades."}${v.srcMode === "data" && !(v.sigma > 0) ? " Sigma was replaced by s, so this is an approximation (the exact answer would use a t-shaped posterior)." : ""}`);
        if (h0 != null) html += table([`P(mu > ${h0}) before the data`, `P(mu > ${h0}) after the data`, `P(mu < ${h0}) after the data`], [[r.priorAbove, r.postAbove, 1 - r.postAbove]], "Posterior probability") + say(`After seeing the data, the probability that mu is above ${h0} is ${fmt(100 * r.postAbove, 1)} percent.`);
        cd = card("Bayesian Inference: a mean", src(label), html);
        plotDiv(cd, [{ x: r.grid, y: r.dprior, mode: "lines", name: "prior", line: { color: "#5A5A5A", dash: "dot" } }, { x: r.grid, y: r.dlik, mode: "lines", name: "likelihood (x bar with its SE)", line: { color: "#D97D54" } }, { x: r.grid, y: r.dpost, mode: "lines", name: "posterior", line: { color: "#3A7CA5", width: 3 }, fill: "tozeroy", fillcolor: "rgba(58,124,165,0.15)" }], { title: "Prior, likelihood and posterior for mu", xaxis: { title: "mu" }, yaxis: { title: "density" }, shapes: [{ type: "line", x0: r.post.lower, x1: r.post.lower, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }, { type: "line", x0: r.post.upper, x1: r.post.upper, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }].concat(h0 != null ? [{ type: "line", x0: h0, x1: h0, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B" } }] : []) }, 320);
      }
      cd.insertAdjacentHTML("beforeend", formula("Frequentist: a 95% confidence interval is a procedure that captures the true value in 95% of repeated samples. Bayesian: a 95% credible interval is the range holding 95% of the posterior probability for the parameter, given this data and this prior. Change the prior and rerun to see how much the conclusion depends on it; with a lot of data it barely does."));
    });
  }
  function kmeansUI() {
    needData();
    dialog("Advanced: k-means Clustering", [{ name: "vars", label: "Variables (2 or more numeric; standardized before clustering)", type: "multi", options: numCols() }, { name: "k", label: "Number of clusters k", type: "number", value: 3 }, { name: "std", label: "Standardize variables (recommended)", type: "check", value: true }, { name: "seed", label: "Random seed", type: "number", value: 1 }, { name: "elbow", label: "Elbow plot for k = 1 to 8", type: "check", value: true }, { name: "add", label: "Add the cluster labels to the data as a new column", type: "check", value: false }], (v) => {
      if (v.vars.length < 2) throw new Error("Pick at least two variables.");
      const { cols, keep } = numMatrix(v.vars); const z = v.std ? cols.map((c) => { const m = SW.mean(c), s = SW.sd(c); return c.map((x) => (x - m) / s); }) : cols; const rows = z[0].map((_, i) => z.map((c) => c[i]));
      const k = Math.max(2, Math.min(12, Math.round(v.k))); const r = SW.kmeans(rows, k, v.seed, 10);
      const centersRaw = r.centers.map((c) => c.map((val, j) => (v.std ? val * SW.sd(cols[j]) + SW.mean(cols[j]) : val)));
      let html = table(["Cluster", "Size"].concat(v.vars), r.centers.map((_, j) => ["C" + (j + 1), r.sizes[j]].concat(centersRaw[j])), "Cluster centres (original units)");
      html += table(["Total sum of squares", "Within-cluster sum of squares", "Between", "Between / Total"], [[r.tss, r.wss, r.tss - r.wss, (r.tss - r.wss) / r.tss]], "Fit");
      html += formula("k-means places k centres and assigns each row to the nearest one, then moves each centre to the mean of its rows, repeating until nothing changes. k-means++ starting points, best of 10 starts. Standardizing stops a variable with big units from dominating the distance.");
      html += say(`${fmt(100 * (r.tss - r.wss) / r.tss, 1)} percent of the variation is between clusters. Describe each cluster by its centre; a cluster is a convenient grouping, not a discovered kind, unless the elbow plot shows a clear bend at this k.`);
      const cd = card("k-means Clustering", src(`${v.vars.length} variables, k = ${k}`), html);
      if (v.elbow) { const ks = [1, 2, 3, 4, 5, 6, 7, 8], w = ks.map((kk) => (kk === 1 ? r.tss : SW.kmeans(rows, kk, v.seed, 5).wss)); plotDiv(cd, [{ x: ks, y: w, mode: "lines+markers", line: { color: "#3A7CA5" } }], { title: "Elbow plot: within-cluster sum of squares by k", xaxis: { title: "k", dtick: 1 }, yaxis: { title: "within SS" } }, 240); }
      const pc = SW.pca(cols, v.vars); const traces = r.centers.map((_, j) => { const idx = r.labels.map((l, i) => (l === j ? i : -1)).filter((i) => i >= 0); return { x: idx.map((i) => pc.scores[i][0]), y: idx.map((i) => (v.vars.length > 2 ? pc.scores[i][1] : rows[i][1])), mode: "markers", type: "scatter", name: `C${j + 1} (n = ${r.sizes[j]})`, marker: { size: 6 } }; });
      plotDiv(cd, traces, { title: v.vars.length > 2 ? "Clusters on the first two principal components" : `Clusters: ${v.vars[1]} against ${v.vars[0]} (standardized)`, xaxis: { title: v.vars.length > 2 ? "PC1" : v.vars[0] }, yaxis: { title: v.vars.length > 2 ? "PC2" : v.vars[1] } }, 340);
      if (v.add) { const labels = D.rows.map(() => ""); keep.forEach((i, s) => (labels[activeIdx()[i]] = "C" + (r.labels[s] + 1))); addColumn("cluster_k" + k, labels); }
    });
  }

  // ================= pictures of test statistics =================
  function curvePlot(cd, xs, ys, stat, alt, title) {
    const shade = (lo, hi) => ({ x: xs.filter((x) => x >= lo && x <= hi), y: ys.filter((_, i) => xs[i] >= lo && xs[i] <= hi), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false });
    const traces = [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }];
    if (alt === "less") traces.push(shade(-Infinity, stat)); else if (alt === "greater") traces.push(shade(stat, Infinity)); else { traces.push(shade(-Infinity, -Math.abs(stat))); traces.push(shade(Math.abs(stat), Infinity)); }
    plotDiv(cd, traces, { title, xaxis: { title: "test statistic" }, yaxis: { visible: false }, shapes: [{ type: "line", x0: stat, x1: stat, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", dash: "dash" } }] }, 240);
  }
  function tPlot(cd, t, df, alt) { const lim = Math.max(4, Math.abs(t) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.studentt.pdf(x, df)), t, alt, `t distribution, df = ${fmt(df, 2)}; shaded area is the p-value`); }
  function zPlot(cd, z, alt) { const lim = Math.max(4, Math.abs(z) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.normal.pdf(x, 0, 1)), z, alt, "standard normal; shaded area is the p-value"); }

  // ================= distrACTION =================
  function binomCalc() {
    dialog("distrACTION: Binomial Distribution", [{ name: "n", label: "Number of trials", type: "number", value: 10, group: "Parameters" }, { name: "p", label: "Probability of success", type: "number", value: 0.5, group: "Parameters" },
      sel("kind", "Compute probability", [["eq", "P(X = x1)"], ["le", "P(X at most x1)"], ["ge", "P(X at least x1)"], ["between", "P(x1 at most X at most x2)"]], "eq"), { name: "k", label: "x1", type: "number", value: 5 }, { name: "b", label: "x2", type: "number", value: "" }], (v) => {
      const { n, p } = v; let prob, label;
      if (!(p >= 0 && p <= 1)) throw new Error("Probability of success must be between 0 and 1: type a decimal such as 0.575, not a percent.");
      if (!(n >= 1) || n !== Math.floor(n)) throw new Error("Number of trials must be a whole number, 1 or more.");
      if (v.kind === "eq") { prob = SW.dbinom(v.k, n, p); label = `P(X = ${v.k})`; } else if (v.kind === "le") { prob = SW.pbinom(v.k, n, p); label = `P(X <= ${v.k})`; } else if (v.kind === "ge") { prob = 1 - SW.pbinom(v.k - 1, n, p); label = `P(X >= ${v.k})`; } else { prob = SW.pbinom(v.b, n, p) - SW.pbinom(v.k - 1, n, p); label = `P(${v.k} <= X <= ${v.b})`; }
      const t = SW.binomTable(n, p);
      let html = table(["Mean", "Variance", "SD"], [[n * p, n * p * (1 - p), Math.sqrt(n * p * (1 - p))]], "Parameters") + table(["Probability", "Value"], [[label, prob]], "Probability");
      html += formula("P(X = k) = C(n, k) p^k (1 minus p)^(n minus k); mean np, SD sqrt(np(1 minus p)). Conditions: binary, independent, fixed n, same p.");
      html += `<details><summary>Full table</summary>${table(["k", "P(X = k)", "P(X <= k)"], t.map((q) => [q.k, q.p, q.cum]))}</details>`;
      const cd = card("Binomial Distribution", `n = ${n}, p = ${p}`, html);
      const inRange = (k) => (v.kind === "eq" ? k === v.k : v.kind === "le" ? k <= v.k : v.kind === "ge" ? k >= v.k : k >= v.k && k <= v.b);
      plotDiv(cd, [{ x: t.map((q) => q.k), y: t.map((q) => q.p), type: "bar", marker: { color: t.map((q) => (inRange(q.k) ? "#C0392B" : "#3A7CA5")) } }], { xaxis: { title: "x", dtick: 1 }, yaxis: { title: "probability" } });
    });
  }
  function normalCalc() {
    dialog("distrACTION: Normal Distribution", [{ name: "mu", label: "Mean", type: "number", value: 0, group: "Parameters" }, { name: "sd", label: "SD", type: "number", value: 1, group: "Parameters" },
      sel("kind", "Compute", [["below", "probability: P(X at most x1)"], ["above", "probability: P(X at least x1)"], ["between", "probability: P(x1 at most X at most x2)"], ["q", "quantile: the x with cumulative probability p"]], "below"), { name: "a", label: "x1 (or p for a quantile)", type: "number", value: 1 }, { name: "b", label: "x2", type: "number", value: "" }], (v) => {
      if (!(v.sd > 0)) throw new Error("SD must be a positive number.");
      if (v.kind === "q" && !(v.a > 0 && v.a < 1)) throw new Error("For a quantile, x1 holds the cumulative probability p: type a decimal between 0 and 1 such as 0.90.");
      if (v.kind === "between" && !(v.b >= v.a)) throw new Error("x2 must be at least x1.");
      const z = (x) => (x - v.mu) / v.sd; let res, label, lo = -Infinity, hi = Infinity;
      if (v.kind === "below") { res = SW.pnorm(z(v.a)); label = `P(X <= ${v.a})`; hi = v.a; } else if (v.kind === "above") { res = 1 - SW.pnorm(z(v.a)); label = `P(X >= ${v.a})`; lo = v.a; } else if (v.kind === "between") { res = SW.pnorm(z(v.b)) - SW.pnorm(z(v.a)); label = `P(${v.a} <= X <= ${v.b})`; lo = v.a; hi = v.b; } else { res = v.mu + SW.qnorm(v.a) * v.sd; label = `x at cumulative probability ${v.a}`; hi = res; }
      let html = table(["Mean", "SD", v.kind === "q" ? "z*" : "z", label], [[v.mu, v.sd, v.kind === "q" ? SW.qnorm(v.a) : z(v.a), res]], v.kind === "q" ? "Quantile" : "Probability");
      html += formula("z = (x minus mu) / sigma. Empirical rule: 68 percent within 1 SD, 95 within 2, 99.7 within 3.");
      const cd = card("Normal Distribution", `mean ${v.mu}, SD ${v.sd}`, html);
      const xs = []; for (let x = v.mu - 4 * v.sd; x <= v.mu + 4 * v.sd; x += (8 * v.sd) / 200) xs.push(x);
      const ys = xs.map((x) => jStat.normal.pdf(x, v.mu, v.sd));
      plotDiv(cd, [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }, { x: xs.filter((x) => x >= lo && x <= hi), y: ys.filter((_, i) => xs[i] >= lo && xs[i] <= hi), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false }], { xaxis: { title: "x" }, yaxis: { visible: false } });
    });
  }
  function tCalc() {
    dialog("distrACTION: T-Distribution", [{ name: "df", label: "df", type: "number", value: 20 }, sel("kind", "Compute", [["tstar", "quantile t* for a confidence level"], ["p", "p-value for a t statistic"]], "tstar"), { name: "conf", label: "Confidence level (proportion)", type: "number", value: 0.95 }, { name: "t", label: "t statistic", type: "number", value: 2 }, sel("alt", "Tail", [["two", "two-sided"], ["greater", "upper tail"], ["less", "lower tail"]], "two")], (v) => {
      let html;
      if (v.kind === "tstar") { const ts = SW.qt(1 - (1 - v.conf) / 2, v.df); html = table(["df", "Confidence", "t*"], [[v.df, v.conf, ts]], "Quantile") + say(`Use t* in x bar plus or minus t* s / sqrt(n). For comparison z* would be ${fmt(SW.qnorm(1 - (1 - v.conf) / 2))}; t* is larger because s replaces sigma.`); }
      else { const p = SW.pvalue(v.t, v.alt, (x) => SW.pt(x, v.df)); html = table(["df", "t", "Tail", "p"], [[v.df, v.t, v.alt, SW.fmtP(p)]], "Probability"); }
      const cd = card("T-Distribution", `df = ${v.df}`, html); if (v.kind === "p") tPlot(cd, v.t, v.df, v.alt);
    });
  }
  function chiFCalc() {
    dialog("distrACTION: Chi-square and F Distributions", [sel("dist", "Distribution", [["chi", "Chi-square"], ["F", "F"]], "chi"), { name: "df1", label: "df (or df1 for F)", type: "number", value: 3 }, { name: "df2", label: "df2 (F only)", type: "number", value: 36 }, sel("kind", "Compute", [["p", "p-value (upper tail) for a statistic"], ["q", "critical value for alpha"]], "p"), { name: "x", label: "Statistic (or alpha)", type: "number", value: 5.2 }], (v) => {
      let html; const chi = v.dist === "chi";
      if (v.kind === "p") { const p = chi ? 1 - SW.pchisq(v.x, v.df1) : 1 - SW.pf(v.x, v.df1, v.df2); html = table([chi ? "chi-square" : "F", chi ? "df" : "df1, df2", "p (upper tail)"], [[v.x, chi ? v.df1 : `${v.df1}, ${v.df2}`, SW.fmtP(p)]], "Probability"); }
      else { const q = chi ? SW.qchisq(1 - v.x, v.df1) : SW.qf(1 - v.x, v.df1, v.df2); html = table(["alpha", chi ? "df" : "df1, df2", "critical value"], [[v.x, chi ? v.df1 : `${v.df1}, ${v.df2}`, q]], "Quantile") + say("This course decides with the p-value; the critical value is here only for checking a table."); }
      const cd = card(chi ? "Chi-square Distribution" : "F Distribution", "", html);
      const xs = [], lim = chi ? Math.max(v.x * 1.5, v.df1 * 3, 5) : Math.max(v.x * 1.5, 5); for (let x = 0.01; x <= lim; x += lim / 200) xs.push(x);
      const ys = xs.map((x) => (chi ? jStat.chisquare.pdf(x, v.df1) : jStat.centralF.pdf(x, v.df1, v.df2)));
      if (v.kind === "p") plotDiv(cd, [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }, { x: xs.filter((x) => x >= v.x), y: ys.filter((_, i) => xs[i] >= v.x), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false }], { xaxis: { title: "statistic" }, yaxis: { visible: false } }, 240);
    });
  }
  function sampleSizeCalc() {
    dialog("Sample size for a margin of error", [sel("kind", "For a", [["prop", "proportion"], ["mean", "mean"]], "prop"), { name: "me", label: "Desired margin of error", type: "number", value: 0.05 }, { name: "p", label: "Guess for p (0.5 if unknown)", type: "number", value: 0.5 }, { name: "s", label: "Guess for s (for a mean)", type: "number", value: "" }, confField], (v) => {
      const n = v.kind === "prop" ? SW.sampleSizeProp(v.me, v.p, +v.conf) : SW.sampleSizeMean(v.me, v.s, +v.conf);
      card("Sample size", `${v.kind === "prop" ? "proportion" : "mean"}, margin ${v.me}, ${Math.round(+v.conf * 100)} percent`, table(["Needed N"], [[n]]) + formula(v.kind === "prop" ? "N = (z* / m)^2 p (1 minus p), rounded up" : "N = (z* s / m)^2, rounded up (z* as a planning value)") + say("Halving the margin needs four times the sample."));
    });
  }

  // ================= Learn: sampling distribution simulator =================
  function samplingSim() {
    const hasData = D.rows.length > 0;
    dialog("Learn: Sampling distribution simulator", [
      sel("pop", "Population", (hasData ? [["col", "a column in the data (treated as the population)"]] : []).concat([["normal", "normal, mean 50, SD 10"], ["skew", "right-skewed (exponential, mean 8)"], ["uniform", "uniform 0 to 100"], ["prop", "yes or no, with a given p"]]), hasData ? "col" : "skew"),
      hasData ? selAny("x", "Column (numeric for means, categorical for proportions)", false) : null, hasData ? { name: "succ", label: "Success level (for a proportion)", type: "text" } : null,
      { name: "p", label: "p for the yes or no population", type: "number", value: 0.3 },
      { name: "n", label: "Sample size n", type: "number", value: 30 }, { name: "reps", label: "Number of samples", type: "number", value: 2000 }, sel("stat", "Statistic", [["mean", "sample mean"], ["prop", "sample proportion"], ["median", "sample median"]], "mean")], (v) => {
      let pop, popLabel;
      if (v.pop === "col") { if (v.stat === "prop") { const vals = col(v.x).filter((q) => q !== ""); pop = vals.map((q) => (q === v.succ ? 1 : 0)); popLabel = `${v.x} = ${v.succ} (p = ${fmt(SW.mean(pop), 3)})`; } else { pop = SW.num(col(v.x)); popLabel = v.x; } }
      else if (v.pop === "normal") { pop = Array.from({ length: 20000 }, () => SW.rnorm(50, 10)); popLabel = "normal(50, 10)"; }
      else if (v.pop === "skew") { pop = Array.from({ length: 20000 }, () => SW.rexp(1 / 8)); popLabel = "right-skewed, mean 8"; }
      else if (v.pop === "uniform") { pop = Array.from({ length: 20000 }, () => Math.random() * 100); popLabel = "uniform(0, 100)"; }
      else { pop = Array.from({ length: 20000 }, () => (Math.random() < v.p ? 1 : 0)); popLabel = `yes or no, p = ${v.p}`; }
      const statFn = v.stat === "median" ? SW.median : SW.mean;
      const stats = SW.simulate(pop, v.n, Math.min(v.reps, 20000), statFn);
      const pm = SW.mean(pop), ps = Math.sqrt(pop.reduce((s, x) => s + (x - pm) ** 2, 0) / pop.length), sm = SW.mean(stats), ss = SW.sd(stats);
      const theory = v.stat === "prop" ? Math.sqrt((pm * (1 - pm)) / v.n) : ps / Math.sqrt(v.n);
      let html = table(["", "Mean", "SD"], [["Population", pm, ps], [`${stats.length} sample ${v.stat}s (n = ${v.n})`, sm, ss], ["Theory for the sampling distribution", pm, theory]], "Population against sampling distribution");
      html += formula(v.stat === "prop" ? "SD of p hat = sqrt(p (1 minus p) / n)" : "SD of x bar = sigma / sqrt(n); the standard error");
      html += say(`The sampling distribution is centred at the population value and is narrower by a factor of sqrt(n) = ${fmt(Math.sqrt(v.n), 2)}. ${v.n >= 30 ? "With n at least 30 it looks roughly normal even when the population does not (the Central Limit Theorem)." : "With n under 30 the shape still shows some of the population's skew."} Standard deviation describes individuals; standard error describes the statistic.`);
      const cd = card("Sampling distribution simulator", popLabel, html);
      if (v.stat !== "prop") plotDiv(cd, [{ x: pop.slice(0, 5000), type: "histogram", name: "population", marker: { color: "#3A7CA5" } }], { title: "Population", xaxis: { title: "value" }, yaxis: { title: "Count" } }, 240);
      plotDiv(cd, [{ x: stats, type: "histogram", name: "sample statistics", marker: { color: "#D97D54", line: { color: "#fff", width: 1 } } }], { title: `Sampling distribution of the ${v.stat}, n = ${v.n}`, xaxis: { title: v.stat }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: pm, x1: pm, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }] }, 260);
    });
  }

  // ================= Learn: coin flips and the law of large numbers =================
  function llnUI() {
    dialog("Learn: Coin flips and the law of large numbers", [
      sel("exp", "Chance experiment", [["coin", "flip one fair coin, count heads (p = 0.5)"], ["coin2", "flip two coins, count both heads (p = 0.25)"], ["coin3", "flip three coins, count all three heads (p = 0.125)"], ["die", "roll one die, count sixes (p = 1/6)"], ["dice2", "roll two dice, count sums of 7 (p = 6/36)"], ["custom", "a yes or no event with a probability I choose"]], "coin"),
      { name: "p", label: "Probability for the custom event", type: "number", value: 0.3 },
      { name: "n", label: "Number of trials", type: "number", value: 500 },
      { name: "drift", label: "Also show how far the count drifts from the expected count", type: "check", value: true }], (v) => {
      const P = { coin: 0.5, coin2: 0.25, coin3: 0.125, die: 1 / 6, dice2: 6 / 36, custom: v.p }[v.exp];
      const LAB = { coin: "heads", coin2: "two heads", coin3: "three heads", die: "a six", dice2: "a sum of 7", custom: "the event" }[v.exp];
      const NAME = { coin: "one fair coin", coin2: "two fair coins", coin3: "three fair coins", die: "one fair die", dice2: "two fair dice", custom: `a yes or no event with p = ${fmt(P, 4)}` }[v.exp];
      if (!(P > 0 && P < 1)) throw new Error("The probability must be between 0 and 1.");
      const n = Math.max(1, Math.min(Math.round(v.n), 100000));
      const hit = new Array(n), runProp = new Array(n), drift = new Array(n), idx = new Array(n);
      let count = 0;
      for (let i = 0; i < n; i++) { hit[i] = Math.random() < P ? 1 : 0; count += hit[i]; idx[i] = i + 1; runProp[i] = count / (i + 1); drift[i] = count - (i + 1) * P; }
      const marks = [10, 25, 50, 100, 250, 500, 1000, 5000, n].filter((m, i, a) => m <= n && a.indexOf(m) === i).sort((a, b) => a - b);
      const rows = marks.map((m) => { const c = hit.slice(0, m).reduce((s, x) => s + x, 0); return [m, c, m * P, c / m, c / m - P, c - m * P]; });
      let html = table(["Trials", `${LAB} so far`, "Expected count", "Proportion so far", "Proportion minus p", "Count minus expected"], rows, `Flipping ${NAME}, true probability p = ${fmt(P, 4)}`);
      html += formula("proportion after k trials = (number of successes) / k, and it settles toward p as k grows");
      const first = hit.slice(0, 50).map((h) => (h ? "Y" : "n")).join(" ");
      html += say(`The first ${Math.min(50, n)} trials, Y for ${LAB}: <span style="font-family:ui-monospace,Consolas,monospace">${first}</span>`);
      const last = rows[rows.length - 1];
      html += say(`After ${n} trials the proportion is ${fmt(last[3], 4)} against a true p of ${fmt(P, 4)}, a gap of ${fmt(Math.abs(last[4]), 4)}. Early on the proportion swings widely; the more trials you run the harder it is to stay far from p. That is the law of large numbers, and notice what it does and does not promise: it is about the <em>proportion</em>, not about the count.`);
      if (v.drift) html += warn(`The count is a different story. After ${n} trials the count of ${LAB} is off the expected count by ${fmt(Math.abs(last[5]), 2)}, and that gap tends to grow, not shrink. So "p is 0.5, therefore 5 of the next 10 will be heads" is wrong, and so is "tails is due after a run of heads." Nothing keeps a running tally and corrects it. The proportion settles because the early swings get diluted by the later trials, not because the coin compensates.`);
      const cd = card("Coin flips and the law of large numbers", `${NAME}, ${n} trials`, html);
      plotDiv(cd, [{ x: idx, y: runProp, type: "scatter", mode: "lines", name: "proportion so far", line: { color: "#3A7CA5", width: 1.5 } }], { title: `Running proportion of ${LAB}`, xaxis: { title: "number of trials" }, yaxis: { title: "proportion so far", range: [Math.max(0, Math.min(...runProp.slice(Math.min(9, n - 1))) - 0.12), Math.min(1, Math.max(...runProp.slice(Math.min(9, n - 1))) + 0.12)] }, shapes: [{ type: "line", x0: 1, x1: n, y0: P, y1: P, line: { color: "#1A3A4D", dash: "dash" } }], annotations: [{ x: n, y: P, xanchor: "right", yanchor: "bottom", text: `p = ${fmt(P, 4)}`, showarrow: false, font: { color: "#1A3A4D" } }] }, 280);
      if (v.drift) plotDiv(cd, [{ x: idx, y: drift, type: "scatter", mode: "lines", name: "count minus expected", line: { color: "#D97D54", width: 1.5 } }], { title: "How far the count sits from the expected count", xaxis: { title: "number of trials" }, yaxis: { title: "count minus expected count" }, shapes: [{ type: "line", x0: 1, x1: n, y0: 0, y1: 0, line: { color: "#1A3A4D", dash: "dash" } }] }, 240);
    });
  }

  // ================= Learn: the Central Limit Theorem =================
  function cltUI() {
    const hasData = D.rows.length > 0;
    dialog("Learn: The Central Limit Theorem", [
      sel("pop", "Population", (hasData ? [["col", "a column in the data (treated as the population)"]] : []).concat([["skew", "right-skewed (exponential, mean 8)"], ["normal", "normal, mean 50, SD 10"], ["uniform", "uniform 0 to 100"], ["bimodal", "two humps, a mixture of 30 and 70"], ["prop", "yes or no, with a given p"]]), hasData ? "col" : "skew"),
      hasData ? selNum("x", "Column (used as the population)") : null,
      { name: "p", label: "p for the yes or no population", type: "number", value: 0.3 },
      { name: "ns", label: "Sample sizes to compare", type: "text", value: "1, 5, 30, 100" },
      { name: "reps", label: "Samples drawn at each size", type: "number", value: 2000 }], (v) => {
      let pop, popLabel;
      if (v.pop === "col") { pop = SW.num(col(v.x)); popLabel = `${v.x}, treated as the population`; }
      else if (v.pop === "normal") { pop = Array.from({ length: 20000 }, () => SW.rnorm(50, 10)); popLabel = "normal(50, 10)"; }
      else if (v.pop === "skew") { pop = Array.from({ length: 20000 }, () => SW.rexp(1 / 8)); popLabel = "right-skewed, mean 8"; }
      else if (v.pop === "uniform") { pop = Array.from({ length: 20000 }, () => Math.random() * 100); popLabel = "uniform(0, 100)"; }
      else if (v.pop === "bimodal") { pop = Array.from({ length: 20000 }, () => SW.rnorm(Math.random() < 0.5 ? 30 : 70, 6)); popLabel = "two humps at 30 and 70"; }
      else { pop = Array.from({ length: 20000 }, () => (Math.random() < v.p ? 1 : 0)); popLabel = `yes or no, p = ${fmt(v.p, 3)}`; }
      if (pop.length < 2) throw new Error("That population has fewer than two values.");
      const ns = String(v.ns).split(",").map((s) => Math.round(Number(s))).filter((x) => Number.isFinite(x) && x >= 1).slice(0, 5);
      if (!ns.length) throw new Error("Give at least one sample size, for example 1, 5, 30, 100.");
      const reps = Math.max(200, Math.min(Math.round(v.reps), 20000));
      const pm = SW.mean(pop), ps = Math.sqrt(pop.reduce((s, x) => s + (x - pm) ** 2, 0) / pop.length);
      const COLORS = ["#C2C2C2", "#8FB8D0", "#3A7CA5", "#D97D54", "#8E6BA8"];
      const traces = [], rows = [];
      ns.forEach((n, i) => {
        const means = SW.simulate(pop, n, reps, SW.mean);
        rows.push([n, SW.mean(means), SW.sd(means), ps / Math.sqrt(n), SW.skewness(means).skew]);
        traces.push({ x: means, type: "histogram", name: `n = ${n}`, opacity: 0.6, histnorm: "probability density", marker: { color: COLORS[i % COLORS.length] } });
      });
      let html = table(["Population mean", "Population SD"], [[pm, ps]], `Population: ${popLabel}`);
      html += table(["n", `Mean of the ${reps} sample means`, "SD of those sample means", "Theory: sigma / sqrt(n)", "Skewness of the sample means"], rows, "What changes as n grows");
      html += formula("mean of x bar = mu, and SD of x bar = sigma / sqrt(n), called the standard error");
      const sk0 = Math.abs(rows[0][4]), skL = Math.abs(rows[rows.length - 1][4]);
      html += say(`Two things happen at once and students usually only see one of them. The center never moves: every row has a mean of about ${fmt(pm, 3)}, the population mean. The spread shrinks, and it shrinks by sqrt(n), not by n, which is why going from n = 25 to n = 100 only halves the standard error. ${ns.includes(1) ? "The n = 1 curve is the population itself, so compare it with the others to see the shape change." : ""}`);
      html += say(`The shape is the Central Limit Theorem proper. Skewness of the sample means falls from ${fmt(sk0, 3)} at n = ${ns[0]} to ${fmt(skL, 3)} at n = ${ns[ns.length - 1]}. ${skL < 0.5 ? "By the largest n the sampling distribution is close to normal even though the population is not." : "Even at the largest n here some skew remains, which is what a badly skewed population or a small n does to the approximation."} The usual n at least 30 is a rule of thumb, not a law: a heavily skewed population needs more, a nearly normal one needs less.`);
      const cd = card("The Central Limit Theorem", `${popLabel}, n = ${ns.join(", ")}`, html);
      if (v.pop !== "prop") plotDiv(cd, [{ x: pop.slice(0, 5000), type: "histogram", name: "population", marker: { color: "#3A7CA5" } }], { title: "The population, which need not be normal", xaxis: { title: "value" }, yaxis: { title: "Count" } }, 230);
      plotDiv(cd, traces, { barmode: "overlay", title: "Sampling distribution of the sample mean at each n", xaxis: { title: "sample mean" }, yaxis: { title: "density" }, shapes: [{ type: "line", x0: pm, x1: pm, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }] }, 300);
    });
  }

  // ================= Learn: what a confidence interval means =================
  function ciDemoUI() {
    dialog("Learn: What a confidence interval means", [
      sel("kind", "Parameter", [["mean", "a mean (t interval, sigma is not given)"], ["prop", "a proportion (z interval)"]], "mean"),
      { name: "mu", label: "True population mean", type: "number", value: 100, group: "The population, which only you can see" },
      { name: "sigma", label: "True population SD", type: "number", value: 15, group: "The population, which only you can see" },
      { name: "p", label: "True population proportion", type: "number", value: 0.4, group: "The population, which only you can see" },
      { name: "n", label: "Sample size n", type: "number", value: 25 },
      confField,
      { name: "reps", label: "How many samples, each giving one interval", type: "number", value: 100 }], (v) => {
      const conf = Number(v.conf), reps = Math.max(20, Math.min(Math.round(v.reps), 2000)), n = Math.max(2, Math.round(v.n));
      const isMean = v.kind === "mean";
      const truth = isMean ? v.mu : v.p;
      if (!isMean && !(v.p > 0 && v.p < 1)) throw new Error("The true proportion must be between 0 and 1.");
      if (isMean && !(v.sigma > 0)) throw new Error("The true population SD must be above 0.");
      const lo = [], hi = [], mid = [], caught = [];
      for (let r = 0; r < reps; r++) {
        let c, me;
        if (isMean) {
          const s = Array.from({ length: n }, () => SW.rnorm(v.mu, v.sigma));
          c = SW.mean(s); me = SW.qt(1 - (1 - conf) / 2, n - 1) * (SW.sd(s) / Math.sqrt(n));
        } else {
          let x = 0; for (let i = 0; i < n; i++) if (Math.random() < v.p) x++;
          c = x / n; me = SW.qnorm(1 - (1 - conf) / 2) * Math.sqrt((c * (1 - c)) / n);
        }
        mid.push(c); lo.push(c - me); hi.push(c + me); caught.push(c - me <= truth && truth <= c + me);
      }
      const hits = caught.filter(Boolean).length;
      let html = table(["Confidence level", "Intervals built", "Intervals containing the truth", "Actual capture rate"], [[conf, reps, hits, hits / reps]], isMean ? `True mean ${fmt(truth)}, n = ${n}, t interval with ${n - 1} degrees of freedom` : `True proportion ${fmt(truth)}, n = ${n}, z interval`);
      html += formula(isMean ? "x bar plus or minus t* s / sqrt(n), with df = n - 1; sigma is not given, so t, not z" : "p hat plus or minus z* sqrt(p hat (1 - p hat) / n)");
      html += say(`Each sample gives a different interval. ${hits} of the ${reps} intervals cover the true value of ${fmt(truth)}, a capture rate of ${fmt((100 * hits) / reps, 1)} percent against the ${fmt(100 * conf, 0)} percent claimed. Run it again and that number moves around; the claim is about the long run, not about any one run.`);
      html += say(`This is the sentence to take away. The truth is a fixed number and it never moves: it is the vertical line, in the same place on every row. What moves is the interval. So ${fmt(100 * conf, 0)} percent confidence means that <em>the method</em> catches the truth ${fmt(100 * conf, 0)} percent of the time, not that any particular interval has a ${fmt(100 * conf, 0)} percent chance of containing it. Once your interval is computed it either contains the truth or it does not, and you cannot tell which.`);
      if (isMean && n < 30) html += warn(`With n = ${n} this demo samples from a normal population, so the t interval is exact. With a skewed population and an n this small the capture rate would fall below the stated level, which is the real reason the conditions matter.`);
      if (!isMean && (n * truth < 10 || n * (1 - truth) < 10)) html += warn(`n p = ${fmt(n * truth, 1)} and n (1 - p) = ${fmt(n * (1 - truth), 1)}. At least one is under 10, so the normal approximation is shaky here and the capture rate will sit below the stated level. That is the condition doing its job.`);
      const cd = card("What a confidence interval means", `${fmt(100 * conf, 0)} percent, ${reps} samples of n = ${n}`, html);
      const show = Math.min(reps, 120);
      const mk = (want, color, nm) => { const ix = []; const x = [], ey = []; for (let i = 0; i < show; i++) if (caught[i] === want) { ix.push(i + 1); x.push(mid[i]); ey.push(hi[i] - mid[i]); } return { x, y: ix, type: "scatter", mode: "markers", name: nm, marker: { color, size: 5 }, error_x: { type: "data", array: ey, color, thickness: 1.4, width: 0 } }; };
      plotDiv(cd, [mk(true, "#3A7CA5", "contains the truth"), mk(false, "#C4453B", "misses")], { title: `The first ${show} intervals; the truth never moves`, xaxis: { title: isMean ? "interval for the mean" : "interval for the proportion" }, yaxis: { title: "sample number", autorange: "reversed" }, shapes: [{ type: "line", x0: truth, x1: truth, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } }] }, 420);
    });
  }

  // ================= Learn: what a p-value is =================
  function pvalDemoUI() {
    dialog("Learn: What a p-value is", [
      sel("kind", "Situation", [["prop", "a proportion: H0 says p equals p0"], ["mean", "a mean: H0 says mu equals mu0"]], "prop"),
      { name: "p0", label: "p0, the value H0 claims", type: "number", value: 0.5, group: "If H0 were true" },
      { name: "mu0", label: "mu0, the value H0 claims", type: "number", value: 100, group: "If H0 were true" },
      { name: "sigma", label: "Population SD to simulate with", type: "number", value: 15, group: "If H0 were true" },
      { name: "n", label: "Sample size n", type: "number", value: 40, group: "What you actually saw" },
      { name: "x", label: "Successes observed (for a proportion)", type: "number", value: 26, group: "What you actually saw" },
      { name: "xbar", label: "Sample mean observed (for a mean)", type: "number", value: 105, group: "What you actually saw" },
      sel("alt", "Alternative", [["two", "not equal to the claim (two sided)"], ["greater", "greater than the claim"], ["less", "less than the claim"]], "two"),
      { name: "reps", label: "Samples simulated under H0", type: "number", value: 5000 },
      alphaField], (v) => {
      const isProp = v.kind === "prop", reps = Math.max(500, Math.min(Math.round(v.reps), 50000)), n = Math.max(2, Math.round(v.n)), alpha = Number(v.alpha);
      const claim = isProp ? v.p0 : v.mu0;
      if (isProp && !(v.p0 > 0 && v.p0 < 1)) throw new Error("p0 must be between 0 and 1.");
      const obs = isProp ? v.x / n : v.xbar;
      if (isProp && (v.x < 0 || v.x > n)) throw new Error("The number of successes must be between 0 and n.");
      const stats = new Array(reps);
      for (let r = 0; r < reps; r++) {
        if (isProp) { let c = 0; for (let i = 0; i < n; i++) if (Math.random() < v.p0) c++; stats[r] = c / n; }
        else { let s = 0; for (let i = 0; i < n; i++) s += SW.rnorm(v.mu0, v.sigma); stats[r] = s / n; }
      }
      const dObs = Math.abs(obs - claim);
      const extreme = stats.filter((s) => (v.alt === "two" ? Math.abs(s - claim) >= dObs - 1e-12 : v.alt === "greater" ? s >= obs - 1e-12 : s <= obs + 1e-12)).length;
      const pSim = extreme / reps;
      let pTheory, pExact = null, statLabel, se;
      if (isProp) {
        se = Math.sqrt((v.p0 * (1 - v.p0)) / n); const z = (obs - v.p0) / se; pTheory = SW.pvalue(z, v.alt, SW.pnorm); statLabel = `z = ${fmt(z)}`;
        const xObs = Math.round(v.x), hiTail = (k) => { let s = 0; for (let i = k; i <= n; i++) s += SW.dbinom(i, n, v.p0); return Math.min(1, s); }, loTail = (k) => { let s = 0; for (let i = 0; i <= k; i++) s += SW.dbinom(i, n, v.p0); return Math.min(1, s); };
        if (v.alt === "greater") pExact = hiTail(xObs);
        else if (v.alt === "less") pExact = loTail(xObs);
        else { const d = Math.abs(xObs - n * v.p0); pExact = Math.min(1, loTail(Math.floor(n * v.p0 - d + 1e-9)) + hiTail(Math.ceil(n * v.p0 + d - 1e-9))); }
      } else { se = v.sigma / Math.sqrt(n); const z = (obs - v.mu0) / se; pTheory = SW.pvalue(z, v.alt, SW.pnorm); statLabel = `z = ${fmt(z)}, using the sigma this simulation was given`; }
      const headers = ["H0 claims", "What you observed", "Samples simulated under H0", "As extreme or more", "Simulated p"].concat(isProp ? ["Exact binomial p", "z formula p"] : ["z formula p"]);
      const row = [claim, obs, reps, extreme, pSim].concat(isProp ? [pExact, pTheory] : [pTheory]);
      let html = table(headers, [row], isProp ? `${Math.round(v.x)} successes in ${n} trials, p hat = ${fmt(obs, 4)}` : `x bar = ${fmt(obs, 4)} from n = ${n}`);
      html += formula("p-value = P(a result at least this extreme | H0 is true)");
      html += say(`Read the simulation out loud and the definition stops being abstract. We forced H0 to be true, drew ${reps} fresh samples from that world, and ${extreme} of them landed at least as far from ${fmt(claim)} as your ${fmt(obs, 4)} did. That fraction, ${fmt(pSim, 4)}, is the p-value. Here ${statLabel}.`);
      const best = isProp ? pExact : pTheory;
      if (isProp) {
        const gap = Math.abs(pSim - pTheory), gapE = Math.abs(pSim - pExact);
        html += say(`Three numbers, and they are not the same thing. The simulation gives ${fmt(pSim, 4)}. The exact binomial gives ${fmt(pExact, 4)}, and the simulation is estimating exactly that number, so the two sit within ${fmt(gapE, 4)} of each other and would close further with more samples. The z formula gives ${fmt(pTheory, 4)}.`);
        if (gap > 0.01) html += warn(`The z formula is off by ${fmt(gap, 4)} here, and that is not simulation noise. Counts come in whole numbers, so the true distribution is a staircase, while z treats it as a smooth curve. With n = ${n} the steps are still wide enough to matter. The exact binomial is the trustworthy number; z is the hand calculation that gets close and gets closer as n grows. Report the exact one when they disagree, and use this as the reason the textbook keeps insisting on n p and n (1 - p) at least 10. Here n p0 = ${fmt(n * v.p0, 1)} and n (1 - p0) = ${fmt(n * (1 - v.p0), 1)}.`);
        else html += say(`Here the z formula sits within ${fmt(gap, 4)} of the simulation, so the normal approximation is doing its job at this n.`);
      }
      html += say(decision(best, alpha));
      html += warn(`What the p-value is not. It is not the probability that H0 is true, and it is not the probability you made a mistake. It is computed <em>assuming</em> H0 is true, so it can say nothing about how likely that assumption is. A small p says the data would be surprising in that world. It does not say the effect is large or that it matters: with a big enough n a trivial difference produces a tiny p.`);
      const cd = card("What a p-value is", `${reps} samples drawn with H0 true`, html);
      const cut = v.alt === "two" ? [claim - dObs, claim + dObs] : v.alt === "greater" ? [obs] : [obs];
      const inTail = stats.filter((s) => (v.alt === "two" ? Math.abs(s - claim) >= dObs - 1e-12 : v.alt === "greater" ? s >= obs - 1e-12 : s <= obs + 1e-12));
      const inBody = stats.filter((s) => !(v.alt === "two" ? Math.abs(s - claim) >= dObs - 1e-12 : v.alt === "greater" ? s >= obs - 1e-12 : s <= obs + 1e-12));
      plotDiv(cd, [
        { x: inBody, type: "histogram", name: "not that extreme", marker: { color: "#8FB8D0" }, nbinsx: 60 },
        { x: inTail, type: "histogram", name: "as extreme or more", marker: { color: "#C4453B" }, nbinsx: 60 }], {
        barmode: "overlay", title: `What H0 predicts, and where your result fell`, xaxis: { title: isProp ? "sample proportion if H0 were true" : "sample mean if H0 were true" }, yaxis: { title: "Count" },
        shapes: cut.map((c) => ({ type: "line", x0: c, x1: c, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash" } })),
        annotations: [{ x: obs, y: 1, yref: "paper", yanchor: "bottom", text: `you saw ${fmt(obs, 4)}`, showarrow: false, font: { color: "#1A3A4D" } }]
      }, 300);
    });
  }

  // ================= Data menu =================
  function openFile() { $("#fileInput").click(); }
  $("#fileInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => loadTable(f.name.replace(/\.[^.]+$/, ""), parseCSV(t))); e.target.value = ""; });
  function pasteData() { dialog("Paste data", [{ name: "txt", label: "Paste from a spreadsheet or CSV (first row = column names)", type: "textarea", rows: 10 }, { name: "nm", label: "Name", type: "text", value: "pasted" }], (v) => { const rows = parseCSV(v.txt); if (rows.length < 2) throw new Error("Need a header row and at least one data row."); loadTable(v.nm || "pasted", rows); }, "Load"); }
  function sampleData() { dialog("Sample datasets", [sel("f", "Dataset", SAMPLES)], (v) => fetch("data/" + v.f).then((r) => r.text()).then((t) => loadTable(v.f.replace(/\.csv$/, ""), parseCSV(t))).catch(() => alert("Could not load the sample file.")), "Open"); }
  function newBlank() { dialog("New data table", [{ name: "cols", label: "Column names, comma separated", type: "text", value: "x, y" }, { name: "n", label: "Rows", type: "number", value: 20 }], (v) => { const cols = v.cols.split(",").map((s) => s.trim()).filter(Boolean); loadTable("new", [cols].concat(Array.from({ length: v.n }, () => cols.map(() => "")))); }, "Create"); }
  function computeUI() {
    needData();
    dialog("Data: Compute a new variable", [{ name: "nm", label: "New variable name", type: "text", value: "new_var" }, { name: "f", label: "Formula", type: "text", placeholder: "Hours_Study * 7", hint: "Use column names as written. Functions: log, sqrt, abs, exp, round, pow; and mean(X), sd(X), median(X), min(X), max(X), sum(X), n(X) for whole columns. Example z-score: (GPA - mean(GPA)) / sd(GPA)" }], (v) => {
      const f = SW.compileFormula(v.f, D.cols, (c) => D.rows.map((r) => r[D.cols.indexOf(c)]));
      addColumn(v.nm.trim().replace(/\s+/g, "_"), D.rows.map((r) => { try { const y = f(r); return typeof y === "number" ? y : y == null ? "" : String(y); } catch (e) { return ""; } }));
      card("Computed variable", `${v.nm} = ${v.f}`, say("The new column is in the data table. Edit or delete it from the Data menu."));
    }, "Compute");
  }
  function transformUI() {
    needData();
    dialog("Data: Transform (recode) a variable", [sel("x", "Source variable", D.cols), { name: "nm", label: "New variable name", type: "text", value: "recoded" }, { name: "rules", label: "Rules, one per line:  old value = new value  (numeric ranges: 0 to 29 = short)", type: "textarea", rows: 6, placeholder: "Full-time = Employed\nPart-time = Employed\nNot employed = Not employed" }, { name: "else", label: "Everything else becomes (blank keeps the original)", type: "text", value: "" }], (v) => {
      const rules = v.rules.split("\n").map((l) => l.split("=")).filter((p) => p.length === 2).map(([a, b]) => { const m = a.trim().match(/^(-?[\d.]+)\s+to\s+(-?[\d.]+)$/); return m ? { lo: +m[1], hi: +m[2], to: b.trim() } : { eq: a.trim(), to: b.trim() }; });
      const vals = D.rows.map((r) => r[D.cols.indexOf(v.x)]).map((q) => { for (const ru of rules) { if (ru.eq != null && q === ru.eq) return ru.to; if (ru.lo != null && q !== "" && Number(q) >= ru.lo && Number(q) <= ru.hi) return ru.to; } return v.else.trim() ? v.else.trim() : q; });
      addColumn(v.nm.trim().replace(/\s+/g, "_"), vals);
      card("Transformed variable", `${v.nm} from ${v.x}`, table(["Level", "Count"], Object.entries(SW.counts(vals)).map(([k, n]) => [k, n])));
    }, "Transform");
  }
  function zscoreColumn() { needData(); dialog("Data: Add a z-score column", [selNum("x", "Variable")], (v) => { addColumn("z_" + v.x, SW.zscores(col(v.x).length === D.rows.length ? D.rows.map((r) => r[D.cols.indexOf(v.x)]) : D.rows.map((r) => r[D.cols.indexOf(v.x)]))); card("New column", `z_${v.x} added`, formula("z = (x minus x bar) / s")); }, "Add"); }
  function columnUI() {
    needData();
    dialog("Data: Rename or delete a column", [sel("x", "Column", D.cols), sel("act", "Action", [["rename", "rename"], ["delete", "delete"]], "rename"), { name: "nm", label: "New name (for rename)", type: "text" }], (v) => {
      const j = D.cols.indexOf(v.x);
      if (v.act === "delete") { D.cols.splice(j, 1); D.rows.forEach((r) => r.splice(j, 1)); } else { if (!v.nm.trim()) throw new Error("Give a new name."); D.cols[j] = v.nm.trim(); }
      inferTypes(); renderGrid(); persist();
    }, "Apply");
  }
  function typeUI() {
    needData();
    dialog("Data: Set a variable's type", [sel("x", "Column", D.cols), sel("t", "Type", [["continuous", "Continuous (ruler)"], ["ordinal", "Ordinal"], ["nominal", "Nominal (three circles)"], ["id", "ID"]], "nominal")], (v) => { D.manual[v.x] = v.t; inferTypes(); renderGrid(); persist(); }, "Set");
  }
  function filterUI() {
    needData();
    dialog("Data: Filter", [{ name: "f", label: "Keep rows where", type: "text", value: D.filter, placeholder: 'Year == "Freshman" AND Commute_Minutes < 30', hint: "Use column names as written; text in quotes; operators == != < <= > >= AND OR. Blank removes the filter. Every analysis uses only the kept rows." }], (v) => { D.filter = v.f.trim(); if (D.filter) activeIdx(); renderGrid(); persist(); card("Filter", D.filter || "removed", say(D.filter ? `Analyses now use the ${activeIdx().length} rows that satisfy: ${esc(D.filter)}. Greyed rows in the table are excluded.` : "All rows are back in use.")); }, "Apply");
  }
  function saveSession() { const payload = { name: D.name, cols: D.cols, rows: D.rows, filter: D.filter, results: $("#out").innerHTML, graphs: $("#outG").innerHTML, saved: new Date().toISOString() }; downloadText(JSON.stringify(payload), (D.name || "session") + ".sww.json", "application/json"); }
  function loadSession() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json";
    inp.onchange = () => { inp.files[0].text().then((t) => { const s = JSON.parse(t); D.name = s.name; D.cols = s.cols; D.rows = s.rows; D.filter = s.filter || ""; inferTypes(); renderGrid(); persist(); $("#out").innerHTML = s.results || ""; $("#outG").innerHTML = s.graphs || ""; document.querySelectorAll("#out .plot, #outG .plot").forEach((p) => p.remove()); document.querySelectorAll('#out [data-act="close"], #outG [data-act="close"]').forEach((b) => (b.onclick = () => { b.closest(".card").remove(); counts(); })); counts(); }); };
    inp.click();
  }
  function exportResults() { const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Results</title><style>${[...document.styleSheets[0].cssRules].map((r) => r.cssText).join("\n")}</style></head><body><h1>Analyses</h1><div id="out">${$("#out").innerHTML}</div><h1>Graphs</h1><div id="outG">${$("#outG").innerHTML}</div></body></html>`; downloadText(html, "results.html", "text/html"); }

  // ================= menu =================
  const MENU = [
    ["Data", [["Open CSV file", openFile], ["Paste data", pasteData], ["Sample datasets", sampleData], ["New data table", newBlank], null, ["Filters", filterUI], ["Compute", computeUI], ["Transform", transformUI], ["Add z-score column", zscoreColumn], ["Set variable type", typeUI], ["Rename or delete column", columnUI], null, ["Download data as CSV", downloadCSV]]],
    ["Exploration", [["Descriptives", descriptives], ["Scatterplot", scatterUI]]],
    ["Graph", [["Bar Plot", toGraphs(gBar)], ["Pie Chart", toGraphs(gPie)], null, ["Histogram", toGraphs(gHist)], ["Dotplot", toGraphs(gDot)], ["Boxplot", toGraphs(gBox)], ["Stem and Leaf", toGraphs(gStem)], null, ["Scatter Plot", toGraphs(gScatter)], ["QQ Plot", toGraphs(gQQ)]]],
    ["T-Tests", [["Independent Samples T-Test", tIndependent], ["Paired Samples T-Test", tPaired], ["One Sample T-Test", tOneSample]]],
    ["ANOVA", [["One-Way ANOVA", anovaUI]]],
    ["Regression", [["Correlation Matrix", corrUI], ["Linear Regression", linRegUI]]],
    ["Frequencies", [["2 Outcomes: Binomial test", binomialTest], ["N Outcomes: chi-square Goodness of fit", gofUI], ["Contingency Tables: Independent Samples", contTables], null, ["Two proportions: z test", twoPropsUI]]],
    ["distrACTION", [["Binomial Distribution", binomCalc], ["Normal Distribution", normalCalc], ["T-Distribution", tCalc], ["Chi-square and F", chiFCalc], null, ["Sample size for a margin of error", sampleSizeCalc], ["Power and sample size for a test", powerUI]]],
    ["Nonparametric", [["Mann-Whitney U (two groups)", mannWhitneyUI], ["Wilcoxon signed-rank and sign test (paired)", wilcoxonUI], ["Kruskal-Wallis (three or more groups)", kruskalUI]]],
    ["Learn", [["Coin flips and the law of large numbers", llnUI], ["The Central Limit Theorem", cltUI], ["What a confidence interval means", ciDemoUI], ["What a p-value is", pvalDemoUI], null, ["Sampling distribution simulator", samplingSim], ["Bootstrap: an interval with no formula", bootUI], ["Permutation: a p-value by reshuffling", permUI], ["Bayesian: prior, data, posterior", bayesUI]]],
    ["Advanced", [["Multiple Linear Regression", multRegUI], ["Logistic Regression", logitUI], ["Two-Way ANOVA", anova2UI], ["Repeated Measures and Mixed ANOVA", rmAnovaUI], null, ["Count Regression: Poisson and Negative Binomial", countRegUI], ["Multinomial Logistic Regression", multinomUI], ["Ordinal Logistic Regression", ordinalUI], null, ["McNemar test (paired yes or no)", mcnemarUI], ["Cochran-Armitage trend test", trendUI], null, ["Power and Sample Size", powerUI], null, ["Bootstrap confidence interval", bootUI], ["Permutation test", permUI], null, ["Time Series", tsUI], null, ["Principal Component Analysis", pcaUI], ["Exploratory Factor Analysis", efaUI], ["Reliability (Cronbach's alpha)", alphaUI], ["k-means Clustering", kmeansUI], null, ["Survival Analysis: Kaplan-Meier, log-rank, Cox", survivalUI], null, ["Bayesian Inference (conjugate priors)", bayesUI]]],
    ["Results", [["Decimal places shown", () => dialog("Decimal places", [sel("d", "Show numbers to", [["2", "2 decimals"], ["3", "3 decimals (default)"], ["4", "4 decimals"], ["6", "6 decimals"]], String(DEC))], (v) => { DEC = Number(v.d); try { localStorage.setItem("sww_dec", v.d); } catch (e) { } card("Decimal places", `now ${DEC}`, say("Applies to new results. The stored value is always full precision; quote the printed value and say how you rounded.")); }, "Set")], null, ["Print or save as PDF", () => window.print()], ["Export results as HTML", exportResults], ["Save session (data + results)", saveSession], ["Open a saved session", loadSession], null, ["Clear analyses", () => { $("#out").innerHTML = ""; counts(); }], ["Clear graphs", () => { $("#outG").innerHTML = ""; counts(); }]]],
  ];
  const nav = $("#menu");
  MENU.forEach(([name, items]) => {
    const dd = document.createElement("div"); dd.className = "dd";
    dd.innerHTML = `<button class="top">${name}</button><div class="items">${items.map((it) => (it ? `<button>${esc(it[0])}</button>` : '<div class="sep"></div>')).join("")}</div>`;
    dd.querySelector(".top").onclick = (e) => { e.stopPropagation(); const open = dd.classList.contains("open"); nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")); if (!open) dd.classList.add("open"); };
    const btns = dd.querySelectorAll(".items button"); let k = 0;
    items.forEach((it) => { if (!it) return; btns[k++].onclick = () => { nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")); CUR_FN = it[1]; PREFILL = null; REPLACE = null; try { it[1](); } catch (err) { alert(err.message || err); } }; });
    nav.appendChild(dd);
  });
  document.addEventListener("click", () => nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")));
  $("#dlg").addEventListener("click", (e) => { if (e.target.id === "dlg") $("#dlg").classList.remove("open"); });
  $("#filterBox").addEventListener("change", () => { D.filter = $("#filterBox").value.trim(); try { activeIdx(); } catch (e) { alert(e.message); D.filter = ""; } renderGrid(); persist(); });
  document.querySelectorAll(".tabs .tab").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
  restore();
  // draggable splitter between the data table and the results
  (function () {
    const sp = document.getElementById("splitter"), main = document.querySelector("main"); if (!sp) return;
    try { const w = localStorage.getItem("sww_leftw"); if (w) main.style.setProperty("--leftw", w); } catch (e) { }
    let drag = false;
    sp.addEventListener("mousedown", (e) => { drag = true; sp.classList.add("on"); document.body.style.userSelect = "none"; e.preventDefault(); });
    window.addEventListener("mousemove", (e) => { if (!drag) return; const px = Math.max(240, Math.min(window.innerWidth - 360, e.clientX)); main.style.setProperty("--leftw", px + "px"); });
    window.addEventListener("mouseup", () => { if (!drag) return; drag = false; sp.classList.remove("on"); document.body.style.userSelect = ""; try { localStorage.setItem("sww_leftw", main.style.getPropertyValue("--leftw")); } catch (e) { } window.dispatchEvent(new Event("resize")); });
    sp.addEventListener("dblclick", () => { main.style.removeProperty("--leftw"); try { localStorage.removeItem("sww_leftw"); } catch (e) { } window.dispatchEvent(new Event("resize")); });
    sp.addEventListener("touchstart", (e) => { drag = true; e.preventDefault(); }, { passive: false });
    window.addEventListener("touchmove", (e) => { if (!drag) return; const px = Math.max(240, Math.min(window.innerWidth - 360, e.touches[0].clientX)); main.style.setProperty("--leftw", px + "px"); }, { passive: true });
    window.addEventListener("touchend", () => { if (drag) { drag = false; try { localStorage.setItem("sww_leftw", main.style.getPropertyValue("--leftw")); } catch (e) { } window.dispatchEvent(new Event("resize")); } });
  })();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
})();
