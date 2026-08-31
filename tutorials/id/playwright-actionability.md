---
title: 'Bedakan Kapan Action Siap Dijalankan dan Kapan Hasilnya Siap Diverifikasi'
description: 'Pahami apa yang ditunggu Playwright sebelum menjalankan action, lalu tentukan state aplikasi yang perlu ditunggu dan diverifikasi setelah action selesai.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan bahwa setiap Playwright action punya kondisi yang berbeda sebelum bisa dijalankan;
- membedakan kapan element siap digunakan, kapan action dijalankan, kapan aplikasi masih memproses perubahan, dan kapan expected result sudah bisa diverifikasi;
- menggunakan assertion yang melakukan retry daripada fixed sleep;
- mencari penyebab action timeout dan memperbaiki root cause-nya, bukan langsung memakai `force` atau nambahin timeout;
- me-review penggunaan wait dan memastikan ada kondisi yang jelas untuk menentukan kapan test boleh lanjut.

## Kenapa ini penting buat QA

Coba bayangin ada profile page dengan button **Save**. Button-nya enabled, Playwright berhasil melakukan click, lalu test selesai dengan status pass.

Beberapa saat kemudian, server ternyata menolak update tersebut.

Apakah test sudah memastikan profile berhasil disimpan? Belum. Test baru memastikan button **Save** bisa di-click.

Masalah seperti ini biasanya muncul dalam dua bentuk:

* test pass padahal hasil akhirnya belum benar-benar diverifikasi; dan
* test jadi flaky karena menggunakan fixed sleep untuk menebak kapan aplikasi sudah siap.

Playwright bisa otomatis menunggu sampai element siap untuk di-interact. Tapi setelah action dijalankan, kita tetap perlu menentukan sendiri hasil apa yang harus ditunggu dan diverifikasi.

Menentukan hasil yang perlu ditunggu dan diverifikasi tetap menjadi bagian dari test design.

## Cara berpikir yang perlu kamu pegang

Pisahkan flow menjadi empat bagian:

```text
1. Element siap untuk di-interact
              ↓
2. Action dijalankan
              ↓
3. Aplikasi memproses perubahan
              ↓
4. Expected result siap diverifikasi
```

![Test intent memilih action, Playwright memeriksa action-specific readiness, lalu test tetap menunggu observable application outcome.](/images/tutorials/action-readiness-outcome.svg)

_Auto-waiting melindungi batas interaction. Web assertion melakukan sinkronisasi dengan product outcome._

Actionability check yang dilakukan Playwright berbeda untuk setiap method. Playwright hanya mengecek kondisi yang memang dibutuhkan oleh action tersebut:

| Action           | Visible | Stable | Receives events | Enabled | Editable |
| ---------------- | ------- | ------ | --------------- | ------- | -------- |
| `click()`        | Ya      | Ya     | Ya              | Ya      | Tidak    |
| `fill()`         | Ya      | Tidak  | Tidak           | Ya      | Ya       |
| `check()`        | Ya      | Ya     | Ya              | Ya      | Tidak    |
| `selectOption()` | Ya      | Tidak  | Tidak           | Ya      | Tidak    |

Untuk action yang hanya boleh dilakukan pada satu element, Playwright juga memastikan locator menemukan satu target yang jelas. Kita sudah membahas strictness ini di Module 4.

Semua pengecekan tersebut hanya memastikan Playwright bisa melakukan action pada element yang dituju.

Pengecekan itu belum memastikan hasil setelah action sudah benar. Misalnya, `click()` pada button **Save** bisa berhasil, tapi profile tetap gagal disimpan oleh server.

## Coba kita bedah contoh nyata

Requirement-nya seperti ini:

> Saat user mengubah display name lalu menyimpan, page menampilkan **“Profile saved”** dan nama baru tetap terlihat.

Aplikasi men-disable button **Save** selama proses submit, lalu memperbarui status message setelah proses selesai.

### 1. Jalankan action yang sesuai dengan scenario

```ts
const displayName = page.getByLabel('Display name');
const saveButton = page.getByRole('button', { name: 'Save profile' });
const status = page.getByRole('status');

await displayName.fill('Rani QA');
await saveButton.click();
```

Sebelum menjalankan `click()`, Playwright menunggu sampai button ditemukan dengan jelas, visible, stable, bisa menerima click, dan enabled.

Kalau ada overlay yang menghalangi button atau button masih disabled, action akan fail.

Tapi `click()` yang berhasil belum berarti proses save sudah selesai.

### 2. Verify hasil setelah action

```ts
await expect(status).toHaveText('Profile saved');
await expect(displayName).toHaveValue('Rani QA');
```

Assertion Playwright akan melakukan retry sampai kondisi yang diharapkan terpenuhi atau timeout.

Jadi kita nggak perlu menebak berapa lama proses save akan selesai dengan fixed sleep. Test cukup menunggu kondisi yang memang menunjukkan hasil yang diharapkan.

Assertion yang digunakan tetap mengikuti requirement. Untuk satu scenario, message **“Profile saved”** mungkin sudah cukup.

Kalau yang ingin diuji adalah apakah perubahan benar-benar tersimpan, test bisa reload page lalu verify bahwa value **“Rani QA”** tetap ada.

Nggak semua scenario perlu menambahkan semua assertion. Pilih verification yang memang sesuai dengan hal yang ingin diuji.

### 3. Pahami kenapa fixed sleep kurang reliable

```ts
await saveButton.click();
await page.waitForTimeout(2000);
await expect(status).toHaveText('Profile saved');
```

Code ini selalu menunggu dua detik, meskipun proses save selesai dalam 100 milidetik atau 1,9 detik.

Kalau environment sedang lebih lambat dan prosesnya butuh 2,1 detik, test tetap bisa fail. Sebaliknya, kalau aplikasi cepat, test tetap membuang waktu untuk menunggu.

Masalah utamanya, fixed sleep hanya menunggu berdasarkan waktu. Sleep tidak tahu kondisi apa yang sebenarnya sedang ditunggu.

Di case ini, assertion sudah menjelaskan kondisi yang dibutuhkan: status berubah menjadi **“Profile saved”**.

Biarkan assertion yang menunggu sampai kondisi tersebut terpenuhi.

### 4. Bedakan masalah sebelum dan sesudah action

Kalau `saveButton.click()` timeout, cek kondisi element sebelum action dijalankan:

* Apakah form validation membuat button tetap disabled?
* Apakah loading mask atau cookie banner menghalangi click?
* Apakah animation membuat button belum stable?
* Apakah locator menemukan duplicate element yang hidden?

Kalau `click()` berhasil tapi `toHaveText('Profile saved')` timeout, cek apa yang terjadi setelah action:

* Apakah request gagal?
* Apakah aplikasi menampilkan error?
* Apakah assertion mengecek status message atau page yang salah?
* Apakah hasil yang diharapkan memang sesuai dengan requirement?

Keduanya punya root cause yang berbeda.

Dengan membedakan masalah sebelum dan sesudah action, kita bisa lebih cepat menentukan bagian mana yang perlu diinvestigasi dari error message atau trace.

### 5. Tunggu browser event kalau hasilnya memang muncul sebagai event

Nggak semua hasil muncul sebagai perubahan di page. Misalnya, button **Export CSV** bisa menghasilkan download:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('customers.csv');
```

`waitForEvent('download')` dipasang sebelum `click()` supaya test nggak melewatkan event kalau download mulai terlalu cepat.

Di case seperti ini, yang perlu ditunggu bukan perubahan DOM, tapi browser event yang memang dihasilkan oleh action tersebut.

Lesson berikutnya akan membahas pattern seperti ini, termasuk download dan interaction dengan browser event lain.

## Kapan pendekatan ini cocok dipakai?

Gunakan Playwright action seperti biasa dan biarkan Playwright menunggu sampai element siap untuk di-interact.

Setelah action dijalankan, gunakan assertion seperti `toBeVisible()`, `toHaveText()`, `toHaveValue()`, atau `toHaveURL()` untuk menunggu dan verify hasil yang memang diharapkan oleh scenario.

Gunakan `waitForEvent()` kalau hasil dari action muncul sebagai browser event, misalnya download atau popup. Pasang event listener sebelum action yang memicu event tersebut.

Gunakan network wait hanya kalau response dari request memang perlu dicek atau memang dibutuhkan untuk menentukan kapan test boleh lanjut. Response yang sukses belum tentu berarti hasil yang dilihat user sudah benar.

Jangan langsung menggunakan `waitForLoadState('networkidle')` sebagai tanda bahwa page sudah siap. Aplikasi modern bisa tetap menjalankan analytics, polling, atau streaming connection meskipun UI sebenarnya sudah bisa digunakan.

Lebih baik tunggu kondisi yang memang relevan dengan scenario, misalnya URL berubah, heading muncul, button menjadi enabled, atau status message tampil.

Jangan memperbesar timeout hanya supaya test punya waktu lebih lama. Timeout hanya menentukan berapa lama test mau menunggu, bukan kondisi apa yang sebenarnya sedang ditunggu.

## Kalau gagal, mulai cek dari mana?

Cari dulu bagian mana yang sebenarnya bermasalah:

1. **Locator:** element yang dicari tidak ditemukan atau locator menemukan lebih dari satu element.
2. **Sebelum action:** element ditemukan, tapi tidak pernah siap untuk di-interact.
3. **Setelah action:** action berhasil dijalankan, tapi aplikasi masuk ke flow atau state yang tidak diharapkan.
4. **Expected result:** kondisi yang seharusnya muncul setelah action tidak pernah terpenuhi.
5. **Context lain:** hasil ternyata muncul di popup, iframe, dialog, download, atau page lain.

Gunakan error message Playwright, trace, DOM snapshot, screenshot, console, dan network untuk membantu menentukan masalahnya ada di bagian mana.

`click({ force: true })` melewati beberapa actionability check yang dianggap non-essential, misalnya pengecekan apakah target menerima pointer event. `force` tidak membuat form yang belum valid menjadi valid dan tidak membuktikan expected result sudah tercapai.

Memperbesar timeout juga bisa saja hanya membuat test menunggu lebih lama sebelum akhirnya fail.

Retry bisa membantu melihat apakah failure hanya terjadi sesekali, tapi retry bukan solusi untuk synchronization yang salah. Kalau test hanya bisa pass setelah retry, root cause-nya tetap perlu dicari.

Saat review action dan wait di dalam test, cek beberapa hal ini:

* Kondisi apa yang sudah ditunggu Playwright sebelum menjalankan action?
* Setelah action, kondisi apa yang perlu muncul untuk memastikan expected result tercapai?
* Apakah `waitForTimeout()` hanya digunakan untuk menebak berapa lama proses akan selesai?
* Apakah timeout diperbesar hanya supaya test punya waktu lebih lama?
* Apakah `force` digunakan karena element tertutup oleh element lain tanpa memperbaiki penyebabnya?
* Apakah test menunggu `networkidle` tanpa alasan yang memang relevan dengan scenario?
* Kalau test menunggu network response, apakah hasil yang dilihat user tetap diverifikasi?
* Apakah hasil dari action sebenarnya muncul di popup, iframe, dialog, download, atau page lain?

Menambahkan wait belum tentu membuat test lebih reliable. Wait yang baik harus punya kondisi yang jelas: test tahu apa yang sedang ditunggu dan kapan boleh lanjut.

## Coba cek pemahamanmu

Review test berikut:

```ts
await page.getByRole('button', { name: 'Submit claim' }).click({
  force: true,
});

await page.waitForTimeout(3000);

expect(await page.getByText('Submitted').isVisible()).toBe(true);
```

Button **Submit claim** akan tetap disabled sampai semua required evidence sudah di-upload. Setelah submission berhasil, server memperbarui status menjadi **“Claim submitted”** secara asynchronous.

Jelaskan:

1. Kenapa `force` bukan cara yang tepat untuk menangani button yang masih disabled?
2. Kondisi apa yang seharusnya ditunggu setelah submission, daripada menggunakan fixed sleep?
3. Kenapa `isVisible()` yang dicek sekali lebih mudah fail dibanding Playwright web assertion?
4. Bagaimana cara membedakan masalah sebelum `click()` dengan masalah setelah submission?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Pastikan required evidence sudah di-upload terlebih dahulu. `force` tidak membuat form yang belum valid menjadi valid. Kalau button masih disabled, cek validation state-nya.
* Gunakan normal `click()` supaya Playwright tetap mengecek apakah button benar-benar siap untuk di-click.
* Gunakan `await expect(page.getByRole('status')).toHaveText('Claim submitted')` supaya assertion melakukan retry sampai status yang diharapkan muncul.
* Kalau `click()` fail, cek kondisi button dan validation state sebelum submission.
* Kalau `click()` berhasil tapi assertion fail, cek request, error message di UI, dan state aplikasi setelah submission.

Perbaikannya bukan sekadar mengurangi waktu tunggu. Test sekarang menunggu kondisi yang memang menunjukkan bahwa submission berhasil.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membedakan apa yang otomatis ditunggu Playwright sebelum action dijalankan dan apa yang tetap perlu ditunggu serta diverifikasi setelah action selesai.

Selesaikan Core Practice yang menyimpan profile lalu menunggu status yang sesuai tanpa menggunakan `waitForTimeout()`.

Lesson ini tidak punya Additional Practice terpisah. Fokus utamanya adalah memahami perbedaan antara element yang siap untuk di-interact dan hasil aplikasi yang baru muncul setelah action.

Exercise dynamic table tetap tersedia sebagai latihan tambahan untuk locator.
