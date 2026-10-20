import { vi } from 'vitest';
import type { ApiClient } from '../../src/api/types';
import type { EventType, Slot } from '../../src/api/types';

export const someEventTypes: EventType[] = [
  { id: 'intro', name: 'Intro call', durationMinutes: 15 },
  { id: 'consult', name: 'Consultation', durationMinutes: 30 },
];

export const someSlots: Slot[] = [
  { start: '2025-10-15T09:00:00.000Z', end: '2025-10-15T09:30:00.000Z' },
  { start: '2025-10-15T10:00:00.000Z', end: '2025-10-15T10:30:00.000Z' },
  { start: '2025-10-16T09:00:00.000Z', end: '2025-10-16T09:30:00.000Z' },
];

export function buildFakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getEventTypes: vi.fn(async () => someEventTypes),
    getSlots: vi.fn(async () => someSlots),
    createBooking: vi.fn(async (draft) => ({
      id: 'b1',
      ...draft,
      end: '2025-10-15T09:30:00.000Z',
    })),
    getAvailability: vi.fn(async () => ({})),
    putAvailability: vi.fn(async (a) => a),
    createEventType: vi.fn(async (et) => ({ id: et.name.toLowerCase(), ...et })),
    ...overrides,
  };
}
