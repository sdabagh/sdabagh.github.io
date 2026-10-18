const ROOT = require("path").resolve(__dirname, "../../..");
// Engine checks: MANOVA on iris against R, ANCOVA on the class data against NumPy, Friedman against a hand-worked table.
global.window = global; global.self = global;
const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat;
require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs");
let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const csv = (p) => { const L = fs.readFileSync(p, "utf8").trim().split(/\r?\n/).map((l) => l.split(",").map((s) => s.replace(/^"|"$/g, ""))); const h = L[0]; return L.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
// MANOVA on iris
const iris = csv(require("path").join(__dirname, "data", "iris.csv"));
const Y = iris.map((r) => ["sepal_length", "sepal_width", "petal_length", "petal_width"].map((c) => Number(r[c]))), g = iris.map((r) => r.species);
const m = S.manova(Y, g); const st = Object.fromEntries(m.stats.map((s) => [s.name, s]));
ok(near(m.eig[0], 32.19193, 0.0001) && near(m.eig[1], 0.28539, 0.0001), "iris eigenvalues 32.1919, 0.2854", m.eig.map((e) => +e.toFixed(5)));
ok(near(st["Pillai's trace"].value, 1.1919, 0.0001) && near(st["Pillai's trace"].F, 53.466, 0.01) && st["Pillai's trace"].df1 === 8 && st["Pillai's trace"].df2 === 290, "Pillai 1.1919, F 53.466 (8, 290)", st["Pillai's trace"]);
ok(near(st["Wilks' lambda"].value, 0.023439, 0.00001) && near(st["Wilks' lambda"].F, 199.15, 0.02) && st["Wilks' lambda"].df1 === 8 && near(st["Wilks' lambda"].df2, 288, 0.01), "Wilks 0.023439, F 199.15 (8, 288)", st["Wilks' lambda"]);
ok(near(st["Hotelling-Lawley trace"].value, 32.4773, 0.001) && near(st["Hotelling-Lawley trace"].F, 580.53, 0.05) && near(st["Hotelling-Lawley trace"].df2, 286, 0.01), "Hotelling-Lawley 32.4773, F 580.53 (8, 286)", st["Hotelling-Lawley trace"]);
ok(near(st["Roy's largest root"].value, 32.1919, 0.001) && near(st["Roy's largest root"].F, 1166.96, 0.1) && st["Roy's largest root"].df1 === 4 && st["Roy's largest root"].df2 === 145, "Roy 32.1919, F 1166.96 (4, 145)", st["Roy's largest root"]);
ok(m.uni.length === 4 && m.uni.every((u) => u.p < 1e-10), "follow-up ANOVAs on each outcome");
// ANCOVA on the class data
const cd = csv(ROOT + "/stats/data/STATC1000_Class_Data.csv");
const y = cd.map((r) => Number(r.GPA)), grp = cd.map((r) => r.Year), X = cd.map((r) => [Number(r.Hours_Study)]);
const a = S.ancova(y, grp, X, ["Hours_Study"]); const rowY = a.rows.find((r) => r.source === "group"), rowH = a.rows.find((r) => r.source === "Hours_Study");
ok(near(rowY.F, 1.6777, 0.001) && rowY.df === 3 && a.df === 35 && near(rowH.F, 2.5529, 0.001) && near(rowY.ss, 0.4508, 0.001) && near(rowH.ss, 0.2286, 0.001), "ANCOVA Type II F: Year 1.6777 (3, 35), Hours_Study 2.5529", { FY: rowY.F, FH: rowH.F, df: a.df });
const adj = Object.fromEntries(a.adj.map((q) => [q.level, q.est]));
ok(near(adj.Freshman, 3.409, 0.001) && near(adj.Junior, 3.5929, 0.001) && near(adj.Senior, 3.755, 0.001) && near(adj.Sophomore, 3.488, 0.001) && near(a.b[1], -0.01427, 0.0001), "adjusted means and common slope match NumPy", adj);
ok(near(a.slopes.F, 0.0801, 0.001) && a.slopes.df1 === 3 && a.slopes.df2 === 32, "homogeneity of slopes F 0.0801 (3, 32)", a.slopes);
ok(a.pairs.length === 6 && a.pairs.every((p) => p.pHolm >= p.p && p.pHolm <= 1) && a.adj.every((q) => q.se > 0), "six Holm-adjusted pairs, SEs positive");
// the difference between two adjusted means equals the difference of the group effects: check one pair against the coefficients
const pr = a.pairs.find((p) => (p.a === "Freshman" && p.b === "Sophomore") || (p.a === "Sophomore" && p.b === "Freshman"));
ok(near(Math.abs(pr.diff), Math.abs(adj.Freshman - adj.Sophomore), 1e-9), "pairwise difference equals the difference of adjusted means");
// Friedman: hand table, then a tied table against the formula
const f = S.friedman([[1, 2, 3], [1, 2, 3], [1, 3, 2], [2, 1, 3]]);
ok(near(f.Fr, 4.5, 1e-9) && f.df === 2 && near(f.p, 0.10540, 0.0001) && near(f.W, 0.5625, 1e-9) && f.rankTotals.join() === "5,8,11", "Friedman hand table: 4.5 on 2 df, p .1054, W .5625", f);
const ft = S.friedman([[1, 1, 3], [2, 2, 2], [1, 3, 2], [2, 1, 3], [5, 5, 6]]);
ok(Number.isFinite(ft.Fr) && ft.Fr > 0 && ft.pairs.length === 3, "Friedman with ties runs with the tie correction", { Fr: +ft.Fr.toFixed(4), p: +ft.p.toFixed(4) });
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
