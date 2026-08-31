---
title: 'Apa yang Bisa dan Nggak Bisa Diverifikasi lewat Web UI Automation'
description: 'Pahami apa yang bisa diverifikasi lewat browser automation dan kapan QA judgment tetap dibutuhkan.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa yang bisa dilakukan web automation dan bagian yang tetap membutuhkan pertimbangan manusia.
- memetakan skenario manual menjadi product risk, initial state, aksi user, dan expected result yang bisa diverifikasi.
- membedakan antara melakukan aksi dan memverifikasi bahwa aplikasi merespons dengan benar
- menemukan konteks atau asumsi yang hilang dari ide test buatan AI sebelum generate code.

Kamu belum perlu paham HTML, JavaScript, atau Playwright. Di lesson ini, kita fokus ke keputusan testing yang harus jelas sebelum mulai membahas tool.

## Kenapa ini penting buat QA

Pernah nggak sih kamu dapat test case yang kelihatannya sederhana seperti ini?

> Tambahkan produk ke keranjang dan pastikan semuanya bekerja.

Pas dikerjakan manual, kamu mungkin bisa langsung menyesuaikan. Produk mana yang harus dipakai? Keranjangnya harus kosong atau boleh sudah ada barangnya? Kalau produknya habis, apa yang harus dilakukan? Tapi sebenarnya, hasil seperti apa yang dianggap benar?

Sebagai manusia, kita bisa melihat situasi, menyadari ada yang aneh, lalu mengambil keputusan. Automation script nggak bisa melakukan itu sendiri. Script hanya mengikuti starting state, user action, dan evidence yang kita tulis—termasuk kalau asumsi kita ternyata salah.

Akibatnya, sebuah test bisa selalu lulus padahal membuktikan hal yang salah. Test juga bisa kadang lulus dan kadang gagal karena starting state-nya nggak pernah dikendalikan.
Contohnya, test untuk cart hanya mengecek apakah halaman cart terbuka setelah user klik **Add to cart**. Test tersebut bisa selalu pass, tapi belum membuktikan bahwa produk, quantity, dan subtotal yang benar benar-benar masuk ke cart.

Contoh lain, test bisa flaky karena menganggap cart selalu kosong, padahal state tersebut nggak pernah di-reset sebelum test dijalankan.

Jadi, otomasi bukan sekadar memindahkan langkah test case manual ke dalam kode. Kita perlu membuat tujuan testing-nya eksplisit dan bisa diulang.

## Cara berpikir yang perlu kamu pegang

Sebelum memikirkan locator atau kode, pecah dulu automation intent menjadi empat bagian:

1. **Product risk:** Kegagalan penting apa yang ingin kita deteksi?
2. **Starting state dan test data:** Apa yang harus sudah benar supaya test bisa diulang dengan hasil yang konsisten?
3. **User action:** Apa yang dilakukan user hingga behavior yang ingin diuji terjadi?
4. **Observable evidence:** Outcome apa yang membuktikan bahwa aplikasi memberikan expected outcome?

![Automation intent chain: product risk, starting state dan test data yang diketahui, user action, lalu observable evidence.](/images/tutorials/automation-intent-chain.svg)

_Kalau salah satu bagian belum jelas, investigasi dulu sebelum membuat otomasi._

Ada dua model lain yang nanti akan sering kamu temui. Keduanya berhubungan, tapi fungsinya berbeda.

**Arrange–Act–Assert** menjelaskan struktur test:

- **Arrange:** siapkan kondisi dan data yang dibutuhkan;
- **Act:** lakukan perilaku yang sedang diuji;
- **Assert:** buktikan hasil yang diharapkan.

**Locate–Interact–Observe** menjelaskan tanggung jawab di dalam browser test:

- cari kontrol atau informasi yang relevan bagi pengguna;
- lakukan interaksi dengan halaman ketika dibutuhkan;
- amati kondisi aplikasi yang menunjukkan bahwa expected outcome tercapai.

Dalam praktiknya, satu automated test bisa mencari, berinteraksi, dan mengamati beberapa hal. Jadi, jangan paksa setiap test mengikuti pola starting state → user action → observable evidence secara kaku. Model ini membantu kita memisahkan tanggung jawab, bukan menjadi format baku untuk menulis test.

## Coba kita bedah contoh nyata

Sekarang kita perjelas skenario keranjang tadi.

| Bagian                       | Rumusan yang lebih jelas                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Product risk                 | Pelanggan menambahkan produk yang tersedia, tetapi keranjang nggak diperbarui dengan benar.          |
| Starting state dan test data | Pelanggan aktif sudah login, keranjang kosong, dan tersedia satu produk dengan harga yang diketahui. |
| User action                  | Pelanggan menambahkan satu unit produk tersebut ke keranjang.                                        |
| Observable evidence          | Keranjang menampilkan produk yang benar, jumlah `1`, dan subtotal yang tepat.                        |

Dari sini mulai kelihatan bedanya. “Tambahkan produk dan pastikan bekerja” tadi terlalu kabur. Setelah dipecah, anggota tim bisa meninjau tujuannya bahkan sebelum ada kode.

Developer bisa mempertanyakan setup datanya. Product owner bisa mengoreksi outcome yang diharapkan. QA lain juga bisa melihat apakah risiko yang dipilih memang cukup penting.

## Kapan pendekatan ini cocok dipakai?

Gunakan cara berpikir ini setiap kali kamu mau membuat atau meninjau test otomatis—baik ditulis sendiri, dibuat bersama tim, maupun dihasilkan AI.

Web automation paling berguna saat kita membutuhkan pengulangan yang konsisten. Tapi bukan berarti manual dan exploratory testing jadi nggak penting.

| Web automation berguna untuk                                       | Manual dan exploratory testing tetap berguna untuk                   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Mengulang pemeriksaan penting yang sama                            | Mengeksplorasi perilaku yang belum kita pahami                       |
| Menjalankan skenario yang sudah dikenal pada browser yang didukung | Menemukan pengalaman yang membingungkan, janggal, atau nggak terduga |
| Memeriksa hasil yang jelas secara konsisten                        | Menentukan risiko baru yang paling penting                           |
| Menghasilkan bukti kegagalan yang bisa diulang                     | Beradaptasi saat produk berperilaku mengejutkan                      |

Keduanya saling melengkapi. Web automation menjaga perilaku yang sudah dikenal, sementara manual dan exploratory testing membantu kita menemukan informasi baru.

## Kalau gagal, mulai cek dari mana?

Salah satu kesalahan yang sering terjadi adalah test berhenti setelah melakukan aksi:

```text
Klik Tambahkan ke keranjang → test selesai
```

Nah, masalahnya, klik hanya meminta browser melakukan sesuatu. Klik nggak membuktikan bahwa keranjang sudah diperbarui, subtotal sudah dihitung dengan benar, atau data sudah tersimpan.

Kalau test seperti ini passed tetapi bug tetap lolos, mulai periksa bagian akhirnya:

1. Business outcome apa yang seharusnya dibuktikan?
2. Evidence apa yang benar-benar diperiksa oleh test?
3. Bisakah test passed meskipun aplikasi masih salah?

Perbaikannya bukan menambah delay atau menjalankan test berkali-kali. Perbaikannya adalah menambahkan meaningful evidence:

```text
Tambahkan satu produk → keranjang menampilkan produk, jumlah, dan subtotal yang diharapkan
```

Nanti saat belajar Playwright, kamu akan mengenalnya sebagai perbedaan antara **action** dan **assertion**. Action meminta browser melakukan sesuatu. Assertion membuktikan kondisi yang muncul setelahnya.

## Review hasil kerja dengan bantuan AI

AI bisa membantu merapikan catatan, menunjukkan asumsi yang hilang, atau membuat beberapa alternatif skenario. Tapi AI nggak tahu product risk, batasan data, atau business rule kalau kita nggak kasih konteksnya. misalnya apa yang ingin diuji, data apa yang tersedia, dan behavior seperti apa yang seharusnya terjadi.

Di tahap ini, minta AI menyusun **automation intent**, bukan langsung membuat automation script lengkap. Contohnya:

```text
Bantu saya menyusun web UI automation candidate. Jangan tulis kode.

Product risk: pelanggan mungkin melihat subtotal keranjang yang salah.
Known starting state: pelanggan sudah login, keranjang kosong,
dan ada satu produk dengan harga yang sudah diatur.
User action: tambahkan satu unit ke keranjang.

Temukan asumsi yang belum disebutkan dan usulkan bukti apa yang perlu diverifikasi
```

Setelah AI menjawab, jangan langsung menerimanya. Review dengan pertanyaan QA:

- Apakah product risk-nya masih sama dengan yang ingin kita uji?
- Apakah AI mengarang perilaku produk atau test data?
- Apakah semua starting state sudah ditulis dengan jelas?
- Bisakah evidence yang diusulkan lulus padahal perilaku bisnisnya masih salah?
- Bagian mana yang perlu dikonfirmasi ke requirement atau anggota tim?

AI boleh membantu menyusun cara berpikir. Keputusan akhirnya tetap ada di kamu dan tim.

## Coba cek pemahamanmu

Coba bayangin kamu menerima skenario manual ini:

> Buka halaman “Lupa password,” masukkan alamat email, kirim form, lalu pastikan semuanya bekerja.

Sebelum lanjut, coba tulis:

1. Product risk yang ingin dilindungi
2. Starting state dan test data yang dibutuhkan
3. User action
4. Observable evidence yang benar-benar menunjukkan outcome

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- **Product risk:** customer yang sudah terdaftar nggak bisa memulai proses account recovery.
- **Starting state dan test data:** tersedia account yang bisa di-reset dan inbox yang bisa diakses oleh test.
- **User action:** meminta reset password untuk account tersebut melalui halaman Forgot Password.
- **Observable evidence:** UI mengonfirmasi request tanpa membocorkan apakah account tersebut terdaftar atau tidak. Kalau pengiriman email termasuk dalam scope test, inbox yang digunakan untuk testing juga menerima reset email yang valid dan bisa digunakan.

Jawabanmu bisa berbeda, tergantung requirement produknya. Hal terpenting adalah kamu bisa menjelaskan keputusan scope dan evidence yang dipilih.

## Sebelum lanjut

Pastikan kamu sudah bisa melihat sebuah manual test scenario yang masih belum jelas, lalu menentukan product risk, starting state dan test data, user action, serta observable evidence yang dibutuhkan.

Kalau tujuan test masih belum jelas, jangan buru-buru masuk ke kode. Pembuatan kode yang cepat hanya akan menghasilkan test yang kabur dengan lebih cepat.

Di lesson berikutnya, kita akan memakai mental model ini untuk memilih skenario mana yang memang layak diotomasi dan menentukan feedback layer yang paling tepat.
