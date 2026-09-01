---
title: 'Pastikan Proses Asynchronous Berjalan dalam Urutan yang Benar'
description: 'Gunakan Promise, async, dan await supaya test menunggu proses yang memang harus selesai sebelum lanjut, tanpa menganggap proses yang selesai berarti expected result sudah benar.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa itu `Promise` dan bagaimana `async function` menghasilkan value yang bisa ditunggu dengan `await`;
- menggunakan `await` ketika step berikutnya memang membutuhkan hasil dari proses asynchronous sebelumnya;
- membedakan menunggu sebuah action selesai dengan verify expected result;
- menentukan kapan beberapa proses harus dijalankan berurutan dan kapan bisa dijalankan secara parallel; dan
- menemukan `await` yang hilang atau error handling yang bisa membuat test tetap pass padahal seharusnya fail.

## Kenapa ini penting buat QA

Pernah lihat code automation seperti ini?

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

`click()`-nya nggak menggunakan `await`. Akibatnya, test bisa lanjut ke assertion saat action sebelumnya belum benar-benar selesai. Kalau `click()` ternyata fail, error-nya juga bisa muncul terpisah dan membuat root cause lebih sulit ditemukan.

Menambah sleep nggak menyelesaikan masalah ini. Kita perlu tahu step mana yang memang harus selesai dulu sebelum test lanjut, dan bagian mana yang digunakan untuk verify expected result dari aplikasi.

## Cara berpikir yang perlu kamu pegang

`Promise` mewakili hasil dari proses asynchronous. Saat dibuat, promise bisa masih `pending`, lalu akhirnya menjadi `fulfilled` atau `rejected`:

```text
pending → fulfilled dengan sebuah value
        ↘ rejected dengan sebuah error
```

`async function` selalu menghasilkan `Promise`. Di dalam function tersebut, `await` menghentikan sementara jalannya function sampai promise menjadi `fulfilled` atau `rejected`. Kalau promise berhasil, `await` memberikan value-nya. Kalau promise gagal, error-nya diteruskan ke test. `await` hanya menghentikan sementara function tersebut, bukan membekukan browser.

Tapi `await` bukan berarti seluruh aplikasi sudah selesai memproses semuanya, dan bukan berarti expected result sudah benar.

Anggap `await` sebagai cara untuk menjaga urutan step yang memang saling bergantung, bukan sebagai pengganti sleep.

Kalau step berikutnya bergantung pada action sebelumnya, gunakan `await`:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Playwright action, navigation, dan assertion juga perlu di-`await` supaya test runner bisa mengetahui kapan step tersebut selesai atau fail.

Kalau ada beberapa proses yang benar-benar nggak saling bergantung, proses tersebut nggak selalu harus ditunggu satu per satu. Nanti kita akan lihat kapan proses bisa berjalan secara parallel dan kapan tetap harus sequential.

![Sebuah test asynchronous menunggu setup dan browser action yang saling bergantung secara berurutan, lalu memakai assertion terpisah untuk membuktikan outcome pengguna.](/images/tutorials/async-test-sequence.svg)

_`await` proses yang memang perlu selesai dulu; gunakan assertion untuk verify expected result._

Coba lihat beberapa expression yang sering muncul di Playwright test:

| Expression                      | Perlu `await`? | Fungsinya                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------ |
| `page.getByRole(...)`           | Tidak          | Membuat locator untuk menemukan element                            |
| `locator.click()`               | Ya             | Melakukan click dan menunggu action selesai atau fail              |
| `page.goto(...)`                | Ya             | Membuka halaman dan menunggu navigation sesuai behavior Playwright |
| `response.json()`               | Ya             | Membaca dan parse response body                                    |
| `expect(locator).toBeVisible()` | Ya             | Menunggu sampai assertion pass atau timeout                        |

Jadi, jangan menambahkan `await` hanya supaya semua baris terlihat konsisten.

Lihat apakah proses tersebut asynchronous dan apakah test memang perlu menunggu proses itu selesai sebelum lanjut ke step berikutnya.

## Coba kita bedah contoh nyata

Test membutuhkan order yang sudah disiapkan sebelum membuka halaman detailnya:

```ts
import { test, expect } from '@playwright/test';

test('customer can view a prepared order', async ({ page, request }) => {
  const response = await request.post('/api/test/orders', {
    data: {
      product: 'Mechanical Keyboard',
      quantity: 1,
    },
  });

  expect(response.ok()).toBeTruthy();

  const order = await response.json();

  await page.goto(`/orders/${order.id}`);

  await expect(
    page.getByRole('heading', { name: `Order ${order.id}` }),
  ).toBeVisible();
});
```

Coba lihat urutan dependency-nya:

1. `request.post()` harus selesai dulu sebelum kita bisa mengecek response.
2. `response.json()` harus selesai sebelum `order.id` bisa digunakan.
3. `order.id` dibutuhkan untuk membuka halaman order yang benar.
4. Setelah halaman tersebut terbuka, test baru bisa verify hasil yang dilihat user.
5. Assertion pada heading memastikan halaman order yang benar memang tampil.

Membuat locator sendiri nggak menjalankan action di browser:

```ts
const heading = page.getByRole('heading', { name: `Order ${order.id}` });

await expect(heading).toBeVisible();
```

`getByRole()` hanya mendefinisikan element yang ingin dicari. Proses asynchronous-nya terjadi saat locator tersebut digunakan dalam action atau assertion seperti `click()` atau `expect()`.

### Action selesai bukan berarti expected result sudah benar

Baris ini menunggu sampai Playwright selesai melakukan click:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
```

Tapi itu belum berarti order berhasil diproses atau confirmation sudah muncul di UI.

Kita tetap perlu verify expected result, misalnya:

```ts
await expect(
  page.getByRole('heading', { name: 'Order confirmed' }),
).toBeVisible();
```

## Kapan pendekatan ini cocok dipakai?

Jalankan step secara berurutan kalau step berikutnya memang bergantung pada hasil dari step sebelumnya.

Contohnya, pada user flow seperti ini:

```text
isi data yang wajib
↓
submit form
↓
verify hasilnya
```

Urutannya memang harus dijaga karena setiap step bergantung pada step sebelumnya.

Kalau ada beberapa setup yang benar-benar nggak saling bergantung, prosesnya bisa dijalankan bersamaan:

```ts
const [customer, product] = await Promise.all([
  createCustomer(request),
  createProduct(request),
]);
```

Gunakan `Promise.all` hanya kalau kedua proses tersebut memang bisa berjalan sendiri-sendiri dan nggak menggunakan atau mengubah data yang sama.

Kalau salah satu promise di dalam `Promise.all` menjadi `rejected`, `Promise.all` juga ikut `rejected`. Promise lain yang sudah berjalan nggak otomatis dihentikan.

Jangan gunakan `Promise.all` untuk UI action yang saling bergantung:

```ts
// Salah: submit bergantung pada field Email yang sudah diisi.
await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

`fill()` harus selesai dulu sebelum `click()` dilakukan.

Dan jangan tambahkan `await` ke semua expression hanya supaya code terlihat konsisten. Cek dulu apakah expression tersebut memang menghasilkan proses asynchronous yang perlu ditunggu.

## Kalau test fail, mulai cek dari mana?

Misalnya test ini kadang fail:

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Cek dulu apakah ada step asynchronous yang belum ditunggu:

1. Apakah `click()` menghasilkan `Promise`?
2. Apakah assertion berikutnya bergantung pada click tersebut selesai?
3. Apakah ada error dari `click()` yang muncul terpisah di output test?
4. Apakah masalahnya memang karena confirmation lambat muncul, atau karena action sebelumnya belum selesai?

Perbaiki dulu urutannya:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Kalau assertion masih fail setelah itu, baru cek apakah expected result dari aplikasi memang muncul.

Jangan langsung menggantinya dengan `waitForTimeout`, karena masalahnya belum tentu soal waktu tunggu.

Hati-hati juga saat menggunakan `try/catch`:

```ts
try {
  await createTestOrder();
} catch {
  // error diabaikan
}
```

Kalau error-nya diabaikan, test bisa tetap lanjut walaupun setup awalnya sebenarnya fail.

Gunakan `catch` kalau memang ada recovery yang ingin dilakukan. Kalau tujuannya hanya menambahkan context ke error, lempar error-nya lagi:

```ts
try {
  await createTestOrder();
} catch (error) {
  throw new Error('Could not create the controlled test order', {
    cause: error,
  });
}
```

Saat review code asynchronous di test, coba cek:

* Proses ini menghasilkan value atau perubahan state apa?
* Step berikutnya bergantung pada hasil tersebut atau nggak?
* Apakah ada `await` yang hilang dari action, navigation, parsing data, atau assertion?
* Apakah `await` justru dipakai pada locator atau value biasa yang sebenarnya nggak perlu ditunggu?
* Apakah UI action yang saling bergantung dimasukkan ke `Promise.all`?
* Apakah `catch` membuat error setup atau error aplikasi jadi nggak kelihatan?
* Setelah action selesai, assertion apa yang masih perlu dijalankan untuk verify expected result?

Kalau urutan dependency-nya belum jelas, jangan langsung anggap code tersebut sudah benar.

## Coba cek pemahamanmu

Review code berikut:

```ts
const orderPromise = createTestOrder();

await page.goto(`/orders/${orderPromise.id}`);

await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

Coba jawab:

1. Kenapa `orderPromise.id` belum bisa digunakan?
2. Proses apa yang harus selesai sebelum test membuka halaman order?
3. Kenapa `fill()` dan `click()` nggak aman dijalankan bersamaan?
4. Setelah submit, apa yang masih perlu diverifikasi?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- `createTestOrder()` menghasilkan `Promise`, jadi data order-nya belum tersedia saat `orderPromise.id` diakses.
- Tunggu dulu proses pembuatan order selesai dengan `const order = await createTestOrder()`, baru gunakan `order.id` untuk membuka halaman yang benar.
- `click()` bergantung pada field Email yang sudah terisi. Kalau `fill()` dan `click()` dijalankan bersamaan, submit bisa terjadi sebelum input selesai diisi.
- Setelah submit, tetap perlu verify expected result sesuai scenario, misalnya confirmation message muncul atau user berpindah ke halaman yang benar.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memahami alur `Promise` di dalam test, menggunakan `await` pada step yang memang harus selesai lebih dulu, membedakan setup yang bisa berjalan bersamaan dengan UI action yang harus berurutan, dan tetap verify expected result setelah action selesai.

Selesaikan async Core Practice dengan memastikan setup test data sudah selesai sebelum data tersebut digunakan.

Challenge tentang error handling dan parallel execution bisa dikerjakan sebagai Additional Practice kalau kamu ingin latihan lebih lanjut. Keduanya bukan berarti retry atau concurrency harus digunakan sebagai default.

Di lesson terakhir module ini, kita akan membahas TypeScript supaya kamu bisa me-review type dan editor warning tanpa menganggap semuanya otomatis benar saat test dijalankan.
