# Backup automation and recovery-key setup

This plan prepares D1 backups without a VPS, paid service or production cutover. Production still uses PostgreSQL on the VPS. Do not enable the D1 production schedule against the empty migration candidate.

## Plan and activation order

1. Create independent preview/production AES-256 recovery keys in the owner's macOS login Keychain; verify readback. Keep the private recovery records, which contain identifiers but no key values.
2. Validate authenticated archive metadata, legacy decryption, wrong-key/tamper rejection, exact resource selection and the production-readiness guard.
3. Install the workflow in the owner-controlled private `mihaamiharu/twe-backups` default branch. Its checked-out public backup code is pinned separately to a reviewed full release-branch commit SHA. A manual request must match that pin. The public application workflow is only a credential-free handoff.
4. Configure private-vault repository secrets and variables; GitHub Free private environments do not provide the public repository’s environment protections. Restrict vault write access to the owner. Use a separate TWE-account-scoped D1 export token and the matching recovery key. The native export rejected D1 Read; the owner explicitly approved D1 Edit after reviewing its broader database modification/deletion capability. Do not copy the broader CLI OAuth credential or deployment token.
5. Run the preview workflow, download its encrypted artifact and recover it using the independent Keychain copy. Record the run URL and restore evidence.
6. After approved production cutover/import, set production readiness to the exact production database UUID, run a manual production backup and independently recover its artifact, then enable scheduling. Do not set those flags during preparation.

## Owner key custody

The owner selected this Mac's **login Keychain**. Each key has a unique service name beginning `com.testingwithekki.d1-backup`, an account equal to its database UUID, and a public SHA-256 key ID. The helper sends new key material to `/usr/bin/security` over stdin, never process arguments or shell history, and does not allow all-application access or overwrite old entries. Keys are never printed. Private recovery JSON files hold metadata only, mode 0600 inside a mode-0700 directory outside Git.

```sh
# Init is exclusive: retain the resulting record and old Keychain entries.
bun run cf:backup:keys init /absolute/private/preview-recovery.json preview
bun run cf:backup:keys init /absolute/private/production-recovery.json production
bun run cf:backup:keys status /absolute/private/preview-recovery.json

# The matching key is injected only into the child backup/recovery command.
bun run cf:backup:keys run /absolute/private/preview-recovery.json -- bun --no-env-file scripts/backup-d1.ts backup preview /absolute/private/new-backup.enc
bun run cf:backup:keys run /absolute/private/preview-recovery.json -- bun --no-env-file scripts/backup-d1.ts decrypt /absolute/private/new-backup.enc /absolute/private/decrypted.sql
bun run cf:backup:prepare-restore /absolute/private/decrypted.sql /absolute/private/new-restore.sql
```

The Keychain copy is independent of GitHub and its artifact storage. Keep a second owner-controlled offline/password-manager copy if loss of this Mac would otherwise lose recovery access. Never put that copy beside exported SQL or upload it to Actions artifacts. A replacement Mac must recover/import the matching old key before older archives can decrypt. `run` is a secret-injection tool: use it only with trusted backup/recovery commands, never commands that print their environment.

## GitHub configuration

The private vault needs these **repository** settings. Never restore backup secret copies in the public app.

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_D1_EXPORT_TOKEN` | Dedicated TWE-account D1 Edit export token |
| Secret | `TWE_BACKUP_KEY_PREVIEW` | Matching owner-Keychain preview key |
| Secret | `TWE_BACKUP_KEY_PRODUCTION` | Matching owner-Keychain production key |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Account pinned in `wrangler.jsonc` |
| Variable | `TWE_BACKUP_SOURCE_SHA` | Reviewed immutable public backup tooling SHA |
| Variable | `TWE_BACKUP_KEY_ID_PREVIEW` | Matching preview SHA-256 key ID |
| Variable | `TWE_BACKUP_KEY_ID_PRODUCTION` | Matching production SHA-256 key ID |
| Variable, later only | `TWE_PRODUCTION_BACKUP_READY` | Exact migrated production database UUID |
| Variable, later only | `TWE_BACKUPS_ENABLED` | `true` only after production recovery sign-off |

The last two flags are currently absent. The installed workflow also refuses execution outside the private vault's default branch or after a visibility change. It pins action revisions, uses read-only `GITHUB_TOKEN`, disables checkout credential persistence and caps jobs at 10 minutes. Export credentials/keys are supplied only to the export step. The source pin prevents manual dispatch from choosing arbitrary code to receive secrets. Its D1 Edit token permits database modification/deletion because native export rejected D1 Read; it must never be described as read-only. All plaintext SQL is temporary/private and removed after authenticated encryption. Upload paths list exactly the encrypted archive, checksum and non-secret manifest. See the [vault template and runbook](../.github/backup-vault/README.md).

## Schedule, retention and failure handling

The schedule is 02:15 and 14:15 Asia/Jakarta, with 30-day retention. GitHub scheduling is best-effort; this is a nominal 12-hour cadence providing margin for the proposed 24-hour RPO, not a delivery guarantee. Verify Actions failure notifications for the owning account and review the latest successful artifact timestamp. Any missed/failed backup or an artifact older than 24 hours is an incident; retry only after resolving the cause and verify the next recovery point.

Each archive defaults to a 4 MiB encrypted size cap. At the nominal cadence, 60 retained archives would consume at most about 240 MiB plus small manifests/checksums. Current preview archives are about 200 KB. This bounds this workflow's output, not account-wide artifact usage or billing; review all other repositories/artifacts before changing the cap, cadence or retention. Exceeding the cap fails rather than silently growing storage. No paid plan or overage is enabled by this setup.

## Recovery and rotation

New v2 archives authenticate target, database UUID, backup-code SHA, key ID and timestamp as well as ciphertext. The checksum detects transfer damage; GCM authentication detects unauthorized content/metadata changes. Older v1 archives retain support with their original keys. Use the manifest/key ID to select the owner record, verify the archive checksum, authenticate-decrypt outside Git, prepare schema-first SQL, then restore into an empty isolated D1 target and reconcile complete rows/integrity/freeze behavior. Neither successful decryption nor a code rollback authorizes overwriting live data.

Rotate by creating a **new** private record/Keychain entry, installing the new key and matching key ID together, and verifying a preview/manual backup plus independent recovery before relying on it. Retain old keys for all retained archives; replacing a GitHub secret does not re-encrypt old backups. Revoke/replace a compromised API token separately. Do not delete old owner keys automatically.

## Current evidence and remaining activation

Independent preview/production Keychain entries were created and read back on November 1. The preview key completed remote export, v2 encryption, checksum verification, independent Keychain decryption, schema-first preparation and fresh isolated local workerd/D1 restore. All 214 rows across 18 tables matched the decrypted archive, integrity/FK checks passed, and all 48 freeze triggers survived and enforced a blocked write. The production key cannot decrypt that preview artifact, and the unmigrated production backup is blocked before export. Plaintext SQL and disposable local state were removed. Focused crypto/restore tests and workflow validation cover the implementation. See [the setup report](reports/cloudflare-backup-setup-20261101.json), including the development-rehearsal source-pin limitation.

The original public workflow bootstrap [PR #258](https://github.com/mihaamiharu/twe/pull/258) and synthetic [run 41317166118](https://github.com/mihaamiharu/twe/actions/runs/41317166118) remain historical evidence. Future production backup artifacts must use private storage.

On November 2, Jakarta time, the owner approved private-vault credential migration. Private [run 41357633519](https://github.com/mihaamiharu/twe-backups/actions/runs/41357633519) completed in 23 seconds using tooling `ab24af9e873c86476bf2b91bb940095cd27283ff`. Its ZIP digest was `64ea65aef25957aa279b62a182dafd277d8eb087634745fd9dea7c256a2c719b`. The exact three encrypted outputs, archive checksum/metadata, independent Keychain decryption, 214-row/18-table local D1 reconciliation, integrity/FK checks and 48 enforced freeze triggers passed. Plaintext and disposable local state were removed. Only after that recovery passed were all four public backup-secret copies removed and the old `TWE automated D1 backup export` token revoked. The new token is confined to the private vault; the two independent owner-Keychain entries remain intact.

The actual account is GitHub Free with an existing account-wide $0 Actions budget marked Usage blocked. No billing settings were changed. Private Actions usage shares the account's included allowance; monitor other repositories too. The public handoff/workflow-review changes are in [hardening PR #260](https://github.com/mihaamiharu/twe/pull/260), pending owner review and merge. Production/QA environments and the VPS deployment remain unchanged. Production scheduling stays disabled until approved cutover/import, manual production backup and independent artifact recovery. Preview recovery does not establish production-scale RTO or authorize VPS retirement.
