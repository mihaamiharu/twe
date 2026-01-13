---
title: "Actionability and the Auto-Wait Engine"
description: "How Playwright eliminates flaky tests by automatically verifying element states before every action."
---

## 1. The Problem: The "Race Condition"

In manual testing, if a button is still loading or covered by a popup, you simply wait for it to be ready. In basic automation, if you tell a script to `click()`, it sends that signal instantly. If the button isn't ready at that exact millisecond, the test crashes.

Playwright solves this by acting like a human observer. It doesn't just "click"; it waits for the element to become **Actionable**.

---

## 2. The Actionability Checklist

Before Playwright performs any action (like `click()`, `fill()`, or `check()`), it runs an internal "Pre-Flight Checklist" on the element. If any of these checks fail, Playwright waits and tries again in a loop (up to 30 seconds).

| Check | Description | Common Failure |
| --- | --- | --- |
| **Attached** | Element must be present in the DOM | Element not yet rendered |
| **Visible** | Element must be visible to user | `display: none` or `visibility: hidden` |
| **Stable** | Element must not be moving | CSS animation in progress |
| **Enabled** | Element must not be disabled | `<button disabled>` |
| **Receiving Events** | Element must not be covered | Modal overlay, loading spinner |

![Actionability Checklist](/images/tutorials/playwright-actionability-checklist.png)

> [!IMPORTANT]
> All five checks must pass before any action executes. This is why Playwright tests are inherently more stable than older frameworks.

---

## 3. Real-World Case: The Disappearing Spinner

**The Scenario:** You click "Submit." A loading spinner appears while the server thinks, then a "Success" message appears.

### The Old Way (Selenium)

You would have to write explicit waits for every state change:

```javascript
// Manual waiting required
await driver.click('#submit');
await driver.wait(until.elementIsNotVisible(spinner)); // Wait for spinner
await driver.wait(until.elementIsVisible(successMsg)); // Wait for message
const text = await successMsg.getText();
```

### The Playwright Way

```javascript
await page.click('#submit');
// Playwright automatically waits for the success message to be Visible, 
// Attached, and Stable before trying to read the text.
const message = await page.locator('.success-msg').innerText();
```

> [!TIP]
> With Playwright, you write what you want to do, not how to wait for it. The Auto-Wait engine handles timing automatically.

---

## 4. Why This Eliminates Flakiness

Because Playwright has a **Direct Connection** to the browser (from Tutorial 9: Playwright Architecture), it doesn't "guess" if the page is ready. It knows.

![Auto-Wait Engine Flow](/images/tutorials/playwright-autowait-flow.png)

| Benefit | Description |
| --- | --- |
| **No Manual Sleeps** | You never have to write `page.waitForTimeout(5000)` |
| **Precision Timing** | If ready in 10ms, moves on in 10ms—no wasted time |
| **Clearer Errors** | Tells you exactly which check failed (e.g., "Element is hidden") |

> [!CAUTION]
> While Auto-Wait is automatic for locator actions, it does NOT apply to raw JavaScript evaluation like `page.evaluate()`. Always prefer locator methods.

---

## 5. Summary Checklist

| Concept | Key Takeaway |
| --- | --- |
| **Actionability is Automatic** | You don't need to turn it on; it happens for every locator action |
| **Five Checks** | Attached, Visible, Stable, Enabled, Receiving Events |
| **Smart Waiting** | Pauses execution until element passes or timeout (30s default) |

---

## 6. Further Reading (Deep Dive)

Explore the official documentation and the exact code Playwright uses to decide if an element is ready.

### Official Documentation

* **[Auto-Waiting](https://playwright.dev/docs/actionability)**: The complete list of which actions wait for which checks.
* **[Timeouts](https://playwright.dev/docs/test-timeouts)**: How to configure the 30-second default for different scenarios.

### GitHub Source Code (Open Source)

* **[ElementHandle Implementation](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/dom.ts)**: The server-side code that manages DOM elements and coordinates these checks.
