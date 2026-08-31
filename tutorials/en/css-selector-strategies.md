---
title: 'Use CSS Selectors Only When Needed'
description: 'Learn to read and repair CSS selectors when they are necessary without making them the default choice for every locator.'
---

## After this lesson, you can

- read the CSS selector forms most often found in automation code;
- explain which DOM details or attributes make a CSS selector work;
- distinguish an attribute maintained for automation from styling classes or HTML structure;
- identify when a CSS selector is a justified Playwright fallback; and
- diagnose zero or multiple matches without making the selector longer and more complex.

## Why this matters for QA

Even with Playwright, you will still encounter CSS selectors in many situations:

- an older test still uses `#submit-order`;
- a test uses a long selector copied from DevTools;
- a third-party widget is difficult to identify through a role, label, or another locator;
- a production issue requires direct DOM inspection; or
- the application has no sufficiently stable attribute or locator for automation.

You need enough CSS knowledge to read, review, and repair existing tests. The goal is not to memorize every part of CSS syntax.

Avoid assuming that a selector becomes more reliable merely because it is longer or happens to find exactly one element today.

## The mental model

CSS selectors work through details exposed in the DOM:

```text
CSS selector
     ↓
The tag, ID, class, attribute, hierarchy, or position it uses
     ↓
Elements that match those details
```

Before using a CSS selector, identify each detail it depends on and ask how stable that detail is.

CSS is not automatically the next choice when a role, label, or text locator does not fit. First check whether clearer context, locator composition, or a team-supported test ID can identify the target.

Use CSS when there is a clear reason—for example, a legacy page, a third-party component, or an attribute that the owning team deliberately keeps stable for automation.

| Detail used | What to inspect                                                                     |
| ----------- | ----------------------------------------------------------------------------------- |
| Tag         | Does the element type matter to the scenario?                                     |
| ID          | Is the ID stable or generated for each build or session?                          |
| Class       | Is the class maintained intentionally or emitted only for styling or a framework? |
| Attribute   | Who owns the attribute, and has the team agreed to keep its value stable?          |
| Hierarchy   | Does the parent-child relationship matter, or is it only today's HTML structure?   |
| Position    | Is the element order part of the behavior under test?                              |

Finding exactly one element today does not mean the selector will remain reliable after the UI changes.

## Work through a realistic example

A legacy invoice page does not have sufficiently clear markup to distinguish each row. The suite currently contains:

```ts
const overdueRows = page.locator('.invoice-table > tbody > tr:nth-child(2)');
```

The controlled test data contains two overdue invoices. The risk is:

> Every invoice with an overdue status must appear in the overdue list.

### 1. Read what the existing selector assumes

The selector depends on:

- the `invoice-table` class;
- `tbody` being a direct child;
- `tr` being a direct child; and
- an overdue invoice always occupying the second position.

None of those details actually says that the row represents an overdue invoice. A new row, changed sorting, or different HTML structure could make the selector point to another invoice even when application behavior is unchanged.

### 2. Inspect the DOM for a stable attribute

Suppose the application renders:

```html
<tr data-state="overdue">
  <td>INV-1042</td>
  <td>Overdue</td>
</tr>
```

The component owner confirms that `data-state` represents invoice status and is deliberately kept stable, rather than being a temporary styling hook.

A smaller CSS selector can now express that state:

```ts
const overdueRows = page.locator('tr[data-state="overdue"]');

await expect(overdueRows).toHaveCount(2);
```

CSS is still a fallback here, but it has a clear reason: the scenario identifies invoices through the supported `overdue` state, and the page has no more suitable locator.

If the visible **“Overdue”** text is important to the scenario, a text-based locator may be more appropriate. If the owning team does not guarantee `data-state`, discuss adding a test ID or improving the markup instead of assuming the attribute is safe for automation.

### 3. Read the CSS syntax that appears most often

You do not need to memorize all CSS syntax. Learn the common forms well enough to explain which DOM details a selector uses.

```css
button                         /* tag */
#account-menu                  /* id */
.error-message                /* class */
[name="email"]                /* exact attribute */
input[type="email"]           /* tag + attribute */
.menu a                       /* descendant at any depth */
.menu > a                     /* direct child */
li:nth-child(3)               /* third child if it is an li */
```

Adding more parts can make a selector more specific, but every added part is another DOM detail that must remain unchanged.

### 4. Distinguish a class name from a partial match

A CSS class selector matches a class name:

```css
.error
```

This attribute selector instead matches any class value containing `error`:

```css
[class*="error"]
```

The second selector can also match a class such as `errorless`. Do not use partial matching when the scenario actually requires an exact class name or attribute value.

### 5. Use an index only when position matters

```css
.results > li:nth-child(1)
```

This selector can be appropriate when the requirement explicitly concerns the first result. But if the test only needs invoice `INV-1042`, relying on an index makes the selector vulnerable to ordering changes.

An index is not always wrong. The problem is depending on position when position is not part of the requirement.

## When to use it—and when not to

Use CSS when inspecting the DOM directly, maintaining a legacy suite, handling third-party markup, or using a stable attribute that Playwright's built-in locators cannot express clearly.

When the team uses test IDs, prefer `getByTestId()` over raw `[data-testid="..."]`. It communicates the intent more clearly and respects any custom test-ID attribute configured by the project.

For ordinary user flows, continue to prefer roles, labels, visible text, locator composition, or test IDs.

If a CSS selector must depend on many parents, children, classes, or indexes, first ask whether the markup or testability can be improved instead of extending the selector further.

Do not choose CSS merely because it appears faster. In an automation test, selector-performance differences are normally much smaller than the time spent opening the browser, waiting for the network and application, and running assertions.

Choose locators that are easier to understand, debug, and maintain.

Do not assume that every ID is stable, every class is unstable, or every `data-*` attribute is safe based only on its name. Inspect how the application creates it and confirm who maintains it.

## When it fails

Suppose this selector suddenly finds no elements:

```ts
page.locator('.btn.btn-primary.checkout-submit');
```

Inspect:

1. Has the test reached the correct page and state?
2. Which part of the selector no longer matches?
3. Did a redesign or build-system change rename the classes?
4. Was the element removed, disabled, or moved to another context?
5. Is there now a role, label, or test ID that better expresses the target?
6. Did the original selector depend too heavily on styling?

If the selector finds several elements, do not keep adding parents or ancestors until only one remains. First identify meaningful context—such as a card, row, dialog, or page region—that distinguishes the intended target.

If the selector deliberately depends on DOM structure, inspect which part of that structure changed. Do not simply copy a longer path from DevTools. Repair the selector based on the actual page and the test scenario.

### Check Shadow DOM and iframe boundaries

Playwright locators, including CSS locators, normally work through open shadow roots. XPath does not pierce shadow roots, and closed shadow roots are not supported.

CSS and XPath locators also do not search inside an iframe automatically. If the target is in an iframe, use the correct frame context first.

A zero match is therefore not always a selector-syntax problem. The element may be behind a Shadow DOM or iframe boundary that the locator has not handled correctly.

When reviewing a CSS selector, check:

- Which DOM details does each part of the selector use?
- Are the ID, class, or attribute values deliberately maintained?
- Does it contain a generated ID, hashed class, or fragile index?
- Does it find the element required by the scenario, or merely one element?
- Could a role, label, text, composed locator, or test ID express the target more clearly?
- Is `nth-child()` being used only to bypass several matches?
- Does the selector assume that a class always represents product state?
- If the element is inside a shadow root or iframe, does the locator access it correctly?

A shorter selector is not automatically better, but every added part should be necessary to identify the intended target.

## Check your understanding

Review these three CSS selectors for the invoice scenario:

```css
.table-striped > tbody > tr:nth-child(2)
tr[data-state="overdue"]
[class*="overdue"]
```

Explain:

1. Which DOM details does each selector use?
2. Which UI or DOM changes could make it fail or point to a different element?
3. What must the team confirm before `data-state="overdue"` is considered stable enough for automation?
4. When does an index such as `nth-child(2)` match the requirement?
5. If visible **“Overdue”** text matters to the scenario, which other locator should you consider?

## Compare your reasoning

One reasonable answer is:

- The first selector depends on the `table-striped` class, the exact table structure, and the second row. It is appropriate only when those details are part of the requirement.
- `tr[data-state="overdue"]` depends on the `tr` tag and the exact `data-state="overdue"` attribute. It is reasonable when the owning team keeps that attribute stable and the test intentionally finds invoices by that state.
- `[class*="overdue"]` only checks whether a class value contains `overdue`, so it may match unrelated values.
- An index is appropriate when the test verifies ranking, sorting, or an item in a particular position.
- If visible **“Overdue”** text matters to the scenario, first identify the correct row and then verify that exact text inside it.

## Before you continue

You should now be able to read common CSS selectors, identify the DOM details they depend on, and decide when CSS is a justified fallback.

Basic Practice for CSS syntax remains available if you want extra exercises, but it is not required to complete Module 4.

The next XPath lesson is also optional. It is most relevant when you work with legacy suites or locators that still depend heavily on XPath.
