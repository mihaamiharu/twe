---
title: 'Design the Feedback, Coverage, and Evidence Policy'
description: 'Choose what runs when, preserve evidence that explains failure, and turn CI results into owned team decisions.'
---

## After this lesson, you can

- choose a risk-based test portfolio for pull requests, merges, deployments, and schedules;
- justify browser and device coverage without multiplying every possible combination;
- distinguish a clean pass, flaky retry pass, failed test, and infrastructure failure;
- select reports and artifacts according to diagnostic value, cost, and privacy; and
- define merge gates, triage ownership, and safe scaling through workers or shards.

## Why this matters for QA

A pipeline can run perfectly and still provide poor feedback. If every test runs in every browser on every change, results may arrive too late. If only a pass count survives, nobody can investigate the failure. If retry success is treated as clean, instability disappears from the team’s decision.

The purpose of CI is not maximum execution. It is timely evidence for a decision:

> Is this change safe enough to continue, and if not, who has enough evidence to act?

That makes coverage, artifacts, retries, and gates one feedback policy—not separate tool settings.

## The mental model

Design the feedback contract from risk to action:

```text
Change or release trigger
        ↓
Risk-selected scenarios and projects
        ↓
Controlled execution
        ↓
Verdict + diagnostic evidence
        ↓
Named owner and next action
```

![A CI feedback contract moves from a trigger to a risk-selected portfolio, controlled execution, verdict and diagnostic evidence, then a named owner and action.](/images/tutorials/ci-feedback-contract.svg)

_Fast feedback without useful evidence is noise. Detailed evidence that arrives too late is also poor feedback._

Every policy balances four concerns:

| Concern       | Question                                                         |
| ------------- | ---------------------------------------------------------------- |
| Risk          | Which failure would matter on this trigger?                      |
| Speed         | How soon must the team know?                                     |
| Diagnosis     | What evidence can distinguish product, test, and infrastructure? |
| Cost and care | How much execution/storage is justified, and what data is safe?  |

## Work through a realistic example

An online store primarily supports desktop Chrome. Firefox is also supported, while mobile checkout is high risk but changes less often. The suite has 300 tests, including 18 critical smoke scenarios.

### 1. Build a trigger portfolio

Do not start with every available project. Start with the decision each trigger must support:

| Trigger          | Risk-selected execution                                         | Why                                                        |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| Pull request     | 18 smoke scenarios on desktop Chromium                          | Fast signal before review and merge                        |
| Merge to main    | Affected feature/regression tests on Chromium; smoke on Firefox | Broader integration confidence without full multiplication |
| Nightly schedule | Full stable suite across supported browser portfolio            | Detect broader compatibility and accumulated regression    |
| Deployment ready | Small safe smoke set against the deployed target                | Confirm deployment wiring and critical availability        |

Tags and projects implement this policy; they do not decide the policy. Every scenario tagged `@smoke` should protect a truly release-relevant risk.

If the product does not support WebKit or a particular device, running every test there is not automatically useful coverage. If payment behavior is high risk on one mobile viewport, select that flow and condition intentionally.

### 2. Decide what each result means

With one CI retry, Playwright distinguishes:

| Result                           | Meaning for the team                                        |
| -------------------------------- | ----------------------------------------------------------- |
| Passed first attempt             | Clean pass for this execution                               |
| Failed first, passed on retry    | Flaky signal; instability still exists                      |
| Failed all attempts              | Persistent failure requiring triage                         |
| Job failed before tests executed | Pipeline/environment failure; product status may be unknown |

One possible configuration is:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

This example makes a flaky retry fail the CI signal. A team may first report flakiness without blocking while it establishes ownership, then tighten the gate. The important rule is that “passed on retry” must not silently become “clean.”

`trace: 'on-first-retry'` captures detailed evidence from the retry, but the first failed attempt may contain the most valuable state. Depending on the failure pattern and storage budget, `retain-on-failure` may be the better policy. Choose deliberately.

### 3. Preserve evidence that answers a question

| Evidence             | Useful question                                                  | Cost or risk                                       |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Terminal/line report | Which test/project failed first?                                 | Low detail                                         |
| HTML report          | Which steps, projects, retries, and attachments belong together? | Must be uploaded and access-controlled             |
| Trace                | What happened across actions, DOM, console, and network?         | Can contain sensitive session and application data |
| Screenshot           | What was visible at one moment?                                  | Limited sequence; may expose personal data         |
| Video                | How did the visible sequence unfold?                             | Higher storage; weak DOM/network detail            |
| Safe setup logs      | Did environment, authentication, or test-data setup fail?        | Must redact secrets and tokens                     |

Do not retain every artifact forever. Define who can access it, how long it remains useful, and what must be sanitized before sharing with AI or outside the team.

### 4. Define the gate and owner

A practical pull-request policy might say:

```text
Block merge when:
- a required smoke project fails;
- a smoke test becomes flaky; or
- the pipeline cannot establish the tested environment.

Triage owner:
- product behavior mismatch → feature team + QA evidence;
- locator/test logic defect → automation owner;
- unavailable runner/environment → platform owner;
- unclear classification → QA starts from the first meaningful failure.
```

Quarantine is a temporary workflow with an owner, reason, and exit condition. It is not a folder where unreliable tests disappear.

### 5. Scale only after isolation is trustworthy

Use more workers on one runner when its resources and test data support concurrency. Use sharding when a large isolated suite needs several CI machines:

```bash
npx playwright test --shard=1/4
```

Each shard produces part of the result. Use the blob reporter and `npx playwright merge-reports` when the team needs one combined report. Sharding a suite with shared accounts or records multiplies collision pressure; it does not repair isolation.

## When to use it—and when not to

Use a small smoke gate when quick failure changes the merge decision. Add broader scheduled coverage for supported variants whose cost is too high for every change. Trigger deployed smoke only after the deployment is ready and the scenarios are safe for that environment.

Use retries to expose intermittent behavior and preserve evidence, not to manufacture a green result. Use `failOnFlakyTests` when the team is ready to treat a flaky retry as a blocking quality signal.

Use traces for failures whose action, DOM, console, or network timeline matters. Use video only when visible sequence adds information the trace or screenshots do not provide. Preserve setup logs for failures that happen before the browser scenario.

Do not shard a small suite. Do not add projects merely because Playwright supports them. Do not run destructive tests against production without explicit authorization, safe data, and a tightly bounded purpose.

## When it fails

| Observation                                      | Policy failure                                      | Better repair                                           |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| Results arrive after the review is finished      | Pull-request portfolio is too broad                 | Protect critical risks first; move broad coverage later |
| Retry turns intermittent failures green          | Flaky outcome is not visible or gated               | Report/own flakiness; inspect failed attempt evidence   |
| Failure report contains no trace or setup log    | Artifact policy does not match likely failure layer | Retain the evidence that distinguishes hypotheses       |
| CI cost grows faster than scenario value         | Browser/device/role dimensions multiplied blindly   | Select combinations from supported users and risk       |
| Shards pass separately but no full result exists | Reports are not merged or gate is shard-local       | Merge blob reports and create one final gate            |
| Artifact exposes customer or credential data     | Retention/access/sanitization policy is unsafe      | Restrict, redact, shorten retention, and rotate secrets |
| Quarantined list only grows                      | No owner or exit condition                          | Assign repair deadline and track the original risk      |

When a gate is noisy, do not weaken every assertion or retry the entire job. Find which signal is untrustworthy and repair its test, environment, or policy contract.

## Review generated work

Review an AI-generated CI strategy with these questions:

- What decision does each trigger support?
- Which product risks earned the smoke label?
- Does the browser/device matrix reflect actual support and risk?
- How many test executions will the proposal create?
- Are retry passes reported as flaky rather than clean?
- Which artifact explains each likely failure layer?
- Can artifacts expose credentials, cookies, personal data, or internal URLs?
- Does every merge blocker have a triage owner?
- Does quarantine have a reason and exit condition?
- Is sharding justified by measured runtime and safe isolation?
- Did AI invent coverage requirements or a release policy the team never agreed to?

Ask AI to calculate runtime multiplication and state its assumptions. A large matrix can look thorough while producing worse feedback.

## Check your understanding

A team runs 300 tests across Chromium, Firefox, WebKit, three devices, and two roles on every pull request. Two retries are enabled, retry passes are reported as green, and only screenshots are uploaded. Results take 90 minutes, so engineers often merge before they finish.

Design a more useful trigger, coverage, retry, evidence, and ownership policy. State which product facts you still need before finalizing it.

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

The goal is not less testing. It is better-timed evidence against known risk.

## Before you continue

You should now be able to turn a reproducible CI run into an explicit feedback policy covering triggers, risk-selected projects, retries, artifacts, gates, and ownership.

The capstone asks you to apply that policy mindset to one focused checkout risk and explain what the in-platform Practice proves—and what a real project would still need to ship.
