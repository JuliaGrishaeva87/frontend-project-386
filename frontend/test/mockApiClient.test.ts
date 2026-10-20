import { describe, expect, it } from 'vitest';
import { createMockApiClient } from '../src/api/client';

describe('createMockApiClient', () => {
  it('derives slots across multiple days from availability', async () => {
    const api = createMockApiClient();
    const from = '2025-10-13T00:00:00.000Z';
    const to = '2025-10-20T00:00:00.000Z';
    const slots = await api.getSlots({ eventTypeId: 'intro', from, to });
    const days = new Set(slots.map((s) => s.start.slice(0, 10)));
    expect(days.size).toBeGreaterThanOrEqual(5);
  });

  it('only offers weekdays when default availability is weekday-only', async () => {
    const api = createMockApiClient();
    const slots = await api.getSlots({
      eventTypeId: 'intro',
      from: '2025-10-13T00:00:00.000Z',
      to: '2025-10-20T00:00:00.000Z',
    });
    for (const s of slots) {
      const weekday = new Date(s.start).getUTCDay();
      expect(weekday).not.toBe(0);
      expect(weekday).not.toBe(6);
    }
  });

  it('keeps slots within the availability window', async () => {
    const api = createMockApiClient();
    const slots = await api.getSlots({
      eventTypeId: 'intro',
      from: '2025-10-13T00:00:00.000Z',
      to: '2025-10-20T00:00:00.000Z',
    });
    for (const s of slots) {
      expect(s.start.slice(11, 16) >= '09:00').toBe(true);
      expect(s.end.slice(11, 16) <= '17:00').toBe(true);
    }
  });

  it('does not offer an already booked slot', async () => {
    const api = createMockApiClient();
    const from = '2025-10-13T00:00:00.000Z';
    const to = '2025-10-20T00:00:00.000Z';
    const before = await api.getSlots({ eventTypeId: 'intro', from, to });
    const booked = before[0];
    await api.createBooking({
      eventTypeId: 'intro',
      start: booked.start,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    });
    const after = await api.getSlots({ eventTypeId: 'intro', from, to });
    expect(after.some((s) => s.start === booked.start)).toBe(false);
  });

  it('reflects host-saved availability when deriving slots', async () => {
    const api = createMockApiClient();
    await api.putAvailability({
      mon: [{ start: '15:00', end: '16:00' }],
    });
    // 2025-10-13 is a Monday
    const slots = await api.getSlots({
      eventTypeId: 'intro',
      from: '2025-10-13T00:00:00.000Z',
      to: '2025-10-14T00:00:00.000Z',
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(s.start.slice(11, 16) >= '15:00').toBe(true);
      expect(s.end.slice(11, 16) <= '16:00').toBe(true);
    }
  });
});
