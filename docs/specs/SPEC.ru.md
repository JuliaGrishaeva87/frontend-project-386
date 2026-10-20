# Спецификация: Call Calendar

Статус: **утверждённая спецификация** (гибрид as-is + to-be). Источник решений — Wayfinder-карта #3.

## 1. Обзор и назначение

Call Calendar — сервис записи на звонок (упрощённый Cal.com). Один Host публикует бронируемые слоты звонков, Guest бронируют их. Существует, чтобы люди занимали свободное время без переписки.

Приложение — учебный проект Хекслета (`ru.hexlet.io/programs/frontend`); приёмка — автотесты платформы (`hexlet/project-action`) плюс ручная приёмка по эталонному видео.

Границы объёма:

- **In scope:** гостевое бронирование, создание типов событий хостом, API, in-memory хранилище, адаптация под формат Хекслет-чекера (docker-compose, артефакты, asciinema).
- **Out of scope:** отмена и редактирование встреч, авторизация/мультихостинг, интеграция с внешними календарями (Google Calendar), email-уведомления. См. раздел 8.

## 2. Словарь терминов

Единственный словарь — корневой [`GLOSSARY.md`](../../GLOSSARY.md) (Host, Guest, EventType, Availability, Slot, Booking). Здесь не дублируется; при расхождении терминов приоритет за глоссарием.

## 3. As-is: что уже построено

- **Единый образ** (ADR-0005): Fastify отдаёт `/api` и собранную статику с одного origin, порт 3000; в dev Vite проксирует `/api`.
- **Вычисляемые слоты** (ADR-0002): слоты выводятся из Availability и длительности EventType, минус пересечения с Booking.
- **In-memory репозиторий** за интерфейсом `Repository` (ADR-0003).
- **Один Host без аутентификации** (ADR-0004).
- **Один часовой пояс / UTC** (ADR-0001): все времена в UTC, конвертации в локальную зону нет.
- **Формат Хекслет-чекера** (ADR-0006): контракт запуска задан извне.

Реализация: `backend/src/`, `frontend/src/`. Приёмка — 56 автотестов (см. приложение Б).

## 4. Требования FR-GUEST (гостевое бронирование)

| ID | Требование | Критерий приёмки | Статус | Проверка |
|----|-----------|------------------|--------|----------|
| FR-GUEST-1 | Выбор EventType из списка | Страница показывает все EventType кнопками | as-is | `BookingPage.test.tsx` › shows event types on load |
| FR-GUEST-2 | Слоты по датам | После выбора EventType грузятся и показываются слоты, сгруппированные по дате | as-is | `BookingPage.test.tsx` › selecting event type loads and shows slots grouped by date; `groupSlotsByDate.test.ts` |
| FR-GUEST-3 | Окно запроса слотов | Клиент запрашивает окно «сегодня 00:00 UTC … +14 дней» (`from`/`to`) | as-is | `mockApiClient.test.ts` › derives slots across multiple days from availability |
| FR-GUEST-4 | Отображение времени в UTC | Время (`HH:MM`) и дата (`YYYY-MM-DD`) берутся из UTC-части ISO; конвертации нет | as-is | `BookingPage.test.tsx` › selecting event type loads and shows slots grouped by date |
| FR-GUEST-5 | Ввод имени и email | Выбор слота открывает форму Name/Email | as-is | `BookingPage.test.tsx` › selecting a slot reveals the booking form |
| FR-GUEST-6 | Валидация имени | Пустое имя → «Name is required»; запрос не уходит | as-is | `BookingPage.test.tsx` › shows validation errors on empty name |
| FR-GUEST-7 | Валидация email | Email не проходит `/.+@.+\..+/` → «Enter a valid email»; запрос не уходит | as-is | `BookingPage.test.tsx` › shows validation errors on invalid email |
| FR-GUEST-8 | Создание брони | Валидные данные → `POST /bookings`, inline «Booking confirmed!» (без отдельной страницы) | as-is | `BookingPage.test.tsx` › submitting valid data books and shows confirmation |
| FR-GUEST-9 | Повторное бронирование | После подтверждения можно забронировать другой слот | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-10 | Пустой результат | Нет слотов → «No available slots» | as-is | `BookingPage.test.tsx` › shows message when no slots available |
| FR-GUEST-11 | Сброс состояния при выборе | Смена EventType сбрасывает слоты/выбор/подтверждение/ошибки; выбор слота сбрасывает подтверждение/ошибки | as-is | `BookingPage.test.tsx` › allows booking again after a confirmation |
| FR-GUEST-12 | Ошибка брони видима | **GAP:** при провале `createBooking` (в т.ч. 409 «слот занят») ошибка **молча скрыта**; форма остаётся | gap | Ручная приёмка — **ожидаемое поведение, требует внимания** |
| FR-GUEST-13 | Сообщение при пустых EventType | **GAP:** пустой список EventType показывается без сообщения | gap | Ручная приёмка — **требует внимания** |

## 5. Требования FR-HOST (управление)

Маршруты: `/host/availability`, `/host/event-types`; `/` — Guest view; навигация — `HostLayout` (+ ссылка «Guest view»).

| ID | Требование | Критерий приёмки | Статус | Проверка |
|----|-----------|------------------|--------|----------|
| FR-HOST-1 | Маршруты Host-области | `/host/availability` и `/host/event-types` рендерят соответствующие страницы; `/host` → `/host/availability` | as-is | `routes.test.tsx` › renders the availability editor at /host/availability; renders event types at /host/event-types; redirects /host to /host/availability |
| FR-HOST-2 | Редактор Availability по дням | 7 дней; день без диапазонов помечен «Unavailable» | as-is | `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday; marks weekdays without ranges as unavailable |
| FR-HOST-3 | Добавление диапазона | «Add range» добавляет 09:00–17:00 и сохраняется полной заменой | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability |
| FR-HOST-4 | Изменение диапазона | Правка границ диапазона сохраняется | as-is | `HostAvailabilityPage.test.tsx` › edits a range start and saves it |
| FR-HOST-5 | Удаление диапазона | Удаление диапазона делает день недоступным | as-is | `HostAvailabilityPage.test.tsx` › removes a range so the weekday becomes unavailable |
| FR-HOST-6 | Полная замена на сохранении | Save → `PUT /availability` (полная замена); inline «Availability saved» | as-is | `HostAvailabilityPage.test.tsx` › adds a range and saves the full availability; `api.test.ts` › fully replaces availability on PUT |
| FR-HOST-7 | Отсутствие дня = недоступен | Отсутствующий ключ дня трактуется как «недоступен»; `[]` эквивалентно | as-is | `HostAvailabilityPage.test.tsx` › marks weekdays without ranges as unavailable |
| FR-HOST-8 | Валидация диапазонов | Только формат `HH:MM`. **GAP:** `start >= end` и пересечения внутри дня **не проверяются** | gap | Ручная приёмка — **зафиксированная дыра** |
| FR-HOST-9 | Ошибка сохранения | При провале PUT сообщение «Failed to save availability»; черновик **не откатывается** | as-is | Ручная приёмка |
| FR-HOST-10 | Дефолт при первом открытии | Редактор показывает дефолт Пн–Пт 09:00–17:00 | as-is | `api.test.ts` › returns the seeded availability; `HostAvailabilityPage.test.tsx` › loads and shows saved ranges per weekday |
| FR-HOST-11 | Список EventType | `GET /event-types` отображается списком | as-is | `HostEventTypesPage.test.tsx` › lists existing event types |
| FR-HOST-12 | Создание EventType | Форма create; при пустом имени → «Name is required», `duration <= 0` → «Duration must be positive» (до отправки) | as-is | `HostEventTypesPage.test.tsx` › requires a name before creating; requires a positive duration before creating |
| FR-HOST-13 | Добавление в список без refetch | После create новый тип добавляется локально из ответа POST | as-is | `HostEventTypesPage.test.tsx` › creates a new event type and appends it |
| FR-HOST-14 | Интеграция Host→Guest | Сохранённая Host-доступность формирует слоты, которые видит Guest | as-is | `hostGuestIntegration.test.tsx` › availability saved by the Host shapes the slots the guest sees |

## 6. Требования FR-API

Все маршруты под префиксом `/api`. Тело ошибки — `{error:{code,message}}`; коды `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409). Полные JSON-примеры — приложение А.

| ID | Требование | Критерий приёмки | Статус | Проверка |
|----|-----------|------------------|--------|----------|
| FR-API-1 | `GET /api/health` | 200 `{status:'ok', service}` | as-is | `app.test.ts` › responds with 200 on GET /api/health |
| FR-API-2 | `GET /api/event-types` | 200 массив EventType (сид: intro/15, consult/30) | as-is | `api.test.ts` › lists seeded event types |
| FR-API-3 | `POST /api/event-types` | 201 + EventType; `id` = slug имени (`name.toLowerCase().replace(/\s+/g,'-')`); коллизии допустимы | as-is | `api.test.ts` › creates an event type with a slug id |
| FR-API-4 | Валидация EventType | Пустое `name` → 400; нецелый/неположительный `durationMinutes` → 400 | as-is | `api.test.ts` › rejects an event type without a name; rejects an event type with a non-positive duration |
| FR-API-5 | `GET /api/availability` | 200 WeeklyAvailability; дефолт Пн–Пт 09:00–17:00 | as-is | `api.test.ts` › returns the seeded availability |
| FR-API-6 | `PUT /api/availability` | Полная замена; 200 с новым значением. Неизвестный день/не-массив/не-`HH:MM` → 400 | as-is | `api.test.ts` › fully replaces availability on PUT; rejects an unknown weekday on PUT availability; rejects a non-HH:MM range on PUT availability |
| FR-API-7 | `GET /api/slots` | 200 `Slot[]`; только будущее, внутри окна | as-is | `api.test.ts` › derives only future slots within the requested window |
| FR-API-8 | Дефолт горизонта 14 дней | Без `from`/`to`: `from=now`, `to=from+14д`; `from` в прошлом молча клампится до `now` | as-is | `api.test.ts` › defaults the horizon to 14 days when from/to are omitted |
| FR-API-9 | Валидация `GET /api/slots` | 400 без `eventTypeId`; 404 неизвестный тип; битые даты/`to<=from` → 400 | as-is | `api.test.ts` › returns 400 when eventTypeId is missing on GET slots; returns 404 for an unknown event type on GET slots |
| FR-API-10 | `POST /api/bookings` | 201 + Booking; `start`/`end` всегда ISO-8601 UTC | as-is | `api.test.ts` › books an available slot |
| FR-API-11 | Валидация брони | Пустое `guestName`/невалидный email/`start` в прошлом → 400; неизвестный тип → 404 | as-is | `api.test.ts` › rejects a booking with an invalid email; returns 404 for an unknown event type on POST bookings; rejects a booking in the past |
| FR-API-12 | `start` обязан совпасть со слотом | Если `start` не совпал со слотом (граница/availability/пересечение) → 409 | as-is | `api.test.ts` › returns 409 when the slot is already booked |
| FR-API-13 | Запрет пересечений | Пересечение с любым существующим Booking (любой EventType) → 409; слот скрывается из `GET /slots` | as-is | `api.test.ts` › forbids overlapping bookings across different event types; hides a slot that overlaps an unrelated booking from GET /slots |
| FR-API-14 | Формат ошибок | Все ошибки — `{error:{code,message}}`; неизвестный API-маршрут → 404 JSON | as-is | `static.test.ts` › does not let the SPA fallback shadow unknown /api routes |
| FR-API-15 | Хранилище за интерфейсом | Состояние в памяти за `Repository` (ADR-0003) | as-is | `api.test.ts` (весь набор на `InMemoryRepository`) |

## 7. Требования FR-DEPLOY (деплой и Hexlet-контракт)

| ID | Требование | Критерий приёмки | Статус | Проверка |
|----|-----------|------------------|--------|----------|
| FR-DEPLOY-1 | Единый образ | Fastify отдаёт `/api` и статику, SPA-fallback на index.html; порт 3000 (ADR-0005) | as-is | `static.test.ts` › serves index.html at /; falls back to index.html for a client-side deep link; still serves the API when the static root exists |
| FR-DEPLOY-2 | Наш docker-compose | `docker-compose.yml` с сервисом `app` (образ из Dockerfile, порт 3000) для локального запуска/демо. **Не то, что читает чекер** (compose из харнесса, ADR-0006) | to-be | Ручная приёмка (`docker compose up`) |
| FR-DEPLOY-3 | Makefile | Корневой `Makefile`: `setup` (`npm ci`), `test` (`npm run test`), `lint`, `build`, `artifacts` | to-be | Ручная приёмка (`make setup && make test`) |
| FR-DEPLOY-4 | Имя пакета | Корневой `package.json` name = `@hexlet/code` | to-be | Ручная приёмка (проверка чекером) |
| FR-DEPLOY-5 | Артефакты | `make artifacts` пишет junit/JSON в `tmp/artifacts/test/`; asciinema в `tmp/artifacts/demo/*.cast`; скриншоты в `tmp/artifacts/screens/*` — вручную | to-be | Ручная приёмка (наличие вложенных путей) |
| FR-DEPLOY-6 | Gitignore артефактов | `tmp/artifacts/test/*` игнорируется; `demo/` и `screens/` коммитятся | to-be | Ручная приёмка |
| FR-DEPLOY-7 | Runtime-контракт | Порт 3000; `GET /api/health`; env `PORT`/`HOST`/`STATIC_ROOT` с дефолтами | as-is | `app.test.ts` › starts the server and responds with 200 on GET /api/health |
| FR-DEPLOY-8 | README | Рабочие блоки Установка/Использование + ссылка на asciinema | to-be | Ручная приёмка |
| FR-DEPLOY-9 | Asciinema-демо | Запись ключевого сценария (guest-бронирование), вложена в `tmp/artifacts/demo/` | to-be | Ручная приёмка |
| FR-DEPLOY-10 | hexlet-check.yml | Файл не изменён/не удалён | as-is | Ручная приёмка |
| FR-DEPLOY-11 | Docker-контекст | `.dockerignore` (as-is) действует только на наш `docker build`; чекер монтирует весь checkout в `source/code` | as-is | Ручная приёмка |

## 8. Out of scope

- Отмена и редактирование встреч (только создание брони).
- Авторизация / мультихостинг (ADR-0004: один Host, без auth).
- Интеграция с внешними календарями (Google Calendar).
- Отправка email-уведомлений.

## 9. Приложение А — схемы API (JSON)

Все маршруты под `/api`. Ошибка: `{ "error": { "code": "...", "message": "..." } }`.

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

Запрос:

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

Запрос (полная замена; отсутствие дня = недоступен):

```json
{ "mon": [{ "start": "10:00", "end": "12:00" }] }
```

200: сохранённое значение. 400 — неизвестный день, не-массив или не-`HH:MM`:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "unknown weekday: funday" } }
```

### GET /api/slots?eventTypeId=&from=&to=

`from`/`to` опциональны (ISO-8601). 200:

```json
[
  { "start": "2026-10-21T09:00:00.000Z", "end": "2026-10-21T09:15:00.000Z" }
]
```

400 (нет `eventTypeId`):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "eventTypeId is required" } }
```

404 (неизвестный тип):

```json
{ "error": { "code": "NOT_FOUND", "message": "unknown event type" } }
```

### POST /api/bookings

Запрос:

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

409 (слот недоступен/занят):

```json
{ "error": { "code": "CONFLICT", "message": "requested slot is not available" } }
```

## 10. Приложение Б — карта проверок

56 автотестов: 33 frontend (`frontend/test/`) + 23 backend (`backend/test/`). Прогон: `npm run test` (vitest, projects `backend`/`frontend`). Требования `gap` и `to-be` проверяются ручной приёмкой (см. столбец «Проверка»).

## 11. Приложение В — индекс ADR

- ADR-0001 — один часовой пояс (UTC).
- ADR-0002 — вычисляемые слоты.
- ADR-0003 — in-memory репозиторий за `Repository`.
- ADR-0004 — один Host без аутентификации.
- ADR-0005 — единый контейнер.
- ADR-0006 — адаптация к формату Hexlet-чекера.
