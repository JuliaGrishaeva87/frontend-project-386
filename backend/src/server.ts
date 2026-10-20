import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

// The built frontend is copied next to the compiled backend in the image
// (backend/dist/server.js and public/ both live under /app), so resolve it
// relative to this module rather than the process working directory.
const here = dirname(fileURLToPath(import.meta.url));
const staticRoot = process.env.STATIC_ROOT ?? join(here, '..', '..', 'public');

const app = buildApp({ staticRoot });

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
