# Wdrożenie `npm run setup` (issue #6)

- **Status:** in-progress
- **Start / koniec:** 2026-10-25 / —
- **Agent / model:** Claude Code / claude-opus-5-5 (`om-auto-fix-issue 6` → `om-auto-implement-spec` → `om-auto-create-pr`)
- **Specyfikacja:** .ai/specs/2026-10-25-local-setup-command.md (zatwierdzona, PR #7)
- **Gałąź / commity:** feat/local-setup-command (na bazie spec/local-setup-command)
- **Poprzedni przebieg:** .ai/runs/2026-10-25-local-setup-command-spec.md

Source doc: .ai/specs/2026-10-25-local-setup-command.md

## Cel

`npm run setup` instaluje zależności, tworzy `.env` z `AUTH_SECRET`, uruchamia PostgreSQL i wykonuje migracje; przy ponownym uruchomieniu pomija wykonane kroki. Kryteria akceptacji: sekcja „Wymagania i kryteria akceptacji” specyfikacji.

## Zakres

- `scripts/setup.mjs`, `scripts/setup/steps.mjs`, `scripts/setup/deps.mjs` i ich testy.
- `package.json` (skrypt `setup`), `vitest.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `docker-compose.yml` (`name: devmentor`).
- `README.md`, `BACKWARD_COMPATIBILITY.md`, przeniesienie specyfikacji do `implemented/`.

Poza zakresem: przeglądarki testowe, `db:user:promote`, `npm run dev`, instalacja Node.js/Dockera.

Gałąź wychodzi z `spec/local-setup-command`, a nie z `main`: AGENTS.md wymaga, żeby specyfikacja trafiła do `implemented/` w tym samym commicie co kod. Po scaleniu #7 diff tego PR zawęża się do implementacji.

## Ryzyka

- Format `docker compose ps --format json` różni się między wersjami Compose (tablica albo NDJSON); parser obsługuje oba, a nieczytelny wynik oznacza `up --wait`.
- Wykrywanie oczekujących migracji opiera się na komunikacie MikroORM CLI `No pending migrations`; zmiana tekstu daje bezpieczne „wykonaj migracje”.
- `name: devmentor` łączy bazy wszystkich worktree; dla głównego katalogu `DevMentor` nazwa projektu się nie zmienia.

## Przebieg

- Plan zapisany; implementacja fazami niżej.

## Weryfikacja

Do uzupełnienia po bramce walidacji.

## Wynik

Do uzupełnienia.

## Następne kroki / blokery

Do uzupełnienia.

## Wnioski

Do uzupełnienia.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Konfiguracja narzędzi dla `scripts/`

- [ ] 1.1 Projekt Vitest `scripts`, `coverage.include`, `tsconfig.json`, reguła ESLint importów, `name: devmentor` w Compose

### Phase 2: Logika kroków

- [ ] 2.1 Sprawdzenia wstępne Node.js i Docker
- [ ] 2.2 Kroki npm install, `.env`, PostgreSQL, migracje z wykrywaniem „pominięto”

### Phase 3: Punkt wejścia i skrypt npm

- [ ] 3.1 `deps.mjs`, `setup.mjs`, skrypt `setup` w `package.json`

### Phase 4: Dokumentacja i weryfikacja

- [ ] 4.1 `README.md` i `BACKWARD_COMPATIBILITY.md`
- [ ] 4.2 Weryfikacja ręczna w świeżym klonie (dwa uruchomienia, brak Dockera)
- [ ] 4.3 Specyfikacja do `implemented/`, domknięcie logu
