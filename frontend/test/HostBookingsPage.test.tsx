import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HostBookingsPage from '../src/pages/HostBookingsPage';
import type { Booking } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const iso = (daysFromNow: number, hour: number): string => {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
};

const bookings: Booking[] = [
  {
    id: 'b1',
    eventTypeId: 'intro',
    start: iso(1, 10),
    end: iso(1, 10).replace('T10', 'T10'),
    guestName: 'Alice',
    guestEmail: 'alice@example.com',
  },
  {
    id: 'b2',
    eventTypeId: 'consult',
    start: iso(2, 14),
    end: iso(2, 14),
    guestName: 'Bob',
    guestEmail: 'bob@example.com',
  },
];

describe('HostBookingsPage', () => {
  it('lists upcoming meetings with guest details', async () => {
    const api = buildFakeApi({
      getBookings: vi.fn(async () => bookings),
      getEventTypes: vi.fn(async () => [
        {
          id: 'intro',
          name: 'Intro call',
          description: 'Short',
          durationMinutes: 15,
        },
        {
          id: 'consult',
          name: 'Consultation',
          description: 'Long',
          durationMinutes: 30,
        },
      ]),
    });
    render(
      <MemoryRouter>
        <HostBookingsPage api={api} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect((await screen.findAllByText(/Слот:/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Создано:/)).length).toBeGreaterThan(0);
  });

  it('hides meetings that already happened', async () => {
    const api = buildFakeApi({
      getBookings: vi.fn(async () => [
        {
          id: 'past',
          eventTypeId: 'intro',
          start: iso(-2, 10),
          end: iso(-2, 10),
          guestName: 'Carol',
          guestEmail: 'carol@example.com',
        },
      ]),
    });
    render(
      <MemoryRouter>
        <HostBookingsPage api={api} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/no upcoming meetings/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/carol@example\.com/)).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing is booked', async () => {
    render(
      <MemoryRouter>
        <HostBookingsPage api={buildFakeApi()} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(/no upcoming meetings/i),
    ).toBeInTheDocument();
  });
});
