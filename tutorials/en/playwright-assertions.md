---
title: 'Playwright Assertions'
description: "Verify your test expectations with Playwright's rich assertion library."
---

# Playwright Assertions

Verify your test expectations with Playwright's rich assertion library.

## The Mental Model: The Verdict

Navigation and clicks are just "Evidence Gathering".
**Assertions are the Verdict.**

If your test clicks 50 buttons but contains no assertions, **it is not a test**. It's just a joyride script. It will pass even if the page crashes (as long as the crash doesn't throw a JS error).

Assertions act as **Guard Rails**. They freeze the test and say: "I will not proceed to Step 2 until Step 1 is visibly correct."

---

## The Strategy: The "Retry-ability" Rule

This is the most critical concept in Playwright.

**The Bad Pattern (Static)**:

```javascript
// ❌ WRONG
const text = await page.locator('.status').innerText();
expect(text).toBe('Success');
```

- _Why it fails_: It grabs the text at millisecond 0. If the text changes to "Success" at millisecond 10, the test failed for no good reason.

**The Good Pattern (Auto-Retrying)**:

```javascript
// ✅ RIGHT
await expect(page.locator('.status')).toHaveText('Success');
```

- _Why it wins_: Playwright sees the text isn't "Success" yet. It waits. It checks again. It keeps checking for 5 seconds (default). It only fails if it _never_ becomes "Success".

**The Rule**: Always use `expect(locator)` matchers (Web-First). Avoid `expect(value)` matchers (Generic) for UI elements.

---

## The Real World Case: The Spinning Loader

**The Scenario**:
You click "Save". A spinner appears for 2 seconds, then disappears.
You want to verify the save occurred.

**The Flake**:

```javascript
// Flaky! might pass before spinner even appears
await expect(page.locator('.spinner')).toBeHidden();
```

**The Reality**:
Playwright runs extremely fast. It might check for `.spinner` visibility _before_ the React state updates to show it. "It's hidden! Test passed!"... then the spinner appears.

**The Fix**:
Assert the _presence_ of the transition, then the _absence_.

```javascript
// 1. Wait for it to start working
await expect(page.locator('.spinner')).toBeVisible();

// 2. Wait for it to finish working
await expect(page.locator('.spinner')).toBeHidden();
```

---

## The Traps

### Trap #1: The Zombie Assertion

**The Crime**: `expect(await locator.isVisible()).toBe(true);`
**The Reality**: You are `await`ing the boolean value. You get `false`. You assert that `false` is `true`.
**The Verdict**: Failed test. No retry.
**The Fix**: `await expect(locator).toBeVisible();`

### Trap #2: The Negative Truth

**The Crime**: `expect(locator).not.toBeVisible()` vs `expect(locator).toBeHidden()`
**The Reality**: They are technically the same, but `toBeHidden()` reads like a specific state (The element exists but is `display:none` OR the element does not exist).
**The Fix**: Prefer **readable methods**.

- `toBeEnabled()`
- `toBeDisabled()` (Better than `not.toBeEnabled()`)

---

## Quick Reference

| Method          | Check                         |
| :-------------- | :---------------------------- |
| `toBeVisible()` | Visible to user (opacity > 0) |
| `toBeHidden()`  | Not in DOM or `display: none` |
| `toHaveText()`  | String match (retries)        |
| `toHaveValue()` | Input value (retries)         |
| `toHaveURL()`   | Current URL regex             |
| `toHaveTitle()` | Page title regex              |
| `toBeChecked()` | Checkbox state                |

---
