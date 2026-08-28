---
title: 'Use TypeScript to Catch Test-Code Mistakes Earlier'
description: 'Use TypeScript to make test-data and helper contracts visible before runtime while keeping external data and product behavior under test.'
---

## After this lesson, you can

- explain how TypeScript adds static checking on top of JavaScript's dynamic runtime;
- read inferred types, explicit annotations, unions, and optional properties in test code;
- choose where an explicit type makes shared test data or a helper contract easier to review;
- repair a type mismatch without hiding it behind `any` or an unsafe cast; and
- separate compile-time feedback from runtime validation and product evidence.

## Why this matters for QA

JavaScript is enough to write and run Playwright tests. TypeScript becomes useful when a growing suite shares test data, helpers, fixtures, configuration, and API models.

JavaScript is dynamically typed. Values have types at runtime, but a variable or function parameter is not automatically restricted to one type:

```js
const checkoutCase = {
  quantity: '2',
  expectedResult: 'sucess',
};

function nextQuantity(quantity) {
  return quantity + 1;
}

nextQuantity(checkoutCase.quantity); // '21', not 3
```

JavaScript accepts the string quantity and the misspelled result label. The mistakes may not become visible until this path runs. A result-label typo could even select the wrong branch in a test without producing a clear error.

TypeScript lets the suite declare the intended contract:

```ts
type CheckoutCase = {
  quantity: number;
  expectedResult: 'success' | 'out-of-stock';
};

const checkoutCase: CheckoutCase = {
  quantity: '2',
  expectedResult: 'sucess',
};
```

When project type checking runs, TypeScript can report that:

- `quantity` must be a `number`, not a `string`; and
- `expectedResult` must be either `'success'` or `'out-of-stock'`.

These mismatches are visible before the test reaches the browser. That earlier feedback is the main reason TypeScript helps QA automation: it catches many mistakes in the test code while they are still cheaper to understand and repair.

It does not prove the application is correct. It helps us write and change the code that performs that verification with clearer contracts.

## The mental model

TypeScript adds a static review layer before JavaScript runs:

```text
JavaScript code + inferred or declared types
                    ↓
Type checking finds incompatible usage
                    ↓
Types are removed during transformation
                    ↓
JavaScript runs with dynamic runtime values
                    ↓
Product behavior still needs observable evidence
```

Think in three boundaries:

| Boundary                   | What TypeScript can help detect                              | What still needs runtime evidence                       |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Test data and calculation  | Missing fields, wrong value types, unsupported result labels | Whether the data represents a valid product scenario    |
| Helper or fixture contract | Incorrect arguments, return values, and affected callers     | Whether setup actually succeeded                        |
| Environment, API, or file  | Unsafe use while a value remains `unknown` or optional       | Whether external data exists and has the expected shape |

TypeScript is strongest inside code whose contract the team controls. Data entering from outside that trusted boundary still needs a runtime check.

The type system also improves editor feedback, autocomplete, navigation, and refactoring. When a shared contract changes, the compiler can identify callers that no longer match it. This becomes increasingly valuable when humans and coding agents both modify the suite.

## Work through a realistic example

A checkout suite stores controlled cases used by several tests:

```ts
type CheckoutResult = 'success' | 'out-of-stock';

type CheckoutCase = {
  productName: string;
  unitPrice: number;
  quantity: number;
  expectedResult: CheckoutResult;
  couponCode?: string;
};

const checkoutCase: CheckoutCase = {
  productName: 'Mechanical Keyboard',
  unitPrice: 120,
  quantity: 2,
  expectedResult: 'success',
};
```

This contract makes several review decisions visible:

- `unitPrice` and `quantity` must be used as numbers inside typed code;
- `expectedResult` accepts only the product states supported by this suite;
- every case must provide the required fields; and
- `couponCode?` may be absent because a coupon is genuinely optional.

If someone writes `expectedResult: 'sucess'` or removes `productName`, the type checker can point to the malformed test case before a browser run.

### Put explicit types at useful boundaries

A calculation used by the suite can state what it accepts and returns:

```ts
function expectedSubtotal(testCase: CheckoutCase): number {
  return testCase.unitPrice * testCase.quantity;
}

const subtotal = expectedSubtotal(checkoutCase);
```

If a refactor changes `quantity` to a string, this function and every affected caller become part of the compiler feedback. The type gives reviewers a shared contract instead of asking them to infer the intended shape from every call site.

### Prefer inference for obvious local values

TypeScript already infers many local types:

```ts
const taxRate = 0.11; // inferred as number
const subtotal = expectedSubtotal(checkoutCase); // inferred as number
const productNames = ['Mouse', 'Keyboard']; // inferred as string[]
```

Repeating `: number` or `: string[]` adds little here. Explicit types are most useful at shared boundaries, not on every variable.

### Use unions and optional properties intentionally

A union documents a small supported set. An optional property documents that absence is valid:

```ts
if (checkoutCase.couponCode) {
  await page.getByLabel('Coupon code').fill(checkoutCase.couponCode);
}
```

This condition is appropriate only because the contract says a coupon is optional. Do not add `?` merely because the author is unsure whether required data will exist.

### Keep runtime boundaries honest

Environment variables can be missing at runtime:

```ts
const password = process.env.TEST_PASSWORD;

if (!password) {
  throw new Error('TEST_PASSWORD is required for the login scenario');
}

await page.getByLabel('Password').fill(password);
```

The guard does two jobs. It fails honestly when configuration is missing and narrows the TypeScript type from `string | undefined` to `string` afterward.

Compare the unsafe shortcut:

```ts
const password = process.env.TEST_PASSWORD as string;
```

`as string` only tells TypeScript to trust the author. It does not create a missing environment variable.

API data has the same boundary. A cast can claim that a server returned an order even when the actual response is an error page or a different JSON shape:

```ts
type OrderResponse = {
  id: string;
  status: 'created';
};

const body = (await response.json()) as OrderResponse;
```

That cast performs no validation. Treat untrusted data as `unknown` until the important fields are checked:

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

Larger response contracts belong in the project's maintained runtime schema rather than a growing collection of inline checks.

## When to use it—and when not to

JavaScript may be sufficient for a small experiment or disposable script. TypeScript earns its maintenance cost when a suite has shared contracts, several contributors, generated code to review, or refactors that affect many tests.

Use inference for obvious local values. Add explicit types where a contract crosses a boundary:

- shared test data;
- helper parameters and return values;
- fixtures and configuration;
- supported product-state labels; and
- API models after runtime validation.

Use a union when a value must come from a small documented set. Use an optional property only when absence is a real supported state.

Avoid `any` when reviewing test code because it disables useful checking around that value. Prefer `unknown` for untrusted data because it requires narrowing before use.

Do not annotate every variable or design a complex generic type system for a small test. Type complexity has a review and maintenance cost too.

Playwright can transform and run TypeScript without performing complete project type checking. Keep a separate compiler check in the local or CI workflow:

```bash
npx tsc -p tsconfig.json --noEmit
npx playwright test
```

Use the repository's configured scripts when they differ.

## When it fails

Suppose generated code has no red editor warning:

```ts
type User = {
  email: string;
  role: 'customer' | 'admin';
};

const user = (await response.json()) as User;
await page.getByText(user.email).click();
```

At runtime, `user.email` is `undefined` because the endpoint returned `{ "error": "unauthorized" }`.

Diagnose the boundary:

1. What status and body did the endpoint actually return?
2. Which line claimed a type without checking the value?
3. Should setup authenticate first or fail on the response status?
4. Which runtime validation is appropriate for this response?
5. What user-visible outcome still needs a Playwright assertion afterward?

Changing the cast to `as unknown as User` only hides the problem more thoroughly. Adding `any` removes feedback instead of repairing the contract.

Review TypeScript in two passes.

First, inspect the compile-time contract:

- Are shared data and helper boundaries typed clearly?
- Are unions and optional properties based on real product rules?
- Is inference used when the value is already obvious?
- Does the code introduce unnecessary interfaces or generics?
- Did an unsafe assertion silence a useful mismatch?

Then inspect runtime honesty:

- Does external data get checked before typed code trusts it?
- Are environment variables guarded before use?
- Could optional chaining hide required missing data?
- Did setup actually produce the state described by the type?
- Do Playwright assertions still prove the product outcome?

Clean types are useful maintenance evidence. They are not a substitute for a meaningful test result.

## Check your understanding

Review these two cases:

```ts
type TestUser = {
  email: string;
  role: 'customer' | 'admin';
};

const controlledUser: TestUser = {
  email: 'qa@example.com',
  role: 'superuser',
};

const response = await request.get('/api/test-user');
const apiUser = (await response.json()) as TestUser;
```

Explain:

1. Which mistake can TypeScript report in `controlledUser`?
2. Why can the `apiUser` cast appear valid even when the response is wrong?
3. What should be checked before treating the response as a `TestUser`?
4. Why would changing either value to `any` make review weaker?
5. What product evidence is still required after the data is valid?

## Compare your reasoning

One reasonable answer is:

- `superuser` is not part of the declared `'customer' | 'admin'` union, so the controlled case violates its contract.
- The cast instructs TypeScript to trust the declared shape. It does not inspect the status, content type, or response fields.
- Check the response status and validate the critical fields with the project's runtime-validation approach before using them.
- `any` would disable the useful checks around those values and allow incompatible usage to spread.
- Valid data only establishes test setup. The test still needs Playwright assertions for the user-visible behavior required by the scenario.

## Before you continue

You should now be able to explain why a growing automation suite may choose TypeScript, read and repair a simple compiler mismatch, place explicit types at useful test-code boundaries, and challenge unsafe confidence around runtime data.

Module 3 is complete when you have finished its four Core lessons and three focused Core Practice challenges: the first observable Playwright test, the QA-focused JavaScript case, and the asynchronous setup task. The mapped TypeScript exercises are Additional Practice because the current runner can observe their runtime result but cannot prove compiler diagnostics or runtime-data validity by itself.

You are ready for Module 4, where the role, accessible name, DOM context, code literacy, and runtime evidence from the first three modules come together in reliable locator decisions.
