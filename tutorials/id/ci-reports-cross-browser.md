---
title: 'Reproduce Test System di CI'
description: 'Ubah local Playwright run menjadi CI execution contract yang bersih, explicit, dan mudah didiagnosis.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan input yang dibutuhkan clean CI runner sebelum browser test bisa dipercaya;
- merancang minimal pipeline yang menginstal locked dependency dan compatible browser;
- memilih apakah CI menjalankan owned application atau menargetkan validated deployment;
- membuat configuration dan secret explicit tanpa mengekspos value-nya; serta
- membedakan pipeline, environment, setup, product, dan test failure.

## Kenapa ini penting buat QA

Pernah nggak sih test-mu lulus di laptop, tapi langsung merah begitu masuk CI? Biasanya local machine memberikan assumption yang nggak dimiliki pipeline. Browser binary mungkin sudah terinstal, aplikasi masih hidup di terminal lain, environment value dibaca dari untracked file, atau sisa test data membuat scenario kebetulan lulus.

CI mulai dari kondisi yang lebih mirip blank machine. Pressure ini justru berguna. Dari sini kelihatan apakah engineer lain bisa membangun ulang test system yang sama hanya dari repository dan authorized input.

Green local test adalah evidence tentang satu machine. Trustworthy CI run adalah evidence bahwa test system bisa direkonstruksi secara deliberate.

## Cara berpikir yang perlu kamu pegang

Perlakukan CI sebagai reproducibility contract:

```text
Same revision
  + explicit runtime dan locked dependencies
  + compatible browser dan system dependencies
  + explicit application target
  + controlled configuration dan test data
  + documented test command yang sama
  = comparable execution evidence
```

Pipeline punya beberapa layer. Failure di layer awal bisa membuat test error setelahnya terlihat misleading:

| Layer                   | Pertanyaan yang harus dijawab                                    |
| ----------------------- | ---------------------------------------------------------------- |
| Source                  | Exact revision mana yang sedang berjalan?                        |
| Toolchain               | Runtime, package lock, dan Playwright version mana yang dipakai? |
| Browser environment     | Apakah required browser dan OS library sudah terinstal?          |
| Application target      | Apakah aplikasi yang benar sudah ready dan bisa dijangkau?       |
| Configuration dan state | Apakah required value ada dan precondition terkontrol?           |
| Test execution          | Command, project, dan scenario mana yang menghasilkan result?    |

Jangan klasifikasikan semua red pipeline sebagai product defect. Cari dulu layer mana yang rusak.

## Coba kita bedah contoh nyata

Checkout smoke test lulus di local. Team ingin menjalankannya pada setiap pull request terhadap aplikasi dari repository yang sama.

### 1. Buat application target explicit

Playwright configuration bisa memiliki local application lifecycle:

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

Policy ini berarti:

- tanpa `BASE_URL`, Playwright menjalankan owned application lalu menunggu URL-nya;
- dengan `BASE_URL`, run menargetkan aplikasi yang sudah dideploy; dan
- CI nggak diam-diam memakai process lain yang kebetulan hidup.

Kalau team nggak pernah menguji deployed target, hapus branch tersebut. Kalau selalu menguji deployment, validasi `BASE_URL` lalu hentikan run sebelum test saat value-nya nggak ada. Jangan memberi fallback yang bisa tanpa sengaja menargetkan production.

### 2. Reproduce install dan test command

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

Versi dan command di atas meniru Bun workflow repository ini. Di repository lain, ganti `1.3.4`, command lockfile, browser portfolio, dan test command sesuai deklarasi repository tersebut. Kalau project punya committed runtime file, jadikan itu sumber versi; jangan memakai moving runtime alias seolah-olah itu reproducibility guarantee.

Contoh minimal ini tidak memakai secret karena checkout smoke tidak membutuhkannya. Kalau authenticated test membutuhkan credential, berikan hanya lewat protected environment yang authorized atau disposable test-account mechanism. Fork pull request bisa tidak menerima secret, dan arbitrary pull-request code tidak boleh diberi production credential. Job ini memakai read-only repository permission, durasinya dibatasi, dan diagnostics tetap disimpan setelah test failure.

### 3. Baca failure evidence berdasarkan layer

Coba bayangin job tadi gagal. Mulai dari first meaningful message:

| Observation                    | First hypothesis                                  | Evidence yang diperiksa                         |
| ------------------------------ | ------------------------------------------------- | ----------------------------------------------- |
| `bun install --frozen-lockfile` menolak lockfile | Manifest dan lockfile nggak sinkron               | Install log dan committed lockfile              |
| Browser executable nggak ada   | Browser install step atau cache assumption salah  | Install command dan Playwright version          |
| `webServer` timeout            | App gagal start atau readiness URL salah          | App process log dan configured URL              |
| Semua test redirect ke sign-in | Secret atau authenticated state nggak ada/invalid | Safe config validation dan authentication setup |
| Satu checkout assertion gagal  | Product, data, locator, atau expectation problem  | Test error, trace, network, dan owned test data |

Menaikkan test timeout nggak akan memperbaiki dependency install yang gagal atau aplikasi yang nggak bisa dijangkau.

## Kapan pendekatan ini cocok dipakai?

Jalankan small valuable suite pada pull request kalau feedback-nya bisa mengubah merge decision. Jalankan deployment smoke hanya setelah target ready dan test-data policy membuat execution aman.

Biarkan Playwright `webServer` memiliki local application saat repository punya reliable start command. Targetkan existing deployment kalau behavior bergantung pada deployment infrastructure atau integration configuration. Buat pilihannya explicit.

Pakai prebuilt Playwright container saat team butuh consistent Linux browser environment atau stable screenshot rendering. Pastikan Playwright version-nya compatible dengan project. Container tetap nggak menggantikan controlled data, secret, dan target validation.

Jangan copy workflow besar sebelum suite bisa dijalankan lewat satu documented local command. Jangan tambahkan cache sebelum uncached pipeline benar. Jangan taruh credential di workflow YAML, test title, log, trace, atau committed environment file. Anggap action tag sebagai contoh yang mudah dibaca; ikuti security policy organisasi kalau production workflow membutuhkan immutable commit-SHA pinning.

## Kalau gagal, mulai cek dari mana?

Label “CI-only flaky test” sering menyembunyikan cause yang berbeda:

| CI symptom                                  | Kemungkinan cause                                    | Underlying repair                                     |
| ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Gagal hanya saat resource pressure tinggi   | Runner CPU/memory atau local parallelism berlebih    | Ukur capacity; kurangi worker atau shard dengan aman  |
| UI berbeda dari local                       | Wrong revision, target, feature config, atau account | Catat dan validasi resolved execution input           |
| Browser launch gagal setelah upgrade        | Browser binary dan package version mismatch          | Install browser lewat project Playwright CLI          |
| Test mulai sebelum app usable               | Readiness check nggak mewakili usable application    | Perbaiki startup/readiness contract, bukan test sleep |
| Pipeline lulus tapi scenario penting hilang | Project, grep, atau discovery filter terlalu sempit  | Print dan review exact selected test portfolio        |

Simpan safe log dari setup layer selain browser artifact. Trace nggak bisa menjelaskan kenapa dependency installation belum pernah selesai.

## Review hasil buatan AI

Review AI-generated pipeline dengan pertanyaan ini:

- Apakah runtime, lockfile, dan command-nya benar-benar milik repository, dengan runtime version yang reproducible?
- Siapa yang menjalankan aplikasi, dan apa evidence bahwa aplikasi ready?
- Bisakah missing URL diam-diam memilih environment yang salah?
- Apakah browser package diinstal dari Playwright version project?
- Apakah action reference-nya current dan intentionally pinned sesuai security policy repository?
- Permission, variable, dan secret apa yang diterima job?
- Bisakah secret masuk log, screenshot, trace, atau report?
- Apakah workflow mengupload evidence setelah test failure?
- Apakah setiap step punya satu responsibility yang mudah didiagnosis?
- Apakah generated YAML mengarang script, project name, secret, atau deployment target?

Valid YAML belum membuktikan test system-nya valid. Jalankan setiap referenced command dan verifikasi setiap assumed input.

## Coba cek pemahamanmu

Generated workflow melakukan checkout repository, lalu langsung menjalankan `bun run test:e2e` dan retry seluruh job dua kali. Workflow nggak menginstal dependency atau Chromium, nggak menjalankan aplikasi, dan bergantung pada `BASE_URL` yang diset manual di satu self-hosted runner.

Redesign minimum reproducibility contract-nya. Tentukan input mana yang harus committed, mana yang disuplai secara secure, siapa yang memiliki application readiness, dan evidence apa yang harus bertahan setelah failure.

## Bandingkan dengan cara pikir ini

Salah satu design yang masuk akal:

- Checkout exact revision, set declared Bun version, lalu install dependency dari committed lockfile.
- Install browser yang dipilih dan system dependency lewat project Playwright CLI atau compatible pinned container.
- Jalankan owned application lewat `webServer`, atau wajibkan dan validasi explicit deployed target.
- Supply secret lewat authorized CI storage dan cegah value masuk artifact.
- Jalankan type-check dan focused test command yang sama dengan local workflow, dengan worker CI yang dikontrol untuk stability.
- Upload report dan diagnostic directory yang relevan saat test step gagal, dengan bounded retention period.
- Hapus whole-job retry; investigasi failing layer dan pakai test retry hanya lewat explicit policy.

Hasilnya nggak harus berupa workflow besar. Yang penting, nggak ada accidental prerequisite.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mengubah local Playwright command menjadi clean CI execution contract dan mendiagnosis system layer mana yang gagal.

Lesson berikutnya mengasumsikan execution sudah reproducible. Kita akan menentukan risk mana yang berjalan pada setiap trigger, evidence apa yang disimpan, dan bagaimana result berubah menjadi team action.
