import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

  it('creates an event type with the id, name, description and duration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: {
        id: 'deep-dive',
        name: 'Deep Dive',
        description: 'A deep dive session',
        durationMinutes: 45,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      id: string;
      name: string;
      description: string;
      durationMinutes: number;
    };
    expect(body.id).toBe('deep-dive');
    expect(body.name).toBe('Deep Dive');
    expect(body.description).toBe('A deep dive session');
    expect(body.durationMinutes).toBe(45);
  });

  it('creates an event type without a description', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { id: 'quick-chat', name: 'Quick chat', durationMinutes: 10 },
    });
    expect(res.statusCode).toBe(201);
    expect((res.json() as { description: string }).description).toBe('');
  });

  it('rejects an event type without an id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Deep Dive', durationMinutes: 45 },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an event type id that is not a slug', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { id: 'Deep Dive!', name: 'Deep Dive', durationMinutes: 45 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a duplicate event type id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { id: 'intro', name: 'Another Intro', durationMinutes: 15 },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { error: { code: string } }).error.code).toBe('CONFLICT');
  });

  it('rejects an event type without a name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { id: 'nameless', durationMinutes: 45 },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an event type with a non-positive duration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { id: 'bad', name: 'Bad', durationMinutes: 0 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('lists bookings in chronological order', async () => {
    const later = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-02T13:00:00.000Z',
        guestName: 'Bob',
        guestEmail: 'bob@example.com',
      },
    });
    expect(later.statusCode).toBe(201);
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: 'intro',
        start: '2030-01-01T13:00:00.000Z',
        guestName: 'Alice',
        guestEmail: 'alice@example.com',
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/bookings' });
    expect(res.statusCode).toBe(200);
    const bookings = res.json() as Array<{ guestName: string }>;
    expect(bookings.map((b) => b.guestName)).toEqual(['Alice', 'Bob']);
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

  it('rejects a range whose start is not before its end', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: { mon: [{ start: '17:00', end: '09:00' }] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/start must be before end/);

    const same = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: { mon: [{ start: '09:00', end: '09:00' }] },
    });
    expect(same.statusCode).toBe(400);
  });

  it('rejects overlapping ranges within a weekday', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: {
        mon: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '15:00' },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/must not overlap/);
  });

  it('accepts touching ranges', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: {
        mon: [
          { start: '09:00', end: '12:00' },
          { start: '12:00', end: '15:00' },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
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

describe('static frontend', () => {
  it('never caches the SPA shell and caches fingerprinted assets', async () => {
    const root = mkdtempSync(join(tmpdir(), 'call-scheduler-static-'));
    mkdirSync(join(root, 'assets'));
    writeFileSync(join(root, 'index.html'), '<!doctype html><div id="root"></div>');
    writeFileSync(join(root, 'assets', 'app-123.js'), 'console.log(1)');

    const repo = new InMemoryRepository({ availability: allDays });
    const staticApp = buildApp({ repo, now: () => NOW, staticRoot: root });

    try {
      const shell = await staticApp.inject({ method: 'GET', url: '/' });
      expect(shell.statusCode).toBe(200);
      expect(shell.headers['cache-control']).toBe('no-store');
      expect(shell.headers.etag).toBeUndefined();

      const deepLink = await staticApp.inject({ method: 'GET', url: '/host/bookings' });
      expect(deepLink.statusCode).toBe(200);
      expect(deepLink.headers['cache-control']).toBe('no-store');

      const asset = await staticApp.inject({ method: 'GET', url: '/assets/app-123.js' });
      expect(asset.statusCode).toBe(200);
      expect(asset.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    } finally {
      await staticApp.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
