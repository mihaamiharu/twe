---
title: 'What Web UI Automation Can and Cannot Prove'
description: 'Build a clear mental model of what browser automation can prove and where QA judgment remains essential.'
---

## After this lesson, you can

- explain what web automation does well and where human judgment is still needed;
- turn a manual scenario into a product risk, starting state, user action, and observable evidence;
- distinguish performing an action from proving that the application behaved correctly; and
- review an AI-generated test idea for missing context before asking for code.

No HTML, JavaScript, or Playwright knowledge is expected yet. This lesson is about the testing decision that comes before the tool.

## Why this matters for QA

Imagine receiving this manual check:

> Add a product to the cart and make sure it works.

A manual QA engineer can fill in many gaps while testing. Which product should be used? Should the cart start empty? What does “works” mean? If the product is unavailable, a person can investigate and adapt.

Automation cannot quietly make those decisions. It follows the state, actions, and checks that we give it—including weak assumptions. A script may pass consistently while proving the wrong thing, or fail intermittently because its starting state was never controlled.
For example, a cart test may only check that the cart page opens after clicking Add to cart. The test passes, but it never proves that the correct product, quantity, or subtotal was added. Another test may fail intermittently because it assumes the cart is empty without resetting it first.

That is why automation is not a line-by-line translation of a manual test case. It is an explicit, repeatable version of a testing intent.

## The mental model

Before thinking about locators or code, frame the automation intent through four connected questions:

1. **Product risk:** What meaningful failure are we trying to detect?
2. **Starting state and test data:** What must already be true for the check to be repeatable?
3. **User action:** What does the user do to trigger the behavior?
4. **Observable evidence:** What result would prove that the application produced the expected outcome?

![Automation intent chain showing product risk, known starting state and test data, user action, and observable evidence.](/images/tutorials/automation-intent-chain.svg)

_If one part of the chain is unclear, investigate before automating._

You will also encounter two related ways to describe a test. They have different jobs.

**Arrange–Act–Assert** describes the test structure:

- **Arrange:** establish the required state and data;
- **Act:** perform the behavior under test;
- **Assert:** prove the expected result.

**Locate–Interact–Observe** describes responsibilities inside a browser test:

- identify the control or information relevant to the user;
- interact with the page when an action is required;
- observe the application state that provides evidence.

A real test may locate and observe several things. Do not force every test into exactly three lines. These models help you reason about responsibilities; they are not syntax templates.

## Work through a realistic example

Now make the cart scenario explicit:

| Part                         | Clearer definition                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Product risk                 | A customer adds an available product, but the cart is not updated correctly.                           |
| Starting state and test data | An active customer is signed in, the cart is empty, and a known product is available at a known price. |
| User action                  | The customer adds one unit of that product to the cart.                                                |
| Observable evidence          | The cart shows the expected product, quantity `1`, and the correct subtotal.                           |

The purpose is now reviewable before anyone writes code. A developer can question the setup data. A product owner can correct the expected outcome. Another QA engineer can challenge whether this is the most valuable risk.

That discussion is part of automation engineering. It prevents fast implementation of the wrong test.

## When to use it—and when not to

Use this framing whenever you create or review an automated check—whether a person or AI will write the code.

Web automation is strong when the work benefits from consistent repetition:

| Automation is useful for                          | Human testing is still valuable for                    |
| ------------------------------------------------- | ------------------------------------------------------ |
| Repeating the same important check                | Exploring behavior we do not understand yet            |
| Running known scenarios across supported browsers | Noticing confusing, awkward, or unexpected experiences |
| Checking precise observable results               | Deciding which new risk matters most                   |
| Producing repeatable failure evidence             | Adapting when the product behaves in a surprising way  |

These are partners, not competitors. Automation can protect known behavior while manual and exploratory testing discover new information.

Do not automate an unclear scenario merely because it can be scripted. If the risk, state, or expected outcome is still unknown, investigate first.

## When it fails

One common weak test idea ends after the interaction:

```text
Click Add to cart → test finished
```

The click only requests an action. It does not prove that the application updated the cart, calculated the subtotal, or saved the result correctly.

If a test like this passes while the bug still reaches customers, inspect its final claim:

1. Which business outcome should have been proved?
2. What evidence did the test actually inspect?
3. Could the test pass while the application remained wrong?

The repair is not a longer delay or another run. It is meaningful evidence:

```text
Add one product → cart shows the product, quantity, and expected subtotal
```

Later, Playwright will express this distinction through actions and assertions. An action asks the browser to do something. An assertion proves an observable condition after it.

## Review AI-assisted work

AI can help turn notes into a clearer scenario, reveal missing assumptions, and draft alternatives. It does not know your product risk, data constraints, or business rules unless you provide the context—for example, what you are trying to test, what data is available, and what behavior is expected.

At this stage, ask AI for an **automation intent**, not a large script:

```text
Help me frame a web UI automation candidate. Do not write code.

Product risk: customers may see the wrong cart subtotal.
Known state: signed-in customer, empty cart, one product with a controlled price.
User action: add one unit to the cart.

Identify missing assumptions and propose observable evidence.
```

Review the response with QA questions:

- Did it preserve the risk we care about?
- Did it invent product behavior or test data?
- Is every required starting condition explicit?
- Could the proposed evidence pass while the business behavior is still wrong?
- Which claim needs confirmation from product requirements or the team?

AI can draft the reasoning. You remain responsible for accepting, rejecting, or correcting it.

## Check your understanding

Consider this manual scenario:

> Open “Forgot password,” enter an email address, submit the form, and check that it works.

Before continuing, identify what is missing from its product risk, starting state and test data, user action, and observable evidence.

## Compare your reasoning

One reasonable framing is:

- **Product risk:** a registered customer cannot start account recovery.
- **Starting state and test data:** a recoverable account and an inbox controlled by the test are available.
- **User action:** request a reset for that account from the Forgot Password page.
- **Observable evidence:** the UI confirms the request without exposing whether arbitrary accounts exist, and the controlled inbox receives a usable reset message if email delivery is within this test’s scope.

Another answer may be valid when the product requirements or test scope differ. “Check that it works” hid both a product rule and a scope decision; making those decisions explicit is the capability being practiced.

## Before you continue

You should now be able to take a vague manual scenario and explain its product risk, starting state and test data, user action, and observable evidence.

If the intent is still unclear, do not rush into code. Faster code generation only produces a vague test faster.

The next lesson uses this mental model to decide which scenarios are worth automating and which feedback layer can prove them most effectively.
