"""
MedCare :: Replenishment Engine (P1 -> PR2 handoff)
-------------------------------------------------------
Demand != Procurement Requirement. This converts forecast + stock position
into an actual quantity to buy, only for SKU x Plant rows that cross the
reorder point OR have a high market-need score.

required_qty = max(0, forecast_4wk + safety_stock - available_stock)

Run: python3 replenishment_engine.py
Output: /home/claude/medcare_p2p/agent/procurement_requirements.csv
"""
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent.parent.resolve()
MODELS = BASE / "models"
DATA = BASE / "data"
AGENT = Path(__file__).parent.resolve()

NEED_SCORE_TRIGGER = 45.0  # below this, no action taken even if math says reorder small amounts

df = pd.read_csv(MODELS / "demand_sensing_output.csv")

df["available_stock"] = df["closing_stock"] + df["in_transit_stock"]
df["required_qty"] = (df["forecast_qty_4wk"] + df["safety_stock"] - df["available_stock"]).clip(lower=0).round(0)

triggered = df[(df["required_qty"] > 0) & (df["market_need_score"] >= NEED_SCORE_TRIGGER)].copy()
triggered = triggered.sort_values("market_need_score", ascending=False)

triggered["priority"] = pd.cut(triggered["market_need_score"], [-1, 55, 75, 100], labels=["Medium", "High", "Critical"])
triggered["reason"] = triggered.apply(
    lambda r: (f"Stock covers only {r['stock_cover_days']:.1f} days vs 28-day forecast of "
               f"{r['forecast_qty_4wk']:.0f} units"
               + (f"; flu-driven demand signal +{r['flu_signal_pct']:.0f}%" if r["flu_related"] and r["flu_signal_pct"] > 5 else "")
               + (f"; near-expiry stock ({r['days_to_expiry']:.0f} days)" if r["days_to_expiry"] < 30 else "")),
    axis=1,
)

out_cols = ["sku_id", "medicine_name", "plant_id", "region", "criticality", "priority",
            "forecast_qty_4wk", "available_stock", "safety_stock", "required_qty",
            "market_need_score", "demand_momentum_score", "stock_cover_days", "days_to_expiry", "reason"]
triggered[out_cols].to_csv(AGENT / "procurement_requirements.csv", index=False)

print("REPLENISHMENT ENGINE COMPLETE")
print(f"Triggered {len(triggered)} SKU x Plant procurement requirements (need_score >= {NEED_SCORE_TRIGGER})")
print(triggered[["sku_id", "plant_id", "priority", "required_qty", "market_need_score"]].to_string(index=False))
