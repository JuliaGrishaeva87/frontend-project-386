import BookingHeader from '../components/BookingHeader';
import BookingInfoBlocks from '../components/BookingInfoBlocks';
import { useBookingFlow } from '../context/BookingContext';

export default function BookingConfirmedPage() {
  const { booking, step, resetFlow, setStep, navigate } = useBookingFlow();

  if (!booking) {
    return null;
  }

  if (step.name !== 'confirmed') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-950">
                Информация
              </h2>
              <BookingInfoBlocks
                selectedEventType={null}
                selectedSlot={null}
                selectedDay={null}
                slots={[]}
              />
            </aside>
            <section className="bg-gray-50 border border-gray-100 rounded-2xl shadow-sm p-6 md:col-span-2">
              <div className="flex items-center justify-center mb-4">
                <h2 className="text-xl font-bold text-gray-950">
                  Бронь подтверждена. До встречи!
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetFlow();
                  setStep({ name: 'event-types' });
                  navigate('/event-types');
                }}
                className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                Забронировать еще
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
