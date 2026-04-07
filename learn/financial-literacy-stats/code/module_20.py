"""
Module 20: Reading Financial News
====================================
Topics covered:
  - How different time windows change the narrative (pick start dates)
  - How axes manipulation changes chart perception
  - Compute actual statistics behind common financial claims
  - Generate 'misleading' vs 'honest' versions of the same chart
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 20 : Reading Financial News -- Chart Literacy")
print("=" * 70)

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
print("\n--- Loading S&P 500 data ---")
spy = yf.download("SPY", start="2000-01-01", auto_adjust=True, progress=False)["Close"]
if isinstance(spy, pd.DataFrame):
    spy = spy.iloc[:, 0]
spy = spy.dropna()
print(f"Date range: {spy.index[0].date()} to {spy.index[-1].date()}")

# ---------------------------------------------------------------------------
# 1. How start-date selection changes the narrative
# ---------------------------------------------------------------------------
print("\n--- 1. Start-Date Manipulation ---")
print("  The same data tells completely different stories depending on when")
print("  you start the chart. Financial media often cherry-pick start dates.\n")

start_dates = {
    "From Mar 2009 (post-crash bottom)": "2009-03-09",
    "From Oct 2007 (pre-crash peak)": "2007-10-09",
    "From Jan 2000 (dot-com peak)": "2000-01-03",
    "From Mar 2020 (COVID bottom)": "2020-03-23",
}

for label, date in start_dates.items():
    subset = spy.loc[date:]
    total_ret = (subset.iloc[-1] / subset.iloc[0] - 1)
    years = (subset.index[-1] - subset.index[0]).days / 365.25
    ann_ret = (1 + total_ret) ** (1 / years) - 1 if years > 0 else 0
    print(f"  {label}")
    print(f"    Total return : {total_ret:>+.1%}")
    print(f"    Annualized   : {ann_ret:>+.1%}")
    print(f"    Years        : {years:.1f}\n")

print("  -> A headline saying 'stocks up 500%' or 'stocks flat for a decade'")
print("     can BOTH be true depending on the start date chosen.")

# ---------------------------------------------------------------------------
# 2. Misleading vs honest chart: y-axis manipulation
# ---------------------------------------------------------------------------
print("\n--- 2. Y-Axis Manipulation ---")
print("  Truncating the y-axis exaggerates movements. Starting at 0 gives context.\n")

recent = spy.loc["2023-01-01":]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Misleading: truncated y-axis (auto-scaled)
ax1.plot(recent.index, recent, "r-", linewidth=2)
ax1.set_title("MISLEADING: Truncated Y-Axis\n(Looks like a crash!)", fontsize=12, color="red")
ax1.set_ylabel("Price ($)")
ax1.set_xlabel("Date")
ax1.grid(True, alpha=0.3)
# Force tight y-limits to exaggerate
y_min, y_max = recent.min() * 0.998, recent.max() * 1.002
ax1.set_ylim(y_min, y_max)

# Honest: y-axis from 0
ax2.plot(recent.index, recent, "b-", linewidth=2)
ax2.set_title("HONEST: Y-Axis from Zero\n(Proper context)", fontsize=12, color="blue")
ax2.set_ylabel("Price ($)")
ax2.set_xlabel("Date")
ax2.set_ylim(0, recent.max() * 1.1)
ax2.grid(True, alpha=0.3)

plt.suptitle("Same Data, Different Perception", fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig("module_20_yaxis.png", dpi=150)
plt.show()
print("Y-axis comparison saved as module_20_yaxis.png")

# ---------------------------------------------------------------------------
# 3. Time window manipulation
# ---------------------------------------------------------------------------
print("\n--- 3. Time Window Manipulation ---")
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

windows = [
    ("2007-10-01", "2009-03-31", "Bearish Narrative:\n'Market Crashed 50%!'", "red"),
    ("2009-03-01", "2021-12-31", "Bullish Narrative:\n'Longest Bull Run in History!'", "green"),
    ("2000-01-01", "2013-01-01", "Stagnation Narrative:\n'Lost Decade for Stocks'", "orange"),
    ("2000-01-01", None, "Full Picture:\n'Long-Term Growth with Volatility'", "blue"),
]

for ax, (start, end, title, color) in zip(axes.flat, windows):
    subset = spy.loc[start:end] if end else spy.loc[start:]
    ax.plot(subset.index, subset, color=color, linewidth=1.5)
    ax.set_title(title, fontsize=11, color=color, fontweight="bold")
    ax.set_ylabel("SPY Price ($)")
    ax.grid(True, alpha=0.3)
    total = subset.iloc[-1] / subset.iloc[0] - 1
    ax.annotate(f"Return: {total:+.1%}", xy=(0.02, 0.92), xycoords="axes fraction",
                fontsize=11, fontweight="bold",
                bbox=dict(boxstyle="round", facecolor="white", alpha=0.8))

plt.suptitle("Same Stock (SPY): Four Different Stories", fontsize=14)
plt.tight_layout()
plt.savefig("module_20_windows.png", dpi=150)
plt.show()
print("Time window comparison saved as module_20_windows.png")

# ---------------------------------------------------------------------------
# 4. Common financial claims: the actual statistics
# ---------------------------------------------------------------------------
print("\n--- 4. Reality Behind Common Financial Claims ---\n")

annual_ret = spy.resample("YE").last().pct_change().dropna()

print("  Claim: 'The stock market returns ~10% per year on average.'")
avg_ret = annual_ret.mean()
med_ret = annual_ret.median()
print(f"    Arithmetic mean annual return : {avg_ret:.1%}")
print(f"    Median annual return          : {med_ret:.1%}")
print(f"    Standard deviation            : {annual_ret.std():.1%}")
print(f"    Worst year                    : {annual_ret.min():.1%}")
print(f"    Best year                     : {annual_ret.max():.1%}")
print(f"    % of years with positive return: {(annual_ret > 0).mean():.0%}")
print("    -> The 'average' hides massive year-to-year variation.\n")

print("  Claim: 'Time in the market beats timing the market.'")
# Missing the best N days
daily_ret = spy.pct_change().dropna()
total_days = len(daily_ret)
full_return = (1 + daily_ret).prod() - 1
for n_missed in [5, 10, 20, 30]:
    top_days = daily_ret.nlargest(n_missed)
    without = daily_ret.drop(top_days.index)
    missed_ret = (1 + without).prod() - 1
    print(f"    Missing the best {n_missed:>2} days out of {total_days}: "
          f"return drops from {full_return:+.1%} to {missed_ret:+.1%}")
print("    -> Missing just a few exceptional days devastates long-term returns.\n")

# But also: missing the WORST days
print("  But what if you missed the WORST days?")
for n_missed in [5, 10, 20, 30]:
    worst_days = daily_ret.nsmallest(n_missed)
    without = daily_ret.drop(worst_days.index)
    missed_ret = (1 + without).prod() - 1
    print(f"    Missing the worst {n_missed:>2} days: return improves to {missed_ret:+.1%}")
print("    -> The best and worst days often cluster. You cannot cherry-pick.\n")

# ---------------------------------------------------------------------------
# 5. Linear vs log scale
# ---------------------------------------------------------------------------
print("--- 5. Linear vs Log Scale ---")
print("  Linear scale makes recent moves look huge and old moves invisible.")
print("  Log scale shows proportional changes correctly.\n")

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(spy.index, spy, "b-", linewidth=1)
ax1.set_title("Linear Scale\n(Recent moves look enormous)", fontsize=12)
ax1.set_ylabel("Price ($)")
ax1.grid(True, alpha=0.3)

ax2.plot(spy.index, spy, "b-", linewidth=1)
ax2.set_yscale("log")
ax2.set_title("Log Scale\n(Proportional changes shown correctly)", fontsize=12)
ax2.set_ylabel("Price ($ , log scale)")
ax2.grid(True, alpha=0.3)

plt.suptitle("SPY Since 2000: Scale Matters", fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig("module_20_log_scale.png", dpi=150)
plt.show()
print("Log vs linear scale plot saved as module_20_log_scale.png")

print("\n  KEY TAKEAWAYS")
print("  1. Start dates, time windows, and y-axis choices all shape narratives.")
print("  2. Always ask: What is the starting point? Is the y-axis truncated?")
print("  3. Log scale is more honest for long time series.")
print("  4. 'Average' returns hide enormous variation; median tells a different story.")
print("  5. Missing best/worst days arguments are symmetric; the real lesson is")
print("     that market timing is extremely difficult.")
print("=" * 70)
