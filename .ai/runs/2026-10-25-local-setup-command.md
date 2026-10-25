# Wdrożenie `npm run setup` (issue #6)

- **Status:** done
- **Start / koniec:** 2026-10-25 / 2026-10-25
- **Agent / model:** Claude Code / claude-opus-5-5 (`om-auto-fix-issue 6` → `om-auto-implement-spec` → `om-auto-create-pr`)
- **Specyfikacja:** .ai/specs/2026-10-25-local-setup-command.md (zatwierdzona, PR #7)
- **Gałąź / commity:** feat/local-setup-command (na bazie spec/local-setup-command), PR #8
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

- Plan zapisany, PR #8 otwarty jako draft i przejęty (`in-progress`).
- Fazy 1–3: konfiguracja narzędzi (projekt Vitest `scripts`, `coverage.include`, `tsconfig.json`, reguła ESLint importów, `name: devmentor`), logika kroków z testami, punkt wejścia i skrypt `setup`. Sondy potwierdziły, że reguła ESLint odrzuca import `vitest` w `scripts/`, a `tsc` zgłasza błąd typu w pliku z `// @ts-check`.
- Faza 4: README, `BACKWARD_COMPATIBILITY.md`, AGENTS.md (komendy bazy, zakres reguły 100% pokrycia o `scripts/`), specyfikacja przeniesiona do `implemented/`.
- Pierwsza próba ścieżki „brak Dockera” dała kod 254: w okrojonym `PATH` brakowało `sh`, którego potrzebuje npm. To był błąd testu ręcznego, a nie skryptu; po dodaniu `sh` wynik był zgodny z oczekiwanym.
- Przegląd kodu w świeżym kontekście (`om-code-review`): approve, 4 minor i 4 nit. Poprawione: o pustym `AUTH_SECRET` rozstrzyga `util.parseEnv` z Node.js (spacje, komentarze `#`); dowiązanie symboliczne `.env` aktualizowane w miejscu docelowym; brak `package-lock.json` → instalacja; README opisuje przejście ze starej nazwy projektu Compose; komentarz o `shell: true` na Windows; specyfikacja wyrównana z kodem. Import `node:util` jako przestrzeń nazw, żeby Node.js < 20.12 dotarł do czytelnego komunikatu o wersji, zamiast paść na imporcie.
- Ostrzeżenie DEP0190 (argumenty z `shell: true` w Node 24 na Windows) zostawione: argumenty są stałe, a test na Windows nie był uruchamiany.

## Weryfikacja

- `npm run lint` 0, `npm run typecheck` 0, `npm run audit` 0, `npm run test` 0 (59 plików, 100% linii, gałęzi, funkcji i instrukcji; po poprawkach z przeglądu ponownie lint/typecheck/test 0, 691/691 instrukcji), `npm run build` 0.
- `npm run test:integration` 0 (testcontainers, ok. 240 s). `npm run test:e2e` 0: 11 passed, 5 skipped. Scenariusze z bazą zostały pominięte, bo w worktree nie było `.env` z `DATABASE_URL`.
- Ręcznie, świeży klon (`git clone` gałęzi do `/tmp/dm-clone`), Node.js 24.21.0, Docker Compose v5.5.1:
  - Pierwsze uruchomienie: kod 0; zależności zainstalowane, `.env` utworzony (tryb 600, `AUTH_SECRET` = 32 bajty po zdekodowaniu, sekretu brak w wyjściu), PostgreSQL uruchomiony. Migracje pominięte, bo współdzielona baza `devmentor` była już zmigrowana; to potwierdza rozpoznanie komunikatu MikroORM `No pending migrations` na prawdziwym CLI.
  - Drugie uruchomienie: kod 0, cztery kroki „pominięto”, `.env` bez zmian (ten sam `sha256sum` i `mtime`), brak `.env.setup-tmp`.
  - `PATH` bez `docker`: kod 1, „✖ Docker: nie znaleziono Dockera z Compose…”, `.env` nie powstał.
  - Istniejący `.env` z `CUSTOM=keep`, pustym `AUTH_SECRET` i trybem 640: kod 0, sekret uzupełniony, `CUSTOM=keep` zachowane, tryb 640.
- Ręcznie, worktree: `.env` jako dowiązanie do pliku z `AUTH_SECRET= # todo`: sekret zapisany w pliku docelowym, `.env` nadal jest dowiązaniem, kolejne uruchomienie dało 4× „pominięto”.
- Nie sprawdzone na prawdziwym systemie: Windows, Node.js starszy niż 22.17 (pokryte testem jednostkowym), niedziałający demon Dockera (pokryte testem jednostkowym), ścieżka wykonania migracji na pustej bazie (pokryta testem jednostkowym; nie uruchamiałem drugiej bazy, bo port 5432 jest wspólny).
- Po testach kontener `devmentor-postgres-1` zatrzymany (stan sprzed przebiegu), a klon i pliki tymczasowe usunięte.

## Wynik

`npm run setup` działa zgodnie z kryteriami specyfikacji (`.ai/specs/implemented/2026-10-25-local-setup-command.md`). PR #8 (`Closes #6`) ma pełną bramkę walidacji na zielono.

## Następne kroki / blokery

- Scalić PR #7 (specyfikacja), potem PR #8. PR #8 wychodzi z gałęzi specyfikacji, więc po scaleniu #7 jego diff obejmie tylko implementację.
- Opcjonalnie: sprawdzić `npm run setup` na Windows.

## Wnioski

- Zaktualizowano [Skille `om-*` dostarcza cezar przy starcie zadania](../lessons/2026-10-25-cezar-provisions-om-skills.md): gdy łańcuch musi wywołać nieobecny skill, instalujesz go do `.ai/skills/` (korekta od człowieka).

## Progress

PR: #8

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Konfiguracja narzędzi dla `scripts/`

- [x] 1.1 Projekt Vitest `scripts`, `coverage.include`, `tsconfig.json`, reguła ESLint importów, `name: devmentor` w Compose — 38abe89

### Phase 2: Logika kroków

- [x] 2.1 Sprawdzenia wstępne Node.js i Docker — e3e52a1
- [x] 2.2 Kroki npm install, `.env`, PostgreSQL, migracje z wykrywaniem „pominięto” — e3e52a1

### Phase 3: Punkt wejścia i skrypt npm

- [x] 3.1 `deps.mjs`, `setup.mjs`, skrypt `setup` w `package.json` — bcd1c24

### Phase 4: Dokumentacja i weryfikacja

- [x] 4.1 `README.md` i `BACKWARD_COMPATIBILITY.md` — 434d0af
- [x] 4.2 Weryfikacja ręczna w świeżym klonie (dwa uruchomienia, brak Dockera) — 434d0af
- [x] 4.3 Specyfikacja do `implemented/`, domknięcie logu — 95b46b3
