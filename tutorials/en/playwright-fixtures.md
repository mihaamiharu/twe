---
title: "Playwright Fixtures"
description: "Stop repeating yourself. Let the framework handle the setup."
---

# Playwright Fixtures

Stop repeating yourself. Let the framework handle the setup.

## The Mental Model: The Concierge

Imagine checking into a hotel.

* **Without Fixtures**: You enter the lobby, find your own key, carry your bags, make the bed, and verify the wifi works. Then you sleep.
* **With Fixtures**: You walk in. The Concierge hands you a key to a room that is already prepared. You just sleep.

In Playwright, **Fixtures are your Concierge**.
Instead of writing `beforeEach` hooks to "setup the room" (login, navigate, create data), you simply **ask for the room** in your test arguments, and Playwright ensures it is ready.

---

## The Strategy: The "Test Signature" Strategy

Dependency Injection is the core of Playwright.
**Your test arguments define your needs.**

* **The Bad Way (Global Hooks)**:

    ```javascript
    let todoPage;
    test.beforeEach(async ({ page }) => {
      todoPage = new TodoPage(page);
      await todoPage.goto();
      await todoPage.addToCart('Milk');
    });
    ```

* **The Good Way (Fixtures)**:

    ```javascript
    // The test simply "asks" for a pre-loaded cart
    test('Checkout works', async ({ cartPageWithItems }) => {
       await cartPageWithItems.checkout();
    });
    ```

**Why it wins**:

1. **Isolation**: Each test gets a fresh environment.
2. **Readability**: The test signature tells you exactly what the test needs.
3. **Laziness**: If a test *doesn't* ask for `cartPage`, the setup code never runs.

---

## The Real World Case: The Authenticated Page Object

**The Scenario**:
You have a `SettingsPage` that only works if the user is logged in.
You don't want to repeat `await loginPage.login()` in every single test.

**The Fix**: Create a custom fixture that combines POM + Auth.

```javascript
// fixtures.ts
import { test as base } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

// 1. Extend the base test
export const test = base.extend({
  // 2. Define the fixture
  settingsPage: async ({ page }, use) => {
    // A. Setup
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user', 'pass'); // Auto-login!
    
    const settings = new SettingsPage(page);
    await settings.goto();

    // B. Pass to Test
    await use(settings);

    // C. Teardown (Optional)
    await settings.cleanup(); 
  },
});
```

**The Test**:

```javascript
import { test } from './fixtures';

test('Change password', async ({ settingsPage }) => {
  // logic...
});
```

---

## The Traps

### Trap #1: The Global Leak

**The Crime**: Using `let` variables outside the test to share state.
**The Reality**: Playwright runs in parallel. Worker 1 will overwrite Worker 2's variable.
**The Fix**: Always pass state through Fixtures.

### Trap #2: The Over-Engineer

**The Crime**: Creating a fixture for a single test.
**The Reality**: If you only use a "Logged In Admin" once, just write it in the test.
**The Rule**: Refactor into a fixture only when you use it **3 times**.

---

## Quick Reference

| Concept | Description |
| :--- | :--- |
| `base.extend()` | Creates a customized `test` object |
| `use(value)` | Passes the value to the test (pauses execution) |
| `worker` scoped | Shared across tests in the same worker (expensive setup) |
| `test` scoped | Created fresh for every test (default) |

---

