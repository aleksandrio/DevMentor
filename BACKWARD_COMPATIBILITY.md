# Backward compatibility

This file lists the surfaces DevMentor treats as **protected contracts** and the path a change to each must follow. Review skills check diffs against it, and implementation skills warn when a change doesn't comply. DevMentor is pre-1.0 MVP software with no external API consumers yet. Its contracts are mostly between its own packages, between the deployed app and its database, and between the server and logged-in browsers. Breaking one is allowed, but it has to be deliberate: done through a spec, called out in the PR and handled with the path below.

A PR that breaks any surface here carries `risk-high`, is marked 💥 in its body, and names the affected surface.

## Surfaces

### HTTP API (`packages/app/src/app/api/**/route.ts`)

Current routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/health`, `GET /api/users` (admin).

- **Response envelope:** `{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`. It is declared separately in `packages/core/src/http` and `packages/ui/src/backend/api` and must stay identical in both.
- **Breaking:** removing or renaming a route, method or response field, changing a field's type or meaning, making an optional request field required, changing status codes or `error.code` values that clients branch on, or changing the envelope.
- **Not breaking:** adding routes, optional request fields or response fields.
- **Path:** a spec that names the change. Change server and client in the same PR (`apiCall` users, `CrudForm`/`DataTable` configs, e2e and integration tests). Any envelope change updates both declarations together.

### Auth and session contract

- Cookie `devmentor_session` (`SESSION_COOKIE` in `core/src/http/auth.ts`): JWT HS256 signed with `AUTH_SECRET`, `httpOnly`, `secure` in production, `SameSite=Lax`, `Path=/`, valid for 24 h, with the role in the token. CSRF header: `X-Requested-With: devmentor`.
- **Breaking:** renaming the cookie, changing the token claims or algorithm, changing the CSRF header name or value, or rotating `AUTH_SECRET`. Each of these logs out every user or rejects requests from open tabs.
- **Path:** a spec, plus a PR note saying all sessions will be invalidated. Change the client (`apiCall`) in the same PR. Weakening the cookie flags or extending validity is never acceptable without a security spec.

### Database schema (`packages/db/src/migrations/`, `packages/db/src/entities/`)

- Migrations are append-only. **Never edit a migration that is on `main`.** Fix it with a new migration.
- **Breaking:** dropping or renaming a table or column, narrowing a type, or adding `NOT NULL` without a default to a populated table.
- **Path:** expand-and-contract. Add the new shape, migrate the data, switch the code, and drop the old shape in a later migration. The PR includes a rollback plan (`down` or the manual steps) and runs `npm run test:integration` against the migrated schema.

### Environment configuration (`packages/core/src/config/env.ts`, `.env.example`)

Variables: `NODE_ENV`, `DATABASE_URL`, `LOG_LEVEL`, `AUTH_SECRET`.

- **Breaking:** renaming or removing a variable, making an optional one required, or tightening validation so that existing values fail.
- **Path:** update the zod schema and `.env.example` in the same PR, and put the change in the PR body so whoever runs the app can update their `.env` (and the CI env in `.github/workflows/ci.yml`).

### Domain events (`packages/core/src/events/event-map.ts`)

Current: `auth.user.registered` → `{ userId, role }`.

- **Breaking:** renaming an event, or removing or retyping a payload field that subscribers in `core/src/events/subscribers.ts` read.
- **Path:** add the new event or field first, migrate subscribers, then remove the old one. Events are in-process only, so one PR may do all three steps if every subscriber is updated in it.

### Package entry points (`exports` in `packages/*/package.json`)

- `@devmentor/core` (`.`, `./validators/*`), `@devmentor/db` (`.`), and `@devmentor/ui` (`./components/*`, `./backend/*`, `./backend/api/*`, `./lib/*`, `./hooks/*`, `./globals.css`).
- These are internal to the monorepo, so a breaking change is acceptable when every consumer is updated in the same PR and `npm run typecheck` passes.
- **Breaking in a way that needs a spec:** changing the dependency direction (`app → core → db`, `app → ui`), adding a package, or making `@devmentor/core/validators/*` no longer client-safe.

### CLI scripts (root `package.json`)

- `npm run setup`, `npm run db:migrate`, `db:migration:create -- --name`, `db:migration:list`, `db:migration:pending`, `db:user:promote -- --email`, `app:ephemeral`, and the validation scripts (`lint`, `typecheck`, `test`, `build`, `audit`, `test:integration`, `test:e2e`).
- **Breaking:** renaming or removing a script or flag that `AGENTS.md`, CI, `.ai/agentic.config.json` or `SDLC.md` refers to.
- **Path:** update every reference in the same PR. For a validation command, update the config and `SDLC.md` together.

### Public URLs (pages)

Current: `/`, `/login`, `/register`, `/admin`, `/admin/users`.

- **Breaking:** removing or moving a public page (`(marketing)`, `(auth)`, later `(student)`/`(mentor)`) without a redirect.
- **Path:** add a redirect in the same PR. Admin URLs may move freely.

## What is not protected

Internal service methods, component props inside `packages/app`, file layout under `src/` (as long as the `AGENTS.md` conventions are followed), test helpers in `test/`, and log message text.
