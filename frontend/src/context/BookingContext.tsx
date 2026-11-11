import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ApiClient, Booking, EventType, Slot } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';

const BOOKING_WINDOW_DAYS = 14;

const stepFromPath = (pathname: string): BookingStep => {
  switch (pathname) {
    case '/event-types':
      return { name: 'event-types' };
    case '/availability':
      return { name: 'availability' };
    case '/confirm':
      return { name: 'booking' };
    case '/confirmed':
      return { name: 'confirmed' };
    default:
      return { name: 'landing' };
  }
};

export type BookingStep =
  | { name: 'landing' }
  | { name: 'event-types' }
  | { name: 'availability' }
  | { name: 'booking' }
  | { name: 'confirmed' };

type BookingContextValue = {
  api: ApiClient;
  eventTypes: EventType[];
  loadingEventTypes: boolean;
  selectedEventType: EventType | null;
  slots: Slot[];
  loadingSlots: boolean;
  selectedSlot: Slot | null;
  selectedDay: string | null;
  booking: Booking | null;
  bookingConfirmed: boolean;
  bookings: Booking[];
  guestName: string;
  guestEmail: string;
  nameError: string;
  emailError: string;
  bookingError: string;
  step: BookingStep;
  navigate: (to: string) => void;
  setBooking: (value: Booking | null) => void;
  grouped: ReturnType<typeof groupSlotsByDate>;
  dayPills: Slot[];
  setStep: (step: BookingStep) => void;
  setGuestName: (value: string) => void;
  setGuestEmail: (value: string) => void;
  selectEventType: (eventType: EventType) => void;
  selectDay: (day: string) => void;
  selectSlot: (slot: Slot) => void;
  continueFromSlot: () => void;
  confirmBooking: () => Promise<void>;
  resetFlow: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

type BookingFlowProviderProps = {
  api?: ApiClient;
  children: React.ReactNode;
};

export function BookingFlowProvider({
  api = defaultApiClient,
  children,
}: BookingFlowProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null,
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [step, setStep] = useState<BookingStep>(() => stepFromPath(location.pathname));
  const [lastPath, setLastPath] = useState<string>(location.pathname);

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setStep(stepFromPath(location.pathname));
  }

  useEffect(() => {
    let cancelled = false;
    api
      .getEventTypes()
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
      const loaded = await api.getSlots({
        eventTypeId: eventType.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      return loaded.filter((slot) => Date.parse(slot.end) > Date.now());
    },
    [api],
  );

  useEffect(() => {
    if (!selectedEventType) return;
    let cancelled = false;
    fetchSlots(selectedEventType)
      .then((loaded) => {
        if (!cancelled) {
          setSlots(loaded);
        }
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

  useEffect(() => {
    let cancelled = false;
    api
      .getBookings()
      .then((loaded) => {
        if (!cancelled) setBookings(loaded);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const grouped = useMemo(() => groupSlotsByDate(slots), [slots]);

  const dayPills = useMemo(() => {
    if (step.name !== 'availability' || !selectedDay) return [];
    const dayStart = Date.parse(`${selectedDay}T00:00:00.000Z`);
    const dayEnd = dayStart + 86_400_000;
    const bookedStarts = new Set<string>();
    for (const b of bookings) {
      const bs = Date.parse(b.start);
      const be = Date.parse(b.end);
      if (bs < dayEnd && be > dayStart) bookedStarts.add(b.start);
    }
    const free = grouped[selectedDay] ?? [];
    const result = [...free];
    for (const b of bookings) {
      const bs = Date.parse(b.start);
      const be = Date.parse(b.end);
      if (bs < dayEnd && be > dayStart) {
        if (!free.some((f) => f.start === b.start)) {
          result.push({ start: b.start, end: b.end });
        }
      }
    }
    return result.sort((a, b) => a.start.localeCompare(b.start));
  }, [grouped, bookings, selectedDay, step.name]);

  const selectSlot = useCallback((slot: Slot) => {
    setSelectedSlot(slot);
    setSelectedDay(slot.start.slice(0, 10));
    setBooking(null);
    setBookingConfirmed(false);
    setNameError('');
    setEmailError('');
    setBookingError('');
  }, []);

  const continueFromSlot = useCallback(() => {
    if (!selectedSlot) return;
    const bookingToCreate: Booking = {
      id: 'b1',
      eventTypeId: selectedEventType?.id ?? '',
      start: selectedSlot.start,
      end: selectedSlot.end,
      guestName,
      guestEmail,
    };
    setBooking(bookingToCreate);
    setStep({ name: 'booking' });
    navigate('/confirm');
  }, [selectedSlot, selectedEventType, guestName, guestEmail, navigate]);

  const confirmBooking = useCallback(async () => {
    if (!selectedSlot) return;
    if (Date.parse(selectedSlot.end) <= Date.now()) {
      setBookingError('requested slot is not available');
      return;
    }
    setBookingError('');
    if (!guestName.trim()) {
      setNameError('Name is required');
      return;
    }
    if (!guestEmail.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(guestEmail.trim())) {
      setEmailError('Enter a valid email');
      return;
    }
    try {
      const created = await api.createBooking({
        eventTypeId: selectedEventType?.id ?? '',
        start: selectedSlot.start,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      });
      setBookings((prev) => [...prev, created]);
      setBookingConfirmed(true);
      setStep({ name: 'confirmed' });
      navigate('/confirmed');
    } catch {
      setBookingError('requested slot is not available');
    }
  }, [api, selectedSlot, selectedEventType, guestName, guestEmail, navigate]);

  const resetFlow = useCallback(() => {
    setSelectedEventType(null);
    setSelectedSlot(null);
    setSelectedDay(null);
    setBooking(null);
    setBookingConfirmed(false);
    setGuestName('');
    setGuestEmail('');
    setNameError('');
    setEmailError('');
    setBookingError('');
    setStep({ name: 'landing' });
  }, []);

  const selectEventType = useCallback(
    (eventType: EventType) => {
      setSelectedEventType(eventType);
      setStep({ name: 'availability' });
      navigate('/availability');
    },
    [navigate],
  );

  const selectDay = useCallback((day: string) => {
    setSelectedDay(day);
    setSelectedSlot(null);
    setBooking(null);
    setBookingConfirmed(false);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      api,
      eventTypes,
      loadingEventTypes,
      selectedEventType,
      slots,
      loadingSlots,
      selectedSlot,
      selectedDay,
      booking,
      bookingConfirmed,
      bookings,
      guestName,
      guestEmail,
      nameError,
      emailError,
      bookingError,
      step,
      navigate,
      setBooking,
      grouped,
      dayPills,
      setStep,
      setGuestName,
      setGuestEmail,
      selectEventType,
      selectDay,
      selectSlot,
      continueFromSlot,
      confirmBooking,
      resetFlow,
    }),
    [
      api,
      eventTypes,
      loadingEventTypes,
      selectedEventType,
      slots,
      loadingSlots,
      selectedSlot,
      selectedDay,
      booking,
      bookingConfirmed,
      bookings,
      guestName,
      guestEmail,
      nameError,
      emailError,
      bookingError,
      step,
      navigate,
      setBooking,
      grouped,
      dayPills,
      selectEventType,
      selectDay,
      selectSlot,
      continueFromSlot,
      confirmBooking,
      resetFlow,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBookingFlow(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingFlow must be used within BookingFlowProvider');
  }
  return context;
}
