---
title: 'Atur Environment, Project, Timeout, dan Secret di Playwright Configuration'
description: 'Pisahkan action yang diuji dari setting test runner, lalu pastikan test berjalan di target dan project yang tepat tanpa membocorkan secret.'
---

## Setelah lesson ini, kamu bisa

- memisahkan action dan expected result scenario dari setting test runner;
- menjelaskan test apa saja yang dijalankan oleh satu Playwright project;
- menambahkan project variant tanpa membuat jumlah test execution membesar tanpa sengaja;
- membedakan fungsi test, assertion, action, navigation, dan fixture timeout; serta
- memvalidasi environment variable dan mencegah secret masuk ke source code atau artifact.

## Kenapa ini penting buat QA

Test bisa ditulis dengan benar, tapi setting test runner masih dapat menghasilkan run yang berbahaya atau menyesatkan. Test mungkin diam-diam mengarah ke production, menjalankan semua scenario dalam terlalu banyak kombinasi, menunggu lama untuk expected result yang nggak akan muncul, atau menyimpan credential di configuration yang masuk repository.

Configuration bukan sekadar boilerplate untuk automation specialist. QA perlu membacanya karena file ini menentukan:

- file test mana yang ditemukan runner;
- environment dan aplikasi mana yang diuji;
- browser, device, role, atau variasi environment mana yang berjalan;
- berapa lama runner menunggu sebelum test fail; dan
- report, trace, screenshot, atau artifact apa yang disimpan.

Satu perubahan di configuration bisa mengubah target aplikasi, jumlah test execution, durasi run, dan informasi yang tersimpan. Karena itu, QA perlu me-review configuration seperti me-review test code.

## Cara berpikir yang perlu kamu pegang

Pisahkan isi test, fixture, dan configuration:

```text
Test code      → action yang diuji dan expected result
Fixtures       → resource, setup, scope, dan cleanup
Configuration  → file test, environment, project, dan setting runner
```

Playwright project adalah sekumpulan test yang berjalan dengan setting yang sama dan diberi satu nama. Istilah project di sini nggak otomatis berarti repository, deployment, atau project yang sedang dikerjakan product team.

Setiap project sebaiknya menjalankan satu kondisi yang memang ingin dibandingkan:

```text
Test yang relevan + satu variasi setting yang memang didukung
                            ↓
            Hasil run yang bisa dibandingkan
```

Kalau browser, device, role, atau environment di dalam project nggak mewakili kondisi user yang didukung atau kebutuhan operasional yang jelas, project tersebut hanya menambah jumlah run.

## Coba kita bedah contoh nyata

Team menjalankan desktop Chromium untuk setiap change. Customer flow yang critical juga perlu dicek di Firefox. Mulai dengan `baseURL` yang wajib diisi dan dua project yang namanya jelas:

```ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error('BASE_URL is required');
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

Baca setiap setting berdasarkan efeknya pada test run:

| Setting                      | Efeknya pada test run                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `testDir: './tests'`         | Runner hanya mencari file test di directory tersebut                  |
| required `BASE_URL`          | Run berhenti sebelum test dimulai kalau target URL nggak tersedia     |
| `timeout: 30_000`            | Test body, setup fixture, dan `beforeEach` berbagi batas 30 detik     |
| `expect.timeout: 5_000`      | Retrying assertion menunggu expected result maksimal selama 5 detik   |
| dua named project            | Test yang dipilih bisa dijalankan di Chromium dan Firefox             |
| failure trace dan screenshot | Saat test fail, runner menyimpan trace dan screenshot untuk debugging |

Menambahkan nama browser belum menentukan test mana yang perlu dijalankan di browser tersebut. Module 9 akan membahas scenario mana yang berjalan untuk setiap trigger dan artifact apa yang perlu disimpan di CI.

### Project juga bisa membedakan setting selain browser

Project bisa memvariasikan:

- browser engine atau device profile;
- authenticated versus signed-out state;
- locale yang didukung;
- environment atau feature configuration tertentu;
- timeout atau retry untuk group yang memang perlu dipisahkan; atau
- setup project yang menjadi dependency project lain.

Satu project sebaiknya mewakili satu kumpulan setting yang jelas. Hati-hati ketika beberapa variasi digabung:

```text
3 browsers × 2 devices × 3 roles × 2 environments = 36 variants
```

Kalau 200 test dijalankan pada semua 36 variasi, runner menjadwalkan 7.200 test execution bahkan sebelum retry. Jumlah sebesar itu perlu alasan berdasarkan product risk dan waktu yang tersedia di pipeline.

Mulai dengan coverage yang kecil dan jelas. Jalankan feedback yang luas dan cepat pada browser atau kondisi utama, lalu pilih scenario berisiko tinggi untuk variasi lain. Nggak semua scenario perlu dijalankan pada setiap kombinasi.

### Bedakan fungsi setiap timeout

| Jenis timeout      | Yang dibatasi                                                  |
| ------------------ | -------------------------------------------------------------- |
| Test timeout       | Test body, setup test-scoped fixture, dan `beforeEach`         |
| Expect timeout     | Waktu retrying assertion menunggu expected result              |
| Action timeout     | Waktu action menunggu element memenuhi actionability check     |
| Navigation timeout | Waktu navigation operation menunggu                            |
| Fixture timeout    | Waktu khusus untuk fixture lambat yang memang perlu dipisahkan |

Setelah test body selesai, teardown fixture dan `afterEach` mendapat timeout terpisah dengan durasi yang sama. Jangan menaikkan semua timeout hanya karena satu test menunggu terlalu lama. Cek dulu apakah operation memang lambat, expected result nggak pernah muncul, setup sudah menghabiskan sebagian besar test timeout, atau test berjalan di environment yang salah.

### Hentikan run kalau target environment nggak jelas

Configuration boleh membaca value dari environment variable atau mekanisme penyimpanan yang aman di local dan CI. Validasi value yang wajib tersedia sebelum test dimulai. Hindari fallback yang diam-diam mengarahkan test ke production.

Secret nggak boleh muncul di:

- configuration atau `.env` file yang masuk repository;
- test title atau error message;
- screenshot, trace, video, atau console output;
- prompt yang dikirim ke tool atau service di luar yang disetujui team; atau
- authenticated storage-state file yang masuk repository.

Environment variable hanya menjadi cara untuk mengirim value ke test. Secret tetap bocor kalau value tersebut kemudian dicetak ke log atau tersimpan di artifact.

### Pisahkan setting local runner dan CI

Lesson ini fokus pada apa yang bisa dijalankan developer secara local, project apa yang tersedia, dan artifact debugging apa yang dihasilkan saat test fail. Module 9 akan membahas test mana yang dipilih untuk setiap trigger, CI gate, retry, penyimpanan artifact, dan siapa yang menangani failure. Satu setting bisa dipakai di local maupun CI. Sebelum menaruhnya di configuration atau pipeline, cek bagian mana yang memang perlu menggunakan setting tersebut.

## Kapan pendekatan ini cocok dipakai?

Taruh setting yang berlaku untuk seluruh local runner di `playwright.config.ts`, seperti lokasi file test, default `use` value, project, timeout, reporter, artifact untuk debugging, dan local web server yang dijalankan oleh runner. Setting CI yang berubah berdasarkan trigger tetap berada di pipeline.

Pertahankan action dan assertion scenario di file test. Taruh setup serta cleanup resource di fixture. Jangan pindahkan percabangan scenario ke configuration hanya supaya file test terlihat lebih pendek.

Gunakan project ketika satu variasi setting perlu menjalankan group test tertentu. Gunakan data parameterization di level test kalau action yang diuji tetap sama dan yang berubah hanya contoh input serta expected result. Jangan membuat project untuk setiap baris test data.

Gunakan project dependency kalau satu setup memang harus selesai sebelum project lain dan hasil setup tersebut perlu muncul di report serta trace. Jangan memakai satu setup project untuk membuat mutable data yang kemudian diubah oleh semua parallel test.

Pilih timeout dari durasi yang benar-benar terlihat saat aplikasi berjalan. Kalau hanya satu operation yang memang lambat, exception di lokasi tersebut lebih mudah dipahami daripada menaikkan global timeout untuk semua test.

## Kalau gagal, mulai cek dari mana?

| Yang terjadi                                            | Kemungkinan penyebab                                           | Cek dulu                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Test mengubah data asli atau data yang nggak diharapkan | Target environment nggak divalidasi dengan aman                | `baseURL`, nama project, dan environment variable           |
| Local dan CI menjalankan scenario berbeda               | Lokasi test, `grep`, atau project filter sudah berbeda         | Configuration akhir dan command yang benar-benar dijalankan |
| Runtime naik jauh lebih cepat dari jumlah test          | Kombinasi project melipatgandakan setiap scenario              | Daftar project dan jumlah execution per scenario            |
| Setiap test yang fail membutuhkan waktu lama            | Global timeout menunggu expected result yang nggak akan muncul | Test fail pertama, assertion call log, dan durasi setup     |
| Satu project berhenti sebelum test code berjalan        | Setting khusus project atau dependency setup salah             | Project configuration, hasil dependency, dan input value    |
| Credential muncul di artifact                           | Secret diketik di UI yang terlihat atau tercetak di log        | Trace, screenshot, reporter output, dan test attachment     |

Cek project dan environment yang benar-benar digunakan oleh runner sebelum mengedit test. Source code yang sama bisa menjalankan kondisi berbeda ketika `baseURL`, storage state, locale, atau device profile berubah.

## Review hasil kerja dengan bantuan AI

Review configuration buatan AI baris demi baris:

- Apa efek setiap option pada test run?
- Test dan directory mana yang akan ditemukan?
- Bisakah value yang kosong diam-diam memilih environment yang salah?
- Apakah setiap project mewakili kondisi yang memang didukung atau product risk yang perlu diuji?
- Berapa total test execution yang dibuat oleh semua project?
- Apakah nama project menjelaskan browser, role, atau kondisi yang dijalankan di report?
- Kenapa timeout dinaikkan, dan log atau trace mana yang menunjukkan operation tersebut memang lambat?
- Apakah setup membuat shared mutable state?
- Bisakah secret masuk source, log, trace, screenshot, atau storage state?
- Apakah setting ini default untuk local runner, variasi project, atau keputusan CI trigger dan gate?
- Apakah AI mengarang device, environment, command, reporter, atau cara mengelola credential yang belum disetujui team?

Minta AI menghitung jumlah test execution dan menyebutkan asumsi yang dipakai, bukan hanya memberikan configuration snippet. Syntax yang valid tetap bisa menjalankan test yang salah atau membuat pipeline terlalu lambat.

## Coba cek pemahamanmu

AI membuat configuration dengan tiga browser, tiga device, dua locale, dua role, serta project staging dan production. Semuanya memakai global test timeout 120 detik dan fallback ke production URL saat `BASE_URL` nggak ada. Team punya 300 test.

Risiko dan biaya apa yang perlu kamu angkat saat review? Bagaimana kamu membuat configuration awal yang lebih kecil dan aman? Untuk setiap perubahan, tentukan apakah tempatnya ada di test, fixture, local configuration, atau CI.

## Bandingkan dengan cara pikir ini

Salah satu review yang masuk akal:

- Hentikan run saat target URL nggak tersedia. Jangan pernah fallback ke production tanpa persetujuan yang jelas.
- Hitung 72 variasi dan 21.600 test execution sebelum retry.
- Tentukan browser utama, lalu pilih sedikit scenario yang memang perlu coverage browser, device, locale, atau role lain.
- Pisahkan production testing, wajibkan authorization, gunakan flow read-only jika sesuai, lalu siapkan aturan test data dan keamanan sendiri.
- Kembalikan global timeout ke durasi yang sesuai dengan hasil run, lalu cek operation lambat secara terpisah.
- Beri setiap project yang dipertahankan nama report dan alasan yang jelas.
- Pastikan authentication state dan secret diberikan dengan aman, nggak masuk repository, dan nggak tersimpan sebagai attachment.

Configuration awal cukup mencakup kondisi yang memang didukung sekarang. Setiap setting harus menunjukkan target yang dijalankan, jumlah run yang dibuat, dan alasan kenapa variasi tersebut dibutuhkan.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menjelaskan setting mana yang berada di test, fixture, dan configuration; membuat Playwright project untuk kondisi yang memang didukung; serta me-review environment, timeout, dan secret sebelum test suite berjalan.

Optional lesson berikutnya membahas fixture yang lebih advanced. Lewati dulu kalau test suite belum benar-benar membutuhkan configurable option, resource yang dipakai satu worker, atau diagnostic yang berjalan automatic.
