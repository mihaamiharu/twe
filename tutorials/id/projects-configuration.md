---
title: 'Konfigurasi, Project, Environment, dan Secret'
description: 'Jaga test tetap portable sambil membuat kebijakan browser, environment, timeout, dan artefak menjadi eksplisit.'
---

## Konfigurasi menjelaskan sistem test

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

Kode test menyatakan perilaku. Konfigurasi menyatakan kebijakan runner dan perbedaan environment.

## Project adalah variasi yang disengaja

Project dapat mewakili browser engine, profil viewport/device, authenticated role, atau setup khusus environment. Jangan memperbanyak setiap dimensi tanpa pertimbangan; kombinasi semuanya dapat memperlambat CI tanpa menambah cakupan risiko sebanding.

Pilih variasi berdasarkan pengguna yang didukung dan risiko produk. Chromium smoke suite pada setiap perubahan ditambah cakupan lebih luas terjadwal mungkin lebih berguna daripada menjalankan semua skenario di semua tempat.

## Lapisan timeout memiliki makna berbeda

- test timeout membatasi seluruh test termasuk fixture;
- assertion timeout membatasi retry pada `expect`;
- action/navigation timeout dapat dikonfigurasi terpisah.

Memperbesar semua timeout secara global membuat hang nyata semakin mahal dan tidak memperbaiki kondisi salah. Ubah timeout hanya dengan bukti bahwa operasi memang lebih lambat secara wajar.

## Environment value dan secret

Validasi nilai wajib sejak awal:

```ts
const testPassword = process.env.TEST_PASSWORD;
if (!testPassword) throw new Error('TEST_PASSWORD is required');
```

Gunakan environment file lokal yang di-ignore dan secret storage CI. Jangan commit credential, authenticated storage state, production token, atau data pelanggan. Hindari mencetak secret dalam judul test, log, trace, dan screenshot.

## Review konfigurasi

Dokumentasikan:

- cakupan browser/device yang didukung beserta alasan;
- URL environment dan ownership data test;
- retensi artefak;
- retry dan tujuannya;
- batas concurrency;
- command type checking dan test.

Konfigurasi adalah kebijakan executable. Tinjau dengan ketelitian yang sama seperti kode test.
