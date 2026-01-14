---
title: "Fundamental Interaksi"
description: "Menerapkan locator, action, dan assertion engine pada elemen web."
---

Buat menguasai dasar-dasar interaksi, kita perlu memecah "Siklus Tes" jadi tiga bagian mekanik. Karena kita kerja di lingkungan berbasis browser, kita bakal fokus ke gimana **Locators** nyari elemen dan gimana **Assertions** mastiin statusnya bener.

---

## 1. Locators: Nemuin Target

**Locator** adalah instruksi tingkat tinggi yang ngasih tau Playwright cara nemuin elemen di halaman. Beda sama alat jadul yang bergantung sama *path* CSS yang gampang rusak, praktik terbaik modern lebih mentingin **atribut yang dilihat user**. Ini ngejamin tes kamu nggak bakal ancur cuma gara-gara developer ganti nama *class* CSS.

### Hirarki Locator

Playwright nyaranin pake atribut yang paling "stabil" duluan biar tes kamu nggak *flaky*.

![Locator Priority Hierarchy](/images/tutorials/playwright-locator-hierarchy.png)

| Prioritas | Metode | Deskripsi |
| --- | --- | --- |
| **1. Role** | `page.getByRole()` | Nyari elemen berdasarkan peran aksesibilitasnya (misal: tombol, judul, *checkbox*). Paling tangguh. |
| **2. Text** | `page.getByText()` | Nyari kata-kata persis yang dilihat user di layar. |
| **3. Label** | `page.getByLabel()` | Nyasar *input form* lewat teks `<label>` pasangannya. |
| **4. Test ID** | `page.getByTestId()` | Atribut khusus (kayak `data-testid`) buat otomatisasi. Pake ini sebagai cadangan terakhir. |

> [!TIP]
> Selalu mulai pake `getByRole()`. Ini paling tahan banting karena peran aksesibilitas jarang berubah, biarpun developernya ngacak-ngacak struktur HTML-nya.

---

## 2. Actions: Interaksi sama Target

Begitu locator nemuin elemen, kamu ngelakuin aksi. Berkat **Actionability Engine** (dari tutorial sebelumnya), Playwright otomatis mastiin elemen itu kelihatan dan stabil sebelum lanjut.

| Aksi | Metode | Contoh |
| --- | --- | --- |
| **Click** | `.click()` | `await page.getByRole('button', { name: 'Kirim' }).click();` |
| **Fill** | `.fill()` | `await page.getByPlaceholder('Cari').fill('JavaScript');` |
| **Check** | `.check()` | `await page.getByLabel('Saya setuju').check();` |
| **Select** | `.selectOption()` | `await page.getByRole('combobox').selectOption('medium');` |
| **Hover** | `.hover()` | `await page.getByText('Menu').hover();` |

> [!NOTE]
> Metode `.fill()` ngapus isi input dulu, baru ngetik. Pake `.type()` kalo kamu butuh nambahin teks tanpa ngapus yang udah ada.

---

## 3. Assertions: Verifikasi Hasil

**Assertion** adalah tempat kamu definisiin hasil yang diharapkan. Playwright pake **Web-First Assertions**, yang "pinter" dan bakal nunggu kondisi terpenuhi sebelum mutusin gagal.

### Cara Kerja Assertions

Pas kamu nulis assertion, Playwright masuk ke "siklus coba lagi" (*retry loop*). Kalo kondisinya belum pas saat itu juga, dia bakal nunggu dan ngecek lagi tiap beberapa milidetik sampe maksimal 5 detik.

![Assertion Retry Loop](/images/tutorials/playwright-assertion-loop.png)

| Assertion | Metode | Contoh |
| --- | --- | --- |
| **Visibility** | `.toBeVisible()` | `await expect(page.getByText('Sukses')).toBeVisible();` |
| **URL** | `.toHaveURL()` | `await expect(page).toHaveURL('/dashboard');` |
| **Text Content** | `.toHaveText()` | `await expect(page.locator('#status')).toHaveText('Aktif');` |
| **Attribute** | `.toHaveAttribute()` | `await expect(locator).toHaveAttribute('disabled');` |

> [!IMPORTANT]
> Selalu pake `expect()` dari `@playwright/test`, bukan assertion JavaScript biasa. `expect()` bawaan Playwright punya fitur *auto-waiting* yang udah built-in.

---

## 4. Siklus Interaksi Lengkap

Script tes standar ngikutin jalur lurus mulai dari navigasi sampe verifikasi.

```javascript
test('Alur Login Sukses', async ({ page }) => {
  // 1. Navigasi
  await page.goto('https://example.com/login');

  // 2. Interaksi
  await page.getByLabel('Username').fill('qa_engineer');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Verifikasi
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

---

## 5. Checklist Rangkuman

| Konsep | Poin Penting |
| --- | --- |
| **Locators** | Pake `getByRole()` duluan, baru Text, Label, TestId buat cadangan |
| **Actions** | Selalu pake `await`—Playwright ngurus status elemen otomatis |
| **Assertions** | Web-First Assertions nyoba terus (*auto-retry*) sampe 5 detik |
| **No Manual Waits** | Kombinasi Locator + Assertion udah ngurusin semua masalah waktu |

---

## 6. Bacaan Lanjut (Deep Dive)

Menguasai locator dan assertion adalah titik di mana "sekadar scripting" berubah jadi "engineering".

### Dokumentasi Resmi

* **[Locators Guide](https://playwright.dev/docs/locators)**: Panduan lengkap buat 30+ metode locator.
* **[Assertions Guide](https://playwright.dev/docs/test-assertions)**: Daftar lengkap semua pencocok (*matcher*) yang tersedia (misal: `toBeChecked`, `toBeFocused`).

### GitHub Source Code (Open Source)

* **[Locator Implementation](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/client/locator.ts)**: TypeScript sisi-klien yang nerjemahin `getByRole` jadi *query* browser.
* **[Matchers Logic](https://github.com/microsoft/playwright/blob/main/packages/playwright/src/matchers/matchers.ts)**: Liat persis gimana Playwright mutusin apakah `.toBeVisible()` nilainya *true* atau *false*.
