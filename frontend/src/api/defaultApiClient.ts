import type { ApiClient } from './types';
import { mockApiClient } from './client';
import { createHttpApiClient } from './httpApiClient';

// In production the SPA talks to the real backend over `/api` (same origin — ADR-0005).
// In development and tests we fall back to the in-memory mock so the UI works standalone.
export const defaultApiClient: ApiClient = import.meta.env.PROD
  ? createHttpApiClient()
  : mockApiClient;
