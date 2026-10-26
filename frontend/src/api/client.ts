import type {
  Booking,
  BookingDraft,
  EventType,
  EventTypeDraft,
  Slot,
  Weekday,
  WeeklyAvailability,
} from './types';
import type { ApiClient } from './types';
import { WEEKDAYS } from './types';

const defaultEventTypes: EventType[] = [
  {
    id: 'intro',
    name: 'Intro call',
    description: 'A short introduction to get to know each other.',
    durationMinutes: 15,
  },
  {
    id: 'consult',
    name: 'Consultation',
    description: 'A longer session to go through your questions in detail.',
    durationMinutes: 30,
  },
];

const defaultAvailability: WeeklyAvailability = {
  mon: [{ start: '09:00', end: '17:00' }],
  tue: [{ start: '09:00', end: '17:00' }],
  wed: [{ start: '09:00', end: '17:00' }],
  thu: [{ start: '09:00', end: '17:00' }],
  fri: [{ start: '09:00', end: '17:00' }],
};

// Index-ordered for Date#getUTCDay (0 = Sunday), derived from the canonical WEEKDAYS.
const WEEKDAY_KEYS: Weekday[] = ['sun', ...WEEKDAYS.slice(0, 6)];

const toUtcMs = (day: Date, hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m);
};

export function createMockApiClient(): ApiClient {
  let availability: WeeklyAvailability = JSON.parse(JSON.stringify(defaultAvailability));
  const eventTypes: EventType[] = JSON.parse(JSON.stringify(defaultEventTypes));
  const bookings: Booking[] = [];
  let idCounter = 1;

  return {
    async getEventTypes() {
      return eventTypes;
    },
    async getSlots({ eventTypeId, from, to }: { eventTypeId: string; from: string; to: string }) {
      const et = eventTypes.find((e) => e.id === eventTypeId);
      if (!et) return [];
      const rangeStart = Date.parse(from);
      const rangeEnd = Date.parse(to);
      const durationMs = et.durationMinutes * 60 * 1000;
      const slots: Slot[] = [];
      // Only future slots are offered, matching the backend (from = max(now, requestedFrom)).
      const fromMs = Math.max(rangeStart, Date.now());

      for (let t = rangeStart; t <= rangeEnd; t += 24 * 60 * 60 * 1000) {
        const day = new Date(t);
        const windows = availability[WEEKDAY_KEYS[day.getUTCDay()]] ?? [];
        for (const window of windows) {
          const open = toUtcMs(day, window.start);
          const close = toUtcMs(day, window.end);
          for (let s = open; s + durationMs <= close; s += durationMs) {
            const e = s + durationMs;
            if (s < fromMs || e > rangeEnd) continue;
            // A slot is free only if it overlaps no existing booking (any event type).
            if (bookings.some((b) => s < Date.parse(b.end) && Date.parse(b.start) < e)) continue;
            slots.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
          }
        }
      }
      return slots;
    },
    async createBooking(draft: BookingDraft) {
      const et = eventTypes.find((e) => e.id === draft.eventTypeId);
      if (!et) throw new Error('Invalid event type');
      const durationMs = et.durationMinutes * 60 * 1000;
      const startMs = Date.parse(draft.start);
      const endMs = startMs + durationMs;
      if (startMs <= Date.now()) {
        throw new Error('start must be in the future');
      }
      // The same rule as the backend: a slot may not overlap any existing booking.
      if (bookings.some((b) => startMs < Date.parse(b.end) && Date.parse(b.start) < endMs)) {
        throw new Error('requested slot is not available');
      }
      const end = new Date(endMs).toISOString();
      const booking: Booking = { ...draft, id: String(idCounter++), end };
      bookings.push(booking);
      return booking;
    },
    async getBookings() {
      return [...bookings].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    },
    async getAvailability() {
      return availability;
    },
    async putAvailability(a: WeeklyAvailability) {
      availability = a;
      return availability;
    },
    async createEventType(draft: EventTypeDraft) {
      if (eventTypes.some((e) => e.id === draft.id)) {
        throw new Error('An event type with this id already exists');
      }
      const created: EventType = { ...draft };
      eventTypes.push(created);
      return created;
    },
  };
}

export const mockApiClient = createMockApiClient();
