---
title: 'Choose the Right Action for Each Interaction'
description: 'Choose Playwright actions based on how users interact with the application and the state or behavior the scenario requires.'
---

## After this lesson, you can

- choose a Playwright action based on the state required by the scenario;
- explain why `check()` is safer than clicking a checkbox blindly;
- distinguish when to use `fill()`, `press()`, and `pressSequentially()`;
- interact appropriately with native controls, custom controls, uploads, and drag-and-drop; and
- review interaction code for actions that do not match the required state or behavior.

## Why this matters for QA

A test can run an action successfully and still use the wrong interaction for the scenario.

Suppose a checkout test must ensure that **Express delivery** is enabled. The code says:

```ts
await page.getByLabel('Express delivery').click();
```

`click()` toggles the checkbox from its current state. If test data, browser state, or a product change leaves **Express delivery** checked already, that line turns it off.

The scenario requires Express delivery to be enabled. Performing a click is not enough.

Before choosing an action, answer two questions:

1. How does the user interact with this control?
2. Which state or behavior does the scenario require?

Playwright methods are more than syntax to memorize. Choose the method that best matches the user interaction and the result the scenario needs.

## The mental model

Use this chain:

```text
Scenario goal
      ↓
Control used by the user
      ↓
Action that matches the required state or behavior
      ↓
Result to verify
```

The type of control matters, but the scenario determines which action fits:

| What the scenario needs                           | Usual action          | Why                                                    |
| ------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| Click a button or link                            | `click()`             | The user activates that control                        |
| Set a field to a known value                      | `fill()`              | The final field value matters                          |
| Ensure a checkbox or radio is selected            | `check()`             | The control must reach the checked state               |
| Ensure a checkbox is not selected                 | `uncheck()`           | The checkbox must reach the unchecked state            |
| Choose an option from a native `<select>`         | `selectOption()`      | It uses the native behavior of the `<select>` element  |
| Send a key to one control                         | `locator.press()`     | The key has a specific target                          |
| Test behavior triggered by every keystroke        | `pressSequentially()` | Each key event matters to the behavior under test      |
| Upload a file through a file input                | `setInputFiles()`     | It sets the browser's selected file                    |

The action performs the interaction. An assertion verifies whether the application produced the expected result. The next lesson covers that verification boundary in more depth.

## Work through a realistic example

The checkout requirement says:

> Set the quantity to 3, choose Courier delivery, enable Express delivery, place the order, and show a confirmation for 3 Express items.

### 1. Identify the controls used by the user

```ts
const quantity = page.getByLabel('Quantity');
const deliveryMethod = page.getByLabel('Delivery method');
const expressDelivery = page.getByLabel('Express delivery');
const placeOrder = page.getByRole('button', { name: 'Place order' });
```

Module 4 covered how to choose and scope locators. The focus now is choosing the right action for each control.

### 2. Use `fill()` when the final value matters

```ts
await quantity.fill('3');
```

`fill()` focuses the editable control and replaces its value. In this scenario, the important result is a quantity value of `3`.

The test does not need a longer interaction such as:

```ts
await quantity.click();
await quantity.press('ControlOrMeta+A');
await quantity.pressSequentially('3', { delay: 100 });
```

Those steps add timing and platform behavior that the scenario does not cover.

Use `pressSequentially()` when the application reacts to each key event, such as an autocomplete that displays suggestions while the user types. A delay does not prove that suggestions finished loading, so verify the suggestions with an assertion.

### 3. Use `selectOption()` for a native `<select>`

```ts
await deliveryMethod.selectOption({ label: 'Courier' });
```

`selectOption()` works with a real HTML `<select>`.

A custom dropdown may expose a button or combobox that opens a listbox. Its flow may require clicking the trigger and choosing an option by role. Inspect the element and its behavior instead of using `selectOption()` because the component looks like a dropdown.

### 4. Use `check()` to ensure the checkbox is enabled

```ts
await expressDelivery.check();
```

If the checkbox is already checked, `check()` leaves it checked. Otherwise, Playwright checks it and verifies the resulting state.

This is safer than a blind `click()`, which only toggles the current state.

Use `uncheck()` when the scenario requires the checkbox to be off. For a radio button, use `check()` to select the required option. Selecting another option normally changes the active choice within the radio group, so radio buttons are not usually unchecked directly.

### 5. Perform the action and verify the result

```ts
await placeOrder.click();

await expect(page.getByRole('status')).toHaveText(
  'Order placed: 3 items, Courier Express',
);
```

`click()` performs the **Place order** action. The assertion then verifies that the expected confirmation appears.

If the requirement says that pressing **Enter** from the quantity field submits the form, use:

```ts
await quantity.press('Enter');
```

Use `locator.press()` when the key belongs to one specific control. Use `page.keyboard` when the scenario requires page-level keyboard state, such as holding **Shift** while selecting several items.

### 6. Match specialized actions to the interaction under test

Playwright also supports interactions such as:

```ts
await page.getByRole('button', { name: 'Products' }).hover();
await source.dragTo(target);
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
```

A path passed to `setInputFiles()` must exist in the test runner's filesystem. When the scenario only covers upload behavior, a small in-memory file payload may be a better fit.

In either case, verify how the application responds to the uploaded file. A method returning successfully does not prove that the product accepted or processed it correctly.

## When to use it—and when not to

Choose the Playwright action that most directly represents the user interaction required by the scenario. This keeps the connection between the requirement and code clear during review.

Use `fill()` when the final field value matters.

Use `pressSequentially()` when the application responds to each key event, such as an autocomplete or input with per-keystroke behavior. Do not use it merely to make automation look more human.

Use `locator.press()` for a key directed at one control. Use `page.keyboard` when the scenario requires keyboard state across the page.

Use `check()` or `uncheck()` when a checkbox must reach a specific state. Use `click()` when toggling itself is the behavior under test, such as verifying that each click opens or closes a disclosure.

Use `selectOption()` only for a native `<select>`. For a custom dropdown, inspect how the component works and follow the interaction available to the user.

Do not use `dispatchEvent('click')` as a routine replacement for `click()`. It dispatches the event programmatically without the same actionability checks or complete browser input sequence as a user click. Use it only when dispatching the event itself is part of the requirement.

Do not treat `click({ force: true })` as the default fix for a failed click. Force bypasses some actionability checks, including whether another element would receive the click. Keep it only when the unusual interaction is intentional and the reason is documented.

## When it fails

When an action fails, do not immediately add a sleep or force the interaction. Check:

1. Does the locator identify the intended control uniquely?
2. Does the action match the control type, such as a native `<select>`, file input, checkbox, or custom component?
3. Is the control visible and enabled in the current state?
4. Is an overlay, animation, sticky header, or another element intercepting the interaction?
5. Does the scenario require a state such as checked rather than a gesture such as click?
6. Did the action succeed while the later assertion failed? If so, investigate the expected result instead of changing the action.

For a failing upload, inspect the fixture path from the test runner's working directory, file size and type rules, and any validation message displayed by the application.

For a failing custom dropdown, inspect its accessible roles and the interaction available to users. Replacing the flow with a CSS selector or forced click may hide the useful clue.

When reviewing test actions, check:

- Does the action match the state or behavior required by the scenario?
- Could `click()` turn an already-checked checkbox off?
- Does `pressSequentially()` cover real per-key behavior, or only add delay?
- Is `selectOption()` being used on a native `<select>`?
- Is the key press directed at the correct control?
- Does the code use `force`, `dispatchEvent`, or `page.keyboard` without a supporting requirement?
- Does an assertion verify the result after the action?
- Would the test remain correct if its starting state changed?

Interaction code that looks plausible can still perform the wrong behavior. Review the action against the control, starting state, and scenario requirement.

## Check your understanding

Review this notification-settings test:

```ts
await page.getByLabel('Email alerts').click();
await page.getByLabel('Frequency').click();
await page.getByText('Daily').click();
await page.keyboard.type('qa@example.com', { delay: 100 });
await page.getByText('Save').click({ force: true });
```

You learn that:

- **Email alerts** is a checkbox that must be enabled;
- **Frequency** is a native `<select>`;
- the email field has the label **Notification email**; and
- **Save** is a visible button that should be normally clickable.

Explain:

1. Which actions should change?
2. Which action fits each control?
3. Why does each replacement better match the scenario?
4. What result should the test verify after **Save**?

## Compare your reasoning

One reasonable approach is:

- use `check()` for **Email alerts** because the scenario requires the checkbox to be checked;
- use `selectOption({ label: 'Daily' })` for the native **Frequency** `<select>`;
- use `getByLabel('Notification email').fill('qa@example.com')` because the final field value matters;
- locate **Save** by its button role and use a normal `click()`;
- investigate why the previous code needed `force` instead of preserving it; and
- verify a specific confirmation message or persisted values after reload, according to the requirement.

Each replacement now matches the control and the behavior required by the scenario.

## Before you continue

You should now be able to choose Playwright actions from user interaction and scenario state, distinguish state-setting from toggling, and challenge low-level input or forced actions that have no clear reason.

Complete the Core Practice that combines form values, checkbox state, and a checkout result.

Additional Practice covers `fill()`, selection, checkbox, keyboard, and upload behavior. The click, hover, and drag-and-drop exercises remain available as standalone Practice when they are relevant to your project.
