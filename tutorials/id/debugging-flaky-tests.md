---
title: 'Debug Kegagalan dan Flaky Test dengan Bukti'
description: 'Klasifikasikan kegagalan, gunakan artefak Playwright, dan perbaiki penyebab tanpa sleep, force, atau retry buta.'
---

## Kegagalan adalah observasi

Pertama, reproduksi sesempit mungkin:

```bash
npx playwright test tests/checkout.spec.ts -g "declined card"
npx playwright test tests/checkout.spec.ts --debug
npx playwright test --ui
```

Baca error bermakna pertama. Error berikutnya mungkin hanya akibat.

## Klasifikasikan sebelum mengubah kode

Kategori umum:

- **Locator:** hasil nol atau banyak, accessible name salah, frame salah.
- **State/data awal:** record hilang, akun bersama, banner tak terduga.
- **Sinkronisasi:** action selesai tetapi hasil yang diharapkan tidak ditunggu.
- **Defect produk:** UI atau API memang melanggar requirement.
- **Environment:** service unavailable, resource terbatas, konfigurasi invalid.
- **Logika test:** expectation salah, error ditelan, helper stale.

Setiap kategori membutuhkan bukti berbeda. Memperbesar timeout tidak memperbaiki data yang salah.

## Gunakan trace sebagai timeline

Konfigurasikan trace untuk menyimpan bukti kegagalan, lalu buka:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Inspeksi timeline action, detail locator, DOM snapshot, console, dan network. Bandingkan state sebelum langkah gagal dengan state yang diasumsikan test.

Screenshot menunjukkan tampilan pada satu momen. Video menunjukkan urutan. Trace memberi konteks interaktif paling kaya. Simpan artefak untuk kegagalan CI, bukan setiap run lulus selamanya.

## Pola perbaikan

| Gejala                       | Patch lemah               | Investigasi lebih baik                           |
| ---------------------------- | ------------------------- | ------------------------------------------------ |
| Element tidak dapat diklik   | `force: true`             | Cari overlay, aturan disabled, atau target salah |
| Konten muncul terlambat      | fixed sleep               | Periksa hasil terlihat yang dimaksud             |
| Gagal hanya saat paralel     | matikan semua parallelism | Cari tabrakan data/akun bersama                  |
| Lulus setelah retry          | terima retry              | Bandingkan trace run pertama dan state           |
| Locator hasil generate rusak | tambah CSS class          | Evaluasi ulang kontrak locator                   |

## Tinjau saran AI secara skeptis

Berikan exact error, kode relevan, dan observasi trace yang sudah disanitasi. Minta beberapa hipotesis beserta bukti yang membedakannya. Tolak saran yang menekan gejala tanpa menjelaskan penyebab.

## Catatan flake

Untuk kegagalan berulang, catat:

```text
Gejala teramati:
Frekuensi dan environment:
Action/assertion gagal pertama:
State harapan dibanding aktual:
Bukti:
Root cause:
Perbaikan dan regression coverage:
```

Test dinyatakan diperbaiki ketika asumsinya menjadi terkendali atau teramati—bukan hanya ketika warnanya hijau.
