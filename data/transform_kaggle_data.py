"""
MedCare :: Kaggle & WHO Data Transformer
-------------------------------------------
Transforms raw Kaggle Pharma Sales (salesdaily.csv) and WHO FluNet (VIW_FNT.csv)
into MedCare pipeline schemas:
  - data/pharma_sales.csv
  - data/flu_surveillance.csv
"""
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).parent.resolve()

def transform_data():
    print("Transforming salesdaily.csv and VIW_FNT.csv...")

    # ---------------------------------------------------------------------------
    # 1. PHARMA SALES TRANSFORMATION (salesdaily.csv -> pharma_sales.csv)
    # ---------------------------------------------------------------------------
    sales_daily_path = DATA_DIR / "salesdaily.csv"
    if sales_daily_path.exists():
        daily_df = pd.read_csv(sales_daily_path)
        daily_df["date"] = pd.to_datetime(daily_df["datum"], format="%m/%d/%Y", errors="coerce")
        daily_df = daily_df.dropna(subset=["date"]).sort_values("date")
        
        # Group by weekly Monday start date
        daily_df["week_start_date"] = daily_df["date"].dt.to_period("W-MON").dt.start_time

        drug_cols = ["M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"]
        weekly_sales = daily_df.groupby("week_start_date")[drug_cols].sum().reset_index()

        # SKU mapping dictionary
        sku_map = {
            "N02BE": {"sku_id": "MED001", "base_price": 8.5},   # Paracetamol
            "R06":   {"sku_id": "MED002", "base_price": 6.2},   # Cetirizine
            "R03":   {"sku_id": "MED003", "base_price": 65.0},  # Cough Syrup
            "M01AB": {"sku_id": "MED004", "base_price": 45.0},  # Decongestant
            "M01AE": {"sku_id": "MED005", "base_price": 22.0},  # Azithromycin / Antibiotic
            "N05B":  {"sku_id": "MED006", "base_price": 320.0}, # Insulin
            "N05C":  {"sku_id": "MED007", "base_price": 3.2},   # Metformin
            "N02BA": {"sku_id": "MED008", "base_price": 4.1},   # Amlodipine
        }

        plants = [
            {"plant_id": "PLANT_DEL", "region": "North", "pop_weight": 1.00},
            {"plant_id": "PLANT_MUM", "region": "West",  "pop_weight": 1.15},
            {"plant_id": "PLANT_CHE", "region": "South", "pop_weight": 0.80},
            {"plant_id": "PLANT_KOL", "region": "East",  "pop_weight": 0.70},
            {"plant_id": "PLANT_BLR", "region": "South", "pop_weight": 0.90},
        ]

        pharma_rows = []
        rng = np.random.default_rng(42)

        for _, row in weekly_sales.iterrows():
            wk_str = row["week_start_date"].strftime("%Y-%m-%d")
            for cat, info in sku_map.items():
                sku_qty = row[cat] * 120.0  # Scale daily pharmacy units to plant-level volume
                base_p = info["base_price"]

                for pl in plants:
                    qty = max(0, int(round(sku_qty * pl["pop_weight"] * rng.uniform(0.88, 1.12))))
                    promo = 1 if rng.random() < 0.05 else 0
                    eff_price = round(base_p * (0.85 if promo else 1.0), 2)
                    pharma_rows.append({
                        "week_start_date": wk_str,
                        "sku_id": info["sku_id"],
                        "plant_id": pl["plant_id"],
                        "region": pl["region"],
                        "quantity_sold": qty,
                        "price": eff_price,
                        "promotion_flag": promo,
                        "sales_value": round(qty * eff_price, 2)
                    })

        pharma_df = pd.DataFrame(pharma_rows)
        pharma_df.to_csv(DATA_DIR / "pharma_sales.csv", index=False)
        print(f"Transformed salesdaily.csv -> pharma_sales.csv ({len(pharma_df)} rows across {len(weekly_sales)} weeks)")

    # ---------------------------------------------------------------------------
    # 2. WHO FLUNET SURVEILLANCE TRANSFORMATION (VIW_FNT.csv -> flu_surveillance.csv)
    # ---------------------------------------------------------------------------
    viw_path = DATA_DIR / "VIW_FNT.csv"
    if viw_path.exists():
        # Read relevant columns from WHO FluNet dataset
        use_cols = ["COUNTRY_CODE", "ISO_WEEKSTARTDATE", "SPEC_PROCESSED_NB", "INF_ALL", "INF_A", "INF_B"]
        flu_raw = pd.read_csv(viw_path, usecols=lambda c: c in use_cols)

        # Prefer India (IND) or fallback to global aggregate
        ind_flu = flu_raw[flu_raw["COUNTRY_CODE"] == "IND"].copy()
        if ind_flu.empty or len(ind_flu) < 50:
            ind_flu = flu_raw.copy()

        ind_flu["week_start_date"] = pd.to_datetime(ind_flu["ISO_WEEKSTARTDATE"], errors="coerce")
        ind_flu = ind_flu.dropna(subset=["week_start_date"]).sort_values("week_start_date")
        
        # Group by week
        ind_flu["spec_proc"] = pd.to_numeric(ind_flu["SPEC_PROCESSED_NB"], errors="coerce").fillna(0)
        ind_flu["inf_all"] = pd.to_numeric(ind_flu["INF_ALL"], errors="coerce").fillna(0)

        weekly_flu = ind_flu.groupby("week_start_date")[["spec_proc", "inf_all"]].sum().reset_index()
        weekly_flu["raw_ili_pct"] = np.where(weekly_flu["spec_proc"] > 0, (weekly_flu["inf_all"] / weekly_flu["spec_proc"]) * 100, 3.0)
        
        # Smooth and bound ILI rate to realistic 0.5% - 15% range
        weekly_flu["ili_rate"] = weekly_flu["raw_ili_pct"].rolling(3, min_periods=1).mean().clip(0.5, 14.5).round(2)

        regions = ["North", "West", "South", "East"]
        flu_rows = []
        rng_flu = np.random.default_rng(42)

        for _, r in weekly_flu.iterrows():
            wk_str = r["week_start_date"].strftime("%Y-%m-%d")
            base_ili = r["ili_rate"]
            pos_cases = int(r["inf_all"])

            for reg in regions:
                noise = rng_flu.normal(0, 0.4)
                reg_ili = round(max(0.3, base_ili + noise), 2)
                level = "Very High" if reg_ili > 8 else "High" if reg_ili > 5.5 else "Medium" if reg_ili > 3 else "Low"
                flu_rows.append({
                    "week_start_date": wk_str,
                    "region": reg,
                    "ili_rate": reg_ili,
                    "positive_cases": max(5, int(pos_cases * rng_flu.uniform(0.2, 0.4))),
                    "flu_activity_level": level
                })

        flu_df = pd.DataFrame(flu_rows)
        flu_df.to_csv(DATA_DIR / "flu_surveillance.csv", index=False)
        print(f"Transformed VIW_FNT.csv -> flu_surveillance.csv ({len(flu_df)} rows across {len(weekly_flu)} weeks)")

    print("DATA TRANSFORMATION COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    transform_data()
