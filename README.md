# MedCare Control Tower — P1 (Demand Sensing & Replenishment) + PR2 (Autonomous P2P)

Working prototype for the P1 + PR2 hackathon combination: an AI system that
senses what MedCare Pharma's market actually needs (disease-aware demand
forecasting) and autonomously runs the procure-to-pay cycle to fulfill it.

```
DataAgent → ForecastAgent → DemandSensingAgent → ReplenishmentAgent
    → SourcingAgent → RiskAgent → POAgent → ControlTowerAgent
```

Orchestrated as an explicit LangGraph agent graph in `orchestrator.py` —
not just a slide, an actual graph you can run.

## Run it

```bash
pip install -r requirements.txt
python3 orchestrator.py                     # runs the full 8-agent pipeline
python3 dashboard/build_dashboard.py         # injects results into the dashboard
```

Open `dashboard/control_tower_dashboard.html` in a browser — it's a single
self-contained file (data is embedded, no backend needed).

Each stage also runs standalone (`python3 data/generate_data.py`, etc.) if
you want to debug or demo one piece at a time — useful under hackathon time
pressure when something breaks mid-run.

## What's real vs. synthetic — say this out loud to judges

This sandbox's network is locked down to package registries only (no Kaggle,
no WHO FluNet, no CDC FluView reachable), so real datasets couldn't be
pulled in here. `data/generate_data.py` instead **programmatically generates
data shaped like those real sources** — same schema, same seasonal curves,
same noise characteristics — so swapping in the real CSVs later is a
file-path change, not a rewrite:

| Dataset | This build | Swap in for production |
|---|---|---|
| Pharma sales (SKU×plant×week) | Synthetic, trend+seasonality+flu-correlated | Kaggle "Pharma Sales Data" (57 drugs, 2014–2019) |
| Disease/flu surveillance | Synthetic ILI curve (Dec–Feb peak, regional lag, year noise) | WHO FluNet/fluID or CDC FluView |
| Plants, suppliers, inventory, POs | Synthetic (no public dataset has enterprise P2P internals) | Stays synthetic — label clearly as such |

**Don't claim this is real pharma/flu data in the pitch.** Say: *"synthetic
data calibrated to match real-world ILI seasonality and pharma demand
patterns"* — which is also literally what the problem statement asks for.

## P1 — Demand Sensing (`data/`, `models/`)

- `generate_data.py` — 5 plants, 12 SKUs (5 flu-related, 7 not), 450 weeks
  (2018–2026), synthetic ILI surveillance by region, supplier master with
  realistic cheap/slow vs premium/fast tradeoffs, and a deliberately
  under-stocked subset of SKUs so the replenishment demo has real triggers.
- `forecast_model.py` — LightGBM, 4-week-ahead horizon. Chosen over an LSTM/
  Transformer because gradient-boosted trees are the consistent top
  performer on tabular multi-series demand data (this is what won the
  M5/Walmart forecasting competition) and train in seconds, not hours.
  Features: lags (1/2/4/8/12/52 weeks — the 52-week lag captures "same
  period last year"), rolling mean/std, ILI rate + lag + 4-week growth,
  calendar, price/promo. Time-based train/test split (no leakage). Also
  fits a conformal-style 90% residual band used downstream by the risk
  gate.
  - Current run: **~6.5% MAPE** vs **~10.7% naive-baseline MAPE** ("same as
    last week") — a defensible, judge-ready accuracy story, not a bare
    percentage with nothing to compare it to.
- `demand_sensing.py` — turns the forecast into two deliberately separate
  scores (don't collapse these into one number — the distinction is the
  interesting part):
  - **Demand Momentum Score**: is this medicine trending up right now?
    (recent growth + forecast growth + flu signal)
  - **Market Need Score**: do we need to procure it urgently? (momentum +
    stock-cover urgency + criticality). A trending SKU with plenty of
    stock scores low here; a flat-trending but nearly-out-of-stock
    critical drug scores high.

## PR2 — Autonomous P2P (`agent/`)

- `replenishment_engine.py` — converts need scores into an actual
  procurement quantity: `forecast + safety_stock − available_stock`, only
  for SKUs crossing a need-score trigger. Demand ≠ procurement requirement.
- `supplier_allocation.py` — **PuLP MILP**, one solve per SKU×plant. Can
  split the requirement across multiple suppliers; minimizes price + a
  risk penalty (1−OTD, 1−quality) + an urgency-weighted lead-time penalty,
  subject to capacity/MOQ/contract-max. This is PR1's "optimal sourcing
  strategy that balances cost, risk, and supplier performance" — not a
  single-cheapest-supplier pick.
- `risk_predictor.py` — **confidence-gated escalation**, same pattern as
  the conformal-prediction confidence-escalation logic from GSTAgent,
  reused here for delivery-delay risk instead of tax-filing confidence.
  Models each supplier's delay history as Normal(mean, std) to get a
  P(late) risk score AND a separate confidence score (low confidence when
  a supplier's delay history is erratic). Auto-approves only when **both**
  risk is low and confidence is high; escalates otherwise. This is the
  single most defensible "why is this rigorous, not just an LLM wrapper"
  talking point — lead with it.
- `po_invoice_pipeline.py` — PO generation (seeded from the risk gate),
  simulated IoT/CV goods receipt (with occasional short-shipments), OCR
  invoice extraction with injected anomalies (price drift, qty mismatch,
  duplicate invoice number), 3-way match, payment routing.
- `control_tower.py` — rolls every stage into one JSON for the dashboard,
  plus a rule-based chatbot (`chatbot_answer()`) for status queries. This
  is intentionally NOT an LLM call — it's a fast deterministic router good
  enough for a demo. See "Next steps" below for wiring a real one.

## Dashboard (`dashboard/`)

`control_tower_dashboard.html` — dark ops-room control tower. Signature
visual is the flu-vs-Paracetamol-demand overlay chart (the actual novel
part of the P1 story), plus the demand-sensing leaderboard, sourcing-agent
allocation cards, risk-gate table, 3-way-match table, and a live chatbot
widget. Fully self-contained (data embedded inline) — open the file, no
server needed. Rebuild after any pipeline run with
`python3 dashboard/build_dashboard.py`.

## Next steps / good hackathon time investments, in priority order

1. **Wire a real Claude API call for the chatbot** — the rule-based router
   works for a demo but a real NLU layer (with function-calling into these
   same dataframes) is a bigger "wow" for not much more code, since the
   retrieval logic underneath doesn't change.
2. **Swap in real Kaggle pharma-sales + WHO/CDC flu data** once you're
   somewhere with normal network access — schema is already matched, so
   this is a data-loading change, not a model change.
3. **Explainability layer** on the sourcing agent — right now the MILP
   picks a supplier but doesn't say why in plain language; a one-line
   "why" generated from the objective components (price vs risk vs lead
   time) would strengthen the trust story.
4. **Scenario simulator** — re-run `supplier_allocation.py` with one
   supplier's capacity forced to zero and diff the output live during the
   demo. This is the single highest-impact/lowest-effort addition given
   everything else is already built — the optimizer and risk gate already
   do the work, you just need a "what if" trigger in the UI.
5. Tighten `replenishment_engine.py`'s trigger threshold and
   `risk_predictor.py`'s escalation thresholds against a larger/different
   random seed before the actual demo run, so the mix of auto-approved vs.
   escalated cases looks intentional rather than lucky.

## Honest scope notes

- IoT/computer-vision goods receipt and OCR invoice extraction are
  **simulated** (randomized qty/anomaly injection), not real CV/OCR models
  — say this plainly if asked. Wiring real Tesseract/Textract OCR onto a
  scanned invoice image is a reasonable stretch goal if time allows.
- The chatbot is rule-based, not LLM-backed (see Next Steps #1).
- Cost "savings" figure is versus a naive single-cheapest-supplier
  baseline for demo purposes — frame it as an illustrative comparison, not
  an audited savings claim.
