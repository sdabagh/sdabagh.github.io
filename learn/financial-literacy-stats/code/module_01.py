"""
Module 01 -- From Datasets to Markets
======================================
This script introduces financial market data using Apple (AAPL) stock.
We explore the OHLCV data structure, trading vs calendar days, and
basic price visualization.

Requirements: yfinance, pandas, matplotlib
"""

import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Section 1: Downloading Stock Data
# ---------------------------------------------------------------------------
print("=" * 70)
print("MODULE 01 -- From Datasets to Markets")
print("=" * 70)

print("\n--- Section 1: Downloading AAPL Stock Data ---")
print("We use the yfinance library to pull historical market data from Yahoo")
print("Finance. This is free, real data that updates daily.\n")

# Download two years of daily Apple data
ticker = "AAPL"
end_date = datetime.today()
start_date = end_date - timedelta(days=730)  # roughly 2 years

df = yf.download(ticker, start=start_date.strftime("%Y-%m-%d"),
                 end=end_date.strftime("%Y-%m-%d"), auto_adjust=False)

print(f"Downloaded {len(df)} rows for {ticker}")
print(f"Date range: {df.index.min().date()} to {df.index.max().date()}\n")

# ---------------------------------------------------------------------------
# Section 2: Understanding OHLCV Structure
# ---------------------------------------------------------------------------
print("\n--- Section 2: OHLCV Structure ---")
print("""
Every row in a daily stock dataset represents ONE trading day.
The columns are:

  Open   -- the price at which the stock first traded when the market opened
  High   -- the highest price reached during the day
  Low    -- the lowest price reached during the day
  Close  -- the last traded price before the market closed
  Volume -- the total number of shares that changed hands

Together these are called OHLCV data. The Adj Close column adjusts the
closing price for dividends and stock splits so you can compute accurate
long-term returns.
""")

# Flatten MultiIndex columns if present (yfinance sometimes returns them)
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

print("First 5 rows of AAPL data:")
print(df.head().to_string())
print(f"\nColumn dtypes:\n{df.dtypes}")

# ---------------------------------------------------------------------------
# Section 3: Trading Days vs Calendar Days
# ---------------------------------------------------------------------------
print("\n\n--- Section 3: Trading Days vs Calendar Days ---")
print("""
US stock markets are open Monday-Friday, excluding federal holidays.
This means roughly 252 trading days per year, NOT 365.
""")

# Count actual trading days vs calendar days in our sample
calendar_days = (df.index.max() - df.index.min()).days
trading_days = len(df)

print(f"Calendar days in sample:  {calendar_days}")
print(f"Trading days in sample:   {trading_days}")
print(f"Ratio (trading/calendar): {trading_days / calendar_days:.2%}")
print(f"Expected ratio (~252/365): {252/365:.2%}")

# Show that weekends are missing
print("\nDay-of-week distribution (0=Mon, 4=Fri):")
day_counts = df.index.dayofweek.value_counts().sort_index()
day_names = {0: "Monday", 1: "Tuesday", 2: "Wednesday",
             3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
for day_num, count in day_counts.items():
    print(f"  {day_names[day_num]:>10}: {count} days")

print("\nNotice: Saturday and Sunday have ZERO entries.")

# ---------------------------------------------------------------------------
# Section 4: Plotting Closing Prices
# ---------------------------------------------------------------------------
print("\n--- Section 4: Closing Price Time Series ---")
print("A closing-price chart is the most basic financial visualization.")
print("Saving plot to module_01_closing_price.png\n")

fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(df.index, df["Close"], linewidth=1.0, color="steelblue")
ax.set_title(f"{ticker} Daily Closing Price", fontsize=14)
ax.set_xlabel("Date")
ax.set_ylabel("Price (USD)")
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig.savefig("module_01_closing_price.png", dpi=150)
plt.close(fig)
print("Plot saved.")

# ---------------------------------------------------------------------------
# Section 5: Daily Data vs Intraday Structure
# ---------------------------------------------------------------------------
print("\n--- Section 5: Daily vs Intraday Data ---")
print("""
The data we downloaded is DAILY -- one row per trading day.
Intraday data comes at finer granularity: 1-minute, 5-minute, etc.

Key differences:
  - Daily data is widely available for free going back decades.
  - Intraday data is much larger (390 one-minute bars per day) and
    often requires paid data vendors for historical access.
  - Daily data is sufficient for most portfolio analysis and long-term
    studies. Intraday data is used for algorithmic trading research.

Let's peek at a short window of intraday data to compare.
""")

# Download a small window of intraday data (yfinance supports up to ~60 days
# of 1-minute data and longer windows for 1-hour data)
try:
    intraday = yf.download(ticker, period="5d", interval="1h", auto_adjust=False)
    if isinstance(intraday.columns, pd.MultiIndex):
        intraday.columns = intraday.columns.get_level_values(0)
    print(f"Intraday (1-hour) data: {len(intraday)} bars over ~5 trading days")
    print(f"That is ~{len(intraday)//5} bars per day (market hours).\n")
    print("First 10 intraday rows:")
    print(intraday.head(10).to_string())
except Exception as e:
    print(f"(Intraday download skipped: {e})")

# ---------------------------------------------------------------------------
# Section 6: Summary Statistics
# ---------------------------------------------------------------------------
print("\n\n--- Section 6: Summary Statistics ---")
print("Basic descriptive statistics for the daily AAPL data:\n")
print(df[["Open", "High", "Low", "Close", "Volume"]].describe().to_string())

print("\n\nKey takeaways from Module 01:")
print("  1. Financial data comes in OHLCV format.")
print("  2. Markets trade ~252 days/year (no weekends or holidays).")
print("  3. Daily vs intraday data serve different analytical purposes.")
print("  4. Always check your data dimensions and date range before analysis.")
print("\n" + "=" * 70)
print("End of Module 01")
print("=" * 70)
