# Konfiguracja potoku agentów (om-setup-agent-pipeline)

- **Status:** done
- **Start / koniec:** 2026-10-25 11:03 / 2026-10-25 11:12
- **Agent / model:** Claude Code / claude-opus-5-5 (cezar, skill `om-setup-agent-pipeline`)
- **Specyfikacja:** brak (konfiguracja narzędzi i dokumentów procesu, bez zmian w kodzie aplikacji)
- **Gałąź / commity:** cez/0aea9054

## Cel

Skonfigurować potok skilli `om-*`: `.ai/agentic.config.json`, deskryptory trackera i przeglądarki, etykiety na GitHubie oraz brakujące dokumenty procesu.

## Przebieg

- Wykrycie: gałąź domyślna `main` (`origin/HEAD` nie jest ustawione, rozstrzygnięte przez `gh repo view`), tracker GitHub, `agent-browser` 0.39.2, skrypty npm zgodne z jobami CI. Na GitHubie było tylko 11 domyślnych etykiet. Zainstalowane są tylko dwa skille: `om-open-pr` i `om-setup-agent-pipeline` (`.claude/skills/`, wykluczone przez `.git/info/exclude`).
- Decyzje człowieka: walidacja jak w CI (z `test:integration` i `test:e2e`), pełna taksonomia etykiet, bramka QA włączona, wygenerowanie `SDLC.md`, `CODE_REVIEW.md` i `BACKWARD_COMPATIBILITY.md`, polskie `closeKeywords`, instalacja całej kolekcji skilli.
- Zainstalowane `.ai/trackers/github.md` i `.ai/browsers/agent-browser.md` (kopie dostarczone ze skillem).
- Utworzone 25 etykiet przez `gh label create`. Pominięte istniejące `bug` i `documentation`; żadnej istniejącej etykiety nie zmieniono.
- `SDLC.md` wygenerowany z szablonu (bez bloków discovery). `CODE_REVIEW.md` i `BACKWARD_COMPATIBILITY.md` napisane na podstawie `AGENTS.md` i inwentarza repozytorium (trasy, ciasteczko sesji, migracje, env, zdarzenia, `exports`, skrypty, strony). `AGENTS.md` i `CLAUDE.md` pozostały bez zmian.
- Utworzone katalogi `.ai/analysis`, `.ai/scripts` i `.ai/qa` z `.gitkeep`. Do `.gitignore` dopisane stany QA (`artifacts_*`, `test-env.json`, `test-env.env`).

## Weryfikacja

- `jq .` na konfiguracji: poprawny JSON.
- Ścieżki przywołane w nowych dokumentach sprawdzone w repozytorium.
- Sprawdzenie pokrycia skilli: `SKILL_COVERAGE_MISSING`. Brakuje praktycznie całej kolekcji poza dwoma zainstalowanymi skillami.
- Nie uruchamiano lint, testów ani buildu: zmiana nie dotyka kodu.

## Wynik

Konfiguracja gotowa. Skille delegujące do brakujących skilli (np. `om-auto-review-pr`, `om-code-review`, `om-fix`) zadziałają dopiero po instalacji całej kolekcji.

## Następne kroki / blokery

- Zainstalować kolekcję: `npx skills add <owner>/<repo> --skill '*'`. Źródło instalacji nie jest znane i trzeba je podać.
- Po instalacji ponownie uruchomić sprawdzenie pokrycia z `om-setup-agent-pipeline/references/skill-coverage.md`.

## Wnioski

Brak nowych.
