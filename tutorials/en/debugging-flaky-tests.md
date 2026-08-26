---
title: 'Diagnose Failures from Evidence'
description: 'Reproduce failures, form competing hypotheses, inspect the right artifacts, and verify a root-cause repair under the conditions that exposed it.'
---

## After this lesson, you can

- distinguish a failure symptom from its root cause;
- reproduce a failure under the conditions that expose it;
- use errors, traces, UI Mode, screenshots, video, console, and network evidence deliberately;
- classify likely locator, synchronization, state, product, environment, or test-logic causes; and
- verify a repair without relying on force, fixed waits, blind retries, or reduced parallelism.

## Why this matters for QA

A red test tells you that the observed result did not match an expectation. It does not automatically tell you why.

An assertion timeout might come from a product defect, wrong test data, an ambiguous locator, a missing outcome, a failed API, or an incorrect expectation. If you immediately increase the timeout, you have changed the symptom without learning which system is wrong.

Debugging is QA investigation. The same discipline used to reproduce and isolate a manual defect applies here: preserve evidence, challenge assumptions, and make the smallest change that explains the failure.

## The mental model

Use an evidence loop rather than a patch loop:

```text
Observed symptom
      ↓
First meaningful failure
      ↓
Competing hypotheses
      ↓
Evidence that distinguishes them
      ↓
Root cause and targeted repair
      ↓
Repeat under the exposing conditions
```

![A debugging loop moves from an observed symptom to the first meaningful failure, competing hypotheses, distinguishing evidence, root cause, targeted repair, and stress verification.](/images/tutorials/debugging-evidence-loop.svg)

_A green rerun is not enough unless the repair explains the evidence and survives the original conditions._

Classify the hypothesis, not merely the error message:

| Hypothesis category       | Useful distinguishing evidence                                      |
| ------------------------- | ------------------------------------------------------------------- |
| Locator                   | Match count, accessible name, scope, frame, DOM snapshot            |
| Synchronization           | Action timeline and whether the intended outcome ever appeared      |
| Starting state or data    | Account, record IDs, setup response, execution order, worker        |
| Product defect            | User-visible result plus console or network behavior                |
| Environment or dependency | Service response, configuration, resource pressure, browser/project |
| Test logic                | Wrong expectation, optional branch, swallowed error, stale helper   |

Several hypotheses can fit the same symptom. Evidence should eliminate alternatives.

## Work through a realistic example

A cancellation test usually passes locally but fails in parallel CI:

```text
Expected: “Order canceled”
Received: “Order was already canceled”
```

The failure is observed at the status assertion. That does not prove the assertion is flaky.

### 1. Reproduce narrowly—and preserve the condition

First run the focused test alone, then deliberately reintroduce concurrency:

```bash
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --workers=1
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --repeat-each=10 --workers=4
```

If the failure appears only with several workers, parallel state becomes a strong hypothesis. Do not remove parallelism from the permanent suite yet; it is currently useful diagnostic pressure.

### 2. Start at the first meaningful failure

Read the earliest error connected to the product expectation. Later “element not found” or cleanup errors may be consequences of the earlier state change.

Record:

```text
First failing expectation: cancellation status
Expected state: one submitted order owned by this test
Actual state: the same order was already canceled
Exposing condition: repeated parallel execution
```

### 3. Form competing hypotheses

| Hypothesis                                     | What would support it?                                        |
| ---------------------------------------------- | ------------------------------------------------------------- |
| The click is sent twice                        | Two cancel actions or requests from one test                  |
| The UI displays a stale message                | Cancel request succeeds, but DOM shows an earlier response    |
| Another test cancels the same order            | Different worker requests use the same account and order ID   |
| The product cancellation endpoint is defective | One request against a submitted unique order returns conflict |

Do not edit code until evidence distinguishes these explanations.

### 4. Inspect the execution timeline

Retain traces for failures in the Playwright configuration:

```ts
export default defineConfig({
  use: {
    trace: 'retain-on-failure',
  },
});
```

Open a retained trace:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Inspect the failing run’s action timeline, locator details, before/after DOM snapshots, console messages, and network requests. UI Mode is useful while reproducing locally:

```bash
npx playwright test --ui
```

In this example, the evidence shows:

- this test clicked Cancel once;
- its request targeted `/api/orders/ORD-1042/cancel`;
- the server returned `409 Already canceled`;
- another worker’s trace used the same account and order ID moments earlier; and
- each test did receive a fresh browser context.

The root cause is shared backend data, not browser-session leakage or a slow assertion.

### 5. Repair the assumption

Create or allocate one submitted order per test and navigate using its returned ID. If account-level state is also mutable, allocate a worker-safe account. Keep the status assertion because it still expresses the correct product contract.

The repair changes ownership, not timing.

### 6. Verify under the original pressure

Rerun the focused test with the concurrency and repetition that exposed the problem. Then run its neighboring suite to detect unintended effects.

One passing rerun can happen by chance. A useful verification demonstrates that the repaired assumption remains controlled across repeated parallel runs.

## When to use it—and when not to

Use the first error and call log for a quick local failure. Use Inspector or `--debug` when stepping through actions and live-editing locators helps. Use UI Mode for interactive timeline exploration. Use retained traces for CI failures because they preserve actions, snapshots, console, and network evidence from the actual run.

Screenshots answer “what did the page look like at this moment?” Video helps with sequence and movement. A trace connects actions with before/after DOM, logs, network, timing, and errors. Collect the smallest artifact set that can distinguish your hypotheses.

Retries can expose that a test is flaky: Playwright reports a test that fails first and passes on retry as flaky. Retries can keep a broader CI run moving, but they are not evidence that the test is repaired. Investigate the failed attempt and consider failing CI on flaky tests when the team is ready to enforce that signal.

Do not use `force: true` to bypass an unexplained actionability failure. Do not add a fixed wait to a state or data problem. Do not replace a precise expected result with `toBeTruthy()`. Do not make dependent tests serial until you have identified the dependency and intentionally accepted it.

## When it fails

The debugging process itself becomes unreliable when evidence is missing or the experiment changes too many variables.

If you cannot reproduce locally:

1. Compare browser project, environment, worker count, retries, test data, and feature configuration.
2. Preserve the first failed attempt, not only the successful retry.
3. Use `--repeat-each` or targeted parallel execution to increase the suspected pressure.
4. Add safe diagnostic attachments around the disputed state—not arbitrary sleeps.
5. Record frequency and conditions instead of calling the failure “random.”

If a trace shows the target never exists, increasing a locator timeout will not create the missing data. If a forced click succeeds, investigate what originally covered, disabled, detached, or replaced the target. If several unrelated changes make the test green, revert to one hypothesis at a time so the repair remains explainable.

Artifacts can contain credentials, cookies, personal data, request bodies, and internal URLs. Restrict retention and access, and sanitize evidence before sharing it outside the authorized team or with an AI system.

## Review generated work

Give AI the exact error, relevant code, sanitized observations, and known execution conditions. Then review its response:

- Does it separate symptom from root cause?
- Does it offer multiple plausible hypotheses rather than one confident guess?
- What evidence would distinguish those hypotheses?
- Does the proposed change control an assumption or merely suppress a failure?
- Did it add `waitForTimeout`, `force`, broad retries, serial mode, or a weaker assertion?
- Did it invent an API response, environment detail, or product requirement?
- Can the repair be verified under the original failure conditions?
- Did you remove secrets and personal data from the supplied artifacts?

AI can help enumerate hypotheses. The test owner remains responsible for proving which one matches the evidence.

## Check your understanding

An AI assistant offers four fixes for a test that passes alone but sometimes fails with four workers:

1. increase the assertion timeout from 5 to 30 seconds;
2. set `workers: 1`;
3. add two retries;
4. inspect whether workers share the same account and record ID, then allocate owned data and repeat the parallel run.

The trace shows the failed request returned `409 Already processed`. Rank the suggestions as diagnosis, temporary mitigation, or symptom masking. Explain what you would change and how you would verify it.

## Compare your reasoning

One reasonable answer is:

- Suggestion 4 is the diagnosis path because the 409 and parallel-only condition point toward a shared server-side resource. Confirm the identities across workers, then give each test or worker owned mutable data.
- One worker may be a temporary containment measure for a genuinely constrained external system, but it should be narrowly documented—not the default repair here.
- Retries can reveal and report flakiness or keep unrelated CI work running, but they leave the shared-state cause intact.
- A longer assertion timeout is unrelated to a server response saying the operation already happened.
- Verify the ownership repair with repeated multi-worker execution and inspect any remaining first-attempt failures.

The correct assertion can stay. The hidden precondition is what needs repair.

## Before you continue

You should now be able to reproduce a failure, form competing hypotheses, select evidence that distinguishes them, repair the underlying assumption, and verify the result under the conditions that exposed it.

Complete the integrated Core Practice by repairing a generated test that targets the wrong order and masks its evidence. Module 7 completes when all three Core lessons are read and that Core Practice passes. Module 8 will use these reliability boundaries to decide when helpers, page objects, fixtures, and configuration improve maintainability rather than hide state.
