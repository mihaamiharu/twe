---
title: 'Investigasi UI Sebelum Menulis Web Automation'
description: 'Gunakan DevTools dan alat investigasi Playwright untuk mengubah perilaku UI menjadi kontrak automation yang punya evidence jelas.'
---

## Setelah lesson ini, kamu bisa

- memeriksa DOM aktif, informasi aksesibilitas, dan perubahan state sebuah kontrol;
- menelusuri satu aksi pengguna lewat UI yang terlihat, pesan console, request, dan browser event;
- membedakan bukti untuk diagnosis dengan bukti yang benar-benar membuktikan outcome pengguna;
- membuat catatan investigasi singkat sebelum menulis test; serta
- menguji locator, wait, dan asumsi yang diusulkan dengan bukti dari browser.

## Kenapa ini penting buat QA

Menyalin selector lalu menempelkannya ke test memang terasa cepat—sampai selector itu menemukan dua kontrol, rusak setelah redesign, atau berhasil mengklik sementara request aplikasinya gagal.

Kalau sudah begitu, menambah selector lain atau memperpanjang delay masih sama-sama menebak. Padahal browser sudah punya bukti yang lebih berguna:

- elemen aktif dan informasi aksesibilitas yang dihitung browser;
- state sebelum dan sesudah aksi;
- request dan response di balik transisi;
- error di console; serta
- event seperti navigation, popup, atau download.

DevTools bukan cuma alat untuk developer. Buat QA, DevTools adalah tempat kita mengubah pengamatan yang masih kabur menjadi penjelasan yang bisa diuji.

## Cara berpikir yang perlu kamu pegang

Gunakan siklus bukti berikut:

```text
Amati secara manual
    ↓
Periksa kontrol dan konteksnya
    ↓
Lakukan satu aksi
    ↓
Bandingkan state UI dan bukti teknis pendukung
    ↓
Tulis kontrak automation terkecil yang berguna
```

Setiap sumber bukti menjawab pertanyaan yang berbeda:

| Sumber bukti                      | Pertanyaan yang bisa dijawab                                                |
| --------------------------------- | --------------------------------------------------------------------------- |
| Elements                          | Node, atribut, dan hubungan apa yang ada di DOM aktif?                      |
| Informasi aksesibilitas           | Role, accessible name, dan state apa yang diberikan browser?                |
| Console                           | Apakah halaman mencatat error JavaScript atau pesan diagnosis yang berguna? |
| Network                           | Request apa yang berjalan, dengan payload, status, dan response apa?        |
| Playwright UI Mode atau Inspector | Apa yang ditemukan, ditunggu, dan diamati test pada setiap langkah?         |

Bukti dari Network dan Console bisa menjelaskan kenapa transisi UI gagal. Namun, bukti tersebut nggak otomatis menggantikan outcome yang perlu dilihat pengguna. Kalau risikonya adalah “pengguna nggak tahu profilnya sudah tersimpan,” response `200` saja belum membuktikan keberhasilan.

## Coba kita bedah contoh nyata

Halaman profil punya button “Save changes.” Setelah penyimpanan berhasil, pengguna seharusnya melihat “Changes saved.” Test awalnya terlihat seperti ini:

```ts
await page.locator('#root > div:nth-child(2) > form > button').click();
await page.waitForTimeout(3000);
```

Test tersebut mengklik lalu menunggu, tetapi nggak membuktikan apa pun. Sebelum memperbaiki kodenya, investigasi alurnya secara manual.

### 1. Periksa kontrolnya

Di **Elements** dan informasi aksesibilitasnya, pastikan:

- kontrol tersebut memang button;
- accessible name-nya adalah “Save changes”;
- button enabled setelah ada perubahan data yang valid;
- form pembungkusnya adalah form profil, bukan form lain di halaman.

Jangan menyalin jalur DOM lengkap. Catat makna yang kamu temukan.

### 2. Amati transisinya

Ubah satu field profil lalu klik button satu kali. Bandingkan kondisi sebelum dan sesudah:

```text
Sebelum: ada perubahan valid yang belum disimpan, button “Save changes” enabled,
         dan belum ada status sukses
Aksi: aktifkan “Save changes”
Saat proses: button mungkin disabled selama request berjalan
Sesudah: status yang terlihat menampilkan “Changes saved”
```

### 3. Gunakan bukti pendukung

Di **Network**, temukan request untuk memperbarui profil. Periksa method, payload, status, dan response. Kalau response-nya error, cek apakah halaman menjelaskan kegagalan tersebut kepada pengguna. Periksa **Console** kalau UI nggak pernah berubah dan mungkin ada exception.

Bukti ini membantu mengelompokkan penyebabnya:

- nggak ada request: action atau validasi di sisi client mungkin mencegah submit;
- response gagal: periksa request, data, atau perilaku server;
- response sukses tetapi nggak ada konfirmasi: periksa transisi UI;
- konfirmasi terlihat tetapi test gagal: periksa locator atau assertion.

### 4. Tentukan kontrak automation-nya

Sekarang tujuan test bisa ditulis dengan jelas:

```ts
const saveButton = page.getByRole('button', { name: 'Save changes' });

await saveButton.click();
await expect(page.getByRole('status')).toHaveText('Changes saved');
```

Locator button mengikuti identitas yang dipahami pengguna. Assertion membuktikan outcome yang diterima pengguna. Request di Network tetap menjadi bukti diagnosis yang berguna, tetapi bukan satu-satunya bukti keberhasilan.

## Kapan pendekatan ini cocok dipakai?

Gunakan DevTools browser sebelum menulis automation untuk alur yang belum kamu kenal, saat identitas kontrol kurang jelas, ketika state berubah secara dinamis, atau ketika kegagalan bisa berasal dari UI, request, response, maupun browser event.

Gunakan **Console** untuk investigasi kecil seperti:

```js
document.querySelectorAll('button').length;
document.activeElement;
document.querySelector('[aria-expanded="true"]');
```

Query tersebut membantu memeriksa halaman. Hasilnya belum tentu menjadi locator yang perlu disimpan di test Playwright.

Kalau test-nya sudah ada, gunakan alat Playwright berikut:

- `npx playwright test --ui` untuk melihat langkah test dan membandingkan DOM snapshot;
- `npx playwright test --debug` untuk membuka Inspector dan menjalankan action langkah demi langkah;
- `page.pause()` sebagai breakpoint lokal sementara pada titik tertentu; serta
- locator picker atau code generator untuk mengusulkan locator yang masih perlu di-review.

Locator hasil generate adalah hipotesis yang berguna. Simpan hanya kalau kamu bisa menjelaskan kenapa locator itu mewakili makna produk yang stabil. Hapus `page.pause()` sementara sebelum test di-commit.

Nggak perlu membuka semua panel untuk setiap test sederhana. Mulai dari risikonya, lalu buka sumber bukti yang bisa menjawab pertanyaan berikutnya.

## Kalau gagal, mulai cek dari mana?

Coba bayangin sebuah test penyimpanan mengalami timeout. Saat investigasi manual, kamu melihat:

- klik button memulai request;
- response-nya `422` dengan pesan validasi;
- UI nggak menampilkan error; dan
- button kembali enabled.

Menunggu lima detik lagi nggak akan mengubah response tersebut menjadi sukses. Mengganti locator juga nggak membantu karena kontrol yang benar sudah berhasil diaktifkan.

Langkah berikutnya yang lebih berguna:

1. Periksa payload request dan response body.
2. Pastikan apakah test data melanggar business rule yang sudah diketahui.
3. Periksa apakah produk seharusnya menampilkan pesan validasi dari response.
4. Perbaiki datanya kalau setup test yang salah, atau laporkan feedback pengguna yang hilang kalau produknya yang salah.
5. Simpan bukti yang cukup supaya dua penyebab tersebut bisa dibedakan pada run berikutnya.

Jalan pintas seperti `waitForTimeout`, retry tambahan, atau mengabaikan response hanya membuat diagnosis lebih lama.

Sebelum menerima test yang diusulkan dari screenshot atau requirement singkat, tanyakan:

- Elemen aktif dan accessible identity apa yang diasumsikan?
- Apakah selector dipilih dari styling atau dari makna produk?
- Apakah wait-nya berhubungan dengan state, request, atau event yang bisa diamati?
- Apakah assertion membuktikan outcome pengguna atau hanya membuktikan klik terjadi?
- Apakah usulan tersebut mengasumsikan URL, response, status message, atau aturan timing tanpa bukti?
- Bukti DevTools apa yang bisa mengonfirmasi atau membantah setiap asumsi?

Kalau jawabannya masih “sepertinya kodenya bekerja,” investigasinya belum selesai.

## Coba cek pemahamanmu

Kamu mengirim perubahan profil yang valid secara manual dan melihat urutan berikut:

```text
Klik “Save changes”
→ PATCH /api/profile mengembalikan 422
→ nggak ada error yang terlihat
→ button kembali enabled
```

Usulan perbaikan test menambah sleep selama lima detik dan memeriksa bahwa URL nggak berubah.

Coba jelaskan:

1. Pengamatan mana yang sudah menjadi fakta dan ekspektasi produk mana yang masih perlu dikonfirmasi?
2. Bukti apa yang akan kamu periksa berikutnya?
3. Kenapa sleep dan pemeriksaan URL nggak membuktikan outcome yang diharapkan?
4. Defect atau masalah setup apa yang mungkin kamu laporkan setelah requirement-nya dikonfirmasi?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Request, response `422`, error yang nggak terlihat, dan button yang kembali enabled adalah fakta hasil pengamatan. Apakah datanya seharusnya diterima dan error apa yang perlu ditampilkan UI harus dikonfirmasi ke business rule produk.
- Periksa payload, response body, test data yang dikirim, Console, dan region status atau error di DOM aktif.
- Sleep hanya menunda kegagalan yang sama. URL yang nggak berubah juga nggak menjelaskan apakah profil tersimpan atau apakah pengguna menerima feedback yang berguna.
- Kalau datanya tidak valid, perbaiki setup lalu buktikan outcome yang benar. Kalau datanya valid atau error response seharusnya ditampilkan, laporkan defect API atau UI yang sesuai beserta buktinya.

Kuncinya adalah mengelompokkan penyebab kegagalan sebelum mengubah kode test.

## Sebelum lanjut

Kamu sekarang seharusnya bisa menginvestigasi satu aksi pengguna, mencatat identitas dan konteks kontrol, membandingkan state sebelum dan sesudah, serta memakai bukti Network atau Console untuk menjelaskan kegagalan.

Dengan ini, Modul 2 selesai. Kamu siap menjalankan test Playwright pertama di Modul 3 karena sekarang kamu sudah bisa menjelaskan apa yang perlu ditemukan test, state apa yang harus berubah, dan bukti mana yang membuat hasilnya bermakna.
