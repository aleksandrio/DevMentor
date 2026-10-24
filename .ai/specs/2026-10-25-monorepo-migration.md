# Migracja do monorepo (npm workspaces, pakiety app/core/db/ui)

- **Status:** in-progress
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

### Faza 2: pakiet `ui` — shadcn/ui i podział na część frontendową i backendową

- Inicjalizacja shadcn/ui w `packages/ui` (`components.json`, `cn` z `clsx` i `tailwind-merge`, tokeny shadcn w `globals.css`), pierwszy komponent (`Button`).
- Grupy tras `src/app/(frontend)` i `src/app/(backend)/admin` z osobnymi layoutami; prosta strona `/admin` z komponentów shadcn/ui.
- **Kryteria ukończenia:** kryteria wspólne + `/admin` renderuje komponent shadcn/ui ze stylami, strona główna bez zmian.

### Faza 3: pakiet `db` — PostgreSQL i MikroORM

- MikroORM z driverem PostgreSQL w `packages/db`: konfiguracja z `DATABASE_URL` i pulą połączeń, singleton ORM w `globalThis` w trybie dev, migrator, skrypty `db:migrate`, `db:migration:create`.
- `docker-compose.yml` z lokalnym PostgreSQL i `.env.example`.
- Pakiety MikroORM w `serverExternalPackages` aplikacji, jeśli bundler tego wymaga.
- **Kryteria ukończenia:** kryteria wspólne (build bez działającej bazy) + na lokalnym PostgreSQL `db:migrate` wykonuje migrację inicjalną.

### Faza 4: Awilix — composition root i pierwszy przepływ żądania

- Kontener w `packages/app/src/server/container.ts`: singleton ORM i konfiguracji, `scoped` repozytoria i serwisy, `createScope()` z `em.fork()` na żądanie.
- Pierwszy pionowy przepływ (port repozytorium i serwis w `core`, implementacja w `db`, użycie w Server Component) jako wzorzec dla kolejnych funkcji, np. „health check” bazy na stronie `/admin`.
- **Kryteria ukończenia:** kryteria wspólne + przepływ działa na lokalnej bazie; serwisy w `core` nie importują Awilix.

### Faza 5: domknięcie

- Usunięcie z `AGENTS.md` i `README.md` adnotacji o „docelowej” strukturze, aktualizacja sekcji „Uruchomienie lokalne”.
- Przeniesienie tej specyfikacji do `implemented/`.

**Następna faza: 2.**

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
