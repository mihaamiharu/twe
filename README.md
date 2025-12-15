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
- 🔐 **Authentication** - Secure login with Email/Password or Google OAuth

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+) or Node.js (v22+)
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Git](https://git-scm.com/)

### 1. Clone & Install

```bash
git clone https://github.com/mihaamiharu/twe.git
cd twe
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/twe

# BetterAuth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start Database

```bash
docker compose up -d
```

### 4. Run Migrations

```bash
bun run db:migrate
```

### 5. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) |
| **Language** | TypeScript 5.0 |
| **Database** | PostgreSQL 15 + [Drizzle ORM](https://orm.drizzle.team) |
| **Auth** | [BetterAuth](https://better-auth.com) |
| **UI** | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Markdown** | react-markdown + rehype-highlight |

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
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun run test       # Run tests (Vitest)
bun run db:migrate # Run database migrations
bun run db:studio  # Open Drizzle Studio
```

## 🎮 Challenge Types

| Type | Description |
|------|-------------|
| **JavaScript** | Write JS functions to solve problems |
| **Playwright** | Write Playwright-style automation code |
| **CSS Selector** | Select elements using CSS selectors |
| **XPath** | Select elements using XPath expressions |

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
