# Cloudflare runtime and deployment

The app uses Static Assets, a thin Worker gateway, one SQLite-backed `AppRuntime` Durable Object for dynamic TanStack Start requests, and D1 for application data. The object supplies compute; D1 remains authoritative. Keep the fixed `application` object name and account for gateway and object quotas separately. Adding object storage, timers or per-user objects requires a new capacity and recovery design.

## Environments

`wrangler.jsonc` defines isolated local, preview and production bindings. Build the target before deployment: a later `--env` flag cannot change the database embedded in an artifact. Preview requires Basic authentication, uses synthetic data and sends private/noindex responses. Production custom domains may be managed in the Cloudflare dashboard separately from the checked-in configuration.

```sh
bun run setup
bun run dev:local
bun run cf:build:preview
bun run cf:deploy
```

See [local development](LOCAL_DEVELOPMENT.md) for persistent local state and disposable test runners. The PostgreSQL helpers under `src/db/legacy/` and `scripts/migration/` are recovery tools, not runtime dependencies. The former VPS deployment workflows are archived under `.github/legacy-vps/`.

## Configuration

Keep runtime secrets in Wrangler and local secrets in ignored `.dev.vars`. Never use a `VITE_` variable for a secret. Build/dev bindings disable the legacy `.env` fallback and inherited process-variable fallback.

| Settings                                               | Purpose                                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                | Auth signing secret and canonical origin; preserve existing production values when updating the app                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`             | Separate Web OAuth clients per environment, with exact `/api/auth/callback/google` redirects and identity scopes only |
| `EMAIL_PROVIDER`, `EMAIL_FROM`                         | Select `smtp`, `http` or `resend`; `disabled` is local/test-only                                                      |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP uses implicit TLS on port 465; sender must match the authenticated mailbox                                       |
| `EMAIL_HTTP_URL`, `EMAIL_API_KEY`                      | HTTP delivery uses HTTPS, Bearer auth and JSON `{from,to,subject,html,text?,replyTo?}`; no redirects/retries          |
| `ADMIN_EMAIL`                                          | Notification destination                                                                                              |
| `GH_API_TOKEN`, `GH_OWNER`, `GH_REPO`                  | Restricted private bug-intake repository; delivery verifies private visibility before posting                         |
| `DEEPSEEK_API_KEY`, `AI_HINT_DAILY_LIMIT`              | Bounded hint generation with a shared atomic D1 cap; missing cap disables new generation                              |
| `PREVIEW_ACCESS_TOKEN`                                 | Preview Basic password, at least 32 random characters; username `preview`                                             |
| `MAINTENANCE_MODE`                                     | `true` rejects application requests with 503, including session reads that can write                                  |
| `VITE_GA_MEASUREMENT_ID`                               | Optional public analytics identifier                                                                                  |

Email, GitHub and AI work is bounded and awaited. Provider errors must not expose request content or credentials. Workers Logs uses sanitized scopes/correlation IDs; client Sentry remains consent-controlled. Avoid recording request bodies, cookies, auth headers or database exports in diagnostics.

## Release and rollback

PRs to `main` run quality/build, unit, disposable D1 integration and E2E checks. Deployments are manual; merging does not deploy. The candidate workflow requires the reviewed full SHA, isolated environment credentials and explicit production approval. Its production branch guard currently requires `release/cloudflare-migration`.

```sh
bun run cf:build:production
# After review, set TWE_RELEASE_APPROVED_SHA to HEAD and
# TWE_ALLOW_PRODUCTION_DEPLOY=yes, then:
bun --no-env-file scripts/deploy-cloudflare.ts production
```

The wrapper verifies Worker name, environment, D1 binding, AppRuntime migration, email transport and required secret names. Existing deployments inherit stored secrets. First deployments may pass an absolute private JSON settings file as the third argument; it must be mode 0600 outside the checkout. Include `MAINTENANCE_MODE=true` while preparing a new production target, retain an independent secret-store copy and remove the temporary file after use. Do not put secret values in command arguments.

Apply reviewed additive D1 migrations before the matching application. Keep AppRuntime exported and bound after class creation. A Worker rollback changes code only; it cannot undo schema changes or reconcile new D1 writes. Restoring an older PostgreSQL snapshot or changing DNS requires a separate write-freeze and reconciliation plan.

HTTP maintenance and the database write freeze are separate controls. `scripts/migration/freeze-d1.ts` blocks core/support writes at the database boundary, including admitted requests; it must be verified before an export/recovery operation. Restore into an empty isolated target first and verify complete rows, integrity, roles, provider links and progress before considering live replacement.

## Monitoring and recovery

Inspect gateway CPU failures/5xx, object CPU/memory/duration, D1 errors/row usage/storage, auth failures, integration failures and private backup freshness. Budget all production, preview and probe workloads together. Keep hosting on Free and treat exhausted quotas as availability incidents; no Paid fallback is configured by this operating model.

Independent encrypted recovery runs in a private repository. The public backup workflow only hands off to that vault and has no export credentials. See [backup tooling](CLOUDFLARE_BACKUPS.md) and [D1 data invariants](CLOUDFLARE_D1.md). Owner account inventories, credential locations, migration plans, cutover records and validation reports are kept in the owner's local operations reference rather than this public repository.
