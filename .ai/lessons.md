# Wnioski (lessons learned)

Indeks pamięci długoterminowej projektu. Każdy agent czyta ten plik na starcie sesji.

Jedna linia na wniosek, pogrupowane tematycznie:
`- [Tytuł](lessons/YYYY-MM-DD-slug.md): reguła w jednym zdaniu`

Zasady prowadzenia indeksu opisuje `AGENTS.md`, sekcja „`.ai/lessons.md` i `.ai/lessons/`”.

## Tailwind

- [Tailwind w monorepo skanuje klasy tylko od katalogu roboczego aplikacji](lessons/2026-10-25-tailwind-source-scan-monorepo.md): każdy pakiet z klasami Tailwinda (np. `packages/ui`) musi być objęty dyrektywą `@source` w arkuszu importowanym przez aplikację, bo `@tailwindcss/turbopack` skanuje tylko od `process.cwd()` (`packages/app`).
