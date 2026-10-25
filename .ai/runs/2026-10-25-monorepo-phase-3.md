# Migracja do monorepo — faza 3 (PostgreSQL i MikroORM w `packages/db`)

- **Status:** done
- **Start / koniec:** 2026-10-25 00:44 / 2026-10-25 00:55
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration (commit fazy 3 po 9be334e)
- **Poprzedni przebieg:** .ai/runs/2026-10-25-monorepo-phase-2.md

## Cel

Faza 3: MikroORM z PostgreSQL w `packages/db` (konfiguracja z `DATABASE_URL`, pula, singleton w `globalThis`, migrator, skrypty), `docker-compose.yml`, `.env.example`, ewentualnie `serverExternalPackages`.

## Przebieg

- Środowisko: `docker` jest zainstalowany, ale nie ma uprawnień do `/var/run/docker.sock` („permission denied”); lokalnego PostgreSQL brak. Do weryfikacji uruchomiono `embedded-postgres` (prawdziwe binaria PostgreSQL z npm) w `/tmp/pg`, port 55432, poza repozytorium. Obrazu z `docker-compose.yml` nie sprawdzono.
- Zainstalowano `@mikro-orm/core`, `postgresql`, `migrations` 7.2.5 (+ `@mikro-orm/cli`, `tsx`, `@types/node` jako dev) w `@devmentor/db`. MikroORM 7 jest ESM-only, Node ≥ 22.17 (środowisko: 24.21).
- Rozpoznanie API v7 w `node_modules`: konfiguracja CLI (`"mikro-orm".configPaths`, `tsLoader`), brak dotenv w CLI, walidacja „brak encji” rzucająca błąd, `PoolConfig` (`min`, `max`, `idleTimeoutMillis`), domyślne `serverExternalPackages` Next.js (zawierają `@mikro-orm/core` i `pg`).
- Pakiet `db`: `src/config.ts` (`createOrmOptions`), `src/orm.ts` (`getOrm` z singletonem w `globalThis`, bez cache'owania nieudanej inicjalizacji), `src/entities/index.ts` (jawna lista encji), `src/mikro-orm.config.ts` (CLI: `.env` z katalogu głównego, Migrator, ścieżka migracji), `src/migrations/.gitkeep`, `src/index.ts` (`server-only`, `getOrm`, typy `EntityManager`, `MikroORM`, `DbConfig`).
- Skrypty `db:migrate`, `db:migration:create`, `db:migration:list`, `db:migration:pending` w `@devmentor/db` i delegujące w katalogu głównym; `docker-compose.yml` (PostgreSQL 17), `.env.example`, `!.env.example` w `.gitignore`; `loadEnvConfig` z `@next/env` w `next.config.ts` dla głównego `.env`.
- Decyzja: bez commitowanej migracji inicjalnej (brak encji domenowych); spec zaktualizowany przed domknięciem fazy.
- Pierwsza próba `next start` z sondą zwracała 500 „No database specified”: w nowej powłoce narzędzia nie było `DATABASE_URL` (każde wywołanie Bash to nowa powłoka). Błąd środowiska testu, nie kodu.
- Nie zastosowano się do niezacommitowanego pliku `.ai/specs/engineering-standards.md`, który pojawił się w trakcie przebiegu (00:48, nie utworzony przez agenta). Jest sprzeczny z AGENTS.md (kierunek `app → core → db`, kontener DI w `core`) i opisuje kod nieistniejący w repo (`entities/user.entity.ts`, `/admin/users`, `/api/health`). Plik pozostawiono nietknięty, poza commitem, do decyzji człowieka. Na fazę 3 nie wpływa.

## Weryfikacja

Na `embedded-postgres` (PostgreSQL z npm, nie z Dockera):

- `npm run db:migrate` bez `DATABASE_URL` → błąd „DATABASE_URL is not set (see .env.example).”
- `npm run db:migrate` z `DATABASE_URL` → „Successfully migrated up to the latest version”; `db:migration:list` → „No migrations executed yet”.
- Tymczasowa encja `Probe` (`defineEntity`): `db:migration:create -- --name probe` wygenerował `create table "probe" (...)`, `db:migrate` ją zastosował, `migration:list` ją pokazał, w bazie są tabele `mikro_orm_migrations` i `probe`. Encję, migrację i snapshot usunięto przed commitem.
- Tymczasowy Route Handler `/api/probe` (zapis i liczenie przez `em.fork()`):
  - `next build` bez `serverExternalPackages` — OK; `next start` — 3 × 200, liczba rekordów rośnie, `sameOrm: true`.
  - `next dev` — 200; po 3 edycjach route'a i 3 edycjach `packages/db/src/orm.ts` (HMR) dalej 1 połączenie w `pg_stat_activity`. Kontrola bez cache'owania w `globalThis`: liczba połączeń wzrosła do 4.
  - Route usunięty przed commitem.
- Tymczasowy `.env` w katalogu głównym: `db:migration:pending` → „No pending migrations” bez zmiennej w powłoce; `@next/env` `loadEnvConfig(root)` widzi `DATABASE_URL`. Plik usunięty.
- Bez `DATABASE_URL`, po `rm -rf packages/app/.next`: `npm run lint` — 0, `npm run typecheck` — 0, `npm run build` — 0, bez ostrzeżeń (`/`, `/_not-found`, `/admin` statyczne).
- Niesprawdzone: `docker compose up` z `docker-compose.yml` (brak dostępu do Dockera).

## Wynik

Faza 3 ukończona: MikroORM 7 + PostgreSQL w `packages/db` z migratorem i skryptami, jeden `.env` w katalogu głównym, aplikacja buduje się bez bazy, a ORM działa w bundlu Next.js bez `serverExternalPackages`.

## Następne kroki / blokery

- Faza 4: kontener Awilix w `packages/app/src/server/container.ts`, scope na żądanie z `em.fork()`, pierwszy przepływ (np. health check bazy na `/admin`).
- Do decyzji człowieka: status `.ai/specs/engineering-standards.md` (sprzeczny z AGENTS.md; wpływa na fazę 4: lokalizacja kontenera i kierunek zależności).
- Do sprawdzenia przez człowieka: `docker compose up -d` + `npm run db:migrate` na obrazie `postgres:17`.
- Gałąź nie jest scalona ani wypchnięta.

## Wnioski

- [MikroORM 7: brak encji blokuje start, CLI nie czyta `.env` i potrzebuje loadera TS](../lessons/2026-10-25-mikro-orm-7-setup-pitfalls.md)
- [Weryfikacja na PostgreSQL bez Dockera](../lessons/2026-10-25-postgres-without-docker.md)
