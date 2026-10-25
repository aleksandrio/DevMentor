<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: zasady pracy agentów AI w DevMentor

Ten plik obowiązuje każdego agenta AI (Claude Code, Codex, OpenCode, Cursor i innych) pracującego w tym repozytorium. `CLAUDE.md` importuje ten plik. Jeśli te dokumenty są ze sobą sprzeczne, rozstrzyga AGENTS.md.

O projekcie przeczytasz w `README.md`. Stos opisuje sekcja „Architektura i stos technologiczny” niżej.

## Architektura i stos technologiczny

To są założenia architektoniczne projektu. Trzymaj się ich w każdej zmianie. Odejście od nich (inna biblioteka, nowy pakiet, zmiana kierunku zależności) to decyzja architektoniczna: wymaga specyfikacji w `.ai/specs/` i zgody człowieka.

> Architektura opisana niżej jest wdrożona (`.ai/specs/implemented/2026-10-25-monorepo-migration.md`, a standardy inżynieryjne w `.ai/specs/2026-10-25-engineering-standards-adoption.md`). Pełne uzasadnienie zasad (DRY, SRP, odwrócenie zależności, YAGNI) jest w `.ai/specs/2026-09-01-engineering-standards.md`. Przykładem referencyjnym dla nowych funkcji jest pojęcie `auth`: encja `db/src/entities/auth/user.entity.ts` → serwis `core/src/services/auth/user.service.ts` → walidatory `core/src/validators/auth/` → rejestracja w `core/src/container/container.ts` → trasa `app/src/app/api/users/route.ts` (`makeCrudRoute`) → strona `app/src/app/(backend)/admin/users/` (`apiCall` + `DataTable`).

### Stos

| Obszar | Technologia | Uwagi |
| --- | --- | --- |
| Framework | Next.js (najnowsza wersja, App Router) | Przed pisaniem kodu czytaj `node_modules/next/dist/docs/`, bo API różni się od tego, co znasz z treningu. `cacheComponents` jest wyłączone (zob. „Baza danych”). |
| Język | TypeScript w trybie `strict` | Bez `any` i `@ts-ignore` bez uzasadnienia w komentarzu. |
| UI | React (najnowsza wersja) | Domyślnie Server Components. `"use client"` tylko tam, gdzie potrzebna jest interaktywność. |
| Baza danych | PostgreSQL | Jedyna wspierana baza. |
| ORM | MikroORM | Encje, migracje, pula połączeń, Unit of Work. |
| Dependency Injection | Awilix | Jeden kontener w `packages/core/src/container/`. |
| Walidacja | zod | Jeden schemat na wejście, używany przez trasę API i przez formularz. Konfiguracja środowiska też przechodzi przez zod. |
| Logowanie | pino | Jeden logger z kontenera (`logger`), z redakcją haseł, tokenów i ciasteczek. Bez `console.log` w kodzie aplikacji. |
| Hasła i sesje | bcryptjs, jose | bcrypt z kosztem 12; sesja to JWT HS256 w ciasteczku `httpOnly`. |
| Style stron frontendowych | Tailwind CSS | Publiczna część serwisu (strony dla uczących się i mentorów). |
| Komponenty stron backendowych | shadcn/ui (na Tailwindzie) | Panel administracyjny i inne strony zaplecza. |
| Monorepo | npm workspaces | Pakiety w katalogu `packages/`. Node.js ≥ 22.17 (wymóg MikroORM 7, pole `engines`); testy integracyjne i CI wymagają Node.js ≥ 24 (wymóg `agent-browser`). Skrypty w katalogu głównym delegujące do pakietu kończą się `--`, żeby przekazywały argumenty (`npm run dev -- -p 3001`). |
| Testy | Vitest, Testing Library, testcontainers, agent-browser, Playwright | Testy jednostkowe: Vitest dla wszystkich pakietów (`npm run test`, pokrycie `@vitest/coverage-v8`, próg 100%), `jsdom` i Testing Library dla `ui` i `app`. Testy integracyjne: PostgreSQL z testcontainers i aplikacja sterowana przez `agent-browser` (`npm run test:integration`). E2E: Playwright (`npm run test:e2e`). Zob. „Testy”. |
| Jakość | ESLint, `tsc`, `npm audit` | Zob. „Weryfikacja zmian w kodzie”. |

Nie dodawaj alternatyw dla powyższych narzędzi (innego ORM-a, query buildera, kontenera DI, biblioteki walidacji, loggera, biblioteki komponentów czy CSS-in-JS) bez specyfikacji. Nie dodawaj zależności do czegoś, co pokrywa 20 linii własnego kodu.

### Monorepo i pakiety

```
packages/
├── app/   # @devmentor/app: aplikacja Next.js, routing, strony, Route Handlers (jako konfiguracja), Server Actions
├── core/  # @devmentor/core: konfiguracja, kontener DI, serwisy, walidatory, warstwa HTTP, zdarzenia
├── db/    # @devmentor/db: MikroORM, encje, migracje, konfiguracja połączenia, skrypty CLI bazy
└── ui/    # @devmentor/ui: prymitywy shadcn/ui, komponenty pojęć, wspólna warstwa UI zaplecza
```

To jedyna struktura. Nowy pakiet dodajesz tylko na podstawie specyfikacji, w `packages/<nazwa>` i z nazwą `@devmentor/<nazwa>`. Nie twórz katalogów `modules/<pojęcie>/`, plików `setup.ts`/`acl.ts` dla pojęć ani mechanizmów automatycznego wykrywania.

| Pakiet | Co zawiera | Czego nie zawiera |
| --- | --- | --- |
| `app` | Katalog `app/` Next.js (strony, layouty, Route Handlers, Server Actions), cienkie nakładki serwerowe (`server/request-scope.ts`, `server/session.ts`), komponenty używane przez jedną stronę. | Logiki domenowej, zapytań do bazy, importów `@devmentor/db`, `@mikro-orm/*` i `awilix`, ręcznego `try/catch` w trasach API. |
| `core` | Konfiguracja środowiska (`config/env.ts`), logger, kontener Awilix i `Cradle`, serwisy (`services/<pojęcie>/`), porty integracji zewnętrznych i ich adaptery, walidatory zod (`validators/<pojęcie>/`), warstwa HTTP (`http/`), zdarzenia (`events/`). | Importów z `next`, `react`, `@mikro-orm/*` (typy ORM bierze z `@devmentor/db`), `@devmentor/app` i `@devmentor/ui`. |
| `db` | Konfiguracja MikroORM, encje (`entities/<pojęcie>/`), migracje, skrypty CLI bazy (`scripts/`). | Kodu UI, importów z `next`, `awilix` i żadnego innego pakietu `@devmentor/*`. |
| `ui` | Prymitywy shadcn/ui (`components/ui/`), komponenty pojęć (`components/<pojęcie>/`), wspólna warstwa zaplecza (`backend/`), tokeny Tailwinda. | Importów z innych pakietów `@devmentor/*`, dostępu do danych poza `apiCall`, DI. Komponenty dostają dane przez propsy. |

Dozwolony kierunek zależności między pakietami:

```
app ──► core ──► db
app ──► ui            (ui jest samodzielny)
```

- `db` nie zależy od żadnego innego pakietu `@devmentor/*`, a `ui` też nie.
- `app` sięga do bazy i kontenera wyłącznie przez `core`.
- Cykle zależności są zabronione.
- Granice egzekwuje reguła `no-restricted-imports` w `eslint.config.mjs`. Nie wyłączaj jej. Jeśli granica blokuje sensowną zmianę, to jest decyzja architektoniczna wymagająca specyfikacji.
- `@devmentor/core` ma dwa wejścia. `@devmentor/core` to kod serwerowy (`server-only`). `@devmentor/core/validators/*` to schematy zod bezpieczne dla klienta: importują tylko `zod` i inne walidatory (pilnuje tego ESLint), więc komponent kliencki może ich użyć do walidacji formularza. Typy z `@devmentor/core` wolno importować w kodzie klienckim przez `import type`.
- Koperta odpowiedzi API jest konwencją kształtu, a nie wspólnym typem. `core/src/http` i `ui/src/backend/api` deklarują ją osobno, bo `ui` nie importuje `core`. Wspólny pakiet na takie typy to decyzja wymagająca specyfikacji.
- Pakiety `core`, `db` i `ui` nie mają kroku budowania: `exports` wskazuje pliki źródłowe `.ts`, a Next.js transpiluje je sam. Wspólne ustawienia TypeScriptu są w `tsconfig.base.json`.
- Importuj pakiety po nazwie (`@devmentor/core`) i tylko przez ich publiczny punkt wejścia (`exports` w `package.json`). Nie sięgaj do `../../packages/x/src/...`.
- Narzędzia testowe całego repozytorium (stub `server-only`, setup DOM, wspólna konfiguracja Vitest, harness testów integracyjnych) są w katalogu `test/` w katalogu głównym. To nie jest pakiet i nie trafia tam kod aplikacji.
- Zależności npm instaluj w pakiecie, który ich używa (`npm install <pkg> -w @devmentor/<nazwa>`), a nie w katalogu głównym. W katalogu głównym trzymaj tylko narzędzia całego repozytorium (ESLint, TypeScript, skrypty).

### Konwencja pojęć domenowych

Kod domenowy nie jest podzielony na moduły. Każde pojęcie (`auth`, `mentors`, `availability`, `bookings`, `payments`, `messages`, `favorites`, `reviews`, …) to podkatalog o tej samej nazwie powtórzony w warstwach, które go potrzebują:

- `packages/db/src/entities/<pojęcie>/<nazwa>.entity.ts`
- `packages/core/src/services/<pojęcie>/<nazwa>.service.ts`
- `packages/core/src/validators/<pojęcie>/<nazwa>-<akcja>.schema.ts` (gdy jest wejście do walidacji)
- `packages/app/src/app/api/<pojęcie>/route.ts` i strony w grupie tras persony: `(marketing)`, `(auth)`, `(student)`, `(mentor)`, a zaplecze w `(backend)/admin`
- `packages/ui/src/components/<pojęcie>/` (komponenty związane z kształtem danych pojęcia)

Katalog pojęcia (i grupę tras persony) tworzysz dopiero z pierwszym plikiem. Nie twórz pustych katalogów na zapas. Encja i serwis występują w parze.

Nazewnictwo:

| Element | Konwencja | Przykład |
| --- | --- | --- |
| Katalog pojęcia | liczba mnoga, jedno słowo, zgodne z przestrzenią nazw zdarzeń | `bookings`, `payments` |
| Encja | klasa w PascalCase w liczbie pojedynczej przez `defineEntity`, plik `<nazwa>.entity.ts` | `Booking` → `entities/bookings/booking.entity.ts` |
| Tabela / kolumna | snake_case, tabela w liczbie mnogiej | `bookings`, `created_at` ← `createdAt` |
| Serwis | PascalCase + `Service`, plik `<nazwa>.service.ts` | `BookingService` |
| Port | PascalCase + `Gateway`/`Port`, plik `<nazwa>.port.ts` | `PaymentGateway` → `services/payments/payment-gateway.port.ts` |
| Adapter | PascalCase z nazwą adaptera, w `adapters/` | `services/payments/adapters/mock-payment-gateway.ts` |
| Klucz w `Cradle` | camelCase, jeden wpis na zależność | `bookingService: BookingService` |
| Schemat zod | camelCase + `Schema`, plik `<nazwa>.schema.ts` | `bookingCreateSchema` → `validators/bookings/booking-create.schema.ts` |
| Zdarzenie | `pojęcie.encja.akcja`, czas przeszły | `bookings.booking.created` |
| Strona | `<segment>/page.tsx`, domyślny eksport `<Segment>Page` | `SessionsPage` |
| Błąd | PascalCase + `Error`, dziedziczy po `AppError` (`core/src/http/errors.ts`) | `NotFoundError` |
| Plik komponentu | kebab-case, komponent w PascalCase | `crud-form.tsx` → `CrudForm` |

Zdarzenia definiujesz w `core/src/events/event-map.ts` i emitujesz przez `eventBus` z kontenera po udanej zmianie danych. Subskrybentów rejestrujesz w `core/src/events/subscribers.ts`. To emiter w procesie: bez kolejek i workerów.

Integracje zewnętrzne (płatności, powiadomienia, wideo) idą przez port w `core` z adapterem testowym na MVP. Prawdziwy adapter (np. Stripe) podmieniasz w kontenerze bez zmian w kodzie wywołującym.

### Wspólna warstwa API i UI

Każda trasa i każda strona korzysta z dwóch wspólnych warstw zamiast pisać od nowa pobieranie danych, walidację, autoryzację i obsługę błędów. Nową część tych warstw dodajesz tylko dla naprawdę nowego wzorca.

**Serwer: `packages/core/src/http/`**

- `errors.ts`: hierarchia `AppError` (`ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409, `RateLimitError` 429, `ServiceUnavailableError` 503). Serwisy rzucają tylko te błędy i nigdy nie budują odpowiedzi HTTP.
- `api-handler.ts`: `apiHandler(fn, { auth })` opakowuje każdą trasę: sprawdza CSRF, uwierzytelnia (domyślnie `"session"`, poza tym `"public"` albo rola), otwiera zakres DI, zwraca kopertę `{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`, a nieoczekiwane błędy loguje i zamienia na ogólne 500. Status i nagłówki (np. `Set-Cookie`) ustawiasz, zwracając `new ApiResponse(data, init)`.
- `make-crud-route.ts`: `makeCrudRoute({ service, schemas, auth })` daje `{ GET, POST, PUT, DELETE }` dla zasobów, które są zwykłym CRUD-em. Plik `route.ts` staje się konfiguracją. Przepływy, które nie są CRUD-em (rezerwacja, płatność, logowanie), używają `apiHandler` wprost.
- `validation.ts`: `parseBody(request, schema)`. Do serwisu trafia tylko wynik schematu, nigdy surowe body.
- `auth.ts`: `requireSession`, `requireRole`, `assertOwns`, wydawanie i czyszczenie ciasteczka sesji. `csrf.ts` i `rate-limit.ts` to ochrona CSRF i limit prób.

W `packages/app/src/app/api` nie piszesz `try/catch` ani ręcznego `Response.json`/`NextResponse.json`.

**Klient: `packages/ui/src/backend/`**

- `api/api-call.ts`: `apiCall`/`apiCallOrThrow` to jedyne miejsce z `fetch()` do `/api/*` (reguła `no-restricted-globals`). Ustawia nagłówek CSRF i bezpiecznie czyta kopertę (`readJsonSafe`).
- `forms/crud-form.tsx`: `CrudForm` z tym samym schematem zod co trasa; pokazuje `fieldErrors` z serwera przy polach, obsługuje stan wysyłania, `Cmd/Ctrl+Enter` i `Escape`. Używaj go do każdego formularza tworzenia i edycji.
- `tables/data-table.tsx`: `DataTable` z konfiguracji kolumn, ze stanami ładowania, pustej listy i błędu, z paginacją i akcjami wiersza. Używaj go do każdej listy.
- `feedback/`: `LoadingMessage`, `ErrorMessage`, `EmptyState` to jedyne komponenty tych stanów.

Gdzie trafia nowy komponent:

1. Prymityw shadcn → `ui/src/components/ui/`, tylko przez `npx shadcn@latest add`.
2. Ogólny wzorzec zaplecza niezależny od pojęcia (nowy typ pola, komórki, stanu) → `ui/src/backend/<kategoria>/`.
3. Komponent związany z kształtem danych jednego pojęcia → `ui/src/components/<pojęcie>/`.
4. Komponent używany przez jedną stronę → obok jej `page.tsx` (`_components/`), dopóki nie pojawi się drugi użytkownik.

Własna implementacja zamiast `apiHandler`/`makeCrudRoute`, `CrudForm` albo `DataTable` wymaga uzasadnienia w opisie PR.

### Baza danych: PostgreSQL i MikroORM

- Kod MikroORM (konfiguracja, encje, migracje) mieszka w `packages/db`. Żaden inny pakiet nie importuje `@mikro-orm/*`. `core` korzysta z `EntityManager` i encji eksportowanych przez `@devmentor/db`.
- Połączenie konfiguruje zmienna środowiskowa `DATABASE_URL`. Nie zapisuj danych dostępowych w kodzie ani w repozytorium. Ustawienia puli połączeń trzymaj w konfiguracji MikroORM w `packages/db`.
- W procesie istnieje jedna instancja `MikroORM` (`getOrm` trzyma ją w `globalThis`, żeby HMR nie otwierał nowych pul połączeń).
- Globalnego `EntityManager` nie używaj do obsługi żądań. Każde żądanie, Server Action i zadanie w tle pracuje na własnym `em.fork()` (przez `withScope`).
- Zmiany schematu wprowadzaj wyłącznie migracjami MikroORM generowanymi w `packages/db`. Migracje commituj razem z encjami. Nie edytuj migracji, która trafiła na gałąź główną: popraw błąd nową migracją. `schema:update` jest dozwolone tylko lokalnie do eksperymentów.
- Kod bazy działa tylko na serwerze (`server-only`). Pakiety MikroORM są na domyślnej liście `serverExternalPackages` Next.js.
- Encje to szczegół warstwy danych. Z serwisów zwracasz DTO (np. `UserDto`), a nie encje MikroORM. Kolumny wrażliwe (hash hasła) oznaczasz `.hidden()`.
- Używamy MikroORM 7 (tylko ESM). Encje definiujesz przez `defineEntity` (bez dekoratorów), wspólne kolumny (`id` UUID, `createdAt`, `updatedAt`) dodajesz przez `...baseProperties` z `entities/base.entity.ts`, a każdą encję rejestrujesz ręcznie w `packages/db/src/entities/index.ts`. Każda klasa encji wywołuje `pinEntityName(Klasa, "<nazwa z defineEntity>")` przed `setClass` (zob. `.ai/lessons.md`).
- Sprawdzenie, a potem zapis na współdzielonym zasobie (wolny termin, status rezerwacji, unikalny e-mail) zabezpieczasz ograniczeniem w bazie (unikalność) albo transakcją w serwisie, a nie odczytem przed zapisem. Naruszenie ograniczenia sprawdzasz przez `isUniqueConstraintViolation` z `@devmentor/db`.
- Zapytania tylko przez API encji i query builder MikroORM. Bez surowego SQL sklejanego z danymi użytkownika.
- Zmienne środowiskowe trzymasz w jednym pliku `.env` w katalogu głównym repozytorium (wzór: `.env.example`). Czytają go Next.js i CLI MikroORM, oba przez `process.loadEnvFile()` (w `packages/app/next.config.ts` i `packages/db/src/mikro-orm.config.ts`). Zmienne ustawione w powłoce mają pierwszeństwo. Obsługiwany jest tylko `.env`, bez wariantów `.env.local` i `.env.development`. Nie twórz `.env` w pakietach i nie używaj do tego `loadEnvConfig` z `@next/env` (zob. `.ai/lessons.md`). Każda nowa zmienna trafia do schematu zod w `core/src/config/env.ts` i do `.env.example`.
- Komendy bazy uruchamiasz w katalogu głównym: `npm run db:migrate`, `npm run db:migration:create -- --name <nazwa>`, `npm run db:migration:list`, `npm run db:migration:pending`, `npm run db:user:promote -- --email <e-mail>` (nadaje rolę `admin`; innej drogi nie ma). Lokalną bazę uruchamia `docker compose up -d`.
- Aplikacja musi się budować i startować bez dostępnej bazy. `cacheComponents` jest wyłączone, więc każda strona, layout i Route Handler korzystający z bazy eksportuje `export const dynamic = "force-dynamic"`. Połączenie otwiera dopiero `getOrm()` w budowie kontenera przy pierwszym żądaniu, a `withRequestScope` dodatkowo czeka na `connection()`.

### Dependency Injection: Awilix

- Kontener mieszka w `packages/core/src/container/`: `container.ts` (rejestracje, jedyne miejsce, które wie, jak aplikacja jest złożona) i `cradle.ts` (typ `Cradle` z każdą zależnością). Nową zależność rejestrujesz jawnie: linia w `register` i pole w `Cradle`. Nie używaj `loadModules` ani rejestracji przez skanowanie folderów.
- Serwisy w `core` nie importują kontenera. Zależności dostają przez konstruktor (wstrzykiwanie przez obiekt, tryb `InjectionMode.PROXY`, np. `constructor({ em, eventBus }: Deps)`).
- Czasy życia: konfiguracja, logger, ORM, `eventBus`, limiter prób i klienci usług zewnętrznych to `singleton` (`asValue`). Wszystko, co zależy od `EntityManager` (serwisy domenowe), to `scoped`. Serwis wymagający bazy bez `DATABASE_URL` rejestrujesz jako fabrykę rzucającą `ServiceUnavailableError` (wzór: `userService`).
- Zakres otwiera `withScope(fn)` z `@devmentor/core`: tworzy `container.createScope()` z własnym `em.fork()` i po zakończeniu go zamyka. Trasy API dostają zakres od `apiHandler` (`cradle` w kontekście). Server Components i Server Actions używają `withRequestScope` z `packages/app/src/server/request-scope.ts`, a sesję czytają przez `getSession()` z `packages/app/src/server/session.ts`.
- Nie wywołuj `container.resolve()` w głębi logiki (wzorzec service locator). Rozwiązuj zależność na brzegu żądania i przekazuj ją dalej. Komponenty klienckie i pakiet `ui` nigdy nie korzystają z kontenera.
- Komponent serwerowy pobierający dane przez `withRequestScope` umieszczasz w `<Suspense>`, żeby reszta strony mogła się wyrenderować wcześniej. Wzorzec: `packages/app/src/app/(backend)/admin/_components/database-status.tsx`.

### Bezpieczeństwo: wymagania minimalne

- Hasła: `bcryptjs` z kosztem 12 (`BCRYPT_COST`). Hasło dłuższe niż 72 bajty odrzuca walidator.
- Sesja: JWT HS256 podpisany `AUTH_SECRET` (≥ 32 bajty, z env, wymagany w produkcji), ważny 24 h, bez odświeżania (znane ograniczenie MVP: nie wydłużaj ważności, żeby to obejść). Rola jest w tokenie, więc zmiana roli działa po ponownym zalogowaniu. Token tylko w ciasteczku `httpOnly`, `secure` w produkcji, `SameSite=Lax`, `Path=/`; nigdy w `localStorage`, logach ani odpowiedzi JSON.
- CSRF: żądanie zmieniające stan bez nagłówka `X-Requested-With: devmentor` dostaje 403 (`apiHandler`).
- Limit prób: logowanie i rejestracja (i każdy przyszły reset hasła) przez `authRateLimiter` (5 porażek na IP + e-mail w 15 minut). Licznik jest w pamięci procesu, a IP pochodzi z `X-Forwarded-For`; przed ruchem produkcyjnym trzeba wspólnego magazynu i zaufanego proxy.
- Autoryzacja po stronie serwera w każdej niepublicznej trasie. Mutacje sprawdzają własność rekordu (`assertOwns`), nie tylko zalogowanie; brak sprawdzenia własności to błąd tej samej wagi co brak uwierzytelnienia. Błąd przy sprawdzaniu uprawnień kończy się odmową (fail closed).
- Komunikaty logowania i rejestracji są ogólne i nie zdradzają, czy e-mail jest zarejestrowany.
- Kwoty (cena sesji) liczy serwer; wartość z klienta nigdy nie jest zapisywana bez przeliczenia.
- Sekrety tylko w env. Logger redaguje `password`, `passwordHash`, `token`, `authorization`, `cookie`, `set-cookie`; nowe wrażliwe pola dopisz do `core/src/logger.ts`.

### Jakość kodu i przegląd

- Jedna odpowiedzialność na plik: encja to schemat, serwis to reguły jednego pojęcia, `route.ts` to tylko HTTP (walidacja → autoryzacja → serwis → koperta).
- Bez pustych `catch`: obsłuż, zaloguj z kontekstem przez logger albo rzuć dalej. Bez magicznych liczb: nazwana stała z uzasadnieniem wartości. Wczesne `return` zamiast głębokich `if`. Zmienne logiczne w formie pozytywnej (`isConfirmed`).
- Bez martwego i zakomentowanego kodu oraz `console.log`. Diff PR dotyczy wyłącznie jego celu.
- Zmiana zachowania ma test, który nie przechodzi na kodzie sprzed zmiany; poprawka błędu ma test regresji. Przepływy wrażliwe na wyścigi (rezerwacja, zmiana terminu) mają test integracyjny przypadku współbieżnego.
- **Każda nowa funkcja ma 100% pokrycia testami jednostkowymi: linii, gałęzi, funkcji i instrukcji.** Dotyczy każdego nowego i zmienionego pliku w `packages/*/src` (także komponentów, stron, tras API i komponentów shadcn/ui). Próg 100% egzekwuje `npm run test` i CI; PR, który go obniża, nie przechodzi. Pokrycia nie podbijasz komentarzami `v8 ignore`/`istanbul ignore` ani nowymi wyłączeniami w `vitest.config.ts`. Gałąź, której nie da się osiągnąć testem, usuwasz albo upraszczasz w kodzie. Nowe wyłączenie z pomiaru (tylko kod generowany) wymaga specyfikacji i zgody człowieka.
- Lista kontrolna przeglądu (blokery): uwierzytelnienie po stronie serwera, autoryzacja konkretnego rekordu, sprawdzenie i zapis chronione transakcją albo ograniczeniem, brak sekretów w logach i odpowiedziach, brak niesparametryzowanego wejścia w zapytaniach, ścieżkach i komendach, zapis tylko z wyniku schematu zod (bez mass assignment), odmowa przy błędzie decyzji o dostępie. Poważne: flagi ciasteczek zachowane przy zmianach w auth, test regresji dla poprawek bezpieczeństwa, limit prób na endpointach logowania i rejestracji. Pełna lista: `.ai/specs/2026-09-01-engineering-standards.md`.

### Interfejs: Tailwind CSS i shadcn/ui

- **Strony frontendowe** (publiczna część serwisu dla uczących się i mentorów: grupy `(marketing)`, `(auth)`, później `(student)` i `(mentor)`) stylujesz klasami Tailwind CSS. Nie dodawaj innych bibliotek komponentów ani CSS-in-JS.
- **Strony backendowe** (panel administracyjny, moderacja, zarządzanie treścią: `(backend)/admin`) budujesz z komponentów shadcn/ui i warstwy `ui/src/backend`. Ich wygląd zmieniasz przez warianty i klasy Tailwinda, a nie przez osobne arkusze CSS.
- Komponenty shadcn/ui generujesz CLI shadcn do `packages/ui/src/components/ui/` i stamtąd je importujesz. Nie kopiuj ich do `packages/app` i nie pisz ich ręcznie.
  - Dodawanie: `npx shadcn@latest add <komponent> -c packages/ui` (w katalogu głównym). Konfiguracja jest w `packages/ui/components.json` (styl `base-nova`, czyli komponenty na Base UI, `@base-ui/react`; alias `ui` → `@devmentor/ui/components/ui`).
  - Nie uruchamiaj `shadcn init` na `packages/ui`: CLI nie rozpoznaje tam frameworka, a konfiguracja jest już gotowa.
  - Link wyglądający jak przycisk to `<Link className={buttonVariants()}>`, a nie `Button` z `render={<Link />}`. Base UI nadaje wtedy elementowi `<a>` rolę `button`, przez co czytniki ekranu i testy widzą przycisk zamiast linku.
  - Importujesz po ścieżce: `import { Button } from "@devmentor/ui/components/ui/button"`, `import { apiCall } from "@devmentor/ui/backend/api/api-call"`. `@devmentor/ui` nie ma zbiorczego punktu wejścia; publiczne ścieżki to `components/*`, `backend/*`, `lib/*`, `hooks/*` i `globals.css` (pole `exports`).
- Jeden zestaw tokenów (kolory, typografia, odstępy, promienie) w `packages/ui/src/styles/globals.css` obsługuje obie części serwisu. Tryb ciemny wynika z `prefers-color-scheme` (domyślny wariant `dark:` Tailwinda). Nie dodawaj klasy `.dark` ani `@custom-variant dark` bez specyfikacji.

## Katalog `.ai/`: wspólna pamięć projektu

```
.ai/
├── specs/                  # specyfikacje SDD (Spec-Driven Development)
│   ├── YYYY-MM-DD-slug.md  # aktywne: szkic, zatwierdzone, w realizacji
│   ├── implemented/        # wdrożone
│   └── archive/            # porzucone albo zastąpione
├── runs/                   # logi autonomicznych przebiegów AI
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # indeks wniosków; czytany na starcie każdej sesji
├── lessons/                # pełne opisy wniosków
│   └── YYYY-MM-DD-slug.md
└── cezar/                  # lokalny stan narzędzia cezar (w .gitignore, nie edytuj)
```

Wszystko poza `.ai/cezar/` jest wersjonowane w gicie i commitowane razem z kodem, którego dotyczy.

### Konwencja nazw (wspólna dla specs, runs i lessons)

Format: `YYYY-MM-DD-slug.md`, np. `2026-10-24-mentor-profiles.md`.

- `YYYY-MM-DD` to data utworzenia pliku. Nie zmieniaj jej przy późniejszych edycjach ani przy przenoszeniu pliku.
- `slug` pisz po angielsku, małymi literami, ze słowami rozdzielonymi myślnikami (`[a-z0-9-]`, 2–6 słów). Ma mówić, czego dotyczy plik.
- Jeśli taka nazwa już istnieje, doprecyzuj slug (np. `-v2` albo bardziej opisowe słowo). Nigdy nie nadpisuj cudzego pliku.
- Pliki w tych katalogach nie mają innych nazw. Jedyny wyjątek to `.gitkeep`.

## Zasady obowiązkowe

Zasady są wiążące. Jeśli nie możesz ich spełnić, powiedz to wprost i nie pomijaj ich po cichu.

1. **Na starcie sesji** przeczytaj `.ai/lessons.md`. Przed zmianą funkcji sprawdź, czy w `.ai/specs/` (także w `implemented/`) jest jej specyfikacja, i ją przeczytaj.
2. **Najpierw spec, potem kod.** Każda nietrywialna zmiana (nowa funkcja, zmiana zachowania, model danych, API, architektura) wymaga specyfikacji w `.ai/specs/`. Bez specyfikacji wolno robić tylko drobne poprawki: literówki, oczywiste jednolinijkowe bugfixy, formatowanie i podbijanie zależności bez zmiany zachowania.
3. **Kod zgodny ze specyfikacją.** Gdy w trakcie pracy okaże się, że trzeba odejść od specyfikacji, najpierw zaktualizuj specyfikację (sekcja „Decyzje i zmiany”), a dopiero potem kod.
4. **Każdy przebieg autonomiczny zostawia log** w `.ai/runs/`. Dotyczy to każdej pracy bez bieżącego nadzoru człowieka: zadań z kolejki, automatyzacji, sub-agentów i długich zadań wieloetapowych. Log zakładasz na początku przebiegu, uzupełniasz w trakcie i domykasz przed zakończeniem.
5. **Wnioski zapisujesz od razu.** Po naprawieniu błędu, którego przyczyna nie była oczywista, po odkryciu pułapki w narzędziu, bibliotece lub projekcie albo gdy człowiek cię poprawi, zapisz wniosek w `.ai/lessons/` i dopisz go do indeksu `.ai/lessons.md`, zanim zakończysz zadanie.
6. **Zakończenie zadania** obejmuje: domknięty log przebiegu, zaktualizowany status specyfikacji (i przeniesienie jej, jeśli trzeba) oraz zapisane wnioski. Pliki z `.ai/` idą w tym samym commicie co kod.

## Sposób pracy

Te zasady uzupełniają zasady obowiązkowe. Opierają się na wskazówkach zespołu Claude Code (Boris Cherny).

1. **Złożone zadanie zaczynaj od planu.** Przed zmianą w wielu plikach albo decyzją architektoniczną rozpisz plan (tryb planowania albo sekcje „Projekt rozwiązania” i „Plan wdrożenia i testów” w specyfikacji). Dopracuj go tak, żeby implementacja poszła za jednym podejściem. Przy dużych zmianach poproś drugiego agenta albo człowieka o krytyczny przegląd planu.
2. **Gdy coś się sypie, wróć do planu.** Jeśli implementacja rozjeżdża się z planem albo kolejne poprawki nie pomagają, zatrzymaj się i zaplanuj od nowa zamiast brnąć dalej. Nowy plan zapisz w specyfikacji (zasada obowiązkowa 3).
3. **Łatkę zastępuj porządnym rozwiązaniem.** Jeśli poprawka działa, ale jest prowizoryczna, wykorzystaj to, czego się przy niej nauczyłeś, i wdróż czyste rozwiązanie, zanim oddasz pracę.
4. **Błędy naprawiaj samodzielnie i u źródła.** Przy zgłoszeniu błędu albo padającym lincie lub buildzie sam odtwórz problem, znajdź przyczynę i ją usuń. Nie wyciszaj objawów (`eslint-disable`, `@ts-ignore`, `any`) bez uzasadnienia w komentarzu.
5. **Sam sprawdź, że zmiana działa.** Zielony lint i build to minimum (sekcja „Weryfikacja zmian w kodzie”). Zmianę zachowania sprawdź tak, jak zobaczy ją użytkownik, np. przez `npm run dev` i otwarcie zmienionej strony, i porównaj wynik z kryteriami akceptacji specyfikacji. Nie ogłaszaj sukcesu bez dowodu. To, czego nie sprawdziłeś, wpisz wprost do logu przebiegu.
6. **Każda korekta staje się regułą.** Gdy człowiek cię poprawi, zapisz wniosek (zasada obowiązkowa 5) jako konkretną regułę, która zapobiegnie powtórce, a nie jako opis zdarzenia. Jeśli błąd wraca mimo wpisu, doprecyzuj istniejącą regułę zamiast dodawać nową.
7. **Odciążaj kontekst sub-agentami.** Szerokie przeszukiwanie kodu, research i niezależne podzadania zlecaj sub-agentom, żeby główny kontekst pozostał czysty. Równoległe zadania prowadź w osobnych gałęziach albo git worktree, każde z własnym logiem w `.ai/runs/`.
8. **Powtarzalną procedurę zamieniaj w narzędzie.** Jeśli ten sam ciąg kroków wykonujesz regularnie, zaproponuj skrypt w `package.json` albo komendę lub skill commitowane w repozytorium, żeby korzystali z nich wszyscy agenci.

## `.ai/specs/`: specyfikacje SDD

Cykl życia:

| Etap | Miejsce | `Status` w nagłówku |
| --- | --- | --- |
| Szkic, dyskusja | `.ai/specs/` | `draft` |
| Zatwierdzona przez człowieka | `.ai/specs/` | `approved` |
| W realizacji | `.ai/specs/` | `in-progress` |
| Wdrożona, kod na gałęzi głównej | `.ai/specs/implemented/` | `implemented` |
| Porzucona albo zastąpiona | `.ai/specs/archive/` | `archived` (z powodem i linkiem do następczyni) |

- Pliki przenoś przez `git mv`, żeby zachować historię, a nazwy nie zmieniaj.
- Bez zgody człowieka nie zaczynaj implementacji specyfikacji, która ma status `draft`.
- Specyfikacje w `implemented/` opisują, jak system działa. Gdy późniejsza zmiana unieważnia ich treść, napisz nową specyfikację i odnieś się do starej. Nie przepisuj historii.
- W komentarzach w kodzie i w opisach commitów możesz cytować specyfikację po nazwie pliku.

Szablon:

```markdown
# <Tytuł>

- **Status:** draft | approved | in-progress | implemented | archived
- **Data:** YYYY-MM-DD
- **Autor:** <człowiek / agent>
- **Powiązane:** <inne specs, issues, PR>

## Problem i cel
## Zakres (w zakresie / poza zakresem)
## Wymagania i kryteria akceptacji
## Projekt rozwiązania
## Plan wdrożenia i testów
## Otwarte pytania
## Decyzje i zmiany
<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
```

## `.ai/runs/`: logi przebiegów autonomicznych

- Jeden plik na jeden przebieg. Data w nazwie to dzień startu, a slug opisuje zadanie.
- Log to rzetelny zapis tego, co się wydarzyło, a nie raport sukcesu. Zapisuj nieudane próby, porzucone podejścia i rzeczy pominięte.
- Gdy przebieg jest przerwany, log musi pozwolić następnemu agentowi podjąć pracę (sekcja „Następne kroki”).
- Raz domkniętego logu nie edytuje się później. Kontynuacja to nowy przebieg z odnośnikiem do poprzedniego.

Szablon:

```markdown
# <Zadanie>

- **Status:** in-progress | done | partial | failed | blocked
- **Start / koniec:** YYYY-MM-DD HH:MM / YYYY-MM-DD HH:MM
- **Agent / model:** <np. Claude Code / claude-opus-5-5>
- **Specyfikacja:** .ai/specs/...
- **Gałąź / commity:** <branch, hashe>

## Cel
## Przebieg
<!-- chronologicznie: co zrobiono, decyzje, napotkane problemy -->
## Weryfikacja
<!-- uruchomione komendy (lint, build, testy) i ich wynik -->
## Wynik
## Następne kroki / blokery
## Wnioski
<!-- linki do wpisów w .ai/lessons/ dodanych w tym przebiegu -->
```

## `.ai/lessons.md` i `.ai/lessons/`: pamięć długoterminowa

- `.ai/lessons/YYYY-MM-DD-slug.md` to pełny opis jednego wniosku: kontekst, objaw, przyczyna, rozwiązanie i reguła na przyszłość.
- `.ai/lessons.md` to krótki indeks, który agenci czytają na starcie każdej sesji. Ma jedną linię na wniosek, pogrupowaną tematycznie: `- [Tytuł](lessons/YYYY-MM-DD-slug.md): reguła w jednym zdaniu`. Pisz linie tak, żeby sama reguła wystarczała do działania bez otwierania pliku.
- Zanim dodasz wpis, sprawdź, czy podobny już istnieje. Jeśli tak, zaktualizuj go zamiast tworzyć duplikat.
- Wniosek, który okazał się błędny lub nieaktualny, usuń albo popraw w obu miejscach, a zmianę opisz w pliku wniosku.
- Nie zapisuj tu rzeczy, które da się odczytać z kodu, z historii gita ani z tego pliku. Liczy się to, co nieoczywiste.
- Nigdy nie zapisuj sekretów, tokenów ani danych osobowych.

Szablon wniosku:

```markdown
# <Tytuł>

- **Data:** YYYY-MM-DD
- **Źródło:** <run / spec / PR / rozmowa>
- **Tagi:** <np. nextjs, tailwind, testy>

## Kontekst
## Co się stało / objaw
## Przyczyna
## Rozwiązanie
## Reguła na przyszłość
```

## Weryfikacja zmian w kodzie

Przed commitem uruchom:

```bash
npm run lint
npm run typecheck
npm run test               # Vitest, wszystkie pakiety, próg pokrycia 100%
npm run build
npm run audit              # npm audit bez zależności deweloperskich, próg high
npm run test:integration   # przy zmianach serwisów, encji, migracji, tras, stron albo konfiguracji (Docker)
npm run test:e2e           # przy zmianach stron, stylów, tras, API albo konfiguracji uruchomieniowej
```

Wszystkie komendy uruchamiasz w katalogu głównym repozytorium i sprawdzasz ich kod wyjścia (nie maskuj go potokiem do `tail`). `typecheck` sprawdza każdy pakiet workspace osobno oraz narzędzia w katalogu głównym (`tsconfig.json`), a `lint` pilnuje też granic między pakietami. CI (`.github/workflows/ci.yml`) uruchamia na każdym pull requeście `lint`, `typecheck`, `audit`, `test`, `build`, `test:integration` i `test:e2e` (z bazą PostgreSQL); czerwone CI blokuje scalenie.

### Testy

- **Jednostkowe** (`npm run test`): Vitest w trybie projektów z katalogu głównego (`vitest.config.ts` + `packages/*/vitest.config.*`). Pliki `*.test.ts`/`*.test.tsx` leżą obok testowanego kodu w `src/`. `core` i `db` działają w środowisku `node`, `ui` i `app` w `jsdom` z Testing Library (`test/dom-setup.ts`). Test jednostkowy nie łączy się z bazą ani siecią: MikroORM, `fetch`, `next/navigation`, `next/headers` i serwisy zastępujesz atrapami (`vi.mock`, `vi.fn`). Trasę API testujesz przez atrapę `apiHandler`, która zwraca funkcję obsługi, i atrapy serwisów w `cradle`. Pojedynczy plik uruchamiasz przez `npx vitest run <ścieżka>`. Pokrycie fragmentu mierzysz filtrem ścieżki (`npx vitest run packages/ui --coverage`), a nie `--project`, bo z `--project` Vitest 5 nie zbiera pokrycia (zob. `.ai/lessons.md`).
- **Integracyjne** (`npm run test:integration`, wymaga Dockera i jednorazowo `npx agent-browser install`): `test/integration/global-setup.ts` uruchamia PostgreSQL 17 z testcontainers, wykonuje `npm run db:migrate`, buduje aplikację i startuje `next start` na wolnym porcie. Testy są w `packages/<pakiet>/integration/*.int.test.ts`: serwisy `core` na prawdziwej bazie (tu należą testy współbieżności) i przepływy w przeglądarce przez `AgentBrowser` z `test/integration/agent-browser.ts` (nakładka na CLI `agent-browser`, osobna sesja na test). Adres bazy i aplikacji dają `testDatabaseUrl()` i `testBaseUrl()` z `test/integration/context.ts`.
- **Tymczasowa instancja do ręcznego sprawdzania** (`npm run app:ephemeral`): ta sama baza i aplikacja bez testów. Skrypt wypisuje adres aplikacji i `DATABASE_URL` i działa do `Ctrl+C`, po czym sprząta kontener. Stronę sprawdzasz przez `npx agent-browser open <adres>`, `snapshot`, `find label … fill`, `find role button click --name …`. Jeśli Chrome kończy się błędem „Socket path too long”, uruchom `agent-browser` z `TMPDIR=/tmp` (zob. `.ai/lessons.md`).
- **E2E** (`npm run test:e2e`): Playwright, Chromium headless. Buduje aplikację, uruchamia `next start` na porcie 3100 i testuje ją w przeglądarce. Testy są w `packages/app/e2e/`. Gdy `DATABASE_URL` jest ustawione (np. w głównym `.env` dla bazy z `docker compose up -d`), testy oczekują działającej i zmigrowanej bazy (`npm run db:migrate`) i uruchamiają też scenariusze logowania; bez niej oczekują statusu „nieskonfigurowana” i pomijają scenariusze z bazą. `AUTH_SECRET` dla testów ustawia `playwright.config.ts`, jeśli brak go w środowisku. Przeglądarkę instalujesz raz: `npx playwright install chromium`.

Wynik zapisz w logu przebiegu (sekcja „Weryfikacja”).
