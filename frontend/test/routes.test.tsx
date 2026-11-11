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
    expect(
      await screen.findByRole('heading', { name: 'Calendar' }),
    ).toBeInTheDocument();
  });

  it('renders upcoming meetings at /bookings', async () => {
    renderAt('/bookings');
    expect(
      await screen.findByRole('heading', { name: 'Предстоящие события' }),
    ).toBeInTheDocument();
  });

  it('redirects unknown paths to the booking page', async () => {
    renderAt('/nope');
    expect(
      await screen.findByRole('heading', { name: 'Calendar' }),
    ).toBeInTheDocument();
  });
});
