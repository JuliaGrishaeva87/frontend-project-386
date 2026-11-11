import BookingHeader from '../components/BookingHeader';
import { useBookingFlow } from '../context/BookingContext';

export default function EventSelectionPage() {
  const { eventTypes, loadingEventTypes, selectEventType, step } =
    useBookingFlow();

  if (step.name !== 'event-types') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_white_45%,_#ede9fe_100%)]">
      <BookingHeader />
      <div className="pt-20">
        <div className="max-w-[70rem] mx-auto p-4">
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
                  role="button"
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm cursor-pointer hover:border-gray-200"
                  onClick={() => selectEventType(et)}
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
              {loadingEventTypes && (
                <p className="text-sm text-gray-500 md:col-span-2">Загрузка…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
