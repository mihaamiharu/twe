import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  document,
  validatePublicBackup,
  validateVault,
  validateOwners,
} from './workflow-policy.mjs';

test('public handoff cannot regain credential or archive access', () => {
  const workflow = document(
    readFileSync('.github/workflows/backup-cloudflare.yml', 'utf8'),
  );
  validatePublicBackup(workflow);
  for (const expression of [
    'secrets.TWE_BACKUP_KEY',
    'toJSON(secrets)',
    "SECRETS['TWE_BACKUP_KEY']",
  ]) {
    const exposed = structuredClone(workflow);
    exposed.jobs.handoff.steps.push({ run: `echo \${{ ${expression} }}` });
    assert.throws(() => validatePublicBackup(exposed));
  }
});
test('vault rejects public visibility, movable source, broad uploads and credential exposure', () => {
  const original = document(
    readFileSync('.github/backup-vault/backup.yml', 'utf8'),
  );
  validateVault(original);
  const visibility = structuredClone(original);
  visibility.jobs.backup.if = "github.repository == 'mihaamiharu/twe-backups'";
  assert.throws(() => validateVault(visibility));
  const movable = structuredClone(original);
  movable.jobs.backup.steps.find((step) =>
    step.uses?.startsWith('actions/checkout@'),
  ).with.ref = 'main';
  assert.throws(() => validateVault(movable));
  const broad = structuredClone(original);
  broad.jobs.backup.steps.find((step) =>
    step.uses?.startsWith('actions/upload-artifact@'),
  ).with.path = '.wrangler/**';
  assert.throws(() => validateVault(broad));
  const exposure = structuredClone(original);
  exposure.jobs.backup.steps.unshift({
    run: 'echo ${{ secrets.TWE_BACKUP_KEY_PREVIEW }}',
  });
  assert.throws(() => validateVault(exposure));
});
test('owner coverage cannot be silently reassigned', () => {
  const original = readFileSync('.github/CODEOWNERS', 'utf8');
  validateOwners(original);
  assert.throws(() => validateOwners(original + '\n/.github/ @untrusted\n'));
});
