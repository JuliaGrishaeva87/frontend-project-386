import { useEffect, useState } from 'react';
import type { ApiClient, Booking, EventType } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';

type Props = {
  api?: ApiClient;
};

type Meeting = {
  booking: Booking;
  eventType: EventType | undefined;
};

const formatDate = (iso: string): string => iso.slice(0, 10);

const formatTime = (iso: string): string => iso.slice(11, 16);

export default function HostBookingsPage({ api = defaultApiClient }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getBookings(), api.getEventTypes()])
      .then(([loadedBookings, loadedEventTypes]) => {
        if (cancelled) return;
        const nowMs = Date.now();
        setMeetings(
          loadedBookings
            .filter((b) => Date.parse(b.start) >= nowMs)
            .map((booking) => ({
              booking,
              eventType: loadedEventTypes.find((et) => et.id === booking.eventTypeId),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load meetings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upcoming meetings</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading && <p className="text-sm text-gray-600 mb-2">Loading…</p>}
      {!loading && !error && meetings.length === 0 && (
        <p className="text-sm text-gray-600">No upcoming meetings yet.</p>
      )}
      <ul className="space-y-2">
        {meetings.map(({ booking, eventType }) => (
          <li key={booking.id} className="border rounded px-3 py-2">
            <div className="flex justify-between">
              <span className="font-medium">
                {formatDate(booking.start)} {formatTime(booking.start)}–{formatTime(booking.end)}
              </span>
              <span className="text-sm text-gray-600">
                {eventType ? eventType.name : booking.eventTypeId}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {booking.guestName} · {booking.guestEmail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
