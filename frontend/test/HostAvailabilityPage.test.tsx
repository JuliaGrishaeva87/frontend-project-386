import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HostAvailabilityPage from '../src/pages/HostAvailabilityPage';
import type { WeeklyAvailability } from '../src/api/types';
import { buildFakeApi } from './helpers/fakeApi';

const createFakeApi = (initial: WeeklyAvailability) =>
  buildFakeApi({ getAvailability: vi.fn(async () => initial) });

describe('HostAvailabilityPage', () => {
  it('loads and shows saved ranges per weekday', async () => {
    render(
      <HostAvailabilityPage
        api={createFakeApi({ mon: [{ start: '09:00', end: '17:00' }] })}
      />,
    );
    expect(await screen.findByLabelText('mon start 0')).toHaveValue('09:00');
    expect(screen.getByLabelText('mon end 0')).toHaveValue('17:00');
  });

  it('marks weekdays without ranges as unavailable', async () => {
    render(<HostAvailabilityPage api={createFakeApi({})} />);
    expect((await screen.findAllByText('Unavailable')).length).toBe(7);
  });

  it('adds a range and saves the full availability', async () => {
    const api = createFakeApi({});
    render(<HostAvailabilityPage api={api} />);
    const user = userEvent.setup();
    const tuesday = (await screen.findAllByText('Add range'))[1];
    await user.click(tuesday);
    expect(screen.getByLabelText('tue start 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.putAvailability).toHaveBeenCalledWith({
      tue: [{ start: '09:00', end: '17:00' }],
    });
    expect(await screen.findByText(/availability saved/i)).toBeInTheDocument();
  });

  it('edits a range start and saves it', async () => {
    const api = createFakeApi({ mon: [{ start: '09:00', end: '17:00' }] });
    render(<HostAvailabilityPage api={api} />);
    const user = userEvent.setup();
    await screen.findByLabelText('mon start 0');
    await user.clear(screen.getByLabelText('mon start 0'));
    await user.type(screen.getByLabelText('mon start 0'), '10:00');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.putAvailability).toHaveBeenCalledWith({
      mon: [{ start: '10:00', end: '17:00' }],
    });
  });

  it('removes a range so the weekday becomes unavailable', async () => {
    const api = createFakeApi({ mon: [{ start: '09:00', end: '17:00' }] });
    render(<HostAvailabilityPage api={api} />);
    const user = userEvent.setup();
    await screen.findByLabelText('mon start 0');
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(screen.queryByLabelText('mon start 0')).not.toBeInTheDocument();
    expect(screen.getAllByText('Unavailable')).toHaveLength(7);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.putAvailability).toHaveBeenCalledWith({});
  });

  it('rejects a range that does not end after it starts', async () => {
    const api = createFakeApi({ mon: [{ start: '17:00', end: '09:00' }] });
    render(<HostAvailabilityPage api={api} />);
    const user = userEvent.setup();
    await screen.findByLabelText('mon start 0');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.putAvailability).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /start time must be before end time/i,
    );
  });

  it('rejects overlapping ranges within a weekday', async () => {
    const api = createFakeApi({
      mon: [
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '15:00' },
      ],
    });
    render(<HostAvailabilityPage api={api} />);
    const user = userEvent.setup();
    await screen.findByLabelText('mon start 1');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.putAvailability).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/must not overlap/i);
  });
});
