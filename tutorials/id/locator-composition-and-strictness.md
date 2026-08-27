---
title: 'Persempit Repeated UI Tanpa Menyembunyikan Ambiguitas'
description: 'Susun locator dari konteks bermakna, filter repeated component, dan gunakan strictness sebagai diagnostic feedback.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan kenapa locator diselesaikan saat action atau assertion dijalankan;
- menyusun locator dari container yang bermakna menuju target control;
- memfilter repeated component berdasarkan identifying content atau descendant locator;
- membedakan multiple-element operation yang valid dari strict single-target operation; dan
- mendiagnosis ambiguitas tanpa otomatis memakai `first()` atau `nth()`.

## Kenapa ini penting buat QA

Membayangkan satu button “Add to Cart” itu gampang. Di katalog sungguhan, mungkin ada dua puluh button dengan nama yang sama.

Kalau generated code berisi ini, apa yang akan terjadi?

```ts
await page.getByRole('button', { name: 'Add to Cart' }).click();
```

Playwright seharusnya nggak menebak produk mana yang dimaksud customer. Strictness error justru berguna: test intent sudah menemukan action, tapi belum menjelaskan konteksnya.

Solusinya bukan otomatis `.first()`. Kalau urutan produk berubah besok, card pertama bisa menunjuk produk lain. Test mungkin melakukan action yang salah sambil tetap hijau.

## Cara berpikir yang perlu kamu pegang

Repeated UI membutuhkan dua identity:

```text
Identity container yang bermakna
              ↓
Target di dalam container tersebut
              ↓
Action atau assertion pada satu elemen yang dimaksud
```

![Sebuah repeated collection dipersempit dengan identity dan state yang bermakna sebelum satu target action, sementara nol, satu, atau banyak match memberi diagnostic signal yang berbeda.](/images/tutorials/locator-scope-strictness.svg)

_Scope menjawab “component yang mana?” Inner locator menjawab “control mana di dalamnya?”_

Locator adalah deskripsi yang lazy. Membuat locator ini tidak mengambil fixed array dari elemen yang ada sekarang:

```ts
const productCards = page.getByRole('article');
```

Playwright menyelesaikan locator saat action, assertion, atau query dijalankan. Ini membuat web assertion bisa melakukan retry terhadap DOM yang berubah, tapi deskripsi yang vague tetap tidak akan menjadi unik dengan sendirinya.

Strictness bergantung pada operasinya:

| Operasi                          | Boleh menemukan banyak elemen? | Kenapa                                           |
| -------------------------------- | ------------------------------ | ------------------------------------------------ |
| `locator.click()`                | Tidak                          | Satu elemen harus menerima action                |
| `locator.fill()`                 | Tidak                          | Satu field harus menerima value                  |
| `expect(locator).toBeVisible()`  | Biasanya tidak                 | Assertion mengacu pada satu elemen yang dimaksud |
| `expect(locator).toHaveCount(3)` | Ya                             | Collection-nya memang sedang diuji               |
| `locator.count()`                | Ya                             | Query-nya memang mengukur collection             |

Strictness bukan berarti setiap locator harus selalu menghasilkan satu elemen. Strictness berarti single-target operation tidak boleh ambigu.

Gunakan jumlah match sebagai diagnostic signal:

| Jumlah match | Pertanyaan yang perlu diajukan                                      |
| ------------ | ------------------------------------------------------------------- |
| `0`          | Apakah starting state, identity, atau product state yang diharapkan hilang? |
| `1`          | Apakah locator sudah dipersempit ke component yang dimaksud?       |
| `>1`         | User, domain, atau component context apa yang masih hilang?        |

Untuk requirement yang memang plural, banyak match bisa saja benar. Assert collection tersebut secara langsung daripada memaksanya menjadi satu target.

## Coba kita bedah contoh nyata

Katalog berisi:

- Widget Basic — Out of Stock;
- Widget Pro — In Stock; dan
- Widget Pro Max — Out of Stock.

Setiap card punya button Add to Cart. Risikonya adalah:

> Customer menambahkan Widget Pro yang in stock, tapi produk yang salah masuk atau confirmation tidak muncul.

### 1. Mulai dari repeated component

```ts
const productCards = page.getByRole('article');
```

Locator ini memang sengaja menjelaskan sebuah collection. Kalau langsung mencari button dari seluruh collection, hasilnya tetap ambigu.

### 2. Filter berdasarkan product identity

Gunakan descendant locator kalau inner element memiliki semantik yang berguna:

```ts
const widgetProCard = productCards.filter({
  has: page.getByRole('heading', {
    name: 'Widget Pro',
    exact: true,
  }),
});
```

Inner locator diperiksa relatif terhadap setiap candidate card. `exact: true` mencegah “Widget Pro Max” dianggap sebagai product identity yang sama.

Text filtering juga tersedia:

```ts
const matchingCards = productCards.filter({
  hasText: 'Widget Pro',
});
```

`hasText` mencari text di dalam setiap candidate, termasuk descendant. String match-nya case-insensitive dan memakai substring. Cara ini nyaman, tapi bisa lebih luas dari product contract. Gunakan regular expression atau semantic descendant kalau exact identity memang penting.

### 3. Persempit berdasarkan state yang relevan

```ts
const availableWidgetPro = widgetProCard.filter({
  has: page.getByText('In Stock', { exact: true }),
});
```

Sekarang locator menjelaskan produk sekaligus required availability state. Kalau produk yang sama tiba-tiba muncul dua kali sebagai in stock, click berikutnya tetap harus gagal daripada memilih salah satunya diam-diam.

Count assertion bisa membuat kontrak dan diagnosis lebih jelas:

```ts
await expect(availableWidgetPro).toHaveCount(1);
```

### 4. Cari action di dalam component yang sudah dipilih

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();

await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
```

Outer locator menangani product identity dan availability. Inner locator menangani action. Final assertion membuktikan hasil yang bisa diamati.

### 5. Perlakukan list sebagai list saat list memang menjadi subject

Misalnya requirement mengatakan summary harus menampilkan item berikut dalam urutan yang sama:

```ts
await expect(page.getByRole('listitem')).toHaveText([
  'Keyboard',
  'Mouse',
  'USB Hub',
]);
```

Ini memang sengaja plural. Untuk web assertion, pilih retried list assertion daripada mengambil snapshot `allTextContents()` secara langsung lalu membandingkannya manual.

## Kapan pendekatan ini cocok dipakai?

Susun locator dari meaningful container saat control berulang di card, row, dialog, navigation region, atau form. Gunakan `filter({ has })` ketika semantic descendant menyatakan identity. Gunakan `filter({ hasText })` saat contained text memang kontrak yang disengaja.

Gunakan `toHaveCount` atau list text assertion ketika collection size atau order memang menjadi requirement.

Gunakan `nth()`, `first()`, atau `last()` hanya saat posisi menjadi bagian product behavior—misalnya memastikan first search result adalah item dengan ranking tertinggi. Walaupun begitu, assert content yang membuat posisi tersebut bermakna.

Jangan menambahkan `first()` hanya karena dua elemen cocok. Jangan memulai design dengan parent traversal `locator('..')`. Region role, row, dialog, filter, atau deliberate component test ID biasanya lebih komunikatif.

Kalau UI nggak punya component identity yang bermakna, diskusikan semantics atau testability contract dengan developer daripada membuat structural chain yang makin panjang.

## Kalau gagal, mulai cek dari mana?

Misalnya click ini menghasilkan strictness violation:

```ts
await availableWidgetPro.getByRole('button', { name: 'Add to Cart' }).click();
```

Periksa match di setiap narrowing step:

1. Ada berapa elemen `article`?
2. Card mana yang cocok dengan exact heading Widget Pro?
3. Mana dari card tersebut yang punya intended stock state?
4. Apakah setiap card punya satu atau beberapa Add to Cart button?
5. Apakah ada hidden duplicate, modal, mobile layout, atau stale component?
6. Apakah produk memang merender inventory duplikat?

Kalau produk memang menampilkan dua offer Widget Pro, test membutuhkan domain identity lain seperti seller, plan, atau SKU. Kalau duplikat itu defect, `first()` justru menyembunyikannya.

Kalau tidak ada card yang cocok, periksa starting state, exact product name, locale saat ini, loaded data, serta apakah card berada di iframe atau page lain. Membuat `hasText` lebih luas mungkin hanya memindahkan masalah.

## Review hasil buatan AI

Review locator composition hasil generate dengan pertanyaan berikut:

- Apakah outer locator mengenali meaningful component atau cuma wrapper?
- Apakah inner `has` locator diperiksa relatif terhadap setiap outer candidate?
- Bisakah `hasText` cocok dengan value yang lebih panjang atau tidak berkaitan?
- Apakah kode membuktikan hanya ada satu intended component saat uniqueness penting?
- Apakah `first()` atau `nth()` menyembunyikan ambiguitas?
- Apakah banyak risiko independen dipadatkan ke satu loop dan satu report result?
- Apakah final assertion membuktikan outcome dari item yang dipilih?
- Apakah perbaikan semantics atau test ID kecil bisa menyederhanakan locator secara signifikan?

Kode panjang tidak otomatis robust. Setiap narrowing step harus menambah makna.

## Coba cek pemahamanmu

Review generated code ini:

```ts
await page.getByRole('button', { name: 'Delete' }).first().click();
```

Halaman punya Customer table dan Admin table. Keduanya punya row untuk `qa@example.com`, tapi skenario harus menghapus Customer record saja.

Jelaskan:

1. Kenapa `first()` bisa melakukan action yang salah?
2. Meaningful outer scope apa yang tersedia?
3. Bagaimana caramu mengenali row yang benar?
4. Target apa yang dicari di dalam row tersebut?
5. Observable result apa yang perlu di-assert setelah penghapusan?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- DOM order bukan kontrak customer/admin, jadi `first()` bisa berubah makna setelah layout atau sorting berubah.
- Beri scope lebih dulu ke Customer table atau region di sekitarnya menggunakan accessible name.
- Di dalam scope itu, cari row dengan exact email, sebaiknya lewat cell locator atau meaningful filter.
- Cari Delete button hanya di dalam row tersebut.
- Assert customer row yang dimaksud hilang atau customer-specific status muncul. Bukti tepatnya tetap mengikuti product requirement.

Kalau kedua table nggak punya name, ambiguitas itu mungkin membutuhkan perbaikan product semantics atau testability sebelum final locator bisa dipercaya.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa mempersempit repeated UI dari meaningful container menuju target, menjelaskan kapan plural match itu valid, dan memakai strictness untuk menginvestigasi identity yang hilang daripada melewatinya.

Selesaikan Core Practice tentang repeated product grid. Lesson berikutnya mengajarkan CSS secukupnya untuk membaca dan memperbaiki implementation fallback tanpa menganggap DOM path yang lebih panjang sebagai locator yang lebih baik.
