import { createDefaultData } from '../data/defaultData';
import type { AppData } from '../types';

const STORAGE_KEY = 'frigo-vivant:v1';
const BACKUP_STORAGE_KEY = 'frigo-vivant:v1:backup';
const SESSION_FALLBACK_KEY = 'frigo-vivant:v1:session';

const normalizeAppData = (parsed: Partial<AppData>): AppData => {
  const defaults = createDefaultData();

  return {
    ...defaults,
    ...parsed,
    profile: { ...defaults.profile, ...parsed.profile },
    storageLocations: parsed.storageLocations?.length ? parsed.storageLocations : defaults.storageLocations,
    foods: parsed.foods ?? defaults.foods,
    shoppingItems: parsed.shoppingItems ?? defaults.shoppingItems,
    mealSuggestions: parsed.mealSuggestions ?? [],
    mealPlan: parsed.mealPlan ?? [],
    consumptionHistory: parsed.consumptionHistory ?? [],
    storePriceRecords: parsed.storePriceRecords ?? [],
    updatedAt: parsed.updatedAt ?? defaults.updatedAt,
  };
};

const parseStoredData = (raw: string | null): AppData | null => {
  if (!raw) return null;

  try {
    return normalizeAppData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return null;
  }
};

export const loadAppData = (): AppData => {
  if (typeof window === 'undefined') return createDefaultData();

  const primary = parseStoredData(window.localStorage.getItem(STORAGE_KEY));
  const backup = parseStoredData(window.localStorage.getItem(BACKUP_STORAGE_KEY));
  const sessionFallback = parseStoredData(window.sessionStorage.getItem(SESSION_FALLBACK_KEY));

  const candidates = [primary, backup, sessionFallback].filter(Boolean) as AppData[];
  if (candidates.length) return candidates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  return createDefaultData();
};

export const saveAppData = (data: AppData): AppData => {
  const nextData = { ...data, updatedAt: new Date().toISOString() };
  if (typeof window === 'undefined') return nextData;

  const payload = JSON.stringify(nextData);
  try {
    window.localStorage.setItem(STORAGE_KEY, payload);
    window.localStorage.setItem(BACKUP_STORAGE_KEY, payload);
  } catch {
    window.sessionStorage.setItem(SESSION_FALLBACK_KEY, payload);
  }

  return nextData;
};

export const exportAppData = (data: AppData) => {
  const payload = JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `frigo-vivant-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const parseImportedAppData = async (file: File): Promise<AppData> => {
  const raw = await file.text();
  const parsed = JSON.parse(raw) as AppData;

  if (!parsed.profile || !Array.isArray(parsed.foods) || !Array.isArray(parsed.storageLocations)) {
    throw new Error('Le fichier ne ressemble pas à une sauvegarde Frigo Vivant.');
  }

  return {
    ...normalizeAppData(parsed),
    updatedAt: new Date().toISOString(),
  };
};
