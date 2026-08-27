---
title: 'Pilih Action yang Mewakili Intent Pengguna'
description: 'Pilih action Playwright berdasarkan state atau perilaku yang dibutuhkan pengguna, bukan sekadar method yang kebetulan bisa mengubah DOM.'
---

## Setelah lesson ini, kamu bisa

- memilih action yang menjelaskan intended state pengguna;
- menjelaskan kenapa `check()` lebih aman daripada blind click pada checkbox;
- membedakan kapan memakai `fill()`, `press()`, dan `pressSequentially()`;
- mengenali perbedaan native control, custom control, dan specialized interaction; serta
- me-review generated interaction code yang menyimpan asumsi tersembunyi.

## Kenapa ini penting buat QA

Pernah nggak sih kamu melihat test yang secara teknis berhasil mengubah halaman, tapi sebenarnya tidak menjelaskan maksud skenarionya?

Misalnya, checkout test harus memastikan Express delivery aktif. Generated code-nya seperti ini:

```ts
await page.getByLabel('Express delivery').click();
```

Click tersebut hanya melakukan toggle. Kalau karena test data, browser state, atau product change checkbox-nya sudah checked, baris yang sama justru mematikan Express delivery. Kodenya menjelaskan gesture, bukan state yang dibutuhkan.

Sebelum memilih action, seorang QA engineer perlu menjawab dua hal:

1. Apa yang dilakukan pengguna?
2. State atau perilaku apa yang sebenarnya dibutuhkan requirement?

Method Playwright bukan sekadar syntax yang perlu dihafal. Method yang tepat mencatat intent dan memberi runner informasi yang lebih jelas untuk melakukan interaksi dengan aman.

## Cara berpikir yang perlu kamu pegang

Pakai alur ini:

```text
Scenario intent
      ↓
Control dan behavior
      ↓
Action yang menjelaskan desired state
      ↓
Observable result
```

Jenis control memang penting, tapi hasil yang diminta jauh lebih penting:

| Intent                                           | Action yang biasanya dipakai | Kenapa                                           |
| ------------------------------------------------ | ---------------------------- | ------------------------------------------------ |
| Mengaktifkan button atau link                    | `click()`                    | Pengguna mengaktifkan satu control               |
| Mengganti text dengan value yang sudah diketahui | `fill()`                     | Final value field adalah intent-nya              |
| Memastikan checkbox atau radio terpilih          | `check()`                    | Action menjelaskan required checked state        |
| Memastikan checkbox tidak terpilih               | `uncheck()`                  | Action menjelaskan required unchecked state      |
| Memilih dari native `<select>`                   | `selectOption()`             | Memakai native selection behavior dari browser   |
| Mengirim key ke control tertentu                 | `locator.press()`            | Key punya target yang jelas                      |
| Menguji behavior yang bergantung pada tiap key   | `pressSequentially()`        | Individual key event memang bagian dari behavior |
| Upload lewat file input                          | `setInputFiles()`            | Mengatur file selection di browser               |

Sebuah action belum membuktikan business outcome. Action baru melakukan interaksi. Lesson berikutnya akan membahas batas ini secara khusus.

## Coba kita bedah contoh nyata

Requirement checkout-nya seperti ini:

> Atur quantity menjadi 3, pilih Courier delivery, aktifkan Express delivery, place order, lalu tampilkan konfirmasi untuk 3 Express items.

### 1. Jelaskan control dari makna yang dilihat pengguna

```ts
const quantity = page.getByLabel('Quantity');
const deliveryMethod = page.getByLabel('Delivery method');
const expressDelivery = page.getByLabel('Express delivery');
const placeOrder = page.getByRole('button', { name: 'Place order' });
```

Locator tersebut menjelaskan control mana yang penting. Di Module 4 kita sudah membahas cara memilih dan mempersempit locator. Sekarang fokusnya adalah action apa yang dilakukan pada control itu.

### 2. Atur known value dengan `fill()`

```ts
await quantity.fill('3');
```

`fill()` memberi focus pada editable control lalu mengganti value-nya. Ini pilihan normal ketika requirement peduli pada final value.

Generated code berikut biasanya tidak perlu:

```ts
await quantity.click();
await quantity.press('ControlOrMeta+A');
await quantity.pressSequentially('3', { delay: 100 });
```

Kode itu menambah behavior terkait timing dan platform tanpa menambah coverage. Gunakan sequential typing hanya kalau produk merespons setiap key event—misalnya autocomplete yang mengambil suggestion saat pengguna mengetik. Walaupun begitu, delay bukan bukti bahwa suggestion sudah selesai dimuat. Suggestion tetap perlu di-assert.

### 3. Pakai API yang cocok dengan native selection control

```ts
await deliveryMethod.selectOption({ label: 'Courier' });
```

`selectOption()` dipakai untuk HTML `<select>` sungguhan. Custom dropdown mungkin berbentuk button atau combobox yang membuka listbox. Flow penggunanya bisa membutuhkan click pada trigger lalu memilih option berdasarkan role. Jangan memaksakan `selectOption()` hanya karena tampilannya terlihat seperti dropdown.

### 4. Nyatakan checkbox state, bukan asal toggle

```ts
await expressDelivery.check();
```

Kalau checkbox sudah checked, `check()` akan membiarkannya checked. Kalau belum, Playwright akan mengubahnya lalu memverifikasi checked state. Hasilnya lebih aman terhadap perubahan starting state daripada blind click.

Pakai `uncheck()` kalau required state-nya off. Untuk radio button, `check()` menjelaskan pilihan yang harus aktif. Radio button biasanya tidak di-uncheck secara langsung karena memilih option lain akan mengubah satu group.

### 5. Jalankan business action lalu buktikan hasilnya

```ts
await placeOrder.click();

await expect(page.getByRole('status')).toHaveText(
  'Order placed: 3 items, Courier Express',
);
```

Click menjelaskan aktivasi. Assertion menjelaskan buktinya. Kalau keduanya terlihat jelas, skenarionya lebih gampang di-review.

Kalau requirement secara khusus mengatakan pengguna submit dengan Enter dari quantity field, barulah target behavior itu:

```ts
await quantity.press('Enter');
```

Pilih `locator.press()` ketika key ditujukan ke satu control. Gunakan `page.keyboard` hanya kalau global keyboard state memang sedang diuji, misalnya menahan Shift saat memilih beberapa item di seluruh page.

### 6. Perlakukan specialized action sesuai behavior-nya

Playwright juga mendukung interaction seperti:

```ts
await page.getByRole('button', { name: 'Products' }).hover();
await source.dragTo(target);
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
```

Path yang diberikan ke `setInputFiles()` harus benar-benar ada di filesystem test runner. In-memory file payload kecil bisa lebih cocok kalau yang diuji hanya upload behavior. Apa pun caranya, assert respons aplikasi terhadap file tersebut—jangan berhenti hanya karena method berhasil dijalankan.

## Kapan pendekatan ini cocok dipakai?

Pakai Playwright action dengan level tertinggi yang bisa menjelaskan skenario. Reviewer jadi bisa melihat hubungan langsung antara requirement dan code.

Gunakan `fill()` untuk known field value. Gunakan `pressSequentially()` ketika per-character keyboard behavior memang feature yang diuji, bukan supaya automation terlihat lebih manusiawi. Gunakan `locator.press()` untuk key pada satu control dan `page.keyboard` untuk page-level keyboard state yang nyata.

Gunakan `check()` atau `uncheck()` ketika checkbox state yang penting. Raw `click()` cocok kalau toggle itu sendiri adalah behavior yang diuji, misalnya memastikan setiap click mengganti disclosure state.

Gunakan `selectOption()` hanya pada native `<select>`. Untuk custom dropdown, inspect semantics-nya lalu ikuti real interaction contract.

Jangan menjadikan `dispatchEvent('click')` sebagai pengganti rutin untuk user interaction. Method itu mengirim event secara programmatic, tanpa actionability check dan complete browser input sequence yang sama dengan real click. Pakai hanya ketika dispatch event itu sendiri memang requirement yang sengaja diuji.

Jangan memakai `click({ force: true })` sebagai default fix. Force bisa melewati sebagian actionability protection, termasuk pemeriksaan apakah elemen lain akan menerima click. Pertahankan hanya kalau interaksi yang tidak biasa memang intentional dan alasannya terdokumentasi.

## Kalau gagal, mulai cek dari mana?

Saat action gagal, jangan langsung menambah sleep atau force. Mulai dari kontraknya:

1. Apakah locator menemukan control yang dimaksud secara unik?
2. Apakah jenis control sesuai asumsi—native select, file input, checkbox, atau custom widget?
3. Apakah control visible dan enabled pada business state saat ini?
4. Apakah ada overlay, animation, sticky header, atau elemen lain yang menghalangi input?
5. Apakah skenario butuh desired state seperti checked, bukan gesture seperti click?
6. Apakah action sebenarnya berhasil tetapi expected result sesudahnya gagal? Kalau iya, itu masalah outcome, bukan action.

Untuk upload yang gagal, periksa fixture path dari working directory runner, aturan size/type file, dan apakah aplikasi menampilkan validation di page yang sama.

Untuk custom dropdown yang gagal, inspect accessible role dan interaction aslinya. Mengganti semantic flow dengan CSS dan force biasanya cuma menyembunyikan petunjuk penting.

## Review hasil buatan AI

Untuk setiap generated action, tanyakan:

- Apakah method-nya menjelaskan required state atau hanya gesture?
- Bisakah `click()` membalik checkbox yang sebenarnya sudah benar?
- Apakah `pressSequentially()` menguji per-key behavior nyata atau cuma menambah delay?
- Apakah `selectOption()` dipakai pada `<select>` sungguhan?
- Apakah key press punya focused target yang benar?
- Apakah code memakai `force`, `dispatchEvent`, atau page-level keyboard tanpa requirement yang membenarkannya?
- Apakah ada observable assertion setelah action?
- Apakah test tetap benar kalau starting state berubah?

AI bisa membuat interaction syntax yang terlihat masuk akal. Tugasmu adalah menentukan apakah syntax itu benar-benar mewakili user behavior dan product risk.

## Coba cek pemahamanmu

Review generated code untuk notification settings ini:

```ts
await page.getByLabel('Email alerts').click();
await page.getByLabel('Frequency').click();
await page.getByText('Daily').click();
await page.keyboard.type('qa@example.com', { delay: 100 });
await page.getByText('Save').click({ force: true });
```

Ternyata Email alerts adalah checkbox yang harus aktif, Frequency adalah native `<select>`, email field punya label Notification email, dan Save adalah visible button yang seharusnya bisa di-click secara normal.

Jelaskan action mana yang perlu diubah, intent apa yang dijelaskan oleh penggantinya, dan result apa yang perlu di-assert.

## Bandingkan dengan cara pikir ini

Salah satu pendekatan yang masuk akal:

- pakai `check()` untuk Email alerts karena enabled adalah required state;
- pakai `selectOption({ label: 'Daily' })` untuk native Frequency select;
- pakai `getByLabel('Notification email').fill('qa@example.com')` karena hanya final value yang penting;
- pakai button-role locator dan normal `click()` untuk Save;
- investigasi kenapa generated code memakai force, jangan langsung mempertahankannya; dan
- assert saved status yang spesifik atau persisted value setelah reload, sesuai requirement.

Perbaikan utamanya bukan jumlah line yang lebih sedikit. Sekarang setiap action menjelaskan state atau behavior yang ingin dibuat oleh test.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memilih action dari scenario intent, membedakan state-setting dari toggling, dan mengkritisi generated code yang menambah low-level input atau force tanpa alasan.

Selesaikan Core Practice yang menggabungkan form value, checkbox state, dan checkout outcome. Mapped Additional Practice mencakup behavior fill, selection, checkbox, keyboard, dan upload. Exercise click, hover, dan drag-and-drop tetap tersedia sebagai standalone Practice kalau project membutuhkannya.
