import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchState,
  updateInventory as apiUpdateInventory,
  approvePO as apiApprovePO,
  rejectPO as apiRejectPO,
  deliverPO as apiDeliverPO,
  simulateScenario as apiSimulateScenario,
  sendChatQuery as apiSendChatQuery,
  exportToSAP as apiExportToSAP,
  fulfillRetailerOrder as apiFulfillRetailerOrder,
  transferInventory as apiTransferInventory,
  type PipelineState,
} from '../lib/api';
import { useToast } from './ToastContext';

interface ControlTowerContextType {
  state: PipelineState | null;
  loading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
  updateInventory: (sku_id: string, plant_id: string, closing_stock: number) => Promise<void>;
  approvePO: (po_id: string) => Promise<void>;
  rejectPO: (po_id: string) => Promise<void>;
  deliverPO: (po_id: string) => Promise<void>;
  simulateScenario: (scenario_type: string) => Promise<any>;
  sendChatQuery: (query: string) => Promise<string>;
  exportToSAP: (po_id: string) => Promise<void>;
  fulfillRetailer: (order_id: string, plant_id?: string) => Promise<void>;
  transferStock: (sku_id: string, from_plant: string, to_plant: string, transfer_qty: number, batch_id?: string) => Promise<void>;
}

const ControlTowerContext = createContext<ControlTowerContextType | undefined>(undefined);

export function ControlTowerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PipelineState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadState = async () => {
    try {
      const data = await fetchState();
      setState(data);
      setError(null);
    } catch (e: any) {
      console.error('Failed to fetch Control Tower state:', e);
      setError(e.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
    // Poll for real-time updates every 8 seconds
    const timer = setInterval(loadState, 8000);
    return () => clearInterval(timer);
  }, []);

  const updateInventory = async (sku_id: string, plant_id: string, closing_stock: number) => {
    try {
      const res = await apiUpdateInventory(sku_id, plant_id, closing_stock);
      setState(res.state);
      if (res.restock_triggered) {
        toast('error', 'Restock Triggered', res.alert_message);
      } else {
        toast('success', 'Stock Updated', res.alert_message);
      }
    } catch (e: any) {
      toast('error', 'Update Failed', e.message || 'Failed to update stock');
    }
  };

  const approvePO = async (po_id: string) => {
    try {
      const res = await apiApprovePO(po_id);
      setState(res.state);
      toast('success', 'PO Approved', res.message);
    } catch (e: any) {
      toast('error', 'Approval Failed', e.message || 'Failed to approve PO');
    }
  };

  const rejectPO = async (po_id: string) => {
    try {
      const res = await apiRejectPO(po_id);
      setState(res.state);
      toast('error', 'PO Rejected', res.message);
    } catch (e: any) {
      toast('error', 'Rejection Failed', e.message || 'Failed to reject PO');
    }
  };

  const deliverPO = async (po_id: string) => {
    try {
      const res = await apiDeliverPO(po_id);
      setState(res.state);
      toast('success', 'Goods Delivered', res.message);
    } catch (e: any) {
      toast('error', 'Delivery Failed', e.message || 'Failed to deliver goods');
    }
  };

  const simulateScenario = async (scenario_type: string) => {
    try {
      const res = await apiSimulateScenario(scenario_type);
      toast('info', 'Scenario Execution', res.result?.summary || 'Scenario simulated.');
      return res.result;
    } catch (e: any) {
      toast('error', 'Simulation Failed', e.message || 'Error running scenario');
      return null;
    }
  };

  const sendChatQuery = async (query: string): Promise<string> => {
    try {
      const res = await apiSendChatQuery(query);
      return res.answer;
    } catch (e: any) {
      return 'Sorry, could not connect to the Control Tower AI backend right now.';
    }
  };

  const exportToSAP = async (po_id: string) => {
    try {
      const res = await apiExportToSAP(po_id);
      toast('success', 'SAP ERP Export', res.message);
    } catch (e: any) {
      toast('error', 'SAP Export Failed', e.message || 'Failed to export to SAP');
    }
  };

  const fulfillRetailer = async (order_id: string, plant_id: string = 'PLANT_DEL') => {
    try {
      const res = await apiFulfillRetailerOrder(order_id, plant_id);
      setState(res.state);
      toast('success', 'Stock Released to Retailer', res.message);
    } catch (e: any) {
      toast('error', 'Fulfillment Failed', e.message || 'Failed to release stock');
    }
  };

  const transferStock = async (sku_id: string, from_plant: string, to_plant: string, transfer_qty: number, batch_id: string = 'BATCH-EXP') => {
    try {
      const res = await apiTransferInventory(sku_id, from_plant, to_plant, transfer_qty, batch_id);
      setState(res.state);
      toast('success', 'Inter-Plant Transfer Complete', res.message);
    } catch (e: any) {
      toast('error', 'Transfer Failed', e.message || 'Failed to transfer stock');
    }
  };

  return (
    <ControlTowerContext.Provider
      value={{
        state,
        loading,
        error,
        refreshState: loadState,
        updateInventory,
        approvePO,
        rejectPO,
        deliverPO,
        simulateScenario,
        sendChatQuery,
        exportToSAP,
        fulfillRetailer,
        transferStock,
      }}
    >
      {children}
    </ControlTowerContext.Provider>
  );
}

export function useControlTower() {
  const context = useContext(ControlTowerContext);
  if (!context) {
    throw new Error('useControlTower must be used within a ControlTowerProvider');
  }
  return context;
}
