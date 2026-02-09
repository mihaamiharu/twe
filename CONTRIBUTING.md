# Contributing to TestingWithEkki

First off, thanks for taking the time to contribute! 🎉

TestingWithEkki is a platform built for QA engineers to learn modern testing skills. We want to keep the code quality high and the developer experience smooth.

## 🛠️ Prerequisites

You will need the following tools installed:

- **[Bun](https://bun.sh/)** (v1.0+): Our package manager and runtime.
- **[Docker](https://www.docker.com/)** or **Podman**: Required for the local PostgreSQL database.
- **Git**: Version control.

## 🚀 Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/mihaamiharu/twe.git
   cd twe
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   > **Note**: You may need to adjust `DATABASE_URL` in `.env` if your local Docker setup differs.

4. **Start the database**

   ```bash
   docker compose up -d
   ```

5. **Run database migrations**

   ```bash
   bun run db:migrate
   ```

6. **Start the development server**

   ```bash
   bun run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

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

We use Playwright for E2E testing. This requires the Docker container to be running.

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
