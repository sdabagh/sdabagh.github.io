"""
Module 03 -- Fat Tails & Stylized Facts
=========================================
Real financial returns deviate from the normal distribution in
systematic ways known as "stylized facts." This module explores
fat tails, volatility clustering, and formal statistical tests.

Requirements: yfinance, pandas, numpy, matplotlib, scipy, statsmodels
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from statsmodels.graphics.tsaplots import plot_acf

print("=" * 70)
print("MODULE 03 -- Fat Tails & Stylized Facts")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download Data and Compute Returns
# ---------------------------------------------------------------------------
print("\n--- Section 1: Data Preparation ---\n")

df = yf.download("^GSPC", start="2005-01-01", end="2024-12-31", auto_adjust=False)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

returns = np.log(df["Close"] / df["Close"].shift(1)).dropna()
print(f"S&P 500 log returns: {len(returns)} observations")
print(f"Mean:   {returns.mean():.6f}")
print(f"Std:    {returns.std():.6f}\n")

# ---------------------------------------------------------------------------
# Section 2: Kurtosis and Skewness
# ---------------------------------------------------------------------------
print("--- Section 2: Kurtosis and Skewness ---")
print("""
Skewness measures asymmetry. Negative skew means the left tail is longer
(more extreme losses than gains).

Kurtosis measures tail heaviness. A normal distribution has kurtosis = 3.
Excess kurtosis = kurtosis - 3. Financial returns typically show POSITIVE
excess kurtosis (fat tails = more extreme events than normal predicts).
""")

skew = stats.skew(returns)
kurt = stats.kurtosis(returns, fisher=False)  # fisher=False gives raw kurtosis
excess_kurt = kurt - 3

print(f"Skewness:        {skew:.4f}  (normal = 0)")
print(f"Kurtosis:        {kurt:.4f}  (normal = 3)")
print(f"Excess Kurtosis: {excess_kurt:.4f}")
print(f"\nInterpretation: excess kurtosis of {excess_kurt:.1f} means extreme")
print("events occur FAR more often than a normal model predicts.")

# ---------------------------------------------------------------------------
# Section 3: QQ Plot
# ---------------------------------------------------------------------------
print("\n--- Section 3: QQ Plot ---")
print("A QQ plot compares empirical quantiles to theoretical normal quantiles.")
print("If data were normal, points would lie on the red diagonal line.")
print("Saving to module_03_qqplot.png\n")

fig, ax = plt.subplots(figsize=(7, 7))
stats.probplot(returns, dist="norm", plot=ax)
ax.set_title("QQ Plot: S&P 500 Returns vs Normal", fontsize=13)
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_03_qqplot.png", dpi=150)
plt.close(fig)
print("Plot saved. Notice the S-curve at the tails -- classic fat tails.")

# ---------------------------------------------------------------------------
# Section 4: Autocorrelation of Returns vs Absolute Returns
# ---------------------------------------------------------------------------
print("\n--- Section 4: Autocorrelation -- Volatility Clustering ---")
print("""
Stylized fact: raw returns show little autocorrelation (prices are hard
to predict), BUT absolute/squared returns show STRONG autocorrelation.
This is volatility clustering: large moves tend to follow large moves.
""")

fig, axes = plt.subplots(1, 3, figsize=(16, 4))

plot_acf(returns, lags=30, ax=axes[0], title="ACF of Returns")
plot_acf(returns.abs(), lags=30, ax=axes[1], title="ACF of |Returns|")
plot_acf(returns ** 2, lags=30, ax=axes[2], title="ACF of Returns^2")

for ax_item in axes:
    ax_item.grid(True, alpha=0.3)

fig.suptitle("Autocorrelation: Returns vs Absolute/Squared Returns", fontsize=13)
fig.tight_layout()
fig.savefig("module_03_autocorrelation.png", dpi=150)
plt.close(fig)
print("Saved to module_03_autocorrelation.png")
print("The middle and right plots show persistent autocorrelation --")
print("this IS volatility clustering.\n")

# ---------------------------------------------------------------------------
# Section 5: Jarque-Bera Test
# ---------------------------------------------------------------------------
print("--- Section 5: Jarque-Bera Test for Normality ---")
print("""
The Jarque-Bera test checks whether skewness and kurtosis jointly match
a normal distribution. It is the standard normality test in finance.

  H0: Returns are normally distributed
  H1: Returns are NOT normally distributed
""")

jb_stat, jb_pval = stats.jarque_bera(returns)
print(f"Jarque-Bera statistic: {jb_stat:.2f}")
print(f"p-value:               {jb_pval:.2e}")
print(f"Conclusion: {'Fail to reject normality' if jb_pval > 0.05 else 'REJECT normality (as expected)'}")

# ---------------------------------------------------------------------------
# Section 6: Student's t-Distribution Fit
# ---------------------------------------------------------------------------
print("\n--- Section 6: Student's t-Distribution Fit ---")
print("""
Since returns have fat tails, a Student's t-distribution often fits
better than a normal. The t-distribution has a 'degrees of freedom'
parameter (df). Lower df = fatter tails. df -> infinity = normal.
""")

# Fit t-distribution
df_t, loc_t, scale_t = stats.t.fit(returns)
print(f"Fitted t-distribution parameters:")
print(f"  Degrees of freedom (df): {df_t:.2f}")
print(f"  Location (mu):           {loc_t:.6f}")
print(f"  Scale (sigma):           {scale_t:.6f}")
print(f"\nA df of ~{df_t:.0f} implies substantially fatter tails than normal.")

# Visual comparison
fig, ax = plt.subplots(figsize=(10, 5))
x = np.linspace(returns.min(), returns.max(), 500)

ax.hist(returns, bins=150, density=True, alpha=0.5,
        color="steelblue", edgecolor="white", label="Empirical")
ax.plot(x, stats.norm.pdf(x, returns.mean(), returns.std()),
        "r-", linewidth=2, label="Normal fit")
ax.plot(x, stats.t.pdf(x, df_t, loc_t, scale_t),
        "g--", linewidth=2, label=f"Student-t fit (df={df_t:.1f})")

ax.set_title("Returns: Normal vs Student-t Fit", fontsize=13)
ax.set_xlabel("Log Return")
ax.set_ylabel("Density")
ax.set_xlim(-0.06, 0.06)
ax.legend()
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_03_t_vs_normal.png", dpi=150)
plt.close(fig)
print("\nSaved comparison plot to module_03_t_vs_normal.png")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 03:")
print("  1. Financial returns have FAT TAILS (excess kurtosis >> 0).")
print("  2. Returns show slight negative skew (crashes > rallies).")
print("  3. Volatility clusters: big moves follow big moves.")
print("  4. The normal distribution is a poor model for returns.")
print("  5. The Student's t-distribution captures fat tails better.")
print("\n" + "=" * 70)
print("End of Module 03")
print("=" * 70)
