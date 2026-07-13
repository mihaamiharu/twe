# Bun and TypeScript Correctness Baseline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish an enforceable Bun and TypeScript baseline for the project, fix compilation/lint errors, remove stale NPM files, and implement a suppression-check guardrail.

**Architecture:** Isolate main application typechecking from unit/integration tests and scripts. Clean up configuration files, replace `@ts-ignore` with `@ts-expect-error` plus reasons, add reasons to all ESLint suppressions in normal code, and add a check script to prevent blind suppressions.

**Tech Stack:** Bun, TypeScript, ESLint, GitHub Actions

---

### Task 1: Package Manager & Lockfile Cleanup

**Files:**
- Modify: `package.json`
- Delete: `package-lock.json`

**Step 1: Write the typecheck script**
Add the `typecheck` script to `package.json`.

```json
"typecheck": "tsc --noEmit && tsc --project tsconfig.test.json --noEmit"
```

**Step 2: Run cleanup**
Run: `rm package-lock.json`
Expected: File `package-lock.json` is deleted.

**Step 3: Run commit**
```bash
git add package.json
git rm package-lock.json
git commit -m "chore: remove stale npm lockfile and add typecheck script"
```

---

### Task 2: TSConfig Scoping

**Files:**
- Modify: `tsconfig.json`

**Step 1: Update TSConfig includes and excludes**
Modify `tsconfig.json` to focus only on main app files and exclude tests and scripts.

```json
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "src/tests/**/*",
    "scripts/**/*",
    "src/routeTree.gen.ts"
  ]
```

**Step 2: Run compiler check**
Run: `bun x tsc --noEmit`
Expected: Shows fewer errors because tests and scripts are excluded from the main compilation.

**Step 3: Commit**
```bash
git add tsconfig.json
git commit -m "config: scope tsconfig.json to exclude tests and scripts"
```

---

### Task 3: Fix Core Source Code Type Errors

**Files:**
- Modify: `src/server/consent.fn.ts`
- Modify: `src/server/content.server.ts`
- Modify: `src/server/sentry.mw.ts`
- Modify: `src/server/submissions.fn.ts`
- Modify: `src/server/tutorials.fn.ts`
- Modify: `src/ssr.tsx`

**Step 1: Fix `src/server/consent.fn.ts`**
Specify `row: string` in `.find`:
```typescript
        .find((row: string) => row.startsWith('twe-consent='))
```

**Step 2: Fix `src/server/content.server.ts`**
Remove `usedLocale = locale` (since it is unused).
Specify return type of mapping function as `Promise<Omit<Tutorial, 'content'> | null>`:
```typescript
  const tutorialPromises = registry.tutorials.map(async (entry): Promise<Omit<Tutorial, 'content'> | null> => {
```

**Step 3: Fix `src/server/sentry.mw.ts`**
Rename import to avoid circular parameter typing:
```typescript
import type * as SentryType from '@sentry/bun';
...
export function attachSentryUserContext(
    context: SentryContext,
    Sentry: typeof SentryType,
)
```

**Step 4: Fix `src/server/submissions.fn.ts` and `src/server/tutorials.fn.ts`**
Coerce `ensureEntityInDb` return value to `undefined` on null:
In `src/server/submissions.fn.ts`:
```typescript
    if (!challenge) {
      challenge = (await ensureEntityInDb({
        ...
      })) || undefined;
```
In `src/server/tutorials.fn.ts`:
```typescript
        tutorial = (await ensureEntityInDb({
          ...
        })) || undefined;
```

**Step 5: Fix `src/ssr.tsx`**
Update the server entry point to match the TanStack Start v1.x signature:
```typescript
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'

export default createStartHandler(defaultStreamHandler);
```

**Step 6: Run compiler check**
Run: `bun x tsc --noEmit`
Expected: ZERO errors in the main application code (no output).

**Step 7: Commit**
```bash
git add src/server/consent.fn.ts src/server/content.server.ts src/server/sentry.mw.ts src/server/submissions.fn.ts src/server/tutorials.fn.ts src/ssr.tsx
git commit -m "fix: resolve all TypeScript errors in core application files"
```

---

### Task 4: Fix Unit/Integration Test Type Errors

**Files:**
- Modify: `src/tests/integration/test-api.test.ts`
- Modify: `src/tests/unit/ChallengeCard.test.tsx`

**Step 1: Replace `@ts-ignore` in `src/tests/integration/test-api.test.ts`**
Replace `// @ts-ignore` with `@ts-expect-error` plus reason:
```typescript
      // @ts-expect-error -- reaching into TanStack Router internals for direct mock testing
```

**Step 2: Fix failing unit test in `src/tests/unit/ChallengeCard.test.tsx`**
Change exact text match '10' to regex or '10 XP':
```typescript
        expect(screen.getByText('10 XP')).toBeTruthy();
```

**Step 3: Run unit tests**
Run: `bun run test:unit`
Expected: All 392 tests pass.

**Step 4: Commit**
```bash
git add src/tests/integration/test-api.test.ts src/tests/unit/ChallengeCard.test.tsx
git commit -m "test: fix test api ts-ignore comments and challenge card unit test"
```

---

### Task 5: ESLint Configuration & CI Workflow Scoping

**Files:**
- Modify: `eslint.config.js`
- Modify: `.github/workflows/ci.yml`

**Step 1: Update ignores in `eslint.config.js`**
Add tool directories and scripts to the ignores array to prevent parsing errors:
```javascript
    ignores: [
      'node_modules/**',
      'dist/**',
      '.archive/**',
      '.output/**',
      'build/**',
      '.vinxi/**',
      'vite.config.ts',
      'eslint.config.js',
      'src/routeTree.gen.ts',
      '.agent/**',
      '.agents/**',
      '.claude/**',
      'scripts/**',
    ],
```

**Step 2: Update `.github/workflows/ci.yml`**
Remove `|| true` from `bun run lint` and add the `typecheck` step:
```yaml
      - name: Run ESLint
        run: bun run lint

      - name: Run Typecheck
        run: bun run typecheck
```

**Step 3: Run linter locally**
Run: `bun run lint`
Expected: No parsing/unknown file errors. (Only normal warnings/errors that we will fix in Task 7).

**Step 4: Commit**
```bash
git add eslint.config.js .github/workflows/ci.yml
git commit -m "config: update eslint ignores and enforce lint/typecheck in CI"
```

---

### Task 6: Implement Suppression Guardrail Script

**Files:**
- Create: `scripts/check-suppressions.ts`
- Modify: `package.json`

**Step 1: Write suppression check script**
Create `scripts/check-suppressions.ts` to fail on blind/undocumented suppressions.

```typescript
import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const UNCHECKED_DIRECTORIES = ["src/tests", "src/core/executor"];
const IGNORED_FILES = ["src/routeTree.gen.ts"];

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        if (UNCHECKED_DIRECTORIES.some((d) => res.startsWith(d))) {
          return [];
        }
        return getFiles(res);
      }
      const ext = extname(res);
      if ((ext === ".ts" || ext === ".tsx") && !IGNORED_FILES.includes(res)) {
        return [res];
      }
      return [];
    })
  );
  return files.flat();
}

async function run() {
  const files = await getFiles("src");
  let failed = false;

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check ts-ignore
      if (/\/\/ *@ts-ignore/.test(line)) {
        console.error(`❌ ${file}:${lineNumber}: @ts-ignore is banned. Prefer @ts-expect-error with a reason.`);
        failed = true;
      }

      // Check eslint-disable/eslint-disable-next-line
      const disableMatch = /\/\/ *eslint-disable(?:-next-line)? *(.*)/.exec(line) ||
                           /\/\* *eslint-disable *(.*?) *\*\//.exec(line);

      if (disableMatch) {
        const rulesAndReason = disableMatch[1].trim();
        if (!rulesAndReason.includes("--")) {
          console.error(`❌ ${file}:${lineNumber}: ESLint disable comment must specify rule(s) and include a reason after '--'.`);
          failed = true;
        } else {
          const [rules, reason] = rulesAndReason.split("--");
          if (!rules.trim()) {
            console.error(`❌ ${file}:${lineNumber}: ESLint disable must specify exact rule name(s).`);
            failed = true;
          }
          if (!reason.trim()) {
            console.error(`❌ ${file}:${lineNumber}: ESLint disable must include a description/reason after '--'.`);
            failed = true;
          }
        }
      }
    }
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("✅ Suppression guardrail check passed!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: Register in `package.json`**
Add `"check:suppressions": "bun run scripts/check-suppressions.ts"` to scripts.

**Step 3: Run the check script**
Run: `bun run check:suppressions`
Expected: Fails reporting existing un-reasoned ESLint suppressions in normal code files.

**Step 4: Commit**
```bash
git add scripts/check-suppressions.ts package.json
git commit -m "feat: implement suppression guardrail script"
```

---

### Task 7: Fix ESLint Suppressions in Normal Code

**Files:**
- Modify: `src/components/analytics/google-analytics.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/components/auth/register-form.tsx`
- Modify: `src/components/challenges/challenge-card.tsx`
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/auth.client.ts`
- Modify: `src/lib/logger.ts`

**Step 1: Fix suppressions**
Add proper reasons after `--` to all ESLint suppressions in these files.
Example in `src/components/analytics/google-analytics.tsx`:
```typescript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window.dataLayer is untyped third-party integration API
```

**Step 2: Run suppression guardrail**
Run: `bun run check:suppressions`
Expected: PASS

**Step 3: Commit**
```bash
git add src/components/analytics/google-analytics.tsx src/components/auth/login-form.tsx src/components/auth/register-form.tsx src/components/challenges/challenge-card.tsx src/lib/analytics.ts src/lib/auth.client.ts src/lib/logger.ts
git commit -m "fix: document reasons for all inline ESLint suppressions in normal code"
```
