# TestingWithEkki 🎯

A free, practical software testing learning platform created by **Ekki** — learn how the web works, practice Playwright and modern test automation directly in the browser, subscribe for new lessons and Labs, and optionally reach out for 1:1 QA mentoring or collaborations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![TanStack](https://img.shields.io/badge/TanStack-Start-orange)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20Free-F38020)

## ✨ Features

- 📚 **Bilingual Web Automation Curriculum (`EN`/`ID`)** - 9 progressive modules and 28 structured lessons (26 core + 2 optional) covering automation judgment, HTML/DOM inspection, Playwright locators, synchronization, assertions, debugging flaky tests, maintainable suites, and CI delivery
- 🎮 **In-Browser Practice Playground** - 107 active hands-on challenges in Monaco Editor with instant client-side sandboxed execution (Playwright, TypeScript, JavaScript, CSS Selectors, and XPath)
- 🧪 **Interactive Labs** - Realistic browser testing targets for practicing real-world scenarios
- 🏆 **Progress Tracking & Gamification** - Earn XP from lessons and challenges, level up, unlock 20 achievements, and optionally join the leaderboard
- ✉️ **Creator-Led Updates & Mentoring** - Subscribe to the newsletter for new lessons and Labs, file structured QA bug reports, or reach out for 1:1 QA mentoring and collaborations
- 🔐 **Authentication** - Email/Password (with verification) and Google OAuth powered by BetterAuth

## 🚀 Quick Start

Production runs TanStack Start through a thin Cloudflare Worker and a SQLite-backed `AppRuntime` Durable Object for dynamic compute, with D1 and Static Assets. Hosting uses **Cloudflare Free**; Paid plans are not an approved fallback. Install Node.js 22.12+ (for the Cloudflare/Vite toolchain), Bun, and Git, then:

```sh
git clone https://github.com/mihaamiharu/twe.git
cd twe
bun install --frozen-lockfile
bun run setup
bun run dev:local
```

Open [http://localhost:3000](http://localhost:3000). Setup preserves existing `.env`/`.dev.vars`, creates local D1 state, applies migrations, and syncs editorial content and achievements. Docker/Podman and PostgreSQL are not required for local development.

See [Local development](./docs/LOCAL_DEVELOPMENT.md) and [Cloudflare operations](./docs/CLOUDFLARE_OPERATIONS.md).

### Run the end-to-end suite

```sh
bunx playwright install chromium
bun run test:e2e
```

The runner creates its own disposable local D1 state, applies migrations, starts a test-mode Worker, provisions synthetic users, and removes its own app/state afterward. It selects a free application port (`E2E_APP_PORT` can override it). The normal local database and remote resources are excluded.

## 📦 Tech Stack

| Category           | Technology                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| **Framework**      | [TanStack Start](https://tanstack.com/start) (React 19 + Vite)             |
| **Hosting/Edge**   | Cloudflare Workers Free + `AppRuntime` Durable Object + Static Assets      |
| **Language**       | TypeScript 5.7+                                                            |
| **Database**       | Cloudflare D1 (SQLite) + [Drizzle ORM](https://orm.drizzle.team)           |
| **Auth**           | [BetterAuth](https://better-auth.com)                                      |
| **UI & Styling**   | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4                       |
| **Code Editor**    | [Monaco Editor](https://microsoft.github.io/monaco-editor/)                |
| **i18n**           | i18next + react-i18next (`en` / `id`)                                      |
| **Markdown**       | react-markdown + rehype-highlight + remark-gfm                             |

## 📂 Project Structure

```
content/
└── challenges/           # Active JSON challenge tiers (basic, beginner, typescript, intermediate, e2e)
tutorials/
├── registry.json         # 9 modules / 28 lesson definitions & practice links
├── en/                   # English lesson markdown files
└── id/                   # Indonesian lesson markdown files
src/
├── server.ts             # Cloudflare Worker gateway & AppRuntime Durable Object
├── core/
│   └── executor/         # Sandboxed iframe executor, Playwright shim, TS transpiler, validators
├── server/               # Server Functions (*.fn.ts), middleware (*.mw.ts), bundled catalog, OG pipeline
├── components/
│   ├── auth/             # Login, Register, OAuth
│   ├── challenges/       # Playground, Monaco editor, test runner & results
│   ├── tutorials/        # Lesson reader, module navigation, completion UI
│   ├── gamification/     # XP progress, achievements, leaderboard
│   ├── admin/            # Admin management views
│   └── ui/               # shadcn/ui atomic components
├── lib/
│   ├── i18n/             # Bilingual EN/ID resources & settings
│   ├── gamification.ts   # XP & leveling logic
│   ├── achievements.ts   # 20 achievement definitions & evaluators
│   └── *.query.ts        # TanStack Query options & catalog helpers
├── routes/
│   ├── $locale/          # Locale-prefixed pages (home, learn, practice, labs, leaderboard, contact, profile)
│   ├── admin/            # Admin dashboard routes
│   └── api/              # Auth handler, dynamic OG images, test-mode endpoints
├── runtime/              # Workerd, browser, and local CLI platform bindings
└── db/
    ├── schema.ts         # Drizzle SQLite/D1 schema
    └── legacy/           # Retired PostgreSQL recovery tooling
```

## 🔧 Available Scripts

```bash
bun run setup            # Initialize local .dev.vars, D1 migrations, and editorial sync
bun run dev:local        # Start local workerd/D1 development server (port 3000)
bun run dev              # Start Vite directly with local workerd/D1
bun run build            # Build Worker, client bundle, and static assets
bun run preview          # Preview the built application locally
bun run start            # Run the built Worker via wrangler dev
bun run typecheck        # Run TypeScript type checking
bun run lint             # Run ESLint across the repository
bun run test             # Run unit tests (Bun Test)
bun run db:generate      # Generate a Drizzle migration for D1
bun run db:migrate       # Apply checked-in local D1 migrations
bun run db:sync          # Generate content manifest and sync tutorials, challenges, achievements
bun run db:studio        # Inspect local D1 tables via Wrangler
```

## 🧪 Testing & CI/CD

Pull requests to `main` run quality/build, unit, disposable D1 integration, and E2E jobs behind an aggregate Required CI gate. Cloudflare deployment is a manual candidate workflow with a pinned SHA, environment isolation, and explicit production approval.

```sh
bun run test:unit
bun run test:integration
bun run test:ci    # lint, typecheck, unit, disposable D1 integration, build
bun run test:e2e   # separate isolated local browser run before release
```

See [schema & rewards](./docs/CLOUDFLARE_D1.md), [deployment & rollback](./docs/CLOUDFLARE_OPERATIONS.md), and [backup tooling](./docs/CLOUDFLARE_BACKUPS.md). Legacy PostgreSQL migrations and recovery tools remain under `src/db/legacy/`.

## 📚 Bilingual Curriculum (`EN`/`ID`)

The **Learn** curriculum (`/en/learn`, `/id/learn`) contains **9 progressive modules and 28 lessons** (26 core + 2 optional), fully localized in English and Indonesian:

1. **Automation Foundations & Judgment** (2 lessons)
2. **Read the Web UI** (3 lessons)
3. **First Test & Just-Enough Code** (4 lessons)
4. **Reliable Locators & Testability** (4 lessons — 3 core, 1 optional)
5. **Actions, Navigation & Synchronization** (3 lessons)
6. **Meaningful Assertions & Test Design** (2 lessons)
7. **Reliability, Isolation & Debugging** (3 lessons)
8. **Maintainable Suites** (4 lessons — 3 core, 1 optional)
9. **Ship & Prove** (3 lessons)

## 🎮 Challenge Types & Library

The **Practice** playground (`/en/practice`, `/id/practice`) includes **107 active challenges** across 5 challenge types (**Playwright**, **JavaScript**, **TypeScript**, **CSS Selector**, and **XPath Selector**) organized into 4 progressive tiers:

| Tier | Source File(s) | Count | Focus Areas |
| --- | --- | --- | --- |
| **Basic** (Selectors) | `basic.json` | 36 | CSS Selectors (20), XPath (16), CSS vs XPath |
| **Beginner** (Scripting) | `beginner.json`, `typescript.json` | 36 | JavaScript Fundamentals, DOM, Async (26) + TypeScript Fundamentals (10) |
| **Intermediate** (Playwright Core) | `intermediate.json` | 32 | Navigation & Actions, Locators, Assertions, Wait Strategies, Debugging |
| **E2E Testing** | `e2e.json` | 3 | Page Object Model, Integration Patterns |

### Example Playwright Challenge

```javascript
// Locate and fill a form field
await page.getByLabel('Email').fill('test@example.com');

// Click the submit button
await page.getByRole('button', { name: 'Submit' }).click();

// Assert visible outcome
await expect(page.getByText('Success')).toBeVisible();
```

## 🏆 Progress & Gamification

- **XP System**: Earn XP for completing challenges (Easy: 10–30 XP, Medium: 40–70 XP, Hard: 80–150 XP, plus E2E capstones up to 200 XP) and finishing lessons (25 XP per lesson)
- **Levels**: Quadratic progression using `100 × level²`
- **Achievements**: 20 achievements across Challenges, Tutorials, Streak, XP, and Special categories
- **Leaderboard**: Optional rankings with opt-in privacy controls

## 📄 Documentation

See the `/docs` folder for detailed documentation:

- [PRD.md](./docs/PRD.md) - Product Requirements & Creator-Led Positioning
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System & Execution Engine Architecture
- [LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) - Local Cloudflare Workers & D1 Setup
- [CLOUDFLARE_OPERATIONS.md](./docs/CLOUDFLARE_OPERATIONS.md) - Deployment, Preview & Rollback Guide
- [CLOUDFLARE_D1.md](./docs/CLOUDFLARE_D1.md) - D1 Schema & Rewards Reference
- [TDD.md](./docs/TDD.md) - Technical Design
- [app_flows.md](./docs/app_flows.md) - User Flow Diagrams

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License.

## 👤 Creator

**Ekki** - [testingwithekki.com](https://testingwithekki.com)

---

Built with ❤️ using TanStack Start on Cloudflare Free
