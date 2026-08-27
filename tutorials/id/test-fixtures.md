---
title: 'Buat Test Dependency dan Lifecycle Terlihat Jelas'
description: 'Pilih helper, hook, dan fixture secara deliberate, lalu buat setup, ownership, scope, dan cleanup mudah ditelusuri.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan apa yang disediakan Playwright fixture dan kapan fixture dibuat;
- memilih antara helper, hook, dan custom fixture;
- membaca fixture sebagai setup, value handoff, test use, dan teardown;
- menjadikan test-scoped state sebagai safe default; serta
- mendiagnosis hidden setup, scope yang salah, dan cleanup failure.

## Kenapa ini penting buat QA

Test bergantung pada lebih dari step yang terlihat. Ada browser page, authenticated identity, owned data, mungkin API client, dan kadang cleanup. Kalau semua dependency itu disembunyikan di `beforeEach` yang besar, scenario bisa gagal bahkan sebelum action pertamanya—dan kita susah tahu penyebabnya.

Fixture membuat dependency punya nama dan bisa dikomposisikan. Setiap test hanya menerima resource yang diminta, lalu resource dibersihkan sesuai scope. Tapi fixture nggak otomatis lebih jelas daripada helper. Fixture yang buruk bisa menyembunyikan business step, membuat shared mutable state, dan mengubah test sederhana jadi mini-framework.

Jadi pertanyaan QA-nya bukan “Ini bisa dijadikan fixture nggak?” Pertanyaannya: “Dependency ini butuh lifecycle dan ownership seperti apa?”

## Cara berpikir yang perlu kamu pegang

Baca setiap custom fixture sebagai lifecycle contract:

```text
Declared dependencies
        ↓
Setup dan verifikasi resource
        ↓
await use(value) ── test atau dependent fixture berjalan
        ↓
Teardown resource

Scope menentukan seberapa sering lifecycle ini dibuat.
```

![Fixture lifecycle me-resolve declared dependency, menjalankan verified setup, memberikan value ke test lewat use, lalu melakukan teardown sesuai test atau worker scope.](/images/tutorials/fixture-lifecycle-ownership.svg)

_Bagian sebelum `await use(...)` adalah setup. Bagian setelahnya adalah teardown. Scope menentukan owner dan lifetime._

Built-in fixture Playwright sudah mengikuti model ini:

| Built-in fixture | Yang disediakan                                       | Typical scope |
| ---------------- | ----------------------------------------------------- | ------------- |
| `page`           | Isolated browser page untuk satu test                 | Test          |
| `context`        | Isolated browser context untuk satu test              | Test          |
| `request`        | API request context                                   | Test          |
| `browser`        | Browser instance untuk membuat context atau page      | Worker        |
| `browserName`    | Browser engine name dari project yang sedang berjalan | Worker        |

Fixture dibuat on demand. Non-automatic fixture yang nggak dipakai juga nggak menjalankan setup.

## Coba kita bedah contoh nyata

Beberapa checkout test butuh satu owned cart dan page yang sudah membuka cart tersebut. Kita bisa menaruh semuanya di hook besar lalu menyimpan ID di outer variable, tapi dependency-nya jadi implicit.

Mulai dari memberi nama resource yang dibutuhkan test:

```ts
type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
};
```

Lalu definisikan lifecycle-nya:

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

Contoh ini mengasumsikan ada authorized test-support API. Jangan bikin production backdoor hanya supaya fixture lebih gampang dibuat.

Sekarang baca code-nya sesuai urutan lifecycle:

1. `checkoutPage` declare dependency ke `page` dan `request`.
2. Setup membuat satu cart dan memeriksa response sebelum memakai ID-nya.
3. Fixture membuka page untuk owned cart tersebut.
4. `await use(checkoutPage)` memberikan value ke test.
5. `finally` hanya menghapus cart yang dibuat fixture ini, bahkan kalau page gagal dibuka atau fixture gagal dipakai.

Dependency-nya terlihat langsung dari parameter test:

```ts
test('customer sees the updated order total', async ({ checkoutPage }) => {
  await checkoutPage.setQuantity('Notebook', 2);

  await expect(checkoutPage.total()).toHaveText('$40.00');
});
```

Fixture memiliki precondition dan cleanup. Product action serta evidence yang diklaim scenario tetap dimiliki test. Setelah setup mendapatkan resource ID yang dimiliki fixture, taruh cleanup di `finally`; kalau tidak, setup failure sebelum `use` bisa meninggalkan state tanpa pernah mencapai test.

### Cek dulu, apakah memang butuh fixture?

| Kebutuhan                                               | Mulai dari        | Alasannya                                             |
| ------------------------------------------------------- | ----------------- | ----------------------------------------------------- |
| Satu calculation atau repeated action tanpa lifecycle   | Helper            | Normal function lebih explicit dan gampang dipanggil  |
| Small action yang sama sebelum semua test di satu group | `beforeEach` hook | Shared timing tetap sederhana dan lokal               |
| Named value/resource dengan setup dan teardown          | Fixture           | Dependency dan lifecycle menjadi explicit             |
| Beberapa resource yang saling bergantung                | Fixtures          | Setup dan reverse teardown mengikuti dependency order |
| Business step penting yang hanya ada di satu scenario   | Tetap di test     | Menyembunyikannya akan melemahkan cerita scenario     |

Hook bukan fitur lama yang harus selalu diganti. Small visible hook bisa lebih jelas daripada custom fixture yang nggak memberikan value dan nggak punya meaningful lifecycle.

## Kapan pendekatan ini cocok dipakai?

Pakai built-in fixture langsung sampai suite punya repeated resource atau lifecycle yang memang layak diberi nama. Kebanyakan beginner test hanya butuh `page`; sebagian juga butuh `request`.

Pakai helper kalau code-nya sekadar operation. Pakai hook kalau semua test dalam nearby named group butuh timing yang sama. Pakai custom fixture kalau test mengonsumsi named dependency yang butuh setup, teardown, composition, atau configurable behavior.

Utamakan test scope untuk page, context, mutable record, dan scenario-specific data. Setiap test mendapat fresh lifecycle sehingga independence dan parallel execution tetap aman.

Gunakan worker scope hanya kalau satu worker bisa memiliki resource tersebut dengan aman untuk beberapa test. Setup yang mahal belum tentu aman untuk dishare. Mutable customer, cart, atau database transaction masih bisa collision walaupun browser context-nya terisolasi.

Jangan sembunyikan behavior under test di dalam fixture. Fixture `paidOrder` bisa tepat kalau payment hanya precondition untuk refund test; fixture itu salah kalau scenario justru mengklaim sedang menguji payment.

## Kalau gagal, mulai cek dari mana?

| Observation                                        | Kemungkinan lifecycle problem          | Evidence pertama yang diperiksa                           |
| -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Test gagal sebelum baris pertamanya                | Fixture setup gagal atau meninggalkan state | Fixture stack, API response, retained ID, cleanup attempt |
| Test lulus sendiri tapi gagal saat parallel        | Worker/shared mutable state            | Resource ID, worker index, account dan record ownership   |
| Test berikutnya gagal setelah satu failure         | Cleanup atau hidden state bocor        | Teardown result, retained ID, server record               |
| Semua test menjalankan slow setup yang nggak perlu | Automatic hook/fixture terlalu luas    | Test mana yang benar-benar meminta dependency             |
| Test title nggak menjelaskan state asalnya         | Fixture menyembunyikan business step   | Code sebelum `use` dan risk yang disebut scenario         |
| Timeout menunjuk action test yang terlihat normal  | Slow fixture menghabiskan test timeout | Setup duration, fixture timeout, first meaningful failure |

Fixture setup dan teardown ikut memakai execution time. Long fixture bisa menghabiskan test timeout sebelum scenario mencapai assertion. Ukur lifecycle-nya sebelum menaikkan timeout.

Kalau dependency graph fixture terlalu dalam, gambar graph-nya. Setup berjalan dependency-first; teardown berjalan terbalik. Cycle atau ownership yang nggak jelas adalah design problem, bukan sesuatu yang perlu disembunyikan dengan layer tambahan.

## Review hasil buatan AI

Review AI-generated fixture sebagai infrastructure yang punya side effect:

- Value atau resource apa yang diberikan setiap fixture?
- Dependency apa yang memicunya, dan fixture-nya lazy atau automatic?
- Apa yang terjadi sebelum dan sesudah `await use(...)`?
- Apakah setup diverifikasi sebelum value sampai ke test?
- Test atau worker mana yang memiliki setiap mutable record dan account?
- Bisakah cleanup menghapus data milik test lain?
- Apakah fixture menyembunyikan action yang justru diklaim scenario?
- Apakah test scope sebenarnya sudah cukup?
- Apakah helper atau small hook lebih jelas?
- Apakah generated code mengarang endpoint, credential, storage state, atau global variable?

Perhatikan code setelah `await use(...)`. Generated example sering bagus saat demo setup, tapi lupa cleanup, error handling, atau listener removal.

## Coba cek pemahamanmu

Generated suite punya worker-scoped fixture bernama `sharedCustomerPage`. Fixture login sekali, membuat satu cart, lalu memberikan page yang sama ke semua test. Test-test tersebut mengubah address, quantity, dan payment method. Alasannya: login lambat.

Bagian mana yang nggak aman? Sebutkan owner, scope, dan cleanup path untuk cart, account, page, serta authentication mechanics. Bagian mana yang masih boleh dishare atau cukup jadi helper?

## Bandingkan dengan cara pikir ini

Salah satu redesign yang masuk akal:

- Jangan share satu `Page` atau `BrowserContext` ke parallel test; buat keduanya test scoped.
- Jangan biarkan beberapa test memutasi satu cart atau customer-level setting tanpa explicit ownership.
- Alokasikan unique cart per test dan account per test atau worker sesuai state yang dimutasi scenario.
- Biarkan immutable reference data atau safely worker-owned service tetap worker scoped hanya kalau parallel test nggak bisa merusaknya.
- Pindahkan simple sign-in mechanics ke helper, atau load safe authenticated state ke setiap fresh context kalau authentication bukan behavior under test.
- Buat setup failure dan cleanup result tetap observable, jangan taruh semuanya dalam broad hidden hook.

Slow setup adalah performance concern. Shared mutable state adalah correctness concern. Selesaikan keduanya secara terpisah.

## Sebelum lanjut

Sekarang kamu seharusnya bisa memilih helper, hook, atau fixture lalu menjelaskan dependency, owner, scope, setup, dan cleanup dari setiap resource yang diperkenalkan.

Lesson berikutnya bergerak satu level keluar. Fixture menjelaskan resource yang dipakai test; Playwright configuration menjelaskan policy untuk menemukan, menjalankan, dan memvariasikan test suite.
