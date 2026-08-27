---
title: 'Compose Advanced Fixtures Without Shared-State Traps (Optional)'
description: 'Use typed options, worker-owned resources, and automatic fixtures only when their lifecycle and maintenance cost are justified.'
---

## After this lesson, you can

- distinguish a configurable test option from a resource fixture;
- type test-scoped and worker-scoped fixtures correctly;
- design a worker-scoped resource with unique ownership and cleanup;
- use automatic fixtures for small observable cross-cutting behavior; and
- recognize when an advanced fixture graph should be simplified.

## Why this matters for QA

Advanced fixtures can remove expensive repeated setup and give a large suite a consistent interface. They can also create the hardest failures in the suite: mutable accounts shared across workers, hidden automatic behavior, cleanup that corrupts later tests, and dependency graphs nobody can explain.

Complexity is justified only when it buys clearer ownership, safer lifecycle management, or substantial measured setup savings. Advanced fixtures are not a maturity badge. A clear helper and test-scoped fixture can be the more professional design.

This lesson is optional depth. The core lessons cover the default test-scoped design; skip this lesson without blocking Module 8 unless the suite has a real need for configurable options, worker-owned resources, or automatic diagnostics.

## The mental model

Keep four concepts separate:

```text
Option          → configurable input; no resource lifecycle by itself
Test fixture    → resource owned by one test
Worker fixture  → resource owned by one worker process
Automatic       → runs even when a test does not request it explicitly
```

For every worker-scoped resource, prove this ownership statement:

```text
One worker creates it → only safe consumers use it → that worker cleans it up
```

If several workers can mutate the same server-side identity, browser isolation will not prevent a race.

## Work through a realistic example

Suppose a suite supports a configurable UI locale and needs one expensive, unique account per worker. Each individual test still receives a fresh signed-in browser context.

### 1. Define the option and fixture scopes

```ts
import { randomUUID } from 'node:crypto';

import {
  test as base,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
} from '@playwright/test';

type TestOptions = {
  appLocale: 'en' | 'id';
};

type TestFixtures = {
  signedInPage: Page;
};

type WorkerFixtures = {
  workerAccount: { id: string; email: string };
};
```

`appLocale` is input. `signedInPage` has one-test ownership. `workerAccount` has one-worker ownership.

### 2. Compose the lifecycles

```ts
export const test = base.extend<TestOptions & TestFixtures, WorkerFixtures>({
  appLocale: ['en', { option: true }],

  workerAccount: [
    async ({}, use, workerInfo) => {
      const runId = process.env.TEST_RUN_ID ?? `local-${randomUUID()}`;
      const account = await createTestAccount({
        uniqueKey: `${runId}-${workerInfo.project.name}-${workerInfo.workerIndex}`,
      });

      try {
        await use(account);
      } finally {
        await deleteTestAccount(account.id);
      }
    },
    { scope: 'worker' },
  ],

  signedInPage: async ({ browser, workerAccount, appLocale }, use) => {
    const storageState = await createStorageState(workerAccount.id);
    const context: BrowserContext = await browser.newContext({
      locale: appLocale,
      storageState,
    });
    try {
      const page = await context.newPage();
      await use(page);
    } finally {
      await context.close();
    }
  },
});
```

The worker fixture does not contain a password in source. It asks an authorized test-support utility for a unique account and deletes that exact account in `finally`. `workerIndex` is only unique within a run, so include a stable CI run ID or another run namespace when the support system can receive one; the random local fallback prevents ordinary local collisions.

The test-scoped fixture creates a fresh context and page for each test. Its `finally` block closes the context even when page creation or the test consumer fails. Reusing the account is safe only if those tests do not mutate shared account-level state. If they change profile, permissions, saved addresses, or preferences, allocate stronger isolation instead.

The option can be overridden by configuration:

```ts
projects: [
  { name: 'english', use: { appLocale: 'en' } },
  { name: 'indonesian', use: { appLocale: 'id' } },
];
```

Do not create locale projects for every scenario automatically. Apply the project portfolio according to supported behavior and risk.

### 3. Add automatic behavior only when it earns invisibility

An automatic fixture can retain browser console messages when a test fails:

```ts
type Diagnostics = {
  captureConsole: void;
};

export const testWithDiagnostics = test.extend<Diagnostics>({
  captureConsole: [
    async ({ page }, use, testInfo) => {
      const messages: string[] = [];
      const collect = (message: ConsoleMessage) => {
        messages.push(message.text());
      };

      page.on('console', collect);
      try {
        await use();
      } finally {
        page.off('console', collect);
      }

      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('browser-console', {
          body: messages.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});
```

The behavior is small, diagnostic, and visible in failure artifacts. The listener is removed in `finally` so a failing test cannot leave it attached to later fixture work. Review logs for secrets or personal data before retaining or sharing them.

## When to use it—and when not to

Use typed options when projects or test groups need to configure a stable input such as locale or a feature mode. Do not turn ordinary test data rows into global options.

Use worker scope for an expensive service or resource that one worker can own safely. Good candidates are immutable reference data, an isolated service instance, or a unique worker account used only for read-only scenarios.

Use automatic fixtures for small cross-cutting diagnostics or policy that truly must apply to every relevant test. Their hidden invocation makes them a poor home for business setup, navigation, or mutable data creation.

Keep the default test-scoped design when ownership is uncertain. If measured setup cost becomes a problem, optimize after identifying which resource can be safely shared.

## When it fails

| Observation                                 | Likely advanced-fixture problem              | First check                                                |
| ------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Failures occur only with several workers    | Workers share a mutable server-side identity | Run namespace, generated IDs, account ownership, worker index |
| A test runs setup it never requested        | Automatic fixture is too broad               | `{ auto: true }` fixtures and imported test object         |
| Worker restarts leave records behind        | Cleanup is missing or identity is not unique | `finally` block, setup failure path, retained resource IDs |
| Fixture timeout appears unrelated to a test | Slow fixture owns the time budget            | Fixture duration and configured fixture timeout            |
| Changing one option rebuilds many workers   | Worker fixture depends on a worker option    | Option scope and worker-fixture signature                  |
| Nobody can predict setup order              | Dependency graph is deep or implicit         | Draw dependencies and reverse teardown order               |

Worker processes can restart after failures. Use a stable run namespace when available, include the project and worker identity, and design cleanup and later setup to tolerate interrupted runs safely.

Do not solve races by forcing the entire suite to one worker before understanding the shared resource. That hides the ownership defect and sacrifices useful parallel feedback.

## Review generated work

Before accepting generated advanced fixtures, ask:

- Is this value an option, a test resource, or a worker resource?
- Why is worker scope safer and materially faster than test scope here?
- Which server-side state can consumers mutate?
- Is every worker identity unique, including after a restart?
- Does cleanup run for the exact owned resource on success and failure?
- Could automatic behavior expose secrets or alter the scenario?
- Are fixture dependencies shallow and explainable?
- Does an option unintentionally change worker reuse or multiply projects?
- Would a helper or ordinary test-scoped fixture be clearer?
- Did AI invent account factories, storage-state authority, or cleanup APIs?

Require a lifecycle diagram or written ownership contract for any shared mutable resource. If the author cannot explain setup and teardown order, the abstraction is not ready.

## Check your understanding

An AI-generated fixture creates one `admin@example.test` account at worker scope. All workers use the same storage-state file. Tests edit permissions and profile settings. An automatic fixture also navigates every page to `/admin` before each test.

Identify the races and hidden behavior. What would you keep, rescope, or remove?

## Compare your reasoning

One reasonable response is:

- Do not share one mutable admin identity or storage-state file across workers.
- Create a unique account per worker only if tests using it are read-only with respect to account-level state; otherwise use per-test identities or another isolation boundary.
- Give each test a fresh context even when safe authentication state is reused.
- Keep storage state out of version control and ensure one worker cannot overwrite another worker’s file.
- Remove automatic navigation because it hides a business-relevant starting step and affects tests that may need another route.
- Keep automatic diagnostics only if they are small, observable, sanitized, and useful for every imported test.
- Document cleanup and interrupted-run recovery for each generated account.

The advanced design is acceptable only after ownership becomes more explicit than it was in the simple version.

## Before you continue

You should now be able to distinguish options from resources, model test and worker ownership, and reject advanced fixture designs that hide behavior or share mutable state unsafely.

This lesson is optional. Completing it does not replace the Module 8 core outcome: choose the smallest maintainable abstraction, make dependencies explicit, and encode suite policy deliberately.
