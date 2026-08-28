---
title: 'Ubah Product Risk Menjadi Skenario yang Fokus'
description: 'Bangun test portfolio kecil dan independen dari business rule, meaningful boundary, serta observable evidence.'
---

## Setelah lesson ini, kamu bisa

- mengubah product risk menjadi precondition, action, dan expected result yang fokus;
- membedakan useful positive, negative, atau boundary scenario dari variasi yang cuma berbeda label;
- memilih portfolio kecil yang mencakup failure mode berbeda tanpa menduplikasi flow yang sama;
- menjaga satu skenario tetap fokus sambil memakai related assertion secukupnya; serta
- me-review test case yang mengarang behavior, membuat optional path, atau menyimpan hidden dependency.

## Kenapa ini penting buat QA

“Automate checkout page” terdengar seperti sebuah task, tapi itu belum menjadi test design.

Checkout page bisa gagal dengan cara yang sangat berbeda:

- available product tidak bisa dibeli;
- out-of-stock product masuk ke cart;
- declined payment tetap membuat order;
- quantity rule menerima value di luar range; atau
- satu customer bisa melihat order customer lain.

Satu happy-path script panjang nggak mencakup semua risk tersebut. Dua puluh variation dari script yang sama juga belum tentu membantu.

Automation seharusnya mempertahankan reasoning dari manual test yang bagus: starting state-nya deliberate, action-nya menguji satu rule, dan expected result-nya bisa mengekspos failure yang penting.

## Cara berpikir yang perlu kamu pegang

Rancang setiap skenario sebagai risk contract:

```text
Risk atau business rule
          ↓
Controlled precondition dan data
          ↓
Satu behavior yang diuji
          ↓
Smallest sufficient observable evidence
```

Setelah itu, bangun portfolio dengan memilih skenario yang punya alasan gagal berbeda:

![Checkout rule diubah menjadi focused portfolio yang berisi core positive scenario, business-rule negative scenario, dan meaningful boundary scenario, masing-masing dengan precondition, action, serta evidence sendiri.](/images/tutorials/risk-scenario-portfolio.svg)

_Positive, negative, dan boundary adalah lens yang berguna. Product rule—bukan label—yang menentukan isinya._

Gunakan pertanyaan ini untuk setiap candidate:

> Kalau skenario ini gagal, product risk spesifik apa yang berhasil kita pelajari?

Kalau dua test memberi jawaban yang sama, dengan data boundary dan evidence yang sama, kemungkinan keduanya duplikat. Kalau satu test punya lima jawaban yang nggak berkaitan, kemungkinan perlu di-split.

## Coba kita bedah contoh nyata

Product rule checkout-nya adalah:

- hanya available product yang boleh di-order;
- quantity harus dari 1 sampai 10;
- declined payment tidak boleh membuat order; dan
- successful order menampilkan satu generated order number.

### 1. Buat risk table sebelum menulis code

| Risk                                      | Controlled precondition                | Action                | Sufficient evidence                                    |
| ----------------------------------------- | -------------------------------------- | --------------------- | ------------------------------------------------------ |
| Valid purchase gagal                      | Available item, quantity 1, valid card | Submit checkout       | Confirmation dan satu order number                     |
| Out-of-stock item terbeli                 | Item secara eksplisit out of stock     | Coba tambahkan item   | Guidance muncul dan nggak ada cart line untuk item itu |
| Declined payment membuat order            | Available item, declined test payment  | Submit checkout       | Decline alert dan nggak ada order number               |
| Quantity boundary diterapkan dengan salah | Available item                         | Coba 0, 1, 10, dan 11 | Boundary-specific acceptance atau guidance             |

Table ini lebih berguna daripada “satu positive test dan tiga negative test.” Table-nya menjelaskan kenapa setiap skenario ada.

### 2. Pilih satu core positive scenario

Positive scenario membuktikan supported flow yang paling bernilai:

```text
Given active customer dan available Widget Pro
And quantity 1 dengan valid test payment
When customer submit checkout
Then order confirmation muncul
And tepat satu generated order number ditampilkan
```

Confirmation dan identifier adalah related evidence untuk satu behavior. Beberapa assertion memang tepat di sini.

Jangan ikut meng-assert navigation bar, footer, theme, dan unrelated account field. Failure dari bagian itu nggak menjelaskan apakah checkout bekerja.

### 3. Rancang business-rule negative scenario

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

Anggap test environment aplikasi ini memang sengaja memetakan documented test card tersebut menjadi decline. Jangan pernah memakai real payment credential.

Exact decline alert melakukan sinkronisasi dengan failed-payment outcome. Tidak adanya order number menambah evidence bahwa dangerous side effect tidak terjadi. Skenario harus dimulai tanpa confirmation sisa dari test lain. Module 7 akan membahas cara menerapkan isolation dan data control ini dengan andal.

### 4. Pilih meaningful boundary

Allowed quantity range adalah 1 sampai 10. Partition yang berguna:

- valid interior: representative value seperti 5;
- minimum valid: 1;
- maximum valid: 10;
- tepat di bawah minimum: 0; dan
- tepat di atas maximum: 11.

Menguji 2, 3, 4, 5, 6, 7, 8, dan 9 lewat browser biasanya hanya mengulang rule yang sama. Tambahkan combination kalau memang ada implementation path atau risk yang berbeda. Validation logic mungkin butuh deeper coverage di lower layer, sedangkan browser test membuktikan critical user contract.

### 5. Jaga design setiap skenario tetap independen

Hindari hidden sequence ini:

```text
Test A membuat customer
        ↓
Test B mengasumsikan customer itu ada
        ↓
Test C menghapus customer yang sama
```

Kalau Test A gagal atau execution order berubah, B dan C memberi failure yang misleading. Setiap skenario harus bisa membuat atau memperoleh required state-nya sendiri. Sedikit explicit setup duplication kadang lebih jelas daripada order-dependent suite.

Lesson ini mendefinisikan independence requirement. Module berikutnya membahas browser context, test data, authentication state, cleanup, dan pilihan implementasi yang praktis.

### 6. Hindari optional logic di behavior yang sedang diuji

Test sering berisi:

```ts
if (await page.getByRole('alert').isVisible()) {
  await expect(page.getByRole('alert')).toContainText('Out of stock');
}
```

Kalau alert adalah expected result, code ini bisa melewati assertion lalu lulus saat produk rusak. Kontrol precondition, lakukan action, dan wajibkan alert-nya muncul.

Conditional setup kadang valid untuk environment noise di luar skenario, tapi jangan sampai membuat product behavior menjadi optional.

## Kapan pendekatan ini cocok dipakai?

Gunakan core positive scenario untuk supported flow yang bernilai. Tambahkan negative scenario untuk business rule yang kalau dilanggar menimbulkan product, financial, security, atau user-experience risk. Tambahkan boundary scenario ketika behavior berubah pada limit tertentu.

Jangan membuat satu negative test untuk setiap random invalid string. Kelompokkan value yang menguji rule sama ke equivalence partition, lalu pilih representative case. Tambahkan lebih banyak hanya jika encoding, locale, formatting, security, atau implementation path membuat risk yang berbeda.

Jaga satu behavior per scenario, tapi izinkan beberapa assertion yang bersama-sama membuktikan behavior tersebut. Split ketika setup, action, expected result, atau failure diagnosis mewakili rule berbeda.

Browser automation bukan layer yang tepat untuk semua combination. Gunakan lower-level test untuk exhaustive calculation atau validation permutation saat browser nggak memberi signal tambahan. Pertahankan end-to-end coverage untuk critical user journey dan integration boundary.

Jangan menggabungkan skenario hanya untuk menghemat setup time. Jangan memisahkannya hanya demi aturan “one assertion per test.” Optimalkan meaningful failure report dan maintainable product feedback.

## Kalau gagal, mulai cek dari mana?

Kalau suite noisy, lambat, atau sulit dipercaya, audit design-nya sebelum menambah retry:

1. Apakah setiap test bisa menyebutkan risk atau rule yang dicakup?
2. Apakah precondition eksplisit dan controlled?
3. Apakah test bergantung pada data atau side effect dari test lain?
4. Apakah conditional logic membuat expected behavior bisa dilewati?
5. Apakah banyak test mengulang equivalence partition yang sama?
6. Apakah satu test menggabungkan beberapa unrelated business outcome?
7. Apakah failure message bisa mengenali broken rule?
8. Apakah browser test mencakup permutation yang lebih cocok di lower layer?

Kalau negative scenario unexpectedly pass, pastikan test benar-benar mencapai intended invalid state. Kalau skenario hanya gagal saat parallel, curigai shared identity, inventory, order, atau account data. Jangan menyelesaikan order dependency dengan memaksa serial execution sebelum memahami shared state-nya.

Review skenario yang diusulkan dengan pertanyaan berikut:

- Apakah usulan tersebut mengasumsikan requirement, test account, boundary, atau expected message tanpa bukti?
- Bisakah setiap skenario ditelusuri ke business rule atau product risk?
- Apakah label “positive” dan “negative” menyembunyikan duplicate flow?
- Apakah boundary dipilih di sekitar perubahan rule yang nyata?
- Apakah ada `if` statement yang membuat expected outcome menjadi optional?
- Apakah satu test bergantung pada data atau execution order test lain?
- Apakah unrelated assertion ikut masuk hanya karena gampang ditambahkan?
- Apakah sensitive data muncul di source, title, log, atau report?
- Bisakah important permutation dicakup lebih cepat dan jelas di bawah UI layer?
- Bisakah kamu menjelaskan kenapa setiap retained scenario layak mendapat maintenance cost?

Daftar test bisa memanjang tanpa batas. QA judgment menentukan portfolio terkecil yang memberi confidence berguna.

## Coba cek pemahamanmu

Sebuah usulan suite untuk quantity rule 1 sampai 10 berisi test berikut:

1. quantity 1 berhasil;
2. quantity 2 berhasil;
3. quantity 3 berhasil;
4. quantity 4 berhasil;
5. quantity 11 menampilkan error;
6. valid purchase berhasil, lalu test kedua memakai ulang order tersebut untuk menguji cancellation; dan
7. out-of-stock test hanya meng-assert guidance kalau guidance kebetulan muncul.

Tentukan skenario mana yang perlu dipertahankan, ditambah, di-merge, di-split, atau dirancang ulang. Jelaskan risk di balik setiap keputusan.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Pertahankan quantity 1 karena itu minimum valid boundary.
- Ganti repeated case 2, 3, dan 4 dengan satu representative valid interior value kecuali memang menguji rule berbeda.
- Tambahkan quantity 10 dan 0 untuk maximum valid dan just-below-minimum boundary; pertahankan 11 untuk just above maximum.
- Tentukan apakah exhaustive numeric validation lebih cocok di lower test layer.
- Buat cancellation menciptakan atau memperoleh order sendiri, bukan bergantung pada previous test.
- Hapus conditional pada out-of-stock guidance; establish out-of-stock state secara eksplisit, lalu wajibkan guidance dan absence of cart line.
- Pertahankan satu core successful purchase scenario dengan sufficient confirmation evidence.

Final portfolio-nya lebih kecil tapi mencakup lebih banyak distinct failure mode.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mengubah business rule menjadi focused positive, negative, dan boundary scenario; memilih portfolio yang tidak duplikatif; serta mengenali hidden dependency atau optional expected result.

Lesson ini memakai reasoning checkpoint, bukan separate code challenge. Module 6 selesai ketika kedua Core lesson dibaca dan integrated assertion Core Practice lulus. Module 7 akan menunjukkan cara mengimplementasikan controlled state, data, dan isolation yang dibutuhkan design tersebut.
