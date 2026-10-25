# Migracja do monorepo — faza 4 (Awilix i pierwszy przepływ żądania)

- **Status:** done
- **Start / koniec:** 2026-10-25 01:03 / 2026-10-25 01:12
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration (commit fazy 4 po 95fd322)
- **Poprzedni przebieg:** .ai/runs/2026-10-25-monorepo-phase-3.md

## Cel

Faza 4: kontener Awilix w `packages/app`, scope na żądanie z `em.fork()`, pierwszy pionowy przepływ (port i serwis w `core`, implementacja w `db`, użycie w Server Component na `/admin`). Według AGENTS.md (decyzja człowieka, zob. `.ai/lessons/2026-10-25-agents-md-over-foreign-specs.md`).

## Przebieg

- Rozpoznanie: MikroORM 7 `init` nie łączy się z bazą (połączenie przy pierwszym zapytaniu); Awilix 13.0.5 (`createContainer`, `InjectionMode.PROXY`, `strict`, `createScope`, `dispose`); dokumentacja Next.js o `connection()` i `<Suspense>` przy włączonym `cacheComponents`.
- Projekt szczegółowy dopisany do specyfikacji przed kodem.
- `core/src/health/`: port `DatabaseHealthProbe`, `SystemHealthService.checkDatabase()` (`up` z czasem, `down` z przyczyną, `not-configured`).
- `db/src/health/`: `MikroOrmDatabaseHealthProbe` (`select 1` na wstrzykniętym `em`), eksport z `@devmentor/db`.
- `app/src/server/`: `config.ts` (`DATABASE_URL`), `container.ts` (Cradle, rejestracje jawne, `null` dla sondy bez bazy), `request-scope.ts` (`withRequestScope`: `connection()`, scope, `em.fork()`, `dispose()`).
- `/admin`: `_components/database-status.tsx` (asynchroniczny `DatabaseStatus` w `<Suspense>` + prezentacyjny `DatabaseStatusBadge`, który służy też jako fallback); przyczyna awarii trafia do `console.error`, nie na stronę.
- `awilix` zainstalowany w `@devmentor/app`.
- Pierwsza próba sprawdzenia DI skryptem `.ts` przez `tsx` padła (`TransformError`: top-level await w pliku CommonJS, bo `@devmentor/app` nie ma `"type": "module"`); powtórzona jako `.mts` z `--conditions=react-server` — działa. Zapisane jako lekcja.
- Próba podglądu w przeglądarce przez serwer MCP `e2e` — odmowa uprawnień w trybie bez pytania; nie obchodzono jej.
- Plik `.ai/specs/engineering-standards.md` pozostaje nieśledzony i nietknięty (decyzja człowieka).

## Weryfikacja

Baza: `embedded-postgres` w `/tmp/pg` (port 55432), nie obraz z `docker-compose.yml` (brak dostępu do Dockera).

- `next start`, `/admin` przy trzech konfiguracjach (HTML ze strumieniowaną treścią):
  - z bazą: fallback „sprawdzanie…”, potem „działa · 3 ms” (wariant `default`),
  - bez `DATABASE_URL`: „nieskonfigurowana (brak DATABASE_URL)”,
  - z `DATABASE_URL` na zamknięty port 55999: „niedostępna”; w logu serwera `[admin] database health check failed: connect ECONNREFUSED 127.0.0.1:55999`; strona 200, bez błędu renderowania.
- Skrypt na prawdziwym kontenerze (`node --conditions=react-server --import tsx`): ten sam serwis w obrębie scope'u, różne między scope'ami; sonda dostaje `em` swojego scope'u; `em` różne między scope'ami i różne od globalnego; ORM wspólny; rozwiązanie serwisu z kontenera głównego odrzucone („Could not resolve 'em'”); `checkDatabase()` → `up`.
- `next dev`: 3 żądania + 3 edycje `container.ts` (HMR) → dalej 1 połączenie w `pg_stat_activity`, status „działa” po każdej edycji; plik przywrócony.
- `grep awilix` w `packages/core` i `packages/db` → 0 wystąpień (dodatkowo blokuje to ESLint).
- Bez `DATABASE_URL`, po `rm -rf packages/app/.next`: `npm run lint` — 0, `npm run typecheck` — 0, `npm run build` — 0, bez ostrzeżeń; `/` i `/_not-found` statyczne, `/admin` częściowo prerenderowane (◐).
- Niesprawdzone: wygląd w przeglądarce (MCP `e2e` niedozwolony, brak Chromium), `docker compose` z obrazem `postgres:17`.

## Wynik

Faza 4 ukończona: kontener Awilix w `packages/app`, `withRequestScope` z `em.fork()` na żądanie, wzorcowy przepływ `core` → `db` → `app` (status bazy na `/admin`) działający dla bazy dostępnej, niedostępnej i nieskonfigurowanej.

## Następne kroki / blokery

- Faza 5: domknięcie dokumentacji (usunięcie adnotacji o trwającej migracji z AGENTS.md i README.md), przeniesienie specyfikacji do `implemented/` po scaleniu do gałęzi głównej (status `implemented` dotyczy kodu na `main`).
- Do sprawdzenia przez człowieka: `/admin` w przeglądarce oraz `docker compose up -d` + `npm run db:migrate`.
- Gałąź `feat/monorepo-migration` nie jest scalona ani wypchnięta.

## Wnioski

- [Uruchamianie modułów serwerowych poza Next.js](../lessons/2026-10-25-run-server-modules-in-node.md)
- Uzupełniono [MikroORM 7: …](../lessons/2026-10-25-mikro-orm-7-setup-pitfalls.md) o leniwe łączenie w `init`.
