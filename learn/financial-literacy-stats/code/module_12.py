"""
Module 12: Bonds & Fixed Income
================================
Topics covered:
  - Coupon bond pricing from face value, coupon rate, YTM, maturity
  - Macaulay duration and modified duration
  - Convexity
  - Taylor approximation: actual vs duration vs duration+convexity estimate
  - Price-yield curve showing convexity
"""

import numpy as np
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def bond_price(face, coupon_rate, ytm, maturity, freq=2):
    """
    Price a fixed-rate coupon bond.
    Parameters
    ----------
    face : float        – Par / face value
    coupon_rate : float  – Annual coupon rate (e.g. 0.05 for 5 %)
    ytm : float          – Yield to maturity (annual, e.g. 0.04)
    maturity : int       – Years to maturity
    freq : int           – Coupon payments per year (2 = semi-annual)
    """
    n_periods = maturity * freq
    coupon = face * coupon_rate / freq
    y = ytm / freq  # periodic yield
    # Present value of coupons + present value of face
    pv_coupons = coupon * (1 - (1 + y) ** (-n_periods)) / y if y != 0 else coupon * n_periods
    pv_face = face / (1 + y) ** n_periods
    return pv_coupons + pv_face


def macaulay_duration(face, coupon_rate, ytm, maturity, freq=2):
    """Macaulay duration in years."""
    n_periods = maturity * freq
    coupon = face * coupon_rate / freq
    y = ytm / freq
    price = bond_price(face, coupon_rate, ytm, maturity, freq)
    # Weighted time of each cash flow
    dur = 0.0
    for t in range(1, n_periods + 1):
        cf = coupon if t < n_periods else coupon + face
        dur += t * cf / (1 + y) ** t
    return dur / (freq * price)  # convert periods to years


def modified_duration(face, coupon_rate, ytm, maturity, freq=2):
    """Modified duration = Macaulay duration / (1 + y/freq)."""
    mac = macaulay_duration(face, coupon_rate, ytm, maturity, freq)
    return mac / (1 + ytm / freq)


def convexity(face, coupon_rate, ytm, maturity, freq=2):
    """Bond convexity (in years^2)."""
    n_periods = maturity * freq
    coupon = face * coupon_rate / freq
    y = ytm / freq
    price = bond_price(face, coupon_rate, ytm, maturity, freq)
    conv = 0.0
    for t in range(1, n_periods + 1):
        cf = coupon if t < n_periods else coupon + face
        conv += t * (t + 1) * cf / (1 + y) ** (t + 2)
    return conv / (freq ** 2 * price)


# ===========================================================================
print("=" * 70)
print("MODULE 12 : Bonds & Fixed Income")
print("=" * 70)

# ---------------------------------------------------------------------------
# 1. Price a coupon bond
# ---------------------------------------------------------------------------
print("\n--- 1. Bond Pricing ---")
FACE = 1000
COUPON_RATE = 0.05   # 5 % annual coupon
YTM = 0.04           # 4 % yield to maturity
MATURITY = 10        # 10-year bond
FREQ = 2             # semi-annual coupons

price = bond_price(FACE, COUPON_RATE, YTM, MATURITY, FREQ)
print(f"Face value      : ${FACE:,.0f}")
print(f"Coupon rate     : {COUPON_RATE:.2%}")
print(f"Yield to maturity: {YTM:.2%}")
print(f"Maturity        : {MATURITY} years  (semi-annual coupons)")
print(f"Bond price      : ${price:,.2f}")
print("  -> The bond trades at a PREMIUM because coupon rate > YTM.")

# ---------------------------------------------------------------------------
# 2. Duration
# ---------------------------------------------------------------------------
print("\n--- 2. Duration ---")
mac_dur = macaulay_duration(FACE, COUPON_RATE, YTM, MATURITY, FREQ)
mod_dur = modified_duration(FACE, COUPON_RATE, YTM, MATURITY, FREQ)
print(f"Macaulay duration : {mac_dur:.4f} years")
print(f"Modified duration : {mod_dur:.4f}")
print("  -> Modified duration tells us the approximate % price change")
print("     for a 1 % change in yield: dP/P ~ -D* x dy")

# ---------------------------------------------------------------------------
# 3. Convexity
# ---------------------------------------------------------------------------
print("\n--- 3. Convexity ---")
conv = convexity(FACE, COUPON_RATE, YTM, MATURITY, FREQ)
print(f"Convexity : {conv:.4f}")
print("  -> Convexity captures the curvature of the price-yield relationship.")
print("     Higher convexity is desirable: the bond gains more when rates")
print("     fall than it loses when rates rise (all else equal).")

# ---------------------------------------------------------------------------
# 4. Taylor approximation comparison
# ---------------------------------------------------------------------------
print("\n--- 4. Taylor Approximation: Duration vs Duration + Convexity ---")
print(f"{'dy (bps)':>10} {'Actual dP':>12} {'Duration est':>14} {'Dur+Conv est':>14} {'Dur err':>10} {'D+C err':>10}")
print("-" * 75)

dy_values = np.array([-200, -100, -50, -25, 25, 50, 100, 200]) / 10000  # in decimal

for dy in dy_values:
    new_price = bond_price(FACE, COUPON_RATE, YTM + dy, MATURITY, FREQ)
    actual_dp = new_price - price

    # First-order (duration only)
    dur_est = -mod_dur * dy * price

    # Second-order (duration + convexity)
    dur_conv_est = (-mod_dur * dy + 0.5 * conv * dy ** 2) * price

    dur_err = dur_est - actual_dp
    dc_err = dur_conv_est - actual_dp

    print(f"{dy*10000:>+10.0f} {actual_dp:>12.2f} {dur_est:>14.2f} {dur_conv_est:>14.2f} {dur_err:>10.2f} {dc_err:>10.2f}")

print("\n  -> Duration alone under-estimates price gains and over-estimates losses.")
print("     Adding convexity dramatically improves the approximation.")

# ---------------------------------------------------------------------------
# 5. Price-yield curve showing convexity
# ---------------------------------------------------------------------------
print("\n--- 5. Plotting price-yield curve ---")

yields = np.linspace(0.005, 0.12, 200)
prices = np.array([bond_price(FACE, COUPON_RATE, y, MATURITY, FREQ) for y in yields])

# Tangent line at current YTM (duration approximation)
tangent = price + (-mod_dur * price) * (yields - YTM)

# Duration + convexity parabola
parabola = price + (-mod_dur * (yields - YTM) + 0.5 * conv * (yields - YTM) ** 2) * price

fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(yields * 100, prices, "b-", linewidth=2, label="Actual price-yield curve")
ax.plot(yields * 100, tangent, "r--", linewidth=1.5, label="Duration approximation (linear)")
ax.plot(yields * 100, parabola, "g-.", linewidth=1.5, label="Duration + Convexity (quadratic)")
ax.plot(YTM * 100, price, "ko", markersize=8, label=f"Current YTM = {YTM:.1%}")
ax.set_xlabel("Yield to Maturity (%)")
ax.set_ylabel("Bond Price ($)")
ax.set_title("Bond Price-Yield Curve: Convexity Illustrated")
ax.legend()
ax.set_ylim(bottom=0)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_12_price_yield.png", dpi=150)
plt.show()

print("\nPlot saved as module_12_price_yield.png")
print("\n  KEY TAKEAWAYS")
print("  1. Bond price and yield move inversely.")
print("  2. The relationship is convex (curved), not linear.")
print("  3. Duration gives a first-order (linear) approximation.")
print("  4. Adding convexity gives a much better second-order estimate.")
print("  5. Positive convexity benefits bondholders: gains > losses for equal yield moves.")
print("=" * 70)
