# Cloudflare release and VPS retirement plan

Current outcome: **production is on Cloudflare and TWE hosting on the VPS is retired**. The existing VM is retained for remote development. [The November 2 execution record](reports/cloudflare-production-cutover-20261102.json) supersedes pre-cutover status below; remaining Google/progress spot checks and the first scheduled backup are listed explicitly.

Prepared November 2, 2026. Owner: `mihaamiharu`. Implementation remains on `release/cloudflare-migration`. [#245](https://github.com/mihaamiharu/twe/issues/245) is the umbrella; [#256](https://github.com/mihaamiharu/twe/issues/256) owns readiness, cutover and observation; [#257](https://github.com/mihaamiharu/twe/issues/257) owns retirement. No additional tracking issues are needed for this plan.

Execution completed the production cutover and same-day TWE hosting retirement. [The cutover record](reports/cloudflare-production-cutover-20261102.json) links the final frozen import, independent production recovery, owner acceptance, Worker domain, resource audit and old-stack shutdown. [Standby preparation](reports/cloudflare-production-setup-20261102.json) and [the source/candidate rehearsal](reports/cloudflare-release-rehearsal-20261102.json) remain historical evidence. The starting-evidence table below records the pre-execution baseline.

The outcome is production on Cloudflare Free with all existing accounts and learning data preserved, independent recovery, and no remaining dependency on the VPS. Existing Spacemail and owner-approved DeepSeek credit remain external integrations. Strict $0 applies to the new hosting architecture; a paid Cloudflare fallback is excluded.

## Updated retirement direction — November 2

The owner removed the seven-day hold and wants to reuse the VPS for remote development. Follow [the same-day cutover plan](CLOUDFLARE_SAME_DAY_CUTOVER.md): retire the TWE hosting stack after immediate production and off-VPS recovery checks pass, keeping the VM itself for development. Continued monitoring does not reserve the VPS. The earlier whole-machine cancellation goal is superseded for this execution; do not cancel or wipe the VM.

## Starting evidence

The recorded November 2 baseline is release commit `de419ec`, with protected synthetic preview running as Worker version `f738ca85-aad8-46ea-a73e-916dca90e3d1`. Refresh these identifiers before execution; they are not permanent release pins.

| Workstream | Evidence already available | Still required |
| --- | --- | --- |
| Runtime and D1 | Gateway/AppRuntime/D1 deployed; local development uses the same boundary | Final candidate and sustained workload acceptance |
| Recovery | Full older PostgreSQL → local D1 → fresh PostgreSQL loop; private preview backup download/key recovery | Fresh source/candidate rehearsal and production backup recovery |
| Existing users | IDs, hashes, sessions and roles preserved by migration tooling | Candidate-specific migrated login/linkage/session checks |
| Email | Existing Spacemail delivery, verification and reset checks passed | Production configuration and controlled release verification |
| Google | Replacement preview sign-in passed; separate production client retained in Keychain | Repeated login, migrated linkage, public publishing and production activation |
| GitHub intake | One private issue delivered with metadata reduction and cleanup | Final candidate failure-path/admin persistence checks |
| AI | One approved hint, persistence/cache reuse and cleanup passed | Apply a bounded operating cap during release configuration; provider use is approved |
| Free resources | Free account confirmed; bounded CPU, OG and overload studies passed | Account-wide traffic/duration/quota budget and sustained capacity decision |
| Tests | Older consolidated tests and owner E2E passed | One consolidated pass on the final candidate; owner runs Playwright |
| VPS | TWE app/PostgreSQL/Tunnel inventoried | Refresh drift and resolve the separate application/gateway workload |

November evidence does not replace fresh export, credential-expiry and candidate checks if release happens later. The previous target was April 2027 before May renewal; the exact provider renewal/cancellation deadline and an earlier cutover window still need recording.

## Execution sequence

### 1. Refresh the source and retirement inventory

Agent performs read-only inspection through personal SSH. Record the deployed app/image revision, schema/migration hashes, PostgreSQL version, table counts, DB size, mounts, scheduled work and current TWE routing. Identify drift against the release branch, including editorial/catalog changes. Inspect the failing container health check without restarting services or inferring a public outage from container status.

Take a fresh consistent PostgreSQL archive while the source remains online; verify its checksum after copying to a private local directory. Keep credentials, hashes, sessions, snapshots and raw logs outside git. Record the source revision against the actual running artifact, not just a possibly different checkout.

Inventory the separate VPS application/gateway and its volumes/domains. Record whether it must be moved, retained elsewhere or deliberately discontinued by its owner. Do this early: TWE success alone cannot authorize whole-machine retirement. Confirm the actual paid-through and cancellation dates without changing billing.

**Exit:** verified fresh private backup, source revision/schema agreement, drift list, and a complete retirement dependency list. An unknown deployed revision or unexplained schema drift blocks using the archive as release evidence.

### 2. Rehearse migration and account compatibility in isolation

Restore the fresh archive into a uniquely named loopback-only local PostgreSQL instance, using the existing running Podman service where available. Export a read-only consistent normalized snapshot, import into fresh private local D1, and reconcile all tables/normalized columns, counts, hashes, foreign keys and integrity checks. Existing preview data must not be overwritten; production data stays out of shared preview.

Verify preserved user/provider IDs, password-hash format and values, roles, sessions/expiry, progress, submissions, XP, achievements and admin access. Use synthetic credentials/session fixtures for automated checks; an owner-controlled existing account login is completed by the owner when needed. Never reset an existing user's password or create duplicate users to make a check pass. Distinguish account compatibility from cookie continuity on the production domain, which needs the retained production auth secret/origin and a live post-cutover check.

Exercise a failed import without silently resuming over partial data. Add isolated synthetic D1-only writes, freeze, export and restore into a new PostgreSQL recovery target. Reconcile every supported field; preserve those post-cutover writes. Record forward/reverse times and operator steps. Local time is not the production downtime estimate; remote duration still needs a separate approved rehearsal or cutover measurement.

**Exit:** zero unexplained reconciliation differences, documented auth compatibility, verified interrupted-import handling and reverse recovery, and no leaked raw data. A mismatch is investigated and fixed before advancing.

### 3. Prepare production configuration and operations

Prepare a reviewable configuration/credential manifest with names and destinations only: production D1, Worker/AppRuntime bindings, unchanged production auth secret/origin, separate production Google client, existing mail transport, private GitHub intake, existing DeepSeek and a bounded usage cap. Refresh expiring credentials, including the intake token expiring December 2. Provider choices already approved are not reopened.

Review Google branding/domain/callbacks and publishing requirements. Prepare exact custom-domain/Tunnel rollback records, maintenance behavior and origin access restrictions. Record production artifact/build provenance and the additive migration order. Production settings/import/publishing that affect users are activated during the approved release steps, not inferred from an empty resource existing.

Prepare private-vault production backup configuration, independent owner-key recovery, retention and monitoring ownership. The first real production backup must pass independent downloaded-artifact recovery before enabling its schedule. Keep final retirement recovery assets outside short-lived Actions artifact retention.

Refresh actual plan/limits and budget the gateway, fixed application object, D1, preview/probes and private Actions usage together. Do not leave two continuously active app objects consuming the shared Free duration budget. Define how preview/probes are limited during production operation; do not add namespaces, alarms or paid overages as an unreviewed workaround.

**Exit:** production configuration and rollback manifest reviewed, credential/publishing dependencies resolved, backup activation sequence ready, and Free resource assumptions recorded. No traffic switch follows from this phase alone.

### 4. Validate one final release candidate

Finish fixes first, then pin a candidate SHA. Run lint, typecheck, unit/D1 integration, production build, packaging/bundle/asset checks together. The owner runs isolated local Playwright E2E on that same candidate. Keep routine suites deferred until this gate; if later code changes invalidate evidence, rerun the affected checks and refresh the final candidate record.

Complete the route/security/feature matrix and relevant failure cases: en/id, public SEO/assets/OG/editor, personalized cache isolation, credential/Google login and logout, verification/reset, roles/admin, profiles, learning/progress/submissions/rewards, leaderboard, mail/forms/private bug intake and AI cache/limits. Use mocks or disposable fixtures for provider errors; do not send additional real mail/issues or paid generations without the relevant delivery allowance.

Measure bounded representative cold/warm, mixed and burst workloads; record request counts, window, CPU, latency, memory, object-active duration, D1 rows/storage and all other account usage. Gateway target remains p99 below 8 ms with no exceeded-CPU failures; report sample limitations. Object CPU/memory errors, unexplained critical-flow failures or unsupported quota/headroom assumptions block release. A small bounded test is not a sustained-capacity guarantee. If strict Free cannot meet the workload, redesign before cutover.

**Exit:** final readiness record links the exact SHA/artifact, tests, owner E2E, data/auth/recovery results and Free capacity decision, with no unresolved critical failure. Record operator and rollback owner, maintenance window and downtime planning allowance (the same-day plan proposes up to 60 minutes; actual remote duration is not yet measured). Proposed backup objectives remain RPO ≤24 hours / RTO ≤60 minutes until accepted and measured; planned cutover must preserve acknowledged writes.

### 5. Execute the approved cutover

Only after phase 4 passes and the owner approves the concrete window and go/no-go record, follow [the cutover runbook](CLOUDFLARE_CUTOVER.md). Retain the pinned old app/image, routing, schema and private recovery assets.

Stop TWE app writers while PostgreSQL remains available; verify auth/session/admin/API writers are unavailable too. Take the final backup and consistent export. Apply reviewed migrations to the identified empty production D1, import and reconcile fully. Configure/deploy the approved production artifact in maintenance, then attach the production route and enable traffic. Preserve mail DNS and unrelated zones/services. Keep the old app stopped so a stale hostname cannot create a second writer.

Before opening user writes, run a manual private production backup and independent restore, then enable the reviewed production schedule. Record the first D1 production write and check critical login, existing-account identity/roles/progress, content/write/admin paths, cookies, callbacks and resource errors immediately. Verify the first scheduled backup when it runs; this later scheduled event does not hold the VPS for seven days.

**Exit:** one writable production source on Cloudflare, reconciled data, critical live flows passing, backup/recovery proven and cutover evidence recorded.

### 6. Complete immediate production acceptance

Follow the same-day plan's existing-user, progress/admin, public-route, error/quota and independent production-recovery checks. Verify old writers cannot resume. Resolve critical failures before reclaiming the old stack. The owner explicitly removed the seven-day observation hold because the site has low traffic and the VPS is needed for development.

**Exit:** critical live flows and production recovery pass, the owner completes real-account checks, and retained recovery assets are available off the VPS. Continue monitoring on Cloudflare after VPS reuse; there is no calendar waiting period.

### 7. Retire TWE hosting and reuse the VPS under #257

Preserve final PostgreSQL/schema/migration evidence, pinned deploy artifacts, exact routing and recovery instructions outside the VM. Stop and disable restart for the inventoried TWE app/PostgreSQL/Tunnel services, checking dependencies and shared credentials first. Disable only obsolete TWE deployment hooks/access; do not remove remote-development access or unrelated services. Confirm the website works with the old stack stopped and its CPU/memory is available for development.

The VM stays in service for remote development. No VM cancellation, reinstallation, disk wipe or volume/backup deletion is included. Recovery after new D1 writes must use a fresh target with complete reconciliation, rather than assuming the reused VPS is an unchanged rollback server.

**Exit:** Cloudflare serves production independently, off-VPS recovery is proven, old website writers stay disabled and the existing VPS is available for remote development the same day.

## Stop and rollback rules

| Condition | Required action |
| --- | --- |
| Unknown source/schema, unexplained data difference or failed recovery | Stop before cutover; keep VPS serving and investigate |
| Critical auth/security/write failure or Free resource failure before D1 accepts production writes | Keep maintenance or restore the old route/app as the sole writer |
| Critical failure after any D1 production write | Block new traffic, drain admitted work, verify DB freeze, export and reconcile into a fresh rollback PostgreSQL target before restoring a sole writer |
| Proposed loss of D1-only writes | Stop; data discard requires a separate explicit owner decision |
| Separate workload or remote development needs the VM | Retire only TWE hosting; preserve the VM and unrelated access/services |

No automatic traffic-only rollback after D1 writes, concurrent old/new writers, production resets, weakened password hashing or paid-plan fallback is part of this plan.

## Ownership and next action

The agent owns preparation, implementation fixes, isolated rehearsals, non-Playwright checks and sanitized evidence. The owner owns credentials/2FA entry when required, existing-account/browser sign-in, the final local E2E run, cutover go/no-go and retirement sign-off. Routine authorized preparation continues while the owner is away; a required owner action is recorded with independent work continued where possible.

Cutover and same-day TWE hosting retirement have completed. Continue Cloudflare/backup monitoring, verify the first scheduled backup and complete the explicitly unclaimed Google/progress spot checks. Keep recovery off the repurposed VM; do not rerun a source import over live D1. Publish only sanitized results on the release branch; do not mark #256 or #257 complete from source preparation alone. Supporting procedures: [data transfer/recovery](CLOUDFLARE_DATA.md), [operations](CLOUDFLARE_OPERATIONS.md), [backups](CLOUDFLARE_BACKUPS.md), [Google](CLOUDFLARE_GOOGLE_OAUTH.md) and [current evidence](CLOUDFLARE_RELEASE_HARDENING.md).
