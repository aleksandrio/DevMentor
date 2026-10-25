# Skille `om-*` dostarcza cezar przy starcie zadania

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-agent-pipeline-setup.md`, korekta od człowieka; uzupełnione w `.ai/runs/2026-10-25-local-setup-command-spec.md` (druga korekta od człowieka)
- **Tagi:** cezar, skills, om-setup-agent-pipeline

## Kontekst

`om-setup-agent-pipeline` sprawdza, czy skille, do których odwołują się inne skille `om-*`, są zainstalowane. Sprawdza to po katalogach na dysku (`<SKILLS_ROOT>/om-*`).

## Co się stało / objaw

Sprawdzenie zgłosiło brak prawie całej kolekcji, bo w `.claude/skills/` były tylko `om-open-pr` i `om-setup-agent-pipeline`. Agent zaproponował ręczną instalację przez `npx skills add` ze zmyślonym źródłem `<owner>/<repo>`.

## Przyczyna

Repozytorium jest prowadzone przez cezar (Open Mercato). Cezar trzyma katalog skilli `open-mercato/skills` w lokalnym klonie i przy starcie każdego zadania kopiuje do worktree (`.claude/skills/`, `.agents/skills/`) tylko wybrany skill i skille, które on wymienia (do 24 sztuk). Kopie są wykluczone z gita. Pozostałe skille kolekcji są dostępne, tylko nie leżą na dysku.

## Rozwiązanie

Wynik `SKILL_COVERAGE_MISSING` w zadaniu cezara to fałszywy alarm. Kolekcja pochodzi z `open-mercato/skills`. Poza cezarem instaluje się ją przez `npx skills add open-mercato/skills --skill '*'`.

## Uzupełnienie (2026-10-25, issue #6)

`om-auto-fix-issue 6` (ścieżka feature) potrzebował w trakcie przebiegu `om-auto-write-spec` i `om-auto-implement-spec`, a za nimi kolejnych skilli łańcucha (`om-spec-writing`, `om-auto-review-pr`, `om-code-review`, …). Cezar dostarczył tylko skille wymienione przy starcie, więc skill, który ma być **wywołany** w łańcuchu, naprawdę nie leżał na dysku i przebieg nie mógł iść dalej. Człowiek polecił zainstalować brakujące skille w `.ai/skills/`. Kontrola pokrycia uznaje `.ai/skills/<nazwa>/SKILL.md` za dostępny skill.

## Reguła na przyszłość

W zadaniu cezara nie uznawaj braku katalogu `om-*` w `.claude/skills/` za brak skilla i nie proponuj instalacji. Skille dostarcza cezar z katalogu `open-mercato/skills`, a ich źródłem jest `open-mercato/skills`.

Wyjątek: gdy łańcuch musi **wywołać** skill, którego nie ma w `.claude/skills/`, nie zatrzymuj się na tym. Zainstaluj kolekcję przez `npx skills add open-mercato/skills --skill '*' -a claude-code -y` (trafia do `.claude/skills/`, który jest w `.gitignore`) i sprawdź pokrycie (`SKILL_COVERAGE_OK`). Nie kopiuj skilli do `.ai/skills/`: ten katalog zawiera tylko nakładki (zob. `2026-10-25-ai-skills-overlays-only.md`).

## Korekta (2026-10-25, PR #9)

Człowiek cofnął instalację pełnych kopii skilli w `.ai/skills/` z uzupełnienia wyżej: `.ai/skills/` służy wyłącznie do nakładek (różnic względem zainstalowanego skilla). Wyjątek w regule zmieniono z kopiowania do `.ai/skills/` na `npx skills add` do `.claude/skills/`.
