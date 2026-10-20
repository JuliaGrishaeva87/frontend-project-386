import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HostEventTypesPage from '../src/pages/HostEventTypesPage';
import type { EventType } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const createFakeApi = (eventTypes: EventType[]) =>
  buildFakeApi({ getEventTypes: vi.fn(async () => eventTypes) });

describe('HostEventTypesPage', () => {
  it('lists existing event types', async () => {
    render(
      <HostEventTypesPage
        api={createFakeApi([
          { id: 'intro', name: 'Intro call', durationMinutes: 15 },
          { id: 'consult', name: 'Consultation', durationMinutes: 30 },
        ])}
      />,
    );
    expect(await screen.findByText('Intro call')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('creates a new event type and appends it', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^name/i), 'Demo');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '45');
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(api.createEventType).toHaveBeenCalledWith({
      name: 'Demo',
      durationMinutes: 45,
    });
    expect(await screen.findByText('Demo')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('requires a name before creating', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(api.createEventType).not.toHaveBeenCalled();
  });

  it('requires a positive duration before creating', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^name/i), 'Demo');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '0');
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/duration must be positive/i)).toBeInTheDocument();
    expect(api.createEventType).not.toHaveBeenCalled();
  });
});
