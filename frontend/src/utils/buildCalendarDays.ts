export type CalendarDay = {
  date: string; // YYYY-MM-DD in UTC
  weekday: string; // 'Mon'
  dayOfMonth: number;
  month: string; // 'Oct'
  isToday: boolean;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const toDateKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

// The booking window is 14 days starting from the current date, counted in UTC days
// so that the calendar matches the slots the API returns (ADR-0001).
export function buildCalendarDays(from: Date, count: number): CalendarDay[] {
  const startMs = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const todayKey = toDateKey(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const days: CalendarDay[] = [];
  for (let i = 0; i < count; i += 1) {
    const ms = startMs + i * 86_400_000;
    const d = new Date(ms);
    days.push({
      date: toDateKey(ms),
      weekday: WEEKDAY_LABELS[d.getUTCDay()],
      dayOfMonth: d.getUTCDate(),
      month: MONTH_LABELS[d.getUTCMonth()],
      isToday: toDateKey(ms) === todayKey,
    });
  }
  return days;
}
