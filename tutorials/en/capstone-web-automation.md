---
title: 'Capstone: Repair a Checkout Test and Explain Its Limits'
description: 'Review an AI-generated checkout test, fix its locators, actions, waits, and assertions, then explain what the Practice verifies and what still needs a real project.'
---

## After this lesson, you can

- turn one checkout risk into a focused recovery scenario;
- review generated code for locator, action, waiting, assertion, and error-handling defects;
- choose the simplest code structure that remains easy to maintain;
- explain which Modules 1–9 decisions the repaired test demonstrates; and
- distinguish what the in-platform Practice verifies from what a real CI delivery still needs.

## Why this matters for QA

This capstone does not test how many Playwright methods you remember. You need to review a test that cannot yet be trusted, keep its product risk in focus, repair its incorrect assumptions, and explain which results it verifies.

AI can generate a test that runs and is still wrong. A structural selector may target the wrong control, a forced click may skip an actionability problem, a fixed wait may only delay failure, and an assertion inside `try/catch` may let a broken checkout test pass.

By the end of this path, you should be able to produce a test whose result you can explain and trust without building a long framework that is difficult to trace.

## The mental model

This capstone combines the important decisions from the full path:

```text
Clear product risk
  + controlled starting state
  + actions that match user behavior
  + expected results that can be checked
  + a test that runs independently and is easy to debug
  + code that is easy to maintain
  + a consistent way to run the test
  + explained limitations
  = an automation result the team can trust
```

If one part is missing, a passing test can make the coverage look stronger than the conditions it actually checked.

The capstone brings the path together in four parts:

| Part to review                   | Earlier module decisions applied                        |
| -------------------------------- | ------------------------------------------------------- |
| Risk and scenario design         | Scenario selection and accurate assertions              |
| How the test uses the UI         | DOM inspection, locators, actions, and synchronization  |
| Stable and maintainable tests    | Isolation, debugging, and only the abstraction needed   |
| How the team runs and uses tests | Reproducible CI, coverage, artifacts, gates, and triage |

The fourth row is only reviewed in this capstone. The Practice runs and checks browser behavior, but it does not run a CI workflow or assess how a team handles failures. Those parts still need to be checked in a real repository.

## Work through a realistic example

The product rule is:

> Quantity must be at least 1. After correcting an invalid quantity, the customer can place the order and sees the confirmed quantity.

This is one recovery scenario because the invalid input and correction happen in the same flow and starting state:

```text
Starting state: fresh checkout page with no confirmation
Action 1: submit quantity 0
Expected result 1: validation alert explains the rule; no confirmation appears
Action 2: correct quantity to 2 and submit again
Expected result 2: stale alert clears; confirmation reports 2 items
```

The generated starter is intentionally weak:

```ts
test('checkout', async ({ page }) => {
  await page.goto('/app/checkout.html');
  await page.locator('main > form > input').fill('2');
  await page.locator('main > form > button').click({ force: true });
  await page.waitForTimeout(1000);

  try {
    expect(await page.locator('.message').textContent()).toBeTruthy();
  } catch {
    console.log('ignore intermittent checkout issue');
  }
});
```

Review it before rewriting:

| Problem                             | Effect on the test                                          | Repair direction                                   |
| ----------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Title only says `checkout`          | Report does not identify the behavior under test            | Name the recovery outcome                          |
| Structural `main > form` selectors  | DOM rearrangement breaks the test without changing behavior | Use the correct label and role                     |
| Only quantity `2` is entered        | Minimum-quantity rule is never exercised                    | Submit an invalid quantity before correcting it    |
| `{ force: true }`                   | Test bypasses unexplained actionability protection          | Use a normal click and investigate readiness       |
| `waitForTimeout(1000)`              | Test waits for time instead of an application result        | Use web-first assertions on alert and status       |
| `textContent()` plus `toBeTruthy()` | Almost any non-empty message passes                         | Assert the exact validation and confirmed quantity |
| `try/catch` swallows the assertion  | Broken checkout can still report a pass                     | Let a failed assertion fail the test               |

### Define the locators and expected results before final code

```text
Locators:
- Quantity field is identified by its label.
- Place order is identified by its button role and name.
- Validation and confirmation use alert/status semantics.

Expected results:
- Alert has the exact minimum rule after invalid submit.
- Alert is hidden after a valid correction.
- Confirmation is visible and contains “2 items”.

Do not hide failures with:
- fixed sleep;
- unexplained `force`;
- `evaluate` or direct DOM manipulation;
- assertions that only check truthiness; or
- errors swallowed by `try/catch`.
```

Complete the repair in the attached Core Practice. The Practice checks the two submits in order, the state after each submit, the final DOM state, and the required Playwright methods. Variable names may differ as long as the behavior and expected results stay the same.

### Choose the simplest code structure

One scenario does not automatically need a page object, fixture framework, or several folders. A clear test with a few named locators may be the best design.

Move code to a helper or component object only when the same steps repeat and usually change together. Keep the validation and recovery steps visible in the test, and explain which maintenance problem the helper or object solves.

### Separate what the Practice checks from real-project work

The in-platform Practice can run the browser behavior, verify the invalid-to-recovery submit sequence, inspect the final page state, and check required Playwright methods. It cannot run a real GitHub Actions job, assess changes to `playwright.config.ts`, upload a trace, or evaluate a written reason for browser selection. Passing the Practice does not mean the test is ready to ship through CI.

For a real-project portfolio extension, also provide:

- a reproducible local and CI command;
- the trigger and browser/project portfolio with reasons;
- one artifact from a failed run or an equivalent set of diagnostics;
- a short root-cause note for the original generated defects;
- the test suite's known limitations and next highest-value product risk; and
- run results showing that scenarios pass alone, repeatedly, and with the intended parallelism.

Do not say the platform verified CI, browser coverage, or artifacts when those parts did not run.

## When to use it—and when not to

Use a recovery scenario when a customer must be able to correct rejected input and continue. Use separate tests when valid and invalid behavior need different starting states, change different data, or have different failure meanings.

Keep the capstone small enough to explain every decision. One flow checked thoroughly is more useful than ten copied scripts.

Use a page or component object when a stable UI area is reused. Use a fixture when a named resource needs setup, scope, and cleanup. Do not add architecture only to make the capstone look more complete.

Use the in-platform Practice to check the code repair and browser behavior. Use a real repository and CI provider to check runners, deployments, secrets, browser coverage, and artifacts. A simulated browser challenge cannot confirm that those parts are configured safely.

## When it fails

| Result that looks good                        | What is still unchecked                                   | How to check or repair                                |
| --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| Final confirmation appears after quantity `2` | The ordered recovery sequence may not have been exercised | Assert the invalid state before correcting it         |
| Assertion method exists somewhere in code     | It may be inside an error that is swallowed               | Remove `catch` and run a version designed to fail     |
| Test passes once                              | State, ordering, or timing may still be unstable          | Repeat alone and under intended execution conditions  |
| Code is organized into several classes        | Classes may hide behavior without helping maintenance     | Link each helper or object to real repeated code      |
| Browser challenge passes                      | CI target, secrets, coverage, and artifacts unproven      | Run the portfolio extension in a real repository      |
| Retry passes                                  | The first attempt still shows instability                 | Inspect the first-attempt artifact and fix root cause |

Do not weaken the rubric because the generated code is difficult to repair. Do not add a sleep, forced action, broad catch, or global timeout merely to obtain green output.

## Review AI-assisted work

Before accepting AI-generated code, check:

- What exact product risk does the test protect?
- Is the starting state controlled and independent?
- Do locators choose controls by how users interact with them or by attributes the team keeps stable?
- Does every action wait for an expected application result?
- Would each assertion fail when the important regression occurs?
- Can errors fail the test with a useful trace or log?
- Does any force, retry, timeout, or conditional hide an unexplained problem?
- Does each new helper or object solve repeated code that should be maintained in one place?
- Can the scenario run alone, repeatedly, and in the intended project?
- Which CI, browser, artifact, and security checks have not run in the platform?
- Can you explain every important generated line without asking AI again?

You may use AI assistance, but the reviewer remains responsible for checking that the result and explanation are accurate.

## Check your understanding

Someone repairs the starter by replacing the selectors and removing the fixed wait. They keep `{ force: true }`, assert only that the confirmation is visible, and say the capstone is complete because it passed twice in the browser challenge.

Review that conclusion. Explain what the test checks, what remains weak, and what still needs to run in a real project.

## Compare your reasoning

One reasonable review is:

- Locators based on labels and roles select controls by how users interact with them, and removing the fixed wait makes the test wait for application changes.
- The unexplained forced click still skips actionability checks. Remove `force` or find why the element is not ready for a normal click.
- Visibility alone does not prove the minimum rule or confirmed quantity.
- The recovery scenario needs the exact validation message, the cleared alert, and the `2 items` confirmation.
- Two passing runs are useful but do not check stability under the intended parallelism or show that a new CI runner can execute the test.
- The browser challenge does not check workflow configuration, target validation, secret safety, project coverage, artifact retention, or who handles failures.
- Complete the Core Practice, then produce those items separately if presenting a real-project portfolio.

The conclusion should be specific: the Practice verifies the browser recovery sequence, but it does not verify CI delivery or how the team handles failures.

## Before you continue

You should now be able to review and repair the checkout recovery test, explain your locator, assertion, and code-structure choices, and separate behavior checked by the platform from work that still requires a real project.

This module is complete when its three Core lessons and the `pw-capstone-checkout` Core Practice are complete. TWE records the Web Automation path as complete when every Core lesson and Core Practice across Modules 1–9 is complete. Optional lessons and Additional Practice do not block either status. To apply these skills in practice, use a repository you are authorized to test and check CI, artifacts, environments, and failure handling directly.
