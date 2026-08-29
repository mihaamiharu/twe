---
title: 'Gunakan Action yang Tepat untuk Setiap Interaction'
description: 'Pilih action Playwright berdasarkan cara user berinteraksi dengan aplikasi dan state yang dibutuhkan scenario.'
---

## Setelah lesson ini, kamu bisa

- memilih action Playwright berdasarkan state yang memang dibutuhkan scenario;
- menjelaskan kenapa `check()` lebih aman daripada langsung memakai `click()` pada checkbox;
- membedakan kapan menggunakan `fill()`, `press()`, dan `pressSequentially()`;
- membedakan cara berinteraksi dengan native control, custom control, dan interaction lain seperti upload atau drag-and-drop; serta
- me-review interaction code dan mengecek apakah action yang digunakan sudah sesuai dengan state dan behavior yang dibutuhkan scenario.

## Kenapa ini penting buat QA

Pernah nggak sih kamu melihat test yang action-nya berhasil dijalankan, tapi ternyata action tersebut nggak benar-benar sesuai dengan scenario yang ingin diuji?

Misalnya, checkout test harus memastikan **Express delivery** aktif. Code-nya seperti ini:

```ts
await page.getByLabel('Express delivery').click();
```

Masalahnya, `click()` hanya mengubah state checkbox dari kondisi saat ini.

Kalau checkbox **Express delivery** ternyata sudah checked karena test data, browser state, atau perubahan product, `click()` justru akan membuatnya menjadi unchecked.

Padahal yang dibutuhkan scenario adalah memastikan **Express delivery aktif**, bukan hanya melakukan click.

Sebelum memilih action, QA engineer perlu memahami dua hal:

1. Bagaimana user berinteraksi dengan control tersebut?
2. State atau behavior apa yang dibutuhkan oleh scenario?

Jadi, method Playwright bukan hanya syntax yang perlu dihafal. Pilih method yang paling sesuai dengan cara user berinteraksi dan hasil yang dibutuhkan oleh scenario.

## Cara berpikir yang perlu kamu pegang

Pakai alur ini:

```text
Tujuan scenario
      ↓
Control yang digunakan user
      ↓
Action yang sesuai dengan state atau behavior yang dibutuhkan
      ↓
Hasil yang perlu diverifikasi
```

Jenis control tetap penting, tapi pilih action berdasarkan apa yang sebenarnya dibutuhkan oleh scenario:

| Yang ingin dilakukan                                | Action yang biasanya dipakai | Kenapa                                                    |
| --------------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| Klik button atau link                               | `click()`                    | User memang melakukan click pada control tersebut         |
| Mengisi field dengan value tertentu                 | `fill()`                     | Yang penting adalah final value di field                  |
| Memastikan checkbox atau radio terpilih             | `check()`                    | Memastikan control berada dalam checked state             |
| Memastikan checkbox tidak terpilih                  | `uncheck()`                  | Memastikan checkbox berada dalam unchecked state          |
| Memilih option dari native `<select>`               | `selectOption()`             | Menggunakan behavior native dari `<select>`               |
| Mengirim key ke control tertentu                    | `locator.press()`            | Key dikirim ke element yang memang menjadi target         |
| Menguji behavior yang terjadi pada setiap key press | `pressSequentially()`        | Setiap key event memang penting untuk behavior yang diuji |
| Upload file lewat file input                        | `setInputFiles()`            | Mengatur file yang dipilih melalui file input             |

Action hanya melakukan interaction. Action belum memastikan hasil akhirnya sudah sesuai dengan expected result.

Di lesson berikutnya kita akan membahas bagian verification ini lebih dalam.

## Coba kita bedah contoh nyata

Requirement checkout-nya seperti ini:

> Atur quantity menjadi 3, pilih Courier delivery, aktifkan Express delivery, place order, lalu tampilkan konfirmasi untuk 3 Express items.

### 1. Tentukan control yang digunakan user

```ts
const quantity = page.getByLabel('Quantity');
const deliveryMethod = page.getByLabel('Delivery method');
const expressDelivery = page.getByLabel('Express delivery');
const placeOrder = page.getByRole('button', { name: 'Place order' });
```

Di Module 4 kita sudah membahas cara memilih locator yang tepat. Sekarang fokusnya adalah memilih action yang sesuai untuk setiap control tersebut.

### 2. Gunakan `fill()` kalau yang penting adalah final value

```ts
await quantity.fill('3');
```

`fill()` mengisi field dengan value yang kita tentukan. Untuk scenario ini, yang penting adalah quantity akhirnya bernilai `3`.

Kita nggak perlu melakukan interaction yang lebih panjang seperti ini:

```ts
await quantity.click();
await quantity.press('ControlOrMeta+A');
await quantity.pressSequentially('3', { delay: 100 });
```

Cara tersebut menambahkan beberapa step yang sebenarnya nggak dibutuhkan oleh scenario.

Gunakan `pressSequentially()` kalau behavior aplikasi memang bergantung pada setiap key press, misalnya autocomplete yang menampilkan suggestion saat user mengetik.

Tapi delay tetap nggak memastikan suggestion sudah selesai dimuat. Hasil autocomplete tersebut tetap perlu diverifikasi dengan assertion.

### 3. Gunakan `selectOption()` untuk native `<select>`

```ts
await deliveryMethod.selectOption({ label: 'Courier' });
```

`selectOption()` digunakan untuk HTML `<select>` yang memang native.

Kalau dropdown-nya custom, interaction-nya bisa berbeda. Misalnya user perlu klik button atau combobox terlebih dahulu, lalu memilih option dari list yang muncul.

Jadi, jangan gunakan `selectOption()` hanya karena component tersebut terlihat seperti dropdown. Cek dulu element dan behavior yang sebenarnya.

### 4. Gunakan `check()` untuk memastikan checkbox aktif

```ts
await expressDelivery.check();
```

Kalau checkbox sudah checked, `check()` akan membiarkannya tetap checked. Kalau belum, Playwright akan mengaktifkannya lalu memastikan checked state-nya sudah benar.

Ini lebih aman daripada langsung memakai `click()`, karena `click()` hanya melakukan toggle dari state saat ini.

Gunakan `uncheck()` kalau scenario membutuhkan checkbox dalam keadaan off.

Untuk radio button, gunakan `check()` untuk memilih option yang harus aktif. Biasanya kita nggak perlu melakukan `uncheck()` pada radio button, karena memilih option lain dalam group yang sama akan otomatis mengganti pilihan.

### 5. Lakukan action lalu verify hasilnya

```ts
await placeOrder.click();

await expect(page.getByRole('status')).toHaveText(
  'Order placed: 3 items, Courier Express',
);
```

`click()` digunakan untuk menjalankan action **Place order**. Setelah itu, assertion memastikan hasil yang diharapkan benar-benar muncul.

Kalau requirement memang mengatakan user harus submit dengan menekan **Enter** dari quantity field, gunakan:

```ts
await quantity.press('Enter');
```

Gunakan `locator.press()` kalau key tersebut memang ditujukan ke satu control tertentu.

Gunakan `page.keyboard` kalau scenario memang membutuhkan keyboard interaction di level page, misalnya menahan **Shift** saat memilih beberapa item.

### 6. Gunakan action lain sesuai interaction yang diuji

Playwright juga mendukung interaction seperti:

```ts
await page.getByRole('button', { name: 'Products' }).hover();
await source.dragTo(target);
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
```

Untuk `setInputFiles()`, file yang digunakan harus tersedia di test environment.

Kalau yang ingin diuji hanya behavior upload, kamu juga bisa menggunakan file payload yang dibuat langsung dari test.

Apa pun caranya, jangan berhenti setelah action berhasil dijalankan. Tetap verify bagaimana aplikasi merespons file yang di-upload.

## Kapan pendekatan ini cocok dipakai?

Pilih Playwright action yang paling langsung menggambarkan interaction yang memang dilakukan user dalam scenario. Dengan begitu, hubungan antara requirement dan code lebih mudah dipahami saat review.

Gunakan `fill()` kalau yang penting adalah final value di field.

Gunakan `pressSequentially()` kalau aplikasi memang merespons setiap key press, misalnya autocomplete atau input yang punya behavior tertentu saat user mengetik. Jangan gunakan method ini hanya supaya automation terlihat lebih mirip user.

Gunakan `locator.press()` kalau key ditujukan ke satu control tertentu. Gunakan `page.keyboard` kalau scenario memang membutuhkan keyboard interaction di level page.

Gunakan `check()` atau `uncheck()` kalau yang penting adalah checkbox berada dalam state tertentu. `click()` tetap cocok kalau scenario memang menguji behavior toggle, misalnya memastikan setiap click membuka atau menutup sebuah section.

Gunakan `selectOption()` hanya untuk native `<select>`. Untuk custom dropdown, cek bagaimana component tersebut bekerja lalu ikuti interaction yang memang dilakukan user.

Jangan gunakan `dispatchEvent('click')` sebagai pengganti normal `click()`. Method ini mengirim event secara langsung dan tidak menjalankan interaction browser dengan cara yang sama seperti user click.

Gunakan hanya kalau scenario memang secara khusus membutuhkan event tersebut.

Jangan langsung memakai `click({ force: true })` saat click gagal. `force` bisa melewati beberapa pengecekan Playwright, termasuk kondisi ketika element lain sebenarnya menghalangi click.

Kalau memang perlu menggunakan `force`, pastikan ada alasan yang jelas dan sesuai dengan behavior yang ingin diuji.

## Kalau gagal, mulai cek dari mana?

Kalau action gagal, jangan langsung menambah `sleep` atau memakai `force`. Cek dulu beberapa hal ini:

1. Apakah locator sudah menemukan control yang tepat?
2. Apakah jenis control-nya sesuai dengan action yang digunakan, misalnya native `<select>`, file input, checkbox, atau custom component?
3. Apakah control tersebut visible dan enabled saat test dijalankan?
4. Apakah ada overlay, animation, sticky header, atau element lain yang menghalangi interaction?
5. Apakah scenario membutuhkan state tertentu, misalnya checkbox harus checked, bukan hanya melakukan `click()`?
6. Apakah action sebenarnya sudah berhasil, tapi assertion setelahnya yang fail? Kalau iya, masalahnya kemungkinan ada pada hasil yang diharapkan, bukan pada action.

Kalau upload gagal, cek file path yang digunakan oleh test runner, aturan ukuran atau type file, dan validation message yang ditampilkan aplikasi.

Kalau custom dropdown gagal, cek role dan cara user berinteraksi dengan component tersebut. Jangan langsung mengganti interaction-nya dengan CSS selector atau `force` hanya supaya test pass.

Saat review action di test code, cek beberapa hal ini:

* Apakah action yang digunakan sesuai dengan state atau behavior yang dibutuhkan scenario?
* Apakah `click()` bisa membuat checkbox yang sudah checked justru menjadi unchecked?
* Apakah `pressSequentially()` memang dibutuhkan karena aplikasi merespons setiap key press, atau hanya menambah delay?
* Apakah `selectOption()` digunakan pada native `<select>`?
* Apakah key press dikirim ke control yang tepat?
* Apakah `force`, `dispatchEvent`, atau `page.keyboard` digunakan tanpa alasan yang jelas dari requirement?
* Apakah ada assertion setelah action untuk verify hasilnya?
* Apakah test tetap benar kalau starting state berubah?

Code interaction yang kelihatannya benar belum tentu sesuai dengan scenario. Saat review, pastikan action yang dipilih memang sama dengan cara user berinteraksi dan behavior yang ingin diuji.

## Coba cek pemahamanmu

Review code notification settings berikut:

```ts
await page.getByLabel('Email alerts').click();
await page.getByLabel('Frequency').click();
await page.getByText('Daily').click();
await page.keyboard.type('qa@example.com', { delay: 100 });
await page.getByText('Save').click({ force: true });
```

Ternyata:

* **Email alerts** adalah checkbox yang harus aktif;
* **Frequency** adalah native `<select>`;
* email field punya label **Notification email**; dan
* **Save** adalah button yang seharusnya bisa di-click secara normal.

Coba jelaskan:

1. Action mana yang perlu diubah?
2. Action apa yang lebih sesuai untuk masing-masing control?
3. Kenapa action tersebut lebih sesuai dengan scenario?
4. Setelah **Save**, hasil apa yang perlu diverifikasi?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* gunakan `check()` untuk **Email alerts** karena scenario membutuhkan checkbox dalam keadaan checked;
* gunakan `selectOption({ label: 'Daily' })` untuk native **Frequency** `<select>`;
* gunakan `getByLabel('Notification email').fill('qa@example.com')` karena yang penting adalah final value di field;
* gunakan locator dengan role `button` dan normal `click()` untuk **Save**;
* cek kenapa code sebelumnya membutuhkan `force`, jangan langsung mempertahankannya; dan
* setelah **Save**, verify confirmation message atau value yang tetap tersimpan setelah reload, sesuai dengan requirement.

Perbaikan utamanya bukan membuat code menjadi lebih pendek. Yang penting, setiap action sekarang sesuai dengan control dan behavior yang memang dibutuhkan oleh scenario.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memilih action Playwright berdasarkan cara user berinteraksi dengan aplikasi, membedakan kapan perlu mengatur state tertentu dan kapan `click()` memang cukup, serta me-review penggunaan low-level interaction atau `force` yang nggak punya alasan jelas.

Selesaikan Core Practice yang menggabungkan pengisian form, checkbox state, dan checkout result.

Additional Practice juga tersedia untuk latihan `fill()`, selection, checkbox, keyboard, dan upload. Exercise untuk click, hover, dan drag-and-drop tetap bisa dikerjakan secara terpisah kalau memang relevan dengan project yang kamu kerjakan.
