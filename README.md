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

Публичный URL: https://frontend-project-386.onrender.com.

Образ собирается из корневого `Dockerfile`; контейнер слушает порт из переменной `PORT` (`3000` по умолчанию), frontend и API отдаются с одного origin.

**MCP-конфигурация (без секретов):** в корне репозитория лежит `opencode.json` с проектной конфигурацией для OpenCode. В нём настроен remote MCP-сервер `render` (`https://mcp.render.com/mcp`) с `oauth: {}`. 

**Порядок подключения и выката (OpenCode):**

1. Запусти `opencode` из корня репозитория (там, где лежит `opencode.json`).
2. `opencode mcp auth render` — откроется браузер для OAuth-входа в Render; если браузер не открылся, скопируй ссылку из вывода.
3. Данные сессии и токены хранятся вне репозитория (например, `~/.local/share/opencode/mcp-auth.json`) и **не добавляются** в Git. При необходимости API-ключ можно передавать через переменную окружения (например, через `headers` с `{env:...}`), при этом реальные ключи не должны попадать в репозиторий.
4. Перезапусти `opencode` из корня репозитория и попроси агента создать проект из `JuliaGrishaeva87/frontend-project-386` (ветка `main`), собрать образ по корневому `Dockerfile`, запустить сервис с переменной `PORT` и выпустить публичный домен.
5. Если с Render возникнут проблемы (требуется оплата/недоступен), можно переключиться на `railway` MCP по аналогичному сценарию. Для проверки платформы не важны — нужен работающий Docker-образ, запуск по `PORT` и публичная ссылка.

**Данные.** Backend хранит встречи, виды событий и доступность в памяти процесса. После перезапуска контейнера, редеплоя или остановки сервиса данные **сбрасываются** к начальному состоянию; постоянного хранилища нет.

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
