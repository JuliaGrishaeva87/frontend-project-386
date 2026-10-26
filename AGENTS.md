# AGENTS.md

## Команды

- Установка зависимостей: `npm install`
- Запуск dev-серверов (frontend + backend): `npm run dev`
- Линтер: `npm run lint`
- Форматирование: `npm run format`
- Тесты: `npm run test`
- Браузерные тесты: `npm run test:e2e` (Playwright + Chromium; перед первым запуском `npx playwright install chromium`). В WSL1 браузеры нестабильны — проверка в CI.
- Проверка публичного деплоя теми же сценариями: `E2E_BASE_URL=https://<app>.onrender.com npm run test:e2e` (локальный сервер не поднимается).
- Контракт и SDK: `npm run contract:generate` (TypeSpec → OpenAPI → TS-схема), проверка дрейфа в CI — `npm run contract:check`
- Hexlet-контракт (ADR-0006): `make setup`, затем `make test` (пишет отчёты в `tmp/artifacts/test/`)

## Правила

- Все коммиты должны строго следовать спецификации Conventional Commits (feat:, fix:, chore:, docs: и т.д.).

## Agent skills

### Issue tracker

Задачи и спецификации живут в GitHub Issues репозитория `JuliaGrishaeva87/frontend-project-386`, через CLI `gh`. См. `docs/agents/issue-tracker.md`.

### Triage labels

Метки триажа используют значения по умолчанию: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Единый домен: корневой `GLOSSARY.md` и `docs/adr/`. См. `docs/agents/domain.md`.
