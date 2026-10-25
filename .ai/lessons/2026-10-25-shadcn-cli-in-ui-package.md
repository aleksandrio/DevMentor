# shadcn CLI w pakiecie `ui`: `init` nie działa, `add` działa

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-2.md`, spec `.ai/specs/implemented/2026-10-25-monorepo-migration.md`
- **Tagi:** shadcn, monorepo, tailwind

## Kontekst

Komponenty shadcn/ui mają żyć w `packages/ui` (AGENTS.md), który jest biblioteką bez Next.js.

## Co się stało / objaw

- `npx shadcn@latest add button -c packages/ui` z ręcznie przygotowanym `components.json` wygenerował komponenty, ale doinstalował tylko pakiet `cn`. Nie dodał `@base-ui/react`, `class-variance-authority`, `tw-animate-css` ani tokenów w CSS.
- `npx shadcn@latest init -c packages/ui` kończy się błędem „We could not detect a supported framework”. Preset `base-nova` z `components.json` nie jest też poprawną wartością `-p` (presety to `nova`, `vega` itd.).

## Przyczyna

`add` zakłada, że `init` już przygotował zależności bazowe i CSS. `init` wymaga frameworka w katalogu docelowym. W oficjalnym szablonie monorepo (`shadcn init --monorepo`) bazę pakietu `ui` tworzy szablon, a nie `init` uruchomiony na pakiecie.

## Rozwiązanie

Wygenerowano wzorcowy projekt `npx shadcn@latest init --monorepo -t next -d` w katalogu tymczasowym i odtworzono z niego konfigurację `packages/ui`: `components.json`, zależności, `src/lib/utils.ts`, `exports` (`components/*`, `lib/*`, `hooks/*`, `globals.css`), `paths` w `tsconfig.json` oraz tokeny i importy (`tw-animate-css`, `shadcn/tailwind.css`) w `globals.css`. Komponenty pochodzą z CLI (`add`), a `add --dry-run` potwierdza, że konfiguracja działa.

## Reguła na przyszłość

Komponenty dodawaj przez `npx shadcn@latest add <komponent> -c packages/ui`. Nie uruchamiaj `init` na `packages/ui`. Przy aktualizacji bazy shadcn porównaj konfigurację z szablonem `init --monorepo` wygenerowanym poza repozytorium.
