---
title: "Interaction Fundamentals"
description: "Applying the locator, action, and assertion engine to web elements."
---

To master the interaction fundamentals, we need to break down the "Test Loop" into its three mechanical parts. Since we are working in a browser-based environment, we will focus on how **Locators** find elements and how **Assertions** confirm the state.

---

## 1. Locators: Finding the Subject

A **Locator** is a high-level instruction that tells Playwright how to find an element on the page. Unlike older tools that rely on brittle CSS paths, modern best practices prioritize **user-facing attributes**. This ensures your tests don't break just because a developer changed a CSS class.

### The Locator Hierarchy

Playwright suggests using the most "stable" attributes first to avoid flaky tests.

![Locator Priority Hierarchy](/images/tutorials/playwright-locator-hierarchy.png)

| Priority | Method | Description |
| --- | --- | --- |
| **1. Role** | `page.getByRole()` | Matches elements by their accessibility role (e.g., button, heading, checkbox). Most robust. |
| **2. Text** | `page.getByText()` | Matches the actual words a user sees on the screen. |
| **3. Label** | `page.getByLabel()` | Targets form inputs by their associated `<label>` text. |
| **4. Test ID** | `page.getByTestId()` | A dedicated attribute (e.g., `data-testid`) for automation. Use as fallback. |

> [!TIP]
> Always start with `getByRole()`. It's the most resilient because accessibility roles rarely change, even when developers refactor the HTML structure.

---

## 2. Actions: Interacting with the Subject

Once a locator has identified an element, you perform an action. Because of the **Actionability Engine** (from the previous tutorial), Playwright automatically verifies that the element is visible and stable before proceeding.

| Action | Method | Example |
| --- | --- | --- |
| **Click** | `.click()` | `await page.getByRole('button', { name: 'Submit' }).click();` |
| **Fill** | `.fill()` | `await page.getByPlaceholder('Search').fill('JavaScript');` |
| **Check** | `.check()` | `await page.getByLabel('I agree to terms').check();` |
| **Select** | `.selectOption()` | `await page.getByRole('combobox').selectOption('medium');` |
| **Hover** | `.hover()` | `await page.getByText('Menu').hover();` |

> [!NOTE]
> The `.fill()` method clears the input first, then types. Use `.type()` if you need to append text without clearing.

---

## 3. Assertions: Verifying the Outcome

An **Assertion** is where you define the expected result. Playwright uses **Web-First Assertions**, which are "smart" and will wait for a condition to be met before failing.

### How Assertions Work

When you write an assertion, Playwright enters a "retry loop." If the condition isn't met immediately, it waits and checks again every few milliseconds for up to 5 seconds.

![Assertion Retry Loop](/images/tutorials/playwright-assertion-loop.png)

| Assertion | Method | Example |
| --- | --- | --- |
| **Visibility** | `.toBeVisible()` | `await expect(page.getByText('Success')).toBeVisible();` |
| **URL** | `.toHaveURL()` | `await expect(page).toHaveURL('/dashboard');` |
| **Text Content** | `.toHaveText()` | `await expect(page.locator('#status')).toHaveText('Active');` |
| **Attribute** | `.toHaveAttribute()` | `await expect(locator).toHaveAttribute('disabled');` |

> [!IMPORTANT]
> Always use `expect()` from `@playwright/test`, not generic JavaScript assertions. Playwright's `expect()` has built-in auto-waiting.

---

## 4. The Complete Interaction Loop

A standard test script follows a linear path from navigation to verification.

```javascript
test('Successful Login Flow', async ({ page }) => {
  // 1. Navigation
  await page.goto('https://example.com/login');

  // 2. Interaction
  await page.getByLabel('Username').fill('qa_engineer');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Verification
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

---

## 5. Summary Checklist

| Concept | Key Takeaway |
| --- | --- |
| **Locators** | Use `getByRole()` first, then Text, Label, TestId as fallbacks |
| **Actions** | Always `await` - Playwright handles actionability automatically |
| **Assertions** | Web-First Assertions auto-retry for up to 5 seconds |
| **No Manual Waits** | The Locator + Assertion combo handles all timing |

---

## 6. Further Reading (Deep Dive)

Mastering locators and assertions is where "scripting" becomes "engineering."

### Official Documentation

* **[Locators Guide](https://playwright.dev/docs/locators)**: A comprehensive guide to all 30+ locator methods.
* **[Assertions Guide](https://playwright.dev/docs/test-assertions)**: The full list of every available matcher (e.g., `toBeChecked`, `toBeFocused`).

### GitHub Source Code (Open Source)

* **[Locator Implementation](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/client/locator.ts)**: The client-side TypeScript that translates `getByRole` into browser queries.
* **[Matchers Logic](https://github.com/microsoft/playwright/blob/main/packages/playwright/src/matchers/matchers.ts)**: See exactly how Playwright decides if `toBeVisible()` returns true or false.
