---
title: 'Pastikan Setup, Scope, dan Cleanup Setiap Fixture Jelas'
description: 'Pilih helper, hook, atau fixture berdasarkan resource yang dibutuhkan test, kapan resource dibuat, siapa yang menggunakannya, dan siapa yang melakukan cleanup.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan resource apa yang diberikan Playwright fixture dan kapan setup-nya dijalankan;
- memilih antara helper, hook, dan custom fixture;
- menelusuri setup sebelum `await use(...)`, value yang diberikan ke test, dan teardown setelahnya;
- menggunakan test scope sebagai pilihan awal untuk mutable state; serta
- mendiagnosis setup yang tersembunyi, scope yang salah, dan cleanup yang nggak berjalan.

## Kenapa ini penting buat QA

Test membutuhkan lebih dari step yang terlihat. Test mungkin butuh browser page, user yang sudah login, test data sendiri, API client, dan cleanup. Kalau semua kebutuhan tersebut disembunyikan di dalam `beforeEach` yang besar, test bisa fail sebelum menjalankan baris pertamanya. Kita juga jadi sulit melihat setup mana yang bermasalah atau menjalankan test tersebut sendirian.

Fixture memberi nama pada resource yang dibutuhkan test. Setiap test bisa meminta fixture yang diperlukan, lalu fixture melakukan cleanup sesuai scope-nya. Tapi fixture nggak selalu lebih jelas daripada helper. Fixture yang dirancang dengan buruk bisa menyembunyikan action penting, membuat beberapa test memakai mutable state yang sama, dan mengubah test sederhana menjadi mini-framework.

Hal ini juga penting dalam agent-assisted workflow. Coding agent bisa membuat fixture dengan cepat, tapi QA tetap perlu memastikan setup, scope, dan cleanup-nya sesuai dengan scenario yang sedang diuji.

Sebelum membuat fixture, tanyakan: resource ini dibuat kapan, test atau worker mana yang boleh mengubahnya, dan siapa yang melakukan cleanup?

## Cara berpikir yang perlu kamu pegang

Baca custom fixture berdasarkan urutan resource dibuat, digunakan, lalu dibersihkan:

```text
Dependency yang dibutuhkan
        ↓
Setup resource dan cek hasilnya
        ↓
await use(value) ── value diberikan ke test atau fixture lain
        ↓
Teardown dan cleanup resource

Scope menentukan apakah urutan ini berjalan per test atau per worker.
```

![Fixture menyiapkan dependency, mengecek resource, memberikan value ke test lewat use, lalu melakukan cleanup sesuai test atau worker scope.](/images/tutorials/fixture-lifecycle-ownership.svg)

_Code sebelum `await use(...)` menjalankan setup. Setelah test selesai, code di bawahnya menjalankan teardown. Scope menentukan apakah resource dibuat untuk satu test atau dipakai oleh satu worker._

Built-in fixture Playwright sudah mengikuti model ini:

| Built-in fixture | Resource yang diberikan                                  | Scope biasanya |
| ---------------- | -------------------------------------------------------- | -------------- |
| `page`           | Browser page baru untuk satu test                        | Test           |
| `context`        | Browser context baru untuk satu test                     | Test           |
| `request`        | API request context                                      | Test           |
| `browser`        | Browser instance untuk membuat browser context atau page | Worker         |
| `browserName`    | Nama browser engine dari project yang sedang dijalankan  | Worker         |

Fixture biasanya dibuat saat diminta. Non-automatic fixture yang nggak digunakan oleh test juga nggak menjalankan setup.

## Coba kita bedah contoh nyata

Beberapa checkout test membutuhkan cart masing-masing dan page yang sudah membuka cart tersebut. Kita memang bisa membuat cart dari hook besar lalu menyimpan ID-nya di outer variable. Masalahnya, test jadi nggak menunjukkan dari mana cart berasal dan siapa yang harus menghapusnya.

Mulai dengan memberi nama pada value yang akan diterima test:

```ts
type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
};
```

Setelah itu, tentukan cara cart dibuat dan dibersihkan:

```ts
import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout-page';

export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page, request }, use) => {
    const createResponse = await request.post('/api/test/carts', {
      data: { items: [{ sku: 'NOTEBOOK', quantity: 1 }] },
    });

    if (!createResponse.ok()) {
      throw new Error(`Cart setup failed: ${createResponse.status()}`);
    }

    const cart: { id: string } = await createResponse.json();

    try {
      const checkoutPage = new CheckoutPage(page, cart.id);
      await checkoutPage.open();

      await use(checkoutPage);
    } finally {
      const deleteResponse = await request.delete(`/api/test/carts/${cart.id}`);
      if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
        throw new Error(`Cart cleanup failed: ${deleteResponse.status()}`);
      }
    }
  },
});

export { expect };
```

Contoh ini mengasumsikan aplikasi memang punya test-support API yang hanya bisa diakses dengan authorization yang sesuai. Jangan membuat production backdoor hanya supaya fixture lebih mudah dibuat.

Sekarang baca code-nya sesuai urutan saat dijalankan:

1. `checkoutPage` membutuhkan `page` dan `request`.
2. Setup membuat satu cart lalu mengecek response sebelum menggunakan ID-nya.
3. Fixture membuka page untuk cart yang baru dibuat.
4. `await use(checkoutPage)` memberikan `checkoutPage` ke test.
5. Block `finally` hanya menghapus cart yang dibuat fixture ini, termasuk ketika page gagal dibuka atau test fail saat memakai fixture.

Parameter test langsung menunjukkan bahwa test membutuhkan `checkoutPage`:

```ts
test('customer sees the updated order total', async ({ checkoutPage }) => {
  await checkoutPage.setQuantity('Notebook', 2);

  await expect(checkoutPage.total()).toHaveText('$40.00');
});
```

Fixture menyiapkan cart dan melakukan cleanup. Action yang dilakukan customer serta expected result-nya tetap terlihat di dalam test. Setelah setup mendapatkan ID untuk resource yang baru dibuat, taruh cleanup di `finally`. Dengan begitu, fixture tetap mencoba menghapus resource ketika setup berikutnya atau test fail setelah ID tersebut tersedia.

### Cek dulu, apakah memang butuh fixture?

| Kebutuhan                                                     | Mulai dari        | Alasannya                                                  |
| ------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| Satu perhitungan atau action berulang tanpa setup dan cleanup | Helper            | Function biasa lebih mudah dipanggil dan ditelusuri        |
| Action kecil yang sama sebelum semua test dalam satu group    | `beforeEach` hook | Waktu action dijalankan terlihat jelas di dekat test       |
| Value atau resource dengan setup dan teardown                 | Fixture           | Test meminta resource tersebut langsung dari parameternya  |
| Beberapa resource yang saling membutuhkan                     | Fixtures          | Setup mengikuti urutan dependency, teardown berjalan balik |
| Action penting yang hanya diuji oleh satu scenario            | Tetap di test     | Action dan expected result tetap terlihat jelas            |

Hook masih cocok dipakai ketika action-nya kecil dan terlihat jelas di dekat group test. Dalam kondisi seperti ini, hook bisa lebih mudah dibaca daripada custom fixture yang nggak memberikan value atau melakukan cleanup apa pun.

## Kapan pendekatan ini cocok dipakai?

Gunakan built-in fixture langsung sampai test suite punya resource dengan setup dan cleanup yang memang sering berulang. Kebanyakan test awal hanya membutuhkan `page`; sebagian juga membutuhkan `request`.

Gunakan helper untuk action biasa yang nggak punya setup dan cleanup sendiri. Gunakan hook kalau semua test dalam satu group yang jelas perlu menjalankan action yang sama pada waktu yang sama. Gunakan custom fixture kalau test membutuhkan resource bernama yang perlu dibuat, dibersihkan, digabungkan dengan fixture lain, atau diatur lewat option.

Gunakan test scope sebagai pilihan awal untuk `Page`, `BrowserContext`, mutable record, dan test data yang spesifik untuk scenario. Setiap test mendapat resource baru sehingga bisa dijalankan sendiri maupun secara parallel.

Gunakan worker scope hanya kalau satu worker bisa memakai resource tersebut untuk beberapa test tanpa saling mengubah state. Jangan share resource hanya karena setup-nya lambat atau mahal. Customer, cart, atau database transaction yang bisa berubah tetap dapat saling bertabrakan meskipun setiap test memakai browser context terpisah.

Jangan sembunyikan action yang sedang diuji di dalam fixture. Fixture `paidOrder` cocok kalau payment hanya menjadi starting state untuk refund test. Kalau scenario memang menguji proses payment, action payment dan expected result-nya harus tetap berada di test.

## Kalau gagal, mulai cek dari mana?

| Yang terjadi                                              | Kemungkinan penyebab                                                        | Cek dulu                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Test fail sebelum menjalankan baris pertamanya            | Fixture bermasalah saat setup atau state lama belum dibersihkan             | Fixture stack, API response, resource ID, dan cleanup log  |
| Test pass saat dijalankan sendiri tapi fail saat parallel | Fixture worker scope memberikan mutable resource yang sama ke beberapa test | Resource ID, worker index, account, dan record yang diubah |
| Test berikutnya fail setelah test sebelumnya bermasalah   | Cleanup nggak berjalan atau masih ada state yang tertinggal                 | Hasil teardown, resource ID, dan record di server          |
| Semua test menjalankan setup lambat yang nggak dibutuhkan | Automatic hook atau fixture diterapkan terlalu luas                         | Test mana yang benar-benar meminta fixture tersebut        |
| Judul test nggak menjelaskan dari mana state berasal      | Fixture menyembunyikan action penting untuk scenario                        | Code sebelum `use` dan action apa yang sebenarnya diuji    |
| Timeout menunjuk action test yang terlihat normal         | Setup fixture sudah menghabiskan sebagian besar timeout                     | Durasi setup, fixture timeout, dan failure pertama         |

Setup fixture dan test body memakai test timeout yang sama. Setelah test body selesai, teardown dan `afterEach` mendapat timeout terpisah dengan durasi yang sama. Cek durasi setup dan teardown sebelum menaikkan timeout masing-masing.

Kalau fixture saling bergantung sampai sulit ditelusuri, gambar hubungan antar-fixture tersebut. Setup berjalan dari dependency paling awal, sedangkan teardown berjalan dalam urutan terbalik. Kalau ada dependency yang berputar atau nggak jelas test mana yang memiliki resource, rapikan fixture-nya sebelum menambah fixture baru.

## Review hasil kerja dengan bantuan AI

Fixture buatan AI bisa membuat data, membuka page, atau menghapus resource. Review side effect-nya dengan pertanyaan berikut:

- Value atau resource apa yang diberikan oleh setiap fixture?
- Test mana yang meminta fixture tersebut, dan apakah fixture berjalan automatic?
- Apa yang terjadi sebelum dan sesudah `await use(...)`?
- Apakah response atau hasil setup sudah dicek sebelum value diberikan ke test?
- Test atau worker mana yang boleh mengubah setiap record dan account?
- Bisakah cleanup menghapus data milik test lain?
- Apakah fixture menyembunyikan action yang sebenarnya sedang diuji?
- Apakah test scope sebenarnya sudah cukup?
- Apakah helper atau hook kecil lebih mudah dibaca?
- Apakah code buatan AI mengarang endpoint, credential, storage state, atau global variable?

Perhatikan code setelah `await use(...)`. Code buatan AI sering menunjukkan setup dengan lengkap, tapi lupa menambahkan cleanup, error handling, atau listener removal.

## Coba cek pemahamanmu

AI membuat worker-scoped fixture bernama `sharedCustomerPage`. Fixture melakukan login sekali, membuat satu cart, lalu memberikan `Page` yang sama ke semua test. Test-test tersebut mengubah address, quantity, dan payment method. Worker scope dipilih karena proses login lambat.

Bagian mana yang nggak aman? Untuk cart, account, `Page`, dan proses authentication, jelaskan siapa yang memakainya, scope-nya, serta siapa yang melakukan cleanup. Bagian mana yang masih aman untuk di-share atau cukup dipindahkan ke helper?

## Bandingkan dengan cara pikir ini

Salah satu redesign yang masuk akal:

- Jangan share satu `Page` atau `BrowserContext` ke beberapa parallel test. Buat keduanya dengan test scope.
- Jangan biarkan beberapa test mengubah satu cart atau setting customer yang sama.
- Buat cart baru untuk setiap test. Gunakan account per test atau per worker sesuai state yang akan diubah oleh scenario.
- Data referensi yang nggak pernah berubah atau service yang aman dipakai satu worker boleh tetap worker scoped, selama parallel test nggak bisa mengubahnya.
- Pindahkan step sign-in yang sederhana ke helper, atau load authenticated state ke setiap browser context baru kalau authentication bukan bagian yang sedang diuji.
- Pastikan error saat setup dan hasil cleanup mudah ditemukan. Jangan sembunyikan semuanya di dalam hook besar.

Setup yang lambat memengaruhi waktu eksekusi. Shared mutable state bisa membuat test memakai atau mengubah data milik test lain. Tangani kedua masalah tersebut secara terpisah.

## Sebelum lanjut

Sekarang kamu seharusnya bisa memilih helper, hook, atau fixture, lalu menunjukkan resource apa yang dibuat, test atau worker mana yang memakainya, scope yang digunakan, dan cara cleanup dijalankan.

Lesson berikutnya membahas Playwright configuration. Fixture mengatur resource yang dipakai test, sedangkan configuration menentukan file test yang ditemukan, cara test dijalankan, dan variasi project yang tersedia.
