export const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

export const formatQuantity = (quantity: number, unit: string) => `${quantity}${unit.length <= 2 ? ' ' : ' '}${unit}`;

export const toTitle = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);

export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
