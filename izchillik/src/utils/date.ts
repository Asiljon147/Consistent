const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

const UZ_WEEKDAYS_LONG = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
] as const;

export const UZ_WEEKDAYS_SHORT_MON_FIRST = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] as const;

export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function addDays(dateKey: string, deltaDays: number): string {
  const dt = parseDateKey(dateKey);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateKey(dt);
}

export function diffDays(fromDateKey: string, toDateKeyStr: string): number {
  const a = parseDateKey(fromDateKey);
  const b = parseDateKey(toDateKeyStr);
  const msPerDay = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function getIsoWeekday(dateKey: string): number {
  const jsDay = parseDateKey(dateKey).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function formatUzbekFullDate(dateKey: string): string {
  const dt = parseDateKey(dateKey);
  const weekday = UZ_WEEKDAYS_LONG[dt.getDay()];
  const day = dt.getDate();
  const month = UZ_MONTHS[dt.getMonth()];
  const year = dt.getFullYear();
  return `${weekday}, ${day}-${month}, ${year}`;
}

export function formatUzbekShortDate(dateKey: string): string {
  const dt = parseDateKey(dateKey);
  return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()].slice(0, 3)}`;
}

export function formatUzbekMonthYear(year: number, monthIndex0: number): string {
  const month = UZ_MONTHS[monthIndex0];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

export function formatUzbekDateTimeShort(isoString: string): string {
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  const dateKey = toDateKey(dt);
  return `${dt.getDate()}-${UZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()} (${formatUzbekShortDate(dateKey)})`;
}

export interface CalendarCell {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, monthIndex0: number): CalendarCell[] {
  const firstDay = new Date(year, monthIndex0, 1, 12, 0, 0, 0);
  const firstJsDay = firstDay.getDay();
  const offset = firstJsDay === 0 ? 6 : firstJsDay - 1;
  const startDate = new Date(year, monthIndex0, 1 - offset, 12, 0, 0, 0);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + i,
      12,
      0,
      0,
      0
    );
    cells.push({
      dateKey: toDateKey(cur),
      dayOfMonth: cur.getDate(),
      inCurrentMonth: cur.getMonth() === monthIndex0,
    });
  }
  return cells;
}

export function getGreetingByHour(hour: number, name: string): string {
  const safeName = name.trim() || "Do'stim";
  if (hour >= 5 && hour < 12) return `Xayrli tong, ${safeName}`;
  if (hour >= 12 && hour < 18) return `Xayrli kun, ${safeName}`;
  return `Xayrli kech, ${safeName}`;
}