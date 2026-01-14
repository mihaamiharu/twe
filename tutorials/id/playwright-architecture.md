---
title: 'Arsitektur Playwright'
description: 'Memahami komunikasi langsung dan model proses yang bikin otomatisasi jadi ngebut.'
---

## 1. Jembatan Komunikasi: CDP vs. WebDriver

Perbedaan paling mendasar antara Playwright dan alat-alat "sepuh" (kayak Selenium) adalah cara mereka ngobrol sama browser.

### Cara Lama: WebDriver (Si Makelar)

Alat lama pake WebDriver—sebuah *software* terpisah yang tugasnya jadi penerjemah. Kode kamu ngirim perintah ke WebDriver, diterjemahin buat browser, baru deh browser kasih respon balik.

**Masalahnya:** Proses terjemahan ini makan waktu. Plus, WebDriver itu agak "buta" sama apa yang sebenernya lagi terjadi di dalem browser. Dia nggak tau pasti apakah halaman beneran udah kelar *loading* atau ada *request* jaringan yang masih nyangkut.

### Cara Playwright: Jalur Langsung (CDP)

Playwright pake **Chrome DevTools Protocol (CDP)** dan protokol serupa buat Firefox dan WebKit. Dia ngobrol **langsung** sama "otak" mesin browser.

**Keuntungannya:** Playwright punya "Jalur VIP". Dia bisa dengerin setiap kejadian internal browser secara *real-time*. Dia tau persis kapan elemen muncul, kapan internet lagi sibuk, dan kapan halaman beneran siap. Makanya Playwright jauh lebih cepet dan nggak gampang *error* (stabil).

![WebDriver vs Playwright CDP Comparison](/images/tutorials/playwright-cdp-vs-webdriver-1.png)

> [!NOTE]
> CDP itu protokol yang sama yang dipake Chrome DevTools pas kamu klik kanan > Inspect. Jadi, Playwright itu sebenernya kayak DevTools yang dikasih nyawa supaya bisa jalan otomatis!

---

## 2. Dukungan Multi-Engine

Playwright nggak cuma "pura-pura" jadi browser lain. Dia dateng satu paket sama mesin *open-source* aslinya:

| Engine | Browser | Kegunaan |
| --- | --- | --- |
| **Chromium** | Google Chrome, Microsoft Edge | Paling umum, standar buat testing desktop. |
| **Firefox** | Mozilla Firefox | Buat mastiin fitur jalan di mesin Mozilla. |
| **WebKit** | Apple Safari | Penting banget buat ngecek kecocokan di iOS/macOS. |

Karena Playwright ngontrol mesinnya langsung, kamu bisa ngetes aplikasi kamu di Safari (WebKit) atau Edge (Chromium) langsung dari Windows atau Linux tanpa harus punya perangkat aslinya.

> [!TIP]
> Kamu nggak perlu pusing *install* browser manual. Playwright bakal ngurusin semuanya lewat perintah: `npx playwright install`.

---

## 3. Model Efisiensi: Browser Contexts

Di *tools* lama, setiap satu tes biasanya harus buka satu aplikasi browser baru. Ini ibarat kamu beli mobil baru cuma buat pergi ke minimarket depan komplek—boros bensin (memori) dan lama nyalainnya.

Playwright ngenalin konsep **Browser Contexts**.

![Browser Instance and Context Hierarchy](/images/tutorials/playwright-browser-contexts-1.png)

```javascript
// Satu browser terbuka, tapi banyak sesi terpisah
const browser = await chromium.launch();

const userA = await browser.newContext(); // Sesi A (Bersih)
const userB = await browser.newContext(); // Sesi B (Terisolasi)

const pageA = await userA.newPage();
const pageB = await userB.newPage();
```

| Konsep | Analogi | Kecepatan |
| --- | --- | --- |
| **Browser Instance** | Aplikasi fisik (`chrome.exe`) | Butuh detik buat buka. |
| **Browser Context** | Jendela Incognito di dalem browser | Cuma butuh milidetik (ngebut!). |

**Keuntungannya:** Tiap tes dapet "kamar" (Context) sendiri. Artinya, *cookies* atau *cache* dari Tes A nggak bakal bocor ke Tes B. Bikin Context itu secepat kilat, jadi kamu bisa jalanin ratusan tes secara paralel tanpa bikin komputer *ngos-ngosan*.

---

## 4. Hubungan Client-Server

Biarpun rasanya kode kamu jalan "di dalem" browser, aslinya mereka itu dua proses yang pisah:

| Komponen | Deskripsi |
| --- | --- |
| **Client** | *Script* Node.js kamu (tempat kode JavaScript kamu hidup). |
| **Server** | Playwright Driver yang megang kendali Mesin Browser. |

Pas kamu nulis `await page.click()`, *Client* kamu ngirim sinyal ke *Server*. *Server* ngejalanin kliknya di browser, terus lapor balik ke *Client*: "Selesai!".

![Client-Server Communication Bridge](/images/tutorials/playwright-client-server-1.png)

> [!CAUTION]
> Inilah alasan kenapa kita butuh banget **`async/await`**. Kita lagi nungguin sinyal itu "jalan-jalan" antar proses. Kalau lupa `await`, tes kamu bakal langsung kelar padahal browsernya baru aja mau mulai gerak!

---

## 5. Checklist Rangkuman

| Konsep | Poin Penting |
| --- | --- |
| **Kendali Langsung** | Ngomong langsung ke otak browser tanpa makelar (WebDriver). |
| **Contexts > Instances** | Pake sesi "Incognito" biar tes kenceng, bersih, dan hemat RAM. |
| **Engine Native** | Tes beneran lawan mesin Chromium, Firefox, dan WebKit asli. |

---

## 6. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi

* **[Browser Contexts](https://playwright.dev/docs/browser-contexts)**: Cara ngatur sesi, *permissions*, dan isolasi tes.
* **[Chrome DevTools Protocol (CDP)](https://playwright.dev/docs/api/class-cdpsession)**: Buat kamu yang pengen ngulik fitur rahasia browser lebih dalem.

### Intip Kode Sumber (Open Source)

Karena Playwright itu open source, kamu bisa liat "kabel-kabelnya" di GitHub:

* **[The Server Logic](https://github.com/microsoft/playwright/tree/main/packages/playwright-core/src/server)**: Liat gimana mereka bikin implementasi buat tiap browser.

---
