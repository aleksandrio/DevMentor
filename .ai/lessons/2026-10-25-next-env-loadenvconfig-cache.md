# `loadEnvConfig` z `@next/env` w `next.config.ts` nie wczytuje drugiego katalogu

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-5.md` (błąd wprowadzony w fazie 3)
- **Tagi:** nextjs, env, monorepo

## Kontekst

Jeden `.env` w katalogu głównym repozytorium ma czytać zarówno Next.js (projekt w `packages/app`), jak i CLI MikroORM. W fazie 3 w `next.config.ts` dodano `loadEnvConfig(repoRoot)`.

## Co się stało / objaw

Przy końcowej weryfikacji z czystego klona `/admin` pokazywało „nieskonfigurowana (brak DATABASE_URL)”, mimo poprawnego `.env` w katalogu głównym. Wcześniejsze testy tego nie wykryły. W fazie 3 `loadEnvConfig` sprawdzono osobnym skryptem `node -e` w świeżym procesie, a w fazie 4 `DATABASE_URL` podawano w powłoce.

## Przyczyna

`loadEnvConfig(dir, dev, log, forceReload)` ładuje zmienne raz na proces i potem zwraca wynik z pamięci (`if (combinedEnv && !forceReload) return cached`). Next.js wywołuje go dla `packages/app` przed odczytem `next.config.ts`, więc wywołanie z katalogiem głównym niczego nie wczytywało. `forceReload: true` przywraca `process.env` do początkowego stanu, a to zbyt inwazyjne.

## Rozwiązanie

W `next.config.ts`: `if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile)`, ten sam mechanizm co w konfiguracji CLI MikroORM. Zmienne z powłoki mają pierwszeństwo. Usunięto zależność `@next/env` z `@devmentor/app`.

## Reguła na przyszłość

Nie używaj `loadEnvConfig` do dodatkowych katalogów w kodzie, który wykonuje się w procesie Next.js. Działanie zmiennych środowiskowych sprawdzaj przez prawdziwe `next start`/`next dev` z plikiem `.env` i bez zmiennej w powłoce, a nie osobnym skryptem `node`.
