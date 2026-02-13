---
title: "Advanced Fixtures"
description: "Master composition, worker-scoping, and overrides to build a professional-grade test framework."
---

You know how to create a basic fixture. Now let's turn you into a **Test Architect**. We're going to cover the patterns used by large-scale engineering teams.

---

## 1. Fixture Composition

The real power of fixtures is that they can **depend on each other**. Just like lego blocks, you can build complex objects from smaller, reusable pieces.

Imagine you have a `UserPage` that requires a logged-in user. You can just request your `loginPage` fixture inside your `userPage` fixture!

![Fixture Composition Diagram](/images/tutorials/fixture-composition-diagram.png)

```typescript
type MyFixtures = {
  settingsPage: SettingsPage;
  userPage: UserPage;
};

export const test = base.extend<MyFixtures>({
  // This fixture depends on 'settingsPage' fixture!
  userPage: async ({ settingsPage }, use) => {
    await settingsPage.goto(); 
    await use(new UserPage(settingsPage.page));
  },
});
```

Playwright automatically resolves the dependency chain. If `settingsPage` needs `loginPage`, it builds that first.

---

## 2. Worker-Scoped Fixtures (Performance)

By default, fixtures are torn down after every test. This is great for isolation but terrible for performance if you're doing something heavy like **database seeding** or **logging in via API**.

Use `{ scope: 'worker' }` to create a fixture that runs **once per worker process**.

![Worker vs Test Scope](/images/tutorials/fixture-worker-vs-test-scope.png)

```typescript
export const test = base.extend<{}, { db: Database }>({
  // This runs once per worker, not once per test!
  db: [async ({}, use) => {
    const db = await connectToDatabase();
    await use(db);
    await db.disconnect();
  }, { scope: 'worker' }],
});
```

**Use Case:** Connect to the DB once, reuse the connection for 50 tests.

---

## 3. Overriding Built-in Fixtures

You can actually **replace** Playwright's default behavior! Want every `page` to start with a specific viewport or authentication state? Override the `page` fixture.

```typescript
export const test = base.extend({
  page: async ({ baseURL, page }, use) => {
    // Navigate to base URL automatically
    await page.goto(baseURL);
    
    // Inject custom headers
    await page.setExtraHTTPHeaders({ 'x-test-env': 'true' });
    
    await use(page);
  },
});
```

Now, every test in your suite automatically lands on the homepage with custom headers. No code changes needed in the test files!

---

## 4. Parameterized Fixtures (Options)

Sometimes you want to configure a fixture from the test file itself. You can create **Options**.

```typescript
type Options = { defaultUser: string };

export const test = base.extend<Options>({
  defaultUser: ['admin', { option: true }], // Default val
  
  // Use the option in another fixture
  loginPage: async ({ page, defaultUser }, use) => {
    const p = new LoginPage(page);
    await p.login(defaultUser); // Uses the option!
    await use(p);
  },
});

// usage in test file
test.use({ defaultUser: 'guest' }); // Override for this file!
```

---

## 5. Summary Checklist

| Pattern | Use When... |
| --- | --- |
| **Composition** | Building complex objects that depend on other setup steps. |
| **Worker Scope** | Setting up expensive resources (DB, API Login) shared across tests. |
| **Overrides** | Changing default behavior globally (e.g., auto-login for every page). |
| **Options** | You need to tweak fixture behavior per-test file. |

---

## 6. Further Reading

* **[Fixture Scopes](https://playwright.dev/docs/test-fixtures#scoping-fixtures)**: Worker vs Test scope deep dive.
* **[Global Setup](https://playwright.dev/docs/test-global-setup-teardown)**: For things that run once per *run* (not just per worker).
