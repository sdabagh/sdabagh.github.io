"""
Module 16: Machine Learning in Finance
========================================
Topics covered:
  - Download stock data, create features (lags, moving averages, volatility)
  - Implement proper walk-forward validation
  - Compare Random Forest vs Linear Regression vs Gradient Boosting
  - Show R-squared is very low (poor signal-to-noise in finance)
  - Feature importance analysis
  - Show overfitting: in-sample R^2 vs out-of-sample R^2
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import warnings
warnings.filterwarnings("ignore")

print("=" * 70)
print("MODULE 16 : Machine Learning in Finance")
print("=" * 70)

# ---------------------------------------------------------------------------
# 1. Download data and create features
# ---------------------------------------------------------------------------
print("\n--- 1. Feature Engineering ---")
ticker = "SPY"
data = yf.download(ticker, start="2010-01-01", auto_adjust=True, progress=False)
if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)

df = pd.DataFrame(index=data.index)
df["Close"] = data["Close"]
df["Volume"] = data["Volume"]
df["Return"] = df["Close"].pct_change()

# Target: next-day return
df["Target"] = df["Return"].shift(-1)

# Features: lagged returns
for lag in [1, 2, 3, 5, 10, 21]:
    df[f"Ret_lag{lag}"] = df["Return"].shift(lag)

# Moving averages of returns
for win in [5, 10, 21, 63]:
    df[f"MA_ret_{win}"] = df["Return"].rolling(win).mean()

# Realized volatility
for win in [5, 10, 21]:
    df[f"Vol_{win}"] = df["Return"].rolling(win).std()

# Volume change
df["Vol_chg"] = df["Volume"].pct_change()

# RSI-like momentum (simplified)
df["Mom_5"] = df["Close"].pct_change(5)
df["Mom_21"] = df["Close"].pct_change(21)

df = df.dropna()
feature_cols = [c for c in df.columns if c not in ["Close", "Volume", "Return", "Target"]]
print(f"Features created: {len(feature_cols)}")
print(f"  {feature_cols}")
print(f"Samples: {len(df)}")

# ---------------------------------------------------------------------------
# 2. Walk-forward validation
# ---------------------------------------------------------------------------
print("\n--- 2. Walk-Forward Validation ---")
print("  Train on expanding window, test on next 63 days (~1 quarter).")
print("  This avoids look-ahead bias that plagues naive train/test splits.\n")

X = df[feature_cols].values
y = df["Target"].values
dates = df.index

models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=3,
                                                    learning_rate=0.05, random_state=42),
}

# Walk-forward parameters
min_train = 504  # ~2 years minimum training
step = 63        # re-train every quarter
results = {name: {"preds": [], "actuals": [], "dates": []} for name in models}

for start in range(min_train, len(X) - step, step):
    X_train, y_train = X[:start], y[:start]
    X_test, y_test = X[start:start + step], y[start:start + step]
    test_dates = dates[start:start + step]

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        results[name]["preds"].extend(preds)
        results[name]["actuals"].extend(y_test)
        results[name]["dates"].extend(test_dates)

# ---------------------------------------------------------------------------
# 3. Compare models
# ---------------------------------------------------------------------------
print("--- 3. Model Comparison (Out-of-Sample) ---")
print(f"{'Model':<25} {'R-squared':>10} {'MAE':>12}")
print("-" * 50)

for name in models:
    preds = np.array(results[name]["preds"])
    actuals = np.array(results[name]["actuals"])
    r2 = r2_score(actuals, preds)
    mae = mean_absolute_error(actuals, preds)
    print(f"{name:<25} {r2:>10.4f} {mae:>12.6f}")

print("\n  -> R-squared values are extremely low (often negative!).")
print("     This is the reality of financial prediction: signal-to-noise is tiny.")
print("     A model with R^2 of 0.01 can still be profitable if sized correctly,")
print("     but most apparent 'signal' is noise.\n")

# ---------------------------------------------------------------------------
# 4. Feature importance (Gradient Boosting)
# ---------------------------------------------------------------------------
print("--- 4. Feature Importance (Gradient Boosting) ---")
# Fit on full dataset for feature importance visualization
gb_full = GradientBoostingRegressor(n_estimators=100, max_depth=3,
                                     learning_rate=0.05, random_state=42)
gb_full.fit(X, y)
importances = pd.Series(gb_full.feature_importances_, index=feature_cols).sort_values(ascending=True)

fig, ax = plt.subplots(figsize=(8, 6))
importances.plot(kind="barh", ax=ax, color="steelblue")
ax.set_title("Feature Importance (Gradient Boosting)")
ax.set_xlabel("Importance")
plt.tight_layout()
plt.savefig("module_16_feature_importance.png", dpi=150)
plt.show()
print("Feature importance plot saved as module_16_feature_importance.png")

print("\nTop 5 features:")
for feat, imp in importances.tail(5).items():
    print(f"  {feat:>15}: {imp:.4f}")

# ---------------------------------------------------------------------------
# 5. Overfitting demonstration
# ---------------------------------------------------------------------------
print("\n--- 5. Overfitting: In-Sample vs Out-of-Sample R-squared ---")
print(f"{'Model':<25} {'In-sample R2':>14} {'OOS R2':>10} {'Gap':>10}")
print("-" * 62)

for name, model_template in [
    ("Linear Regression", LinearRegression()),
    ("Random Forest (deep)", RandomForestRegressor(n_estimators=200, max_depth=None, random_state=42)),
    ("Random Forest (shallow)", RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)),
    ("Gradient Boosting", GradientBoostingRegressor(n_estimators=200, max_depth=5,
                                                      learning_rate=0.05, random_state=42)),
]:
    # Use first 80% as train, last 20% as test
    split = int(len(X) * 0.8)
    X_tr, X_te = X[:split], X[split:]
    y_tr, y_te = y[:split], y[split:]

    model_template.fit(X_tr, y_tr)
    is_r2 = r2_score(y_tr, model_template.predict(X_tr))
    oos_r2 = r2_score(y_te, model_template.predict(X_te))
    gap = is_r2 - oos_r2
    print(f"{name:<25} {is_r2:>14.4f} {oos_r2:>10.4f} {gap:>10.4f}")

print("\n  -> Deep Random Forest has high in-sample R^2 but terrible out-of-sample.")
print("     This is classic overfitting: memorizing noise instead of learning signal.")
print("     Shallow models and regularization reduce this gap.")

# ---------------------------------------------------------------------------
# 6. Prediction scatter plot
# ---------------------------------------------------------------------------
print("\n--- 6. Prediction vs Actual (Gradient Boosting) ---")
gb_preds = np.array(results["Gradient Boosting"]["preds"])
gb_actuals = np.array(results["Gradient Boosting"]["actuals"])

fig, ax = plt.subplots(figsize=(7, 7))
ax.scatter(gb_actuals * 100, gb_preds * 100, alpha=0.2, s=10, color="steelblue")
lims = [-4, 4]
ax.plot(lims, lims, "r--", linewidth=1, label="Perfect prediction")
ax.axhline(0, color="gray", linewidth=0.5)
ax.axvline(0, color="gray", linewidth=0.5)
ax.set_xlim(lims)
ax.set_ylim(lims)
ax.set_xlabel("Actual Next-Day Return (%)")
ax.set_ylabel("Predicted Next-Day Return (%)")
ax.set_title("Prediction vs Reality: The Humbling Truth of ML in Finance")
ax.legend()
ax.set_aspect("equal")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("module_16_pred_scatter.png", dpi=150)
plt.show()
print("Scatter plot saved as module_16_pred_scatter.png")

print("\n  KEY TAKEAWAYS")
print("  1. Financial returns have extremely low signal-to-noise ratios.")
print("  2. Walk-forward validation is essential to avoid look-ahead bias.")
print("  3. Overfitting is the primary enemy; complexity hurts out-of-sample.")
print("  4. Even low R^2 models can be useful if they capture true (small) edge.")
print("  5. Always compare in-sample vs out-of-sample performance.")
print("=" * 70)
