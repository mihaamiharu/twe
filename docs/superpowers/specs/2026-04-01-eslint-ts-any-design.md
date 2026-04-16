# Design Spec: ESLint & TypeScript Refactoring (Replacing `any` with Zod/Strict Types)

**Date:** 2026-04-01
**Status:** Approved
**Topic:** ESLint and TypeScript Refactoring

## 1. Executive Summary

This project aims to improve the overall type safety and maintainability of the TestingWithEkki (TWE) codebase by addressing widespread `any` usage and resolving ESLint warnings/errors. We will move from loose `any` types to strict, Zod-validated schemas and inferred TypeScript interfaces, particularly for core entities like Challenges, Tutorials, and Achievements.

## 2. Goals & Success Criteria

- **Zero `any` usage** in main functionalities (excluding tests and the Playwright shim where untyped iframe interactions are inherent).
- **ESLint Compliance**: No `@typescript-eslint/no-explicit-any` warnings or errors in the `src/` directory (excluding tests).
- **Type-Safe Database Schemas**: All JSONB fields in Drizzle ORM use proper TypeScript interfaces instead of `Record<string, any>`.
- **Zod-Driven Validation**: All external data (API responses, filesystem content) is validated using Zod schemas at the boundaries.
- **Centralized Types**: Shared entity types are centralized in `src/lib/types.ts` or `src/lib/content.types.ts`.

## 3. Architecture & Data Flow

### 3.1 Source of Truth: Zod Schemas
Zod schemas will be the primary source of truth for our data models. We will infer TypeScript types from these schemas using `z.infer`.

```typescript
// src/lib/validations.ts
export const localizedStringSchema = z.object({
  en: z.string().min(1, "English content is required"),
  id: z.string().optional(),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;
```

### 3.2 Database Layer (`src/db/schema.ts`)
Replace `$type<Record<string, any>>()` with the proper inferred interfaces.

```typescript
import { type LocalizedString } from '@/lib/content.types';

export const challenges = pgTable('challenges', {
  // ...
  title: jsonb('title').$type<LocalizedString>().notNull(),
  description: jsonb('description').$type<LocalizedString>().notNull(),
});
```

### 3.3 Component Layer
Update component props to use the centralized types.

```typescript
// src/components/challenges/challenge-card.tsx
import { type Challenge } from '@/lib/content.types';

interface ChallengeCardProps {
  challenge: Challenge;
  config?: any; // To be refactored as well
  isComingSoon?: boolean;
  // ...
}
```

### 3.4 API & Server Functions
Ensure all `createServerFn` and API routes use `.inputValidator(z.object({...}))` for strict type safety on inputs and outputs.

## 4. Implementation Strategy

1. **Core Type Definition**: Enhance `src/lib/content.types.ts` and `src/lib/validations.ts` with comprehensive Zod schemas and inferred types.
2. **Database Schema Update**: Apply strict types to JSONB fields in `src/db/schema.ts`.
3. **Component Refactoring**: Systematically update components in `src/components/` and routes in `src/routes/` to use the new types, removing `any` and ESLint disable comments.
4. **TanStack Router Fixes**: Address `as any` in `createFileRoute` by ensuring route tree synchronization and proper path typing.
5. **Continuous Verification**: Run `tsc --noEmit` and `npm run lint` frequently to catch regressions.

## 5. Scope & Exclusions

- **Included**: All files in `src/` related to main application functionality.
- **Excluded**: 
    - `src/tests/` and `e2e/` (as requested).
    - `src/core/executor/playwright-shim.ts` (inherent untyped iframe interactions, though improvements will be made where possible).
    - `src/routeTree.gen.ts` (auto-generated).

## 6. Risks & Mitigations

- **Breaking Changes**: Strict typing might reveal existing bugs. **Mitigation**: Run full unit and integration test suites after each major refactor.
- **TanStack Start Type Complexity**: TanStack Start can sometimes have complex type requirements for routes. **Mitigation**: Use surgical type fixes or temporary `unknown` (followed by Zod validation) instead of `any` if direct path typing fails.
