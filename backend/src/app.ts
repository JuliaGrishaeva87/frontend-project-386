import Fastify, { type FastifyInstance } from 'fastify';
import { InMemoryRepository, type Repository } from './repository.js';
import { deriveSlots } from './slots.js';
import { WEEKDAYS } from './types.js';
import type { TimeRange, Weekday, WeeklyAvailability } from './types.js';

type BuildAppOptions = {
  repo?: Repository;
  now?: () => number;
};

const HHMM = /^\d{2}:\d{2}$/;
const EMAIL = /.+@.+\..+/;
const DAY_MS = 86_400_000;
const DEFAULT_HORIZON_MS = 14 * DAY_MS;

const error = (code: string, message: string) => ({ error: { code, message } });

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isHhMm = (value: unknown): value is string => typeof value === 'string' && HHMM.test(value);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isValidEmail = (value: string): boolean => EMAIL.test(value);

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const repo = options.repo ?? new InMemoryRepository();
  const now = options.now ?? Date.now;
  const app = Fastify({ logger: true });

  app.get('/', async () => ({ status: 'ok', service: 'call-scheduler-backend' }));

  app.register(
    async (api) => {
      api.get('/event-types', async () => repo.listEventTypes());

      api.post('/event-types', async (req, reply) => {
        const body = isObject(req.body) ? req.body : {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const durationMinutes = body.durationMinutes;
        if (!name) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'name is required'));
        }
        if (!isPositiveInteger(durationMinutes)) {
          return reply
            .code(400)
            .send(error('VALIDATION_ERROR', 'durationMinutes must be a positive integer'));
        }
        return reply.code(201).send(repo.createEventType({ name, durationMinutes }));
      });

      api.get('/availability', async () => repo.getAvailability());

      api.put('/availability', async (req, reply) => {
        if (!isObject(req.body)) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'availability must be an object'));
        }
        const next: WeeklyAvailability = {};
        for (const [key, value] of Object.entries(req.body)) {
          if (!WEEKDAYS.includes(key as Weekday)) {
            return reply.code(400).send(error('VALIDATION_ERROR', `unknown weekday: ${key}`));
          }
          if (!Array.isArray(value)) {
            return reply.code(400).send(error('VALIDATION_ERROR', `${key} must be an array`));
          }
          for (const range of value as Array<{ start?: unknown; end?: unknown }>) {
            const { start, end } = range ?? {};
            if (!isHhMm(start) || !isHhMm(end)) {
              return reply
                .code(400)
                .send(error('VALIDATION_ERROR', `${key} ranges must be HH:MM strings`));
            }
          }
          next[key as Weekday] = value as TimeRange[];
        }
        return repo.setAvailability(next);
      });

      api.get('/slots', async (req, reply) => {
        const query = isObject(req.query) ? req.query : {};
        const eventTypeId = typeof query.eventTypeId === 'string' ? query.eventTypeId : '';
        if (!eventTypeId) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'eventTypeId is required'));
        }
        const et = repo.getEventType(eventTypeId);
        if (!et) {
          return reply.code(404).send(error('NOT_FOUND', 'unknown event type'));
        }
        const nowMs = now();
        const requestedFrom = typeof query.from === 'string' ? Date.parse(query.from) : nowMs;
        if (Number.isNaN(requestedFrom)) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'from must be an ISO datetime'));
        }
        const fromMs = requestedFrom < nowMs ? nowMs : requestedFrom; // only future slots
        const toMs =
          typeof query.to === 'string' ? Date.parse(query.to) : fromMs + DEFAULT_HORIZON_MS;
        if (Number.isNaN(toMs)) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'to must be an ISO datetime'));
        }
        if (toMs <= fromMs) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'to must be after from'));
        }
        return deriveSlots({
          availability: repo.getAvailability(),
          durationMinutes: et.durationMinutes,
          bookings: repo.listBookings(),
          from: fromMs,
          to: toMs,
        });
      });

      api.post('/bookings', async (req, reply) => {
        const body = isObject(req.body) ? req.body : {};
        const eventTypeId = typeof body.eventTypeId === 'string' ? body.eventTypeId : '';
        const start = typeof body.start === 'string' ? body.start : '';
        const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : '';
        const guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.trim() : '';
        if (!eventTypeId) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'eventTypeId is required'));
        }
        const startMs = Date.parse(start);
        if (!start || Number.isNaN(startMs)) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'start must be an ISO datetime'));
        }
        if (!guestName) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'guestName is required'));
        }
        if (!isValidEmail(guestEmail)) {
          return reply
            .code(400)
            .send(error('VALIDATION_ERROR', 'guestEmail must be a valid email'));
        }
        const et = repo.getEventType(eventTypeId);
        if (!et) {
          return reply.code(404).send(error('NOT_FOUND', 'unknown event type'));
        }
        if (startMs < now()) {
          return reply.code(400).send(error('VALIDATION_ERROR', 'start must be in the future'));
        }
        // The requested start must be an offered slot: on the duration boundary, inside
        // availability, and not overlapping any existing booking.
        const dayStart = Date.UTC(
          new Date(startMs).getUTCFullYear(),
          new Date(startMs).getUTCMonth(),
          new Date(startMs).getUTCDate(),
        );
        const candidates = deriveSlots({
          availability: repo.getAvailability(),
          durationMinutes: et.durationMinutes,
          bookings: repo.listBookings(),
          from: dayStart,
          to: dayStart + DAY_MS,
        });
        if (!candidates.some((s) => Date.parse(s.start) === startMs)) {
          return reply.code(409).send(error('CONFLICT', 'requested slot is not available'));
        }
        const booking = repo.addBooking({
          eventTypeId,
          start: new Date(startMs).toISOString(),
          end: new Date(startMs + et.durationMinutes * 60_000).toISOString(),
          guestName,
          guestEmail,
        });
        return reply.code(201).send(booking);
      });
    },
    { prefix: '/api' },
  );

  return app;
}
