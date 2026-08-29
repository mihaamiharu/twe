---
title: 'Know When an Action Is Ready and When Its Result Is Ready'
description: 'Understand what Playwright waits for before an action, then define the application state to wait for and verify afterward.'
---

## After this lesson, you can

- explain that each Playwright action has its own readiness checks;
- distinguish element readiness, the action itself, application processing, and the expected result;
- use retrying assertions instead of fixed sleeps;
- diagnose an action timeout by fixing its cause instead of forcing the action or increasing the timeout; and
- review a wait by naming the condition that allows the test to continue.

## Why this matters for QA

Imagine a profile page with a **Save** button. The button is enabled, Playwright clicks it, and the test passes. A moment later, the server rejects the update.

The test proved that Playwright could click **Save**. It did not prove that the profile was saved.

This mistake usually appears in two forms:

- the test passes without verifying the final result; or
- the test becomes flaky because a fixed sleep guesses when the application will be ready.

Playwright automatically waits for an element to become ready for an action. After the action, the test still needs to define which result to wait for and verify. That decision is part of QA test design.

## The mental model

Separate the flow into four parts:

```text
1. Element becomes ready for the action
              ↓
2. Action runs
              ↓
3. Application processes the change
              ↓
4. Expected result becomes ready to verify
```

![Test intent chooses an action, Playwright checks action-specific readiness, and the test still waits for an observable application outcome.](/images/tutorials/action-readiness-outcome.svg)

_Auto-waiting protects the interaction boundary. A web assertion synchronizes the test with the product result._

Playwright performs different actionability checks for different methods. It checks only the conditions required by the requested action:

| Action           | Visible | Stable | Receives events | Enabled | Editable |
| ---------------- | ------- | ------ | --------------- | ------- | -------- |
| `click()`        | Yes     | Yes    | Yes             | Yes     | No       |
| `fill()`         | Yes     | No     | No              | Yes     | Yes      |
| `check()`        | Yes     | Yes    | Yes             | Yes     | No       |
| `selectOption()` | Yes     | No     | No              | Yes     | No       |

For a single-target action, Playwright also requires the locator to resolve to exactly one element. Module 4 covered this strictness behavior.

These checks determine whether Playwright can perform the action on the target. They do not determine whether the server saved the profile or whether the expected product result appeared.

## Work through a realistic example

The requirement says:

> When a user changes their display name and saves, the page shows **“Profile saved”** and the new name remains visible.

The application disables **Save** during submission and updates a status message when processing finishes.

### 1. Run the action required by the scenario

```ts
const displayName = page.getByLabel('Display name');
const saveButton = page.getByRole('button', { name: 'Save profile' });
const status = page.getByRole('status');

await displayName.fill('Rani QA');
await saveButton.click();
```

Before `click()` runs, Playwright waits for the locator to resolve to one button and for that button to become visible, stable, enabled, and able to receive pointer events.

The action times out if an overlay blocks the button or if the button remains disabled. A successful click still does not mean the save operation finished.

### 2. Verify the result after the action

```ts
await expect(status).toHaveText('Profile saved');
await expect(displayName).toHaveValue('Rani QA');
```

Playwright assertions retry until the expected condition passes or the assertion times out. The test can wait for **“Profile saved”** directly instead of guessing how long the save operation will take.

Choose assertions from the requirement. A saved message may be enough for one scenario. A persistence scenario may reload the page and verify that **“Rani QA”** remains. Add the evidence needed for the risk under test rather than every possible assertion.

### 3. Understand why a fixed sleep is less reliable

```ts
await saveButton.click();
await page.waitForTimeout(2000);
await expect(status).toHaveText('Profile saved');
```

This code always waits for two seconds, whether the save finishes in 100 milliseconds or 1.9 seconds. It still fails when a slower environment needs 2.1 seconds and wastes time when the application responds quickly.

A fixed sleep waits for a duration without describing the condition the test needs. Here, the useful condition is the status changing to **“Profile saved.”** Let the assertion end the wait when that result appears.

### 4. Diagnose problems before and after the action separately

If `saveButton.click()` times out, inspect the element before the save request:

- Did form validation keep the button disabled?
- Is a loading mask or cookie banner intercepting the click?
- Is an animation keeping the button unstable?
- Did the locator find a hidden duplicate?

If `click()` succeeds but `toHaveText('Profile saved')` times out, inspect what happened afterward:

- Did the request fail?
- Did the application show an error?
- Is the assertion observing the wrong status region or page?
- Does the expected result match the requirement?

These failures have different causes. Separating them makes the Playwright error and trace easier to use.

### 5. Wait for a browser event when the result is an event

Some results do not appear as same-page DOM changes. An **Export CSV** button may start a download:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('customers.csv');
```

Register `waitForEvent('download')` before the click so the test cannot miss a fast event. In this scenario, the browser event is the result the test needs to capture.

The next lesson covers this pattern for downloads and other browser events in more detail.

## When to use it—and when not to

Use normal Playwright actions and let Playwright wait for action-specific element readiness.

After the action, use assertions such as `toBeVisible()`, `toHaveText()`, `toHaveValue()`, or `toHaveURL()` to wait for the UI or navigation result required by the scenario.

Use `waitForEvent()` when the result appears as a one-time browser event, such as a download or popup. Register the listener before the action that triggers it.

Use a network wait only when the response itself needs verification or provides necessary coordination that the UI cannot express. A successful response does not prove that the user-visible result is correct.

Do not use `waitForLoadState('networkidle')` as a general signal that a page is ready. Analytics, polling, or streaming connections can remain active after the usable UI appears. Wait for scenario-specific evidence such as a URL, heading, enabled control, or status message.

Increasing a timeout gives the test more time but does not define the condition it is waiting for.

## When it fails

First identify which part failed:

1. **Locator:** the element was not found, or several elements matched.
2. **Before the action:** the element was found but never became ready for that action.
3. **After the action:** the action ran, but the application entered an unexpected flow or state.
4. **Expected result:** the condition that should follow the action never appeared.
5. **Another context:** the result opened in a popup, iframe, dialog, download, or different page.

Use the Playwright error, trace, DOM snapshot, screenshot, console, and network evidence to identify where the failure occurred.

`click({ force: true })` skips some non-essential actionability checks, such as whether the target receives pointer events. It does not make an invalid form valid or prove that the expected result occurred. A larger timeout may only postpone the same failure.

Retries can help reveal that a failure occurs intermittently, but they do not repair missing synchronization. A test that passes only after retry still needs diagnosis.

When reviewing actions and waits, check:

- Which conditions does Playwright already wait for before this action?
- Which condition proves the expected result after the action?
- Does `waitForTimeout()` only guess how long processing will take?
- Was the timeout increased without defining a better readiness condition?
- Is `force` bypassing an element covered by another element without addressing the cause?
- Does the test wait for `networkidle` without a scenario-specific reason?
- If the test waits for a network response, does it still verify what the user sees?
- Does the result appear in a popup, iframe, dialog, download, or another page?

A useful wait has a clear end condition. The test should state what it is waiting for and why that state allows it to continue.

## Check your understanding

Review this test:

```ts
await page.getByRole('button', { name: 'Submit claim' }).click({
  force: true,
});

await page.waitForTimeout(3000);

expect(await page.getByText('Submitted').isVisible()).toBe(true);
```

The **Submit claim** button remains disabled until all required evidence has been uploaded. After a successful submission, the server asynchronously updates a status region to **“Claim submitted.”**

Explain:

1. Why is `force` not the right way to handle a button that remains disabled?
2. Which condition should replace the fixed sleep after submission?
3. Why is a one-time `isVisible()` check weaker than a retrying Playwright assertion?
4. How would you distinguish a failure before `click()` from a failure after submission?

## Compare your reasoning

One reasonable approach is:

- upload the required evidence first, or verify that the disabled button correctly represents an invalid form;
- use a normal `click()` so Playwright checks whether the button is ready for user interaction;
- replace the fixed sleep and one-time snapshot with `await expect(page.getByRole('status')).toHaveText('Claim submitted')`;
- diagnose a click failure by inspecting the button and validation state before submission; and
- diagnose an assertion failure by inspecting the request, error message, and application state after the click.

`force` does not make the missing evidence valid. The revised test waits for the condition that proves submission succeeded.

## Before you continue

You should now be able to distinguish what Playwright waits for before an action from what the scenario must wait for and verify afterward.

Complete the Core Practice that saves a profile and waits for the correct status without `waitForTimeout()`.

This lesson has no separate Additional Practice. Its completion proof is the difference between element readiness and the application result that appears after an action. The dynamic-table exercise remains available as standalone locator practice.
