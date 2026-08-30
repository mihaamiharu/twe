---
title: 'Capstone: Perbaiki Checkout Test dan Jelaskan Batas Hasilnya'
description: 'Review checkout test buatan AI, perbaiki locator, action, wait, dan assertion-nya, lalu jelaskan apa yang sudah diverifikasi Practice dan apa yang masih perlu dilakukan di project nyata.'
---

## Setelah lesson ini, kamu bisa

- mengubah satu risiko checkout menjadi recovery scenario yang fokus;
- mereview code buatan AI untuk menemukan masalah locator, action, waiting, assertion, dan error handling;
- memilih struktur code paling sederhana yang tetap mudah dirawat;
- menjelaskan keputusan dari Module 1–9 yang diterapkan dalam test yang sudah diperbaiki; serta
- membedakan apa yang diverifikasi in-platform Practice dari hal yang masih perlu dijalankan di CI project nyata.

## Kenapa ini penting buat QA

Capstone nggak menguji berapa banyak Playwright method yang kamu hafal. Di sini kamu perlu mereview test yang belum bisa dipercaya, menjaga product risk yang ingin diuji, memperbaiki asumsi yang salah, lalu menjelaskan hasil apa yang benar-benar diverifikasi.

AI bisa menghasilkan test yang berjalan tetapi tetap salah. Selector berdasarkan struktur DOM bisa memilih control yang keliru, forced click bisa melewati masalah actionability, fixed wait hanya menunda failure, dan assertion di dalam `try/catch` bisa membuat test terlihat pass meskipun checkout rusak.

Di akhir path ini, kamu perlu menghasilkan test yang hasilnya bisa dijelaskan dan dipercaya, bukan framework panjang yang sulit ditelusuri.

## Cara berpikir yang perlu kamu pegang

Capstone ini menggabungkan semua keputusan penting dalam satu alur:

```text
Product risk yang jelas
  + starting state yang terkontrol
  + action yang sesuai cara user berinteraksi
  + expected result yang bisa diverifikasi
  + test bisa dijalankan sendiri dan mudah di-debug
  + struktur code yang mudah dirawat
  + cara menjalankan test yang konsisten
  + batasan yang dijelaskan
  = hasil automation yang bisa dipercaya
```

Kalau salah satu bagian hilang, test yang terlihat pass bisa membuat kita mengira coverage-nya lebih kuat daripada kondisi yang sebenarnya diuji.

Capstone menghubungkan seluruh path lewat empat bagian:

| Bagian yang diperiksa                 | Keputusan dari module sebelumnya                                        |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Risiko dan design scenario            | Memilih scenario yang layak dan assertion yang tepat                    |
| Cara test berinteraksi dengan UI      | Inspect DOM, memilih locator, menjalankan action, dan menunggu hasil    |
| Test tetap stabil dan mudah dirawat   | Isolation, debugging, dan abstraction secukupnya                        |
| Cara test dijalankan dan dipakai team | CI yang konsisten, coverage, artifact, merge gate, dan penanggung jawab |

Baris keempat hanya menjadi bahan review dalam capstone ini. Practice menjalankan dan mengecek behavior di browser, tetapi nggak menjalankan workflow CI atau menilai cara team menangani failure. Bagian tersebut tetap perlu diperiksa di repository nyata.

## Coba kita bedah contoh nyata

Product rule-nya:

> Quantity minimal 1. Setelah memperbaiki quantity yang invalid, customer bisa place order dan melihat quantity yang sudah dikonfirmasi.

Ini adalah satu recovery scenario karena invalid input dan perbaikannya terjadi dalam flow serta starting state yang sama:

```text
Starting state: checkout page baru tanpa confirmation
Action 1: submit quantity 0
Expected result 1: validation alert menjelaskan minimum quantity; confirmation belum muncul
Action 2: perbaiki quantity menjadi 2 lalu submit lagi
Expected result 2: alert sebelumnya hilang; confirmation menampilkan 2 items
```

Starter buatan AI sengaja dibuat lemah:

```ts
test('checkout', async ({ page }) => {
  await page.goto('/app/checkout.html');
  await page.locator('main > form > input').fill('2');
  await page.locator('main > form > button').click({ force: true });
  await page.waitForTimeout(1000);

  try {
    expect(await page.locator('.message').textContent()).toBeTruthy();
  } catch {
    console.log('ignore intermittent checkout issue');
  }
});
```

Review masalahnya sebelum menulis ulang:

| Masalah yang terlihat              | Dampaknya pada test                                        | Cara memperbaiki                                           |
| ---------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Title hanya `checkout`             | Report nggak menjelaskan behavior yang sedang diuji        | Gunakan title yang menjelaskan recovery outcome            |
| Selector `main > form`             | Perubahan struktur DOM merusak test meskipun behavior sama | Gunakan label dan role yang sesuai                         |
| Hanya quantity `2` yang dimasukkan | Minimum-quantity rule nggak pernah diuji                   | Submit quantity invalid sebelum memperbaikinya             |
| `{ force: true }`                  | Test melewati actionability check tanpa alasan             | Gunakan click biasa dan cek kenapa element belum ready     |
| `waitForTimeout(1000)`             | Test hanya menunggu waktu, bukan hasil dari aplikasi       | Gunakan web-first assertion pada alert dan status          |
| `textContent()` + `toBeTruthy()`   | Pesan apa pun yang nggak kosong bisa membuat test pass     | Cek validation message dan confirmed quantity secara exact |
| `try/catch` menelan assertion      | Checkout yang rusak masih bisa dilaporkan pass             | Biarkan assertion yang fail membuat test ikut fail         |

### Tentukan locator dan expected result sebelum menulis code final

```text
Locator:
- Pilih Quantity field dari label-nya.
- Pilih Place order dari button role dan name.
- Cari validation dan confirmation lewat alert/status semantic.

Expected result:
- Alert menampilkan minimum rule yang exact setelah invalid submit.
- Alert nggak terlihat lagi setelah quantity diperbaiki.
- Confirmation terlihat dan mengandung “2 items”.

Jangan sembunyikan failure dengan:
- fixed sleep;
- `force` tanpa alasan;
- `evaluate` atau mengubah DOM secara langsung;
- assertion yang hanya mengecek truthy; atau
- error yang ditelan oleh `try/catch`.
```

Perbaikan lengkap dikerjakan di Core Practice yang terhubung dengan lesson ini. Practice mengecek urutan dua kali submit, state setelah setiap submit, final DOM state, dan Playwright method yang wajib digunakan. Nama variable boleh berbeda selama behavior dan expected result-nya sama.

### Pilih struktur code yang paling sederhana

Satu scenario nggak otomatis membutuhkan page object, fixture framework, atau banyak folder. Test yang jelas dengan beberapa locator bernama bisa menjadi pilihan terbaik.

Pindahkan code ke helper atau component object hanya kalau step yang sama memang berulang dan biasanya berubah bersama. Validation dan recovery step tetap perlu terlihat di test. Jelaskan masalah maintenance yang diselesaikan oleh helper atau object tersebut.

### Bedakan yang dicek Practice dan yang perlu dilakukan di project nyata

In-platform Practice bisa menjalankan behavior di browser, mengecek urutan submit dari invalid input sampai recovery, memeriksa final page state, dan memastikan Playwright method yang diwajibkan sudah digunakan. Practice nggak bisa menjalankan GitHub Actions job nyata, menilai perubahan `playwright.config.ts`, meng-upload trace, atau menilai alasan pemilihan browser yang ditulis learner. Karena itu, Practice belum menunjukkan bahwa test sudah siap dikirim lewat CI.

Untuk melanjutkannya sebagai portfolio di project nyata, sediakan juga:

- local dan CI command yang bisa dijalankan ulang;
- trigger serta pilihan browser dan project beserta alasannya;
- satu artifact dari failed run atau kumpulan diagnostic yang setara;
- catatan singkat tentang root cause dari masalah pada starter;
- batasan test suite dan product risk berikutnya yang paling penting; serta
- hasil run yang menunjukkan scenario pass saat dijalankan sendiri, berulang kali, dan dengan parallelism yang memang akan digunakan.

Jangan bilang platform sudah memverifikasi CI, browser coverage, atau artifact kalau bagian tersebut memang belum dijalankan.

## Kapan pendekatan ini cocok dipakai?

Gunakan recovery scenario ketika customer memang harus bisa memperbaiki input yang ditolak lalu melanjutkan flow. Pisahkan menjadi test yang berbeda kalau behavior valid dan invalid membutuhkan starting state yang berbeda, mengubah data yang berbeda, atau punya arti failure yang berbeda.

Jaga scope capstone cukup kecil supaya setiap keputusan bisa dijelaskan. Satu flow yang diuji secara lengkap lebih berguna daripada sepuluh script hasil copy-paste.

Gunakan page atau component object ketika ada bagian UI stabil yang dipakai berulang. Gunakan fixture ketika test membutuhkan resource dengan setup, scope, dan cleanup sendiri. Jangan menambah architecture hanya untuk terlihat lebih lengkap di rubric.

Gunakan in-platform Practice untuk mengecek perbaikan code dan behavior di browser. Gunakan repository serta CI provider nyata untuk mengecek runner, deployment, secret, browser coverage, dan artifact. Simulated browser challenge nggak bisa memastikan semua bagian tersebut sudah dikonfigurasi dengan aman.

## Kalau gagal, mulai cek dari mana?

| Result yang terlihat baik                | Bagian yang belum dicek                                          | Cara mengecek atau memperbaiki                                 |
| ---------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Confirmation muncul setelah quantity `2` | Urutan invalid submit lalu recovery mungkin belum dijalankan     | Cek invalid state sebelum quantity diperbaiki                  |
| Assertion method ada di code             | Assertion bisa berada di dalam error yang ditelan                | Hapus `catch` dan jalankan versi test yang sengaja dibuat fail |
| Test pass satu kali                      | State, urutan, atau timing mungkin belum stabil                  | Jalankan berulang kali, sendiri, dan pada kondisi target       |
| Code dibagi menjadi beberapa class       | Class bisa menyembunyikan behavior tanpa mempermudah maintenance | Hubungkan setiap helper atau object ke pengulangan nyata       |
| Browser challenge pass                   | Target CI, secret, coverage, dan artifact belum diperiksa        | Jalankan kelanjutannya di repository nyata                     |
| Test pass saat retry                     | Failure pada attempt pertama masih menunjukkan flakiness         | Buka artifact attempt pertama dan perbaiki root cause          |

Jangan melemahkan rubric hanya karena code buatan AI sulit diperbaiki. Jangan menambahkan sleep, forced action, `catch` yang terlalu luas, atau global timeout hanya supaya test pass.

## Review hasil kerja dengan bantuan AI

Sebelum menerima code buatan AI, cek:

- Product risk apa yang diuji secara exact?
- Apakah starting state terkontrol dan nggak bergantung pada test lain?
- Apakah locator memilih control sesuai cara user berinteraksi atau attribute yang memang dijaga stabil?
- Apakah setiap action menunggu expected result dari aplikasi?
- Apakah setiap assertion akan fail ketika regression yang penting terjadi?
- Apakah error dibiarkan membuat test fail dengan trace atau log yang berguna?
- Apakah `force`, retry, timeout, atau conditional menyembunyikan masalah yang belum dijelaskan?
- Apakah helper atau object baru menyelesaikan code berulang yang memang perlu dirawat di satu tempat?
- Bisakah scenario berjalan sendiri, berulang kali, dan di project yang memang dituju?
- Bagian CI, browser coverage, artifact, dan security mana yang belum diperiksa oleh platform?
- Bisakah kamu menjelaskan setiap baris penting tanpa bertanya lagi ke AI?

Bantuan AI boleh digunakan, tetapi reviewer tetap bertanggung jawab memastikan hasil test dan penjelasannya akurat.

## Coba cek pemahamanmu

Seseorang memperbaiki starter dengan mengganti selector dan menghapus fixed wait. Dia tetap memakai `{ force: true }`, hanya memastikan confirmation terlihat, lalu menyebut capstone selesai karena test pass dua kali di browser challenge.

Review kesimpulan tersebut. Jelaskan apa yang sudah diverifikasi test, bagian mana yang masih lemah, dan apa yang masih perlu dijalankan di project nyata.

## Bandingkan dengan cara pikir ini

Salah satu review yang masuk akal:

- Locator berdasarkan label dan role membuat test memilih control sesuai cara user berinteraksi, dan menghapus fixed wait membuat test menunggu perubahan dari aplikasi.
- Forced click yang belum dijelaskan masih melewati actionability check. Hapus `force` atau cari penyebab element nggak siap menerima click.
- Visibility saja belum mengecek minimum-quantity rule atau quantity yang dikonfirmasi.
- Recovery scenario perlu mengecek validation message secara exact, memastikan alert hilang, dan memastikan confirmation berisi `2 items`.
- Dua run yang pass memang berguna, tetapi belum mengecek stability pada parallel run atau kemampuan menjalankan test dari CI runner baru.
- Browser challenge belum mengecek workflow configuration, target URL, keamanan secret, browser coverage, penyimpanan artifact, atau penanggung jawab triage.
- Selesaikan Core Practice, lalu siapkan bagian tersebut secara terpisah kalau ingin menampilkan portfolio dari project nyata.

Kesimpulan akhirnya harus spesifik: Practice memverifikasi recovery sequence di browser, tetapi belum memverifikasi CI delivery atau cara team menangani failure.

## Sebelum lanjut

Sekarang kamu seharusnya bisa me-review dan memperbaiki checkout recovery test, menjelaskan alasan pemilihan locator, assertion, dan struktur code, lalu membedakan behavior yang diverifikasi platform dari bagian yang masih perlu dijalankan di project nyata.

Module ini selesai setelah tiga Core lesson dan satu Core Practice `pw-capstone-checkout` selesai. TWE mencatat Web Automation path selesai setelah semua Core lesson dan Core Practice di Module 1–9 selesai. Optional lesson dan Additional Practice nggak memblokir status tersebut. Supaya benar-benar siap dipakai, bawa keputusan ini ke repository yang memang boleh kamu gunakan, lalu jalankan dan cek CI, artifact, environment, serta cara team menangani failure secara langsung.
