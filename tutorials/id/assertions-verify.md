---
title: 'Web-First Assertion yang Membuktikan Perilaku'
description: 'Periksa hasil teramati dengan assertion Playwright yang retry dan hindari pemeriksaan yang lulus terlalu cepat.'
---

## Action bukan bukti

```ts
await page.getByRole('button', { name: 'Save profile' }).click();
```

Baris ini dapat berhasil walaupun save request kemudian gagal. Test menjadi berguna ketika membuktikan hasil yang diharapkan:

```ts
await expect(page.getByRole('status')).toHaveText('Profile saved');
```

## Utamakan web-first assertion

Locator assertion Playwright melakukan retry sampai lulus atau mencapai assertion timeout:

```ts
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
await expect(page.getByLabel('Email')).toHaveValue('qa@example.com');
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(page.getByRole('listitem')).toHaveCount(3);
await expect(page).toHaveURL(/\/dashboard$/);
```

Sebaliknya, baris berikut membaca satu momen tanpa retry otomatis:

```ts
expect(await locator.textContent()).toBe('Saved');
```

Gunakan one-time value assertion ketika snapshot memang disengaja. Jangan memakainya tanpa sadar untuk UI yang berubah.

## Periksa bukti terkecil yang cukup

Untuk submit order, heading konfirmasi dan order identifier mungkin sudah cukup. Memeriksa dua puluh field yang tidak terkait membuat test berisik dan sulit didiagnosis.

Hindari bukti detail implementasi seperti CSS class ketika state terlihat dapat diperiksa. Class yang berubah dari `loading` ke `loaded` tidak membuktikan data akun yang benar muncul.

## Negative assertion membutuhkan state awal yang diketahui

```ts
await expect(page.getByRole('dialog')).toBeHidden();
```

Ini dapat langsung lulus karena dialog tidak pernah muncul. Jika perilakunya adalah menghilang, pastikan state sebelumnya atau picu secara eksplisit:

```ts
await expect(dialog).toBeVisible();
await dialog.getByRole('button', { name: 'Close' }).click();
await expect(dialog).toBeHidden();
```

## Soft assertion

`expect.soft` mencatat kegagalan dan melanjutkan test, tetapi test tetap gagal pada akhirnya. Gunakan untuk kumpulan diagnosis independen, bukan untuk melanjutkan workflow yang prerequisite-nya sudah gagal.

## Review assertion

Untuk setiap assertion, tanyakan:

- Risiko apa yang dicakup?
- Bisakah assertion lulus sebelum action menghasilkan efek yang dimaksud?
- Bisakah assertion lulus pada element atau akun yang salah?
- Apakah kegagalan menjelaskan hal yang berubah?

Assertion terkuat bukan yang paling detail. Assertion terkuat adalah bukti terkecil yang andal untuk hasil skenario.
