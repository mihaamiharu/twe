# Readiness, cutover and retirement

This runbook is preparation for #256/#257. It does not authorize a DNS switch, production import, paid plan, data discard or VPS deletion. The owner wants local E2E first. Keep the VPS/Tunnel recoverable until an approved cutover and at least one week of successful observation.

## Candidate checklist

- Complete local lint/typecheck/unit/D1 integration/build checks, then the owner's local Playwright E2E run. Resolve all critical failures.
- Exercise the full feature/route matrix: en/id content, signed-in navigation/cache isolation, robots/sitemap/canonicals/media/editor WASM, all OG cards and legacy queries, auth/verification/reset/Google/session retention, roles/admin, profile/privacy, progress/submissions/hints/rewards, dashboard/leaderboard, contact/bugs/newsletter and upstream failures.
- Rehearse empty and incremental D1 migrations, same/different-target concurrent rewards, retries/hint races and deterministic batch rollback under actual D1. Reconcile the full dataset, not a small sample.
- Record Worker cold/warm CPU/memory/startup/bundle size and D1 calls/rows/storage. Apply the Free go/no-go thresholds from the operations guide. Paid fallback needs owner approval.
- Confirm the account is on Free, accept the gateway/object CPU/duration/memory/account-wide quotas, and retain the AppRuntime export/binding. Select/configure the free HTTP email transport, verify sender and inbox delivery/failure behavior. Configure isolated Google callbacks/origins, secrets, preview access, GitHub environment reviewers, least-privilege tokens and independent backup-key recovery.
- Rehearse PostgreSQL restore, final export/import/validation, encrypted D1 restore and Time Travel. Measure maintenance/recovery time against the agreed RPO/RTO. Rehearse interrupted import and post-cutover write reconciliation.
- Review security headers/CSP alongside editor/iframe/external-script behavior. Existing CSP was not silently tightened during the runtime port; a stricter policy needs browser verification. Verify cookies/CSRF/origins/CORS/test-route denial and sensitive-data redaction.

No production DNS change follows simply from a green source check. Link the approved candidate SHA, reports, go/no-go decision, operator/rollback owner and maintenance window in #256.

## Approved cutover sequence

1. Pin and retain the exact tested Worker artifact, PostgreSQL image/application commit, schema migrations, current Tunnel/DNS configuration and secure backup paths. Take a fresh encrypted D1/Time Travel recovery point if the target already holds approved data.
2. Establish a complete write freeze on the old application. On the inventoried VPS, stopping `twe-app` blocks all application/auth/session writes while PostgreSQL remains available for export. Tunnel requests may return an outage response during the approved window; rehearse the operator-facing maintenance presentation beforehand. Verify all public/admin/auth/API write paths are unavailable. Do not keep either application's writers alive during data transfer.
3. Take the final PostgreSQL custom-format backup, verify its checksum, export one consistent normalized snapshot, and record final counts/hashes. Keep the frozen PostgreSQL database unchanged as the rollback source.
4. Apply the reviewed D1 migrations to the explicitly identified empty production target, import once, and require full row/count/hash/FK/integrity equality. Stop on any mismatch; never auto-reset learner data to make reconciliation pass.
5. Set the reviewed production bindings/secrets/origin/callbacks and deploy the approved production artifact. Keep MAINTENANCE_MODE=true until the target and configuration are confirmed. The checked-in production Worker has no custom-domain route; attach testingwithekki.com only during this approved step, recording the previous Tunnel/DNS routing for rollback.
6. Route the domain to the Worker, disable maintenance, and smoke-test critical auth/content/write/admin/integration paths. Ensure the old app remains stopped and cannot receive writes through a stale origin or Tunnel hostname. Purge changed stable OG asset URLs if needed; verify static requests bypass the Worker as intended.
7. Record the exact first-D1-write time and monitor CPU/errors/quotas, auth/email, backups and data invariants closely. Keep restricted audit/recovery evidence and the old deployment recoverable for at least one week.

## Rollback and D1-only writes

Before D1 accepts writes, restore the prior Tunnel/DNS route and restart the pinned VPS app against its frozen PostgreSQL database. Verify one writable source.

After D1 accepts writes, block new Worker traffic and drain admitted requests, then enable the database write freeze with migration:freeze and verify status. Export D1 and retain the failed deployment/artifact and recovery points. Identify every D1-only change across auth/session/account/verification data, profiles/roles/privacy, progress/submissions/XP/achievements, content/admin edits and contact/bug/newsletter records. Compare full snapshots and reconcile those writes into the rollback target using the frozen D1 snapshot exporter and fresh PostgreSQL recovery importer described in CLOUDFLARE_DATA.md. The full source data plus simulated new writes have passed this reverse loop locally; repeat it against the approved candidate and production-like timing. Schema/code rollback alone is insufficient. Any decision to discard new writes needs explicit owner approval against the recovery objective; do not silently resume the stale PostgreSQL source. Revalidate before restoring one writable origin.

## Observation and retirement

After at least one successful week, record sign-off for data integrity, feature parity, CPU/budget, auth/email, backups and rollback/recovery results. Then #257 may remove the obsolete Tunnel and VPS credentials/deployment access, archive PostgreSQL recovery assets under the agreed retention, and cancel renewal before May 2027. Target cutover remains April 2027 or earlier. Do not delete the VPS or its backups merely because implementation has been pushed.
