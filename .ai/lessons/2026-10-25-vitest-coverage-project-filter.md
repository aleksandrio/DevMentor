# Vitest 5: `--project` razem z `--coverage` nie zbiera pokrycia

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-github-ci-and-coverage.md`
- **Tagi:** vitest, testy, pokrycie

## Kontekst

Vitest działa w trybie projektów z katalogu głównego (`test.projects: ["packages/*"]`), a pokrycie (`@vitest/coverage-v8`, próg 100%) jest skonfigurowane w głównym `vitest.config.ts`.

## Co się stało / objaw

`npx vitest run --project core --coverage` przechodzi testy, ale raport pokazuje `Unknown% (0/0)` dla wszystkich plików. To samo daje `--coverage.include=...` podane w CLI. Bez filtra projektu pokrycie jest liczone poprawnie.

## Przyczyna

Nie ustalono w kodzie Vitest. Zachowanie jest powtarzalne w Vitest 5.0.5.

## Rozwiązanie

Fragment repozytorium filtruje się ścieżką: `npx vitest run packages/core --coverage`. Raport tekstowy pomija pliki w pełni pokryte, więc brak wiersza oznacza 100%.

## Reguła na przyszłość

Pokrycie części repozytorium mierz filtrem ścieżki (`npx vitest run packages/<pakiet> --coverage`), nigdy przez `--project`. Wynik `0/0` przy zielonych testach to objaw tego problemu, a nie brak testów.
