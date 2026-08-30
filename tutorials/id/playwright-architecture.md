---
title: 'Gunakan Browser Context untuk Memisahkan Setiap Test'
description: 'Pahami hubungan browser, context, dan page di Playwright untuk memisahkan session antar-test, sambil tetap mengontrol backend data secara terpisah.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan fungsi browser, browser context, dan page di Playwright;
- membedakan state yang digunakan bersama dan state yang terpisah antar-page atau browser context;
- menggunakan fixture `page` bawaan Playwright tanpa perlu membuat browser context sendiri untuk setiap test;
- membuat context terpisah untuk scenario multi-user yang memang membutuhkannya; serta
- mencari tahu apakah failure berasal dari browser state atau backend data yang dipakai bersama.

## Kenapa ini penting buat QA

Pernah nggak sih sebuah test pass saat dijalankan sendiri, tapi fail setelah test lain selesai? Misalnya test berikutnya ternyata sudah dalam keadaan login, banner yang sebelumnya ditutup masih hilang, atau cart sudah berisi item.

Saat manual testing, kita biasanya reset browser, ganti profile, atau buka incognito window kalau butuh session yang bersih. Di automation, kita juga perlu memastikan setiap test punya browser session yang terpisah.

Dengan setup standar Playwright Test, setiap test mendapatkan browser context baru. Jadi session seperti cookie, local storage, dan login state dari test sebelumnya tidak ikut terbawa.

Tapi browser context baru tidak otomatis me-reset data di backend. Database, inventory, order, atau account yang digunakan test masih bisa sama.

Karena itu, kita perlu membedakan mana yang sudah diisolasi oleh browser context dan mana yang tetap harus kita kontrol lewat test data atau setup sendiri.

## Cara berpikir yang perlu kamu pegang

Bayangkan hubungan object di Playwright seperti ini:

```text
Worker process
└── Browser
    ├── BrowserContext untuk Test A
    │   └── Page: satu tab di session Test A
    └── BrowserContext untuk Test B
        └── Page: satu tab di session Test B
```

Playwright bisa menggunakan `Browser` yang sama untuk beberapa test di dalam satu worker.

Yang biasanya memisahkan session antar-test adalah `BrowserContext`. Setiap test mendapat context baru beserta `Page` yang digunakan di dalam context tersebut.

![Satu browser berisi context terpisah untuk test yang berbeda. Page di dalam context yang sama menggunakan session yang sama, sedangkan backend data tetap berada di luar browser context.](/images/tutorials/context-isolation-boundary.svg)

_Browser context baru memisahkan session di browser. Backend data tetap perlu dikontrol secara terpisah._

Hubungannya bisa dibaca seperti ini:

| Object           | Bayangkan sebagai                  | Yang ada di dalamnya                                                                   |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `Browser`        | Browser yang sedang berjalan       | Satu atau beberapa browser context                                                     |
| `BrowserContext` | Satu browser session yang terpisah | Cookies, storage, permission, authentication state, dan page di dalam session tersebut |
| `Page`           | Satu tab atau popup                | Navigation dan interaction pada page tersebut                                          |

Dua `Page` di dalam `BrowserContext` yang sama menggunakan session yang sama. Misalnya, keduanya bisa menggunakan cookie atau login state yang sama.

Kalau `BrowserContext`-nya berbeda, session di browser juga terpisah.

Tapi kedua context masih bisa menggunakan backend dan test data yang sama. Browser context baru **tidak** otomatis memisahkan:

- customer, order, atau inventory record;
- email inbox atau one-time code;
- rate limit dan queue;
- feature flag yang bisa berubah; atau
- resource lain yang disimpan di server.

Jadi, kalau test masih saling mengganggu walaupun masing-masing sudah punya browser context sendiri, cek apakah mereka sebenarnya menggunakan account, order, inventory, atau backend data yang sama.

## Coba kita bedah contoh nyata

Mulai dari case yang sederhana: satu user, satu behavior.

```ts
test('a guest cart starts empty', async ({ page }) => {
  await page.goto('/cart');

  await expect(
    page.getByRole('heading', { name: 'Your cart is empty' }),
  ).toBeVisible();
});
```

Fixture `page` ini sudah dibuat di dalam browser context baru untuk test tersebut.

Context baru berarti session dari test lain tidak ikut terbawa. Tapi kalau project menggunakan `storageState`, context tersebut tetap bisa dimulai dalam keadaan sudah login.

Untuk test seperti ini, kamu nggak perlu menjalankan browser atau membuat browser context sendiri.

Sekarang bayangin requirement support chat:

> Customer yang sudah login mengirim message, lalu support agent melihat dan membalas conversation yang sama.

Scenario ini memang membutuhkan dua user yang login secara bersamaan dengan session yang berbeda:

```ts
test('agent replies to a customer', async ({ browser }) => {
  const customerContext = await browser.newContext({
    storageState: 'playwright/.auth/customer.json',
  });

  const agentContext = await browser.newContext({
    storageState: 'playwright/.auth/agent.json',
  });

  try {
    const customerPage = await customerContext.newPage();
    const agentPage = await agentContext.newPage();

    await customerPage.goto('/support');
    await agentPage.goto('/agent/inbox');

    await customerPage.getByLabel('Message').fill('Where is my order?');
    await customerPage.getByRole('button', { name: 'Send' }).click();

    await expect(agentPage.getByText('Where is my order?')).toBeVisible();

    await agentPage.getByLabel('Reply').fill('It ships today.');
    await agentPage.getByRole('button', { name: 'Reply' }).click();

    await expect(customerPage.getByText('It ships today.')).toBeVisible();
  } finally {
    await customerContext.close();
    await agentContext.close();
  }
});
```

`customerContext` dan `agentContext` memisahkan cookie dan login session masing-masing user.

Conversation-nya tetap menggunakan data yang sama di backend karena memang itulah behavior yang ingin diuji: customer dan agent berinteraksi pada conversation yang sama.

Context yang dibuat manual juga perlu di-close setelah test selesai. Menggunakan `finally` memastikan context tetap ditutup meskipun test fail.

Ini juga menjelaskan kenapa membuat dua `Page` di dalam satu context bukan pilihan yang tepat untuk scenario multi-user.

Dua `Page` dalam satu context masih menggunakan session yang sama. Jadi kalau salah satu page login sebagai agent, session customer bisa ikut berubah.

Kalau butuh dua user yang login secara bersamaan, gunakan dua browser context yang berbeda.

## Kapan pendekatan ini cocok dipakai?

Gunakan fixture `page` bawaan Playwright kalau satu test hanya membutuhkan satu user dan satu browser session.

Buat browser context tambahan kalau satu scenario memang membutuhkan beberapa user dengan session berbeda secara bersamaan, misalnya buyer dan seller, customer dan agent, atau dua user dalam collaboration flow.

Kalau scenario membuka popup atau beberapa tab tapi tetap menggunakan user yang sama, gunakan `Page` lain di dalam context yang sama.

Jangan menggunakan dua `Page` dalam satu context untuk mewakili dua user yang berbeda, karena keduanya masih menggunakan session yang sama.

Kamu juga nggak perlu menjalankan browser baru untuk setiap test hanya supaya session-nya terpisah. Browser context sudah cukup untuk kebutuhan tersebut.

Sebaliknya, jangan menggunakan satu `Page` atau browser context yang sama untuk beberapa test yang nggak berkaitan hanya supaya setup lebih cepat. Session dari test sebelumnya bisa ikut memengaruhi test berikutnya.

Untuk sekarang, fokus pada perbedaan `Browser`, `BrowserContext`, dan `Page`. Perbedaan behavior antar-browser akan dibahas di module cross-browser.

## Kalau gagal, mulai cek dari mana?

Misalnya account-settings test pass saat dijalankan sendiri, tapi fail saat parallel karena language preference-nya sudah berubah.

Cek dulu dua kemungkinan ini:

1. **Session dari test lain ikut terbawa:** cookie atau storage dari test sebelumnya masih digunakan.
2. **Test memakai backend data yang sama:** browser context-nya memang baru, tapi test login dengan account yang sama dan mengubah preference yang sama di server.

Saat debugging, cek beberapa hal ini:

- Apakah setiap test memang menggunakan browser context dan `page` sendiri?
- Account mana yang digunakan oleh masing-masing test?
- Kalau test dijalankan dengan context baru, apakah language preference masih tetap berubah?
- Apakah masalahnya hilang kalau setiap worker menggunakan account yang berbeda?

Kalau browser context baru masih menerima language preference yang sudah diubah sebelumnya, berarti masalahnya bukan di session browser. Data tersebut sudah berubah di backend.

Membuat context tambahan nggak akan menyelesaikan masalah seperti ini. Lesson berikutnya akan membahas cara mengontrol test data dan state di backend.

Jangan langsung menjalankan seluruh suite secara serial, menambah retry, atau menghapus storage secara random hanya supaya test kembali pass. Cari dulu data atau state apa yang sebenarnya digunakan bersama oleh beberapa test.

Saat review code yang membuat browser context, cek beberapa hal ini:

- Apakah scenario memang membutuhkan browser context tambahan?
- Kalau ada beberapa user, apakah masing-masing menggunakan context yang berbeda?
- Apakah context yang dibuat manual tetap di-close kalau test fail?
- Apakah authentication state yang digunakan sesuai dengan role masing-masing user?
- Apakah code menganggap browser context baru juga otomatis me-reset backend data?
- Kalau beberapa test memang menggunakan data yang sama, apakah itu memang dibutuhkan oleh scenario dan sudah dikontrol?
- Apakah code membuat browser atau context tambahan tanpa kebutuhan yang jelas?

Lebih banyak browser context belum tentu membuat test lebih terisolasi. Yang penting adalah mengetahui state mana yang ada di browser dan state mana yang tetap digunakan bersama di backend.

## Coba cek pemahamanmu

Sebuah marketplace test membuat dua `Page` di dalam browser context yang sama. Page pertama login sebagai buyer, lalu page kedua login sebagai seller. Setelah itu, page pertama ikut berubah menjadi seller.

Ada usulan untuk memperbaikinya dengan clear cookies di page pertama sebelum setiap assertion.

Jelaskan:

1. Apa kesalahan utama dari setup test tersebut?
2. Perubahan paling sederhana apa yang seharusnya dilakukan?
3. Setelah session buyer dan seller sudah dipisahkan, data marketplace apa yang masih perlu dikontrol supaya test tidak saling mengganggu?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- Kedua `Page` berada di browser context yang sama, jadi keduanya menggunakan session yang sama. Dua page tersebut tidak bisa digunakan untuk mewakili buyer dan seller yang login secara terpisah.
- Buat satu browser context untuk buyer dan satu lagi untuk seller, lalu gunakan satu `Page` di masing-masing context.
- Jangan clear cookies di tengah scenario karena itu justru mengubah session yang sedang digunakan oleh test.
- Listing, order, account, dan data lain di backend tetap bisa digunakan bersama oleh beberapa test. Data tersebut tetap perlu dikontrol supaya test lain tidak mengubah record yang sedang digunakan.

Browser context yang terpisah menyelesaikan masalah session buyer dan seller. Tapi backend data tetap membutuhkan isolation sendiri.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menjelaskan hubungan antara `Browser`, `BrowserContext`, dan `Page`, menggunakan fixture bawaan Playwright tanpa membuat context tambahan kalau tidak diperlukan, serta membuat context terpisah ketika satu scenario membutuhkan beberapa user dengan session berbeda.

Di lesson berikutnya, kita akan membahas isolation di luar browser: authentication, test data, external dependency, cleanup, dan cara menghindari conflict ketika beberapa test berjalan secara parallel.
