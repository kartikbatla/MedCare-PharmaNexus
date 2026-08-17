"""
MedCare P1+PR2 :: LangGraph Orchestrator
--------------------------------------------
Wires the whole pipeline together as an explicit agent graph instead of a
plain script-runner, so the "multi-agent" story is real, not just a slide:

  DataAgent -> ForecastAgent -> DemandSensingAgent -> ReplenishmentAgent
      -> SourcingAgent (supplier allocation) -> RiskAgent (confidence-gated)
      -> POAgent (PO + receipt + invoice + 3-way match) -> ControlTowerAgent

Each node is a thin wrapper around the already-tested stage script (kept as
separate scripts on purpose -- easier to debug/demo individually during a
hackathon than one monolithic function). Swap any node's subprocess call for
a real LLM-driven agent (e.g. a Claude-powered SourcingAgent that explains
its picks in natural language) without touching the graph structure.

Run: python3 orchestrator.py
"""
import subprocess
import sys
from typing import TypedDict
from langgraph.graph import StateGraph, END

import os
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

STEPS = [
    # DataAgent is omitted to preserve live persistent Kaggle/WHO data and user inventory edits
    ("ForecastAgent", str(ROOT / "models" / "forecast_model.py")),
    ("DemandSensingAgent", str(ROOT / "models" / "demand_sensing.py")),
    ("ReplenishmentAgent", str(ROOT / "agent" / "replenishment_engine.py")),
    ("SupplierDiscoveryAgent", str(ROOT / "agent" / "supplier_discovery.py")),
    ("SourcingAgent", str(ROOT / "agent" / "supplier_allocation.py")),
    ("RiskAgent", str(ROOT / "agent" / "risk_predictor.py")),
    ("POAgent", str(ROOT / "agent" / "po_invoice_pipeline.py")),
    ("ControlTowerAgent", str(ROOT / "agent" / "control_tower.py")),
]


class PipelineState(TypedDict, total=False):
    log: list


def make_node(name: str, script: str):
    def node(state: PipelineState) -> PipelineState:
        print(f"\n{'=' * 70}\n[{name}] running {script.split('/')[-1]}\n{'=' * 70}")
        result = subprocess.run([sys.executable, script], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print(result.stderr, file=sys.stderr)
            raise RuntimeError(f"{name} failed: {result.stderr[-500:]}")
        log = state.get("log", [])
        log.append({"agent": name, "status": "OK"})
        return {"log": log}
    return node


graph = StateGraph(PipelineState)
prev = None
for name, script in STEPS:
    graph.add_node(name, make_node(name, script))
    if prev is None:
        graph.set_entry_point(name)
    else:
        graph.add_edge(prev, name)
    prev = name
graph.add_edge(prev, END)

app = graph.compile()

if __name__ == "__main__":
    final_state = app.invoke({"log": []})
    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE -- agent run log:")
    for entry in final_state["log"]:
        print(f"  [{entry['status']}] {entry['agent']}")
    print("=" * 70)
    print(f"\nDashboard data: {ROOT}/agent/pipeline_output.json")
