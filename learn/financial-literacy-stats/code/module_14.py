"""
Module 14: Commodities, Gold & Oil
====================================
Topics covered:
  - Download gold (GC=F) and oil (CL=F) prices via yfinance
  - Compute gold-to-oil ratio; test for mean reversion (ADF)
  - Test gold as inflation hedge: correlate gold returns with CPI proxy
  - Plot gold vs oil with dual y-axis
  - Identify contango/backwardation periods (simulated)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import yfinance as yf
from statsmodels.tsa.stattools import adfuller

print("=" * 70)
print("MODULE 14 : Commodities, Gold & Oil")
print("=" * 70)

# ---------------------------------------------------------------------------
# 1. Download gold and oil price data
# ---------------------------------------------------------------------------
print("\n--- 1. Downloading Gold & Oil Prices ---")
gold = yf.download("GC=F", start="2005-01-01", auto_adjust=True, progress=False)["Close"]
oil  = yf.download("CL=F", start="2005-01-01", auto_adjust=True, progress=False)["Close"]

# Flatten MultiIndex columns if present
if isinstance(gold, pd.DataFrame):
    gold = gold.iloc[:, 0]
if isinstance(oil, pd.DataFrame):
    oil = oil.iloc[:, 0]

# Align dates
df = pd.DataFrame({"Gold": gold, "Oil": oil}).dropna()
print(f"Date range : {df.index[0].date()} to {df.index[-1].date()}")
print(f"Observations: {len(df)}")
print(f"Latest gold : ${df['Gold'].iloc[-1]:,.2f} / oz")
print(f"Latest oil  : ${df['Oil'].iloc[-1]:,.2f} / bbl")

# ---------------------------------------------------------------------------
# 2. Gold-to-oil ratio and mean reversion test
# ---------------------------------------------------------------------------
print("\n--- 2. Gold-to-Oil Ratio & Mean Reversion ---")
df["Ratio"] = df["Gold"] / df["Oil"]
print(f"Current ratio  : {df['Ratio'].iloc[-1]:.1f} barrels of oil per oz gold")
print(f"Historical mean: {df['Ratio'].mean():.1f}")
print(f"Historical std : {df['Ratio'].std():.1f}")

adf_result = adfuller(df["Ratio"].dropna(), maxlag=20, autolag="AIC")
print(f"\nAugmented Dickey-Fuller test on Gold/Oil ratio:")
print(f"  ADF statistic : {adf_result[0]:.4f}")
print(f"  p-value       : {adf_result[1]:.4f}")
print(f"  Critical values: {adf_result[4]}")
if adf_result[1] < 0.05:
    print("  -> Reject unit root: ratio appears mean-reverting (stationary).")
else:
    print("  -> Cannot reject unit root: ratio may be non-stationary.")
print("  Traders use this ratio as a relative-value signal between commodities.")

# ---------------------------------------------------------------------------
# 3. Gold as inflation hedge
# ---------------------------------------------------------------------------
print("\n--- 3. Gold as Inflation Hedge ---")
print("  Using TIPS ETF (TIP) as a CPI / inflation expectations proxy.\n")

tip = yf.download("TIP", start="2005-01-01", auto_adjust=True, progress=False)["Close"]
if isinstance(tip, pd.DataFrame):
    tip = tip.iloc[:, 0]

gold_ret = df["Gold"].pct_change().dropna()
tip_ret  = tip.pct_change().dropna()

# Align
common = gold_ret.index.intersection(tip_ret.index)
corr = gold_ret.loc[common].corr(tip_ret.loc[common])
print(f"  Correlation of daily returns (Gold vs TIP): {corr:.4f}")

# Annual correlation (less noisy)
gold_ann = gold_ret.resample("YE").sum()
tip_ann  = tip_ret.reindex(gold_ann.index).dropna()
common_ann = gold_ann.index.intersection(tip_ann.index)
if len(common_ann) > 3:
    corr_ann = gold_ann.loc[common_ann].corr(tip_ann.loc[common_ann])
    print(f"  Correlation of annual returns (Gold vs TIP) : {corr_ann:.4f}")
print("  -> Gold has a moderate positive correlation with inflation expectations,")
print("     supporting its role as a partial inflation hedge.")

# ---------------------------------------------------------------------------
# 4. Dual-axis plot: Gold vs Oil
# ---------------------------------------------------------------------------
print("\n--- 4. Dual-Axis Plot: Gold vs Oil ---")

fig, ax1 = plt.subplots(figsize=(12, 6))
color_gold = "#FFD700"
color_oil = "#2E2E2E"

ax1.plot(df.index, df["Gold"], color=color_gold, linewidth=1.5, label="Gold ($/oz)")
ax1.set_xlabel("Date")
ax1.set_ylabel("Gold Price ($/oz)", color=color_gold)
ax1.tick_params(axis="y", labelcolor=color_gold)

ax2 = ax1.twinx()
ax2.plot(df.index, df["Oil"], color=color_oil, linewidth=1.2, alpha=0.7, label="Oil ($/bbl)")
ax2.set_ylabel("Oil Price ($/bbl)", color=color_oil)
ax2.tick_params(axis="y", labelcolor=color_oil)

ax1.set_title("Gold vs Oil Prices")
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left")
ax1.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_14_gold_oil.png", dpi=150)
plt.show()
print("Dual-axis plot saved as module_14_gold_oil.png")

# ---------------------------------------------------------------------------
# 5. Contango / Backwardation (simulated futures term structure)
# ---------------------------------------------------------------------------
print("\n--- 5. Contango vs Backwardation ---")
print("  Contango   : futures price > spot price (normal for storable commodities).")
print("  Backwardation: futures price < spot price (signals supply shortage).\n")

# Simulate term structure snapshots
np.random.seed(42)
months = np.arange(1, 13)
spot_price = df["Oil"].iloc[-1]

# Contango scenario: cost of carry pushes futures up
contango_curve = spot_price * (1 + 0.003 * months + np.random.normal(0, 0.2, len(months)))
# Backwardation scenario: near-term premium
backwardation_curve = spot_price * (1 - 0.005 * months + np.random.normal(0, 0.2, len(months)))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), sharey=True)

ax1.plot(months, contango_curve, "rs-", markersize=6, linewidth=2)
ax1.axhline(spot_price, color="gray", linestyle="--", alpha=0.7, label=f"Spot = ${spot_price:.0f}")
ax1.set_title("Contango (Futures > Spot)")
ax1.set_xlabel("Months to Delivery")
ax1.set_ylabel("Futures Price ($/bbl)")
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.plot(months, backwardation_curve, "bs-", markersize=6, linewidth=2)
ax2.axhline(spot_price, color="gray", linestyle="--", alpha=0.7, label=f"Spot = ${spot_price:.0f}")
ax2.set_title("Backwardation (Futures < Spot)")
ax2.set_xlabel("Months to Delivery")
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.suptitle("Oil Futures Term Structure", fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig("module_14_contango_backwardation.png", dpi=150)
plt.show()
print("Term structure plot saved as module_14_contango_backwardation.png")

# Gold-to-oil ratio plot
fig, ax = plt.subplots(figsize=(12, 4))
ax.plot(df.index, df["Ratio"], color="purple", linewidth=1)
ax.axhline(df["Ratio"].mean(), color="red", linestyle="--", label=f"Mean = {df['Ratio'].mean():.0f}")
ax.fill_between(df.index, df["Ratio"].mean() - df["Ratio"].std(),
                df["Ratio"].mean() + df["Ratio"].std(), alpha=0.15, color="red")
ax.set_title("Gold-to-Oil Ratio Over Time")
ax.set_ylabel("Barrels of Oil per Oz Gold")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_14_ratio.png", dpi=150)
plt.show()
print("Ratio plot saved as module_14_ratio.png")

print("\n  KEY TAKEAWAYS")
print("  1. Gold and oil often move together (both priced in USD, inflation-sensitive).")
print("  2. The gold-to-oil ratio can signal relative value opportunities.")
print("  3. Gold serves as a partial inflation hedge over longer horizons.")
print("  4. Commodity futures markets exhibit contango or backwardation depending")
print("     on supply/demand balance and storage costs.")
print("=" * 70)
