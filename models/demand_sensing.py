"""
MedCare P1 :: Demand Sensing Layer
-------------------------------------
Turns the raw forecast into two separate, judge-friendly scores (this
distinction is the "smart" part of P1 -- don't collapse them into one number):

  Demand Momentum Score (0-100): "Is this medicine becoming more popular
      right now?" -- driven by recent growth, forecast growth, flu signal.

  Market Need Score (0-100): "Do we need to procure this urgently?" --
      momentum score combined with current stock cover + criticality.
      A high-momentum item with plenty of stock scores LOW here; a
      low-momentum but nearly-out-of-stock critical item scores HIGH.

Run: python3 demand_sensing.py
Output: /home/claude/medcare_p2p/models/demand_sensing_output.csv
"""
import numpy as np
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent.parent.resolve()
DATA = BASE / "data"
MODELS = Path(__file__).parent.resolve()

forecast = pd.read_csv(MODELS / "forecast_output.csv")
inv = pd.read_csv(DATA / "inventory.csv")
skus = pd.read_csv(DATA / "sku_master.csv")

df = forecast.merge(inv, on=["sku_id", "plant_id"], how="left")
df = df.merge(skus[["sku_id", "medicine_name", "criticality", "shelf_life_months"]], on="sku_id", how="left")

# --- recent growth (last 4wk avg vs prior 4-12wk baseline) ---
df["recent_avg"] = df["qty_roll_mean_4"]
df["baseline_avg"] = df["qty_roll_mean_12"]
df["demand_growth_pct"] = (df["recent_avg"] - df["baseline_avg"]) / df["baseline_avg"].replace(0, np.nan) * 100
df["forecast_growth_pct"] = (df["forecast_qty_4wk"] - df["recent_avg"]) / df["recent_avg"].replace(0, np.nan) * 100
df["flu_signal_pct"] = df.get("flu_growth_4w", 0)
df["flu_signal_pct"] = np.where(df["flu_related"], df["flu_signal_pct"].fillna(0) * 100, 0)

def minmax(s):
    s = s.fillna(0)
    lo, hi = s.quantile(0.02), s.quantile(0.98)
    if hi - lo < 1e-6:
        return s * 0
    return ((s - lo) / (hi - lo)).clip(0, 1)

df["mm_growth"] = minmax(df["demand_growth_pct"])
df["mm_forecast_growth"] = minmax(df["forecast_growth_pct"])
df["mm_flu"] = minmax(df["flu_signal_pct"])

# Demand Momentum Score: weighted blend, scaled 0-100
df["demand_momentum_score"] = (
    0.40 * df["mm_growth"] + 0.35 * df["mm_forecast_growth"] + 0.25 * df["mm_flu"]
) * 100
df["demand_momentum_score"] = df["demand_momentum_score"].round(1)

# --- stock position ---
df["available_stock"] = df["closing_stock"].fillna(0) + df["in_transit_stock"].fillna(0) - df["reserved_stock"].fillna(0)
df["daily_demand"] = (df["forecast_qty_4wk"] / 28.0).replace(0, np.nan)
df["stock_cover_days"] = (df["available_stock"] / df["daily_demand"]).clip(lower=0).fillna(999)
df["mm_understock"] = 1 - minmax(df["stock_cover_days"])  # low cover -> high score

criticality_weight = {"Critical": 1.0, "High": 0.8, "Medium": 0.55, "Low": 0.3}
df["criticality_w"] = df["criticality"].map(criticality_weight).fillna(0.5)

# Market Need Score: momentum + understock urgency + criticality
df["market_need_score"] = (
    0.35 * (df["demand_momentum_score"] / 100) + 0.45 * df["mm_understock"] + 0.20 * df["criticality_w"]
) * 100
df["market_need_score"] = df["market_need_score"].round(1)

df["momentum_band"] = pd.cut(df["demand_momentum_score"], [-1, 30, 55, 75, 100], labels=["Low", "Medium", "High", "Very High"])
df["need_band"] = pd.cut(df["market_need_score"], [-1, 30, 55, 75, 100], labels=["Low", "Medium", "High", "Critical"])

out_cols = ["sku_id", "medicine_name", "plant_id", "region", "criticality", "flu_related",
            "last_actual_qty", "recent_avg", "forecast_qty_4wk", "forecast_lower90", "forecast_upper90",
            "demand_growth_pct", "forecast_growth_pct", "flu_signal_pct", "demand_momentum_score", "momentum_band",
            "closing_stock", "in_transit_stock", "safety_stock", "stock_cover_days", "days_to_expiry",
            "market_need_score", "need_band"]
result = df[out_cols].sort_values("market_need_score", ascending=False)
result.to_csv(MODELS / "demand_sensing_output.csv", index=False)

print("DEMAND SENSING COMPLETE")
print(result.head(10)[["sku_id", "medicine_name", "plant_id", "demand_momentum_score", "market_need_score", "need_band", "stock_cover_days"]].to_string(index=False))
