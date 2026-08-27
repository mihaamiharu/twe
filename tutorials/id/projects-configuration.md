---
title: 'Perlakukan Configuration sebagai Executable Test Policy'
description: 'Pisahkan scenario behavior dari runner policy, lalu tentukan environment, project, timeout, dan secret secara deliberate.'
---

## Setelah lesson ini, kamu bisa

- memisahkan scenario behavior dari suite-wide runner policy;
- menjelaskan apa yang direpresentasikan Playwright project;
- menambahkan project variant tanpa membuat accidental test matrix;
- membedakan concern test, assertion, action, dan navigation timeout; serta
- memvalidasi environment value dan menjaga secret tetap di luar source serta artifact.

## Kenapa ini penting buat QA

Test code bisa benar, tapi system di sekelilingnya masih bisa unsafe atau misleading. Test mungkin diam-diam menargetkan environment yang salah, menjalankan semua scenario di matrix raksasa, menunggu terlalu lama saat kondisi nggak akan pernah muncul, atau membocorkan credential lewat committed configuration.

Configuration bukan boilerplate yang cuma perlu dipahami automation specialist. Configuration menjawab pertanyaan QA yang punya product consequence:

- Test mana yang ditemukan runner?
- Aplikasi mana yang sedang diuji?
- Browser, device, role, atau environment variant mana yang berjalan?
- Berapa lama kita menunggu sebelum menyebut kondisi sebagai failure?
- Evidence apa yang disimpan?

Karena configuration bisa mengubah arti dan biaya setiap run, perlakukan dia sebagai executable test policy.

## Cara berpikir yang perlu kamu pegang

Pisahkan tiga responsibility ini:

```text
Test code      → behavior, product risk, action, evidence
Fixtures       → named dependency dan lifecycle-nya
Configuration  → discovery, environment, variant, dan runner policy
```

Playwright project adalah satu named group of tests yang berjalan dengan configuration yang sama. Ini nggak otomatis berarti repository, deployment, atau product project.

Bayangkan setiap project sedang menanyakan satu pertanyaan yang deliberate:

```text
Relevant tests yang sama + satu meaningful configuration variant
                              ↓
                      comparable evidence
```

Kalau sebuah project nggak merepresentasikan supported user condition, operational need, atau product risk, bisa jadi dia cuma melipatgandakan runtime.

## Coba kita bedah contoh nyata

Team mendukung desktop Chromium untuk setiap change dan juga membutuhkan Firefox evidence untuk critical customer flow. Mulai dari explicit base URL dan dua named project:

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

Baca code ini sebagai policy, bukan sekadar syntax:

| Setting                      | Policy decision                                                   |
| ---------------------------- | ----------------------------------------------------------------- |
| `testDir: './tests'`         | Hanya intended suite directory yang ditemukan                     |
| required `BASE_URL`          | Run berhenti sebelum testing kalau target-nya nggak diketahui     |
| `timeout: 30_000`            | Satu test dan test-scoped fixture punya bounded budget            |
| `expect.timeout: 5_000`      | Retrying assertion punya evidence-waiting budget yang lebih kecil |
| dua named project            | Selected test bisa berjalan di dua supported browser profile      |
| failure trace dan screenshot | Failed run menyimpan diagnostic evidence                          |

Nama browser belum menentukan coverage strategy. Module 9 nanti membahas risk-based subset mana yang berjalan pada setiap trigger dan bagaimana evidence disimpan di CI.

### Project nggak cuma untuk browser

Project bisa memvariasikan:

- browser engine atau device profile;
- authenticated versus signed-out state;
- supported locale;
- focused environment atau feature configuration;
- timeout atau retry policy untuk group yang memang dipisahkan; atau
- setup project yang menjadi dependency project lain.

Satu project sebaiknya mengekspresikan coherent variant. Hati-hati saat beberapa dimension digabung:

```text
3 browsers × 2 devices × 3 roles × 2 environments = 36 variants
```

Kalau 200 test berjalan di semua 36 variant, suite menjadwalkan 7.200 test execution bahkan sebelum retry. Itu baru layak kalau risk dan operational budget memang mendukungnya.

Lebih baik mulai dari deliberate portfolio: broad fast feedback di primary supported condition, ditambah selected scenario untuk high-risk variant lain. Jangan berasumsi setiap scenario membutuhkan setiap kombinasi.

### Timeout punya boundary yang berbeda

| Timeout concern    | Yang dibatasi atau dikontrol                                  |
| ------------------ | ------------------------------------------------------------- |
| Test timeout       | Seluruh test, termasuk test-scoped fixture setup dan teardown |
| Expect timeout     | Waktu retrying assertion menunggu condition                   |
| Action timeout     | Waktu action menunggu actionability requirement               |
| Navigation timeout | Waktu navigation operation menunggu                           |
| Fixture timeout    | Separate budget untuk slow fixture yang memang justified      |

Jangan menaikkan semua timeout hanya karena satu condition salah. Cari tahu dulu apakah operation memang legitimate slow, expected state nggak pernah muncul, setup menghabiskan budget, atau test menargetkan environment yang salah.

### Perlakukan environment value sebagai input

Configuration boleh membaca value dari environment variable atau secure local/CI mechanism. Validasi required value sedini mungkin dan hindari fallback yang bisa diam-diam menargetkan production.

Secret nggak boleh muncul di:

- committed configuration atau `.env` file;
- test title atau error message;
- screenshot, trace, video, atau console output;
- generated prompt yang dikirim keluar dari approved boundary; atau
- authenticated storage-state file yang masuk version control.

Environment variable cuma delivery mechanism. Value-nya tetap nggak aman kalau kemudian dicetak atau disimpan di artifact.

### Bedakan local policy dari CI policy

Lesson ini berhenti di resolved local runner contract: apa yang bisa dijalankan developer, supported variant apa yang tersedia, dan diagnostic evidence apa yang dihasilkan saat run gagal. Module 9 yang membahas trigger-specific selection, CI gate, retry policy, artifact retention, dan feedback ownership. Satu setting bisa valid di dua tempat; saat review, tentukan siapa yang memakai keputusan itu sebelum menaruhnya di configuration atau pipeline.

## Kapan pendekatan ini cocok dipakai?

Taruh stable runner-wide policy di `playwright.config.ts`: test discovery, default `use` value, project, timeout, reporter, local diagnostic default, dan owned local web server kalau memang sesuai. Serahkan CI policy yang bergantung pada trigger ke pipeline layer.

Pertahankan product action dan assertion di test. Taruh dependency setup serta cleanup di fixture. Jangan pindahkan scenario branch ke configuration cuma supaya test file terlihat pendek.

Pakai project kalau satu named configuration variant perlu menjalankan meaningful group of tests. Pakai test-level data parameterization kalau behavior-nya sama dan yang berubah hanya input/output example. Jangan bikin project untuk setiap test-data row.

Pakai project dependency kalau ada real prerequisite yang harus selesai sebelum dependent project dan result-nya perlu terlihat di report serta trace. Jangan ubah satu shared setup project menjadi mutable data yang dimodifikasi semua parallel test.

Pilih timeout dari observed system behavior dan failure cost. Narrow local exception biasanya lebih gampang dipahami daripada large global increase.

## Kalau gagal, mulai cek dari mana?

| Observation                                   | Kemungkinan policy problem                       | Evidence yang diperiksa                                 |
| --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Test mengubah real atau unexpected data       | Environment validation hilang atau unsafe        | Resolved base URL, project name, environment variable   |
| Local dan CI menjalankan scenario berbeda     | Discovery, grep, atau project filter sudah drift | Final config dan exact command                          |
| Runtime naik jauh lebih cepat dari test count | Project dimension membentuk Cartesian product    | Project list dan execution per scenario                 |
| Semua failure lama sekali                     | Global timeout menutupi absent condition         | First failure, assertion call log, setup duration       |
| Satu project gagal sebelum test code berjalan | Project option atau dependency setup salah       | Project config, dependency result, resolved input value |
| Credential muncul di artifact                 | Secret masuk visible UI atau tercetak di log     | Trace, screenshot, reporter output, test attachment     |

Periksa resolved project dan environment sebelum mengedit test. Source code yang sama bisa punya arti berbeda saat base URL, storage state, locale, atau device profile-nya berubah.

## Review hasil buatan AI

Review generated configuration baris demi baris:

- Policy apa yang diekspresikan setiap option?
- Test dan directory mana yang akan ditemukan?
- Bisakah missing value diam-diam memilih environment yang salah?
- Apakah setiap project sesuai supported condition atau known risk?
- Berapa total execution yang dibuat project matrix?
- Apakah project name bermakna di report?
- Apakah timeout increase didukung evidence?
- Apakah setup membuat shared mutable state?
- Bisakah secret masuk source, log, trace, screenshot, atau storage state?
- Apakah setting ini local runner default, project variant, atau keputusan CI trigger/gate?
- Apakah AI mengarang device, environment, command, reporter, atau credential strategy yang belum disetujui team?

Minta perhitungan test matrix dan resolved assumption, bukan cuma configuration snippet. Valid syntax masih bisa menyimpan policy yang buruk.

## Coba cek pemahamanmu

Generated configuration mendefinisikan tiga browser, tiga device, dua locale, dua role, serta staging dan production project. Semuanya memakai global test timeout 120 detik dan fallback ke production URL saat `BASE_URL` nggak ada. Team punya 300 test.

Risk dan cost apa yang perlu kamu angkat saat review? Bagaimana kamu menguranginya menjadi intentional first policy? Untuk setiap keputusan, siapa owner-nya: test, fixture, local configuration, atau CI?

## Bandingkan dengan cara pikir ini

Salah satu review yang masuk akal:

- Hentikan run saat target URL nggak ada; jangan pernah silently fallback ke production.
- Hitung 36 proposed variant dan 10.800 execution sebelum retry.
- Tentukan primary supported browser dan small set of scenarios yang perlu browser, device, locale, atau role coverage lain.
- Pisahkan production testing, minta explicit authorization, buat read-only saat sesuai, lalu lindungi dengan data dan safety policy sendiri.
- Kembalikan global timeout ke evidence-based budget dan investigasi genuinely slow operation secara lokal.
- Beri setiap retained project nama report yang bermakna dan documented reason.
- Pastikan authentication state dan secret diberikan secara aman, nggak dicommit, dan nggak masuk attachment.

Configuration pertama nggak perlu memodelkan semua future condition. Yang penting, current test contract menjadi explicit dan aman.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menjelaskan apa yang masuk ke test, fixture, dan configuration; mendefinisikan intentional project; serta mereview environment, timeout, dan secret policy sebelum suite berjalan.

Optional lesson berikutnya membahas advanced fixture composition. Lewati dulu kalau suite-mu belum benar-benar butuh configurable option, worker-owned resource, atau automatic diagnostic behavior.
