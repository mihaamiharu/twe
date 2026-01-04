# Product Requirements Document (PRD)

## TestingWithEkki - Gamified QA Portfolio & Learning Platform

**Version:** 2.1  
**Date:** January 2, 2026  
**Author:** Ekki

---

## 1. Executive Summary

**TestingWithEkki** is a gamified portfolio and learning platform designed for QA Engineers and SDET professionals. The platform combines content management (tutorials and blog posts) with an interactive coding playground similar to LeetCode, specifically tailored for testing disciplines including Web Testing, API Testing, and test automation scripting with JavaScript/Playwright.

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

#### Tutorials Section

- **Browse Tutorials:** Categorized by topic (Web Testing, API Testing, Automation, etc.)
- **Search & Filter:** Find tutorials by keyword, difficulty, tags
- **Reading Experience:** Clean, markdown-based tutorial viewer
- **Code Snippets:** Syntax-highlighted code examples
- **Categories:**
  - Web Testing Fundamentals
  - API Testing with Postman/REST Assured
  - Playwright Automation
  - JavaScript for Testers
  - CI/CD for QA
  - Test Strategy & Planning

#### Blog/Writing Section

- Personal blog posts and articles
- Share insights, experiences, and opinions
- RSS feed support
- Social sharing capabilities

### 3.2 Interactive Playground (TestLab)

#### Supported Challenge Types

**1. Web Testing Challenges**

- Test case design exercises
- Bug identification in demo applications
- Exploratory testing scenarios
- UI automation script completion
- Example: "Find all accessibility issues in this form"

**2. API Testing Challenges**

- RESTful API testing scenarios
- Request/response validation
- Authentication testing
- API automation scripting
- Example: "Write assertions for this API endpoint"

**3. JavaScript/Playwright Scripting**

- Code completion challenges
- Fix the broken test script
- Write selectors for given scenarios
- Async/await practice
- Example: "Complete this Playwright test for login flow"

#### Playground Features

- **Code Editor:** Monaco Editor with syntax highlighting
- **Playwright Shim:** Mocked Playwright API running in browser
- **Iframe Execution:** User code executes in isolated iframe (client-side)
- **Real-time Feedback:** Instant test results with detailed output
- **Visual Challenges:** CSS/XPath selector challenges with component preview

#### Challenge Library

The platform includes **96 challenges** organized into 4 progressive tiers:

| Tier | Count | Focus Areas | XP Range |
|------|-------|-------------|----------|
| Basic | 23 | CSS Selectors, XPath, Comparison | 10-50 |
| Beginner | 23 | JavaScript Fundamentals, DOM, Async | 15-55 |
| Intermediate | 29 | Playwright Actions, Locators, Assertions, Waits | 40-85 |
| Expert | 21 | Page Object Model, Data-Driven, Advanced Patterns | 75-120 |

### 3.3 Gamification System

#### Experience Points (XP) & Leveling

- Earn XP for completing challenges
- Different XP values based on difficulty
- Progress through levels (Beginner → Apprentice → Professional → Expert → Master)
- Visual progress bars and level badges

#### Achievement System

- **Challenge-based:** "First Challenge Completed", "10 Challenges Solved"
- **Streak-based:** "7-Day Streak", "30-Day Streak"
- **Category-based:** "API Testing Master", "Playwright Pro"
- **Special:** "Early Adopter", "Perfect Score", "Speed Demon"

#### Leaderboard

- Global leaderboard (all-time)
- Monthly leaderboard (resets monthly)
- Category-specific leaderboards
- Friend leaderboard (future)

#### User Profile

- Display level, XP, and achievements
- Show completed challenges
- Personal statistics dashboard
- Skills heatmap (activity over time)
- Shareable profile URL

### 3.4 User Authentication & Management

- Email/password authentication with **email verification**
- **Resend verification email** option
- OAuth (Google)
- Profile customization (avatar, bio, links)
- **Privacy settings** (profile visibility, leaderboard opt-out)
- Progress persistence
- Account settings

### 3.5 Bug Reporting System

Users can report bugs directly from the platform:

- **QA-style bug reports** with severity levels (Critical, High, Medium, Low)
- **Structured format:** Steps to Reproduce, Expected/Actual Behavior
- **Auto-capture:** Page URL, browser info, user context
- Works for both logged-in and anonymous users
- Email field for follow-up on anonymous reports

---

## 4. User Flows

### 4.1 First-Time Visitor Flow

```
Landing Page → Explore Tutorials/Challenges → Sign Up → 
Complete Profile → Tutorial/Challenge → Earn First XP → Dashboard
```

### 4.2 Learning Flow (Tutorials)

```
Browse Tutorials → Select Category → Choose Tutorial → 
Read & Learn → Try Related Challenge → Bookmark/Share
```

### 4.3 Challenge Solving Flow

```
Browse Challenges → Select Challenge → Read Description → 
Write Code in Editor → Run Tests → View Results → 
(If Passed) Get XP + Achievement → Next Challenge
(If Failed) Retry → Improve Code → View Solution (optional)
```

### 4.4 Content Creation Flow (Admin)

```
Admin Dashboard → Create New Tutorial/Challenge → 
Write Content/Test Cases → Preview → Publish → 
Monitor Engagement
```

---

## 5. Functional Requirements

### 5.1 Authentication

- FR-1: Users must be able to register with email/password
- FR-2: Users must be able to login with OAuth providers
- FR-3: Users must be able to reset forgotten passwords
- FR-4: System must validate email addresses

### 5.2 Content Display

- FR-5: Display tutorials with markdown rendering
- FR-6: Support code syntax highlighting
- FR-7: Enable search across tutorials and challenges
- FR-8: Implement tag-based filtering

### 5.3 Playground

- FR-9: Execute JavaScript/Playwright code in isolated iframe (client-side)
- FR-10: Display test execution results in real-time
- FR-11: Validate user code against expected outcomes
- FR-12: Leverage browser's built-in resource limits for safety
- FR-13: Store user's code submissions and results

### 5.4 Gamification

- FR-14: Award XP based on challenge difficulty
- FR-15: Calculate and display user level
- FR-16: Track and award achievements
- FR-17: Update leaderboards in real-time
- FR-18: Display user statistics and progress

### 5.5 Admin Features

- FR-19: CRUD operations for tutorials
- FR-20: CRUD operations for challenges
- FR-21: Analytics dashboard
- FR-22: User management

---

## 6. Non-Functional Requirements

### 6.1 Performance

- NFR-1: Page load time < 2 seconds
- NFR-2: Code execution timeout: 10 seconds max
- NFR-3: Support 100 concurrent users initially
- NFR-4: API response time < 500ms

### 6.2 Security

- NFR-5: All passwords must be hashed automatically (BetterAuth)
- NFR-6: Code execution isolated in iframe (browser sandbox)
- NFR-7: Input validation on all forms
- NFR-8: Rate limiting on API endpoints
- NFR-9: HTTPS only in production

### 6.3 Scalability

- NFR-10: Modular architecture for easy feature addition
- NFR-11: Database designed for horizontal scaling
- NFR-12: Stateless API design

### 6.4 Usability

- NFR-13: Responsive design (mobile, tablet, desktop)
- NFR-14: Keyboard shortcuts in code editor
- NFR-15: Accessibility (WCAG 2.1 AA compliance)
- NFR-16: Dark mode support

### 6.5 Maintainability

- NFR-17: Comprehensive API documentation
- NFR-18: Unit test coverage > 70%
- NFR-19: Clear code comments and documentation

---

## 7. Technical Constraints

### Solo Developer Constraints

- Must use familiar technology stack
- Minimize infrastructure costs
- Simple deployment pipeline
- Easy to maintain and update
- Open-source tools preferred

### MVP Timeline

- Phase 1 (Weeks 1-2): Core auth, CMS, basic UI
- Phase 2 (Weeks 3-4): Playground with JS challenges
- Phase 3 (Weeks 5-6): Gamification system
- Phase 4 (Week 7): Testing, deployment, polish

---

## 8. Success Metrics

### Launch Metrics (First 3 Months)

- 100+ registered users
- 50+ challenges completed
- 10+ tutorials published
- 70% user retention (return within 7 days)
- Average session time > 10 minutes

### Engagement Metrics

- Daily active users (DAU)
- Challenges completed per user
- Tutorial read-through rate
- Social shares
- User feedback score

---

## 9. Future Enhancements (Post-MVP)

### Phase 2 Features

- **Community Features:**
  - User discussions/comments
  - Share solutions with community
  - Upvote/downvote solutions
  
- **Advanced Playground:**
  - Selenium challenges
  - Cypress challenges
  - Performance testing scenarios
  - Load testing sandbox

- **Enhanced Gamification:**
  - Challenges with time limits
  - Head-to-head competitions
  - Team challenges
  - Seasonal events

- **Content Expansion:**
  - Video tutorials
  - Interactive courses
  - Certifications
  - Guest contributions

### Phase 3 Features

- Mobile app (React Native)
- API for third-party integrations
- Premium features/subscription model
- Company-sponsored challenges
- Job board integration

---

## 10. Open Questions

1. Should we allow users to create and share their own challenges?
2. What should be the initial set of challenges (quantity and distribution)?
3. Should there be a newsletter/email notification system?
4. Do we need content moderation for user-generated content?
5. Should the leaderboard be opt-in or opt-out?

---

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Code execution security vulnerabilities | Low | Low | Client-side iframe execution (browser's built-in sandbox) |
| Low user adoption | High | Medium | Focus on marketing, SEO, community building |
| Infrastructure costs | Low | Low | Client-side execution reduces server costs |
| Content creation bottleneck | Medium | Medium | Build content pipeline, guest contributors |
| Cheating/gaming the system | Low | Medium | Implement anti-cheat measures, rate limiting |

---

## 12. Appendices

### A. Competitive Analysis Summary

**LeetCode:**

- ✅ Excellent code playground
- ✅ Strong gamification
- ❌ Not QA-specific
- ❌ Limited testing content

**TestDome:**

- ✅ QA assessments
- ✅ Real-world scenarios
- ❌ Not a learning platform
- ❌ No gamification

**Exercism:**

- ✅ Great mentorship model
- ✅ Good UX
- ❌ Not QA-focused
- ❌ Limited interactivity

**The API Challenges:**

- ✅ API testing focus
- ✅ Practice environment
- ❌ Limited scope
- ❌ Basic UI

**Our Differentiator:** Combine gamification + QA-specific content + interactive playground + personal branding
