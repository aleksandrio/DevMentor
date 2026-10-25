# Uruchamianie modułów serwerowych (`server-only`) poza Next.js w skryptach weryfikacyjnych

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-4.md`
- **Tagi:** nextjs, testy, typescript, awilix

## Kontekst

W fazie 4 trzeba było sprawdzić czasy życia rejestracji Awilix na prawdziwym kontenerze z `packages/app/src/server/container.ts`, bez uruchamiania Next.js.

## Co się stało / objaw

- Zwykły `node` przerywa import modułu, który importuje `server-only`, bo ten pakiet celowo rzuca błąd poza warunkiem eksportu `react-server`.
- Skrypt `.ts` uruchomiony przez `tsx` w `packages/app` padł z `TransformError` na `await` najwyższego poziomu: pakiet `@devmentor/app` nie ma `"type": "module"`, więc plik `.ts` jest traktowany jak CommonJS.

## Przyczyna

`server-only` rozpoznaje środowisko serwerowe po warunku `react-server`, który Next.js ustawia w bundlu serwerowym. Typ modułu dla `.ts` wynika z najbliższego `package.json`.

## Rozwiązanie

Skrypt tymczasowy z rozszerzeniem `.mts` w `packages/app`, uruchomiony poleceniem `node --conditions=react-server --import tsx ./plik.mts` z `DATABASE_URL` w środowisku. Po weryfikacji skrypt usunięto.

## Reguła na przyszłość

Aby wykonać kod z `packages/app/src/server` albo `@devmentor/db` poza Next.js, użyj `node --conditions=react-server --import tsx` i pliku `.mts`. Nie usuwaj `import "server-only"`, żeby skrypt zadziałał. Kodu, który woła `connection()` z `next/server` (np. `withRequestScope`), w ten sposób nie uruchomisz; testuj go przez `next start` albo `next dev`.
