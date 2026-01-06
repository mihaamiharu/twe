---
title: "Playwright Navigation & Actions"
description: "Master page navigation and user interactions with Playwright."
---

# Playwright Navigation & Actions

Master page navigation and user interactions with Playwright.

## The Mental Model: The User vs The Driver

In older tools (like Selenium), the script acted like a **Robot Driver**. It would blindly send a "Click" signal to an element, even if that element was invisible, covered by a popup, or animating across the screen.

Playwright acts like a **Human User**.
Before it clicks, it asks:

1. Is it visible?
2. Is it stable (not moving)?
3. Is it enabled?
4. Is it covered by anything?

If the answer is "No", Playwright **waits** (Auto-waiting). It simulates how a real human behaves.

---

## The Strategy: The Actionability Checklist

When your test fails with a "Timeout", don't panic. It usually means the **Actionability Checklist** failed.

Playwright performs these checks for you automatically:

* **Attached**: Is the element in the DOM?
* **Visible**: Is it `display: none` or `visibility: hidden`?
* **Stable**: Is the animation finished?
* **Receives Events**: Is another element (like a sticky header) covering it?
* **Enabled**: Is the `disabled` attribute present?

**The Strategy**: Trust the wait. If Playwright isn't clicking, there is usually a real UX reason why.

---

## The Real World Case: The Floating Footer

**The Scenario**:
You have a specific "Save" button at the bottom of a long form.
The site also has a "Accept Cookies" banner fixed to the bottom of the viewport.

**The Action**:

```javascript
await page.locator('#save-btn').click();
```

**The Flake**:
Playwright looks for `#save-btn`. It finds it. It tries to click center.
**BUT** the Cookie banner is covering the center.
Playwright throws an error: `"Element is intercepted by <div class='cookie-banner'>"`

**The Fix**:
Think like a user. A user would dismiss the banner or scroll until the button is clear.

```javascript
// 1. Dismiss interference
await page.locator('#accept-cookies').click();

// 2. Then act
await page.locator('#save-btn').click();
```

---

## The Traps

### Trap #1: The Forced Click

**The Crime**: `await page.click('#btn', { force: true });`
**The Reality**: You are telling Playwright "I don't care if it's covered, click it anyway."
**The Risk**: You might be clicking the "Cancel" button hidden *behind* the "Save" button. Or clicking a button that a real user literally cannot reach.
**The Fix**: Never use `force: true` unless you are testing a CSS hack. Fix the visibility issue instead.

### Trap #2: The Hover Phantom

**The Crime**: Relying on `page.hover()` to show menus.
**The Reality**: There is no "hover" on mobile. If your test relies on hover, your mobile responsive tests will fail.
**The Fix**: Ensure your UI works with "Click to open" or ensure your test covers mobile scenarios explicitly.

---

## Core Actions Quick Reference

### Navigation

```javascript
await page.goto('/dashboard');
await page.waitForURL('**/login'); // Verify navigation happened
```

### Inputs

```javascript
// Smart Fill (Checks checks actionability)
await page.locator('#email').fill('user@example.com');

// Human Type (Simulates key presses - use sparingly)
await page.locator('#search').pressSequentially('Hello', { delay: 100 });
```

### Clicks

```javascript
await page.locator('button').click();
await page.locator('text=Save').dblclick();
```

### Selects

```javascript
await page.locator('select').selectOption('blue');
```

---

