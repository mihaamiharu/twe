---
title: 'What Web Automation Can—and Cannot—Do'
description: 'Build a clear mental model of what browser automation can prove and where QA judgment remains essential.'
---

## After this lesson, you can

- explain what web automation does well and where human judgment is still needed;
- turn a manual scenario into a risk, starting state, user action, and observable result;
- distinguish performing an action from proving that the application behaved correctly; and
- review an AI-generated test idea for missing context before asking for code.

No HTML, JavaScript, or Playwright knowledge is expected yet. This lesson is about the testing decision that comes before the tool.

## Start with the testing problem

Imagine this manual check:

> Add a product to the cart and make sure it works.

A manual QA engineer can fill in many gaps while testing. Which product should be used? Should the cart start empty? What does “works” mean? If the product is unavailable, a person can investigate and adapt.

Automation cannot quietly make those decisions. It follows the state, actions, and checks that we give it—including weak assumptions. A script may pass consistently while proving the wrong thing, or fail intermittently because its starting state was never controlled.

That is why automation is not a line-by-line translation of a manual test case. It is an explicit, repeatable version of a testing intent.

## Automation follows instructions, not intent

Web automation is strong when the work benefits from consistent repetition:

| Automation is useful for                          | Human testing is still valuable for                    |
| ------------------------------------------------- | ------------------------------------------------------ |
| Repeating the same important check                | Exploring behavior we do not understand yet            |
| Running known scenarios across supported browsers | Noticing confusing, awkward, or unexpected experiences |
| Checking precise observable results               | Deciding which new risk matters most                   |
| Producing repeatable failure evidence             | Adapting when the product behaves in a surprising way  |

These are partners, not competitors. Automation can protect known behavior while manual and exploratory testing discover new information.

## Build an automation intent

Before thinking about selectors or code, answer four questions:

1. **Risk:** What meaningful failure are we trying to detect?
2. **Starting state and data:** What must already be true for the check to be repeatable?
3. **User action:** What does the user do to trigger the behavior?
4. **Observable evidence:** What result would prove that the application produced the expected outcome?

![Automation intent chain showing risk, known starting state and data, user action, and observable evidence.](/images/tutorials/automation-intent-chain.svg)

_If one part of the chain is unclear, investigate before automating._

For the cart example, a useful intent could be:

| Part                    | Clearer definition                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Risk                    | A customer adds an available product, but the cart is not updated correctly.                           |
| Starting state and data | An active customer is signed in, the cart is empty, and a known product is available at a known price. |
| User action             | The customer adds one unit of that product to the cart.                                                |
| Observable evidence     | The cart shows the expected product, quantity `1`, and the correct subtotal.                           |

Now the purpose is reviewable before anyone writes code. A teammate can question the data, challenge the expected evidence, or decide that a different risk is more important.

## Action is not evidence

One of the most common weak test ideas ends after the interaction:

```text
Click Add to cart → test finished
```

The click only requests an action. It does not prove that the application updated the cart, calculated the subtotal, or saved the result correctly.

A stronger test observes a result that matters to the user:

```text
Add one product → cart shows the product, quantity, and expected subtotal
```

This distinction will matter later when you learn Playwright actions and assertions. An action asks the browser to do something; an assertion proves an observable condition after that action.

## Two models with different jobs

You will encounter two useful ways to describe a test. They are related, but they are not identical.

**Arrange–Act–Assert** describes the test structure:

- **Arrange:** establish the required state and data;
- **Act:** perform the behavior under test;
- **Assert:** prove the expected result.

**Locate–Interact–Observe** describes responsibilities inside a browser test:

- identify the control or information relevant to the user;
- interact with the page when an action is required;
- observe the application state that provides evidence.

A real test may locate and observe several things. Do not force every test into exactly three lines. The models help you reason about responsibilities; they are not syntax templates.

## Use AI without handing over judgment

AI can help turn notes into a clearer scenario, reveal missing assumptions, and draft alternatives. It does not know your product risk, data constraints, or business rules unless you provide them.

At this stage, ask AI for an **automation intent**, not a large script. For example:

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

## Check your judgment

Consider this manual scenario:

> Open “Forgot password,” enter an email address, submit the form, and check that it works.

Before continuing, identify what is missing from its risk, starting state, action, and evidence.

One reasonable framing is:

- **Risk:** a registered customer cannot start account recovery.
- **Starting state and data:** a recoverable account and an inbox controlled by the test are available.
- **User action:** request a reset for that account from the Forgot Password page.
- **Observable evidence:** the UI confirms the request without exposing whether arbitrary accounts exist, and the controlled inbox receives a usable reset message if email delivery is within this test’s scope.

Notice that “check that it works” hid both a product requirement and a scope decision. Clarifying those questions is automation engineering work.

## Takeaway

A useful automated test starts with a clear risk and ends with meaningful evidence. Code comes later. If the intent is vague, faster code generation only produces a vague test faster.
