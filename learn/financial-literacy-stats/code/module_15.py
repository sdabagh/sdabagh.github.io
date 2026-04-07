"""
Module 15: Time Series Models
==============================
Topics covered:
  - Fit ARIMA model to gold prices with auto order selection (AIC)
  - Fit GARCH(1,1) to returns using the arch package
  - Test for cointegration between two stocks (Engle-Granger)
  - Generate trading signals from cointegration spread
  - Plot GARCH conditional volatility
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller, coint
from arch import arch_model
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 15 : Time Series Models")
print("=" * 70)

# ---------------------------------------------------------------------------
# Data download
# ---------------------------------------------------------------------------
print("\n--- Downloading data ---")
gold = yf.download("GC=F", start="2015-01-01", auto_adjust=True, progress=False)["Close"]
if isinstance(gold, pd.DataFrame):
    gold = gold.iloc[:, 0]
gold = gold.dropna()

# Two cointegrated-ish pairs: KO and PEP
pair = yf.download(["KO", "PEP"], start="2015-01-01", auto_adjust=True, progress=False)["Close"]
pair = pair.dropna()
print(f"Gold observations : {len(gold)}")
print(f"Pair observations : {len(pair)}")

# ---------------------------------------------------------------------------
# 1. ARIMA model on gold prices (auto order selection via AIC)
# ---------------------------------------------------------------------------
print("\n--- 1. ARIMA Model on Gold Prices ---")
print("  Searching ARIMA(p,1,q) orders p=0..3, q=0..3 by AIC ...\n")

gold_monthly = gold.resample("ME").last().dropna()
best_aic = np.inf
best_order = (0, 1, 0)

for p in range(4):
    for q in range(4):
        try:
            model = ARIMA(gold_monthly, order=(p, 1, q))
            result = model.fit()
            if result.aic < best_aic:
                best_aic = result.aic
                best_order = (p, 1, q)
        except Exception:
            continue

print(f"  Best order : ARIMA{best_order}  (AIC = {best_aic:.1f})")

# Refit best model
best_model = ARIMA(gold_monthly, order=best_order).fit()
print(f"  Log-likelihood: {best_model.llf:.1f}")
print(f"  Parameters:")
for name, val in best_model.params.items():
    print(f"    {name:>12} = {val:.6f}")

# Forecast next 6 months
fcast = best_model.get_forecast(steps=6)
fmean = fcast.predicted_mean
fci = fcast.conf_int()
print(f"\n  6-month forecast (from {gold_monthly.index[-1].date()}):")
for i in range(len(fmean)):
    print(f"    {fmean.index[i].date()} : ${fmean.iloc[i]:,.0f}  "
          f"[{fci.iloc[i, 0]:,.0f} - {fci.iloc[i, 1]:,.0f}]")
print("  -> ARIMA forecasts widen rapidly; long-horizon point forecasts are unreliable.")

# ---------------------------------------------------------------------------
# 2. GARCH(1,1) on gold returns
# ---------------------------------------------------------------------------
print("\n--- 2. GARCH(1,1) on Gold Returns ---")
gold_ret = gold.pct_change().dropna() * 100  # in percent

garch = arch_model(gold_ret, vol="Garch", p=1, q=1, mean="Constant", dist="Normal")
garch_fit = garch.fit(disp="off")
print(garch_fit.summary().tables[1])

cond_vol = garch_fit.conditional_volatility

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
ax1.plot(gold_ret.index, gold_ret, linewidth=0.5, alpha=0.7)
ax1.set_ylabel("Daily Return (%)")
ax1.set_title("Gold Daily Returns")
ax1.grid(True, alpha=0.3)

ax2.plot(cond_vol.index, cond_vol, color="red", linewidth=0.8)
ax2.set_ylabel("Conditional Volatility (%)")
ax2.set_title("GARCH(1,1) Conditional Volatility")
ax2.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_15_garch.png", dpi=150)
plt.show()
print("GARCH volatility plot saved as module_15_garch.png")
print("  -> Volatility clusters: high-vol periods persist, then calm returns.")

# ---------------------------------------------------------------------------
# 3. Cointegration test (Engle-Granger) for KO / PEP
# ---------------------------------------------------------------------------
print("\n--- 3. Cointegration: KO vs PEP ---")

# Engle-Granger test
score, pvalue, _ = coint(pair["KO"], pair["PEP"])
print(f"  Engle-Granger test statistic: {score:.4f}")
print(f"  p-value                      : {pvalue:.4f}")
if pvalue < 0.05:
    print("  -> Reject null of no cointegration: KO and PEP appear cointegrated.")
else:
    print("  -> Cannot reject null: no strong evidence of cointegration.")
print("  Cointegrated pairs share a common stochastic trend; their spread is stationary.")

# Compute hedge ratio via OLS
from numpy.polynomial.polynomial import polyfit
beta = np.polyfit(pair["PEP"], pair["KO"], 1)
hedge_ratio = beta[0]
spread = pair["KO"] - hedge_ratio * pair["PEP"]
print(f"  Hedge ratio (beta): {hedge_ratio:.4f}")

# ADF on spread
adf_spread = adfuller(spread.dropna())
print(f"  ADF on spread: stat={adf_spread[0]:.4f}, p={adf_spread[1]:.4f}")

# ---------------------------------------------------------------------------
# 4. Trading signals from cointegration spread
# ---------------------------------------------------------------------------
print("\n--- 4. Mean-Reversion Trading Signals ---")
spread_mean = spread.mean()
spread_std = spread.std()
z_score = (spread - spread_mean) / spread_std

# Signals: buy spread when z < -2, sell when z > 2, close when |z| < 0.5
signals = pd.Series(0.0, index=spread.index)
position = 0.0
for i in range(1, len(z_score)):
    if z_score.iloc[i] < -2 and position <= 0:
        position = 1.0   # buy spread
    elif z_score.iloc[i] > 2 and position >= 0:
        position = -1.0  # sell spread
    elif abs(z_score.iloc[i]) < 0.5:
        position = 0.0   # close
    signals.iloc[i] = position

spread_ret = spread.pct_change().fillna(0)
strat_ret = signals.shift(1) * spread_ret
cum_ret = (1 + strat_ret).cumprod()

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
ax1.plot(z_score.index, z_score, linewidth=0.7)
ax1.axhline(2, color="red", linestyle="--", alpha=0.7, label="Sell threshold")
ax1.axhline(-2, color="green", linestyle="--", alpha=0.7, label="Buy threshold")
ax1.axhline(0, color="gray", linewidth=0.5)
ax1.set_ylabel("Z-score")
ax1.set_title("KO-PEP Spread Z-Score & Trading Signals")
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.plot(cum_ret.index, cum_ret, color="purple", linewidth=1.5)
ax2.set_ylabel("Cumulative Return")
ax2.set_title("Pairs Trading Strategy Cumulative Return")
ax2.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_15_pairs.png", dpi=150)
plt.show()
print("Pairs trading plot saved as module_15_pairs.png")

print("\n  KEY TAKEAWAYS")
print("  1. ARIMA captures linear dependencies; forecast uncertainty grows quickly.")
print("  2. GARCH models volatility clustering, a key feature of financial returns.")
print("  3. Cointegrated pairs share a long-run equilibrium; their spread mean-reverts.")
print("  4. Pairs trading exploits mean-reversion but requires careful risk management.")
print("=" * 70)
