---
title: 'Capstone: Build, Review, Debug, dan Ship'
description: 'Gabungkan seluruh path menjadi suite end-to-end kecil dengan keputusan yang dapat kamu jelaskan dan rawat.'
---

## Tugas

Buat suite kecil untuk satu alur produk bernilai. Suite harus tetap dapat dipahami tanpa menghafal satu solusi persis.

Suite wajib memiliki:

1. satu skenario happy path;
2. satu skenario negatif atau boundary yang bermakna;
3. state awal terkendali dan independen;
4. locator yang menghadap pengguna atau kontrak test terdokumentasi;
5. web-first assertion untuk hasil yang relevan bagi bisnis;
6. tanpa fixed sleep dan tanpa forced action yang tidak dijelaskan;
7. organisasi kecil yang sesuai ukuran suite;
8. konfigurasi siap CI dan artefak kegagalan.

## Tinjau test hasil generate yang bermasalah

Capstone mencakup kode dengan defect khas AI: structural selector, fixed wait, asumsi shared state, assertion lemah, dan error yang ditelan. Jangan hanya membuatnya hijau. Untuk setiap perubahan, identifikasi:

```text
Masalah teramati:
Risiko jika dibiarkan:
Bukti yang digunakan:
Perbaikan:
Alasan perbaikan sesuai perilaku pengguna:
```

Syntax Playwright lain tetap diterima selama perilaku dan alasannya benar.

## Bentuk suite yang disarankan

```text
tests/
  checkout.spec.ts
pages-or-components/
  checkout.ts          hanya jika abstraksinya layak
fixtures/
  test-data.ts
playwright.config.ts
```

Jangan menambah page object atau custom fixture hanya untuk memenuhi rubric. Jelaskan mengapa test/helper biasa sudah cukup atau mengapa abstraksi mengurangi biaya perubahan nyata.

## Paket bukti

Sediakan:

- output test yang lulus;
- captured failure trace atau artefak diagnosis setara;
- catatan root cause singkat untuk test yang diperbaiki;
- cakupan browser/project beserta alasan;
- batasan yang diketahui dan skenario bernilai berikutnya.

## Standar penyelesaian

Learning path selesai ketika seluruh core lesson dan Core Practice selesai, termasuk checkpoint debugging dan capstone ini. Optional lesson dan Additional Practice tersedia untuk pendalaman, tetapi tidak memblokir penyelesaian.

Bantuan AI diperbolehkan. Kamu tetap harus mampu menjelaskan state awal, kontrak setiap locator, sinkronisasi action/hasil, bukti assertion, strategi isolasi, dan diagnosis kegagalan. Jika sebuah baris hasil generate belum dapat kamu jelaskan, kode tersebut belum dapat dirawat.

## Self-review terakhir

Jalankan test secara independen, dengan urutan berbeda, dan lebih dari sekali. Tinjau hasil run pertama—bukan hanya keberhasilan retry. Automation engineer praktis mengirim sistem feedback yang dapat dipercaya tim, bukan sekadar script yang pernah lulus.
