---
title: 'Sinkronkan Navigasi dan One-Time Browser Event'
description: 'Ikuti outcome di route, popup, download, dialog, dan frame tanpa membuat race dari urutan event.'
---

## Setelah lesson ini, kamu bisa

- memilih observable evidence untuk full navigation, client-side routing, dan same-page update;
- menangkap popup atau download dengan mendaftarkan wait sebelum triggering action;
- menangani browser dialog tanpa membuat page berhenti;
- mengenali iframe sebagai document context yang terpisah; serta
- mendiagnosis test yang menunggu di browser surface yang salah.

## Kenapa ini penting buat QA

Pernah nggak sih kamu melakukan click di satu page, tapi hasilnya justru muncul di tempat lain?

“Open invoice” bisa melakukan navigation di tab yang sama, membuka tab baru, atau men-download PDF. “Delete account” bisa menampilkan browser confirmation dialog. Payment form juga bisa berada di iframe milik service lain.

Kalau test salah menebak surface, timeout sebesar apa pun nggak akan membuatnya benar. Test mungkin menunggu heading di original page, padahal heading aslinya ada di popup. Atau test baru mulai mendengarkan download setelah download-nya sudah dimulai.

Skill QA yang dibutuhkan di sini bukan menghafal lima API. Kita perlu mengenali di mana product behavior bisa diamati, lalu mengatur urutan test supaya one-time signal nggak terlewat.

## Cara berpikir yang perlu kamu pegang

Klasifikasikan outcome lebih dulu:

```text
Trigger sebuah action
      ↓
Outcome muncul di mana?
      ├─ Current page state atau URL → act, lalu pakai retried assertion
      ├─ One-time event              → register promise/handler, lalu act
      └─ Separate document context   → masuk ke page/frame, lalu locate normal
```

Untuk one-time event, urutannya penting:

![Event pattern yang andal mendaftarkan promise sebelum trigger, sedangkan trigger lebih dulu bisa kehilangan popup atau download yang cepat.](/images/tutorials/event-listener-before-trigger.svg)

_Buat event promise lebih dulu, tapi baru await setelah action yang menghasilkan event dijalankan._

Memulai dengan code ini salah:

```ts
const download = await page.waitForEvent('download');
await page.getByRole('button', { name: 'Export' }).click();
```

Baris pertama menunggu event yang belum dipicu oleh baris kedua. Akibatnya, click tidak pernah dijalankan.

Melakukan trigger dulu lalu mendaftarkan event belakangan juga berisiko, karena event yang cepat bisa terjadi di antara kedua baris.

## Coba kita bedah contoh nyata

Order history page punya beberapa invoice behavior:

- memilih Order history mengubah current route;
- Open invoice membuka HTML invoice di tab baru; dan
- Download PDF menghasilkan download.

Ada juga action Cancel order yang membuka browser confirmation dialog.

### 1. Sinkronkan current-page navigation dengan user evidence

```ts
await page.getByRole('link', { name: 'Order history' }).click();

await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

Full document navigation dan client-side route bisa terlihat sama bagi user. `toHaveURL()` melakukan retry sampai URL cocok, sedangkan heading membuktikan route sudah menampilkan meaningful content. Pilih evidence sesuai requirement—kadang heading sudah cukup, sedangkan routing requirement mungkin membutuhkan keduanya.

Jangan menunggu generic load state lalu menganggap feature sudah ready. Browser bisa selesai load sebelum application data muncul, sedangkan single-page application bisa update tanpa document load baru.

### 2. Tangkap popup tanpa race

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await popupPromise;

await expect(invoicePage).toHaveURL(/\/invoices\/1042$/);
await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

`popupPromise` mulai mengamati sebelum click. Test menunggu `Page` baru setelah action, lalu memakai locator dan assertion normal di page tersebut.

Kalau aplikasi bisa membuat page baru yang tidak terikat khusus dengan current page, browser-context page event mungkin punya scope yang lebih tepat. Pilih event source paling sempit yang sesuai dengan product behavior.

### 3. Tangkap dan periksa download

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download PDF' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('invoice-1042.pdf');
await download.saveAs('artifacts/invoice-1042.pdf');
```

Event membuktikan download dimulai. Filename assertion memverifikasi satu user-relevant property. Kalau file content membawa risk utama, inspect dengan parser atau downstream check yang sesuai. Hanya memanggil `saveAs()` belum membuktikan file berisi invoice yang benar.

Downloaded file bersifat temporary untuk browser context kecuali disimpan di lokasi lain. Gunakan artifact location yang eksplisit di real project dan jangan commit output yang sensitif.

### 4. Tangani dialog sebelum trigger

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('Cancel order 1042?');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Cancel order' }).click();
await expect(page.getByRole('status')).toHaveText('Order cancelled');
```

Playwright otomatis men-dismiss dialog kalau tidak ada listener. Setelah dialog listener didaftarkan, listener itu wajib melakukan accept atau dismiss. Kalau tidak, page tetap blocked dan triggering action bisa hang.

Dialog assertion membuktikan confirmation yang benar muncul. Final status membuktikan action yang diterima menghasilkan application outcome.

### 5. Lewati frame boundary dengan sengaja

Iframe bukan one-time event. Iframe adalah document lain yang ditanam di page:

```ts
const paymentFrame = page.frameLocator('[title="Secure payment"]');

await paymentFrame.getByLabel('Card number').fill('4242 4242 4242 4242');
```

Setelah masuk ke frame context, gunakan semantic locator strategy yang sama seperti di main page. Jangan menambah `frameLocator()` hanya karena control sulit ditemukan. Pastikan lewat DevTools bahwa control benar-benar ada di iframe, lalu pilih frame title atau kontrak stabil lain yang bermakna.

## Kapan pendekatan ini cocok dipakai?

Gunakan retried URL atau UI assertion saat result muncul di current page. Nggak perlu mengatur load event secara manual kalau user-visible state sudah menjelaskan readiness dengan lebih baik.

Gunakan `waitForEvent('popup')` atau `waitForEvent('download')` saat one-time browser event memang bagian skenario. Mulai promise sebelum trigger, lalu await sesudahnya.

Gunakan dialog handler hanya saat test perlu mengontrol atau inspect native browser dialog. Application-styled modal adalah regular DOM element; cari dengan dialog role lalu interact secara normal.

Gunakan `frameLocator()` hanya setelah iframe boundary dikonfirmasi. New tab adalah `Page`, bukan frame. Native browser dialog juga bukan keduanya.

File upload bukan download event. `setInputFiles()` berinteraksi dengan file input, lalu aplikasi perlu menampilkan observable validation atau uploaded state. Focused upload exercise dipetakan sebagai Additional Practice di lesson pertama.

Hindari `waitForLoadState('networkidle')` sebagai generic readiness shortcut. Pilih route, heading, status, atau control state yang benar-benar dijanjikan skenario.

## Kalau gagal, mulai cek dari mana?

Saat post-action wait timeout, petakan product behavior sebelum mengubah timing:

1. Apakah action meng-update current page, melakukan navigation, membuka popup, atau memulai download?
2. Apakah event promise atau dialog handler sudah didaftarkan sebelum trigger?
3. Apakah promise tidak sengaja di-await sebelum trigger dijalankan?
4. Apakah locator dan assertion memakai `Page` baru atau original page?
5. Apakah target ada di iframe dan frame yang dimasuki sudah benar?
6. Apakah dialog listener lupa melakukan accept atau dismiss?
7. Apakah event sebenarnya terjadi tetapi business assertion setelahnya gagal?

Gunakan trace dan screenshot untuk melihat surface yang ada setelah action. Untuk download, inspect failure information dan suggested filename. Untuk popup, inspect semua page di context. Untuk frame, inspect frame URL dan title sebagai diagnostic clue saja; final locator tetap harus terikat ke maintainable contract.

## Review hasil buatan AI

Review generated navigation dan event code dengan pertanyaan berikut:

- Apakah code mengenali surface tempat outcome muncul?
- Apakah setiap one-time event promise dibuat sebelum triggering action?
- Apakah promise di-await sesudah action, bukan sebelumnya?
- Apakah popup assertion dijalankan pada popup `Page`?
- Apakah dialog handler selalu melakukan accept atau dismiss?
- Apakah application modal tertukar dengan native dialog?
- Apakah `networkidle` dipakai sebagai generic readiness guess?
- Apakah download memeriksa meaningful evidence, bukan cuma memanggil `saveAs()`?
- Apakah iframe boundary sudah dikonfirmasi, bukan hanya diasumsikan?
- Apakah ada assertion untuk business result setelah browser event?

AI sering menghasilkan API yang benar dalam urutan yang salah. Event ordering dan surface ownership tetap menjadi tanggung jawab reviewer.

## Coba cek pemahamanmu

Review generated invoice test ini:

```ts
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await page.waitForEvent('popup');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Invoice 1042')).toBeVisible();
```

Link tersebut langsung membuka tab baru, lalu tab itu merender heading bernama Invoice 1042.

Jelaskan:

1. Race-nya ada di mana?
2. Baris mana yang menunggu di page yang salah?
3. Bagaimana urutan promise, trigger, dan new-page assertion yang benar?
4. Observable condition apa yang perlu menggantikan generic network idle?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await popupPromise;

await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

Event observation dimulai sebelum trigger, `Page` baru ditangkap sesudahnya, dan assertion berjalan di surface yang memiliki invoice. Heading—bukan network silence—menjelaskan user-visible readiness yang dibutuhkan skenario.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mengklasifikasikan outcome berdasarkan browser surface, mengurutkan one-time event wait dengan aman, dan membedakan new page, native dialog, download, serta iframe.

Lesson ini tidak punya Core Practice terpisah karena standalone playground saat ini belum bisa melatih popup dan download event ordering secara akurat. Iframe drill tetap menjadi Additional Practice. Completion Module 5 ditentukan oleh dua Core Practice sebelumnya: deliberate state-based action dan observable outcome synchronization.
