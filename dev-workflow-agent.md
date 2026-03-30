# Development Workflow & Agent Guidelines

This document serves as the **source of truth** for development patterns, architectural decisions, and coding standards in the **TestingWithEkki (TWE)** repository. All agents and developers must adhere to these guidelines to ensure consistency.

## 1. Core Architecture 🏗️

### Framework: TanStack Start

- **Routing**: We use **File-Based Routing** in `src/routes`.
  - `__root.tsx`: Global layout and providers.
  - `index.tsx`: Page components.
  - `$slug.tsx`: Dynamic routes.
  - `_authenticated.tsx`: Layout wrapper for protected routes.
- **Data Fetching**:
  - **Loaders**: Use `beforeLoad` in routes for critical data pre-fetching (e.g., Auth).
  - **React Query**: Use standard `useQuery` / `useMutation` hooks in components, calling Server Functions.
- **Server Functions (RPC)**:
  - **DO NOT** create standard REST API routes in `src/routes/api` unless absolutely necessary (e.g., webhooks).
  - **DO** create Server Functions in `src/server/*.fn.ts`.
  - **Pattern**:

    ```typescript
    import { createServerFn } from '@tanstack/start';
    import { getWebRequest } from 'vinxi/http';

    export const myAction = createServerFn({ method: 'POST' })
      .inputValidator((data: MyInput) => data)
      .handler(async ({ data }) => {
        // Logic
      });
    ```

### Database & ORM

- **PostgreSQL** + **Drizzle ORM**.
- **Schema**: Defined in `src/db/schema.ts`.
- **Migrations**: `drizzle/migrations`.
- **Workflow**:
  1.  Edit `src/db/schema.ts`.
  2.  `bun run db:generate` (creates SQL).
  3.  `bun run db:migrate` (applies SQL).
- **Access Pattern**: All DB access happens in `src/server/*.fn.ts` files (Server Functions) or `src/db/*.ts` scripts. Never import `db` directly in client components.

### Authentication

- **BetterAuth**: Handled in `src/lib/auth.*.ts`.
- **Client Usage**: `useSession()` hook from `@/lib/auth.client`.
- **Server Usage**: `auth.api.getSession({ headers: req.headers })`.

## 2. Coding Standards & Style 💅

### React Components

- **Functional Components**: Always.
- **Hooks**: Custom hooks in `src/lib/` or alongside components if specific.
- **Styling**: **Tailwind CSS v4** + **shadcn/ui**.
  - Use `cn()` utility for class merging.
  - Avoid inline styles.
  - Dark mode first (supported via `ThemeProvider`).
- **Icons**: `lucide-react`.

### Project Structure

```
src/
├── components/         # UI & Feature components
│   ├── ui/             # shadcn primitives (DO NOT EDIT logic, only style)
│   ├── challenges/     # Challenge-specific logic
│   └── ...
├── db/                 # Database configuration & seeding
├── lib/
│   ├── *.client.ts     # Client-side only logic
│   └── ...
├── server/
│   ├── *.fn.ts         # Server Functions (Backend Logic)
│   ├── *.mw.ts         # Middleware
│   └── ...
├── routes/             # TanStack Router pages
└── styles/             # Global CSS
```

### Naming Conventions

- **Files**: `kebab-case.tsx` (e.g., `challenge-card.tsx`).
- **Components**: `PascalCase` (e.g., `ChallengeCard`).
- **Functions**: `camelCase` (e.g., `getChallenge`).
- **Server Functions**: `*.fn.ts` suffix is mandatory for clarity.

## 3. The "Shim" Layer (Critical Context) 🪄

This project **does not** run Playwright on the server. It mocks it in the browser.

- **`src/lib/playwright-shim.ts`**:
  - Implements `page.click()`, `expect()`, `locator()`, etc.
  - Uses `document.querySelector` and native DOM events.
  - **Rule**: If a challenge needs a new Playwright method, implement it here first. Do not add a dependency on real Playwright for execution.

- **`src/lib/iframe-executor.ts`**:
  - Manages the sandboxed `<iframe>` where user code runs.
  - Handles `console.log` interception and error catching.

## 4. Database Schema Summary 🗄️

- **`users`**: Extended with `xp`, `level`, `role`.
- **`challenges`**: The core content.
  - `htmlContent`: The DOM string injected into the iframe.
  - `starterCode`: What the user sees in Monaco.
  - `testCases`: JSON structure for validation.
- **`submissions`**: Record of every attempt.
- **`achievements`**: Gamification badges.

## 5. Development Checklist ✅

When implementing a new feature:

1.  **DB Change?** -> Modify `schema.ts`, run `db:generate`, `db:migrate`.
2.  **Backend Logic?** -> Create/Update `src/server/*.fn.ts`.
3.  **UI Component?** -> Check `components/ui` first. If custom, create in `components/`.
4.  **New Challenge Type?** -> Update `playwright-shim.ts` if it requires new API support.
5.  **Verify**: Run `bun run dev` and test manually.
6.  **Test**: Add unit test in `src/tests/` if logic is complex.

## 6. Testing Strategy 🧪

- **Unit Tests**: `bun test`. Focus on utility functions and `playwright-shim.ts`.
- **Integration Tests**: `bun test:integration`. Tests DB interactions and Server Functions.
  - Requires Docker (`docker compose up -d postgres_test`).
- **E2E**: We use Playwright to test the _platform itself_ (not the user's code).

## 7. Common Pitfalls to Avoid ⚠️

- **Server vs Client**:
  - `*.fn.ts` runs on Server.
  - Components run on Client (mostly).
  - **Never** import server-only modules (like `fs`, `postgres`) into client components.
- **Shim Limitations**: The browser shim cannot do everything real Playwright does (e.g., multiple tabs, true network interception). Keep challenges within the DOM manipulation scope.
