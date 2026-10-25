# GitHub CI, testy jednostkowe ze 100% pokrycia i testy integracyjne na testcontainers

- **Status:** in-progress
- **Data:** 2026-10-25
- **Autor:** Claude Code (claude-opus-5-5), na polecenie Aleksandra Kowala
- **Powiązane:** `.ai/specs/2026-10-25-engineering-standards-adoption.md` (Vitest, bramka weryfikacji), `.ai/specs/implemented/2026-10-25-e2e-playwright.md`, `.ai/runs/2026-10-25-github-ci-and-coverage.md`

## Problem i cel

Repozytorium nie ma CI. Lint, typecheck, testy i build uruchamia lokalnie agent albo człowiek, więc nic nie pilnuje ich na pull requeście. Testy jednostkowe obejmują tylko część `core/src/http` i walidatory, a pozostałe pakiety (`db`, `ui`, `app`) nie mają ich wcale. Brakuje też testów integracyjnych na prawdziwym PostgreSQL i powtarzalnego sposobu na uruchomienie tymczasowej instancji aplikacji, którą agent może sprawdzić w przeglądarce.

Cel:

1. GitHub Actions na każdym pull requeście: lint (z typecheckiem), testy jednostkowe z progiem pokrycia, build i testy integracyjne.
2. Jeden framework testów jednostkowych dla całego monorepo (Vitest) z pomiarem pokrycia i progiem 100%.
3. Framework testów integracyjnych: PostgreSQL z testcontainers, migracje, zbudowana i uruchomiona aplikacja, testy przeglądarkowe przez `agent-browser`.
4. Zasada w AGENTS.md: każda nowa funkcja ma 100% pokrycia testami jednostkowymi.
5. Testy jednostkowe dla istniejącego kodu, które dają 100% pokrycia.

## Zakres (w zakresie / poza zakresem)

W zakresie:

- `.github/workflows/ci.yml` (wyzwalacze `pull_request` i `push` na `main`).
- Vitest uruchamiany z katalogu głównego w trybie projektów (`packages/*/vitest.config.ts`), `@vitest/coverage-v8`, progi 100% dla linii, gałęzi, funkcji i instrukcji.
- Środowisko `jsdom` z Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) dla pakietów `ui` i `app`.
- Zadanie CI `e2e`: Playwright (`npm run test:e2e`) z PostgreSQL jako kontenerem usługi GitHub Actions (decyzja człowieka, zob. „Decyzje i zmiany”).
- Testy integracyjne: `vitest.integration.config.ts`, harness w `test/integration/`, testy w `packages/core/integration/` i `packages/app/integration/`.
- Skrypt `npm run app:ephemeral`: tymczasowa baza z testcontainers i uruchomiona aplikacja do ręcznego albo agentowego sprawdzania przez `agent-browser`.
- Aktualizacja AGENTS.md (stos, zasada pokrycia, weryfikacja) i CLAUDE.md (skrót).

Poza zakresem:

- Deploy, publikacja raportów pokrycia w usługach zewnętrznych, ochrona gałęzi w ustawieniach GitHuba (to konfiguracja repozytorium, nie kod).
- Zmiany zachowania istniejącego kodu. Testy mogą ujawnić błąd: wtedy poprawka idzie z testem regresji i wpisem w „Decyzje i zmiany”.

## Wymagania i kryteria akceptacji

1. `npm run test` w katalogu głównym uruchamia testy jednostkowe wszystkich pakietów i kończy się błędem, gdy pokrycie linii, gałęzi, funkcji albo instrukcji spada poniżej 100%.
2. Pomiar pokrycia obejmuje `packages/*/src/**/*.{ts,tsx}`. Wyłączone są tylko: pliki testów, migracje MikroORM (generowane przez CLI; wykonują je testy integracyjne) i pliki zawierające wyłącznie typy (v8 nie raportuje dla nich kodu). Każde wyłączenie ma komentarz z uzasadnieniem w `vitest.config.ts`.
3. `npm run test:integration` uruchamia PostgreSQL w kontenerze (testcontainers), wykonuje `npm run db:migrate`, buduje aplikację, startuje `next start` na wolnym porcie i wykonuje testy integracyjne: serwisów `core` na prawdziwej bazie (w tym współbieżną rejestrację tego samego e-maila) oraz przepływów w przeglądarce przez `agent-browser`. Po zakończeniu kontener i serwer są zatrzymane.
4. `npm run app:ephemeral` robi to samo bez testów, wypisuje adres aplikacji i `DATABASE_URL`, działa do `Ctrl+C` i sprząta po sobie.
5. Workflow CI ma osobne zadania `lint` (lint, typecheck, audit), `unit` (testy z pokryciem), `build` (build bez bazy), `integration` i `e2e` (Playwright z bazą). Każde zadanie kończy się błędem przy błędzie kroku.
6. AGENTS.md zawiera jednoznaczną zasadę 100% pokrycia nowych funkcji testami jednostkowymi oraz opis obu warstw testów.
7. `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:integration` i `npm run test:e2e` przechodzą lokalnie.

## Projekt rozwiązania

### Testy jednostkowe

- Vitest jest już w stosie. Przenoszę go z `@devmentor/core` do katalogu głównego, bo uruchamia testy całego repozytorium i tylko tam da się skonfigurować pokrycie dla wszystkich projektów. Razem z nim w katalogu głównym jest `@vitest/coverage-v8`.
- Główny `vitest.config.ts`: `test.projects: ["packages/*"]` oraz `coverage` (provider `v8`, `include`, `exclude`, `thresholds` 100). Każdy pakiet ma `vitest.config.ts` z `defineProject`: `core` i `db` w środowisku `node`, `ui` i `app` w `jsdom`.
- Wspólny stub `server-only` jest w `test/server-only-stub.ts` w katalogu głównym, a każdy projekt aliasuje do niego `server-only`. W `app` jest też alias `@/` → `src/`.
- Testy leżą obok kodu (`*.test.ts`, `*.test.tsx`). Testy jednostkowe nie łączą się z bazą ani siecią: zależności zewnętrzne (MikroORM, `next/navigation`, `next/headers`, `fetch`) zastępują atrapy `vi.mock`/`vi.fn`.
- Trasy API w `app` testuje się jednostkowo przez atrapę `apiHandler`, która zwraca funkcję obsługi, i atrapy serwisów z kontekstu. Reszta `@devmentor/core` (`ApiResponse`, `parseBody`, `sessionCookie`) zostaje prawdziwa.
- Skrypt `npm run test` w katalogu głównym to `vitest run --coverage`. Pojedynczy plik albo pakiet uruchamia się przez `npx vitest run <ścieżka>` albo `npx vitest run --project <pakiet>` (bez progu pokrycia).

### Testy integracyjne

- `testcontainers` i `@testcontainers/postgresql` w katalogu głównym, obraz `postgres:17` (jak `docker-compose.yml`).
- `vitest.integration.config.ts` w katalogu głównym: `include: packages/*/integration/**/*.int.test.ts`, `globalSetup: test/integration/global-setup.ts`, środowisko `node`, dłuższe limity czasu.
- `test/integration/postgres.ts`: start kontenera i `npm run db:migrate` z jego `DATABASE_URL` (ta sama komenda co lokalnie).
- `test/integration/app-server.ts`: `next build`, potem `next start` na wolnym porcie z `DATABASE_URL`, testowym `AUTH_SECRET` i `NODE_ENV=production`; czeka na `/api/health`.
- `test/integration/global-setup.ts` uruchamia oba i przekazuje testom `databaseUrl` i `baseUrl` przez `provide`/`inject`. Sprzątanie zatrzymuje serwer i kontener.
- `test/integration/agent-browser.ts`: cienka nakładka na CLI `agent-browser` (`--session <unikalna> --json`, parsowanie odpowiedzi, błąd przy `success: false`). Każdy plik testów ma własną sesję przeglądarki.
- `test/integration/ephemeral-app.ts` (`npm run app:ephemeral`): te same moduły bez testów, do `Ctrl+C`.
- Testy `core` na bazie: `UserService` (rejestracja, konflikt e-maila, współbieżna rejestracja, logowanie, lista), `MikroOrmDatabaseHealthProbe`, `withScope` z prawdziwym kontenerem. Testy `app` przez `agent-browser`: rejestracja i przekierowanie, logowanie, `/admin/users` dla administratora (rola nadana `npm run db:user:promote`) i odmowa dla ucznia, `/api/health` z bazą „up”.
- `agent-browser` wymaga Node.js ≥ 24 (pole `engines` pakietu). Projekt dalej wymaga ≥ 22.17, ale CI i testy integracyjne używają Node.js 24. Przeglądarkę instaluje się raz: `npx agent-browser install` (na Linuksie w CI z `--with-deps`).
- Kod w `test/integration/` jest narzędziem całego repozytorium (jak `eslint.config.mjs`), a nie pakietem. Typecheck obejmuje go przez główny `tsconfig.json`.

### CI

- `.github/workflows/ci.yml`, `ubuntu-latest`, Node.js 24, `npm ci` z cache npm, `concurrency` anulujące poprzedni przebieg tego samego PR.
- Zadania: `lint` (`npm run lint`, `npm run typecheck`, `npm run audit`), `unit` (`npm run test`, raport pokrycia jako artefakt), `build` (`npm run build` bez `DATABASE_URL`), `integration` (`npx agent-browser install --with-deps`, `npm run test:integration`; Docker jest dostępny na `ubuntu-latest`), `e2e` (kontener usługi `postgres:17`, `npm run db:migrate`, `npx playwright install --with-deps chromium`, `npm run test:e2e` z `DATABASE_URL`, więc obejmuje też scenariusze z bazą; ślady Playwrighta jako artefakt przy błędzie).

## Plan wdrożenia i testów

1. Specyfikacja i log przebiegu.
2. Zależności, konfiguracje Vitest, przeniesienie istniejących testów `core` na nowy układ, skrypty w `package.json`.
3. Harness integracyjny, testy integracyjne, `app:ephemeral`, sprawdzenie lokalnie na Dockerze.
4. Workflow CI.
5. AGENTS.md i CLAUDE.md.
6. Testy jednostkowe do 100% pokrycia: `core`, `db`, `ui`, `app`.
7. Pełna bramka weryfikacji lokalnie (punkt 7 kryteriów), log przebiegu, wnioski.

## Otwarte pytania

Brak.

## Decyzje i zmiany

<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
- 2026-10-25: specyfikacja utworzona i od razu w realizacji. Człowiek wprost zlecił CI, framework testów jednostkowych i integracyjnych (testcontainers, `agent-browser`), zasadę 100% pokrycia i testy dla istniejącego kodu, co traktuję jako zgodę na nowe narzędzia (`@vitest/coverage-v8`, Testing Library, `jsdom`, `testcontainers`, `agent-browser`).
- 2026-10-25: główny `package.json` dostaje `"type": "module"`, wspólne ustawienia Vitest są w `test/vitest-shared.mjs`, a konfiguracja `app` ma rozszerzenie `.mts` (`@devmentor/app` nie jest ESM). Bez tego Vite ostrzega, że konfiguracje w składni ESM są ładowane jako CommonJS.
- 2026-10-25: stub `server-only` przeniesiony z `packages/core/test/` do `test/` w katalogu głównym, bo używają go wszystkie projekty. `packages/core/test/http.ts` (pomocnik tras `core`) zostaje w `core`.
- 2026-10-25: `FailureRateLimiter.pruneIfFull` nie sprawdza już `oldestKey !== undefined`. Przy pełnej mapie pierwszy klucz zawsze istnieje, więc ta gałąź była nieosiągalna i blokowała 100% pokrycia gałęzi. Zachowanie bez zmian.
- 2026-10-25: `AgentBrowser.waitForPath` czeka przez `wait --fn`, a nie `wait --url`, bo `wait --url` dopasowuje wzorzec (zob. `.ai/lessons/2026-10-25-agent-browser-pitfalls.md`).
- 2026-10-25: `packages/ui/tsconfig.json` i `packages/app/tsconfig.json` obejmują `test/dom-setup.ts`, żeby typy dopasowań jest-dom były widoczne w typechecku.
- 2026-10-25: testy tras API i `packages/app/src/server/*` działają w środowisku `node` (komentarz `// @vitest-environment node`), bo w `jsdom` `jose` nie przyjmuje klucza `Uint8Array` z innego realmu.
- 2026-10-25: kryteria 1–4, 6 i 7 spełnione lokalnie. Kryterium 5 (przebieg na GitHub Actions) czeka na pierwszy PR. Status pozostaje `in-progress` do scalenia do `main`.
- 2026-10-25: człowiek rozstrzygnął otwarte pytanie: `npm run test:e2e` działa w CI jako zadanie `e2e`. Baza to kontener usługi GitHub Actions (`postgres:17`), a nie testcontainers, bo Playwright startuje serwer sam (`webServer`) i potrzebuje tylko `DATABASE_URL`. Sprawdzone lokalnie z równoważnym kontenerem: 16/16. Człowiek zlecił też wypchnięcie gałęzi i otwarcie PR.
