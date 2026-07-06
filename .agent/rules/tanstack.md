---
trigger: always_on
---

This updated `AGENTS.md` reflects the **2026 TanStack Start** standards. It incorporates the shift toward **URL-first state**, the new **Composable Middleware** system, and the refined **Server Function** patterns that have replaced traditional API routes.

---

# AGENTS.md (Updated 2026)

This file contains guidelines for agentic coding assistants working in this repository.

## Commands

### Build & Dev

* `npm run dev` - Start development server (Nitro + Vite)
* `npm run build` - Build for production
* `npm run preview` - Preview production build

### Testing

* `bun test` - Run unit/logic tests
* `npm run test:e2e` - Run Playwright tests (Playwright now handles orchestration)

### Database (Drizzle ORM v1.0+)

* `npm run db:push` - Sync schema to DB (Development)
* `npm run db:migrate` - Execute production migrations
* `npm run db:studio` - Open Drizzle Studio

---

## TanStack Start Architecture & Conventions

### 1. File-Based Routing & SSR

TanStack Start uses **isomorphic loaders**. By default, it performs SSR on the initial request and behaves like a client-side SPA for subsequent navigations.

* **Selective SSR**: You can disable SSR for specific routes (e.g., heavy dashboards) using the `ssr` flag:

```ts
export const Route = createFileRoute('/dashboard')({
  ssr: false, // Disables SSR for this route
  component: DashboardComponent,
});

```

### 2. Composable Middleware (New in 2026)

Middleware is now the standard for Auth and Logging. There are two types: **Request Middleware** (all requests) and **Server Function Middleware** (logic-specific).

```ts
import { createMiddleware } from '@tanstack/react-start';

// 1. Define reusable middleware
const authMiddleware = createMiddleware().server(async ({ next, context }) => {
  const session = await getSession(); // Your auth logic
  if (!session) throw new Error('Unauthorized');
  return next({ context: { user: session.user } });
});

// 2. Apply to Server Functions
export const deleteChallenge = createServerFn({ method: 'POST' })
  .middleware([authMiddleware]) // Infers 'user' into context
  .handler(async ({ context }) => {
     const userId = context.user.id;
     // ...
  });

```

### 3. Server Functions (Replacement for tRPC/API)

Use `createServerFn` for all data mutations and sensitive queries.

* **Always** use `.validator()` with Zod for input safety.
* **Context**: Access DB or Auth via `context` injected by middleware.

```ts
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const updateXp = createServerFn({ method: 'POST' })
  .validator(z.object({ amount: z.number() }))
  .handler(async ({ data, context }) => {
    // context.user is available if authMiddleware is used
    return { success: true, newTotal: 100 };
  });

```

### 4. URL-First State (Search & Filtering)

Avoid local `useState` for filters. Use **Typesafe Search Params** to ensure filters are shareable and SEO-friendly.

* **Validation**: Define the schema in the route.
* **Navigation**: Use `Maps` to update params.

```ts
export const Route = createFileRoute('/challenges/')({
  validateSearch: z.object({
    search: z.string().optional(),
    track: z.enum(['all', 'selectors', 'js']).fallback('all'),
  }),
});

function ChallengesPage() {
  const { search, track } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearch = (val: string) => {
    navigate({ search: (prev) => ({ ...prev, search: val }) });
  };
}

```

### 5. Client Data Fetching (TanStack Query)

For high-frequency UI updates (like live search), use `useQuery` with `placeholderData`.

```ts
const { data } = useQuery({
  queryKey: ['challenges', search],
  queryFn: () => fetchChallenges(search),
  placeholderData: (prev) => prev, // Standard 2026 pattern to prevent flickering
});

```

### 6. Project Directory Structure

* `src/routes/` - File-based routes (standard)
* `src/server/` - All `.fn.ts` (Server Functions) and `.mw.ts` (Middleware)
* `src/components/ui/` - Shadcn/ui atomic components
* `src/db/` - Drizzle schemas and client config

---

## Best Practices for Agents

1. **No Any**: Use `z.infer` for all Server Function inputs/outputs.
2. **Prefer Server Functions**: Only use `api/` routes for external webhooks or non-React consumers.
3. **Optimistic Updates**: Always implement optimistic UI logic in TanStack Query mutations for a "zero-latency" feel.
4. **Isomorphic Logic**: Keep logic inside `loader` or `Server Functions`. Avoid `useEffect` for data fetching.

---

[TanStack Start 2026 Architecture Diagram]

[This video covers the complete 10-hour deep dive into TanStack Start](https://www.youtube.com/watch?v=FsIASz_Uvd0), including the exact 2026 patterns for Server Functions, Middleware, and the new SSR architecture discussed above.
