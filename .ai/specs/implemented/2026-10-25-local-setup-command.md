# Instalator lokalnego środowiska `npm run setup`

- **Status:** implemented
- **Data:** 2026-10-25
- **Autor:** Claude Code (claude-opus-5-5), przebieg `om-auto-fix-issue 6` (`om-auto-write-spec --autonomous`)
- **Powiązane:** issue #6, PR #7 (specyfikacja), PR #8 (implementacja), `.ai/runs/2026-10-25-local-setup-command.md`, `README.md` („Uruchomienie lokalne”, „Dostępne skrypty”), `BACKWARD_COMPATIBILITY.md` („CLI scripts (root `package.json`)”), `.ai/specs/2026-10-25-github-ci-and-test-coverage.md` (próg pokrycia 100%)

## Problem i cel

Nowa osoba (deweloper albo agent) uruchamiająca DevMentora lokalnie przechodzi dziś ręcznie pięć kroków z sekcji „Uruchomienie lokalne” w `README.md`: `npm install`, `cp .env.example .env`, uzupełnienie `AUTH_SECRET`, `docker compose up -d`, `npm run db:migrate`. Łatwo pominąć krok (najczęściej `AUTH_SECRET` albo migracje) i dostać aplikację, która startuje, ale nie działa logowanie.

Cel: jedna komenda `npm run setup`, która wykonuje te kroki w ustalonej kolejności, a uruchomiona ponownie pomija to, co już jest zrobione, i nigdy nie psuje istniejącego `.env`.

## Zakres (w zakresie / poza zakresem)

W zakresie:

- Skrypt `setup` w głównym `package.json`: `node scripts/setup.mjs`.
- Katalog `scripts/` w katalogu głównym: punkt wejścia `scripts/setup.mjs` i logika kroków `scripts/setup/steps.mjs` (czyste funkcje z wstrzykniętymi zależnościami).
- Testy jednostkowe Vitest dla `scripts/` z progiem pokrycia 100% (nowy projekt Vitest i rozszerzenie `coverage.include`, bez nowych wyłączeń).
- Objęcie `scripts/**/*.mjs` typecheckiem (`tsconfig.json` + `// @ts-check` w każdym pliku, typy przez JSDoc) i lintem, z regułą ESLint dopuszczającą w `scripts/**` tylko importy `node:*` i względne.
- `docker-compose.yml`: stała nazwa projektu Compose `name: devmentor`, żeby wszystkie worktree i klony używały jednej bazy na porcie 5432.
- `README.md`: `npm run setup` jako zalecana ścieżka, ręczne kroki jako alternatywa, wiersz w tabeli „Dostępne skrypty”.
- `BACKWARD_COMPATIBILITY.md`: `setup` na liście chronionych skryptów.

Poza zakresem:

- Instalacja przeglądarek testowych (`npx playwright install chromium`, `npx agent-browser install`).
- Nadawanie roli admina (`db:user:promote`), uruchamianie `npm run dev`.
- Instalacja Node.js albo Dockera, obsługa innych baz niż `docker-compose.yml`.
- Zmiana `DATABASE_URL` w istniejącym `.env` (skrypt go nie czyta ani nie poprawia).

## Wymagania i kryteria akceptacji

1. Na czystym klonie z Node.js ≥ 22.17 i działającym Dockerem `npm run setup` kończy się kodem 0, a po nim: `node_modules` jest zainstalowane, `.env` istnieje (kopia `.env.example`) z niepustym `AUTH_SECRET` o długości ≥ 32 bajtów po zdekodowaniu, usługa `postgres` z `docker-compose.yml` jest zdrowa (`healthy`), a `npm run db:migration:pending` nie pokazuje oczekujących migracji.
2. Drugie uruchomienie zaraz po pierwszym wypisuje „pominięto” przy każdym kroku wykonawczym (3–6; sprawdzenia wstępne 1–2 wypisują „OK”), nie zmienia zawartości ani czasu modyfikacji `.env` i kończy się kodem 0.
3. Istniejący `.env` nigdy nie jest nadpisywany. Niepusty `AUTH_SECRET` zostaje bez zmian. Pusty `AUTH_SECRET` (albo brak tej linii) zostaje uzupełniony, a reszta pliku pozostaje bez zmian.
4. Wartość `AUTH_SECRET` nigdy nie trafia na standardowe wyjście ani wyjście błędów.
5. Node.js starszy niż wersja z pola `engines.node` w `package.json` albo niedostępny Docker (brak polecenia `docker`, brak `docker compose` albo niedziałający demon) kończy skrypt czytelnym komunikatem po polsku i kodem 1, zanim skrypt cokolwiek zapisze: `.env` nie powstaje ani się nie zmienia, `npm install` nie startuje.
6. Błąd kroku (`npm install`, `docker compose up`, migracje) kończy skrypt kodem 1 z nazwą kroku i komunikatem, co zrobić ręcznie; późniejsze kroki się nie wykonują.
7. Skrypt działa przed `npm install`: importuje wyłącznie wbudowane moduły Node (`node:*`) i własne pliki z `scripts/`; pilnuje tego `no-restricted-imports` w `eslint.config.mjs` dla `scripts/**` (bez plików `*.test.mjs`).
8. `npm run test` mierzy pokrycie `scripts/**/*.mjs` i wymaga 100% (linie, gałęzie, funkcje, instrukcje); `npm run lint` i `npm run typecheck` obejmują `scripts/`.
9. `README.md` opisuje obie ścieżki (komendę i ręczne kroki) oraz zawiera `npm run setup` w tabeli skryptów.

## Projekt rozwiązania

### Kroki i wykrywanie „już zrobione”

Kolejność jest ustalona tak, żeby wszystkie sprawdzenia wstępne skończyły się przed pierwszym zapisem (kryterium 5):

| # | Krok | Sprawdzenie „pominięto” | Akcja |
| --- | --- | --- | --- |
| 1 | Wersja Node.js | — (zawsze sprawdzana) | `process.versions.node` ≥ minimum z `engines.node` (`>=X.Y[.Z]`); inaczej błąd. |
| 2 | Docker | — (zawsze sprawdzany) | `docker compose version` i `docker info` z kodem 0; inaczej błąd z linkiem do instalacji Dockera. |
| 3 | Zależności npm | `node_modules/.package-lock.json` istnieje i jego `mtimeMs` ≥ `mtimeMs` `package-lock.json` | `npm install` |
| 4 | Plik `.env` | `.env` istnieje i ma niepusty `AUTH_SECRET` | brak `.env` → kopia `.env.example`; pusty/brakujący `AUTH_SECRET` → `crypto.randomBytes(32).toString("base64")` |
| 5 | PostgreSQL | `docker compose ps --format json postgres` zwraca usługę `Service === "postgres"` w stanie `running` i z `Health === "healthy"` | `docker compose up -d --wait postgres` |
| 6 | Migracje | `npm run db:migration:pending` wypisuje `No pending migrations` (komunikat MikroORM CLI) | `npm run db:migrate` |

Wykrywanie w kroku 6 opiera się na tekście z MikroORM CLI. Gdy tekst się zmieni, skrypt po prostu wykona `db:migrate`, które i tak uruchamia tylko oczekujące migracje: fałszywe „trzeba” jest bezpieczne, a fałszywego „pominięto” nie da się dostać, bo szukamy dokładnego komunikatu o braku migracji.

Wynik `docker compose ps --format json` ma dwa kształty: tablica JSON (Compose < 2.21) albo NDJSON, jeden obiekt na linię (Compose ≥ 2.21, lokalnie v5.5.1). Parser przyjmuje oba; pusty albo nieczytelny wynik znaczy „trzeba uruchomić”, a `up -d --wait` i tak czeka na `healthy`.

### Jedna baza dla wszystkich worktree

Compose nazywa projekt od katalogu, więc w worktree (`.wt/*`) albo w klonie o innej nazwie `ps` nie widzi kontenera z głównego katalogu, a `up` próbuje uruchomić drugi `postgres` na zajętym porcie 5432 i kończy się błędem. `docker-compose.yml` dostaje `name: devmentor`. Główny katalog `DevMentor` już dziś daje projekt `devmentor` (Compose zamienia nazwę na małe litery), więc istniejący kontener i wolumen `devmentor_postgres-data` zostają te same; worktree i klony dzielą jedną bazę, tak jak dzielą port.

`npm install` (krok 3) jest pomijany po znaczniku czasu ukrytego lockfile'a npm, a nie uruchamiany zawsze, bo pełne `npm install` w tym monorepo trwa kilkanaście sekund nawet bez zmian, a kryterium 2 wymaga „pominięto”. Zmiana `package-lock.json` (np. po `git pull`) odświeża jego mtime, więc instalacja wykona się ponownie. Znane ograniczenie: zmiana `package.json` pakietu bez zmiany lockfile'a nie wymusza instalacji (wtedy `npm install` ręcznie).

### Zapis `.env`

- Nowy plik: zawartość `.env.example` z podmienioną linią `AUTH_SECRET=` na `AUTH_SECRET=<sekret>`.
- Istniejący plik z pustym `AUTH_SECRET=`: podmiana tylko tej linii; brak linii `AUTH_SECRET` → dopisanie jej na końcu (z poprzedzającym znakiem nowej linii, jeśli trzeba).
- Linia jest rozpoznawana wyrażeniem `^(export\s+)?AUTH_SECRET=(.*?)\r?$` (tryb wieloliniowy). Przy kilku takich liniach liczy się ostatnia (tak czyta `.env` Node i dotenv) i tylko ona jest podmieniana. Wartość uznajemy za pustą po `trim()` i usunięciu otaczających cudzysłowów. Zachowujemy prefiks `export ` i zakończenie `\r\n`.
- Zapis jest atomowy: najpierw usunięcie pozostałego `.env.setup-tmp` (`rmSync` z `force`), potem zapis do niego z trybem `0o600`, dla istniejącego `.env` `chmod` na tryb tego pliku, na końcu `rename` na `.env`. W `finally` plik tymczasowy jest usuwany, jeśli został. Przerwanie skryptu nie zostawia częściowo zapisanego `.env` ani pliku z sekretem o szerszych uprawnieniach.
- Komunikat mówi tylko „wygenerowano AUTH_SECRET”, bez wartości.

### Struktura kodu

- `scripts/setup/steps.mjs`: eksportuje `runSetup(deps)` → kod wyjścia (`0`/`1`) oraz funkcje pomocnicze (`parseMinNodeVersion`, `isVersionAtLeast`, `upsertAuthSecret`, `isPostgresHealthy`). Wszystkie efekty uboczne idą przez `deps`: `exec(command, args) → { status, stdout, stderr }`, `fs` (`existsSync`, `readFileSync`, `writeFileSync`, `renameSync`, `statSync`, `chmodSync`, `rmSync`), `randomBytes`, `log`, `error`, `nodeVersion`, `cwd`.
- `scripts/setup/deps.mjs`: `createDeps()` składa prawdziwe zależności z `node:child_process` (`spawnSync`, `stdio` dziedziczone dla `npm install` i `docker compose up`, przechwytywane dla sprawdzeń), `node:fs`, `node:crypto`.
- `scripts/setup.mjs`: punkt wejścia, dwie linie: `process.exitCode = runSetup(createDeps())`.
- Typy przez JSDoc (`@typedef SetupDeps`), sprawdzane przez `tsc`: root `tsconfig.json` obejmuje `scripts/**/*.mjs`, a każdy plik zaczyna się od `// @ts-check` (`checkJs` nie da się włączyć dla wybranych plików w `tsconfig`, a globalne objęłoby też `test/**/*.mjs`).

### Testy i pokrycie

- `vitest.config.ts`: `projects` dostaje obok `"packages/*"` wpis inline `{ test: { name: "scripts", environment: "node", include: ["scripts/**/*.test.mjs"] } }`, a `coverage.include` dodaje `scripts/**/*.mjs`. Lista wyłączeń się nie zmienia: pliki `*.test.mjs` Vitest 5 wyklucza z pomiaru sam (domyślny wzorzec `test.include`).
- `steps.test.mjs`: każdy krok w wariancie „pominięto”, „wykonano” i „błąd”, kolejność (sprawdzenia wstępne przed zapisem), brak sekretu w `log`/`error`, atomowy zapis `.env` (pozostały plik tymczasowy, tryb pliku, sprzątanie po błędzie), wszystkie gałęzie `upsertAuthSecret` (CRLF, `export`, kilka linii, cudzysłowy, brak linii), parser `ps` (tablica, NDJSON, pusty wynik, śmieci).
- `deps.test.mjs`: atrapy `node:child_process`/`node:fs`/`node:crypto` (`vi.mock`), sprawdzenie mapowania wyniku `spawnSync`.
- `setup.test.mjs`: atrapa `./setup/steps.mjs` i `./setup/deps.mjs`, import punktu wejścia i sprawdzenie `process.exitCode`; `afterEach` zeruje `process.exitCode`, a `vi.resetModules()` izoluje importy, żeby wartość 1 nie wyciekła do kodu wyjścia Vitest.

## Plan wdrożenia i testów

Faza 1 (jedna PR implementacyjna, `Closes #6`):

1. Konfiguracja: projekt `scripts` w `vitest.config.ts`, `coverage.include`, `tsconfig.json` (include `scripts/**/*.mjs`), reguła importów w `eslint.config.mjs`, `name: devmentor` w `docker-compose.yml`; test-stub `scripts/setup/steps.mjs` z `runSetup` zwracającym 0 i jego test. Lint, typecheck i test przechodzą.
2. Sprawdzenia wstępne: Node.js i Docker (kroki 1–2) z testami.
3. Kroki 3–6 z testami, w tym zapis `.env` i wykrywanie „pominięto”.
4. `deps.mjs`, punkt wejścia `setup.mjs`, skrypt `setup` w `package.json`, testy.
5. `README.md` i `BACKWARD_COMPATIBILITY.md`.
6. Weryfikacja ręczna w osobnym klonie (`git clone` lokalnego repozytorium do katalogu tymczasowego): pierwsze uruchomienie → kod 0 i stan z kryterium 1; drugie → same „pominięto”, `.env` bez zmian (`sha256sum`, `stat`); uruchomienie z `PATH` bez `docker` → kod 1, brak `.env`. Wynik w logu `.ai/runs/`. Dzięki `name: devmentor` klon używa tej samej bazy co główny katalog; żeby sprawdzić ścieżkę „baza nie działa”, przed pierwszym uruchomieniem zatrzymaj kontener (`docker compose stop`), bez usuwania wolumenu.

Bramka: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run audit`. `test:integration` i `test:e2e` nie są dotknięte zmianą (nie zmieniają się serwisy, trasy ani strony), ale uruchamia je CI.

## Otwarte pytania

Brak — rozstrzygnięte domyślnie, zob. niżej.

## Resolved assumptions (autonomous defaults)

| # | Pytanie (z issue #6) | Przyjęta odpowiedź | Uzasadnienie |
| --- | --- | --- | --- |
| Q1 | Czy `setup` instaluje przeglądarki testowe (Playwright, agent-browser)? | Nie. | Najmniejszy zakres; pobieranie przeglądarek jest wolne i potrzebne tylko do testów. README dalej opisuje te komendy. |
| Q2 | Brak Dockera: przerwać z błędem czy pominąć bazę z ostrzeżeniem i kodem 0? | Przerwać z kodem 1 przed jakimkolwiek zapisem. Potwierdzone przez człowieka (2026-10-25). | Kryteria „Done when” w issue wymagają niezerowego kodu i stanu „PostgreSQL działa” po sukcesie; kod 0 bez bazy dawałby fałszywy sukces. Issue oznaczał to pytanie jako wymagające potwierdzenia; człowiek potwierdził. |
| Q3 | Czy generować `AUTH_SECRET` automatycznie? | Tak, tylko gdy jest pusty albo go brak; 32 losowe bajty w base64; wartość nie trafia na wyjście. | Lokalny sekret deweloperski; nie osłabia bezpieczeństwa (silniejszy niż ręcznie wpisany) i nie dotyka istniejącej wartości. |
| Q4 | `npm install`: pomijać czy uruchamiać zawsze? | Pomijać, gdy `node_modules/.package-lock.json` jest nowszy od `package-lock.json`. | Kryterium 2 wymaga „pominięto” przy każdym kroku; zmiana lockfile'a i tak wymusza instalację. |
| Q5 | Gdzie mieszka skrypt i jak jest pokryty testami? | `scripts/` w katalogu głównym, nowy projekt Vitest `scripts` i `coverage.include` rozszerzone o `scripts/**/*.mjs`. | Skrypt musi działać przed `npm install`, więc nie może być w pakiecie workspace z zależnościami; rozszerzenie pomiaru zamiast wyłączenia zachowuje regułę 100%. |

## Decyzje i zmiany

<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->

- 2026-10-25: po przeglądzie (świeży kontekst) dodano `name: devmentor` w `docker-compose.yml` (konflikt portu 5432 w worktree), parser obu formatów `docker compose ps`, bezpieczny tryb pliku przy zapisie `.env`, regułę ESLint dla importów w `scripts/`, `// @ts-check` zamiast `checkJs` per plik i doprecyzowano kryterium 2.
- 2026-10-25: człowiek zatwierdził specyfikację i potwierdził Q2 (brak Dockera → kod 1); status `approved`.
- 2026-10-25: wdrożono w PR #8. Plik tymczasowy usuwa `rmSync(..., { force: true })` zamiast `unlinkSync` (bez osobnego sprawdzania istnienia). README: „Szybki start: `npm run setup`” i „Ręcznie, krok po kroku”. Status `implemented`.
