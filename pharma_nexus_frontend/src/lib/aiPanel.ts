export const OPEN_AI_PANEL_EVENT = 'pharmanexus:open-ai-panel';

export function openAIPanel() {
  window.dispatchEvent(new CustomEvent(OPEN_AI_PANEL_EVENT));
}

export function onOpenAIPanel(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(OPEN_AI_PANEL_EVENT, listener);
  return () => window.removeEventListener(OPEN_AI_PANEL_EVENT, listener);
}

export interface ProcurePrefill {
  supplier?: string;
  material?: string;
  qty?: number;
  location?: string;
  ai?: boolean;
}

export function procureNowUrl(prefill: ProcurePrefill): string {
  const params = new URLSearchParams();
  params.set('open', '1');
  if (prefill.supplier) params.set('supplier', prefill.supplier);
  if (prefill.material) params.set('material', prefill.material);
  if (prefill.qty) params.set('qty', String(prefill.qty));
  if (prefill.location) params.set('location', prefill.location);
  if (prefill.ai) params.set('ai', '1');
  return `/purchase-orders?${params.toString()}`;
}
