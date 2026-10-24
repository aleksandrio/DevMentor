# Wnioski (lessons learned)

Indeks pamięci długoterminowej projektu. Każdy agent czyta ten plik na starcie sesji.

Jedna linia na wniosek, pogrupowane tematycznie:
`- [Tytuł](lessons/YYYY-MM-DD-slug.md): reguła w jednym zdaniu`

Zasady prowadzenia indeksu opisuje `AGENTS.md`, sekcja „`.ai/lessons.md` i `.ai/lessons/`”.

## Tailwind

- [Tailwind w monorepo skanuje klasy tylko od katalogu roboczego aplikacji](lessons/2026-10-25-tailwind-source-scan-monorepo.md): każdy pakiet z klasami Tailwinda (np. `packages/ui`) musi być objęty dyrektywą `@source` w arkuszu importowanym przez aplikację, bo `@tailwindcss/turbopack` skanuje tylko od `process.cwd()` (`packages/app`).
- [shadcn CLI w pakiecie `ui`: `init` nie działa, `add` działa](lessons/2026-10-25-shadcn-cli-in-ui-package.md): komponenty dodawaj przez `npx shadcn@latest add <komponent> -c packages/ui`; nie uruchamiaj `shadcn init` na `packages/ui`, bo nie rozpozna frameworka, a `add` bez bazy dociąga tylko `cn`.

## Next.js

- [Nieaktualne typy w `.next/dev/types` psują typecheck i build po przeniesieniu tras](lessons/2026-10-25-stale-next-dev-types.md): błąd TS w `.next/dev/types/...` po zmianie struktury tras usuwasz przez `rm -rf packages/app/.next/dev`, a nie zmianą kodu.
- [Uruchamianie modułów serwerowych poza Next.js](lessons/2026-10-25-run-server-modules-in-node.md): kod z `server-only` uruchamiasz w skrypcie przez `node --conditions=react-server --import tsx plik.mts` (`.mts`, bo `@devmentor/app` nie jest ESM); kodu z `connection()` nie testuj w ten sposób, tylko przez `next start`/`next dev`.
- [`loadEnvConfig` z `@next/env` w `next.config.ts` nie wczytuje drugiego katalogu](lessons/2026-10-25-next-env-loadenvconfig-cache.md): `.env` z katalogu głównego wczytuj przez `process.loadEnvFile()`, bo `loadEnvConfig` zwraca wynik pierwszego ładowania; zmienne sprawdzaj w prawdziwym `next start`/`next dev`.

## Baza danych

- [MikroORM 7: brak encji blokuje start, CLI nie czyta `.env` i potrzebuje loadera TS](lessons/2026-10-25-mikro-orm-7-setup-pitfalls.md): przy pustej liście encji wymagane jest `discovery.warnWhenNoEntities: false`; CLI ładuje `.ts` przez `tsx` (`"mikro-orm".tsLoader` w `packages/db/package.json`), a `.env` wczytuje sama konfiguracja przez `process.loadEnvFile()`; `init` łączy się leniwie, więc błędy połączenia obsługuj przy zapytaniu.
- [Weryfikacja na PostgreSQL bez Dockera](lessons/2026-10-25-postgres-without-docker.md): gdy gniazdo Dockera jest niedostępne, uruchom `embedded-postgres` w `/tmp` (poza zależnościami projektu) i zanotuj to w logu przebiegu.

## Monorepo i npm

- [Skrypt delegujący do workspace musi kończyć się `--`](lessons/2026-10-25-npm-workspace-script-args.md): skrypty `npm run <x> -w <pakiet>` w głównym `package.json` kończ `--`, inaczej argumenty (np. `-p 3001`) przejmuje wewnętrzny npm.

## Proces

- [AGENTS.md ma pierwszeństwo przed `engineering-standards.md`](lessons/2026-10-25-agents-md-over-foreign-specs.md): przy sprzeczności stosuj AGENTS.md (`db → core`, kontener Awilix w `packages/app`); pliku `.ai/specs/engineering-standards.md` nie edytuj, nie przenoś i nie commituj bez polecenia człowieka.
