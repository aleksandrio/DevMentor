# PR z konfiguracją potoku agentów

- **Status:** in-progress
- **Start / koniec:** 2026-10-25 11:40 / —
- **Agent / model:** Claude Code / claude-opus-5-5 (cezar, skill `om-auto-create-pr`)
- **Specyfikacja:** brak (konfiguracja narzędzi i dokumentów procesu, bez zmian w kodzie aplikacji)
- **Gałąź / commity:** feat/agent-pipeline-config-pr

## Cel

Wysłać do `main` w jednym PR konfigurację potoku skilli `om-*` przygotowaną w przebiegu `.ai/runs/2026-10-25-agent-pipeline-setup.md` (commity `6ccd9e0` i `18f1440` z gałęzi `cez/0aea9054`).

## Zakres

- `.ai/agentic.config.json`, `.ai/trackers/github.md`, `.ai/browsers/agent-browser.md`
- `SDLC.md`, `CODE_REVIEW.md`, `BACKWARD_COMPATIBILITY.md`
- `.gitignore` (stany QA) oraz katalogi `.ai/analysis`, `.ai/scripts`, `.ai/qa`
- log przebiegu konfiguracji i wniosek `.ai/lessons/2026-10-25-cezar-provisions-om-skills.md`

**Poza zakresem:** zmiany w kodzie aplikacji, w `AGENTS.md` i `CLAUDE.md` oraz w etykietach na GitHubie (już utworzone podczas konfiguracji).

## Plan wdrożenia

Faza 1 przenosi gotowe commity przez `cherry-pick`, bez przepisywania treści. Faza 2 to bramka dla zmiany tylko w dokumentach i konfiguracji: `npm run lint`, `npm run typecheck`, poprawność JSON konfiguracji oraz ponowne przeczytanie diffu. Testy, build i testy integracyjne nie dotyczą tej zmiany, bo nie zmienia ona kodu.

## Ryzyka

- `CODE_REVIEW.md` i `BACKWARD_COMPATIBILITY.md` wpływają na przyszłe przeglądy automatyczne. Błędna reguła w tych plikach dałaby fałszywe blokery, więc treść wymaga przeczytania przez człowieka.
- Bramka walidacji w konfiguracji obejmuje `test:integration` i `test:e2e`, które wymagają Dockera. Dzięki temu bramka jest pełna, ale lokalnie wolniejsza.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Konfiguracja potoku

- [x] 1.1 Konfiguracja, deskryptory i dokumenty procesu — 0b324d9
- [x] 1.2 Wniosek o skillach dostarczanych przez cezar — 7ced77b

### Phase 2: Weryfikacja

- [ ] 2.1 Bramka dla zmiany tylko w dokumentach i konfiguracji

## Weryfikacja

## Wynik

## Następne kroki / blokery

## Wnioski
