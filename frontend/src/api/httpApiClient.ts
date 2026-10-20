import type { ApiClient, Booking, BookingDraft, EventType, Slot, WeeklyAvailability } from './types';

const BASE = '/api';

type ApiError = { error: { code: string; message: string } };

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as Partial<ApiError>;
      if (body.error?.message) message = body.error.message;
    } catch {
      // non-JSON error body; keep the status message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
};

export function createHttpApiClient(): ApiClient {
  return {
    getEventTypes: () => request<EventType[]>('/event-types'),
    getSlots: ({ eventTypeId, from, to }) => {
      const params = new URLSearchParams({ eventTypeId, from, to });
      return request<Slot[]>(`/slots?${params.toString()}`);
    },
    createBooking: (draft: BookingDraft) =>
      request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(draft) }),
    getAvailability: () => request<WeeklyAvailability>('/availability'),
    putAvailability: (availability: WeeklyAvailability) =>
      request<WeeklyAvailability>('/availability', {
        method: 'PUT',
        body: JSON.stringify(availability),
      }),
    createEventType: (et: Pick<EventType, 'name' | 'durationMinutes'>) =>
      request<EventType>('/event-types', { method: 'POST', body: JSON.stringify(et) }),
  };
}
