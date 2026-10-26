# TypeSpec as the source of the API contract

The API contract lives in TypeSpec (`typespec/main.tsp`): paths, methods, models, query
parameters and status codes. The compiler emits OpenAPI 3 (`typespec/openapi/openapi.json`),
and `openapi-typescript` generates the TypeScript schema
(`frontend/src/api/generated/schema.d.ts`). Both generated files are committed.

The frontend never calls `fetch` directly. `httpApiClient.ts` is a thin adapter over
`openapi-fetch` typed by the generated schema; the application still depends on the
`ApiClient` port, so pages, tests and the in-memory mock stay unchanged.

Changing the contract is a three-step sequence: edit `typespec/main.tsp`, run
`npm run contract:generate`, then adjust the backend and the frontend to the new types.
CI runs `npm run contract:check`, which regenerates and fails on a diff, so the generated
artifacts cannot drift from the source.

The official TypeScript client emitter (`@typespec/http-client-js`) was evaluated and
rejected: the published versions 0.16.2/0.16.3 fail at load time with a conflicting Alloy
version, and the emitter is still pre-1.0. `openapi-typescript` + `openapi-fetch` is the
stable path with the same contract-first guarantee. Revisit when the emitter reaches a
stable release.
