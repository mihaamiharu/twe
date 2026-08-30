---
title: 'Tentukan Test Scenario Berdasarkan Product Risk'
description: 'Tentukan test scenario berdasarkan product risk, lalu pisahkan setiap behavior supaya test lebih jelas, fokus, dan mudah di-debug.'
---

## Setelah lesson ini, kamu bisa

- menentukan precondition, action, dan expected result dari product risk yang ingin diuji;
- membedakan positive, negative, dan boundary scenario yang memang memberi coverage berbeda dari variasi yang sebenarnya menguji hal yang sama;
- memilih beberapa test scenario yang mewakili failure mode berbeda tanpa mengulang flow yang sama;
- menjaga setiap test tetap fokus sambil menambahkan assertion yang memang dibutuhkan untuk expected result; serta
- me-review test case yang menguji behavior di luar requirement, membuat flow jadi membingungkan, atau punya dependency yang bikin test sulit dijalankan sendiri.

## Kenapa ini penting buat QA

**“Automate checkout page”** terdengar seperti sebuah task, tapi itu belum cukup untuk menentukan test apa yang perlu dibuat.

Checkout bisa gagal dengan banyak cara:

- produk yang tersedia nggak bisa dibeli;
- produk yang out of stock tetap bisa masuk ke cart;
- payment yang declined tetap membuat order;
- quantity di luar range masih diterima; atau
- satu customer bisa melihat order milik customer lain.

Satu happy-path test yang panjang nggak akan mencakup semua risiko tersebut. Tapi membuat banyak test yang hanya mengulang flow yang sama dengan data berbeda juga belum tentu memberi coverage yang berguna.

Test automation tetap perlu mengikuti cara berpikir yang sama seperti saat kita membuat manual test yang baik: starting state-nya jelas, action-nya menguji behavior tertentu, dan expected result-nya bisa menunjukkan kalau behavior tersebut salah.

## Cara berpikir yang perlu kamu pegang

Susun setiap scenario dari risk yang memang ingin diuji:

```text
Product risk atau business rule
          ↓
Starting state dan test data
          ↓
Satu behavior yang ingin diuji
          ↓
Expected result yang perlu diverifikasi
```

Setelah itu, pilih beberapa scenario yang mewakili kemungkinan failure yang berbeda:

![Checkout rule diubah menjadi beberapa scenario yang fokus: positive scenario, negative scenario untuk business rule, dan boundary scenario. Masing-masing punya precondition, action, serta expected result sendiri.](/images/tutorials/risk-scenario-portfolio.svg)

_Positive, negative, dan boundary membantu kita melihat scenario dari sisi yang berbeda. Tapi isi test tetap ditentukan oleh product rule, bukan sekadar label tersebut._

Untuk setiap test scenario, tanyakan:

> Kalau test ini fail, product risk apa yang sedang ditunjukkan?

Kalau dua test menguji risk, boundary, dan expected result yang sama, kemungkinan salah satunya hanya mengulang coverage yang sudah ada.

Sebaliknya, kalau satu test mencoba menguji banyak behavior yang nggak berkaitan sekaligus, lebih baik pisahkan menjadi beberapa scenario yang lebih fokus.

## Coba kita bedah contoh nyata

Product rule checkout-nya adalah:

- hanya produk yang available yang boleh di-order;
- quantity harus dari 1 sampai 10;
- declined payment tidak boleh membuat order; dan
- successful order harus menampilkan satu generated order number.

### 1. Susun scenario dari masing-masing risk sebelum menulis code

| Risk                           | Starting state dan test data           | Action                         | Expected result                                                   |
| ------------------------------ | -------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Valid purchase gagal           | Available item, quantity 1, valid card | Submit checkout                | Confirmation muncul dan satu order number ditampilkan             |
| Out-of-stock item terbeli      | Item sudah dalam state out of stock    | Coba tambahkan item            | Guidance muncul dan item tidak masuk ke cart                      |
| Declined payment membuat order | Available item, declined test payment  | Submit checkout                | Decline alert muncul dan order number tidak dibuat                |
| Quantity boundary salah        | Available item                         | Coba quantity 0, 1, 10, dan 11 | Value valid diterima dan value di luar range menampilkan guidance |

Table ini lebih berguna daripada hanya memberi label **satu positive test dan tiga negative test**. Dari sini kita bisa langsung melihat alasan kenapa setiap scenario perlu ada.

### 2. Pilih satu positive scenario utama

Positive scenario digunakan untuk memastikan flow utama yang memang seharusnya berhasil:

```text
Given active customer dan available Widget Pro
And quantity 1 dengan valid test payment
When customer submit checkout
Then order confirmation muncul
And tepat satu generated order number ditampilkan
```

Di scenario ini, confirmation dan order number sama-sama dibutuhkan untuk memastikan order berhasil dibuat.

Jadi, beberapa assertion tetap masuk akal selama semuanya masih memverifikasi behavior yang sama.

Nggak perlu ikut mengecek navigation bar, footer, theme, atau account field lain yang nggak berhubungan dengan checkout. Kalau bagian tersebut fail, kita jadi sulit tahu apakah masalahnya benar-benar ada di checkout atau bukan.

### 3. Buat negative scenario untuk business rule

Sekarang fokus ke declined payment:

```ts
test('declined payment shows guidance and creates no order', async ({
  page,
}) => {
  await page.goto('/checkout');
  await page.getByLabel('Card number').fill('4000 0000 0000 0002');
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.getByRole('alert')).toHaveText('Payment declined');
  await expect(page.getByText(/^Order number:/)).toHaveCount(0);
});
```

Anggap test environment memang sudah dikonfigurasi supaya test card tersebut menghasilkan declined payment. Jangan pernah menggunakan real payment credential di automation test.

Assertion **Payment declined** memastikan payment memang ditolak. Setelah itu, test juga memastikan order number tidak dibuat.

Kedua assertion ini penting karena scenario bukan hanya mengecek error message, tapi juga memastikan order tidak tetap dibuat setelah payment gagal.

Pastikan juga scenario dimulai tanpa confirmation atau order number yang tersisa dari test sebelumnya. Module 7 akan membahas isolation dan test data lebih lanjut.

### 4. Pilih boundary yang memang perlu diuji

Allowed quantity range adalah 1 sampai 10. Beberapa value yang cukup mewakili rule tersebut:

- value normal di dalam range, misalnya 5;
- minimum valid: 1;
- maximum valid: 10;
- tepat di bawah minimum: 0; dan
- tepat di atas maximum: 11.

Menguji semua value dari 2 sampai 9 lewat browser biasanya hanya mengulang behavior yang sama.

Tambahkan case lain kalau memang ada risk atau behavior berbeda yang perlu diuji.

Validation logic bisa diuji lebih detail di layer yang lebih rendah, sedangkan browser test cukup memastikan rule penting tersebut bekerja dengan benar dari sisi user.

### 5. Pastikan setiap test bisa dijalankan sendiri

Hindari dependency seperti ini:

```text
Test A membuat customer
        ↓
Test B mengandalkan customer dari Test A
        ↓
Test C menghapus customer yang sama
```

Kalau Test A fail atau urutan eksekusi berubah, Test B dan Test C bisa ikut fail padahal behavior yang mereka uji sebenarnya nggak bermasalah.

Setiap test sebaiknya menyiapkan atau mendapatkan state yang dibutuhkan sendiri.

Sedikit setup yang diulang kadang justru lebih jelas daripada membuat test saling bergantung pada urutan.

Di lesson ini kita fokus dulu pada prinsip bahwa setiap test harus bisa berjalan secara independen. Module berikutnya akan membahas browser context, test data, authentication state, cleanup, dan cara implementasinya.

### 6. Jangan membuat expected behavior menjadi optional

Test kadang ditulis seperti ini:

```ts
if (await page.getByRole('alert').isVisible()) {
  await expect(page.getByRole('alert')).toContainText('Out of stock');
}
```

Kalau alert **Out of stock** memang expected result, code seperti ini bermasalah.

Saat alert tidak muncul, test hanya melewati assertion dan tetap bisa pass.

Lebih baik kontrol starting state, jalankan action, lalu langsung verify bahwa alert yang diharapkan memang muncul.

Conditional logic masih bisa digunakan untuk setup tertentu yang memang bisa berbeda antar-environment. Tapi jangan gunakan condition untuk membuat behavior yang sedang diuji menjadi optional.

## Kapan pendekatan ini cocok dipakai?

Gunakan positive scenario untuk flow utama yang memang penting bagi user atau business.

Tambahkan negative scenario untuk business rule yang kalau gagal bisa menyebabkan masalah pada product, financial, security, atau user experience.

Tambahkan boundary scenario kalau behavior berubah pada batas tertentu.

Nggak perlu membuat satu negative test untuk setiap random invalid value. Kalau beberapa value sebenarnya menguji rule yang sama, kelompokkan sebagai satu category lalu pilih beberapa representative case yang cukup.

Tambahkan case lain hanya kalau memang ada risk berbeda, misalnya karena format, locale, encoding, security, atau behavior aplikasi yang berbeda.

Usahakan satu scenario fokus pada satu behavior. Beberapa assertion tetap boleh digunakan kalau semuanya masih memverifikasi behavior yang sama.

Pisahkan menjadi test lain kalau setup, action, expected result, atau alasan failure-nya sudah menguji rule yang berbeda.

Browser automation juga nggak harus menguji semua combination. Untuk calculation atau validation yang punya banyak variasi, test di layer yang lebih rendah biasanya lebih efisien.

Gunakan browser test untuk flow atau integration yang memang penting dari sisi user dan perlu diverifikasi secara end-to-end.

Jangan menggabungkan banyak scenario hanya supaya setup lebih cepat. Tapi jangan juga memisahkan test hanya karena ingin mengikuti aturan seperti **“satu assertion per test.”**

Yang lebih penting adalah ketika test fail, kita bisa langsung memahami behavior apa yang bermasalah dan kenapa.

## Kalau gagal, mulai cek dari mana?

Kalau test suite mulai sering fail, lambat, atau sulit di-maintain, cek dulu design test-nya sebelum menambah retry.

1. Apakah setiap test punya product risk atau business rule yang jelas?
2. Apakah starting state dan test data sudah dikontrol?
3. Apakah test bergantung pada data atau hasil dari test lain?
4. Apakah ada conditional logic yang membuat expected behavior bisa terlewat?
5. Apakah banyak test sebenarnya menguji rule yang sama dengan data berbeda?
6. Apakah satu test mencoba menguji beberapa business behavior yang nggak berkaitan?
7. Kalau test fail, apakah kita bisa langsung tahu rule mana yang bermasalah?
8. Apakah ada banyak variasi yang sebenarnya lebih cocok diuji di layer yang lebih rendah?

Kalau negative scenario malah pass, cek apakah test benar-benar sudah berada di invalid state yang ingin diuji.

Kalau test hanya fail saat dijalankan parallel, cek apakah beberapa test memakai account, inventory, order, atau data lain yang sama.

Jangan langsung mengubah suite menjadi serial hanya supaya test pass. Cari dulu shared state atau test data yang menyebabkan conflict.

Saat review test scenario, cek beberapa hal ini:

- Apakah scenario menggunakan requirement, test account, boundary, atau expected message yang belum dikonfirmasi?
- Apakah setiap scenario memang berasal dari business rule atau product risk yang jelas?
- Apakah beberapa positive atau negative scenario sebenarnya hanya mengulang flow yang sama?
- Apakah boundary case dipilih di sekitar batas yang memang mengubah behavior?
- Apakah ada `if` yang membuat expected result menjadi optional?
- Apakah satu test bergantung pada data atau urutan eksekusi test lain?
- Apakah ada assertion yang nggak berhubungan dengan behavior yang sedang diuji?
- Apakah sensitive data muncul di source code, test title, log, atau report?
- Apakah beberapa variasi bisa diuji lebih cepat dan lebih jelas di layer selain UI?
- Apakah setiap scenario memang cukup penting untuk terus di-maintain?

Jumlah test bisa terus bertambah. Yang penting bukan membuat test sebanyak mungkin, tapi memilih scenario yang benar-benar membantu tim menemukan masalah yang penting.

## Coba cek pemahamanmu

Sebuah usulan test suite untuk quantity rule 1 sampai 10 berisi scenario berikut:

1. quantity 1 berhasil;
2. quantity 2 berhasil;
3. quantity 3 berhasil;
4. quantity 4 berhasil;
5. quantity 11 menampilkan error;
6. valid purchase berhasil, lalu test lain menggunakan order tersebut untuk menguji cancellation; dan
7. out-of-stock test hanya mengecek guidance kalau guidance tersebut muncul.

Tentukan scenario mana yang perlu dipertahankan, ditambah, digabung, dipisahkan, atau diperbaiki. Jelaskan alasan di balik setiap keputusan.

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- Pertahankan quantity 1 karena itu adalah minimum valid boundary.
- Quantity 2, 3, dan 4 nggak perlu semuanya diuji lewat browser kalau behavior-nya sama. Pilih satu value di tengah range sebagai representative case.
- Tambahkan quantity 10 untuk maximum valid boundary dan quantity 0 untuk value tepat di bawah minimum. Quantity 11 tetap dipertahankan untuk value tepat di atas maximum.
- Kalau numeric validation punya banyak variasi, pertimbangkan apakah sebagian coverage lebih cocok diuji di layer yang lebih rendah.
- Test cancellation harus membuat atau mendapatkan order-nya sendiri, bukan bergantung pada hasil dari test sebelumnya.
- Hapus condition pada out-of-stock scenario. Pastikan starting state memang out of stock, lalu langsung verify guidance muncul dan item tidak masuk ke cart.
- Tetap punya satu positive purchase scenario utama yang memastikan order benar-benar berhasil dibuat.

Hasil akhirnya lebih sedikit test, tapi setiap scenario punya alasan yang jelas dan menguji kemungkinan failure yang berbeda.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menentukan positive, negative, dan boundary scenario dari sebuah business rule, menghindari test yang hanya mengulang coverage yang sama, serta mengenali dependency dan condition yang bisa membuat test kurang reliable.

Lesson ini fokus pada reasoning, jadi tidak ada code challenge terpisah.

Module 6 selesai setelah kedua Core lesson selesai dan Core Practice untuk assertion berhasil dikerjakan.

Di Module 7, kita akan masuk ke cara mengatur starting state, test data, authentication, cleanup, dan isolation supaya scenario yang sudah dirancang bisa dijalankan secara reliable.
