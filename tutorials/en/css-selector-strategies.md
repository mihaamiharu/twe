---
title: 'Read CSS Selectors Without Making Them the Default'
description: 'Inspect, review, and repair CSS locator fallbacks while keeping user intent and supported test contracts first.'
---

## After this lesson, you can

- read the CSS selector forms most often found in automation code;
- explain which DOM facts a selector depends on;
- distinguish a supported attribute contract from styling and structural details;
- identify when a CSS fallback is justified in Playwright; and
- diagnose zero or multiple matches without adding unnecessary selector depth.

## Why this matters for QA

Even in a modern Playwright suite, you will encounter CSS:

- an older test uses `#submit-order`;
- generated code copies a long path from DevTools;
- a third-party widget has poor semantics;
- a production defect must be investigated in the live DOM; or
- a team has not yet added a useful testability contract.

You need enough CSS literacy to review and maintain that reality. You do not need to treat CSS syntax mastery as the goal of the learning path.

The dangerous assumption is that a selector becomes reliable when it becomes longer or matches exactly one element today.

## The mental model

A CSS selector describes implementation evidence:

```text
Selector
   ↓
DOM facts it depends on
   ↓
Elements matching those facts right now
```

Its maintenance quality depends on ownership, not syntax alone.

CSS is not the next rung in a universal locator ladder. Check the user-facing contract, locator composition, and agreed test ID first. Use CSS only when the implementation fact is the deliberate contract, the page is legacy or third-party, or the missing semantics are an explicit testability gap.

| DOM fact  | Questions to ask                                                    |
| --------- | ------------------------------------------------------------------- |
| Tag       | Is the element type part of the supported behavior?                 |
| ID        | Is it deliberately stable or generated per build/session?           |
| Class     | Is it a domain contract or merely styling/framework output?         |
| Attribute | Who owns it, and can its value change harmlessly?                   |
| Hierarchy | Is the parent-child relationship meaningful or just current markup? |
| Position  | Is order the behavior under test?                                   |

One unique match is necessary for many actions, but uniqueness today does not prove stability tomorrow.

## Work through a realistic example

A legacy invoice page has no useful row semantics yet. The suite contains:

```ts
const overdueRows = page.locator('.invoice-table > tbody > tr:nth-child(2)');
```

The risk is:

> Every invoice marked overdue by the application appears in the overdue collection.

### 1. Read what the existing selector assumes

The selector depends on:

- a styling class named `invoice-table`;
- a direct `tbody` child;
- a direct `tr` child; and
- the overdue record always being second.

None of those facts expresses “marked overdue.” A new row, sorting change, or wrapper can change the selected record without changing the product rule.

### 2. Inspect the live DOM for a supported signal

Suppose the application renders:

```html
<tr data-state="overdue">
  <td>INV-1042</td>
  <td>Overdue</td>
</tr>
```

The product team confirms that `data-state` is a maintained state contract used by the component, not a temporary styling hook.

A smaller fallback can express that implementation state:

```ts
const overdueRows = page.locator('tr[data-state="overdue"]');

await expect(overdueRows).toHaveCount(2);
```

This remains a CSS contract. It is justified because the scenario intentionally inspects a supported DOM state and the current page lacks a better user-facing collection contract.

If “Overdue” visible text is the actual user evidence, a role/text locator may still be better. If `data-state` is not guaranteed, ask for an explicit test ID or improved semantics instead of declaring it stable yourself.

### 3. Read only the syntax needed to diagnose

You do not need to memorize CSS grammar. Recognize the forms below so you can explain what a generated selector depends on and which change could break it.

```css
button                         /* tag */
#account-menu                  /* id */
.error-message                /* class */
[name="email"]                /* exact attribute */
input[type="email"]           /* tag plus attribute */
.menu a                       /* descendant at any depth */
.menu > a                     /* direct child */
li:nth-child(3)               /* third child if it is an li */
```

More clauses narrow matches, but each clause also adds a maintenance dependency.

### 4. Distinguish class tokens from partial strings

CSS class selection uses tokens:

```css
.error
```

An attribute substring check is different:

```css
[class*="error"]
```

The second selector can also match class values such as `errorless`. Do not use partial matching unless partial text is the actual documented contract.

### 5. Treat position honestly

```css
.results > li:nth-child(1)
```

This is appropriate if the requirement is specifically about the first ranked result. It is weak if the test merely needs the result for invoice `INV-1042`.

Position is not inherently bad. Undocumented position is.

## When to use it—and when not to

Use CSS when inspecting the live DOM, maintaining an existing suite, working around third-party markup, or relying on a deliberately supported DOM attribute that no built-in locator expresses cleanly.

Use `getByTestId` rather than raw `[data-testid="..."]` when the team has adopted Playwright's test-ID contract. It communicates intent and respects a configured custom test-ID attribute.

Prefer role, label, visible text, locator composition, or a test ID for normal user workflows. Ask for better semantics or testability when a CSS selector would otherwise encode a long structural route.

Do not choose CSS because it appears faster. Browser, network, application, and assertion time normally dominate selector micro-differences. Optimize meaning, diagnosis, and maintenance.

Do not assume an ID is stable, a class is unstable, or a data attribute is safe based on its spelling. Verify how the application owns it.

## When it fails

Suppose this selector suddenly matches zero elements:

```ts
page.locator('.btn.btn-primary.checkout-submit');
```

Inspect:

1. Is the expected page and state loaded?
2. Which clause stopped matching?
3. Were the classes renamed by a redesign or build system?
4. Was the control removed, disabled, or moved to another context?
5. Is there now a role, label, or test ID that better expresses the target?
6. Was the original selector relying on styling rather than a supported contract?

If it matches several elements, do not keep adding ancestors until one remains. Identify the missing user, domain, or component context first.

For structural selectors, compare the expected and current ancestor chain. Fix the contract rather than copying an even longer path.

### Shadow DOM boundary

Playwright locators, including CSS locators, normally work through open shadow roots. XPath does not pierce shadow roots, and closed shadow roots are not supported. CSS and XPath locators also do not cross iframe boundaries; select the correct frame context first. A zero match may therefore be a boundary limitation rather than a syntax mistake.

## Review generated work

When AI proposes CSS, ask:

- Which exact DOM facts does every selector part depend on?
- Are those facts supported contracts or current implementation details?
- Is a generated ID, hashed class, or positional wrapper involved?
- Does the selector match the intended element or merely one element?
- Could role, label, text, composition, or test ID express the intent better?
- Is `nth-child` hiding an ambiguity that should be investigated?
- Did AI assume a class name expresses product state?
- Is the selector crossing a shadow-root or iframe boundary correctly?

Shorter is not always better, but every extra segment needs a reason.

## Check your understanding

Review three candidate selectors for the invoice scenario:

```css
.table-striped > tbody > tr:nth-child(2)
tr[data-state="overdue"]
[class*="overdue"]
```

Explain:

1. Which DOM facts each selector depends on.
2. Which harmless changes could break or change its meaning.
3. What team agreement would make the attribute selector trustworthy.
4. When position would be the correct contract.
5. Which user-facing locator you would consider if visible “Overdue” text is the real evidence.

## Compare your reasoning

One reasonable answer is:

- The first selector depends on a styling class, exact table hierarchy, and second position. It is appropriate only if those facts are deliberately under test.
- `tr[data-state="overdue"]` depends on the row tag and exact state attribute. It is reasonable when the component team supports that state contract and the test intentionally inspects it.
- `[class*="overdue"]` depends on a partial class string and may match unrelated values; it is the least explicit of the three.
- Position is valid when verifying ranking, sorting, or a specific ordered slot.
- If the customer-visible status is the contract, scope to the relevant row and locate the exact visible status text instead.

## Before you continue

You should now be able to read common CSS selectors, state their maintenance dependencies, and justify a CSS fallback without confusing a unique current match with a durable test contract.

Standalone CSS syntax drills remain available as Basic practice and do not block Module 4 completion. The next XPath lesson is also optional; use it when your work includes legacy suites or DOM relationships that still depend on XPath.
