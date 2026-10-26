import React, { useEffect, useState } from 'react';
import type { ApiClient, EventType } from '../api/types';
import { defaultApiClient } from '../api/defaultApiClient';
import { isValidSlug, toSlug } from '../utils/toSlug';

type Props = {
  api?: ApiClient;
};

export default function HostEventTypesPage({ api = defaultApiClient }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [idEdited, setIdEdited] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .getEventTypes()
      .then(setEventTypes)
      .catch(() => setError('Failed to load event types'));
  }, [api]);

  const handleNameChange = (value: string) => {
    setName(value);
    // The id is suggested from the name until the owner edits it by hand.
    if (!idEdited) setId(toSlug(value));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!id.trim()) {
      setError('Id is required');
      return;
    }
    if (!isValidSlug(id.trim())) {
      setError('Id must be lowercase words separated by dashes');
      return;
    }
    if (duration <= 0) {
      setError('Duration must be positive');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createEventType({
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        durationMinutes: duration,
      });
      setEventTypes((prev) => [...prev, created]);
      setId('');
      setName('');
      setDescription('');
      setDuration(30);
      setIdEdited(false);
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
      <ul className="mb-4 space-y-2">
        {eventTypes.map((et) => (
          <li key={et.id} className="border rounded px-3 py-2">
            <div className="flex justify-between">
              <span className="font-medium">{et.name}</span>
              <span className="text-sm text-gray-600">{et.durationMinutes} min</span>
            </div>
            {et.description && <p className="text-sm text-gray-600 mt-1">{et.description}</p>}
            <p className="text-xs text-gray-500 mt-1">id: {et.id}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="space-y-2 border rounded p-3" noValidate>
        <div>
          <label htmlFor="et-id" className="block text-sm mb-1">
            Id
          </label>
          <input
            id="et-id"
            type="text"
            value={id}
            onChange={(e) => {
              setIdEdited(true);
              setId(e.target.value);
            }}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="et-name" className="block text-sm mb-1">
            Name
          </label>
          <input
            id="et-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="et-description" className="block text-sm mb-1">
            Description
          </label>
          <textarea
            id="et-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={3}
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
