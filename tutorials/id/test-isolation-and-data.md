---
title: 'Kendalikan Data Test, Autentikasi, dan State Network'
description: 'Buat kondisi awal yang dapat diulang tanpa mengubah setiap test menjadi perjalanan setup UI yang panjang.'
---

## Keandalan dimulai sebelum klik pertama

Test tidak dapat terisolasi jika bergantung pada data sisa run sebelumnya. Tentukan ownership akun, record, dan cleanup.

Pilih data yang:

- dibuat atau di-reset untuk skenario;
- unik ketika parallel worker dapat bertabrakan;
- minimal untuk perilaku yang diuji;
- bebas dari data pribadi production dan secret.

## Siapkan state di lapisan yang tepat

Jika test memverifikasi checkout, login dan membuat inventory melalui UI mungkin hanya setup. Gunakan API atau test utility tepercaya ketika setup tersebut berada di luar risiko:

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset-cart');
});
```

Buat setup cukup teramati agar gagal dengan jelas. HTTP status sukses saja belum tentu membuktikan record dibuat; validasi response atau query state jika diperlukan.

## Gunakan ulang autentikasi dengan aman

Playwright dapat menyimpan authenticated browser state dan memuatnya dalam project:

```ts
// setup/auth.setup.ts
await page.goto('/login');
await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page).toHaveURL(/dashboard/);
await page.context().storageState({ path: 'playwright/.auth/user.json' });
```

State file dapat berisi cookie sensitif. Jangan masukkan ke version control dan regenerate dengan aman. Gunakan akun atau state terpisah untuk test yang mengubah data server bersama.

## Network control memiliki dua tujuan

Gunakan API call untuk mengatur state. Gunakan routing/mocking ketika skenario membutuhkan response terkendali, error langka, atau dependency yang unavailable:

```ts
await page.route('**/api/recommendations', async (route) => {
  await route.fulfill({ status: 503, body: 'Unavailable' });
});
```

Jangan mock integrasi yang ingin diuji. Checkout yang sepenuhnya di-mock tidak dapat membuktikan integrasi checkout nyata bekerja.

## Keamanan paralel

Buat data aman per worker, hindari satu akun mutable bersama, dan buat cleanup idempotent. Jika sistem tidak mendukung write paralel, isolasi kelompok kecil itu dengan sengaja daripada mematikan parallelism untuk semuanya.

## Kontrak state

Dokumentasikan setiap skenario penting:

```text
Data yang dimiliki:
Cara membuat:
State autentikasi:
Dependency eksternal:
Cleanup:
Risiko tabrakan paralel:
```

Kontrak ini sering lebih penting bagi keandalan daripada syntax action di dalam test.
