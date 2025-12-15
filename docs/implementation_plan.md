# Implementation Plan: TestingWithEkki MVP

## Goal

Implement the MVP (Minimum Viable Product) for **TestingWithEkki**, a gamified QA portfolio and learning platform. The MVP will include:
- User authentication system
- Tutorial content management and display
- Interactive coding playground with JavaScript challenges
- Gamification system (XP, levels, achievements, leaderboard)
- Responsive web interface

This implementation follows the PRD and TDD specifications created in the planning phase.

---

## User Review Required

> [!IMPORTANT]
> **Updated Technology Stack**
> 
> Based on your feedback, the stack is now:
> - **Full-Stack Framework:** TanStack Start + TypeScript (handles both frontend and backend)
> - **Database:** PostgreSQL 15 + Drizzle ORM
> - **Authentication:** BetterAuth (OAuth + email/password built-in)
> - **Code Execution:** Mocked Playwright in browser (no real sandboxing)
> - **Deployment:** Docker + your own server
> 
> **Key Architecture Decision:** TanStack Start provides server functions and API routes, eliminating the need for a separate Express backend! All backend logic runs within TanStack Start's server-side features.

> [!IMPORTANT]
> **Updated MVP Scope**
> 
> For Phase 1, we'll include:
> 1. **JavaScript/Playwright challenges** - Using mocked Playwright compatibility layer
> 2. **CSS/XPath Selector challenges** - Show a web component/page, user inputs the correct selector
> 3. OAuth login with Google (via BetterAuth)
> 4. Email/password authentication
> 
> **Mocked Playwright Approach:**
> Instead of real sandboxing with Docker or isolated-vm:
> - User writes real Playwright syntax: `await page.click('#btn')`
> - We run a lightweight compatibility shim in the browser
> - The shim mimics Playwright commands using standard DOM APIs (`document.querySelector`)
> - User learns real Playwright syntax, but execution is safe client-side JavaScript
> - No server-side code execution needed!
> 
> **Selector Challenges:**
> - Visual preview of the web component (iframe or screenshot)
> - Input field for CSS selector or XPath
> - Validation against the correct selector
> - Hints system to help users learn selector strategies
> 
> **Domain:** www.testingwithekki.com
> **Hosting:** Your own server

---

## Proposed Changes

### Phase 1: Project Setup & Infrastructure

#### [NEW] Project Root Structure

```
testingwithekki/
├── app/                  # TanStack Start application
│   ├── routes/          # File-based routes (frontend + API)
│   ├── server/          # Server-side functions
│   └── db/              # Database schema and migrations
├── docker-compose.yml    # PostgreSQL for development
├── Dockerfile            # Production deployment
├── .env.example          # Environment variables template
└── README.md             # Setup instructions
```

---

## Proposed Changes

### TanStack Start Application Structure

TanStack Start is a full-stack framework, so there's **no separate backend**. Everything lives in one codebase with server functions and API routes.

#### [NEW] [package.json](file:///Users/ekkisyam/Learn/twe/package.json)

Dependencies:
- `@tanstack/start` - Full-stack React framework
- `@tanstack/react-router` - Type-safe routing
- `vinxi` - TanStack Start's build tool
- `react`, `react-dom` - UI library
- `drizzle-orm` - Database ORM
- `drizzle-kit` - Schema migrations
- `postgres` - PostgreSQL driver
- `better-auth` - Authentication (OAuth + email/password)
- `zod` - Schema validation
- `zustand` - State management
- `@tanstack/react-query` - Server state management
- `@monaco-editor/react` - Code editor
- `react-markdown` - Markdown rendering
- `lucide-react` - Icons
- Google Analytics (via gtag.js script)

#### [NEW] [app/db/schema.ts](file:///Users/ekkisyam/Learn/twe/app/db/schema.ts)

Drizzle schema definition including:
- `users` table (authentication via BetterAuth, profile, XP, level)
- `sessions` table (BetterAuth session management)
- `accounts` table (OAuth provider accounts)
- `tutorials` table (content, metadata)
- `challenges` table (coding and selector challenges, test cases)
- `submissions` table (user code/selector submissions)
- `achievements` table (gamification achievements)
- `userAchievements` junction table
- `progress` table (tracking completion)

#### [NEW] [app/db/index.ts](file:///Users/ekkisyam/Learn/twe/app/db/index.ts)

Drizzle client initialization and connection management using postgres.js driver.

#### [NEW] [app/lib/auth.server.ts](file:///Users/ekkisyam/Learn/twe/app/lib/auth.server.ts)

BetterAuth server configuration:
- Email/password authentication
- OAuth providers (Google)
- Session management
- User profile handling
- Automatic password hashing and security

#### [NEW] [app/lib/auth.client.ts](file:///Users/ekkisyam/Learn/twe/app/lib/auth.client.ts)

BetterAuth client for React components:
- Login/logout hooks
- User session access
- OAuth button components

#### [NEW] [app/server/playwright-shim.ts](file:///Users/ekkisyam/Learn/twe/app/server/playwright-shim.ts)

Mocked Playwright compatibility layer:
- Mimics Playwright API in browser
- Translates `page.click()` to `document.querySelector().click()`
- Translates `page.fill()` to `element.value = 'text'`
- Translates `page.locator()` to `document.querySelector()`
- Returns promises to match Playwright async API
- Provides user-friendly error messages
- No actual browser automation - just DOM manipulation

Example implementation:
```javascript
const mockPage = {
  async click(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    el.click();
  },
  async fill(selector, value) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    el.value = value;
  },
  // ... more Playwright methods
};
```

#### [NEW] [app/server/selector-validator.ts](file:///Users/ekkisyam/Learn/twe/app/server/selector-validator.ts)

CSS/XPath selector validation functions:
- Parse and validate CSS selectors
- Parse and validate XPath expressions
- Compare user selector with correct selector(s)
- Support multiple valid selectors
- Validate selector against provided HTML structure
- Check if selector uniquely identifies the target element

#### [NEW] [app/server/gamification.ts](file:///Users/ekkisyam/Learn/twe/app/server/gamification.ts)

Gamification logic:
- XP award calculation
- Level-up detection (formula: `100 * level^2`)
- Achievement checking and awarding
- Leaderboard updates

#### [NEW] [app/routes/api/challenges.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/challenges.ts)

TanStack Start API route:
- `GET` - List challenges (with filters)
- Handlers use server functions for database access

#### [NEW] [app/routes/api/challenges/$slug.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/challenges/$slug.ts)

TanStack Start API route:
- `GET` - Get challenge details by slug

#### [NEW] [app/routes/api/submissions.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/submissions.ts)

TanStack Start API route:
- `POST` - Submit code/selector for validation (runs in browser!)
- Returns validation results and XP rewards

#### [NEW] [app/routes/api/tutorials.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/tutorials.ts)

Tutorial endpoints:
- `GET` - List tutorials

#### [NEW] [app/routes/api/users/me.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/users/me.ts)

User endpoints:
- `GET` - Get current user profile
- Uses BetterAuth session

#### [NEW] [app/routes/api/leaderboard.ts](file:///Users/ekkisyam/Learn/twe/app/routes/api/leaderboard.ts)

Leaderboard endpoint:
- `GET` - Get global leaderboard

---

### Frontend Components (React within TanStack Start)

All frontend dependencies are listed in the main `package.json` above. Components are organized within the TanStack Start `app/` directory.

#### [NEW] [app/components/auth/LoginForm.tsx](file:///Users/ekkisyam/Learn/twe/app/components/auth/LoginForm.tsx)

Login form component with validation.

#### [NEW] [app/components/auth/RegisterForm.tsx](file:///Users/ekkisyam/Learn/twe/app/components/auth/RegisterForm.tsx)

Registration form component with validation.

#### [NEW] [app/components/challenges/ChallengeCard.tsx](file:///Users/ekkisyam/Learn/twe/app/components/challenges/ChallengeCard.tsx)

Challenge preview card (title, difficulty, XP, status).

#### [NEW] [app/components/challenges/CodeEditor.tsx](file:///Users/ekkisyam/Learn/twe/app/components/challenges/CodeEditor.tsx)

Monaco Editor wrapper with:
- Syntax highlighting
- Theme support (light/dark)
- Keyboard shortcuts (Cmd/Ctrl+Enter to run)
- Auto-save to localStorage

#### [NEW] [app/components/challenges/TestResults.tsx](file:///Users/ekkisyam/Learn/twe/app/components/challenges/TestResults.tsx)

Display test execution results:
- Passed/failed indicator
- Expected vs actual output
- Execution time

#### [NEW] [app/components/challenges/SelectorInput.tsx](file:///Users/ekkisyam/Learn/twe/app/components/challenges/SelectorInput.tsx)

Selector challenge input:
- Text input for CSS selector or XPath
- Selector type toggle (CSS / XPath)
- Validation button
- Real-time syntax highlighting
- Copy selector button

#### [NEW] [app/components/challenges/WebComponentPreview.tsx](file:///Users/ekkisyam/Learn/twe/app/components/challenges/WebComponentPreview.tsx)

Visual preview of the target web component:
- Render HTML in sandboxed iframe
- Highlight target element when hovered
- Show element path on click
- Screenshot fallback for static challenges
- Zoom and pan controls

#### [NEW] [app/components/gamification/XPProgressBar.tsx](file:///Users/ekkisyam/Learn/twe/app/components/gamification/XPProgressBar.tsx)

Animated XP progress bar showing current level progress.

#### [NEW] [app/components/gamification/AchievementBadge.tsx](file:///Users/ekkisyam/Learn/twe/app/components/gamification/AchievementBadge.tsx)

Achievement display component with icon and description.

#### [NEW] [app/components/gamification/Leaderboard.tsx](file:///Users/ekkisyam/Learn/twe/app/components/gamification/Leaderboard.tsx)

Top users leaderboard table.

#### [NEW] [app/routes/index.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/index.tsx)

Landing page route:
- Hero section with tagline
- Feature highlights
- CTA to browse challenges/tutorials

#### [NEW] [app/routes/tutorials/index.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/tutorials/index.tsx)

Tutorial browsing page with search and filters.

#### [NEW] [app/routes/tutorials/$slug.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/tutorials/$slug.tsx)

Tutorial reading page with markdown rendering.

#### [NEW] [app/routes/challenges/index.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/challenges/index.tsx)

Challenge browsing page with filters (difficulty, category).

#### [NEW] [app/routes/challenges/$slug.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/challenges/$slug.tsx)

Challenge solving interface:
- Split layout (description | code editor | output)
- Run tests button
- Submit button
- Hints system
- Real-time feedback
- Playwright shim execution

#### [NEW] [app/routes/profile.tsx](file:///Users/ekkisyam/Learn/twe/app/routes/profile.tsx)

User profile and dashboard:
- Level and XP display
- Achievement showcase
- Completed challenges list
- Activity heatmap (future)

#### [NEW] [app/styles/global.css](file:///Users/ekkisyam/Learn/twe/app/styles/global.css)

Global styles:
- CSS variables for theming
- Dark mode support
- Typography system
- Utility classes

---

### Infrastructure

#### [NEW] [docker-compose.yml](file:///Users/ekkisyam/Learn/twe/docker-compose.yml)

Development environment with:
- PostgreSQL container only (TanStack Start handles the app)
- Environment variables for database connection

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: testingwithekki
      POSTGRES_USER: ekki
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

#### [NEW] [Dockerfile](file:///Users/ekkisyam/Learn/twe/Dockerfile)

Production deployment:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### [NEW] [.env.example](file:///Users/ekkisyam/Learn/twe/.env.example)

Template for environment variables:
```
# Database
DATABASE_URL=postgresql://ekki:dev_password@localhost:5432/testingwithekki

# Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://www.testingwithekki.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# App
NODE_ENV=production
PORT=3000
```

#### [NEW] [README.md](file:///Users/ekkisyam/Learn/twe/README.md)

Setup and development instructions:
- Prerequisites (Node.js 20, PostgreSQL)
- Installation steps
- Running locally with `npm run dev`
- Running PostgreSQL with Docker
- Database migrations with Drizzle
- Project structure explanation
- Deployment guide for your own server

---

## Verification Plan

### Automated Tests

#### 1. Playwright Shim Tests (Vitest)

**Test File:** `app/lib/__tests__/playwright-shim.test.ts`

Test the mocked Playwright compatibility layer:
```typescript
import { describe, it, expect } from 'vitest';
import { MockedPlaywrightPage } from '../playwright-shim';

describe('MockedPlaywrightPage', () => {
  it('should throw error when clicking non-existent element', async () => {
    const doc = document.implementation.createHTMLDocument();
    const page = new MockedPlaywrightPage(doc);
    
    await expect(page.click('#non-existent')).rejects.toThrow('Element not found: #non-existent');
  });
  
  it('should successfully update input value on .fill()', async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = '<input id="email" />';
    const page = new MockedPlaywrightPage(doc);
    
    await page.fill('#email', 'test@example.com');
    const input = doc.querySelector('#email') as HTMLInputElement;
    expect(input.value).toBe('test@example.com');
  });
  
  it('should wait for selector visibility (mocked delay)', async () => {
    const doc = document.implementation.createHTMLDocument();
    const page = new MockedPlaywrightPage(doc);
    
    setTimeout(() => {
      doc.body.innerHTML = '<div id="late">Loaded</div>';
    }, 100);
    
    await expect(page.waitForSelector('#late', { timeout: 500 })).resolves.toBeUndefined();
  });
  
  it('should throw error when element is not visible', async () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = '<button id="btn" style="display:none">Click</button>';
    const page = new MockedPlaywrightPage(doc);
    
    await expect(page.click('#btn')).rejects.toThrow('Element is not visible');
  });
});
```

**Run command:**
```bash
npm test -- playwright-shim
```

#### 2. Selector Validator Tests (Vitest)

**Test File:** `app/lib/__tests__/selector-validator.test.ts`

Test CSS/XPath selector validation:
```typescript
import { describe, it, expect } from 'vitest';
import { validateCSSSelector, validateXPath } from '../selector-validator';

describe('Selector Validator', () => {
  it('should correctly identify valid CSS selectors', () => {
    expect(validateCSSSelector('#submit-btn')).toBe(true);
    expect(validateCSSSelector('.btn-primary')).toBe(true);
    expect(validateCSSSelector('button[type="submit"]')).toBe(true);
  });
  
  it('should correctly identify valid XPath', () => {
    expect(validateXPath('//button[@type="submit"]')).toBe(true);
    expect(validateXPath('//div[@class="container"]/p[1]')).toBe(true);
  });
  
  it('should return false for syntax errors', () => {
    expect(validateCSSSelector('#[invalid')).toBe(false);
    expect(validateCSSSelector('##double')).toBe(false);
    expect(validateXPath('//button[')).toBe(false);
  });
});
```

**Run command:**
```bash
npm test -- selector-validator
```

#### 3. Gamification Logic Tests (Vitest)

**Test File:** `app/lib/__tests__/gamification.test.ts`

Test XP and leveling calculations:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateLevel, getXPForNextLevel, getXPReward } from '../gamification';

describe('Gamification Engine', () => {
  it('should calculate correct level from XP', () => {
    expect(calculateLevel(0)).toBe(0);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(400)).toBe(2);
    expect(calculateLevel(900)).toBe(3);
  });
  
  it('should award correct XP for challenge difficulty', () => {
    expect(getXPReward('EASY')).toBeGreaterThanOrEqual(10);
    expect(getXPReward('EASY')).toBeLessThanOrEqual(30);
    expect(getXPReward('MEDIUM')).toBeGreaterThanOrEqual(40);
    expect(getXPReward('HARD')).toBeGreaterThanOrEqual(80);
  });
  
  it('should calculate XP needed for next level', () => {
    expect(getXPForNextLevel(0)).toBe(100); // Level 0 -> 1
    expect(getXPForNextLevel(1)).toBe(400); // Level 1 -> 2
    expect(getXPForNextLevel(2)).toBe(900); // Level 2 -> 3
  });
});
```

**Run command:**
```bash
npm test -- gamification
```

#### 4. API Route Tests (Vitest)

**Test File:** `app/routes/api/__tests__/auth.test.ts`

Test authentication API routes:
```typescript
import { describe, it, expect } from 'vitest';
import { auth } from '@/lib/auth.server';

describe('Auth API Routes', () => {
  it('should create session on valid login', async () => {
    const result = await auth.api.signInEmail({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result).toHaveProperty('session');
    expect(result.session).toHaveProperty('token');
  });
  
  it('should reject invalid credentials', async () => {
    await expect(
      auth.api.signInEmail({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    ).rejects.toThrow('Invalid credentials');
  });
  
  it('should create new user on registration', async () => {
    const result = await auth.api.signUpEmail({
      email: 'newuser@example.com',
      password: 'securepass123',
      name: 'New User'
    });
    
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('newuser@example.com');
  });
});
```

**Run command:**
```bash
npm test -- auth
```

#### 5. Component Tests (Vitest + React Testing Library)

**Test File:** `app/components/__tests__/CodeEditor.test.tsx`

Test React components:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CodeEditor } from '../challenges/CodeEditor';

describe('CodeEditor Component', () => {
  it('should render Monaco editor', () => {
    render(<CodeEditor initialCode="console.log('test')" language="javascript" />);
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });
});
```

**Run command:**
```bash
npm test
```

### Manual Verification

> [!NOTE]
> The following manual tests require the application to be running. Start with:
> ```bash
> docker-compose up
> ```

#### Test 1: User Registration and Authentication

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Sign Up"
3. Fill in email: `ekki@test.com`, username: `ekki`, password: `Test1234`
4. Click "Register"
5. Verify you're redirected to the dashboard
6. Check that your profile shows Level 1, 0 XP
7. Log out
8. Log back in with the same credentials
9. Verify successful login

**Expected Result:** User can register, login, and see their profile.

#### Test 2: Browse and Solve a Challenge

**Steps:**
1. Log in to the application
2. Navigate to "Challenges" page
3. Click on an EASY JavaScript challenge (e.g., "Reverse a String")
4. Read the challenge description
5. Write a solution in the code editor
6. Click "Run Tests"
7. Verify test results appear (pass/fail indicators)
8. If tests pass, click "Submit"
9. Verify XP reward notification appears
10. Check that your profile XP increased

**Expected Result:** User can solve challenges, see test results, and earn XP.

#### Test 3: Gamification Flow

**Steps:**
1. Complete 3 different EASY challenges
2. Navigate to your profile
3. Verify XP has accumulated
4. Check if any achievements were earned (e.g., "First Challenge Completed")
5. Navigate to the Leaderboard
6. Verify your username appears on the board

**Expected Result:** Gamification system awards XP, achievements, and updates leaderboard.

#### Test 4: Tutorial Reading

**Steps:**
1. Navigate to "Tutorials" page
2. Click on a tutorial (e.g., "Introduction to Playwright")
3. Verify markdown content renders correctly
4. Verify code snippets have syntax highlighting
5. Check that images (if any) load properly
6. Use browser back button to return to tutorials list

**Expected Result:** Tutorials display with proper formatting.

#### Test 5: CSS/XPath Selector Challenge

**Steps:**
1. Log in to the application
2. Navigate to "Challenges" page
3. Filter by "Selector" challenge type
4. Click on an EASY selector challenge (e.g., "Find the Submit Button")
5. Observe the web component preview showing a form
6. Read the challenge description: "Write a CSS selector that uniquely identifies the submit button"
7. In the selector input field, try an incorrect selector: `.button`
8. Click "Validate Selector"
9. See feedback: "Selector matches 3 elements, but should match only 1"
10. Try the correct selector: `button[type="submit"]`
11. Click "Validate Selector"
12. See success message and earn XP

**Expected Result:** User can solve selector challenges with visual feedback and validation.

#### Test 6: Dark Mode (if implemented)

**Steps:**
1. Click the theme toggle button (moon/sun icon)
2. Verify the entire UI switches to dark mode
3. Check code editor also switches theme
4. Toggle back to light mode

**Expected Result:** Theme switching works across all components.

### Performance Verification

**Manual Check:**
- Use Chrome DevTools Network tab
- Verify API response times < 500ms
- Check page load times < 2 seconds
- Test code execution completes within 10 seconds for complex code

---

## Implementation Sequence

The implementation will follow this order:

1. **Project Setup** (Week 1)
   - Initialize TanStack Start project
   - Set up Docker Compose for PostgreSQL
   - Configure TypeScript and build tools
   - Set up Drizzle schema and migrations
   - Initialize folder structure (`app/` directory)

2. **Data Layer & Auth** (Week 1-2)
   - Define Drizzle database schema (users, challenges, tutorials, etc.)
   - Set up BetterAuth configuration (email/password + OAuth)
   - Create TanStack Start API routes for auth
   - Implement user registration and login flows
   - Set up session management

3. **Frontend Foundation** (Week 2-3)
   - Design system and global styles (CSS variables, dark mode)
   - Create authentication UI (LoginForm, RegisterForm)
   - Set up TanStack Router file-based routing
   - Implement navigation and layout components
   - Build tutorial browsing and reading interface
   - Create blog/writing section for tutorials

4. **Challenge Runner Logic** (Week 3-4)
   - **Build Playwright Shim** - Create mocked Playwright compatibility layer
   - **Build Iframe Executor** - Implement safe code execution in isolated iframe
   - Integrate Monaco Editor for code input
   - Create selector input component (CSS/XPath toggle)
   - Build WebComponentPreview for visual challenges
   - Implement challenge solving interface (split layout)
   - Add test result display and feedback UI

5. **Gamification System** (Week 4-5)
   - Implement XP calculation and leveling logic
   - Create achievement detection engine
   - Build leaderboard system (global, monthly)
   - Design XP progress bars and visual feedback
   - Create achievement badge displays
   - Build user profile dashboard with statistics

6. **Polish & Testing** (Week 5-6)
   - Write unit tests for Playwright shim
   - Write tests for selector validator
   - Test gamification calculations
   - Add API route tests
   - Responsive design refinements (mobile, tablet)
   - Error handling and user feedback improvements
   - Performance optimization
   - Dark mode polish

7. **Content Creation & Deployment** (Week 6-7)
   - Create seed data (initial tutorials)
   - Create starter challenges (5-10 for each type)
   - Write challenge solutions and hints
   - Set up production environment variables
   - Deploy to your own server
   - Configure domain (www.testingwithekki.com)
   - Set up monitoring and error tracking
   - Final testing in production

---

## Notes

- **Solo Developer Considerations:** This plan prioritizes simple, proven technologies to minimize maintenance burden.
- **Incremental Deployment:** Each phase can be deployed independently for early feedback.
- **Scope Control:** MVP features only; additional features (OAuth, mobile app, video tutorials) deferred to Phase 2.
- **Security Priority:** Code execution sandboxing is critical and will be thoroughly tested before launch.

---

## Configuration Decisions

### Answered Questions

1. ✅ **Hosting**: Own server (Ubuntu, 2 CPU, 2 GB RAM, 20 GB disk)
2. ✅ **Domain**: www.testingwithekki.com
3. ✅ **Analytics**: Google Analytics
4. ✅ **User Profiles**: Private by default (users must opt-in to public)

### Server Deployment Plan (2 CPU / 2 GB RAM)

**What This Supports:**
- ~50-100 concurrent users comfortably
- PostgreSQL (configured for low memory usage)
- TanStack Start app (Node.js)
- Nginx as reverse proxy

**Optimization for Limited Resources:**
```yaml
# PostgreSQL configuration (postgresql.conf)
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB       # 50% of RAM
work_mem = 8MB
maintenance_work_mem = 64MB
max_connections = 50             # Conservative limit
```

**Docker Compose for Production:**
```yaml
services:
  postgres:
    image: postgres:15-alpine      # Smaller image
    restart: always
    environment:
      POSTGRES_DB: testingwithekki
      POSTGRES_USER: ekki
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 512M               # Reserve RAM for app
    
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NODE_ENV: production
    depends_on:
      - postgres
    deploy:
      resources:
        limits:
          memory: 1G
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name www.testingwithekki.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.testingwithekki.com;
    
    ssl_certificate /etc/letsencrypt/live/testingwithekki.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/testingwithekki.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Google Analytics Integration

**Setup:**
1. Create GA4 property at analytics.google.com
2. Get Measurement ID (format: G-XXXXXXXXXX)
3. Add to environment variables
4. Set up Google OAuth credentials at console.cloud.google.com

**Implementation:**
```typescript
// app/components/analytics/GoogleAnalytics.tsx
import Script from 'next/script';

export function GoogleAnalytics() {
  const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (!GA_ID) return null;
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
```

**Track Events:**
```typescript
// app/lib/analytics.ts
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// Usage examples:
trackEvent('challenge_completed', { 
  challenge_id: challengeId, 
  difficulty: 'EASY' 
});

trackEvent('level_up', { 
  new_level: userLevel 
});
```

### User Privacy Settings

**Default: Private Profiles**

```typescript
// app/db/schema.ts
export const users = pgTable('users', {
  // ...
  profileVisibility: text('profile_visibility').$type<'private' | 'public'>().default('private'),
  showOnLeaderboard: boolean('show_on_leaderboard').default(false),
});
```

**Profile Settings UI:**
- User can toggle profile visibility in settings
- User can opt-in/out of leaderboard display
- Achievements always private unless profile is public
- Progress/stats only visible to user unless shared

### Remaining Open Questions

1. Should we create seed data (sample tutorials/challenges) during development?
   - **Recommendation**: Yes, create 5 tutorials and 10 challenges for testing
2. What backup strategy for the database?
   - **Recommendation**: Daily pg_dump to separate location
