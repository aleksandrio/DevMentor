# Playwright w tym repo: kolory w `lab()` i cache transformacji w `TMPDIR` w repozytorium

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-e2e-playwright-docker.md`, spec `.ai/specs/implemented/2026-10-25-e2e-playwright.md`
- **Tagi:** playwright, tailwind, eslint, testy

## Kontekst

Pierwsze testy e2e w `packages/app/e2e/`, uruchamiane w środowisku agenta (cezar).

## Co się stało / objaw

1. `toHaveCSS("background-color", "rgb(23, 23, 23)")` padało z wynikiem `lab(7.78201 -0.0000149012 0)`, choć kolor był poprawny.
2. Po uruchomieniu testów `npm run lint` zgłaszał błędy `no-require-imports` w plikach `.ai/cezar/tmp/.../playwright-transform-cache-*/…spec.js`.

## Przyczyna

1. Tailwind 4 zapisuje kolory w `oklch`, a Chromium zwraca obliczoną wartość w przestrzeni `lab()`, a nie `rgb()`.
2. Playwright zapisuje cache transformacji w `TMPDIR`, a cezar ustawia `TMPDIR` na `.ai/cezar/tmp/...` w repozytorium. Płaska konfiguracja ESLint nie czyta `.gitignore`, więc lintowała ten cache.

## Rozwiązanie

1. Test porównuje kolor przycisku z obliczoną wartością tokenu (`var(--primary)` na elemencie pomocniczym), a nie z literałem.
2. `eslint.config.mjs` ignoruje `.ai/**`, `**/test-results/**` i `**/playwright-report/**`.

## Reguła na przyszłość

W testach nie porównuj kolorów z literałami `rgb()`; porównuj z obliczoną wartością tokenu CSS. Katalogi bez kodu źródłowego (`.ai/`, artefakty testów) muszą być w `globalIgnores` ESLint, bo flat config nie korzysta z `.gitignore`.
