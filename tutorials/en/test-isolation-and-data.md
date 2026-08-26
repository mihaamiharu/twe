---
title: 'Control Test Data, Authentication, and Network State'
description: 'Create repeatable starting conditions without turning every test into a long UI setup journey.'
---

## Reliability begins before the first click

A test cannot be isolated if it depends on whatever data a previous run left behind. Define ownership for accounts, records, and cleanup.

Prefer data that is:

- created or reset for the scenario;
- unique when parallel workers can collide;
- minimal for the behavior under test;
- free of production personal data and secrets.

## Prepare state at the right layer

If the test verifies checkout, logging in and creating inventory through the UI may only be setup. Use an API or trusted test utility when that setup is outside the risk:

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset-cart');
});
```

Keep setup observable enough to fail clearly. A successful HTTP status alone may not prove the requested record was created; validate the response or query the state when appropriate.

## Reuse authentication safely

Playwright can save authenticated browser state and load it in a project:

```ts
// setup/auth.setup.ts
await page.goto('/login');
await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page).toHaveURL(/dashboard/);
await page.context().storageState({ path: 'playwright/.auth/user.json' });
```

The state file can contain sensitive cookies. Keep it out of version control and regenerate it securely. Use separate accounts or states for tests that modify shared server-side data.

## Network control has two purposes

Use API calls to arrange state. Use routing/mocking when the scenario explicitly needs a controlled response, rare error, or unavailable dependency:

```ts
await page.route('**/api/recommendations', async (route) => {
  await route.fulfill({ status: 503, body: 'Unavailable' });
});
```

Do not mock away the integration you intend to test. A fully mocked checkout cannot prove the real checkout integration works.

## Parallel safety

Generate worker-safe data, avoid a single shared mutable account, and make cleanup idempotent. If a system cannot support parallel writes, isolate that small group intentionally instead of disabling parallelism everywhere.

## State contract

Document each important scenario as:

```text
Owned data:
Creation method:
Authentication state:
External dependencies:
Cleanup:
Parallel collision risk:
```

This contract is often more important to reliability than the test’s action syntax.
