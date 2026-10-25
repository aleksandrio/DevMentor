# Migracja do monorepo (npm workspaces, pakiety app/core/db/ui)

- **Status:** implemented
- **Data:** 2026-10-25
- **Autor:** Claude Code (claude-opus-5-5), na polecenie Aleksandra Kowala
- **Powiązane:** `AGENTS.md` (sekcja „Architektura i stos technologiczny”), `README.md` (sekcja „Architektura”), `.ai/runs/2026-10-25-monorepo-phase-1.md`

## Problem i cel

Repozytorium to pojedyncza aplikacja Next.js w katalogu głównym, a `AGENTS.md` i `README.md` opisują docelowe monorepo z pakietami `app`, `core`, `db` i `ui` oraz stos PostgreSQL + MikroORM, Awilix, Tailwind CSS i shadcn/ui. Celem jest doprowadzenie kodu do tej architektury fazami, bez zmiany zachowania aplikacji w żadnej fazie.

## Zakres (w zakresie / poza zakresem)

W zakresie:

- npm workspaces i pakiety `@devmentor/app`, `@devmentor/core`, `@devmentor/db`, `@devmentor/ui` w `packages/`,
- wspólna konfiguracja TypeScriptu i ESLint, skrypty w katalogu głównym, egzekwowanie granic pakietów,
- infrastruktura `ui` (tokeny Tailwinda, shadcn/ui), `db` (MikroORM, PostgreSQL, migracje) i `app` (kontener Awilix).

Poza zakresem:

- funkcje produktu (profile mentorów, wyszukiwanie, sesje itd.) — mają własne specyfikacje,
- wdrożenie produkcyjne, CI, testy automatyczne (poza tym, czego wymagają kryteria faz).

## Wymagania i kryteria akceptacji

Wspólne dla każdej fazy:

- `npm install` w katalogu głównym działa i daje jeden `package-lock.json`.
- `npm run lint`, `npm run typecheck` i `npm run build` w katalogu głównym kończą się sukcesem.
- `npm run dev` serwuje stronę główną wyglądającą i działającą tak jak przed fazą.
- Kierunek zależności zgodny z `AGENTS.md`; naruszenie granicy pakietu kończy się błędem lintera.

## Projekt rozwiązania

- **Workspace:** `package.json` w katalogu głównym z `"workspaces": ["packages/*"]`, prywatny, bez kodu aplikacji. W katalogu głównym tylko narzędzia całego repo (TypeScript, ESLint) i skrypty delegujące do pakietów (`npm run <x> -w @devmentor/app`).
- **Pakiety źródłowe:** `core`, `db` i `ui` nie mają kroku budowania. `exports` w ich `package.json` wskazuje pliki `.ts`/`.tsx` w `src/`, a Next.js (Turbopack) transpiluje pakiety workspace automatycznie (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/transpilePackages.md`).
- **TypeScript:** `tsconfig.base.json` w katalogu głównym (strict, `moduleResolution: bundler`), każdy pakiet ma własny `tsconfig.json` rozszerzający bazę i skrypt `typecheck` (`tsc --noEmit`).
- **ESLint:** jedna płaska konfiguracja w katalogu głównym (`eslint-config-next` z `rootDir` na `packages/app`) plus reguły `no-restricted-imports` dla granic pakietów.
- **Aplikacja:** `packages/app` z kodem w `src/app` (App Router w katalogu `src`), `public/` i `next.config.ts` w pakiecie. Alias `@/*` → `packages/app/src/*`.
- **Style:** tokeny i import Tailwinda w `packages/ui/src/styles/globals.css`, eksportowane jako `@devmentor/ui/globals.css`. Aplikacja importuje je w swoim `globals.css`. Ponieważ loader `@tailwindcss/turbopack` skanuje klasy od `process.cwd()` (czyli `packages/app`), arkusz `ui` deklaruje `@source` dla własnych źródeł.
- **Next.js agent rules:** `next dev` uruchamiany w `packages/app` dopisywałby własny `packages/app/AGENTS.md`. Blok z instrukcjami Next.js zostaje w głównym `AGENTS.md` (pakiet `next` jest hoistowany do głównego `node_modules`), a w `next.config.ts` ustawiamy `agentRules: false`.

## Plan wdrożenia i testów

### Faza 1: workspace i szkielet pakietów — **ukończona 2026-10-25** (run: `.ai/runs/2026-10-25-monorepo-phase-1.md`)

- Główny `package.json` z workspaces i skryptami `dev`, `build`, `start`, `lint`, `typecheck`.
- Przeniesienie aplikacji (`app/`, `public/`, `next.config.ts`, `next-env.d.ts`) do `packages/app` przez `git mv`.
- Pakiety `core`, `db`, `ui` z `package.json`, `tsconfig.json`, `src/index.ts`:
  - `core`: bazowa klasa błędu domenowego (`DomainError`), bez zależności od frameworków,
  - `db`: punkt wejścia oznaczony `server-only`, zależność od `core`; bez MikroORM (faza 3),
  - `ui`: globalny arkusz Tailwinda z tokenami przeniesiony z aplikacji.
- Zależności między pakietami w `package.json` (`workspace` przez `"*"`), granice w ESLint.
- **Kryteria ukończenia:** kryteria wspólne + strona główna renderuje się z tymi samymi stylami (sprawdzone przez `npm run dev`/`npm run start` i pobranie strony) + celowe naruszenie granicy (np. import `next` w `core`) zgłaszane przez lint.

### Faza 2: pakiet `ui` — shadcn/ui i podział na część frontendową i backendową — **ukończona 2026-10-25** (run: `.ai/runs/2026-10-25-monorepo-phase-2.md`)

- Inicjalizacja shadcn/ui w `packages/ui` (`components.json`, `cn`, tokeny shadcn w `globals.css`), pierwsze komponenty (`Button`, `Card`, `Badge`).
- Grupy tras `src/app/(frontend)` i `src/app/(backend)/admin` z osobnymi layoutami; prosta strona `/admin` z komponentów shadcn/ui.
- **Kryteria ukończenia:** kryteria wspólne + `/admin` renderuje komponent shadcn/ui ze stylami, strona główna bez zmian.

### Faza 3: pakiet `db` — PostgreSQL i MikroORM — **ukończona 2026-10-25** (run: `.ai/runs/2026-10-25-monorepo-phase-3.md`)

- MikroORM z driverem PostgreSQL w `packages/db`: konfiguracja z `DATABASE_URL` i pulą połączeń, singleton ORM w `globalThis` w trybie dev, migrator, skrypty `db:migrate`, `db:migration:create`.
- `docker-compose.yml` z lokalnym PostgreSQL i `.env.example`.
- Pakiety MikroORM w `serverExternalPackages` aplikacji, jeśli bundler tego wymaga.
- **Kryteria ukończenia:** kryteria wspólne (build bez działającej bazy) + na lokalnym PostgreSQL `db:migrate` działa, a migracja wygenerowana z encji tworzy tabelę (zmienione 2026-10-25, zob. „Decyzje i zmiany”).

### Faza 4: Awilix — composition root i pierwszy przepływ żądania — **ukończona 2026-10-25** (run: `.ai/runs/2026-10-25-monorepo-phase-4.md`)

- Kontener w `packages/app/src/server/container.ts`: singleton ORM i konfiguracji, `scoped` repozytoria i serwisy, `createScope()` z `em.fork()` na żądanie.
- Pierwszy pionowy przepływ (port repozytorium i serwis w `core`, implementacja w `db`, użycie w Server Component) jako wzorzec dla kolejnych funkcji, np. „health check” bazy na stronie `/admin`.
- **Kryteria ukończenia:** kryteria wspólne + przepływ działa na lokalnej bazie; serwisy w `core` nie importują Awilix.
- **Projekt szczegółowy (dopisany 2026-10-25 przed implementacją):**
  - `core/src/health/`: typ `DatabaseStatus` (`up` z czasem odpowiedzi, `down` z komunikatem, `not-configured`), port `DatabaseHealthProbe { ping(): Promise<void> }` i serwis `SystemHealthService` (`checkDatabase()`), który mierzy czas `ping()` i zamienia wyjątek na `down`. Serwis dostaje `databaseHealthProbe: DatabaseHealthProbe | null`; `null` oznacza brak skonfigurowanej bazy.
  - `db/src/health/`: `MikroOrmDatabaseHealthProbe` (implementacja portu, `select 1` na wstrzykniętym `em`).
  - `app/src/server/`: `config.ts` (odczyt `DATABASE_URL`, konfiguracja środowiska należy do `app`), `container.ts` (kontener Awilix w trybie `PROXY` i `strict`; `config` i `orm` jako singletony; sonda i serwis jako `scoped`; bez `DATABASE_URL` sonda jest rejestrowana jako `null`, a ORM nie powstaje), `request-scope.ts` (`withRequestScope(fn)`: `await connection()`, `createScope()`, rejestracja `em: orm.em.fork()`, wywołanie `fn(cradle)`, `dispose()` w `finally`).
  - `/admin`: status bazy w osobnym asynchronicznym komponencie w `<Suspense>`. Statyczna powłoka strony zostaje prerenderowana, a status jest liczony przy każdym żądaniu.
  - ORM w MikroORM 7 łączy się leniwie (`init` nie otwiera połączenia), więc niedostępna baza objawia się jako `down`, a nie jako błąd strony.

### Faza 5: domknięcie — **kod i dokumentacja ukończone 2026-10-25** (run: `.ai/runs/2026-10-25-monorepo-phase-5.md`); przeniesienie do `implemented/` po scaleniu PR #1

- Usunięcie z `AGENTS.md` i `README.md` adnotacji o „docelowej” strukturze, aktualizacja sekcji „Uruchomienie lokalne”.
- Przeniesienie tej specyfikacji do `implemented/` — dopiero po scaleniu `feat/monorepo-migration` do `main` (AGENTS.md: „Wdrożona, kod na gałęzi głównej”). Scalenie wymaga decyzji człowieka.
- Weryfikacja całości z czystego klona: `npm ci`, `lint`, `typecheck`, `build`, testy, `start`/`dev`, migracje.

**Wszystkie fazy zrealizowane i scalone do `main` (PR #1, d95408d).**

## Otwarte pytania

- Czy potrzebny jest orkiestrator zadań (Turborepo/Nx) dla cache'owania buildów? Na razie nie: wystarczają npm workspaces.
- Driver PostgreSQL i wersja MikroORM do potwierdzenia w fazie 3 (aktualnie `@mikro-orm/*` 7.x).

## Decyzje i zmiany

<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
- 2026-10-25: specyfikacja utworzona i od razu w realizacji — człowiek polecił zapisać plan i rozpocząć implementację pierwszej fazy (zgoda na wdrożenie).
- 2026-10-25 (faza 1): `turbopack.root` ustawiony jawnie na katalog główny repo (`path.join(__dirname, "../..")`). Automatyczne wykrywanie działało, ale ostrzegało o `package.json` w katalogu nadrzędnym poza repo; jawna wartość jest deterministyczna.
- 2026-10-25 (faza 1): `typecheck` aplikacji to `next typegen && tsc --noEmit`, bo globalne typy tras (`LayoutProps`) powstają dopiero w `.next/types`.
- 2026-10-25 (faza 1): zakaz importów „w głąb” pakietów zapisany jako `regex` w `no-restricted-imports`, bo wzorce gitignore nie łapały ścieżek względnych typu `../../../core/src/...`.
- 2026-10-25 (faza 1): wzorce `.gitignore` dla `node_modules/`, `.next/`, `out/`, `build/` bez wiodącego `/`, żeby obejmowały też katalogi pakietów.
- 2026-10-25 (faza 1): wynikowy CSS różni się od sprzed migracji tylko brakiem klas `.block` i `.visible`. Wcześniej Tailwind skanował cały katalog główny i znajdował te słowa w dokumentacji; aplikacja ich nie używa. Zob. `.ai/lessons/2026-10-25-tailwind-source-scan-monorepo.md`.
- 2026-10-25 (faza 2): shadcn/ui w aktualnej wersji CLI (4.x) ze stylem `base-nova`, czyli komponentami na Base UI (`@base-ui/react`), a nie Radix. To domyślny wybór CLI, a API komponentów (`render`, `nativeButton`) różni się od wersji na Radix.
- 2026-10-25 (faza 2): `cn` pochodzi z pakietu `cn` (zamiennik `clsx` + `tailwind-merge`, który generuje CLI), a nie z tych dwóch bibliotek, jak zakładał plan.
- 2026-10-25 (faza 2): `shadcn init` nie działa na `packages/ui` (brak frameworka), więc bazę skonfigurowano ręcznie według szablonu `shadcn init --monorepo`. Komponenty generuje CLI (`add -c packages/ui`). Zob. `.ai/lessons/2026-10-25-shadcn-cli-in-ui-package.md`.
- 2026-10-25 (faza 2): `@devmentor/ui` eksportuje ścieżki `components/*`, `lib/*`, `hooks/*` i `globals.css` zamiast zbiorczego `.`, zgodnie z konwencją shadcn dla monorepo. Usunięto pusty `src/index.ts`.
- 2026-10-25 (faza 2): tryb ciemny zostaje przy `prefers-color-scheme` (domyślny wariant `dark:`), a ciemne tokeny shadcn są w `@media (prefers-color-scheme: dark)`. Wariant `.dark` z szablonu shadcn zmieniłby działanie klas `dark:` na stronie głównej. `--background` i `--foreground` zachowują dotychczasowe wartości.
- 2026-10-25 (faza 2): z bazy shadcn przyjęto regułę `* { border-color: var(--border); outline-color: ring/50 }`. Na stronie głównej zmienia ona wyłącznie kolor obrysu fokusu (np. przy nawigacji klawiaturą); reguły wszystkich klas strony są identyczne jak w fazie 1.
- 2026-10-25 (faza 2): `lucide-react` (ikony z `components.json`) nie jest jeszcze zainstalowany; dojdzie z pierwszym komponentem, który go wymaga.
- 2026-10-25 (faza 3): bez commitowanej migracji inicjalnej. W repozytorium nie ma jeszcze encji domenowych, a wymyślanie ich bez specyfikacji funkcji byłoby spekulacją. Kryterium zmieniono na: `db:migrate` działa na pustym schemacie i tworzy tabelę `mikro_orm_migrations`, a cały cykl „encja → `migration:create` → `migration:up` → tabela w bazie” sprawdzono tymczasową encją, usuniętą przed commitem. Pierwsza prawdziwa migracja powstanie z pierwszą encją funkcji.
- 2026-10-25 (faza 3): MikroORM 7.2 (ESM-only), encje przez `defineEntity` rejestrowane jawnie w `src/entities/index.ts`. Do czasu pierwszej encji `discovery.warnWhenNoEntities: false`, bo inaczej MikroORM nie startuje.
- 2026-10-25 (faza 3): `serverExternalPackages` niepotrzebne. Build Turbopack z importem `@devmentor/db` w Route Handlerze działał w `next start` i `next dev` (zapisy i odczyty na PostgreSQL). Next.js domyślnie traktuje `@mikro-orm/core` i `pg` jako zewnętrzne.
- 2026-10-25 (faza 3): jeden plik `.env` w katalogu głównym. Next.js wczytuje go przez `loadEnvConfig` z `@next/env` w `next.config.ts` (sam z siebie czyta tylko `packages/app`), a konfiguracja CLI przez `process.loadEnvFile()`.
- 2026-10-25 (faza 3): konfiguracja runtime (`createOrmOptions`, `getOrm`) jest oddzielona od konfiguracji CLI (`mikro-orm.config.ts` z Migratorem), żeby pakiet migracji i ścieżki plików nie trafiały do bundla aplikacji. `getOrm` przyjmuje `databaseUrl` od `app` zamiast czytać `process.env`, bo konfiguracja środowiska należy do `app` (AGENTS.md).
- 2026-10-25 (faza 3): CLI ładuje TypeScript przez `tsx` (devDependency `@devmentor/db`, ustawione w sekcji `"mikro-orm"` w `package.json`).
- 2026-10-25 (przed fazą 4): człowiek zdecydował, że przy sprzeczności z nieśledzonym `.ai/specs/engineering-standards.md` obowiązuje AGENTS.md. Faza 4 idzie według AGENTS.md: kontener Awilix w `packages/app/src/server/container.ts`, kierunek `app → core`, `app → db → core`. Zob. `.ai/lessons/2026-10-25-agents-md-over-foreign-specs.md`.
- 2026-10-25 (faza 4): `withRequestScope` woła `connection()` z `next/server`, zanim dotknie bazy, więc żaden kod z kontenera nie wykona zapytania podczas prerenderowania. `/admin` jest częściowo prerenderowane (◐): statyczna powłoka plus status bazy dosyłany strumieniowo w `<Suspense>`.
- 2026-10-25 (faza 4): przy stanie `down` panel pokazuje tylko „niedostępna”, a przyczynę (np. `ECONNREFUSED host:port`) zapisuje w logu serwera. `/admin` nie ma jeszcze uwierzytelniania, więc szczegóły połączenia nie trafiają na stronę.
- 2026-10-25 (faza 4): kontener jest cache'owany na poziomie modułu (`getContainer`), a nie w `globalThis`. Po HMR budowany jest od nowa, ale ORM i pula połączeń pochodzą z singletonu `getOrm` w `globalThis` (sprawdzone: 1 połączenie po edycjach `container.ts`).
- 2026-10-25 (faza 4): serwis i port zależne od bazy dostają `null`, gdy brakuje `DATABASE_URL`; serwis zwraca wtedy `not-configured`. Dzięki temu aplikacja działa bez bazy, a decyzja o konfiguracji zapada w composition root, a nie w komponentach.
- 2026-10-25 (faza 5): **korekta decyzji z fazy 3.** `loadEnvConfig(repoRoot)` w `next.config.ts` nie działało, bo `@next/env` zwraca wynik pierwszego ładowania (dla `packages/app`). Zastąpione przez `process.loadEnvFile()` dla głównego `.env`, ten sam mechanizm co w CLI MikroORM. Zależność `@next/env` usunięta. Obsługiwany jest tylko `.env`, bez `.env.local` i `.env.development`. Zob. `.ai/lessons/2026-10-25-next-env-loadenvconfig-cache.md`.
- 2026-10-25 (faza 5): skrypty `dev`, `build`, `start` w głównym `package.json` kończą się `--`, bo inaczej `npm run start -- -p <port>` nie działało. Zob. `.ai/lessons/2026-10-25-npm-workspace-script-args.md`.
- 2026-10-25 (faza 5): `"engines": { "node": ">=22.17" }` w głównym `package.json` i wymóg w README, bo MikroORM 7 wymaga Node.js ≥ 22.17.
- 2026-10-25 (faza 5): repozytorium nie ma testów automatycznych ani skryptu `test` (`npm test` → „Missing script”). Weryfikacja migracji opiera się na lint, typecheck, build i sprawdzeniach uruchomieniowych. Testy są poza zakresem tej specyfikacji.
- 2026-10-25 (po fazie 5): dwa punkty niesprawdzone w fazach 3–5 zostały sprawdzone, gdy środowisko dało dostęp do Dockera i Chromium. (1) `docker compose up -d` z obrazem `postgres:17` (17.11), `npm run db:migrate` i `db:migration:pending` według README. (2) Testy e2e w Playwright (`.ai/specs/implemented/2026-10-25-e2e-playwright.md`): strona główna i `/admin` w przeglądarce, z bazą i bez niej. Przy okazji przycisk-link na `/admin` (z fazy 2) zamieniono na `Link` + `buttonVariants`, bo Base UI nadawał mu rolę `button`.
- 2026-10-25: Wszystkie fazy (1–5) scalone do `main` w PR #1 (d95408d). Specyfikacja przeniesiona do `implemented/` ze statusem `implemented`.
