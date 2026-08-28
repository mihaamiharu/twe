---
title: 'Pilih Locator yang Sesuai dengan Intent Test'
description: 'Pilih locator berdasarkan informasi yang memang digunakan user untuk menemukan element, seperti role, label, visible text, atau data-testid kalau element tersebut nggak punya identifier yang stabil dari UI.'
---

## Setelah lesson ini, kamu bisa

* memilih locator Playwright berdasarkan informasi yang memang relevan dengan test scenario;
* membedakan perubahan UI yang seharusnya tidak memengaruhi locator dengan perubahan penting yang memang seharusnya membuat test fail;
* mengecek accessible name, label, test ID, dan wording yang tampil di UI sebelum memilih locator;
* menjelaskan kapan CSS atau XPath perlu digunakan sebagai fallback; dan
* mendiagnosis locator yang tidak menemukan element atau menemukan lebih dari satu element sebelum langsung memakai `first()`, selector yang lebih umum, atau fallback lain hanya supaya test pass.


## Kenapa ini penting buat QA

Coba bayangin AI membuat checkout test dengan locator seperti ini:

```ts
page.locator('div.checkout > div:nth-child(3) > button.primary');
```

Hari ini test-nya pass. Besok designer menambahkan wrapper baru, lalu test fail padahal checkout masih tetap berfungsi.

Kalau solusinya cuma copy selector baru dari DevTools, test memang bisa pass lagi, tapi root cause-nya nggak benar-benar diperbaiki. Locator tersebut terlalu bergantung pada structure HTML yang sebenarnya nggak penting untuk scenario checkout.

Masalah sebaliknya juga bisa terjadi.

Misalnya button yang seharusnya dikenali sebagai `button` berubah menjadi `div` yang dibuat clickable. Kalau `getByRole('button')` kemudian fail, kita perlu cek dulu apakah memang ada masalah di markup.

Jangan langsung menggantinya dengan CSS selector hanya supaya test pass, karena perubahan tersebut bisa jadi accessibility regression yang memang perlu diketahui tim.

Karena itu, pilih locator berdasarkan hal yang memang penting untuk scenario yang sedang diuji. Jangan bergantung pada detail HTML yang bisa berubah tanpa memengaruhi behavior aplikasi.

## Cara berpikir yang perlu kamu pegang

Saat memilih locator, mulai dari hal yang memang penting untuk test scenario:

```text
Hal apa yang ingin dikenali oleh test?
                    ↓
Informasi apa di halaman yang paling tepat untuk menemukan element tersebut?
                    ↓
Perubahan apa yang memang seharusnya membuat locator fail?
```

Jangan mulai dari selector mana yang paling mudah ditulis.

Pahami dulu element apa yang dibutuhkan oleh scenario, lalu cek DOM dan accessibility information di halaman yang sedang berjalan untuk melihat locator apa yang paling sesuai.

![Keputusan locator dimulai dari intent test, lalu memilih kontrak yang menghadap pengguna, kontrak engineering, atau implementation fallback berdasarkan makna yang perlu dijaga.](/images/tutorials/locator-contract-decision.svg)

_Nggak ada urutan locator yang selalu paling benar. Pilih locator berdasarkan hal yang memang penting untuk test scenario._

Gunakan informasi di halaman yang paling sesuai dengan target yang ingin ditemukan:

| Locator                     | Informasi yang digunakan                      | Cocok saat                                                                |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `getByRole(role, { name })` | Semantic role dan accessible name             | Element dikenali user sebagai button, link, checkbox, atau control lain   |
| `getByLabel(text)`          | Label yang terhubung dengan form control      | Label memang digunakan untuk mengenali field                              |
| `getByText(text)`           | Visible text                                  | Text atau message yang tampil memang penting untuk scenario               |
| `getByAltText(text)`        | Alternative text pada image atau element lain | Arti atau fungsi image memang penting                                     |
| `getByPlaceholder(text)`    | Placeholder pada field                        | Placeholder memang menjadi identifier yang cukup stabil                   |
| `getByTestId(id)`           | Test ID yang disediakan untuk automation      | Target sulit ditemukan dengan role, label, atau text yang stabil          |
| `locator(css)`              | DOM structure atau attribute                  | Memang perlu menggunakan detail implementation sebagai fallback           |
| `locator('xpath=...')`      | Path atau hubungan antar-element di DOM       | Biasanya untuk legacy markup atau kasus yang sulit ditangani locator lain |

Accessible name juga nggak selalu sama dengan text yang terlihat langsung di dalam element. Nilainya bisa berasal dari `label`, `aria-label`, `aria-labelledby`, alternative text, atau content lain sesuai accessibility rules.

`data-testid` bisa menjadi locator yang reliable kalau tim memang menjaganya tetap stabil. Tapi test ID hanya membantu automation menemukan element. Test ID nggak memastikan element tersebut punya semantic atau accessibility yang benar.

Sebelum menulis locator, tentukan dulu element apa yang dibutuhkan oleh scenario dan kenapa element tersebut penting. Setelah itu, cek DOM dan accessibility information di halaman yang sedang berjalan untuk memastikan role, label, text, atau test ID yang ingin digunakan memang tersedia.

Dengan begitu, saat review locator hasil generate, kita bisa menilai apakah locator tersebut memang sesuai dengan scenario, bukan cuma apakah selector-nya berhasil menemukan element.


## Coba kita bedah contoh nyata

Risikonya adalah:

> Customer mengubah delivery address, tapi alamat baru tidak tersimpan.

Halaman punya field untuk street address, button **Save address**, dan status message setelah perubahan berhasil disimpan.

### 1. Mulai dari behavior, bukan DOM

Customer mengenali field tersebut dari label-nya:

```ts
const street = page.getByLabel('Street address');
```

Locator ini tetap bisa bekerja walaupun generated `id` berubah, input mendapat wrapper baru, atau styling class diganti.

Sebaliknya, kalau field tersebut nggak lagi terhubung dengan label yang benar, locator memang seharusnya fail. Itu bisa menunjukkan adanya masalah pada markup atau accessibility yang perlu dicek.

Customer juga mengenali action tersebut sebagai button bernama **Save address**:

```ts
const saveAddress = page.getByRole('button', {
  name: 'Save address',
});
```

Menggunakan role `button` saja belum cukup kalau halaman punya beberapa button lain seperti **Cancel**, **Delete**, atau **Save payment**. Accessible name membantu memastikan automation memilih button yang memang sesuai dengan scenario.

### 2. Hubungkan action dengan hasil yang perlu diverifikasi

```ts
await street.fill('18 Market Street');
await saveAddress.click();

await expect(page.getByRole('status')).toHaveText('Delivery address updated');
```

Locator untuk field dan button digunakan untuk melakukan action yang sama seperti user.

Setelah itu, assertion digunakan untuk verify hasil yang seharusnya terjadi setelah address disimpan.

Kita nggak perlu memaksa semua bagian test menggunakan jenis locator yang sama. Pilih locator berdasarkan fungsi masing-masing element di dalam scenario.

### 3. Sesuaikan locator dengan tujuan localization test

Kalau scenario ini memang menguji experience dalam bahasa Indonesia, gunakan label, button name, dan result text yang tampil dalam bahasa Indonesia.

Kalau test yang sama dijalankan untuk beberapa bahasa dan wording bukan bagian yang sedang diuji, `data-testid` bisa digunakan untuk menemukan action yang sama:

```ts
await page.getByTestId('save-delivery-address').click();
```

Tapi kalau kualitas localization memang termasuk hal yang ingin diuji, tetap verify text yang tampil secara terpisah.

Jangan pindah ke `data-testid` hanya supaya test nggak perlu mengecek wording yang memang seharusnya benar untuk masing-masing bahasa.

### 4. Jangan abaikan semantic yang hilang

Misalnya halaman menggunakan custom control seperti ini:

```html
<div class="save-action">Save address</div>
```

CSS locator memang bisa menemukan element tersebut, tapi itu tidak mengubah `div` menjadi control yang accessible atau bisa digunakan dengan keyboard.

Kalau element tersebut seharusnya berfungsi sebagai button, cek apakah ini memang defect di markup atau masalah testability yang perlu diperbaiki.

CSS locator bisa dipakai sementara kalau memang dibutuhkan, tapi jangan langsung dianggap sebagai solusi final hanya karena test sudah bisa pass.

## Kapan pendekatan ini cocok dipakai?

Gunakan role dan accessible name ketika test bergantung pada cara user mengenali atau menggunakan sebuah control. Gunakan label untuk form field yang memang dikenali lewat label-nya. Gunakan visible text ketika wording atau message yang tampil memang penting untuk scenario.

Gunakan `data-testid` ketika element sulit ditemukan dengan informasi yang terlihat oleh user, atau ketika tim memang membutuhkan identifier yang stabil dan tidak bergantung pada bahasa. Contohnya bisa berupa chart canvas atau technical element yang nggak punya visible text atau accessible name yang berguna.

Placeholder juga bisa digunakan untuk menemukan field, tapi placeholder bukan pengganti label yang benar. Kalau sebuah field seharusnya punya label tapi automation hanya bisa menemukannya lewat placeholder, cek dulu apakah ada masalah pada markup atau accessibility.

Jangan memilih locator hanya karena paling pendek, paling baru, atau muncul paling atas dalam daftar rekomendasi.

Regular expression juga nggak selalu lebih baik. Kalau exact name memang stabil dan wording-nya penting untuk test, exact match justru bisa membantu menangkap perubahan text yang tidak disengaja.

Gunakan CSS atau XPath sebagai fallback ketika role, label, text, test ID, atau combination locator lain memang belum cukup untuk menemukan target dengan jelas. Sebelum menggunakannya, pastikan kamu tahu kenapa locator yang lebih dekat dengan behavior user nggak cocok untuk case tersebut.

## Kalau gagal, mulai cek dari mana?

Misalnya locator ini tidak menemukan element:

```ts
page.getByRole('button', { name: 'Save address' });
```

Sebelum langsung menggantinya dengan `button.primary`, cek dulu:

1. Apakah test sudah berada di halaman dan state yang benar?
2. Apakah element tersebut memang dikenali sebagai `button` oleh browser?
3. Accessible name apa yang sebenarnya dikenali browser?
4. Apakah element berada di dalam dialog, iframe, atau context lain? Kalau ada di iframe, locator harus dijalankan di frame yang tepat. Mengganti selector saja nggak akan menyelesaikan masalah.
5. Apakah wording berubah karena localization atau memang ada perubahan product?
6. Apakah element-nya hilang, disabled, atau digantikan oleh error state?

Kalau locator menemukan lebih dari satu element, cek apakah halaman memang punya beberapa component dengan button yang sama, atau accessible name yang digunakan ternyata duplikat.

Di lesson berikutnya kita akan lihat cara mempersempit scope locator berdasarkan context element, tanpa langsung bergantung pada posisi seperti `.first()` atau `.nth()`.

Jangan langsung mengganti ke CSS selector yang lebih umum, menambahkan `.first()`, atau membuat name matcher terlalu longgar hanya supaya test pass. Cari tahu dulu kenapa locator awalnya tidak menemukan target yang sesuai.

## Review hasil kerja dengan bantuan AI

Untuk setiap locator hasil generate, cek beberapa hal ini:

* Apakah locator tersebut sesuai dengan cara user mengenali element atau dengan kebutuhan test scenario?
* Perubahan UI seperti apa yang seharusnya tidak membuat locator fail?
* Perubahan penting apa yang memang seharusnya membuat test fail?
* Apakah AI mengarang visible text, ARIA attribute, atau test ID yang sebenarnya nggak ada?
* Kalau menggunakan test ID, apakah identifier tersebut memang tersedia dan digunakan oleh tim?
* Apakah regular expression terlalu longgar sampai perubahan wording yang nggak diharapkan bisa terlewat?
* Apakah AI mengganti locator berbasis semantic dengan CSS atau structural selector hanya supaya test pass?
* Apakah locator tersebut menemukan target yang tepat saat dijalankan pada starting state yang sebenarnya?

Jangan langsung menggunakan locator hasil generate tanpa dicek. Cocokkan dulu dengan DOM, accessibility information, wording yang benar-benar tampil di UI, dan tujuan dari test scenario tersebut.

## Coba cek pemahamanmu

Review locator hasil generate untuk payment form berikut:

```ts
const cardNumber = page.locator('#field-9281');
const pay = page.getByText(/pay/i);
const receiptChart = page.getByRole('img', { name: 'chart' });
```

Produk sebenarnya punya:

* visible label **“Card number”** yang terhubung dengan input;
* dua control yang mengandung kata **“pay”**: **“Pay now”** dan **“Payment help”**; dan
* sebuah canvas dengan `data-testid="receipt-chart"` yang memang sudah disepakati untuk automation.

Untuk setiap locator:

1. Pilih locator yang lebih sesuai dengan target yang ingin ditemukan.
2. Jelaskan perubahan UI apa yang seharusnya tidak membuat locator tersebut fail.
3. Jelaskan perubahan penting apa yang memang seharusnya membuat locator fail.
4. Tentukan informasi apa yang masih perlu dicek di halaman sebelum menulis final locator.

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Gunakan `getByLabel('Card number')` supaya perubahan generated ID atau tambahan wrapper nggak memengaruhi locator. Kalau hubungan antara label dan input rusak, test tetap bisa menunjukkan masalah tersebut.
* Gunakan `getByRole('button', { name: 'Pay now' })` supaya automation memilih button yang tepat, bukan element lain yang kebetulan mengandung kata **“pay”**. Kalau nama action berubah, kita bisa cek apakah perubahan tersebut memang sesuai dengan product requirement.
* Gunakan `getByTestId('receipt-chart')` karena canvas tersebut memang punya test ID yang sudah disepakati untuk automation dan nggak punya role atau visible text yang cocok untuk scenario ini.
* Tetap cek role, accessible name, locale, dan test ID yang benar-benar tersedia di halaman. Jangan hanya mengandalkan deskripsi atau locator hasil generate.

Product requirement yang berbeda bisa membuat pilihan locator ikut berbeda. Yang penting, kita bisa menjelaskan kenapa locator tersebut sesuai dengan target dan tujuan test.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memilih locator berdasarkan test scenario, memahami perubahan UI apa yang seharusnya tidak membuat locator fail, dan menginvestigasi locator yang tidak menemukan element atau menemukan lebih dari satu element sebelum mengganti strategy.

Selesaikan Core Practice yang menggunakan role, accessible name, action, dan expected result.

Di lesson berikutnya, kita akan membahas cara menentukan scope ketika halaman punya beberapa card, row, atau dialog dengan element yang mirip.
