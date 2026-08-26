---
title: 'Actionability Bukan Sinkronisasi Hasil'
description: 'Pahami pemeriksaan kesiapan khusus tiap action dan tunggu hasil aplikasi yang benar-benar dibutuhkan skenario.'
---

## Perlindungan dari actionability

Sebelum action, Playwright menyelesaikan locator dan menjalankan pemeriksaan yang relevan dengan action tersebut. Contohnya, `click()` membutuhkan satu element yang visible, stable, dapat menerima event, dan enabled. `fill()` membutuhkan element yang visible, enabled, serta editable; kumpulan pemeriksaannya tidak sama dengan click.

Jika kondisi tersebut tidak terpenuhi dalam action timeout, action gagal dengan detail diagnosis.

```ts
await page.getByRole('button', { name: 'Pay now' }).click();
```

Ini melindungi dari klik pada target yang bergerak, tertutup, atau disabled. Baris tersebut tidak menyatakan pembayaran selesai.

## Pisahkan tiga momen

```text
1. Target siap untuk action
2. Action dikirim/diselesaikan
3. Aplikasi mencapai hasil yang diharapkan
```

Playwright menangani sebagian besar momen 1 dan 2. Skenario harus mendefinisikan momen 3:

```ts
await page.getByRole('button', { name: 'Pay now' }).click();

await expect(
  page.getByRole('heading', { name: 'Payment confirmed' }),
).toBeVisible();
```

Web-first assertion memeriksa konfirmasi berulang kali. Fixed sleep tidak dibutuhkan.

## Tunggu event ketika event adalah perilaku produk

Kadang action menghasilkan event, bukan UI di halaman yang sama. Mulai listener sebelum action:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;
await download.saveAs('artifacts/orders.csv');
```

Pola yang sama berlaku untuk popup dan event satu kali lainnya.

## Jangan sembunyikan ketidakpastian

Hindari:

```ts
await page.waitForTimeout(2000);
await button.click({ force: true });
```

Sleep menebak waktu; force melewati bukti bahwa pengguna tidak dapat berinteraksi. Diagnosis state sebenarnya: loading indicator, overlay, data salah, animation, atau aturan bisnis disabled.

Retry menjalankan ulang test gagal dan dapat membantu noise infrastruktur, tetapi tidak memperbaiki sinkronisasi yang hilang. Test yang hanya lulus setelah retry tetap harus di-debug.

## Tinjau wait hasil generate

Untuk setiap wait, tanyakan kondisi teramati apa yang mengakhirinya. Untuk setiap action, tanyakan hasil apa yang membuktikan keberhasilan. Jika keduanya tidak eksplisit, test rentan terhadap race atau false pass.
