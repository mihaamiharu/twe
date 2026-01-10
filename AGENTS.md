# AGENTS.md

This file contains guidelines for agentic coding assistants working in this repository.

## Commands

### Build & Dev

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing

- `bun test` - Run all tests
- `bun test path/to/test.ts` - Run a single test file
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests (requires test DB)
- `npm run test:ci` - Run all tests in CI environment

### Linting & Formatting

- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix auto-fixable ESLint issues
- `npm run format` - Format code with Prettier

### Database

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Code Style Guidelines

### Imports

- External dependencies first (React, TanStack, etc.)
- Internal imports with `@/` alias next
- Type imports can use `import type { ... }` for clarity
- Keep imports organized and grouped

Example:

```ts
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/db/schema';
```

### Formatting (Prettier)

- Single quotes: `'string'`
- Semicolons: always
- Trailing commas: all
- Print width: 80 characters
- Tab width: 2 spaces
- Arrow parens: always

### TypeScript

- Strict mode enabled
- Use `export type` for type-only exports when possible
- Explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `any` - use `unknown` when type cannot be determined

### Naming Conventions

- PascalCase: Components, Types, Interfaces (`UserProfile`, `AuthSession`)
- camelCase: Functions, variables, objects (`getUserById`, `isLoading`)
- SCREAMING_SNAKE_CASE: Constants, enum values (`API_URL`, `EASY`)
- kebab-case: File names, component folders (`auth-form.tsx`, `user-profile/`)

### Error Handling

Use try/catch with the structured logger:

```ts
import { logger } from '@/lib/logger';

try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  };
}
```

Return pattern for server functions:

```ts
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

### Server Functions (TanStack Start)

Use `createServerFn` for all server-side operations:

```ts
export const myServerFn = createServerFn({ method: 'GET' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { id } = data;
    // Server logic here
    return { success: true, data };
  });
```

### Database (Drizzle ORM)

- Import from `@/db` for database instance and schema
- Use `eq()`, `and()`, `or()` from `drizzle-orm` for conditions
- Use `sql` template literals for raw queries when needed
- Relations defined in `src/db/schema.ts` with `relations()`

```ts
import { db } from '@/db';
import { users, challenges } from '@/db/schema';
import { eq } from 'drizzle-orm';

const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { challenges: true },
});
```

### React Components

- Use `cn()` from `@/lib/utils` for className merging
- Follow shadcn/ui patterns for component structure
- Use `React.ComponentProps` for forwarding props

```ts
import { cn } from '@/lib/utils';

function MyComponent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* content */}
    </div>
  );
}
```

### Testing

- Use Bun test framework
- Import from 'bun/test': `describe`, `it`, `expect`
- For unit tests, use `--preload ./src/tests/bun-preload.ts`
- Integration tests should use `src/tests/integration/setup.ts` for DB setup

```ts
import { describe, it, expect } from 'bun:test';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Validation

Use Zod for runtime validation:

```ts
import { z } from 'zod';

export const mySchema = z.object({
  email: z.string().email(),
  age: z.number().min(0),
});

export type MyInput = z.infer<typeof mySchema>;
```

### Logging

Use the structured logger from `@/lib/logger`:

```ts
import { logger } from '@/lib/logger';

logger.debug('Debug message', { context: 'data' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Internationalization

- Use `useTranslation` from 'react-i18next'
- Translation keys in format: `'namespace:key'`
- Namespace files in `src/locales/`

```ts
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
const text = t('navigation.login');
```

## Project Structure Notes

- `src/components/` - React components, organized by feature
- `src/lib/` - Utilities and shared logic
- `src/server/` - Server functions (`.fn.ts` files)
- `src/db/` - Database schema and connection
- `src/routes/` - TanStack Router file-based routes
- `src/tests/` - Unit and integration tests
- `e2e/` - Playwright end-to-end tests
- `content/` - Challenge content (JSON)
- `tutorials/` - Tutorial markdown files
