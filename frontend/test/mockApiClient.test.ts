import { describe, expect, it } from 'vitest';
import { createMockApiClient } from '../src/api/client';

// The mock only offers future slots, so the tests work in a window that starts on an
// upcoming Monday.
const nextMonday = (): Date => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const daysAhead = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d;
};

const window = (days = 7): { from: string; to: string } => {
  const from = nextMonday();
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + days);
  return { from: from.toISOString(), to: to.toISOString() };
};

describe('createMockApiClient', () => {
  it('derives slots across multiple days from availability', async () => {
    const api = createMockApiClient();
    const slots = await api.getSlots({ eventTypeId: 'intro', ...window() });
    const days = new Set(slots.map((s) => s.start.slice(0, 10)));
    expect(days.size).toBeGreaterThanOrEqual(5);
  });

  it('only offers weekdays when default availability is weekday-only', async () => {
    const api = createMockApiClient();
    const slots = await api.getSlots({ eventTypeId: 'intro', ...window() });
    for (const s of slots) {
      const weekday = new Date(s.start).getUTCDay();
      expect(weekday).not.toBe(0);
      expect(weekday).not.toBe(6);
    }
  });

  it('keeps slots within the availability window', async () => {
    const api = createMockApiClient();
    const slots = await api.getSlots({ eventTypeId: 'intro', ...window() });
    for (const s of slots) {
      expect(s.start.slice(11, 16) >= '09:00').toBe(true);
      expect(s.end.slice(11, 16) <= '17:00').toBe(true);
    }
  });

  it('does not offer a slot that already started', async () => {
    const api = createMockApiClient();
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
    const slots = await api.getSlots({
      eventTypeId: 'intro',
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const nowMs = Date.now();
    for (const s of slots) {
      expect(Date.parse(s.start)).toBeGreaterThan(nowMs);
    }
  });

  it('does not offer an already booked slot', async () => {
    const api = createMockApiClient();
    const range = window();
    const before = await api.getSlots({ eventTypeId: 'intro', ...range });
    const booked = before[0];
    await api.createBooking({
      eventTypeId: 'intro',
      start: booked.start,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    });
    const after = await api.getSlots({ eventTypeId: 'intro', ...range });
    expect(after.some((s) => s.start === booked.start)).toBe(false);
  });

  it('refuses a booking that overlaps an existing one', async () => {
    const api = createMockApiClient();
    const range = window();
    const slots = await api.getSlots({ eventTypeId: 'intro', ...range });
    const booked = slots[0];
    await api.createBooking({
      eventTypeId: 'intro',
      start: booked.start,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    });
    await expect(
      api.createBooking({
        eventTypeId: 'intro',
        start: booked.start,
        guestName: 'Bob',
        guestEmail: 'bob@example.com',
      }),
    ).rejects.toThrow(/not available/i);
  });

  it('refuses a booking in the past', async () => {
    const api = createMockApiClient();
    const past = new Date();
    past.setUTCHours(past.getUTCHours() - 1);
    await expect(
      api.createBooking({
        eventTypeId: 'intro',
        start: past.toISOString(),
        guestName: 'Bob',
        guestEmail: 'bob@example.com',
      }),
    ).rejects.toThrow(/future/i);
  });

  it('lists bookings in chronological order', async () => {
    const api = createMockApiClient();
    const range = window();
    const slots = await api.getSlots({ eventTypeId: 'intro', ...range });
    await api.createBooking({
      eventTypeId: 'intro',
      start: slots[2].start,
      guestName: 'Bob',
      guestEmail: 'bob@example.com',
    });
    await api.createBooking({
      eventTypeId: 'intro',
      start: slots[0].start,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    });
    const bookings = await api.getBookings();
    expect(bookings.map((b) => b.guestName)).toEqual(['Alice', 'Bob']);
  });

  it('creates an event type with the id chosen by the owner', async () => {
    const api = createMockApiClient();
    const created = await api.createEventType({
      id: 'deep-dive',
      name: 'Deep Dive',
      description: 'A deep dive session',
      durationMinutes: 45,
    });
    expect(created.id).toBe('deep-dive');
    expect((await api.getEventTypes()).some((et) => et.id === 'deep-dive')).toBe(true);
  });

  it('refuses a duplicate event type id', async () => {
    const api = createMockApiClient();
    await expect(
      api.createEventType({
        id: 'intro',
        name: 'Another Intro',
        description: '',
        durationMinutes: 15,
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it('reflects host-saved availability when deriving slots', async () => {
    const api = createMockApiClient();
    await api.putAvailability({
      mon: [{ start: '15:00', end: '16:00' }],
    });
    const from = nextMonday();
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 1);
    const slots = await api.getSlots({
      eventTypeId: 'intro',
      from: from.toISOString(),
      to: to.toISOString(),
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(s.start.slice(11, 16) >= '15:00').toBe(true);
      expect(s.end.slice(11, 16) <= '16:00').toBe(true);
    }
  });
});
