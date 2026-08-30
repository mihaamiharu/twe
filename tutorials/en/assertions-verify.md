---
title: 'Choose Assertions That Verify the Expected Result'
description: 'Choose Playwright assertions that match the expected result and focus on what users can see or experience.'
---

## After this lesson, you can

- decide what needs to be verified based on product risk;
- choose assertions for text, control state, form value, element count, or URL changes;
- distinguish retrying Playwright assertions from values checked only once;
- recognize absence assertions that can pass before the flow finishes; and
- review whether the assertions verify the expected result without checking irrelevant details.

## Why this matters for QA

Module 5 showed how to wait for the result of an action. Now we need to decide which result should be verified.

Imagine a checkout test that ends with:

```ts
await expect(page.getByRole('button', { name: 'Place order' })).toBeHidden();
```

The button disappeared, but was the order created? Was the correct product purchased? Did the application show a payment error instead?

The assertion may pass while the test still fails to verify the result required by the scenario.

Manual QA engineers already compare actual and expected results. In automation, we translate that expected result into assertions. A passing test is useful only when its assertions verify the result that matters.

## The mental model

Start with product risk, not with the easiest element to inspect:

```text
Product risk
     ↓
Result the test must verify
     ↓
What the user can see or experience
     ↓
Assertion that best matches the result
```

![A product risk becomes a precise claim, the claim is supported by user-observable evidence, and each piece of evidence receives a matching Playwright assertion.](/images/tutorials/assertion-evidence-chain.svg)

_Choose the assertion after you know what needs to be verified. The matcher is the final choice._

In Playwright, `expect(value)` starts the assertion. A method such as `toHaveText()` is the matcher that describes the expected result.

For an order scenario:

- **Risk:** payment succeeds but no order is created.
- **Result to verify:** one order was created for the intended purchase.
- **What can be checked:** the confirmation heading, order number, and intended item summary.
- **Assertion:** use exact text or a properly scoped locator as needed.

“The click completed,” “the spinner disappeared,” and “the container has class `success`” may show that the application reached a particular state. They do not necessarily prove that the expected result occurred.

Playwright assertions broadly work in two ways:

| Assertion                                       | How it works                                          | Typical use                                    |
| ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `await expect(locator).toHaveText(...)`         | Retries until the text matches or the timeout expires | UI that changes after an action                |
| `await expect(locator).toBeEnabled()`           | Retries until the control becomes enabled             | A changing control state                       |
| `await expect(page).toHaveURL(...)`             | Retries until the URL matches                         | A route change that must be verified           |
| `expect(await locator.textContent()).toBe(...)` | Reads the value once and compares it immediately      | A deliberate check that does not need retrying |
| `expect(calculatedValue).toBe(...)`             | Compares a value already available in memory          | A calculation or synchronous result            |

For browser state that can change asynchronously, prefer Playwright's async web assertions and remember to `await` them.

## Work through a realistic example

The registration requirement says:

> Invalid email or password data must block registration and guide the user. When both values become valid, the guidance clears and Register becomes available.

The main risk is not only that an error message appears. Invalid data might still be submitted, or valid data might remain blocked.

### 1. Decide what needs to be verified

Before choosing assertions, state the results the test must verify:

1. Invalid email data shows the email guidance.
2. The **Register** button is disabled while the data is invalid.
3. Correcting the email removes the guidance.
4. The **Register** button becomes enabled when all required data is valid.

These four claims describe one behavior: registration availability follows validation state.

### 2. Choose assertions that match those results

In this example, validation runs when field values change. The test creates an invalid starting state before making assertions:

```ts
const email = page.getByLabel('Email');
const password = page.getByLabel('Password');
const emailError = page.getByRole('alert');
const register = page.getByRole('button', { name: 'Register' });

await email.fill('rani.example.com');
await password.fill('short');

await expect(emailError).toHaveText('Invalid email format');
await expect(register).toBeDisabled();
```

`toHaveText()` verifies that the message is **Invalid email format**, not only that an alert is visible.

If the requirement only said that an alert must appear, `toBeVisible()` might be enough. The wording matters in this scenario, so `toHaveText()` is a better match.

`toBeDisabled()` directly verifies that the user cannot register yet. Checking `class="disabled"` would only inspect one implementation detail.

### 3. Change the data to a valid state

```ts
await email.fill('rani@example.com');
await password.fill('validpass123');
```

These actions only change the field values. The test still needs to verify that the application updates its validation state.

### 4. Verify the change after correcting the data

```ts
await expect(emailError).toBeHidden();
await expect(register).toBeEnabled();
```

`toBeHidden()` is meaningful here because the test already proved that the error appeared for invalid data.

When the error disappears after the data is corrected, the test verifies the expected state change.

`toBeEnabled()` then verifies that the **Register** button can be used. There is no need to inspect every CSS class, HTML attribute, or validation function.

### 5. Choose assertions based on the result to verify

| What you need to verify               | Assertion                          | Question to ask during review                           |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| Exact status or heading text          | `toHaveText('Profile saved')`      | Must the whole message match?                           |
| Stable text inside dynamic content    | `toContainText('Order confirmed')` | Could this text also appear in the wrong state?         |
| A control is visible                  | `toBeVisible()`                    | Is visibility enough for this scenario?                 |
| A control can or cannot be used       | `toBeEnabled()` / `toBeDisabled()` | Is enabled or disabled state part of the behavior?      |
| A checkbox is in a particular state   | `toBeChecked()`                    | Is the starting state controlled?                       |
| The value inside an input             | `toHaveValue()`                    | Is the field value what needs to be verified?           |
| The number of items or results        | `toHaveCount()`                    | Does the count matter to the requirement?               |
| The URL changes to a particular route | `toHaveURL()`                      | Is the URL required or only an implementation detail?   |
| A particular attribute                | `toHaveAttribute()`                | Does the attribute matter, or is user behavior clearer? |

Use an exact match when the full text must match.

Use partial text or a regular expression when some content is dynamic, such as an order ID, date, or localized detail.

Do not loosen a matcher only to make an assertion easier to pass.

## When to use it—and when not to

Use retrying Playwright assertions for browser conditions that can change after navigation, an action, rendering, or a server response.

Use a regular assertion for a value already available in memory or a condition that only needs to be checked once.

Prefer results that matter to the user, such as visible text, control state, field value, item count, or the URL when routing is part of the requirement.

An attribute assertion is appropriate when the attribute matters to the scenario. For example, a link may need to point to a safe destination. Do not use it by default when user behavior provides clearer proof.

One test can have several assertions when they are needed to verify one behavior.

There is no rule that a test must contain only one assertion. However, checking every visible field adds noise and couples the test to unrelated changes. Keep only the assertions needed to verify the expected result.

Use a regular `expect()` (hard assertion) for a condition that must be true before the test can continue.

Use `expect.soft()` when you want to collect several results without stopping at the first failure. The test still fails at the end if any soft assertion failed.

Do not continue to an action that depends on a failed condition. Use a hard assertion before that action.

## When it fails

When an assertion fails, check these questions first:

1. Did the action and starting state actually produce the scenario being asserted?
2. Is the locator scoped to the intended account, card, row, dialog, or page?
3. Does the matcher express the correct evidence type—text, value, state, count, or URL?
4. Is an exact expectation wrong, or is a broad expectation hiding incorrect content?
5. Did the outcome appear on a different page or frame?
6. Is the failure a real product defect, stale expected result, missing synchronization, or incorrect test assumption?

Do not replace a failing exact assertion with `toContainText('Success')` only to make the test pass. First decide which parts of the text may change and which parts must stay the same.

Do not increase the assertion timeout when the expected condition will never occur.

Do not catch an assertion error, log it, and continue. The failure must remain visible because it may indicate a product or test problem.

If an absence assertion passes too quickly, first prove that the element existed or wait for another result that confirms the flow ran.

Review each assertion with these questions:

- Does the assertion verify a result that matters to the scenario?
- Does it inspect something a user can observe or only an implementation detail?
- Is visibility being used when exact content or capability matters?
- Is text matching so broad that the wrong message could pass?
- Does a negative assertion have a known positive starting state?
- Is a one-time `textContent()`, `isVisible()`, or `count()` snapshot being used on changing UI?
- Are unrelated assertions included only because those elements are easy to find?
- Does `expect.soft()` allow dependent actions to continue after a broken prerequisite?
- Would the failure explain what product behavior changed?

Adding an assertion is easy. The important part is choosing one that verifies the expected result.

## Check your understanding

Review this test:

```ts
await page.getByRole('button', { name: 'Delete address' }).click();

await expect(page.locator('.address-card')).not.toHaveClass(/loading/);
await expect(page.getByText('Address')).not.toBeVisible();
await expect(page.locator('body')).toContainText('Success');
```

The requirement says the address named **Office Jakarta** must be removed and the status must show **Address deleted**. Other addresses must remain.

Explain:

1. Which assertions are too broad or fail to verify the requirement?
2. How would you make sure the test deletes **Office Jakarta**, not another address?
3. Which assertion would better verify the status after deletion?
4. How would you stop the check for a missing **Office Jakarta** card from passing too early?

## Compare your reasoning

One possible answer is:

- Locate the **Office Jakarta** card before the delete action so the test clearly identifies the correct address.
- Before deleting it, verify that the **Office Jakarta** card is visible.
- After the action, verify the **Address deleted** status with sufficiently precise text.
- Verify that the **Office Jakarta** card is gone or hidden after the action completes.
- Do not assert that all **Address** text disappears because other addresses should remain.
- Remove the loading-class check unless that implementation detail is itself a requirement.

The **Address deleted** status confirms that the delete flow completed. The check on the **Office Jakarta** card confirms that the correct record disappeared.

## Before you continue

You should now be able to start from the expected result, decide what needs to be verified, and choose a retrying Playwright assertion when the UI can still change.

Complete the Core Practice about form validation state.

Additional Practice remains available for visibility, text, value, state, count, attribute, and soft assertions.

The next lesson uses this reasoning to decide which tests to create based on product risk.
