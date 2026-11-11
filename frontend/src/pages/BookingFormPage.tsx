import BookingHeader from '../components/BookingHeader';
import BookingInfoBlocks from '../components/BookingInfoBlocks';
import { useBookingFlow } from '../context/BookingContext';

export default function BookingFormPage() {
  const {
    booking,
    step,
    guestName,
    guestEmail,
    nameError,
    emailError,
    bookingError,
    selectedEventType,
    selectedSlot,
    selectedDay,
    slots,
    setGuestName,
    setGuestEmail,
    confirmBooking,
    setBooking,
    setStep,
    navigate,
  } = useBookingFlow();

  if (!booking) {
    return null;
  }

  if (step.name !== 'booking') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 tracking-tight text-gray-950">
            Запись на звонок
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
            <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-950">
                  Подтверждение записи
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setBooking(null);
                    setStep({ name: 'availability' });
                    navigate('/availability');
                  }}
                  className="border border-gray-200 text-gray-700 text-sm font-medium py-1.5 px-3 rounded-lg"
                >
                  Изменить
                </button>
              </div>
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void confirmBooking();
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
                    onChange={(event) => setGuestEmail(event.target.value)}
                    className="w-full border border-gray-200 bg-gray-50/30 rounded-xl px-4 py-3 text-sm mb-4"
                  />
                </div>
                {(nameError || emailError) && (
                  <div className="mb-4 text-sm text-red-600">
                    {nameError || emailError}
                  </div>
                )}
                {bookingError && (
                  <div className="mb-4 text-sm text-red-600">{bookingError}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  Подтвердить запись
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
