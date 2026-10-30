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

The migration branch runs TanStack Start through a thin Cloudflare Worker and a SQLite-backed Durable Object for dynamic compute, with D1 and Static Assets. The owner requires strict $0 and has deferred cutover pending Free-plan validation. Install Node.js 22.12+ (for the Cloudflare/Vite toolchain), Bun and Git, then:

```sh
git clone https://github.com/mihaamiharu/twe.git
cd twe
bun install --frozen-lockfile
bun run setup
bun run dev:local
```

Open [http://localhost:3000](http://localhost:3000). Setup preserves `.env`/`.dev.vars`, creates local D1 state and syncs editorial content. Docker/Podman and PostgreSQL are not required for this branch. Production remains on the VPS until the migration's readiness/cutover gates are approved.

See [Local development](./docs/LOCAL_DEVELOPMENT.md) and [Cloudflare operations](./docs/CLOUDFLARE_OPERATIONS.md).

### Run the end-to-end suite

```sh
bunx playwright install chromium
bun run test:e2e
```

The runner creates its own disposable local D1 state, applies migrations, starts a test-mode Worker, provisions synthetic users and removes its own app/state afterward. It selects a free application port; E2E_APP_PORT can override it. The normal local database and remote resources are excluded. The migration owner will run this locally before release.

## 📦 Tech Stack

| Category        | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| **Framework**   | [TanStack Start](https://tanstack.com/start)                |
| **Language**    | TypeScript 5.0                                              |
| **Database**    | Cloudflare D1 + [Drizzle ORM](https://orm.drizzle.team)     |
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
bun run dev:local  # Start local workerd/D1 development server
bun run dev        # Start Vite with local workerd/D1
bun run build      # Build for production
bun run start      # Preview the built Worker locally
bun run test       # Run tests (Bun Test)
bun run db:migrate # Run database migrations
bun run db:sync    # Sync tutorials, challenges, and achievements
bun run db:studio  # List local D1 tables
```

## 🧪 Testing & CI/CD

Pull requests to `main` run quality/build, unit, disposable D1 integration and E2E jobs. An aggregate Required CI gate requires all jobs. Cloudflare deployment is a manual candidate workflow with a pinned SHA, environment isolation and explicit production approval; merging no longer deploys a VPS container.

```sh
bun run test:unit
bun run test:integration
bun run test:ci    # lint/typecheck/unit/D1 integration/build
bun run test:e2e   # separate local browser run before release
```

See [data transfer](./docs/CLOUDFLARE_DATA.md), [schema/rewards](./docs/CLOUDFLARE_D1.md), and [cutover/rollback](./docs/CLOUDFLARE_CUTOVER.md). Existing PostgreSQL migrations and tools remain available for recovery until retirement.

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
