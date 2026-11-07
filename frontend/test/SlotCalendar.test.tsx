import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SlotCalendar from '../src/components/SlotCalendar';
import type { Slot } from '../src/api/types';

const ISO_NOW = '2026-11-05T12:00:00.000Z';

const buildSlot = (date: string, hour: number): Slot => ({
  start: `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`,
  end: `${date}T${String(hour).padStart(2, '0')}:30:00.000Z`,
});

const renderCalendar = (slotsByDate: Record<string, Slot[]>) => {
  render(<SlotCalendar slotsByDate={slotsByDate} selectedDay={null} />);
};

const getDayButtons = (): HTMLElement[] =>
  screen.getAllByTestId('calendar-day');

const getAvailableDays = (): HTMLElement[] =>
  getDayButtons().filter((el) => el.getAttribute('data-available') === 'true');

const getUnavailableDays = (): HTMLElement[] =>
  getDayButtons().filter((el) => el.getAttribute('data-available') === 'false');

describe('SlotCalendar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('disables days without free slots and colors their digits gray', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(ISO_NOW));
    renderCalendar({});

    const unavailable = getUnavailableDays();
    expect(unavailable.length).toBeGreaterThan(0);
    for (const day of unavailable) {
      expect(day).toBeDisabled();
      expect(day).toHaveClass('text-gray-300');
      expect(day).not.toHaveClass('text-gray-700');
    }
  });

  it('uses dark digits for days with free slots', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(ISO_NOW));
    renderCalendar({ '2026-11-06': [buildSlot('2026-11-06', 9)] });

    const available = getAvailableDays();
    expect(available).toHaveLength(1);
    expect(available[0]).toBeEnabled();
    expect(available[0]).toHaveClass('text-gray-700');
    expect(available[0]).not.toHaveClass('text-gray-300');
  });
});
