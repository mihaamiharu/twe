import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const SRC_DIR = resolve(__dirname, '../src');

let hasError = false;

function scanDirectory(dir: string) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Exclude tests directory as it is quarantined
      if (file === 'tests' && dir === SRC_DIR) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(resolve(__dirname, '..') + '/', '');

  // Skip files that are explicitly quarantined with @ts-nocheck
  if (content.includes('// @ts-nocheck') || content.includes('/* @ts-nocheck */')) {
    return;
  }

  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Check for banned @ts-ignore (unless it is a documented exception)
    if (line.includes('@ts-ignore') && !line.includes('@ts-expect-error')) {
      if (!line.includes('-- documented exception')) {
        console.error(`\x1b[31m[ERROR] Banned @ts-ignore found in ${relativePath}:${lineNum}\x1b[0m`);
        console.error(`  > ${line.trim()}`);
        console.error(`  * Fix: Use @ts-expect-error with a reason (e.g. // @ts-expect-error -- <reason>)\n`);
        hasError = true;
      }
    }

    // 2. Check for eslint-disable, eslint-disable-next-line, eslint-disable-line
    const eslintDisableMatch = line.match(/(eslint-disable(?:-next-line|-line)?)(.*)/);
    if (eslintDisableMatch) {
      const type = eslintDisableMatch[1];
      const rest = eslintDisableMatch[2].trim();

      // Exclude eslint-enable
      if (line.includes('eslint-enable')) {
        return;
      }

      // Check if it has a reason after --
      const parts = rest.split('--');
      const rulesPart = parts[0].trim().replace(/\*\/|-->|\/\/|-->/g, '').trim();
      const reasonPart = parts[1] ? parts[1].trim().replace(/\*\/|-->/g, '').trim() : '';

      // We require rule name(s) and a reason
      const hasRules = rulesPart.length > 0 && !rulesPart.startsWith('--');
      const hasReason = reasonPart.length > 0;

      if (!hasRules || !hasReason) {
        console.error(`\x1b[31m[ERROR] Invalid ESLint suppression in ${relativePath}:${lineNum}\x1b[0m`);
        console.error(`  > ${line.trim()}`);
        if (!hasRules) {
          console.error(`  * Missing: Rule name(s) to suppress (e.g. ${type} rule-name)`);
        }
        if (!hasReason) {
          console.error(`  * Missing: Reason after '--' (e.g. ${type} rule-name -- <reason>)`);
        }
        console.error('');
        hasError = true;
      }
    }
  });
}

console.log('Scanning codebase for suppression guardrails...');
scanDirectory(SRC_DIR);

if (hasError) {
  console.error('\x1b[31mSuppression guardrail checks failed!\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mSuppression guardrail checks passed successfully!\x1b[0m');
  process.exit(0);
}
