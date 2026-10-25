# Migracja do monorepo — faza 1 (workspace i szkielet pakietów)

- **Status:** done
- **Start / koniec:** 2026-10-25 00:05 / 2026-10-25 00:15
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration (commit fazy 1 — hash w historii gałęzi)

## Cel

Wykonać fazę 1 specyfikacji: npm workspaces, aplikacja w `packages/app`, szkielety `core`, `db`, `ui`, wspólna konfiguracja TS/ESLint, skrypty, granice pakietów; zachować działanie aplikacji.

## Przebieg

- Brak wcześniejszej specyfikacji migracji; napisano `.ai/specs/2026-10-25-monorepo-migration.md` z fazami 1–5 i kryteriami ukończenia.
- Przeczytano dokumentację Next.js w `node_modules/next/dist/docs/`: `transpilePackages` (pakiety workspace transpilowane automatycznie), `turbopack` (`root` wykrywany po `package-lock.json`), `agentRules`.
- Utworzono gałąź `feat/monorepo-migration`. Wcześniejsze niezacommitowane zmiany dokumentacji (AGENTS.md, README.md, CLAUDE.md, `.ai/`, `.gitignore`) idą w tym samym commicie.
- `git mv`: `app/` → `packages/app/src/app/`, `public/` → `packages/app/public/`, `next.config.ts` i `tsconfig.json` → `packages/app/`, `app/globals.css` → `packages/ui/src/styles/globals.css`.
- Główny `package.json` (`devmentor`, workspaces `packages/*`, skrypty `dev`/`build`/`start` delegujące do `@devmentor/app`, `lint`, `typecheck` po wszystkich pakietach). W katalogu głównym tylko `eslint`, `eslint-config-next`, `typescript`.
- `tsconfig.base.json` + `tsconfig.json` w każdym pakiecie; alias `@/*` → `packages/app/src/*`.
- Pakiety: `core` (`DomainError`), `db` (`server-only`, zależność od `core`, bez MikroORM), `ui` (globalny arkusz Tailwinda eksportowany jako `@devmentor/ui/globals.css`, `@source "../"`). Aplikacja zależy od `core`, `db`, `ui`.
- `eslint.config.mjs`: `rootDir` dla `eslint-config-next`, granice pakietów przez `no-restricted-imports`. Pierwsza wersja zakazu importów „w głąb” (wzorzec gitignore) nie łapała `../../../core/src/errors`; zastąpiona `regex`.
- `next.config.ts`: `agentRules: false` (żeby `next dev` nie tworzył `packages/app/AGENTS.md`), jawny `turbopack.root` (usuwa ostrzeżenie o `package.json` w `/home/cezar/cezar` poza repo).
- `.gitignore`: wzorce bez wiodącego `/`, żeby obejmowały `packages/*/.next` itd.
- Dokumentacja: notka o stanie migracji w AGENTS.md i README.md, `npm run typecheck` w weryfikacji, nowa „Struktura projektu” i opis skryptów w README.
- Potknięcie: `pkill -f "next start -p 312"` zabił własną powłokę narzędzia (wzorzec pasował do jej linii poleceń); procesy ubite potem po PID.

## Weryfikacja

- `npm install` — OK, symlinki `node_modules/@devmentor/{app,core,db,ui}`. Ostrzeżenie npm: postinstall `unrs-resolver` nieuruchomiony (polityka allowScripts); lint działa mimo to.
- `npm run lint` — exit 0. Test granic plikami tymczasowymi: zgłoszone `next/link` i `@devmentor/ui` w `core`, `@devmentor/db` w `ui`, `@devmentor/core/src/errors` i `../../../core/src/errors` w `app`; `server-only` + `@devmentor/core` w `db` przechodzą.
- `npm run typecheck` — exit 0 dla app, core, db, ui.
- `npm run build` — exit 0, bez ostrzeżeń, trasy `/` i `/_not-found` statyczne.
- Porównanie z buildem oryginalnego commitu `b387899` (worktree w `/tmp`): HTML strony `/` ma identyczny rozmiar (11884 B) i identyczne klasy oraz treść; CSS różni się tylko brakiem `.block` i `.visible` (nieużywane, wyjaśnione w lekcji). `/next.svg` i `/favicon.ico` → 200.
- `next dev` w `packages/app` — `/` → 200, CSS zawiera klasy strony (`.bg-zinc-50`, `.max-w-3xl`); nie powstał `packages/app/AGENTS.md`.
- Sonda `@source`: klasa `bg-fuchsia-950` w pliku w `packages/ui/src` trafia do wynikowego CSS, po usunięciu pliku znika.
- Niesprawdzone: wygląd w przeglądarce (porównanie oparte na HTML i CSS, nie na zrzucie ekranu).

## Wynik

Faza 1 ukończona: monorepo na npm workspaces z pakietami `@devmentor/app|core|db|ui`, aplikacja działa jak wcześniej, lint/typecheck/build zielone.

## Następne kroki / blokery

- Faza 2 specyfikacji: shadcn/ui w `packages/ui`, grupy tras `(frontend)` i `(backend)/admin`.
- Potem faza 3 (MikroORM + PostgreSQL), 4 (Awilix), 5 (domknięcie dokumentacji, przeniesienie specyfikacji do `implemented/`).
- Gałąź nie jest scalona do `main` ani wypchnięta.

## Wnioski

- [Tailwind w monorepo skanuje klasy tylko od katalogu roboczego aplikacji](../lessons/2026-10-25-tailwind-source-scan-monorepo.md)
