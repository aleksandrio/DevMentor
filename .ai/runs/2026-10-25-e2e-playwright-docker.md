# Testy e2e w Playwright i weryfikacja PostgreSQL z Dockera

- **Status:** done
- **Start / koniec:** 2026-10-25 01:59 / 2026-10-25 02:12
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-e2e-playwright.md, .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration (commit po 7d8faf4)
- **Poprzedni przebieg:** .ai/runs/2026-10-25-monorepo-phase-5.md

## Cel

Uzupełnić niesprawdzone punkty migracji: PostgreSQL z `docker-compose.yml` oraz zachowanie stron w przeglądarce, przez testy e2e w Playwright (polecenie człowieka: Playwright, nie narzędzie `e2e`).

## Przebieg

- Środowisko: `docker ps` działa, Docker Compose v5.5.1; w `~/.cache/ms-playwright` są `chromium-1248` i `chromium_headless_shell-1248`.
- Specyfikacja `.ai/specs/2026-10-25-e2e-playwright.md` (Playwright w `packages/app`, bez nowego pakietu).
- `@playwright/test` 1.64.1 jako devDependency `@devmentor/app`. Wymaga Chromium 1248, czyli zgodnego z zainstalowanym, bez pobierania.
- `packages/app/playwright.config.ts` (`webServer`: `next build && next start -p 3100`, główny `.env` przez `process.loadEnvFile`), testy `e2e/home.spec.ts` i `e2e/admin.spec.ts`, skrypty `test:e2e` (pakiet i katalog główny z `--`), artefakty w `.gitignore`.
- Pierwsze uruchomienie: 3 z 5 testów padły.
  - `home`: moja asercja promienia (regex) była zła, a pierwsza próba poprawki przez `sed` nie zadziałała (escapowanie); poprawione przez Pythona na `not.toHaveCSS("border-radius", "0px")`.
  - `admin` ×2: `getByRole("link", { name: "Przejdź do strony głównej" })` nie istniał. W drzewie dostępności był `button`, bo Base UI `Button` z `render={<Link />}` nadaje `<a>` rolę `button`. Poprawka w kodzie (nie w teście): `<Link className={buttonVariants()}>`.
- Drugie uruchomienie: 1 błąd. Kolor przycisku `lab(7.78 …)` zamiast `rgb(23, 23, 23)`, czyli kolor poprawny, a zły format w teście. Test porównuje teraz z obliczonym `var(--primary)`.
- `npm run lint` padł na plikach cache transformacji Playwrighta w `.ai/cezar/tmp/...` (`TMPDIR` ustawiony przez cezar w repozytorium). `eslint.config.mjs` ignoruje teraz `.ai/**`, `**/test-results/**` i `**/playwright-report/**`.
- Docker według README: `cp .env.example .env`, `docker compose up -d`, kontener `healthy`, `npm run db:migrate`.
- Zrzuty ekranu `/` i `/admin` (skrypt tymczasowy, usunięty) obejrzane: strona główna jak w szablonie, panel z kartą, odznaką „działa · 388 ms” i ciemnym przyciskiem-linkiem.
- Polecenie sprzątające z `grep -E "[n]ext start"` znów zabiło własną powłokę (exit 144); dokończone w osobnym wywołaniu, zabijanie po nazwie procesu. Zapisane jako lekcja.
- Plik `.ai/specs/engineering-standards.md` pozostaje nieśledzony i nietknięty.

## Weryfikacja

- `npm run test:e2e` bez `.env` i bez `DATABASE_URL`: 5/5 (status „nieskonfigurowana (brak DATABASE_URL)”).
- PostgreSQL z `docker compose up -d`: obraz `postgres:17`, `select version()` → PostgreSQL 17.11; `npm run db:migrate` → „Successfully migrated up to the latest version”; `db:migration:pending` → „No pending migrations”; tabela `mikro_orm_migrations`.
- `npm run test:e2e` z `.env` (`DATABASE_URL` na bazę z Dockera): 5/5, status „działa · N ms”, nawigacja przyciskiem i linkiem w nagłówku działa po stronie klienta.
- Kontener zatrzymany (`docker compose stop`): `/admin` w Chromium pokazuje „niedostępna”, w logu serwera `ECONNREFUSED 127.0.0.1:5432`; po `docker compose start` kontener znowu `healthy`.
- `npm run lint` — 0 (po dodaniu ignorów), `npm run typecheck` — 0, `npm run build` bez `.env` — 0, bez ostrzeżeń.

## Wynik

Oba wcześniej niesprawdzone punkty migracji są potwierdzone: baza z `docker-compose.yml` działa z migracjami, a strony działają w przeglądarce, także interakcje po stronie klienta. Repozytorium ma pierwszy zestaw testów e2e (`npm run test:e2e`). Przy okazji poprawiono semantykę przycisku-linku na `/admin`.

## Następne kroki / blokery

- Decyzja człowieka o scaleniu `feat/monorepo-migration` do `main`; potem `git mv` obu specyfikacji (migracja, e2e) do `implemented/`.
- Stan środowiska po przebiegu: kontener `devmentor-postgres-1` zatrzymany (`docker compose stop`, wolumen z danymi zostaje), `.env` w katalogu głównym usunięty (był tworzony tylko do weryfikacji; README opisuje, jak go odtworzyć).

## Wnioski

- [Base UI `Button` z `render={<Link />}` ma rolę `button`](../lessons/2026-10-25-base-ui-button-link-role.md)
- [Playwright w tym repo: kolory w `lab()` i cache w `TMPDIR`](../lessons/2026-10-25-playwright-e2e-pitfalls.md)
- [Zabijanie procesów po wzorcu zabija też powłokę](../lessons/2026-10-25-kill-by-pattern-kills-shell.md)
