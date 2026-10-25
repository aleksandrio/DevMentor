# GitHub CI, 100% pokrycia testami jednostkowymi i testy integracyjne

- **Status:** done
- **Start / koniec:** 2026-10-25 02:37 / 2026-10-25 03:38
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-github-ci-and-test-coverage.md
- **Gałąź / commity:** cez/8cc8bb8e

## Cel

CI na GitHub Actions dla każdego PR (build, lint, testy jednostkowe, testy integracyjne z PostgreSQL z testcontainers i `agent-browser`), zasada 100% pokrycia w AGENTS.md, testy jednostkowe dające 100% pokrycia istniejącego kodu.

## Przebieg

- Przeczytane `.ai/lessons.md`, specyfikacje standardów i e2e, cały kod źródłowy. Stan wyjściowy: lint, typecheck i 33 testy Vitest w `core` przechodzą. Docker 29.8.1 dostępny lokalnie.
- `agent-browser` 0.39.2 wymaga Node.js ≥ 24 (lokalnie 24.21.0); paczka npm zawiera binarki dla wszystkich platform. npm 11 blokuje skrypty instalacyjne (`agent-browser`, `ssh2`, `protobufjs`), ale nie są potrzebne: binarka jest w paczce, a `ssh2` ma fallback w JS.
- Vitest przeniesiony do katalogu głównego (tryb projektów, `@vitest/coverage-v8`, progi 100%). Pierwsza próba dała ostrzeżenia Vite o ESM ładowanym jako CommonJS; poprawione przez `"type": "module"` w głównym `package.json`, `test/vitest-shared.mjs` i `packages/app/vitest.config.mts`.
- Pierwszy `app:ephemeral` padł w `next build`: typecheck Next obejmuje `vitest.config.mts` i odrzucił `NODE_ENV: string`. Poprawione przez `@type {const}`. Kontener PostgreSQL został usunięty mimo błędu.
- `agent-browser doctor` padał z „Socket path too long” (długi `TMPDIR` agenta); z `TMPDIR=/tmp` działa.
- Testy integracyjne: `core` przeszły od razu (10/10 z testami `app`), jeden test przeglądarkowy padał, bo `wait --url` dopasowuje wzorzec i wracał przed końcem rejestracji. Zamienione na `wait --fn`. Typy `provide`/`inject` przeniesione do `test/integration/context.ts`, bo `next build` sprawdza typy także w `packages/app/integration/`.
- Testy jednostkowe `ui` i `app` zlecone dwóm sub-agentom (rozłączne pliki `*.test.*`), `core` i `db` napisane w głównym przebiegu. `--project` z `--coverage` daje 0/0 (wniosek zapisany); pomiar przez filtr ścieżki.
- `core` + `db`: 100% po dopisaniu testów i usunięciu nieosiągalnej gałęzi w `rate-limit.ts`. `ui`: 100% (sub-agent, 14 plików testów). Typecheck `ui` wymagał dodania `test/dom-setup.ts` do `tsconfig.json`.
- `app`: 100% (sub-agent, 21 plików testów). Testy tras i `server/*` mają `// @vitest-environment node`, bo w `jsdom` `jose` odrzuca klucz (`Uint8Array` z innego realmu). Sprawdziłem, że sub-agenci nie zmienili kodu źródłowego i nie dodali komentarzy `v8 ignore`.
- AGENTS.md: zasada 100% pokrycia w „Jakość kodu i przegląd”, nowa sekcja „Testy”, wiersz stosu, katalog `test/`. CLAUDE.md i README zaktualizowane.

## Weryfikacja

Wszystko w katalogu głównym, kody wyjścia sprawdzone bezpośrednio:

- `npm run lint`: 0.
- `npm run typecheck`: 0.
- `npm run test`: 0, 56 plików, 226 testów, pokrycie 100% (instrukcje 580/580, gałęzie 257/257, funkcje 190/190, linie 575/575).
- `npm run audit`: 0, 0 podatności.
- `npm run build` bez `DATABASE_URL`: 0.
- `npm run test:integration`: 0, 10 testów (6 `core` na PostgreSQL 17 z testcontainers, 4 przeglądarkowe przez `agent-browser`). Kontener usunięty po przebiegu.
- `npm run test:e2e`: 0, 11 passed, 5 skipped (brak `.env`, więc bez scenariuszy z bazą).
- `npm run app:ephemeral`: uruchomione ręcznie, rejestracja przez `agent-browser` działa, `Ctrl+C` zatrzymuje serwer i usuwa kontener.
- `.github/workflows/ci.yml` sparsowany jako YAML (4 zadania). **Nie sprawdzone:** przebieg na GitHub Actions (gałąź nie była wypchnięta), w tym `npx agent-browser install --with-deps` na `ubuntu-latest`.

## Wynik

CI dla każdego PR (lint + typecheck + audit, testy jednostkowe z progiem 100%, build, testy integracyjne), Vitest dla wszystkich pakietów z pokryciem 100%, harness integracyjny (testcontainers + `agent-browser`) ze skryptem `app:ephemeral`, zasada 100% pokrycia w AGENTS.md.

## Następne kroki / blokery

- Wypchnąć gałąź i otworzyć PR, żeby zobaczyć pierwszy przebieg CI.
- Decyzja człowieka: czy dodać `npm run test:e2e` do CI (otwarte pytanie w specyfikacji).
- Po scaleniu do `main`: specyfikację przenieść do `implemented/`.

## Wnioski

- `.ai/lessons/2026-10-25-agent-browser-pitfalls.md`
- `.ai/lessons/2026-10-25-vitest-coverage-project-filter.md`
