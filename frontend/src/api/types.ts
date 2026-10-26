import type { components } from './generated/schema';

export type EventType = components['schemas']['EventType'];
export type EventTypeDraft = components['schemas']['EventTypeDraft'];
export type Slot = components['schemas']['Slot'];
export type BookingDraft = components['schemas']['BookingDraft'];
export type Booking = components['schemas']['Booking'];
export type TimeRange = components['schemas']['TimeRange'];
export type WeeklyAvailability = components['schemas']['WeeklyAvailability'];
export type ApiError = components['schemas']['ApiError'];

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export interface ApiClient {
  getEventTypes(): Promise<EventType[]>;
  getSlots(params: { eventTypeId: string; from: string; to: string }): Promise<Slot[]>;
  createBooking(draft: BookingDraft): Promise<Booking>;
  getBookings(): Promise<Booking[]>;
  getAvailability(): Promise<WeeklyAvailability>;
  putAvailability(availability: WeeklyAvailability): Promise<WeeklyAvailability>;
  createEventType(et: EventTypeDraft): Promise<EventType>;
}

export function resolveApiClient(client: ApiClient | undefined, fallback: ApiClient): ApiClient {
  return client ?? fallback;
}
