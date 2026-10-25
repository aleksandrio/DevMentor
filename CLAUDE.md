# CLAUDE.md

@AGENTS.md

Pełne zasady są w zaimportowanym wyżej `AGENTS.md`, który ma pierwszeństwo przy rozbieżnościach. Poniżej skrót tego, co obowiązuje w każdej sesji.

## Struktura `.ai/`

| Ścieżka | Zawartość |
| --- | --- |
| `.ai/specs/YYYY-MM-DD-slug.md` | aktywne specyfikacje SDD (`draft`, `approved`, `in-progress`) |
| `.ai/specs/implemented/` | specyfikacje wdrożone |
| `.ai/specs/archive/` | specyfikacje porzucone albo zastąpione |
| `.ai/runs/YYYY-MM-DD-slug.md` | log każdego autonomicznego przebiegu AI |
| `.ai/lessons.md` | indeks wniosków, jedna linia na wniosek |
| `.ai/lessons/YYYY-MM-DD-slug.md` | pełny opis jednego wniosku |
| `.ai/agentic.config.json`, `.ai/trackers/`, `.ai/browsers/` | konfiguracja potoku skilli `om-*` (proces: `SDLC.md`, przegląd: `CODE_REVIEW.md`, kontrakty: `BACKWARD_COMPATIBILITY.md`) |
| `.ai/cezar/` | lokalny stan narzędzia cezar (w .gitignore, nie edytuj) |

Nazwy plików: `YYYY-MM-DD-slug.md`, gdzie data to dzień utworzenia, a slug jest po angielsku, w kebab-case.

## Obowiązkowo

1. Na starcie sesji przeczytaj `.ai/lessons.md` oraz specyfikacje dotyczące obszaru, który zmieniasz.
2. Nietrywialna zmiana wymaga specyfikacji w `.ai/specs/`. Nie implementuj specyfikacji w statusie `draft` bez zgody człowieka. Odstępstwo od specyfikacji wymaga jej wcześniejszej aktualizacji.
3. Każdy autonomiczny przebieg prowadzi log w `.ai/runs/`: zakładasz go na starcie, domykasz na końcu i zapisujesz w nim także porażki.
4. Po nieoczywistym bugfixie, odkrytej pułapce albo korekcie od człowieka zapisz wniosek w `.ai/lessons/` i dopisz linię do `.ai/lessons.md`.
5. Po wdrożeniu przenieś specyfikację przez `git mv` do `implemented/` i ustaw jej status. Pliki `.ai/` commituj razem z kodem.
6. Każda nowa funkcja ma 100% pokrycia testami jednostkowymi (linie, gałęzie, funkcje, instrukcje). Próg egzekwują `npm run test` i CI. Bez komentarzy `v8 ignore` i nowych wyłączeń z pomiaru. Szczegóły są w sekcji „Jakość kodu i przegląd” i „Testy” w `AGENTS.md`.
7. Złożone zadania zaczynaj od planu, a przed ogłoszeniem końca sam sprawdź, że zmiana działa. Szczegóły są w sekcji „Sposób pracy” w `AGENTS.md`.

## Architektura

Monorepo (npm workspaces) z pakietami `packages/app`, `core`, `db` i `ui`. Kierunek zależności: `app → core → db`, `app → ui`. Stos: Next.js, React, TypeScript, PostgreSQL z MikroORM, Awilix (DI, kontener w `core`), zod, pino, Tailwind CSS dla stron frontendowych i shadcn/ui dla stron backendowych. Granice pakietów, kierunek zależności i zasady dla każdej biblioteki opisuje sekcja „Architektura i stos technologiczny” w `AGENTS.md`. Odejście od tych założeń wymaga specyfikacji i zgody człowieka.

Wnioski projektu zapisuj w `.ai/lessons/`, a nie w prywatnej pamięci Claude Code. Dzięki temu korzystają z nich wszyscy agenci.
