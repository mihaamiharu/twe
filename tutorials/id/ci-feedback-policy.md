---
title: 'Rancang Feedback, Coverage, dan Evidence Policy'
description: 'Pilih apa yang berjalan dan kapan, simpan evidence yang menjelaskan failure, lalu ubah CI result menjadi owned team decision.'
---

## Setelah lesson ini, kamu bisa

- memilih risk-based test portfolio untuk pull request, merge, deployment, dan schedule;
- menjustifikasi browser serta device coverage tanpa melipatgandakan semua kombinasi;
- membedakan clean pass, flaky retry pass, failed test, dan infrastructure failure;
- memilih report dan artifact berdasarkan diagnostic value, cost, serta privacy; dan
- menentukan merge gate, triage ownership, serta safe scaling lewat worker atau shard.

## Kenapa ini penting buat QA

Pipeline bisa berjalan sempurna tapi feedback-nya tetap buruk. Kalau semua test dijalankan di semua browser pada setiap change, result mungkin baru muncul setelah engineer selesai review. Kalau yang tersimpan cuma pass count, nggak ada cukup evidence untuk investigasi. Kalau retry success dianggap clean, instability hilang dari team decision.

Tujuan CI bukan maximum execution. Tujuannya memberi evidence tepat waktu untuk menjawab:

> Apakah change ini cukup aman untuk lanjut, dan kalau tidak, siapa yang punya evidence untuk bertindak?

Itulah kenapa coverage, artifact, retry, dan gate sebenarnya satu feedback policy—bukan setting tool yang berdiri sendiri.

## Cara berpikir yang perlu kamu pegang

Rancang feedback contract dari risk sampai action:

```text
Change atau release trigger
        ↓
Risk-selected scenarios dan projects
        ↓
Controlled execution
        ↓
Verdict + diagnostic evidence
        ↓
Named owner dan next action
```

![CI feedback contract bergerak dari trigger ke risk-selected portfolio, controlled execution, verdict dan diagnostic evidence, lalu named owner serta action.](/images/tutorials/ci-feedback-contract.svg)

_Fast feedback tanpa useful evidence cuma noise. Detailed evidence yang datang terlalu telat juga bukan feedback yang bagus._

Setiap policy menyeimbangkan empat concern:

| Concern       | Pertanyaan                                                       |
| ------------- | ---------------------------------------------------------------- |
| Risk          | Failure mana yang penting pada trigger ini?                      |
| Speed         | Seberapa cepat team harus tahu?                                  |
| Diagnosis     | Evidence apa yang membedakan product, test, dan infrastructure?  |
| Cost dan care | Berapa execution/storage yang justified, dan data apa yang aman? |

## Coba kita bedah contoh nyata

Sebuah online store terutama mendukung desktop Chrome. Firefox juga didukung, sedangkan mobile checkout high risk tapi lebih jarang berubah. Suite punya 300 test, termasuk 18 critical smoke scenario.

### 1. Buat trigger portfolio

Jangan mulai dari semua project yang tersedia. Mulai dari decision yang harus didukung setiap trigger:

| Trigger          | Risk-selected execution                                   | Alasannya                                              |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Pull request     | 18 smoke scenario di desktop Chromium                     | Fast signal sebelum review dan merge                   |
| Merge ke main    | Affected feature/regression di Chromium; smoke di Firefox | Broader confidence tanpa full multiplication           |
| Nightly schedule | Full stable suite di supported browser portfolio          | Mendeteksi compatibility dan accumulated regression    |
| Deployment ready | Small safe smoke set terhadap deployed target             | Memastikan deployment wiring dan critical availability |

Tag dan project mengimplementasikan policy ini; keduanya nggak menentukan policy. Setiap scenario berlabel `@smoke` harus benar-benar melindungi release-relevant risk.

Kalau product nggak mendukung WebKit atau device tertentu, menjalankan semua test di sana belum tentu useful coverage. Kalau payment behavior high risk pada satu mobile viewport, pilih flow dan condition tersebut secara intentional.

### 2. Tentukan arti setiap result

Dengan satu CI retry, Playwright membedakan:

| Result                          | Artinya untuk team                                           |
| ------------------------------- | ------------------------------------------------------------ |
| Lulus pada first attempt        | Clean pass untuk execution ini                               |
| Gagal pertama, lulus saat retry | Flaky signal; instability masih ada                          |
| Gagal di semua attempt          | Persistent failure yang perlu triage                         |
| Job gagal sebelum test berjalan | Pipeline/environment failure; product status belum diketahui |

Salah satu possible configuration:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

Contoh ini membuat flaky retry tetap menggagalkan CI signal. Team boleh mulai dengan melaporkan flakiness tanpa blocking sambil membangun ownership, lalu memperketat gate. Rule pentingnya: “lulus setelah retry” nggak boleh diam-diam berubah menjadi “clean.”

`trace: 'on-first-retry'` menangkap detailed evidence dari retry, tapi first failed attempt kadang justru punya state paling berguna. Tergantung failure pattern dan storage budget, `retain-on-failure` bisa lebih tepat. Pilih dengan deliberate.

### 3. Simpan evidence yang menjawab pertanyaan

| Evidence             | Pertanyaan yang bisa dijawab                                    | Cost atau risk                                     |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Terminal/line report | Test/project mana yang gagal lebih dulu?                        | Detail rendah                                      |
| HTML report          | Step, project, retry, dan attachment mana yang saling terkait?  | Harus diupload dan access-controlled               |
| Trace                | Apa yang terjadi di action, DOM, console, dan network?          | Bisa berisi sensitive session dan application data |
| Screenshot           | Apa yang terlihat pada satu moment?                             | Sequence terbatas; bisa mengekspos personal data   |
| Video                | Bagaimana visible sequence berjalan?                            | Storage lebih tinggi; DOM/network detail lemah     |
| Safe setup log       | Apakah environment, authentication, atau test-data setup gagal? | Secret dan token harus diredact                    |

Jangan simpan semua artifact selamanya. Tentukan siapa yang boleh mengakses, berapa lama evidence masih berguna, dan apa yang perlu disanitasi sebelum dibagikan ke AI atau keluar team.

### 4. Tentukan gate dan owner

Practical pull-request policy bisa berbunyi:

```text
Block merge saat:
- required smoke project gagal;
- smoke test menjadi flaky; atau
- pipeline nggak bisa membangun tested environment.

Triage owner:
- product behavior mismatch → feature team + QA evidence;
- locator/test logic defect → automation owner;
- unavailable runner/environment → platform owner;
- unclear classification → QA mulai dari first meaningful failure.
```

Quarantine adalah temporary workflow dengan owner, reason, dan exit condition. Quarantine bukan folder untuk membuang unreliable test sampai dilupakan.

### 5. Scale hanya setelah isolation bisa dipercaya

Tambah worker di satu runner kalau resource dan test data mendukung concurrency. Pakai sharding saat large isolated suite butuh beberapa CI machine:

```bash
npx playwright test --shard=1/4
```

Setiap shard menghasilkan sebagian result. Gunakan blob reporter dan `npx playwright merge-reports` kalau team butuh satu combined report. Sharding suite yang masih share account atau record hanya melipatgandakan collision pressure; sharding nggak memperbaiki isolation.

## Kapan pendekatan ini cocok dipakai?

Pakai small smoke gate saat quick failure bisa mengubah merge decision. Tambahkan broader scheduled coverage untuk supported variant yang terlalu mahal dijalankan pada setiap change. Trigger deployed smoke hanya setelah deployment ready dan scenario aman untuk environment itu.

Gunakan retry untuk mengekspos intermittent behavior dan menyimpan evidence, bukan untuk membuat result terlihat hijau. Pakai `failOnFlakyTests` saat team siap memperlakukan flaky retry sebagai blocking quality signal.

Pakai trace saat failure membutuhkan action, DOM, console, atau network timeline. Pakai video hanya kalau visible sequence memberi informasi yang nggak tersedia di trace atau screenshot. Simpan setup log untuk failure sebelum browser scenario.

Jangan shard small suite. Jangan tambah project hanya karena Playwright mendukungnya. Jangan jalankan destructive test terhadap production tanpa explicit authorization, safe data, dan purpose yang sangat terbatas.

## Kalau gagal, mulai cek dari mana?

| Observation                                     | Policy failure                                      | Better repair                                         |
| ----------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Result datang setelah review selesai            | Pull-request portfolio terlalu luas                 | Lindungi critical risk dulu; pindahkan broad coverage |
| Retry membuat intermittent failure jadi hijau   | Flaky outcome nggak terlihat atau nggak digate      | Report/own flakiness; periksa failed-attempt evidence |
| Failure report nggak punya trace atau setup log | Artifact policy nggak cocok dengan failure layer    | Simpan evidence yang membedakan hypothesis            |
| CI cost naik lebih cepat dari scenario value    | Browser/device/role dimension dikalikan sembarangan | Pilih kombinasi dari supported user dan risk          |
| Shard lulus terpisah tanpa full result          | Report nggak dimerge atau gate hanya shard-local    | Merge blob report dan buat satu final gate            |
| Artifact mengekspos customer atau credential    | Retention/access/sanitization policy unsafe         | Restrict, redact, kurangi retention, rotate secret    |
| Quarantined list terus bertambah                | Nggak ada owner atau exit condition                 | Tentukan repair deadline dan track original risk      |

Kalau gate noisy, jangan melemahkan semua assertion atau retry seluruh job. Cari signal mana yang nggak trustworthy, lalu repair test, environment, atau policy contract-nya.

## Review hasil buatan AI

Review AI-generated CI strategy dengan pertanyaan ini:

- Decision apa yang didukung setiap trigger?
- Product risk mana yang layak mendapat smoke label?
- Apakah browser/device matrix sesuai actual support dan risk?
- Berapa total test execution dari proposal ini?
- Apakah retry pass dilaporkan sebagai flaky, bukan clean?
- Artifact mana yang menjelaskan setiap likely failure layer?
- Bisakah artifact mengekspos credential, cookie, personal data, atau internal URL?
- Apakah setiap merge blocker punya triage owner?
- Apakah quarantine punya reason dan exit condition?
- Apakah sharding justified oleh measured runtime dan safe isolation?
- Apakah AI mengarang coverage requirement atau release policy yang belum disepakati team?

Minta AI menghitung runtime multiplication dan menulis assumption-nya. Large matrix bisa terlihat menyeluruh padahal feedback-nya justru lebih buruk.

## Coba cek pemahamanmu

Sebuah team menjalankan 300 test di Chromium, Firefox, WebKit, tiga device, dan dua role pada setiap pull request. Dua retry aktif, retry pass dilaporkan hijau, dan hanya screenshot yang diupload. Result butuh 90 menit, jadi engineer sering merge sebelum selesai.

Rancang trigger, coverage, retry, evidence, dan ownership policy yang lebih berguna. Sebutkan product fact apa yang masih kamu butuhkan sebelum policy difinalkan.

## Bandingkan dengan cara pikir ini

Salah satu direction yang masuk akal:

- Identifikasi small release-relevant smoke set dan jalankan di primary supported desktop condition pada pull request.
- Tambahkan hanya high-risk role/device variant ke fast gate tersebut.
- Jalankan broader supported-browser regression setelah merge atau lewat schedule.
- Laporkan retry pass sebagai flaky; tentukan owner dan apakah current smoke flakiness blocking.
- Simpan trace atau equivalent timeline untuk failure, ditambah safe setup log untuk pre-browser failure.
- Hitung reduced execution count dan ukur apakah result sekarang datang sebelum merge decision.
- Tambahkan sharding hanya kalau remaining broad suite sudah isolated dan masih terlalu lambat.
- Tanyakan ke product dan analytics browser, device, serta role mana yang benar-benar supported dan business-critical.

Targetnya bukan lebih sedikit testing. Targetnya evidence yang datang pada waktu yang tepat untuk known risk.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mengubah reproducible CI run menjadi explicit feedback policy yang mencakup trigger, risk-selected project, retry, artifact, gate, dan ownership.

Capstone berikutnya meminta kamu menerapkan policy mindset itu pada satu focused checkout risk, lalu menjelaskan apa yang dibuktikan in-platform Practice—dan apa yang masih perlu dibuktikan real project sebelum benar-benar ship.
