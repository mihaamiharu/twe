---
title: 'Pilih dan Rumuskan Kandidat Otomasi yang Layak'
description: 'Nilai automation candidate, pilih feedback layer yang tepat, lalu rumuskan automation intent kecil yang repeatable.'
---

## Setelah lesson ini, kamu bisa

- menilai automation candidate berdasarkan product risk, repetition, controllability, observability, dan maintenance cost;
- menjelaskan apakah browser UI automation, test layer yang lebih rendah, atau manual dan exploratory testing memberikan feedback paling berguna;
- memperkecil alur pengguna yang panjang menjadi test yang lebih mudah didiagnosis;
- mendokumentasikan automation intent sebelum menulis kode; dan
- menemukan asumsi yang perlu diverifikasi dari rencana otomasi buatan AI.

## Kenapa ini penting buat QA

Pernah nggak sih kamu melihat backlog otomasi yang isinya hampir semua test case manual?

Kelihatannya produktif: makin banyak yang diotomasi, makin bagus. Padahal setiap test otomatis punya biaya yang terus berjalan. Tim harus menyiapkan state dan data, menjaga test tetap sesuai dengan produk, menyelidiki kegagalan, lalu memperbaruinya saat perilaku berubah.

Jadi, pertanyaannya bukan cuma:

> Apakah skenario ini bisa diotomasi?

Pertanyaan yang lebih berguna adalah:

> Apakah feedback dari test ini cukup bernilai dan cukup sering dibutuhkan sampai biaya pembuatan serta perawatannya terasa sepadan?

Memilih kandidat adalah keputusan engineering. Tujuannya bukan mengotomasi test case sebanyak mungkin, tetapi membangun feedback yang benar-benar membantu tim.

## Cara berpikir yang perlu kamu pegang

Nilai setiap automation candidate melalui enam lens berikut. Ini bukan rumus atau sistem skor otomatis. Pertanyaannya dipakai supaya trade-off yang tadinya tersembunyi jadi kelihatan.

| Lens                   | Pertanyaan                                                                 | Warning sign                                                                   |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Risk dan value         | Kegagalan penting apa yang akan dideteksi?                                 | Nggak ada yang bisa menjelaskan dampak kegagalannya.                           |
| Repetition             | Seberapa sering tim membutuhkan feedback ini?                              | Check kemungkinan besar cuma dijalankan sekali.                                |
| Controllability        | Bisakah state dan test data dibuat lalu di-reset?                          | Test bergantung pada data bersama, nggak terduga, atau harus disiapkan manual. |
| Observability          | Bisakah outcome dibuktikan dengan jelas?                                   | “Kelihatannya benar” menjadi satu-satunya evidence.                            |
| Change dan maintenance | Seberapa sering flow dan expectation-nya berubah?                          | Fitur masih berupa eksperimen yang berubah hampir setiap hari.                 |
| Need for browser       | Apakah behavior yang dilihat user memang harus dibuktikan melalui browser? | Browser menambah cost tanpa memberikan evidence tambahan.                      |

Automation candidate nggak harus punya kondisi yang sempurna. Misalnya, sebuah skenario punya product risk tinggi tetapi datanya belum bisa dikendalikan. Kesimpulannya belum tentu “jangan pernah diotomasi.” Bisa jadi tim perlu memperbaiki **testability**, yaitu kemudahan aplikasi untuk disiapkan, diamati, dan diuji, sebelum membuat test tersebut.

## Coba kita bedah contoh nyata

Coba lihat fitur login. Risiko yang sama bisa diuji dari beberapa sisi:

| Feedback layer                    | Pertanyaan yang dijawab                                                                         | Contoh                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Browser UI automation             | Bisakah pengguna menyelesaikan alur penting melalui halaman yang sebenarnya?                    | Pengguna mengirim form login valid lalu masuk ke area yang membutuhkan autentikasi. |
| API atau service-level automation | Apakah rule dan integrasi bekerja untuk banyak variasi data tanpa membuka halaman?              | Service menerima kredensial valid dan menolak kombinasi yang salah.                 |
| Unit atau component test          | Apakah logika kecil atau bagian UI yang terisolasi bekerja dengan cepat?                        | Fungsi validasi menangani format input dan nilai batas.                             |
| Manual atau exploratory testing   | Apakah ada risiko baru, perilaku membingungkan, atau pengalaman yang sulit dinilai oleh script? | Mengeksplorasi apakah pesan error membantu pengguna memperbaiki masalah.            |

Kamu nggak harus mengimplementasikan semua layer sendiri untuk memberi rekomendasi yang baik. Sebagai QA engineer, tugasmu adalah menjelaskan risikonya lalu berkolaborasi dengan tim untuk memilih tempat testing yang paling efektif.

Fitur login biasanya membutuhkan gabungan beberapa layer. Mungkin ada banyak service-level check, beberapa browser flow, security testing, dan exploratory session. Nggak ada satu layer yang harus “menang.” Yang kita cari adalah coverage gabungan yang berguna.

## Kapan pendekatan ini cocok dipakai?

Otomasi UI cocok ketika kita memang membutuhkan bukti dari sudut pandang pengguna dan interaksi antarbagian aplikasi di browser. Contohnya, memastikan tombol produk yang dilihat pengguna benar-benar memperbarui keranjang.

Kalau risikonya berupa ratusan kombinasi perhitungan pajak, browser mungkin bukan tempat utama. Kita bisa mendapatkan feedback yang lebih cepat dan lebih lengkap melalui API, service, atau unit test.

Kalau hasilnya sangat subjektif—misalnya “apakah desain baru terasa meyakinkan?”—manual dan exploratory testing tetap dibutuhkan.

Saat memilih otomasi UI, mulai dari alur kecil dengan satu tujuan yang jelas:

```text
Dengan pelanggan aktif dan satu produk yang tersedia
Ketika pelanggan menambahkan satu unit ke keranjang kosong
Maka keranjang menampilkan produk tersebut, jumlah 1, dan subtotal yang benar
```

Ini bukan berarti setiap test hanya boleh berisi satu klik. Maksudnya, setiap test harus punya alasan kegagalan yang terfokus dan konteks yang cukup untuk membantu debugging.

Setup seperti membuat pelanggan atau mereset keranjang nantinya bisa dilakukan lewat API atau fixture. Bagian UI sebaiknya fokus pada perilaku pengguna yang memang membutuhkan bukti dari browser.

### Tulis tujuan sebelum script

Automation intent record membantu QA, developer, dan stakeholder produk meninjau rencana test tanpa terjebak debat syntax.

```text
Skenario:
Risiko atau dampak bisnis:
Alasan mengotomasi—atau tidak:
Alasan memakai UI—atau layer lain:
Starting state dan test data:
User action:
Observable evidence untuk business outcome:
Risiko perawatan:
Asumsi buatan AI yang perlu diverifikasi:
```

Kalau bagian pentingnya belum jelas, investigasi dulu sebelum meminta script lengkap.

## Kalau gagal, mulai cek dari mana?

Salah satu jebakan yang sering terjadi adalah membuat satu test end-to-end yang terlalu panjang:

```text
Buat pelanggan → verifikasi email → atur profil → cari produk →
tambahkan produk → gunakan voucher → bayar → unduh invoice → hapus pelanggan
```

Begitu test gagal, penyebabnya bisa datang dari mana saja. Setup data lebih rumit, debugging lebih lama, dan perubahan pada fitur yang nggak berhubungan bisa menghalangi risiko yang sebenarnya ingin kita periksa.

Kalau test seperti ini sering gagal, jangan langsung menambah retry atau delay. Coba periksa:

1. Risiko utama apa yang sebenarnya ingin dibuktikan?
2. Langkah mana yang hanya setup dan nggak perlu lewat UI?
3. Bisakah alur dipisah menjadi beberapa test dengan outcome yang lebih fokus?
4. Data apa yang membuat test bergantung pada urutan atau kondisi environment?

Perbaikannya adalah memperjelas scope dan memecah alur berdasarkan risiko. Retry mungkin membuat hasil terlihat lebih hijau, tetapi nggak membuat tujuan test menjadi lebih jelas.

## Review hasil buatan AI

Coba bayangin AI mengusulkan rencana ini:

```text
Buat pelanggan baru, tunggu sampai akun siap, pilih produk pertama,
selesaikan checkout, lalu pastikan order berhasil.
```

Kedengarannya produktif, tapi banyak keputusan penting disembunyikan:

- Product risk apa yang sebenarnya ingin diuji?
- Apa yang membuat data pelanggan dan produk bisa diandalkan?
- Outcome apa yang mendefinisikan “berhasil”?
- Kenapa pembuatan akun, keranjang, dan pembayaran digabungkan?
- Langkah setup mana yang nggak perlu lewat UI?
- Apa yang harus dibersihkan supaya test bisa dijalankan lagi?

Minta AI menunjukkan keputusan tersebut, bukan mengambilnya diam-diam. Prompt yang baik menjelaskan product risk, batasan, cara setup data, dan evidence yang dibutuhkan. Setelah itu, minta AI mencari asumsi yang hilang serta menawarkan alternatif.

## Coba cek pemahamanmu

Tim kamu menjalankan skenario ini secara manual pada setiap release:

> Pelanggan terdaftar menambahkan produk yang tersedia ke keranjang kosong. Baris produk, jumlah, dan subtotal harus benar. Test environment bisa mereset keranjang dan menyediakan produk khusus untuk testing, tetapi marketing sering mengubah nama produk yang ditampilkan.

Coba jawab dengan kalimatmu sendiri:

1. Apakah skenario ini layak diotomasi? Kenapa?
2. Kenapa UI browser menjadi—atau bukan menjadi—feedback layer yang tepat?
3. Apa starting state dan test data yang dibutuhkan?
4. User action dan observable evidence apa yang harus masuk ke dalam scope?
5. Risiko perawatan dan asumsi AI apa yang perlu diperiksa?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- **Keputusan:** buat UI flow yang kecil karena check ini berulang, penting, bisa dikendalikan, dan punya evidence yang jelas di browser.
- **Scope:** buktikan bahwa produk khusus testing bisa ditambahkan dan state keranjang berubah dengan benar. Variasi perhitungan harga yang lebih luas sebaiknya juga diuji di bawah UI.
- **Starting state dan test data:** gunakan keranjang yang bisa di-reset dan produk khusus testing. Jangan bergantung pada produk pertama yang kebetulan muncul.
- **Observable evidence:** periksa identitas produk, jumlah, dan subtotal yang dimaksud—bukan cuma memastikan halaman keranjang terbuka.
- **Risiko perawatan:** nama produk yang dilihat pengguna sering berubah. Tim membutuhkan kesepakatan test data yang stabil dan nggak bergantung pada urutan atau teks di halaman.
- **Asumsi AI yang perlu diverifikasi:** setup pelanggan, aturan mata uang, identitas produk, cleanup, dan apakah isi keranjang harus tetap tersimpan termasuk dalam scope.

Jawabanmu bisa berbeda kalau konteks produknya berbeda. Yang penting, kamu bisa menjelaskan trade-off dan mempertanggungjawabkan keputusanmu—bukan cuma menghafal label `ui`, `api`, atau `manual`.

## Sebelum lanjut

Pastikan kamu sudah bisa mengambil skenario manual lalu menjelaskan:

1. product risk yang ingin dilindungi;
2. apakah skenario tersebut layak diotomasi;
3. kenapa UI browser merupakan—atau bukan merupakan—feedback layer yang tepat;
4. starting state dan test data yang dibutuhkan; dan
5. observable evidence yang menunjukkan hasilnya.

Kalau kelima bagian ini sudah jelas, kamu siap masuk ke modul berikutnya. Di sana, kita akan melihat bagaimana browser merepresentasikan halaman supaya otomasi bisa menemukan aksi dan bukti tersebut secara andal.
