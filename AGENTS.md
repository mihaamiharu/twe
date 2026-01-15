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
- `npm run test:e2e` - Run E2E tests (Playwright, auto-starts postgres)
- `npm run test:e2e:stop` - Stop postgres container
- `npm run test:e2e:report` - Generate and open Allure report

### Linting & Formatting

- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix auto-fixable ESLint issues
- `npm run format` - Format code with Prettier

### Database

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with challenges from JSON files
- `npm run db:studio` - Open Drizzle Studio

## AI & LLM Integration (DeepSeek)

### Token Efficiency ("Static-First" Rule)

Since DeepSeek uses **Automatic Prefix Caching**, you must order messages to maximize cache hits.

**Rule**: "Always keep system instructions and project-wide context at the very top of the prompt. Do not rephrase the system instructions between turns."

**Why**: DeepSeek only caches from the top down. If the first few tokens change (e.g., dynamic context in the system prompt), it breaks the cache for everything below it, increasing costs and latency.

**Implementation**:

1. **System Message**: Keep it completely static (e.g., "You are a QA mentor..."). Do NOT include dynamic values like `challengeType` or user names here.
2. **User Message**: Start with the dynamic context (e.g., "Context: Challenge is CSS Selectors...").

## TanStack Start Project Structure & Conventions

### File-Based Routing (TanStack Router)

TanStack Start uses file-based routing:

- **Routes Directory**: `src/routes/` - File paths become routes
- **Pattern**: Files ending in `.tsx` or `.ts` are auto-registered as routes
- **Authenticated Routes**: Protected routes go in `src/routes/$locale/_authenticated.tsx`
- **Admin Routes**: Admin routes go in `src/routes/admin/`
- **API Routes**: API routes go in `src/routes/api/auth/` and `src/routes/api/auth/`

**Route Patterns**:

```ts
// File-based route
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => <div>Home</div>,
});
```

### Server Functions (TanStack Start API)

**Create API Endpoints**:

```ts
import { createServerFn } from '@tanstack/react-start/server';

export const myApiFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    return { success: true, data };
  });
```

### Content Management (Filesystem-based)

- **Challenges**: `content/challenges/` - JSON files for challenge data
- **Tutorials**: `tutorials/` - Markdown files for tutorial content
- **Loading**: `src/server/content.server.ts` - Loads content from JSON files

### Database (Drizzle ORM)

**Imports**: Use `@/db` alias for database operations:

```ts
import { db } from '@/db';
import { users, challenges } from '@/db/schema';
```

**Queries**: Use Drizzle query patterns:

```ts
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { challenges: true },
});
```

**Relations**: Defined in `src/db/schema.ts`:

```ts
import { relations } from '@/db/schema';
```

### State Management

**Authentication** (Better-Auth):

```ts
import { auth } from '@/lib/auth.server';
const session = await auth.api.getSession({ headers });
```

**Client Data Fetching** (TanStack Query):

```ts
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => fetch('/api/data'),
  });
  const data = data.data;
  return data;
}
```

**Return Pattern**:

```ts
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

**Search & Filtering**:
When implementing live search or filtering, **Avoid `useSuspenseQuery`** as it triggers suspense boundaries (flickering) on every keystroke.
Instead, use `useQuery` with `placeholderData: keepPreviousData`:

```ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['items', search],
  queryFn: () => fetchItems(search),
  placeholderData: keepPreviousData, // Keeps old data visible while fetching
});
```

### React Components

- **Use `cn()` from `@/lib/utils` for className merging**
- **Follow shadcn/ui patterns** for component structure
- **Use `React.ComponentProps` for forwarding props**

```ts
function MyComponent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('base-classes', className)} {...props}>...</div>;
}
```

### Data Tables (TanStack Table)

**Use TanStack Table** (`@tanstack/react-table`) for:

- Complex datasets requiring **sorting, filtering, or pagination**.
- Data grids with mixed content types or row selection.

**Avoid** for simple, small, or static lists where a simple `.map()` is sufficient.

**Implementation Pattern**:

- Define columns using `createColumnHelper`.
- Decouple data logic (hooks) from UI rendering.
- Integrate with `shadcn/ui` Table components for styling.

### Testing Guidelines

- **Bun test framework**: Import from `'bun/test'`: `describe`, `it`, `expect`
- **Unit tests**: Use `--preload ./src/tests/bun-preload.ts`
- **Integration tests**: Use `src/tests/integration/setup.ts` for DB setup

```ts
import { describe, it, expect } from 'bun:test';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Validation (Zod)

**Runtime validation**:

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

### Internationalization (i18next)

- **Use `useTranslation`** from 'react-i18next'
- **Translation keys**: `'namespace:key'`
- **Namespace files**: `src/locales/`

```ts
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
const text = t('navigation.login');
```

## Project Structure Notes

- `src/components/` - React components, organized by feature
- `src/lib/` - Utilities and shared logic
- `src/server/` - Server functions (`.fn.ts` files`)
- `src/db/` - Database schema and connection
- `src/routes/` - TanStack Router file-based routes
- `src/tests/` - Unit and integration tests
- `e2e/` - Playwright end-to-end tests
- `content/` - Challenge content (JSON)
- `tutorials/` - Tutorial markdown files

## TanStack Start Technology Stack

### Core Frameworks

| Technology      | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| TanStack Start  | Meta-framework (Vite + React Router + Query + Server) |
| TanStack Router | File-based routing (v1+)                              |
| TanStack Query  | Client state management                               |
| Drizzle ORM     | Type-safe SQL                                         |
| Better-Auth     | Authentication                                        |
| Playwright      | E2E testing                                           |
| Drizzle Studio  | Database GUI                                          |

### Integration Points

**TanStack Router → Routes**: Auto-generated routes from `src/routes/`
**Better-Auth → Server Functions**: `createServerFn()` for API routes
**TanStack Query → React Hooks**: `useQuery()` for component data
**Drizzle ORM → Database**: `@/db` for database access

## Development Workflow

1. **Start Development**:

   ```bash
   npm run dev
   ```

2. **Run Tests**:

   ```bash
   npm run test:e2e    # Runs E2E tests with Allure report
   ```

3. **Generate Report**:

   ```bash
   npm run test:e2e:report    # Opens Allure HTML report
   ```
