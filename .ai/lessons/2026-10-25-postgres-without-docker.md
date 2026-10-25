# Weryfikacja na PostgreSQL bez Dockera: `embedded-postgres` poza repozytorium

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-monorepo-phase-3.md`
- **Tagi:** postgresql, testy, środowisko, docker

## Kontekst

Kryterium fazy 3 wymagało wykonania migracji na prawdziwym PostgreSQL. Repozytorium dostarcza `docker-compose.yml`.

## Co się stało / objaw

W środowisku agenta `docker` jest zainstalowany, ale `docker ps` zwraca „permission denied while trying to connect to the docker API at unix:///var/run/docker.sock”. Systemowego PostgreSQL nie ma.

## Przyczyna

Użytkownik, na którym działa agent, nie ma uprawnień do gniazda Dockera. To cecha środowiska, a nie projektu.

## Rozwiązanie

Pakiet npm `embedded-postgres` (prawdziwe binaria PostgreSQL) zainstalowany w katalogu tymczasowym poza repozytorium, uruchomiony w tle skryptem:

```js
import EmbeddedPostgres from "embedded-postgres";
const pg = new EmbeddedPostgres({ databaseDir: "/tmp/pg/data", user: "devmentor", password: "devmentor", port: 55432, persistent: true });
await pg.initialise(); await pg.start(); await pg.createDatabase("devmentor");
```

Potem `DATABASE_URL=postgres://devmentor:devmentor@localhost:55432/devmentor` w poleceniach weryfikacji.

## Reguła na przyszłość

Gdy Docker jest niedostępny, a weryfikacja wymaga PostgreSQL, uruchom `embedded-postgres` w `/tmp` (nie dodawaj go do zależności projektu) i zapisz w logu przebiegu, że weryfikacja szła na nim, a nie na obrazie z `docker-compose.yml`.
