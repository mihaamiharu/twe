---
title: 'Review TypeScript Without Mistaking Types for Proof'
description: 'Use TypeScript to make test contracts visible while keeping runtime data and product behavior under test.'
---

## After this lesson, you can

- read inferred types, explicit annotations, unions, and optional properties in test code;
- read a TypeScript error as a mismatch in the test code's contract;
- choose where an explicit type makes a QA contract easier to review;
- narrow an optional value with a runtime guard instead of an unsafe cast;
- explain why a TypeScript type cannot validate an API response or product outcome, and review generated test code for `any`, unsafe assertions, and misleading confidence.

## Why this matters for QA

A generated test can show no red editor warnings and still fail immediately:

```ts
const password = process.env.TEST_PASSWORD as string;
await page.getByLabel('Password').fill(password);
```

`as string` tells TypeScript to trust the author. It does not create a missing environment variable at runtime.

The same problem appears with API data. A cast can claim the server returned an order, even when the actual response is an error page or a different JSON shape.

TypeScript is valuable because it makes intended data contracts visible and catches many code mistakes early. QA still needs to know where that confidence ends.

## The mental model

TypeScript adds a compile-time review layer:

```text
Source code + type information
            ↓
Type checking finds incompatible uses
            ↓
Types are removed when code becomes JavaScript
            ↓
Runtime data and product behavior still need evidence
```

Think in two boundaries:

| Boundary                 | Useful question                                                                  |
| ------------------------ | -------------------------------------------------------------------------------- |
| Inside trusted test code | Are values used consistently with the intended contract?                         |
| Data entering at runtime | Did the environment, API, file, or product actually provide the value we expect? |

TypeScript can help with the first. A runtime check, controlled setup, or assertion is needed for the second.

Read a TypeScript error as a mismatch in the test code's contract: what type does this value have, what type does the next API expect, and what assumption is missing? Fix that mismatch or make the assumption explicit. Removing the warning with `any` or an assertion is not evidence that the test is safer.

## Work through a realistic example

The checkout suite uses a controlled case:

```ts
type CheckoutCase = {
  productName: string;
  quantity: number;
  expectedResult: 'success' | 'out-of-stock';
  couponCode?: string;
};

const checkoutCase: CheckoutCase = {
  productName: 'Mechanical Keyboard',
  quantity: 1,
  expectedResult: 'success',
};
```

Read what the type communicates:

- `productName` must be used as a string inside typed code;
- `quantity` is numeric;
- the union allows only two documented result labels; and
- `couponCode?` may be absent.

This improves review. It does not prove the product exists, the inventory is controlled, or checkout will succeed.

### Prefer inference for obvious local values

```ts
const quantity = 2; // inferred as number
const productNames = ['Mouse', 'Keyboard']; // inferred as string[]
```

Repeating `: number` and `: string[]` adds little here. Explicit types are most useful at boundaries such as shared test data, helper inputs and outputs, configuration, API models, and custom fixtures.

### Narrow optional runtime values

Environment variables can be missing:

```ts
const password = process.env.TEST_PASSWORD;

if (!password) {
  throw new Error('TEST_PASSWORD is required for the login scenario');
}

await page.getByLabel('Password').fill(password);
```

The guard does two jobs. It produces an honest runtime failure and narrows the TypeScript type from `string | undefined` to `string` afterward.

Compare the unsafe shortcut:

```ts
const password = process.env.TEST_PASSWORD as string;
```

The cast silences the warning without adding evidence.

### Treat external data as unknown until checked

```ts
type OrderResponse = {
  id: string;
  status: 'created';
};

const body = (await response.json()) as OrderResponse;
```

This cast does not validate the response. For critical runtime data, use the project's schema validator or explicit checks before relying on it. A small check could begin like this:

```ts
const body: unknown = await response.json();

if (
  typeof body !== 'object' ||
  body === null ||
  !('id' in body) ||
  typeof body.id !== 'string'
) {
  throw new Error('Order response did not contain a string id');
}

const orderId = body.id;
```

Larger response contracts belong in a maintained runtime schema, not a growing pile of inline checks.

## When to use it—and when not to

Use inference for obvious local values. Add explicit types where a boundary or reusable contract benefits from review: helper parameters, shared case data, fixtures, configuration, and supported API shapes.

Use a union when a value should come from a small documented set. Use an optional property only when absence is a valid state—not because the author is unsure whether data exists.

Avoid `any` when reviewing code. It disables useful checking around that value. Prefer `unknown` for untrusted data because it requires evidence before use.

Do not annotate every variable or design a complex type system for a small test. Type complexity has maintenance cost too.

Do not expect the Playwright test command to perform complete project type checking. Playwright can transform and run TypeScript, but a separate compiler check should run locally or in CI:

```bash
npx tsc -p tsconfig.json --noEmit
npx playwright test
```

Use the repository's configured scripts when they differ.

## When it fails

Suppose the editor accepts this code:

```ts
type User = { email: string };

const user = (await response.json()) as User;
await page.getByText(user.email).click();
```

At runtime, `user.email` is `undefined` because the response was `{ "error": "unauthorized" }`.

Diagnose the boundary:

1. What did the response status and body actually contain?
2. Which line claimed a type without checking the value?
3. Should test setup authenticate first or fail on the response status?
4. Which runtime validation is appropriate for this data?
5. What user-visible outcome still needs an assertion afterward?

Changing the cast to `as unknown as User` only hides the problem more thoroughly. Adding `any` removes feedback instead of repairing the contract.

Fix the setup and validate the runtime response before consuming its fields.

## Review generated work

Review generated TypeScript with two passes.

First, inspect the type contract:

- Are shared data and helper boundaries typed clearly?
- Are unions and optional properties based on real product rules?
- Is inference used where the value is already obvious?
- Did AI introduce unnecessary interfaces or generics?

Then inspect runtime honesty:

- Is `any` disabling checking?
- Does `as` claim that untrusted data has a shape without validation?
- Are environment variables forced to strings without a guard?
- Could optional chaining hide required missing data?
- Do runtime assertions still prove the product outcome?

Clean types are useful maintenance evidence. They are not a substitute for a meaningful test result.

## Check your understanding

### Read a concrete compiler error

Review this small mismatch:

```ts
type CheckoutCase = {
  quantity: number;
};

const checkoutCase: CheckoutCase = {
  quantity: 'two',
};
```

Explain:

1. What type does `CheckoutCase.quantity` require?
2. What contract mismatch should TypeScript report?
3. How would you repair it without using `any` or a cast?

The useful diagnostic is `Type 'string' is not assignable to type 'number'`. If this scenario is already numeric, change the value to `2`. If it came from text such as an input, convert and validate that text at the runtime boundary before storing it in the typed case.

### Review runtime evidence

Review this code:

```ts
type TestUser = {
  email: string;
  role: 'customer' | 'admin';
};

const response = await request.get('/api/test-user');
const user = (await response.json()) as TestUser;

await expect(page.getByText(user.email)).toBeVisible();
```

Explain:

1. What useful contract does `TestUser` communicate?
2. What does the cast fail to prove?
3. Which status or runtime data checks are missing?
4. What does the final assertion prove—and what does it not prove?

## Compare your reasoning

One reasonable answer is:

- `CheckoutCase.quantity` requires a number, but `'two'` is a string. Use `2` for a numeric test case, or convert and validate a text value before it enters the typed case. Silencing the diagnostic would hide the contract mismatch.
- The type documents that trusted test code expects an email string and one of two supported roles.
- The cast does not prove the endpoint returned that shape. It only instructs TypeScript to treat the value as `TestUser`.
- Check the response status and validate the critical fields with the project's runtime validation approach before using them.
- The assertion proves that text equal to the resulting email becomes visible. It does not prove the response was valid, the displayed user has the expected role, or the broader scenario succeeded unless those are also observed.

## Before you continue

You should now be able to read and repair a simple TypeScript compiler error, read a small test contract, distinguish inference from useful annotations, guard optional runtime values, and challenge unsafe casts in generated code.

Module 3 is complete when you have finished its four Core lessons and three focused Core Practice challenges: the first observable Playwright test, the QA-focused JavaScript case, and the asynchronous setup task. The mapped TypeScript exercises are Additional Practice because the current runner can observe their runtime result, but cannot by itself prove compiler diagnostics or runtime data validity.

You are ready for Module 4, where the role, accessible name, DOM context, code literacy, and runtime evidence from the first three modules come together in reliable locator decisions.
