---
title: 'Prepare a Controlled Starting State'
description: 'Control test data, authentication, dependencies, and cleanup so every test starts clearly and remains safe during parallel execution.'
---

## After this lesson, you can

- define every condition that must be ready before a test runs;
- choose UI, API, or trusted test utilities based on the scenario;
- choose an authentication strategy for read-only tests and tests that change data;
- use network mocking without skipping an integration the test needs to verify; and
- manage test data and cleanup so tests remain safe during parallel execution.

## Why this matters for QA

A test appears to fail on its first action, but the problem started during setup.

The customer may already have an order, another test may have changed the shared account, the authentication state may have expired, or cleanup from an earlier run may not have finished.

The locators and assertions may be correct. The scenario still fails because its required starting state was never prepared or controlled.

Manual QA test cases usually have clear preconditions: use a new customer, prepare an available product, or make sure no order exists.

Automation must turn those preconditions into repeatable setup instead of hoping the environment happens to be ready.

## The mental model

A reliable starting state usually contains several parts:

```text
Reliable scenario
    = a separate browser session
    + controlled test data
    + deliberate authentication
    + appropriate external dependencies
    + safe cleanup
```

Consider each part separately. A fresh browser context separates browser sessions, but data created by a test remains on the backend until the test manages or removes it.

When preparing the starting state, answer these questions:

| What needs to be decided?           | Example                                               |
| ----------------------------------- | ----------------------------------------------------- |
| What data is created for the test?  | One order created only for this test                  |
| How is the data created?            | Through a test API before UI interaction              |
| Which account does the test use?    | An account not used concurrently by another test      |
| Which dependencies remain real?     | Order service is real; notification service is mocked |
| What cleanup is required?           | Delete the order by the ID returned during setup      |
| What can collide with another test? | Account preferences or a fixed order reference        |

The setup method depends on what the test needs to verify.

Using the UI for setup is not automatically better or more realistic. If the UI is outside the behavior under test, an API or trusted test utility can be faster, clearer, and more reliable.

## Work through a realistic example

The requirement is:

> A customer can cancel their own submitted order and sees the order become canceled.

The behavior under test starts on the order detail page.

Registering a user, signing in, browsing products, and completing checkout are separate behaviors. Repeating all of them makes the cancellation test longer, slower, and harder to diagnose.

### 1. Define the starting state first

```text
Test data: one submitted order belonging to the test customer
Creation method: test API
Authentication: an account not used concurrently by another test
External dependency: order service remains real; notification delivery is not tested
Cleanup: delete only the order returned by setup
Parallel risk: account and order reference must not be shared with another test
```

### 2. Prepare only the data the scenario needs

```ts
test('customer cancels an owned order', async ({ page, request }) => {
  // The request client is test-scoped, but its order still exists on the backend.
  const response = await request.post('/api/test/orders', {
    data: { status: 'submitted', owner: 'current-test-customer' },
  });

  expect(response.ok()).toBe(true);
  const order: { id: string; reference: string } = await response.json();

  try {
    await page.goto(`/orders/${order.id}`);
    await expect(
      page.getByRole('heading', { name: `Order ${order.reference}` }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Cancel order' }).click();
    await expect(page.getByRole('status')).toHaveText('Order canceled');
  } finally {
    const cleanupResponse = await request.delete(
      `/api/test/orders/${order.id}`,
    );

    expect(cleanupResponse.ok() || cleanupResponse.status() === 404).toBe(true);
  }
});
```

Check that the setup API succeeds before using its response.

Use the returned `order.id` to open the correct order and delete that same record in `finally`. Cleanup accepts a successful response or `404`, so it remains safe if the order was already removed.

Use this approach only when the project already provides an authorized test-support endpoint or trusted utility and the `request` fixture uses the intended test identity.

Do not create an undocumented production backdoor only to make test setup faster.

### 3. Choose authentication based on the data the test changes

Reusing authentication state can make setup faster, but each test still uses the account's data on the backend.

| Scenario                                     | Safer approach                                                        |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Public or signed-out behavior                | Start without authentication state                                    |
| Read-only tests can safely share one account | Reuse prepared storage state                                          |
| Tests change account or backend data         | Use a different account for each worker or test                       |
| One scenario needs several roles             | Use a separate browser context and authentication state for each role |
| Login is the behavior under test             | Run the real sign-in flow in that scenario                            |

Authentication-state files can contain cookies or credentials that allow someone to use the test account's session.

Do not commit files such as `playwright/.auth/user.json`. Store them securely and recreate them when the session expires.

### 4. Use network mocking only when the scenario needs it

Suppose the application must show a fallback when the recommendation service is unavailable. Control its response with `503`:

```ts
await page.route('**/api/recommendations', async (route) => {
  await route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Unavailable' }),
  });
});

await page.goto('/store');
await expect(page.getByRole('status')).toHaveText(
  'Recommendations are temporarily unavailable',
);
```

Register `page.route()` before the request is sent.

This mock is useful because the scenario needs a condition that may be difficult to produce consistently in the environment.

Do not mock a service that is an important part of the integration under test.

For example, a checkout test with a fully mocked payment service cannot prove that the real payment integration works. Use the mock for the scenario that needs it and keep separate coverage for the real integration.

### 5. Clean up only data created by the test

Use the ID or reference returned when the test created its data.

Avoid broad cleanup such as **“delete all test orders”** because it can also delete data used by another test.

Cleanup should not be the only isolation mechanism. If the starting state depends on cleanup from an earlier run, an interrupted run can break the next one.

## When to use it—and when not to

Use the UI for setup when the setup flow is part of the behavior under test or when the project has no other trusted way to prepare that state.

If setup is outside the behavior under test, use an API or trusted test utility already available in the project.

Reuse authentication state when tests only read data or can safely use the same account concurrently.

A fresh browser context signed in with the same account still uses the same backend data. If a test changes a profile, preference, order, or other data, make sure another test does not use it at the same time.

Use network mocking to create conditions that are difficult to produce consistently, such as a service returning `503`. Do not mock the service whose integration the scenario needs to verify.

Create only the data needed by the scenario instead of relying on a large shared seed environment.

Truly read-only reference data can remain shared. Avoid real customer data, real credentials, or copies of production records.

Do not disable parallel execution only because several tests share a resource. Separate their accounts and test data first.

If a small group cannot run safely in parallel because a resource is constrained, run only that group serially and document why.

## When it fails

Starting-state problems often have recognizable patterns:

| What you see                                   | Likely cause                                                       | What to inspect                                    |
| ---------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| Passes alone but fails in parallel             | Several tests use the same account or mutable data                 | Account ID, record ID, worker, and request order   |
| First run passes but a later run fails         | Earlier data remains or cleanup did not finish                     | Setup result, created IDs, and environment data    |
| Many tests suddenly redirect to sign-in        | Authentication state is expired or invalid                         | Auth setup result, cookies, and server response    |
| Mocked-error test sometimes calls the real API | `page.route()` was registered too late or its pattern is wrong     | Network trace before navigation or action          |
| Setup succeeds but UI cannot find the data     | Wrong environment, delayed data, or setup did not actually succeed | Response body, environment URL, and created record |

Fix setup or test-data ownership first.

Do not add a sleep after setup unless the backend has a real asynchronous transition that must finish.

Do not retry data creation without control because duplicate records can accumulate.

If tests collide in parallel, do not immediately change the whole suite to one worker. First find the shared account or data.

When reviewing setup and test data, check:

- Does it assume a test API, account, credential, or cleanup endpoint without evidence?
- Does the setup prove it created the required record before the UI uses it?
- Which test or worker owns every mutable account and record?
- Could two parallel runs generate the same identity?
- Is stored authentication state committed, logged, or shared outside the authorized team?
- Does a mock remove the integration named by the test?
- Is the route installed before the request starts?
- Can cleanup delete data belonging to another test?
- Would a failed setup produce a clear failure or a misleading UI timeout?

Moving setup into a helper does not automatically make it safe or reliable. You still need to know what it creates, changes, and removes.

## Check your understanding

A test suite uses one saved admin account. A `beforeAll` hook creates one order, then three tests change that same order in different ways. An `afterAll` hook deletes the order.

The suite passes with one worker but fails during parallel execution or when an earlier run stops before cleanup finishes.

`beforeAll` and `afterAll` run for the worker that executes the tests in that scope. Tests in the same worker can still affect each other when they change the same data.

A worker restart or interrupted `afterAll` can also leave data behind for the next run.

Redesign the setup. Decide which data can remain shared, which data must be unique, when setup should run, and how cleanup should work.

## Compare your reasoning

One possible answer is:

- Do not let parallel tests change the same admin account and order.
- If a test changes account-level data, use a separate account for each worker or test as needed.
- Create the order needed by each test through an API or trusted test utility and keep the returned ID.
- Truly read-only catalog data can remain shared.
- Clean up each order by its returned ID and make cleanup safe when the order is already missing.
- Every test should run by itself without depending on data created by `beforeAll`.
- If cleanup from an earlier run does not finish, the next run remains safe because it creates data with a different ID or reference.

Not all data needs to be unique. Mutable data should not be shared by several tests without clear control.

## Before you continue

You should now be able to define the starting state a test needs, choose setup and authentication, control dependencies, and design cleanup that remains safe during parallel execution.

The next lesson starts from a failing test and traces the root cause through errors, traces, screenshots, network evidence, and other available information.

When the starting state is controlled, debugging becomes easier because fewer setup and test-data assumptions remain.
