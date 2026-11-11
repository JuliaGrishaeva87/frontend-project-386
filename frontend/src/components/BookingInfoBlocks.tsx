import type { EventType, Slot } from '../api/types';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';

type BookingInfoBlocksProps = {
  selectedEventType: EventType | null;
  selectedSlot: Slot | null;
  selectedDay: string | null;
  slots: Slot[];
};

export default function BookingInfoBlocks({
  selectedEventType,
  selectedSlot,
  selectedDay,
  slots,
}: BookingInfoBlocksProps) {
  const grouped = groupSlotsByDate(slots);
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
}
