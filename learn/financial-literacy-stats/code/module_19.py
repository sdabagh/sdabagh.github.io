"""
Module 19: Behavioral Finance
================================
Topics covered:
  - Test momentum effect: sort stocks by past returns, compare quintiles
  - Test mean reversion at longer horizons
  - Calendar effects: day-of-week returns, January effect
  - Demonstrate loss aversion with prospect theory value function
  - Plot anomaly returns
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 19 : Behavioral Finance")
print("=" * 70)

# ---------------------------------------------------------------------------
# Data: sector ETFs as proxy for stock universe
# ---------------------------------------------------------------------------
print("\n--- Loading sector ETFs as stock universe ---")
tickers = ["XLF", "XLK", "XLE", "XLV", "XLI", "XLP", "XLY", "XLU", "XLB",
           "XLRE", "XLC", "SPY", "QQQ", "IWM", "EFA", "EEM"]
prices = yf.download(tickers, start="2005-01-01", auto_adjust=True, progress=False)["Close"]
if isinstance(prices.columns, pd.MultiIndex):
    prices.columns = prices.columns.get_level_values(0)
prices = prices.dropna()
returns = prices.pct_change().dropna()
print(f"Assets: {len(returns.columns)}, Date range: {returns.index[0].date()} to {returns.index[-1].date()}")

# ---------------------------------------------------------------------------
# 1. Momentum effect: sort by past 12-month return, compare quintiles
# ---------------------------------------------------------------------------
print("\n--- 1. Cross-Sectional Momentum Effect ---")
print("  Sort assets by trailing 252-day return into quintiles.")
print("  Compare forward 21-day returns of winners vs losers.\n")

formation = 252  # 12-month lookback
holding = 21     # 1-month forward

# Monthly rebalance
monthly_dates = returns.resample("ME").last().index
quintile_returns = {q: [] for q in range(1, 6)}

for i in range(formation // 21, len(monthly_dates) - 1):
    date = monthly_dates[i]
    # Past return
    past_window = returns.index[returns.index <= date]
    if len(past_window) < formation:
        continue
    past_ret = (1 + returns.loc[past_window[-formation:]]).prod() - 1

    # Forward return
    fwd_start = returns.index[returns.index > date]
    if len(fwd_start) < holding:
        break
    fwd_ret = (1 + returns.loc[fwd_start[:holding]]).prod() - 1

    # Rank into quintiles
    ranks = past_ret.rank(pct=True)
    for asset in returns.columns:
        q = min(int(ranks[asset] * 5) + 1, 5)
        quintile_returns[q].append(fwd_ret[asset])

print(f"{'Quintile':<12} {'Mean Fwd Return':>16} {'Obs':>8}")
print("-" * 40)
q_means = {}
for q in range(1, 6):
    q_ret = np.array(quintile_returns[q])
    q_means[q] = q_ret.mean()
    label = "(Losers)" if q == 1 else "(Winners)" if q == 5 else ""
    print(f"Q{q} {label:<8} {q_ret.mean():>16.4%} {len(q_ret):>8}")

spread = q_means[5] - q_means[1]
print(f"\nWinners - Losers spread: {spread:.4%} per month")
print("  -> Positive spread supports the momentum anomaly: past winners")
print("     tend to continue outperforming past losers over 1-month horizons.")

# ---------------------------------------------------------------------------
# 2. Mean reversion at longer horizons
# ---------------------------------------------------------------------------
print("\n--- 2. Mean Reversion at Longer Horizons ---")
print("  At multi-year horizons, past losers tend to outperform past winners.\n")

horizons = [21, 63, 126, 252, 504]  # 1mo, 3mo, 6mo, 1yr, 2yr
spreads = []

for h in horizons:
    winner_rets, loser_rets = [], []
    for i in range(504 // 21, len(monthly_dates) - h // 21):
        date = monthly_dates[i]
        past_window = returns.index[returns.index <= date]
        if len(past_window) < 504:
            continue
        past_ret = (1 + returns.loc[past_window[-504:]]).prod() - 1
        fwd_start = returns.index[returns.index > date]
        if len(fwd_start) < h:
            break
        fwd_ret = (1 + returns.loc[fwd_start[:h]]).prod() - 1
        ranks = past_ret.rank(pct=True)
        for asset in returns.columns:
            if ranks[asset] >= 0.8:
                winner_rets.append(fwd_ret[asset])
            elif ranks[asset] <= 0.2:
                loser_rets.append(fwd_ret[asset])
    sp = np.mean(winner_rets) - np.mean(loser_rets) if winner_rets and loser_rets else 0
    spreads.append(sp)
    months_label = h // 21
    print(f"  Holding {months_label:>2} months: Winners-Losers = {sp:>+.4%}")

print("\n  -> At longer horizons, the spread often turns negative (mean reversion).")
print("     This is consistent with investor overreaction followed by correction.")

# ---------------------------------------------------------------------------
# 3. Calendar effects
# ---------------------------------------------------------------------------
print("\n--- 3. Calendar Effects ---")
spy_ret = returns["SPY"] if "SPY" in returns.columns else returns.iloc[:, 0]

# Day-of-week effect
print("\n  Day-of-week average returns:")
dow_ret = spy_ret.groupby(spy_ret.index.dayofweek).mean() * 100
dow_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
for i, name in enumerate(dow_names):
    if i in dow_ret.index:
        print(f"    {name:<12}: {dow_ret.loc[i]:>+.4f}%")

# January effect
print("\n  Monthly average returns (January effect):")
monthly_ret = spy_ret.groupby(spy_ret.index.month).mean() * 100
month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
for m in range(1, 13):
    if m in monthly_ret.index:
        marker = " <-- January" if m == 1 else ""
        print(f"    {month_names[m-1]:<5}: {monthly_ret.loc[m]:>+.4f}%{marker}")

print("\n  -> The January effect (higher returns in January) was historically strong")
print("     but has weakened significantly in recent decades.")

# ---------------------------------------------------------------------------
# 4. Prospect Theory value function
# ---------------------------------------------------------------------------
print("\n--- 4. Loss Aversion & Prospect Theory ---")
print("  Kahneman & Tversky's value function: people feel losses ~2x more than gains.")
print("  v(x) = x^0.88 for gains, -lambda * (-x)^0.88 for losses (lambda ~ 2.25)\n")

x = np.linspace(-100, 100, 1000)
alpha = 0.88
lam = 2.25
v = np.where(x >= 0, x ** alpha, -lam * (-x) ** alpha)

fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(x, v, "b-", linewidth=2.5, label="Prospect Theory value function")
ax.plot(x, x, "gray", linestyle="--", alpha=0.5, linewidth=1, label="Linear (rational)")
ax.axhline(0, color="k", linewidth=0.5)
ax.axvline(0, color="k", linewidth=0.5)
ax.fill_between(x[x < 0], v[x < 0], 0, alpha=0.1, color="red", label="Loss domain")
ax.fill_between(x[x >= 0], v[x >= 0], 0, alpha=0.1, color="green", label="Gain domain")
ax.set_xlabel("Outcome (Gain / Loss)")
ax.set_ylabel("Subjective Value")
ax.set_title("Prospect Theory Value Function (Loss Aversion)")
ax.legend()
ax.grid(True, alpha=0.3)
ax.annotate("Losses hurt ~2.25x\nmore than gains feel good",
            xy=(-60, -lam * 60 ** alpha), fontsize=10, ha="center",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow"))
plt.tight_layout()
plt.savefig("module_19_prospect_theory.png", dpi=150)
plt.show()
print("Prospect theory plot saved as module_19_prospect_theory.png")

# ---------------------------------------------------------------------------
# 5. Anomaly returns summary plot
# ---------------------------------------------------------------------------
print("\n--- 5. Anomaly Returns Summary ---")

fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Momentum quintile bar chart
ax = axes[0]
bars = ax.bar(range(1, 6), [q_means[q] * 100 for q in range(1, 6)],
              color=["#d32f2f", "#e57373", "#bdbdbd", "#81c784", "#388e3c"])
ax.set_xlabel("Quintile (1=Losers, 5=Winners)")
ax.set_ylabel("Avg Monthly Return (%)")
ax.set_title("Momentum Effect")
ax.grid(True, alpha=0.3, axis="y")

# Day-of-week
ax = axes[1]
colors = ["#d32f2f" if v < 0 else "#388e3c" for v in dow_ret.values]
ax.bar(dow_names, dow_ret.values, color=colors)
ax.set_ylabel("Avg Daily Return (%)")
ax.set_title("Day-of-Week Effect")
ax.tick_params(axis="x", rotation=45)
ax.grid(True, alpha=0.3, axis="y")

# Monthly returns (January effect)
ax = axes[2]
colors = ["#1565c0" if m == 1 else "#90a4ae" for m in range(1, 13)]
ax.bar(month_names, [monthly_ret.loc[m] if m in monthly_ret.index else 0 for m in range(1, 13)],
       color=colors)
ax.set_ylabel("Avg Monthly Return (%)")
ax.set_title("Monthly Seasonality (January Effect)")
ax.tick_params(axis="x", rotation=45)
ax.grid(True, alpha=0.3, axis="y")

plt.suptitle("Behavioral Finance Anomalies", fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig("module_19_anomalies.png", dpi=150)
plt.show()
print("Anomaly plots saved as module_19_anomalies.png")

print("\n  KEY TAKEAWAYS")
print("  1. Momentum (short-term winners keep winning) is the strongest anomaly.")
print("  2. Mean reversion operates at longer horizons (overreaction correction).")
print("  3. Calendar effects exist but have weakened as markets became more efficient.")
print("  4. Loss aversion (prospect theory) explains many 'irrational' investor behaviors.")
print("  5. Behavioral biases create exploitable patterns, but they can disappear")
print("     once enough capital chases them (arbitrage limits apply).")
print("=" * 70)
