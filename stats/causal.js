// Stats Without Walls: the Causal menu, the free companion to the causal inference book.
// Loaded before app.js. app.js calls window.SWW_CAUSAL.install(api) with its helpers (dialog, card, table, plots, the
// open data) and gets back the menu items and the R lines for the Script tool. The arithmetic lives in stats.js
// (SW.dagParse, SW.dSep, SW.backdoor, SW.dagLayout, SW.standardize, SW.ipw, SW.psMatch, SW.iv, SW.did, SW.rdd,
// SW.manski); this file is the dialogs, the cards, the DAG picture and the plots. Plain words under every result.
(function () {
  "use strict";
  function install(api) {
    const { dialog, card, table, say, warn, ok, formula, worked, plotDiv, col, needData, src, esc, fmt, sel, selNum, selAny, levelProblem, fieldErr, addColumn, numCols, catCols, designMatrix, keepComplete, dmNotes, SW, downloadText, cond, confField, isNum, activeIdx, announce } = api;
    const D = api.D;
    const BLUE = "#3A7CA5", ORANGE = "#D97D54", RED = "#C0392B", NAVY = "#1A3A4D";
    const pct = (c) => Math.round(Number(c) * 100) + "%", confOf = (v) => { const c = Number(v.conf); return c > 1 ? c / 100 : c || 0.95; };

    // ---------- shared helpers ----------
    const lvCheck = (colKey, lvKey, what, when = () => true) => (raw, live) => (raw[colKey] && when(raw) ? levelProblem([raw[colKey]], raw[lvKey], what, live) : "");
    const catOnly = (key) => (raw) => raw[key] && !isNum(raw[key]); // a numeric 0/1 column needs no level
    const lvField = (name, label, colKey, what, when) => ({ name, label, type: "text", value: "", check: lvCheck(colKey, name, what, when || catOnly(colKey)), vis: when || catOnly(colKey) });
    const numeric = (name) => col(name).map((q) => (q === "" ? "" : Number(q)));
    const is01 = (vals) => vals.every((q) => q === "" || q === "0" || q === "1" || q === 0 || q === 1);
    // a 0/1 variable from a column: a numeric 0/1 column as it is, otherwise the typed level counts as 1
    function binary(name, level, what) {
      const v = col(name); if (isNum(name) && is01(v)) return v.map((q) => (q === "" ? "" : Number(q)));
      const lv = [...new Set(v.filter((q) => q !== ""))]; if (lv.length !== 2) throw new Error(`${name} has ${lv.length} distinct value${lv.length === 1 ? "" : "s"} (${lv.slice(0, 6).join(", ")}${lv.length > 6 ? ", ..." : ""}); ${what} needs exactly two.`);
      const t = String(level == null ? "" : level).trim(); if (!lv.includes(t)) throw new Error(`Type the level of ${name} that counts as 1: ${lv.join(" or ")}.`);
      return v.map((q) => (q === "" ? "" : q === t ? 1 : 0));
    }
    const keepAll = (...arrs) => { const n = arrs[0].length, keep = []; for (let i = 0; i < n; i++) if (arrs.every((a) => a[i] !== "" && a[i] != null && !(typeof a[i] === "number" && !Number.isFinite(a[i])))) keep.push(i); return keep; };
    const pick = (arr, idx) => idx.map((i) => arr[i]);
    const needBoth = (t, what) => { if (!t.includes(1) || !t.includes(0)) throw new Error(`${what} needs rows in both groups (treated and untreated) among the usable rows.`); };
    const uniqueName = (base) => { let nm = base, k = 2; while (D().cols.includes(nm)) nm = base + "_" + k++; return nm; };
    // covariates: numeric columns as they are, categorical ones dummy coded by the app's design matrix
    function covariates(v) { const dm = designMatrix(v.xs || [], v.cs || []); return { rows: dm.rows, names: dm.names, notes: dmNotes(dm), any: (v.xs || []).length + (v.cs || []).length > 0 }; }
    const smdWord = (s) => (Math.abs(s) < 0.1 ? "balanced" : Math.abs(s) < 0.25 ? "some imbalance" : "imbalanced");
    const balanceTable = (rows, afterLabel, afterKeys) => table(["Covariate", "Mean, treated", "Mean, untreated", "SMD before", `Mean, treated (${afterLabel})`, `Mean, untreated (${afterLabel})`, `SMD after`, "After"], rows.map((b) => [b.name, b.m1, b.m0, b.smd0, b[afterKeys[0]], b[afterKeys[1]], b.smd1, smdWord(b.smd1)]), "Balance: standardized mean differences (SMD) before and after; under 0.1 is the usual target");
    const smdNote = "SMD = (mean in the treated minus mean in the untreated) / pooled SD of the two groups before adjustment, the same yardstick before and after. Under 0.1 in absolute value counts as balanced.";
    const ciRow = (label, est, lo, hi) => [label, est, lo, hi];

    // ---------- 1. Draw a DAG: paths, d-separation, backdoor ----------
    const EXAMPLE = "Family income -> Tutoring\nFamily income -> Test score\nTutoring -> Test score\nPrior GPA -> Tutoring\nPrior GPA -> Test score";
    const lastDag = () => { try { return JSON.parse(localStorage.getItem("sww_dag_last") || "null"); } catch (e) { return null; } };
    const splitNames = (s) => String(s || "").split(",").map((q) => q.trim()).filter(Boolean);
    const nodesOf = (raw) => SW.dagParse(raw.edges).nodes;
    const edgesCheck = (raw) => { const P = SW.dagParse(raw.edges); return P.errors[0] || (P.nodes.length ? "" : "Type at least one arrow, such as Family income -> Tutoring."); };
    const namesCheck = (key) => (raw) => { const bad = splitNames(raw[key]).filter((n) => !nodesOf(raw).includes(n)); return bad.length ? `Not in the graph: ${bad.join(", ")}. The variables are ${nodesOf(raw).join(", ")}.` : ""; };
    const oneCheck = (key) => (raw) => { const n = String(raw[key] || "").trim(); return n && !nodesOf(raw).includes(n) ? `Not in the graph: ${n}. The variables are ${nodesOf(raw).join(", ")}.` : ""; };
    function dagSVG(P, condSet, unobsSet, mark) {
      const L = SW.dagLayout(P.nodes, P.edges), W = 760, H = Math.max(200, 86 * L.rows + 70), mx = 70, my = 44, id = "dagarr" + Math.random().toString(36).slice(2, 8);
      const box = {}; P.nodes.forEach((n) => { const w = Math.max(76, 9 * n.length + 26), h = 36, cx = mx + L.xy[n].x * (W - 2 * mx), cy = my + L.xy[n].y * (H - 2 * my); box[n] = { cx, cy, w, h }; });
      const edge = ([a, b]) => { const A = box[a], B = box[b], dx = B.cx - A.cx, dy = B.cy - A.cy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len; const clip = (R) => Math.min(Math.abs(ux) > 1e-9 ? (R.w / 2 + 4) / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-9 ? (R.h / 2 + 4) / Math.abs(uy) : Infinity); const ta = clip(A), tb = clip(B) + 7; return `<line x1="${(A.cx + ux * ta).toFixed(1)}" y1="${(A.cy + uy * ta).toFixed(1)}" x2="${(B.cx - ux * tb).toFixed(1)}" y2="${(B.cy - uy * tb).toFixed(1)}" stroke="${NAVY}" stroke-width="1.8" marker-end="url(#${id})"/>`; };
      const node = (n) => { const R = box[n], c = condSet.has(n), u = unobsSet.has(n), m = mark && mark[n]; return `<g><rect x="${(R.cx - R.w / 2).toFixed(1)}" y="${(R.cy - R.h / 2).toFixed(1)}" width="${R.w}" height="${R.h}" rx="9" fill="${c ? "#CBD4DB" : "#fff"}" stroke="${m ? ORANGE : NAVY}" stroke-width="${m ? 2.6 : 1.6}" ${u ? 'stroke-dasharray="7 4"' : ""}/><text x="${R.cx.toFixed(1)}" y="${(R.cy + 5).toFixed(1)}" text-anchor="middle" font-size="14" font-family="inherit" ${u ? 'font-style="italic"' : ""} fill="${NAVY}">${esc(n)}</text></g>`; };
      return `<svg class="dag" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:6px auto" role="img" aria-label="Causal diagram with ${P.nodes.length} variables and ${P.edges.length} arrows"><defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${NAVY}"/></marker></defs>${P.edges.map(edge).join("")}${P.nodes.map(node).join("")}</svg>`;
    }
    const pathWord = (p) => p.text;
    function dagUI() {
      const last = lastDag() || {};
      dialog("Causal: Draw a DAG, d-separation and the backdoor criterion", [
        { name: "edges", label: "Arrows, one per line: cause -> effect", type: "textarea", rows: 7, value: last.edges || EXAMPLE, placeholder: "Family income -> Tutoring", check: edgesCheck, hint: "Real names with spaces are fine. A line may chain: Study hours -> Practice -> Score. Lines starting with # are notes. To load a saved graph, paste its lines here; the card has a download button for the lines." },
        { name: "unobs", label: "Unobserved variables (comma separated; drawn dashed; never allowed in an adjustment set)", type: "text", value: last.unobs || "", check: namesCheck("unobs") },
        { name: "cond", label: "Conditioned on (comma separated; drawn shaded; the set Z of the d-separation check)", type: "text", value: last.cond || "", check: namesCheck("cond") },
        { name: "dx", label: "Variable X", type: "text", value: last.dx == null ? "Tutoring" : last.dx, group: "d-separation check (leave blank to skip)", check: oneCheck("dx") },
        { name: "dy", label: "Variable Y", type: "text", value: last.dy == null ? "Test score" : last.dy, group: "d-separation check (leave blank to skip)", check: oneCheck("dy") },
        { name: "tr", label: "Treatment", type: "text", value: last.tr == null ? "Tutoring" : last.tr, group: "Backdoor helper (leave blank to skip)", check: oneCheck("tr") },
        { name: "out", label: "Outcome", type: "text", value: last.out == null ? "Test score" : last.out, group: "Backdoor helper (leave blank to skip)", check: oneCheck("out") },
      ], (v) => {
        const P = SW.dagParse(v.edges); if (P.errors.length) throw fieldErr("edges", P.errors[0]); if (!P.nodes.length) throw fieldErr("edges", "Type at least one arrow.");
        const unobs = splitNames(v.unobs), condZ = splitNames(v.cond); for (const k of ["unobs", "cond"]) { const m = namesCheck(k)(v); if (m) throw fieldErr(k, m); }
        const dx = v.dx.trim(), dy = v.dy.trim(), tr = v.tr.trim(), out = v.out.trim(); for (const k of ["dx", "dy", "tr", "out"]) { const m = oneCheck(k)(v); if (m) throw fieldErr(k, m); }
        if (dx && dy && dx === dy) throw fieldErr("dy", "X and Y must be two different variables."); if (tr && out && tr === out) throw fieldErr("out", "The treatment and the outcome must be two different variables.");
        if ((dx && !dy) || (!dx && dy)) throw fieldErr(dx ? "dy" : "dx", "Give both X and Y, or leave both blank."); if ((tr && !out) || (!tr && out)) throw fieldErr(tr ? "out" : "tr", "Give both the treatment and the outcome, or leave both blank.");
        if (condZ.includes(dx) || condZ.includes(dy)) throw fieldErr("cond", "X and Y themselves cannot be in the conditioning set.");
        try { localStorage.setItem("sww_dag_last", JSON.stringify({ edges: v.edges, unobs: v.unobs, cond: v.cond, dx, dy, tr, out })); } catch (e) { }
        const condSet = new Set(condZ), unobsSet = new Set(unobs), mark = {}; if (dx) { mark[dx] = 1; mark[dy] = 1; } else if (tr) { mark[tr] = 1; mark[out] = 1; }
        const lines = P.edges.map(([a, b]) => `${a} -> ${b}`);
        let html = dagSVG(P, condSet, unobsSet, mark) + say(`${P.nodes.length} variables, ${P.edges.length} arrows. Shaded: conditioned on${condZ.length ? ` (${condZ.map(esc).join(", ")})` : ""}. Dashed: unobserved${unobs.length ? ` (${unobs.map(esc).join(", ")})` : ""}. Orange border: the pair under study. Arrows point from cause to effect; the picture is a claim about the world, not a result.`);
        html += `<div class="cap">The graph as text (download it to keep it; paste the lines back into the dialog to load it)</div>` + `<div class="formula" style="white-space:pre-wrap">${lines.map(esc).join("\n")}</div>` + `<div class="tblbtns"><button type="button" data-act="dagdl">download the graph (.txt)</button></div>`;
        if (dx) {
          const r = SW.dSep(P.nodes, P.edges, dx, dy, condZ), zTxt = condZ.length ? `{${condZ.map(esc).join(", ")}}` : "nothing (the empty set)";
          html += `<div class="cap">d-separation: ${esc(dx)} and ${esc(dy)} given ${zTxt}</div>`;
          if (!r.paths.length) html += say(`There is no path at all between ${esc(dx)} and ${esc(dy)}: the diagram implies they are independent, whatever is conditioned on.`);
          else html += table(["Path", "Status", "Where and why"], r.paths.map((p) => [pathWord(p), p.open ? "open" : "blocked", p.info.length ? p.info.map((i) => `${i.node}: ${i.why}`).join("; ") : "a direct arrow: always open"]), `${r.paths.length} path${r.paths.length === 1 ? "" : "s"} between ${dx} and ${dy}${r.truncated ? " (the first 2000; the graph has more)" : ""}`) +
            (r.separated ? ok(`${esc(dx)} and ${esc(dy)} are d-separated given ${zTxt}: every path is blocked, so the diagram implies no association between them once ${condZ.length ? "those variables are" : "nothing is"} held fixed.`) : say(`${esc(dx)} and ${esc(dy)} are not d-separated given ${zTxt}: ${r.nOpen} of ${r.paths.length} path${r.paths.length === 1 ? " is" : "s are"} open (${r.paths.filter((p) => p.open).map((p) => pathWord(p)).join("; ")}), so the diagram allows an association between them. A chain or fork node is blocked by conditioning on it; a collider is blocked unless it, or one of its descendants, is conditioned on.`));
        }
        if (tr) {
          const b = SW.backdoor(P.nodes, P.edges, tr, out, unobs);
          html += `<div class="cap">Backdoor criterion: the effect of ${esc(tr)} on ${esc(out)}</div>`;
          if (!b.backdoorPaths.length) html += ok(`No backdoor path: no arrow points into ${esc(tr)} from a path that reaches ${esc(out)}. Nothing needs adjusting; comparing ${esc(out)} across ${esc(tr)} identifies the effect, if the diagram is right.`);
          else {
            html += table(["Backdoor path (starts with an arrow into the treatment)", "With nothing conditioned on", "Unobserved on it"], b.backdoorPaths.map((p) => [pathWord(p), p.open ? "open" : `blocked at ${p.blockedAt} (${p.info.find((i) => i.node === p.blockedAt).type})`, p.nodes.slice(1, -1).filter((n) => unobsSet.has(n)).join(", ") || "none"]), `${b.backdoorPaths.length} backdoor path${b.backdoorPaths.length === 1 ? "" : "s"}`);
            const notAllowed = [].concat(b.descendants.length ? [`descendants of ${tr} (${b.descendants.join(", ")})`] : [], unobs.length ? [`unobserved variables (${unobs.join(", ")})`] : []);
            if (b.none) html += warn(`No valid adjustment set from the measured variables. ${b.unobservedOnPaths.length ? `The unobserved ${b.unobservedOnPaths.join(" and ")} sit${b.unobservedOnPaths.length === 1 ? "s" : ""} on an open backdoor path and cannot be adjusted for.` : "Every set tried leaves a backdoor path open."} Measuring the missing variable, an instrument, or a front-door design would be needed; adjusting for what is measured does not give the causal effect here.`);
            else if (b.emptyOK) html += ok(`Every backdoor path is already blocked with nothing conditioned on: no adjustment is needed. ${b.sets.length > 1 ? `Adding ${b.sets.filter((s) => s.Z.length).map((s) => "{" + s.Z.join(", ") + "}").slice(0, 4).join(" or ")} also works but is not required.` : ""}`);
            else html += table(["Adjustment set", "Size", "Minimal"], b.sets.slice(0, 30).map((s) => [`{${s.Z.join(", ")}}`, s.Z.length, s.minimal ? "yes" : "no"]), `Valid adjustment sets${b.sets.length > 30 ? " (the first 30 of " + b.sets.length + ")" : ""}`) + ok(`Adjust for ${b.minimal.map((s) => "{" + s.Z.join(", ") + "}").join(" or ")}: ${b.minimal.length === 1 ? "that set blocks" : "each of these blocks"} every backdoor path with no descendant of ${esc(tr)} and no unobserved variable. Any listed set works; a smaller one is easier to estimate well.`);
            if (notAllowed.length) html += say(`Never in an adjustment set: ${notAllowed.join("; ")}.${b.truncated ? " More than 12 candidates: sets of up to 3 variables were tried." : ""}`);
          }
        }
        html += formula("d-separation: a path is blocked at a chain (A -> M -> B) or a fork (A <- M -> B) when M is conditioned on, and at a collider (A -> M <- B) when neither M nor a descendant of M is conditioned on. Backdoor criterion: a set Z identifies the effect of T on Y when Z blocks every path into T and contains no descendant of T.");
        const cd = card("Causal diagram" + (tr ? `: ${tr} and ${out}` : dx ? `: ${dx} and ${dy}` : ""), `${P.nodes.length} variables, ${P.edges.length} arrows`, html);
        const btn = cd.querySelector('[data-act="dagdl"]'); if (btn) btn.onclick = () => { downloadText(lines.join("\n") + "\n", "causal-diagram.txt"); announce("Graph downloaded."); };
        return cd;
      }, "Draw");
    }

    // ---------- 2. Adjust by groups (standardization) ----------
    function standardizeUI() {
      needData();
      dialog("Causal: Adjust by groups (standardization)", [selAny("y", "Outcome (a number, or a yes/no column)", false), lvField("ylv", "If the outcome is yes/no: the level that counts as 1", "y", "the outcome level that counts as 1"), selAny("t", "Treatment (two levels)", false), lvField("tlv", "Treated level (exactly as in the data)", "t", "the treated level"), { name: "s", label: "Group by (one or more variables that could confound)", type: "multi", options: catCols() }], (v) => {
        if (!v.s.length) throw fieldErr("s", "Pick at least one grouping variable.");
        const yv = isNum(v.y) && !is01(col(v.y)) ? numeric(v.y) : binary(v.y, v.ylv, "the outcome"), tv = binary(v.t, v.tlv, "the treatment"), keys = v.s.map((c) => col(c)), key = keys[0].map((_, i) => keys.map((k) => k[i]).join(" / "));
        const keep = keepAll(yv, tv, ...keys), y = pick(yv, keep), t = pick(tv, keep); needBoth(t, "Standardization");
        const r = SW.standardize(y, t, pick(key, keep)), isP = is01(y.map(String)), word = isP ? "share" : "mean";
        let html = table(["Group", "n", "Share of sample", `${word}, treated`, `${word}, untreated`, "Difference"], r.rows.map((g) => [g.key, g.n, g.w, g.m1, g.m0, g.d]), `Within each group of ${v.s.join(" and ")}`);
        html += table(["Comparison", `${word}, treated`, `${word}, untreated`, "Difference"], [["Crude (everyone together)", r.crude.m1, r.crude.m0, r.crude.d], [`Standardized to the whole sample's mix of ${v.s.join(" and ")}`, r.std.m1, r.std.m0, r.std.d]], "Crude and standardized differences");
        if (r.skipped.length) html += warn(`${r.skipped.map((g) => g.key).join(", ")}: only ${r.skipped.every((g) => !g.n1) ? "untreated" : r.skipped.every((g) => !g.n0) ? "treated" : "one kind of"} rows there, so that group cannot be compared (no positivity). The standardized numbers use the other groups, rescaled to ${pct(r.share)} of the sample.`);
        html += formula(`standardized ${word} = sum over groups of (share of the group) x (${word} in that group); difference = standardized treated minus standardized untreated`) + worked(r.used.map((g) => `${g.key}: ${fmt(g.w / r.share, 3)} x (${fmt(g.m1)} minus ${fmt(g.m0)}) = ${fmt((g.w / r.share) * g.d)}`).concat([`sum = ${fmt(r.std.d)}`]));
        const flip = Math.sign(r.crude.d) !== Math.sign(r.std.d) && Math.abs(r.crude.d) > 1e-9 && Math.abs(r.std.d) > 1e-9;
        html += say(`Crude difference ${fmt(r.crude.d)}; after standardizing on ${v.s.join(" and ")}, ${fmt(r.std.d)}. ${flip ? "The sign flips: the groups were mixed so differently between treated and untreated that the crude comparison pointed the wrong way (Simpson's paradox)." : Math.abs(r.crude.d - r.std.d) < 0.05 * Math.max(1e-9, Math.abs(r.crude.d)) ? "The two agree closely: this grouping changes little." : "The gap between them is the part of the crude difference that the grouping variable explains."} The standardized difference is the causal effect only if these groups capture every common cause of ${v.t} and ${v.y}.`);
        card(`Standardization: ${v.y} by ${v.t}`, src(`groups: ${v.s.join(", ")}`), html);
      });
    }

    // ---------- 3. Propensity score and inverse probability weighting ----------
    const covFields = () => [{ name: "xs", label: "Numeric covariates (common causes of treatment and outcome)", type: "multi", options: numCols() }, { name: "cs", label: "Categorical covariates", type: "multi", options: catCols() }];
    function psPrep(v, what) {
      const C = covariates(v); if (!C.any) throw fieldErr("xs", "Pick at least one covariate for the propensity model.");
      const tv = binary(v.t, v.tlv, "the treatment"), yv = numeric(v.y), keep = keepComplete(C.rows, yv.map((q) => (q === "" ? "" : String(q))), [tv]);
      const X = keep.map((i) => C.rows[i].map(Number)), t = keep.map((i) => tv[i]), y = keep.map((i) => yv[i]); needBoth(t, what);
      if (keep.length < 20) throw new Error(`Only ${keep.length} usable rows; ${what} needs more.`);
      return { X, t, y, keep, names: C.names, notes: C.notes };
    }
    const psTable = (fit, t) => table(["Term", "Estimate (log odds)", "SE", "z", "p", "Odds ratio"], fit.names.map((nm, i) => [nm, fit.b[i], fit.se[i], fit.z[i], SW.fmtP(fit.p[i]), fit.or[i]]), `Propensity model: logistic regression of ${t} on the covariates`);
    function overlapPlot(cd, ps, t, tname) { const ps1 = ps.filter((_, i) => t[i] === 1), ps0 = ps.filter((_, i) => t[i] === 0); plotDiv(cd, [{ x: ps0, type: "histogram", name: "untreated", opacity: 0.6, marker: { color: BLUE }, xbins: { start: 0, end: 1, size: 0.05 } }, { x: ps1, type: "histogram", name: "treated", opacity: 0.6, marker: { color: ORANGE }, xbins: { start: 0, end: 1, size: 0.05 } }], { barmode: "overlay", title: `Overlap: propensity scores by ${tname}`, xaxis: { title: "propensity score (estimated probability of treatment)", range: [0, 1] }, yaxis: { title: "Count" }, showlegend: true }, 280); }
    function savePS(v, keep, ps) { const idx = activeIdx(), vals = new Array(D().rows.length).fill(""); keep.forEach((k, j) => (vals[idx[k]] = ps[j])); const nm = uniqueName("ps_" + v.t); addColumn(nm, vals); return nm; }
    function ipwUI() {
      needData();
      dialog("Causal: Propensity score and inverse probability weighting", [selAny("t", "Treatment (two levels)", false), lvField("tlv", "Treated level (exactly as in the data)", "t", "the treated level"), ...covFields(), selNum("y", "Outcome (numeric)"), { name: "save", label: "Save the propensity score as a new column", type: "check", value: true }, { name: "plot", label: "Overlap plot (propensity scores by group)", type: "check", value: true }, { name: "reps", label: "Bootstrap resamples for the interval", type: "number", value: 1000, hint: "The propensity model is refitted in every resample. 1000 is plenty; 200 is quick." }, confField], (v) => {
        const P = psPrep(v, "Weighting"), conf = confOf(v), reps = Math.max(50, Math.min(5000, Math.round(v.reps) || 1000));
        const r = SW.ipw(P.X, P.t, P.y, P.names, { conf, reps, seed: 1 });
        let html = P.notes + psTable(r.fit, v.t);
        html += table(["Group", "n", "Smallest score", "Largest score"], [["treated", r.n1, r.psRange.t1[0], r.psRange.t1[1]], ["untreated", r.n0, r.psRange.t0[0], r.psRange.t0[1]]], "Positivity: do both groups cover the same range of scores?") + (r.extreme ? warn(`${r.extreme} row${r.extreme === 1 ? " has" : "s have"} a score under 0.01 or over 0.99; the largest weight is ${fmt(r.maxW, 1)}. Such rows dominate a weighted average. Trimming them or a narrower question (the effect on the treated) is the usual remedy.`) : ok(`No score is below 0.01 or above 0.99; the largest weight is ${fmt(r.maxW, 1)}.`));
        html += table(["Estimate", "Effect on " + v.y, `${pct(conf)} interval lower`, "upper"], [ciRow("Crude difference (treated minus untreated)", r.crude, "", ""), ciRow("Average effect, everyone (IPW, ATE)", r.point.ate, r.boot.ateLower, r.boot.ateUpper), ciRow("Average effect on the treated (ATT)", r.point.att, r.boot.attLower, r.boot.attUpper)], `Effects, bootstrap interval from ${r.boot.reps} resamples${r.boot.failed ? ` (${r.boot.failed} resamples failed and were skipped)` : ""}`);
        html += balanceTable(r.balance, "weighted", ["wm1", "wm0"]) + say(smdNote);
        html += formula(`weight = 1 / e for a treated row and 1 / (1 minus e) for an untreated row, where e is the propensity score. ATE = weighted mean of ${v.y} among the treated minus weighted mean among the untreated. ATT: treated rows weight 1, untreated rows weight e / (1 minus e).`) + worked([`weighted mean, treated = ${fmt(r.point.m1)}; weighted mean, untreated = ${fmt(r.point.m0)}; ATE = ${fmt(r.point.m1)} minus ${fmt(r.point.m0)} = ${fmt(r.point.ate)}`, `mean among the treated = ${fmt(r.point.att + r.point.att0)}; weighted mean of the untreated reweighted to look like the treated = ${fmt(r.point.att0)}; ATT = ${fmt(r.point.att)}`]);
        const bal = r.balance.every((b) => Math.abs(b.smd1) < 0.1);
        html += say(`Crude difference ${fmt(r.crude)}; weighted so that treated and untreated share the same covariate mix, ${fmt(r.point.ate)} (${pct(conf)} interval ${fmt(r.boot.ateLower)} to ${fmt(r.boot.ateUpper)}). ${bal ? "After weighting every covariate is balanced (SMD under 0.1)" : "Some covariates are still imbalanced after weighting (SMD 0.1 or more); add terms or check the overlap"}. This is the causal effect only if the covariates include every common cause of ${v.t} and ${v.y}, and the model for ${v.t} is adequate.`);
        const cd = card(`Inverse probability weighting: ${v.y} by ${v.t}`, src(`covariates: ${P.names.join(", ")}`), html);
        if (v.plot) overlapPlot(cd, r.ps, r.t || P.t, v.t);
        if (v.save) { const nm = savePS(v, P.keep, r.ps); cd.querySelector("h2").insertAdjacentHTML("afterend", `<div class="ok">Propensity scores saved in the new column ${esc(nm)} (${P.keep.length} rows; blank where a covariate or the outcome was missing).</div>`); }
        return cd;
      });
    }

    // ---------- 4. Matching on the propensity score ----------
    function matchUI() {
      needData();
      dialog("Causal: Matching on the propensity score (1 to 1, nearest neighbour, with replacement)", [selAny("t", "Treatment (two levels)", false), lvField("tlv", "Treated level (exactly as in the data)", "t", "the treated level"), ...covFields(), selNum("y", "Outcome (numeric)"), { name: "cal", label: "Caliper, in SDs of the propensity score (blank = none)", type: "number", value: "", hint: "0.2 is a common choice: a treated row with no untreated row within 0.2 SD of its score stays unmatched." }, { name: "plot", label: "Overlap plot (propensity scores by group)", type: "check", value: true }, confField], (v) => {
        const P = psPrep(v, "Matching"), conf = confOf(v), fit = SW.logistic(P.X, P.t, P.names, conf), ps = fit.fitted;
        const m = SW.psMatch(ps, P.t, P.y, P.X, P.names, { caliper: Number.isFinite(v.cal) && v.cal > 0 ? v.cal : null });
        let html = P.notes + psTable(fit, v.t);
        html += table(["Treated rows", "Matched", "Unmatched", "Untreated rows", "Distinct untreated rows used", "Largest score distance in a pair"], [[m.nTreated, m.nMatched, m.unmatched.length, m.nControls, m.controlsUsed, m.maxDist]], `Matches${m.caliper != null ? ` (caliper ${fmt(m.caliper, 4)} on the score)` : ""}`);
        if (m.nMatched < 2) throw new Error("Fewer than two treated rows found a match. Widen or remove the caliper.");
        const ts = SW.qt(1 - (1 - conf) / 2, m.df), tstat = m.att / m.se, p = 2 * (1 - SW.pt(Math.abs(tstat), m.df));
        html += table(["Estimate", "Effect on " + v.y, "SE (paired, rough)", "t", "p", `${pct(conf)} interval lower`, "upper"], [["Average effect on the treated (matched)", m.att, m.se, tstat, SW.fmtP(p), m.att - ts * m.se, m.att + ts * m.se]], "Effect on the treated: mean of (treated outcome minus matched untreated outcome)");
        html += balanceTable(m.balance, "matched", ["am1", "am0"]) + say(smdNote);
        html += formula(`for each treated row, the untreated row with the closest propensity score (an untreated row may be reused). ATT = mean over matched pairs of (${v.y} treated minus ${v.y} matched untreated).`) + say(`The SE treats the matched differences as independent and ignores that the scores were estimated and that some untreated rows are reused, so it is a rough guide, not a precise one (the bootstrap is not valid for matching either). ${m.unmatched.length ? `${m.unmatched.length} treated row${m.unmatched.length === 1 ? " was" : "s were"} left unmatched by the caliper, so the estimate is for the treated rows that found a match.` : ""}`);
        const bal = m.balance.every((b) => Number.isFinite(b.smd1) && Math.abs(b.smd1) < 0.1);
        html += say(`Among the treated, ${v.t} is associated with a ${v.y} that is ${fmt(m.att)} ${m.att >= 0 ? "higher" : "lower"} than in their matched untreated counterparts. ${bal ? "After matching every covariate is balanced (SMD under 0.1)." : "Some covariates are still imbalanced after matching; a caliper or more covariates may help."} A causal reading needs the covariates to include every common cause of ${v.t} and ${v.y}.`);
        const cd = card(`Matching: ${v.y} by ${v.t}`, src(`covariates: ${P.names.join(", ")}`), html);
        if (v.plot) overlapPlot(cd, ps, P.t, v.t);
        return cd;
      });
    }

    // ---------- 5. Instrumental variables ----------
    function ivUI() {
      needData();
      dialog("Causal: Instrumental variables (Wald ratio, two-stage least squares)", [selNum("y", "Outcome (numeric)"), selAny("t", "Treatment (a number, or a yes/no column)", false), lvField("tlv", "If the treatment is yes/no: the level that counts as 1", "t", "the treated level"), selAny("z", "Instrument (a yes/no column, or a number)", false), lvField("zlv", "If the instrument is yes/no: the level that counts as 1", "z", "the instrument level that counts as 1"), ...covFields(), confField], (v) => {
        if (v.t === v.y || v.z === v.y || v.z === v.t) throw new Error("The outcome, the treatment and the instrument must be three different columns.");
        const conf = confOf(v), yv = numeric(v.y), tv = isNum(v.t) && !is01(col(v.t)) ? numeric(v.t) : binary(v.t, v.tlv, "the treatment"), zv = isNum(v.z) && !is01(col(v.z)) ? numeric(v.z) : binary(v.z, v.zlv, "the instrument");
        const C = covariates(v), keep = C.any ? keepComplete(C.rows, yv.map((q) => (q === "" ? "" : String(q))), [tv, zv]) : keepAll(yv, tv, zv);
        const y = pick(yv, keep), t = pick(tv, keep), z = pick(zv, keep), W = C.any ? keep.map((i) => C.rows[i].map(Number)) : [];
        if (keep.length < 10) throw new Error(`Only ${keep.length} usable rows.`);
        const r = SW.iv(y, t, z, W, C.names, conf);
        let html = C.notes;
        if (r.wald) html += table(["", `Mean of ${v.y}`, `Mean of ${v.t}`, "n"], [[`instrument = 1`, r.wald.my1, r.wald.mt1, r.wald.n1], [`instrument = 0`, r.wald.my0, r.wald.mt0, r.wald.n0], ["difference", r.wald.dy, r.wald.dt, ""]], "Wald ratio: the two differences") + formula(`Wald ratio = (difference in ${v.y}) / (difference in ${v.t}) = ${fmt(r.wald.dy)} / ${fmt(r.wald.dt)} = ${fmt(r.wald.ratio)}`);
        html += table(["Stage", "Term", "Estimate", "SE", "t", "p"], [["first: " + v.t + " on the instrument" + (C.names.length ? " and covariates" : ""), "instrument", r.first.b[1], r.first.se[1], r.first.t[1], SW.fmtP(r.first.p[1])]], `First stage, F for the instrument = ${fmt(r.firstF, 2)}`) + cond(!r.weak, `First-stage F = ${fmt(r.firstF, 1)}, above 10: the instrument moves the treatment enough.`, `First-stage F = ${fmt(r.firstF, 1)}, below 10: a weak instrument. The 2SLS estimate is biased toward OLS and its interval is unreliable; look for a stronger instrument.`);
        html += table(["Term", "2SLS estimate", "SE", "t", "p", `${pct(conf)} interval lower`, "upper"], r.names.map((nm, i) => [nm === "treatment" ? v.t : nm, r.b[i], r.se[i], r.t[i], SW.fmtP(r.p[i]), r.lower[i], r.upper[i]]), `Two-stage least squares: ${v.y} on ${v.t}${C.names.length ? " and covariates" : ""}, instrumented by ${v.z}`);
        html += table(["Method", `Effect of ${v.t} on ${v.y}`, "SE"], [["Ordinary least squares (no instrument)", r.ols.b[1], r.ols.se[1]], ["Two-stage least squares", r.b[1], r.se[1]]], "For comparison");
        html += formula(`stage 1: ${v.t} = a + b ${v.z}${C.names.length ? " + covariates" : ""}; stage 2: ${v.y} = c + d (fitted ${v.t})${C.names.length ? " + covariates" : ""}. d is the effect; its SE uses the residuals from the actual ${v.t}, as ivreg does.`);
        html += say(`The instrumental-variable estimate of the effect of ${v.t} on ${v.y} is ${fmt(r.b[1])} (${pct(conf)} interval ${fmt(r.lower[1])} to ${fmt(r.upper[1])}); ordinary regression gives ${fmt(r.ols.b[1])}. It is the effect among the rows whose ${v.t} the instrument moved (compliers), and it is causal only if ${v.z} is as good as random, affects ${v.y} only through ${v.t}, and the first stage is strong.`);
        card(`Instrumental variables: ${v.y} on ${v.t}, instrument ${v.z}`, src(C.names.length ? `covariates: ${C.names.join(", ")}` : ""), html);
      });
    }

    // ---------- 6. Difference in differences ----------
    function didUI() {
      needData();
      dialog("Causal: Difference in differences (two groups, before and after)", [selNum("y", "Outcome (numeric)"), selAny("g", "Group (treated and comparison)", false), lvField("glv", "Treated group level (exactly as in the data)", "g", "the treated group level", (raw) => !!raw.g), selAny("p", "Period (before and after)", false), lvField("plv", "After level (exactly as in the data)", "p", "the after level", (raw) => !!raw.p), { name: "plot", label: "Picture: the two groups over time with the parallel-trends counterfactual", type: "check", value: true }, confField], (v) => {
        const conf = confOf(v), yv = numeric(v.y), gv = binary(v.g, v.glv, "the group"), pv = binary(v.p, v.plv, "the period"), keep = keepAll(yv, gv, pv), y = pick(yv, keep), g = pick(gv, keep), p = pick(pv, keep);
        const r = SW.did(y, g, p, conf); if (Object.values(r.ns).some((n) => !n)) throw new Error("One of the four cells (group by period) has no rows.");
        const gl = String(v.glv).trim() || "treated", pl = String(v.plv).trim() || "after";
        let html = table(["Group", "Before", "After", "Change", "n before / after"], [[`${v.g} = ${gl} (treated)`, r.means.t0, r.means.t1, r.changeT, `${r.ns.t0} / ${r.ns.t1}`], ["comparison", r.means.c0, r.means.c1, r.changeC, `${r.ns.c0} / ${r.ns.c1}`], ["difference in the changes", "", "", r.did, ""]], `Means of ${v.y}`);
        html += table(["Estimate", "SE", "t", "df", "p", `${pct(conf)} interval lower`, "upper"], [[r.did, r.se, r.t, r.df, SW.fmtP(r.p), r.lower, r.upper]], `Difference in differences (the group x period term of ${v.y} ~ group + period + group x period)`);
        html += formula(`DiD = (treated after minus treated before) minus (comparison after minus comparison before) = (${fmt(r.means.t1)} minus ${fmt(r.means.t0)}) minus (${fmt(r.means.c1)} minus ${fmt(r.means.c0)}) = ${fmt(r.changeT)} minus ${fmt(r.changeC)} = ${fmt(r.did)}`);
        html += say(`The comparison group changed by ${fmt(r.changeC)}; the treated group by ${fmt(r.changeT)}. If the treated group would have followed the same trend without treatment (parallel trends), the effect is ${fmt(r.did)} (${pct(conf)} interval ${fmt(r.lower)} to ${fmt(r.upper)}; ${r.p <= 0.05 ? "clearly different from zero" : "not clearly different from zero"} at the 5 percent level). Parallel trends cannot be tested with two periods; more pre-treatment periods, or a reason why the groups move together, is what makes the assumption believable. The SE treats rows as independent; with repeated measures of the same units, cluster them (a mixed model) for a safer SE.`);
        const cd = card(`Difference in differences: ${v.y}`, src(`${v.g}, ${v.p}`), html);
        if (v.plot) plotDiv(cd, [{ x: ["before", "after"], y: [r.means.c0, r.means.c1], mode: "lines+markers", name: "comparison", line: { color: BLUE, width: 3 } }, { x: ["before", "after"], y: [r.means.t0, r.means.t1], mode: "lines+markers", name: `${v.g} = ${gl}`, line: { color: ORANGE, width: 3 } }, { x: ["before", "after"], y: [r.means.t0, r.counterfactual], mode: "lines+markers", name: "treated, if parallel trends", line: { color: ORANGE, width: 2, dash: "dash" } }], { title: `${v.y}: the treated group's gain beyond the comparison group's`, xaxis: { title: v.p, type: "category" }, yaxis: { title: `mean ${v.y}` }, showlegend: true }, 300);
        return cd;
      });
    }

    // ---------- 7. Sharp regression discontinuity ----------
    function rdUI() {
      needData();
      dialog("Causal: Regression discontinuity (sharp)", [selNum("y", "Outcome (numeric)"), selNum("x", "Running variable (the score the rule is applied to)"), { name: "c", label: "Cutoff", type: "number", value: "", check: (raw) => (raw.c === "" || raw.c == null ? "Type the cutoff, the value where the rule changes." : "") }, { name: "h", label: "Bandwidth: rows within this distance of the cutoff are used (blank = every row)", type: "number", value: "", hint: "A smaller bandwidth trusts the straight lines less far from the cutoff and uses fewer rows." }, sel("side", "Who is treated", [["above", "rows at or above the cutoff"], ["below", "rows below the cutoff"]], "above"), { name: "plot", label: "Picture: binned means and the two fitted lines", type: "check", value: true }, confField], (v) => {
        if (v.x === v.y) throw new Error("The outcome and the running variable must be two different columns.");
        const conf = confOf(v), yv = numeric(v.y), xv = numeric(v.x), keep = keepAll(yv, xv), y = pick(yv, keep), x = pick(xv, keep);
        if (!Number.isFinite(v.c)) throw fieldErr("c", "Type the cutoff."); const lo = Math.min(...x), hi = Math.max(...x); if (v.c <= lo || v.c >= hi) throw fieldErr("c", `The cutoff must lie inside the range of ${v.x} (${fmt(lo)} to ${fmt(hi)}).`);
        const h = Number.isFinite(v.h) && v.h > 0 ? v.h : null, r = SW.rdd(y, x, v.c, h, { above: v.side !== "below", conf });
        let html = table(["Side", "Rows used", `Fitted ${v.y} at the cutoff`, `Slope per unit of ${v.x}`], [["treated", r.nT, r.aT, r.slopeT], ["untreated", r.nC, r.aC, r.slopeC]], `Local linear fits${h ? ` within ${fmt(h)} of the cutoff ${fmt(v.c)}` : ` (every row; no bandwidth)`}`);
        html += table(["Jump at the cutoff", "SE", "t", "df", "p", `${pct(conf)} interval lower`, "upper"], [[r.jump, r.se, r.t, r.df, SW.fmtP(r.p), r.lower, r.upper]], "Effect at the cutoff");
        html += formula(`jump = (treated line at the cutoff) minus (untreated line at the cutoff) = ${fmt(r.aT)} minus ${fmt(r.aC)} = ${fmt(r.jump)}; SE = sqrt(SE_treated^2 + SE_untreated^2)`);
        html += (h ? "" : warn("No bandwidth: both lines use every row, so points far from the cutoff shape the fit. Try a bandwidth and see whether the jump holds.")) + say(`Right at ${v.x} = ${fmt(v.c)}, ${v.y} jumps by ${fmt(r.jump)} (${pct(conf)} interval ${fmt(r.lower)} to ${fmt(r.upper)}). That is the effect of the treatment for people near the cutoff, if nothing else changes at ${fmt(v.c)} and nobody could place themselves on the side they wanted. Check the picture: the jump should be visible, and the binned means away from the cutoff should run smoothly.`);
        const cd = card(`Regression discontinuity: ${v.y} at ${v.x} = ${fmt(v.c)}`, src(h ? `bandwidth ${fmt(h)}` : "no bandwidth"), html);
        if (v.plot) { const [xl, xr] = r.xRange, treatedRight = r.above, L = { x: [xl, v.c], y: [treatedRight ? r.aC + r.slopeC * (xl - v.c) : r.aT + r.slopeT * (xl - v.c), treatedRight ? r.aC : r.aT] }, R = { x: [v.c, xr], y: [treatedRight ? r.aT : r.aC, treatedRight ? r.aT + r.slopeT * (xr - v.c) : r.aC + r.slopeC * (xr - v.c)] }; plotDiv(cd, [{ x: r.bins.map((b) => b.x), y: r.bins.map((b) => b.y), mode: "markers", type: "scatter", name: "binned means", marker: { color: BLUE, size: 9 } }, { x: L.x, y: L.y, mode: "lines", name: treatedRight ? "untreated side" : "treated side", line: { color: treatedRight ? BLUE : ORANGE, width: 3 } }, { x: R.x, y: R.y, mode: "lines", name: treatedRight ? "treated side" : "untreated side", line: { color: treatedRight ? ORANGE : BLUE, width: 3 } }], { title: `${v.y} against ${v.x}: the jump at ${fmt(v.c)}`, xaxis: { title: v.x }, yaxis: { title: v.y }, showlegend: true, shapes: [{ type: "line", x0: v.c, x1: v.c, y0: 0, y1: 1, yref: "paper", line: { color: RED, width: 1.5, dash: "dash" } }] }, 320); }
        return cd;
      });
    }

    // ---------- 8. Bounds with no assumptions ----------
    function boundsUI() {
      needData();
      dialog("Causal: Bounds with no assumptions (Manski) for a yes/no outcome", [selAny("y", "Outcome (yes/no)", false), lvField("ylv", "Outcome level that counts as 1 (the event)", "y", "the outcome level that counts as 1"), selAny("t", "Treatment (two levels)", false), lvField("tlv", "Treated level (exactly as in the data)", "t", "the treated level")], (v) => {
        if (v.y === v.t) throw new Error("The outcome and the treatment must be two different columns.");
        const yv = binary(v.y, v.ylv, "the outcome"), tv = binary(v.t, v.tlv, "the treatment"), keep = keepAll(yv, tv), y = pick(yv, keep), t = pick(tv, keep); needBoth(t, "The bounds");
        const r = SW.manski(y, t), ev = String(v.ylv).trim() || "1";
        let html = table(["Quantity", "Value"], [["Share treated, P(T = 1)", r.p1], ["Share untreated, P(T = 0)", r.p0], [`Share with ${v.y} = ${ev} among the treated`, r.m1], [`Share with ${v.y} = ${ev} among the untreated`, r.m0], ["Naive difference", r.naive]], "What the data show");
        html += table(["Target", "Lower bound", "Upper bound", "Width"], [[`P(${v.y} = ${ev} if everyone were treated)`, r.y1.lower, r.y1.upper, r.y1.upper - r.y1.lower], [`P(${v.y} = ${ev} if nobody were treated)`, r.y0.lower, r.y0.upper, r.y0.upper - r.y0.lower], ["Average effect (difference)", r.ate.lower, r.ate.upper, r.ate.upper - r.ate.lower]], "Bounds that use no assumption about who got treated");
        html += formula(`P(Y = 1 if treated) is between P(T = 1) x P(Y = 1 | T = 1) + P(T = 0) x 0 and P(T = 1) x P(Y = 1 | T = 1) + P(T = 0) x 1: the untreated rows' outcome under treatment is unknown, so it is filled in with 0 and then with 1. The same for the untreated side. The effect is bounded by lower minus upper and upper minus lower; its width is always 1.`) + worked([`treated side: ${fmt(r.p1, 3)} x ${fmt(r.m1, 3)} = ${fmt(r.y1.lower, 3)} up to ${fmt(r.y1.lower, 3)} + ${fmt(r.p0, 3)} = ${fmt(r.y1.upper, 3)}`, `untreated side: ${fmt(r.p0, 3)} x ${fmt(r.m0, 3)} = ${fmt(r.y0.lower, 3)} up to ${fmt(r.y0.lower, 3)} + ${fmt(r.p1, 3)} = ${fmt(r.y0.upper, 3)}`, `effect: ${fmt(r.y1.lower, 3)} minus ${fmt(r.y0.upper, 3)} = ${fmt(r.ate.lower, 3)} up to ${fmt(r.y1.upper, 3)} minus ${fmt(r.y0.lower, 3)} = ${fmt(r.ate.upper, 3)}`]);
        html += say(`Without any assumption about why some rows were treated, the data alone only say the effect of ${v.t} on ${v.y} is between ${fmt(r.ate.lower, 3)} and ${fmt(r.ate.upper, 3)}: a range that always includes zero and is always 1 wide. The naive difference ${fmt(r.naive, 3)} sits inside it. Every narrower answer (standardization, weighting, matching, an instrument) buys its precision with an assumption; this card shows what the assumption is worth.`);
        card(`Bounds: ${v.y} by ${v.t}`, src(), html);
      });
    }

    const items = [["Draw a DAG: paths, d-separation, backdoor", dagUI], null, ["Adjust by groups (standardization)", standardizeUI], ["Propensity score and inverse probability weighting", ipwUI], ["Matching on the propensity score", matchUI], null, ["Instrumental variables (Wald ratio, 2SLS)", ivUI], ["Difference in differences (2 by 2)", didUI], ["Regression discontinuity (sharp)", rdUI], null, ["Bounds with no assumptions (Manski)", boundsUI]];
    // R lines for the Script tool (Results, Script), keyed the way app.js keys every step
    const rn = (s) => (/^[A-Za-z.][A-Za-z0-9._]*$/.test(String(s)) ? String(s) : "`" + String(s).replace(/`/g, "") + "`"), rs = (s) => JSON.stringify(String(s));
    const r01 = (v, k, lv) => `as.numeric(d$${rn(v[k])} == ${rs(v[lv])})`;
    const r = {
      "Causal | Draw a DAG: paths, d-separation, backdoor": (v) => { const P = SW.dagParse(v.edges || ""); const q = (s) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : JSON.stringify(s)); return [`g <- dagitty::dagitty("dag { ${(v.unobs || "").split(",").map((s) => s.trim()).filter(Boolean).map((u) => q(u) + " [latent]").join(" ")} ${P.edges.map(([a, b]) => `${q(a)} -> ${q(b)}`).join("; ")} }")`].concat(v.dx && v.dy ? [`dagitty::dseparated(g, ${rs(v.dx)}, ${rs(v.dy)}, c(${(v.cond || "").split(",").map((s) => s.trim()).filter(Boolean).map(rs).join(", ")}))`, `dagitty::paths(g, ${rs(v.dx)}, ${rs(v.dy)}, Z = c(${(v.cond || "").split(",").map((s) => s.trim()).filter(Boolean).map(rs).join(", ")}))`] : [], v.tr && v.out ? [`dagitty::adjustmentSets(g, exposure = ${rs(v.tr)}, outcome = ${rs(v.out)}, type = "all")`] : []); },
      "Causal | Adjust by groups (standardization)": (v) => [`d$treated <- ${r01(v, "t", "tlv")}`, `by_group <- dplyr::summarise(dplyr::group_by(d, ${(v.s || []).map(rn).join(", ")}), w = dplyr::n() / nrow(d), m1 = mean(${rn(v.y)}[treated == 1]), m0 = mean(${rn(v.y)}[treated == 0]))`, `with(by_group, sum(w * m1) - sum(w * m0))  # standardized difference`],
      "Causal | Propensity score and inverse probability weighting": (v) => [`d$treated <- ${r01(v, "t", "tlv")}`, `ps_model <- glm(treated ~ ${(v.xs || []).concat(v.cs || []).map(rn).join(" + ") || "1"}, data = d, family = binomial)`, `d$ps <- fitted(ps_model); d$w <- ifelse(d$treated == 1, 1 / d$ps, 1 / (1 - d$ps))`, `with(d, weighted.mean(${rn(v.y)}[treated == 1], w[treated == 1]) - weighted.mean(${rn(v.y)}[treated == 0], w[treated == 0]))  # IPW ATE`, `# balance: cobalt::bal.tab(ps_model, weights = d$w, method = "weighting")`],
      "Causal | Matching on the propensity score": (v) => [`d$treated <- ${r01(v, "t", "tlv")}`, `m <- MatchIt::matchit(treated ~ ${(v.xs || []).concat(v.cs || []).map(rn).join(" + ") || "1"}, data = d, method = "nearest", distance = "glm", replace = TRUE${Number.isFinite(v.cal) && v.cal > 0 ? `, caliper = ${v.cal}` : ""})`, `summary(m)  # balance; the effect on the treated: lm(${rn(v.y)} ~ treated, data = MatchIt::match.data(m), weights = weights)`],
      "Causal | Instrumental variables (Wald ratio, 2SLS)": (v) => [`fit <- AER::ivreg(${rn(v.y)} ~ ${rn(v.t)}${(v.xs || []).concat(v.cs || []).map((s) => " + " + rn(s)).join("")} | ${rn(v.z)}${(v.xs || []).concat(v.cs || []).map((s) => " + " + rn(s)).join("")}, data = d)`, `summary(fit, diagnostics = TRUE)  # the weak-instruments row is the first-stage F`],
      "Causal | Difference in differences (2 by 2)": (v) => [`d$treated <- ${r01(v, "g", "glv")}; d$after <- ${r01(v, "p", "plv")}`, `summary(lm(${rn(v.y)} ~ treated * after, data = d))  # the treated:after row is the DiD estimate`],
      "Causal | Regression discontinuity (sharp)": (v) => [`d$dist <- d$${rn(v.x)} - ${v.c}; d$treated <- as.numeric(d$dist ${v.side === "below" ? "<" : ">="} 0)`, `w <- ${Number.isFinite(v.h) && v.h > 0 ? `subset(d, abs(dist) <= ${v.h})` : "d"}`, `coef(lm(${rn(v.y)} ~ dist, data = subset(w, treated == 1)))[1] - coef(lm(${rn(v.y)} ~ dist, data = subset(w, treated == 0)))[1]  # the jump; rdrobust::rdrobust(w$${rn(v.y)}, w$${rn(v.x)}, c = ${v.c}) for a data-driven bandwidth`],
      "Causal | Bounds with no assumptions (Manski)": (v) => [`y <- ${r01(v, "y", "ylv")}; t <- ${r01(v, "t", "tlv")}; p1 <- mean(t)`, `c(lower = p1 * mean(y[t == 1]) - ((1 - p1) * mean(y[t == 0]) + p1), upper = p1 * mean(y[t == 1]) + (1 - p1) - (1 - p1) * mean(y[t == 0]))`],
    };
    return { items, r };
  }
  window.SWW_CAUSAL = { install };
})();
