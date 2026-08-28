---
title: 'Choose Locator Contracts That Match the Test Intent'
description: 'Choose roles, labels, visible content, or explicit test contracts based on what the scenario needs to recognize.'
---

## After this lesson, you can

- choose a Playwright locator based on the meaning the test must preserve;
- explain which harmless changes a locator should survive and which meaningful changes should make it fail;
- verify accessible names, labels, test IDs, and product wording in the live UI before choosing a contract;
- justify why CSS or XPath is a fallback for a particular target; and
- diagnose a locator that resolves to zero or several elements before weakening it.

## Why this matters for QA

Imagine an AI-generated checkout test that uses:

```ts
page.locator('div.checkout > div:nth-child(3) > button.primary');
```

It passes today. Tomorrow a designer adds a wrapper, and the test fails even though checkout still works. Someone copies a longer selector from DevTools, gets another green run, and calls the test fixed.

The opposite problem is just as dangerous. If a real button loses its button semantics, replacing `getByRole('button')` with a CSS class can make automation green while hiding an accessibility regression.

A locator is not merely a route to an element. It is a decision about which product change should matter to the test.

## The mental model

Treat every locator as a contract between the QA intent and the live page:

```text
What meaning must survive harmless change?
                    ↓
Which page signal expresses that meaning?
                    ↓
Which change should make this test fail?
```

Start with the test intent, not with a selector preference. Identify the evidence the test needs to preserve, then inspect the live DOM and accessibility information to see which contract actually exists.

![A locator decision starts with test intent, then chooses a user-facing, engineering, or implementation contract based on what the scenario needs to preserve.](/images/tutorials/locator-contract-decision.svg)

_There is no universal locator ladder. The right contract depends on what the test is trying to recognize._

Use the page signal that matches the risk:

| Locator                     | Contract it expresses                         | Useful when                                                         |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `getByRole(role, { name })` | Semantic role and accessible name             | A user activates or recognizes a control or landmark                |
| `getByLabel(text)`          | A form control's associated label             | The label-to-field relationship matters                             |
| `getByText(text)`           | User-visible content                          | The displayed wording or message is evidence                        |
| `getByAltText(text)`        | The text alternative of an image-like element | The image's conveyed purpose matters                                |
| `getByPlaceholder(text)`    | Placeholder wording                           | The placeholder itself is the available, intended contract          |
| `getByTestId(id)`           | An explicit engineering agreement             | User-facing wording or semantics cannot identify the target cleanly |
| `locator(css)`              | A DOM or attribute relationship               | A deliberate implementation fallback is necessary                   |
| `locator('xpath=...')`      | A DOM path or relationship                    | Maintaining legacy or unusually hostile markup                      |

An accessible name is not always the raw text inside an element. It may come from an associated `label`, `aria-label`, `aria-labelledby`, image alternative text, or contained content according to accessibility rules.

A test ID can be resilient because the team agrees to preserve it. It does not prove that a user can understand or operate the element.

Before writing code, name the target, the evidence it should produce, and the meaningful change that should make the test fail. Then verify that the live DOM actually exposes the signal you chose. This keeps generated locator review tied to QA intent rather than selector preference.

## Work through a realistic example

The risk is:

> A customer edits a delivery address, but the new address is not saved.

The relevant page contains a labelled street field, a Save address button, and a status message after the operation succeeds.

### 1. Start from the behavior, not the DOM

The customer recognizes the field by its label:

```ts
const street = page.getByLabel('Street address');
```

This contract should survive a new generated `id`, a wrapper around the input, or a styling-class change. It should fail if the field is no longer associated with the label—useful feedback for both usability and accessibility.

The customer recognizes the action as a button named Save address:

```ts
const saveAddress = page.getByRole('button', {
  name: 'Save address',
});
```

Using the role without a name would be ambiguous if the page also has Cancel, Delete, or Save payment buttons.

### 2. Connect action to observable evidence

```ts
await street.fill('18 Market Street');
await saveAddress.click();

await expect(page.getByRole('status')).toHaveText('Delivery address updated');
```

The field and button locators express user interaction. The status assertion expresses the observable product result. One locator type does not need to serve every responsibility.

### 3. Decide what localization should change

If this scenario verifies the Indonesian experience, the visible contracts should use the Indonesian label, button name, and result text.

If the team runs one language-independent workflow and wording is not the risk, an agreed test ID may identify the action:

```ts
await page.getByTestId('save-delivery-address').click();
```

The test should still assert the correct localized result separately when localization quality matters. Switching to a test ID merely to avoid maintaining valid localized expectations would weaken the test.

### 4. Treat missing semantics as evidence

Suppose the page uses this custom control:

```html
<div class="save-action">Save address</div>
```

A CSS locator can reach it, but that does not make the control accessible or keyboard-operable. Record the product defect or testability gap. A temporary implementation locator should be documented as a bridge, not treated as the final strategy.

## When to use it—and when not to

Use role and accessible name when the scenario depends on how users perceive or activate a control. Use a label when the field-label relationship is the contract. Use visible text when the wording or displayed content is itself evidence.

Use a test ID when the team intentionally wants a language-independent or non-user-facing engineering contract—for example, a chart canvas or technical counter with no useful visible identity.

Placeholder text can locate a field, but a placeholder does not replace a proper label. Do not let a successful placeholder locator hide an accessibility problem.

Do not choose a locator because it is shortest, newest, or first in a preference list. Do not choose a regular expression when an exact stable name would better expose unintended wording changes.

Use CSS or XPath only after you can explain why a user-facing locator, composition, or explicit test contract cannot express the target adequately.

## When it fails

Suppose this locator finds nothing:

```ts
page.getByRole('button', { name: 'Save address' });
```

Before replacing it with `button.primary`, inspect:

1. Did the test reach the expected page and state?
2. Is the target actually a button in the accessibility tree?
3. What accessible name does the browser expose?
4. Is the control inside a dialog, iframe, or different browser context? An iframe needs its own frame context; changing the selector does not cross that boundary.
5. Was the wording translated or intentionally changed?
6. Is the control missing, disabled, or replaced by an error state?

If several elements match, ask whether the page contains repeated components or duplicated accessible names. Lesson 2 will show how to scope repeated controls without using position as a shortcut.

Changing to a broader CSS selector, adding `.first()`, or making every name a loose regular expression can hide the reason the contract failed.

## Review AI-assisted work

For each generated locator, ask:

- What user, domain, or engineering meaning does it express?
- Which harmless changes should it survive?
- Which meaningful regression should make it fail?
- Did AI invent visible text, an ARIA attribute, or a test ID?
- Is a test ID supported by the product team or merely assumed?
- Is a regular expression hiding an unexpected wording difference?
- Did AI replace a semantic failure with a structural selector?
- Can the locator resolve to more than one element in the real starting state?

Generated selectors are proposals. Verify them against the live DOM, accessibility information, product language, and test intent.

## Check your understanding

Review these generated locators for a payment form:

```ts
const cardNumber = page.locator('#field-9281');
const pay = page.getByText(/pay/i);
const receiptChart = page.getByRole('img', { name: 'chart' });
```

The product has:

- a visible label “Card number” associated with the input;
- two controls containing the word “pay”: “Pay now” and “Payment help”; and
- a canvas whose agreed automation contract is `data-testid="receipt-chart"`.

For each locator:

1. Choose a more suitable contract.
2. Explain which harmless change it should survive.
3. Explain which product change should make it fail.
4. Identify any information you would verify before writing the final locator.

## Compare your reasoning

One reasonable answer is:

- Use `getByLabel('Card number')` so generated IDs and wrapper changes do not matter, while a broken label association remains visible.
- Use `getByRole('button', { name: 'Pay now' })` so the intended interactive control is unique and a changed action name is reviewed deliberately.
- Use `getByTestId('receipt-chart')` because the canvas has an agreed engineering contract and no meaningful user-facing identity in this scenario.
- Verify the live accessible names, element roles, locale, and test-ID convention rather than trusting the written description alone.

Different product requirements may change the choice, but every choice should state its contract.

## Before you continue

You should now be able to choose a locator from the test intent, explain what it is allowed to survive, and investigate zero or multiple matches without immediately falling back to DOM structure.

Complete the Core Practice that uses a role, accessible name, action, and observable outcome. The next lesson will handle repeated cards, rows, and dialogs where a good locator still needs meaningful scope.
