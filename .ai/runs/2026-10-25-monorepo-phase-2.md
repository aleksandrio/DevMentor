# Migracja do monorepo — faza 2 (shadcn/ui i podział frontend/backend)

- **Status:** done
- **Start / koniec:** 2026-10-25 00:29 / 2026-10-25 00:41
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/2026-10-25-monorepo-migration.md
- **Gałąź / commity:** feat/monorepo-migration (commit fazy 2 po 3bf6a26)
- **Poprzedni przebieg:** .ai/runs/2026-10-25-monorepo-phase-1.md

## Cel

Faza 2 specyfikacji: shadcn/ui w `packages/ui` (components.json, `cn`, tokeny, `Button`), grupy tras `(frontend)` i `(backend)/admin`, strona `/admin` z komponentów shadcn/ui; strona główna bez zmian.

## Przebieg

- Przeczytano `.ai/lessons.md` i specyfikację (faza 2 = pierwsza nieukończona).
- Wygenerowano wzorcowy projekt `npx shadcn@latest init --monorepo -t next -d` w `/tmp/shad/ref` (shadcn 4.22.1), żeby poznać aktualną konfigurację pakietu `ui` (styl `base-nova`, Base UI, pakiet `cn`, `tw-animate-css`, `shadcn/tailwind.css`, eksporty ścieżkowe).
- Napisano `packages/ui/components.json` z aliasami `@devmentor/ui/...`, `paths` w `tsconfig.json`, eksporty `components/*`, `lib/*`, `hooks/*`, `globals.css`; usunięto pusty `src/index.ts`.
- `npx shadcn@latest add button card badge -c packages/ui` — pliki powstały, ale CLI doinstalowało tylko `cn`.
- Próby `shadcn init -c packages/ui`: `-p base-nova` → „Invalid preset”; `-p nova` bez `--force` → pytanie interaktywne o nadpisanie `components.json`; z `--force` → „We could not detect a supported framework”. Nic nie zostało nadpisane. Porzucono `init` na rzecz ręcznej bazy według szablonu.
- `npm install -w @devmentor/ui @base-ui/react class-variance-authority tw-animate-css shadcn`, `src/lib/utils.ts`.
- `globals.css`: tokeny shadcn (neutral) połączone z dotychczasowymi; ciemny motyw w `@media (prefers-color-scheme: dark)` zamiast `.dark`, `--background`/`--foreground` bez zmian.
- Trasy: `page.tsx` → `(frontend)/page.tsx` (`git mv`) z przezroczystym `(frontend)/layout.tsx`; `(backend)/admin/layout.tsx` (nagłówek, tytuł strony) i `(backend)/admin/page.tsx` (`Card`, `Badge`, `Button` jako link do `/` przez `render={<Link />}`).
- Pierwsze `typecheck` i `build` padły na `.next/dev/types/validator.ts` (nieaktualne typy po `next dev` z fazy 1 wskazujące `src/app/page.js`). Rozwiązanie: `rm -rf packages/app/.next/dev`. Zapisano jako lekcję.
- Pierwsza wersja skryptu porównującego reguły CSS w bashu była błędna (sed nie przetwarzał escapowania, wynik „0 różnic” był bezwartościowy); zastąpiona skryptem w Pythonie.
- Zaktualizowano AGENTS.md (stan migracji, zasady shadcn: `add -c packages/ui`, brak `init`, importy po ścieżce, tryb ciemny przez media query) i README.md (interfejs, struktura).

## Weryfikacja

- `npm run lint` — exit 0.
- `npm run typecheck` — exit 0 (app, core, db, ui) po usunięciu nieaktualnego `.next/dev`.
- `npm run build` — exit 0, bez ostrzeżeń; trasy `/`, `/_not-found`, `/admin` statyczne.
- Porównanie z buildem fazy 1 (commit `3bf6a26`, worktree w `/tmp/dm-p1`), oba przez `next start`:
  - `/`: identyczne klasy, treść, `<html>`/`<body>` i tytuł. HTML większy (11884 → 13710 B) wyłącznie przez dodatkowy segment `(frontend)` w payloadzie RSC i jeden chunk JS.
  - CSS: wszystkie 69 klas strony głównej mają identyczne reguły w identycznym kontekście `@layer`/`@media`/`@supports`. Nowa jest reguła bazowa `*` (kolor obramowania i obrysu fokusu) i tokeny shadcn.
  - `/admin`: 200 w fazie 2, 404 w fazie 1; tytuł „Panel administracyjny · DevMentor”; renderują się sloty `card`, `card-header`, `card-title`, `card-description`, `card-content`, `card-footer`, `badge`, `button`. Wszystkie 107 klas z markupu mają reguły w CSS poza znacznikami `group/*` (z założenia bez reguł).
- `next dev`: `/` i `/admin` → 200, bez błędów i ostrzeżeń w logu.
- `npx shadcn@latest add separator -c packages/ui --dry-run` — CLI rozwiązuje konfigurację i planuje `src/components/separator.tsx`.
- Niesprawdzone: wygląd w przeglądarce (brak Chromium w środowisku) i hydratacja przycisku po stronie klienta; ocena oparta na HTML i CSS.

## Wynik

Faza 2 ukończona: shadcn/ui (Base UI, `base-nova`) w `packages/ui`, komponenty `Button`, `Card`, `Badge`, grupy tras `(frontend)` i `(backend)/admin`, strona `/admin`; strona główna renderuje się tak jak wcześniej.

## Następne kroki / blokery

- Faza 3: MikroORM + PostgreSQL w `packages/db` (konfiguracja z `DATABASE_URL`, migrator, `docker-compose.yml`, `.env.example`, `serverExternalPackages`). Wymaga lokalnego PostgreSQL (Docker) do kryterium `db:migrate`.
- Gałąź `feat/monorepo-migration` nie jest scalona ani wypchnięta.

## Wnioski

- [shadcn CLI w pakiecie `ui`: `init` nie działa, `add` działa](../lessons/2026-10-25-shadcn-cli-in-ui-package.md)
- [Nieaktualne typy w `.next/dev/types` psują typecheck i build po przeniesieniu tras](../lessons/2026-10-25-stale-next-dev-types.md)
