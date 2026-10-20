import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryRepository } from '../src/repository.js';

describe('static frontend serving (ADR-0005)', () => {
  let app: FastifyInstance;
  let staticRoot: string;

  beforeEach(() => {
    staticRoot = mkdtempSync(join(tmpdir(), 'spa-'));
    writeFileSync(
      join(staticRoot, 'index.html'),
      '<!doctype html><title>Call Calendar</title>',
    );
    app = buildApp({ repo: new InMemoryRepository(), staticRoot });
  });

  afterEach(async () => {
    await app.close();
    rmSync(staticRoot, { recursive: true, force: true });
  });

  it('serves index.html at /', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('Call Calendar');
  });

  it('falls back to index.html for a client-side deep link', async () => {
    const res = await app.inject({ method: 'GET', url: '/host/availability' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Call Calendar');
  });

  it('does not let the SPA fallback shadow unknown /api routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });

  it('still serves the API when the static root exists', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/event-types' });
    expect(res.statusCode).toBe(200);
  });
});
