# From Manual to Automated Testing

Bridge the gap between manual testing expertise and automation skills.

## The Mental Shift

Your manual testing skills are **valuable**. You already know:

- ✅ What needs to be tested
- ✅ How users behave
- ✅ Where bugs hide
- ✅ Edge cases that matter

Automation just adds: **"How to make the computer do it."**

---

## Converting Manual Test Steps

### Manual Test Case

```
Test: Login with valid credentials
1. Navigate to login page
2. Enter email "qa@test.com"
3. Enter password "secret"
4. Click Login button
5. Verify welcome message appears
```

### Automated Test

```javascript
test('Login with valid credentials', async ({ page }) => {
  // 1. Navigate
  await page.goto('/login');
  
  // 2. Enter email
  await page.fill('#email', 'qa@test.com');
  
  // 3. Enter password  
  await page.fill('#password', 'secret');
  
  // 4. Click button
  await page.click('button[type="submit"]');
  
  // 5. Verify
  await expect(page.locator('.welcome')).toBeVisible();
});
```

**Notice**: Each manual step maps to 1-2 lines of code.

---

## The Debugging Mindset

When a test fails, think like a detective:

### 1. Read the Error Message

```
Error: Timeout waiting for selector "#login-btn"
```

**Translation**: "I couldn't find an element with id `login-btn`"

### 2. Check Your Assumptions

- Does the element exist? (Inspect in DevTools)
- Is the selector correct?
- Is the element visible?
- Did a previous step fail silently?

### 3. Add Debugging Steps

```javascript
// Take screenshot before the failing step
await page.screenshot({ path: 'debug.png' });

// Log the page content
console.log(await page.content());

// Pause execution (interactive mode)
await page.pause();
```

---

## Common Pitfalls

### 1. Timing Issues ("Flaky Tests")

**Problem**: Test passes sometimes, fails other times.

**Manual QA thinks**: "The page wasn't loaded yet when I clicked."

**Fix**: Use proper waits:

```javascript
// ❌ Bad: arbitrary sleep
await page.waitForTimeout(3000);

// ✅ Good: wait for specific condition
await page.waitForSelector('.dashboard');
await expect(page.locator('.data')).toBeVisible();
```

### 2. Brittle Selectors

**Problem**: Test breaks when developers change the UI.

**Manual QA thinks**: "The button used to say 'Submit', now it says 'Send'."

**Fix**: Use stable selectors:

```javascript
// ❌ Brittle: depends on exact text
await page.click('text=Submit');

// ✅ Stable: uses test ID
await page.click('[data-testid="submit-btn"]');
```

### 3. State Assumption

**Problem**: Test assumes user is logged in, but they're not.

**Fix**: Each test should set up its own state:

```javascript
test.beforeEach(async ({ page }) => {
  // Ensure clean state
  await page.goto('/logout');
  await page.goto('/login');
});
```

---

## Review: Selector Quality

When reviewing selectors, ask:

| Question | Good Answer |
|----------|-------------|
| Will it break if text changes? | No (uses ID/class/testid) |
| Is it unique on the page? | Yes (only matches one element) |
| Is it readable? | Yes (clear what it targets) |
| Is it short? | Yes (minimal DOM traversal) |

### Selector Quality Scale

```
🟢 EXCELLENT: [data-testid="login-btn"]
🟢 GOOD:      #login-button
🟡 OKAY:      .login-form button.primary
🔴 FRAGILE:   div > div > form > button:nth-child(3)
🔴 WORST:     text=Click here to login
```

---

## Quick Reference

| Manual Action | Playwright Code |
|---------------|-----------------|
| Go to URL | `await page.goto(url)` |
| Click element | `await page.click(selector)` |
| Type text | `await page.fill(selector, text)` |
| Check visible | `await expect(locator).toBeVisible()` |
| Check text | `await expect(locator).toHaveText(text)` |
| Wait for element | `await page.waitForSelector(selector)` |
| Take screenshot | `await page.screenshot({ path: 'name.png' })` |

---
