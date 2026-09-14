/* Stats Without Walls: statistics engine.
   Conventions (Dabagh): means use t with df (sigma is never given); p-value approach only;
   no inference about a variance. All functions return plain objects; app.js renders them. */
(function (global) {
  const J = global.jStat;
  const S = {};

  // ---------- helpers ----------
  S.num = (a) => a.filter((v) => v !== "" && v != null && !(typeof v === "string" && v.trim() === "")).map(Number).filter((x) => Number.isFinite(x));
  S.mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  S.sd = (a) => { const m = S.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  S.sdPop = (a) => { const m = S.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
  S.median = (a) => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
  S.quantile = (a, p) => { // type 7, same as R and jamovi
    const b = [...a].sort((x, y) => x - y), n = b.length, h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h);
    return b[lo] + (h - lo) * (b[hi] - b[lo]);
  };
  S.modes = (a) => { // every value that ties for most frequent, sorted; [] when every value appears once
    const c = {}; a.forEach((x) => { if (x !== "" && x != null) c[x] = (c[x] || 0) + 1; });
    const best = Math.max(0, ...Object.values(c)); if (best <= 1) return { modes: [], count: best };
    const m = Object.keys(c).filter((k) => c[k] === best).map((k) => (isNaN(k) ? k : Number(k))).sort((p, q) => (typeof p === "number" && typeof q === "number" ? p - q : String(p).localeCompare(String(q))));
    return { modes: m, count: best };
  };
  S.mode = (a) => { const r = S.modes(a); return r.modes.length === 0 ? "none (no repeats)" : r.modes.length === 1 ? r.modes[0] : r.modes.join(" and ") + " (tie, " + r.count + " each)"; };
  S.round = (x, d = 4) => (Number.isFinite(x) ? Number(x.toFixed(d)) : x);
  S.fmtP = (p) => (p < 0.0001 ? "< 0.0001" : p.toFixed(4));
  S.counts = (a) => { const c = {}; a.forEach((x) => { if (x !== "" && x != null) c[x] = (c[x] || 0) + 1; }); return c; };

  // ---------- distributions ----------
  S.pt = (t, df) => J.studentt.cdf(t, df);
  S.qt = (p, df) => J.studentt.inv(p, df);
  S.pnorm = (z) => J.normal.cdf(z, 0, 1);
  S.qnorm = (p) => J.normal.inv(p, 0, 1);
  S.pchisq = (x, df) => J.chisquare.cdf(x, df);
  S.pf = (f, d1, d2) => J.centralF.cdf(f, d1, d2);
  S.dbinom = (k, n, p) => J.binomial.pdf(k, n, p);
  S.pbinom = (k, n, p) => J.binomial.cdf(k, n, p);
  S.ptukey = (q, k, df) => J.tukey.cdf(q, k, df);
  S.pvalue = (stat, alt, cdf) => {
    if (alt === "less") return cdf(stat);
    if (alt === "greater") return 1 - cdf(stat);
    return 2 * Math.min(cdf(stat), 1 - cdf(stat));
  };

  // ---------- descriptives ----------
  S.quantileHalves = (a, p) => { // textbook method: median of the lower half and of the upper half (median excluded when n is odd)
    const b = [...a].sort((x, y) => x - y), n = b.length, h = Math.floor(n / 2);
    return p === 0.25 ? S.median(b.slice(0, h)) : S.median(b.slice(n - h));
  };
  S.skewness = (a) => { const n = a.length, m = S.mean(a), s = S.sd(a); if (n < 3 || s === 0) return { skew: NaN, se: NaN }; const g = (n / ((n - 1) * (n - 2))) * a.reduce((t, x) => t + ((x - m) / s) ** 3, 0); return { skew: g, se: Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3))) }; };
  S.describe = (a, qmethod = "halves") => { // default: textbook rule, median excluded from the halves
    const x = S.num(a); if (x.length < 2) return null;
    const qf = qmethod === "halves" ? S.quantileHalves : S.quantile;
    const q1 = qf(x, 0.25), q3 = qf(x, 0.75), sk = S.skewness(x);
    return { n: x.length, mean: S.mean(x), median: S.median(x), mode: S.mode(x), sd: S.sd(x), variance: S.sd(x) ** 2, sdPop: S.sdPop(x), variancePop: S.sdPop(x) ** 2, skew: sk.skew, skewSE: sk.se, missing: a.length - x.length,
      se: S.sd(x) / Math.sqrt(x.length), min: Math.min(...x), q1, q3, max: Math.max(...x), iqr: q3 - q1, range: Math.max(...x) - Math.min(...x),
      lowerFence: q1 - 1.5 * (q3 - q1), upperFence: q3 + 1.5 * (q3 - q1) };
  };
  S.zscores = (a) => { const x = S.num(a), m = S.mean(x), s = S.sd(x); return a.map((v) => (Number.isFinite(Number(v)) && v !== "" ? (Number(v) - m) / s : "")); };

  // ---------- one mean (t) ----------
  S.oneMean = ({ xbar, s, n, mu0 = 0, alt = "two", conf = 0.95 }) => {
    const df = n - 1, se = s / Math.sqrt(n), t = (xbar - mu0) / se, p = S.pvalue(t, alt, (v) => S.pt(v, df));
    const tstar = S.qt(1 - (1 - conf) / 2, df), me = tstar * se;
    return { xbar, s, n, df, se, t, p, tstar, me, lower: xbar - me, upper: xbar + me, mu0, alt, conf, d: (xbar - mu0) / s };
  };
  // ---------- one proportion (z, plus exact binomial) ----------
  S.oneProp = ({ x, n, p0 = 0.5, alt = "two", conf = 0.95 }) => {
    const phat = x / n, se0 = Math.sqrt((p0 * (1 - p0)) / n), z = (phat - p0) / se0, p = S.pvalue(z, alt, S.pnorm);
    const zstar = S.qnorm(1 - (1 - conf) / 2), se = Math.sqrt((phat * (1 - phat)) / n), me = zstar * se;
    const upper = (k) => { let s = 0; for (let i = k; i <= n; i++) s += S.dbinom(i, n, p0); return Math.min(1, s); };
    const lower = (k) => { let s = 0; for (let i = 0; i <= k; i++) s += S.dbinom(i, n, p0); return Math.min(1, s); };
    let exact; if (alt === "less") exact = lower(x); else if (alt === "greater") exact = upper(x);
    else { exact = Math.min(1, 2 * Math.min(lower(x), upper(x))); }
    return { x, n, phat, p0, se0, z, p, exact, zstar, se, me, lower: phat - me, upper: phat + me, alt, conf,
      condTest: n * p0 >= 10 && n * (1 - p0) >= 10, condCI: x >= 10 && n - x >= 10 };
  };
  // ---------- two means (Welch) ----------
  S.twoMeans = ({ m1, s1, n1, m2, s2, n2, alt = "two", conf = 0.95 }) => {
    const v1 = (s1 * s1) / n1, v2 = (s2 * s2) / n2, se = Math.sqrt(v1 + v2);
    const df = (v1 + v2) ** 2 / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1));
    const t = (m1 - m2) / se, p = S.pvalue(t, alt, (v) => S.pt(v, df)), tstar = S.qt(1 - (1 - conf) / 2, df), me = tstar * se;
    const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
    return { m1, s1, n1, m2, s2, n2, diff: m1 - m2, se, df, t, p, tstar, me, lower: m1 - m2 - me, upper: m1 - m2 + me, alt, conf, d: (m1 - m2) / sp };
  };
  S.paired = (a, b, opts = {}) => {
    const d = []; for (let i = 0; i < a.length; i++) { const x = Number(a[i]), y = Number(b[i]); if (Number.isFinite(x) && Number.isFinite(y) && a[i] !== "" && b[i] !== "") d.push(x - y); }
    const r = S.oneMean({ xbar: S.mean(d), s: S.sd(d), n: d.length, mu0: 0, alt: opts.alt || "two", conf: opts.conf || 0.95 });
    r.differences = d; r.dbar = r.xbar; r.sd = r.s; return r;
  };
  // ---------- two proportions ----------
  S.twoProps = ({ x1, n1, x2, n2, alt = "two", conf = 0.95 }) => {
    const p1 = x1 / n1, p2 = x2 / n2, pp = (x1 + x2) / (n1 + n2), se0 = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
    const z = (p1 - p2) / se0, p = S.pvalue(z, alt, S.pnorm);
    const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2), zstar = S.qnorm(1 - (1 - conf) / 2), me = zstar * se;
    return { x1, n1, x2, n2, p1, p2, diff: p1 - p2, pooled: pp, se0, z, p, se, zstar, me, lower: p1 - p2 - me, upper: p1 - p2 + me, alt, conf,
      cond: x1 >= 10 && n1 - x1 >= 10 && x2 >= 10 && n2 - x2 >= 10 };
  };
  // ---------- one-way ANOVA + Tukey ----------
  S.anova = (groups) => { // groups: {name: [numbers]}
    const names = Object.keys(groups).filter((g) => S.num(groups[g]).length >= 2);
    const g = names.map((nm) => { const x = S.num(groups[nm]); return { name: nm, x, n: x.length, mean: S.mean(x), sd: S.sd(x) }; });
    const N = g.reduce((s, q) => s + q.n, 0), grand = g.reduce((s, q) => s + q.n * q.mean, 0) / N, k = g.length;
    const ssb = g.reduce((s, q) => s + q.n * (q.mean - grand) ** 2, 0), ssw = g.reduce((s, q) => s + (q.n - 1) * q.sd ** 2, 0);
    const df1 = k - 1, df2 = N - k, msb = ssb / df1, msw = ssw / df2, F = msb / msw, p = 1 - S.pf(F, df1, df2);
    const tukey = [];
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const a = g[i], b = g[j], se = Math.sqrt((msw / 2) * (1 / a.n + 1 / b.n)), q = Math.abs(a.mean - b.mean) / se;
      let pt; try { pt = 1 - S.ptukey(q, k, df2); } catch (e) { pt = NaN; }
      tukey.push({ a: a.name, b: b.name, diff: a.mean - b.mean, se: se * Math.SQRT2, q, p: pt });
    }
    const sds = g.map((q) => q.sd);
    return { groups: g, N, k, grand, ssb, ssw, sst: ssb + ssw, df1, df2, msb, msw, F, p, r2: ssb / (ssb + ssw), tukey,
      sdRatio: Math.max(...sds) / Math.min(...sds) };
  };
  // ---------- chi-square ----------
  S.gof = (observed, expectedProps) => { // observed: {cat: count}
    const cats = Object.keys(observed), n = cats.reduce((s, c) => s + observed[c], 0);
    const props = expectedProps || Object.fromEntries(cats.map((c) => [c, 1 / cats.length]));
    const tot = cats.reduce((s, c) => s + (props[c] || 0), 0);
    const rows = cats.map((c) => { const e = (n * (props[c] || 0)) / tot, o = observed[c]; return { cat: c, o, e, contrib: (o - e) ** 2 / e, resid: (o - e) / Math.sqrt(e) }; });
    const chi = rows.reduce((s, r) => s + r.contrib, 0), df = cats.length - 1;
    return { rows, n, chi, df, p: 1 - S.pchisq(chi, df), minE: Math.min(...rows.map((r) => r.e)) };
  };
  S.twoWay = (rowVals, colVals) => {
    const rows = [...new Set(rowVals.filter((v) => v !== ""))], cols = [...new Set(colVals.filter((v) => v !== ""))];
    const O = rows.map(() => cols.map(() => 0));
    for (let i = 0; i < rowVals.length; i++) { const r = rows.indexOf(rowVals[i]), c = cols.indexOf(colVals[i]); if (r >= 0 && c >= 0) O[r][c]++; }
    const rt = O.map((r) => r.reduce((s, x) => s + x, 0)), ct = cols.map((_, j) => O.reduce((s, r) => s + r[j], 0)), n = rt.reduce((s, x) => s + x, 0);
    const E = O.map((r, i) => r.map((_, j) => (rt[i] * ct[j]) / n));
    let chi = 0; O.forEach((r, i) => r.forEach((o, j) => (chi += (o - E[i][j]) ** 2 / E[i][j])));
    const df = (rows.length - 1) * (cols.length - 1);
    return { rows, cols, O, E, rt, ct, n, chi, df, p: df > 0 ? 1 - S.pchisq(chi, df) : NaN, minE: Math.min(...E.flat()) };
  };
  // ---------- correlation and regression ----------
  S.regress = (xa, ya, conf = 0.95) => {
    const x = [], y = []; for (let i = 0; i < xa.length; i++) { const a = Number(xa[i]), b = Number(ya[i]); if (xa[i] !== "" && ya[i] !== "" && Number.isFinite(a) && Number.isFinite(b)) { x.push(a); y.push(b); } }
    const n = x.length, mx = S.mean(x), my = S.mean(y), sx = S.sd(x), sy = S.sd(y);
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
    const b1 = sxy / sxx, b0 = my - b1 * mx, r = sxy / ((n - 1) * sx * sy);
    const fitted = x.map((v) => b0 + b1 * v), resid = y.map((v, i) => v - fitted[i]);
    const ssres = resid.reduce((s, e) => s + e * e, 0), sstot = y.reduce((s, v) => s + (v - my) ** 2, 0), df = n - 2;
    const se_res = Math.sqrt(ssres / df), seb1 = se_res / Math.sqrt(sxx), seb0 = se_res * Math.sqrt(1 / n + (mx * mx) / sxx);
    const t = b1 / seb1, p = 2 * (1 - S.pt(Math.abs(t), df)), tstar = S.qt(1 - (1 - conf) / 2, df);
    const tr = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
    return { x, y, n, mx, my, sx, sy, b0, b1, r, r2: 1 - ssres / sstot, fitted, resid, se_res, seb0, seb1, t, p, df, tstar,
      b1lower: b1 - tstar * seb1, b1upper: b1 + tstar * seb1, tr, pr: 2 * (1 - S.pt(Math.abs(tr), df)), conf,
      predict: (v) => b0 + b1 * v };
  };
  // ---------- calculators ----------
  S.binomTable = (n, p) => Array.from({ length: n + 1 }, (_, k) => ({ k, p: S.dbinom(k, n, p), cum: S.pbinom(k, n, p) }));
  S.sampleSizeMean = (me, s, conf = 0.95) => Math.ceil((S.qnorm(1 - (1 - conf) / 2) * s / me) ** 2);
  S.sampleSizeProp = (me, p = 0.5, conf = 0.95) => Math.ceil((S.qnorm(1 - (1 - conf) / 2) / me) ** 2 * p * (1 - p));

  global.SW = S;
})(window);
/* ---- additions: QQ, simulation, expression evaluation ---- */
(function (S) {
  S.qq = (a) => { const x = [...S.num(a)].sort((p, q) => p - q), n = x.length; return x.map((v, i) => ({ theo: S.qnorm((i + 0.5) / n), obs: v })); };
  S.qchisq = (p, df) => jStat.chisquare.inv(p, df);
  S.qf = (p, d1, d2) => jStat.centralF.inv(p, d1, d2);
  S.rnorm = (m, s) => jStat.normal.sample(m, s);
  S.rexp = (rate) => jStat.exponential.sample(rate);
  // draw `reps` samples of size n from pop (array) with replacement, return statistics
  S.simulate = (pop, n, reps, stat) => { const out = new Array(reps); for (let r = 0; r < reps; r++) { const s = new Array(n); for (let i = 0; i < n; i++) s[i] = pop[Math.floor(Math.random() * pop.length)]; out[r] = stat(s); } return out; };
  // formula over columns: identifiers are column names (non-word chars become _); mean(X), sd(X), median(X), min(X), max(X), sum(X), n(X) are precomputed
  S.compileFormula = (formula, cols, colGetter) => {
    const ident = (c) => c.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1");
    let f = formula;
    f = f.replace(/\b(mean|sd|median|min|max|sum|n)\(\s*([A-Za-z0-9_.\- ]+?)\s*\)/g, (m, fn, name) => {
      const c = cols.find((k) => k === name.trim() || ident(k) === name.trim()); if (!c) return m;
      const x = S.num(colGetter(c));
      const v = { mean: S.mean(x), sd: S.sd(x), median: S.median(x), min: Math.min(...x), max: Math.max(...x), sum: x.reduce((a, b) => a + b, 0), n: x.length }[fn];
      return "(" + v + ")";
    });
    const names = cols.map(ident);
    const body = "const {log, sqrt, abs, exp, round, floor, ceil, pow, min, max} = Math; const ln = Math.log; const log10 = Math.log10; return (" + f.replace(/\bAND\b/g, "&&").replace(/\bOR\b/g, "||").replace(/(?<![<>=!])=(?!=)/g, "==") + ");";
    const fn = new Function(...names, body);
    return (row) => fn(...row.map((v) => (v !== "" && Number.isFinite(Number(v)) ? Number(v) : v)));
  };
})(window.SW);
/* ---- additions: 2x2 measures, Fisher exact, rank-based methods ---- */
(function (S) {
  const lchoose = (n, k) => jStat.gammaln(n + 1) - jStat.gammaln(k + 1) - jStat.gammaln(n - k + 1);
  const dhyper = (x, m, n, k) => Math.exp(lchoose(m, x) + lchoose(n, k - x) - lchoose(m + n, k));
  S.fisher2x2 = (a, b, c, d) => { // table [[a,b],[c,d]]; two-sided p = sum of probabilities <= observed
    const m = a + b, n = c + d, k = a + c, lo = Math.max(0, k - n), hi = Math.min(k, m), pobs = dhyper(a, m, n, k);
    let p = 0; for (let x = lo; x <= hi; x++) { const px = dhyper(x, m, n, k); if (px <= pobs * (1 + 1e-7)) p += px; }
    return Math.min(1, p);
  };
  S.measures2x2 = (a, b, c, d, conf = 0.95) => { // rows = groups, col 1 = event
    const z = S.qnorm(1 - (1 - conf) / 2), p1 = a / (a + b), p2 = c / (c + d), rr = p1 / p2, or = (a * d) / (b * c);
    const seLogRR = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d)), seLogOR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
    return { p1, p2, rr, rrLower: Math.exp(Math.log(rr) - z * seLogRR), rrUpper: Math.exp(Math.log(rr) + z * seLogRR), or, orLower: Math.exp(Math.log(or) - z * seLogOR), orUpper: Math.exp(Math.log(or) + z * seLogOR) };
  };
  S.ranks = (x) => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j + 2) / 2; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; } return r; };
  S.spearman = (xa, ya) => { const x = [], y = []; for (let i = 0; i < xa.length; i++) { const a = Number(xa[i]), b = Number(ya[i]); if (xa[i] !== "" && ya[i] !== "" && Number.isFinite(a) && Number.isFinite(b)) { x.push(a); y.push(b); } } const r = S.regress(S.ranks(x), S.ranks(y)); return { rs: r.r, n: r.n, t: r.tr, p: r.pr }; };
  S.mannWhitney = (xa, ya, alt = "two") => {
    const x = S.num(xa), y = S.num(ya), n1 = x.length, n2 = y.length, all = x.concat(y), r = S.ranks(all);
    const R1 = r.slice(0, n1).reduce((s, v) => s + v, 0), U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1, N = n1 + n2;
    const counts = {}; all.forEach((v) => (counts[v] = (counts[v] || 0) + 1)); const tie = Object.values(counts).reduce((s, t) => s + (t ** 3 - t), 0);
    const mu = (n1 * n2) / 2, sd = Math.sqrt(((n1 * n2) / 12) * (N + 1 - tie / (N * (N - 1))));
    const z = (U1 - mu) / sd, p = S.pvalue(z, alt, S.pnorm);
    return { n1, n2, U: Math.min(U1, U2), U1, U2, z, p, med1: S.median(x), med2: S.median(y) };
  };
  S.wilcoxonSigned = (a, b, alt = "two") => { // paired: a minus b (b may be a constant array)
    const d = []; for (let i = 0; i < a.length; i++) { const x = Number(a[i]), y = Number(b[i]); if (a[i] !== "" && b[i] !== "" && Number.isFinite(x) && Number.isFinite(y) && x !== y) d.push(x - y); }
    const n = d.length, r = S.ranks(d.map(Math.abs)); let Wp = 0; d.forEach((v, i) => { if (v > 0) Wp += r[i]; });
    const counts = {}; d.map(Math.abs).forEach((v) => (counts[v] = (counts[v] || 0) + 1)); const tie = Object.values(counts).reduce((s, t) => s + (t ** 3 - t), 0);
    const mu = (n * (n + 1)) / 4, sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - tie / 48), z = (Wp - mu) / sd;
    return { n, Wplus: Wp, z, p: S.pvalue(z, alt, S.pnorm), medianDiff: S.median(d) };
  };
  S.signTest = (a, b, alt = "two") => { let pos = 0, neg = 0; for (let i = 0; i < a.length; i++) { const x = Number(a[i]), y = Number(b[i]); if (a[i] === "" || b[i] === "" || !Number.isFinite(x) || !Number.isFinite(y) || x === y) continue; if (x > y) pos++; else neg++; } const n = pos + neg; const r = S.oneProp({ x: pos, n, p0: 0.5, alt }); return { pos, neg, n, p: r.exact }; };
  S.kruskal = (groups) => { const names = Object.keys(groups), xs = names.map((g) => S.num(groups[g])), all = xs.flat(), r = S.ranks(all), N = all.length; let H = 0, k = 0; xs.forEach((x) => { const Ri = r.slice(k, k + x.length).reduce((s, v) => s + v, 0); k += x.length; H += (Ri * Ri) / x.length; }); H = (12 / (N * (N + 1))) * H - 3 * (N + 1); const counts = {}; all.forEach((v) => (counts[v] = (counts[v] || 0) + 1)); const tie = 1 - Object.values(counts).reduce((s, t) => s + (t ** 3 - t), 0) / (N ** 3 - N); H /= tie; const df = names.length - 1; return { H, df, p: 1 - S.pchisq(H, df), groups: names.map((g, i) => ({ name: g, n: xs[i].length, median: S.median(xs[i]) })) }; };
})(window.SW);
/* ---- Advanced: linear algebra, multiple regression, logistic regression, two-way ANOVA ---- */
(function (S) {
  const T = (M) => M[0].map((_, j) => M.map((r) => r[j]));
  const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const inv = (M) => { const n = M.length, A = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-12) throw new Error("A predictor is a perfect combination of the others (singular matrix). Remove one."); [A[c], A[p]] = [A[p], A[c]]; const d = A[c][c]; for (let j = 0; j < 2 * n; j++) A[c][j] /= d; for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; } } return A.map((r) => r.slice(n)); };
  S.ols = (X, y, names, conf = 0.95) => { // X: rows of predictors (no intercept column), y: numbers
    const n = y.length, Xd = X.map((r) => [1].concat(r)), p = Xd[0].length, Xt = T(Xd);
    const XtX = mul(Xt, Xd), XtXi = inv(XtX), b = mul(XtXi, mul(Xt, y.map((v) => [v]))).map((r) => r[0]);
    const fitted = Xd.map((r) => r.reduce((s, v, k) => s + v * b[k], 0)), resid = y.map((v, i) => v - fitted[i]);
    const ybar = S.mean(y), ssres = resid.reduce((s, e) => s + e * e, 0), sstot = y.reduce((s, v) => s + (v - ybar) ** 2, 0), df = n - p, mse = ssres / df;
    const se = XtXi.map((r, i) => Math.sqrt(mse * r[i])), t = b.map((v, i) => v / se[i]), pv = t.map((v) => 2 * (1 - S.pt(Math.abs(v), df))), tstar = S.qt(1 - (1 - conf) / 2, df);
    const r2 = 1 - ssres / sstot, adj = 1 - (1 - r2) * (n - 1) / df, F = ((sstot - ssres) / (p - 1)) / mse, pF = 1 - S.pf(F, p - 1, df);
    // VIF: regress each predictor on the others
    const vif = names.map((_, j) => { if (names.length < 2) return 1; const Xj = X.map((r) => r.filter((_, k) => k !== j)), yj = X.map((r) => r[j]); try { const m = S.ols(Xj, yj, names.filter((_, k) => k !== j)); return 1 / (1 - m.r2); } catch (e) { return NaN; } });
    // diagnostics: leverage h_ii, standardized residuals, Cook's distance
    const hat = Xd.map((r) => r.reduce((s, v, i) => s + v * r.reduce((s2, w, j) => s2 + w * XtXi[j][i], 0), 0));
    const rstd = resid.map((e, i) => e / Math.sqrt(mse * (1 - hat[i]))), cook = rstd.map((r, i) => (r * r * hat[i]) / (p * (1 - hat[i])));
    const aic = n * Math.log(ssres / n) + 2 * (p + 1) + n * (Math.log(2 * Math.PI) + 1), bic = n * Math.log(ssres / n) + (p + 1) * Math.log(n) + n * (Math.log(2 * Math.PI) + 1);
    return { names: ["Intercept"].concat(names), b, se, t, p: pv, lower: b.map((v, i) => v - tstar * se[i]), upper: b.map((v, i) => v + tstar * se[i]), fitted, resid, n, df, r2, adj, F, dfF: [p - 1, df], pF, se_res: Math.sqrt(mse), vif, conf, hat, rstd, cook, ssres, aic, bic, k: p };
  };
  S.nestedF = (reduced, full) => { const df1 = full.k - reduced.k, df2 = full.df, F = ((reduced.ssres - full.ssres) / df1) / (full.ssres / df2); return { F, df1, df2, p: 1 - S.pf(F, df1, df2) }; };
  S.backward = (X, y, names, alpha = 0.05) => { // teaching demo of backward elimination by p-value
    let keep = names.map((_, i) => i); const steps = [];
    while (keep.length) {
      const m = S.ols(X.map((r) => keep.map((i) => r[i])), y, keep.map((i) => names[i]));
      const ps = m.p.slice(1); const worst = ps.indexOf(Math.max(...ps));
      steps.push({ predictors: keep.map((i) => names[i]), adj: m.adj, aic: m.aic, worst: names[keep[worst]], worstP: ps[worst] });
      if (ps[worst] <= alpha) break; keep.splice(worst, 1);
    }
    return steps;
  };
  S.logistic = (X, y, names, conf = 0.95) => { // y in {0,1}; IRLS
    const n = y.length, Xd = X.map((r) => [1].concat(r)), p = Xd[0].length; let b = new Array(p).fill(0); let ll = 0, XtWXi;
    for (let it = 0; it < 50; it++) {
      const eta = Xd.map((r) => r.reduce((s, v, k) => s + v * b[k], 0)), mu = eta.map((e) => 1 / (1 + Math.exp(-e))), w = mu.map((m) => m * (1 - m));
      const z = eta.map((e, i) => e + (y[i] - mu[i]) / Math.max(w[i], 1e-10));
      const XtW = T(Xd).map((col) => col.map((v, i) => v * w[i])); XtWXi = inv(mul(XtW, Xd));
      const bn = mul(XtWXi, mul(XtW, z.map((v) => [v]))).map((r) => r[0]);
      const ll2 = y.reduce((s, yi, i) => s + (yi ? Math.log(Math.max(mu[i], 1e-12)) : Math.log(Math.max(1 - mu[i], 1e-12))), 0);
      const done = Math.max(...bn.map((v, k) => Math.abs(v - b[k]))) < 1e-8; b = bn; ll = ll2; if (done) break;
    }
    const se = XtWXi.map((r, i) => Math.sqrt(r[i])), z = b.map((v, i) => v / se[i]), pv = z.map((v) => 2 * (1 - S.pnorm(Math.abs(v)))), zstar = S.qnorm(1 - (1 - conf) / 2);
    const p1 = S.mean(y), ll0 = n * (p1 * Math.log(p1) + (1 - p1) * Math.log(1 - p1)), fitted = Xd.map((r) => 1 / (1 + Math.exp(-r.reduce((s, v, k) => s + v * b[k], 0))));
    const acc = S.mean(fitted.map((f, i) => ((f >= 0.5 ? 1 : 0) === y[i] ? 1 : 0)));
    return { names: ["Intercept"].concat(names), b, se, z, p: pv, or: b.map(Math.exp), orLower: b.map((v, i) => Math.exp(v - zstar * se[i])), orUpper: b.map((v, i) => Math.exp(v + zstar * se[i])), ll, ll0, chi: 2 * (ll - ll0), dfChi: p - 1, pChi: 1 - S.pchisq(2 * (ll - ll0), p - 1), mcfadden: 1 - ll / ll0, aic: -2 * ll + 2 * p, n, accuracy: acc, fitted, conf };
  };
  S.dummies = (vals, ref) => { // reference = the most frequent level unless given; a rare reference makes every coefficient unstable
    const c = S.counts(vals); let lv = Object.keys(c).sort(); const r = ref && lv.includes(ref) ? ref : lv.reduce((a, b) => (c[b] > c[a] ? b : a), lv[0]); lv = [r].concat(lv.filter((l) => l !== r));
    return { levels: lv, cols: lv.slice(1), rows: vals.map((v) => lv.slice(1).map((l) => (v === l ? 1 : 0))) }; };
  S.anova2 = (y, A, B, interaction = true) => { // type II sums of squares via model comparison
    const dA = S.dummies(A), dB = S.dummies(B);
    const inter = A.map((_, i) => dA.rows[i].flatMap((a) => dB.rows[i].map((b) => a * b)));
    const fit = (parts) => { const X = y.map((_, i) => parts.flatMap((p) => p[i])); const m = S.ols(X, y, X[0].map((_, j) => "x" + j)); return { ss: m.resid.reduce((s, e) => s + e * e, 0), df: m.df }; };
    const full = fit(interaction ? [dA.rows, dB.rows, inter] : [dA.rows, dB.rows]), AB = fit([dA.rows, dB.rows]), onlyA = fit([dA.rows]), onlyB = fit([dB.rows]);
    const mse = full.ss / full.df, rows = [];
    const add = (name, ssdiff, df) => rows.push({ source: name, ss: ssdiff, df, ms: ssdiff / df, F: (ssdiff / df) / mse, p: 1 - S.pf((ssdiff / df) / mse, df, full.df) });
    add("A", onlyB.ss - AB.ss, dA.cols.length); add("B", onlyA.ss - AB.ss, dB.cols.length);
    if (interaction) add("A x B", AB.ss - full.ss, dA.cols.length * dB.cols.length);
    rows.push({ source: "Residuals", ss: full.ss, df: full.df, ms: mse });
    const cells = {}; y.forEach((v, i) => { const k = A[i] + " | " + B[i]; (cells[k] = cells[k] || []).push(v); });
    return { rows, levelsA: dA.levels, levelsB: dB.levels, cells: Object.entries(cells).map(([k, v]) => ({ cell: k, n: v.length, mean: S.mean(v), sd: v.length > 1 ? S.sd(v) : NaN })) };
  };
})(window.SW);
/* ---- Advanced: repeated measures (one within factor, optional between factor), sphericity, mixed random-intercept model ---- */
(function (S) {
  const T = (M) => M[0].map((_, j) => M.map((r) => r[j]));
  const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const det = (M) => { const n = M.length, A = M.map((r) => r.slice()); let d = 1; for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-14) return 0; if (p !== c) { [A[c], A[p]] = [A[p], A[c]]; d = -d; } d *= A[c][c]; for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let j = c; j < n; j++) A[r][j] -= f * A[c][j]; } } return d; };
  const trace = (M) => M.reduce((s, r, i) => s + r[i], 0);
  // Y: n subjects x k conditions (numbers). group: optional array of n labels (between factor)
  S.rmAnova = (Y, group) => {
    const n = Y.length, k = Y[0].length, grand = S.mean(Y.flat());
    const subjMean = Y.map((r) => S.mean(r)), condMean = T(Y).map((c) => S.mean(c));
    const ssTot = Y.flat().reduce((s, v) => s + (v - grand) ** 2, 0), ssSubj = k * subjMean.reduce((s, m) => s + (m - grand) ** 2, 0), ssCond = n * condMean.reduce((s, m) => s + (m - grand) ** 2, 0);
    // sphericity: Mauchly's W on orthonormal contrasts of the within-subject covariance
    const Cm = T(Y).map((a) => T(Y).map((b) => { const ma = S.mean(a), mb = S.mean(b); return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / (n - 1); }));
    // Helmert-style orthonormal contrasts (k-1 x k)
    const C = []; for (let i = 1; i < k; i++) { const row = new Array(k).fill(0); for (let j = 0; j < i; j++) row[j] = 1 / i; row[i] = -1; const nrm = Math.sqrt(row.reduce((s, v) => s + v * v, 0)); C.push(row.map((v) => v / nrm)); }
    const Sc = mul(mul(C, Cm), T(C)), m = k - 1, W = det(Sc) / Math.pow(trace(Sc) / m, m);
    const eig = trace(Sc), eig2 = trace(mul(Sc, Sc)), gg = (eig * eig) / (m * eig2); // Greenhouse-Geisser epsilon
    const d = n - (group ? [...new Set(group)].length : 1); const chi = -(d - (2 * m * m + m + 2) / (6 * m)) * Math.log(Math.max(W, 1e-300)), dfW = (m * (m + 1)) / 2 - 1, pW = m > 1 ? 1 - S.pchisq(chi, dfW) : 1;
    const hf = Math.min(1, (n * m * gg - 2) / (m * (n - 1 - m * gg))), out = { n, k, ssTot, ssSubj, ssCond, condMean, W, pW, gg, hf, rows: [] };
    if (!group) {
      const ssErr = ssTot - ssSubj - ssCond, df1 = m, df2 = m * (n - 1), F = (ssCond / df1) / (ssErr / df2);
      out.rows = [{ source: "Condition (within)", ss: ssCond, df: df1, ms: ssCond / df1, F, p: 1 - S.pf(F, df1, df2), pGG: 1 - S.pf(F, df1 * gg, df2 * gg), pHF: 1 - S.pf(F, df1 * hf, df2 * hf) }, { source: "Error (within)", ss: ssErr, df: df2, ms: ssErr / df2 }, { source: "Subjects", ss: ssSubj, df: n - 1, ms: ssSubj / (n - 1) }];
    } else {
      const g = [...new Set(group)], a = g.length, ng = g.map((l) => group.filter((x) => x === l).length);
      const gMean = g.map((l) => S.mean(Y.filter((_, i) => group[i] === l).flat()));
      const ssB = g.reduce((s, l, j) => s + ng[j] * k * (gMean[j] - grand) ** 2, 0), ssSubjW = ssSubj - ssB;
      const cellMean = g.map((l) => T(Y.filter((_, i) => group[i] === l)).map((c) => S.mean(c)));
      const ssInt = g.reduce((s, l, j) => s + ng[j] * cellMean[j].reduce((s2, cm, c) => s2 + (cm - gMean[j] - condMean[c] + grand) ** 2, 0), 0);
      const ssErr = ssTot - ssSubj - ssCond - ssInt, dfB = a - 1, dfSW = n - a, dfC = m, dfI = m * (a - 1), dfE = m * (n - a);
      const FB = (ssB / dfB) / (ssSubjW / dfSW), FC = (ssCond / dfC) / (ssErr / dfE), FI = (ssInt / dfI) / (ssErr / dfE);
      out.rows = [{ source: "Group (between)", ss: ssB, df: dfB, ms: ssB / dfB, F: FB, p: 1 - S.pf(FB, dfB, dfSW) }, { source: "Error (between subjects)", ss: ssSubjW, df: dfSW, ms: ssSubjW / dfSW },
        { source: "Condition (within)", ss: ssCond, df: dfC, ms: ssCond / dfC, F: FC, p: 1 - S.pf(FC, dfC, dfE), pGG: 1 - S.pf(FC, dfC * gg, dfE * gg), pHF: 1 - S.pf(FC, dfC * hf, dfE * hf) },
        { source: "Group x Condition", ss: ssInt, df: dfI, ms: ssInt / dfI, F: FI, p: 1 - S.pf(FI, dfI, dfE), pGG: 1 - S.pf(FI, dfI * gg, dfE * gg), pHF: 1 - S.pf(FI, dfI * hf, dfE * hf) }, { source: "Error (within)", ss: ssErr, df: dfE, ms: ssErr / dfE }];
      out.groups = g; out.cellMean = cellMean; out.ng = ng;
    }
    // pairwise paired t with Holm
    const pairs = []; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const r = S.paired(Y.map((row) => row[i]), Y.map((row) => row[j])); pairs.push({ a: i, b: j, diff: r.dbar, t: r.t, df: r.df, p: r.p }); }
    const order = pairs.map((q, i) => i).sort((x, y) => pairs[x].p - pairs[y].p); let prev = 0; order.forEach((idx, rank) => { const adj = Math.min(1, Math.max(prev, pairs[idx].p * (pairs.length - rank))); pairs[idx].pHolm = adj; prev = adj; });
    out.pairs = pairs;
    // variance components (compound symmetry): subject variance and residual variance
    const msSubj = (group ? out.rows[1].ms : ssSubj / (n - 1)), msErr = out.rows[out.rows.length - 1].ms;
    out.varSubject = Math.max(0, (msSubj - msErr) / k); out.varResid = msErr; out.icc = out.varSubject / (out.varSubject + out.varResid);
    return out;
  };
})(window.SW);
/* ---- Advanced: counts and categories. Poisson and negative binomial, multinomial and ordinal logistic, McNemar, Cochran-Armitage ---- */
(function (S) {
  const T = (M) => M[0].map((_, j) => M.map((r) => r[j]));
  const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const inv = (M) => { const n = M.length, A = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-12) throw new Error("Singular matrix: a predictor is redundant or a category is empty."); [A[c], A[p]] = [A[p], A[c]]; const d = A[c][c]; for (let j = 0; j < 2 * n; j++) A[c][j] /= d; for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; } } return A.map((r) => r.slice(n)); };
  const lgam = (x) => jStat.gammaln(x);
  // generic Newton maximizer with numeric gradient and Hessian (small dimension)
  const maximize = (f, x0, iters = 60) => {
    let x = x0.slice(); const h = 1e-4;
    const grad = (x) => x.map((_, i) => { const a = x.slice(), b = x.slice(); a[i] += h; b[i] -= h; return (f(a) - f(b)) / (2 * h); });
    const hess = (x) => { const g0 = grad(x); return x.map((_, i) => { const a = x.slice(); a[i] += h; const gi = grad(a); return gi.map((v, j) => (v - g0[j]) / h); }); };
    let fx = f(x);
    for (let it = 0; it < iters; it++) {
      const g = grad(x), H = hess(x); const Hs = H.map((r, i) => r.map((v, j) => (v + H[j][i]) / 2));
      let step; try { step = mul(inv(Hs), g.map((v) => [v])).map((r) => r[0]); } catch (e) { step = g.map((v) => -v * 1e-3); }
      let t = 1, xn, fn; for (let k = 0; k < 30; k++) { xn = x.map((v, i) => v - t * step[i]); fn = f(xn); if (Number.isFinite(fn) && fn >= fx - 1e-12) break; t /= 2; }
      if (!Number.isFinite(fn)) break; const done = Math.abs(fn - fx) < 1e-9 && Math.max(...step.map(Math.abs)) * t < 1e-7; x = xn; fx = fn; if (done) break;
    }
    let cov; try { const H = hess(x); cov = inv(H.map((r) => r.map((v) => -v))); } catch (e) { cov = x.map(() => x.map(() => NaN)); }
    return { x, ll: fx, se: cov.map((r, i) => Math.sqrt(Math.max(r[i], 0))) };
  };
  S.poisson = (X, y, names, conf = 0.95) => { // IRLS, log link
    const n = y.length, Xd = X.map((r) => [1].concat(r)), p = Xd[0].length; let b = new Array(p).fill(0); b[0] = Math.log(Math.max(S.mean(y), 1e-6)); let cov;
    for (let it = 0; it < 50; it++) { const eta = Xd.map((r) => r.reduce((s, v, k) => s + v * b[k], 0)), mu = eta.map(Math.exp), z = eta.map((e, i) => e + (y[i] - mu[i]) / mu[i]); const XtW = T(Xd).map((c) => c.map((v, i) => v * mu[i])); cov = inv(mul(XtW, Xd)); const bn = mul(cov, mul(XtW, z.map((v) => [v]))).map((r) => r[0]); const done = Math.max(...bn.map((v, k) => Math.abs(v - b[k]))) < 1e-9; b = bn; if (done) break; }
    const mu = Xd.map((r) => Math.exp(r.reduce((s, v, k) => s + v * b[k], 0))), ll = y.reduce((s, yi, i) => s + yi * Math.log(mu[i]) - mu[i] - lgam(yi + 1), 0);
    const dev = 2 * y.reduce((s, yi, i) => s + (yi > 0 ? yi * Math.log(yi / mu[i]) : 0) - (yi - mu[i]), 0), pearson = y.reduce((s, yi, i) => s + (yi - mu[i]) ** 2 / mu[i], 0), df = n - p;
    const ybar = S.mean(y), ll0 = y.reduce((s, yi) => s + yi * Math.log(ybar) - ybar - lgam(yi + 1), 0);
    const se = cov.map((r, i) => Math.sqrt(r[i])), z = b.map((v, i) => v / se[i]), zs = S.qnorm(1 - (1 - conf) / 2);
    return { names: ["Intercept"].concat(names), b, se, z, p: z.map((v) => 2 * (1 - S.pnorm(Math.abs(v)))), irr: b.map(Math.exp), irrLower: b.map((v, i) => Math.exp(v - zs * se[i])), irrUpper: b.map((v, i) => Math.exp(v + zs * se[i])), ll, ll0, dev, pearson, df, dispersion: pearson / df, aic: -2 * ll + 2 * p, chi: 2 * (ll - ll0), dfChi: p - 1, pChi: 1 - S.pchisq(2 * (ll - ll0), p - 1), n, fitted: mu, conf };
  };
  S.negbin = (X, y, names, conf = 0.95) => { // NB2: alternate IRLS for beta given theta with ML for theta
    const n = y.length, Xd = X.map((r) => [1].concat(r)), p = Xd[0].length;
    const pois = S.poisson(X, y, names, conf); let b = pois.b.slice(), theta = Math.max(0.1, 1 / Math.max(pois.dispersion - 1, 0.05) * 1), cov;
    const llTheta = (th, mu) => y.reduce((s, yi, i) => s + lgam(yi + th) - lgam(th) - lgam(yi + 1) + th * Math.log(th / (th + mu[i])) + yi * Math.log(mu[i] / (th + mu[i])), 0);
    for (let outer = 0; outer < 30; outer++) {
      for (let it = 0; it < 30; it++) { const eta = Xd.map((r) => r.reduce((s, v, k) => s + v * b[k], 0)), mu = eta.map(Math.exp), w = mu.map((m) => m / (1 + m / theta)), z = eta.map((e, i) => e + (y[i] - mu[i]) / mu[i]); const XtW = T(Xd).map((c) => c.map((v, i) => v * w[i])); cov = inv(mul(XtW, Xd)); const bn = mul(cov, mul(XtW, z.map((v) => [v]))).map((r) => r[0]); const done = Math.max(...bn.map((v, k) => Math.abs(v - b[k]))) < 1e-9; b = bn; if (done) break; }
      const mu = Xd.map((r) => Math.exp(r.reduce((s, v, k) => s + v * b[k], 0)));
      const r = maximize((v) => llTheta(Math.exp(v[0]), mu), [Math.log(theta)], 40); const thn = Math.exp(r.x[0]); const done = Math.abs(thn - theta) < 1e-6 * theta; theta = thn; if (done) break;
    }
    const mu = Xd.map((r) => Math.exp(r.reduce((s, v, k) => s + v * b[k], 0))), ll = llTheta(theta, mu);
    const se = cov.map((r, i) => Math.sqrt(r[i])), z = b.map((v, i) => v / se[i]), zs = S.qnorm(1 - (1 - conf) / 2);
    const lrt = 2 * (ll - pois.ll);
    return { names: ["Intercept"].concat(names), b, se, z, p: z.map((v) => 2 * (1 - S.pnorm(Math.abs(v)))), irr: b.map(Math.exp), irrLower: b.map((v, i) => Math.exp(v - zs * se[i])), irrUpper: b.map((v, i) => Math.exp(v + zs * se[i])), theta, ll, aic: -2 * ll + 2 * (p + 1), lrtVsPoisson: lrt, pLrt: 0.5 * (1 - S.pchisq(lrt, 1)), n, poissonAic: pois.aic, poissonDispersion: pois.dispersion, conf };
  };
  S.multinom = (X, yLab, names, conf = 0.95) => { // baseline = first level (sorted)
    const levels = [...new Set(yLab)].sort(), K = levels.length, y = yLab.map((v) => levels.indexOf(v)), Xd = X.map((r) => [1].concat(r)), p = Xd[0].length;
    const ll = (v) => { let s = 0; for (let i = 0; i < y.length; i++) { const etas = [0]; for (let k = 1; k < K; k++) etas.push(Xd[i].reduce((a, x, j) => a + x * v[(k - 1) * p + j], 0)); const mx = Math.max(...etas), lse = mx + Math.log(etas.reduce((a, e) => a + Math.exp(e - mx), 0)); s += etas[y[i]] - lse; } return s; };
    const r = maximize(ll, new Array((K - 1) * p).fill(0)); const zs = S.qnorm(1 - (1 - conf) / 2);
    const base = levels.map((l) => y.filter((v) => v === levels.indexOf(l)).length / y.length), ll0 = y.reduce((s, v) => s + Math.log(base[v]), 0);
    const eq = []; for (let k = 1; k < K; k++) { const b = r.x.slice((k - 1) * p, k * p), se = r.se.slice((k - 1) * p, k * p); eq.push({ level: levels[k], b, se, z: b.map((v, i) => v / se[i]), p: b.map((v, i) => 2 * (1 - S.pnorm(Math.abs(v / se[i])))), rrr: b.map(Math.exp), lower: b.map((v, i) => Math.exp(v - zs * se[i])), upper: b.map((v, i) => Math.exp(v + zs * se[i])) }); }
    return { levels, baseline: levels[0], names: ["Intercept"].concat(names), eq, ll: r.ll, ll0, chi: 2 * (r.ll - ll0), dfChi: (K - 1) * (p - 1), pChi: 1 - S.pchisq(2 * (r.ll - ll0), (K - 1) * (p - 1)), aic: -2 * r.ll + 2 * (K - 1) * p, mcfadden: 1 - r.ll / ll0, n: y.length, conf };
  };
  S.ordinal = (X, yLab, order, names, conf = 0.95) => { // proportional odds (logit), cutpoints increasing
    const levels = order, K = levels.length, y = yLab.map((v) => levels.indexOf(v)), p = X[0].length;
    const F = (z) => 1 / (1 + Math.exp(-z));
    const unpack = (v) => { const b = v.slice(0, p); const cuts = [v[p]]; for (let k = 1; k < K - 1; k++) cuts.push(cuts[k - 1] + Math.exp(v[p + k])); return { b, cuts }; };
    const ll = (v) => { const { b, cuts } = unpack(v); let s = 0; for (let i = 0; i < y.length; i++) { const eta = X[i].reduce((a, x, j) => a + x * b[j], 0); const hi = y[i] < K - 1 ? F(cuts[y[i]] - eta) : 1, lo = y[i] > 0 ? F(cuts[y[i] - 1] - eta) : 0; s += Math.log(Math.max(hi - lo, 1e-12)); } return s; };
    const cum = []; let c = 0; for (let k = 0; k < K - 1; k++) { c += y.filter((v) => v === k).length / y.length; cum.push(Math.log(c / (1 - c))); }
    const x0 = new Array(p).fill(0).concat([cum[0]], cum.slice(1).map((v, k) => Math.log(Math.max(v - cum[k], 1e-3))));
    const r = maximize(ll, x0); const { b, cuts } = unpack(r.x); const zs = S.qnorm(1 - (1 - conf) / 2);
    // SE of cutpoints via delta: run maximize on the unconstrained cut parametrization for SE of b only (reported), cut SEs approximate
    const se = r.se.slice(0, p);
    const base = y.map((v) => y.filter((q) => q === v).length / y.length), ll0 = base.reduce((s, q) => s + Math.log(q), 0);
    return { levels, names, b, se, z: b.map((v, i) => v / se[i]), p: b.map((v, i) => 2 * (1 - S.pnorm(Math.abs(v / se[i])))), or: b.map(Math.exp), lower: b.map((v, i) => Math.exp(v - zs * se[i])), upper: b.map((v, i) => Math.exp(v + zs * se[i])), cuts, ll: r.ll, ll0, chi: 2 * (r.ll - ll0), dfChi: p, pChi: 1 - S.pchisq(2 * (r.ll - ll0), p), aic: -2 * r.ll + 2 * (p + K - 1), n: y.length, conf };
  };
  S.mcnemar = (b, c) => { const chi = ((Math.abs(b - c) - 1) ** 2) / (b + c), n = b + c; const k = Math.min(b, c); let exact = 0; for (let i = 0; i <= k; i++) exact += S.dbinom(i, n, 0.5); exact = Math.min(1, 2 * exact); return { b, c, chi, p: 1 - S.pchisq(chi, 1), exact, chiNoCC: (b - c) ** 2 / (b + c) }; };
  S.trendTest = (successes, totals, scores) => { // Cochran-Armitage via prop.trend.test logic
    const k = successes.length, sc = scores || successes.map((_, i) => i + 1), N = totals.reduce((s, v) => s + v, 0), R = successes.reduce((s, v) => s + v, 0), pbar = R / N;
    const xbar = sc.reduce((s, x, i) => s + x * totals[i], 0) / N;
    const num = sc.reduce((s, x, i) => s + (x - xbar) * (successes[i] - totals[i] * pbar), 0), den = Math.sqrt(pbar * (1 - pbar) * sc.reduce((s, x, i) => s + totals[i] * (x - xbar) ** 2, 0));
    const z = num / den; return { z, chi: z * z, p: 1 - S.pchisq(z * z, 1), props: successes.map((v, i) => v / totals[i]) };
  };
})(window.SW);
/* ---- Advanced: power and sample size ---- */
(function (S) {
  const J = jStat;
  const pois = (lam, j) => Math.exp(-lam + j * Math.log(lam) - J.gammaln(j + 1));
  S.pncChisq = (x, df, lam) => { if (lam < 1e-10) return S.pchisq(x, df); let s = 0; for (let j = 0; j < 400; j++) { const w = pois(lam / 2, j); if (w < 1e-14 && j > lam) break; s += w * S.pchisq(x, df + 2 * j); } return Math.min(1, s); };
  S.pncF = (f, d1, d2, lam) => { if (lam < 1e-10) return S.pf(f, d1, d2); const x = (d1 * f) / (d1 * f + d2); let s = 0; for (let j = 0; j < 400; j++) { const w = pois(lam / 2, j); if (w < 1e-14 && j > lam) break; s += w * J.ibeta(x, d1 / 2 + j, d2 / 2); } return Math.min(1, s); };
  S.pncT = (t, df, ncp) => { // noncentral t cdf by numeric integration over the chi distribution (robust for any df)
    if (Math.abs(ncp) < 1e-10) return S.pt(t, df);
    // P(T <= t) = E_V[ Phi( t sqrt(V/df) - ncp ) ], V ~ chi2(df); integrate on V with Gauss-Legendre over [0, df + 12 sqrt(2 df)]
    const hi = df + 12 * Math.sqrt(2 * df) + 40, N = 2000, h = hi / N; let s = 0;
    for (let i = 0; i <= N; i++) { const v = i * h; const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); const dens = v > 0 ? Math.exp(((df / 2) - 1) * Math.log(v) - v / 2 - (df / 2) * Math.log(2) - J.gammaln(df / 2)) : (df === 2 ? 0.5 : 0); s += w * dens * S.pnorm(t * Math.sqrt(v / df) - ncp); }
    return Math.min(1, Math.max(0, (s * h) / 3));
  };
  const tcrit = (alpha, df, alt) => S.qt(alt === "two" ? 1 - alpha / 2 : 1 - alpha, df);
  // power functions: each takes effect + n (+ alpha, alt) and returns power in [0,1]
  S.power = {
    t1: (d, n, alpha = 0.05, alt = "two") => { const df = n - 1, ncp = d * Math.sqrt(n), c = tcrit(alpha, df, alt); return alt === "two" ? 1 - S.pncT(c, df, ncp) + S.pncT(-c, df, ncp) : 1 - S.pncT(c, df, Math.abs(ncp)); },
    t2: (d, n, alpha = 0.05, alt = "two") => { const df = 2 * n - 2, ncp = d * Math.sqrt(n / 2), c = tcrit(alpha, df, alt); return alt === "two" ? 1 - S.pncT(c, df, ncp) + S.pncT(-c, df, ncp) : 1 - S.pncT(c, df, Math.abs(ncp)); },
    paired: (d, n, alpha = 0.05, alt = "two") => S.power.t1(d, n, alpha, alt),
    prop1: (p0, p1, n, alpha = 0.05, alt = "two") => { const se0 = Math.sqrt(p0 * (1 - p0) / n), se1 = Math.sqrt(p1 * (1 - p1) / n), z = S.qnorm(alt === "two" ? 1 - alpha / 2 : 1 - alpha); const d = p1 - p0; if (alt === "two") return 1 - S.pnorm((z * se0 - d) / se1) + S.pnorm((-z * se0 - d) / se1); return 1 - S.pnorm((z * se0 - Math.abs(d)) / se1); },
    prop2: (p1, p2, n, alpha = 0.05, alt = "two") => { const pbar = (p1 + p2) / 2, se0 = Math.sqrt(2 * pbar * (1 - pbar) / n), se1 = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n), z = S.qnorm(alt === "two" ? 1 - alpha / 2 : 1 - alpha), d = p1 - p2; if (alt === "two") return 1 - S.pnorm((z * se0 - d) / se1) + S.pnorm((-z * se0 - d) / se1); return 1 - S.pnorm((z * se0 - Math.abs(d)) / se1); },
    anova: (f, k, n, alpha = 0.05) => { const d1 = k - 1, d2 = k * (n - 1), lam = f * f * k * n, c = S.qf(1 - alpha, d1, d2); return 1 - S.pncF(c, d1, d2, lam); },
    corr: (r, n, alpha = 0.05, alt = "two") => { const z = Math.atanh(r) * Math.sqrt(n - 3), c = S.qnorm(alt === "two" ? 1 - alpha / 2 : 1 - alpha); return alt === "two" ? 1 - S.pnorm(c - z) + S.pnorm(-c - z) : 1 - S.pnorm(c - Math.abs(z)); },
    chisq: (w, df, n, alpha = 0.05) => { const lam = w * w * n, c = S.qchisq(1 - alpha, df); return 1 - S.pncChisq(c, df, lam); },
  };
  S.solveN = (fn, target, lo = 2, hi = 100000) => { // smallest n with power >= target
    if (fn(hi) < target) return Infinity; while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (fn(mid) >= target) hi = mid; else lo = mid; } return fn(lo) >= target ? lo : hi;
  };
})(window.SW);
/* ---- Advanced: resampling. Bootstrap intervals and permutation tests ---- */
(function (S) {
  S.rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }; // xorshift32, reproducible
  const resample = (x, r) => { const out = new Array(x.length); for (let i = 0; i < x.length; i++) out[i] = x[Math.floor(r() * x.length)]; return out; };
  const shuffle = (x, r) => { const a = x.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  S.bootstrap = ({ x, y, stat, reps = 2000, conf = 0.95, seed = 1, paired = false }) => {
    // stat(xsample, ysample) -> number. If y is given and not paired, x and y are resampled independently; if paired, rows are resampled together.
    const r = S.rng(seed), vals = new Array(reps), observed = stat(x, y);
    for (let b = 0; b < reps; b++) {
      if (y == null) vals[b] = stat(resample(x, r));
      else if (paired) { const idx = x.map((_, i) => Math.floor(r() * x.length)); vals[b] = stat(idx.map((i) => x[i]), idx.map((i) => y[i])); }
      else vals[b] = stat(resample(x, r), resample(y, r));
    }
    const sorted = vals.filter(Number.isFinite).sort((a, b) => a - b), n = sorted.length, a = (1 - conf) / 2;
    const q = (p) => sorted[Math.min(n - 1, Math.max(0, Math.floor(p * n)))];
    const se = S.sd(sorted), bias = S.mean(sorted) - observed;
    return { observed, reps, dist: vals, lower: q(a), upper: q(1 - a), basicLower: 2 * observed - q(1 - a), basicUpper: 2 * observed - q(a), se, bias, conf };
  };
  S.permutation = ({ x, y, stat, reps = 2000, seed = 1, kind = "twoGroup", alt = "two" }) => {
    // twoGroup: x = values, y = group labels (two levels); stat(valuesA, valuesB). paired: x, y equal length; stat(diffs). corr: x, y numeric; stat(x, y).
    const r = S.rng(seed); let observed, gen;
    if (kind === "twoGroup") { const lv = [...new Set(y)], A = x.filter((_, i) => y[i] === lv[0]), B = x.filter((_, i) => y[i] === lv[1]); observed = stat(A, B); gen = () => { const s = shuffle(x, r); return stat(s.slice(0, A.length), s.slice(A.length)); }; }
    else if (kind === "paired") { const d = x.map((v, i) => v - y[i]); observed = stat(d); gen = () => stat(d.map((v) => (r() < 0.5 ? v : -v))); }
    else { observed = stat(x, y); gen = () => stat(x, shuffle(y, r)); }
    const dist = new Array(reps); for (let b = 0; b < reps; b++) dist[b] = gen();
    let count; if (alt === "greater") count = dist.filter((v) => v >= observed).length; else if (alt === "less") count = dist.filter((v) => v <= observed).length; else count = dist.filter((v) => Math.abs(v) >= Math.abs(observed) - 1e-12).length;
    return { observed, dist, p: (count + 1) / (reps + 1), reps, alt };
  };
})(window.SW);
