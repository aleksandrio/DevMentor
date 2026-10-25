# DevMentor

DevMentor to platforma, która łączy mentorów z osobami uczącymi się programowania. Daje początkującym i średnio zaawansowanym programistom dostęp do doświadczonych specjalistów, którzy pomogą im się rozwijać. Mentorzy z kolei mogą tu dzielić się wiedzą i budować swoją markę.

> Projekt jest na wczesnym etapie rozwoju. Opisane niżej funkcje to kierunek, w którym zmierzamy, a nie lista gotowych możliwości.

## Cel projektu

Nauka programowania na własną rękę często kończy się utknięciem na problemie, brakiem informacji zwrotnej o kodzie albo niejasną ścieżką rozwoju. DevMentor chce to zmienić, łącząc uczących się z mentorami, którzy przeszli tę drogę i pomogą szybciej zrobić postęp.

## Dla kogo

- **Osoby uczące się programowania**: szukają wsparcia, przeglądu kodu, pomocy przy projektach albo porady zawodowej.
- **Mentorzy**: doświadczeni programiści, którzy chcą dzielić się wiedzą i pomagać innym w rozwoju.

## Planowane funkcje

- Profile mentorów z ich specjalizacjami, technologiami i doświadczeniem
- Wyszukiwanie i filtrowanie mentorów według technologii, poziomu i dostępności
- Profile uczących się z celami i aktualnym poziomem wiedzy
- Umawianie sesji mentoringowych
- Komunikacja między mentorem a uczącym się
- Oceny i opinie po zakończonych sesjach

## Stos technologiczny

- [Next.js](https://nextjs.org) (najnowsza wersja, App Router)
- [React](https://react.dev) (najnowsza wersja)
- [TypeScript](https://www.typescriptlang.org)
- [PostgreSQL](https://www.postgresql.org) jako baza danych
- [MikroORM](https://mikro-orm.io): ORM dla TypeScriptu z migracjami i pulą połączeń
- [Awilix](https://github.com/jeffijoe/awilix): kontener Dependency Injection
- [Tailwind CSS](https://tailwindcss.com): style stron frontendowych
- [shadcn/ui](https://ui.shadcn.com): komponenty stron backendowych (panel administracyjny)
- npm workspaces (monorepo) i ESLint

## Architektura

> Architekturę wprowadzono według specyfikacji [`.ai/specs/implemented/2026-10-25-monorepo-migration.md`](.ai/specs/implemented/2026-10-25-monorepo-migration.md). Szczegółowe zasady dla osób i agentów rozwijających projekt są w [`AGENTS.md`](AGENTS.md).

DevMentor to monorepo oparte na npm workspaces. Kod jest podzielony na pakiety w katalogu `packages/`:

```
packages/
├── app/   # @devmentor/app: aplikacja Next.js (strony, routing, trasy API, Server Actions)
├── core/  # @devmentor/core: serwisy, walidatory, kontener DI, warstwa HTTP, zdarzenia
├── db/    # @devmentor/db: PostgreSQL i MikroORM (encje, migracje, skrypty bazy)
└── ui/    # @devmentor/ui: komponenty interfejsu (Tailwind, shadcn/ui) i wspólna warstwa zaplecza
```

| Pakiet | Odpowiedzialność |
| --- | --- |
| `app` | Strony i layouty App Routera, trasy API (jako konfiguracja `apiHandler`/`makeCrudRoute`) i Server Actions. Do bazy i kontenera sięga tylko przez `core`. |
| `core` | Konfiguracja środowiska (zod), logger (pino), kontener Awilix, serwisy domenowe, walidatory zod współdzielone z formularzami, warstwa HTTP (błędy, koperta odpowiedzi, sesje, CSRF, limit prób) i zdarzenia domenowe. Nie zależy od Next.js ani Reacta. |
| `db` | Konfiguracja MikroORM i puli połączeń, encje, migracje i skrypty bazy. Działa wyłącznie po stronie serwera i nie zależy od innych pakietów. |
| `ui` | Prymitywy shadcn/ui, komponenty frontendowe na Tailwindzie, wspólne tokeny stylu oraz warstwa zaplecza: `apiCall`, `CrudForm`, `DataTable` i stany ładowania, błędu i pustej listy. Nie zależy od innych pakietów; dane dostaje przez propsy. |

### Zależności między pakietami

```
app ──► core ──► db
app ──► ui
```

`db` i `ui` nie zależą od żadnego innego pakietu. `core` korzysta z `db` i składa aplikację w kontenerze Awilix. `app` korzysta z `core` i `ui`. Cykle zależności są niedozwolone.

### Przepływ żądania

1. Komponent kliencki wywołuje trasę API przez `apiCall` z `@devmentor/ui` (z nagłówkiem CSRF), a formularz najpierw waliduje dane tym samym schematem zod, którego używa serwer.
2. Trasa w `packages/app/src/app/api/` to `apiHandler` albo `makeCrudRoute` z `@devmentor/core`: sprawdza CSRF i sesję, tworzy zakres kontenera (`withScope`: `container.createScope()` z własnym `em.fork()`) i parsuje body schematem zod.
3. Z zakresu rozwiązywany jest serwis z `core`, który pracuje na encjach z `db` przez `EntityManager` i zwraca DTO.
4. `apiHandler` zwraca kopertę `{ ok: true, data }` albo `{ ok: false, error }`, a `CrudForm` i `DataTable` pokazują wynik, błędy pól i stany ładowania.

Server Components korzystają z tego samego zakresu przez `withRequestScope` (`packages/app/src/server/request-scope.ts`).

### Baza danych

Schemat bazy zmienia się wyłącznie przez migracje MikroORM przechowywane w `packages/db`. Połączenie konfiguruje zmienna środowiskowa `DATABASE_URL`. W procesie działa jedna instancja ORM z pulą połączeń, a każde żądanie pracuje na własnym, sforkowanym `EntityManager`.

### Interfejs

- **Strony frontendowe**, czyli publiczna część serwisu dla uczących się i mentorów, są stylowane Tailwind CSS.
- **Strony backendowe**, czyli panel administracyjny i inne strony zaplecza, są zbudowane z komponentów shadcn/ui.

Obie części korzystają z komponentów i tokenów stylu z pakietu `ui` i są rozdzielone grupami tras App Routera: `src/app/(marketing)` (strona główna), `src/app/(auth)` (`/login`, `/register`) i `src/app/(backend)/admin` (panel pod adresem `/admin`, lista kont pod `/admin/users` tylko dla administratorów). Komponenty shadcn/ui dodajesz poleceniem `npx shadcn@latest add <komponent> -c packages/ui`.

Szczegółowe zasady dla agentów AI i osób rozwijających projekt opisuje [`AGENTS.md`](AGENTS.md).

## Uruchomienie lokalne

Wymagany jest Node.js w wersji 22.17 lub nowszej (wymóg MikroORM 7), npm oraz Docker z Compose (lokalna baza PostgreSQL).

### Szybki start: `npm run setup`

```bash
npm run setup
```

Komenda instaluje zależności, tworzy `.env` z `.env.example` z wygenerowanym `AUTH_SECRET`, uruchamia PostgreSQL (`docker compose up -d --wait`) i wykonuje migracje. Uruchomiona ponownie pomija kroki, które są już zrobione („pominięto”). Nie nadpisuje istniejącego `.env` ani niepustego `AUTH_SECRET` i nie wypisuje sekretu. Gdy Node.js jest za stary albo Docker nie działa, kończy się błędem, zanim cokolwiek zapisze. Po niej uruchom `npm run dev`.

Wszystkie worktree i klony korzystają z jednej bazy, bo `docker-compose.yml` ma stałą nazwę projektu (`devmentor`). Jeśli wcześniej uruchamiałeś bazę z katalogu o innej nazwie niż `DevMentor`, zatrzymaj stary kontener poleceniem `docker compose -p <nazwa-starego-katalogu> down` (port 5432 będzie wolny, a dane zostaną w wolumenie `<nazwa-starego-katalogu>_postgres-data`).

### Ręcznie, krok po kroku

Zainstaluj zależności:

```bash
npm install
```

Uruchom serwer deweloperski:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000), a panel administracyjny pod [http://localhost:3000/admin](http://localhost:3000/admin). Panel pokazuje stan połączenia z bazą: „działa”, „niedostępna” albo „nieskonfigurowana”, gdy nie ustawiono `DATABASE_URL`.

### Baza danych (PostgreSQL)

Aplikacja buduje się i uruchamia bez bazy. Baza jest potrzebna do migracji i funkcji, które z niej korzystają.

```bash
cp .env.example .env     # DATABASE_URL dla lokalnej bazy z docker-compose.yml; uzupełnij AUTH_SECRET
docker compose up -d     # PostgreSQL 17 na porcie 5432
npm run db:migrate       # wykonuje oczekujące migracje MikroORM
```

`AUTH_SECRET` podpisuje sesje (co najmniej 32 bajty, np. `openssl rand -base64 32`) i jest wymagany w produkcji. Konto zakładasz na `/register`. Rolę administratora (dostęp do `/admin/users`) nadaje tylko `npm run db:user:promote -- --email <e-mail>`; po zmianie roli zaloguj się ponownie.

Nową migrację po zmianie encji tworzysz poleceniem `npm run db:migration:create -- --name <nazwa>`.

### Testy end-to-end (Playwright)

```bash
npx playwright install chromium   # jednorazowo: przeglądarka dla Playwrighta
npm run test:e2e                  # build, next start na porcie 3100, testy w Chromium
```

Testy są w `packages/app/e2e/`. Jeśli w `.env` jest `DATABASE_URL`, testy oczekują działającej bazy (uruchom wcześniej `docker compose up -d` i `npm run db:migrate`) i obejmują też rejestrację, logowanie i panel `/admin/users`. ### Testy jednostkowe i integracyjne

```bash
npm run test                      # Vitest, wszystkie pakiety, wymagane 100% pokrycia
npx agent-browser install         # jednorazowo: Chrome dla agent-browser
npm run test:integration          # PostgreSQL z testcontainers (Docker), build, next start, testy przez agent-browser
npm run app:ephemeral             # tymczasowa baza i aplikacja do ręcznego sprawdzania, do Ctrl+C
```

Testy integracyjne i `agent-browser` wymagają Node.js ≥ 24 i działającego Dockera. CI na GitHub Actions (`.github/workflows/ci.yml`) uruchamia na każdym pull requeście lint, typecheck, audit, testy jednostkowe, build, testy integracyjne i testy e2e (Playwright z bazą).

### Dostępne skrypty

| Skrypt          | Opis                                       |
| --------------- | ------------------------------------------ |
| `npm run setup` | Przygotowuje lokalne środowisko: zależności, `.env`, PostgreSQL, migracje (pomija wykonane kroki) |
| `npm run dev`   | Uruchamia serwer deweloperski              |
| `npm run build` | Buduje wersję produkcyjną aplikacji        |
| `npm run start` | Uruchamia zbudowaną wersję produkcyjną     |
| `npm run lint`  | Sprawdza kod i granice pakietów za pomocą ESLint |
| `npm run typecheck` | Sprawdza typy w każdym pakiecie workspace |
| `npm run test` | Uruchamia testy jednostkowe (Vitest) z progiem pokrycia 100% |
| `npm run test:integration` | Testy integracyjne: PostgreSQL z testcontainers, aplikacja i agent-browser |
| `npm run app:ephemeral` | Tymczasowa baza i aplikacja do ręcznego sprawdzania |
| `npm run test:e2e` | Buduje aplikację i uruchamia testy end-to-end w Playwright (Chromium) |
| `npm run audit` | Sprawdza zależności produkcyjne (`npm audit`, próg high) |
| `npm run db:migrate` | Wykonuje oczekujące migracje bazy danych |
| `npm run db:migration:create` | Tworzy migrację na podstawie zmian w encjach |
| `npm run db:migration:list` | Pokazuje wykonane migracje |
| `npm run db:migration:pending` | Pokazuje oczekujące migracje |
| `npm run db:user:promote` | Nadaje rolę administratora (`-- --email <e-mail>`) |

Skrypty uruchamiasz w katalogu głównym. `dev`, `build` i `start` delegują do pakietu `@devmentor/app`. Zależność dodajesz do pakietu, który jej używa, np. `npm install zod -w @devmentor/core`.

## Struktura projektu

```
packages/
├── app/            # @devmentor/app: Next.js (src/app/(marketing), (auth), (backend)/admin, api/; e2e/)
├── core/           # @devmentor/core: config, container, services/<pojęcie>, validators/<pojęcie>, http, events
├── db/             # @devmentor/db: MikroORM (src/config.ts, src/entities/<pojęcie>, src/migrations, src/scripts)
└── ui/             # @devmentor/ui: shadcn/ui (src/components/ui), src/backend (apiCall, CrudForm, DataTable), globals.css
tsconfig.base.json  # wspólna konfiguracja TypeScriptu
eslint.config.mjs   # ESLint dla całego repo, w tym granice pakietów
.ai/                # specyfikacje, logi przebiegów AI i wnioski (zob. AGENTS.md)
```

Szczegóły pakietów opisuje sekcja [Architektura](#architektura).
