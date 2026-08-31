---
title: 'Cari Root Cause dari Test yang Fail'
description: 'Reproduce masalahnya, cek kemungkinan penyebab dari error, trace, screenshot, atau network, lalu pastikan fix-nya memang menyelesaikan masalah.'
---

## Setelah lesson ini, kamu bisa

- membedakan symptom yang terlihat dengan root cause sebenarnya;
- reproduce failure dalam kondisi yang memang bisa memunculkan masalahnya;
- menggunakan error message, trace, UI Mode, screenshot, video, console, dan network untuk membantu debugging;
- menentukan apakah masalahnya berasal dari locator, synchronization, test data, product, environment, atau logic di test; serta
- memastikan fix benar-benar menyelesaikan masalah tanpa bergantung pada `force`, fixed wait, retry, atau mengurangi parallel execution.

## Kenapa ini penting buat QA

Test yang fail hanya memberi tahu bahwa actual result berbeda dari expected result. Test tersebut belum langsung memberi tahu penyebabnya.

Assertion timeout bisa terjadi karena banyak hal: product defect, test data yang salah, locator yang kurang tepat, expected result yang nggak pernah muncul, API request yang gagal, atau expectation di test yang memang salah.

Kalau langsung memperbesar timeout, test mungkin menunggu lebih lama, tapi root cause-nya tetap belum diketahui.

Di Module 5 kita sudah belajar menentukan kondisi apa yang perlu ditunggu setelah action. Kalau kondisi tersebut tetap nggak terpenuhi, sekarang kita perlu cari tahu bagian mana yang bermasalah: locator, timing, test data, product, environment, atau logic di test.

Sebelum mengubah code, kumpulkan dulu informasi yang bisa membantu diagnosis.

Cara berpikirnya sama seperti saat kita investigasi bug secara manual: reproduce masalahnya, cek kemungkinan penyebab satu per satu, kumpulkan evidence yang relevan, lalu lakukan perubahan berdasarkan root cause yang ditemukan.

## Cara berpikir yang perlu kamu pegang

Jangan langsung mengubah test hanya supaya pass. Ikuti alur ini:

```text
Symptom yang terlihat dan kondisi saat failure
      ↓
Lihat bagian pertama yang gagal
      ↓
Tentukan beberapa kemungkinan penyebab
      ↓
Cek evidence yang bisa membedakan kemungkinan tersebut
      ↓
Temukan root cause dan buat fix yang sesuai
      ↓
Jalankan ulang dalam kondisi yang sebelumnya memunculkan failure
```

![Debugging loop bergerak dari observed symptom ke first meaningful failure, competing hypothesis, distinguishing evidence, root cause, targeted repair, dan stress verification.](/images/tutorials/debugging-evidence-loop.svg)

_Satu kali rerun yang pass belum cukup. Fix yang benar harus sesuai dengan root cause yang ditemukan dan tetap pass saat dijalankan lagi dalam kondisi yang sebelumnya memunculkan failure._

Kelompokkan kemungkinan penyebabnya supaya debugging lebih terarah:

| Kemungkinan penyebab          | Yang perlu dicek                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Locator                       | Jumlah match, accessible name, scope, iframe, dan kondisi DOM                                           |
| Synchronization               | Urutan action dan apakah expected result pernah muncul                                                  |
| Starting state atau test data | Account, record ID, hasil setup, urutan eksekusi, dan worker                                            |
| Product defect                | Hasil yang dilihat user, ditambah informasi dari console atau network                                   |
| Environment atau dependency   | Response service, configuration, resource yang tersedia, dan browser/project yang digunakan             |
| Test logic                    | Expected result yang salah, conditional flow, error yang diabaikan, atau helper yang sudah nggak sesuai |

Satu failure bisa punya beberapa kemungkinan penyebab.

Karena itu, gunakan error, trace, screenshot, network, atau informasi lain untuk mempersempit kemungkinan sampai root cause-nya jelas.

## Coba kita bedah contoh nyata

Sebuah cancellation test biasanya pass di local, tapi fail saat dijalankan parallel di CI:

```text
Expected: “Order canceled”
Received: “Order was already canceled”
```

Assertion memang fail di status message, tapi itu belum berarti assertion-nya yang bermasalah.

### 1. Reproduce failure tanpa menghilangkan kondisi yang memicunya

Jalankan test sendiri terlebih dahulu, lalu coba lagi dengan beberapa worker:

```bash
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --workers=1
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --repeat-each=10 --workers=4
```

Kalau failure hanya muncul saat beberapa worker berjalan bersamaan, kemungkinan besar ada test data atau state yang dipakai bersama.

Jangan langsung mematikan parallel execution hanya supaya test pass. Kondisi parallel tersebut justru membantu kita reproduce masalah dan mencari root cause.

### 2. Mulai dari failure pertama yang paling relevan

Baca error paling awal yang benar-benar berhubungan dengan expected result.

Error seperti **element not found** atau cleanup yang ikut fail setelahnya bisa saja hanya efek dari masalah yang terjadi lebih dulu.

Catat kondisi pentingnya:

```text
Failure pertama: cancellation status
Expected state: satu submitted order yang dibuat untuk test ini
Actual state: order yang sama ternyata sudah canceled
Kondisi saat failure muncul: test dijalankan berulang secara parallel
```

### 3. Buat beberapa kemungkinan penyebab

| Kemungkinan penyebab                | Yang perlu dicek                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Click terkirim dua kali             | Apakah satu test mengirim dua cancel action atau request                                |
| UI menampilkan message lama         | Apakah cancel request berhasil tapi UI masih menampilkan response sebelumnya            |
| Test lain cancel order yang sama    | Apakah worker lain menggunakan account atau order ID yang sama                          |
| Ada defect di cancellation endpoint | Apakah satu cancel request pada submitted order yang unique tetap menghasilkan conflict |

Jangan langsung mengubah code. Cek dulu error, trace, network, dan test data untuk menentukan kemungkinan mana yang benar-benar menjadi root cause.

### 4. Cek urutan kejadian dari trace

Simpan trace untuk test yang fail lewat Playwright configuration:

```ts
export default defineConfig({
  use: {
    trace: 'retain-on-failure',
  },
});
```

Buka trace dari failed run:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Cek urutan action, detail locator, DOM sebelum dan sesudah action, console message, serta network request dari test yang fail.

Kalau ingin reproduce dan inspect secara local, UI Mode juga bisa membantu:

```bash
npx playwright test --ui
```

Dari contoh ini, trace menunjukkan bahwa:

- test hanya klik **Cancel** satu kali;
- request dikirim ke `/api/orders/ORD-1042/cancel`;
- server mengembalikan `409 Already canceled`;
- trace, report, atau log dari worker lain menunjukkan account dan order ID yang sama digunakan beberapa saat sebelumnya; dan
- masing-masing test sebenarnya sudah menggunakan browser context yang berbeda.

Jadi, root cause-nya ada pada backend data yang digunakan bersama, bukan karena session browser terbawa atau assertion terlalu lambat.

### 5. Perbaiki penyebab sebenarnya

Buat satu submitted order khusus untuk setiap test, lalu gunakan ID dari hasil setup untuk membuka order tersebut.

Kalau beberapa test juga mengubah data di level account, gunakan account yang berbeda supaya test tidak saling mengganggu.

Status assertion tetap dipertahankan karena expected result-nya masih benar. Yang perlu diperbaiki adalah test data dan setup-nya, bukan timing assertion.

### 6. Jalankan ulang dalam kondisi yang sebelumnya membuat test fail

Jalankan lagi test dengan jumlah worker dan repetition yang sebelumnya berhasil memunculkan masalah.

Setelah itu, jalankan test lain yang berkaitan untuk memastikan perubahan setup tidak menimbulkan masalah baru.

Satu kali rerun yang pass belum cukup. Fix lebih meyakinkan kalau test tetap stabil saat dijalankan berulang dan parallel seperti kondisi ketika failure sebelumnya muncul.

## Kapan pendekatan ini cocok dipakai?

Kalau failure-nya sederhana dan bisa direproduce di local, mulai dari error message dan call log.

Gunakan Inspector atau `--debug` kalau kamu perlu menjalankan test step by step dan mencoba locator langsung di browser.

Gunakan UI Mode kalau kamu ingin melihat perjalanan test secara lebih visual.

Untuk failure yang hanya muncul di CI, trace biasanya lebih berguna karena menyimpan action, DOM snapshot, console, network, timing, dan error dari run yang benar-benar fail.

Screenshot membantu melihat kondisi page pada satu momen. Video membantu melihat urutan kejadian. Trace biasanya memberi context paling lengkap untuk memahami apa yang terjadi sebelum dan sesudah failure.

Gunakan artifact secukupnya. Nggak perlu mengumpulkan semuanya kalau satu atau dua sumber sudah cukup untuk menemukan root cause.

Retry bisa membantu menunjukkan bahwa sebuah test flaky. Kalau test fail pada run pertama lalu pass saat retry, Playwright akan menandainya sebagai flaky.

Retry tetap berguna supaya CI bisa lanjut menjalankan test lain, tapi jangan anggap test sudah sehat hanya karena retry akhirnya pass. Failed attempt-nya tetap perlu diinvestigasi.

Jangan gunakan `force: true` untuk melewati actionability failure yang belum dipahami. Jangan menambahkan fixed wait untuk masalah test data atau state. Jangan mengganti expected result yang spesifik menjadi assertion seperti `toBeTruthy()` hanya supaya test pass.

Jangan juga langsung menjalankan dependent test secara serial sebelum tahu dependency apa yang membuatnya saling mengganggu.

## Kalau gagal, mulai cek dari mana?

Debugging juga bisa jadi nggak efektif kalau informasi dari failed run hilang atau kita mengubah terlalu banyak hal sekaligus.

Kalau failure nggak bisa direproduce di local:

1. Bandingkan browser project, environment, jumlah worker, retry, test data, dan feature configuration antara local dan CI.
2. Simpan informasi dari failed attempt pertama, bukan hanya run yang akhirnya pass setelah retry.
3. Gunakan `--repeat-each` atau jalankan test dengan beberapa worker kalau masalahnya diduga hanya muncul saat test berjalan berulang atau parallel.
4. Tambahkan log atau attachment yang memang membantu melihat state yang sedang dicurigai, bukan fixed sleep.
5. Catat seberapa sering failure terjadi dan kondisi apa yang biasanya memicunya. Jangan langsung menyebutnya random.

Kalau trace menunjukkan target memang nggak pernah muncul, memperbesar locator timeout nggak akan menyelesaikan masalah.

Kalau `force` membuat click berhasil, cari tahu apa yang sebelumnya membuat normal click gagal—misalnya overlay, disabled state, element berubah, atau target yang sebenarnya salah.

Saat mencoba fix, ubah satu hal yang memang berkaitan dengan kemungkinan root cause yang sedang diuji. Kalau terlalu banyak perubahan dilakukan sekaligus, kita jadi sulit tahu perubahan mana yang sebenarnya menyelesaikan masalah.

Perlu diingat juga bahwa trace, screenshot, video, dan network log bisa berisi cookie, credential, personal data, request body, atau internal URL.

Batasi siapa yang bisa mengakses artifact tersebut, simpan hanya selama dibutuhkan, dan hapus atau sensor data sensitif sebelum dibagikan ke luar tim atau digunakan dengan AI.

## Review hasil kerja dengan bantuan AI

Berikan AI error yang exact, code yang relevan, hasil observasi yang sudah disensor, dan kondisi saat failure terjadi.

Setelah itu, review jawabannya:

- Apakah AI membedakan symptom yang terlihat dengan root cause?
- Apakah AI memberi beberapa kemungkinan penyebab, bukan langsung menebak satu?
- Informasi apa yang perlu dicek untuk membedakan kemungkinan tersebut?
- Apakah perubahan yang disarankan benar-benar memperbaiki penyebabnya atau hanya membuat test lebih sulit fail?
- Apakah AI menyarankan `waitForTimeout()`, `force`, retry berlebihan, serial execution, atau assertion yang dibuat lebih longgar?
- Apakah AI mengarang API response, detail environment, atau product requirement yang sebenarnya belum diketahui?
- Apakah fix tersebut bisa diuji lagi dalam kondisi yang sebelumnya memunculkan failure?
- Apakah secret dan personal data sudah dihapus dari artifact yang diberikan ke AI?

AI bisa membantu menyusun kemungkinan penyebab dan langkah investigasi. Tapi kita tetap perlu mengecek evidence dan memastikan sendiri root cause yang sebenarnya.

## Coba cek pemahamanmu

AI assistant menawarkan empat solusi untuk test yang pass saat dijalankan sendiri, tapi kadang fail ketika menggunakan empat worker:

1. naikkan assertion timeout dari 5 menjadi 30 detik;
2. set `workers: 1`;
3. tambahkan dua retry;
4. cek apakah beberapa worker menggunakan account dan record ID yang sama, lalu pisahkan datanya dan jalankan ulang secara parallel.

Trace menunjukkan request dari failed run menerima `409 Already processed`.

Jelaskan mana yang benar-benar membantu mencari root cause, mana yang hanya bisa digunakan sementara, dan mana yang hanya menyembunyikan masalah.

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- Suggestion 4 paling relevan untuk mencari root cause. Error `409 Already processed` yang hanya muncul saat parallel mengarah ke kemungkinan beberapa test menggunakan backend data yang sama. Cek account dan record ID yang digunakan setiap worker, lalu pisahkan mutable data untuk masing-masing test atau worker.
- Menjalankan satu worker bisa dipakai sementara kalau memang ada external system yang nggak bisa diakses secara concurrent. Tapi itu bukan fix utama kalau masalah sebenarnya adalah test data yang dipakai bersama.
- Retry bisa membantu menunjukkan bahwa test flaky atau menjaga test lain di CI tetap berjalan, tapi penyebab shared state-nya tetap belum diperbaiki.
- Memperbesar assertion timeout nggak menyelesaikan response `409`, karena masalahnya bukan test kurang lama menunggu.
- Setelah test data dipisahkan, jalankan kembali test berulang kali dengan beberapa worker dan cek apakah masih ada failure pada run pertama.

Assertion yang sudah benar nggak perlu diubah. Yang perlu diperbaiki adalah starting state dan test data yang membuat beberapa test saling mengganggu.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa reproduce test yang fail, menentukan beberapa kemungkinan penyebab, menggunakan informasi dari failed run untuk mencari root cause, lalu memastikan fix benar-benar menyelesaikan masalah.

Selesaikan Core Practice dengan memperbaiki test yang menggunakan order yang salah dan membuat root cause-nya sulit terlihat.

Module 7 selesai setelah tiga Core lesson dan Core Practice tersebut selesai.

Di Module 8, kita akan membahas kapan helper, page object, fixture, dan configuration memang membantu membuat test lebih mudah di-maintain, tanpa menyembunyikan setup, state, atau behavior penting di balik abstraction.
