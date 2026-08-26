---
title: 'Komposisi Fixture Lanjutan (Opsional)'
description: 'Susun typed option dan worker-scoped resource hanya setelah ownership, scope, serta cleanup dipahami.'
---

## Kapan fixture lanjutan layak digunakan

Gunakan pola opsional ini ketika banyak test berbagi lifecycle resource nyata yang tidak dapat dijelaskan helper dan test-scoped fixture secara bersih. Kompleksitasnya harus memberi ownership lebih jelas atau penghematan setup yang berarti.

## Pisahkan option dari fixture

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

Di repository nyata, muat password dengan aman dan jangan menyimpannya di source. Option dapat di-override per project atau test group.

## Worker scope membutuhkan ownership per worker

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

Worker memiliki akun unik dan cleanup-nya. Berbagi satu akun mutable antar-worker akan menciptakan race.

## Automatic fixture

Automatic fixture dapat melampirkan log atau menjalankan kebijakan cross-cutting, tetapi perilaku tersembunyi harus kecil dan teramati:

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

## Kondisi untuk berhenti

Jangan membangun framework fixture ketika:

- dependency fixture membentuk graph dalam;
- business step menjadi tidak terlihat;
- worker state mutable dan dibagi;
- kegagalan cleanup dapat merusak test berikutnya;
- helper lebih mudah dipahami.

Fixture lanjutan adalah alat yang ditargetkan, bukan lencana kedewasaan.
