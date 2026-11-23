# Independent reference numbers for the Causal menu, written to tests/checks/data/causal_reference.json.
# R is not installable in the build environment, so the checks use statsmodels (glm and OLS, the same fits as R's
# glm and lm), numpy linear algebra for two-stage least squares (the ivreg formulas) and networkx for d-separation.
# Run from stats/:  python3 tests/checks/causal_reference.py
import json, csv, os, itertools, math
import numpy as np, networkx as nx
import statsmodels.api as sm
here = os.path.dirname(os.path.abspath(__file__)); data = os.path.join(here, "..", "..", "data")
def read(name):
    with open(os.path.join(data, name)) as f: return list(csv.DictReader(f))
ref = {}

# ---- DAGs: d-separation and backdoor sets by networkx, on graphs from the book's kind of examples
graphs = {
  "tutoring": ["Family income -> Tutoring", "Family income -> Test score", "Tutoring -> Test score", "Prior GPA -> Tutoring", "Prior GPA -> Test score"],
  "mbias": ["U1 -> X", "U1 -> M", "U2 -> M", "U2 -> Y", "X -> Y"],
  "collider": ["Talent -> Admitted", "Hard work -> Admitted", "Talent -> Salary", "Hard work -> Salary"],
  "chain": ["Study hours -> Practice problems -> Exam score"],
  "mediator_desc": ["T -> M", "M -> Y", "T -> Y", "C -> T", "C -> Y", "M -> D"],
  "front": ["U -> T", "U -> Y", "T -> M", "M -> Y"],
}
def parse(lines):
    G = nx.DiGraph()
    for l in lines:
        parts = [p.strip() for p in l.split("->")]
        for a, b in zip(parts, parts[1:]): G.add_edge(a, b)
    return G
dag = {}
queries = {
  "tutoring": [("Tutoring", "Test score", []), ("Tutoring", "Test score", ["Family income", "Prior GPA"]), ("Family income", "Prior GPA", []), ("Family income", "Prior GPA", ["Tutoring"])],
  "mbias": [("X", "Y", []), ("X", "Y", ["M"]), ("U1", "U2", []), ("U1", "U2", ["M"])],
  "collider": [("Talent", "Hard work", []), ("Talent", "Hard work", ["Admitted"]), ("Talent", "Hard work", ["Salary"])],
  "chain": [("Study hours", "Exam score", []), ("Study hours", "Exam score", ["Practice problems"])],
  "mediator_desc": [("T", "Y", ["C"]), ("T", "Y", ["C", "M"]), ("T", "Y", ["C", "D"])],
  "front": [("T", "Y", []), ("T", "Y", ["M"])],
}
backdoor = {"tutoring": ("Tutoring", "Test score", []), "mbias": ("X", "Y", []), "mbias_unobs": ("X", "Y", ["U1", "U2"]), "mediator_desc": ("T", "Y", []), "front": ("T", "Y", ["U"]), "collider": ("Talent", "Salary", [])}
for name, lines in graphs.items():
    G = parse(lines)
    dag[name] = {"lines": lines, "dsep": [{"x": x, "y": y, "z": z, "separated": bool(nx.is_d_separator(G, {x}, {y}, set(z)))} for x, y, z in queries[name]]}
for key, (t, y, unobs) in backdoor.items():
    gname = key.replace("_unobs", ""); G = parse(graphs[gname])
    desc = nx.descendants(G, t); cands = [n for n in G.nodes if n not in (t, y) and n not in desc and n not in unobs]
    Gb = G.copy(); Gb.remove_edges_from(list(G.out_edges(t)))   # the backdoor graph: arrows out of t removed
    valid = []
    for k in range(len(cands) + 1):
        for Z in itertools.combinations(cands, k):
            if nx.is_d_separator(Gb, {t}, {y}, set(Z)): valid.append(sorted(Z))
    minimal = [Z for Z in valid if not any(set(W) < set(Z) for W in valid)]
    dag.setdefault(gname, {}).setdefault("backdoor", []).append({"t": t, "y": y, "unobserved": unobs, "valid": valid, "minimal": minimal})
ref["dag"] = dag

# ---- standardization: bike lanes by street type
rows = read("causal_bike_lanes.csv"); y = np.array([float(r["crashes_per_year"]) for r in rows]); t = np.array([r["bike_lane"] == "yes" for r in rows]); s = np.array([r["street_type"] for r in rows])
crude = y[t].mean() - y[~t].mean(); std1 = std0 = 0.0; strata = []
for lev in sorted(set(s)):
    m = s == lev; w = m.mean(); m1 = y[m & t].mean(); m0 = y[m & ~t].mean(); std1 += w * m1; std0 += w * m0
    strata.append({"key": lev, "n": int(m.sum()), "w": w, "m1": m1, "m0": m0})
ref["standardize"] = {"crude": crude, "std_m1": std1, "std_m0": std0, "std": std1 - std0, "strata": strata, "n": int(len(y))}

# ---- propensity scores on the tutoring data: glm(tutoring ~ family_income + prior_gpa, binomial)
rows = read("causal_tutoring.csv"); inc = np.array([float(r["family_income"]) for r in rows]); gpa = np.array([float(r["prior_gpa"]) for r in rows])
t = np.array([1.0 if r["tutoring"] == "yes" else 0.0 for r in rows]); y = np.array([float(r["test_score"]) for r in rows]); z = np.array([1.0 if r["lottery_offer"] == "yes" else 0.0 for r in rows])
passed = np.array([1.0 if r["passed"] == "yes" else 0.0 for r in rows])
X = sm.add_constant(np.column_stack([inc, gpa])); glm = sm.GLM(t, X, family=sm.families.Binomial()).fit(); e = glm.predict(X)
w = np.where(t == 1, 1 / e, 1 / (1 - e)); tr = t == 1
ate = np.average(y[tr], weights=w[tr]) - np.average(y[~tr], weights=w[~tr]); att = y[tr].mean() - np.average(y[~tr], weights=(e / (1 - e))[~tr])
def smd(x, a, b, wa=None, wb=None):
    sdp = math.sqrt((x[a].var(ddof=1) + x[b].var(ddof=1)) / 2)
    ma = np.average(x[a], weights=wa) if wa is not None else x[a].mean(); mb = np.average(x[b], weights=wb) if wb is not None else x[b].mean()
    return (ma - mb) / sdp
ref["ipw"] = {"coef": list(glm.params), "se": list(glm.bse), "crude": y[tr].mean() - y[~tr].mean(), "ate": ate, "att": att,
  "smd_before": [smd(inc, tr, ~tr), smd(gpa, tr, ~tr)], "smd_after": [smd(inc, tr, ~tr, w[tr], w[~tr]), smd(gpa, tr, ~tr, w[tr], w[~tr])], "ps_first5": list(e[:5]), "n1": int(tr.sum()), "n0": int((~tr).sum())}

# ---- matching: 1 to 1 nearest neighbour on e with replacement, ties to the earlier control
i1 = np.where(tr)[0]; i0 = np.where(~tr)[0]; pairs = []
for i in i1:
    d = np.abs(e[i0] - e[i]); j = i0[int(np.argmin(d))]; pairs.append((i, j))
diffs = np.array([y[i] - y[j] for i, j in pairs])
ref["match"] = {"att": diffs.mean(), "se": diffs.std(ddof=1) / math.sqrt(len(diffs)), "nMatched": len(pairs), "controlsUsed": len(set(j for _, j in pairs)),
  "smd_after": [(inc[[i for i, _ in pairs]].mean() - inc[[j for _, j in pairs]].mean()) / math.sqrt((inc[tr].var(ddof=1) + inc[~tr].var(ddof=1)) / 2), (gpa[[i for i, _ in pairs]].mean() - gpa[[j for _, j in pairs]].mean()) / math.sqrt((gpa[tr].var(ddof=1) + gpa[~tr].var(ddof=1)) / 2)]}

# ---- instrumental variables: Wald ratio, 2SLS without and with covariates (ivreg formulas), first-stage F = t^2
def tsls(y, t, z, W):
    n = len(y); Xz = sm.add_constant(np.column_stack([z] + W)) if W else sm.add_constant(z); first = sm.OLS(t, Xz).fit(); that = first.fittedvalues
    Xh = sm.add_constant(np.column_stack([that] + W)) if W else sm.add_constant(that); Xa = sm.add_constant(np.column_stack([t] + W)) if W else sm.add_constant(t)
    b = np.linalg.solve(Xh.T @ Xh, Xh.T @ y); resid = y - Xa @ b; sigma2 = resid @ resid / (n - Xh.shape[1]); V = sigma2 * np.linalg.inv(Xh.T @ Xh)
    return {"b": list(b), "se": list(np.sqrt(np.diag(V))), "firstF": float(first.tvalues[1] ** 2), "first_coef": float(first.params[1])}
z1 = z == 1
ref["iv"] = {"wald": {"dy": y[z1].mean() - y[~z1].mean(), "dt": t[z1].mean() - t[~z1].mean(), "ratio": (y[z1].mean() - y[~z1].mean()) / (t[z1].mean() - t[~z1].mean())},
  "tsls0": tsls(y, t, z, []), "tsls2": tsls(y, t, z, [inc, gpa]), "ols2": list(sm.OLS(y, sm.add_constant(np.column_stack([t, inc, gpa]))).fit().params)}

# ---- difference in differences: riders ~ group * period
rows = read("causal_bus_routes.csv"); yy = np.array([float(r["riders_per_day"]) for r in rows]); g = np.array([1.0 if r["route_group"] == "new schedule" else 0.0 for r in rows]); p = np.array([1.0 if r["period"] == "after" else 0.0 for r in rows])
fit = sm.OLS(yy, sm.add_constant(np.column_stack([g, p, g * p]))).fit()
cellm = {k: yy[(g == gi) & (p == pi)].mean() for k, gi, pi in [("c0", 0, 0), ("c1", 0, 1), ("t0", 1, 0), ("t1", 1, 1)]}
ref["did"] = {"means": cellm, "did": (cellm["t1"] - cellm["t0"]) - (cellm["c1"] - cellm["c0"]), "coef": float(fit.params[3]), "se": float(fit.bse[3]), "t": float(fit.tvalues[3]), "p": float(fit.pvalues[3])}

# ---- sharp RD: cutoff 3.0, bandwidth 0.5, local linear each side
rows = read("causal_scholarship_rd.csv"); x = np.array([float(r["hs_gpa"]) for r in rows]); yy = np.array([float(r["credits_completed"]) for r in rows]); c, h = 3.0, 0.5
R = (x >= c) & (x - c <= h); L = (x < c) & (c - x <= h)
fR = sm.OLS(yy[R], sm.add_constant(x[R] - c)).fit(); fL = sm.OLS(yy[L], sm.add_constant(x[L] - c)).fit()
ref["rdd"] = {"aT": float(fR.params[0]), "aC": float(fL.params[0]), "jump": float(fR.params[0] - fL.params[0]), "se": math.sqrt(fR.bse[0] ** 2 + fL.bse[0] ** 2), "nT": int(R.sum()), "nC": int(L.sum()), "slopeT": float(fR.params[1]), "slopeC": float(fL.params[1])}
# the whole range (no bandwidth)
R2 = x >= c; L2 = x < c; fR2 = sm.OLS(yy[R2], sm.add_constant(x[R2] - c)).fit(); fL2 = sm.OLS(yy[L2], sm.add_constant(x[L2] - c)).fit()
ref["rdd_all"] = {"jump": float(fR2.params[0] - fL2.params[0]), "se": math.sqrt(fR2.bse[0] ** 2 + fL2.bse[0] ** 2), "nT": int(R2.sum()), "nC": int(L2.sum())}

# ---- Manski bounds: passed by tutoring
p1 = tr.mean(); p0 = 1 - p1; m1 = passed[tr].mean(); m0 = passed[~tr].mean()
ref["manski"] = {"p1": p1, "m1": m1, "m0": m0, "y1": [p1 * m1, p1 * m1 + p0], "y0": [p0 * m0, p0 * m0 + p1], "ate": [p1 * m1 - (p0 * m0 + p1), p1 * m1 + p0 - p0 * m0], "naive": m1 - m0}

os.makedirs(os.path.join(here, "data"), exist_ok=True)
with open(os.path.join(here, "data", "causal_reference.json"), "w") as f: json.dump(ref, f, indent=1, default=float)
print(json.dumps({k: (v if k not in ("dag",) else "...") for k, v in ref.items()}, indent=1, default=float)[:3000])
