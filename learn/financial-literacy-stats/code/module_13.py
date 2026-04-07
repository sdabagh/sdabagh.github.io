"""
Module 13: Options & Derivatives
=================================
Topics covered:
  - Black-Scholes formula for European call and put
  - Greeks: Delta, Gamma, Theta, Vega
  - Option payoff diagrams (call, put, straddle)
  - Volatility smile (implied vol vs strike)
  - Put-call parity verification
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# ---------------------------------------------------------------------------
# Black-Scholes helpers
# ---------------------------------------------------------------------------

def d1(S, K, T, r, sigma):
    """d1 term in Black-Scholes."""
    return (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))


def d2(S, K, T, r, sigma):
    """d2 = d1 - sigma * sqrt(T)."""
    return d1(S, K, T, r, sigma) - sigma * np.sqrt(T)


def bs_call(S, K, T, r, sigma):
    """Black-Scholes European call price."""
    dd1 = d1(S, K, T, r, sigma)
    dd2 = d2(S, K, T, r, sigma)
    return S * norm.cdf(dd1) - K * np.exp(-r * T) * norm.cdf(dd2)


def bs_put(S, K, T, r, sigma):
    """Black-Scholes European put price."""
    dd1 = d1(S, K, T, r, sigma)
    dd2 = d2(S, K, T, r, sigma)
    return K * np.exp(-r * T) * norm.cdf(-dd2) - S * norm.cdf(-dd1)


# ---------------------------------------------------------------------------
# Greeks
# ---------------------------------------------------------------------------

def delta_call(S, K, T, r, sigma):
    return norm.cdf(d1(S, K, T, r, sigma))

def delta_put(S, K, T, r, sigma):
    return delta_call(S, K, T, r, sigma) - 1.0

def gamma(S, K, T, r, sigma):
    dd1 = d1(S, K, T, r, sigma)
    return norm.pdf(dd1) / (S * sigma * np.sqrt(T))

def vega(S, K, T, r, sigma):
    """Vega per 1 % move in vol (divide by 100 for per-point)."""
    dd1 = d1(S, K, T, r, sigma)
    return S * norm.pdf(dd1) * np.sqrt(T) / 100

def theta_call(S, K, T, r, sigma):
    """Theta per calendar day."""
    dd1 = d1(S, K, T, r, sigma)
    dd2 = d2(S, K, T, r, sigma)
    term1 = -S * norm.pdf(dd1) * sigma / (2 * np.sqrt(T))
    term2 = -r * K * np.exp(-r * T) * norm.cdf(dd2)
    return (term1 + term2) / 365

def theta_put(S, K, T, r, sigma):
    dd1 = d1(S, K, T, r, sigma)
    dd2 = d2(S, K, T, r, sigma)
    term1 = -S * norm.pdf(dd1) * sigma / (2 * np.sqrt(T))
    term2 = r * K * np.exp(-r * T) * norm.cdf(-dd2)
    return (term1 + term2) / 365


# ---------------------------------------------------------------------------
# Implied volatility via bisection
# ---------------------------------------------------------------------------

def implied_vol(market_price, S, K, T, r, option_type="call", tol=1e-6):
    """Find implied volatility using bisection."""
    lo, hi = 0.001, 5.0
    pricer = bs_call if option_type == "call" else bs_put
    for _ in range(200):
        mid = (lo + hi) / 2
        p = pricer(S, K, T, r, mid)
        if p > market_price:
            hi = mid
        else:
            lo = mid
        if hi - lo < tol:
            break
    return (lo + hi) / 2


# ===========================================================================
print("=" * 70)
print("MODULE 13 : Options & Derivatives")
print("=" * 70)

# Parameters
S = 100      # current stock price
K = 100      # strike price (at-the-money)
T = 0.5      # 6 months to expiry
r = 0.05     # risk-free rate
sigma = 0.20 # volatility (20 %)

# ---------------------------------------------------------------------------
# 1. Black-Scholes pricing
# ---------------------------------------------------------------------------
print("\n--- 1. Black-Scholes Pricing ---")
call_px = bs_call(S, K, T, r, sigma)
put_px = bs_put(S, K, T, r, sigma)
print(f"Stock price  S = ${S}")
print(f"Strike       K = ${K}")
print(f"Time to exp  T = {T} yr")
print(f"Risk-free    r = {r:.2%}")
print(f"Volatility   s = {sigma:.2%}")
print(f"Call price       = ${call_px:.4f}")
print(f"Put price        = ${put_px:.4f}")

# ---------------------------------------------------------------------------
# 2. Greeks
# ---------------------------------------------------------------------------
print("\n--- 2. Greeks (ATM option) ---")
print(f"{'Greek':<15} {'Call':>10} {'Put':>10}")
print("-" * 37)
print(f"{'Delta':<15} {delta_call(S,K,T,r,sigma):>10.4f} {delta_put(S,K,T,r,sigma):>10.4f}")
print(f"{'Gamma':<15} {gamma(S,K,T,r,sigma):>10.4f} {gamma(S,K,T,r,sigma):>10.4f}")
print(f"{'Theta (day)':<15} {theta_call(S,K,T,r,sigma):>10.4f} {theta_put(S,K,T,r,sigma):>10.4f}")
print(f"{'Vega (1%)':<15} {vega(S,K,T,r,sigma):>10.4f} {vega(S,K,T,r,sigma):>10.4f}")
print("\n  -> Delta: how much the option price moves per $1 stock move.")
print("  -> Gamma: rate of change of Delta (same for call and put).")
print("  -> Theta: daily time decay (negative = option loses value each day).")
print("  -> Vega: sensitivity to a 1 % change in implied volatility.")

# ---------------------------------------------------------------------------
# 3. Payoff diagrams
# ---------------------------------------------------------------------------
print("\n--- 3. Payoff Diagrams ---")
S_range = np.linspace(60, 140, 300)
call_payoff = np.maximum(S_range - K, 0) - call_px
put_payoff = np.maximum(K - S_range, 0) - put_px
straddle_payoff = call_payoff + put_payoff

fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)
for ax, payoff, title in zip(axes,
                              [call_payoff, put_payoff, straddle_payoff],
                              ["Long Call", "Long Put", "Long Straddle"]):
    ax.plot(S_range, payoff, "b-", linewidth=2)
    ax.axhline(0, color="k", linewidth=0.5)
    ax.axvline(K, color="gray", linestyle="--", alpha=0.5)
    ax.fill_between(S_range, payoff, 0, where=payoff > 0, alpha=0.15, color="green")
    ax.fill_between(S_range, payoff, 0, where=payoff < 0, alpha=0.15, color="red")
    ax.set_title(title)
    ax.set_xlabel("Stock Price at Expiry ($)")
    ax.grid(True, alpha=0.3)
axes[0].set_ylabel("Profit / Loss ($)")
plt.tight_layout()
plt.savefig("module_13_payoffs.png", dpi=150)
plt.show()
print("Payoff diagrams saved as module_13_payoffs.png")

# ---------------------------------------------------------------------------
# 4. Volatility smile
# ---------------------------------------------------------------------------
print("\n--- 4. Volatility Smile ---")
print("  We simulate 'market' prices using a local vol model where OTM options")
print("  have higher implied vol, then back out the implied vol for each strike.\n")

strikes = np.linspace(80, 120, 25)
# Simulate a smile: true vol is higher for away-from-money strikes
true_vols = 0.20 + 0.0015 * (strikes - 100) ** 2 / 100  # parabolic smile
market_prices = np.array([bs_call(S, k, T, r, tv) for k, tv in zip(strikes, true_vols)])

# Back out implied vols from market prices
iv_curve = np.array([implied_vol(p, S, k, T, r) for p, k in zip(market_prices, strikes)])

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(strikes, iv_curve * 100, "bo-", markersize=5, label="Implied volatility")
ax.axvline(S, color="gray", linestyle="--", alpha=0.5, label="ATM")
ax.set_xlabel("Strike Price ($)")
ax.set_ylabel("Implied Volatility (%)")
ax.set_title("Volatility Smile")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_13_vol_smile.png", dpi=150)
plt.show()
print("Volatility smile plot saved as module_13_vol_smile.png")
print("  -> In real markets, OTM puts often have higher IV (volatility skew).")

# ---------------------------------------------------------------------------
# 5. Put-call parity
# ---------------------------------------------------------------------------
print("\n--- 5. Put-Call Parity Verification ---")
print("  Theory: C - P = S - K * exp(-rT)")
lhs = call_px - put_px
rhs = S - K * np.exp(-r * T)
print(f"  C - P            = {lhs:.6f}")
print(f"  S - K*exp(-rT)   = {rhs:.6f}")
print(f"  Difference       = {abs(lhs - rhs):.2e}")
print("  -> Put-call parity holds to machine precision in Black-Scholes.")

print("\n  KEY TAKEAWAYS")
print("  1. Black-Scholes provides closed-form prices for European options.")
print("  2. Greeks quantify sensitivities to underlying parameters.")
print("  3. Implied volatility varies by strike (smile/skew) in real markets,")
print("     violating the constant-vol assumption of Black-Scholes.")
print("  4. Put-call parity is a model-free no-arbitrage relationship.")
print("=" * 70)
