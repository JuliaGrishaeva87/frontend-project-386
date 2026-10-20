import type { Booking, BookingDraft, EventType, Slot, Weekday, WeeklyAvailability } from './types';
import { WEEKDAYS } from './types';

export interface ApiClient {
  getEventTypes(): Promise<EventType[]>;
  getSlots(params: { eventTypeId: string; from: string; to: string }): Promise<Slot[]>;
  createBooking(draft: BookingDraft): Promise<Booking>;
  getAvailability(): Promise<WeeklyAvailability>;
  putAvailability(availability: WeeklyAvailability): Promise<WeeklyAvailability>;
  createEventType(et: Pick<EventType, 'name' | 'durationMinutes'>): Promise<EventType>;
}

const defaultEventTypes: EventType[] = [
  { id: 'intro', name: 'Intro call', durationMinutes: 15 },
  { id: 'consult', name: 'Consultation', durationMinutes: 30 },
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

      for (let t = rangeStart; t <= rangeEnd; t += 24 * 60 * 60 * 1000) {
        const day = new Date(t);
        const windows = availability[WEEKDAY_KEYS[day.getUTCDay()]] ?? [];
        for (const window of windows) {
          const open = toUtcMs(day, window.start);
          const close = toUtcMs(day, window.end);
          for (let s = open; s + durationMs <= close; s += durationMs) {
            const e = s + durationMs;
            if (s < rangeStart || e > rangeEnd) continue;
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
      const end = new Date(new Date(draft.start).getTime() + durationMs).toISOString();
      const booking: Booking = { ...draft, id: String(idCounter++), end };
      bookings.push(booking);
      return booking;
    },
    async getAvailability() {
      return availability;
    },
    async putAvailability(a: WeeklyAvailability) {
      availability = a;
      return availability;
    },
    async createEventType(et: Pick<EventType, 'name' | 'durationMinutes'>) {
      const id = et.name.toLowerCase().replace(/\s+/g, '-');
      const created: EventType = { id, name: et.name, durationMinutes: et.durationMinutes };
      eventTypes.push(created);
      return created;
    },
  };
}

export const mockApiClient = createMockApiClient();
