---
title: 'Reproduce the Test System in CI'
description: 'Turn a local Playwright run into a clean, explicit, and diagnosable CI execution contract.'
---

## After this lesson, you can

- describe the inputs a clean CI runner needs before a browser test can be trusted;
- design a minimal pipeline that installs locked dependencies and compatible browsers;
- choose whether CI starts an owned application or targets a validated deployment;
- keep configuration and secrets explicit without exposing them; and
- distinguish pipeline, environment, setup, product, and test failures.

## Why this matters for QA

“It passes on my machine” usually means the local machine supplied an assumption the pipeline did not have. Perhaps the browser binary was already installed, the application was running in another terminal, an environment value came from an untracked file, or old test data made the scenario pass.

CI starts closer to a blank machine. That is useful pressure. It reveals whether another engineer can reproduce the same test system from the repository and authorized inputs.

A green local test is evidence about one machine. A trustworthy CI run is evidence that the test system can be reconstructed deliberately.

## The mental model

Treat CI as a reproducibility contract:

```text
Same revision
  + explicit runtime and locked dependencies
  + compatible browser and system dependencies
  + explicit application target
  + controlled configuration and test data
  + the same documented test command
  = comparable execution evidence
```

The pipeline has several layers. A failure at an earlier layer can make a later test error misleading:

| Layer                   | Question it must answer                                       |
| ----------------------- | ------------------------------------------------------------- |
| Source                  | Which exact revision is running?                              |
| Toolchain               | Which runtime, package lock, and Playwright version are used? |
| Browser environment     | Are the required browsers and OS libraries installed?         |
| Application target      | Is the correct application ready and reachable?               |
| Configuration and state | Are required values present and preconditions controlled?     |
| Test execution          | Which command, project, and scenario produced this result?    |

Do not classify every red pipeline as a product defect. First identify which layer broke.

## Work through a realistic example

The checkout smoke test passes locally. The team wants it to run on pull requests against an application started from the same repository.

### 1. Make the application target explicit

The Playwright configuration can own the local application lifecycle:

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

This policy says:

- without `BASE_URL`, Playwright starts the owned application and waits for its URL;
- with `BASE_URL`, the run targets an already deployed application; and
- CI does not silently reuse an unrelated local process.

If the team never tests a deployed target, remove that branch. If it always tests a deployment, validate `BASE_URL` and fail before running tests when it is missing. Do not include a fallback that could accidentally target production.

### 2. Reproduce the install and test commands

Because this repository uses Bun, a repository-aligned GitHub Actions job is:

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

The versions and commands above mirror this repository’s current Bun workflow. In another repository, replace `1.3.4`, the lockfile command, the browser portfolio, and the test command with values declared by that repository. Pin a committed runtime file when the project has one; never use a moving runtime alias as if it were a reproducibility guarantee.

This minimal example has no secret because the checkout smoke does not need one. If an authenticated test does need a credential, provide it only through an authorized protected environment or a disposable test-account mechanism. Fork pull requests may not receive secrets, and arbitrary pull-request code must not be given production credentials. The job grants read-only repository access, bounds its duration, and preserves diagnostics after a test failure.

### 3. Read failure evidence by layer

Suppose the job fails. Start with the earliest meaningful message:

| Observation                     | First hypothesis                                  | Evidence to inspect                             |
| ------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `bun install --frozen-lockfile` rejects the lockfile | Manifest and lockfile disagree                    | Install log and committed lockfile              |
| Browser executable is missing   | Browser install step or cache assumption is wrong | Install command and Playwright version          |
| `webServer` times out           | App failed to start or readiness URL is wrong     | App process log and configured URL              |
| Every test redirects to sign-in | Secret or authenticated state is absent/invalid   | Safe config validation and authentication setup |
| One checkout assertion fails    | Product, data, locator, or expectation problem    | Test error, trace, network, and owned test data |

Do not increase the test timeout to repair a failed dependency install or unreachable application.

## When to use it—and when not to

Run a small valuable suite on pull requests when its feedback can change the merge decision. Run deployment smoke tests only after the target reports ready and the test data policy makes execution safe.

Let Playwright `webServer` own a local application when the repository provides a reliable start command. Target an existing deployment when the behavior depends on deployment infrastructure or integration configuration. Make the choice explicit.

Use a prebuilt Playwright container when the team needs a consistent Linux browser environment or stable screenshot rendering. Keep its Playwright version compatible with the project. A container does not remove the need for controlled data, secrets, and target validation.

Do not copy a large workflow before the suite can run from one documented local command. Do not add caches until the uncached pipeline is correct. Do not put credentials in workflow YAML, test titles, logs, traces, or committed environment files. Treat action tags as readable examples; follow the organization’s policy if production workflows require immutable commit-SHA pinning.

## When it fails

The common “CI-only flaky test” label often hides several different causes:

| CI symptom                             | Likely cause                                       | Underlying repair                                  |
| -------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Failure only under resource pressure   | Runner CPU/memory or excessive local parallelism   | Measure capacity; reduce workers or shard safely   |
| Different UI than local                | Wrong revision, target, feature config, or account | Record and validate resolved execution inputs      |
| Browser launch fails after an upgrade  | Browser binary and package versions are mismatched | Install browsers from the project’s Playwright CLI |
| Test starts before the app is ready    | Readiness checks do not match usable application   | Fix startup/readiness contract, not a test sleep   |
| Pipeline passes with missing scenarios | Project, grep, or discovery filter is too narrow   | Print and review the exact selected test portfolio |

Preserve safe logs from the setup layer as well as browser artifacts. A trace cannot explain why dependency installation never completed.

## Review generated work

Review an AI-generated pipeline with these questions:

- Does it use the repository’s actual runtime, lockfile, and commands, with a reproducible runtime version?
- Who starts the application, and what proves it is ready?
- Can a missing URL silently select the wrong environment?
- Are browser packages installed from the project’s Playwright version?
- Are action references current and intentionally pinned according to the repository’s security policy?
- Which permissions, variables, and secrets does the job receive?
- Could a secret appear in logs, screenshots, traces, or reports?
- Does the workflow upload evidence after test failure?
- Does each step have one diagnosable responsibility?
- Did generated YAML invent a script, project name, secret, or deployment target?

Valid YAML is not proof of a valid test system. Run every referenced command and verify every assumed input.

## Check your understanding

A generated workflow checks out the repository, runs `bun run test:e2e`, and retries the whole job twice. It does not install dependencies or Chromium, does not start the application, and relies on a `BASE_URL` configured manually on one self-hosted runner.

Redesign the minimum reproducibility contract. Decide which inputs must be committed, which must be supplied securely, who owns application readiness, and which evidence should survive a failure.

## Compare your reasoning

One reasonable design is:

- Check out the exact revision, set the declared Bun version, and install dependencies from the committed lockfile.
- Install the selected browser and system dependencies through the project’s Playwright CLI or a compatible pinned container.
- Start the owned application through `webServer`, or require and validate an explicit deployed target.
- Supply secrets through authorized CI storage and prevent them from entering artifacts.
- Run the same type-check and focused test commands engineers can reproduce locally, with CI workers controlled for stability.
- Upload the report and relevant diagnostic directories when the test step fails, while keeping a bounded retention period.
- Remove whole-job retries; investigate the failing layer and use test retries only under an explicit policy.

The result is not necessarily a large workflow. It is a workflow with no accidental prerequisite.

## Before you continue

You should now be able to turn a local Playwright command into a clean CI execution contract and diagnose which system layer failed.

The next lesson assumes execution is reproducible. It decides which risks run on each trigger, which evidence is retained, and how a result becomes a team action.
