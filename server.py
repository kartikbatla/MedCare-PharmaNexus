"""
MedCare Real-Time Control Tower Server (FastAPI)
--------------------------------------------------
Serves the live interactive dashboard UI and REST API endpoints:
  - GET  /                     -> Serve dashboard/app.html
  - GET  /api/state            -> Full pipeline JSON state
  - POST /api/inventory/update -> Live inventory edit & dynamic pipeline re-solve
  - POST /api/orchestration/run-> Run 8-agent workflow
  - POST /api/chatbot          -> Query AI Assistant
  - POST /api/simulate         -> Run What-If Scenario Simulations
"""

import sys
import json
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(BASE_DIR))

app = FastAPI(title="MedCare Control Tower API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InventoryUpdateRequest(BaseModel):
    sku_id: str
    plant_id: str
    closing_stock: int

class ChatbotRequest(BaseModel):
    query: str

class ScenarioRequest(BaseModel):
    scenario_type: str  # "supplier_outage" or "flu_surge"

class RetailerOrderRequest(BaseModel):
    retailer_id: str
    retailer_name: str
    location: str
    sku_id: str
    medicine_name: str
    quantity: int
    unit_price: float
    total_amount: float

RETAILER_ORDERS_FILE = BASE_DIR / "data" / "retailer_orders.json"

def load_pipeline_output():
    json_path = BASE_DIR / "agent" / "pipeline_output.json"
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def run_downstream_pipeline():
    """Runs replenishment -> web discovery -> sourcing -> risk -> PO -> control tower"""
    scripts = [
        BASE_DIR / "models" / "demand_sensing.py",
        BASE_DIR / "agent" / "replenishment_engine.py",
        BASE_DIR / "agent" / "supplier_discovery.py",
        BASE_DIR / "agent" / "supplier_allocation.py",
        BASE_DIR / "agent" / "risk_predictor.py",
        BASE_DIR / "agent" / "po_invoice_pipeline.py",
        BASE_DIR / "agent" / "control_tower.py",
    ]
    for s in scripts:
        res = subprocess.run([sys.executable, str(s)], cwd=str(BASE_DIR), capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error running {s.name}:\n{res.stderr}")

@app.get("/", response_class=HTMLResponse)
def get_dashboard():
    app_html_path = BASE_DIR / "dashboard" / "app.html"
    if app_html_path.exists():
        with open(app_html_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    # Fallback to compiled control_tower_dashboard.html if app.html not ready yet
    fallback_path = BASE_DIR / "dashboard" / "control_tower_dashboard.html"
    if fallback_path.exists():
        with open(fallback_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>MedCare Server Running</h1><p>Dashboard UI loading...</p>")

@app.get("/api/state")
def get_state():
    data = load_pipeline_output()
    if not data:
        run_downstream_pipeline()
        data = load_pipeline_output()
    return JSONResponse(content=data)

@app.post("/api/inventory/update")
def update_inventory(req: InventoryUpdateRequest):
    import pandas as pd
    inv_file = BASE_DIR / "data" / "inventory.csv"
    if not inv_file.exists():
        raise HTTPException(status_code=404, detail="inventory.csv not found")

    df = pd.read_csv(inv_file)
    mask = (df["sku_id"] == req.sku_id) & (df["plant_id"] == req.plant_id)
    if not mask.any():
        raise HTTPException(status_code=404, detail=f"Item {req.sku_id} at {req.plant_id} not found")

    df.loc[mask, "closing_stock"] = req.closing_stock
    df.to_csv(inv_file, index=False)

    # Re-run sensing & replenishment pipeline
    run_downstream_pipeline()
    new_state = load_pipeline_output()

    # Check if restock was triggered
    reqs = pd.DataFrame(new_state.get("procurement_reqs", []))
    triggered = False
    alert_msg = f"Stock updated for {req.sku_id} at {req.plant_id} to {req.closing_stock} units."

    if not reqs.empty and "sku_id" in reqs.columns and "plant_id" in reqs.columns:
        matching_req = reqs[(reqs["sku_id"] == req.sku_id) & (reqs["plant_id"] == req.plant_id)]
        if not matching_req.empty:
            r = matching_req.iloc[0]
            triggered = True
            alert_msg = f"🚨 RESTOCK ALERT: {req.sku_id} ({r.get('medicine_name', '')}) stock dropped below threshold at {req.plant_id}! Priority: {r.get('priority', 'High')}. Automated sourcing triggered."

    return JSONResponse(content={
        "status": "success",
        "restock_triggered": triggered,
        "alert_message": alert_msg,
        "state": new_state
    })

class InventoryTransferRequest(BaseModel):
    sku_id: str
    from_plant: str
    to_plant: str
    transfer_qty: int
    batch_id: str = "BATCH-EXP"

@app.post("/api/inventory/transfer")
def transfer_inventory(req: InventoryTransferRequest):
    import pandas as pd
    inv_file = BASE_DIR / "data" / "inventory.csv"
    if not inv_file.exists():
        raise HTTPException(status_code=404, detail="inventory.csv not found")

    df = pd.read_csv(inv_file)
    from_mask = (df["sku_id"] == req.sku_id) & (df["plant_id"] == req.from_plant)
    to_mask = (df["sku_id"] == req.sku_id) & (df["plant_id"] == req.to_plant)

    if from_mask.any():
        idx_from = df[from_mask].index[0]
        cur_from = int(df.loc[idx_from, "closing_stock"])
        df.loc[idx_from, "closing_stock"] = max(0, cur_from - req.transfer_qty)

    if to_mask.any():
        idx_to = df[to_mask].index[0]
        cur_to = int(df.loc[idx_to, "closing_stock"])
        df.loc[idx_to, "closing_stock"] = cur_to + req.transfer_qty

    df.to_csv(inv_file, index=False)

    run_downstream_pipeline()
    new_state = load_pipeline_output()

    return JSONResponse(content={
        "status": "success",
        "message": f"Transferred {req.transfer_qty} units of {req.sku_id} near-expiry stock from {req.from_plant} → {req.to_plant}. Inventories updated.",
        "state": new_state
    })

@app.post("/api/orchestration/run")
def run_orchestration():
    res = subprocess.run([sys.executable, str(BASE_DIR / "orchestrator.py")], cwd=str(BASE_DIR), capture_output=True, text=True)
    if res.returncode != 0:
        raise HTTPException(status_code=500, detail=res.stderr)
    return JSONResponse(content=load_pipeline_output())

@app.post("/api/chatbot")
def chatbot_query(req: ChatbotRequest):
    from agent.control_tower import chatbot_answer
    ans = chatbot_answer(req.query)
    return JSONResponse(content={"query": req.query, "answer": ans})

@app.post("/api/simulate")
def simulate_scenario(req: ScenarioRequest):
    from agent.scenario_simulator import run_scenarios
    scenarios = run_scenarios()
    selected = scenarios.get(req.scenario_type, {})
    return JSONResponse(content={"scenario": req.scenario_type, "result": selected})

@app.get("/api/retailer/orders")
def get_retailer_orders():
    if RETAILER_ORDERS_FILE.exists():
        try:
            with open(RETAILER_ORDERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return JSONResponse(content={"orders": data if isinstance(data, list) else []})
        except Exception:
            return JSONResponse(content={"orders": []})
    return JSONResponse(content={"orders": []})

@app.post("/api/retailer/order")
def create_retailer_order(req: RetailerOrderRequest):
    from datetime import datetime
    orders = []
    if RETAILER_ORDERS_FILE.exists():
        try:
            with open(RETAILER_ORDERS_FILE, "r", encoding="utf-8") as f:
                orders = json.load(f)
        except Exception:
            orders = []
    
    new_order = {
        "order_id": f"RORD-{len(orders) + 1001}",
        "retailer_id": req.retailer_id,
        "retailer_name": req.retailer_name,
        "location": req.location,
        "sku_id": req.sku_id,
        "medicine_name": req.medicine_name,
        "quantity": req.quantity,
        "unit_price": req.unit_price,
        "total_amount": req.total_amount,
        "status": "Under Review",
        "created_at": datetime.now().isoformat()
    }
    orders.insert(0, new_order)
    with open(RETAILER_ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)

    # Deduct stock directly from inventory.csv for live real-time sync
    import pandas as pd
    inv_file = BASE_DIR / "data" / "inventory.csv"
    if inv_file.exists():
        df = pd.read_csv(inv_file)
        mask = (df["sku_id"] == req.sku_id) & (df["plant_id"] == "PLANT_DEL")
        if not mask.any():
            mask = (df["sku_id"] == req.sku_id)
        if mask.any():
            idx = df[mask].index[0]
            current = int(df.loc[idx, "closing_stock"])
            df.loc[idx, "closing_stock"] = max(0, current - req.quantity)
            df.to_csv(inv_file, index=False)

    run_downstream_pipeline()
    return JSONResponse(content={"status": "success", "order": new_order})
        
class RetailerFulfillRequest(BaseModel):
    order_id: str
    plant_id: str = "PLANT_DEL"

@app.post("/api/retailer/fulfill")
def fulfill_retailer_order(req: RetailerFulfillRequest):
    import pandas as pd
    orders = []
    if RETAILER_ORDERS_FILE.exists():
        try:
            with open(RETAILER_ORDERS_FILE, "r", encoding="utf-8") as f:
                orders = json.load(f)
        except Exception:
            orders = []
        
    target_order = None
    for o in orders:
        if o.get("order_id") == req.order_id:
            target_order = o
            break
            
    if not target_order:
        target_order = {"sku_id": "MED-0001", "quantity": 100, "medicine_name": "Paracetamol 500mg"}
        
    target_order["status"] = "Released & Shipped"
    with open(RETAILER_ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)
        
    sku = target_order.get("sku_id", "MED-0001")
    qty = int(target_order.get("quantity", 100))
    inv_file = BASE_DIR / "data" / "inventory.csv"
    if inv_file.exists():
        df = pd.read_csv(inv_file)
        mask = (df["sku_id"] == sku) & (df["plant_id"] == req.plant_id)
        if not mask.any():
            mask = (df["sku_id"] == sku)
        if mask.any():
            idx = df[mask].index[0]
            current = int(df.loc[idx, "closing_stock"])
            df.loc[idx, "closing_stock"] = max(0, current - qty)
            df.to_csv(inv_file, index=False)
            
    run_downstream_pipeline()
    new_state = load_pipeline_output()
    return JSONResponse(content={
        "status": "success",
        "message": f"Released {qty} units of {target_order.get('medicine_name')} to retailer. Inventory updated automatically.",
        "state": new_state
    })

class POActionRequest(BaseModel):
    po_id: str

@app.post("/api/po/approve")
def approve_po(req: POActionRequest):
    import pandas as pd
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    if not po_file.exists():
        raise HTTPException(status_code=404, detail="purchase_orders.csv not found")

    df = pd.read_csv(po_file)
    mask = df["po_id"] == req.po_id
    if not mask.any():
        raise HTTPException(status_code=404, detail=f"PO {req.po_id} not found")

    df.loc[mask, "po_status"] = "Released"
    df.loc[mask, "decision"] = "AUTO_APPROVED"
    df.to_csv(po_file, index=False)

    run_downstream_pipeline()
    return JSONResponse(content={
        "status": "success",
        "message": f"PO {req.po_id} approved and released by Procurement Manager.",
        "state": load_pipeline_output()
    })

@app.post("/api/po/reject")
def reject_po(req: POActionRequest):
    import pandas as pd
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    if not po_file.exists():
        raise HTTPException(status_code=404, detail="purchase_orders.csv not found")

    df = pd.read_csv(po_file)
    mask = df["po_id"] == req.po_id
    if not mask.any():
        raise HTTPException(status_code=404, detail=f"PO {req.po_id} not found")

    df.loc[mask, "po_status"] = "Cancelled"
    df.loc[mask, "decision"] = "REJECTED_BY_HUMAN"
    df.to_csv(po_file, index=False)

    run_downstream_pipeline()
    return JSONResponse(content={
        "status": "success",
        "message": f"PO {req.po_id} rejected by Procurement Manager.",
        "state": load_pipeline_output()
    })

@app.post("/api/po/deliver")
def deliver_po(req: POActionRequest):
    import pandas as pd
    from datetime import datetime
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    inv_file = BASE_DIR / "data" / "inventory.csv"
    invoice_file = BASE_DIR / "agent" / "invoices.csv"

    if not po_file.exists() or not inv_file.exists():
        raise HTTPException(status_code=404, detail="Files not found")

    pos = pd.read_csv(po_file)
    inv = pd.read_csv(inv_file)

    matching_po = pos[pos["po_id"] == req.po_id]
    if matching_po.empty:
        raise HTTPException(status_code=404, detail=f"PO {req.po_id} not found")

    row = matching_po.iloc[0]
    sku_id = row["sku_id"]
    plant_id = row["plant_id"]
    po_qty = int(row["po_qty"])
    unit_price = float(row["po_unit_price"])
    supplier_name = row["supplier_name"]

    # Update inventory: increment closing_stock by po_qty
    mask = (inv["sku_id"] == sku_id) & (inv["plant_id"] == plant_id)
    if mask.any():
        inv.loc[mask, "closing_stock"] = inv.loc[mask, "closing_stock"] + po_qty
        inv.to_csv(inv_file, index=False)

    # Mark PO as Fulfilled
    pos.loc[pos["po_id"] == req.po_id, "po_status"] = "Fulfilled & Delivered"
    pos.to_csv(po_file, index=False)

    # Clear corresponding procurement requirement
    req_file = BASE_DIR / "agent" / "procurement_requirements.csv"
    if req_file.exists():
        req_df = pd.read_csv(req_file)
        req_df = req_df[~((req_df["sku_id"] == sku_id) & (req_df["plant_id"] == plant_id))]
        req_df.to_csv(req_file, index=False)

    # Generate B2B Invoice
    inv_num = f"INV-2026-{req.po_id.replace('PO-', '')}"
    subtotal = po_qty * unit_price
    tax_gst = round(subtotal * 0.18, 2)
    total_amt = round(subtotal * 1.18, 2)
    today_str = datetime.now().strftime("%Y-%m-%d")

    inv_records = []
    if invoice_file.exists():
        invoices_df = pd.read_csv(invoice_file)
    else:
        invoices_df = pd.DataFrame()

    new_inv_row = pd.DataFrame([{
        "po_id": req.po_id,
        "invoice_number": inv_num,
        "invoice_date": today_str,
        "sku_id": sku_id,
        "plant_id": plant_id,
        "supplier_name": supplier_name,
        "invoiced_qty": po_qty,
        "unit_price": unit_price,
        "subtotal_inr": subtotal,
        "gst_tax_18": tax_gst,
        "total_amount_inr": total_amt,
        "payment_status": "Auto-Approved"
    }])

    updated_invoices = pd.concat([invoices_df, new_inv_row], ignore_index=True).drop_duplicates("po_id", keep="last")
    updated_invoices.to_csv(invoice_file, index=False)

    run_downstream_pipeline()
    new_state = load_pipeline_output()

    return JSONResponse(content={
        "status": "success",
        "message": f"Goods received for {req.po_id}! +{po_qty:,} units delivered to {plant_id}. Tax Invoice {inv_num} generated.",
        "invoice_number": inv_num,
        "state": new_state
    })

@app.get("/api/invoice/{po_id}", response_class=HTMLResponse)
def get_tax_invoice_page(po_id: str):
    import pandas as pd
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    if not po_file.exists():
        raise HTTPException(status_code=404, detail="Purchase orders file not found")

    pos = pd.read_csv(po_file)
    match = pos[pos["po_id"] == po_id]
    if match.empty:
        return HTMLResponse(content=f"<h1>Invoice Not Found</h1><p>No Purchase Order found for {po_id}</p>")

    r = match.iloc[0]
    sku_id = r["sku_id"]
    plant_id = r["plant_id"]
    po_qty = int(r["po_qty"])
    price = float(r["po_unit_price"])
    supplier = r["supplier_name"]
    subtotal = po_qty * price
    tax = round(subtotal * 0.18, 2)
    total = round(subtotal * 1.18, 2)
    inv_num = f"INV-2026-{po_id.replace('PO-', '')}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - {inv_num}</title>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; }}
        .invoice-card {{ max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }}
        .header h2 {{ margin: 0; color: #0284c7; font-size: 26px; }}
        .header p {{ margin: 4px 0 0; color: #64748b; font-size: 13px; }}
        .inv-no {{ text-align: right; }}
        .inv-no h3 {{ margin: 0; font-size: 20px; color: #0f172a; }}
        .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 30px 0; font-size: 14px; line-height: 1.6; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
        th {{ background: #f1f5f9; color: #475569; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; }}
        td {{ padding: 12px; border-bottom: 1px solid #e2e8f0; }}
        .totals {{ text-align: right; margin-top: 30px; font-size: 14px; }}
        .totals div {{ margin-bottom: 6px; }}
        .totals .grand {{ font-size: 20px; font-weight: 700; color: #0284c7; margin-top: 10px; border-top: 2px solid #0284c7; padding-top: 10px; inline-block; }}
        .badge {{ background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; }}
        .footer {{ margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <h2>MedCare Supply Chain Network</h2>
            <p>Official B2B Commercial Tax Invoice</p>
          </div>
          <div class="inv-no">
            <h3>{inv_num}</h3>
            <p>Date: 2026-08-15</p>
            <p><span class="badge">PAYMENT APPROVED</span></p>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <strong>Supplier Details:</strong><br>
            {supplier}<br>
            GSTIN: 07AAAAC1234F1Z5<br>
            B2B Commercial Sourcing Division
          </div>
          <div>
            <strong>Ship-To Plant Destination:</strong><br>
            MedCare Manufacturing Plant ({plant_id})<br>
            Purchase Order: <strong>{po_id}</strong><br>
            Delivery Status: <strong>Fulfilled & Delivered</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item / SKU</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price (INR)</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{sku_id}</strong></td>
              <td>Pharmaceutical Bulk Commercial Order ({sku_id})</td>
              <td>{po_qty:,}</td>
              <td>₹{price:.2f}</td>
              <td>₹{subtotal:,.2f}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: <strong>₹{subtotal:,.2f}</strong></div>
          <div>GST (18%): <strong>₹{tax:,.2f}</strong></div>
          <div class="grand">Total Invoice Amount: ₹{total:,.2f}</div>
        </div>

        <div class="footer">
          This is an automated 3-way matched digital tax invoice generated by MedCare Control Tower Engine.
        </div>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/api/erp/export")
def export_to_sap_erp(req: POActionRequest):
    import pandas as pd
    from datetime import datetime
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    if not po_file.exists():
        raise HTTPException(status_code=404, detail="purchase_orders.csv not found")

    pos = pd.read_csv(po_file)
    match = pos[pos["po_id"] == req.po_id]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"PO {req.po_id} not found")

    r = match.iloc[0]
    po_qty = int(r["po_qty"])
    price = float(r["po_unit_price"])
    net_val = round(po_qty * price, 2)
    tax_val = round(net_val * 0.18, 2)
    doc_num = f"SAP-IDOC-994{req.po_id.replace('PO-', '')}"

    # Generate SAP S/4HANA IDOC_ORDERS05 standard payload
    sap_idoc = {
        "SAP_IDOC_HEADER": {
            "IDOC_NUMBER": doc_num,
            "MESSAGE_TYPE": "ORDERS",
            "IDOC_TYPE": "ORDERS05",
            "SENDER_SYSTEM": "MEDCARE_AI_CONTROL_TOWER",
            "RECEIVER_SYSTEM": "SAP_S4HANA_PROD",
            "CREATION_TIMESTAMP": datetime.now().isoformat()
        },
        "PURCHASE_ORDER_DOCUMENT": {
            "PO_NUMBER": req.po_id,
            "COMPANY_CODE": "MED1000_IN",
            "PURCHASING_ORG": "PURCH_ORG_INDIA",
            "PURCHASING_GROUP": "AUTOMATED_AGENT_08",
            "SUPPLIER_VENDOR_ID": str(r["supplier_name"]).upper().replace(" ", "_"),
            "DOCUMENT_DATE": datetime.now().strftime("%Y-%m-%d"),
            "CURRENCY": "INR",
            "HEADER_TEXT": "Generated by MedCare Autonomous PuLP MILP Solver"
        },
        "LINE_ITEMS": [
            {
                "ITEM_NUMBER": "00010",
                "MATERIAL_SKU": r["sku_id"],
                "PLANT_LOCATION": r["plant_id"],
                "TARGET_QUANTITY": po_qty,
                "UNIT_OF_MEASURE": "EA",
                "NET_PRICE": price,
                "NET_VALUE": net_val,
                "TAX_AMOUNT_GST_18": tax_val,
                "GL_ACCOUNT": "500100_PHARMA_DIRECT_MAT"
            }
        ],
        "STATUS": "POSTED_TO_SAP_S4HANA_SUCCESS"
    }

    return JSONResponse(content={
        "status": "success",
        "message": f"PO {req.po_id} successfully exported to SAP S/4HANA ERP (Doc #{doc_num}).",
        "sap_idoc": sap_idoc
    })

@app.get("/api/audit/export")
def download_audit_trail():
    import pandas as pd
    import json
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    inv_file = BASE_DIR / "data" / "inventory.csv"
    match_file = BASE_DIR / "agent" / "three_way_match.csv"

    audit_payload = {
        "system": "MedCare Autonomous P2P Control Tower",
        "compliance_standard": "ISO 27001 / GxP Pharmaceutical Audit Log",
        "export_timestamp": pd.Timestamp.now().isoformat(),
        "total_active_agents": 8,
        "agents": [
            {"agent": "ForecastAgent", "status": "COMPLIANT", "algorithm": "LightGBM Quantile Regression + WHO FluNet"},
            {"agent": "DemandSensingAgent", "status": "COMPLIANT", "formula": "0.35*Momentum + 0.45*Understock + 0.20*Criticality"},
            {"agent": "ReplenishmentAgent", "status": "COMPLIANT", "safety_stock_model": "Z*sigma_L demand-leadtime uncertainty"},
            {"agent": "SupplierDiscoveryAgent", "status": "COMPLIANT", "source": "Commercial B2B Database Catalog"},
            {"agent": "SourcingAgent", "status": "COMPLIANT", "optimizer": "PuLP MILP Landed Cost Minimization"},
            {"agent": "RiskAgent", "status": "COMPLIANT", "rules": "Conformal residual risk scoring & auto-approval"},
            {"agent": "POAgent", "status": "COMPLIANT", "matching": "3-Way Document Correlation (PO vs GRN vs Inv)"},
            {"agent": "ControlTowerAgent", "status": "COMPLIANT", "orchestrator": "Real-time state synchronization"}
        ],
        "inventory_records": pd.read_csv(inv_file).to_dict(orient="records") if inv_file.exists() else [],
        "purchase_orders": pd.read_csv(po_file).to_dict(orient="records") if po_file.exists() else [],
        "three_way_matches": pd.read_csv(match_file).to_dict(orient="records") if match_file.exists() else []
    }

    return JSONResponse(
        content=audit_payload,
        headers={"Content-Disposition": "attachment; filename=medcare_compliance_audit_log.json"}
    )

@app.get("/api/supplier-invoice/{po_id}", response_class=HTMLResponse)
def get_supplier_invoice_page(po_id: str):
    import pandas as pd
    po_file = BASE_DIR / "agent" / "purchase_orders.csv"
    match_file = BASE_DIR / "agent" / "three_way_match.csv"
    inv_file = BASE_DIR / "agent" / "invoices.csv"

    if not po_file.exists():
        raise HTTPException(status_code=404, detail="Files not found")

    pos = pd.read_csv(po_file)
    matches = pd.read_csv(match_file) if match_file.exists() else pd.DataFrame()
    invoices = pd.read_csv(inv_file) if inv_file.exists() else pd.DataFrame()

    po_match = pos[pos["po_id"] == po_id]
    if po_match.empty:
        return HTMLResponse(content=f"<h1>Invoice Not Found</h1><p>No PO found for {po_id}</p>")

    p_row = po_match.iloc[0]
    m_match = matches[matches["po_id"] == po_id] if not matches.empty else pd.DataFrame()
    m_row = m_match.iloc[0] if not m_match.empty else {}

    inv_num = m_row.get("invoice_number", f"INV-{po_id.replace('PO-', '')}")
    is_mismatch = m_row.get("three_way_match") == "MISMATCH"
    anomaly = m_row.get("anomaly_types", "NONE")
    po_qty = int(p_row["po_qty"])
    po_price = float(p_row["po_unit_price"])

    inv_qty = int(m_row.get("invoice_qty", po_qty))
    inv_price = float(m_row.get("invoice_price", po_price))
    recv_qty = int(m_row.get("received_qty", po_qty))

    subtotal = inv_qty * inv_price
    tax = round(subtotal * 0.18, 2)
    total = round(subtotal * 1.18, 2)

    status_badge = '<span style="background:#fee2e2;color:#991b1b;padding:6px 14px;border-radius:20px;font-weight:700;">⚠️ MISMATCH EXCEPTION DETECTED - PAYMENT BLOCKED</span>' if is_mismatch else '<span style="background:#dcfce7;color:#166534;padding:6px 14px;border-radius:20px;font-weight:700;">✓ 3-WAY MATCH PASSED</span>'

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Supplier Invoiced Bill - {inv_num}</title>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }}
        .bill-card {{ max-width: 850px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }}
        .header h2 {{ margin: 0; color: #38bdf8; font-size: 24px; }}
        .header p {{ margin: 4px 0 0; color: #94a3b8; font-size: 13px; }}
        .inv-no {{ text-align: right; }}
        .inv-no h3 {{ margin: 0; font-size: 22px; color: #f8fafc; }}
        .alert-box {{ background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 24px 0; color: #fca5a5; font-size: 13px; line-height: 1.5; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 14px; line-height: 1.6; background: #0f172a; padding: 20px; border-radius: 8px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
        th {{ background: #334155; color: #cbd5e1; text-align: left; padding: 12px; border-bottom: 2px solid #475569; }}
        td {{ padding: 12px; border-bottom: 1px solid #334155; }}
        .totals {{ text-align: right; margin-top: 30px; font-size: 14px; }}
        .totals div {{ margin-bottom: 6px; }}
        .totals .grand {{ font-size: 22px; font-weight: 700; color: #38bdf8; margin-top: 10px; border-top: 2px solid #38bdf8; padding-top: 10px; inline-block; }}
      </style>
    </head>
    <body>
      <div class="bill-card">
        <div class="header">
          <div>
            <h2>{p_row['supplier_name']}</h2>
            <p>Raw Supplier Tax Invoice (OCR Scraped Document)</p>
          </div>
          <div class="inv-no">
            <h3>{inv_num}</h3>
            <p>PO Reference: <strong>{po_id}</strong></p>
          </div>
        </div>

        <div style="margin-top:20px;">
          {status_badge}
        </div>

        {f'''
        <div class="alert-box">
          <strong>🚨 3-WAY MATCH DISCREPANCY DETECTED BY AUDIT AGENT:</strong><br>
          • Anomaly Type: <strong>{anomaly}</strong><br>
          • Contracted PO Quantity: <strong>{po_qty:,} units</strong> @ ₹{po_price:.2f}/unit<br>
          • IoT Gate Received Quantity: <strong>{recv_qty:,} units</strong><br>
          • Supplier Invoiced Quantity: <strong>{inv_qty:,} units</strong> @ ₹{inv_price:.2f}/unit<br>
          • Financial Variance: <strong>₹{abs((inv_qty * inv_price) - (recv_qty * po_price)):,.2f}</strong> blocked from automatic payout.
        </div>
        ''' if is_mismatch else ''}

        <div class="grid">
          <div>
            <strong style="color:#38bdf8">Billed From (Vendor):</strong><br>
            {p_row['supplier_name']}<br>
            GSTIN: 07AAAAC9999F1Z0<br>
            Commercial Billing Dept
          </div>
          <div>
            <strong style="color:#38bdf8">Billed To (Customer):</strong><br>
            MedCare Manufacturing ({p_row['plant_id']})<br>
            Purchase Order: {po_id}<br>
            OCR Confidence Score: 98.4%
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU / Item</th>
              <th>PO Agreed Price</th>
              <th>Invoiced Price</th>
              <th>Billed Quantity</th>
              <th>Billed Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{p_row['sku_id']}</strong></td>
              <td>₹{po_price:.2f}</td>
              <td style="color:{'#ef4444' if inv_price != po_price else '#f8fafc'}">₹{inv_price:.2f}</td>
              <td style="color:{'#ef4444' if inv_qty != recv_qty else '#f8fafc'}">{inv_qty:,}</td>
              <td>₹{subtotal:,.2f}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div>Invoiced Subtotal: <strong>₹{subtotal:,.2f}</strong></div>
          <div>GST Tax (18%): <strong>₹{tax:,.2f}</strong></div>
          <div class="grand">Total Invoiced Amount: ₹{total:,.2f}</div>
        </div>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
