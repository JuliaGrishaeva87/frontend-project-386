import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../src/routes';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('routes', () => {
  it('renders the guest booking page at /', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Book a call' })).toBeInTheDocument();
  });

  it('redirects /host to /host/availability', async () => {
    renderAt('/host');
    expect(await screen.findByRole('heading', { name: 'Availability' })).toBeInTheDocument();
  });

  it('renders the availability editor at /host/availability', async () => {
    renderAt('/host/availability');
    expect(await screen.findByRole('heading', { name: 'Availability' })).toBeInTheDocument();
  });

  it('renders event types at /host/event-types', async () => {
    renderAt('/host/event-types');
    expect(await screen.findByRole('heading', { name: 'Event types' })).toBeInTheDocument();
  });

  it('renders upcoming meetings at /host/bookings', async () => {
    renderAt('/host/bookings');
    expect(await screen.findByRole('heading', { name: 'Upcoming meetings' })).toBeInTheDocument();
  });

  it('redirects unknown paths to the booking page', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('heading', { name: 'Book a call' })).toBeInTheDocument();
  });
});
