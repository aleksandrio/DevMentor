# Tailwind w monorepo skanuje klasy tylko od katalogu roboczego aplikacji

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-1.md`, spec `.ai/specs/2026-10-25-monorepo-migration.md`
- **Tagi:** tailwind, turbopack, monorepo, nextjs

## Kontekst

Globalny arkusz Tailwinda przeniesiono do `packages/ui/src/styles/globals.css`, a aplikacja (`packages/app`) importuje go jako `@devmentor/ui/globals.css`. CSS przetwarza loader `@tailwindcss/turbopack` skonfigurowany w `packages/app/next.config.ts`.

## Co się stało / objaw

Nic się jeszcze nie zepsuło, ale bez dodatkowej konfiguracji klasy użyte tylko w komponentach `packages/ui` nie trafiłyby do wynikowego CSS. Objaw byłby cichy: komponent renderuje się bez stylów, a build przechodzi.

## Przyczyna

Loader `@tailwindcss/turbopack` ustawia bazę automatycznego wykrywania źródeł na `process.cwd()` (w `dist/index.mjs`: `base ?? process.cwd()`). `npm run dev|build -w @devmentor/app` uruchamia Next.js w `packages/app`, więc skanowany jest tylko ten pakiet. Dla porównania przed migracją bazą był katalog główny repo, więc do CSS trafiały też klasy znalezione w README/AGENTS (`.block`, `.visible`).

## Rozwiązanie

`packages/ui/src/styles/globals.css` deklaruje `@source "../";`, czyli cały `packages/ui/src` (ścieżka `@source` jest względna do pliku CSS).

## Reguła na przyszłość

Każdy pakiet workspace z komponentami używającymi klas Tailwinda musi być objęty dyrektywą `@source` w arkuszu importowanym przez aplikację. Sam `cwd` aplikacji obejmuje tylko `packages/app`.
