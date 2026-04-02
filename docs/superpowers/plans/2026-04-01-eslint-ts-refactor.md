# ESLint & TypeScript Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `any` usage with strict Zod-validated types across main functionalities and resolve ESLint warnings/errors.

**Architecture:** Use Zod schemas as the source of truth for core entities (Challenges, Tutorials, Achievements), inferring TypeScript types from them. Propagate these types through the database schema (Drizzle ORM) and React components.

**Tech Stack:** TypeScript, Zod, Drizzle ORM, TanStack Start/Router.

---

### Task 1: Core Type Definitions (Zod)

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/lib/content.types.ts`

- [ ] **Step 1: Define core Zod schemas in `src/lib/validations.ts`**

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const localizedStringSchema = z.object({
  en: z.string().min(1, 'English content is required'),
  id: z.string().optional(),
});

export const challengeTypeSchema = z.enum([
  'CSS_SELECTOR',
  'XPATH_SELECTOR',
  'JAVASCRIPT',
  'TYPESCRIPT',
  'PLAYWRIGHT',
]);

export const challengeDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

export const testCaseDefinitionSchema = z.object({
  description: z.string(),
  input: z.unknown().optional(),
  expectedOutput: z.unknown(),
  isHidden: z.boolean().optional(),
});

export const expectedStateRuleSchema = z.object({
  selector: z.string(),
  visible: z.boolean().optional(),
  hidden: z.boolean().optional(),
  containsText: z.string().optional(),
  hasAttribute: z.object({
    name: z.string(),
    value: z.union([z.string(), z.instanceof(RegExp)]).optional(),
  }).optional(),
  count: z.number().optional(),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type ChallengeType = z.infer<typeof challengeTypeSchema>;
export type ChallengeDifficulty = z.infer<typeof challengeDifficultySchema>;
export type TestCaseDefinition = z.infer<typeof testCaseDefinitionSchema>;
export type ExpectedStateRule = z.infer<typeof expectedStateRuleSchema>;
```

- [ ] **Step 2: Update `src/lib/content.types.ts` to use inferred types**

```typescript
// src/lib/content.types.ts
import { 
  type LocalizedString, 
  type ChallengeType, 
  type ChallengeDifficulty,
  type TestCaseDefinition,
  type ExpectedStateRule 
} from './validations';

// ... update ChallengeDefinition and Challenge interfaces to use these types
// instead of re-defining them or using any/unknown loosely
```

- [ ] **Step 3: Verify types with `tsc`**

Run: `bun x tsc --noEmit`
Expected: Success (or manageable errors in components that will be fixed later)

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts src/lib/content.types.ts
git commit -m "refactor: define core Zod schemas and inferred types"
```

---

### Task 2: Database Schema Type Safety

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Update `$type` annotations in `src/db/schema.ts`**

```typescript
// src/db/schema.ts
import { type LocalizedString } from '@/lib/validations';

export const challenges = pgTable('challenges', {
  // ...
  title: jsonb('title').$type<LocalizedString>().notNull(),
  description: jsonb('description').$type<LocalizedString>().notNull(),
  instructions: jsonb('instructions').$type<LocalizedString>().notNull(),
});

export const achievements = pgTable('achievements', {
  // ...
  name: jsonb('name').$type<LocalizedString>().notNull(),
  description: jsonb('description').$type<LocalizedString>().notNull(),
});
```

- [ ] **Step 2: Verify database schema with `db:generate`**

Run: `bun run db:generate`
Expected: No changes (since only TypeScript metadata changed, not SQL types), but verifies code compiles.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "refactor: add strict types to database JSONB fields"
```

---

### Task 3: Component Refactoring (Main View)

**Files:**
- Modify: `src/routes/$locale/challenges/index.tsx`

- [ ] **Step 1: Refactor `ChallengeCard` and `ChallengeRow` props**

```typescript
// src/routes/$locale/challenges/index.tsx
import { type Challenge } from '@/lib/content.types';

interface ChallengeCardProps {
  challenge: Challenge;
  config: any; // TODO: Refactor config as well if possible
  isComingSoon?: boolean;
  isBoss?: boolean;
  params: { locale: string };
  t: (key: string) => string;
}

export function ChallengeCard({ challenge, config, isComingSoon, isBoss, params, t }: ChallengeCardProps) {
  // ...
}
```

- [ ] **Step 2: Remove ESLint disable comments if any**

- [ ] **Step 3: Commit**

```bash
git add src/routes/$locale/challenges/index.tsx
git commit -m "refactor: type ChallengeCard and ChallengeRow components"
```

---

### Task 4: API & Admin Route Cleanup

**Files:**
- Modify: `src/routes/api/og.ts`
- Modify: `src/routes/admin/achievements.tsx`
- Modify: `src/routes/admin/submissions.tsx`

- [ ] **Step 1: Fix `any` in `src/routes/api/og.ts`**

Replace `as any` with proper types for `pngBuffer` and `createFileRoute`.

- [ ] **Step 2: Fix `any` in `src/routes/admin/achievements.tsx`**

Type the achievement objects properly using the `Achievement` interface (to be defined or refined).

- [ ] **Step 3: Fix `any` in `src/routes/admin/submissions.tsx`**

Type the event handler for `onValueChange`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/og.ts src/routes/admin/achievements.tsx src/routes/admin/submissions.tsx
git commit -m "refactor: remove any usage in API and Admin routes"
```

---

### Task 5: Final ESLint Enforcement

- [ ] **Step 1: Run global lint and fix remaining issues**

Run: `npm run lint`
Expected: List of remaining `@typescript-eslint/no-explicit-any` warnings.

- [ ] **Step 2: Address remaining warnings one by one**

- [ ] **Step 3: Update `eslint.config.js` to error on `any`**

```javascript
// eslint.config.js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
},
```

- [ ] **Step 4: Final verification**

Run: `npm run lint && bun x tsc --noEmit`
Expected: Success.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js
git commit -m "chore: enforce no-explicit-any as error"
```
