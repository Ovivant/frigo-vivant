export const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

export const formatDecimal = (value?: number, maximumFractionDigits = 3) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits,
  }).format(value);
};

export const parseFrenchDecimal = (value: string | number | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return undefined;
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatQuantity = (quantity: number, unit: string) => `${formatDecimal(quantity)} ${unit}`;

export const toTitle = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);

export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
