---
title: "Test Fixtures (Dependency Injection)"
description: "Stop repeating 'new LoginPage(page)'. Learn how to inject dependencies directly into your tests."
---

If you've mastered the Page Object Model (POM), your tests probably look like this:

```typescript
test('Login', async ({ page }) => {
  const loginPage = new LoginPage(page); // 🤮 Repetitive!
  await loginPage.goto();
  await loginPage.login('user', 'pass');
});
```

That repetitive `new LoginPage(page)` line? We can delete it. **Playwright Fixtures** allow you to "inject" your Page Objects directly into the test function.

---

## 1. The Problem: Boilerbrane

In traditional Selenium or early automation frameworks, you had to manually instantiate classes in every test (or in a `beforeEach` hook). This leads to **tight coupling** and boilerplate code.

Playwright solves this with **Dependency Injection (DI)**. You define *how* to create an object once, and Playwright handles the creation and teardown for every test that requests it.

![Fixtures vs POM Diagram](/images/tutorials/fixture-vs-pom-diagram.png)

---

## 2. Built-in Fixtures

You’ve already been using fixtures! When you write `test('...', async ({ page }) => { ... })`, that `{ page }` part is you requesting the built-in `page` fixture.

Playwright provides several out-of-the-box:

* `page`: Isolated page for the test.
* `context`: Browser context (cookies, storage).
* `browser`: The browser instance (Chromium, Firefox, etc.).
* `request`: API testing context.

---

## 3. Creating Custom Fixtures

The magic happens when you extend the base test to include your own objects.

### Step 1: Define the Fixture Type

First, tell TypeScript what your custom fixtures look like.

```typescript
// fixtures/pom-fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type MyFixtures = {
  loginPage: LoginPage;
  // Add more pages here later!
};
```

### Step 2: Implement the Setup Logic

Use `base.extend` to define how to initialize your `loginPage`.

```typescript
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    // 1. Setup
    const loginPage = new LoginPage(page);
    await loginPage.goto(); // Optional: Auto-navigate!

    // 2. Pass it to the test
    await use(loginPage);

    // 3. Teardown (optional, runs after test finishes)
    // console.log('Test finished!');
  },
});

export { expect } from '@playwright/test'; // Re-export expect
```

---

## 4. The `use()` Lifecycle

The `use()` callback is unique to Playwright. It pauses execution of the fixture, runs the test, and then resumes execution after the test completes. This creates a "sandwich" around your test.

![Fixture Use Lifecycle](/images/tutorials/fixture-use-lifecycle.png)

This is perfect for setup and cleanup:

```typescript
dbFixture: async ({}, use) => {
  await db.connect();   // Runs BEFORE test
  await use(db);        // Test runs here
  await db.disconnect();// Runs AFTER test
}
```

---

## 5. Using Your Fixture

Now, swap your import from `@playwright/test` to your custom fixture file.

```typescript
// tests/login.spec.ts
import { test, expect } from '../fixtures/pom-fixtures'; // Import YOUR test

// proper DI: request 'loginPage' by name
test('User can login', async ({ loginPage, page }) => {
  // loginPage is already created and ready!
  await loginPage.login('user', 'pass');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

Look how clean that is! No `new`, no `beforeEach`, just pure interaction.

---

## 6. Summary Checklist

| Concept | Key Takeaway |
| --- | --- |
| **Dependency Injection** | Request what you need in the test arguments `({ loginPage })`. |
| **`test.extend`** | The method to create a custom version of `test` with your fixtures. |
| **`use()`** | The callback that injects the value and handles the setup/teardown sandwich. |
| **Why?** | Reduces boilerplate, isolates state, and creates reusable setups. |

---

## 7. Further Reading

* **[Playwright Fixtures Guide](https://playwright.dev/docs/test-fixtures)**: Official documentation.
* **[Automatic Fixtures](https://playwright.dev/docs/test-fixtures#automatic-fixtures)**: Fixtures that run even if you don't request them (great for logging).
