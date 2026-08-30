---
title: 'Choose an Abstraction That Makes Tests Easier to Maintain'
description: 'Decide when code should stay inline and when repeated code belongs in a focused helper, component object, or page object.'
---

## After this lesson, you can

- explain what maintenance problem an abstraction is meant to solve;
- choose between clear inline code, a focused helper, a component object, and a page object;
- design methods around user actions or product behavior instead of generic UI operations;
- keep important actions and expected results visible in the test; and
- review generated abstractions for hidden state, vague names, and code that is difficult to trace.

## Why this matters for QA

Have you seen a test suite that looks tidy because everything lives inside classes, but debugging one failed test requires opening several files just to find which button it clicked?

As a suite grows, the same locator or sign-in steps may appear in several tests. Copying every detail makes one UI change expensive. Extracting every repeated line too early can hide important steps, state changes, and assertions.

A maintainable test helps a QA engineer answer three questions quickly:

1. What customer risk does this scenario cover?
2. Where should a product change be updated?
3. If it fails, which action and expected result should I inspect?

The number of classes or duplicated lines is not the main measure. Add an abstraction only when it makes those answers clearer.

## The mental model

Look for code that repeats and usually changes together. Move only the smallest useful part into one place:

```text
No stable repetition             → keep the code inline
One repeated action              → focused helper
One UI region used in many flows → component object
Several related stable actions   → page object

At every level: keep the scenario goal and expected result visible.
```

![Choose inline code, a focused helper, a component object, or a page object based on code that truly repeats, while keeping the scenario goal and expected result visible.](/images/tutorials/abstraction-decision-ladder.svg)

_Every abstraction also needs maintenance. Add one when repeated code is easier to update from a single place._

| Choice           | Code it organizes                  | When it becomes useful                                     |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| Inline code      | One scenario                       | The steps are short, clear, and not repeated often         |
| Focused helper   | One complete action or setup       | Several tests repeat the same group of steps               |
| Component object | One reusable UI region             | The same cart, menu, grid, or dialog appears in many flows |
| Page object      | One stable area of the application | Many scenarios use several related actions                 |

A page object can represent part of an application; it does not have to mirror every URL or every DOM element.

## Work through a realistic example

Two login scenarios repeat the same mechanics:

```ts
test('customer signs in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/account');
  await expect(
    page.getByRole('heading', { name: 'Your account' }),
  ).toBeVisible();
});

test('invalid password is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
  await expect(page).toHaveURL('/login');
});
```

The repeated form interaction has a clear purpose: submit login credentials. A focused helper is enough, while navigation remains visible in each test:

```ts
type Credentials = {
  email: string;
  password: string;
};

async function submitLogin(page: Page, credentials: Credentials) {
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
```

The scenarios now share the form interaction while keeping their starting page and different expected results visible:

```ts
await page.goto('/login');
await submitLogin(page, validBuyer);
await expect(page).toHaveURL('/account');
await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
```

```ts
await page.goto('/login');
await submitLogin(page, { ...validBuyer, password: 'wrong-password' });
await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
await expect(page).toHaveURL('/login');
```

Do not create a class merely because the scenario uses `page`. The helper already keeps the repeated form interaction in one place without hiding the test goal.

### When a page object becomes useful

Suppose the login flow later supports password reset, single sign-on, and account lockout, and several product areas reuse it. These related actions now make a page object useful:

```ts
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login');
  }

  async submit(credentials: Credentials) {
    await this.page.getByLabel('Email').fill(credentials.email);
    await this.page.getByLabel('Password').fill(credentials.password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  errorMessage() {
    return this.page.getByRole('alert');
  }

  async requestPasswordReset(email: string) {
    await this.page.getByRole('link', { name: 'Forgot password?' }).click();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByRole('button', { name: 'Send reset link' }).click();
  }
}
```

Its API names product capabilities. It does not offer generic methods such as `clickButton(name)` or expose every CSS selector as a field.

### When a component object is a better fit

Applications often reuse drawers, dialogs, navigation bars, and data grids across pages. If the same cart panel appears in several flows, model that component instead of creating a large object for every page that contains it:

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

The component receives a scoped root. It owns cart-panel mechanics without owning the whole application journey.

## When to use it—and when not to

Keep code inline while it is short, readable, and unique. A little duplication helps you see whether the same steps really repeat and change together.

Use a focused helper for a complete repeated operation such as submitting login credentials, creating owned test data, or opening a known product state. Name the behavior, not the implementation.

Use a component object for a repeated UI region with its own locator scope. Use a page object when one stable area of the application provides several related actions used by many scenarios.

Keep scenario-specific expected results in the test so reviewers can see what it checks. A helper may contain an assertion when it must guarantee the same result every time. For example, `signInSuccessfully` can verify that sign-in completed before it returns. Place each assertion with the helper or scenario responsible for that result.

Do not extract code only to reduce line count. Do not make every element public “in case it is needed.” Do not create one global object that knows the whole application. Do not force an alternative product path through an abstraction designed for a different flow.

## When it fails

| Symptom                                          | Likely design problem                                      | Better question                                             |
| ------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| One UI rename requires edits in many classes     | The same component locator is copied across page objects   | Which shared component changed?                             |
| Test reads like `flow.run()`                     | Important actions and assertions are hidden                | Which actions and expected results must remain visible?     |
| Object exposes `click`, `fill`, and `wait`       | API repeats Playwright instead of product vocabulary       | Which user action do several tests share?                   |
| One method returns the next object repeatedly    | Navigation and state transitions are coupled into a chain  | Should the test make this transition explicit?              |
| Helper needs many booleans to support variations | One abstraction is serving unrelated scenarios             | Should this be smaller operations or separate capabilities? |
| Fixing one scenario breaks unrelated tests       | An object stores state or changes data used by other tests | What state changes, who changes it, and who cleans it up?   |

When a reusable abstraction makes a valid scenario harder to write, check which code and responsibility belong inside it before adding another option or conditional branch.

## Review AI-assisted work

AI can generate a polished page-object framework before it understands your product or change history. Review it with these questions:

- What concrete duplication or change pattern does each abstraction solve?
- Are method names product behaviors or generic UI commands?
- Can I see the scenario’s important actions and assertions from the test?
- Does the object represent a stable page or component?
- Does it hide navigation, authentication, data mutation, waiting, or cleanup?
- Are locators scoped to the correct UI region and based on attributes the team keeps stable?
- Could a focused helper be easier to read and debug?
- Can a QA engineer change one component without tracing a long object chain?
- Did generated code invent credentials, routes, selectors, or business rules?

Ask AI why each helper or object exists and which file should change when the UI changes. If the answer is only “reuse” or “best practice,” there is not enough reason to add it.

## Check your understanding

A suite has three checkout scenarios. Each opens a cart drawer and changes quantity. The drawer also appears on the product page and search page. One generated proposal creates `ProductPage`, `SearchPage`, and `CheckoutPage`, and each class contains its own cart locators plus a generic `clickButton` method.

What would you keep visible in each test? Would you extract the repeated code into a focused helper, component object, or page object?

## Compare your reasoning

One reasonable design is:

- Keep each scenario’s product-specific starting state, important user action, and outcome assertions visible in the test.
- Create one `CartPanel` component object rooted at the drawer because that component is reused and its locators can be updated there.
- Give it clear actions such as `setQuantity(product, quantity)` and `remove(product)` rather than generic click or fill wrappers.
- Let each page or test create the component from the appropriate scoped locator; do not copy cart selectors into three page classes.
- Add a page object only if one of those pages develops several stable, shared capabilities of its own.

This design gives the team one place to update cart interactions while each test still shows its important action and expected result.

## Before you continue

You should now be able to keep code inline or move it into a focused helper, component object, or page object based on repeated code that is easier to maintain in one place.

The required practice checks this judgment with a focused helper; it does not require a page-object class just because the scenario uses a page.

The next lesson covers dependencies and lifecycle. A helper or page object organizes actions, while a fixture decides how a resource is created, provided to a test, and cleaned up.
