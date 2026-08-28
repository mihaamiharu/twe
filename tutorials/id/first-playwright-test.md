---
title: 'Jalankan, Baca, dan Investigasi Test Playwright Pertamamu'
description: 'Jalankan satu test scenario dengan scope yang jelas, pahami fungsi setiap bagian test, lalu gunakan hasil run untuk verify behavior dan membantu debugging saat test fail.'
---

## Setelah lesson ini, kamu bisa

- menemukan file dan command penting di dalam project Playwright;
- menjelaskan fungsi `test`, `page`, locator, action, dan `expect`;
- menjalankan satu file atau satu test tertentu saat belajar atau debugging;
- membedakan action yang berhasil dijalankan dengan expected result yang benar-benar sudah diverifikasi; dan
- menggunakan error message dari test untuk menentukan apa yang perlu dicek berikutnya.

## Kenapa ini penting buat QA

Pernah nggak sih kamu menerima file Playwright, menjalankannya, lalu semua test pass? Kelihatannya aman, tapi test yang pass belum tentu berarti kita sudah verify hal yang benar.

Kita tetap perlu tahu: product risk apa yang sebenarnya diuji? Starting state dan test data-nya dari mana? Kalau test fail, masalahnya ada di aplikasi, test data, locator, atau configuration?

Di test pertama ini, tujuannya bukan membuat automation sebanyak mungkin. Kita fokus memahami satu flow dari awal sampai akhir:

```text
Test intent → code → browser menjalankan action → verify expected result → hasil test
```

Satu test yang scope-nya jelas, bisa kamu jelaskan, dan bisa kamu debug saat fail lebih berguna daripada banyak test scenario yang kamu sendiri nggak yakin sebenarnya sedang verify apa.

## Cara berpikir yang perlu kamu pegang

Sebuah Playwright test terdiri dari beberapa bagian yang bekerja sama, tapi masing-masing punya fungsi yang berbeda:

| Bagian                 | Fungsinya                                                                  |
| ---------------------- | -------------------------------------------------------------------------- |
| `test`                 | Mendefinisikan satu test scenario yang akan dijalankan                     |
| Fixture seperti `page` | Memberikan akses ke page/browser yang digunakan selama test                |
| Locator                | Menentukan element mana yang ingin digunakan                               |
| Action                 | Melakukan interaction seperti click, fill, atau navigation                 |
| `expect`               | Verify expected result                                                     |
| Test runner            | Menjalankan test, membuat report, dan menyimpan informasi ketika test fail |

Saat membaca sebuah test, coba pahami juga bagian mana yang berkaitan dengan intent, Playwright, JavaScript, dan test data:

| Bagian         | Pertanyaan yang perlu dijawab                                           | Contoh                                      |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| Test intent    | Product risk atau behavior apa yang ingin diuji?                        | Customer bisa membuka cart                  |
| Playwright API | Bagaimana test berinteraksi dengan browser atau melakukan verification? | `page.goto`, `getByRole`, `click`, `expect` |
| JavaScript     | Syntax atau logic apa yang digunakan untuk menjalankan test?            | `async`, `await`, template literal          |
| Test data      | Data apa yang digunakan dalam scenario?                                 | `'/app/products.html'`, `'Cart'`, `'Your cart'` |

Beberapa bagian bisa muncul dalam baris code yang sama, tapi fungsinya tetap berbeda.

Locator membantu test menemukan element, tapi locator nggak menentukan apa yang sebenarnya ingin diuji. Begitu juga dengan syntax JavaScript atau TypeScript keduanya membantu kita menulis test, tapi bukan bagian dari product behavior yang ingin diverifikasi.

![Feedback loop Playwright yang fokus menghubungkan intent QA, satu test, perilaku browser, bukti yang terlihat, dan hasil diagnosis.](/images/tutorials/first-test-feedback-loop.svg)

_Test yang pass baru benar-benar berguna kalau expected result yang diverifikasi memang sesuai dengan test intent sejak awal._

Di test pertama ini, kamu juga akan melihat `async` dan `await`. Untuk sementara, baca `await` sebagai tanda bahwa step berikutnya bergantung pada selesainya operasi asynchronous tersebut. Ini bukan berarti semua perubahan di UI otomatis sudah siap untuk diverifikasi.

Di Lesson 3, kita akan membahas lebih detail kapan `await` dibutuhkan dan apa saja batasannya.

## Coba kita bedah contoh nyata

Misalnya, risiko yang ingin diuji adalah:

> User klik link **Cart**, tapi halaman cart nggak terbuka.

Starting state-nya: aplikasi dari Core Practice sudah terbuka di `/app/products.html`.

Action-nya: klik link **Cart**.

Expected result yang perlu diverifikasi: heading **Your cart** terlihat di halaman.

Core Practice menyediakan products page dan cart page untuk flow ini. Kalau test yang sama dijalankan di repository tim, aplikasi dan starting route-nya memang harus tersedia sebelum Playwright dijalankan.

### 1. Gunakan setup project yang sudah ada

Kalau kamu masuk ke project yang sudah digunakan tim, ikuti command untuk install dependency dan menjalankan test yang memang sudah tersedia di project tersebut.

Jangan langsung menjalankan command untuk membuat setup Playwright baru sebelum mengecek konfigurasi yang sudah ada.

Kalau kamu membuat project baru khusus untuk belajar, Playwright bisa menyiapkan project awal dengan:

```bash
npm init playwright@latest
```

Struktur project biasanya kurang lebih seperti ini:

```text
playwright.config.ts    konfigurasi Playwright
tests/                  file test
package.json            script dan dependency project
test-results/           hasil atau artifact dari test run, kalau ada
```

Struktur setiap project bisa berbeda. Jadi, cek dulu repository dan konfigurasi yang sudah ada daripada menganggap semuanya memakai setup default Playwright.

### 2. Cek konfigurasi environment

`baseURL` membantu test membuka path tanpa perlu menulis host yang sama berulang kali:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
});
```

Kalau URL berbeda antara local, QA, atau environment lain, simpan perbedaannya di konfigurasi. Jangan hardcode URL tersebut di setiap test scenario.

Hal yang sama berlaku untuk password, token, dan secret lain. Jangan simpan langsung di source code yang akan di-commit.

`baseURL` hanya memberi tahu Playwright ke mana relative path harus dibuka. Konfigurasi ini nggak membuat aplikasi atau route yang belum tersedia.

### 3. Pahami fungsi setiap bagian test

```ts
import { test, expect } from '@playwright/test';

test('customer can open the cart', async ({ page }) => {
  await page.goto('/app/products.html');

  await page.getByRole('link', { name: 'Cart' }).click();

  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
});
```

Coba lihat fungsi setiap bagian dari test tersebut:

* judul test menjelaskan behavior yang ingin diuji;
* `{ page }` memberikan akses ke browser page yang digunakan selama test;
* `goto` membuka halaman awal sebelum action dilakukan;
* `getByRole` mencari link **Cart** berdasarkan role dan accessible name yang dikenali browser;
* `click` melakukan action; dan
* assertion membuktikan bahwa cart page sudah terbuka lewat content yang bisa dilihat user.

`click` saja belum cukup untuk membuktikan test berhasil. `click` hanya melakukan action.

Tanpa assertion, test bisa saja tetap pass tanpa membuktikan bahwa halaman cart benar-benar muncul.

### 4. Jalankan test yang memang ingin kamu cek

Di Core Practice, gunakan **Jalankan Kode**. TWE sudah menyediakan halaman aplikasinya dan menjalankan starter test di halaman tersebut.

Kalau kamu bekerja di repository lokal milik tim, gunakan command yang didokumentasikan oleh project. Beberapa command Playwright untuk menjalankan scope yang fokus biasanya terlihat seperti ini:

```bash
npx playwright test tests/cart.spec.ts
npx playwright test -g "customer can open the cart"
npx playwright test --headed
npx playwright test --ui
```

Command tersebut hanya bisa digunakan kalau repository memang punya file test dan aplikasi yang bisa dijalankan. Mulai dari satu file atau satu test dulu supaya hasilnya lebih mudah dibaca dan dikaitkan dengan perubahan yang sedang kamu kerjakan.

Gunakan `--headed` kalau kamu perlu melihat langsung apa yang terjadi di browser. Gunakan `--ui` kalau kamu ingin melihat setiap step, DOM snapshot, dan detail lain yang membantu saat debugging.

Setelah test selesai, jangan cuma lihat apakah hasilnya pass atau fail. Baca informasi yang diberikan Playwright, seperti:

* test mana yang fail;
* baris code yang gagal;
* expected result;
* actual result; dan
* artifact seperti screenshot, trace, atau log kalau tersedia.

Dari situ, tentukan apa yang perlu dicek berikutnya.

## Kapan cara ini cocok dipakai?

Saat sedang belajar, mengubah satu test scenario, atau debugging test yang fail, jalankan dulu test yang memang sedang kamu kerjakan.

Kalau test tersebut sudah pass, baru jalankan test lain yang masih berhubungan. Full suite biasanya dijalankan ketika kita ingin memastikan perubahan tersebut nggak merusak area lain, bukan setiap kali selesai mengubah satu baris code.

Kalau project tim sudah punya command sendiri untuk menjalankan Playwright, gunakan command tersebut. `npx playwright test` memang bisa menjalankan Playwright langsung, tapi project bisa saja punya setup tambahan di command seperti `npm test`, `bun run test:e2e`, atau script lainnya.

Kalau kamu belum menemukan file test, jangan langsung membuat setup Playwright baru. Cek dulu `package.json`, file konfigurasi Playwright, folder test, dan dokumentasi project.

Sebelum menambah test scenario lain, pastikan kamu sudah paham starting state, action, expected result, dan informasi apa yang diberikan Playwright ketika test pertama fail.

## Kalau test fail, mulai cek dari mana?

Coba bayangin test timeout di baris ini:

```ts
await page.getByRole('link', { name: 'Cart' }).click();
```

Jangan langsung tambah sleep atau ganti locator. Cek dulu apa yang sebenarnya terjadi:

1. Apakah halaman `/app/products.html` berhasil dibuka?
2. Saat test fail, URL-nya ada di mana dan apa yang tampil di halaman?
3. Apakah element **Cart** memang dikenali sebagai `link`? Accessible name-nya apa?
4. Locator tersebut menemukan satu element, nggak menemukan apa pun, atau malah menemukan lebih dari satu?
5. Apakah halaman menampilkan error, redirect ke login, atau masih dalam loading state?

Kalau ternyata nama link memang berubah menjadi **“Shopping cart”**, update locator setelah memastikan perubahan tersebut memang sesuai dengan behavior terbaru.

Tapi kalau test malah redirect ke login, masalahnya bukan di locator. Cek starting state atau authentication setup-nya.

Menambah timeout juga nggak akan memperbaiki environment yang salah, test data yang belum tersedia, atau locator yang memang mengarah ke element yang salah.

Sebelum menjalankan test yang belum kamu kenal, baca dulu code-nya dan cek beberapa hal ini:

* Apakah nama test menjelaskan behavior yang ingin diuji?
* Apakah starting state dan URL awalnya sesuai dengan setup project?
* Apakah test mengandalkan text, test ID, credential, atau route yang belum kamu cek?
* Apakah setiap action memang diperlukan untuk scenario tersebut?
* Apakah ada assertion yang verify expected result?
* Apakah ada fixed sleep atau `catch` yang justru membuat root cause lebih sulit ditemukan?
* Bisakah kamu menjalankan test tersebut sendiri dan menjelaskan kenapa test-nya pass atau fail?

Kalau kamu belum memahami test-nya, jangan langsung menganggap semua asumsi di dalam code tersebut benar. Cek dulu dengan behavior aplikasi yang sebenarnya.

## Coba cek pemahamanmu

Review test berikut:

```ts
test('customer opens account settings', async ({ page }) => {
  await page.goto('/account');
  await page.getByRole('link', { name: 'Settings' }).click();
});
```

Coba jawab:

1. Apa starting state dan action yang sudah ada di test ini?
2. Bagian penting apa yang masih belum ada?
3. Apa yang perlu diverifikasi untuk memastikan halaman account settings benar-benar terbuka?
4. Command apa yang bisa digunakan untuk menjalankan test dengan nama tersebut saja?
5. Kalau link **“Settings”** nggak ditemukan, apa yang perlu kamu cek sebelum mengganti locator?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Test dimulai dari `/account`, lalu user membuka link **“Settings”**.
* Belum ada assertion, jadi test belum verify apakah halaman account settings benar-benar terbuka.
* Kita bisa verify heading **“Account settings”** atau element khusus lain di halaman tersebut terlihat. Expected result akhirnya tetap harus mengikuti requirement yang sebenarnya.
* Jalankan `npx playwright test -g "customer opens account settings"` atau command test yang memang digunakan di project.
* Sebelum mengganti locator, cek URL yang terbuka, kondisi halaman, role dan accessible name dari element, jumlah element yang ditemukan, serta apakah ada redirect atau error yang nggak seharusnya terjadi.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memahami struktur satu Playwright test, menjelaskan fungsi setiap bagiannya, menjalankan test yang ingin kamu cek, dan menggunakan hasil run untuk menentukan apa yang perlu dicek berikutnya.

Di Core Practice, kamu akan membuka Cart dengan user-facing locator lalu membuktikan heading-nya terlihat menggunakan web-first assertion.

Setelah itu, lesson berikutnya akan membahas JavaScript secukupnya supaya kamu bisa mengatur test data dan logic sederhana tanpa mengubah learning path ini menjadi course programming.
