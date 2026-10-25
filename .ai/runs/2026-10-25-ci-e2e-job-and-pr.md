# Zadanie e2e w CI i PR z konfiguracją CI

- **Status:** in-progress
- **Start / koniec:** 2026-10-25 03:45 / —
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-github-ci-and-test-coverage.md
- **Gałąź / commity:** cez/8cc8bb8e (kontynuacja `.ai/runs/2026-10-25-github-ci-and-coverage.md`, commit 4043ac3)

## Cel

Decyzje człowieka po poprzednim przebiegu: dodać `npm run test:e2e` do CI, wypchnąć gałąź i otworzyć PR, doprowadzić CI do zielonego stanu.

## Przebieg

- Dodane zadanie `e2e` w `.github/workflows/ci.yml`: kontener usługi `postgres:17`, `db:migrate`, `npx playwright install --with-deps chromium`, `npm run test:e2e` z `DATABASE_URL`.
- Sprawdzone lokalnie z równoważnym kontenerem `postgres:17` (`docker run`, port 55432) i `CI=true`: migracje i e2e 16/16 (wcześniej bez bazy 11 + 5 pominiętych).
- Spec (zakres, kryterium 5, decyzja), AGENTS.md i README zaktualizowane.

## Weryfikacja

## Wynik

## Następne kroki / blokery

## Wnioski
