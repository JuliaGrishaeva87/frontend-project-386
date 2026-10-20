import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import BookingPage from '../src/pages/BookingPage';
import type { ApiClient } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const createFakeApi = (): ApiClient => buildFakeApi();

const openFirstSlot = async (
  api: ApiClient,
  user: UserEvent,
): Promise<HTMLElement> => {
  render(<BookingPage api={api} />);
  await screen.findByText('Intro call');
  await user.click(screen.getByRole('button', { name: /intro call/i }));
  const slotBtns = await screen.findAllByTestId('slot');
  await user.click(slotBtns[0]);
  return slotBtns[0];
};

describe('BookingPage', () => {
  it('shows event types on load', async () => {
    render(<BookingPage api={createFakeApi()} />);
    expect(await screen.findByText('Intro call')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
  });

  it('selecting event type loads and shows slots grouped by date', async () => {
    const api = createFakeApi();
    render(<BookingPage api={api} />);
    const user = userEvent.setup();
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    expect(api.getSlots).toHaveBeenCalled();
    expect(await screen.findByText('2025-10-15')).toBeInTheDocument();
    expect(screen.getByText('2025-10-16')).toBeInTheDocument();
    const slotBtns = screen.getAllByTestId('slot');
    expect(slotBtns.length).toBeGreaterThan(0);
  });

  it('selecting a slot reveals the booking form', async () => {
    await openFirstSlot(createFakeApi(), userEvent.setup());
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('submitting valid data books and shows confirmation', async () => {
    const api = createFakeApi();
    const user = userEvent.setup();
    await openFirstSlot(api, user);
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(api.createBooking).toHaveBeenCalled();
    expect(await screen.findByText(/confirmed/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty name', async () => {
    const api = createFakeApi();
    const user = userEvent.setup();
    await openFirstSlot(api, user);
    await user.type(screen.getByLabelText(/email/i), 'bob@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it('shows validation errors on invalid email', async () => {
    const api = createFakeApi();
    const user = userEvent.setup();
    await openFirstSlot(api, user);
    await user.type(screen.getByLabelText(/name/i), 'Bob');
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it('shows message when no slots available', async () => {
    const api = createFakeApi();
    vi.mocked(api.getSlots).mockResolvedValueOnce([]);
    render(<BookingPage api={api} />);
    const user = userEvent.setup();
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    expect(await screen.findByText(/no available slots/i)).toBeInTheDocument();
  });

  it('allows booking again after a confirmation', async () => {
    const api = createFakeApi();
    const user = userEvent.setup();
    await openFirstSlot(api, user);
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(await screen.findByText(/confirmed/i)).toBeInTheDocument();

    await user.click(screen.getAllByTestId('slot')[1]);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/name/i), 'Bob');
    await user.type(screen.getByLabelText(/email/i), 'bob@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(api.createBooking).toHaveBeenCalledTimes(2);
  });
});
