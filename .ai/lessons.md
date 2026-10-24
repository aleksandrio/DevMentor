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
