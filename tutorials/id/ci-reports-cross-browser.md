---
title: 'Jalankan di CI dan Simpan Bukti Berguna'
description: 'Bangun pipeline feedback cepat dengan cakupan browser, report, trace, dan konfigurasi aman yang disengaja.'
---

## CI harus mereproduksi sistem test

Pipeline yang berguna menginstal locked dependency, browser yang diperlukan, menjalankan atau mengakses aplikasi yang benar, memvalidasi konfigurasi, melakukan type checking, lalu menjalankan test beserta artefaknya.

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm
  - run: npm ci
  - run: npx playwright install --with-deps
  - run: npm run typecheck
  - run: npx playwright test
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: playwright-report
      path: playwright-report/
```

Sesuaikan command dengan repository. Pin version action sesuai kebijakan keamanan tim.

## Feedback cepat sebelum cakupan luas

Atur test berdasarkan nilai dan biaya:

- critical smoke set kecil pada setiap perubahan;
- feature test terarah untuk perubahan terkait;
- cakupan browser/regression lebih luas saat merge atau terjadwal;
- cakupan device/vendor persis ketika risiko produk membutuhkannya.

Menjalankan semuanya di mana-mana dapat memperlambat feedback sampai akhirnya diabaikan.

## Laporkan perilaku, bukan hanya jumlah pass

Judul, step, dan attachment yang baik membuat report actionable. Simpan trace/screenshot/video ketika gagal atau retry pertama sesuai kebijakan. Upload artefak dengan `if: always()` agar bukti tetap tersimpan saat command test gagal.

Atur masa retensi sesuai kebutuhan privasi dan debugging. Artefak dapat mengandung URL, data input, cookie, dan informasi pribadi yang terlihat.

## Retry mengungkap, bukan menghapus

Gunakan retry terbatas di CI untuk membedakan perilaku intermittent dan mengumpulkan retry trace. Laporkan hasil flaky secara terpisah. Jangan menganggap “lulus setelah retry” setara dengan run pertama yang bersih.

## Sharding dan parallelism

Bagi suite terisolasi yang cukup besar ke beberapa worker atau CI job. Sebelum menambah concurrency, pastikan akun, record, rate limit, dan kapasitas environment mendukungnya.

## Sinyal release

Definisikan hal yang memblokir merge atau release:

- core project mana yang harus lulus;
- cara flaky test di-quarantine dan siapa pemiliknya;
- artefak mana yang dipakai untuk triage;
- siapa menangani kegagalan infrastructure dibanding produk.

CI bukan hanya tempat menjalankan command. CI adalah kontrak feedback antara suite dan tim.
