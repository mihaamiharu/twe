---
title: 'Make Test Dependencies and Lifecycles Explicit'
description: 'Choose helpers, hooks, and fixtures deliberately, then make setup, ownership, scope, and cleanup easy to trace.'
---

## After this lesson, you can

- explain what Playwright fixtures provide and when they are created;
- choose between a helper, a hook, and a custom fixture;
- read a fixture as setup, value handoff, test use, and teardown;
- keep test-scoped state as the safe default; and
- diagnose hidden setup, incorrect scope, and cleanup failures.

## Why this matters for QA

Tests depend on more than visible steps. They need a browser page, an authenticated identity, owned data, perhaps an API client, and sometimes cleanup. If those dependencies are hidden in a large `beforeEach`, a failing scenario may be difficult to understand or run by itself.

Fixtures make dependencies named and composable. They can give each test only the resources it asks for and clean those resources up according to scope. But a fixture is not automatically clearer than a helper. Poorly designed fixtures can hide business steps, create shared mutable state, and make a simple test feel like a framework.

The QA question is not “Can this become a fixture?” It is “Which lifecycle and ownership does this dependency require?”

## The mental model

Read every custom fixture as a lifecycle contract:

```text
Declared dependencies
        ↓
Setup and verify the resource
        ↓
await use(value) ── test or dependent fixture runs
        ↓
Teardown the resource

Scope decides how often this lifecycle exists.
```

![A fixture lifecycle resolves declared dependencies, performs verified setup, hands a value to the test through use, and tears it down according to test or worker scope.](/images/tutorials/fixture-lifecycle-ownership.svg)

_Before `await use(...)` is setup. After it returns is teardown. Scope decides the owner and lifetime._

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

Several checkout tests require an owned cart and a page opened to that cart. A large hook could create both and place IDs in outer variables, but the dependency would be implicit.

Start by naming the resource the test needs:

```ts
type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
};
```

Then define its lifecycle:

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

Read the code in lifecycle order:

1. `checkoutPage` declares dependencies on `page` and `request`.
2. Setup creates one cart and checks the response before using its ID.
3. The fixture opens a page for that owned cart.
4. `await use(checkoutPage)` hands the value to the test.
5. A `finally` block deletes only the cart this fixture created, even if opening the page or using the fixture fails.

The test makes the dependency visible in its parameters:

```ts
test('customer sees the updated order total', async ({ checkoutPage }) => {
  await checkoutPage.setQuantity('Notebook', 2);

  await expect(checkoutPage.total()).toHaveText('$40.00');
});
```

The fixture owns preconditions and cleanup. The test still owns the product action and evidence it claims to verify. Once setup has an owned resource ID, put its cleanup in `finally`; otherwise a setup failure before `use` can leak state without ever reaching the test.

### Decide whether a fixture is actually needed

| Need                                                     | Usually start with  | Why                                                |
| -------------------------------------------------------- | ------------------- | -------------------------------------------------- |
| One calculation or repeated action with no lifecycle     | Helper              | A normal function is explicit and easy to call     |
| Same small action before every test in one visible group | `beforeEach` hook   | Shared timing is simple and local to the group     |
| A named value/resource with setup and teardown           | Fixture             | Dependency and lifecycle become explicit           |
| Several resources that depend on each other              | Fixtures            | Setup and reverse teardown follow dependency order |
| A business step important to only one scenario           | Keep it in the test | Hiding it would weaken the scenario’s story        |

Hooks are not obsolete. A small visible hook can be clearer than a custom fixture that provides no value and has no meaningful lifecycle.

## When to use it—and when not to

Use built-in fixtures directly until the suite has a repeated resource or lifecycle worth naming. Most beginner tests need only `page`, and some need `request`.

Use a helper when the code is simply an operation. Use a hook when every test in a nearby, clearly named group needs the same timing. Use a custom fixture when a test consumes a named dependency that needs setup, teardown, composition, or configurable behavior.

Prefer test scope for pages, contexts, mutable records, and scenario-specific data. Each test receives a fresh lifecycle, which supports independence and parallel execution.

Use worker scope only when one worker can safely own the resource for several tests. Expensive does not automatically mean shareable. A mutable customer, cart, or database transaction can still collide even when browser contexts are isolated.

Do not hide the behavior under test inside a fixture. A `paidOrder` fixture may be appropriate when payment is only a precondition for a refund test; it is inappropriate when the scenario claims to verify payment itself.

## When it fails

| Observation                                     | Likely lifecycle problem               | First evidence to inspect                                |
| ----------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| Test fails before its first line                | Fixture setup failed or leaked state   | Fixture stack, API response, retained ID, cleanup attempt |
| Tests pass alone but fail in parallel           | Worker/shared mutable state            | Resource IDs, worker index, account and record ownership |
| Later tests fail after one earlier failure      | Cleanup or hidden state leaked         | Teardown result, retained IDs, server records            |
| Every test performs slow setup it does not need | Automatic hook/fixture is too broad    | Which tests actually request the dependency              |
| Test title says little about how state appeared | Fixture hides a business step          | Fixture code before `use` and the scenario’s stated risk |
| Timeout points at an innocent test action       | Slow fixture consumed the test timeout | Setup duration, fixture timeout, earliest failure        |

Fixture setup and teardown contribute to execution time. A long fixture may consume the test timeout before the scenario reaches its assertion. Measure the lifecycle before increasing timeouts.

If fixture dependencies form a deep graph, draw the graph. Setup occurs dependency-first; teardown occurs in reverse. A cycle or unclear ownership is a design problem, not something to hide with more fixture layers.

## Review generated work

Review AI-generated fixtures as infrastructure with side effects:

- What value or resource does each fixture provide?
- Which dependencies trigger it, and is it lazy or automatic?
- What happens before and after `await use(...)`?
- Is setup verified before the value reaches the test?
- Which test or worker owns every mutable record and account?
- Can cleanup delete another test’s data?
- Does the fixture hide an action the scenario claims to test?
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
- Do not let several tests mutate one cart or customer-level settings without explicit ownership.
- Allocate a unique cart per test and an account per test or worker according to the state each scenario mutates.
- Keep immutable reference data or a safely worker-owned service in worker scope only if parallel tests cannot corrupt it.
- Move simple sign-in mechanics to a helper, or load safe authenticated state into each fresh context when authentication is not under test.
- Keep setup failures and cleanup results observable instead of placing them in a broad hidden hook.

Slow setup is a performance concern. Shared mutable state is a correctness concern. Solve them separately.

## Before you continue

You should now be able to choose a helper, hook, or fixture and explain the dependency, owner, scope, setup, and cleanup of every resource it introduces.

The next lesson moves one level outward. Fixtures describe resources used by tests; Playwright configuration describes the policy under which the suite discovers, runs, and varies those tests.
