const ROOT = require("path").resolve(__dirname, "../../..");
// Engine check: S.glmm against lme4's glmer on cbpp (gm1 in the lme4 documentation: Laplace, nAGQ = 1)
global.window = global; global.self = global; const js = require(ROOT + "/stats/vendor/jstat.min.js"); global.jStat = js.jStat || js; global.window.jStat = global.jStat; require(ROOT + "/stats/stats.js"); const S = global.SW; const fs = require("fs");
const rows = fs.readFileSync(ROOT + "/stats/data/cbpp.csv", "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
const near = (a, b, t) => Math.abs(a - b) <= t; let fails = 0; const ok = (c, m, x) => { console.log((c ? "PASS " : "FAIL ") + m + (x !== undefined ? "  [" + JSON.stringify(x) + "]" : "")); if (!c) fails++; };
const X = rows.map((r) => [1, r[1] === "2" ? 1 : 0, r[1] === "3" ? 1 : 0, r[1] === "4" ? 1 : 0]), y = rows.map((r) => +r[2]), tr = rows.map((r) => +r[3]), herd = rows.map((r) => r[0]);
console.log("rows", rows.length, "sum incidence", y.reduce((s, q) => s + q, 0), "sum size", tr.reduce((s, q) => s + q, 0));
const t0 = Date.now(); const m = S.glmm(y, X, herd, { family: "binomial", trials: tr }); console.log("fit ms", Date.now() - t0);
console.log("beta", m.beta.map((v) => +v.toFixed(4)), "se", m.se.map((v) => +v.toFixed(4)), "sd", +m.sd.toFixed(4), "var", +m.variance.toFixed(4), "dev", +m.dev.toFixed(2), "AIC", +m.aic.toFixed(1), "BIC", +m.bic.toFixed(1), "ll", +m.ll.toFixed(2));
ok(near(m.beta[0], -1.3983, 0.002) && near(m.beta[1], -0.9919, 0.002) && near(m.beta[2], -1.1282, 0.002) && near(m.beta[3], -1.5797, 0.002), "fixed effects match glmer (Laplace)");
ok([0.2312, 0.3032, 0.3228, 0.4220].every((s, i) => Math.abs(m.se[i] / s - 1) < 0.015), "standard errors within 1.5 percent of glmer");
ok(near(m.sd, 0.6421, 0.002) && near(m.variance, 0.4123, 0.002), "herd SD 0.6421, variance 0.4123");
ok(near(m.dev, 184.1, 0.1) && near(m.aic, 194.1, 0.1) && near(m.bic, 204.2, 0.1) && m.dfResid === 51, "deviance 184.1, AIC 194.1, BIC 204.2, 51 residual df");
// identity: theta at zero gives the GLM; the glm deviance for cbpp (period only) is 73.47 on 52 df... as -2 logLik with constants: compare with S.logistic? binomial trials; just sanity
ok(m.devGlm > m.dev && m.lrt > 0, "random intercept improves on the plain GLM", [m.devGlm, m.dev, m.lrt]);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED"); process.exit(fails ? 1 : 0);
