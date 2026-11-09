import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiClient, Booking, EventType, Slot } from '../api/types';
import { Link } from 'react-router-dom';
import { defaultApiClient } from '../api/defaultApiClient';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';
import SlotCalendar from '../components/SlotCalendar';

type Props = {
  api?: ApiClient;
};

const BOOKING_WINDOW_DAYS = 14;

export default function BookingPage({ api = defaultApiClient }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null,
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);
  const [eventTypeSelection, setEventTypeSelection] = useState(false);

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
        if (!cancelled) {
          setSlots(loaded.filter((slot) => Date.parse(slot.end) > Date.now()));
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
    if (!selectedDay) return [];
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
  }, [grouped, bookings, selectedDay]);

  const selectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setSelectedDay(slot.start.slice(0, 10));
    setBooking(null);
    setBookingConfirmed(false);
    setNameError('');
    setEmailError('');
    setBookingError('');
  };

  const infoBlocks = () => {
    const daySlots = selectedDay ? (grouped[selectedDay] ?? []) : [];
    const freeCount = daySlots.length;
    const duration = selectedEventType?.durationMinutes;
    const weekdayNames = [
      'воскресенье',
      'понедельник',
      'вторник',
      'среда',
      'четверг',
      'пятница',
      'суббота',
    ];
    const monthNames = [
      'январь',
      'февраль',
      'март',
      'апрель',
      'май',
      'июнь',
      'июль',
      'август',
      'сентябрь',
      'октябрь',
      'ноябрь',
      'декабрь',
    ];

    if (!selectedDay) {
      return (
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium mb-1">
              Выбранная дата
            </p>
            <p className="text-sm font-semibold text-gray-600">
              Дата не выбрана
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium mb-1">
              Выбранное время
            </p>
            <p className="text-sm font-semibold text-gray-600">
              Время не выбрано
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium mb-1">Свободно</p>
            <p className="text-sm font-semibold text-gray-600">0</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium mb-1">
              Длительности в дне
            </p>
            <p className="text-sm font-semibold text-gray-600">
              Нет слотов на этот день
            </p>
          </div>
        </div>
      );
    }

    const dayDate = new Date(`${selectedDay}T00:00:00.000Z`);
    const weekday = weekdayNames[dayDate.getUTCDay()];
    const month = monthNames[dayDate.getUTCMonth()];
    const timeRange = selectedSlot
      ? `${selectedSlot.start.slice(11, 16)} - ${selectedSlot.end.slice(11, 16)}`
      : null;

    return (
      <div className="space-y-2">
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium mb-1">
            Выбранная дата
          </p>
          <p className="text-sm font-semibold text-gray-600">{`${weekday}, ${dayDate.getUTCDate()} ${month}`}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium mb-1">
            Выбранное время
          </p>
          <p className="text-sm font-semibold text-gray-600">
            {timeRange ?? 'Время не выбрано'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium mb-1">Свободно</p>
          <p className="text-sm font-semibold text-gray-600">{freeCount}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium mb-1">
            Длительности в дне
          </p>
          <p className="text-sm font-semibold text-gray-600">
            {duration ? `${duration} мин` : '—'}
          </p>
        </div>
      </div>
    );
  };

  const handleSelectDay = (date: string) => {
    setSelectedDay(date);
    setSelectedSlot(null);
    setBooking(null);
    setBookingConfirmed(false);
  };

  const handleOpenEventTypeSelection = () => {
    setEventTypeSelection(true);
  };

  const handleSelectEventType = (et: EventType) => {
    setEventTypeSelection(false);
    setSelectedEventType(et);
  };

  const handleContinue = () => {
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
  };

  const handleConfirm = async () => {
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
    } catch {
      setBookingError('requested slot is not available');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
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

      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
          {eventTypeSelection &&
            !selectedEventType &&
            !selectedSlot &&
            !booking && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 mb-6">
                  <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 mb-2">
                    Выберите тип события
                  </h2>
                  <p className="text-base text-gray-500">
                    Нажмите на карточку, чтобы открыть календарь и выбрать
                    удобный слот.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventTypes.map((et) => (
                    <div
                      key={et.id}
                      className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm cursor-pointer hover:border-gray-200"
                      onClick={() => handleSelectEventType(et)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-950">
                          {et.durationMinutes === 15
                            ? 'Встреча 15 минут'
                            : 'Встреча 30 минут'}
                        </h3>
                        <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
                          {et.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {et.durationMinutes === 15
                          ? 'Короткий тип события для быстрого слота.'
                          : 'Базовый тип события для бронирования.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {!selectedEventType &&
            !selectedSlot &&
            !booking &&
            !eventTypeSelection && (
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div>
                  <span className="inline-block text-xs font-semibold text-gray-500 bg-white px-2 py-1 uppercase rounded">
                    БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
                  </span>
                  <h1 className="text-5xl font-extrabold tracking-tight text-black">
                    Calendar
                  </h1>
                  <p className="mt-3 text-gray-500">
                    Один экран, понятные слоты, быстрая бронь. Выберите время и
                    запишитесь на звонок без лишних шагов.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="bg-[#ff6b00] rounded-lg px-5 py-3 text-white font-semibold transition-colors duration-200 hover:bg-[#e05a00]"
                      onClick={handleOpenEventTypeSelection}
                    >
                      Записаться →
                    </button>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl bg-white shadow-sm p-6 w-full">
                  <h2 className="text-xl font-bold text-black">
                    Что доступно прямо сейчас
                  </h2>
                  {loadingEventTypes && (
                    <p className="mt-2 text-sm text-gray-500">Загрузка…</p>
                  )}
                  <ul className="mt-3 list-disc list-inside text-gray-500 space-y-1">
                    <li>Фиксированные 30-минутные слоты с 09:00 до 18:00.</li>
                    <li>Проверка конфликта при бронировании.</li>
                    <li>Просмотр предстоящих событий в отдельном разделе.</li>
                  </ul>
                </div>
              </div>
            )}

          {selectedEventType && !booking && (
            <>
              <h1 className="text-3xl font-bold mb-6 tracking-tight text-gray-950">
                Запись на звонок
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Информация
                  </h2>
                  {infoBlocks()}
                </aside>
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Календарь
                  </h2>
                  <SlotCalendar
                    slotsByDate={grouped}
                    selectedDay={selectedDay}
                    onSelectDay={handleSelectDay}
                  />
                </section>
                <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Статус слотов
                  </h2>
                  {loadingSlots ? (
                    <p className="text-sm text-gray-500">Загрузка…</p>
                  ) : !selectedDay ? (
                    slots.length === 0 ? (
                      <p className="text-sm text-gray-500">No availability</p>
                    ) : (
                      <div className="bg-blue-50/50 text-blue-600 rounded-xl p-3 text-center text-sm font-medium border border-blue-100/50">
                        Выберите дату в календаре.
                      </div>
                    )
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {dayPills.map((slot) => {
                        const isSelected = selectedSlot?.start === slot.start;
                        const isBooked = bookings.some(
                          (b) => b.start === slot.start,
                        );
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            data-testid="slot"
                            data-start={slot.start}
                            aria-pressed={isSelected}
                            disabled={isBooked}
                            onClick={() => {
                              if (!isBooked) selectSlot(slot);
                            }}
                            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                              isBooked
                                ? 'border-transparent bg-gray-100 text-gray-300 font-normal'
                                : isSelected
                                  ? 'bg-orange-50/60 border-[#ff6b00]'
                                  : 'border-gray-100 bg-gray-50/30'
                            }`}
                          >
                            <span>{`${slot.start.slice(11, 16)} - ${slot.end.slice(11, 16)}`}</span>
                            <span className="text-gray-400">
                              {isBooked
                                ? 'Занято'
                                : isSelected
                                  ? 'Выбранно'
                                  : 'Свободно'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-3 mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventType(null);
                      }}
                      className="w-full border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-50 text-sm"
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={handleContinue}
                      className={`w-full font-semibold py-2.5 px-4 rounded-xl text-sm ${
                        selectedSlot
                          ? 'bg-[#ff6b00] text-white opacity-100 cursor-pointer hover:bg-[#e65c00]'
                          : 'bg-orange-300 text-white opacity-60 cursor-not-allowed'
                      }`}
                    >
                      Продолжить
                    </button>
                  </div>
                </aside>
              </div>
            </>
          )}

          {selectedEventType && booking && (
            <>
              <h1 className="text-3xl font-bold mb-6 tracking-tight text-gray-950">
                Запись на звонок
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:col-span-1">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Информация
                  </h2>
                  {infoBlocks()}
                </aside>
                {bookingConfirmed ? (
                  <section className="bg-gray-50 border border-gray-100 rounded-2xl shadow-sm p-6 md:col-span-2">
                    <div className="flex items-center justify-center mb-4">
                      <h2 className="text-xl font-bold text-gray-950">
                        Бронь подтверждена. До встречи!
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBooking(null);
                        setSelectedEventType(null);
                        setSelectedSlot(null);
                        setSelectedDay(null);
                        setEventTypeSelection(true);
                        if (selectedEventType) {
                          void fetchSlots(selectedEventType).then((loaded) =>
                            setSlots(loaded),
                          );
                        }
                      }}
                      className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                      Забронировать еще
                    </button>
                  </section>
                ) : (
                  <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-950">
                        Подтверждение записи
                      </h2>
                      <button
                        type="button"
                        onClick={() => setBooking(null)}
                        className="border border-gray-200 text-gray-700 text-sm font-medium py-1.5 px-3 rounded-lg"
                      >
                        Изменить
                      </button>
                    </div>
                    <form
                      noValidate
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleConfirm();
                      }}
                    >
                      <div>
                        <label
                          htmlFor="guestName"
                          className="block text-sm font-medium text-gray-600 mb-1"
                        />
                        <input
                          id="guestName"
                          name="guestName"
                          type="text"
                          placeholder="Имя"
                          value={guestName}
                          onChange={(event) => setGuestName(event.target.value)}
                          className="w-full border border-gray-200 bg-gray-50/30 rounded-xl px-4 py-3 text-sm mb-4"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="guestEmail"
                          className="block text-sm font-medium text-gray-600 mb-1"
                        />
                        <input
                          id="guestEmail"
                          name="guestEmail"
                          type="email"
                          placeholder="Email"
                          value={guestEmail}
                          onChange={(event) =>
                            setGuestEmail(event.target.value)
                          }
                          className="w-full border border-gray-200 bg-gray-50/30 rounded-xl px-4 py-3 text-sm mb-4"
                        />
                      </div>
                      {(nameError || emailError) && (
                        <div className="mb-4 text-sm text-red-600">
                          {nameError || emailError}
                        </div>
                      )}
                      {bookingError && (
                        <div className="mb-4 text-sm text-red-600">
                          {bookingError}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl text-sm transition-colors"
                      >
                        Подтвердить запись
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
