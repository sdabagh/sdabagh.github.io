"""
Module 17: Risk Management
============================
Topics covered:
  - Compute VaR three ways: historical, parametric (normal), Monte Carlo
  - Compute Expected Shortfall (CVaR) for each method
  - Fit Generalized Pareto Distribution to tail losses (Extreme Value Theory)
  - Run a simple stress test: apply 2008-level drawdowns to current portfolio
  - Compare all methods in a summary table
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.stats import norm, genpareto
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 17 : Risk Management")
print("=" * 70)

# ---------------------------------------------------------------------------
# Data: build a simple 60/40 stock/bond portfolio
# ---------------------------------------------------------------------------
print("\n--- Loading portfolio data ---")
tickers = {"SPY": 0.60, "AGG": 0.40}  # 60 % stocks, 40 % bonds
prices = yf.download(list(tickers.keys()), start="2005-01-01",
                     auto_adjust=True, progress=False)["Close"].dropna()
if isinstance(prices.columns, pd.MultiIndex):
    prices.columns = prices.columns.get_level_values(0)

returns = prices.pct_change().dropna()
weights = np.array([tickers[t] for t in returns.columns])
port_ret = returns.dot(weights)

print(f"Portfolio: {tickers}")
print(f"Date range: {port_ret.index[0].date()} to {port_ret.index[-1].date()}")
print(f"Observations: {len(port_ret)}")
print(f"Annualized return : {port_ret.mean() * 252:.2%}")
print(f"Annualized vol    : {port_ret.std() * np.sqrt(252):.2%}")

CONFIDENCE = 0.95
INVESTMENT = 1_000_000  # $1M portfolio

# ---------------------------------------------------------------------------
# 1. Historical VaR & CVaR
# ---------------------------------------------------------------------------
print(f"\n--- 1. Historical VaR & CVaR ({CONFIDENCE:.0%} confidence) ---")
sorted_ret = port_ret.sort_values()
hist_var = -np.percentile(port_ret, (1 - CONFIDENCE) * 100)
hist_cvar = -port_ret[port_ret <= -hist_var].mean()
print(f"  1-day VaR  : {hist_var:.4%}  (${hist_var * INVESTMENT:,.0f} on ${INVESTMENT:,.0f})")
print(f"  1-day CVaR : {hist_cvar:.4%}  (${hist_cvar * INVESTMENT:,.0f})")
print("  -> Historical method uses actual return distribution, no assumptions.")

# ---------------------------------------------------------------------------
# 2. Parametric (Normal) VaR & CVaR
# ---------------------------------------------------------------------------
print(f"\n--- 2. Parametric (Normal) VaR & CVaR ---")
mu = port_ret.mean()
sigma = port_ret.std()
z = norm.ppf(1 - CONFIDENCE)
param_var = -(mu + z * sigma)
# CVaR for normal: E[X | X < VaR] = mu - sigma * phi(z) / (1 - alpha)
param_cvar = -(mu - sigma * norm.pdf(z) / (1 - CONFIDENCE))
print(f"  1-day VaR  : {param_var:.4%}  (${param_var * INVESTMENT:,.0f})")
print(f"  1-day CVaR : {param_cvar:.4%}  (${param_cvar * INVESTMENT:,.0f})")
print("  -> Assumes normally distributed returns. Underestimates tail risk!")

# ---------------------------------------------------------------------------
# 3. Monte Carlo VaR & CVaR
# ---------------------------------------------------------------------------
print(f"\n--- 3. Monte Carlo VaR & CVaR (100,000 simulations) ---")
np.random.seed(42)
n_sims = 100_000
mc_returns = np.random.normal(mu, sigma, n_sims)
mc_var = -np.percentile(mc_returns, (1 - CONFIDENCE) * 100)
mc_cvar = -mc_returns[mc_returns <= -mc_var].mean()
print(f"  1-day VaR  : {mc_var:.4%}  (${mc_var * INVESTMENT:,.0f})")
print(f"  1-day CVaR : {mc_cvar:.4%}  (${mc_cvar * INVESTMENT:,.0f})")
print("  -> MC with normal draws gives similar results to parametric.")
print("     Using fat-tailed distributions (t, skewed-t) improves tail modeling.")

# ---------------------------------------------------------------------------
# 4. Extreme Value Theory: Generalized Pareto Distribution
# ---------------------------------------------------------------------------
print("\n--- 4. Extreme Value Theory (GPD on Tail Losses) ---")
losses = -port_ret  # losses are positive
threshold = np.percentile(losses, 95)  # top 5 % of losses
excess = losses[losses > threshold] - threshold

# Fit GPD to excesses
shape, loc, scale = genpareto.fit(excess, floc=0)
print(f"  Threshold (95th pctile of losses): {threshold:.4%}")
print(f"  Exceedances: {len(excess)} observations")
print(f"  GPD shape (xi): {shape:.4f}")
print(f"  GPD scale (beta): {scale:.6f}")

if shape > 0:
    print("  -> Shape > 0 indicates heavy (fat) tails: extreme losses are more")
    print("     probable than the normal distribution suggests.")
elif shape == 0:
    print("  -> Shape = 0: exponential tails (thin).")
else:
    print("  -> Shape < 0: bounded tails (lighter than exponential).")

# EVT-based VaR
n = len(losses)
n_u = len(excess)
evt_var = threshold + (scale / shape) * ((n / n_u * (1 - CONFIDENCE)) ** (-shape) - 1)
evt_cvar = (evt_var + scale - shape * threshold) / (1 - shape)
print(f"  EVT VaR  ({CONFIDENCE:.0%}): {evt_var:.4%}  (${evt_var * INVESTMENT:,.0f})")
print(f"  EVT CVaR ({CONFIDENCE:.0%}): {evt_cvar:.4%}  (${evt_cvar * INVESTMENT:,.0f})")

# ---------------------------------------------------------------------------
# 5. Stress test: 2008-level drawdowns
# ---------------------------------------------------------------------------
print("\n--- 5. Stress Test: 2008 Crisis Scenario ---")
# Historical drawdowns during 2008 crisis
crisis = port_ret.loc["2008-09":"2008-11"]
crisis_total = (1 + crisis).prod() - 1
print(f"  Portfolio return Sep-Nov 2008: {crisis_total:.2%}")
print(f"  Worst single day in 2008    : {port_ret.loc['2008'].min():.2%}")
print(f"  Stress loss on ${INVESTMENT:,.0f}:")
print(f"    Sep-Nov 2008 scenario     : ${abs(crisis_total) * INVESTMENT:,.0f}")
print(f"    Worst day scenario        : ${abs(port_ret.loc['2008'].min()) * INVESTMENT:,.0f}")
print("  -> Stress tests apply historical crisis scenarios to current portfolio.")
print("     They reveal risks that VaR models may miss.")

# ---------------------------------------------------------------------------
# 6. Summary comparison table
# ---------------------------------------------------------------------------
print("\n--- 6. Summary: All Methods Compared ---")
print(f"{'Method':<22} {'VaR':>10} {'VaR ($)':>12} {'CVaR':>10} {'CVaR ($)':>12}")
print("-" * 70)
rows = [
    ("Historical", hist_var, hist_cvar),
    ("Parametric (Normal)", param_var, param_cvar),
    ("Monte Carlo", mc_var, mc_cvar),
    ("EVT (GPD)", evt_var, evt_cvar),
]
for name, var, cvar in rows:
    print(f"{name:<22} {var:>10.4%} {var * INVESTMENT:>12,.0f} {cvar:>10.4%} {cvar * INVESTMENT:>12,.0f}")

# ---------------------------------------------------------------------------
# Plot: VaR on return distribution
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(port_ret * 100, bins=100, density=True, alpha=0.6, color="steelblue",
        label="Daily returns")
ax.axvline(-hist_var * 100, color="red", linewidth=2, linestyle="--",
           label=f"Historical VaR ({CONFIDENCE:.0%})")
ax.axvline(-param_var * 100, color="orange", linewidth=2, linestyle="-.",
           label=f"Parametric VaR ({CONFIDENCE:.0%})")
ax.axvline(-evt_var * 100, color="purple", linewidth=2, linestyle=":",
           label=f"EVT VaR ({CONFIDENCE:.0%})")

# Normal overlay
x = np.linspace(port_ret.min() * 100, port_ret.max() * 100, 300)
ax.plot(x, norm.pdf(x, mu * 100, sigma * 100), "k-", linewidth=1.5,
        alpha=0.7, label="Normal distribution")

ax.set_xlabel("Daily Return (%)")
ax.set_ylabel("Density")
ax.set_title("Portfolio Return Distribution with VaR Estimates")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_17_var.png", dpi=150)
plt.show()
print("\nVaR comparison plot saved as module_17_var.png")

print("\n  KEY TAKEAWAYS")
print("  1. VaR answers: 'What is the worst loss at X% confidence over 1 day?'")
print("  2. CVaR (Expected Shortfall) answers: 'If we exceed VaR, how bad is it?'")
print("  3. Parametric VaR underestimates risk due to non-normal tails.")
print("  4. EVT focuses on extreme tails and often gives higher (more conservative) estimates.")
print("  5. Stress tests complement VaR by exploring specific crisis scenarios.")
print("=" * 70)
