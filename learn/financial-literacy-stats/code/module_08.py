"""
Module 08 -- CAPM Regression
==============================
The Capital Asset Pricing Model (CAPM) says an asset's expected return
is driven by its exposure to market risk (beta). We estimate beta via
OLS regression and test whether alpha is significantly different from zero.

Requirements: yfinance, pandas, numpy, matplotlib, statsmodels
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm

print("=" * 70)
print("MODULE 08 -- CAPM Regression")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Download Stock, Market, and Risk-Free Rate Data
# ---------------------------------------------------------------------------
print("\n--- Section 1: Downloading Data ---\n")
print("""
CAPM equation:  r_stock - r_f = alpha + beta * (r_market - r_f) + epsilon

We need:
  - Stock returns (we use AAPL)
  - Market returns (S&P 500 via ^GSPC)
  - Risk-free rate proxy (3-month T-bill via ^IRX, annualized yield)
""")

tickers_to_dl = ["AAPL", "^GSPC", "^IRX"]
data = yf.download(tickers_to_dl, start="2018-01-01", end="2024-12-31",
                   auto_adjust=False)

if isinstance(data.columns, pd.MultiIndex):
    prices = data["Close"]
else:
    prices = data[["Close"]]

prices = prices.dropna()

# Compute daily returns for stock and market
stock_ret = prices["AAPL"].pct_change().dropna()
market_ret = prices["^GSPC"].pct_change().dropna()

# Risk-free rate: ^IRX gives annualized T-bill yield in percent
# Convert to daily rate: rf_daily = (yield/100) / 252
rf_daily = (prices["^IRX"] / 100) / 252
rf_daily = rf_daily.reindex(stock_ret.index).ffill().dropna()

# Align all series
common_idx = stock_ret.index.intersection(market_ret.index).intersection(rf_daily.index)
stock_ret = stock_ret.loc[common_idx]
market_ret = market_ret.loc[common_idx]
rf_daily = rf_daily.loc[common_idx]

# Compute excess returns
excess_stock = stock_ret - rf_daily
excess_market = market_ret - rf_daily

print(f"Observations: {len(common_idx)}")
print(f"Period: {common_idx.min().date()} to {common_idx.max().date()}")
print(f"Avg daily risk-free rate: {rf_daily.mean():.6f} ({rf_daily.mean()*252:.2%} annualized)\n")

# ---------------------------------------------------------------------------
# Section 2: OLS Regression
# ---------------------------------------------------------------------------
print("--- Section 2: OLS Regression ---")
print("""
We regress excess stock returns on excess market returns:
  (r_AAPL - r_f) = alpha + beta * (r_market - r_f) + epsilon
""")

X = sm.add_constant(excess_market.values)  # adds intercept (alpha)
y = excess_stock.values

model = sm.OLS(y, X).fit()
print(model.summary())

alpha = model.params[0]
beta = model.params[1]
r_squared = model.rsquared
alpha_pval = model.pvalues[0]
beta_pval = model.pvalues[1]

# ---------------------------------------------------------------------------
# Section 3: Interpret Results
# ---------------------------------------------------------------------------
print("\n--- Section 3: Interpreting the Results ---")
print(f"""
Estimated Parameters:
  Beta  = {beta:.4f}   (p-value: {beta_pval:.2e})
  Alpha = {alpha:.6f}  (p-value: {alpha_pval:.4f})
  R^2   = {r_squared:.4f}

Beta interpretation:
  A beta of {beta:.2f} means AAPL moves ~{beta:.2f}x the market.
  If the market goes up 1%, AAPL is expected to go up ~{beta:.2f}%.

Alpha interpretation:
  Alpha = {alpha:.6f} daily = {alpha*252:.4f} annualized ({alpha*252:.2%}/yr)
  This is the return UNEXPLAINED by market exposure.
""")

# ---------------------------------------------------------------------------
# Section 4: Test if Alpha is Significantly Different from Zero
# ---------------------------------------------------------------------------
print("--- Section 4: Is Alpha Significantly Different from Zero? ---")
print("""
CAPM predicts alpha = 0 (all returns are explained by market risk).
We test H0: alpha = 0 vs H1: alpha != 0 using the t-statistic.
""")

t_stat_alpha = model.tvalues[0]
print(f"  t-statistic for alpha: {t_stat_alpha:.4f}")
print(f"  p-value:               {alpha_pval:.4f}")

if alpha_pval < 0.05:
    print(f"  Result: REJECT H0 at 5% level. Alpha is statistically significant.")
    print(f"  AAPL generated {alpha*252:.2%} annual excess return beyond CAPM.")
else:
    print(f"  Result: FAIL to reject H0. Alpha is NOT statistically significant.")
    print(f"  CAPM adequately explains AAPL returns in this period.")

# ---------------------------------------------------------------------------
# Section 5: Scatter Plot with Regression Line
# ---------------------------------------------------------------------------
print("\n--- Section 5: Scatter Plot ---")
print("Saving scatter plot to module_08_capm_scatter.png\n")

fig, ax = plt.subplots(figsize=(10, 7))
ax.scatter(excess_market, excess_stock, s=5, alpha=0.3, color="steelblue")

# Regression line
x_line = np.linspace(excess_market.min(), excess_market.max(), 100)
y_line = alpha + beta * x_line
ax.plot(x_line, y_line, color="red", linewidth=2,
        label=f"OLS: alpha={alpha:.5f}, beta={beta:.3f}")

ax.set_title("CAPM Regression: AAPL Excess Returns vs Market", fontsize=13)
ax.set_xlabel("Market Excess Return (r_market - r_f)")
ax.set_ylabel("AAPL Excess Return (r_AAPL - r_f)")
ax.legend(fontsize=10)
ax.grid(True, alpha=0.3)
ax.axhline(0, color="gray", linewidth=0.5)
ax.axvline(0, color="gray", linewidth=0.5)
fig.tight_layout()
fig.savefig("module_08_capm_scatter.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Section 6: Security Market Line (SML)
# ---------------------------------------------------------------------------
print("\n--- Section 6: Security Market Line ---")
print("""
The SML plots expected return vs beta for multiple assets.
Assets above the SML have positive alpha; below have negative alpha.
""")

# Compute betas for several assets
test_tickers = ["AAPL", "MSFT", "JNJ", "XOM", "TSLA"]
betas = {}
alphas_dict = {}

for t in test_tickers:
    try:
        t_data = yf.download(t, start="2018-01-01", end="2024-12-31",
                             auto_adjust=False, progress=False)
        if isinstance(t_data.columns, pd.MultiIndex):
            t_data.columns = t_data.columns.get_level_values(0)
        t_ret = t_data["Close"].pct_change().dropna()
        idx = t_ret.index.intersection(common_idx)
        t_excess = t_ret.loc[idx] - rf_daily.loc[idx]
        m_excess = excess_market.loc[idx]

        X_t = sm.add_constant(m_excess.values)
        mod = sm.OLS(t_excess.values, X_t).fit()
        betas[t] = mod.params[1]
        alphas_dict[t] = mod.params[0] * 252  # annualized
    except Exception as e:
        print(f"  Skipping {t}: {e}")

print("\nStock Betas and Annualized Alphas:")
print(f"  {'Ticker':<8} {'Beta':>8} {'Alpha (ann)':>12}")
print(f"  {'------':<8} {'------':>8} {'-----------':>12}")
for t in test_tickers:
    if t in betas:
        print(f"  {t:<8} {betas[t]:>8.3f} {alphas_dict[t]:>12.4f}")

# Plot SML
fig, ax = plt.subplots(figsize=(10, 6))

# SML line: E(r) = r_f + beta * (E(r_m) - r_f)
rf_ann = rf_daily.mean() * 252
market_premium = market_ret.mean() * 252 - rf_ann
beta_range = np.linspace(0, 2.0, 100)
sml = rf_ann + beta_range * market_premium
ax.plot(beta_range, sml, "r-", linewidth=2, label="Security Market Line")

for t in test_tickers:
    if t in betas:
        actual_return = (1 + stock_ret.loc[common_idx]).prod() ** (252/len(common_idx)) - 1
        # Use historical return for the specific stock
        t_data = yf.download(t, start="2018-01-01", end="2024-12-31",
                             auto_adjust=False, progress=False)
        if isinstance(t_data.columns, pd.MultiIndex):
            t_data.columns = t_data.columns.get_level_values(0)
        t_prices = t_data["Close"].dropna()
        ann_ret = (t_prices.iloc[-1] / t_prices.iloc[0]) ** (252/len(t_prices)) - 1
        ax.scatter(betas[t], ann_ret, s=80, zorder=5, edgecolors="black")
        ax.annotate(t, (betas[t], ann_ret), fontsize=9,
                    xytext=(5, 5), textcoords="offset points")

ax.set_title("Security Market Line", fontsize=13)
ax.set_xlabel("Beta")
ax.set_ylabel("Annualized Return")
ax.legend()
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_08_sml.png", dpi=150)
plt.close(fig)
print("\nSaved Security Market Line to module_08_sml.png")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 08:")
print("  1. Beta measures systematic (market) risk exposure.")
print("  2. Alpha measures return unexplained by market risk.")
print("  3. CAPM predicts alpha = 0; deviations suggest mispricing or skill.")
print("  4. R-squared tells you how much of stock variance the market explains.")
print("  5. The SML plots the expected return-beta relationship.")
print("\n" + "=" * 70)
print("End of Module 08")
print("=" * 70)
