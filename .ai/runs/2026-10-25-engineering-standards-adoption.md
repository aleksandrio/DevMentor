# Wdrożenie `engineering-standards.md`

- **Status:** blocked
- **Start / koniec:** 2026-10-25 / 2026-10-25
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** .ai/specs/engineering-standards.md (nieśledzona, spoza cyklu SDD)
- **Gałąź / commity:** cez/fc48a4c4, brak commitów

## Cel

Wdrożyć `.ai/specs/engineering-standards.md` na polecenie człowieka.

## Przebieg

- Przeczytano specyfikację, `.ai/lessons.md` i wniosek `2026-10-25-agents-md-over-foreign-specs.md`. Wniosek mówi, że przy sprzeczności obowiązuje AGENTS.md, a każda część tego pliku, która ma obowiązywać, wymaga osobnej specyfikacji zmieniającej AGENTS.md.
- Porównano specyfikację z kodem. Znalezione sprzeczności i braki:
  1. Kierunek zależności `app → core → db` i kontener w `core/src/container/`. AGENTS.md i ESLint wymagają `db → core` i kontenera w `packages/app/src/server/container.ts`.
  2. `core/src/http/` (`apiHandler`, `makeCrudRoute`) produkuje handlery Next.js, a `core` nie może importować `next` (reguła ESLint).
  3. „`ui` nie importuje `core`”. AGENTS.md pozwala `ui → core` (typy, czyste funkcje).
  4. Układ `ui/src/components/ui/` i `ui/src/backend/` nie zgadza się z `exports` pakietu `ui` (`components/*`, `lib/*`, `hooks/*`).
  5. `export const dynamic = "force-dynamic"` nie pasuje do `cacheComponents` + `connection()` (`withRequestScope`).
  6. Nowe biblioteki: zod, pino, bcrypt, JWT. Nie ma ich w tabeli stosu, więc wymagają specyfikacji i zgody.
  7. Sekcja 5 (migracja) przenosi kod, którego tu nie ma: `user.entity.ts`, `user.service.ts`, `cradle.ts`, `/admin/users`, `/api/health`, `withScope`, `docs/product-scope.md`.
  8. `AppError` dubluje istniejący `DomainError` z `core/src/errors.ts`.
- Nic nie zaimplementowano. Wdrożenie wymaga decyzji architektonicznych człowieka (AGENTS.md: odejście od architektury wymaga specyfikacji i zgody).

## Weryfikacja

Brak zmian w kodzie, więc niczego nie uruchamiano.

## Wynik

Zablokowane. Czeka na decyzję człowieka, które części wdrożyć i w jakim kształcie.

## Następne kroki / blokery

Po decyzji: napisać `.ai/specs/2026-10-25-engineering-standards-adoption.md` dopasowaną do AGENTS.md, uzyskać zatwierdzenie i dopiero wtedy wdrażać (nowy przebieg z odnośnikiem do tego logu).

## Wnioski

Brak nowych. Potwierdzono istniejący wniosek `2026-10-25-agents-md-over-foreign-specs.md`.
