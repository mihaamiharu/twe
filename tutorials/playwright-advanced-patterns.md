# Advanced Playwright Patterns

Production-ready testing patterns for expert automation.

---

## API + UI Hybrid

```javascript
// Setup via API (fast)
await request.post('/api/users', { data: user });

// Verify via UI
await page.goto('/users');
await expect(page.locator('h1')).toHaveText(user.name);
```

---

## State Setup via API

```javascript
// Skip login UI, set auth directly
const token = await login.getToken(credentials);
await page.evaluate(t => localStorage.setItem('token', t), token);
await page.goto('/dashboard');
```

---

## Screenshots & Video

```javascript
// playwright.config.ts
use: {
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
}

// Manual
await page.screenshot({ path: 'debug.png', fullPage: true });
```

---

## Retry Logic

```javascript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

---

## Parallel Execution

```javascript
// playwright.config.ts
workers: process.env.CI ? 4 : undefined,
fullyParallel: true,
```

---

## Cross-browser & Mobile

```javascript
projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile', use: { ...devices['iPhone 12'] } },
]
```

---

## Practice Challenges

1. [API + UI Testing](/challenges/pw-api-ui-testing)
2. [State Setup via API](/challenges/pw-state-setup-api)
3. [Screenshot on Failure](/challenges/pw-screenshot-failure)
4. [Video Recording](/challenges/pw-video-recording)
5. [Retry Logic](/challenges/pw-retry-logic)
6. [Parallel Execution](/challenges/pw-parallel-execution)
7. [Cross-browser Testing](/challenges/pw-cross-browser)
8. [Mobile Viewport Testing](/challenges/pw-mobile-viewport)
