import { describe, expect, it } from 'vitest';
import { groupSlotsByDate } from '../src/utils/groupSlotsByDate';
import type { Slot } from '../src/api/types';

describe('groupSlotsByDate', () => {
  it('groups slots by calendar date (YYYY-MM-DD)', () => {
    const slots: Slot[] = [
      { start: '2025-10-15T09:00:00.000Z', end: '2025-10-15T09:30:00.000Z' },
      { start: '2025-10-15T10:00:00.000Z', end: '2025-10-15T10:30:00.000Z' },
      { start: '2025-10-16T09:00:00.000Z', end: '2025-10-16T09:30:00.000Z' },
    ];
    const grouped = groupSlotsByDate(slots);
    const keys = Object.keys(grouped).sort();
    expect(keys).toEqual(['2025-10-15', '2025-10-16']);
    expect(grouped['2025-10-15']).toHaveLength(2);
    expect(grouped['2025-10-16']).toHaveLength(1);
  });

  it('returns empty object for empty input', () => {
    expect(groupSlotsByDate([])).toEqual({});
  });

  it('preserves order within date', () => {
    const slots: Slot[] = [
      { start: '2025-10-15T10:00:00.000Z', end: '2025-10-15T10:30:00.000Z' },
      { start: '2025-10-15T09:00:00.000Z', end: '2025-10-15T09:30:00.000Z' },
    ];
    const grouped = groupSlotsByDate(slots);
    expect(grouped['2025-10-15'][0].start).toBe('2025-10-15T10:00:00.000Z');
    expect(grouped['2025-10-15'][1].start).toBe('2025-10-15T09:00:00.000Z');
  });
});
