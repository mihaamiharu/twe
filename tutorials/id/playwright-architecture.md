---
title: 'Browser Context dan Isolasi Test'
description: 'Pahami object Playwright yang menjaga test tetap realistis, independen, dan aman dijalankan paralel.'
---

## Object model yang berguna

```text
Browser
└── BrowserContext (session terisolasi)
    ├── Page (tab)
    └── Page (tab lain)
```

Satu browser process dapat memiliki beberapa context. Setiap context berperilaku seperti session incognito terpisah dengan cookies, local storage, dan permission sendiri. Page di dalam satu context berbagi session tersebut.

Playwright Test biasanya memberi context dan page baru untuk setiap test:

```ts
test('customer sees an empty cart', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});
```

Isolasi tersebut adalah fitur keandalan inti, bukan overhead yang boleh diabaikan.

## Modelkan beberapa pengguna dengan context

```ts
test('agent replies to a customer', async ({ browser }) => {
  const customerContext = await browser.newContext();
  const agentContext = await browser.newContext();

  const customerPage = await customerContext.newPage();
  const agentPage = await agentContext.newPage();

  // Setiap page memiliki authenticated session terpisah.

  await customerContext.close();
  await agentContext.close();
});
```

Gunakan hanya jika skenario benar-benar membutuhkan role bersamaan. Sebagian besar test cukup menggunakan fixture `page` standar.

## Cakupan browser bukan kesetaraan brand

Playwright menjalankan engine Chromium, Firefox, dan WebKit. WebKit memberi cakupan berguna untuk perilaku engine mirip Safari, tetapi Playwright WebKit bukan branded Safari. Gunakan real-device atau vendor-browser testing jika risiko produk membutuhkan cakupan browser/device brand yang persis.

## Hafalan protocol bukan tujuan kurikulum

Playwright berkomunikasi dengan setiap browser yang didukung melalui integrasinya sendiri. Dampak praktis lebih penting daripada menghafal nama protocol:

- context cukup ringan untuk isolasi level test;
- locator mencari ulang pada DOM aktif;
- action memiliki pemeriksaan kesiapan yang memahami browser;
- trace dapat menggabungkan DOM snapshot, action, network, dan error.

## Checklist isolasi

Sebuah test harus dapat dijalankan sendiri, setelah test lain, dengan urutan berbeda, dan secara paralel tanpa mengubah hasil. Jika tidak, investigasi akun bersama, record bersama, cached state, batas server, atau cleanup—bukan arsitektur browser engine.
