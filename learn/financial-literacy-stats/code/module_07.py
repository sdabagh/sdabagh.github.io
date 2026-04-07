"""
Module 07 -- Portfolio Optimization
=====================================
Modern Portfolio Theory (Markowitz, 1952) shows how to combine assets
to achieve the best risk-return tradeoff. This module builds the
efficient frontier using Monte Carlo simulation and scipy optimization.

Requirements: yfinance, pandas, numpy, matplotlib, scipy
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize

print("=" * 70)
print("MODULE 07 -- Portfolio Optimization")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download Multi-Stock Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Downloading Data for 5 Stocks ---\n")

tickers = ["AAPL", "MSFT", "JNJ", "XOM", "GLD"]
data = yf.download(tickers, start="2018-01-01", end="2024-12-31",
                   auto_adjust=False)

if isinstance(data.columns, pd.MultiIndex):
    prices = data["Close"]
else:
    prices = data[["Close"]]

prices = prices.dropna()
returns = prices.pct_change().dropna()

print(f"Assets: {tickers}")
print(f"Trading days: {len(returns)}")
print(f"Date range: {returns.index.min().date()} to {returns.index.max().date()}\n")

# ---------------------------------------------------------------------------
# Section 2: Expected Returns and Covariance Matrix
# ---------------------------------------------------------------------------
print("--- Section 2: Expected Returns & Covariance Matrix ---")
print("""
For portfolio optimization we need two inputs:
  1. Expected return vector (mu) -- annualized mean return per asset
  2. Covariance matrix (Sigma) -- measures how assets co-move

We estimate both from historical data. In practice, more sophisticated
estimators (shrinkage, factor models) improve stability.
""")

mu = returns.mean() * 252          # annualized expected returns
cov = returns.cov() * 252          # annualized covariance matrix
n_assets = len(tickers)

print("Annualized Expected Returns:")
for t, r in zip(tickers, mu):
    print(f"  {t}: {r:.4f}  ({r:.2%})")

print("\nAnnualized Covariance Matrix:")
print(cov.round(4).to_string())

# ---------------------------------------------------------------------------
# Section 3: Monte Carlo Simulation of Random Portfolios
# ---------------------------------------------------------------------------
print("\n--- Section 3: Monte Carlo -- Random Portfolios ---")
print("Generating 20,000 random portfolios to visualize the feasible set.\n")

n_portfolios = 20000
results = np.zeros((n_portfolios, 3))  # return, volatility, sharpe
weight_record = np.zeros((n_portfolios, n_assets))
rf = 0.04  # assume 4% risk-free rate

for i in range(n_portfolios):
    # Random weights that sum to 1 (no short selling)
    w = np.random.dirichlet(np.ones(n_assets))
    weight_record[i] = w

    port_return = np.dot(w, mu)
    port_vol = np.sqrt(np.dot(w, np.dot(cov.values, w)))
    sharpe = (port_return - rf) / port_vol

    results[i] = [port_return, port_vol, sharpe]

print(f"Portfolio return range:     [{results[:,0].min():.2%}, {results[:,0].max():.2%}]")
print(f"Portfolio volatility range: [{results[:,1].min():.2%}, {results[:,1].max():.2%}]")
print(f"Best Sharpe ratio found:    {results[:,2].max():.4f}")

# ---------------------------------------------------------------------------
# Section 4: Minimum Variance Portfolio (Optimization)
# ---------------------------------------------------------------------------
print("\n--- Section 4: Minimum Variance Portfolio ---")
print("""
The minimum variance portfolio has the lowest possible risk among all
feasible portfolios. We find it using constrained optimization.
""")

def portfolio_volatility(weights, cov_matrix):
    return np.sqrt(np.dot(weights, np.dot(cov_matrix, weights)))

constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1}
bounds = tuple((0, 1) for _ in range(n_assets))  # long only
initial_w = np.ones(n_assets) / n_assets

result_minvar = minimize(portfolio_volatility, initial_w,
                         args=(cov.values,), method="SLSQP",
                         bounds=bounds, constraints=constraints)

w_minvar = result_minvar.x
ret_minvar = np.dot(w_minvar, mu)
vol_minvar = portfolio_volatility(w_minvar, cov.values)

print("Minimum Variance Portfolio:")
for t, w in zip(tickers, w_minvar):
    print(f"  {t}: {w:.4f}  ({w:.2%})")
print(f"  Expected Return:  {ret_minvar:.4f}  ({ret_minvar:.2%})")
print(f"  Volatility:       {vol_minvar:.4f}  ({vol_minvar:.2%})")
print(f"  Sharpe Ratio:     {(ret_minvar - rf) / vol_minvar:.4f}")

# ---------------------------------------------------------------------------
# Section 5: Maximum Sharpe Ratio Portfolio
# ---------------------------------------------------------------------------
print("\n--- Section 5: Maximum Sharpe Ratio Portfolio ---")
print("""
The maximum Sharpe portfolio offers the best risk-adjusted return.
It lies at the tangency point between the efficient frontier and the
Capital Market Line.
""")

def neg_sharpe(weights, mu_vec, cov_matrix, rf_rate):
    port_ret = np.dot(weights, mu_vec)
    port_vol = np.sqrt(np.dot(weights, np.dot(cov_matrix, weights)))
    return -(port_ret - rf_rate) / port_vol

result_sharpe = minimize(neg_sharpe, initial_w,
                         args=(mu.values, cov.values, rf),
                         method="SLSQP", bounds=bounds,
                         constraints=constraints)

w_sharpe = result_sharpe.x
ret_sharpe = np.dot(w_sharpe, mu)
vol_sharpe = portfolio_volatility(w_sharpe, cov.values)
sharpe_max = (ret_sharpe - rf) / vol_sharpe

print("Maximum Sharpe Portfolio:")
for t, w in zip(tickers, w_sharpe):
    print(f"  {t}: {w:.4f}  ({w:.2%})")
print(f"  Expected Return:  {ret_sharpe:.4f}  ({ret_sharpe:.2%})")
print(f"  Volatility:       {vol_sharpe:.4f}  ({vol_sharpe:.2%})")
print(f"  Sharpe Ratio:     {sharpe_max:.4f}")

# ---------------------------------------------------------------------------
# Section 6: Plot the Efficient Frontier
# ---------------------------------------------------------------------------
print("\n--- Section 6: Plotting the Efficient Frontier ---")
print("Saving to module_07_efficient_frontier.png\n")

fig, ax = plt.subplots(figsize=(11, 7))

# Random portfolios colored by Sharpe ratio
scatter = ax.scatter(results[:, 1], results[:, 0], c=results[:, 2],
                     cmap="viridis", s=3, alpha=0.5)
fig.colorbar(scatter, ax=ax, label="Sharpe Ratio")

# Individual assets
for i, t in enumerate(tickers):
    asset_vol = np.sqrt(cov.values[i, i])
    ax.scatter(asset_vol, mu.iloc[i], marker="D", s=80,
               color="red", edgecolors="black", zorder=5)
    ax.annotate(t, (asset_vol, mu.iloc[i]), fontsize=9,
                xytext=(5, 5), textcoords="offset points")

# Minimum variance portfolio
ax.scatter(vol_minvar, ret_minvar, marker="*", s=300,
           color="blue", edgecolors="black", zorder=5,
           label="Min Variance")

# Maximum Sharpe portfolio
ax.scatter(vol_sharpe, ret_sharpe, marker="*", s=300,
           color="gold", edgecolors="black", zorder=5,
           label="Max Sharpe")

ax.set_title("Efficient Frontier (Long-Only)", fontsize=14)
ax.set_xlabel("Annualized Volatility")
ax.set_ylabel("Annualized Expected Return")
ax.legend(fontsize=10)
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_07_efficient_frontier.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 07:")
print("  1. Diversification reduces risk -- the frontier curves left.")
print("  2. The min-variance portfolio has the lowest achievable risk.")
print("  3. The max-Sharpe portfolio gives the best risk-adjusted return.")
print("  4. Individual assets are dominated by diversified portfolios.")
print("  5. Optimization inputs (mu, Sigma) are estimated with error.")
print("\n" + "=" * 70)
print("End of Module 07")
print("=" * 70)
