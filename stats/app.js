/* Stats Without Walls: user interface. Depends on stats.js (window.SW), jStat, Plotly. */
(function () {
  const $ = (s) => document.querySelector(s);
  const D = { name: "", cols: [], rows: [], types: {} };
  const fmt = (x, d = 4) => (typeof x === "number" && Number.isFinite(x) ? Number(x.toFixed(d)).toString() : x == null ? "" : String(x));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ALT = { two: "not equal to", less: "less than", greater: "greater than" };

  // ---------------- data ----------------
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
      D.types[c] = vals.length && nums.length === vals.length && !(distinct <= 3 && /id|code/i.test(c)) ? "num" : "cat";
    });
  }
  function loadTable(name, rows) {
    D.name = name; D.cols = rows[0].map((h, i) => (h.trim() || "col" + (i + 1)));
    D.rows = rows.slice(1).map((r) => D.cols.map((_, j) => (r[j] == null ? "" : r[j].trim())));
    inferTypes(); renderGrid();
  }
  function col(name) { const j = D.cols.indexOf(name); return D.rows.map((r) => r[j]); }
  function numCols() { return D.cols.filter((c) => D.types[c] === "num"); }
  function catCols() { return D.cols.filter((c) => { const k = new Set(col(c).filter((v) => v !== "")).size; return (D.types[c] === "cat" && k < D.rows.length) || (D.types[c] === "num" && k <= 6); }); }
  function renderGrid() {
    $("#dsname").textContent = D.name || "No data loaded";
    $("#dsinfo").textContent = D.rows.length ? `${D.rows.length} rows, ${D.cols.length} columns` : "";
    const g = $("#grid"); if (!D.rows.length) return;
    let h = '<table class="grid"><thead><tr><th></th>' + D.cols.map((c) => `<th>${esc(c)}<small>${D.types[c] === "num" ? "numeric" : "categorical"}</small></th>`).join("") + "</tr></thead><tbody>";
    D.rows.forEach((r, i) => { h += `<tr><td class="rn">${i + 1}</td>` + r.map((v, j) => `<td contenteditable data-i="${i}" data-j="${j}">${esc(v)}</td>`).join("") + "</tr>"; });
    g.innerHTML = h + "</tbody></table>";
    g.querySelectorAll("td[contenteditable]").forEach((td) => td.addEventListener("blur", () => { D.rows[+td.dataset.i][+td.dataset.j] = td.textContent.trim(); inferTypes(); }));
  }
  function addColumn(name, values) { D.cols.push(name); D.rows.forEach((r, i) => r.push(values[i] === "" ? "" : fmt(values[i], 4))); inferTypes(); renderGrid(); }
  function downloadCSV() {
    const q = (v) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
    const txt = [D.cols.map(q).join(",")].concat(D.rows.map((r) => r.map(q).join(","))).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv" })); a.download = (D.name || "data") + ".csv"; a.click();
  }
  const SAMPLES = [
    ["STATC1000_Class_Data.csv", "Our class data (40 students)"], ["STATC1000_Sleep_Followup.csv", "Sleep follow-up (paired)"],
    ["Dataset1_Finch_Beaks.csv", "Galapagos finches (300 birds)"], ["Dataset4_Global_Health.csv", "Global health (50 countries)"],
    ["popp_calls_for_service.csv", "Calls for service (240 calls)"], ["popp_academy_fitness.csv", "Academy fitness (60 cadets)"], ["popp_community_survey.csv", "Community survey (180 residents)"]];

  // ---------------- output ----------------
  let cardN = 0;
  function card(title, meta, html) {
    const id = "card" + ++cardN;
    const div = document.createElement("div"); div.className = "card"; div.id = id;
    div.innerHTML = `<div class="tools"><button data-act="copy">copy text</button><button data-act="close">remove</button></div><h2>${esc(title)}</h2><div class="meta">${esc(meta)}</div>${html}`;
    div.querySelector('[data-act="close"]').onclick = () => div.remove();
    div.querySelector('[data-act="copy"]').onclick = () => navigator.clipboard.writeText(div.innerText);
    const out = $("#out"); out.prepend(div); out.scrollTop = 0; return div;
  }
  function table(headers, rows) {
    return `<table class="res"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((r) => `<tr>${r.map((v, i) => `<td class="${i ? "num" : ""}">${typeof v === "number" ? fmt(v) : esc(v)}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
  }
  function plotDiv(div, traces, layout) {
    const p = document.createElement("div"); p.className = "plot"; div.appendChild(p);
    Plotly.newPlot(p, traces, Object.assign({ margin: { t: 36, l: 50, r: 20, b: 50 }, font: { family: "Segoe UI, Arial", size: 12 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff" }, layout), { displaylogo: false, responsive: true });
  }
  const decision = (p, alpha) => (p <= alpha ? `p-value ${SW.fmtP(p)} is at or below alpha ${alpha}: reject H0.` : `p-value ${SW.fmtP(p)} is above alpha ${alpha}: fail to reject H0.`);
  const altSym = (alt) => (alt === "two" ? "not equal to" : alt === "less" ? "less than" : "greater than");

  // ---------------- dialog ----------------
  function dialog(title, fields, onGo) {
    const f = $("#dlgForm"); $("#dlgTitle").textContent = title; f.innerHTML = "";
    const groups = {}; let html = "";
    fields.forEach((fd) => {
      const id = "f_" + fd.name; let ctl = "";
      if (fd.type === "select" || fd.type === "multi") {
        ctl = `<select id="${id}" name="${fd.name}" ${fd.type === "multi" ? "multiple" : ""}>${(fd.options || []).map((o) => `<option value="${esc(Array.isArray(o) ? o[0] : o)}" ${fd.value === (Array.isArray(o) ? o[0] : o) ? "selected" : ""}>${esc(Array.isArray(o) ? o[1] : o)}</option>`).join("")}</select>`;
      } else if (fd.type === "textarea") ctl = `<textarea id="${id}" name="${fd.name}" rows="${fd.rows || 6}" placeholder="${esc(fd.placeholder || "")}"></textarea>`;
      else if (fd.type === "check") ctl = `<label style="display:inline"><input type="checkbox" id="${id}" name="${fd.name}" ${fd.value ? "checked" : ""}> ${esc(fd.label)}</label>`;
      else ctl = `<input type="${fd.type || "text"}" id="${id}" name="${fd.name}" value="${fd.value == null ? "" : esc(fd.value)}" step="any" placeholder="${esc(fd.placeholder || "")}">`;
      const lab = fd.type === "check" ? "" : `<label for="${id}">${esc(fd.label)}</label>`;
      const block = `<div>${lab}${ctl}${fd.hint ? `<div class="hint">${esc(fd.hint)}</div>` : ""}</div>`;
      if (fd.group) { groups[fd.group] = (groups[fd.group] || "") + block; html += `<!--G:${fd.group}-->`; } else html += block;
    });
    // assemble grouped fieldsets in first-seen order
    const seen = new Set();
    html = html.replace(/<!--G:([^>]+)-->/g, (m, g) => { if (seen.has(g)) return ""; seen.add(g); const cls = (groups[g].match(/<div>/g) || []).length >= 3 ? "row3" : "row"; return `<fieldset><legend>${esc(g)}</legend><div class="${cls}">${groups[g]}</div></fieldset>`; });
    f.innerHTML = html + `<div class="actions"><button type="button" id="dlgCancel">Cancel</button><button type="submit" class="go">Compute</button></div>`;
    $("#dlgCancel").onclick = () => $("#dlg").classList.remove("open");
    f.onsubmit = (e) => {
      e.preventDefault(); const v = {};
      fields.forEach((fd) => { const el = f.elements[fd.name]; if (!el) return; if (fd.type === "multi") v[fd.name] = [...el.selectedOptions].map((o) => o.value); else if (fd.type === "check") v[fd.name] = el.checked; else if (fd.type === "number") v[fd.name] = el.value === "" ? NaN : Number(el.value); else v[fd.name] = el.value; });
      try { onGo(v); $("#dlg").classList.remove("open"); } catch (err) { alert(err.message || err); }
    };
    $("#dlg").classList.add("open");
  }
  const needData = () => { if (!D.rows.length) throw new Error("Load a dataset first (Data menu)."); };
  const selNum = (name, label) => ({ name, label, type: "select", options: numCols() });
  const selCat = (name, label) => ({ name, label, type: "select", options: catCols() });
  const selAny = (name, label, extra) => ({ name, label, type: "select", options: (extra ? [extra] : []).concat(D.cols) });
  const altField = { name: "alt", label: "Alternative hypothesis", type: "select", options: [["two", "not equal to (two-sided)"], ["less", "less than"], ["greater", "greater than"]] };
  const confField = { name: "conf", label: "Confidence level", type: "select", options: [["0.90", "90 percent"], ["0.95", "95 percent"], ["0.99", "99 percent"]], value: "0.95" };
  const alphaField = { name: "alpha", label: "Alpha", type: "select", options: [["0.05", "0.05"], ["0.01", "0.01"], ["0.10", "0.10"]], value: "0.05" };

  // ---------------- analyses: summary ----------------
  function descriptives() {
    needData();
    dialog("Descriptives", [{ name: "vars", label: "Numeric variables (hold Cmd or Ctrl for several)", type: "multi", options: numCols() }, selAny("by", "Split by (optional)", ["", "none"])], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const groups = v.by ? [...new Set(col(v.by))] : [null];
      const hdr = ["Statistic"].concat(v.vars.flatMap((x) => groups.map((g) => g == null ? x : `${x} (${g})`)));
      const stats = [["n", "n"], ["Mean", "mean"], ["Median", "median"], ["Mode", "mode"], ["Std. deviation", "sd"], ["Variance", "variance"], ["Std. error of mean", "se"], ["Minimum", "min"], ["Q1 (25th)", "q1"], ["Q3 (75th)", "q3"], ["Maximum", "max"], ["IQR", "iqr"], ["Range", "range"], ["Lower fence", "lowerFence"], ["Upper fence", "upperFence"]];
      const cells = v.vars.flatMap((x) => groups.map((g) => { const vals = g == null ? col(x) : col(x).filter((_, i) => col(v.by)[i] === g); return SW.describe(vals) || {}; }));
      const rows = stats.map(([lab, k]) => [lab].concat(cells.map((d) => (d[k] == null ? "" : d[k]))));
      const c = card("Descriptives", `${D.name}${v.by ? ", split by " + v.by : ""}`, table(hdr, rows) +
        `<div class="say">Read shape from the mean against the median: mean above median points to a right tail, below to a left tail. Report a pair: mean with s when symmetric, median with IQR when skewed or with outliers. Fences are Q1 minus 1.5 IQR and Q3 plus 1.5 IQR.</div>`);
      if (groups.length === 1 && v.vars.length === 1) plotDiv(c, [{ x: SW.num(col(v.vars[0])), type: "histogram", marker: { color: "#3A7CA5" } }], { title: v.vars[0], xaxis: { title: v.vars[0] }, yaxis: { title: "Count" } });
    });
  }
  function frequency() {
    needData();
    dialog("Frequency table", [selCat("x", "Categorical variable"), { name: "plot", label: "Bar chart", type: "check", value: true }], (v) => {
      const c = SW.counts(col(v.x)); const keys = Object.keys(c).sort((a, b) => c[b] - c[a]); const n = keys.reduce((s, k) => s + c[k], 0);
      const rows = keys.map((k) => [k, c[k], c[k] / n, (100 * c[k]) / n]); rows.push(["Total", n, 1, 100]);
      const cd = card("Frequency table: " + v.x, D.name, table(["Level", "Count", "Proportion", "Percent"], rows) + `<div class="say">Each proportion is p hat, the count divided by n. They add to 1. Bars have gaps because the categories are separate things; order is your choice.</div>`);
      if (v.plot) plotDiv(cd, [{ x: keys, y: keys.map((k) => c[k]), type: "bar", marker: { color: "#3A7CA5" } }], { title: v.x, yaxis: { title: "Count" } });
    });
  }
  function twoWay() {
    needData();
    dialog("Two-way table", [selCat("r", "Row variable"), selCat("c", "Column variable"), { name: "pct", label: "Percentages", type: "select", options: [["none", "counts only"], ["row", "row percent"], ["col", "column percent"], ["tot", "total percent"]] }, { name: "exp", label: "Show expected counts (for chi-square)", type: "check", value: false }, { name: "test", label: "Run the chi-square test of independence", type: "check", value: false }, alphaField], (v) => {
      const t = SW.twoWay(col(v.r), col(v.c));
      const cell = (i, j) => { const o = t.O[i][j]; let s = String(o); if (v.pct === "row") s += ` (${fmt((100 * o) / t.rt[i], 1)}%)`; if (v.pct === "col") s += ` (${fmt((100 * o) / t.ct[j], 1)}%)`; if (v.pct === "tot") s += ` (${fmt((100 * o) / t.n, 1)}%)`; if (v.exp) s += ` [E ${fmt(t.E[i][j], 2)}]`; return s; };
      const rows = t.rows.map((r, i) => [r].concat(t.cols.map((_, j) => cell(i, j)), [t.rt[i]])); rows.push(["Total"].concat(t.ct, [t.n]));
      let html = table([v.r + " \\ " + v.c].concat(t.cols, ["Total"]), rows);
      html += `<div class="say">A row percent is a conditional probability, conditioned on the row. A total percent is the "and" probability. Independence would make every row show the same percentages.</div>`;
      if (v.test) {
        html += table(["Chi-square", "df", "p-value", "n", "Smallest expected"], [[t.chi, t.df, SW.fmtP(t.p), t.n, t.minE]]);
        html += `<div class="formula">chi-square = sum of (O minus E)^2 / E, with E = row total times column total / n, df = (rows minus 1)(columns minus 1)</div>`;
        html += `<div class="${t.minE >= 5 ? "ok" : "warn"}">${t.minE >= 5 ? "Every expected count is at least 5: the chi-square approximation is fine." : "An expected count is below 5: the test is not trustworthy. Combine categories or collect more data."}</div>`;
        html += `<div class="say">H0: ${v.r} and ${v.c} are independent. Ha: they are related. ${decision(t.p, +v.alpha)} ${t.p <= +v.alpha ? "There is evidence of a relationship between " + v.r + " and " + v.c + "." : "There is not enough evidence of a relationship between " + v.r + " and " + v.c + "."}</div>`;
      }
      card("Two-way table: " + v.r + " by " + v.c, D.name, html);
    });
  }

  // ---------------- graphs ----------------
  function graph(kind) {
    needData();
    if (kind === "bar" || kind === "pie") dialog(kind === "bar" ? "Bar chart" : "Pie chart", [selCat("x", "Categorical variable"), { name: "rel", label: "Relative frequency (percent)", type: "check", value: false }], (v) => {
      const c = SW.counts(col(v.x)), keys = Object.keys(c).sort((a, b) => c[b] - c[a]), n = keys.reduce((s, k) => s + c[k], 0);
      const cd = card((kind === "bar" ? "Bar chart: " : "Pie chart: ") + v.x, D.name, `<div class="say">${kind === "bar" ? "Bars are separated because the categories are separate things. Sorted tallest first unless the categories have their own order." : "A pie is only for parts of one whole, and similar slices are hard to compare. A bar chart is almost always the safer choice."}</div>`);
      if (kind === "bar") plotDiv(cd, [{ x: keys, y: keys.map((k) => (v.rel ? (100 * c[k]) / n : c[k])), type: "bar", marker: { color: "#3A7CA5" } }], { yaxis: { title: v.rel ? "Percent" : "Count", rangemode: "tozero" } });
      else plotDiv(cd, [{ labels: keys, values: keys.map((k) => c[k]), type: "pie", textinfo: "label+percent" }], {});
    });
    if (kind === "hist") dialog("Histogram", [selNum("x", "Numeric variable"), { name: "bins", label: "Number of bins (blank lets Plotly choose)", type: "number", value: "" }, selAny("by", "Split by (optional)", ["", "none"]), { name: "lines", label: "Mark the mean (solid) and median (dashed)", type: "check", value: true }], (v) => {
      const x = SW.num(col(v.x)), d = SW.describe(x);
      const cd = card("Histogram: " + v.x, `${D.name}. n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}, s = ${fmt(d.sd)}`, `<div class="say">Bars touch because the number line has no gaps. Bin width is a decision: too few bins hide structure, too many turn noise into peaks. Try two or three widths before believing a feature.</div>`);
      const traces = []; const groups = v.by ? [...new Set(col(v.by))] : [null];
      groups.forEach((g) => { const vals = g == null ? x : SW.num(col(v.x).filter((_, i) => col(v.by)[i] === g)); const tr = { x: vals, type: "histogram", name: g == null ? v.x : String(g), opacity: groups.length > 1 ? 0.6 : 1, marker: { color: g == null ? "#3A7CA5" : undefined, line: { color: "#fff", width: 1 } } }; if (v.bins) tr.nbinsx = v.bins; traces.push(tr); });
      const shapes = v.lines && groups.length === 1 ? [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }] : [];
      plotDiv(cd, traces, { barmode: "overlay", xaxis: { title: v.x }, yaxis: { title: "Count" }, shapes });
    });
    if (kind === "box") dialog("Boxplot", [selNum("x", "Numeric variable"), selAny("by", "Split by (optional)", ["", "none"])], (v) => {
      const cd = card("Boxplot: " + v.x + (v.by ? " by " + v.by : ""), D.name, `<div class="say">Box from Q1 to Q3, line at the median, whiskers to the last values inside the fences, dots beyond. Dots are worth a look, not wrong.</div>`);
      const groups = v.by ? [...new Set(col(v.by))] : [null];
      plotDiv(cd, groups.map((g) => ({ y: g == null ? SW.num(col(v.x)) : SW.num(col(v.x).filter((_, i) => col(v.by)[i] === g)), type: "box", name: g == null ? v.x : String(g), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: { title: v.x }, showlegend: false });
    });
    if (kind === "dot") dialog("Dotplot", [selNum("x", "Numeric variable")], (v) => {
      const x = SW.num(col(v.x)).sort((a, b) => a - b), d = SW.describe(x), bw = d.range / 40 || 1;
      const bins = {}, ys = x.map((val) => { const b = Math.round(val / bw); bins[b] = (bins[b] || 0) + 1; return bins[b]; });
      const cd = card("Dotplot: " + v.x, `${D.name}. n = ${d.n}, mean ${fmt(d.mean)} (solid), median ${fmt(d.median)} (dashed)`, `<div class="say">One dot per observation, nothing hidden. The picture behind every summary number.</div>`);
      plotDiv(cd, [{ x, y: ys, mode: "markers", type: "scatter", marker: { size: 9, color: "#3A7CA5" } }], { yaxis: { visible: false }, xaxis: { title: v.x }, shapes: [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }] });
    });
    if (kind === "scatter") dialog("Scatterplot", [selNum("x", "Explanatory (x)"), selNum("y", "Response (y)"), { name: "line", label: "Add the least-squares line", type: "check", value: true }], (v) => {
      const r = SW.regress(col(v.x), col(v.y));
      const cd = card(`Scatterplot: ${v.y} against ${v.x}`, `${D.name}. n = ${r.n}, r = ${fmt(r.r)}${v.line ? `, line: ${v.y} = ${fmt(r.b0)} + ${fmt(r.b1)} ${v.x}` : ""}`, `<div class="say">Describe direction, form, strength, and outliers. Correlation measures linear association only, and it is not causation.</div>`);
      const traces = [{ x: r.x, y: r.y, mode: "markers", type: "scatter", name: "data", marker: { color: "#3A7CA5" } }];
      if (v.line) { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: "least squares", line: { color: "#C0392B" } }); }
      plotDiv(cd, traces, { xaxis: { title: v.x }, yaxis: { title: v.y } });
    });
  }

  // ---------------- inference ----------------
  function oneMeanUI() {
    const hasData = D.rows.length > 0;
    dialog("One mean: t interval and t test", [
      { name: "mode", label: "Input", type: "select", options: (hasData ? [["data", "from a column"]] : []).concat([["summary", "from summary statistics"]]) },
      hasData ? selNum("x", "Numeric variable") : null,
      { name: "xbar", label: "Sample mean x bar", type: "number", group: "Summary statistics" }, { name: "s", label: "Sample sd s", type: "number", group: "Summary statistics" }, { name: "n", label: "n", type: "number", group: "Summary statistics" },
      { name: "mu0", label: "Null value mu0 (leave blank for interval only)", type: "number", value: "" }, altField, confField, alphaField].filter(Boolean), (v) => {
      let xbar = v.xbar, s = v.s, n = v.n, src = "summary statistics";
      if (v.mode === "data") { const d = SW.describe(col(v.x)); xbar = d.mean; s = d.sd; n = d.n; src = `${v.x} in ${D.name}`; }
      const r = SW.oneMean({ xbar, s, n, mu0: Number.isFinite(v.mu0) ? v.mu0 : 0, alt: v.alt, conf: +v.conf });
      let html = table(["n", "x bar", "s", "SE = s / sqrt(n)", "df", "t*", "Margin", `${Math.round(r.conf * 100)}% lower`, "upper"], [[n, xbar, s, r.se, r.df, r.tstar, r.me, r.lower, r.upper]]);
      html += `<div class="formula">x bar plus or minus t* times s / sqrt(n), df = n minus 1. Sigma is not given, so t, not z.</div>`;
      html += `<div class="say">We are ${Math.round(r.conf * 100)} percent confident that the population mean is between ${fmt(r.lower)} and ${fmt(r.upper)}.</div>`;
      if (Number.isFinite(v.mu0)) {
        html += table(["H0", "Ha", "t", "df", "p-value", "Cohen's d"], [[`mu = ${v.mu0}`, `mu ${altSym(v.alt)} ${v.mu0}`, r.t, r.df, SW.fmtP(r.p), r.d]]);
        html += `<div class="formula">t = (x bar minus mu0) / (s / sqrt(n))</div>`;
        html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population mean is ${altSym(v.alt)} ${v.mu0}.` : `There is not enough evidence that the population mean is ${altSym(v.alt)} ${v.mu0}.`} The sample mean is ${fmt(xbar)}, a gap of ${fmt(xbar - v.mu0)} (${fmt(Math.abs(r.d), 2)} standard deviations).</div>`;
      }
      html += `<div class="${n >= 30 ? "ok" : "warn"}">${n >= 30 ? "n is at least 30: the t procedure is fine whatever the population shape." : "n is under 30: this needs a roughly normal population (check the histogram). Say that the assumptions are met."}</div>`;
      const cd = card("One mean (t)", src, html);
      if (Number.isFinite(v.mu0)) tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function onePropUI() {
    const hasData = D.rows.length > 0;
    dialog("One proportion: z interval and z test", [
      { name: "mode", label: "Input", type: "select", options: (hasData ? [["data", "from a column"]] : []).concat([["summary", "from counts"]]) },
      hasData ? selCat("x", "Categorical variable") : null, hasData ? { name: "succ", label: "Success level (type it exactly as in the data)", type: "text" } : null,
      { name: "xs", label: "Successes x", type: "number", group: "Counts" }, { name: "n", label: "n", type: "number", group: "Counts" },
      { name: "p0", label: "Null value p0 (blank for interval only)", type: "number", value: "" }, altField, confField, alphaField].filter(Boolean), (v) => {
      let x = v.xs, n = v.n, src = "counts";
      if (v.mode === "data") { const vals = col(v.x).filter((q) => q !== ""); n = vals.length; x = vals.filter((q) => q === v.succ).length; src = `${v.x} = ${v.succ} in ${D.name}`; if (!x) throw new Error("No rows match that success level. Check spelling and case."); }
      const r = SW.oneProp({ x, n, p0: Number.isFinite(v.p0) ? v.p0 : 0.5, alt: v.alt, conf: +v.conf });
      let html = table(["x", "n", "p hat", "SE = sqrt(p hat (1 minus p hat) / n)", "z*", "Margin", `${Math.round(r.conf * 100)}% lower`, "upper"], [[x, n, r.phat, r.se, r.zstar, r.me, r.lower, r.upper]]);
      html += `<div class="${r.condCI ? "ok" : "warn"}">Success-failure check: ${x} successes and ${n - x} failures. ${r.condCI ? "Both at least 10, the interval is allowed." : "Fewer than 10 of one kind: this course does not build a z interval here. Report the count and the proportion descriptively."}</div>`;
      html += `<div class="say">We are ${Math.round(r.conf * 100)} percent confident that the population proportion is between ${fmt(r.lower)} and ${fmt(r.upper)}.</div>`;
      if (Number.isFinite(v.p0)) {
        html += table(["H0", "Ha", "SE0 = sqrt(p0 (1 minus p0) / n)", "z", "p-value (z)", "p-value (exact binomial, what jamovi shows)"], [[`p = ${v.p0}`, `p ${altSym(v.alt)} ${v.p0}`, r.se0, r.z, SW.fmtP(r.p), SW.fmtP(r.exact)]]);
        html += `<div class="${r.condTest ? "ok" : "warn"}">Test condition: n p0 = ${fmt(n * v.p0, 1)} and n (1 minus p0) = ${fmt(n * (1 - v.p0), 1)}. ${r.condTest ? "Both at least 10." : "Below 10: use the exact binomial p-value."}</div>`;
        html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population proportion is ${altSym(v.alt)} ${v.p0}.` : `There is not enough evidence that the population proportion is ${altSym(v.alt)} ${v.p0}.`}</div>`;
      }
      const cd = card("One proportion (z)", src, html);
      if (Number.isFinite(v.p0)) zPlot(cd, r.z, v.alt);
    });
  }
  function twoMeansUI() {
    const hasData = D.rows.length > 0;
    dialog("Two independent means: Welch t", [
      { name: "mode", label: "Input", type: "select", options: (hasData ? [["data", "from a numeric column split by a group"], ["cols", "from two numeric columns"]] : []).concat([["summary", "from summary statistics"]]) },
      hasData ? selNum("x", "Numeric variable") : null, hasData ? selCat("g", "Grouping variable (two levels used)") : null, hasData ? selNum("x2", "Second column (for the two-columns option)") : null,
      { name: "m1", label: "Mean 1", type: "number", group: "Group 1" }, { name: "s1", label: "s 1", type: "number", group: "Group 1" }, { name: "n1", label: "n 1", type: "number", group: "Group 1" },
      { name: "m2", label: "Mean 2", type: "number", group: "Group 2" }, { name: "s2", label: "s 2", type: "number", group: "Group 2" }, { name: "n2", label: "n 2", type: "number", group: "Group 2" },
      altField, confField, alphaField].filter(Boolean), (v) => {
      let a, b, names = ["group 1", "group 2"], src = "summary statistics";
      if (v.mode === "data") { const lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} levels; the two-means test needs exactly two. Use a filter, or ANOVA for three or more.`); names = lv; a = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[0])); b = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[1])); src = `${v.x} by ${v.g} in ${D.name}`; }
      else if (v.mode === "cols") { a = SW.describe(col(v.x)); b = SW.describe(col(v.x2)); names = [v.x, v.x2]; src = D.name; }
      else { a = { mean: v.m1, sd: v.s1, n: v.n1 }; b = { mean: v.m2, sd: v.s2, n: v.n2 }; }
      const r = SW.twoMeans({ m1: a.mean, s1: a.sd, n1: a.n, m2: b.mean, s2: b.sd, n2: b.n, alt: v.alt, conf: +v.conf });
      let html = table(["Group", "n", "Mean", "s", "SE"], [[names[0], a.n, a.mean, a.sd, a.sd / Math.sqrt(a.n)], [names[1], b.n, b.mean, b.sd, b.sd / Math.sqrt(b.n)]]);
      html += table(["Difference (1 minus 2)", "SE = sqrt(s1^2/n1 + s2^2/n2)", "df (Welch)", "t", "p-value", `${Math.round(r.conf * 100)}% lower`, "upper", "Cohen's d"], [[r.diff, r.se, r.df, r.t, SW.fmtP(r.p), r.lower, r.upper, r.d]]);
      html += `<div class="formula">H0: mu1 = mu2. Ha: mu1 ${altSym(v.alt)} mu2. t = (x bar 1 minus x bar 2) / SE. Welch df from the two standard errors, a decimal.</div>`;
      html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${names[0]} is ${altSym(v.alt)} the mean of ${names[1]}.` : `There is not enough evidence of a difference between the mean of ${names[0]} and the mean of ${names[1]}.`} We are ${Math.round(r.conf * 100)} percent confident the difference in population means is between ${fmt(r.lower)} and ${fmt(r.upper)}.</div>`;
      html += `<div class="${a.n >= 30 && b.n >= 30 ? "ok" : "warn"}">${a.n >= 30 && b.n >= 30 ? "Both groups have n at least 30." : "A group has n under 30: needs roughly normal populations; check the boxplots and say the assumptions are met."} Groups must be independent (different people in each).</div>`;
      const cd = card("Two independent means (Welch t)", src, html); tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function pairedUI() {
    needData();
    dialog("Paired means: t on the differences", [selNum("a", "First measurement (column)"), selNum("b", "Second measurement (column)"), { name: "order", label: "Difference", type: "select", options: [["ab", "first minus second"], ["ba", "second minus first"]] }, altField, confField, alphaField], (v) => {
      const r = v.order === "ab" ? SW.paired(col(v.a), col(v.b), v) : SW.paired(col(v.b), col(v.a), v);
      const lab = v.order === "ab" ? `${v.a} minus ${v.b}` : `${v.b} minus ${v.a}`;
      let html = table(["Pairs n", "Mean difference d bar", "s of differences", "SE = s_d / sqrt(n)", "df", "t", "p-value", `${Math.round(r.conf * 100)}% lower`, "upper"], [[r.n, r.dbar, r.sd, r.se, r.df, r.t, SW.fmtP(r.p), r.lower, r.upper]]);
      html += `<div class="formula">Compute d = ${lab} for every pair, then a one-sample t on d: H0: mu_d = 0, Ha: mu_d ${altSym(v.alt)} 0.</div>`;
      html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean difference (${lab}) is ${altSym(v.alt)} 0.` : `There is not enough evidence that the mean difference (${lab}) differs from 0.`} We are ${Math.round(r.conf * 100)} percent confident the mean difference is between ${fmt(r.lower)} and ${fmt(r.upper)}.</div>`;
      html += `<div class="say">Paired because each row is one unit measured twice. Pairing removes unit-to-unit variability, which is why the SE is small.</div>`;
      const cd = card("Paired means (t)", `${lab} in ${D.name}`, html);
      plotDiv(cd, [{ x: r.differences, type: "histogram", marker: { color: "#3A7CA5", line: { color: "#fff", width: 1 } } }], { xaxis: { title: "difference: " + lab }, yaxis: { title: "Count" }, shapes: [{ type: "line", x0: 0, x1: 0, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", dash: "dash", width: 2 } }] });
    });
  }
  function twoPropsUI() {
    const hasData = D.rows.length > 0;
    dialog("Two proportions: z test and interval", [
      { name: "mode", label: "Input", type: "select", options: (hasData ? [["data", "from a categorical column split by a group"]] : []).concat([["summary", "from counts"]]) },
      hasData ? selCat("x", "Outcome variable") : null, hasData ? { name: "succ", label: "Success level (exactly as in the data)", type: "text" } : null, hasData ? selCat("g", "Grouping variable (two levels used)") : null,
      { name: "x1", label: "Successes 1", type: "number", group: "Group 1" }, { name: "n1", label: "n 1", type: "number", group: "Group 1" },
      { name: "x2", label: "Successes 2", type: "number", group: "Group 2" }, { name: "n2", label: "n 2", type: "number", group: "Group 2" },
      altField, confField, alphaField].filter(Boolean), (v) => {
      let x1 = v.x1, n1 = v.n1, x2 = v.x2, n2 = v.n2, names = ["group 1", "group 2"], src = "counts";
      if (v.mode === "data") { const lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} levels; needs exactly two.`); names = lv; const gv = col(v.g), xv = col(v.x); const inG = (l) => xv.filter((_, i) => gv[i] === l && xv[i] !== ""); n1 = inG(lv[0]).length; x1 = inG(lv[0]).filter((q) => q === v.succ).length; n2 = inG(lv[1]).length; x2 = inG(lv[1]).filter((q) => q === v.succ).length; src = `${v.x} = ${v.succ} by ${v.g} in ${D.name}`; }
      const r = SW.twoProps({ x1, n1, x2, n2, alt: v.alt, conf: +v.conf });
      let html = table(["Group", "x", "n", "p hat"], [[names[0], x1, n1, r.p1], [names[1], x2, n2, r.p2]]);
      html += table(["Difference (1 minus 2)", "Pooled p hat", "SE0 (pooled)", "z", "p-value", "SE (unpooled)", `${Math.round(r.conf * 100)}% lower`, "upper"], [[r.diff, r.pooled, r.se0, r.z, SW.fmtP(r.p), r.se, r.lower, r.upper]]);
      html += `<div class="formula">H0: p1 = p2 (pooled SE for the test). Ha: p1 ${altSym(v.alt)} p2. The interval uses the unpooled SE.</div>`;
      html += `<div class="${r.cond ? "ok" : "warn"}">Success-failure check: ${x1}/${n1 - x1} and ${x2}/${n2 - x2}. ${r.cond ? "All four counts at least 10." : "A count is below 10: this course does not run the z procedure here. Report the two proportions descriptively and say the sample is too small."}</div>`;
      html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the proportion in ${names[0]} is ${altSym(v.alt)} the proportion in ${names[1]}.` : `There is not enough evidence of a difference between the two population proportions.`} We are ${Math.round(r.conf * 100)} percent confident the difference is between ${fmt(r.lower)} and ${fmt(r.upper)}.</div>`;
      const cd = card("Two proportions (z)", src, html); zPlot(cd, r.z, v.alt);
    });
  }
  function anovaUI() {
    needData();
    dialog("One-way ANOVA", [selNum("x", "Numeric response"), selCat("g", "Grouping variable (3 or more levels)"), { name: "tukey", label: "Tukey pairwise comparisons after the F test", type: "check", value: true }, alphaField], (v) => {
      const groups = {}; col(v.g).forEach((g, i) => { if (g !== "") (groups[g] = groups[g] || []).push(col(v.x)[i]); });
      const r = SW.anova(groups);
      let html = table(["Group", "n", "Mean", "s", "SE"], r.groups.map((q) => [q.name, q.n, q.mean, q.sd, q.sd / Math.sqrt(q.n)]));
      html += table(["Source", "SS", "df", "MS", "F", "p-value"], [["Between groups", r.ssb, r.df1, r.msb, r.F, SW.fmtP(r.p)], ["Within groups", r.ssw, r.df2, r.msw, "", ""], ["Total", r.sst, r.df1 + r.df2, "", "", ""]]);
      html += `<div class="formula">H0: all group means are equal. Ha: at least one differs. F = MS between / MS within, df = (k minus 1, N minus k). R squared = SS between / SS total = ${fmt(r.r2)}.</div>`;
      html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `At least one group mean of ${v.x} differs by ${v.g}; the F test does not say which.` : `There is not enough evidence that the mean of ${v.x} differs across ${v.g}.`}</div>`;
      html += `<div class="${r.sdRatio <= 2 ? "ok" : "warn"}">Largest s over smallest s = ${fmt(r.sdRatio, 2)}. ${r.sdRatio <= 2 ? "Under 2: the equal-spread condition holds." : "Above 2: the equal-spread condition fails; read the result with caution."} Groups must be independent and roughly normal (or large).</div>`;
      if (v.tukey) html += `<h3 style="font-size:14px;margin:8px 0 2px">Tukey HSD (adjusted for all ${r.tukey.length} pairs)</h3>` + table(["Pair", "Difference", "SE", "q", "adjusted p-value", `differs at ${v.alpha}?`], r.tukey.map((t) => [`${t.a} vs ${t.b}`, t.diff, t.se, t.q, Number.isFinite(t.p) ? SW.fmtP(t.p) : "n/a", Number.isFinite(t.p) ? (t.p <= +v.alpha ? "yes" : "no") : ""]));
      const cd = card("One-way ANOVA: " + v.x + " by " + v.g, D.name, html);
      plotDiv(cd, r.groups.map((q) => ({ y: q.x, type: "box", name: q.name, boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: { title: v.x }, showlegend: false });
    });
  }
  function gofUI() {
    needData();
    dialog("Chi-square goodness of fit", [selCat("x", "Categorical variable"), { name: "props", label: "Expected proportions, one per level in the order shown after you compute (blank = equal)", type: "text", placeholder: "e.g. 0.30, 0.30, 0.25, 0.15", hint: "Levels are listed alphabetically, the same order jamovi uses." }, alphaField], (v) => {
      const c = SW.counts(col(v.x)); const keys = Object.keys(c).sort(); const obs = Object.fromEntries(keys.map((k) => [k, c[k]]));
      let props = null; if (v.props.trim()) { const ps = v.props.split(/[,\s]+/).filter(Boolean).map(Number); if (ps.length !== keys.length) throw new Error(`Levels in order: ${keys.join(", ")}. You gave ${ps.length} proportions for ${keys.length} levels.`); props = Object.fromEntries(keys.map((k, i) => [k, ps[i]])); }
      const r = SW.gof(obs, props);
      let html = table(["Level", "Observed", "Expected", "(O minus E)^2 / E", "Std. residual"], r.rows.map((q) => [q.cat, q.o, q.e, q.contrib, q.resid]));
      html += table(["Chi-square", "df", "p-value", "n", "Smallest expected"], [[r.chi, r.df, SW.fmtP(r.p), r.n, r.minE]]);
      html += `<div class="formula">H0: the population follows the stated proportions${props ? "" : " (all equal)"}. E = n times p, df = number of levels minus 1.</div>`;
      html += `<div class="${r.minE >= 5 ? "ok" : "warn"}">${r.minE >= 5 ? "Every expected count is at least 5." : "An expected count is below 5: the test is not trustworthy."}</div>`;
      html += `<div class="say">${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that ${v.x} does not follow the stated distribution.` : `There is not enough evidence that ${v.x} departs from the stated distribution; this does not prove it follows it.`}</div>`;
      const cd = card("Goodness of fit: " + v.x, D.name, html);
      plotDiv(cd, [{ x: keys, y: r.rows.map((q) => q.o), type: "bar", name: "Observed", marker: { color: "#3A7CA5" } }, { x: keys, y: r.rows.map((q) => q.e), type: "bar", name: "Expected", marker: { color: "#D97D54" } }], { barmode: "group", yaxis: { title: "Count" } });
    });
  }
  function regressUI() {
    needData();
    dialog("Correlation and regression", [selNum("x", "Explanatory (x)"), selNum("y", "Response (y)"), { name: "pred", label: "Predict y at x = (optional)", type: "number", value: "" }, confField, alphaField], (v) => {
      const r = SW.regress(col(v.x), col(v.y), +v.conf);
      let html = table(["n", "r", "r squared", "Line", "Residual s", "df"], [[r.n, r.r, r.r2, `${v.y} hat = ${fmt(r.b0)} + ${fmt(r.b1)} ${v.x}`, r.se_res, r.df]]);
      html += table(["Coefficient", "Estimate", "SE", "t", "p-value", `${Math.round(r.conf * 100)}% lower`, "upper"], [["Intercept b0", r.b0, r.seb0, r.b0 / r.seb0, SW.fmtP(2 * (1 - SW.pt(Math.abs(r.b0 / r.seb0), r.df))), r.b0 - r.tstar * r.seb0, r.b0 + r.tstar * r.seb0], [`Slope b1 (${v.x})`, r.b1, r.seb1, r.t, SW.fmtP(r.p), r.b1lower, r.b1upper]]);
      html += `<div class="formula">b1 = r s_y / s_x, b0 = y bar minus b1 x bar. Slope test: H0: beta1 = 0, t = b1 / SE(b1), df = n minus 2. The correlation test gives the same p-value: t = ${fmt(r.tr)}, p = ${SW.fmtP(r.pr)}.</div>`;
      html += `<div class="say">Slope: each one-unit increase in ${v.x} predicts a change of ${fmt(r.b1)} in ${v.y}. ${fmt(100 * r.r2, 1)} percent of the variation in ${v.y} is explained by the line. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence of a linear relationship between ${v.x} and ${v.y}.` : `There is not enough evidence of a linear relationship between ${v.x} and ${v.y}.`} Correlation is not causation.</div>`;
      if (Number.isFinite(v.pred)) { const inR = v.pred >= Math.min(...r.x) && v.pred <= Math.max(...r.x); html += `<div class="${inR ? "say" : "warn"}">Predicted ${v.y} at ${v.x} = ${v.pred}: ${fmt(r.predict(v.pred))}.${inR ? "" : " That x is outside the data range: extrapolation, do not trust it."}</div>`; }
      const cd = card(`Regression: ${v.y} on ${v.x}`, D.name, html);
      const xs = [Math.min(...r.x), Math.max(...r.x)];
      plotDiv(cd, [{ x: r.x, y: r.y, mode: "markers", type: "scatter", name: "data", marker: { color: "#3A7CA5" } }, { x: xs, y: xs.map(r.predict), mode: "lines", name: "least squares", line: { color: "#C0392B" } }], { xaxis: { title: v.x }, yaxis: { title: v.y } });
      plotDiv(cd, [{ x: r.fitted, y: r.resid, mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }], { title: "Residuals against fitted values (want a formless band around 0)", xaxis: { title: "fitted" }, yaxis: { title: "residual" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0, y1: 0, line: { color: "#1A3A4D", dash: "dash" } }] });
    });
  }

  // ---------------- test-statistic pictures ----------------
  function curvePlot(cd, xs, ys, stat, alt, title) {
    const shade = (lo, hi) => ({ x: xs.filter((x) => x >= lo && x <= hi), y: ys.filter((_, i) => xs[i] >= lo && xs[i] <= hi), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false });
    const traces = [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }];
    if (alt === "less") traces.push(shade(-Infinity, stat)); else if (alt === "greater") traces.push(shade(stat, Infinity)); else { traces.push(shade(-Infinity, -Math.abs(stat))); traces.push(shade(Math.abs(stat), Infinity)); }
    plotDiv(cd, traces, { title, xaxis: { title: "test statistic" }, yaxis: { visible: false }, shapes: [{ type: "line", x0: stat, x1: stat, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", dash: "dash" } }] });
  }
  function tPlot(cd, t, df, alt) { const lim = Math.max(4, Math.abs(t) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.studentt.pdf(x, df)), t, alt, `t distribution, df = ${fmt(df, 2)}; shaded area is the p-value`); }
  function zPlot(cd, z, alt) { const lim = Math.max(4, Math.abs(z) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.normal.pdf(x, 0, 1)), z, alt, "standard normal; shaded area is the p-value"); }

  // ---------------- calculators ----------------
  function binomCalc() {
    dialog("Binomial calculator", [{ name: "n", label: "Number of trials n", type: "number", value: 10 }, { name: "p", label: "Probability of success p", type: "number", value: 0.5 }, { name: "kind", label: "Probability", type: "select", options: [["eq", "P(X = k)"], ["le", "P(X at most k)"], ["ge", "P(X at least k)"], ["between", "P(a at most X at most b)"]] }, { name: "k", label: "k (or a)", type: "number", value: 5 }, { name: "b", label: "b (for between)", type: "number", value: "" }], (v) => {
      const { n, p } = v; let prob, label;
      if (v.kind === "eq") { prob = SW.dbinom(v.k, n, p); label = `P(X = ${v.k})`; } else if (v.kind === "le") { prob = SW.pbinom(v.k, n, p); label = `P(X <= ${v.k})`; } else if (v.kind === "ge") { prob = 1 - SW.pbinom(v.k - 1, n, p); label = `P(X >= ${v.k})`; } else { prob = SW.pbinom(v.b, n, p) - SW.pbinom(v.k - 1, n, p); label = `P(${v.k} <= X <= ${v.b})`; }
      const t = SW.binomTable(n, p);
      let html = table(["n", "p", "Mean np", "SD sqrt(np(1 minus p))", label], [[n, p, n * p, Math.sqrt(n * p * (1 - p)), prob]]);
      html += `<div class="formula">P(X = k) = C(n, k) p^k (1 minus p)^(n minus k). Conditions: binary outcome, independent trials, fixed n, same p.</div>`;
      html += `<details><summary style="cursor:pointer;color:#5A5A5A;font-size:13px">Full table</summary>${table(["k", "P(X = k)", "P(X <= k)"], t.map((q) => [q.k, q.p, q.cum]))}</details>`;
      const cd = card("Binomial", `n = ${n}, p = ${p}`, html);
      const inRange = (k) => (v.kind === "eq" ? k === v.k : v.kind === "le" ? k <= v.k : v.kind === "ge" ? k >= v.k : k >= v.k && k <= v.b);
      plotDiv(cd, [{ x: t.map((q) => q.k), y: t.map((q) => q.p), type: "bar", marker: { color: t.map((q) => (inRange(q.k) ? "#C0392B" : "#3A7CA5")) } }], { xaxis: { title: "k", dtick: 1 }, yaxis: { title: "probability" } });
    });
  }
  function normalCalc() {
    dialog("Normal calculator", [{ name: "mu", label: "Mean", type: "number", value: 0 }, { name: "sd", label: "Standard deviation", type: "number", value: 1 }, { name: "kind", label: "Find", type: "select", options: [["below", "P(X below x)"], ["above", "P(X above x)"], ["between", "P(a below X below b)"], ["q", "the value x with a given percentile"]] }, { name: "a", label: "x (or a, or percentile as a proportion)", type: "number", value: 1 }, { name: "b", label: "b (for between)", type: "number", value: "" }], (v) => {
      const z = (x) => (x - v.mu) / v.sd; let res, label, lo = -Infinity, hi = Infinity;
      if (v.kind === "below") { res = SW.pnorm(z(v.a)); label = `P(X < ${v.a})`; hi = v.a; } else if (v.kind === "above") { res = 1 - SW.pnorm(z(v.a)); label = `P(X > ${v.a})`; lo = v.a; } else if (v.kind === "between") { res = SW.pnorm(z(v.b)) - SW.pnorm(z(v.a)); label = `P(${v.a} < X < ${v.b})`; lo = v.a; hi = v.b; } else { res = v.mu + SW.qnorm(v.a) * v.sd; label = `x at the ${fmt(100 * v.a, 1)}th percentile`; hi = res; }
      let html = table(["Mean", "SD", v.kind === "q" ? "z*" : "z", label], [[v.mu, v.sd, v.kind === "q" ? SW.qnorm(v.a) : z(v.a), res]]);
      html += `<div class="formula">z = (x minus mu) / sigma. Empirical rule: 68 percent within 1 SD, 95 within 2, 99.7 within 3.</div>`;
      const cd = card("Normal", `mean ${v.mu}, sd ${v.sd}`, html);
      const xs = []; for (let x = v.mu - 4 * v.sd; x <= v.mu + 4 * v.sd; x += (8 * v.sd) / 200) xs.push(x);
      const ys = xs.map((x) => jStat.normal.pdf(x, v.mu, v.sd));
      plotDiv(cd, [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }, { x: xs.filter((x) => x >= lo && x <= hi), y: ys.filter((_, i) => xs[i] >= lo && xs[i] <= hi), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false }], { xaxis: { title: "x" }, yaxis: { visible: false } });
    });
  }
  function tCalc() {
    dialog("t distribution", [{ name: "df", label: "Degrees of freedom", type: "number", value: 20 }, { name: "kind", label: "Find", type: "select", options: [["tstar", "t* for a confidence level"], ["p", "p-value for a t statistic"]] }, { name: "conf", label: "Confidence level (as a proportion)", type: "number", value: 0.95 }, { name: "t", label: "t statistic", type: "number", value: 2 }, altField], (v) => {
      let html;
      if (v.kind === "tstar") { const ts = SW.qt(1 - (1 - v.conf) / 2, v.df); html = table(["df", "Confidence", "t*"], [[v.df, v.conf, ts]]) + `<div class="say">Use t* in x bar plus or minus t* s / sqrt(n). For comparison z* would be ${fmt(SW.qnorm(1 - (1 - v.conf) / 2))}.</div>`; }
      else { const p = SW.pvalue(v.t, v.alt, (x) => SW.pt(x, v.df)); html = table(["df", "t", "Alternative", "p-value"], [[v.df, v.t, altSym(v.alt), SW.fmtP(p)]]); }
      const cd = card("t distribution", `df = ${v.df}`, html);
      if (v.kind === "p") tPlot(cd, v.t, v.df, v.alt);
    });
  }
  function sampleSizeCalc() {
    dialog("Sample size for a margin of error", [{ name: "kind", label: "For a", type: "select", options: [["prop", "proportion"], ["mean", "mean"]] }, { name: "me", label: "Desired margin of error", type: "number", value: 0.05 }, { name: "p", label: "Guess for p (use 0.5 if unknown)", type: "number", value: 0.5 }, { name: "s", label: "Guess for s (for a mean)", type: "number", value: "" }, confField], (v) => {
      const n = v.kind === "prop" ? SW.sampleSizeProp(v.me, v.p, +v.conf) : SW.sampleSizeMean(v.me, v.s, +v.conf);
      card("Sample size", `${v.kind === "prop" ? "proportion" : "mean"}, margin ${v.me}, ${Math.round(+v.conf * 100)} percent`, table(["Needed n"], [[n]]) + `<div class="formula">${v.kind === "prop" ? "n = (z* / m)^2 p (1 minus p), rounded up." : "n = (z* s / m)^2, rounded up (z* as a planning value)."} Halving the margin needs four times the sample.</div>`);
    });
  }
  function zscoreColumn() {
    needData();
    dialog("Add a z-score column", [selNum("x", "Numeric variable")], (v) => { addColumn("z_" + v.x, SW.zscores(col(v.x))); card("New column", `z_${v.x} added to the data`, `<div class="formula">z = (x minus x bar) / s. Sign says which side of the mean; size says how many standard deviations away.</div>`); });
  }

  // ---------------- data menu ----------------
  function openFile() { $("#fileInput").click(); }
  $("#fileInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { loadTable(f.name.replace(/\.[^.]+$/, ""), parseCSV(t)); }); e.target.value = ""; });
  function pasteData() {
    dialog("Paste data", [{ name: "txt", label: "Paste from a spreadsheet or CSV (first row = column names)", type: "textarea", rows: 10 }, { name: "nm", label: "Name", type: "text", value: "pasted" }], (v) => { const rows = parseCSV(v.txt); if (rows.length < 2) throw new Error("Need a header row and at least one data row."); loadTable(v.nm || "pasted", rows); });
  }
  function sampleData() {
    dialog("Sample datasets", [{ name: "f", label: "Dataset", type: "select", options: SAMPLES }], (v) => { fetch("data/" + v.f).then((r) => r.text()).then((t) => loadTable(v.f.replace(/\.csv$/, ""), parseCSV(t))).catch(() => alert("Could not load the sample file.")); });
  }
  function newBlank() {
    dialog("New blank table", [{ name: "cols", label: "Column names, comma separated", type: "text", value: "x, y" }, { name: "n", label: "Rows", type: "number", value: 20 }], (v) => { const cols = v.cols.split(",").map((s) => s.trim()).filter(Boolean); loadTable("new", [cols].concat(Array.from({ length: v.n }, () => cols.map(() => "")))); });
  }

  // ---------------- menu ----------------
  const MENU = [
    ["Data", [["Open CSV file", openFile], ["Paste data", pasteData], ["Sample datasets", sampleData], ["New blank table", newBlank], null, ["Add z-score column", zscoreColumn], ["Download data as CSV", downloadCSV]]],
    ["Summary", [["Descriptives", descriptives], ["Frequency table", frequency], ["Two-way table (with chi-square)", twoWay]]],
    ["Graph", [["Bar chart", () => graph("bar")], ["Pie chart", () => graph("pie")], null, ["Histogram", () => graph("hist")], ["Dotplot", () => graph("dot")], ["Boxplot", () => graph("box")], null, ["Scatterplot", () => graph("scatter")]]],
    ["Inference", [["One mean: t", oneMeanUI], ["One proportion: z", onePropUI], null, ["Two independent means: Welch t", twoMeansUI], ["Paired means: t", pairedUI], ["Two proportions: z", twoPropsUI], null, ["One-way ANOVA with Tukey", anovaUI], ["Chi-square goodness of fit", gofUI], ["Chi-square test of independence", twoWay], null, ["Correlation and regression", regressUI]]],
    ["Calculators", [["Binomial", binomCalc], ["Normal", normalCalc], ["t distribution", tCalc], ["Sample size", sampleSizeCalc]]],
    ["Output", [["Print or save as PDF", () => window.print()], ["Clear all results", () => ($("#out").innerHTML = "")]]],
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
})();
