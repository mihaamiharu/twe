# Design Spec: ESLint & TypeScript Refinement (Unsafe Access & Variable Cleanup)

**Date:** 2026-04-01
**Status:** Approved
**Topic:** ESLint and TypeScript Refinement

## 1. Executive Summary

Following the initial refactor to replace `any` usage, this spec focuses on resolving remaining high-priority ESLint warnings and TypeScript errors in the `src/` directory. Specifically, we will address "Unsafe Member Access" (`@typescript-eslint/no-unsafe-member-access`) and "Unused Variables" (`@typescript-eslint/no-unused-vars`) to achieve a cleaner, more robust codebase. Environment-related test failures are currently out of scope.

## 2. Goals & Success Criteria

- **Zero Unsafe Member Access** in core application files (excluding the Playwright shim and third-party library edges where necessary).
- **Zero Unused Variables** in the `src/` directory (excluding tests).
- **Reduced Lint Noise**: Significant reduction in total warning count in `npm run lint`.
- **Improved Maintainability**: Clearer data flow through explicit typing of object properties.

## 3. Implementation Patterns

### 3.1 Resolving Unsafe Member Access
Instead of property access on `any` or `error` types, we will use the following patterns:

#### Pattern A: Zod Validation (Preferred for External Data)
```typescript
// Before: const name = data.user.name; (where data is any)
// After:
const userSchema = z.object({ name: z.string() });
const parsed = userSchema.parse(data.user);
const name = parsed.name;
```

#### Pattern B: Explicit Interfaces (Preferred for Internal Data)
```typescript
// Before: const title = challenge.title.en; (where challenge.title is inferred as any)
interface LocalizedField { en: string; id?: string; }
const title = (challenge.title as LocalizedField).en;
```

#### Pattern C: Type Guards for Errors
```typescript
// Before: console.log(error.message); (where error is unknown)
if (error instanceof Error) {
  console.log(error.message);
}
```

### 3.2 Unused Variable Cleanup
- Remove variables that are declared but never used.
- For necessary unused arguments (e.g., in callback signatures), prefix with an underscore (`_arg`).

## 4. Target Areas

1.  **`src/routes/$locale/challenges/index.tsx`**: Resolve remaining member access issues in filtering and layout logic.
2.  **`src/routes/$locale/challenges/$slug.tsx`**: Fix property access on the `data` object and related entities.
3.  **`src/server/*.fn.ts`**: Ensure server function handlers handle context and data type-safely.
4.  **Global Search**: Address unused variables across all core `src/` subdirectories.

## 5. Risks & Mitigations

- **Risk**: Deleting variables might break code that relies on side effects during declaration. 
- **Mitigation**: Carefully review each unused variable for side effects before removal.
- **Risk**: Strict typing might reveal subtle logical errors.
- **Mitigation**: Run `bun x tsc --noEmit` frequently to verify logic remains sound.
