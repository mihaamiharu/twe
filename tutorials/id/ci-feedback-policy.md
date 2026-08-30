---
title: 'Tentukan Test yang Berjalan dan Artifact yang Disimpan di CI'
description: 'Pilih scenario untuk setiap trigger, bedakan clean pass dengan flaky retry, lalu tentukan merge gate dan siapa yang menangani failure.'
---

## Setelah lesson ini, kamu bisa

- memilih scenario berdasarkan product risk untuk pull request, merge, deployment, dan schedule;
- memilih browser serta device coverage tanpa menjalankan semua kombinasi;
- membedakan clean pass, flaky retry, test yang terus fail, dan infrastructure failure;
- memilih report dan artifact berdasarkan kebutuhan debugging, biaya, dan data yang mungkin tersimpan; serta
- menentukan merge gate, penanggung jawab triage, dan kapan worker atau shard memang dibutuhkan.

## Kenapa ini penting buat QA

Pipeline bisa menjalankan semua step dengan benar tapi tetap memberi feedback yang buruk. Kalau semua test dijalankan di semua browser pada setiap change, hasilnya mungkin baru muncul setelah engineer selesai review. Kalau yang tersimpan hanya jumlah test pass dan fail, team nggak punya trace atau log untuk investigasi. Kalau test yang pass setelah retry dianggap clean, flakiness hilang dari report.

CI perlu memberi hasil tepat waktu untuk menjawab:

> Apakah change ini cukup aman untuk di-merge atau dirilis? Kalau nggak, siapa yang harus mengecek dan artifact apa yang tersedia?

Karena itu, pilihan coverage, artifact, retry, dan gate harus saling mendukung keputusan yang sama.

## Cara berpikir yang perlu kamu pegang

Mulai dari trigger, lalu tentukan tindakan setelah result keluar:

```text
Trigger change atau release
        ↓
Scenario dan project yang dipilih berdasarkan risiko
        ↓
Test dijalankan dengan setup yang terkontrol
        ↓
Status test + artifact untuk debugging
        ↓
Penanggung jawab + tindakan berikutnya
```

![CI dimulai dari trigger, memilih scenario dan project berdasarkan risiko, menjalankan test, menyimpan status serta artifact debugging, lalu menentukan penanggung jawab dan tindakan berikutnya.](/images/tutorials/ci-feedback-contract.svg)

_Hasil cepat tanpa artifact yang membantu debugging akan sulit ditindaklanjuti. Artifact lengkap juga kurang berguna kalau baru tersedia setelah keputusan merge dibuat._

Setelah membaca hasilnya, penanggung jawab bisa memperbaiki code, memperbaiki environment, atau mengambil keputusan release. Dashboard yang nggak menghasilkan tindakan hanya menyimpan riwayat failure.

Module 8 membahas cara membuat Playwright project, fixture, dan configuration. Lesson ini menentukan project mana yang berjalan untuk setiap trigger dan bagaimana team memperlakukan hasilnya.

Pertimbangkan empat hal berikut:

| Pertimbangan       | Pertanyaan                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| Risiko             | Failure mana yang perlu diketahui pada trigger ini?                               |
| Kecepatan          | Kapan hasilnya harus tersedia agar masih bisa mengubah keputusan?                 |
| Debugging          | Artifact apa yang membedakan masalah product, test, dan infrastructure?           |
| Biaya dan keamanan | Berapa banyak run dan storage yang masuk akal, serta data apa yang aman disimpan? |

## Coba kita bedah contoh nyata

Sebuah online store terutama mendukung desktop Chrome. Firefox juga didukung. Mobile checkout punya product risk tinggi, tetapi flow-nya lebih jarang berubah. Test suite punya 300 test, termasuk 18 critical smoke scenario.

### 1. Pilih test untuk setiap trigger

Jangan langsung menjalankan semua project. Tentukan dulu keputusan apa yang perlu dibuat dari setiap trigger:

| Trigger          | Test yang dijalankan                                          | Alasannya                                                     |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Pull request     | 18 smoke scenario di desktop Chromium                         | Memberi hasil cepat sebelum review dan merge                  |
| Merge ke main    | Test untuk feature yang berubah di Chromium; smoke di Firefox | Mengecek integration tanpa menjalankan semua kombinasi        |
| Nightly schedule | Full stable suite di semua browser yang didukung              | Menemukan compatibility issue dan regression yang terkumpul   |
| Deployment ready | Sedikit smoke test yang aman terhadap deployment              | Memastikan deployment bisa diakses dan critical flow tersedia |

Tag dan project hanya digunakan untuk menjalankan pilihan tadi. Setiap scenario dengan label `@smoke` harus mengecek risiko yang memang bisa memengaruhi release.

Kalau product nggak mendukung WebKit atau device tertentu, menjalankan semua test di sana belum tentu berguna. Kalau payment flow punya risiko tinggi pada satu mobile viewport, pilih flow dan viewport tersebut secara khusus.

Playwright device project mengemulasikan viewport, user agent, dan touch. Hasilnya nggak sama dengan menjalankan test di physical device dan operating system aslinya. Gunakan real-device lab atau provider kalau perbedaan tersebut termasuk product risk. Jangan jalankan destructive test di production tanpa tujuan, authorization, dan aturan test data yang jelas.

### 2. Tentukan arti setiap result

Dengan satu CI retry, Playwright membedakan:

| Result                               | Artinya untuk team                                                |
| ------------------------------------ | ----------------------------------------------------------------- |
| Test pass pada attempt pertama       | Clean pass untuk run tersebut                                     |
| Test fail lalu pass saat retry       | Test flaky; penyebab intermittent masih ada                       |
| Test fail pada semua attempt         | Failure tetap terjadi dan perlu triage                            |
| Job fail sebelum test mulai berjalan | Masalah pipeline atau environment; status product belum diketahui |

Salah satu configuration yang bisa digunakan:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
```

Contoh ini membuat test yang flaky tetap menyebabkan CI fail. Team bisa mulai dengan melaporkan flakiness tanpa memblokir merge sambil menentukan siapa yang memperbaikinya, lalu memperketat gate. Test yang pass setelah retry nggak boleh dilaporkan sebagai clean pass.

`trace: 'on-first-retry'` merekam retry pertama. Mode ini nggak otomatis menyimpan attempt awal yang fail. Kalau kamu perlu melihat attempt awal tersebut, atau retry akhirnya pass, `retain-on-failure` merekam setiap run dan menyimpan attempt yang fail. Pilih mode berdasarkan jenis failure yang ingin di-debug dan storage yang tersedia.

### 3. Simpan artifact yang membantu debugging

| Report atau artifact | Pertanyaan yang bisa dijawab                                         | Biaya atau risiko                                              |
| -------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Terminal/line report | Test atau project mana yang fail lebih dulu?                         | Detail terbatas                                                |
| HTML report          | Step, project, retry, dan attachment mana yang saling berkaitan?     | Perlu di-upload dan aksesnya harus dibatasi                    |
| Trace                | Apa yang terjadi pada action, DOM, console, dan network?             | Bisa berisi session dan data aplikasi yang sensitif            |
| Screenshot           | Apa yang terlihat pada satu waktu?                                   | Nggak menunjukkan seluruh urutan dan bisa memuat personal data |
| Video                | Bagaimana urutan yang terlihat di UI berjalan?                       | Membutuhkan lebih banyak storage; detail DOM/network terbatas  |
| Setup log yang aman  | Apakah environment, authentication, atau test-data setup bermasalah? | Secret dan token harus dihapus dari log                        |

HTML report menggabungkan step, project, retry, dan attachment dari satu run dalam report yang bisa dibuka. Untuk run yang memakai sharding, gunakan blob reporter lalu gabungkan setiap potongan sebelum report dibagikan ke team. Jangan simpan semua artifact selamanya. Tentukan siapa yang boleh mengaksesnya, berapa lama artifact disimpan, dan data apa yang perlu dihapus sebelum dibagikan ke AI atau keluar team.

### 4. Tentukan merge gate dan penanggung jawab

Aturan untuk pull request bisa ditulis seperti ini:

```text
Blokir merge ketika:
- smoke project yang wajib dijalankan fail;
- smoke test menjadi flaky; atau
- pipeline nggak bisa menyiapkan environment untuk test.

Penanggung jawab triage:
- behavior product nggak sesuai expected result → feature team dan QA;
- locator atau logic test salah → automation owner;
- runner atau environment nggak tersedia → platform owner;
- penyebab belum jelas → QA mulai dari failure pertama yang menjelaskan masalah.
```

Quarantine adalah solusi sementara yang punya penanggung jawab, alasan, dan kondisi agar test bisa dikeluarkan dari quarantine. Simpan artifact dari failure awal dan catat risiko yang seharusnya dicek test tersebut. Jangan ubah quarantine menjadi silent skip atau tempat menyimpan unreliable test tanpa rencana perbaikan.

### 5. Scale hanya setelah isolation bisa dipercaya

Tambah worker dalam satu runner kalau resource dan test data aman digunakan secara parallel. Gunakan sharding ketika test suite yang sudah isolated masih membutuhkan beberapa CI machine:

```bash
bunx playwright test --shard=1/4
```

Setiap shard menghasilkan sebagian result. Gunakan blob reporter dan `bunx playwright merge-reports` untuk membuat satu report gabungan. Kalau beberapa test masih memakai account atau record yang sama, sharding justru memperbesar kemungkinan collision. Perbaiki isolation sebelum menambah shard.

## Kapan pendekatan ini cocok dipakai?

Gunakan smoke gate kecil ketika failure perlu diketahui sebelum merge. Jalankan coverage yang lebih luas lewat schedule untuk browser atau device yang terlalu mahal dicek pada setiap change. Jalankan deployment smoke setelah deployment ready dan scenario aman untuk environment tersebut.

Gunakan retry untuk menemukan behavior yang intermittent dan menyimpan artifact dari attempt yang fail. Jangan gunakan retry hanya untuk membuat result terlihat hijau. Aktifkan `failOnFlakyTests` ketika team siap memblokir merge jika smoke test menjadi flaky.

Gunakan trace kalau debugging membutuhkan urutan action, perubahan DOM, console, atau network. Gunakan video hanya ketika urutan yang terlihat di UI memberi informasi tambahan yang nggak tersedia di trace atau screenshot. Simpan setup log untuk masalah yang terjadi sebelum browser scenario dimulai.

Jangan gunakan sharding untuk test suite kecil. Jangan menambah project hanya karena Playwright mendukungnya. Jangan menjalankan destructive test terhadap production tanpa authorization, test data yang aman, dan tujuan yang sangat terbatas.

## Kalau gagal, mulai cek dari mana?

| Yang terjadi                                                | Kemungkinan penyebab                                      | Perbaikan                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Result baru tersedia setelah review selesai                 | Terlalu banyak test berjalan pada pull request            | Jalankan critical smoke lebih dulu; pindahkan coverage luas             |
| Retry membuat intermittent failure terlihat hijau           | Flaky retry dilaporkan sebagai clean pass                 | Tampilkan status flaky, tentukan owner, dan cek attempt yang fail       |
| Failure report nggak punya trace atau setup log             | Artifact yang disimpan nggak sesuai jenis failure         | Simpan trace untuk browser failure dan log untuk setup failure          |
| Biaya CI naik lebih cepat daripada scenario yang dilindungi | Browser, device, dan role dikombinasikan tanpa seleksi    | Pilih kombinasi dari user yang didukung dan product risk                |
| Setiap shard pass tetapi nggak ada result gabungan          | Report belum digabung atau gate hanya mengecek satu shard | Gabungkan blob report dan buat satu final gate                          |
| Artifact mengekspos data customer atau credential           | Akses, sanitasi, atau retention artifact nggak aman       | Batasi akses, hapus data sensitif, kurangi retention, dan rotate secret |
| Daftar test dalam quarantine terus bertambah                | Nggak ada penanggung jawab atau batas waktu perbaikan     | Tentukan deadline dan catat risiko yang nggak lagi dicek                |

Kalau merge gate terlalu sering memberi hasil yang salah, jangan melemahkan semua assertion atau mengulang seluruh job. Cari test atau bagian environment yang nggak bisa dipercaya, lalu perbaiki penyebabnya.

## Review hasil kerja dengan bantuan AI

Review rancangan CI buatan AI dengan pertanyaan berikut:

- Keputusan apa yang perlu dibuat dari setiap trigger?
- Product risk mana yang layak mendapat smoke label?
- Apakah kombinasi browser dan device sesuai dengan product yang benar-benar didukung?
- Berapa total test execution yang akan dibuat?
- Apakah test yang pass setelah retry dilaporkan sebagai flaky?
- Artifact apa yang tersedia untuk setiap jenis failure yang mungkin terjadi?
- Bisakah artifact mengekspos credential, cookie, personal data, atau internal URL?
- Apakah setiap kondisi yang memblokir merge punya penanggung jawab triage?
- Apakah setiap test dalam quarantine punya alasan dan kondisi untuk dikeluarkan?
- Apakah hasil pengukuran runtime memang menunjukkan sharding dibutuhkan, dan apakah test sudah isolated?
- Apakah AI mengarang coverage requirement atau aturan release yang belum disepakati team?

Minta AI menghitung total test execution dan menulis setiap asumsi yang digunakan. Kombinasi besar bisa terlihat lengkap, padahal hasilnya datang terlalu lambat untuk memengaruhi keputusan merge.

## Coba cek pemahamanmu

Sebuah team menjalankan 300 test di Chromium, Firefox, WebKit, tiga device, dan dua role pada setiap pull request. Dua retry aktif, test yang pass setelah retry dilaporkan hijau, dan hanya screenshot yang di-upload. Result membutuhkan 90 menit, sehingga engineer sering merge sebelum selesai.

Rancang pilihan trigger, coverage, retry, artifact, dan penanggung jawab yang lebih berguna. Sebutkan informasi product apa yang masih dibutuhkan sebelum keputusan tersebut bisa dibuat.

## Bandingkan dengan cara pikir ini

Salah satu pendekatan yang masuk akal:

- Pilih sedikit smoke scenario yang bisa memengaruhi release, lalu jalankan di desktop browser utama pada pull request.
- Tambahkan hanya role atau device dengan product risk tinggi ke fast gate tersebut.
- Jalankan regression yang lebih luas di semua browser yang didukung setelah merge atau lewat schedule.
- Laporkan test yang pass setelah retry sebagai flaky. Tentukan penanggung jawab dan apakah flakiness pada smoke test memblokir merge.
- Simpan trace untuk failure di browser, ditambah setup log yang aman untuk failure sebelum browser test dimulai.
- Hitung jumlah test execution yang baru dan ukur apakah result tersedia sebelum keputusan merge.
- Tambahkan sharding hanya kalau test suite yang lebih luas sudah isolated dan masih terlalu lambat.
- Tanyakan kepada product dan analytics browser, device, serta role mana yang benar-benar didukung dan penting untuk bisnis.

Testing baru membantu keputusan kalau result tersedia tepat waktu dan scenario yang dijalankan memang mengecek product risk yang relevan.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menentukan scenario dan project yang berjalan pada setiap trigger, cara memperlakukan retry, artifact yang disimpan, kondisi yang memblokir merge, dan siapa yang menangani failure.

Capstone berikutnya meminta kamu menerapkan keputusan tersebut pada satu risiko checkout. Kamu juga akan menjelaskan apa yang bisa diverifikasi melalui in-platform Practice dan apa yang masih perlu dilakukan di project nyata sebelum test siap digunakan.
