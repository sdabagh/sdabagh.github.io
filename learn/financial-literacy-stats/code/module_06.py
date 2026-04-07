"""
Module 06 -- Risk Measures
===========================
Risk is not just volatility. This module computes and compares multiple
risk measures: standard deviation, semi-deviation, Value at Risk (VaR),
Conditional VaR (CVaR / Expected Shortfall), and maximum drawdown.

Requirements: yfinance, pandas, numpy, matplotlib, scipy
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

print("=" * 70)
print("MODULE 06 -- Risk Measures")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Data Preparation ---\n")

df = yf.download("AAPL", start="2015-01-01", end="2024-12-31", auto_adjust=False)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

prices = df["Close"].dropna()
returns = prices.pct_change().dropna()

print(f"AAPL daily returns: {len(returns)} observations")
print(f"Period: {returns.index.min().date()} to {returns.index.max().date()}\n")

# ---------------------------------------------------------------------------
# Section 2: Standard Deviation and Semi-Deviation
# ---------------------------------------------------------------------------
print("--- Section 2: Standard Deviation & Semi-Deviation ---")
print("""
Standard deviation treats upside and downside moves equally.
Semi-deviation (downside deviation) only considers NEGATIVE returns,
which is often more relevant for risk-averse investors.
""")

std_daily = returns.std()
std_annual = std_daily * np.sqrt(252)

# Semi-deviation: std of returns below the mean
downside = returns[returns < returns.mean()]
semi_dev_daily = downside.std()
semi_dev_annual = semi_dev_daily * np.sqrt(252)

print(f"Daily standard deviation:    {std_daily:.6f}")
print(f"Annualized std deviation:    {std_annual:.4f}  ({std_annual:.2%})")
print(f"Daily semi-deviation:        {semi_dev_daily:.6f}")
print(f"Annualized semi-deviation:   {semi_dev_annual:.4f}  ({semi_dev_annual:.2%})")

# ---------------------------------------------------------------------------
# Section 3: Value at Risk (VaR)
# ---------------------------------------------------------------------------
print("\n--- Section 3: Value at Risk (VaR) ---")
print("""
VaR answers: "What is the WORST loss I can expect at a given confidence
level over a given time horizon?"

  - Historical VaR: use the empirical distribution of past returns
  - Parametric VaR: assume returns are normal, use mean/std

At the 95% confidence level, VaR is the 5th percentile of returns.
""")

confidence = 0.95
alpha = 1 - confidence

# Historical VaR
var_hist = np.percentile(returns, alpha * 100)
print(f"Historical VaR (95%, 1-day):   {var_hist:.6f}  ({var_hist:.4%})")

# Parametric VaR (assumes normality)
var_param = returns.mean() + stats.norm.ppf(alpha) * returns.std()
print(f"Parametric VaR (95%, 1-day):   {var_param:.6f}  ({var_param:.4%})")

# Also compute 99% VaR
var_hist_99 = np.percentile(returns, 1)
var_param_99 = returns.mean() + stats.norm.ppf(0.01) * returns.std()
print(f"\nHistorical VaR (99%, 1-day):   {var_hist_99:.6f}  ({var_hist_99:.4%})")
print(f"Parametric VaR (99%, 1-day):   {var_param_99:.6f}  ({var_param_99:.4%})")
print("\nNote: parametric VaR underestimates risk when returns have fat tails.")

# ---------------------------------------------------------------------------
# Section 4: Conditional VaR (CVaR / Expected Shortfall)
# ---------------------------------------------------------------------------
print("\n--- Section 4: Conditional VaR (CVaR) ---")
print("""
CVaR (also called Expected Shortfall) answers: "Given that we are in
the worst alpha% of outcomes, what is the AVERAGE loss?"

CVaR is always worse (more negative) than VaR. It captures tail risk
better because it averages over all extreme losses, not just the cutoff.
""")

# Historical CVaR: average of returns below VaR
tail_returns = returns[returns <= var_hist]
cvar_hist = tail_returns.mean()

# Parametric CVaR (normal assumption)
cvar_param = returns.mean() - returns.std() * stats.norm.pdf(stats.norm.ppf(alpha)) / alpha

print(f"Historical CVaR (95%, 1-day):  {cvar_hist:.6f}  ({cvar_hist:.4%})")
print(f"Parametric CVaR (95%, 1-day):  {cvar_param:.6f}  ({cvar_param:.4%})")

# ---------------------------------------------------------------------------
# Section 5: Maximum Drawdown
# ---------------------------------------------------------------------------
print("\n--- Section 5: Maximum Drawdown ---")
print("""
Maximum drawdown measures the largest peak-to-trough decline in
portfolio value. It answers: "What was the worst losing streak?"

This is the risk measure most felt by real investors -- it represents
the maximum pain of holding through a downturn.
""")

cumulative = (1 + returns).cumprod()
running_max = cumulative.cummax()
drawdown = (cumulative - running_max) / running_max
max_dd = drawdown.min()
max_dd_date = drawdown.idxmin()

# Find the peak date before the max drawdown
peak_date = cumulative.loc[:max_dd_date].idxmax()

print(f"Maximum Drawdown:  {max_dd:.4f}  ({max_dd:.2%})")
print(f"Peak date:         {peak_date.date()}")
print(f"Trough date:       {max_dd_date.date()}")

# ---------------------------------------------------------------------------
# Section 6: Summary Comparison Table
# ---------------------------------------------------------------------------
print("\n--- Section 6: Risk Measures Summary ---\n")

summary = pd.DataFrame({
    "Measure": [
        "Daily Std Dev", "Annualized Std Dev",
        "Daily Semi-Dev", "Annualized Semi-Dev",
        "VaR 95% (Historical)", "VaR 95% (Parametric)",
        "VaR 99% (Historical)", "VaR 99% (Parametric)",
        "CVaR 95% (Historical)", "CVaR 95% (Parametric)",
        "Maximum Drawdown"
    ],
    "Value": [
        f"{std_daily:.6f}", f"{std_annual:.4f}",
        f"{semi_dev_daily:.6f}", f"{semi_dev_annual:.4f}",
        f"{var_hist:.6f}", f"{var_param:.6f}",
        f"{var_hist_99:.6f}", f"{var_param_99:.6f}",
        f"{cvar_hist:.6f}", f"{cvar_param:.6f}",
        f"{max_dd:.4f}"
    ]
})
print(summary.to_string(index=False))

# ---------------------------------------------------------------------------
# Section 7: Loss Distribution Plot with VaR and CVaR
# ---------------------------------------------------------------------------
print("\n\n--- Section 7: Plotting the Loss Distribution ---")
print("Saving to module_06_risk_measures.png\n")

fig, axes = plt.subplots(2, 1, figsize=(12, 9))

# Panel 1: Return distribution with VaR/CVaR lines
ax = axes[0]
ax.hist(returns, bins=100, density=True, alpha=0.6, color="steelblue",
        edgecolor="white")
ax.axvline(var_hist, color="orange", linewidth=2, linestyle="--",
           label=f"VaR 95%: {var_hist:.4f}")
ax.axvline(cvar_hist, color="red", linewidth=2, linestyle="-",
           label=f"CVaR 95%: {cvar_hist:.4f}")
ax.axvline(var_hist_99, color="darkred", linewidth=2, linestyle=":",
           label=f"VaR 99%: {var_hist_99:.4f}")
ax.set_title("AAPL Return Distribution with Risk Measures", fontsize=13)
ax.set_xlabel("Daily Return")
ax.set_ylabel("Density")
ax.legend()
ax.grid(True, alpha=0.3)

# Panel 2: Drawdown over time
ax = axes[1]
ax.fill_between(drawdown.index, drawdown.values, 0, alpha=0.5, color="red")
ax.set_title("AAPL Drawdown Over Time", fontsize=13)
ax.set_xlabel("Date")
ax.set_ylabel("Drawdown")
ax.grid(True, alpha=0.3)

fig.tight_layout()
fig.savefig("module_06_risk_measures.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 06:")
print("  1. Standard deviation treats gains and losses symmetrically.")
print("  2. Semi-deviation focuses on downside risk only.")
print("  3. VaR gives a threshold loss; CVaR averages beyond that threshold.")
print("  4. Parametric methods underestimate tail risk (fat tails!).")
print("  5. Maximum drawdown captures the worst cumulative loss period.")
print("\n" + "=" * 70)
print("End of Module 06")
print("=" * 70)
