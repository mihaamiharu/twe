# Encrypted D1 backups and recovery

Backup jobs run only in an owner-controlled private repository. The public workflow is a credential-free handoff; it must not export data, access backup keys or upload database artifacts. The [vault template](../.github/backup-vault/README.md) documents its pinned workflow and settings.

## Key custody and commands

Use independent AES-256 keys for preview and production, with an owner-held copy outside GitHub. On macOS, `backup-keys.ts` stores keys in login Keychain and keeps only identifiers in a private JSON record. Initialization creates a new entry and never overwrites an older key. Preserve the record and original key for every retained archive.

```sh
bun run cf:backup:keys init /absolute/private/preview-recovery.json preview
bun run cf:backup:keys status /absolute/private/preview-recovery.json
bun run cf:backup:keys run /absolute/private/preview-recovery.json -- bun --no-env-file scripts/backup-d1.ts backup preview /absolute/private/new-backup.enc
bun run cf:backup:keys run /absolute/private/preview-recovery.json -- bun --no-env-file scripts/backup-d1.ts decrypt /absolute/private/new-backup.enc /absolute/private/decrypted.sql
bun run cf:backup:prepare-restore /absolute/private/decrypted.sql /absolute/private/restore.sql
```

`run` injects the key only into its child process; use it only with trusted commands that do not print their environment. Keys and API credentials must not appear in shell arguments, logs or artifacts. Keep private files outside the checkout, with directories mode 0700 and files mode 0600. Retain an independent owner-controlled key copy for loss of the original machine.

## Private-vault settings

| Kind              | Names                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets           | `CLOUDFLARE_D1_EXPORT_TOKEN`, `TWE_BACKUP_KEY_PREVIEW`, `TWE_BACKUP_KEY_PRODUCTION`                                                    |
| Variables         | `CLOUDFLARE_ACCOUNT_ID`, `TWE_BACKUP_SOURCE_SHA`, `TWE_BACKUP_KEY_ID_PREVIEW`, `TWE_BACKUP_KEY_ID_PRODUCTION`                          |
| Production guards | `TWE_PRODUCTION_BACKUP_READY` equal to the exact production D1 UUID; `TWE_BACKUPS_ENABLED=true` only after independent recovery passes |

Native export needs a dedicated account-scoped D1 Edit token; this also permits database modification/deletion. Do not describe it as read-only or substitute a broader deployment/operator token. The immutable source SHA, key IDs and exact target must match the reviewed configuration. Manual dispatch cannot select arbitrary code to receive secrets.

The workflow refuses execution outside the private repository/default branch. Actions are pinned, checkout credentials are not persisted, and export credentials exist only in the export step. Only the encrypted archive, SHA-256 checksum and non-secret authenticated manifest are uploaded.

## Recovery and rotation

Verify the transfer checksum, select the matching key from the manifest and authenticate-decrypt outside Git. V2 archives authenticate the environment, D1 UUID, backup-code SHA, key ID and timestamp as well as ciphertext. Older v1 archives need their original keys.

Prepare schema-first SQL before restoration: raw D1 exports may interleave table creation and inserts. The preparation tool validates SQLite integrity/foreign keys and preserves indexes, views and freeze triggers. Restore into an empty isolated D1 target without applying migrations first; the dump includes migration history. Reconcile the full schema and all rows, test freeze enforcement and verify application behavior. Successful decryption alone does not establish recovery.

Rotate by creating a new record/key, updating the vault key and matching ID together, then verifying a manual backup and independent recovery. Keep old keys for retained archives; replacing a secret does not re-encrypt older backups. API token rotation is separate.

The template schedules two runs daily, retains artifacts for 30 days and caps each encrypted archive at 4 MiB. Scheduling is best-effort. Monitor the most recent successful artifact, failed/missed jobs and account-wide Actions/storage usage. A stale artifact needs investigation. Never restore over live data without a write freeze and an approved reconciliation plan.

Actual account identifiers, Keychain service names, backup run records and recovery evidence belong in the owner's local reference.
