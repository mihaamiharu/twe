# TestingWithEkki 🎯

A gamified platform for learning QA testing skills through interactive tutorials, coding challenges, and a Playwright-compatible code editor.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TanStack](https://img.shields.io/badge/TanStack-Start-orange)

## ✨ Features

- 📚 **Interactive Tutorials** - Learn testing concepts with markdown-rendered content and syntax highlighting
- 🎮 **Challenge Playground** - Write Playwright-style code in Monaco Editor with real-time execution
- 🎯 **CSS/XPath Selectors** - Practice DOM element selection with visual feedback
- 🏆 **Gamification** - Earn XP, level up, unlock achievements, and compete on leaderboards
- 🔐 **Authentication** - Secure login with Email/Password (with verification) or Google OAuth
- 🐛 **Bug Reporting** - Report issues with QA-style structured forms

## 🚀 Quick Start

Use the same workflow on **macOS and Windows**: Bun runs the app, and Docker
Desktop runs PostgreSQL 15. Install Bun, Git, and Docker Desktop, then start
Docker Desktop and wait until `docker info` succeeds.

```sh
git clone https://github.com/mihaamiharu/twe.git
cd twe
bun install
bun run setup
bun run dev:local
```

Open [http://localhost:3000](http://localhost:3000).

`setup` creates a missing `.env` with a generated auth secret, starts the database,
applies migrations, and syncs content. It preserves existing `.env` files.
`dev:local` starts the database and app without rerunning initialization.

```sh
bun run db:up      # Start only the local dev database
bun run db:stop    # Stop it while preserving data
```

The helpers use `postgresql://twe_user:twe_password@localhost:5432/twe_db` and
reject custom database URLs or `DIRECT_URL`. For manual setup, Podman, optional
integrations, and troubleshooting, see [Local development](./docs/LOCAL_DEVELOPMENT.md).

### Run the end-to-end suite

```bash
bun run test:e2e
```

This command creates a disposable PostgreSQL 15 container, applies migrations
and synced content, starts the app in `NODE_ENV=test`, provisions isolated
regular and admin accounts, runs the full Playwright suite, and removes its
container and app process even when a test fails. It selects verified free
local ports automatically. Set `E2E_DB_PORT` or `E2E_APP_PORT` to a specific
free port when needed, or set either to `0` to request automatic selection.
The runner uses Docker when it is on `PATH`, otherwise Podman. Set
`E2E_CONTAINER_RUNTIME=docker` or `E2E_CONTAINER_RUNTIME=podman` to force a
specific runtime, as GitHub Actions does with `docker`.

The command only removes the uniquely named container it created; it does not
stop or remove the development databases from `docker compose`. Install the
browser once with `bunx playwright install chromium` before the first run.

## 📦 Tech Stack

| Category        | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| **Framework**   | [TanStack Start](https://tanstack.com/start)                |
| **Language**    | TypeScript 5.0                                              |
| **Database**    | PostgreSQL 15 + [Drizzle ORM](https://orm.drizzle.team)     |
| **Auth**        | [BetterAuth](https://better-auth.com)                       |
| **UI**          | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS           |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Markdown**    | react-markdown + rehype-highlight                           |

## 📂 Project Structure

```
src/
├── components/
│   ├── auth/           # Login, Register, OAuth
│   ├── challenges/     # CodeEditor, Playground, TestResults
│   ├── gamification/   # XPProgress, Achievements, Leaderboard
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── auth.*.ts       # BetterAuth config
│   ├── playwright-shim.ts # Mocked Playwright API
│   ├── iframe-executor.ts # Sandboxed code execution
│   ├── gamification.ts # XP & leveling logic
│   └── achievements.ts # Achievement definitions
├── routes/
│   ├── index.tsx       # Home
│   ├── login.tsx       # Auth
│   ├── tutorials/      # Tutorial pages
│   ├── challenges/     # Challenge playground
│   ├── profile.tsx     # User dashboard
│   └── leaderboard.tsx # Rankings
└── db/
    └── schema.ts       # Drizzle schema
```

## 🔧 Available Scripts

```bash
bun run setup      # Initialize local env, database, and content
bun run dev:local  # Start local database and development server
bun run dev        # Start app only (manual/custom DB workflow)
bun run build      # Build for production
bun run start      # Start production server
bun run test       # Run tests (Bun Test)
bun run db:migrate # Run database migrations
bun run db:sync    # Sync tutorials, challenges, and achievements
bun run db:studio  # Open Drizzle Studio
```

## 🧪 Testing & CI/CD

Pull requests to `main` run quality/build, unit, integration, and E2E jobs in
parallel. Integration and E2E each own an isolated PostgreSQL database; the E2E
runner also starts the app and provisions its test users. An aggregate
`Required CI` job fails unless every job succeeds. Production deployment runs
only after the same gate passes on `main`.

Local integration tests run against a dedicated PostgreSQL container.

### Running Subsets

```bash
bun run test:unit         # Only unit tests
# Integration tests use the test database on port 5433, not the dev database:
docker compose up -d --wait postgres_test
bun run test:integration  # Only integration tests
```

### Local CI/CD (One-Command)

To run everything (Infrastructure + Tests) in one go:

```bash
bun run test:ci
```

_Starts `postgres_test`, runs all tests, and stops the container cleanup regardless of result._

### Manual Database Control

If you want to keep the test database running:

```bash
docker compose up -d --wait postgres_test
bun test
# docker compose stop postgres_test
```

## 🎮 Challenge Types

| Type             | Description                             |
| ---------------- | --------------------------------------- |
| **JavaScript**   | Write JS functions to solve problems    |
| **Playwright**   | Write Playwright-style automation code  |
| **CSS Selector** | Select elements using CSS selectors     |
| **XPath**        | Select elements using XPath expressions |

### Example Playwright Challenge

```javascript
// Click the submit button
await page.click('#submit-btn');

// Fill a form field
await page.fill('#email', 'test@example.com');

// Assert text content
const text = await page.textContent('.success');
expect(text).toContain('Success');
```

## 🏆 Gamification

- **XP System**: Earn XP for completing challenges (Easy: 20, Medium: 55, Hard: 115)
- **Levels**: Level up using formula `100 × level²`
- **Achievements**: 20+ achievements across categories (Challenges, Streak, XP, Special)
- **Leaderboard**: Compete with others (opt-in privacy)

## 📊 Challenge Library

The platform includes **96 challenges** across 4 progressive tiers:

| Tier         | Count | Focus Areas                              |
| ------------ | ----- | ---------------------------------------- |
| Basic        | 23    | CSS Selectors, XPath, Comparison         |
| Beginner     | 23    | JavaScript Fundamentals, DOM, Async      |
| Intermediate | 29    | Playwright Actions, Locators, Assertions |
| Expert       | 21    | Page Object Model, Data-Driven Testing   |

## 📄 Documentation

See the `/docs` folder for detailed documentation:

- [PRD.md](./docs/PRD.md) - Product Requirements
- [TDD.md](./docs/TDD.md) - Technical Design
- [github_issues.md](./docs/github_issues.md) - Issue Breakdown
- [app_flows.md](./docs/app_flows.md) - User Flow Diagrams

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## 👤 Author

**Ekki** - [testingwithekki.com](https://testingwithekki.com)

---

Built with ❤️ using TanStack Start
