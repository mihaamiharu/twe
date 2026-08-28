---
title: 'Choose Locators That Match the Test Intent'
description: 'Choose locators using information users rely on, such as roles, labels, and visible text, or a test ID when the target has no stable UI identifier.'
---

## After this lesson, you can

- choose a Playwright locator based on information that matters to the test scenario;
- distinguish UI changes that should not affect a locator from meaningful changes that should make the test fail;
- inspect accessible names, labels, test IDs, and product wording in the live UI before choosing a locator;
- explain when CSS or XPath is needed as a fallback; and
- diagnose a locator that finds no element or more than one element before reaching for `first()`, a broader selector, or another shortcut just to make the test pass.

## Why this matters for QA

Imagine an AI-generated checkout test that uses:

```ts
page.locator('div.checkout > div:nth-child(3) > button.primary');
```

It passes today. Tomorrow a designer adds a wrapper, and the test fails even though checkout still works.

Copying a new selector from DevTools may make the test pass again, but it does not fix the root cause. The locator still depends on HTML structure that does not matter to the checkout scenario.

The opposite problem can happen too.

Suppose an element that should be a button is changed into a clickable `div`. If `getByRole('button')` then fails, inspect the markup before changing the locator.

Do not immediately replace it with a CSS selector just to get a green test. The product change may be an accessibility regression the team needs to know about.

Choose a locator based on what matters to the scenario. Avoid depending on HTML details that can change without affecting product behavior.

## The mental model

When choosing a locator, start with what matters to the test scenario:

```text
What should the test recognize?
                  ↓
Which information on the page best identifies that element?
                  ↓
Which change should make the locator fail?
```

Do not start with whichever selector is easiest to write.

First identify the element the scenario needs. Then inspect the live DOM and accessibility information to see which locator best represents it. In that sense, the locator acts as a contract: it records which page information the test expects to remain meaningful.

![A locator decision starts with test intent, then chooses a user-facing, engineering, or implementation contract based on what the scenario needs to preserve.](/images/tutorials/locator-contract-decision.svg)

_There is no locator order that is always correct. Choose based on what matters to the test scenario._

Use the page information that best identifies the target:

| Locator                     | Information it uses                            | Useful when                                                                   |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `getByRole(role, { name })` | Semantic role and accessible name              | Users recognize the element as a button, link, checkbox, or another control  |
| `getByLabel(text)`          | A label associated with a form control         | Users rely on the label to identify the field                                |
| `getByText(text)`           | Visible text                                   | Displayed wording or a message matters to the scenario                       |
| `getByAltText(text)`        | Alternative text for an image-like element     | The meaning or purpose conveyed by the image matters                         |
| `getByPlaceholder(text)`    | A field's placeholder                          | The placeholder is an intentional and sufficiently stable identifier        |
| `getByTestId(id)`           | A test ID provided for automation              | The target has no stable role, label, or visible text                        |
| `locator(css)`              | DOM structure or an attribute                  | Implementation details are deliberately needed as a fallback                 |
| `locator('xpath=...')`      | A DOM path or relationship between elements    | Legacy markup or an unusual case is difficult to handle with other locators  |

An accessible name is not always the raw text inside an element. It may come from an associated `label`, `aria-label`, `aria-labelledby`, image alternative text, or contained content according to accessibility rules.

A `data-testid` can be reliable when the team agrees to keep it stable. It only helps automation find the element; it does not prove that the element has correct semantics or accessibility.

Before writing a locator, identify which element the scenario needs and why it matters. Then inspect the live DOM and accessibility information to confirm that the role, label, text, or test ID you intend to use actually exists.

This also helps when reviewing a generated locator: you can judge whether it matches the scenario, not only whether its selector happens to find an element.

## Work through a realistic example

The risk is:

> A customer edits a delivery address, but the new address is not saved.

The page contains a street-address field, a **Save address** button, and a status message that appears after the change is saved.

### 1. Start from the behavior, not the DOM

The customer recognizes the field by its label:

```ts
const street = page.getByLabel('Street address');
```

This locator should continue working if a generated `id` changes, a wrapper is added around the input, or a styling class is replaced.

If the field is no longer associated with the correct label, however, the locator should fail. That failure may reveal a markup or accessibility problem worth investigating.

The customer also recognizes the action as a button named **Save address**:

```ts
const saveAddress = page.getByRole('button', {
  name: 'Save address',
});
```

Using only the `button` role is not enough if the page also contains **Cancel**, **Delete**, or **Save payment** buttons. The accessible name helps automation select the action that belongs to this scenario.

### 2. Connect the action to a result you can verify

```ts
await street.fill('18 Market Street');
await saveAddress.click();

await expect(page.getByRole('status')).toHaveText('Delivery address updated');
```

The field and button locators perform actions in the same way a user would. The assertion then verifies the result that should appear after the address is saved.

Every part of the test does not need to use the same locator type. Choose each locator based on the role its element plays in the scenario.

### 3. Match the locator to the purpose of the localization test

If this scenario verifies the Indonesian experience, use the Indonesian label, button name, and result text shown in the UI.

If the same test runs across several languages and wording is not what it verifies, a `data-testid` may identify the same action:

```ts
await page.getByTestId('save-delivery-address').click();
```

When localization quality is part of the risk, verify the translated text separately.

Do not switch to a `data-testid` merely to avoid checking wording that is expected to be correct in each language.

### 4. Do not ignore missing semantics

Suppose the page uses this custom control:

```html
<div class="save-action">Save address</div>
```

A CSS locator can find this element, but it does not turn the `div` into an accessible or keyboard-operable control.

If the element is intended to behave as a button, investigate whether this is a markup defect or a testability problem that should be fixed.

A CSS locator may be used temporarily when necessary, but do not treat it as the final solution merely because the test passes.

## When to use it—and when not to

Use a role and accessible name when the test depends on how users recognize or operate a control. Use a label for a form field that users identify by its label. Use visible text when displayed wording or a message matters to the scenario.

Use a `data-testid` when the element is difficult to find using user-facing information, or when the team deliberately needs a stable, language-independent identifier. Examples include a chart canvas or a technical element with no useful visible text or accessible name.

Placeholder text can locate a field, but a placeholder does not replace a proper label. If a field should have a label but automation can only find its placeholder, inspect the markup and accessibility before accepting that locator.

Do not choose a locator merely because it is shortest, newest, or first in a recommendation list.

A regular expression is not automatically better either. If an exact name is stable and its wording matters, an exact match can expose unintended text changes.

Use CSS or XPath as a fallback when a role, label, text, test ID, or composed locator still cannot identify the target clearly. Before using one, be able to explain why a locator closer to user behavior does not fit this case.

## When it fails

Suppose this locator finds nothing:

```ts
page.getByRole('button', { name: 'Save address' });
```

Before immediately replacing it with `button.primary`, inspect:

1. Has the test reached the correct page and state?
2. Does the browser actually recognize the element as a button?
3. Which accessible name does the browser expose?
4. Is the element inside a dialog, iframe, or another context? An iframe requires the locator to run in the correct frame; changing the selector alone will not solve that problem.
5. Did the wording change because of localization or an intentional product change?
6. Is the element missing, disabled, or replaced by an error state?

If several elements match, check whether the page contains repeated components with the same button or whether the accessible name is duplicated.

The next lesson will show how to narrow a locator using the element's context without relying immediately on position through `.first()` or `.nth()`.

Do not switch to a broader CSS selector, add `.first()`, or make the name matcher too loose just to get a green test. First find out why the original locator did not identify the expected target.

## Review AI-assisted work

For each generated locator, check:

- Does it match how users recognize the element or what the test scenario needs?
- Which UI changes should not make it fail?
- Which meaningful changes should make the test fail?
- Did AI invent visible text, an ARIA attribute, or a test ID that does not exist?
- If it uses a test ID, is that identifier actually available and maintained by the team?
- Is a regular expression so loose that it could hide an unexpected wording change?
- Did AI replace a semantic locator with CSS or a structural selector merely to make the test pass?
- Does the locator find the correct target in the real starting state?

Do not use a generated locator without reviewing it. Compare it with the live DOM, accessibility information, wording displayed in the UI, and the purpose of the test scenario.

## Check your understanding

Review these generated locators for the following payment form:

```ts
const cardNumber = page.locator('#field-9281');
const pay = page.getByText(/pay/i);
const receiptChart = page.getByRole('img', { name: 'chart' });
```

The product actually has:

- a visible label “Card number” associated with the input;
- two controls containing the word “pay”: “Pay now” and “Payment help”; and
- a canvas with `data-testid="receipt-chart"`, which the team has agreed to maintain for automation.

For each locator:

1. Choose a locator that better matches the intended target.
2. Explain which UI changes should not make that locator fail.
3. Explain which meaningful changes should make it fail.
4. Identify what you still need to inspect on the page before writing the final locator.

## Compare your reasoning

One reasonable answer is:

- Use `getByLabel('Card number')` so a generated ID change or an added wrapper does not affect the locator. If the label-to-input association breaks, the test can still expose that problem.
- Use `getByRole('button', { name: 'Pay now' })` so automation selects the intended button instead of another element that happens to contain the word “pay.” If the action name changes, check whether that change matches the product requirement.
- Use `getByTestId('receipt-chart')` because the canvas has an agreed test ID for automation and no role or visible text that fits this scenario.
- Inspect the role, accessible name, locale, and test ID that actually exist on the page. Do not rely only on a written description or a generated locator.

Different product requirements may lead to different locator choices. What matters is being able to explain why a locator fits the target and the purpose of the test.

## Before you continue

You should now be able to choose a locator based on the test scenario, explain which UI changes it should survive, and investigate zero or multiple matches before changing strategy.

Complete the Core Practice that uses a role, accessible name, action, and expected result.

In the next lesson, you will learn how to scope locators when a page contains several cards, rows, or dialogs with similar elements.
