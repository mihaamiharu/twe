---
title: 'Apa yang Bisa—dan Nggak Bisa—Dilakukan Otomasi Web'
description: 'Kenali apa yang bisa dibuktikan otomasi browser, apa yang tetap butuh pertimbangan QA, dan kenapa script selalu dimulai dari tujuan test yang jelas.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa yang bisa dilakukan otomasi web dan bagian yang tetap membutuhkan pertimbangan manusia;
- mengubah skenario manual menjadi risiko, kondisi awal, aksi pengguna, dan hasil yang bisa diamati;
- membedakan melakukan aksi dengan membuktikan bahwa aplikasi bekerja dengan benar; dan
- menemukan konteks atau asumsi yang hilang dari ide test buatan AI sebelum meminta kode.

Kamu belum perlu paham HTML, JavaScript, atau Playwright. Di lesson ini, kita fokus ke keputusan testing yang harus jelas sebelum mulai membahas tool.

## Kenapa ini penting buat QA

Pernah nggak sih kamu dapat test case yang kelihatannya sederhana seperti ini?

> Tambahkan produk ke keranjang dan pastikan semuanya bekerja.

Pas dikerjakan manual, kamu mungkin bisa langsung menyesuaikan. Produk mana yang harus dipakai? Keranjangnya harus kosong atau boleh sudah berisi? Kalau produknya habis, apa yang harus dilakukan? Dan sebenarnya, apa arti “semuanya bekerja”?

Sebagai manusia, kita bisa melihat situasi, menyadari ada yang aneh, lalu mengambil keputusan. Script nggak bisa melakukan itu sendiri. Script hanya mengikuti kondisi, aksi, dan pemeriksaan yang kita tulis—termasuk kalau asumsi kita ternyata salah.

Akibatnya, sebuah test bisa selalu lulus padahal membuktikan hal yang salah. Test juga bisa kadang lulus dan kadang gagal karena kondisi awalnya nggak pernah dikendalikan.

Jadi, otomasi bukan sekadar memindahkan langkah test case manual ke dalam kode. Kita perlu membuat tujuan testing-nya eksplisit dan bisa diulang.

## Cara berpikir yang perlu kamu pegang

Sebelum memikirkan selector atau kode, pecah dulu tujuan test menjadi empat bagian:

1. **Risiko:** Kegagalan penting apa yang ingin kita deteksi?
2. **Kondisi awal dan data:** Apa yang harus sudah benar supaya test bisa diulang dengan hasil yang konsisten?
3. **Aksi pengguna:** Apa yang dilakukan pengguna untuk memicu perilaku tersebut?
4. **Bukti yang bisa diamati:** Hasil apa yang membuktikan bahwa aplikasi memberikan outcome, atau hasil akhir, yang diharapkan?

![Rangkaian tujuan otomasi: risiko, kondisi awal dan data yang diketahui, aksi pengguna, lalu bukti yang bisa diamati.](/images/tutorials/automation-intent-chain.svg)

_Kalau salah satu bagian belum jelas, investigasi dulu sebelum membuat otomasi._

Ada dua model lain yang nanti akan sering kamu temui. Keduanya berhubungan, tapi fungsinya berbeda.

**Arrange–Act–Assert** menjelaskan struktur test:

- **Arrange:** siapkan kondisi dan data yang dibutuhkan;
- **Act:** lakukan perilaku yang sedang diuji;
- **Assert:** buktikan hasil yang diharapkan.

**Locate–Interact–Observe** menjelaskan tanggung jawab di dalam browser test:

- cari kontrol atau informasi yang relevan bagi pengguna;
- lakukan interaksi dengan halaman ketika dibutuhkan;
- amati state aplikasi yang menjadi bukti.

Test nyata bisa mencari, berinteraksi, dan mengamati beberapa hal. Jadi, jangan paksa setiap test menjadi tepat tiga baris. Model ini membantu kita memisahkan tanggung jawab, bukan menjadi template syntax.

## Coba kita bedah contoh nyata

Sekarang kita perjelas skenario keranjang tadi.

| Bagian                  | Rumusan yang lebih jelas                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Risiko                  | Pelanggan menambahkan produk yang tersedia, tetapi keranjang nggak diperbarui dengan benar.          |
| Kondisi awal dan data   | Pelanggan aktif sudah login, keranjang kosong, dan tersedia satu produk dengan harga yang diketahui. |
| Aksi pengguna           | Pelanggan menambahkan satu unit produk tersebut ke keranjang.                                        |
| Bukti yang bisa diamati | Keranjang menampilkan produk yang benar, jumlah `1`, dan subtotal yang tepat.                        |

Dari sini mulai kelihatan bedanya. “Tambahkan produk dan pastikan bekerja” tadi terlalu kabur. Setelah dipecah, anggota tim bisa meninjau tujuannya bahkan sebelum ada kode.

Developer bisa mempertanyakan setup datanya. Product owner bisa mengoreksi outcome yang diharapkan. QA lain juga bisa melihat apakah risiko yang dipilih memang cukup penting.

## Kapan pendekatan ini cocok dipakai?

Gunakan cara berpikir ini setiap kali kamu mau membuat atau meninjau test otomatis—baik ditulis sendiri, dibuat bersama tim, maupun dihasilkan AI.

Otomasi paling berguna saat kita membutuhkan pengulangan yang konsisten. Tapi bukan berarti testing oleh manusia jadi nggak penting.

| Otomasi berguna untuk                                              | Testing oleh manusia tetap berguna untuk                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Mengulang pemeriksaan penting yang sama                            | Mengeksplorasi perilaku yang belum kita pahami                       |
| Menjalankan skenario yang sudah dikenal pada browser yang didukung | Menemukan pengalaman yang membingungkan, janggal, atau nggak terduga |
| Memeriksa hasil yang jelas secara konsisten                        | Menentukan risiko baru yang paling penting                           |
| Menghasilkan bukti kegagalan yang bisa diulang                     | Beradaptasi saat produk berperilaku mengejutkan                      |

Keduanya saling melengkapi. Otomasi menjaga perilaku yang sudah dikenal, sementara testing manual dan eksploratori membantu kita menemukan informasi baru.

## Kalau gagal, mulai cek dari mana?

Salah satu kesalahan yang sering terjadi adalah test berhenti setelah melakukan aksi:

```text
Klik Tambahkan ke keranjang → test selesai
```

Nah, masalahnya, klik hanya meminta browser melakukan sesuatu. Klik nggak membuktikan bahwa keranjang sudah diperbarui, subtotal sudah dihitung dengan benar, atau data sudah tersimpan.

Kalau test seperti ini lulus tetapi bug tetap lolos, mulai periksa bagian akhirnya:

1. Outcome bisnis apa yang seharusnya dibuktikan?
2. Bukti apa yang benar-benar diperiksa oleh test?
3. Bisakah test lulus meskipun aplikasi masih salah?

Perbaikannya bukan menambah delay atau menjalankan test berkali-kali. Perbaikannya adalah menambahkan bukti yang bermakna:

```text
Tambahkan satu produk → keranjang menampilkan produk, jumlah, dan subtotal yang diharapkan
```

Nanti saat belajar Playwright, kamu akan mengenalnya sebagai perbedaan antara **action** dan **assertion**. Action meminta browser melakukan sesuatu. Assertion membuktikan kondisi yang muncul setelahnya.

## Review hasil buatan AI

AI bisa membantu merapikan catatan, menunjukkan asumsi yang hilang, atau membuat beberapa alternatif skenario. Tapi AI nggak tahu risiko produk, batasan data, atau business rule kalau kita nggak memberikannya.

Di tahap ini, minta AI membuat **tujuan otomasi**, bukan langsung membuat script besar. Contohnya:

```text
Bantu saya menyusun kandidat otomasi UI web. Jangan tulis kode.

Risiko produk: pelanggan mungkin melihat subtotal keranjang yang salah.
Kondisi yang diketahui: pelanggan sudah login, keranjang kosong,
dan ada satu produk dengan harga yang dikendalikan.
Aksi pengguna: tambahkan satu unit ke keranjang.

Temukan asumsi yang belum disebutkan dan usulkan bukti yang bisa diamati.
```

Setelah AI menjawab, jangan langsung menerimanya. Review dengan pertanyaan QA:

- Apakah risikonya masih sama dengan yang ingin kita uji?
- Apakah AI mengarang perilaku produk atau test data?
- Apakah semua kondisi awal sudah ditulis dengan jelas?
- Bisakah bukti yang diusulkan lulus padahal perilaku bisnisnya masih salah?
- Bagian mana yang perlu dikonfirmasi ke requirement atau anggota tim?

AI boleh membantu menyusun cara berpikir. Keputusan akhirnya tetap ada di kamu dan tim.

## Coba cek pemahamanmu

Coba bayangin kamu menerima skenario manual ini:

> Buka halaman “Lupa password,” masukkan alamat email, kirim form, lalu pastikan semuanya bekerja.

Sebelum lanjut, coba tulis:

1. Risiko yang ingin dilindungi
2. Kondisi awal dan test data yang dibutuhkan
3. Aksi pengguna
4. Bukti yang benar-benar menunjukkan outcome

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- **Risiko:** pelanggan terdaftar nggak bisa memulai proses pemulihan akun.
- **Kondisi awal dan data:** tersedia akun yang bisa dipulihkan dan inbox yang dikendalikan oleh test.
- **Aksi pengguna:** meminta reset password untuk akun tersebut melalui halaman Lupa Password.
- **Bukti yang bisa diamati:** UI mengonfirmasi permintaan tanpa membocorkan apakah sembarang akun terdaftar. Kalau pengiriman email termasuk dalam cakupan (scope) test, inbox yang dikendalikan juga menerima pesan reset yang bisa digunakan.

Jawabanmu bisa berbeda, tergantung requirement produknya. Hal terpenting adalah kamu bisa menjelaskan keputusan scope dan bukti yang dipilih.

## Sebelum lanjut

Pastikan kamu sudah bisa mengambil skenario manual yang kabur lalu menjelaskan risikonya, kondisi awalnya, aksi penggunanya, dan bukti yang benar-benar menunjukkan keberhasilan.

Kalau tujuan test masih belum jelas, jangan buru-buru masuk ke kode. Pembuatan kode yang cepat hanya akan menghasilkan test yang kabur dengan lebih cepat.

Di lesson berikutnya, kita akan memakai mental model ini untuk memilih skenario mana yang memang layak diotomasi dan menentukan feedback layer yang paling tepat.
