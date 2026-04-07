"""
Module 05 -- Missing Data & Survivorship Bias
===============================================
Two of the most dangerous biases in financial research are survivorship
bias (only studying winners) and look-ahead bias (using future info).
This module simulates both to show how they distort analysis.

Requirements: pandas, numpy, matplotlib
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

np.random.seed(42)

print("=" * 70)
print("MODULE 05 -- Missing Data & Survivorship Bias")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: What is Survivorship Bias?
# ---------------------------------------------------------------------------
print("\n--- Section 1: What is Survivorship Bias? ---")
print("""
Survivorship bias occurs when failed or delisted entities are excluded
from a dataset. If you study only the funds or stocks that EXIST TODAY,
you miss all the ones that went bankrupt, merged, or closed.

This inflates apparent historical performance because the losers have
been silently removed from the record.

Example: mutual fund databases often only include funds that are still
operating. The dead funds (which likely performed poorly) vanish.
""")

# ---------------------------------------------------------------------------
# Section 2: Simulate 100 Funds Over 10 Years
# ---------------------------------------------------------------------------
print("--- Section 2: Simulating 100 Funds ---\n")

n_funds = 100
n_years = 10
annual_mu = 0.07       # true average annual return
annual_sigma = 0.18    # annual volatility
failure_threshold = -0.40  # cumulative loss that triggers fund closure

# Simulate annual returns for all funds
all_returns = np.random.normal(annual_mu, annual_sigma, (n_years, n_funds))
all_cumulative = np.cumprod(1 + all_returns, axis=0)

# Track which funds "fail" (cumulative return drops below threshold)
alive = np.ones(n_funds, dtype=bool)
death_year = np.full(n_funds, n_years)  # year of failure (n_years = survived)

for year in range(n_years):
    cum_return = all_cumulative[year, :] - 1.0  # total return from inception
    newly_dead = alive & (cum_return < failure_threshold)
    death_year[newly_dead] = year + 1
    alive[newly_dead] = False

n_survivors = alive.sum()
n_failures = n_funds - n_survivors

print(f"Total funds simulated:  {n_funds}")
print(f"Funds that survived:    {n_survivors}")
print(f"Funds that failed:      {n_failures}")
print(f"Failure rate:           {n_failures/n_funds:.0%}")

# ---------------------------------------------------------------------------
# Section 3: Measuring the Bias
# ---------------------------------------------------------------------------
print("\n--- Section 3: Measuring Survivorship Bias ---\n")

# Average annualized return across ALL funds (the true picture)
all_final = all_cumulative[-1, :]
all_annualized = all_final ** (1.0 / n_years) - 1

# Average only among survivors (the biased picture)
survivor_annualized = all_annualized[alive]
dead_annualized = all_annualized[~alive]

true_avg = all_annualized.mean()
survivor_avg = survivor_annualized.mean()
bias = survivor_avg - true_avg

print(f"Average annualized return (ALL funds):       {true_avg:.4f}  ({true_avg:.2%})")
print(f"Average annualized return (SURVIVORS only):  {survivor_avg:.4f}  ({survivor_avg:.2%})")
print(f"Average annualized return (FAILED funds):    {dead_annualized.mean():.4f}  ({dead_annualized.mean():.2%})")
print(f"\nSurvivorship Bias: {bias:.4f}  ({bias:.2%})")
print(f"This means studying only survivors INFLATES average returns by ~{bias:.1%}.")
print("Academic studies typically find biases of 0.5% to 2.0% per year.")

# ---------------------------------------------------------------------------
# Section 4: Visualizing the Bias
# ---------------------------------------------------------------------------
print("\n--- Section 4: Visualizing Survivorship Bias ---")
print("Saving plots to module_05_survivorship.png\n")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Panel 1: Growth paths -- survivors vs failures
ax = axes[0]
for i in range(n_funds):
    color = "green" if alive[i] else "red"
    alpha = 0.3 if alive[i] else 0.15
    years_active = death_year[i]
    ax.plot(range(years_active + 1),
            np.concatenate([[1.0], all_cumulative[:years_active, i]]),
            color=color, alpha=alpha, linewidth=0.5)

ax.set_title("Fund Growth Paths\n(green=survived, red=failed)", fontsize=11)
ax.set_xlabel("Year")
ax.set_ylabel("Growth of $1")
ax.grid(True, alpha=0.3)

# Panel 2: Distribution of annualized returns
ax = axes[1]
ax.hist(survivor_annualized, bins=20, alpha=0.6, color="green",
        label=f"Survivors (n={n_survivors})", edgecolor="white")
ax.hist(dead_annualized, bins=15, alpha=0.6, color="red",
        label=f"Failed (n={n_failures})", edgecolor="white")
ax.axvline(true_avg, color="black", linestyle="-", linewidth=2,
           label=f"True mean: {true_avg:.2%}")
ax.axvline(survivor_avg, color="green", linestyle="--", linewidth=2,
           label=f"Survivor mean: {survivor_avg:.2%}")
ax.set_title("Annualized Returns Distribution", fontsize=11)
ax.set_xlabel("Annualized Return")
ax.set_ylabel("Count")
ax.legend(fontsize=8)
ax.grid(True, alpha=0.3)

fig.tight_layout()
fig.savefig("module_05_survivorship.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Section 5: Look-Ahead Bias
# ---------------------------------------------------------------------------
print("\n--- Section 5: Look-Ahead Bias ---")
print("""
Look-ahead bias occurs when your analysis uses information that would
NOT have been available at the time of the decision.

Classic example: selecting stocks based on next year's earnings,
then measuring how they performed that year. Of course they did well --
you used FUTURE information to pick them!
""")

# Simulate: 50 stocks, pick top 10 by FUTURE return vs PAST return
n_stocks = 50
past_returns = np.random.normal(0.08, 0.20, n_stocks)
future_returns = np.random.normal(0.08, 0.20, n_stocks)

# Strategy 1 (CHEATING): pick top 10 by future returns
top_future = np.argsort(future_returns)[-10:]
biased_perf = future_returns[top_future].mean()

# Strategy 2 (FAIR): pick top 10 by past returns
top_past = np.argsort(past_returns)[-10:]
fair_perf = future_returns[top_past].mean()

# Benchmark: equal weight all 50
benchmark = future_returns.mean()

print(f"  Look-ahead (pick by future returns):  {biased_perf:.2%}  <-- CHEATING!")
print(f"  Fair (pick by past returns):           {fair_perf:.2%}")
print(f"  Equal-weight benchmark:                {benchmark:.2%}")
print(f"\n  Look-ahead inflation:                  {biased_perf - benchmark:.2%}")
print("\nThe look-ahead strategy appears amazing, but it is impossible to")
print("implement in real time. Always ask: 'Would I have known this then?'")

# ---------------------------------------------------------------------------
# Section 6: Monte Carlo -- Distribution of the Bias
# ---------------------------------------------------------------------------
print("\n--- Section 6: Monte Carlo -- How Large is the Bias? ---\n")

n_simulations = 1000
biases = []

for _ in range(n_simulations):
    sim_returns = np.random.normal(annual_mu, annual_sigma, (n_years, n_funds))
    sim_cumulative = np.cumprod(1 + sim_returns, axis=0)
    sim_alive = sim_cumulative[-1, :] > (1 + failure_threshold)
    sim_annualized = sim_cumulative[-1, :] ** (1.0 / n_years) - 1
    true_mean = sim_annualized.mean()
    surv_mean = sim_annualized[sim_alive].mean() if sim_alive.any() else true_mean
    biases.append(surv_mean - true_mean)

biases = np.array(biases)
print(f"Over {n_simulations} simulations:")
print(f"  Mean survivorship bias: {biases.mean():.4f}  ({biases.mean():.2%})")
print(f"  Std of bias:            {biases.std():.4f}")
print(f"  Max bias observed:      {biases.max():.4f}  ({biases.max():.2%})")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 05:")
print("  1. Survivorship bias inflates average returns by ~1-2% per year.")
print("  2. Always ask: 'Are the losers missing from my dataset?'")
print("  3. Look-ahead bias uses future info -- makes any strategy look good.")
print("  4. Both biases are silent -- your code runs without errors.")
print("  5. Use point-in-time databases when available for research.")
print("\n" + "=" * 70)
print("End of Module 05")
print("=" * 70)
