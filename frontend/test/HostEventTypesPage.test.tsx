import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HostEventTypesPage from '../src/pages/HostEventTypesPage';
import type { EventType } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const createFakeApi = (eventTypes: EventType[]) =>
  buildFakeApi({ getEventTypes: vi.fn(async () => eventTypes) });

const seededTypes: EventType[] = [
  {
    id: 'intro',
    name: 'Intro call',
    description: 'A short introduction to get to know each other.',
    durationMinutes: 15,
  },
  {
    id: 'consult',
    name: 'Consultation',
    description: 'A longer session to go through your questions in detail.',
    durationMinutes: 30,
  },
];

describe('HostEventTypesPage', () => {
  it('lists existing event types with their description and duration', async () => {
    render(<HostEventTypesPage api={createFakeApi(seededTypes)} />);
    expect(await screen.findByText('Intro call')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(
      screen.getByText('A short introduction to get to know each other.'),
    ).toBeInTheDocument();
  });

  it('suggests an id from the name and creates the event type', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^name/i), 'Demo Call');
    expect(screen.getByLabelText(/^id/i)).toHaveValue('demo-call');
    await user.type(screen.getByLabelText(/description/i), 'A demo call');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '45');
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(api.createEventType).toHaveBeenCalledWith({
      id: 'demo-call',
      name: 'Demo Call',
      description: 'A demo call',
      durationMinutes: 45,
    });
    expect(await screen.findByText('Demo Call')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('keeps a manually chosen id when the name changes', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^id/i), 'custom-id');
    await user.type(screen.getByLabelText(/^name/i), 'Demo Call');
    expect(screen.getByLabelText(/^id/i)).toHaveValue('custom-id');
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(api.createEventType).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'custom-id' }),
    );
  });

  it('requires a name before creating', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(api.createEventType).not.toHaveBeenCalled();
  });

  it('requires a valid id before creating', async () => {
    const api = createFakeApi([]);
    render(<HostEventTypesPage api={api} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^id/i), 'Not A Slug');
    await user.type(screen.getByLabelText(/^name/i), 'Demo');
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/id must be lowercase words separated by dashes/i)).toBeInTheDocument();
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
