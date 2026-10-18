/* Stats Without Walls: interface. Menus, option names and result tables match the course
   instructions as written. Engine in stats.js (window.SW); jStat and Plotly vendored. */
(function () {
  const $ = (s) => document.querySelector(s);
  const D = { name: "", cols: [], rows: [], types: {}, manual: {}, filter: "", sortCol: null, sortDir: 1 };
  let CUR_FN = null, PREFILL = null, REPLACE = null, PENDING = null; // edit support: which menu function made a card, its values, and the card being replaced
  let VIEW = "data", INLINE = false, LIVE = null, LASTCARD = null; // page shown; next dialog renders in the distrACTION inputs card; the card that card updates live; newest card
  let RESUME = null, UNDO = null; // Undo clear: the live card a reopened calculator takes back; what Clear this page took away
  let DEC = 4; try { DEC = Number(localStorage.getItem("sww_dec")) || 4; } catch (e) { }
  let LAST = null; try { LAST = JSON.parse(localStorage.getItem("sww_last") || "null"); } catch (e) { } // the last visit's results, offered back after a reload
  let AUTORUN = false; // restoring: a dialog is filled in and run without opening
  let SHARED = null; // a setup carried in the address (#s=...), offered with an Open button
  const fmt = (x, d) => (typeof x === "number" && Number.isFinite(x) ? Number(x.toFixed(d == null ? DEC : d)).toString() : x == null ? "" : String(x));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Notation. The app composes its text in words (x bar, sigma, chi-square, H0) and this layer turns the words into the
  // symbols the textbook uses (x̄, σ, χ², H₀) at the moment they are printed. Results, Notation switches it back to words,
  // which read aloud better. Formula lines take every rule; sentences take only the symbol rules, so "3 times as likely"
  // and "the sum of the ranks" stay English. A column of the user's data that happens to be called alpha or mu keeps its name.
  let NOTE = "sym"; try { if (localStorage.getItem("sww_note") === "words") NOTE = "words"; } catch (e) { }
  const SUB = { 0: "\u2080", 1: "\u2081", 2: "\u2082", 3: "\u2083" }, sub = (d) => SUB[d] || d;
  const SYM_PROSE = [
    [/\bchi-square\b/gi, "\u03c7\u00b2"], [/\bWilks' lambda\b/g, "Wilks' \u039b"], [/\bpartial eta squared\b/g, "partial \u03b7\u00b2"], [/\beta squared\b/g, "\u03b7\u00b2"], [/\bomega squared\b/g, "\u03c9\u00b2"],
    [/\bR squared\b/g, "R\u00b2"], [/\br squared\b/g, "r\u00b2"], [/\bs squared\b/g, "s\u00b2"],
    [/\bx([123]) bar\b/g, (m, d) => "x\u0304" + sub(d)], [/\bx bar\b/g, "x\u0304"], [/\by bar\b/g, "y\u0304"], [/\bd bar\b/g, "d\u0304"],
    [/\bp([12]) hat\b/g, (m, d) => "p\u0302" + sub(d)], [/\bp hat\b/g, "p\u0302"], [/\by hat\b/g, "y\u0302"],
    [/\bsigmas known\b/g, "\u03c3\u2081, \u03c3\u2082 known"], [/\bsigma([012])\b/g, (m, d) => "\u03c3" + sub(d)], [/\b[Ss]igma\b/g, "\u03c3"],
    [/\bmu([012])\b/g, (m, d) => "\u03bc" + sub(d)], [/\b[Mm]u\b/g, "\u03bc"], [/\b[Aa]lpha\b/g, "\u03b1"],
    [/\bbeta([012])\b/g, (m, d) => "\u03b2" + sub(d)], [/\bbeta\b/g, "\u03b2"], [/\blambda\b/g, "\u03bb"], [/\brho\b/g, "\u03c1"], [/\btheta\b/g, "\u03b8"], [/\bepsilon\b/g, "\u03b5"], [/\binfinity\b/g, "\u221e"],
    [/\bH0\b/g, "H\u2080"], [/\bHa\b(?=[:\s])/g, "H\u2090"], [/\bH1\b(?=[:\s])/g, "H\u2081"],
    [/\bplus or minus\b/g, "\u00b1"], [/\bnot equal to\b/g, "\u2260"], [/\bnot equal\b/g, "\u2260"], [/\bless than or equal to\b/g, "\u2264"], [/\bgreater than or equal to\b/g, "\u2265"],
    [/\b([bpn])([012])\b(?=\s*[=\u2260<>+)(,.]|\s+(?:hat|bar)\b|$)/g, (m, l, d) => l + sub(d)], [/\^2\b/g, "\u00b2"], [/\^3\b/g, "\u00b3"], [/\bsqrt\(/g, "\u221a("]];
  const SYM_FORMULA = SYM_PROSE.concat([[/\bSum of Squares\b/g, "SS"], [/\bMean Square\b/g, "MS"], [/ minus /g, " \u2212 "], [/ times /g, " \u00d7 "], [/\bsum of /g, "\u03a3 "], [/\bb([012])\b/g, (m, d) => "b" + sub(d)], [/\bn([12])\b/g, (m, d) => "n" + sub(d)]]);
  const sym = (s, formula) => {
    if (NOTE === "words" || s == null) return s;
    let t = String(s); const keep = [];
    D.cols.forEach((c) => { if (c && SYM_PROSE.some(([re]) => { re.lastIndex = 0; return re.test(c); })) { const k = "\u0000" + keep.length + "\u0000"; keep.push(c); t = t.split(c).join(k); } });
    (formula ? SYM_FORMULA : SYM_PROSE).forEach(([re, to]) => { re.lastIndex = 0; t = t.replace(re, to); });
    keep.forEach((c, i) => { t = t.split("\u0000" + i + "\u0000").join(c); });
    return t;
  };
  const escA = (s) => esc(s).replace(/"/g, "&quot;"); // inside an attribute
  // Ha standing alone (a dialog label, a column header) has no colon or space after it, so the H0 and Ha rule above leaves it
  // as is; a label or header that names it alone asks here, and follows Results, Notation the same way
  const haWord = () => (NOTE === "words" ? "Ha" : "H\u2090");
  // Column names, level labels, cells, file names and typed titles are the user's text: they go into the page through esc
  // (or textContent), never as markup. To read the plain text of a bit of HTML, it is parsed in a separate, inert document,
  // never in this page, so nothing in it can load or run.
  const PARSER = new DOMParser();
  const plainText = (h) => { const s = String(h == null ? "" : h); return /[<&]/.test(s) ? PARSER.parseFromString(s, "text/html").documentElement.textContent : s; };
  // ---- accessibility helpers: one quiet screen reader announcer, and moving focus to a heading or a field
  const coarse = () => matchMedia("(pointer: coarse)").matches; // phones and iPads: never pop the keyboard up by moving focus into a box
  let sayT = null;
  // the answer line of a card ("P(X ≤ 67) = 0.8849 about 88.5%"): all a screen reader hears when a live result changes
  const headline = (cd) => { const b = cd && (cd.querySelector(".big") || cd.querySelector(".words") || cd.querySelector("h2")); return b ? b.textContent.replace(/\s+/g, " ").trim() : ""; };
  function announce(text, delay = 0) { const r = $("#srsay"); if (!r) return; clearTimeout(sayT); sayT = setTimeout(() => { r.textContent = ""; sayT = setTimeout(() => { r.textContent = text || ""; }, 60); }, delay); }
  // a heading that takes focus shows the ring only when the student is using the keyboard (a tap or click gives no box round it)
  let KB = false; addEventListener("keydown", () => (KB = true), true); addEventListener("pointerdown", () => (KB = false), true);
  function focusTo(el, scroll) { if (!el || !el.isConnected) return false; if (!el.matches("a[href],button,input,select,textarea,[tabindex]")) el.setAttribute("tabindex", "-1"); if (!el.matches("a[href],button,input,select,textarea")) el.classList.toggle("quietfocus", !KB); el.focus({ preventScroll: !scroll }); return document.activeElement === el; }

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
    // null-prototype maps: a column named like a built-in property (constructor, toString, valueOf, __proto__) gets a real
    // type, not an inherited function or the prototype (which printed "undefined" under the name and broke the type menu)
    D.types = Object.create(null);
    D.manual = D.manual && Object.getPrototypeOf(D.manual) === null ? D.manual : Object.assign(Object.create(null), D.manual || {});
    D.cols.forEach((c, j) => {
      if (D.manual[c]) { D.types[c] = D.manual[c]; return; } // a type the user set by hand is kept
      const vals = D.rows.map((r) => r[j]).filter((v) => v !== "" && v != null);
      const nums = vals.filter((v) => Number.isFinite(Number(v)));
      const distinct = new Set(vals).size;
      if (!vals.length) D.types[c] = "nominal";
      else if (/(^|_)(zip|zipcode|postal|phone|ssn|id|code|number|num|no)$|^(zip|id)/i.test(String(c).replace(/\s+/g, "_"))) D.types[c] = distinct === vals.length ? "id" : "nominal";
      else if (nums.length === vals.length) D.types[c] = distinct <= 6 && vals.every((v) => Number.isInteger(Number(v))) ? "ordinal" : "continuous";
      else D.types[c] = distinct === vals.length && vals.length > 12 ? "id" : "nominal";
    });
  }
  function loadTable(name, rows, origin = "own") {
    D.origin = origin; D.name = name; D.cols = rows[0].map((h, i) => (h.trim() || "col" + (i + 1)));
    D.rows = rows.slice(1).map((r) => D.cols.map((_, j) => (r[j] == null ? "" : String(r[j]).trim())));
    D.filter = ""; D.sortCol = null; D.restored = false; inferTypes(); renderGrid(); persist();
  }
  // The browser remembers the user's own data (a file, pasted or typed data, simulated data) between visits.
  // A sample dataset is never remembered, so the app always opens with an empty table unless the data are yours.
  // a sample dataset is never remembered while it is untouched; once the student changes it (an edited cell, a new, renamed or
  // deleted column, a type set by hand, a stack or a random sample) it is their own work and is remembered like a file.
  // A filter (like a sort) is a view of the data, not a change to it, so it never makes a sample the student's own: with the
  // share link and Restore applying filters all the time, the class data kept coming back as "remembered from your last visit".
  function changed() { if (D.origin === "sample") D.origin = "own"; persist(); }
  function persist() { try { if (D.origin === "sample") localStorage.removeItem("sww_data"); else localStorage.setItem("sww_data", JSON.stringify({ name: D.name, cols: D.cols, rows: D.rows, filter: D.filter, manual: D.manual || {}, origin: "own" })); } catch (e) { } }
  // Copies stored before 2026-10-14 (the remembered table, and .sww.json session files) carry no origin. A student's own
  // download of a Canvas file has the same name as the sample dataset, so the name alone never decides. An old copy counts
  // as a sample dataset only when it is untouched: a sample's exact name, no filter, no type set by hand on its columns,
  // and the same columns and rows as the sample file (row order aside: sorting changes no value). Anything else (a new
  // column, an edited cell, a random sample of rows) is the user's own data and is kept. If the file cannot be read, it is kept.
  const sampleFileFor = (name) => { const s = SAMPLES.find(([f]) => f.replace(/\.csv$/, "") === name); return s ? s[0] : null; };
  function untouchedSample(s) {
    const f = sampleFileFor(s.name), manual = s.manual || {};
    if (!f || !Array.isArray(s.cols) || !Array.isArray(s.rows) || s.cols.some((c) => Object.prototype.hasOwnProperty.call(manual, c) && manual[c])) return Promise.resolve(false);
    return fetch("data/" + f).then((r) => (r.ok ? r.text() : Promise.reject(new Error("no file")))).then((t) => {
      const rows = parseCSV(t), cols = rows[0].map((h, i) => h.trim() || "col" + (i + 1));
      if (JSON.stringify(cols) !== JSON.stringify(s.cols) || rows.length - 1 !== s.rows.length) return false;
      const key = (r) => JSON.stringify(cols.map((_, j) => (r[j] == null ? "" : String(r[j]).trim())));
      const a = rows.slice(1).map(key).sort(), b = s.rows.map(key).sort();
      return a.every((x, i) => x === b[i]);
    }).catch(() => false);
  }
  // A record from localStorage or a session file may have been hand-edited or saved by another tool: a name that is a
  // number, a cell that is null, a row that is not a list. Everything the table and the type labels use is forced to a
  // string (a name to its text, each cell to its text) and each row to the right length, so no later step meets a non-string.
  function normalizeData(s) {
    const cols = (Array.isArray(s.cols) ? s.cols : []).map((h, i) => { const t = h == null ? "" : String(h).trim(); return t || "col" + (i + 1); });
    const rows = (Array.isArray(s.rows) ? s.rows : []).filter((r) => Array.isArray(r)).map((r) => cols.map((_, j) => (r[j] == null ? "" : String(r[j]).trim())));
    const manual = Object.create(null); if (s.manual && typeof s.manual === "object") for (const c of cols) { const v = Object.prototype.hasOwnProperty.call(s.manual, c) ? s.manual[c] : null; if (v === "continuous" || v === "ordinal" || v === "nominal" || v === "id") manual[c] = v; }
    return { name: s.name == null ? "" : String(s.name), cols, rows, filter: typeof s.filter === "string" ? s.filter : "", manual };
  }
  function showRemembered(s) { try { const d = normalizeData(s); const keep = plainFormula(d.filter, d.cols, d.rows); D.origin = "own"; D.restored = true; D.name = d.name; D.cols = d.cols; D.rows = d.rows; D.filter = keep ? d.filter : ""; D.manual = d.manual; inferTypes(); renderGrid(); if (d.filter && !keep) persist(); } catch (e) { } }
  function restore() {
    let raw = null, s = null;
    try { raw = localStorage.getItem("sww_data"); s = JSON.parse(raw || "null"); } catch (e) { return; }
    if (!s || !Array.isArray(s.rows) || !s.rows.length || !Array.isArray(s.cols)) return;
    if (s.origin === "sample") { try { localStorage.removeItem("sww_data"); } catch (e) { } return; }
    if (!sampleFileFor(s.name)) return showRemembered(s);
    // a copy under a sample's exact name (whatever origin it was stored with: a filter used to turn a sample into the user's
    // own): the table stays empty until the copy is compared with the sample file, and an untouched copy is forgotten
    untouchedSample(s).then((same) => {
      let now = null; try { now = localStorage.getItem("sww_data"); } catch (e) { }
      if (D.rows.length || now !== raw) return; // other data was opened in the meantime
      if (same) { try { localStorage.removeItem("sww_data"); } catch (e) { } }
      else { showRemembered(s); persist(); } // stored again as the user's own, so the next visit restores it at once
    });
  }
  // active rows: those passing the filter
  function activeIdx() {
    let idx;
    if (!D.filter.trim()) idx = D.rows.map((_, i) => i);
    else { let f; try { f = SW.compileFormula(D.filter, D.cols, (c) => D.rows.map((r) => r[D.cols.indexOf(c)])); } catch (e) { throw new Error("Filter could not be read: " + e.message); } idx = []; D.rows.forEach((r, i) => { try { if (f(r)) idx.push(i); } catch (e) { } }); }
    if (FACET) { const j = D.cols.indexOf(FACET.col); if (j >= 0) idx = idx.filter((i) => FACET.key(D.rows[i][j]) === FACET.level); } // one panel of a small-multiples graph
    return idx;
  }
  function col(name) { const j = D.cols.indexOf(name); if (j < 0) throw new Error("Column not found: " + name); const idx = activeIdx(); return idx.map((i) => D.rows[i][j]); }
  const isNum = (c) => D.types[c] === "continuous" || D.types[c] === "ordinal";
  function numCols() { return D.cols.filter(isNum); }
  function catCols() { return D.cols.filter((c) => D.types[c] === "nominal" || D.types[c] === "ordinal"); }
  const TYPE_LABEL = { continuous: "ruler, continuous", ordinal: "ordinal", nominal: "nominal", id: "ID" };
  function gridInfo() {
    const act = D.filter.trim() ? (() => { try { return activeIdx().length; } catch (e) { return "?"; } })() : D.rows.length;
    $("#dsinfo").textContent = D.rows.length ? `${D.rows.length} rows, ${D.cols.length} columns${D.filter.trim() ? `, filter keeps ${act}` : ""}${D.restored ? ", remembered from your last visit" : ""}` : "";
  }
  // after a cell edit the types are guessed again: the label under each column name, the greyed (filtered out) rows and the
  // row count follow in place. Rebuilding the table would lose the cell the student just tabbed or tapped into.
  function refreshGridMeta() {
    const g = $("#grid");
    g.querySelectorAll("small.ty").forEach((sm) => { const t = TYPE_LABEL[D.types[sm.dataset.col]]; if (t) { sm.textContent = t + " \u25BE"; const b = sm.closest(".tybtn"); if (b) b.setAttribute("aria-label", `${sm.dataset.col} type: ${t}. Change the type`); } });
    if (D.filter.trim()) { let keep = null; try { keep = new Set(activeIdx()); } catch (e) { } g.querySelectorAll("tbody tr").forEach((tr, i) => tr.classList.toggle("off", !!keep && !keep.has(i))); }
    gridInfo();
  }
  function renderGrid() {
    $("#dsname").textContent = D.name || "No data loaded";
    gridInfo();
    $("#filterBox").value = D.filter; filterMsg("");
    $("#datapane").classList.toggle("nodata", !D.rows.length);
    const g = $("#grid"), hadFocus = g.contains(document.activeElement); if (!D.rows.length) { g.innerHTML = emptyState(); wireEmpty(g); return; }
    // the column name is a button that sorts (aria-sort says how); under it, with a gap, the type is its own button.
    // Keyboard: the table is one Tab stop; arrow keys and Enter move inside it (see gridKeys).
    const sorted = (c) => (D.sortCol === c && D.order0Of === D.rows ? (D.sortDir > 0 ? "ascending" : "descending") : null);
    let h = `<table class="grid" aria-label="${escA(D.name || "Data")}: ${D.rows.length} rows, ${D.cols.length} columns" aria-describedby="gridHelp"><thead><tr><th><span class="sr-only">Row</span></th>` + D.cols.map((c) => { const so = sorted(c), t = TYPE_LABEL[D.types[c]]; return `<th data-col="${escA(c)}"${so ? ` aria-sort="${so}"` : ""}><button type="button" class="sortbtn" tabindex="-1" data-col="${escA(c)}" title="Sort by ${escA(c)}. Click again to reverse; a third click puts the rows back in their first order.">${esc(c)}${so ? `<span class="arr" aria-hidden="true">${so === "ascending" ? "&#9650;" : "&#9660;"}</span>` : ""}</button><button type="button" class="tybtn" tabindex="-1" data-col="${escA(c)}" aria-haspopup="menu" aria-expanded="false" aria-label="${escA(c)} type: ${escA(t)}. Change the type" title="Change the type"><small class="ty" data-col="${escA(c)}">${t} &#9662;</small></button></th>`; }).join("") + "</tr></thead><tbody>";
    let keep = null; try { keep = new Set(activeIdx()); } catch (e) { }
    D.rows.forEach((r, i) => { h += `<tr class="${keep && !keep.has(i) ? "off" : ""}"><td class="rn">${i + 1}</td>` + r.map((v, j) => `<td contenteditable tabindex="-1" data-i="${i}" data-j="${j}">${esc(v)}</td>`).join("") + "</tr>"; });
    g.innerHTML = h + '</tbody></table><div id="gridHelp" class="sr-only">Arrow keys and Enter move between cells; type to change a value, Escape puts it back. Tab moves on past the table, except right after you type in a cell, when it goes to the next cell. Arrow up from the first row reaches the column names: Enter on a name sorts by it, Enter on a type changes the type.</div>';
    g.querySelectorAll("td[contenteditable]").forEach((td) => td.addEventListener("blur", () => { const v = td.textContent.trim(), r = D.rows[+td.dataset.i]; if (!r || r[+td.dataset.j] === v) return; r[+td.dataset.j] = v; inferTypes(); refreshGridMeta(); changed(); }));
    g.querySelectorAll(".sortbtn").forEach((b) => (b.onclick = () => sortBy(b.dataset.col)));
    g.querySelectorAll(".tybtn").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); typePicker(b, b.dataset.col); }));
    const home = gridAt(GRIDPOS[0], GRIDPOS[1]) || gridAt(0, 0); if (home) { home.setAttribute("tabindex", "0"); if (hadFocus) home.focus({ preventScroll: true }); }
  }
  // ---- the data table by keyboard: one Tab stop (roving tabindex), arrows and Enter inside, the spreadsheet Tab after typing
  let GRIDPOS = [0, 0]; // [row, column] of the table's one Tab stop; row -2 is the column name, -1 the type button
  function gridAt(i, j) { const g = $("#grid"); if (i < 0) { const th = g.querySelectorAll("thead th[data-col]")[j]; return th ? th.querySelector(i === -2 ? ".sortbtn" : ".tybtn") : null; } return g.querySelector(`td[data-i="${i}"][data-j="${j}"]`); }
  function gridPos(el) { if (!el || !el.closest) return null; if (el.matches("td[data-i]")) return [+el.dataset.i, +el.dataset.j]; const th = el.closest("th[data-col]"); if (!th || !el.matches(".sortbtn,.tybtn")) return null; return [el.classList.contains("sortbtn") ? -2 : -1, [...th.parentNode.querySelectorAll("th[data-col]")].indexOf(th)]; }
  (function gridKeys() {
    const g = $("#grid"); let typed = null;
    const caret = (td) => { const sel = getSelection(); if (!sel.rangeCount) return null; const r = sel.getRangeAt(0); if (!td.contains(r.startContainer)) return null; const pre = document.createRange(); pre.selectNodeContents(td); pre.setEnd(r.startContainer, r.startOffset); const at = pre.toString().length, len = td.textContent.length; return { at, end: at + r.toString().length, len, all: len > 0 && r.toString().length === len }; };
    const go = (el) => { if (!el) return false; el.focus(); if (el.matches("td")) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } return true; };
    g.addEventListener("focusin", (e) => { const p = gridPos(e.target); if (!p) return; g.querySelectorAll('table.grid [tabindex="0"]').forEach((x) => { if (x !== e.target) x.setAttribute("tabindex", "-1"); }); e.target.setAttribute("tabindex", "0"); GRIDPOS = p; if (e.target.matches("td")) typed = null; });
    g.addEventListener("input", (e) => { const td = e.target.closest && e.target.closest("td[data-i]"); if (td) typed = td; });
    g.addEventListener("keydown", (e) => {
      const el = e.target, p = gridPos(el); if (!p || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
      const [i, j] = p, nr = D.rows.length, nc = D.cols.length, k = e.key, td = el.matches("td") ? el : null;
      const move = (a, b) => { if (go(gridAt(a, b))) e.preventDefault(); };
      if (k === "ArrowDown") { if (i === -2) move(-1, j); else if (i === -1) move(0, j); else if (i < nr - 1) move(i + 1, j); else e.preventDefault(); }
      else if (k === "ArrowUp") { if (i === -1) move(-2, j); else if (i >= 0) move(i === 0 ? -1 : i - 1, j); else e.preventDefault(); }
      else if (k === "ArrowLeft" || k === "ArrowRight") {
        const right = k === "ArrowRight";
        if (td) { const c = caret(td); if (c && !c.all && !(right ? c.end >= c.len && c.at === c.end : c.at === 0 && c.end === 0)) return; } // the caret still has room to move inside the text
        const b = j + (right ? 1 : -1); if (b >= 0 && b < nc) move(i, b); else e.preventDefault();
      }
      else if (k === "Enter" && td) { e.preventDefault(); const a = i + (e.shiftKey ? -1 : 1); if (a >= 0 && a < nr) go(gridAt(a, j)); else go(td); }
      else if (k === "Escape" && td) { const r = D.rows[i]; if (r && td.textContent !== r[j]) { td.textContent = r[j]; typed = null; } go(td); e.preventDefault(); }
      else if (k === "Tab" && td && typed === td) { // right after typing: the next cell, as in a spreadsheet; otherwise Tab leaves the table
        let a = i, b = j + (e.shiftKey ? -1 : 1); if (b >= nc) { a++; b = 0; } else if (b < 0) { a--; b = nc - 1; }
        if (a >= 0 && a < nr) move(a, b);
      }
    });
  })();
  function typePicker(anchor, c) { // inline menu under the column name, the same job as a data setup panel
    document.querySelectorAll(".typemenu").forEach((m) => (m._close ? m._close() : m.remove()));
    const m = document.createElement("div"); m.className = "typemenu"; m.setAttribute("role", "menu"); m.setAttribute("aria-label", "Type of " + c);
    const opts = [["continuous", "Continuous (ruler): numbers you can average"], ["ordinal", "Ordinal: ordered categories"], ["nominal", "Nominal: names, no order"], ["id", "ID: a label, never analysed"]];
    m.innerHTML = `<div class="tm-title" aria-hidden="true">${esc(c)}</div>` + opts.map(([k, l]) => `<button type="button" role="menuitemradio" aria-checked="${D.types[c] === k}" class="tm-opt${D.types[c] === k ? " on" : ""}" data-k="${k}">${l}</button>`).join("") + `<button type="button" role="menuitem" class="tm-opt tm-auto" data-k="">Back to automatic</button>`;
    const r = anchor.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 300)) + "px"; m.style.top = r.bottom + 4 + "px";
    document.body.appendChild(m); anchor.setAttribute("aria-expanded", "true");
    const chip = () => [...document.querySelectorAll("#grid .tybtn")].find((b) => b.dataset.col === c);
    const close = (back) => { if (!m.isConnected) return; m.remove(); const b = chip(); if (b) { b.setAttribute("aria-expanded", "false"); if (back) b.focus({ preventScroll: true }); } };
    m._close = close;
    const its = [...m.querySelectorAll(".tm-opt")];
    its.forEach((o) => (o.onclick = (e) => { e.stopPropagation(); const k = o.dataset.k; if (k) D.manual[c] = k; else delete D.manual[c]; inferTypes(); renderGrid(); changed(); m.remove(); const b = chip(); if (b) b.focus({ preventScroll: true }); announce(`${c} type: ${TYPE_LABEL[D.types[c]]}.`); }));
    m.addEventListener("keydown", (e) => {
      const i = its.indexOf(document.activeElement);
      if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); close(true); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); its[(i + (e.key === "ArrowDown" ? 1 : its.length - 1) + (i < 0 && e.key === "ArrowUp" ? 1 : 0)) % its.length].focus(); }
      else if (e.key === "Home" || e.key === "End") { e.preventDefault(); its[e.key === "Home" ? 0 : its.length - 1].focus(); }
    });
    m.addEventListener("focusout", (e) => { if (e.relatedTarget && !m.contains(e.relatedTarget)) close(false); });
    (m.querySelector(".tm-opt.on") || its[0]).focus({ preventScroll: true });
    setTimeout(() => document.addEventListener("click", () => close(false), { once: true }), 0);
  }
  // click a column name to sort, again to reverse, a third time for the order the rows had before any sorting
  function sortBy(c) {
    const j = D.cols.indexOf(c);
    if (D.order0Of !== D.rows) { D.sortCol = null; D.order0 = null; } // other data since the last sort
    if (D.sortCol === c && D.sortDir < 0 && D.order0) {
      const have = new Set(D.rows), was = new Set(D.order0);
      const back = D.order0.filter((r) => have.has(r)).concat(D.rows.filter((r) => !was.has(r)));
      D.rows.splice(0, D.rows.length, ...back); D.sortCol = null; D.sortDir = 1;
      renderGrid(); persist(); announce("Rows back in their first order."); return;
    }
    if (D.sortCol == null) { D.order0 = D.rows.slice(); D.order0Of = D.rows; }
    D.sortDir = D.sortCol === c ? -D.sortDir : 1; D.sortCol = c;
    const numeric = isNum(c);
    D.rows.sort((a, b) => { const x = a[j], y = b[j]; if (x === "") return 1; if (y === "") return -1; return (numeric ? Number(x) - Number(y) : String(x).localeCompare(String(y))) * D.sortDir; });
    renderGrid(); persist(); announce(`Sorted by ${c}, ${numeric ? (D.sortDir > 0 ? "smallest first" : "largest first") : D.sortDir > 0 ? "A to Z" : "Z to A"}.`);
  }
  function addColumn(name, values) { if (D.cols.includes(name)) throw new Error("A column named " + name + " already exists."); D.cols.push(name); D.rows.forEach((r, i) => r.push(values[i] == null || values[i] === "" || Number.isNaN(values[i]) ? "" : typeof values[i] === "number" ? fmt(values[i], 4) : String(values[i]))); inferTypes(); renderGrid(); changed(); }
  function downloadText(txt, filename, type = "text/plain") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = filename; a.click(); }
  function downloadCSV() { const q = (v) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v); downloadText([D.cols.map(q).join(",")].concat(D.rows.map((r) => r.map(q).join(","))).join("\n"), (D.name || "data") + ".csv", "text/csv"); }
  const SAMPLES = [
    ["STATC1000_Class_Data.csv", "Our class data (40 students)"], ["STATC1000_Sleep_Followup.csv", "Sleep follow-up (paired)"], ["sleepstudy.csv", "Sleep deprivation: reaction time by day within 18 subjects (lme4 sleepstudy, 180 rows)"], ["ships.csv", "Ship damage incidents by type, year built, period and months of service (MASS ships, 40 rows; a rate with an offset)"],
    ["Dataset1_Finch_Beaks.csv", "Galapagos finches (300 birds)"], ["Dataset4_Global_Health.csv", "Global health (50 countries)"],
    ["popp_calls_for_service.csv", "Calls for service (240 calls)"], ["popp_academy_fitness.csv", "Academy fitness (60 cadets)"], ["popp_community_survey.csv", "Community survey (180 residents)"], ["STATC1000_Class_Data_Exam1.csv", "Class data with Exam 1 scores (lab M8)"],
    ["yrbs2023_teens_1500.csv", "CDC teen survey 2023: marijuana, sleep, grades, mood (1500 students)"], ["gss2018_beliefs_politics.csv", "General Social Survey 2018: astrology, science, politics (2348 adults)"], ["gss2022_politics_wellbeing.csv", "General Social Survey 2022: politics and wellbeing (3544 adults)"], ["big5_personality_1200.csv", "Big Five personality (1200 respondents)"], ["cadet_mile_times.csv", "Cadet mile times at weeks 1, 4, 8, 12, two groups (repeated measures)"], ["mauna_loa_co2_monthly.csv", "NOAA Mauna Loa monthly CO2, 2000 to 2026 (time series)"], ["big5_items_500.csv", "Big Five, 50 raw items, 500 respondents (reliability, factor analysis)"], ["lung_cancer_survival.csv", "Lung cancer survival, 227 patients (survival analysis)"], ["darfur.csv", "Darfur survey (Hazlett 2020): violence and support for peace, 1276 refugees (sensitivity to a lurking variable)"]];

  // ================= output =================
  let cardN = 0;
  let TARGET = "#out";
  const narrow = () => matchMedia("(max-width:900px)").matches; // iPad portrait and phones: the page scrolls, results sit below the table or the inputs
  const toView = (el) => requestAnimationFrame(() => { if (el && el.isConnected) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  function showTab(name) { document.querySelectorAll(".tabs .tab").forEach((b) => { b.classList.toggle("active", b.dataset.tab === name); b.setAttribute("aria-selected", String(b.dataset.tab === name)); }); $("#out").classList.toggle("active", name === "analyses"); $("#outG").classList.toggle("active", name === "graphs"); document.querySelectorAll("#outG .plot").forEach((p) => { try { Plotly.Plots.resize(p); } catch (e) { } }); retick(); }
  function counts() {
    $("#cntA").textContent = $("#out").children.length || ""; $("#cntG").textContent = $("#outG").children.length || ""; const lp = $("#learnPick"), any = $("#outL").children.length > 0; if (lp) lp.style.display = any ? "none" : ""; const ls = $("#learnSwitch"); if (ls) ls.style.display = any ? "block" : "none";
    // Clear this page shows only when the page has something to clear; Undo clear shows in its place right after a clear
    const tc = $("#toolClear"), tu = $("#toolUndo"), undo = !!(UNDO && UNDO.view === VIEW);
    if (tc) tc.style.display = !undo && ((VIEW === "learn" && any) || (VIEW === "distraction" && ($("#outD").children.length > 0 || $("#distForm").children.length > 0))) ? "" : "none";
    if (tu) tu.style.display = undo ? "" : "none";
    autosave();
  }
  function card(title, meta, html) {
    if (CAPTURE) { const d = document.createElement("div"); d.innerHTML = `<h2>${esc(title)}</h2>`; return d; } // a small-multiples panel: no card, only the graph is kept
    html = String(html).replace(/(<div class="note">)([\s\S]*?)(<\/div>)/g, (m, a, b, c) => a + sym(b) + c);
    const div = document.createElement("div"); div.className = "card"; div.id = "card" + ++cardN;
    const t = escA(title); // each button names its card, so a screen reader's list of buttons is not a row of "edit, copy text, remove"
    div.innerHTML = `<div class="tools">${PENDING && PENDING.fn ? `<button type="button" data-act="edit" aria-label="Edit: ${t}" title="Reopen this analysis with the same choices, change anything, run again">edit</button>` : ""}<button type="button" data-act="copy" aria-label="Copy text: ${t}">copy text</button><button type="button" data-act="close" aria-label="Remove: ${t}">remove</button></div><h2>${esc(title)}</h2><div class="meta">${esc(meta)}</div>${html}`;
    if (MODE.who === "researcher" && TARGET === "#out") { // same card, different order: tables, APA line, conclusion, then the method folded away
      const kids = [...div.children], method = kids.filter((k) => k.matches(".formula, details.worked"));
      if (method.length) { const det = document.createElement("details"); det.className = "method"; det.innerHTML = "<summary>Method: formula and worked numbers</summary>"; method.forEach((m) => det.appendChild(m)); const last = kids.filter((k) => k.matches(".say, .ok, .warn, .apa")).pop(); if (last) last.after(det); else div.appendChild(det); }
    }
    div.querySelector('[data-act="close"]').onclick = () => removeCard(div);
    if (TARGET === "#out" && typeof botTip === "function") setTimeout(() => botTip(div), 0);
    div.querySelector('[data-act="copy"]').onclick = (e) => copyCard(div, e.currentTarget);
    if (PENDING && PENDING.fn) { div._redo = { fn: PENDING.fn, values: Object.assign({}, PENDING.values), target: TARGET, title: PENDING.title, fields: PENDING.fields }; div.querySelector('[data-act="edit"]').onclick = () => editCard(div); }
    LASTCARD = div; const onData = TARGET === "#out" || TARGET === "#outG";
    if (UNDO && UNDO.pane === TARGET) UNDO = null;
    const reveal = TARGET !== "#outD" && narrow(); // the distrACTION inputs card shows its own live answer instead
    if (onData && document.body.classList.contains("tablewide")) setWide(false); // the results come back for a new result
    if (REPLACE && REPLACE.isConnected) { REPLACE.before(div); REPLACE._last = div; if (onData) showTab(TARGET === "#outG" ? "graphs" : "analyses"); counts(); if (reveal) toView(div); return div; }
    const out = $(TARGET); out.prepend(div); out.scrollTop = 0; if (!onData) { const sc = out.closest(".toolscroll"); if (sc) sc.scrollTop = 0; } if (onData) showTab(TARGET === "#outG" ? "graphs" : "analyses"); counts(); if (reveal) toView(div); return div;
  }
  // remove a card; keyboard focus goes to the next card's heading (or the page), not lost to the top of the page
  function removeCard(div) {
    const pane = div.parentNode, nx = [div.nextElementSibling, div.previousElementSibling].find((x) => x && x.classList.contains("card"));
    div.remove(); counts();
    if (nx) focusTo(nx.querySelector("h2")); else focusTo(pane && pane.id === "out" ? $("#tabA") : pane && pane.id === "outG" ? $("#tabG") : $("#toolTitle"));
  }
  // copy text: the card's words and tables without its buttons and graphs, then a short "Copied" on the button and for screen readers
  function copyCard(div, b) {
    div.classList.add("copying"); const txt = div.innerText.trim(); div.classList.remove("copying");
    clipText(txt, b, "copy text", "the text of " + ((div.querySelector("h2") || {}).textContent || "the result"));
  }
  // put text on the clipboard; the button says Copied (or Copy failed) for a moment and goes back to its label
  function clipText(txt, b, label, what) {
    const done = (ok) => { b.textContent = ok ? "Copied" : "Copy failed"; announce(ok ? "Copied " + what + "." : "Copy failed. Select the text and copy it by hand."); clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = label; }, ok ? 1500 : 3000); };
    const byHand = () => { let ok = false; try { const ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove(); } catch (e) { } b.focus({ preventScroll: true }); done(ok); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => done(true), byHand); else byHand();
  }
  function editCard(div) { // StatCrunch-style edit: same dialog, previous choices filled in, result replaces this card
    const r = div._redo; if (!r) return; CUR_FN = r.fn; PREFILL = r.values; REPLACE = div; const prev = TARGET; TARGET = r.target || "#out";
    INLINE = TARGET === "#outD" && DIST_ITEMS.some((it) => it[1] === r.fn); // a distrACTION calculator card reopens in the inputs card and then updates live
    try { r.fn(); } catch (err) { alert(err.message || err); } finally { TARGET = prev; INLINE = false; }
  }
  function table(headers, rows, caption) {
    return (caption ? `<div class="cap">${sym(esc(caption), true)}</div>` : "") + `<table class="res"><thead><tr>${headers.map((h) => `<th>${sym(esc(h), true)}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((r) => `<tr>${r.map((v, i) => `<td class="${i ? "num" : ""}">${typeof v === "number" ? fmt(v) : i ? esc(v) : sym(esc(v), true)}</td>`).join("")}</tr>`).join("") + "</tbody></table>" +
      `<div class="tblbtns"><button type="button" data-act="csv" aria-label="Copy ${escA(caption || "this table")} as CSV">copy as CSV</button><button type="button" data-act="md" aria-label="Copy ${escA(caption || "this table")} as Markdown">copy as Markdown</button></div>`;
  }
  // a table copied as CSV (for a spreadsheet) or as Markdown (for a report or a slide); the buttons sit under every table
  function tableCells(t) { return [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.textContent.replace(/\s+/g, " ").trim())); }
  function copyTable(t, b, how) {
    const rows = tableCells(t); if (!rows.length) return;
    const csvCell = (s) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
    const txt = how === "md" ? [rows[0], rows[0].map((_, j) => (j ? "---:" : "---"))].concat(rows.slice(1)).map((r) => "| " + r.map((s) => s.replace(/\|/g, "\\|")).join(" | ") + " |").join("\n") : rows.map((r) => r.map(csvCell).join(",")).join("\n");
    clipText(txt, b, how === "md" ? "copy as Markdown" : "copy as CSV", "the table");
  }
  document.addEventListener("click", (e) => { const b = e.target.closest ? e.target.closest('button[data-act="csv"], button[data-act="md"]') : null; if (!b) return; const t = b.parentNode && b.parentNode.previousElementSibling; if (t && t.tagName === "TABLE") copyTable(t, b, b.dataset.act); });
  // whole-number x axis (the discrete distributions): a label on every value only when each label has room, otherwise one every
  // 2, 5, 10, ... values, so a phone shows a readable axis. Worked out from the plot's width, and again when the window resizes.
  function wholeStep(wh, p) {
    const n = wh.to - wh.from + 1, digits = Math.max(String(Math.round(wh.from)).length, String(Math.round(wh.to)).length);
    const room = Math.max(80, (p.clientWidth || window.innerWidth) - 70) / Math.max(1, n), need = 7 * digits + 9;
    if (room >= need) return 1;
    if (n > 200) return undefined; // long axes: Plotly's own ticks, which also follow a zoom
    const want = need / room; for (const m of [1, 10, 100]) for (const st of [1, 2, 5]) if (st * m >= want) return st * m;
    return undefined;
  }
  // a graph is one image for a screen reader, named by its title (for example "Shaded: P(X ≤ 1) = 0.8413"), or by its card
  function plotName(layout, div) {
    const tt = layout && layout.title ? (typeof layout.title === "string" ? layout.title : layout.title.text || "") : "";
    const nm = plainText(String(tt).replace(/<br\s*\/?>/gi, " ")).replace(/\s+/g, " ").trim(), h2 = div && div.querySelector ? div.querySelector("h2") : null;
    return nm || ("Graph for " + (h2 ? h2.textContent : "this result"));
  }
  // a long graph title wraps onto a second (or third) line when the graph is narrow, as on a phone, instead of running off
  // both edges. The words stay whole and in order; the top margin grows a line for each extra line. Again after a resize.
  const TCTX = document.createElement("canvas").getContext("2d");
  function wrapTitle(text, width, size, family) {
    TCTX.font = `${size}px ${family}`; const fits = (t) => TCTX.measureText(plainText(t)).width <= width, lines = [];
    const greedy = (seg) => { const out = []; let cur = ""; seg.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (cur && !fits(t)) { out.push(cur); cur = w; } else cur = t; }); out.push(cur); return out; };
    String(text).split(/<br\s*\/?>/i).forEach((seg) => {
      const g = greedy(seg), at = seg.indexOf(" (");
      const split = g.length > 1 && at > 0 ? greedy(seg.slice(0, at)).concat(greedy(seg.slice(at + 1))) : null; // a note in brackets starts its own line when that takes no extra line
      lines.push(...(split && split.length <= g.length ? split : g));
    });
    return lines;
  }
  function fitTitle(p, L) { // L: the layout before the first draw; without it, a relayout of the drawn graph when the wrap changes
    const T = p._tt; if (!T || !p.clientWidth) return;
    const lines = wrapTitle(T.text, p.clientWidth - 24, T.size, T.family), text = lines.join("<br>"), n = lines.length;
    if (text === p._ttNow) return; p._ttNow = text;
    // one line: Plotly's own place, the middle of the top margin. More lines: the first stays exactly there and the others
    // follow below it (Plotly's "middle" anchor places the first line), and the margin grows by one line height (1.3 times
    // the font size) for each extra line, so the gap between the title and the plot stays the same.
    const t = T.mt + Math.ceil((n - 1) * T.size * 1.3), y = n > 1 ? 1 - T.mt / 2 / T.h : "auto", yanchor = n > 1 ? "middle" : "auto";
    if (L) { L.title = Object.assign({}, L.title, { text }, n > 1 ? { y, yanchor } : {}); if (n > 1) L.margin = Object.assign({}, L.margin, { t }); }
    else { try { Plotly.relayout(p, { "title.text": text, "title.y": y, "title.yanchor": yanchor, "margin.t": t }); } catch (e) { } }
  }
  // Plotly reads a few tags of its own (<b>, <i>, <br>, <sub>, <span style>, <a href>) in titles, axis titles, legend names,
  // tick and category labels, hover text and annotations. Every string the app gives it there is plain text (a title, a
  // column name, a level label, a cell), so plotDiv escapes them all once, here, on copies: a name with < or & in it shows
  // exactly as typed and is never read as a tag. Hover templates and colours are left alone.
  const PLOT_TEXT = new Set(["text", "title", "name", "hovertext", "labels", "ticktext", "tickvals", "categoryarray", "x", "y"]);
  function plotText(o, key) {
    if (typeof o === "string") return PLOT_TEXT.has(key) ? esc(o) : o;
    if (Array.isArray(o)) return PLOT_TEXT.has(key) ? (o.some((q) => typeof q === "string") ? o.map((q) => (typeof q === "string" ? esc(q) : q)) : o) : o.some((q) => q && typeof q === "object") ? o.map((q) => plotText(q, key)) : o;
    if (o && typeof o === "object" && Object.getPrototypeOf(o) === Object.prototype) { const c = {}; Object.keys(o).forEach((k) => (c[k] = plotText(o[k], k))); return c; }
    return o;
  }
  // a box of one value: Plotly's exclusive quartiles (the textbook rule) have no halves to work with and draw NaN, so that box
  // uses the inclusive rule, which for one value gives the value itself (the box is a line there)
  const oneValueBox = (t) => { if (t && t.type === "box" && t.quartilemethod === "exclusive" && (t.x || t.y || []).filter((q) => q !== "" && q != null && Number.isFinite(Number(q))).length < 2) t.quartilemethod = "inclusive"; return t; };
  function plotDiv(div, traces, layout, h = 320) {
    if (CAPTURE) { CAPTURE.push({ traces, layout: layout || {}, h }); return document.createElement("div"); }
    traces = plotText(traces, "data").map(oneValueBox); layout = plotText(layout || {}, "layout");
    const p = document.createElement("div"); p.className = "plot"; p.style.height = h + "px"; p.setAttribute("role", "img"); p.setAttribute("aria-label", plotName(layout, div)); div.appendChild(p);
    const wh = layout && layout.xaxis && layout.xaxis.whole; if (layout && layout.xaxis && "whole" in layout.xaxis) { layout.xaxis = Object.assign({}, layout.xaxis); delete layout.xaxis.whole; }
    if (wh && Number.isFinite(wh.from) && Number.isFinite(wh.to)) { const st = wholeStep(wh, p); p._whole = wh; p._step = st; if (st) Object.assign(layout.xaxis, { dtick: st, tick0: 0 }); }
    const L = Object.assign({ margin: { t: 36, l: 50, r: 20, b: 50 }, font: { family: "Segoe UI, Arial", size: 12 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff" }, layout);
    const APP = L._app; delete L._app; traces = styleGraph(traces, L, APP);
    if (L.title) { // Plotly's own sizes: a title is 1.4 times the page font, and a margin object without t has t = 100
      if (typeof L.title === "string") L.title = { text: L.title };
      const f = L.font || {}; p._tt = { text: String(L.title.text || ""), size: (L.title.font && L.title.font.size) || (f.size || 12) * 1.4, family: (L.title.font && L.title.font.family) || f.family || "Segoe UI, Arial", mt: L.margin && L.margin.t != null ? L.margin.t : 100, h };
      fitTitle(p, L);
    }
    // No Plotly toolbar: it was noise for a student, and the histograms (drawn without it) and the scatterplots (drawn with
    // it) looked like two different apps. Dragging still zooms and a double click resets. Under each graph one button saves
    // it as a PNG for a report or a slide, at twice the screen resolution.
    Plotly.newPlot(p, traces, L, { displaylogo: false, responsive: true, displayModeBar: false });
    const b = document.createElement("button"); b.type = "button"; b.className = "pngbtn"; b.dataset.act = "png"; b.textContent = "download PNG"; b.setAttribute("aria-label", "Download as PNG: " + plotName(layout, div)); div.appendChild(b);
    const fname = () => plotName(layout, div).replace(/[^\w\- ]+/g, " ").trim().replace(/\s+/g, "_").slice(0, 60) || "graph";
    b.onclick = () => { try { Plotly.downloadImage(p, { format: "png", width: p.clientWidth || 800, height: h, scale: 2, filename: fname() }); } catch (e) { announce("The graph could not be saved. Take a screenshot instead."); } };
    const b2 = document.createElement("button"); b2.type = "button"; b2.className = "svgbtn"; b2.dataset.act = "svg"; b2.textContent = "download SVG"; b2.setAttribute("aria-label", "Download as SVG (vector, for a paper): " + plotName(layout, div)); div.appendChild(b2);
    b2.onclick = () => { try { Plotly.downloadImage(p, { format: "svg", width: p.clientWidth || 800, height: h, filename: fname() }); } catch (e) { announce("The graph could not be saved as SVG. Use the PNG button instead."); } };
  }
  const pWord = (p) => (p < 0.0001 ? "p < 0.0001" : `p = ${p.toFixed(4)}`);
  const decision = (p, alpha) => (!Number.isFinite(p) ? "The p-value could not be worked out for these numbers, so there is no decision yet. Check the inputs." : p <= alpha ? `${pWord(p)} is at or below alpha = ${alpha}: reject H0.` : `${pWord(p)} is above alpha = ${alpha}: fail to reject H0.`) + (p < 0.0001 ? " Write p < 0.001 in a report; a p-value is never exactly 0." : "");
  const altWord = (alt) => (alt === "two" ? "not equal to" : alt === "less" ? "less than" : "greater than");
  const say = (t) => `<div class="say">${sym(t)}</div>`, warn = (t) => `<div class="warn">${sym(t)}</div>`, ok = (t) => `<div class="ok">${sym(t)}</div>`, formula = (t) => `<div class="formula">${sym(esc(t), true)}</div>`;
  const cond = (pass, yes, no) => (pass ? ok(yes) : warn(no));
  // the formula again with the actual numbers in it: the step a student cannot do alone, and the one that turns output into a
  // worked example. A toggle, closed by default, so the card stays short.
  const worked = (lines) => `<details class="worked"><summary>Show the numbers in the formula</summary>${lines.map(formula).join("")}</details>`;
  // one sentence in APA style to paste into a write-up: p and r without a leading zero, a real minus sign
  const apaP = (p) => (!Number.isFinite(p) ? "p = n/a" : p < 0.001 ? "p < .001" : "p = " + p.toFixed(3).replace(/^0/, ""));
  const noZero = (x, d = 2) => (!Number.isFinite(x) ? "n/a" : (x < 0 ? "-" : "") + Math.abs(x).toFixed(d).replace(/^0(?=\.)/, ""));
  const apa = (t) => `<div class="apa">Report it as (APA style): <code>${sym(esc(String(t).replace(/(^|[\s(\[=,])-(?=\d|\.)/g, "$1\u2212")), true)}</code></div>`;
  const dfText = (df) => (Number.isInteger(df) ? String(df) : fmt(df, 2));
  const apaN = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a"); // APA keeps the trailing zeros: 1.10, not 1.1
  // fields that apply to one way of giving the data only: the column boxes for "from a column", the typed numbers for
  // "from summary statistics". A dialog without a Data box shows everything.
  const onData = (raw) => raw.mode === "data", onSummary = (raw) => raw.mode !== "data";
  const only = (fd, vis) => (fd ? Object.assign({}, fd, { vis }) : null);
  const smallGroups = (pairs, min = 5) => { const s = pairs.filter(([n]) => n < min); return s.length ? warn(`Small group: ${s.map(([n, g]) => `${esc(g)} has N = ${n}`).join("; ")}. A mean, SD or test from fewer than ${min} people is fragile and any normality check on it is meaningless. Say so in the write-up.`) : ""; };

  // ================= dialog =================
  // Modal by default. On the distrACTION page the same fields render in the inputs card instead, and every change
  // re-runs the calculation and updates the live card in place. Run keeps that card and starts a new one.
  // The modal is a native <dialog> opened with showModal(): focus moves into it, the page behind is inert, Escape closes it.
  // On close focus goes back to what opened it (the menu button for a menu item), or after Run to the new card's heading.
  const DLG = $("#dlg");
  let OPENER = null, dlgBack = null, dlgNext = null, dlgRan = false, dlgDown = false;
  function pageHeading() { return VIEW !== "data" ? $("#toolTitle") : D.rows.length ? $("#dsname") : $("#grid .empty h2") || $("#dsname"); }
  function openDlg(f) {
    if (!DLG.open) {
      let op = OPENER && OPENER.isConnected ? OPENER : document.activeElement; const dd = op && op.closest ? op.closest("nav.menu .dd") : null;
      if (dd) op = dd.querySelector(".top");
      dlgBack = op && op !== document.body ? op : null;
      let modal = false; if (typeof DLG.showModal === "function") { try { DLG.showModal(); modal = true; } catch (e) { } }
      if (!modal) DLG.setAttribute("open", ""); DLG.classList.toggle("nomodal", !modal); // an old browser without <dialog>: dimmed by CSS, Escape by hand
    }
    OPENER = null; dlgNext = null; dlgRan = false; DLG.classList.add("open"); DLG.querySelector(".box").scrollTop = 0;
    // the first box gets focus; on a phone or iPad the title takes focus instead (no keyboard popping up, no ring on a tap)
    const first = [...f.querySelectorAll("select, input, textarea")].find((el) => el.getClientRects().length);
    if (first && !coarse()) first.focus(); else focusTo($("#dlgTitle"));
  }
  function closeDlg(next, ran) { // focus moves at once (the close event comes a moment later, too late for a quick student)
    dlgNext = next || null; dlgRan = !!ran; DLG.classList.remove("open");
    if (DLG.open && typeof DLG.close === "function") { DLG._ours = true; DLG.close(); } else DLG.removeAttribute("open");
    afterDlg();
  }
  function afterDlg() {
    DLG.classList.remove("open");
    const next = dlgNext; let back = dlgBack; dlgNext = dlgBack = null;
    if (next && next.isConnected) { focusTo(next); return; }
    if (back && dlgRan && back.closest && back.closest("#grid .empty")) { focusTo($("#dsname")); return; } // that button goes once the data open; their name shows here
    if (back && back.isConnected && back.getClientRects().length) back.focus({ preventScroll: true }); else focusTo(pageHeading());
  }
  DLG.addEventListener("close", () => { if (DLG._ours) DLG._ours = false; else afterDlg(); }); // Escape
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && DLG.classList.contains("nomodal") && DLG.classList.contains("open")) closeDlg(); });
  DLG.addEventListener("pointerdown", (e) => { dlgDown = e.target === DLG; }); // a press that starts and ends on the dim area closes it
  DLG.addEventListener("click", (e) => { if (e.target === DLG && dlgDown) closeDlg(); dlgDown = false; });
  function dialog(title, fields, onGo, goLabel = "Run") {
    const inline = INLINE; INLINE = false;
    const f = inline ? $("#distForm") : $("#dlgForm"), pre = inline ? "d_" : "f_";
    const editing = REPLACE && REPLACE.isConnected ? REPLACE : null; REPLACE = null;
    const resume = inline && RESUME && RESUME.isConnected ? RESUME : null; RESUME = null; // Undo clear: the live card comes back as the live card
    if (inline) {
      // a card the calculator made by itself when it opened, that nobody changed or kept, goes when another one opens
      if (LIVE && LIVE._auto && LIVE.isConnected && LIVE !== editing) LIVE.remove();
      document.querySelectorAll("#outD .card.stale").forEach((c) => c.classList.remove("stale")); // right for its own inputs; only out of date against the old form
      dropUndo();
      $("#toolTitle").textContent = f._title = title.replace(/^(distrACTION|Advanced):\s*/, ""); distMsg(""); $("#distPick").style.display = "none"; LIVE = editing || resume;
      $("#toolNote").textContent = PLAN_ITEMS.has(CUR_FN) ? "Sample size and power. No data needed." : "Probability calculators. No data needed.";
      const di = DIST_ITEMS.findIndex((it) => it[1] === CUR_FN); $("#distSel").value = di < 0 ? "" : String(di); $("#distSwitch").style.display = di < 0 ? "none" : "block"; // Change distribution
      document.querySelectorAll("#outD .card.editing").forEach((c) => c.classList.remove("editing")); if (editing) { editing.classList.add("editing"); editing._auto = false; }
      $("#distPanel").appendChild($("#distMsg")); // out of the form before the form is rebuilt; it goes back in just above Run
      document.body.classList.add("dist-open");
    } else $("#dlgTitle").textContent = title;
    f.innerHTML = ""; f.dataset.target = TARGET;
    const groups = {}, wide = new Set(); let html = ""; // wide: a group with a typed list gets full-width boxes, one under the other
    if (PREFILL) fields.filter(Boolean).forEach((fd) => { if (fd.name in PREFILL) fd = Object.assign(fd, { value: PREFILL[fd.name] }); });
    const taken = []; fields.filter(Boolean).forEach((fd) => { if (!fd.distinct || fd.value != null) return; const opts = (fd.options || []).map((o) => (Array.isArray(o) ? o[0] : o)); const pick = opts.find((o) => !taken.includes(o)); if (pick != null) { fd.value = pick; taken.push(pick); } });
    fields.filter(Boolean).forEach((fd) => {
      const id = pre + fd.name; let ctl = "";
      if (fd.type === "select" || fd.type === "multi") ctl = `<select id="${id}" name="${fd.name}" ${fd.type === "multi" ? "multiple" : ""}>${(fd.options || []).map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; const on = Array.isArray(fd.value) ? fd.value.map(String).includes(String(v)) : String(fd.value) === String(v); return `<option value="${escA(v)}" ${on ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
      else if (fd.type === "textarea") ctl = `<textarea id="${id}" name="${fd.name}" rows="${fd.rows || 6}" placeholder="${escA(fd.placeholder || "")}">${esc(fd.value || "")}</textarea>`;
      else if (fd.type === "check") ctl = `<label class="chk"><input type="checkbox" id="${id}" name="${fd.name}" ${fd.value ? "checked" : ""}> ${sym(esc(fd.label))}</label>`;
      else if (fd.type === "note") ctl = `<div class="say note" id="${id}" aria-live="polite"></div>`; // a box of text that follows the other answers
      else ctl = `<input type="${fd.type || "text"}" id="${id}" name="${fd.name}" value="${fd.value == null || Number.isNaN(fd.value) ? "" : escA(fd.value)}" step="any" placeholder="${escA(fd.placeholder || "")}"${fd.list ? ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"' : ""}>`;
      const lab = fd.type === "check" || fd.type === "note" ? "" : `<label for="${id}">${sym(esc(fd.label))}</label>`;
      // check(raw): a field that can be set to something that will not work (a grouping column with too many values) says so
      // right under itself as soon as it is chosen, and Run shows the same message there instead of an alert
      const block = `<div class="fld${fd.full ? " full" : ""}">${lab}${ctl}${fd.hint ? `<div class="hint">${sym(esc(fd.hint))}</div>` : ""}${fd.check ? `<div class="fldmsg" id="${id}_msg" role="alert"></div>` : ""}</div>`;
      if (fd.group) { groups[fd.group] = (groups[fd.group] || "") + block; html += `<!--G:${fd.group}-->`; if (fd.list) wide.add(fd.group); } else html += block;
    });
    const seen = new Set();
    html = html.replace(/<!--G:([^>]+)-->/g, (m, g) => { if (seen.has(g)) return ""; seen.add(g); const n = (groups[g].match(/class="fld[ "]/g) || []).length; return `<fieldset><legend>${sym(esc(g))}</legend><div class="${g === "Find" ? "find" : wide.has(g) ? "" : n >= 3 ? "row3" : n === 2 ? "row" : ""}">${groups[g]}</div></fieldset>`; });
    f.innerHTML = html + (inline ? `<div id="distNow"></div><div class="actions"><button type="submit" class="go">${esc(goLabel)}</button></div><div class="hint">The result updates as you change anything. Run keeps this result; your next change then starts a new card, so you can compare.</div>`
      : `<div class="actions"><button type="button" id="dlgCancel">Cancel</button><button type="submit" class="go">${esc(goLabel)}</button></div>`);
    PREFILL = null;
    const fn = CUR_FN;
    const collect = () => { const v = {}; fields.filter(Boolean).forEach((fd) => { const el = f.elements[fd.name]; if (!el) return; if (fd.type === "multi") v[fd.name] = [...el.selectedOptions].map((o) => o.value); else if (fd.type === "check") v[fd.name] = el.checked; else if (fd.type === "number") v[fd.name] = el.value === "" ? NaN : Number(el.value); else v[fd.name] = el.value; }); return v; };
    const applyVis = (ev) => { // fields with vis() show only when they apply (x2 only for between, and so on); lab() names a field for the choice made
      const raw = {}; [...f.elements].forEach((el) => { if (el.name) raw[el.name] = el.type === "checkbox" ? el.checked : el.value; });
      // check(raw, live): live is false only as the dialog opens, so a box the student has not reached yet asks for nothing.
      // While the student types in a box, its message can clear but never changes to a new one; the new one shows on leaving it (or on Run).
      const t0 = ev && ev.type === "input" ? ev.target : null, typingIn = t0 && (t0.tagName === "TEXTAREA" || (t0.tagName === "INPUT" && /^(text|number|search)$/.test(t0.type))) ? t0 : null;
      fields.filter(Boolean).forEach((fd) => {
        const el = f.querySelector("#" + pre + fd.name);
        if (fd.lab) { const l = f.querySelector(`label[for="${pre + fd.name}"]`); if (l) l.textContent = fd.lab(raw); }
        if (fd.type === "note" && fd.text && el) { const t = fd.text(raw); if (el.textContent !== t) el.textContent = t; }
        if (fd.check) { const m = f.querySelector(`#${pre + fd.name}_msg`), t = fd.check(raw, !!ev) || ""; if (m && m.textContent !== t && !(t && el && el === typingIn)) { m.textContent = t; if (el) { if (t) el.setAttribute("aria-describedby", m.id); else el.removeAttribute("aria-describedby"); } } }
        if (!fd.vis) return; const box = el && el.closest(".fld"); if (box) box.style.display = fd.vis(raw) ? "" : "none";
      });
      f.querySelectorAll("fieldset").forEach((fs) => { const b = [...fs.querySelectorAll(".fld")]; fs.style.display = b.length && b.every((x) => x.style.display === "none") ? "none" : ""; });
      if (inline) fitSelects(f);
    };
    if (inline) { f.insertBefore($("#distMsg"), f.querySelector("#distNow")); f._fn = fn; f._collect = collect; } // the message sits under the inputs, just above Run
    applyVis();
    const exec = (replace) => {
      const v = collect(); const tgt = f.dataset.target || "#out"; const prev = TARGET; TARGET = tgt; PENDING = { fn, values: v, title, fields: fields.filter(Boolean).map((fd) => ({ name: fd.name, label: fd.label, type: fd.type, options: fd.options, group: fd.group })) }; REPLACE = replace || null; LASTCARD = null;
      try { if (v.facet && String(v.facet).trim() && fields.some((fd) => fd && fd.name === "facet")) facetRun(onGo, v); else onGo(v); if (replace && replace.isConnected && replace._last) { replace._last = null; replace.remove(); } return LASTCARD; }
      catch (err) { if (replace && LASTCARD && LASTCARD.isConnected) LASTCARD.remove(); throw err; }
      finally { TARGET = prev; PENDING = null; REPLACE = null; }
    };
    if (AUTORUN) { exec(null); return; } // restoring the last visit's results: run with the saved choices, no dialog shown
    if (!inline) {
      $("#dlgCancel").onclick = () => closeDlg();
      f.oninput = f.onchange = applyVis;
      // Run: the dialog closes and focus goes to the new card's heading, so a keyboard or screen reader user lands on the result
      // a message that belongs to one field (err.field) shows under that field and focus goes there; anything else is an alert
      const atField = (err) => { const el = err && err.field ? f.elements[err.field] : null, m = el ? f.querySelector(`#${pre + err.field}_msg`) : null; if (!m) return false; m.textContent = ""; el.setAttribute("aria-describedby", m.id); requestAnimationFrame(() => { m.textContent = err.message; }); el.focus({ preventScroll: true }); el.closest(".fld").scrollIntoView({ block: "nearest" }); return true; };
      f.onsubmit = (e) => { e.preventDefault(); let made = null; try { made = exec(editing); } catch (err) { if (!atField(err)) alert(err.message || err); return; } closeDlg(made && made.isConnected ? made.querySelector("h2") : null, true); };
      openDlg(f);
      return;
    }
    let timer = null, lastKey = editing || resume ? JSON.stringify(collect()) : null, marking = !!editing, keptKey = null, keptCard = null;
    // phones and iPad portrait: the inputs card repeats the live answer, so it shows where the student is typing
    const showNow = (cd) => {
      const box = f.querySelector("#distNow"); if (!box) return;
      const big = cd && cd.isConnected ? cd.querySelector(".big") : null;
      box.innerHTML = cd && cd.isConnected ? `${big ? `<div class="nowbig">${big.innerHTML}</div>` : ""}<button type="button">See the full result</button>` : "";
      const b = box.querySelector("button"); if (b) b.onclick = () => cd.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const kept = (cd) => { marking = false; if (cd) { cd.classList.remove("editing"); if (narrow()) toView(cd); } };
    // Run keeps the live card: say so, mark it for a moment, and never make a second copy of the same result
    const keepLive = (key) => {
      const c = LIVE && LIVE.isConnected ? LIVE : null; kept(c); LIVE = null; if (!c) return;
      c._auto = false; keptKey = key; keptCard = c; flashKept(c);
      distMsg("Kept. Your next change starts a new card, so you can compare.", "info");
    };
    // a student still typing (the field has focus) sees a calm note, not a red error; a blank input is a prompt, not a mistake
    const typing = () => { const a = document.activeElement; return !!a && f.contains(a) && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && /^(text|number)$/.test(a.type))); };
    const runInline = (keep, first) => {
      const key = JSON.stringify(collect());
      if (keep && !(LIVE && LIVE.isConnected) && key === keptKey && keptCard && keptCard.isConnected) { flashKept(keptCard); if (narrow()) toView(keptCard); distMsg("This result is already kept. Change any input to start a new card.", "info"); return; }
      if (LIVE && LIVE.isConnected && key === lastKey && !LIVE.classList.contains("stale")) { if (keep) keepLive(key); return; }
      try { const c = exec(LIVE && LIVE.isConnected ? LIVE : null); if (c) { c._auto = !!first; LIVE = c; lastKey = key; if (marking) c.classList.add("editing"); } distMsg(""); showNow(c || LIVE); if (c) announce(headline(c), keep ? 0 : 700); if (keep) keepLive(key); }
      catch (err) {
        const a = document.activeElement, emptyHere = typing() && String(a.value).trim() === "";
        const soft = !keep && (first || err.blank || (typing() && (err.soft || emptyHere)));
        distMsg(soft ? err.soft || err.message || String(err) : err.message || String(err), soft ? "info" : "");
        if (LIVE && LIVE.isConnected) LIVE.classList.add("stale"); showNow(null);
      }
    };
    if (editing || resume) { showNow(editing || resume); if (editing && narrow()) { const pn = $("#distPanel"); pn.scrollIntoView({ behavior: "smooth", block: "start" }); pn.setAttribute("tabindex", "-1"); pn.focus({ preventScroll: true }); } }
    f.oninput = () => { applyVis(); clearTimeout(timer); timer = setTimeout(() => runInline(false), 250); };
    f.onchange = () => { applyVis(); clearTimeout(timer); runInline(false); };
    f.onsubmit = (e) => { e.preventDefault(); clearTimeout(timer); runInline(true); };
    if (!editing && !resume) runInline(false, true); // the inputs open filled in, so the result shows at once (a blank input gets a calm prompt instead)
    counts();
  }
  // the message under the distrACTION inputs: red for a problem to fix, plain for a prompt or a note
  function distMsg(text, kind) { const m = $("#distMsg"); if (!m) return; m.textContent = text || ""; m.className = text && kind === "info" ? "info" : ""; }
  function flashKept(c) { c.classList.remove("kept"); void c.offsetWidth; c.classList.add("kept"); clearTimeout(c._keptT); c._keptT = setTimeout(() => c.classList.remove("kept"), 2500); }
  // a select too narrow for the label chosen in it (phones): the whole label shows in small type under it
  function fitSelects(form) {
    const cv = fitSelects.cv || (fitSelects.cv = document.createElement("canvas").getContext("2d"));
    form.querySelectorAll("select:not([multiple])").forEach((s) => {
      const fld = s.closest(".fld"); if (!fld) return;
      const o = s.selectedOptions[0], cs = getComputedStyle(s); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const room = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 22;
      let full = fld.querySelector(".selfull"); const cut = !!o && s.clientWidth > 0 && cv.measureText(o.textContent).width > room;
      if (cut) { if (!full) { full = document.createElement("div"); full.className = "selfull"; full.setAttribute("aria-hidden", "true"); s.after(full); } full.textContent = o.textContent; }
      else if (full) full.remove();
    });
  }
  // an error for an input that is still blank (a prompt) or for a list still being typed (soft: the calm note shown meanwhile)
  const blankErr = (msg) => Object.assign(new Error(msg), { blank: true });
  const fieldErr = (field, msg) => Object.assign(new Error(msg), { field }); // shown under that field in the dialog
  // A typed level (a success level, the level to test, the yes level) must be one of the column's levels, exactly as in the data.
  // It is checked under its own box as the student goes, and again on Run, so a typo ('yes' for 'Yes') or a blank box never
  // makes a card (Two proportions made a NaN card and a broken graph before). cols: one column or several (their levels pooled).
  // what: how to ask for a blank box, or null when a blank box is allowed. live: false as the dialog opens (nothing asked yet).
  function levelProblem(cols, typed, what, live = true) {
    cols = [...new Set([].concat(cols))].filter((c) => c && D.cols.includes(c)); if (!cols.length) return "";
    const t = String(typed == null ? "" : typed).trim(); if (!t && !(what && live)) return "";
    const lv = [...new Set(cols.flatMap((c) => col(c)).filter((q) => q !== ""))], names = cols.join(" and "), has = cols.length > 1 ? "have" : "has";
    if (!lv.length) return `${names} ${has} no values in the rows in use. Choose another column, or clear the filter.`;
    const list = lv.slice(0, 8).join(", ") + (lv.length > 8 ? ", and more" : "");
    if (!t) return `Type ${what}. ${names} ${has}: ${list}.`;
    if (lv.includes(t)) return "";
    const near = lv.find((l) => l.toLowerCase() === t.toLowerCase());
    return `Levels of ${names}: ${list}. Type one of them exactly${near ? `: ${near}, not ${t} (capitals count)` : ""}.`;
  }
  const levelCheck = (colKey, what, when = () => true) => (raw, live) => (when(raw) ? levelProblem([].concat(colKey).map((k) => raw[k]), raw.succ, what, live) : "");
  const softErr = (msg, soft) => Object.assign(new Error(msg), { soft });
  const MULTI_HINT = () => (matchMedia("(pointer: coarse)").matches ? "tap each one you want" : "hold Cmd or Ctrl to pick several");
  const needData = () => { if (!D.rows.length) throw new Error("Open a data file first (Data menu)."); };
  const sel = (name, label, options, value) => ({ name, label, type: "select", options, value });
  // distinct: two boxes offering the same columns (dependent variable and covariate, rows and columns, the two paired
  // variables) open on different columns, so Run never regresses a variable on itself
  const selNum = (name, label) => Object.assign(sel(name, label, numCols()), { distinct: true });
  const selCat = (name, label) => Object.assign(sel(name, label, catCols()), { distinct: true });
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
      { name: "vars", label: `Variables (${MULTI_HINT()})`, type: "multi", options: D.cols.filter((c) => D.types[c] !== "id") },
      selBy("by", "Split by"),
      ...[["hist", "Histogram"], ["dens", "Density"], ["box", "Box plot"], ["dot", "Dot plot"], ["qq", "Q-Q plot"], ["bar", "Bar plot"]].map(([k, l]) => ({ name: k, label: l, type: "check", value: false, group: "Plots" })),
      { name: "lines", label: "Mark mean (solid) and median (dashed) on histograms", type: "check", value: true, group: "Plots" },
      { name: "freq", label: "Frequency tables (for nominal and ordinal variables)", type: "check", value: true, group: "Tables" },
      sel("qm", "Quartile method", [["halves", "Textbook rule: median of each half, overall median excluded (default)"], ["type7", "R rule (type 7, interpolated)"]], PROF ? PROF.qm : "halves"),
      ...[["n", "N", true], ["missing", "Missing", true], ["skew", "Skewness with its standard error", false], ["mean", "Mean", true], ["median", "Median", true], ["mode", "Mode", false], ["sum", "Sum", false], ["sd", "Std. deviation (sample, n minus 1)", true], ["variance", "Variance (sample)", false], ["sdpop", "Population std. deviation (divides by N)", false], ["range", "Range", false], ["min", "Minimum", true], ["max", "Maximum", true], ["se", "Std. error of mean (SE: spread of sample means, not of people)", false], ["iqr", "IQR", false], ["q", "Quartiles (25th, 50th, 75th)", false], ["fence", "Fences (1.5 IQR)", false], ["kurt", "Kurtosis (excess) with its standard error", false], ["cv", "Coefficient of variation (SD / mean)", false]].map(([k, l, v]) => ({ name: k, label: l, type: "check", value: v, group: "Statistics" })),
      { name: "pcts", label: "Other percentiles, comma separated (optional)", type: "text", placeholder: "10, 90", group: "Statistics" }], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const pcts = String(v.pcts || "").split(",").map((q) => q.trim()).filter(Boolean).map(Number);
      if (pcts.some((p) => !(p > 0 && p < 100))) throw new Error("Percentiles are numbers between 0 and 100, such as 10, 90.");
      const groups = groupsOf(v);
      const numV = v.vars.filter(isNum), catV = v.vars.filter((c) => !isNum(c));
      const cd = card("Descriptives", src(v.by ? "split by " + v.by : ""), "");
      if (numV.length) {
        const statList = [["n", "N", "n"], ["missing", "Missing", "missing"], ["mean", "Mean", "mean"], ["median", "Median", "median"], ["mode", "Mode (all ties shown)", "mode"], ["sum", "Sum", "sum"], ["sd", "Standard deviation (sample, n - 1)", "sd"], ["variance", "Variance (sample)", "variance"], ["sdpop", "Population SD (divides by N)", "sdPop"], ["sdpop", "Population variance", "variancePop"], ["skew", "Skewness", "skew"], ["skew", "Std. error skewness", "skewSE"], ["range", "Range", "range"], ["min", "Minimum", "min"], ["max", "Maximum", "max"], ["se", "Std. error of the mean (SE)", "se"], ["iqr", "IQR", "iqr"], ["q", "25th percentile", "q1"], ["q", "50th percentile", "median"], ["q", "75th percentile", "q3"], ["fence", "Lower fence", "lowerFence"], ["fence", "Upper fence", "upperFence"], ["kurt", "Kurtosis (excess)", "kurt"], ["kurt", "Std. error kurtosis", "kurtSE"], ["cv", "Coefficient of variation (percent)", "cv"]].concat(pcts.map((p) => ["pct", `${p}th percentile`, "p" + p])).filter(([k]) => k === "pct" || v[k]);
        const hdr = ["Statistic"].concat(numV.flatMap((x) => groups.map((g) => (g == null ? x : `${x} (${g})`))));
        const cells = numV.flatMap((x) => groups.map((g) => { const vals = subset(x, v, g); const d = SW.describe(vals, v.qm) || {}; d.sum = (d.mean || 0) * (d.n || 0); const xs = SW.num(vals); const ku = SW.kurtosis(xs); d.kurt = ku.kurt; d.kurtSE = ku.se; d.cv = d.mean ? (100 * d.sd) / Math.abs(d.mean) : null; pcts.forEach((p) => { d["p" + p] = SW.percentile(xs, p / 100, v.qm === "type7" ? "type7" : "rank"); }); return d; }));
        const rows = statList.map(([k, lab, key]) => [lab].concat(cells.map((d) => (d[key] == null ? "" : d[key]))));
        cd.insertAdjacentHTML("beforeend", table(hdr, rows, "Descriptives") + (groups.length > 1 ? smallGroups(cells.map((d, i) => [d.n || 0, hdr[i + 1]])) : "") + (pcts.length ? say(v.qm === "type7" ? "Other percentiles by the R interpolation rule (type 7)." : "Other percentiles by the textbook rule: the kth percentile is the smallest value with at least k percent of the data at or below it.") : "") + (v.cv ? say("The coefficient of variation is the SD as a percent of the mean. It compares spread across variables on different scales, and only makes sense for positive data measured from a true zero.") : "") + (!(v.q || v.iqr || v.fence || v.box || pcts.length) ? "" : v.qm === "halves" ? say(`Quartiles${v.q || v.iqr || v.fence ? "" : " (used by the box plot)"} by the textbook rule: Q1 is the median of the lower half and Q3 the median of the upper half, with the overall median left out when n is odd. R and most software interpolate instead, so their quartiles can differ in the first decimal; neither is wrong, say which rule you used.`) : say("Quartiles by the R interpolation rule (type 7). The textbook rule (median of each half) can differ in the first decimal.")) + (v.skew ? say("Skewness smaller than about twice its standard error is weak evidence of skew; do not call a distribution skewed on a number that small. Look at the histogram.") : "") + (cells.some((d) => d.missing > 0) ? warn("Some rows are blank for a variable and were dropped from that column only, so N differs across columns. Check N before comparing.") : "") + (v.sdpop ? say("Two standard deviations are shown. The sample one divides by n minus 1 and is the one this course reports (the data are a sample). The population one divides by N; calculators and spreadsheets sometimes use it, which is why a hand calculation can disagree with the table.") : "") + (v.mode ? say("Mode: when two or more values tie for most frequent, all of them are printed with the count. Most software prints only one and does not say so.") : "") + say("Shape from two numbers: mean above median points to a right tail, mean below median to a left tail. Report a pair: mean with standard deviation when symmetric, median with IQR when skewed or with outliers."));
      }
      if (v.freq && catV.length) catV.forEach((x) => { groups.forEach((g) => { const vals = subset(x, v, g); const c = SW.counts(vals), keys = SW.naturalOrder(Object.keys(c)) || Object.keys(c).sort(), n = keys.reduce((s, k) => s + c[k], 0); let cum = 0; const miss = vals.filter((q) => q === "").length; cd.insertAdjacentHTML("beforeend", table(["Levels", "Counts", "Relative frequency", "Percent", "Cumulative frequency", "Cumulative relative frequency", "Cumulative percent"], keys.map((k) => { cum += c[k]; return [k, c[k], fmt(c[k] / n, 3), fmt((100 * c[k]) / n, 1) + "%", cum, fmt(cum / n, 3), fmt((100 * cum) / n, 1) + "%"]; }).concat([["Total (non-missing)", n, "1.000", "100%", "", "", ""]]), `Frequencies of ${x}${g == null ? "" : " (" + g + ")"}`) + (miss ? warn(`${miss} blank${miss > 1 ? "s" : ""} excluded: percentages are out of ${n}, not ${n + miss}.`) : "")); }); });
      // plots
      numV.forEach((x) => {
        const d = SW.describe(col(x)) || {};
        if (v.hist || v.dens) { const B = SW.histBins(col(x)); const traces = groups.map((g) => { const vals = subset(x, v, g); const counts = SW.countsWith(B.edges, vals), n = counts.reduce((s, q) => s + q, 0); return { x: B.mids, y: counts.map((c) => (v.dens ? c / (n * B.width) : c)), width: B.width, type: "bar", name: g == null ? x : String(g), opacity: groups.length > 1 ? 0.6 : 1, text: v.dens ? undefined : counts.map(String), textposition: "outside", cliponaxis: false, marker: { color: groups.length > 1 ? undefined : "#3A7CA5", line: { color: "#fff", width: 1 } }, hovertext: B.labels.map((l, j) => `${l}: ${counts[j]}`), hoverinfo: "text+name" }; });
          const ymaxH = Math.max(...traces.flatMap((t) => t.y));
          const shapes = v.lines && groups.length === 1 ? [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }] : [];
          const annotations = shapes.length && traces[0].text ? traces[0].text.map((t, j) => ({ x: B.mids[j], y: traces[0].y[j], text: t, showarrow: false, yanchor: "bottom", yshift: 2, bgcolor: "#fff", borderpad: 1, font: { size: 12, color: "#333" } })) : [];
          if (annotations.length) traces[0].text = undefined;
          plotDiv(cd, traces, { barmode: "overlay", bargap: 0, title: `Histogram of ${x} (bin width ${B.width})`, xaxis: { title: x, tickvals: B.edges.length <= 16 ? B.edges : undefined }, yaxis: { title: v.dens ? "density" : "Count", range: [0, ymaxH * 1.18], fixedrange: true }, shapes, annotations }); }
        if (v.box) plotDiv(cd, groups.map((g) => ({ y: SW.num(subset(x, v, g)), type: "box", hoveron: "points", hoverinfo: "y+name", quartilemethod: "exclusive", name: g == null ? x : String(g), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { title: `Box plot of ${x}`, yaxis: Object.assign({ title: x }, coverAxis(SW.num(col(x)))), showlegend: false });
        if (v.dot) { const xs = SW.num(col(x)).sort((a, b) => a - b), bw = (d.range || 1) / 40 || 1, bins = {}; const ys = xs.map((val) => { const b = Math.round(val / bw); bins[b] = (bins[b] || 0) + 1; return bins[b]; }); plotDiv(cd, [{ x: xs, y: ys, mode: "markers", type: "scatter", marker: { size: 9, color: "#3A7CA5" } }], { title: `Dot plot of ${x}`, yaxis: { visible: false }, xaxis: { title: x } }); }
        if (v.qq) { const q = SW.qq(col(x)), lo = Math.min(...q.map((p) => p.theo)), hi = Math.max(...q.map((p) => p.theo)); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" }, name: "data" }, { x: [lo, hi], y: [d.mean + lo * d.sd, d.mean + hi * d.sd], mode: "lines", line: { color: "#C0392B" }, name: "normal" }], { title: `Q-Q plot of ${x} (points on the line means roughly normal)`, xaxis: { title: "theoretical quantiles" }, yaxis: { title: x } }); }
      });
      if (v.bar) catV.forEach((x) => { const c = SW.counts(col(x)), keys = Object.keys(c); plotDiv(cd, [{ x: keys, y: keys.map((k) => c[k]), type: "bar", marker: { color: "#3A7CA5" } }], { title: `Bar plot of ${x}`, yaxis: { title: "Count" } }); });
    });
  }
  function scatterUI() {
    needData();
    dialog("Exploration: Scatterplot", [selNum("x", "X axis"), selNum("y", "Y axis"), selBy("by", "Group (colour)"), sel("line", "Regression line", [["none", "None"], ["linear", "Linear"]], "linear")], (v) => {
      const r = SW.regress(col(v.x), col(v.y)), groups = groupsOf(v), bk = v.by ? col(v.by).map(byKey(v.by)) : null, xs0 = col(v.x), ys0 = col(v.y);
      const cd = card("Scatterplot", src(`${v.y} against ${v.x}, r = ${fmt(r.r)}`), say("Describe direction, form, strength, and outliers. Correlation measures linear association only; it is not causation."));
      const traces = groups.map((g) => { const keep = (i) => g == null || bk[i] === g; return { x: xs0.filter((_, i) => keep(i)), y: ys0.filter((_, i) => keep(i)), mode: "markers", type: "scatter", name: g == null ? "data" : String(g) }; });
      if (v.line === "linear") { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: `y = ${fmt(r.b0, 3)} + ${fmt(r.b1, 4)} x`, line: { color: "#C0392B" } }); }
      plotDiv(cd, traces, { xaxis: { title: v.x }, yaxis: { title: v.y } });
    });
  }


  // ================= Graph (StatCrunch-style) =================
  const toGraphs = (fn) => () => { TARGET = "#outG"; try { fn(); } finally { setTimeout(() => (TARGET = baseTarget()), 0); } };
  // Appearance, on every graph dialog: what ggplot2's labs, scale_*, theme, facet_wrap and geom_hline give. plotDiv reads the choices
  // from layout._app; small multiples run the dialog once per level of a column (facetRun) and tile the panels.
  const PALETTES = { okabe: ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9", "#F0E442", "#000000"], viridis: ["#440154", "#3B528B", "#21918C", "#5EC962", "#FDE725", "#31688E", "#35B779", "#90D743"], gray: ["#222222", "#666666", "#999999", "#BBBBBB", "#DDDDDD", "#444444", "#888888", "#AAAAAA"], pastel: ["#8FB8D0", "#F2B89B", "#A8D5BA", "#C9B6E4", "#F5E6A3", "#B8D8E8", "#F7C6D0", "#D4D4D4"] };
  const appearanceFields = () => [{ name: "gtitle", label: "Graph title (optional)", type: "text", group: "Appearance" }, { name: "xlab", label: "X axis label (optional)", type: "text", group: "Appearance" }, { name: "ylab", label: "Y axis label (optional)", type: "text", group: "Appearance" }, { name: "gcolor", label: "Color", type: "color", value: "#3A7CA5", group: "Appearance" },
    sel("palette", "Colors for groups", [["", "App colors"], ["okabe", "Okabe-Ito (colorblind safe)"], ["viridis", "Viridis"], ["gray", "Grayscale (print)"], ["pastel", "Pastel"]], ""), sel("facet", "Small multiples: one panel per level of (optional)", [["", "(none)"]].concat(catCols()), ""),
    sel("legend", "Legend", [["", "Default (right)"], ["top", "Top"], ["bottom", "Bottom"], ["none", "Hidden"]], ""), sel("theme", "Theme", [["", "Default"], ["minimal", "Minimal (light grid, no frame)"], ["classic", "Classic (axis lines, no grid)"]], ""),
    { name: "fsize", label: "Font size (points, blank = 12)", type: "number", value: "", group: "Appearance" },
    { name: "xrange", label: "X axis range, e.g. 0, 100 (optional)", type: "text", group: "Appearance" }, { name: "yrange", label: "Y axis range, e.g. 0, 4 (optional)", type: "text", group: "Appearance" },
    { name: "logx", label: "Log scale on the x axis", type: "check", value: false, group: "Appearance" }, { name: "logy", label: "Log scale on the y axis", type: "check", value: false, group: "Appearance" },
    { name: "ref", label: "Reference lines, e.g. y = 3.0, x = 70 (comma separated, optional)", type: "text", group: "Appearance" }].map((f) => Object.assign(f, { group: "Appearance" }));
  const C = (v) => (v && v.gcolor) || "#3A7CA5";
  function applyAppearance(layout, v) { if (v.gtitle) layout.title = v.gtitle; if (v.xlab) { layout.xaxis = Object.assign(layout.xaxis || {}, { title: v.xlab }); } if (v.ylab) { layout.yaxis = Object.assign(layout.yaxis || {}, { title: v.ylab }); } layout._app = v; return layout; }
  const parseRange = (t) => { const m = String(t || "").split(/[,\s]+/).filter(Boolean).map(Number); return m.length === 2 && m.every(Number.isFinite) && m[0] < m[1] ? m : null; };
  // the Appearance choices applied to a Plotly layout and its traces (called from plotDiv)
  function styleGraph(traces, L, A) {
    if (!A) return traces;
    const ax = (k) => (L[k] = Object.assign({}, L[k] || {}));
    if (A.fsize && Number(A.fsize) >= 6 && Number(A.fsize) <= 40) L.font = Object.assign({}, L.font, { size: Number(A.fsize) });
    if (A.palette && PALETTES[A.palette] && traces.length > 1) { const pal = PALETTES[A.palette]; traces = traces.map((t, i) => { const c = pal[i % pal.length], t2 = Object.assign({}, t); if (t2.marker && typeof t2.marker === "object" && !Array.isArray(t2.marker.color)) t2.marker = Object.assign({}, t2.marker, { color: c }); else if (!t2.marker && (t2.type === "bar" || t2.type === "box" || t2.type === "histogram" || t2.mode)) t2.marker = { color: c }; if (t2.line && typeof t2.line === "object") t2.line = Object.assign({}, t2.line, { color: c }); return t2; }); }
    if (A.legend === "top") L.legend = Object.assign({}, L.legend, { orientation: "h", x: 0, y: 1.14, yanchor: "bottom" }); else if (A.legend === "bottom") { L.legend = Object.assign({}, L.legend, { orientation: "h", x: 0, y: -0.28, yanchor: "top" }); L.margin = Object.assign({}, L.margin, { b: 90 }); } else if (A.legend === "none") L.showlegend = false;
    if (A.theme === "minimal") { ["xaxis", "yaxis"].forEach((k) => Object.assign(ax(k), { showline: false, zeroline: false, gridcolor: "#EEEEEE", ticks: "" })); } else if (A.theme === "classic") { ["xaxis", "yaxis"].forEach((k) => Object.assign(ax(k), { showline: true, linecolor: "#333333", linewidth: 1, showgrid: false, zeroline: false, ticks: "outside", mirror: false })); }
    const xr = parseRange(A.xrange), yr = parseRange(A.yrange); const cat = (k) => (L[k] && L[k].type === "category") || traces.some((t) => { const a = t[k === "xaxis" ? "x" : "y"]; return Array.isArray(a) && a.some((q) => typeof q === "string" && q !== "" && !Number.isFinite(Number(q))); });
    if (A.logx && !cat("xaxis")) ax("xaxis").type = "log"; if (A.logy && !cat("yaxis")) ax("yaxis").type = "log";
    const lg = (k, r) => (L[k] && L[k].type === "log" ? r.map((q) => (q > 0 ? Math.log10(q) : null)) : r);
    if (xr && !cat("xaxis")) ax("xaxis").range = lg("xaxis", xr); if (yr) ax("yaxis").range = lg("yaxis", yr);
    const refs = String(A.ref || "").split(",").map((s) => s.trim()).filter(Boolean); if (refs.length) { L.shapes = (L.shapes || []).slice(); L.annotations = (L.annotations || []).slice(); refs.forEach((r) => { const m = r.match(/^([xy])\s*=\s*(-?[\d.]+)\s*(?:\((.*)\))?$/i); if (!m) return; const val = Number(m[2]), lab = m[3] || `${m[1].toLowerCase()} = ${m[2]}`; if (m[1].toLowerCase() === "y") { L.shapes.push({ type: "line", xref: "paper", x0: 0, x1: 1, y0: val, y1: val, line: { dash: "dash", color: "#B5476B", width: 1.5 } }); L.annotations.push({ xref: "paper", x: 1, y: val, text: lab, showarrow: false, xanchor: "right", yanchor: "bottom", font: { size: 11, color: "#B5476B" } }); } else { L.shapes.push({ type: "line", yref: "paper", y0: 0, y1: 1, x0: val, x1: val, line: { dash: "dash", color: "#B5476B", width: 1.5 } }); L.annotations.push({ yref: "paper", y: 1, x: val, text: lab, showarrow: false, xanchor: "left", yanchor: "top", font: { size: 11, color: "#B5476B" } }); } }); }
    return traces;
  }
  // Small multiples (ggplot2's facet_wrap): the dialog runs once for the whole data (the card), then once per level with the rows
  // restricted (activeIdx) and the drawing captured instead of shown; the captured graphs are tiled on the card.
  let FACET = null, CAPTURE = null;
  function facetRun(onGo, v) {
    onGo(v); const cd = LASTCARD; if (!cd || !v.facet || !D.cols.includes(v.facet)) return;
    const vals = col(v.facet), key = byKey(v.facet), levels = [...new Set(vals.filter((q) => q !== "").map(key))].sort((a, b) => (isNum(v.facet) ? Number(a) - Number(b) : a < b ? -1 : a > b ? 1 : 0));
    const note = (t) => { const d = document.createElement("div"); d.className = "warn"; d.textContent = t; cd.appendChild(d); };
    if (levels.length < 2) { note(`Small multiples by ${v.facet}: only one level, so there is nothing to split.`); return; }
    const use = levels.slice(0, 12); if (levels.length > 12) note(`${v.facet} has ${levels.length} levels; the first 12 panels are shown.`);
    const saveLast = LASTCARD, savePend = PENDING, panels = [];
    use.forEach((l) => { FACET = { col: v.facet, level: l, key }; CAPTURE = []; try { onGo(Object.assign({}, v, { facet: "" })); panels.push({ level: l, plot: CAPTURE[0] || null, err: CAPTURE[0] ? null : "no graph" }); } catch (e) { panels.push({ level: l, plot: null, err: e.message || String(e) }); } });
    FACET = null; CAPTURE = null; LASTCARD = saveLast; PENDING = savePend;
    facetGrid(cd, panels, v);
  }
  function facetGrid(cd, panels, v) {
    const k = panels.length, cols = Math.min(3, k), rows = Math.ceil(k / cols), base = panels.find((p) => p.plot); if (!base) { const d = document.createElement("div"); d.className = "warn"; d.textContent = `Small multiples by ${v.facet} could not be drawn: ${panels[0].err}`; cd.appendChild(d); return; }
    const bl = base.plot.layout || {}, pick = (o, keys) => { const r = {}; (keys || []).forEach((q) => { if (o && o[q] !== undefined) r[q] = o[q]; }); return r; };
    const ys = [], xs = [], xcats = []; let yIsCat = false;
    panels.forEach((p) => p.plot && p.plot.traces.forEach((t) => { (t.y || []).forEach((q) => { if (typeof q === "number" && Number.isFinite(q)) ys.push(q); else if (typeof q === "string") yIsCat = true; }); (t.x || []).forEach((q) => { if (typeof q === "number" && Number.isFinite(q)) xs.push(q); else if (typeof q === "string" && !xcats.includes(q)) xcats.push(q); }); }));
    const pad = (arr, zero) => { if (!arr.length) return undefined; const lo = Math.min(...arr), hi = Math.max(...arr), m = (hi - lo || Math.abs(hi) || 1) * 0.06; return [zero && lo >= 0 ? 0 : lo - m, hi + m]; };
    const isBar = base.plot.traces.some((t) => t.type === "bar"), yr = yIsCat ? undefined : pad(ys, isBar), xr = xcats.length ? undefined : (base.plot.traces.some((t) => t.type === "box") ? undefined : pad(xs, false));
    const traces = [], L = { showlegend: false, annotations: [], margin: { t: 40, l: 50, r: 20, b: 50 }, title: `${(bl.title && bl.title.text) || bl.title || "Small multiples"}: by ${v.facet}` }, padx = 0.07, pady = 0.16;
    panels.forEach((p, i) => {
      const r = Math.floor(i / cols), c = i % cols, sfx = i ? String(i + 1) : "", xa = "x" + sfx, ya = "y" + sfx;
      const xd = [c / cols + padx / 2, (c + 1) / cols - padx / 2], yd = [1 - (r + 1) / rows + pady / 2, 1 - r / rows - pady / 2];
      const xax = Object.assign(pick(bl.xaxis, ["title", "type", "tickvals", "tickangle", "dtick", "tick0", "range"]), { domain: xd, anchor: ya }), yax = Object.assign(pick(bl.yaxis, ["title", "type", "range"]), { domain: yd, anchor: xa });
      if (r < rows - 1) delete xax.title; if (c > 0) delete yax.title; if (xcats.length) Object.assign(xax, { type: "category", categoryorder: "array", categoryarray: xcats }); if (xr && !xax.range) xax.range = xr; if (yr && !yax.range) yax.range = yr;
      L["xaxis" + sfx] = xax; L["yaxis" + sfx] = yax;
      if (p.plot) p.plot.traces.forEach((t) => traces.push(Object.assign({}, t, { xaxis: xa, yaxis: ya, showlegend: false })));
      L.annotations.push({ text: `${v.facet} = ${p.level}${p.err ? " (not drawn)" : ""}`, xref: "paper", yref: "paper", x: (xd[0] + xd[1]) / 2, y: yd[1] + 0.005, xanchor: "center", yanchor: "bottom", showarrow: false, font: { size: 12 } });
    });
    if (bl._app) L._app = Object.assign({}, bl._app, { facet: "", legend: "none" });
    plotDiv(cd, traces, L, Math.max(300, 230 * rows + 60));
    const d = document.createElement("div"); d.className = "say"; d.textContent = `One panel per level of ${v.facet}, on shared axes${isBar ? "; a histogram's classes are worked out within each panel" : ""}. R: + facet_wrap(~ ${v.facet}).`; cd.appendChild(d);
  }
  // Group by (Split by, Color by): each value of the grouping column is a group. A numeric column works when it has only a
  // few values (each one a group, in numeric order, 7.0 and 7 the same group); with more than MAXGROUPS values, or an ID
  // column, the dialog asks for a categorical grouping variable under the Group by box, so no graph is drawn from dozens of
  // one-person groups.
  const MAXGROUPS = 10;
  const byKey = (c) => (isNum(c) ? (q) => (q === "" || !Number.isFinite(Number(q)) ? q : String(Number(q))) : (q) => q);
  function byProblem(c) {
    if (!c || !D.cols.includes(c)) return "";
    if (D.types[c] === "id") return `${c} is an ID column (a different value on every row), so it cannot split the data into groups. Choose a categorical grouping variable, or (none).`;
    if (!isNum(c)) return "";
    let k = 0; try { k = new Set(col(c).filter((q) => q !== "").map(byKey(c))).size; } catch (e) { return ""; }
    return k > MAXGROUPS ? `${c} is a numeric column with ${k} different values, too many to use as groups. Choose a categorical grouping variable, or (none). To group by ranges of ${c}, make classes first with Bin into classes in the Data menu.` : "";
  }
  const selBy = (name, label) => Object.assign(selAny(name, label), { check: (raw) => byProblem(raw[name]) });
  function groupsOf(v) {
    if (!v.by) return [null];
    const bad = byProblem(v.by); if (bad) throw fieldErr("by", bad);
    const k = byKey(v.by), g = [...new Set(col(v.by).filter((q) => q !== "").map(k))];
    return isNum(v.by) ? g.sort((a, b) => Number(a) - Number(b)) : g;
  }
  function subset(x, v, g) { if (g == null) return col(x); const k = byKey(v.by), b = col(v.by); return col(x).filter((_, i) => k(b[i]) === g); }
  // a box plot's value axis runs from a labelled tick at or below the smallest value to one at or above the largest, so an
  // outlier is never drawn past the last label (Commute_Minutes had 68 and 70 floating above a last tick of 60)
  function coverAxis(vals) {
    const x = vals.map(Number).filter(Number.isFinite); if (!x.length) return {};
    const lo = Math.min(...x), hi = Math.max(...x), span = hi - lo || Math.abs(hi) || 1, raw = span / 5, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const dtick = [1, 2, 5, 10].map((m) => m * p).find((d) => d >= raw), a = Math.floor(lo / dtick + 1e-9) * dtick, b = Math.ceil(hi / dtick - 1e-9) * dtick;
    return { range: [a - 0.12 * dtick, b + 0.12 * dtick], tick0: a, dtick };
  }
  function meanMedianShapes(d) { return [{ type: "line", x0: d.mean, x1: d.mean, y0: 0, y1: 1, yref: "paper", line: { color: "#C0392B", width: 2 } }, { type: "line", x0: d.median, x1: d.median, y0: 0, y1: 1, yref: "paper", line: { color: "#1A3A4D", width: 2, dash: "dash" } }]; }
  const honest = (items) => `<div class="formula">${esc("Honest-graph rules applied: " + items.join(" "))}</div>`;
  function gBar() {
    needData();
    dialog("Graph: Bar Plot", [selCat("x", "Categorical variable"), selBy("by", "Group by"), sel("type", "Type", [["count", "Frequency (counts)"], ["rel", "Percent (relative frequency times 100)"]], "count"), sel("order", "Order", [["auto", "automatic (tallest first; ordinal scales keep their natural order)"], ["count", "tallest first"], ["alpha", "alphabetical"], ["data", "order of first appearance"]], "auto"), { name: "labels", label: "Show the count (or percent) above each bar", type: "check", value: true }, { name: "tbl", label: "Frequency table under the graph", type: "check", value: true }, { name: "horiz", label: "Horizontal bars", type: "check", value: false }, ...appearanceFields()], (v) => {
      const groups = groupsOf(v); const c0 = SW.counts(col(v.x)); let keys = Object.keys(c0); const nat = SW.naturalOrder(keys), ordinal = D.types[v.x] === "ordinal" || !!nat;
      let order = v.order; if (order === "auto") order = ordinal ? "natural" : "count";
      if (order === "count") keys.sort((a, b) => c0[b] - c0[a]); else if (order === "alpha") keys.sort(); else if (order === "natural" && nat) keys = nat;
      const nAll = Object.values(c0).reduce((s, q) => s + q, 0);
      const traces = groups.map((g) => { const c = SW.counts(subset(v.x, v, g)), n = Object.values(c).reduce((s, q) => s + q, 0); const y = keys.map((k) => (v.type === "rel" ? (100 * (c[k] || 0)) / n : c[k] || 0)); const text = v.labels ? y.map((q) => (v.type === "rel" ? fmt(q, 1) + "%" : String(q))) : undefined; const base = { type: "bar", name: g == null ? v.x : String(g), text, textposition: "outside", cliponaxis: false, marker: g == null ? { color: C(v) } : {} }; return v.horiz ? Object.assign(base, { y: keys, x: y, orientation: "h" }) : Object.assign(base, { x: keys, y }); });
      const ymax = Math.max(...traces.flatMap((t) => (v.horiz ? t.x : t.y)));
      let html = say("Bars are separated because the categories are separate things. " + (order === "natural" ? "This variable is an ordered scale, so the bars keep their natural order; sorting an ordered scale by height would hide its shape." : "Tallest first tells the eye what the story is.") + " Relative frequency lets you compare groups of different sizes.");
      if (v.tbl) { let cum = 0; const rows = keys.map((k) => { cum += c0[k]; return [k, c0[k], fmt(c0[k] / nAll, 3), fmt((100 * c0[k]) / nAll, 1) + "%", cum, fmt(cum / nAll, 3)]; }); rows.push(["Total", nAll, "1.000", "100%", "", ""]); html += table([v.x, "Frequency", "Relative frequency", "Percent", "Cumulative frequency", "Cumulative relative frequency"], rows, "Frequency table" + (groups.length > 1 ? " (all groups together)" : "")); }
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
    dialog("Graph: Histogram", [selNum("x", "Numeric variable"), selBy("by", "Group by"), sel("type", "Type", [["count", "Frequency"], ["rel", "Percent (relative frequency times 100)"], ["dens", "Density"]], "count"), { name: "bw", label: "Bin width (blank = automatic)", type: "number", value: "" }, { name: "start", label: "Start bins at (blank = automatic)", type: "number", value: "" }, { name: "labels", label: "Show the frequency above each bin", type: "check", value: true }, { name: "tbl", label: "Frequency table under the graph", type: "check", value: true }, { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }, { name: "normal", label: "Overlay a normal curve (mean and SD of the data)", type: "check", value: false }, ...appearanceFields()], (v) => {
      const groups = groupsOf(v); const d = SW.describe(col(v.x)) || {};
      const B = SW.histBins(col(v.x), Number.isFinite(v.bw) && v.bw > 0 ? v.bw : null, Number.isFinite(v.start) ? v.start : null); if (!B) throw new Error("No numeric values.");
      if (B.counts.length > 200) throw new Error("That bin width gives more than 200 bins. Use a wider bin.");
      const traces = groups.map((g) => { const counts = g == null ? B.counts : SW.countsWith(B.edges, subset(v.x, v, g)), n = counts.reduce((s, q) => s + q, 0); const y = counts.map((c) => (v.type === "rel" ? (100 * c) / n : v.type === "dens" ? c / (n * B.width) : c)); return { x: B.mids, y, width: B.width, type: "bar", name: g == null ? v.x : String(g), opacity: groups.length > 1 ? 0.6 : 1, text: v.labels ? y.map((q, j) => (v.type === "count" ? String(counts[j]) : fmt(q, v.type === "rel" ? 1 : 3))) : undefined, textposition: "outside", cliponaxis: false, marker: { color: groups.length > 1 ? undefined : C(v), line: { color: "#fff", width: 1 } }, hovertext: B.labels.map((l, j) => `${l}: ${counts[j]}`), hoverinfo: "text+name" }; });
      if (v.normal && d.sd > 0) { const scale = v.type === "rel" ? 100 * B.width : v.type === "dens" ? 1 : B.n * B.width, lo = Math.min(B.edges[0], d.mean - 3.5 * d.sd), hi = Math.max(B.edges[B.edges.length - 1], d.mean + 3.5 * d.sd), xs = Array.from({ length: 201 }, (_, i) => lo + ((hi - lo) * i) / 200); traces.push({ x: xs, y: xs.map((q) => scale * jStat.normal.pdf(q, d.mean, d.sd)), type: "scatter", mode: "lines", name: "normal curve", line: { color: "#1A3A4D", width: 2 }, hoverinfo: "skip" }); }
      const ymax = Math.max(...traces.flatMap((t) => t.y));
      let html = (v.normal && d.sd > 0 ? say(`The curve is the normal distribution with the same mean (${fmt(d.mean)}) and SD (${fmt(d.sd)}) as the data${groups.length > 1 ? ", all groups together" : ""}. If the bars follow it closely, a normal model is reasonable; a skew or a second peak shows up as bars pulling away from the curve.`) : "") + say("Bars touch because the number line has no gaps. Bin width is a decision: too few bins hide structure, too many turn noise into peaks. Try two or three widths before believing a feature. Read shape (symmetric, skewed, peaks), centre, spread, and anything unusual.");
      if (v.tbl) { let cum = 0; html += table(["Class", "Frequency", "Relative frequency", "Percent", "Cumulative frequency", "Cumulative relative frequency"], B.counts.map((c, j) => { cum += c; return [B.labels[j], c, fmt(c / B.n, 3), fmt((100 * c) / B.n, 1) + "%", cum, fmt(cum / B.n, 3)]; }).concat([["Total", B.n, "1.000", "100%", "", ""]]), `Frequency table, bin width ${B.width}` + (groups.length > 1 ? " (all groups together)" : "")); }
      const cd = card("Histogram: " + v.x + (v.by ? " by " + v.by : ""), src(`n = ${d.n}, mean ${fmt(d.mean)}, median ${fmt(d.median)}, s = ${fmt(d.sd)}; ${B.counts.length} bins of width ${B.width} from ${B.start}`), html);
      plotDiv(cd, traces, applyAppearance({ barmode: "overlay", bargap: 0, xaxis: { title: v.x, tickvals: B.edges.length <= 16 ? B.edges : undefined, tickangle: B.edges.length > 8 ? -45 : 0 }, yaxis: { title: v.type === "rel" ? "Percent" : v.type === "dens" ? "Density" : "Count", range: [0, ymax * 1.18], fixedrange: true }, shapes: v.lines && groups.length === 1 ? meanMedianShapes(d) : [], showlegend: groups.length > 1 }, v));
      cd.insertAdjacentHTML("beforeend", honest([`Every bin has the same width (${B.width}), so area equals height and the eye is not fooled by a wide bin.`, "Each class includes its left edge; the last class also includes the maximum, so every value is counted once.", "The count axis starts at zero and cannot be zoomed.", groups.length > 1 ? "All groups share the same bin edges; different bins per group would make the shapes incomparable." : "", "Tick marks sit on the bin edges, so you can read exactly where each class begins and ends."].filter(Boolean)));
    });
  }
  function gDot() {
    needData();
    dialog("Graph: Dotplot", [selNum("x", "Numeric variable"), selBy("by", "Group by"), { name: "lines", label: "Mark mean (solid) and median (dashed)", type: "check", value: true }, ...appearanceFields()], (v) => {
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
    dialog("Graph: Boxplot", [{ name: "vars", label: "Numeric variables (several draw side by side)", type: "multi", options: numCols() }, selBy("by", "Group by"), { name: "pts", label: "Show all points", type: "check", value: false }, { name: "horiz", label: "Horizontal", type: "check", value: false }, ...appearanceFields()], (v) => {
      if (!v.vars.length) throw new Error("Pick at least one variable.");
      const groups = groupsOf(v); const traces = [];
      v.vars.forEach((x) => groups.forEach((g) => { const vals = SW.num(subset(x, v, g)); traces.push(Object.assign({ type: "box", quartilemethod: "exclusive", name: (v.vars.length > 1 ? x : "") + (g == null ? (v.vars.length > 1 ? "" : x) : (v.vars.length > 1 ? " " : "") + String(g)), boxpoints: v.pts ? "all" : "outliers", jitter: 0.3, hoveron: "points", hoverinfo: v.horiz ? "x+name" : "y+name", marker: { color: C(v) } }, v.horiz ? { x: vals } : { y: vals })); }));
      const fences = v.vars.map((x) => { const d = SW.describe(col(x)); return `${x}: Q1 ${fmt(d.q1)}, median ${fmt(d.median)}, Q3 ${fmt(d.q3)}, fences ${fmt(d.lowerFence)} and ${fmt(d.upperFence)}`; }).join("; ");
      const cd = card("Boxplot: " + v.vars.join(", ") + (v.by ? " by " + v.by : ""), src(fences), say("Box from Q1 to Q3 (textbook rule: median of each half, overall median excluded), line at the median, whiskers to the last values inside the fences, dots beyond. Dots are worth a look, not wrong. Shape decides the summary: symmetric, mean with s; skewed or with dots, median with IQR."));
      plotDiv(cd, traces, applyAppearance({ [v.horiz ? "xaxis" : "yaxis"]: Object.assign({ title: v.vars.length === 1 ? v.vars[0] : "" }, coverAxis(traces.flatMap((t) => (v.horiz ? t.x : t.y)))), showlegend: false }, v));
    });
  }
  function gScatter() {
    needData();
    dialog("Graph: Scatter Plot", [selNum("x", "X variable"), selNum("y", "Y variable"), selBy("by", "Color by"), { name: "line", label: "Least-squares line", type: "check", value: true }, { name: "label", label: "Label points with (optional column)", type: "select", options: [["", "(none)"]].concat(D.cols) }, ...appearanceFields()], (v) => {
      const r = SW.regress(col(v.x), col(v.y)); const groups = groupsOf(v), bk = v.by ? col(v.by).map(byKey(v.by)) : null, xs0 = col(v.x), ys0 = col(v.y), ls0 = v.label ? col(v.label) : null;
      const traces = groups.map((g) => { const keep = (i) => g == null || bk[i] === g; const tr = { x: xs0.filter((_, i) => keep(i)), y: ys0.filter((_, i) => keep(i)), mode: v.label ? "markers+text" : "markers", type: "scatter", name: g == null ? "data" : String(g), textposition: "top center", textfont: { size: 9 } }; if (v.label) tr.text = ls0.filter((_, i) => keep(i)); if (g == null) tr.marker = { color: C(v) }; return tr; });
      if (v.line) { const xs = [Math.min(...r.x), Math.max(...r.x)]; traces.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: `y = ${fmt(r.b0, 3)} + ${fmt(r.b1, 4)} x`, line: { color: "#C0392B" } }); }
      const cd = card(`Scatter Plot: ${v.y} against ${v.x}`, src(`n = ${r.n}, r = ${fmt(r.r)}, r squared = ${fmt(r.r2)}`), say("Describe direction, form, strength, and outliers, in that order. r measures linear association only. Correlation is not causation."));
      plotDiv(cd, traces, applyAppearance({ xaxis: { title: v.x }, yaxis: { title: v.y }, showlegend: groups.length > 1 || v.line }, v));
    });
  }
  function gQQ() {
    needData();
    dialog("Graph: QQ Plot (normality check)", [selNum("x", "Numeric variable"), selBy("by", "Group by")], (v) => {
      // a group with fewer than 3 values gets no Q-Q plot; the card says which, just under its description
      const parts = groupsOf(v).map((g) => { const vals = subset(v.x, v, g); return { g, vals, d: SW.describe(vals) }; }), big = (q) => q.d && q.d.n >= 3, few = parts.filter((q) => !big(q)).map((q) => (q.g == null ? v.x : q.g));
      const cd = card("QQ Plot: " + v.x, src(), say("Points along the line: roughly normal. A curve at one end: skew. Points peeling off at both ends: heavy tails or outliers. Use this to justify a t procedure when n is under 30.") + (few.length ? warn(`No Q-Q plot for ${esc(few.join(", "))}: ${few.length > 1 ? "each has" : "it has"} fewer than 3 numeric values, too few to check normality.`) : ""));
      parts.filter(big).forEach(({ g, vals, d }) => { const q = SW.qq(vals), lo = Math.min(...q.map((p) => p.theo)), hi = Math.max(...q.map((p) => p.theo)); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" }, name: "data" }, { x: [lo, hi], y: [d.mean + lo * d.sd, d.mean + hi * d.sd], mode: "lines", line: { color: "#C0392B" }, name: "normal" }], { title: g == null ? v.x : `${v.x} (${g})`, xaxis: { title: "theoretical quantiles" }, yaxis: { title: v.x }, showlegend: false }, 280); });
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

  // ================= Which test? =================
  // The most common question in a first course, which twelve menu headings do not answer: three questions open the right
  // dialog. Rows: what was measured; columns: one group against a value, two groups (independent or paired), three or more,
  // or a relationship with a second variable (a number or a category).
  const WIZ = {
    num: { one: ["T-Tests", "One Sample T-Test", "One sample mean against a test value: t, because sigma is not known."], ind: ["T-Tests", "Independent Samples T-Test", "Two means from different people: Welch's t."], pair: ["T-Tests", "Paired Samples T-Test", "Each person measured twice: a t-test on the mean of the differences."], many: ["ANOVA", "One-Way ANOVA", "Three or more means at once; the Tukey table says which pairs differ."], relnum: ["Regression", "Linear Regression", "How one number predicts another: the slope, r and r squared (Correlation Matrix gives r alone)."], relcat: ["ANOVA", "One-Way ANOVA", "A number across the levels of a category is a comparison of group means: two levels, an independent t-test; more, ANOVA, which handles two as well."] },
    two: { one: ["Frequencies", "One proportion: z test", "One proportion against a claimed value: the z test when n p0 and n(1 minus p0) are both at least 10 (the card checks), with the exact binomial test shown alongside."], ind: ["Frequencies", "Two proportions: z test", "Two proportions from different people."], pair: ["Advanced", "McNemar test (paired yes or no)", "The same people answering yes or no twice."], many: ["Frequencies", "Contingency Tables: Independent Samples", "A yes-or-no outcome across several groups is a two-way table: the chi-square test of association."], relnum: ["Advanced", "Logistic Regression", "A yes-or-no outcome predicted by a number."], relcat: ["Frequencies", "Contingency Tables: Independent Samples", "Two categories: a two-way table and the chi-square test of association."] },
    many: { one: ["Frequencies", "N Outcomes: chi-square Goodness of fit", "Counts in each category against claimed (or equal) proportions."], ind: ["Frequencies", "Contingency Tables: Independent Samples", "Categories by group: a two-way table and the chi-square test of association."], pair: ["Frequencies", "Contingency Tables: Independent Samples", "With more than two outcomes a first course has no paired test; the two-way table is the usual choice (say in the write-up that the samples are paired)."], many: ["Frequencies", "Contingency Tables: Independent Samples", "Categories by group: a two-way table and the chi-square test of association."], relnum: ["ANOVA", "One-Way ANOVA", "Turn it round: treat the number as the outcome and compare its mean across the categories."], relcat: ["Frequencies", "Contingency Tables: Independent Samples", "Two categories: a two-way table and the chi-square test of association."] }
  };
  const wizKey = (raw) => (raw.q === "two" ? (raw.pair === "pair" ? "pair" : "ind") : raw.q === "rel" ? (raw.x === "cat" ? "relcat" : "relnum") : raw.q === "many" ? "many" : "one");
  function whichTest() {
    const pick = (raw) => (WIZ[raw.y] && WIZ[raw.y][wizKey(raw)]) || WIZ.num.one;
    dialog("Which test?", [
      sel("y", "What did you measure on each person (or unit)?", [["num", "a number (a score, minutes, GPA, a height)"], ["two", "a yes or no (two outcomes: passed or not, owns a pet or not)"], ["many", "a category with more than two outcomes (major, commute method)"]], "num"),
      sel("q", "What is the question?", [["one", "compare one group with a known or claimed value"], ["two", "compare two groups"], ["many", "compare three or more groups"], ["rel", "look for a relationship between two variables"]], "two"),
      Object.assign(sel("pair", "The two groups are", [["ind", "different people (independent samples)"], ["pair", "the same people measured twice, or matched pairs"]], "ind"), { vis: (raw) => raw.q === "two" }),
      Object.assign(sel("x", "The other variable is", [["num", "a number"], ["cat", "a category"]], "num"), { vis: (raw) => raw.q === "rel" }),
      { name: "rec", type: "note", text: (raw) => { const r = pick(raw); return `${r[1]} (${r[0]} menu). ${r[2]}`; } }], (v) => {
      const r = pick(v), it = findItem(r[0], r[1]);
      if (!D.rows.length || !it) { const cd = card("Which test?", `${r[1]}, ${r[0]} menu`, say(`${r[2]} Open a data file (Data menu), then find ${r[1]} under ${r[0]}.`)); cd._skip = true; return; }
      setTimeout(() => runItem(r[0], it), 0); // once this dialog has closed
    }, D.rows.length ? "Open it" : "Note it");
  }

  // ================= T-Tests =================
  function zOneSample() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: One Sample Z-Test (sigma known)", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      only(hasData ? selNum("x", "Variable") : null, onData),
      { name: "xbar", label: "Sample mean", type: "number", group: "Summary statistics", vis: onSummary }, { name: "n", label: "N", type: "number", group: "Summary statistics", vis: onSummary },
      { name: "sigma", label: "Population standard deviation sigma (given in the problem)", type: "number" },
      { name: "mu0", label: "Test value", type: "number", value: 0 }, hypField("Mean"), confField, alphaField], (v) => {
      let xbar = v.xbar, n = v.n, label = "value", from = "summary statistics";
      if (v.mode === "data") { const d = SW.describe(col(v.x)); if (!d) throw new Error("Need at least two numeric values."); xbar = d.mean; n = d.n; label = v.x; from = src(); }
      if (!(v.sigma > 0)) throw new Error("Type the population standard deviation sigma. If the problem gives only the sample SD s, use the One Sample T-Test instead.");
      if (!(n >= 1) || !Number.isFinite(xbar)) throw new Error("Type the sample mean and N.");
      const r = SW.oneZ({ xbar, sigma: v.sigma, n, mu0: v.mu0, alt: v.alt, conf: +v.conf }), pc = Math.round(r.conf * 100);
      let html = table(["", "N", "Mean", "sigma", "SE = sigma / sqrt(n)", "z", "p", `${pc}% CI lower`, "upper"], [[label, n, xbar, v.sigma, r.se, r.z, SW.fmtP(r.p), r.lower, r.upper]], "One Sample Z-Test") + `<div class="note">Note. H<sub>a</sub> mu ${altWord(v.alt)} ${v.mu0}. z* = ${fmt(r.zstar)}.</div>`;
      html += formula("z = (x bar minus test value) / (sigma / sqrt(n)); interval x bar plus or minus z* sigma / sqrt(n). Use z only when the population sigma is actually given; with the sample SD s, use t.");
      html += worked([`z = (${fmt(xbar)} minus ${v.mu0}) / (${v.sigma} / sqrt(${n})) = ${fmt(xbar - v.mu0)} / ${fmt(r.se)} = ${fmt(r.z)}`, `interval: ${fmt(xbar)} plus or minus ${fmt(r.zstar)} times ${fmt(r.se)} = ${fmt(r.lower)} to ${fmt(r.upper)}`]);
      html += apa(`z = ${apaN(r.z, 2)}, ${apaP(r.p)}, ${pc}% CI [${apaN(r.lower, 2)}, ${apaN(r.upper, 2)}]`);
      html += say(`H0: mu = ${v.mu0}. Ha: mu ${altWord(v.alt)} ${v.mu0}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population mean is ${altWord(v.alt)} ${v.mu0}.` : `There is not enough evidence that the population mean is ${altWord(v.alt)} ${v.mu0}.`} We are ${pc} percent confident the population mean is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      html += cond(n >= 30, "N is at least 30: the z procedure is fine whatever the population shape.", "N is under 30: this needs a roughly normal population; state that the assumptions are met.");
      const cd = card("One Sample Z-Test", from, html); zPlot(cd, r.z, v.alt);
    });
  }
  function zTwoSample() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: Two Sample Z-Test (sigmas known)", [
      hasData ? sel("mode", "Data", [["data", "variable and grouping variable"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      only(hasData ? selNum("x", "Variable") : null, onData), only(hasData ? selCat("g", "Grouping variable") : null, onData), only(hasData ? lvField : null, onData),
      { name: "m1", label: "Mean 1", type: "number", group: "Group 1", vis: onSummary }, { name: "n1", label: "N 1", type: "number", group: "Group 1", vis: onSummary },
      { name: "m2", label: "Mean 2", type: "number", group: "Group 2", vis: onSummary }, { name: "n2", label: "N 2", type: "number", group: "Group 2", vis: onSummary },
      { name: "s1", label: "sigma 1 (population SD, given)", type: "number", group: "Known population SDs", vis: onSummary }, { name: "s2", label: "sigma 2 (population SD, given)", type: "number", group: "Known population SDs", vis: onSummary },
      sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"), confField, alphaField], (v) => {
      let m1 = v.m1, n1 = v.n1, m2 = v.m2, n2 = v.n2, names = ["Group 1", "Group 2"], from = "summary statistics";
      if (v.mode === "data") { let lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (v.lv && v.lv.trim()) lv = v.lv.split(",").map((q) => q.trim()); if (lv.length < 2) throw new Error(`${v.g} needs two levels.`); lv = lv.slice(0, 2); names = lv; const a = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[0])), b = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[1])); if (!a || !b) throw new Error("Each group needs at least two numeric values."); m1 = a.mean; n1 = a.n; m2 = b.mean; n2 = b.n; from = src(`${v.x} by ${v.g}`); }
      if (!(v.s1 > 0 && v.s2 > 0)) throw new Error("Type both population standard deviations. If only sample SDs are known, use the Independent Samples T-Test.");
      if (![m1, m2].every(Number.isFinite) || !(n1 >= 1 && n2 >= 1)) throw new Error("Type the mean and N for both groups.");
      const r = SW.twoZ({ m1, s1: v.s1, n1, m2, s2: v.s2, n2, alt: v.alt, conf: +v.conf }), pc = Math.round(r.conf * 100);
      let html = table(["Group", "N", "Mean", "sigma"], [[names[0], n1, m1, v.s1], [names[1], n2, m2, v.s2]], "Groups") + table(["Difference (1 minus 2)", "SE", "z", "p", `${pc}% CI lower`, "upper"], [[r.diff, r.se, r.z, SW.fmtP(r.p), r.lower, r.upper]], "Two Sample Z-Test");
      html += formula("z = (x bar 1 minus x bar 2) / sqrt(sigma1^2/n1 + sigma2^2/n2). Only when both population SDs are given; otherwise use t.");
      html += worked([`z = (${fmt(m1)} minus ${fmt(m2)}) / sqrt(${v.s1}^2 / ${n1} + ${v.s2}^2 / ${n2}) = ${fmt(r.diff)} / ${fmt(r.se)} = ${fmt(r.z)}`, `interval: ${fmt(r.diff)} plus or minus z* times ${fmt(r.se)} = ${fmt(r.lower)} to ${fmt(r.upper)}`]);
      html += apa(`z = ${apaN(r.z, 2)}, ${apaP(r.p)}, ${pc}% CI [${apaN(r.lower, 2)}, ${apaN(r.upper, 2)}]`);
      html += say(`H0: mu1 = mu2. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${esc(names[0])} is ${altWord(v.alt)} the mean of ${esc(names[1])}.` : `There is not enough evidence of a difference in the direction stated.`} We are ${pc} percent confident the difference in means is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      const cd = card("Two Sample Z-Test", from, html); zPlot(cd, r.z, v.alt);
    });
  }
  function varianceUI() {
    const hasData = D.rows.length > 0;
    dialog("Advanced: Variance tests (one SD or two SDs)", [sel("which", "Test", [["one", "One sample: SD against a claimed value (chi-square)"], ["two", "Two samples: compare two SDs (F)"]], "one"),
      hasData ? sel("mode", "Data", [["data", "from the data"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      only(hasData ? selNum("x", "Variable") : null, onData), only(hasData ? selCat("g", "Grouping variable (two samples)") : null, (raw) => onData(raw) && raw.which === "two"), only(hasData ? lvField : null, (raw) => onData(raw) && raw.which === "two"),
      { name: "s1", label: "SD (sample 1)", type: "number", group: "Summary statistics", vis: onSummary }, { name: "n1", label: "N (sample 1)", type: "number", group: "Summary statistics", vis: onSummary }, { name: "s2", label: "SD (sample 2)", type: "number", group: "Summary statistics", vis: (raw) => onSummary(raw) && raw.which === "two" }, { name: "n2", label: "N (sample 2)", type: "number", group: "Summary statistics", vis: (raw) => onSummary(raw) && raw.which === "two" },
      { name: "sigma0", label: "Claimed population SD (one sample)", type: "number", value: 1, vis: (raw) => raw.which !== "two" },
      sel("alt", "Hypothesis", [["two", "not equal"], ["greater", "greater than (sample 1 SD larger)"], ["less", "less than"]], "two"), confField, alphaField], (v) => {
      let s1 = v.s1, n1 = v.n1, s2 = v.s2, n2 = v.n2, names = ["sample 1", "sample 2"], from = "summary statistics";
      if (v.mode === "data") {
        if (v.which === "one") { const d = SW.describe(col(v.x)); if (!d) throw new Error("Need at least two numeric values."); s1 = d.sd; n1 = d.n; names[0] = v.x; from = src(v.x); }
        else { let lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (v.lv && v.lv.trim()) lv = v.lv.split(",").map((q) => q.trim()); if (lv.length < 2) throw new Error(`${v.g} needs two levels.`); lv = lv.slice(0, 2); names = lv; const a = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[0])), b = SW.describe(col(v.x).filter((_, i) => col(v.g)[i] === lv[1])); if (!a || !b) throw new Error("Each group needs at least two values."); s1 = a.sd; n1 = a.n; s2 = b.sd; n2 = b.n; from = src(`${v.x} by ${v.g}`); }
      }
      if (!(s1 > 0 && n1 >= 2)) throw new Error("Type the SD and N of sample 1 (N at least 2).");
      const pc = Math.round(+v.conf * 100), dirWord = v.alt === "two" ? "different from" : v.alt === "greater" ? "greater than" : "less than";
      let html, cd;
      if (v.which === "one") {
        if (!(v.sigma0 > 0)) throw new Error("Type the claimed population SD.");
        const r = SW.oneVar({ s: s1, n: n1, sigma0: v.sigma0, alt: v.alt, conf: +v.conf });
        html = table(["", "N", "s", "Claimed sigma", "chi-square", "df", "p"], [[names[0], n1, s1, v.sigma0, r.chi, r.df, SW.fmtP(r.p)]], "One sample variance test") + table(["", "lower", "upper"], [[`${pc}% CI for sigma`, r.sdLower, r.sdUpper], [`${pc}% CI for sigma squared`, r.varLower, r.varUpper]], "Confidence intervals");
        html += formula("chi-square = (n minus 1) s^2 / sigma0^2 on n minus 1 df. Interval for sigma squared: (n minus 1) s^2 / chi-square upper and lower critical values; take square roots for sigma.");
        html += say(`H0: sigma = ${v.sigma0}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population SD is ${dirWord} ${v.sigma0}.` : `There is not enough evidence that the population SD is ${dirWord} ${v.sigma0}.`}`);
        html += warn("This test needs a normal population, whatever the sample size. Unlike the t test, it does not become safe for large N; check a Q-Q plot.");
        cd = card("One Sample Variance Test", from, html);
      } else {
        if (!(s2 > 0 && n2 >= 2)) throw new Error("Type the SD and N of sample 2 (N at least 2).");
        const r = SW.twoVar({ s1, n1, s2, n2, alt: v.alt, conf: +v.conf });
        html = table(["Sample", "N", "SD", "Variance"], [[names[0], n1, s1, s1 * s1], [names[1], n2, s2, s2 * s2]], "Samples") + table(["F = s1^2 / s2^2", "df1", "df2", "p", `${pc}% CI for sigma1^2 / sigma2^2: lower`, "upper"], [[r.F, r.d1, r.d2, SW.fmtP(r.p), r.lower, r.upper]], "Two sample variance test (F)");
        html += say(`H0: sigma1 = sigma2. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the SD of ${esc(names[0])} is ${dirWord} the SD of ${esc(names[1])}.` : "There is not enough evidence of a difference in spread."}`);
        html += warn("The F test is very sensitive to non-normal data. To check equal spread before ANOVA, Levene's test (in One-Way ANOVA) is safer.");
        cd = card("Two Sample Variance Test", from, html);
      }
    });
  }
  function tOneSample() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: One Sample T-Test", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      only(hasData ? selNum("x", "Dependent variable") : null, onData),
      { name: "xbar", label: "Mean", type: "number", group: "Summary statistics", vis: onSummary }, { name: "s", label: "Std. deviation", type: "number", group: "Summary statistics", vis: onSummary }, { name: "n", label: "N", type: "number", group: "Summary statistics", vis: onSummary },
      { name: "mu0", label: "Test value", type: "number", value: 0 }, hypField("Mean"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size (Cohen's d)", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      let xbar = v.xbar, s = v.s, n = v.n, label = "value", from = "summary statistics";
      if (v.mode === "data") { const d = SW.describe(col(v.x)); if (!d) throw new Error("Need at least two numeric values."); xbar = d.mean; s = d.sd; n = d.n; label = v.x; from = src(); }
      else if (!Number.isFinite(xbar) || !(s > 0) || !(n >= 2)) throw new Error("Type the mean, the standard deviation and N (the SD above 0, N at least 2).");
      if (!Number.isFinite(v.mu0)) throw new Error("Type a test value.");
      const r = SW.oneMean({ xbar, s, n, mu0: v.mu0, alt: v.alt, conf: +v.conf });
      const hdr = ["", "", "Statistic", "df", "p"], row = [label, "Student's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference"); row.push(xbar - v.mu0); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower - v.mu0, r.upper - v.mu0); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "One Sample T-Test") + `<div class="note">Note. H<sub>a</sub> mu ${altWord(v.alt)} ${v.mu0}. Confidence interval is for the mean difference; the interval for the mean itself is ${fmt(r.lower)} to ${fmt(r.upper)}.</div>`;
      if (v.desc) html += table(["", "N", "Mean", "Median", "SD", "SE"], [[label, n, xbar, v.mode === "data" ? SW.describe(col(v.x)).median : "", s, r.se]], "Descriptives");
      html += formula(`t = (x bar minus test value) / (s / sqrt(n)), df = n minus 1. Sigma is not given, so t, never z.`);
      html += worked([`t = (${fmt(xbar)} minus ${v.mu0}) / (${fmt(s)} / sqrt(${n})) = ${fmt(xbar - v.mu0)} / ${fmt(r.se)} = ${fmt(r.t)}, df = ${n} minus 1 = ${r.df}`, `interval: ${fmt(xbar)} plus or minus ${fmt(r.tstar)} times ${fmt(r.se)} = ${fmt(r.lower)} to ${fmt(r.upper)}`, `d = (${fmt(xbar)} minus ${v.mu0}) / ${fmt(s)} = ${fmt(r.d)}`]);
      html += apa(`t(${r.df}) = ${apaN(r.t, 2)}, ${apaP(r.p)}, d = ${apaN(r.d, 2)}, ${Math.round(r.conf * 100)}% CI [${apaN(r.lower, 2)}, ${apaN(r.upper, 2)}]`);
      html += say(`H0: mu = ${v.mu0}. Ha: mu ${altWord(v.alt)} ${v.mu0}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the population mean of ${esc(label)} is ${altWord(v.alt)} ${v.mu0}.` : `There is not enough evidence that the population mean of ${esc(label)} is ${altWord(v.alt)} ${v.mu0}.`} The sample mean is ${fmt(xbar)}, ${fmt(Math.abs(r.d), 2)} standard deviations from ${v.mu0}.`);
      html += cond(n >= 30, "N is at least 30: the t procedure is fine whatever the population shape.", "N is under 30: this needs a roughly normal population (check the Q-Q plot in Descriptives); state that the assumptions are met.");
      const cd = card("One Sample T-Test", from, html); tPlot(cd, r.t, r.df, v.alt);
    });
  }
  function tIndependent() {
    const hasData = D.rows.length > 0;
    dialog("T-Tests: Independent Samples T-Test", [
      hasData ? sel("mode", "Data", [["data", "dependent variable and grouping variable"], ["summary", "from summary statistics"]], "data") : sel("mode", "Data", [["summary", "from summary statistics"]]),
      only(hasData ? selNum("x", "Dependent variable") : null, onData), only(hasData ? selCat("g", "Grouping variable") : null, onData), only(hasData ? { name: "lv", label: "If the grouping variable has more than two levels, name the two to compare, comma separated (blank = the first two)", type: "text" } : null, onData),
      { name: "m1", label: "Mean 1", type: "number", group: "Group 1", vis: onSummary }, { name: "s1", label: "SD 1", type: "number", group: "Group 1", vis: onSummary }, { name: "n1", label: "N 1", type: "number", group: "Group 1", vis: onSummary },
      { name: "m2", label: "Mean 2", type: "number", group: "Group 2", vis: onSummary }, { name: "s2", label: "SD 2", type: "number", group: "Group 2", vis: onSummary }, { name: "n2", label: "N 2", type: "number", group: "Group 2", vis: onSummary },
      { name: "welch", label: `Welch's (unequal variances, the default ${PROF && PROF.name ? "in " + PROF.name : "here"})`, type: "check", value: !PROF || PROF.welch, group: "Tests" },
      sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"),
      { name: "meanDiff", label: "Mean difference", type: "check", value: true, group: "Additional statistics" }, { name: "ci", label: "Confidence interval", type: "check", value: true, group: "Additional statistics" }, { name: "es", label: "Effect size", type: "check", value: true, group: "Additional statistics" }, { name: "desc", label: "Descriptives", type: "check", value: true, group: "Additional statistics" }, { name: "plot", label: "Descriptives plots", type: "check", value: true, group: "Additional statistics" },
      confField, alphaField], (v) => {
      let a, b, names = ["Group 1", "Group 2"], from = "summary statistics", ga = [], gb = [];
      if (v.mode === "data") { let lv = [...new Set(col(v.g).filter((q) => q !== ""))]; if (v.lv && v.lv.trim()) { const pick = v.lv.split(",").map((s) => s.trim()); const bad = pick.filter((s) => !lv.includes(s)); if (pick.length !== 2 || bad.length) throw new Error(`Levels of ${v.g}: ${lv.join(", ")}. Name exactly two of them.`); lv = pick; } else if (lv.length > 2) lv = lv.slice(0, 2); if (lv.length !== 2) throw new Error(`${v.g} has ${lv.length} level.`); names = lv; ga = col(v.x).filter((_, i) => col(v.g)[i] === lv[0]); gb = col(v.x).filter((_, i) => col(v.g)[i] === lv[1]); a = SW.describe(ga); b = SW.describe(gb); from = src(`${v.x} by ${v.g}`); }
      else { a = { mean: v.m1, sd: v.s1, n: v.n1 }; b = { mean: v.m2, sd: v.s2, n: v.n2 }; if (![a.mean, b.mean].every(Number.isFinite) || !(a.sd > 0 && b.sd > 0) || !(a.n >= 2 && b.n >= 2)) throw new Error("Type the mean, SD and N for both groups (each SD above 0, each N at least 2)."); }
      const r = SW.twoMeans({ m1: a.mean, s1: a.sd, n1: a.n, m2: b.mean, s2: b.sd, n2: b.n, alt: v.alt, conf: +v.conf, pooled: !v.welch });
      const hdr = ["", "", "Statistic", "df", "p"], row = [v.mode === "data" ? v.x : "value", v.welch ? "Welch's t" : "Student's t", r.t, r.df, SW.fmtP(r.p)];
      if (v.meanDiff) { hdr.push("Mean difference", "SE difference"); row.push(r.diff, r.se); }
      if (v.ci) { hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper"); row.push(r.lower, r.upper); }
      if (v.es) { hdr.push("Cohen's d"); row.push(r.d); }
      let html = table(hdr, [row], "Independent Samples T-Test") + `<div class="note">Note. H<sub>a</sub> mu<sub>${esc(names[0])}</sub> ${altWord(v.alt)} mu<sub>${esc(names[1])}</sub>. ${v.welch ? "Welch's df comes from the two standard errors, so it is a decimal." : "Student's t pools the two variances and uses df = n1 + n2 minus 2; it assumes the two groups have equal spread."}</div>`;
      if (v.desc) html += table(["", "Group", "N", "Mean", "SD", "SE"], [[v.mode === "data" ? v.x : "", names[0], a.n, a.mean, a.sd, a.sd / Math.sqrt(a.n)], ["", names[1], b.n, b.mean, b.sd, b.sd / Math.sqrt(b.n)]], "Group Descriptives");
      html += formula(v.welch ? `t = (x bar 1 minus x bar 2) / sqrt(s1^2 / n1 + s2^2 / n2)` : `t = (x bar 1 minus x bar 2) / (sp sqrt(1/n1 + 1/n2)), sp^2 = ((n1 minus 1) s1^2 + (n2 minus 1) s2^2) / (n1 + n2 minus 2)`);
      const sp = Math.sqrt(((a.n - 1) * a.sd * a.sd + (b.n - 1) * b.sd * b.sd) / (a.n + b.n - 2));
      html += worked((v.welch ? [`t = (${fmt(a.mean)} minus ${fmt(b.mean)}) / sqrt(${fmt(a.sd)}^2 / ${a.n} + ${fmt(b.sd)}^2 / ${b.n}) = ${fmt(r.diff)} / ${fmt(r.se)} = ${fmt(r.t)}`, `df = (s1^2/n1 + s2^2/n2)^2 / ((s1^2/n1)^2 / (n1 minus 1) + (s2^2/n2)^2 / (n2 minus 1)) = ${fmt(r.df)}`]
        : [`sp^2 = ((${a.n} minus 1) ${fmt(a.sd)}^2 + (${b.n} minus 1) ${fmt(b.sd)}^2) / (${a.n} + ${b.n} minus 2) = ${fmt(sp * sp)}, sp = ${fmt(sp)}`, `t = (${fmt(a.mean)} minus ${fmt(b.mean)}) / (${fmt(sp)} sqrt(1/${a.n} + 1/${b.n})) = ${fmt(r.diff)} / ${fmt(r.se)} = ${fmt(r.t)}, df = ${a.n} + ${b.n} minus 2 = ${r.df}`])
        .concat([`interval: ${fmt(r.diff)} plus or minus ${fmt(r.tstar)} times ${fmt(r.se)} = ${fmt(r.lower)} to ${fmt(r.upper)}`, `d = (${fmt(a.mean)} minus ${fmt(b.mean)}) / sp = ${fmt(r.diff)} / ${fmt(sp)} = ${fmt(r.d)}`]));
      html += apa(`t(${dfText(r.df)}) = ${apaN(r.t, 2)}, ${apaP(r.p)}, d = ${apaN(r.d, 2)}, ${Math.round(r.conf * 100)}% CI [${apaN(r.lower, 2)}, ${apaN(r.upper, 2)}]`);
      html += say(`H0: the two population means are equal. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${esc(names[0])} is ${altWord(v.alt)} the mean of ${esc(names[1])}.` : `There is not enough evidence of a difference between the means of ${esc(names[0])} and ${esc(names[1])}.`} We are ${Math.round(r.conf * 100)} percent confident the difference in population means is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      if (v.mode === "data") { const all = [...new Set(col(v.g).filter((q) => q !== ""))]; if (all.length > 2) html += say(`${esc(v.g)} has ${all.length} levels (${esc(all.join(", "))}); this test compares ${esc(names[0])} with ${esc(names[1])} only. Choosing which two is your decision to defend; for all groups at once use One-Way ANOVA.`); }
      html += smallGroups([[a.n, names[0]], [b.n, names[1]]]) + cond(a.n >= 30 && b.n >= 30, "Both groups have N at least 30.", "A group has N under 30: needs roughly normal populations (check box plots); state that the assumptions are met.") + say("Independent samples: different individuals in each group. If the same individuals were measured twice, use the Paired Samples T-Test.");
      const cd = card("Independent Samples T-Test", from, html);
      if (v.plot && v.mode === "data") plotDiv(cd, [{ y: SW.num(ga), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(names[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(gb), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(names[1]), marker: { color: "#D97D54" } }], { yaxis: Object.assign({ title: v.x }, coverAxis(SW.num(ga).concat(SW.num(gb)))), showlegend: false });
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
      html += worked([`d bar = ${fmt(r.dbar)}, s_d = ${fmt(r.sd)}, n = ${r.n}`, `t = ${fmt(r.dbar)} / (${fmt(r.sd)} / sqrt(${r.n})) = ${fmt(r.dbar)} / ${fmt(r.se)} = ${fmt(r.t)}, df = ${r.n} minus 1 = ${r.df}`, `interval: ${fmt(r.dbar)} plus or minus ${fmt(r.tstar)} times ${fmt(r.se)} = ${fmt(r.lower)} to ${fmt(r.upper)}`, `d = ${fmt(r.dbar)} / ${fmt(r.sd)} = ${fmt(r.d)}`]);
      html += apa(`t(${r.df}) = ${apaN(r.t, 2)}, ${apaP(r.p)}, d = ${apaN(r.d, 2)}, ${Math.round(r.conf * 100)}% CI [${apaN(r.lower, 2)}, ${apaN(r.upper, 2)}]`);
      html += say(`H0: the mean difference is 0. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the mean of ${esc(v.a)} is ${altWord(v.alt)} the mean of ${esc(v.b)} for the same individuals.` : `There is not enough evidence of a difference between ${esc(v.a)} and ${esc(v.b)}.`} Mean difference ${fmt(r.dbar)}, ${Math.round(r.conf * 100)} percent interval ${fmt(r.lower)} to ${fmt(r.upper)}.`) + say("Paired because each row is one unit measured twice. Pairing removes unit-to-unit variability, which is why the SE is small.");
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
      { name: "tukey", label: "Post-Hoc Tests: Tukey", type: "check", value: true, group: "Post-Hoc" }, { name: "homo", label: "Homogeneity test (largest SD over smallest)", type: "check", value: true, group: "Assumption Checks" }, { name: "levene", label: "Levene's test of equal variances", type: "check", value: false, group: "Assumption Checks" }, alphaField], (v) => {
      const groups = {}; col(v.g).forEach((g, i) => { if (g !== "") (groups[g] = groups[g] || []).push(col(v.x)[i]); });
      const r = SW.anova(groups);
      let html = "";
      if (v.fisher) html += table(["", "", "F", "df1", "df2", "p"], [[v.x, "Fisher's", r.F, r.df1, r.df2, SW.fmtP(r.p)]], "One-Way ANOVA");
      if (v.welch) { const w = welchAnova(r); html += table(["", "", "F", "df1", "df2", "p"], [[v.x, "Welch's", w.F, w.df1, w.df2, SW.fmtP(w.p)]], "One-Way ANOVA (Welch's)"); }
      html += table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p"], [[v.g, r.ssb, r.df1, r.msb, r.F, SW.fmtP(r.p)], ["Residuals", r.ssw, r.df2, r.msw, "", ""]], `ANOVA - ${v.x}`);
      if (v.desc) html += table(["", v.g, "N", "Mean", "SD", "SE"], r.groups.map((q, i) => [i ? "" : v.x, q.name, q.n, q.mean, q.sd, q.sd / Math.sqrt(q.n)]), "Group Descriptives");
      html += formula(`H0: all group means equal. F = MS between / MS within, df = (k minus 1, N minus k). R squared = SS between / SS total = ${fmt(r.r2)}.`);
      html += worked([`MS between = SS between / df1 = ${fmt(r.ssb)} / ${r.df1} = ${fmt(r.msb)}; MS within = SS within / df2 = ${fmt(r.ssw)} / ${r.df2} = ${fmt(r.msw)}`, `F = ${fmt(r.msb)} / ${fmt(r.msw)} = ${fmt(r.F)} on (${r.df1}, ${r.df2}) df`]);
      html += apa(`F(${r.df1}, ${r.df2}) = ${apaN(r.F, 2)}, ${apaP(r.p)}, eta squared = ${noZero(r.r2)}`);
      html += say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `At least one group mean of ${esc(v.x)} differs across ${esc(v.g)}; the F test does not say which. Read the post-hoc table.` : `There is not enough evidence that the mean of ${esc(v.x)} differs across ${esc(v.g)}.`}`);
      html += smallGroups(r.groups.map((q) => [q.n, q.name]));
      if (v.levene) { const L = SW.levene(Object.values(groups)); html += table(["F", "df1", "df2", "p"], [[L.F, L.d1, L.d2, SW.fmtP(L.p)]], "Levene's test (deviations from the median, Brown-Forsythe)") + say(L.p <= +v.alpha ? `Levene p = ${fmt(L.p, 4)}: the group variances differ, so read Welch's ANOVA.` : `Levene p = ${fmt(L.p, 4)}: no evidence the group variances differ.`); }
      if (v.homo) html += cond(r.sdRatio <= 2, `Largest SD over smallest SD = ${fmt(r.sdRatio, 2)}, under 2: equal-spread condition holds.`, `Largest SD over smallest SD = ${fmt(r.sdRatio, 2)}, above 2: equal-spread condition fails; use Welch's and read with caution.`);
      if (v.tukey) html += table([v.g, "", v.g, "Mean Difference", "SE", "df", "t", "p-tukey"], r.tukey.map((t) => [t.a, "-", t.b, t.diff, t.se, r.df2, t.diff / t.se, Number.isFinite(t.p) ? SW.fmtP(t.p) : "n/a"]), `Post Hoc Comparisons - ${v.g}`) + `<div class="note">Note. p-tukey is adjusted for all ${r.tukey.length} pairwise comparisons.</div>`;
      const cd = card("One-Way ANOVA", src(`${v.x} by ${v.g}`), html);
      if (v.plot) plotDiv(cd, r.groups.map((q) => ({ y: q.x, type: "box", hoveron: "points", hoverinfo: "y+name", quartilemethod: "exclusive", name: String(q.name), boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: Object.assign({ title: v.x }, coverAxis(r.groups.flatMap((q) => q.x))), showlegend: false });
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
    dialog("Regression: Linear Regression", [selNum("y", "Dependent variable"), selNum("x", "Covariate (explanatory)"), { name: "ci", label: "Confidence interval for coefficients", type: "check", value: true, group: "Model Coefficients" }, { name: "r2", label: "R and R squared (Model Fit)", type: "check", value: true, group: "Model Fit" }, { name: "resid", label: "Residual plots", type: "check", value: true, group: "Assumption Checks" }, { name: "qq", label: "Q-Q plot of residuals", type: "check", value: false, group: "Assumption Checks" }, { name: "pred", label: "Predict at x = (optional; several, comma separated)", type: "text", value: "", group: "Prediction" }, { name: "bands", label: "Show confidence and prediction bands on the graph", type: "check", value: false, group: "Prediction" }, confField, alphaField], (v) => {
      if (v.x === v.y) throw new Error("Pick two different variables: the dependent variable and the covariate are the same column.");
      const r = SW.regress(col(v.x), col(v.y), +v.conf);
      const sxx = (r.n - 1) * r.sx * r.sx, seMean = (x0) => r.se_res * Math.sqrt(1 / r.n + (x0 - r.mx) ** 2 / sxx), sePred = (x0) => r.se_res * Math.sqrt(1 + 1 / r.n + (x0 - r.mx) ** 2 / sxx);
      const preds = String(v.pred == null || Number.isNaN(v.pred) ? "" : v.pred).split(",").map((q) => q.trim()).filter(Boolean).map(Number);
      if (preds.some((q) => !Number.isFinite(q))) throw new Error("Predict at x: type numbers separated by commas, such as 10, 20.");
      let html = "";
      if (v.r2) html += table(["Model", "r", "r squared"], [["1", r.r, r.r2]], "Model Fit Measures") + `<div class="note">Note. r is the correlation, with the sign of the slope (other software prints R without a sign, the multiple-regression convention). r squared is the share of the variation in ${esc(v.y)} explained by the line.</div>`;
      const hdr = ["Predictor", "Estimate", "SE", "t", "p"]; if (v.ci) hdr.push(`${Math.round(r.conf * 100)}% CI lower`, "upper");
      const b0row = ["Intercept", r.b0, r.seb0, r.b0 / r.seb0, SW.fmtP(2 * (1 - SW.pt(Math.abs(r.b0 / r.seb0), r.df)))], b1row = [v.x, r.b1, r.seb1, r.t, SW.fmtP(r.p)];
      if (v.ci) { b0row.push(r.b0 - r.tstar * r.seb0, r.b0 + r.tstar * r.seb0); b1row.push(r.b1lower, r.b1upper); }
      html += table(hdr, [b0row, b1row], `Model Coefficients - ${v.y}`);
      html += formula(`${v.y} hat = ${fmt(r.b0)} + ${fmt(r.b1)} ${v.x}. b1 = r s_y / s_x, b0 = y bar minus b1 x bar. Slope test: H0 beta1 = 0, t = b1 / SE, df = n minus 2 = ${r.df}.`);
      html += worked([`b1 = r s_y / s_x = ${fmt(r.r)} times ${fmt(r.sy)} / ${fmt(r.sx)} = ${fmt(r.b1)}`, `b0 = y bar minus b1 x bar = ${fmt(r.my)} minus ${fmt(r.b1)} times ${fmt(r.mx)} = ${fmt(r.b0)}`, `t = b1 / SE = ${fmt(r.b1)} / ${fmt(r.seb1)} = ${fmt(r.t)}, df = ${r.n} minus 2 = ${r.df}`, `r^2 = ${fmt(r.r)}^2 = ${fmt(r.r2)}`]);
      html += apa(`b = ${apaN(r.b1, 2)}, t(${r.df}) = ${apaN(r.t, 2)}, ${apaP(r.p)}; r = ${noZero(r.r)}, r squared = ${noZero(r.r2)}, N = ${r.n}`);
      html += say(`Slope: each one-unit increase in ${esc(v.x)} predicts a change of ${fmt(r.b1)} in ${esc(v.y)}. ${fmt(100 * r.r2, 1)} percent of the variation in ${esc(v.y)} is explained by the line. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence of a linear relationship between ${esc(v.x)} and ${esc(v.y)}.` : `There is not enough evidence of a linear relationship between ${esc(v.x)} and ${esc(v.y)}.`} Correlation is not causation.`);
      if (preds.length) { const pc = Math.round(r.conf * 100); html += table([v.x, `Predicted ${v.y}`, `${pc}% CI for the mean: lower`, "upper", `${pc}% PI for one new value: lower`, "upper"], preds.map((x0) => { const yh = r.predict(x0); return [x0, yh, yh - r.tstar * seMean(x0), yh + r.tstar * seMean(x0), yh - r.tstar * sePred(x0), yh + r.tstar * sePred(x0)]; }), "Prediction");
        html += formula(`CI for the mean response: y hat plus or minus t* s_e sqrt(1/n + (x minus x bar)^2 / Sxx). PI for one new value: y hat plus or minus t* s_e sqrt(1 + 1/n + (x minus x bar)^2 / Sxx). s_e = ${fmt(r.se_res)}, t* = ${fmt(r.tstar)} on ${r.df} df.`) + say(`The confidence interval is for the average ${esc(v.y)} of everyone with that ${esc(v.x)}; the prediction interval is for one new individual, so it is always wider.`);
        const out = preds.filter((x0) => x0 < Math.min(...r.x) || x0 > Math.max(...r.x)); if (out.length) html += warn(`x = ${out.join(", ")} is outside the data range (${fmt(Math.min(...r.x))} to ${fmt(Math.max(...r.x))}): extrapolation, do not trust it.`); }
      const cd = card("Linear Regression", src(`${v.y} on ${v.x}`), html);
      const xs = [Math.min(...r.x), Math.max(...r.x)];
      const bandTr = []; if (v.bands) { const g = Array.from({ length: 81 }, (_, i) => xs[0] + ((xs[1] - xs[0]) * i) / 80); [[seMean, "confidence band (mean)", "#C0392B", "dash"], [sePred, "prediction band (one value)", "#7F8C8D", "dot"]].forEach(([f, nm, c, dsh]) => { bandTr.push({ x: g, y: g.map((q) => r.predict(q) + r.tstar * f(q)), mode: "lines", name: nm, line: { color: c, dash: dsh, width: 1.5 } }, { x: g, y: g.map((q) => r.predict(q) - r.tstar * f(q)), mode: "lines", name: nm, showlegend: false, line: { color: c, dash: dsh, width: 1.5 } }); }); }
      plotDiv(cd, [{ x: r.x, y: r.y, mode: "markers", type: "scatter", name: "data", marker: { color: "#3A7CA5" } }, { x: xs, y: xs.map(r.predict), mode: "lines", name: "least squares", line: { color: "#C0392B" } }].concat(bandTr), { xaxis: { title: v.x }, yaxis: { title: v.y } });
      if (v.resid) plotDiv(cd, [{ x: r.fitted, y: r.resid, mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }], { title: "Residuals against fitted values (want a formless band around 0)", xaxis: { title: "fitted" }, yaxis: { title: "residual" }, shapes: [{ type: "line", x0: 0, x1: 1, xref: "paper", y0: 0, y1: 0, line: { color: "#1A3A4D", dash: "dash" } }] }, 280);
      if (v.qq) { const q = SW.qq(r.resid), sd = SW.sd(r.resid); plotDiv(cd, [{ x: q.map((p) => p.theo), y: q.map((p) => p.obs), mode: "markers", type: "scatter", marker: { color: "#3A7CA5" } }, { x: [-2.5, 2.5], y: [-2.5 * sd, 2.5 * sd], mode: "lines", line: { color: "#C0392B" } }], { title: "Q-Q plot of residuals", xaxis: { title: "theoretical quantiles" }, yaxis: { title: "residual" } }, 280); }
    });
  }

  // ================= Regression: sensitivity to a lurking variable =================
  // Cinelli and Hazlett (2020), the benchmark of Chad Hazlett's causal inference course: how strong an unobserved confounder
  // (the lurking variable of a first course) would have to be, compared with the covariates already measured, to change
  // the conclusion. Everything comes from the regression table (t of the treatment, the residual df) plus two partial R2s
  // for the benchmark covariate. Verified on the Darfur data against the paper: RV 13.9%, RV at alpha 7.6%, 1x female 0.0752.
  // The covariates are dummy coded without the rare-level rule of the other regressions: a fixed effect for a village with
  // one respondent is fine here (it absorbs that row), and the paper keeps every row.
  function sensitivityUI() {
    needData();
    dialog("Regression: Sensitivity to a lurking variable (Cinelli-Hazlett benchmark)", [
      selNum("y", "Outcome"), selNum("d", "Treatment (the cause being studied: a number, or a 0/1 column)"),
      { name: "xs", label: `Numeric covariates adjusted for (${MULTI_HINT()})`, type: "multi", options: numCols(), group: "Covariates" },
      { name: "cs", label: "Categorical covariates (dummy coded; a fixed effect such as a village or a school is fine)", type: "multi", options: catCols(), group: "Covariates" },
      Object.assign(selAny("bench", "Benchmark: how strong would a lurking variable be, compared with this covariate?"), { hint: "Added to the covariates if it is not among them. Pick the strongest thing you did measure." }),
      { name: "ks", label: "Multiples of the benchmark to try, comma separated", type: "text", value: "1, 2, 3" },
      { name: "q", label: "q: the fraction of the estimate a lurking variable would have to explain away (1 = all of it)", type: "number", value: 1 },
      { name: "plot", label: "Contour plot of the adjusted estimate", type: "check", value: true },
      confField, alphaField], (v) => {
      if (v.y === v.d) throw new Error("Pick two different columns: the outcome and the treatment are the same column.");
      const q = Number.isFinite(v.q) && v.q > 0 ? v.q : 1, alpha = +v.alpha, conf = +v.conf;
      const ks = String(v.ks || "").split(",").map((s) => s.trim()).filter(Boolean).map(Number); if (!ks.length || ks.some((k) => !(k > 0))) throw new Error("Multiples are positive numbers, such as 1, 2, 3.");
      let xs = v.xs.filter((c) => c !== v.y && c !== v.d), cs = v.cs.filter((c) => c !== v.y && c !== v.d);
      const bench = v.bench && v.bench !== v.y && v.bench !== v.d ? v.bench : "";
      let html = "";
      if (bench && !xs.includes(bench) && !cs.includes(bench)) { if (isNum(bench)) xs = xs.concat([bench]); else cs = cs.concat([bench]); html += say(`${esc(bench)} was added to the covariates so it can serve as the benchmark.`); }
      // design matrix: numeric columns as they are, each categorical dummy coded against its most frequent level
      const names = [], parts = [];
      xs.forEach((c) => { names.push(c); parts.push(col(c).map((x) => [x])); });
      cs.forEach((c) => { const raw = col(c), dd = SW.dummies(raw); dd.cols.forEach((l) => names.push(`${c} = ${l} (vs ${dd.levels[0]})`)); parts.push(dd.rows.map((r, i) => (raw[i] === "" ? r.map(() => "") : r))); });
      const yv = col(v.y), dv = col(v.d), rows = yv.map((_, i) => parts.flatMap((p) => p[i]));
      const keep = keepComplete(rows, yv, [dv]).filter((i) => Number.isFinite(Number(dv[i])));
      const Xc = keep.map((i) => rows[i].map(Number)), y = keep.map((i) => Number(yv[i])), d = keep.map((i) => Number(dv[i]));
      if (y.length <= names.length + 3) throw new Error(`Not enough complete rows (${y.length}) for ${names.length} covariate columns.`);
      if (new Set(d).size < 2) throw new Error(`${v.d} takes a single value in the rows in use, so it cannot be a treatment.`);
      const light = { light: true };
      const m = SW.ols(Xc.map((r, i) => [d[i]].concat(r)), y, [v.d].concat(names), conf, light);
      const est = m.b[1], se = m.se[1], t = m.t[1], df = m.df, R = SW.robustness({ t, df, q, alpha }), pc = (x) => (Number.isFinite(x) ? fmt(100 * x, 1) + "%" : "n/a");
      html += table(["Treatment", "Estimate", "SE", "t", "df", "Partial R2 of treatment with outcome", `RV (q = ${q})`, `RV (q = ${q}, alpha = ${alpha})`], [[v.d, est, se, t, df, pc(R.r2yd), pc(R.rv), pc(R.rva)]], `Sensitivity statistics: ${v.y} on ${v.d}${names.length ? `, adjusting for ${names.length} covariate column${names.length > 1 ? "s" : ""}` : ", no covariates"}`);
      html += `<div class="note">Note. n = ${m.n} complete rows${m.n < yv.length ? ` (${yv.length - m.n} dropped for blanks)` : ""}; ${pWord(m.p[1])} for the treatment. RV is the share of the remaining variation of both ${esc(v.d)} and ${esc(v.y)} that a lurking variable would have to explain.</div>`;
      // benchmark against an observed covariate: its partial R2 with the treatment (given the other covariates) and with the outcome (given the treatment and the others)
      let B = null, bounds = [];
      if (bench && names.length) {
        const J = names.map((nm, j) => (nm === bench || nm.startsWith(bench + " = ") ? j : -1)).filter((j) => j >= 0), rest = names.filter((_, j) => !J.includes(j));
        if (J.length) {
          const drop = (rs) => rs.map((r) => r.filter((_, j) => !J.includes(j)));
          const mRedY = SW.ols(drop(Xc).map((r, i) => [d[i]].concat(r)), y, [v.d].concat(rest), conf, light), fy = SW.nestedF(mRedY, m), r2yxj = SW.groupPartialR2(fy.F, J.length, m.df);
          const mFullD = SW.ols(Xc, d, names, conf, light); let r2dxj;
          if (rest.length) { const mRedD = SW.ols(drop(Xc), d, rest, conf, light), fd = SW.nestedF(mRedD, mFullD); r2dxj = SW.groupPartialR2(fd.F, J.length, mFullD.df); } else r2dxj = mFullD.r2;
          B = { r2dxj, r2yxj };
          bounds = ks.map((k) => { const b = SW.ovbBound(r2dxj, r2yxj, k, k); const adj = b.ok ? SW.ovbAdjust({ est, se, df, r2dz: b.r2dz, r2yz: b.r2yz, conf }) : null; return { k, b, adj }; });
          html += table(["Lurking variable as strong as", `R2 with ${v.d} (given covariates)`, `R2 with ${v.y} (given treatment and covariates)`, "Adjusted estimate", "Adjusted SE", "Adjusted t", `${Math.round(conf * 100)}% CI lower`, "upper"],
            bounds.map(({ k, b, adj }) => [`${k} times ${bench}`, b.ok ? pc(b.r2dz) : "over 100%", b.ok ? pc(b.r2yz) + (b.capped ? " (capped)" : "") : "", adj ? adj.est : "no variable can be that strong", adj ? adj.se : "", adj ? adj.t : "", adj ? adj.lower : "", adj ? adj.upper : ""]),
            `Benchmark bounds: ${bench} itself has R2 ${pc(r2dxj)} with ${v.d} and ${pc(r2yxj)} with ${v.y}`);
        }
      }
      html += formula(`partial R2 of the treatment = t^2 / (t^2 + df); RV_q = (sqrt(f^4 + 4 f^2) minus f^2) / 2 with f = q |t| / sqrt(df); bias from a lurking variable = SE sqrt(R2yz R2dz / (1 minus R2dz)) sqrt(df), where R2dz is its R2 with the treatment and R2yz its R2 with the outcome`);
      const w = [`partial R2 = ${fmt(t)}^2 / (${fmt(t)}^2 + ${df}) = ${fmt(R.r2yd)}`, `f = ${q} times ${fmt(Math.abs(t))} / sqrt(${df}) = ${fmt(R.fq)}; RV = (sqrt(${fmt(R.fq)}^4 + 4 times ${fmt(R.fq)}^2) minus ${fmt(R.fq)}^2) / 2 = ${fmt(R.rv)}`, `at alpha ${alpha}: f minus t* / sqrt(df minus 1) = ${fmt(R.fqa)}, so RV = ${fmt(R.rva)}`];
      if (bounds.length && bounds[0].adj) w.push(`${bounds[0].k} times ${bench}: bias = ${fmt(se)} sqrt(${fmt(bounds[0].b.r2yz)} times ${fmt(bounds[0].b.r2dz)} / (1 minus ${fmt(bounds[0].b.r2dz)})) sqrt(${df}) = ${fmt(bounds[0].adj.bias)}; adjusted estimate = ${fmt(est)} ${est >= 0 ? "minus" : "plus"} ${fmt(bounds[0].adj.bias)} = ${fmt(bounds[0].adj.est)}`);
      html += worked(w);
      html += say(`A lurking variable (an unobserved confounder) can change this estimate only if it is related to both ${esc(v.d)} and ${esc(v.y)} after the covariates. The robustness value says how strong it would have to be: one that explains ${pc(R.rv)} of what is left of both ${esc(v.d)} and ${esc(v.y)} would bring the estimate to ${q === 1 ? "zero" : `${fmt(100 * (1 - q), 0)} percent of its size`}, and one that explains ${pc(R.rva)} of both would make it not significant at alpha ${alpha}. Any lurking variable that explains less than ${pc(R.r2yd)} of the remaining variation in ${esc(v.y)} cannot explain the estimate away, however strongly it is tied to ${esc(v.d)}.`);
      if (B) {
        const first = bounds.find((x) => x.adj && Math.sign(x.adj.est) !== Math.sign(est)), notSig = bounds.find((x) => x.adj && Math.abs(x.adj.t) < SW.qt(1 - alpha / 2, df - 1)), b1 = bounds[0];
        html += say(`Benchmark: a lurking variable as strong as ${esc(bench)} would move the estimate from ${fmt(est)} to ${b1.adj ? fmt(b1.adj.est) : "beyond what the model can say"}. ${notSig ? `One about ${notSig.k} times as strong as ${esc(bench)} would make it not significant at alpha ${alpha}` : `None of the multiples tried (${ks.join(", ")}) makes it not significant at alpha ${alpha}`}${first ? `, and one ${first.k} times as strong would change its sign` : ", and none changes its sign"}. Whether such a variable is plausible is a judgement about the study, not a calculation: name the strongest thing you did measure and ask whether anything left out could matter more.`);
      } else html += say("Pick a benchmark covariate to see how strong a lurking variable would have to be compared with something you did measure.");
      html += warn("This is a sensitivity analysis for a linear model with one treatment coefficient. It says how much unmeasured confounding would be needed to change the conclusion, not whether any exists. Correlation is still not causation; this is the honest next step after that sentence.");
      html += apa(`${v.y} on ${v.d}: b = ${apaN(est, 3)}, SE = ${apaN(se, 3)}, t(${df}) = ${apaN(t)}, ${apaP(m.p[1])}. Robustness value RV = ${pc(R.rv)} (RV at alpha ${alpha} = ${pc(R.rva)}); partial R2 of the treatment = ${pc(R.r2yd)}${bounds.length && bounds[0].adj ? `. A confounder as strong as ${bench} would give b = ${apaN(bounds[0].adj.est, 3)}, t = ${apaN(bounds[0].adj.t)}` : ""}.`);
      html += `<div class="note">Cinelli, C. and Hazlett, C. (2020). Making sense of sensitivity: extending omitted variable bias. Journal of the Royal Statistical Society, Series B, 82(1), 39 to 67. The R package sensemakr prints the same statistics.</div>`;
      const cd = card("Sensitivity to a lurking variable", src(`${v.y} on ${v.d}`), html);
      if (v.plot) {
        const top = Math.min(0.95, Math.max(0.4, ...bounds.filter((x) => x.adj).flatMap((x) => [x.b.r2dz, x.b.r2yz]).map((r) => r * 1.3)));
        const N = 60, g = Array.from({ length: N + 1 }, (_, i) => (top * i) / N), ts = SW.qt(1 - (1 - conf) / 2, df - 1), z = g.map((ry) => g.map((rd) => SW.ovbAdjust({ est, se, df, r2dz: rd, r2yz: ry, tstar: ts }).est));
        const traces = [{ type: "contour", x: g, y: g, z, contours: { coloring: "lines", showlabels: true, labelfont: { size: 11, color: "#444" } }, colorscale: [[0, "#9A9A9A"], [1, "#9A9A9A"]], line: { width: 1 }, showscale: false, hoverinfo: "skip", name: "adjusted estimate" },
          { type: "contour", x: g, y: g, z, contours: { coloring: "lines", start: 0, end: 0, size: 1, showlabels: false }, line: { color: "#C0392B", width: 2.5, dash: "dash" }, showscale: false, hoverinfo: "skip", name: "estimate = 0" },
          { x: [0], y: [0], mode: "markers+text", type: "scatter", text: [`unadjusted (${fmt(est, 3)})`], textposition: "top right", marker: { color: "#1A3A4D", size: 10, symbol: "diamond" }, name: "unadjusted", hoverinfo: "text" }];
        const pts = bounds.filter((x) => x.adj && x.b.r2dz <= top && x.b.r2yz <= top);
        if (pts.length) traces.push({ x: pts.map((x) => x.b.r2dz), y: pts.map((x) => x.b.r2yz), mode: "markers+text", type: "scatter", text: pts.map((x) => `${x.k} times ${bench} (${fmt(x.adj.est, 3)})`), textposition: "top right", marker: { color: "#C0392B", size: 9 }, name: "benchmarks", hoverinfo: "text" });
        plotDiv(cd, traces, { title: "Adjusted estimate for a lurking variable of each strength (dashed red: estimate = 0)", xaxis: { title: `R2 of the lurking variable with ${v.d} (given covariates)`, range: [0, top] }, yaxis: { title: `R2 with ${v.y} (given treatment and covariates)`, range: [0, top] }, showlegend: false, margin: { t: 40, l: 60, r: 20, b: 55 } }, 440);
      }
    });
  }

  // ================= Frequencies =================
  function onePropZ() { binomialTest(true); }
  function binomialTest(zFirst = false) {
    const hasData = D.rows.length > 0, succCheck = levelCheck("x", null, (raw) => raw.mode === "data");
    dialog(zFirst ? "Frequencies: One proportion, z test (the exact binomial test is shown as a check)" : "Frequencies: 2 Outcomes, Binomial test", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      only(hasData ? selCat("x", "Variable") : null, onData), only(hasData ? { name: "succ", label: "Level to test (leave blank for every level)", type: "text", check: succCheck } : null, onData),
      { name: "xs", label: "Count of successes", type: "number", group: "Counts", vis: onSummary }, { name: "n", label: "N", type: "number", group: "Counts", vis: onSummary },
      { name: "p0", label: "Test value", type: "number", value: 0.5 }, hypField("Proportion"), { name: "ci", label: "Confidence intervals", type: "check", value: true }, sel("cim", "Interval method", [["wald", "Standard (Wald): p hat plus or minus z* SE, the by hand method"], ["plus4", "Plus four (Agresti-Coull with 2 successes and 2 failures added)"], ["ac", "Agresti-Coull (adjusted by z*)"], ["wilson", "Wilson score"], ["exact", "Exact (Clopper-Pearson)"]], "wald"), zFirst ? null : { name: "z", label: "Also show the z test (the course's by-hand method)", type: "check", value: true }, confField, alphaField], (v) => {
      if (zFirst) v.z = true;
      let levels = [], from = "counts"; const cim = v.cim || "wald", cimName = { wald: "standard (Wald)", plus4: "plus four", ac: "Agresti-Coull", wilson: "Wilson score", exact: "exact Clopper-Pearson" }[cim]; let lastCI;
      if (v.mode === "data") { const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const vals = col(v.x).filter((q) => q !== ""); if (!vals.length) throw new Error(`${v.x} has no values in the rows in use.`); const c = SW.counts(vals); const keys = v.succ.trim() ? [v.succ.trim()] : Object.keys(c).sort(); levels = keys.map((k) => ({ level: k, x: c[k] || 0, n: vals.length })); from = src(v.x); }
      else {
        if (!(Number.isInteger(v.n) && v.n >= 1)) throw new Error("N must be a whole number, 1 or more.");
        if (!(Number.isInteger(v.xs) && v.xs >= 0 && v.xs <= v.n)) throw new Error("The count of successes must be a whole number from 0 to N.");
        levels = [{ level: "success", x: v.xs, n: v.n }];
      }
      if (!(v.p0 > 0 && v.p0 < 1)) throw new Error("The test value is a proportion between 0 and 1, such as 0.5.");
      const rows = [], zrows = []; let last;
      levels.forEach((L, i) => { const r = SW.oneProp({ x: L.x, n: L.n, p0: v.p0, alt: v.alt, conf: +v.conf }); last = r; const ci = SW.propCI(L.x, L.n, +v.conf, cim); lastCI = ci; const row = [i ? "" : v.mode === "data" ? v.x : "", L.level, L.x, L.n, r.phat, SW.fmtP(r.exact)]; if (v.ci) row.push(ci.lower, ci.upper); rows.push(row); zrows.push([L.level, r.se0, r.z, SW.fmtP(r.p), r.condTest ? "yes" : "no", r.condCI ? "yes" : "no"]); });
      const hdr = ["", "Level", "Count", "Total", "Proportion", "p"]; if (v.ci) hdr.push(`${Math.round(+v.conf * 100)}% CI lower`, "upper");
      const Lz = levels[levels.length - 1], rz = last;
      const zBlock = () => table(["Level", "SE0 = sqrt(p0(1 minus p0)/n)", "z", "p (z test)", "n p0 and n(1 minus p0) at least 10", "successes and failures at least 10"], zrows, zFirst ? "One proportion z test" : "z test for a proportion (by hand method)") + formula("z = (p hat minus p0) / sqrt(p0 (1 minus p0) / n); interval p hat plus or minus z* sqrt(p hat (1 minus p hat) / n)") + (zFirst ? worked([`SE0 = sqrt(${v.p0} times ${fmt(1 - v.p0)} / ${Lz.n}) = ${fmt(rz.se0)}`, `z = (${fmt(rz.phat)} minus ${v.p0}) / ${fmt(rz.se0)} = ${fmt(rz.z)}`]) + cond(rz.condTest, `Conditions for the z test: n p0 = ${fmt(Lz.n * v.p0, 1)} and n(1 minus p0) = ${fmt(Lz.n * (1 - v.p0), 1)}, both at least 10, so the normal approximation is appropriate.`, `Conditions for the z test fail: n p0 = ${fmt(Lz.n * v.p0, 1)} and n(1 minus p0) = ${fmt(Lz.n * (1 - v.p0), 1)}, not both at least 10. Report the exact binomial p-value below instead; it needs no sample-size condition.`) : "");
      let html = zFirst ? zBlock() : "";
      html += table(hdr, rows, zFirst ? "Exact binomial test (a check on the z test)" : "Binomial Test") + `<div class="note">Note. H<sub>a</sub> is proportion ${altWord(v.alt)} ${v.p0}. p is the exact binomial p-value.${v.ci ? ` Interval method: ${cimName}.` : ""}</div>`;
      if (v.ci && cim !== "wald") html += formula({ plus4: "Plus four: add 2 successes and 2 failures, p tilde = (x + 2)/(n + 4), interval p tilde plus or minus z* sqrt(p tilde (1 minus p tilde)/(n + 4)). Works well even for small samples.", ac: "Agresti-Coull: n tilde = n + z*^2, p tilde = (x + z*^2/2)/n tilde, interval p tilde plus or minus z* sqrt(p tilde (1 minus p tilde)/n tilde). At 95 percent this is almost the plus four interval.", wilson: "Wilson score: the set of p0 values that a two-sided z test would not reject. Stays inside 0 to 1 and works for small samples.", exact: "Clopper-Pearson: built from the binomial distribution itself (beta quantiles), so coverage is at least the stated level. Conservative, so a little wider." }[cim]);
      if (v.z && !zFirst) html += zBlock();
      const r = last, L = levels[levels.length - 1];
      html += apa(zFirst ? `z = ${apaN(r.z, 2)}, ${apaP(r.p)}, p hat = ${apaN(r.phat, 2)}${v.ci ? `, ${Math.round(+v.conf * 100)}% CI [${apaN(lastCI.lower, 2)}, ${apaN(lastCI.upper, 2)}]` : ""}` : `exact binomial test, ${L.x} of ${L.n}, p hat = ${apaN(r.phat, 2)}, ${apaP(r.exact)}${v.ci ? `, ${Math.round(+v.conf * 100)}% CI [${apaN(lastCI.lower, 2)}, ${apaN(lastCI.upper, 2)}]` : ""}`);
      html += say(`H0: p = ${v.p0}. ${decision(v.z ? r.p : r.exact, +v.alpha)} ${(v.z ? r.p : r.exact) <= +v.alpha ? `There is evidence that the population proportion of ${esc(L.level)} is ${altWord(v.alt)} ${v.p0}.` : `There is not enough evidence that the population proportion of ${esc(L.level)} is ${altWord(v.alt)} ${v.p0}.`}${v.ci ? ` We are ${Math.round(+v.conf * 100)} percent confident the population proportion is between ${fmt(lastCI.lower)} and ${fmt(lastCI.upper)}.` : ""}`);
      if (v.ci && cim !== "wald") html += r.condCI ? ok(`Success-failure check: ${L.x} successes and ${L.n - L.x} failures, both at least 10.`) : say(`Only ${Math.min(L.x, L.n - L.x)} ${L.x < L.n - L.x ? "successes" : "failures"}, so the standard interval would be unreliable; the ${cimName} interval is designed for this case.`); else html += cond(r.condCI, `Success-failure check: ${L.x} successes and ${L.n - L.x} failures, both at least 10.`, `Success-failure check fails (${L.x} and ${L.n - L.x}): this course does not build a z interval here. Report the proportion descriptively.`);
      const cd = card(zFirst ? "One Proportion z Test" : "Binomial Test (2 Outcomes)", from, html); zPlot(cd, r.z, v.alt);
    });
  }
  function gofUI() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: N Outcomes, Chi-square Goodness of fit", [
      hasData ? sel("mode", "Data", [["data", "from a column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      only(hasData ? selCat("x", "Variable") : null, onData),
      { name: "counts", label: "Counts, one per line as  level: count", type: "textarea", rows: 5, placeholder: "Freshman: 11\nSophomore: 15\nJunior: 9\nSenior: 5", group: "Counts (for the counts option)", vis: onSummary },
      sel("expected", "Expected", [["equal", "Equally likely (every level the same)"], ["custom", "Proportions or counts I type"]], "equal"),
      { name: "props", label: "Expected proportions (or counts), comma separated in the level order shown", type: "text", placeholder: "0.30, 0.25, 0.15, 0.30", hint: "From a column the levels are sorted alphabetically (the order the frequency table shows them); from typed counts they keep your order. Counts or percents are rescaled to proportions.", vis: (raw) => raw.expected === "custom" },
      { name: "exp", label: "Expected counts", type: "check", value: true }, alphaField], (v) => {
      let obs = {}, from = "counts";
      if (v.mode === "data") { const c = SW.counts(col(v.x)); Object.keys(c).sort().forEach((k) => (obs[k] = c[k])); from = src(v.x); }
      else v.counts.split("\n").map((l) => l.split(":")).filter((p) => p.length === 2).forEach(([k, n]) => (obs[k.trim()] = Number(n)));
      const keys = Object.keys(obs); if (keys.length < 2) throw new Error("Need at least two levels.");
      let props = null, propNote = ""; if (v.expected === "custom" && !v.props.trim()) throw new Error("Type the expected proportions (or counts), one per level, or choose Equally likely."); if (v.expected === "custom") { const ps = v.props.split(/[,\s]+/).filter(Boolean).map(Number); if (ps.length !== keys.length) throw new Error(`Levels in order: ${keys.join(", ")}. You gave ${ps.length} proportions for ${keys.length} levels.`); const tot = ps.reduce((s, q) => s + q, 0); if (Math.abs(tot - 1) > 0.02) propNote = tot > 1.5 ? say(`You typed values that add to ${fmt(tot, 2)}, so they were read as expected counts (or percents) and rescaled to proportions: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}. Other software would rescale silently; this card says so.`) : warn(`Your proportions add to ${fmt(tot, 3)}, not 1. They were rescaled to add to 1: ${ps.map((q) => fmt(q / tot, 3)).join(", ")}.`); props = Object.fromEntries(keys.map((k, i) => [k, ps[i]])); }
      const r = SW.gof(obs, props);
      let html = propNote + table(["Level", "Count", "Expected", "Proportion", "(O minus E)^2 / E"], r.rows.map((q) => [q.cat, q.o, v.exp ? q.e : "", q.o / r.n, q.contrib]), "Proportions") + table(["chi-square", "df", "p"], [[r.chi, r.df, SW.fmtP(r.p)]], "Chi-square Goodness of Fit");
      html += formula(props ? `chi-square = sum of (O minus E)^2 / E, E = n times expected proportion, df = levels minus 1` : `Equally likely: each expected proportion is 1 / ${keys.length} = ${fmt(1 / keys.length, 4)}, so E = n / ${keys.length} = ${fmt(r.n / keys.length)} for every level. chi-square = sum of (O minus E)^2 / E, df = levels minus 1`);
      html += worked([`${r.rows[0].cat}: (${r.rows[0].o} minus ${fmt(r.rows[0].e)})^2 / ${fmt(r.rows[0].e)} = ${fmt(r.rows[0].contrib)}, and so on for each level`, `chi-square = ${r.rows.map((q) => fmt(q.contrib)).join(" + ")} = ${fmt(r.chi)}, df = ${keys.length} minus 1 = ${r.df}`]);
      html += apa(`chi-square(${r.df}, N = ${r.n}) = ${apaN(r.chi, 2)}, ${apaP(r.p)}`);
      html += cond(r.minE >= 5, "Every expected count is at least 5.", `Smallest expected count is ${fmt(r.minE, 2)}, below 5: the test is not trustworthy.`);
      html += say(`H0: ${props ? "the population follows the stated proportions" : `all ${keys.length} levels are equally likely (each 1 / ${keys.length})`}. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the distribution differs from the stated one.` : `There is not enough evidence that the distribution departs from the stated one; that is not proof that it matches.`}`);
      const cd = card("Chi-square Goodness of Fit (N Outcomes)", from, html);
      plotDiv(cd, [{ x: keys, y: r.rows.map((q) => q.o), type: "bar", name: "Observed", marker: { color: "#3A7CA5" } }, { x: keys, y: r.rows.map((q) => q.e), type: "bar", name: "Expected", marker: { color: "#D97D54" } }], { barmode: "group", yaxis: { title: "Count" } });
    });
  }
  function contTables() {
    const hasData = D.rows.length > 0;
    dialog("Frequencies: Contingency Tables, Independent Samples (chi-square test of association)", [
      hasData ? sel("mode", "Data", [["data", "from two columns"], ["summary", "from a table of counts"]], "data") : sel("mode", "Data", [["summary", "from a table of counts"]]),
      only(hasData ? selCat("r", "Rows") : null, onData), only(hasData ? selCat("c", "Columns") : null, onData),
      { name: "tbl", label: "Table of counts: first row = column names, first column = row names", type: "textarea", rows: 5, placeholder: "employment, Pet No, Pet Yes\nFull-time, 4, 6\nNot employed, 3, 6\nPart-time, 10, 11", group: "Counts (for the table option)", vis: onSummary },
      { name: "chi", label: "chi-square", type: "check", value: true, group: "Tests" }, { name: "fisher", label: "Fisher's exact test (2 by 2)", type: "check", value: false, group: "Tests" }, Object.assign(sel("fisherAlt", `Fisher's ${haWord()}`, [["two", "two-sided: the two rows differ"], ["greater", "greater: row 1 has a larger share of the first column"], ["less", "less: row 1 has a smaller share of the first column"]], "two"), { group: "Tests", full: true, vis: (raw) => !!raw.fisher }), { name: "orrr", label: "Odds ratio and relative risk (2 by 2)", type: "check", value: false, group: "Comparative Measures" }, { name: "obs", label: "Observed counts", type: "check", value: true, group: "Cells" }, { name: "exp", label: "Expected counts", type: "check", value: false, group: "Cells" },
      { name: "pcRow", label: "Row percentages", type: "check", value: false, group: "Percentages" }, { name: "pcCol", label: "Column percentages", type: "check", value: false, group: "Percentages" }, { name: "pcTot", label: "Total percentages", type: "check", value: false, group: "Percentages" }, alphaField], (v) => {
      let t, from = "counts", rn = "rows", cn = "columns";
      if (v.mode === "data") { t = SW.twoWay(col(v.r), col(v.c)); rn = v.r; cn = v.c; from = src(`${v.r} by ${v.c}`); }
      // a typed table: labels typed after ", " lose the space, and rows and columns keep the order typed
      else { const rows = parseCSV(v.tbl).map((r) => r.map((x) => x.trim())); if (rows.length < 3) throw new Error("Need a header row and at least two rows of counts."); cn = rows[0][0] || "columns"; const rv = [], cv = []; rows.slice(1).forEach((r) => rows[0].slice(1).forEach((c, j) => { const n = Number(r[j + 1]); for (let k = 0; k < n; k++) { rv.push(r[0]); cv.push(c); } })); t = SW.twoWay(rv, cv, rows.slice(1).map((r) => r[0]), rows[0].slice(1)); }
      // With every box under Cells and Percentages unchecked the table used to come out with
      // empty cells and nothing but the totals, which reads as a broken table. Fall back to the
      // observed counts and say so.
      const noCellOption = !v.obs && !v.exp && !v.pcRow && !v.pcCol && !v.pcTot;
      const cell = (i, j) => { const o = t.O[i][j]; const parts = []; if (v.obs || noCellOption) parts.push(String(o)); if (v.exp) parts.push(`E ${fmt(t.E[i][j], 2)}`); if (v.pcRow) parts.push(`${fmt((100 * o) / t.rt[i], 1)}% row`); if (v.pcCol) parts.push(`${fmt((100 * o) / t.ct[j], 1)}% col`); if (v.pcTot) parts.push(`${fmt((100 * o) / t.n, 1)}% total`); return parts.join(" | "); };
      const rows = t.rows.map((r, i) => [r].concat(t.cols.map((_, j) => cell(i, j)), [t.rt[i]])); rows.push(["Total"].concat(t.ct, [t.n]));
      let html = table([rn + " \\ " + cn].concat(t.cols, ["Total"]), rows, "Contingency Tables");
      if (noCellOption) html += warn("Nothing was ticked under Cells or Percentages, so the table would have had empty cells. Observed counts are shown. Tick what you want in each cell and run it again.");
      if (v.mode === "data") { const dropped = col(v.r).length - t.n; if (dropped > 0) html += warn(`${dropped} row${dropped > 1 ? "s" : ""} with a blank in ${esc(rn)} or ${esc(cn)} were left out of the whole table, so N = ${t.n}. Every percentage here is on that base.`); }
      html += say("A row percentage is a conditional probability given the row; a total percentage is the 'and' probability. Under independence every row shows the same percentages.");
      if (v.chi) {
        html += table(["", "Value", "df", "p"], [["chi-square", t.chi, t.df, SW.fmtP(t.p)], ["N", t.n, "", ""]], "chi-square Tests");
        html += formula(`chi-square = sum of (O minus E)^2 / E, E = row total times column total / N, df = (rows minus 1)(columns minus 1) = ${t.df}`);
        const terms = t.O.flatMap((row, i) => row.map((o, j) => (o - t.E[i][j]) ** 2 / t.E[i][j]));
        html += worked([`first cell (${t.rows[0]}, ${t.cols[0]}): E = ${t.rt[0]} times ${t.ct[0]} / ${t.n} = ${fmt(t.E[0][0])}; (${t.O[0][0]} minus ${fmt(t.E[0][0])})^2 / ${fmt(t.E[0][0])} = ${fmt(terms[0])}, and so on for each cell`, `chi-square = ${terms.map((q) => fmt(q)).join(" + ")} = ${fmt(t.chi)}, df = (${t.rows.length} minus 1)(${t.cols.length} minus 1) = ${t.df}`]);
        html += apa(`chi-square(${t.df}, N = ${t.n}) = ${apaN(t.chi, 2)}, ${apaP(t.p)}`);
        html += cond(t.minE >= 5, "Every expected count is at least 5.", `Smallest expected count is ${fmt(t.minE, 2)}, below 5: the test is not trustworthy. Combine categories or collect more data.`);
        html += say(`H0: ${esc(rn)} and ${esc(cn)} are independent. ${decision(t.p, +v.alpha)} ${t.p <= +v.alpha ? `There is evidence of an association between ${esc(rn)} and ${esc(cn)}.` : `There is not enough evidence of an association between ${esc(rn)} and ${esc(cn)}.`}`);
      }
      if (t.rows.length === 2 && t.cols.length === 2 && (v.fisher || v.orrr)) {
        const [a, b] = t.O[0], [c, dd] = t.O[1];
        if (v.fisher) {
          // Ha from the Fisher's Ha choice: greater = row 1 has a larger share of the first column (P(X >= a)), less = smaller
          const alt = v.fisherAlt === "greater" || v.fisherAlt === "less" ? v.fisherAlt : "two", pf = SW.fisher2x2(a, b, c, dd, alt);
          const r1 = esc(t.rows[0]), r2 = esc(t.rows[1]), c1 = esc(t.cols[0]), tail = { two: "two-sided", greater: "right tailed", less: "left tailed" }[alt];
          const ha = alt === "greater" ? `${r1} has a larger share of ${c1} than ${r2}` : alt === "less" ? `${r1} has a smaller share of ${c1} than ${r2}` : `${r1} and ${r2} differ in their share of ${c1}`;
          html += table(["", "Value", haWord(), "p"], [["Fisher's exact test", "", alt === "two" ? "two-sided" : `${alt} (${tail})`, SW.fmtP(pf)]], "Fisher's exact test (2 by 2)");
          html += say(`H0: ${r1} and ${r2} have the same share of ${c1}. Ha: ${ha} (${tail}). Exact p-value ${SW.fmtP(pf)}. No expected-count condition is needed. ${decision(pf, +v.alpha)} ${pf <= +v.alpha ? `There is evidence that ${ha}.` : `There is not enough evidence that ${ha}.`}`);
        }
        if (v.orrr) { const m = SW.measures2x2(a, b, c, dd); html += table(["", "Value", "95% CI lower", "upper"], [[`Risk of ${t.cols[0]} in ${t.rows[0]}`, m.p1, "", ""], [`Risk of ${t.cols[0]} in ${t.rows[1]}`, m.p2, "", ""], ["Relative risk (row 1 over row 2)", m.rr, m.rrLower, m.rrUpper], ["Odds ratio", m.or, m.orLower, m.orUpper]], "Comparative Measures") + formula("RR = p1 / p2. Odds = p / (1 minus p); OR = (a d) / (b c). Intervals on the log scale. RR needs the rows to be groups whose risks were measured (cohort); OR is valid in case-control designs too.") + say(m.or > 1 ? `The odds of ${esc(t.cols[0])} are ${fmt(m.or, 2)} times higher in ${esc(t.rows[0])} than in ${esc(t.rows[1])}; a confidence interval that includes 1 means no clear association.` : `The odds of ${esc(t.cols[0])} are ${fmt(1 / m.or, 2)} times lower in ${esc(t.rows[0])} than in ${esc(t.rows[1])}; a confidence interval that includes 1 means no clear association.`); }
      }
      card("Contingency Tables (Independent Samples)", from, html);
    });
  }
  function twoPropsUI() {
    const hasData = D.rows.length > 0, succCheck = levelCheck("x", "the success level", (raw) => raw.mode === "data");
    dialog("Frequencies: Two proportions, z test (course method)", [
      hasData ? sel("mode", "Data", [["data", "outcome column split by a group"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]),
      only(hasData ? selCat("x", "Outcome variable") : null, onData), only(hasData ? { name: "succ", label: "Success level (exactly as in the data)", type: "text", check: succCheck } : null, onData), only(hasData ? selCat("g", "Grouping variable (two levels)") : null, onData), only(hasData ? lvField : null, onData),
      { name: "x1", label: "Successes 1", type: "number", group: "Group 1", vis: onSummary }, { name: "n1", label: "N 1", type: "number", group: "Group 1", vis: onSummary }, { name: "x2", label: "Successes 2", type: "number", group: "Group 2", vis: onSummary }, { name: "n2", label: "N 2", type: "number", group: "Group 2", vis: onSummary },
      sel("alt", "Hypothesis", [["two", "p1 not equal to p2"], ["greater", "p1 greater than p2"], ["less", "p1 less than p2"]], "two"), confField, alphaField], (v) => {
      let x1 = v.x1, n1 = v.n1, x2 = v.x2, n2 = v.n2, names = ["Group 1", "Group 2"], from = "counts";
      if (v.mode === "data") {
        const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm);
        const s = v.succ.trim(), lv = pickTwo(v.g, v.lv); names = lv; const gv = col(v.g), xv = col(v.x); const inG = (l) => xv.filter((_, i) => gv[i] === l && xv[i] !== ""); n1 = inG(lv[0]).length; x1 = inG(lv[0]).filter((q) => q === s).length; n2 = inG(lv[1]).length; x2 = inG(lv[1]).filter((q) => q === s).length; from = src(`${v.x} = ${s} by ${v.g}`);
        const empty = lv.filter((l, i) => !(i ? n2 : n1)); if (empty.length) throw new Error(`${empty.join(" and ")} ${empty.length > 1 ? "have" : "has"} no ${v.x} values in the rows in use, so there is nothing to compare.`);
        if (x1 + x2 === 0 || x1 + x2 === n1 + n2) throw fieldErr("succ", `${x1 + x2 === 0 ? "No row" : "Every row"} in ${lv[0]} and ${lv[1]} has ${v.x} = ${s}, so the two proportions are both ${x1 + x2 === 0 ? 0 : 1} and there is nothing to test. Check the success level, the grouping variable and the filter.`);
      }
      const whole = (q) => Number.isInteger(q) && q >= 0;
      if (v.mode !== "data" && !(whole(x1) && whole(x2) && n1 >= 1 && n2 >= 1 && whole(n1) && whole(n2) && x1 <= n1 && x2 <= n2)) throw new Error("Type the successes and N for both groups as whole numbers (successes from 0 to N, N at least 1).");
      if (x1 + x2 === 0 || x1 + x2 === n1 + n2) throw new Error(`${x1 + x2 === 0 ? "Both groups have 0 successes" : "Every one in both groups is a success"}, so the pooled standard error is 0 and there is no z to work out. Report the two proportions instead.`);
      const r = SW.twoProps({ x1, n1, x2, n2, alt: v.alt, conf: +v.conf });
      let html = table(["Group", "Successes", "N", "Proportion"], [[names[0], x1, n1, r.p1], [names[1], x2, n2, r.p2]], "Proportions");
      html += table(["Difference", "Pooled p hat", "SE0 (pooled)", "z", "p", "SE (unpooled)", `${Math.round(r.conf * 100)}% CI lower`, "upper"], [[r.diff, r.pooled, r.se0, r.z, SW.fmtP(r.p), r.se, r.lower, r.upper]], "Two proportions z test");
      html += formula("z = (p1 hat minus p2 hat) / sqrt(pooled p (1 minus pooled p)(1/n1 + 1/n2)); interval uses the unpooled SE. The same test as Contingency Tables on a 2 by 2 table, where chi-square = z squared.");
      html += cond(r.cond, `Success-failure check: ${x1}/${n1 - x1} and ${x2}/${n2 - x2}, all at least 10.`, `A count is below 10 (${x1}/${n1 - x1} and ${x2}/${n2 - x2}): this course does not run the z procedure here. Report the two proportions and say the sample is too small.`);
      html += say(`H0: p1 = p2. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that the proportion in ${esc(names[0])} is ${altWord(v.alt)} the proportion in ${esc(names[1])}.` : `There is not enough evidence of a difference between the two population proportions.`} We are ${Math.round(r.conf * 100)} percent confident the difference is between ${fmt(r.lower)} and ${fmt(r.upper)}.`);
      const cd = card("Two proportions (z)", from, html); zPlot(cd, r.z, v.alt);
    });
  }


  // ================= Nonparametric =================
  function mannWhitneyUI() {
    needData();
    dialog("Nonparametric: Mann-Whitney U (two independent groups)", [selNum("x", "Dependent variable"), selCat("g", "Grouping variable (two levels)"), lvField, sel("alt", "Hypothesis", [["two", "Group 1 not equal to Group 2"], ["greater", "Group 1 greater than Group 2"], ["less", "Group 1 less than Group 2"]], "two"), alphaField], (v) => {
      const lv = pickTwo(v.g, v.lv);
      const a = col(v.x).filter((_, i) => col(v.g)[i] === lv[0]), b = col(v.x).filter((_, i) => col(v.g)[i] === lv[1]); const r = SW.mannWhitney(a, b, v.alt);
      const html = table(["", "", "Statistic", "z", "p"], [[v.x, "Mann-Whitney U", r.U, r.z, SW.fmtP(r.p)]], "Independent Samples T-Test (nonparametric)") + table(["Group", "N", "Median"], [[lv[0], r.n1, r.med1], [lv[1], r.n2, r.med2]], "Group Descriptives") + formula("Ranks all values together and compares the rank sums; no normality assumption. Normal approximation with tie correction, as in R.") + say(`H0: the two distributions are the same. ${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence that ${esc(v.x)} tends to be ${altWord(v.alt) === "not equal to" ? "different" : altWord(v.alt)} in ${esc(lv[0])} compared with ${esc(lv[1])}.` : `There is not enough evidence of a difference in ${esc(v.x)} between ${esc(lv[0])} and ${esc(lv[1])}.`} Use this when the groups are small and clearly skewed, or when the data are ranks.`);
      const cd = card("Mann-Whitney U", src(`${v.x} by ${v.g}`), html); plotDiv(cd, [{ y: SW.num(a), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(lv[0]), marker: { color: "#3A7CA5" } }, { y: SW.num(b), type: "box", hoveron: "points", hoverinfo: "y+name", name: String(lv[1]), marker: { color: "#D97D54" } }], { yaxis: { title: v.x }, showlegend: false }, 260);
    });
  }
  function wilcoxonUI() {
    needData();
    dialog("Nonparametric: Wilcoxon signed-rank and sign test (paired)", [selNum("a", "Paired variable 1"), selNum("b", "Paired variable 2 (or leave the constant below)"), { name: "const", label: "Or compare variable 1 with a constant (one-sample use)", type: "number", value: "" }, sel("alt", "Hypothesis", [["two", "Measure 1 not equal to Measure 2"], ["greater", "Measure 1 greater than Measure 2"], ["less", "Measure 1 less than Measure 2"]], "two"), alphaField], (v) => {
      if (!Number.isFinite(v.const) && v.a === v.b) throw new Error("Pick two different variables (the two measurements on the same people), or type a constant to compare variable 1 with.");
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


  // ================= ANOVA: ANCOVA, MANOVA, Friedman =================
  const PAL = ["#3A7CA5", "#D97D54", "#2E7D5B", "#B5476B", "#7F8C8D", "#8E44AD", "#C0392B", "#1A3A4D"];
  function ancovaUI() {
    needData();
    dialog("ANOVA: ANCOVA (one factor plus covariates)", [selNum("y", "Dependent variable"), selCat("g", "Factor (the groups)"), { name: "xs", label: `Covariates: numeric variables to adjust for (${MULTI_HINT()})`, type: "multi", options: numCols() }, { name: "post", label: "Pairwise comparisons of the adjusted means (Holm adjusted)", type: "check", value: true }, { name: "plot", label: "Scatterplot with the parallel fitted lines", type: "check", value: true }, confField, alphaField], (v) => {
      const xs = v.xs.filter((c) => c !== v.y); if (!xs.length) throw new Error("Pick at least one covariate: a numeric variable to adjust for. With none, use One-Way ANOVA.");
      const yv = col(v.y), gv = col(v.g), cv = xs.map((c) => col(c));
      const keep = yv.map((_, i) => i).filter((i) => yv[i] !== "" && Number.isFinite(Number(yv[i])) && gv[i] !== "" && cv.every((c) => c[i] !== "" && Number.isFinite(Number(c[i]))));
      const y = keep.map((i) => Number(yv[i])), g = keep.map((i) => gv[i]), X = keep.map((i) => cv.map((c) => Number(c[i]))), lv = [...new Set(g)];
      if (lv.length < 2) throw new Error(`${v.g} has one group in the rows in use.`);
      if (y.length <= lv.length + xs.length + 2) throw new Error(`Not enough complete rows (${y.length}).`);
      const r = SW.ancova(y, g, X, xs, +v.conf), alpha = +v.alpha, gRow = r.rows.find((q) => q.source === "group"), covRows = r.rows.filter((q) => q.source !== "group" && q.source !== "Residuals");
      let html = table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p", "partial eta squared"], r.rows.map((q) => [q.source === "group" ? v.g : q.source, q.ss, q.df, q.ms, q.F == null ? "" : q.F, q.p == null ? "" : SW.fmtP(q.p), q.eta == null ? "" : q.eta]), `ANCOVA - ${v.y} (Type II sums of squares)`);
      html += table([v.g, "N", "Raw mean", "Adjusted mean", "SE"], r.adj.map((a) => [a.level, a.n, a.raw, a.est, a.se]), `Adjusted means of ${v.y} at ${xs.map((c, j) => `${c} = ${fmt(r.covMeans[j])}`).join(", ")}`);
      html += formula(`${v.y} = ${fmt(r.b[0])} + ${xs.map((c, j) => `${fmt(r.b[1 + j])} ${c}`).join(" + ")} + group effect. Each group's adjusted mean is its predicted ${v.y} at the covariate mean${xs.length > 1 ? "s" : ""}, so the groups are compared as if they had the same ${xs.join(" and ")}. F for ${v.g} = MS group (after the covariate${xs.length > 1 ? "s" : ""}) / MS residual.`);
      html += worked([`SS ${v.g} after ${xs.join(", ")} = ${fmt(gRow.ss)}; MS = ${fmt(gRow.ss)} / ${gRow.df} = ${fmt(gRow.ms)}; F = ${fmt(gRow.ms)} / ${fmt(r.mse)} = ${fmt(gRow.F)} on (${gRow.df}, ${r.df}) df`, `adjusted mean of ${r.adj[0].level} = ${fmt(r.b[0])} + ${xs.map((c, j) => `${fmt(r.b[1 + j])} times ${fmt(r.covMeans[j])}`).join(" + ")}${r.levels[0] === r.adj[0].level ? " (the reference group)" : ""} = ${fmt(r.adj[0].est)}`]);
      html += say(`H0: the groups have the same mean ${esc(v.y)} once ${esc(xs.join(" and "))} ${xs.length > 1 ? "are" : "is"} taken into account. ${decision(gRow.p, alpha)} ${gRow.p <= alpha ? `The adjusted means differ across ${esc(v.g)}; the pairwise table says which.` : `There is not enough evidence that the adjusted means differ across ${esc(v.g)}.`} ${covRows.map((q) => `${esc(q.source)}: ${pWord(q.p)}${q.p <= alpha ? ", so the covariate matters, and adjusting for it sharpens the comparison" : ", so this covariate adds little here"}.`).join(" ")}`);
      html += cond(r.slopes.p > alpha, `Homogeneity of regression slopes: the group by covariate interaction gives F = ${fmt(r.slopes.F, 2)} on (${r.slopes.df1}, ${r.slopes.df2}) df, ${pWord(r.slopes.p)}. The slopes can be taken as parallel, so one adjustment serves every group.`, `Homogeneity of regression slopes fails: F = ${fmt(r.slopes.F, 2)} on (${r.slopes.df1}, ${r.slopes.df2}) df, ${pWord(r.slopes.p)}. The covariate's effect differs by group, so one adjusted mean per group misleads; report the slope within each group instead (Multiple Linear Regression with the interaction).`);
      html += smallGroups(r.adj.map((a) => [a.n, a.level]));
      if (v.post) html += table(["Comparison", "Difference in adjusted means", "SE", "t", "df", "p", "p (Holm)", `differs at ${alpha}?`], r.pairs.map((q) => [`${q.a} vs ${q.b}`, q.diff, q.se, q.t, q.df, SW.fmtP(q.p), SW.fmtP(q.pHolm), q.pHolm <= alpha ? "yes" : "no"]), "Pairwise comparisons of adjusted means (Holm adjusted)");
      html += apa(`ANCOVA on ${v.y} with ${xs.join(", ")} as covariate${xs.length > 1 ? "s" : ""}: ${v.g}, F(${gRow.df}, ${r.df}) = ${apaN(gRow.F)}, ${apaP(gRow.p)}, partial eta squared = ${noZero(gRow.eta)}.`);
      const cd = card("ANCOVA", src(`${v.y} by ${v.g}, adjusting for ${xs.join(", ")}`), html);
      if (v.plot) { const x0 = X.map((rw) => rw[0]), lo = Math.min(...x0), hi = Math.max(...x0); plotDiv(cd, r.levels.flatMap((l, li) => { const idx = g.map((q, i) => (q === l ? i : -1)).filter((i) => i >= 0), off = r.adj[li].est - r.b[1] * r.covMeans[0], color = PAL[li % PAL.length]; return [{ x: idx.map((i) => x0[i]), y: idx.map((i) => y[i]), mode: "markers", type: "scatter", name: String(l), marker: { color } }, { x: [lo, hi], y: [off + r.b[1] * lo, off + r.b[1] * hi], mode: "lines", type: "scatter", name: `${l} (fitted)`, showlegend: false, line: { color, width: 1.5 } }]; }), { title: `${v.y} against ${xs[0]} by ${v.g}: one slope for all groups, a different height for each`, xaxis: { title: xs[0] }, yaxis: { title: v.y } }, 320); }
    });
  }
  function manovaUI() {
    needData();
    dialog("ANOVA: MANOVA (one factor, several outcomes at once)", [{ name: "ys", label: `Dependent variables, two or more (${MULTI_HINT()})`, type: "multi", options: numCols() }, selCat("g", "Factor (the groups)"), { name: "uni", label: "Follow-up: one-way ANOVA on each outcome", type: "check", value: true }, alphaField], (v) => {
      if (v.ys.length < 2) throw new Error("Pick at least two dependent variables; with one, use One-Way ANOVA.");
      const cols = v.ys.map((c) => col(c)), gv = col(v.g), keep = gv.map((_, i) => i).filter((i) => gv[i] !== "" && cols.every((c) => c[i] !== "" && Number.isFinite(Number(c[i]))));
      const Y = keep.map((i) => cols.map((c) => Number(c[i]))), g = keep.map((i) => gv[i]), lv = [...new Set(g)];
      if (lv.length < 2) throw new Error(`${v.g} has one group in the rows in use.`);
      const small = lv.filter((l) => g.filter((q) => q === l).length <= v.ys.length); if (small.length) throw new Error(`Each group needs more rows than there are outcomes (${v.ys.length}): ${small.join(", ")} ${small.length > 1 ? "have" : "has"} too few.`);
      const r = SW.manova(Y, g), alpha = +v.alpha, P = r.stats[0], Wk = r.stats[1];
      let html = table(["Test", "Statistic", "F", "df1", "df2", "p"], r.stats.map((s) => [s.name, s.value, s.F, s.df1, s.df2, SW.fmtP(s.p)]), `MANOVA - ${v.g} on ${v.ys.join(", ")}`);
      html += table([v.g, "N"].concat(v.ys.map((c) => "mean " + c)), r.groups.map((q) => [q.name, q.n].concat(q.mean)), "Group means");
      if (v.uni) html += table(["Outcome", "F", "df1", "df2", "p", `p below ${fmt(alpha / v.ys.length, 4)} (Bonferroni)?`, "eta squared"], r.uni.map((u, j) => [v.ys[j], u.F, u.df1, u.df2, SW.fmtP(u.p), u.p < alpha / v.ys.length ? "yes" : "no", u.eta]), "Follow-up: one-way ANOVA on each outcome");
      html += formula(`H = between-groups and E = within-groups sums of squares and cross products. The four statistics are functions of the eigenvalues of E^-1 H (${r.eig.map((e) => fmt(e, 4)).join(", ")}): Pillai = sum of lambda / (1 + lambda); Wilks = product of 1 / (1 + lambda); Hotelling-Lawley = sum of lambda; Roy = the largest lambda. F approximations as in R's summary.manova.`);
      html += say(`H0: the groups have the same mean vector, the same means on all ${v.ys.length} outcomes at once. Pillai's trace, the most robust of the four: ${decision(P.p, alpha)} ${P.p <= alpha ? "The groups differ on the outcomes taken together; the follow-up table says on which. The four tests agree when the groups differ along one direction (one eigenvalue dominates) and can disagree when they differ along several." : "There is not enough evidence that the groups differ on the outcomes taken together."}`);
      html += warn(`MANOVA assumes multivariate normality within groups, equal covariance matrices across groups, and more rows per group than outcomes. With unequal covariance matrices or unequal group sizes, trust Pillai's trace over the others. Correlated outcomes are the point: one test holds alpha at ${alpha} for the whole set and can find a difference spread over several outcomes that no single ANOVA finds.`);
      html += smallGroups(r.groups.map((q) => [q.n, q.name]));
      html += apa(`MANOVA: ${v.g}, Pillai's trace = ${noZero(P.value)}, F(${P.df1}, ${apaN(P.df2, 0)}) = ${apaN(P.F)}, ${apaP(P.p)}; Wilks' lambda = ${noZero(Wk.value)}, F(${Wk.df1}, ${apaN(Wk.df2, 1)}) = ${apaN(Wk.F)}, ${apaP(Wk.p)}.`);
      const cd = card("MANOVA", src(`${v.ys.join(", ")} by ${v.g}`), html);
      const sds = v.ys.map((_, j) => SW.sd(Y.map((rw) => rw[j]))), gm = v.ys.map((_, j) => SW.mean(Y.map((rw) => rw[j])));
      plotDiv(cd, r.groups.map((q, gi) => ({ x: v.ys, y: q.mean.map((m, j) => (m - gm[j]) / sds[j]), mode: "lines+markers", name: String(q.name), line: { color: PAL[gi % PAL.length] }, marker: { color: PAL[gi % PAL.length] } })), { title: "Group means on each outcome, in standard-deviation units from the grand mean", yaxis: { title: "standardized mean" } }, 300);
    });
  }
  function friedmanUI() {
    needData();
    dialog("ANOVA: Friedman (nonparametric repeated measures)", [{ name: "cols", label: `Related measures, one column per condition, two or more (${MULTI_HINT()})`, type: "multi", options: numCols() }, { name: "post", label: "Pairwise Wilcoxon signed-rank tests with Holm correction", type: "check", value: true }, alphaField], (v) => {
      if (v.cols.length < 2) throw new Error("Pick at least two columns: the same people measured under each condition.");
      const cols = v.cols.map((c) => col(c)), keep = cols[0].map((_, i) => i).filter((i) => cols.every((c) => c[i] !== "" && Number.isFinite(Number(c[i]))));
      const Y = keep.map((i) => cols.map((c) => Number(c[i]))); if (Y.length < 3) throw new Error(`Need at least 3 rows complete on every column (${Y.length} found).`);
      const r = SW.friedman(Y), alpha = +v.alpha;
      let html = table(["", "Friedman chi-square", "df", "p", "Kendall's W"], [[v.cols.join(", "), r.Fr, r.df, SW.fmtP(r.p), r.W]], "Repeated Measures ANOVA (Non-parametric)");
      html += table(["Condition", "Median", "Mean rank", "Rank total"], v.cols.map((c, j) => [c, r.medians[j], r.meanRank[j], r.rankTotals[j]]), `Ranks within each of the ${r.n} rows`);
      html += formula(`Each row (one person) is ranked across the ${r.k} conditions; chi-square = 12 / (n k (k + 1)) times the sum of the squared rank totals, minus 3 n (k + 1), corrected for ties, on k minus 1 df. Kendall's W = chi-square / (n (k minus 1)), the agreement between rows from 0 to 1.`);
      html += worked([`rank totals ${r.rankTotals.map((t) => fmt(t, 2)).join(", ")}; chi-square = 12 / (${r.n} times ${r.k} times ${r.k + 1}) times (${r.rankTotals.map((t) => `${fmt(t, 2)}^2`).join(" + ")}) minus 3 times ${r.n} times ${r.k + 1} = ${fmt(r.Fr)} on ${r.df} df`, `W = ${fmt(r.Fr)} / (${r.n} times ${r.k - 1}) = ${fmt(r.W)}`]);
      html += say(`H0: the conditions have the same distribution. ${decision(r.p, alpha)} ${r.p <= alpha ? "At least one condition tends to be higher or lower than another; the pairwise table says which." : "There is not enough evidence that the conditions differ."} Use this instead of Repeated Measures ANOVA when the measurements are ordinal, skewed, or few; it only needs the order within each row.`);
      if (v.post) html += table(["Comparison", "Median difference", "z", "p", "p (Holm)", `differs at ${alpha}?`], r.pairs.map((q) => [`${v.cols[q.a]} vs ${v.cols[q.b]}`, q.medianDiff, q.z, SW.fmtP(q.p), SW.fmtP(q.pHolm), q.pHolm <= alpha ? "yes" : "no"]), "Post hoc: pairwise Wilcoxon signed-rank (Holm adjusted)");
      html += apa(`Friedman test: chi-square(${r.df}) = ${apaN(r.Fr)}, ${apaP(r.p)}, Kendall's W = ${noZero(r.W)}, N = ${r.n}.`);
      const cd = card("Friedman", src(v.cols.join(", ")), html);
      plotDiv(cd, v.cols.map((c, j) => ({ y: Y.map((rw) => rw[j]), type: "box", name: c, quartilemethod: "exclusive", boxpoints: "outliers", marker: { color: "#3A7CA5" } })), { yaxis: Object.assign({ title: "value" }, coverAxis(Y.flat())), showlegend: false }, 300);
    });
  }

  // ================= Advanced =================
  // one categorical column as dummy columns: levels with fewer than 3 rows set to missing; the reference is the most frequent level, or the one asked for
  function catTerm(v, ref, notes) {
    const raw = col(v), c = SW.counts(raw), rare = Object.keys(c).filter((l) => c[l] < 3);
    const vals = raw.map((x) => (rare.includes(x) ? "" : x));
    if (rare.length && notes) notes.push(`${v}: level${rare.length > 1 ? "s" : ""} ${rare.join(", ")} (fewer than 3 rows) set to missing; a category that small cannot be estimated.`);
    const d = SW.dummies(vals, ref), rows = d.rows.map((r, i) => (vals[i] === "" ? r.map(() => "") : r));
    return { levels: d.levels, rows, cols: d.cols.map((l, j) => ({ name: `${v} = ${l} (vs ${d.levels[0]})`, vals: rows.map((r) => r[j]) })) };
  }
  function designMatrix(numVars, catVars, refs = {}) {
    const names = [], parts = [], notes = [], terms = {};
    numVars.forEach((v) => { names.push(v); parts.push(col(v).map((x) => [x])); terms[v] = [{ name: v, vals: col(v) }]; });
    catVars.forEach((v) => { const d = catTerm(v, refs[v], notes); d.cols.forEach((t) => names.push(t.name)); parts.push(d.rows); terms[v] = d.cols; });
    const rows = D.rows.length ? activeIdx().map((_, i) => parts.flatMap((p) => p[i])) : [];
    return { names, rows, notes, terms, refs };
  }
  // Model terms, shared by the regression dialogs: squared terms, interactions typed as a * b (numeric or categorical), reference levels (R's relevel)
  const termFields = () => [
    { name: "sq", label: "Squared terms for (numeric, optional)", type: "multi", options: numCols(), group: "Model terms" },
    { name: "ix", label: "Interactions, comma separated, e.g. Hours_Study * Hours_Sleep, Hours_Study * Year (numeric or categorical, optional)", type: "text", group: "Model terms", hint: "Put both main effects in the model as well, as R's a * b does. Numeric by categorical gives one slope difference per level; categorical by categorical gives one column per pair of levels." },
    { name: "refs", label: "Reference levels, e.g. Year = Freshman, Employed = Yes (optional; the default is the most frequent level)", type: "text", group: "Model terms" }];
  function parseRefs(txt) {
    const refs = {};
    String(txt || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((pair) => {
      const i = pair.indexOf("="); if (i < 0) throw new Error(`Reference levels: write column = level, for example Year = Freshman. Could not read "${pair}".`);
      const v = pair.slice(0, i).trim(), l = pair.slice(i + 1).trim();
      if (!catCols().includes(v)) throw new Error(`Reference levels: ${v} is not a categorical column. Categorical columns: ${catCols().join(", ") || "none"}.`);
      const lv = Object.keys(SW.counts(col(v).filter((q) => q !== ""))).sort(); if (!lv.includes(l)) throw new Error(`Reference levels: ${v} has no level "${l}". Levels: ${lv.join(", ")}.`);
      refs[v] = l;
    });
    return refs;
  }
  function addModelTerms(dm, v, mains) { // appends columns to dm.rows and dm.names; returns warnings as html
    let html = "";
    (v.sq || []).forEach((s) => { const c = col(s); dm.names.push(`${s} squared`); dm.rows.forEach((r, i) => r.push(c[i] === "" ? "" : Number(c[i]) ** 2)); if (!mains.includes(s)) html += warn(`${esc(s)} squared is in the model without ${esc(s)} itself; usually both belong.`); });
    const termsOf = (name) => dm.terms[name] || (isNum(name) ? [{ name, vals: col(name) }] : catTerm(name, (dm.refs || {})[name], null).cols);
    String(v.ix || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((t) => {
      const vars = t.split(/\s*[*:\u00d7]\s*/).map((s) => s.trim()).filter(Boolean);
      if (vars.length !== 2) throw new Error(`Interaction "${t}": write two column names joined by *, for example Hours_Study * Year.`);
      vars.forEach((nm) => { if (!D.cols.includes(nm) || D.types[nm] === "id") throw new Error(`Interaction "${t}": ${nm} is not a numeric or categorical column. Columns: ${numCols().concat(catCols()).join(", ")}.`); });
      if (vars[0] === vars[1]) throw new Error(`Interaction "${t}": a column times itself is a squared term; pick it under Squared terms.`);
      const [ta, tb] = vars.map(termsOf);
      const short = (nm) => nm.replace(/ \(vs [^)]*\)$/, ""); ta.forEach((a) => tb.forEach((b) => { dm.names.push(`${short(a.name)} \u00d7 ${short(b.name)}`); dm.rows.forEach((r, i) => r.push(a.vals[i] === "" || b.vals[i] === "" ? "" : Number(a.vals[i]) * Number(b.vals[i]))); }));
      const missing = vars.filter((nm) => !mains.includes(nm)); if (missing.length) html += warn(`${esc(t)} is in the model without the main effect${missing.length > 1 ? "s" : ""} ${esc(missing.join(" and "))}. R's a * b includes both; add ${missing.length > 1 ? "them" : "it"} as a predictor unless you have a reason not to.`);
    });
    return html;
  }
  const dmNotes = (dm) => (dm.notes || []).map((n) => warn(esc(n))).join("");
  function pruneEmpty(X, names, keep) { // dummy columns with fewer than 3 rows in the kept data: drop the column and those rows
    // interaction columns (a × b) are left alone, as in R, except one that is all zeros (no rows in that combination), which R would report as NA
    const isDummy = (nm) => nm.includes(" = ") && !nm.includes(" \u00d7 "), isIx = (nm) => nm.includes(" \u00d7 ");
    const sums = names.map((_, j) => X.reduce((s, r) => s + (Number(r[j]) === 1 && isDummy(names[j]) ? 1 : 0), 0));
    const dropCol = names.map((nm, j) => isDummy(nm) && sums[j] < 3), emptyIx = names.map((nm, j) => isIx(nm) && X.every((r) => Number(r[j]) === 0));
    const rowOK = X.map((r) => !r.some((v, j) => dropCol[j] && Number(v) === 1)), gone = (j) => dropCol[j] || emptyIx[j];
    return { X: X.filter((_, i) => rowOK[i]).map((r) => r.filter((_, j) => !gone(j))), names: names.filter((_, j) => !gone(j)), keep: keep.filter((_, i) => rowOK[i]), dropped: names.filter((_, j) => dropCol[j]), emptyIx: names.filter((_, j) => emptyIx[j]) };
  }
  function keepComplete(X, y, extra = []) { const keep = []; for (let i = 0; i < y.length; i++) { const ok = y[i] !== "" && Number.isFinite(Number(y[i])) && X[i].every((v) => v !== "" && Number.isFinite(Number(v))) && extra.every((e) => e[i] !== ""); if (ok) keep.push(i); } return keep; }
  function mixedUI() {
    needData();
    dialog("Advanced: Mixed-Effects Model (nested or repeated data)", [selNum("y", "Dependent variable"), { name: "xs", label: `Numeric predictors (fixed effects; ${MULTI_HINT()})`, type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors (fixed effects, dummy coded)", type: "multi", options: catCols() },
      selCat("g", "Grouping factor: the clusters the rows belong to (subjects, classes, schools, patients)"), sel("slope", "Random slope for (optional): lets the effect of this predictor vary by cluster", [["", "none (random intercept only)"]].concat(numCols().map((c) => [c, c])), ""),
      sel("method", "Estimation", [["reml", "REML (default, as lme4 and SPSS)"], ["ml", "ML (for likelihood-ratio tests between fixed-effect models)"]], "reml"),
      { name: "blup", label: "Cluster effects (BLUPs) table and caterpillar plot", type: "check", value: true, group: "Checks" }, { name: "lrt", label: "Likelihood-ratio test against the model without random effects", type: "check", value: true, group: "Checks" }, { name: "resid", label: "Residual plot", type: "check", value: true, group: "Checks" }, confField, alphaField], (v) => {
      if (v.slope && !v.xs.includes(v.slope)) throw new Error("A random slope needs that predictor among the fixed effects too: add " + v.slope + " to the numeric predictors.");
      const dm = designMatrix(v.xs, v.cs), yv = col(v.y), gv = col(v.g);
      let keep = keepComplete(dm.rows, yv, [gv]); const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep;
      const X = pr.X.map((r) => [1].concat(r)), y = keep.map((i) => Number(yv[i])), groups = keep.map((i) => gv[i]), names = ["Intercept"].concat(pr.names);
      const si = v.slope ? pr.names.indexOf(v.slope) : -1; const Z = v.slope ? X.map((r) => [1, r[si + 1]]) : null;
      const g = new Set(groups).size; if (g < 3) throw new Error("The grouping factor needs at least 3 clusters."); if (X.length <= names.length + g) throw new Error("Not enough complete rows for this model.");
      const m = SW.lmm(y, X, groups, Z, { reml: v.method !== "ml" }); const k = m.k, n = m.n;
      let html = dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${esc(pr.dropped.join(", "))} and its rows: fewer than 3 usable rows in that category.`) : "") + (pr.emptyIx.length ? warn(`No rows have ${esc(pr.emptyIx.join(" or "))}, so ${pr.emptyIx.length > 1 ? "those interaction columns were" : "that interaction column was"} left out (R would print NA for it).`) : "");
      const tstar = (df) => SW.qt(1 - (1 - +v.conf) / 2, Number.isFinite(df) ? df : 1e6), pOf = (t, df) => 2 * (1 - SW.pt(Math.abs(t), Number.isFinite(df) ? df : 1e6));
      const pv = m.t.map((t, i) => pOf(t, m.dfSat[i]));
      html += table(["Fixed effect", "Estimate", "SE", "t", "df (Satterthwaite)", "p", `${Math.round(+v.conf * 100)}% CI lower`, "upper"], names.map((nm, i) => [nm, m.beta[i], m.se[i], m.t[i], Number.isFinite(m.dfSat[i]) ? m.dfSat[i].toFixed(1) : "n/a", SW.fmtP(pv[i]), m.beta[i] - tstar(m.dfSat[i]) * m.se[i], m.beta[i] + tstar(m.dfSat[i]) * m.se[i]]), `Fixed Effects - ${v.y}`);
      const rrows = [[`${v.g}: Intercept`, m.Sigma[0][0], m.sd[0], ""]]; if (k === 2) { rrows.push([`${v.g}: slope of ${v.slope}`, m.Sigma[1][1], m.sd[1], ""]); rrows.push([`${v.g}: correlation (intercept, slope)`, "", "", m.corr[0][1]]); } rrows.push(["Residual", m.sig2, m.sigma, ""]);
      html += table(["Random effect", "Variance", "SD", "Correlation"], rrows, "Random Effects");
      // ICC from the empty model, Nakagawa R2 from the fitted model
      let icc = NaN; try { const e = SW.lmm(y, X.map(() => [1]), groups, null, { reml: m.reml }); icc = e.Sigma[0][0] / (e.Sigma[0][0] + e.sig2); } catch (err) { }
      const fx = X.map((r) => r.reduce((s, x, j) => s + x * m.beta[j], 0)), varF = SW.variance ? SW.variance(fx) : fx.reduce((s, q) => s + (q - SW.mean(fx)) ** 2, 0) / (fx.length - 1);
      const varR = X.map((r, i) => { const z = Z ? Z[i] : [1]; let s = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) s += z[a] * m.Sigma[a][b] * z[b]; return s; }).reduce((s, q) => s + q, 0) / n;
      const r2m = varF / (varF + varR + m.sig2), r2c = (varF + varR) / (varF + varR + m.sig2);
      const fitRows = [[m.reml ? "REML criterion" : "Deviance (ML)", m.criterion], ["AIC", m.aic], ["BIC", m.bic], ["Marginal R² (fixed effects)", r2m], ["Conditional R² (fixed + random)", r2c], [`ICC of ${v.g} (empty model)`, icc]];
      html += table(["Fit", "Value"], fitRows, "Model Fit");
      if (v.lrt) { try { const ml = m.reml ? SW.lmm(y, X, groups, Z, { reml: false }) : m; const b = SW.ols(X.map((r) => r.slice(1)), y, names.slice(1), 0.95, { light: true }); const devOLS = n * Math.log((2 * Math.PI * b.ssres) / n) + n, LR = devOLS - ml.criterion, dfr = m.k === 1 ? 1 : 3; const pmix = m.k === 1 ? 0.5 * (1 - SW.pchisq(LR, 1)) : 0.5 * (1 - SW.pchisq(LR, 2)) + 0.5 * (1 - SW.pchisq(LR, 3));
        html += table(["Comparison", "chi-square", "df", "p (boundary corrected)"], [[`Random effects of ${v.g} vs none (ML fits)`, LR, dfr, SW.fmtP(pmix)]], "Likelihood-Ratio Test for the Random Effects") + say(pmix <= +v.alpha ? `The clusters matter: rows from the same ${esc(v.g)} are more alike than rows from different ones, so an ordinary regression would overstate its precision.` : `No evidence that the clusters add variation beyond the fixed effects; an ordinary regression would give similar answers here.`); } catch (err) { } }
      html += formula(`${v.y} = b0 + ${names.slice(1).map((nm, i) => `b${i + 1} ${nm}`).join(" + ")} + u_${v.g}${k === 2 ? ` + w_${v.g} ${v.slope}` : ""} + e. u (and w) are the cluster's own deviations, normal with the variances in the Random Effects table; e is the within-cluster noise. Estimated by ${m.reml ? "REML" : "ML"} (lme4's profiled deviance); df by Satterthwaite (lmerTest).`);
      html += worked([`Fixed slope${names.length > 2 ? "s" : ""}: ${names.slice(1).map((nm, i) => `${nm} ${fmt(m.beta[i + 1])} (SE ${fmt(m.se[i + 1])}, t = ${fmt(m.t[i + 1])} on ${m.dfSat[i + 1].toFixed(1)} df)`).join("; ")}`, `ICC = ${fmt(icc)}: the share of the variation in ${v.y} that lies between ${v.g} clusters. Marginal R² ${fmt(r2m)} is explained by the predictors alone, conditional R² ${fmt(r2c)} by predictors and clusters together.`]);
      const j = names.length > 1 ? 1 : 0; html += apa(`${names[j]}: b = ${apaN(m.beta[j], 2)}, SE = ${apaN(m.se[j], 2)}, t(${m.dfSat[j].toFixed(1)}) = ${apaN(m.t[j], 2)}, ${apaP(pv[j])}; ICC = ${noZero(icc)}, marginal R² = ${noZero(r2m)}, conditional R² = ${noZero(r2c)}`);
      const sig = names.map((nm, i) => [nm, pv[i]]).slice(1).filter(([, p]) => p <= +v.alpha).map(([nm]) => nm);
      html += say(`H0 for each fixed effect: its slope is 0 in the population, allowing for the clustering by ${esc(v.g)}. ${sig.length ? `Evidence for ${esc(sig.join(", "))}.` : "No fixed effect reaches significance at this alpha."} With ${g} ${esc(v.g)} clusters and ${n} rows, each slope is tested on its Satterthwaite df, which can be far below n − p when the predictor varies between clusters rather than within them.`);
      html += cond(g >= 10, `${g} clusters: variance components are estimable with reasonable precision.`, `${g} clusters: fewer than 10, so the between-cluster variance (and the ICC) is estimated roughly; the fixed effects are still fine.`);
      if (k === 2 && Math.abs(m.corr[0][1]) > 0.95) html += warn("The intercept-slope correlation is near ±1: the random slope is nearly redundant. A random-intercept-only model is more stable.");
      const cd = card("Mixed-Effects Model", src(`${v.y} by ${names.slice(1).join(", ")} | ${v.g}${k === 2 ? " (random slope of " + v.slope + ")" : ""}`), html);
      if (v.blup) { const order = m.groups.map((gname, i) => [gname, m.ranef[i][0]]).sort((a, b) => a[1] - b[1]); const bt = table([v.g, "Intercept deviation"].concat(k === 2 ? [`Slope deviation (${v.slope})`] : []), m.groups.map((gname, i) => [gname, m.ranef[i][0]].concat(k === 2 ? [m.ranef[i][1]] : [])), `Cluster effects (BLUPs): each ${v.g}'s deviation from the fixed effects`); cd.insertAdjacentHTML("beforeend", bt);
        plotDiv(cd, [{ x: order.map((o) => o[1]), y: order.map((o) => o[0]), type: "scatter", mode: "markers", marker: { color: "#3A7CA5", size: 8 }, name: "intercept deviation" }], { title: `Caterpillar plot: ${v.g} intercept deviations`, xaxis: { title: "Deviation from the overall intercept", zeroline: true }, yaxis: { title: v.g, type: "category", automargin: true } }, Math.max(320, Math.min(900, 60 + 18 * g))); }
      if (v.resid) plotDiv(cd, [{ x: m.fitted, y: m.resid, type: "scatter", mode: "markers", marker: { color: "#3A7CA5", size: 7, opacity: 0.7 }, name: "residuals" }], { title: "Residuals vs fitted", xaxis: { title: "Fitted" }, yaxis: { title: "Residual", zeroline: true } });
    });
  }
  function multRegUI() {
    needData(); let html0 = "";
    dialog("Advanced: Multiple Linear Regression", [selNum("y", "Dependent variable"), { name: "xs", label: `Numeric predictors (${MULTI_HINT()})`, type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors (dummy coded, the most frequent level is the reference)", type: "multi", options: catCols() },
      ...termFields(),
      { name: "resid", label: "Residual plot", type: "check", value: true, group: "Checks" }, { name: "vif", label: "VIF (collinearity)", type: "check", value: true, group: "Checks" }, { name: "diag", label: "Influence diagnostics (leverage, standardized residuals, Cook's distance)", type: "check", value: true, group: "Checks" }, { name: "qq", label: "Q-Q plot of residuals", type: "check", value: false, group: "Checks" },
      { name: "red", label: "Compare with a reduced model using only these numeric predictors (nested F test)", type: "multi", options: numCols(), group: "Model comparison" }, { name: "step", label: "Show backward elimination steps (teaching demo)", type: "check", value: false, group: "Model comparison" },
      confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const dm = designMatrix(v.xs, v.cs, parseRefs(v.refs)), yv = col(v.y);
      html0 = addModelTerms(dm, v, v.xs.concat(v.cs));
      let keep = keepComplete(dm.rows, yv);
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => Number(yv[i])); dm.names = pr.names; html0 += dmNotes(dm); if (pr.dropped.length) html0 += warn(`Dropped ${esc(pr.dropped.join(", "))} and its rows: fewer than 3 usable rows in that category, which cannot be estimated.`); if (pr.emptyIx.length) html0 += warn(`No rows have ${esc(pr.emptyIx.join(" or "))}, so ${pr.emptyIx.length > 1 ? "those interaction columns were" : "that interaction column was"} left out (R would print NA for it).`);
      if (X.length <= dm.names.length + 1) throw new Error("Not enough complete rows for this many predictors.");
      const m = SW.ols(X, y, dm.names, +v.conf);
      let html = table(["Model", "R", "R squared", "Adjusted R squared", "F", "df1", "df2", "p"], [["1", Math.sqrt(m.r2), m.r2, m.adj, m.F, m.dfF[0], m.dfF[1], SW.fmtP(m.pF)]], "Model Fit Measures");
      const hdr = ["Predictor", "Estimate", "SE", "t", "p", `${Math.round(m.conf * 100)}% CI lower`, "upper"]; if (v.vif) hdr.push("VIF");
      html += table(hdr, m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.t[i], SW.fmtP(m.p[i]), m.lower[i], m.upper[i]].concat(v.vif ? [i ? m.vif[i - 1] : ""] : [])), `Model Coefficients - ${v.y}`);
      html += formula(`${v.y} hat = ${m.b.map((b, i) => (i ? `${b >= 0 ? "+ " : "- "}${fmt(Math.abs(b))} (${m.names[i]})` : fmt(b))).join(" ")}. Each slope is the change in ${v.y} per unit of that predictor holding the others fixed. df = n minus (predictors + 1) = ${m.df}; n = ${m.n} complete rows${m.n < yv.length ? ` (${yv.length - m.n} dropped for blanks)` : ""}.`);
      html += say(`Overall: ${decision(m.pF, +v.alpha)} ${m.pF <= +v.alpha ? "At least one predictor is linearly related to " + esc(v.y) + "." : "No evidence that the predictors together explain " + esc(v.y) + "."} Adjusted R squared ${fmt(m.adj)} is the share of variation explained after charging for the number of predictors; compare models on that, not on R squared.`);
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
    needData(); const succCheck = levelCheck("y", "the level to model as 1");
    dialog("Advanced: Logistic Regression (binary outcome)", [selCat("y", "Outcome variable (two levels)"), { name: "succ", label: "Level to model as 1 (exactly as in the data)", type: "text", check: succCheck }, { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, ...termFields(), confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const yv = col(v.y), lv = [...new Set(yv.filter((q) => q !== ""))];
      const dm = designMatrix(v.xs, v.cs, parseRefs(v.refs)); const html0 = addModelTerms(dm, v, v.xs.concat(v.cs)); let keep = keepComplete(dm.rows, yv.map((q) => (q === "" ? "" : "0")));
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => (yv[i] === v.succ.trim() ? 1 : 0)); dm.names = pr.names;
      const m = SW.logistic(X, y, dm.names, +v.conf);
      let html = html0 + dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${esc(pr.dropped.join(", "))} and its rows: fewer than 3 usable rows in that category.`) : "") + (pr.emptyIx.length ? warn(`No rows have ${esc(pr.emptyIx.join(" or "))}, so ${pr.emptyIx.length > 1 ? "those interaction columns were" : "that interaction column was"} left out (R would print NA for it).`) : "") + table(["Model", "Deviance", "AIC", "McFadden R squared", "chi-square (vs intercept only)", "df", "p", "Correctly classified"], [["1", -2 * m.ll, m.aic, m.mcfadden, m.chi, m.dfChi, SW.fmtP(m.pChi), fmt(100 * m.accuracy, 1) + " percent"]], "Model Fit Measures");
      html += table(["Predictor", "Estimate (log odds)", "SE", "z", "p", "Odds ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.z[i], SW.fmtP(m.p[i]), m.or[i], m.orLower[i], m.orUpper[i]]), `Model Coefficients - ${v.y} = ${v.succ}`);
      html += formula(`log(odds of ${v.succ}) = b0 + b1 x1 + ... Each odds ratio is exp(b): the factor by which the odds of ${v.succ} multiply per unit of that predictor, others fixed. An odds ratio interval that includes 1 means no clear effect. n = ${m.n}, ${y.reduce((s, q) => s + q, 0)} are ${v.succ}.`);
      html += say(`${decision(m.pChi, +v.alpha)} ${m.pChi <= +v.alpha ? "The predictors together improve on guessing the base rate." : "The predictors together do not improve on guessing the base rate."}`);
      const cd = card("Logistic Regression", src(`${v.y} = ${v.succ}`), html);
      plotDiv(cd, [{ x: m.fitted.filter((_, i) => y[i] === 0), type: "histogram", name: `actual ${lv.find((l) => l !== v.succ.trim()) || "other"}`, opacity: 0.6, marker: { color: "#3A7CA5" } }, { x: m.fitted.filter((_, i) => y[i] === 1), type: "histogram", name: `actual ${v.succ}`, opacity: 0.6, marker: { color: "#D97D54" } }], { barmode: "overlay", title: "Predicted probability by actual outcome (good separation = little overlap)", xaxis: { title: `predicted P(${v.succ})`, range: [0, 1] }, yaxis: { title: "Count" } }, 260);
    });
  }
  function anova2UI() {
    needData();
    dialog("ANOVA: Two-Way ANOVA", [selNum("y", "Dependent variable"), selCat("a", "Factor A"), selCat("b", "Factor B"), { name: "inter", label: "Include the A x B interaction", type: "check", value: true }, alphaField], (v) => {
      const yv = col(v.y), A = col(v.a), B = col(v.b), keep = keepComplete(yv.map((q) => [q]), yv, [A, B]);
      const r = SW.anova2(keep.map((i) => Number(yv[i])), keep.map((i) => A[i]), keep.map((i) => B[i]), v.inter);
      let html = table(["Source", "Sum of Squares", "df", "Mean Square", "F", "p"], r.rows.map((q) => [q.source === "A" ? v.a : q.source === "B" ? v.b : q.source === "A x B" ? `${v.a} x ${v.b}` : q.source, q.ss, q.df, q.ms, q.F == null ? "" : q.F, q.p == null ? "" : SW.fmtP(q.p)]), `ANOVA - ${v.y} (Type II sums of squares, as R's car::Anova)`);
      html += table([`${v.a} | ${v.b}`, "N", "Mean", "SD"], r.cells.map((c) => [c.cell, c.n, c.mean, c.sd]), "Cell Descriptives");
      const inter = r.rows.find((q) => q.source === "A x B");
      html += formula("Type II: each main effect is tested after the other main effect; the interaction is tested after both. Unbalanced cells are handled correctly.");
      html += say(inter && inter.p <= +v.alpha ? `Interaction ${pWord(inter.p)}: the effect of ${esc(v.a)} depends on the level of ${esc(v.b)}. Read the cell means, not the main effects.` : `${inter ? "No evidence of interaction (" + pWord(inter.p) + "), so the main effects can be read on their own. " : ""}${esc(v.a)}: ${decision(r.rows[0].p, +v.alpha)} ${esc(v.b)}: ${decision(r.rows[1].p, +v.alpha)}`);
      html += smallGroups(r.cells.map((c) => [c.n, c.cell]));
      const cd = card("Two-Way ANOVA", src(`${v.y} by ${v.a} and ${v.b}`), html);
      const la = r.levelsA, lb = r.levelsB;
      plotDiv(cd, lb.map((b) => ({ x: la, y: la.map((a) => { const c = r.cells.find((q) => q.cell === a + " | " + b); return c ? c.mean : null; }), mode: "lines+markers", name: `${v.b} = ${b}` })), { title: "Cell means (parallel lines = no interaction)", xaxis: { title: v.a }, yaxis: { title: `mean ${v.y}` } }, 280);
    });
  }


  function rmAnovaUI() {
    needData();
    dialog("ANOVA: Repeated Measures ANOVA (wide data: one column per condition)", [{ name: "cols", label: "Repeated measures columns, in order (2 or more)", type: "multi", options: numCols() }, selAny("g", "Between-subjects factor (optional)"), { name: "post", label: "Pairwise paired t-tests with Holm correction", type: "check", value: true }, alphaField], (v) => {
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
    dialog("Advanced: Count Regression (Poisson and Negative Binomial)", [selNum("y", "Count outcome (non-negative whole numbers)"), { name: "xs", label: "Numeric predictors", type: "multi", options: numCols() }, { name: "cs", label: "Categorical predictors", type: "multi", options: catCols() }, Object.assign(sel("exp", "Exposure (optional): time at risk, population, months of service. log(exposure) enters as an offset and the model is for the rate", [["", "(none)"]].concat(numCols()), ""), { hint: "R: offset(log(exposure)). Rows with an exposure of 0 or blank are left out." }), ...termFields(), sel("fam", "Model", [["auto", "Poisson, then negative binomial if overdispersed (recommended)"], ["poisson", "Poisson only"], ["nb", "Negative binomial only"]], "auto"), confField, alphaField], (v) => {
      if (!v.xs.length && !v.cs.length) throw new Error("Pick at least one predictor.");
      if (v.exp && (v.exp === v.y || v.xs.includes(v.exp))) throw new Error("The exposure cannot also be the outcome or a predictor.");
      const dm = designMatrix(v.xs, v.cs, parseRefs(v.refs)), yv = col(v.y), ex = v.exp ? col(v.exp) : null; const html0 = addModelTerms(dm, v, v.xs.concat(v.cs)); let keep = keepComplete(dm.rows, yv, ex ? [ex] : []);
      let dropExp = 0; if (ex) { const k2 = keep.filter((i) => Number(ex[i]) > 0); dropExp = keep.length - k2.length; keep = k2; }
      const pr = pruneEmpty(keep.map((i) => dm.rows[i].map(Number)), dm.names, keep); keep = pr.keep; const X = pr.X, y = keep.map((i) => Number(yv[i])); dm.names = pr.names;
      if (y.some((q) => q < 0 || !Number.isInteger(q))) throw new Error("The outcome must be counts: 0, 1, 2, ...");
      if (!y.length) throw new Error("No complete rows with a positive exposure.");
      const opts = ex ? { offset: keep.map((i) => Math.log(Number(ex[i]))) } : {};
      const po = SW.poisson(X, y, dm.names, +v.conf, opts); let html = html0 + dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${esc(pr.dropped.join(", "))} and its rows: fewer than 3 usable rows in that category.`) : "") + (pr.emptyIx.length ? warn(`No rows have ${esc(pr.emptyIx.join(" or "))}, so ${pr.emptyIx.length > 1 ? "those interaction columns were" : "that interaction column was"} left out (R would print NA for it).`) : "");
      if (dropExp) html += warn(`${dropExp} row${dropExp > 1 ? "s" : ""} with ${esc(v.exp)} of 0 or blank left out: a rate needs a positive exposure (R's subset = ${esc(v.exp)} > 0 does the same).`);
      const coefTable = (m, label) => table(["Predictor", "Estimate (log rate)", "SE", "z", "p", "Rate ratio", `${Math.round(m.conf * 100)}% CI lower`, "upper"], m.names.map((nm, i) => [nm, m.b[i], m.se[i], m.z[i], SW.fmtP(m.p[i]), m.irr[i], m.irrLower[i], m.irrUpper[i]]), label);
      const useNB = v.fam === "nb" || (v.fam === "auto" && po.dispersion > 1.5);
      if (v.fam !== "nb") {
        html += table(["Deviance", "df", "Pearson dispersion", "AIC", "chi-square (vs intercept only)", "df", "p"], [[po.dev, po.df, po.dispersion, po.aic, po.chi, po.dfChi, SW.fmtP(po.pChi)]], "Poisson model fit") + coefTable(po, `Poisson coefficients - ${v.y}`);
        html += cond(po.dispersion <= 1.5, `Dispersion ${fmt(po.dispersion, 2)} is near 1: the Poisson assumption (variance equals mean) is reasonable.`, `Dispersion ${fmt(po.dispersion, 2)} is well above 1: the counts vary more than a Poisson allows (overdispersion). Poisson standard errors are too small and its p-values too optimistic. Use the negative binomial below.`);
      }
      if (useNB) { const nb = SW.negbin(X, y, dm.names, +v.conf, opts); html += table(["theta (dispersion parameter)", "Log-likelihood", "AIC", "Poisson AIC", "LR test NB vs Poisson", "p"], [[nb.theta, nb.ll, nb.aic, nb.poissonAic, nb.lrtVsPoisson, SW.fmtP(nb.pLrt)]], "Negative binomial model fit") + coefTable(nb, `Negative binomial coefficients - ${v.y}`) + say(`Negative binomial adds a dispersion parameter theta; smaller theta means more extra variation. ${nb.pLrt <= +v.alpha ? "The likelihood-ratio test prefers the negative binomial over Poisson." : "The two models fit about equally; Poisson is the simpler choice."}`); }
      html += formula(ex ? `log(expected ${v.y}) = log(${v.exp}) + b0 + b1 x1 + ... The offset log(${v.exp}) has a fixed coefficient of 1, so the model is for the rate ${v.y} per unit of ${v.exp}; exp(b0) is the baseline rate and a rate ratio exp(b) is the multiplicative change in that rate per unit of the predictor, others fixed. n = ${po.n}.` : `log(expected ${v.y}) = b0 + b1 x1 + ... A rate ratio exp(b) is the multiplicative change in the expected count per unit of the predictor, others fixed. n = ${po.n}.`);
      html += say(`${decision(po.pChi, +v.alpha)} ${po.pChi <= +v.alpha ? "The predictors together explain variation in the count." : "No evidence the predictors explain the count."}`);
      const cd = card(useNB ? "Count Regression (Poisson and Negative Binomial)" : "Poisson Regression", src(ex ? `${v.y} per ${v.exp}` : v.y), html);
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
      html += say(`${decision(m.pChi, +v.alpha)} ${m.pChi <= +v.alpha ? "The predictors help distinguish the outcome levels." : "No evidence the predictors distinguish the outcome levels."} Levels of ${esc(v.y)}: ${esc(lv.join(", "))}.`);
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
    const hasData = D.rows.length > 0, succCheck = levelCheck(["a", "b"], "the level that counts as yes", (raw) => raw.mode === "data");
    dialog("Advanced: McNemar test (paired yes or no)", [hasData ? sel("mode", "Data", [["data", "two paired categorical columns"], ["summary", "from the two discordant counts"]], "data") : sel("mode", "Data", [["summary", "from the two discordant counts"]]), only(hasData ? selCat("a", "Before (or measure 1)") : null, onData), only(hasData ? selCat("b", "After (or measure 2)") : null, onData), only(hasData ? { name: "succ", label: "Level that counts as yes", type: "text", check: succCheck } : null, onData), { name: "bc", label: "Yes before, No after", type: "number", group: "Discordant counts", vis: onSummary }, { name: "cb", label: "No before, Yes after", type: "number", group: "Discordant counts", vis: onSummary }, alphaField], (v) => {
      let b = v.bc, c = v.cb, from = "counts", tab = null;
      if (v.mode === "data") { const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const A = col(v.a), B = col(v.b), s = v.succ.trim(); let yy = 0, yn = 0, ny = 0, nn = 0; for (let i = 0; i < A.length; i++) { if (A[i] === "" || B[i] === "") continue; const a1 = A[i] === s, b1 = B[i] === s; if (a1 && b1) yy++; else if (a1) yn++; else if (b1) ny++; else nn++; } b = yn; c = ny; tab = [[yy, yn], [ny, nn]]; from = src(`${v.a} to ${v.b}, yes = ${s}`); if (yy + yn + ny + nn === 0) throw new Error(`No row has both ${v.a} and ${v.b} filled in, so there are no pairs to compare.`); }
      if (!(Number.isInteger(b) && Number.isInteger(c) && b >= 0 && c >= 0)) throw new Error("Type the two discordant counts as whole numbers, 0 or more.");
      if (b + c === 0) throw new Error("No pair changed (both discordant counts are 0), so there is nothing to test.");
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
    const hasData = D.rows.length > 0, succCheck = levelCheck("x", "the level that counts as success", (raw) => raw.mode === "data");
    // the typed group order: every name must be a level of the group column (a typo made a group of 0 and a NaN card)
    const orderCheck = (raw) => {
      if (raw.mode !== "data" || !raw.g || !D.cols.includes(raw.g) || !String(raw.order || "").trim()) return "";
      const lv = [...new Set(col(raw.g).filter((q) => q !== ""))], bad = raw.order.split(",").map((q) => q.trim()).filter((q) => q && !lv.includes(q));
      return bad.length ? `Levels of ${raw.g}: ${lv.slice(0, 12).join(", ")}${lv.length > 12 ? ", and more" : ""}. ${bad.join(", ")} ${bad.length > 1 ? "are" : "is"} not one of them; type each group exactly, comma separated.` : "";
    };
    dialog("Advanced: Cochran-Armitage trend test (proportion across ordered groups)", [hasData ? sel("mode", "Data", [["data", "outcome column by an ordered group column"], ["summary", "from counts"]], "data") : sel("mode", "Data", [["summary", "from counts"]]), only(hasData ? selCat("x", "Outcome variable") : null, onData), only(hasData ? { name: "succ", label: "Level that counts as success", type: "text", check: succCheck } : null, onData), only(hasData ? selCat("g", "Ordered group variable") : null, onData), only(hasData ? { name: "order", label: "Group levels in order, comma separated (blank = alphabetical)", type: "text", check: orderCheck } : null, onData), { name: "s", label: "Successes per group, comma separated", type: "text", group: "Counts", vis: onSummary }, { name: "n", label: "Totals per group, comma separated", type: "text", group: "Counts", vis: onSummary }, alphaField], (v) => {
      let succ, tot, labels, from = "counts";
      if (v.mode === "data") { const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const om = orderCheck(v); if (om) throw fieldErr("order", om); const xv = col(v.x), gv = col(v.g); labels = v.order.trim() ? v.order.split(",").map((s) => s.trim()) : [...new Set(gv.filter((q) => q !== ""))].sort(); succ = labels.map((l) => xv.filter((q, i) => gv[i] === l && q === v.succ.trim()).length); tot = labels.map((l) => xv.filter((q, i) => gv[i] === l && q !== "").length); from = src(`${v.x} = ${v.succ} across ${v.g}`); }
      else { succ = v.s.split(",").map(Number); tot = v.n.split(",").map(Number); labels = succ.map((_, i) => "group " + (i + 1)); }
      if (succ.length < 3) throw new Error("Need at least three ordered groups.");
      if (v.mode !== "data" && (tot.length !== succ.length || succ.some((q, i) => !(Number.isInteger(q) && Number.isInteger(tot[i]) && q >= 0 && tot[i] >= 1 && q <= tot[i])))) throw new Error("Type the successes and the totals per group as whole numbers, comma separated, the same number of each (successes from 0 to the total, each total at least 1).");
      if (v.mode === "data" && tot.some((q) => q < 1)) throw new Error(`${labels.filter((_, i) => tot[i] < 1).join(", ")} has no ${v.x} values in the rows in use. Leave it out of the group order.`);
      const R = succ.reduce((a, q) => a + q, 0), N = tot.reduce((a, q) => a + q, 0);
      if (R === 0 || R === N) { const m = `${R === 0 ? "No group has a success" : "Every one in every group is a success"}, so the proportion is ${R === 0 ? 0 : 1} everywhere and there is no trend to test.`; if (v.mode === "data") throw fieldErr("succ", m + " Check the success level and the filter."); throw new Error(m); }
      const r = SW.trendTest(succ, tot);
      let html = table(["Group", "Successes", "Total", "Proportion"], labels.map((l, i) => [l, succ[i], tot[i], r.props[i]]), "Proportions by ordered group") + table(["z", "chi-square", "df", "p"], [[r.z, r.chi, 1, SW.fmtP(r.p)]], "Cochran-Armitage trend test (scores 1, 2, 3, ...)");
      html += formula("Tests whether the proportion rises or falls steadily across the ordered groups, which is more powerful than the general chi-square when a trend is the question.") + say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `There is evidence of a ${r.z > 0 ? "rising" : "falling"} trend in the proportion across the groups.` : "No evidence of a linear trend across the groups."}`);
      const cd = card("Cochran-Armitage trend test", from, html);
      plotDiv(cd, [{ x: labels, y: r.props, mode: "lines+markers", line: { color: "#3A7CA5" } }], { yaxis: { title: "proportion", rangemode: "tozero" } }, 240);
    });
  }


  const PW_PROP = new Set(["prop1", "prop2"]), PW_K = new Set(["anova", "chisq"]), PW_GROUP = new Set(["t2", "prop2", "anova"]);
  const PW_EFF = { t1: "Effect size d (Cohen: 0.2 small, 0.5 medium, 0.8 large)", t2: "Effect size d (Cohen: 0.2 small, 0.5 medium, 0.8 large)", anova: "Effect size f (Cohen: 0.1 small, 0.25 medium, 0.4 large)", chisq: "Effect size w (Cohen: 0.1 small, 0.3 medium, 0.5 large)", corr: "Correlation r (Cohen: 0.1 small, 0.3 medium, 0.5 large)" };
  function powerUI() {
    dialog("Advanced: Power and Sample Size", [
      sel("test", "Test", [["t1", "One-sample or paired t (effect d = mean difference / SD)"], ["t2", "Two independent means, t (d = difference / SD, n per group)"], ["prop1", "One proportion (p0 against p1)"], ["prop2", "Two proportions (n per group)"], ["anova", "One-way ANOVA (Cohen's f, n per group)"], ["corr", "Correlation (r)"], ["chisq", "Chi-square (Cohen's w, df)"]], "t2"),
      sel("mode", "Find", [["power", "power, given the sample size"], ["n", "sample size, for a target power"]], "n"),
      // only the boxes the chosen test uses show, each named for that test
      { name: "d", label: "Effect size: d, f, w, or r (Cohen: d 0.2 small, 0.5 medium, 0.8 large; f 0.1, 0.25, 0.4; w 0.1, 0.3, 0.5; r 0.1, 0.3, 0.5)", type: "number", value: 0.5, group: "Effect", vis: (raw) => !PW_PROP.has(raw.test), lab: (raw) => PW_EFF[raw.test] || "Effect size" },
      { name: "p0", label: "p0 or p1 (proportions)", type: "number", value: 0.5, group: "Effect", vis: (raw) => PW_PROP.has(raw.test), lab: (raw) => (raw.test === "prop2" ? "p1 (group 1)" : "p0 (the null value)") }, { name: "p1", label: "p1 or p2 (proportions)", type: "number", value: 0.65, group: "Effect", vis: (raw) => PW_PROP.has(raw.test), lab: (raw) => (raw.test === "prop2" ? "p2 (group 2)" : "p1 (the true value)") },
      { name: "k", label: "Groups (ANOVA) or df (chi-square)", type: "number", value: 3, group: "Effect", vis: (raw) => PW_K.has(raw.test), lab: (raw) => (raw.test === "chisq" ? "df" : "Number of groups") },
      { name: "n", label: "Sample size n (per group where relevant)", type: "number", value: 30, group: "Design", vis: (raw) => raw.mode === "power", lab: (raw) => (PW_GROUP.has(raw.test) ? "Sample size n per group" : "Sample size n") }, { name: "pow", label: "Target power", type: "number", value: 0.8, group: "Design", vis: (raw) => raw.mode === "n" }, alphaField,
      Object.assign(sel("alt", "Alternative", [["two", "two-sided"], ["one", "one-sided"]], "two"), { vis: (raw) => !PW_K.has(raw.test) })], (v) => {
      const a = +v.alpha, alt = v.alt === "two" ? "two" : "greater";
      if (PW_PROP.has(v.test) ? !(v.p0 > 0 && v.p0 < 1 && v.p1 > 0 && v.p1 < 1) : !(Number.isFinite(v.d) && (v.test !== "corr" || Math.abs(v.d) < 1))) throw new Error(PW_PROP.has(v.test) ? "Type both proportions as decimals between 0 and 1, such as 0.5 and 0.65." : v.test === "corr" ? "Type the correlation r, a number between -1 and 1, such as 0.3." : "Type the effect size, for example 0.5.");
      if (PW_K.has(v.test) && !(Number.isInteger(v.k) && v.k >= (v.test === "chisq" ? 1 : 2))) throw new Error(v.test === "chisq" ? "Type df, a whole number 1 or more." : "Type the number of groups, a whole number 2 or more.");
      if (v.mode === "power" && !(v.n >= 2)) throw new Error("Type the sample size n, 2 or more.");
      if (v.mode === "n" && !(v.pow > 0 && v.pow < 1)) throw new Error("Type the target power as a decimal between 0 and 1, such as 0.8.");
      if (!(a > 0 && a < 1)) throw new Error("alpha must be between 0 and 1, for example 0.05.");
      const P = S => S; const fn = {
        t1: (n) => SW.power.t1(v.d, n, a, alt), t2: (n) => SW.power.t2(v.d, n, a, alt), prop1: (n) => SW.power.prop1(v.p0, v.p1, n, a, alt), prop2: (n) => SW.power.prop2(v.p0, v.p1, n, a, alt),
        anova: (n) => SW.power.anova(v.d, v.k, n, a), corr: (n) => SW.power.corr(v.d, n, a, alt), chisq: (n) => SW.power.chisq(v.d, v.k, n, a) }[v.test];
      const effLabel = { t1: `d = ${v.d}`, t2: `d = ${v.d}`, prop1: `p0 = ${v.p0}, p1 = ${v.p1}`, prop2: `p1 = ${v.p0}, p2 = ${v.p1}`, anova: `f = ${v.d}, ${v.k} groups`, corr: `r = ${v.d}`, chisq: `w = ${v.d}, df = ${v.k}` }[v.test];
      const perGroup = ["t2", "prop2", "anova"].includes(v.test);
      let html, nUse;
      if (v.mode === "n") { nUse = SW.solveN(fn, v.pow, v.test === "corr" ? 5 : 3); html = table(["Test", "Effect", "Alpha", "Target power", perGroup ? "n per group" : "n", "Power at that n"], [[v.test, effLabel, a, v.pow, Number.isFinite(nUse) ? nUse : "over 100,000", Number.isFinite(nUse) ? fn(nUse) : ""]], "Sample size"); }
      else { nUse = Math.round(v.n); html = table(["Test", "Effect", "Alpha", perGroup ? "n per group" : "n", "Power"], [[v.test, effLabel, a, nUse, fn(nUse)]], "Power"); }
      const pg = perGroup ? " per group" : "";
      html = (v.mode === "n" ? `<div class="big">n = ${Number.isFinite(nUse) ? nUse : "over 100,000"} <span class="pct">${perGroup ? "per group" : "needed"}</span></div><div class="words">For ${Math.round(100 * v.pow)} percent power to detect ${effLabel} at alpha ${a}.</div>` : `<div class="big">Power = ${fmt(fn(nUse))} <span class="pct">${pctTxt(fn(nUse))}</span></div><div class="words">The chance of detecting ${effLabel} with n = ${nUse}${pg} at alpha ${a}.</div>`) + html;
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
    needData(); const succCheck = levelCheck("g", "the level for the proportion", (raw) => raw.stat === "prop");
    dialog("Advanced: Bootstrap confidence interval", [sel("stat", "Statistic", [["mean", "mean of one variable"], ["median", "median of one variable"], ["sd", "standard deviation of one variable"], ["prop", "proportion of one level"], ["diffmean", "difference in means between two groups"], ["diffmed", "difference in medians between two groups"], ["corr", "correlation between two variables"], ["slope", "regression slope of y on x"]], "mean"),
      selNum("x", "Numeric variable (or x)"), selNum("y2", "Second numeric variable (y, for correlation or slope)"), selCat("g", "Grouping variable (two levels, for differences) or the categorical variable (for a proportion)"), lvField, { name: "succ", label: "Level for the proportion", type: "text", check: succCheck },
      { name: "reps", label: "Resamples", type: "number", value: 2000 }, { name: "seed", label: "Random seed (same seed, same answer)", type: "number", value: 1 }, confField], (v) => {
      let x, y = null, paired = false, stat, label;
      const lv2 = () => pickTwo(v.g, v.lv);
      if (["mean", "median", "sd"].includes(v.stat)) { x = SW.num(col(v.x)); stat = { mean: SW.mean, median: SW.median, sd: SW.sd }[v.stat]; label = `${v.stat} of ${v.x}`; }
      else if (v.stat === "prop") { const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); x = col(v.g).filter((q) => q !== "").map((q) => (q === v.succ.trim() ? 1 : 0)); stat = SW.mean; label = `proportion of ${v.g} = ${v.succ}`; }
      else if (v.stat === "diffmean" || v.stat === "diffmed") { const lv = lv2(); x = SW.num(col(v.x).filter((_, i) => col(v.g)[i] === lv[0])); y = SW.num(col(v.x).filter((_, i) => col(v.g)[i] === lv[1])); const f = v.stat === "diffmean" ? SW.mean : SW.median; stat = (a, b) => f(a) - f(b); label = `${v.stat === "diffmean" ? "mean" : "median"} ${v.x}: ${lv[0]} minus ${lv[1]}`; }
      else { const xa = col(v.x), ya = col(v.y2); const keep = xa.map((_, i) => i).filter((i) => xa[i] !== "" && ya[i] !== ""); x = keep.map((i) => Number(xa[i])); y = keep.map((i) => Number(ya[i])); paired = true; stat = v.stat === "corr" ? (a, b) => SW.regress(a, b).r : (a, b) => SW.regress(a, b).b1; label = v.stat === "corr" ? `correlation of ${v.x} and ${v.y2}` : `slope of ${v.y2} on ${v.x}`; }
      const r = SW.bootstrap({ x, y, stat, reps: Math.min(20000, Math.max(200, v.reps)), conf: +v.conf, seed: v.seed, paired });
      let html = table(["Statistic", "Observed", "Bootstrap SE", "Bias", `${Math.round(r.conf * 100)}% percentile interval`, "", "Resamples"], [[label, r.observed, r.se, r.bias, r.lower, r.upper, r.reps]], "Bootstrap");
      html += formula("Resample the data with replacement, the same size as the original, recompute the statistic, repeat. The spread of those values is the sampling variation you would have seen with new data. The percentile interval takes the middle 95 percent of the bootstrap values. No formula for the standard error, no normality assumption.");
      html += say(`We are ${Math.round(r.conf * 100)} percent confident the population ${esc(label)} is between ${fmt(r.lower)} and ${fmt(r.upper)}. ${Math.abs(r.bias) > 0.25 * r.se ? "The bootstrap distribution is noticeably off-centre (bias larger than a quarter of the SE), so treat the interval as approximate; the basic interval is " + fmt(r.basicLower) + " to " + fmt(r.basicUpper) + "." : "Bias is small relative to the SE, so the percentile interval is trustworthy."}`);
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
      html += say(`${decision(r.p, +v.alpha)} ${r.p <= +v.alpha ? `A ${esc(label)} of ${fmt(r.observed)} would be rare if the groups (or pairs) were interchangeable.` : `A ${esc(label)} of ${fmt(r.observed)} happens easily by chance when the labels are shuffled.`} No normality assumption; this is the exact logic the t-test approximates.`);
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
      const ma = S => S; const win = Number.isFinite(v.ma) ? Math.max(2, Math.round(v.ma)) : period || 12, m = SW.movingAverage(x, win); // blank window: the period, or 12
      plotDiv(cd, [{ x: tl, y: x, mode: "lines", name: v.y, line: { color: "#3A7CA5" } }, { x: tl, y: m, mode: "lines", name: `${win}-point moving average`, line: { color: "#C0392B", width: 2 } }], { title: "Time plot", yaxis: { title: v.y } }, 300);
      cd.insertAdjacentHTML("beforeend", say("Read the time plot first: level, trend, seasonality (a repeating shape), and anything odd. The moving average smooths out the seasonal swing when its window equals the period."));
      if (v.acf) {
        const L = Math.min(Number.isFinite(v.lags) ? Math.max(1, Math.round(v.lags)) : 24, Math.floor(n / 2)), a = SW.acf(x, L), p = SW.pacf(x, L), band = 1.96 / Math.sqrt(n);
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
        const hh = Number.isFinite(v.h) ? Math.max(1, Math.round(v.h)) : period || 12, flab = Array.from({ length: hh }, (_, k) => "+" + (k + 1));
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
      html += say(`${m} factor${m > 1 ? "s" : ""} explain ${fmt(100 * r.cum[m - 1], 1)} percent of the item variance. Name each factor from the items loading above ${v.cut} on it; a negative loading means the item is reverse-keyed.${weak.length ? ` Items with communality under 0.2 (${esc(weak.join(", "))}) belong to none of the factors and may not fit the scale.` : ""} Use the scree plot: factors beyond the elbow (eigenvalue near 1 or below) add little.`);
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
      html += cond(r.alpha >= 0.7, `Alpha ${fmt(r.alpha, 3)}: the items hang together well enough to be summed into one score.`, `Alpha ${fmt(r.alpha, 3)}: below 0.7, the items do not agree enough to be one scale.`) + (neg.length ? warn(`Negative item-rest correlation for ${esc(neg.join(", "))}: these items are probably reverse-keyed. Add them to the reverse list and run again.`) : "") + (drops.length ? say(`Dropping ${esc(drops.join(" or "))} would raise alpha; consider whether those items belong.`) : "");
      card("Reliability (Cronbach's alpha)", src(`${v.vars.length} items`), html);
    });
  }
  function survivalUI() {
    needData(); const succCheck = levelCheck("e", "the level that means the event happened");
    dialog("Advanced: Survival Analysis (Kaplan-Meier, log-rank, Cox)", [selNum("t", "Time to event or censoring (numeric)"), selCat("e", "Event indicator (two levels)"), { name: "succ", label: "Level that means the event happened (exactly as in the data)", type: "text", placeholder: "Yes", check: succCheck }, selAny("g", "Group (optional: one Kaplan-Meier curve per level, log-rank test)"),
      { name: "xs", label: "Cox model: numeric predictors (optional)", type: "multi", options: numCols() }, { name: "cs", label: "Cox model: categorical predictors (optional)", type: "multi", options: catCols() },
      { name: "risk", label: "Risk table (numbers at risk over time)", type: "check", value: true, group: "Show" }, { name: "ci", label: "Confidence band on the curves", type: "check", value: true, group: "Show" }, confField, alphaField], (v) => {
      const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const tv = col(v.t), ev = col(v.e), lv = [...new Set(ev.filter((q) => q !== ""))];
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
        cd.insertAdjacentHTML("beforeend", table(["Group", "n", "Observed events", "Expected events", "(O minus E) squared / E"], lr.groups.map((g, j) => [g, group.filter((q) => q === g).length, lr.observed[j], lr.expected[j], Math.pow(lr.observed[j] - lr.expected[j], 2) / lr.expected[j]]), "Log-rank test") + table(["chi-square", "df", "p"], [[lr.chi, lr.df, SW.fmtP(lr.p)]], "") + formula("H0: the survival curves are the same in every group. At each event time the log-rank test compares the events observed in each group with the number expected if the groups shared one hazard, then sums over all event times. It weights every event time equally (same as R's survdiff).") + say(`${decision(lr.p, +v.alpha)} ${lr.p <= +v.alpha ? "The groups have different survival curves." : "No evidence that survival differs between the groups."} Medians: ${lr.groups.map((g, j) => `${esc(g)} ${lr.medians[j] == null ? "not reached" : lr.medians[j]}`).join(", ")}.`)); }
      if (v.xs.length || v.cs.length) { const dm = designMatrix(v.xs, v.cs); let k2 = keep.filter((i) => dm.rows[i].every((q) => q !== "" && Number.isFinite(Number(q))));
        const pr = pruneEmpty(k2.map((i) => dm.rows[i].map(Number)), dm.names, k2); k2 = pr.keep;
        const m = SW.cox(k2.map((i) => Number(tv[i])), k2.map((i) => (ev[i] === v.succ.trim() ? 1 : 0)), pr.X, pr.names, conf);
        const pct = Math.round(conf * 100);
        cd.insertAdjacentHTML("beforeend", dmNotes(dm) + (pr.dropped.length ? warn(`Dropped ${esc(pr.dropped.join(", "))} and its rows: fewer than 3 usable rows in that category.`) : "") + (pr.emptyIx.length ? warn(`No rows have ${esc(pr.emptyIx.join(" or "))}, so ${pr.emptyIx.length > 1 ? "those interaction columns were" : "that interaction column was"} left out (R would print NA for it).`) : "") + table(["Predictor", "Coefficient (log hazard ratio)", "SE", "z", "p", "Hazard ratio", `${pct}% CI lower`, `${pct}% CI upper`], m.names.map((nm, j) => [nm, m.b[j], m.se[j], m.z[j], SW.fmtP(m.p[j]), m.hr[j], m.hrLower[j], m.hrUpper[j]]), `Cox proportional hazards model (${m.n} rows, ${m.events} events)`) + table(["Likelihood ratio chi-square", "df", "p", "Log-likelihood (null)", "Log-likelihood (model)"], [[m.lrt, m.dfLrt, SW.fmtP(m.pLrt), m.ll0, m.ll]], "Model fit") + formula("h(t | x) = h0(t) times exp(b1 x1 + ... + bk xk). A hazard ratio of 1.5 means a 50 percent higher instantaneous risk of the event at every time, holding the other predictors fixed; below 1 means lower risk. No shape is assumed for the baseline hazard h0(t). Partial likelihood with Efron's correction for tied times (R's coxph default).") + say(m.names.map((nm, j) => `${esc(nm)}: HR ${fmt(m.hr[j], 3)} (${pct}% CI ${fmt(m.hrLower[j], 3)} to ${fmt(m.hrUpper[j], 3)}), ${m.p[j] <= +v.alpha ? "significant" : "not significant"} at alpha ${v.alpha}. ${nm.includes(" = ") ? (m.hr[j] > 1 ? `This group has a ${fmt(100 * (m.hr[j] - 1), 1)} percent higher hazard than the reference group.` : `This group has a ${fmt(100 * (1 - m.hr[j]), 1)} percent lower hazard than the reference group.`) : (m.hr[j] > 1 ? `Each one-unit increase raises the hazard by ${fmt(100 * (m.hr[j] - 1), 1)} percent.` : `Each one-unit increase lowers the hazard by ${fmt(100 * (1 - m.hr[j]), 1)} percent.`)}`).join(" ")) + warn("The model assumes proportional hazards: the curves should not cross. Check the Kaplan-Meier plot by group; crossing curves mean a hazard ratio is not a fair summary."));
        plotDiv(cd, [{ x: m.hr, y: m.names, mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: 9 }, error_x: { type: "data", symmetric: false, array: m.hrUpper.map((u, j) => u - m.hr[j]), arrayminus: m.hr.map((h, j) => h - m.hrLower[j]), color: "#3A7CA5" }, name: "HR" }], { title: `Hazard ratios with ${pct}% confidence intervals`, xaxis: { title: "hazard ratio (log scale)", type: "log" }, yaxis: { automargin: true }, shapes: [{ type: "line", y0: 0, y1: 1, yref: "paper", x0: 1, x1: 1, line: { color: "#C0392B", dash: "dash" } }], margin: { l: 160 } }, 80 + 40 * m.names.length); }
    });
  }
  function bayesUI() {
    const hasData = D.rows.length > 0, succCheck = levelCheck("g", "the success level", (raw) => raw.kind === "prop" && raw.srcMode === "data");
    dialog("Advanced: Bayesian Inference (conjugate priors)", [sel("kind", "Parameter", [["prop", "a proportion p (beta prior, binomial data)"], ["mean", "a mean mu (normal prior, sigma known or estimated by s)"]], "prop"),
      sel("srcMode", "Data come from", (hasData ? [["data", "a column of the loaded data"]] : []).concat([["typed", "numbers typed below"]]), hasData ? "data" : "typed"),
      selCat("g", "Categorical column (proportion)"), { name: "succ", label: "Success level (exactly as in the data)", type: "text", check: succCheck }, selNum("x", "Numeric column (mean)"),
      { name: "xs", label: "Typed: successes x (proportion) or sample mean x bar (mean)", type: "number", value: 14, group: "Typed data" }, { name: "n", label: "Typed: sample size n", type: "number", value: 20, group: "Typed data" }, { name: "sigma", label: "Typed: sigma (mean only)", type: "number", value: 15, group: "Typed data" },
      { name: "a", label: "Prior: beta a (proportion) or prior mean (mean). Beta(1, 1) is flat; Beta(2, 2) leans to the middle.", type: "number", value: 1, group: "Prior" }, { name: "b", label: "Prior: beta b (proportion) or prior SD (mean). A big prior SD says you know little.", type: "number", value: 1, group: "Prior" },
      { name: "h0", label: "Compare with a value (optional): p0 or mu0", type: "text", placeholder: "0.5", group: "Prior" }, confField], (v) => {
      const conf = +v.conf, pct = Math.round(conf * 100), h0 = v.h0 && v.h0.trim() !== "" ? Number(v.h0) : null;
      let cd;
      if (v.kind === "prop") {
        let x, n, label;
        if (v.srcMode === "data") { const lm = succCheck(v, true); if (lm) throw fieldErr("succ", lm); const gv = col(v.g).filter((q) => q !== ""); n = gv.length; x = gv.filter((q) => q === v.succ.trim()).length; label = `${v.g} = ${v.succ.trim()}, ${x} of ${n}`; }
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
  function tPlot(cd, t, df, alt, title) { const lim = Math.max(4, Math.abs(t) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.studentt.pdf(x, df)), t, alt, title || `t distribution, df = ${fmt(df, 2)}; shaded area is the p-value`); }
  function zPlot(cd, z, alt) { const lim = Math.max(4, Math.abs(z) + 1), xs = []; for (let x = -lim; x <= lim; x += lim / 150) xs.push(x); curvePlot(cd, xs, xs.map((x) => jStat.normal.pdf(x, 0, 1)), z, alt, "standard normal; shaded area is the p-value"); }

  // ================= distrACTION =================
  // Event choices shared by every calculator. The original option labels are kept word for word because the course
  // materials quote them; the strict, equal-to and quantile choices sit alongside them in the same wording.
  const KMAP = { below: "le", above: "ge" }, kOf = (kind) => KMAP[kind] || kind;
  const isBetween = (raw) => /between/.test(raw.kind || "");
  const EVS = { html: { lt: "&lt;", le: "&le;", gt: "&gt;", ge: "&ge;", eq: "=" }, uni: { lt: "<", le: "≤", gt: ">", ge: "≥", eq: "=" }, ascii: { lt: "<", le: "<=", gt: ">", ge: ">=", eq: "=" } };
  function evText(kind, a, b, mode) { const k = kOf(kind), S = EVS[mode]; return k === "between" ? `P(${a} ${S.le} X ${S.le} ${b})` : k === "betweenS" ? `P(${a} ${S.lt} X ${S.lt} ${b})` : `P(X ${S[k]} ${a})`; }
  const evWords = (kind, a, b) => ({ lt: `X is less than ${a}`, le: `X is at most ${a}`, gt: `X is more than ${a}`, ge: `X is at least ${a}`, eq: `X equals ${a} exactly`, between: `X is between ${a} and ${b}, both ends included`, betweenS: `X is between ${a} and ${b}, ends not included` })[kOf(kind)];
  const pctTxt = (p) => (p <= 0 ? "0%" : p >= 1 ? "100%" : p < 0.001 ? "under 0.1%" : p > 0.999 ? "over 99.9%" : `about ${Number((p * 100).toFixed(1))}%`);
  // A probability on screen is never a bare 0 or 1 unless it is exactly 0 or 1. A tiny one prints as "< 0.0001" (to the
  // decimals chosen) and the words give it the way a calculator writes it (3.17E-5). The argument is a number, or
  // { p, c: 1 minus p worked out from its own side, pos: the event holds possible values, posC: so does the rest }.
  const sciTxt = (x) => { let e = Math.floor(Math.log10(x)), m = Number((x / 10 ** e).toFixed(2)); if (m >= 10) { m = 1; e += 1; } return `${m}E${e}`; };
  const showP = (r, d = DEC) => {
    const o = typeof r === "number" ? { p: r } : r, p = o.p, c = o.c == null ? 1 - p : o.c, pos = o.pos == null ? p > 0 : o.pos, posC = o.posC == null ? p < 1 : o.posC;
    const s = fmt(p, d), lim = 10 ** -d;
    if (Number.isFinite(p) && pos && Number(s) === 0) { const e = Math.floor(Math.log10(p)); return { rel: `< ${lim.toFixed(d)}`, cell: `< ${lim.toFixed(d)}`, pct: "under 0.1%", note: p > 0 ? `Not exactly 0, just very small: about ${sciTxt(p)}${e >= -8 ? `, that is ${p.toFixed(2 - e)}` : ""}.` : "Not exactly 0, just too small to show." }; }
    if (Number.isFinite(p) && posC && Number(s) === 1) return { rel: `> ${(1 - lim).toFixed(d)}`, cell: `> ${(1 - lim).toFixed(d)}`, pct: "over 99.9%", note: c > 0 ? `Not exactly 1, just very close: 1 minus about ${sciTxt(c)}.` : "Not exactly 1, just too close to 1 to show the difference." };
    return { rel: `= ${s}`, cell: p, pct: pctTxt(p), note: "" };
  };
  const probWords = (x) => showP({ p: x, pos: true }, 6).rel.replace(/^= /, "").replace(/^< /, "less than ").replace(/^> /, "more than "); // 6 decimals, in words
  const bigProb = (kind, a, b, r) => { const d = showP(r); return `<div class="big"><span class="ev">${evText(kind, a, b, "html")}</span> ${esc(d.rel)} <span class="pct">${d.pct}</span></div><div class="words">The probability that ${evWords(kind, a, b)}.${d.note ? " " + d.note : ""}</div>`; };
  const bigQuant = (p, x, discrete) => `<div class="big">x = ${fmt(x)} <span class="pct">for p = ${p}</span></div><div class="words">${discrete ? `The smallest x with P(X &le; x) at least ${p}.` : `The value with P(X &le; x) = ${p}: ${pctTxt(p)} of the distribution lies at or below it.`}</div>`;
  // "none, just the mean and SD": the answer is the mean and the SD, in large type like every other card; the graph title says nothing is shaded
  const bigMeanSD = (mu, sd) => `<div class="big">mean = ${fmt(mu)} <span class="pct">SD = ${fmt(sd)}</span></div><div class="words">The mean (expected value) of X and its standard deviation. To find a probability, choose an event in the Compute probability list.</div>`;
  const allTitle = (mu, sd) => `The whole distribution: mean ${fmt(mu)}, SD ${fmt(sd)} (nothing shaded)`;
  const shadeTitle = (kind, a, b, r) => `Shaded: ${evText(kind, a, b, "uni")} ${showP(r).rel}`; // plain text: plotDiv escapes every graph string once, so a < shows as <
  const CONT_NOTE = `<div class="note">For a continuous variable, &lt; and &lt;= give the same area; P(X = a) = 0.</div>`;
  // both lists in the same order: at most, less than, at least, more than, equal, between (ends in), between (ends out), quantile.
  // The quantile label is short so it fits a phone; the result's words line says exactly what x is (for a discrete X, the smallest x).
  const QUANT_L = "quantile: x for cumulative probability p";
  const D_OPTS = [["le", "P(X at most x1)"], ["lt", "P(X less than x1)"], ["ge", "P(X at least x1)"], ["gt", "P(X more than x1)"], ["eq", "P(X = x1)"], ["between", "P(x1 at most X at most x2)"], ["betweenS", "P(x1 less than X less than x2)"], ["q", QUANT_L]];
  const CONT_OPTS = [["below", "probability: P(X at most x1)"], ["lt", "probability: P(X less than x1)"], ["above", "probability: P(X at least x1)"], ["gt", "probability: P(X more than x1)"], ["eq", "probability: P(X = x1)"], ["between", "probability: P(x1 at most X at most x2)"], ["betweenS", "probability: P(x1 less than X less than x2)"], ["q", QUANT_L]];
  const inEvent = (kind, x, k, b) => { switch (kOf(kind)) { case "eq": return x === k; case "lt": return x < k; case "le": return x <= k; case "gt": return x > k; case "ge": return x >= k; case "between": return x >= k && x <= b; case "betweenS": return x > k && x < b; default: return false; } };
  const needX1 = (k, b, kind) => {
    if (kOf(kind) === "q") { if (!Number.isFinite(k)) throw blankErr("Type the cumulative probability p in x1, a decimal such as 0.90."); if (!(k > 0 && k < 1)) throw new Error("For a quantile, x1 holds the cumulative probability p: type a decimal between 0 and 1 such as 0.90."); return; }
    if (!Number.isFinite(k)) throw blankErr("Type a value for x1.");
    if (/between/.test(kind) && !Number.isFinite(b)) throw blankErr("Type a value for x2.");
    if (/between/.test(kind) && !(b >= k)) throw new Error("For between, x2 must be a number at least as large as x1.");
  };
  // exact probability of an event for a whole-number X that can take the values lo to hi, from tails.cdf(c) = P(X <= c)
  // and tails.sf(c) = P(X > c) at any real c. Only the chosen event is worked out. Returns { p, c, pos, posC } for showP:
  // the complement c comes from its own side, so a tiny one keeps its digits. A result that is not a number is an error,
  // never a 1 or a 0.
  const discProb = (kind, k, b, tails, pmfAt, lo, hi) => {
    const { cdf, sf } = tails, lt = (x) => cdf(Math.ceil(x) - 1), ge = (x) => sf(Math.ceil(x) - 1), kk = kOf(kind); // P(X < x), P(X >= x)
    const mid = (below, above, fromTop, fromBottom) => (below > 0.5 ? fromTop() - above : above > 0.5 ? fromBottom() - below : 1 - below - above);
    let p, c;
    if (kk === "eq") { p = pmfAt(k); c = 1 - p; }
    else if (kk === "lt") { p = lt(k); c = ge(k); }
    else if (kk === "le") { p = cdf(k); c = sf(k); }
    else if (kk === "gt") { p = sf(k); c = cdf(k); }
    else if (kk === "ge") { p = ge(k); c = lt(k); }
    else if (kk === "between") { const below = lt(k), above = sf(b); p = mid(below, above, () => ge(k), () => cdf(b)); c = below + above; }
    else { const below = cdf(k), above = ge(b); p = mid(below, above, () => sf(k), () => lt(b)); c = below + above; } // betweenS
    if (!Number.isFinite(p) || !Number.isFinite(c)) throw new Error("This probability could not be worked out for these inputs. Check the parameters, or try smaller numbers.");
    const ev = { eq: Number.isInteger(k) ? [k, k] : [1, 0], lt: [-Infinity, Math.ceil(k) - 1], le: [-Infinity, Math.floor(k)], gt: [Math.floor(k) + 1, Infinity], ge: [Math.ceil(k), Infinity], between: [Math.ceil(k), Math.floor(b)], betweenS: [Math.floor(k) + 1, Math.ceil(b) - 1] }[kk];
    const a1 = Math.max(ev[0], lo), b1 = Math.min(ev[1], hi), pos = a1 <= b1;
    return { p: Math.max(0, Math.min(1, p)), c: Math.max(0, Math.min(1, c)), pos, posC: !pos || a1 > lo || b1 < hi };
  };
  // which x values the graph and the Full table show. A short support (101 values or fewer) is shown whole. Otherwise the
  // middle of the distribution, from the first x with P(X <= x) above 0.0001 to the first with P(X > x) below 0.0001,
  // widened to take in x1, x2 or the quantile while the graph stays readable, and run to the end of the support when
  // only a few values would be left out. pts: [[x, "x1"], ...]. Returns the rows plus notes for what is not shown.
  function discWindow(pmf, tails, lo, hi, mu, pts) {
    const TAIL = 1e-4, MAXBARS = 5001; let L = lo, R = hi; const off = [];
    if (!(Number.isFinite(hi) && hi - lo + 1 <= 101)) {
      R = SW.firstWhole((x) => tails.sf(x) < TAIL, lo, hi); L = SW.firstWhole((x) => tails.cdf(x) > TAIL, lo, R);
      if (!Number.isFinite(R) || !Number.isFinite(L)) throw new Error("This distribution is too spread out to draw. Check the parameters.");
      if (R - L + 1 > MAXBARS) { L = Math.max(L, Math.round(mu) - Math.floor(MAXBARS / 2)); R = Math.min(R, L + MAXBARS - 1); }
      const w = R - L;
      if (L - lo <= 0.25 * w && R - lo + 1 <= MAXBARS) L = lo;
      if (Number.isFinite(hi) && hi - R <= 0.25 * w && hi - L + 1 <= MAXBARS) R = hi;
      const lim = Math.max(201, 2 * (R - L + 1));
      pts.filter((q) => Number.isFinite(q[0])).forEach(([x0, name]) => [Math.floor(x0), Math.ceil(x0)].forEach((x1) => {
        const x = Math.min(hi, Math.max(lo, x1));
        if (x < L) { if (R - x + 1 <= lim) L = x; else if (!off.includes(name)) off.push(name); }
        else if (x > R) { if (x - L + 1 <= lim) R = x; else if (!off.includes(name)) off.push(name); }
      }));
    }
    const below = L > lo ? tails.cdf(L - 1) : 0, above = R < hi ? tails.sf(R) : 0;
    const rows = []; let cum = below; for (let x = L; x <= R; x++) { const p = pmf(x); cum += p; rows.push({ x, p, cum: Math.min(1, cum) }); }
    let notes = "";
    if (L > lo) notes += `<div class="note">Values below ${L} have total probability ${probWords(below)} and are not listed.</div>`;
    if (R < hi) notes += `<div class="note">Values above ${R} have total probability ${probWords(above)} and are not listed.</div>`;
    const offNote = off.length ? `<div class="note">The graph shows x from ${L} to ${R}, where nearly all of the probability is, so ${off.join(" and ")} ${off.length > 1 ? "are" : "is"} off the graph. The probability above is still exact.</div>` : "";
    // Full table cells: a value X can take never prints as a bare 0, and P(X <= x) below the last value never as a bare 1
    const cells = rows.map((r) => [r.x, showP({ p: r.p, pos: true }).cell, showP({ p: r.cum, pos: true, posC: r.x < hi }).cell]);
    return { rows, cells, notes, offNote, L, R };
  }
  const findFields = (x1, def) => [{ name: "k", label: "x1 (or p for a quantile)", type: "number", value: def, group: "Find", vis: (raw) => raw.kind !== "none" }, { name: "b", label: "x2", type: "number", value: "", group: "Find", vis: isBetween }];
  function binomCalc() {
    dialog("distrACTION: Binomial Distribution", [{ name: "n", label: "Number of trials", type: "number", value: 10, group: "Parameters" }, { name: "p", label: "Probability of success", type: "number", value: 0.5, group: "Parameters" },
      Object.assign(sel("kind", "Compute probability", D_OPTS, "eq"), { group: "Find" }), ...findFields("k", 5)], (v) => {
      const { n, p } = v; let prob, label;
      if (!(p >= 0 && p <= 1)) throw new Error("Probability of success must be between 0 and 1: type a decimal such as 0.575, not a percent.");
      if (!(n >= 1) || n !== Math.floor(n)) throw new Error("Number of trials must be a whole number, 1 or more.");
      const k = v.k, b = v.b, q = v.kind === "q"; needX1(k, b, v.kind);
      // stable for any n (stats.js): the pmf never overflows, and each tail is added up from its own end
      const pmf = (x) => SW.dbinom(x, n, p), tails = { cdf: (c) => SW.pbinom(Math.floor(c), n, p), sf: (c) => SW.pbinomUpper(Math.floor(c), n, p) };
      const lo = p === 1 ? n : 0, hi = p === 0 ? 0 : n; // the values X can actually take
      let big, inRange, title, xq = null;
      if (q) { xq = SW.qbinom(k, n, p); prob = xq; label = `smallest x with P(X <= x) >= ${k}`; big = bigQuant(k, xq, true); inRange = (x) => x <= xq; title = `Shaded: P(X ≤ ${xq}) ${showP({ p: SW.pbinom(xq, n, p), posC: xq < hi }).rel}`; }
      else { prob = discProb(v.kind, k, b, tails, (x) => (Number.isInteger(x) && x >= 0 && x <= n ? pmf(x) : 0), lo, hi); label = evText(v.kind, k, b, "ascii"); big = bigProb(v.kind, k, b, prob); inRange = (x) => inEvent(v.kind, x, k, b); title = shadeTitle(v.kind, k, b, prob); }
      const w = discWindow(pmf, tails, lo, hi, n * p, q ? [[xq, "the quantile"]] : [[k, "x1"]].concat(isBetween(v) ? [[b, "x2"]] : []));
      let html = big + table(["Mean", "Variance", "SD"], [[n * p, n * p * (1 - p), Math.sqrt(n * p * (1 - p))]], "Parameters") + table([q ? "Quantile" : "Probability", "Value"], [[label, q ? prob : showP(prob).cell]], q ? "Quantile" : "Probability") + w.offNote;
      html += formula("P(X = k) = C(n, k) p^k (1 minus p)^(n minus k); mean np, SD sqrt(np(1 minus p)). Conditions: binary, independent, fixed n, same p.");
      html += `<details><summary>Full table</summary>${table(["k", "P(X = k)", "P(X <= k)"], w.cells)}${w.notes}</details>`;
      const cd = card("Binomial Distribution", `n = ${n}, p = ${p}`, html);
      // a tick on every whole number only when there are 30 bars or fewer (the other discrete graphs use the same rule)
      plotDiv(cd, [{ x: w.rows.map((r) => r.x), y: w.rows.map((r) => r.p), type: "bar", marker: { color: w.rows.map((r) => (inRange(r.x) ? "#C0392B" : "#3A7CA5")) } }], { title: { text: title, font: { size: 14 } }, xaxis: { title: "x", whole: { from: w.L, to: w.R } }, yaxis: { title: "probability" } });
    });
  }
  function discreteCalc() {
    const hasData = D.rows.length > 0;
    const guess = (re) => numCols().find((c) => re.test(String(c).trim()));
    dialog("distrACTION: Custom (discrete distribution)", [hasData ? sel("mode", "Distribution", [["data", "from an x column and a P(x) column in the data"], ["custom", "typed here: x values and P(x)"]], guess(/^x$/i) && guess(/^p/i) ? "data" : "custom") : null,
      { name: "xs", label: "x values, comma separated", type: "text", value: "", placeholder: "for example 0, 1, 2, 3", list: true, group: "Typed here", vis: (raw) => raw.mode !== "data" }, { name: "ps", label: "P(x) values, comma separated, same order", type: "text", value: "", placeholder: "for example 0.1, 0.3, 0.4, 0.2", list: true, group: "Typed here", vis: (raw) => raw.mode !== "data" },
      hasData ? Object.assign(selNum("xc", "x column"), { value: guess(/^x$/i), group: "Columns", vis: (raw) => raw.mode === "data" }) : null, hasData ? Object.assign(selNum("pc", "P(x) column"), { value: guess(/^p/i), group: "Columns", vis: (raw) => raw.mode === "data" }) : null,
      Object.assign(probKinds(), { group: "Find" }), ...findFields("k", "")], (v) => {
      const list = (s) => String(s).split(",").map((q) => q.trim()).filter((q) => q !== "");
      let xr, pr, from = "custom";
      if (v.mode === "data") { const a = col(v.xc), b = col(v.pc); xr = []; pr = []; a.forEach((q, i) => { if (q !== "" && b[i] !== "") { xr.push(q); pr.push(b[i]); } }); from = src(`${v.xc} with P(x) in ${v.pc}`); }
      else {
        xr = list(v.xs); pr = list(v.ps);
        // still being typed: a blank box is a prompt, and a count or a total that is not right yet is a calm note until the student
        // leaves the box or presses Run (then it is a red message)
        if (!xr.length) throw blankErr(pr.length ? "Now type the x values, comma separated, in the same order as the P(x) values." : "Type the x values and the P(x) values, comma separated, in the same order.");
        if (!pr.length) throw blankErr("Now type the P(x) values, comma separated, in the same order as the x values.");
      }
      const x = xr.map(Number), p = pr.map(Number);
      const sofar = `So far: ${x.length} x value${x.length === 1 ? "" : "s"} and ${p.length} P(x) value${p.length === 1 ? "" : "s"}.`;
      if (x.length !== p.length) throw softErr(`There are ${x.length} x values but ${p.length} P(x) values. Each x needs exactly one probability.`, sofar);
      if (x.length < 2) throw softErr("Enter at least two x values.", sofar);
      if (x.some((q) => !Number.isFinite(q))) throw softErr("Every x value must be a number.", sofar);
      if (p.some((q) => !Number.isFinite(q))) throw softErr("Every P(x) must be a number: type a decimal such as 0.25, not a percent or a fraction.", sofar);
      if (p.some((q) => q < 0 || q > 1)) throw new Error(p.some((q) => q > 1) ? "Every P(x) must be between 0 and 1. If you typed percents, change 25 to 0.25." : "Every P(x) must be between 0 and 1. A probability cannot be negative.");
      if (new Set(x).size !== x.length) throw new Error("Each x value may appear only once. Add the probabilities of repeated values together.");
      const sum = p.reduce((s, q) => s + q, 0);
      if (Math.abs(sum - 1) > 0.01) throw softErr(`The probabilities add to ${fmt(sum)}, not 1. A probability distribution must add to exactly 1. Check for a missing value or a typo.`, `${sofar} The P(x) values so far add to ${fmt(sum)}.`);
      const t = x.map((q, i) => ({ x: q, p: p[i] })).sort((a, b) => a.x - b.x);
      // one convention on the whole card: the P(x) values as typed, the same numbers as the by-hand work table below
      const mu = t.reduce((s, q) => s + q.x * q.p, 0), vr = t.reduce((s, q) => s + (q.x - mu) * (q.x - mu) * q.p, 0), sd = Math.sqrt(vr);
      let cum = 0; const rows = t.map((q) => { cum += q.p; return [q.x, q.p, cum, q.x * q.p, (q.x - mu) * (q.x - mu) * q.p]; });
      let html = Math.abs(sum - 1) > 1e-9 ? warn(`The probabilities add to ${fmt(sum)}, close to 1 but not exactly. That is usually rounding; the results use the values as typed.`) : "";
      let inRange = () => false, title = "";
      if (v.kind === "q") {
        needX1(v.k, v.b, "q"); let c = 0, xq = t[t.length - 1].x; for (const q of t) { c += q.p; if (c >= v.k - 1e-12) { xq = q.x; break; } }
        inRange = (q) => q <= xq; const cq = t.filter((q) => q.x <= xq).reduce((s, q) => s + q.p, 0); title = `Shaded: P(X ≤ ${xq}) ${showP(cq).rel}`;
        html = bigQuant(v.k, xq, true) + html + table(["Mean (expected value)", "Variance", "SD"], [[mu, vr, sd]], "Mean and standard deviation of X") + table(["Quantile", "Value"], [[`smallest x with P(X <= x) >= ${v.k}`, xq]], "Quantile");
      } else if (v.kind !== "none") {
        needX1(v.k, v.b, v.kind);
        inRange = (q) => inEvent(v.kind, q, v.k, v.b);
        const label = evText(v.kind, v.k, v.b, "ascii");
        const hit = t.filter((q) => inRange(q.x)), prob = hit.reduce((s, q) => s + q.p, 0);
        title = shadeTitle(v.kind, v.k, v.b, prob);
        html = bigProb(v.kind, v.k, v.b, prob) + html + table(["Mean (expected value)", "Variance", "SD"], [[mu, vr, sd]], "Mean and standard deviation of X");
        html += table(["Probability", "Value", "Adds P(x) for x ="], [[label, showP(prob).cell, hit.length ? hit.map((q) => q.x).join(", ") : "none"]], "Probability");
        if (v.kind === "eq" && !hit.length) html += say(`${v.k} is not one of the x values, so its probability is 0.`);
      } else { title = allTitle(mu, sd); html = bigMeanSD(mu, sd) + html + table(["Mean (expected value)", "Variance", "SD"], [[mu, vr, sd]], "Mean and standard deviation of X"); }
      html += table(["x", "P(x)", "P(X <= x)", "x P(x)", "(x minus mean)^2 P(x)"], rows.concat([["Total", sum, "", mu, vr]]), "Work table (by hand method)");
      html += formula("Mean = sum of x P(x). Variance = sum of (x minus mean)^2 P(x). SD = square root of the variance. Each P(x) is between 0 and 1 and they add to 1.");
      html += say(`Over many repetitions, X averages about ${fmt(mu, 3)}, and a typical value is about ${fmt(sd, 3)} away from that mean.`);
      const cd = card("Custom Discrete Distribution", from === "custom" ? `x = ${t.map((q) => q.x).join(", ")}` : from, html);
      plotDiv(cd, [{ x: t.map((q) => q.x), y: t.map((q) => q.p), type: "bar", marker: { color: t.map((q) => (inRange(q.x) ? "#C0392B" : "#3A7CA5")) }, showlegend: false }], { title: title ? { text: title, font: { size: 14 } } : undefined, xaxis: { title: "x", type: "linear", whole: t.every((q) => Number.isInteger(q.x)) ? { from: t[0].x, to: t[t.length - 1].x } : undefined }, yaxis: { title: "P(x)", rangemode: "tozero" }, shapes: [{ type: "line", x0: mu, x1: mu, yref: "paper", y0: 0, y1: 1, line: { color: "#1A3A4D", dash: "dash" } }], annotations: [{ x: mu, yref: "paper", y: 1.06, text: `mean ${fmt(mu, 3)}`, showarrow: false }] });
    });
  }
  // shared output for a discrete distribution given its pmf on whole numbers from lo to hi (hi may be Infinity)
  const probKinds = () => sel("kind", "Compute probability", [["none", "none, just the mean and SD"]].concat(D_OPTS), "none");
  const x1x2 = () => findFields("k", "");
  function discreteOut(title, meta, pmf, lo, hi, mu, vr, v, note, opt = {}) {
    // opt.mode: the peak of the pmf (each tail is added up from its own end); opt.tails: exact closed forms when there are some
    const tails = opt.tails || SW.discreteTails(pmf, lo, hi, opt.mode == null ? Math.floor(mu) : opt.mode);
    const pmfIn = (x) => (Number.isInteger(x) && x >= lo && x <= hi ? pmf(x) : 0);
    let html = table(["Mean (expected value)", "Variance", "SD"], [[mu, vr, Math.sqrt(vr)]], "Mean and standard deviation of X");
    let inRange = () => false, ptitle = "", xq = null;
    if (v.kind === "q") {
      needX1(v.k, v.b, "q"); xq = SW.discreteQuantile(v.k, tails.cdf, lo, hi);
      if (!Number.isFinite(xq)) throw new Error("This quantile could not be worked out for these inputs. Check the parameters.");
      inRange = (x) => x <= xq; ptitle = `Shaded: P(X ≤ ${xq}) ${showP({ p: tails.cdf(xq), c: tails.sf(xq), posC: xq < hi }).rel}`;
      html = bigQuant(v.k, xq, true) + html + table(["Quantile", "Value"], [[`smallest x with P(X <= x) >= ${v.k}`, xq]], "Quantile");
    } else if (v.kind !== "none") {
      const k = v.k, b = v.b; needX1(k, b, v.kind);
      const prob = discProb(v.kind, k, b, tails, pmfIn, lo, hi);
      inRange = (x) => inEvent(v.kind, x, k, b); ptitle = shadeTitle(v.kind, k, b, prob);
      html = bigProb(v.kind, k, b, prob) + html + table(["Probability", "Value"], [[evText(v.kind, k, b, "ascii"), showP(prob).cell]], "Probability");
      if (v.kind === "eq" && !(Number.isInteger(k) && k >= lo && k <= hi)) html += say(`${k} is not a possible value of X, so its probability is 0.`);
    } else { ptitle = allTitle(mu, Math.sqrt(vr)); html = bigMeanSD(mu, Math.sqrt(vr)) + html; }
    // table and graph: where the probability is (not just the first 200 values from the low end), taking in x1, x2 or the quantile
    const w = discWindow(pmf, tails, lo, hi, mu, v.kind === "q" ? [[xq, "the quantile"]] : v.kind === "none" ? [] : [[v.k, "x1"]].concat(isBetween(v) ? [[v.b, "x2"]] : []));
    html += w.offNote;
    if (note) html += note;
    html += `<details><summary>Full table</summary>${table(["x", "P(X = x)", "P(X <= x)"], w.cells)}${w.notes}</details>`;
    const cd = card(title, meta, html);
    plotDiv(cd, [{ x: w.rows.map((q) => q.x), y: w.rows.map((q) => q.p), type: "bar", marker: { color: w.rows.map((q) => (inRange(q.x) ? "#C0392B" : "#3A7CA5")) }, showlegend: false }], { title: ptitle ? { text: ptitle, font: { size: 14 } } : undefined, xaxis: { title: "x", whole: { from: w.L, to: w.R } }, yaxis: { title: "P(X = x)", rangemode: "tozero" }, shapes: [{ type: "line", x0: mu, x1: mu, yref: "paper", y0: 0, y1: 1, line: { color: "#1A3A4D", dash: "dash" } }], annotations: [{ x: mu, yref: "paper", y: 1.06, text: `mean ${fmt(mu, 3)}`, showarrow: false }] });
  }
  const lfact = (n) => jStat.gammaln(n + 1), lch = (n, k) => lfact(n) - lfact(k) - lfact(n - k);
  function poissonCalc() {
    dialog("distrACTION: Poisson Distribution", [{ name: "lam", label: "Mean number of events, lambda (mu)", type: "number", value: 3, group: "Parameters" }, Object.assign(probKinds(), { group: "Find" }), ...x1x2()], (v) => {
      const l = v.lam; if (!(l > 0)) throw new Error("Lambda must be a positive number: the average count per interval.");
      discreteOut("Poisson Distribution", `lambda = ${l}`, (x) => Math.exp(-l + x * Math.log(l) - lfact(x)), 0, Infinity, l, l, v,
        formula("P(X = x) = e^(minus lambda) lambda^x / x!; mean lambda, SD sqrt(lambda). Use for counts of events in a fixed interval when events happen independently at a steady rate."), { mode: Math.floor(l) });
    });
  }
  function geometricCalc() {
    dialog("distrACTION: Geometric Distribution", [{ name: "p", label: "Probability of success on each trial", type: "number", value: 0.2, group: "Parameters" }, Object.assign(sel("form", "X counts", [["trials", "trials up to and including the first success (1, 2, 3, ...)"], ["fails", "failures before the first success (0, 1, 2, ...)"]], "trials"), { group: "Parameters" }), Object.assign(probKinds(), { group: "Find" }), ...x1x2()], (v) => {
      const p = v.p; if (!(p > 0 && p <= 1)) throw new Error("Probability of success must be above 0 and at most 1: type a decimal such as 0.2, not a percent.");
      const tr = v.form === "trials", lo = tr ? 1 : 0, l1p = Math.log1p(-p); // P(X > c) = (1 minus p)^(c minus lo + 1), worked out in logs
      const tails = { cdf: (c) => { const m = Math.floor(c) - lo + 1; return m <= 0 ? 0 : -Math.expm1(m * l1p); }, sf: (c) => { const m = Math.floor(c) - lo + 1; return m <= 0 ? 1 : Math.exp(m * l1p); } };
      discreteOut("Geometric Distribution", `p = ${p}, X = ${tr ? "trials until the first success" : "failures before the first success"}`, (x) => (p === 1 ? (x === lo ? 1 : 0) : Math.exp((x - lo) * Math.log(1 - p)) * p), lo, p === 1 ? lo : Infinity, tr ? 1 / p : (1 - p) / p, (1 - p) / (p * p), v,
        formula(tr ? "P(X = x) = (1 minus p)^(x minus 1) p for x = 1, 2, 3, ...; mean 1/p, SD sqrt(1 minus p)/p." : "P(X = x) = (1 minus p)^x p for x = 0, 1, 2, ...; mean (1 minus p)/p, SD sqrt(1 minus p)/p."), { tails });
    });
  }
  function hyperCalc() {
    dialog("distrACTION: Hypergeometric Distribution", [{ name: "N", label: "Population size N", type: "number", value: 50, group: "Parameters" }, { name: "K", label: "Successes in the population", type: "number", value: 10, group: "Parameters" }, { name: "n", label: "Sample size n (drawn without replacement)", type: "number", value: 5, group: "Parameters" }, Object.assign(probKinds(), { group: "Find" }), ...x1x2()], (v) => {
      const { N, K, n } = v; const whole = (q) => Number.isInteger(q) && q >= 0;
      if (!whole(N) || !whole(K) || !whole(n) || N < 1) throw new Error("N, the number of successes and n must be whole numbers.");
      if (K > N || n > N) throw new Error("The successes and the sample size cannot be larger than the population.");
      const lo = Math.max(0, n - (N - K)), hi = Math.min(n, K), q = K / N;
      discreteOut("Hypergeometric Distribution", `N = ${N}, successes = ${K}, n = ${n}`, (x) => (x < lo || x > hi ? 0 : Math.exp(lch(K, x) + lch(N - K, n - x) - lch(N, n))), lo, hi, n * q, N > 1 ? n * q * (1 - q) * (N - n) / (N - 1) : 0, v,
        formula("P(X = x) = C(K, x) C(N minus K, n minus x) / C(N, n); mean n K/N; variance n (K/N)(1 minus K/N)(N minus n)/(N minus 1). Like the binomial, but sampling without replacement, so p changes from draw to draw."), { mode: Math.min(hi, Math.max(lo, Math.floor(((n + 1) * (K + 1)) / (N + 2)))) });
    });
  }
  function dunifCalc() {
    dialog("distrACTION: Discrete Uniform Distribution", [{ name: "a", label: "Smallest value (whole number)", type: "number", value: 1, group: "Parameters" }, { name: "c", label: "Largest value (whole number)", type: "number", value: 6, group: "Parameters" }, Object.assign(probKinds(), { group: "Find" }), ...x1x2()], (v) => {
      const a = v.a, c = v.c; if (!Number.isInteger(a) || !Number.isInteger(c) || c <= a) throw new Error("Type two whole numbers with the largest above the smallest (a fair die: 1 and 6).");
      if (c - a > 5000) throw new Error("Keep the range to 5000 values or fewer.");
      const m = c - a + 1, cdfU = (x) => { const k = Math.floor(x); return k < a ? 0 : k >= c ? 1 : (k - a + 1) / m; };
      discreteOut("Discrete Uniform Distribution", `whole numbers ${a} to ${c}`, () => 1 / m, a, c, (a + c) / 2, (m * m - 1) / 12, v,
        formula("Every whole number from a to b is equally likely: P(X = x) = 1/(b minus a + 1); mean (a + b)/2; variance ((b minus a + 1)^2 minus 1)/12."), { tails: { cdf: cdfU, sf: (x) => 1 - cdfU(x) } });
    });
  }
  // continuous distributions: one event engine for normal, uniform, exponential, t, chi-square and F
  // sf(x) = P(X > x) worked out from its own side when the caller has it (normal, t, exponential), so a tiny upper tail is
  // not 1 minus 0.99999...; sup = [lowest, highest] value X can take, so a probability above 0 never shows as a bare 0
  function contEvent(v, cdf, quant, sf, sup) {
    const kind = kOf(v.kind), up = sf || ((x) => 1 - cdf(x)), [sLo, sHi] = sup || [-Infinity, Infinity];
    if (!Number.isFinite(v.a)) throw blankErr(kind === "q" ? "Type the cumulative probability p in x1, a decimal such as 0.90." : "Type a value for x1.");
    if (kind === "q" && !(v.a > 0 && v.a < 1)) throw new Error("For a quantile, x1 holds the cumulative probability p: type a decimal between 0 and 1 such as 0.90.");
    if (/between/.test(kind) && !Number.isFinite(v.b)) throw blankErr("Type a value for x2.");
    if (/between/.test(kind) && !(v.b >= v.a)) throw new Error("x2 must be at least x1.");
    let res, comp = 1, label, lo = -Infinity, hi = Infinity;
    if (kind === "le" || kind === "lt") { res = cdf(v.a); comp = up(v.a); label = evText(kind, v.a, v.b, "ascii"); hi = v.a; }
    else if (kind === "ge" || kind === "gt") { res = up(v.a); comp = cdf(v.a); label = evText(kind, v.a, v.b, "ascii"); lo = v.a; }
    else if (kind === "between" || kind === "betweenS") { const below = cdf(v.a), above = up(v.b); res = below > 0.5 ? up(v.a) - above : above > 0.5 ? cdf(v.b) - below : 1 - below - above; comp = below + above; label = evText(kind, v.a, v.b, "ascii"); lo = v.a; hi = v.b; }
    else if (kind === "eq") { res = 0; label = `P(X = ${v.a})`; lo = v.a; hi = v.a; }
    else { res = quant(v.a); label = `x at cumulative probability ${v.a}`; hi = res; }
    const q = kind === "q";
    if (!Number.isFinite(res) && !q) throw new Error("This probability could not be worked out for these inputs. Check the parameters.");
    if (!q) res = Math.max(0, Math.min(1, res));
    const oLo = Math.max(lo, sLo), oHi = Math.min(hi, sHi), r = q ? res : { p: res, c: Math.max(0, Math.min(1, comp)), pos: oHi > oLo, posC: kind === "eq" || oLo > sLo || oHi < sHi };
    return { kind, q, res, r, cell: q ? res : showP(r).cell, label, lo, hi, big: q ? bigQuant(v.a, res, false) : bigProb(kind, v.a, v.b, r), note: q ? "" : CONT_NOTE, title: q ? `Shaded: P(X ≤ ${fmt(res)}) = ${v.a}` : shadeTitle(kind, v.a, v.b, r) };
  }
  function shadedCurve(cd, xs0, pdf, e, extra) {
    const xs = xs0.slice(); [e.lo, e.hi].forEach((x) => { if (x > xs[0] && x < xs[xs.length - 1]) xs.push(x, x); }); xs.sort((p, q) => p - q);
    const ys = xs.map(pdf), inS = (x) => x >= e.lo && x <= e.hi;
    const shapes = e.kind === "eq" ? [{ type: "line", x0: e.lo, x1: e.lo, yref: "paper", y0: 0, y1: 1, line: { color: "#C0392B", width: 2, dash: "dot" } }] : [];
    plotDiv(cd, [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D", shape: "linear" }, showlegend: false }, { x: xs.filter(inS), y: ys.filter((_, i) => inS(xs[i])), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false }], Object.assign({ title: { text: e.title, font: { size: 14 } }, xaxis: { title: "x" }, yaxis: { title: "density", rangemode: "tozero" }, shapes }, extra || {}));
  }
  function contOut(title, meta, pdf, cdf, quant, mu, sd, xmin, xmax, v, note, sf, sup) {
    const e = contEvent(v, cdf, quant, sf, sup);
    const html = e.big + table(["Mean", "SD"], [[mu, sd]], "Mean and standard deviation of X") + table([e.q ? "Quantile" : "Probability", "Value"], [[e.label, e.cell]], e.q ? "Quantile" : "Probability") + e.note + note;
    const cd = card(title, meta, html);
    const xs = []; for (let i = 0; i <= 300; i++) xs.push(xmin + (xmax - xmin) * i / 300);
    shadedCurve(cd, xs, pdf, e);
  }
  const contKinds = () => sel("kind", "Compute", CONT_OPTS, "below");
  const a1b2 = () => [{ name: "a", label: "x1 (or p for a quantile)", type: "number", value: "", group: "Find" }, { name: "b", label: "x2", type: "number", value: "", group: "Find", vis: isBetween }];
  function unifCalc() {
    dialog("distrACTION: Uniform Distribution (continuous)", [{ name: "lo", label: "Minimum a", type: "number", value: 0, group: "Parameters" }, { name: "hi", label: "Maximum b", type: "number", value: 10, group: "Parameters" }, Object.assign(contKinds(), { group: "Find" }), ...a1b2()], (v) => {
      const a = v.lo, b = v.hi; if (!(Number.isFinite(a) && b > a)) throw new Error("The maximum must be larger than the minimum.");
      const cdf = (x) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)), w = b - a;
      contOut("Uniform Distribution", `a = ${a}, b = ${b}`, (x) => (x < a || x > b ? 0 : 1 / w), cdf, (p) => a + p * w, (a + b) / 2, w / Math.sqrt(12), a - 0.15 * w, b + 0.15 * w, v,
        formula("Density 1/(b minus a) between a and b, so a probability is a rectangle: (length of the interval) / (b minus a). Mean (a + b)/2, SD (b minus a)/sqrt(12)."), null, [a, b]);
    });
  }
  function expCalc() {
    dialog("distrACTION: Exponential Distribution", [{ name: "m", label: "Mean (average time between events)", type: "number", value: 5, group: "Parameters", hint: "If you are given a rate lambda, the mean is 1/lambda." }, Object.assign(contKinds(), { group: "Find" }), ...a1b2()], (v) => {
      const m = v.m; if (!(m > 0)) throw new Error("The mean must be a positive number.");
      const r = 1 / m, cdf = (x) => (x <= 0 ? 0 : 1 - Math.exp(-r * x));
      contOut("Exponential Distribution", `mean = ${m}, rate lambda = ${fmt(r)}`, (x) => (x < 0 ? 0 : r * Math.exp(-r * x)), cdf, (p) => -Math.log(1 - p) * m, m, m, 0, Math.max(m * 6, Number.isFinite(v.b) ? v.b * 1.1 : 0, kOf(v.kind) !== "q" && Number.isFinite(v.a) ? v.a * 1.1 : 0), v,
        formula("Density lambda e^(minus lambda x) for x at least 0, with lambda = 1/mean. P(X <= x) = 1 minus e^(minus x/mean). Mean and SD are both equal to the mean. Memoryless: the wait so far does not change the wait still to come."), (x) => (x <= 0 ? 1 : Math.exp(-r * x)), [0, Infinity]);
    });
  }
  function normalCalc() {
    dialog("distrACTION: Normal Distribution", [{ name: "mu", label: "Mean", type: "number", value: 0, group: "Parameters" }, { name: "sd", label: "SD", type: "number", value: 1, group: "Parameters" },
      Object.assign(contKinds(), { group: "Find" }), { name: "a", label: "x1 (or p for a quantile)", type: "number", value: 1, group: "Find" }, { name: "b", label: "x2", type: "number", value: "", group: "Find", vis: isBetween }], (v) => {
      if (!(v.sd > 0)) throw new Error("SD must be a positive number.");
      const z = (x) => (x - v.mu) / v.sd;
      const e = contEvent(v, (x) => SW.pnormLow(z(x)), (p) => v.mu + SW.qnorm(p) * v.sd, (x) => SW.pnormLow(-z(x))); // each tail from its own side
      const two = /between/.test(e.kind); // a between event standardizes both ends
      let html = e.big + table(["Mean", "SD"].concat(e.q ? ["z*"] : two ? ["z for x1", "z for x2"] : ["z"], [e.label]), [[v.mu, v.sd].concat(e.q ? [SW.qnorm(v.a)] : two ? [z(v.a), z(v.b)] : [z(v.a)], [e.cell])], e.q ? "Quantile" : "Probability");
      html += formula("z = (x minus mu) / sigma. Empirical rule: 68 percent within 1 SD, 95 within 2, 99.7 within 3.") + e.note;
      const cd = card("Normal Distribution", `mean ${v.mu}, SD ${v.sd}`, html);
      const xs = []; for (let x = v.mu - 4 * v.sd; x <= v.mu + 4 * v.sd; x += (8 * v.sd) / 200) xs.push(x);
      shadedCurve(cd, xs, (x) => jStat.normal.pdf(x, v.mu, v.sd), e, { yaxis: { visible: false } });
    });
  }
  function tCalc() {
    const notT = (raw) => raw.kind !== "tstar" && raw.kind !== "p";
    dialog("distrACTION: T-Distribution", [{ name: "df", label: "df", type: "number", value: 20, group: "Parameters" }, Object.assign(sel("kind", "Compute", [["tstar", "quantile t* for a confidence level"], ["p", "p-value for a t statistic"]].concat(CONT_OPTS), "tstar"), { group: "Find" }),
      { name: "conf", label: "Confidence level (proportion)", type: "number", value: 0.95, group: "Find", vis: (raw) => raw.kind === "tstar" }, { name: "t", label: "t statistic", type: "number", value: 2, group: "Find", vis: (raw) => raw.kind === "p" }, Object.assign(sel("alt", "Tail", [["two", "two-sided"], ["greater", "upper tail"], ["less", "lower tail"]], "two"), { group: "Find", vis: (raw) => raw.kind === "p" }),
      { name: "a", label: "x1 (or p for a quantile)", type: "number", value: "", group: "Find", vis: notT }, { name: "b", label: "x2", type: "number", value: "", group: "Find", vis: isBetween }], (v) => {
      let html;
      if (!(v.df > 0)) throw new Error("df must be a positive number.");
      if (v.kind === "tstar" && !(v.conf > 0 && v.conf < 1)) throw new Error("Type the confidence level as a decimal between 0 and 1, such as 0.95.");
      if (v.kind === "p" && !Number.isFinite(v.t)) throw new Error("Type a value for the t statistic.");
      let ts = NaN, p = NaN;
      if (v.kind === "tstar") { ts = SW.qt(1 - (1 - v.conf) / 2, v.df); const pc = Number((v.conf * 100).toFixed(2)); html = `<div class="big">t* = ${fmt(ts)} <span class="pct">for ${pc}% confidence</span></div><div class="words">The middle ${pc}% of the t distribution with df = ${fmt(v.df)} lies between ${fmt(-ts)} and ${fmt(ts)}.</div>` + table(["df", "Confidence", "t*"], [[v.df, v.conf, ts]], "Quantile") + say(`Use t* in x bar plus or minus t* s / sqrt(n). For comparison z* would be ${fmt(SW.qnorm(1 - (1 - v.conf) / 2))}; t* is larger because s replaces sigma.`); }
      else if (v.kind === "p") { p = SW.pvalue(v.t, v.alt, (x) => SW.pt(x, v.df)); const fp = SW.fmtP(p), tail = { two: "two-sided", greater: "upper tail", less: "lower tail" }[v.alt]; html = `<div class="big">p ${/^</.test(fp) ? esc(fp) : "= " + fp} <span class="pct">${tail}, ${pctTxt(p)}</span></div><div class="words">The p-value: the probability, when H0 is true, of a t statistic ${v.alt === "less" ? `at most ${fmt(v.t)}` : v.alt === "greater" ? `at least ${fmt(v.t)}` : `at least ${fmt(Math.abs(v.t))} away from 0 in either direction`} (df = ${fmt(v.df)}).</div>` + table(["df", "t", "Tail", "p"], [[v.df, v.t, v.alt, fp]], "Probability"); }
      else {
        const df = v.df, lim = Math.max(4, Number.isFinite(v.a) && kOf(v.kind) !== "q" ? Math.abs(v.a) + 1 : 0, Number.isFinite(v.b) ? Math.abs(v.b) + 1 : 0);
        contOut("T-Distribution", `df = ${df}`, (x) => jStat.studentt.pdf(x, df), (x) => SW.pt(x, df), (p) => SW.qt(p, df), df > 1 ? 0 : "undefined when df is 1 or less", df > 2 ? Math.sqrt(df / (df - 2)) : "infinite or undefined when df is 2 or less", -lim, lim, v,
          formula("t has mean 0 and SD sqrt(df / (df minus 2)); it is wider than the standard normal and approaches it as df grows."), (x) => SW.pt(-x, df));
        return;
      }
      const cd = card("T-Distribution", `df = ${v.df}`, html);
      if (v.kind === "p") { const fp = SW.fmtP(p); tPlot(cd, v.t, v.df, v.alt, `Shaded: p-value ${/^</.test(fp) ? fp : "= " + fp} (${{ two: "two-sided", greater: "upper tail", less: "lower tail" }[v.alt]})`); }
      else { const lim = Math.max(4, ts + 1), xs = []; for (let i = 0; i <= 300; i++) xs.push(-lim + (2 * lim * i) / 300); shadedCurve(cd, xs, (x) => jStat.studentt.pdf(x, v.df), { kind: "between", lo: -ts, hi: ts, title: `Shaded: the middle ${Number((v.conf * 100).toFixed(2))}%, from ${fmt(-ts)} to ${fmt(ts)}` }, { xaxis: { title: "t" }, yaxis: { visible: false } }); }
    });
  }
  function chiFCalc() {
    const isC = (raw) => /^c_/.test(raw.kind || "");
    dialog("distrACTION: Chi-square and F Distributions", [Object.assign(sel("dist", "Distribution", [["chi", "Chi-square"], ["F", "F"]], "chi"), { group: "Parameters" }), { name: "df1", label: "df (or df1 for F)", type: "number", value: 3, group: "Parameters" }, { name: "df2", label: "df2 (F only)", type: "number", value: 36, group: "Parameters", vis: (raw) => raw.dist !== "chi" },
      Object.assign(sel("kind", "Compute", [["p", "p-value (upper tail) for a statistic"], ["q", "critical value for alpha"]].concat(CONT_OPTS.map(([k, l]) => ["c_" + k, l])), "p"), { group: "Find" }), { name: "x", label: "Statistic", type: "number", value: 5.2, group: "Find", vis: (raw) => raw.kind === "p" }, { name: "alpha", label: "alpha", type: "number", value: 0.05, group: "Find", vis: (raw) => raw.kind === "q" },
      { name: "a", label: "x1 (or p for a quantile)", type: "number", value: "", group: "Find", vis: isC }, { name: "b", label: "x2", type: "number", value: "", group: "Find", vis: isBetween }], (v) => {
      let html; const chi = v.dist === "chi";
      if (!(v.df1 > 0) || (!chi && !(v.df2 > 0))) throw new Error("Degrees of freedom must be positive numbers.");
      if (/^c_/.test(v.kind)) {
        const d1 = v.df1, d2 = v.df2, w = Object.assign({}, v, { kind: v.kind.slice(2) });
        const cdf = chi ? (x) => (x <= 0 ? 0 : SW.pchisq(x, d1)) : (x) => (x <= 0 ? 0 : SW.pf(x, d1, d2)), quant = chi ? (p) => SW.qchisq(p, d1) : (p) => SW.qf(p, d1, d2);
        const pdf = chi ? (x) => (x <= 0 ? 0 : jStat.chisquare.pdf(x, d1)) : (x) => (x <= 0 ? 0 : jStat.centralF.pdf(x, d1, d2));
        const mu = chi ? d1 : d2 > 2 ? d2 / (d2 - 2) : "undefined when df2 is 2 or less", sd = chi ? Math.sqrt(2 * d1) : d2 > 4 ? Math.sqrt((2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) * (d2 - 2) * (d2 - 4))) : "undefined when df2 is 4 or less";
        const qk = kOf(w.kind) === "q";
        let lim = Math.max(chi ? d1 * 3 : 5, 5, !qk && Number.isFinite(w.a) ? w.a * 1.3 : 0, Number.isFinite(w.b) ? w.b * 1.3 : 0); if (qk && w.a > 0 && w.a < 1) lim = Math.max(lim, quant(w.a) * 1.2);
        contOut(chi ? "Chi-square Distribution" : "F Distribution", chi ? `df = ${d1}` : `df1 = ${d1}, df2 = ${d2}`, pdf, cdf, quant, mu, sd, d1 < 2 ? lim / 300 : 0, lim, w,
          formula(chi ? "Chi-square with df degrees of freedom: mean df, SD sqrt(2 df), right-skewed, never negative." : "F with df1 and df2: never negative, right-skewed; mean df2 / (df2 minus 2) when df2 is above 2."), chi ? (x) => SW.pchisqUpper(x, d1) : (x) => SW.pfUpper(x, d1, d2), [0, Infinity]);
        return;
      }
      if (v.kind === "p" && !(Number.isFinite(v.x) && v.x >= 0)) throw new Error(`Type the ${chi ? "chi-square" : "F"} statistic, a number 0 or more.`);
      if (v.kind === "q" && !(v.alpha > 0 && v.alpha < 1)) throw new Error("alpha must be between 0 and 1, for example 0.05.");
      const nm = chi ? "chi-square" : "F", dfTxt = chi ? `df = ${v.df1}` : `df1 = ${v.df1}, df2 = ${v.df2}`; let cut;
      // the upper tail from its own side, so a huge statistic gives "< 0.0001" with its size in words, never a bare 0
      const pr = v.kind === "p" ? { p: chi ? SW.pchisqUpper(v.x, v.df1) : SW.pfUpper(v.x, v.df1, v.df2), c: chi ? SW.pchisq(v.x, v.df1) : SW.pf(v.x, v.df1, v.df2), pos: true, posC: v.x > 0 } : null;
      if (v.kind === "p") { const p = pr.p, d = showP(pr); cut = v.x; html = `<div class="big"><span class="ev">P(X &ge; ${fmt(v.x)})</span> ${esc(d.rel)} <span class="pct">${d.pct}</span></div><div class="words">The upper-tail p-value: the probability that ${chi ? "a chi-square" : "an F"} variable with ${dfTxt} is at least ${fmt(v.x)}.${d.note ? " " + d.note : ""}</div>` + table([chi ? "chi-square" : "F", chi ? "df" : "df1, df2", "p (upper tail)"], [[v.x, chi ? v.df1 : `${v.df1}, ${v.df2}`, SW.fmtP(p)]], "Probability"); }
      else { const q = chi ? SW.qchisq(1 - v.alpha, v.df1) : SW.qf(1 - v.alpha, v.df1, v.df2); if (!(Number.isFinite(q) && q > 0)) throw new Error("No critical value for this alpha and df. Try alpha 0.05 or 0.01."); cut = q; html = `<div class="big">critical value = ${fmt(q)} <span class="pct">for alpha = ${v.alpha}</span></div><div class="words">The ${nm} value with area ${v.alpha} to its right (${dfTxt}): P(X &ge; ${fmt(q)}) = ${v.alpha}.</div>` + table(["alpha", chi ? "df" : "df1, df2", "critical value"], [[v.alpha, chi ? v.df1 : `${v.df1}, ${v.df2}`, q]], "Quantile") + say("This course decides with the p-value; the critical value is here only for checking a table."); }
      const cd = card(chi ? "Chi-square Distribution" : "F Distribution", dfTxt, html);
      const xs = [], lim = chi ? Math.max(cut * 1.5, v.df1 * 3, 5) : Math.max(cut * 1.5, 5); for (let x = 0.01; x <= lim; x += lim / 200) xs.push(x);
      const ys = xs.map((x) => (chi ? jStat.chisquare.pdf(x, v.df1) : jStat.centralF.pdf(x, v.df1, v.df2)));
      const ttl = v.kind === "p" ? shadeTitle("ge", fmt(v.x), null, pr) : `Shaded: the upper ${Number((v.alpha * 100).toFixed(2))}%, beyond ${fmt(cut)}`;
      plotDiv(cd, [{ x: xs, y: ys, type: "scatter", mode: "lines", line: { color: "#1A3A4D" }, showlegend: false }, { x: xs.filter((x) => x >= cut), y: ys.filter((_, i) => xs[i] >= cut), fill: "tozeroy", type: "scatter", mode: "lines", line: { color: "#C0392B" }, fillcolor: "rgba(192,57,43,.35)", showlegend: false }], { title: { text: ttl, font: { size: 14 } }, xaxis: { title: nm }, yaxis: { visible: false } }, 240);
    });
  }
  function sampleSizeCalc() {
    dialog("Sample size for a margin of error", [sel("kind", "For a", [["prop", "proportion"], ["mean", "mean"]], "prop"), { name: "me", label: "Desired margin of error", type: "number", value: 0.05 }, { name: "p", label: "Guess for p (0.5 if unknown)", type: "number", value: 0.5, vis: (raw) => raw.kind !== "mean" }, { name: "s", label: "Guess for s (for a mean)", type: "number", value: "", vis: (raw) => raw.kind === "mean" }, confField], (v) => {
      if (!(v.me > 0)) throw new Error("Type a margin of error greater than 0.");
      if (v.kind === "mean" && !(v.s > 0)) throw new Error("Type a guess for s, a positive number (from a pilot study or an earlier class).");
      if (v.kind !== "mean" && !(v.p >= 0 && v.p <= 1)) throw new Error("The guess for p is between 0 and 1 (use 0.5 if unknown).");
      if (!(+v.conf > 0 && +v.conf < 1)) throw new Error("Choose a confidence level.");
      const n = v.kind === "prop" ? SW.sampleSizeProp(v.me, v.p, +v.conf) : SW.sampleSizeMean(v.me, v.s, +v.conf);
      card("Sample size", `${v.kind === "prop" ? "proportion" : "mean"}, margin ${v.me}, ${Math.round(+v.conf * 100)} percent`, `<div class="big">N = ${fmt(n)} <span class="pct">needed</span></div><div class="words">A sample of ${fmt(n)} keeps the margin of error for a ${v.kind === "prop" ? "proportion" : "mean"} at ${v.me} or less, at ${Math.round(+v.conf * 100)} percent confidence. Always round up.</div>` + table(["Needed N"], [[n]]) + formula(v.kind === "prop" ? "N = (z* / m)^2 p (1 minus p), rounded up" : "N = (z* s / m)^2, rounded up (z* as a planning value)") + say("Halving the margin needs four times the sample."));
    });
  }

  // ================= Learn: sampling distribution simulator =================
  function samplingSim() {
    const hasData = D.rows.length > 0;
    // When the population is a column, say why a choice cannot be used, once, under the box it is about, so no plot is ever
    // drawn from empty values (which drew NaN before): under Column, a mean or median of a column with no numbers; under
    // Success level (shown only for a sample proportion), a blank or mistyped level.
    const simColProblem = (raw) => {
      if (raw.pop !== "col") return "";
      if (!raw.x) return "Choose a column to use as the population, or pick one of the made-up populations above.";
      if (raw.stat === "prop") return "";
      if (SW.num(col(raw.x).filter((q) => q !== "")).length < 2) return `${raw.x} has no numbers to average, so it cannot be a population for a mean or median. Choose a numeric column, or set the statistic to a sample proportion.`;
      return "";
    };
    const simSuccProblem = levelCheck("x", "the success level for a proportion", (raw) => raw.pop === "col" && raw.stat === "prop");
    dialog("Learn: Sampling distribution simulator", [
      sel("pop", "Population", (hasData ? [["col", "a column in the data (treated as the population)"]] : []).concat([["normal", "normal, mean 50, SD 10"], ["skew", "right-skewed (exponential, mean 8)"], ["uniform", "uniform 0 to 100"], ["prop", "yes or no, with a given p"]]), hasData ? "col" : "skew"),
      hasData ? Object.assign(selAny("x", "Column (numeric for means, categorical for proportions)", false), { check: simColProblem }) : null, hasData ? { name: "succ", label: "Success level (for a proportion)", type: "text", check: simSuccProblem, vis: (raw) => raw.stat === "prop" } : null,
      { name: "p", label: "p for the yes or no population", type: "number", value: 0.3 },
      { name: "n", label: "Sample size n", type: "number", value: 30 }, { name: "reps", label: "Number of samples", type: "number", value: 2000 }, sel("stat", "Statistic", [["mean", "sample mean"], ["prop", "sample proportion"], ["median", "sample median"]], "mean")], (v) => {
      const cp = simColProblem(v); if (cp) throw fieldErr("x", cp);
      const sp = simSuccProblem(v, true); if (sp) throw fieldErr("succ", sp);
      let pop, popLabel;
      if (v.pop === "col") { if (v.stat === "prop") { const vals = col(v.x).filter((q) => q !== ""); pop = vals.map((q) => (q === v.succ.trim() ? 1 : 0)); popLabel = `${v.x} = ${v.succ.trim()} (p = ${fmt(SW.mean(pop), 3)})`; } else { pop = SW.num(col(v.x)); popLabel = v.x; } }
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
  // ---- Learn applets: click to add a point, click a point to remove it ----
  function clickPlot(cd, h, onAdd, onRemove) {
    const p = document.createElement("div"); p.className = "plot"; p.style.height = h + "px"; p.style.cursor = "crosshair"; p.setAttribute("role", "img"); cd.appendChild(p);
    let hit = 0;
    const draw = (traces, layout) => Plotly.react(p, traces, Object.assign({ margin: { t: 30, l: 50, r: 20, b: 45 }, font: { family: "Segoe UI, Arial", size: 12 }, paper_bgcolor: "#fff", plot_bgcolor: "#fff", dragmode: false, hovermode: "closest" }, layout), { displaylogo: false, responsive: true, displayModeBar: false });
    p.addEventListener("click", (e) => { setTimeout(() => { if (Date.now() - hit < 300) return; const L = p._fullLayout; if (!L) return; const bb = p.getBoundingClientRect(), xa = L.xaxis, ya = L.yaxis; const px = e.clientX - bb.left - xa._offset, py = e.clientY - bb.top - ya._offset; if (px < 0 || py < 0 || px > xa._length || py > ya._length) return; onAdd(xa.p2l(px), ya.p2l(py)); }, 40); });
    const wire = () => { if (p.on && !p._wired) { p._wired = true; p.on("plotly_click", (ev) => { const pt = ev.points && ev.points[0]; if (pt && pt.curveNumber === 0) { hit = Date.now(); onRemove(pt.pointIndex); } }); } };
    const render = (traces, layout) => { draw(traces, layout); wire(); }; render.el = p; // render.el: the plot, to name it for a screen reader
    return render;
  }
  const btns = (list) => `<div class="applet-btns">${list.map(([id, t]) => `<button type="button" data-a="${id}">${esc(t)}</button>`).join("")}</div>`;
  // the same job as a click or a tap on the plot, by typing: number boxes, an Add button and a Remove the last one button
  const addRow = (fields, addLabel, undoLabel) => `<div class="applet-row">${fields.map(([k, l, lo, hi]) => `<label>${esc(l)}<input type="number" step="any" min="${lo}" max="${hi}" data-f="${k}"></label>`).join("")}<button type="button" data-a="add">${esc(addLabel)}</button><button type="button" data-a="undo">${esc(undoLabel)}</button></div><div class="applet-msg" role="status"></div>`;
  function wireAddRow(cd, check, onAdd, onUndo) {
    const msg = cd.querySelector(".applet-msg"), ins = [...cd.querySelectorAll(".applet-row input")];
    const add = () => { const v = ins.map((i) => (i.value.trim() === "" ? NaN : Number(i.value))); const bad = check(v); msg.textContent = bad || ""; if (bad) return; onAdd(v); ins.forEach((i) => (i.value = "")); ins[0].focus(); };
    cd.querySelector('.applet-row [data-a="add"]').onclick = add;
    ins.forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }));
    cd.querySelector('.applet-row [data-a="undo"]').onclick = () => { msg.textContent = ""; onUndo(); };
  }
  function meanMedianApplet() {
    const start = [52, 55, 58, 60, 61, 63, 65, 66, 68, 70];
    const cd = card("Mean versus median", "click the line to add a value, click a dot to remove it", say("Watch which center moves. Add a value far to the right: the mean chases it, the median barely moves. That is why a skewed distribution or an outlier calls for the median and IQR.") + btns([["out", "Add a value at 100"], ["outL", "Add a value at 0"], ["reset", "Reset"], ["clear", "Clear all"]]) + addRow([["v", "Value (0 to 100)", 0, 100]], "Add", "Remove the last value") + `<div class="mm-stats"></div>`);
    let pts = start.slice();
    const render = clickPlot(cd, 220, (x) => { pts.push(Math.round(Math.min(100, Math.max(0, x)) * 10) / 10); show(); }, (i) => { pts.splice(i, 1); show(); });
    function show() {
      const seen = {}, ys = pts.map((x) => { const k = Math.round(x); seen[k] = (seen[k] || 0) + 1; return seen[k] - 1; });
      const n = pts.length, d = n >= 2 ? SW.describe(pts) : null, m = n ? SW.mean(pts) : NaN, med = n ? SW.median(pts) : NaN;
      cd.querySelector(".mm-stats").innerHTML = n ? table(["N", "Mean", "Median", "Mean minus median", "SD", "IQR"], [[n, m, med, m - med, d ? d.sd : "", d ? d.iqr : ""]], "") : say("No values yet: click the line.");
      const shapes = n ? [{ type: "line", x0: m, x1: m, yref: "paper", y0: 0, y1: 1, line: { color: "#C0392B", width: 2 } }, { type: "line", x0: med, x1: med, yref: "paper", y0: 0, y1: 1, line: { color: "#1A3A4D", width: 2, dash: "dash" } }] : [];
      render.el.setAttribute("aria-label", n ? `Dot plot of ${n} values on a line from 0 to 100. Mean ${fmt(m, 2)}, median ${fmt(med, 2)}.` : "Dot plot with no values yet.");
      render([{ x: pts, y: ys, mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: 11 }, hovertemplate: "%{x}<extra>click to remove</extra>" }], { xaxis: { range: [0, 100], title: "value", fixedrange: true, dtick: 10, zeroline: false }, yaxis: { visible: false, range: [-0.6, Math.max(4, ...ys) + 1], fixedrange: true }, shapes, annotations: n ? [{ x: m, yref: "paper", y: 1.1, xanchor: m >= med ? "left" : "right", text: "mean", showarrow: false, font: { color: "#C0392B" } }, { x: med, yref: "paper", y: 1.1, xanchor: m >= med ? "right" : "left", text: "median", showarrow: false, font: { color: "#1A3A4D" } }] : [], showlegend: false });
    }
    cd.querySelector('[data-a="out"]').onclick = () => { pts.push(100); show(); }; cd.querySelector('[data-a="outL"]').onclick = () => { pts.push(0); show(); };
    cd.querySelector('[data-a="reset"]').onclick = () => { pts = start.slice(); show(); }; cd.querySelector('[data-a="clear"]').onclick = () => { pts = []; show(); };
    const said = () => announce(pts.length ? `${pts.length} values. Mean ${fmt(SW.mean(pts), 2)}, median ${fmt(SW.median(pts), 2)}.` : "No values.");
    wireAddRow(cd, ([x]) => (Number.isFinite(x) && x >= 0 && x <= 100 ? "" : "Type a number from 0 to 100."), ([x]) => { pts.push(Math.round(x * 10) / 10); show(); said(); }, () => { if (pts.length) { pts.pop(); show(); } said(); });
    show();
  }
  function influenceApplet() {
    const start = [[1, 2.1], [2, 2.9], [3, 3.2], [3.5, 4.4], [4, 4.1], [5, 5.3], [5.5, 5], [6, 6.4], [7, 6.6], [8, 7.9]];
    const cd = card("Regression: outliers and influence", "click to add a point, click a point to remove it", say("The dashed line is the fit to the starting data; the red line refits every time you click. Add a point far to the right and off the pattern, then one in the middle of the x range and off the pattern. The first drags the line and r a long way: it is influential. The second is an outlier in y but barely moves the slope.") + btns([["reset", "Reset"], ["clear", "Clear all"]]) + addRow([["x", "x (0 to 12)", 0, 12], ["y", "y (0 to 12)", 0, 12]], "Add point", "Remove the last point") + `<div class="inf-stats"></div>`);
    let pts = start.map((q) => q.slice());
    const fit = (P) => { if (P.length < 3) return null; const r = SW.regress(P.map((q) => q[0]), P.map((q) => q[1])); return Number.isFinite(r.b1) ? r : null; };
    const base = fit(start);
    const render = clickPlot(cd, 340, (x, y) => { pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]); show(); }, (i) => { pts.splice(i, 1); show(); });
    function show() {
      const r = fit(pts), xs = [0, 12];
      cd.querySelector(".inf-stats").innerHTML = r ? table(["N", "r", "R squared", "Slope", "Intercept"], [[r.n, r.r, r.r2, r.b1, r.b0], ["start", base.r, base.r2, base.b1, base.b0]], "Current fit, and the starting fit for comparison") : say("Need at least three points with different x values.");
      const tr = [{ x: pts.map((q) => q[0]), y: pts.map((q) => q[1]), mode: "markers", type: "scatter", name: "points", marker: { color: "#3A7CA5", size: 10 }, hovertemplate: "(%{x}, %{y})<extra>click to remove</extra>" }, { x: xs, y: xs.map(base.predict), mode: "lines", name: "starting fit", line: { color: "#7F8C8D", dash: "dash" }, hoverinfo: "skip" }];
      if (r) tr.push({ x: xs, y: xs.map(r.predict), mode: "lines", name: "current fit", line: { color: "#C0392B", width: 2 }, hoverinfo: "skip" });
      render.el.setAttribute("aria-label", `Scatterplot of ${pts.length} points with the starting fit (dashed)${r ? ` and the current fit: r = ${fmt(r.r, 3)}, slope ${fmt(r.b1, 3)}` : ""}.`);
      render(tr, { xaxis: { range: [0, 12], title: "x", fixedrange: true }, yaxis: { range: [0, 12], title: "y", fixedrange: true }, legend: { orientation: "h", y: -0.2 } });
    }
    cd.querySelector('[data-a="reset"]').onclick = () => { pts = start.map((q) => q.slice()); show(); }; cd.querySelector('[data-a="clear"]').onclick = () => { pts = []; show(); };
    const said = () => { const r = fit(pts); announce(`${pts.length} points.${r ? ` r = ${fmt(r.r, 3)}, slope ${fmt(r.b1, 3)}.` : " Need at least three points with different x values."}`); };
    const inRange = (v) => Number.isFinite(v) && v >= 0 && v <= 12;
    wireAddRow(cd, ([x, y]) => (inRange(x) && inRange(y) ? "" : "Type x and y, each a number from 0 to 12."), ([x, y]) => { pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]); show(); said(); }, () => { if (pts.length) { pts.pop(); show(); } said(); });
    show();
  }
  function guessRApplet() {
    const cd = card("Guess the correlation", "", say("Look at the scatterplot, type your guess for r (between minus 1 and 1), then check. Strength is how tightly the points hug a line; the sign is the direction.") + `<div class="applet-row"><label>Your guess for r <input type="number" step="0.05" min="-1" max="1" class="gr-in"></label><button type="button" data-a="check">Check</button><button type="button" data-a="new">New plot</button></div><div class="gr-out" role="status"></div>`);
    const p = document.createElement("div"); p.className = "plot"; p.style.height = "320px"; p.setAttribute("role", "img"); cd.appendChild(p);
    let r = 0, done = false; const hist = [];
    const fresh = () => { const rho = (Math.random() * 2 - 1) * 0.97, n = 40 + Math.floor(Math.random() * 40), nrm = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); const x = [], y = []; for (let i = 0; i < n; i++) { const a = nrm(); x.push(50 + 10 * a); y.push(50 + 10 * (rho * a + Math.sqrt(1 - rho * rho) * nrm())); } r = SW.regress(x, y).r; done = false; cd.querySelector(".gr-in").value = ""; p.setAttribute("aria-label", `Scatterplot of ${n} points. Guess the correlation r.`); cd.querySelector(".gr-out").innerHTML = hist.length ? say(`Guesses so far: ${hist.length}, average miss ${fmt(hist.reduce((s, q) => s + q, 0) / hist.length, 3)}.`) : ""; Plotly.react(p, [{ x, y, mode: "markers", type: "scatter", marker: { color: "#3A7CA5", size: 7 }, hoverinfo: "skip" }], { margin: { t: 20, l: 50, r: 20, b: 45 }, xaxis: { title: "x", fixedrange: true }, yaxis: { title: "y", fixedrange: true }, dragmode: false, paper_bgcolor: "#fff", plot_bgcolor: "#fff" }, { displayModeBar: false, responsive: true }); };
    cd.querySelector('[data-a="new"]').onclick = fresh;
    cd.querySelector(".gr-in").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); cd.querySelector('[data-a="check"]').click(); } });
    cd.querySelector('[data-a="check"]').onclick = () => { const g = Number(cd.querySelector(".gr-in").value); if (cd.querySelector(".gr-in").value === "" || !(g >= -1 && g <= 1)) { cd.querySelector(".gr-out").innerHTML = warn("Type a number between minus 1 and 1."); return; } const miss = Math.abs(g - r); if (!done) { hist.push(miss); done = true; } cd.querySelector(".gr-out").innerHTML = (miss <= 0.1 ? ok : say)(`The correlation is r = ${fmt(r, 3)}. Your guess ${g} is off by ${fmt(miss, 3)}${miss <= 0.1 ? ": very close." : "."} Guesses so far: ${hist.length}, average miss ${fmt(hist.reduce((s, q) => s + q, 0) / hist.length, 3)}.`); };
    fresh();
  }
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
      only(hasData ? selNum("x", "Column (used as the population)") : null, (raw) => raw.pop === "col"),
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
      const dObs = Math.abs(obs - claim), xObs = Math.round(v.x);
      // two-sided proportion: as extreme means no more likely under H0 (R's binom.test rule), so the simulation estimates the exact p
      const two = isProp && v.alt === "two" ? SW.binomTwoSided(xObs, n, v.p0) : null;
      const isExtreme = two ? (s) => { const k = Math.round(s * n); return k <= two.lo || k >= two.hi; } : (s) => (v.alt === "two" ? Math.abs(s - claim) >= dObs - 1e-12 : v.alt === "greater" ? s >= obs - 1e-12 : s <= obs + 1e-12);
      const extreme = stats.filter(isExtreme).length;
      const pSim = extreme / reps;
      let pTheory, pExact = null, statLabel, se;
      if (isProp) {
        se = Math.sqrt((v.p0 * (1 - v.p0)) / n); const z = (obs - v.p0) / se; pTheory = SW.pvalue(z, v.alt, SW.pnorm); statLabel = `z = ${fmt(z)}`;
        pExact = v.alt === "greater" ? SW.pbinomUpper(xObs - 1, n, v.p0) : v.alt === "less" ? SW.pbinom(xObs, n, v.p0) : two.p; // each tail from its own side
      } else { se = v.sigma / Math.sqrt(n); const z = (obs - v.mu0) / se; pTheory = SW.pvalue(z, v.alt, SW.pnorm); statLabel = `z = ${fmt(z)}, using the sigma this simulation was given`; }
      const headers = ["H0 claims", "What you observed", "Samples simulated under H0", "As extreme or more", "Simulated p"].concat(isProp ? ["Exact binomial p", "z formula p"] : ["z formula p"]);
      const row = [claim, obs, reps, extreme, pSim].concat(isProp ? [pExact, pTheory] : [pTheory]);
      let html = table(headers, [row], isProp ? `${Math.round(v.x)} successes in ${n} trials, p hat = ${fmt(obs, 4)}` : `x bar = ${fmt(obs, 4)} from n = ${n}`);
      html += formula("p-value = P(a result at least this extreme | H0 is true)");
      html += say(`Read the simulation out loud and the definition stops being abstract. We forced H0 to be true, drew ${reps} fresh samples from that world, and ${extreme} of them landed at least as far ${two && v.p0 !== 0.5 ? `out as your ${fmt(obs, 4)} did. With p0 = ${v.p0} the two sides are not mirror images, so as far out means no more likely under H0, the rule R and jamovi use: ${two.lo >= n ? `every count from 0 to ${n}` : two.lo >= 0 && two.hi <= n ? `${two.lo} or fewer successes, or ${two.hi} or more` : two.lo >= 0 ? `${two.lo} or fewer successes` : `${two.hi} or more successes`}` : `from ${fmt(claim)} as your ${fmt(obs, 4)} did`}. That fraction, ${fmt(pSim, 4)}, is the p-value. Here ${statLabel}.`);
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
      const cut = two ? (two.lo >= n ? [obs] : [two.lo, two.hi].filter((k) => k >= 0 && k <= n).map((k) => k / n)) : v.alt === "two" ? [claim - dObs, claim + dObs] : [obs];
      const inTail = stats.filter(isExtreme), inBody = stats.filter((s) => !isExtreme(s));
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
  function sampleData() { dialog("Sample datasets", [Object.assign(sel("f", "Dataset", fieldSamples()), { hint: "A sample dataset is not remembered for your next visit until you change it (a new column, an edited cell). Then it is kept as your own. A filter alone does not count." })], (v) => fetch("data/" + v.f).then((r) => r.text()).then((t) => loadTable(v.f.replace(/\.csv$/, ""), parseCSV(t), "sample")).catch(() => alert("Could not load the sample file.")), "Open"); }
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
  // ---- Data tools: bin, stack, simulate, sample rows ----
  const replaceOK = (what) => !D.rows.length || window.confirm(`${what} makes a new data table and replaces the one open now. Download the current data first if you need it. Continue?`);
  const rng = (seed) => { if (!(Number.isFinite(seed))) return Math.random; let a = Math.floor(seed) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  function binUI() {
    needData();
    dialog("Data: Bin a numeric variable into classes", [selNum("x", "Variable"), { name: "start", label: "First class starts at", type: "number", value: "" }, { name: "w", label: "Class width", type: "number", value: "" }, { name: "nm", label: "New column name (blank = variable_class)", type: "text" }], (v) => {
      const vals = D.rows.map((r) => r[D.cols.indexOf(v.x)]), xs = SW.num(vals); if (!xs.length) throw new Error("No numeric values.");
      if (!(v.w > 0)) throw new Error("Type a class width, such as 10.");
      const start = Number.isFinite(v.start) ? v.start : Math.floor(Math.min(...xs) / v.w) * v.w; if (Math.min(...xs) < start) throw new Error(`The smallest value (${Math.min(...xs)}) is below the start; start at ${Math.floor(Math.min(...xs) / v.w) * v.w} or lower.`);
      const lab = (k) => `${fmt(start + k * v.w)} to under ${fmt(start + (k + 1) * v.w)}`;
      const out = vals.map((q) => { const x = Number(q); if (q === "" || !Number.isFinite(x)) return ""; return lab(Math.floor((x - start) / v.w + 1e-9)); });
      const nm = (v.nm || "").trim() || v.x + "_class"; addColumn(nm, out); D.manual[nm] = "nominal"; inferTypes(); renderGrid(); persist();
      card("New column", `${nm} added`, say(`Each value of ${esc(v.x)} is placed in a class of width ${v.w} starting at ${start}. A class includes its left end and excludes its right end, so a value of exactly ${fmt(start + v.w)} goes in the second class. The new column is categorical, with the classes kept in numeric order, ready for a frequency table or bar plot.`));
    }, "Add");
  }
  function stackUI() {
    needData();
    dialog("Data: Stack columns", [{ name: "vars", label: "Columns to stack (two or more)", type: "multi", options: D.cols }, { name: "vn", label: "Name for the values column", type: "text", value: "value" }, { name: "gn", label: "Name for the column that says where each value came from", type: "text", value: "group" }], (v) => {
      if (v.vars.length < 2) throw new Error("Pick two or more columns.");
      if (!replaceOK("Stacking")) return;
      const rows = [[v.vn || "value", v.gn || "group"]]; v.vars.forEach((c) => { const j = D.cols.indexOf(c); D.rows.forEach((r) => { if (r[j] !== "" && r[j] != null) rows.push([r[j], c]); }); });
      loadTable("stacked", rows); // a new table made by the student: their own, so it is remembered
      card("Stack columns", `${v.vars.join(", ")} stacked`, say(`One column of values and one column naming the original column. Two-sample t tests, ANOVA and side-by-side graphs need this layout: a response variable and a grouping variable.`));
    }, "Stack");
  }
  // ================= Data: reshape, merge, group by, clean. tidyr and dplyr in plain words; every card shows the R line =================
  const ci = (c) => D.cols.indexOf(c), rline = (t) => formula("R: " + t), uniqName = (nm, taken) => { let n = nm, k = 2; while (taken.includes(n)) n = `${nm}_${k++}`; return n; };
  function pivotLongerUI() {
    needData();
    dialog("Data: Reshape wide to long (one row per measurement)", [
      { name: "vars", label: `Columns to gather into one (two or more, e.g. week1, week4, week8; ${MULTI_HINT()})`, type: "multi", options: D.cols },
      { name: "ids", label: "Columns to keep on every row (ID, group; optional)", type: "multi", options: D.cols },
      { name: "nn", label: "Name for the new column that says which column each value came from", type: "text", value: "measure" },
      { name: "vn", label: "Name for the values column", type: "text", value: "value" },
      { name: "blank", label: "Keep rows whose value is blank", type: "check", value: false }], (v) => {
      if (v.vars.length < 2) throw new Error("Pick two or more columns to gather.");
      const ids = (v.ids || []).filter((c) => !v.vars.includes(c)), nn = (v.nn || "measure").trim().replace(/\s+/g, "_"), vn = (v.vn || "value").trim().replace(/\s+/g, "_");
      if (nn === vn || ids.includes(nn) || ids.includes(vn)) throw new Error("The two new column names must differ from each other and from the columns kept.");
      if (!replaceOK("Reshaping")) return;
      const out = [ids.concat([nn, vn])]; let blanks = 0;
      D.rows.forEach((r) => v.vars.forEach((c) => { const val = r[ci(c)]; if (val === "" && !v.blank) { blanks++; return; } out.push(ids.map((k) => r[ci(k)]).concat([c, val])); }));
      const nOld = D.rows.length, nm = D.name; loadTable(nm + "_long", out);
      card("Reshape wide to long", `${v.vars.length} columns gathered; ${nOld} rows became ${out.length - 1}`, say(`Every value from ${v.vars.join(", ")} now sits in its own row: ${nn} names the column it came from and ${vn} holds it${ids.length ? `, with ${ids.join(", ")} repeated on each row` : ""}.${blanks ? ` ${blanks} blank value${blanks > 1 ? "s were" : " was"} left out.` : ""} This long layout is what one-way and repeated-measures analyses by group, mixed models and grouped graphs expect: a value column and a column that says which measurement it is.`) + rline(`pivot_longer(data, cols = c(${v.vars.join(", ")}), names_to = "${nn}", values_to = "${vn}")`));
    }, "Reshape");
  }
  function pivotWiderUI() {
    needData();
    dialog("Data: Reshape long to wide (one row per case)", [
      { name: "ids", label: `Columns that identify a row (ID; add a group column too if it belongs to the case; ${MULTI_HINT()})`, type: "multi", options: D.cols },
      sel("nf", "Column whose values become the new column names (e.g. week)", D.cols), sel("vf", "Column whose values fill the cells (e.g. score)", D.cols),
      sel("dup", "If several values fall into one cell", [["error", "Stop and tell me (R's default)"], ["first", "Keep the first"], ["mean", "Average them (numbers)"], ["count", "Count them"]], "error"),
      { name: "prefix", label: "Prefix for the new column names (optional, e.g. week_)", type: "text", value: "" }], (v) => {
      const ids = (v.ids || []).filter((c) => c !== v.nf && c !== v.vf); if (!ids.length) throw new Error("Pick at least one column that identifies a row, such as an ID.");
      if (v.nf === v.vf) throw new Error("The names column and the values column must differ.");
      const names = []; D.rows.forEach((r) => { const k = r[ci(v.nf)]; if (k !== "" && !names.includes(k)) names.push(k); });
      if (names.length < 2) throw new Error(`${v.nf} has ${names.length} distinct value${names.length === 1 ? "" : "s"}; nothing to spread.`);
      if (names.length > 200) throw new Error(`${v.nf} has ${names.length} distinct values; that would make ${names.length} columns. Pick the column with the few repeated labels (week, condition).`);
      const key = (r) => ids.map((c) => r[ci(c)]).join("\u0001"), cells = new Map(); let dups = 0, ex = null;
      D.rows.forEach((r) => { const k = key(r), nk = r[ci(v.nf)]; if (nk === "") return; if (!cells.has(k)) cells.set(k, { id: ids.map((c) => r[ci(c)]), v: {} }); const cell = cells.get(k).v; (cell[nk] = cell[nk] || []).push(r[ci(v.vf)]); if (cell[nk].length === 2) { dups++; if (!ex) ex = `${ids.map((c, i) => `${c} = ${cells.get(k).id[i]}`).join(", ")}, ${v.nf} = ${nk}`; } });
      if (dups && v.dup === "error") throw new Error(`${dups} cell${dups > 1 ? "s have" : " has"} more than one value (for example ${ex}). Add a column under "identify a row" that tells them apart, or choose what to do with them.`);
      const newCols = names.map((n) => uniqName((v.prefix || "") + String(n).replace(/\s+/g, "_"), ids)); if (!replaceOK("Reshaping")) return;
      const agg = (vals) => { if (vals.length === 1) return vals[0]; if (v.dup === "first") return vals[0]; if (v.dup === "count") return String(vals.length); const nums = vals.filter((q) => q !== "" && Number.isFinite(Number(q))).map(Number); return nums.length ? fmt(nums.reduce((s, q) => s + q, 0) / nums.length, 4) : ""; };
      const out = [ids.concat(newCols)]; cells.forEach((c) => out.push(c.id.concat(names.map((n) => (c.v[n] ? agg(c.v[n]) : "")))));
      const nOld = D.rows.length, nm = D.name; loadTable(nm + "_wide", out);
      const empty = out.slice(1).reduce((s, r) => s + r.slice(ids.length).filter((q) => q === "").length, 0);
      card("Reshape long to wide", `${nOld} rows became ${out.length - 1} rows and ${newCols.length} new columns`, say(`One row per ${ids.join(" and ")}; the ${names.length} values of ${v.nf} became columns holding ${v.vf}.${dups ? ` ${dups} cell${dups > 1 ? "s" : ""} had several values and ${v.dup === "first" ? "kept the first" : v.dup === "mean" ? "were averaged" : "were counted"}.` : ""}${empty ? ` ${empty} cell${empty > 1 ? "s are" : " is"} blank (no measurement for that case).` : ""} This wide layout is what paired tests, repeated-measures ANOVA and reliability expect: one column per time point or item.`) + rline(`pivot_wider(data, id_cols = c(${ids.join(", ")}), names_from = ${v.nf}, values_from = ${v.vf}${v.prefix ? `, names_prefix = "${v.prefix}"` : ""}${v.dup === "first" ? ", values_fn = first" : v.dup === "mean" ? ", values_fn = mean" : v.dup === "count" ? ", values_fn = length" : ""})`));
    }, "Reshape");
  }
  function joinUI() {
    needData();
    dialog("Data: Merge with another table (join by a key)", [
      sel("src", "The other table", [["paste", "paste it below"], ["sample", "a sample dataset"]], "paste"),
      { name: "tbl", label: "Paste the other table (first row = column names)", type: "textarea", rows: 6, vis: (raw) => raw.src !== "sample" },
      Object.assign(sel("f2", "Sample dataset", fieldSamples()), { vis: (raw) => raw.src === "sample" }),
      sel("k1", "Key column in this table (the ID that matches rows)", D.cols), { name: "k2", label: "Key column in the other table (blank if it has the same name)", type: "text", value: "" },
      sel("how", "Rows to keep", [["left", "every row of this table, matched or not (left join)"], ["inner", "only rows found in both (inner join)"], ["full", "every row of both tables (full join)"]], "left")], (v) => {
      const go = (rows2) => { try {
        if (!rows2 || rows2.length < 2) throw new Error("The other table needs a header row and at least one data row.");
        const cols2 = rows2[0].map((h, i) => (String(h).trim() || "col" + (i + 1))), k2 = (v.k2 || "").trim() || v.k1, j2 = cols2.indexOf(k2);
        if (j2 < 0) throw new Error(`The other table has no column ${k2}. Its columns: ${cols2.join(", ")}.`);
        const j1 = ci(v.k1), other = new Map(); let dupKeys = 0;
        rows2.slice(1).forEach((r) => { const k = String(r[j2] == null ? "" : r[j2]).trim(); if (k === "") return; if (other.has(k)) dupKeys++; (other.get(k) || other.set(k, []).get(k)).push(cols2.map((_, j) => (r[j] == null ? "" : String(r[j]).trim()))); });
        const addCols = cols2.filter((_, j) => j !== j2), outCols = D.cols.concat(addCols.map((c) => uniqName(c, D.cols))), renamed = addCols.filter((c, i) => outCols[D.cols.length + i] !== c);
        const out = [outCols], seen = new Set(); let matched = 0, unmatched1 = 0;
        D.rows.forEach((r) => { const k = r[j1], hits = k !== "" ? other.get(k) : null; if (hits) { matched++; seen.add(k); hits.forEach((h) => out.push(r.concat(addCols.map((c) => h[cols2.indexOf(c)])))); } else { unmatched1++; if (v.how !== "inner") out.push(r.concat(addCols.map(() => ""))); } });
        let unmatched2 = 0; other.forEach((hits, k) => { if (!seen.has(k)) { unmatched2 += hits.length; if (v.how === "full") hits.forEach((h) => out.push(D.cols.map((c) => (c === v.k1 ? k : "")).concat(addCols.map((c) => h[cols2.indexOf(c)])))); } });
        if (!replaceOK("Merging")) return; const nOld = D.rows.length, nm = D.name; loadTable(nm + "_merged", out);
        const fn = { left: "left_join", inner: "inner_join", full: "full_join" }[v.how];
        card("Merge (join)", `${addCols.length} columns added; ${nOld} rows became ${out.length - 1}`, table(["", "Rows"], [["Rows of this table with a match", matched], ["Rows of this table without a match", unmatched1], ["Rows of the other table without a match", unmatched2], ["Keys repeated in the other table", dupKeys]], "Match summary") + say(`Rows were matched where ${v.k1} here equals ${k2} there.${v.how === "left" ? " Unmatched rows of this table were kept with blanks in the new columns." : v.how === "inner" ? " Only matched rows were kept." : " Unmatched rows of both tables were kept with blanks."}${dupKeys ? ` ${dupKeys} key${dupKeys > 1 ? "s appear" : " appears"} more than once in the other table, so some rows here were copied for each match (R does the same).` : ""}${renamed.length ? ` ${renamed.join(", ")} already existed here, so the new copies were named with _2 (R would use .x and .y).` : ""}`) + rline(`${fn}(data, other, by = ${k2 === v.k1 ? `"${v.k1}"` : `c("${v.k1}" = "${k2}")`})`));
      } catch (err) { alert(err.message || err); } };
      if (v.src === "sample") fetch("data/" + v.f2).then((r) => r.text()).then((t) => go(parseCSV(t))).catch(() => alert("Could not load the sample file.")); else go(parseCSV(v.tbl || ""));
    }, "Merge");
  }
  function groupByUI() {
    needData();
    dialog("Data: Group by and summarize", [
      sel("g", "Group by", D.cols), selAny("g2", "and also by (optional)"),
      { name: "ys", label: `Numeric columns to summarize (${MULTI_HINT()})`, type: "multi", options: numCols() },
      { name: "st", label: "Statistics", type: "multi", options: [["n", "n (rows in the group)"], ["mean", "Mean"], ["sd", "SD"], ["median", "Median"], ["min", "Min"], ["max", "Max"], ["sum", "Sum"], ["blanks", "Blanks"]], value: ["n", "mean", "sd"] },
      { name: "asTable", label: "Make the summary the new data table (replaces this one)", type: "check", value: false }], (v) => {
      if (!v.ys.length && !(v.st || []).includes("n")) throw new Error("Pick at least one numeric column, or the statistic n.");
      const st = (v.st || []).length ? v.st : ["n"], gs = [v.g].concat(v.g2 && v.g2 !== v.g ? [v.g2] : []), idx = activeIdx(), groups = new Map();
      idx.forEach((i) => { const r = D.rows[i], k = gs.map((c) => r[ci(c)]).join("\u0001"); if (!groups.has(k)) groups.set(k, { key: gs.map((c) => r[ci(c)]), rows: [] }); groups.get(k).rows.push(r); });
      const numish = (vals) => vals.every((q) => q === "" || Number.isFinite(Number(q))), ordered = [...groups.values()].sort((a, b) => { for (let i = 0; i < gs.length; i++) { const x = a.key[i], y = b.key[i]; if (x === y) continue; const nx = Number(x), ny = Number(y); return Number.isFinite(nx) && Number.isFinite(ny) ? nx - ny : x < y ? -1 : 1; } return 0; });
      const fns = { mean: (q) => SW.mean(q), sd: (q) => (q.length > 1 ? SW.sd(q) : NaN), median: (q) => SW.median(q), min: (q) => Math.min(...q), max: (q) => Math.max(...q), sum: (q) => q.reduce((s, x) => s + x, 0) };
      const hdr = gs.slice(); if (st.includes("n")) hdr.push("n"); v.ys.forEach((y) => st.filter((s) => s !== "n").forEach((s) => hdr.push(`${y}_${s}`)));
      const rows = ordered.map((g) => { const row = g.key.slice(); if (st.includes("n")) row.push(g.rows.length); v.ys.forEach((y) => { const raw = g.rows.map((r) => r[ci(y)]), nums = raw.filter((q) => q !== "" && Number.isFinite(Number(q))).map(Number); st.filter((s) => s !== "n").forEach((s) => row.push(s === "blanks" ? raw.length - nums.length : nums.length ? fns[s](nums) : NaN)); }); return row; });
      const rcall = `data %>% group_by(${gs.join(", ")}) %>% summarise(${[st.includes("n") ? "n = n()" : ""].concat(v.ys.flatMap((y) => st.filter((s) => s !== "n").map((s) => `${y}_${s} = ${s === "blanks" ? `sum(is.na(${y}))` : `${s}(${y}, na.rm = TRUE)`}`))).filter(Boolean).join(", ")})`;
      const html = table(hdr, rows.map((r) => r.map((q) => (typeof q === "number" && Number.isNaN(q) ? "" : q))), `Summary by ${gs.join(" and ")}`) + say(`${ordered.length} group${ordered.length > 1 ? "s" : ""}${idx.length < D.rows.length ? `, from the ${idx.length} rows kept by the filter` : ""}. Blanks are left out of every statistic (R's na.rm = TRUE); SD is blank for a group of one.`) + rline(rcall);
      if (v.asTable) { if (!replaceOK("Summarizing")) return; const nm = D.name; loadTable(nm + "_by_" + gs.join("_"), [hdr].concat(rows.map((r) => r.map((q) => (typeof q === "number" ? (Number.isNaN(q) ? "" : Number.isInteger(q) ? String(q) : fmt(q, 4)) : q))))); }
      card("Group by and summarize", src(`${v.ys.join(", ") || "n"} by ${gs.join(" and ")}`), html);
    }, "Summarize");
  }
  function cleanRowsUI() {
    needData();
    dialog("Data: Clean rows (blanks, duplicates, spaces)", [
      { name: "na", label: "Treat NA, N/A, NaN, null, None, ., -, ? and #N/A as blank (R's na.strings)", type: "check", value: true },
      { name: "trim", label: "Trim spaces around every value (\" Yes\" becomes \"Yes\")", type: "check", value: true },
      { name: "dup", label: "Remove exact duplicate rows (keep the first)", type: "check", value: false },
      { name: "blank", label: `Remove rows with a blank in any of these columns (${MULTI_HINT()}; optional)`, type: "multi", options: D.cols },
      { name: "empty", label: "Remove rows that are blank in every column", type: "check", value: true }], (v) => {
      const NA = new Set(["na", "n/a", "nan", "null", "none", ".", "-", "?", "#n/a", "#null!"]); let naN = 0, trimN = 0;
      let rows = D.rows.map((r) => r.map((q) => { let s = q; if (v.trim && s !== s.trim()) { s = s.trim(); trimN++; } if (v.na && s !== "" && NA.has(s.toLowerCase())) { s = ""; naN++; } return s; }));
      const n0 = rows.length; let dupN = 0, blankN = 0, emptyN = 0;
      if (v.dup) { const seen = new Set(); rows = rows.filter((r) => { const k = r.join("\u0001"); if (seen.has(k)) { dupN++; return false; } seen.add(k); return true; }); }
      if ((v.blank || []).length) { const js = v.blank.map(ci); rows = rows.filter((r) => { if (js.some((j) => r[j] === "")) { blankN++; return false; } return true; }); }
      if (v.empty) rows = rows.filter((r) => { if (r.every((q) => q === "")) { emptyN++; return false; } return true; });
      D.rows = rows; inferTypes(); renderGrid(); changed();
      const parts = []; if (naN) parts.push(`${naN} missing-value code${naN > 1 ? "s" : ""} (NA, ., -) turned into blanks`); if (trimN) parts.push(`${trimN} value${trimN > 1 ? "s" : ""} trimmed`); if (dupN) parts.push(`${dupN} duplicate row${dupN > 1 ? "s" : ""} removed`); if (blankN) parts.push(`${blankN} row${blankN > 1 ? "s" : ""} with a blank in ${v.blank.join(", ")} removed`); if (emptyN) parts.push(`${emptyN} empty row${emptyN > 1 ? "s" : ""} removed`);
      const rcalls = [v.na ? 'read.csv(file, na.strings = c("NA", "N/A", ".", "-", "?"))' : "", v.trim ? "mutate(across(everything(), trimws))" : "", v.dup ? "distinct(data)" : "", (v.blank || []).length ? `drop_na(data, ${v.blank.join(", ")})` : ""].filter(Boolean);
      card("Clean rows", `${n0} rows became ${rows.length}`, say(parts.length ? parts.join("; ") + "." : "Nothing needed changing: no missing-value codes, stray spaces, duplicates or blanks in the columns chosen.") + (rcalls.length ? rline(rcalls.join("; ")) : ""));
    }, "Clean");
  }
  function simulateUI() {
    dialog("Data: Simulate random data", [sel("dist", "Distribution", [["normal", "Normal (mean, SD)"], ["unif", "Uniform, continuous (min, max)"], ["dunif", "Discrete uniform whole numbers (min, max)"], ["binom", "Binomial (n, p)"], ["pois", "Poisson (lambda)"], ["exp", "Exponential (mean)"], ["bern", "Yes or no (probability of Yes)"]], "normal"),
      { name: "a", label: "First parameter (mean, min, n, lambda or p)", type: "number", value: 0, group: "Parameters" }, { name: "b", label: "Second parameter (SD, max or p)", type: "number", value: 1, group: "Parameters" },
      { name: "rows", label: "Rows (sample size)", type: "number", value: 30 }, { name: "cols", label: "Columns (number of samples)", type: "number", value: 1 }, { name: "seed", label: "Seed (optional: the same seed gives the same numbers)", type: "number", value: "" }], (v) => {
      const { dist, a, b } = v, n = v.rows, k = v.cols; if (!(Number.isInteger(n) && n >= 1 && n <= 100000)) throw new Error("Rows must be a whole number from 1 to 100000."); if (!(Number.isInteger(k) && k >= 1 && k <= 200)) throw new Error("Columns must be a whole number from 1 to 200.");
      const U = rng(v.seed), nrm = () => { let u = 0; while (u === 0) u = U(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * U()); };
      const inv = (pmf) => { const u = U(); let c = 0, x = 0; while (x < 1e6) { c += pmf(x); if (u <= c) return x; x++; } return x; };
      let draw, nm;
      if (dist === "normal") { if (!(b > 0)) throw new Error("SD must be positive."); draw = () => a + b * nrm(); nm = "normal"; }
      else if (dist === "unif") { if (!(b > a)) throw new Error("Max must be above min."); draw = () => a + (b - a) * U(); nm = "uniform"; }
      else if (dist === "dunif") { if (!(Number.isInteger(a) && Number.isInteger(b) && b > a)) throw new Error("Type two whole numbers, max above min."); draw = () => a + Math.floor(U() * (b - a + 1)); nm = "dunif"; }
      else if (dist === "binom") { if (!(Number.isInteger(a) && a >= 1 && b >= 0 && b <= 1)) throw new Error("Binomial: first parameter n (whole number), second p (between 0 and 1)."); draw = () => { let s = 0; for (let i = 0; i < a; i++) if (U() < b) s++; return s; }; nm = "binom"; }
      else if (dist === "pois") { if (!(a > 0)) throw new Error("Lambda must be positive."); draw = () => inv((x) => Math.exp(-a + x * Math.log(a) - jStat.gammaln(x + 1))); nm = "pois"; }
      else if (dist === "exp") { if (!(a > 0)) throw new Error("The mean must be positive."); draw = () => -a * Math.log(1 - U()); nm = "exp"; }
      else { if (!(a >= 0 && a <= 1)) throw new Error("Probability of Yes must be between 0 and 1."); draw = () => (U() < a ? "Yes" : "No"); nm = "yesno"; }
      const fmtv = (q) => (typeof q === "number" ? (Number.isInteger(q) ? String(q) : q.toFixed(4)) : q);
      const names = Array.from({ length: k }, (_, j) => (k === 1 ? nm : `${nm}_${j + 1}`));
      if (D.rows.length === n) { names.forEach((c) => { let c2 = c, t = 2; while (D.cols.includes(c2)) c2 = `${c}_${t++}`; addColumn(c2, Array.from({ length: n }, () => fmtv(draw()))); }); }
      else { if (!replaceOK("Simulating " + n + " rows")) return; loadTable("simulated", [names].concat(Array.from({ length: n }, () => names.map(() => fmtv(draw()))))); }
      card("Simulated data", `${k} column${k > 1 ? "s" : ""} of ${n} values`, say(`Random values from the ${dist === "bern" ? "yes or no" : nm} distribution.${Number.isFinite(v.seed) ? ` Seed ${v.seed}: run it again with the same seed to get the same numbers.` : " Run it again for a fresh sample; set a seed to repeat a sample exactly."}`));
    }, "Simulate");
  }
  function sampleRowsUI() {
    needData();
    dialog("Data: Random sample of rows", [{ name: "n", label: "Sample size (rows)", type: "number", value: 10 }, sel("repl", "Sampling", [["no", "without replacement (each row at most once)"], ["yes", "with replacement (a row can repeat)"]], "no"), { name: "seed", label: "Seed (optional)", type: "number", value: "" }], (v) => {
      const idx = activeIdx(), n = v.n; if (!(Number.isInteger(n) && n >= 1)) throw new Error("Sample size must be a whole number.");
      if (v.repl === "no" && n > idx.length) throw new Error(`Only ${idx.length} rows are available; without replacement the sample cannot be larger.`);
      if (!replaceOK("Sampling")) return;
      const U = rng(v.seed), pool = idx.slice(), pick = [];
      for (let i = 0; i < n; i++) { if (v.repl === "yes") pick.push(pool[Math.floor(U() * pool.length)]); else { const j = i + Math.floor(U() * (pool.length - i)); [pool[i], pool[j]] = [pool[j], pool[i]]; pick.push(pool[i]); } }
      const name = D.name; loadTable(name + "_sample", [D.cols.slice()].concat(pick.map((i) => D.rows[i].slice())));
      card("Random sample", `${n} rows ${v.repl === "yes" ? "with" : "without"} replacement from ${name}`, say("A simple random sample: every row had the same chance to be picked. The new table replaces the old one; reopen the original file to go back."));
    }, "Sample");
  }
  function columnUI() {
    needData();
    dialog("Data: Rename or delete a column", [sel("x", "Column", D.cols), sel("act", "Action", [["rename", "rename"], ["delete", "delete"]], "rename"), { name: "nm", label: "New name (for rename)", type: "text" }], (v) => {
      const j = D.cols.indexOf(v.x);
      if (v.act === "delete") { D.cols.splice(j, 1); D.rows.forEach((r) => r.splice(j, 1)); } else { if (!v.nm.trim()) throw new Error("Give a new name."); D.cols[j] = v.nm.trim(); }
      inferTypes(); renderGrid(); changed();
    }, "Apply");
  }
  function typeUI() {
    needData();
    dialog("Data: Set a variable's type", [sel("x", "Column", D.cols), sel("t", "Type", [["continuous", "Continuous (ruler)"], ["ordinal", "Ordinal"], ["nominal", "Nominal (three circles)"], ["id", "ID"]], "nominal")], (v) => { D.manual[v.x] = v.t; inferTypes(); renderGrid(); changed(); }, "Set");
  }
  function filterUI() {
    needData();
    const problem = (f) => { const t = String(f == null ? "" : f).trim(); if (!t) return ""; try { SW.compileFormula(t, D.cols, (c) => D.rows.map((r) => r[D.cols.indexOf(c)])); return ""; } catch (e) { return "Filter could not be read: " + e.message; } };
    dialog("Data: Filter", [{ name: "f", label: "Keep rows where", type: "text", value: D.filter, placeholder: 'Year == "Freshman" and Commute_Minutes < 30', hint: "Use column names as written; text in quotes; operators == != < <= > >= and or (AND, OR, &&, || work too). Blank removes the filter. Every analysis uses only the kept rows.", check: (raw) => problem(raw.f) }], (v) => { const bad = problem(v.f); if (bad) throw fieldErr("f", bad); D.filter = v.f.trim(); renderGrid(); persist(); card("Filter", D.filter || "removed", say(D.filter ? `Analyses now use the ${activeIdx().length} rows that satisfy: ${esc(D.filter)}. Greyed rows in the table are excluded.` : "All rows are back in use.")); }, "Apply");
  }
  // ================= Results: Script. Every step on the page in order, with its choices and the R code that does the same =================
  const rName = (s) => (/^[A-Za-z.][A-Za-z0-9._]*$/.test(String(s)) && !/^\.\d/.test(String(s)) ? String(s) : "`" + String(s).replace(/`/g, "") + "`");
  const rStr = (s) => JSON.stringify(String(s)), rVec = (arr, asNames) => `c(${(arr || []).map((q) => (asNames ? rName(q) : rStr(q))).join(", ")})`;
  const rAlt = (a) => ({ two: "two.sided", greater: "greater", less: "less" }[a] || "two.sided"), rConf = (v) => (v.conf && Number(v.conf) !== 0.95 ? `, conf.level = ${v.conf}` : "");
  const rFilter = (f) => String(f || "").replace(/\s+and\s+/gi, " & ").replace(/\s+or\s+/gi, " | ").replace(/\bnot\s+/gi, "!").replace(/&&/g, "&").replace(/\|\|/g, "|");
  const rTerms = (v) => { const t = (v.xs || []).concat(v.cs || []).map(rName); (v.sq || []).forEach((s) => t.push(`I(${rName(s)}^2)`)); String(v.ix || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => t.push(s.split(/\s*[*:×]\s*/).map(rName).join(":"))); return t.length ? t.join(" + ") : "1"; };
  const rRefs = (v) => Object.entries(parseRefsSafe(v.refs)).map(([c, l]) => `d$${rName(c)} <- relevel(factor(d$${rName(c)}), ref = ${rStr(l)})`);
  const parseRefsSafe = (txt) => { const o = {}; String(txt || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((p) => { const i = p.indexOf("="); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; };
  const rGG = (aes, geom, v, extra) => { let g = `ggplot(d, aes(${aes})) + ${geom}`; if (extra) g += extra; if (v.gtitle || v.xlab || v.ylab) g += ` + labs(${[v.gtitle ? `title = ${rStr(v.gtitle)}` : "", v.xlab ? `x = ${rStr(v.xlab)}` : "", v.ylab ? `y = ${rStr(v.ylab)}` : ""].filter(Boolean).join(", ")})`; if (v.facet) g += ` + facet_wrap(~ ${rName(v.facet)})`; if (v.theme === "minimal") g += " + theme_minimal()"; else if (v.theme === "classic") g += " + theme_classic()"; if (v.palette === "okabe") g += ' + scale_fill_manual(values = palette.colors(palette = "Okabe-Ito")) + scale_color_manual(values = palette.colors(palette = "Okabe-Ito"))'; else if (v.palette === "viridis") g += " + scale_fill_viridis_d() + scale_color_viridis_d()"; else if (v.palette === "gray") g += " + scale_fill_grey() + scale_color_grey()"; if (v.logx) g += " + scale_x_log10()"; if (v.logy) g += " + scale_y_log10()"; const xr = parseRange(v.xrange), yr = parseRange(v.yrange); if (xr || yr) g += ` + coord_cartesian(${[xr ? `xlim = c(${xr.join(", ")})` : "", yr ? `ylim = c(${yr.join(", ")})` : ""].filter(Boolean).join(", ")})`; String(v.ref || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((r) => { const m = r.match(/^([xy])\s*=\s*(-?[\d.]+)/i); if (m) g += m[1].toLowerCase() === "y" ? ` + geom_hline(yintercept = ${m[2]}, linetype = "dashed")` : ` + geom_vline(xintercept = ${m[2]}, linetype = "dashed")`; }); if (v.legend === "none") g += ' + theme(legend.position = "none")'; else if (v.legend === "top" || v.legend === "bottom") g += ` + theme(legend.position = "${v.legend}")`; return g; };
  const R_OF = {
    "Data | Filters": (v) => (v.f && v.f.trim() ? [`d <- subset(d, ${rFilter(v.f)})`] : ["# filter removed: d is the whole table again"]),
    "Data | Compute": (v) => [`d$${rName((v.nm || "new_var").trim().replace(/\s+/g, "_"))} <- with(d, ${v.f})`],
    "Data | Transform": (v) => [`d$${rName((v.nm || "recoded").trim().replace(/\s+/g, "_"))} <- dplyr::recode(d$${rName(v.x)}, ${String(v.rules || "").split("\n").map((l) => l.split("=")).filter((p) => p.length === 2).map(([a, b]) => `${rStr(a.trim())} = ${rStr(b.trim())}`).join(", ")}${v.else && v.else.trim() ? `, .default = ${rStr(v.else.trim())}` : ""})  # ranges (0 to 29 = short) become cut() in R`],
    "Data | Add z-score column": (v) => [`d$${rName("z_" + v.x)} <- as.numeric(scale(d$${rName(v.x)}))`],
    "Data | Bin into classes": (v) => [`d$${rName((v.nm || "classes").trim().replace(/\s+/g, "_"))} <- cut(d$${rName(v.x)}, breaks = seq(${v.start}, max(d$${rName(v.x)}, na.rm = TRUE) + ${v.w}, by = ${v.w}), right = FALSE)`],
    "Data | Stack columns": (v) => [`d <- pivot_longer(d, cols = ${rVec(v.vars, true)}, names_to = ${rStr(v.gn || "group")}, values_to = ${rStr(v.vn || "value")})`],
    "Data | Reshape: wide to long": (v) => [`d <- pivot_longer(d, cols = ${rVec(v.vars, true)}, names_to = ${rStr(v.nn || "measure")}, values_to = ${rStr(v.vn || "value")}${v.blank ? "" : ", values_drop_na = TRUE"})`],
    "Data | Reshape: long to wide": (v) => [`d <- pivot_wider(d, id_cols = ${rVec(v.ids, true)}, names_from = ${rName(v.nf)}, values_from = ${rName(v.vf)}${v.prefix ? `, names_prefix = ${rStr(v.prefix)}` : ""}${v.dup === "first" ? ", values_fn = first" : v.dup === "mean" ? ", values_fn = mean" : v.dup === "count" ? ", values_fn = length" : ""})`],
    "Data | Merge with another table (join)": (v) => [`other <- read.csv(${rStr(v.src === "sample" ? v.f2 : "other.csv")})`, `d <- ${({ left: "left_join", inner: "inner_join", full: "full_join" })[v.how] || "left_join"}(d, other, by = ${(v.k2 || "").trim() && v.k2.trim() !== v.k1 ? `c(${rStr(v.k1)} = ${rStr(v.k2.trim())})` : rStr(v.k1)})`],
    "Data | Group by and summarize": (v) => { const gs = [v.g].concat(v.g2 && v.g2 !== v.g ? [v.g2] : []), st = (v.st || []).length ? v.st : ["n"]; return [`${v.asTable ? "d <- " : ""}d %>% group_by(${gs.map(rName).join(", ")}) %>% summarise(${[st.includes("n") ? "n = n()" : ""].concat((v.ys || []).flatMap((y) => st.filter((s) => s !== "n").map((s) => `${rName(y + "_" + s)} = ${s === "blanks" ? `sum(is.na(${rName(y)}))` : `${s}(${rName(y)}, na.rm = TRUE)`}`))).filter(Boolean).join(", ")})`]; },
    "Data | Clean rows (blanks, duplicates)": (v) => [v.na ? 'd[d == "NA" | d == "N/A" | d == "." | d == "-" | d == "?"] <- NA' : "", v.trim ? "d <- mutate(d, across(where(is.character), trimws))" : "", v.dup ? "d <- distinct(d)" : "", (v.blank || []).length ? `d <- drop_na(d, ${v.blank.map(rName).join(", ")})` : "", v.empty ? "d <- d[rowSums(!is.na(d) & d != \"\") > 0, ]" : ""].filter(Boolean),
    "Data | Simulate random data": (v) => { const f = { normal: `rnorm(${v.rows}, ${v.a}, ${v.b})`, unif: `runif(${v.rows}, ${v.a}, ${v.b})`, dunif: `sample(${v.a}:${v.b}, ${v.rows}, replace = TRUE)`, binom: `rbinom(${v.rows}, ${v.a}, ${v.b})`, pois: `rpois(${v.rows}, ${v.a})`, exp: `rexp(${v.rows}, 1 / ${v.a})`, bern: `rbinom(${v.rows}, 1, ${v.a})` }[v.dist] || "..."; return [v.seed !== "" && v.seed != null ? `set.seed(${v.seed})` : "", `d <- data.frame(${Array.from({ length: Math.min(Number(v.cols) || 1, 3) }, (_, i) => `x${i + 1} = ${f}`).join(", ")}${Number(v.cols) > 3 ? ", ..." : ""})`].filter(Boolean); },
    "Data | Random sample of rows": (v) => [v.seed !== "" && v.seed != null ? `set.seed(${v.seed})` : "", `d <- d[sample(nrow(d), ${v.n}, replace = ${v.repl ? "TRUE" : "FALSE"}), ]`].filter(Boolean),
    "Exploration | Descriptives": (v) => [`psych::describe(d[, ${rVec(v.vars, true)}])`].concat(v.by ? [`d %>% group_by(${rName(v.by)}) %>% summarise(across(${rVec(v.vars, true)}, list(n = ~sum(!is.na(.x)), mean = ~mean(.x, na.rm = TRUE), sd = ~sd(.x, na.rm = TRUE), median = ~median(.x, na.rm = TRUE))))`] : []).concat(v.freq ? (v.vars || []).map((c) => `table(d$${rName(c)})`) : []),
    "Exploration | Scatterplot": (v) => [rGG(`x = ${rName(v.x)}, y = ${rName(v.y)}${v.by ? `, color = ${rName(v.by)}` : ""}`, "geom_point()", v, v.line ? ' + geom_smooth(method = "lm", se = FALSE)' : "")],
    "Graph | Bar Plot": (v) => [rGG(`x = ${rName(v.x)}${v.by ? `, fill = ${rName(v.by)}` : ""}`, v.type === "rel" || v.type === "pct" ? `geom_bar(aes(y = after_stat(count / sum(count)))${v.by ? ', position = "dodge"' : ""})` : `geom_bar(${v.by ? 'position = "dodge"' : ""})`, v, v.horiz ? " + coord_flip()" : "")],
    "Graph | Pie Chart": (v) => [`ggplot(d, aes(x = "", fill = ${rName(v.x)})) + geom_bar(width = 1) + coord_polar("y") + theme_void()`],
    "Graph | Histogram": (v) => [rGG(`x = ${rName(v.x)}${v.by ? `, fill = ${rName(v.by)}` : ""}`, `geom_histogram(${[v.bw ? `binwidth = ${v.bw}` : "bins = 10", v.start !== "" && v.start != null ? `boundary = ${v.start}` : "", "closed = \"left\"", 'color = "white"'].filter(Boolean).join(", ")})`, v, v.normal ? ` + stat_function(fun = function(x) dnorm(x, mean(d$${rName(v.x)}, na.rm = TRUE), sd(d$${rName(v.x)}, na.rm = TRUE)) * nrow(d) * ${v.bw || "binwidth"})` : "")],
    "Graph | Dotplot": (v) => [rGG(`x = ${rName(v.x)}${v.by ? `, fill = ${rName(v.by)}` : ""}`, "geom_dotplot(binwidth = 1, method = \"histodot\")", v)],
    "Graph | Boxplot": (v) => ((v.vars || []).length > 1 ? [`long <- pivot_longer(d, ${rVec(v.vars, true)}, names_to = "variable", values_to = "value")`, rGG(`x = variable, y = value`, "geom_boxplot()", v, v.horiz ? " + coord_flip()" : "")] : [rGG(`${v.by ? `x = ${rName(v.by)}, ` : 'x = "", '}y = ${rName((v.vars || [])[0])}`, "geom_boxplot()", v, v.horiz ? " + coord_flip()" : "")]),
    "Graph | Stem and Leaf": (v) => [`stem(d$${rName(v.x)}${v.unit ? `, scale = 1` : ""})`],
    "Graph | Scatter Plot": (v) => [rGG(`x = ${rName(v.x)}, y = ${rName(v.y)}${v.by ? `, color = ${rName(v.by)}` : ""}`, "geom_point()", v, v.line ? ' + geom_smooth(method = "lm", se = FALSE)' : "")],
    "Graph | QQ Plot": (v) => [rGG(`sample = ${rName(v.x)}${v.by ? `, color = ${rName(v.by)}` : ""}`, "stat_qq() + stat_qq_line()", v)],
    "T-Tests | Independent Samples T-Test": (v) => (v.mode === "summary" ? [`BSDA::tsum.test(mean.x = ${v.m1}, s.x = ${v.s1}, n.x = ${v.n1}, mean.y = ${v.m2}, s.y = ${v.s2}, n.y = ${v.n2}, alternative = ${rStr(rAlt(v.alt))}, var.equal = ${v.welch ? "FALSE" : "TRUE"}${rConf(v)})`] : [`t.test(${rName(v.x)} ~ ${rName(v.g)}, data = d, var.equal = ${v.welch ? "FALSE" : "TRUE"}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`].concat(v.es ? [`effectsize::cohens_d(${rName(v.x)} ~ ${rName(v.g)}, data = d)`] : [])),
    "T-Tests | Paired Samples T-Test": (v) => [`t.test(d$${rName(v.a)}, d$${rName(v.b)}, paired = TRUE, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`],
    "T-Tests | One Sample T-Test": (v) => (v.mode === "summary" ? [`BSDA::tsum.test(mean.x = ${v.xbar}, s.x = ${v.s}, n.x = ${v.n}, mu = ${v.mu0}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`] : [`t.test(d$${rName(v.x)}, mu = ${v.mu0}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`]),
    "T-Tests | One Sample Z-Test (sigma known)": (v) => (v.mode === "summary" ? [`BSDA::zsum.test(mean.x = ${v.xbar}, sigma.x = ${v.sigma}, n.x = ${v.n}, mu = ${v.mu0}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`] : [`BSDA::z.test(d$${rName(v.x)}, mu = ${v.mu0}, sigma.x = ${v.sigma}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`]),
    "T-Tests | Two Sample Z-Test (sigmas known)": (v) => [`BSDA::zsum.test(mean.x = ${v.m1}, sigma.x = ${v.s1}, n.x = ${v.n1}, mean.y = ${v.m2}, sigma.y = ${v.s2}, n.y = ${v.n2}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`],
    "ANOVA | One-Way ANOVA": (v) => [`fit <- aov(${rName(v.x)} ~ ${rName(v.g)}, data = d); summary(fit)`].concat(v.welch ? [`oneway.test(${rName(v.x)} ~ ${rName(v.g)}, data = d)  # Welch`] : [], v.levene ? [`car::leveneTest(${rName(v.x)} ~ ${rName(v.g)}, data = d)`] : [], v.tukey ? ["TukeyHSD(fit)"] : [], v.fisher ? [`pairwise.t.test(d$${rName(v.x)}, d$${rName(v.g)}, p.adjust.method = "none")  # Fisher's LSD`] : []),
    "ANOVA | Two-Way ANOVA": (v) => [`fit <- lm(${rName(v.y)} ~ ${rName(v.a)} ${v.inter ? "*" : "+"} ${rName(v.b)}, data = d); car::Anova(fit, type = 2)`],
    "ANOVA | ANCOVA": (v) => [`fit <- lm(${rName(v.y)} ~ ${(v.xs || []).map(rName).join(" + ")} + ${rName(v.g)}, data = d); car::Anova(fit, type = 2)`].concat(v.post ? [`emmeans::emmeans(fit, pairwise ~ ${rName(v.g)})`] : []),
    "ANOVA | Repeated Measures and Mixed ANOVA": (v) => [`d$id <- seq_len(nrow(d)); long <- pivot_longer(d, ${rVec(v.cols, true)}, names_to = "condition", values_to = "value")`, `afex::aov_ez(id = "id", dv = "value", data = long, within = "condition"${v.g ? `, between = ${rStr(v.g)}` : ""})`].concat(v.post ? ['pairwise.t.test(long$value, long$condition, paired = TRUE, p.adjust.method = "holm")'] : []),
    "ANOVA | MANOVA": (v) => [`fit <- manova(cbind(${(v.ys || []).map(rName).join(", ")}) ~ ${rName(v.g)}, data = d); summary(fit, test = "Pillai")`].concat(v.uni ? ["summary.aov(fit)"] : []),
    "ANOVA | Kruskal-Wallis (three or more groups)": (v) => [`kruskal.test(${rName(v.x)} ~ ${rName(v.g)}, data = d)`, `pairwise.wilcox.test(d$${rName(v.x)}, d$${rName(v.g)}, p.adjust.method = "holm")`],
    "ANOVA | Friedman (nonparametric repeated measures)": (v) => [`friedman.test(as.matrix(d[, ${rVec(v.cols, true)}]))`],
    "Regression | Correlation Matrix": (v) => [`cor(d[, ${rVec(v.vars, true)}], use = "pairwise.complete.obs"${v.spear && !v.pear ? ', method = "spearman"' : ""})`].concat(v.sig ? [`Hmisc::rcorr(as.matrix(d[, ${rVec(v.vars, true)}])${v.spear && !v.pear ? ', type = "spearman"' : ""})`] : []),
    "Regression | Linear Regression": (v) => [`fit <- lm(${rName(v.y)} ~ ${rName(v.x)}, data = d); summary(fit)`].concat(v.ci ? [`confint(fit${v.conf && Number(v.conf) !== 0.95 ? `, level = ${v.conf}` : ""})`] : [], v.pred !== "" && v.pred != null ? [`predict(fit, newdata = data.frame(${rName(v.x)} = ${v.pred}), interval = "prediction")`] : [], v.resid || v.qq ? ["par(mfrow = c(2, 2)); plot(fit)"] : []),
    "Regression | Sensitivity to a lurking variable": (v) => [`fit <- lm(${rName(v.y)} ~ ${[v.d].concat(v.xs || [], v.cs || []).map(rName).join(" + ")}, data = d)`, `sensemakr::sensemakr(model = fit, treatment = ${rStr(v.d)}${v.bench ? `, benchmark_covariates = ${rStr(v.bench)}, kd = 1:3` : ""})`],
    "Frequencies | 2 Outcomes: Binomial test": (v) => (v.mode === "data" ? [`x <- sum(d$${rName(v.x)} == ${rStr(v.succ)}); n <- sum(!is.na(d$${rName(v.x)}))`, `binom.test(x, n, p = ${v.p0}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`] : [`binom.test(${v.xs}, ${v.n}, p = ${v.p0}, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`]),
    "Frequencies | One proportion: z test": (v) => (v.mode === "data" ? [`x <- sum(d$${rName(v.x)} == ${rStr(v.succ)}); n <- sum(!is.na(d$${rName(v.x)}))`, `prop.test(x, n, p = ${v.p0}, correct = FALSE, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})  # chi-square = z^2`] : [`prop.test(${v.xs}, ${v.n}, p = ${v.p0}, correct = FALSE, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})  # chi-square = z^2`]),
    "Frequencies | Two proportions: z test": (v) => (v.mode === "data" ? [`prop.test(table(d$${rName(v.g)}, d$${rName(v.x)} == ${rStr(v.succ)})[, 2:1], correct = FALSE, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`] : [`prop.test(c(${v.x1}, ${v.x2}), c(${v.n1}, ${v.n2}), correct = FALSE, alternative = ${rStr(rAlt(v.alt))}${rConf(v)})`]),
    "Frequencies | N Outcomes: chi-square Goodness of fit": (v) => { const p = v.expected === "custom" && v.props ? `, p = c(${String(v.props).split(/[,\s]+/).filter(Boolean).join(", ")}), rescale.p = TRUE` : ""; return v.mode === "data" ? [`chisq.test(table(d$${rName(v.x)})${p})`] : [`chisq.test(c(${String(v.counts || "").split("\n").map((l) => l.split(":")).filter((q) => q.length === 2).map((q) => q[1].trim()).join(", ")})${p})`]; },
    "Frequencies | Contingency Tables: Independent Samples": (v) => (v.mode === "data" ? [`tab <- table(d$${rName(v.r)}, d$${rName(v.c)}); tab`] : ["tab <- as.table(rbind(...))  # the counts you typed"]).concat(v.chi ? ["chisq.test(tab, correct = FALSE)", v.exp ? "chisq.test(tab)$expected" : ""] : [], v.fisher ? [`fisher.test(tab${v.fisherAlt && v.fisherAlt !== "two" ? `, alternative = ${rStr(v.fisherAlt)}` : ""})`] : [], v.orrr ? ["epitools::oddsratio(tab); epitools::riskratio(tab)"] : [], v.pcRow || v.pcCol || v.pcTot ? [`prop.table(tab${v.pcRow ? ", 1" : v.pcCol ? ", 2" : ""})`] : []).filter(Boolean),
    "distrACTION | Binomial Distribution": (v) => [`dbinom(k, size = ${v.n}, prob = ${v.p}); pbinom(k, ${v.n}, ${v.p})  # P(X = k), P(X <= k)`],
    "distrACTION | Poisson Distribution": (v) => [`dpois(k, lambda = ${v.lam}); ppois(k, ${v.lam})`],
    "distrACTION | Geometric Distribution": (v) => [`dgeom(k - 1, prob = ${v.p})  # R counts failures before the first success`],
    "distrACTION | Hypergeometric Distribution": (v) => [`dhyper(k, m = ${v.K}, n = ${v.N} - ${v.K}, k = ${v.n})`],
    "distrACTION | Normal Distribution": (v) => [`pnorm(x, mean = ${v.mu}, sd = ${v.sd}); qnorm(p, ${v.mu}, ${v.sd})`],
    "distrACTION | Uniform (continuous)": (v) => [`punif(x, min = ${v.lo}, max = ${v.hi})`],
    "distrACTION | Exponential Distribution": (v) => [`pexp(x, rate = 1 / ${v.m})`],
    "distrACTION | T-Distribution": (v) => [`pt(t, df = ${v.df}); qt(p, ${v.df})`],
    "distrACTION | Chi-square and F": (v) => (v.dist === "f" ? [`pf(x, ${v.df1}, ${v.df2}); qf(1 - alpha, ${v.df1}, ${v.df2})`] : [`pchisq(x, df = ${v.df1}); qchisq(1 - alpha, ${v.df1})`]),
    "distrACTION | Sample size for a margin of error": (v) => (v.kind === "p" ? [`ceiling(qnorm(1 - (1 - ${v.conf || 0.95}) / 2)^2 * ${v.p} * (1 - ${v.p}) / ${v.me}^2)`] : [`ceiling((qnorm(1 - (1 - ${v.conf || 0.95}) / 2) * ${v.s} / ${v.me})^2)`]),
    "distrACTION | Power and sample size for a test": (v) => powerR(v), "Advanced | Power and Sample Size": (v) => powerR(v),
    "Nonparametric | Mann-Whitney U (two groups)": (v) => [`wilcox.test(${rName(v.x)} ~ ${rName(v.g)}, data = d, alternative = ${rStr(rAlt(v.alt))})`],
    "Nonparametric | Wilcoxon signed-rank and sign test (paired)": (v) => (v.const !== "" && v.const != null ? [`wilcox.test(d$${rName(v.a)}, mu = ${v.const}, alternative = ${rStr(rAlt(v.alt))})`] : [`wilcox.test(d$${rName(v.a)}, d$${rName(v.b)}, paired = TRUE, alternative = ${rStr(rAlt(v.alt))})`, `BSDA::SIGN.test(d$${rName(v.a)}, d$${rName(v.b)})`]),
    "Learn | Bootstrap: an interval with no formula": (v) => [v.seed !== "" && v.seed != null ? `set.seed(${v.seed})` : "", `b <- boot::boot(d$${rName(v.x)}, function(x, i) ${v.stat === "median" ? "median" : v.stat === "sd" ? "sd" : "mean"}(x[i]), R = ${v.reps || 2000}); boot::boot.ci(b, type = "perc"${rConf(v).replace("conf.level", "conf")})`].filter(Boolean),
    "Learn | Permutation: a p-value by reshuffling": (v) => [v.seed !== "" && v.seed != null ? `set.seed(${v.seed})` : "", `obs <- diff(tapply(d$${rName(v.x)}, d$${rName(v.g)}, mean)); perm <- replicate(${v.reps || 5000}, diff(tapply(d$${rName(v.x)}, sample(d$${rName(v.g)}), mean))); mean(abs(perm) >= abs(obs))`].filter(Boolean),
    "Advanced | Multiple Linear Regression": (v) => rRefs(v).concat([`fit <- lm(${rName(v.y)} ~ ${rTerms(v)}, data = d); summary(fit); confint(fit${v.conf && Number(v.conf) !== 0.95 ? `, level = ${v.conf}` : ""})`], v.vif ? ["car::vif(fit)"] : [], v.diag ? ["influence.measures(fit); cooks.distance(fit)"] : [], v.resid || v.qq ? ["par(mfrow = c(2, 2)); plot(fit)"] : [], (v.red || []).length ? [`anova(lm(${rName(v.y)} ~ ${v.red.map(rName).join(" + ")}, data = d), fit)`] : [], v.step ? ["step(fit, direction = \"backward\")  # teaching demo only"] : []),
    "Advanced | Mixed-Effects Model (nested or repeated data)": (v) => [`fit <- lmerTest::lmer(${rName(v.y)} ~ ${(v.xs || []).concat(v.cs || []).map(rName).join(" + ") || "1"} + (${v.slope ? `1 + ${rName(v.slope)}` : "1"} | ${rName(v.g)}), data = d, REML = ${v.method === "ml" ? "FALSE" : "TRUE"}); summary(fit)`, "performance::icc(fit); performance::r2(fit)"].concat(v.lrt ? [`ranova(fit)  # or anova(fit, lm(...))`] : [], v.blup ? ["lme4::ranef(fit)"] : []),
    "Advanced | Logistic Regression": (v) => rRefs(v).concat([`fit <- glm(I(${rName(v.y)} == ${rStr(v.succ)}) ~ ${rTerms(v)}, family = binomial, data = d); summary(fit)`, `exp(cbind(OR = coef(fit), confint(fit${v.conf && Number(v.conf) !== 0.95 ? `, level = ${v.conf}` : ""})))`]),
    "Advanced | Count Regression: Poisson and Negative Binomial": (v) => { const off = v.exp ? ` + offset(log(${rName(v.exp)}))` : ""; return rRefs(v).concat(v.fam !== "nb" ? [`fit <- glm(${rName(v.y)} ~ ${rTerms(v)}${off}, family = poisson, data = d); summary(fit); exp(coef(fit))`, "sum(residuals(fit, type = \"pearson\")^2) / fit$df.residual  # dispersion"] : [], v.fam !== "poisson" ? [`nb <- MASS::glm.nb(${rName(v.y)} ~ ${rTerms(v)}${off}, data = d); summary(nb); exp(coef(nb))`] : []); },
    "Advanced | Multinomial Logistic Regression": (v) => [`fit <- nnet::multinom(${v.base ? `relevel(factor(${rName(v.y)}), ref = ${rStr(v.base)})` : rName(v.y)} ~ ${(v.xs || []).concat(v.cs || []).map(rName).join(" + ")}, data = d); summary(fit); exp(coef(fit))`],
    "Advanced | Ordinal Logistic Regression": (v) => [`d$${rName(v.y)} <- factor(d$${rName(v.y)}, levels = ${rVec(String(v.order || "").split(",").map((s) => s.trim()).filter(Boolean))}, ordered = TRUE)`, `fit <- MASS::polr(${rName(v.y)} ~ ${(v.xs || []).concat(v.cs || []).map(rName).join(" + ")}, data = d, Hess = TRUE); summary(fit); exp(coef(fit))`],
    "Advanced | Variance tests (one SD or two SDs)": (v) => (v.which === "one" ? [v.mode === "data" ? `EnvStats::varTest(d$${rName(v.x)}, sigma.squared = ${v.sigma0}^2, alternative = ${rStr(rAlt(v.alt))})` : `# (n - 1) s^2 / sigma0^2 = ${v.n1} - 1) * ${v.s1}^2 / ${v.sigma0}^2 against qchisq`] : [v.mode === "data" ? `var.test(${rName(v.x)} ~ ${rName(v.g)}, data = d, alternative = ${rStr(rAlt(v.alt))})` : `# F = ${v.s1}^2 / ${v.s2}^2 on (${v.n1} - 1, ${v.n2} - 1) df: pf(F, ${v.n1} - 1, ${v.n2} - 1)`]),
    "Advanced | McNemar test (paired yes or no)": (v) => (v.mode === "data" ? [`mcnemar.test(table(d$${rName(v.a)}, d$${rName(v.b)}), correct = FALSE)`] : [`mcnemar.test(matrix(c(NA, ${v.bc}, ${v.cb}, NA), 2), correct = FALSE)  # the two discordant cells`]),
    "Advanced | Cochran-Armitage trend test": (v) => (v.mode === "data" ? [`tab <- table(d$${rName(v.g)}, d$${rName(v.x)} == ${rStr(v.succ)}); prop.trend.test(tab[, "TRUE"], rowSums(tab))`] : [`prop.trend.test(c(${v.s}), c(${v.n}))`]),
    "Advanced | Time Series": (v) => [`y <- ts(d$${rName(v.y)}${v.period ? `, frequency = ${v.period}` : ""})`].concat(v.dec ? [`plot(decompose(y${v.dtype === "mult" ? ', type = "multiplicative"' : ""}))`] : [], v.acf ? [`acf(y, lag.max = ${v.lags || 20})`] : [], v.trend ? ["fit <- lm(y ~ seq_along(y)); lmtest::dwtest(fit)"] : [], v.smooth ? [`forecast::holt(y, h = ${v.h || 6})`] : []),
    "Advanced | Principal Component Analysis": (v) => [`pc <- prcomp(d[, ${rVec(v.vars, true)}], scale. = TRUE); summary(pc); pc$rotation`],
    "Advanced | Exploratory Factor Analysis": (v) => [`psych::fa(d[, ${rVec(v.vars, true)}], nfactors = ${v.m || 1}, rotate = ${rStr(v.rot || "varimax")}, fm = "minres")`, `psych::fa.parallel(d[, ${rVec(v.vars, true)}])`],
    "Advanced | Reliability (Cronbach's alpha)": (v) => [`psych::alpha(d[, ${rVec(v.vars, true)}]${(v.rev || "").trim() ? `, keys = ${rVec(String(v.rev).split(",").map((s) => s.trim()).filter(Boolean))}` : ""})`],
    "Advanced | k-means Clustering": (v) => [v.seed !== "" && v.seed != null ? `set.seed(${v.seed})` : "", `km <- kmeans(${v.std === false ? `d[, ${rVec(v.vars, true)}]` : `scale(d[, ${rVec(v.vars, true)}])`}, centers = ${v.k || 3}, nstart = 25); km$centers; km$size`].concat(v.add ? ["d$cluster <- km$cluster"] : []).filter(Boolean),
    "Advanced | Survival Analysis: Kaplan-Meier, log-rank, Cox": (v) => { const s = `survival::Surv(${rName(v.t)}, ${rName(v.e)} == ${rStr(v.succ)})`; return [`km <- survival::survfit(${s} ~ ${v.g ? rName(v.g) : "1"}, data = d); km; plot(km)`].concat(v.g ? [`survival::survdiff(${s} ~ ${rName(v.g)}, data = d)`] : [], (v.xs || []).length || (v.cs || []).length ? [`cox <- survival::coxph(${s} ~ ${(v.xs || []).concat(v.cs || []).map(rName).join(" + ")}, data = d); summary(cox); survival::cox.zph(cox)`] : []); },
    "Advanced | Bootstrap confidence interval": (v) => R_OF["Learn | Bootstrap: an interval with no formula"](v), "Advanced | Permutation test": (v) => R_OF["Learn | Permutation: a p-value by reshuffling"](v),
    "Advanced | Bayesian Inference (conjugate priors)": (v) => (v.kind === "prop" || v.kind === "p" ? [`# posterior for a proportion: Beta(${v.a} + successes, ${v.b} + failures); qbeta(c(0.025, 0.975), a, b)`] : [`# normal mean with known sigma: posterior mean = weighted average of prior mean and x bar; see the card's formula`]),
    "Learn | Bayesian: prior, data, posterior": (v) => R_OF["Advanced | Bayesian Inference (conjugate priors)"](v),
  };
  function powerR(v) { const sig = v.alpha ? `, sig.level = ${v.alpha}` : "", alt = v.alt && v.alt !== "two" ? `, alternative = ${rStr(v.alt === "greater" || v.alt === "less" ? "greater" : "two.sided")}` : "", want = v.mode === "n" || !v.n ? `power = ${v.pow || 0.8}` : `n = ${v.n}`; const t = v.test || "t2"; if (t === "t1") return [`pwr::pwr.t.test(d = ${v.d}, ${want}${sig}, type = "one.sample"${alt})`]; if (t === "t2") return [`pwr::pwr.t.test(d = ${v.d}, ${want}${sig}${alt})`]; if (t === "prop1") return [`pwr::pwr.p.test(h = pwr::ES.h(${v.p1}, ${v.p0}), ${want}${sig}${alt})`]; if (t === "prop2") return [`pwr::pwr.2p.test(h = pwr::ES.h(${v.p0}, ${v.p1}), ${want}${sig}${alt})`]; if (t === "anova") return [`pwr::pwr.anova.test(k = ${v.k}, f = ${v.d}, ${want}${sig})`]; if (t === "corr") return [`pwr::pwr.r.test(r = ${v.d}, ${want}${sig}${alt})`]; if (t === "chisq") return [`pwr::pwr.chisq.test(w = ${v.d}, df = ${v.k}, ${want}${sig})`]; return ["# see the pwr package"]; }
  const optionLines = (redo) => {
    const out = []; (redo.fields || []).forEach((fd) => { if (!fd || fd.type === "note") return; let val = redo.values[fd.name]; if (val === undefined || val === null || val === "" || val === false || (Array.isArray(val) && !val.length)) return;
      if (fd.type === "check") val = "yes"; else if (Array.isArray(val)) val = val.join(", "); else if ((fd.type === "select" || fd.type === "multi") && Array.isArray(fd.options)) { const o = fd.options.find((q) => (Array.isArray(q) ? q[0] : q) === String(val)); if (o && Array.isArray(o)) val = o[1]; }
      out.push(`${String(fd.label || fd.name).replace(/\s*\(optional\)$/i, "").replace(/\s*\(.*hold Cmd.*\)$/i, "")}: ${val}`); }); return out;
  };
  function scriptUI() {
    const cards = ["#out", "#outG"].flatMap((id) => [...$(id).children].filter((c) => c._redo && !c._skip && !NOTE_FNS.has(c._redo.fn) && FN_KEY.has(c._redo.fn)).map((c) => ({ c, id }))).sort((a, b) => Number(a.c.id.slice(4)) - Number(b.c.id.slice(4)));
    const when = new Date(), pad = (n) => String(n).padStart(2, "0"), stamp = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
    const T = [], R = [];
    T.push(`Stats Without Walls, script of this page (${stamp})`, "Every step on the Analyses and Graphs tabs, oldest first, with the choices made in each dialog. The R column shows the call that does the same.", "");
    R.push(`# Stats Without Walls: R script for this page, ${stamp}`, "# Written by the app from the steps on the page; packages are named in full (dplyr::), so install what you use.", "library(tidyverse)", "");
    const file = sampleFileFor(D.name) || null; // a sample, even once changed: the changes that went through a dialog are steps below
    T.push(`Data: ${D.name || "(none)"}${file ? " (sample dataset)" : D.rows.length ? " (your own table)" : ""}, ${D.rows.length} rows, ${D.cols.length} columns.${D.filter ? ` Filter: ${D.filter}` : ""}`, "");
    if (D.rows.length) R.push(file ? `d <- read.csv("https://learnwithoutwalls.com/stats/data/${file}")${D.origin !== "sample" ? "  # the sample as shipped; edits typed into cells are not steps" : ""}` : `d <- read.csv(${rStr((D.name || "data") + ".csv")})  # Data, Download data as CSV gives this file`); if (D.filter) R.push(`d <- subset(d, ${rFilter(D.filter)})`); R.push("");
    cards.forEach(({ c, id }, i) => {
      const key = FN_KEY.get(c._redo.fn), title = (c.querySelector("h2") || {}).textContent || key; const opts = optionLines(c._redo);
      T.push(`${i + 1}. ${key.replace(" | ", " › ")}${id === "#outG" ? " (graph)" : ""}: ${title}`); opts.forEach((o) => T.push("   " + o)); T.push("");
      R.push(`## ${i + 1}. ${key.replace(" | ", " > ")}`); opts.forEach((o) => R.push("#   " + o));
      const gen = R_OF[key]; let lines = null; try { lines = gen ? gen(c._redo.values || {}) : null; } catch (e) { lines = null; }
      if (lines && lines.length) R.push(...lines); else R.push("# no one-line R equivalent is listed for this step; the Methods Guide names the method"); R.push("");
    });
    if (!cards.length) { T.push("No analyses or graphs on the page yet."); R.push("# no analyses or graphs on the page yet"); }
    const txt = T.join("\n"), rcode = R.join("\n");
    let html = say(`${cards.length} step${cards.length === 1 ? "" : "s"} on the page. Nothing here is hidden: every choice behind every card is listed, so a reader can redo the work, and the R script redoes it in R. Results, Share link and Save session carry the same steps so the app can run them again.`);
    html += `<div class="cap">The steps</div><pre class="script">${esc(txt)}</pre><div class="cap">The same steps in R</div><pre class="script rcode">${esc(rcode)}</pre>`;
    html += `<div class="tblbtns"><button type="button" data-act="dl-steps">download the steps (.txt)</button><button type="button" data-act="dl-r">download the R script (.R)</button></div>`;
    const cd = card("Script: every step, with the R code", `${cards.length} steps, ${D.name || "no data"}`, html); cd._skip = true;
    cd.querySelector('[data-act="dl-steps"]').onclick = () => downloadText(txt, (D.name || "page") + "_steps.txt"); cd.querySelector('[data-act="dl-r"]').onclick = () => downloadText(rcode, (D.name || "page") + ".R", "text/plain");
  }
  function saveSession() { const payload = { name: D.name, cols: D.cols, rows: D.rows, filter: D.filter, manual: D.manual || {}, origin: D.origin || "own", results: $("#out").innerHTML, graphs: $("#outG").innerHTML, distraction: $("#outD").innerHTML, learn: $("#outL").innerHTML, saved: new Date().toISOString() }; downloadText(JSON.stringify(payload), (D.name || "session") + ".sww.json", "application/json"); }
  // A session file can come from anyone (a classmate, an email), so nothing in it may run and nothing in it may fetch. Its
  // cards are read in an inert document (never this page, never parsed a second time), then only an allowed shape is kept:
  // the handful of text and table tags the app's own cards are built from, each with only the attributes they use. Anything
  // else that could carry behaviour or an address (a script or frame, a link or picture, an on... or src or href or style
  // that loads, an id that could stand in for one of the page's own elements) is simply not on the list, so it is dropped.
  // A tag that is not allowed but holds only text (a stray wrapper) is unwrapped so the card's words survive; a tag that
  // could carry a hidden payload (script, style, svg, math, and the like) is removed outright with everything inside it.
  const CARD_TAGS = new Set(["div", "span", "p", "pre", "em", "i", "b", "strong", "small", "sub", "sup", "br", "hr", "code", "h2", "h3", "h4", "h5", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col", "ul", "ol", "li", "dl", "dt", "dd", "details", "summary", "button", "label", "input", "select", "option", "optgroup", "fieldset", "legend", "textarea"]);
  const CARD_DROP = new Set(["script", "style", "iframe", "frame", "frameset", "object", "embed", "applet", "link", "meta", "base", "template", "noscript", "noembed", "noframes", "form", "svg", "math", "foreignobject", "picture", "source", "img", "image", "video", "audio", "track", "canvas", "xmp", "plaintext", "title", "head", "map", "area", "portal", "marquee"]);
  const CARD_ATTR = new Set(["class", "title", "role", "tabindex", "colspan", "rowspan", "scope", "open", "disabled", "checked", "selected", "readonly", "multiple", "value", "placeholder", "data-act", "data-a", "data-col", "data-f", "data-go", "data-i", "data-j", "data-k"]);
  const CARD_INPUT_TYPE = new Set(["text", "number", "checkbox", "radio", "range", "hidden"]);
  const CARD_STYLE_PROP = new Set(["font-family", "font-size", "font-weight", "font-style", "line-height", "margin", "margin-top", "margin-bottom", "margin-left", "margin-right", "padding", "color", "text-align", "white-space", "text-decoration"]);
  // an inline style is kept only when every declaration is a plain text or spacing property with a plain value: no url(), no
  // bracket or at-rule, no :// address, nothing that could position an overlay over the page or pull in a resource
  function safeStyle(v) {
    const decls = String(v).split(";").map((d) => d.trim()).filter(Boolean);
    const ok = decls.every((d) => { const i = d.indexOf(":"); if (i < 0) return false; const prop = d.slice(0, i).trim().toLowerCase(), val = d.slice(i + 1).trim().toLowerCase(); return CARD_STYLE_PROP.has(prop) && !/[(){}@]|:\/\/|url|expression|\\|&#|<|>/.test(val); });
    return ok ? decls.join("; ") : null;
  }
  function cleanFragment(html) {
    const doc = PARSER.parseFromString(String(html || ""), "text/html"), frag = document.createDocumentFragment();
    [...doc.body.querySelectorAll("*")].forEach((el) => {
      if (!el.isConnected) return;
      const tag = el.localName.toLowerCase();
      if (CARD_DROP.has(tag) || tag.includes("-")) { el.remove(); return; } // a payload-carrier, or any custom element
      if (!CARD_TAGS.has(tag)) { el.replaceWith(...el.childNodes); return; } // an unexpected wrapper: keep its text and allowed children
      [...el.attributes].forEach((a) => {
        const n = a.name.toLowerCase();
        if (n === "style") { const s = safeStyle(a.value); if (s) el.setAttribute("style", s); else el.removeAttribute(a.name); return; }
        if (n === "type" && tag === "input") { if (!CARD_INPUT_TYPE.has(a.value.toLowerCase())) el.removeAttribute(a.name); return; } // never image or file
        if (n === "type" && tag === "button") { if (a.value.toLowerCase() !== "button") el.setAttribute("type", "button"); return; }
        if (n.startsWith("aria-")) return;
        if (!CARD_ATTR.has(n)) el.removeAttribute(a.name); // id, name, href, src, srcset, ping, on*, form..., is, contenteditable and the rest are not on the list
      });
    });
    while (doc.body.firstChild) frag.appendChild(document.adoptNode(doc.body.firstChild));
    return frag;
  }
  // a filter is run as a formula, so one that comes from a file is used only when it is plain: column names, numbers, text
  // in quotes, the formula functions and operators. Anything else (a dot, brackets, a comment, a name that is not a column)
  // is dropped. This is the same token-by-token check the engine runs before it compiles any formula (SW.formulaCheck).
  function plainFormula(f, cols, rows) {
    if (typeof f !== "string" || !f.trim()) return false;
    try { SW.compileFormula(f, cols, (c) => (rows || []).map((r) => r[cols.indexOf(c)])); return true; } catch (e) { return false; }
  }
  function loadSession() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json";
    inp.onchange = () => { const file = inp.files[0]; if (!file) return; file.text().then((t) => {
      let s = null; try { s = JSON.parse(t); } catch (e) { }
      if (!s || !Array.isArray(s.cols) || !Array.isArray(s.rows)) return alert("That file is not a saved session. Choose the .sww.json file that Results, Save session made.");
      // a file saved before 2026-10-14 has no origin: under a sample's exact name it is not remembered until untouchedSample
      // shows it is more than the untouched sample (for example a Canvas copy with a new column); then it is remembered as the user's own
      const legacy = !s.origin && !!sampleFileFor(s.name);
      const d = normalizeData(s); const myRows = d.rows;
      D.origin = s.origin === "sample" || legacy ? "sample" : "own"; D.restored = false; D.name = d.name; D.cols = d.cols; D.rows = d.rows; D.filter = plainFormula(d.filter, d.cols, d.rows) ? d.filter : ""; D.manual = d.manual; inferTypes(); renderGrid(); persist();
      if (d.filter && !D.filter) alert("The filter saved in this session was not applied: it has something other than column names, numbers, text in quotes and operators. All rows are in use. To filter again, use Data, Filters.");
      if (legacy) untouchedSample({ name: d.name, cols: d.cols, rows: d.rows, filter: d.filter, manual: d.manual }).then((same) => { if (!same && D.rows === myRows) { D.origin = "own"; persist(); } });
      [["#out", s.results], ["#outG", s.graphs], ["#outD", s.distraction], ["#outL", s.learn]].forEach(([id, h]) => { const pane = $(id), frag = cleanFragment(h); pane.innerHTML = ""; pane.appendChild(frag); }); LIVE = null; document.querySelectorAll("#out .plot, #outG .plot, #outD .plot, #outL .plot, #out [data-act=\"png\"], #outG [data-act=\"png\"], #outD [data-act=\"png\"], #outL [data-act=\"png\"]").forEach((p) => p.remove());
      // a card from a file has no dialog behind it, so it has no edit button: run the analysis again from its menu to change it or redraw its graph
      document.querySelectorAll('#out [data-act="edit"], #outG [data-act="edit"], #outD [data-act="edit"], #outL [data-act="edit"]').forEach((b) => b.remove());
      document.querySelectorAll("#outD .card").forEach((c) => c.classList.remove("editing", "kept", "stale")); document.querySelectorAll('#out [data-act="close"], #outG [data-act="close"], #outD [data-act="close"], #outL [data-act="close"]').forEach((b) => (b.onclick = () => removeCard(b.closest(".card")))); document.querySelectorAll('#out [data-act="copy"], #outG [data-act="copy"], #outD [data-act="copy"], #outL [data-act="copy"]').forEach((b) => (b.onclick = () => copyCard(b.closest(".card"), b))); counts(); }); };
    inp.click();
  }
  function exportResults() { const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Results</title><style>${[...document.styleSheets[0].cssRules].map((r) => r.cssText).join("\n")}</style></head><body><h1>Analyses</h1><div id="out">${$("#out").innerHTML}</div><h1>Graphs</h1><div id="outG">${$("#outG").innerHTML}</div>${$("#outD").children.length ? `<h1>distrACTION</h1><div id="outD">${$("#outD").innerHTML}</div>` : ""}${$("#outL").children.length ? `<h1>Learn</h1><div id="outL">${$("#outL").innerHTML}</div>` : ""}</body></html>`; downloadText(html, "results.html", "text/html"); }

  // ================= menu =================
  const MENU = [
    ["Data", [["Open CSV file", openFile], ["Paste data", pasteData], ["Sample datasets", sampleData], ["New data table", newBlank], null, ["Filters", filterUI], ["Compute", computeUI], ["Transform", transformUI], ["Add z-score column", zscoreColumn], ["Bin into classes", binUI], ["Stack columns", stackUI], null, ["Reshape: wide to long", pivotLongerUI], ["Reshape: long to wide", pivotWiderUI], ["Merge with another table (join)", joinUI], ["Group by and summarize", groupByUI], ["Clean rows (blanks, duplicates)", cleanRowsUI], null, ["Simulate random data", simulateUI], ["Random sample of rows", sampleRowsUI], null, ["Set variable type", typeUI], ["Rename or delete column", columnUI], null, ["Download data as CSV", downloadCSV]]],
    ["Exploration", [["Descriptives", descriptives], ["Scatterplot", scatterUI]]],
    ["Graph", [["Bar Plot", toGraphs(gBar)], ["Pie Chart", toGraphs(gPie)], null, ["Histogram", toGraphs(gHist)], ["Dotplot", toGraphs(gDot)], ["Boxplot", toGraphs(gBox)], ["Stem and Leaf", toGraphs(gStem)], null, ["Scatter Plot", toGraphs(gScatter)], ["QQ Plot", toGraphs(gQQ)]]],
    ["T-Tests", [["Which test?", whichTest], null, ["Independent Samples T-Test", tIndependent], ["Paired Samples T-Test", tPaired], ["One Sample T-Test", tOneSample], null, ["One Sample Z-Test (sigma known)", zOneSample], ["Two Sample Z-Test (sigmas known)", zTwoSample]]],
    ["ANOVA", [["One-Way ANOVA", anovaUI], ["Two-Way ANOVA", anova2UI], ["ANCOVA", ancovaUI], ["Repeated Measures and Mixed ANOVA", rmAnovaUI], ["MANOVA", manovaUI], null, ["Kruskal-Wallis (three or more groups)", kruskalUI], ["Friedman (nonparametric repeated measures)", friedmanUI]]],
    ["Regression", [["Correlation Matrix", corrUI], ["Linear Regression", linRegUI], null, ["Sensitivity to a lurking variable", sensitivityUI]]],
    ["Frequencies", [["2 Outcomes: Binomial test", binomialTest], ["N Outcomes: chi-square Goodness of fit", gofUI], ["Contingency Tables: Independent Samples", contTables], null, ["One proportion: z test", onePropZ], ["Two proportions: z test", twoPropsUI]]],
    ["distrACTION", [["Binomial Distribution", binomCalc], ["Custom (discrete x and P(x))", discreteCalc], ["Poisson Distribution", poissonCalc], ["Geometric Distribution", geometricCalc], ["Hypergeometric Distribution", hyperCalc], ["Discrete Uniform", dunifCalc], null, ["Normal Distribution", normalCalc], ["Uniform (continuous)", unifCalc], ["Exponential Distribution", expCalc], ["T-Distribution", tCalc], ["Chi-square and F", chiFCalc], null, ["Sample size for a margin of error", sampleSizeCalc], ["Power and sample size for a test", powerUI]]],
    ["Nonparametric", [["Mann-Whitney U (two groups)", mannWhitneyUI], ["Wilcoxon signed-rank and sign test (paired)", wilcoxonUI], ["Kruskal-Wallis (three or more groups)", kruskalUI], ["Friedman (nonparametric repeated measures)", friedmanUI]]],
    ["Learn", [["Coin flips and the law of large numbers", llnUI], ["The Central Limit Theorem", cltUI], ["What a confidence interval means", ciDemoUI], ["What a p-value is", pvalDemoUI], null, ["Mean versus median (click to add values)", meanMedianApplet], ["Regression: outliers and influence", influenceApplet], ["Guess the correlation", guessRApplet], null, ["Sampling distribution simulator", samplingSim], ["Bootstrap: an interval with no formula", bootUI], ["Permutation: a p-value by reshuffling", permUI], ["Bayesian: prior, data, posterior", bayesUI]]],
    ["Advanced", [["Multiple Linear Regression", multRegUI], ["Mixed-Effects Model (nested or repeated data)", mixedUI], ["Logistic Regression", logitUI], null, ["Count Regression: Poisson and Negative Binomial", countRegUI], ["Multinomial Logistic Regression", multinomUI], ["Ordinal Logistic Regression", ordinalUI], null, ["Variance tests (one SD or two SDs)", varianceUI], ["McNemar test (paired yes or no)", mcnemarUI], ["Cochran-Armitage trend test", trendUI], null, ["Power and Sample Size", powerUI], null, ["Bootstrap confidence interval", bootUI], ["Permutation test", permUI], null, ["Time Series", tsUI], null, ["Principal Component Analysis", pcaUI], ["Exploratory Factor Analysis", efaUI], ["Reliability (Cronbach's alpha)", alphaUI], ["k-means Clustering", kmeansUI], null, ["Survival Analysis: Kaplan-Meier, log-rank, Cox", survivalUI], null, ["Bayesian Inference (conjugate priors)", bayesUI]]],
    ["Results", [["Script: every step, with the R code", scriptUI], null, ["Decimal places shown", () => dialog("Decimal places", [sel("d", "Show numbers to", [["2", "2 decimals"], ["3", "3 decimals"], ["4", "4 decimals (default)"], ["6", "6 decimals"]], String(DEC))], (v) => { DEC = Number(v.d); try { localStorage.setItem("sww_dec", v.d); } catch (e) { } card("Decimal places", `now ${DEC}`, say("Applies to new results. The stored value is always full precision; quote the printed value and say how you rounded.")); }, "Set")],
      ["Notation: symbols or words", () => dialog("Notation", [sel("n", "Formulas and hypotheses are written with", [["sym", "symbols: x\u0304, \u03c3, \u03bc, \u03b1, \u03c7\u00b2, H\u2080 (default, matches the textbook)"], ["words", "words: x bar, sigma, mu, alpha, chi-square, H0 (reads aloud better)"]], NOTE)], (v) => { NOTE = v.n === "words" ? "words" : "sym"; try { localStorage.setItem("sww_note", NOTE); } catch (e) { } card("Notation", NOTE === "sym" ? "symbols" : "words", say(NOTE === "sym" ? "New results write formulas and hypotheses in symbols: x\u0304 for the sample mean, \u03c3 and \u03bc for the population SD and mean, \u03b1 for the significance level, \u03c7\u00b2 for chi-square, H\u2080 and H\u2090 for the hypotheses. Plain-English conclusions stay as they are." : "New results spell notation out in words (x bar, sigma, mu, alpha, chi-square, H0), the form a screen reader or Read Aloud handles best.")); }, "Set")], null, ["Print or save as PDF", () => window.print()], ["Export results as HTML", exportResults], ["Save session (data + results)", saveSession], ["Open a saved session", loadSession], ["Share link (data + analyses)", shareLink], null, ["Who is using the app: student or researcher", modeUI], ["Course profile", profileUI], ["Open a profile file", loadProfile], null, ["Clear analyses", () => { if (VIEW !== "data") return clearToolPage(); $("#out").innerHTML = ""; counts(); }], ["Clear graphs", () => { if (VIEW !== "data") return clearToolPage(); $("#outG").innerHTML = ""; counts(); }]]], // on distrACTION and Learn both clear that page only, the same as Clear this page
  ];

  // ================= last visit's results =================
  // Results were lost on a reload (an accidental refresh wiped every card, and nobody saves a session before a refresh).
  // Now the choices behind each card on the Analyses and Graphs tabs are stored as they are made, with the name of the data
  // they ran on, and on the next visit a bar offers to run them again. The app still opens as before (the empty table, or
  // the user's own data) unless Restore is chosen: an untouched sample dataset comes back only with its results.
  const FN_KEY = new Map(), KEY_FN = new Map();
  MENU.forEach(([m, items]) => items.forEach((it) => { if (it) { FN_KEY.set(it[1], m + " | " + it[0]); KEY_FN.set(m + " | " + it[0], it[1]); } }));
  // the setup behind the page: the data's name and origin, the filter, and the choices behind each card on the Analyses and
  // Graphs tabs (a card that is only a note, such as a share link, is skipped)
  function stateNow() {
    const cards = ["#out", "#outG"].flatMap((id) => [...$(id).children].reverse().filter((c) => c._redo && !c._skip && !NOTE_FNS.has(c._redo.fn) && FN_KEY.has(c._redo.fn)).map((c) => ({ k: FN_KEY.get(c._redo.fn), v: c._redo.values, t: id })));
    return { name: D.name, origin: D.origin || "own", filter: D.filter, cards };
  }
  function autosave() {
    try {
      const s = stateNow();
      if (!s.cards.length) { if (!LAST) localStorage.removeItem("sww_last"); return; } // nothing yet this visit: the offer from the last one stands
      s.at = Date.now(); localStorage.setItem("sww_last", JSON.stringify(s));
    } catch (e) { }
  }
  // ---- a link that carries the setup: the dataset (a sample's name, or a small table of the user's own, inside the link),
  // the filter and the analyses, as JSON in the address after #s=. Nothing is sent anywhere; the receiver sees the setup and
  // an Open button, and nothing runs until it is pressed. Read with the same checks as a session file.
  const packState = (o) => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return "s=" + btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  function unpackState(h) {
    try {
      const m = /^#?s=([A-Za-z0-9_-]+)$/.exec(String(h || "")); if (!m) return null;
      const b = m[1].replace(/-/g, "+").replace(/_/g, "/"), s = atob(b + "=".repeat((4 - (b.length % 4)) % 4)), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
      const o = JSON.parse(new TextDecoder().decode(u)); return o && typeof o === "object" && !Array.isArray(o) ? o : null;
    } catch (e) { return null; }
  }
  const dropHash = () => { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { } };
  function shareLink() {
    const s = stateNow(); let note;
    if (D.rows.length && s.origin === "sample" && sampleFileFor(s.name)) note = `The link names the sample dataset (${s.name}), which is loaded again when the link opens.`;
    else if (D.rows.length) { const d = { cols: D.cols, rows: D.rows, manual: D.manual || {} }; if (JSON.stringify(d).length <= 60000) { s.data = d; note = `Your table (${D.rows.length} rows, ${D.cols.length} columns) travels inside the link, so it opens on any computer.`; } else note = `Your table is too big to travel inside a link (${D.rows.length} rows). The link carries the filter and the analyses; whoever opens it must first open the same file (Data, Open CSV file), then press Open.`; }
    else note = "No data are loaded, so the link carries the analyses only.";
    if (PROF) { s.profile = PROF; note += ` The course profile (${profileName(PROF)}) travels with it.`; }
    const url = location.origin + location.pathname + "#" + packState(s), n = s.cards.length;
    const meta = `${n} ${n === 1 ? "analysis" : "analyses"}${D.filter.trim() ? ", filter " + D.filter.trim() : ""}, ${url.length} characters`;
    dialog("Results: Share link", [{ name: "url", label: "The link", type: "textarea", rows: 4, value: url, hint: `${meta}. ${note} Paste it into Canvas, an email or a message: whoever opens it sees the setup and an Open button, and nothing runs until it is pressed. Nothing is sent anywhere; the whole setup is in the address.` }], () => {
      const cd = card("Share link", meta, `<div class="formula link">${esc(url)}</div>` + say(note + " Whoever opens the link sees the setup and an Open button. The link was put on the clipboard; if that failed, select it above and copy it by hand."));
      cd._skip = true; // a note, not an analysis: not kept for a restore, not part of the next link
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => announce("Link copied."), () => announce("Select the link in the card and copy it by hand."));
    }, "Copy link");
  }
  // ================= course profile =================
  // A small set of defaults an instructor shares (a file, or a link): the two-sample t-test (Welch or pooled), the quartile
  // rule, decimal places, the alpha and confidence level offered first, and which menus show (Advanced alone has nineteen
  // models a first course never meets). Data and Results always show. One app, one profile per course, no fork.
  const MENU_NAMES = MENU.map((m) => m[0]);
  const NOTE_FNS = new Set([shareLink, whichTest, profileUI, scriptUI]); // dialogs whose card is a note, not an analysis: never saved or shared
  // ================= who is using the app, and in what field =================
  // Student (default): every card carries the formula, the worked numbers and a plain-English conclusion.
  // Researcher: the same engine and the same cards, but the result and the conclusion come first and the formula and
  // worked numbers fold away under "Method"; 3 decimals unless the user set their own. The field reorders the sample
  // datasets and lists the analyses that field reaches for first; it never hides a menu.
  const FIELDS = {
    general: { label: "General", datasets: [], analyses: [["T-Tests", "Which test?"], ["Exploration", "Descriptives"], ["T-Tests", "Independent Samples T-Test"], ["ANOVA", "One-Way ANOVA"], ["Regression", "Linear Regression"], ["Frequencies", "Contingency Tables: Independent Samples"]] },
    health: { label: "Health and nursing", datasets: ["lung_cancer_survival.csv", "sleepstudy.csv", "Dataset4_Global_Health.csv", "yrbs2023_teens_1500.csv", "STATC1000_Sleep_Followup.csv"], analyses: [["Frequencies", "Contingency Tables: Independent Samples"], ["Advanced", "Logistic Regression"], ["Advanced", "Survival Analysis: Kaplan-Meier, log-rank, Cox"], ["T-Tests", "Paired Samples T-Test"], ["Advanced", "McNemar test (paired yes or no)"], ["Advanced", "Power and Sample Size"]], note: "Relative risk and the odds ratio with their intervals are on the Contingency Tables card (tick Odds ratio and relative risk)." },
    business: { label: "Business and finance", datasets: ["mauna_loa_co2_monthly.csv", "popp_community_survey.csv", "gss2022_politics_wellbeing.csv"], analyses: [["Frequencies", "Two proportions: z test"], ["Advanced", "Multiple Linear Regression"], ["Advanced", "Time Series"], ["Regression", "Correlation Matrix"], ["Advanced", "Bootstrap confidence interval"], ["ANOVA", "One-Way ANOVA"]], note: "An A/B test is the two-proportions z test; the difference in conversion rates and its interval are on that card." },
    social: { label: "Social science and education", datasets: ["gss2018_beliefs_politics.csv", "gss2022_politics_wellbeing.csv", "big5_personality_1200.csv", "big5_items_500.csv", "sleepstudy.csv", "STATC1000_Class_Data.csv"], analyses: [["Frequencies", "Contingency Tables: Independent Samples"], ["Advanced", "Reliability (Cronbach's alpha)"], ["Advanced", "Exploratory Factor Analysis"], ["Advanced", "Mixed-Effects Model (nested or repeated data)"], ["Advanced", "Multiple Linear Regression"], ["Regression", "Sensitivity to a lurking variable"]], note: "Scale scores: Reliability for the alpha of an item set, Exploratory Factor Analysis for its structure." },
    bio: { label: "Biology and life sciences", datasets: ["Dataset1_Finch_Beaks.csv", "lung_cancer_survival.csv", "sleepstudy.csv", "cadet_mile_times.csv"], analyses: [["ANOVA", "One-Way ANOVA"], ["Nonparametric", "Kruskal-Wallis (three or more groups)"], ["Nonparametric", "Mann-Whitney U (two groups)"], ["Regression", "Linear Regression"], ["Advanced", "Mixed-Effects Model (nested or repeated data)"], ["Advanced", "Survival Analysis: Kaplan-Meier, log-rank, Cox"]], note: "Small samples and skewed measurements: the nonparametric tests sit next to their parametric versions." },
    engineering: { label: "Engineering and quality", datasets: ["mauna_loa_co2_monthly.csv", "cadet_mile_times.csv", "popp_calls_for_service.csv"], analyses: [["Exploration", "Descriptives"], ["Graph", "QQ Plot"], ["Advanced", "Variance tests (one SD or two SDs)"], ["Advanced", "Time Series"], ["Regression", "Linear Regression"], ["Advanced", "Power and Sample Size"]], note: "Process spread is a variance test; normality of a measurement is the QQ plot." },
    safety: { label: "Public safety and criminal justice", datasets: ["popp_calls_for_service.csv", "ships.csv", "popp_academy_fitness.csv", "popp_community_survey.csv", "gss2018_beliefs_politics.csv"], analyses: [["Frequencies", "Contingency Tables: Independent Samples"], ["Frequencies", "Two proportions: z test"], ["Advanced", "Count Regression: Poisson and Negative Binomial"], ["ANOVA", "One-Way ANOVA"], ["Advanced", "Time Series"], ["Advanced", "Cochran-Armitage trend test"]], note: "Counts of incidents per unit time or area are a count regression, not a linear one." },
  };
  const MODE = { who: "student", field: "general" };
  try { const m = JSON.parse(localStorage.getItem("sww_mode") || "null"); if (m) { if (m.who === "researcher") MODE.who = "researcher"; if (FIELDS[m.field]) MODE.field = m.field; } } catch (e) { }
  const fieldSamples = () => { const fav = FIELDS[MODE.field].datasets, lab = FIELDS[MODE.field].label; return SAMPLES.map((s, i) => [s, fav.indexOf(s[0]), i]).sort((a, b) => (a[1] < 0 ? 99 : a[1]) - (b[1] < 0 ? 99 : b[1]) || a[2] - b[2]).map(([s, k]) => (k >= 0 ? [s[0], s[1] + " · " + lab] : s)); };
  const modeLabel = () => (MODE.who === "researcher" ? "Researcher" : "Student") + (MODE.field === "general" ? "" : " in " + FIELDS[MODE.field].label);
  function applyMode(who, field, store) {
    MODE.who = who === "researcher" ? "researcher" : "student"; MODE.field = FIELDS[field] ? field : "general";
    document.body.classList.toggle("who-researcher", MODE.who === "researcher");
    let userDec = null; try { userDec = localStorage.getItem("sww_dec"); } catch (e) { }
    if (!userDec && !PROF) DEC = MODE.who === "researcher" ? 3 : 4;
    const mb = $("#modeBtn"); if (mb) mb.textContent = modeLabel();
    const g = $("#grid"); if (g && g.querySelector(".empty")) { g.innerHTML = emptyState(); wireEmpty(g); }
    if (store) { try { localStorage.setItem("sww_mode", JSON.stringify(MODE)); } catch (e) { } }
  }
  function modeUI() {
    dialog("Who is using Stats Without Walls?", [
      sel("who", "I am a", [["student", "student: formula, worked numbers and a plain-English conclusion on every card"], ["researcher", "researcher: result and conclusion first, formula and worked numbers folded under Method, 3 decimals"]], MODE.who),
      sel("field", "My field", Object.keys(FIELDS).map((k) => [k, FIELDS[k].label]), MODE.field),
      { name: "n", type: "note", label: "The field puts its sample datasets first and lists the analyses it reaches for most on the start screen. Every menu stays available in every mode. The choice is remembered on this device." }], (v) => {
      applyMode(v.who, v.field, true);
      card("Set up for " + modeLabel(), "", say(MODE.who === "researcher" ? "New cards lead with the result and the conclusion; the formula and worked numbers are one click away under Method." : "New cards carry the formula, the worked numbers and a plain-English conclusion.") + (MODE.field !== "general" && FIELDS[MODE.field].note ? say(FIELDS[MODE.field].note) : ""));
    }, "Set");
  }
  function cleanProfile(p) {
    if (!p || typeof p !== "object") return null;
    const o = { name: String(p.name == null ? "" : p.name).replace(/\s+/g, " ").trim().slice(0, 60), welch: p.welch !== false, qm: p.qm === "type7" ? "type7" : "halves" };
    o.dec = [2, 3, 4, 6].includes(Number(p.dec)) ? Number(p.dec) : 4;
    o.alpha = ["0.05", "0.01", "0.10"].includes(String(p.alpha)) ? String(p.alpha) : "0.05";
    o.conf = ["0.90", "0.95", "0.99"].includes(String(p.conf)) ? String(p.conf) : "0.95";
    o.menus = Array.isArray(p.menus) ? p.menus.filter((m) => typeof m === "string" && MENU_NAMES.includes(m) && m !== "Data" && m !== "Results") : null;
    return o;
  }
  let PROF = null; try { PROF = cleanProfile(JSON.parse(localStorage.getItem("sww_profile") || "null")); } catch (e) { }
  const profileName = (p) => (p && p.name ? String(p.name) : "unnamed");
  function showMenus() { document.querySelectorAll("#menu .dd").forEach((d) => { const m = d.dataset.name; d.style.display = !PROF || !PROF.menus || m === "Data" || m === "Results" || PROF.menus.includes(m) ? "" : "none"; }); }
  function applyProfile(p, store) {
    PROF = cleanProfile(p); if (!PROF) return clearProfile();
    DEC = PROF.dec; alphaField.value = PROF.alpha; confField.value = PROF.conf; showMenus();
    const pn = $("#profName"); if (pn) pn.textContent = PROF.name ? "Profile: " + PROF.name : "Course profile set";
    if (store) { try { localStorage.setItem("sww_profile", JSON.stringify(PROF)); } catch (e) { } }
  }
  function clearProfile() {
    PROF = null; try { localStorage.removeItem("sww_profile"); } catch (e) { }
    let d = 0; try { d = Number(localStorage.getItem("sww_dec")) || 0; } catch (e) { } DEC = d || (MODE.who === "researcher" ? 3 : 4);
    alphaField.value = "0.05"; confField.value = "0.95"; showMenus(); const pn = $("#profName"); if (pn) pn.textContent = "";
  }
  const profileWords = (p) => `${p.welch ? "Welch's" : "Student's pooled"} t for two samples; ${p.qm === "type7" ? "R (type 7)" : "textbook"} quartiles; ${p.dec} decimals; alpha ${p.alpha} and ${Math.round(Number(p.conf) * 100)} percent offered first; menus: ${p.menus ? "Data, " + p.menus.join(", ") + ", Results" : "all"}.`;
  function profileUI() {
    const p = PROF || cleanProfile({}), menuOpts = MENU_NAMES.filter((m) => m !== "Data" && m !== "Results");
    dialog("Results: Course profile", [
      { name: "name", label: "Profile name (shown above the table)", type: "text", value: p.name, placeholder: "STAT C1000, Fall 2026" },
      sel("welch", "Two-sample t-test offered first", [["welch", "Welch's (unequal variances)"], ["pooled", "Student's (pooled)"]], p.welch ? "welch" : "pooled"),
      sel("qm", "Quartile rule in Descriptives", [["halves", "Textbook rule (median of each half)"], ["type7", "R rule (type 7, interpolated)"]], p.qm),
      sel("dec", "Decimal places", [["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"]], String(p.dec)),
      sel("alpha", "Alpha offered first", [["0.05", "0.05"], ["0.01", "0.01"], ["0.10", "0.10"]], p.alpha),
      sel("conf", "Confidence level offered first", [["0.90", "90 percent"], ["0.95", "95 percent"], ["0.99", "99 percent"]], p.conf),
      { name: "menus", label: `Menus to show (${MULTI_HINT()}). Data and Results always show.`, type: "multi", options: menuOpts, value: p.menus || menuOpts },
      sel("how", "Then", [["apply", "Use this profile on this computer"], ["file", "Use it here and download it as a file to share"], ["link", "Use it here and copy a link that sets it"], ["off", "Remove the profile from this computer"]], "apply")], (v) => {
      if (v.how === "off") { clearProfile(); card("Course profile", "removed", say("The app's own defaults are back: Welch's t, the textbook quartile rule, 4 decimals, alpha 0.05, 95 percent, every menu."))._skip = true; return; }
      const prof = cleanProfile({ name: v.name, welch: v.welch !== "pooled", qm: v.qm, dec: Number(v.dec), alpha: v.alpha, conf: v.conf, menus: v.menus.length === menuOpts.length ? null : v.menus });
      applyProfile(prof, true);
      let html = say("In use on this computer. " + profileWords(prof));
      if (v.how === "file") { downloadText(JSON.stringify(Object.assign({ sww_profile: 1 }, prof), null, 2), ((prof.name || "course").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "course") + ".sww-profile.json", "application/json"); html += say("The profile file was downloaded. A student opens it with Results, Open a profile file."); }
      if (v.how === "link") { const url = location.origin + location.pathname + "#" + packState({ name: "", origin: "own", filter: "", cards: [], profile: prof }); html += `<div class="formula link">${esc(url)}</div>` + say("The link was put on the clipboard. Whoever opens it is offered the profile and presses Open to use it; a share link made while a profile is set carries the profile too."); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => announce("Link copied."), () => { }); }
      card("Course profile", prof.name || "unnamed", html)._skip = true;
    }, "Apply");
  }
  function loadProfile() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json";
    inp.onchange = () => { const file = inp.files[0]; if (!file) return; file.text().then((t) => {
      let s = null; try { s = JSON.parse(t); } catch (e) { }
      TARGET = "#out"; CUR_FN = null;
      if (!s || typeof s !== "object" || !s.sww_profile) { card("Course profile", "not opened", warn("That file is not a course profile. Choose the .sww-profile.json file that Results, Course profile made."))._skip = true; TARGET = baseTarget(); return; }
      applyProfile(s, true); card("Course profile", profileName(PROF), say("In use on this computer. " + profileWords(PROF)))._skip = true; TARGET = baseTarget();
    }); };
    inp.click();
  }
  const hasTable = (s) => !!(s && s.data && Array.isArray(s.data.cols) && Array.isArray(s.data.rows) && s.data.rows.length);
  // the bar above the tabs: the last visit's results (Restore / No thanks), or a setup from a share link (Open / Not now)
  function offerLast(s, shared) {
    const bar = $("#restoreBar"); if (!bar || !s || typeof s !== "object") { if (!shared) LAST = null; return; }
    const cards = Array.isArray(s.cards) ? s.cards : [], withData = hasTable(s);
    const prof = shared && s.profile && typeof s.profile === "object" ? cleanProfile(s.profile) : null;
    if (!cards.length && !withData && !prof) { if (shared) dropHash(); else LAST = null; return; }
    const n = cards.length, when = !shared && Number.isFinite(s.at) ? new Date(s.at) : null, today = when && when.toDateString() === new Date().toDateString();
    const name = s.name == null ? "" : String(s.name), filt = typeof s.filter === "string" ? s.filter.trim() : "";
    const what = `${n} ${n === 1 ? "analysis" : "analyses"} on ${name || "your data"}${filt ? ` (filter: ${filt})` : ""}`;
    $("#restoreText").textContent = shared ? (cards.length || withData ? `Open the shared setup? ${what}${withData ? `, with the table (${s.data.rows.length} rows) inside the link` : ""}${prof ? `, and the course profile ${profileName(prof)}` : ""}. Nothing runs until you press Open.` : `This link sets the course profile ${profileName(prof)}: ${profileWords(prof)} Press Open to use it on this computer.`)
      : `Restore your last session? ${what}${when ? `, from ${today ? "today at " + when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : when.toLocaleDateString()}` : ""}. Results do not survive a reload unless you restore them.`;
    $("#restoreYes").textContent = shared ? "Open" : "Restore"; $("#restoreNo").textContent = shared ? "Not now" : "No thanks";
    bar.hidden = false;
    $("#restoreYes").onclick = () => { if (shared) dropHash(); restoreLast(s); };
    $("#restoreNo").onclick = () => { bar.hidden = true; if (shared) dropHash(); else { LAST = null; try { localStorage.removeItem("sww_last"); } catch (e) { } } focusTo(pageHeading()); };
  }
  function restoreLast(s) {
    if (s === LAST) LAST = null; $("#restoreBar").hidden = true;
    const name = s.name == null ? "" : String(s.name), list = Array.isArray(s.cards) ? s.cards : [];
    if (s !== LAST && s.profile && typeof s.profile === "object") { applyProfile(s.profile, true); if (!list.length && !hasTable(s)) { TARGET = "#out"; CUR_FN = null; card("Course profile", profileName(PROF), say("Set from a link and in use on this computer. " + profileWords(PROF)))._skip = true; TARGET = baseTarget(); counts(); return; } }
    const run = () => {
      const keep = plainFormula(s.filter, D.cols, D.rows); D.filter = keep ? String(s.filter).trim() : ""; renderGrid(); persist();
      let made = 0, first = null;
      list.forEach((c) => {
        const fn = c && KEY_FN.get(c.k); if (!fn || !c.v || typeof c.v !== "object") return;
        CUR_FN = fn; PREFILL = Object.assign({}, c.v); REPLACE = null; TARGET = c.t === "#outG" ? "#outG" : "#out"; AUTORUN = true; const before = LASTCARD;
        try { fn(); if (LASTCARD && LASTCARD !== before && LASTCARD.isConnected) { made++; first = first || LASTCARD; } } catch (e) { } finally { AUTORUN = false; PREFILL = null; CUR_FN = null; TARGET = baseTarget(); }
      });
      const miss = list.length - made;
      if (miss) { TARGET = "#out"; CUR_FN = null; card("Last session", `${made} of ${list.length} results restored`, warn(`${miss} result${miss > 1 ? "s" : ""} could not be run again on these data (a column that is no longer there, or a choice that no longer fits). Run ${miss > 1 ? "them" : "it"} again from the menu.`)); TARGET = baseTarget(); }
      counts(); announce(`${made} result${made === 1 ? "" : "s"} restored${miss ? `, ${miss} not` : ""}.`);
      if (first && first.isConnected) focusTo(first.querySelector("h2"), true); else focusTo(pageHeading());
    };
    // a table carried inside a share link: read with the same care as a session file, and then the user's own data
    if (hasTable(s)) { const d = normalizeData({ name, cols: s.data.cols, rows: s.data.rows, manual: s.data.manual, filter: "" }); if (d.cols.length) { D.origin = "own"; D.restored = false; D.name = name; D.cols = d.cols; D.rows = d.rows; D.manual = d.manual; D.filter = ""; D.sortCol = null; inferTypes(); renderGrid(); persist(); return run(); } }
    if (D.rows.length && D.name === name) return run();
    const f = s.origin === "sample" ? sampleFileFor(name) : null;
    if (f) { fetch("data/" + f).then((r) => (r.ok ? r.text() : Promise.reject(new Error("no file")))).then((t) => { loadTable(name, parseCSV(t), "sample"); run(); }).catch(() => { TARGET = "#out"; CUR_FN = null; card("Last session", "not restored", warn("The sample dataset could not be loaded, so the results were not run again. Open it from Data, Sample datasets and run the analyses from the menus.")); TARGET = baseTarget(); }); return; }
    TARGET = "#out"; CUR_FN = null; card("Last session", "not restored", warn(`Those results were run on ${esc(name || "a dataset")}, which is not on this computer any more. Open the file again and run the analyses from the menus.`)); TARGET = baseTarget();
  }
  // Widen table: the results pane folds away so the whole width shows the data (eighteen columns need it). The next result,
  // or the button again, brings the results back. The bar between the panels still drags.
  function setWide(on) { const pt = $("#paneToggle"); document.body.classList.toggle("tablewide", on); if (pt) { pt.textContent = on ? "Show results" : "Widen table"; pt.setAttribute("aria-pressed", String(on)); } if (!on) setTimeout(() => window.dispatchEvent(new Event("resize")), 0); }
  if ($("#paneToggle")) $("#paneToggle").onclick = () => setWide(!document.body.classList.contains("tablewide"));
  if ($("#whichBtn")) $("#whichBtn").onclick = () => { const it = findItem("T-Tests", "Which test?"); if (it) runItem("T-Tests", it); };
  // ================= Ask: a helper that answers in plain words and opens the right dialog =================
  // Rule based and offline: it matches the question against a small knowledge base built from the Methods Guide, names the
  // method, says why, and offers a button that opens the dialog. After a result it watches the card's warnings and suggests
  // the next step (Fisher's exact for small counts, a nonparametric test for a small skewed sample). Nothing leaves the browser.
  const ASKKB = [
    { k: ["compare two groups", "two groups", "two means", "difference between two", "treatment control", "independent samples", "two independent", "men women", "t test", "t-test"], t: "Two different groups, a number: independent-samples t test", a: "Compare the means of two separate groups with Welch's t. Data: one numeric column and one grouping column with two levels.", go: [["T-Tests", "Independent Samples T-Test"]], alt: [["Nonparametric", "Mann-Whitney U (two groups)"]], m: "two" },
    { k: ["before and after", "before after", "pre post", "pretest posttest", "paired", "same people", "matched", "repeated twice", "two measurements"], t: "The same people measured twice: paired t test", a: "Before and after, or matched pairs, is a paired design: the test is on the differences. Data: two numeric columns, one row per person.", go: [["T-Tests", "Paired Samples T-Test"]], alt: [["Nonparametric", "Wilcoxon signed-rank and sign test (paired)"]], m: "paired" },
    { k: ["three or more groups", "three groups", "several groups", "more than two groups", "anova", "many groups", "four groups", "compare groups"], t: "Three or more groups: one-way ANOVA", a: "One numeric outcome across three or more groups: one-way ANOVA with Tukey follow-up tells you whether any group differs and which pairs.", go: [["ANOVA", "One-Way ANOVA"]], alt: [["ANOVA", "Kruskal-Wallis (three or more groups)"]], m: "three" },
    { k: ["one group", "claimed value", "test value", "against a value", "one sample", "one-sample", "mean equal to", "hypothesized mean"], t: "One group against a claimed value: one-sample t test", a: "One numeric variable compared with a known or claimed mean (the mean commute is 30 minutes).", go: [["T-Tests", "One Sample T-Test"]], m: "compare" },
    { k: ["proportion", "percentage", "percent", "yes or no", "yes no", "binary", "success", "binomial"], t: "A proportion: binomial test, two-proportion z test, or a 2 by 2 table", a: "One proportion against a claimed value: the one-proportion z test when n p0 and n(1 minus p0) are both at least 10 (the card checks), otherwise the exact binomial test. Two groups: the two-proportion z test. With small counts, the 2 by 2 table with Fisher's exact test.", go: [["Frequencies", "One proportion: z test"], ["Frequencies", "2 Outcomes: Binomial test"], ["Frequencies", "Two proportions: z test"]], m: "compare" },
    { k: ["one proportion z", "proportion z test", "z test for a proportion", "one-proportion z", "single proportion", "z test proportion", "np0", "n p0"], t: "One proportion: z test", a: "The z test for one proportion: z = (p hat minus p0) / sqrt(p0 (1 minus p0) / n), valid when n p0 and n(1 minus p0) are both at least 10. The card checks the conditions and shows the exact binomial p-value as a check.", go: [["Frequencies", "One proportion: z test"]], alt: [["Frequencies", "2 Outcomes: Binomial test"]], m: "compare" },
    { k: ["two categorical", "two categories", "category by category", "contingency", "cross tab", "crosstab", "chi-square", "chi square", "independence", "association between categories", "related categories"], t: "Two categorical variables: chi-square test of independence", a: "A two-way table of counts and the chi-square test of association; tick row percentages, since those are what you interpret.", go: [["Frequencies", "Contingency Tables: Independent Samples"]], m: "relate" },
    { k: ["small counts", "expected count", "below 5", "less than 5", "fisher", "exact test", "small sample categories", "sparse"], t: "Small counts in a 2 by 2 table: Fisher's exact test", a: "When an expected count is under 5, the chi-square approximation is not trustworthy. For a 2 by 2 table tick Fisher's exact test (2 by 2) on the Contingency Tables dialog; for larger tables combine small categories.", go: [["Frequencies", "Contingency Tables: Independent Samples"]], m: "relate" },
    { k: ["goodness of fit", "equally likely", "expected proportions", "counts match", "claimed split", "distribution of categories", "one categorical"], t: "Category counts against a claimed split: chi-square goodness of fit", a: "One categorical variable: do the counts match equal shares or the proportions you type?", go: [["Frequencies", "N Outcomes: chi-square Goodness of fit"]], m: "compare" },
    { k: ["correlation", "related", "relationship", "association", "two numbers", "two numeric", "scatter", "go together", "linked"], t: "Two numeric variables: correlation", a: "Look at the scatterplot first, then Pearson's r (Spearman for ratings or outliers). Correlation is not causation.", go: [["Regression", "Correlation Matrix"], ["Graph", "Scatter Plot"]], m: "relate" },
    { k: ["predict", "regression", "slope", "line of best fit", "explain", "depends on", "effect of", "predictor"], t: "Predict a number: linear regression", a: "One predictor: Linear Regression gives the line, the slope's interval and R², with residual plots to check the fit. Several predictors: Multiple Linear Regression.", go: [["Regression", "Linear Regression"], ["Advanced", "Multiple Linear Regression"]], m: "predict-num" },
    { k: ["mixed model", "mixed-effects", "mixed effects", "multilevel", "hierarchical", "nested", "clustered", "random effects", "random intercept", "random slope", "students within classes", "within schools", "longitudinal", "repeated over time", "panel data", "lme4", "lmer"], t: "Nested or repeated data: mixed-effects model", a: "Rows that belong to clusters (students within classes, repeated measurements within people) are not independent. A mixed-effects model fits the predictors as fixed effects and lets each cluster have its own intercept (and optionally slope). Read the fixed effects with Satterthwaite df, the ICC, and the random-effect variances.", go: [["Advanced", "Mixed-Effects Model (nested or repeated data)"]], alt: [["ANOVA", "Repeated Measures and Mixed ANOVA"]], m: "mixed" },
    { k: ["logistic", "odds ratio", "predict yes", "predict whether", "binary outcome", "probability of", "pass or fail", "risk factors"], t: "Predict a yes or no: logistic regression", a: "A two-level outcome with numeric or categorical predictors; read the odds ratios with their intervals.", go: [["Advanced", "Logistic Regression"]], m: "predict-yn" },
    { k: ["count", "counts of events", "incidents", "poisson", "negative binomial", "events per", "rate"], t: "Predict a count of events: Poisson or negative binomial regression", a: "Counts of incidents, calls or infections: fit Poisson, read the dispersion check, switch to negative binomial if the variance is well above the mean.", go: [["Advanced", "Count Regression: Poisson and Negative Binomial"]], m: "predict-more" },
    { k: ["interaction in regression", "interaction between", "interaction term in", "moderation analysis", "reference level", "reference category", "relevel", "change the reference", "set the reference", "baseline category", "offset", "exposure", "person-years", "person years", "rate per", "per 1000", "per 1,000", "months of service", "at risk", "squared term", "quadratic", "curved relationship", "curvilinear"], t: "Interactions, squared terms, reference levels and exposure offsets", a: "Every regression dialog (multiple linear, logistic, count) has a Model terms section: squared terms, interactions typed as a * b (numeric or categorical; keep both main effects, as R's a * b does), and the reference level for each categorical predictor (R's relevel). Count regression also takes an exposure column (time at risk, population, months of service): log(exposure) enters as an offset and the model is for the rate, as R's offset(log(exposure)). Checked against R on the ships data.", go: [["Advanced", "Multiple Linear Regression"], ["Advanced", "Logistic Regression"], ["Advanced", "Count Regression: Poisson and Negative Binomial"]], m: "predict-more" },
    { k: ["ordinal", "likert", "rating", "ordered", "1 to 5", "agree disagree", "satisfaction scale"], t: "An ordered rating as the outcome: ordinal logistic regression", a: "Ratings from low to high as the outcome: ordinal logistic regression. As a predictor or a comparison, treat a rating as a number for means or use the rank tests.", go: [["Advanced", "Ordinal Logistic Regression"]], m: "predict-more" },
    { k: ["multinomial", "several categories", "unordered categories", "which category", "choice between"], t: "Several unordered categories as the outcome: multinomial logistic regression", a: "One equation per level against a baseline; exp(b) is a relative risk ratio.", go: [["Advanced", "Multinomial Logistic Regression"]], m: "predict-more" },
    { k: ["trend", "over time", "time series", "monthly", "seasonal", "forecast", "years", "series"], t: "A series over time: Time Series", a: "Decomposition into trend, season and remainder, autocorrelation, a trend test with Durbin-Watson, and a Holt forecast with its band.", go: [["Advanced", "Time Series"]], m: "time" },
    { k: ["survival", "time to event", "how long until", "kaplan", "cox", "hazard", "censored", "survive"], t: "Time to an event: Kaplan-Meier, log-rank, Cox", a: "Time observed plus an event flag; censored subjects are handled properly. Read median survival, the log-rank test and Cox hazard ratios.", go: [["Advanced", "Survival Analysis: Kaplan-Meier, log-rank, Cox"]], m: "survival" },
    { k: ["reliability", "cronbach", "alpha", "questionnaire", "scale items", "items hang together", "internal consistency"], t: "Do the items of a scale hang together: Cronbach's alpha", a: "One column per item of one scale; read alpha, item-total correlations, and alpha if each item is dropped.", go: [["Advanced", "Reliability (Cronbach's alpha)"]], m: "scales" },
    { k: ["factor analysis", "factors", "latent", "dimensions", "principal component", "pca", "reduce variables", "summarize many variables"], t: "Structure in many variables: factor analysis or PCA", a: "Exploratory Factor Analysis when the goal is latent traits behind items; Principal Component Analysis to summarize many measurements by a few.", go: [["Advanced", "Exploratory Factor Analysis"], ["Advanced", "Principal Component Analysis"]], m: "structure" },
    { k: ["cluster", "clusters", "segments", "natural groups", "k-means", "kmeans", "group the cases"], t: "Natural groups of cases: k-means clustering", a: "Standardized numeric variables, a seed, and the elbow plot to choose k. Clusters are a description, not a test.", go: [["Advanced", "k-means Clustering"]], m: "structure" },
    { k: ["sample size", "how many", "power", "how big a sample", "margin of error", "plan a study", "participants do i need"], t: "How many people do I need: power and sample size", a: "For a survey estimate, the margin-of-error calculator. For a test, Power and Sample Size with the effect size that would matter, alpha and a target power of 0.80.", go: [["Advanced", "Power and Sample Size"], ["distrACTION", "Sample size for a margin of error"]], m: "plan" },
    { k: ["bootstrap", "resample", "no normality", "assumption free", "assumptions doubtful", "robust interval"], t: "An interval without the formula's assumptions: bootstrap", a: "A confidence interval for a mean, median, SD, proportion, correlation or difference from resampling your own data.", go: [["Advanced", "Bootstrap confidence interval"]], m: "plan" },
    { k: ["permutation", "randomization test", "reshuffle", "shuffle labels"], t: "A p-value by reshuffling: permutation test", a: "The null distribution is built by shuffling group labels in your own data; no normality needed.", go: [["Advanced", "Permutation test"]], m: "plan" },
    { k: ["confounder", "confounding", "lurking", "third variable", "omitted variable", "causal", "causation", "sensitivity analysis", "hazlett", "unmeasured"], t: "Could a lurking variable explain the result: sensitivity analysis", a: "After a regression on observational data, the Cinelli-Hazlett benchmark says how strong an unmeasured confounder would have to be, in the units of a covariate you did measure, to explain the result away.", go: [["Regression", "Sensitivity to a lurking variable"]], m: "causal" },
    { k: ["not normal", "skewed", "skew", "outliers", "nonparametric", "non-parametric", "rank", "small sample", "violates"], t: "Skewed data or a small sample: the rank-based tests", a: "Mann-Whitney U for two groups, Wilcoxon signed-rank for pairs, Kruskal-Wallis for three or more groups, Friedman for repeated measures. The t and F tests are fine from about 30 per group whatever the shape.", go: [["Nonparametric", "Mann-Whitney U (two groups)"], ["Nonparametric", "Wilcoxon signed-rank and sign test (paired)"], ["ANOVA", "Kruskal-Wallis (three or more groups)"]], m: "two" },
    { k: ["normality", "normal", "qq", "q-q", "bell", "check normal", "shape"], t: "Is my variable roughly normal", a: "Look: a histogram and a QQ plot. Points near the line mean near normal. The check matters most for small samples.", go: [["Graph", "QQ Plot"], ["Graph", "Histogram"]], m: "first" },
    { k: ["describe", "descriptive", "summary", "mean median", "standard deviation", "average", "spread", "what does my data look like", "overview"], t: "Describe a variable: Descriptives and graphs", a: "Mean, median, SD, quartiles and frequency tables, with histograms, boxplots and bar charts by group.", go: [["Exploration", "Descriptives"], ["Graph", "Histogram"], ["Graph", "Boxplot"]], m: "describe" },
    { k: ["which test", "what test", "which analysis", "what should i use", "not sure", "help me choose", "where do i start", "don't know"], t: "Not sure which test: the wizard and the Methods Guide", a: "Which test? asks three questions and opens the right dialog. The Methods Guide covers every method by research question, with the steps.", go: [["T-Tests", "Which test?"]], m: "map" },
    { k: ["load data", "open csv", "import", "paste", "my own data", "upload", "excel", "spreadsheet", "google sheets"], t: "Getting your data in", a: "Data, Open CSV file (export from Excel or Google Sheets as CSV), or Data, Paste data straight from a spreadsheet: one row per case, one column per variable, names in the first row.", go: [["Data", "Open CSV file"], ["Data", "Paste data"]], m: "first" },
    { k: ["filter", "subset", "only rows", "exclude", "where", "keep rows"], t: "Analyze a subset of rows", a: "The Filter box above the table keeps rows where a formula is true, for example Year == \"Freshman\" and GPA > 3. Every analysis then uses the kept rows.", go: [["Data", "Filters"]], m: "first" },
    { k: ["script", "r script", "r code", "the r code", "show me the r", "in r", "how would i do this in r", "code for this", "export to r", "reproducib", "replicat", "what did i do", "list of steps", "steps i took", "my steps", "history", "log of", "syntax", "audit trail", "methods section", "write the methods"], t: "Script: every step on the page, with the R code", a: "Results, Script lists every analysis and graph on the page in order with the choices made in each dialog, and writes the R call that does the same (t.test, aov, lm, glm, lmer, chisq.test, ggplot2, tidyr, dplyr), ready to download as a .R file. Share link and Save session carry the same steps so the app itself can run them again.", go: [["Results", "Script: every step, with the R code"], ["Results", "Share link (data + analyses)"]], m: "report" },
    { k: ["script", "r script", "r code", "the r code", "show me the r", "in r", "how would i do this in r", "code for this", "export to r", "reproducib", "replicat", "what did i do", "list of steps", "steps i took", "my steps", "history", "log of", "syntax", "audit trail", "methods section", "write the methods"], t: "Script: every step on the page, with the R code", a: "Results, Script lists every analysis and graph on the page in order with the choices made in each dialog, and writes the R call that does the same (t.test, aov, lm, glm, lmer, chisq.test, ggplot2, tidyr, dplyr), ready to download as a .R file. Share link and Save session carry the same steps so the app itself can run them again.", go: [["Results", "Script: every step, with the R code"], ["Results", "Share link (data + analyses)"]], m: "report" },
    { k: ["small multiples", "facet", "facets", "one panel per", "panel per group", "separate graphs for each", "separate panels", "colorblind", "color blind", "colour blind", "palette", "axis range", "log scale", "logarithmic", "reference line", "horizontal line", "vertical line", "legend", "font size", "bigger font", "graph title", "axis label", "axis labels", "change the colors", "change the colours", "theme", "svg", "vector graphic", "publication quality", "ggplot", "customize the graph", "customise the graph", "edit the graph"], t: "Graph appearance: titles, labels, colors, panels", a: "Every graph dialog (bar, histogram, dotplot, boxplot, scatter) has an Appearance section: title and axis labels, a color, a palette for groups (Okabe-Ito is colorblind safe; grayscale prints), small multiples (one panel per level of a column, ggplot2's facet_wrap), legend position, a minimal or classic theme, font size, axis ranges, log scales and reference lines (y = 3.0, x = 70). Every graph downloads as PNG or SVG. The edit button on a card reopens the dialog with your choices.", go: [["Graph", "Histogram"], ["Graph", "Boxplot"], ["Graph", "Scatter Plot"], ["Graph", "Bar Plot"]], m: "describe" },
    { k: ["wide to long", "long format", "long form", "pivot longer", "pivot_longer", "gather", "melt", "one row per measurement", "reshape", "tidy data", "unpivot"], t: "Reshape wide to long (pivot_longer)", a: "When each time point or condition sits in its own column (week1, week4, week8), the long layout puts every value in its own row with a column saying which measurement it is. Pick the columns to gather and the ID columns to keep; the card shows the matching tidyr line. Stack columns is the simpler two-column version.", go: [["Data", "Reshape: wide to long"], ["Data", "Stack columns"]], m: "first" },
    { k: ["long to wide", "wide format", "wide form", "pivot wider", "pivot_wider", "spread", "one column per time", "one row per person", "one row per case", "unstack", "cast"], t: "Reshape long to wide (pivot_wider)", a: "When each row is one measurement (student, week, score), the wide layout gives one row per case and one column per week. Pick the ID columns, the column whose values become names and the column that fills the cells; duplicates are reported, as R does. Paired tests, repeated-measures ANOVA and reliability want this layout.", go: [["Data", "Reshape: long to wide"]], m: "first" },
    { k: ["merge", "join", "combine two tables", "combine two files", "two files", "two tables", "match by id", "lookup", "vlookup", "add columns from another", "another dataset", "second table", "left join", "inner join"], t: "Merge with another table (join)", a: "Match rows of this table with rows of another by a key such as a student ID, keeping every row here (left join), only matches (inner) or everything (full). Paste the other table or pick a sample; the card counts matches and shows the dplyr line. Try the class data with the Exam 1 file (Student_ID = StudentID).", go: [["Data", "Merge with another table (join)"]], m: "first" },
    { k: ["group by", "group_by", "summarize", "summarise", "aggregate", "per group", "means by group", "mean by group", "summary table", "pivot table", "table of means", "average by", "by group", "for each group", "count per"], t: "Group by and summarize", a: "A summary table with one row per group: n, mean, SD, median, min, max, sum and blanks for the columns you pick, by one or two grouping columns, optionally as a new data table. The card shows the group_by and summarise line. For a test between the groups use ANOVA or the t test instead.", go: [["Data", "Group by and summarize"], ["Exploration", "Descriptives"]], m: "describe" },
    { k: ["duplicates", "duplicate rows", "blank rows", "missing values", "missing data", "na values", "clean the data", "clean my data", "remove blanks", "drop rows", "drop_na", "na.strings", "trailing space", "stray spaces", "empty rows"], t: "Clean rows: blanks, duplicates, spaces", a: "Turns missing-value codes (NA, N/A, ., -) into blanks, trims stray spaces, removes exact duplicates and rows with a blank in the columns you name, and drops empty rows, reporting each count. Every analysis already leaves blanks out of its own computation; cleaning matters when codes like NA were read as text.", go: [["Data", "Clean rows (blanks, duplicates)"]], m: "first" },
    { k: ["new column", "compute", "transform", "log", "recode", "difference column", "z-score", "standardize"], t: "Make a new column", a: "Data, Compute for a formula from other columns (after minus before), Transform for log, square root or standardizing, Add z-score column, Bin into classes for groups from a number.", go: [["Data", "Compute"], ["Data", "Transform"]], m: "first" },
    { k: ["p-value", "p value", "significant", "significance", "reject", "null hypothesis", "alpha"], t: "What the p-value means", a: "The probability of data at least this extreme if H₀ were true. Reject H₀ when p ≤ α (usually 0.05). It is not the probability that H₀ is true, and a small p says nothing about how big the effect is: read the effect size and the interval too.", go: [["Learn", "What a p-value is"]], m: "glossary" },
    { k: ["effect size", "cohen", "how big", "practical", "eta", "magnitude"], t: "Effect size: how big, not just whether", a: "Cohen's d for means, r or R² for relationships, η² for ANOVA, odds ratios for yes or no. Every card prints one next to the p-value.", m: "glossary" },
    { k: ["confidence interval", "interval", "margin", "ci", "95%"], t: "Confidence interval", a: "The range of population values the data support at the stated level; its width shows precision. Tick Confidence interval on any test dialog.", m: "glossary" },
    { k: ["report", "apa", "write up", "write-up", "how to write", "cite", "paper", "results section"], t: "Writing up a result", a: "Every card prints an APA-style line to paste (statistic, df, p, effect size, interval). The Methods Guide has a reporting checklist for a lab report and for a paper.", m: "report" },
    { k: ["one sided", "one-sided", "two sided", "two-sided", "tail", "directional", "greater", "less than"], t: "One-sided or two-sided", a: "Decide before you look at the data. Two-sided tests for any difference; one-sided only when a difference in the other direction would be ignored by design. Every test dialog has a Hypothesis choice.", m: "first" },
    { k: ["symbols", "notation", "words", "read aloud", "x bar", "sigma"], t: "Symbols or words", a: "Results, Notation switches formulas and hypotheses between the textbook's symbols (x̄, σ, χ², H₀) and words, which read aloud better.", m: null },
    { k: ["researcher", "student mode", "mode", "field", "professional", "set up for"], t: "Student or researcher, and your field", a: "The chips on the start screen (or the button in the data bar) set who you are and your field. Researcher cards lead with the result and fold the formula under Method; the field puts its datasets and usual analyses first.", m: null },
    { k: ["save", "share", "link", "export", "pdf", "print", "session", "keep my work"], t: "Saving and sharing", a: "Results, Save session keeps data and results in one file; Share link puts both in a URL; Print or save as PDF and Export results as HTML are there too.", go: [["Results", "Save session (data + results)"], ["Results", "Share link (data + analyses)"]], m: "report" },
    { k: ["decimals", "rounding", "decimal places"], t: "Decimal places", a: "Results, Decimal places shown: 2, 3, 4 or 6. Stored values are full precision.", go: [["Results", "Decimal places shown"]], m: null },
    { k: ["mcnemar", "paired yes no", "changed their mind", "before after yes"], t: "A yes or no measured twice: McNemar", a: "The same people answered yes or no twice: McNemar uses only the ones who changed.", go: [["Advanced", "McNemar test (paired yes or no)"]], m: "paired" },
    { k: ["ancova", "covariate", "adjust for", "controlling for", "pretest as covariate"], t: "Groups after adjusting for a covariate: ANCOVA", a: "A group comparison with a numeric covariate such as a pre-test. Check the homogeneity-of-slopes line first.", go: [["ANOVA", "ANCOVA"]], m: "factorial" },
    { k: ["two factors", "two-way", "interaction", "two way anova", "factorial"], t: "Two factors at once: two-way ANOVA", a: "Read the interaction row first; if it is significant, describe cell means rather than main effects.", go: [["ANOVA", "Two-Way ANOVA"]], m: "factorial" },
    { k: ["repeated measures", "three times", "several times", "weeks", "over sessions", "within subjects", "friedman"], t: "The same people measured three or more times: repeated-measures ANOVA", a: "Wide data: one column per time point. Friedman is the rank-based version.", go: [["ANOVA", "Repeated Measures and Mixed ANOVA"], ["ANOVA", "Friedman (nonparametric repeated measures)"]], m: "three" },
    { k: ["variance", "standard deviations equal", "compare spread", "levene", "f test for variances", "process spread"], t: "Compare spreads: variance tests", a: "One SD against a claimed value (chi-square) or two SDs (F). Levene's test is on the one-way ANOVA card.", go: [["Advanced", "Variance tests (one SD or two SDs)"]], m: "designs" },
    { k: ["probability", "distribution", "normal distribution", "binomial distribution", "z score table", "calculator", "area under"], t: "Probability calculators: distrACTION", a: "Normal, t, chi-square, F, binomial, Poisson and more, with the picture of the shaded area. No data needed.", go: [["distrACTION", "Normal Distribution"], ["distrACTION", "Binomial Distribution"]], m: null },
    { k: ["columns", "my data", "what variables", "which variables", "data types", "numeric categorical"], t: "What is in your data", a: null, special: "columns" },
  ];
  // Ask, part two: questions. "What is a p-value", "SE or SD", "what does this result mean". Plain-words answers,
  // a demo to see it when Learn has one, and the glossary. k: phrases that must appear; t: title; a: answer.
  const ASKQA = [
    { k: ["what is a p-value", "what is a p value", "what is the p-value", "what is the p value", "p-value mean", "p value mean", "meaning of p", "define p-value", "define p value", "interpret the p", "interpret p", "what does p"], t: "The p-value", a: "If H₀ were exactly true, the p-value is the probability of getting a result at least as far from H₀ as yours. Small p (at or below α, usually 0.05) means the data would be unusual under H₀, so you reject H₀. It is not the probability that H₀ is true, and it says nothing about how big the effect is; read the effect size and the interval for that.", go: [["Learn", "What a p-value is"]], m: "glossary" },
    { k: ["what is alpha", "what does alpha", "significance level", "level of significance", "why 0.05", "why .05", "0.05 mean", "alpha mean", "alpha of 0.05"], t: "α, the significance level", a: "α is the risk of a false alarm you accept before looking: the probability of rejecting H₀ when it is true. 0.05 is a convention (one false alarm in 20), not a law; 0.01 is stricter, 0.10 looser. Set it before the test, then compare p with it. Reliability's Cronbach's alpha is a different alpha: a measure of how well scale items hang together.", m: "glossary" },
    { k: ["null hypothesis", "alternative hypothesis", "what is h0", "what is h₀", "what is ha", "fail to reject", "accept the null", "accept h0", "reject the null mean", "reject h0 mean", "hypotheses mean"], t: "H₀ and Hₐ, and what rejecting means", a: "H₀ (the null) is the claim of no difference or no effect: μ = 30, p = 0.5, two groups equal. Hₐ (the alternative) is what you suspect instead. The test asks whether the data are unlikely under H₀. Reject H₀ when p ≤ α; otherwise fail to reject, which is not the same as accepting H₀: the data were simply not strong enough to rule it out.", m: "glossary" },
    { k: ["type i error", "type 1 error", "type ii error", "type 2 error", "false positive", "false negative", "types of error"], t: "Type I and Type II errors", a: "A Type I error rejects a true H₀ (a false alarm); its probability is α. A Type II error misses a real effect (fails to reject a false H₀); its probability is β, and power = 1 − β. Lowering α makes false alarms rarer but misses more real effects; a bigger sample reduces both.", go: [["Advanced", "Power and Sample Size"]], m: "glossary" },
    { k: ["what is power", "statistical power", "power mean", "power of a test", "power of the test", "80% power", "0.8 power"], t: "Power", a: "Power is the probability the test detects an effect of a given size when it is really there, 1 − β. 0.80 is the usual target. Power rises with sample size, with a larger true effect, with less noise, and with a larger α. Before a study, use Power and Sample Size to find the n that reaches 0.80; after a non-significant result, low power is the first explanation to check.", go: [["Advanced", "Power and Sample Size"]], m: "plan" },
    { k: ["what is a confidence interval", "confidence interval mean", "interpret a confidence interval", "interpret the confidence interval", "interpret the interval", "95% confident", "95 percent confident", "confidence level mean", "what does the interval"], t: "A confidence interval", a: "The range of population values the data are consistent with. '95% confident' describes the method: if you repeated the study many times, about 95% of such intervals would contain the true value. It does not mean a 95% probability that this one does. A narrow interval is a precise estimate; one that excludes the H₀ value agrees with a significant test at the matching α.", go: [["Learn", "What a confidence interval means"]], m: "glossary" },
    { k: ["what is standard deviation", "standard deviation mean", "what is the standard deviation", "what is variance", "variance mean", "what does sd", "sd mean", "s versus sigma", "s vs sigma"], t: "Standard deviation and variance", a: "The standard deviation is the typical distance of a value from the mean, in the data's own units; the variance is its square. A sample SD (s) divides by n − 1; the population SD (σ) divides by N. For roughly bell-shaped data about 68% of values are within one SD of the mean and 95% within two. SD is about the spread of individuals; the standard error is about the precision of an estimate.", go: [["Exploration", "Descriptives"]], m: "describe" },
    { k: ["standard error", "what is se", "se vs sd", "sd vs se", "se or sd", "sd or se", "se and sd", "sd and se", "standard deviation vs standard error", "standard error vs standard deviation", "what is sem", "se mean"], t: "Standard error, and how it differs from SD", a: "The standard error is the SD of a statistic over repeated samples: how much the sample mean (or proportion, or slope) would wobble from sample to sample. For a mean it is s/√n, so it shrinks as n grows while the SD of the data does not. SD describes the people; SE describes how well the mean is pinned down. Intervals are estimate ± critical value × SE.", go: [["Learn", "Sampling distribution simulator"]], m: "glossary" },
    { k: ["what is a z-score", "what is a z score", "z-score mean", "z score mean", "standardized score", "how many standard deviations", "z of 2", "z = 2"], t: "A z-score", a: "z = (value − mean)/SD: how many standard deviations a value sits from the mean, with the sign showing which side. z = 2 is two SDs above; z = −1.5 is one and a half below. Scores on different scales become comparable once standardized. In a test, the test statistic is a z-score (or t) of the estimate under H₀.", go: [["Data", "Add z-score column"], ["distrACTION", "Normal Distribution"]], m: "describe" },
    { k: ["mean vs median", "mean or median", "median vs mean", "median or mean", "which average", "what is the median", "what is the mode", "measure of center", "measures of center", "when to use the median"], t: "Mean, median, mode: which center", a: "The mean adds and divides, so a few extreme values pull it. The median is the middle value and ignores how extreme the ends are. For skewed data (income, house prices, wait times) report the median; for roughly symmetric data the two agree and the mean is standard. The mode is the most common value, the only center for categories. Click to add values in the Learn demo and watch the mean chase the outlier.", go: [["Learn", "Mean versus median (click to add values)"], ["Exploration", "Descriptives"]], m: "describe" },
    { k: ["what is skew", "skewness mean", "skewed mean", "right skewed", "left skewed", "positively skewed", "negatively skewed", "skewed right", "skewed left", "what is kurtosis", "kurtosis mean"], t: "Skewness and kurtosis", a: "Right (positive) skew: a long tail to the right, mean above the median, as with incomes. Left (negative) skew: the tail to the left, mean below the median, as with exam scores near a ceiling. Skewness near 0 is symmetric; beyond ±1 is clearly skewed. Kurtosis describes the tails: heavy tails (more outliers than a normal curve) give a positive excess kurtosis. Both appear under Descriptives.", go: [["Graph", "Histogram"], ["Exploration", "Descriptives"]], m: "describe" },
    { k: ["what is the iqr", "what is iqr", "interquartile", "quartile mean", "what is a quartile", "five number summary", "five-number summary", "1.5 iqr", "whisker", "what is a boxplot", "box plot mean", "boxplot mean", "read a boxplot"], t: "Quartiles, IQR and the boxplot", a: "Q1, the median and Q3 cut the sorted data into quarters; IQR = Q3 − Q1 is the spread of the middle half and is not moved by outliers. The boxplot draws the box from Q1 to Q3 with the median inside; whiskers reach the farthest values within 1.5 IQR of the box, and anything beyond is plotted as a point and flagged as an outlier. The five-number summary is min, Q1, median, Q3, max.", go: [["Graph", "Boxplot"], ["Exploration", "Descriptives"]], m: "describe" },
    { k: ["what is an outlier", "outlier mean", "remove outliers", "should i remove", "drop an outlier", "delete outliers", "deal with outliers", "handle outliers"], t: "Outliers: spotting and handling them", a: "An outlier is a value far from the rest: beyond 1.5 IQR of the box, or a z beyond about 3. First check whether it is a typo or a measurement error; fix or drop those and say so. A real but extreme value should stay. Report the analysis with and without it, or use a method that is robust to it (median and IQR, a rank-based test, a bootstrap interval). Never drop a point only because it spoils the result.", go: [["Graph", "Boxplot"], ["Learn", "Regression: outliers and influence"]], m: "describe" },
    { k: ["histogram vs bar", "bar chart vs histogram", "bar graph vs histogram", "difference between a histogram", "histogram or bar", "which graph", "what graph should", "which chart", "what chart"], t: "Which graph for which variable", a: "A bar chart (or pie) shows counts of categories: the bars are separate and their order is yours. A histogram shows the shape of a numeric variable: the bars touch because they are classes of a number line. A boxplot compares the spread of a number across groups; a dotplot or stem and leaf keeps every value; a scatterplot shows two numbers together; a line graph is for a number over time. Every graph here follows the honest-graph rules (a zero baseline on bars, no 3-D).", go: [["Graph", "Histogram"], ["Graph", "Bar Plot"], ["Graph", "Scatter Plot"]], m: "describe" },
    { k: ["sampling distribution", "central limit theorem", "what is the clt", "clt mean", "why normal", "why 30", "n of 30", "sample size of 30", "at least 30", "30 or more"], t: "Sampling distributions and the Central Limit Theorem", a: "Take many samples of the same size and compute the mean of each: the spread of those means is the sampling distribution, with SD σ/√n. The Central Limit Theorem says that as n grows this distribution becomes close to normal whatever the shape of the population, which is why t and z tests on means work for skewed data once n is around 30 or more (more for very skewed data, fewer for near-normal data). Watch it happen in the Learn demo.", go: [["Learn", "The Central Limit Theorem"], ["Learn", "Sampling distribution simulator"]], m: "glossary" },
    { k: ["parameter vs statistic", "parameter and statistic", "statistic vs parameter", "population vs sample", "sample vs population", "what is a parameter", "what is a statistic", "mu vs x bar", "greek letters", "why greek"], t: "Population and sample, parameter and statistic", a: "The population is everyone you want to describe; the sample is who you measured. A parameter is a number about the population (μ, σ, p), fixed but unknown; a statistic is the same number computed from the sample (x̄, s, p̂), known but varying from sample to sample. Inference uses the statistic to say what the parameter is likely to be. Greek letters are parameters; Roman letters with hats and bars are statistics.", m: "glossary" },
    { k: ["degrees of freedom", "what is df", "df mean", "what does df", "why n minus 1", "why n-1", "why n − 1", "n minus 1"], t: "Degrees of freedom", a: "Degrees of freedom count the independent pieces of information left after estimating what the formula needs. A sample SD uses the mean first, so n deviations have n − 1 free values (the last is fixed because they sum to zero), which is why s divides by n − 1. The t distribution's shape depends on df: with few df it has heavy tails and a larger critical value; past about 30 it is close to normal. In ANOVA and chi-square, df count groups or cells minus the constraints.", m: "glossary" },
    { k: ["t or z", "t vs z", "z or t", "z vs t", "t test or z test", "z test or t test", "when do i use t", "when to use t", "when do i use z", "when to use z", "sigma known", "sigma unknown", "t instead of z", "use t"], t: "t or z", a: "Use z when the population SD σ is known (a textbook situation, or a proportion, where SE comes from p₀) and t when σ is estimated by the sample s, which is almost always with real data. t has heavier tails to pay for the extra uncertainty in s; with n above about 30 the two give nearly the same answer, but t is still the correct choice. For proportions the z test is standard when n p₀ and n(1 − p₀) are both at least 10; otherwise use the exact binomial test.", go: [["T-Tests", "One Sample T-Test"], ["T-Tests", "One Sample Z-Test (sigma known)"], ["Frequencies", "One proportion: z test"]], m: "compare" },
    { k: ["one tailed", "two tailed", "one-tailed", "two-tailed", "tails mean", "what is a tail", "which tail", "left tailed", "right tailed"], t: "One-tailed or two-tailed", a: "Two-tailed asks whether the parameter differs from H₀ in either direction (≠), and the p-value counts both tails. One-tailed asks about one direction only (< or >), has a smaller p for a result in that direction, and gives no evidence at all for a result in the other direction. Choose before seeing the data, and only one-tailed when the other direction is genuinely impossible or irrelevant. Journals mostly expect two-tailed.", m: "glossary" },
    { k: ["statistically significant mean", "what does significant mean", "what does statistically significant", "significant but small", "practical significance", "practically significant", "significant vs important", "clinically significant", "real world significance"], t: "Statistically significant is not the same as important", a: "Significant means p ≤ α: the result would be unusual if H₀ were true. With a large sample a tiny, useless difference is significant; with a small sample a large, real difference may not be. So read two things: the p-value for whether, and the effect size (d, r, R², odds ratio) with its interval for how much. Every card prints both. 'Not significant' means not enough evidence, not 'no effect'.", m: "report" },
    { k: ["what is cohen's d", "what is cohens d", "cohen's d mean", "cohens d mean", "interpret d", "d of 0.5", "small medium large", "what is eta squared", "eta squared mean", "eta² mean", "interpret eta", "what is omega squared", "what is cramer's v", "cramér's v", "what is phi"], t: "Effect sizes for means and tables: d, η², Cramér's V", a: "Cohen's d is the difference between two means in SD units: about 0.2 is small, 0.5 medium, 0.8 large, as rough benchmarks. η² (eta squared) is the share of the outcome's variance explained by the groups in ANOVA: 0.01 small, 0.06 medium, 0.14 large; ω² is its less biased cousin. For tables, φ (2 by 2) and Cramér's V (larger tables) run from 0 to 1 like a correlation. Benchmarks are a starting point; what counts as large depends on the field.", m: "glossary" },
    { k: ["what is r squared", "what is r²", "r squared mean", "r² mean", "r2 mean", "interpret r squared", "interpret r²", "coefficient of determination", "adjusted r squared", "adjusted r²", "variance explained"], t: "R² and adjusted R²", a: "R² is the share of the outcome's variation that the model explains: 0.40 means 40%, and the other 60% is unexplained. For one predictor it is the square of the correlation r. It never falls when you add a predictor, even a useless one, so adjusted R² corrects for the number of predictors and is the one to compare models with. A high R² does not mean the model is right or causal; check the residual plots.", go: [["Regression", "Linear Regression"], ["Advanced", "Multiple Linear Regression"]], m: "predict-num" },
    { k: ["what is correlation", "correlation mean", "what does correlation", "interpret r", "pearson r mean", "pearson's r mean", "strong correlation", "weak correlation", "negative correlation", "positive correlation", "correlation coefficient", "r of 0.3", "spearman vs pearson", "pearson vs spearman"], t: "The correlation coefficient r", a: "r measures how closely two numeric variables follow a straight line, from −1 to 1. The sign gives the direction (negative: one rises as the other falls); the size gives the strength: about 0.1 weak, 0.3 moderate, 0.5 strong, as rough guides. r = 0 means no linear relationship, not no relationship, so look at the scatterplot. Spearman's version uses ranks and suits ratings, skewed data and outliers. Correlation does not show cause.", go: [["Exploration", "Scatterplot"], ["Learn", "Guess the correlation"]], m: "relate" },
    { k: ["correlation is not causation", "correlation causation", "correlation and causation", "does correlation", "cause and effect", "prove cause", "prove that", "causes", "cause", "causal"], t: "Correlation and causation", a: "A correlation says two things move together; it does not say one causes the other. A third variable may drive both (ice cream sales and drownings both follow summer), or the direction may be reversed. A randomized experiment is the clean way to show cause; with observational data, adjust for the confounders you measured and use the sensitivity analysis to ask how strong an unmeasured one would have to be to explain the result away.", go: [["Regression", "Sensitivity to a lurking variable"]], m: "causal" },
    { k: ["what is the slope", "slope mean", "interpret the slope", "interpret slope", "what does the slope", "intercept mean", "what is the intercept", "interpret the intercept", "regression equation", "what is y hat", "predicted value mean", "regression line mean", "b1 mean", "b₁ mean", "b0 mean"], t: "Reading a regression line: slope and intercept", a: "ŷ = b₀ + b₁x. The slope b₁ is the predicted change in y for a one-unit increase in x (b₁ = 2.5 with hours and score: each extra hour predicts 2.5 more points). The intercept b₀ is the predicted y when x = 0, which is only meaningful if x = 0 is a possible value. ŷ is the prediction for a given x; the residual y − ŷ is how far the actual value fell from it. Predicting outside the range of x you observed is extrapolation.", go: [["Regression", "Linear Regression"]], m: "predict-num" },
    { k: ["what is a residual", "residual mean", "residuals mean", "what are residuals", "residual plot", "read the residual", "what does the residual plot"], t: "Residuals and the residual plot", a: "A residual is actual minus predicted, y − ŷ: positive when the point sits above the line. The residual plot (residuals against fitted values or x) should look like a shapeless cloud around zero. A curve means the straight line is wrong; a fan that widens means the spread is not constant; isolated far points are outliers. The QQ plot of residuals checks their normality, which matters for the intervals with small n.", go: [["Regression", "Linear Regression"]], m: "predict-num" },
    { k: ["regression assumptions", "assumptions of regression", "assumptions for regression", "homoscedasticity", "heteroscedasticity", "heteroskedasticity", "linearity assumption", "constant variance", "equal variance assumption", "assumptions of the t test", "assumptions of anova", "anova assumptions", "what are the assumptions"], t: "Assumptions, and what the cards check", a: "Linear regression: a straight-line relationship, independent observations, residuals with constant spread (homoscedasticity) and roughly normal residuals (needed for the intervals with small n). The t test and ANOVA: independent observations, roughly normal data within each group or n of 30 or more, and for the classical versions equal spreads (Welch's t and the Welch ANOVA drop that one). Every card runs the checks it can and prints a plain line for each; the Nonparametric and Bootstrap items are the fallbacks.", m: "predict-num" },
    { k: ["multicollinearity", "collinearity", "collinear", "what is vif", "vif mean", "variance inflation", "predictors correlated", "predictors are correlated", "correlated predictors"], t: "Multicollinearity and VIF", a: "When predictors are strongly correlated with each other the model cannot tell their effects apart: coefficients swing with small changes in the data and their SEs inflate. The VIF (variance inflation factor) for a predictor says how many times its variance is inflated by the others; above 5 is a concern, above 10 serious. Fixes: drop or combine redundant predictors, or center them before making interaction and squared terms. Prediction is fine either way; it is the individual coefficients that become unreliable.", go: [["Advanced", "Multiple Linear Regression"]], m: "predict-more" },
    { k: ["dummy variable", "dummy variables", "dummy coding", "indicator variable", "reference level", "reference category", "baseline level", "baseline category", "what does vs mean", "vs in the name", "categorical predictor mean"], t: "Dummy variables and the reference level", a: "A categorical predictor with k levels enters a regression as k − 1 columns of 0s and 1s. One level is the reference; each coefficient is the difference between that level and the reference, holding the other predictors fixed. The app names them 'Year = Senior (vs Freshman)' and picks the most common level as reference so every comparison is stable; the dialog lets you choose another. To test the predictor as a whole, compare the model with and without all its dummies at once.", go: [["Advanced", "Multiple Linear Regression"]], m: "predict-more" },
    { k: ["what is an interaction", "what is interaction", "interaction mean", "interaction term", "interaction effect", "what is moderation", "moderator", "moderating", "effect depends on", "effect differs by", "differs by group", "a times b"], t: "Interactions (moderation)", a: "An interaction means the effect of one predictor depends on the level of another: a drug helps women more than men, or the hours–score slope is steeper for freshmen. In ANOVA it is the A × B row; in regression it is the product term a × b, whose coefficient says how much the slope of a changes per unit of b (or between groups). When the interaction is significant, describe the effect separately within each level rather than quoting a single main effect.", go: [["ANOVA", "Two-Way ANOVA"], ["Advanced", "Multiple Linear Regression"]], m: "factorial" },
    { k: ["what is an odds ratio", "what is the odds ratio", "odds ratio mean", "interpret odds ratio", "interpret the odds ratio", "or of 2", "log odds", "what is logit", "logit mean", "odds vs probability", "odds and probability", "odds mean", "what are odds", "exp(b)", "exponentiate"], t: "Odds, log odds and the odds ratio", a: "Odds = p/(1 − p): a 75% chance is odds of 3 (3 to 1). Logistic regression models the log of the odds as a straight line, so each coefficient b is a change in log odds, and exp(b) is an odds ratio: how many times the odds multiply for a one-unit increase in the predictor (or for that level versus the reference). OR = 1 is no effect; 2 doubles the odds; 0.5 halves them. The odds ratio is not a ratio of probabilities (the relative risk) unless the outcome is rare.", go: [["Advanced", "Logistic Regression"], ["Frequencies", "Contingency Tables: Independent Samples"]], m: "predict-yn" },
    { k: ["rate ratio", "what is irr", "irr mean", "incidence rate ratio", "incidence rate", "what is overdispersion", "overdispersion mean", "dispersion mean", "dispersion statistic", "poisson or negative binomial", "poisson vs negative binomial", "when to use negative binomial", "exposure", "offset"], t: "Rate ratios, overdispersion, and when to switch to negative binomial", a: "Count regression models the log of the expected count, so exp(b) is a rate ratio (IRR): how many times the expected count multiplies per unit of the predictor. With an exposure (person-years, days observed), include it as an offset so the model is about the rate. The Poisson model assumes variance = mean; the dispersion statistic (Pearson χ²/df) near 1 says that holds, well above 1 (overdispersion) says the SEs are too small and the negative binomial model, which adds a spread parameter θ, is the fix. The card tests the two against each other.", go: [["Advanced", "Count Regression: Poisson and Negative Binomial"]], m: "predict-more" },
    { k: ["what is aic", "aic mean", "what is bic", "bic mean", "information criterion", "which model is better", "compare two models", "compare models", "model fit mean", "lower aic", "aic lower"], t: "AIC and BIC: comparing models", a: "AIC and BIC measure fit penalized for complexity (BIC penalizes extra parameters harder). Lower is better, and only differences matter, on the same data and outcome: a drop of 2 is worth noticing, of 10 or more is decisive. They let you compare models that are not nested (Poisson against negative binomial, two sets of predictors). For nested models the likelihood-ratio test gives a p-value as well; the cards print both where they apply.", m: "predict-more" },
    { k: ["likelihood ratio", "likelihood-ratio", "log-likelihood", "log likelihood", "what is deviance", "deviance mean", "what is the lrt", "lrt mean", "chi-square of the model", "model chi-square", "omnibus test"], t: "Log-likelihood, deviance and the likelihood-ratio test", a: "The log-likelihood measures how probable the data are under the fitted model; higher is better. The deviance is twice the gap to a perfect fit. The likelihood-ratio test compares two nested models by 2 × (difference in log-likelihood), which follows a χ² with df equal to the number of extra parameters. The model chi-square on a logistic or count card is this test against the intercept-only model: does the set of predictors help at all.", m: "predict-more" },
    { k: ["what is reml", "reml mean", "restricted maximum", "ml vs reml", "reml vs ml", "reml or ml", "maximum likelihood mean", "what is maximum likelihood"], t: "ML and REML", a: "Maximum likelihood (ML) picks the parameter values that make the observed data most probable. In a mixed model ML slightly understates the variances because it does not account for estimating the fixed effects; REML (restricted ML) corrects that, the way s divides by n − 1 instead of n. Use REML (the default, as in lme4) to report variances, and ML when comparing models that differ in their fixed effects by AIC or a likelihood-ratio test.", go: [["Advanced", "Mixed-Effects Model (nested or repeated data)"]], m: "mixed" },
    { k: ["what is icc", "the icc", "icc mean", "icc", "intraclass", "intra-class", "fixed vs random", "fixed and random", "fixed or random", "random effect mean", "what is a random effect", "what are random effects", "fixed effect mean", "what is a fixed effect", "what is a blup", "blup mean", "random intercept mean", "random slope mean"], t: "Fixed effects, random effects and the ICC", a: "A fixed effect is a coefficient you want to estimate and report (the treatment effect, the slope of time). A random effect describes how clusters (students, classes, subjects) vary around the overall line: a random intercept lets each cluster start higher or lower; a random slope lets each have its own trend. The ICC is the share of the total variance that lies between clusters: 0.20 means 20% of the variation is cluster-to-cluster, and observations in the same cluster are that correlated. Cluster effects (BLUPs) are the shrunken estimates of each cluster's own deviation.", go: [["Advanced", "Mixed-Effects Model (nested or repeated data)"]], m: "mixed" },
    { k: ["satterthwaite", "kenward", "df in a mixed", "decimal df", "fractional df", "df 22.8", "non-integer df", "why is df not a whole"], t: "Fractional degrees of freedom (Satterthwaite)", a: "In a mixed model, and in Welch's t test, there is no single correct df because the variance of an estimate mixes several sources. The Satterthwaite approximation chooses the df that matches that mixed variance, so df come out as decimals (22.8, 161.0) and are different for each coefficient. lmerTest does the same in R. The alternative Kenward-Roger method also adjusts the SEs; the two agree closely except in very small samples.", go: [["Advanced", "Mixed-Effects Model (nested or repeated data)"]], m: "mixed" },
    { k: ["f statistic", "f-statistic", "f ratio", "f value", "what does f mean", "post hoc", "post-hoc", "tukey", "which groups differ", "pairwise comparisons", "bonferroni", "holm", "multiple comparisons", "family-wise", "familywise", "games-howell"], t: "The F ratio, and finding which groups differ", a: "ANOVA's F is the variance between group means divided by the variance within groups: near 1 when the groups are alike, large when they differ more than chance allows. A significant F says at least one mean differs, not which. Post hoc tests compare every pair while keeping the overall false-alarm rate at α: Tukey's HSD is standard with equal spreads, Games-Howell when they differ, and Bonferroni or Holm adjust ordinary p-values (Holm is the less wasteful of the two). The one-way ANOVA card runs them for you.", go: [["ANOVA", "One-Way ANOVA"]], m: "three" },
    { k: ["homogeneity of variance", "equal variances", "equal variance", "levene mean", "what is levene", "levene's test", "what is welch", "welch mean", "welch's t", "unequal variances", "pooled or welch", "pooled variance", "student's t or welch"], t: "Equal variances, Levene's test and Welch", a: "The classical t test and ANOVA pool the spreads of the groups, so they assume the groups have equal variances. Levene's test checks that (a small p says the spreads differ). Welch's t and the Welch ANOVA do not assume equal spreads and lose almost nothing when they are equal, so this app uses Welch by default and prints Student's pooled version alongside for the course. A rule of thumb: pooling is risky when the larger SD is more than twice the smaller and the group sizes differ.", go: [["T-Tests", "Independent Samples T-Test"]], m: "two" },
    { k: ["shapiro", "normality test", "test for normality", "test normality", "is my data normal", "check normality", "check for normality", "qq plot mean", "q-q plot mean", "read a qq", "what is a qq", "how normal"], t: "Checking normality", a: "Look first: a histogram for shape and a QQ plot, where points near the straight line mean near normal and curved ends mean skew or heavy tails. The Shapiro-Wilk test gives a p-value, but with large n it rejects for harmless departures and with small n it misses real ones, so treat it as a hint. For means the Central Limit Theorem covers you at n around 30 or more; for small skewed samples use a rank-based test or a bootstrap interval.", go: [["Graph", "QQ Plot"], ["Graph", "Histogram"]], m: "describe" },
    { k: ["what does nonparametric mean", "nonparametric mean", "non-parametric mean", "what is nonparametric", "rank based", "rank-based", "based on ranks", "distribution free", "distribution-free", "mann-whitney mean", "wilcoxon mean", "kruskal mean"], t: "Nonparametric (rank-based) tests", a: "They replace the values by their ranks (1st, 2nd, ...) and so make no assumption about the shape of the distribution, and outliers cannot dominate. Mann-Whitney U stands in for the independent t, Wilcoxon signed-rank for the paired t, Kruskal-Wallis for one-way ANOVA, Friedman for repeated measures, Spearman for Pearson's r. They test medians or distributions rather than means, lose a little power when the data really are normal, and are the safe choice for small skewed samples and for ratings.", go: [["Nonparametric", "Mann-Whitney U (two groups)"]], m: "glossary" },
    { k: ["paired vs independent", "independent vs paired", "paired or independent", "independent or paired", "dependent samples", "what does paired mean", "paired mean", "what is paired", "matched pairs mean", "related samples"], t: "Paired or independent", a: "Paired: the two measurements belong together, the same person before and after, or matched twins, so the analysis works on the differences and removes person-to-person variation. Independent: two separate groups of different people, so the two means are compared directly. Mixing them up is the commonest error on a t test; the Which-test wizard asks exactly this question.", go: [["T-Tests", "Which test?"]], m: "paired" },
    { k: ["expected count mean", "what is expected count", "what are expected counts", "expected counts mean", "observed vs expected", "observed and expected", "what is chi-square", "chi-square mean", "chi square mean", "what does chi-square", "chi-squared mean", "why at least 5", "expected at least 5"], t: "Chi-square: observed against expected", a: "The expected count in a cell is what H₀ predicts: for a two-way table, row total × column total / N (what independence would give); for goodness of fit, n × the claimed proportion. χ² adds (O − E)²/E over the cells, so it grows as the observed counts drift from the expected. The approximation needs every expected count at least 5 (observed counts may be small); when it fails, use Fisher's exact test for a 2 by 2 table or combine categories.", go: [["Frequencies", "Contingency Tables: Independent Samples"], ["Frequencies", "N Outcomes: chi-square Goodness of fit"]], m: "relate" },
    { k: ["what is bootstrap", "what is the bootstrap", "bootstrap mean", "bootstrapping mean", "how does bootstrap", "what is a permutation test", "permutation test mean", "what is bayesian", "bayesian mean", "what is a prior", "prior mean", "posterior mean", "what is the posterior", "credible interval", "bayes factor"], t: "Bootstrap, permutation and Bayesian: the three other ways", a: "Bootstrap: resample your own data with replacement thousands of times and recompute the statistic; the spread of those results is a confidence interval with no formula and no normality assumption. Permutation: shuffle the group labels thousands of times to build the null distribution yourself; the p-value is how often the shuffled difference beats the real one. Bayesian: start from a prior belief about the parameter, update it with the data, and read the posterior; a 95% credible interval does mean a 95% probability that the parameter is inside. All three have a Learn demo.", go: [["Learn", "Bootstrap: an interval with no formula"], ["Learn", "Permutation: a p-value by reshuffling"], ["Learn", "Bayesian: prior, data, posterior"]], m: "glossary" },
    { k: ["what is probability", "probability mean", "independent events", "mutually exclusive", "disjoint", "conditional probability", "given that", "complement rule", "addition rule", "multiplication rule", "law of large numbers", "expected value mean", "what is expected value"], t: "Probability basics", a: "Probability is the long-run share of times an event happens; the law of large numbers says the observed share settles toward it as trials pile up (flip coins in the Learn demo). Mutually exclusive (disjoint) events cannot both happen, so P(A or B) = P(A) + P(B). Independent events do not affect each other, so P(A and B) = P(A) × P(B). A conditional probability P(A | B) is the chance of A among the cases where B happened; in a two-way table it is a row or column percentage. The expected value is the long-run average, Σ x · P(x).", go: [["Learn", "Coin flips and the law of large numbers"], ["distrACTION", "Custom (discrete x and P(x))"]], m: null },
    { k: ["binomial conditions", "is it binomial", "binomial setting", "fixed number of trials", "bernoulli", "binomial mean", "what is binomial", "when is it binomial", "binomial or not"], t: "When a count is binomial", a: "Four conditions: a fixed number of trials n, each trial a success or failure, the same probability p on every trial, and independent trials. Then the number of successes is binomial with mean np and SD √(np(1 − p)). Sampling without replacement from a small population breaks independence (use the hypergeometric); counting events over time with no fixed n is Poisson; waiting for the first success is geometric. distrACTION draws every one of them.", go: [["distrACTION", "Binomial Distribution"]], m: null },
    { k: ["empirical rule", "68 95 99", "68-95-99", "68%", "bell curve", "what is the normal distribution", "normal distribution mean", "normal curve", "standard normal", "area under the curve", "why is it normal"], t: "The normal curve and the 68-95-99.7 rule", a: "The normal distribution is the symmetric bell curve described by its mean μ and SD σ. About 68% of values lie within 1 SD of the mean, 95% within 2, and 99.7% within 3 (the empirical rule). The standard normal has μ = 0 and σ = 1, and z-scores convert any normal to it, so one table (or distrACTION's Normal calculator) serves every normal. Many real variables are roughly normal, and sample means are nearly normal by the Central Limit Theorem, which is why it appears everywhere.", go: [["distrACTION", "Normal Distribution"]], m: null },
    { k: ["what is a percentile", "percentile mean", "percentile rank", "what percentile", "90th percentile", "what is a quantile", "quantile mean", "inverse normal", "find the value for"], t: "Percentiles and quantiles", a: "The 90th percentile is the value below which 90% of the data (or of the distribution) fall; the median is the 50th and the quartiles the 25th and 75th. Going from a value to its percentile is a cumulative probability; going from a percentile to the value is a quantile (the 'inverse' or 'backward' problem). Descriptives gives the percentiles of a column; distrACTION's calculators do both directions for any distribution.", go: [["distrACTION", "Normal Distribution"], ["Exploration", "Descriptives"]], m: null },
    { k: ["margin of error mean", "what is margin of error", "what is the margin of error", "plus or minus mean", "sampling error", "what is sampling error", "why does the margin"], t: "Margin of error", a: "The margin of error is the half-width of a confidence interval: critical value × SE, the '± 3 points' in a poll. It covers sampling error only, the wobble from measuring a sample instead of everyone; it says nothing about bias from a poor sample or badly worded questions. Halving it needs four times the sample, since SE shrinks with √n. The calculator finds the n for a target margin.", go: [["distrACTION", "Sample size for a margin of error"]], m: "plan" },
    { k: ["random sample", "simple random sample", "stratified", "cluster sample", "cluster sampling", "systematic sample", "convenience sample", "sampling bias", "selection bias", "voluntary response", "what is bias", "biased sample", "representative sample", "nonresponse", "non-response", "undercoverage"], t: "Sampling methods and bias", a: "A simple random sample gives every member of the population the same chance, and every statistical formula here assumes something like it. Stratified sampling draws a random sample within each group (to guarantee each is represented); cluster sampling picks whole groups at random; systematic takes every kth name. A convenience sample (whoever is handy) and voluntary response (whoever bothers) are biased in ways no sample size fixes, and undercoverage and nonresponse bias even a random design. Bias is a systematic miss; sampling error is random wobble.", m: "designs" },
    { k: ["observational study", "observational vs experiment", "experiment vs observational", "randomized experiment", "randomised", "control group", "placebo", "double blind", "double-blind", "blinding", "random assignment", "can i say cause", "causal claim", "confounding variable mean", "what is a confounder", "what is a confounding"], t: "Experiments, observational studies and confounding", a: "In an experiment the researcher assigns the treatment, ideally at random, so the groups differ only by chance and the treatment; that is what licenses a causal claim. A control group (and a placebo, and blinding) rule out the effects of expectation and attention. In an observational study people choose or arrive with their treatment, so a confounder (a lurking variable linked to both the treatment and the outcome) can create or hide an effect; adjust for the confounders you measured and run the sensitivity analysis for the ones you did not.", go: [["Regression", "Sensitivity to a lurking variable"]], m: "causal" },
    { k: ["nominal", "ordinal vs", "ordinal mean", "interval ratio", "interval vs ratio", "levels of measurement", "level of measurement", "qualitative quantitative", "qualitative vs quantitative", "categorical vs numeric", "categorical or numeric", "discrete vs continuous", "discrete or continuous", "types of variables", "type of variable", "what type of variable", "what kind of variable"], t: "Types of variables", a: "Categorical (qualitative) variables put cases in groups: nominal when the groups have no order (major, color), ordinal when they do (freshman to senior, a 1 to 5 rating). Numeric (quantitative) variables are measurements: discrete when they count (children, visits) and continuous when they measure (height, time); interval scales have equal steps but no true zero (°F), ratio scales have both (kg, dollars). The type decides the graph and the test: bar charts and chi-square for categories, histograms and t tests for numbers. Data, Set variable type fixes a column the app guessed wrong.", go: [["Data", "Set variable type"]], m: "first" },
    { k: ["what is long format", "what is wide format", "long vs wide", "wide vs long", "long or wide", "tidy data mean", "what is tidy data", "what does long format", "what does wide format"], t: "Long and wide layouts", a: "Wide: one row per case and one column per measurement (week1, week4, week8), which paired tests, repeated-measures ANOVA and reliability want. Long (tidy): one row per measurement with a column naming it (student, week, score), which grouped graphs, one-way comparisons by group and mixed models want. The same data can be written either way; Data, Reshape converts between them and shows the tidyr line.", go: [["Data", "Reshape: wide to long"], ["Data", "Reshape: long to wide"]], m: "first" },
    { k: ["hazard ratio", "what is a hazard", "hazard mean", "what is censoring", "censored mean", "censoring mean", "median survival", "survival curve mean", "kaplan-meier mean", "log-rank mean", "proportional hazards mean"], t: "Survival terms: censoring, hazard ratios, median survival", a: "A subject is censored when the study ends (or they leave) before the event: we know they lasted at least that long, and Kaplan-Meier uses that partial information instead of dropping them. Median survival is the time by which half have had the event. The hazard is the instantaneous event rate among those still at risk; a Cox hazard ratio of 1.5 means a 50% higher rate at every moment, which assumes the ratio stays constant over time (proportional hazards, which the card checks). The log-rank test compares whole curves.", go: [["Advanced", "Survival Analysis: Kaplan-Meier, log-rank, Cox"]], m: "survival" },
    { k: ["alpha of 0.7", "alpha of .7", "cronbach mean", "cronbach's alpha mean", "interpret alpha", "interpret cronbach", "reliability mean", "what is reliability", "internal consistency mean", "item-rest", "item-total"], t: "Reading Cronbach's alpha", a: "Alpha estimates how consistently the items of one scale measure the same thing, from 0 to 1. About 0.70 is acceptable for research, 0.80 good, 0.90 or more excellent (or so similar that items are redundant). It rises with more items, so compare scales of similar length. An item with a low or negative item-rest correlation does not belong or is reverse-keyed; 'alpha if item dropped' shows what removing it would do. Alpha is about consistency, not about whether the scale measures the right thing (validity).", go: [["Advanced", "Reliability (Cronbach's alpha)"]], m: "scales" },
    { k: ["pca vs efa", "pca or efa", "pca or factor", "factor analysis vs pca", "what is an eigenvalue", "eigenvalue mean", "eigenvalues", "what is a loading", "loadings mean", "factor loading", "how many factors", "how many components", "scree plot", "kaiser", "varimax", "rotation mean"], t: "Factors, components, loadings and how many to keep", a: "PCA makes new variables (components) that summarize as much variance as possible; EFA looks for latent traits that explain why items correlate. Each has an eigenvalue, the variance it captures; a loading is the correlation between an item and a factor (above about 0.40 is meaningful). Keep factors with eigenvalues above 1 (Kaiser) or at the elbow of the scree plot, or better, as many as parallel analysis supports. Rotation (varimax, oblimin) makes loadings easier to read without changing the fit.", go: [["Advanced", "Exploratory Factor Analysis"], ["Advanced", "Principal Component Analysis"]], m: "structure" },
    { k: ["how many clusters", "elbow method", "elbow plot", "what is k in k-means", "choose k", "k-means mean", "k means mean", "silhouette", "cluster mean"], t: "Choosing the number of clusters", a: "k-means needs you to pick k. Run it for k = 2, 3, 4, ... and plot the total within-cluster distance: it always falls as k grows, and the elbow, where it stops falling fast, is the usual choice; a silhouette score near 1 says cases sit well inside their clusters. Standardize the variables first, or the one with the biggest numbers decides everything. Clusters are a description of this sample, not a discovery of true groups, and a different seed can give a different split; the card lets you set it.", go: [["Advanced", "k-means Clustering"]], m: "structure" },
    { k: ["robustness value", "what is rv", "rv mean", "partial r2 of the treatment", "benchmark covariate", "sensitivity analysis mean", "what is sensitivity analysis"], t: "The robustness value", a: "After a regression, the robustness value is the share of the leftover variation (of both the treatment and the outcome) that an unmeasured confounder would have to explain to bring the estimate to zero; a second, smaller RV is what would make it non-significant. RV of 0.20 means a confounder explaining 20% of both, which is strong. Benchmarking against a covariate you did measure (a confounder 1, 2 or 3 times as strong as, say, gender) makes the number concrete. Cinelli and Hazlett (2020).", go: [["Regression", "Sensitivity to a lurking variable"]], m: "causal" },
    { k: ["what is this app", "what is stats without walls", "stats without walls", "who made", "who built", "who wrote", "is it free", "is this free", "is my data safe", "privacy", "data private", "leave the browser", "leave my computer", "does it work offline", "work offline", "offline", "like r", "instead of r", "same as r", "compared to r", "compared to spss", "vs spss", "jamovi", "jasp", "vs excel", "excel vs", "is it accurate", "how accurate", "checked against r", "verified against"], t: "About Stats Without Walls", a: "A free statistics app that runs entirely in your browser: nothing you type or load is sent anywhere, and after the first visit it works offline. It covers the introductory course (descriptives, graphs, t tests, ANOVA, chi-square, regression, probability calculators) and the methods researchers reach for in R (mixed-effects, logistic and count models, survival, factor analysis, bootstrap, Bayesian). Every result is checked against R's output (and scipy's) on the same data; the guide lists which functions. Every card shows the formula, the worked numbers, an APA line and a plain-words conclusion. Built by Safaa Dabagh for her statistics students at Santa Monica College, West Los Angeles College and Loyola Marymount University.", m: "use" },
    { k: ["what does this mean", "what does that mean", "what does this result", "what does my result", "explain my result", "explain this result", "explain the result", "explain my card", "explain the card", "interpret my result", "interpret this result", "interpret my", "interpret this", "my result", "my results", "what did i get", "what did i find", "is my result significant", "is it significant", "was it significant", "read my card", "summarize my result", "what does my p", "plain words", "in plain english", "in plain words", "what do my numbers", "what does the card say"], t: "Your last result, in plain words", a: null, special: "explain" },
    { k: ["how do i read a card", "how do i read the card", "read a card", "read the card", "what is the apa line", "apa line mean", "worked numbers", "show the numbers", "formula box", "what is on the card", "what is on a card", "parts of the card", "card layout", "what is the meta"], t: "How to read a result card", a: "Top to bottom: the tables (statistic, df, p, effect size, interval), the formula in symbols, 'Show the numbers in the formula' (your data in that formula, step by step), the APA line to paste into a paper, the condition checks (green passed, orange a warning), the conclusion in words, and the graph. 'copy text' copies the card; the buttons under a table copy it as CSV or Markdown; 'edit' reopens the dialog with your choices. Researcher mode puts the tables and APA line first and folds the formula away.", m: "report" },
    { k: ["dark mode", "font size", "bigger text", "larger text", "dyslexia", "read aloud", "screen reader", "accessibility", "keyboard shortcuts", "keyboard only", "zoom in", "too small", "hard to read"], t: "Making the app easier to read", a: "Zoom the browser (Ctrl and +, or Cmd and + on a Mac): the layout reflows and nothing is cut off. Results, Notation switches formulas and hypotheses from symbols to words, which screen readers and read-aloud tools pronounce properly. Every control has a keyboard path (Tab, Enter, Escape closes a dialog or this panel), every table has a caption, and every button names its card for a screen reader. The course pages of this site carry the accessibility toolbar (dark mode, Lexend font, reading ruler, read aloud).", m: null },
  ];
  const botTok = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9%₀-₉²\s'-]/g, " ");
  const BOT_STOP = new Set(["what", "whats", "what's", "the", "this", "that", "does", "mean", "means", "meaning", "how", "why", "when", "with", "from", "for", "and", "you", "your", "can", "should", "about", "which", "where", "there", "are", "was", "were", "have", "has", "not", "tell", "explain", "define", "use", "used", "using", "between", "difference", "test", "tests", "data", "value", "values", "result", "results"]);
  function botScore(list, q, titleWords = true) {
    const t = " " + botTok(q).replace(/\s+/g, " ") + " ", words = t.trim().split(" ").filter((w) => w.length > 2 && !BOT_STOP.has(w));
    return list.map((e) => { let s = 0; e.k.forEach((k) => { const kk = botTok(k).replace(/\s+/g, " ").trim(); if (!kk) return; if (t.includes(" " + kk + " ") || t.includes(kk)) s += kk.includes(" ") ? 3 + kk.split(" ").length : 2; }); if (!s && titleWords) words.forEach((w) => { if (e.t.toLowerCase().includes(w)) s += 0.5; }); return [s, e]; }).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]);
  }
  function botMatch(q) { return botScore(ASKKB, q).slice(0, 3).map((x) => x[1]); }
  // a question: a question word, a question mark, or "... mean"
  const botIsQuestion = (q) => /\?\s*$/.test(q) || /^(what|what's|whats|why|when|how|define|explain|meaning|difference|should i|do i|can i|is it|is a|is the|does|which is|interpret|tell me|help me understand|i don't understand|i dont understand)\b/i.test(q.trim()) || /\bmeans?\s*\??\s*$/i.test(q.trim());
  // the newest card, read back in plain words: title, APA line, conclusion, warnings
  function botExplain() {
    const cards = Array.from(document.querySelectorAll("#out .card, #outG .card")); const c = LASTCARD && document.body.contains(LASTCARD) ? LASTCARD : cards[cards.length - 1];
    if (!c) return `<p>No result yet. Run an analysis (or ask me which one), then ask again and I will read the card back in plain words.</p>`;
    const tx = (sel) => Array.from(c.querySelectorAll(sel)).map((x) => x.textContent.trim()).filter(Boolean);
    const title = (c.querySelector("h2") || {}).textContent || "the last result", apa = tx(".apa code")[0], says = tx(".say"), warns = tx(".warn"), oks = tx(".ok");
    const clip = (arr, n) => { const s = arr.join(" "); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + " ..." : s; };
    let h = `<b>${esc(title)}, in plain words</b>`;
    if (apa) h += `<p>In one line: <code>${esc(apa)}</code></p>`;
    if (says.length) h += `<p>${esc(clip(says, 700))}</p>`;
    if (warns.length) h += `<p><b>Watch out:</b> ${esc(clip(warns, 500))}</p>`; else if (oks.length) h += `<p class="bmuted">Checks passed: ${esc(clip(oks, 300))}</p>`;
    if (!apa && !says.length && !warns.length) h += `<p>This card is a table or a graph without a test, so there is no conclusion to read back. Ask me about any number on it, for example "what is the IQR" or "what does the slope mean".</p>`;
    const pm = (apa || says.join(" ")).match(/\bp\s*([<=>]+)\s*(\.\d+|\d\.\d+|\d)(?!\d*\s*[.:]?\s*(?:reject|fail))/) || (says.join(" ").match(/\bp = (0?\.\d+)/) ? ["", "=", says.join(" ").match(/\bp = (0?\.\d+)/)[1]] : null);
    if (pm) { const pv = Number(pm[2]), small = pm[1].includes("<") || pv <= 0.05; h += `<p class="bmuted">${small ? "A p-value this small means a result like yours would be rare if H₀ were true, so the data count as evidence against H₀." : "A p-value this large means a result like yours would not be unusual if H₀ were true, so the data are not strong enough to reject H₀; that is not proof that H₀ is true."} The p-value does not say how big the effect is: read the effect size and the interval on the card for that.</p>`; }
    return h;
  }
  function botQA(e) {
    let h = `<b>${esc(e.t)}</b>`;
    if (e.special === "explain") return botExplain();
    h += `<p>${esc(e.a)}</p>`;
    if (e.go && e.go.length) h += `<div class="bgo">${e.go.filter(([m, l]) => findItem(m, l)).map(([m, l]) => botBtn(m, l, (m === "Learn" ? "See it: " : "Open ") + l)).join("")}</div>`;
    if (e.m) h += `<p class="bmuted"><a href="methods.html#${e.m}" target="_blank" rel="noopener">${e.m === "glossary" ? "Glossary in the Methods Guide" : "More in the Methods Guide"}</a></p>`;
    return h;
  }
  function botColumns() {
    if (!D.rows.length) return "No data is loaded yet. Open a sample dataset from Data, Sample datasets, or your own CSV.";
    const n = numCols(), c = catCols(); return `${D.rows.length} rows. Numeric: ${n.length ? n.join(", ") : "none"}. Categorical: ${c.length ? c.join(", ") : "none"}. A test needs a numeric outcome and, for groups, a categorical column.`;
  }
  const BOT = { open: false, tips: 0 };
  function botSay(html, cls) { const log = $("#botLog"); if (!log) return; const d = document.createElement("div"); d.className = "bmsg " + (cls || "bot"); d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; wireBot(d); return d; }
  function wireBot(root) {
    root.querySelectorAll("[data-brun]").forEach((b) => (b.onclick = () => { const [m, l] = b.dataset.brun.split("|"); const it = findItem(m, l); if (it) { botToggle(false); runItem(m, it); } }));
    root.querySelectorAll("[data-bask]").forEach((b) => (b.onclick = () => botAsk(b.dataset.bask)));
  }
  const botBtn = (m, l, label) => `<button type="button" class="brun" data-brun="${escA(m)}|${escA(l)}">${esc(label || l)}</button>`;
  function botAnswer(e) {
    let h = `<b>${esc(e.t)}</b>`;
    if (e.special === "columns") h += `<p>${esc(botColumns())}</p>`; else if (e.a) h += `<p>${esc(e.a)}</p>`;
    if (e.go && e.go.length) h += `<div class="bgo">${e.go.filter(([m, l]) => findItem(m, l)).map(([m, l]) => botBtn(m, l, "Open " + l)).join("")}</div>`;
    if (e.alt && e.alt.length) h += `<p class="bmuted">If the data are skewed or small: ${e.alt.filter(([m, l]) => findItem(m, l)).map(([m, l]) => botBtn(m, l)).join("")}</p>`;
    if (e.m) h += `<p class="bmuted"><a href="methods.html#${e.m}${MODE.who === "researcher" ? "" : ""}" target="_blank" rel="noopener">Read the steps in the Methods Guide</a></p>`;
    return h;
  }
  function botAsk(q) {
    q = String(q || "").trim(); if (!q) return; botSay(esc(q), "me");
    const scored = botScore(ASKKB, q), hits = scored.slice(0, 3).map((x) => x[1]), qa = botScore(ASKQA, q, false), isQ = botIsQuestion(q);
    // a question with a plain-words answer: the answer first, then (at most) one way to run it in the app
    if (qa.length && (isQ || !hits.length || qa[0][0] >= 5 || qa[0][0] > scored[0][0])) {
      const top = qa[0][0]; const show = qa.filter((x) => x[0] >= top - 1).slice(0, 2).map((x) => x[1]);
      show.forEach((e, i) => botSay((i ? `<span class="balso">Also</span>` : "") + botQA(e)));
      const run = hits.find((e) => e.go && e.go.length && !show.some((s) => s.go && s.go.some(([m, l]) => e.go.some(([m2, l2]) => m === m2 && l === l2))));
      if (run && scored[0][0] >= 3) botSay(`<span class="balso">To run it</span>` + botAnswer(run));
      const inp0 = $("#botIn"); if (inp0) { inp0.value = ""; inp0.focus(); } return;
    }
    if (!hits.length) { botSay(`<p>I did not catch that. Say what you measured and what you want to know, or ask what a term means, for example:</p><div class="bchips">${["compare two groups", "before and after", "is there a relationship", "predict a yes or no", "how many people do I need", "what columns do I have", "what is a p-value", "explain my result"].map((s) => `<button type="button" data-bask="${escA(s)}">${esc(s)}</button>`).join("")}</div><p class="bmuted">Or open ${botBtn("T-Tests", "Which test?", "Which test?")} or the <a href="methods.html" target="_blank" rel="noopener">Methods Guide</a> (its glossary is at the end).</p>`); return; }
    hits.forEach((e, i) => botSay((i ? `<span class="balso">Also possible</span>` : "") + botAnswer(e)));
    if (qa.length && qa[0][0] >= 3) botSay(`<span class="balso">In plain words</span>` + botQA(qa[0][1]));
    if (!D.rows.length && hits.some((e) => e.go && e.go.some(([m]) => m !== "Data" && m !== "distrACTION" && m !== "Learn" && m !== "Results"))) botSay(`<p class="bmuted">These need data on the table first: ${botBtn("Data", "Sample datasets", "Sample datasets")} ${botBtn("Data", "Open CSV file", "Open CSV file")}</p>`);
    const inp = $("#botIn"); if (inp) { inp.value = ""; inp.focus(); }
  }
  // tips from a card's own warnings: the next step, offered once per card
  const ASKTIPS = [
    [/below 5|expected count is .* under 5|not trustworthy\. Combine/i, (c) => /2 by 2|Fisher/.test(c.textContent) ? null : "An expected count is under 5. For a 2 by 2 table rerun with Fisher's exact test ticked; for a larger table combine small categories.", ["Frequencies", "Contingency Tables: Independent Samples"]],
    [/fewer than 30|small sample|n is under 30|skew/i, () => "A small or skewed sample: the rank-based test is the safe companion to this result.", ["Nonparametric", "Mann-Whitney U (two groups)"]],
    [/under 10, so the normal/i, () => "A count under 10: the normal approximation is shaky. The binomial test on the same dialog is exact.", ["Frequencies", "2 Outcomes: Binomial test"]],
    [/outside the data range|extrapolat/i, () => "A prediction outside the observed range of x is extrapolation; report it with that caveat or not at all.", null],
    [/reverse-keyed/i, () => "Items with a negative item-rest correlation are probably reverse-keyed: list them in the dialog and rerun.", ["Advanced", "Reliability (Cronbach's alpha)"]],
    [/overdispers|variance is (well )?above the mean/i, () => "Overdispersion: switch the model to negative binomial and compare.", ["Advanced", "Count Regression: Poisson and Negative Binomial"]],
  ];
  function botTip(div) {
    const w = Array.from(div.querySelectorAll(".warn")).map((x) => x.textContent).join(" "); if (!w) return;
    for (const [re, fn, go] of ASKTIPS) { if (re.test(w)) { const txt = fn(div); if (!txt) continue; const title = (div.querySelector("h2") || {}).textContent || "the last result";
      const d = botSay(`<span class="balso">Tip on ${esc(title)}</span><p>${esc(txt)}</p>${go && findItem(go[0], go[1]) ? `<div class="bgo">${botBtn(go[0], go[1], "Open " + go[1])}</div>` : ""}`, "bot tip");
      if (!BOT.open && d) { BOT.tips++; const b = $("#askBtn"); if (b) b.textContent = `Ask · ${BOT.tips} tip${BOT.tips > 1 ? "s" : ""}`; } return; } }
  }
  function botToggle(on) {
    const p = $("#bot"); if (!p) return; BOT.open = on == null ? !BOT.open : !!on; p.classList.toggle("open", BOT.open); p.setAttribute("aria-hidden", String(!BOT.open));
    const b = $("#askBtn"); if (b) { b.setAttribute("aria-expanded", String(BOT.open)); if (BOT.open) { BOT.tips = 0; b.textContent = "Ask"; } }
    if (BOT.open) { const log = $("#botLog"); if (log && !log.children.length) botSay(`<p>Ask in plain words: what you measured and what you want to know, and I name the method and open the dialog. Or ask what something means ("what is a p-value", "SE or SD", "what does this result mean").</p><div class="bchips">${["compare two groups", "before and after", "is there a relationship", "what is a p-value", "explain my result", "what columns do I have"].map((s) => `<button type="button" data-bask="${escA(s)}">${esc(s)}</button>`).join("")}</div>`); const inp = $("#botIn"); if (inp) inp.focus(); }
    else if (b) b.focus();
  }
  if ($("#askBtn")) { $("#askBtn").onclick = () => botToggle(); $("#botClose").onclick = () => botToggle(false); $("#botForm").onsubmit = (e) => { e.preventDefault(); botAsk($("#botIn").value); }; document.addEventListener("keydown", (e) => { if (e.key === "Escape" && BOT.open && !$("#dlg").open) botToggle(false); }); }
  if ($("#modeBtn")) $("#modeBtn").onclick = modeUI;
  applyMode(MODE.who, MODE.field, false);

  // ================= pages =================
  // Data page: the table and its results. distrACTION page (#distraction): inputs card and live results, no table.
  // Learn page (#learn): the demonstrations that need no data. The data stay loaded while another page is open.
  const PAGES = { distraction: "#outD", learn: "#outL" };
  const LEARN_PAGE = new Set([llnUI, cltUI, ciDemoUI, pvalDemoUI, meanMedianApplet, influenceApplet, guessRApplet, samplingSim, bayesUI]); // everything under Learn that runs with no data (bootstrap and permutation need a data file and stay with the table)
  const DIST_ITEMS = MENU.find((m) => m[0] === "distrACTION")[1].filter(Boolean), LEARN_ITEMS = MENU.find((m) => m[0] === "Learn")[1].filter((it) => it && LEARN_PAGE.has(it[1]));
  const PLAN_ITEMS = new Set([sampleSizeCalc, powerUI]); // on the distrACTION page, but not probability calculators
  function baseTarget() { return PAGES[VIEW] || "#out"; }
  function pageFor(menuName, fn) { if (menuName === "distrACTION") return "distraction"; if (menuName === "Learn") return LEARN_PAGE.has(fn) ? "learn" : "data"; if (menuName === "Results") return null; return "data"; }
  function setView(name, how) { // how: "push" adds a browser history step, "replace" rewrites it, undefined leaves the address alone
    if (name !== "data" && !Object.prototype.hasOwnProperty.call(PAGES, name)) name = "data"; // any other #hash (even a built-in property name) is the data page
    if (name !== VIEW) dropUndo();
    VIEW = name; TARGET = baseTarget();
    ["data", "distraction", "learn"].forEach((k) => document.body.classList.toggle("view-" + k, k === name));
    const df = $("#distForm"), open = df.children.length > 0;
    if (name === "learn") $("#toolTitle").textContent = "Learn";
    else if (name === "distraction") $("#toolTitle").textContent = open && df._title ? df._title : "distrACTION";
    $("#toolNote").textContent = name === "learn" ? "Classroom demonstrations. No data needed." : open && PLAN_ITEMS.has(df._fn) ? "Sample size and power. No data needed." : "Probability calculators. No data needed.";
    nav.querySelectorAll(".dd").forEach((d) => d.classList.toggle("here", (name === "distraction" && d.dataset.name === "distrACTION") || (name === "learn" && d.dataset.name === "Learn")));
    const want = name === "data" ? location.pathname + location.search : "#" + name;
    if (how && (location.hash || "") !== (name === "data" ? "" : "#" + name)) history[how === "push" ? "pushState" : "replaceState"](null, "", want);
    counts();
    setTimeout(() => { document.querySelectorAll(name === "data" ? "#out .plot, #outG .plot" : PAGES[name] + " .plot").forEach((p) => { try { Plotly.Plots.resize(p); } catch (e) { } }); retick(); }, 0);
  }
  const pageFromHash = () => location.hash.replace(/^#/, "");
  // browser or Android Back: an open dialog or menu closes with the page it belonged to
  const onNav = () => {
    const was = VIEW; dlgBack = null; if (DLG.open) closeDlg(); else DLG.classList.remove("open"); closeMenus(); setView(pageFromHash());
    const a = document.activeElement; if (VIEW !== was && (!a || a === document.body || !a.getClientRects().length)) focusTo(pageHeading(), true); // the link or button that was focused is on the page just left
  };
  window.addEventListener("popstate", onNav);
  window.addEventListener("hashchange", onNav);
  // after a resize: whole-number axes get the tick spacing that fits, and a cut-off event choice gets its full label
  function retick() {
    document.querySelectorAll(".plot").forEach((p) => {
      if (p._tt) fitTitle(p);
      if (!p._whole || !p.clientWidth) return; const st = wholeStep(p._whole, p); if (st === p._step) return; p._step = st;
      try { Plotly.relayout(p, st ? { "xaxis.dtick": st, "xaxis.tick0": 0 } : { "xaxis.dtick": null, "xaxis.tick0": null }); } catch (e) { }
    });
  }
  let rtT = null; window.addEventListener("resize", () => { clearTimeout(rtT); rtT = setTimeout(() => { retick(); const df = $("#distForm"); if (df.children.length) fitSelects(df); }, 200); });
  // opts.keep: leave focus where it is (the Change distribution and Choose another demonstration lists)
  function runItem(menuName, it, opts = {}) {
    const from = document.activeElement, dd = from && from.closest ? from.closest("nav.menu .dd") : null, kb = !!(from && from !== document.body && from.matches(":focus-visible"));
    OPENER = from; closeMenus();
    const pg = pageFor(menuName, it[1]), moved = !!pg && pg !== VIEW; if (moved) setView(pg, "push");
    CUR_FN = it[1]; PREFILL = null; REPLACE = null; TARGET = baseTarget(); INLINE = pg === "distraction";
    const before = LASTCARD;
    try { it[1](); } catch (err) { alert(err.message || err); } finally { INLINE = false; }
    OPENER = null;
    // focus follows the student to what just opened, never left behind on a hidden menu item or page
    if (DLG.open || opts.keep) return; // a dialog puts focus in itself
    if (pg === "distraction" && $("#distForm").children.length) {
      const first = [...$("#distForm").querySelectorAll("input, select, textarea")].find((el) => el.getClientRects().length);
      if (kb && first && !coarse()) first.focus(); else focusTo($("#toolTitle"), moved); // by keyboard: straight to the first box
      return;
    }
    if (LASTCARD && LASTCARD !== before && LASTCARD.isConnected) { focusTo(LASTCARD.querySelector("h2")); return; }
    const a = document.activeElement;
    if (moved) focusTo(pageHeading(), true);
    else if ((!a || a === document.body || !a.getClientRects().length) && dd) dd.querySelector(".top").focus({ preventScroll: true });
  }
  const findItem = (menuName, label) => { const m = MENU.find((x) => x[0] === menuName); return m && m[1].find((it) => it && it[0] === label); };
  // first screen of the data page when nothing is loaded
  function emptyState() {
    const F = FIELDS[MODE.field], typical = F.analyses.filter(([m, l]) => findItem(m, l));
    return `<div class="empty"><h2>No data yet</h2><p>Type or paste your data, or open a sample dataset from Data, Sample datasets.</p>
      <div class="who"><span>Set up for</span><button type="button" data-who="student" class="${MODE.who === "student" ? "on" : ""}" aria-pressed="${MODE.who === "student"}">Student</button><button type="button" data-who="researcher" class="${MODE.who === "researcher" ? "on" : ""}" aria-pressed="${MODE.who === "researcher"}">Researcher</button><span>in</span><button type="button" data-field="1" title="Choose your field: it puts that field's sample datasets first and lists its usual analyses below">Field: ${esc(F.label)} &#9662;</button></div>
      <div class="emptybtns"><button type="button" class="go" data-go="Sample datasets">Sample datasets</button><button type="button" data-go="Open CSV file">Open CSV file</button><button type="button" data-go="Paste data">Paste data</button><button type="button" data-go="New data table">New data table</button></div>
      <p class="muted">${MODE.field === "general" ? "Analyses most people start with" : "Analyses " + esc(F.label).toLowerCase() + " reaches for first"} (each asks for data first):</p>
      <div class="emptybtns typical">${typical.map(([m, l]) => `<button type="button" data-run="${escA(m)}|${escA(l)}">${esc(l)}</button>`).join("")}</div>${F.note ? `<p class="muted">${esc(F.note)}</p>` : ""}
      <p class="muted">Not sure which method fits your question? <a href="methods.html${MODE.who === "researcher" ? "#pro" : ""}">Read the Methods Guide</a>: every method by research question, with the steps in this app.</p>
      <p class="muted">No data needed for these two. Each opens on its own page.</p>
      <div class="emptybtns"><a class="pagebtn" href="#distraction">distrACTION <span>probability calculators</span></a><a class="pagebtn" href="#learn">Learn <span>classroom demonstrations</span></a></div>
      <p class="muted">Means use t with degrees of freedom; decisions use the p-value. Your data stay on this computer, and the page works offline once loaded.</p></div>`;
  }
  function wireEmpty(g) {
    g.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { const it = findItem("Data", b.dataset.go); if (it) runItem("Data", it); }));
    g.querySelectorAll("[data-who]").forEach((b) => (b.onclick = () => applyMode(b.dataset.who, MODE.field, true)));
    g.querySelectorAll("[data-field]").forEach((b) => (b.onclick = modeUI));
    g.querySelectorAll("[data-run]").forEach((b) => (b.onclick = () => { const [m, l] = b.dataset.run.split("|"); const it = findItem(m, l); if (it) runItem(m, it); }));
  }
  // menu bar: dropdowns are placed on screen by hand so they never run off the right or bottom edge
  const nav = $("#menu");
  function closeMenus() { nav.querySelectorAll(".dd").forEach((d) => { d.classList.remove("open"); const t = d.querySelector(".top"); if (t) t.setAttribute("aria-expanded", "false"); }); }
  function openDD(dd, focus) { // focus: "first" or "last" item, when the menu was opened from the keyboard
    closeMenus(); dd.classList.add("open"); dd.querySelector(".top").setAttribute("aria-expanded", "true"); placeItems(dd);
    const its = [...dd.querySelectorAll(".items button")]; if (focus && its.length) (focus === "last" ? its[its.length - 1] : its[0]).focus();
  }
  function placeItems(dd) {
    const it = dd.querySelector(".items"), r = dd.querySelector(".top").getBoundingClientRect();
    it.style.top = r.bottom + "px"; it.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 8) + "px";
    const w = it.offsetWidth; it.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
  }
  // each menu is a menu button: aria-expanded says whether it is open; Enter, Space or Arrow Down opens it with the first item
  // focused; Arrow Up and Down (Home, End) move; Arrow Left and Right go to the next menu; Escape closes it and returns to its
  // name; Tab still walks the items; a menu closes when focus leaves it
  MENU.forEach(([name, items], mi) => {
    const dd = document.createElement("div"); dd.className = "dd"; dd.dataset.name = name;
    dd.innerHTML = `<button type="button" class="top" id="mtop${mi}" aria-haspopup="true" aria-expanded="false" aria-controls="mitems${mi}">${name}</button><div class="items" id="mitems${mi}" role="menu" aria-labelledby="mtop${mi}">${items.map((it) => (it ? `<button type="button" role="menuitem">${esc(it[0])}</button>` : '<div class="sep" role="separator"></div>')).join("")}</div>`;
    const top = dd.querySelector(".top");
    top.onclick = (e) => { e.stopPropagation(); const open = dd.classList.contains("open"); closeMenus(); if (!open) openDD(dd, e.detail === 0 ? "first" : null); };
    const btns = dd.querySelectorAll(".items button"); let k = 0;
    items.forEach((it) => { if (!it) return; btns[k++].onclick = () => runItem(name, it); });
    dd.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const its = [...btns], i = its.indexOf(document.activeElement), open = dd.classList.contains("open"), dds = [...nav.querySelectorAll(".dd")], di = dds.indexOf(dd);
      if (e.key === "Escape" && open) { e.preventDefault(); closeMenus(); top.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const down = e.key === "ArrowDown"; if (!open) openDD(dd, down ? "first" : "last"); else its[i < 0 ? (down ? 0 : its.length - 1) : (i + (down ? 1 : its.length - 1)) % its.length].focus(); }
      else if ((e.key === "Home" || e.key === "End") && open && i >= 0) { e.preventDefault(); its[e.key === "Home" ? 0 : its.length - 1].focus(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const nx = dds[(di + (e.key === "ArrowRight" ? 1 : dds.length - 1)) % dds.length]; if (open) openDD(nx, "first"); else nx.querySelector(".top").focus(); }
    });
    dd.addEventListener("focusout", (e) => { if (e.relatedTarget && !dd.contains(e.relatedTarget) && dd.classList.contains("open")) { dd.classList.remove("open"); top.setAttribute("aria-expanded", "false"); } });
    nav.appendChild(dd);
  });
  document.addEventListener("click", closeMenus);
  window.addEventListener("resize", closeMenus);
  window.addEventListener("scroll", closeMenus, { passive: true }); // the dropdowns are fixed: a page scroll would leave one floating
  // distrACTION page: until a distribution is picked, the inputs card lists them; Learn page: the demonstrations
  (function () {
    const dm = DIST_ITEMS, lm = LEARN_ITEMS;
    $("#distPick").innerHTML = `<p class="muted">Pick a calculator. The same list is under distrACTION in the menu bar.</p><div class="pickbtns">${dm.map((it, i) => `<button type="button" data-i="${i}">${esc(it[0])}</button>`).join("")}</div>`;
    $("#distPick").querySelectorAll("button").forEach((b) => (b.onclick = () => runItem("distrACTION", dm[+b.dataset.i])));
    $("#learnPick").innerHTML = `<p class="muted">Pick a demonstration. These are also under Learn in the menu bar.</p><div class="pickbtns">${lm.map((it, i) => `<button type="button" data-i="${i}">${esc(it[0])}</button>`).join("")}</div>`;
    $("#learnPick").querySelectorAll("button").forEach((b) => (b.onclick = () => runItem("Learn", lm[+b.dataset.i])));
    $("#distSel").innerHTML = dm.map((it, i) => `<option value="${i}">${esc(it[0])}</option>`).join("");
    $("#distSel").onchange = (e) => { const it = dm[+e.target.value]; if (it) runItem("distrACTION", it, { keep: true }); };
    $("#learnSel").innerHTML = `<option value="">Pick one</option>` + lm.map((it, i) => `<option value="${i}">${esc(it[0])}</option>`).join("");
    $("#learnSel").onchange = (e) => { const it = lm[+e.target.value]; e.target.value = ""; if (e.target.selectedIndex < 0) e.target.selectedIndex = 0; if (it) runItem("Learn", it, { keep: true }); };
  })();
  $("#backData").onclick = () => { setView("data", "push"); focusTo(pageHeading(), true); };
  // Skip to content: the first thing Tab reaches; it jumps past the links and the 12 menus to the page's own content
  $("#skipLink").addEventListener("click", (e) => { e.preventDefault(); const f = VIEW === "distraction" && [...$("#distForm").querySelectorAll("input, select, textarea")].find((el) => el.getClientRects().length); if (f) f.focus(); else focusTo(pageHeading(), true); });
  // Clear this page (and Results, Clear analyses or Clear graphs while this page is open): the page's results go and, on
  // distrACTION, the open calculator too, so the list comes back. Undo clear, in the same spot, brings everything back
  // until something new happens on the page.
  function clearToolPage() {
    if (VIEW === "data") return;
    const paneSel = baseTarget(), pane = $(paneSel), df = $("#distForm");
    const st = { view: VIEW, pane: paneSel, nodes: [...pane.children], fn: null, values: null, live: null };
    if (VIEW === "distraction" && df.children.length && df._fn) { st.fn = df._fn; try { st.values = df._collect(); } catch (e) { } st.live = LIVE && LIVE.isConnected && !LIVE.classList.contains("stale") ? LIVE : null; }
    st.nodes.forEach((n) => n.classList.remove("stale", "editing", "kept"));
    st.nodes.forEach((n) => n.remove());
    if (VIEW === "distraction") {
      LIVE = null; $("#distPanel").appendChild($("#distMsg")); df.innerHTML = ""; df._fn = df._collect = df._title = null; distMsg("");
      $("#distPick").style.display = ""; $("#distSwitch").style.display = "none"; $("#toolTitle").textContent = "distrACTION"; $("#toolNote").textContent = "Probability calculators. No data needed.";
      document.body.classList.remove("dist-open");
    }
    UNDO = st.nodes.length || st.fn ? st : null;
    counts();
    const u = $("#toolUndo"); if (UNDO && u) u.focus({ preventScroll: true });
  }
  function dropUndo() { UNDO = null; counts(); }
  function undoClear() {
    const st = UNDO; UNDO = null; if (!st || st.view !== VIEW) return counts();
    $(st.pane).append(...st.nodes);
    if (st.fn) { CUR_FN = st.fn; PREFILL = st.values; REPLACE = null; TARGET = baseTarget(); INLINE = true; RESUME = st.live; try { st.fn(); } catch (e) { } finally { INLINE = false; RESUME = null; } }
    $(st.pane).querySelectorAll(".plot").forEach((p) => { try { Plotly.Plots.resize(p); } catch (e) { } });
    counts(); const c = $("#toolClear"); if (c && c.style.display !== "none") c.focus({ preventScroll: true });
  }
  $("#toolClear").onclick = clearToolPage;
  $("#toolUndo").onclick = undoClear;
  // A filter that cannot be read says so under the box and leaves every row in use; the typed text stays so it can be fixed.
  // (This used to be an alert, and a blocking dialog raised from the box's change event could lock the tab in Chrome.)
  function filterMsg(t) { const m = $("#filterMsg"), b = $("#filterBox"); if (m) m.textContent = t || ""; if (b) { if (t) b.setAttribute("aria-invalid", "true"); else b.removeAttribute("aria-invalid"); } }
  $("#filterBox").addEventListener("change", () => {
    const typed = $("#filterBox").value.trim(); D.filter = typed; let bad = "";
    try { activeIdx(); } catch (e) { bad = e.message; }
    if (bad) { D.filter = ""; renderGrid(); $("#filterBox").value = typed; filterMsg(bad + " All rows are in use until the filter is fixed."); persist(); return; }
    filterMsg(""); renderGrid(); persist();
  });
  document.querySelectorAll(".tabs .tab").forEach((b) => (b.onclick = () => { showTab(b.dataset.tab); if (narrow()) toView($(".tabs")); }));
  $(".tabs").addEventListener("keydown", (e) => { // Analyses and Graphs: arrow keys switch tabs too
    if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return; const t = [...document.querySelectorAll(".tabs .tab")], i = t.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (i + (e.key === "ArrowRight" ? 1 : t.length - 1)) % t.length; t[n].focus(); showTab(t[n].dataset.tab);
  });
  // the distrACTION inputs card stays in view beside the results; when it is taller than the space (a short screen, or 200%
  // zoom) it scrolls inside itself, so x1 and Run can always be reached. Phones and iPad portrait scroll the whole page instead.
  (function () {
    const sc = $(".toolscroll"), pn = $("#distPanel"); if (!sc || !pn) return;
    const fit = () => { pn.style.maxHeight = narrow() || !sc.clientHeight ? "" : Math.max(160, sc.clientHeight - 40) + "px"; };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(sc); window.addEventListener("resize", fit); fit();
  })();
  renderGrid();
  restore();
  setView(pageFromHash());
  applyProfile(PROF, false);
  SHARED = unpackState(location.hash); if (SHARED) offerLast(SHARED, true); else offerLast(LAST, false);
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
