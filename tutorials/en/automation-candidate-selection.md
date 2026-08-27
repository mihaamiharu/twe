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

## Why this matters for QA

Most browser interactions can be automated somehow. That does not make all of them good investments.

An automated check has a continuing cost. The team must create reliable state and data, keep the test aligned with the product, investigate failures, and update it when behavior changes.

The useful question is therefore not only “Can we automate this?” but:

> Will this check provide valuable feedback often enough to justify building and maintaining it?

Candidate selection is an engineering decision, not a competition to automate the largest number of manual test cases.

## The mental model

Evaluate a candidate through six lenses. They expose trade-offs; they do not produce an automatic score.

| Lens                   | Ask                                                    | Warning sign                                                    |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Risk and value         | What meaningful failure would this detect?             | No one can explain the impact of failure.                       |
| Repetition             | How often will the team need this feedback?            | The check is unlikely to run again.                             |
| Controllability        | Can we create and reset the required state and data?   | It depends on shared, unpredictable, or manually prepared data. |
| Observability          | Can the expected result be proved clearly?             | “Looks right” or “seems to work” is the only evidence.          |
| Change and maintenance | How often do the workflow and expectations change?     | The product is an experiment whose behavior changes daily.      |
| Need for the browser   | Must a real user-facing integration be exercised here? | The browser adds cost but no useful evidence.                   |

A candidate does not need perfect conditions. A valuable scenario with uncontrollable data may mean “improve testability first,” not “never automate it.”

## Work through a realistic example

Consider login. Related risks need different kinds of feedback:

| Feedback layer                  | Question it answers                                                               | Example                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Browser UI automation           | Can a user complete an important journey through the real page?                   | A customer submits a valid login form and reaches the authenticated area. |
| API or service-level automation | Do rules and integrations work across many data combinations without the page?    | The service accepts valid credentials and rejects invalid combinations.   |
| Unit or component tests         | Does focused logic or isolated UI behavior work correctly with fast feedback?     | A validation function handles its boundary values.                        |
| Manual or exploratory testing   | Is there new, subjective, ambiguous, or rapidly changing behavior to investigate? | Explore whether an error message helps a user recover.                    |

You do not need to implement every layer yourself to make a good recommendation. A QA engineer should be able to explain the risk and collaborate on where the team can test it most effectively.

The same feature often needs several layers. Login may have many fast service checks, a few browser flows, security testing, and exploratory sessions. The goal is useful combined coverage—not one layer winning.

## When to use it—and when not to

Use browser UI automation when the risk genuinely requires evidence from the user-facing page and its browser integrations. Use a lower layer when it can prove the rule more directly, quickly, and broadly. Keep subjective or poorly understood behavior in manual and exploratory testing until the expected result becomes clear.

When browser evidence is justified, keep the first flow thin:

```text
Given an active customer and one available product
When the customer adds one unit to an empty cart
Then the cart shows that product, quantity 1, and the correct subtotal
```

This does not mean every test must contain only one click. It means each test should have a focused reason to fail and enough context to diagnose that failure.

Setup such as creating a customer or resetting a cart may later use an API or fixture. Keep the UI portion focused on the user-facing integration that needs browser evidence.

Record the decision before requesting a script:

```text
Scenario:
Product risk or business impact:
Why automate—or why not:
Why UI—or why another layer:
Required starting state and test data:
User action:
Observable business evidence:
Likely maintenance risks:
AI-generated assumptions to verify:
```

If an important field is unknown, investigate before implementation.

## When it fails

A large end-to-end journey can look valuable because it covers many screens:

```text
Create customer → verify email → configure profile → find product →
add product → apply voucher → pay → download invoice → delete customer
```

But one failure may have many possible causes. Data setup becomes harder, diagnosis becomes slower, and unrelated product changes can block the result you care about.

Do not repair this with a retry or delay. Ask instead:

1. Which product risk is the test meant to prove?
2. Which steps are only setup and do not need the UI?
3. Can the journey be divided into focused independent scenarios?
4. Which data creates ordering or environment dependencies?

The repair is a smaller scope with explicit state and evidence. A greener oversized test is not necessarily a more useful one.

## Review generated work

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

## Check your understanding

Your team manually checks this on every release:

> A registered customer adds an in-stock product to an empty cart. The product row, quantity, and subtotal should be correct. The test environment can reset the cart and provides a controlled product, but marketing changes public product names frequently.

Decide whether it is a good automation candidate. Explain:

1. whether it is worth automating and why;
2. whether browser UI is the right feedback layer;
3. the required starting state and test data;
4. the focused user action and observable evidence; and
5. the maintenance risks and AI assumptions that still need verification.

## Compare your reasoning

One reasonable review is:

- **Decision:** automate a thin UI flow because it is repeated, important, controllable, and has observable browser evidence.
- **Scope:** verify adding the controlled product and the resulting cart state; cover broad price calculations below the UI.
- **State and data:** use the resettable cart and controlled product instead of relying on whichever product appears first.
- **Evidence:** verify the intended product identity, quantity, and subtotal—not merely that the cart page opened.
- **Maintenance risk:** public product names change, so the team needs a stable test-data contract rather than an assumption about display order or wording.
- **AI assumptions to verify:** customer setup, currency rules, product identity, cleanup, and whether cart persistence belongs in this scenario.

Another answer can be valid if its reasoning is explicit and fits the actual product context. Automation judgment is about defensible trade-offs, not memorizing a label.

## Before you continue

You should now be able to take a manual scenario and explain its product risk, whether automation is worthwhile, which feedback layer fits, what state and data it needs, and which observable evidence would prove the result.

Module 1 is complete after these two Core lessons. It deliberately has no Core Practice: the capability at this stage is making and explaining a sound automation decision before code.

Module 2 will show how the browser represents a page so that automation can identify the intended actions and evidence reliably.
