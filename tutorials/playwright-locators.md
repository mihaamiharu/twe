# Playwright Locators

Master the art of finding elements with Playwright's powerful locator API.

## The Mental Model: The Finger

Think of a locator as **your finger pointing at the screen**.

* **Bad Pointer**: "Click the 3rd blue widget in the 2nd row." (CSS/XPath)
  * *Problem*: If the design shifts, you point at empty space.
* **Good Pointer**: "Click the 'Submit' button." (Semantic)
  * *Result*: Even if the button moves to the top of the page, your finger follows it.

Playwright Locators are **auto-waiting**, **retry-able** pointers. They don't just find the element once; they keep pointing until the element is ready.

---

## The Strategy: The Hierarchy of Trust

When choosing *how* to point, follow this priority list. Start at the top; only go down if you must.

1. **Tested By User (Best)**: `getByRole`, `getByLabel`, `getByPlaceholder`.
    * *Why*: This ensures your app is accessible. If you can't click "Submit", a screen reader user can't either.
2. **Tested By Content (Good)**: `getByText`.
    * *Why*: Good for static content, but fragile if marketing changes copy frequently.
3. **Tested By Contract (Reliable)**: `getByTestId` (`data-testid`).
    * *Why*: The "Backdoor". Use this when an element has no semantic role or text (e.g., a dynamic graph or icon).
4. **Tested By Structure (Last Resort)**: `locator('div > span')` (CSS/XPath).
    * *Why*: Heavily tied to implementation details.

---

## The Real World Case: The "Agile" Layout

**The Scenario**:
Marketing is A/B testing a new layout.

* **Version A**: The "Buy" button is in a sidebar.
* **Version B**: The "Buy" button is in a sticky footer.

**The CSS Fail**:

```javascript
// Works in A, fails in B because the container changed
page.locator('.sidebar .buy-btn').click();
```

**The Text Fail**:
Marketing changes "Buy Now" into "Purchase" halfway through the sprint.

```javascript
// Fails when text changes
page.getByText('Buy Now').click();
```

**The Robust Fix**:
Use a **Test ID** (The Contract).
This requires developer buy-in, but it is the *only* way to survive rapid UI/text changes without rewriting tests daily.

```javascript
// Robust in both Layouts AND Text changes
// Requires developer to add: <button data-testid="purchase-action">...</button>
page.getByTestId('purchase-action').click();
```

---

## Advanced Technique: Locator Chaining

Sometimes a page has 50 "Delete" buttons. How do you click the specific one for "John Doe"?
**Don't write a complex XPath.** Chain your locators logically.

```javascript
// 1. Find the specific row for 'John Doe'
const userRow = page.getByRole('row').filter({ hasText: 'John Doe' });

// 2. Find the button INSIDE that row
await userRow.getByRole('button', { name: 'Delete' }).click();
```

**Why this wins**:

* It reads like English.
* It is resilient. If the row content changes order, it still works.

---

## The Traps

### Trap #1: Strict Mode Panic

**The Error**: `Error: strict mode violation. 2 elements resolved to locator...`
**The Cause**: You said `getByRole('button')` but there are two buttons.
**The Fix**:

1. Make it specific: `getByRole('button', { name: 'Save' })`
2. Filter it: `.filter({ hasText: 'Modal' })`
3. *Avoid* `.first()` unless you truly don't care which one you click.

### Trap #2: The Hidden Text

**The Code**: `getByText('Welcome')`
**The Problem**: Playwright defaults to strict matching. If the text is "Welcome!", it fails.
**The Fix**: Use `exact: false` or Regex.

```javascript
page.getByText('Welcome', { exact: false }); // Matches "Welcome!"
page.getByText(/welcome/i); // Matches "WELCOME"
```

---

## Quick Reference

| Method | Use Case | Example |
| :--- | :--- | :--- |
| `getByRole` | Interactive elements | `getByRole('button', {name: 'Save'})` |
| `getByLabel` | Forms | `getByLabel('Email')` |
| `getByPlaceholder` | Search/Input | `getByPlaceholder('Search...')` |
| `getByText` | Static content | `getByText('Success')` |
| `getByTestId` | Hard-to-select, Dynamic | `getByTestId('graph-canvas')` |
| `.filter()` | Narrowing down | `.filter({ hasText: 'Active' })` |

---

## Ready to Practice?

Train your pointing finger:

1. [Role vs Text](/challenges/pw-get-by-role) - The accessibility check.
2. [The TestID Contract](/challenges/pw-get-by-testid) - Safe selection.
3. [Chaining and Filtering](/challenges/pw-locator-chaining) - Handling lists.
