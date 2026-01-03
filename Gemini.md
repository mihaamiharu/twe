# Gemini Development Guide for TWE (TestingWithEkki)

This document serves as a context and workflow guide for AI assistants (and human developers) working on the **TestingWithEkki (TWE)** repository. It outlines architectural decisions, development patterns, and common workflows.

## 1. Project Context 🎯

**TWE** is a gamified platform for learning QA automation (Playwright).
**Core Innovation:** It runs Playwright code **entirely in the browser** using a custom compatibility layer (`playwright-shim.ts`) and a sandboxed iframe executor (`iframe-executor.ts`), avoiding the cost and latency of server-side execution.

## 2. Tech Stack & Architecture 🏗️

### Core Framework
- **Framework**: [TanStack Start](https://tanstack.com/start) (Vite-based full-stack React).
- **Routing**: File-based routing in `src/routes/`.
- **Language**: TypeScript 5.0+.

### Data Layer
- **Database**: PostgreSQL 15.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team).
- **Schema**: Defined in `src/db/schema.ts`.
- **Migrations**: Managed via Drizzle Kit (`drizzle/migrations`).

### Authentication
- **Provider**: [BetterAuth](https://better-auth.com).
- **Integration**: `src/lib/auth.*.ts`. Supports Email/Password and Google OAuth.

### UI/UX
- **Styling**: Tailwind CSS v4.
- **Components**: shadcn/ui (Radix Primitives).
- **Editor**: Monaco Editor (`@monaco-editor/react`).
- **Icons**: Lucide React.

## 3. Key Development Workflows 🔄

### A. Database Management
We use Drizzle ORM for all database operations.

1.  **Modify Schema**: Edit `src/db/schema.ts`.
2.  **Generate Migration**:
    ```bash
    bun run db:generate
    ```
3.  **Apply Migration**:
    ```bash
    bun run db:migrate
    ```
4.  **Seed Data** (Crucial for content):
    ```bash
    bun run db:seed           # Base seed
    bun run db:seed:basic     # Seed specific tiers
    ```
5.  **Visualize Data**:
    ```bash
    bun run db:studio
    ```

### B. Creating New Challenges
Challenges are content-driven and stored in the database. To add a new challenge:

1.  **Define Content**: Create a new entry in one of the seed files (e.g., `src/db/seed-beginner-challenges.ts`).
2.  **Structure**:
    - `htmlContent`: The DOM the user interacts with (hidden in iframe).
    - `starterCode`: The initial code in the Monaco editor.
    - `testCases`: Validation logic (can inspect the `page` object or return values).
    - `instructions`: Markdown content explaining the task.
3.  **Run Seed**: Execute the specific seed script to update the DB.

### C. Server Functions (RPC)
We use TanStack Start's server functions for backend logic, avoiding traditional REST API routes where possible.
- **Location**: `src/lib/*.fn.ts` (e.g., `challenges.fn.ts`).
- **Pattern**:
    ```typescript
    import { createServerFn } from '@tanstack/start';
    import { z } from 'zod';

    export const myAction = createServerFn({ method: 'POST' })
      .validator((data: MyType) => data)
      .handler(async ({ data }) => {
          // Server-side logic here (DB calls, etc.)
          return { success: true };
      });
    ```

## 4. The "Magic" Shim Layer ✨

The `src/lib/playwright-shim.ts` file is critical. It mimics the Playwright API using native DOM APIs.

- **When adding features**: If a challenge requires a Playwright method not yet implemented (e.g., `page.dragAndDrop`), you must implement it in the `MockedPlaywrightPage` class in this file.
- **Testing**: Use `src/lib/iframe-executor.ts` to test how code runs within the sandbox.

## 5. Improvement Opportunities 🚀

### Short Term
- **Shim Parity**: The Playwright shim is incomplete. Many advanced matchers and interactions (like precise keyboard events or complex drag-and-drop) need implementation.
- **Mobile Experience**: The split-pane layout (`ChallengePlayground`) is dense. Better mobile optimizations for the coding interface are needed.
- **Error Feedback**: Improve the error messages returned from the `iframe-executor` to be more beginner-friendly.

### Long Term
- **Hybrid Execution**: For extremely complex challenges (e.g., network interception, multiple contexts), consider an optional server-side execution fallback using real Playwright.
- **User Created Content**: Allow users to build challenges using the same schema we use for seeding.

## 6. Common Commands

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start dev server (localhost:3000) |
| `bun run db:studio` | Open database GUI |
| `bun test:unit` | Run unit tests |
| `bun test:integration` | Run integration tests (requires Docker) |
