# Production activation checklist

Prepared November 2, 2026 under [the release plan](CLOUDFLARE_RELEASE_PLAN.md). This is the reviewable configuration and cutover checklist; preparation does not open production traffic.

## Recorded target and routing

- Account and D1 identifiers must match checked-in `wrangler.jsonc`; production D1 is `twe-production`, UUID `6f6630be-ed32-4d07-ba24-24d45bb160c9`.
- Read-only inspection found no production application tables, production Worker or production Worker custom domain. Do not seed synthetic/editorial data into this empty import target.
- The signed-in DNS dashboard still shows the root routed to the existing TWE Tunnel and `www` proxied to the root. Exact record ID, target and proxy/TTL settings were preserved privately for rollback. The operator API cannot read DNS records (403); an absent API result is not evidence that a record is absent.
- Preserve existing MX, SPF, DKIM, verification records and other domains. Change only the reviewed website routing at cutover.

## Runtime configuration manifest

Values and credentials stay in owner Keychain/private operator records and Worker settings, never in this checklist or GitHub Actions logs.

| Setting | Source and release action |
| --- | --- |
| `APP_ENV`, D1 binding, `APP_RUNTIME` and SQLite class migration | Use the production build and exact checked-in target; retain the one fixed application object |
| `BETTER_AUTH_URL` | `https://testingwithekki.com`; retain the same origin and cookie expectations |
| `BETTER_AUTH_SECRET` | Preserve the live VPS value; do not generate a replacement during migration |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Install the matching production pair from its verified owner Keychain entry; never the preview pair |
| Google audience/publishing | Replacement app is still External / Testing; finish publishing review before general-user release, then verify existing account linkage with the owner |
| `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT` | Existing `smtp`, `mail.spacemail.com`, implicit TLS `465` |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Preserve approved existing mailbox credentials and a sender matching that mailbox |
| `ADMIN_EMAIL` | Confirm the intended existing notification inbox without changing existing users or admin roles |
| `GH_API_TOKEN`, `GH_OWNER`, `GH_REPO` | Only the private intake repository and approved Issues/Metadata scope; review production installation and rotate the December 2 expiry before relying on it |
| `DEEPSEEK_API_KEY`, `AI_HINT_DAILY_LIMIT` | Continued use of existing credit is owner-approved. Apply a bounded initial operating cap (25 new hints per shared 24-hour window) as release configuration; cached hints remain reusable. No extra generation test is included |
| `MAINTENANCE_MODE` | Set `true` while importing/validating; only disable after the go/no-go checks |
| Optional analytics/public settings | Retain intended public configuration and consent behavior; never use `VITE_` for a secret |

Preview keeps its own auth/origin/Google/access settings. Its AI cap remains zero after the completed one-shot test; this is a recorded runtime state, not a request to revisit the approved AI provider choice.

Use the existing owner-authorized local Wrangler session only for operator work. It must not become a runtime or CI secret. If using GitHub deployment instead, inspect the scoped deployment credential and `cloudflare-production` environment protections before dispatch; do not invent another credential grant or bypass required checks to make a workflow pass.

## Release evidence to attach to the go/no-go record

- [ ] Pin the actual release SHA and production artifact. Relate later documentation-only commits to the tested code without implying untested code has passed.
- [x] Consolidated lint/typecheck, 784 unit tests, 30 D1 integration tests, production build and packaging passed on code `6dcc9fd`; known-credential scans passed. See the execution report. Later changes in this preparation are documentation only.
- [ ] Owner completes the latest candidate's local Playwright run; the older successful run remains historical evidence.
- [ ] Review the fresh full-data/account/reverse-recovery rehearsal and finish owner-controlled existing-password/Google/browser checks. Synthetic legacy-library compatibility is not an actual owner's login.
- [ ] Accept workload and account-wide Free resource headroom; current partial-day samples do not prove sustained capacity. Budget preview/probes alongside production and retain no-paid-fallback behavior.
- [ ] Review Google publishing, exact production credentials, maintenance presentation, callback/cookie behavior and critical provider failures. No additional real messages/issues/paid generations are sent by generic checks.
- [ ] Record operator, rollback owner, exact maintenance window and measured downtime expectation. Confirm final backup retention and the provider's exact renewal/cancellation deadline.

## Import, backup and routing order

Follow [the cutover procedure](CLOUDFLARE_CUTOVER.md): freeze all old app/auth/session writers, take a final verified archive and consistent export, import once into the explicitly identified empty production D1, and require full reconciliation. The fresh rehearsal snapshot is not the final cutover snapshot; production remains writable until that window.

Deploy the pinned production build with maintenance enabled. With the imported dataset validated, run the private vault's first manual production backup and independently recover its downloaded artifact. Record the exact database readiness flag and enable scheduling only after recovery succeeds. This can be done while maintenance remains enabled so a validated recovery point exists before new D1 user writes.

Only after the owner accepts the concrete go/no-go record, switch the reviewed website route, open traffic and verify critical existing-account, auth, content, write/admin and mail behavior. Record the first production D1 write. Old app writers remain stopped, including access through stale hostnames.

## Retirement conditions

Keep the old TWE deployment recoverable for at least seven successful observation days. The owner identified the separate landing service as a disposable dummy and approved discontinuing it; its two containers were stopped and restart disabled, with files/volumes retained. It no longer needs a Cloudflare migration or separate account-access task.

After successful observation and explicit retirement sign-off, remove obsolete access/Tunnel/deploy configuration and cancel renewal before the confirmed deadline. VM/backup deletion follows the accepted retention decision. A post-write rollback must preserve and reconcile D1-only writes; a DNS-only rollback is insufficient.
