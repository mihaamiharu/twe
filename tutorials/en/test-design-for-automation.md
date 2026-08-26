---
title: 'Turn Product Risk into Focused Scenarios'
description: 'Build a small, independent test portfolio from business rules, meaningful boundaries, and observable evidence.'
---

## After this lesson, you can

- turn a product risk into a focused precondition, action, and expected result;
- distinguish a useful positive, negative, or boundary scenario from a label-only variation;
- choose a small portfolio that covers different failure modes without duplicating the same flow;
- keep one scenario focused while using enough related assertions; and
- review generated test cases for invented behavior, optional paths, and hidden dependencies.

## Why this matters for QA

“Automate the checkout page” sounds like a task, but it is not a test design.

A checkout page can fail in very different ways:

- an available product cannot be purchased;
- an out-of-stock product is added to the cart;
- a declined payment creates an order anyway;
- quantity rules accept values outside the allowed range; or
- one customer sees another customer's order.

One long happy-path script does not cover all of those risks. Twenty generated variations of the same script do not automatically help either.

Automation should preserve the reasoning of a good manual test: the starting state is deliberate, the action challenges one rule, and the expected result would expose the failure that matters.

## The mental model

Design each scenario as a risk contract:

```text
Risk or business rule
          ↓
Controlled precondition and data
          ↓
One behavior under test
          ↓
Smallest sufficient observable evidence
```

Then build a portfolio by selecting scenarios with different reasons to fail:

![A checkout rule becomes a focused portfolio containing a core positive scenario, a business-rule negative scenario, and meaningful boundary scenarios, each with its own precondition, action, and evidence.](/images/tutorials/risk-scenario-portfolio.svg)

_Positive, negative, and boundary are useful lenses. The product rule—not the label—decides what belongs._

Use this question for every candidate:

> If this scenario fails, which specific product risk did we learn about?

If two tests would produce the same answer with the same data boundary and evidence, they may be duplicates. If one test contains five unrelated answers, it may need splitting.

## Work through a realistic example

The checkout product rules are:

- only available products can be ordered;
- quantity must be from 1 through 10;
- a declined payment must not create an order; and
- a successful order displays one generated order number.

### 1. Create a risk table before code

| Risk                                      | Controlled precondition                | Action                            | Sufficient evidence                           |
| ----------------------------------------- | -------------------------------------- | --------------------------------- | --------------------------------------------- |
| Valid purchase fails                      | Available item, quantity 1, valid card | Submit checkout                   | Confirmation and one order number             |
| Out-of-stock item is purchased            | Item explicitly out of stock           | Attempt to add it                 | Guidance shown and no cart line for that item |
| Declined payment creates an order         | Available item, declined test payment  | Submit checkout                   | Decline alert and no order number             |
| Quantity boundary is enforced incorrectly | Available item                         | Try 0, 1, 10, and 11 deliberately | Boundary-specific acceptance or guidance      |

This table is more useful than “one positive test and three negative tests.” It explains why each scenario exists.

### 2. Choose one core positive scenario

The positive scenario proves the most valuable supported flow:

```text
Given an active customer and an available Widget Pro
And quantity is 1 with a valid test payment
When the customer submits checkout
Then an order confirmation appears
And exactly one generated order number is shown
```

The confirmation and identifier are related evidence for one behavior. Multiple assertions are appropriate here.

Do not also assert the navigation bar, footer, theme, and unrelated account fields. Those failures would not explain whether checkout worked.

### 3. Design a business-rule negative scenario

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

Assume this application's test environment deliberately maps that documented test card to a decline. Never use real payment credentials.

The exact decline alert synchronizes with the failed-payment outcome. The absence of an order number adds evidence that the dangerous side effect did not occur. The scenario should start with no existing confirmation from earlier tests; Module 7 will cover how to implement that isolation and data control reliably.

### 4. Select meaningful boundaries

The allowed quantity range is 1 through 10. Useful partitions are:

- valid interior: a representative value such as 5;
- minimum valid: 1;
- maximum valid: 10;
- just below minimum: 0; and
- just above maximum: 11.

Testing 2, 3, 4, 5, 6, 7, 8, and 9 through the browser usually repeats the same rule. Test more combinations only when different implementation paths or risks justify them. Validation logic may deserve deeper coverage at a lower layer, while browser tests prove the critical user contract.

### 5. Keep scenarios independent in design

Avoid this hidden sequence:

```text
Test A creates a customer
        ↓
Test B assumes that customer exists
        ↓
Test C deletes the same customer
```

If Test A fails or execution order changes, B and C become misleading. Each scenario should be able to create or obtain its required state independently. A little explicit setup duplication can be clearer than an order-dependent suite.

This lesson defines the independence requirement. The next module covers browser contexts, test data, authentication state, cleanup, and practical implementation choices.

### 6. Avoid optional logic inside the behavior under test

Generated tests often contain:

```ts
if (await page.getByRole('alert').isVisible()) {
  await expect(page.getByRole('alert')).toContainText('Out of stock');
}
```

If the alert is the expected result, this code can skip the assertion and pass when the product is broken. Control the precondition, perform the action, and require the alert.

Conditional setup can occasionally be valid for environment noise outside the scenario, but it should not make the product behavior optional.

## When to use it—and when not to

Use a core positive scenario for a valuable supported flow. Add negative scenarios for business rules whose violation creates meaningful product, financial, security, or user-experience risk. Add boundary scenarios where behavior changes at a defined limit.

Do not create one negative test for every random invalid string. Group values that exercise the same rule into equivalence partitions and select representative cases. Add more only when encoding, locale, formatting, security, or an implementation path creates a distinct risk.

Keep one behavior per scenario, but allow several assertions that jointly prove that behavior. Split when setup, action, expected result, or failure diagnosis represents a different rule.

Browser automation is not the right layer for every combination. Use lower-level tests for exhaustive calculation or validation permutations when the browser adds no useful signal. Keep end-to-end coverage for critical user journeys and integration boundaries.

Do not merge scenarios solely to reduce setup time. Do not split them solely to satisfy “one assertion per test.” Optimize for meaningful failure reports and maintainable product feedback.

## When it fails

When a suite is noisy, slow, or difficult to trust, audit the design before adding retries:

1. Can each test name the risk or rule it covers?
2. Is the precondition explicit and controlled?
3. Does the test depend on data or side effects from another test?
4. Does conditional logic allow the expected behavior to be skipped?
5. Are many tests repeating the same equivalence partition?
6. Does one test combine several unrelated business outcomes?
7. Would the failure message identify the broken rule?
8. Is a browser test covering permutations better suited to a lower layer?

If a negative scenario passes unexpectedly, confirm it actually reached the intended invalid state. If a scenario only fails in parallel, suspect shared identity, inventory, order, or account data. Do not solve order dependence by forcing serial execution until you understand the shared state.

## Review generated work

Review generated scenarios with these questions:

- Did the generator invent a requirement, test account, boundary, or expected message?
- Can each scenario be traced to a business rule or product risk?
- Are “positive” and “negative” labels hiding duplicate flows?
- Are boundaries chosen around actual rule changes?
- Does any `if` statement make the expected outcome optional?
- Does one test depend on another test's data or execution order?
- Are unrelated assertions included because they were easy to generate?
- Is sensitive data present in source, titles, logs, or reports?
- Could important permutations be covered faster and more clearly below the UI layer?
- Can you explain why every retained scenario deserves maintenance cost?

AI can expand a list indefinitely. QA judgment decides the smallest portfolio that gives useful confidence.

## Check your understanding

A generated suite for a quantity rule of 1 through 10 contains these tests:

1. quantity 1 succeeds;
2. quantity 2 succeeds;
3. quantity 3 succeeds;
4. quantity 4 succeeds;
5. quantity 11 shows an error;
6. a valid purchase succeeds, then a second test reuses its order to test cancellation; and
7. an out-of-stock test asserts guidance only if the guidance happens to appear.

Decide which scenarios to keep, add, merge, split, or redesign. Explain the risk behind each decision.

## Compare your reasoning

One reasonable answer is:

- Keep quantity 1 because it is the minimum valid boundary.
- Replace the repeated 2, 3, and 4 browser cases with one representative valid interior value unless they exercise distinct rules.
- Add quantity 10 and 0 to cover the maximum valid and just-below-minimum boundaries; keep 11 for just above maximum.
- Decide whether exhaustive numeric validation belongs at a lower test layer.
- Make cancellation create or obtain its own order instead of relying on a previous test.
- Remove the conditional around out-of-stock guidance; explicitly establish out-of-stock state and require the guidance plus absence of a cart line.
- Retain one core successful purchase scenario with sufficient confirmation evidence.

The final portfolio is smaller but covers more distinct failure modes.

## Before you continue

You should now be able to turn business rules into focused positive, negative, and boundary scenarios; choose a non-duplicative portfolio; and recognize hidden dependencies or optional expected results.

This lesson uses its reasoning checkpoint rather than a separate code challenge. Module 6 completes when both Core lessons are read and the integrated assertion Core Practice is passed. Module 7 will show how to implement the controlled state, data, and isolation these designs require.
