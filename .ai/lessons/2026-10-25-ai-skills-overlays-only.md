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

Nie kopiuj skilli do `.ai/skills/`. Nakładka to `.ai/skills/<nazwa>/SKILL.md` bez frontmattera, zaczyna się od `> **Repo-local override.** …`, ma tylko sekcje `## <część bazowego skilla> (add|replace)` i ma mniej niż połowę linii bazowego `SKILL.md` (kontrakt: `om-create-skill/references/overlay-contract.md`).
