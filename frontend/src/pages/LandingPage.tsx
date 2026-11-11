import BookingHeader from '../components/BookingHeader';
import { useBookingFlow } from '../context/BookingContext';

export default function LandingPage() {
  const { loadingEventTypes, setStep, step, navigate } = useBookingFlow();

  if (step.name !== 'landing') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
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
                  onClick={() => {
                    setStep({ name: 'event-types' });
                    navigate('/event-types');
                  }}
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
        </div>
      </div>
    </div>
  );
}
