import { vi } from 'vitest';
import type { ApiClient } from '../../src/api/types';
import type { EventType, Slot } from '../../src/api/types';

export const someEventTypes: EventType[] = [
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

// Slots are derived from the requested window, like the real API does: two slots on
// the first day of the window, one on the second, none after that.
const HOURS_BY_DAY: number[][] = [[9, 10], [9], []];

export const buildSlots = (from: string): Slot[] => {
  const startMs = Date.parse(from);
  const slots: Slot[] = [];
  HOURS_BY_DAY.forEach((hours, dayIndex) => {
    hours.forEach((hour) => {
      const s = startMs + dayIndex * 86_400_000 + hour * 3_600_000;
      slots.push({
        start: new Date(s).toISOString(),
        end: new Date(s + 30 * 60_000).toISOString(),
      });
    });
  });
  return slots;
};

export function buildFakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getEventTypes: vi.fn(async () => someEventTypes),
    getSlots: vi.fn(async ({ from }: { from: string }) => buildSlots(from)),
    createBooking: vi.fn(async (draft) => ({
      id: 'b1',
      ...draft,
      end: '2025-10-15T09:30:00.000Z',
    })),
    getBookings: vi.fn(async () => []),
    getAvailability: vi.fn(async () => ({})),
    putAvailability: vi.fn(async (a) => a),
    createEventType: vi.fn(async (et) => ({ ...et })),
    ...overrides,
  };
}
