# Technical Design Document (TDD)

## TestingWithEkki - Gamified QA Portfolio & Learning Platform

**Version:** 2.1  
**Date:** January 2, 2026  
**Author:** Ekki

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React UI Components]
        Store[Zustand State]
        Editor[Monaco Code Editor]
        PlaywrightShim[Mocked Playwright Shim]
    end

    subgraph "TanStack Start Server"
        ServerFn[Server Functions]
        APIRoutes[API Routes]
        Auth[BetterAuth]
        Gamification[Gamification Engine]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
    end

    UI --> Store
    Store --> ServerFn
    Editor --> PlaywrightShim
    PlaywrightShim --> ServerFn

    ServerFn --> Auth
    ServerFn --> Gamification
    APIRoutes --> Auth
    APIRoutes --> Gamification

    Auth --> PG
    Gamification --> PG

    style PlaywrightShim fill:#ff6b6b
    style Gamification fill:#4ecdc4
    style Auth fill:#ffd93d
```

### 1.2 Architecture Principles

- **Separation of Concerns:** Clear boundaries between frontend, backend, and services
- **Stateless API:** All API endpoints are stateless for scalability
- **Security First:** Authentication, authorization, and sandboxing at every layer
- **Modular Design:** Each feature as independent module
- **Solo-Dev Friendly:** Technologies that are well-documented and easy to maintain

---

## 2. Technology Stack

### 2.1 Frontend

| Component          | Technology                  | Justification                                                 |
| ------------------ | --------------------------- | ------------------------------------------------------------- |
| Framework          | **TanStack Start**          | Full-stack React framework with SSR, type-safe routing        |
| Build Tool         | **Vite**                    | Fast dev server, optimized builds (built into TanStack Start) |
| Routing            | **TanStack Router**         | Type-safe file-based routing, integrated with TanStack Start  |
| State Management   | **Zustand**                 | Lightweight, simple API                                       |
| Server State       | **TanStack Query**          | React Query for data fetching and caching                     |
| UI Components      | **Custom + Radix UI**       | Accessible primitives, full control                           |
| Styling            | **Tailwind CSS v4**         | Utility-first, rapid development                              |
| Code Editor        | **Monaco Editor**           | VSCode editor, feature-rich                                   |
| Markdown Rendering | **React Markdown + remark** | Extensible, supports GFM                                      |
| HTTP Client        | **fetch** (native)          | Built-in, works with TanStack Query                           |

### 2.2 Server-Side (TanStack Start)

| Component            | Technology                      | Justification                                                  |
| -------------------- | ------------------------------- | -------------------------------------------------------------- |
| Full-Stack Framework | **TanStack Start**              | Unified backend/frontend, server functions, API routes         |
| Language             | **TypeScript**                  | Type safety, better DX                                         |
| ORM                  | **Drizzle**                     | Lightweight, type-safe, SQL-first                              |
| Validation           | **Zod**                         | Schema validation, TypeScript integration                      |
| Authentication       | **BetterAuth**                  | Framework-agnostic, OAuth + email/password, session management |
| Code Execution       | **Mocked Playwright (Browser)** | Client-side shim, no server sandboxing needed                  |
| Testing              | **Vitest**                      | Fast, modern testing                                           |
| API Documentation    | **TypeScript**                  | Type-safe APIs with TanStack Start                             |

### 2.3 Database & Storage

| Component        | Technology                        | Justification               |
| ---------------- | --------------------------------- | --------------------------- |
| Primary Database | **PostgreSQL 15**                 | ACID, powerful, open-source |
| Object Storage   | Local file system / **S3** (prod) | File uploads, avatars       |

### 2.4 DevOps & Infrastructure

| Component        | Technology                                      | Justification                |
| ---------------- | ----------------------------------------------- | ---------------------------- |
| Containerization | **Docker + Docker Compose**                     | Consistent environments      |
| CI/CD            | **GitHub Actions**                              | Integrated with repo         |
| Hosting          | **VPS (DigitalOcean)** or **Railway**           | Cost-effective for solo dev  |
| Reverse Proxy    | **Nginx**                                       | Handle SSL, static files     |
| Monitoring       | **Sentry** (errors) + **Plausible** (analytics) | Privacy-focused, lightweight |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ SUBMISSION : creates
    USER ||--o{ USER_ACHIEVEMENT : earns
    USER ||--o{ PROGRESS : tracks
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : links

    USER {
        uuid id PK
        string email UK
        string username UK
        string displayName
        string avatarUrl
        int level
        int totalXp
        int currentLevelXp
        timestamp createdAt
        timestamp lastLoginAt
    }

    SESSION {
        uuid id PK
        uuid userId FK
        string token
        timestamp expiresAt
    }

    ACCOUNT {
        uuid id PK
        uuid userId FK
        string provider
        string providerAccountId
        string accessToken
    }

    TUTORIAL ||--o{ PROGRESS : has
    TUTORIAL {
        uuid id PK
        string title
        string slug UK
        text content
        string[] tags
        enum difficulty
        int readTime
        timestamp publishedAt
        timestamp updatedAt
    }

    CHALLENGE ||--o{ TEST_CASE : contains
    CHALLENGE ||--o{ SUBMISSION : receives
    CHALLENGE ||--o{ PROGRESS : tracks
    CHALLENGE {
        uuid id PK
        string title
        string slug UK
        text description
        enum type
        enum difficulty
        int xpReward
        string starterCode
        string htmlContent
        string category
        uuid tutorialId FK
        timestamp createdAt
    }

    TestCase {
        uuid id PK
        uuid challengeId FK
        text input
        text expectedOutput
        boolean isHidden
        int order
    }

    Submission {
        uuid id PK
        uuid userId FK
        uuid challengeId FK
        text code
        enum status
        text output
        int executionTime
        timestamp submittedAt
    }

    Achievement ||--o{ UserAchievement : awarded
    Achievement {
        uuid id PK
        string key UK
        string name
        string description
        string iconUrl
        enum category
        json criteria
    }

    UserAchievement {
        uuid id PK
        uuid userId FK
        uuid achievementId FK
        timestamp earnedAt
    }

    Progress {
        uuid id PK
        uuid userId FK
        uuid challengeId FK
        uuid tutorialId FK
        enum status
        timestamp startedAt
        timestamp completedAt
    }
```

### 3.2 Key Tables Description

#### Users Table

Stores user authentication and profile information.

- BetterAuth manages password hashing automatically
- XP and leveling tracked here for quick access
- OAuth users linked via `accounts` table

#### Sessions Table

Managed by BetterAuth for session tracking.

- Supports both email/password and OAuth sessions
- Automatic cleanup of expired sessions

#### Accounts Table

OAuth provider account linkage (Google, GitHub, etc.).

- Multiple providers can be linked to one user

#### Challenges Table

Core content for the playground.

- `type`: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR'
- `difficulty`: 'EASY' | 'MEDIUM' | 'HARD'
- `starterCode`: Pre-filled code in editor (for code challenges)
- `solution`: Reference solution (admin only)
- `htmlContent`: HTML structure for selector challenges
- `targetSelector`: Correct selector(s) for validation (JSON array)

#### Submissions Table

Tracks every code submission.

- `status`: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ERROR'
- Stores execution output for debugging
- Retention policy: Keep for 30 days

#### Progress Table

Tracks user progress on challenges and tutorials.

- Polymorphic: links to either challenge or tutorial
- `status`: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

#### Bug Reports Table

QA-style bug reporting from users.

- `severity`: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- `status`: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX' | 'CLOSED'
- Auto-captures page URL and browser info
- Links to user (optional for anonymous reports)

#### Tutorial ↔ Challenge Relationship

- Challenges can be linked to tutorials via `tutorialId` FK
- Enables "Try Related Challenge" flow after reading tutorials

---

## 4. API Design

### 4.1 API Architecture

**Base URL:** `https://api.testingwithekki.com/v1`

**Standards:**

- RESTful conventions
- JSON request/response
- JWT bearer token authentication
- Rate limiting: 100 requests/min per user

### 4.2 API Endpoints Overview

#### Authentication Endpoints

```
POST   /api/auth/sign-up/email      - Register new user
POST   /api/auth/sign-in/email      - Login with email/password
POST   /api/auth/sign-in/social     - OAuth login
POST   /api/auth/sign-out           - Logout user
POST   /api/auth/forget-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
```

#### User Endpoints

```
GET    /users/me               - Get current user profile
PATCH  /users/me               - Update profile
GET    /users/:username        - Get public profile
GET    /users/me/stats         - Get user statistics
GET    /users/me/achievements  - Get user achievements
```

#### Tutorial Endpoints

```
GET    /tutorials              - List tutorials (paginated, filtered)
GET    /tutorials/:slug        - Get tutorial by slug
POST   /tutorials              - Create tutorial (admin)
PATCH  /tutorials/:id          - Update tutorial (admin)
DELETE /tutorials/:id          - Delete tutorial (admin)
```

#### Challenge Endpoints

```
GET    /challenges             - List challenges (paginated, filtered)
GET    /challenges/:slug       - Get challenge details
GET    /challenges/:id/starter - Get starter code
POST   /challenges             - Create challenge (admin)
PATCH  /challenges/:id         - Update challenge (admin)
DELETE /challenges/:id         - Delete challenge (admin)
```

#### Playground/Submission Endpoints

```
POST   /submissions            - Submit code for execution
GET    /submissions/:id        - Get submission result
GET    /submissions/me         - Get my submissions
GET    /submissions/:challengeId/solution - Get solution (if unlocked)
```

#### Gamification Endpoints

```
GET    /leaderboard            - Get global leaderboard
GET    /leaderboard/monthly    - Get monthly leaderboard
GET    /achievements           - List all achievements
GET    /users/me/progress      - Get my progress
```

#### Bug Report Endpoints

```
POST   /bug-reports            - Submit a bug report
GET    /bug-reports            - List bug reports (admin)
PATCH  /bug-reports/:id        - Update bug report status (admin)
```

#### Email Verification Endpoints

```
POST   /auth/send-verification-email  - Resend verification email
```

### 4.3 Sample API Request/Response

#### POST /api/submissions

**Request:**

```json
{
  "challengeSlug": "click-the-button",
  "code": "await page.click('#submit-btn');",
  "testResults": [{ "passed": true }],
  "executionTime": 150
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "submission": {
      "isPassed": true,
      "testsPassed": 3,
      "testsTotal": 3,
      "xpEarned": 50,
      "executionTime": 150
    },
    "isFirstCompletion": true,
    "levelUp": null,
    "newAchievements": [{ "id": "...", "name": "First Steps", "icon": "🎯" }]
  }
}
```

**Response (Failed):**

```json
{
  "success": true,
  "data": {
    "submission": {
      "isPassed": false,
      "testsPassed": 1,
      "testsTotal": 3,
      "xpEarned": 0,
      "executionTime": 120
    },
    "isFirstCompletion": false,
    "levelUp": null,
    "newAchievements": []
  }
}
```

---

## 5. Component Design

### 5.1 Authentication Service (BetterAuth)

**Responsibilities:**

- User registration and login (email/password)
- OAuth integration (Google, GitHub)
- Session management
- Password automatic hashing
- Token generation and validation

**BetterAuth Configuration:**

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
```

**Security Measures:**

- Automatic password hashing with modern algorithms
- Secure session management with httpOnly cookies
- CSRF protection built-in
- Rate limiting on auth endpoints
- Email verification for new accounts (optional)

### 5.2 Code Execution - Mocked Playwright Approach

**Architecture Decision:** Instead of server-side sandboxing (VM2/Docker), we use a client-side compatibility layer that mimics Playwright's API.

**Why This Approach:**

- ✅ No server-side code execution security risks
- ✅ Instant feedback (no network round trip)
- ✅ Users learn real Playwright syntax
- ✅ Much simpler infrastructure
- ✅ Scales infinitely (runs in user's browser)
- ❌ Limited to DOM manipulation (no actual Playwright features)
- ❌ Cannot test real browser automation

**Implementation:**

```typescript
// app/server/playwright-shim.ts
export class MockedPlaywrightPage {
  private targetDocument: Document;

  constructor(iframeDocument: Document) {
    this.targetDocument = iframeDocument;
  }

  async click(selector: string): Promise<void> {
    await this.delay(50); // Simulate async
    const element = this.targetDocument.querySelector(selector) as HTMLElement;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    if (element.offsetParent === null) {
      throw new Error(`Element is not visible: ${selector}`);
    }
    element.click();
  }

  async fill(selector: string, value: string): Promise<void> {
    await this.delay(50);
    const element = this.targetDocument.querySelector(
      selector,
    ) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async getByRole(
    role: string,
    options?: { name?: string },
  ): Promise<HTMLElement | null> {
    await this.delay(20);
    const elements = Array.from(
      this.targetDocument.querySelectorAll(`[role="${role}"]`),
    );
    if (options?.name) {
      return (
        (elements.find((el) =>
          el.textContent?.includes(options.name),
        ) as HTMLElement) || null
      );
    }
    return (elements[0] as HTMLElement) || null;
  }

  async textContent(selector: string): Promise<string | null> {
    const element = this.targetDocument.querySelector(selector);
    return element?.textContent || null;
  }

  async waitForSelector(
    selector: string,
    options?: { timeout?: number },
  ): Promise<void> {
    const timeout = options?.timeout || 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.targetDocument.querySelector(selector)) {
        return;
      }
      await this.delay(100);
    }
    throw new Error(`Timeout waiting for selector: ${selector}`);
  }

  locator(selector: string) {
    return {
      click: () => this.click(selector),
      fill: (value: string) => this.fill(selector, value),
      textContent: () => this.textContent(selector),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Frontend usage
export function executePlaywrightCode(
  code: string,
  htmlContent: string,
): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    // Create isolated iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    try {
      // Inject HTML into iframe
      iframe.contentDocument!.body.innerHTML = htmlContent;

      // Create mocked page object
      const page = new MockedPlaywrightPage(iframe.contentDocument!);

      // Execute user code with mocked page
      const userFunction = new Function(
        'page',
        `
        return (async () => {
          ${code}
        })();
      `,
      );

      userFunction(page)
        .then(() => {
          resolve({
            status: 'PASSED',
            output: 'All steps completed successfully',
          });
        })
        .catch((error: Error) => {
          resolve({ status: 'FAILED', output: error.message });
        })
        .finally(() => {
          document.body.removeChild(iframe);
        });
    } catch (error) {
      document.body.removeChild(iframe);
      reject(error);
    }
  });
}
```

**Example User Code:**

```javascript
// User writes real Playwright syntax
await page.click('#submit-button');
await page.fill('#email', 'test@example.com');
const text = await page.textContent('.success-message');
// This executes using DOM APIs under the hood
```

**Limitations & Future:**

- Phase 1: Basic DOM manipulation only
- Phase 2: Add more Playwright methods (screenshot as canvas, network mocking)
- Phase 3: Consider iframe-based Puppeteer for more realism

### 5.3 Gamification Engine

**Responsibilities:**

- Calculate XP and levels
- Award achievements
- Update leaderboards
- Track user progress

**Key Functions:**

```typescript
class GamificationEngine {
  awardXP(userId: string, xp: number): Promise<LevelUp?>;
  checkAchievements(userId: string, event: GameEvent): Promise<Achievement[]>;
  updateLeaderboard(userId: string): Promise<void>;
  calculateLevel(totalXp: number): number;
}
```

**XP & Leveling Formula:**

```
XP to reach level N = 100 * N * N
Level 1: 100 XP
Level 2: 400 XP
Level 3: 900 XP
...
```

**Challenge XP Rewards:**

- Easy: 10-30 XP
- Medium: 40-70 XP
- Hard: 80-150 XP

**Achievement Examples:**

```json
{
  "key": "first-challenge",
  "name": "First Steps",
  "description": "Complete your first challenge",
  "criteria": { "challengesCompleted": 1 }
}
```

### 5.4 Content Management

**Admin Panel Features:**

- WYSIWYG markdown editor
- Challenge test case manager
- Preview before publish
- Analytics dashboard
- User management

**Content Storage:**

- Tutorials: Markdown in DB, media in object storage
- Challenges: Structured data in DB
- User uploads: Object storage with CDN

---

## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/
├── app/
│   ├── routes/                # TanStack Router file-based routes
│   │   ├── __root.tsx        # Root layout
│   │   ├── index.tsx         # Home page
│   │   ├── tutorials/
│   │   │   ├── index.tsx     # Tutorials list
│   │   │   └── $slug.tsx     # Tutorial detail
│   │   ├── challenges/
│   │   │   ├── index.tsx     # Challenges list
│   │   │   └── $slug.tsx     # Challenge playground
│   │   └── profile.tsx       # User profile
│   ├── components/
│   │   ├── common/           # Shared components
│   │   ├── auth/             # Auth-related components
│   │   ├── challenges/       # Challenge components
│   │   ├── tutorials/        # Tutorial components
│   │   └── gamification/     # XP, achievements, leaderboard
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   └── auth.ts           # BetterAuth client
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts
│   │   └── challengeStore.ts
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Utilities
│   └── styles/               # Global styles
├── public/
└── app.config.ts             # TanStack Start config
```

backend/
├── src/
│ ├── db/
│ │ ├── schema.ts # Drizzle schema
│ │ ├── index.ts # DB client
│ │ └── migrations/ # SQL migrations
│ ├── lib/
│ │ └── auth.ts # BetterAuth server config
│ ├── services/
│ ├── routes/
│ ├── middleware/
│ └── server.ts
└── drizzle.config.ts # Drizzle Kit config

````

### 6.2 Key Frontend Components

#### CodeEditor Component
```tsx
interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange: (code: string) => void;
  theme: 'light' | 'dark';
}

// Monaco Editor integration
// Keyboard shortcuts (Cmd+Enter to run)
// Auto-save to localStorage
````

#### ChallengeView Component

```tsx
// Split layout: Description | Editor | Output
// Test case display
// Submit button with loading state
```

#### ProgressBar Component

```tsx
// Animated XP progress
// Level-up animations
// Achievement notifications (toast)
```

### 6.3 State Management Strategy

**Zustand Stores:**

```typescript
// authStore
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
}

// challengeStore
interface ChallengeStore {
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  fetchChallenges: (filters) => Promise<void>;
  submitCode: (code) => Promise<Result>;
}
```

**Local State:** Component-specific UI state (form inputs, modals)  
**Server State:** React Query for caching API responses

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**JWT Structure:**

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Role-Based Access Control:**

- `USER`: Standard users
- `ADMIN`: Full access (Ekki)

**Protected Routes:**

- Middleware validates JWT on protected endpoints
- Admin routes check for admin role

### 7.2 Code Execution Security

**Sandboxing Layers:**

1. **VM-level:** No access to Node.js APIs
2. **Resource limits:** CPU, memory, execution time
3. **Network isolation:** No external requests
4. **File system:** Read-only, no write access

**Malicious Code Prevention:**

```javascript
// Blocked patterns
- require() / import
- process.exit()
- while(true) infinite loops (timeout)
- eval() (already sandboxed)
```

### 7.3 Input Validation

**All inputs validated with Zod:**

```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
});
```

### 7.4 Rate Limiting

```
/auth/* endpoints: 5 requests/min
/submissions: 10 requests/min
Other endpoints: 100 requests/min
```

### 7.5 CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

**Docker Compose Setup:**

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

  app:
    build: .
    ports:
      - '3000:3000'
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://ekki:dev_password@postgres:5432/testingwithekki
```

### 8.2 Production Deployment

**Option A: Single VPS (DigitalOcean Droplet)**

```
Nginx (Reverse Proxy + SSL)
├── TanStack Start App (PM2)
└── PostgreSQL
```

**Option B: Railway/Render (Managed)**

- Frontend: Static hosting
- Backend: Container deployment
- Database: Managed PostgreSQL
- Redis: Managed Redis

### 8.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run backend tests
      - Run frontend tests

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to registry
      - SSH to server
      - Pull latest images
      - Restart services
```

---

## 9. Performance Optimization

### 9.1 Frontend Optimizations

- **Code Splitting:** Route-based splitting with React.lazy
- **Image Optimization:** WebP format, lazy loading
- **Caching:** Service worker for offline support
- **Bundle Size:** Tree shaking, minimize dependencies
- **CDN:** Static assets served via CDN

### 9.2 Backend Optimizations

- **Database Indexing:**
  - Index on `users.email`, `users.username`
  - Index on `challenges.slug`, `tutorials.slug`
  - Composite index on `submissions(userId, challengeId)`
- **Query Optimization:** Use Prisma's select to fetch only needed fields
- **Caching Strategy:**
  - Cache challenge details (1 hour)
  - Cache leaderboard (5 minutes)
  - Cache user profile (10 minutes)
- **Response Compression:** Gzip/Brotli

### 9.3 Database Optimization

**Prisma Configuration:**

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Connection Pooling:**

```
Max connections: 10 (for solo dev load)
```

---

## 10. Monitoring & Observability

### 10.1 Error Tracking

**Sentry Integration:**

- Frontend errors
- Backend exceptions
- Performance monitoring

### 10.2 Analytics

**Plausible (Privacy-friendly):**

- Page views
- User flows
- Event tracking (challenge completions, sign-ups)

### 10.3 Logs

**Winston Logger:**

- Structured JSON logs
- Log levels: error, warn, info, debug
- Separate log files for errors
- Log rotation (daily)

### 10.4 Health Checks

```
GET /health
Response: { status: "ok", uptime: 12345, version: "1.0.0" }
```

---

## 11. Testing Strategy

### 11.1 Backend Testing

**Unit Tests (Vitest):**

- Service layer logic
- Helper functions
- Gamification calculations

**Integration Tests (Supertest):**

- API endpoint testing
- Database operations
- Authentication flows

**Coverage Target:** 70%

### 11.2 Frontend Testing

**Unit Tests (Vitest + React Testing Library):**

- Component rendering
- User interactions
- Store logic

**E2E Tests (Playwright):**

- Critical user flows
- Challenge completion flow
- Registration and login

### 11.3 Code Execution Testing

- Test sandbox security
- Verify timeout enforcement
- Test with malicious code samples
- Benchmark performance

---

## 12. Migration & Rollback Strategy

### 12.1 Database Migrations

**Prisma Migrate:**

```bash
# Create migration
npx prisma migrate dev --name add_achievements_table

# Apply to production
npx prisma migrate deploy
```

**Rollback Plan:**

- Keep migration history
- Database backups before major migrations
- Ability to revert schema changes

### 12.2 Zero-Downtime Deployment

- Blue-green deployment for backend
- Database migrations run before deployment
- Backward-compatible API changes

---

## 13. Development Workflow

### 13.1 Git Workflow

**Branching Strategy:**

```
main (production)
└── develop (staging)
    ├── feature/auth-system
    ├── feature/playground
    └── bugfix/xp-calculation
```

**Commit Convention:**

```
feat: Add OAuth login
fix: Fix XP calculation bug
docs: Update API documentation
test: Add playground security tests
```

### 13.2 Code Review

- Self-review before merging (solo dev)
- Use GitHub Issues for tracking
- PR template with checklist

### 13.3 Documentation

- Inline code comments for complex logic
- API documentation with Swagger
- README with setup instructions
- Architecture decision records (ADRs)

---

## 14. Cost Estimation (Monthly)

### Development Phase

- **Local Development:** $0
- **GitHub:** Free tier

### Production (Initial Launch)

- **VPS (DigitalOcean):** $12-24/month (2GB RAM droplet)
- **Domain:** $12/year (~$1/month)
- **Object Storage:** $5/month (50GB)
- **Email Service (SendGrid):** Free tier (100 emails/day)
- **SSL Certificate:** Free (Let's Encrypt)
- **Monitoring (Sentry):** Free tier (5k events/month)

**Total: ~$20-30/month**

### Scaling Costs (100+ active users)

- **Larger VPS:** $40-60/month
- **CDN (Cloudflare):** Free tier
- **Managed Database:** $15/month

**Total: ~$60-80/month**

---

## 15. Future Technical Considerations

### 15.1 Scalability

**When to scale:**

- \>1000 concurrent users
- Database queries slowing down
- Code execution queue backing up

**Horizontal Scaling:**

- Load balancer (Nginx)
- Multiple backend instances
- Dedicated code execution workers
- Database read replicas

### 15.2 Multi-language Support

**Execution Engine Extensions:**

- Python sandbox (for Selenium/pytest)
- Java execution (for REST Assured)
- Separate Docker containers per language

### 15.3 Real-time Features

**WebSocket Integration:**

- Live leaderboard updates
- Real-time code collaboration
- Notifications

**Technology:** Socket.io

---

## 16. Open Technical Questions

1. Should we use a job queue (Bull) from the start or start simple?
2. What's the best sandboxing solution for MVP? (VM2 vs Docker)
3. Do we need full-text search from day 1? (PostgreSQL FTS vs Elasticsearch)
4. Should we implement caching from the start?
5. What's the backup strategy for user data?

---

## 17. Decision Log

| Decision           | Options Considered                  | Choice         | Rationale                                  |
| ------------------ | ----------------------------------- | -------------- | ------------------------------------------ |
| Frontend Framework | React+Vite, TanStack Start, Next.js | TanStack Start | Type-safe routing, SSR built-in, better DX |
| Backend Framework  | Express, Fastify, NestJS            | Express        | Simple, flexible, well-known               |
| Database           | PostgreSQL, MySQL, MongoDB          | PostgreSQL     | ACID, powerful queries                     |
| ORM                | Prisma, Drizzle, TypeORM            | Drizzle        | Lightweight, SQL-first, type-safe          |
| Authentication     | Passport+JWT, BetterAuth, Lucia     | BetterAuth     | OAuth built-in, framework-agnostic         |
| Code Editor        | Monaco, CodeMirror, Ace             | Monaco         | VSCode quality                             |
| State Management   | Redux, Zustand, Jotai               | Zustand        | Simple, minimal boilerplate                |

---

## Appendix A: Tech Stack Alternatives

If starting over or scaling:

- **Next.js** instead of React + Vite (SSR, better SEO)
- **tRPC** instead of REST API (type-safe API)
- **Turborepo** for monorepo management
- **PlanetScale** for serverless database
- **Vercel** for hosting

---

## Appendix B: Sample Code Snippets

### Backend: Middleware Example

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Frontend: API Service Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```
