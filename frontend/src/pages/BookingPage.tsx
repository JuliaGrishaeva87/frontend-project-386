import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiClient, Booking, EventType, Slot } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';
import { buildCalendarDays } from '../utils/buildCalendarDays';
import SlotCalendar from '../components/SlotCalendar';

type Props = {
  api?: ApiClient;
};

const BOOKING_WINDOW_DAYS = 14;

export default function BookingPage({ api = defaultApiClient }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getEventTypes()
      .then((loaded) => {
        if (!cancelled) setEventTypes(loaded);
      })
      .catch(() => {
        if (!cancelled) setEventTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEventTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const fetchSlots = useCallback(
    async (eventType: EventType) => {
      const from = new Date();
      from.setUTCHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + BOOKING_WINDOW_DAYS);
      return api.getSlots({
        eventTypeId: eventType.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
    },
    [api],
  );

  useEffect(() => {
    if (!selectedEventType) return;
    let cancelled = false;
    fetchSlots(selectedEventType)
      .then((loaded) => {
        if (!cancelled) setSlots(loaded);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSlots, selectedEventType]);

  const grouped = useMemo(() => groupSlotsByDate(slots), [slots]);
  const calendarDays = useMemo(() => buildCalendarDays(new Date(), BOOKING_WINDOW_DAYS), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setBookingError('');
    let hasError = false;
    if (!guestName.trim()) {
      setNameError('Name is required');
      hasError = true;
    }
    const email = guestEmail.trim();
    const emailValid = /.+@.+\..+/.test(email);
    if (!emailValid) {
      setEmailError('Enter a valid email');
      hasError = true;
    }
    if (hasError || !selectedEventType || !selectedSlot) return;
    try {
      const b = await api.createBooking({
        eventTypeId: selectedEventType.id,
        start: selectedSlot.start,
        guestName: guestName.trim(),
        guestEmail: email,
      });
      setBooking(b);
      setSelectedSlot(null);
      await fetchSlots(selectedEventType)
        .then(setSlots)
        .catch(() => {});
    } catch (err) {
      // The booking failed (for example the slot was taken meanwhile): the form stays
      // so the guest can pick another slot and try again.
      setBookingError(err instanceof Error ? err.message : 'Failed to create the booking');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book a call</h1>
      <div className="mb-4">
        <h2 className="text-lg mb-2">Booking types</h2>
        {!loadingEventTypes && eventTypes.length === 0 && (
          <p className="text-sm text-gray-600">No booking types available yet.</p>
        )}
        <ul className="grid sm:grid-cols-2 gap-2">
          {eventTypes.map((et) => (
            <li key={et.id} className="border rounded p-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedEventType(et);
                  setSlots([]);
                  setSelectedSlot(null);
                  setBooking(null);
                  setNameError('');
                  setEmailError('');
                  setBookingError('');
                  setLoadingSlots(true);
                }}
                className={`text-left font-medium ${
                  selectedEventType?.id === et.id ? 'text-blue-700 underline' : ''
                }`}
              >
                {et.name}
              </button>
              {et.description && <p className="text-sm text-gray-600 mt-1">{et.description}</p>}
              <p className="text-sm text-gray-500 mt-1">{et.durationMinutes} min</p>
            </li>
          ))}
        </ul>
      </div>

      {selectedEventType && (
        <div className="mb-4">
          <h2 className="text-lg mb-2">Available slots</h2>
          {slots.length === 0 && !loadingSlots && <p>No available slots</p>}
          <SlotCalendar
            days={calendarDays}
            slotsByDate={grouped}
            selectedSlot={selectedSlot}
            onSelect={(s) => {
              setSelectedSlot(s);
              setBooking(null);
              setNameError('');
              setEmailError('');
              setBookingError('');
            }}
          />
        </div>
      )}

      {selectedSlot && !booking && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
            {nameError && <p className="text-sm text-red-600">{nameError}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </div>
          <button type="submit" className="px-3 py-1 border rounded">
            Book
          </button>
          {bookingError && (
            <p className="text-sm text-red-600" role="alert">
              {bookingError}
            </p>
          )}
        </form>
      )}

      {booking && (
        <div className="p-3 border rounded bg-green-50 text-green-800">
          <p>Booking confirmed!</p>
        </div>
      )}
    </div>
  );
}
