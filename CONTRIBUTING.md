# Contributing to TestingWithEkki

First off, thanks for taking the time to contribute! 🎉

TestingWithEkki is a platform built for QA engineers to learn modern testing skills. We want to keep the code quality high and the developer experience smooth.

## 🛠️ Prerequisites

You will need the following tools installed:

- **[Bun](https://bun.sh/)** (v1.0+): Our package manager and runtime. Scripts such as `bun run dev` and `bun test` do not run on Node.js alone.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Runs PostgreSQL on macOS and Windows (WSL 2 backend on Windows). Podman is an alternative.
- **Git**: Version control.

## 🚀 Local Development Setup

The same commands work on macOS Terminal and Windows PowerShell. Install Bun,
Git, and Docker Desktop; start Docker Desktop before running setup.

```sh
git clone https://github.com/mihaamiharu/twe.git
cd twe
bun install
bun run setup
bun run dev:local
```

The app runs at [http://localhost:3000](http://localhost:3000). `setup` creates a
missing `.env` with a generated auth secret, starts PostgreSQL, runs migrations,
and syncs content. Existing environment files are preserved. Run setup again after
pulling database migrations or content changes. Daily startup uses `dev:local`.

Use `bun run db:stop` to stop PostgreSQL without deleting your data. See
[Local development](./docs/LOCAL_DEVELOPMENT.md) for both platforms, Podman,
manual/custom databases, optional services, and troubleshooting.

## 💻 Development Workflow

### Branching Strategy

We use a feature-branch workflow.

- `feat/feature-name` for new features
- `fix/bug-fix-name` for bug fixes
- `chore/maintenance` for docs, config, or cleanup

### Commit Messages

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

- `feat: add new challenge type`
- `fix: resolve hydration error on login`
- `style: format code with prettier`
- `docs: update contributing guide`

### Pull Requests

1. Push your branch to your fork or the repository.
2. Open a Pull Request targeting the `qa` (or `main`) branch.
3. Ensure your PR description clearly describes the changes.
4. **Link issues**: If your PR fixes an issue, include `Fixes #123`.

## 🏗️ Architecture & Standards

### Tech Stack

- **Framework**: TanStack Start (Vite + React Router)
- **Database**: Drizzle ORM + PostgreSQL
- **Auth**: BetterAuth
- **Testing**: Playwright + Bun Test

### Key Patterns

- **Routing**: We use file-based routing in `src/routes/`.
- **Server Functions**: Use `createServerFn` for API logic. ALWAYS validate input with Zod.
- **Data Fetching**: Use `useQuery`. For search inputs, use `placeholderData: keepPreviousData` to avoid flickering.
- **Database**: Import `db` from `@/db`.

## 🧪 Testing

All new features **must** include tests.

### Unit & Integration Tests

Run unit and integration tests using Bun's built-in test runner:

```bash
bun test
```

### End-to-End (E2E) Tests

We use Playwright for E2E testing. The command below creates an isolated,
disposable PostgreSQL 15 container with Docker (or Podman), applies the schema
and content, starts the app in test mode, provisions test users, and cleans up
its resources when the run finishes. Ensure your container runtime is running
before starting the suite. Docker is used when it is on `PATH`, otherwise
Podman; force one with `E2E_CONTAINER_RUNTIME`.

```bash
bun run test:e2e
```

## 🧹 Linting & Formatting

Before submitting a PR, please run the linter and formatter:

```bash
bun run lint
bun run format
```

## 📜 License

By contributing, you agree that your contributions will be licensed under its MIT License.
