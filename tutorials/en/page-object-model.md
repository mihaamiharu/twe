---
title: "Page Object Model (POM)"
description: "Reviewing the industry-standard design pattern for reducing code duplication and maintenance."
---

As your test suite grows, you'll encounter a common problem: if a login button's ID changes, you might have to update that selector in 50 different test files. This is where the **Page Object Model (POM)** comes to the rescue.

---

## 1. The Concept: Why POM?

The Page Object Model is a design pattern that creates an "Object Repository" for your UI elements. Instead of scattering selectors across your tests, you place them in a dedicated class file.

### Separation of Concerns

Think of it as a translation layer. Your test scripts speak in "User Intent" (Login, Add Item), while your Page Objects handle the "Technical Specifics" (CSS selectors, click actions).

![Page Object Model Diagram](/images/tutorials/pom-concept-diagram.png)

| Feature | Without POM | With POM |
| --- | --- | --- |
| **Maintenance** | Update 50 files if UI changes | Update 1 file (the Page Object) |
| **Readability** | `page.locator('.btn-primary').click()` | `loginPage.submit()` |
| **Duplication** | Copy-pasting selectors everywhere | Reusable methods and locators |

> [!NOTE]
> POM is not a framework feature; it's a design pattern. You can use it with Selenium, Cypress, Playwright, or even raw Puppeteer.

---

## 2. Anatomy of a Page Object

In Playwright with TypeScript, a Page Object is simply a `class`. It typically has two main parts: **Locators** (defined in the constructor) and **Actions** (defined as methods).

```typescript
// pages/LoginPage.ts
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  // 1. Define standard properties
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 2. Initialize Locators inside the constructor
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'Sign In' });
  }

  // 3. Define Actions as async methods
  async goto() {
    await this.page.goto('/login');
  }

  async login(user: string, pass: string) {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }
}
```

---

## 3. Implementation in Tests

Once your Page Object is defined, your test files become much cleaner. You no longer see implementation details like IDs or CSS classes.

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('User can login successfully', async ({ page }) => {
  // 1. Instantiate the Page Object
  const loginPage = new LoginPage(page);

  // 2. Use the simplified methods
  await loginPage.goto();
  await loginPage.login('testuser', 'password123');

  // 3. Assertions usually remain in the test file
  await expect(page).toHaveURL(/dashboard/);
});
```

> [!TIP]
> In our playground exercises, we often **pre-load** the Page Object classes for you. You don't need to import them just call `new LoginPage(page)` and get started!

---

## 4. Best Practices

Not all Page Objects are created equal. Follow these rules to keep your code clean.

| Rule | Why? |
| --- | --- |
| **No Assertions in POs** | Page Objects should define *how* to interact, not *what* is correct. Verification belongs in the Test. |
| **Return New Pages** | If clicking "Save" redirects to the Dashboard, your `save()` method should return a `new DashboardPage(page)`. |
| **Component Objects** | Don't put everything in one giant class. Create smaller classes for repeatable widgets like `DatePicker` or `NavBar`. |

---

## 5. Summary Checklist

| Concept | Key Takeaway |
| --- | --- |
| **Single Responsibility** | Page Objects handle *how* to interact; Tests handle *what* to verify. |
| **DRY Principle** | "Don't Repeat Yourself." If you write the same selector twice, move it to a Page Object. |
| **Readability** | Your tests should read like a manual test case script. |

---

## 6. Further Reading (Deep Dive)

Mastering POM allows you to build massive test suites that are easy to maintain.

### Official Documentation

* **[Playwright POM Guide](https://playwright.dev/docs/pom)**: The official guide on structuring Page Objects in Playwright.
* **[Test Fixtures](https://playwright.dev/docs/test-fixtures)**: An advanced pattern to auto-initialize Page Objects without `new LoginPage(page)` in every test.

### GitHub Source Code

* **[VS Code Tests](https://github.com/microsoft/vscode/tree/main/test/automation)**: See how the VS Code team uses Page Objects to test VS Code itself.
