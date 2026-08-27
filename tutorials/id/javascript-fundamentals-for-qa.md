---
title: 'JavaScript Secukupnya untuk Otomasi QA'
description: 'Susun test data, beri nama pada perhitungan kecil, dan review logic test tanpa berbelok menjadi kursus application development.'
---

## Setelah lesson ini, kamu bisa

- melakukan perubahan kecil pada test data dengan memilih `const` atau `let` berdasarkan apakah binding perlu di-assign ulang;
- memodelkan satu test case dengan object dan beberapa case sejenis dengan array;
- menulis function kecil yang memberi nama jelas pada rule atau perhitungan QA;
- memakai condition tanpa membuat test diam-diam melewatkan tujuan utamanya; dan
- mendiagnosis value error yang umum sebelum menambah wait atau retry.

## Kenapa ini penting buat QA

Coba bayangin ada checkout test hasil generate yang menyalin nama produk, harga, dan quantity ke lima baris berbeda. Harga berubah, seseorang cuma memperbarui empat baris, lalu test menghitung ekspektasi dari data yang sudah stale.

Atau kodenya bilang, “Kalau produknya ada, jalankan assertion.” Ketika produk hilang karena defect, assertion justru dilewati dan test tetap hijau.

Kamu nggak perlu mengambil kursus JavaScript umum untuk mereview masalah seperti ini. Kamu butuh code literacy secukupnya untuk menjawab:

- Data apa yang dipakai skenario ini?
- Value mana yang bisa berubah?
- Perhitungan atau keputusan apa yang dibuat?
- Apakah data yang hilang bisa mengubah defect sungguhan menjadi false pass?

## Cara berpikir yang perlu kamu pegang

Pisahkan tiga tanggung jawab ini:

```text
Test data       menjelaskan case
Function kecil  memberi nama pada perhitungan atau rule
Test flow       mengatur state, melakukan action, lalu membuat assertion
```

Fitur JavaScript di lesson ini membantu tiga tanggung jawab tersebut:

| Fitur     | Kegunaan untuk QA                                        |
| --------- | -------------------------------------------------------- |
| `const`   | Memberi nama pada value yang tidak perlu di-reassign     |
| `let`     | Memberi nama pada value yang memang harus di-reassign    |
| Object    | Mengelompokkan fakta bernama tentang satu case           |
| Array     | Menyimpan koleksi case atau value yang sejenis           |
| Function  | Memberi nama pada perhitungan atau operasi yang bermakna |
| Condition | Memilih jalur hanya kalau variasinya memang disengaja    |

Saat mereview kode hasil generate, baca dengan urutan itu: kenali case-nya, ikuti perubahan value, periksa branch condition, lalu lihat assertion browser-nya. Perubahan yang aman seharusnya punya satu tujuan yang jelas dan tetap membuat batas antara logic dan bukti terlihat.

`const` menjaga binding variable, bukan membuat semua isi object atau array menjadi tetap. Kode ini valid:

```js
const product = { quantity: 1 };
product.quantity = 2;
```

Variable `product` masih menunjuk ke object yang sama. Untuk test data, usahakan state-nya stabil dan ubah hanya kalau skenarionya memang membutuhkan perubahan itu.

## Coba kita bedah contoh nyata

Risikonya adalah cart menampilkan subtotal yang salah untuk produk dan quantity yang sudah diketahui.

Mulai dengan memodelkan case:

```js
const cartCase = {
  productName: 'Mechanical Keyboard',
  unitPrice: 120,
  quantity: 2,
};
```

Object cocok dipakai karena ketiga value ini adalah fakta bernama tentang satu skenario. Berikutnya, beri nama pada perhitungannya:

```js
function expectedSubtotal(unitPrice, quantity) {
  return unitPrice * quantity;
}

const subtotal = expectedSubtotal(cartCase.unitPrice, cartCase.quantity);
```

Function-nya kecil, tapi menyatakan ide testing yang nyata. Function ini menerima input dan mengembalikan output tanpa mengklik halaman atau mengubah global state yang tersembunyi.

Sekarang test bisa menghubungkan data dengan perilaku produk:

Untuk skenario ini, anggap kontrak cart menyediakan input `Quantity` yang punya label dan action `Update cart`:

```ts
test('cart shows the expected subtotal', async ({ page }) => {
  await page.goto('/products');

  await page
    .getByRole('button', { name: `Add ${cartCase.productName} to cart` })
    .click();
  await page.getByLabel('Quantity').fill(String(cartCase.quantity));
  await page.getByRole('button', { name: 'Update cart' }).click();

  await expect(page.getByTestId('cart-subtotal')).toHaveText(`$${subtotal}`);
});
```

Locator dan format currency di atas adalah kontrak produk yang tetap harus diverifikasi. JavaScript hanya membantu menjaga case dan perhitungan ekspektasinya tetap terbaca; JavaScript sendiri tidak membuktikan rule produk.

### Lakukan satu perubahan aman

Misalnya requirement berubah: quantity-nya sekarang tiga keyboard. Ubah test data di satu tempat:

```diff
-  quantity: 2,
+  quantity: 3,
```

Flow browser yang sama sekarang akan mengisi `3`, dan `subtotal` yang dihitung dari data itu akan ikut berubah. Jangan mengubah expected text secara terpisah hanya supaya test kembali hijau. Jalankan test secara fokus, lalu pastikan produk memang menampilkan value baru. Satu sumber test data membuat perubahan lebih mudah direview dan di-revert.

### Case sejenis cocok disimpan dalam collection

Kalau produk memang sengaja mendukung beberapa invalid quantity, array bisa menyimpannya:

```js
const invalidQuantities = [0, -1, 999];
```

Kalau setiap value mewakili skenario independen, pastikan hasilnya juga dilaporkan secara independen:

```ts
for (const quantity of invalidQuantities) {
  test(`rejects quantity ${quantity}`, async ({ page }) => {
    // arrange, act, and assert untuk satu case ini
  });
}
```

Jangan memasukkan secret atau data customer yang sensitif ke judul test hasil generate. Judul itu akan muncul di log dan report.

### Data yang hilang berbeda dengan data yang sengaja kosong

- `undefined` biasanya berarti value tidak diberikan atau proses lookup tidak menemukan hasil.
- `null` biasanya berarti value memang sengaja dibuat kosong.

Makna tepatnya tetap mengikuti kontrak produk dan kesepakatan tim. Jangan menganggap keduanya sama hanya karena terlihat “sama-sama kosong.”

## Kapan pendekatan ini cocok dipakai?

Pakai object kalau named field membuat satu skenario lebih gampang direview. Pakai array kalau beberapa value termasuk ke dalam satu jenis collection. Pakai function kalau ia memberi nama pada rule, perhitungan, atau setup capability yang dipakai berulang.

Jangan membuat helper yang cuma menyembunyikan satu baris sederhana:

```js
async function clickSave(page) {
  await page.getByRole('button', { name: 'Save' }).click();
}
```

Helper itu menambah tempat lain yang perlu dibuka tanpa menambah domain meaning. Tunggu sampai ada pengulangan atau tanggung jawab yang memang jelas.

Gunakan condition hanya kalau variasinya adalah bagian dari requirement. “Kalau discount ada, verifikasi; kalau tidak ada, jangan lakukan apa-apa” bisa membuat required discount yang hilang tetap lolos. Lebih baik kontrol state-nya atau fail dengan pesan yang berguna.

Jangan memasukkan banyak data case ke satu test hanya karena kamu bisa membuat loop. Risiko yang independen layak mendapat hasil yang independen.

## Kalau gagal, mulai cek dari mana?

Misalnya kode ini menghasilkan `Cannot read properties of undefined (reading 'unitPrice')`:

```js
const selected = products.find(
  (product) => product.name === 'Mechanical Keyboard',
);

const subtotal = selected.unitPrice * 2;
```

Error itu berarti lookup mengembalikan `undefined`. Bukan berarti browser butuh waktu lebih lama, kecuali array-nya sendiri memang dimuat secara asynchronous.

Periksa:

1. Value apa saja yang sebenarnya ada di `products`?
2. Apakah identitas produknya ditulis dengan ejaan dan huruf besar-kecil yang benar?
3. Apakah produk yang diharapkan hilang karena setup gagal?
4. Kalau tidak ada hasil, apakah skenario ini seharusnya fail dengan jelas?

Buat asumsi yang hilang menjadi eksplisit:

```js
if (!selected) {
  throw new Error('Expected Mechanical Keyboard in controlled test data');
}

const subtotal = selected.unitPrice * 2;
```

Retry nggak akan memperbaiki lookup yang salah. Optional chaining seperti `selected?.unitPrice` mungkin cuma memindahkan `undefined` ke tempat lain dan membuat diagnosis makin sulit.

## Review hasil buatan AI

Saat AI mengubah JavaScript di sekitar test, tanyakan:

- Mana value yang merupakan scenario data dan mana yang merupakan asumsi produk?
- Apakah `let` dipakai karena reassignment memang diperlukan, atau cuma kebiasaan?
- Apakah helper memberi nama pada tanggung jawab QA yang nyata atau cuma menyembunyikan syntax?
- Apakah branch `if` bisa melewatkan assertion lalu tetap pass?
- Apakah beberapa risiko dipadatkan ke satu loop dan satu report entry?
- Apakah lookup bisa menghasilkan `undefined`, dan apakah kemungkinan itu ditangani dengan jujur?
- Apakah secret atau personal data ditulis ke judul, log, atau source code?

Setiap abstraction seharusnya membuat test lebih gampang dijelaskan, bukan cuma lebih pendek.

## Coba cek pemahamanmu

Review kode ini:

```js
const products = [{ name: 'Wireless Mouse', unitPrice: 40 }];

const keyboard = products.find(
  (product) => product.name === 'Mechanical Keyboard',
);

if (keyboard) {
  const expected = keyboard.unitPrice * 2;
  console.log(expected);
}
```

Jelaskan:

1. Value apa yang akan disimpan oleh `keyboard`?
2. Kenapa condition itu berbahaya di dalam test yang mewajibkan keyboard tersedia?
3. Bagaimana caramu membuat test data yang hilang menghasilkan failure yang jelas?
4. Bagian mana yang merupakan data, lookup logic, dan expected calculation?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- `keyboard` akan bernilai `undefined` karena tidak ada item array dengan nama tersebut.
- Condition-nya melewatkan semua pekerjaan saat produk yang diwajibkan hilang. Kalau assertion ada di dalam branch itu, test bisa pass tanpa memeriksa risiko.
- Lempar setup error yang spesifik—atau gunakan assertion yang sesuai dengan project—sebelum mengakses `unitPrice`.
- Array berisi data, `find` melakukan lookup, dan `unitPrice * 2` menghitung ekspektasi.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menyusun case QA kecil dengan array dan object, memberi nama pada satu perhitungan dengan function, dan menemukan logic yang diam-diam bisa menghindari assertion.

Selesaikan Core Practice JavaScript yang terintegrasi, bukan semua syntax drill. Challenge tentang condition dan array method bersifat Additional Practice kalau kamu ingin latihan ekstra tentang risiko false pass atau test data yang terkontrol. Di lesson berikutnya, kamu akan menelusuri operasi asynchronous supaya value dan browser action terjadi dalam urutan yang memang dibutuhkan.
