import { useEffect, useState } from 'react';
import BookingHeader from '../components/BookingHeader';
import type { ApiClient, Booking, EventType } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';

type Props = {
  api?: ApiClient;
};

type Meeting = {
  booking: Booking;
  eventType: EventType | undefined;
};

const formatCreated = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const time = iso.slice(11, 16);
  return `${day}.${month}.${year}, ${time}`;
};

export default function BookingsPage({ api = defaultApiClient }: Props) {
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
              eventType: loadedEventTypes.find(
                (et) => et.id === booking.eventTypeId,
              ),
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
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 tracking-tight text-gray-950">
            Предстоящие события
          </h1>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          {loading && <p className="text-sm text-gray-600 mb-2">Loading…</p>}
          {!loading && !error && meetings.length === 0 && (
            <p className="text-sm text-gray-600">No upcoming meetings yet.</p>
          )}
          <div className="flex flex-col gap-4">
            {meetings.map(({ booking }) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6"
              >
                <p className="text-base font-bold text-gray-950 mb-1">
                  {booking.guestName}
                </p>
                <p className="text-sm text-gray-400 font-medium mb-3">
                  {booking.guestEmail}
                </p>
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Слот: {booking.start.slice(0, 10)}-{booking.start.slice(11, 16)}
                </p>
                <p className="text-sm text-gray-400 font-normal">
                  Создано: {formatCreated(booking.start)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
