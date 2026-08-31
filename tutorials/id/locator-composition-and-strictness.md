---
title: 'Menentukan Locator yang Tepat saat Ada Banyak Element yang Mirip'
description: 'Gunakan context yang tepat, filter card atau row yang ingin diuji, lalu manfaatkan strictness Playwright untuk menemukan locator yang masih terlalu umum.'
---

## Setelah lesson ini, kamu bisa

* menjelaskan kapan Playwright benar-benar mencari element dari sebuah locator;
* menentukan scope dari card, row, dialog, atau container yang tepat sebelum mencari target element di dalamnya;
* memfilter component yang mirip berdasarkan text, content, atau element lain yang ada di dalamnya;
* membedakan operation yang memang boleh bekerja pada beberapa element dengan action atau assertion yang membutuhkan satu target yang jelas; dan
* mendiagnosis locator yang menemukan lebih dari satu element tanpa langsung menggunakan `first()` atau `nth()`.

## Kenapa ini penting buat QA

Membayangkan satu button **“Add to Cart”** itu gampang. Tapi di halaman katalog, bisa saja ada banyak button dengan nama yang sama.

Kalau code-nya seperti ini:

```ts
await page.getByRole('button', { name: 'Add to Cart' }).click();
```

Playwright akan menemukan lebih dari satu button dan test akan fail.

Itu sebenarnya berguna, karena berarti kita belum menentukan **Add to Cart** untuk produk yang mana.

Solusinya bukan langsung memakai `.first()`.

Kalau urutan produk berubah, element pertama bisa jadi milik produk yang berbeda. Akibatnya, test bisa klik **Add to Cart** untuk produk yang salah dan tetap pass.

## Cara berpikir yang perlu kamu pegang

Kalau ada banyak element yang mirip, tentukan dulu bagian halaman yang ingin dituju:

```text
Card, row, atau container yang sesuai
                ↓
Element yang dicari di dalamnya
                ↓
Action atau assertion pada target yang tepat
```

![Sebuah repeated collection dipersempit dengan identity dan state yang bermakna sebelum satu target action, sementara nol, satu, atau banyak match memberi diagnostic signal yang berbeda.](/images/tutorials/locator-scope-strictness.svg)

_Scope menjawab “component yang mana?”, lalu locator di dalamnya menjawab “element mana yang ingin digunakan?”_

Locator di Playwright tidak langsung menyimpan daftar element saat dibuat.

Contohnya:

```ts
const productCards = page.getByRole('article');
```

Playwright baru mencari element yang sesuai ketika locator tersebut digunakan untuk action, assertion, atau query.

Karena itu, assertion Playwright bisa melakukan retry ketika DOM berubah. Tapi kalau locator-nya terlalu umum, Playwright tetap nggak bisa menentukan sendiri element mana yang sebenarnya dimaksud.

Strictness juga tergantung pada operation yang dijalankan:

| Operation                        | Boleh menemukan banyak element? | Kenapa                                           |
| -------------------------------- | ------------------------------- | ------------------------------------------------ |
| `locator.click()`                | Tidak                           | Harus ada satu element yang menerima action      |
| `locator.fill()`                 | Tidak                           | Harus ada satu field yang menerima value         |
| `expect(locator).toBeVisible()`  | Tidak                           | Assertion ini membutuhkan satu target yang jelas |
| `expect(locator).toHaveCount(3)` | Ya                              | Memang sedang verify jumlah element              |
| `locator.count()`                | Ya                              | Memang digunakan untuk menghitung jumlah element |

Jadi, strictness bukan berarti setiap locator harus selalu menemukan satu element.

Masalah baru terjadi ketika operation yang membutuhkan satu target justru menemukan lebih dari satu.

Jumlah element yang ditemukan juga bisa membantu saat debugging:

| Jumlah match | Yang perlu dicek                                                                        |
| ------------ | --------------------------------------------------------------------------------------- |
| `0`          | Apakah halaman sudah berada di state yang benar? Apakah element yang dicari memang ada? |
| `1`          | Apakah element tersebut benar-benar target yang dimaksud oleh scenario?                 |
| `>1`         | Context apa yang masih kurang supaya kita bisa menentukan target yang tepat?            |

Kalau scenario memang berhubungan dengan beberapa element sekaligus, menemukan banyak match bukan masalah.

Langsung cek jumlah atau kondisi element tersebut, daripada memaksa locator memilih satu element.

## Coba kita bedah contoh nyata

Katalog berisi:

* **Widget Basic** — Out of Stock;
* **Widget Pro** — In Stock; dan
* **Widget Pro Max** — Out of Stock.

Setiap product card punya button **Add to Cart**. Risikonya adalah:

> Customer menambahkan Widget Pro yang in stock, tapi produk yang salah masuk atau confirmation tidak muncul.

### 1. Mulai dari product card

```ts
const productCards = page.getByRole('article');
```

Locator ini memang digunakan untuk menemukan semua product card di halaman.

Kalau kita langsung mencari button **Add to Cart** dari semua card tersebut, Playwright tetap akan menemukan beberapa button dan belum tahu mana yang harus digunakan.

### 2. Filter berdasarkan produk yang ingin dipilih

Kalau di dalam setiap card ada element yang bisa digunakan untuk mengenali produknya, kita bisa memakainya sebagai filter:

```ts
const widgetProCard = productCards.filter({
  has: page.getByRole('heading', {
    name: 'Widget Pro',
    exact: true,
  }),
});
```

Inner locator harus berada di frame yang sama dan akan dicek relatif terhadap setiap candidate card. Dalam contoh ini, Playwright mengecek heading tersebut di dalam setiap product card.

`exact: true` penting di sini supaya **Widget Pro Max** nggak ikut dianggap sebagai **Widget Pro**.

Kita juga bisa filter berdasarkan text:

```ts
const matchingCards = productCards.filter({
  hasText: 'Widget Pro',
});
```

`hasText` akan mencari text di dalam setiap card, termasuk element yang ada di dalamnya. Kalau menggunakan string, pencariannya case-insensitive dan berdasarkan substring.

Cara ini praktis, tapi string seperti **Widget Pro** juga bisa match dengan **Widget Pro Max**. Kalau nama produk harus benar-benar exact, gunakan regular expression yang lebih spesifik atau filter berdasarkan element seperti heading.

### 3. Tambahkan kondisi yang memang penting untuk scenario

```ts
const availableWidgetPro = widgetProCard.filter({
  has: page.getByText('In Stock', { exact: true }),
});
```

Sekarang locator tidak hanya memilih **Widget Pro**, tapi juga memastikan produk tersebut sedang **In Stock**.

Kalau tiba-tiba ada dua **Widget Pro** yang sama-sama **In Stock**, action berikutnya tetap harus fail daripada Playwright memilih salah satunya tanpa kita sadari.

Kita juga bisa memastikan hanya ada satu card yang sesuai:

```ts
await expect(availableWidgetPro).toHaveCount(1);
```

### 4. Cari action di dalam card yang sudah dipilih

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();

await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
```

Di sini, locator pertama digunakan untuk memilih **Widget Pro** yang **In Stock**. Setelah card yang tepat ditemukan, kita cari button **Add to Cart** di dalam card tersebut.

Terakhir, assertion memastikan confirmation yang sesuai muncul setelah produk ditambahkan ke cart.

### 5. Cek semua item kalau scenario memang menguji sebuah list

Misalnya requirement mengatakan summary harus menampilkan item berikut dalam urutan yang sama:

```ts
await expect(page.getByRole('listitem')).toHaveText([
  'Keyboard',
  'Mouse',
  'USB Hub',
]);
```

Di case seperti ini, locator memang boleh menemukan beberapa element karena yang ingin kita verify adalah seluruh isi list.

Untuk assertion seperti ini, lebih baik gunakan `toHaveText()` langsung pada locator daripada mengambil text dengan `allTextContents()` lalu membandingkannya secara manual.

Dengan begitu, Playwright tetap bisa melakukan retry sampai list berada di state yang diharapkan atau assertion timeout.

## Kapan pendekatan ini cocok dipakai?

Mulai dari card, row, dialog, navigation, form, atau container lain ketika halaman punya beberapa control yang sama.

Gunakan `filter({ has })` kalau ada element di dalam component yang bisa membantu menentukan target yang tepat, misalnya heading, status, atau label tertentu.

Gunakan `filter({ hasText })` kalau text di dalam component memang cukup stabil dan relevan untuk scenario.

Gunakan `toHaveCount()` atau list assertion ketika jumlah item atau urutannya memang termasuk requirement yang ingin diuji.

Gunakan `nth()`, `first()`, atau `last()` hanya kalau posisi memang penting untuk product behavior. Misalnya, test ingin memastikan search result pertama adalah item dengan ranking tertinggi.

Kalaupun posisi memang penting, tetap verify content dari item tersebut supaya test nggak hanya bergantung pada urutan.

Jangan menambahkan `first()` hanya karena locator menemukan dua element. Jangan juga langsung mengandalkan parent traversal seperti `locator('..')`.

Kalau memungkinkan, gunakan context yang lebih jelas seperti row, dialog, region, filter, atau `data-testid` pada component.

Kalau UI belum punya cara yang jelas untuk membedakan satu component dari component lain, diskusikan markup atau testability dengan developer daripada membuat CSS atau XPath chain yang semakin panjang.

## Kalau gagal, mulai cek dari mana?

Misalnya click berikut menghasilkan strictness error:

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();
```

Cek locator-nya satu per satu:

1. Ada berapa element `article` di halaman?
2. Card mana yang punya heading **Widget Pro** secara exact?
3. Dari card tersebut, mana yang punya status **In Stock**?
4. Di dalam card yang dipilih, ada berapa button **Add to Cart**?
5. Apakah ada duplicate element dari modal, mobile layout, atau component lain yang masih dirender?
6. Apakah memang ada lebih dari satu **Widget Pro** yang ditampilkan oleh product?

Kalau product memang menampilkan dua offer **Widget Pro**, test perlu informasi tambahan untuk membedakannya, misalnya seller, plan, atau SKU.

Kalau duplicate tersebut sebenarnya defect, menggunakan `first()` justru bisa membuat masalahnya terlewat.

Kalau tidak ada card yang cocok, cek starting state, nama produk yang sebenarnya, locale yang sedang digunakan, data yang sudah ter-load, serta apakah component berada di iframe atau page lain.

Jangan langsung membuat `hasText` menjadi lebih umum hanya supaya locator menemukan sesuatu. Bisa jadi root cause-nya ada di setup atau data yang berbeda dari asumsi test.

Sebelum menggunakan locator yang terdiri dari beberapa filter, cek beberapa hal ini:

* Apakah locator awal memang memilih card, row, dialog, atau component yang tepat, bukan sekadar wrapper HTML?
* Apakah `filter({ has })` mencari element yang benar di dalam setiap component?
* Apakah `hasText` bisa ikut match dengan text lain yang lebih panjang atau nggak berkaitan?
* Kalau seharusnya hanya ada satu component yang cocok, apakah test memastikan jumlahnya memang satu?
* Apakah `first()` atau `nth()` hanya digunakan untuk menghindari strictness error?
* Apakah terlalu banyak scenario berbeda dimasukkan ke satu loop sehingga ketika fail jadi sulit diketahui case mana yang bermasalah?
* Apakah assertion terakhir benar-benar verify hasil dari item yang dipilih?
* Apakah perubahan kecil pada markup atau penambahan `data-testid` bisa membuat locator jauh lebih sederhana dan reliable?

Locator yang panjang belum tentu lebih reliable. Setiap filter yang ditambahkan harus membantu menentukan target yang memang dibutuhkan oleh scenario.

## Coba cek pemahamanmu

Review code berikut:

```ts
await page.getByRole('button', { name: 'Delete' }).first().click();
```

Halaman punya **Customer table** dan **Admin table**. Keduanya punya row untuk `qa@example.com`, tapi scenario hanya boleh menghapus record dari **Customer table**.

Jelaskan:

1. Kenapa menggunakan `first()` bisa membuat test menghapus record yang salah?
2. Bagian halaman apa yang seharusnya digunakan sebagai scope terlebih dahulu?
3. Bagaimana cara menentukan row `qa@example.com` yang ada di **Customer table**?
4. Setelah row yang tepat ditemukan, element apa yang perlu dicari di dalam row tersebut?
5. Setelah delete dilakukan, hasil apa yang perlu diverifikasi untuk memastikan **Customer record** benar-benar terhapus?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* `first()` hanya memilih element pertama berdasarkan urutan yang ditemukan di halaman. Kalau layout, sorting, atau urutan table berubah, test bisa menghapus record yang salah.
* Tentukan scope ke **Customer table** terlebih dahulu, misalnya menggunakan accessible name pada table atau region di sekitarnya.
* Di dalam **Customer table**, cari row dengan email `qa@example.com` secara exact, misalnya lewat cell atau filter yang sesuai.
* Setelah row yang tepat ditemukan, cari button **Delete** hanya di dalam row tersebut.
* Setelah delete dilakukan, verify bahwa row `qa@example.com` sudah tidak ada di **Customer table**, atau cek confirmation message lain sesuai dengan product requirement.

Kalau **Customer table** dan **Admin table** nggak punya name atau informasi lain yang bisa membedakan keduanya, itu bisa menjadi masalah pada markup atau testability yang perlu diperbaiki sebelum locator yang reliable bisa dibuat.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menentukan target yang tepat ketika halaman punya banyak card, row, atau component yang mirip, memahami kapan locator memang boleh menemukan beberapa element, dan menggunakan strictness error untuk mencari context yang masih kurang sebelum mengganti locator hanya supaya test pass.

Selesaikan Core Practice tentang product grid dengan beberapa item yang mirip.

Di lesson berikutnya, kita akan belajar CSS secukupnya untuk membaca dan memperbaiki locator yang memang perlu bergantung pada DOM atau attribute, tanpa menganggap selector yang lebih panjang berarti lebih reliable.
