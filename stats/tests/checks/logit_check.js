const ROOT = require("path").resolve(__dirname, "../../..");
// Engine check: ROC/AUC, classification, Hosmer-Lemeshow and pseudo R2 on a hand-made case and on the class data
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; require(ROOT + "/stats/stats.js"); const S = global.SW;
const near = (a, b, t) => Math.abs(a - b) <= t; let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
// hand case: p = .1 .4 .35 .8 ; y = 0 0 1 1 -> pairs: (.35>.1),(.35<.4),(.8>.1),(.8>.4) => AUC 3/4
const p = [0.1, 0.4, 0.35, 0.8], y = [0, 0, 1, 1], r = S.roc(p, y);
ok(near(r.auc, 0.75, 1e-12), "AUC 0.75 by hand", r.auc);
ok(r.points[0].fpr === 0 && r.points[0].tpr === 0 && r.points[r.points.length - 1].fpr === 1 && r.points[r.points.length - 1].tpr === 1, "ROC runs from (0,0) to (1,1)");
const c = S.classify(p, y, 0.5); ok(c.tp === 1 && c.fp === 0 && c.fn === 1 && c.tn === 2 && near(c.sens, 0.5, 1e-12) && near(c.spec, 1, 1e-12), "classification at 0.5", c);
// ties count half: p equal for a 1 and a 0 -> AUC 0.5
ok(near(S.roc([0.5, 0.5], [1, 0]).auc, 0.5, 1e-12), "tie counts half");
// Hosmer-Lemeshow on a perfectly calibrated large set: chi-square small; groups = 10, df 8
const n = 2000, pp = [], yy = []; let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (let i = 0; i < n; i++) { const q = rnd(); pp.push(q); yy.push(rnd() < q ? 1 : 0); }
const h = S.hoslem(pp, yy, 10); ok(h.g === 10 && h.df === 8 && h.rows.reduce((s, q) => s + q.n, 0) === n && h.rows.every((q) => q.n >= 190 && q.n <= 210), "10 decile groups of about 200, df 8", [h.g, h.df, h.rows.map((q) => q.n)]);
ok(h.p > 0.001, "a calibrated model is not rejected", [h.chi, h.p]);
ok(near(h.rows.reduce((s, q) => s + q.o1, 0), yy.reduce((s, q) => s + q, 0), 0) && near(h.rows.reduce((s, q) => s + q.e1, 0), pp.reduce((s, q) => s + q, 0), 1e-9), "observed and expected totals add up");
// pseudo R2: Nagelkerke = CoxSnell / (1 - exp(2 ll0 / n)); McFadden as before
const r2 = S.pseudoR2(-100, -130, 300, pp.slice(0, 300), yy.slice(0, 300));
ok(near(r2.coxsnell, 1 - Math.exp(2 * (-130 + 100) / 300), 1e-12) && near(r2.nagelkerke, r2.coxsnell / (1 - Math.exp(2 * -130 / 300)), 1e-12) && near(r2.mcfadden, 1 - 100 / 130, 1e-12), "pseudo R2 formulas", r2);
// deviance residuals: sum of squares equals the residual deviance
const fs = require("fs"); const CSV = fs.readFileSync(ROOT + "/stats/data/STATC1000_Class_Data.csv", "utf8").trim().split("\n").map((l) => l.split(",")); const C = CSV[0], R = CSV.slice(1);
const X = R.map((q) => [+q[C.indexOf("Hours_Study")], +q[C.indexOf("Hours_Sleep")]]), Y = R.map((q) => (q[C.indexOf("Pet_Owner")] === "Yes" ? 1 : 0)); const m = S.logistic(X, Y, ["hs", "sl"]);
const dr = S.devResid(m.fitted, Y); ok(near(dr.reduce((s, q) => s + q * q, 0), -2 * m.ll, 1e-6), "deviance residuals squared add to the deviance", [dr.reduce((s, q) => s + q * q, 0), -2 * m.ll]);
const rc = S.roc(m.fitted, Y); ok(rc.auc > 0.4 && rc.auc < 1 && rc.se > 0 && rc.youden.j >= 0, "class data: AUC, SE and Youden sensible", [rc.auc, rc.se, rc.youden]);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
