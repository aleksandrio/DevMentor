# Skille `om-*` dostarcza cezar przy starcie zadania

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-agent-pipeline-setup.md`, korekta od człowieka
- **Tagi:** cezar, skills, om-setup-agent-pipeline

## Kontekst

`om-setup-agent-pipeline` sprawdza, czy skille, do których odwołują się inne skille `om-*`, są zainstalowane. Sprawdza to po katalogach na dysku (`<SKILLS_ROOT>/om-*`).

## Co się stało / objaw

Sprawdzenie zgłosiło brak prawie całej kolekcji, bo w `.claude/skills/` były tylko `om-open-pr` i `om-setup-agent-pipeline`. Agent zaproponował ręczną instalację przez `npx skills add` ze zmyślonym źródłem `<owner>/<repo>`.

## Przyczyna

Repozytorium jest prowadzone przez cezar (Open Mercato). Cezar trzyma katalog skilli `open-mercato/skills` w lokalnym klonie i przy starcie każdego zadania kopiuje do worktree (`.claude/skills/`, `.agents/skills/`) tylko wybrany skill i skille, które on wymienia (do 24 sztuk). Kopie są wykluczone z gita. Pozostałe skille kolekcji są dostępne, tylko nie leżą na dysku.

## Rozwiązanie

Wynik `SKILL_COVERAGE_MISSING` w zadaniu cezara to fałszywy alarm. Kolekcja pochodzi z `open-mercato/skills`. Poza cezarem instaluje się ją przez `npx skills add open-mercato/skills --skill '*'`.

## Reguła na przyszłość

W zadaniu cezara nie uznawaj braku katalogu `om-*` w `.claude/skills/` za brak skilla i nie proponuj instalacji. Skille dostarcza cezar z katalogu `open-mercato/skills`, a ich źródłem jest `open-mercato/skills`.
