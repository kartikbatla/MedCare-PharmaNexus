"""
MedCare :: PO Generation -> Goods Receipt -> Invoice OCR -> 3-Way Match -> Payment
---------------------------------------------------------------------------------------
Simulates the back half of the P2P loop (PR2) on top of the risk-gated
supplier allocations:

  1. PO_GENERATION   - one PO per (sku, plant, supplier) allocation. Status is
                        seeded from the risk gate (AUTO_APPROVE -> Released,
                        ESCALATE_TO_HUMAN -> Pending Approval).
  2. GOODS_RECEIPT    - simulates IoT/CV-confirmed receipt: usually matches PO
                        qty, sometimes short-shipped (supply-chain reality).
  3. INVOICE + OCR    - simulates an OCR-extracted invoice per PO. ~1 in 6
                        invoices gets an injected anomaly (price drift, qty
                        mismatch, or duplicate invoice number) to exercise
                        the fraud/anomaly detector.
  4. 3-WAY MATCH      - compares PO vs Receipt vs Invoice within tolerance.
  5. PAYMENT APPROVAL - auto-approves matched + low-risk; everything else
                         (mismatch, or PO still pending human approval) goes
                         to a human payment-review queue.

Run: python3 po_invoice_pipeline.py
Outputs: purchase_orders.csv, goods_receipts.csv, invoices.csv, three_way_match.csv
"""
import numpy as np
import pandas as pd
from pathlib import Path

rng = np.random.default_rng(1)
AGENT = Path(__file__).parent.resolve()

alloc = pd.read_csv(AGENT / "supplier_allocations.csv")
risk = pd.read_csv(AGENT / "po_risk_assessment.csv")

po_df = alloc.merge(risk[["sku_id", "plant_id", "supplier_id", "risk_score", "confidence", "decision"]],
                     on=["sku_id", "plant_id", "supplier_id"], how="left")
po_df["po_id"] = ["PO-" + str(1000 + i) for i in range(len(po_df))]
po_df["po_status"] = np.where(po_df["decision"] == "AUTO_APPROVE", "Released", "Pending Approval")
po_df["po_qty"] = po_df["allocated_qty"]
po_df["po_unit_price"] = po_df["unit_price"]
po_df.to_csv(AGENT / "purchase_orders.csv", index=False)

# ---------------------------------------------------------------------------
# Goods receipt (only for Released POs; Pending ones haven't shipped yet)
# ---------------------------------------------------------------------------
receipt_rows = []
for r in po_df.itertuples():
    if r.po_status != "Released":
        continue
    short_ship = rng.random() < 0.15
    received_qty = round(r.po_qty * rng.uniform(0.90, 0.97), 0) if short_ship else r.po_qty
    receipt_rows.append({
        "po_id": r.po_id, "sku_id": r.sku_id, "plant_id": r.plant_id,
        "received_qty": received_qty, "receipt_method": "Simulated IoT/CV scan",
        "quality_check": "Pass" if rng.random() > 0.03 else "Flagged",
        "short_shipped": short_ship,
    })
receipt_df = pd.DataFrame(receipt_rows)
receipt_df.to_csv(AGENT / "goods_receipts.csv", index=False)

# ---------------------------------------------------------------------------
# Invoice + simulated OCR extraction, with injected anomalies
# ---------------------------------------------------------------------------
seen_invoice_numbers = set()
invoice_rows = []
for i, r in enumerate(po_df.itertuples()):
    if r.po_status != "Released":
        continue
    recv = receipt_df[receipt_df.po_id == r.po_id]
    if recv.empty:
        continue
    recv = recv.iloc[0]
    invoice_num = f"INV-{r.supplier_id[-3:]}-{2600+i}"

    anomaly_roll = rng.random()
    price_dev_pct, qty_dev_pct, is_duplicate = 0.0, 0.0, False
    inv_qty, inv_price = recv["received_qty"], r.po_unit_price

    if anomaly_roll < 0.10:
        price_dev_pct = rng.uniform(0.06, 0.15) * rng.choice([-1, 1])
        inv_price = round(r.po_unit_price * (1 + price_dev_pct), 2)
    elif anomaly_roll < 0.17:
        qty_dev_pct = rng.uniform(0.05, 0.12)
        inv_qty = round(recv["received_qty"] * (1 + qty_dev_pct), 0)
    elif anomaly_roll < 0.20 and seen_invoice_numbers:
        invoice_num = rng.choice(list(seen_invoice_numbers))  # duplicate!
        is_duplicate = True

    seen_invoice_numbers.add(invoice_num)
    invoice_rows.append({
        "po_id": r.po_id, "invoice_number": invoice_num, "sku_id": r.sku_id, "plant_id": r.plant_id,
        "supplier_id": r.supplier_id, "invoice_qty": inv_qty, "invoice_unit_price": inv_price,
        "invoice_total": round(inv_qty * inv_price, 2), "is_duplicate_number": is_duplicate,
        "ocr_confidence": round(rng.uniform(0.94, 0.995), 3),
    })
invoice_df = pd.DataFrame(invoice_rows)
invoice_df.to_csv(AGENT / "invoices.csv", index=False)

# ---------------------------------------------------------------------------
# 3-way match: PO vs Receipt vs Invoice
# ---------------------------------------------------------------------------
QTY_TOL, PRICE_TOL = 0.03, 0.03
match_rows = []
dup_check = invoice_df["invoice_number"].duplicated(keep=False)
for idx, inv in invoice_df.iterrows():
    po = po_df[po_df.po_id == inv.po_id].iloc[0]
    recv = receipt_df[receipt_df.po_id == inv.po_id].iloc[0]

    qty_mismatch = abs(inv.invoice_qty - recv.received_qty) / max(recv.received_qty, 1) > QTY_TOL
    price_mismatch = abs(inv.invoice_unit_price - po.po_unit_price) / max(po.po_unit_price, 0.01) > PRICE_TOL
    duplicate_flag = bool(dup_check.loc[idx])
    is_match = not (qty_mismatch or price_mismatch or duplicate_flag)

    anomaly_types = []
    if qty_mismatch: anomaly_types.append("QTY_MISMATCH")
    if price_mismatch: anomaly_types.append("PRICE_MISMATCH")
    if duplicate_flag: anomaly_types.append("DUPLICATE_INVOICE")

    if is_match and po.decision == "AUTO_APPROVE":
        payment_status = "Auto-Approved"
    elif is_match and po.decision == "ESCALATE_TO_HUMAN":
        payment_status = "Pending Review (supplier risk)"
    else:
        payment_status = "Pending Review (invoice exception)"

    match_rows.append({
        "po_id": inv.po_id, "invoice_number": inv.invoice_number, "sku_id": inv.sku_id, "plant_id": inv.plant_id,
        "po_qty": po.po_qty, "received_qty": recv.received_qty, "invoice_qty": inv.invoice_qty,
        "po_price": po.po_unit_price, "invoice_price": inv.invoice_unit_price,
        "three_way_match": "MATCH" if is_match else "MISMATCH",
        "anomaly_types": ",".join(anomaly_types) if anomaly_types else "-",
        "payment_status": payment_status,
    })
match_df = pd.DataFrame(match_rows)
match_df.to_csv(AGENT / "three_way_match.csv", index=False)

print("PO -> RECEIPT -> INVOICE -> MATCH PIPELINE COMPLETE")
print(f"POs generated: {len(po_df)} ({(po_df.po_status=='Released').sum()} released, {(po_df.po_status=='Pending Approval').sum()} pending approval)")
print(f"Goods receipts: {len(receipt_df)} ({receipt_df.short_shipped.sum()} short-shipped)")
print(f"Invoices: {len(invoice_df)}")
print(match_df[["po_id", "sku_id", "three_way_match", "anomaly_types", "payment_status"]].to_string(index=False))
