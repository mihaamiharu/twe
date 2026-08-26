---
title: 'Action Seperti Pengguna'
description: 'Pilih action yang sesuai dengan kontrol dan gunakan input level keyboard hanya ketika perilaku bergantung pada event per karakter.'
---

## Sesuaikan action dengan kontrol

Action Playwright menyampaikan maksud dan mencakup pemeriksaan kesiapan yang relevan:

```ts
await page.getByRole('button', { name: 'Add to cart' }).click();
await page.getByLabel('Email').fill('qa@example.com');
await page.getByLabel('Remember me').check();
await page.getByLabel('Country').selectOption('ID');
```

Gunakan `check()` untuk checkbox, bukan sekadar mengklik. Jika sudah checked, `check()` mempertahankan state tersebut. State yang diinginkan menjadi eksplisit.

## Fill dibanding penekanan tombol berurutan

`fill()` memfokuskan kontrol editable, mengatur value, dan memicu perilaku input. Ini pilihan normal untuk form.

```ts
await page.getByLabel('Search').fill('playwright');
```

Gunakan `pressSequentially()` hanya ketika aplikasi bergantung pada event setiap tombol—misalnya autocomplete yang merespons setiap karakter:

```ts
await page.getByLabel('Search').pressSequentially('playwright', {
  delay: 50,
});
```

Delay bukan strategi sinkronisasi. Suggestion yang muncul tetap membutuhkan assertion yang dapat diamati.

## Perilaku keyboard dan focus

Utamakan menekan key melalui locator yang difokuskan:

```ts
const search = page.getByRole('searchbox');
await search.fill('invoice 1042');
await search.press('Enter');
```

Gunakan `page.keyboard` ketika global keyboard state memang perilaku yang diuji. Periksa focus secara eksplisit ketika focus itu sendiri penting:

```ts
await search.focus();
await expect(search).toBeFocused();
```

## Interaksi khusus

```ts
await page.getByText('Products').hover();
await source.dragTo(target);
await page.getByLabel('Resume').setInputFiles('fixtures/resume.pdf');
```

String pada `setInputFiles` adalah path filesystem yang dihitung dari working directory process. Gunakan payload file in-memory jika fixture file nyata tidak dibutuhkan.

## Forced action adalah sinyal diagnosis

`click({ force: true })` melewati sebagian pemeriksaan actionability. Ini dapat valid untuk kontrol tidak biasa, tetapi sering menyembunyikan overlay, disabled state, atau defect produk. Catat alasan interaksi pengguna normal tidak memungkinkan sebelum mempertahankannya.

Setiap action harus menghasilkan bukti. Pelajaran berikut menjelaskan hal yang ditunggu Playwright sebelum action dan hal yang tetap harus ditunggu test sesudahnya.
