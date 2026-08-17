import { materialRequests, type MaterialRequest } from '../data/mockData';

const STORAGE_KEY = 'pharmanexus-material-requests';
const COUNTER_KEY = 'pharmanexus-mr-counter';

let cached: MaterialRequest[] | null = null;

export function getMaterialRequests(): MaterialRequest[] {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = JSON.parse(raw) as MaterialRequest[];
      return cached;
    }
  } catch {
    // fall through to seed data
  }
  cached = [...materialRequests];
  return cached;
}

function persist(requests: MaterialRequest[]) {
  cached = requests;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // demo-only storage; ignore quota/security errors
  }
}

function nextNumber(): number {
  const base = 1036;
  let current = base;
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) current = Math.max(base, Number(raw) || base);
  } catch {
    // ignore
  }
  current += 1;
  try {
    localStorage.setItem(COUNTER_KEY, String(current));
  } catch {
    // ignore
  }
  return current;
}

export function addMaterialRequest(request: Omit<MaterialRequest, 'id'>): MaterialRequest {
  const number = nextNumber();
  const full: MaterialRequest = { ...request, id: `mr-${number}` };
  persist([full, ...getMaterialRequests()]);
  return full;
}

export function formatRequestId(id: string): string {
  const number = id.replace(/^mr-/, '');
  return `MR ${number}`;
}

export function requestNumberFromId(id: string): number {
  return Number(id.replace(/^mr-/, '')) || 0;
}
