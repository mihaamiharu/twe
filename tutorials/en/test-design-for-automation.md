---
title: 'Design Focused Positive and Negative Tests'
description: 'Turn risk into independent scenarios with controlled state, meaningful boundaries, and diagnostic failures.'
---

## Start from risk, not screen coverage

“Test the checkout page” is too broad. Identify a failure that matters:

- a valid customer cannot buy an available product;
- an out-of-stock product can be purchased;
- a declined payment is shown as successful;
- one customer can see another customer’s order.

Each risk leads to different setup, action, and evidence.

## Positive and negative are not enough by themselves

A happy path proves a valuable flow works. Negative cases should cover meaningful rules and boundaries—not every random invalid string.

```text
Given an available product and active customer
When the customer completes checkout with valid payment
Then an order is created once and its identifier is visible
```

```text
Given an out-of-stock product
When the customer attempts to add it
Then no cart line is created and availability guidance is shown
```

## Keep scenarios independent

Test B should not depend on Test A creating its account. Dependencies cause order-sensitive failures and block parallel execution.

Prepare state through a fixture, API, database utility, or stable UI setup appropriate to the risk. Clean up data when shared environments require it. Use unique identifiers where parallel workers could collide.

## One behavior, enough evidence

“One assertion per test” is not a rule. A scenario can need several assertions to prove one behavior, such as URL, confirmation heading, and generated order number. Avoid combining unrelated behaviors just to save setup time.

## Beware optional-path tests

```ts
if (await cookieBanner.isVisible()) {
  await cookieBanner.getByRole('button', { name: 'Accept' }).click();
}
```

This may be valid shared setup if the banner is intentionally nondeterministic in that environment. It is poor test logic when the banner itself is the behavior under test. Control the state and make expectations explicit.

## Make failures diagnostic

Use descriptive titles and steps:

```ts
test('declined card leaves order uncreated', async ({ page }) => {
  await test.step('submit a declined payment', async () => {
    // action
  });

  await test.step('show decline without an order number', async () => {
    // assertions
  });
});
```

Do not catch assertion errors, replace them with `console.log`, or retry an action until it happens to work. A trustworthy failure is part of the product feedback.

## Review generated scenarios

Remove duplicated happy paths, UI setup that belongs at a lower layer, assertions unrelated to the stated risk, shared-state dependencies, and secrets in titles or logs. Keep the smallest portfolio that gives useful risk coverage.
