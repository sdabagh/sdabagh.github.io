"""
Module 21: Macroeconomics
===========================
Topics covered:
  - Download GDP, CPI, unemployment proxies via yfinance
  - Plot macro time series with recession shading
  - Test Phillips Curve relationship (scatter + regression)
  - Simple yield curve inversion recession predictor
  - Leading vs lagging indicator analysis
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from sklearn.linear_model import LinearRegression
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 21 : Macroeconomics")
print("=" * 70)

# ---------------------------------------------------------------------------
# Data: use market-based proxies for macro indicators
# ---------------------------------------------------------------------------
print("\n--- Loading macro proxies via yfinance ---")
print("  Using market ETFs and yields as proxies for macro variables:")
print("    - SPY: equity market / GDP growth proxy")
print("    - TIP: inflation expectations (TIPS ETF)")
print("    - ^TNX: 10-year Treasury yield")
print("    - ^IRX: 3-month Treasury yield")
print("    - ^VIX: volatility / uncertainty index\n")

tickers_macro = {
    "SPY": "Equity Market (GDP proxy)",
    "TIP": "Inflation Expectations",
    "^TNX": "10Y Treasury Yield",
    "^IRX": "3M Treasury Yield",
    "^VIX": "Volatility Index",
}

data = yf.download(list(tickers_macro.keys()), start="2003-01-01",
                   auto_adjust=True, progress=False)["Close"]
if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)
data = data.dropna()
print(f"Date range: {data.index[0].date()} to {data.index[-1].date()}")

# ---------------------------------------------------------------------------
# NBER recession dates (approximate)
# ---------------------------------------------------------------------------
recessions = [
    ("2007-12-01", "2009-06-30"),  # Great Recession
    ("2020-02-01", "2020-04-30"),  # COVID
]

def add_recession_shading(ax, recessions):
    for start, end in recessions:
        ax.axvspan(pd.Timestamp(start), pd.Timestamp(end),
                   color="gray", alpha=0.2, label="_recession")

# ---------------------------------------------------------------------------
# 1. Macro time series with recession shading
# ---------------------------------------------------------------------------
print("\n--- 1. Macro Time Series with Recession Shading ---")

fig, axes = plt.subplots(4, 1, figsize=(12, 14), sharex=True)

# SPY (equity market)
ax = axes[0]
ax.plot(data.index, data["SPY"], "b-", linewidth=1)
ax.set_ylabel("SPY ($)")
ax.set_title("Equity Market (GDP Proxy)")
add_recession_shading(ax, recessions)
ax.grid(True, alpha=0.3)

# TIP (inflation)
ax = axes[1]
tip_ret = data["TIP"].pct_change().rolling(252).sum() * 100  # trailing 1yr
ax.plot(tip_ret.index, tip_ret, "r-", linewidth=1)
ax.set_ylabel("TIPS 1Y Return (%)")
ax.set_title("Inflation Expectations (TIPS ETF trailing return)")
add_recession_shading(ax, recessions)
ax.axhline(0, color="k", linewidth=0.5)
ax.grid(True, alpha=0.3)

# 10Y yield
ax = axes[2]
ax.plot(data.index, data["^TNX"], "g-", linewidth=1)
ax.set_ylabel("Yield (%)")
ax.set_title("10-Year Treasury Yield")
add_recession_shading(ax, recessions)
ax.grid(True, alpha=0.3)

# VIX
ax = axes[3]
ax.plot(data.index, data["^VIX"], "purple", linewidth=1)
ax.set_ylabel("VIX")
ax.set_title("VIX (Fear Index)")
add_recession_shading(ax, recessions)
ax.axhline(20, color="orange", linestyle="--", alpha=0.5, label="VIX=20 (elevated fear)")
ax.legend()
ax.grid(True, alpha=0.3)

plt.suptitle("Macroeconomic Dashboard with Recession Shading (gray)", fontsize=14, y=1.01)
plt.tight_layout()
plt.savefig("module_21_macro_dashboard.png", dpi=150)
plt.show()
print("Macro dashboard saved as module_21_macro_dashboard.png")

# ---------------------------------------------------------------------------
# 2. Phillips Curve proxy: inflation vs unemployment proxy
# ---------------------------------------------------------------------------
print("\n--- 2. Phillips Curve (Inflation vs Economic Slack) ---")
print("  Traditional Phillips Curve: low unemployment -> high inflation.")
print("  We use TIP returns (inflation proxy) vs inverse SPY returns (slack proxy).\n")

# Monthly data
spy_monthly = data["SPY"].resample("ME").last().pct_change() * 100
tip_monthly = data["TIP"].resample("ME").last().pct_change() * 100

# Align
aligned = pd.DataFrame({"Growth": spy_monthly, "Inflation": tip_monthly}).dropna()
# Use 12-month trailing
aligned["Growth_12m"] = aligned["Growth"].rolling(12).sum()
aligned["Inflation_12m"] = aligned["Inflation"].rolling(12).sum()
aligned = aligned.dropna()

X = aligned["Growth_12m"].values.reshape(-1, 1)
y_val = aligned["Inflation_12m"].values
reg = LinearRegression().fit(X, y_val)
r2 = reg.score(X, y_val)

fig, ax = plt.subplots(figsize=(8, 6))
scatter = ax.scatter(aligned["Growth_12m"], aligned["Inflation_12m"],
                     c=aligned.index.year, cmap="viridis", alpha=0.6, s=30)
x_line = np.linspace(X.min(), X.max(), 100)
ax.plot(x_line, reg.predict(x_line.reshape(-1, 1)), "r-", linewidth=2,
        label=f"Regression (R2={r2:.3f})")
ax.set_xlabel("Equity Growth (12m, %)")
ax.set_ylabel("Inflation Proxy (12m TIPS return, %)")
ax.set_title("Phillips Curve Proxy: Growth vs Inflation")
ax.legend()
ax.grid(True, alpha=0.3)
plt.colorbar(scatter, label="Year")
plt.tight_layout()
plt.savefig("module_21_phillips.png", dpi=150)
plt.show()
print(f"Phillips curve plot saved (R2 = {r2:.3f})")
print("  -> The relationship is weak, consistent with the modern view that")
print("     the Phillips Curve is unstable and flattens over time.")

# ---------------------------------------------------------------------------
# 3. Yield curve inversion as recession predictor
# ---------------------------------------------------------------------------
print("\n--- 3. Yield Curve Inversion Recession Predictor ---")
spread_10y_3m = data["^TNX"] - data["^IRX"]

fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(spread_10y_3m.index, spread_10y_3m, "b-", linewidth=1, label="10Y - 3M spread")
ax.axhline(0, color="red", linewidth=1.5, linestyle="--", label="Inversion threshold")
ax.fill_between(spread_10y_3m.index, spread_10y_3m, 0,
                where=spread_10y_3m < 0, color="red", alpha=0.3, label="Inverted")
add_recession_shading(ax, recessions)
ax.set_ylabel("Spread (percentage points)")
ax.set_title("Yield Curve: 10Y - 3M Treasury Spread")
ax.legend(loc="upper right")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_21_yield_curve.png", dpi=150)
plt.show()
print("Yield curve spread plot saved as module_21_yield_curve.png")

# Count inversions before recessions
inversions = spread_10y_3m[spread_10y_3m < 0]
if len(inversions) > 0:
    print(f"  Total days of inversion: {len(inversions)}")
    print(f"  First inversion: {inversions.index[0].date()}")
    print(f"  Last inversion : {inversions.index[-1].date()}")
print("  -> Yield curve inversion has preceded every US recession since 1960,")
print("     with a lead time of 6-24 months. One of the most reliable predictors.")

# ---------------------------------------------------------------------------
# 4. Leading vs lagging indicator analysis
# ---------------------------------------------------------------------------
print("\n--- 4. Leading vs Lagging Indicators ---")
print("  Leading indicators move BEFORE the economy turns.")
print("  Lagging indicators confirm AFTER the turn.\n")

spy_ret = data["SPY"].pct_change().rolling(63).sum()  # 3-month trailing return
vix_level = data["^VIX"]
yield_spread = spread_10y_3m

# Cross-correlation: how far ahead does each indicator predict SPY moves?
print(f"  {'Indicator':<25} {'Best lead (months)':>20} {'Correlation':>14}")
print("-" * 63)

for name, series in [("Yield Spread (10Y-3M)", yield_spread),
                      ("VIX", vix_level)]:
    aligned = pd.DataFrame({"indicator": series, "spy": spy_ret}).dropna()
    best_corr = 0
    best_lag = 0
    for lag_months in range(-12, 13):  # negative = indicator leads
        lag_days = lag_months * 21
        shifted = aligned["indicator"].shift(lag_days)
        valid = pd.DataFrame({"ind": shifted, "spy": aligned["spy"]}).dropna()
        if len(valid) > 100:
            c = valid["ind"].corr(valid["spy"])
            if abs(c) > abs(best_corr):
                best_corr = c
                best_lag = lag_months
    direction = "leads" if best_lag < 0 else "lags" if best_lag > 0 else "coincident"
    print(f"  {name:<25} {abs(best_lag):>6} mo ({direction:>10}) {best_corr:>14.3f}")

print("\n  -> The yield curve is a classic leading indicator.")
print("  -> VIX tends to spike during crises (coincident/slightly lagging).")

print("\n  KEY TAKEAWAYS")
print("  1. Macro indicators move in cycles; recessions are part of the cycle.")
print("  2. The yield curve (10Y-3M spread) is a reliable recession predictor.")
print("  3. The Phillips Curve relationship has weakened in modern economies.")
print("  4. Leading indicators (yield curve, stock market) forecast downturns;")
print("     lagging indicators (unemployment, CPI) confirm them after the fact.")
print("  5. VIX spikes during crises and can signal market stress.")
print("=" * 70)
