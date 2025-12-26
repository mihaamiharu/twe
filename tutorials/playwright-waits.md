# Playwright Wait Strategies

Master timing and synchronization to banish flaky tests forever.

## The Mental Model: The Traffic Light

Imagine driving a car.

* **Auto-Wait**: A smart traffic light that turns green exactly when the cross-traffic clears. Efficiency: 100%.
* **Hard Wait**: A stop sign that forces *everyone* to stop for 5 minutes, even at 3 AM with no other cars. Efficiency: 0%.

Playwright is the Smart Light. It constantly checks "Is it safe yet?".
Selenium (and `sleep()`) is the Stop Sign.

---

## The Strategy: The Hierarchy of Waiting

Not all waits are created equal. Use them in this order of preference.

1. **Level 1: Auto-Wait (Best)**
    * **Action**: `page.click()`, `page.fill()`
    * **Logic**: Automatically waits for the element to be visible, stable, enabled, and actionability.
    * **Code**: Just write the action. It handles the waiting.

2. **Level 2: Web-First Assertions (Good)**
    * **Action**: `await expect(locator).toHaveText()`
    * **Logic**: Retries the check for 5 seconds until it passes.
    * **Use Case**: Verifying that an action succeeded.

3. **Level 3: Explicit Signals (Rare)**
    * **Action**: `waitForResponse`, `waitForEvent`
    * **Logic**: Wait for a specific network call or console event.
    * **Use Case**: When the UI is slow to react, but the API is fast.

4. **Level 4: Hard Sleep (Forbidden)**
    * **Action**: `page.waitForTimeout(5000)`
    * **Logic**: Pause script execution.
    * **Use Case**: **DEBUGGING ONLY**. Never commit this.

---

## The Real World Case: The Debounced Search

**The Scenario**:
You type "Playwright" into a search box.
The app waits 500ms (debounce) to stop typing, then fires an API call, then shows results.

**The Flake**:
If you click the result immediately after typing, it might not be there yet.

**The Fix (Level 2 Wait)**:

```javascript
await page.fill('#search', 'Playwright');
// ❌ FAILS: Result isn't there yet
// await page.click('.result');

// ✅ SUCCESS: Retries until visible
await expect(page.locator('.result').first()).toBeVisible();
await page.locator('.result').first().click();
```

**The Advanced Fix (Level 3 Wait)**:
If the UI is *really* slow (animation), wait for the data explicitly.

```javascript
const responsePromise = page.waitForResponse('**/api/search');
await page.fill('#search', 'Playwright');
await responsePromise; // Wait for the network to finish
await page.click('.result');
```

---

## The Traps

### Trap #1: The Hard Sleep

**The Code**: `await page.waitForTimeout(5000);`
**The Problem**:

* If the app takes 1s, you wasted 4s.
* If the app takes 6s, your test fails anyway.
**The Fix**: Determine *what* you are waiting for (text? visibility? url?) and assert that instead.

### Trap #2: The "Attached" Fallacy

**The Code**: `await page.waitForSelector('.modal');`
**The Problem**: By default, this waits for state=`visible`. BUT, in older versions, people often used state=`attached`.
**The Reality**: An element can be attached to the DOM but `display: none`. Clicking it will fail.
**The Fix**: Stick to `toBeVisible()` assertions.

---

## Quick Reference

| Method | Behavior | Use When |
| :--- | :--- | :--- |
| `expect(loc).toBeVisible()` | Retries until visible | Verifying appearance |
| `waitForResponse()` | Waits for network | UI laggy, API reliable |
| `waitForLoadState()` | Waits for 'load'/'networkidle' | Page navigation |
| `waitForTimeout()` | Hard pause | **Never** (Debug only) |

---

## Ready to Practice?

Synchronize your watches:

1. [Auto-Wait Mechanics](/challenges/pw-auto-wait) - Trusting the framework.
2. [Wait for Response](/challenges/pw-wait-for-response) - Handling network delays.
3. [Custom Timeouts](/challenges/pw-timeout-config) - Configuring patience.
