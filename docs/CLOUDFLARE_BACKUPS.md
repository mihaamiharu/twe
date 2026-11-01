# Backup automation and recovery-key setup

This plan prepares D1 backups without a VPS, paid service or production cutover. Production still uses PostgreSQL on the VPS. Do not enable the D1 production schedule against the empty migration candidate.

## Plan and activation order

1. Create independent preview/production AES-256 recovery keys in the owner's macOS login Keychain; verify readback. Keep the private recovery records, which contain identifiers but no key values.
2. Validate authenticated archive metadata, legacy decryption, wrong-key/tamper rejection, exact resource selection and the production-readiness guard.
3. Install the workflow on the default branch through a workflow-only bootstrap PR. Its checked-out backup code is pinned separately to a reviewed full release-branch commit SHA. A manual request must match that pin.
4. Configure dedicated `cloudflare-backups-preview` and `cloudflare-backups-production` environments, restricted to workflows on `main`. Use a separate TWE-account-scoped D1 export token and the matching recovery key. The native export rejected D1 Read; the owner explicitly approved D1 Edit after reviewing its broader database modification/deletion capability. Do not copy the broader CLI OAuth credential or deployment token.
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

Each backup environment needs:

| Kind                | Name                          | Value                                                                                       |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Secret              | `CLOUDFLARE_D1_EXPORT_TOKEN`  | Dedicated D1 Edit token scoped only to the TWE account; owner-approved native export access |
| Secret              | `TWE_BACKUP_KEY`              | Matching 32-byte canonical base64 key from the owner's Keychain                             |
| Variable            | `CLOUDFLARE_ACCOUNT_ID`       | Account ID pinned in `wrangler.jsonc`                                                       |
| Variable            | `TWE_BACKUP_KEY_ID`           | Matching public `sha256:` key ID                                                            |
| Variable            | `TWE_BACKUP_SOURCE_SHA`       | Reviewed full SHA containing the backup tooling/config                                      |
| Production variable | `TWE_PRODUCTION_BACKUP_READY` | Production D1 UUID, set only after cutover/import readiness                                 |

Repository variable `TWE_BACKUPS_ENABLED=true` enables scheduled **production** runs. Leave it absent/false during preparation. Preview is manual only. Environment branch restrictions should allow `main` only; use no per-run reviewers for unattended backups. Do not remove protections from unrelated deployment environments. The production database UUID guard is enforced in the backup CLI too, including manual local runs.

On November 1, a dedicated D1 Read token verified as active and could read preview database metadata (HTTP 200), but both the direct native SQL export endpoint and Wrangler export failed with HTTP 401 / Cloudflare code 10000. After explicit owner approval, the same token was limited to Account → D1 → Edit on account `d5f9db115e5d7b5156bb210e04ecb34e`; native preview export then passed. This credential has database write/delete capability despite the backup workflow performing only exports. It has no Worker, DNS, billing, user or other-account permissions. The old read-token secret name was replaced by `CLOUDFLARE_D1_EXPORT_TOKEN` in both environments. Keep the environment restrictions and reviewed source pin in place; do not describe this credential as read-only.

The workflow uses pinned action revisions, read-only `GITHUB_TOKEN`, checkout without persisted Git credentials, and a 15-minute timeout. Cloudflare credentials/recovery keys are present only in the export step. Its source SHA comes from the protected environment variable; dispatch cannot select arbitrary code to receive secrets. All SQL is temporary/private and removed after authenticated encryption. Upload paths list only the encrypted archive, its checksum and a non-secret manifest.

## Schedule, retention and failure handling

The schedule is 02:15 and 14:15 Asia/Jakarta, with 30-day retention. GitHub scheduling is best-effort; this is a nominal 12-hour cadence providing margin for the proposed 24-hour RPO, not a delivery guarantee. Verify Actions failure notifications for the owning account and review the latest successful artifact timestamp. Any missed/failed backup or an artifact older than 24 hours is an incident; retry only after resolving the cause and verify the next recovery point.

Each archive defaults to a 4 MiB encrypted size cap. At the nominal cadence, 60 retained archives would consume at most about 240 MiB plus small manifests/checksums. Current preview archives are about 200 KB. This bounds this workflow's output, not account-wide artifact usage or billing; review all other repositories/artifacts before changing the cap, cadence or retention. Exceeding the cap fails rather than silently growing storage. No paid plan or overage is enabled by this setup.

## Recovery and rotation

New v2 archives authenticate target, database UUID, backup-code SHA, key ID and timestamp as well as ciphertext. The checksum detects transfer damage; GCM authentication detects unauthorized content/metadata changes. Older v1 archives retain support with their original keys. Use the manifest/key ID to select the owner record, verify the archive checksum, authenticate-decrypt outside Git, prepare schema-first SQL, then restore into an empty isolated D1 target and reconcile complete rows/integrity/freeze behavior. Neither successful decryption nor a code rollback authorizes overwriting live data.

Rotate by creating a **new** private record/Keychain entry, installing the new key and matching key ID together, and verifying a preview/manual backup plus independent recovery before relying on it. Retain old keys for all retained archives; replacing a GitHub secret does not re-encrypt old backups. Revoke/replace a compromised API token separately. Do not delete old owner keys automatically.

## Current evidence and remaining activation

Independent preview/production Keychain entries were created and read back on November 1. The preview key completed remote export, v2 encryption, checksum verification, independent Keychain decryption, schema-first preparation and fresh isolated local workerd/D1 restore. All 214 rows across 18 tables matched the decrypted archive, integrity/FK checks passed, and all 48 freeze triggers survived and enforced a blocked write. The production key cannot decrypt that preview artifact, and the unmigrated production backup is blocked before export. Plaintext SQL and disposable local state were removed. Focused crypto/restore tests and workflow validation cover the implementation. See [the setup report](reports/cloudflare-backup-setup-20261101.json), including the development-rehearsal source-pin limitation.

The owner approved and configured both GitHub backup environments, matching Keychain recovery-key secrets, account/source/key-ID variables, and the dedicated D1 export token. Each environment allows only the `main` branch. The production-readiness variable remains absent and scheduling remains disabled. The export token passed a native preview export after the explicitly approved D1 Edit adjustment.

The owner approved workflow-only [bootstrap PR #258](https://github.com/mihaamiharu/twe/pull/258), merged as `8b7db868ff48556b9a4a6400de1a73ea78cd4a4e` with an explicit `[skip ci]` squash message. Only the backup workflow was added to `main`; branch protections were unchanged. No CI/VPS deployment run was started for that merge. Application migration work remains on the release branch.

[Preview Actions run 41317166118](https://github.com/mihaamiharu/twe/actions/runs/41317166118) passed in 22 seconds using approved tooling source `ab24af9e873c86476bf2b91bb940095cd27283ff`. Both backup environments retain this exact verified tooling pin; the later setup/evidence changes do not change the CLI implementation. The 201,355-byte downloaded ZIP matched GitHub's digest and contained exactly the encrypted archive, checksum and non-secret manifest. Its archive checksum, target/database/source/key IDs and independent Keychain decryption passed. Fresh isolated local workerd/D1 restore reconciled all 214 rows across 18 tables; integrity/FK checks and all 48 freeze triggers passed. Recovery plaintext and disposable state were removed. See [the Actions recovery report](reports/cloudflare-actions-backup-recovery-20261101.json).

Manual preview backup/recovery is verified. The existing production/qa environments and VPS deployment were not modified. Repository `TWE_BACKUPS_ENABLED` and production `TWE_PRODUCTION_BACKUP_READY` are absent; production scheduling stays disabled until the later approved cutover/import, manual production backup and independent artifact recovery. The preview rehearsal does not establish production-scale recovery timing or authorize VPS retirement.
