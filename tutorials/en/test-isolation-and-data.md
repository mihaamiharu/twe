---
title: 'Build a Controlled Starting State'
description: 'Design explicit ownership for test data, authentication, dependencies, cleanup, and parallel execution.'
---

## After this lesson, you can

- describe a test’s complete starting-state contract;
- choose UI, API, or trusted test utilities for setup according to the risk;
- select a safe authentication-state strategy for read-only and state-changing tests;
- use network mocking without removing the integration being tested; and
- identify data ownership and cleanup designs that remain safe in parallel.

## Why this matters for QA

Some flaky tests fail before the first visible action. The customer already has an order, the shared account was changed by another worker, an authentication file expired, or yesterday’s cleanup did not run.

The test code may look correct because its locator and assertion describe the UI accurately. The hidden problem is that the scenario never owned its starting state.

Manual QA test cases usually contain preconditions: use a new customer, prepare an available item, or ensure no order exists. Automation must turn those preconditions into repeatable setup—not hope that the environment happens to be ready.

## The mental model

Treat the starting state as a contract with several owners:

```text
Reliable scenario
    = isolated browser session
    + owned server-side data
    + deliberate authentication
    + controlled external dependencies
    + safe cleanup and collision strategy
```

These are separate boundaries. A fresh browser context isolates client-session state, but a record created by setup remains shared server-side state until the test gives it an owner and a cleanup plan.

A useful state contract answers:

| State question                | Example answer                                      |
| ----------------------------- | --------------------------------------------------- |
| What data does this own?      | One order created only for this test                |
| How is it created?            | A supported test API before UI interaction          |
| Who is authenticated?         | A worker-safe customer account                      |
| Which dependencies are real?  | Order service is real; notification service is fake |
| What cleanup is required?     | Delete the owned order by returned ID               |
| What can collide in parallel? | Account preferences and fixed order references      |

The correct setup layer depends on what the test is trying to prove. Setup is not automatically more realistic because it uses more UI.

## Work through a realistic example

The requirement is:

> A customer can cancel their own submitted order and sees the order become canceled.

The behavior under test begins on the order detail page. Registering a user, signing in, browsing products, and completing checkout are separate risks. Repeating all of them would make cancellation slow and difficult to diagnose.

### 1. Write the state contract first

```text
Owned data: one submitted order belonging to the test customer
Creation method: supported test API
Authentication: worker-safe customer state
External dependencies: real order service; notification delivery is not asserted
Cleanup: delete only the returned order ID; tolerate already-deleted data
Parallel collision risk: account and order reference must not be shared
```

### 2. Create only the required server state

```ts
test('customer cancels an owned order', async ({ page, request }) => {
  // The request client is test-scoped; the order it creates is not magically isolated on the server.
  const response = await request.post('/api/test/orders', {
    data: { status: 'submitted', owner: 'current-test-customer' },
  });

  expect(response.ok()).toBe(true);
  const order: { id: string; reference: string } = await response.json();

  await page.goto(`/orders/${order.id}`);
  await expect(
    page.getByRole('heading', { name: `Order ${order.reference}` }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Cancel order' }).click();
  await expect(page.getByRole('status')).toHaveText('Order canceled');
});
```

The API response is checked before its data is used. The order ID returned by setup identifies exactly which record the UI should display and later clean up.

This pattern assumes the application provides an authorized test-support endpoint and that the `request` fixture is configured for the intended test identity. Do not create undocumented production backdoors merely to make tests shorter.

### 3. Choose an authentication strategy from mutation risk

Reusing authenticated browser state can make setup faster, but the account behind it still exists on the server.

| Scenario                                               | Safer direction                                            |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| Public or signed-out behavior                          | Start with empty browser state                             |
| Many read-only tests can use one account concurrently  | Reuse one prepared storage state                           |
| Tests modify account-level or shared server-side state | Allocate separate accounts per worker or per test          |
| One scenario contains several roles                    | Use separate contexts and states for each role             |
| Authentication itself is the behavior under test       | Perform the real sign-in flow inside that focused scenario |

Stored authentication state can contain sensitive cookies and headers capable of impersonating the test account. Keep files such as `playwright/.auth/user.json` out of version control, restrict access, and regenerate expired state securely.

### 4. Control the network only when it serves the scenario

Suppose the product must show a useful fallback when recommendations are unavailable. A controlled 503 response is appropriate:

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

Register the route before the request can begin. The mock makes the rare dependency response deliberate.

But a fully mocked payment flow cannot prove that the real checkout integration works. Keep at least the integration named by the test real, and document what the mock removes from coverage.

### 5. Clean up only what the test owns

Cleanup should use the returned record identity and be safe if the record was already removed. Avoid broad operations such as “delete all test orders,” which can erase data owned by another worker.

Cleanup is a safety net, not the only isolation mechanism. If setup depends on yesterday’s cleanup having completed, an interrupted run can poison the next one.

## When to use it—and when not to

Use UI setup when the setup flow itself is part of the behavior or when no trusted lower-level setup surface exists. Use API calls or owned test utilities for preconditions outside the scenario’s risk.

Use shared authenticated state only when concurrent tests cannot interfere through that account. A fresh context loading the same account does not make its server-side settings unique.

Use network interception to create a deliberate dependency response, remove nondeterminism outside the integration under test, or reproduce a rare error. Do not mock the component whose real integration the test claims to verify.

Prefer unique, minimal data over large reusable seed environments. Reuse immutable reference data when it truly is read-only. Avoid production personal data, real credentials, and copied customer records.

Do not disable all parallelism because one group shares a constrained resource. First isolate accounts and data; if a small, documented group cannot safely run concurrently, constrain that group intentionally.

## When it fails

Common state failures leave recognizable evidence:

| Observation                                      | Likely state problem                                          | Evidence to inspect                            |
| ------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------- |
| Passes alone, fails in parallel                  | Shared account or record collision                            | IDs, worker identity, request timeline         |
| First run passes, later local runs fail          | Persistent server data or incomplete cleanup                  | Setup response, owned IDs, environment records |
| Every test suddenly redirects to sign-in         | Expired or invalid authentication state                       | Auth setup result, cookies, server response    |
| Mocked error test sometimes reaches the real API | Route registered too late or URL pattern mismatched           | Network trace before navigation/action         |
| Setup reports success but UI cannot find data    | Wrong environment, delayed backend state, or weak setup check | Response body, environment URL, record query   |

Fix the ownership or setup contract. Do not add a sleep after setup without evidence of an actual asynchronous state transition. Do not retry data creation until duplicate records accumulate. Do not hide collisions by changing all tests to one worker.

## Review generated work

Review generated setup and data code with these questions:

- Did it invent a test API, account, credential, or cleanup endpoint?
- Does the setup prove it created the required record before the UI uses it?
- Which test or worker owns every mutable account and record?
- Could two parallel runs generate the same identity?
- Is stored authentication state committed, logged, or exposed to AI?
- Does a mock remove the integration named by the test?
- Is the route installed before the request starts?
- Can cleanup delete data belonging to another test?
- Would a failed setup produce a clear failure or a misleading UI timeout?

Generated setup is not safe merely because it is hidden in a helper. You still need to understand its authority and side effects.

## Check your understanding

A suite uses one saved admin account. A `beforeAll` hook creates one order, three tests update that order in different ways, and an `afterAll` hook deletes it. The suite passes with one worker but fails in parallel or after an interrupted run.

`beforeAll` and `afterAll` are scoped to the relevant worker process, not a universal suite-wide boundary. They can still create state shared by several tests in that worker, and a worker restart or interrupted cleanup can leave that state behind.

Redesign its state contract. Decide what can remain shared, what must become unique, where setup should happen, and how cleanup should behave.

## Compare your reasoning

One reasonable answer is:

- Do not let parallel tests mutate one admin account and one order.
- Give each worker or test an appropriate account if account-level state changes.
- Create the required order per test through a supported API or test utility and retain its returned ID.
- Keep immutable catalog data shared only if tests cannot modify it.
- Clean up each owned order by ID with an idempotent operation.
- Make each test runnable alone instead of relying on `beforeAll` side effects.
- Treat an interrupted cleanup as recoverable because the next run creates unique owned data.

The goal is not zero shared infrastructure. The goal is zero ambiguous ownership of mutable state.

## Before you continue

You should now be able to write a complete state contract and choose setup, authentication, dependency, and cleanup strategies that remain understandable under parallel execution.

The next lesson starts from a failure and works backward through evidence. Controlled state gives that investigation a trustworthy baseline: if a test still fails, fewer hidden assumptions remain.
