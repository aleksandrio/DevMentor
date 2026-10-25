# Wdrożenie standardów inżynieryjnych (`engineering-standards.md`)

- **Status:** in-progress
- **Data:** 2026-10-25
- **Autor:** Claude Code (claude-opus-5-5), na polecenie Aleksandra Kowala
- **Powiązane:** `.ai/specs/engineering-standards.md` (dokument źródłowy, dalej „standardy”), `.ai/specs/implemented/2026-10-25-monorepo-migration.md`, `.ai/runs/2026-10-25-engineering-standards-adoption.md`, `.ai/lessons/2026-10-25-agents-md-over-foreign-specs.md`

## Problem i cel

Standardy opisują konwencje, architekturę i warstwy wielokrotnego użytku dla ~9 pojęć domenowych (auth, mentors, availability, bookings, payments, messages, favorites, reviews). Są sprzeczne z AGENTS.md i odwołują się do kodu, którego tu nie ma (zob. log przebiegu). 2026-10-25 człowiek zdecydował:

- **zakres: wszystko** (konwencje, wspólne warstwy HTTP i UI, auth, logowanie, zdarzenia),
- **przy sprzeczności wygrywają standardy**, a AGENTS.md trzeba do nich dostosować.

Ta specyfikacja przekłada standardy na konkretny stan repozytorium. Rozstrzyga też miejsca, gdzie dosłownego brzmienia nie da się wdrożyć: kod, którego nie ma, ograniczenia Next.js 16 i reguły ESLint.

## Zakres (w zakresie / poza zakresem)

W zakresie:

1. Nowy kierunek zależności `app → core → db`, `ui` samodzielny (bez `@devmentor/*`). Kontener Awilix w `core`. Nowe reguły ESLint.
2. Konwencja folderów pojęć (`entities/<concept>/`, `services/<concept>/`, `validators/<concept>/`, `api/<concept>/`) i tabela nazw ze standardów.
3. `core/src/config/env.ts` (zod), `core/src/logger.ts` (pino z redakcją), `core/src/http/` (`errors`, `apiHandler`, `makeCrudRoute`, `auth`), `core/src/events/` (typowany emiter w procesie).
4. `ui/src/components/ui/` (prymitywy shadcn) i `ui/src/backend/` (`api/apiCall`, `forms/CrudForm`, `tables/DataTable`, `feedback/*`).
5. Pojęcie `auth`: encja `User` (`base.entity.ts` z UUID), migracja, `UserService`, rejestracja, logowanie i wylogowanie, JWT HS256 w ciasteczku `httpOnly`, ochrona CSRF, limit prób logowania i rejestracji, `requireSession`/`requireRole`.
6. Przykład referencyjny ze standardów (sekcja 5, krok 3): `/api/users` przez `makeCrudRoute` i strona `/admin/users` przez `apiCall` + `DataTable`. Do tego `/api/health` przez `apiHandler`.
7. Grupy tras według person: `(marketing)` (zastępuje `(frontend)`) i `(auth)`. `(backend)/admin` zostaje.
8. Aktualizacja AGENTS.md (sekcja 3 standardów, po polsku, plus zmienione zasady architektury), README i wniosku `agents-md-over-foreign-specs`.
9. Testy jednostkowe (Vitest) dla `core/src/http`, auth i limitu prób. Testy e2e (Playwright) dla rejestracji, logowania i `/admin/users`. `npm audit` w bramce weryfikacji.

Poza zakresem (zgodnie z YAGNI ze standardów):

- pojęcia `mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`, `reviews` i ich foldery. Każde dostanie własną specyfikację, a foldery powstaną z pierwszym plikiem,
- grupy `(student)` i `(mentor)`. Powstaną z pierwszą stroną,
- port `PaymentGateway` i jego adaptery (powstaną z pojęciem `payments`),
- odświeżanie tokenów (znane ograniczenie MVP), reset hasła, kolejki i workery, RBAC poza rolami opisanymi niżej,
- `docs/product-scope.md`: pliku nie ma w tym repozytorium, więc krok 8 standardów nie ma czego zmieniać.

## Wymagania i kryteria akceptacji

1. `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test` i `npm run test:e2e` przechodzą. `npm audit --omit=dev` nie zgłasza podatności `high` ani `critical`.
2. ESLint blokuje: import `next`, `react` i `@mikro-orm/*` w `core`; import dowolnego `@devmentor/*` w `db` i `ui`; import `@devmentor/db` poza `core` (w tym w `app`).
3. Aplikacja buduje się i startuje bez bazy. `/`, `/login` i `/register` renderują się bez `DATABASE_URL`. `/api/health` zwraca `{ ok: true, data: { database: { state: "not-configured" } } }`.
4. Każdy Route Handler jest opakowany w `apiHandler` albo powstaje z `makeCrudRoute`. W `packages/app/src/app/api` nie ma `try/catch` ani ręcznego `Response.json`.
5. Każdy `fetch` do `/api/*` w kodzie klienckim idzie przez `apiCall`/`apiCallOrThrow` (sprawdzane regułą ESLint `no-restricted-globals` dla `fetch` poza `ui/src/backend/api/`).
6. Koperta odpowiedzi: sukces `{ ok: true, data }`, błąd `{ ok: false, error: { code, message, fieldErrors? } }`. Statusy: `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409, `RateLimitError` 429, pozostałe 500 z ogólnym komunikatem (bez stosu) i wpisem w logu.
7. Rejestracja: hasło haszowane `bcryptjs` z kosztem 12. Duplikat e-maila zwraca 409 z ogólnym komunikatem. Logowanie: zły e-mail i złe hasło dają ten sam komunikat „Nieprawidłowe dane logowania” i 401.
8. Sesja: JWT HS256 (`jose`), sekret `AUTH_SECRET` ≥ 32 bajty walidowany przez zod, ważność 24 h. Ciasteczko `httpOnly`, `secure` w produkcji, `sameSite=lax`, `path=/`. Token nie trafia do `localStorage`, logów ani odpowiedzi JSON.
9. CSRF: każde żądanie zmieniające stan (`POST`, `PUT`, `PATCH`, `DELETE`) bez nagłówka `X-Requested-With: devmentor` dostaje 403. `apiCall` zawsze go ustawia.
10. Limit prób: po 5 nieudanych próbach logowania albo rejestracji dla pary IP + e-mail w oknie 15 minut kolejne próby dostają 429 do końca okna. Licznik jest w pamięci procesu (ograniczenie MVP opisane w kodzie i w AGENTS.md).
11. `/admin/users` i `GET /api/users` wymagają zalogowanego użytkownika z rolą `admin`. Bez sesji: przekierowanie na `/login` (strona) i 401 (API). Z inną rolą: 403. Lista wyświetla się przez `DataTable` ze stanami ładowania, pustej listy i błędu.
12. Logger pino redaguje `password`, `passwordHash`, `token`, `authorization`, `cookie` i `set-cookie`.
13. Zdarzenie `auth.user.registered` jest emitowane po udanej rejestracji przez emiter z `core/src/events`. Na start ma jednego subskrybenta, który loguje zdarzenie.
14. Kontrola autoryzacji działa na zasadzie fail closed: wyjątek przy weryfikacji tokenu albo roli kończy się 401 lub 403, nigdy przepuszczeniem żądania.

## Projekt rozwiązania

### Kierunek zależności i granice pakietów

```
app ──► core ──► db
app ──► ui            (ui nie importuje żadnego @devmentor/*)
```

- `db`: MikroORM, encje, migracje, `getOrm`. Nie importuje `@devmentor/*`. Eksportuje encje i typy ORM (`EntityManager`, `MikroORM`).
- `core`: konfiguracja (`env.ts`), logger, kontener Awilix i `Cradle`, serwisy, walidatory, `http/`, `events/`. Importuje `@devmentor/db`, `awilix`, `zod`, `pino`, `bcryptjs`, `jose`. Nie importuje `next`, `react` ani `@mikro-orm/*` (typy ORM bierze z `@devmentor/db`).
- `app`: strony, layouty, `route.ts` jako konfiguracja (`makeCrudRoute`/`apiHandler`) i cienki helper `withRequestScope` z `connection()`. Nie importuje `@devmentor/db` ani `awilix`.
- `ui`: komponenty, `backend/`, zależność od `zod` (typ schematu w `CrudForm`). Bez `@devmentor/*`.
- Kopertę odpowiedzi API `core/src/http` i `ui/src/backend/api` deklarują osobno, każdy jako własny typ (standardy, notatka o `ApiResult`).

**Wejścia pakietu `core`** (żeby kod kliencki nie dociągał serwera):

| Ścieżka | Zawartość | Gdzie wolno importować |
| --- | --- | --- |
| `@devmentor/core` | kontener, serwisy, `http`, `events`, logger, env (`server-only`) | tylko kod serwerowy `app` |
| `@devmentor/core/validators/*` | schematy zod (czyste, bez `server-only`) | serwer i komponenty klienckie |

### Kontener

`core/src/container/container.ts` i `cradle.ts`. `createAppContainer()` buduje singleton (config, logger, orm, eventBus) i rejestruje każdą zależność jawnie. `scoped`: `em`, `userService`, `systemHealthService`, `databaseHealthProbe`. `core/src/container/scope.ts` eksportuje `withScope(fn)`: tworzy scope z `em.fork()` i zamyka go po zakończeniu. `app/src/server/request-scope.ts` zostaje jako cienka nakładka: `await connection()`, potem `withScope(fn)`. Bez `next` w `core`.

Port `DatabaseHealthProbe` zostaje w `core` (wzorzec Dependency Inversion). Implementacja przechodzi do `core/src/services/health/mikro-orm-database-health-probe.ts`, bo `db` nie może już implementować interfejsu z `core`.

### `force-dynamic` a `cacheComponents`

Standardy każą zamknąć dostęp do bazy w trasach z `export const dynamic = "force-dynamic"`. W Next.js 16 ta opcja nie działa przy włączonym `cacheComponents` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md`, wersja 16.0.0). **Decyzja człowieka (2026-10-25):** wyłączyć `cacheComponents` i `partialPrefetching` w `next.config.ts`. Każda strona, layout i Route Handler korzystający z bazy (przez `withRequestScope` albo `apiHandler`) eksportuje `export const dynamic = "force-dynamic"`. `withRequestScope` dalej czeka na `connection()` jako druga linia obrony, gdyby ktoś zapomniał o `force-dynamic`. `<Suspense>` wokół danych zostaje (strumieniowanie), ale nie jest już wymagane do prerenderowania.

### `core/src/http`

- `errors.ts`: `AppError` (`code`, `status`, `message`, opcjonalnie `fieldErrors`) oraz `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError`, `ConflictError`, `RateLimitError`. `DomainError` zostaje usunięty (nie ma użyć) i zastąpiony przez `AppError`.
- `api-handler.ts` (nazwa pliku w kebab-case jak reszta repo; eksport `apiHandler`): `apiHandler(fn, { auth?: "public" | "session" | Role })` zwraca `(req: Request, ctx) => Promise<Response>`. Kolejność: CSRF dla metod zmieniających stan, potem uwierzytelnienie (domyślnie `"session"`, fail closed), potem `withScope`, wywołanie `fn({ req, params, session, cradle })` i opakowanie wyniku w kopertę. Używa webowego `Response`, nie `NextResponse`, więc `core` nie importuje `next`.
- `make-crud-route.ts`: `makeCrudRoute({ service: (cradle) => crudService, schemas: { create?, update? }, auth })` zwraca `{ GET, POST, PUT, DELETE }` tylko dla operacji, które serwis implementuje. Body zawsze idzie przez `schema.parse` (ochrona przed mass assignment).
- `auth.ts`: `requireSession(req)` (cookie → `jose.jwtVerify`, każdy błąd to `UnauthorizedError`), `requireRole(session, role)`, `assertOwns(session, ownerId)` (`ForbiddenError`). Do tego wydawanie i czyszczenie ciasteczka sesji (nagłówek `Set-Cookie` budowany w `core`, bez `next/headers`).
- `rate-limit.ts`: licznik w pamięci (`Map`, klucz `ip|email`). Stałe nazwane i uzasadnione: 5 prób na 15 minut.
- `csrf.ts`: sprawdzenie nagłówka `X-Requested-With: devmentor`.

### Auth

- `db/src/entities/base.entity.ts`: wspólne właściwości `id` (UUID v4 z `crypto.randomUUID()`, zob. „Decyzje i zmiany”), `createdAt`, `updatedAt`. `db/src/entities/auth/user.entity.ts`: `User` (`users`: `email` unikalny, małe litery; `password_hash`; `display_name`; `role` enum `student | mentor | admin`). Migracja `npm run db:migration:create -- --name users`. Usunięcie `warnWhenNoEntities`.
- `core/src/services/auth/user.service.ts`: `register`, `authenticate`, `list` (DTO bez hasha). `core/src/validators/auth/register.schema.ts`, `login.schema.ts`.
- `app/src/app/api/auth/register|login|logout/route.ts` przez `apiHandler({ auth: "public" })`. Strony `(auth)/login` i `(auth)/register` (komponent kliencki z `CrudForm` i schematem z `@devmentor/core/validators/auth/...`).
- Rola `admin` nadawana jest wyłącznie skryptem `npm run db:user:promote -- --email <e-mail>` (`packages/db`, bez endpointu HTTP). Standardy wykluczają RBAC, ale ich przykład `/admin/users` wymaga ochrony, więc to jedyne użycie `requireRole`.

### `ui`

- Przeniesienie `button`, `badge` i `card` do `ui/src/components/ui/`. W `components.json` alias `"ui": "@devmentor/ui/components/ui"`. `exports`: `./components/*` (obejmuje `ui/*` i `<concept>/*`) oraz nowe `./backend/*`.
- `backend/api/api-call.ts` (`apiCall`, `apiCallOrThrow`, `readJsonSafe`, typ `ApiResult<T>`, nagłówek CSRF).
- `backend/forms/crud-form.tsx`: pola z listy `fields` i schemat zod (walidacja kliencka), `fieldErrors` z serwera przy polach, stany wysyłania, `Cmd/Ctrl+Enter` i `Escape`. Prymitywy shadcn: `input`, `label`, `field`.
- `backend/tables/data-table.tsx`: kolumny z konfiguracji, stany ładowania, pustej listy i błędu, paginacja po stronie klienta, akcje wiersza. Prymityw shadcn: `table`.
- `backend/feedback/{loading-message,error-message,empty-state}.tsx`.
- Nazwy plików w kebab-case, jak dotąd w `ui` (shadcn tak generuje). Nazwy komponentów w PascalCase, jak w standardach (np. `CrudForm` w `crud-form.tsx`). To odstępstwo od pisowni ścieżek w standardach (`CrudForm.tsx`) wynika ze spójności z istniejącymi plikami.

### Zdarzenia i logowanie

- `core/src/events/event-map.ts` (`{ "auth.user.registered": { userId } }`) i `event-bus.ts` (typowany `emit`/`on`, synchroniczny, w procesie). Rejestrowany w kontenerze jako singleton.
- `core/src/logger.ts`: pino z `redact` (kryterium 12). W dev bez `pino-pretty` (YAGNI).

### Grupy tras

`(frontend)` → `(marketing)`, `(auth)` dla logowania i rejestracji, `(backend)/admin` bez zmian (shadcn). Strony mają domyślny eksport `<Segment>Page`.

### AGENTS.md

- Nowy diagram zależności, kontener w `core`, nowe tabele „Co zawiera / Czego nie zawiera”, nowe biblioteki w tabeli stosu (zod, pino, bcryptjs, jose, Vitest).
- Nowe podsekcje „Konwencja pojęć domenowych” i „Wspólna warstwa API i UI” (sekcja 3 standardów, po polsku), tabela nazw, zasady bezpieczeństwa i lista kontrolna przeglądu w skrócie, z odnośnikiem do standardów po pełne uzasadnienie.
- Wniosek `agents-md-over-foreign-specs` dostaje aktualizację: człowiek zmienił decyzję, standardy obowiązują w kształcie z tej specyfikacji.
- Standardy trafiają do repozytorium jako `.ai/specs/2026-09-01-engineering-standards.md` (data z nagłówka). Po wdrożeniu oba pliki przechodzą do `implemented/`.

## Plan wdrożenia i testów

Każdy krok to osobny commit, po którym `lint`, `typecheck` i `build` przechodzą.

1. Granice i kontener: wyłączenie `cacheComponents`, zmiana kierunku zależności, ESLint, przeniesienie kontenera i `config` do `core` (env przez zod), health probe do `core`, `withScope`. E2E bez zmian zachowania.
2. `ui`: przeniesienie prymitywów do `components/ui/`, prymitywy shadcn (`input`, `label`, `field`, `table`), `backend/*`.
3. `core/src/http`, logger, events, Vitest i testy jednostkowe (mapowanie błędów, CSRF, `requireSession` fail closed, limit prób).
4. Auth: encja, migracja, serwis, walidatory, trasy API, strony `(auth)`, grupa `(marketing)`, skrypt promocji do admina. `/api/health` przez `apiHandler`.
5. Przykład referencyjny `/api/users` + `/admin/users`. E2E: rejestracja, logowanie, wylogowanie, 401/403/200 dla `/admin/users`, 429 po 5 próbach, 403 bez nagłówka CSRF.
6. Dokumentacja: AGENTS.md, README, wniosek, `npm audit`, przeniesienie specyfikacji.

Weryfikacja ręczna: `npm run dev` z bazą z `docker compose up -d` (rejestracja, logowanie, panel admina) i bez `DATABASE_URL` (strony publiczne, `/api/health`).

## Otwarte pytania

Brak. Rozstrzygnięcia są w sekcji „Decyzje i zmiany”.

## Decyzje i zmiany

<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
- 2026-10-25: człowiek wybrał zakres „wszystko” i rozstrzygnięcie sprzeczności na korzyść standardów.
- 2026-10-25: człowiek zatwierdził specyfikację i rozstrzygnął otwarte pytania: (1) wyłączyć `cacheComponents` i stosować dosłownie `force-dynamic`, (2) rola `admin` nadawana wyłącznie skryptem `db:user:promote`, (3) zgoda na zod, pino, bcryptjs, jose i Vitest.
- 2026-10-25 (w trakcie wdrożenia, dopisane po fakcie): odstępstwa od projektu, każde z powodem:
  - `id` to UUID v4 z `crypto.randomUUID()` zamiast v7. Cel (brak sekwencyjnych identyfikatorów) jest spełniony bez nowej zależności.
  - Rejestracja zawsze tworzy rolę `student`, a formularz nie ma wyboru roli. `CrudForm` nie ma pola wyboru, a ścieżka mentora przyjdzie ze specyfikacją pojęcia `mentors` (YAGNI).
  - Dodany `AuthService` (`core/src/services/auth/auth.service.ts`): przepływ logowania i rejestracji (limit prób + token) poza `UserService`, żeby trasy nie miały `try/catch`.
  - Dodany `ServiceUnavailableError` (503). Bez `DATABASE_URL` kontener rejestruje `userService` jako fabrykę rzucającą ten błąd, zamiast błędu rozwiązania Awilix (500).
  - Rola jest w tokenie JWT, więc nadanie lub odebranie roli działa po ponownym zalogowaniu (najpóźniej po 24 h). To znane ograniczenie MVP, opisane w AGENTS.md.
  - `/api/health` w stanie `down` nie zwraca powodu (szczegóły połączenia idą do logu).
  - `pinEntityName` w `db/src/entities/pin-entity-name.ts`: obejście produkcyjnego błędu MikroORM przy osobnych kopiach `@devmentor/db` w bundlach Next.js (`.ai/lessons/2026-10-25-mikro-orm-entity-name-minification.md`).
  - Skrypt `db:user:promote` uruchamia `node --import tsx` zamiast CLI `tsx` (`.ai/lessons/2026-10-25-tsx-cli-ipc-socket-path.md`).
  - `@devmentor/ui` eksportuje `./backend/api/*` (`.ts`) i `./backend/*` (`.tsx`), bo pole `exports` nie dobiera rozszerzenia.
  - `playwright.config.ts` ustawia testowy `AUTH_SECRET`, gdy brak go w środowisku, bo `next start` działa w trybie produkcyjnym, w którym sekret jest wymagany.
