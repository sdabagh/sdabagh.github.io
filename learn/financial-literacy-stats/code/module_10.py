"""
Module 10 -- Time Value of Money
==================================
A dollar today is worth more than a dollar tomorrow. This module covers
present value, discount factors, yield curves, and bond mathematics
(price, duration, convexity).

Requirements: pandas, numpy, matplotlib
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

print("=" * 70)
print("MODULE 10 -- Time Value of Money")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Present Value for Different Discount Rates
# ---------------------------------------------------------------------------
print("\n--- Section 1: Present Value ---")
print("""
The present value (PV) of a future cash flow is what that cash flow is
worth TODAY, given a discount rate r and time horizon t:

  PV = FV / (1 + r)^t

Higher discount rates reduce present value (future money is worth less).
""")

future_value = 1000
years = np.arange(1, 31)
rates = [0.02, 0.05, 0.08, 0.12]

print(f"Future Value: ${future_value}")
print(f"\nPresent Value of ${future_value} received in year T:\n")
print(f"  {'Year':>6}", end="")
for r in rates:
    print(f"  r={r:.0%}:>10", end="")
print()

# Print a selection of years
for t in [1, 5, 10, 15, 20, 30]:
    print(f"  {t:>6}", end="")
    for r in rates:
        pv = future_value / (1 + r) ** t
        print(f"  ${pv:>8.2f}", end="")
    print()

print("\nAt 12% discount rate, $1000 in 30 years is worth only",
      f"${future_value / (1.12)**30:.2f} today!")

# ---------------------------------------------------------------------------
# Section 2: Discount Factor Curves
# ---------------------------------------------------------------------------
print("\n--- Section 2: Discount Factor Curves ---")
print("The discount factor d(t) = 1/(1+r)^t maps future cash flows to today.")
print("Saving to module_10_discount_factors.png\n")

fig, ax = plt.subplots(figsize=(10, 5))
for r in rates:
    df_vals = 1 / (1 + r) ** years
    ax.plot(years, df_vals, linewidth=2, label=f"r = {r:.0%}")

ax.set_title("Discount Factor Curves", fontsize=13)
ax.set_xlabel("Years into the Future")
ax.set_ylabel("Discount Factor (PV of $1)")
ax.legend()
ax.grid(True, alpha=0.3)
ax.set_ylim(0, 1.05)
fig.tight_layout()
fig.savefig("module_10_discount_factors.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Section 3: Treasury Yield Curve
# ---------------------------------------------------------------------------
print("\n--- Section 3: Treasury Yield Curve ---")
print("""
The yield curve shows interest rates at different maturities.
A normal (upward-sloping) curve means longer maturities pay higher yields.
An inverted curve (short rates > long rates) often precedes recessions.

We use representative US Treasury yields as of early 2024.
""")

# Representative Treasury yields (approximate, early 2024)
maturities = [1/12, 3/12, 6/12, 1, 2, 3, 5, 7, 10, 20, 30]
maturity_labels = ["1M", "3M", "6M", "1Y", "2Y", "3Y",
                   "5Y", "7Y", "10Y", "20Y", "30Y"]
yields_2024 = [5.40, 5.38, 5.27, 4.88, 4.42, 4.18,
               4.05, 4.08, 4.15, 4.42, 4.30]  # percent

# Also show a "normal" curve (approximate 2017)
yields_2017 = [0.90, 1.10, 1.30, 1.55, 1.89, 2.05,
               2.25, 2.40, 2.50, 2.70, 2.80]

print("Maturity | Yield 2024 | Yield 2017")
print("-" * 40)
for lbl, y24, y17 in zip(maturity_labels, yields_2024, yields_2017):
    print(f"  {lbl:>5}  |   {y24:.2f}%    |   {y17:.2f}%")

print("\n2024: inverted at the short end (short rates > 10Y rate).")
print("2017: normal upward-sloping curve.")

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(maturities, yields_2024, "o-", linewidth=2, color="steelblue",
        label="2024 (inverted short end)")
ax.plot(maturities, yields_2017, "s--", linewidth=2, color="orange",
        label="2017 (normal)")
ax.set_title("US Treasury Yield Curves", fontsize=13)
ax.set_xlabel("Maturity (Years)")
ax.set_ylabel("Yield (%)")
ax.legend()
ax.grid(True, alpha=0.3)
ax.set_xticks(maturities)
ax.set_xticklabels(maturity_labels, fontsize=8)
fig.tight_layout()
fig.savefig("module_10_yield_curve.png", dpi=150)
plt.close(fig)
print("Saved yield curve to module_10_yield_curve.png\n")

# ---------------------------------------------------------------------------
# Section 4: Bond Pricing
# ---------------------------------------------------------------------------
print("--- Section 4: Bond Price ---")
print("""
A bond pays fixed coupons (c) and returns face value (F) at maturity (T).
Its price is the present value of all future cash flows:

  P = sum_{t=1}^{T} c / (1+y)^t  +  F / (1+y)^T

where y is the yield to maturity (discount rate).
""")

def bond_price(face, coupon_rate, ytm, maturity, freq=2):
    """Compute bond price with semi-annual coupons."""
    c = face * coupon_rate / freq       # coupon payment
    n = int(maturity * freq)            # total periods
    y = ytm / freq                      # period yield
    periods = np.arange(1, n + 1)
    pv_coupons = np.sum(c / (1 + y) ** periods)
    pv_face = face / (1 + y) ** n
    return pv_coupons + pv_face

face = 1000
coupon_rate = 0.05  # 5% annual coupon
maturity = 10       # 10-year bond

print(f"Bond: {coupon_rate:.0%} coupon, {maturity}-year, ${face} face value")
print(f"Semi-annual coupons of ${face * coupon_rate / 2:.2f}\n")

ytm_range = np.arange(0.01, 0.11, 0.005)
price_list = [bond_price(face, coupon_rate, y, maturity) for y in ytm_range]

print(f"  {'YTM':>6} | {'Price':>10}")
print(f"  {'-'*6} | {'-'*10}")
for y in [0.02, 0.04, 0.05, 0.06, 0.08, 0.10]:
    p = bond_price(face, coupon_rate, y, maturity)
    label = " (par)" if abs(y - coupon_rate) < 0.001 else ""
    print(f"  {y:>5.1%} | ${p:>9.2f}{label}")

print("\nWhen YTM = coupon rate, price = par ($1000). Key bond relationship!")

# ---------------------------------------------------------------------------
# Section 5: Duration and Convexity
# ---------------------------------------------------------------------------
print("\n--- Section 5: Duration and Convexity ---")
print("""
Duration measures a bond's price sensitivity to interest rate changes.
It is the weighted average time to receive cash flows.

Macaulay Duration:  D = (1/P) * sum_{t} t * CF_t / (1+y)^t
Modified Duration:  D_mod = D_mac / (1 + y/freq)

Convexity measures the curvature of the price-yield relationship.
It improves the duration approximation for large rate changes.
""")

def bond_duration_convexity(face, coupon_rate, ytm, maturity, freq=2):
    """Compute Macaulay duration, modified duration, and convexity."""
    c = face * coupon_rate / freq
    n = int(maturity * freq)
    y = ytm / freq
    periods = np.arange(1, n + 1)

    # Cash flows
    cfs = np.full(n, c)
    cfs[-1] += face  # add face value at maturity

    # Present values
    pvs = cfs / (1 + y) ** periods
    price = pvs.sum()

    # Macaulay duration (in periods, then convert to years)
    mac_dur = np.sum(periods * pvs) / price / freq

    # Modified duration
    mod_dur = mac_dur / (1 + y)

    # Convexity
    convexity = np.sum(periods * (periods + 1) * pvs) / (price * (1 + y)**2 * freq**2)

    return price, mac_dur, mod_dur, convexity

ytm = 0.05  # 5% yield
price, mac_dur, mod_dur, convexity = bond_duration_convexity(
    face, coupon_rate, ytm, maturity)

print(f"Bond: {coupon_rate:.0%} coupon, {maturity}Y, YTM = {ytm:.0%}")
print(f"  Price:              ${price:.2f}")
print(f"  Macaulay Duration:  {mac_dur:.4f} years")
print(f"  Modified Duration:  {mod_dur:.4f}")
print(f"  Convexity:          {convexity:.4f}")

# Demonstrate duration approximation
dy = 0.01  # 100 basis point increase
price_new_actual = bond_price(face, coupon_rate, ytm + dy, maturity)
price_change_actual = price_new_actual - price

# Duration-only approximation
price_change_dur = -mod_dur * dy * price

# Duration + convexity approximation
price_change_dur_conv = (-mod_dur * dy + 0.5 * convexity * dy**2) * price

print(f"\nFor a {dy*10000:.0f}bp increase in yield:")
print(f"  Actual price change:          ${price_change_actual:.2f}")
print(f"  Duration approximation:       ${price_change_dur:.2f}")
print(f"  Duration + convexity approx:  ${price_change_dur_conv:.2f}")
print("\nConvexity correction improves the estimate, especially for large moves.")

# Plot price-yield relationship
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(ytm_range * 100, price_list, linewidth=2, color="steelblue")
ax.axhline(face, color="gray", linestyle="--", alpha=0.5, label="Par ($1000)")
ax.axvline(coupon_rate * 100, color="gray", linestyle=":", alpha=0.5)
ax.set_title("Bond Price vs Yield to Maturity", fontsize=13)
ax.set_xlabel("Yield to Maturity (%)")
ax.set_ylabel("Bond Price ($)")
ax.legend()
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_10_bond_price_yield.png", dpi=150)
plt.close(fig)
print("\nSaved bond price-yield plot to module_10_bond_price_yield.png")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 10:")
print("  1. A dollar today > a dollar tomorrow (time value of money).")
print("  2. The yield curve shows how rates vary by maturity.")
print("  3. Bond prices move INVERSELY to yields.")
print("  4. Duration measures price sensitivity to rate changes.")
print("  5. Convexity captures the curvature that duration misses.")
print("\n" + "=" * 70)
print("End of Module 10")
print("=" * 70)
