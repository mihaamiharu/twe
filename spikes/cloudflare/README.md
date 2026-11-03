# TWE Workers/D1 feasibility spike

Owns the implementation portion of [#249](https://github.com/mihaamiharu/twe/issues/249). This is a separate TanStack Start application sharing the repository's installed packages. It does not import the production router, PostgreSQL client, content catalog, Nodemailer or native OG renderer.

## Current status

The preview code is prepared. The dedicated remote `twe-migration-preview` database has been provisioned in APAC, its ID is recorded in the preview binding, and migration `0001_synthetic_preview.sql` has been applied to initialize its empty fixture tables. Build, runtime scenarios, CPU measurements, concurrency/failure checks and feature parity have **not been executed**; those checks are deferred to #256 at the owner's request. No preview Worker has been deployed. This is not evidence that Workers Free is viable or that #249 is complete.

Production remains on the VPS. The unrelated event-booking `ebp-r1` Worker and database are outside this spike's scope.

## Isolation

- Local Worker: `twe-migration-spike-local`; local D1 state stays in Wrangler's ignored storage.
- Proposed remote Worker/database: `twe-migration-preview` in the existing TWE Cloudflare account. No custom domain, production DNS route, production database or production secret is used.
- The all-zero default database ID is a local placeholder. The preview environment binds the dedicated TWE database; do not replace it with `ebp-r1-prod` or a production database.
- Vite's root and environment directory are this folder. There are no aliases to production source, and the spike has an independent TypeScript project/route registry.
- Runtime configuration comes from typed Cloudflare bindings, not PostgreSQL `process.env` configuration.
- SSR and server-function requests require HTTP Basic authentication: username `preview`, password `SPIKE_ACCESS_TOKEN`. An unset/short token fails closed. Static client bundles are public assets and contain no access or auth secrets.
- All responses are marked noindex; application responses also use private/no-store caching. There is no public registration endpoint accepting arbitrary identity data.
- The UI can create only generated `@example.invalid` identities; the database also enforces that suffix. The 100-user guard limits accidental fixture growth, but is not a strict concurrent quota or a production abuse-control implementation.
- Do not upload production data, existing account hashes, SMTP credentials, Google credentials, or the production Better Auth secret here.

## Toolchain

The spike shares the locked TanStack Start 1.145.1, Vite 7.3.0, Better Auth and Drizzle versions with the application. Cloudflare Vite plugin, Wrangler and Worker types are pinned in the root dev dependencies. No TanStack framework upgrade is introduced by this work. Declared package compatibility has been inspected; actual runtime compatibility is pending.

## Local setup

Run package installation from the repository root as usual. Copy `.dev.vars.example` to `.dev.vars` in this folder and replace both example values with **separate random values of at least 32 characters**. Keep the file private; it is ignored by git. Local-only secrets have already been generated on this workstation without using production values. Open the local preview at `http://localhost:3001` to match the configured auth origin.

For local preview of a built artifact, use a separate ignored `.dev.vars.preview` with local-only secrets and `BETTER_AUTH_URL=http://localhost:3001`. This overrides the remote origin during local emulation; it does not configure deployed secrets. Remote D1 bindings are disabled in the Vite plugin, so development/preview uses local state even when the selected environment has a remote database ID.

The following commands are provided for later use; creating these instructions does not mean they have been executed:

```sh
bun run cf:typegen
bun run cf:db:migrate
bun run cf:dev
```

Wrangler type generation writes an ignored declaration file. The checked-in binding interface includes secret types; it does not contain secret values. Vite regenerates this app's route tree during normal development/build.

## Remote preparation and deployment

The Cloudflare browser session and Wrangler's CLI session are separate. The existing CLI session has been refreshed with a reduced subset of its previous permissions for user/account reads, Workers writes and D1 writes. When it expires again, use `wrangler login` or an appropriately scoped deployment token in a secret store. Never paste tokens into issues or commit them.

The `twe-migration-preview` database has already been created with an APAC location hint and no read replicas. Its ID is recorded in the preview binding, and the synthetic migration is applied. Do not create another database with this name or rebind it to another project. Location is a hint, not a guarantee of physical placement.

```sh
wrangler secret put SPIKE_ACCESS_TOKEN --env preview
wrangler secret put BETTER_AUTH_SECRET --env preview
```

Both preview secrets must be fresh and different from local/production values. The secret commands prompt for input rather than putting it in shell arguments/history. Configure these before exposing the preview; the Worker fails closed until its access token is present.

From the repository root, the eventual preview sequence is:

```sh
bun run cf:db:migrate:preview
bun run cf:deploy
```

`cf:build` selects the Wrangler preview environment through `CLOUDFLARE_ENV=preview`; `cf:deploy` builds this spike and deploys its generated Worker configuration from this folder. These commands are intentionally separate from the existing production scripts/workflows. `cf:preview` serves the built spike locally. With the deferred-testing agreement, do not run build/deploy/runtime checks during each implementation step; execute and record them in the release-readiness stage.

## Prepared scenarios

The page loader calls a real validated TanStack server function that reads the D1 binding. Buttons execute separate requests so that future Cloudflare CPU measurements can distinguish registration, password login, session reads, password hashing and reward writes.

The auth fixture uses the current Better Auth default password hash implementation, the Drizzle SQLite adapter with transactions disabled, a separate cookie prefix, and one-hour sessions. Cookies are forwarded through `tanstackStartCookies`. It does not weaken production hashing. The password-hashing button hashes/verifies a new synthetic password; it does not exercise a reset-email/token flow.

The reward fixture uses one native D1 transaction batch:

1. Insert a unique `(user_id, lesson_id)` reward with a new server-generated event ID.
2. Increment XP only if that exact event ID exists. Retries generate a fresh event ID, so a duplicate lesson insert cannot authorize another increment.
3. Read XP as part of the batch. Arithmetic updates preserve increments for different lessons.

The failure control inserts a deliberately invalid CHECK value after the ledger insert. D1 should roll back the whole batch. Verify that behavior later; it has not been demonstrated yet. This fixture models the atomicity problem; the production reward/achievement/submission port remains #252.

## Deferred validation and decisions

Record deployment/version, dataset, sample counts, cold/warm classification, CPU percentiles and CPU-limit exceptions per request category. D1 metadata exposes rows read/written; browser wall time is not CPU time.

Proposed Free acceptance thresholds for the readiness review are p95 CPU at most 8 ms, p99 below 10 ms, and zero CPU-limit failures in at least 500 representative requests per critical dynamic flow, with cold/warm behavior recorded separately. Check D1 query counts, source-to-target storage growth, and quota headroom against the current platform limits. These are proposed acceptance criteria, not measured results or an approved Paid plan.

If password hashing or SSR cannot fit the chosen limits without weakening auth, keep the Paid fallback decision explicit. Do not label missing measurements a Free-tier pass.

Still excluded/unverified: full public SSR/prerendering, migrated password-hash fixtures, reset/verification email/token flows, Google OAuth/callbacks, role/admin behavior, existing sessions, real progress/submissions/achievements, leaderboard queries, DeepSeek/GitHub integrations, content/assets/OG parity, and real production bundle/startup limits. The owning implementation issues remain #250–#255; consolidated verification remains #256.

## References

- [Cloudflare TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [D1 atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
