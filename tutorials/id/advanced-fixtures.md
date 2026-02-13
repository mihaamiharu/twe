---
title: "Advanced Fixtures"
description: "Kuasai komposisi, worker-scope, dan override buat jadi Test Architect yang sebenernya."
---

Kamu udah bisa bikin fixture dasar. Sekarang, kita upgrade skill jadi **Test Architect**. Kita bakal bahas pola-pola canggih yang dipake di tim engineering skala besar.

---

## 1. Komposisi Fixture (Fixture Composition)

Kekuatan asli fixture itu ada di kemampuannya buat **bergantung satu sama lain**. Persis kayak main LEGO, kamu bisa ngerakit object kompleks dari potongan-potongan kecil.

Bayangin kamu punya `UserPage` yang butuh user yang udah login. Kamu tinggal minta fixture `loginPage` di dalem fixture `userPage`-mu!

![Diagram Komposisi Fixture](/images/tutorials/fixture-composition-diagram.png)

```typescript
type MyFixtures = {
  settingsPage: SettingsPage;
  userPage: UserPage;
};

export const test = base.extend<MyFixtures>({
  // Fixture ini bergantung sama fixture 'settingsPage'!
  userPage: async ({ settingsPage }, use) => {
    await settingsPage.goto(); 
    await use(new UserPage(settingsPage.page));
  },
});
```

Playwright otomatis bakal ngurutin rantai ketergantungannya. Kalau `settingsPage` butuh `loginPage`, dia bakal bikinin itu dulu. Canggih kan?

---

## 2. Worker-Scoped Fixtures (Performa)

Secara default, fixture itu dihancurkan (teardown) tiap kali satu test kelar. Ini bagus buat isolasi, tapi jelek buat performa kalau kamu ngelakuin hal berat kayak **database seeding** atau **login via API**.

Pake `{ scope: 'worker' }` buat bikin fixture yang cuma jalan **sekali per worker process**.

![Worker Scope vs Test Scope](/images/tutorials/fixture-worker-vs-test-scope.png)

```typescript
export const test = base.extend<{}, { db: Database }>({
  // Ini jalan sekali per worker, bukan sekali per test!
  db: [async ({}, use) => {
    const db = await connectToDatabase();
    await use(db);
    await db.disconnect();
  }, { scope: 'worker' }],
});
```

**Contoh Kasus:** Koneksi ke DB sekali, terus pake koneksi itu rame-rame buat 50 test dalam satu file.

---

## 3. Override Fixture Bawaan

Kamu sebenernya bisa **nimpuk (override)** perilaku bawaan Playwright! Pengen setiap `page` otomatis punya ukuran layar tertentu atau state login? Override aja fixture `page`.

```typescript
export const test = base.extend({
  page: async ({ baseURL, page }, use) => {
    // Otomatis navigasi ke base URL
    await page.goto(baseURL);
    
    // Suntikin header custom
    await page.setExtraHTTPHeaders({ 'x-test-env': 'true' });
    
    await use(page);
  },
});

```

Sekarang, setiap test di suite kamu otomatis bakal mendarat di homepage dengan custom header. Nggak perlu ubah satu baris pun di file test!

---

## 4. Parameterized Fixtures (Opsi)

Kadang kamu pengen ngatur fixture dari file test itu sendiri. Kamu bisa bikin **Options**.

```typescript
type Options = { defaultUser: string };

export const test = base.extend<Options>({
  defaultUser: ['admin', { option: true }], // Nilai default
  
  // Pake opsinya di fixture lain
  loginPage: async ({ page, defaultUser }, use) => {
    const p = new LoginPage(page);
    await p.login(defaultUser); // Pake opsinya di sini!
    await use(p);
  },
});

// Cara pake di file test
test.use({ defaultUser: 'guest' }); // Override khusus buat file ini!
```

---

## 5. Ringkasan (Checklist)

| Pola | Pake Saat... |
| --- | --- |
| **Komposisi** | Ngerakit object rumit yang butuh langkah setup lain. |
| **Worker Scope** | Nyiapin resource berat (DB, API Login) yang dipake bareng-bareng. |
| **Overrides** | Mengubah behavior default secara global (misal: auto-login tiap page). |
| **Options** | Kamu butuh ngutak-ngatik behavior fixture per file test. |

---

## 6. Bacaan Lanjut

* **[Fixture Scopes](https://playwright.dev/docs/test-fixtures#scoping-fixtures)**: Penjelasan mendalam Worker vs Test scope.
* **[Global Setup](https://playwright.dev/docs/test-global-setup-teardown)**: Buat hal yang cuma jalan sekali per *run* (bukan per worker).
