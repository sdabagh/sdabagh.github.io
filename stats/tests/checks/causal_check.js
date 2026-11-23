const ROOT = require("path").resolve(__dirname, "../../..");
// Engine checks for the Causal menu against tests/checks/data/causal_reference.json, written by causal_reference.py
// (statsmodels glm and OLS, numpy two-stage least squares, networkx d-separation; R itself is not installable here).
global.window = global; global.self = global;
const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat;
require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs"), path = require("path");
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol, allNear = (A, B, tol) => A.length === B.length && A.every((v, i) => near(v, B[i], tol));
const csv = (p) => { const L = fs.readFileSync(p, "utf8").trim().split(/\r?\n/).map((l) => l.split(",")); const h = L[0]; return L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "causal_reference.json"), "utf8")), D = (f) => csv(path.join(ROOT, "stats", "data", f));
// ---- DAGs: every d-separation query agrees with networkx; the valid backdoor sets are the same lists
let dsepN = 0, dsepBad = [];
Object.entries(ref.dag).forEach(([name, g]) => { const P = S.dagParse(g.lines.join("\n")); if (P.errors.length) dsepBad.push(name + ": " + P.errors[0]); (g.dsep || []).forEach((q) => { dsepN++; const r = S.dSep(P.nodes, P.edges, q.x, q.y, q.z); if (r.separated !== q.separated) dsepBad.push(`${name} ${q.x} vs ${q.y} given {${q.z}}: app ${r.separated}, networkx ${q.separated}`); }); });
ok(dsepN >= 15 && !dsepBad.length, `d-separation agrees with networkx on ${dsepN} queries over ${Object.keys(ref.dag).length} graphs`, dsepBad);
let bdN = 0, bdBad = [];
Object.entries(ref.dag).forEach(([name, g]) => { const P = S.dagParse(g.lines.join("\n")); (g.backdoor || []).forEach((q) => { bdN++; const r = S.backdoor(P.nodes, P.edges, q.t, q.y, q.unobserved); const got = r.sets.map((s) => s.Z.slice().sort().join("+")).sort(), want = q.valid.map((Z) => Z.slice().sort().join("+")).sort(); const gm = r.minimal.map((s) => s.Z.slice().sort().join("+")).sort(), wm = q.minimal.map((Z) => Z.slice().sort().join("+")).sort(); if (got.join("|") !== want.join("|") || gm.join("|") !== wm.join("|")) bdBad.push(`${name} ${q.t} -> ${q.y} unobserved {${q.unobserved}}: app ${JSON.stringify(got)} minimal ${JSON.stringify(gm)}, networkx ${JSON.stringify(want)} minimal ${JSON.stringify(wm)}`); }); });
ok(bdN >= 5 && !bdBad.length, `backdoor adjustment sets (all valid sets and the minimal ones) agree with the networkx brute force on ${bdN} graphs`, bdBad);
// the path listing says where and why: the M-bias graph given M opens the collider path
{ const P = S.dagParse(ref.dag.mbias.lines.join("\n")), r0 = S.dSep(P.nodes, P.edges, "X", "Y", []), r1 = S.dSep(P.nodes, P.edges, "X", "Y", ["M"]);
  const p0 = r0.paths.find((p) => p.text.includes("M")), p1 = r1.paths.find((p) => p.text.includes("M"));
  ok(r0.paths.length === 2 && !p0.open && p0.blockedAt === "M" && p0.info.find((i) => i.node === "M").type === "collider" && p1.open && r0.nOpen === 1 && r1.nOpen === 2, "M-bias: the path through M is blocked at the collider M until M is conditioned on, then it opens", { texts: r0.paths.map((p) => p.text), blockedAt: p0.blockedAt, openGivenM: p1.open }); }
{ const P = S.dagParse(ref.dag.mbias.lines.join("\n")), b = S.backdoor(P.nodes, P.edges, "X", "Y", ["U1", "U2"]);
  ok(b.emptyOK && b.minimal.length === 1 && !b.minimal[0].Z.length && !b.sets.some((s) => s.Z.includes("M")), "M-bias with U1 and U2 unobserved: the empty set is the valid adjustment set and M is never offered", b.sets.map((s) => s.Z)); }
{ const P = S.dagParse(ref.dag.front.lines.join("\n")), b = S.backdoor(P.nodes, P.edges, "T", "Y", ["U"]);
  ok(b.none && b.backdoorPaths.length === 1 && b.unobservedOnPaths.includes("U"), "front-door graph with U unobserved: no valid set from the measured variables, and U is named on the open backdoor path", { none: b.none, paths: b.backdoorPaths.map((p) => p.text) }); }
{ const P = S.dagParse("A -> B\nB -> C\nC -> A"); ok(P.errors.some((e) => /loop/.test(e)), "a cycle is reported as a loop", P.errors); const Q = S.dagParse("A -> A\nB -> "); ok(Q.errors.length === 2, "a self-arrow and a half-written line are reported", Q.errors); }
{ const P = S.dagParse(ref.dag.tutoring.lines.join("\n")), L = S.dagLayout(P.nodes, P.edges), ys = new Set(Object.values(L.xy).map((q) => q.y.toFixed(3))), xs = new Set(Object.values(L.xy).map((q) => q.x.toFixed(3)));
  ok(L.layers === 3 && xs.size === 3 && ys.size >= 2 && L.xy["Tutoring"].x > L.xy["Family income"].x && L.xy["Test score"].x > L.xy["Tutoring"].x, "layout: three layers left to right, nodes spread in two dimensions", L.xy);
  const C = S.dagParse(ref.dag.chain.lines.join("\n")), LC = S.dagLayout(C.nodes, C.edges); ok(new Set(Object.values(LC.xy).map((q) => q.y.toFixed(3))).size > 1, "a plain chain is not drawn on one flat line", LC.xy); }
// ---- standardization on the bike lanes
{ const rows = D("causal_bike_lanes.csv"), y = rows.map((r) => Number(r.crashes_per_year)), t = rows.map((r) => (r.bike_lane === "yes" ? 1 : 0)), s = rows.map((r) => r.street_type), r = S.standardize(y, t, s), R = ref.standardize;
  ok(near(r.crude.d, R.crude, 1e-9) && near(r.std.d, R.std, 1e-9) && near(r.std.m1, R.std_m1, 1e-9) && near(r.std.m0, R.std_m0, 1e-9) && r.rows.length === 2 && near(r.share, 1, 1e-12), "standardization by street type: crude and standardized differences match the hand computation", { crude: r.crude.d, std: r.std.d, ref: [R.crude, R.std] });
  ok(r.crude.d > 0 && r.std.d < 0, "the bike-lane example reverses sign once standardized (Simpson)", { crude: r.crude.d, std: r.std.d }); }
// ---- propensity scores, IPW and matching on the tutoring data
const tut = D("causal_tutoring.csv"), X = tut.map((r) => [Number(r.family_income), Number(r.prior_gpa)]), tt = tut.map((r) => (r.tutoring === "yes" ? 1 : 0)), yy = tut.map((r) => Number(r.test_score)), zz = tut.map((r) => (r.lottery_offer === "yes" ? 1 : 0));
{ const r = S.ipw(X, tt, yy, ["family_income", "prior_gpa"], { reps: 300, seed: 1 }), R = ref.ipw;
  ok(allNear(r.fit.b, R.coef, 1e-6) && allNear(r.fit.se, R.se, 1e-6) && allNear(r.ps.slice(0, 5), R.ps_first5, 1e-8), "propensity model: coefficients, SEs and fitted scores match statsmodels glm", { b: r.fit.b, ref: R.coef });
  ok(near(r.crude, R.crude, 1e-9) && near(r.point.ate, R.ate, 1e-8) && near(r.point.att, R.att, 1e-8), "IPW: crude difference, weighted ATE (Hajek) and ATT match", { ate: r.point.ate, att: r.point.att, ref: [R.ate, R.att] });
  ok(allNear(r.balance.map((b) => b.smd0), R.smd_before, 1e-8) && allNear(r.balance.map((b) => b.smd1), R.smd_after, 1e-8), "balance: standardized mean differences before and after weighting match", { before: r.balance.map((b) => b.smd0), after: r.balance.map((b) => b.smd1) });
  ok(r.boot.reps >= 250 && r.boot.ateLower < r.point.ate && r.point.ate < r.boot.ateUpper && r.boot.attLower < r.point.att && r.point.att < r.boot.attUpper, "bootstrap interval brackets the point estimate (300 resamples)", r.boot);
  const m = S.psMatch(r.ps, tt, yy, X, ["family_income", "prior_gpa"]), M = ref.match;
  ok(near(m.att, M.att, 1e-8) && near(m.se, M.se, 1e-8) && m.nMatched === M.nMatched && m.controlsUsed === M.controlsUsed && allNear(m.balance.map((b) => b.smd1), M.smd_after, 1e-8), "matching: ATT, paired SE, matches, controls used and balance after matching match the independent nearest-neighbour code", { att: m.att, used: m.controlsUsed, ref: [M.att, M.controlsUsed] });
  const mc = S.psMatch(r.ps, tt, yy, X, ["family_income", "prior_gpa"], { caliper: 0.05 }); ok(mc.caliper > 0 && mc.nMatched + mc.unmatched.length === m.nTreated && mc.pairs.every((p) => p.d <= mc.caliper), "a caliper drops the far matches and keeps the rest", { matched: mc.nMatched, dropped: mc.unmatched.length }); }
// ---- instrumental variables
{ const r0 = S.iv(yy, tt, zz, [], []), R = ref.iv;
  ok(near(r0.wald.ratio, R.wald.ratio, 1e-9) && near(r0.wald.dy, R.wald.dy, 1e-9) && near(r0.wald.dt, R.wald.dt, 1e-9) && near(r0.b[1], R.wald.ratio, 1e-8), "Wald ratio matches and equals the 2SLS slope with one 0/1 instrument", { wald: r0.wald.ratio, tsls: r0.b[1] });
  ok(allNear(r0.b, R.tsls0.b, 1e-7) && allNear(r0.se, R.tsls0.se, 1e-7) && near(r0.firstF, R.tsls0.firstF, 1e-6), "2SLS without covariates: coefficients, ivreg standard errors and first-stage F match", { b: r0.b, se: r0.se, F: r0.firstF });
  const W = X, r2 = S.iv(yy, tt, zz, W, ["family_income", "prior_gpa"]);
  ok(allNear(r2.b, R.tsls2.b, 1e-7) && allNear(r2.se, R.tsls2.se, 1e-7) && near(r2.firstF, R.tsls2.firstF, 1e-6) && allNear(r2.ols.b, R.ols2, 1e-7) && (r2.weak === (r2.firstF < 10)), "2SLS with two covariates: coefficients, SEs, first-stage F and the OLS comparison match", { b: r2.b, F: r2.firstF, weak: r2.weak }); }
// ---- difference in differences
{ const rows = D("causal_bus_routes.csv"), y = rows.map((r) => Number(r.riders_per_day)), g = rows.map((r) => (r.route_group === "new schedule" ? 1 : 0)), p = rows.map((r) => (r.period === "after" ? 1 : 0)), r = S.did(y, g, p), R = ref.did;
  ok(["c0", "c1", "t0", "t1"].every((k) => near(r.means[k], R.means[k], 1e-9)) && near(r.did, R.did, 1e-9) && near(r.fit.b[3], R.coef, 1e-8) && near(r.se, R.se, 1e-8) && near(r.t, R.t, 1e-6) && near(r.p, R.p, 1e-6), "DiD: the four means, the estimate and the interaction's SE, t and p match statsmodels OLS", { did: r.did, se: r.se, p: r.p }); }
// ---- sharp regression discontinuity
{ const rows = D("causal_scholarship_rd.csv"), x = rows.map((r) => Number(r.hs_gpa)), y = rows.map((r) => Number(r.credits_completed)), r = S.rdd(y, x, 3.0, 0.5), R = ref.rdd, ra = S.rdd(y, x, 3.0, null), RA = ref.rdd_all;
  ok(near(r.jump, R.jump, 1e-8) && near(r.se, R.se, 1e-8) && near(r.aT, R.aT, 1e-8) && near(r.aC, R.aC, 1e-8) && near(r.slopeT, R.slopeT, 1e-8) && near(r.slopeC, R.slopeC, 1e-8) && r.nT === R.nT && r.nC === R.nC, "RD with bandwidth 0.5: intercepts, slopes, jump and SE match the two OLS fits", { jump: r.jump, se: r.se, n: [r.nT, r.nC] });
  ok(near(ra.jump, RA.jump, 1e-8) && near(ra.se, RA.se, 1e-8) && ra.nT === RA.nT && ra.nC === RA.nC && r.bins.length >= 10, "RD over the whole range matches too; the picture has binned means", { jump: ra.jump, bins: r.bins.length }); }
// ---- Manski bounds
{ const pass = tut.map((r) => (r.passed === "yes" ? 1 : 0)), r = S.manski(pass, tt), R = ref.manski;
  ok(near(r.p1, R.p1, 1e-12) && allNear([r.y1.lower, r.y1.upper], R.y1, 1e-12) && allNear([r.y0.lower, r.y0.upper], R.y0, 1e-12) && allNear([r.ate.lower, r.ate.upper], R.ate, 1e-12) && near(r.ate.upper - r.ate.lower, 1, 1e-12) && near(r.naive, R.naive, 1e-12), "Manski bounds: both potential-outcome means and the effect bounds match; the effect bounds are 1 wide", { ate: r.ate, naive: r.naive }); }
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
