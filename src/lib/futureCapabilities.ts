import type { AppData, StorePriceRecord } from '../types';

export interface PriceComparisonResult {
  productName: string;
  bestStore?: string;
  records: StorePriceRecord[];
}

export interface OnlineProductSearchResult {
  provider: 'La Fourche' | 'autre';
  query: string;
  status: 'prévu';
  message: string;
}

export const compareStorePrices = (records: StorePriceRecord[], productName: string): PriceComparisonResult => {
  const matchingRecords = records
    .filter((record) => record.productName.toLowerCase().includes(productName.toLowerCase()))
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

  return {
    productName,
    bestStore: matchingRecords[0]?.store,
    records: matchingRecords,
  };
};

export const buildPurchaseHistory = (records: StorePriceRecord[]) =>
  [...records].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

export const searchOnlineProducts = async (query: string, provider: 'La Fourche' | 'autre' = 'La Fourche'): Promise<OnlineProductSearchResult> => ({
  provider,
  query,
  status: 'prévu',
  message: 'Connecteur magasin en ligne prévu pour une version future.',
});

export const prepareICloudSyncPayload = (data: AppData) => ({
  schema: 'frigo-vivant-v1',
  exportedAt: new Date().toISOString(),
  data,
});

export const buildLocalAiContext = (data: AppData) => ({
  profile: data.profile,
  foods: data.foods.map(({ id, name, category, expirationDate, isOrganic, isLocal, status }) => ({
    id,
    name,
    category,
    expirationDate,
    isOrganic,
    isLocal,
    status,
  })),
  constraints: {
    forbiddenFoods: data.profile.forbiddenFoods,
    limitedFoods: data.profile.limitedFoods,
    noHealthScoring: true,
  },
});
