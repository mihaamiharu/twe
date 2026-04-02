# ESLint & TypeScript Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate "Unsafe Member Access" and "Unused Variables" in core `src/` files.

**Architecture:** Apply surgical fixes using Zod validation for external data boundaries and explicit interfaces for internal data. Systematically remove unused declarations identified by ESLint.

**Tech Stack:** TypeScript, Zod, ESLint.

---

### Task 1: Unused Variable Cleanup (Batch)

**Files:**
- Modify: All files in `src/` reported with `@typescript-eslint/no-unused-vars`

- [ ] **Step 1: Identify all unused variables**

Run: `npm run lint | grep "no-unused-vars"`
Target: Focus on `src/` directory, excluding `src/tests/`.

- [ ] **Step 2: Remove unused variables surgically**

Address reported lines in:
- `src/components/challenges/file-explorer.tsx`
- `src/components/challenges/multi-tab-editor.tsx`
- `src/components/challenges/playground/editor-panel.tsx`
- `src/routes/$locale/confirm-subscription.tsx`
- `src/routes/admin/bugs.tsx`
- `src/routes/admin/challenges.tsx`
- `src/routes/admin/newsletter.tsx`
- `src/server/content.server.ts`
- (and other files identified in Step 1)

- [ ] **Step 3: Verify with lint**

Run: `npm run lint`
Expected: Zero `no-unused-vars` warnings in `src/` (excluding tests).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "refactor: remove unused variables across src directory"
```

---

### Task 2: Fix Unsafe Member Access in Challenge Routes

**Files:**
- Modify: `src/routes/$locale/challenges/index.tsx`
- Modify: `src/routes/$locale/challenges/$slug.tsx`

- [ ] **Step 1: Fix unsafe access in `index.tsx`**

Address issues where properties are accessed on types inferred as `error` or `any`.
Use the `ChallengeListItem` type or explicit casts where appropriate.

- [ ] **Step 2: Fix unsafe access in `$slug.tsx`**

Address property access on `data` and `challenge` objects.
Ensure `challengeDetailQueryOptions` result is handled type-safely.

- [ ] **Step 3: Verify with tsc**

Run: `bun x tsc --noEmit`
Expected: No type errors in these specific files.

- [ ] **Step 4: Commit**

```bash
git add src/routes/$locale/challenges/
git commit -m "refactor: fix unsafe member access in challenge routes"
```

---

### Task 3: Fix Unsafe Member Access in Server Functions

**Files:**
- Modify: `src/server/auth.fn.ts`
- Modify: `src/server/rate-limit.mw.ts`
- Modify: `src/server/submissions.fn.ts`

- [ ] **Step 1: Fix `auth.fn.ts`**

Address unsafe assignment of error typed values in session handling.

- [ ] **Step 2: Fix `rate-limit.mw.ts`**

Address unsafe member access on `error` typed values.

- [ ] **Step 3: Fix `submissions.fn.ts`**

Ensure all property access on DB results and filesystem content is typed.

- [ ] **Step 4: Final verification**

Run: `npm run lint && bun x tsc --noEmit`
Expected: Clean output for target rules.

- [ ] **Step 5: Commit**

```bash
git add src/server/
git commit -m "refactor: fix unsafe member access in server functions and middleware"
```
