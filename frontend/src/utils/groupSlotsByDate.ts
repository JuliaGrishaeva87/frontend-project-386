import type { Slot } from '../api/types';

export function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const result: Record<string, Slot[]> = {};
  for (const s of slots) {
    const key = s.start.slice(0, 10);
    if (!result[key]) result[key] = [];
    result[key].push(s);
  }
  return result;
}
