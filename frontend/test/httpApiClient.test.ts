import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpApiClient } from '../src/api/httpApiClient';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const stubFetch = (body: unknown, status = 200) => {
  const fetchMock = vi.fn(async () => json(body, status));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const asRequest = (fetchMock: ReturnType<typeof stubFetch>, index = 0): Request => {
  const [input, init] = fetchMock.mock.calls[index] as [RequestInfo | URL, RequestInit?];
  return input instanceof Request ? input : new Request(String(input), init);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('httpApiClient (generated SDK)', () => {
  it('lists event types over GET /api/event-types', async () => {
    const fetchMock = stubFetch([
      { id: 'intro', name: 'Intro call', description: 'Hi', durationMinutes: 15 },
    ]);

    const result = await createHttpApiClient({ baseUrl: 'http://localhost' }).getEventTypes();

    const request = asRequest(fetchMock);
    expect(request.method).toBe('GET');
    expect(new URL(request.url).pathname).toBe('/api/event-types');
    expect(result).toEqual([
      { id: 'intro', name: 'Intro call', description: 'Hi', durationMinutes: 15 },
    ]);
  });

  it('asks for slots with the query parameters from the contract', async () => {
    const fetchMock = stubFetch([]);

    await createHttpApiClient({ baseUrl: 'http://localhost' }).getSlots({
      eventTypeId: 'intro',
      from: '2026-10-24T00:00:00.000Z',
      to: '2026-11-07T00:00:00.000Z',
    });

    const url = new URL(asRequest(fetchMock).url);
    expect(url.pathname).toBe('/api/slots');
    expect(url.searchParams.get('eventTypeId')).toBe('intro');
    expect(url.searchParams.get('from')).toBe('2026-10-24T00:00:00.000Z');
    expect(url.searchParams.get('to')).toBe('2026-11-07T00:00:00.000Z');
  });

  it('creates a booking with POST and a JSON body', async () => {
    const draft = {
      eventTypeId: 'intro',
      start: '2026-10-26T09:00:00.000Z',
      guestName: 'Ada',
      guestEmail: 'ada@example.com',
    };
    const fetchMock = stubFetch({ ...draft, id: '1', end: '2026-10-26T09:15:00.000Z' }, 201);

    const booking = await createHttpApiClient({ baseUrl: 'http://localhost' }).createBooking(draft);

    const request = asRequest(fetchMock);
    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe('/api/bookings');
    expect(await request.json()).toEqual(draft);
    expect(booking.id).toBe('1');
  });

  it('surfaces the server error message on a conflict', async () => {
    stubFetch(
      { error: { code: 'CONFLICT', message: 'requested slot is not available' } },
      409,
    );

    await expect(
      createHttpApiClient({ baseUrl: 'http://localhost' }).createBooking({
        eventTypeId: 'intro',
        start: '2026-10-26T09:00:00.000Z',
        guestName: 'Ada',
        guestEmail: 'ada@example.com',
      }),
    ).rejects.toThrow('requested slot is not available');
  });

  it('saves availability with PUT /api/availability', async () => {
    const availability = { mon: [{ start: '09:00', end: '17:00' }] };
    const fetchMock = stubFetch(availability);

    await createHttpApiClient({ baseUrl: 'http://localhost' }).putAvailability(availability);

    const request = asRequest(fetchMock);
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).pathname).toBe('/api/availability');
    expect(await request.json()).toEqual(availability);
  });
});
