---
title: 'Debug Failures and Flaky Tests with Evidence'
description: 'Classify failures, use Playwright artifacts, and repair causes instead of adding sleeps, force, or blind retries.'
---

## A failure is an observation

First reproduce as narrowly as possible:

```bash
npx playwright test tests/checkout.spec.ts -g "declined card"
npx playwright test tests/checkout.spec.ts --debug
npx playwright test --ui
```

Read the first meaningful error. Later errors may only be consequences.

## Classify before changing code

Common categories:

- **Locator:** zero or multiple matches, wrong accessible name, wrong frame.
- **Starting state/data:** missing record, shared account, unexpected banner.
- **Synchronization:** action completed but the expected outcome was not awaited.
- **Product defect:** UI or API genuinely violated the requirement.
- **Environment:** service unavailable, resource starvation, invalid configuration.
- **Test logic:** wrong expectation, swallowed error, stale helper.

Each category suggests different evidence. Increasing a timeout does not repair wrong data.

## Use traces as a timeline

Configure traces to retain useful failure evidence, then open them:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Inspect the action timeline, locator details, DOM snapshots, console, and network. Compare the state before the failing step with the state the test assumed.

Screenshots show appearance at one moment. Videos show sequence. Traces provide the richest interactive context. Keep artifacts for failures in CI, not every passing run forever.

## Repair patterns

| Symptom                  | Weak patch              | Better investigation                         |
| ------------------------ | ----------------------- | -------------------------------------------- |
| Element not clickable    | `force: true`           | Find overlay, disabled rule, or wrong target |
| Content appears late     | fixed sleep             | Assert the intended visible outcome          |
| Only parallel run fails  | disable all parallelism | Find shared data/account collision           |
| Test passes on retry     | accept retry            | Compare first-run trace and state            |
| Generated locator breaks | add more CSS classes    | Re-evaluate the locator contract             |

## Review AI suggestions skeptically

Give AI the exact error, relevant code, and sanitized trace observations. Ask for multiple hypotheses and the evidence that would distinguish them. Reject suggestions that suppress the symptom without explaining the cause.

## Flake record

For recurring failures, record:

```text
Observed symptom:
Frequency and environment:
First failing action/assertion:
Expected versus actual state:
Evidence:
Root cause:
Repair and regression coverage:
```

A test is repaired when its assumption becomes controlled or observable—not when it merely turns green.
