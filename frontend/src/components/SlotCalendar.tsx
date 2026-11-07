import type { Slot } from '../api/types';
import type { CalendarDay } from '../utils/buildCalendarDays';
import { buildCalendarDays } from '../utils/buildCalendarDays';
import { useMemo, useState } from 'react';

type Props = {
  slotsByDate: Record<string, Slot[]>;
  selectedDay: string | null;
  onSelectDay?: (date: string) => void;
};

type Cell = { day?: CalendarDay };

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export default function SlotCalendar({
  slotsByDate,
  selectedDay,
  onSelectDay,
}: Props) {
  const [displayed, setDisplayed] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const daysInMonth = new Date(
    Date.UTC(displayed.getUTCFullYear(), displayed.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const monthDays = useMemo(
    () => buildCalendarDays(displayed, daysInMonth),
    [displayed, daysInMonth],
  );
  const monthLabel = `${MONTH_NAMES[displayed.getUTCMonth()]} ${displayed.getUTCFullYear()}`;

  const goPrevMonth = () => {
    setDisplayed(
      (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)),
    );
  };
  const goNextMonth = () => {
    setDisplayed(
      (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
    );
  };

  const firstDate = monthDays[0];
  const firstDow = firstDate
    ? (new Date(firstDate.date).getUTCDay() + 6) % 7
    : 0;
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i += 1) {
    cells.push({ day: undefined });
  }
  for (const day of monthDays) {
    cells.push({ day });
  }

  const weeks: Cell[][] = [];
  let week: Cell[] = [];
  for (const cell of cells) {
    week.push(cell);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push(week);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-800">{monthLabel}</span>
        <div className="flex gap-1">
          <button
            type="button"
            className="border border-gray-200 rounded-full p-1.5"
            aria-label="previous month"
            onClick={goPrevMonth}
          >
            &lt;
          </button>
          <button
            type="button"
            className="border border-gray-200 rounded-full p-1.5"
            aria-label="next month"
            onClick={goNextMonth}
          >
            &gt;
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 my-4">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      {weeks.map((weekCells, index) => (
        <div key={index} className="grid grid-cols-7 gap-1 mb-4">
          {weekCells.map((cell, cellIndex) => {
            if (!cell.day) {
              return <div key={`empty-${index}-${cellIndex}`} />;
            }
            const day = cell.day;
            const daySlots = slotsByDate[day.date] ?? [];
            const hasSlots = daySlots.length > 0;
            const isSelected = selectedDay === day.date;
            return (
              <button
                type="button"
                key={day.date}
                data-testid="calendar-day"
                data-available={hasSlots ? 'true' : 'false'}
                data-start={daySlots[0]?.start ?? ''}
                disabled={!hasSlots}
                onClick={() => {
                  if (hasSlots) onSelectDay?.(day.date);
                }}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl border p-1 text-sm transition-all ${
                  isSelected
                    ? 'border-orange-400 bg-orange-50/70 text-orange-950 font-bold'
                    : hasSlots
                      ? 'border-gray-100 bg-gray-50/30 text-gray-700 font-medium'
                      : 'border-transparent bg-gray-100 text-gray-300 font-normal'
                }`}
              >
                <span className="text-sm">{day.dayOfMonth}</span>
                {hasSlots && (
                  <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                    {daySlots.length} св.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
