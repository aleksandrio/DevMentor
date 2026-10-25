# Opis architektury i stosu w AGENTS.md i README.md

- **Status:** done
- **Start / koniec:** 2026-10-25 00:02 / 2026-10-25 00:10
- **Agent / model:** Claude Code / claude-opus-5-5
- **Specyfikacja:** brak (zmiana wyłącznie dokumentacji na polecenie człowieka)
- **Gałąź / commity:** main, bez commita (zmiany zostawione w drzewie roboczym do przeglądu)

## Cel

Zapisać w `AGENTS.md` założenia architektoniczne podane przez człowieka (Next.js, React, TypeScript, PostgreSQL + MikroORM, Awilix, Tailwind dla stron frontendowych, shadcn/ui dla stron backendowych, monorepo z pakietami `app`, `core`, `db`, `ui` w `packages/`) i opisać architekturę w `README.md`.

## Przebieg

- Przeczytano `README.md`, `AGENTS.md`, `.ai/lessons.md` (brak wpisów), `package.json`. Specyfikacji w `.ai/specs/` nie ma.
- `AGENTS.md`: dodano sekcję „Architektura i stos technologiczny” (stos, pakiety i ich granice, kierunek zależności, zasady MikroORM, Awilix, Tailwind/shadcn). Linię o stosie przy „O projekcie” zastąpiono odwołaniem do nowej sekcji.
- `README.md`: rozszerzono „Stos technologiczny”, dodano sekcję „Architektura” (pakiety, zależności, przepływ żądania, baza, interfejs), w „Strukturze projektu” rozdzielono stan obecny od docelowego.
- `CLAUDE.md`: dodano krótki skrót architektury z odwołaniem do `AGENTS.md`.
- Decyzje doprecyzowujące, których człowiek nie podał wprost (do potwierdzenia przy przeglądzie):
  - narzędzie monorepo: npm workspaces (repo używa npm i `package-lock.json`),
  - nazwy pakietów `@devmentor/<nazwa>`,
  - kierunek zależności `app → core/db/ui`, `db → core`, `ui → core`, `core` bez zależności wewnętrznych,
  - komponenty shadcn/ui generowane do `packages/ui`,
  - Awilix: composition root w `packages/app`, `InjectionMode.PROXY`, `scoped` dla wszystkiego, co zależy od `EntityManager`,
  - „strony backendowe” zinterpretowano jako panel administracyjny i zaplecze, rozdzielone grupami tras `(frontend)` / `(backend)`.
- Zaznaczono w obu plikach, że struktura monorepo jest docelowa, a repo to wciąż pojedyncza aplikacja Next.js.

## Weryfikacja

- Zmiana dotyczy tylko plików Markdown, więc lint i build nie mają na nią wpływu i nie były uruchamiane.
- Renderowania Markdownu (tabel, diagramów ASCII) nie sprawdzano w przeglądarce.

## Wynik

Założenia architektoniczne są zapisane w `AGENTS.md` (wiążąco dla agentów), skrót w `CLAUDE.md`, opis dla ludzi w `README.md`.

## Następne kroki / blokery

- Napisać specyfikację migracji repozytorium do monorepo (`packages/app|core|db|ui`, npm workspaces) i dostać jej zatwierdzenie.
- Osobne specyfikacje dla integracji MikroORM z Next.js (konfiguracja, migracje, `serverExternalPackages`) i kontenera Awilix.

## Wnioski

Brak nowych wniosków.
