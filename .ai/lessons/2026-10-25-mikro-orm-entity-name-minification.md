# Encje MikroORM w Next.js: przypnij nazwę klasy

- **Data:** 2026-10-25
- **Źródło:** `.ai/runs/2026-10-25-engineering-standards-implementation.md`
- **Tagi:** mikro-orm, nextjs, turbopack, produkcja

## Kontekst

ORM jest singletonem procesu (`getOrm` w `globalThis`), a `@devmentor/db` to pakiet źródłowy bundlowany przez Next.js.

## Co się stało / objaw

W `next start` rejestracja (`POST /api/auth/register`) zwracała 500 z `MetadataError: Metadata for entity u not found`, ale tylko wtedy, gdy wcześniej odwiedzono stronę `/admin`. Pojedynczy test przechodził, a cały zestaw e2e nie. W `next dev` błąd nie występował.

## Przyczyna

Next.js bundluje `@devmentor/db` osobno dla stron i dla Route Handlerów, więc każda z tych części ma własną kopię klasy `User`. ORM zna tylko kopię z części, która zainicjowała go pierwsza. Dla innej kopii MikroORM szuka metadanych po nazwie klasy, a minifikator produkcyjny zmienia `User` na `u`.

## Rozwiązanie

`pinEntityName(User, "User")` z `packages/db/src/entities/pin-entity-name.ts` ustawia stałą nazwę klasy (`Object.defineProperty(klasa, "name", …)`) przed `setClass`. Wyszukiwanie po nazwie trafia wtedy w metadane niezależnie od kopii modułu.

## Reguła na przyszłość

Każda klasa encji wywołuje `pinEntityName(Klasa, "<name z defineEntity>")` przed `Schema.setClass(Klasa)`. Zmiany w warstwie danych testuj w `next start` (np. `npm run test:e2e` z bazą), odwiedzając najpierw stronę, a potem trasę API, bo `next dev` nie minifikuje i nie pokaże tego błędu.
