---
title: 'Helpers, Component Objects, and Page Objects'
description: 'Choose the smallest abstraction that reduces maintenance without hiding test intent.'
---

## Duplication is not automatically a problem

Two tests repeating a clear locator may be easier to understand than a large abstraction created too early. Extract code when repetition represents a stable domain concept or when one change currently requires many coordinated edits.

## Start with a focused helper

```ts
async function signIn(page: Page, user: TestUser) {
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}
```

This names a complete behavior and keeps its success condition close.

## Component objects for repeated widgets

```ts
export class CartPanel {
  constructor(private readonly root: Locator) {}

  item(name: string) {
    return this.root.getByRole('listitem').filter({ hasText: name });
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }
}
```

A component object is often more reusable than a whole-page object because modern applications reuse widgets across pages.

## Page objects when the page is a stable domain boundary

```ts
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login');
  }

  async submit(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  error() {
    return this.page.getByRole('alert');
  }
}
```

Tests keep scenario-specific assertions visible:

```ts
await login.submit('qa@example.com', 'wrong');
await expect(login.error()).toHaveText('Invalid credentials');
```

It is also acceptable for a helper to assert an invariant such as “login completed” when that outcome is part of the helper’s contract. “Never put assertions in page objects” is not a universal law.

## Warning signs

- one class mirrors every page element;
- generic methods such as `clickButton(name)` hide locator intent;
- assertions are buried so test titles no longer explain behavior;
- page objects call each other in a long navigation chain;
- tests cannot perform a legitimate alternative path without changing the abstraction.

Choose helpers, component objects, or page objects based on change patterns—not fashion.
