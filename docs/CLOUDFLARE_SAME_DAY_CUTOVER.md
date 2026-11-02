# Same-day cutover and VPS reuse

Owner direction, November 2, 2026: remove the seven-day retirement hold. The website has low traffic and the VPS is needed for remote development. Retire the TWE hosting stack after immediate cutover/recovery checks pass, while keeping the VM available for development. This plan does not call for VM cancellation, reinstallation, disk wiping or deletion of recovery assets.

This supersedes the time-based hold in earlier reports. Monitoring continues after the move on Cloudflare; it does not require the old stack to stay running or reserve the machine. Strict $0 Cloudflare hosting and no paid fallback remain in force.

## Starting point

- Google OAuth is published with only basic identity scopes. Separate production credentials are installed in the standby Worker.
- Worker `twe-production`, version `33f1caae-74a3-4089-ac53-b124dde1bfae`, contains the exact tested `6dcc9fd` artifact. Maintenance is uploaded; workers.dev/preview URLs are disabled and no website route is attached.
- Production D1 `6f6630be-ed32-4d07-ba24-24d45bb160c9` is empty. The VPS is still the live writable production source.
- Consolidated unit/integration/build checks and the owner's E2E run already have evidence. The single reported leaderboard failure has a focused passing fix. Do not repeat full suites for this operational plan.
- Source data/account compatibility and reverse recovery passed in isolation. Actual migrated owner login and production backup recovery remain cutover checks.

## Ordered execution

| Step | Action | Required result |
| --- | --- | --- |
| 1. Final preflight | Refresh source revision/schema, Worker version/maintenance/secret names, exact D1 target and current website routing. Confirm Free/account usage and private backup workflow access. Keep preview protected and avoid recurring probes or another continuously busy application object. | No unexplained drift; source remains live until the window starts; no new paid settings or credential grants needed. |
| 2. Freeze and retain recovery | Stop `twe-app`, verify all application/auth/session/admin writers are unavailable, leave PostgreSQL available for export, then take the final consistent archive and normalized export. Copy and checksum recovery assets off the VPS, retaining schema, app/image provenance and exact routing/configuration privately. | No competing writers; all acknowledged source writes are in the final export; recovery does not depend on this VM. |
| 3. Import and reconcile | Apply reviewed migrations to the identified empty production D1; import the final snapshot once. Validate every supported row/column, counts/hashes, foreign keys and integrity. | Zero unexplained differences. Keep maintenance enabled; never reset or overwrite learner data to make a check pass. |
| 4. Prove production recovery | Mark only the exact migrated UUID ready in the private backup vault; run one manual production backup, download and independently decrypt using the owner's Keychain key, restore into an isolated local D1 target and reconcile fully. Then enable the existing production backup schedule. | A verified off-VPS production recovery point and correctly configured automation. Record the run and later verify the first scheduled run; that later run is not a mandatory hold on VPS reuse. |
| 5. Switch the website | Attach only the reviewed website routing to the production Worker. Preserve mail/unrelated DNS. Check the deployed maintenance response, then disable maintenance and record the first D1 production write. | Cloudflare is the only writable production source; old hostnames cannot reach an active VPS writer. |
| 6. Immediate acceptance | Check en/id public content/assets/OG/editor, existing password login and Google linkage, user ID/role/progress/session behavior, a controlled progress write and admin access. Inspect Worker/object errors, CPU/memory and D1 usage. Review existing mail/intake/AI configuration and prior delivery evidence; generic smoke checks do not send additional real messages/issues or generate extra paid hints. | Critical flows pass. The owner performs real-account/password/Google interaction without sharing credentials. Only relevant failed checks are rerun. |
| 7. Release the VPS | After immediate acceptance and verified off-VPS recovery, stop and disable restart for the inventoried TWE app, PostgreSQL and Tunnel services. Remove only obsolete TWE deployment hooks/access after checking they are not shared. Confirm the public site works with these services stopped and CPU/memory is released. | The VM is available for remote development the same day; Cloudflare has no VPS dependency. Stopped volumes/files are not automatically deleted. |

Proposed planning allowance: one maintenance window of up to 60 minutes, with the owner available for account checks. This is a planning budget, not a measured remote migration/RTO guarantee. Record the actual start/end and operator/rollback owner when executing. If validation or recovery fails before user writes are opened, keep the new target closed and restore the old frozen source as the only writer; do not reclaim its services first.

## Recovery after VPS reuse

Retain the final source archive, checked artifacts/schema, routing record and recovery instructions outside the VM. Proposed retention for this cutover package is at least 30 days; no automatic deletion is included. Keep recovery keys separately in the owner Keychain. The private D1 schedule retains encrypted artifacts for 30 days under its existing cap and blocking $0 controls.

If a critical issue occurs after D1 accepts writes, enable maintenance, drain work, freeze D1 and export its latest data. Recover using the retained tooling into a fresh isolated PostgreSQL/D1 target and reconcile D1-only writes before restoring a sole writable origin. The fresh target can be local or on separate capacity; rollback cannot assume the repurposed VPS still has an untouched running deployment. A DNS-only rollback to stale PostgreSQL would lose new writes and is excluded.

Continue reviewing live auth/write errors, Free quotas and backups after the move. Investigate any failed backup or artifact older than 24 hours. There is no seven-day delay before VPS reuse. Disk/volume deletion and VM cancellation are separate destructive/billing actions and are not needed to free CPU/memory for development.

## Completion record

Record final source snapshot identity and reconciliation, deployed version, old/new routing, first D1 write, production backup/restore evidence, owner account checks, resource/error results, stopped service identities, off-VPS recovery custody and actual downtime. Update #256/#257 with sanitized evidence only after execution. Existing standby evidence is not proof that these production steps have run.
