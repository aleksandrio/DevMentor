# Specyfikacja `npm run setup` (issue #6), etap spec

- **Status:** blocked
- **Start / koniec:** 2026-10-25 / 2026-10-25
- **Agent / model:** Claude Code / claude-opus-5-5 (`om-auto-fix-issue 6`, ścieżka feature → `om-auto-write-spec`)
- **Specyfikacja:** .ai/specs/2026-10-25-local-setup-command.md
- **Gałąź / commity:** spec/local-setup-command, PR #7

## Cel

Napisać specyfikację dla #6 i wdrożyć ją ścieżką feature (`om-auto-write-spec` → `om-auto-implement-spec`).

## Przebieg

- Pierwsze uruchomienie zatrzymało się, bo w `.claude/skills/` brakowało `om-auto-write-spec` i `om-auto-implement-spec`. Na polecenie człowieka zainstalowano brakujące skille z `open-mercato/skills` (commit e320bd5) do `.ai/skills/` (53 katalogi, lokalnie wykluczone w `.git/info/exclude`); kontrola pokrycia skilli: `SKILL_COVERAGE_OK`.
- Triage: brak skryptu `setup`, specyfikacji i otwartego PR dla #6. Issue przejęte (assignee, `in-progress`, komentarz 🤖).
- Specyfikacja napisana w trybie autonomicznym (Q1–Q5 rozstrzygnięte domyślnie, Q2 z ⚠). Przegląd w świeżym kontekście znalazł konflikt portu 5432 w worktree (High) i 4 uwagi Medium; wszystkie wprowadzone (sekcja „Decyzje i zmiany” specyfikacji).
- Draft PR #7 (`Refs #6`), etykiety `review`, `documentation`, `skip-qa`, `priority-medium`, `risk-low`, komentarz z założeniami na PR i issue.

## Weryfikacja

Tylko dokument; kodu nie zmieniano, więc lint, testy i build nie były uruchamiane.

## Wynik

Specyfikacja w statusie `draft` czeka na zatwierdzenie. Implementacja nie wystartowała (AGENTS.md: bez zgody człowieka nie implementuje się specyfikacji `draft`).

## Następne kroki / blokery

- Człowiek zatwierdza specyfikację i potwierdza Q2 (kod 1 bez Dockera) albo wskazuje inną odpowiedź.
- Potem: status `approved` w specyfikacji, PR #7 ready, `om-auto-implement-spec .ai/specs/2026-10-25-local-setup-command.md` (osobny PR, `Closes #6`) z nowym logiem przebiegu.

## Wnioski

Bez nowych wpisów. Lekcja `2026-10-25-cezar-provisions-om-skills.md` okazała się nieaktualna w tym przebiegu: brakujących skilli cezar nie dostarczył, a instalację zlecił człowiek. Do decyzji człowieka, czy ją poprawić.
