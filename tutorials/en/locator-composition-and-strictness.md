---
title: 'Narrow Repeated UI Without Hiding Ambiguity'
description: 'Compose locators from meaningful context, filter repeated components, and use strictness as diagnostic feedback.'
---

## After this lesson, you can

- explain why a locator is resolved when an action or assertion runs;
- compose a locator from a meaningful container to its target control;
- filter repeated components by identifying content or a descendant locator;
- distinguish valid multiple-element operations from strict single-target operations; and
- diagnose ambiguity without reflexively using `first()` or `nth()`.

## Why this matters for QA

Picturing one “Add to Cart” button is easy. A real catalog may contain twenty of them.

If proposed code says this, what will happen?

```ts
await page.getByRole('button', { name: 'Add to Cart' }).click();
```

Playwright should not guess which product the customer meant. A strictness error is useful: the test intent identifies an action but not its context.

The fix is not automatically `.first()`. If sorting changes tomorrow, the first card may represent a different product and the test could perform the wrong action while staying green.

## The mental model

Repeated UI needs two identities:

```text
Meaningful container identity
        ↓
Target inside that container
        ↓
Action or assertion on one intended element
```

![A broad repeated collection is narrowed by meaningful identity and state before one target action, while zero, one, or many matches provide different diagnostic signals.](/images/tutorials/locator-scope-strictness.svg)

_Scope answers “which component?” The inner locator answers “which control inside it?”_

Locators are lazy descriptions. Creating this locator does not capture a fixed array of current elements:

```ts
const productCards = page.getByRole('article');
```

Playwright resolves the locator when an action, assertion, or query runs. That lets web assertions retry against a changing DOM, but it does not make a vague description become unique.

Strictness depends on the operation:

| Operation                        | Multiple matches allowed? | Why                                           |
| -------------------------------- | ------------------------- | --------------------------------------------- |
| `locator.click()`                | No                        | One element must receive the action           |
| `locator.fill()`                 | No                        | One field must receive the value              |
| `expect(locator).toBeVisible()`  | No                        | A single-target assertion must identify one element |
| `expect(locator).toHaveCount(3)` | Yes                       | The collection itself is under test           |
| `locator.count()`                | Yes                       | The query intentionally measures a collection |

Strictness does not mean every locator must always identify one element. It means a single-target operation must not be ambiguous.

Use the match count as a diagnostic signal:

| Match count | What to ask                                                        |
| ----------- | ------------------------------------------------------------------ |
| `0`         | Is the starting state, identity, or expected product state missing? |
| `1`         | Did the locator narrow to the intended component?                  |
| `>1`        | Which user, domain, or component context is still missing?         |

For a plural requirement, multiple matches may be correct. Assert the collection directly instead of forcing it into one target.

## Work through a realistic example

The catalog contains:

- Widget Basic — Out of Stock;
- Widget Pro — In Stock; and
- Widget Pro Max — Out of Stock.

Every card has an Add to Cart button. The risk is:

> A customer adds the in-stock Widget Pro, but the wrong product is added or no confirmation appears.

### 1. Start with the repeated component

```ts
const productCards = page.getByRole('article');
```

This intentionally describes a collection. Clicking a button across that collection would still be ambiguous.

### 2. Filter by the product identity

Prefer a descendant locator when the inner element has useful semantics:

```ts
const widgetProCard = productCards.filter({
  has: page.getByRole('heading', {
    name: 'Widget Pro',
    exact: true,
  }),
});
```

The inner locator must be in the same frame and is evaluated relative to each candidate card. `exact: true` prevents “Widget Pro Max” from satisfying the product identity.

Text filtering is also available:

```ts
const matchingCards = productCards.filter({
  hasText: 'Widget Pro',
});
```

`hasText` searches text within each candidate, including descendants, and a string match is case-insensitive substring matching. That is convenient, but it may be broader than the product contract. Use a regular expression or a semantic descendant when exact identity matters.

### 3. Narrow by relevant state

```ts
const availableWidgetPro = widgetProCard.filter({
  has: page.getByText('In Stock', { exact: true }),
});
```

Now the locator describes the product and required availability state. If the same product unexpectedly appears twice as in stock, the later click should still fail rather than choosing one silently.

An explicit count can make the contract and diagnosis clearer:

```ts
await expect(availableWidgetPro).toHaveCount(1);
```

### 4. Find the action inside the chosen component

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();

await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
```

The outer locator owns product identity and availability. The inner locator owns the action. The final assertion proves the observable result.

### 5. Treat lists as lists when the list is the subject

Suppose the requirement says the summary shows these items in this order:

```ts
await expect(page.getByRole('listitem')).toHaveText([
  'Keyboard',
  'Mouse',
  'USB Hub',
]);
```

This is intentionally plural. For web assertions, prefer retried list assertions over taking an immediate `allTextContents()` snapshot and comparing it manually.

## When to use it—and when not to

Compose from a meaningful container when controls repeat across cards, rows, dialogs, navigation regions, or forms. Use `filter({ has })` when a semantic descendant expresses identity. Use `filter({ hasText })` when contained text is the deliberate contract.

Use `toHaveCount` or a list text assertion when the collection size or order is the actual requirement.

Use `nth()`, `first()`, or `last()` only when position is part of the product behavior—for example, verifying that the first search result is the highest-ranked item. Even then, assert the content that makes the position meaningful.

Do not add `first()` merely because two elements match. Do not traverse to a parent with `locator('..')` as the first design. A region role, row, dialog, filter, or deliberate component test ID usually communicates more.

If the UI exposes no meaningful component identity, discuss semantics or a testability contract with developers instead of building an increasingly structural chain.

## When it fails

Suppose this click reports a strictness violation:

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();
```

Inspect the match at each narrowing step:

1. How many `article` elements exist?
2. Which cards match the exact Widget Pro heading?
3. Which of those contain the intended stock state?
4. Does each card contain one or several Add to Cart buttons?
5. Is a hidden duplicate, modal, mobile layout, or stale component also present?
6. Did the product actually render duplicate inventory?

If the product legitimately shows two Widget Pro offers, the test needs another domain identity such as seller, plan, or SKU. If the duplicate is a defect, `first()` would hide it.

When no card matches, verify the starting state, exact product name, current locale, loaded data, and whether the expected card is inside an iframe or different page. Making `hasText` broader may only move the problem.

Before accepting a composed locator, review it with these questions:

- Does the outer locator identify a meaningful component or merely a wrapper?
- Is the inner `has` locator relative to each outer candidate?
- Could `hasText` match a longer or unrelated value?
- Does the code prove there is exactly one intended component when uniqueness matters?
- Is `first()` or `nth()` hiding ambiguity?
- Are many independent risks being collapsed into one loop and one report result?
- Does the final assertion prove the selected item's outcome?
- Would a small semantics or test-ID improvement simplify the locator substantially?

Long code is not automatically robust. Every narrowing step should add meaning.

## Check your understanding

Review this code:

```ts
await page.getByRole('button', { name: 'Delete' }).first().click();
```

The page contains a Customer table and an Admin table. Both contain a row for `qa@example.com`, but the scenario requires deleting the Customer record only.

Explain:

1. Why can `first()` produce the wrong action?
2. What meaningful outer scopes are available?
3. How would you identify the correct row?
4. What target would you locate inside that row?
5. Which observable result should be asserted after deletion?

## Compare your reasoning

One reasonable answer is:

- DOM order is not the customer/admin contract, so `first()` can change meaning after layout or sorting changes.
- Scope first to the Customer table or its surrounding region using its accessible name.
- Within that scope, locate the row containing the exact email, preferably through a cell locator or a meaningful filter.
- Locate the Delete button only inside that row.
- Assert the intended customer row is removed or a customer-specific status appears. The exact evidence should follow the product requirement.

If the two tables lack names, that ambiguity may require a product semantics or testability improvement before the final locator is trustworthy.

## Before you continue

You should now be able to narrow a repeated UI from meaningful container to target, explain when plural matches are valid, and use strictness to investigate missing identity rather than bypass it.

Complete the Core Practice involving a repeated product grid. The next lesson teaches enough CSS to read and repair implementation-level fallbacks without treating a longer DOM path as a better locator.
