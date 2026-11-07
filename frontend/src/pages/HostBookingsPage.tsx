import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-100 z-10">
        <div className="max-w-[70rem] mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="4" fill="#ff6b00" />
              <rect
                x="3"
                y="9"
                width="18"
                height="12"
                rx="4"
                fill="#ffffff"
                stroke="#ff6b00"
                strokeWidth="1.5"
              />
              <line
                x1="8"
                y1="4"
                x2="8"
                y2="9"
                stroke="#ff6b00"
                strokeWidth="1.5"
              />
              <line
                x1="16"
                y1="4"
                x2="16"
                y2="9"
                stroke="#ff6b00"
                strokeWidth="1.5"
              />
              <line
                x1="8"
                y1="15"
                x2="16"
                y2="15"
                stroke="#ff6b00"
                strokeWidth="1.5"
              />
            </svg>
            <Link to="/" className="font-bold text-black">
              Calendar
            </Link>
          </div>
          <nav className="flex gap-2">
            <Link to="/booking" className="px-3 py-1 text-sm text-gray-400">
              Записаться
            </Link>
            <Link
              to="/host/bookings"
              className="px-3 py-1 text-sm text-gray-400"
            >
              Предстоящие события
            </Link>
          </nav>
        </div>
      </header>
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
  );
}
