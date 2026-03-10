# TestingWithEkki Architecture & Data Fetching

Welcome to the TestingWithEkki API and Data Fetching documentation.

> [!IMPORTANT]
> The application has migrated from traditional REST endpoints (e.g., `/api/challenges`) to **TanStack Start Server Functions**. 
> There is no longer an OpenAPI/Swagger definition because client-server communication is handled through type-safe RPCs.

## Server Functions

Following the 2026 TanStack Start conventions, we use `createServerFn` for all data mutations and sensitive queries located in `src/server/`. 

### Key Concepts

1. **RPC over REST**: Instead of `fetch(/api/resource)`, UI components import Server Functions directly (e.g., `import { getChallenges } from '~/server/challenges.fn'`) and call them. TanStack Start handles the network serialization automatically.
2. **Type Safety**: Inputs and outputs are strictly typed using Zod validations (`validator(z.object({...}))`). There is no need for external Swagger docs to know the API schema.
3. **Middleware**: Authentication, Rate Limiting, and Logging are injected securely on the server via Composable Middleware (`src/server/*.mw.ts`), injecting context directly into the handlers.

### Directory Structure

All API logic lives in `src/server/`:
- `*.fn.ts` - Server Functions (Handlers)
- `*.mw.ts` - Middleware (Auth context, Logging, Rate Limiting)
- `*.server.ts` - Core server utilities and adapters

## Auth Endpoints

Authentication is still handled by **BetterAuth**, which manages its own API routes under `src/routes/api/auth/`. For interacting with auth on the client, use the provided BetterAuth hooks (`useSession()`) or client utilities rather than raw REST calls.

## Example: Calling a Server Function

**Server Definition (`src/server/challenges.fn.ts`)**
```ts
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const getChallengeDetails = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    // Database logic here
    return { title: '...', description: '...' };
  });
```

**Client Usage (`src/routes/challenges/$slug.tsx`)**
```ts
import { useQuery } from '@tanstack/react-query';
import { getChallengeDetails } from '~/server/challenges.fn';

function ChallengePage({ slug }) {
  const { data } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => getChallengeDetails({ data: { slug } }),
  });
  
  // React easily renders the strongly-typed data
}
```

For more info, review `AGENTS.md` for in-depth architectural principles.
