const ROOT = require("path").resolve(__dirname, "../../..");
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; require(ROOT + "/stats/stats.js"); const S = global.SW;
const near = (a, b, t) => Math.abs(a - b) <= t; let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
// 1. equal weights, no design: weighted mean = mean, SE = s/sqrt(n)
const x = [3, 5, 8, 10, 12, 20], w = x.map(() => 2.5); const r0 = S.svymean(x, w);
ok(near(r0.mean, S.mean(x), 1e-12) && near(r0.se, S.sd(x) / Math.sqrt(6), 1e-12) && near(r0.deff, 1, 1e-9) && near(r0.kish, 1, 1e-12), "equal weights reduce to the plain mean, s/sqrt(n), deff 1", [r0.mean, r0.se, r0.deff]);
// 2. stratified SRS with weights N_h / n_h: the linearized variance equals the textbook with-replacement stratified formula sum_h (N_h/N)^2 s_h^2 / n_h
const strata = ["a", "a", "a", "b", "b", "b", "b"], xs = [10, 12, 15, 30, 35, 31, 40], Nh = { a: 100, b: 300 }, nh = { a: 3, b: 4 }, ws = strata.map((h) => Nh[h] / nh[h]);
const r1 = S.svymean(xs, ws, { strata }); const N = 400, ybar = (100 * S.mean([10, 12, 15]) + 300 * S.mean([30, 35, 31, 40])) / N;
const vText = (100 / N) ** 2 * S.sd([10, 12, 15]) ** 2 / 3 + (300 / N) ** 2 * S.sd([30, 35, 31, 40]) ** 2 / 4;
ok(near(r1.mean, ybar, 1e-9) && near(r1.se * r1.se, vText, 1e-9), "stratified: mean and variance equal the textbook formula", [r1.mean, ybar, r1.se ** 2, vText]);
// 3. clusters: with one cluster per row it equals the row version; with clusters, the between-cluster formula
const xc = [1, 2, 3, 4, 5, 6], wc = [1, 1, 1, 1, 1, 1], cl = ["A", "A", "B", "B", "C", "C"]; const r2 = S.svymean(xc, wc, { cluster: cl });
const z = [(1 + 2 - 7) / 6, (3 + 4 - 7) / 6, (5 + 6 - 7) / 6], zb = z.reduce((s, q) => s + q, 0) / 3, vC = (3 / 2) * z.reduce((s, q) => s + (q - zb) ** 2, 0);
ok(near(r2.se * r2.se, vC, 1e-12) && r2.clusters === 3, "clustered: between-cluster variance with n_c/(n_c - 1)", [r2.se ** 2, vC]);
// 4. Kish: weights 1 and 3 alternating -> CV^2 = 0.25 -> 1.25
const r3 = S.svymean([1, 2, 3, 4], [1, 3, 1, 3]); ok(near(r3.kish, 1.25, 1e-12), "Kish design effect 1 + CV(w)^2", r3.kish);
// 5. single-cluster stratum flagged
const r4 = S.svymean([1, 2, 3], [1, 1, 1], { strata: ["a", "b", "b"] }); ok(r4.singleStrata.length === 1 && r4.singleStrata[0] === "a", "single-cluster stratum reported");
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
