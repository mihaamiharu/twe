---
title: 'Pilih Abstraction yang Memang Membuat Test Lebih Mudah Dirawat'
description: 'Tentukan kapan code tetap inline dan kapan perlu dipindahkan ke focused helper, component object, atau page object berdasarkan pengulangan yang benar-benar terjadi.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan masalah maintenance yang ingin diselesaikan oleh sebuah abstraction;
- memilih antara inline code, focused helper, component object, dan page object;
- membuat method berdasarkan action yang dilakukan user atau product behavior yang diuji;
- menjaga action penting dan expected result setiap scenario tetap terlihat di test; serta
- mereview abstraction buatan AI yang memakai nama terlalu umum, menyembunyikan state, atau membuat alur test sulit ditelusuri.

## Kenapa ini penting buat QA

Pernah nggak sih lihat test suite yang kelihatannya rapi karena semua code sudah dimasukkan ke dalam class, tapi begitu test fail kita malah harus membuka beberapa file hanya untuk mencari tahu button mana yang diklik?

Saat test suite mulai membesar, locator atau step untuk sign-in yang sama bisa muncul di beberapa test. Kalau semuanya terus di-copy, satu perubahan UI bisa memaksa kita mengedit banyak file. Kalau setiap pengulangan langsung dipindahkan ke abstraction, step penting, perubahan state, dan assertion yang perlu dicek justru bisa ikut tersembunyi.

Test yang mudah di-maintain membantu QA menjawab tiga pertanyaan dengan cepat:

1. Risiko apa yang dihadapi customer dalam scenario ini?
2. Kalau UI atau flow berubah, bagian code mana yang perlu di-update?
3. Kalau test fail, action dan expected result mana yang perlu diperiksa?

Jumlah class atau sedikitnya duplikasi bukan ukuran utamanya. Abstraction baru berguna kalau ketiga jawaban tadi menjadi lebih jelas.

## Cara berpikir yang perlu kamu pegang

Perhatikan dulu code yang benar-benar berulang dan biasanya berubah bersama. Setelah itu, pindahkan hanya bagian terkecil yang memang perlu dirawat di satu tempat:

```text
Belum ada pengulangan yang stabil     → biarkan code tetap inline
Satu action yang sama mulai berulang  → focused helper
Satu bagian UI dipakai di banyak flow → component object
Beberapa action stabil sering dipakai → page object

Apa pun pilihannya, tujuan scenario dan expected result harus tetap terlihat.
```

![Pilih inline code, focused helper, component object, atau page object berdasarkan bagian code yang benar-benar berulang, sambil menjaga tujuan scenario dan expected result tetap terlihat.](/images/tutorials/abstraction-decision-ladder.svg)

_Setiap abstraction juga perlu di-maintain. Buat hanya kalau ada code berulang yang memang lebih mudah dirawat dari satu tempat._

| Pilihan          | Bagian yang dirapikan            | Kapan mulai layak dipakai                                     |
| ---------------- | -------------------------------- | ------------------------------------------------------------- |
| Inline code      | Satu scenario                    | Step masih pendek, jelas, dan belum sering berulang           |
| Focused helper   | Satu action atau setup yang utuh | Beberapa test mengulang kumpulan step yang sama               |
| Component object | Satu bagian UI yang reusable     | Cart, menu, grid, atau dialog yang sama muncul di banyak flow |
| Page object      | Satu area aplikasi yang stabil   | Banyak scenario memakai beberapa action yang saling berkaitan |

Page object boleh mewakili satu bagian dari aplikasi. Kita nggak perlu membuat class sendiri untuk setiap URL atau setiap element di DOM.

## Coba kita bedah contoh nyata

Dua scenario login berikut mengulang step yang sama:

```ts
test('customer signs in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/account');
  await expect(
    page.getByRole('heading', { name: 'Your account' }),
  ).toBeVisible();
});

test('invalid password is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('buyer@example.test');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
  await expect(page).toHaveURL('/login');
});
```

Step yang berulang tadi punya satu tujuan yang jelas, yaitu mengirim login credentials. Focused helper sudah cukup untuk merapikannya:

```ts
type Credentials = {
  email: string;
  password: string;
};

async function submitLogin(page: Page, credentials: Credentials) {
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
```

Kedua scenario sekarang memakai helper yang sama. Starting page dan expected result yang berbeda tetap terlihat di dalam test:

```ts
await page.goto('/login');
await submitLogin(page, validBuyer);
await expect(page).toHaveURL('/account');
await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
```

```ts
await page.goto('/login');
await submitLogin(page, { ...validBuyer, password: 'wrong-password' });
await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
await expect(page).toHaveURL('/login');
```

Jangan buru-buru membuat class hanya karena scenario tersebut menggunakan `page`. Helper tadi sudah mengumpulkan step yang berulang tanpa menyembunyikan tujuan test.

### Kapan page object mulai layak?

Kalau flow login kemudian berkembang dengan password reset, single sign-on, dan account lockout, lalu dipakai oleh beberapa area product, ada beberapa action yang saling berhubungan dan terus digunakan bersama. Pada kondisi ini, page object mulai layak dibuat:

```ts
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login');
  }

  async submit(credentials: Credentials) {
    await this.page.getByLabel('Email').fill(credentials.email);
    await this.page.getByLabel('Password').fill(credentials.password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  errorMessage() {
    return this.page.getByRole('alert');
  }

  async requestPasswordReset(email: string) {
    await this.page.getByRole('link', { name: 'Forgot password?' }).click();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByRole('button', { name: 'Send reset link' }).click();
  }
}
```

Nama method-nya menjelaskan action yang dilakukan di product. Kita nggak membuat method umum seperti `clickButton(name)` atau mengekspos semua CSS selector hanya karena mungkin akan dipakai nanti.

### Kapan component object lebih tepat?

Aplikasi web sering memakai drawer, dialog, navigation bar, atau data grid yang sama di beberapa halaman. Kalau cart panel yang sama dipakai berulang kali, buat component object untuk cart tersebut. Nggak perlu membuat page object besar untuk setiap halaman yang menampilkannya:

```ts
export class CartPanel {
  constructor(private readonly root: Locator) {}

  item(name: string) {
    return this.root.getByRole('listitem').filter({ hasText: name });
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }
}
```

`CartPanel` menerima root locator yang sudah di-scope. Component ini mengurus cara berinteraksi dengan cart tanpa ikut mengatur seluruh flow aplikasi.

## Kapan pendekatan ini cocok dipakai?

Biarkan code tetap inline selama masih pendek, jelas, dan belum sering berulang. Sedikit duplikasi nggak selalu buruk. Dari pengulangan itulah kita bisa melihat bagian mana yang memang perlu dipindahkan ke helper atau object.

Gunakan focused helper untuk satu kumpulan step yang utuh dan berulang, seperti mengirim login credentials, membuat test data untuk satu test, atau membuka product state tertentu. Beri nama berdasarkan action yang dilakukan, bukan detail implementasinya.

Gunakan component object untuk bagian UI yang dipakai berulang dan punya scope locator sendiri. Gunakan page object ketika satu area aplikasi sudah cukup stabil dan punya beberapa action yang dipakai oleh banyak scenario.

Biarkan assertion untuk expected result yang spesifik tetap berada di test supaya tujuan scenario mudah di-review. Helper boleh punya assertion kalau hasil tersebut memang selalu dijamin setiap kali helper digunakan. Misalnya, sebelum selesai, `signInSuccessfully` boleh memastikan proses sign-in berhasil. Letakkan assertion sesuai hasil yang memang menjadi tanggung jawab helper atau scenario tersebut.

Jangan memindahkan code ke abstraction hanya untuk mengurangi jumlah baris. Jangan mengekspos setiap element hanya karena mungkin akan dibutuhkan. Hindari satu global object yang mengetahui seluruh aplikasi, dan jangan memaksa flow product lain memakai abstraction yang dibuat untuk scenario berbeda.

## Kalau gagal, mulai cek dari mana?

| Yang terjadi                                        | Kemungkinan masalah                                                            | Yang perlu dicek                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Satu perubahan nama di UI memaksa edit banyak class | Locator untuk component yang sama disalin ke beberapa page object              | Component mana yang berubah, dan di mana locator-nya seharusnya disimpan?         |
| Test cuma terbaca seperti `flow.run()`              | Action dan assertion penting tersembunyi di balik satu method                  | Step dan expected result mana yang perlu tetap terlihat di test?                  |
| Object punya method `click`, `fill`, dan `wait`     | Page object hanya membungkus API Playwright                                    | Action apa yang sebenarnya dilakukan user dan berulang di beberapa test?          |
| Satu method terus mengembalikan object berikutnya   | Navigation dan perubahan state tersembunyi dalam object chain                  | Apakah perpindahan page ini perlu terlihat langsung di test?                      |
| Helper membutuhkan banyak boolean                   | Satu helper dipaksa menangani beberapa scenario yang nggak berkaitan           | Apakah helper perlu dipecah berdasarkan action yang berbeda?                      |
| Memperbaiki satu scenario merusak test lain         | Object menyimpan state atau menjalankan side effect yang memengaruhi test lain | State apa yang berubah, siapa yang mengubahnya, dan siapa yang melakukan cleanup? |

Kalau abstraction yang seharusnya reusable malah membuat scenario yang valid sulit ditulis, cek lagi code dan tanggung jawab yang dimasukkan ke dalamnya sebelum menambah option atau conditional baru.

## Review hasil kerja dengan bantuan AI

AI bisa menghasilkan framework page object yang terlihat rapi meskipun belum memahami product dan riwayat perubahannya. Review hasilnya dengan pertanyaan berikut:

- Code apa yang memang berulang, dan perubahan UI apa yang ingin dibuat lebih mudah di-update?
- Apakah nama method menjelaskan action di product atau hanya UI command umum?
- Apakah action penting dan expected result scenario masih terlihat di test?
- Apakah class tersebut benar-benar mewakili page atau component yang stabil?
- Apakah navigation, authentication, data mutation, waiting, atau cleanup disembunyikan?
- Apakah locator sudah di-scope ke bagian UI yang tepat dan menggunakan attribute yang memang stabil?
- Apakah focused helper justru lebih mudah dibaca dan di-debug?
- Bisakah QA mengubah satu component tanpa menelusuri object chain panjang?
- Apakah code buatan AI mengarang credential, route, selector, atau business rule?

Minta AI menjelaskan kenapa setiap helper atau object dibuat dan file mana yang perlu di-update ketika UI berubah. Kalau jawabannya cuma “reuse” atau “best practice,” abstraction tersebut belum punya alasan yang cukup.

## Coba cek pemahamanmu

Sebuah test suite punya tiga checkout scenario. Semuanya membuka cart drawer dan mengubah quantity. Drawer yang sama juga muncul di product page dan search page. AI mengusulkan `ProductPage`, `SearchPage`, dan `CheckoutPage`. Setiap class menyalin cart locator dan punya method umum bernama `clickButton`.

Bagian apa yang tetap perlu terlihat di setiap test? Code yang berulang sebaiknya dipindahkan ke focused helper, component object, atau page object?

## Bandingkan dengan cara pikir ini

Salah satu design yang masuk akal:

- Tetap tampilkan starting state product yang spesifik, user action penting, dan expected result dari setiap scenario di dalam test.
- Buat satu component object `CartPanel` dengan drawer sebagai root karena component itu dipakai berulang dan perubahan locator cart cukup di-update di sana.
- Berikan method yang jelas seperti `setQuantity(product, quantity)` dan `remove(product)`, bukan wrapper umum untuk click atau fill.
- Biarkan setiap page atau test membuat component dari locator yang sudah di-scope. Jangan menyalin cart selector ke tiga page class.
- Tambahkan page object hanya jika salah satu halaman nantinya punya beberapa action stabil yang memang dipakai bersama.

Dengan design ini, cara berinteraksi dengan cart cukup di-update di satu tempat. Setiap test tetap menunjukkan action dan expected result yang perlu dicek.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menentukan kapan code tetap inline dan kapan focused helper, component object, atau page object memang membuat test lebih mudah dirawat. Action penting dan expected result setiap scenario harus tetap mudah ditemukan saat code di-review.

Practice wajib di lesson ini menguji keputusan tersebut lewat focused helper. Kamu nggak perlu membuat class page object hanya karena scenario menggunakan `page`.

Lesson berikutnya membahas hal yang berbeda, yaitu dependency dan lifecycle. Helper atau page object mengatur behavior. Fixture menentukan bagaimana resource dibuat, diberikan kepada test, lalu dibersihkan. Keduanya punya tanggung jawab yang berbeda.
