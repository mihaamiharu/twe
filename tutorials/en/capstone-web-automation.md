---
title: 'Capstone: Prove a Trustworthy Checkout Feedback System'
description: 'Review and repair a generated checkout test, explain its evidence, and separate in-platform proof from real-project shipping evidence.'
---

## After this lesson, you can

- turn one valuable checkout risk into a focused recovery scenario;
- review generated code for locator, action, waiting, assertion, and error-handling defects;
- justify the smallest maintainable organization for the scenario;
- explain which Modules 1–9 decisions the repaired test demonstrates; and
- distinguish what the in-platform Practice verifies from what a real CI delivery still needs.

## Why this matters for QA

A capstone should not reward how many Playwright methods you remember. It should reveal whether you can review an untrustworthy test, preserve the product risk, repair the broken assumptions, and explain why the resulting feedback deserves attention.

AI can generate a test that runs and still hide every important QA decision. A structural selector may target the wrong control, a forced click may bypass a product problem, a fixed wait may only delay failure, and a swallowed assertion may report green without proving anything.

The final capability in this path is not “write a long framework.” It is “produce and defend a trustworthy signal.”

## The mental model

Treat capstone quality as a chain of proof:

```text
Valuable product risk
  + controlled starting state
  + actions that match user behavior
  + observable business evidence
  + independent and diagnosable execution
  + maintainable organization
  + repeatable delivery policy
  + an explanation of limitations
  = trustworthy automation feedback
```

If one link is missing, green execution can overstate what the test proves.

The capstone connects the path in four proof areas:

| Proof area                       | Earlier module decisions applied                         |
| -------------------------------- | -------------------------------------------------------- |
| Risk and scenario design         | Automation judgment and meaningful assertions            |
| UI contract and browser behavior | DOM inspection, locators, actions, and synchronization   |
| Reliability and maintainability  | Isolation, debugging, smallest useful abstraction        |
| Shipping and team feedback       | Reproducible CI, coverage, evidence, gate, and ownership |

The fourth row is a review lens, not an automated claim about what the Practice has shipped. The Practice proves the browser-level part of the chain; CI delivery and team ownership still require evidence from a real repository.

## Work through a realistic example

The product rule is:

> Quantity must be at least 1. After correcting an invalid quantity, the customer can place the order and sees the confirmed quantity.

This is one coherent recovery risk—not two unrelated tests forced together:

```text
Starting state: fresh checkout page with no confirmation
Action 1: submit quantity 0
Evidence 1: validation alert explains the rule; no confirmation appears
Action 2: correct quantity to 2 and submit again
Evidence 2: stale alert clears; confirmation reports 2 items
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

| Observed problem                    | Risk if left in place                                       | Repair direction                                   |
| ----------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Title only says `checkout`          | Report does not identify the protected behavior             | Name the recovery outcome                          |
| Structural `main > form` selectors  | DOM rearrangement breaks the test without changing behavior | Use label and role contracts                       |
| Only quantity `2` is entered        | Minimum-quantity rule is never exercised                    | Submit the invalid boundary before correcting it   |
| `{ force: true }`                   | Test bypasses unexplained actionability protection          | Use a normal click and investigate readiness       |
| `waitForTimeout(1000)`              | Time replaces an observable condition                       | Wait through web-first assertions on alert/status  |
| `textContent()` plus `toBeTruthy()` | Almost any non-empty message passes                         | Assert the exact validation and confirmed quantity |
| `try/catch` swallows the assertion  | Broken checkout can still report green                      | Let meaningful assertion failure fail the test     |

### Write the evidence contract before the final code

```text
Locator contract:
- Quantity field is identified by its label.
- Place order is identified by its button role and name.
- Validation and confirmation use alert/status semantics.

Assertion evidence:
- Alert has the exact minimum rule after invalid submit.
- Alert is hidden after a valid correction.
- Confirmation is visible and contains “2 items”.

Forbidden masks:
- no fixed sleep;
- no unexplained force;
- no `evaluate` or direct DOM manipulation;
- no weak truthiness claim;
- no swallowed error.
```

The full repair belongs in the attached Core Practice. The Practice checks the ordered submit sequence and the state after each submit, in addition to the final DOM state and required Playwright methods. The reasoning above is the contract; exact variable names are not.

### Decide the smallest maintainable organization

One scenario does not automatically earn a page object, fixture framework, or multi-folder architecture. A clear test with a few named locators may be the best design.

Extract a helper or component only if it localizes meaningful repeated change without hiding the validation and recovery steps. Explain the boundary you choose.

### Separate automated proof from shipping proof

The in-platform Practice can execute the browser behavior, verify the ordered invalid-to-recovery submit sequence, inspect the final page state, and check required Playwright methods. It cannot run a real GitHub Actions job, grade an edited `playwright.config.ts`, upload a trace, or assess written browser rationale. The shipping/team-feedback proof area above remains contextual awareness, not a completed delivery claim.

For a real-project portfolio extension, also provide:

- a reproducible local and CI command;
- the trigger and browser/project portfolio with reasons;
- one retained failed-run artifact or equivalent diagnostic package;
- a short root-cause note for the original generated defects;
- the suite’s known limitations and next highest-value risk; and
- evidence that scenarios pass alone, repeatedly, and under intended parallelism.

Do not claim the platform verified those deliverables when it did not.

## When to use it—and when not to

Use a recovery scenario when the risk is specifically that a customer can correct rejected input and continue safely. Use separate independent tests when the valid and invalid behaviors have different starting states, ownership, or failure meaning.

Keep the capstone scope small enough that every decision can be explained. One deep, trustworthy flow is better evidence than ten copied scripts.

Use a page or component object only when the scenario reveals a stable repeated boundary. Use a fixture only when a named dependency needs a lifecycle. A capstone rubric is not a reason to add architecture the suite does not need.

Use the in-platform Practice as one integrated browser-level code-repair checkpoint. Use a real repository and CI provider for portfolio-level shipping evidence. Do not treat a simulated browser challenge as proof that secrets, runners, deployments, or artifacts are configured safely.

## When it fails

| Green-looking result                          | Missing proof                                        | Evidence or repair                                    |
| --------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Final confirmation appears after quantity `2` | The ordered recovery sequence may not have been exercised | Assert the invalid state before correcting it         |
| Assertion method exists somewhere in code     | It may be inside swallowed error handling            | Remove catch and observe a deliberate failing version |
| Test passes once                              | State, ordering, or timing may still be unstable     | Repeat alone and under intended execution conditions  |
| Code is organized into several classes        | Abstraction may hide rather than localize behavior   | Trace each boundary to a real change pattern          |
| Browser challenge passes                      | CI target, secrets, coverage, and artifacts unproven | Run the portfolio extension in a real repository      |
| Retry passes                                  | Original failure remains an instability signal       | Inspect first-attempt evidence and repair root cause  |

Do not weaken the rubric because the generated code is difficult to repair. Do not add a sleep, forced action, broad catch, or global timeout merely to obtain green output.

## Review generated work

Perform a final generated-code review:

- What exact product risk does the test protect?
- Is the starting state controlled and independent?
- Do locator contracts express user or documented engineering meaning?
- Does every action wait for an observable application outcome?
- Would each assertion fail for a meaningful product regression?
- Are errors allowed to fail the test with useful evidence?
- Does any force, retry, timeout, or conditional hide an unexplained problem?
- Did the code introduce an abstraction that earns its maintenance cost?
- Can the scenario run alone, repeatedly, and in the intended project?
- Which CI, browser, artifact, and security claims remain outside platform verification?
- Can you explain every important generated line without asking AI again?

AI assistance is allowed. Responsibility for the claim remains with the reviewer.

## Check your understanding

Someone repairs the starter by replacing the selectors and removing the fixed wait. They keep `{ force: true }`, assert only that the confirmation is visible, and say the capstone is complete because it passed twice in the browser challenge.

Review that claim. Identify what the test proves, what remains weak, and which shipping evidence is still missing.

## Compare your reasoning

One reasonable review is:

- Semantic selectors improve the UI contract, and removing the fixed wait improves synchronization.
- The unexplained forced click still bypasses a readiness signal and must be removed or justified from evidence.
- Visibility alone does not prove the minimum rule or confirmed quantity.
- The recovery contract needs exact invalid evidence, alert clearance, and the `2 items` confirmation.
- Two passing runs are useful but do not test intended ordering, parallelism, or CI reconstruction.
- The browser challenge does not prove workflow configuration, target validation, secret safety, project coverage, artifact retention, or triage ownership.
- Complete the Core Practice, then produce those items separately if presenting a real-project portfolio.

The goal is an accurately bounded claim: strong evidence for the browser recovery sequence, and no exaggeration about CI delivery or team ownership that the Practice cannot verify.

## Before you continue

You should now be able to review and repair the checkout recovery test, justify its contracts and organization, and explain the boundary between platform-verified behavior and real-project shipping evidence.

This module is complete when its three Core lessons and the single `pw-capstone-checkout` Core Practice are complete. TWE records the Web Automation path as complete when every Core lesson and Core Practice across Modules 1–9 is complete. Optional lessons and Additional Practice do not block either status. Practical readiness still means carrying these decisions into an authorized real repository where CI, artifacts, environments, and team ownership can be observed directly.
