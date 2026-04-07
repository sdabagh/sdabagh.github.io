"""
Module 02 -- Returns, Not Prices
=================================
Prices are non-stationary and hard to compare across assets.
Returns normalize price changes and are the foundation of
nearly all quantitative finance.

Requirements: yfinance, pandas, numpy, matplotlib, statsmodels, scipy
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import adfuller
from scipy import stats

print("=" * 70)
print("MODULE 02 -- Returns, Not Prices")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download S&P 500 Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Downloading S&P 500 (^GSPC) Data ---\n")

df = yf.download("^GSPC", start="2018-01-01", end="2024-12-31", auto_adjust=False)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

prices = df["Close"].dropna()
print(f"Downloaded {len(prices)} daily closing prices.\n")

# ---------------------------------------------------------------------------
# Section 2: Simple Returns vs Log Returns
# ---------------------------------------------------------------------------
print("--- Section 2: Simple Returns vs Log Returns ---")
print("""
Simple return:  R_t = (P_t - P_{t-1}) / P_{t-1}
Log return:     r_t = ln(P_t / P_{t-1})

For small returns, these are nearly identical. Log returns have a key
advantage: they are TIME-ADDITIVE. The multi-period log return is just
the sum of single-period log returns.
""")

simple_returns = prices.pct_change().dropna()
log_returns = np.log(prices / prices.shift(1)).dropna()

print("Comparison of first 5 simple vs log returns:")
comparison = pd.DataFrame({
    "Price": prices.iloc[1:6].values,
    "Simple_Return": simple_returns.iloc[:5].values,
    "Log_Return": log_returns.iloc[:5].values,
    "Difference": (simple_returns.iloc[:5].values - log_returns.iloc[:5].values)
})
print(comparison.to_string(index=False))
print("\nNotice: differences are tiny (< 0.001 for typical daily moves).")

# ---------------------------------------------------------------------------
# Section 3: Stationarity -- ADF Test
# ---------------------------------------------------------------------------
print("\n--- Section 3: Stationarity (ADF Test) ---")
print("""
A stationary time series has constant mean and variance over time.
Prices are NOT stationary (they trend up/down). Returns usually ARE.

The Augmented Dickey-Fuller (ADF) test has:
  H0: The series has a unit root (non-stationary)
  H1: The series is stationary

A small p-value means we REJECT H0 and conclude stationarity.
""")

# Test prices
adf_price = adfuller(prices, maxlag=10, autolag="AIC")
print(f"ADF test on PRICES:")
print(f"  Test statistic: {adf_price[0]:.4f}")
print(f"  p-value:        {adf_price[1]:.4f}")
print(f"  Conclusion:     {'Stationary' if adf_price[1] < 0.05 else 'NON-stationary'}")

# Test returns
adf_ret = adfuller(log_returns, maxlag=10, autolag="AIC")
print(f"\nADF test on LOG RETURNS:")
print(f"  Test statistic: {adf_ret[0]:.4f}")
print(f"  p-value:        {adf_ret[1]:.6f}")
print(f"  Conclusion:     {'Stationary' if adf_ret[1] < 0.05 else 'NON-stationary'}")
print("\nThis is why we work with RETURNS, not prices.")

# ---------------------------------------------------------------------------
# Section 4: Histogram of Returns with Normal Overlay
# ---------------------------------------------------------------------------
print("\n--- Section 4: Distribution of Returns ---")
print("Saving histogram with normal overlay to module_02_histogram.png\n")

mu = log_returns.mean()
sigma = log_returns.std()

fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(log_returns, bins=100, density=True, alpha=0.6,
        color="steelblue", edgecolor="white", label="Empirical")

x_range = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 300)
ax.plot(x_range, stats.norm.pdf(x_range, mu, sigma),
        color="red", linewidth=2, label="Normal fit")

ax.set_title("S&P 500 Daily Log Returns vs Normal Distribution", fontsize=13)
ax.set_xlabel("Log Return")
ax.set_ylabel("Density")
ax.legend()
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_02_histogram.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Section 5: Normality Test (Shapiro-Wilk)
# ---------------------------------------------------------------------------
print("\n--- Section 5: Shapiro-Wilk Test for Normality ---")
print("""
H0: The data comes from a normal distribution.
H1: The data does NOT come from a normal distribution.
""")

# Shapiro-Wilk has a sample size limit; use a subsample if needed
sample = log_returns.values
if len(sample) > 5000:
    sample = np.random.choice(sample, 5000, replace=False)

sw_stat, sw_pval = stats.shapiro(sample)
print(f"Shapiro-Wilk statistic: {sw_stat:.6f}")
print(f"p-value:                {sw_pval:.2e}")
print(f"Conclusion: {'Fail to reject normality' if sw_pval > 0.05 else 'REJECT normality -- returns are NOT normal'}")
print("\n(We will explore WHY in Module 03 -- fat tails.)")

# ---------------------------------------------------------------------------
# Section 6: Additivity of Log Returns
# ---------------------------------------------------------------------------
print("\n--- Section 6: Log Returns Are Additive ---")
print("""
A key property: the cumulative log return over N days equals the SUM
of the daily log returns. This does NOT hold for simple returns.

  r(t, t+N) = r_t + r_{t+1} + ... + r_{t+N-1}
""")

# Demonstrate with first 20 trading days
window = 20
cumulative_log = log_returns.iloc[:window].sum()
actual_log = np.log(prices.iloc[window] / prices.iloc[0])

cumulative_simple = (1 + simple_returns.iloc[:window]).prod() - 1
actual_simple = (prices.iloc[window] - prices.iloc[0]) / prices.iloc[0]

print(f"Over the first {window} trading days:")
print(f"  Sum of daily log returns:      {cumulative_log:.6f}")
print(f"  Actual log return (ln ratio):  {actual_log:.6f}")
print(f"  Match: {np.isclose(cumulative_log, actual_log, atol=1e-10)}")

print(f"\n  Product-based simple return:   {cumulative_simple:.6f}")
print(f"  Actual simple return:          {actual_simple:.6f}")
print(f"  Match: {np.isclose(cumulative_simple, actual_simple, atol=1e-10)}")
print("\nBoth methods agree, but log returns use simple ADDITION, which is")
print("mathematically convenient for aggregation and modeling.")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 02:")
print("  1. Always analyze RETURNS, not raw prices.")
print("  2. Log returns are additive over time; simple returns are not.")
print("  3. Returns are (approximately) stationary; prices are not.")
print("  4. Real returns are NOT normally distributed -- more on this next.")
print("\n" + "=" * 70)
print("End of Module 02")
print("=" * 70)
