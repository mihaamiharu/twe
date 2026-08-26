---
title: 'Built-In Fixture, Hook, dan Custom Fixture'
description: 'Gunakan resource terisolasi Playwright secara langsung, lalu buat custom fixture hanya untuk setup reusable dengan ownership jelas.'
---

## Mulai dari built-in fixture

```ts
test('loads products', async ({ page, request, context, browserName }) => {
  // page: tab terisolasi
  // request: APIRequestContext
  // context: browser session terisolasi
  // browserName: browser project saat ini
});
```

Playwright membuat fixture sesuai kebutuhan dan melakukan teardown berdasarkan scope. Sebagian besar test awal hanya memerlukan `page` dan mungkin `request`.

## Hook adalah timing bersama yang sederhana

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset-cart');
});
```

Gunakan hook ketika setiap test dalam describe block membutuhkan action yang sama. Jaga hook tetap terlihat dan kecil; setup tersembunyi membuat kegagalan sulit dipahami.

## Custom fixture membungkus resource reusable

```ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';

type AppFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await use(loginPage);
  },
});

export { expect };
```

Fixture menyatakan dependency pada `page`, melakukan setup, memberikan value ke test melalui `use`, dan dapat melakukan cleanup setelah `use` selesai.

## Pilih scope dengan sengaja

Test-scoped fixture dibuat untuk setiap test dan mendukung isolasi. Worker-scoped fixture dibagi oleh test dalam satu worker process dan cocok untuk service read-only mahal atau resource milik worker.

Jangan menaruh akun pelanggan mutable atau database transaction dalam worker scope kecuali ownership dan cleanup membuat penggunaan paralel aman.

## Checklist desain fixture

- Apakah fixture memiliki satu tanggung jawab jelas?
- Apakah kegagalan setup deskriptif?
- Apakah test scope sudah cukup?
- Siapa pemilik cleanup?
- Apakah fixture menyembunyikan business step yang seharusnya terlihat di judul test?
- Apakah aman dijalankan paralel?

Fixture adalah dependency management untuk test. Fixture bukan tujuan akhir, dan helper biasa dapat tetap menjadi pilihan lebih jelas.
