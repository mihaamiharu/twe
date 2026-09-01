---
title: 'Choose Test Scenarios Worth Automating'
description: 'Evaluate test scenarios, choose the right test layer, and define a focused, repeatable automation intent.'
---

## After this lesson, you can

- evaluate whether a test scenario is worth automating based on product risk, how frequently the feedback is needed, controllability, observability, and maintenance cost;
- explain whether browser UI automation, a lower test layer, or manual or exploratory testing provides the most useful feedback;
- reduce an overly long flow to a more focused and diagnosable test;
- document an automation intent before writing code; and
- challenge assumptions in an AI-generated automation plan.

## Why this matters for QA

Every automated test has a maintenance cost. Once a test has been created, the QA engineer responsible for that area still needs to maintain it. If the test fails during regression, someone needs to investigate the cause and fix the test when it no longer matches the latest behavior or implementation.

The team also needs to prepare reliable state and test data, update the test when the behavior under test changes, and make sure the automated test continues to provide accurate feedback.

So the question is not only:

> Can we automate this test?

The more useful question is:

> Is this test useful enough and run often enough that the effort to build and maintain it is worth it?

Choosing a test scenario worth automating requires technical judgment. The goal is not to automate as many test cases as possible, but to choose tests that provide useful feedback to the team.

## The mental model

Evaluate each test scenario across the six factors below. This is not a formula or scoring system. It is a guide for seeing the trade-offs before deciding whether the scenario is worth automating.

| What to evaluate       | Question                                                                                                                                                                                                                                  | Warning sign                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Risk and value         | What important failure would this detect?                                                                                                                                                                                                | No one can explain the impact if this scenario fails.                                                                            |
| Repetition             | How often will the team need feedback from this test?                                                                                                                                                                                    | The test will probably run only once or very rarely.                                                                             |
| Controllability        | Can the state and test data be created and reset?                                                                                                                                                                                        | The test depends on shared data that is difficult to predict or must be prepared manually.                                       |
| Observability          | Can the expected result be verified clearly?                                                                                                                                                                                             | “It looks right” is the only way to check it.                                                                                     |
| Change and maintenance | How often do the flow and its expectations change?                                                                                                                                                                                       | The feature changes frequently, so the test needs constant maintenance.                                                         |
| Need for the browser   | Which parts genuinely need to be performed or verified through the browser? Can setup, additional verification, or cleanup happen through an API, database, fixture, or another layer? | Too many steps are forced through the UI even though the browser provides no additional feedback for them. |

A test scenario does not need perfect conditions to be worth automating.
For example, a scenario may have high product risk while its state or test data is still difficult to control. That does not necessarily mean the scenario is not worth automating.
The team may need to improve **testability** first—for example, by making test data easier to prepare, making state resettable, and making results easier to verify.

## Work through a realistic example

Consider login. A single test can involve multiple layers, depending on what needs to be prepared, performed, and verified.

| Feedback layer                  | Question it answers                                                               | Example                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Browser UI automation           | Exercise behavior that genuinely needs to be tested from the user's perspective.                        | The user fills in and submits the login form through the browser.                                             |
| API or service-level automation | Prepare test data, test business rules, or perform verification without going through the UI.             | The API creates an account in a particular state, or the service confirms that valid credentials are accepted. |
| Database                        | Check data changes that genuinely need to be verified in the backend.                                     | Confirm that a login attempt or a particular state change is stored as required by the test.                   |
| Unit or component tests         | Test small pieces of logic or components in isolation with fast feedback.                                 | A validation function handles a boundary value correctly.                                                     |
| Manual or exploratory testing   | Explore behavior that is subjective, unclear, or difficult for a script to evaluate.                      | Check whether the error message is clear when the user fails to log in.                                       |

These layers do not have to be used separately.

In a single web E2E test, for example, we can:

```text
Prepare test data through the API → Log in through the browser → Verify the result through the UI → If needed, verify data through the database → Clean up through the API
```

So the question is not simply:

> Should this test use the UI, API, or database?

It is:

> Which parts genuinely need to be tested through the UI, and which parts are more effective through another layer?

Keep the browser focused on the behavior we want to verify from the user's perspective. Setup, additional verification, and cleanup can use an API, database, fixture, or another approach that is more reliable and easier to maintain.

## When is UI automation actually needed?

Use UI automation when behavior genuinely needs to be tested from the user's perspective through the browser. For example, make sure the user can add a product to the cart and see the correct product, quantity, and subtotal.

That does not mean every part of the test needs to happen through the UI.

If the goal is to test hundreds of combinations for tax calculations, for example, the browser is not the most effective layer. The logic can be tested more quickly and thoroughly through an API, service, or unit test.

Even within one E2E test, we can combine several layers. Test data can be prepared through an API, the main action can happen in the browser, the result can be verified through the UI, and—when needed—additional verification can happen through an API or database.

For subjective behavior or an unclear expected result—for example, “Is the new design easy to understand?”—manual or exploratory testing is still more suitable.

When UI automation is genuinely needed, start with a test scenario that has a clear goal:

```text
Given a customer who is already logged in and one available product
When the customer adds one unit to an empty cart
Then the cart shows that product, quantity 1, and the correct subtotal
```

This does not mean every test must have a very short flow or only one click. What matters is that the test has a clear goal, so when it fails, we know which behavior is actually under test.

Setup such as creating a customer, preparing a product, or resetting the cart can happen through an API or fixture. Additional verification can also happen through an API or database when needed.

Keep the browser focused on the action and expected result that genuinely need to be verified from the user's perspective. Do not force setup, verification, or cleanup through the UI when another layer can do it faster and more reliably.

### Define the automation intent before writing the script

An automation intent helps QA, developers, and stakeholders understand what is actually being tested before implementation begins.

```text
Test scenario:
Product risk or business impact:
Why automate—or why not:
Which parts need the UI, and which parts can use another layer:
Starting state and test data:
User action:
Expected result or observable evidence:
Maintenance risk:
Assumptions from AI to verify:
```

If an important part is still unclear, investigate and ask questions before requesting or starting a complete automation script.

## When the test fails

A common problem is creating an E2E test that is too long:

```text
Create customer → verify email → configure profile → find product →
add product → apply voucher → pay → download invoice → delete customer
```

When the test fails, the root cause could be in many places. Test-data setup becomes more complicated, debugging takes longer, and a failure at an unrelated step can prevent us from getting feedback about the behavior we actually wanted to test.

If a test like this fails often, do not immediately add a retry or delay. Check:

1. What product risk is this test actually meant to evaluate?
2. Which steps are only setup and could happen through an API, fixture, or another layer?
3. Can this flow be split into several more focused test scenarios?
4. Which test data or dependency makes the test depend on a particular order or environment condition?

The solution is usually not to make the long test pass more often. Clarify its scope and separate its responsibilities instead.

A retry or delay may make the test look more stable, but it does not necessarily fix the root cause or make the test's feedback more useful.

## Review AI-assisted work

Suppose AI proposes an automation plan like this:

```text
Create a new customer, wait for the account to be ready, choose the first
product, finish checkout, and verify that the order was successful.
```

At first glance it looks fine, but many important things are still unclear:

* What product risk is actually being tested?
* What makes the customer and product test data reliable?
* What expected result actually shows that the order was successful?
* Why are account creation, cart behavior, and payment combined in one test?
* Which setup steps do not actually need to happen through the UI?
* What needs to be cleaned up so the test can run again?

Do not let AI fill in those details with its own assumptions.

Provide clear context in the prompt: the product risk, known constraints, how test data should be prepared, and the expected result or observable evidence required.

Then ask AI to identify assumptions that are still unclear and offer alternatives when another approach or test layer would be more appropriate.

## Check your understanding

Your team runs this manual test scenario on every release:

> A registered customer adds an available product to an empty cart. The product, quantity, and subtotal must be displayed correctly. The test environment can reset the cart and provides a product specifically for testing, but marketing often changes the product name shown to users.

Answer in your own words:

1. Is this test scenario worth automating? Why?
2. Which parts genuinely need to be performed or verified through the browser, and which parts can use another layer?
3. What starting state and test data are needed?
4. Which user action and expected result or observable evidence need to be verified?
5. What maintenance risks and AI assumptions still need to be checked?

## Compare your reasoning

One reasonable answer is:

- **Decision:** this test scenario is worth automating because it runs repeatedly, covers an important risk, has controllable state and test data, and has results that can be verified clearly.
- **Scope:** keep the browser focused on adding the product to the cart and verifying the result seen by the user. Broader price-calculation variations can be tested at a lower layer.
- **Starting state and test data:** use a resettable cart and a product specifically for testing. Do not depend on whichever product happens to appear first.
- **Evidence:** verify the correct product, quantity, and subtotal—not merely that the cart page opened successfully.
- **Maintenance risk:** the product name shown to users changes frequently. Test data should remain stable and should not depend on product order or wording that changes easily.
- **AI assumptions to verify:** customer setup, currency rules, how to identify the product under test, cleanup, and whether cart persistence is actually part of the test scope.

Your answer may differ depending on the product context and the risk you want to test. What matters is that you can explain the trade-offs and the reasoning behind your decision.

The goal is not simply to label a test as `UI`, `API`, or `manual`, but to choose the right layer for each part of the test.

## Before you continue

Make sure you can take a manual test scenario and explain:

1. the product risk it is intended to test;
2. whether the test scenario is worth automating;
3. which parts genuinely need to be performed or verified through the browser, and which parts can use another layer;
4. the starting state and test data it needs; and
5. the expected result or observable evidence that needs to be verified.

When all five parts are clear, you are ready for the next module.

There, you will look at how the browser represents a page so that automation can reliably find elements, perform actions, and verify expected results.
