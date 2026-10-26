import type { WeeklyAvailability } from '../api/types';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function findAvailabilityError(availability: WeeklyAvailability): string | undefined {
  for (const [day, ranges] of Object.entries(availability)) {
    const label = DAY_LABELS[day] ?? day;
    for (const range of ranges ?? []) {
      if (range.start >= range.end) {
        return `${label}: start time must be before end time.`;
      }
    }
    const sorted = [...(ranges ?? [])].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        return `${label}: time ranges must not overlap.`;
      }
    }
  }
  return undefined;
}
