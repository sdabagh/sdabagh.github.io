/* Stats Without Walls: interface. Menus, option names and result tables follow jamovi so the course's
   jamovi instructions transfer as written. Engine in stats.js (window.SW); jStat and Plotly vendored. */
(function () {
  const $ = (s) => document.querySelector(s);
  const D = { name: "", cols: [], rows: [], types: {}, filter: "", sortCol: null, sortDir: 1 };
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
    D.cols.forEach((c, j) => {
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
  function persist() { try { localStorage.setItem("sww_data", JSON.stringify({ name: D.name, cols: D.cols, rows: D.rows, filter: D.filter })); } catch (e) { } }
  function restore() { try { const s = JSON.parse(localStorage.getItem("sww_data") || "null"); if (s && s.rows && s.rows.length) { D.name = s.name; D.cols = s.cols; D.rows = s.rows; D.filter = s.filter || ""; inferTypes(); renderGrid(); } } catch (e) { } }
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
    let h = '<table class="grid"><thead><tr><th></th>' + D.cols.map((c) => `<th data-col="${esc(c)}" title="click to sort">${esc(c)}<small>${icon[D.types[c]]}</small></th>`).join("") + "</tr></thead><tbody>";
    let keep = null; try { keep = new Set(activeIdx()); } catch (e) { }
    D.rows.forEach((r, i) => { h += `<tr class="${keep && !keep.has(i) ? "off" : ""}"><td class="rn">${i + 1}</td>` + r.map((v, j) => `<td contenteditable data-i="${i}" data-j="${j}">${esc(v)}</td>`).join("") + "</tr>"; });
    g.innerHTML = h + "</tbody></table>";
    g.querySelectorAll("td[contenteditable]").forEach((td) => td.addEventListener("blur", () => { D.rows[+td.dataset.i][+td.dataset.j] = td.textContent.trim(); inferTypes(); persist(); }));
    g.querySelectorAll("th[data-col]").forEach((th) => (th.onclick = () => sortBy(th.dataset.col)));
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
    ["yrbs2023_teens_1500.csv", "CDC teen survey 2023: marijuana, sleep, grades, mood (1500 students)"], ["gss2018_beliefs_politics.csv", "General Social Survey 2018: astrology, science, politics (2348 adults)"], ["gss2022_politics_wellbeing.csv", "General Social Survey 2022: politics and wellbeing (3544 adults)"], ["big5_personality_1200.csv", "Big Five personality (1200 respondents)"]];

  // ================= output =================
  let cardN = 0;
  let TARGET = "#out";
  function showTab(name) { document.querySelectorAll(".tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name)); $("#out").classList.toggle("active", name === "analyses"); $("#outG").classList.toggle("active", name === "graphs"); document.querySelectorAll("#outG .plot").forEach((p) => { try { Plotly.Plots.resize(p); } catch (e) { } }); }
  function counts() { $("#cntA").textContent = $("#out").children.length || ""; $("#cntG").textContent = $("#outG").children.length || ""; }
  function card(title, meta, html) {
    const div = document.createElement("div"); div.className = "card"; div.id = "card" + ++cardN;
    div.innerHTML = `<div class="tools"><button data-act="copy">copy text</button><button data-act="close">remove</button></div><h2>${esc(title)}</h2><div class="meta">${esc(meta)}</div>${html}`;
    div.querySelector('[data-act="close"]').onclick = () => { div.remove(); counts(); };
    div.querySelector('[data-act="copy"]').onclick = () => navigator.clipboard.writeText(div.innerText);
    const out = $(TARGET); out.prepend(div); out.scrollTop = 0; showTab(TARGET === "#outG" ? "graphs" : "analyses"); counts(); return div;
  }
  function table(headers, rows, caption) {
    return (caption ? `<div class="cap">${esc(caption)}</div>` : "") + `<table class="res"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((r) => `<tr>${r.map((v, i) => `<td class="${i ? "num" : ""}">${typeof v === "number" ? fmt(v) : esc(v)}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
  }
  function plotDiv(div, traces, layout, h = 320) {
    const p = document.createElement("div"); p.className = "plot"; p.style.height = h + "px"; div.appendChild(p);
    Plotly.newPlot(p, traces, Object.assign({ margin: { t: 36, l: 50, r: 20, b: 50 }, font: { family: "Segoe UI, Arial", size: 12 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff" }, layout), { displaylogo: false, responsive: true });
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
    fields.filter(Boolean).forEach((fd) => {
      const id = "f_" + fd.name; let ctl = "";
      if (fd.type === "select" || fd.type === "multi") ctl = `<select id="${id}" name="${fd.name}" ${fd.type === "multi" ? "multiple" : ""}>${(fd.options || []).map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}" ${String(fd.value) === String(v) ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
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
      const tgt = f.dataset.target || "#out"; const prev = TARGET; TARGET = tgt;
      try { onGo(v); $("#dlg").classList.remove("open"); } catch (err) { alert(err.message || err); } finally { TARGET = prev; }
    };
    $("#dlg").classList.add("open");
  }
  const needData = () => { if (!D.rows.length) throw new Error("Open a data file first (Data menu)."); };
  const sel = (name, label, options, value) => ({ name, label, type: "select", options, value });
  const selNum = (name, label) => sel(name, label, numCols());
  const selCat = (name, label) => sel(name, label, catCols());
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
      sel("qm", "Quartile method", [["halves", "Textbook rule: median of each half, overall median excluded (default)"], ["type7", "R and jamovi rule (type 7, interpolated)"]], "halves"),
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
        cd.insertAdjacentHTML("beforeend", table(hdr, rows, "Descriptives") + (groups.length > 1 ? smallGroups(cells.map((d, i) => [d.n || 0, hdr[i + 1]])) : "") + (v.qm === "halves" ? say("Quartiles by the textbook rule: Q1 is the median of the lower half and Q3 the median of the upper half, with the overall median left out when n is odd. jamovi and R interpolate instead, so their quartiles can differ in the first decimal; neither is wrong, say which rule you used.") : say("Quartiles by the R and jamovi interpolation rule (type 7). The textbook rule (median of each half) can differ in the first decimal.")) + (v.skew ? say("Skewness smaller than about twice its standard error is weak evidence of skew; do not call a distribution skewed on a number that small. Look at the histogram.") : "") + (cells.some((d) => d.missing > 0) ? warn("Some rows are blank for a variable and were dropped from that column only, so N differs across columns. Check N before comparing.") : "") + (v.sdpop ? say("Two standard deviations are shown. The sample one divides by n minus 1 and is the one this course reports (the data are a sample). The population one divides by N; calculators and spreadsheets sometimes use it, which is why a hand calculation can disagree with the table.") : "") + (v.mode ? say("Mode: when two or more values tie for most frequent, all of them are printed with the count. jamovi prints only one and does not say so.") : "") + say("Shape from two numbers: mean above median points to a right tail, mean below median to a left tail. Report a pair: mean with standard deviation when symmetric, median with IQR when skewed or with outliers."));
      }
      if (v.freq && catV.length) catV.forEach((x) => { groups.forEach((g) => { const vals = g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); const c = SW.counts(vals), keys = Object.keys(c).sort(), n = keys.reduce((s, k) => s + c[k], 0); let cum = 0; const miss = vals.filter((q) => q === "").length; cd.insertAdjacentHTML("beforeend", table(["Levels", "Counts", "% of Total", "Cumulative %"], keys.map((k) => { cum += c[k]; return [k, c[k], (100 * c[k]) / n, (100 * cum) / n]; }).concat([["Total (non-missing)", n, 100, ""]]), `Frequencies of ${x}${g == null ? "" : " (" + g + ")"}`) + (miss ? warn(`${miss} blank${miss > 1 ? "s" : ""} excluded: percentages are out of ${n}, not ${n + miss}.`) : "")); }); });
      // plots
      numV.forEach((x) => {
        const d = SW.describe(col(x)) || {};
        if (v.hist || v.dens) { const traces = groups.map((g) => { const vals = SW.num(g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g)); return { x: vals, type: "histogram", name: g == null ? x : String(g), opacity: groups.length > 1 ? 0.6 : 1, histnorm: v.dens ? "probability density" : "", marker: { color: groups.length > 1 ? undefined : "#3A7CA5", line: { color: "#fff", width: 1 } } }; });
          const shapes = v.lines && groups.length === 1 ? [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }] : [];
          plotDiv(cd, traces, { barmode: "overlay", title: `Histogram of ${x}`, xaxis: { title: x }, yaxis: { title: v.dens ? "density" : "Count" }, shapes }); }
        if (v.box) plotDiv(cd, groups.map((g) => ({ y: SW.num(g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g)), type: "box", quartilemethod: "exclusive", name: g == null ? x : String(g), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { title: `Box plot of ${x}`, yaxis: { title: x }, showlegend: false });
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
  function groupsOf(v) { return v.by ? [...new Set(col(v.by).filter((g) => g !== ""))] : [null]; }
  function subset(x, v, g) { return g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); }
  function meanMedianShapes(d) { return [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }]; }
  function gBar() {
    needData();
    dialog("Graph: Bar Plot", [selCat("x", "Categorical variable"), selAny("by", "Group by"), sel("type", "Type", [["count", "Frequency (counts)"], ["rel", "Relative frequency (percent)"]], "count"), sel("order", "Order", [["count", "tallest first"], ["alpha", "alphabetical"], ["data", "order of first appearance"]], "count"), { name: "horiz", label: "Horizontal bars", type: "check", value: false }], (v) => {
      const groups = groupsOf(v); const c0 = SW.counts(col(v.x)); let keys = Object.keys(c0);
      if (v.order === "count") keys.sort((a, b) => c0[b] - c0[a]); else if (v.order === "alpha") keys.sort();
      const traces = groups.map((g) => { const c = SW.counts(subset(v.x, v, g)), n = Object.values(c).reduce((s, q) => s + q, 0); const y = keys.map((k) => (v.type === "rel" ? (100 * (c[k] || 0)) / n : c[k] || 0)); return v.horiz ? { y: keys, x: y, type: "bar", orientation: "h", name: g == null ? v.x : String(g) } : { x: keys, y, type: "bar", name: g == null ? v.x : String(g), marker: g == null ? { color: "#3A7CA5" } : {} }; });
      const cd = card("Bar Plot: " + v.x + (v.by ? " by " + v.by : ""), src(), say("Bars are separated because the categories are separate things. Ordering is a choice: tallest first tells the eye what the story is. Relative frequency lets you compare groups of different sizes."));
      plotDiv(cd, traces, { barmode: "group", [v.horiz ? "xaxis" : "yaxis"]: { title: v.type === "rel" ? "Percent" : "Count", rangemode: "tozero" }, showlegend: groups.length > 1 });
    });
  }
  function gPie() {
    needData();
    dialog("Graph: Pie Chart", [selCat("x", "Categorical variable"), { name: "labels", label: "Show percent and count", type: "check", value: true }], (v) => {
      const c = SW.counts(col(v.x)), keys = Object.keys(c).sort((a, b) => c[b] - c[a]);
      const cd = card("Pie Chart: " + v.x, src(), say("A pie is only for parts of one whole, and similar slices are hard to compare by eye. A bar chart is almost always the safer choice."));
      plotDiv(cd, [{ labels: keys, values: keys.map((k) => c[k]), type: "pie", textinfo: v.labels ? "label+percent+value" : "label", sort: false }], {});
    });
  }
  function gHist() {
    needData();
    dialog("Graph: Histogram", [selNum("x", "Numeric variable"), selAny("by", "Group by"), sel("type", "Type", [["count", "Frequency"], ["rel", "Relative frequency"], ["dens", "Density"]], "count"), { name: "bw", label: "Bin width (blank = automatic)", type: "number", value: "" }, { name: "start", label: "Start bins at (blank = automatic)", type: "number", value: "" }, { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }], (v) => {
      const groups = groupsOf(v); const d = SW.describe(col(v.x)) || {};
      const traces = groups.map((g) => { const tr = { x: SW.num(subset(v.x, v, g)), type: "histogram", name: g == null ? v.x : String(g), opacity: groups.length > 1 ? 0.6 : 1, histnorm: v.type === "rel" ? "percent" : v.type === "dens" ? "probability density" : "", marker: { color: groups.length > 1 ? undefined : "#3A7CA5", line: { color: "#fff", width: 1 } } }; if (Number.isFinite(v.bw) && v.bw > 0) tr.xbins = { size: v.bw, start: Number.isFinite(v.start) ? v.start : undefined }; return tr; });
      const cd = card("Histogram: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}, s = ${fmt(d.sd)}`), say("Bars touch because the number line has no gaps. Bin width is a decision: too few bins hide structure, too many turn noise into peaks. Try two or three widths before believing a feature."));
      plotDiv(cd, traces, { barmode: "overlay", xaxis: { title: v.x }, yaxis: { title: v.type === "rel" ? "Percent" : v.type === "dens" ? "Density" : "Count" }, shapes: v.lines && groups.length === 1 ? meanMedianShapes(d) : [], showlegend: groups.length > 1 });
    });
  }
  function gDot() {
    needData();
    dialog("Graph: Dotplot", [selNum("x", "Numeric variable"), selAny("by", "Group by"), { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }], (v) => {
      const groups = groupsOf(v); const d = SW.describe(col(v.x)) || {}; const bw = (d.range || 1) / 45 || 1;
      const traces = groups.map((g, gi) => { const xs = SW.num(subset(v.x, v, g)).sort((a, b) => a - b), bins = {}; const ys = xs.map((val) => { const b = Math.round(val / bw); bins[b] = (bins[b] || 0) + 1; return bins[b] + gi * 0; }); return { x: xs, y: ys, mode: "markers", type: "scatter", name: g == null ? v.x : String(g), marker: { size: 9 }, xaxis: "x", yaxis: groups.length > 1 ? "y" + (gi + 1) : "y" }; });
      const layout = { xaxis: { title: v.x }, showlegend: false, grid: groups.length > 1 ? { rows: groups.length, columns: 1, pattern: "coupled" } : undefined, shapes: v.lines && groups.length === 1 ? meanMedianShapes(d) : [] };
      groups.forEach((g, gi) => { layout["yaxis" + (gi ? gi + 1 : "")] = { visible: false, title: g == null ? "" : String(g) }; });
      const cd = card("Dotplot: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}`), say("One dot per observation, nothing hidden. The picture behind every summary number."));
      plotDiv(cd, traces, layout, groups.length > 1 ? 120 * groups.length + 80 : 300);
    });
  }
  function gBox() {
    needData();
    dialog("Graph: Boxplot", [{ name: "vars", label: "Numeric variables (several draw side by side)", type: "multi", options: numCols() }, selAny("by", "Group by"), { name: "pts", label: "Show all points", type: "check", value: false }, { name: "horiz", label: "Horizontal", type: "check", value: false }], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const groups = groupsOf(v); const traces = [];
      v.vars.forEach((x) => groups.forEach((g) => { const vals = SW.num(subset(x, v, g)); traces.push(Object.assign({ type: "box", quartilemethod: "exclusive", name: (v.vars.length > 1 ? x : "") + (g == null ? (v.vars.length > 1 ? "" : x) : (v.vars.length > 1 ? " " : "") + String(g)), boxpoints: v.pts ? "all" : "outliers", jitter: 0.3, marker: { color: "#3A7CA5" } }, v.horiz ? { x: vals } : { y: vals })); }));
      const fences = v.vars.map((x) => { const d = SW.describe(col(x)); return `${x}: Q1 ${fmt(d.q1)}, median ${fmt(d.median)}, Q3 ${fmt(d.q3)}, fences ${fmt(d.lowerFence)} and ${fmt(d.upperFence)}`; }).join("; ");
      const cd = card("Boxplot: " + v.vars.join(", ") + (v.by ? " by " + v.by : ""), src(fences), say("Box from Q1 to Q3 (textbook rule: median of each half, overall median excluded), line at the median, whiskers to the last values inside the fences, dots beyond. Dots are worth a look, not wrong. Shape decides the summary: symmetric, mean with s; skewed or with dots, median with IQR."));
      plotDiv(cd, traces, { [v.horiz ? "xaxis" : "yaxis"]: { title: v.vars.length === 1 ? v.vars[0] : "" }, showlegend: false });
    });
  }
  function gScatter() {
    needData();
    dialog("Graph: Scatter Plot", [selNum("x", "X variable"), selNum("y", "Y variable"), selAny("by", "Color by"), { name: "line", label: "Least-squares line", type: "check", value: true }, { name: "label", label: "Label points with (optional column)", type: "select", options: [["", "(none)"]].concat(D.cols) }], (v) => {
      const r = SW.regress(col(v.x), col(v.y)); const groups = groupsOf(v);
      const traces = groups.map((g) => { const keep = (i) => g == null || col(v.by)[i] === g; const tr = { x: col(v.x).filter((_, i) => keep(i)), y: col(v.y).filter((_, i) => keep(i)), mode: v.label ? "markers+text" : "markers", type: "scatter", name: g == null ? "data" : String(g), textposition: "top center", textfont: { size: 9 } }; if (v.label) tr.text = col(v.label).filter((_, i) => keep(i)); if (g == null) tr.marker = { color: "#3A7CA5" }; return tr; });
      if (v.line) { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: `y = ${fmt(r.b0, 3)} + ${fmt(r.b1, 4)} x`, line: { color: "#C0392B" } }); }
      const cd = card(`Scatter Plot: ${v.y} against ${v.x}`, src(`n = ${r.n}, r = ${fmt(r.r)}, r squared = ${fmt(r.r2)}`), say("Describe direction, form, strength, and outliers, in that order. r measures linear association only. Correlation is not causation."));
      plotDiv(cd, traces, { xaxis: { title: v.x }, yaxis: { title: v.y }, showlegend: groups.length > 1 || v.line });
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
      const r = SW.twoMeans({ m1: a.mean, s1: a.sd, n1: a.n, m2: b.mean, s2: b.sd, n2: b.n, alt: v.alt, conf: +v.conf });
      const hdr = ["", "", "Statistic", "df", "p"], row = [v.mode === "data" ? v.x : "value", "Welch's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference", "SE difference"); row.push(r.diff, r.se); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower, r.upper); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "Independent Samples T-Test") + `<div class="note">Note. H<sub>a</sub> mu<sub>${esc(names[0])}</sub> ${altWord(v.alt)} mu<sub>${esc(names[1])}</sub>. Welch's df comes from the two standard errors, so it is a decimal.</div>`;
      if (v.desc) html += table(["", "Group", "N", "Mean", "SD", "SE"], [[v.mode === "data" ? v.x : "", names[0], a.n, a.mean, a.sd, a.sd / Math.sqrt(a.n)], ["", names[1], b.n, b.mean, b.sd, b.sd / Math.sqrt(b.n)]], "Group Descriptives");
      html += formula(`t = (x bar 1 minus x bar 2) / sqrt(s1^2 / n1 + s2^2 / n2)`);
      html += say(`H0: the two population means are equal. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${names[0]} is ${altWord(v.alt)} the mean of ${names[1]}.` : `There is not enough evidence of a difference between the means of ${names[0]} and ${names[1]}.`} We are ${Math.round(r.conf * 100)} percent confident the difference in population means is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      if (v.mode === "data") { const all = [...new Set(col(v.g).filter((q) => q !== ""))]; if (all.length > 2) html += say(`${v.g} has ${all.length} levels (${all.join(", ")}); this test compares ${names[0]} with ${names[1]} only. Choosing which two is your decision to defend; for all groups at once use One-Way ANOVA.`); }
      html += smallGroups([[a.n, names[0]], [b.n, names[1]]]) + cond(a.n >= 30 && b.n >= 30, "Both groups have N at least 30.", "A group has N under 30: needs roughly normal populations (check box plots); state that the assumptions are met.") + say("Independent samples: different individuals in each group. If the same individuals were measured twice, use the Paired Samples T-Test.");
      const cd = card("Independent Samples T-Test", from, html);
      if (v.plot && v.mode === "data") plotDiv(cd, [{ y: SW.num(ga), type: "box", name: String(names[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(gb), type: "box", name: String(names[1]), marker: { color: "#D97D54" } }], { yaxis: { title: v.x }, showlegend: false });
      tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function tPaired() {
    needData();
    dialog("T-Tests: Paired Samples T-Test", [selNum("a", "Paired variable 1"), selNum("b", "Paired variable 2"), sel("alt", "Hypothesis", [["two", "Measure 1 not equal to Measure 2"], ["greater", "Measure 1 greater than Measure 2"], ["less", "Measure 1 less than Measure 2"]], "two"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" }, { name: "plot", label: "Histogram of differences", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      const r = SW.paired(col(v.a), col(v.b), { alt: v.alt, conf: +v.conf });
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
      if (v.plot) plotDiv(cd, r.groups.map((q) => ({ y: q.x, type: "box", quartilemethod: "exclusive", name: String(q.name), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: { title: v.x }, showlegend: false });
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
      let html = table(hdr, rows, "Binomial Test") + `<div class="note">Note. H<sub>a</sub> is proportion ${altWord(v.alt)} ${v.p0}. p is the exact binomial p-value, as jamovi reports it.</div>`;
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
      { name: "props", label: "Expected proportions, comma separated in the level order shown (blank = equal)", type: "text", placeholder: "0.30, 0.25, 0.15, 0.30", hint: "Levels are sorted alphabetically, the same order jamovi shows them." },
      { name: "exp", label: "Expected counts", type: "check", value: true }, alphaField], (v) => {
      let obs = {}, from = "counts";
      if (v.mode === "data") { const c = SW.counts(col(v.x)); Object.keys(c).sort().forEach((k) => (obs[k] = c[k])); from = src(v.x); }
      else v.counts.split("\n").map((l) => l.split(":")).filter((p) => p.length === 2).forEach(([k, n]) => (obs[k.trim()] = Number(n)));
      const keys = Object.keys(obs); if (keys.length < 2) throw new Error("Need at least two levels.");
      let props = null, propNote = ""; if (v.props.trim()) { const ps = v.props.split(/[,\s]+/).filter(Boolean).map(Number); if (ps.length !== keys.length) throw new Error(`Levels in order: ${keys.join(", ")}. You gave ${ps.length} proportions for ${keys.length} levels.`); const tot = ps.reduce((s, q) => s + q, 0); if (Math.abs(tot - 1) > 0.02) propNote = tot > 1.5 ? say(`You typed values that add to ${fmt(tot, 2)}, so they were read as expected counts (or percents) and rescaled to proportions: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}. jamovi would rescale silently; this card says so.`) : warn(`Your proportions add to ${fmt(tot, 3)}, not 1. They were rescaled to add to 1: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}.`); props = Object.fromEntries(keys.map((k, i) => [k, ps[i]])); }
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
      hasData ? selCat("x", "Outcome variable") : null, hasData ? { name: "succ", label: "Success level (exactly as in the data)", type: "text" } : null, hasData ? selCat("g", "Grouping variable (two levels)") : null,
      { name: "x1", label: "Successes 1", type: "number", group: "Group 1" }, { name: "n1", label: "N 1", type: "number", group: "Group 1" }, { name: "x2", label: "Successes 2", type: "number", group: "Group 2" }, { name: "n2", label: "N 2", type: "number", group: "Group 2" },
      sel("alt", "Hypothesis", [["two", "p1 not equal to p2"], ["greater", "p1 greater than p2"], ["less", "p1 less than p2"]], "two"), confField, alphaField], (v) => {
      let x1 = v.x1, n1 = v.n1, x2 = v.x2, n2 = v.n2, names = ["Group 1", "Group 2"], from = "counts";
      if (v.mode === "data") { const lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} levels; needs exactly two (add a filter).`); names = lv; const gv = col(v.g), xv = col(v.x); const inG = (l) => xv.filter((_, i) => gv[i] === l && xv[i] !== ""); n1 = inG(lv[0]).length; x1 = inG(lv[0]).filter((q) => q === v.succ).length; n2 = inG(lv[1]).length; x2 = inG(lv[1]).filter((q) => q === v.succ).length; from = src(`${v.x} = ${v.succ} by ${v.g}`); }
      const r = SW.twoProps({ x1, n1, x2, n2, alt: v.alt, conf: +v.conf });
      let html = table(["Group", "Successes", "N", "Proportion"], [[names[0], x1, n1, r.p1], [names[1], x2, n2, r.p2]], "Proportions");
      html += table(["Difference", "Pooled p hat", "SE0 (pooled)", "z", "p", "SE (unpooled)", `${Math.round(r.conf * 100)}% CI lower`, "upper"], [[r.diff, r.pooled, r.se0, r.z, SW.fmtP(r.p), r.se, r.lower, r.upper]], "Two proportions z test");
      html += formula("z = (p1 hat minus p2 hat) / sqrt(pooled p (1 minus pooled p)(1/n1 + 1/n2)); interval uses the unpooled SE. In jamovi this is Contingency Tables on a 2 by 2 table, where chi-square = z squared.");
      html += cond(r.cond, `Success-failure check: ${x1}/${n1 - x1} and ${x2}/${n2 - x2}, all at least 10.`, `A count is below 10 (${x1}/${n1 - x1} and ${x2}/${n2 - x2}): this course does not run the z procedure here. Report the two proportions and say the sample is too small.`);
      html += say(`H0: p1 = p2. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the proportion in ${names[0]} is ${altWord(v.alt)} the proportion in ${names[1]}.` : `There is not enough evidence of a difference between the two population proportions.`} We are ${Math.round(r.conf * 100)} percent confident the difference is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      const cd = card("Two proportions (z)", from, html); zPlot(cd, r.z, v.alt);
    });
  }


  // ================= Nonparametric =================
  function mannWhitneyUI() {
    needData();
    dialog("Nonparametric: Mann-Whitney U (two independent groups)", [selNum("x", "Dependent variable"), selCat("g", "Grouping variable (two levels)"), sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"), alphaField], (v) => {
      const lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} levels; needs exactly two.`);
      const a = col(v.x).filter((_, i) => col(v.g)[i] === lv[0]), b = col(v.x).filter((_, i) => col(v.g)[i] === lv[1]); const r = SW.mannWhitney(a, b, v.alt);
      const html = table(["", "", "Statistic", "z", "p"], [[v.x, "Mann-Whitney U", r.U, r.z, SW.fmtP(r.p)]], "Independent Samples T-Test (nonparametric)") + table(["Group", "N", "Median"], [[lv[0], r.n1, r.med1], [lv[1], r.n2, r.med2]], "Group Descriptives") + formula("Ranks all values together and compares the rank sums; no normality assumption. Normal approximation with tie correction, as in jamovi and R.") + say(`H0: the two distributions are the same. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that ${v.x} tends to be ${altWord(v.alt) === "not equal to" ? "different" : altWord(v.alt)} in ${lv[0]} compared with ${lv[1]}.` : `There is not enough evidence of a difference in ${v.x} between ${lv[0]} and ${lv[1]}.`} Use this when the groups are small and clearly skewed, or when the data are ranks.`);
      const cd = card("Mann-Whitney U", src(`${v.x} by ${v.g}`), html); plotDiv(cd, [{ y: SW.num(a), type: "box", name: String(lv[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(b), type: "box", name: String(lv[1]), marker: { color: "#D97D54" } }], { yaxis: { title: v.x }, showlegend: false }, 260);
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
    dialog("Data: Set a variable's type", [sel("x", "Column", D.cols), sel("t", "Type", [["continuous", "Continuous (ruler)"], ["ordinal", "Ordinal"], ["nominal", "Nominal (three circles)"], ["id", "ID"]], "nominal")], (v) => { D.types[v.x] = v.t; renderGrid(); }, "Set");
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
    ["distrACTION", [["Binomial Distribution", binomCalc], ["Normal Distribution", normalCalc], ["T-Distribution", tCalc], ["Chi-square and F", chiFCalc], null, ["Sample size", sampleSizeCalc]]],
    ["Nonparametric", [["Mann-Whitney U (two groups)", mannWhitneyUI], ["Wilcoxon signed-rank and sign test (paired)", wilcoxonUI], ["Kruskal-Wallis (three or more groups)", kruskalUI]]],
    ["Learn", [["Sampling distribution simulator", samplingSim]]],
    ["Results", [["Decimal places shown", () => dialog("Decimal places", [sel("d", "Show numbers to", [["2", "2 decimals"], ["3", "3 decimals (jamovi's default)"], ["4", "4 decimals"], ["6", "6 decimals"]], String(DEC))], (v) => { DEC = Number(v.d); try { localStorage.setItem("sww_dec", v.d); } catch (e) { } card("Decimal places", `now ${DEC}`, say("Applies to new results. The stored value is always full precision; quote the printed value and say how you rounded.")); }, "Set")], null, ["Print or save as PDF", () => window.print()], ["Export results as HTML", exportResults], ["Save session (data + results)", saveSession], ["Open a saved session", loadSession], null, ["Clear analyses", () => { $("#out").innerHTML = ""; counts(); }], ["Clear graphs", () => { $("#outG").innerHTML = ""; counts(); }]]],
  ];
  const nav = $("#menu");
  MENU.forEach(([name, items]) => {
    const dd = document.createElement("div"); dd.className = "dd";
    dd.innerHTML = `<button class="top">${name}</button><div class="items">${items.map((it) => (it ? `<button>${esc(it[0])}</button>` : '<div class="sep"></div>')).join("")}</div>`;
    dd.querySelector(".top").onclick = (e) => { e.stopPropagation(); const open = dd.classList.contains("open"); nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")); if (!open) dd.classList.add("open"); };
    const btns = dd.querySelectorAll(".items button"); let k = 0;
    items.forEach((it) => { if (!it) return; btns[k++].onclick = () => { nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")); try { it[1](); } catch (err) { alert(err.message || err); } }; });
    nav.appendChild(dd);
  });
  document.addEventListener("click", () => nav.querySelectorAll(".dd").forEach((d) => d.classList.remove("open")));
  $("#dlg").addEventListener("click", (e) => { if (e.target.id === "dlg") $("#dlg").classList.remove("open"); });
  $("#filterBox").addEventListener("change", () => { D.filter = $("#filterBox").value.trim(); try { activeIdx(); } catch (e) { alert(e.message); D.filter = ""; } renderGrid(); persist(); });
  document.querySelectorAll(".tabs .tab").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
  restore();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
})();
