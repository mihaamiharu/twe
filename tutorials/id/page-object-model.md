---
title: 'Pilih Test Abstraction Terkecil yang Benar-Benar Berguna'
description: 'Gunakan inline code, focused helper, component object, dan page object berdasarkan pola perubahan—bukan sekadar ikut framework trend.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan maintenance problem apa yang sebenarnya diselesaikan sebuah abstraction;
- memilih antara clear inline code, focused helper, component object, dan page object;
- merancang method berdasarkan behavior yang bermakna, bukan generic UI operation;
- menjaga scenario-specific action dan evidence tetap terlihat di test; serta
- mereview generated abstraction yang menyembunyikan state atau menambah indirection tanpa manfaat.

## Kenapa ini penting buat QA

Pernah nggak sih lihat suite yang kelihatannya rapi karena semua code sudah masuk class, tapi pas test gagal kita malah harus buka lima file cuma untuk tahu tombol mana yang diklik?

Saat suite membesar, locator atau sign-in step yang sama memang bisa muncul di beberapa test. Kalau semua terus dicopy, satu perubahan UI jadi mahal. Tapi kalau semuanya langsung diekstrak, behavior, state transition, dan assertion penting bisa ikut terkubur.

Maintainability bukan dihitung dari berapa banyak class yang kita punya atau seberapa sedikit duplication-nya. Test yang maintainable membantu QA menjawab tiga pertanyaan dengan cepat:

1. Customer risk apa yang dicakup scenario ini?
2. Kalau product berubah, bagian mana yang perlu diupdate?
3. Kalau gagal, behavior dan evidence mana yang harus diperiksa?

Abstraction baru berguna kalau jawaban tiga pertanyaan itu jadi lebih jelas.

## Cara berpikir yang perlu kamu pegang

Mulai dari pola perubahan yang benar-benar terlihat, lalu pilih boundary terkecil yang bisa menampungnya:

```text
Belum ada stable repetition       → biarkan mechanics tetap inline
Satu meaningful action berulang   → focused helper
Satu reusable UI region           → component object
Satu stable application surface   → page object

Di semua level: risk dan evidence scenario harus tetap terlihat.
```

![Keputusan abstraction dimulai dari observed change pattern, lalu memilih clear inline code, focused helper, component object, atau page object sambil menjaga scenario evidence tetap terlihat.](/images/tutorials/abstraction-decision-ladder.svg)

_Abstraction punya biaya. Biarkan repeated meaningful change yang membayar biaya itu._

| Pilihan          | Boundary yang direpresentasikan             | Signal yang cukup kuat untuk mulai memakainya                  |
| ---------------- | ------------------------------------------- | -------------------------------------------------------------- |
| Inline code      | Satu scenario                               | Behavior masih jelas dan belum menjadi stable pattern          |
| Focused helper   | Satu complete action atau setup operation   | Beberapa test mengulang meaningful mechanics yang sama         |
| Component object | Satu reusable widget atau region            | Cart, menu, grid, atau dialog yang sama muncul di banyak flow  |
| Page object      | Satu stable application atau domain surface | Banyak scenario memakai capability halaman yang saling terkait |

Page object boleh merepresentasikan satu bagian aplikasi. Kita nggak perlu memaksa setiap URL atau setiap DOM element punya class sendiri.

## Coba kita bedah contoh nyata

Dua login scenario mengulang mechanics yang sama:

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

Repeated mechanics ini punya nama yang bermakna: submit login credentials. Focused helper sudah cukup:

```ts
type Credentials = {
  email: string;
  password: string;
};

async function submitLogin(page: Page, credentials: Credentials) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
```

Kedua scenario sekarang share mechanics, tapi claim yang berbeda tetap terlihat:

```ts
await submitLogin(page, validBuyer);
await expect(page).toHaveURL('/account');
await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
```

```ts
await submitLogin(page, { ...validBuyer, password: 'wrong-password' });
await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
await expect(page).toHaveURL('/login');
```

Jangan buru-buru bikin class cuma karena ada kata “page” di scenario. Helper tadi sudah melokalkan repeated change tanpa menyembunyikan intent test.

### Kapan page object mulai layak?

Coba bayangin login surface berkembang: ada password reset, single sign-on, account lockout, dan beberapa area product memakainya. Sekarang ada coherent capability yang cukup kuat untuk punya object sendiri:

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

API-nya memakai product vocabulary. Kita nggak membuat generic method seperti `clickButton(name)` atau mengekspos semua CSS selector “siapa tahu nanti dipakai.”

### Kapan component object lebih tepat?

Modern web app sering memakai drawer, dialog, navigation bar, atau data grid yang sama di beberapa halaman. Kalau cart panel adalah repeated surface yang stabil, modelkan component itu—bukan bikin page object besar untuk setiap halaman yang menampilkannya:

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

Component menerima scoped root. Dia mengurus cart-panel mechanics tanpa ikut memiliki seluruh application journey.

## Kapan pendekatan ini cocok dipakai?

Biarkan code tetap inline selama pendek, jelas, dan belum membentuk stable pattern. Sedikit duplication kadang justru memberi evidence apakah sebuah pattern benar-benar muncul.

Gunakan focused helper untuk complete repeated operation seperti submit login credentials, membuat owned test data, atau membuka known product state. Namai behavior-nya, bukan implementation detail-nya.

Gunakan component object untuk repeated UI region yang punya vocabulary dan locator scope sendiri. Gunakan page object saat satu stable application surface punya beberapa related capability yang dipakai banyak scenario.

Pertahankan scenario-specific outcome assertion di test supaya claim-nya mudah direview. Abstraction boleh mengassert invariant yang memang menjadi explicit contract-nya—misalnya helper `signInSuccessfully` membuktikan sign-in selesai. Jadi, “semua assertion wajib di dalam page object” dan “assertion sama sekali nggak boleh di dalam page object” sama-sama bukan golden rule.

Jangan extract code cuma untuk mengurangi jumlah baris. Jangan bikin satu global object yang tahu seluruh aplikasi. Jangan paksa alternative product path melewati abstraction yang dibuat untuk flow berbeda.

## Kalau gagal, mulai cek dari mana?

| Symptom                                         | Kemungkinan design problem                            | Pertanyaan yang lebih berguna                                     |
| ----------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Satu UI rename memaksa edit banyak class        | Boundary mengikuti page, bukan component yang berubah | Shared surface mana yang sebenarnya berubah?                      |
| Test cuma terbaca seperti `flow.run()`          | Business step dan evidence tersembunyi                | Action dan claim mana yang harus tetap terlihat?                  |
| Object punya method `click`, `fill`, dan `wait` | API hanya membungkus Playwright                       | Meaningful capability apa yang benar-benar dishare?               |
| Method terus mengembalikan object berikutnya    | Navigation dan state transition terkunci dalam chain  | Apakah transition ini seharusnya eksplisit di test?               |
| Helper butuh banyak boolean                     | Satu abstraction dipaksa melayani unrelated scenario  | Perlu dipecah jadi smaller operation atau separate capability?    |
| Fix satu scenario merusak test lain             | Hidden state atau side effect bocor melewati boundary | Apa yang dimiliki, diubah, dikembalikan, dan dijamin abstraction? |

Kalau abstraction yang katanya reusable malah membuat legitimate scenario susah ditulis, review boundary-nya sebelum menambah option atau conditional baru.

## Review hasil buatan AI

AI bisa membuat page-object framework yang terlihat profesional sebelum memahami product dan change history kita. Review dengan pertanyaan ini:

- Concrete duplication atau change pattern apa yang diselesaikan setiap abstraction?
- Method name-nya product behavior atau generic UI command?
- Apakah important action dan assertion scenario masih terlihat dari test?
- Object-nya merepresentasikan stable page, component, atau domain surface?
- Apakah navigation, authentication, data mutation, waiting, atau cleanup disembunyikan?
- Apakah locator di-scope dan memakai meaningful contract?
- Apakah focused helper sebenarnya lebih mudah dibaca dan didebug?
- Bisakah QA mengubah satu component tanpa menelusuri object chain panjang?
- Apakah generated code mengarang credential, route, selector, atau business rule?

Minta AI menjelaskan kenapa boundary itu ada dan future change apa yang dilokalkan. Kalau jawabannya cuma “reuse” atau “best practice,” abstraction-nya belum punya alasan yang cukup.

## Coba cek pemahamanmu

Sebuah suite punya tiga checkout scenario. Semuanya membuka cart drawer dan mengubah quantity. Drawer yang sama juga muncul di product page dan search page. Generated proposal membuat `ProductPage`, `SearchPage`, dan `CheckoutPage`; setiap class menyalin cart locator dan punya generic method `clickButton`.

Apa yang tetap kamu tampilkan di setiap test? Apa yang kamu extract, dan boundary mana yang kamu pilih?

## Bandingkan dengan cara pikir ini

Salah satu design yang masuk akal:

- Pertahankan product-specific starting state, important user action, dan outcome assertion setiap scenario di test.
- Buat satu `CartPanel` component object dengan drawer sebagai root karena itulah repeated UI dan change boundary-nya.
- Beri capability bermakna seperti `setQuantity(product, quantity)` dan `remove(product)`, bukan generic click atau fill wrapper.
- Biarkan setiap page atau test membuat component dari scoped locator yang sesuai; jangan copy cart selector ke tiga page class.
- Tambahkan page object hanya kalau salah satu halaman nanti benar-benar punya beberapa stable shared capability sendiri.

Targetnya bukan jumlah baris paling sedikit. Targetnya satu tempat yang jelas untuk update cart mechanics tanpa menyembunyikan risk yang dibuktikan setiap scenario.

## Sebelum lanjut

Sekarang kamu seharusnya bisa memilih abstraction terkecil yang menampung meaningful repeated change sambil menjaga scenario intent dan evidence tetap mudah direview.

Practice wajib di lesson ini menguji judgment tersebut lewat focused helper. Kamu nggak perlu membuat class page object hanya karena scenario memakai page.

Lesson berikutnya membahas concern yang berbeda: dependency dan lifecycle. Helper atau page object mengatur behavior; fixture menentukan bagaimana resource dibuat, diberikan ke test, dan dibersihkan. Jangan pakai satu konsep sebagai pengganti konsep lainnya.
