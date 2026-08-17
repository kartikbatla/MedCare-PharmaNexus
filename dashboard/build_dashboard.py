"""Injects pipeline_output.json + chart series into the dashboard template."""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent.resolve()
bundle = json.load(open(ROOT / "agent" / "pipeline_output.json"))
chart_series = json.load(open(ROOT / "agent" / "chart_series_flu_demand.json"))

template = open(ROOT / "dashboard" / "template.html", encoding="utf-8").read()

repl = {
    "__KPI_DATA__": bundle["kpis"],
    "__CHART_SERIES__": chart_series,
    "__SENSING_DATA__": bundle["demand_sensing_top"],
    "__ALLOC_DATA__": bundle["supplier_allocations"],
    "__RISK_DATA__": bundle["risk_assessment"],
    "__MATCH_DATA__": bundle["three_way_match"],
    "__METRICS_DATA__": bundle["model_metrics"],
    "__CHAT_DATA__": bundle["chatbot_demo"],
    "__REQS_DATA__": bundle["procurement_requirements"],
    "__SCENARIOS_DATA__": bundle.get("scenarios", {}),
}
for placeholder, data in repl.items():
    template = template.replace(placeholder, json.dumps(data))

out_path = ROOT / "dashboard" / "control_tower_dashboard.html"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(template)
print(f"Dashboard built: {out_path}  ({len(template)} bytes)")
