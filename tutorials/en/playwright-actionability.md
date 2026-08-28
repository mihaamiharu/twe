---
title: 'Separate Action Readiness from Outcome Synchronization'
description: 'Understand what Playwright waits for before an action and define the observable application state that proves the scenario afterward.'
---

## After this lesson, you can

- explain actionability as action-specific readiness rather than a universal checklist;
- separate target readiness, interaction, application transition, and expected outcome;
- synchronize with retried assertions instead of fixed sleeps;
- diagnose action timeouts without hiding them with force or larger timeouts; and
- review waits by naming the condition that ends each one.

## Why this matters for QA

Imagine a profile page with a Save button. The button becomes enabled, Playwright clicks it successfully, and the test ends green. A moment later, the server rejects the update.

Did the test prove that the profile was saved? No. It proved only that the button could be clicked.

This confusion creates two common test problems:

- false confidence, because the action succeeds without an outcome assertion; and
- flakiness, because a fixed sleep guesses when the application should be ready.

Playwright removes a lot of mechanical waiting, but it cannot decide which business result matters. That remains test-design work.

## The mental model

Separate the flow into four parts:

```text
1. Target ready for this action
              ↓
2. Interaction performed
              ↓
3. Application transition
              ↓
4. Observable expected outcome
```

![Test intent chooses an action, Playwright checks action-specific readiness, and the test still waits for an observable application outcome.](/images/tutorials/action-readiness-outcome.svg)

_Auto-waiting protects the interaction boundary. A web assertion synchronizes with the product outcome._

Actionability is not one checklist applied to every method. Playwright checks conditions relevant to the requested action:

| Action           | Visible | Stable | Receives events | Enabled | Editable |
| ---------------- | ------- | ------ | --------------- | ------- | -------- |
| `click()`        | Yes     | Yes    | Yes             | Yes     | No       |
| `fill()`         | Yes     | No     | Yes             | Yes     | Yes      |
| `check()`        | Yes     | Yes    | Yes             | Yes     | No       |
| `selectOption()` | Yes     | No     | No              | Yes     | No       |

Playwright also resolves a single intended element for a single-target action. Module 4 covered that strictness contract.

These checks answer, “Can Playwright perform this action the way a user could?” They do not answer, “Did the server save the profile?”

## Work through a realistic example

The requirement says:

> When a user updates their display name and saves, the page shows “Profile saved” and the new name remains visible.

The application disables Save while submitting and then updates a status region.

### 1. Perform actions that express intent

```ts
const displayName = page.getByLabel('Display name');
const saveButton = page.getByRole('button', { name: 'Save profile' });
const status = page.getByRole('status');

await displayName.fill('Rani QA');
await saveButton.click();
```

Before `click()` is dispatched, Playwright waits for the button to resolve uniquely and become visible, stable, able to receive pointer events, and enabled. If an overlay covers it or it remains disabled, the action fails instead of pretending a user clicked it.

The resolved click still does not prove that the save request completed.

### 2. Define the observable outcome

```ts
await expect(status).toHaveText('Profile saved');
await expect(displayName).toHaveValue('Rani QA');
```

Playwright's web assertions retry until their expected condition passes or their assertion timeout expires. The status assertion therefore synchronizes with the application transition without guessing its duration.

The exact assertion depends on the risk. A saved message may be enough for one scenario. A stronger persistence scenario might reload the page and assert the value still exists. Do not add every possible assertion automatically; prove the requirement under test.

### 3. Understand why a fixed sleep is weaker

```ts
await saveButton.click();
await page.waitForTimeout(2000);
await expect(status).toHaveText('Profile saved');
```

This code waits for two seconds whether the update takes 100 milliseconds or 1.9 seconds. It still fails if the environment takes 2.1 seconds, and it wastes time when the application is fast. More importantly, the sleep says nothing about what readiness means.

The assertion already names the condition: the status becomes “Profile saved.” Let that condition end the wait.

### 4. Diagnose an action timeout separately from an outcome timeout

If `saveButton.click()` times out, investigate the target before the save request:

- Did form validation keep the button disabled?
- Is a loading mask or cookie banner intercepting pointer events?
- Is an animation preventing stability?
- Did the locator match a hidden duplicate?

If the click succeeds but `toHaveText('Profile saved')` times out, investigate after the action:

- Did the request fail?
- Did the application render an error instead?
- Is the assertion observing the wrong status region or page?
- Did the requirement expect a different state transition?

Those are different failure classes. Keeping readiness and outcome separate makes the trace and error message useful.

### 5. Use a one-time event when that event is the outcome

Some outcomes are not same-page DOM state. An Export button may produce a download:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('customers.csv');
```

The listener begins before the click so the test cannot miss a fast event. The next lesson covers this event pattern and other browser surfaces in detail.

## When to use it—and when not to

Rely on normal Playwright actions for action readiness. Use web assertions such as `toBeVisible()`, `toHaveText()`, `toHaveValue()`, or `toHaveURL()` when observable UI or navigation state proves the outcome.

Use `waitForEvent()` when a one-time browser event—such as a download or popup—is the behavior you need to capture. Register it before the trigger.

Use an explicit network wait only when the network response itself is the contract or when it provides necessary coordination that the UI cannot express. A successful response does not automatically prove the user-visible result.

Do not add `waitForLoadState('networkidle')` as a universal “page ready” rule. Modern applications may keep analytics, polling, or streaming connections active, and Playwright documentation discourages using network idle as a test-readiness signal. Prefer a URL, heading, control state, or other product-specific evidence.

Do not use a larger timeout to define readiness. A timeout is a maximum patience budget, not the condition you are waiting for.

## When it fails

First identify which boundary failed:

1. **Locator resolution:** zero or multiple controls matched.
2. **Action readiness:** the intended control never became interactable for that action.
3. **Interaction side effect:** the action happened but the application took an unexpected path.
4. **Outcome evidence:** the expected observable condition never appeared.
5. **Wrong surface:** the outcome opened in a popup, frame, dialog, download, or different page.

Use the Playwright error, trace, DOM snapshot, screenshot, console, and network evidence to place the failure at one of those boundaries.

`click({ force: true })` may bypass a readiness symptom without fixing the product or test. A larger timeout may postpone the same failure. A test retry can help classify occasional infrastructure noise, but it does not repair missing synchronization. If a test only passes on retry, it still needs diagnosis.

For every action and wait in the test, ask:

- What exact readiness does Playwright already check for this action?
- What observable condition proves the business outcome?
- Does a `waitForTimeout()` merely guess how long the transition takes?
- Is a timeout value being mistaken for a readiness condition?
- Does `force` hide a covered, disabled, unstable, or wrong target?
- Is the code waiting for network idle without a product-specific reason?
- If a network response is awaited, does the test still verify what the user sees?
- Can the outcome happen on another browser surface?

Code often accumulates waits because they look safe. A wait is only meaningful when you can name the condition that ends it and why that condition matters.

## Check your understanding

Review this test:

```ts
await page.getByRole('button', { name: 'Submit claim' }).click({
  force: true,
});
await page.waitForTimeout(3000);
expect(await page.getByText('Submitted').isVisible()).toBe(true);
```

The Submit claim button is disabled until all required evidence is uploaded. After submission, the server asynchronously updates a status region to “Claim submitted.”

Explain:

1. What business signal might `force` be hiding?
2. Which outcome condition should replace the fixed sleep?
3. Why is the immediate `isVisible()` snapshot weaker than a web assertion?
4. How would you tell an action-readiness failure from a submission-outcome failure?

## Compare your reasoning

One reasonable approach is:

- upload the required evidence or assert that the disabled button correctly represents invalid form state;
- use a normal `click()` so Playwright protects the user interaction boundary;
- use `await expect(page.getByRole('status')).toHaveText('Claim submitted')` to retry against the observable result;
- diagnose a click failure by inspecting target readiness and validation state; and
- diagnose an assertion failure by inspecting the request, error UI, and final application state after a successful click.

The improved test does not wait less aggressively. It waits for a more meaningful condition.

## Before you continue

You should now be able to explain exactly where Playwright auto-waiting helps and where your scenario must provide outcome synchronization.

Complete the Core Practice that saves a profile and waits for an observable status without `waitForTimeout()`. This lesson has no separate mapped Additional Practice: its completion proof is the distinction between action readiness and application outcome. The dynamic-table exercise remains available as standalone Practice for locator transfer.
