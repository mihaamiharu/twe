# TestingWithEkki (TWE) - Project Context & Guidelines

TestingWithEkki is a gamified learning platform for QA Engineers and SDETs. It features interactive tutorials, a coding playground for Playwright-style automation, and a gamification system (XP, levels, achievements).

## 🚀 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React + Nitro/Vinxi)
- **Language**: TypeScript 5.0+
- **Runtime & Tooling**: [Bun](https://bun.sh/)
- **Database**: PostgreSQL 15+ with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [BetterAuth](https://better-auth.com)
- **UI & Styling**: Tailwind CSS v4, shadcn/ui, [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based)

## 🏗️ Core Architecture

### 1. Server Functions & Logic
Mutations and sensitive queries are implemented using `createServerFn` from TanStack Start.
- **Location**: `src/lib/*.fn.ts` or `src/server/`.
- **Convention**: Use `.inputValidator(z.object({...}))` for input safety and `*.fn.ts` suffix.
- **Middleware**: Auth and logging are handled via `createMiddleware()`.

### 2. Challenge Execution Engine
User code (Playwright-style) is executed **client-side** for instant feedback and security.
- **Playwright Shim**: `src/core/executor/playwright-shim.ts` mocks the Playwright API using DOM operations.
- **Iframe Executor**: `src/core/executor/iframe-executor.ts` runs user code in a sandboxed `<iframe>`.
- **Validation**: Test results are computed in the browser and then submitted to the server for XP/progress recording.

### 3. Database Schema (`src/db/schema.ts`)
- **Users**: Extended with `xp`, `level`, `role`.
- **Challenges**: Content definitions (HTML, starter code, test cases).
- **Submissions**: Historical records of user attempts.
- **Achievements**: Gamification badges and unlock criteria.

### 4. Content Synchronization
Challenges and tutorials are authored in JSON/Markdown (`content/challenges/`, `tutorials/`) and synchronized to the database.
- **Sync Scripts**: `bun run db:sync` triggers `src/scripts/sync-*.ts`.

## 🛠️ Development Workflow

### Key Commands
- `bun run dev`: Start development server (Port 3000).
- `bun run db:migrate`: Apply database migrations.
- `bun run db:generate`: Generate migrations from schema changes.
- `bun run db:studio`: Open Drizzle Studio for DB exploration.
- `bun run test`: Run unit and logic tests.
- `bun run test:integration`: Run DB-dependent tests (requires Docker).
- `bun run test:e2e`: Run Playwright tests for the platform itself.

### Environment Setup
- Copy `.env.example` to `.env`.
- Use `podman compose up -d` (or Docker) for local PostgreSQL.

## 💅 Coding Standards

- **Routing**: Use file-based routing in `src/routes/`.
- **Components**: Functional components, PascalCase. Kebab-case for filenames (e.g., `challenge-card.tsx`).
- **Styling**: Use `cn()` utility for Tailwind classes. Dark mode is supported via `ThemeProvider`.
- **Data Fetching**: Use `useQuery` and `useMutation` calling Server Functions. Avoid `useEffect` for fetching.
- **Type Safety**: No `any`. Use Zod for validation and `z.infer` for types.
- **Server vs. Client**: Never import server-only modules (`fs`, `postgres`) into client components. Keep logic in Server Functions.

## 🤖 Agent Guidelines

- **Surgical Updates**: When modifying the DB, update `schema.ts`, run `db:generate`, and then `db:migrate`.
- **Server Functions**: Prefer Server Functions over REST APIs (`src/routes/api/`).
- **Playwright Shim**: If a challenge needs a new Playwright method, implement it in `src/core/executor/playwright-shim.ts`.
- **Optimistic UI**: Implement optimistic updates in TanStack Query for a "zero-latency" feel.
- **Documentation**: Refer to `docs/ARCHITECTURE.md` for deep dives into the execution engine.
