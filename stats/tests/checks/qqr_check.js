const ROOT = require("path").resolve(__dirname, "../../..");
// Engine check: the QQ plotting positions and the QQ correlation r match R (ppoints, qqnorm, cor(qqnorm(x)$x, qqnorm(x)$y)).
// Reference values were computed by hand with the same plotting positions and the standard normal inverse CDF.
global.window = global; global.self = global;
const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat;
require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs");
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
// ppoints: a = 3/8 for n <= 10 (R: ppoints(7)[1] = 0.625/7.25 = 0.0862069), a = 1/2 above (ppoints(12)[1] = 0.5/12 = 0.0416667)
const p7 = S.ppoints(7), p12 = S.ppoints(12);
ok(near(p7[0], 0.0862069, 1e-6) && near(p7[6], 1 - 0.0862069, 1e-6) && near(p12[0], 0.0416667, 1e-6) && near(p12[11], 1 - 0.0416667, 1e-6), "ppoints: a = 3/8 up to n = 10, 1/2 above", { p7_1: p7[0], p12_1: p12[0] });
// qqnorm quantiles: n = 7 first theoretical quantile qnorm(0.0862069) = -1.364489; n = 12: qnorm(0.0416667) = -1.731664
const q7 = S.qq([2.1, 3.4, 1.9, 5.6, 4.2, 3.3, 2.8]), q12 = S.qq([12, 15, 9, 22, 14, 13, 11, 16, 10, 30, 14, 12]);
ok(near(q7[0].theo, -1.364489, 1e-5) && near(q7[6].theo, 1.364489, 1e-5) && q7[0].obs === 1.9 && near(q12[0].theo, -1.731664, 1e-5), "qqnorm quantiles match R for n = 7 and n = 12", { t7: q7[0].theo, t12: q12[0].theo });
// the QQ correlation: cor(qqnorm(x)$x, qqnorm(x)$y)
ok(near(S.qqr([2.1, 3.4, 1.9, 5.6, 4.2, 3.3, 2.8]), 0.969428, 1e-5), "r for c(2.1, 3.4, 1.9, 5.6, 4.2, 3.3, 2.8) is 0.969428", S.qqr([2.1, 3.4, 1.9, 5.6, 4.2, 3.3, 2.8]));
ok(near(S.qqr([12, 15, 9, 22, 14, 13, 11, 16, 10, 30, 14, 12]), 0.889282, 1e-5), "r for the n = 12 sample with an outlier (30) is 0.889282", S.qqr([12, 15, 9, 22, 14, 13, 11, 16, 10, 30, 14, 12]));
// the academy fitness push-ups: all 60 (0.991974), women (n = 15, 0.962001), men (n = 45, 0.991317)
const L = fs.readFileSync(ROOT + "/stats/data/popp_academy_fitness.csv", "utf8").trim().split(/\r?\n/).map((l) => l.split(",")); const h = L[0], rows = L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
const push = (f) => rows.filter(f).map((r) => Number(r.pushups_week12));
ok(near(S.qqr(push(() => true)), 0.991974, 1e-5) && near(S.qqr(push((r) => r.sex === "F")), 0.962001, 1e-5) && near(S.qqr(push((r) => r.sex === "M")), 0.991317, 1e-5), "push-ups week 12: r 0.991974 (all 60), 0.962001 (F, 15), 0.991317 (M, 45)", { all: S.qqr(push(() => true)), F: S.qqr(push((r) => r.sex === "F")), M: S.qqr(push((r) => r.sex === "M")) });
ok(Number.isNaN(S.qqr([1, 2])) && near(S.qqr([1, 2, 3]), 1, 1e-12), "fewer than 3 values: no r; three equally spaced values: r = 1", S.qqr([1, 2, 3]));
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
