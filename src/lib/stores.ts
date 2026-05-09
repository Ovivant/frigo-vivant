import type { GroceryStore, OpeningTimeRange, Weekday } from '../types';

const weekdays: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const weekdayLabels: Record<Weekday, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const easterSunday = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const isFrenchPublicHoliday = (date: Date) => {
  const fixedHolidays = new Set(['1-1', '5-1', '5-8', '7-14', '8-15', '11-1', '11-11', '12-25']);
  if (fixedHolidays.has(`${date.getMonth() + 1}-${date.getDate()}`)) return true;

  const easter = easterSunday(date.getFullYear());
  const mobileHolidays = [addDays(easter, 1), addDays(easter, 39), addDays(easter, 50)].map(dateKey);
  return mobileHolidays.includes(dateKey(date));
};

const minutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const timeRangeLabel = (range: OpeningTimeRange) => `${range.open}-${range.close}`;

export const formatOpeningHours = (ranges: OpeningTimeRange[]) =>
  ranges.length ? ranges.map(timeRangeLabel).join(' / ') : 'fermé';

export const isStoreOpen = (store: GroceryStore, date: Date) => {
  const ranges = store.openingHours[weekdays[date.getDay()]] ?? [];
  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  return ranges.some((range) => nowMinutes >= minutesFromTime(range.open) && nowMinutes < minutesFromTime(range.close));
};

export const getNextOpening = (store: GroceryStore, fromDate: Date) => {
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = addDays(fromDate, offset);
    const weekday = weekdays[candidate.getDay()];
    const ranges = store.openingHours[weekday] ?? [];
    const nowMinutes = offset === 0 ? fromDate.getHours() * 60 + fromDate.getMinutes() : 0;
    const nextRange = ranges.find((range) => minutesFromTime(range.open) > nowMinutes);

    if (nextRange) {
      const prefix = offset === 0 ? "aujourd'hui" : weekdayLabels[weekday].toLowerCase();
      return `${prefix} à ${nextRange.open}`;
    }
  }

  return 'non renseignée';
};
