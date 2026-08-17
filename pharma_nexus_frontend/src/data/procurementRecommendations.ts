import { inventory, purchaseOrders } from './mockData';

export interface ProcurementRecommendation {
  id: string;
  medicineId: string;
  medicine: string;
  location: string;
  currentStock: number;
  reorderLevel: number;
  forecastDemand: number;
  recommendedQty: number;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  supplier: string;
}

const supplierByMedicine = new Map<string, string>();
for (const po of purchaseOrders) {
  if (po.supplier && !supplierByMedicine.has(po.material)) {
    supplierByMedicine.set(po.material, po.supplier);
  }
}

const FALLBACK_SUPPLIER = 'Aurobindo Pharma Limited';

function supplierFor(medicine: string): string {
  return supplierByMedicine.get(medicine) ?? FALLBACK_SUPPLIER;
}

function reasonFor(status: string, location: string, days: number, qty: number): string {
  if (status === 'Critical') {
    return `Projected stock-out in ${days} days — forecast demand of ${qty} units exceeds current cover for ${location}.`;
  }
  if (status === 'Warning') {
    return `Stock is ${days} days from safety level in ${location} — replenish to cover the next demand window.`;
  }
  return `Top up ${location} stock to stay ahead of forecast demand.`;
}

export function getProcurementRecommendations(): ProcurementRecommendation[] {
  return inventory
    .map((item) => {
      const recommendedQty = Math.max(0, item.predictedDemand - item.currentStock);
      if (recommendedQty === 0) return null;
      return {
        id: `rec-${item.id.replace(/^inv-/, '')}`,
        medicineId: item.medicineId,
        medicine: item.medicine,
        location: item.location,
        currentStock: item.currentStock,
        reorderLevel: item.safetyStock,
        forecastDemand: item.predictedDemand,
        recommendedQty,
        priority: (item.status === 'Critical' ? 'High' : item.status === 'Warning' ? 'Medium' : 'Low') as ProcurementRecommendation['priority'],
        reason: reasonFor(item.status, item.location, item.daysRemaining, item.predictedDemand),
        supplier: supplierFor(item.medicine),
      };
    })
    .filter((rec): rec is ProcurementRecommendation => rec !== null)
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.priority] - order[b.priority];
    });
}
