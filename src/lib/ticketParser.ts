import type { FoodCategory } from '../types';
import { isoInDays } from './date';
import { parseFrenchDecimal } from './format';

export interface ParsedTicketItem {
  id: string;
  rawLine: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  purchasePrice?: number;
  pricePerUnit?: number;
  pricePerUnitKind?: 'ticket' | 'calculé';
  isOrganic: boolean;
  hasGluten: boolean;
  storageHint: string;
  store: string;
  expirationDate: string;
  dateType: 'DLC' | 'DDM';
  notes: string;
}

const containsGluten = (value: string) => /blé|ble|épeautre|epeautre|pâtes|pates|pain|brioche/i.test(value);

const inferCategory = (value: string): FoodCategory => {
  if (/tofu|œuf|oeuf|lentille|pois|poulet|poisson/i.test(value)) return 'Protéines';
  if (/fromage|yaourt|lait|crème|tofu/i.test(value)) return 'Frais';
  if (/conserve|bocal|boîte|boite|riz|pâtes|pates|pain|blé|ble|épeautre|epeautre/i.test(value)) return 'Épicerie sèche';
  if (/surgelé|surgele|glace/i.test(value)) return 'Surgelé';
  return 'Fruits & légumes';
};

const inferStorage = (value: string, category: FoodCategory) => {
  const lower = value.toLowerCase();
  if (lower.includes('placard')) return 'placards';
  if (lower.includes('congel')) return 'congelateur';
  if (lower.includes('fruitier')) return 'fruitier';
  if (/conserve|bocal|boîte|boite/.test(lower)) return 'placards';
  if (/tofu|fromage|yaourt|lait|crème/.test(lower)) return 'frigo';
  if (category === 'Fruits & légumes') return 'frigo';
  if (category === 'Épicerie sèche') return 'placards';
  return 'frigo';
};

const inferStore = (value: string, fallback: string) => {
  if (/rayols/i.test(value)) return 'Les Rayols';
  if (/biocoop/i.test(value)) return 'Biocoop';
  if (/super\s*u/i.test(value)) return 'Super U';
  if (/lidl/i.test(value)) return 'Lidl';
  if (/marché|marche/i.test(value)) return 'Marché';
  if (/fourche/i.test(value)) return 'La Fourche';
  return fallback;
};

const cleanProductName = (line: string) =>
  line
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .replace(/\b(?:DLC|DDM)\s*\d+\s*j\b/gi, '')
    .replace(/\bprixkg\s*\d+(?:[,.]\d+)?\b/gi, '')
    .replace(/\bprix\s*\d+(?:[,.]\d+)?\b/gi, '')
    .replace(/\b\d+(?:[,.]\d+)?\s*(kg|g|l|ml)\b/gi, '')
    .replace(/\b(bio|ab|rayols|biocoop|super\s*u|lidl|marché|marche|fourche|frigo|placard|placards|fruitier|congelateur|congélateur)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export const parseTicketText = (rawText: string, fallbackStore = ''): ParsedTicketItem[] =>
  rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !/^total\b/i.test(line))
    .map((line, index) => {
      const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      const relativeDateDays = Number(line.match(/\b(?:DLC|DDM)\s*(\d+)\s*j\b/i)?.[1]);
      const kg = parseFrenchDecimal(line.match(/\b(\d+(?:[,.]\d+)?)\s*kg\b/i)?.[1]);
      const grams = parseFrenchDecimal(line.match(/\b(\d+(?:[,.]\d+)?)\s*g\b/i)?.[1]);
      const liters = parseFrenchDecimal(line.match(/\b(\d+(?:[,.]\d+)?)\s*l\b/i)?.[1]);
      const ml = parseFrenchDecimal(line.match(/\b(\d+(?:[,.]\d+)?)\s*ml\b/i)?.[1]);
      const quantityMatch = parseFrenchDecimal(line.match(/(?:^|\s)(\d+(?:[,.]\d+)?)(?:\s|$)/)?.[1]);
      const purchasePrice = parseFrenchDecimal(line.match(/\bprix\s*(\d+(?:[,.]\d+)?)\b/i)?.[1]);
      const ticketPricePerUnit = parseFrenchDecimal(line.match(/\bprixkg\s*(\d+(?:[,.]\d+)?)\b/i)?.[1]);
      const category = inferCategory(line);
      const quantity = kg ?? grams ?? liters ?? ml ?? quantityMatch ?? 1;
      const unit = kg ? 'kg' : grams ? 'g' : liters ? 'L' : ml ? 'ml' : 'pièce';
      const quantityForUnitPrice = unit === 'g' ? quantity / 1000 : unit === 'ml' ? quantity / 1000 : quantity;
      const calculatedPricePerUnit = purchasePrice && quantityForUnitPrice ? purchasePrice / quantityForUnitPrice : undefined;
      const hasGluten = containsGluten(line);

      return {
        id: `ticket-${Date.now()}-${index}`,
        rawLine: line,
        name: cleanProductName(line) || line,
        category,
        quantity,
        unit,
        purchasePrice,
        pricePerUnit: ticketPricePerUnit ?? calculatedPricePerUnit,
        pricePerUnitKind: ticketPricePerUnit ? 'ticket' : calculatedPricePerUnit ? 'calculé' : undefined,
        isOrganic: /\b(bio|ab)\b/i.test(line),
        hasGluten,
        storageHint: inferStorage(line, category),
        store: inferStore(line, fallbackStore),
        expirationDate: date ?? (Number.isFinite(relativeDateDays) ? isoInDays(relativeDateDays) : isoInDays(category === 'Épicerie sèche' ? 90 : 6)),
        dateType: /DDM/i.test(line) || category === 'Épicerie sèche' ? 'DDM' : 'DLC',
        notes: hasGluten ? 'Gluten à limiter.' : 'Import ticket.',
      };
    });
