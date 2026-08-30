---
title: 'Pastikan Playwright Test Bisa Dijalankan Ulang di CI'
description: 'Ubah command yang berjalan di local menjadi CI job dengan runtime, dependency, browser, target aplikasi, dan test data yang jelas.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa saja yang dibutuhkan runner baru sebelum hasil browser test bisa dipercaya;
- membuat pipeline minimal yang menginstal dependency dari lockfile dan browser yang sesuai;
- memilih apakah CI menjalankan aplikasi dari repository atau menguji deployment yang sudah tersedia;
- memberikan configuration dan secret yang dibutuhkan tanpa membocorkan value-nya; serta
- membedakan masalah pipeline, environment, setup, product, dan test.

## Kenapa ini penting buat QA

Pernah nggak sih test pass di laptop, tapi langsung fail begitu masuk CI? Biasanya laptop kita sudah menyediakan sesuatu yang nggak dimiliki runner. Browser binary mungkin sudah terinstal, aplikasi masih berjalan di terminal lain, environment variable dibaca dari file yang nggak masuk repository, atau sisa test data membuat scenario kebetulan pass.

CI biasanya mulai dari runner yang lebih bersih. Kondisi ini membantu kita mengecek apakah engineer lain bisa menjalankan test yang sama hanya dari repository dan input yang memang diberikan secara resmi.

Test yang pass di local hanya menunjukkan kondisi laptop tersebut. CI run lebih bisa dipercaya kalau runtime, dependency, browser, aplikasi, configuration, test data, dan command semuanya bisa disiapkan ulang dari awal.

## Cara berpikir yang perlu kamu pegang

Pastikan CI menyiapkan input yang sama setiap kali run:

```text
Revision yang sama
  + runtime yang jelas dan dependency dari lockfile
  + browser serta system dependency yang sesuai
  + target aplikasi yang jelas
  + configuration dan test data yang terkontrol
  + test command yang sama
  = hasil run yang bisa dibandingkan
```

Pipeline terdiri dari beberapa bagian. Masalah di bagian awal bisa membuat error pada test terlihat seperti product bug:

| Bagian pipeline         | Pertanyaan yang perlu dijawab                                     |
| ----------------------- | ----------------------------------------------------------------- |
| Source                  | Revision mana yang sedang dijalankan?                             |
| Toolchain               | Runtime, lockfile, dan Playwright version mana yang dipakai?      |
| Browser environment     | Apakah browser dan OS library yang dibutuhkan sudah terinstal?    |
| Application target      | Apakah aplikasi yang benar sudah ready dan bisa diakses?          |
| Configuration dan state | Apakah value yang wajib tersedia dan starting state terkontrol?   |
| Test execution          | Command, project, dan scenario mana yang menghasilkan result ini? |

Jangan langsung mencatat setiap pipeline merah sebagai product defect. Cari dulu bagian pipeline mana yang bermasalah.

## Coba kita bedah contoh nyata

Checkout smoke test pass di local. Team ingin menjalankannya pada setiap pull request terhadap aplikasi yang dijalankan dari repository yang sama.

### 1. Tentukan siapa yang menjalankan aplikasi

Playwright configuration bisa menjalankan dan menghentikan aplikasi local melalui `webServer`:

```ts
import { defineConfig } from '@playwright/test';

const localURL = 'http://127.0.0.1:3000';
const baseURL = process.env.BASE_URL ?? localURL;

export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'bun run dev',
        url: localURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
```

Setting ini berarti:

- tanpa `BASE_URL`, Playwright menjalankan aplikasi dari repository lalu menunggu URL-nya ready;
- dengan `BASE_URL`, run menargetkan aplikasi yang sudah dideploy; dan
- CI nggak memakai process lain yang kebetulan sudah berjalan.

Kalau team nggak pernah menguji deployment, hapus pilihan `BASE_URL` tersebut. Kalau CI selalu menguji deployment, validasi `BASE_URL` dan hentikan run sebelum test dimulai ketika value-nya nggak ada. Jangan gunakan fallback yang bisa mengarahkan test ke production tanpa sengaja.

### 2. Install runtime, dependency, dan browser dari awal

Karena repository ini memakai Bun, berikut GitHub Actions job yang selaras dengan repository:

```yaml
name: Checkout smoke

on:
  pull_request:

permissions:
  contents: read

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      CI: 'true'
      E2E_CONTAINER_RUNTIME: docker

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3.4'

      - name: Install locked dependencies
        run: bun install --frozen-lockfile

      - name: Install Chromium and system dependencies
        run: bunx playwright install --with-deps chromium

      - name: Type-check
        run: bun run typecheck

      - name: Run repository E2E suite
        run: bun run test:e2e

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: e2e-diagnostics
          path: |
            playwright-report/
            test-results/
            allure-results/
          if-no-files-found: ignore
          retention-days: 14
```

Versi dan command di atas mengikuti Bun workflow repository ini. Di repository lain, ganti `1.3.4`, command untuk lockfile, browser yang diinstal, dan test command sesuai setup repository tersebut. Kalau versi runtime disimpan dalam file di repository, gunakan file itu sebagai sumber. Jangan memakai alias versi yang bisa berubah sewaktu-waktu.

Contoh minimal ini nggak memakai secret karena checkout smoke nggak membutuhkannya. Kalau authenticated test membutuhkan credential, berikan melalui protected environment yang memang diberi akses atau gunakan disposable test account. Pull request dari fork mungkin nggak menerima secret, dan code dari pull request nggak boleh mendapat production credential. Job ini hanya punya read-only access ke repository, durasinya dibatasi, dan artifact debugging tetap disimpan setelah test fail.

### 3. Cari bagian pipeline yang pertama kali bermasalah

Kalau job tadi fail, mulai dari error pertama yang menjelaskan penyebabnya:

| Yang terlihat                                    | Kemungkinan penyebab                                         | Cek dulu                                           |
| ------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------- |
| `bun install --frozen-lockfile` menolak lockfile | Manifest dan lockfile nggak sinkron                          | Install log dan lockfile di repository             |
| Browser executable nggak ada                     | Step install browser atau asumsi cache salah                 | Install command dan Playwright version             |
| `webServer` timeout                              | Aplikasi nggak berhasil start atau readiness URL salah       | Log process aplikasi dan URL dari configuration    |
| Semua test redirect ke sign-in                   | Secret atau authenticated state nggak ada atau sudah invalid | Validation configuration dan authentication setup  |
| Satu checkout assertion fail                     | Masalah product, test data, locator, atau expected result    | Test error, trace, network, dan test data scenario |

Menaikkan test timeout nggak akan memperbaiki dependency install yang gagal atau aplikasi yang nggak bisa dijangkau.

## Kapan pendekatan ini cocok dipakai?

Jalankan sekumpulan test penting pada pull request kalau hasilnya memang bisa mengubah keputusan merge. Jalankan deployment smoke setelah target benar-benar ready dan test data-nya aman digunakan.

Gunakan Playwright `webServer` untuk menjalankan aplikasi local kalau repository punya start command yang reliable. Uji deployment yang sudah tersedia kalau behavior bergantung pada deployment infrastructure atau integration configuration. Pastikan target yang dipilih terlihat jelas dari configuration dan log.

Gunakan prebuilt Playwright container ketika team membutuhkan Linux browser environment yang konsisten atau hasil screenshot yang stabil. Pastikan Playwright version di container sesuai dengan version di project. Container tetap nggak menggantikan test data yang terkontrol, pengelolaan secret, dan validasi target aplikasi.

Jangan menyalin workflow besar sebelum test suite bisa dijalankan melalui satu local command yang terdokumentasi. Jangan menambahkan cache sebelum pipeline berhasil tanpa cache. Jangan taruh credential di workflow YAML, test title, log, trace, atau environment file yang masuk repository. Action tag di contoh memang mudah dibaca, tapi production workflow tetap perlu mengikuti aturan organisasi kalau GitHub Action harus di-pin ke commit SHA.

## Kalau gagal, mulai cek dari mana?

Label “CI-only flaky test” bisa menyembunyikan beberapa penyebab yang berbeda:

| Yang terjadi di CI                                     | Kemungkinan penyebab                                          | Perbaikan                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- |
| Test hanya fail saat CPU atau memory runner tertekan   | Kapasitas runner atau jumlah worker nggak sesuai              | Ukur resource runner, kurangi worker, atau gunakan sharding |
| UI berbeda dari local                                  | Revision, target, feature config, atau account berbeda        | Catat dan validasi revision, URL, project, serta account    |
| Browser nggak bisa dibuka setelah upgrade              | Browser binary dan Playwright package version nggak cocok     | Install browser melalui Playwright CLI dari project         |
| Test berjalan sebelum aplikasi siap digunakan          | Readiness check belum mewakili aplikasi yang benar-benar siap | Perbaiki startup dan readiness check, bukan menambah sleep  |
| Pipeline pass tetapi scenario penting nggak dijalankan | Project, `grep`, atau discovery filter terlalu sempit         | Tampilkan dan review daftar test yang dipilih runner        |

Simpan log setup yang aman selain browser artifact. Trace nggak bisa menjelaskan dependency installation yang berhenti sebelum browser test dimulai.

## Review hasil kerja dengan bantuan AI

Review pipeline buatan AI dengan pertanyaan berikut:

- Apakah runtime, lockfile, dan command-nya memang digunakan oleh repository ini?
- Siapa yang menjalankan aplikasi, dan URL atau status apa yang menunjukkan aplikasi sudah ready?
- Bisakah URL yang kosong diam-diam memilih environment yang salah?
- Apakah browser diinstal menggunakan Playwright version dari project?
- Apakah GitHub Action yang digunakan mengikuti aturan version pinning repository?
- Permission, environment variable, dan secret apa yang diterima job?
- Bisakah secret masuk log, screenshot, trace, atau report?
- Apakah workflow mengupload artifact debugging setelah test fail?
- Kalau satu step fail, apakah log-nya cukup jelas untuk menunjukkan masalahnya?
- Apakah YAML buatan AI mengarang script, nama project, secret, atau deployment target?

YAML yang valid belum berarti workflow bisa menjalankan test dengan benar. Jalankan setiap command yang digunakan dan cek semua input yang diasumsikan tersedia.

## Coba cek pemahamanmu

AI membuat workflow yang melakukan checkout repository, lalu langsung menjalankan `bun run test:e2e` dan mengulang seluruh job dua kali ketika fail. Workflow nggak menginstal dependency atau Chromium, nggak menjalankan aplikasi, dan bergantung pada `BASE_URL` yang diatur manual di satu self-hosted runner.

Rancang ulang workflow minimal yang bisa dijalankan dari runner baru. Tentukan input mana yang harus tersedia di repository, mana yang diberikan dengan aman, siapa yang menjalankan dan menunggu aplikasi ready, serta artifact apa yang perlu disimpan setelah test fail.

## Bandingkan dengan cara pikir ini

Salah satu design yang masuk akal:

- Checkout revision yang diminta, gunakan Bun version yang sudah ditentukan, lalu install dependency dari lockfile di repository.
- Install browser yang dipilih dan system dependency melalui Playwright CLI dari project atau container dengan version yang sesuai.
- Jalankan aplikasi melalui `webServer`, atau wajibkan dan validasi URL deployment yang akan diuji.
- Berikan secret melalui CI storage yang memang diberi akses dan cegah value-nya masuk artifact.
- Jalankan type-check dan focused test command yang sama dengan workflow local, lalu atur jumlah worker CI sesuai kapasitas runner.
- Upload report dan directory diagnostic yang relevan ketika test step fail, lalu batasi berapa lama artifact disimpan.
- Hapus retry untuk seluruh job. Cari bagian pipeline yang fail dan gunakan test retry hanya kalau team memang punya aturan yang jelas.

Workflow-nya nggak harus besar. Yang penting, runner nggak bergantung pada browser, aplikasi, file, atau environment value yang hanya tersedia di satu machine.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mengubah local Playwright command menjadi CI job yang bisa dijalankan dari runner baru, lalu menentukan bagian mana yang bermasalah ketika job fail.

Lesson berikutnya mengasumsikan CI sudah bisa menjalankan test dengan setup yang konsisten. Kita akan menentukan scenario mana yang berjalan pada setiap trigger, artifact apa yang disimpan, dan siapa yang harus bertindak ketika test fail.
