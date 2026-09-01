---
title: 'JavaScript yang Perlu Kamu Tahu untuk QA Automation'
description: 'Gunakan JavaScript untuk mengatur test data, membuat logic sederhana, dan memahami code test tanpa menjadikan lesson ini sebagai course application development.'
---

## Setelah lesson ini, kamu bisa

- memilih `const` atau `let` berdasarkan apakah variable perlu di-assign ulang;
- menggunakan object untuk menyimpan satu test case dan array untuk menyimpan beberapa case yang sejenis;
- menulis function sederhana untuk rule atau perhitungan yang dipakai di test;
- menggunakan condition tanpa membuat test melewatkan behavior utama yang seharusnya diverifikasi; dan
- mendiagnosis masalah value yang umum sebelum menambah wait atau retry.

## Kenapa ini penting buat QA

Coba bayangin ada checkout test hasil generate yang menulis nama produk, harga, dan quantity berulang kali di beberapa bagian code. Ketika harga berubah, seseorang cuma update sebagian value-nya. Akibatnya, test masih jalan tapi expected result dihitung dari data yang sudah nggak sesuai.

Contoh lain, code-nya punya condition seperti: **“kalau produknya ada, jalankan assertion.”** Ketika produk hilang karena bug, assertion malah nggak dijalankan dan test tetap pass.

Kamu nggak perlu menguasai JavaScript seperti application developer untuk bisa menemukan masalah seperti ini. Yang penting, kamu cukup paham code-nya untuk menjawab:

- Test scenario ini menggunakan data apa?
- Value mana yang bisa berubah?
- Logic atau perhitungan apa yang dilakukan?
- Apakah ada condition yang bisa membuat bug terlewat dan test tetap pass?

## Cara berpikir yang perlu kamu pegang

Pisahkan dulu tiga bagian ini:

```text
Test data       menyimpan data yang dipakai scenario
Function kecil  memberi nama yang jelas pada logic atau perhitungan
Test flow       menyiapkan state, melakukan action, lalu verify expected result
```

Fitur JavaScript di lesson ini membantu kita mengatur bagian-bagian tersebut:

| Fitur     | Kegunaan untuk QA                                                               |
| --------- | ------------------------------------------------------------------------------- |
| `const`   | Mendeklarasikan variable yang nggak perlu di-assign ulang                        |
| `let`     | Mendeklarasikan variable yang memang perlu di-assign ulang                       |
| Object    | Mengelompokkan beberapa data yang masih berhubungan dalam satu test case        |
| Array     | Menyimpan beberapa case atau value yang sejenis                                 |
| Function  | Memisahkan logic atau perhitungan supaya lebih mudah dibaca dan digunakan ulang |
| Condition | Menjalankan logic tertentu hanya ketika memang ada kondisi yang perlu dibedakan |

Saat review code hasil generate, baca pelan-pelan dari data yang dipakai, perubahan value-nya, condition yang ada, lalu assertion yang dijalankan di browser.

Setiap perubahan di code sebaiknya punya tujuan yang jelas. Pastikan logic test dan bagian yang verify expected result tetap mudah dibedakan.

`const` menjaga binding variable, bukan membuat semua isi object atau array menjadi tetap. Contohnya, code ini tetap valid:

```js
const product = { quantity: 1 };
product.quantity = 2;
```

Variable `product` masih menunjuk ke object yang sama, tapi value `quantity` di dalamnya berubah dari `1` menjadi `2`.

Untuk test data, usahakan value tetap konsisten dan hanya diubah kalau test scenario memang membutuhkan perubahan tersebut.

## Coba kita bedah contoh nyata

Di scenario ini, kita mau memastikan subtotal di cart tetap benar untuk produk dan quantity tertentu.

Mulai dengan menyimpan test data-nya:

```js
const cartCase = {
  productName: 'Mechanical Keyboard',
  unitPrice: 120,
  quantity: 2,
};
```

Object cocok digunakan karena data seperti `productName`, `unitPrice`, dan `quantity` masih berhubungan dalam satu test case.

Berikutnya, pisahkan perhitungan subtotal ke dalam function:

```js
function expectedSubtotal(unitPrice, quantity) {
  return unitPrice * quantity;
}

const subtotal = expectedSubtotal(cartCase.unitPrice, cartCase.quantity);
```

Function ini punya satu tujuan yang jelas: menghitung expected subtotal dari `unitPrice` dan `quantity`.

Function tersebut hanya menerima input dan menghasilkan output. Ia nggak berinteraksi dengan browser atau mengubah state lain di luar perhitungan tersebut.

Sekarang test data tersebut bisa langsung digunakan di automated test.

Untuk contoh ini, anggap halaman cart punya input **“Quantity”** dan button **“Update cart”**:

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

Browser test di atas hanya ilustrasi. Core Practice di lesson ini fokus pada controlled JavaScript data dan nggak menyediakan aplikasi `/products` yang bisa dijalankan.

Locator dan format currency di contoh ini tetap harus disesuaikan dengan aplikasi yang sebenarnya.

JavaScript membantu kita menyimpan test data dan menghitung expected subtotal dengan lebih rapi. Tapi perhitungan JavaScript tersebut belum membuktikan bahwa subtotal di aplikasi benar—hasilnya tetap harus diverifikasi lewat automated test.

### Ubah test data dari satu tempat

Misalnya requirement berubah dan quantity sekarang menjadi tiga keyboard. Cukup update test data-nya:

```diff
-  quantity: 2,
+  quantity: 3,
```

Saat test dijalankan lagi, browser akan mengisi quantity `3` dan expected subtotal juga otomatis dihitung dari value yang sama.

Jangan update expected result secara manual hanya supaya test kembali pass. Jalankan test, lalu pastikan aplikasi memang menampilkan subtotal yang sesuai dengan quantity baru.

Dengan menyimpan test data di satu tempat, perubahan seperti ini jadi lebih mudah dibaca, di-review, dan diubah lagi kalau diperlukan.

### Simpan beberapa case sejenis dalam array

Kalau aplikasi memang sengaja mendukung beberapa invalid quantity, kita bisa menyimpannya dalam array:

```js
const invalidQuantities = [0, -1, 999];
```

Kalau setiap quantity dianggap sebagai test case yang berbeda, buat masing-masing sebagai test terpisah supaya hasil pass atau fail-nya tetap terlihat jelas:

```ts
for (const quantity of invalidQuantities) {
  test(`rejects quantity ${quantity}`, async ({ page }) => {
    // arrange, act, and assert untuk satu case ini
  });
}
```

Hindari memasukkan secret atau data customer yang sensitif ke dalam nama test, karena nama tersebut akan muncul di log dan report.

### Bedakan `undefined` dan `null`

* `undefined` biasanya berarti value belum diberikan atau hasil lookup nggak menemukan data.
* `null` biasanya berarti value memang sengaja dibuat kosong.

Arti pastinya tetap tergantung pada behavior aplikasi dan kesepakatan tim. Jangan anggap `undefined` dan `null` sama hanya karena keduanya sama-sama terlihat seperti value kosong.

## Kapan pendekatan ini cocok dipakai?

Gunakan object kalau satu test case punya beberapa data yang saling berhubungan dan lebih mudah dibaca kalau setiap value punya nama yang jelas.

Gunakan array kalau kamu punya beberapa value atau test case dengan pola yang sama.

Gunakan function kalau sebuah nama bisa membuat rule, perhitungan, atau setup lebih mudah dipahami. Function tetap berguna walaupun baru dipanggil sekali; penggunaan berulang bukan satu-satunya alasan untuk membuatnya.

Jangan membuat helper kalau isinya cuma membungkus satu baris sederhana:

```js
async function clickSave(page) {
  await page.getByRole('button', { name: 'Save' }).click();
}
```

Helper seperti ini justru menambah satu tempat lagi yang harus dibuka saat membaca test, tanpa membuat intent-nya jadi lebih jelas. Buat helper kalau memang ada logic yang berulang atau ada bagian test yang layak dipisahkan.

Gunakan condition hanya kalau perbedaan behavior memang bagian dari requirement.

Misalnya:

> Kalau discount ada, verify. Kalau nggak ada, skip.

Condition seperti ini bisa membuat bug terlewat kalau discount seharusnya wajib muncul. Lebih baik pastikan starting state-nya jelas, lalu fail kalau expected result yang wajib justru nggak muncul.

Jangan memasukkan terlalu banyak test case ke dalam satu test hanya karena semuanya bisa dijalankan dengan loop. Kalau setiap case punya risiko dan expected result sendiri, lebih baik masing-masing punya hasil pass atau fail yang terpisah.

## Kalau gagal, mulai cek dari mana?

Misalnya code ini menghasilkan error `Cannot read properties of undefined (reading 'unitPrice')`:

```js
const selected = products.find(
  (product) => product.name === 'Mechanical Keyboard',
);

const subtotal = selected.unitPrice * 2;
```

Error tersebut berarti `find()` nggak menemukan product yang cocok, sehingga `selected` berisi `undefined`.

Ini biasanya bukan masalah timing atau browser yang perlu menunggu lebih lama, kecuali data di `products` memang belum selesai dimuat.

Coba cek:

1. Product apa saja yang sebenarnya ada di `products`?
2. Apakah nama **“Mechanical Keyboard”** sama persis dengan data yang tersedia?
3. Apakah product tersebut nggak ada karena test setup bermasalah?
4. Kalau product memang nggak ditemukan, apakah test seharusnya langsung fail dengan error message yang jelas?

Kalau product tersebut memang wajib tersedia untuk test, buat pengecekannya jelas:

```js
if (!selected) {
  throw new Error('Expected Mechanical Keyboard in controlled test data');
}

const subtotal = selected.unitPrice * 2;
```

Menambah retry nggak akan memperbaiki product name yang salah atau test data yang memang nggak tersedia.

Optional chaining seperti `selected?.unitPrice` juga belum tentu membantu. Code mungkin lanjut berjalan, tapi `undefined` hanya berpindah ke bagian lain dan root cause jadi lebih sulit ditemukan.

Saat review perubahan JavaScript di test, coba cek beberapa hal ini:

- Mana value yang memang bagian dari test data, dan mana yang masih berupa asumsi tentang behavior aplikasi?
- Apakah `let` memang dibutuhkan karena value-nya akan di-assign ulang, atau cuma dipakai karena kebiasaan?
- Apakah helper benar-benar membuat logic test lebih jelas, atau cuma memindahkan satu baris code ke tempat lain?
- Apakah condition `if` bisa membuat assertion nggak dijalankan tapi test tetap pass?
- Apakah beberapa test case yang seharusnya punya hasil terpisah malah digabung dalam satu loop?
- Apakah lookup seperti `find()` bisa menghasilkan `undefined`, dan kalau itu terjadi apakah test fail dengan jelas?
- Apakah secret atau personal data masuk ke nama test, log, atau source code?

Kalau membuat abstraction, pastikan hasilnya membuat test lebih mudah dibaca dan dipahami, bukan cuma membuat code jadi lebih pendek.

## Coba cek pemahamanmu

Review code berikut:

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

Coba jawab:

1. Setelah `find()` dijalankan, value apa yang ada di `keyboard`?
2. Kenapa `if (keyboard)` bisa bermasalah kalau test memang mengharuskan **Mechanical Keyboard** tersedia?
3. Kalau product tersebut nggak ditemukan, bagaimana caranya supaya test langsung fail dengan error message yang jelas?
4. Dari code di atas, mana yang merupakan test data, logic untuk mencari product, dan perhitungan expected value?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* `keyboard` akan berisi `undefined` karena nggak ada product dengan nama **“Mechanical Keyboard”** di dalam array.
* `if (keyboard)` bisa membuat test melewati seluruh logic ketika product yang seharusnya tersedia justru nggak ditemukan. Kalau assertion ada di dalam condition tersebut, test bisa tetap pass tanpa verify behavior yang seharusnya diuji.
* Kalau product tersebut wajib tersedia, buat test langsung fail dengan error message yang jelas sebelum mengakses `unitPrice`.
* Array berisi test data, `find()` digunakan untuk mencari product, dan `unitPrice * 2` digunakan untuk menghitung expected value.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menggunakan object dan array untuk menyimpan test data, membuat function sederhana untuk perhitungan, dan menemukan condition yang bisa membuat assertion terlewat.

Selesaikan Core Practice JavaScript yang memang relevan dengan automation. Challenge tentang condition dan array method bisa kamu kerjakan sebagai Additional Practice kalau ingin latihan lebih lanjut tentang false pass dan pengelolaan test data.

Di lesson berikutnya, kita akan membahas asynchronous operation supaya kamu lebih paham kapan sebuah value atau browser action harus selesai sebelum test lanjut ke step berikutnya.
