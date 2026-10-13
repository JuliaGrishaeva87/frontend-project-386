import Fastify, { type FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/', async () => {
    return { status: 'ok', service: 'call-scheduler-backend' };
  });

  return app;
}
