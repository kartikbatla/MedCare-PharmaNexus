"""
MedCare P1+PR2 :: Synthetic Data Generator
--------------------------------------------
Generates a labeled-synthetic dataset for the demand-sensing + autonomous P2P
hackathon build. Real public datasets (Kaggle Pharma Sales, WHO FluNet/CDC
FluView) are NOT reachable from this sandbox's network allowlist, so this
script builds a statistically realistic stand-in with the SAME schema/shape
those sources would have (seasonality, trend, flu-correlation, noise) so it
can be swapped for real data later with zero code changes downstream.

Everything here is clearly synthetic — do not present it as real sales/
surveillance data to judges. Present it as "synthetic data calibrated to
match real-world pharma demand + ILI surveillance patterns" (this is also
literally what the problem statement asks for: "Synthetic data of...").

Output: /home/claude/medcare_p2p/data/*.csv
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

DIR = Path(__file__).parent.resolve()

rng = np.random.default_rng(42)

START = pd.Timestamp("2018-01-01")
END = pd.Timestamp("2026-08-10")  # matches "today" in the hackathon scenario
weeks = pd.date_range(START, END, freq="W-MON")
N_WEEKS = len(weeks)

# ---------------------------------------------------------------------------
# 1. PLANT MASTER
# ---------------------------------------------------------------------------
plants = pd.DataFrame([
    {"plant_id": "PLANT_DEL", "city": "Delhi",     "region": "North", "capacity_units_per_week": 120000, "pop_weight": 1.00},
    {"plant_id": "PLANT_MUM", "city": "Mumbai",     "region": "West",  "capacity_units_per_week": 140000, "pop_weight": 1.15},
    {"plant_id": "PLANT_CHE", "city": "Chennai",    "region": "South", "capacity_units_per_week": 90000,  "pop_weight": 0.80},
    {"plant_id": "PLANT_KOL", "city": "Kolkata",    "region": "East",  "capacity_units_per_week": 80000,  "pop_weight": 0.70},
    {"plant_id": "PLANT_BLR", "city": "Bengaluru",  "region": "South", "capacity_units_per_week": 100000, "pop_weight": 0.90},
])
plants.to_csv(DIR / "plant_master.csv", index=False)

# ---------------------------------------------------------------------------
# 2. SKU MASTER
# ---------------------------------------------------------------------------
skus = pd.DataFrame([
    {"sku_id": "MED001", "medicine_name": "Paracetamol 500mg",   "category": "Analgesic/Antipyretic", "unit": "Tablet", "shelf_life_months": 24, "criticality": "Medium",   "flu_related": True,  "base_weekly_demand": 9000,  "base_price": 8.5},
    {"sku_id": "MED002", "medicine_name": "Cetirizine 10mg",     "category": "Antihistamine",         "unit": "Tablet", "shelf_life_months": 24, "criticality": "Medium",   "flu_related": True,  "base_weekly_demand": 4200,  "base_price": 6.2},
    {"sku_id": "MED003", "medicine_name": "Cough Syrup 100ml",   "category": "Cough/Cold",             "unit": "Bottle", "shelf_life_months": 18, "criticality": "Medium",   "flu_related": True,  "base_weekly_demand": 3100,  "base_price": 65.0},
    {"sku_id": "MED004", "medicine_name": "Decongestant Nasal",  "category": "Cough/Cold",             "unit": "Bottle", "shelf_life_months": 18, "criticality": "Low",      "flu_related": True,  "base_weekly_demand": 1800,  "base_price": 45.0},
    {"sku_id": "MED005", "medicine_name": "Azithromycin 500mg",  "category": "Antibiotic",             "unit": "Tablet", "shelf_life_months": 24, "criticality": "High",     "flu_related": True,  "base_weekly_demand": 2600,  "base_price": 22.0},
    {"sku_id": "MED006", "medicine_name": "Insulin Glargine",    "category": "Diabetes",               "unit": "Vial",   "shelf_life_months": 18, "criticality": "Critical", "flu_related": False, "base_weekly_demand": 1400,  "base_price": 320.0},
    {"sku_id": "MED007", "medicine_name": "Metformin 500mg",     "category": "Diabetes",               "unit": "Tablet", "shelf_life_months": 24, "criticality": "Critical", "flu_related": False, "base_weekly_demand": 5200,  "base_price": 3.2},
    {"sku_id": "MED008", "medicine_name": "Amlodipine 5mg",      "category": "Cardiac/BP",             "unit": "Tablet", "shelf_life_months": 24, "criticality": "Critical", "flu_related": False, "base_weekly_demand": 4800,  "base_price": 4.1},
    {"sku_id": "MED009", "medicine_name": "Vitamin D3 60K",      "category": "Supplement",             "unit": "Sachet", "shelf_life_months": 30, "criticality": "Low",      "flu_related": False, "base_weekly_demand": 2900,  "base_price": 32.0},
    {"sku_id": "MED010", "medicine_name": "ORS Sachet",          "category": "Rehydration",             "unit": "Sachet", "shelf_life_months": 24, "criticality": "Medium",   "flu_related": False, "base_weekly_demand": 3500,  "base_price": 12.0},
    {"sku_id": "MED011", "medicine_name": "Pantoprazole 40mg",   "category": "Antacid",                "unit": "Tablet", "shelf_life_months": 24, "criticality": "Medium",   "flu_related": False, "base_weekly_demand": 3800,  "base_price": 5.5},
    {"sku_id": "MED012", "medicine_name": "Ibuprofen 400mg",     "category": "Analgesic/Antipyretic",  "unit": "Tablet", "shelf_life_months": 24, "criticality": "Medium",   "flu_related": True,  "base_weekly_demand": 4600,  "base_price": 4.8},
])
skus.to_csv(DIR / "sku_master.csv", index=False)

# ---------------------------------------------------------------------------
# 3. FLU / DISEASE SURVEILLANCE (synthetic, ILI-rate shaped like WHO FluNet)
#    Peak Dec-Feb, trough Jun-Aug, year-to-year intensity variation + noise
# ---------------------------------------------------------------------------
flu_rows = []
region_phase_shift = {"North": 0, "West": 3, "South": -5, "East": 2}  # days, mild regional lag
for region in plants["region"].unique():
    year_intensity = {y: rng.uniform(0.75, 1.35) for y in range(2018, 2027)}
    for wk in weeks:
        doy = wk.dayofyear + region_phase_shift[region]
        # seasonal curve peaking around day ~15 (mid-Jan) and ~350 (mid-Dec), trough mid-year
        seasonal = 3.0 + 4.2 * np.exp(-((( (doy % 365) - 15) % 365)/45)**2) \
                        + 3.0 * np.exp(-((( (doy % 365) - 350) % 365)/45)**2)
        intensity = year_intensity[wk.year]
        noise = rng.normal(0, 0.35)
        ili = max(0.3, seasonal * intensity + noise)
        positive_cases = int(max(5, ili * rng.uniform(38, 55)))
        level = "Very High" if ili > 8 else "High" if ili > 5.5 else "Medium" if ili > 3 else "Low"
        flu_rows.append({"week_start_date": wk.date().isoformat(), "region": region,
                          "ili_rate": round(ili, 2), "positive_cases": positive_cases,
                          "flu_activity_level": level})
flu_df = pd.DataFrame(flu_rows)
flu_df.to_csv(DIR / "flu_surveillance.csv", index=False)

# ---------------------------------------------------------------------------
# 4. CALENDAR
# ---------------------------------------------------------------------------
holidays_approx = set()  # simplified: mark first week of Jan, Oct-Nov (festive/winter demand bump)
cal_rows = []
for wk in weeks:
    month = wk.month
    season = ("Winter" if month in (12, 1, 2) else "Summer" if month in (3, 4, 5, 6)
              else "Monsoon" if month in (7, 8, 9) else "Autumn")
    is_holiday = 1 if (month in (10, 11) and wk.day <= 14) or (month == 1 and wk.day <= 7) else 0
    cal_rows.append({"week_start_date": wk.date().isoformat(), "week_of_year": int(wk.isocalendar().week),
                      "month": month, "quarter": (month - 1)//3 + 1, "season": season, "is_holiday": is_holiday})
cal_df = pd.DataFrame(cal_rows)
cal_df.to_csv(DIR / "calendar.csv", index=False)

# ---------------------------------------------------------------------------
# 5. PHARMA SALES  (SKU x PLANT x WEEK) -- the core demand-sensing dataset
# ---------------------------------------------------------------------------
flu_lookup = flu_df.set_index(["week_start_date", "region"])["ili_rate"].to_dict()
sales_rows = []
for _, sku in skus.iterrows():
    sku_trend = rng.uniform(0.015, 0.04)  # annual growth rate
    flu_sensitivity = rng.uniform(180, 340) if sku["flu_related"] else 0.0
    for _, pl in plants.iterrows():
        base = sku["base_weekly_demand"] * pl["pop_weight"] * rng.uniform(0.85, 1.15)
        price = sku["base_price"]
        for i, wk in enumerate(weeks):
            years_elapsed = i / 52.0
            trend_mult = (1 + sku_trend) ** years_elapsed
            month = wk.month
            annual_season = 1 + 0.10 * np.sin(2 * np.pi * (wk.dayofyear / 365))
            # flu boost: use ILI 1-2 weeks prior (lag effect), region-matched
            lag_idx = max(0, i - 1)
            flu_val = flu_lookup.get((weeks[lag_idx].date().isoformat(), pl["region"]), 3.0)
            flu_boost = 1 + (flu_sensitivity * max(0, flu_val - 3.0)) / max(base, 1) if sku["flu_related"] else 1.0
            promo = 1 if rng.random() < 0.06 else 0
            promo_mult = rng.uniform(1.15, 1.35) if promo else 1.0
            noise = rng.normal(1.0, 0.06)
            qty = max(0, base * trend_mult * annual_season * flu_boost * promo_mult * noise)
            eff_price = round(price * (0.85 if promo else 1.0), 2)
            sales_rows.append({
                "week_start_date": wk.date().isoformat(), "sku_id": sku["sku_id"], "plant_id": pl["plant_id"],
                "region": pl["region"], "quantity_sold": int(round(qty)), "price": eff_price,
                "promotion_flag": promo, "sales_value": round(qty * eff_price, 2),
            })
sales_df = pd.DataFrame(sales_rows)
sales_df.to_csv(DIR / "pharma_sales.csv", index=False)

# ---------------------------------------------------------------------------
# 6. SUPPLIER MASTER  (multiple suppliers per SKU category, realistic tradeoffs)
# ---------------------------------------------------------------------------
supplier_rows = []
sup_names = ["Apex Pharma Supplies", "Sunrise Distributors", "MedLink Traders", "Global Health Sourcing",
             "Vertex Bio Supply", "Nova Pharma Co", "Trident Logistics Pharma", "BlueCross Wholesale"]
for _, sku in skus.iterrows():
    n_suppliers = rng.integers(3, 5)
    chosen = rng.choice(sup_names, size=n_suppliers, replace=False)
    for j, name in enumerate(chosen):
        tier = rng.choice(["cheap_slow", "balanced", "premium_fast"], p=[0.35, 0.4, 0.25])
        if tier == "cheap_slow":
            price_mult, lead, otd, qual = rng.uniform(0.85, 0.95), rng.integers(10, 18), rng.uniform(0.80, 0.90), rng.uniform(0.85, 0.93)
        elif tier == "balanced":
            price_mult, lead, otd, qual = rng.uniform(0.96, 1.05), rng.integers(6, 10), rng.uniform(0.90, 0.96), rng.uniform(0.93, 0.97)
        else:
            price_mult, lead, otd, qual = rng.uniform(1.05, 1.20), rng.integers(2, 5), rng.uniform(0.96, 0.995), rng.uniform(0.97, 0.995)
        cap = int(sku["base_weekly_demand"] * rng.uniform(1.2, 3.0))
        supplier_rows.append({
            "supplier_id": f"SUP_{sku['sku_id']}_{j+1}", "supplier_name": f"{name}", "sku_id": sku["sku_id"],
            "unit_price": round(sku["base_price"] * price_mult, 2), "shipping_cost_per_order": round(rng.uniform(500, 4000), 0),
            "lead_time_days": int(lead), "moq": int(rng.choice([500, 1000, 2000])),
            "max_capacity_units_per_week": cap, "otd_rate": round(otd, 3), "quality_score": round(qual, 3),
            "contract_min_units": int(cap * 0.1), "contract_max_units": int(cap * 0.9),
            "historical_avg_delay_days": round(max(0, (1 - otd) * lead * rng.uniform(0.8, 1.4)), 1),
            "delay_std_days": round(max(0.3, (1 - otd) * lead * 0.5), 1),
        })
sup_df = pd.DataFrame(supplier_rows)
sup_df.to_csv(DIR / "supplier_master.csv", index=False)

# ---------------------------------------------------------------------------
# 7. CURRENT INVENTORY SNAPSHOT (as of last week in dataset)
#    Deliberately under-stock a few flu-related SKUs so the demo has real
#    replenishment triggers to show off.
# ---------------------------------------------------------------------------
latest_week = weeks[-1].date().isoformat()
recent = sales_df[sales_df["week_start_date"] >= (weeks[-9].date().isoformat())]
avg_recent = recent.groupby(["sku_id", "plant_id"])["quantity_sold"].mean().reset_index()
inv_rows = []
underst_targets = {("MED001", "PLANT_DEL"), ("MED002", "PLANT_DEL"), ("MED002", "PLANT_MUM"),
                    ("MED003", "PLANT_KOL"), ("MED005", "PLANT_CHE")}
for _, row in avg_recent.iterrows():
    weekly_avg = row["quantity_sold"]
    sku_row = skus[skus["sku_id"] == row["sku_id"]].iloc[0]
    safety_weeks = 3 if sku_row["criticality"] in ("Critical", "High") else 2
    safety_stock = int(weekly_avg * safety_weeks * 0.5)
    is_understock = (row["sku_id"], row["plant_id"]) in underst_targets
    cover_weeks = rng.uniform(0.4, 0.9) if is_understock else rng.uniform(2.0, 5.0)
    closing_stock = int(weekly_avg * cover_weeks)
    in_transit = int(weekly_avg * rng.uniform(0, 1.0))
    shelf_life_wk = int(sku_row["shelf_life_months"] * 4.33)
    days_to_expiry = int(rng.integers(10, 25)) if rng.random() < 0.08 else int(rng.integers(60, shelf_life_wk * 7))
    inv_rows.append({
        "snapshot_date": latest_week, "sku_id": row["sku_id"], "plant_id": row["plant_id"],
        "closing_stock": closing_stock, "reserved_stock": int(closing_stock * 0.05),
        "in_transit_stock": in_transit, "safety_stock": safety_stock,
        "reorder_point": int(safety_stock * 1.5), "days_to_expiry": days_to_expiry,
    })
inv_df = pd.DataFrame(inv_rows)
inv_df.to_csv(DIR / "inventory.csv", index=False)

print("DATA GENERATION COMPLETE")
print(f"weeks: {N_WEEKS}  sales_rows: {len(sales_df)}  flu_rows: {len(flu_df)}")
print(f"skus: {len(skus)}  plants: {len(plants)}  suppliers: {len(sup_df)}  inventory rows: {len(inv_df)}")
print(f"latest week: {latest_week}")
