---
title: 'Assertions (Langkah "Verify")'
description: 'Nentuin sukses dan gagal dengan validasi status aplikasi.'
---

> **Intinya:** Assertions adalah cara kita nentuin tes itu sukses atau gagal dengan cara ngecek status aplikasinya secara otomatis.

## 1. Logika Assertion

Pas *manual testing*, kamu ngelakuin aksi terus pake mata kamu buat mastiin hasilnya bener. Di otomatisasi, kamu harus kasih tau *tool*-nya secara gamblang seperti apa sih kondisi yang disebut "Sukses" itu.

Sebuah *assertion* biasanya ngikutin pola ini:

`[Kondisi Aktual] + [Perbandingan] + [Kondisi Ekspektasi]`

* **Contoh:** `[URL Saat Ini]` (Aktual) + `[Harus Sama Dengan]` (Perbandingan) + `["/dashboard"]` (Ekspektasi).

---

## 2. Jenis-Jenis Assertions

Di dunia profesional, kita bagi pengecekan jadi beberapa kategori tergantung apa yang mau divalidasi:

### A. State Assertions (Cek Status)

Mastiin kondisi elemen abis kita ngelakuin sesuatu.

* `IsVisible`: Pesan suksesnya muncul nggak?
* `IsEnabled`: Tombol "Submit" sekarang udah bisa diklik belum?
* `IsChecked`: *Checkbox*-nya beneran kecentang nggak abis diklik?

### B. Content Assertions (Cek Isi)

Ngecek data atau tulisan di dalem elemen.

* `ToHaveText`: Tulisan di *header*-nya beneran "Selamat Datang" nggak?
* `ToContain`: Pesan error-nya ada kata "Salah"-nya nggak?
* `ToHaveValue`: Kolom inputnya beneran nyimpen email yang tadi kita ketik nggak?

### C. Navigation Assertions (Cek Posisi)

Ngecek di halaman mana kita sekarang.

* `ToHaveURL`: Udah pindah ke halaman login belum?
* `ToHaveTitle`: Nama halaman di tab browser udah bener belum?

---

## 3. Web-First (Auto-Retrying) Assertions

Ini konsep paling penting di *tools* modern kayak Playwright.

Dulu, tes itu sering banget "flaky" (labil; kadang sukses, kadang gagal) gara-gara script-nya terlalu cepet ngecek sementara halamannya masih *loading*. *Assertion* modern itu sifatnya **Asynchronous**. Artinya, mereka nggak cuma ngecek sekali terus nyerah. Mereka bakal nunggu dan ngecek ulang selama beberapa detik (biasanya 5 detik) sampe kondisinya pas.

![Web-First Assertion Diagram](/images/tutorials/assertion-web-first.png)

* **Jebakannya:** Kalo kamu cuma pake pengecekan matematika biasa (kayak `a == b` di JavaScript) bukannya pake fungsi bawaan *tool* automation-nya, dia nggak bakal mau nunggu. Dia bakal langsung "ngambek" (gagal) detik itu juga kalo elemennya belum muncul.
* **Aturannya:** Selalu pake fungsi *assertion* yang emang didesain buat nungguin elemen web.

---

## 4. Positive vs. Negative Assertions

Tes yang bagus itu nggak cuma ngecek apa yang **harus ada**, tapi juga apa yang **nggak boleh ada**.

* **Positif:** "Tombol Login harus kelihatan."
* **Negatif:** "Pesan Error **nggak boleh** kelihatan."

> [!WARNING]
> **Peringatan QA:** Hati-hati sama *Negative Assertions*. Kalo tes kamu "Lulus" karena sebuah elemen nggak kelihatan, pastiin itu karena elemennya emang beneran ilang, bukan karena kamu salah nulis *selector*-nya!

---

## 5. Anti-Pattern (Hal yang Jangan Dilakuin)

### Tes "Ompong" (The Empty Test)

Script yang login, klik-klik banyak tombol, terus beres gitu aja tanpa ada pengecekan satu pun.

* **Bahayanya:** Tes ini bakal selalu kelihatan "Ijo" (Lulus) selama websitenya nggak *crash*, padahal bisa aja datanya salah total tapi nggak ketauan karena nggak ada yang verifikasi.

### Salah Kaprah "Soft Assertions"

*Soft Assertion* itu ngebolehin tes tetep jalan terus biarpun ada yang gagal.

* **Risikonya:** Kalo kamu pake ini buat hal kritikal (misal: gagal login tapi tes tetep maksa lanjut), sisa langkah tesnya cuma buang-buang waktu. Pake *soft assertion* cuma buat cek visual yang nggak terlalu penting aja.

---

## Checklist Rangkuman

1. **Tentukan Goal:** Apa satu hal paling krusial yang ngebuktiin langkah ini berhasil? (URL berubah? Teks muncul?)
2. **Pake Web-First Logic:** Biar *tool* kamu sabar nungguin halaman *loading* sebelum mutusin gagal.
3. **Cek Negatif:** Pastiin hal-hal yang harusnya ilang (kayak *loading spinner*) beneran udah ilang.
4. **Satu Tes, Satu Tujuan:** Jangan bikin "Tes Gado-gado". Tiap tes harus fokus ngebuktiin satu alur fungsional yang jelas.

---

## 6. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi

* **[Playwright Assertions](https://playwright.dev/docs/test-assertions)**: Panduan buat pengecekan otomatis yang "sabar" nunggu.
* **[Jest Expect API](https://jestjs.io/docs/expect)**: Playwright menggunakan API yang kompatibel dengan Jest. Ini kamus lengkap buat segala jenis pengecekan (misal: cek angka lebih besar dari, dll).
