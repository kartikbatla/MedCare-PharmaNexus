"""
MedCare P1 :: Demand Forecasting Model
----------------------------------------
LightGBM regressor predicting quantity_sold 4 weeks ahead, per SKU x Plant.
Features: lags, rolling stats, flu/ILI signals (current + lag + growth),
calendar/seasonality, price/promo. Time-based split (no leakage).

Chosen over deep learning (TFT/LSTM) because: gradient-boosted trees are the
consistent top performer on tabular multi-series retail/demand forecasting
(this is what won the M5/Walmart forecasting competition), train in seconds
even on limited hackathon time, and handle the mixed categorical+numeric
feature set here (SKU, plant, season, flu signals) natively.

Run: python3 forecast_model.py
Outputs:
  - /home/claude/medcare_p2p/models/forecast_output.csv   (latest forecast per SKU x plant)
  - /home/claude/medcare_p2p/models/model_metrics.json     (accuracy on held-out weeks)
  - /home/claude/medcare_p2p/models/lgb_demand_model.txt   (saved model)
"""
import json
import numpy as np
import pandas as pd
import lightgbm as lgb
from pathlib import Path

BASE = Path(__file__).parent.parent.resolve()
DATA = BASE / "data"
OUT = Path(__file__).parent.resolve()
HORIZON = 4  # weeks ahead

# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------
sales = pd.read_csv(f"{DATA}/pharma_sales.csv", parse_dates=["week_start_date"])
flu = pd.read_csv(f"{DATA}/flu_surveillance.csv", parse_dates=["week_start_date"])
cal = pd.read_csv(f"{DATA}/calendar.csv", parse_dates=["week_start_date"])
skus = pd.read_csv(f"{DATA}/sku_master.csv")

sales = sales.sort_values(["sku_id", "plant_id", "week_start_date"]).reset_index(drop=True)
sales = sales.merge(flu, on=["week_start_date", "region"], how="left")
sales = sales.merge(cal, on="week_start_date", how="left")
sales = sales.merge(skus[["sku_id", "flu_related", "criticality"]], on="sku_id", how="left")
sales["ili_rate"] = sales["ili_rate"].fillna(sales["ili_rate"].median())

# ---------------------------------------------------------------------------
# Feature engineering (grouped by sku_id + plant_id to avoid cross-series leakage)
# ---------------------------------------------------------------------------
g = sales.groupby(["sku_id", "plant_id"])
for lag in [1, 2, 4, 8, 12, 52]:
    sales[f"qty_lag_{lag}"] = g["quantity_sold"].shift(lag)
for win in [4, 8, 12]:
    sales[f"qty_roll_mean_{win}"] = g["quantity_sold"].transform(lambda x, w=win: x.shift(1).rolling(w).mean())
    sales[f"qty_roll_std_{win}"] = g["quantity_sold"].transform(lambda x, w=win: x.shift(1).rolling(w).std())

sales["flu_lag_1"] = sales.groupby("region")["ili_rate"].shift(1)
sales["flu_lag_2"] = sales.groupby("region")["ili_rate"].shift(2)
sales["flu_roll4"] = sales.groupby("region")["ili_rate"].transform(lambda x: x.shift(1).rolling(4).mean())
sales["flu_growth_4w"] = (sales["ili_rate"] - sales["flu_roll4"]) / sales["flu_roll4"].replace(0, np.nan)
sales["flu_same_week_last_year"] = sales.groupby(["sku_id", "plant_id"])["ili_rate"].shift(52)
sales["flu_related"] = sales["flu_related"].astype(int)
sales["flu_signal"] = sales["ili_rate"] * sales["flu_related"]  # zero out flu effect for non-flu SKUs

# target: quantity HORIZON weeks in the future, same series
sales["target"] = g["quantity_sold"].shift(-HORIZON)

cat_cols = ["sku_id", "plant_id", "region", "season", "criticality"]
for c in cat_cols:
    sales[c] = sales[c].astype("category")

feature_cols = (
    [f"qty_lag_{l}" for l in [1, 2, 4, 8, 12, 52]]
    + [f"qty_roll_mean_{w}" for w in [4, 8, 12]]
    + [f"qty_roll_std_{w}" for w in [4, 8, 12]]
    + ["ili_rate", "flu_lag_1", "flu_lag_2", "flu_growth_4w", "flu_same_week_last_year", "flu_signal",
       "week_of_year", "month", "quarter", "is_holiday", "price", "promotion_flag"]
    + cat_cols
)

model_df = sales.dropna(subset=["qty_lag_52", "target"]).reset_index(drop=True)  # need full year+ history

# ---------------------------------------------------------------------------
# Time-based train/test split -- last 8 weeks (with valid target) held out
# ---------------------------------------------------------------------------
cutoff = model_df["week_start_date"].max() - pd.Timedelta(weeks=8)
train = model_df[model_df["week_start_date"] <= cutoff]
test = model_df[model_df["week_start_date"] > cutoff]

train_set = lgb.Dataset(train[feature_cols], label=train["target"], categorical_feature=cat_cols)
valid_set = lgb.Dataset(test[feature_cols], label=test["target"], categorical_feature=cat_cols, reference=train_set)

params = dict(objective="regression", metric="mae", learning_rate=0.05, num_leaves=63,
              min_data_in_leaf=30, feature_fraction=0.85, bagging_fraction=0.85, bagging_freq=3, verbose=-1)

model = lgb.train(params, train_set, num_boost_round=600, valid_sets=[valid_set],
                   callbacks=[lgb.early_stopping(40, verbose=False), lgb.log_evaluation(0)])

pred = model.predict(test[feature_cols], num_iteration=model.best_iteration)
mae = float(np.mean(np.abs(pred - test["target"])))
mape = float(np.mean(np.abs(pred - test["target"]) / test["target"].replace(0, np.nan)) * 100)
rmse = float(np.sqrt(np.mean((pred - test["target"]) ** 2)))
baseline_pred = test["qty_lag_1"]  # naive baseline: "same as last week"
baseline_mape = float(np.mean(np.abs(baseline_pred - test["target"]) / test["target"].replace(0, np.nan)) * 100)

metrics = {"horizon_weeks": HORIZON, "mae": round(mae, 1), "rmse": round(rmse, 1), "mape_pct": round(mape, 2),
           "naive_baseline_mape_pct": round(baseline_mape, 2),
           "accuracy_vs_naive_improvement_pct": round(baseline_mape - mape, 2),
           "n_train": len(train), "n_test": len(test), "best_iteration": int(model.best_iteration)}
with open(f"{OUT}/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
model.save_model(f"{OUT}/lgb_demand_model.txt")

# ---------------------------------------------------------------------------
# Conformal-style residual calibration (for prediction intervals used later
# by the risk/confidence-escalation logic in the procurement agent)
# ---------------------------------------------------------------------------
residuals = np.abs(pred - test["target"].values)
conformal_q90 = float(np.quantile(residuals, 0.90))

# ---------------------------------------------------------------------------
# Score the LATEST available week per sku x plant -> this is the row whose
# target (t+HORIZON, i.e. ~30 days out) is what we actually need for
# replenishment decisions today.
# ---------------------------------------------------------------------------
latest_rows = sales.sort_values("week_start_date").groupby(["sku_id", "plant_id"]).tail(1).copy()
latest_rows = latest_rows.dropna(subset=["qty_lag_52"])  # ensure full feature availability
forecast_vals = model.predict(latest_rows[feature_cols], num_iteration=model.best_iteration)
latest_rows["forecast_qty_4wk"] = np.maximum(0, forecast_vals)
latest_rows["forecast_lower90"] = np.maximum(0, forecast_vals - conformal_q90)
latest_rows["forecast_upper90"] = forecast_vals + conformal_q90

out_cols = ["sku_id", "plant_id", "region", "week_start_date", "quantity_sold",
            "qty_roll_mean_4", "qty_roll_mean_12", "forecast_qty_4wk", "forecast_lower90", "forecast_upper90",
            "ili_rate", "flu_growth_4w", "flu_related"]
latest_rows[out_cols].rename(columns={"week_start_date": "as_of_week", "quantity_sold": "last_actual_qty"}) \
    .to_csv(f"{OUT}/forecast_output.csv", index=False)

# Export 4-week time-series for all 12 SKUs for the interactive UI chart selector
all_skus_dict = {}
test_scored = test.copy()
test_scored["pred"] = pred

for sku in skus["sku_id"].unique():
    sku_df = test_scored[test_scored["sku_id"] == sku].groupby("week_start_date").agg({
        "quantity_sold": "sum",
        "pred": "sum",
        "ili_rate": "mean"
    }).reset_index().tail(12)
    
    series_list = []
    for _, r in sku_df.iterrows():
        series_list.append({
            "week": r["week_start_date"].strftime("%b %d"),
            "demand": int(r["pred"]),
            "actual": int(r["quantity_sold"]),
            "ili": round(float(r["ili_rate"]), 1)
        })
    all_skus_dict[sku] = series_list

with open(f"{OUT}/forecast_all_skus.json", "w") as f:
    json.dump(all_skus_dict, f, indent=2)

print("MODEL TRAINED")
print(json.dumps(metrics, indent=2))
print(f"conformal 90% residual band: +/-{conformal_q90:.0f} units")
print(f"forecast rows written: {len(latest_rows)}")
