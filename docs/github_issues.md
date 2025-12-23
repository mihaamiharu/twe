# TestingWithEkki - GitHub Issues Breakdown

## Epic 1: Project Setup & Data Layer

### Issue #1: Initialize TanStack Start Project
**Label**: `setup` **Size**: Small **Week**: 1

**Description:**
Initialize the TanStack Start project with TypeScript configuration and folder structure.

**Acceptance Criteria:**
- [ ] TanStack Start project initialized
- [ ] TypeScript configured with strict mode
- [ ] Folder structure created (`app/routes`, `app/components`, `app/db`, `app/lib`, `app/server`)
- [ ] ESLint and Prettier configured
- [ ] Git repository initialized with `.gitignore`

**Technical Notes:**
```bash
npm create @tanstack/start@latest
```

---

### Issue #2: Set Up PostgreSQL with Docker
**Label**: `infrastructure` **Size**: Small **Week**: 1

**Description:**
Create Docker Compose configuration for PostgreSQL development environment.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` created with PostgreSQL 15-alpine
- [ ] PostgreSQL configured for 2GB RAM optimization (256MB shared_buffers)
- [ ] Data persistence with volume mapping
- [ ] `.env.example` created with database URL template
- [ ] Connection tested successfully

**Technical Files:**
- `docker-compose.yml`
- `.env.example`

---

### Issue #3: Define Drizzle Database Schema
**Label**: `database` **Size**: Medium **Week**: 1

**Description:**
Define complete database schema using Drizzle ORM including users, challenges, tutorials,achievements, and submissions.

**Acceptance Criteria:**
- [ ] `app/db/schema.ts` created with all tables
- [ ] Users table with BetterAuth integration fields
- [ ] Sessions and accounts tables for auth
- [ ] Challenges table with type (JAVASCRIPT, PLAYWRIGHT, CSS_SELECTOR, XPATH_SELECTOR)
- [ ] Tutorials, submissions, achievements, progress tables
- [ ] Privacy fields added (profileVisibility, showOnLeaderboard)
- [ ] Drizzle config file created

**Tables:**
- users, sessions, accounts
- tutorials, challenges, test_cases
- submissions, achievements, user_achievements, progress

---

### Issue #4: Set Up Drizzle Migrations
**Label**: `database` **Size**: Small **Week**: 1

**Description:**
Configure Drizzle Kit and generate initial migrations.

**Acceptance Criteria:**
- [ ] `drizzle.config.ts` configured
- [ ] Initial migration generated
- [ ] Migration applied successfully
- [ ] Database connection helper created in `app/db/index.ts`

**Commands:**
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Epic 2: Authentication & User Management

### Issue #5: Configure BetterAuth
**Label**: `auth` **Size**: Medium **Week**: 1-2

**Description:**
Set up BetterAuth with email/password and Google OAuth.

**Acceptance Criteria:**
- [ ] `app/lib/auth.server.ts` created with BetterAuth configuration
- [ ] Email/password authentication enabled
- [ ] Google OAuth configured (NOT GitHub)
- [ ] Session management with httpOnly cookies
- [ ] `app/lib/auth.client.ts` created for React hooks

**Environment Variables:**
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

### Issue #6: Create Authentication API Routes
**Label**: `auth` **Size**: Medium **Week**: 2

**Description:**
Create TanStack Start API routes for authentication flows.

**Acceptance Criteria:**
- [ ] `app/routes/api/auth/signin.ts` - email/password login
- [ ] `app/routes/api/auth/signup.ts` - user registration
- [ ] `app/routes/api/auth/signout.ts` - logout
- [ ] `app/routes/api/auth/session.ts` - get current session
- [ ] Error handling for invalid credentials
- [ ] Input validation with Zod

**Dependencies:** Issue #5

---

### Issue #7: Build Authentication UI Components
**Label**: `frontend` | `auth` **Size**: Medium **Week**: 2

**Description:**
Create login and registration form components.

**Acceptance Criteria:**
- [ ] `app/components/auth/LoginForm.tsx` with email/password fields
- [ ] `app/components/auth/RegisterForm.tsx` with validation
- [ ] Google OAuth button component
- [ ] Form validation (client-side)
- [ ] Error message display
- [ ] Loading states

**Dependencies:** Issue #6

---

## Epic 3: Frontend Foundation

### Issue #8: Create Design System & Global Styles
**Label**: `frontend` | `design` **Size**: Medium **Week**: 2

**Description:**
Build the design system with CSS variables, typography, and dark mode support.

**Acceptance Criteria:**
- [ ] `app/styles/global.css` with CSS variables
- [ ] Color palette defined (premium, modern colors - no generic red/blue/green)
- [ ] Typography system with Google Fonts (Inter or Outfit)
- [ ] Dark mode support
- [ ] Responsive breakpoints defined
- [ ] Utility classes for common patterns

**Design Requirements:**
- Premium, state-of-the-art aesthetic
- Smooth gradients and micro-animations
- Glassmorphism effects where appropriate

---

### Issue #9: Set Up TanStack Router Structure
**Label**: `frontend` | `routing` **Size**: Small **Week**: 2

**Description:**
Configure file-based routing with TanStack Router.

**Acceptance Criteria:**
- [ ] `app/routes/__root.tsx` created with layout
- [ ] `app/routes/index.tsx` - home page
- [ ] `app/routes/tutorials/index.tsx` - tutorials list
- [ ] `app/routes/tutorials/$slug.tsx` - tutorial detail
- [ ] `app/routes/challenges/index.tsx` - challenges list
- [ ] `app/routes/challenges/$slug.tsx` - challenge playground
- [ ] `app/routes/profile.tsx` - user dashboard
- [ ] Protected routes for authenticated users

---

### Issue #10: Build Navigation & Layout Components
**Label**: `frontend` **Size**: Medium **Week**: 2-3

**Description:**
Create header, navigation, and layout components.

**Acceptance Criteria:**
- [ ] Header with logo, navigation, user menu
- [ ] Responsive mobile navigation (hamburger menu)
- [ ] User dropdown menu (profile, settings, logout)
- [ ] Footer component
- [ ] Loading spinner component
- [ ] Toast notification system

---

### Issue #11: Create Tutorial Interface
**Label**: `frontend` | `content` **Size**: Medium **Week**: 3

**Description:**
Build tutorial browsing and reading interface.

**Acceptance Criteria:**
- [ ] Tutorial list with search and filters
- [ ] Tutorial card components
- [ ] Markdown rendering with react-markdown
- [ ] Code syntax highlighting in tutorials
- [ ] Reading progress indicator
- [ ] Responsive design (mobile/tablet/desktop)

---

## Epic 4: Challenge Runner Logic

### Issue #12: Implement Mocked Playwright Shim
**Label**: `playground` | `core` **Size**: Large **Week**: 3-4

**Description:**
Build the client-side Playwright compatibility layer that mimics Playwright API.

**Acceptance Criteria:**
- [ ] `app/lib/playwright-shim.ts` with `MockedPlaywrightPage` class
- [ ] Implement `click(selector)` method
- [ ] Implement `fill(selector, value)` method
- [ ] Implement `textContent(selector)` method
- [ ] Implement `waitForSelector(selector, options)` method
- [ ] Implement `getByRole(role, options)` method
- [ ] Implement `locator(selector)` helper
- [ ] Error handling for element not found
- [ ] Visibility checking before clicks
- [ ] Promise-based async API

**Example:**
```typescript
await page.click('#submit-btn');  // → element.click()
```

---

### Issue #13: Build Iframe Executor
**Label**: `playground` | `core` **Size**: Medium **Week**: 3-4

**Description:**
Create the iframe-based code execution environment.

**Acceptance Criteria:**
- [ ] Isolatediframe creation and cleanup
- [ ] HTML content injection
- [ ] User code execution with error catching
- [ ] Timeout enforcement
- [ ] Success/failure result capture
- [ ] Memory cleanup after execution

**Technical Notes:**
- Runs entirely in browser
- No server-side execution
- Safe from malicious code (browsers iframe sandbox)

**Dependencies:** Issue #12

---

### Issue #14: Integrate Monaco Editor
**Label**: `playground` | `ui` **Size**: Medium **Week**: 3-4

**Description:**
Integrate Monaco editor for code input.

**Acceptance Criteria:**
- [ ] `app/components/challenges/CodeEditor.tsx` created
- [ ] Monaco Editor configured
- [ ] JavaScript syntax highlighting
- [ ] Dark theme support
- [ ] Auto-save to localStorage
- [ ] Keyboard shortcut (Cmd/Ctrl+Enter to run)
- [ ] Line numbers and minimap

---

### Issue #15: Create Selector Challenge Components
**Label**: `playground` | `selector` **Size**: Medium **Week**: 4

**Description:**
Build components for CSS/XPath selector challenges.

**Acceptance Criteria:**
- [ ] `app/components/challenges/SelectorInput.tsx` - input with CSS/XPath toggle
- [ ] `app/components/challenges/WebComponentPreview.tsx` - iframe preview
- [ ] Target element highlighting on hover
- [ ] Selector validation logic
- [ ] Support for multiple valid selectors
- [ ] Real-time feedback

---

### Issue #16: Build Challenge Playground Interface
**Label**: `playground` | `ui` **Size**: Large **Week**: 4

**Description:**
Create the main challenge solving interface with split layout.

**Acceptance Criteria:**
- [ ] Split layout (description | code editor | results)
- [ ] Challenge description rendering
- [ ] Run Code button
- [ ] Test results display component
- [ ] Submit button (enabled only after passing)
- [ ] Responsive design (tabs on mobile)
- [ ] Loading states and animations

**Dependencies:** Issues #12, #13, #14

---

## Epic 5: Gamification System

### Issue #17: Implement XP & Leveling Logic
**Label**: `gamification` | `backend` **Size**: Medium **Week**: 4-5

**Description:**
Build the XP calculation and leveling system.

**Acceptance Criteria:**
- [ ] `app/lib/gamification.ts` with XP functions
- [ ] `calculateLevel(xp)` function using formula `100 * level^2`
- [ ] `getXPForNextLevel(currentLevel)` function
- [ ] `getXPReward(difficulty)` function (EASY: 10-30, MEDIUM: 40-70, HARD: 80-120)
- [ ] Level-up detection
- [ ] Unit tests for calculations

---

### Issue #18: Create Achievement System
**Label**: `gamification` | `backend` **Size**: Medium **Week**: 5

**Description:**
Build achievement detection and awarding system.

**Acceptance Criteria:**
- [ ] Achievement definitions (First Challenge, 10 Challenges, etc.)
- [ ] Achievement checking logic
- [ ] Award achievements on challenge completion
- [ ] Achievement notification system
- [ ] Database queries optimized

**Achievement Examples:**
- First Steps: Complete first challenge
- Selector Master: Complete 10 selector challenges
- Code Ninja: Complete 20 JavaScript challenges

---

### Issue #19: Build Leaderboard System
**Label**: `gamification` | `backend` **Size**: Medium **Week**: 5

**Description:**
Create global leaderboard with opt-in privacy.

**Acceptance Criteria:**
- [ ] `app/routes/api/leaderboard.ts` API route
- [ ] Global leaderboard query (top 100 users)
- [ ] Respect `showOnLeaderboard` privacy setting
- [ ] Monthly leaderboard support
- [ ] Efficient database indexing
- [ ] Pagination support

---

### Issue #20: Create Gamification UI Components
**Label**: `frontend` | `gamification` **Size**: Medium **Week**: 5

**Description:**
Build XP progress bars, achievement badges, and leaderboard UI.

**Acceptance Criteria:**
- [ ] `app/components/gamification/XPProgressBar.tsx` with animation
- [ ] `app/components/gamification/AchievementBadge.tsx` with icons
- [ ] `app/components/gamification/Leaderboard.tsx` table component
- [ ] Level-up animation/notification
- [ ] User profile dashboard with stats
- [ ] Achievement unlock animations

---

## Epic 6: Testing & Quality

### Issue #21: Write Unit Tests
**Label**: `testing` **Size**: Medium **Week**: 5-6

**Description:**
Create unit tests for core logic.

**Acceptance Criteria:**
- [ ] Playwright shim tests (`app/lib/__tests__/playwright-shim.test.ts`)
- [ ] Selector validator tests (`app/lib/__tests__/selector-validator.test.ts`)
- [ ] Gamification logic tests (`app/lib/__tests__/gamification.test.ts`)
- [ ] API route tests (`app/routes/api/__tests__/auth.test.ts`)
- [ ] Component tests with React Testing Library
- [ ] 80%+ code coverage for critical paths

**Test Framework:** Vitest

---

### Issue #22: Add Google Analytics Integration
**Label**: `analytics` **Size**: Small **Week**: 6

**Description:**
Integrate Google Analytics GA4 for tracking.

**Acceptance Criteria:**
- [ ] `app/components/analytics/GoogleAnalytics.tsx` created
- [ ] GA4 script injection
- [ ] Event tracking helper (`trackEvent` function)
- [ ] Track challenge completions
- [ ] Track level-ups
- [ ] Environment variable: `VITE_GA_MEASUREMENT_ID`
- [ ] Privacy-compliant implementation

---

## Epic 7: Deployment

### Issue #23: Production Deployment Setup
**Label**: `deployment` | `infrastructure` **Size**: Large **Week**: 6-7

**Description:**
Deploy to Ubuntu server with Nginx reverse proxy.

**Acceptance Criteria:**
- [ ] Dockerfile created with Node 20-alpine
- [ ] Production docker-compose.yml with resource limits
- [ ] Nginx configuration with SSL (Let's Encrypt)
- [ ] PostgreSQL production configuration (optimized for 2GB RAM)
- [ ] Environment variables configured
- [ ] Domain configured (www.testingwithekki.com)
- [ ] Database backup strategy implemented
- [ ] Monitoring set up (basic health checks)
- [ ] Deploy and verify production

**Server Specs:**
- 2 CPU / 2 GB RAM / 20 GB disk
- Ubuntu
- Supports 50-100 concurrent users

---

## Issue Summary

**Total Issues:** 23

**By Epic:**
- Setup & Data Layer: 4 issues
- Authentication: 3 issues
- Frontend Foundation: 4 issues
- Challenge Runner: 5 issues
- Gamification: 4 issues
- Testing: 2 issues
- Deployment: 1 issue

**By Size:**
- Small: 5
- Medium: 14
- Large: 4
