# Local development on Workers and D1

The migration branch uses Bun, Vite, local workerd, a SQLite-backed AppRuntime Durable Object and a persisted local D1 database. The object supplies compute; application data remains in D1. It does not require a PostgreSQL container. The former VPS/PostgreSQL workflow is retained in [the recovery reference](LOCAL_DEVELOPMENT_POSTGRESQL.md); its old package commands are historical.

## Setup

Install Node.js 22.12+ (for the Cloudflare/Vite toolchain), Bun and Git on macOS or Windows, then run:

```sh
bun install --frozen-lockfile
bun run setup
bun run dev:local
```

Open http://localhost:3000. Setup preserves existing `.env` and `.dev.vars` files. If `.dev.vars` is absent it copies the example and generates a random auth secret, applies checked-in D1 migrations, and syncs the editorial catalog/achievements into local D1. It never copies production data or configures remote bindings. Optional integrations can be added to the ignored local file using `.dev.vars.example`.

The local app uses http://localhost:3000 as its auth origin. Keep that origin consistent when signing in. Mail delivery is disabled only for local/test mode; local verification is off. Use isolated testing credentials when enabling email or Google OAuth locally. Production secrets belong in Wrangler, not a local test configuration.

## Daily commands

```sh
bun run dev:local       # app + local workerd/D1; Ctrl-C stops the process
bun run db:migrate      # apply local D1 migrations
bun run db:sync         # update local editorial metadata and fixtures
bun run db:generate     # generate reviewed D1 schema changes
bun run build          # build Worker/client/static assets
bun run preview        # preview the existing build
```

The normal local database lives under ignored `.wrangler/state/v3`. Stopping dev preserves it. Do not delete that directory to fix an unrelated test: test runners own separate uniquely named state directories. `db:up` applies local migrations and `db:stop` explains how to stop the dev process; there is no persistent database daemon.

## Tests for the final candidate

```sh
bun run lint
bun run typecheck
bun run test:unit
bun run test:integration
bunx playwright install chromium
bun run test:e2e
```

Integration and E2E runners each create a disposable D1 config/state under `.wrangler/test-runs`, apply migrations, and delete only their own directory afterward. The E2E runner chooses a free application port (override E2E_APP_PORT if needed), syncs content, starts a test-mode Worker, seeds synthetic users/progress, and passes a per-run secret to support APIs. No Docker/Podman service or database port is needed. Use the runner rather than invoking support endpoints against the normal local app.

`bun run test:ci` combines lint/typecheck/unit/D1 integration/build; E2E remains an explicit separate run. The migration owner will run E2E locally before release. See [operations](CLOUDFLARE_OPERATIONS.md), [data transfer](CLOUDFLARE_DATA.md), and [cutover](CLOUDFLARE_CUTOVER.md) for the remaining release gates.

## Troubleshooting

- Missing auth secret: run setup or add a sufficiently long random BETTER_AUTH_SECRET to `.dev.vars`.
- Missing table: apply local migrations before syncing or starting features that read D1.
- Test support API returns 403: normal local mode intentionally denies it; use the disposable E2E runner.
- Email is unavailable: choose/configure an HTTP transport for preview/production. Disabled email is allowed only locally/in tests.
- Wrong deploy environment: rebuild with cf:build:preview or cf:build:production; the deploy wrapper rejects mismatched artifacts.
- Preserve `.env`, PostgreSQL volumes and recovery files while migrating; do not remove the old infrastructure until post-cutover sign-off.

## Compute and CLI data bindings

Vite and the disposable HTTP/E2E app use the same AppRuntime forwarding boundary as preview. The Worker handles security/maintenance/assets; dynamic Start requests run in the object. Local-only data scripts use a D1/vars proxy without object declarations, because Wrangler’s platform proxy does not execute the application class. Its exclusive mode-0600 temporary config stays beside the original to preserve relative paths and `.dev.vars`, then is removed after startup. The original config and secrets are never rewritten. The ignored filename pattern covers interrupted cleanup.
