---
title: 'Pilih Assertion yang Benar-Benar Memverifikasi Expected Result'
description: 'Pilih Playwright assertion yang sesuai dengan expected result dan fokus pada hal yang memang perlu diverifikasi dari sisi user.'
---

## Setelah lesson ini, kamu bisa

- menentukan hasil apa yang perlu diverifikasi berdasarkan product risk;
- memilih assertion untuk text, control state, form value, jumlah element, atau perubahan URL;
- membedakan Playwright assertion yang melakukan retry dengan pengecekan value yang hanya dilakukan sekali;
- mengenali negative assertion yang bisa pass terlalu cepat sebelum flow selesai; serta
- me-review apakah assertion sudah cukup untuk memverifikasi expected result tanpa mengecek hal yang sebenarnya nggak penting.

## Kenapa ini penting buat QA

Di Module 5 kita belajar cara menunggu hasil setelah action. Sekarang kita masuk ke pertanyaan berikutnya: hasil apa yang benar-benar perlu diverifikasi?

Coba bayangin checkout test diakhiri dengan:

```ts
await expect(page.getByRole('button', { name: 'Place order' })).toBeHidden();
```

Button-nya memang hilang. Tapi apakah order benar-benar berhasil dibuat? Apakah produk yang benar terbeli? Atau aplikasi justru menampilkan payment error?

Assertion tersebut bisa saja pass, tapi test tetap belum memastikan hasil yang sebenarnya dibutuhkan oleh scenario.

Sebagai manual QA, kita sudah terbiasa membandingkan actual result dengan expected result. Di automation, expected result tersebut perlu diterjemahkan menjadi assertion yang tepat.

Test yang pass baru benar-benar berguna kalau assertion-nya memang memverifikasi hasil yang penting untuk scenario.

## Cara berpikir yang perlu kamu pegang

Mulai dari product risk, bukan dari element yang paling gampang dicek:

```text
Product risk
     ↓
Hasil apa yang harus dipastikan oleh test
     ↓
Apa yang bisa dilihat atau dirasakan user
     ↓
Assertion yang paling sesuai
```

![Product risk diubah menjadi claim yang presisi, claim didukung user-observable evidence, lalu setiap evidence memakai Playwright assertion yang sesuai.](/images/tutorials/assertion-evidence-chain.svg)

_Pilih assertion setelah kamu tahu hasil apa yang memang perlu diverifikasi. Matcher adalah langkah terakhir._

Di Playwright, `expect(value)` memulai assertion. Method seperti `toHaveText()` adalah matcher yang menjelaskan expected result.

Untuk scenario order:

- **Risk:** payment berhasil tapi order tidak dibuat.
- **Yang perlu dipastikan:** satu order berhasil dibuat untuk pembelian yang dimaksud.
- **Yang bisa diverifikasi:** confirmation heading, order number, dan item summary yang sesuai.
- **Assertion:** gunakan exact text atau locator yang sudah diberi scope sesuai kebutuhan.

Hal seperti **click selesai**, **spinner hilang**, atau **container punya class `success`** mungkin menunjukkan bahwa aplikasi sedang berada di state tertentu. Tapi itu belum tentu cukup untuk memastikan expected result tercapai.

Secara umum, ada dua cara assertion bekerja:

| Assertion                                       | Cara kerjanya                                            | Biasanya digunakan untuk                       |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| `await expect(locator).toHaveText(...)`         | Melakukan retry sampai text sesuai atau timeout          | UI yang berubah setelah action                 |
| `await expect(locator).toBeEnabled()`           | Melakukan retry sampai control enabled                   | Control state yang berubah                     |
| `await expect(page).toHaveURL(...)`             | Melakukan retry sampai URL sesuai                        | Perubahan route yang memang perlu diverifikasi |
| `expect(await locator.textContent()).toBe(...)` | Mengambil value sekali lalu langsung membandingkannya    | Case yang memang tidak membutuhkan retry       |
| `expect(calculatedValue).toBe(...)`             | Langsung membandingkan value yang sudah tersedia di code | Perhitungan atau synchronous result            |

Kalau kondisi di browser bisa berubah secara asynchronous, gunakan Playwright web assertion yang melakukan retry dan jangan lupa `await`.

## Coba kita bedah contoh nyata

Requirement registrasinya seperti ini:

> Invalid email atau password harus membuat registrasi tidak bisa dilanjutkan dan menampilkan guidance. Kalau datanya sudah valid, guidance hilang dan button **Register** bisa digunakan.

Risk utamanya bukan cuma **“error message muncul.”** Yang lebih penting adalah memastikan data invalid nggak bisa disubmit dan data valid nggak tetap terblokir.

### 1. Tentukan apa yang perlu diverifikasi

Sebelum menulis assertion, tentukan dulu hasil yang memang perlu dipastikan:

1. Saat email invalid, guidance untuk email muncul.
2. Button **Register** disabled selama data masih invalid.
3. Setelah email diperbaiki, guidance tersebut hilang.
4. Button **Register** enabled ketika semua required data sudah valid.

Empat hal ini masih menguji behavior yang sama: apakah registration state berubah dengan benar mengikuti validation state.

### 2. Pilih assertion yang sesuai

Pada contoh ini, validation berjalan saat value field berubah. Test membuat starting state yang invalid sebelum melakukan assertion:

```ts
const email = page.getByLabel('Email');
const password = page.getByLabel('Password');
const emailError = page.getByRole('alert');
const register = page.getByRole('button', { name: 'Register' });

await email.fill('rani.example.com');
await password.fill('short');

await expect(emailError).toHaveText('Invalid email format');
await expect(register).toBeDisabled();
```

`toHaveText()` memastikan message yang tampil memang **“Invalid email format”**, bukan hanya memastikan alert-nya visible.

Kalau requirement hanya mengatakan alert harus muncul, `toBeVisible()` mungkin sudah cukup. Tapi di scenario ini wording guidance-nya penting, jadi `toHaveText()` lebih sesuai.

`toBeDisabled()` juga langsung memastikan user memang belum bisa melakukan registrasi.

Mengecek class seperti `class="disabled"` hanya memastikan detail implementation tertentu, bukan memastikan button benar-benar disabled dari sisi user.

### 3. Ubah data menjadi valid

```ts
await email.fill('rani@example.com');
await password.fill('validpass123');
```

Action di atas hanya mengubah value di field. Kita tetap perlu verify apakah validation state aplikasi ikut berubah sesuai dengan expected result.

### 4. Verify perubahan setelah data diperbaiki

```ts
await expect(emailError).toBeHidden();
await expect(register).toBeEnabled();
```

`toBeHidden()` masuk akal di sini karena sebelumnya test sudah memastikan bahwa error message memang muncul saat email invalid.

Jadi, ketika error message hilang setelah data diperbaiki, test benar-benar memverifikasi perubahan state yang diharapkan.

`toBeEnabled()` kemudian memastikan button **Register** sudah bisa digunakan setelah semua required data valid.

Kita nggak perlu mengecek semua CSS class, HTML attribute, atau validation function selama behavior yang dilihat user sudah bisa diverifikasi dengan jelas.

### 5. Pilih assertion berdasarkan hasil yang ingin diverifikasi

| Yang ingin diverifikasi                               | Assertion yang bisa digunakan      | Yang perlu dicek saat review                                                                                 |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Status atau heading dengan text exact                 | `toHaveText('Profile saved')`      | Apakah seluruh message memang harus sama?                                                                    |
| Bagian text yang stabil di dalam content yang dynamic | `toContainText('Order confirmed')` | Apakah text tersebut juga bisa muncul pada kondisi lain?                                                     |
| Control terlihat oleh user                            | `toBeVisible()`                    | Apakah visible saja sudah cukup untuk scenario?                                                              |
| Control bisa atau tidak bisa digunakan                | `toBeEnabled()` / `toBeDisabled()` | Apakah enabled/disabled memang bagian dari behavior yang diuji?                                              |
| Checkbox berada pada state tertentu                   | `toBeChecked()`                    | Apakah starting state sudah dikontrol?                                                                       |
| Value di input                                        | `toHaveValue()`                    | Apakah value di field yang memang perlu diverifikasi?                                                        |
| Jumlah item atau result                               | `toHaveCount()`                    | Apakah jumlah tersebut memang penting untuk requirement?                                                     |
| URL berubah ke route tertentu                         | `toHaveURL()`                      | Apakah URL memang perlu diverifikasi atau hanya detail implementation?                                       |
| Attribute tertentu                                    | `toHaveAttribute()`                | Apakah attribute tersebut memang penting, atau behavior user bisa diverifikasi dengan cara yang lebih tepat? |

Gunakan exact match kalau seluruh text memang harus sesuai.

Gunakan partial text atau regular expression kalau sebagian content memang dynamic, misalnya order ID, tanggal, atau detail lain yang bisa berubah.

Tapi jangan membuat matcher menjadi terlalu longgar hanya supaya assertion lebih mudah pass.

## Kapan pendekatan ini cocok dipakai?

Gunakan Playwright assertion yang melakukan retry untuk kondisi browser yang bisa berubah setelah navigation, action, rendering, atau response dari server.

Gunakan assertion biasa untuk value yang sudah tersedia di memory atau kondisi yang memang cukup dicek satu kali.

Utamakan hal yang benar-benar relevan dari sisi user, seperti text yang tampil, state sebuah control, value di field, jumlah item, atau URL kalau perubahan route memang bagian dari requirement.

Attribute assertion tetap bisa digunakan kalau attribute tersebut memang penting untuk scenario. Misalnya, link harus mengarah ke destination tertentu. Tapi jangan menjadikannya pilihan utama kalau behavior yang dilihat user bisa diverifikasi dengan cara yang lebih jelas.

Satu test juga boleh punya beberapa assertion kalau memang dibutuhkan untuk memastikan satu behavior.

Nggak ada aturan bahwa satu test harus punya satu assertion saja. Tapi jangan juga mengecek semua hal yang terlihat di page. Pilih assertion yang memang dibutuhkan untuk memastikan expected result.

Gunakan `expect()` biasa (hard assertion) untuk kondisi yang memang harus benar sebelum test bisa lanjut.

Gunakan `expect.soft()` kalau kamu ingin mengumpulkan beberapa hasil pengecekan sekaligus tanpa langsung menghentikan test pada failure pertama. Test tetap akan dianggap fail kalau ada soft assertion yang gagal.

Tapi jangan lanjut ke action berikutnya kalau action tersebut bergantung pada kondisi yang sudah gagal. Untuk kondisi seperti itu, tetap gunakan hard assertion sebelum melanjutkan.

## Kalau gagal, mulai cek dari mana?

Kalau assertion fail, cek dulu beberapa hal ini:

1. Apakah starting state dan action sebelumnya memang menghasilkan kondisi yang ingin diverifikasi?
2. Apakah locator sudah mengarah ke account, card, row, dialog, atau page yang benar?
3. Apakah assertion yang digunakan sesuai dengan hal yang ingin dicek, misalnya text, value, state, count, atau URL?
4. Apakah expected result-nya memang salah, atau matcher yang terlalu longgar justru membuat content yang salah bisa tetap pass?
5. Apakah hasil yang ditunggu ternyata muncul di page atau iframe lain?
6. Apakah failure disebabkan oleh product defect, expected result yang sudah berubah, synchronization yang kurang tepat, atau asumsi test yang salah?

Jangan langsung mengganti exact assertion yang fail menjadi `toContainText('Success')` hanya supaya test pass. Cek dulu bagian mana dari text yang memang boleh berubah dan bagian mana yang harus tetap sama.

Jangan juga memperbesar assertion timeout kalau kondisi yang diharapkan memang nggak akan pernah terjadi.

Kalau assertion fail, jangan menangkap error lalu hanya menulis log dan melanjutkan test. Failure tersebut perlu tetap terlihat karena bisa menunjukkan masalah pada product atau test.

Untuk negative assertion yang bisa pass terlalu cepat, pastikan kondisi sebelumnya memang sudah terjadi atau tunggu perubahan lain yang menunjukkan flow tersebut benar-benar sudah berjalan.

Saat review assertion, cek beberapa hal ini:

- Apakah assertion tersebut memang memverifikasi hasil yang penting untuk scenario?
- Apakah yang dicek benar-benar terlihat atau dirasakan user, atau hanya detail implementation?
- Apakah `toBeVisible()` digunakan padahal text, value, atau enabled state yang sebenarnya lebih penting?
- Apakah text matcher terlalu longgar sampai message yang salah bisa tetap pass?
- Kalau menggunakan negative assertion, apakah sebelumnya sudah dipastikan kondisi positifnya memang pernah ada?
- Apakah `textContent()`, `isVisible()`, atau `count()` yang hanya membaca satu kali digunakan pada UI yang masih bisa berubah?
- Apakah ada assertion tambahan yang sebenarnya nggak relevan dengan expected result?
- Apakah `expect.soft()` membuat test tetap menjalankan action yang bergantung pada kondisi yang sebenarnya sudah fail?
- Kalau assertion fail, apakah error-nya cukup membantu menjelaskan behavior apa yang berubah?

Menambahkan assertion itu mudah. Yang lebih penting adalah memastikan assertion tersebut benar-benar memverifikasi expected result yang penting.

## Coba cek pemahamanmu

Review test berikut:

```ts
await page.getByRole('button', { name: 'Delete address' }).click();

await expect(page.locator('.address-card')).not.toHaveClass(/loading/);
await expect(page.getByText('Address')).not.toBeVisible();
await expect(page.locator('body')).toContainText('Success');
```

Requirement-nya mengatakan address bernama **Office Jakarta** harus dihapus dan status menampilkan **Address deleted**. Address lain harus tetap ada.

Jelaskan:

1. Assertion mana yang terlalu umum atau nggak benar-benar memverifikasi requirement?
2. Bagaimana cara memastikan test menghapus address **Office Jakarta**, bukan address lain?
3. Assertion apa yang lebih tepat untuk status setelah delete?
4. Bagaimana memastikan pengecekan bahwa **Office Jakarta** sudah hilang nggak pass terlalu cepat?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- Tentukan dulu card **Office Jakarta** sebelum menjalankan delete supaya test jelas memilih address yang benar.
- Sebelum delete, pastikan card **Office Jakarta** memang visible.
- Setelah delete, verify status **Address deleted** dengan text yang cukup spesifik.
- Verify bahwa card **Office Jakarta** sudah tidak ada atau sudah hidden setelah action selesai.
- Jangan mengecek seluruh text **Address** hilang karena address lain memang harus tetap ada.
- Hapus assertion untuk loading class kecuali class tersebut memang bagian dari requirement yang ingin diuji.

Status **Address deleted** memastikan proses delete sudah selesai, lalu pengecekan pada card **Office Jakarta** memastikan record yang benar memang sudah hilang.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa mulai dari expected result, menentukan hal yang memang perlu diverifikasi, lalu memilih Playwright assertion yang sesuai dan melakukan retry saat UI masih berubah.

Selesaikan Core Practice tentang form validation state.

Additional Practice tetap tersedia untuk latihan visibility, text, value, state, count, attribute, dan soft assertion.

Di lesson berikutnya, kita akan menggunakan cara berpikir ini untuk menentukan test apa saja yang perlu dibuat berdasarkan product risk.
