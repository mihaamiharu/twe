---
title: 'Configure Environments, Projects, Timeouts, and Secrets Safely'
description: 'Keep scenario actions separate from runner settings, and make sure tests use the correct target and project without exposing secrets.'
---

## After this lesson, you can

- separate scenario actions and expected results from test-runner settings;
- explain which tests and settings a Playwright project uses;
- introduce project variants without creating an accidental test matrix;
- distinguish test, assertion, action, navigation, and fixture timeouts; and
- validate environment values and keep secrets out of source and artifacts.

## Why this matters for QA

A test can be written correctly while its runner settings still make the run unsafe or misleading. It may silently target production, run every scenario across too many combinations, wait a long time for an expected result that never appears, or store credentials in committed configuration.

Configuration is not boilerplate only automation specialists need to understand. QA should review it because it determines:

- Which tests are discovered?
- Which application is under test?
- Which browser, device, role, or environment variant is running?
- How long do we wait before calling a condition a failure?
- Which reports, traces, screenshots, or other artifacts are retained?

One configuration change can alter the target application, number of test executions, run duration, and stored information. Review configuration with the same care as test code.

In an agent-assisted workflow, generated configuration can be valid TypeScript while still inventing an environment, command, project matrix, or secret-handling strategy the team never approved.

## The mental model

Keep test code, fixtures, and configuration separate:

```text
Test code      → actions under test and expected results
Fixtures       → resources, setup, scope, and cleanup
Configuration  → test discovery, environment, projects, and runner settings
```

A Playwright project is one named group of tests running with the same configuration. It is not automatically a repository, deployment, or product project.

Each project should run one condition the team wants to compare:

```text
Relevant tests + one supported configuration variant
                         ↓
                 comparable run results
```

If a browser, device, role, or environment in a project does not represent a supported user condition or a clear operational need, it may only add more executions.

## Work through a realistic example

The team runs desktop Chromium for every change. Critical customer flows also need Firefox coverage. Start with a required base URL and two clearly named projects:

```ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error('BASE_URL is required');
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

Read each setting by its effect on the run:

| Setting                      | Effect on the test run                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| `testDir: './tests'`         | Only the intended suite directory is discovered                  |
| required `BASE_URL`          | The run fails before testing if its target is unknown            |
| `timeout: 30_000`            | Test body, fixture setup, and `beforeEach` share 30 seconds      |
| `expect.timeout: 5_000`      | Retrying assertions wait up to 5 seconds for the expected result |
| two named projects           | Selected tests can run in two supported browser profiles         |
| failure trace and screenshot | Failed runs keep a trace and screenshot for debugging            |

Adding browser projects does not decide which tests should run in each browser. Module 9 covers which scenarios run for each trigger and which artifacts CI stores.

### Projects can represent more than browsers

Projects can vary:

- browser engine or device profile;
- authenticated versus signed-out state;
- a supported locale;
- a focused environment or feature configuration;
- timeout or retry settings for a group that needs separate handling; or
- a setup project that another project depends on.

One project should represent a clear set of settings. Be careful when combining several dimensions:

```text
3 browsers × 2 devices × 3 roles × 2 environments = 36 variants
```

If 200 tests run in all 36 variants, the runner schedules 7,200 test executions before retries. That cost needs a clear reason based on product risk and available pipeline time.

Start with a small, clear set of projects. Run broad, fast checks in the primary supported condition, then select high-risk scenarios for other variants. Not every scenario needs every combination.

### Know what each timeout controls

| Timeout concern    | What it limits or controls                                    |
| ------------------ | ------------------------------------------------------------- |
| Test timeout       | Test body, test-scoped fixture setup, and `beforeEach`        |
| Expect timeout     | How long a retrying assertion waits for its condition         |
| Action timeout     | How long actions wait for their actionability requirements    |
| Navigation timeout | How long navigation operations wait                           |
| Fixture timeout    | A separate budget configured for a fixture that is truly slow |

Fixture teardown and `afterEach` receive a separate timeout budget of the same duration after the test body finishes. Do not raise every timeout because one condition is wrong. First check whether the operation is genuinely slow, the expected state never appears, setup consumed the budget, or the test targets the wrong environment.

### Stop the run when the target environment is unclear

Configuration may read values from environment variables or a secure local/CI mechanism. Validate required values before tests start, and avoid a fallback that could silently target production.

Secrets must not appear in:

- committed configuration or `.env` files;
- test titles or error messages;
- screenshots, traces, videos, or console output;
- prompts sent to tools or services the team has not approved; or
- authenticated storage-state files committed to version control.

An environment variable is only a delivery mechanism. It is not safe if the value is later printed or preserved in an artifact.

### Separate local runner settings from CI decisions

This lesson focuses on what a developer can run locally, which project variants exist, and which debugging artifacts a failed run produces. Module 9 covers trigger-specific test selection, CI gates, retries, artifact retention, and who handles failures. A setting may apply in both places; decide who needs it before placing it in configuration or the pipeline.

## When to use it—and when not to

Put stable runner-wide settings in `playwright.config.ts`: test discovery, default `use` values, projects, timeouts, reporters, local debugging artifacts, and a local web server started by the runner when appropriate. Keep trigger-specific CI decisions in the pipeline.

Keep product actions and assertions in tests. Keep dependency setup and cleanup in fixtures. Do not put scenario branches into configuration merely to make test files shorter.

Use a project when one named set of configuration values should run a selected group of tests. Use test-level data parameterization when the behavior stays the same and only input/output examples change. Do not create a project for every test-data row.

Use project dependencies when a real prerequisite must complete before dependent projects and its result should appear in reports and traces. Do not turn one shared setup project into mutable data that all parallel tests modify.

Choose timeouts from durations seen in actual runs. If only one operation is slow, a local exception is easier to understand than a large global increase.

## When it fails

| Observation                                     | Likely problem                                         | Check first                                               |
| ----------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Tests change real or unexpected data            | Target environment was not validated safely            | Base URL, project name, and environment variables         |
| Local and CI runs execute different scenarios   | Discovery, grep, or project filters have drifted       | Final config and exact commands                           |
| Suite runtime grows much faster than test count | Project dimensions formed a Cartesian product          | Project list and executions per scenario                  |
| All failed tests take a long time               | Test timeout is too large for states that never appear | First failed test, assertion call log, and setup duration |
| One project fails before test code starts       | Project-specific option or dependency setup is wrong   | Project config, dependency result, actual input values    |
| Credentials appear in artifacts                 | Secret entered visible UI or was logged                | Trace, screenshot, reporter output, test attachments      |

Check the project and environment the runner actually used before editing the test. The same source code can run under a different base URL, storage state, locale, or device profile.

## Review AI-assisted work

Review generated configuration line by line:

- What does each option change in the test run?
- Which tests and directories will it discover?
- Can a missing value silently select the wrong environment?
- Does each project correspond to a supported condition or known risk?
- How many total executions does the project matrix create?
- Do project names clearly describe what ran in the report?
- Which log or trace shows that a higher timeout is needed?
- Does setup create shared mutable state?
- Can secrets enter source, logs, traces, screenshots, or storage state?
- Is this setting a local runner default, a project variant, or a CI trigger/gate decision?
- Did AI invent a device, environment, command, reporter, or credential strategy the team never approved?

Ask AI to calculate the number of test executions and list its assumptions, not only provide a configuration snippet. Valid syntax can still run the wrong tests or make the pipeline unnecessarily slow.

## Check your understanding

A generated configuration defines three browsers, three devices, two locales, two roles, and staging plus production projects. It applies a 120-second test timeout and falls back to the production URL when `BASE_URL` is absent. The team has 300 tests.

What risks and costs should you raise in review? How would you reduce this to a smaller and safer first configuration? For each change, decide whether it belongs in the test, a fixture, local configuration, or CI.

## Compare your reasoning

One reasonable review is:

- Stop the run when the target URL is missing; never silently fall back to production.
- Calculate the proposed 72 variants and 21,600 executions before retries.
- Identify the primary supported browser and the small set of scenarios that need other browser, device, locale, or role coverage.
- Keep production testing separate, require authorization, use read-only flows where appropriate, and define its own test-data and safety rules.
- Return the test timeout to a duration supported by actual runs and investigate slow operations separately.
- Give every retained project a report name that describes what ran and document why it is needed.
- Verify that authentication state and secrets are securely supplied and never committed or attached.

The first configuration only needs to cover the conditions the product supports now. Every retained setting should show which target runs, how many executions it creates, and why the variation is needed.

## Before you continue

You should now be able to explain what belongs in a test, fixture, and configuration; create a project for a supported condition; and review the environment, timeouts, and secrets before a suite runs.

The optional next lesson explores advanced fixture composition. Skip it unless your suite already has a real need for configurable options, worker-owned resources, or automatic diagnostic behavior.
