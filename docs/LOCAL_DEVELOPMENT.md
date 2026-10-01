# Local development on macOS and Windows

Use Bun for the application and Docker Desktop for PostgreSQL 15. Both platforms
use the same commands and Compose configuration. On Apple Silicon, Docker selects
the image architecture automatically.

## Prerequisites

- Install [Bun](https://bun.sh/) and Git; ensure `bun` is on your PATH.
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
  On Windows, enable its WSL 2 backend. On macOS, choose the download for your chip.
- Start Docker Desktop and wait until `docker info` succeeds.

## First-time setup

From a cloned repository, run these commands in Terminal or PowerShell:

```sh
bun install
bun run setup
bun run dev:local
```

`setup` creates `.env` from `.env.example` only if it is missing, generates an auth
secret for that new file, starts PostgreSQL, waits for readiness, applies checked-in
migrations, and syncs tutorials, challenges, and achievements. Existing `.env`
files are preserved; replace the placeholder auth secret yourself if you copied
the example previously. Run setup again after pulling migrations or content changes.

`dev:local` starts the database if needed, then runs Vite at
[http://localhost:3000](http://localhost:3000). It does not rerun migrations or sync.
Stop the app with Ctrl+C. The database stays running for the next session.

## Database control

```sh
bun run db:up
bun run db:stop
```

Stopping preserves the named volume and your local accounts/progress. Each machine
has its own data. The helpers explicitly use `docker-compose.yml`, start only
`postgres`, and use the Compose connection:

```env
DATABASE_URL="postgresql://twe_user:twe_password@localhost:5432/twe_db"
```

The database ports bind to loopback only. Local PostgreSQL uses the image defaults;
production tuning belongs in the production configuration.

These commands require that connection and an unset `DIRECT_URL`, so setup cannot
accidentally migrate another database. They set `NODE_ENV=development`, clear
`TEST_DATABASE_URL`, and use `BETTER_AUTH_URL=http://localhost:3000` for child
processes. For a custom/native/remote database, configure `.env` and use the manual
commands (`bun run db:migrate`, `bun run db:sync`, `bun run dev`).

Email verification is disabled in the example. Google OAuth, email, analytics, and
AI provider credentials are optional for basic development; configure them when
testing those features. Never copy production database settings into local setup.

## Testing

```sh
bun run test:unit
bun run test:ci
bun run test:e2e
```

Unit tests need no database. `test:ci` manages the integration database on port 5433
and runs the CI checks. E2E uses its own disposable container and requires an active
container engine; it does not use or delete your development volume.

## Podman alternative

Docker Desktop is the documented default. Existing Podman users can use these
helpers if `podman compose` supports `up --wait`. Start the Podman machine first,
then set `LOCAL_CONTAINER_RUNTIME=podman` in `.env`. For E2E/CI, use the separate
`E2E_CONTAINER_RUNTIME=podman` setting. The helpers do not install a Compose provider
or start the container engine for you.

## Troubleshooting

- **`bun` not found:** restart your terminal after installation and check PATH.
- **Engine unavailable:** open Docker Desktop and check `docker info`.
- **Port 5432 occupied:** stop the other local PostgreSQL instance or use a custom
  database with the manual workflow.
- **Password authentication failed:** an existing volume may have been initialized
  with different credentials. Restore the original settings or migrate your data;
  changing Compose environment values does not change an existing DB password.
- **Custom database rejected:** restore the example local URL and unset `DIRECT_URL`,
  or use the manual workflow intentionally.
- **Missing tables/content:** run `bun run setup` again after pulling updates.
