import React, { useEffect, useMemo, useState } from 'react';
import type { Booking, EventType, Slot } from '../api/types';
import type { ApiClient } from '../api/client';
import { mockApiClient } from '../api/client';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';

type Props = {
  api?: ApiClient;
};

export default function BookingPage({ api = mockApiClient }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    api.getEventTypes().then(setEventTypes).catch(() => setEventTypes([]));
  }, [api]);

  useEffect(() => {
    if (!selectedEventType) return;
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 14);
    api
      .getSlots({
        eventTypeId: selectedEventType.id,
        from: from.toISOString(),
        to: to.toISOString(),
      })
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [api, selectedEventType]);

  const grouped = useMemo(() => groupSlotsByDate(slots), [slots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
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
    } catch {
      /* booking failed; form stays visible for retry */
    }
  };

  const formatTime = (iso: string) => iso.slice(11, 16);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book a call</h1>
      <div className="mb-4">
        <h2 className="text-lg mb-2">Event types</h2>
        <div className="flex gap-2 flex-wrap">
          {eventTypes.map((et) => (
            <button
              key={et.id}
              type="button"
              onClick={() => {
                setSelectedEventType(et);
                setSlots([]);
                setSelectedSlot(null);
                setBooking(null);
                setNameError('');
                setEmailError('');
              }}
              className="px-3 py-1 border rounded"
            >
              {et.name}
            </button>
          ))}
        </div>
      </div>

      {selectedEventType && (
        <div className="mb-4">
          <h2 className="text-lg mb-2">Available slots</h2>
          {Object.keys(grouped).length === 0 && <p>No available slots</p>}
          {Object.keys(grouped)
            .sort()
            .map((date) => (
              <div key={date} className="mb-3">
                <div className="font-semibold mb-1">{date}</div>
                <div className="flex gap-2 flex-wrap">
                  {grouped[date].map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(s);
                        setBooking(null);
                        setNameError('');
                        setEmailError('');
                      }}
                      className="px-2 py-1 border rounded text-sm"
                      data-testid="slot"
                    >
                      {formatTime(s.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
