---
title: 'Choose the Right Locator When Elements Look Similar'
description: 'Choose the right context, filter the card or row under test, and use Playwright strictness to identify locators that are still too broad.'
---

## After this lesson, you can

- explain when Playwright actually searches for elements that match a locator;
- scope to the correct card, row, dialog, or container before finding a target inside it;
- filter similar components using text, content, or another element inside them;
- distinguish operations that allow several matches from actions or assertions that require one clear target; and
- diagnose a locator that finds several elements without immediately using `first()` or `nth()`.

## Why this matters for QA

Picturing one **“Add to Cart”** button is easy. A catalog page may contain many buttons with the same name.

Suppose the code looks like this:

```ts
await page.getByRole('button', { name: 'Add to Cart' }).click();
```

Playwright finds more than one button, so the test fails.

That failure is useful. It tells us that the test identifies the action but has not said which product owns it.

The solution is not to add `.first()` immediately. If the product order changes, the first button may belong to a different product. The test could click the wrong **Add to Cart** button and still pass.

## The mental model

When several elements look alike, first identify the relevant part of the page:

```text
The correct card, row, or container
                 ↓
The target inside that container
                 ↓
An action or assertion on the intended element
```

![A broad repeated collection is narrowed by meaningful identity and state before one target action, while zero, one, or many matches provide different diagnostic signals.](/images/tutorials/locator-scope-strictness.svg)

_Scope answers “which component?” The locator inside it answers “which element should the test use?”_

A Playwright locator does not store a fixed list of elements when it is created. For example:

```ts
const productCards = page.getByRole('article');
```

Playwright searches for matching elements when the locator is used for an action, assertion, or query.

This allows Playwright assertions to retry while the DOM changes. But if a locator is too broad, Playwright still cannot decide which element the test intends to use.

Strictness depends on the operation:

| Operation                        | Multiple matches allowed? | Why                                           |
| -------------------------------- | ------------------------- | --------------------------------------------- |
| `locator.click()`                | No                        | One element must receive the action           |
| `locator.fill()`                 | No                        | One field must receive the value              |
| `expect(locator).toBeVisible()`  | No                        | A single-target assertion must identify one element |
| `expect(locator).toHaveCount(3)` | Yes                       | The collection itself is under test           |
| `locator.count()`                | Yes                       | The query intentionally measures a collection |

Strictness does not mean every locator must always find exactly one element. A problem occurs when an operation that requires one target finds more than one.

The number of matches can also guide debugging:

| Match count | What to inspect                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| `0`         | Is the page in the correct state, and does the expected element exist?        |
| `1`         | Is this element actually the target required by the scenario?                  |
| `>1`        | Which additional context is needed to identify the intended target?            |

If a scenario intentionally covers several elements, multiple matches are not a problem. Assert their count or condition directly instead of forcing the locator to choose one.

## Work through a realistic example

The catalog contains:

- **Widget Basic** — Out of Stock;
- **Widget Pro** — In Stock; and
- **Widget Pro Max** — Out of Stock.

Every product card has an **Add to Cart** button. The risk is:

> A customer adds the in-stock Widget Pro, but the wrong product is added or no confirmation appears.

### 1. Start with the product cards

```ts
const productCards = page.getByRole('article');
```

This locator intentionally finds every product card on the page.

If we search all those cards for an **Add to Cart** button, Playwright still finds several buttons and cannot know which one the scenario needs.

### 2. Filter by the product you want

If each card contains an element that identifies its product, use that element as a filter:

```ts
const widgetProCard = productCards.filter({
  has: page.getByRole('heading', {
    name: 'Widget Pro',
    exact: true,
  }),
});
```

The inner locator must be in the same frame and is evaluated relative to each candidate card. Here, Playwright checks for the heading inside every product card.

`exact: true` prevents **Widget Pro Max** from being treated as **Widget Pro**.

You can also filter by text:

```ts
const matchingCards = productCards.filter({
  hasText: 'Widget Pro',
});
```

`hasText` searches each card and its descendants. A string uses case-insensitive substring matching, so **Widget Pro** can also match **Widget Pro Max**.

This is convenient, but it can be too broad when the exact product name matters. In that case, use a more specific regular expression or filter through a meaningful element such as the heading.

### 3. Add the state that matters to the scenario

```ts
const availableWidgetPro = widgetProCard.filter({
  has: page.getByText('In Stock', { exact: true }),
});
```

The locator now identifies **Widget Pro** and confirms that it is **In Stock**.

If two matching in-stock Widget Pro cards unexpectedly appear, the next action should still fail instead of silently choosing one.

You can also verify that only one card matches:

```ts
await expect(availableWidgetPro).toHaveCount(1);
```

### 4. Find the action inside the chosen card

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();

await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
```

The outer locator selects the in-stock **Widget Pro** card. The inner locator finds **Add to Cart** only inside that card.

Finally, the assertion verifies that the expected confirmation appears after the product is added.

### 5. Check every item when the scenario covers a list

Suppose the requirement says the summary shows these items in this order:

```ts
await expect(page.getByRole('listitem')).toHaveText([
  'Keyboard',
  'Mouse',
  'USB Hub',
]);
```

This locator is allowed to find several elements because the scenario verifies the entire list.

Prefer calling `toHaveText()` directly on the locator instead of reading `allTextContents()` and comparing the result manually. Playwright can then retry until the list reaches the expected state or the assertion times out.

## When to use it—and when not to

Start from a card, row, dialog, navigation region, form, or another meaningful container when the page contains several controls with the same name.

Use `filter({ has })` when an element inside the component—such as a heading, status, or label—helps identify the target. Use `filter({ hasText })` when the component text is sufficiently stable and relevant to the scenario.

Use `toHaveCount()` or a list assertion when the number or order of items is part of the requirement.

Use `nth()`, `first()`, or `last()` only when position is part of the product behavior—for example, verifying that the first search result is the highest-ranked item. Even then, verify the content that makes its position meaningful.

Do not add `first()` merely because two elements match, and do not immediately rely on parent traversal such as `locator('..')`. Prefer clearer context such as a row, dialog, region, filter, or a deliberate `data-testid` on the component.

If the UI provides no clear way to distinguish one component from another, discuss markup or testability with a developer instead of building an increasingly long CSS or XPath chain.

## When it fails

Suppose this click reports a strictness error:

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();
```

Inspect the locator one narrowing step at a time:

1. How many `article` elements exist on the page?
2. Which cards have the exact **Widget Pro** heading?
3. Which of those cards have the **In Stock** status?
4. How many **Add to Cart** buttons exist inside the selected card?
5. Is a duplicate from a modal, mobile layout, or another component still rendered?
6. Does the product legitimately display more than one **Widget Pro** offer?

If the product legitimately shows two **Widget Pro** offers, the test needs another identifier such as seller, plan, or SKU. If the duplicate is a defect, using `first()` could hide it.

When no card matches, inspect the starting state, exact product name, current locale, loaded data, and whether the component is inside an iframe or a different page.

Do not immediately make `hasText` broader just to find something. The root cause may be test setup or data that differs from the test's assumption.

Before using a locator composed from several filters, check:

- Does the outer locator identify the correct card, row, dialog, or component rather than an arbitrary HTML wrapper?
- Does `filter({ has })` search for the right element inside each candidate component?
- Could `hasText` also match longer or unrelated text?
- When only one component should match, does the test verify that it is unique?
- Is `first()` or `nth()` being used only to bypass a strictness error?
- Are too many independent scenarios combined in one loop, making failures difficult to diagnose?
- Does the final assertion verify the result for the selected item?
- Would a small markup change or a component `data-testid` make the locator simpler and more reliable?

A long locator is not automatically reliable. Every filter should help identify the target required by the scenario.

## Check your understanding

Review the following code:

```ts
await page.getByRole('button', { name: 'Delete' }).first().click();
```

The page contains a **Customer table** and an **Admin table**. Both contain a row for `qa@example.com`, but the scenario must delete only the record in the **Customer table**.

Explain:

1. Why could `first()` delete the wrong record?
2. Which part of the page should provide the initial scope?
3. How would you identify the `qa@example.com` row inside the **Customer table**?
4. Which element should you find inside that row?
5. What result should you verify to prove that the customer record was deleted?

## Compare your reasoning

One reasonable answer is:

- `first()` selects the first matching element in the page order. If the layout, sorting, or table order changes, the test could delete the wrong record.
- Scope to the **Customer table** first, using the table's accessible name or a named surrounding region.
- Inside that table, find the row containing the exact email `qa@example.com`, using a cell locator or an appropriate filter.
- Find the **Delete** button only inside that row.
- Verify that the `qa@example.com` row is absent from the **Customer table**, or assert another customer-specific confirmation required by the product.

If the two tables have no name or other information that distinguishes them, the markup or testability may need to be improved before a reliable locator can be written.

## Before you continue

You should now be able to select the intended target when a page has similar cards, rows, or components; explain when multiple matches are valid; and use strictness errors to find missing context before changing a locator just to make the test pass.

Complete the Core Practice involving a product grid with similar items.

The next lesson teaches enough CSS to read and repair locators that must depend on the DOM or attributes, without treating a longer selector as a more reliable one.
