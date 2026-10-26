# Календарь звонков

[![hexlet-check](https://github.com/JuliaGrishaeva87/frontend-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/JuliaGrishaeva87/frontend-project-386/actions)

Сервис бронирования календаря: владелец настраивает виды событий и доступность, гость выбирает свободный слот на ближайшие 14 дней и записывается.

Учебный проект Хекслета: https://ru.hexlet.io/programs/frontend
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Fastify, TypeScript (данные хранятся в памяти процесса)
- Тесты: Vitest, Testing Library
- Node.js 22+

## Установка

```bash
git clone https://github.com/JuliaGrishaeva87/frontend-project-386.git
cd frontend-project-386
npm ci
```

Требуется Node.js 22 или новее.

Переменные окружения backend:

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `PORT` | `3000` | Порт HTTP-сервера |
| `HOST` | `0.0.0.0` | Адрес, на котором слушает сервер |
| `STATIC_ROOT` | `public` рядом с `backend/dist` | Каталог собранного frontend |

## Использование

### Локальная разработка

```bash
npm run dev
```

Backend поднимается на `http://localhost:3000`, Vite — на `http://localhost:5173` с прокси `/api → localhost:3000`. В dev-режиме frontend работает через встроенный in-memory мок: данные живут до перезагрузки страницы.

Проверки:

```bash
npm run test   # 98 автотестов, отчёты в tmp/artifacts/test/
npm run lint
npm run build
```

Или через `make`: `make setup`, `make test`, `make lint`, `make build`.

Браузерные тесты (Playwright, Chromium) против production-сборки и реального API:

```bash
npx playwright install chromium   # один раз
npm run test:e2e
```

Playwright сам собирает приложение и поднимает сервер на `http://127.0.0.1:3100`. Сценарии: запись гостя и встреча у владельца, слот, занятый после загрузки страницы, время, занятое другим типом встречи. В WSL1 браузеры нестабильны — эталонный прогон идёт в CI.

API-контракт описан в TypeSpec (`typespec/main.tsp`). После его правки:

```bash
npm run contract:generate   # TypeSpec → OpenAPI → TypeScript SDK
```

Сгенерированные файлы (`typespec/openapi/openapi.json`, `frontend/src/api/generated/schema.d.ts`) коммитятся; CI проверяет, что они не разошлись с контрактом.

### Production: один процесс

```bash
npm run build
STATIC_ROOT="$(pwd)/frontend/dist" node backend/dist/server.js
```

Frontend и API отдаются с одного origin: `http://localhost:3000`. Здесь frontend ходит в реальный backend, данные хранятся в памяти процесса и теряются при перезапуске.

### Docker

```bash
docker compose up --build
```

Приложение доступно на `http://localhost:3000`.

### Публичный деплой (Render)

Публичный URL: _будет добавлен после выката_.

Образ собирается из корневого `Dockerfile`; контейнер слушает порт из переменной `PORT`, frontend и API отдаются с одного origin. MCP-конфигурация агента лежит в `opencode.json` (сервер `render`, вход по OAuth); секретов в репозитории нет.

Порядок подключения и выката:

1. Запустите команды из корня репозитория (там, где лежит `opencode.json`).
2. `opencode mcp auth render` — откроется браузер для входа в Render; если браузер не открылся, скопируйте ссылку из вывода команды.
3. Токены OAuth opencode хранит вне репозитория, в `~/.local/share/opencode/mcp-auth.json`; в Git они не попадают.
4. Перезапустите opencode из корня репозитория (конфигурация читается при старте) и попросите агента создать web service из `JuliaGrishaeva87/frontend-project-386`: ветка `main`, окружение Docker, порт — из переменной `PORT`, которую задаёт платформа.
5. Публичный URL из Render добавьте в начало этого раздела.

Вместо OAuth можно использовать API-ключ из переменной окружения: `"oauth": false` и `"headers": { "Authorization": "Bearer {env:RENDER_API_KEY}" }`. Файлы `.env*` исключены из Git; ключи в репозиторий не коммитятся.

Если Render требует оплату или недоступен, тот же образ можно выкатить на Railway по официальной инструкции Railway MCP — требования те же: Docker, запуск по `PORT`, публичный URL.

**Данные.** Backend хранит встречи, виды событий и доступность в памяти процесса. После перезапуска контейнера, редеплоя или засыпания бесплатного инстанса Render данные сбрасываются к начальному состоянию; постоянного хранилища нет.

### Демо

Запись ключевого сценария — гость открывает календарь, выбирает свободный слот и бронирует его — лежит в `tmp/artifacts/demo/`. Скриншоты — в `tmp/artifacts/screens/`.

<!-- Ссылка на asciinema добавляется после записи (см. tmp/artifacts/demo/). -->

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
