---
title: 'Treat Configuration as Executable Test Policy'
description: 'Separate scenario behavior from runner policy, then define environments, projects, timeouts, and secrets intentionally.'
---

## After this lesson, you can

- separate scenario behavior from suite-wide runner policy;
- explain what a Playwright project represents;
- introduce project variants without creating an accidental test matrix;
- distinguish test, assertion, action, and navigation timeout concerns; and
- validate environment values and keep secrets out of source and artifacts.

## Why this matters for QA

A test can be correct while the suite around it is unsafe or misleading. It may silently target the wrong environment, run every scenario across a huge matrix, wait too long for failures, or expose credentials in committed configuration.

Configuration is not boilerplate that only automation specialists should understand. It answers QA questions with product consequences:

- Which tests are discovered?
- Which application is under test?
- Which browser, device, role, or environment variant is running?
- How long do we wait before calling a condition a failure?
- Which evidence is retained?

Because configuration changes the meaning and cost of every run, treat it as executable test policy.

## The mental model

Keep three responsibilities distinct:

```text
Test code      → behavior, product risk, actions, evidence
Fixtures       → named dependencies and their lifecycles
Configuration  → discovery, environment, variants, and runner policy
```

A Playwright project is one named group of tests running with the same configuration. It is not automatically a repository, deployment, or product project.

Think of each project as one intentional question:

```text
Same relevant tests + one meaningful configuration variant
                         ↓
                 comparable evidence
```

If a project does not represent a supported user condition, an operational need, or a product risk, it may only multiply runtime.

## Work through a realistic example

The team supports desktop Chromium on every change and also needs Firefox evidence for critical customer flows. Start with an explicit base URL and two named projects:

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

Read this as policy, not syntax:

| Setting                      | Policy decision                                                    |
| ---------------------------- | ------------------------------------------------------------------ |
| `testDir: './tests'`         | Only the intended suite directory is discovered                    |
| required `BASE_URL`          | The run fails before testing if its target is unknown              |
| `timeout: 30_000`            | One test, including its test-scoped fixtures, has a bounded budget |
| `expect.timeout: 5_000`      | Retrying assertions have a smaller evidence-waiting budget         |
| two named projects           | Selected tests can run in two supported browser profiles           |
| failure trace and screenshot | Failed runs preserve diagnostic evidence                           |

The browser names do not decide coverage by themselves. Module 9 will decide which risk-based subset runs on each trigger and how evidence is retained in CI.

### Projects can represent more than browsers

Projects can vary:

- browser engine or device profile;
- authenticated versus signed-out state;
- a supported locale;
- a focused environment or feature configuration;
- timeout or retry policy for a deliberately separated group; or
- a setup project that another project depends on.

One project should express a coherent variant. Be careful when combining dimensions:

```text
3 browsers × 2 devices × 3 roles × 2 environments = 36 variants
```

If 200 tests run in all 36 variants, the suite schedules 7,200 test executions before retries. That can be appropriate only when the risk and operational budget justify it.

Prefer a small deliberate portfolio: broad fast feedback in the primary supported condition, plus selected scenarios for other high-risk variants. Do not assume every scenario needs every combination.

### Timeouts describe different boundaries

| Timeout concern    | What it limits or controls                                     |
| ------------------ | -------------------------------------------------------------- |
| Test timeout       | Whole test, including test-scoped fixture setup and teardown   |
| Expect timeout     | How long a retrying assertion waits for its condition          |
| Action timeout     | How long actions wait for their actionability requirements     |
| Navigation timeout | How long navigation operations wait                            |
| Fixture timeout    | A separately configured slow fixture lifecycle, when justified |

Do not raise every timeout because one condition is wrong. First determine whether the operation is legitimately slow, the expected state never appears, setup consumed the budget, or the test is targeting the wrong environment.

### Treat environment values as inputs

Configuration may read values from environment variables or a secure local/CI mechanism. Validate required values early and avoid a fallback that could silently target production.

Secrets must not appear in:

- committed configuration or `.env` files;
- test titles or error messages;
- screenshots, traces, videos, or console output;
- generated prompts sent outside the approved boundary; or
- authenticated storage-state files committed to version control.

An environment variable is only a delivery mechanism. It is not safe if the value is later printed or preserved in an artifact.

## When to use it—and when not to

Put stable runner-wide policy in `playwright.config.ts`: test discovery, default `use` values, projects, timeouts, reporters, artifact behavior, and an owned local web server when appropriate.

Keep product actions and assertions in tests. Keep dependency setup and cleanup in fixtures. Do not put scenario branches into configuration merely to make test files shorter.

Use a project when a named configuration variant should run a meaningful group of tests. Use test-level data parameterization when the behavior is the same and only input/output examples vary. Do not create a project for every test-data row.

Use project dependencies when a real prerequisite must complete before dependent projects and its result should appear in reports and traces. Do not turn one shared setup project into mutable data that all parallel tests modify.

Choose timeouts from observed system behavior and failure cost. A narrow local exception is usually easier to reason about than a large global increase.

## When it fails

| Observation                                     | Likely policy problem                                | Evidence to inspect                                      |
| ----------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Tests change real or unexpected data            | Missing or unsafe environment validation             | Resolved base URL, project name, environment variables   |
| Local and CI runs execute different scenarios   | Discovery, grep, or project filters have drifted     | Final config and exact commands                          |
| Suite runtime grows much faster than test count | Project dimensions formed a Cartesian product        | Project list and executions per scenario                 |
| All failures take a long time                   | Global timeout is masking absent conditions          | First failure, assertion call log, setup duration        |
| One project fails before test code starts       | Project-specific option or dependency setup is wrong | Project config, dependency result, resolved input values |
| Credentials appear in artifacts                 | Secret entered visible UI or was logged              | Trace, screenshot, reporter output, test attachments     |

Inspect the resolved project and environment before editing the test. The same source code can mean something different under another base URL, storage state, locale, or device profile.

## Review generated work

Review generated configuration line by line:

- What policy does each option express?
- Which tests and directories will it discover?
- Can a missing value silently select the wrong environment?
- Does each project correspond to a supported condition or known risk?
- How many total executions does the project matrix create?
- Are project names meaningful in reports?
- Are timeout increases supported by evidence?
- Does setup create shared mutable state?
- Can secrets enter source, logs, traces, screenshots, or storage state?
- Did AI invent a device, environment, command, reporter, or credential strategy the team never approved?

Ask for the calculated test matrix and resolved assumptions, not only a configuration snippet. Valid syntax can still encode poor policy.

## Check your understanding

A generated configuration defines three browsers, three devices, two locales, two roles, and staging plus production projects. It applies a 120-second global test timeout and falls back to the production URL when `BASE_URL` is absent. The team has 300 tests.

What risks and costs should you raise in review? How would you reduce the configuration to an intentional first policy?

## Compare your reasoning

One reasonable review is:

- Stop the run when the target URL is missing; never silently fall back to production.
- Calculate the proposed 36 variants and 10,800 executions before retries.
- Identify the primary supported browser and the small set of scenarios that need other browser, device, locale, or role coverage.
- Keep production testing separate, explicitly authorized, read-only where appropriate, and protected by its own data and safety policy.
- Return the global timeout to an evidence-based budget and investigate genuinely slow operations locally.
- Give every retained project a meaningful report name and documented reason.
- Verify that authentication state and secrets are securely supplied and never committed or attached.

The first configuration does not need to model every future condition. It needs to make the current test contract explicit and safe.

## Before you continue

You should now be able to explain what belongs in a test, fixture, and configuration; define an intentional project; and review environment, timeout, and secret policy before a suite runs.

The optional next lesson explores advanced fixture composition. Skip it unless your suite already has a real need for configurable options, worker-owned resources, or automatic diagnostic behavior.
