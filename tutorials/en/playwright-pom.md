---
title: 'Page Object Model (POM)'
description: 'Stop writing fragile scripts. Start building a maintainable test framework.'
---

# Page Object Model (POM)

Stop writing fragile scripts. Start building a maintainable test framework.

## The Mental Model: The Dictionary

Imagine reading a foreign book.

- **The Text**: `#login-button`, `.auth-form input[type="email"]`, `div.alert-success`.
- **The Meaning**: "Submit Login", "Email Field", "Success Message".

Without POM, your test files are written in the raw foreign language (HTML Selectors).
**Page Objects acts as the Dictionary.**
It translates "Human Intent" (Login) into "Technical Implementation" (Click `#btn-789`).

- **Test File**: Describes _What_ happens. ("User logs in").
- **Page Object File**: Describes _How_ it happens. ("Find input A, type B, click C").

---

## The Strategy: The "No Selectors in Tests" Rule

To achieve true maintainability, follow this strict rule:
**Your test files (`.spec.ts`) should NEVER contain CSS or XPath selectors.**

- ❌ **Bad Test**:

  ```javascript
  await page.fill('#username', 'alice');
  await page.click('.btn-primary');
  ```

- ✅ **Good Test**:

  ```javascript
  const loginPage = new LoginPage(page);
  await loginPage.login('alice');
  ```

**Why?**
If valid selectors exist in your test files, you have leaked implementation details into your business logic. When the implementation changes, you have to edit the business logic files. That is an anti-pattern.

---

## The Real World Case: The Login Rebranding

**The Scenario**:
Your company rebrands. The dev team updates the "Login" button.

- **Old ID**: `#login-btn`
- **New ID**: `#sign-in-action`

**The Nightmare (Without POM)**:
You have 50 different test files that start with logging in.
You have to `Find & Replace` across 50 files. You miss one. The build breaks.

**The Dream (With POM)**:
You open `LoginPage.js`. You change **one line**.

```javascript
// Old
this.submitBtn = page.locator('#login-btn');
// New
this.submitBtn = page.locator('#sign-in-action');
```

All 50 tests instantly work again because they were just asking for `loginPage.submit()`.

---

## The Code Structure

### 1. The Page Class

```javascript
// pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    // Locators are defined in the constructor
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.submitBtn = page.getByRole('button', { name: 'Sign In' });
  }

  // Actions act as a high-level API
  async login(user, pass) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submitBtn.click();
  }
}
```

### 2. The Test

```javascript
// tests/login.spec.js
test('User can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('alice', 'secret');

  // Assert on the next page
  const dashboard = new DashboardPage(page);
  await expect(dashboard.welcomeMessage).toBeVisible();
});
```

---

## The Traps

### Trap #1: The God Object

**The Code**: putting Header, Footer, Login, Settings, and Profile logic all inside `HomePage`.
**The Problem**: The file becomes 2000 lines long and unmanageable.
**The Fix**: Use **Components**.

```javascript
class HomePage {
  constructor(page) {
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
  }
}
```

### Trap #2: The Assertion Leak

**The Code**: Putting `expect()` inside your Page Object methods.

```javascript
async verifySuccess() {
    await expect(this.msg).toBeVisible(); // ❌ Don't do this
}
```

**The Problem**: It couples your _automation lib_ (Page Object) with your _test runner_ (Expect). It makes the method hard to reuse if you want to check for "Not Visible".
**The Fix**: Page Objects _return_ state. Tests _assert_ state.

```javascript
// Page
getSuccessMessage() { return this.msg; }

// Test
await expect(page.getSuccessMessage()).toBeVisible();
```

---

## Quick Reference

| Component       | Responsibility       | Example                            |
| :-------------- | :------------------- | :--------------------------------- |
| **Constructor** | Define Locators      | `this.btn = page.locator(...)`     |
| **Methods**     | Perform Actions      | `async submit() { ... }`           |
| **Test**        | Orchestrate & Assert | `await page.submit(); expect(...)` |

---
