# Migracja do monorepo — faza 5 (domknięcie i weryfikacja całości)

- **Status:** done (kod i weryfikacja); przeniesienie specyfikacji do `implemented/` zablokowane do scalenia do `main`
- **Start / koniec:** 2026-10-25 01:14 / 2026-10-25 01:27
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration — ea99da9, a49e260, 01dd339 + commit domykający
- **Poprzedni przebieg:** .ai/runs/2026-10-25-monorepo-phase-4.md

## Cel

Faza 5: usunięcie z AGENTS.md i README.md adnotacji o trwającej migracji, przegląd „Uruchomienia lokalnego”, przeniesienie specyfikacji do `implemented/` oraz weryfikacja całości (instalacja, lint, typecheck, build, testy, uruchomienie, migracje).

## Przebieg

- Specyfikacja: fazy 1–4 oznaczone jako ukończone, faza 5 to pierwsza nieukończona i zarazem ostatnia.
- Dokumentacja: notki „Stan na… migracja trwa” w AGENTS.md i README.md zastąpione stałym opisem i wskazaniem wzorcowego przepływu; wymóg Node.js ≥ 22.17 (pole `engines` + README); opis `/admin` w „Uruchomieniu lokalnym”. Commit ea99da9.
- Weryfikacja z czystego klona gałęzi w `/tmp/dm-final` wykryła dwa błędy:
  1. `npm run start -- -p 3161` → „Invalid project directory … packages/app/3161”. Skrypty `dev`/`build`/`start` w katalogu głównym nie kończyły się `--`, więc argument przejmował wewnętrzny npm. Poprawione (a49e260).
  2. Z poprawnym `.env` w katalogu głównym `/admin` pokazywało „nieskonfigurowana”. `loadEnvConfig` z `@next/env` zwraca wynik pierwszego ładowania (`packages/app`), więc nie czytał głównego `.env`. To błąd z fazy 3, niewykryty, bo w fazie 3 sprawdzono go osobnym skryptem `node`, a w fazie 4 `DATABASE_URL` szło z powłoki. Zastąpione `process.loadEnvFile()`, usunięta zależność `@next/env` (01dd339). Korekta zapisana w specyfikacji jako nowa decyzja; zamknięte logi faz 3–4 pozostawiono bez zmian.
- AGENTS.md: zasada o `.env` zaktualizowana do faktycznego mechanizmu; zasada `--` dla skryptów delegujących.
- Specyfikacja nie została przeniesiona do `implemented/`: AGENTS.md wiąże ten status z kodem na gałęzi głównej, a scalenie do `main` wymaga decyzji człowieka.
- Docker nadal niedostępny (permission denied na gnieździe); baza do weryfikacji: `embedded-postgres` w `/tmp/pg`, port 55432, osobna świeża baza `devmentor_final`.

## Weryfikacja

Wszystko w czystym klonie `/tmp/dm-final` na commicie 01dd339 (po poprawkach ponownie od `rm -rf node_modules`):

- `npm ci` — exit 0 (ok. 60 s), symlinki `@devmentor/{app,core,db,ui}`.
- `npm run lint` — 0; `npm run typecheck` — 0 (4 pakiety); `npm run build` (bez `DATABASE_URL`) — 0, bez ostrzeżeń; `/` i `/_not-found` statyczne, `/admin` częściowo prerenderowane.
- `npm test` — „Missing script: test”: w repozytorium nie ma testów automatycznych.
- Migracje według README (`cp .env.example .env`, URL przestawiony na port 55432 i świeżą bazę): `npm run db:migrate` → „Successfully migrated up to the latest version”; `db:migration:list` → „No migrations executed yet”; `db:migration:pending` → „No pending migrations”; w bazie tabela `mikro_orm_migrations`.
- `npm run start` (domyślny port 3000): `/` 200 (strona startowa bez zmian), `/admin` 200, `/next.svg` 200, `/favicon.ico` 200, `/nope` 404; status bazy z głównego `.env`: „działa · 1 ms”.
- `DATABASE_URL` z powłoki na martwy port + `npm run start -- -p 3161`: „niedostępna”, w logu `ECONNREFUSED 127.0.0.1:55999` (zmienna z powłoki ma pierwszeństwo przed `.env`).
- Bez `.env`: `npm run start -- -p 3162`: `/` 200, `/admin` „nieskonfigurowana (brak DATABASE_URL)”.
- `npm run dev` (port 3000): `/` 200, `/admin` 200, „działa · 7 ms”.
- Nie powstał `packages/app/AGENTS.md`; `git status` klona czysty (`.env` ignorowany).
- W repozytorium roboczym po zmianach dokumentacji: `npm run lint` — 0, `npm run typecheck` — 0.
- Niesprawdzone: `docker compose up -d` z obrazem `postgres:17` (brak uprawnień do Dockera) oraz wygląd stron w przeglądarce (brak przeglądarki; narzędzie MCP `e2e` odrzucone w fazie 4 w trybie bez pytania).

## Wynik

Migracja do monorepo jest zrealizowana na gałęzi `feat/monorepo-migration`: wszystkie kryteria faz 1–5 spełnione i sprawdzone z czystego klona. Formalne domknięcie specyfikacji (`implemented/`) czeka na scalenie do `main`.

## Następne kroki / blokery

- Decyzja człowieka: scalenie `feat/monorepo-migration` do `main` (lokalnie lub przez PR). Potem `git mv .ai/specs/2026-10-25-monorepo-migration.md .ai/specs/implemented/` i `Status: implemented`.
- Do sprawdzenia przez człowieka: `docker compose up -d` + `npm run db:migrate` oraz wygląd `/` i `/admin` w przeglądarce.
- `.ai/specs/engineering-standards.md` pozostaje nieśledzony i nietknięty (decyzja człowieka).

## Wnioski

- [`loadEnvConfig` z `@next/env` w `next.config.ts` nie wczytuje drugiego katalogu](../lessons/2026-10-25-next-env-loadenvconfig-cache.md)
- [Skrypt delegujący do workspace musi kończyć się `--`](../lessons/2026-10-25-npm-workspace-script-args.md)
