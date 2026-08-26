---
title: 'Jaga Urutan Langkah Asynchronous di Dalam Test'
description: 'Gunakan promise, async, dan await untuk menjaga dependency tanpa menganggap operasi yang selesai sebagai outcome yang sudah terbukti.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa yang diwakili promise dan apa yang dikembalikan `async function`;
- menaruh `await` pada operasi asynchronous yang hasilnya dibutuhkan langkah berikutnya;
- membedakan menunggu action selesai dengan membuktikan outcome aplikasi;
- memilih eksekusi sequential atau parallel berdasarkan dependency; dan
- mendiagnosis `await` yang hilang atau error handling yang mengubah kegagalan menjadi false pass.

## Kenapa ini penting buat QA

Pernah lihat kode automation yang kelihatannya biasa saja seperti ini?

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Promise dari click tidak di-`await`. Assertion bisa mulai ketika action masih berjalan, sementara error dari click mungkin muncul terpisah dari baris yang sebenarnya menyebabkan masalah.

Menambah sleep nggak menjelaskan dependency tersebut. Sebagai QA, kamu perlu tahu operasi mana yang menghasilkan value, langkah mana yang membutuhkan value itu, dan bukti terpisah apa yang membuktikan produk berhasil.

## Cara berpikir yang perlu kamu pegang

`Promise` mewakili operasi asynchronous yang nantinya akan selesai:

```text
pending → fulfilled dengan sebuah value
        ↘ rejected dengan sebuah error
```

`async function` selalu mengembalikan promise. Di dalam function itu, `await` menghentikan sementara progres function sampai value yang ditunggu selesai. `await` tidak membekukan browser dan tidak membuktikan semua side effect aplikasi sudah berhasil.

![Sebuah test asynchronous menunggu setup dan browser action yang saling bergantung secara berurutan, lalu memakai assertion terpisah untuk membuktikan outcome pengguna.](/images/tutorials/async-test-sequence.svg)

_Await operasi yang kamu butuhkan; assert outcome yang perlu kamu buktikan._

Coba klasifikasikan expression yang umum di dalam test:

| Expression                      | Langsung atau asynchronous? | Apa yang diberikan                                   |
| ------------------------------- | --------------------------- | ---------------------------------------------------- |
| `page.getByRole(...)`           | Langsung                    | Deskripsi locator                                    |
| `locator.click()`               | Asynchronous                | Action Playwright yang selesai atau gagal            |
| `page.goto(...)`                | Asynchronous                | Navigation yang selesai atau gagal sesuai kontraknya |
| `response.json()`               | Asynchronous                | Response data yang sudah di-parse                    |
| `expect(locator).toBeVisible()` | Asynchronous                | Hasil assertion yang melakukan retry                 |

Langkah berikutnya—bukan sekadar supaya bentuk kodenya seragam—yang menentukan di mana `await` dibutuhkan.

## Coba kita bedah contoh nyata

Test membutuhkan order yang terkontrol sebelum membuka halaman detailnya:

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

Telusuri dependency-nya:

1. `request.post` harus selesai sebelum response bisa diperiksa.
2. `response.json()` harus selesai sebelum `order.id` tersedia.
3. ID itu dibutuhkan untuk membuat navigation URL.
4. Navigation membentuk halaman tempat bukti akan diamati.
5. Heading assertion secara terpisah membuktikan hasil yang dilihat pengguna.

Membuat locator tidak memulai operasi browser yang asynchronous:

```ts
const heading = page.getByRole('heading', { name: `Order ${order.id}` });
await expect(heading).toBeVisible();
```

Locator-nya hanya sebuah deskripsi. Web assertion-lah yang melakukan pekerjaan asynchronous.

### Action selesai bukan berarti proses bisnis berhasil

Baris ini menunggu Playwright menyelesaikan click:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
```

Baris tersebut tidak otomatis membuktikan backend menerima order atau confirmation UI sudah muncul. Tetap buat assertion:

```ts
await expect(
  page.getByRole('heading', { name: 'Order confirmed' }),
).toBeVisible();
```

## Kapan pendekatan ini cocok dipakai?

Jalankan operasi secara sequential saat satu langkah menghasilkan state atau value yang dibutuhkan langkah berikutnya. Kebanyakan user flow memang sengaja berurutan: isi data wajib, submit, lalu amati hasilnya.

Setup yang independen boleh berjalan bersamaan:

```ts
const [customer, product] = await Promise.all([
  createCustomer(request),
  createProduct(request),
]);
```

Pakai `Promise.all` hanya setelah memastikan dua operasi itu tidak saling bergantung dan tidak berebut mutable state yang sama. `Promise.all` akan reject kalau salah satu promise di dalamnya reject.

Jangan memasukkan UI action yang saling bergantung ke `Promise.all`:

```ts
// Salah: submission bergantung pada field yang sudah diisi.
await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

Jangan menambahkan `await` ke value biasa hanya supaya tampilan kodenya konsisten. Telusuri dulu apa yang dikembalikan expression tersebut.

## Kalau gagal, mulai cek dari mana?

Misalnya test ini kadang gagal sebelum click selesai:

```ts
page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Periksa dependency pertama yang gagal atau hilang:

1. Apakah expression pertama mengembalikan promise?
2. Apakah assertion bergantung pada action itu selesai?
3. Apakah ada unhandled rejection yang dilaporkan di bagian output lain?
4. Apakah outcome produk memang lambat, atau action-nya sama sekali belum selesai?

Perbaiki dependency-nya:

```ts
await page.getByRole('button', { name: 'Submit order' }).click();
await expect(page.getByText('Order confirmed')).toBeVisible();
```

Kalau assertion masih gagal, investigasi outcome produknya. Jangan menggantinya dengan `waitForTimeout`.

Hati-hati juga dengan `try/catch`:

```ts
try {
  await createTestOrder();
} catch {
  // error diabaikan
}
```

Kode itu bisa membiarkan test lanjut dengan setup yang tidak valid. Gunakan `catch` hanya kalau recovery memang disengaja, atau kalau kamu menambah konteks lalu melempar ulang error:

```ts
try {
  await createTestOrder();
} catch (error) {
  throw new Error('Could not create the controlled test order', {
    cause: error,
  });
}
```

## Review hasil buatan AI

Telusuri setiap baris asynchronous di dalam kode hasil generate:

- Value atau state apa yang dihasilkan promise ini?
- Langkah mana yang bergantung pada hasilnya?
- Apakah `await` hilang dari action, navigation, data parsing, atau assertion?
- Apakah `await` malah ditambahkan ke locator atau value biasa tanpa kegunaan?
- Apakah UI action yang bergantung satu sama lain dimasukkan ke `Promise.all`?
- Apakah `catch` menyembunyikan kegagalan setup atau produk?
- Setelah action selesai, assertion apa yang masih membuktikan business outcome?

Kalau kamu belum bisa menjelaskan jaminannya, jangan percaya urutan kodenya dulu.

## Coba cek pemahamanmu

Review kode hasil generate ini:

```ts
const orderPromise = createTestOrder();

await page.goto(`/orders/${orderPromise.id}`);

await Promise.all([
  page.getByLabel('Email').fill('qa@example.com'),
  page.getByRole('button', { name: 'Submit' }).click(),
]);
```

Jelaskan:

1. Kenapa `orderPromise.id` salah?
2. Operasi mana yang harus selesai sebelum navigation?
3. Kenapa fill dan click tidak aman dijalankan secara parallel?
4. Assertion apa yang masih diperlukan setelah submit?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- `createTestOrder()` mengembalikan promise, bukan resolved order object. Artinya, ID belum tersedia.
- Gunakan `const order = await createTestOrder()` sebelum membuat URL.
- Submission bergantung pada required email yang sudah diisi. Menjalankan keduanya bersamaan akan membuat race.
- Setelah click dilakukan secara sequential, assert confirmation, navigation, atau bukti observable lain sesuai intent produk.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menelusuri promise di dalam test, menunggu dependency yang nyata, memisahkan setup independen dari UI behavior yang sequential, dan tetap membuat assertion setelah action selesai.

Selesaikan async Core Practice dengan menunggu controlled setup data. Lesson terakhir di module ini akan menambah kemampuan review TypeScript supaya rasa aman dari editor tidak tertukar dengan runtime evidence.
