import BookingHeader from '../components/BookingHeader';
import BookingInfoBlocks from '../components/BookingInfoBlocks';
import SlotCalendar from '../components/SlotCalendar';
import { useBookingFlow } from '../context/BookingContext';

export default function AvailabilityPage() {
  const {
    step,
    selectedEventType,
    slots,
    loadingSlots,
    selectedSlot,
    selectedDay,
    bookings,
    grouped,
    dayPills,
    selectDay,
    selectSlot,
    continueFromSlot,
    setStep,
    navigate,
  } = useBookingFlow();

  if (step.name !== 'availability') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
          {selectedEventType && (
            <>
              <h1 className="text-3xl font-bold mb-6 tracking-tight text-gray-950">
                Запись на звонок
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Информация
                  </h2>
              <BookingInfoBlocks
                selectedEventType={selectedEventType}
                selectedSlot={selectedSlot}
                selectedDay={selectedDay}
                slots={slots}
              />
                </aside>
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-950">
                    Календарь
                  </h2>
                  <SlotCalendar
                    slotsByDate={grouped}
                    selectedDay={selectedDay}
                    onSelectDay={selectDay}
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
                                  ? 'Выбрано'
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
                        setStep({ name: 'event-types' });
                        navigate('/event-types');
                      }}
                      className="w-full border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-50 text-sm"
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={continueFromSlot}
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
        </div>
      </div>
    </div>
  );
}
