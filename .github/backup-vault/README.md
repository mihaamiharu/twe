# TWE private recovery vault

This repository runs recovery exports and retains encrypted artifacts privately. Keep it private with owner-only write access and no untrusted pull-request workflows. The public application repository remains public and contains the reviewed backup tooling, not recovery archives or credential values.

The workflow fails closed if the repository is public or is not `mihaamiharu/twe-backups`. It runs only from the default branch, checks out the separately approved full `mihaamiharu/twe` tooling SHA and uploads exactly an encrypted archive, its checksum and a non-secret manifest. Never add plaintext exports or recovery keys to Git or artifacts.

## Configuration

Use repository secrets/variables on GitHub Free; private environment protection requires a different plan. Do not upgrade the account for this setup. Maintain owner-only write access, reviewed workflow/pin changes, SHA-pinned actions and read-only workflow permissions.

Secrets: `CLOUDFLARE_D1_EXPORT_TOKEN`, `TWE_BACKUP_KEY_PREVIEW`, `TWE_BACKUP_KEY_PRODUCTION`.

Variables: `CLOUDFLARE_ACCOUNT_ID`, `TWE_BACKUP_SOURCE_SHA`, `TWE_BACKUP_KEY_ID_PREVIEW`, `TWE_BACKUP_KEY_ID_PRODUCTION`.

Production scheduling is disabled while `TWE_BACKUPS_ENABLED` is absent/false. Do not set `TWE_PRODUCTION_BACKUP_READY` until approved production import/cutover; set it to the exact migrated database UUID before the manual production recovery rehearsal. Enable scheduling only after that artifact independently recovers successfully. Preview is manual only.

The export credential has the explicitly approved Account → D1 → Edit permission on the TWE account because native export rejected D1 Read. It can modify/delete D1 resources; protect its custody accordingly. It needs no Workers, DNS, billing, user or other-account permissions.

## Cost and recovery

Use standard Linux runners only. Each job has a ten-minute timeout; each encrypted archive is capped at 4 MiB and retained 30 days. At two production runs daily this bounds archive storage to about 240 MiB plus small ZIP/metadata overhead. Other account usage still counts: confirm actual account-wide Actions/storage allowance and a blocking $0 spending control (or no payment method) before activation. Caps alone do not guarantee zero charges. Failure due to a cost/quota block is a backup incident, not permission to enable paid overage.

Download the matching artifact; verify GitHub's ZIP digest and the archive checksum, key/target/database/source metadata. Independently decrypt using the owner's retained login-Keychain record, run schema-first preparation and restore into an empty isolated D1 target. Reconcile full rows, FK/quick_check and freeze enforcement. Retain old keys for old archives. Never overwrite live data as part of a rehearsal.

The public application's `docs/CLOUDFLARE_BACKUPS.md` contains the tooling commands and broader recovery runbook. Keep sensitive evidence and credential values outside either repository.
