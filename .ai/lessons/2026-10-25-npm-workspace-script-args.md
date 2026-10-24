# Skrypt delegujący do workspace musi kończyć się `--`, żeby przekazać argumenty

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-5.md`
- **Tagi:** npm, monorepo, skrypty

## Kontekst

Główny `package.json` miał `"start": "npm run start -w @devmentor/app"` (tak samo `dev` i `build`).

## Co się stało / objaw

`npm run start -- -p 3161` kończyło się błędem „Invalid project directory provided, no such directory: …/packages/app/3161”.

## Przyczyna

npm dokleja argumenty po `--` na koniec polecenia skryptu. Wychodziło `npm run start -w @devmentor/app -p 3161`, więc `-p` przejmował wewnętrzny `npm`, a do `next start` trafiało samo `3161`, które Next.js odczytał jako katalog projektu.

## Rozwiązanie

`"start": "npm run start -w @devmentor/app --"` (tak samo `dev` i `build`; skrypty `db:*` miały to od początku). Bez dodatkowych argumentów działa jak wcześniej.

## Reguła na przyszłość

Każdy skrypt w głównym `package.json`, który woła `npm run <x> -w <pakiet>`, kończ `--`. Sprawdzaj go wywołaniem z argumentem, np. `npm run dev -- -p 3001`.
