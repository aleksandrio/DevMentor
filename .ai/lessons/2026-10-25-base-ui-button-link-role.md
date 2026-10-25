# Base UI `Button` z `render={<Link />}` ma rolę `button`, a nie `link`

- **Data:** 2026-10-25
- **Źródło:** run `.ai/runs/2026-10-25-e2e-playwright-docker.md`
- **Tagi:** shadcn, base-ui, dostępność, playwright

## Kontekst

Na `/admin` przycisk „Przejdź do strony głównej” był zbudowany jako `<Button nativeButton={false} render={<Link href="/" />}>` (shadcn/ui w stylu `base-nova` na Base UI).

## Co się stało / objaw

Test Playwright `getByRole("link", { name: "Przejdź do strony głównej" })` nie znajdował elementu. W drzewie dostępności był `button "Przejdź do strony głównej"`, choć w HTML był `<a href="/">`.

## Przyczyna

Base UI `Button` przy renderowaniu innego elementu niż `<button>` dodaje mu `role="button"`, żeby zachować semantykę przycisku. Dla nawigacji to błąd: czytniki ekranu ogłaszają przycisk, a nie link.

## Rozwiązanie

`<Link href="/" className={buttonVariants()}>…</Link>`, czyli ten sam wygląd przez `buttonVariants` z `@devmentor/ui/components/button` i prawdziwy link.

## Reguła na przyszłość

Nawigację stylizowaną na przycisk rób przez `Link` + `buttonVariants()`. `Button` z Base UI zostaw dla akcji (onClick, submit). W testach wyszukuj elementy po roli, bo wtedy takie błędy semantyki wychodzą od razu.
