import type { Booking, Slot, Weekday, WeeklyAvailability } from './types.js';
import { WEEKDAYS } from './types.js';

// Index-ordered for Date#getUTCDay (0 = Sunday), derived from the canonical WEEKDAYS.
const WEEKDAY_KEYS: Weekday[] = ['sun', ...WEEKDAYS.slice(0, 6)];

const atUtc = (day: Date, hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m);
};

const startOfUtcDay = (ms: number): number => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export function deriveSlots(params: {
  availability: WeeklyAvailability;
  durationMinutes: number;
  bookings: Booking[];
  from: number;
  to: number;
}): Slot[] {
  const { availability, durationMinutes, bookings, from, to } = params;
  const durationMs = durationMinutes * 60_000;
  const slots: Slot[] = [];

  for (let dayMs = startOfUtcDay(from); dayMs <= to; dayMs += 86_400_000) {
    const day = new Date(dayMs);
    const windows = availability[WEEKDAY_KEYS[day.getUTCDay()]] ?? [];
    for (const window of windows) {
      const open = atUtc(day, window.start);
      const close = atUtc(day, window.end);
      for (let s = open; s + durationMs <= close; s += durationMs) {
        const e = s + durationMs;
        if (s < from || e > to) continue;
        // A slot is free only if it overlaps no existing booking (any event type).
        if (bookings.some((b) => s < Date.parse(b.end) && Date.parse(b.start) < e)) continue;
        slots.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
      }
    }
  }
  return slots;
}
