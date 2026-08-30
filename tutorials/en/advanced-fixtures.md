---
title: 'Use Typed Options, Worker Scope, and Automatic Fixtures Safely (Optional)'
description: 'Use advanced fixtures only when resources can be shared safely, cleanup is clear, and the measured setup savings are worth the added complexity.'
---

## After this lesson, you can

- distinguish a configurable test option from a resource fixture;
- type test-scoped and worker-scoped fixtures correctly;
- create a unique resource for each worker and clean it up safely;
- use automatic fixtures for small diagnostics that many tests need; and
- recognize when an advanced fixture graph should be simplified.

## Why this matters for QA

Advanced fixtures can reduce expensive repeated setup and give many tests the same setup interface. They can also cause failures that are difficult to debug: several workers changing the same account, automatic fixtures running hidden actions, cleanup deleting data still used by another test, or setup order nobody can explain.

Add this complexity only when you can clearly show who creates and cleans up each resource, or measurements show that it saves substantial setup time. More fixtures do not make a suite more mature. A helper and test-scoped fixture are often easier to maintain.

This lesson is optional depth. The core lessons cover the default test-scoped design; skip this lesson without blocking Module 8 unless the suite has a real need for configurable options, worker-owned resources, or automatic diagnostics.

## The mental model

Keep four concepts separate:

```text
Option          → configurable input; no resource lifecycle by itself
Test fixture    → resource owned by one test
Worker fixture  → resource owned by one worker process
Automatic       → runs even when a test does not request it explicitly
```

For every worker-scoped resource, explain this sequence:

```text
One worker creates it → safe tests use it → the same worker cleans it up
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

`appLocale` is an input that projects can configure. `signedInPage` is created for one test, while `workerAccount` is created for one worker.

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

The worker fixture does not store a password in source code. It requests a unique account from an authorized test-support utility and deletes that account in `finally`. `workerIndex` is unique only within one run, so include a stable CI run ID or another run identifier in `uniqueKey`. The random local fallback prevents ordinary local collisions.

The test-scoped fixture creates a fresh context and page for each test. Its `finally` block closes the context when page creation or the test fails. Several tests may reuse the worker account only when they do not change account-level state. If they change the profile, permissions, saved addresses, or preferences, give each test its own account.

The option can be overridden by configuration:

```ts
projects: [
  { name: 'english', use: { appLocale: 'en' } },
  { name: 'indonesian', use: { appLocale: 'id' } },
];
```

Do not create locale projects for every scenario automatically. Apply the project portfolio according to supported behavior and risk.

### 3. Use automatic fixtures only for small diagnostics

An automatic fixture can retain browser console messages when a test fails:

```ts
type Diagnostics = {
  captureConsole: void;
};

export const testWithDiagnostics = test.extend<Diagnostics>({
  captureConsole: [
    async ({ signedInPage }, use, testInfo) => {
      const messages: string[] = [];
      const collect = (message: ConsoleMessage) => {
        messages.push(message.text());
      };

      signedInPage.on('console', collect);
      try {
        await use();
      } finally {
        signedInPage.off('console', collect);
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

This fixture only collects diagnostics, and its output appears in the artifact when a test fails. It listens to the same `signedInPage` provided to the test. The listener is removed in `finally` so it does not remain active during later teardown. Check console messages for secrets or personal data before storing or sharing the artifact.

## When to use it—and when not to

Use typed options when projects or test groups need to configure a stable input such as locale or feature mode. Keep ordinary test-data rows in the test instead of turning each one into a global option.

Use worker scope for an expensive service or resource that one worker can use safely. Good candidates include immutable reference data, an isolated service instance, or a unique worker account used only by read-only scenarios.

Use automatic fixtures for small diagnostics that every relevant test needs. Because they run without appearing in the test parameters, do not use them for business setup, navigation, or mutable test-data creation.

Keep test scope when you are not sure whether a resource is safe to share. If setup becomes slow, measure it first and identify the specific resource that several tests can share safely.

## When it fails

| Observation                                 | Likely problem                               | Check first                                                |
| ------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Failures occur only with several workers    | Workers change the same server-side account  | Run ID, generated IDs, account per worker, `workerIndex`   |
| A test runs setup it never requested        | Automatic fixture is too broad               | `{ auto: true }` fixtures and imported test object         |
| Worker restarts leave records behind        | Cleanup is missing or identity is not unique | `finally` block, setup failure path, retained resource IDs |
| Fixture timeout appears unrelated to a test | Slow fixture owns the time budget            | Fixture duration and configured fixture timeout            |
| Changing one option rebuilds many workers   | Worker fixture depends on a worker option    | Option scope and worker-fixture signature                  |
| Nobody can predict setup order              | Dependency graph is deep or implicit         | Draw dependencies and reverse teardown order               |

Worker processes can restart after failures. Use a stable run namespace when available, include the project and worker identity, and design cleanup and later setup to tolerate interrupted runs safely.

Do not immediately force the entire suite to one worker to remove a race. First find which resource is shared and which tests change it. One worker only hides that problem and makes parallel feedback slower.

## Review AI-assisted work

Before accepting generated advanced fixtures, ask:

- Is this value an option, a test resource, or a worker resource?
- How much setup time does worker scope save, and why is the resource safe for several tests?
- Which server-side state can consumers mutate?
- Is every worker identity unique, including after a restart?
- Does cleanup run for the exact owned resource on success and failure?
- Could automatic behavior expose secrets or alter the scenario?
- Can someone explain the dependency, setup, and teardown order?
- Does an option unintentionally change worker reuse or multiply projects?
- Would a helper or ordinary test-scoped fixture be clearer?
- Did AI invent account factories, storage-state authority, or cleanup APIs?

For any shared mutable resource, ask for a diagram showing who creates, uses, changes, and deletes it. If the author cannot explain setup and teardown order, the fixture is not ready.

## Check your understanding

An AI-generated fixture creates one `admin@example.test` account at worker scope. All workers use the same storage-state file. Tests edit permissions and profile settings. An automatic fixture also navigates every page to `/admin` before each test.

Identify the races and hidden behavior. What would you keep, rescope, or remove?

## Compare your reasoning

One reasonable response is:

- Do not share one mutable admin identity or storage-state file across workers.
- Create a unique account per worker only if those tests do not change account-level state. Otherwise, use a separate account per test.
- Give each test a fresh context even when safe authentication state is reused.
- Keep storage state out of version control and ensure one worker cannot overwrite another worker’s file.
- Remove automatic navigation because it hides a business-relevant starting step and affects tests that may need another route.
- Keep automatic diagnostics only if they are small, visible in artifacts, sanitized, and useful for every imported test.
- Document cleanup and interrupted-run recovery for each generated account.

Use the advanced design only when it is easier to explain who creates, changes, and cleans up each resource than it was in the simpler version.

## Before you continue

You should now be able to distinguish options from resources, choose test or worker scope, and reject advanced fixture designs that hide actions or make several tests change the same mutable state.

This lesson is optional. Module 8 still requires the same core result: choose the smallest useful abstraction, show which resources a test needs, and make every suite setting easy to explain.
