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
├── app/   # @devmentor/app: aplikacja Next.js (strony, routing, Server Actions, kontener DI)
├── core/  # @devmentor/core: logika domenowa i części wielokrotnego użytku
├── db/    # @devmentor/db: PostgreSQL i MikroORM (encje, repozytoria, migracje)
└── ui/    # @devmentor/ui: komponenty interfejsu wielokrotnego użytku (Tailwind, shadcn/ui)
```

| Pakiet | Odpowiedzialność |
| --- | --- |
| `app` | Główny kod aplikacji. Strony i layouty App Routera, Route Handlers i Server Actions. Tu powstaje kontener Awilix, który składa całą aplikację (composition root). |
| `core` | Części wielokrotnego użytku: modele i serwisy domenowe, interfejsy repozytoriów, walidacja, narzędzia. Nie zależy od Next.js, Reacta ani bazy danych. |
| `db` | Narzędzia i biblioteki do zarządzania danymi: konfiguracja MikroORM i puli połączeń, encje, implementacje repozytoriów, migracje i seedy. Działa wyłącznie po stronie serwera. |
| `ui` | Komponenty interfejsu wielokrotnego użytku: komponenty frontendowe na Tailwindzie, komponenty shadcn/ui dla zaplecza, wspólne tokeny stylu. Dane dostaje przez propsy. |

### Zależności między pakietami

```
app ──► core
app ──► db ──► core
app ──► ui ──► core
```

`core` jest rdzeniem bez zależności od pozostałych pakietów. `db` i `ui` korzystają z `core`, ale nie wiedzą o sobie nawzajem. `app` łączy wszystko w działającą aplikację. Cykle zależności są niedozwolone.

### Przepływ żądania

1. Żądanie trafia do Server Component, Server Action albo Route Handlera w `packages/app`.
2. Aplikacja tworzy zakres kontenera Awilix (`withRequestScope` w `packages/app/src/server/request-scope.ts`: `container.createScope()`) z własnym `EntityManager` MikroORM (`em.fork()`).
3. Z zakresu rozwiązywany jest serwis z `core`. Serwis dostaje swoje zależności, np. repozytoria z `db`, przez konstruktor.
4. Repozytorium odczytuje lub zapisuje dane w PostgreSQL przez MikroORM, korzystając ze wspólnej puli połączeń.
5. Wynik w postaci typów domenowych lub DTO wraca do warstwy `app`, która renderuje go komponentami z `ui`.

### Baza danych

Schemat bazy zmienia się wyłącznie przez migracje MikroORM przechowywane w `packages/db`. Połączenie konfiguruje zmienna środowiskowa `DATABASE_URL`. W procesie działa jedna instancja ORM z pulą połączeń, a każde żądanie pracuje na własnym, sforkowanym `EntityManager`.

### Interfejs

- **Strony frontendowe**, czyli publiczna część serwisu dla uczących się i mentorów, są stylowane Tailwind CSS.
- **Strony backendowe**, czyli panel administracyjny i inne strony zaplecza, są zbudowane z komponentów shadcn/ui.

Obie części korzystają z komponentów i tokenów stylu z pakietu `ui` i są rozdzielone grupami tras App Routera: `src/app/(frontend)` (strona główna) i `src/app/(backend)/admin` (panel pod adresem `/admin`). Komponenty shadcn/ui dodajesz poleceniem `npx shadcn@latest add <komponent> -c packages/ui`.

Szczegółowe zasady dla agentów AI i osób rozwijających projekt opisuje [`AGENTS.md`](AGENTS.md).

## Uruchomienie lokalne

Wymagany jest Node.js w wersji 22.17 lub nowszej (wymóg MikroORM 7) oraz npm.

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
cp .env.example .env     # DATABASE_URL dla lokalnej bazy z docker-compose.yml
docker compose up -d     # PostgreSQL 17 na porcie 5432
npm run db:migrate       # wykonuje oczekujące migracje MikroORM
```

Nową migrację po zmianie encji tworzysz poleceniem `npm run db:migration:create -- --name <nazwa>`.

### Testy end-to-end (Playwright)

```bash
npx playwright install chromium   # jednorazowo: przeglądarka dla Playwrighta
npm run test:e2e                  # build, next start na porcie 3100, testy w Chromium
```

Testy są w `packages/app/e2e/`. Jeśli w `.env` jest `DATABASE_URL`, testy oczekują działającej bazy (uruchom wcześniej `docker compose up -d` i `npm run db:migrate`).

### Dostępne skrypty

| Skrypt          | Opis                                       |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Uruchamia serwer deweloperski              |
| `npm run build` | Buduje wersję produkcyjną aplikacji        |
| `npm run start` | Uruchamia zbudowaną wersję produkcyjną     |
| `npm run lint`  | Sprawdza kod i granice pakietów za pomocą ESLint |
| `npm run typecheck` | Sprawdza typy w każdym pakiecie workspace |
| `npm run test:e2e` | Buduje aplikację i uruchamia testy end-to-end w Playwright (Chromium) |
| `npm run db:migrate` | Wykonuje oczekujące migracje bazy danych |
| `npm run db:migration:create` | Tworzy migrację na podstawie zmian w encjach |
| `npm run db:migration:list` | Pokazuje wykonane migracje |
| `npm run db:migration:pending` | Pokazuje oczekujące migracje |

Skrypty uruchamiasz w katalogu głównym. `dev`, `build` i `start` delegują do pakietu `@devmentor/app`. Zależność dodajesz do pakietu, który jej używa, np. `npm install zod -w @devmentor/core`.

## Struktura projektu

```
packages/
├── app/            # @devmentor/app: aplikacja Next.js (src/app/(frontend), src/app/(backend)/admin, public/)
├── core/           # @devmentor/core: logika domenowa
├── db/             # @devmentor/db: MikroORM (src/config.ts, src/entities, src/migrations), tylko serwer
└── ui/             # @devmentor/ui: komponenty shadcn/ui (src/components), tokeny i style Tailwinda (globals.css)
tsconfig.base.json  # wspólna konfiguracja TypeScriptu
eslint.config.mjs   # ESLint dla całego repo, w tym granice pakietów
.ai/                # specyfikacje, logi przebiegów AI i wnioski (zob. AGENTS.md)
```

Szczegóły pakietów opisuje sekcja [Architektura](#architektura).
