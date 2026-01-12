# Product Requirements Document (PRD)

## TestingWithEkki - Gamified QA Portfolio & Learning Platform

**Version:** 3.0
**Date:** January 12, 2026
**Author:** Ekki
**Status:** MVP Implemented / Beta Refinement

---

## 1. Executive Summary

**TestingWithEkki** is a gamified portfolio and learning platform designed for QA Engineers and SDET professionals. Built on a modern **TanStack Start** architecture, it provides a high-performance, server-side rendered (SSR) experience. The platform combines content management (tutorials) with an interactive coding playground similar to LeetCode, specifically tailored for testing disciplines including Web Testing, API Testing, and test automation scripting.

### Vision

Create a unique learning ecosystem where QA professionals can:

- Access high-quality testing tutorials and resources
- Practice real-world testing scenarios in a safe sandbox environment
- Build skills through gamified challenges
- Showcase their testing expertise

---

## 2. Target Users

### Primary Persona: QA Engineer / SDET

- **Experience Level:** Junior to Senior
- **Goals:**
  - Learn new testing techniques and tools
  - Practice coding and automation skills
  - Stay updated with testing best practices
  - Build a portfolio of solved challenges
- **Pain Points:**
  - Lack of testing-specific practice platforms
  - Limited hands-on practice opportunities
  - Difficulty showcasing QA skills in portfolio

### Secondary Persona: Content Creator (Ekki)

- **Role:** Platform owner and content creator
- **Goals:**
  - Share testing knowledge and tutorials
  - Build personal brand in QA community
  - Engage with learners
  - Track content impact

---

## 3. Core Features

### 3.1 Content Management System (CMS)

#### Hybrid Content Strategy

- **Filesystem-First:** Challenges and tutorials are defined in JSON/Markdown files for easy version control and editing.
- **Lazy Sync:** Content is synchronized to the database on-demand (e.g., when a user submits a solution), ensuring the DB schema always matches the file content without complex migration scripts.

#### Tutorials Section

- **Browse Tutorials:** Categorized by topic (Web Testing, API Testing, Automation).
- **Search & Filter:** Find tutorials by keyword, difficulty, tags.
- **Reading Experience:** Clean, markdown-based tutorial viewer.
- **Code Snippets:** Syntax-highlighted code examples.

#### Blog/Writing Section

- Personal blog posts and articles.
- RSS feed support.
- Social sharing capabilities.

### 3.2 Interactive Playground (TestLab)

#### Supported Challenge Types

**1. Selector Challenges (CSS & XPath)**

- **Target:** Beginners to Intermediates.
- **Mechanism:** Visual DOM preview where users must select specific elements.
- **Visual Feedback:** Real-time highlighting of matched elements in the preview iframe.
- **Validation:** Automated check against expected selectors and DOM matching.

**2. JavaScript & Playwright Scripting**

- **Target:** Automated Testers (SDETs).
- **Mechanism:** Monaco Editor Environment.
- **Execution:** Secure client-side execution in isolated iframes (Playwright Shim).
- **Scenarios:**
  - Code completion
  - Fixing broken scripts
  - Implementing full test flows (Locate -> Action -> Assert)
- **Validation:** Test Runner with assertions and detailed error reporting.

#### Challenge Library Structure (96+ Challenges)

| Tier | Focus Areas | XP Range |
| --- | --- | --- |
| **Basic** | CSS Selectors, XPath, Element Targeting | 10-50 |
| **Beginner** | JS Fundamentals: Variables, DOM, Async/Await | 15-55 |
| **Intermediate** | Playwright Core: Locators, Actions, Assertions | 40-85 |
| **Expert** | Advanced Patterns: POM, Data-Driven, CI/CD | 75-120 |

### 3.3 Gamification System

#### Experience Points (XP) & Leveling

- Earn XP for specific actions (completing challenges, reading tutorials).
- Progressive leveling system (Beginner → Apprentice → Professional → Expert → Master).
- "Level Up" animations and celebrations.

#### Achievement System

- **Dynamic Awards:** Unlocked based on user stats (e.g., specific challenge counts, streaks).
- **Categories:** "First Challenge", "Selector Master", "JS Ninja".

#### Leaderboard

- **Global & Monthly:** Comparison of user rankings.
- **Optimized UI:** "Podium" view for top 3, efficient list view for others.
- **Context:** Shows Level, XP, and Badges.

### 3.4 User Authentication & Management

- **Providers:** Email/Password (BetterAuth) & OAuth (Google).
- **Security:** CSRF protection, secure session management.
- **Profile:** Public profile pages showcasing stats and achievements.

### 3.5 Bug Reporting System

- **Integrated Feedback:** Users can report issues directly from the app.
- **Context Aware:** Auto-captures route, browser info, and potential errors.

---

## 4. Technical Architecture

### 4.1 Core Stack

- **Framework:** TanStack Start (Server-Side Rendering, Server Functions).
- **Routing:** TanStack Router (Type-safe routing).
- **Data Fetching:** TanStack Query (Caching, Optimistic Updates, SSR hydration).
- **Database:** PostgreSQL (via Supabase).
- **ORM:** Drizzle ORM.
- **Runtime:** Bun (Local dev), Node.js (Production).

### 4.2 Key Architectural Decisions

- **SSR-First:** Critical for SEO and initial load performance.
- **Type Safety:** End-to-end type safety from database to frontend components.
- **Optimistic UI:** Immediate feedback on actions (like submissions) before server confirmation.
- **Isolated Execution:** User code runs in sandboxed iframes to prevent XSS and ensure security without heavy server-side sandboxing infrastructure.

---

## 5. User Flows

### 5.1 Learning Flow

```
Landing Page -> Explore Challenges -> Filter by "Basic" ->
Select Challenge -> Interactive Playground ->
Write Selector/Code -> "Run" (Client-Side) -> "Submit" (Server-Side) ->
Success Dialog -> XP Awarded -> Leaderboard Updated
```

### 5.2 Content Update Flow

```
Edit JSON/MD file in VS Code -> Commit & Push ->
(On User Access) Lazy Sync Function Triggers ->
DB Challenge Record Updated -> User sees new content
```

---

## 6. Functional Requirements (Updated)

### 6.1 Authentication

- FR-1: Secure Email/Pass & OAuth login.
- FR-2: Persist user sessions across reloads.
- FR-3: Protect "Admin" and "Profile" routes.

### 6.2 Playground

- FR-4: Render HTML/CSS content for selector challenges.
- FR-5: Execute JS safely in browser.
- FR-6: Provide "Reset Code" and "Show Instructions" toggle.
- FR-7: Mobile-responsive layout (Stack vs Split view).

### 6.3 Gamification

- FR-8: Real-time XP updates.
- FR-9: "First Completion" bonus logic.
- FR-10: Prevent duplicate XP for same challenge.

---

## 7. Success Metrics

### Engagement

- **Completion Rate:** % of started challenges that are submitted successfully.
- **Retention:** % of users returning > 2 times/week.
- **Time on Task:** Average time spent in Playground.

### Performance

- **LCP (Largest Contentful Paint):** < 2.5s.
- **TTFB (Time to First Byte):** < 500ms (leveraging SSR).

---

## 8. Development Roadmap

### Completed (v2.0)

- ✅ Core Architecture (TanStack Start/Query/Router)
- ✅ Authentication System
- ✅ Challenge Engine (Selector & JS)
- ✅ Leaderboard & Stats
- ✅ Filesystem Content Source

### In Progress / Refinement (v3.0)

- 🔄 Enhanced Mobile Experience
- 🔄 More Challenge Content (scaling to 100+)
- 🔄 Social Sharing Features
- 🔄 SEO Optimization

### Future (v4.0+)

- ⏳ Community Solutions (Comment threads per challenge)
- ⏳ User-Created Challenges
- ⏳ Interactive Video Tutorials

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Security (Code Exec)** | High | Client-side sandbox (iframe) + no server-side execution of user code. |
| **Content Staleness** | Medium | Lazy sync ensures DB never lags behind code repo. |
| **Performance (SSR)** | Medium | Aggressive caching with TanStack Query + Edge caching where possible. |
