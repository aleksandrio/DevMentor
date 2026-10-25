# Nieaktualne typy w `.next/dev/types` psują typecheck i build po przeniesieniu tras

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-2.md`
- **Tagi:** nextjs, typescript, routing

## Kontekst

W fazie 2 migracji `src/app/page.tsx` przeniesiono do grupy tras `src/app/(frontend)/page.tsx`. Wcześniej, w fazie 1, uruchomiono `next dev` w `packages/app`.

## Co się stało / objaw

`npm run typecheck` i `npm run build` padały z błędem w pliku generowanym, a nie w kodzie:

```
.next/dev/types/validator.ts(48,39): error TS2307: Cannot find module '../../../src/app/page.js'
```

## Przyczyna

`next dev` generuje typy tras do `.next/dev/types`, a `tsconfig.json` aplikacji je obejmuje (`.next/dev/types/**/*.ts`). `next typegen` i `next build` odświeżają tylko `.next/types`. Po przeniesieniu lub usunięciu trasy stare typy z ostatniego `next dev` wskazują nieistniejący plik.

## Rozwiązanie

Usunięcie lokalnego cache: `rm -rf packages/app/.next/dev`. Kolejne `next dev` wygeneruje go od nowa. Kod i konfiguracja nie wymagały zmian.

## Reguła na przyszłość

Gdy typecheck lub build zgłasza błąd w `.next/dev/types/...` po zmianie struktury tras, usuń `packages/app/.next/dev` i uruchom sprawdzenie ponownie, zanim zaczniesz szukać błędu w kodzie.
