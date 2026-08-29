---
title: 'Tunggu Navigation dan Browser Event dengan Urutan yang Tepat'
description: 'Tunggu perubahan URL, popup, download, dan dialog tanpa melewatkan event, lalu verify hasilnya di page atau frame yang tepat.'
---

## Setelah lesson ini, kamu bisa

- menentukan hasil apa yang perlu dicek setelah full navigation, client-side routing, atau update di page yang sama;
- menunggu popup atau download dengan memasang wait sebelum action yang memicunya;
- menangani browser dialog tanpa membuat test berhenti;
- menentukan kapan element perlu dicari melalui frame context; serta
- mendiagnosis kenapa popup, download, dialog, atau perubahan page tidak muncul seperti yang diharapkan.

## Kenapa ini penting buat QA

Pernah nggak sih kamu melakukan click di satu page, tapi hasilnya muncul di tempat yang berbeda?

Action seperti **Open invoice** bisa membuka page baru di tab yang sama, membuka tab baru, atau langsung men-download PDF. **Delete account** bisa memunculkan browser confirmation dialog. Payment form juga bisa berada di dalam iframe milik service lain.

Kalau test menunggu di tempat yang salah, memperbesar timeout nggak akan menyelesaikan masalah.

Misalnya, test menunggu heading muncul di page saat ini, padahal heading tersebut muncul di tab baru. Atau test baru mulai menunggu download setelah proses download sudah dimulai.

Karena itu, kita perlu tahu hasil dari sebuah action akan muncul di mana dan memasang wait sebelum action dijalankan kalau event-nya bisa terjadi dengan cepat.

## Cara berpikir yang perlu kamu pegang

Tentukan dulu hasil dari action akan muncul di mana:

```text
Jalankan action
      ↓
Hasilnya muncul di mana?
      ├─ Di page atau URL yang sama → jalankan action, lalu tunggu dengan assertion
      ├─ Sebagai browser event       → pasang wait lebih dulu, lalu jalankan action
      └─ Di page atau iframe lain    → gunakan page atau frame yang tepat, lalu cari element di sana
```

Kalau hasilnya berupa browser event yang hanya terjadi sekali, urutannya penting:

![Event pattern yang andal mendaftarkan promise sebelum trigger, sedangkan trigger lebih dulu bisa kehilangan popup atau download yang cepat.](/images/tutorials/event-listener-before-trigger.svg)

_Buat event promise lebih dulu, tapi baru await setelah action yang menghasilkan event dijalankan._

Memulai dengan code ini salah:

```ts
const download = await page.waitForEvent('download');
await page.getByRole('button', { name: 'Export' }).click();
```

Baris pertama menunggu event yang belum dipicu oleh baris kedua. Akibatnya, click tidak pernah dijalankan.

Melakukan trigger dulu lalu mendaftarkan event belakangan juga berisiko, karena event yang cepat bisa terjadi di antara kedua baris.

## Coba kita bedah contoh nyata

Order history page punya beberapa behavior:

- memilih **Order history** mengubah route di page yang sama;
- **Open invoice** membuka invoice HTML di tab baru; dan
- **Download PDF** menghasilkan file download.

Ada juga action **Cancel order** yang membuka browser confirmation dialog.

### 1. Tunggu perubahan page lalu verify hasilnya

```ts
await page.getByRole('link', { name: 'Order history' }).click();

await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

Full page navigation dan client-side routing bisa terlihat sama dari sisi user.

`toHaveURL()` menunggu sampai URL sesuai, sedangkan heading memastikan content **Order history** sudah benar-benar tampil.

Pilih assertion sesuai dengan requirement. Kadang heading saja sudah cukup. Kalau perubahan URL juga penting untuk scenario, verify keduanya.

Jangan hanya menunggu load state lalu menganggap page sudah siap. Browser bisa selesai melakukan load sebelum data aplikasi muncul. Sebaliknya, pada single-page application, content bisa berubah tanpa full page load.

### 2. Tunggu popup sebelum menjalankan action

```ts
const popupPromise = page.waitForEvent('popup');

await page.getByRole('link', { name: 'Open invoice' }).click();

const invoicePage = await popupPromise;

await expect(invoicePage).toHaveURL(/\/invoices\/1042$/);
await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

`popupPromise` dibuat sebelum `click()` supaya event popup nggak terlewat.

Setelah popup terbuka, gunakan `invoicePage` untuk locator dan assertion yang memang berada di page baru tersebut.

Kalau page baru bisa dibuka dari berbagai bagian aplikasi dan bukan hanya dari page saat ini, kamu bisa menunggu event `page` dari browser context. Pilih cara yang paling sesuai dengan flow aplikasi.

### 3. Tunggu download lalu verify hasilnya

```ts
const downloadPromise = page.waitForEvent('download');

await page.getByRole('button', { name: 'Download PDF' }).click();

const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('invoice-1042.pdf');
await download.saveAs('artifacts/invoice-1042.pdf');
```

Event `download` memastikan proses download benar-benar dimulai.

Setelah itu, kita bisa verify hal yang memang penting untuk scenario, misalnya nama file yang dihasilkan.

Kalau isi file juga termasuk bagian penting dari requirement, file tersebut tetap perlu diperiksa dengan parser atau verification lain yang sesuai. Memanggil `saveAs()` saja belum memastikan file berisi invoice yang benar.

File hasil download biasanya hanya tersedia sementara selama browser context masih berjalan, kecuali kita menyimpannya ke lokasi lain.

Di project yang sebenarnya, simpan file ke folder yang memang digunakan untuk test artifact dan hindari menyimpan output yang berisi data sensitif ke repository.

### 4. Handle dialog sebelum action dijalankan

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('Cancel order 1042?');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Cancel order' }).click();
await expect(page.getByRole('status')).toHaveText('Order cancelled');
```

Kalau nggak ada listener, Playwright akan otomatis men-`dismiss()` dialog.

Tapi kalau kita sudah memasang listener, dialog tersebut harus di-`accept()` atau di-`dismiss()`. Kalau tidak, page akan terus menunggu dialog tersebut dan `click()` yang memicunya bisa hang.

Assertion pada dialog memastikan confirmation yang benar memang muncul. Setelah dialog di-accept, assertion terakhir memastikan order benar-benar berubah menjadi **“Order cancelled”**.

### 5. Gunakan frame yang tepat kalau element ada di iframe

Iframe bukan event yang muncul sekali. Iframe adalah document context lain yang ditampilkan di dalam page utama:

```ts
const paymentFrame = page.frameLocator('[title="Secure payment"]');

await paymentFrame.getByLabel('Card number').fill('4242 4242 4242 4242');
```

Kalau element memang berada di dalam iframe, gunakan `frameLocator()` terlebih dahulu lalu cari element di dalam frame tersebut seperti biasa.

Jangan langsung menambahkan `frameLocator()` hanya karena locator tidak menemukan element. Cek dulu lewat DevTools apakah element tersebut memang berada di iframe.

Setelah itu, pilih iframe menggunakan attribute yang cukup stabil, misalnya `title` atau identifier lain yang memang tersedia di page.

## Kapan pendekatan ini cocok dipakai?

Kalau hasil dari action muncul di page yang sama, gunakan assertion seperti `toHaveURL()`, `toBeVisible()`, atau `toHaveText()` untuk menunggu sampai kondisi yang diharapkan terpenuhi.

Nggak perlu menunggu load event secara manual kalau URL, heading, status, atau kondisi UI lain sudah cukup menunjukkan bahwa page siap digunakan.

Gunakan `waitForEvent('popup')` atau `waitForEvent('download')` kalau action memang membuka tab baru atau menghasilkan download. Buat promise sebelum action dijalankan, lalu `await` event-nya setelah action.

Gunakan dialog listener kalau test memang perlu mengecek atau memilih **Accept/Cancel** pada native browser dialog.

Kalau yang muncul adalah modal buatan aplikasi, perlakukan seperti DOM element biasa. Cari dengan role `dialog`, lalu interact seperti biasa.

Gunakan `frameLocator()` hanya kalau sudah dipastikan element memang berada di dalam iframe. Tab baru adalah `Page`, bukan iframe. Native browser dialog juga berbeda dari keduanya.

File upload juga berbeda dengan download. Untuk upload, gunakan `setInputFiles()`, lalu verify bagaimana aplikasi merespons file tersebut, misalnya filename muncul atau status upload berhasil.

Jangan gunakan `waitForLoadState('networkidle')` sebagai cara default untuk menentukan page sudah siap. Tunggu kondisi yang memang relevan dengan scenario, seperti URL, heading, status, atau control state.

## Kalau gagal, mulai cek dari mana?

Kalau test timeout setelah sebuah action, cek dulu hasil action tersebut seharusnya muncul di mana:

1. Apakah action mengubah page yang sama, melakukan navigation, membuka tab baru, atau memulai download?
2. Kalau menunggu popup, download, atau dialog, apakah wait atau listener sudah dipasang sebelum action dijalankan?
3. Apakah promise malah di-`await` sebelum action yang memicu event?
4. Kalau ada tab baru, apakah locator dan assertion sudah menggunakan `Page` yang benar?
5. Kalau target berada di iframe, apakah test sudah menggunakan frame yang tepat?
6. Kalau ada browser dialog, apakah listener sudah melakukan `accept()` atau `dismiss()`?
7. Apakah event sebenarnya sudah terjadi, tapi assertion setelahnya yang fail?

Gunakan trace dan screenshot untuk melihat apa yang terjadi setelah action.

Untuk download, cek error yang tersedia dan filename yang dihasilkan. Untuk popup, cek page apa saja yang terbuka di browser context. Untuk iframe, cek URL atau title frame saat debugging kalau memang membantu menentukan frame yang benar.

Saat review code yang berkaitan dengan navigation atau browser event, cek beberapa hal ini:

- Apakah test menunggu hasil di tempat yang benar?
- Apakah wait untuk popup atau download dibuat sebelum action yang memicunya?
- Apakah event promise baru di-`await` setelah action dijalankan?
- Apakah assertion untuk popup dijalankan pada `Page` dari popup tersebut?
- Apakah browser dialog selalu di-`accept()` atau di-`dismiss()`?
- Apakah modal dari aplikasi salah dianggap sebagai native browser dialog?
- Apakah `networkidle` digunakan hanya untuk menebak kapan page siap?
- Kalau ada download, apakah test verify hal yang memang penting, bukan hanya memanggil `saveAs()`?
- Apakah sudah dipastikan target memang berada di iframe?
- Setelah browser event selesai, apakah hasil akhirnya tetap diverifikasi?

Method yang digunakan bisa saja benar, tapi urutan yang salah tetap bisa membuat test fail atau flaky.

Karena itu, pastikan test tahu event apa yang perlu ditunggu, kapan wait harus dipasang, dan di page atau frame mana assertion perlu dijalankan.

## Coba cek pemahamanmu

Review invoice test berikut:

```ts
await page.getByRole('link', { name: 'Open invoice' }).click();

const invoicePage = await page.waitForEvent('popup');

await page.waitForLoadState('networkidle');

await expect(page.getByText('Invoice 1042')).toBeVisible();
```

Link tersebut langsung membuka tab baru, lalu tab baru menampilkan heading **Invoice 1042**.

Jelaskan:

1. Kenapa `waitForEvent('popup')` dipasang terlalu terlambat?
2. Baris mana yang masih menunggu atau melakukan assertion di page lama?
3. Bagaimana urutan yang benar untuk menunggu popup, menjalankan action, lalu melakukan assertion di tab baru?
4. Kondisi apa yang lebih tepat ditunggu daripada `networkidle`?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

```ts
const popupPromise = page.waitForEvent('popup');

await page.getByRole('link', { name: 'Open invoice' }).click();

const invoicePage = await popupPromise;

await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

Wait untuk popup dipasang sebelum `click()` supaya event-nya nggak terlewat.

Setelah tab baru terbuka, test menggunakan `invoicePage` untuk melakukan assertion di tab tersebut.

Kita juga nggak perlu menunggu `networkidle`. Heading **Invoice 1042** sudah menjadi kondisi yang lebih jelas untuk menunjukkan bahwa invoice yang diharapkan sudah tampil.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menentukan di mana hasil dari sebuah action akan muncul, memasang wait untuk popup atau download dengan urutan yang benar, serta membedakan tab baru, native browser dialog, download, dan iframe.

Lesson ini tidak punya Core Practice terpisah karena playground saat ini belum bisa mensimulasikan popup dan download dengan cukup akurat.

Iframe tetap tersedia sebagai Additional Practice.

Module 5 dianggap selesai setelah kamu menyelesaikan dua Core Practice sebelumnya: memilih action berdasarkan state atau behavior yang dibutuhkan scenario, serta menunggu dan verify hasil setelah action tanpa bergantung pada fixed sleep.
