import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const SCAN_DIRS = ['src', 'scripts', 'e2e', 'tools'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const BROAD_UNSAFE_ALLOWLIST = [
  'src/tests/',
  'e2e/',
  'src/core/executor/',
  'src/routeTree.gen.ts',
];

const ADAPTER_UNSAFE_ALLOWLIST = [
  'scripts/server.ts',
  'src/client.tsx',
  'src/routes/$locale/challenges/index.tsx',
  'src/routes/api/test/reset-progress.ts',
  'src/routes/api/test/set-progress.ts',
  'src/routes/api/test/teardown-user.ts',
];

const TSC_NOCHECK_ALLOWLIST = [
  'src/db/fix-duplicate-title.ts',
];

let hasError = false;

function toRepoPath(filePath: string) {
  return relative(ROOT_DIR, filePath).split(sep).join('/');
}

function isAllowedUnsafeFile(repoPath: string) {
  return [...BROAD_UNSAFE_ALLOWLIST, ...ADAPTER_UNSAFE_ALLOWLIST].some((entry) =>
    entry.endsWith('/') ? repoPath.startsWith(entry) : repoPath === entry,
  );
}

function isBroadUnsafeFile(repoPath: string) {
  return BROAD_UNSAFE_ALLOWLIST.some((entry) =>
    entry.endsWith('/') ? repoPath.startsWith(entry) : repoPath === entry,
  );
}

function isTsNoCheckAllowed(repoPath: string) {
  return isAllowedUnsafeFile(repoPath) || TSC_NOCHECK_ALLOWLIST.includes(repoPath);
}

function getFiles(dir: string): string[] {
  const files: string[] = [];

  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.output') {
      continue;
    }

    const fullPath = join(dir, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFiles(fullPath));
      continue;
    }

    if (stat.isFile() && SOURCE_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf('.')))) {
      files.push(fullPath);
    }
  }

  return files;
}

function report(message: string, repoPath: string, line: number, sourceLine: string, hint: string) {
  console.error(`\x1b[31m[ERROR] ${message} in ${repoPath}:${line}\x1b[0m`);
  console.error(`  > ${sourceLine.trim()}`);
  console.error(`  * ${hint}\n`);
  hasError = true;
}

function checkCommentSuppressions(repoPath: string, content: string) {
  if (repoPath === 'tools/check-suppressions.ts') {
    return;
  }

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    if (line.includes('@ts-ignore') && !line.includes('@ts-expect-error')) {
      report(
        'Banned @ts-ignore found',
        repoPath,
        lineNum,
        line,
        'Use a real type fix, or @ts-expect-error with a reason if the error is intentional.',
      );
    }

    if (isBroadUnsafeFile(repoPath)) {
      return;
    }

    if (line.includes('@ts-expect-error') && !/@ts-expect-error\s+--\s+\S+/.test(line)) {
      report(
        'Undocumented @ts-expect-error found',
        repoPath,
        lineNum,
        line,
        'Add a reason after "--", for example: // @ts-expect-error -- third-party type mismatch.',
      );
    }

    if (line.includes('@ts-nocheck') && !isTsNoCheckAllowed(repoPath)) {
      report(
        'Disallowed @ts-nocheck found',
        repoPath,
        lineNum,
        line,
        'Remove @ts-nocheck or move the unsafe code behind an explicit allowlisted boundary.',
      );
    }

    const eslintDisableMatch = line.match(/eslint-disable(?:-next-line|-line)?\b(.*)/);
    if (eslintDisableMatch && !line.includes('eslint-enable')) {
      const rest = eslintDisableMatch[1].trim();
      const [rawRules = '', rawReason = ''] = rest.split('--', 2);
      const rules = rawRules.replace(/\*\/|-->|\/\/|<!--/g, '').trim();
      const reason = rawReason.replace(/\*\/|-->/g, '').trim();
      const hasRuleNames =
        rules.length > 0 &&
        rules !== ',' &&
        !rules.split(',').some((rule) => rule.trim().length === 0);

      if (!hasRuleNames || !reason) {
        report(
          'Invalid ESLint suppression found',
          repoPath,
          lineNum,
          line,
          'Name exact ESLint rule(s) and add a reason after "--".',
        );
      }
    }
  });
}

function checkAnyCasts(repoPath: string, content: string) {
  if (isAllowedUnsafeFile(repoPath)) {
    return;
  }

  const sourceFile = ts.createSourceFile(
    repoPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith('.tsx') || repoPath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const visit = (node: ts.Node) => {
    if (
      ts.isAsExpression(node) &&
      node.type.kind === ts.SyntaxKind.AnyKeyword
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      report(
        'Disallowed as any cast found',
        repoPath,
        line + 1,
        content.split('\n')[line] ?? '',
        'Replace with a narrower type, a type guard, or an explicit allowlisted adapter boundary.',
      );
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

console.log('Scanning codebase for suppression guardrails...');

for (const dir of SCAN_DIRS) {
  const fullDir = resolve(ROOT_DIR, dir);
  for (const filePath of getFiles(fullDir)) {
    const repoPath = toRepoPath(filePath);
    const content = readFileSync(filePath, 'utf8');

    checkCommentSuppressions(repoPath, content);
    checkAnyCasts(repoPath, content);
  }
}

if (hasError) {
  console.error('\x1b[31mSuppression guardrail checks failed.\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32mSuppression guardrail checks passed successfully.\x1b[0m');
