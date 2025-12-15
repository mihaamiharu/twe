# TestingWithEkki - Documentation

This folder contains all planning and design documents for the TestingWithEkki platform.

## Documents

### Core Planning
- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[TDD.md](./TDD.md)** - Technical Design Document
- **[implementation_plan.md](./implementation_plan.md)** - Detailed Implementation Plan

### Visual Documentation
- **[app_flows.md](./app_flows.md)** - User Flows and Architecture Diagrams
- **[walkthrough.md](./walkthrough.md)** - Planning Phase Summary

### Implementation
- **[github_issues.md](./github_issues.md)** - GitHub Issues Breakdown (23 issues across 7 epics)

## Quick Links

**Stack:**
- Full-Stack: TanStack Start + TypeScript
- Database: PostgreSQL 15 + Drizzle ORM
- Auth: BetterAuth (Email/Password + Google OAuth)
- Code Execution: Mocked Playwright (client-side)

**Server:**
- Ubuntu (2 CPU, 2GB RAM, 20GB disk)
- Domain: www.testingwithekki.com
- Deployment: Docker + Nginx

**Features:**
- JavaScript/Playwright challenges
- CSS/XPath selector challenges
- Gamification (XP, levels, achievements)
- Private profiles by default
- Google Analytics tracking

## Timeline

7-week implementation plan broken into phases:
1. Week 1: Project Setup & Data Layer
2. Week 1-2: Authentication & User Management
3. Week 2-3: Frontend Foundation
4. Week 3-4: Challenge Runner Logic (Playwright Shim)
5. Week 4-5: Gamification System
6. Week 5-6: Testing & Quality
7. Week 6-7: Content Creation & Deployment

## Next Steps

Start with **Issue #1: Initialize TanStack Start Project** from github_issues.md
