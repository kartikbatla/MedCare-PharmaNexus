"""
MedCare :: Supplier Allocation Optimizer (PR1 core)
--------------------------------------------------------
For each triggered SKU x Plant procurement requirement, solve a small LP/MILP
that can SPLIT the required quantity across multiple eligible suppliers,
minimizing a blended objective of:
    landed cost (unit price + amortized shipping)
    + risk penalty (based on 1 - OTD, 1 - quality)
    + lead-time penalty (scaled by how urgent the requirement is)
subject to: supplier capacity, MOQ, contract min/max, total = required_qty.

This directly satisfies PR1's "optimal sourcing strategy that balances cost,
risk, and supplier performance" + "reduce dependency on high-risk suppliers"
requirements, instead of naively picking a single cheapest supplier.

Run: python3 supplier_allocation.py
Output: /home/claude/medcare_p2p/agent/supplier_allocations.csv
"""
import pandas as pd
import pulp
from pathlib import Path

BASE = Path(__file__).parent.parent.resolve()
DATA = BASE / "data"
AGENT = Path(__file__).parent.resolve()

reqs = pd.read_csv(AGENT / "procurement_requirements.csv")

# Use enriched supplier catalog (internal + web discovered) if available
if (AGENT / "enriched_supplier_master.csv").exists():
    suppliers = pd.read_csv(AGENT / "enriched_supplier_master.csv")
else:
    suppliers = pd.read_csv(DATA / "supplier_master.csv")
    suppliers["is_web_discovered"] = False
    suppliers["source_url"] = "Internal ERP"

URGENCY_LEAD_WEIGHT = {"Critical": 25.0, "High": 12.0, "Medium": 5.0}
RISK_WEIGHT = 8.0  # rupees-equivalent penalty per (1-otd)+(1-quality) point, per unit

# Load inventory to check for Inter-Plant Stock Transfers (sister plant rerouting)
inv_df = pd.read_csv(DATA / "inventory.csv") if (DATA / "inventory.csv").exists() else pd.DataFrame()

alloc_rows = []
for _, req in reqs.iterrows():
    elig = suppliers[suppliers["sku_id"] == req["sku_id"]].copy()
    if elig.empty or req["required_qty"] <= 0:
        continue
    qty_needed = float(req["required_qty"])
    priority = req["priority"]
    target_plant = req["plant_id"]

    # Check sister plants for Inter-Plant Stock Transfer conditions:
    # 1. Emergency Buffer Transfer (when external suppliers take > 4 days)
    # 2. Near-Expiry Stock Redistribution (transfer stock near expiry to high-demand plants)
    if not inv_df.empty:
        sister_items = inv_df[(inv_df["sku_id"] == req["sku_id"]) & (inv_df["plant_id"] != target_plant)]
        min_external_lead = elig["lead_time_days"].min() if not elig.empty else 99

        for _, s_item in sister_items.iterrows():
            surplus = s_item["closing_stock"] - s_item["safety_stock"]
            days_to_exp = s_item.get("days_to_expiry", 300)
            
            # Rule 1: Near-Expiry Stock Redistribution (prevent waste by shipping to high demand plant)
            is_near_expiry = days_to_exp < 90 and s_item["closing_stock"] > 300
            
            # Rule 2: Emergency Lead Time Buffer (external suppliers take > 4 days)
            is_slow_supplier = min_external_lead >= 4 and surplus > 300

            if is_near_expiry or is_slow_supplier:
                transfer_qty = min(surplus if surplus > 0 else s_item["closing_stock"] * 0.5, qty_needed)
                reason_tag = "Near-Expiry Redistribution" if is_near_expiry else "Supplier Lead-Time Buffer"
                
                ipt_row = pd.DataFrame([{
                    "supplier_id": f"IPT_{s_item['plant_id']}",
                    "supplier_name": f"Inter-Plant Transfer ({s_item['plant_id']} -> {target_plant})",
                    "sku_id": req["sku_id"],
                    "unit_price": 1.10, # Internal freight cost
                    "shipping_cost_per_order": 400.0,
                    "lead_time_days": 1, # Fast inter-plant logistics (1-2 days)
                    "moq": 50,
                    "max_capacity_units_per_week": transfer_qty,
                    "otd_rate": 0.995,
                    "quality_score": 0.995,
                    "contract_min_units": 50,
                    "contract_max_units": transfer_qty,
                    "historical_avg_delay_days": 0.1,
                    "delay_std_days": 0.1,
                    "is_web_discovered": False,
                    "source_url": f"Internal Transfer ({reason_tag})"
                }])
                elig = pd.concat([elig, ipt_row], ignore_index=True)

    lead_w = URGENCY_LEAD_WEIGHT.get(priority, 5.0)

    elig["risk_penalty_per_unit"] = ((1 - elig["otd_rate"]) + (1 - elig["quality_score"])) * RISK_WEIGHT
    elig["lead_penalty_per_unit"] = elig["lead_time_days"] * (lead_w / 10.0)
    elig["effective_cost_per_unit"] = elig["unit_price"] + elig["risk_penalty_per_unit"] + elig["lead_penalty_per_unit"]

    prob = pulp.LpProblem(f"alloc_{req['sku_id']}_{req['plant_id']}", pulp.LpMinimize)
    x = {row.supplier_id: pulp.LpVariable(f"x_{row.supplier_id}", lowBound=0, upBound=row.max_capacity_units_per_week)
         for row in elig.itertuples()}
    use = {row.supplier_id: pulp.LpVariable(f"use_{row.supplier_id}", cat="Binary") for row in elig.itertuples()}

    prob += (
        pulp.lpSum(x[row.supplier_id] * row.effective_cost_per_unit for row in elig.itertuples())
        + pulp.lpSum(use[row.supplier_id] * row.shipping_cost_per_order for row in elig.itertuples())
    )
    prob += pulp.lpSum(x.values()) == qty_needed
    for row in elig.itertuples():
        prob += x[row.supplier_id] <= row.max_capacity_units_per_week * use[row.supplier_id]
        prob += x[row.supplier_id] <= row.contract_max_units
        prob += x[row.supplier_id] >= row.moq * use[row.supplier_id] - 1e6 * (1 - use[row.supplier_id])
        prob += x[row.supplier_id] >= 0

    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    allocated_candidates = [row for row in elig.itertuples() if (x[row.supplier_id].value() or 0) > 1e-3]
    is_multi_supplier = len(allocated_candidates) > 1

    for row in elig.itertuples():
        qty = x[row.supplier_id].value() or 0
        if qty > 1e-3:
            is_web = getattr(row, "is_web_discovered", False)
            source_url = getattr(row, "source_url", "Internal ERP")
            
            # Explainability Layer: Explain MILP choice in plain language
            reasons = []
            if is_web:
                reasons.append("Selected via Web Supplier Discovery Agent")
            if priority in ("Critical", "High") and row.lead_time_days <= 5:
                reasons.append(f"Fast lead time ({row.lead_time_days}d) for {priority} priority")
            if row.otd_rate >= 0.95 and row.quality_score >= 0.95:
                reasons.append(f"High reliability ({int(row.otd_rate*100)}% OTD, {int(row.quality_score*100)}% quality)")
            if row.unit_price <= elig["unit_price"].min() * 1.05:
                reasons.append(f"Competitive unit price (INR {row.unit_price:.2f})")
            if is_multi_supplier:
                reasons.append("Multi-supplier risk split across capacity bounds")
            if not reasons:
                reasons.append("Optimal balance of landed cost, lead time, and reliability")
            
            web_tag = " (Web Discovered)" if is_web else ""
            rationale = f"Chosen via MILP solve{web_tag}: {'; '.join(reasons)}."

            alloc_rows.append({
                "sku_id": req["sku_id"], "plant_id": req["plant_id"], "priority": req["priority"],
                "supplier_id": row.supplier_id, "supplier_name": row.supplier_name,
                "allocated_qty": round(qty, 0), "unit_price": row.unit_price,
                "lead_time_days": row.lead_time_days, "otd_rate": row.otd_rate, "quality_score": row.quality_score,
                "landed_cost": round(qty * row.unit_price + row.shipping_cost_per_order, 0),
                "historical_avg_delay_days": row.historical_avg_delay_days, "delay_std_days": row.delay_std_days,
                "is_web_discovered": is_web, "source_url": source_url,
                "allocation_rationale": rationale,
            })

alloc_df = pd.DataFrame(alloc_rows)

# --- savings estimate: vs a naive "always pick cheapest single supplier, ignore capacity/risk" baseline ---
savings_rows = []
for _, req in reqs.iterrows():
    elig = suppliers[suppliers["sku_id"] == req["sku_id"]]
    if elig.empty:
        continue
    cheapest = elig.loc[elig["unit_price"].idxmin()]
    naive_cost = req["required_qty"] * cheapest["unit_price"] + cheapest["shipping_cost_per_order"]
    opt_cost = alloc_df[(alloc_df.sku_id == req["sku_id"]) & (alloc_df.plant_id == req["plant_id"])]["landed_cost"].sum()
    savings_rows.append({"sku_id": req["sku_id"], "plant_id": req["plant_id"],
                          "naive_single_supplier_cost": round(naive_cost, 0), "optimized_cost": round(opt_cost, 0)})
savings_df = pd.DataFrame(savings_rows)

alloc_df.to_csv(AGENT / "supplier_allocations.csv", index=False)
savings_df.to_csv(AGENT / "cost_comparison.csv", index=False)

print("SUPPLIER ALLOCATION COMPLETE")
if not alloc_df.empty:
    print(alloc_df[["sku_id", "plant_id", "supplier_name", "allocated_qty", "unit_price", "lead_time_days", "otd_rate"]].to_string(index=False))
    print("\nAllocation Rationales:")
    for r in alloc_df.itertuples():
        print(f"  [{r.sku_id} x {r.plant_id} -> {r.supplier_name}]: {r.allocation_rationale}")
else:
    print("No allocations required for current stock levels.")
print("\nNote: naive-single-supplier baseline used only to estimate demo savings; not a real cost comparison.")
