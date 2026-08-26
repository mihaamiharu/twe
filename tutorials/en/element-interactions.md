---
title: 'Choose Actions That Express User Intent'
description: 'Select Playwright actions by the state or behavior a user intends, not by whichever method happens to change the DOM.'
---

## After this lesson, you can

- choose an action that expresses the intended user state;
- explain why `check()` is safer than a blind click for a checkbox;
- distinguish `fill()`, `press()`, and `pressSequentially()`;
- recognize when native controls, custom controls, and specialized interactions need different handling; and
- review generated interaction code for hidden assumptions.

## Why this matters for QA

Misleading automation failures often begin with code that technically changes the page but does not express what the scenario means.

Suppose a checkout test needs Express delivery enabled. Generated code might say:

```ts
await page.getByLabel('Express delivery').click();
```

That click toggles the checkbox. If previous test data, browser state, or a product change leaves it checked already, the same line turns Express delivery off. The code describes a gesture, not the required state.

A QA engineer should be able to answer two questions before choosing an action:

1. What would the user do?
2. What state or behavior does the requirement actually need?

Playwright methods are not just syntax to memorize. A well-chosen method records that intent and gives the runner better information about how to interact safely.

## The mental model

Use this chain:

```text
Scenario intent
      ↓
Control and behavior
      ↓
Action that expresses the desired state
      ↓
Observable result
```

The control matters, but the desired result matters more:

| Intent                                           | Usual action          | Why                                                |
| ------------------------------------------------ | --------------------- | -------------------------------------------------- |
| Activate a button or link                        | `click()`             | The user activates one control                     |
| Replace text with a known value                  | `fill()`              | The final field value is the intent                |
| Ensure a checkbox or radio is selected           | `check()`             | It expresses a required checked state              |
| Ensure a checkbox is not selected                | `uncheck()`           | It expresses a required unchecked state            |
| Choose from a native `<select>`                  | `selectOption()`      | It uses the browser's native selection behavior    |
| Send a key to a particular control               | `locator.press()`     | The key has a clear target                         |
| Exercise behavior that depends on each keystroke | `pressSequentially()` | The individual key events are part of the behavior |
| Upload through a file input                      | `setInputFiles()`     | It sets the browser file selection                 |

An action does not prove its business outcome. It only performs the interaction. The next lesson will make that boundary explicit.

## Work through a realistic example

The checkout requirement says:

> Set the quantity to 3, choose Courier delivery, enable Express delivery, place the order, and show a confirmation for 3 Express items.

### 1. Describe the controls by user-facing meaning

```ts
const quantity = page.getByLabel('Quantity');
const deliveryMethod = page.getByLabel('Delivery method');
const expressDelivery = page.getByLabel('Express delivery');
const placeOrder = page.getByRole('button', { name: 'Place order' });
```

These locators state which controls matter. Module 4 covered how to choose and narrow them. This module focuses on what to do with them.

### 2. Set a known text value with `fill()`

```ts
await quantity.fill('3');
```

`fill()` focuses the editable control and replaces its value. It is the normal choice when the requirement cares about the final value.

This generated alternative is usually unnecessary:

```ts
await quantity.click();
await quantity.press('ControlOrMeta+A');
await quantity.pressSequentially('3', { delay: 100 });
```

It adds timing and platform behavior without adding coverage. Use sequential typing only when the product reacts to each key event—for example, an autocomplete that fetches suggestions while the user types. Even then, do not use the delay as proof that suggestions loaded; assert the suggestions separately.

### 3. Use the API that matches a native selection control

```ts
await deliveryMethod.selectOption({ label: 'Courier' });
```

`selectOption()` is for a real HTML `<select>`. A custom dropdown may instead expose a button or combobox that opens a listbox, so its user flow might require clicking the trigger and then selecting an option by role. Do not force `selectOption()` onto a control just because it looks like a dropdown.

### 4. Express checkbox state instead of toggling it

```ts
await expressDelivery.check();
```

If the checkbox is already checked, `check()` leaves it checked. If it is unchecked, Playwright changes it and verifies the checked state. That makes reruns and changing starting states safer than a blind toggle.

Use `uncheck()` when the required state is off. For a radio button, `check()` expresses the selected choice; radio buttons are not normally unchecked directly because selecting another option changes the group.

### 5. Activate the business action and prove the result

```ts
await placeOrder.click();

await expect(page.getByRole('status')).toHaveText(
  'Order placed: 3 items, Courier Express',
);
```

The click communicates the activation. The assertion communicates the evidence. Keeping both visible makes the scenario reviewable.

If the requirement specifically says pressing Enter from the quantity field submits the form, target that behavior:

```ts
await quantity.press('Enter');
```

Prefer `locator.press()` when a key belongs to one control. Use `page.keyboard` only when global keyboard state is genuinely under test, such as holding Shift while selecting several items across the page.

### 6. Treat specialized actions as specialized behavior

Playwright also supports interactions such as:

```ts
await page.getByRole('button', { name: 'Products' }).hover();
await source.dragTo(target);
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
```

A path passed to `setInputFiles()` must exist in the test runner's filesystem. A small in-memory file payload can be better when only the upload behavior matters. In either case, assert the application's response to the file—not merely that the method returned.

## When to use it—and when not to

Use the highest-level Playwright action that describes the scenario. This gives reviewers a direct connection between requirement and code.

Use `fill()` for known field values. Use `pressSequentially()` when per-character keyboard behavior is the feature being tested, not to make automation look more human. Use `locator.press()` for a key directed at one control and `page.keyboard` for true page-level keyboard state.

Use `check()` or `uncheck()` when checkbox state matters. A raw `click()` is appropriate when toggling itself is the behavior under test—for example, verifying that each click alternates a disclosure state.

Use `selectOption()` only for a native `<select>`. Inspect custom dropdown semantics and follow their real interaction contract.

Avoid `dispatchEvent('click')` as a routine substitute for user interaction. It dispatches an event programmatically and does not perform the same actionability checks or complete browser input sequence as a real click. It is suitable only when dispatching that event is itself the deliberate requirement.

Avoid `click({ force: true })` as a default fix. Force can bypass some actionability protection, including whether another element would receive the click. Keep it only when the unusual interaction is intentional and documented.

## When it fails

When an action fails, do not immediately add a sleep or force it. Start from the contract:

1. Did the locator resolve to the intended and unique control?
2. Is the control the type you assumed—a native select, file input, checkbox, or custom widget?
3. Is it visible and enabled for the current business state?
4. Is an overlay, animation, sticky header, or another element intercepting input?
5. Does the scenario need a desired state such as checked, rather than a gesture such as click?
6. Did the action succeed but the later expected result fail? That is an outcome problem, not an action problem.

For a failing upload, also check the fixture path from the runner's working directory, file size/type rules, and whether the application renders validation on the same page.

For a failing custom dropdown, inspect its accessible roles and actual interaction. Replacing a semantic flow with CSS and force usually hides the useful clue.

## Review generated work

For each generated action, ask:

- Does the method express the required state or only a gesture?
- Could `click()` invert a checkbox that is already in the correct state?
- Is `pressSequentially()` covering real per-key behavior, or only adding delay?
- Is `selectOption()` being used on a real `<select>`?
- Does a key press have the correct focused target?
- Does the code use `force`, `dispatchEvent`, or page-level keyboard input without a requirement that justifies it?
- Is there an observable assertion after the action?
- Would the test remain correct if the starting state changed?

AI can produce plausible interaction syntax. Your job is to decide whether that syntax represents the user's behavior and the product risk.

## Check your understanding

Review this generated code for a notification settings test:

```ts
await page.getByLabel('Email alerts').click();
await page.getByLabel('Frequency').click();
await page.getByText('Daily').click();
await page.keyboard.type('qa@example.com', { delay: 100 });
await page.getByText('Save').click({ force: true });
```

You learn that Email alerts is a checkbox that must be enabled, Frequency is a native `<select>`, the email field has the label Notification email, and Save is a visible button that should be normally clickable.

Explain which actions you would change, what intent each replacement expresses, and what result should be asserted.

## Compare your reasoning

One reasonable approach is:

- use `check()` for Email alerts because enabled is the required state;
- use `selectOption({ label: 'Daily' })` for the native Frequency select;
- use `getByLabel('Notification email').fill('qa@example.com')` because only the final value matters;
- use a button-role locator and normal `click()` for Save;
- investigate why the generated code used force instead of preserving it; and
- assert a specific saved status or the persisted values after reload, according to the requirement.

The important improvement is not fewer lines. Each action now explains the state or behavior the test intends to create.

## Before you continue

You should now be able to select actions from scenario intent, distinguish state-setting from toggling, and challenge generated code that adds low-level input or force without a reason.

Complete the Core Practice that combines form values, checkbox state, and a checkout outcome. The smaller click, fill, select, keyboard, hover, drag-and-drop, and upload exercises remain available as Additional Practice when you want focused repetition.
