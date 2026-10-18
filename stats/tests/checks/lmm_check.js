const ROOT = require("path").resolve(__dirname, "../../..");
// Engine check: S.lmm against lme4 / lmerTest on sleepstudy (values from the R documentation and vignettes).
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat; require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs");
const rows = fs.readFileSync(ROOT + "/stats/data/sleepstudy.csv", "utf8").trim().split("\n").slice(1).map((l) => l.split(",")); const y = rows.map((r) => +r[2]), day = rows.map((r) => +r[1]), subj = rows.map((r) => r[0]);
const near = (a, b, t) => Math.abs(a - b) <= t; let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const X = day.map((d) => [1, d]); const A = S.lmm(y, X, subj, null);
ok(near(A.beta[0], 251.405, 0.001) && near(A.beta[1], 10.467, 0.001) && near(A.se[0], 9.747, 0.001) && near(A.se[1], 0.8042, 0.0005), "random intercept: fixed effects and SEs", [A.beta, A.se]);
ok(near(A.dfSat[0], 22.81, 0.02) && near(A.dfSat[1], 161.0, 0.05), "Satterthwaite df 22.81 and 161.0", A.dfSat);
ok(near(A.Sigma[0][0], 1378.18, 0.05) && near(A.sig2, 960.46, 0.05) && near(A.criterion, 1786.465, 0.01), "variances and REML criterion", [A.Sigma[0][0], A.sig2, A.criterion]);
const B = S.lmm(y, X, subj, day.map((d) => [1, d]));
ok(near(B.se[0], 6.8246, 0.001) && near(B.se[1], 1.5458, 0.001) && near(B.dfSat[0], 17.0, 0.02) && near(B.dfSat[1], 17.0, 0.02), "random slope: SEs and df 17.0", [B.se, B.dfSat]);
ok(near(B.Sigma[0][0], 612.10, 0.05) && near(B.Sigma[1][1], 35.07, 0.01) && near(B.corr[0][1], 0.0655, 0.002) && near(B.sig2, 654.94, 0.02) && near(B.criterion, 1743.628, 0.01), "random slope: variances, correlation, REML 1743.63", [B.corr[0][1], B.criterion]);
const C = S.lmm(y, X, subj, null, { reml: false }); ok(near(C.criterion, 1794.079, 0.01) && near(C.Sigma[0][0], 1296.87, 0.05), "ML: deviance 1794.08, variance 1296.87", [C.criterion, C.Sigma[0][0]]);
const Dm = S.lmm(y, X, subj, day.map((d) => [1, d]), { reml: false }); ok(near(Dm.criterion, 1751.939, 0.01) && near(Dm.Sigma[0][0], 565.51, 0.05) && near(Dm.Sigma[1][1], 32.68, 0.02), "ML random slope: deviance 1751.94, variances 565.5 and 32.68", [Dm.criterion, Dm.Sigma[0][0], Dm.Sigma[1][1]]);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
