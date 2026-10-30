# Cloudflare migration plan and initial inventory

Tracking issue: [#245](https://github.com/mihaamiharu/twe/issues/245).
Initial inventory: [#248](https://github.com/mihaamiharu/twe/issues/248).
Reviewed on October 30, 2026.

## Execution agreement

- Work through the linked implementation issues in dependency order.
- Keep the VPS serving production until the migration is ready for cutover.
- Consolidate test execution into [#256](https://github.com/mihaamiharu/twe/issues/256), before release. Do not repeatedly run unit, integration, E2E, lint, typecheck, or build checks during each inventory or implementation step.
- Record unverified behavior honestly. Implementation progress does not establish release readiness.
- Preserve the April 2027 cutover target and require explicit sign-off before VPS retirement.

## Verified existing setup

The signed-in Cloudflare dashboard and repository were inspected without changing cloud resources, DNS, routes, bindings, or credentials.

| Concern | Observed configuration | Migration implication |
| --- | --- | --- |
| Production domain | `testingwithekki.com` is proxied through the `twe-prod` Cloudflare Tunnel | Keep current routing until cutover |
| Tunnel | `cloudflared`, healthy, one active replica at inspection | Existing TWE production ingress; it still needs a running origin |
| `www` | Proxied CNAME to `testingwithekki.com` | Preserve the intended hostname/redirect behavior |
| Inbound email | SpaceMail MX records, SPF and DKIM | Preserve mail DNS; inbound mail is separate from the application's outbound SMTP migration |
| Existing Worker | `ebp-r1`, manually deployed through Wrangler, `ASSETS` and `DB` bindings | Separate event-booking project; do not repurpose |
| Worker routing | `ebp-r1` has no enabled URLs, custom domains, or routes | It is not the Worker serving the TWE domain |
| Existing D1 | `ebp-r1-prod`, dashboard reports zero tables and approximately 200.7 kB | Separate project's resource; apparent inactivity does not authorize deletion or reuse |
| Initial resource inventory | Before migration work, the dashboard listed one Worker and one D1 database in the inspected account | No pre-existing TWE-specific Worker/D1 deployment was identified |

The separate `event-booking-platform/worker/wrangler.jsonc` names `ebp-r1` and `ebp-r1-prod`; its database ID matches the dashboard binding. This identifies the existing resources as belonging to that project, rather than a previous TWE migration.

## Repository baseline

- Local base: `main` at `c0e0b18a8e6ff15a409feea43d178df1984a49b0` (PR #247).
- The working tree was clean at inspection. Work is on `codex/cloudflare-migration-baseline`.
- Bun version observed: `1.4.2`.
- The deployed client/server bundles contain release marker `c0e0b18`, matching this local base. The running image digest was recorded during inspection. Its OCI revision/source labels belong to the inherited Bun base image and must not be mistaken for the application's commit.
- Courses are absent from this base's routes and schema. Use the current main application as the initial inventory scope; revisit this if the course feature is selected for release before cutover.
- No TWE Wrangler configuration, Cloudflare Vite plugin, D1 binding, or Workers deployment workflow was found.
- `.wrangler` being ignored by git is not evidence of an existing TWE Worker deployment.

### Runtime and deployment

| Area | Current implementation | Owning issue |
| --- | --- | --- |
| Production runtime | `scripts/server.ts`: `Bun.serve`, compression and QA noindex behavior | #249, #250 |
| Build | `vite.config.ts`: TanStack Start/Vite without the Cloudflare adapter | #249 |
| Deployment | `.github/workflows/deploy-prod.yml`: GHCR image, SSH and Docker Compose on VPS | #255 |
| Production services | `docker-compose.prod.yml`: app, PostgreSQL 15 and `cloudflared` | #256, #257 |
| Database | `src/db/index.ts`: global postgres-js/Drizzle client; PostgreSQL Drizzle migrations | #251 |
| Authentication | `src/server/auth.server.ts`: Better Auth, PostgreSQL adapter, password/email and Google OAuth | #249, #251, #254 |
| Catalog | `src/server/content-catalog.server.ts`: filesystem reads of tutorials and challenges | #250 |
| OG images | `src/routes/api/og.ts`: filesystem asset, native Resvg renderer and font fetching | #250 |
| Rewards | `src/server/progress-rewards.ts` and `src/lib/stats.ts`: transactions and row locks | #252 |
| Email | `src/server/email.server.ts`: Nodemailer/SMTP | #254 |
| Rate limiting | `src/server/rate-limit.mw.ts`: process-local Map and cleanup timer | #254 |
| Telemetry | Bun Sentry entrypoint and middleware | #254, #255 |

### Product surfaces to preserve

- Localized public home, about, contact, labs, changelog and legal pages.
- Learn tutorials, Practice challenges, browser-based editor/executor and docs.
- Registration, verification, login/logout, forgotten/reset passwords, Google OAuth and profile.
- Submissions, progress, XP, levels, achievements and leaderboard.
- Newsletter subscription/confirmation, contact messages and bug reports.
- Admin users, tutorials, challenges, submissions, achievements, bugs, messages, newsletter and settings.
- Sitemap, robots, OG images, redirects, cookies and QA noindex behavior.
- Test-only API routes must retain their production-access restrictions.

### Schema inventory

The source schema declares 14 application/auth tables: `users`, `sessions`, `accounts`, `verification`, `tutorials`, `challenges`, `test_cases`, `submissions`, `progress`, `achievements`, `user_achievements`, `bug_reports`, `newsletter_subscribers`, and `contact_messages`.

It uses PostgreSQL enums, JSONB, text arrays, UUID defaults, timestamps and relational constraints. The PostgreSQL `tags` arrays on tutorials/challenges need an explicit SQLite representation as well as the JSONB fields.

### Production metadata collected October 30, 2026

SSH inspection confirmed the application deployment directory is `/home/deploy/apps/twe`. The running services are `twe-app`, `twe-postgres` and `twe-tunnel`; other projects' containers were left untouched.

The database queries ran in a read-only transaction with statement/lock timeouts. Only schema metadata, counts and migration checksums were collected; no user records, credentials, password hashes or session/token values were selected.

| Metadata | Observed value |
| --- | --- |
| PostgreSQL version | 15.17 |
| Source database size, including PostgreSQL overhead | 9,608,551 bytes (approximately 9.2 MiB) |
| Application/auth tables | 14 |
| Drizzle migration records | 6; every recorded hash matches the checked-in `0000` through `0005` SQL file |
| Installed extensions | `plpgsql` 1.0 |
| Sequences | Only the Drizzle migration ID sequence |
| Indexes | 31 across public and Drizzle schemas |
| Public-table constraints | 35, including the exactly-one-progress-target check and foreign-key delete rules |
| Timestamp representation | `timestamp without time zone`; the migration must define its interpretation explicitly |
| Container status | PostgreSQL healthy; application container running but reporting unhealthy |

The source size is not an estimate of final D1 storage or proof of quota/CPU feasibility. Counts were collected while production remained writable and must be recollected from the final consistent export during cutover.

| Table | Rows observed |
| --- | ---: |
| accounts | 33 |
| achievements | 20 |
| bug_reports | 1 |
| challenges | 109 |
| contact_messages | 1 |
| newsletter_subscribers | 1 |
| progress | 19 |
| sessions | 74 |
| submissions | 88 |
| test_cases | 72 |
| tutorials | 29 |
| user_achievements | 14 |
| users | 33 |
| verification | 5 |

The existing app health check is `wget --spider -q http://localhost:3000/ || exit 1` and its recorded executions fail. This reports container-health behavior, not a verified public-site outage. No health probe, restart or deployment change was performed during this audit; investigate the cause separately before release.

### Backup and recovery status

- The existing backup found in the deployment directory was dated May 7, 2026. No TWE backup job was identified in root/deploy crontabs or the system timers inspected. This does not rule out provider-side or other external backups.
- A new PostgreSQL custom-format dump was created on October 30, 2026 at 07:25:22 WIB (00:25:22 UTC), without pausing writes or restarting services.
- The archive is 111,372 bytes. PostgreSQL's archive-listing command succeeded and lists 15 table-data entries, including the migration ledger.
- Restricted copies exist on the VPS and this workstation, outside the repository. Backup files have mode `0600`, their directories have mode `0700`, and SHA-256 matched after transfer. Exact paths are kept with private recovery notes, not in GitHub.
- Archive readability and a matching checksum do not establish restorability. An isolated restore, relationship/count validation and measured recovery duration remain pending for #256, per the deferred-testing agreement.
- Define retention, a durable off-VPS backup destination, ongoing backup ownership, and recovery objectives before release. The workstation copy provides an additional copy but is not a managed backup service.

For the deferred restore rehearsal, use an isolated PostgreSQL 15 instance and a fresh disposable target database. Use `pg_restore --exit-on-error --no-owner --no-privileges` against that target, then validate counts, relationships and migration history. Never restore into the live production database as a rehearsal. Keep the source dump and restore logs restricted; publish only sanitized recovery results.

### Configuration inventory

Record names and purpose only; never copy values into this document or GitHub issues.

| Group | Names to map |
| --- | --- |
| Runtime | `NODE_ENV`, `PORT` |
| Database | `DATABASE_URL`, `DIRECT_URL`, `TEST_DATABASE_URL`, deployment `POSTGRES_*` |
| Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `REQUIRE_EMAIL_VERIFICATION`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Mail | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `ADMIN_EMAIL` |
| Integrations | `GH_API_TOKEN`, `GH_OWNER`, `GH_REPO`, `DEEPSEEK_API_KEY` |
| URLs/telemetry | `VITE_APP_URL`, `VITE_GA_MEASUREMENT_ID`, `VITE_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT` |
| Tunnel | `TUNNEL_TOKEN` |
| Local/testing | `E2E_*`, `CI`, `LOCAL_CONTAINER_RUNTIME`, `CURRICULUM_RESET_CONFIRM` |

## Delivery order

| Step | Issue | Next deliverable | Completion dependencies |
| --- | --- | --- | --- |
| 1 | [#248](https://github.com/mihaamiharu/twe/issues/248) | Finish inventory, identify production revision, collect safe DB metadata, verify backup/restore | None |
| 2 | [#249](https://github.com/mihaamiharu/twe/issues/249) | TWE-specific Workers/D1 preview configuration and feasibility decisions | Initial inventory from #248 |
| 3 | [#250](https://github.com/mihaamiharu/twe/issues/250) | Build-time content, assets, public-route strategy and compatible OG delivery | #249 |
| 4 | [#251](https://github.com/mihaamiharu/twe/issues/251) | D1 schema, migrations, typed bindings and auth persistence | #249 |
| 5 | [#252](https://github.com/mihaamiharu/twe/issues/252) | D1-compatible queries and atomic reward accounting | #249, #251 |
| 6 | [#253](https://github.com/mihaamiharu/twe/issues/253) | Export/transform/import tooling and reconciliation report | #248, #251, #252 |
| 7 | [#254](https://github.com/mihaamiharu/twe/issues/254) | Explicit email/limiter decisions and compatible integrations | #249 |
| 8 | [#255](https://github.com/mihaamiharu/twe/issues/255) | Deployment, security, observability and D1 recovery procedures | #250, #251, #252, #254 |
| 9 | [#256](https://github.com/mihaamiharu/twe/issues/256) | Consolidated release validation, rehearsal, cutover and at least one week of observation | #248–#255 |
| 10 | [#257](https://github.com/mihaamiharu/twe/issues/257) | Reviewed cleanup and VPS renewal cancellation | #256 and explicit retirement sign-off |

Dependencies describe integrated deliverables. With test execution deferred, a workstream's implementation can be recorded as ready for later verification; its unrun acceptance checks remain pending until #256.

## Remaining baseline work

- [x] Inspect local TWE configuration and the signed-in Cloudflare account.
- [x] Identify the existing Worker/D1 source and separate it from TWE.
- [x] Record local baseline, product surfaces, schema and runtime blockers.
- [x] Record the deployed artifact/release marker and current production schema scope; reassess any later feature additions before cutover.
- [x] Collect anonymized production database metadata without exposing records or secrets.
- [x] Create a current restricted production backup and a checksum-matched copy outside the VPS/repository.
- [ ] Exercise an isolated restore and validate the restored data during #256.
- [ ] Record maintenance-window and recovery objectives with the owner.
- [ ] Complete consolidated validation in #256 before production release.

Lint, typecheck and build completed before the owner requested deferring checks. The unit run was interrupted at that request; it is not a completed baseline. Integration and E2E were not run. No test result here establishes Workers compatibility or migration readiness.

## Workstream #249 — preview implementation

An isolated TanStack Start application now lives in `spikes/cloudflare/`, with its own Vite root, TypeScript project and route tree. It shares the existing framework versions and does not import production runtime dependencies. Root `cf:*` commands operate on this spike; existing production commands/workflows remain in place.

- Pinned Cloudflare Vite plugin 1.66.0, Wrangler 4.154.0 (matching the plugin's Wrangler dependency), and Worker types 5.20261029.1.
- Refreshed the existing Wrangler CLI connection with a reduced subset of its prior permissions for user/account reads, Workers writes and D1 writes.
- Created the dedicated `twe-migration-preview` D1 database using the APAC location hint and applied its synthetic fixture migration. The preview binding records its ID; the unrelated event-booking database was not modified.
- Prepared an independent synthetic schema, real validated server functions, Better Auth SQLite/session/password fixtures, and an idempotent reward-batch prototype with deliberate failure injection.
- Added fail-closed Basic access protection, noindex headers, isolated cookie names and local-only secret files. Production credentials/data were not copied into the spike.
- Google OAuth, real reset/verification email flows, migrated accounts, full app SSR/content/OG and full reward behavior remain outside this fixture; the runbook lists every exclusion.

Build/deploy, execution scenarios, runtime compatibility, concurrency/failure validation and CPU/resource measurements remain pending under #256. No preview Worker is deployed and no Free/Paid go/no-go decision is claimed. Keep #249 open until its deferred evidence exists. See `spikes/cloudflare/README.md` for setup and the proposed measurement thresholds.
