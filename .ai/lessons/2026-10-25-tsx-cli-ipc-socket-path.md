# CLI `tsx` nie działa przy długim `TMPDIR`; używaj `node --import tsx`

- **Data:** 2026-10-25
- **Źródło:** `.ai/runs/2026-10-25-engineering-standards-implementation.md`
- **Tagi:** tsx, node, skrypty, środowisko agenta

## Kontekst

Skrypt `db:user:promote` uruchamiał `tsx src/scripts/promote-user.ts`.

## Co się stało / objaw

`Error: listen EINVAL: invalid argument …/tsx-1001/<pid>.pipe` zaraz po starcie, zanim wykonał się jakikolwiek kod skryptu.

## Przyczyna

CLI `tsx` otwiera gniazdo IPC (Unix socket) w `TMPDIR`. W sesji agenta `TMPDIR` wskazuje głęboki katalog w `.ai/cezar/tmp/…`, a ścieżka gniazda przekracza limit długości (ok. 108 bajtów).

## Rozwiązanie

Skrypt uruchamia `node --import tsx src/scripts/promote-user.ts`. Loader `tsx` nie otwiera gniazda IPC.

## Reguła na przyszłość

Skrypty TypeScript w `package.json` uruchamiaj przez `node --import tsx <plik>`, a nie przez CLI `tsx`. Wyjątek to CLI MikroORM, które samo ładuje `tsx` jako loader.
