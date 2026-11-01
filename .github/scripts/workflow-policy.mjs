import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const privateGuard =
  "github.repository == 'mihaamiharu/twe-backups' && github.event.repository.private == true && (github.event_name == 'workflow_dispatch' || vars.TWE_BACKUPS_ENABLED == 'true')";
const archiveFiles = [
  '.wrangler/encrypted-backup/database.enc',
  '.wrangler/encrypted-backup/database.enc.sha256',
  '.wrangler/encrypted-backup/database.enc.manifest.json',
];
const ownedPaths = [
  '/.github/',
  '/scripts/backup*',
  '/scripts/backup/',
  '/scripts/migration/',
  '/scripts/json-config.ts',
  '/scripts/deploy-cloudflare.ts',
  '/scripts/build-cloudflare.ts',
  '/src/server.ts',
  '/src/runtime/',
  '/wrangler.jsonc',
  '/package.json',
  '/bun.lock',
  '/eslint.config.js',
];

export function document(text) {
  const parsed = parseDocument(text, { uniqueKeys: true });
  assert.equal(parsed.errors.length, 0, 'Workflow YAML is invalid.');
  return parsed.toJS({ maxAliasCount: 100 });
}

export function validatePublicBackup(workflow) {
  assert.deepEqual(
    Object.keys(workflow.on),
    ['workflow_dispatch'],
    'Public backup handoff must be manual-only.',
  );
  assert.deepEqual(
    workflow.permissions,
    {},
    'Public backup handoff must not grant token permissions.',
  );
  assert(
    !/\bsecrets\s*(?:\.|\[)|upload-artifact|backup-d1\.ts|d1 export/.test(
      JSON.stringify(workflow),
    ),
    'Public backup workflow must not access credentials or export/upload data.',
  );
  assert.deepEqual(Object.keys(workflow.jobs), ['handoff']);
  assert(
    workflow.jobs.handoff.steps.every(
      (step) => typeof step.run === 'string' && !step.uses,
    ),
  );
}

export function validateVault(workflow) {
  assert.deepEqual(Object.keys(workflow.on).sort(), [
    'schedule',
    'workflow_dispatch',
  ]);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(Object.keys(workflow.jobs), ['backup']);
  const job = workflow.jobs.backup;
  assert.equal(
    job.if,
    privateGuard,
    'Private-vault repository/visibility guard changed.',
  );
  assert.equal(job['runs-on'], 'ubuntu-latest');
  assert.equal(job['timeout-minutes'], 10);
  assert(
    !job.environment,
    'Free private vault must not rely on paid environment protection.',
  );
  const actions = job.steps.filter((step) => step.uses);
  assert(
    actions.every((step) => /^[\w/-]+@[a-f0-9]{40}$/.test(step.uses)),
    'Actions must use full commit pins.',
  );
  const checkout = actions.find((step) =>
    step.uses.startsWith('actions/checkout@'),
  );
  assert.equal(checkout.with.repository, 'mihaamiharu/twe');
  assert.equal(checkout.with.ref, '${{ steps.pin.outputs.source_sha }}');
  assert.equal(checkout.with['persist-credentials'], false);
  const uploads = actions.filter((step) =>
    step.uses.startsWith('actions/upload-artifact@'),
  );
  assert.equal(uploads.length, 1);
  assert.deepEqual(
    uploads[0].with.path.trim().split(/\s+/),
    archiveFiles,
    'Only the three exact encrypted outputs may be uploaded.',
  );
  assert.equal(uploads[0].with['retention-days'], 30);
  assert.equal(uploads[0].with['if-no-files-found'], 'error');
  const exportStep = job.steps.find(
    (step) => step.name === 'Export and authenticate-encrypt the exact target',
  );
  assert.equal(exportStep.env.TWE_BACKUP_MAX_BYTES, '4194304');
  assert.equal(
    exportStep.env.CLOUDFLARE_API_TOKEN,
    '${{ secrets.CLOUDFLARE_D1_EXPORT_TOKEN }}',
  );
  assert(
    exportStep.env.TWE_BACKUP_KEY.includes(
      "secrets[inputs.target == 'preview'",
    ),
  );
  for (const step of job.steps) {
    if (step !== exportStep)
      assert(
        !/\bsecrets\s*(?:\.|\[)/.test(JSON.stringify(step)),
        'Credentials may exist only in the export step.',
      );
  }
}

export function validateOwners(text) {
  const rules = text
    .split('\n')
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/));
  assert(
    rules.every((rule) => rule.length === 2 && rule[1] === '@mihaamiharu'),
    'Security ownership must remain with the owner.',
  );
  for (const pattern of ownedPaths)
    assert(
      rules.some((rule) => rule[0] === pattern),
      'Required security ownership coverage is missing.',
    );
}

function main() {
  validatePublicBackup(
    document(readFileSync('.github/workflows/backup-cloudflare.yml', 'utf8')),
  );
  validateVault(
    document(readFileSync('.github/backup-vault/backup.yml', 'utf8')),
  );
  validateOwners(readFileSync('.github/CODEOWNERS', 'utf8'));
  const base = process.env.TWE_POLICY_BASE_SHA,
    head = process.env.TWE_POLICY_HEAD_SHA;
  let files;
  if (base && head) {
    assert(
      /^[a-f0-9]{40}$/.test(base) && /^[a-f0-9]{40}$/.test(head),
      'Invalid policy comparison revisions.',
    );
    files = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMR', '-z', base, head],
      { encoding: 'utf8' },
    ).split('\0');
  } else
    files = execFileSync('git', ['ls-files', '-z', '.github/workflows'], {
      encoding: 'utf8',
    }).split('\0');
  files = files.filter(
    (file) => file.startsWith('.github/workflows/') && /\.ya?ml$/.test(file),
  );
  files.push('.github/backup-vault/backup.yml');
  assert(
    process.env.TWE_ACTIONLINT_BINARY,
    'Specify the independently verified actionlint binary.',
  );
  execFileSync(process.env.TWE_ACTIONLINT_BINARY, ['-shellcheck=', ...files], {
    stdio: 'inherit',
  });
  console.log(
    'Workflow policy passed: private vault, public handoff, owner coverage and changed-workflow lint.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof assert.AssertionError
        ? error.message
        : 'Workflow policy failed; inspect the reviewed workflow diff.',
    );
    process.exitCode = 1;
  }
}
