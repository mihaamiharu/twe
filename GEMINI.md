# TestingWithEkki (TWE) - Project Context & Guidelines

TestingWithEkki is a free, practical software testing learning platform created by Ekki for QA Engineers, manual testers transitioning to automation, and SDETs. It delivers a bilingual (`EN`/`ID`) web automation curriculum (9 modules, 28 lessons), an in-browser coding playground for Playwright, TypeScript/JavaScript, and CSS/XPath practice (107 active challenges), interactive Labs, progress tracking (XP, levels, achievements), and optional newsletter/mentoring touchpoints.

## 🚀 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite + `@cloudflare/vite-plugin`)
- **Hosting & Compute**: Cloudflare Workers Free — thin Worker gateway (`src/server.ts`) forwarding dynamic Start requests to a single SQLite-backed `AppRuntime` Durable Object, plus Static Assets. Strict-$0 Cloudflare Free architecture; Paid plans are not an approved fallback.
- **Language**: TypeScript 5.7+
- **Runtime & Tooling**: [Bun](https://bun.sh/) + Node.js 22.12+ (for the Wrangler/Vite toolchain)
- **Database**: Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team) (`drizzle.d1.config.ts`). Legacy PostgreSQL migration and recovery helpers remain under `src/db/legacy/`.
- **Authentication**: [BetterAuth](https://better-auth.com) (Email/Password + Google OAuth)
- **UI & Styling**: Tailwind CSS v4, shadcn/ui, [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Internationalization**: i18next / react-i18next (`en` and `id` under `src/lib/i18n/resources/`)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Routing**: [TanStack Router](https://tanstack.com/router) (Locale-prefixed file-based routing under `src/routes/$locale/`)

## 🏗️ Core Architecture

### 1. Cloudflare Compute Boundary (`src/server.ts`)
- The Worker gateway handles security headers, preview Basic Auth, `MAINTENANCE_MODE`, static assets, and scheduled D1 cleanup (`rate_limit_buckets`, `reward_operations`).
- Dynamic TanStack Start requests are forwarded to the single named SQLite-backed `AppRuntime` Durable Object (`APP_RUNTIME`), while application state stays in D1 (`DB`).
- Preserve this compute boundary and do not create per-user/per-request Durable Objects.

### 2. Server Functions & Middleware (`src/server/`)
Mutations and sensitive queries are implemented using `createServerFn` from TanStack Start.
- **Location**: `src/server/*.fn.ts` (Server Functions) and `src/server/*.mw.ts` (Middleware).
- **Convention**: Always use `.inputValidator(z.object({...}))` for input safety and `*.fn.ts` / `*.mw.ts` naming.
- **Middleware**: Composable `createMiddleware()` handles auth (`auth.mw.ts`), logging (`logging.mw.ts`), D1-backed rate limiting (`rate-limit.mw.ts`), response policy (`response-policy.mw.ts`), and Sentry (`sentry.mw.ts`).

### 3. Challenge Execution Engine (`src/core/executor/`)
User code (Playwright, TypeScript, JavaScript, CSS/XPath) runs **client-side** in a sandboxed `<iframe>` for instant feedback and zero server-side code execution risk.
- **Playwright Shim**: `src/core/executor/playwright-shim.ts` and `playwright-methods.ts` emulate the Playwright API against the sandbox DOM.
- **Iframe Executor**: `src/core/executor/iframe-executor.ts` and `iframe-template.ts` isolate execution and intercept console/assertion traces.
- **TypeScript Transpiler**: `src/core/executor/typescript-transpiler.ts` compiles TypeScript in the browser via `esbuild-wasm`.
- **Validators**: `selector-validator.ts`, `dom-validator.ts`, and `challenge-validator.ts` evaluate solutions before server-side submission and XP recording.

### 4. Database Schema (`src/db/schema.ts`)
SQLite/D1 schema managed with Drizzle ORM (`drizzle.d1.config.ts`):
- **Auth & Users**: `users` (extended with `xp`, `level`, `role`, privacy flags), `sessions`, `accounts`, `verification`.
- **Learning & Practice**: `tutorials`, `challenges`, `submissions`, progress tracking, and `achievements`.
- **Community & Operations**: `bug_reports`, `newsletter_subscribers`, `contact_messages`, `rate_limit_buckets`, `reward_operations`.

### 5. Content & Bundled Catalog (`tutorials/`, `content/challenges/`)
- **Curriculum**: Bilingual Markdown lessons (`tutorials/en/`, `tutorials/id/`) indexed by `tutorials/registry.json` (9 modules, 28 lessons).
- **Challenges**: JSON challenge tiers (`content/challenges/basic.json`, `beginner.json`, `typescript.json`, `intermediate.json`, `e2e.json` — 107 active challenges; `_expert-inactive.json` is inactive).
- **Bundling & Sync**: `bun run content:generate` builds `src/server/generated/content-manifest.json` read by `src/server/content-catalog.server.ts`. `bun run db:sync` generates the manifest and syncs editorial metadata and achievements into local D1.

### 6. Project Directory Layout
- `src/server.ts` - Cloudflare Worker gateway & `AppRuntime` Durable Object
- `src/server/` - Server Functions (`*.fn.ts`), middleware (`*.mw.ts`), bundled catalog, email, OG image pipeline
- `src/core/executor/` - Client-side Playwright shim, iframe executor, TypeScript transpiler, validators
- `src/routes/` - File-based routes (`$locale/learn/`, `$locale/practice/`, `$locale/labs.tsx`, `$locale/contact.tsx`, `admin/`, `api/`)
- `src/components/` - UI components (`ui/`, `challenges/`, `tutorials/`, `gamification/`, `auth/`, `admin/`, `analytics/`)
- `src/db/` - D1 Drizzle schema (`schema.ts`, `index.ts`) and legacy PostgreSQL recovery helpers (`legacy/`)
- `src/lib/` - Query options, catalog helpers, i18n resources (`i18n/`), gamification, achievements, SEO/OG helpers
- `src/runtime/` - Platform abstractions for `workerd`, `browser`, and local CLI environments

## 🛠️ Development Workflow

### Key Commands
- `bun run setup`: Create local `.dev.vars` secret if absent, apply D1 migrations, and sync editorial content/achievements into local D1.
- `bun run dev:local`: Start Vite development server with local workerd/D1 (`http://localhost:3000`).
- `bun run dev`: Start Vite directly with local workerd/D1 (`vite dev --port 3000`).
- `bun run build` / `bun run preview`: Build and preview the Cloudflare Worker/client bundle locally.
- `bun run start`: Run the built Worker locally via `wrangler dev`.
- `bun run db:migrate`: Apply checked-in local D1 migrations (`wrangler d1 migrations apply DB --local`).
- `bun run db:generate`: Generate a reviewed SQLite/D1 migration (`drizzle.d1.config.ts`).
- `bun run db:sync`: Regenerate the content manifest and sync tutorials, challenges, and achievements into local D1.
- `bun run db:studio`: Inspect local D1 tables via Wrangler.
- `bun run cf:db:migrate:preview`: Apply migrations to the isolated remote preview D1 target.
- `bun run typecheck` / `bun run lint`: Run TypeScript and ESLint checks.
- `bun run test` / `bun run test:unit`: Run unit and logic tests (Bun Test).
- `bun run test:integration`: Run disposable local D1 integration tests (no Docker/PostgreSQL needed).
- `bun run test:ci`: Run lint, typecheck, unit tests, disposable D1 integration tests, and build.
- `bun run test:e2e`: Run the isolated, disposable Playwright E2E suite against a local test-mode Worker.

### Environment Setup
- Install Node.js 22.12+ (for the Cloudflare/Vite toolchain), Bun, and Git on macOS, Windows, or Linux.
- No Docker Desktop or local PostgreSQL container is required for normal development.
- Run `bun install --frozen-lockfile`, `bun run setup`, then `bun run dev:local`.
- See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) and [AGENTS.md](AGENTS.md) for local D1 workflows, troubleshooting, and Cloudflare preview/production guardrails.

## 💅 Coding Standards

- **Routing**: Use locale-prefixed file-based routing under `src/routes/$locale/`. Use URL-first typesafe search params (`validateSearch`) for filters and catalog state.
- **Components**: Functional components, PascalCase. Kebab-case for filenames (e.g., `challenge-card.tsx`).
- **Styling**: Use `cn()` for Tailwind CSS v4 classes and preserve the Rebrand V1 warm editorial design tokens (`--warm-canvas`, `--paper-surface`, `--graphite`, `--brand-orange*`).
- **Bilingual Parity**: Keep `en` and `id` translation keys in sync under `src/lib/i18n/resources/`.
- **Data Fetching**: Use TanStack Query (`useQuery` / `useMutation`) calling Server Functions. Avoid `useEffect` for data fetching.
- **Type Safety**: No `any`. Use Zod for validation and `z.infer` for types.
- **Server vs. Client**: Never import server-only modules (`node:fs`, `cloudflare:workers`, D1/server helpers) into client components. Keep sensitive logic in `src/server/*.fn.ts`.

## 🤖 Agent Guidelines

- **Strict-$0 Compute Guardrail**: Keep the Cloudflare Free stack (`AppRuntime` Durable Object + D1 + Static Assets). Do not introduce paid Cloudflare services, Docker, or PostgreSQL into the runtime path.
- **Surgical DB Updates**: When modifying D1 tables, update `src/db/schema.ts`, run `bun run db:generate`, and verify with `bun run db:migrate`.
- **Server Functions**: Prefer `src/server/*.fn.ts` over REST endpoints in `src/routes/api/` (reserve API routes for auth, OG images, webhooks, and test-mode hooks).
- **Playwright Shim**: If a challenge needs a new Playwright API, implement it in `src/core/executor/playwright-shim.ts` and `playwright-methods.ts`.
- **Optimistic UI**: Implement optimistic updates in TanStack Query mutations where appropriate for a responsive UX.
- **Documentation**: Refer to `AGENTS.md`, `docs/LOCAL_DEVELOPMENT.md`, `docs/CLOUDFLARE_OPERATIONS.md`, and `docs/ARCHITECTURE.md` for detailed conventions.
