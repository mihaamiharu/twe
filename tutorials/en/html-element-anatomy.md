---
title: 'Read HTML by Meaning, Name, and State'
description: 'Inspect what a control is, how users identify it, and which state matters before choosing automation code.'
---

## After this lesson, you can

- identify an element's semantic role, accessible name, and relevant state;
- explain why native HTML usually creates a clearer contract than a clickable generic element;
- distinguish styling attributes, product-facing identity, and explicit testability contracts; and
- review a small piece of markup for accessibility and automation risks.

You do not need to memorize every HTML tag or ARIA rule. The goal is to read enough of the page to make a sound QA decision.

## Why this matters for QA

Imagine that you can click a control labelled “Create account” during manual testing, but an automated test cannot find a button with that name.

The control may look like a button without actually being one. Its visible label may not be connected to the form field beside it. A generated selector may find it today but depend on a styling class that changes in the next redesign.

Manual testers can often compensate for unclear markup by looking at layout and context. Browser automation needs a repeatable contract. Assistive-technology users need that contract too.

Before asking, “Which selector should I write?”, ask three earlier questions:

1. What is this control?
2. How does a user identify it?
3. What state proves the behavior we care about?

## The mental model

The browser does more than display the HTML response. It turns markup into a live Document Object Model (DOM), applies styling and behavior, and exposes accessibility information that represents meaning, name, and state.

![The browser turns markup into a live DOM, rendered UI, and accessibility information that QA can inspect before defining an automation contract.](/images/tutorials/ui-meaning-layers.svg)

_Automation should be based on the live, meaningful UI—not an isolated attribute copied from the initial markup._

For an interactive element, read these three layers:

| Layer           | Question                                               | Example                                                 |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Role            | What kind of control is it?                            | button, textbox, checkbox, link                         |
| Accessible name | How can a user or assistive technology distinguish it? | “Create account” or “Work email”                        |
| State           | What is true about it now?                             | required, checked, expanded, disabled, or current value |

Native HTML often supplies the role automatically. A `<button>` has button semantics. An `<input type="checkbox">` has checkbox semantics. ARIA can add missing information when needed, but adding redundant ARIA does not make unclear HTML better.

The accessible name is not the same thing as an `id`, `name`, or CSS class. It is the name exposed through accessibility rules. Depending on the control, it may come from visible text, a connected `<label>`, `aria-labelledby`, `aria-label`, alternative text, or another supported source.

The exact computation has rules and exceptions. As a QA engineer, do not guess it from the code alone—inspect what the browser actually exposes.

## Work through a realistic example

The product team is building an account form:

```html
<form aria-labelledby="account-heading">
  <h1 id="account-heading">Create your account</h1>

  <label for="work-email">Work email</label>
  <input
    id="work-email"
    name="email"
    type="email"
    required
    aria-describedby="email-hint"
  />
  <p id="email-hint">Use the address provided by your company.</p>

  <button type="submit">Create account</button>
</form>
```

Read it as a QA contract rather than as syntax to memorize:

- The email field has the implicit role `textbox`.
- Its accessible name is “Work email” because the `<label>` is connected through `for` and `id`.
- `required` is a relevant state or constraint.
- The hint describes the field but does not replace its name.
- The submit control is a native button named “Create account.”

Later, Playwright can express the same user-facing identity:

```ts
const email = page.getByRole('textbox', { name: 'Work email' });
const submit = page.getByRole('button', { name: 'Create account' });
```

Those lines are not magic selectors. They are claims about what the browser exposes. If the claims are wrong, inspection should reveal why.

Now compare less meaningful markup:

```html
<span>Work email</span>
<input class="field field--wide" placeholder="name@company.com" />
<div class="primary-button" onclick="submitAccount()">Create account</div>
```

Several risks appear:

- The visible text is not programmatically connected to the input.
- A placeholder is a hint, not a dependable replacement for a persistent label.
- The clickable `<div>` does not automatically provide button semantics, keyboard behavior, or focus behavior.
- The classes describe presentation and may change without any product behavior changing.

The strongest fix is usually to improve the product markup. A complicated selector can hide poor testability, but it cannot give users the missing semantics.

### Attribute, property, and current state

The initial HTML is not always the state the user is interacting with. For example:

```html
<input id="quantity" type="number" value="1" />
```

After the user changes the field to `3`, the element's current `value` property can be `3` while the original `value` attribute still represents its initial/default value. JavaScript may also add or remove attributes such as `disabled` or `aria-expanded` while the page is running.

That is why “View Source” is not enough for dynamic behavior. Inspect the live DOM and the current user-visible state.

## When to use it—and when not to

Use role, accessible name, and state when the behavior is part of what the user perceives: forms, buttons, links, dialogs, menus, status messages, and other interactive UI.

Use an explicit test contract such as `data-testid` when there is no stable, meaningful user-facing identity or when product wording is intentionally variable. A test ID can improve testability, but it should not be used to disguise a missing label or broken control semantics.

CSS attributes can be useful while inspecting structure. They are not automatically bad, but a class created only for styling is usually a weaker behavior contract. XPath is also unnecessary when role, name, or an explicit test contract already expresses the intent. Module 4 will cover that choice in depth.

Do not turn every accessibility detail into a browser test. Role-based locators provide useful feedback, but they do not replace a dedicated accessibility audit, keyboard testing, or assistive-technology testing.

## When it fails

Suppose a generated test times out here:

```ts
await page.getByRole('button', { name: 'Create account' }).click();
```

The visible page appears to contain “Create account.” Before changing the locator, inspect the control:

1. Does the live DOM contain a native `<button>` or only a styled generic element?
2. What role does the browser expose?
3. What accessible name does it expose?
4. Is the control disabled, hidden, or replaced after rendering?
5. Does more than one control have the same role and name?

If the product uses a clickable `<div>`, changing the test to a long CSS path may make the click happen, but it hides the underlying accessibility and testability problem. Prefer fixing the control. If product code cannot be changed immediately, document the limitation and use the smallest explicit fallback contract available.

A fixed delay is not a diagnosis. Time does not turn a generic element into a button or connect an orphaned label.

## Review generated work

AI may generate believable markup or a believable locator without checking the browser's computed result. Review it with questions such as:

- Does it use native HTML where a native control exists?
- Is every form control associated with a meaningful label?
- Is ARIA describing the UI, or being used as arbitrary test storage?
- Does the proposed locator match the actual role and accessible name?
- Is a styling class being treated as a stable product contract?
- Can I explain which state the assertion would prove?

Generated code is only a hypothesis until it matches the live page and the product's intended behavior.

## Check your understanding

Review this markup:

```html
<label for="email-alerts">Email alerts</label>
<input id="email-alerts" type="checkbox" checked />

<button type="button" aria-label="Remove Mechanical Keyboard">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
```

Without writing a test, answer:

1. What are the role, accessible name, and current state of the input?
2. What are the role and accessible name of the icon-only control?
3. Which details describe user behavior, and which details are only implementation structure?
4. What would you inspect in the browser before trusting your answer?

## Compare your reasoning

One reasonable answer is:

- The input is a checkbox named “Email alerts,” and its current markup indicates that it starts checked.
- The icon-only control is a button named “Remove Mechanical Keyboard.” The SVG is hidden from the accessibility tree so it does not compete with the button's name.
- The label, button meaning, product identity, and checked state describe behavior a user can perceive. The element IDs and SVG structure support the implementation but are not the behavior themselves.
- I would inspect the live DOM and accessibility information to confirm the computed names and current state, especially after JavaScript has run.

The exact state can change after interaction, so the live browser remains the source of evidence.

## Before you continue

Given an important control, you should now be able to explain what it is, how a user identifies it, which state matters, and whether its markup provides a meaningful automation contract.

In the next lesson, you will place those controls inside the live DOM tree. That context matters when the same name appears more than once and when the page replaces or removes elements after an action.
