<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: zasady pracy agentów AI w DevMentor

Ten plik obowiązuje każdego agenta AI (Claude Code, Codex, OpenCode, Cursor i innych) pracującego w tym repozytorium. `CLAUDE.md` importuje ten plik. Jeśli te dokumenty są ze sobą sprzeczne, rozstrzyga AGENTS.md.

O projekcie przeczytasz w `README.md`. Stos opisuje sekcja „Architektura i stos technologiczny” niżej.

## Architektura i stos technologiczny

To są założenia architektoniczne projektu. Trzymaj się ich w każdej zmianie. Odejście od nich (inna biblioteka, nowy pakiet, zmiana kierunku zależności) to decyzja architektoniczna: wymaga specyfikacji w `.ai/specs/` i zgody człowieka.

> Architektura opisana niżej jest wdrożona (`.ai/specs/2026-10-25-monorepo-migration.md`). Wzorcem dla nowych funkcji jest przepływ statusu bazy na `/admin`: `core/src/health/` → `db/src/health/` → `app/src/server/container.ts` → `app/src/app/(backend)/admin/_components/database-status.tsx`.

### Stos

| Obszar | Technologia | Uwagi |
| --- | --- | --- |
| Framework | Next.js (najnowsza wersja, App Router) | Przed pisaniem kodu czytaj `node_modules/next/dist/docs/`, bo API różni się od tego, co znasz z treningu. |
| Język | TypeScript w trybie `strict` | Bez `any` i `@ts-ignore` bez uzasadnienia w komentarzu. |
| UI | React (najnowsza wersja) | Domyślnie Server Components. `"use client"` tylko tam, gdzie potrzebna jest interaktywność. |
| Baza danych | PostgreSQL | Jedyna wspierana baza. |
| ORM | MikroORM | Encje, migracje, pula połączeń, Unit of Work. |
| Dependency Injection | Awilix | Jeden kontener złożony w pakiecie `app`. |
| Style stron frontendowych | Tailwind CSS | Publiczna część serwisu (strony dla uczących się i mentorów). |
| Komponenty stron backendowych | shadcn/ui (na Tailwindzie) | Panel administracyjny i inne strony zaplecza. |
| Monorepo | npm workspaces | Pakiety w katalogu `packages/`. Node.js ≥ 22.17 (wymóg MikroORM 7, pole `engines`). |
| Jakość | ESLint, `tsc` | `npm run lint`, `npm run typecheck` i `npm run build` przed każdym commitem. |

Nie dodawaj alternatyw dla powyższych narzędzi (innego ORM-a, query buildera, kontenera DI, biblioteki komponentów czy CSS-in-JS) bez specyfikacji.

### Monorepo i pakiety

```
packages/
├── app/   # @devmentor/app: aplikacja Next.js, routing, strony, Server Actions, composition root DI
├── core/  # @devmentor/core: logika domenowa i części wielokrotnego użytku, niezależne od frameworka
├── db/    # @devmentor/db: MikroORM, encje, repozytoria, migracje, konfiguracja połączenia
└── ui/    # @devmentor/ui: komponenty interfejsu wielokrotnego użytku, w tym komponenty shadcn/ui
```

To minimalny zestaw. Nowy pakiet dodajesz tylko na podstawie specyfikacji, w `packages/<nazwa>` i z nazwą `@devmentor/<nazwa>`.

| Pakiet | Co zawiera | Czego nie zawiera |
| --- | --- | --- |
| `app` | Katalog `app/` Next.js (strony, layouty, Route Handlers, Server Actions), kontener Awilix i jego rejestracje, konfiguracja środowiska, cienkie warstwy łączące UI z serwisami. | Logiki domenowej, zapytań do bazy wprost w komponentach, komponentów wielokrotnego użytku. |
| `core` | Typy i modele domenowe, serwisy i przypadki użycia, interfejsy (porty) repozytoriów i usług zewnętrznych, walidacja, błędy domenowe, narzędzia ogólnego przeznaczenia. | Importów z `next`, `react`, `@mikro-orm/*` i innych pakietów `@devmentor/*`. |
| `db` | Konfiguracja MikroORM, encje, implementacje repozytoriów z `core`, migracje, seedy, skrypty CLI bazy. | Kodu UI i importów z `next` (poza `server-only`). |
| `ui` | Komponenty React wielokrotnego użytku: prymitywy shadcn/ui, komponenty frontendowe, wspólne style i tokeny Tailwinda, hooki UI. | Pobierania danych, wywołań serwisów, importów z `db`. Komponenty dostają dane przez propsy. |

Dozwolony kierunek zależności między pakietami:

```
app ──► core
app ──► db ──► core
app ──► ui ──► core (tylko typy i czyste funkcje pomocnicze)
```

- `core` nie zależy od żadnego innego pakietu `@devmentor/*`.
- `db` i `ui` nie zależą od siebie nawzajem ani od `app`.
- Cykle zależności są zabronione.
- Granice egzekwuje reguła `no-restricted-imports` w `eslint.config.mjs`. Nie wyłączaj jej. Jeśli granica blokuje sensowną zmianę, to jest decyzja architektoniczna wymagająca specyfikacji.
- Pakiety `core`, `db` i `ui` nie mają kroku budowania: `exports` wskazuje pliki źródłowe `.ts`, a Next.js transpiluje je sam. Wspólne ustawienia TypeScriptu są w `tsconfig.base.json`.
- Importuj pakiety po nazwie (`@devmentor/core`) i tylko przez ich publiczny punkt wejścia (`exports` w `package.json`). Nie sięgaj do `../../packages/x/src/...`.
- Zależności npm instaluj w pakiecie, który ich używa (`npm install <pkg> -w @devmentor/<nazwa>`), a nie w katalogu głównym. W katalogu głównym trzymaj tylko narzędzia całego repozytorium (ESLint, TypeScript, skrypty).

### Baza danych: PostgreSQL i MikroORM

- Cały kod MikroORM (konfiguracja, encje, repozytoria, migracje) mieszka w `packages/db`. Inne pakiety nie importują `@mikro-orm/*` bezpośrednio. Wyjątkiem jest `app`, który rejestruje instancję ORM w kontenerze i otwiera kontekst żądania.
- Połączenie konfiguruje zmienna środowiskowa `DATABASE_URL`. Nie zapisuj danych dostępowych w kodzie ani w repozytorium. Ustawienia puli połączeń trzymaj w konfiguracji MikroORM w `packages/db`.
- W procesie istnieje jedna instancja `MikroORM`. W trybie deweloperskim przechowuj ją w `globalThis`, żeby HMR nie otwierał nowych pul połączeń.
- Globalnego `EntityManager` nie używaj do obsługi żądań. Każde żądanie, Server Action i zadanie w tle pracuje na własnym `em.fork()` (albo w `RequestContext`).
- Zmiany schematu wprowadzaj wyłącznie migracjami MikroORM generowanymi w `packages/db`. Migracje commituj razem z encjami. Nie edytuj migracji, która trafiła na gałąź główną: popraw błąd nową migracją. `schema:update` jest dozwolone tylko lokalnie do eksperymentów.
- Kod bazy działa tylko na serwerze. Pakiet `db` nie może trafić do bundla klienta (używaj `server-only`, a w Next.js dodaj pakiety MikroORM do `serverExternalPackages`, jeśli bundler tego wymaga).
- Encje to szczegół warstwy danych. Do `core` i do komponentów UI przekazuj typy domenowe albo DTO, a nie encje MikroORM.
- Używamy MikroORM 7 (tylko ESM). Encje definiujesz przez `defineEntity` (bez dekoratorów) i rejestrujesz ręcznie w `packages/db/src/entities/index.ts`. Nie ma wykrywania po folderach. Gdy dodasz pierwszą encję, usuń `discovery.warnWhenNoEntities: false` z `packages/db/src/config.ts`.
- Aplikacja dostaje ORM przez `getOrm({ databaseUrl })` z `@devmentor/db` (singleton w `globalThis`). Konfiguracja dla CLI jest w `packages/db/src/mikro-orm.config.ts` i tylko ona dołącza Migrator.
- Zmienne środowiskowe trzymasz w jednym pliku `.env` w katalogu głównym repozytorium (wzór: `.env.example`). Czyta go Next.js (`loadEnvConfig` w `next.config.ts`) i CLI MikroORM. Nie twórz `.env` w pakietach.
- Komendy bazy uruchamiasz w katalogu głównym: `npm run db:migrate`, `npm run db:migration:create -- --name <nazwa>`, `npm run db:migration:list`, `npm run db:migration:pending`. Lokalną bazę uruchamia `docker compose up -d`.
- Aplikacja musi się budować i startować bez dostępnej bazy. Nie łącz się z bazą na poziomie modułu ani podczas prerenderowania; połączenie otwiera dopiero `getOrm()` wywołane w obsłudze żądania.

### Dependency Injection: Awilix

- Kontener tworzysz w jednym miejscu: composition root w `packages/app` (np. `packages/app/src/server/container.ts`). Tam rejestrujesz instancję ORM, repozytoria z `db`, serwisy z `core` i konfigurację.
- Serwisy w `core` i repozytoria w `db` nie importują kontenera i nie znają Awilix. Zależności dostają przez konstruktor (wstrzykiwanie przez obiekt, tryb `InjectionMode.PROXY`, np. `constructor({ mentorRepository }: Deps)`).
- Czasy życia: konfiguracja, instancja ORM i klienci usług zewnętrznych to `singleton`. Wszystko, co zależy od `EntityManager` (repozytoria, serwisy domenowe), to `scoped`. Dla każdego żądania lub Server Action tworzysz `container.createScope()` z rejestracją sforkowanego `em`.
- Zależności rozwiązujesz tylko w kodzie serwerowym w `app`: Server Components, Server Actions, Route Handlers. Komponenty klienckie i pakiet `ui` nigdy nie korzystają z kontenera.
- Nie wywołuj `container.resolve()` w głębi logiki (wzorzec service locator). Rozwiązuj zależność na brzegu żądania i przekazuj ją dalej.
- Kontener jest w `packages/app/src/server/container.ts`, a typ `Cradle` wymienia każdą zależność. Nową zależność rejestrujesz jawnie: dopisujesz linię w `register` i pole w `Cradle`. Nie używaj `loadModules` ani rejestracji przez skanowanie folderów.
- Na brzegu żądania korzystasz z `withRequestScope` z `packages/app/src/server/request-scope.ts`, np. `await withRequestScope(({ systemHealthService }) => systemHealthService.checkDatabase())`. Helper czeka na `connection()`, więc baza nigdy nie jest odpytywana podczas prerenderowania. Tworzy też scope z własnym `em.fork()` i po zakończeniu go zamyka.
- Komponent, który pobiera dane przez `withRequestScope`, umieszczasz w `<Suspense>` (włączone `cacheComponents`). Statyczna część strony zostaje wtedy prerenderowana, a dane są doładowywane przy żądaniu. Wzorzec: `packages/app/src/app/(backend)/admin/_components/database-status.tsx`.
- Wzorzec pionowego przepływu: port i serwis w `core` (`core/src/health/`), implementacja portu w `db` (`db/src/health/`), rejestracja w `container.ts`, użycie w Server Component. Kontener rejestruje porty zależne od bazy tylko wtedy, gdy ustawiono `DATABASE_URL`; bez niej rejestruje `null`.

### Interfejs: Tailwind CSS i shadcn/ui

- **Strony frontendowe** (publiczna część serwisu dla uczących się i mentorów) stylujesz klasami Tailwind CSS. Nie dodawaj innych bibliotek komponentów ani CSS-in-JS.
- **Strony backendowe** (panel administracyjny, moderacja, zarządzanie treścią) budujesz z komponentów shadcn/ui. Ich wygląd zmieniasz przez warianty i klasy Tailwinda, a nie przez osobne arkusze CSS.
- Komponenty shadcn/ui generujesz CLI shadcn do `packages/ui` i stamtąd je importujesz. Nie kopiuj ich do `packages/app`.
  - Dodawanie: `npx shadcn@latest add <komponent> -c packages/ui` (w katalogu głównym). Konfiguracja jest w `packages/ui/components.json` (styl `base-nova`, czyli komponenty na Base UI, `@base-ui/react`).
  - Nie uruchamiaj `shadcn init` na `packages/ui`: CLI nie rozpoznaje tam frameworka, a konfiguracja jest już gotowa.
  - Importujesz po ścieżce komponentu: `import { Button } from "@devmentor/ui/components/button"`. `@devmentor/ui` nie ma zbiorczego punktu wejścia; publiczne ścieżki to `components/*`, `lib/*`, `hooks/*` i `globals.css` (pole `exports`).
- Jeden zestaw tokenów (kolory, typografia, odstępy, promienie) w `packages/ui/src/styles/globals.css` obsługuje obie części serwisu. Tryb ciemny wynika z `prefers-color-scheme` (domyślny wariant `dark:` Tailwinda). Nie dodawaj klasy `.dark` ani `@custom-variant dark` bez specyfikacji.
- W App Routerze rozdzielaj części serwisu grupami tras, np. `app/(frontend)/...` i `app/(backend)/admin/...`, każda z własnym layoutem.

## Katalog `.ai/`: wspólna pamięć projektu

```
.ai/
├── specs/                  # specyfikacje SDD (Spec-Driven Development)
│   ├── YYYY-MM-DD-slug.md  # aktywne: szkic, zatwierdzone, w realizacji
│   ├── implemented/        # wdrożone
│   └── archive/            # porzucone albo zastąpione
├── runs/                   # logi autonomicznych przebiegów AI
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # indeks wniosków; czytany na starcie każdej sesji
├── lessons/                # pełne opisy wniosków
│   └── YYYY-MM-DD-slug.md
└── cezar/                  # lokalny stan narzędzia cezar (w .gitignore, nie edytuj)
```

Wszystko poza `.ai/cezar/` jest wersjonowane w gicie i commitowane razem z kodem, którego dotyczy.

### Konwencja nazw (wspólna dla specs, runs i lessons)

Format: `YYYY-MM-DD-slug.md`, np. `2026-10-24-mentor-profiles.md`.

- `YYYY-MM-DD` to data utworzenia pliku. Nie zmieniaj jej przy późniejszych edycjach ani przy przenoszeniu pliku.
- `slug` pisz po angielsku, małymi literami, ze słowami rozdzielonymi myślnikami (`[a-z0-9-]`, 2–6 słów). Ma mówić, czego dotyczy plik.
- Jeśli taka nazwa już istnieje, doprecyzuj slug (np. `-v2` albo bardziej opisowe słowo). Nigdy nie nadpisuj cudzego pliku.
- Pliki w tych katalogach nie mają innych nazw. Jedyny wyjątek to `.gitkeep`.

## Zasady obowiązkowe

Zasady są wiążące. Jeśli nie możesz ich spełnić, powiedz to wprost i nie pomijaj ich po cichu.

1. **Na starcie sesji** przeczytaj `.ai/lessons.md`. Przed zmianą funkcji sprawdź, czy w `.ai/specs/` (także w `implemented/`) jest jej specyfikacja, i ją przeczytaj.
2. **Najpierw spec, potem kod.** Każda nietrywialna zmiana (nowa funkcja, zmiana zachowania, model danych, API, architektura) wymaga specyfikacji w `.ai/specs/`. Bez specyfikacji wolno robić tylko drobne poprawki: literówki, oczywiste jednolinijkowe bugfixy, formatowanie i podbijanie zależności bez zmiany zachowania.
3. **Kod zgodny ze specyfikacją.** Gdy w trakcie pracy okaże się, że trzeba odejść od specyfikacji, najpierw zaktualizuj specyfikację (sekcja „Decyzje i zmiany”), a dopiero potem kod.
4. **Każdy przebieg autonomiczny zostawia log** w `.ai/runs/`. Dotyczy to każdej pracy bez bieżącego nadzoru człowieka: zadań z kolejki, automatyzacji, sub-agentów i długich zadań wieloetapowych. Log zakładasz na początku przebiegu, uzupełniasz w trakcie i domykasz przed zakończeniem.
5. **Wnioski zapisujesz od razu.** Po naprawieniu błędu, którego przyczyna nie była oczywista, po odkryciu pułapki w narzędziu, bibliotece lub projekcie albo gdy człowiek cię poprawi, zapisz wniosek w `.ai/lessons/` i dopisz go do indeksu `.ai/lessons.md`, zanim zakończysz zadanie.
6. **Zakończenie zadania** obejmuje: domknięty log przebiegu, zaktualizowany status specyfikacji (i przeniesienie jej, jeśli trzeba) oraz zapisane wnioski. Pliki z `.ai/` idą w tym samym commicie co kod.

## Sposób pracy

Te zasady uzupełniają zasady obowiązkowe. Opierają się na wskazówkach zespołu Claude Code (Boris Cherny).

1. **Złożone zadanie zaczynaj od planu.** Przed zmianą w wielu plikach albo decyzją architektoniczną rozpisz plan (tryb planowania albo sekcje „Projekt rozwiązania” i „Plan wdrożenia i testów” w specyfikacji). Dopracuj go tak, żeby implementacja poszła za jednym podejściem. Przy dużych zmianach poproś drugiego agenta albo człowieka o krytyczny przegląd planu.
2. **Gdy coś się sypie, wróć do planu.** Jeśli implementacja rozjeżdża się z planem albo kolejne poprawki nie pomagają, zatrzymaj się i zaplanuj od nowa zamiast brnąć dalej. Nowy plan zapisz w specyfikacji (zasada obowiązkowa 3).
3. **Łatkę zastępuj porządnym rozwiązaniem.** Jeśli poprawka działa, ale jest prowizoryczna, wykorzystaj to, czego się przy niej nauczyłeś, i wdróż czyste rozwiązanie, zanim oddasz pracę.
4. **Błędy naprawiaj samodzielnie i u źródła.** Przy zgłoszeniu błędu albo padającym lincie lub buildzie sam odtwórz problem, znajdź przyczynę i ją usuń. Nie wyciszaj objawów (`eslint-disable`, `@ts-ignore`, `any`) bez uzasadnienia w komentarzu.
5. **Sam sprawdź, że zmiana działa.** Zielony lint i build to minimum (sekcja „Weryfikacja zmian w kodzie”). Zmianę zachowania sprawdź tak, jak zobaczy ją użytkownik, np. przez `npm run dev` i otwarcie zmienionej strony, i porównaj wynik z kryteriami akceptacji specyfikacji. Nie ogłaszaj sukcesu bez dowodu. To, czego nie sprawdziłeś, wpisz wprost do logu przebiegu.
6. **Każda korekta staje się regułą.** Gdy człowiek cię poprawi, zapisz wniosek (zasada obowiązkowa 5) jako konkretną regułę, która zapobiegnie powtórce, a nie jako opis zdarzenia. Jeśli błąd wraca mimo wpisu, doprecyzuj istniejącą regułę zamiast dodawać nową.
7. **Odciążaj kontekst sub-agentami.** Szerokie przeszukiwanie kodu, research i niezależne podzadania zlecaj sub-agentom, żeby główny kontekst pozostał czysty. Równoległe zadania prowadź w osobnych gałęziach albo git worktree, każde z własnym logiem w `.ai/runs/`.
8. **Powtarzalną procedurę zamieniaj w narzędzie.** Jeśli ten sam ciąg kroków wykonujesz regularnie, zaproponuj skrypt w `package.json` albo komendę lub skill commitowane w repozytorium, żeby korzystali z nich wszyscy agenci.

## `.ai/specs/`: specyfikacje SDD

Cykl życia:

| Etap | Miejsce | `Status` w nagłówku |
| --- | --- | --- |
| Szkic, dyskusja | `.ai/specs/` | `draft` |
| Zatwierdzona przez człowieka | `.ai/specs/` | `approved` |
| W realizacji | `.ai/specs/` | `in-progress` |
| Wdrożona, kod na gałęzi głównej | `.ai/specs/implemented/` | `implemented` |
| Porzucona albo zastąpiona | `.ai/specs/archive/` | `archived` (z powodem i linkiem do następczyni) |

- Pliki przenoś przez `git mv`, żeby zachować historię, a nazwy nie zmieniaj.
- Bez zgody człowieka nie zaczynaj implementacji specyfikacji, która ma status `draft`.
- Specyfikacje w `implemented/` opisują, jak system działa. Gdy późniejsza zmiana unieważnia ich treść, napisz nową specyfikację i odnieś się do starej. Nie przepisuj historii.
- W komentarzach w kodzie i w opisach commitów możesz cytować specyfikację po nazwie pliku.

Szablon:

```markdown
# <Tytuł>

- **Status:** draft | approved | in-progress | implemented | archived
- **Data:** YYYY-MM-DD
- **Autor:** <człowiek / agent>
- **Powiązane:** <inne specs, issues, PR>

## Problem i cel
## Zakres (w zakresie / poza zakresem)
## Wymagania i kryteria akceptacji
## Projekt rozwiązania
## Plan wdrożenia i testów
## Otwarte pytania
## Decyzje i zmiany
<!-- YYYY-MM-DD: co się zmieniło i dlaczego -->
```

## `.ai/runs/`: logi przebiegów autonomicznych

- Jeden plik na jeden przebieg. Data w nazwie to dzień startu, a slug opisuje zadanie.
- Log to rzetelny zapis tego, co się wydarzyło, a nie raport sukcesu. Zapisuj nieudane próby, porzucone podejścia i rzeczy pominięte.
- Gdy przebieg jest przerwany, log musi pozwolić następnemu agentowi podjąć pracę (sekcja „Następne kroki”).
- Raz domkniętego logu nie edytuje się później. Kontynuacja to nowy przebieg z odnośnikiem do poprzedniego.

Szablon:

```markdown
# <Zadanie>

- **Status:** in-progress | done | partial | failed | blocked
- **Start / koniec:** YYYY-MM-DD HH:MM / YYYY-MM-DD HH:MM
- **Agent / model:** <np. Claude Code / claude-opus-5-5>
- **Specyfikacja:** .ai/specs/...
- **Gałąź / commity:** <branch, hashe>

## Cel
## Przebieg
<!-- chronologicznie: co zrobiono, decyzje, napotkane problemy -->
## Weryfikacja
<!-- uruchomione komendy (lint, build, testy) i ich wynik -->
## Wynik
## Następne kroki / blokery
## Wnioski
<!-- linki do wpisów w .ai/lessons/ dodanych w tym przebiegu -->
```

## `.ai/lessons.md` i `.ai/lessons/`: pamięć długoterminowa

- `.ai/lessons/YYYY-MM-DD-slug.md` to pełny opis jednego wniosku: kontekst, objaw, przyczyna, rozwiązanie i reguła na przyszłość.
- `.ai/lessons.md` to krótki indeks, który agenci czytają na starcie każdej sesji. Ma jedną linię na wniosek, pogrupowaną tematycznie: `- [Tytuł](lessons/YYYY-MM-DD-slug.md): reguła w jednym zdaniu`. Pisz linie tak, żeby sama reguła wystarczała do działania bez otwierania pliku.
- Zanim dodasz wpis, sprawdź, czy podobny już istnieje. Jeśli tak, zaktualizuj go zamiast tworzyć duplikat.
- Wniosek, który okazał się błędny lub nieaktualny, usuń albo popraw w obu miejscach, a zmianę opisz w pliku wniosku.
- Nie zapisuj tu rzeczy, które da się odczytać z kodu, z historii gita ani z tego pliku. Liczy się to, co nieoczywiste.
- Nigdy nie zapisuj sekretów, tokenów ani danych osobowych.

Szablon wniosku:

```markdown
# <Tytuł>

- **Data:** YYYY-MM-DD
- **Źródło:** <run / spec / PR / rozmowa>
- **Tagi:** <np. nextjs, tailwind, testy>

## Kontekst
## Co się stało / objaw
## Przyczyna
## Rozwiązanie
## Reguła na przyszłość
```

## Weryfikacja zmian w kodzie

Przed commitem uruchom:

```bash
npm run lint
npm run typecheck
npm run build
```

Wszystkie komendy uruchamiasz w katalogu głównym repozytorium. `typecheck` sprawdza każdy pakiet workspace osobno, a `lint` pilnuje też granic między pakietami.

Wynik zapisz w logu przebiegu (sekcja „Weryfikacja”).
