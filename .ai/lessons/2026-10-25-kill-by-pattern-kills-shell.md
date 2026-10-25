# Zabijanie procesów po wzorcu z linii poleceń zabija też powłokę narzędzia

- **Data:** 2026-10-25
- **Źródło:** runy faz 1, 4, 5 i `.ai/runs/2026-10-25-e2e-playwright-docker.md`
- **Tagi:** środowisko, bash, agenci

## Kontekst

Agent zatrzymywał serwery `next start`/`next dev` i testowy PostgreSQL w tym samym wywołaniu Bash, w którym je sprawdzał.

## Co się stało / objaw

Wywołanie kończyło się kodem 144 (`Terminated`), a dalsze polecenia z tego samego wywołania (np. aktualizacja notatek, ponowne uruchomienie bazy) się nie wykonywały. Zdarzyło się to w tej sesji czterokrotnie.

## Przyczyna

`pkill -f "next start"`, `grep -E "[n]ext start"` i podobne dopasowują pełną linię poleceń. Linia powłoki narzędzia zawiera cały skrypt, w tym ten wzorzec, więc powłoka zabija samą siebie. Sztuczka `[n]ext` chroni tylko proces `grep`, a nie powłokę.

## Rozwiązanie

Zabijanie po nazwie procesu, a nie po linii poleceń: `ps -eo pid,comm | awk '$2=="next-server"{print $1}' | xargs -r kill`. Dla testowego PostgreSQL: PID odczytany w osobnym wywołaniu albo `kill` po nazwie `postgres` z `ps -eo pid,comm,args` filtrowanym po ścieżce danych w osobnym kroku.

## Reguła na przyszłość

Nie używaj `pkill -f` ani `grep` po linii poleceń w tym samym wywołaniu, które zawiera ten wzorzec. Procesy zatrzymuj po `comm` (np. `next-server`, `postgres`) albo po PID-ach. Kroki po zatrzymaniu procesów (zapisy notatek, restarty) wykonuj w osobnym wywołaniu.
