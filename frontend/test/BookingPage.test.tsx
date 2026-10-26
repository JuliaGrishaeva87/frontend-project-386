import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import BookingPage from '../src/pages/BookingPage';
import type { ApiClient } from '../src/api/types';
import { buildFakeApi, buildSlots } from './helpers/fakeApi';

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

  it('selecting event type opens a 14-day calendar with free slots', async () => {
    const api = createFakeApi();
    render(<BookingPage api={api} />);
    const user = userEvent.setup();
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    expect(api.getSlots).toHaveBeenCalled();
    expect(await screen.findAllByTestId('calendar-day')).toHaveLength(14);
    const slotBtns = screen.getAllByTestId('slot');
    expect(slotBtns.length).toBe(3);
    expect(slotBtns[0]).toHaveAttribute(
      'data-start',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/),
    );
  });

  it('shows the description and duration of a booking type', async () => {
    render(<BookingPage api={createFakeApi()} />);
    expect(await screen.findByText('A short introduction to get to know each other.')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('selecting a slot reveals the booking form', async () => {
    await openFirstSlot(createFakeApi(), userEvent.setup());
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('marks the clicked slot as selected', async () => {
    const api = createFakeApi();
    const user = userEvent.setup();
    render(<BookingPage api={api} />);
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    const slotBtns = await screen.findAllByTestId('slot');

    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'false');

    await user.click(slotBtns[0]);

    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
    expect(slotBtns[1]).toHaveAttribute('aria-pressed', 'false');

    await user.click(slotBtns[1]);

    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'false');
    expect(slotBtns[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes the booked slot from the list after a successful booking', async () => {
    const api = createFakeApi();
    let call = 0;
    // The second getSlots call reflects that the slot is now taken.
    vi.mocked(api.getSlots).mockImplementation(async ({ from }) => {
      call += 1;
      const slots = buildSlots(from);
      return call === 1 ? slots : slots.slice(1);
    });
    const user = userEvent.setup();
    render(<BookingPage api={api} />);
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    const slotBtns = await screen.findAllByTestId('slot');
    expect(slotBtns.length).toBe(3);

    await user.click(slotBtns[0]);
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(await screen.findByText(/confirmed/i)).toBeInTheDocument();

    await waitFor(() => expect(api.getSlots).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getAllByTestId('slot').length).toBe(2));
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

  it('shows a message when there are no booking types', async () => {
    const api = buildFakeApi({ getEventTypes: vi.fn(async () => []) });
    render(<BookingPage api={api} />);
    expect(await screen.findByText(/no booking types available/i)).toBeInTheDocument();
  });

  it('shows the error when the booking fails', async () => {
    const api = buildFakeApi({
      createBooking: vi.fn(async () => {
        throw new Error('requested slot is not available');
      }),
    });
    const user = userEvent.setup();
    render(<BookingPage api={api} />);
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    const slotBtns = await screen.findAllByTestId('slot');
    await user.click(slotBtns[0]);
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));

    expect(await screen.findByText(/requested slot is not available/i)).toBeInTheDocument();
    expect(screen.queryByText(/confirmed/i)).not.toBeInTheDocument();
  });

  it('clears the booking error when another slot is picked', async () => {
    const api = buildFakeApi({
      createBooking: vi.fn(async () => {
        throw new Error('requested slot is not available');
      }),
    });
    const user = userEvent.setup();
    render(<BookingPage api={api} />);
    await screen.findByText('Intro call');
    await user.click(screen.getByRole('button', { name: /intro call/i }));
    const slotBtns = await screen.findAllByTestId('slot');
    await user.click(slotBtns[0]);
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /book/i }));
    expect(await screen.findByText(/requested slot is not available/i)).toBeInTheDocument();

    await user.click(slotBtns[1]);
    expect(screen.queryByText(/requested slot is not available/i)).not.toBeInTheDocument();
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
