import { describe, expect, it } from 'vitest';
import { buildCalendarDays } from '../src/utils/buildCalendarDays';

describe('buildCalendarDays', () => {
  it('builds the requested number of consecutive UTC days', () => {
    const days = buildCalendarDays(new Date('2025-10-15T09:00:00.000Z'), 14);
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe('2025-10-15');
    expect(days[13].date).toBe('2025-10-28');
  });

  it('starts from the current date, not the local one', () => {
    const days = buildCalendarDays(new Date('2025-10-15T23:30:00.000Z'), 3);
    expect(days[0].date).toBe('2025-10-15');
    expect(days[0].isToday).toBe(true);
  });

  it('labels weekdays and months in UTC', () => {
    const days = buildCalendarDays(new Date('2025-10-15T00:00:00.000Z'), 2);
    expect(days[0].weekday).toBe('Wed');
    expect(days[0].month).toBe('Oct');
    expect(days[0].dayOfMonth).toBe(15);
    expect(days[1].weekday).toBe('Thu');
  });

  it('marks only the first day as today', () => {
    const days = buildCalendarDays(new Date('2025-10-15T00:00:00.000Z'), 4);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
  });
});
