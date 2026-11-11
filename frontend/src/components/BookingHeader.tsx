import { Link } from 'react-router-dom';
import { useBookingFlow } from '../context/BookingContext';

export default function BookingHeader() {
  const { setStep } = useBookingFlow();

  const goHome = () => {
    setStep({ name: 'landing' });
  };

  const goEventTypes = () => {
    setStep({ name: 'event-types' });
  };

  return (
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
          <Link to="/" onClick={goHome} className="font-bold text-black">
            Calendar
          </Link>
        </div>
        <nav className="flex gap-2">
          <Link
            to="/event-types"
            onClick={goEventTypes}
            className="px-3 py-1 text-sm text-gray-400"
          >
            Записаться
          </Link>
          <Link
            to="/bookings"
            className="px-3 py-1 text-sm text-gray-400"
          >
            Предстоящие события
          </Link>
        </nav>
      </div>
    </header>
  );
}
