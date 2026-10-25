# Zadanie e2e w CI i PR z konfiguracją CI

- **Status:** blocked
- **Start / koniec:** 2026-10-25 03:45 / —
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-github-ci-and-test-coverage.md
- **Gałąź / commity:** cez/8cc8bb8e (kontynuacja `.ai/runs/2026-10-25-github-ci-and-coverage.md`, commit 4043ac3)

## Cel

Decyzje człowieka po poprzednim przebiegu: dodać `npm run test:e2e` do CI, wypchnąć gałąź i otworzyć PR, doprowadzić CI do zielonego stanu.

## Przebieg

- Dodane zadanie `e2e` w `.github/workflows/ci.yml`: kontener usługi `postgres:17`, `db:migrate`, `npx playwright install --with-deps chromium`, `npm run test:e2e` z `DATABASE_URL`.
- Sprawdzone lokalnie z równoważnym kontenerem `postgres:17` (`docker run`, port 55432) i `CI=true`: migracje i e2e 16/16 (wcześniej bez bazy 11 + 5 pominiętych).
- Spec (zakres, kryterium 5, decyzja), AGENTS.md i README zaktualizowane. Commit 7d63e17.
- `git push -u origin cez/8cc8bb8e` odrzucony: „refusing to allow an OAuth App to create or update workflow `.github/workflows/ci.yml` without `workflow` scope”. Token `gh` ma zakresy `gist`, `read:org`, `repo`. Nie obchodziłem blokady (np. pushem bez `ci.yml`); PR nie powstał.

## Weryfikacja

- `npm run db:migrate` i `npm run test:e2e` z `DATABASE_URL` do lokalnego `postgres:17` i `CI=true`: 0, 16 passed.
- `npm run lint`: 0. YAML workflow sparsowany (5 zadań).
- Przebieg na GitHub Actions: nie sprawdzony (push zablokowany).

## Wynik

Zadanie `e2e` dodane i sprawdzone lokalnie, oba commity są lokalnie na `cez/8cc8bb8e`. Push i PR zablokowane brakiem zakresu `workflow` w tokenie GitHub.

## Następne kroki / blokery

- Człowiek: `gh auth refresh -h github.com -s workflow` (interaktywne logowanie w przeglądarce).
- Potem: `git push -u origin cez/8cc8bb8e`, `gh pr create --base main`, obserwacja pierwszego przebiegu CI i ewentualne poprawki (nowy przebieg w `.ai/runs/`).

## Wnioski
