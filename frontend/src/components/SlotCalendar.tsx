import type { Slot } from '../api/types';
import type { CalendarDay } from '../utils/buildCalendarDays';

type Props = {
  days: CalendarDay[];
  slotsByDate: Record<string, Slot[]>;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
};

const formatTime = (iso: string): string => iso.slice(11, 16);

export default function SlotCalendar({ days, slotsByDate, selectedSlot, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {days.map((day) => {
        const daySlots = slotsByDate[day.date] ?? [];
        return (
          <div
            key={day.date}
            data-testid="calendar-day"
            className={`border rounded p-2 min-h-24 ${
              day.isToday ? 'border-blue-400 bg-blue-50' : ''
            }`}
          >
            <div className="text-sm font-medium">
              {day.weekday}, {day.dayOfMonth} {day.month}
              {day.isToday && <span className="ml-1 text-xs text-blue-700">today</span>}
            </div>
            {daySlots.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1">No availability</p>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {daySlots.map((s) => {
                  const isSelected = selectedSlot?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelect(s)}
                      className={`px-2 py-1 border rounded text-sm ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : ''
                      }`}
                      data-testid="slot"
                      data-start={s.start}
                    >
                      {formatTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
