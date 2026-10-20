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

Implementation: `backend/src/`, `frontend/src/`. Acceptance: 56 auto-tests (see appendix B).

## 4. FR-GUEST requirements (guest booking)

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-GUEST-1 | Choose an EventType from the list | The page shows all EventTypes as buttons | as-is | `BookingPage.test.tsx` › shows event types on load |
| FR-GUEST-2 | Slots by date | After picking an EventType, slots load and are shown grouped by date | as-is | `BookingPage.test.tsx` › selecting event type loads and shows slots grouped by date; `groupSlotsByDate.test.ts` |
| FR-GUEST-3 | Slot request window | The client requests the window "today 00:00 UTC … +14 days" (`from`/`to`) | as-is | `mockApiClient.test.ts` › derives slots across multiple days from availability |
| FR-GUEST-4 | Time shown in UTC | Time (`HH:MM`) and date (`YYYY-MM-DD`) come from the ISO UTC part; no conversion | as-is | `BookingPage.test.tsx` › selecting event type loads and shows slots grouped by date |
| FR-GUEST-5 | Name and email entry | Picking a slot reveals the Name/Email form | as-is | `BookingPage.test.tsx` › selecting a slot reveals the booking form |
| FR-GUEST-6 | Name validation | Empty name → "Name is required"; no request is sent | as-is | `BookingPage.test.tsx` › shows validation errors on empty name |
| FR-GUEST-7 | Email validation | Email failing `/.+@.+\..+/` → "Enter a valid email"; no request is sent | as-is | `BookingPage.test.tsx` › shows validation errors on invalid email |
| FR-GUEST-8 | Create a booking | Valid data → `POST /bookings`, inline "Booking confirmed!" (no separate page) | as-is | `BookingPage.test.tsx` › submitting valid data books and shows confirmation |
| FR-GUEST-9 | Rebooking | After confirmation, another slot can be booked | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-10 | Empty result | No slots → "No available slots" | as-is | `BookingPage.test.tsx` › shows message when no slots available |
| FR-GUEST-11 | State reset on selection | Changing EventType resets slots/selection/confirmation/errors; picking a slot resets confirmation/errors | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-12 | Booking error visible | **GAP:** when `createBooking` fails (incl. 409 "slot taken") the error is **silently hidden**; the form stays | gap | Manual acceptance — **expected behaviour, needs attention** |
| FR-GUEST-13 | Message for empty EventTypes | **GAP:** an empty EventType list is shown without a message | gap | Manual acceptance — **needs attention** |

## 5. FR-HOST requirements (management)

Routes: `/host/availability`, `/host/event-types`; `/` — Guest view; navigation — `HostLayout` (+ "Guest view" link).

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-HOST-1 | Host routes | `/host/availability` and `/host/event-types` render the respective pages; `/host` → `/host/availability` | as-is | `routes.test.tsx` › renders the availability editor at /host/availability; renders event types at /host/event-types; redirects /host to /host/availability |
| FR-HOST-2 | Availability editor per weekday | 7 days; a day with no ranges is marked "Unavailable" | as-is | `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday; marks weekdays without ranges as unavailable |
| FR-HOST-3 | Add a range | "Add range" adds 09:00–17:00 and saves it by full replacement | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability |
| FR-HOST-4 | Edit a range | Editing range bounds is saved | as-is | `HostAvailabilityPage.test.tsx` › edits a range start and saves it |
| FR-HOST-5 | Remove a range | Removing a range makes the day unavailable | as-is | `HostAvailabilityPage.test.tsx` › removes a range so the weekday becomes unavailable |
| FR-HOST-6 | Full replacement on save | Save → `PUT /availability` (full replacement); inline "Availability saved" | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability; `api.test.ts` › fully replaces availability on PUT |
| FR-HOST-7 | Absent day = unavailable | A missing weekday key means "unavailable"; `[]` is equivalent | as-is | `HostAvailabilityPage.test.tsx` › marks weekdays without ranges as unavailable |
| FR-HOST-8 | Range validation | Format `HH:MM` only. **GAP:** `start >= end` and same-day overlaps are **not checked** | gap | Manual acceptance — **recorded gap** |
| FR-HOST-9 | Save error | On PUT failure the message "Failed to save availability" is shown; the draft is **not rolled back** | as-is | Manual acceptance |
| FR-HOST-10 | Default on first open | The editor shows the default Mon–Fri 09:00–17:00 | as-is | `api.test.ts` › returns the seeded availability; `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday |
| FR-HOST-11 | EventType list | `GET /event-types` is shown as a list | as-is | `HostEventTypesPage.test.tsx` › lists existing event types |
| FR-HOST-12 | Create EventType | Create form; empty name → "Name is required", `duration <= 0` → "Duration must be positive" (before sending) | as-is | `HostEventTypesPage.test.tsx` › requires a name before creating; requires a positive duration before creating |
| FR-HOST-13 | Append without refetch | After create, the new type is appended locally from the POST response | as-is | `HostEventTypesPage.test.tsx` › creates a new event type and appends it |
| FR-HOST-14 | Host→Guest integration | Saved Host availability shapes the slots the Guest sees | as-is | `hostGuestIntegration.test.tsx` › availability saved by the Host shapes the slots the guest sees |

## 6. FR-API requirements

All routes under the `/api` prefix. Error body — `{error:{code,message}}`; codes `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409). Full JSON examples — appendix A.

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-API-1 | `GET /api/health` | 200 `{status:'ok', service}` | as-is | `app.test.ts` › responds with 200 on GET /api/health |
| FR-API-2 | `GET /api/event-types` | 200 array of EventType (seed: intro/15, consult/30) | as-is | `api.test.ts` › lists seeded event types |
| FR-API-3 | `POST /api/event-types` | 201 + EventType; `id` = slug of the name (`name.toLowerCase().replace(/\s+/g,'-')`); collisions allowed | as-is | `api.test.ts` › creates an event type with a slug id |
| FR-API-4 | EventType validation | Empty `name` → 400; non-integer/non-positive `durationMinutes` → 400 | as-is | `api.test.ts` › rejects an event type without a name; rejects an event type with a non-positive duration |
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

## 7. FR-DEPLOY requirements (deploy and Hexlet contract)

| ID | Requirement | Acceptance criterion | Status | Check |
|----|-------------|----------------------|--------|-------|
| FR-DEPLOY-1 | Single image | Fastify serves `/api` and static assets, SPA fallback to index.html; port 3000 (ADR-0005) | as-is | `static.test.ts` › serves index.html at /; falls back to index.html for a client-side deep link; still serves the API when the static root exists |
| FR-DEPLOY-2 | Our docker-compose | `docker-compose.yml` with an `app` service (image from the Dockerfile, port 3000) for local run/demo. **Not what the checker reads** (compose comes from the harness, ADR-0006) | to-be | Manual acceptance (`docker compose up`) |
| FR-DEPLOY-3 | Makefile | Root `Makefile`: `setup` (`npm ci`), `test` (`npm run test`), `lint`, `build`, `artifacts` | to-be | Manual acceptance (`make setup && make test`) |
| FR-DEPLOY-4 | Package name | Root `package.json` name = `@hexlet/code` | to-be | Manual acceptance (checker) |
| FR-DEPLOY-5 | Artifacts | `make artifacts` writes junit/JSON to `tmp/artifacts/test/`; asciinema to `tmp/artifacts/demo/*.cast`; screenshots to `tmp/artifacts/screens/*` — manually | to-be | Manual acceptance (nested paths present) |
| FR-DEPLOY-6 | Artifact gitignore | `tmp/artifacts/test/*` ignored; `demo/` and `screens/` committed | to-be | Manual acceptance |
| FR-DEPLOY-7 | Runtime contract | Port 3000; `GET /api/health`; env `PORT`/`HOST`/`STATIC_ROOT` with defaults | as-is | `app.test.ts` › starts the server and responds with 200 on GET /api/health |
| FR-DEPLOY-8 | README | Working Installation/Usage sections + a link to the asciinema | to-be | Manual acceptance |
| FR-DEPLOY-9 | Asciinema demo | Recording of the key scenario (guest booking), nested under `tmp/artifacts/demo/` | to-be | Manual acceptance |
| FR-DEPLOY-10 | hexlet-check.yml | File unchanged/not deleted | as-is | Manual acceptance |
| FR-DEPLOY-11 | Docker context | `.dockerignore` (as-is) applies only to our `docker build`; the checker mounts the whole checkout into `source/code` | as-is | Manual acceptance |

## 8. Out of scope

- Cancelling and editing meetings (booking creation only).
- Auth / multi-host (ADR-0004: single Host, no auth).
- External calendar integration (Google Calendar).
- Email notifications.

## 9. Appendix A — API schemas (JSON)

All routes under `/api`. Error: `{ "error": { "code": "...", "message": "..." } }`.

### GET /api/health

```json
{ "status": "ok", "service": "call-scheduler-backend" }
```

### GET /api/event-types

200:

```json
[
  { "id": "intro", "name": "Intro call", "durationMinutes": 15 },
  { "id": "consult", "name": "Consultation", "durationMinutes": 30 }
]
```

### POST /api/event-types

Request:

```json
{ "name": "Discovery call", "durationMinutes": 45 }
```

201:

```json
{ "id": "discovery-call", "name": "Discovery call", "durationMinutes": 45 }
```

400:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "name is required" } }
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

## 10. Appendix B — traceability map

56 auto-tests: 33 frontend (`frontend/test/`) + 23 backend (`backend/test/`). Run: `npm run test` (vitest, projects `backend`/`frontend`). Requirements marked `gap` and `to-be` are checked by manual acceptance (see the "Check" column).

## 11. Appendix C — ADR index

- ADR-0001 — single timezone (UTC).
- ADR-0002 — derived slots.
- ADR-0003 — in-memory repository behind `Repository`.
- ADR-0004 — single Host without authentication.
- ADR-0005 — single container.
- ADR-0006 — Hexlet checker harness conformance.
