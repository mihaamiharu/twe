# Workers/D1 development and operations

This is the release-branch operating model. Source preparation is distinct from verified release readiness. Production DNS still targets the VPS Tunnel; no migration deployment/cutover has been authorized by a successful local test yet.

## Resources

| Environment          | Worker         | D1 database                          | Current state                                                                        |
| -------------------- | -------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| Local                | twe-local      | local Wrangler state                 | Created by local setup                                                               |
| Preview              | twe-preview    | a57397b4-3f7f-432e-a161-04330b3a5b4b | All three migrations applied in APAC; protected Worker deployed; synthetic data only |
| Production candidate | twe-production | 6f6630be-ed32-4d07-ba24-24d45bb160c9 | Created in APAC; migrations pending; no app/user rows or domain attached             |

Do not use the event-booking-platform `ebp-r1` resources or the separate synthetic migration spike as the full application's database. Read replication remains disabled. The production custom-domain route is intentionally absent until cutover. Root `cf:*` commands now target the full app; `cf:spike:*` retains the original isolated fixture.

## Local workflow

```sh
bun install --frozen-lockfile
bun run setup       # preserves .env/.dev.vars; creates local D1 and editorial data
bun run dev:local   # Vite + local workerd/D1 on port 3000
```

No PostgreSQL, Docker or Podman service is required for the migrated app. The old PostgreSQL helpers remain recovery tooling. Never point test tooling at the normal local or remote dataset.

`bun run test:integration` provisions a private, disposable local D1 configuration/state, applies migrations, runs the integration suite, then removes only that sandbox. `bun run test:e2e` uses its own independent D1 sandbox, synthetic users, secret-gated support APIs and Playwright. The owner will run E2E locally before release. Test endpoints require APP_ENV=test and the run-specific secret; NODE_ENV alone does not open them.

The final candidate should run lint, typecheck, unit/D1 integration checks and a production build together after implementation, followed by the owner's local E2E and preview resource/feature checks. No implementation issue is closed merely because its source files exist.

## Configuration and credentials

Local secrets live in ignored `.dev.vars`; environment-specific `.dev.vars.preview`/`.dev.vars.production` must contain their own complete secrets. Runtime secrets belong to Wrangler, never VITE\_ variables, source manifests, GitHub issues or exported logs.

- BETTER_AUTH_SECRET and BETTER_AUTH_URL: retain the production secret/origin for session compatibility; use isolated preview values.
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: preserve production Google linkage. Add the isolated preview callback separately rather than replacing the production callback.
- EMAIL_PROVIDER / EMAIL_FROM: selected preview/production-candidate transport is Spacemail SMTP. SMTP_HOST / SMTP_PORT are configuration; SMTP_USER / SMTP_PASSWORD are Worker secrets. HTTP transports retain EMAIL_HTTP_URL / EMAIL_API_KEY.
- ADMIN_EMAIL: notification destination.
- DEEPSEEK_API_KEY: existing HTTP AI integration, with bounded timeout and retries disabled.
- GH_API_TOKEN / GH_OWNER / GH_REPO: bug-report issue integration, with timeout and awaited completion.
- PREVIEW_ACCESS_TOKEN: at least 32 random characters; Basic username is preview. Preview fails closed if absent, protects static assets too, and sends noindex/private headers.
- VITE_GA_MEASUREMENT_ID: optional public analytics identifier returned only as configured.
- MAINTENANCE_MODE=true: every application request returns 503, including session reads that might refresh auth data. Static production assets may still bypass the Worker.

The Worker supports nodejs_compat only for supported libraries/APIs. Runtime OG layout/PNG use workerd-selected WASM implementations; native Bun/build and legacy PostgreSQL modules must be absent from the final Worker graph.

## Existing Spacemail delivery

On November 1 the owner selected the existing provider and admin@testingwithekki.com. The inventoried VPS already uses Spacemail at mail.spacemail.com:465 with implicit TLS. EMAIL_PROVIDER=smtp uses Workers outbound TLS sockets directly; it adds no VPS relay, external gateway or new mail-provider subscription. Local/test delivery remains disabled by default. The checked-in production candidate selects this transport, but no production Worker configuration or VPS service was changed.

The adapter accepts only port 465 with TLS from connection start, requires the sender to match the authenticated mailbox, bounds message/reply size and the entire exchange to 20 seconds, and closes its request-owned socket in finally. It encodes UTF-8 MIME, rejects header/envelope injection, redacts provider errors and performs no automatic retry after an uncertain DATA outcome. No connection pooling, timers or persistent sockets remain in AppRuntime; open sockets would otherwise extend object-active duration. SMTP_HOST/SMTP_PORT are trusted operator configuration, never request inputs.

One explicitly authorized, clearly labeled email from/to the owner's admin mailbox was accepted by Spacemail from an isolated hosted Cloudflare object in 2,174 ms. Durable state recorded the single send attempt; no second message occurred. SMTP acceptance does not prove inbox arrival. See [the sanitized report](reports/cloudflare-spacemail-20261101.json); real verification/reset flows and inbox/spam confirmation remain release checks.

The retained `EMAIL_PROVIDER=http` contract POSTs JSON `{from,to,subject,html,text?,replyTo?}` to the configured HTTPS EMAIL_HTTP_URL with Bearer EMAIL_API_KEY. It follows no redirects, waits up to 20 seconds and accepts only a successful HTTP status. A vendor with a different contract needs an adapter or a gateway exposing this contract. An optional `resend` adapter remains available. `disabled` delivery is accepted only in local/test environments and does not print mail contents or tokens.

Verification/reset/newsletter delivery is awaited and reports failure. Pending newsletter rows permit a later retry/resend. Optional contact/bug notifications are awaited within the request lifecycle but their failure does not undo the saved submission. There are no untracked mail/GitHub promises. Delivery acceptance is not proof that mail arrived; perform inbox/spam/failure checks before release.

## Abuse controls and diagnostics

Contact and bug reports retain 3 requests/hour, newsletter 5/hour, anchored at the first accepted request. D1's conditional UPSERT enforces a strict shared window rather than an eventually consistent approximate counter. Verification resend keeps one request/minute per normalized-email HMAC key. Public Better Auth endpoints retain its default 10-second inactivity window (3 sensitive requests, 100 otherwise) through an atomic D1 wrapper rather than isolate memory.

Authenticated keys use user IDs; anonymous deployed requests use only Cloudflare's CF-Connecting-IP, HMACed with the app secret. Arbitrary X-Forwarded-For/X-Real-IP values are ignored. Missing deployed client identity fails closed; local/test requests use their own isolated local bucket. A scheduled Worker cleans expired buckets daily; the schema indexes expiry.

Workers Logs replaces @sentry/bun. Server logger output contains level/scope rather than objects, private user strings or upstream error payloads; request failures have random correlation IDs. Client Sentry remains consent-controlled. Do not enable automatic request-header/body logging or upload snapshots as diagnostics. Inspect CPU exceeded errors, Worker 5xx, D1 errors/row usage/storage, auth failures, email failures and backup failures daily during rollout, then weekly. Treat any integrity discrepancy, repeated CPU exhaustion or sustained auth failure as a release/rollback incident.

Free remains conditional: the gateway must fit its 10 ms CPU ceiling, with a target p99 below 8 ms and no exceeded-CPU failures. Dynamic SSR/auth/OG now execute in a SQLite-backed AppRuntime object and require separate CPU, duration, memory and account-wide quota acceptance. Measure password hashing and arbitrary OG generation explicitly. Record D1 query/row usage against the current plan limits and retain headroom. The owner has now required strict $0 and deferred cutover; Workers Paid and external paid overages are not an available fallback. See CLOUDFLARE_FREE_ARCHITECTURE.md for the compute redesign and its evidence gates.

## Build/deploy ordering

CI, deployment and backup workflows explicitly install Node 22 and Bun 1.4.2 rather than depending on the runner’s default Node. The build wrapper supplies a 4 GiB Node build heap unless NODE_OPTIONS already specifies a heap size; this does not change Worker runtime budgets. Select the environment at build time with CLOUDFLARE_ENV. The Vite plugin emits a resolved deploy configuration; passing --env to a later deploy does not choose another artifact.

```sh
bun run cf:build:preview
bun run cf:deploy
# Empty preview only; saves synthetic learner/admin credentials privately.
bun run cf:preview:seed /absolute/private/new-accounts.json
# Uses private JSON files containing PREVIEW_ACCESS_TOKEN and synthetic accounts.
bun run cf:smoke:preview /absolute/private/secrets.json /absolute/private/new-accounts.json /absolute/private/new-smoke-report.json
```

The deploy wrapper checks the built Worker name/environment/database and required remote secret names. Both targets require the selected transport’s secret names; SMTP requires SMTP_USER/SMTP_PASSWORD/EMAIL_FROM, while HTTP requires EMAIL_API_KEY/EMAIL_FROM. Production validates its TLS/HTTPS transport configuration before deployment. Production additionally requires TWE_RELEASE_APPROVED_SHA equal to HEAD and TWE_ALLOW_PRODUCTION_DEPLOY=yes. The manual GitHub workflow validates the pinned candidate, uses isolated GitHub environments, builds the selected target, applies additive migrations, and deploys that artifact. Configure required reviewers on cloudflare-production before enabling production credentials. Use a scoped deploy token; the workflow's GITHUB_TOKEN has only contents:read.

The legacy VPS workflows are archived under `.github/legacy-vps/`; merging the migration no longer automatically deploys a Worker build into a VPS container. CI still validates main/PRs. Release-branch pushes do not execute those suites. Incompatible future schema changes need an expand/contract release plan; a Worker version rollback cannot undo D1 schema or data changes. A migration failure must stop deployment; a deployment failure leaves the prior Worker against a backward-compatible schema.

## Backup and recovery

Owner: mihaamiharu. Proposed operational targets: RPO <=24 hours and RTO <=60 minutes, subject to measured rehearsal and explicit release sign-off. Cloudflare Free currently provides seven days of D1 Time Travel; this is a recovery window, not an independent long-term backup.

`backup-cloudflare.yml` writes a daily AES-256-GCM encrypted SQL export with 30-day artifact retention once TWE_BACKUPS_ENABLED=true is set after rehearsal. It uses a separate cloudflare-backups GitHub environment, D1-read-only token and TWE_BACKUP_KEY. Store the 32-byte base64 recovery key independently of GitHub and the encrypted archives. No plaintext SQL is uploaded. Backup failure must be visible in Actions notifications; do not mute it. The scheduled workflow is inert until enabled.

```sh
# Keep the recovery key in a password manager/secret store, not command history.
bun scripts/backup-d1.ts backup preview /absolute/private/preview.enc
bun scripts/backup-d1.ts decrypt /absolute/private/preview.enc /absolute/private/restore.sql
```

TWE_BACKUP_KEY must be available securely in the process environment. Plain SQL is created only in a mode-0700 temporary directory and removed after encryption. Decryption writes exclusively outside the checkout. Restore into a newly identified isolated D1 database; inspect the SQL's schema/history content before applying it, avoid applying CREATE statements over an already migrated target, then perform complete row/integrity and application checks. The schema-only preview export/decrypt/local restore and preview Time Travel marker rehearsal passed on October 30; see CLOUDFLARE_READINESS.md. Repeat with representative approved data/timing and independently held recovery keys before release. Never restore the live database without a write freeze and an approved data reconciliation plan.

References: [Cloudflare Vite environments](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

## Preview access handoff

The full-app preview is https://twe-preview.ekkisyam2310.workers.dev. Basic username is `preview`; the generated token and synthetic account credentials are retained outside git in the operator’s restricted private-artifacts directory. Retrieve them locally rather than pasting credentials into issues, logs or source. Synthetic learner/admin credentials are preverified; the HTTP smoke does not trigger real email. The SMTP test has separate explicit owner authorization. The seed command refuses a populated preview, reconciles all application tables and cannot select production. The HTTP smoke checks access/noindex/private caching, assets/OG, support-API denial, credential login/session/cookie flags, roles/admin access and logout; it does not replace the owner’s Playwright/browser release run.

## AppRuntime compute boundary

The source exports AppRuntime; the namespace binding has the same name in local/preview/production. The `app-runtime-v1` SQLite class migration is applied by Worker deployment, separately from D1 schema migrations. One fixed `application` object is APAC-hinted. Do not derive object IDs from users or requests, add timers/alarms, or start storing business data in its SQLite storage without a reviewed quota/recovery design. D1 remains authoritative.

Preview, local HTTP and the owner’s later local E2E exercise the boundary. CLI data scripts omit unused compute declarations from their platform proxy, preserving the same D1 state and private vars. Keep AppRuntime exported/bound when rolling code back after class creation; removing a class or deleting a namespace is a separate reviewed migration. A version rollback does not reconcile D1 writes. Gateway and object errors are caught independently before platform logging.

Before release, confirm the account is actually on Free and budget all active production/preview/probe objects together. Do not keep probe/preview workloads active indefinitely. Duration is object-active time; tail request wall time is insufficient billed-duration evidence. Review quotas/availability and failure behavior, rather than inferring $0 from a short CPU sample. No Paid fallback or account downgrade is automatic. The dashboard lookup required login, and the limited CLI token could not read subscription state.
