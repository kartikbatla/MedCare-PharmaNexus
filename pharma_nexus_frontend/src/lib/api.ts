// Real-time API Client Bridge connecting PharmaNexus Frontend to FastAPI Control Tower Backend

export interface PipelineState {
  kpis: {
    demand_alerts: number;
    low_stock: number;
    near_expiry: number;
    pos_pending_approval: number;
    pos_released: number;
    invoices_processing: number;
    anomalies_detected: number;
    payments_auto_approved: number;
    payments_pending_review: number;
    savings_this_cycle_inr: number;
    capital_protected_inr: number;
    total_working_capital_ap: number;
    web_suppliers_discovered: number;
    web_suppliers_allocated: number;
  };
  model_metrics: {
    horizon_weeks: number;
    mae: number;
    rmse: number;
    mape_pct: number;
    naive_baseline_mape_pct: number;
    accuracy_vs_naive_improvement_pct: number;
  };
  forecast_all_skus: Record<string, Array<{ week: string; demand: number; actual: number; ili: number }>>;
  inventory: Array<{
    sku_id: string;
    plant_id: string;
    closing_stock: number;
    safety_stock: number;
    days_to_expiry: number;
  }>;
  demand_sensing: Array<{
    sku_id: string;
    plant_id: string;
    medicine_name?: string;
    demand_momentum_score: number;
    market_need_score: number;
    stock_cover_days: number;
    need_band: string;
  }>;
  procurement_requirements: Array<{
    sku_id: string;
    plant_id: string;
    medicine_name: string;
    required_qty: number;
    priority: string;
    reason: string;
  }>;
  allocations: Array<{
    sku_id: string;
    plant_id: string;
    supplier_name: string;
    allocated_qty: number;
    unit_price: number;
    lead_time_days: number;
    otd_rate: number;
    esg_score?: number;
    carbon_rating?: string;
    is_web_discovered?: boolean;
    source_url?: string;
    allocation_rationale?: string;
  }>;
  purchase_orders: Array<{
    po_id: string;
    sku_id: string;
    plant_id: string;
    supplier_name: string;
    po_qty: number;
    po_unit_price: number;
    po_status: string;
    risk_score: number;
    decision: string;
  }>;
  three_way_match: Array<{
    po_id: string;
    invoice_number: string;
    sku_id: string;
    plant_id: string;
    po_qty: number;
    received_qty: number;
    invoice_qty: number;
    po_price: number;
    invoice_price: number;
    three_way_match: string;
    anomaly_types: string;
    payment_status: string;
  }>;
  scenarios: any;
  chatbot_demo: Array<{ query: string; answer: string }>;
  agent_log: Array<{ agent: string; status: string; detail: string }>;
}

const API_BASE = '/api';

export async function fetchState(): Promise<PipelineState> {
  const res = await fetch(`${API_BASE}/state`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function updateInventory(sku_id: string, plant_id: string, closing_stock: number) {
  const res = await fetch(`${API_BASE}/inventory/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku_id, plant_id, closing_stock }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function approvePO(po_id: string) {
  const res = await fetch(`${API_BASE}/po/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ po_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function rejectPO(po_id: string) {
  const res = await fetch(`${API_BASE}/po/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ po_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function deliverPO(po_id: string) {
  const res = await fetch(`${API_BASE}/po/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ po_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function simulateScenario(scenario_type: string) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_type }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function sendChatQuery(query: string) {
  const res = await fetch(`${API_BASE}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function exportToSAP(po_id: string) {
  const res = await fetch(`${API_BASE}/erp/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ po_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fulfillRetailerOrder(order_id: string, plant_id: string = 'PLANT_DEL') {
  const res = await fetch(`${API_BASE}/retailer/fulfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id, plant_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function transferInventory(sku_id: string, from_plant: string, to_plant: string, transfer_qty: number, batch_id: string = 'BATCH-EXP') {
  const res = await fetch(`${API_BASE}/inventory/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku_id, from_plant, to_plant, transfer_qty, batch_id }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchRetailerOrders() {
  const res = await fetch(`${API_BASE}/retailer/orders`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
