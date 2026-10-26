import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';
import type {
  ApiClient,
  ApiError,
  Booking,
  BookingDraft,
  EventType,
  EventTypeDraft,
  Slot,
  WeeklyAvailability,
} from './types';

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

const unwrap = <T>({ data, error, response }: ApiResult<T>): T => {
  if (response.ok && data !== undefined) return data;
  const apiError = error as ApiError | undefined;
  const message =
    apiError?.error?.message ?? `Request failed with status ${response.status}`;
  throw new Error(message);
};

type ClientOptions = { baseUrl?: string };

const defaultBaseUrl = typeof globalThis.location === 'undefined' ? '' : globalThis.location.origin;

export function createHttpApiClient({ baseUrl = defaultBaseUrl }: ClientOptions = {}): ApiClient {
  const client = createClient<paths>({ baseUrl });

  return {
    getEventTypes: async (): Promise<EventType[]> =>
      unwrap(await client.GET('/api/event-types')),
    getSlots: async ({ eventTypeId, from, to }): Promise<Slot[]> =>
      unwrap(
        await client.GET('/api/slots', { params: { query: { eventTypeId, from, to } } }),
      ),
    createBooking: async (draft: BookingDraft): Promise<Booking> =>
      unwrap(await client.POST('/api/bookings', { body: draft })),
    getBookings: async (): Promise<Booking[]> => unwrap(await client.GET('/api/bookings')),
    getAvailability: async (): Promise<WeeklyAvailability> =>
      unwrap(await client.GET('/api/availability')),
    putAvailability: async (availability: WeeklyAvailability): Promise<WeeklyAvailability> =>
      unwrap(await client.PUT('/api/availability', { body: availability })),
    createEventType: async (et: EventTypeDraft): Promise<EventType> =>
      unwrap(await client.POST('/api/event-types', { body: et })),
  };
}
