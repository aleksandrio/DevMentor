# MikroORM 7: brak encji blokuje start, CLI nie czyta `.env` i potrzebuje loadera TS

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-3.md`
- **Tagi:** mikro-orm, postgresql, cli, typescript

## Kontekst

Konfiguracja MikroORM 7.2 (ESM-only, wymaga Node ≥ 22.17) w `packages/db`, zanim powstała pierwsza encja domenowa.

## Co się stało / objaw

- `MikroORM.init` z pustą listą `entities` rzuca `MetadataError` („No entities were discovered”). Ta sama walidacja działa w CLI.
- CLI v7 nie wczytuje pliku `.env` (nie ma już w nim dotenv) i bez loadera TypeScriptu nie załaduje `mikro-orm.config.ts`.

## Przyczyna

- `MetadataValidator.validateDiscovered` rzuca błąd, gdy nic nie odkryto, chyba że ustawiono `discovery.warnWhenNoEntities: false`.
- CLI szuka konfiguracji w `configPaths` z sekcji `"mikro-orm"` w `package.json` i ładuje pliki `.ts` przez pierwszy dostępny loader (oxc, swc, tsx, jiti…). Zmienne środowiskowe czyta tylko z `process.env` (`MIKRO_ORM_*`).

## Rozwiązanie

- `discovery: { warnWhenNoEntities: false }` w `packages/db/src/config.ts` do czasu pierwszej encji.
- `packages/db/package.json`: `"mikro-orm": { "configPaths": ["./src/mikro-orm.config.ts"], "tsLoader": "tsx" }` i `tsx` w devDependencies.
- `mikro-orm.config.ts` sam wczytuje główny `.env` przez `process.loadEnvFile()` (wbudowane w Node; nie nadpisuje zmiennych już ustawionych w powłoce).
- Konfiguracja dla CLI importuje Migrator, a konfiguracja runtime (`getOrm`) nie, więc pakiet migracji nie trafia do bundla aplikacji.

## Uzupełnienie (faza 4, 2026-10-25)

`MikroORM.init` w v7 nie otwiera połączenia: łączy się dopiero przy pierwszym zapytaniu (`MikroORM.js`: `init` robi tylko odkrywanie metadanych i tworzy `EntityManager`). Niedostępna baza nie przerywa więc budowania kontenera. Błąd pojawia się w zapytaniu, gdzie serwis może go obsłużyć (np. status `down`).

## Reguła na przyszłość

Przy pracy z MikroORM 7 nie zakładaj zachowań z v5/v6: encje rejestruj jawnie w `entities/index.ts`, `.env` ładuj sam w konfiguracji CLI, a zmiany konfiguracji CLI sprawdzaj komendą `npm run db:migration:pending` na prawdziwej bazie. Błędy połączenia obsługuj przy zapytaniu, nie przy `getOrm()`, bo `init` nie łączy się z bazą.
