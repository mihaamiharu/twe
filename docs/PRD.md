# Product Requirements Document (PRD)

## TestingWithEkki - Practical Software Testing Learning Platform

**Version:** 4.0  
**Updated:** 2026  
**Author:** Ekki  
**Positioning:** Creator-Led Education (Option A)  
**Status:** Live on Cloudflare Free / Iterative Refinement

---

## 1. Executive Summary

**TestingWithEkki** is a free, practical software testing learning platform created by **Ekki** for QA Engineers, manual testers transitioning into automation, and SDETs. Built on **TanStack Start** and hosted on a strict-$0 **Cloudflare Free** stack, it combines a structured bilingual (`EN`/`ID`) web automation curriculum with an in-browser Playwright/JavaScript/TypeScript/Selector coding playground, interactive testing Labs, and lightweight progress tracking.

Rather than functioning as a job-seeker resume or portfolio showcase, TestingWithEkki is positioned as a **creator-led education platform**: learners come to understand how the web works, practice Playwright in the browser with zero local setup friction, subscribe for new lessons and Labs, and optionally reach out for 1:1 QA mentoring or creator collaborations.

### Vision

Build a trusted, practical learning ecosystem where QA practitioners can:

- Learn how browsers, HTML semantics, the DOM, and DevTools actually work before writing brittle scripts
- Practice Playwright, TypeScript/JavaScript, and CSS/XPath selectors safely in an in-browser sandbox
- Follow a clear bilingual (`EN`/`ID`) progression from automation judgment to CI-ready test suites
- Stay connected with new lessons, Labs, community feedback, and optional 1:1 QA mentoring or collaborations

---

## 2. Target Users

### Primary Persona: QA Engineer / Manual Tester / SDET Learner

- **Experience Level:** Manual QA transitioning to automation through mid/senior SDETs sharpening Playwright habits
- **Goals:**
  - Build solid web fundamentals (HTML, DOM, DevTools, async behavior) alongside Playwright skills
  - Practice hands-on automation drills without fighting local tooling or environment setup
  - Learn in English or Indonesian (`EN`/`ID`) with realistic engineering judgment
  - Track learning momentum across modules, lessons, and practice drills
- **Pain Points:**
  - Generic coding platforms rarely teach browser testing judgment, locator contracts, or flaky-test debugging
  - Most automation tutorials are English-only or rely on copy-paste scripts without interactive browser practice
  - Setting up realistic practice apps and test environments locally creates high friction for beginners

### Secondary Persona: Creator & Educator (Ekki)

- **Role:** Platform creator, curriculum author, and QA educator
- **Goals:**
  - Publish high-craft bilingual (`EN`/`ID`) lessons, browser challenges, and interactive Labs
  - Grow an engaged newsletter audience notified when new lessons and Labs ship
  - Offer optional 1:1 QA mentoring and creator-led collaborations (workshops, technical content, community events)
  - Keep hosting sustainable at strict-$0 operational cost on Cloudflare Free

---

## 3. Core Features

### 3.1 Bilingual Curriculum (`/learn` — 9 Modules / 28 Lessons)

#### Bundled Filesystem-First Content Strategy

- **Source of Truth:** Lessons are authored in bilingual Markdown under `tutorials/en/` and `tutorials/id/`, indexed by `tutorials/registry.json`.
- **Bundled Runtime Manifest & D1 Sync:** `bun run content:generate` compiles a static manifest (`src/server/generated/content-manifest.json`) bundled directly into the Cloudflare Worker for fast reads, while `bun run db:sync` synchronizes editorial metadata and achievements into D1.

#### Structured Learning Path

The curriculum spans **9 progressive modules and 28 lessons** (26 core + 2 optional), fully localized in English (`EN`) and Indonesian (`ID`):

| # | Module | Lessons | Focus |
| --- | --- | --- | --- |
| 1 | **Automation Foundations & Judgment** | 2 | What automation proves, risk-based candidate selection |
| 2 | **Read the Web UI** | 3 | Semantic HTML, DOM hierarchy, browser DevTools evidence |
| 3 | **First Test & Just-Enough Code** | 4 | First Playwright test, JS fundamentals, async/await, TypeScript literacy |
| 4 | **Reliable Locators & Testability** | 4 (3 core, 1 opt.) | Locator contracts, strictness & composition, CSS/XPath fallbacks |
| 5 | **Actions, Navigation & Synchronization** | 3 | State-aware interactions, actionability vs. product outcomes, events & frames |
| 6 | **Meaningful Assertions & Test Design** | 2 | Web-first assertions, focused risk-driven test scenarios |
| 7 | **Reliability, Isolation & Debugging** | 3 | Browser contexts, state/data isolation, root-cause flaky test debugging |
| 8 | **Maintainable Suites** | 4 (3 core, 1 opt.) | Justified abstractions (POM), fixtures & lifecycles, project config |
| 9 | **Ship & Prove** | 3 | Reproducible CI runs, feedback policies, end-to-end capstone |

- **Lesson Experience:** Clean markdown reader with syntax highlighting, reading-time estimates, linked practice drills, and completion tracking (+25 XP per lesson).

### 3.2 Interactive Practice Playground (`/practice` — 107 Active Challenges)

#### Supported Challenge Types

1. **Playwright Automation (35 challenges):** Write realistic Playwright scripts (locators, actions, assertions, waits, debugging, Page Object Model, integration flows) executed in an isolated browser sandbox via the custom Playwright shim (`src/core/executor/playwright-shim.ts`).
2. **JavaScript & TypeScript Scripting (36 challenges — 26 JS, 10 TS):** Build automation-relevant coding literacy (control flow, arrays, DOM inspection, async/await, TypeScript types/interfaces) with in-browser TypeScript compilation (`esbuild-wasm`).
3. **CSS & XPath Selectors (36 challenges — 20 CSS, 16 XPath):** Visual DOM preview with real-time match highlighting for legacy DOM fallback fluency.

#### Challenge Library Structure (107 Active Challenges)

Active challenges are sourced from 5 allowlisted JSON files under `content/challenges/` (`basic.json`, `beginner.json`, `typescript.json`, `intermediate.json`, `e2e.json`):

| Tier | Source File(s) | Count | Focus Areas | XP Range |
| --- | --- | --- | --- | --- |
| **Basic** (Selectors) | `basic.json` | 36 | CSS Basics, XPath Basics/Advanced, CSS vs XPath | 10–80 |
| **Beginner** (Scripting) | `beginner.json`, `typescript.json` | 36 | JS Fundamentals, DOM, Async (26) + TS Fundamentals (10) | 15–70 |
| **Intermediate** (Playwright Core) | `intermediate.json` | 32 | Navigation & Actions, Locators, Assertions, Waits, Debugging | 35–120 |
| **E2E Testing** | `e2e.json` | 3 | Page Object Model, Integration Patterns | 140–200 |

- **URL-First Catalog Filtering:** Shareable search params for search queries, track (`all`, `core`, `e2e`, `scripting`, `selectors`), tier, difficulty, view mode, and completion filtering.

### 3.3 Interactive Labs (`/labs`)

- Curated, realistic UI test surfaces designed for experimenting with browser behavior, selectors, form states, and async interactions.

### 3.4 Progress Tracking & Gamification

- **Experience Points (XP) & Levels:** Earned from first-time challenge completions and lessons (25 XP/lesson), with quadratic level progression (`100 × level²`) and idempotent D1 reward tracking (`reward_operations`).
- **Achievements:** 20 achievements across Challenges, Tutorials, Streak, XP, and Special categories (`src/lib/achievements.ts`).
- **Learner Profile & Optional Leaderboard:** Personal progress dashboard (`/$locale/profile`) and opt-in community leaderboard (`/$locale/leaderboard`) with privacy controls.

### 3.5 Newsletter, Mentoring & Community Feedback

- **Newsletter Subscriptions:** Double opt-in subscription flow (`/$locale/confirm-subscription`) notifying learners of new lessons and Labs.
- **Creator Contact (`/$locale/contact`):** Focused on 1:1 QA mentoring, creator-led collaborations, and community questions — no job-seeker CV or hiring portfolio cues.
- **Structured Bug Reporting:** In-app QA-style bug report dialog capturing route and browser context.

### 3.6 Authentication, Security & Admin

- **Providers:** Email/Password (with verification and password reset) and Google OAuth via **BetterAuth**.
- **Security Controls:** D1-backed rate limiting (`rate_limit_buckets`), strict security headers, CSRF/origin checks, and role-based admin routes (`/admin/*`).
- **Dynamic Open Graph Images:** Satori + Resvg WASM pipeline (`/api/og`) generating crisp localized social cards for pages, lessons, and milestones.

---

## 4. Technical Architecture

### 4.1 Core Stack (Strict-$0 Cloudflare Free)

- **Framework:** TanStack Start (React 19, SSR + Server Functions, Vite + `@cloudflare/vite-plugin`)
- **Hosting & Compute:** Cloudflare Workers Free — thin gateway Worker (`src/server.ts`) + single SQLite-backed `AppRuntime` Durable Object for dynamic SSR/compute + Static Assets
- **Database & ORM:** Cloudflare D1 (SQLite) with Drizzle ORM (`src/db/schema.ts`, `drizzle.d1.config.ts`); legacy PostgreSQL recovery helpers remain under `src/db/legacy/`
- **Routing & State:** TanStack Router (`src/routes/$locale/`), TanStack Query (SSR hydration, caching, optimistic updates)
- **Internationalization:** i18next / react-i18next (`src/lib/i18n/resources/en/` and `id/`)
- **Runtime & Tooling:** Bun + Node.js 22.12+ (Wrangler/Vite); no local Docker or PostgreSQL container required

### 4.2 Key Architectural Decisions

- **Strict-$0 Compute Boundary:** Static assets and security/maintenance checks run in the Worker gateway; dynamic Start requests execute in one stable SQLite-backed `AppRuntime` Durable Object while business data lives in D1. Paid Cloudflare plans are not an approved fallback.
- **Client-Side Sandboxed Execution (`src/core/executor/`):** All user code executes in an isolated browser `<iframe>` (using the Playwright shim and `esbuild-wasm`), eliminating server-side arbitrary code execution risks and cost.
- **Bundled Editorial Catalog:** Lessons and challenges are compiled into a static manifest at build/sync time (`src/server/content-catalog.server.ts`) and merged with D1 overlays/progress at request time.
- **End-to-End Type Safety:** Zod schemas (`.inputValidator`) and Drizzle types across all `src/server/*.fn.ts` Server Functions.
- **Bilingual Parity (`EN`/`ID`):** Every core route, lesson, challenge, and UI namespace ships with English and Indonesian parity.

---

## 5. User Flows

### 5.1 Learning & Practice Flow

```
Landing Page (/$locale) -> Learn Curriculum (/$locale/learn — 9 Modules / 28 Lessons) ->
Read Bilingual Lesson -> Launch Linked Practice Challenge (/$locale/practice/$slug) ->
Write Playwright/JS/TS/Selector Code -> Run (Client-Side Sandbox) ->
Submit (Server Function -> D1) -> XP, Progress & Achievements Updated ->
Subscribe for New Lessons/Labs or Reach Out for Mentoring (/$locale/contact)
```

### 5.2 Content Authoring & Sync Flow

```
Edit Markdown (tutorials/en & id) or JSON (content/challenges/*.json) ->
Run `bun run db:sync` (regenerates content-manifest.json & updates local D1) ->
Verify via `bun run test:ci` & `bun run test:e2e` ->
Commit, PR, and Deploy via isolated Cloudflare Preview -> Production workflow
```

---

## 6. Functional Requirements

### 6.1 Curriculum & Localization

- FR-1: Render all 9 modules and 28 lessons in both `EN` and `ID` with clean locale switching.
- FR-2: Track lesson completion and award 25 XP idempotently for authenticated learners.
- FR-3: Link lessons directly to relevant hands-on Practice challenges.

### 6.2 Interactive Playground

- FR-4: Render target HTML/DOM safely inside a sandboxed `<iframe>` for selector, JS/TS, and Playwright challenges.
- FR-5: Transpile TypeScript and execute Playwright shim scripts client-side with structured pass/fail feedback.
- FR-6: Support "Reset Code", instructions/hints toggle, and responsive desktop/mobile layouts.

### 6.3 Authentication, Progress & Community

- FR-7: Support Email/Password (with verification/reset) and Google OAuth sessions via BetterAuth.
- FR-8: Protect `/admin/*` and `/$locale/profile` routes with middleware.
- FR-9: Award XP and achievements idempotently without duplicate rewards on resubmission.
- FR-10: Support double opt-in newsletter signups, rate-limited contact submissions, and contextual bug reports.

---

## 7. Success Metrics

### Learning & Creator Engagement

- **Lesson & Module Completion:** % of learners progressing through core modules and linked Practice drills.
- **Practice Activation:** % of Playground visitors who run and pass a challenge in-browser.
- **Audience Growth:** Confirmed newsletter subscribers and inbound mentoring/collaboration inquiries.

### Reliability & Performance

- **LCP (Largest Contentful Paint):** < 2.5s on landing, Learn, and Practice pages.
- **Navigation Reliability:** Zero intermittent 5xx/503 responses during client-side route transitions.
- **Free-Tier Headroom:** Worker requests, Durable Object duration, and D1 reads/writes remain comfortably within Cloudflare Free quotas.

---

## 8. Development Roadmap

### Completed (v3.0–v4.0)

- ✅ Full TanStack Start + Drizzle + BetterAuth platform with Rebrand V1 warm editorial design
- ✅ Migration to strict-$0 Cloudflare Free stack (Worker gateway + `AppRuntime` Durable Object + D1 + Static Assets)
- ✅ Bilingual `EN`/`ID` curriculum (9 modules / 28 lessons) and 107 active Practice challenges
- ✅ In-browser Playwright shim, TypeScript transpiler (`esbuild-wasm`), and sandboxed iframe runner
- ✅ Dynamic OG image pipeline (Satori + Resvg WASM), newsletter double opt-in, and admin dashboard

### Current Focus

- 🔄 Creator-Led Education positioning alignment across navigation, Contact, Practice, and docs
- 🔄 Shareable module/track completion cards and refined Practice catalog ordering
- 🔄 Client-side navigation resilience and ongoing Cloudflare Free quota optimization

### Future Exploration

- ⏳ Expanded interactive Labs and real-world flaky-test debugging scenarios
- ⏳ Video walkthroughs and companion creator workshops
- ⏳ Community-contributed practice drills and localized study guides

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Security (User Code Execution)** | High | 100% client-side execution inside sandboxed `<iframe>` (`src/core/executor/`); never execute learner code on the Worker/DO. |
| **Cloudflare Free Quota Limits** | High | Single named `AppRuntime` Durable Object, static bundled content manifest, static assets served at the edge, and regular quota audits (`bun run cf:audit:free`). |
| **Content & Doc Drift** | Medium | Single source of truth in `tutorials/registry.json` and `content/challenges/`, validated by `content:generate` and CI tests (`bun run test:ci`). |
| **Bilingual Parity Drift** | Medium | Shared `en`/`id` resource structure tested in unit/CI checks alongside lesson registry validation. |
