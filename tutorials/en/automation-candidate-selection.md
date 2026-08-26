---
title: 'Choose and Frame a Good Automation Candidate'
description: 'Select valuable checks, choose an appropriate feedback layer, and define a small repeatable automation intent.'
---

## After this lesson, you can

- evaluate an automation candidate using risk, repetition, controllability, observability, and maintenance cost;
- explain whether browser UI automation, a lower test layer, or human testing provides the most useful feedback;
- narrow a large journey into a smaller, diagnosable flow;
- document an automation intent before writing code; and
- challenge assumptions in an AI-generated automation plan.

## Automatable does not mean worth automating

Most browser interactions can be automated somehow. That does not make all of them good investments.

An automated check has a continuing cost. The team must create reliable state and data, keep the test aligned with the product, investigate failures, and update it when behavior changes. The useful question is therefore not only “Can we automate this?” but:

> Will this check provide valuable feedback often enough to justify building and maintaining it?

Candidate selection is an engineering decision, not a competition to automate the largest number of manual test cases.

## Evaluate the candidate through six lenses

Use these questions to expose trade-offs. They support judgment; they do not produce an automatic score.

| Lens                   | Ask                                                    | Warning sign                                                    |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Risk and value         | What meaningful failure would this detect?             | No one can explain the impact of failure.                       |
| Repetition             | How often will the team need this feedback?            | The check is unlikely to run again.                             |
| Controllability        | Can we create and reset the required state and data?   | It depends on shared, unpredictable, or manually prepared data. |
| Observability          | Can the expected result be proved clearly?             | “Looks right” or “seems to work” is the only evidence.          |
| Change and maintenance | How often do the workflow and expectations change?     | The product is an experiment whose behavior changes daily.      |
| Need for the browser   | Must a real user-facing integration be exercised here? | The browser adds cost but no useful evidence.                   |

A candidate does not need perfect conditions. The questions reveal what the team must improve or accept. A valuable scenario with uncontrollable data may mean “improve testability first,” not “never automate it.”

## Choose the feedback layer deliberately

“Do not automate this through the UI” does not mean “do not test it.” Different layers answer different questions.

| Feedback approach               | Best suited to                                                                   | Example                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Browser UI automation           | A small number of important user journeys and browser integrations               | A customer can submit a valid login form and reach the authenticated area.     |
| API or service-level automation | Rules, integrations, and many data combinations that do not need a rendered page | Tax is calculated correctly for hundreds of location and product combinations. |
| Unit or component checks        | Focused logic or isolated UI behavior with fast feedback                         | A discount function handles its boundary values.                               |
| Manual or exploratory testing   | New, subjective, ambiguous, or rapidly changing behavior                         | Investigate whether a redesigned checkout is understandable and trustworthy.   |

You do not need to implement every layer yourself to make a good recommendation. As a QA engineer, you should be able to explain the risk and collaborate on where the team can test it most effectively.

The same feature often needs more than one layer. A login feature may have many fast service-level checks, a few browser flows, security testing, and exploratory sessions. The goal is useful combined coverage—not one layer winning.

## Keep the first UI flow thin

A large end-to-end journey can appear valuable because it covers many screens:

```text
Create customer → verify email → configure profile → find product →
add product → apply voucher → pay → download invoice → delete customer
```

But one failure may have many possible causes. Data setup is harder, recovery is slower, and unrelated product changes can block the result you care about.

Prefer a smaller flow with one clear purpose:

```text
Given an active customer and one available product
When the customer adds one unit to an empty cart
Then the cart shows that product, quantity 1, and the correct subtotal
```

This does not mean every test must contain only one click. It means each test should have a focused reason to fail and enough context to diagnose that failure.

Preparation such as creating a customer or resetting a cart may later be performed through an API or fixture. The UI portion should focus on the user-facing behavior that actually needs browser evidence.

## Write the intent before the script

An automation-intent record lets QA, developers, and product stakeholders review the planned check without debating syntax.

```text
Scenario:
Risk or business impact:
Why automate—or why not:
Why UI—or why another layer:
Required starting state and data:
User action:
Observable business result:
Likely maintenance risks:
AI-generated assumptions to verify:
```

Here is a completed example:

| Field                    | Cart example                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario                 | Add one available product to an empty cart.                                                                                                          |
| Risk or impact           | Customers cannot begin checkout or see an incorrect subtotal.                                                                                        |
| Why automate             | The flow is business-critical and checked on every release.                                                                                          |
| Why UI                   | We need evidence that the user-facing product control and cart integrate correctly. Price calculation should also have broader lower-level coverage. |
| Starting state and data  | Active customer, empty cart, controlled product with known availability and price.                                                                   |
| User action              | Add one unit of the controlled product.                                                                                                              |
| Observable result        | Correct line item, quantity, and subtotal appear in the cart.                                                                                        |
| Maintenance risks        | Product data or cart behavior may differ between environments.                                                                                       |
| AI assumptions to verify | How sign-in and product setup occur; currency and rounding rules; whether cart persistence is in scope.                                              |

If important fields are unknown, investigate before requesting a full script.

## Review an AI-generated plan before code

Suppose AI proposes this plan:

```text
Create a new customer, wait for the account to be ready, choose the first
product, finish checkout, and verify that the order was successful.
```

It sounds productive, but it hides major questions:

- Which product risk is the test meant to cover?
- What makes the customer and product data reliable?
- What observable result defines “successful”?
- Why are account creation, cart behavior, and payment combined?
- Which setup steps could avoid the UI?
- What must be cleaned up so the test can run again?

Ask AI to expose those decisions instead of silently making them. A useful prompt provides the risk, known constraints, available data setup, and required evidence, then asks for missing assumptions and alternatives.

## Module checkpoint: frame the candidate

Your team manually checks this on every release:

> A registered customer adds an in-stock product to an empty cart. The product row, quantity, and subtotal should be correct. The test environment can reset the cart and provides a controlled product, but marketing changes public product names frequently.

Decide whether it is a good browser automation candidate, then complete the intent record in your own words.

One reasonable review is:

- **Decision:** automate a thin UI flow because it is repeated, important, controllable, and has observable browser evidence.
- **Scope:** verify adding the controlled product and the resulting cart state; cover broad price calculations below the UI.
- **State and data:** use the resettable cart and controlled product instead of relying on whichever product appears first.
- **Evidence:** verify the intended product identity, quantity, and subtotal—not merely that the cart page opened.
- **Maintenance risk:** public product names change, so the team needs a stable test-data contract rather than an assumption about display order or wording.
- **AI assumptions to verify:** customer setup, currency rules, product identity, cleanup, and whether cart persistence belongs in this scenario.

Another answer can be valid if its reasoning is explicit and fits the actual product context. Automation judgment is about defensible trade-offs, not memorizing a label.

## Ready for the next module

You are ready to continue when you can take a vague manual scenario and explain:

1. the risk it protects against;
2. whether automation is worthwhile;
3. why browser UI is—or is not—the appropriate feedback layer;
4. the required starting state and data; and
5. the observable evidence that would prove the result.

The next module will show how the browser represents the page so that automation can identify those actions and observations reliably.
