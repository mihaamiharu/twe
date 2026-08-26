---
title: 'Advanced Fixture Composition (Optional)'
description: 'Compose typed options and worker-scoped resources only after ownership, scope, and cleanup are understood.'
---

## When advanced fixtures are justified

Use this optional pattern when many tests share a real resource lifecycle that plain helpers and test-scoped fixtures cannot express cleanly. Complexity must buy clearer ownership or substantial setup savings.

## Separate options from fixtures

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login-page';

type Options = {
  defaultUser: { email: string; password: string };
};

type Fixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<Options & Fixtures>({
  defaultUser: [
    { email: 'qa@example.com', password: 'local-only' },
    { option: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
```

In a real repository, load the password securely rather than keeping it in source. Options can be overridden per project or test group.

## Worker scope requires worker ownership

```ts
type WorkerFixtures = {
  workerAccount: { email: string };
};

export const test = base.extend<{}, WorkerFixtures>({
  workerAccount: [
    async ({}, use, workerInfo) => {
      const account = await createAccount(`worker-${workerInfo.workerIndex}`);
      await use(account);
      await deleteAccount(account.email);
    },
    { scope: 'worker' },
  ],
});
```

The worker owns a unique account and cleanup. Sharing one mutable account across workers would create races.

## Automatic fixtures

An automatic fixture can attach logs or enforce cross-cutting policy, but hidden behavior should remain small and observable:

```ts
captureLogs: [
  async ({ page }, use, testInfo) => {
    const messages: string[] = [];
    page.on('console', (message) => messages.push(message.text()));
    await use();
    await testInfo.attach('browser-console', {
      body: messages.join('\n'),
      contentType: 'text/plain',
    });
  },
  { auto: true },
],
```

## Stop conditions

Do not build a fixture framework when:

- fixture dependencies form a deep graph;
- business steps become invisible;
- worker state is mutable and shared;
- cleanup failure can corrupt later tests;
- a helper would be easier to understand.

Advanced fixtures are a targeted tool, not a maturity badge.
