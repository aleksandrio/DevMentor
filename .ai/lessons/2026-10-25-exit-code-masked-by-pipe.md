# Potok do `tail` ukrywa kod wyjścia lint i testów

- **Data:** 2026-10-25
- **Źródło:** `.ai/runs/2026-10-25-engineering-standards-implementation.md`
- **Tagi:** środowisko agenta, weryfikacja, git

## Kontekst

Commit był w łańcuchu `npm run lint 2>&1 | tail -3 && … && git commit`.

## Co się stało / objaw

ESLint zgłosił błąd, a commit i tak powstał. Trzeba go było poprawić przez `--amend`.

## Przyczyna

Kod wyjścia potoku to kod ostatniego polecenia (`tail`, zawsze 0), więc `&&` nie zatrzymało łańcucha.

## Rozwiązanie

Wynik zapisywany do pliku i sprawdzany kod wyjścia: `npm run lint > /tmp/lint.txt 2>&1; echo "exit=$?"`.

## Reguła na przyszłość

Przed commitem sprawdzaj kod wyjścia samej komendy (`lint`, `typecheck`, `test`, `build`): przekierowanie do pliku i `$?` albo `set -o pipefail`. Nigdy nie wiąż `git commit` przez `&&` z komendą przepuszczoną przez `| tail`.
