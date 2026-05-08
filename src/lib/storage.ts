import { createDefaultData } from '../data/defaultData';
import type { AppData } from '../types';

const STORAGE_KEY = 'frigo-vivant:v1';

export const loadAppData = (): AppData => {
  if (typeof window === 'undefined') return createDefaultData();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultData();

  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const defaults = createDefaultData();

    return {
      ...defaults,
      ...parsed,
      profile: { ...defaults.profile, ...parsed.profile },
      storageLocations: parsed.storageLocations?.length
        ? parsed.storageLocations
        : defaults.storageLocations,
      foods: parsed.foods ?? defaults.foods,
      shoppingItems: parsed.shoppingItems ?? defaults.shoppingItems,
      mealSuggestions: parsed.mealSuggestions ?? [],
      mealPlan: parsed.mealPlan ?? [],
      storePriceRecords: parsed.storePriceRecords ?? [],
      updatedAt: parsed.updatedAt ?? defaults.updatedAt,
    };
  } catch {
    return createDefaultData();
  }
};

export const saveAppData = (data: AppData) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
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
    ...createDefaultData(),
    ...parsed,
    updatedAt: new Date().toISOString(),
  };
};
