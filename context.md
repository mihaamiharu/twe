# Project: TestingWithEkki

This is a gamified web application designed to teach Quality Assurance (QA) testing skills. Users can learn through interactive tutorials, solve coding challenges, and practice writing automation scripts in a built-in code editor.

## Core Features

- **Interactive Tutorials**: Educational content is presented in Markdown format with syntax highlighting for code examples.
- **Coding Playground**: An integrated Monaco Editor allows users to write and execute Playwright-style automation code directly in the browser. The execution is sandboxed for security.
- **Selector Practice**: Specific challenges focus on mastering CSS and XPath selectors, with visual feedback to help users understand how they work.
- **Gamification**: The platform incorporates game-like elements to motivate users:
    - **Experience Points (XP)**: Earned by completing challenges.
    - **Levels**: Users can level up based on their XP.
    - **Achievements**: Unlockable badges for reaching milestones.
    - **Leaderboards**: A competitive ranking of users.
- **Authentication**: Users can sign up and log in using email/password (with email verification) or Google OAuth.
- **Bug Reporting**: A structured form allows users to report bugs they find on the platform.

## Technical Details

- **Framework**: Built with [TanStack Start](https://tanstack.com/start).
- **Language**: [TypeScript](https://www.typescriptlang.org/).
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/).
- **Authentication**: Uses [BetterAuth](https://better-auth.com).
- **Frontend**:
    - **UI Components**: [shadcn/ui](https://ui.shadcn.com).
    - **Styling**: [Tailwind CSS](https://tailwindcss.com/).
    - **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/).
- **Testing**: The project has its own set of unit and integration tests using Vitest.

## Project Structure Overview

- `src/components/`: Contains UI components, organized by feature (auth, challenges, gamification).
- `src/lib/`: Core application logic, including a mocked Playwright API for the in-browser editor, sandboxed code execution, and gamification rules.
- `src/routes/`: Defines the application's pages and URL structure.
- `src/db/schema.ts`: The Drizzle ORM schema defining the database tables.
- `content/`: Contains the raw JSON data for challenges.
- `tutorials/`: Contains the Markdown files for the tutorials.
- `e2e/`: End-to-end tests written with Playwright.
