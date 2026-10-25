# agent-browser: `wait --url` dopasowuje wzorzec, a Chrome potrzebuje krótkiego `TMPDIR`

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-github-ci-and-coverage.md`, spec `.ai/specs/2026-10-25-github-ci-and-test-coverage.md`
- **Tagi:** agent-browser, testy integracyjne, środowisko agenta

## Kontekst

Testy integracyjne i ręczne sprawdzanie aplikacji (`npm run app:ephemeral`) sterują przeglądarką przez CLI `agent-browser` (0.39).

## Co się stało / objaw

1. `agent-browser doctor` i każde `open` kończyły się błędem Chrome `Socket path too long: .../.ai/cezar/tmp/<id>/org.chromium.Chromium.XXXX/SingletonSocket`.
2. Test rejestracji czekał na `/` przez `wait --url http://host/`. Polecenie wracało od razu, choć strona była dalej na `/register` w stanie „Zakładanie konta…”. Kolejny krok trafiał na stronę bez ciasteczka sesji.

## Przyczyna

1. Chrome tworzy gniazdo singletona w `TMPDIR`. Ścieżka gniazda Unix ma limit ok. 108 bajtów, a `TMPDIR` w worktree agenta jest długi.
2. `wait --url` traktuje argument jako wzorzec, więc `http://host/` pasuje też do `http://host/register`.

## Rozwiązanie

1. `AgentBrowser` w `test/integration/agent-browser.ts` uruchamia CLI z `TMPDIR=/tmp`.
2. `waitForPath` czeka przez `wait --fn "location.pathname + location.search === '<ścieżka>'"`.

## Reguła na przyszłość

Na dokładny adres czekaj przez `wait --fn` z porównaniem `location.pathname + location.search`, a nie przez `wait --url`. `agent-browser` uruchamiaj z krótkim `TMPDIR` (np. `TMPDIR=/tmp`), gdy Chrome zgłasza „Socket path too long”.
