"""
Module 04 -- Correlation in Finance
=====================================
Correlation measures how assets move together. Understanding it is
critical for diversification and risk management. This module covers
multiple correlation measures, rolling correlation, and how correlation
can break down during crises.

Requirements: yfinance, pandas, numpy, matplotlib, seaborn, scipy
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

print("=" * 70)
print("MODULE 04 -- Correlation in Finance")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download Multi-Asset Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Downloading Multi-Asset Data ---\n")

tickers = {
    "SPY": "S&P 500 ETF",
    "TLT": "Long-Term Treasury Bond ETF",
    "GLD": "Gold ETF",
    "AAPL": "Apple",
    "XOM": "ExxonMobil",
}

data = yf.download(list(tickers.keys()), start="2015-01-01",
                   end="2024-12-31", auto_adjust=False)

# Extract closing prices
if isinstance(data.columns, pd.MultiIndex):
    prices = data["Close"]
else:
    prices = data[["Close"]]

prices = prices.dropna()
print(f"Downloaded {len(prices)} trading days for {len(tickers)} assets.\n")

# Compute log returns
returns = np.log(prices / prices.shift(1)).dropna()

# ---------------------------------------------------------------------------
# Section 2: Pearson, Spearman, Kendall Correlations
# ---------------------------------------------------------------------------
print("--- Section 2: Three Types of Correlation ---")
print("""
Pearson:  Measures LINEAR co-movement. Sensitive to outliers.
Spearman: Rank-based. Captures monotonic (not just linear) relationships.
Kendall:  Also rank-based, more robust with small samples.

In normal conditions these give similar results, but they can diverge
when relationships are nonlinear or when extreme events occur.
""")

corr_pearson = returns.corr(method="pearson")
corr_spearman = returns.corr(method="spearman")
corr_kendall = returns.corr(method="kendall")

print("Pearson Correlation Matrix:")
print(corr_pearson.round(3).to_string())
print("\nSpearman Correlation Matrix:")
print(corr_spearman.round(3).to_string())
print("\nKendall Correlation Matrix:")
print(corr_kendall.round(3).to_string())

# ---------------------------------------------------------------------------
# Section 3: Rolling 60-Day Correlation (Stocks vs Bonds)
# ---------------------------------------------------------------------------
print("\n\n--- Section 3: Rolling 60-Day Correlation (SPY vs TLT) ---")
print("""
Correlation is NOT constant over time. Rolling correlation reveals how
the stock-bond relationship shifts. Historically, stocks and bonds have
been negatively correlated (flight to safety), but this can change.
""")

rolling_corr = returns["SPY"].rolling(window=60).corr(returns["TLT"])

fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(rolling_corr.index, rolling_corr, linewidth=0.8, color="steelblue")
ax.axhline(y=0, color="red", linestyle="--", alpha=0.5)
ax.set_title("Rolling 60-Day Correlation: SPY vs TLT", fontsize=13)
ax.set_xlabel("Date")
ax.set_ylabel("Pearson Correlation")
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_04_rolling_corr.png", dpi=150)
plt.close(fig)
print("Saved to module_04_rolling_corr.png\n")

# ---------------------------------------------------------------------------
# Section 4: Correlation Breakdown During COVID Crash (2020)
# ---------------------------------------------------------------------------
print("--- Section 4: Correlation Breakdown During COVID Crash ---")
print("""
During market crises, correlations often spike -- assets that normally
move independently start moving together. This is exactly when
diversification fails and risk increases.
""")

# Define periods
calm_start, calm_end = "2019-06-01", "2019-12-31"
crisis_start, crisis_end = "2020-02-15", "2020-04-15"

calm_returns = returns.loc[calm_start:calm_end]
crisis_returns = returns.loc[crisis_start:crisis_end]

corr_calm = calm_returns.corr()
corr_crisis = crisis_returns.corr()

print(f"Correlation during CALM period ({calm_start} to {calm_end}):")
print(corr_calm.round(3).to_string())
print(f"\nCorrelation during COVID CRISIS ({crisis_start} to {crisis_end}):")
print(corr_crisis.round(3).to_string())

# Highlight the change for SPY vs other assets
print("\nSPY correlation with other assets:")
print(f"  {'Asset':<6} {'Calm':>8} {'Crisis':>8} {'Change':>8}")
print(f"  {'-'*6} {'-'*8} {'-'*8} {'-'*8}")
for asset in ["TLT", "GLD", "AAPL", "XOM"]:
    c = corr_calm.loc["SPY", asset]
    k = corr_crisis.loc["SPY", asset]
    print(f"  {asset:<6} {c:>8.3f} {k:>8.3f} {k-c:>+8.3f}")

# ---------------------------------------------------------------------------
# Section 5: Correlation Heatmap
# ---------------------------------------------------------------------------
print("\n\n--- Section 5: Correlation Heatmap ---")
print("A heatmap gives an at-a-glance view of the full correlation matrix.")
print("Saving to module_04_heatmap.png\n")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.heatmap(corr_calm, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, ax=axes[0],
            square=True, linewidths=0.5)
axes[0].set_title(f"Calm Period\n{calm_start} to {calm_end}", fontsize=11)

sns.heatmap(corr_crisis, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, ax=axes[1],
            square=True, linewidths=0.5)
axes[1].set_title(f"COVID Crisis\n{crisis_start} to {crisis_end}", fontsize=11)

fig.suptitle("Correlation Heatmaps: Calm vs Crisis", fontsize=14, y=1.02)
fig.tight_layout()
fig.savefig("module_04_heatmap.png", dpi=150, bbox_inches="tight")
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 04:")
print("  1. Pearson, Spearman, and Kendall each measure different aspects.")
print("  2. Correlation is time-varying -- always use rolling windows.")
print("  3. During crises, correlations tend to spike (diversification fails).")
print("  4. The stock-bond correlation is often negative but not guaranteed.")
print("  5. Heatmaps are essential for scanning multi-asset relationships.")
print("\n" + "=" * 70)
print("End of Module 04")
print("=" * 70)
