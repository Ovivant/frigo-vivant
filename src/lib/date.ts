export type UrgencyLevel = 'red' | 'orange' | 'yellow' | 'green';

export const todayAtMidday = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
};

export const daysUntil = (dateIso: string) => {
  const target = new Date(`${dateIso}T12:00:00`);
  const diff = target.getTime() - todayAtMidday().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getUrgencyLevel = (dateIso: string): UrgencyLevel => {
  const days = daysUntil(dateIso);
  if (days <= 0) return 'red';
  if (days <= 3) return 'orange';
  if (days <= 7) return 'yellow';
  return 'green';
};

export const getUrgencyLabel = (dateIso: string) => {
  const days = daysUntil(dateIso);
  if (days < 0) return `dépassé depuis ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `dans ${days} j`;
};

export const urgencyClasses: Record<UrgencyLevel, string> = {
  red: 'border-red-200 bg-red-50 text-red-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  green: 'border-leaf-200 bg-leaf-50 text-leaf-700',
};

export const sortByExpiration = <T extends { expirationDate: string }>(items: T[]) =>
  [...items].sort((a, b) => daysUntil(a.expirationDate) - daysUntil(b.expirationDate));

export const isoInDays = (days: number) => {
  const date = todayAtMidday();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
