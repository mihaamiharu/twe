---
title: 'Read the Live DOM and UI State'
description: 'Use meaningful hierarchy and state transitions to reason about repeated, changing interfaces.'
---

## After this lesson, you can

- explain the difference between initial HTML, the live DOM, and the rendered UI;
- use parent, child, ancestor, descendant, and sibling relationships to describe page context;
- scope a repeated control to the product, row, dialog, or region it belongs to;
- describe an interaction as a before–action–after state transition; and
- diagnose ambiguity caused by repeated or re-rendered elements.

## Why this matters for QA

A cart page contains three buttons named “Remove.” A manual tester knows which one belongs to “Mechanical Keyboard” because the button appears inside that product row.

Automation cannot safely rely on “the first Remove button.” The order could change, another product could be inserted, or the page could replace the row after a price update.

The problem is not that the page has repeated buttons. Repetition is normal. The problem is losing the meaningful context that connects each action to the right piece of data.

To automate a modern UI reliably, QA needs to read the page as a live tree and reason about how that tree changes.

## The mental model

The Document Object Model (DOM) is the browser's live object model of the page. It is not:

- a screenshot of what the page looks like;
- the component tree used internally by React, Vue, or another framework; or
- only the HTML text returned by the server.

JavaScript can add, remove, reorder, or replace DOM nodes after the initial response. Attributes and properties can change too. The current DOM is the structure automation interacts with at that moment.

Within the tree:

| Relationship | Meaning                                       |
| ------------ | --------------------------------------------- |
| Parent       | The direct element containing another element |
| Child        | An element directly inside another element    |
| Ancestor     | Any containing element higher in the tree     |
| Descendant   | Any nested element lower in the tree          |
| Sibling      | Elements with the same parent                 |

![A cart DOM tree uses the product row as meaningful context, then changes after one product is removed.](/images/tutorials/live-dom-context.svg)

_The useful path is “the Remove button inside the Mechanical Keyboard row,” not every wrapper between the page root and the button._

Two rules keep this mental model practical:

1. **Scope by meaning.** Use a product row, dialog, navigation region, or other recognizable container as context.
2. **Observe transitions.** Describe what exists before an action and what should exist afterward.

## Work through a realistic example

Consider this simplified cart:

```html
<ul aria-label="Cart items">
  <li>
    <h2>Mechanical Keyboard</h2>
    <p>Quantity: 1</p>
    <button>Remove</button>
  </li>
  <li>
    <h2>Wireless Mouse</h2>
    <p>Quantity: 1</p>
    <button>Remove</button>
  </li>
</ul>
```

The two `<li>` elements are siblings. Each heading, quantity, and button is a descendant of one product row. That row supplies the missing context for “Remove.”

First express the testing intent:

```text
Before: the cart contains Mechanical Keyboard and Wireless Mouse
Action: remove Mechanical Keyboard
After: the keyboard row is absent and the mouse row remains
```

Then a Playwright test can preserve that relationship:

```ts
const keyboardRow = page
  .getByRole('listitem')
  .filter({ hasText: 'Mechanical Keyboard' });

const mouseRow = page
  .getByRole('listitem')
  .filter({ hasText: 'Wireless Mouse' });

await keyboardRow.getByRole('button', { name: 'Remove' }).click();

await expect(keyboardRow).toHaveCount(0);
await expect(mouseRow).toHaveCount(1);
```

The important idea is not the exact syntax. The test first identifies the meaningful container, then finds the action inside it, then observes the transition.

Playwright locators also resolve against the current DOM when an action or assertion runs. If the framework re-renders the row between operations, the locator looks for the current matching element. This is safer than treating an old raw element reference as if the page never changes.

### Dynamic states are part of the tree

The same screen may move through several states:

```text
loading → populated → updating → populated
                    ↘ error
```

Useful states include:

- loading, empty, error, and populated content;
- enabled, disabled, checked, selected, or expanded controls;
- dialogs, menus, and overlays that attach later;
- rows added, removed, or reordered after data changes.

A test should prove the state relevant to the user. An internal component name or an arbitrary CSS class is rarely enough evidence.

## When to use it—and when not to

Use DOM hierarchy as meaningful context when a page has repeated cards, rows, list items, sections, dialogs, or controls with the same name.

Do not encode every wrapper in a long CSS or XPath path. Layout containers are often added during redesigns, even when the user behavior stays the same. A hierarchy is useful only when the container itself explains product meaning.

Browser APIs such as `parentElement`, `children`, and `querySelectorAll` are valuable for learning and DevTools inspection. In a Playwright test, prefer locators and filters that preserve user-facing meaning. Raw traversal is an investigation technique, not the default test architecture.

Index-based choices such as `first()` or `nth(0)` are appropriate only when order itself is part of the requirement. They are not a safe shortcut for an ambiguous target.

## When it fails

Suppose this action fails because it matches two elements:

```ts
await page.getByRole('button', { name: 'Remove' }).click();
```

The failure is useful evidence: the test's description of the target is incomplete.

Investigate in this order:

1. How many matching buttons exist in the live page?
2. Which product, row, dialog, or region owns the intended button?
3. Does that container have a stable user-facing identity?
4. Is the UI still loading or replacing rows while the test runs?
5. What before-and-after state would prove the correct row changed?

A tempting workaround is:

```ts
await page.getByRole('button', { name: 'Remove' }).first().click();
```

That hides ambiguity. If the cart order changes, the test may remove the wrong product and still continue. Fix the missing context instead.

Another weak workaround is a long selector such as `#app > div > ul > li:nth-child(1) > button`. It records the current layout, not the product relationship.

Before accepting a locator repair, review it for these warning signs:

- a global locator for a repeated control;
- `first()` or `nth()` with no order requirement;
- a full CSS or XPath path through layout wrappers;
- a raw element reference kept across an update;
- an assertion that checks a class instead of the user-visible state; or
- a click with no before-and-after evidence.

You should be able to state the intended container, the ambiguity being resolved, and the expected state transition before accepting the code.

## Check your understanding

An order-history page contains one row per order. Every row has a “Review” button. Clicking it opens a dialog for that order.

You need to review order `A104`. Explain:

1. Which container should provide context?
2. Which action belongs inside that context?
3. What should be true before and after the action?
4. Why would choosing the first “Review” button be risky?
5. What would you inspect if the correct dialog does not open?

## Compare your reasoning

One reasonable answer is:

- Use the row whose visible order identity is `A104` as the meaningful container.
- Find the “Review” button inside that row rather than searching for a global button.
- Before the action, row `A104` should exist and its review dialog should not be open. After the action, a dialog identifying order `A104` should be visible.
- The first row can change when orders are sorted, filtered, or newly inserted, so position does not prove identity.
- If the wrong dialog opens, inspect the live rows, the row's accessible identity, the number of matching controls, and whether the application replaced or reordered nodes during the action.

Another approach may be valid if the product provides a different stable identity, but the action and evidence should still remain tied to the same order.

## Before you continue

You should now be able to describe where a control lives, why that context is meaningful, and how the live DOM should change after an interaction—without relying on position or a full wrapper path.

In the next lesson, you will use DevTools and Playwright's investigation tools to collect that evidence from a real page before choosing test code.
