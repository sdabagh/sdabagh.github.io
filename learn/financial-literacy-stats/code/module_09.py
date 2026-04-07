"""
Module 09 -- Efficient Market Tests
=====================================
The Efficient Market Hypothesis (EMH) states that prices fully reflect
all available information. We test weak-form efficiency using
autocorrelation tests, variance ratio tests, runs tests, and a simple
event study around the COVID-19 crash.

Requirements: yfinance, pandas, numpy, matplotlib, scipy, statsmodels
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from statsmodels.stats.diagnostic import acorr_ljungbox

print("=" * 70)
print("MODULE 09 -- Efficient Market Tests")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download S&P 500 Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Data Preparation ---\n")

df = yf.download("^GSPC", start="2010-01-01", end="2024-12-31",
                 auto_adjust=False)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

prices = df["Close"].dropna()
returns = prices.pct_change().dropna()

print(f"S&P 500 daily returns: {len(returns)} observations")
print(f"Period: {returns.index.min().date()} to {returns.index.max().date()}\n")

# ---------------------------------------------------------------------------
# Section 2: Autocorrelation Test (Ljung-Box)
# ---------------------------------------------------------------------------
print("--- Section 2: Ljung-Box Autocorrelation Test ---")
print("""
If markets are efficient, past returns should NOT predict future returns.
The Ljung-Box test checks whether autocorrelations at multiple lags are
jointly zero.

  H0: No autocorrelation up to lag k (consistent with efficiency)
  H1: Significant autocorrelation exists (predictability!)
""")

lb_result = acorr_ljungbox(returns, lags=[1, 5, 10, 20], return_df=True)
print(lb_result.to_string())
print()

for lag in [1, 5, 10, 20]:
    pval = lb_result.loc[lag, "lb_pvalue"]
    status = "REJECT H0 (autocorrelation detected)" if pval < 0.05 else "Fail to reject H0 (no autocorrelation)"
    print(f"  Lag {lag:>2}: p-value = {pval:.4f}  ->  {status}")

# ---------------------------------------------------------------------------
# Section 3: Variance Ratio Test
# ---------------------------------------------------------------------------
print("\n\n--- Section 3: Variance Ratio Test ---")
print("""
Under a random walk, the variance of k-period returns should be k times
the variance of 1-period returns. The variance ratio = Var(k) / [k * Var(1)].

  VR = 1  ->  consistent with random walk (efficient market)
  VR != 1 ->  evidence against random walk
""")

def variance_ratio_test(returns_series, k):
    """Compute variance ratio and its z-statistic (Lo-MacKinlay)."""
    T = len(returns_series)
    mu = returns_series.mean()

    # Variance of 1-period returns
    var_1 = returns_series.var()

    # Variance of k-period returns
    k_returns = returns_series.rolling(k).sum().dropna()
    var_k = k_returns.var()

    # Variance ratio
    vr = var_k / (k * var_1)

    # Asymptotic z-statistic under homoscedasticity
    z = (vr - 1) / np.sqrt(2 * (2 * k - 1) * (k - 1) / (3 * k * T))
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))

    return vr, z, p_value

print(f"  {'k':>4} {'VR(k)':>10} {'z-stat':>10} {'p-value':>10} {'Conclusion':>30}")
print(f"  {'-'*4} {'-'*10} {'-'*10} {'-'*10} {'-'*30}")

for k in [2, 5, 10, 20]:
    vr, z, p = variance_ratio_test(returns, k)
    conclusion = "Reject RW" if p < 0.05 else "Fail to reject RW"
    print(f"  {k:>4} {vr:>10.4f} {z:>10.4f} {p:>10.4f} {conclusion:>30}")

# ---------------------------------------------------------------------------
# Section 4: Runs Test for Randomness
# ---------------------------------------------------------------------------
print("\n\n--- Section 4: Runs Test ---")
print("""
A 'run' is a consecutive sequence of positive or negative returns.
If returns are random, the number of runs should match a known
distribution. Too few runs implies trending; too many implies reversal.

  H0: The sequence is random
  H1: The sequence is NOT random
""")

# Classify returns as positive (+) or negative (-)
signs = (returns > 0).astype(int)
n_pos = signs.sum()
n_neg = len(signs) - n_pos

# Count runs
runs = 1
for i in range(1, len(signs)):
    if signs.iloc[i] != signs.iloc[i - 1]:
        runs += 1

# Expected runs and standard deviation under H0
n = len(signs)
expected_runs = (2 * n_pos * n_neg) / n + 1
std_runs = np.sqrt((2 * n_pos * n_neg * (2 * n_pos * n_neg - n)) /
                   (n ** 2 * (n - 1)))

z_runs = (runs - expected_runs) / std_runs
p_runs = 2 * (1 - stats.norm.cdf(abs(z_runs)))

print(f"  Total observations:  {n}")
print(f"  Positive returns:    {n_pos}")
print(f"  Negative returns:    {n_neg}")
print(f"  Actual runs:         {runs}")
print(f"  Expected runs (H0):  {expected_runs:.1f}")
print(f"  z-statistic:         {z_runs:.4f}")
print(f"  p-value:             {p_runs:.4f}")
print(f"  Conclusion:          {'REJECT randomness' if p_runs < 0.05 else 'Fail to reject randomness'}")

# ---------------------------------------------------------------------------
# Section 5: Event Study -- COVID-19 Crash
# ---------------------------------------------------------------------------
print("\n\n--- Section 5: Event Study -- COVID-19 Market Crash ---")
print("""
An event study examines how prices react to a specific event.
The Efficient Market Hypothesis predicts that prices adjust QUICKLY
and FULLY to new information, with no drift afterward.

Event: WHO declares COVID-19 a pandemic on March 11, 2020.
We examine the S&P 500 in a window around this date.
""")

event_date = pd.Timestamp("2020-03-11")
pre_window = 30   # trading days before event
post_window = 30  # trading days after event

# Find the event date index
event_idx = returns.index.get_indexer([event_date], method="nearest")[0]
window_returns = returns.iloc[event_idx - pre_window: event_idx + post_window + 1]

# Compute cumulative abnormal returns (using mean return as "normal")
# Estimation window: 250 to 60 days before event
est_returns = returns.iloc[event_idx - 250: event_idx - 60]
normal_return = est_returns.mean()

abnormal_returns = window_returns - normal_return
car = abnormal_returns.cumsum()

# Re-index relative to event
relative_days = np.arange(-pre_window, post_window + 1)

print(f"Event date:              {event_date.date()}")
print(f"Normal (expected) return: {normal_return:.6f} daily")
print(f"Estimation window:       {returns.index[event_idx-250].date()} to "
      f"{returns.index[event_idx-60].date()}")
print(f"\nCumulative Abnormal Return at key points:")
print(f"  Day -5:   {car.iloc[pre_window - 5]:.4f}  ({car.iloc[pre_window - 5]:.2%})")
print(f"  Day  0:   {car.iloc[pre_window]:.4f}  ({car.iloc[pre_window]:.2%})")
print(f"  Day +5:   {car.iloc[pre_window + 5]:.4f}  ({car.iloc[pre_window + 5]:.2%})")
print(f"  Day +10:  {car.iloc[pre_window + 10]:.4f}  ({car.iloc[pre_window + 10]:.2%})")
print(f"  Day +30:  {car.iloc[-1]:.4f}  ({car.iloc[-1]:.2%})")

# Plot event study
fig, axes = plt.subplots(2, 1, figsize=(12, 9))

# Panel 1: Daily returns around event
ax = axes[0]
colors = ["red" if r < 0 else "green" for r in window_returns]
ax.bar(relative_days[:len(window_returns)], window_returns.values,
       color=colors, alpha=0.6, width=0.8)
ax.axvline(0, color="black", linewidth=2, linestyle="--", label="Event Day")
ax.set_title("S&P 500 Daily Returns Around COVID-19 Pandemic Declaration", fontsize=12)
ax.set_xlabel("Trading Days Relative to Event")
ax.set_ylabel("Daily Return")
ax.legend()
ax.grid(True, alpha=0.3)

# Panel 2: Cumulative abnormal returns
ax = axes[1]
ax.plot(relative_days[:len(car)], car.values, color="steelblue", linewidth=2)
ax.axvline(0, color="black", linewidth=2, linestyle="--", label="Event Day")
ax.axhline(0, color="gray", linewidth=0.5)
ax.fill_between(relative_days[:len(car)], car.values, 0,
                alpha=0.2, color="steelblue")
ax.set_title("Cumulative Abnormal Returns (CAR)", fontsize=12)
ax.set_xlabel("Trading Days Relative to Event")
ax.set_ylabel("CAR")
ax.legend()
ax.grid(True, alpha=0.3)

fig.tight_layout()
fig.savefig("module_09_event_study.png", dpi=150)
plt.close(fig)
print("\nSaved event study plot to module_09_event_study.png")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 09:")
print("  1. Ljung-Box tests whether returns are autocorrelated (predictable).")
print("  2. Variance ratio tests the random walk hypothesis directly.")
print("  3. The runs test checks if sign sequences are random.")
print("  4. Event studies measure how quickly prices incorporate news.")
print("  5. Markets are 'mostly' efficient -- small anomalies exist.")
print("\n" + "=" * 70)
print("End of Module 09")
print("=" * 70)
