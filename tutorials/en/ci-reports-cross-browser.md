---
title: 'Run in CI and Preserve Useful Evidence'
description: 'Build a fast feedback pipeline with intentional browser coverage, reports, traces, and secure configuration.'
---

## CI must reproduce the test system

A useful pipeline installs locked dependencies, installs required browsers, starts or reaches the correct application, validates configuration, type-checks, and runs tests with artifacts.

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm
  - run: npm ci
  - run: npx playwright install --with-deps
  - run: npm run typecheck
  - run: npx playwright test
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: playwright-report
      path: playwright-report/
```

Adapt commands to the repository. Pin action versions according to team security policy.

## Fast feedback before broad coverage

Organize tests by value and cost:

- a small critical smoke set on every change;
- targeted feature tests for relevant changes;
- broader browser/regression coverage on merge or schedule;
- exact device/vendor coverage where product risk requires it.

Running everything everywhere can delay feedback until it is ignored.

## Report behavior, not just pass counts

Good titles, steps, and attachments make a report actionable. Preserve traces/screenshots/videos on failure or first retry according to policy. Uploading artifacts with `if: always()` keeps evidence even when the test command fails.

Set a retention period appropriate to privacy and debugging needs. Artifacts can contain URLs, entered data, cookies, and visible personal information.

## Retries reveal rather than erase

Use limited retries in CI to distinguish intermittent behavior and collect a retry trace. Report flaky outcomes separately. Do not count “passed on retry” as equivalent to a clean first run.

## Sharding and parallelism

Split a sufficiently large isolated suite across workers or CI jobs. Before increasing concurrency, verify that accounts, records, rate limits, and environment capacity support it.

## Release signal

Define what blocks a merge or release:

- which core projects must pass;
- how flaky tests are quarantined and owned;
- which artifact is used for triage;
- who responds to infrastructure versus product failures.

CI is not merely a place to run commands. It is the feedback contract between the suite and the team.
