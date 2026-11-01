# Migration candidate evidence — through November 1, 2026

This report records implementation validation, not production release approval. The owner completed the local Playwright run on November 1; hosted integration, resource/recovery and cutover gates remain. Production still runs on the VPS/Tunnel.

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
- The earlier 3 MiB compressed planning threshold is superseded by the current platform documentation: 64 MiB uncompressed on both plans, with no compressed-size limit. The hosted upload is about 10.5 MiB uncompressed and startup measured 14 ms against the current one-second startup limit. Bundle/startup acceptance does not establish CPU or memory acceptance. See the current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

## Outstanding release gates

- Hosted preview browser/visual parity, including preview noindex/access and all OG layouts/Unicode/crawlers. The owner's local automated E2E gate passed; the two intentionally skipped external bug-report flows still need separate coverage.
- Repeat/time the remote cutover rehearsal on the approved candidate. The restricted backup has now passed local PostgreSQL restore, full-data D1 import and reverse PostgreSQL restore with simulated post-cutover writes.
- Owner review/sign-off of the successful local D1-only write reconciliation rehearsal and the production recovery objectives.
- Spacemail SMTP was selected and one authorized hosted TLS message was accepted on November 1. The owner confirmed inbox arrival. Verify real verification/reset behavior; unit checks cover rejected auth/recipients, timeouts and injection. See the Spacemail report.
- Preview Google callback/origin/role/existing-account checks, and real AI/GitHub upstream success/failure validation using isolated secrets.
- Strict $0 acceptance: the revised AppRuntime candidate addressed the gateway CPU problem in captured samples, but Free-account status, controlled cold starts, memory/object duration and account-wide quota headroom remain unverified. No paid service was enabled; cutover stays deferred pending acceptance.
- Owner-held recovery-key custody, GitHub environment reviewers/scoped credentials and backup enablement. Preview encrypted SQL/decrypt/local restore and Time Travel marker recovery have passed; production-scale operational timing remains pending.
- Security/cookie/cache isolation and the complete route/feature matrix; approved cutover window and recovery objectives.
- Production data import, Worker deployment/domain routing, at least one week of observation, then explicit VPS retirement sign-off.

Keep #248–#257 acceptance criteria open wherever these runtime/operational gates still lack evidence. See the data, operations and cutover runbooks for the remaining procedures.

## Owner's local E2E — November 1, 2026

The owner supplied the final `bun run test:e2e` output for release candidate `29fcc35`: **130 passed, 2 skipped, 0 failed** in 6.1 minutes. Local Allure results independently match that final run. Earlier failed runs in the pasted terminal history preceded the disposable seeding-secret fix and are superseded by the final result.

The two skipped cases in `e2e/tests/bugs.spec.ts` intentionally avoid creating real GitHub issues. They are not evidence of successful external GitHub delivery. The final run covers local synthetic accounts/data through the same Worker/AppRuntime/D1 compute boundary as preview; it does not validate real email, Google OAuth, production account login, hosted quotas or production migration/retirement. No browser suite was rerun on the owner's behalf.

## Local full-data recovery rehearsal

The saved PostgreSQL 15.17 archive restored successfully; all 14 tables reconciled into private local D1. Counts: 33 users, 74 sessions, 33 accounts, 5 verification rows, 29 tutorials, 109 challenges, 72 test cases, 88 submissions, 19 progress records, 20 achievements, 14 user achievements, and one each bug/contact/newsletter record. Snapshots and detailed checksums remain restricted outside git.

A second phase added synthetic D1-only account/credential/content/progress/submission/reward/contact writes, enabled the DB freeze, exported the resulting state, and restored into a fresh PostgreSQL database with complete core-column equality. The complete local round trip took approximately 6.1 seconds on this workstation; this is not a remote cutover-duration claim. No live VPS database was modified or production dataset uploaded to Cloudflare. Temporary containers were removed.

## Isolated preview recovery checks

An encrypted export of the schema-only twe-preview database decrypted and restored into fresh disposable local D1. Authentication rejected both a wrong key and modified ciphertext; all 48 freeze triggers and the operator flag survived, with quick_check/FK checks passing. The disposable rehearsal key was discarded. This verifies the mechanism; independent owner key custody and production-data SQL recovery timing remain release gates.

Preview Time Travel restored an identified pre-write bookmark after a unique synthetic operator marker was inserted. The marker disappeared and all 48 triggers remained. No production database was accessed or restored.

## Hosted full-app preview — October 31, 2026

Source runtime candidate: `941edfd8f9061dc569ce6f6c18affe0b68152c7a`; deployed Worker version: `bc1b3def-a274-468c-9b85-3ebf27fb2358`. Preview is protected at https://twe-preview.ekkisyam2310.workers.dev. Deployment reported 10,798.61 KiB uncompressed / 2,745.49 KiB gzip, 14 ms startup, 484 static files, and no asset change on the final upload. This is a preview deployment, with no production domain attached.

The synthetic dataset reconciled all application tables: two preverified learner/admin accounts, 28 tutorials, 83 challenges, 49 test cases and 20 achievements. No production rows or production credentials were uploaded. The protected HTTP smoke passed both locales, Learn/Practice, robots/sitemap/editor WASM, unauthorized HTML/assets, private/noindex headers, known/custom OG PNGs, test-API denial, credential login, session identity/role, Secure/HttpOnly/SameSite=Lax cookies, learner admin denial, admin access and logout. An additional 18 repeated requests returned expected statuses. No Playwright/browser or real external delivery was run.

Deployed verification found and corrected static-asset lookup consuming POST bodies before Better Auth. Asset lookup now runs only on GET/HEAD. Unexpected Better Call exceptions propagate to the Worker's redacted boundary; ordinary API errors retain their normal responses. The smoke recognizes the router's valid 307 access-denial redirect.

Three concurrent submissions through the real authenticated server-function endpoint all succeeded; exactly one returned first-completion credit. Hosted D1 showed three attempts, one completion, 10 submission XP plus 50 achievement XP, total 60. A temporary preview-only trigger then injected a submission failure: XP, submissions, progress, reward operations and achievements were unchanged. The trigger was removed. The two local D1 auth tests also passed after the error-boundary change.

### CPU feasibility decision

Sanitized tail aggregates are in [the measurement report](reports/cloudflare-preview-20261031.json). These are small observational samples, not p99 claims or controlled cold starts. Network wall time is separate from CPU. Representative observed CPU ranges:

| Request                                  | CPU observed             |
| ---------------------------------------- | ------------------------ |
| Password login                           | 192–290 ms               |
| Learn SSR                                | 41–98 ms                 |
| Practice SSR                             | 71–129 ms                |
| Custom dynamic OG                        | 170–190 ms               |
| Session lookup                           | 3–7 ms                   |
| Known OG redirect                        | 1–5 ms                   |
| Static WASM/PNG through the preview gate | 0 ms in captured samples |

The original direct-Worker compute architecture fails the agreed Free CPU acceptance gate; the new Durable Object candidate is evaluated separately below. Successful sampled responses do not establish reliable operation at the Free limit; Cloudflare documents limited flexibility for occasional overruns. Public HTML still uses session/consent-dependent SSR, password hashes retain the existing algorithm, and custom OG remains supported. Reducing these paths to a strict 10 ms budget would require further architecture work and new parity evidence, rather than treating low traffic as proof.

Superseded recommendation: the first preview suggested Workers Paid. The owner has now rejected that fallback, required strict $0 and deferred cutover. Continue with [the Free architecture plan](CLOUDFLARE_FREE_ARCHITECTURE.md); the original runtime is not release-ready on Free. The current documented account minimum is $5/month plus applicable usage charges; [pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [CPU limits](https://developers.cloudflare.com/workers/platform/limits/) were checked October 31. The account's default usage model reports `standard`, but subscription read was denied by the limited OAuth scope, so billing status is unverified. No subscription, plan, budget or production route was changed.

Versions verified from the installed locked candidate: TanStack Start 1.145.1, Router 1.144.0, Better Auth 1.4.15, Vite 7.3.0, Drizzle 0.45.1, Cloudflare Vite plugin 1.66.0 and Wrangler 4.154.0. D1 placement uses APAC with read replication disabled; the hosted reconciliation query was served by the primary in APAC/KIX. Preview D1 reported 425,984 bytes after the concurrency scenario; one aggregate reconciliation read scanned 12 rows. These observations are not a full per-feature query/quota budget.

## Strict-$0 compute redesign — October 31, 2026

The owner rejected Paid and deferred cutover. Runtime source `fb48add`, hosted version `40ff8186-03e1-456e-bab9-2b956aaa8ca0`, keeps security/assets in the gateway and executes unchanged dynamic Start/auth/OG logic in a SQLite-backed AppRuntime object. D1 remains the sole business database. Deployment reported 10,799.29 KiB uncompressed / 2,744.99 KiB gzip and 15 ms startup. Both local HTTP and the owner's later E2E app use this boundary.

All 30 D1 integration checks, typecheck/lint, build/export guards and local/hosted HTTP smoke passed. Eight parallel session RPCs separated learner/admin identities. Three submissions produced one new completion and exactly one 10-XP challenge credit; a failure injection preserved XP/submissions/progress/operations/awards. Private CLI data-proxy configuration, `.dev.vars` handling and cleanup also passed focused checks.

The [new sanitized report](reports/cloudflare-durable-preview-20261031.json) separates gateway and object execution. Captured gateway CPU is 0–1 ms, including Home/Learn/Practice, auth, OG and server functions. Captured object CPU includes Home 21–34 ms, Learn 30–43 ms, Practice 48–58 ms, password login 183–187 ms and custom OG 37 ms. All captured outcomes were ok. No password weakening, SSR removal or reduced OG behavior was used to reach this result.

The ordinary gateway CPU problem is addressed in these samples. Strict-$0 release acceptance is still incomplete: verify the account is actually on Free, measure memory/object-active duration and account-wide quotas, confirm controlled cold starts and broader feature behavior, and complete the owner's local E2E plus the existing provider/recovery/cutover gates. The dashboard lookup reached sign-in and no billing state was changed. See [the architecture and execution plan](CLOUDFLARE_FREE_ARCHITECTURE.md). No paid fallback is selected, and no production import/domain change/retirement occurred.

A bounded six-request mixed check (two logins, two custom OG renders, Learn SSR and Practice SSR) also completed with all responses 200. This checks one mixed concurrency scenario; it is not peak-memory or quota acceptance evidence.

## Existing Spacemail on Cloudflare — November 1, 2026

Source `62e3127` adds direct, bounded implicit-TLS SMTP on port 465 while retaining the HTTP transports. The owner selected the existing Spacemail mailbox and authorized one clearly labeled test message to their admin inbox. The same adapter submitted that one message from an isolated hosted Durable Object; Spacemail returned acceptance after 2,174 ms. Its durable one-attempt claim prevented a resend; the temporary Worker and its extra credential copy were removed afterward. Seven focused protocol tests, lint/typecheck and the preview build passed. Build guards selected the workerd socket adapter and excluded local credential snapshots.

Full preview version `188bb551-ef79-40ac-a4d2-1accb2db1dff` now uses Spacemail with privately installed SMTP credentials. The protected preview HTTP smoke passed access/noindex/cache controls, content/assets/OG, test-API denial, user/admin login/session/cookie flags, roles and logout; it did not send email. See [the sanitized SMTP report](reports/cloudflare-spacemail-20261101.json). The owner confirmed that the single authorized test arrived in the inbox on November 1. Real verification/reset email behavior remains unconfirmed; this transport test does not close those flow-specific gates. No production import/routing/service, mailbox password, mail DNS, subscription or billing state changed.

## Full preview backup recovery — November 1, 2026

The first full-data SQL restore exposed a genuine failure hidden by the earlier schema-only rehearsal: the Cloudflare export inserts accounts before creating the users table. Deferred foreign keys cannot resolve a missing table. `cf:backup:prepare-restore` now parses the authenticated decrypted SQL in restricted offline SQLite and emits schema before data, then indexes/views/triggers. Focused fixtures cover child-first order, NUL/Unicode/quotes/semicolons, binary values, auto-increment state, freeze enforcement, invalid foreign keys and exclusive output files. The encrypted archive format and source database remain unchanged.

A fresh remote preview export/decrypt/prepare/local-workerd restore passed with all 214 rows in 18 tables matching complete source hashes/counts. quick_check/FK checks passed; all 48 freeze triggers survived and rejected a local write. Wrong-key and tampered-ciphertext decrypts wrote no plaintext. Export/decrypt/prepare/restore took 5.014 / 0.052 / 0.234 / 1.521 seconds (6.821-second subtotal); source reads/hash validation are additional. This was synthetic preview data, not production-scale cutover timing. The rehearsal key was discarded, private evidence retained, and plaintext SQL removed. Independent owner key custody, production backup setup and the production window remain release gates. See [the sanitized report](reports/cloudflare-backup-restore-20261101.json).

The owner explicitly deferred the blocked Google project/access investigation so independent readiness work can continue. Google OAuth remains required before cutover and was not removed or marked complete.

## Free resource snapshot — November 1, 2026

Read-only analytics now provide actual object-duration and periodic memory observations for preview version `188bb551-ef79-40ac-a4d2-1accb2db1dff`. Captured gateway CPU max was 5.934 ms; reported object duration 2.066 GB-s and memory peak 116,876,938 bytes, with no exceeded CPU/memory errors. A bounded 28-request mixed run passed, including 12 distinct OG renders and two six-task concurrent rounds separated to respect existing auth limits. The [resource audit](reports/cloudflare-free-readiness-20261101.json) records account totals, units, sampling limitations and the single-object duration bound. This is a small partial-day sample with limited memory headroom, not controlled cold-start, production p99, traffic forecast or billing acceptance. No app/runtime deployment was needed for this audit.
