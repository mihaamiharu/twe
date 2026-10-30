# Migration candidate evidence — October 30, 2026

This report records implementation validation, not production release approval. The owner will run Playwright E2E locally first. Production still runs on the VPS/Tunnel.

## Completed checks

| Check                 | Evidence                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript            | `bun run typecheck` passed                                                                                                                                                                    |
| ESLint                | `bun run lint -- --max-warnings 0` passed                                                                                                                                                     |
| Unit suite            | 738 passed, 0 failed across 70 files                                                                                                                                                          |
| D1 integration        | 30 passed, 0 failed across eight isolated processes/local D1 suites                                                                                                                           |
| Worker/client build   | `bun run build` passed with Cloudflare Vite                                                                                                                                                   |
| Upload dry run        | 10,797.95 KiB raw / 2,744.32 KiB gzip; no deployment performed                                                                                                                                |
| Known OG images       | All 222 manifest paths exist and have 1200×630 PNG headers                                                                                                                                    |
| Static asset limits   | 477 client files; largest file 13,509,049 bytes, below the current 25 MiB individual-asset limit                                                                                              |
| Dependency boundaries | Build guard verifies client exclusion of server resources/DB modules; Worker selects Cloudflare OG/platform adapters and excludes native Resvg, postgres, Nodemailer, Bun Sentry and Wrangler |
| Local Worker HTTP     | Disposable Node/Vite/workerd smoke passed HTML/private caching, robots/sitemap/browser WASM, legacy Home OG redirect, arbitrary dynamic WASM OG, registration/session and role input denial   |
| Remote preview schema | All three D1 migrations applied to twe-preview, UUID a57397b4-3f7f-432e-a161-04330b3a5b4b; no production dataset imported                                                                     |

D1 integration includes same/different-target concurrent completion, first-completion/achievement idempotency, hint discount/retries, rollback after a CHECK failure, existing-format credential hashes/roles/session expiry, registration role denial/logout, strict rate windows/trusted identity, support-API denial, and a full synthetic snapshot import/hash/FK/quick_check round trip with overwrite rejection.

The local HTTP smoke is separate from Playwright E2E. It uses only synthetic data in disposable D1 state and no external email, Google, AI or GitHub delivery. D1 rejects SQLite's integrity_check; the importer uses supported quick_check plus complete per-table row hashes/counts, FK checks and schema constraints.

## Build decisions discovered during validation

- Vite must run under Node.js 22.12+ for the Cloudflare toolchain; forcing Bun for the Vite process failed during Miniflare Worker-export probing. Bun still runs package scripts and test orchestration.
- The build wrapper supplies a 4 GiB Node heap unless the caller already configured one. This does not change Worker runtime limits.
- The browser editor/compiler loader is explicitly client-only. Unreferenced Monaco browser-worker assets emitted during SSR scanning are removed from the server output and retained in client Static Assets. The build fails if SSR actually references one. This reduced the dry-run gzip upload from 4,766.86 KiB to 2,744.32 KiB without removing browser editor features.
- The bundle now fits the current Free upload limit, with limited headroom. This does not prove Free CPU feasibility, startup limits, memory limits, account quotas or deployed performance.

## Outstanding release gates

- Owner's local Playwright E2E and browser/visual parity, including preview noindex/access, navigation, editor hydration and all OG layouts/Unicode/crawlers.
- Repeat/time the remote cutover rehearsal on the approved candidate. The restricted backup has now passed local PostgreSQL restore, full-data D1 import and reverse PostgreSQL restore with simulated post-cutover writes.
- Owner review/sign-off of the successful local D1-only write reconciliation rehearsal and the production recovery objectives.
- Chosen/configured HTTP email provider, verified sender and actual inbox/failure behavior. The owner explicitly kept provider selection undecided; EMAIL_PROVIDER=unconfigured fails explicitly outside local/test use.
- Preview Google callback/origin/role/existing-account checks, and real AI/GitHub upstream success/failure validation using isolated secrets.
- Deployed CPU/memory/startup/resource measurements, including password hashing and arbitrary OG rendering, with the Free/Paid go/no-go decision. No paid service was enabled.
- Owner-held recovery-key custody, GitHub environment reviewers/scoped credentials and backup enablement. Preview encrypted SQL/decrypt/local restore and Time Travel marker recovery have passed; production-scale operational timing remains pending.
- Security/cookie/cache isolation and the complete route/feature matrix; approved cutover window and recovery objectives.
- Production data import, Worker deployment/domain routing, at least one week of observation, then explicit VPS retirement sign-off.

Keep #248–#257 acceptance criteria open wherever these runtime/operational gates still lack evidence. See the data, operations and cutover runbooks for the remaining procedures.

## Local full-data recovery rehearsal

The saved PostgreSQL 15.17 archive restored successfully; all 14 tables reconciled into private local D1. Counts: 33 users, 74 sessions, 33 accounts, 5 verification rows, 29 tutorials, 109 challenges, 72 test cases, 88 submissions, 19 progress records, 20 achievements, 14 user achievements, and one each bug/contact/newsletter record. Snapshots and detailed checksums remain restricted outside git.

A second phase added synthetic D1-only account/credential/content/progress/submission/reward/contact writes, enabled the DB freeze, exported the resulting state, and restored into a fresh PostgreSQL database with complete core-column equality. The complete local round trip took approximately 6.1 seconds on this workstation; this is not a remote cutover-duration claim. No live VPS database was modified or production dataset uploaded to Cloudflare. Temporary containers were removed.

## Isolated preview recovery checks

An encrypted export of the schema-only twe-preview database decrypted and restored into fresh disposable local D1. Authentication rejected both a wrong key and modified ciphertext; all 48 freeze triggers and the operator flag survived, with quick_check/FK checks passing. The disposable rehearsal key was discarded. This verifies the mechanism; independent owner key custody and production-data SQL recovery timing remain release gates.

Preview Time Travel restored an identified pre-write bookmark after a unique synthetic operator marker was inserted. The marker disappeared and all 48 triggers remained. No production database was accessed or restored.
