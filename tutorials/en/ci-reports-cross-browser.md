---
title: 'Make Playwright Tests Reproducible in CI'
description: 'Turn a local Playwright command into a CI job with a clear runtime, dependencies, browser, application target, and test data.'
---

## After this lesson, you can

- describe what a new CI runner needs before its browser-test result can be trusted;
- design a minimal pipeline that installs locked dependencies and compatible browsers;
- choose whether CI starts an owned application or targets a validated deployment;
- provide the required configuration and secrets without exposing their values; and
- distinguish pipeline, environment, setup, product, and test failures.

## Why this matters for QA

Has a test passed on your laptop and failed as soon as it reached CI? The laptop usually supplied something the runner did not have. The browser binary may already be installed, the application may still be running in another terminal, an environment value may come from an untracked file, or old test data may make the scenario pass by accident.

CI usually starts from a cleaner runner. That lets the team check whether another engineer can run the same tests using only the repository and inputs the team officially provides.

A local pass shows that the test worked on that machine. A CI result is more useful when the runtime, dependencies, browser, application, configuration, test data, and command can all be prepared again from a clean runner.

## The mental model

Make sure CI prepares the same inputs for every run:

```text
Same revision
  + defined runtime and dependencies from the lockfile
  + compatible browser and system dependencies
  + clearly selected application target
  + controlled configuration and test data
  + the same documented test command
  = run results that can be compared
```

The pipeline has several parts. A problem near the beginning can make a later test error look like a product bug:

| Pipeline part           | Question it must answer                                       |
| ----------------------- | ------------------------------------------------------------- |
| Source                  | Which exact revision is running?                              |
| Toolchain               | Which runtime, package lock, and Playwright version are used? |
| Browser environment     | Are the required browsers and OS libraries installed?         |
| Application target      | Is the correct application ready and reachable?               |
| Configuration and state | Are required values present and preconditions controlled?     |
| Test execution          | Which command, project, and scenario produced this result?    |

Do not record every red pipeline as a product defect. First find which part of the pipeline failed.

## Work through a realistic example

The checkout smoke test passes locally. The team wants it to run on pull requests against an application started from the same repository.

### 1. Decide who starts the application

Playwright configuration can start and stop the local application through `webServer`:

```ts
import { defineConfig } from '@playwright/test';

const localURL = 'http://127.0.0.1:3000';
const baseURL = process.env.BASE_URL ?? localURL;

export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'bun run dev',
        url: localURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
```

These settings mean:

- without `BASE_URL`, Playwright starts the owned application and waits for its URL;
- with `BASE_URL`, the run targets an already deployed application; and
- CI does not reuse another process that happens to be running.

If the team never tests a deployed target, remove that branch. If it always tests a deployment, validate `BASE_URL` and fail before running tests when it is missing. Do not include a fallback that could accidentally target production.

### 2. Install the runtime, dependencies, and browser from scratch

Because this repository uses Bun, this GitHub Actions job follows the repository setup:

```yaml
name: Checkout smoke

on:
  pull_request:

permissions:
  contents: read

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      CI: 'true'
      E2E_CONTAINER_RUNTIME: docker

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3.4'

      - name: Install locked dependencies
        run: bun install --frozen-lockfile

      - name: Install Chromium and system dependencies
        run: bunx playwright install --with-deps chromium

      - name: Type-check
        run: bun run typecheck

      - name: Run repository E2E suite
        run: bun run test:e2e

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: e2e-diagnostics
          path: |
            playwright-report/
            test-results/
            allure-results/
          if-no-files-found: ignore
          retention-days: 14
```

The versions and commands above follow this repository’s Bun workflow. In another repository, replace `1.3.4`, the lockfile command, installed browsers, and test command with that repository's values. If the repository stores its runtime version in a committed file, use that file as the source. Do not use a moving version alias when the run needs to stay reproducible.

This minimal example has no secret because the checkout smoke test does not need one. If an authenticated test needs a credential, provide it through an authorized protected environment or use a disposable test account. Pull requests from forks may not receive secrets, and pull-request code must not receive production credentials. This job has read-only repository access, a time limit, and debugging artifacts that remain available after a failed test.

### 3. Find the first part of the pipeline that failed

If the job fails, start with the first error that explains what went wrong:

| What you see                                         | Likely cause                                      | Check first                                     |
| ---------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `bun install --frozen-lockfile` rejects the lockfile | Manifest and lockfile disagree                    | Install log and committed lockfile              |
| Browser executable is missing                        | Browser install step or cache assumption is wrong | Install command and Playwright version          |
| `webServer` times out                                | App failed to start or readiness URL is wrong     | App process log and configured URL              |
| Every test redirects to sign-in                      | Secret or authenticated state is absent/invalid   | Safe config validation and authentication setup |
| One checkout assertion fails                         | Product, data, locator, or expectation problem    | Test error, trace, network, and owned test data |

Do not increase the test timeout to repair a failed dependency install or unreachable application.

## When to use it—and when not to

Run a small set of important tests on pull requests when the result can change the merge decision. Run deployment smoke tests only after the target is ready and the test data is safe for that environment.

Use Playwright `webServer` to start a local application when the repository has a reliable start command. Test an existing deployment when the behavior depends on deployment infrastructure or integration configuration. Make the selected target visible in configuration and logs.

Use a prebuilt Playwright container when the team needs a consistent Linux browser environment or stable screenshot rendering. Keep its Playwright version compatible with the project. The container does not replace controlled test data, secret handling, or target validation.

Do not copy a large workflow before the suite can run from one documented local command. Do not add caches until the uncached pipeline is correct. Do not put credentials in workflow YAML, test titles, logs, traces, or committed environment files. Treat action tags as readable examples; follow the organization’s policy if production workflows require immutable commit-SHA pinning.

## When it fails

The label “CI-only flaky test” can hide several different causes:

| What happens in CI                     | Likely cause                                        | Repair                                              |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Failure only under resource pressure   | Runner CPU/memory or excessive local parallelism    | Measure capacity; reduce workers or shard safely    |
| Different UI than local                | Wrong revision, target, feature config, or account  | Record and validate revision, URL, project, account |
| Browser launch fails after an upgrade  | Browser binary and package versions are mismatched  | Install browsers from the project’s Playwright CLI  |
| Test starts before the app is ready    | Readiness check does not match a usable application | Fix startup and readiness checks, not a test sleep  |
| Pipeline passes with missing scenarios | Project, grep, or discovery filter is too narrow    | Print and review the exact selected test portfolio  |

Store safe setup logs as well as browser artifacts. A trace cannot explain why dependency installation stopped before the browser test began.

## Review AI-assisted work

Review an AI-generated pipeline with these questions:

- Does it use the runtime, lockfile, commands, and runtime version from this repository?
- Who starts the application, and what proves it is ready?
- Can a missing URL silently select the wrong environment?
- Are browser packages installed from the project’s Playwright version?
- Are action references current and intentionally pinned according to the repository’s security policy?
- Which permissions, variables, and secrets does the job receive?
- Could a secret appear in logs, screenshots, traces, or reports?
- Does the workflow upload debugging artifacts after a test failure?
- Does each step have one diagnosable responsibility?
- Did generated YAML invent a script, project name, secret, or deployment target?

Valid YAML does not mean the workflow can run the tests correctly. Run every referenced command and check every input it assumes is available.

## Check your understanding

A generated workflow checks out the repository, runs `bun run test:e2e`, and retries the whole job twice. It does not install dependencies or Chromium, does not start the application, and relies on a `BASE_URL` configured manually on one self-hosted runner.

Redesign the smallest workflow that can run from a new runner. Decide which inputs belong in the repository, which must be supplied securely, who starts and waits for the application, and which artifacts should remain after a failure.

## Compare your reasoning

One reasonable design is:

- Check out the exact revision, set the declared Bun version, and install dependencies from the committed lockfile.
- Install the selected browser and system dependencies through the project’s Playwright CLI or a compatible pinned container.
- Start the owned application through `webServer`, or require and validate an explicit deployed target.
- Supply secrets through authorized CI storage and prevent them from entering artifacts.
- Run the same type-check and focused test commands engineers can reproduce locally, with CI workers controlled for stability.
- Upload the report and relevant diagnostic directories when the test step fails, while keeping a bounded retention period.
- Remove whole-job retries. Find the part of the pipeline that failed, and use test retries only when the team has a clear rule for them.

The workflow does not need to be large. It needs to avoid relying on a browser, application, file, or environment value that exists only on one machine.

## Before you continue

You should now be able to turn a local Playwright command into a CI job that can run from a new runner and identify which part failed.

The next lesson assumes CI can run tests with consistent setup. It decides which scenarios run for each trigger, which artifacts are stored, and who acts when a test fails.
