---
title: 'Built-In Fixtures, Hooks, and Custom Fixtures'
description: 'Use Playwright’s isolated resources directly, then introduce custom fixtures only for reusable setup with clear ownership.'
---

## Start with built-in fixtures

```ts
test('loads products', async ({ page, request, context, browserName }) => {
  // page: isolated tab
  // request: APIRequestContext
  // context: isolated browser session
  // browserName: current project browser
});
```

Playwright creates fixtures on demand and tears them down according to scope. Most early tests need only `page` and perhaps `request`.

## Hooks are simple shared timing

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset-cart');
});
```

Use a hook when every test in a describe block needs the same action. Keep hooks visible and small; hidden setup makes failures harder to understand.

## Custom fixtures package reusable resources

```ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';

type AppFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await use(loginPage);
  },
});

export { expect };
```

The fixture declares a dependency on `page`, performs setup, hands the value to the test through `use`, and can perform cleanup after `use` returns.

## Choose scope deliberately

Test-scoped fixtures are created for each test and support isolation. Worker-scoped fixtures are shared by tests in one worker process and suit expensive read-only services or worker-owned resources.

Do not put a mutable customer account or database transaction into worker scope unless ownership and cleanup make parallel use safe.

## Fixture design checklist

- Does the fixture have one clear responsibility?
- Is setup failure descriptive?
- Is test scope sufficient?
- Who owns cleanup?
- Does it hide a business step the test title should reveal?
- Can it run safely in parallel?

Fixtures are dependency management for tests. They are not a goal by themselves, and a plain helper can remain the clearer choice.
