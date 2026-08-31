---
title: 'Choose Which Tests Run and Which Artifacts CI Stores'
description: 'Select scenarios for each trigger, distinguish a clean pass from a flaky retry, and decide what blocks a merge and who handles failures.'
---

## After this lesson, you can

- choose a risk-based test portfolio for pull requests, merges, deployments, and schedules;
- justify browser and device coverage without multiplying every possible combination;
- distinguish a clean pass, flaky retry pass, failed test, and infrastructure failure;
- select reports and artifacts based on debugging needs, cost, and stored data; and
- define merge gates, triage responsibilities, and when workers or shards are needed.

## Why this matters for QA

A pipeline can run every step correctly and still give the team poor feedback. If every test runs in every browser on every change, results may arrive after review is finished. If CI stores only pass and fail counts, the team has no trace or setup log to investigate. If a retry pass is reported as clean, the report hides flakiness.

CI needs to return a useful result in time to answer:

> Is this change safe enough to merge or release? If not, who should investigate, and which artifacts are available?

Coverage, artifacts, retries, and gates should all support that decision.

## The mental model

Start with the trigger, then decide what happens after the result:

```text
Change or release trigger
        ↓
Risk-selected scenarios and projects
        ↓
Tests run with controlled setup
        ↓
Test status + debugging artifacts
        ↓
Responsible person + next action
```

![CI starts from a trigger, selects scenarios and projects by risk, runs tests with controlled setup, stores status and debugging artifacts, then assigns the next action.](/images/tutorials/ci-feedback-contract.svg)

_A fast result without useful debugging artifacts is hard to act on. Complete artifacts are also less useful if they arrive after the merge decision._

After reading the result, the responsible person can fix code, repair the environment, or make a release decision. A dashboard that does not lead to an action only stores a history of failures.

Module 8 explains how to create Playwright projects, fixtures, and configuration. This lesson decides which projects run for each trigger and how the team treats their results.

Consider four things:

| Consideration | Question                                                          |
| ------------- | ----------------------------------------------------------------- |
| Risk          | Which failure would matter on this trigger?                       |
| Speed         | How soon must the team know?                                      |
| Debugging     | Which artifact distinguishes product, test, and infrastructure?   |
| Cost and data | How much execution/storage is reasonable, and what can be stored? |

## Work through a realistic example

An online store primarily supports desktop Chrome. Firefox is also supported, while mobile checkout is high risk but changes less often. The suite has 300 tests, including 18 critical smoke scenarios.

### 1. Choose tests for each trigger

Do not start by running every project. First decide what each trigger needs to tell the team:

| Trigger          | Tests that run                                                  | Why                                                        |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| Pull request     | 18 smoke scenarios on desktop Chromium                          | Fast result before review and merge                        |
| Merge to main    | Affected feature/regression tests on Chromium; smoke on Firefox | Broader integration confidence without full multiplication |
| Nightly schedule | Full stable suite across supported browser portfolio            | Detect broader compatibility and accumulated regression    |
| Deployment ready | Small safe smoke set against the deployed target                | Confirm deployment wiring and critical availability        |

Tags and projects implement this selection. Every scenario tagged `@smoke` should check a risk that can affect the release.

If the product does not support WebKit or a particular device, running every test there is not automatically useful coverage. If payment behavior is high risk on one mobile viewport, select that flow and condition intentionally.

Playwright device projects emulate conditions such as viewport, user agent, and touch. They do not run on the physical device or its operating system. Use a real-device lab or provider when that difference matters to the product risk. Do not run destructive tests in production without a clear purpose, authorization, and safe test data.

### 2. Decide what each result means

With one CI retry, Playwright distinguishes:

| Result                           | Meaning for the team                                        |
| -------------------------------- | ----------------------------------------------------------- |
| Passed first attempt             | Clean pass for this execution                               |
| Failed first, passed on retry    | Flaky test; intermittent behavior still exists              |
| Failed all attempts              | Persistent failure requiring triage                         |
| Job failed before tests executed | Pipeline/environment failure; product status may be unknown |

One possible configuration is:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

This example makes a flaky retry fail CI. A team may initially report flakiness without blocking merges while it assigns someone to fix it, then tighten the gate later. A test that passes only after retry must not be reported as a clean pass.

`trace: 'on-first-retry'` records the first retry attempt. It does not automatically store the original failed attempt. If you need that first attempt, or a later retry may pass, `retain-on-failure` records each attempt and keeps the failed one. Choose the mode based on the failure you need to debug and the available storage.

### 3. Store artifacts that help debugging

| Report or artifact   | Question it can answer                                           | Cost or risk                                       |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Terminal/line report | Which test/project failed first?                                 | Low detail                                         |
| HTML report          | Which steps, projects, retries, and attachments belong together? | Must be uploaded and access-controlled             |
| Trace                | What happened across actions, DOM, console, and network?         | Can contain sensitive session and application data |
| Screenshot           | What was visible at one moment?                                  | Limited sequence; may expose personal data         |
| Video                | How did the visible sequence unfold?                             | Higher storage; weak DOM/network detail            |
| Safe setup logs      | Did environment, authentication, or test-data setup fail?        | Must redact secrets and tokens                     |

The HTML report combines steps, projects, retries, and attachments from one run. For sharded runs, use the blob reporter and merge the pieces before publishing one report for the team. Do not store every artifact forever. Decide who can access it, how long to keep it, and which data to remove before sharing it with AI or outside the team.

### 4. Define the merge gate and who handles failures

A pull-request rule might say:

```text
Block merge when:
- a required smoke project fails;
- a smoke test becomes flaky; or
- the pipeline cannot establish the tested environment.

Triage owner:
- product behavior does not match the expected result → feature team + QA;
- locator/test logic defect → automation owner;
- unavailable runner/environment → platform owner;
- unclear cause → QA starts from the first error that explains the failure.
```

Quarantine is temporary. It needs a responsible person, a reason, and a condition for removing the test from quarantine. Keep the original failure artifacts and record which risk the test should cover. Do not turn quarantine into a silent skip or a folder where unreliable tests disappear.

### 5. Scale only after tests are properly isolated

Add workers on one runner when its resources and test data are safe for parallel execution. Use sharding when an isolated suite is still large enough to need several CI machines:

```bash
bunx playwright test --shard=1/4
```

Each shard produces part of the result. Use the blob reporter and `bunx playwright merge-reports` to create one combined report. If tests still share accounts or records, sharding increases the chance of collisions. Fix isolation before adding shards.

## When to use it—and when not to

Use a small smoke gate when a failure needs to be known before merge. Run broader supported-browser or device coverage on a schedule when it is too expensive for every change. Start deployment smoke tests only after the deployment is ready and the scenarios are safe for that environment.

Use retries to find intermittent behavior and store artifacts from failed attempts, not to make a result look green. Use `failOnFlakyTests` when the team is ready to block on flaky smoke tests.

Use traces for failures whose action, DOM, console, or network timeline matters. Use video only when visible sequence adds information the trace or screenshots do not provide. Preserve setup logs for failures that happen before the browser scenario.

Do not shard a small suite. Do not add projects merely because Playwright supports them. Do not run destructive tests against production without explicit authorization, safe data, and a tightly bounded purpose.

## When it fails

| Observation                                      | Likely problem                                    | Repair                                                          |
| ------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------- |
| Results arrive after the review is finished      | Pull-request portfolio is too broad               | Protect critical risks first; move broad coverage later         |
| Retry turns intermittent failures green          | Retry pass is reported as a clean pass            | Report it as flaky, assign someone, inspect failed attempt      |
| Failure report contains no trace or setup log    | Stored artifacts do not match the type of failure | Store trace for browser failures and logs for setup failures    |
| CI cost grows faster than scenario value         | Browser/device/role dimensions multiplied blindly | Select combinations from supported users and risk               |
| Shards pass separately but no full result exists | Reports are not merged or gate is shard-local     | Merge blob reports and create one final gate                    |
| Artifact exposes customer or credential data     | Access, sanitization, or retention is unsafe      | Restrict access, redact data, shorten retention, rotate secrets |
| Quarantined list only grows                      | No owner or exit condition                        | Assign repair deadline and track the original risk              |

When a merge gate often reports the wrong result, do not weaken every assertion or retry the entire job. Find the test or environment that produced the unreliable result and fix its cause.

## Review AI-assisted work

Review an AI-generated CI strategy with these questions:

- What decision does each trigger support?
- Which product risks earned the smoke label?
- Does the browser/device matrix reflect actual support and risk?
- How many test executions will the proposal create?
- Are retry passes reported as flaky rather than clean?
- Which artifact helps investigate each likely type of failure?
- Can artifacts expose credentials, cookies, personal data, or internal URLs?
- Is someone responsible for each condition that blocks a merge?
- Does quarantine have a reason and exit condition?
- Is sharding justified by measured runtime and safe isolation?
- Did AI invent coverage requirements or release rules the team never agreed to?

Ask AI to calculate runtime multiplication and state its assumptions. A large matrix can look thorough while producing worse feedback.

## Check your understanding

A team runs 300 tests across Chromium, Firefox, WebKit, three devices, and two roles on every pull request. Two retries are enabled, retry passes are reported as green, and only screenshots are uploaded. Results take 90 minutes, so engineers often merge before they finish.

Design a better selection of triggers, coverage, retries, artifacts, and responsible people. State which product facts you still need before finalizing it.

## Compare your reasoning

One reasonable direction is:

- Identify a small release-relevant smoke set and run it on the primary supported desktop condition for pull requests.
- Add only high-risk role/device variants to that fast gate.
- Run broader supported-browser regression after merge or on schedule.
- Report retry passes as flaky; assign an owner and decide whether current smoke flakiness blocks.
- Retain a trace or equivalent timeline for failures, plus safe setup logs for pre-browser failures.
- Calculate the reduced execution count and measure whether results now arrive before the merge decision.
- Add sharding only if the remaining broad suite is isolated and still too slow.
- Ask product and analytics which browsers, devices, and roles are actually supported and business-critical.

Testing can change a decision only when the result arrives on time and the selected scenarios check relevant product risks.

## Before you continue

You should now be able to select scenarios and projects for each trigger, handle retry results, store useful artifacts, define merge blockers, and assign someone to investigate failures.

The capstone applies those decisions to one checkout risk. You will also explain what the in-platform Practice can verify and what still needs to run in a real project.
