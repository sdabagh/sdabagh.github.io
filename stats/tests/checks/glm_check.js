const ROOT = require("path").resolve(__dirname, "../../..");
// Engine check: Poisson with an offset against R's glm on MASS::ships (Venables & Ripley, Modern Applied Statistics with S, 4th ed., section 7.3)
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat; require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs");
const rows = fs.readFileSync(ROOT + "/stats/data/ships.csv", "utf8").trim().split("\n").slice(1).map((l) => l.split(",")).filter((r) => +r[3] > 0);
const near = (a, b, t) => Math.abs(a - b) <= t; let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
// R's dummies: type A, year 60, period 60 as references
const X = rows.map((r) => [r[0] === "B", r[0] === "C", r[0] === "D", r[0] === "E", r[1] === "65", r[1] === "70", r[1] === "75", r[2] === "75"].map(Number));
const y = rows.map((r) => +r[4]), off = rows.map((r) => Math.log(+r[3]));
const m = S.poisson(X, y, ["typeB", "typeC", "typeD", "typeE", "year65", "year70", "year75", "period75"], 0.95, { offset: off });
const Rb = [-6.40590, -0.54334, -0.68740, -0.07596, 0.32558, 0.69714, 0.81843, 0.45343, 0.38447], Rse = [0.21744, 0.17759, 0.32904, 0.29058, 0.23588, 0.14964, 0.16977, 0.23317, 0.11827];
ok(rows.length === 34 && m.n === 34, "34 ships with service > 0", m.n);
ok(Rb.every((b, i) => near(m.b[i], b, 0.0001)), "coefficients match glm(incidents ~ type + year + period + offset(log(service)), poisson) to 4 decimals", m.b.map((v) => +v.toFixed(5)));
ok(Rse.every((se, i) => near(m.se[i], se, 0.0001)), "standard errors match to 4 decimals", m.se.map((v) => +v.toFixed(5)));
ok(near(m.dev, 38.695, 0.001) && m.df === 25, "residual deviance 38.695 on 25 df", [m.dev, m.df]);
// null deviance 146.328 on 33 df (R prints it); 2*(ll - ll0) should equal null dev - resid dev
ok(near(m.chi, 146.328 - 38.695, 0.002), "model chi-square = null deviance 146.328 minus residual deviance", m.chi);
// negative binomial with the offset runs and is at least as good as Poisson in log-likelihood
const nb = S.negbin(X, y, ["typeB", "typeC", "typeD", "typeE", "year65", "year70", "year75", "period75"], 0.95, { offset: off });
ok(nb.ll >= m.ll - 0.01 && nb.offset, "negative binomial with offset: log-likelihood at least Poisson's", [m.ll, nb.ll, nb.theta]);
// no offset: unchanged behaviour (intercept-only equals log(mean))
const m0 = S.poisson(y.map(() => []), y, []); ok(near(m0.b[0], Math.log(S.mean(y)), 1e-9) && !m0.offset, "no offset: intercept-only model is log(mean y)");
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
