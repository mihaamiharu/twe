---
title: 'Find the Root Cause of a Failing Test'
description: 'Reproduce the problem, inspect errors, traces, screenshots, and network evidence, then verify that the fix solves the real cause.'
---

## After this lesson, you can

- distinguish the visible symptom from the real root cause;
- reproduce a failure under the conditions that trigger it;
- use error messages, traces, UI Mode, screenshots, video, console, and network evidence during debugging;
- decide whether the problem comes from a locator, synchronization, test data, product, environment, or test logic; and
- verify that a fix works without relying on `force`, fixed waits, retries, or reduced parallel execution.

## Why this matters for QA

A failing test tells you that the actual result differs from the expected result. It does not immediately tell you why.

An assertion timeout can have many causes: a product defect, wrong test data, an incorrect locator, an expected result that never appears, a failed API request, or a wrong expectation in the test.

Increasing the timeout may make the test wait longer, but it does not reveal the root cause.

Module 5 showed how to choose the condition to wait for after an action. When that condition still does not appear, identify which part may be wrong: the locator, timing, test data, product, environment, or test logic.

Collect evidence before changing the code.

The process is the same as investigating a manual defect: reproduce the problem, check possible causes one by one, collect relevant evidence, and change the test or product based on the root cause.

## The mental model

Do not change the test only to make it pass. Follow this loop:

```text
Observed symptom and failure conditions
      ↓
Find the first meaningful failure
      ↓
List several possible causes
      ↓
Inspect evidence that distinguishes those causes
      ↓
Identify the root cause and make a targeted repair
      ↓
Rerun under the conditions that previously caused the failure
```

![A debugging loop moves from an observed symptom to the first meaningful failure, competing hypotheses, distinguishing evidence, root cause, targeted repair, and stress verification.](/images/tutorials/debugging-evidence-loop.svg)

_One passing rerun is not enough. The fix must match the root cause and keep passing under the conditions that previously triggered the failure._

Group the possible causes so the investigation stays focused:

| Possible cause              | What to inspect                                                           |
| --------------------------- | ------------------------------------------------------------------------- |
| Locator                     | Match count, accessible name, scope, iframe, and DOM state                |
| Synchronization             | Action order and whether the expected result ever appeared                |
| Starting state or test data | Account, record ID, setup result, execution order, and worker             |
| Product defect              | What the user sees, plus console or network information                   |
| Environment or dependency   | Service response, configuration, available resources, and browser project |
| Test logic                  | Wrong expected result, optional flow, ignored error, or outdated helper   |

Several possible causes can match the same symptom.

Use errors, traces, screenshots, network evidence, and other information to eliminate alternatives until the root cause is clear.

## Work through a realistic example

A cancellation test usually passes locally but fails when CI runs it in parallel:

```text
Expected: “Order canceled”
Received: “Order was already canceled”
```

The status assertion fails, but that does not mean the assertion itself is flaky.

### 1. Reproduce the failure without removing its trigger

Run the test by itself first, then run it again with several workers:

```bash
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --workers=1
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --repeat-each=10 --workers=4
```

If the failure appears only with several workers, shared test data or state becomes a strong hypothesis.

Do not permanently disable parallel execution only to make the test pass. Parallel execution is currently helping reproduce the problem.

### 2. Start at the first meaningful failure

Read the earliest error that relates to the expected result.

Later errors such as **element not found** or failed cleanup may only be consequences of an earlier problem.

Record the important conditions:

```text
First failure: cancellation status
Expected state: one submitted order created for this test
Actual state: the same order was already canceled
Condition that triggers it: repeated parallel execution
```

### 3. List several possible causes

| Possible cause                         | What to inspect                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| The click is sent twice                | Whether one test sends two cancel actions or requests                         |
| The UI shows an old message            | Whether the cancel request succeeds while the UI shows an earlier response    |
| Another test cancels the same order    | Whether another worker uses the same account or order ID                      |
| The cancellation endpoint has a defect | Whether one request against a unique submitted order still returns a conflict |

Do not change the code yet. Check the error, trace, network requests, and test data to decide which possible cause matches the evidence.

### 4. Inspect the event order in the trace

Keep traces for failed tests in the Playwright configuration:

```ts
export default defineConfig({
  use: {
    trace: 'retain-on-failure',
  },
});
```

Open the failed trace:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Inspect the action order, locator details, DOM before and after actions, console messages, and network requests from the failed test.

UI Mode can help while reproducing and inspecting the test locally:

```bash
npx playwright test --ui
```

In this example, the evidence shows:

- this test clicked Cancel once;
- its request targeted `/api/orders/ORD-1042/cancel`;
- the server returned `409 Already canceled`;
- a trace, report, or log from another worker shows the same account and order ID were used moments earlier; and
- each test did receive a fresh browser context.

The root cause is shared backend data. The browser session did not leak, and the assertion is not too slow.

### 5. Fix the real cause

Create one submitted order for each test and use the returned ID to open it.

If several tests also change account-level data, use separate accounts so they cannot interfere with one another.

Keep the status assertion because the expected result is still correct. Fix the test data and setup, not the assertion timing.

### 6. Rerun under the conditions that caused the failure

Rerun the test with the same worker count and repetition that exposed the problem.

Then run related tests to make sure the setup change did not introduce another problem.

One passing rerun can happen by chance. The fix is more convincing when the test remains stable across repeated parallel runs like the ones that previously failed.

## When to use it—and when not to

For a simple failure that can be reproduced locally, start with the error message and call log.

Use Inspector or `--debug` when you need to step through actions and try locators in the browser.

Use UI Mode when you want to inspect the test flow visually.

For failures that only appear in CI, traces are often more useful because they preserve actions, DOM snapshots, console messages, network requests, timing, and errors from the run that failed.

A screenshot shows the page at one moment. A video helps show the sequence. A trace provides broader context around what happened before and after the failure.

Collect only the artifacts needed to distinguish the possible causes.

Retries can reveal that a test is flaky. Playwright marks a test as flaky when it fails on the first run and passes on a retry.

Retries can allow CI to continue running other tests, but a successful retry does not prove that the test is healthy. Investigate the failed attempt.

Do not use `force: true` to bypass an actionability failure you do not understand. Do not add a fixed wait for a test-data or state problem. Do not replace a precise expected result with `toBeTruthy()` only to make the test pass.

Do not make dependent tests serial before identifying the dependency that makes them interfere with each other.

## When it fails

Debugging becomes unreliable when evidence from the failed run is missing or several unrelated changes are made at once.

If you cannot reproduce locally:

1. Compare the browser project, environment, worker count, retries, test data, and feature configuration between local and CI.
2. Preserve evidence from the first failed attempt, not only the run that passes after retrying.
3. Use `--repeat-each` or several workers when the problem may require repeated or parallel execution.
4. Add logs or attachments that expose the suspected state instead of adding a fixed sleep.
5. Record how often the failure happens and which conditions trigger it instead of calling it random.

If the trace shows that the target never appeared, increasing the locator timeout will not fix the problem.

If `force` makes a click succeed, investigate why the normal click failed. An overlay may cover the target, the control may be disabled, the element may have changed, or the locator may point to the wrong target.

When testing a fix, change one thing connected to the possible root cause. If several unrelated changes are made at once, you cannot tell which one solved the problem.

Traces, screenshots, videos, and network logs can contain cookies, credentials, personal data, request bodies, and internal URLs.

Limit access and retention. Remove or redact sensitive data before sharing artifacts outside the team or with an AI system.

## Review AI-assisted work

Give AI the exact error, relevant code, sanitized observations, and conditions under which the failure occurred.

Then review its response:

- Does it separate symptom from root cause?
- Does it offer several plausible causes instead of immediately guessing one?
- What evidence would distinguish those hypotheses?
- Does the proposed change control an assumption or merely suppress a failure?
- Did it suggest `waitForTimeout()`, `force`, excessive retries, serial execution, or a weaker assertion?
- Did it invent an API response, environment detail, or product requirement?
- Can the repair be verified under the original failure conditions?
- Did you remove secrets and personal data from the supplied artifacts?

AI can help organize possible causes and investigation steps. The test owner still needs to check the evidence and prove the root cause.

## Check your understanding

An AI assistant offers four fixes for a test that passes alone but sometimes fails with four workers:

1. increase the assertion timeout from 5 to 30 seconds;
2. set `workers: 1`;
3. add two retries;
4. inspect whether workers share the same account and record ID, then allocate owned data and repeat the parallel run.

The failed trace shows that the request returned `409 Already processed`.

Explain which suggestion helps find the root cause, which might be a temporary measure, and which ones only hide the problem.

## Compare your reasoning

One possible answer is:

- Suggestion 4 is the most relevant path to the root cause. A `409 Already processed` response that appears only during parallel execution suggests that several workers may use the same backend data. Check the account and record ID used by each worker, then give each test or worker its own mutable data.
- One worker can be a temporary measure when an external system cannot handle concurrent access. It is not the main fix when tests accidentally share data.
- Retries can reveal flakiness or allow other CI tests to keep running, but they do not fix the shared-state problem.
- Increasing the assertion timeout does not change a `409` response because the operation has already been processed.
- After separating test data, rerun the test several times with multiple workers and inspect any remaining first-attempt failures.

The assertion is correct. The starting state and shared test data need to be fixed.

## Before you continue

You should now be able to reproduce a failing test, list possible causes, use evidence from the failed run to find the root cause, and verify that the fix solves the problem.

Complete the Core Practice by fixing a test that uses the wrong order and makes its root cause difficult to see.

Module 7 is complete after all three Core lessons and the Core Practice are completed.

Module 8 explains when helpers, page objects, fixtures, and configuration improve maintainability without hiding important setup, state, or behavior.
