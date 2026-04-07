"""
Module 11 -- Stock Valuation
==============================
How much is a stock worth? This module covers the Discounted Cash Flow
(DCF) model, P/E ratio analysis across sectors, and sensitivity analysis
on key valuation inputs.

Requirements: yfinance, pandas, numpy, matplotlib
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

print("=" * 70)
print("MODULE 11 -- Stock Valuation")
print("=" * 70)

# ---------------------------------------------------------------------------
# Section 1: Simple DCF Model
# ---------------------------------------------------------------------------
print("\n--- Section 1: Discounted Cash Flow (DCF) Model ---")
print("""
A DCF values a company by discounting its expected future cash flows.

  Value = sum_{t=1}^{T} FCF_t / (1+r)^t  +  Terminal Value / (1+r)^T

Where:
  FCF_t    = Free Cash Flow in year t
  r        = discount rate (WACC)
  T        = explicit forecast period
  Terminal Value = FCF_T * (1+g) / (r - g)   [Gordon Growth Model]
  g        = long-term growth rate

This is the most fundamental valuation framework in finance.
""")

# DCF assumptions for a hypothetical company
fcf_base = 10e9          # base year free cash flow: $10 billion
growth_high = 0.15       # high growth phase: 15% for years 1-5
growth_stable = 0.03     # terminal growth: 3% (approx GDP growth)
discount_rate = 0.10     # WACC: 10%
forecast_years = 10
shares_outstanding = 5e9  # 5 billion shares

print("DCF Assumptions:")
print(f"  Base FCF:             ${fcf_base/1e9:.1f}B")
print(f"  Growth (Years 1-5):   {growth_high:.0%}")
print(f"  Growth (Years 6-10):  {(growth_high + growth_stable)/2:.0%} (tapering)")
print(f"  Terminal Growth:      {growth_stable:.0%}")
print(f"  Discount Rate (WACC): {discount_rate:.0%}")
print(f"  Shares Outstanding:   {shares_outstanding/1e9:.1f}B\n")

# Project free cash flows
fcfs = []
fcf = fcf_base
for year in range(1, forecast_years + 1):
    if year <= 5:
        g = growth_high
    else:
        # Linearly taper from high growth to stable
        g = growth_high - (growth_high - growth_stable) * (year - 5) / 5
    fcf = fcf * (1 + g)
    fcfs.append(fcf)

# Terminal value (Gordon Growth Model)
terminal_value = fcfs[-1] * (1 + growth_stable) / (discount_rate - growth_stable)

# Present values
pv_fcfs = [fcf / (1 + discount_rate)**t for t, fcf in enumerate(fcfs, 1)]
pv_terminal = terminal_value / (1 + discount_rate)**forecast_years

enterprise_value = sum(pv_fcfs) + pv_terminal
equity_value_per_share = enterprise_value / shares_outstanding

print("Projected Free Cash Flows:")
print(f"  {'Year':>4} {'FCF ($B)':>10} {'PV ($B)':>10}")
print(f"  {'-'*4} {'-'*10} {'-'*10}")
for yr, (fcf_val, pv_val) in enumerate(zip(fcfs, pv_fcfs), 1):
    print(f"  {yr:>4} {fcf_val/1e9:>10.2f} {pv_val/1e9:>10.2f}")

print(f"\n  Terminal Value:        ${terminal_value/1e9:.2f}B")
print(f"  PV of Terminal Value:  ${pv_terminal/1e9:.2f}B")
print(f"  PV of FCFs:            ${sum(pv_fcfs)/1e9:.2f}B")
print(f"  Enterprise Value:      ${enterprise_value/1e9:.2f}B")
print(f"  Equity Value/Share:    ${equity_value_per_share:.2f}")
print(f"\n  Terminal value is {pv_terminal/enterprise_value:.0%} of total value --")
print("  this heavy dependence on terminal assumptions is a key DCF weakness.")

# ---------------------------------------------------------------------------
# Section 2: P/E Ratios from yfinance
# ---------------------------------------------------------------------------
print("\n\n--- Section 2: P/E Ratios for Tech Stocks ---")
print("""
The Price-to-Earnings (P/E) ratio is the simplest valuation metric:
  P/E = Stock Price / Earnings Per Share

A high P/E can mean the market expects high future growth, OR that the
stock is overvalued. Context (sector, growth rate) is essential.
""")

tech_tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA"]
pe_data = []

for t in tech_tickers:
    try:
        info = yf.Ticker(t).info
        pe_trailing = info.get("trailingPE", None)
        pe_forward = info.get("forwardPE", None)
        market_cap = info.get("marketCap", None)
        pe_data.append({
            "Ticker": t,
            "Trailing P/E": pe_trailing,
            "Forward P/E": pe_forward,
            "Market Cap ($B)": market_cap / 1e9 if market_cap else None
        })
    except Exception as e:
        print(f"  Could not fetch {t}: {e}")

pe_df = pd.DataFrame(pe_data)
print("\nTech Stock P/E Ratios:")
print(pe_df.to_string(index=False, float_format="%.1f"))

# ---------------------------------------------------------------------------
# Section 3: Cross-Sector P/E Comparison
# ---------------------------------------------------------------------------
print("\n\n--- Section 3: Cross-Sector P/E Comparison ---")
print("""
Different sectors have different "normal" P/E ranges. High-growth tech
companies typically trade at higher multiples than utilities or banks.
""")

sector_tickers = {
    "Tech":        ["AAPL", "MSFT"],
    "Healthcare":  ["JNJ", "PFE"],
    "Energy":      ["XOM", "CVX"],
    "Finance":     ["JPM", "BAC"],
    "Consumer":    ["PG", "KO"],
}

sector_pes = []
for sector, ticks in sector_tickers.items():
    pes = []
    for t in ticks:
        try:
            info = yf.Ticker(t).info
            pe = info.get("trailingPE", None)
            if pe and pe > 0:
                pes.append(pe)
        except:
            pass
    if pes:
        sector_pes.append({
            "Sector": sector,
            "Avg P/E": np.mean(pes),
            "Stocks": ", ".join(ticks),
            "N": len(pes)
        })

sector_df = pd.DataFrame(sector_pes)
print(sector_df.to_string(index=False, float_format="%.1f"))

# Plot sector comparison
if len(sector_df) > 0:
    fig, ax = plt.subplots(figsize=(10, 5))
    colors = ["#4C72B0", "#55A868", "#C44E52", "#8172B2", "#CCB974"]
    bars = ax.bar(sector_df["Sector"], sector_df["Avg P/E"],
                  color=colors[:len(sector_df)], edgecolor="white", linewidth=1.5)
    ax.set_title("Average Trailing P/E by Sector", fontsize=13)
    ax.set_ylabel("Trailing P/E Ratio")
    ax.grid(True, alpha=0.3, axis="y")

    for bar, val in zip(bars, sector_df["Avg P/E"]):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f"{val:.1f}", ha="center", fontsize=10)

    fig.tight_layout()
    fig.savefig("module_11_sector_pe.png", dpi=150)
    plt.close(fig)
    print("\nSaved sector P/E chart to module_11_sector_pe.png")

# ---------------------------------------------------------------------------
# Section 4: DCF Sensitivity Analysis
# ---------------------------------------------------------------------------
print("\n\n--- Section 4: Sensitivity Analysis ---")
print("""
DCF valuations are highly sensitive to two key assumptions:
  1. Discount rate (WACC) -- how risky is the company?
  2. Terminal growth rate -- how fast will it grow forever?

A sensitivity table shows how the valuation changes with these inputs.
""")

discount_rates = [0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13]
terminal_growths = [0.01, 0.02, 0.03, 0.04, 0.05]

# Build sensitivity table
sensitivity = pd.DataFrame(index=[f"{r:.0%}" for r in discount_rates],
                           columns=[f"g={g:.0%}" for g in terminal_growths])

for i, r in enumerate(discount_rates):
    for j, g in enumerate(terminal_growths):
        if r <= g:
            sensitivity.iloc[i, j] = "N/A"
            continue
        # Recompute DCF with these parameters
        temp_fcfs = []
        temp_fcf = fcf_base
        for yr in range(1, forecast_years + 1):
            if yr <= 5:
                gr = growth_high
            else:
                gr = growth_high - (growth_high - g) * (yr - 5) / 5
            temp_fcf = temp_fcf * (1 + gr)
            temp_fcfs.append(temp_fcf)

        temp_tv = temp_fcfs[-1] * (1 + g) / (r - g)
        temp_pv = sum(f / (1 + r)**t for t, f in enumerate(temp_fcfs, 1))
        temp_pv += temp_tv / (1 + r)**forecast_years
        share_val = temp_pv / shares_outstanding
        sensitivity.iloc[i, j] = f"${share_val:.0f}"

print("Equity Value per Share ($):")
print(f"Rows = WACC, Columns = Terminal Growth Rate\n")
print(sensitivity.to_string())

# Heatmap of sensitivity
values_for_plot = np.zeros((len(discount_rates), len(terminal_growths)))
for i, r in enumerate(discount_rates):
    for j, g in enumerate(terminal_growths):
        if r <= g:
            values_for_plot[i, j] = np.nan
        else:
            temp_fcfs = []
            temp_fcf = fcf_base
            for yr in range(1, forecast_years + 1):
                if yr <= 5:
                    gr = growth_high
                else:
                    gr = growth_high - (growth_high - g) * (yr - 5) / 5
                temp_fcf = temp_fcf * (1 + gr)
                temp_fcfs.append(temp_fcf)
            temp_tv = temp_fcfs[-1] * (1 + g) / (r - g)
            temp_pv = sum(f / (1 + r)**t for t, f in enumerate(temp_fcfs, 1))
            temp_pv += temp_tv / (1 + r)**forecast_years
            values_for_plot[i, j] = temp_pv / shares_outstanding

fig, ax = plt.subplots(figsize=(9, 6))
im = ax.imshow(values_for_plot, cmap="RdYlGn", aspect="auto")
ax.set_xticks(range(len(terminal_growths)))
ax.set_xticklabels([f"{g:.0%}" for g in terminal_growths])
ax.set_yticks(range(len(discount_rates)))
ax.set_yticklabels([f"{r:.0%}" for r in discount_rates])
ax.set_xlabel("Terminal Growth Rate")
ax.set_ylabel("Discount Rate (WACC)")
ax.set_title("DCF Sensitivity: Equity Value per Share ($)", fontsize=13)

for i in range(len(discount_rates)):
    for j in range(len(terminal_growths)):
        val = values_for_plot[i, j]
        if not np.isnan(val):
            ax.text(j, i, f"${val:.0f}", ha="center", va="center", fontsize=9)

fig.colorbar(im, ax=ax, label="Value per Share ($)")
fig.tight_layout()
fig.savefig("module_11_dcf_sensitivity.png", dpi=150)
plt.close(fig)
print("\nSaved sensitivity heatmap to module_11_dcf_sensitivity.png")

print("\nNotice how dramatically the valuation changes:")
print("  - A 1% change in discount rate shifts value by ~15-25%")
print("  - A 1% change in terminal growth can shift value by ~20-30%")
print("  - This is why DCFs are guides, not precise price targets.")

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n\nKey takeaways from Module 11:")
print("  1. DCF is the most rigorous valuation method but is input-sensitive.")
print("  2. Terminal value often dominates (60-80% of total value).")
print("  3. P/E ratios are quick but require sector context.")
print("  4. Growth stocks trade at high P/E; value stocks at low P/E.")
print("  5. Always do sensitivity analysis -- no single 'right' valuation.")
print("\n" + "=" * 70)
print("End of Module 11")
print("=" * 70)
