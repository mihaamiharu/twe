---
title: 'Jalankan, Baca, dan Investigasi Test Playwright Pertamamu'
description: 'Jalankan satu skenario yang fokus, pahami tanggung jawab setiap bagian test, lalu gunakan hasilnya sebagai bukti QA.'
---

## Setelah lesson ini, kamu bisa

- menemukan file dan command penting di dalam project Playwright;
- menjelaskan tugas `test`, `page`, locator, action, dan `expect`;
- menjalankan satu file atau satu test tertentu saat belajar dan debugging;
- membedakan action yang berhasil dijalankan dengan outcome produk yang benar-benar dibuktikan; dan
- memakai pesan kegagalan untuk menentukan langkah investigasi berikutnya.

## Kenapa ini penting buat QA

Pernah nggak sih kamu menerima file Playwright, menjalankannya, lalu melihat semuanya hijau? Kelihatannya meyakinkan, tapi hasil hijau itu belum tentu bisa dipercaya.

Kamu masih perlu bertanya: risiko produk apa yang sebenarnya diuji? Environment awalnya dari mana? Kalau test gagal, masalahnya ada di aplikasi, test data, locator, atau konfigurasi?

Tujuan test pertamamu bukan membuat banyak automation. Tujuannya adalah menyelesaikan satu feedback loop yang benar-benar kamu pahami:

```text
Intent QA → kode test → perilaku browser → bukti yang terlihat → hasil yang berguna
```

Satu test kecil yang bisa kamu jelaskan dan investigasi lebih berharga daripada sepuluh skenario yang nggak bisa kamu review.

## Cara berpikir yang perlu kamu pegang

Anggap Playwright test sebagai kontrak QA yang bisa dijalankan. Beberapa bagian bekerja sama, tapi tugasnya berbeda:

| Bagian                 | Tanggung jawab                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| `test`                 | Memberi nama dan membungkus satu skenario yang bisa dijalankan sendiri |
| Fixture seperti `page` | Menyediakan environment test yang terisolasi                           |
| Locator                | Menjelaskan cara test menemukan target yang dilihat pengguna           |
| Action                 | Meminta browser melakukan suatu perilaku                               |
| `expect`               | Menyatakan bukti yang pada akhirnya harus benar                        |
| Test runner            | Menjalankan test, membuat report, dan menyimpan informasi kegagalan    |

Saat mereview sebuah test, beri label pada setiap baris sebelum menilai apakah kodenya sudah tepat:

| Layer             | Pertanyaan yang dijawab                        | Contoh                                      |
| ----------------- | --------------------------------------------- | ------------------------------------------- |
| Intent test       | Risiko produk apa yang sedang diperiksa?       | Customer bisa membuka cart                  |
| API Playwright    | Bagaimana test menjalankan atau mengamati UI?  | `page.goto`, `getByRole`, `click`, `expect` |
| JavaScript        | Bagaimana value dan alur logic ditulis?       | `async`, `await`, dan template literal      |
| Test data         | Input dan ekspektasi konkret apa yang dipakai? | `'/products'`, `'Cart'`, dan `/\/cart$/` |

Layer ini bisa muncul di baris yang sama, tapi tanggung jawabnya berbeda. Locator tidak menentukan risiko produk, dan annotation TypeScript tidak mengubah test data menjadi fakta runtime.

![Feedback loop Playwright yang fokus menghubungkan intent QA, satu test, perilaku browser, bukti yang terlihat, dan hasil diagnosis.](/images/tutorials/first-test-feedback-loop.svg)

_Hasil hijau baru berguna kalau bukti yang diamati memang sesuai dengan intent QA sejak awal._

Di test pertama kamu akan melihat `async` dan `await`. Untuk sementara, baca `await` sebagai: “langkah berikutnya bergantung pada operasi asynchronous ini selesai.” Lesson 3 akan membahas jaminan dan batasannya dengan lebih tepat.

## Coba kita bedah contoh nyata

Misalnya, risiko produknya adalah:

> Pengguna membuka link Cart, tapi tidak sampai ke halaman keranjang.

Starting state-nya adalah aplikasi yang sedang berjalan dengan base URL yang sudah dikonfigurasi. Action-nya adalah membuka link Cart. Bukti yang berguna adalah URL cart dan heading keranjang yang terlihat.

### 1. Buka project yang tepat

Kalau kamu bekerja di repository tim, gunakan command instalasi dan test yang didokumentasikan di repository itu. Jangan menjalankan command scaffolding di dalam project yang sudah ada sebelum mengecek konfigurasi yang tersedia.

Untuk sandbox belajar yang benar-benar baru, Playwright bisa membuat project awal:

```bash
npm init playwright@latest
```

Struktur yang umum terlihat seperti ini:

```text
playwright.config.ts    konfigurasi runner, browser, dan environment
tests/                  file test
package.json            command project dan dependency
test-results/           artifact dari test run, kalau dihasilkan
```

Struktur setiap tim bisa berbeda. Baca repository-nya, jangan berasumsi semuanya memakai default.

### 2. Pastikan kontrak environment-nya

`baseURL` membuat test bisa membuka path produk tanpa menulis host berulang kali:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
});
```

URL yang berbeda antar-environment sebaiknya tinggal di konfigurasi, bukan disalin ke setiap skenario. Password, token, dan secret lain juga nggak boleh ditulis di source code yang di-commit.

### 3. Baca test lengkap berdasarkan tanggung jawabnya

```ts
import { test, expect } from '@playwright/test';

test('customer can open the cart', async ({ page }) => {
  await page.goto('/products');

  await page.getByRole('link', { name: 'Cart' }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
});
```

Hubungkan setiap baris dengan intent QA:

- judul test menjelaskan perilaku yang sedang diperiksa;
- `{ page }` meminta browser page fixture yang terisolasi dari runner;
- `goto` membentuk halaman awal sebelum action;
- `getByRole` mendeskripsikan link Cart seperti yang dikenali pengguna;
- `click` melakukan action; dan
- dua assertion membuktikan destination dan hasil yang terlihat.

Click bukanlah bukti. Click hanya meminta browser melakukan action. Tanpa assertion, test bisa selesai walaupun mengarah ke destination yang salah.

### 4. Jalankan scope terkecil yang masih berguna

```bash
npx playwright test tests/cart.spec.ts
npx playwright test -g "customer can open the cart"
npx playwright test --headed
npx playwright test --ui
```

Mulai dari satu file atau satu judul supaya hasilnya gampang dihubungkan dengan perubahanmu. Pakai headed mode kalau melihat browser bisa membantu. Pakai UI Mode kalau kamu butuh langkah demi langkah dan snapshot DOM untuk investigasi.

Setelah itu, baca hasilnya. Failure yang berguna biasanya menunjukkan judul test, baris yang gagal, kondisi yang diharapkan, kondisi yang teramati, dan artifact yang tersedia. Jangan berhenti di kata “merah”; tanyakan bukti apa yang sebenarnya diberikan hasil tersebut.

## Kapan pendekatan ini cocok dipakai?

Jalankan test secara fokus saat kamu belajar, mengubah satu skenario, atau menginvestigasi kegagalan lokal. Setelah test itu lolos, jalankan kelompok test lain yang relevan. Full suite dipakai pada tahap membangun confidence yang lebih luas, bukan setiap kali mengetik satu baris.

Gunakan script milik repository kalau tim membungkus Playwright dengan setup environment tertentu. `npx playwright test` memang berguna, tapi bisa saja melewatkan langkah yang sudah dimasukkan ke `npm test`, `bun run test:e2e`, atau command project lainnya.

Jangan langsung membuat scaffold Playwright baru hanya karena file test belum kelihatan. Periksa dulu `package.json`, file konfigurasi, folder test, dan dokumentasi repository.

Jangan menambah skenario sebelum kamu bisa menjelaskan state, action, bukti, dan output kegagalan dari test pertama.

## Kalau gagal, mulai cek dari mana?

Bayangkan test timeout di baris ini:

```ts
await page.getByRole('link', { name: 'Cart' }).click();
```

Godaan pertamanya mungkin menambah sleep atau menyalin CSS path dari DevTools. Mulai dari bukti dulu:

1. Apakah navigasi ke `/products` berhasil?
2. URL dan isi halaman apa yang ada saat test gagal?
3. Apakah kontrolnya benar-benar link, dan accessible name apa yang dikenali browser?
4. Ada satu elemen yang cocok, tidak ada, atau malah beberapa?
5. Apakah aplikasi menampilkan error, halaman login, atau loading state?

Kalau produk memang mengganti nama link menjadi “Shopping cart”, ubah test setelah memastikan perubahan itu memang diinginkan. Kalau halaman malah redirect ke login, mengganti locator justru menutupi masalah starting state.

Timeout yang lebih panjang nggak akan memperbaiki environment yang salah, test data yang hilang, atau identitas elemen yang keliru.

Sebelum menjalankan test yang belum kamu kenal, review baris demi baris:

- Apakah judulnya menjelaskan satu perilaku produk?
- Apakah URL dan state awalnya valid untuk repository ini?
- Apakah test mengasumsikan visible text, test ID, credential, atau route tanpa bukti?
- Apakah setiap action mendukung risiko yang sedang diuji?
- Apakah ada assertion untuk outcome yang bisa diamati?
- Apakah fixed sleep atau `catch` yang terlalu luas sedang menutupi ketidakpastian?
- Bisakah kamu menjalankan skenario ini saja dan menjelaskan kegagalannya?

Perlakukan kode yang belum kamu kenal sebagai draft yang penuh asumsi, bukan sebagai fakta produk yang sudah ditemukan.

## Coba cek pemahamanmu

Review test ini:

```ts
test('customer opens account settings', async ({ page }) => {
  await page.goto('/account');
  await page.getByRole('link', { name: 'Settings' }).click();
});
```

Jawab pertanyaan berikut:

1. Starting state dan action apa yang ditulis test ini?
2. Tanggung jawab penting apa yang masih hilang?
3. Bukti apa yang bisa mengonfirmasi bahwa account settings benar-benar terbuka?
4. Command apa yang kamu pakai untuk menjalankan test dengan nama ini saja?
5. Kalau link tidak ditemukan, apa yang kamu periksa sebelum mengubah locator?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Test dimulai dari `/account` lalu membuka link Settings.
- Belum ada assertion, jadi test tidak membuktikan bahwa account settings berhasil terbuka.
- Bukti yang berguna bisa berupa URL settings dan heading “Account settings” yang terlihat. Bukti tepatnya tetap harus mengikuti requirement produk.
- Jalankan `npx playwright test -g "customer opens account settings"` atau wrapper command yang setara di repository.
- Periksa URL yang dimuat, state halaman, role, accessible name, jumlah elemen yang cocok, serta redirect atau error yang tidak diharapkan sebelum mengganti locator.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membuka project, menjelaskan tanggung jawab setiap bagian di dalam satu Playwright test, menjalankannya secara fokus, lalu memakai hasilnya untuk menentukan apa yang perlu diperiksa berikutnya.

Selesaikan Core Practice dengan mengubah starter menjadi satu test yang punya bukti observable. Perubahan yang diminta sengaja kecil: pakai locator yang dilihat pengguna dan web-first assertion. Setelah itu, lesson berikutnya akan memberimu JavaScript secukupnya untuk mengubah test data dan logic kecil tanpa membawa learning path ini menjadi kursus programming umum.
