# AGENTS.md ma pierwszeństwo przed `engineering-standards.md`

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

## Reguła na przyszłość

Przy sprzeczności między AGENTS.md a `.ai/specs/engineering-standards.md` stosuj AGENTS.md: `db → core`, kontener Awilix w `packages/app`. Pliku nie edytuj, nie przenoś i nie commituj bez polecenia człowieka. Jeśli ma nadal obowiązywać jakaś jego część, wymaga ona osobnej specyfikacji, która zmienia AGENTS.md.
