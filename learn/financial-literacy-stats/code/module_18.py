"""
Module 18: Backtesting
========================
Topics covered:
  - Implement a simple momentum strategy (buy winners, sell losers)
  - Compute: Sharpe ratio, Sortino ratio, max drawdown, Calmar ratio
  - Apply Bonferroni correction for multiple strategy testing
  - Show in-sample vs out-of-sample Sharpe degradation
  - Plot equity curve with drawdown subplot
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.stats import ttest_1samp
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 18 : Backtesting")
print("=" * 70)

# ---------------------------------------------------------------------------
# Helper: performance metrics
# ---------------------------------------------------------------------------

def sharpe_ratio(returns, rf=0.0):
    excess = returns - rf / 252
    return np.sqrt(252) * excess.mean() / excess.std() if excess.std() > 0 else 0

def sortino_ratio(returns, rf=0.0):
    excess = returns - rf / 252
    downside = excess[excess < 0].std()
    return np.sqrt(252) * excess.mean() / downside if downside > 0 else 0

def max_drawdown(returns):
    cum = (1 + returns).cumprod()
    peak = cum.cummax()
    dd = (cum - peak) / peak
    return dd.min()

def calmar_ratio(returns):
    ann_ret = returns.mean() * 252
    mdd = abs(max_drawdown(returns))
    return ann_ret / mdd if mdd > 0 else 0

# ---------------------------------------------------------------------------
# Data download
# ---------------------------------------------------------------------------
print("\n--- Downloading universe of ETFs ---")
universe = ["XLF", "XLK", "XLE", "XLV", "XLI", "XLP", "XLY", "XLU", "XLB", "XLRE"]
prices = yf.download(universe, start="2010-01-01", auto_adjust=True, progress=False)["Close"]
if isinstance(prices.columns, pd.MultiIndex):
    prices.columns = prices.columns.get_level_values(0)
prices = prices.dropna()
returns = prices.pct_change().dropna()
print(f"Universe: {universe}")
print(f"Date range: {returns.index[0].date()} to {returns.index[-1].date()}")

# ---------------------------------------------------------------------------
# 1. Momentum strategy: buy top 3 past-month performers, equal weight
# ---------------------------------------------------------------------------
print("\n--- 1. Momentum Strategy ---")
print("  Rule: Each month, buy the top 3 ETFs by trailing 21-day return.")
print("  Equal-weight the winners. Rebalance monthly.\n")

lookback = 21  # ~1 month
n_winners = 3

# Monthly rebalance dates
rebal_dates = returns.resample("ME").last().index
positions = pd.DataFrame(0.0, index=returns.index, columns=returns.columns)

for i in range(1, len(rebal_dates)):
    date = rebal_dates[i]
    # Find eligible dates before rebalance
    window_end = returns.index[returns.index <= date]
    if len(window_end) < lookback:
        continue
    past_ret = returns.loc[window_end[-lookback]:window_end[-1]].sum()
    winners = past_ret.nlargest(n_winners).index
    # Hold until next rebalance
    if i < len(rebal_dates) - 1:
        hold_period = (returns.index > date) & (returns.index <= rebal_dates[i + 1])
    else:
        hold_period = returns.index > date
    positions.loc[hold_period, winners] = 1.0 / n_winners

# Strategy returns
strat_ret = (positions.shift(1) * returns).sum(axis=1)
strat_ret = strat_ret.loc[strat_ret.index >= rebal_dates[1]]

# Benchmark: equal-weight all ETFs
bench_ret = returns.mean(axis=1).loc[strat_ret.index]

print(f"{'Metric':<25} {'Momentum':>12} {'Equal-Weight':>14}")
print("-" * 55)
for label, func in [("Sharpe Ratio", sharpe_ratio),
                     ("Sortino Ratio", sortino_ratio),
                     ("Max Drawdown", max_drawdown),
                     ("Calmar Ratio", calmar_ratio)]:
    s_val = func(strat_ret)
    b_val = func(bench_ret)
    if "Drawdown" in label:
        print(f"{label:<25} {s_val:>12.2%} {b_val:>14.2%}")
    else:
        print(f"{label:<25} {s_val:>12.3f} {b_val:>14.3f}")

ann_ret_s = strat_ret.mean() * 252
ann_ret_b = bench_ret.mean() * 252
print(f"{'Annualized Return':<25} {ann_ret_s:>12.2%} {ann_ret_b:>14.2%}")

# ---------------------------------------------------------------------------
# 2. Equity curve with drawdown subplot
# ---------------------------------------------------------------------------
print("\n--- 2. Equity Curve ---")
cum_strat = (1 + strat_ret).cumprod()
cum_bench = (1 + bench_ret).cumprod()
dd_strat = (cum_strat - cum_strat.cummax()) / cum_strat.cummax()

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), gridspec_kw={"height_ratios": [3, 1]},
                                sharex=True)
ax1.plot(cum_strat.index, cum_strat, "b-", linewidth=1.5, label="Momentum Strategy")
ax1.plot(cum_bench.index, cum_bench, "gray", linewidth=1, alpha=0.7, label="Equal-Weight Benchmark")
ax1.set_ylabel("Cumulative Return ($1 invested)")
ax1.set_title("Momentum Strategy vs Equal-Weight Benchmark")
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.fill_between(dd_strat.index, dd_strat * 100, 0, color="red", alpha=0.4)
ax2.set_ylabel("Drawdown (%)")
ax2.set_xlabel("Date")
ax2.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_18_equity_curve.png", dpi=150)
plt.show()
print("Equity curve saved as module_18_equity_curve.png")

# ---------------------------------------------------------------------------
# 3. Bonferroni correction for multiple strategy testing
# ---------------------------------------------------------------------------
print("\n--- 3. Multiple Testing Correction (Bonferroni) ---")
print("  If you test many strategies, some will look good by chance alone.")
print("  Bonferroni correction: multiply p-values by number of strategies tested.\n")

# Simulate testing many lookback windows as 'different strategies'
lookbacks = [5, 10, 15, 21, 42, 63, 126, 252]
n_tests = len(lookbacks)
p_values = []

for lb in lookbacks:
    # Quick momentum returns for this lookback
    mom_signal = returns.rolling(lb).sum().shift(1)
    top3 = mom_signal.rank(axis=1, ascending=False) <= 3
    w = top3.div(top3.sum(axis=1), axis=0).fillna(0)
    sr = (w * returns).sum(axis=1).dropna()
    t_stat, p_val = ttest_1samp(sr, 0)
    p_values.append(p_val)

print(f"{'Lookback':<12} {'Raw p-value':>14} {'Bonferroni p':>14} {'Significant?':>14}")
print("-" * 58)
for lb, p in zip(lookbacks, p_values):
    bonf_p = min(p * n_tests, 1.0)
    sig = "Yes" if bonf_p < 0.05 else "No"
    print(f"{lb:<12} {p:>14.4f} {bonf_p:>14.4f} {sig:>14}")

print(f"\n  Tested {n_tests} strategies. Bonferroni multiplies each p-value by {n_tests}.")
print("  Many strategies that look significant individually fail after correction.")

# ---------------------------------------------------------------------------
# 4. In-sample vs out-of-sample Sharpe degradation
# ---------------------------------------------------------------------------
print("\n--- 4. In-Sample vs Out-of-Sample Sharpe Degradation ---")
split_date = "2020-01-01"
is_ret = strat_ret.loc[:split_date]
oos_ret = strat_ret.loc[split_date:]

is_sharpe = sharpe_ratio(is_ret)
oos_sharpe = sharpe_ratio(oos_ret)
degradation = (is_sharpe - oos_sharpe) / is_sharpe * 100 if is_sharpe != 0 else 0

print(f"  In-sample period  : {is_ret.index[0].date()} to {is_ret.index[-1].date()}")
print(f"  Out-of-sample     : {oos_ret.index[0].date()} to {oos_ret.index[-1].date()}")
print(f"  In-sample Sharpe  : {is_sharpe:.3f}")
print(f"  Out-of-sample Sharpe: {oos_sharpe:.3f}")
print(f"  Degradation       : {degradation:.1f}%")
print("\n  -> Typical Sharpe degradation from in-sample to out-of-sample is 30-50%.")
print("     A strategy that barely passes significance in-sample will likely fail OOS.")

# Also show for benchmark
is_bench_sharpe = sharpe_ratio(bench_ret.loc[:split_date])
oos_bench_sharpe = sharpe_ratio(bench_ret.loc[split_date:])
print(f"\n  Benchmark IS Sharpe : {is_bench_sharpe:.3f}")
print(f"  Benchmark OOS Sharpe: {oos_bench_sharpe:.3f}")

print("\n  KEY TAKEAWAYS")
print("  1. Backtesting reveals how strategies would have performed historically.")
print("  2. Max drawdown and Sortino ratio capture downside risk better than Sharpe.")
print("  3. Testing many strategies inflates false discoveries (data snooping).")
print("  4. Bonferroni and similar corrections account for multiple comparisons.")
print("  5. Expect 30-50% Sharpe degradation out-of-sample; plan accordingly.")
print("=" * 70)
