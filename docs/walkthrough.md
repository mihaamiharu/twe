# Planning Phase Walkthrough - TestingWithEkki Platform

## Overview

Completed comprehensive planning for **TestingWithEkki**, a gamified QA learning platform with interactive challenges, tutorials, and a unique mocked Playwright approach for teaching test automation.

---

## What Was Accomplished

### 📋 Core Planning Documents

All planning artifacts have been created and finalized:

1. **[PRD.md](file:///Users/ekkisyam/.gemini/antigravity/brain/8156b38b-9790-4266-bdec-c2e61552cb91/PRD.md)** - Product Requirements Document
2. **[TDD.md](file:///Users/ekkisyam/.gemini/antigravity/brain/8156b38b-9790-4266-bdec-c2e61552cb91/TDD.md)** - Technical Design Document
3. **[implementation_plan.md](file:///Users/ekkisyam/.gemini/antigravity/brain/8156b38b-9790-4266-bdec-c2e61552cb91/implementation_plan.md)** - Complete Implementation Plan
4. **[app_flows.md](file:///Users/ekkisyam/.gemini/antigravity/brain/8156b38b-9790-4266-bdec-c2e61552cb91/app_flows.md)** - User Flow Diagrams
5. **[task.md](file:///Users/ekkisyam/.gemini/antigravity/brain/8156b38b-9790-4266-bdec-c2e61552cb91/task.md)** - Master Task List

### 🏗️ Architecture Decisions

**Major Revision: Single Full-Stack Framework**

- ✅ **TanStack Start** as the sole framework (no separate Express backend)
- ✅ **Mocked Playwright** for client-side code execution (no VM2/Docker sandboxing)
- ✅ **BetterAuth** for authentication (OAuth + email/password)
- ✅ **Drizzle ORM** for database operations
- ✅ **PostgreSQL 15** as the database

**Key Benefits:**
- Simpler deployment (one codebase, one app)
- No code execution security concerns
- Type-safe end-to-end
- Infinite scalability (runs in browsers)

### 🎯 Challenge Types (Phase 1 MVP)

1. **JavaScript/Playwright Challenges** - Users write real Playwright syntax that's executed via browser shim
2. **CSS/XPath Selector Challenges** - Visual component preview with selector validation

### 🎮 Gamification System

- **XP & Levels**: Formula-based progression (100 * level²)
- **Achievements**: Unlockable badges for milestones
- **Leaderboard**: Global ranking (opt-in)
- **Private by Default**: User profiles are private unless user opts in

### 🔐 Authentication

- Email/Password via BetterAuth
- OAuth Providers: Google
- Session management with httpOnly cookies
- CSRF protection built-in

### 📊 Analytics & Tracking

**Google Analytics GA4 Integration:**
- Event tracking for challenge completion
- Level-up events
- User engagement metrics
- Privacy-compliant implementation

### 🖥️ Server Configuration

**Target Environment:**
- **OS**: Ubuntu
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Disk**: 20 GB
- **Domain**: www.testingwithekki.com

**Optimizations:**
- PostgreSQL tuned for 2GB RAM (256MB shared_buffers)
- Docker resource limits (512MB for Postgres, 1GB for app)
- Nginx reverse proxy with SSL (Let's Encrypt)
- Support for 50-100 concurrent users

---

## Testing Strategy

### Unit Tests (Vitest)

1. **Playwright Shim** - Mock API behavior
2. **Selector Validator** - CSS/XPath validation
3. **Gamification Logic** - XP calculations, leveling
4. **API Routes** - Authentication flows

### Component Tests

- React Testing Library for UI components
- Monaco Editor integration
- Authentication forms

---

## Implementation Timeline

**7-Week Plan:**

| Week | Phase | Focus |
|------|-------|-------|
| 1 | Project Setup | TanStack Start, PostgreSQL, Drizzle schema |
| 1-2 | Data Layer & Auth | BetterAuth, API routes, user management |
| 2-3 | Frontend Foundation | Design system, routing, tutorial interface |
| 3-4 | Challenge Runner Logic | Playwright shim, iframe executor, Monaco Editor |
| 4-5 | Gamification System | XP/levels, achievements, leaderboard |
| 5-6 | Polish & Testing | Unit tests, responsive design, dark mode |
| 6-7 | Content & Deployment | Seed data, server setup, production deploy |

---

## File Structure

```
testingwithekki/
├── app/
│   ├── routes/              # TanStack Router (frontend + API)
│   ├── components/          # React components
│   ├── server/              # Server functions & shims
│   ├── db/                  # Drizzle schema & migrations
│   ├── lib/                 # Utilities & auth
│   └── styles/              # Global CSS
├── docker-compose.yml       # PostgreSQL for development
├── Dockerfile               # Production deployment
└── .env.example             # Environment template
```

---

## Key Innovations

### 1. Mocked Playwright Shim

**Revolutionary Approach:**
- Users write: `await page.click('#btn')`
- Browser executes: `document.querySelector('#btn').click()`
- **Result**: Real syntax learning without server-side security risks!

**Example:**
```typescript
class MockedPlaywrightPage {
  async click(selector: string) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found`);
    el.click();
  }
}
```

### 2. Visual Selector Challenges

- Render web component in iframe
- User inputs CSS/XPath selector
- Validate against correct selector(s)
- Support multiple valid answers
- Highlight target element on hover

### 3. Privacy-First Design

- Profiles private by default
- Leaderboard opt-in only
- No public stats without consent
- User controls all visibility settings

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://ekki:password@localhost:5432/testingwithekki

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://www.testingwithekki.com

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# App
NODE_ENV=production
PORT=3000
```

---

## Next Steps

**Ready for Implementation Phase!**

1. ✅ All planning documents completed
2. ✅ Architecture decisions finalized
3. ✅ Test strategy defined
4. ✅ Deployment configuration ready
5. ⏭️ **Next**: Begin Week 1 - Project Setup

**First Commands:**
```bash
# Initialize TanStack Start project
npm create @tanstack/start@latest

# Set up PostgreSQL with Docker
docker-compose up -d

# Initialize Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Hosting** | Own server (Ubuntu) |
| **Domain** | www.testingwithekki.com |
| **Analytics** | Google Analytics GA4 |
| **Profile Privacy** | Private by default |
| **Server Specs** | 2 CPU, 2GB RAM, 20GB disk |
| **Expected Capacity** | 50-100 concurrent users |

---

## Risk Mitigation

✅ **Security**: Client-side execution = no server-side code risks  
✅ **Scalability**: Mocked Playwright runs in browser, infinite scale  
✅ **Performance**: Optimized PostgreSQL config for 2GB RAM  
✅ **Maintenance**: Single codebase with TanStack Start  
✅ **Privacy**: GDPR-friendly, private-by-default design  

---

**Status**: ✅ Planning Complete - Ready for Implementation
