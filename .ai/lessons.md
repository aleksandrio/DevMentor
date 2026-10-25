# Wnioski (lessons learned)

Indeks pamięci długoterminowej projektu. Każdy agent czyta ten plik na starcie sesji.

Jedna linia na wniosek, pogrupowane tematycznie:
`- [Tytuł](lessons/YYYY-MM-DD-slug.md): reguła w jednym zdaniu`

Zasady prowadzenia indeksu opisuje `AGENTS.md`, sekcja „`.ai/lessons.md` i `.ai/lessons/`”.

## Tailwind

- [Tailwind w monorepo skanuje klasy tylko od katalogu roboczego aplikacji](lessons/2026-10-25-tailwind-source-scan-monorepo.md): każdy pakiet z klasami Tailwinda (np. `packages/ui`) musi być objęty dyrektywą `@source` w arkuszu importowanym przez aplikację, bo `@tailwindcss/turbopack` skanuje tylko od `process.cwd()` (`packages/app`).
- [Base UI `Button` z `render={<Link />}` ma rolę `button`](lessons/2026-10-25-base-ui-button-link-role.md): nawigację wyglądającą jak przycisk rób przez `<Link className={buttonVariants()}>`, a `Button` z Base UI zostaw dla akcji.
- [shadcn CLI w pakiecie `ui`: `init` nie działa, `add` działa](lessons/2026-10-25-shadcn-cli-in-ui-package.md): komponenty dodawaj przez `npx shadcn@latest add <komponent> -c packages/ui`; nie uruchamiaj `shadcn init` na `packages/ui`, bo nie rozpozna frameworka, a `add` bez bazy dociąga tylko `cn`.

## Next.js

- [Nieaktualne typy w `.next/dev/types` psują typecheck i build po przeniesieniu tras](lessons/2026-10-25-stale-next-dev-types.md): błąd TS w `.next/dev/types/...` po zmianie struktury tras usuwasz przez `rm -rf packages/app/.next/dev`, a nie zmianą kodu.
- [Uruchamianie modułów serwerowych poza Next.js](lessons/2026-10-25-run-server-modules-in-node.md): kod z `server-only` uruchamiasz w skrypcie przez `node --conditions=react-server --import tsx plik.mts` (`.mts`, bo `@devmentor/app` nie jest ESM); kodu z `connection()` nie testuj w ten sposób, tylko przez `next start`/`next dev`.
- [`loadEnvConfig` z `@next/env` w `next.config.ts` nie wczytuje drugiego katalogu](lessons/2026-10-25-next-env-loadenvconfig-cache.md): `.env` z katalogu głównego wczytuj przez `process.loadEnvFile()`, bo `loadEnvConfig` zwraca wynik pierwszego ładowania; zmienne sprawdzaj w prawdziwym `next start`/`next dev`.

## Baza danych

- [MikroORM 7: brak encji blokuje start, CLI nie czyta `.env` i potrzebuje loadera TS](lessons/2026-10-25-mikro-orm-7-setup-pitfalls.md): przy pustej liście encji wymagane jest `discovery.warnWhenNoEntities: false`; CLI ładuje `.ts` przez `tsx` (`"mikro-orm".tsLoader` w `packages/db/package.json`), a `.env` wczytuje sama konfiguracja przez `process.loadEnvFile()`; `init` łączy się leniwie, więc błędy połączenia obsługuj przy zapytaniu.
- [Encje MikroORM w Next.js: przypnij nazwę klasy](lessons/2026-10-25-mikro-orm-entity-name-minification.md): każda klasa encji wywołuje `pinEntityName(Klasa, "<name>")` przed `setClass`, bo strony i trasy API mają osobne kopie `@devmentor/db`, a minifikator zmienia nazwy klas (`MetadataError … entity u` tylko w `next start`).
- [Weryfikacja na PostgreSQL bez Dockera](lessons/2026-10-25-postgres-without-docker.md): gdy gniazdo Dockera jest niedostępne, uruchom `embedded-postgres` w `/tmp` (poza zależnościami projektu) i zanotuj to w logu przebiegu.

## Testy

- [Playwright w tym repo: kolory w `lab()` i cache w `TMPDIR`](lessons/2026-10-25-playwright-e2e-pitfalls.md): kolory w testach porównuj z obliczoną wartością tokenu CSS (Chromium zwraca `lab()`), a `.ai/**` i artefakty testów trzymaj w `globalIgnores` ESLint.
- [Vitest 5: `--project` razem z `--coverage` nie zbiera pokrycia](lessons/2026-10-25-vitest-coverage-project-filter.md): pokrycie części repozytorium mierz filtrem ścieżki (`npx vitest run packages/<pakiet> --coverage`), bo z `--project` raport pokazuje `0/0`.
- [agent-browser: `wait --url` dopasowuje wzorzec, Chrome potrzebuje krótkiego `TMPDIR`](lessons/2026-10-25-agent-browser-pitfalls.md): na dokładny adres czekaj przez `wait --fn` z `location.pathname + location.search`, a `agent-browser` uruchamiaj z `TMPDIR=/tmp`, gdy Chrome zgłasza „Socket path too long”.

## Monorepo i npm

- [Skrypt delegujący do workspace musi kończyć się `--`](lessons/2026-10-25-npm-workspace-script-args.md): skrypty `npm run <x> -w <pakiet>` w głównym `package.json` kończ `--`, inaczej argumenty (np. `-p 3001`) przejmuje wewnętrzny npm.

## Środowisko agenta

- [CLI `tsx` nie działa przy długim `TMPDIR`](lessons/2026-10-25-tsx-cli-ipc-socket-path.md): skrypty TypeScript uruchamiaj przez `node --import tsx <plik>`, bo CLI `tsx` otwiera gniazdo IPC w `TMPDIR` i przy długiej ścieżce kończy się `listen EINVAL`.
- [Potok do `tail` ukrywa kod wyjścia](lessons/2026-10-25-exit-code-masked-by-pipe.md): przed commitem sprawdzaj `$?` samej komendy (`lint`, `typecheck`, `test`, `build`), nie wiąż `git commit` przez `&&` z komendą przepuszczoną przez `| tail`.
- [Zabijanie procesów po wzorcu zabija też powłokę](lessons/2026-10-25-kill-by-pattern-kills-shell.md): procesy zatrzymuj po nazwie (`ps -eo pid,comm`, np. `next-server`) albo po PID, nie przez `pkill -f`/`grep` po linii poleceń w tym samym wywołaniu.

## Proces

- [Skille `om-*` dostarcza cezar przy starcie zadania](lessons/2026-10-25-cezar-provisions-om-skills.md): brak katalogu `om-*` w `.claude/skills/` przy samej kontroli pokrycia nie jest problemem (cezar kopiuje skille z `open-mercato/skills`), ale gdy łańcuch musi wywołać nieobecny skill, zainstaluj kolekcję przez `npx skills add open-mercato/skills --skill '*' -a claude-code -y` (do `.claude/skills/`, który jest w `.gitignore`), nigdy do `.ai/skills/`.
- [`.ai/skills/` zawiera tylko nakładki, nie kopie skilli](lessons/2026-10-25-ai-skills-overlays-only.md): skille instaluj przez `npx skills add` (do `.claude/skills/`, który jest w `.gitignore`), a w `.ai/skills/<nazwa>/SKILL.md` trzymaj tylko różnice: bez frontmattera, z banerem `> **Repo-local override.**` i sekcjami `(add|replace)`.
- [Dokument spoza cyklu SDD nie zmienia architektury sam](lessons/2026-10-25-agents-md-over-foreign-specs.md): przy sprzeczności dokumentu zewnętrznego z AGENTS.md zapytaj człowieka, która strona wygrywa, i przełóż decyzję na datowaną specyfikację aktualizującą AGENTS.md (tak wdrożono `2026-09-01-engineering-standards.md`).
