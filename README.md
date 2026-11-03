# Календарь звонков

[![hexlet-check](https://github.com/JuliaGrishaeva87/frontend-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/JuliaGrishaeva87/frontend-project-386/actions)

Сервис бронирования календаря: владелец настраивает виды событий и доступность, гость выбирает свободный слот на ближайшие 14 дней и записывается.

Учебный проект Хекслета: https://ru.hexlet.io/programs/frontend  
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Fastify, TypeScript
- **Тесты:** Vitest, Testing Library, Playwright (E2E)
- **Node.js:** 22+

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

Playwright сам собирает приложение и поднимает сервер на `http://127.0.0.1:3100`. Сценарии: запись гостя и встреча у владельца, слот, занятый после загрузки страницы, время, занятое другим типом встречи.

### API-контракт

API-контракт описан в TypeSpec (`typespec/main.tsp`). После его правки генерация запускается командой:

```bash
npm run contract:generate   # TypeSpec → OpenAPI → TypeScript SDK
```

Сгенерированные файлы (`typespec/openapi/openapi.json`, `frontend/src/api/generated/schema.d.ts`) коммитятся; CI проверяет, что они не разошлись с контрактом. Ручные правки в сгенерированных файлах запрещены.

### Production: один процесс

```bash
npm run build
STATIC_ROOT="\$(pwd)/frontend/dist" node backend/dist/server.js
```

Frontend и API отдаются с одного origin: `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

Приложение собирается из корневого `Dockerfile` и становится доступно локально на `http://localhost:3000`.

## Публичный деплой

Приложение развернуто в облаке продакшена.
- **Публичный URL:** https://frontend-project-386.onrender.com

### Хранение данных и ограничения
Backend хранит встречи, виды событий и доступность **строго в памяти процесса (in-memory)**. Постоянная база данных отсутствует. Любой перезапуск контейнера, остановка или редеплой сервиса на платформе **полностью сбрасывают данные** к начальному состоянию.

### Настройка и подключение MCP (OpenCode)
Конфигурация для ИИ-агента описана в безопасном формате без секретов в файле `opencode.json` в корне проекта. Для автоматизации процессов используется remote MCP-сервер Render (`https://render.com`) через OAuth-вход.

Порядок подключения:
1. Запустить `opencode` из корня репозитория.
2. Выполнить команду авторизации: `opencode mcp auth render`.
3. Завершить OAuth-вход в открывшемся окне браузера.
*Все токены и данные сессии сохраняются локально на машине пользователя (`~/.local/share/opencode/`) и исключены из репозитория Git.*

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.

