# Code review rules

These rules apply to every PR in DevMentor, whether a human or `om-code-review` / `om-auto-review-pr` does the review. They put into practice the rules in `AGENTS.md` (sections "Architektura i stos technologiczny" and "Jakość kodu i przegląd") and the full checklist in `.ai/specs/2026-09-01-engineering-standards.md`. When this file and `AGENTS.md` disagree, `AGENTS.md` wins. Fix this file so they agree again.

## Review priorities

1. **Correctness.** The change does what its spec in `.ai/specs/` says, including edge cases and error paths. A behavior change has a test that fails on the old code. A bug fix has a regression test.
2. **Security.** Use the blocker list below. A security gap is never "minor".
3. **Contracts.** Nothing in `BACKWARD_COMPATIBILITY.md` breaks without the path that file requires.
4. **Architecture and conventions.** Package boundaries, the domain-concept layout and the shared API/UI layers are used as `AGENTS.md` describes.
5. **Maintainability.** One responsibility per file, no dead or commented-out code, no magic numbers, and a diff limited to the PR's goal.

## Blockers (severity: blocker)

- **Authentication on the server.** Every non-public route goes through `apiHandler` with `auth: "session"` (default) or a role. `auth: "public"` needs a reason.
- **Record-level authorization.** Mutations call `assertOwns` (or an equivalent ownership check). Checking only that the user is logged in is a blocker. Access-decision errors deny access (fail closed).
- **Check-then-write races.** A shared resource (a free slot, a booking status, a unique e-mail) is protected by a DB constraint (`isUniqueConstraintViolation` from `@devmentor/db`) or a transaction in the service. Reading first and then writing is not enough.
- **Input only through zod.** Routes use `parseBody(request, schema)`, and services receive only the parsed result. No mass assignment from the raw body.
- **Secrets.** No passwords, hashes, tokens or cookies in logs, responses, errors or test fixtures. New sensitive fields are added to the redaction list in `packages/core/src/logger.ts`. Columns like `passwordHash` are marked `.hidden()`, and services return DTOs, not entities.
- **Queries.** Only MikroORM's entity API or query builder. No raw SQL built from user input, and no unparameterized input in paths or shell commands.
- **Money.** The server computes prices. A value from the client is never saved without being recalculated.
- **Coverage.** `npm run test` stays at 100% lines, branches, functions and statements. Any new `v8 ignore` / `istanbul ignore` comment or new `vitest.config.ts` exclusion is a blocker.

## Major

- Session cookie flags stay as they are when auth changes: `httpOnly`, `secure` in production, `SameSite=Lax`, `Path=/`, 24 h JWT HS256 with no refresh.
- Login, registration and password-reset endpoints keep `authRateLimiter`. Their messages don't reveal whether an e-mail is registered.
- State-changing requests keep the CSRF check (`X-Requested-With: devmentor`, enforced by `apiHandler`).
- A security fix comes with a regression test.
- Race-sensitive flows (booking, rescheduling) have an integration test for the concurrent case in `packages/core/integration/`.
- Schema changes come as a committed MikroORM migration in `packages/db/src/migrations/`. A migration already on `main` is never edited.

## Repo-specific checks

- **Package boundaries:** `app → core → db` and `app → ui`. No `@devmentor/db`, `@mikro-orm/*` or `awilix` in `app`. No `next`/`react` in `core`. `ui` and `db` import no other `@devmentor/*` package. Imports go through `exports` only, never `../../packages/x/src`. Disabling the `no-restricted-imports` ESLint rule is a blocker.
- **Client-safe validators:** `@devmentor/core/validators/*` imports only `zod` and other validators.
- **Routes:** `packages/app/src/app/api/**/route.ts` is configuration. It uses `makeCrudRoute` for plain CRUD and `apiHandler` otherwise, with no `try/catch` and no hand-written `Response.json`/`NextResponse.json`. DB-backed routes, pages and layouts export `dynamic = "force-dynamic"`.
- **Services:** `packages/core/src/services/<concept>/<name>.service.ts` takes dependencies through the constructor (`InjectionMode.PROXY`), never imports the container, and throws only `AppError` subclasses from `core/src/http/errors.ts`.
- **DI:** every new dependency is one `register` line in `core/src/container/container.ts` plus one `Cradle` field. No `loadModules` and no `container.resolve()` deep inside logic.
- **Entities:** defined with `defineEntity`, `...baseProperties`, registered in `packages/db/src/entities/index.ts`, and calling `pinEntityName` before `setClass`.
- **Events:** named `concept.entity.action` (past tense), declared in `core/src/events/event-map.ts` and emitted via `eventBus` after a successful write.
- **Env:** every new variable goes into the zod schema in `core/src/config/env.ts` and into `.env.example`. Only the root `.env` is used.
- **UI:** `fetch('/api/*')` only through `apiCall`/`apiCallOrThrow`. Forms use `CrudForm`, lists use `DataTable`, and loading/error/empty states use `LoadingMessage`/`ErrorMessage`/`EmptyState`. Admin pages use shadcn/ui primitives from `packages/ui/src/components/ui/` (added via the CLI, never copied by hand). Public pages use Tailwind only. A button-looking link is `<Link className={buttonVariants()}>`. Server Components are the default, and data-fetching server components sit inside `<Suspense>`.
- **Logging:** the `logger` from the container only. No `console.log` and no empty `catch`.
- **Process:** non-trivial changes have a non-draft spec in `.ai/specs/`. Autonomous runs have a log in `.ai/runs/`. A non-obvious bug or trap has a lesson in `.ai/lessons/` plus a line in `.ai/lessons.md`. A deviation from the spec is first recorded in the spec's "Decyzje i zmiany" section.

## Validation gate

The PR must pass, in order: `npm run lint`, `npm run typecheck`, `npm run audit`, `npm run test`, `npm run build`, `npm run test:integration`, `npm run test:e2e` (see `.ai/agentic.config.json`). A red CI run is a blocker finding, reported together with the rest of the review.

## Severity guidance

| Severity | Meaning | Effect |
|---|---|---|
| blocker | Security gap, data loss or corruption, broken contract, failing gate, coverage below 100% | `changes-requested`; must be fixed before merge |
| major | Wrong behavior in a realistic path, missing required test, architecture rule violated | `changes-requested` unless the author justifies it on the PR |
| minor | Readability, naming, small duplication, non-blocking convention drift | Comment only; may be a follow-up |
| nit | Taste | Optional; prefix with `nit:` |

Each finding names the file and line, the rule it breaks (cite `AGENTS.md`, a spec or this file), the consequence, and the fix.
