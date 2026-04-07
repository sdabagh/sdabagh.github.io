"""
Module 22: Financial Dashboard (Capstone)
==========================================
COMPREHENSIVE script that generates a full financial report as an HTML file.

Input  : list of tickers and weights (portfolio)
Output : dashboard.html with embedded charts (base64 encoded images)

Includes:
  - Portfolio returns & cumulative performance
  - Risk metrics: VaR, CVaR, Sharpe, Sortino, max drawdown
  - Correlation heatmap
  - Factor exposures (CAPM regression)
  - Macro context (yield curve, VIX)
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # non-interactive backend for HTML generation
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.stats import norm
from sklearn.linear_model import LinearRegression
import base64
import io
import datetime
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 22 : Financial Dashboard (Capstone)")
print("=" * 70)

# ===========================================================================
# CONFIGURATION -- Change these to analyse a different portfolio
# ===========================================================================
PORTFOLIO = {
    "AAPL": 0.25,
    "MSFT": 0.20,
    "GOOGL": 0.15,
    "JNJ": 0.15,
    "JPM": 0.10,
    "XOM": 0.10,
    "AGG": 0.05,   # bonds
}
START_DATE = "2015-01-01"
RISK_FREE_RATE = 0.05   # annual
CONFIDENCE = 0.95
OUTPUT_FILE = "dashboard.html"

print(f"\nPortfolio: {PORTFOLIO}")
print(f"Start date: {START_DATE}")

# ===========================================================================
# DATA DOWNLOAD
# ===========================================================================
print("\n--- Downloading price data ---")
tickers = list(PORTFOLIO.keys())
weights = np.array(list(PORTFOLIO.values()))

prices = yf.download(tickers, start=START_DATE, auto_adjust=True, progress=False)["Close"]
if isinstance(prices.columns, pd.MultiIndex):
    prices.columns = prices.columns.get_level_values(0)
prices = prices[tickers].dropna()
returns = prices.pct_change().dropna()

# Benchmark: SPY
spy = yf.download("SPY", start=START_DATE, auto_adjust=True, progress=False)["Close"]
if isinstance(spy, pd.DataFrame):
    spy = spy.iloc[:, 0]
spy_ret = spy.pct_change().dropna()

# Macro: VIX, 10Y yield
macro = yf.download(["^VIX", "^TNX", "^IRX"], start=START_DATE,
                    auto_adjust=True, progress=False)["Close"]
if isinstance(macro.columns, pd.MultiIndex):
    macro.columns = macro.columns.get_level_values(0)

# Portfolio returns
port_ret = returns.dot(weights)
common_idx = port_ret.index.intersection(spy_ret.index)
port_ret = port_ret.loc[common_idx]
spy_ret = spy_ret.loc[common_idx]

print(f"Observations: {len(port_ret)}")
print(f"Date range  : {port_ret.index[0].date()} to {port_ret.index[-1].date()}")

# ===========================================================================
# METRIC COMPUTATIONS
# ===========================================================================
print("\n--- Computing metrics ---")

def sharpe(r, rf=RISK_FREE_RATE):
    return np.sqrt(252) * (r.mean() - rf / 252) / r.std()

def sortino(r, rf=RISK_FREE_RATE):
    excess = r - rf / 252
    down = excess[excess < 0].std()
    return np.sqrt(252) * excess.mean() / down if down > 0 else 0

def max_drawdown(r):
    cum = (1 + r).cumprod()
    return ((cum - cum.cummax()) / cum.cummax()).min()

def var_hist(r, conf=CONFIDENCE):
    return -np.percentile(r, (1 - conf) * 100)

def cvar_hist(r, conf=CONFIDENCE):
    v = var_hist(r, conf)
    return -r[r <= -v].mean()

metrics = {
    "Annualized Return": (port_ret.mean() * 252, spy_ret.mean() * 252),
    "Annualized Volatility": (port_ret.std() * np.sqrt(252), spy_ret.std() * np.sqrt(252)),
    "Sharpe Ratio": (sharpe(port_ret), sharpe(spy_ret)),
    "Sortino Ratio": (sortino(port_ret), sortino(spy_ret)),
    "Max Drawdown": (max_drawdown(port_ret), max_drawdown(spy_ret)),
    f"VaR ({CONFIDENCE:.0%}, 1-day)": (var_hist(port_ret), var_hist(spy_ret)),
    f"CVaR ({CONFIDENCE:.0%}, 1-day)": (cvar_hist(port_ret), cvar_hist(spy_ret)),
}

for k, (pv, bv) in metrics.items():
    print(f"  {k:<30}: Portfolio={pv:>+.4f}  SPY={bv:>+.4f}")

# ===========================================================================
# CHART GENERATION (saved to base64 strings)
# ===========================================================================
print("\n--- Generating charts ---")
charts = {}

def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

# --- Chart 1: Cumulative Returns ---
cum_port = (1 + port_ret).cumprod()
cum_spy = (1 + spy_ret).cumprod()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(cum_port.index, cum_port, "b-", linewidth=1.5, label="Portfolio")
ax.plot(cum_spy.index, cum_spy, "gray", linewidth=1, alpha=0.7, label="SPY Benchmark")
ax.set_title("Cumulative Returns")
ax.set_ylabel("Growth of $1")
ax.legend()
ax.grid(True, alpha=0.3)
charts["cumulative"] = fig_to_base64(fig)

# --- Chart 2: Drawdown ---
dd_port = (cum_port - cum_port.cummax()) / cum_port.cummax()
dd_spy = (cum_spy - cum_spy.cummax()) / cum_spy.cummax()

fig, ax = plt.subplots(figsize=(10, 4))
ax.fill_between(dd_port.index, dd_port * 100, 0, color="red", alpha=0.4, label="Portfolio")
ax.plot(dd_spy.index, dd_spy * 100, "gray", linewidth=0.8, alpha=0.6, label="SPY")
ax.set_title("Drawdown")
ax.set_ylabel("Drawdown (%)")
ax.legend()
ax.grid(True, alpha=0.3)
charts["drawdown"] = fig_to_base64(fig)

# --- Chart 3: Correlation Heatmap ---
corr = returns.corr()
fig, ax = plt.subplots(figsize=(8, 6))
im = ax.imshow(corr.values, cmap="RdYlGn", vmin=-1, vmax=1, aspect="auto")
ax.set_xticks(range(len(corr)))
ax.set_yticks(range(len(corr)))
ax.set_xticklabels(corr.columns, rotation=45, ha="right")
ax.set_yticklabels(corr.columns)
for i in range(len(corr)):
    for j in range(len(corr)):
        ax.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=9)
plt.colorbar(im, ax=ax, label="Correlation")
ax.set_title("Asset Correlation Matrix")
charts["correlation"] = fig_to_base64(fig)

# --- Chart 4: CAPM Factor Exposure ---
fig, ax = plt.subplots(figsize=(8, 6))
betas = {}
for t in tickers:
    if t not in returns.columns:
        continue
    aligned = pd.DataFrame({"asset": returns[t], "mkt": spy_ret}).dropna()
    X = aligned["mkt"].values.reshape(-1, 1)
    y_val = aligned["asset"].values
    reg = LinearRegression().fit(X, y_val)
    betas[t] = reg.coef_[0]

beta_s = pd.Series(betas).sort_values()
colors = ["#d32f2f" if b > 1 else "#388e3c" if b < 1 else "#1565c0" for b in beta_s]
ax.barh(beta_s.index, beta_s.values, color=colors)
ax.axvline(1, color="black", linewidth=1, linestyle="--", label="Market beta = 1")
ax.set_xlabel("CAPM Beta")
ax.set_title("Factor Exposure: CAPM Beta vs SPY")
ax.legend()
ax.grid(True, alpha=0.3, axis="x")

port_beta = sum(betas.get(t, 0) * w for t, w in zip(tickers, weights))
ax.axvline(port_beta, color="blue", linewidth=2, linestyle="-.",
           label=f"Portfolio beta = {port_beta:.2f}")
ax.legend()
charts["capm"] = fig_to_base64(fig)

# --- Chart 5: Rolling Sharpe ---
rolling_window = 126  # ~6 months
excess_port = port_ret - RISK_FREE_RATE / 252
rolling_sharpe = (excess_port.rolling(rolling_window).mean() /
                  port_ret.rolling(rolling_window).std()) * np.sqrt(252)

fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(rolling_sharpe.index, rolling_sharpe, "b-", linewidth=1)
ax.axhline(0, color="red", linewidth=0.8, linestyle="--")
ax.set_title(f"Rolling {rolling_window}-Day Sharpe Ratio")
ax.set_ylabel("Sharpe Ratio")
ax.grid(True, alpha=0.3)
charts["rolling_sharpe"] = fig_to_base64(fig)

# --- Chart 6: Return Distribution ---
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(port_ret * 100, bins=80, density=True, alpha=0.6, color="steelblue",
        label="Portfolio returns")
x = np.linspace(port_ret.min() * 100, port_ret.max() * 100, 200)
ax.plot(x, norm.pdf(x, port_ret.mean() * 100, port_ret.std() * 100),
        "r-", linewidth=2, label="Normal fit")
v = var_hist(port_ret)
ax.axvline(-v * 100, color="red", linestyle="--", linewidth=2,
           label=f"VaR {CONFIDENCE:.0%} = {v:.2%}")
ax.set_title("Daily Return Distribution")
ax.set_xlabel("Daily Return (%)")
ax.legend()
ax.grid(True, alpha=0.3)
charts["distribution"] = fig_to_base64(fig)

# --- Chart 7: Macro Context ---
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
if "^VIX" in macro.columns:
    ax1.plot(macro.index, macro["^VIX"], "purple", linewidth=1)
    ax1.axhline(20, color="orange", linestyle="--", alpha=0.5)
    ax1.set_ylabel("VIX")
    ax1.set_title("Macro Context")
    ax1.grid(True, alpha=0.3)

if "^TNX" in macro.columns and "^IRX" in macro.columns:
    spread = macro["^TNX"] - macro["^IRX"]
    ax2.plot(spread.index, spread, "b-", linewidth=1)
    ax2.axhline(0, color="red", linestyle="--", linewidth=1)
    ax2.fill_between(spread.index, spread, 0, where=spread < 0, color="red", alpha=0.3)
    ax2.set_ylabel("10Y-3M Spread")
    ax2.set_xlabel("Date")
    ax2.grid(True, alpha=0.3)
charts["macro"] = fig_to_base64(fig)

print(f"  Generated {len(charts)} charts.")

# ===========================================================================
# HTML GENERATION
# ===========================================================================
print("\n--- Building HTML dashboard ---")

now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
holdings_html = "".join(
    f"<tr><td>{t}</td><td>{w:.0%}</td><td>{betas.get(t, 0):.2f}</td></tr>"
    for t, w in zip(tickers, weights)
)

metrics_html = "".join(
    f"<tr><td>{k}</td><td>{pv:+.4f}</td><td>{bv:+.4f}</td></tr>"
    for k, (pv, bv) in metrics.items()
)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Portfolio Dashboard</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         margin: 20px; background: #f5f5f5; color: #333; }}
  h1 {{ color: #1565c0; border-bottom: 3px solid #1565c0; padding-bottom: 10px; }}
  h2 {{ color: #333; margin-top: 30px; }}
  table {{ border-collapse: collapse; width: 100%; max-width: 700px; margin: 10px 0; }}
  th, td {{ border: 1px solid #ddd; padding: 8px 12px; text-align: right; }}
  th {{ background: #1565c0; color: white; text-align: center; }}
  td:first-child {{ text-align: left; font-weight: 600; }}
  .chart {{ text-align: center; margin: 20px 0; }}
  .chart img {{ max-width: 100%; border: 1px solid #ddd; border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
  .card {{ background: white; padding: 15px; border-radius: 8px;
           box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
  .footer {{ margin-top: 40px; padding: 20px 0; border-top: 1px solid #ddd;
             color: #777; font-size: 0.9em; }}
</style>
</head>
<body>
<h1>Portfolio Financial Dashboard</h1>
<p>Generated: {now} | Period: {port_ret.index[0].date()} to {port_ret.index[-1].date()}</p>

<div class="grid">
<div class="card">
<h2>Portfolio Holdings</h2>
<table>
<tr><th>Ticker</th><th>Weight</th><th>Beta</th></tr>
{holdings_html}
<tr style="font-weight:bold; background:#e3f2fd;">
  <td>PORTFOLIO</td><td>{weights.sum():.0%}</td><td>{port_beta:.2f}</td>
</tr>
</table>
</div>

<div class="card">
<h2>Risk & Return Metrics</h2>
<table>
<tr><th>Metric</th><th>Portfolio</th><th>SPY</th></tr>
{metrics_html}
</table>
</div>
</div>

<h2>Cumulative Returns</h2>
<div class="chart"><img src="data:image/png;base64,{charts['cumulative']}" alt="Cumulative Returns"></div>

<h2>Drawdown Analysis</h2>
<div class="chart"><img src="data:image/png;base64,{charts['drawdown']}" alt="Drawdown"></div>

<div class="grid">
<div class="card">
<h2>Correlation Matrix</h2>
<div class="chart"><img src="data:image/png;base64,{charts['correlation']}" alt="Correlation"></div>
</div>

<div class="card">
<h2>CAPM Factor Exposure</h2>
<div class="chart"><img src="data:image/png;base64,{charts['capm']}" alt="CAPM Beta"></div>
</div>
</div>

<h2>Rolling Sharpe Ratio</h2>
<div class="chart"><img src="data:image/png;base64,{charts['rolling_sharpe']}" alt="Rolling Sharpe"></div>

<div class="grid">
<div class="card">
<h2>Return Distribution</h2>
<div class="chart"><img src="data:image/png;base64,{charts['distribution']}" alt="Distribution"></div>
</div>

<div class="card">
<h2>Macro Context (VIX & Yield Curve)</h2>
<div class="chart"><img src="data:image/png;base64,{charts['macro']}" alt="Macro"></div>
</div>
</div>

<div class="footer">
<p>This dashboard is for educational purposes only and does not constitute financial advice.
Past performance does not guarantee future results.</p>
<p>Generated by Module 22 (Capstone) of the Financial Literacy Course.</p>
</div>
</body>
</html>"""

with open(OUTPUT_FILE, "w") as f:
    f.write(html)

print(f"\n  Dashboard saved to: {OUTPUT_FILE}")
print(f"  File size: ~{len(html) / 1024:.0f} KB")
print(f"  Open in a browser to view the full report.")

print("\n  DASHBOARD CONTENTS:")
print("    - Portfolio holdings with weights and betas")
print("    - Risk/return metrics vs SPY benchmark")
print("    - Cumulative return chart")
print("    - Drawdown analysis")
print("    - Asset correlation heatmap")
print("    - CAPM beta exposures")
print("    - Rolling Sharpe ratio")
print("    - Return distribution with VaR")
print("    - Macro context (VIX + yield curve)")

print("\n  COURSE COMPLETE!")
print("  You now have tools to analyse portfolios, manage risk, test strategies,")
print("  understand behavioral biases, and read financial news critically.")
print("=" * 70)
