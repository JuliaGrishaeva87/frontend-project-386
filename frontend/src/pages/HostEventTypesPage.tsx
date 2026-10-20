import React, { useEffect, useState } from 'react';
import type { ApiClient, EventType } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';

type Props = {
  api?: ApiClient;
};

export default function HostEventTypesPage({ api = defaultApiClient }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .getEventTypes()
      .then(setEventTypes)
      .catch(() => setError('Failed to load event types'));
  }, [api]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (duration <= 0) {
      setError('Duration must be positive');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createEventType({
        name: name.trim(),
        durationMinutes: duration,
      });
      setEventTypes((prev) => [...prev, created]);
      setName('');
      setDuration(30);
    } catch {
      setError('Failed to create event type');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Event types</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <ul className="mb-4 space-y-1">
        {eventTypes.map((et) => (
          <li key={et.id} className="border rounded px-3 py-2 flex justify-between">
            <span>{et.name}</span>
            <span className="text-sm text-gray-600">{et.durationMinutes} min</span>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="space-y-2 border rounded p-3" noValidate>
        <div>
          <label htmlFor="et-name" className="block text-sm mb-1">
            Name
          </label>
          <input
            id="et-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="et-duration" className="block text-sm mb-1">
            Duration (minutes)
          </label>
          <input
            id="et-duration"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <button type="submit" disabled={creating} className="px-3 py-1 border rounded">
          Create
        </button>
      </form>
    </div>
  );
}
