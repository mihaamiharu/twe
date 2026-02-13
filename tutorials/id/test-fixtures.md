---
title: "Test Fixtures (Dependency Injection)"
description: "Stop nulis 'new LoginPage(page)' terus-terusan. Pelajari cara 'menyuntikkan' page object langsung ke test kamu."
---

Kalau kamu sudah khatam Page Object Model (POM), test code kamu mungkin kelihatan kayak gini:

```typescript
test('Login', async ({ page }) => {
  const loginPage = new LoginPage(page); // 🤮 Bosenin banget!
  await loginPage.goto();
  await loginPage.login('user', 'pass');
});
```

Baris `new LoginPage(page)` yang berulang-ulang itu? Hapus aja. **Playwright Fixtures** memungkinkan kamu untuk "menyuntikkan" (inject) Page Objects langsung ke dalam fungsi test.

---

## 1. Masalahnya: Boilerplate (Kode Basi)

Di Selenium jadul atau framework lama, kita harus bikin instance class secara manual di setiap test (atau di `beforeEach`). Ini bikin kode jadi ribet dan "ketergantungan"-nya kenceng banget (tight coupling).

Playwright nyelesain masalah ini pake **Dependency Injection (DI)**. Kamu cukup definisikan *gimana* cara bikin object-nya sekali aja, terus Playwright yang bakal bikinin (dan bersihin) buat setiap test yang butuh.

![Diagram Fixtures vs POM](/images/tutorials/fixture-vs-pom-diagram.png)

---

## 2. Fixtures Bawaan

Sadar nggak sadar, kamu udah pake fixtures lho! Pas kamu nulis `test('...', async ({ page }) => { ... })`, bagian `{ page }` itu artinya kamu lagi minta fixture bawaan `page`.

Playwright nyediain beberapa yang siap saji:

* `page`: Halaman browser yang terisolasi buat test itu.
* `context`: Browser context (buat nyimpen cookies, storage).
* `browser`: Instance browser-nya (Chromium, Firefox, dll).
* `request`: Konteks buat testing API.

---

## 3. Bikin Custom Fixtures

Keajaibannya dimulai pas kita memperluas (extend) test bawaan buat nambahin object kita sendiri.

### Langkah 1: Definisiin Tipe Fixture

Kasih tau TypeScript fixture kita isinya apaan aja.

```typescript
// fixtures/pom-fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type MyFixtures = {
  loginPage: LoginPage;
  // Nanti bisa tambah page lain di sini!
};
```

### Langkah 2: Implementasi Logika Setup

Pake `base.extend` buat ngasih tau cara inisialisasi `loginPage`.

```typescript
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    // 1. Setup (Persiapan)
    const loginPage = new LoginPage(page);
    await loginPage.goto(); // Opsional: Bisa langsung navigasi otomatis!

    // 2. Oper ke test (Aksi)
    await use(loginPage);

    // 3. Teardown (Beres-beres - jalan setelah test selesai)
    // console.log('Test selesai!');
  },
});

export { expect } from '@playwright/test'; // Jangan lupa export expect juga
```

---

## 4. Siklus Hidup `use()`

Callback `use()` itu unik banget di Playwright. Dia bakal nge-pause eksekusi fixture, jalanin test kamu, terus lanjut lagi setelah test selesai. Jadi kayak "sandwich" yang ngebungkus test kamu.

![Siklus Hidup Fixture Use](/images/tutorials/fixture-use-lifecycle.png)

Ini sempurna buat setup dan cleanup:

```typescript
dbFixture: async ({}, use) => {
  await db.connect();   // Jalan SEBELUM test
  await use(db);        // Test jalan di sini
  await db.disconnect();// Jalan SETELAH test
}
```

---

## 5. Cara Pake Fixture

Sekarang, ganti import dari `@playwright/test` ke file fixture buatanmu.

```typescript
// tests/login.spec.ts
import { test, expect } from '../fixtures/pom-fixtures'; // Import test BUATANMU

// DI yang proper: minta 'loginPage' langsung di argumen
test('User bisa login', async ({ loginPage, page }) => {
  // loginPage udah jadi dan siap dipake!
  await loginPage.login('user', 'pass');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

Liat deh sebersih apa kodenya! Nggak ada `new`, nggak ada `beforeEach`, cuma interaksi murni.

---

## 6. Ringkasan (Checklist)

| Konsep | Intinya |
| --- | --- |
| **Dependency Injection** | Minta apa yang kamu butuh di argumen test `({ loginPage })`. |
| **`test.extend`** | Method buat bikin versi custom dari `test` yang isinya fixture kamu. |
| **`use()`** | Callback yang nyuntikin value dan ngebungkus setup/teardown. |
| **Kenapa Pake?** | Mengurangi kode copas (boilerplate), mengisolasi state, dan bikin setup yang bisa dipake ulang. |

---

## 7. Bacaan Lanjut

* **[Playwright Fixtures Guide](https://playwright.dev/docs/test-fixtures)**: Dokumentasi resmi.
* **[Automatic Fixtures](https://playwright.dev/docs/test-fixtures#automatic-fixtures)**: Fixture yang jalan sendiri biarpun nggak kamu minta (bagus buat logging).
