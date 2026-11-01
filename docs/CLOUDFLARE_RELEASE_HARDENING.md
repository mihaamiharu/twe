# Production backup security and readiness plan

Scope: finish the security/readiness workstreams before cutover. Keep strict $0, the single AppRuntime compute boundary and D1 business storage. Do not switch traffic, import production data, enable production backups, change paid plans or retire the VPS. The owner reserves the full Playwright release run; use focused checks and bounded synthetic preview traffic here.

## 1. Private recovery storage and workflow review

- [x] Create owner-controlled private `mihaamiharu/twe-backups`; verify actual GitHub Free and the existing account-wide $0 Actions budget with paid usage blocked. No billing settings were changed.
- [x] Install a default-branch-only workflow which also refuses to run if the vault becomes public. Check out only a reviewed immutable public backup-tooling revision. Use separate preview/production recovery keys, account-scoped D1 export access, encrypted-only artifacts, a 4 MiB cap and 30-day retention. Production readiness/scheduling stay unset. Vault commit: `50543d3`; credential activation/recovery is a separate pending gate.
- [ ] Use repository secrets if GitHub Free's private-environment restrictions apply; do not assume public-repository environment protection transfers to a private repository. Keep vault write access limited to the owner and existing trusted account integrations.
- [ ] Run a private preview backup, verify ZIP/checksum/metadata, independently decrypt with the owner Keychain copy and restore into disposable local D1. Keep old recovery keys.
- [ ] After private recovery passes, retire the public backup export path and remove its backup credentials. Revoke the old dedicated export token after the replacement is verified. The existing public artifact contains synthetic preview data only; it is not production backup storage.
- [ ] Add CODEOWNERS coverage for workflow, backup, deployment/runtime and dependency files, plus a named always-reporting workflow-policy check. Require owner review for workflow changes without bypassing branch protection. Open the hardening PR from the existing contributor fork so the owner can review it; do not add new write collaborators just to satisfy review.
- [ ] Keep infrastructure/docs-only changes separate from application CI/VPS deployment; preserve application checks for runtime changes. Merge only the reviewed bootstrap changes to main; keep the application migration on the release branch.

## 2. Strict-$0 and hosted readiness

- [x] Read Cloudflare Workers plans: Free is explicitly marked Current plan. No upgrade/trial was selected.
- [ ] Capture a fresh account-wide Worker/DO/D1 usage and resource inventory with metric units, sampling limitations and daily headroom.
- [ ] Add non-sensitive AppRuntime boot evidence and verify actual cold vs warm requests after preview deployment, without introducing extra always-active objects or a remote administrative endpoint.
- [ ] Run bounded synthetic route/security/cache/role/Unicode-OG checks with explicit concurrency/request caps; inspect gateway CPU, object memory/duration and error counts separately. Do not claim production p99 or capacity from small samples.
- [ ] Verify independent external provider flows where credentials and explicit delivery permission exist. Keep real emails/issues and billable upstream calls out of generic smoke runs.
- [ ] Revisit Google project access. The already signed-in historical setup account currently hits Google Cloud's mandatory MFA gate; the owner must complete MFA enrollment before its project inventory can be inspected. Do not assume project deletion or remove Google login.
- [ ] Record each gate as passed, failed or blocked with evidence and a concrete next action. Cutover and VPS retirement remain separate owner decisions.

Read-only VPS inventory also found a separate application/gateway stack on the same machine. Finishing TWE cutover alone will not make the VM safe to delete. Resolve that workload's retention/migration before whole-machine retirement; no unrelated container was changed. Bounded TWE application-log inspection found no complete request meter, so absence of request logs is not a zero-traffic forecast.

The new operator commands are `cf:audit:free /private/report.json` for account-wide read-only usage/inventory, and `cf:measure:preview /private/access.json /private/accounts.json /private/report.json` for a maximum 100-request, eight-task synthetic HTTP study. The latter does not call mail, Google, AI or GitHub delivery and does not replace owner browser/E2E release verification.

## Access and activation boundaries

GitHub currently asks the owner for fresh access verification. Prepare and validate code before requesting the final credential/permission changes. At activation, obtain the browser policy's action-time approval for the exact new vault credential destination, replacement D1 Edit token and branch-protection changes. Complete any Google authentication/MFA or terms prompts with the owner as required. Do not print credentials or put private access/billing screenshots in the public repository.

Private backups still consume account-wide Actions compute/storage allowances. Confirm actual billing controls; workflow caps alone are not proof of a $0 bill. Current pricing/feature references: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [environment availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
