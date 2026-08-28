---
title: 'Pilih Test Scenario yang Layak Diotomatisasi'
description: 'Nilai test scenario, pilih test layer yang tepat, lalu rumuskan automation intent dengan scope yang fokus dan repeatable.'
---

## Setelah lesson ini, kamu bisa

- menilai apakah sebuah test scenario layak diotomatisasi berdasarkan product risk, seberapa sering test dibutuhkan, controllability, observability, dan maintenance cost;
- menjelaskan apakah browser UI automation, test layer yang lebih rendah, atau manual dan exploratory testing memberikan feedback yang paling berguna;
- memperkecil flow yang terlalu panjang menjadi test yang lebih fokus dan mudah didiagnosis;
- mendokumentasikan automation intent sebelum menulis code; dan
- menguji asumsi dalam automation plan yang dibuat AI.


## Kenapa ini penting buat QA

Setiap automated test punya maintenance cost. Setelah test dibuat, QA engineer yang handle area tersebut tetap perlu maintain test-nya. Kalau test fail saat regression, penyebabnya perlu diinvestigasi dan test harus di-fix kalau sudah nggak sesuai dengan behavior atau implementation terbaru.

Selain itu, tim tetap perlu menyiapkan state dan test data yang reliable, update test saat behavior yang diuji berubah, dan memastikan automated test tetap memberikan feedback yang benar.


Jadi, pertanyaannya bukan cuma:

> Apakah skenario ini bisa diotomasi?

Pertanyaan yang lebih berguna adalah:

> Apakah test ini cukup berguna dan cukup sering dijalankan sehingga effort untuk membuat dan maintain test-nya memang worth it?

Memilih test scenario yang layak di-automate perlu pertimbangan teknis. Tujuannya bukan mengotomasi test case sebanyak mungkin, tapi memilih test yang benar-benar memberikan feedback yang berguna buat tim.

## Cara berpikir yang perlu kamu pegang

Nilai setiap test scenario dari enam hal berikut. Ini bukan rumus atau sistem scoring, tapi panduan untuk membantu melihat trade-off sebelum memutuskan apakah scenario tersebut layak di-automate.

| Yang Dinilai                   | Pertanyaan                                                                 | Warning sign                                                                   |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Risk dan value         | Kegagalan penting apa yang akan dideteksi?                                 | Nggak ada yang bisa menjelaskan dampaknya kalau scenario ini gagal.                           |
| Repetition             | Seberapa sering tim membutuhkan feedback dari test ini?                              | Test kemungkinan besar cuma akan dijalankan sekali atau sangat jarang.                                |
| Controllability        | Bisakah state dan test data dibuat lalu di-reset?                          | Test bergantung pada shared data yang sulit diprediksi atau harus disiapkan manual. |
| Observability          | Bisakah expected result diverifikasi dengan jelas?                                  | Satu-satunya cara mengeceknya cuma “kelihatannya benar”.                            |
| Change dan maintenance | Seberapa sering flow dan expectation-nya berubah?                          | Feature masih sering berubah sehingga test perlu terus di-maintain.               |
| Need for browser       | Bagian mana yang benar-benar perlu dilakukan atau diverifikasi lewat browser? Apakah setup, verification tambahan, atau cleanup bisa dilakukan lewat API, DB, fixture, atau layer lain? | Terlalu banyak step dipaksakan lewat UI padahal browser nggak memberikan feedback tambahan untuk bagian tersebut.|

Sebuah test scenario nggak harus punya kondisi yang sempurna untuk layak di-automate.
Misalnya, scenario tersebut punya product risk yang tinggi, tapi state atau test data-nya masih sulit dikontrol. Itu belum tentu berarti scenario tersebut nggak layak di-automate.
Bisa jadi tim perlu memperbaiki **testability** terlebih dahulu misalnya supaya test data lebih mudah disiapkan, state bisa di-reset, dan hasil test lebih mudah diverifikasi.

## Coba kita bedah contoh nyata

Coba lihat fitur login. Satu test bisa melibatkan beberapa layer, tergantung apa yang ingin disiapkan, dilakukan, dan diverifikasi.

| Feedback layer                    | Pertanyaan yang dijawab                                                                         | Contoh                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Browser UI automation             | Menjalankan behavior yang memang perlu diuji dari sisi user                    | User mengisi login form dan submit melalui browser. |
| API atau service-level automation | Menyiapkan test data, menguji business rule, atau melakukan verification tanpa lewat UI             | API menyiapkan account dengan kondisi tertentu atau memastikan credential valid diterima oleh service.              |
| DB | Mengecek perubahan data yang memang perlu diverifikasi di backend | Memastikan login attempt atau perubahan state tertentu tersimpan sesuai kebutuhan test. |
| Unit atau component test          | Menguji logic kecil atau component secara terisolasi dengan feedback yang cepat                        | Validation function menangani boundary value dengan benar.                             |
| Manual atau exploratory testing   | Mengeksplorasi behavior yang subjektif, belum jelas, atau sulit dinilai oleh script | Mengecek apakah error message cukup jelas ketika user gagal login.            |

Layer-layer ini nggak harus digunakan satu per satu secara terpisah.

Dalam satu web E2E test, misalnya, kita bisa:

Prepare test data lewat API -> Lakukan login lewat browser -> Verify hasil lewat UI -> Kalau perlu, verify data lewat DB -> Cleanup lewat API

Jadi pertanyaannya bukan sekadar:

> Test ini sebaiknya UI, API, atau DB?

Tapi:

> Bagian mana yang memang perlu diuji lewat UI, dan bagian mana yang lebih efektif dilakukan lewat layer lain?

Browser tetap fokus pada behavior yang memang ingin kita verify dari sisi user. Setup, verification tambahan, dan cleanup bisa menggunakan API, DB, fixture, atau cara lain yang lebih reliable dan mudah di-maintain.

## Kapan UI automation memang dibutuhkan?

Gunakan UI automation ketika ada behavior yang memang perlu diuji dari sisi user melalui browser. Misalnya, memastikan user bisa menambahkan produk ke cart dan melihat product, quantity, serta subtotal yang benar.

Tapi bukan berarti semua bagian dari test harus dilakukan lewat UI.

Kalau yang ingin diuji adalah ratusan kombinasi perhitungan pajak, misalnya, browser bukan layer yang paling efektif. Logic tersebut bisa diuji lebih cepat dan lebih lengkap melalui API, service, atau unit test.

Dalam satu E2E test pun kita bisa menggabungkan beberapa layer. Misalnya, test data disiapkan lewat API, action utama dilakukan lewat browser, hasilnya diverifikasi lewat UI, lalu kalau memang dibutuhkan kita bisa melakukan verification tambahan lewat API atau DB.

Untuk behavior yang subjektif atau expected result-nya belum jelas—misalnya, “apakah desain baru mudah dipahami?”—manual dan exploratory testing tetap lebih cocok.

Kalau UI automation memang dibutuhkan, mulai dari test scenario dengan tujuan yang jelas:

```text
Given customer yang sudah login dan satu produk yang tersedia
When customer menambahkan satu unit ke cart yang kosong
Then cart menampilkan produk tersebut, quantity 1, dan subtotal yang benar
```

Ini bukan berarti setiap test harus mengikuti flow yang sangat pendek atau hanya punya satu click. Yang penting, test punya tujuan yang jelas sehingga ketika fail, kita tahu behavior apa yang sebenarnya sedang diuji.

Setup seperti membuat customer, menyiapkan produk, atau me-reset cart bisa dilakukan lewat API atau fixture. Verification tambahan juga bisa dilakukan lewat API atau DB kalau memang dibutuhkan.

Fokuskan browser pada action dan expected result yang memang perlu diverifikasi dari sisi user. Jangan paksa setup, verification, atau cleanup lewat UI kalau layer lain bisa melakukannya dengan lebih cepat dan reliable.

### Tentukan automation intent sebelum menulis script

Automation intent membantu QA, developer, dan stakeholder memahami apa yang sebenarnya ingin diuji sebelum masuk ke implementation.

```text
Test scenario:
Product risk atau business impact:
Kenapa perlu di-automate—atau kenapa tidak:
Bagian mana yang perlu lewat UI, dan bagian mana yang bisa lewat layer lain:
Starting state dan test data:
User action:
Expected result atau observable evidence:
Maintenance risk:
Asumsi dari AI yang perlu diverifikasi:
```

Kalau ada bagian penting yang masih belum jelas, investigasi dan tanya dulu sebelum meminta atau mulai menulis automation script lengkap.

## Kalau test fail, mulai cek dari mana?

Salah satu masalah yang sering terjadi adalah membuat satu E2E test yang terlalu panjang:

```text
Buat customer → verifikasi email → atur profile → cari produk →
tambahkan produk → gunakan voucher → bayar → download invoice → hapus customer
```

Ketika test fail, root cause-nya bisa ada di banyak tempat. Setup test data jadi lebih rumit, debugging lebih lama, dan failure di step yang sebenarnya nggak berhubungan bisa membuat kita gagal mendapatkan feedback dari behavior yang ingin diuji.

Kalau test seperti ini sering fail, jangan langsung tambahkan retry atau delay. Coba cek:

1. Product risk apa yang sebenarnya ingin diuji oleh test ini?
2. Step mana yang hanya bagian dari setup dan sebenarnya bisa dilakukan lewat API, fixture, atau layer lain?
3. Bisakah flow ini dipecah menjadi beberapa test scenario yang lebih fokus?
4. Test data atau dependency apa yang membuat test bergantung pada urutan atau kondisi environment tertentu?

Solusinya biasanya bukan membuat test yang panjang tadi lebih sering pass, tapi memperjelas scope dan memisahkan responsibility-nya.

Retry atau delay mungkin membuat test terlihat lebih stabil, tapi belum tentu memperbaiki root cause atau membuat feedback dari test menjadi lebih berguna.


## Review hasil kerja dengan bantuan AI

Coba bayangin AI mengusulkan automation plan seperti ini:

```text
Buat customer baru, tunggu sampai account siap, pilih produk pertama,
selesaikan checkout, lalu pastikan order berhasil.
```

Sekilas kelihatan oke, tapi masih banyak hal penting yang belum jelas:

* Product risk apa yang sebenarnya ingin diuji?
* Apa yang membuat test data untuk customer dan produk reliable?
* Expected result apa yang benar-benar menunjukkan bahwa order berhasil?
* Kenapa account creation, cart, dan payment digabungkan dalam satu test?
* Step setup mana yang sebenarnya nggak perlu dilakukan lewat UI?
* Apa yang perlu di-cleanup supaya test bisa dijalankan lagi?

Jangan biarkan AI mengisi bagian-bagian itu dengan asumsi sendiri.

Kasih context yang jelas di prompt: product risk, constraint yang sudah diketahui, cara menyiapkan test data, dan expected result atau observable evidence yang dibutuhkan.

Setelah itu, minta AI menunjukkan asumsi yang masih belum jelas dan memberikan alternatif kalau ada approach atau test layer yang lebih tepat.

## Coba cek pemahamanmu

Tim kamu menjalankan manual test scenario ini pada setiap release:

> Customer yang sudah terdaftar menambahkan produk yang tersedia ke cart kosong. Product, quantity, dan subtotal harus tampil dengan benar. Test environment bisa me-reset cart dan menyediakan produk khusus untuk testing, tetapi marketing sering mengubah nama produk yang ditampilkan ke user.

Coba jawab dengan kalimatmu sendiri:

1. Apakah test scenario ini layak di-automate? Kenapa?
2. Bagian mana yang memang perlu dilakukan atau diverifikasi lewat browser, dan bagian mana yang bisa menggunakan layer lain?
3. Apa starting state dan test data yang dibutuhkan?
4. User action dan expected result atau observable evidence apa yang perlu diverifikasi?
5. Apa maintenance risk dan asumsi dari AI yang masih perlu dicek?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

* **Keputusan:** test scenario ini layak di-automate karena dijalankan berulang kali, risikonya penting, state dan test data bisa dikontrol, dan hasilnya bisa diverifikasi dengan jelas.
* **Scope:** fokuskan browser pada action menambahkan produk ke cart dan verify hasil yang dilihat user. Variasi perhitungan harga yang lebih luas bisa diuji di layer yang lebih rendah.
* **Starting state dan test data:** gunakan cart yang bisa di-reset dan produk khusus untuk testing. Jangan bergantung pada produk pertama yang kebetulan muncul.
* **Observable evidence:** verify produk yang benar, quantity, dan subtotal—bukan cuma memastikan halaman cart berhasil terbuka.
* **Maintenance risk:** nama produk yang ditampilkan ke user sering berubah. Test data harus tetap stabil dan jangan bergantung pada urutan produk atau wording yang mudah berubah.
* **Asumsi AI yang perlu diverifikasi:** setup customer, aturan currency, cara menentukan produk yang digunakan, cleanup, dan apakah cart persistence memang termasuk dalam scope test.

Jawabanmu bisa berbeda tergantung konteks produk dan risiko yang ingin diuji. Yang penting, kamu bisa menjelaskan trade-off dan alasan di balik keputusanmu.

Tujuannya bukan sekadar menentukan apakah test harus diberi label `UI`, `API`, atau `manual`, tapi memilih layer yang tepat untuk setiap bagian dari test tersebut.


## Sebelum lanjut

Pastikan kamu sudah bisa melihat sebuah manual test scenario lalu menjelaskan:

1. product risk yang ingin diuji;
2. apakah test scenario tersebut layak di-automate;
3. bagian mana yang memang perlu dilakukan atau diverifikasi lewat browser, dan bagian mana yang bisa menggunakan layer lain;
4. starting state dan test data yang dibutuhkan; dan
5. expected result atau observable evidence yang perlu diverifikasi.

Kalau kelima bagian ini sudah jelas, kamu siap masuk ke module berikutnya.

Di sana, kita akan melihat bagaimana browser merepresentasikan sebuah halaman supaya automation bisa menemukan element, melakukan action, dan memverifikasi expected result dengan reliable.
