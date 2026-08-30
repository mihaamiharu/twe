---
title: 'Design Test Scenarios from Product Risk'
description: 'Turn product risks into focused, independent scenarios with clear starting states, actions, and expected results.'
---

## After this lesson, you can

- define the precondition, action, and expected result for a product risk;
- distinguish positive, negative, and boundary scenarios that cover different behavior from variations that repeat the same flow;
- choose a small set of scenarios that represents different failure modes;
- keep each test focused while using the assertions needed for its expected result; and
- review test cases for behavior outside the requirement, optional expected results, or dependencies on other tests.

## Why this matters for QA

**“Automate the checkout page”** sounds like a task, but it does not tell us which tests to create.

Checkout can fail in many ways:

- an available product cannot be purchased;
- an out-of-stock product is added to the cart;
- a declined payment creates an order anyway;
- quantity rules accept values outside the allowed range; or
- one customer sees another customer's order.

One long happy-path test will not cover all of those risks. Creating many tests that repeat the same flow with different data may not add useful coverage either.

Automation still needs the reasoning behind a good manual test: a clear starting state, an action that checks a specific behavior, and an expected result that exposes when that behavior is wrong.

## The mental model

Build each scenario from the risk it needs to test:

```text
Product risk or business rule
          ↓
Starting state and test data
          ↓
One behavior to test
          ↓
Expected result to verify
```

Then choose scenarios that represent different ways the product could fail:

![A checkout rule becomes several focused scenarios: a positive scenario, a negative business-rule scenario, and boundary scenarios. Each has its own precondition, action, and expected result.](/images/tutorials/risk-scenario-portfolio.svg)

_Positive, negative, and boundary help us look at a rule from different sides. The product rule decides what each test contains._

Ask this for every proposed scenario:

> If this test fails, which product risk does it reveal?

If two tests cover the same risk, boundary, and expected result, one may duplicate coverage that already exists.

If one test tries to cover several unrelated behaviors, split it into focused scenarios.

## Work through a realistic example

The checkout product rules are:

- only available products can be ordered;
- quantity must be from 1 through 10;
- a declined payment must not create an order; and
- a successful order displays one generated order number.

### 1. Build scenarios from each risk before writing code

| Risk                              | Starting state and test data           | Action               | Expected result                                         |
| --------------------------------- | -------------------------------------- | -------------------- | ------------------------------------------------------- |
| Valid purchase fails              | Available item, quantity 1, valid card | Submit checkout      | Confirmation appears and one order number is shown      |
| Out-of-stock item is purchased    | Item is already out of stock           | Try to add the item  | Guidance appears and the item is not added to the cart  |
| Declined payment creates an order | Available item, declined test payment  | Submit checkout      | Decline alert appears and no order number is created    |
| Quantity boundary is wrong        | Available item                         | Try 0, 1, 10, and 11 | Valid values work and out-of-range values show guidance |

This table is more useful than only labeling the tests as **one positive test and three negative tests**. It shows why each scenario exists.

### 2. Choose the main positive scenario

The positive scenario verifies the main flow that should succeed:

```text
Given an active customer and an available Widget Pro
And quantity is 1 with a valid test payment
When the customer submits checkout
Then an order confirmation appears
And exactly one generated order number is shown
```

The confirmation and order number are both needed to verify that the order was created.

Several assertions make sense when they all verify the same behavior.

There is no need to check the navigation bar, footer, theme, or unrelated account fields. If one of those checks fails, it does not explain whether checkout works.

### 3. Create a negative scenario for a business rule

Now focus on declined payment:

```ts
test('declined payment shows guidance and creates no order', async ({
  page,
}) => {
  await page.goto('/checkout');
  await page.getByLabel('Card number').fill('4000 0000 0000 0002');
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.getByRole('alert')).toHaveText('Payment declined');
  await expect(page.getByText(/^Order number:/)).toHaveCount(0);
});
```

Assume the test environment is configured so this documented test card produces a declined payment. Never use real payment credentials in an automated test.

The **Payment declined** assertion verifies that the payment was rejected. The test then checks that no order number was created.

Both assertions matter because the scenario needs to verify the error message and confirm that no order was created after the payment failed.

The scenario must also start without a confirmation or order number left by an earlier test. Module 7 covers isolation and test data in more detail.

### 4. Choose boundaries that need testing

The allowed quantity range is 1 through 10. These values represent the rule:

- valid interior: a representative value such as 5;
- minimum valid: 1;
- maximum valid: 10;
- just below minimum: 0; and
- just above maximum: 11.

Testing every value from 2 through 9 in the browser usually repeats the same behavior.

Add another case only when it covers a different risk or implementation path. Validation logic can receive deeper coverage at a lower test layer, while the browser test verifies the rule that matters to the user.

### 5. Make sure every test can run by itself

Avoid a dependency like this:

```text
Test A creates a customer
        ↓
Test B depends on the customer from Test A
        ↓
Test C deletes the same customer
```

If Test A fails or the execution order changes, Tests B and C may fail even when their product behavior still works.

Each test should create or obtain the state it needs.

Repeating a small amount of setup can be clearer than making tests depend on execution order.

This lesson focuses on the principle that every test should run independently. The next module covers browser contexts, test data, authentication state, cleanup, and practical implementation choices.

### 6. Do not make expected behavior optional

Tests are sometimes written like this:

```ts
if (await page.getByRole('alert').isVisible()) {
  await expect(page.getByRole('alert')).toContainText('Out of stock');
}
```

If the **Out of stock** alert is the expected result, this code has a problem.

When the alert does not appear, the test skips the assertion and can still pass.

Control the starting state, run the action, and directly verify that the expected alert appears.

Conditional logic can still be appropriate for setup that differs between environments. Do not use a condition to make the behavior under test optional.

## When to use it—and when not to

Use a positive scenario for a main flow that matters to the user or business.

Add negative scenarios for business rules whose failure creates product, financial, security, or user-experience risk.

Add boundary scenarios when behavior changes at a defined limit.

Do not create one negative test for every random invalid value. Group values that exercise the same rule into an equivalence partition, then select representative cases.

Add more cases only when formatting, locale, encoding, security, or application behavior creates a different risk.

Keep each scenario focused on one behavior. Several assertions are fine when they all verify that behavior.

Split the scenario when its setup, action, expected result, or reason for failure belongs to a different rule.

Browser automation does not need to cover every combination. Lower-level tests are usually more efficient for calculations or validation with many variations.

Keep browser tests for flows and integrations that matter to the user and need end-to-end verification.

Do not merge scenarios only to reduce setup time. Do not split them only to follow a rule such as **“one assertion per test.”**

When a test fails, the team should be able to understand which behavior broke and why.

## When it fails

When a suite starts failing often, running slowly, or becoming difficult to maintain, check the test design before adding retries:

1. Can each test name the risk or rule it covers?
2. Is the precondition explicit and controlled?
3. Does the test depend on data or side effects from another test?
4. Does conditional logic allow the expected behavior to be skipped?
5. Are many tests repeating the same equivalence partition?
6. Does one test combine several unrelated business outcomes?
7. Would the failure message identify the broken rule?
8. Is a browser test covering permutations better suited to a lower layer?

If a negative scenario passes unexpectedly, confirm that the test reached the intended invalid state.

If a test fails only during parallel execution, check whether multiple tests share an account, inventory, order, or other data.

Do not make the suite serial only to make it pass. First identify the shared state or test data conflict.

Review test scenarios with these questions:

- Does the proposal assume a requirement, test account, boundary, or expected message without evidence?
- Can each scenario be traced to a business rule or product risk?
- Are “positive” and “negative” labels hiding duplicate flows?
- Are boundaries chosen around actual rule changes?
- Does any `if` statement make the expected outcome optional?
- Does one test depend on another test's data or execution order?
- Are unrelated assertions included because they were easy to add?
- Is sensitive data present in source, titles, logs, or reports?
- Could important permutations be covered faster and more clearly below the UI layer?
- Can you explain why every retained scenario deserves maintenance cost?

A test list can keep growing. The goal is not to create as many tests as possible, but to choose scenarios that help the team find important problems.

## Check your understanding

A proposed suite for a quantity rule of 1 through 10 contains these tests:

1. quantity 1 succeeds;
2. quantity 2 succeeds;
3. quantity 3 succeeds;
4. quantity 4 succeeds;
5. quantity 11 shows an error;
6. a valid purchase succeeds, then a second test reuses its order to test cancellation; and
7. an out-of-stock test asserts guidance only if the guidance happens to appear.

Decide which scenarios to keep, add, combine, separate, or fix. Explain the reason for each decision.

## Compare your reasoning

One possible answer is:

- Keep quantity 1 because it is the minimum valid boundary.
- Quantities 2, 3, and 4 do not all need browser tests if they produce the same behavior. Keep one representative value from the middle of the range.
- Add quantity 10 for the maximum valid boundary and quantity 0 for the value just below the minimum. Keep quantity 11 for the value just above the maximum.
- If numeric validation has many variations, consider covering some of them at a lower test layer.
- The cancellation test should create or obtain its own order instead of depending on a previous test.
- Remove the condition from the out-of-stock scenario. Establish the out-of-stock starting state, then directly verify that guidance appears and the item is not added to the cart.
- Keep one main positive purchase scenario that verifies the order was created.

The final set contains fewer tests, but every scenario has a clear reason to exist and covers a different way the product could fail.

## Before you continue

You should now be able to design positive, negative, and boundary scenarios from a business rule, avoid tests that repeat the same coverage, and recognize dependencies or conditions that make tests unreliable.

This lesson focuses on reasoning, so it does not have a separate code challenge.

Module 6 is complete after both Core lessons and the assertion Core Practice are completed.

Module 7 covers starting state, test data, authentication, cleanup, and isolation so these scenarios can run reliably.
