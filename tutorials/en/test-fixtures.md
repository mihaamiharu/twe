---
title: 'Make Fixture Setup, Scope, and Cleanup Easy to Trace'
description: 'Choose a helper, hook, or fixture based on the resource a test needs, when it is created, who uses it, and who cleans it up.'
---

## After this lesson, you can

- explain which resources Playwright fixtures provide and when their setup runs;
- choose between a helper, a hook, and a custom fixture;
- trace setup before `await use(...)`, the value passed to the test, and teardown afterward;
- use test scope as the default for mutable state; and
- diagnose hidden setup, incorrect scope, and cleanup failures.

## Why this matters for QA

Tests need more than the steps shown in the scenario. They may need a browser page, a signed-in user, their own test data, an API client, and cleanup. If all of that setup is hidden in a large `beforeEach`, a test can fail before its first line runs. It also becomes harder to see which setup failed or run the test by itself.

Fixtures give names to the resources a test needs. A test can request a fixture directly, and the fixture can clean up its resource according to its scope. A fixture is not always clearer than a helper, though. A poorly designed fixture can hide an important action, make several tests share mutable state, and turn a simple test into a small framework.

This matters in an agent-assisted workflow too. A coding agent can generate a fixture quickly, but QA still needs to verify that its setup, scope, and cleanup match the scenario being tested.

Before creating a fixture, ask when the resource is created, which test or worker may change it, and who cleans it up.

## The mental model

Read a custom fixture in the order its resource is created, used, and cleaned up:

```text
Required dependencies
        ↓
Setup and verify the resource
        ↓
await use(value) ── value is passed to the test or another fixture
        ↓
Teardown the resource

Scope decides whether this sequence runs per test or per worker.
```

![A fixture lifecycle resolves declared dependencies, performs verified setup, hands a value to the test through use, and tears it down according to test or worker scope.](/images/tutorials/fixture-lifecycle-ownership.svg)

_Code before `await use(...)` performs setup. Code after it performs teardown. Scope determines whether the resource belongs to one test or one worker._

Playwright’s built-in fixtures already follow this model:

| Built-in fixture | What it provides                                      | Typical scope |
| ---------------- | ----------------------------------------------------- | ------------- |
| `page`           | An isolated browser page for the test                 | Test          |
| `context`        | An isolated browser context for the test              | Test          |
| `request`        | An API request context                                | Test          |
| `browser`        | The browser instance used to create contexts or pages | Worker        |
| `browserName`    | The current project’s browser engine name             | Worker        |

Fixtures are set up on demand. An unused non-automatic fixture does no work.

## Work through a realistic example

Several checkout tests need their own cart and a page opened to that cart. A large hook could create both and store the ID in an outer variable, but the test would no longer show where the cart came from or who must delete it.

Start by naming the value the test receives:

```ts
type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
};
```

Then define how the cart is created and cleaned up:

```ts
import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout-page';

export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page, request }, use) => {
    const createResponse = await request.post('/api/test/carts', {
      data: { items: [{ sku: 'NOTEBOOK', quantity: 1 }] },
    });

    if (!createResponse.ok()) {
      throw new Error(`Cart setup failed: ${createResponse.status()}`);
    }

    const cart: { id: string } = await createResponse.json();

    try {
      const checkoutPage = new CheckoutPage(page, cart.id);
      await checkoutPage.open();

      await use(checkoutPage);
    } finally {
      const deleteResponse = await request.delete(`/api/test/carts/${cart.id}`);
      if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
        throw new Error(`Cart cleanup failed: ${deleteResponse.status()}`);
      }
    }
  },
});

export { expect };
```

This example assumes an authorized test-support API exists. Do not invent a production backdoor merely to support a fixture.

Read the code in execution order:

1. `checkoutPage` declares dependencies on `page` and `request`.
2. Setup creates one cart and checks the response before using its ID.
3. The fixture opens a page for that owned cart.
4. `await use(checkoutPage)` hands the value to the test.
5. A `finally` block deletes only the cart this fixture created, even if the page fails to open or the test fails while using it.

The test makes the dependency visible in its parameters:

```ts
test('customer sees the updated order total', async ({ checkoutPage }) => {
  await checkoutPage.setQuantity('Notebook', 2);

  await expect(checkoutPage.total()).toHaveText('$40.00');
});
```

The fixture prepares the cart and cleans it up. The customer action and expected result remain visible in the test. Once setup has the ID of a created resource, put cleanup in `finally` so the fixture still attempts to remove it when later setup or the test fails.

### Check whether you need a fixture

| Need                                                     | Usually start with  | Why                                                |
| -------------------------------------------------------- | ------------------- | -------------------------------------------------- |
| One calculation or repeated action with no lifecycle     | Helper              | A normal function is explicit and easy to call     |
| Same small action before every test in one visible group | `beforeEach` hook   | Shared timing is simple and local to the group     |
| A named value/resource with setup and teardown           | Fixture             | The test requests the resource directly            |
| Several resources that depend on each other              | Fixtures            | Setup and reverse teardown follow dependency order |
| A business step important to only one scenario           | Keep it in the test | The action and expected result stay visible        |

A small hook near a clearly named test group can be easier to read than a custom fixture that provides no value and performs no cleanup.

## When to use it—and when not to

Use built-in fixtures directly until the suite repeatedly creates and cleans up the same kind of resource. Most beginner tests need only `page`, and some also need `request`.

Use a helper for an ordinary action without its own setup and cleanup. Use a hook when every test in a nearby, clearly named group needs the same action at the same time. Use a custom fixture when a test needs a named resource that must be created, cleaned up, combined with other fixtures, or configured.

Use test scope by default for pages, contexts, mutable records, and scenario-specific data. Each test receives a fresh resource, so it can run alone or in parallel.

Use worker scope only when several tests in one worker can safely use the resource without changing the same state. Do not share a resource only because setup is slow or expensive. A mutable customer, cart, or database transaction can still collide even when each test has a separate browser context.

Do not hide the action being tested inside a fixture. A `paidOrder` fixture may be appropriate when payment is only the starting state for a refund test. If the scenario tests payment itself, keep the payment action and expected result in the test.

## When it fails

| Observation                                     | Likely problem                         | Check first                                               |
| ----------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Test fails before its first line                | Fixture setup failed or leaked state   | Fixture stack, API response, retained ID, cleanup attempt |
| Tests pass alone but fail in parallel           | Several tests change the same resource | Resource IDs, worker index, account, and changed records  |
| Later tests fail after one earlier failure      | Cleanup or hidden state leaked         | Teardown result, retained IDs, server records             |
| Every test performs slow setup it does not need | Automatic hook/fixture is too broad    | Which tests actually request the dependency               |
| Test title says little about how state appeared | Fixture hides a business step          | Fixture code before `use` and the scenario’s stated risk  |
| Timeout points at an innocent test action       | Slow fixture consumed the test timeout | Setup duration, fixture timeout, earliest failure         |

Fixture setup and the test body share the test timeout. Teardown and `afterEach` receive a separate timeout budget of the same duration after the test body finishes. Measure setup and teardown before increasing either timeout.

If fixtures depend on so many other fixtures that the order is hard to follow, draw the dependency order. Setup starts with the earliest dependency, and teardown runs in reverse. Fix circular dependencies or unclear resource sharing before adding more fixture layers.

## Review AI-assisted work

Review AI-generated fixtures as infrastructure with side effects:

- What value or resource does each fixture provide?
- Which dependencies trigger it, and is it lazy or automatic?
- What happens before and after `await use(...)`?
- Is setup verified before the value reaches the test?
- Which test or worker may change every mutable record and account?
- Can cleanup delete another test’s data?
- Does the fixture hide an action the scenario is meant to test?
- Is test scope sufficient?
- Could a helper or small hook be clearer?
- Did generated code invent endpoints, credentials, storage state, or global variables?

Pay special attention to code after `await use(...)`. Generated examples often demonstrate setup and forget cleanup, error handling, or listener removal.

## Check your understanding

A generated suite has a worker-scoped `sharedCustomerPage` fixture. It signs in once, creates one cart, and gives the same page to all tests. Tests change addresses, quantities, and payment methods. The author chose worker scope because login is slow.

What is unsafe? Name the owner, scope, and cleanup path for the cart, account, page, and authentication mechanics. Which parts could remain shared or become a helper?

## Compare your reasoning

One reasonable redesign is:

- Never share one `Page` or `BrowserContext` across parallel tests; keep them test scoped.
- Do not let several tests change one cart or the same customer settings.
- Allocate a unique cart per test and an account per test or worker according to the state each scenario mutates.
- Keep immutable reference data or a safely worker-owned service in worker scope only if parallel tests cannot corrupt it.
- Move simple sign-in mechanics to a helper, or load safe authenticated state into each fresh context when authentication is not under test.
- Keep setup errors and cleanup results easy to find instead of placing them in a broad hidden hook.

Slow setup affects execution time. Shared mutable state can make one test change another test's data. Fix those problems separately.

## Before you continue

You should now be able to choose a helper, hook, or fixture and show which resource it creates, which test or worker uses it, which scope it has, and how cleanup runs.

The next lesson covers Playwright configuration. Fixtures manage resources used by tests, while configuration decides which test files are found, how tests run, and which project variants are available.
