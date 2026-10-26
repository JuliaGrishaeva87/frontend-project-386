import { describe, expect, it } from 'vitest';
import { findAvailabilityError } from '../src/utils/availabilityErrors';

describe('findAvailabilityError', () => {
  it('accepts a valid schedule', () => {
    expect(
      findAvailabilityError({ mon: [{ start: '09:00', end: '17:00' }], tue: [] }),
    ).toBeUndefined();
  });

  it('rejects a range whose start is not before its end', () => {
    expect(findAvailabilityError({ mon: [{ start: '17:00', end: '09:00' }] })).toBe(
      'Monday: start time must be before end time.',
    );
    expect(findAvailabilityError({ mon: [{ start: '09:00', end: '09:00' }] })).toBe(
      'Monday: start time must be before end time.',
    );
  });

  it('rejects overlapping ranges within a weekday', () => {
    expect(
      findAvailabilityError({
        wed: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '15:00' },
        ],
      }),
    ).toBe('Wednesday: time ranges must not overlap.');
  });

  it('accepts touching ranges', () => {
    expect(
      findAvailabilityError({
        thu: [
          { start: '09:00', end: '12:00' },
          { start: '12:00', end: '15:00' },
        ],
      }),
    ).toBeUndefined();
  });
});
