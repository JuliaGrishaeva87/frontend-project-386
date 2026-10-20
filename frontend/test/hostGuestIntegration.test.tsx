import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../src/routes';
import { mockApiClient } from '../src/api/client';
import type { WeeklyAvailability } from '../src/api/types';

const lateAfternoon: WeeklyAvailability = Object.fromEntries(
  ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => [
    day,
    [{ start: '15:00', end: '16:00' }],
  ]),
);

describe('host to guest integration', () => {
  it('availability saved by the Host shapes the slots the guest sees', async () => {
    await mockApiClient.putAvailability(lateAfternoon);
    render(
      <MemoryRouter initialEntries={['/host/availability']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Availability' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: /guest view/i }));
    expect(await screen.findByRole('heading', { name: 'Book a call' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /intro call/i }));
    const slotButtons = await screen.findAllByTestId('slot');
    expect(slotButtons.length).toBeGreaterThan(0);
    for (const button of slotButtons) {
      expect((button.textContent ?? '') >= '15:00').toBe(true);
    }
  });
});
