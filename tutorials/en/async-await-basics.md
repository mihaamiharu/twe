---
title: 'Keep Asynchronous Test Steps in the Right Order'
description: 'Use promises, async, and await to preserve dependencies without confusing completed operations with proven outcomes.'
---

## After this lesson, you can

- explain what a promise represents and what an `async` function returns;
- place `await` on the asynchronous operation whose result the next step needs;
- distinguish waiting for an action from proving the application outcome;
- choose sequential or parallel execution based on dependency; and
- diagnose missing awaits and error handling that turns failures into false passes.

## Why this matters for QA

Some automation bugs look harmless:

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

The click promise is not awaited. The assertion can begin while the action is still in progress, and an error from the click may surface separately from the line that caused it.

Adding sleeps does not explain the dependency. QA needs to know which operation produces a result, which later step depends on it, and which separate evidence proves product success.

## The mental model

A `Promise` represents an asynchronous operation that will eventually settle:

```text
pending → fulfilled with a value
        ↘ rejected with an error
```

An `async` function always returns a promise. Inside that function, `await` pauses the function's progress until the awaited value settles. It does not freeze the browser or prove every side effect of the application.

`await` is therefore a dependency marker, not a time-based sleep. Put it on the operation whose completion the next line needs. Playwright actions, navigation, and assertions are also part of the test lifecycle, so keep them awaited: the runner must observe their completion or rejection. Start independent setup promises together only when parallel execution is intentional, then observe them with `Promise.all` so their failures remain part of the test.

![An asynchronous test awaits dependent setup and browser actions in sequence, then uses a separate assertion to prove the user outcome.](/images/tutorials/async-test-sequence.svg)

_Await the operation you depend on; assert the outcome you need to prove._

Classify common test expressions:

| Expression                      | Immediate or asynchronous? | What it gives you                                             |
| ------------------------------- | -------------------------- | ------------------------------------------------------------- |
| `page.getByRole(...)`           | Immediate                  | A locator description                                         |
| `locator.click()`               | Asynchronous               | Completion or failure of the Playwright action                |
| `page.goto(...)`                | Asynchronous               | Completion or failure of navigation according to its contract |
| `response.json()`               | Asynchronous               | Parsed response data                                          |
| `expect(locator).toBeVisible()` | Asynchronous               | A retried assertion result                                    |

The next step—not visual symmetry—decides where `await` belongs.

## Work through a realistic example

The test needs a controlled order before opening its detail page:

```ts
import { test, expect } from '@playwright/test';

test('customer can view a prepared order', async ({ page, request }) => {
  const response = await request.post('/api/test/orders', {
    data: {
      product: 'Mechanical Keyboard',
      quantity: 1,
    },
  });

  expect(response.ok()).toBeTruthy();

  const order = await response.json();

  await page.goto(`/orders/${order.id}`);

  await expect(
    page.getByRole('heading', { name: `Order ${order.id}` }),
  ).toBeVisible();
});
```

Trace the dependencies:

1. `request.post` must finish before the response can be checked.
2. `response.json()` must finish before `order.id` exists.
3. The ID is needed to build the navigation URL.
4. Navigation establishes the page where evidence will be observed.
5. The heading assertion separately proves the user-facing result.

Creating a locator does not start an asynchronous browser operation:

```ts
const heading = page.getByRole('heading', { name: `Order ${order.id}` });
await expect(heading).toBeVisible();
```

The locator is a description. The web assertion is the asynchronous work.

### Action completion is not business completion

This line waits for Playwright to perform the click:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
```

It does not automatically prove that the backend accepted the order or that the confirmation UI appeared. Keep the assertion:

```ts
await expect(
  page.getByRole('heading', { name: 'Order confirmed' }),
).toBeVisible();
```

## When to use it—and when not to

Run operations sequentially when one produces the state or value required by the next. Most user flows are intentionally sequential: fill required data, submit, then observe the result.

Independent setup may run together:

```ts
const [customer, product] = await Promise.all([
  createCustomer(request),
  createProduct(request),
]);
```

Use `Promise.all` only after confirming neither operation depends on the other or competes for the same mutable state. It rejects if any included promise rejects.

Do not place dependent UI actions in `Promise.all`:

```ts
// Wrong: submission depends on the fields being filled.
await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

The email fill must finish before the submit click begins.

Do not add `await` to ordinary values merely to make code look consistent. Trace the returned value instead.

## When it fails

Suppose this test sometimes fails before the click finishes:

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Inspect the first failing or missing dependency:

1. Does the first expression return a promise?
2. Does the assertion depend on that action completing?
3. Is an unhandled rejection reported elsewhere in the output?
4. Is the product outcome itself slow, or did the action never complete?

Repair the dependency:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

If the assertion still fails, investigate the product outcome. Do not replace it with `waitForTimeout`.

Be equally careful with `try/catch`:

```ts
try {
  await createTestOrder();
} catch {
  // ignored
}
```

This can let the test continue with invalid setup. Catch only when recovery is intentional or when you add context and rethrow:

```ts
try {
  await createTestOrder();
} catch (error) {
  throw new Error('Could not create the controlled test order', {
    cause: error,
  });
}
```

Trace every asynchronous line in the test:

- What value or state does this promise produce?
- Which later step depends on it?
- Is `await` missing from an action, navigation, data parse, or assertion?
- Is `await` being added to a locator or ordinary value with no purpose?
- Are dependent UI actions incorrectly placed in `Promise.all`?
- Does a catch block hide setup or product failure?
- After the action settles, what assertion still proves the business outcome?

If you cannot describe the guarantee, do not trust the sequence yet.

## Check your understanding

Review this code:

```ts
const orderPromise = createTestOrder();

await page.goto(`/orders/${orderPromise.id}`);

await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

Explain:

1. Why is `orderPromise.id` wrong?
2. Which operation must finish before navigation?
3. Why are the fill and click not safe to parallelize?
4. What assertion is still needed after submission?

## Compare your reasoning

One reasonable answer is:

- `createTestOrder()` returns a promise, not the resolved order object, so the ID is not available yet.
- Use `const order = await createTestOrder()` before building the URL.
- Submission depends on the required email already being filled. Running both operations together creates a race.
- After the sequential click, assert the product's intended confirmation, navigation, or other observable evidence.

## Before you continue

You should now be able to trace promises through a test, await genuine dependencies, keep independent setup separate from sequential UI behavior, and preserve an assertion after the action.

Complete the async Core Practice by awaiting controlled setup data. The error-handling and parallel-execution challenges are optional follow-up; they do not turn retries or concurrency into defaults. The final lesson in this module will add TypeScript review literacy so editor confidence does not get confused with runtime evidence.
