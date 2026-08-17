import { medicines, type Medicine } from './medicines';

let catalogCache: Map<string, Medicine> | null = null;
const warnedIds = new Set<string>();

function catalog(): Map<string, Medicine> {
  if (!catalogCache) {
    catalogCache = new Map();
    for (const med of medicines) {
      if (!catalogCache.has(med.id)) catalogCache.set(med.id, med);
      // Map both MED001 and MED-0001 formats
      const rawId = med.id.replace('-', '').replace(/MED0+/, 'MED');
      if (!catalogCache.has(rawId)) catalogCache.set(rawId, med);
      // Also map 4-digit padded MED0001
      const paddedId = med.id.replace('-', '');
      if (!catalogCache.has(paddedId)) catalogCache.set(paddedId, med);
    }
  }
  return catalogCache;
}

export function medicineById(id?: string | null): Medicine | undefined {
  if (!id) return undefined;
  const cleanId = id.trim();
  const med = catalog().get(cleanId);
  if (med) return med;

  // Try normalized format
  const normId = cleanId.replace('-', '').replace(/MED0+/, 'MED');
  const medNorm = catalog().get(normId);
  if (medNorm) return medNorm;

  if (!warnedIds.has(id)) {
    warnedIds.add(id);
    console.warn(`medicineCatalog: unknown medicineId "${id}" — falling back to generic label.`);
  }
  return undefined;
}

export function medicineNameById(id?: string | null): string {
  if (!id) return 'Paracetamol 500mg';
  const med = medicineById(id);
  if (med) return med.name;
  
  // Fallback map for common SKUs
  const fallbackNames: Record<string, string> = {
    'MED001': 'Paracetamol 500mg',
    'MED002': 'Cetirizine 10mg',
    'MED003': 'Cough Syrup 100ml',
    'MED004': 'Amoxicillin 500mg',
    'MED005': 'Azithromycin 500mg',
    'MED006': 'Ibuprofen 400mg',
    'MED007': 'Pantoprazole 40mg',
    'MED008': 'Metformin 500mg',
    'MED009': 'Atorvastatin 10mg',
    'MED010': 'Amlodipine 5mg',
    'MED011': 'Omeprazole 20mg',
    'MED012': 'Dextromethorphan Syrup',
  };

  const normKey = id.replace('-', '').replace(/MED0+/, 'MED');
  if (fallbackNames[normKey]) return fallbackNames[normKey];
  return `Medicine ${id}`;
}

export function medicineIdByName(name?: string | null): string | undefined {
  if (!name) return undefined;
  const norm = name.trim().toLowerCase();
  for (const med of catalog().values()) {
    if (med.name.toLowerCase() === norm || med.generic.toLowerCase() === norm) return med.id;
  }
  for (const med of catalog().values()) {
    if (med.name.toLowerCase().includes(norm)) return med.id;
  }
  return undefined;
}
