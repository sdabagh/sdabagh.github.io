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
