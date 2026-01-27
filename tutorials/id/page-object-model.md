---
title: "Page Object Model (POM)"
description: "Jangan biarkan perubahan satu ID bikin error 50 test case. Pelajari cara bikin kode yang tahan banting."
---

Bayangkan skenario horor ini: Kamu punya 50 file test yang semuanya nge-klik tombol "Login". Tiba-tiba, developer ngubah ID tombol itu dari `#login-btn` jadi `#btn-masuk`.

**Hasilnya:** 50 file test kamu merah semua. Kamu harus benerin satu-satu. Capek? Pasti.

Solusinya? Kenalan sama **Page Object Model (POM)**. Ini teknik "P3K" buat automation: **P**emisahan **P**ara **P**engode (biar nggak pusing).

---

## 1. Konsep Dasar: Apa itu POM?

Simpelnya, Page Object Model itu cara kita mindahin *logic* interaksi elemen (klik, ketik, baca teks) ke dalam file terpisah (biasanya per halaman/page).

Jadi, script test kamu cuma isinya **"Niat"**, bukan **"Teknis"**.

* **Tanpa POM:** "Cari elemen `#btn-login`, terus klik." (Ribet)
* **Dengan POM:** "Halaman Login -> Lakukan Login." (Simpel)

### Analogi Restoran

* **Script Test** itu kayak **Pelanggan** yang pesen makan ("Saya mau Nasi Goreng").
* **Page Object** itu kayak **Pelayan** yang tau cara ngomong ke dapur ("Meja 4, Nasi Goreng satu, pedas sedang").
* **Aplikasi Web** itu **Dapur**-nya.

Pelanggan nggak perlu tau cara masak nasi goreng, dia cuma perlu tau cara pesennya.

![Diagram Konsep Page Object Model](/images/tutorials/pom-concept-diagram.png)

| Kondisi | Tanpa POM | Dengan POM |
| :--- | :--- | :--- |
| **Kalo ID Berubah** | Nangis, benerin 50 file | Santai, cuma benerin 1 file (Page Object) |
| **Keterbacaan** | Penuh kode selector (`.css-123`) | Bahasa manusia (`loginPage.doLogin()`) |
| **Duplikasi** | Copy-paste selector di mana-mana | Satu kode dipake rame-rame (Reusable) |

> [!NOTE]
> POM itu bukan fitur bawaan Playwright atau Selenium, ini **Pola Pikir (Design Pattern)**. Jadi tool apapun yang kamu pake, konsep ini tetep kepake.

---

## 2. Bedah Anatomi Page Object

Di Playwright (pake TypeScript), Page Object itu cuma sebuah `class` biasa. Isinya biasanya cuma dua macem:

1. **Locators (Barang-barangnya):** Tombol, input, teks. Didefinisikan di `constructor`.
2. **Methods (Aksinya):** Klik, isi form, navigasi.

```typescript
// pages/LoginPage.ts
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  // 1. Kenalin dulu siapa aja 'pemainnya'
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 2. Tunjukin di mana letak barangnya (Locator)
    // Kalo ID berubah, CUKUP GANTI DI SINI AJA!
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'Sign In' });
  }

  // 3. Ajarin cara mainnya (Actions)
  async goto() {
    await this.page.goto('/login');
  }

  async login(user: string, pass: string) {
    // Interaksi pake properti yang udah didefinisikan di atas
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }
}
```

---

## 3. Cara Pake di File Test

Nah, setelah bikin "kamus"-nya (Page Object), file test kamu jadi bersih banget. Nggak ada lagi kode selector yang semrawut.

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('User bisa login dengan lancar', async ({ page }) => {
  // 1. Panggil "Pelayan"-nya (Page Object)
  const loginPage = new LoginPage(page);

  // 2. Suruh dia kerja
  await loginPage.goto();
  await loginPage.login('testuser', 'password123');

  // 3. Cek hasilnya (Assertion tetep di file test ya!)
  await expect(page).toHaveURL(/dashboard/);
});
```

> [!TIP]
> **Pro Tip:** Di latihan playground kita, kadang kita udah siapin instance Page Object-nya otomatis. Jadi kamu tinggal pake aja method-nya tanpa perlu `new LoginPage(page)`. Praktis kan?

---

## 4. Aturan Main (Best Practices)

Biar POM kamu nggak jadi "POM Bensin" (meledak-ledak), ikutin aturan ini:

| Aturan | Alasannya |
| :--- | :--- |
| **Jangan Ada Assertion di PO** | Page Object tugasnya cuma ngelakuin aksi. Biarkan file Test yang menilai apakah aksi itu "Lulus" atau "Gagal". |
| **Return Halaman Baru** | Kalo method `klikDaftar()` ngebawa user ke halaman Dashboard, method itu sebaiknya nge-return `new DashboardPage(page)`. Biar nyambung (chaining). |
| **Pecah Kecil-Kecil** | Jangan bikin satu class `SuperPage` yang isinya semua elemen web. Pecah jadi `LoginPage`, `HomePage`, `NavbarComponent`, dll. |

---

## 5. Ringkasan (Checklist)

| Konsep | Intinya |
| :--- | :--- |
| **Separation of Concerns** | Page Object ngurusin "Gimana caranya", Test ngurusin "Apa buktinya". |
| **DRY (Don't Repeat Yourself)** | Pantang nulis selector yang sama dua kali. Bungkus di Page Object. |
| **Maintenance** | Investasi waktu sedikit di awal buat bikin POM, panen waktu banyak pas maintenance nanti. |

---

## 6. Mau Belajar Lebih Dalem?

Kalau kamu udah jago ginian, kamu bisa bikin framework automation yang scalable buat tim gede.

* **[Playwright POM Guide](https://playwright.dev/docs/pom)**: Kitab sucinya POM di Playwright.
* **[Test Fixtures](https://playwright.dev/docs/test-fixtures)**: Level lanjut! Cara biar nggak perlu nulis `new LoginPage(page)` berulang-ulang di setiap test (Dependency Injection ala Playwright).

Selamat coding yang lebih rapi! 🚀
