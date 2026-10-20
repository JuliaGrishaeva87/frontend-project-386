import React, { useEffect, useState } from 'react';
import { WEEKDAYS } from '../api/types';
import type { ApiClient, TimeRange, Weekday, WeeklyAvailability } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';

type Props = {
  api?: ApiClient;
};

export default function HostAvailabilityPage({ api = defaultApiClient }: Props) {
  const [availability, setAvailability] = useState<WeeklyAvailability>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getAvailability()
      .then(setAvailability)
      .catch(() => setError('Failed to load availability'));
  }, [api]);

  const rangesFor = (day: Weekday): TimeRange[] => availability[day] ?? [];

  const updateDay = (day: Weekday, ranges: TimeRange[]) => {
    setSaved(false);
    setAvailability((prev) => {
      const next = { ...prev };
      if (ranges.length === 0) delete next[day];
      else next[day] = ranges;
      return next;
    });
  };

  const addRange = (day: Weekday) =>
    updateDay(day, [...rangesFor(day), { start: '09:00', end: '17:00' }]);

  const removeRange = (day: Weekday, index: number) =>
    updateDay(
      day,
      rangesFor(day).filter((_, i) => i !== index),
    );

  const changeRange = (day: Weekday, index: number, patch: Partial<TimeRange>) =>
    updateDay(
      day,
      rangesFor(day).map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const next = await api.putAvailability(availability);
      setAvailability(next);
      setSaved(true);
    } catch {
      setError('Failed to save availability');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Availability</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSave} className="space-y-4" noValidate>
        {WEEKDAYS.map((day) => (
          <div key={day} className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold capitalize">{day}</span>
              <button
                type="button"
                onClick={() => addRange(day)}
                className="px-2 py-1 border rounded text-sm"
              >
                Add range
              </button>
            </div>
            {rangesFor(day).length === 0 && (
              <p className="text-sm text-gray-500">Unavailable</p>
            )}
            {rangesFor(day).map((range, index) => (
              <div key={index} className="flex items-center gap-2 mb-1">
                <input
                  type="time"
                  value={range.start}
                  onChange={(e) => changeRange(day, index, { start: e.target.value })}
                  className="border rounded px-2 py-1"
                  aria-label={`${day} start ${index}`}
                />
                <span>to</span>
                <input
                  type="time"
                  value={range.end}
                  onChange={(e) => changeRange(day, index, { end: e.target.value })}
                  className="border rounded px-2 py-1"
                  aria-label={`${day} end ${index}`}
                />
                <button
                  type="button"
                  onClick={() => removeRange(day, index)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="px-3 py-1 border rounded">
          Save
        </button>
        {saved && <p className="text-green-700">Availability saved</p>}
      </form>
    </div>
  );
}
