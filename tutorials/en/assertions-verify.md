---
title: 'Choose Evidence That Proves the Outcome'
description: 'Turn product expectations into the smallest sufficient set of user-observable, auto-retrying Playwright assertions.'
---

## After this lesson, you can

- translate a product risk into an observable test claim;
- choose assertions for content, control state, form value, collection size, or navigation state;
- distinguish auto-retrying web assertions from one-time value checks;
- avoid negative assertions that pass before the behavior happens; and
- review generated assertions for weak, excessive, or implementation-only evidence.

## Why this matters for QA

Module 5 showed how to wait for an observable outcome. Now comes a harder question: which outcome actually proves the requirement?

Imagine a checkout test that ends with:

```ts
await expect(page.getByRole('button', { name: 'Place order' })).toBeHidden();
```

The button disappeared, but was the order created? Was the correct product purchased? Did the application show a payment error instead? The assertion may be technically correct while the test still proves the wrong thing.

Manual QA engineers already make this judgment when they compare actual and expected results. Automation makes that expected-result contract executable. A green test is only valuable when its evidence supports the product claim we care about.

## The mental model

Build assertions from risk, not from whatever elements are easy to inspect:

```text
Product risk
     ↓
Claim the test must prove
     ↓
Observable evidence available to the user
     ↓
Matcher that expresses that evidence
```

![A product risk becomes a precise claim, the claim is supported by user-observable evidence, and each piece of evidence receives a matching Playwright assertion.](/images/tutorials/assertion-evidence-chain.svg)

_The matcher is the final implementation choice. Evidence design comes first._

For an order scenario:

- **Risk:** payment succeeds but no order is created.
- **Claim:** one order is confirmed for the intended purchase.
- **Evidence:** confirmation heading, generated order number, and intended item summary.
- **Matchers:** exact or appropriately scoped text assertions.

“The click completed,” “the spinner disappeared,” and “the container has class `success`” may describe intermediate implementation state. None is sufficient proof unless the requirement specifically makes it part of the contract.

Playwright offers two broad assertion behaviors:

| Assertion style                                 | Behavior                                         | Typical use                                     |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `await expect(locator).toHaveText(...)`         | Re-fetches and retries until expected or timeout | Changing browser UI                             |
| `await expect(locator).toBeEnabled()`           | Re-fetches and retries                           | Control state after a transition                |
| `await expect(page).toHaveURL(...)`             | Retries against page URL                         | A route is part of the expected result          |
| `expect(await locator.textContent()).toBe(...)` | Reads and compares one moment                    | A deliberate snapshot when no retry is intended |
| `expect(calculatedValue).toBe(...)`             | Compares an in-memory value once                 | Synchronous code or an already completed result |

For browser state that can change asynchronously, prefer Playwright's async web assertions and remember to `await` them.

## Work through a realistic example

The registration requirement says:

> Invalid email or password data must block registration and guide the user. When both values become valid, the guidance clears and Register becomes available.

The main risk is not simply “an error exists.” The risk is that invalid data can be submitted or valid data remains blocked.

### 1. Translate the requirement into claims

Before writing matchers, state what the test must prove:

1. The known invalid starting state shows the email guidance.
2. Register is unavailable while the data is invalid.
3. Correcting the data removes the email guidance.
4. Register becomes available when the required data is valid.

These four claims describe one behavior: registration availability follows validation state.

### 2. Use evidence that matches each claim

```ts
const email = page.getByLabel('Email');
const password = page.getByLabel('Password');
const emailError = page.getByRole('alert');
const register = page.getByRole('button', { name: 'Register' });

await expect(emailError).toHaveText('Invalid email format');
await expect(register).toBeDisabled();
```

`toHaveText()` proves content, not merely visibility. If the requirement only said some alert appears, `toBeVisible()` could be enough. Here the specific guidance matters, so text is stronger and still focused.

`toBeDisabled()` expresses user capability directly. Checking `class="disabled"` would only inspect one possible implementation.

### 3. Create the valid state

```ts
await email.fill('rani@example.com');
await password.fill('validpass123');
```

The action methods create the intended values. They do not prove the validation result.

### 4. Assert the state transition

```ts
await expect(emailError).toBeHidden();
await expect(register).toBeEnabled();
```

This negative visibility assertion is meaningful because the test already established that the alert was present in a controlled invalid state. It cannot pass merely because the alert never rendered.

The enabled assertion proves the second half of the behavior. The test does not need to inspect every CSS class, HTML attribute, or validation function.

### 5. Choose matchers by the evidence contract

Common choices include:

| Evidence to prove                    | Useful assertion                   | Review question                                       |
| ------------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| Exact status or heading              | `toHaveText('Profile saved')`      | Must the whole message match?                         |
| Stable phrase inside dynamic content | `toContainText('Order confirmed')` | Could the phrase appear in the wrong state?           |
| User can see a control               | `toBeVisible()`                    | Does visibility alone prove the required content?     |
| User can or cannot use a control     | `toBeEnabled()` / `toBeDisabled()` | Is capability the actual business rule?               |
| Checkbox choice                      | `toBeChecked()`                    | Was the required starting state controlled?           |
| Live input value                     | `toHaveValue()`                    | Is the form value, rather than surrounding text, key? |
| Exact list or result size            | `toHaveCount()`                    | Does the number carry product meaning?                |
| Route reached                        | `toHaveURL()`                      | Is URL part of the contract or only implementation?   |
| Link target or required DOM contract | `toHaveAttribute()`                | Would user-visible behavior be better evidence?       |

Exact matching is useful when the complete message is the contract. Partial text or a regular expression is useful when a stable phrase is surrounded by a generated ID, date, or localized detail. Do not make matching broader simply to avoid maintaining the expected result.

## When to use it—and when not to

Use auto-retrying locator and page assertions for browser state that may change after navigation, action, rendering, or a server response. Use one-time generic assertions for values already captured in memory or when a snapshot at one precise moment is deliberate.

Prefer user-observable evidence: meaningful text, accessible state, live values, count, and route when routing matters. An attribute assertion is appropriate when the attribute itself is a requirement—for example, a link must target a safe destination. It should not replace a clearer user-facing outcome by default.

Use several assertions when one behavior genuinely needs several pieces of proof. “One assertion per test” is not a quality rule. The opposite extreme—asserting every visible field—creates noise and couples the test to unrelated changes. Keep the smallest set that would convince a reviewer the claim is true.

Use hard assertions for prerequisites and evidence that should stop the scenario on failure. Use `expect.soft()` for independent diagnostics that are still useful together. Soft failures still fail the test at the end. Do not continue business actions that depend on a failed soft prerequisite; check `test.info().errors` or use a hard assertion before continuing.

## When it fails

When an assertion fails, inspect both the expected contract and the observed surface:

1. Did the action and starting state actually produce the scenario being asserted?
2. Is the locator scoped to the intended account, card, row, dialog, or page?
3. Does the matcher express the correct evidence type—text, value, state, count, or URL?
4. Is an exact expectation wrong, or is a broad expectation hiding incorrect content?
5. Did the outcome appear on a different page or frame?
6. Is the failure a real product defect, stale expected result, missing synchronization, or incorrect test assumption?

Do not replace a failing exact assertion with `toContainText('Success')` until you know which changing content is intentionally variable. Do not increase the assertion timeout when the expected state can never occur. Do not catch the assertion error and log it; the failure is product feedback.

For an absence check that passes suspiciously fast, prove the positive precondition first or synchronize with another outcome that confirms the relevant transition happened.

## Review generated work

Review each generated assertion with these questions:

- Which product risk and claim does this assertion support?
- Does it inspect something a user can observe or only an implementation detail?
- Is visibility being used when exact content or capability matters?
- Is text matching so broad that the wrong message could pass?
- Does a negative assertion have a known positive starting state?
- Is a one-time `textContent()`, `isVisible()`, or `count()` snapshot being used on changing UI?
- Are unrelated assertions included only because those elements are easy to find?
- Does `expect.soft()` allow dependent actions to continue after a broken prerequisite?
- Would the failure explain what product behavior changed?

Generated matchers are easy to produce. Evidence selection requires product knowledge and QA judgment.

## Check your understanding

Review this generated test:

```ts
await page.getByRole('button', { name: 'Delete address' }).click();

await expect(page.locator('.address-card')).not.toHaveClass(/loading/);
await expect(page.getByText('Address')).not.toBeVisible();
await expect(page.locator('body')).toContainText('Success');
```

The requirement says the address named **Office Jakarta** is removed and a status announces **Address deleted**. Other addresses must remain.

Explain which assertions are weak or ambiguous, what evidence should identify the correct address, and how you would prevent the absence check from passing against the wrong state.

## Compare your reasoning

One reasonable answer is:

- Scope to the address card named Office Jakarta before the delete action so the target identity is explicit.
- Establish that the intended card is visible before deleting it.
- After the action, assert the exact or sufficiently precise `Address deleted` status.
- Assert the Office Jakarta card is removed, for example with a scoped count of zero or an appropriate hidden assertion.
- Do not assert that all text “Address” disappears because other addresses should remain.
- Remove the loading-class check unless that implementation detail is itself a requirement.

The status proves the transition completed; the scoped absence proves the correct record disappeared.

## Before you continue

You should now be able to start from a product claim, choose the smallest sufficient user-observable evidence, and implement it with the appropriate retrying assertion without blindly collecting matchers.

Complete the integrated Core Practice about form validation state. The focused visibility, text, value, state, count, attribute, and soft-assertion drills remain Additional Practice. The next lesson uses evidence design inside a broader test portfolio built from product risk.
