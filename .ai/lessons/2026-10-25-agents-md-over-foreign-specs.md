# Standardy inżynieryjne: decyzja człowieka rozstrzyga sprzeczność z AGENTS.md

- **Data:** 2026-10-25
- **Źródło:** rozmowa z człowiekiem po fazie 3 (`.ai/runs/2026-10-25-monorepo-phase-3.md`)
- **Tagi:** architektura, specyfikacje, proces

## Kontekst

W trakcie fazy 3 migracji w `.ai/specs/` pojawił się nieśledzony plik `engineering-standards.md`, którego nie utworzył agent. Ma status „active”, ale jego nazwa nie pasuje do konwencji `YYYY-MM-DD-slug`.

## Co się stało / objaw

Plik jest sprzeczny z AGENTS.md: podaje kierunek zależności `app → core → db` i umieszcza kontener Awilix w `core` (`core/src/container/`). Opisuje też kod, którego w repozytorium nie ma (`entities/user.entity.ts`, `/admin/users`, `/api/health`).

## Przyczyna

Dokument pochodzi spoza bieżącego stanu repozytorium. Nie przeszedł przez cykl specyfikacji opisany w AGENTS.md.

## Rozwiązanie

Człowiek zdecydował: obowiązuje AGENTS.md. Pliku nie zmieniano, nie przenoszono i nie commitowano.

## Aktualizacja 2026-10-25

Człowiek zmienił decyzję: standardy wdrożono w całości, a przy sprzeczności wygrywają one. AGENTS.md został do nich dostosowany (`app → core → db`, kontener w `core`, `ui` samodzielny, `cacheComponents` wyłączone na rzecz `force-dynamic`). Plik źródłowy ma teraz nazwę `.ai/specs/2026-09-01-engineering-standards.md`, a jego przełożenie na repozytorium opisuje `.ai/specs/2026-10-25-engineering-standards-adoption.md`. Poprzednia reguła („stosuj AGENTS.md”) jest nieaktualna.

## Reguła na przyszłość

AGENTS.md opisuje obowiązującą architekturę i ma pierwszeństwo. Dokument zewnętrzny albo spoza cyklu SDD (bez daty w nazwie, ze statusem spoza szablonu) nie zmienia architektury sam z siebie. Gdy jest sprzeczny z AGENTS.md, zatrzymaj się i zapytaj człowieka, która strona wygrywa, a decyzję przełóż na datowaną specyfikację, która aktualizuje AGENTS.md.
