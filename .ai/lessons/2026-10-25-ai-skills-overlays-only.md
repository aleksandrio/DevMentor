# `.ai/skills/` zawiera tylko nakładki, nie kopie skilli

- **Data:** 2026-10-25
- **Źródło:** rozmowa (korekta od człowieka)
- **Tagi:** skille, om-*, proces

## Kontekst

Skille `om-*` czytają na starcie `.ai/skills/<nazwa>/SKILL.md` jako nakładkę repozytorium („ALWAYS check first: Apply `.ai/skills/<nazwa>/SKILL.md` when present”).

## Co się stało / objaw

Agent zainstalował pełne kopie 53 skilli `om-*` do `.ai/skills/`. Człowiek to cofnął: ten katalog ma zawierać tylko skille, które chce nadpisać.

## Przyczyna

`.ai/skills/` wygląda jak katalog instalacji, ale dla skilli `om-*` to miejsce na różnice względem zainstalowanej wersji.

## Rozwiązanie

Skille instaluje się zwykłą drogą (`npx skills add open-mercato/skills --skill '*' -a claude-code -y`, trafiają do `.claude/skills/`, który jest w `.gitignore`; wersje przypina commitowany `skills-lock.json`). W `.ai/skills/` zostaje tylko `om-code-review/SKILL.md` z różnicami.

## Reguła na przyszłość

Nie kopiuj skilli do `.ai/skills/`. Nakładka to `.ai/skills/<nazwa>/SKILL.md` bez frontmattera, zaczyna się od `> **Repo-local override.** …`, ma tylko sekcje `## <część bazowego skilla> (add|replace)` i ma mniej niż połowę linii bazowego `SKILL.md` (kontrakt: `om-create-skill/references/overlay-contract.md`). Nie dodawaj do nakładki odwołań do ścieżek bazowego skilla: nakładka to czyste różnice, a bazowy skill sam ją czyta na starcie.

## Uzupełnienie (2026-10-25, review PR #9)

Przy uruchomieniu `/om-code-review` w cezarze sesja dostała jako instrukcje skilla wyłącznie 7-liniową nakładkę ("Skill files are installed on disk at: .ai/skills/om-code-review"). Agent, który nie przeczyta bazy sam, wykona tylko różnice, bez bramki walidacji i checklist. Człowiek odrzucił obejście przez `@`-import bazy w nakładce: `.claude/skills/` jest poza gitem, a nakładka ma zawierać tylko różnice. To znane ograniczenie cezara do poprawienia po jego stronie; do tego czasu, gdy cezar poda samą nakładkę, przeczytaj bazowy `.claude/skills/<nazwa>/SKILL.md` i zastosuj na nim różnice.
