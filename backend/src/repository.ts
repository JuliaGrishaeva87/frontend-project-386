import type { Booking, EventType, EventTypeDraft, WeeklyAvailability } from './types.js';

export interface Repository {
  listEventTypes(): EventType[];
  getEventType(id: string): EventType | undefined;
  createEventType(input: EventTypeDraft): EventType;
  getAvailability(): WeeklyAvailability;
  setAvailability(availability: WeeklyAvailability): WeeklyAvailability;
  listBookings(): Booking[];
  addBooking(input: Omit<Booking, 'id'>): Booking;
}

const defaultEventTypes: EventType[] = [
  {
    id: 'intro',
    name: 'Intro call',
    description: 'A short introduction to get to know each other.',
    durationMinutes: 15,
  },
  {
    id: 'consult',
    name: 'Consultation',
    description: 'A longer session to go through your questions in detail.',
    durationMinutes: 30,
  },
];

const defaultAvailability: WeeklyAvailability = {
  mon: [{ start: '09:00', end: '17:00' }],
  tue: [{ start: '09:00', end: '17:00' }],
  wed: [{ start: '09:00', end: '17:00' }],
  thu: [{ start: '09:00', end: '17:00' }],
  fri: [{ start: '09:00', end: '17:00' }],
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class InMemoryRepository implements Repository {
  private eventTypes: EventType[];
  private availability: WeeklyAvailability;
  private bookings: Booking[] = [];
  private idCounter = 1;

  constructor(seed?: { eventTypes?: EventType[]; availability?: WeeklyAvailability }) {
    this.eventTypes = clone(seed?.eventTypes ?? defaultEventTypes);
    this.availability = clone(seed?.availability ?? defaultAvailability);
  }

  listEventTypes(): EventType[] {
    return [...this.eventTypes];
  }

  getEventType(id: string): EventType | undefined {
    return this.eventTypes.find((et) => et.id === id);
  }

  createEventType(input: EventTypeDraft): EventType {
    const created: EventType = { ...input };
    this.eventTypes.push(created);
    return created;
  }

  getAvailability(): WeeklyAvailability {
    return this.availability;
  }

  setAvailability(availability: WeeklyAvailability): WeeklyAvailability {
    this.availability = availability;
    return this.availability;
  }

  listBookings(): Booking[] {
    return [...this.bookings];
  }

  addBooking(input: Omit<Booking, 'id'>): Booking {
    const booking: Booking = { ...input, id: String(this.idCounter++) };
    this.bookings.push(booking);
    return booking;
  }
}
