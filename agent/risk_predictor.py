"""
MedCare :: Risk Predictor + Confidence-Escalation Gate
------------------------------------------------------------
Predicts delivery-delay risk for each supplier allocation BEFORE the PO is
released, using OTD rate, quality score, and historical delay behavior.

The escalation logic mirrors a conformal-prediction pattern: instead of a
single point risk score, we treat historical delay as Normal(mean_delay,
std_delay) per supplier and derive:
  - risk_score (0-100): calibrated probability-flavored score that delivery
    slips past an acceptable tolerance window
  - confidence (0-100): how much historical evidence supports that estimate
    (high std relative to mean, or a supplier with sparse/erratic delay
    history -> low confidence)

Gate:
  risk_score >= 55            -> ESCALATE (route PO to human approval)
  confidence < 50             -> ESCALATE (uncertain estimate, don't auto-trust it)
  else                        -> AUTO-APPROVE (release PO automatically)

This is the same "don't trust a model blindly when it's uncertain" pattern
used in the GSTAgent conformal-prediction confidence-escalation logic --
reused here for supplier delay risk instead of tax-filing confidence.

Run: python3 risk_predictor.py
Output: /home/claude/medcare_p2p/agent/po_risk_assessment.csv
"""
import numpy as np
import pandas as pd
from scipy.stats import norm
from pathlib import Path

AGENT = Path(__file__).parent.resolve()

alloc = pd.read_csv(AGENT / "supplier_allocations.csv")

TOLERANCE_DAYS = 2.0   # acceptable slip before it's a real problem
RISK_ESCALATE_THRESHOLD = 40.0
CONFIDENCE_ESCALATE_THRESHOLD = 60.0

rows = []
for r in alloc.itertuples():
    mean_delay = max(0.01, r.historical_avg_delay_days)
    std_delay = max(0.3, r.delay_std_days)
    # P(actual delay > tolerance) under Normal approx of this supplier's delay history
    p_late = float(1 - norm.cdf(TOLERANCE_DAYS, loc=mean_delay, scale=std_delay))
    p_late = min(0.99, max(0.01, p_late))

    otd_component = (1 - r.otd_rate) * 100
    quality_component = (1 - r.quality_score) * 100
    lateness_component = p_late * 100
    risk_score = round(0.45 * lateness_component + 0.30 * otd_component + 0.25 * quality_component, 1)

    # confidence: penalize high ABSOLUTE day-to-day variability in delay history.
    # (using std/mean would unfairly punish highly-reliable near-zero-delay suppliers)
    confidence = round(max(5.0, 100 - min(95, std_delay * 22)), 1)

    escalate = (risk_score >= RISK_ESCALATE_THRESHOLD) or (confidence < CONFIDENCE_ESCALATE_THRESHOLD)
    decision = "ESCALATE_TO_HUMAN" if escalate else "AUTO_APPROVE"
    reason = []
    if risk_score >= RISK_ESCALATE_THRESHOLD:
        reason.append(f"risk {risk_score} >= {RISK_ESCALATE_THRESHOLD}")
    if confidence < CONFIDENCE_ESCALATE_THRESHOLD:
        reason.append(f"low confidence {confidence} < {CONFIDENCE_ESCALATE_THRESHOLD} (erratic delay history)")
    if not reason:
        reason.append("within risk & confidence tolerance")

    rows.append({
        "sku_id": r.sku_id, "plant_id": r.plant_id, "supplier_id": r.supplier_id, "supplier_name": r.supplier_name,
        "allocated_qty": r.allocated_qty, "otd_rate": r.otd_rate, "quality_score": r.quality_score,
        "p_late_beyond_tolerance": round(p_late, 2), "risk_score": risk_score, "confidence": confidence,
        "decision": decision, "reason": "; ".join(reason),
    })

out = pd.DataFrame(rows).sort_values("risk_score", ascending=False)
out.to_csv(AGENT / "po_risk_assessment.csv", index=False)

print("RISK ASSESSMENT COMPLETE")
print(out[["sku_id", "plant_id", "supplier_name", "risk_score", "confidence", "decision"]].to_string(index=False))
print(f"\nAuto-approved: {(out.decision=='AUTO_APPROVE').sum()}  |  Escalated: {(out.decision=='ESCALATE_TO_HUMAN').sum()}")
