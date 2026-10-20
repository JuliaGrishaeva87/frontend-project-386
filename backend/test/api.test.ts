import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryRepository } from '../src/repository.js';
import type { WeeklyAvailability } from '../src/types.js';

const NOW = Date.UTC(2030, 0, 1, 12, 0, 0); // 2030-01-01T12:00:00Z

const allDays: WeeklyAvailability = {
  mon: [{ start: '09:00', end: '17:00' }],
  tue: [{ start: '09:00', end: '17:00' }],
  wed: [{ start: '09:00', end: '17:00' }],
  thu: [{ start: '09:00', end: '17:00' }],
  fri: [{ start: '09:00', end: '17:00' }],
  sat: [{ start: '09:00', end: '17:00' }],
  sun: [{ start: '09:00', end: '17:00' }],
};

describe('backend API', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    const repo = new InMemoryRepository({ availability: allDays });
    app = buildApp({ repo, now: () => NOW });
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists seeded event types', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/event-types' });
    expect(res.statusCode).toBe(200);
    const ids = (res.json() as Array<{ id: string }>).map((et) => et.id);
    expect(ids).toContain('intro');
    expect(ids).toContain('consult');
  });

  it('creates an event type with a slug id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Deep Dive', durationMinutes: 45 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; name: string; durationMinutes: number };
    expect(body.id).toBe('deep-dive');
    expect(body.durationMinutes).toBe(45);
  });

  it('rejects an event type without a name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { durationMinutes: 45 },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an event type with a non-positive duration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Bad', durationMinutes: 0 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns the seeded availability', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/availability' });
    expect(res.statusCode).toBe(200);
    expect((res.json() as WeeklyAvailability).mon).toEqual([{ start: '09:00', end: '17:00' }]);
  });

  it('fully replaces availability on PUT', async () => {
    const next: WeeklyAvailability = { mon: [{ start: '10:00', end: '14:00' }] };
    const put = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: next,
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({ method: 'GET', url: '/api/availability' });
    expect(get.json()).toEqual({ mon: [{ start: '10:00', end: '14:00' }] });
  });

  it('rejects an unknown weekday on PUT availability', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: { monday: [{ start: '10:00', end: '14:00' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a non-HH:MM range on PUT availability', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: { mon: [{ start: '9am', end: '5pm' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('derives only future slots within the requested window', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/slots?eventTypeId=intro&from=2030-01-01T00:00:00Z&to=2030-01-02T00:00:00Z',
    });
    expect(res.statusCode).toBe(200);
    const slots = res.json() as Array<{ start: string }>;
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start).toBe('2030-01-01T12:00:00.000Z');
    for (const s of slots) {
      expect(Date.parse(s.start) >= NOW).toBe(true);
    }
  });

  it('defaults the horizon to 14 days when from/to are omitted', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/slots?eventTypeId=intro' });
    expect(res.statusCode).toBe(200);
    const slots = res.json() as Array<{ start: string }>;
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      const t = Date.parse(s.start);
      expect(t >= NOW).toBe(true);
      expect(t <= NOW + 14 * 86_400_000).toBe(true);
    }
  });

  it('returns 404 for an unknown event type on GET slots', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/slots?eventTypeId=nope' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when eventTypeId is missing on GET slots', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/slots' });
    expect(res.statusCode).toBe(400);
  });

  it('books an available slot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'alice@example.com',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; end: string; guestName: string };
    expect(body.id).toBeTruthy();
    expect(body.end).toBe('2030-01-01T13:15:00.000Z');
    expect(body.guestName).toBe('Alice');
  });

  it('rejects a booking with an invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'not-an-email',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for an unknown event type on POST bookings', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'nope',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'alice@example.com',
      },
    });
    expect(res.statusCode).toBe(404);
  });

  it('rejects a booking in the past', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-01T10:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'alice@example.com',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when the slot is already booked', async () => {
    const payload = {
      eventTypeId: 'intro',
      start: '2030-01-01T13:00:00.000Z',
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    };
    const first = await app.inject({ method: 'POST', url: '/api/bookings', payload });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...payload, guestName: 'Bob', guestEmail: 'bob@example.com' },
    });
    expect(second.statusCode).toBe(409);
  });

  it('forbids overlapping bookings across different event types', async () => {
    const intro = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'alice@example.com',
      },
    });
    expect(intro.statusCode).toBe(201);

    const consult = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'consult',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Bob',
        guestEmail: 'bob@example.com',
      },
    });
    expect(consult.statusCode).toBe(409);
  });

  it('hides a slot that overlaps an unrelated booking from GET /slots', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'consult',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Bob',
        guestEmail: 'bob@example.com',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/slots?eventTypeId=intro&from=2030-01-01T13:00:00Z&to=2030-01-01T13:15:00Z',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});
