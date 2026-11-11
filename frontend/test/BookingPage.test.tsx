import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BookingFlowProvider } from '../src/context/BookingContext';
import LandingPage from '../src/pages/LandingPage';
import EventSelectionPage from '../src/pages/EventSelectionPage';
import AvailabilityPage from '../src/pages/AvailabilityPage';
import BookingFormPage from '../src/pages/BookingFormPage';
import BookingConfirmedPage from '../src/pages/BookingConfirmedPage';
import type { ApiClient } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const createFakeApi = (): ApiClient => buildFakeApi();

const renderBookingFlow = (api: ApiClient) =>
  render(
    <MemoryRouter>
      <BookingFlowProvider api={api}>
        <LandingPage />
        <EventSelectionPage />
        <AvailabilityPage />
        <BookingFormPage />
        <BookingConfirmedPage />
      </BookingFlowProvider>
    </MemoryRouter>,
  );

const goToEventTypeSelection = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getByRole('button', { name: /Записаться/ }));
};

const chooseFirstEventType = async (user: UserEvent): Promise<void> => {
  const card = await screen.findByText(/15 минут/);
  await user.click(card);
};

const chooseSlotAndContinue = async (
  user: UserEvent,
  slotIndex = 0,
  preferFree = false,
): Promise<HTMLElement[]> => {
  const days = await screen.findAllByTestId('calendar-day');
  const availableDays = days.filter(
    (el) => el.getAttribute('data-available') === 'true',
  );
  const daysToVisit = preferFree ? availableDays : [availableDays[0]];
  let slotBtns: HTMLElement[] = [];
  for (const day of daysToVisit) {
    await user.click(day as HTMLElement);
    const btns = await screen.findAllByTestId('slot');
    const free = btns.find((btn) => !(btn as HTMLButtonElement).disabled);
    if (preferFree ? !!free : true) {
      slotBtns = btns;
      break;
    }
  }
  const slotBtn =
    slotBtns.find((btn) => !(btn as HTMLButtonElement).disabled) ??
    slotBtns[slotIndex];
  await user.click(slotBtn);
  await user.click(screen.getByRole('button', { name: /Продолжить/ }));
  return slotBtns;
};

describe('BookingFlow', () => {
  it('renders the landing screen', async () => {
    renderBookingFlow(createFakeApi());
    expect(
      await screen.findByRole('heading', { name: 'Calendar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Что доступно прямо сейчас')).toBeInTheDocument();
  });

  it('selecting event type opens a calendar with free slots', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    expect(api.getSlots).toHaveBeenCalled();
    expect(
      await screen.findByRole('heading', { name: /Запись на звонок/ }),
    ).toBeInTheDocument();
    const days = await screen.findAllByTestId('calendar-day');
    const availableDay = days.find(
      (el) => el.getAttribute('data-available') === 'true',
    );
    expect(availableDay).toBeDefined();
    await user.click(availableDay as HTMLElement);
    expect(await screen.findAllByTestId('slot')).not.toHaveLength(0);
  });

  it('shows the description and duration of a booking type', async () => {
    renderBookingFlow(createFakeApi());
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    expect(await screen.findByText(/Короткий тип события/)).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('selecting a slot reveals the booking form', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    const slotBtns = await chooseSlotAndContinue(user);
    expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the clicked slot as selected', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    const slotBtns = await chooseSlotAndContinue(user);
    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes the booked slot from the list after a successful booking', async () => {
    renderBookingFlow(createFakeApi());
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Alice');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(await screen.findByText(/Бронь подтверждена/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Забронировать еще/ }));
    await chooseFirstEventType(user);
    const slotBtnsAfter = await chooseSlotAndContinue(user);
    expect(slotBtnsAfter[0]).toBeDisabled();
  });

  it('submitting valid data books and shows confirmation', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    const slotBtns = await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Alice');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(api.createBooking).toHaveBeenCalled();
    expect(await screen.findByText(/Бронь подтверждена/)).toBeInTheDocument();
    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows validation errors on empty name', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    const slotBtns = await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Email'), 'bob@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(api.createBooking).not.toHaveBeenCalled();
    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows validation errors on invalid email', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Bob');
    await user.type(screen.getByPlaceholderText('Email'), 'not-an-email');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it('shows message when no slots available', async () => {
    const api = createFakeApi();
    vi.mocked(api.getSlots).mockResolvedValueOnce([]);
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    expect(await screen.findByText('No availability')).toBeInTheDocument();
  });

  it('shows the error when the booking fails', async () => {
    const api = buildFakeApi({
      createBooking: vi.fn(async () => {
        throw new Error('requested slot is not available');
      }),
    });
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    const slotBtns = await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Alice');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(
      await screen.findByText(/requested slot is not available/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Бронь подтверждена/)).not.toBeInTheDocument();
    expect(slotBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears the booking error when another slot is picked', async () => {
    const api = buildFakeApi({
      createBooking: vi.fn(async () => {
        throw new Error('requested slot is not available');
      }),
    });
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Alice');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(
      await screen.findByText(/requested slot is not available/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Изменить/ }));
    const slotBtnsAfter = await screen.findAllByTestId('slot');
    await user.click(slotBtnsAfter[1] ?? slotBtnsAfter[0]);
    expect(
      screen.queryByText(/requested slot is not available/),
    ).not.toBeInTheDocument();
  });

  it('allows booking again after a confirmation', async () => {
    const api = createFakeApi();
    renderBookingFlow(api);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Calendar' });
    await goToEventTypeSelection(user);
    await chooseFirstEventType(user);
    await chooseSlotAndContinue(user);
    await user.type(screen.getByPlaceholderText('Имя'), 'Alice');
    await user.type(screen.getByPlaceholderText('Email'), 'alice@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(await screen.findByText(/Бронь подтверждена/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Забронировать еще/ }));
    await chooseFirstEventType(user);
    const slotBtnsAgain = await chooseSlotAndContinue(user, 0, true);
    await user.type(screen.getByPlaceholderText('Имя'), 'Bob');
    await user.type(screen.getByPlaceholderText('Email'), 'bob@example.com');
    await user.click(
      screen.getByRole('button', { name: /Подтвердить запись/ }),
    );
    expect(api.createBooking).toHaveBeenCalledTimes(2);
    const selectedSlotBtn = slotBtnsAgain.find(
      (btn) => btn.getAttribute('aria-pressed') === 'true',
    );
    expect(selectedSlotBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
