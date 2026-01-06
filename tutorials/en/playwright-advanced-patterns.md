---
title: "Advanced Playwright Patterns"
description: "Move beyond basic scripting. Build a high-performance, expert-level framework."
---

# Advanced Playwright Patterns

Move beyond basic scripting. Build a high-performance, expert-level framework.

## The Mental Model: The Factory Line

* **Manual Testing**: An artisan hand-crafting a single car. Slow, precise, unique.
* **Expert Automation**: A high-speed factory line.
  * Robots (API calls) handle the heavy lifting (Setup).
  * Specialists (UI Tests) only touch the final screws.
  * Everything runs in parallel.

If your "Factory" takes 1 hour to build one "Car" (Test Run), you are doing it wrong. It should take 5 minutes.

---

## The Strategy: The UI Bypass

The #1 rule of flexible architecture:
**Only test the UI if you are effectively testing the UI.**

If you are testing the "Checkout" flow, you **should not** manually click through "Registration" and "Login" forms. That is a waste of time and stability.

**The Bypass Pattern**:

1. Use API Request to create a user.
2. Use API Request to get a session token.
3. Inject the token into the browser context.
4. Jump straight to `/checkout`.

---

## The Real World Case: The 8-Minute Tax

**The Scenario**:
You have 100 tests. Each test requires a logged-in user.
The Login UI (fill form, click submit, wait for redirect) takes **5 seconds**.

**The Math**:

* 100 tests * 5 seconds = 500 seconds.
* That is **8.3 minutes** of *just logging in* per build.

**The Fix (API Login)**:

* API Login takes **0.2 seconds**.
* 100 * 0.2 = 20 seconds.
* **Savings**: You just saved 8 minutes per run. On a team with 10 devs running tests 5 times a day, you saved **7 hours of developer time per day**.

```javascript
test.beforeEach(async ({ page, request }) => {
  // 1. API Login (Fast)
  const response = await request.post('/api/login', {
    data: { user: 'alice', pass: 'secret' }
  });
  const { token } = await response.json();

  // 2. Inject State
  await page.addInitScript(value => {
    window.localStorage.setItem('token', value);
  }, token);
});
// 3. Start Test
```

---

## The Traps

### Trap #1: The Shared User

**The crime**: Using the *same* static user account (`admin@test.com`) for all 4 parallel workers.
**The result**:

* Worker 1: Changes "Admin Name" to "Bob".
* Worker 2: Asserts "Admin Name" is "Alice". -> **FAIL**.
**The Fix**: Use **Dynamic Data** (Faker) to create a unique user for *every single test*, or use Worker-indexed users (`admin-1@test.com`, `admin-2@test.com`).

### Trap #2: The Video Hoarder

**The crime**: Recording video for *every* test.
**The result**: Your CI artifacts are 5GB large. The pipeline crashes on upload.
**The Fix**:

```javascript
// playwright.config.ts
use: {
  video: 'on-first-retry', // Only record if it fails and retries
  trace: 'retain-on-failure', // The ultimate debugger
}
```

---

## Quick Reference

### Sharding (CI)

Split your 100 tests across 5 machines to run in 1/5th the time.

```bash
npx playwright test --shard=1/5
npx playwright test --shard=2/5
...
```

### Visual Regression

Compare pixel-perfect screenshots.

```javascript
await expect(page).toHaveScreenshot('home-page.png', {
  maxDiffPixels: 100 // Allow minor rendering noise
});
```

---

