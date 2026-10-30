# PostgreSQL to D1 data runbook

Production remains on the VPS until local/preview readiness and a cutover window are approved. Empty TWE-specific preview/production D1 resources are configuration preparation, not migrated production data. The separate `ebp-r1-prod` resource and synthetic `twe-migration-preview` spike are excluded.

## Export and transform

Use a restricted absolute directory outside the checkout. Never attach snapshots, SQL, auth fixtures or ordinary diagnostic output to GitHub. The existing restricted PostgreSQL dump remains a recovery asset; its actual restore rehearsal is still pending.

```sh
# Supply a read-only-capable connection securely; do not put credentials in args.
export TWE_SOURCE_DATABASE_URL='…'
bun run migration:export /absolute/private/snapshot.json <deployed-40-character-commit-sha>
```

The exporter opens one repeatable-read/read-only transaction, records migration hashes and source commit, and reads the 14 fixed tables in deterministic order. It rejects unknown source columns and invalid required values, booleans, enum strings, UUID identities, timestamps and PostgreSQL integers. JSON objects are canonicalized, SQL NULL remains distinct from JSON null, and tag-array order/null elements are retained. It writes normalized D1 values plus per-table counts and SHA-256 hashes using mode 0600, an enclosing mode-0700 directory, and exclusive creation. It does not reset XP, regenerate passwords/tokens, or rewrite identity values.

The commit argument is an operator assertion: compare it with the actual deployed application and recorded schema before accepting the export. Earlier live inventory counts were discovery evidence while production remained writable; use the final frozen export for reconciliation.

## Prepare an isolated target

```sh
bun run db:migrate                       # local D1
bun run cf:db:migrate:preview            # dedicated remote preview D1
```

Use a fresh target with the checked-in schema. Imports require all 14 application tables and the reward/rate-limit support tables (the initialized operator-control row is expected) to be empty. Never import the production snapshot over synthetic preview rows or a populated production target. Do not run editorial `db:sync` over a production snapshot before recording reconciliation: syncing can deliberately change publication/content metadata.

## Import and validate

```sh
bun run migration:import /absolute/private/snapshot.json /absolute/private/import-report.json local
bun run migration:validate /absolute/private/snapshot.json /absolute/private/validation-report.json local

# Remote uses a scoped D1 token and account ID from environment variables.
# Never print them or pass them as command-line arguments.
bun run migration:import /absolute/private/snapshot.json /absolute/private/preview-report.json preview
```

Remote commands require `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; the database UUID/name comes only from the checked-in TWE environment. Production access additionally requires `TWE_CONFIRM_PRODUCTION_IMPORT` equal to the configured production UUID. That guard is not release approval; follow the cutover runbook first.

Imports use prepared statements, bounded request batches, one row per statement, and parent-first FK-safe ordering. Large text is passed as a bound value rather than expanding past D1's SQL statement-length limit. Each statement stays below 100 bindings. Source hashes/counts and column scope are checked before writes. Import never replaces existing rows or disables foreign keys.

Validation reads all rows with bounded pages, compares every normalized column and per-table checksum/count, then runs foreign_key_check and quick_check. This covers hashes/tokens, roles, XP/levels, relationships and historical counters as well as ordinary profile/content fields. Reports record success/failure and elapsed time and stay restricted outside git. Do not accept a report with any unexplained mismatch.

## Interrupted import and rehearsal

A completed batch may remain after a later batch fails. Rerunning import against that populated target fails before writing. Recreate only the explicitly identified isolated target, update its configured UUID if necessary, apply migrations, then start from the same snapshot. Never auto-delete data to make an import pass. A production interruption stays in maintenance until the target is reconciled or the frozen PostgreSQL source is restored as the sole writable source.

Before cutover, rehearse export/import/reconciliation using representative sanitized data, and securely exercise existing-format password hashes, Google linkage, cookies, sessions, roles and expiry behavior. Record the source/target identifiers, migration hashes, counts/checksums, duration, resource usage and application smoke results. Rehearse a failed import and target recreation. Full row equality preserves source anomalies too; investigate domain anomalies rather than silently repairing historical XP during conversion.

References: [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/).

## Rehearse an existing backup and post-cutover rollback

```sh
# Uses an already running Podman service by default; never starts a VM.
# Set TWE_REHEARSAL_RUNTIME=docker to use an already running Docker engine.
bun run migration:rehearse /absolute/private/source.dump /absolute/private/new-run-directory <deployed-sha>
```

This creates a uniquely named, loopback-only, password-protected PostgreSQL 15.17 container with CPU/memory limits and memory-backed data. It restores the archive, exports a consistent normalized snapshot, imports into private local D1, and validates every row. It then adds isolated synthetic post-cutover account/content/submission/reward/contact records, freezes the D1 source, exports it, restores it into a second fresh PostgreSQL database, and verifies all core values before committing. The new fixtures exercise JSON null versus SQL NULL, text-array quoting/backslashes/null entries, hashes, hint credit and operation-owned achievements. Only the named rehearsal container/config are removed; restricted snapshots/reports/D1 state remain for review.

The October 30 backup has completed this full loop locally: the original 14-table dataset (including 33 users) reconciled exactly, and all simulated D1-only writes survived the reverse restore. This is local recovery evidence, not a measured remote production cutover window or owner account-login sign-off.

For a real post-cutover rollback, first block new traffic, drain requests, enable both maintenance presentation and the database freeze, and verify status:

```sh
bun run migration:freeze freeze production
bun run migration:freeze status production
bun run migration:export:d1 /absolute/private/frozen-d1.json <deployed-worker-sha> production
# Point only at a NEW, EMPTY recovery database, never the populated old source.
bun run migration:restore:pg /absolute/private/frozen-d1.json /absolute/private/recovery-report.json --apply-migrations
```

The last command requires TWE_ROLLBACK_DATABASE_URL supplied securely through the environment. It rejects populated targets, binds explicit text codecs with schema casts, verifies complete counts/hashes in one PostgreSQL transaction, and rolls back on a mismatch. It never performs a partial merge or silently drops unsupported values. A target-type incompatibility needs an explicit reviewed resolution while D1 stays frozen. Retain the D1 snapshot and diagnostic metadata. After a successful verified restore, route to one writable database only; unfreezing the wrong old/new source creates split-brain.
