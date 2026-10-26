export type EventType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export type EventTypeDraft = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export type Slot = {
  start: string; // ISO datetime string
  end: string; // ISO datetime string
};

export type BookingDraft = {
  eventTypeId: string;
  start: string;
  guestName: string;
  guestEmail: string;
};

export type Booking = BookingDraft & {
  id: string;
  end: string;
};

export type TimeRange = {
  start: string; // HH:MM
  end: string; // HH:MM
};

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type WeeklyAvailability = Partial<Record<Weekday, TimeRange[]>>;
