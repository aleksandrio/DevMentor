# Testy end-to-end w Playwright

- **Status:** implemented
- **Data:** 2026-10-25
- **Autor:** Claude Code (claude-opus-5-5), na polecenie Aleksandra Kowala
- **Powiązane:** `.ai/specs/implemented/2026-10-25-monorepo-migration.md` (weryfikacja faz 2–5), `.ai/runs/2026-10-25-e2e-playwright-docker.md`

## Problem i cel

Repozytorium nie ma testów automatycznych. Wygląd stron i działanie po stronie klienta (hydratacja komponentów Base UI, nawigacja) nie były dotąd sprawdzone w przeglądarce. Cel: powtarzalne testy e2e w Playwright, uruchamiane jednym poleceniem, które sprawdzają aplikację tak, jak widzi ją użytkownik.

## Zakres (w zakresie / poza zakresem)

W zakresie:

- `@playwright/test` jako devDependency `@devmentor/app`, konfiguracja `packages/app/playwright.config.ts`, testy w `packages/app/e2e/`.
- Skrypt `test:e2e` w `@devmentor/app` i delegujący w katalogu głównym.
- Testy: strona główna, `/admin` (karta shadcn/ui ze stylami, status bazy po strumieniowaniu, przycisk-link nawigujący do `/`).

Poza zakresem:

- Testy jednostkowe, CI, testy wizualne porównujące zrzuty pikselowo.
- Instalacja przeglądarek w ramach `npm install` (przeglądarka Playwrighta musi być dostępna lokalnie: `npx playwright install chromium`).

## Wymagania i kryteria akceptacji

- `npm run test:e2e` w katalogu głównym buduje aplikację, uruchamia `next start` i wykonuje testy w Chromium (headless).
- Bez `DATABASE_URL` testy przechodzą i oczekują statusu „nieskonfigurowana (brak DATABASE_URL)”.
- Z `DATABASE_URL` (np. z `.env` dla bazy z `docker-compose.yml`) testy przechodzą i oczekują statusu „działa”.
- `npm run lint`, `npm run typecheck`, `npm run build` dalej przechodzą.

## Projekt rozwiązania

- Testy są w pakiecie `app`, bo testują aplikację. Nie powstaje nowy pakiet.
- `webServer` w konfiguracji Playwrighta: `next build && next start -p 3100`, bez używania już działającego serwera, więc testowany jest zawsze świeży build.
- Konfiguracja Playwrighta wczytuje główny `.env` (`process.loadEnvFile`, jak `next.config.ts`), żeby test znał oczekiwany stan bazy. Serwer dziedziczy to samo środowisko.
- Oczekiwany status bazy: `DATABASE_URL` ustawione → „działa”, brak → „nieskonfigurowana”.

## Plan wdrożenia i testów

1. Instalacja `@playwright/test` w wersji zgodnej z lokalnie zainstalowanym Chromium.
2. Konfiguracja, testy, skrypty, wpisy w `.gitignore` dla artefaktów.
3. Uruchomienie bez bazy, potem z PostgreSQL z `docker compose up -d` po `npm run db:migrate`.

## Otwarte pytania

Brak.

## Decyzje i zmiany

<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
- 2026-10-25: specyfikacja utworzona i od razu w realizacji. Człowiek polecił uruchomić testy e2e przez Playwright (a nie przez narzędzie `e2e`).
- 2026-10-25: przycisk-link na `/admin` zmieniony z `Button` z `render={<Link />}` (rola `button`) na `<Link className={buttonVariants()}>` (rola `link`). Test wyszukujący po roli wykrył błąd semantyki. Zob. `.ai/lessons/2026-10-25-base-ui-button-link-role.md`.
- 2026-10-25: kolor przycisku jest porównywany z obliczoną wartością tokenu `--primary`, a nie z literałem `rgb()`, bo Chromium zwraca kolory Tailwind 4 w `lab()`.
- 2026-10-25: ESLint ignoruje `.ai/**` i artefakty Playwrighta. Cache transformacji Playwrighta trafia do `TMPDIR`, który w środowisku agenta wskazuje na `.ai/cezar/tmp`. Zob. `.ai/lessons/2026-10-25-playwright-e2e-pitfalls.md`.
- 2026-10-25: kryteria akceptacji spełnione (5/5 testów bez bazy i z bazą z `docker compose`). Status pozostaje `in-progress` do scalenia gałęzi do `main`, tak jak w specyfikacji migracji.
- 2026-10-25: Testy scalone do `main` w PR #1 (d95408d). Specyfikacja przeniesiona do `implemented/` ze statusem `implemented`.
