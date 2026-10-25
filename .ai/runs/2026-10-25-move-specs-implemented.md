# Przeniesienie specyfikacji migracji i testów e2e do `implemented/`

- **Status:** done
- **Start / koniec:** 2026-10-25 02:15 / 2026-10-25 02:20
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/implemented/2026-10-25-monorepo-migration.md, .ai/specs/implemented/2026-10-25-e2e-playwright.md
- **Gałąź / commity:** chore/specs-implemented
- **Poprzedni przebieg:** .ai/runs/2026-10-25-e2e-playwright-docker.md

## Cel

Po scaleniu PR #1 do `main` przenieść obie specyfikacje do `implemented/` ze statusem `implemented` (AGENTS.md: „Wdrożona, kod na gałęzi głównej”).

## Przebieg

- `gh pr view 1`: MERGED, merge commit d95408d. Lokalny `main` zaktualizowany (`git pull --ff-only`).
- Gałąź `chore/specs-implemented` z `main`; `git mv` obu specyfikacji do `.ai/specs/implemented/`, status `implemented`, wpis w „Decyzje i zmiany”.
- Zaktualizowane ścieżki do specyfikacji w README.md, AGENTS.md, w lekcjach i w samych specyfikacjach. Zamkniętych logów przebiegów nie zmieniano (zawierają historyczne ścieżki).

## Weryfikacja

- `npm run lint` — 0. Zmiana dotyczy wyłącznie plików Markdown, więc typecheck, build i testy e2e nie są potrzebne.

## Wynik

Obie specyfikacje są w `implemented/` ze statusem `implemented`.

## Następne kroki / blokery

- Scalenie gałęzi `chore/specs-implemented` (PR) do `main`.

## Wnioski

Brak nowych.
