# Specification: Call Calendar

Status: **approved specification** (hybrid as-is + to-be). Source of decisions: Wayfinder map #3.

## 1. Overview and purpose

Call Calendar is a call-booking service (a simplified Cal.com). A single Host publishes bookable call slots and Guests book them. It exists so people can grab a free time without back-and-forth messaging.

The app is a Hexlet learning project (`ru.hexlet.io/programs/frontend`); acceptance is the platform's auto-tests (`hexlet/project-action`) plus a manual acceptance pass against the reference video.

Scope boundaries:

- **In scope:** guest booking, host-created event types, API, in-memory storage, adaptation to the Hexlet checker format (docker-compose, artifacts, asciinema).
- **Out of scope:** cancelling and editing meetings, auth/multi-host, external calendar integration (Google Calendar), email notifications. See section 8.

## 2. Glossary

The single glossary is the root [`GLOSSARY.md`](../../GLOSSARY.md) (Host, Guest, EventType, Availability, Slot, Booking). It is not duplicated here; where terms differ, the glossary wins.

## 3. As-is: what is already built

- **Single image** (ADR-0005): Fastify serves `/api` and the built static frontend from one origin, port 3000; in dev Vite proxies `/api`.
- **Derived slots** (ADR-0002): slots are derived from Availability and the EventType duration, minus overlaps with Bookings.
- **In-memory repository** behind the `Repository` interface (ADR-0003).
- **Single Host without authentication** (ADR-0004).
- **Single timezone / UTC** (ADR-0001): all times are UTC, with no conversion to the local zone.
- **Hexlet checker format** (ADR-0006): the run contract is dictated externally.
- **The Host defines the whole EventType**: `id` (a slug the Host picks), `name`, `description`, `durationMinutes`.
- **Guest calendar**: the booking window is shown as a grid of days (14 days from the current date), each day listing its free slots.
- **Host upcoming meetings page**: one list of bookings across all event types.

Implementation: `backend/src/`, `frontend/src/`. Acceptance: 97 auto-tests (see appendix B).

## 4. FR-GUEST requirements (guest booking)

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-GUEST-1 | Booking types | The page shows all EventTypes as cards: name, description, duration | as-is | `BookingPage.test.tsx` › shows event types on load; shows the description and duration of a booking type |
| FR-GUEST-2 | Slot calendar | After picking an EventType a 14-day calendar opens (a grid of days), each day listing its free slots; a day without slots is marked "No availability" | as-is | `BookingPage.test.tsx` › selecting event type opens a 14-day calendar with free slots; `buildCalendarDays.test.ts`; `groupSlotsByDate.test.ts` |
| FR-GUEST-3 | Slot request window | The client requests the window "today 00:00 UTC … +14 days" (`from`/`to`) | as-is | `mockApiClient.test.ts` › derives slots across multiple days from availability |
| FR-GUEST-4 | Time shown in UTC | Time (`HH:MM`) and date (`YYYY-MM-DD`) come from the ISO UTC part; no conversion | as-is | `BookingPage.test.tsx` › selecting event type opens a 14-day calendar with free slots; `buildCalendarDays.test.ts` › labels weekdays and months in UTC |
| FR-GUEST-5 | Name and email entry | Picking a slot reveals the Name/Email form | as-is | `BookingPage.test.tsx` › selecting a slot reveals the booking form |
| FR-GUEST-6 | Name validation | Empty name → "Name is required"; no request is sent | as-is | `BookingPage.test.tsx` › shows validation errors on empty name |
| FR-GUEST-7 | Email validation | Email failing `/.+@.+\..+/` → "Enter a valid email"; no request is sent | as-is | `BookingPage.test.tsx` › shows validation errors on invalid email |
| FR-GUEST-8 | Create a booking | Valid data → `POST /bookings`, inline "Booking confirmed!" (no separate page) | as-is | `BookingPage.test.tsx` › submitting valid data books and shows confirmation |
| FR-GUEST-9 | Rebooking | After confirmation, another slot can be booked | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-10 | Empty result | No slots → "No available slots" | as-is | `BookingPage.test.tsx` › shows message when no slots available |
| FR-GUEST-11 | State reset on selection | Changing EventType resets slots/selection/confirmation/errors; picking a slot resets confirmation/errors | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-12 | Booking error visible | When `createBooking` fails (incl. 409 "slot taken") the error text is shown (`role="alert"`); the form stays so the guest can pick another slot; the error clears when a slot is picked. The overlap rule also holds in the dev mock | as-is | `BookingPage.test.tsx` › shows the error when the booking fails; clears the booking error when another slot is picked; `mockApiClient.test.ts` › refuses a booking that overlaps an existing one |
| FR-GUEST-13 | Message for empty EventTypes | An empty EventType list → "No booking types available yet." | as-is | `BookingPage.test.tsx` › shows a message when there are no booking types |
| FR-GUEST-14 | Selected slot is highlighted | The picked slot is marked (`aria-pressed="true"` plus a visual highlight); picking another slot moves the highlight | as-is | `BookingPage.test.tsx` › marks the clicked slot as selected |
| FR-GUEST-15 | Slots refresh after booking | After a successful booking the slot list is fetched again: the taken slot disappears from the calendar | as-is | `BookingPage.test.tsx` › removes the booked slot from the list after a successful booking |

## 5. FR-HOST requirements (management)

Routes: `/host/availability`, `/host/event-types`, `/host/bookings`; `/` — Guest view; navigation — `HostLayout` (+ "Guest view" link).

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-HOST-1 | Host routes | `/host/availability`, `/host/event-types`, `/host/bookings` render the respective pages; `/host` → `/host/availability` | as-is | `routes.test.tsx` › renders the availability editor at /host/availability; renders event types at /host/event-types; renders upcoming meetings at /host/bookings; redirects /host to /host/availability |
| FR-HOST-2 | Availability editor per weekday | 7 days; a day with no ranges is marked "Unavailable" | as-is | `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday; marks weekdays without ranges as unavailable |
| FR-HOST-3 | Add a range | "Add range" adds 09:00–17:00 and saves it by full replacement | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability |
| FR-HOST-4 | Edit a range | Editing range bounds is saved | as-is | `HostAvailabilityPage.test.tsx` › edits a range start and saves it |
| FR-HOST-5 | Remove a range | Removing a range makes the day unavailable | as-is | `HostAvailabilityPage.test.tsx` › removes a range so the weekday becomes unavailable |
| FR-HOST-6 | Full replacement on save | Save → `PUT /availability` (full replacement); inline "Availability saved" | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability; `api.test.ts` › fully replaces availability on PUT |
| FR-HOST-7 | Absent day = unavailable | A missing weekday key means "unavailable"; `[]` is equivalent | as-is | `HostAvailabilityPage.test.tsx` › marks weekdays without ranges as unavailable |
| FR-HOST-8 | Range validation | Format `HH:MM`; `start < end` for every range; ranges of one weekday must not overlap (touching `end == start` is fine). Otherwise 400 `VALIDATION_ERROR`; the owner form shows the error and does not send the request | as-is | `backend/test/api.test.ts` › rejects a range whose start is not before its end; rejects overlapping ranges within a weekday; accepts touching ranges; `HostAvailabilityPage.test.tsx`; `availabilityErrors.test.ts` |
| FR-HOST-9 | Save error | On PUT failure the message "Failed to save availability" is shown; the draft is **not rolled back** | as-is | Manual acceptance |
| FR-HOST-10 | Default on first open | The editor shows the default Mon–Fri 09:00–17:00 | as-is | `api.test.ts` › returns the seeded availability; `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday |
| FR-HOST-11 | EventType list | `GET /event-types` is shown as a list (id, name, description, duration) | as-is | `HostEventTypesPage.test.tsx` › lists existing event types with their description and duration |
| FR-HOST-12 | Create EventType | Create form with `id`, `name`, `description`, `duration`; the id is suggested from the name (slug) but stays editable; empty name → "Name is required", invalid id → "Id must be lowercase words separated by dashes", `duration <= 0` → "Duration must be positive" (before sending) | as-is | `HostEventTypesPage.test.tsx` › suggests an id from the name and creates the event type; keeps a manually chosen id when the name changes; requires a name before creating; requires a valid id before creating; requires a positive duration before creating |
| FR-HOST-13 | Append without refetch | After create, the new type is appended locally from the POST response | as-is | `HostEventTypesPage.test.tsx` › suggests an id from the name and creates the event type |
| FR-HOST-14 | Host→Guest integration | Saved Host availability shapes the slots the Guest sees | as-is | `hostGuestIntegration.test.tsx` › availability saved by the Host shapes the slots the guest sees |
| FR-HOST-15 | Upcoming meetings | `/host/bookings` shows one list of bookings across all event types: date/time, event type name, guest name and email; past meetings are hidden; empty → "No upcoming meetings yet." | as-is | `HostBookingsPage.test.tsx` › lists upcoming meetings of every event type; hides meetings that already happened; shows an empty state when nothing is booked |

## 6. FR-API requirements

All routes under the `/api` prefix. Error body — `{error:{code,message}}`; codes `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409). Full JSON examples — appendix A.

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-API-1 | `GET /api/health` | 200 `{status:'ok', service}` | as-is | `app.test.ts` › responds with 200 on GET /api/health |
| FR-API-2 | `GET /api/event-types` | 200 array of EventType (seed: intro/15, consult/30) with `description` | as-is | `api.test.ts` › lists seeded event types |
| FR-API-3 | `POST /api/event-types` | 201 + EventType; the Host picks the `id` (slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`), `description` is free text (defaults to `''`) | as-is | `api.test.ts` › creates an event type with the id, name, description and duration; creates an event type without a description |
| FR-API-4 | EventType validation | Invalid/empty `id` → 400; empty `name` → 400; non-integer/non-positive `durationMinutes` → 400; duplicate `id` → 409 | as-is | `api.test.ts` › rejects an event type without an id; rejects an event type id that is not a slug; rejects a duplicate event type id; rejects an event type without a name; rejects an event type with a non-positive duration |
| FR-API-5 | `GET /api/availability` | 200 WeeklyAvailability; default Mon–Fri 09:00–17:00 | as-is | `api.test.ts` › returns the seeded availability |
| FR-API-6 | `PUT /api/availability` | Full replacement; 200 with the new value. Unknown day/non-array/non-`HH:MM` → 400 | as-is | `api.test.ts` › fully replaces availability on PUT; rejects an unknown weekday on PUT availability; rejects a non-HH:MM range on PUT availability |
| FR-API-7 | `GET /api/slots` | 200 `Slot[]`; future only, within the window | as-is | `api.test.ts` › derives only future slots within the requested window |
| FR-API-8 | 14-day default horizon | With no `from`/`to`: `from=now`, `to=from+14d`; a past `from` is silently clamped to `now` | as-is | `api.test.ts` › defaults the horizon to 14 days when from/to are omitted |
| FR-API-9 | `GET /api/slots` validation | 400 without `eventTypeId`; 404 unknown type; bad dates/`to<=from` → 400 | as-is | `api.test.ts` › returns 400 when eventTypeId is missing on GET slots; returns 404 for an unknown event type on GET slots |
| FR-API-10 | `POST /api/bookings` | 201 + Booking; `start`/`end` always ISO-8601 UTC | as-is | `api.test.ts` › books an available slot |
| FR-API-11 | Booking validation | Empty `guestName`/invalid email/past `start` → 400; unknown type → 404 | as-is | `api.test.ts` › rejects a booking with an invalid email; returns 404 for an unknown event type on POST bookings; rejects a booking in the past |
| FR-API-12 | `start` must match a slot | If `start` does not match a slot (boundary/availability/overlap) → 409 | as-is | `api.test.ts` › returns 409 when the slot is already booked |
| FR-API-13 | Overlap prevention | Overlap with any existing Booking (any EventType) → 409; the slot is hidden from `GET /slots` | as-is | `api.test.ts` › forbids overlapping bookings across different event types; hides a slot that overlaps an unrelated booking from GET /slots |
| FR-API-14 | Error shape | All errors — `{error:{code,message}}`; unknown API route → 404 JSON | as-is | `static.test.ts` › does not let the SPA fallback shadow unknown /api routes |
| FR-API-15 | Storage behind an interface | State in memory behind `Repository` (ADR-0003) | as-is | `api.test.ts` (whole suite on `InMemoryRepository`) |
| FR-API-16 | `GET /api/bookings` | 200 array of Booking sorted by `start` ascending | as-is | `api.test.ts` › lists bookings in chronological order |
| FR-API-17 | Contract and client SDK | The contract source is TypeSpec (`typespec/main.tsp`); OpenAPI and the TS schema are generated (`npm run contract:generate`), and CI catches drift with `contract:check`. The frontend talks to the API only through the generated SDK (`openapi-fetch`); there is no hand-written `fetch` (ADR-0007) | as-is | `httpApiClient.test.ts` › generated SDK; `npm run contract:check` |

## 7. FR-DEPLOY requirements (deploy and Hexlet contract)

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-DEPLOY-1 | Single image | Fastify serves `/api` and static assets, SPA fallback to index.html; port 3000 (ADR-0005) | as-is | `static.test.ts` › serves index.html at /; falls back to index.html for a client-side deep link; still serves the API when the static root exists |
| FR-DEPLOY-2 | Our docker-compose | `docker-compose.yml` with an `app` service (image from the Dockerfile, port 3000) for local run/demo. **Not what the checker reads** (compose comes from the harness, ADR-0006) | as-is | `docker compose up --build` (not verified: no Docker in this environment) |
| FR-DEPLOY-3 | Makefile | Root `Makefile`: `setup`/`install` (`npm ci`), `test` (`npm run test`), `lint`, `build`, `artifacts`, `clean` | as-is | `make setup && make test` |
| FR-DEPLOY-4 | Package name | Root `package.json` name = `@hexlet/code` | as-is | `node -p "require('./package.json').name"` |
| FR-DEPLOY-5 | Artifacts | `make artifacts` writes junit/JSON to `tmp/artifacts/test/`; `tmp/artifacts/demo/` and `tmp/artifacts/screens/` exist and are tracked via `.gitkeep`, filled by hand | as-is (filling is manual) | `tmp/artifacts/test/`, `tmp/artifacts/demo/`, `tmp/artifacts/screens/` |
| FR-DEPLOY-6 | Artifact gitignore | `tmp/artifacts/test/` ignored; `demo/` and `screens/` committed | as-is | `.gitignore` |
| FR-DEPLOY-7 | Runtime contract | Port 3000; `GET /api/health`; env `PORT`/`HOST`/`STATIC_ROOT` with defaults | as-is | `app.test.ts` › starts the server and responds with 200 on GET /api/health |
| FR-DEPLOY-8 | README | Working Installation/Usage sections (dev, production, Docker, env vars, check commands) + a slot for the asciinema link | to-be (no link until FR-DEPLOY-9) | `README.md` |
| FR-DEPLOY-9 | Asciinema demo | Recording of the key scenario (guest booking), nested under `tmp/artifacts/demo/` | to-be | Manual acceptance |
| FR-DEPLOY-10 | hexlet-check.yml | File unchanged/not deleted | as-is | Manual acceptance |
| FR-DEPLOY-11 | Docker context | `.dockerignore` (as-is) applies only to our `docker build`; the checker mounts the whole checkout into `source/code` | as-is | Manual acceptance |

## 8. Out of scope

- Cancelling and editing meetings (booking creation only).
- Auth / multi-host (ADR-0004: single Host, no auth).
- External calendar integration (Google Calendar).
- Email notifications.

## 9. Appendix A — API schemas (JSON)

Contract source: `typespec/main.tsp` → `typespec/openapi/openapi.json` → `frontend/src/api/generated/schema.d.ts` (ADR-0007).

All routes under `/api`. Error: `{ "error": { "code": "...", "message": "..." } }`.

### GET /api/health

```json
{ "status": "ok", "service": "call-scheduler-backend" }
```

### GET /api/event-types

200:

```json
[
  {
    "id": "intro",
    "name": "Intro call",
    "description": "A short introduction to get to know each other.",
    "durationMinutes": 15
  },
  {
    "id": "consult",
    "name": "Consultation",
    "description": "A longer session to go through your questions in detail.",
    "durationMinutes": 30
  }
]
```

### POST /api/event-types

Request (the Host picks the `id`; `description` is optional):

```json
{
  "id": "discovery-call",
  "name": "Discovery call",
  "description": "A first conversation about your project",
  "durationMinutes": 45
}
```

201:

```json
{
  "id": "discovery-call",
  "name": "Discovery call",
  "description": "A first conversation about your project",
  "durationMinutes": 45
}
```

400:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "name is required" } }
```

409 (the `id` is taken):

```json
{ "error": { "code": "CONFLICT", "message": "an event type with this id already exists" } }
```

### GET /api/availability

200:

```json
{
  "mon": [{ "start": "09:00", "end": "17:00" }],
  "tue": [{ "start": "09:00", "end": "17:00" }],
  "wed": [{ "start": "09:00", "end": "17:00" }],
  "thu": [{ "start": "09:00", "end": "17:00" }],
  "fri": [{ "start": "09:00", "end": "17:00" }]
}
```

### PUT /api/availability

Request (full replacement; an absent day = unavailable):

```json
{ "mon": [{ "start": "10:00", "end": "12:00" }] }
```

200: the saved value. 400 — unknown day, non-array, or non-`HH:MM`:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "unknown weekday: funday" } }
```

### GET /api/slots?eventTypeId=&from=&to=

`from`/`to` optional (ISO-8601). 200:

```json
[
  { "start": "2026-10-21T09:00:00.000Z", "end": "2026-10-21T09:15:00.000Z" }
]
```

400 (no `eventTypeId`):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "eventTypeId is required" } }
```

404 (unknown type):

```json
{ "error": { "code": "NOT_FOUND", "message": "unknown event type" } }
```

### POST /api/bookings

Request:

```json
{
  "eventTypeId": "intro",
  "start": "2026-10-21T09:00:00.000Z",
  "guestName": "Ada Lovelace",
  "guestEmail": "ada@example.com"
}
```

201:

```json
{
  "id": "1",
  "eventTypeId": "intro",
  "start": "2026-10-21T09:00:00.000Z",
  "end": "2026-10-21T09:15:00.000Z",
  "guestName": "Ada Lovelace",
  "guestEmail": "ada@example.com"
}
```

409 (slot unavailable/taken):

```json
{ "error": { "code": "CONFLICT", "message": "requested slot is not available" } }
```

### GET /api/bookings

200 (sorted by `start` ascending):

```json
[
  {
    "id": "1",
    "eventTypeId": "intro",
    "start": "2026-10-21T09:00:00.000Z",
    "end": "2026-10-21T09:15:00.000Z",
    "guestName": "Ada Lovelace",
    "guestEmail": "ada@example.com"
  }
]
```

## 10. Appendix B — traceability map

97 auto-tests: 65 frontend (`frontend/test/`) + 32 backend (`backend/test/`). Run: `npm run test` (vitest, projects `backend`/`frontend`). Requirements marked `gap` and `to-be` are checked by manual acceptance (see the "Check" column).

## 11. Appendix C — ADR index

- ADR-0001 — single timezone (UTC).
- ADR-0002 — derived slots.
- ADR-0003 — in-memory repository behind `Repository`.
- ADR-0004 — single Host without authentication.
- ADR-0005 — single container.
- ADR-0006 — Hexlet checker harness conformance.
- ADR-0007 — TypeSpec as the contract source and the generated SDK.
