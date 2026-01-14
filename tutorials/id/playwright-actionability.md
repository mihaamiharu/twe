---
title: "Actionability dan Auto-Wait Engine"
description: "Gimana Playwright ngebasmi 'flaky test' dengan cara otomatis verifikasi status elemen sebelum beraksi."
---

## 1. Masalahnya: Race Condition

Di *manual testing*, kalau tombol masih *loading* atau ketutup *popup*, kamu bakal nunggu sampai dia siap. Tapi di otomatisasi biasa, kalau kamu suruh *script* buat `click()`, dia bakal kirim sinyal itu di milidetik itu juga. Kalau elemennya belum siap pas perintah itu datang, tes kamu bakal langsung *crash* atau gagal.

Playwright nyelesain masalah ini dengan bertindak kayak pengamat manusia. Dia nggak asal klik; dia nunggu dulu sampai elemennya bener-bener **Actionable**.

---

## 2. Checklist Actionability

Sebelum Playwright jalanin aksi (kayak `click()`, `fill()`, atau `check()`), dia bakal jalanin "Pre-Flight Checklist" internal. Kalau salah satu cek ini gagal, Playwright bakal nunggu dan nyoba lagi terus-terusan (selama **Timeout** bawaan 30 detik).

| Actionability Check | Deskripsi | Penyebab Gagal |
| --- | --- | --- |
| **Attached** | Elemen harus sudah ada di dalam **DOM**. | Elemen belum dirender sama **React** atau **Vue**. |
| **Visible** | Elemen harus kelihatan secara visual. | Masih kena `display: none` atau `visibility: hidden`. |
| **Stable** | Elemen harus diam (nggak gerak-gerak). | Animasi CSS atau transisi lagi jalan. |
| **Enabled** | Elemen nggak boleh dalam kondisi *disabled*. | Ada atribut `disabled` di tag HTML-nya. |
| **Receiving Events** | Elemen nggak boleh ketutup elemen lain. | Ketutup **overlay**, **modal**, atau **loading spinner**. |

![Actionability Checklist](/images/tutorials/playwright-actionability-checklist.png)

---

## 3. Kasus Nyata: Spinner yang Hilang

**Skenarionya:** Kamu klik "Submit". **Loading spinner** muncul sebentar, baru setelah itu pesan "Sukses" muncul.

### Cara Lama (Selenium)

Kamu harus nulis perintah **wait** manual buat setiap perubahan status:

```javascript
// Harus nunggu manual, ribet dan gampang gagal (flaky)
await driver.click('#submit');
await driver.wait(until.elementIsNotVisible(spinner)); // Tunggu spinner hilang
await driver.wait(until.elementIsVisible(successMsg)); // Tunggu pesan muncul
const text = await successMsg.getText();
```

### Cara Playwright

```javascript
await page.click('#submit');
// Playwright otomatis nunggu pesan suksesnya memenuhi kriteria 
// Attached, Visible, dan Stable secara otomatis.
const message = await page.locator('.success-msg').innerText();
```

> [!TIP]
> Di Playwright, kamu cukup nulis **apa** yang mau kamu lakuin. Mesin **Auto-Wait** bakal ngurusin masalah *timing* dan **Actionability** di balik layar.

---

## 4. Kenapa Ini Ngebasmi "Flaky Test"?

Karena Playwright punya koneksi langsung ke browser (ingat materi **Arsitektur**), dia nggak perlu menebak-nebak. Dia **tahu** persis kondisi elemennya secara *real-time*.

![Auto-Wait Engine Flow](/images/tutorials/playwright-autowait-flow.png)

| Keuntungan | Penjelasan |
| --- | --- |
| **No Manual Sleeps** | Kamu nggak butuh lagi `page.waitForTimeout(5000)` yang bikin tes jadi lambat. |
| **Akurasi Tinggi** | Kalau elemen siap dalam 5ms, dia langsung lanjut. Nggak ada waktu terbuang. |
| **Error Log Jelas** | Kalau gagal, dia kasih tahu cek mana yang nggak lulus (misal: "Element is hidden"). |

> [!CAUTION]
> Meskipun **Auto-Wait** itu otomatis buat aksi lewat **Locator**, fitur ini **TIDAK** berlaku buat eksekusi JavaScript mentah kayak `page.evaluate()`. Selalu prioritaskan pakai metode **Locator**.

---

## 5. Checklist Rangkuman

| Konsep | Poin Penting |
| --- | --- |
| **Actionability itu Otomatis** | Sudah aktif secara bawaan untuk setiap aksi **Locator**. |
| **5 Kriteria Utama** | **Attached**, **Visible**, **Stable**, **Enabled**, **Receiving Events**. |
| **Smart Waiting** | Nunggu sampai elemen siap atau sampai kena **Timeout** (30 detik). |

---

## 6. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi

* **[Auto-Waiting](https://playwright.dev/docs/actionability)**: Daftar lengkap aksi apa saja yang nungguin kriteria apa saja.
* **[Timeouts](https://playwright.dev/docs/test-timeouts)**: Cara kustomisasi batas waktu tunggu.

### Source Code

* **[ElementHandle Implementation](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/dom.ts)**: Intip gimana Playwright ngecek status DOM di level mesin.
