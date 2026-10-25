# Wdrożenie standardów inżynieryjnych

- **Status:** done
- **Start / koniec:** 2026-10-25 02:32 CEST / 2026-10-25 02:15 CET (w trakcie przebiegu nastąpiła zmiana czasu z letniego na zimowy)
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-engineering-standards-adoption.md
- **Gałąź / commity:** cez/fc48a4c4: 7ac90ab, 97fdacd, 1d61559, ad421e9, a5ab1e6 oraz commit z dokumentacją i plikami `.ai/`

Kontynuacja przebiegu `.ai/runs/2026-10-25-engineering-standards-adoption.md` (zablokowanego na decyzji człowieka).

## Cel

Wdrożyć zatwierdzoną specyfikację w 6 krokach z jej planu.

## Przebieg

- Człowiek zatwierdził specyfikację: zakres „wszystko”, przy sprzeczności wygrywają standardy, `cacheComponents` wyłączone na rzecz `force-dynamic`, rola `admin` przez skrypt, zgoda na zod, pino, bcryptjs, jose i Vitest.
- Plik źródłowy przemianowany na `.ai/specs/2026-09-01-engineering-standards.md` (konwencja nazw, data z nagłówka). Treści nie zmieniano.
- Krok 1 (7ac90ab): kierunek `app → core → db`, kontener, `Cradle`, `withScope`, env (zod) i logger (pino) w `core`. Health probe przeniesiony do `core/src/services/health/` (port + adapter). Nowe reguły ESLint. `cacheComponents` i `partialPrefetching` wyłączone, `/admin` z `force-dynamic`.
- Krok 2 (97fdacd): prymitywy shadcn w `ui/src/components/ui/` (plus `input`, `label`, `field`, `table` z CLI). `ui/src/backend`: `apiCall`, `CrudForm`, `DataTable` i stany ładowania, błędu i pustej listy. Reguła ESLint dla `ui` blokowała początkowo importy własnego pakietu (`@devmentor/*`); zawężona do pozostałych pakietów.
- Krok 3 (1d61559): `core/src/http` (błędy, `apiHandler`, `makeCrudRoute`, sesja JWT, CSRF, limit prób, `parseBody`), `EventBus`, `AUTH_SECRET` w env, Vitest z zaślepką `server-only`.
- Krok 4 (ad421e9): encja `User`, migracja `Migration20261025004752_users`, `UserService`, `AuthService`, walidatory, trasy `/api/auth/*`, `/api/health`, `/api/users`, strony `(auth)`, `/admin/users`, `(frontend)` → `(marketing)`, skrypt `db:user:promote`.
  - CLI `tsx` padało na `listen EINVAL` (ścieżka gniazda IPC w długim `TMPDIR`); skrypt przeszedł na `node --import tsx`.
  - Reguła `react-hooks/set-state-in-effect` odrzuciła dwie wersje ładowania listy w `UsersTable`; ostatecznie stan jest ustawiany tylko w callbackach obietnicy, a ponowienie podbija licznik.
  - Błąd procesu: commit kroku 4 powstał mimo błędu ESLint (reguła walidatorów objęła plik testu), bo kod wyjścia lint był zamaskowany przez `| tail`. Poprawione przez `--amend` (wykluczenie `*.test.ts` z reguły), zapisane jako wniosek.
  - Komunikaty zod dla brakujących pól były po angielsku; dodane polskie komunikaty i test.
- Krok 5 (a5ab1e6): testy e2e auth, `/admin/users` i `/api/health`. Pierwszy przebieg z bazą: 5 porażek (500 przy rejestracji). Przyczyna: osobne kopie `@devmentor/db` w bundlach stron i tras API, ORM-singleton znał tylko kopię `User` ze strony `/admin`, a minifikator zmienił nazwę klasy na `u` (`MetadataError: Metadata for entity u not found`). Odtworzone ręcznie (`/admin`, potem `POST /api/auth/register`), naprawione przez `pinEntityName`.
- Krok 6: AGENTS.md (sekcja architektury przepisana według standardów, nowe podsekcje: konwencja pojęć, wspólna warstwa API i UI, bezpieczeństwo, jakość i przegląd; weryfikacja z `test` i `audit`), README, CLAUDE.md, `.env.example` (`AUTH_SECRET`), wnioski, decyzje w specyfikacji.

## Weryfikacja

- `npm run lint`: exit 0. `npm run typecheck`: exit 0. `npm run test`: 5 plików, 33 testy, wszystkie przeszły. `npm run build`: sukces (strony `/`, `/login`, `/register` statyczne, reszta dynamiczna). `npm run audit`: 0 podatności.
- `npm run test:e2e` z `DATABASE_URL` (PostgreSQL 17 z `docker compose up -d`, po `npm run db:migrate`): 16/16. Bez `DATABASE_URL`: 11 przeszło, 5 pominiętych (scenariusze z bazą).
- Reguły ESLint sprawdzone na plikach-sondach (usunięte): blokują `next`, `@mikro-orm/*` i `@devmentor/ui` w `core`; `@devmentor/core` w `db` i `ui`; `@devmentor/db`, `awilix` i `fetch` w `app`; `pino` w walidatorach.
- Ręcznie przez `curl` na `next start` z bazą: 403 bez nagłówka CSRF, 400 z błędami pól, 201 z ciasteczkiem `HttpOnly; SameSite=Lax; Secure`, pole `role: "admin"` w body zignorowane (mass assignment), 409 przy duplikacie, identyczne 401 dla złego hasła i nieznanego e-maila, `/api/users` 401/403/200 (po `db:user:promote` i ponownym zalogowaniu), `/admin/users` 307 na `/login?next=/admin/users`, 429 przy 6. nieudanej próbie, wylogowanie z `Max-Age=0`, zdarzenie `auth.user.registered` w logu.
- Nie sprawdzono: wyglądu nowych stron w trybie ciemnym ani w `npm run dev` w przeglądarce (poza e2e na `next start`); zachowania przy wielu procesach (limit prób jest w pamięci procesu, co jest znanym ograniczeniem).

## Wynik

Specyfikacja wdrożona na gałęzi `cez/fc48a4c4`. Specyfikacja ma status `in-progress`, bo według AGENTS.md `implemented` oznacza kod na gałęzi głównej.

## Następne kroki / blokery

- Po scaleniu do `main`: `git mv` obu plików (`2026-10-25-engineering-standards-adoption.md` i `2026-09-01-engineering-standards.md`) do `.ai/specs/implemented/` i status `implemented`.
- Do rozważenia w osobnej specyfikacji: ochrona całego `/admin` (dziś tylko `/admin/users` wymaga roli `admin`), wspólny magazyn limitu prób przed ruchem produkcyjnym, rola czytana z bazy zamiast z tokenu, jeśli odebranie uprawnień ma działać od razu.

## Wnioski

- [.ai/lessons/2026-10-25-mikro-orm-entity-name-minification.md](../lessons/2026-10-25-mikro-orm-entity-name-minification.md)
- [.ai/lessons/2026-10-25-tsx-cli-ipc-socket-path.md](../lessons/2026-10-25-tsx-cli-ipc-socket-path.md)
- [.ai/lessons/2026-10-25-exit-code-masked-by-pipe.md](../lessons/2026-10-25-exit-code-masked-by-pipe.md)
- Zaktualizowany: [.ai/lessons/2026-10-25-agents-md-over-foreign-specs.md](../lessons/2026-10-25-agents-md-over-foreign-specs.md)
