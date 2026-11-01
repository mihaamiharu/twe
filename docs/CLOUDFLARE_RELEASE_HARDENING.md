# Production backup security and readiness plan

Scope: finish the security/readiness workstreams before cutover. Keep strict $0, the single AppRuntime compute boundary and D1 business storage. Do not switch traffic, import production data, enable production backups, change paid plans or retire the VPS. The owner reserves the full Playwright release run; use focused checks and bounded synthetic preview traffic here.

## 1. Private recovery storage and workflow review

- [x] Create owner-controlled private `mihaamiharu/twe-backups`; verify actual GitHub Free and the existing account-wide $0 Actions budget with paid usage blocked. No billing settings were changed.
- [x] Install a default-branch-only workflow which also refuses to run if the vault becomes public. Check out only a reviewed immutable public backup-tooling revision. Use separate preview/production recovery keys, account-scoped D1 export access, encrypted-only artifacts, a 4 MiB cap and 30-day retention. Production readiness/scheduling stay unset. Vault commit: `50543d3`; private run `41357633519` and independent recovery passed. Both vault keys/export token are installed, all four public backup-secret copies are removed, and the old dedicated export token is revoked.
- [x] Use repository secrets if GitHub Free's private-environment restrictions apply; do not assume public-repository environment protection transfers to a private repository. Keep vault write access limited to the owner and existing trusted account integrations.
- [x] Run a private preview backup, verify ZIP/checksum/metadata, independently decrypt with the owner Keychain copy and restore into disposable local D1. Keep old recovery keys.
- [x] After private recovery passes, retire the public backup export path and remove its backup credentials. Revoke the old dedicated export token after the replacement is verified. The existing public artifact contains synthetic preview data only; it is not production backup storage.
- [ ] Add CODEOWNERS coverage for workflow, backup, deployment/runtime and dependency files, plus a named always-reporting workflow-policy check. Require owner review for workflow changes without bypassing branch protection. Use only the personal `mihaamiharu` account and GitHub plugin/browser for PRs. Owner inspection precedes merge; do not add collaborators or use a work account to manufacture a second reviewer.
- [ ] Keep infrastructure/docs-only changes separate from application CI/VPS deployment; preserve application checks for runtime changes. Merge only the reviewed bootstrap changes to main; keep the application migration on the release branch.

## 2. Strict-$0 and hosted readiness

- [x] Read Cloudflare Workers plans: Free is explicitly marked Current plan. No upgrade/trial was selected.
- [x] Capture a fresh account-wide Worker/DO/D1 usage and resource inventory with metric units, sampling limitations and daily headroom.
- [x] Add non-sensitive AppRuntime boot evidence and verify actual cold vs warm requests after preview deployment, without introducing extra always-active objects or a remote administrative endpoint.
- [x] Run bounded synthetic route/security/cache/role/Unicode-OG checks with explicit concurrency/request caps; inspect gateway CPU, object memory/duration and error counts separately. Do not claim production p99 or capacity from small samples.
- [ ] Verify independent external provider flows where credentials and explicit delivery permission exist. Keep real emails/issues and billable upstream calls out of generic smoke runs.
- [x] Revisit Google project access after owner-completed MFA. The historical setup account can list resources, but project `548549555288` remains inaccessible (`resourcemanager.projects.get` missing) and is absent from its active/pending-deletion inventory. This does not establish deletion. OAuth remains blocked.
- [x] Record each gate as passed, failed or blocked with evidence and a concrete next action. Cutover and VPS retirement remain separate owner decisions.

Read-only VPS inventory also found a separate application/gateway stack on the same machine. Finishing TWE cutover alone will not make the VM safe to delete. Resolve that workload's retention/migration before whole-machine retirement; no unrelated container was changed. Bounded TWE application-log inspection found no complete request meter, so absence of request logs is not a zero-traffic forecast.

The new operator commands are `cf:audit:free /private/report.json` for account-wide read-only usage/inventory, and `cf:measure:preview /private/access.json /private/accounts.json /private/report.json` for a maximum 100-request, eight-task synthetic HTTP study. The latter does not call mail, Google, AI or GitHub delivery and does not replace owner browser/E2E release verification.

## Evidence and remaining decisions

See [the November 2 evidence and gate report](reports/cloudflare-hardening-readiness-20261102.json). Actual Workers Free and GitHub Free/$0 blocked-paid-usage controls were verified in their dashboards without changing billing. The private vault is active for manual preview recovery. Personal [PR #260](https://github.com/mihaamiharu/twe/pull/260) has a passing policy check; main now requires that exact check from GitHub Actions, dismisses stale approvals, retains code-owner review and disallows administrator bypass. Its workflow-only handoff still awaits owner merge decision.

The 84-request/eight-task study passed HTTP/security/role checks and rendered 32 unique images. Visual inspection failed for non-Latin/emoji glyphs and long-title overflow. Object periodic peak memory reached 121,434,660 bytes, leaving only 6,565,340 bytes against a conservative decimal 128 MB budget; no exceeded-memory/CPU errors were observed, but capacity is not accepted. A separately tailed cold/warm pair proves a real boot and immediate reuse, not production p99. Do not call the first untailed study request cold.

The two approved Spacemail messages arrived and completed verification/reset flows; old password rejection/new login passed and the exact temporary preview account was removed. Google OAuth remains blocked on project access after MFA, and preview AI/GitHub credential names are absent. No billable AI request or GitHub issue-delivery test was sent. The owner still reserves the full E2E release run. Keep credentials, mailbox contents, raw request tails and private account/billing screenshots outside the public repository.

Private backups still consume account-wide Actions compute/storage allowances. Confirm actual billing controls; workflow caps alone are not proof of a $0 bill. Current pricing/feature references: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [environment availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
