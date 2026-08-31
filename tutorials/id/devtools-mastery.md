---
title: 'Investigasi UI Sebelum Menulis Web Automation'
description: 'Gunakan DevTools dan alat investigasi Playwright untuk mengubah perilaku UI menjadi kontrak automation yang punya evidence jelas.'
---

## Setelah lesson ini, kamu bisa

- memeriksa DOM, informasi accessibility, dan perubahan state sebuah element;
- mengikuti satu user action dari UI, console log, network request, sampai browser event yang terjadi;
- membedakan informasi yang membantu debugging dengan hasil yang benar-benar menunjukkan bahwa expected result tercapai;
- membuat catatan singkat dari hasil pengecekan sebelum menulis test; serta
- memvalidasi locator, wait, dan asumsi yang digunakan berdasarkan informasi yang benar-benar terlihat di browser.


## Kenapa ini penting buat QA

Copy selector lalu langsung pakai di test memang kelihatan praktis. Tapi kadang selector tersebut menemukan lebih dari satu element, tiba-tiba rusak setelah UI berubah, atau click-nya berhasil tapi flow di belakangnya sebenarnya fail.

Kalau itu terjadi, jangan langsung ganti selector atau tambah delay. Cek dulu apa yang sebenarnya terjadi di browser:

- element mana yang benar-benar muncul;
- state sebelum dan sesudah action;
- network request dan response yang berjalan;
- error di console; serta
- event seperti navigation, popup, atau download.

Buat QA, DevTools membantu kita memahami masalah sebelum mulai memperbaiki test. Dari situ kita bisa menentukan apakah masalahnya ada di locator, timing, request, state halaman, atau memang bug di aplikasinya.

## Cara berpikir yang perlu kamu pegang

Gunakan flow sederhana ini saat investigasi:

```text
Coba flow-nya secara manual
    ↓
Cek element dan context-nya
    ↓
Lakukan satu action
    ↓
Lihat perubahan di UI dan informasi teknis yang terkait
    ↓
Tentukan apa yang perlu masuk ke automated test
```

Setiap bagian di DevTools membantu menjawab hal yang berbeda:

| Yang dicek                        | Apa yang bisa kita cari tahu                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Elements                          | Element, attribute, dan struktur DOM seperti apa yang ada saat ini?                                    |
| Accessibility                     | Role, accessible name, dan state apa yang dikenali browser?                                            |
| Console                           | Apakah ada JavaScript error atau log yang membantu menjelaskan masalah?                                |
| Network                           | Request apa yang dikirim, payload-nya apa, status response-nya berapa, dan apa response yang diterima? |
| Playwright UI Mode atau Inspector | Locator menemukan element apa, test sedang menunggu apa, dan apa yang terjadi di setiap step?          |

Network dan Console bisa membantu menjelaskan kenapa sebuah flow gagal. Tapi keduanya belum tentu cukup untuk memastikan expected result dari sisi user.

Misalnya, kalau yang ingin kita verify adalah **“user tahu bahwa profile berhasil disimpan”**, response `200` dari API saja belum cukup. UI juga harus memberikan hasil yang memang bisa dilihat atau dipahami oleh user.

## Coba kita bedah contoh nyata

Halaman profile punya button **“Save changes.”** Setelah data berhasil disimpan, user seharusnya melihat status **“Changes saved.”**

Test awalnya seperti ini:

```ts
await page.locator('#root > div:nth-child(2) > form > button').click();
await page.waitForTimeout(3000);
```

Test ini hanya melakukan click lalu menunggu. Kita belum benar-benar verify apakah perubahan berhasil disimpan.

Sebelum memperbaiki test-nya, cek dulu flow tersebut secara manual.

### 1. Cek element-nya

Lewat **Elements** dan informasi accessibility, pastikan:

* element tersebut memang dikenali sebagai `button`;
* accessible name-nya adalah **“Save changes”**;
* button menjadi `enabled` setelah ada perubahan data yang valid; dan
* button tersebut berada di form profile yang benar.

Nggak perlu copy seluruh DOM path. Catat saja informasi yang membantu kita menemukan element tersebut dengan jelas.

### 2. Cek perubahan state

Ubah satu field di profile, lalu klik button **“Save changes.”** Bandingkan state sebelum, saat proses, dan setelah action dilakukan:

```text
Sebelum: ada perubahan valid yang belum disimpan, button “Save changes” enabled,
         dan belum ada success message

Action: klik “Save changes”

Saat proses: button mungkin disabled selama request berjalan

Sesudah: muncul status “Changes saved”
```

### 3. Cek informasi pendukung

Di **Network**, cari request yang digunakan untuk update profile. Cek method, payload, status response, dan response yang diterima.

Kalau request fail, cek apakah UI juga menampilkan error ke user. Kalau request sudah selesai tapi UI nggak berubah, cek **Console** untuk melihat apakah ada JavaScript error.

Informasi ini membantu mempersempit penyebabnya:

* **nggak ada request:** action nggak mentrigger submit atau client-side validation menghentikan proses;
* **request fail:** cek request, test data, atau response dari server;
* **request success tapi nggak ada konfirmasi di UI:** cek flow setelah response diterima;
* **konfirmasi sudah muncul tapi test masih fail:** cek locator atau assertion.

### 4. Tentukan apa yang perlu masuk ke automated test

Setelah flow-nya jelas, test bisa ditulis seperti ini:

```ts
const saveButton = page.getByRole('button', { name: 'Save changes' });

await saveButton.click();
await expect(page.getByRole('status')).toHaveText('Changes saved');
```

Button dicari menggunakan role dan accessible name yang dikenali browser. Assertion kemudian verify hasil yang memang dilihat user, yaitu status **“Changes saved”**.
Network tetap berguna untuk debugging kalau test fail, tapi response `200` saja belum cukup untuk memastikan bahwa user mendapatkan expected result.

## Kapan pendekatan ini cocok dipakai?

Gunakan DevTools sebelum menulis automation untuk flow yang belum kamu kenal, saat locator-nya belum jelas, ketika state halaman sering berubah, atau ketika masalahnya bisa datang dari UI, request, response, maupun browser event.

Gunakan **Console** untuk pengecekan sederhana seperti:

```js
document.querySelectorAll('button').length;
document.activeElement;
document.querySelector('[aria-expanded="true"]');
```

Query seperti ini berguna untuk membantu memahami kondisi halaman. Tapi hasilnya belum tentu cocok langsung digunakan sebagai locator di Playwright.

Kalau test-nya sudah ada, beberapa tool Playwright ini bisa membantu:

* `npx playwright test --ui` untuk melihat setiap step dan membandingkan DOM snapshot;
* `npx playwright test --debug` untuk membuka Inspector dan menjalankan test step by step;
* `page.pause()` untuk berhenti sementara di bagian tertentu saat debugging;
* locator picker atau code generator untuk membantu mencari locator yang kemudian tetap perlu di-review; dan
* `npx playwright show-trace path/to/trace.zip` untuk memeriksa action, DOM snapshot, network activity, console message, source, dan log yang direkam setelah test dijalankan.

Locator dari code generator jangan langsung dipakai begitu saja. Cek dulu apakah locator tersebut benar-benar mengarah ke element yang dimaksud dan cukup stabil untuk digunakan di test.

Kalau memakai `page.pause()` saat debugging, hapus lagi sebelum test di-commit.

### Investigasi dengan agent-assisted workflow

Kelebihan Playwright bukan cuma ada di test API-nya. Playwright juga punya beberapa fitur yang bisa membantu QA maupun coding agent saat mengecek flow di browser dan debugging test.

`playwright-cli` adalah CLI terpisah dan optional yang memang dibuat untuk coding agent. Agent bisa menggunakannya untuk explore flow di browser, mengecek accessibility snapshot, Console, dan Network, mengambil screenshot atau trace, serta mencari locator yang sesuai.

Workflow ini bisa berjalan bareng dengan exploratory testing yang dilakukan QA. Saat agent menangani step yang repeatable dan membantu menyiapkan automation, QA bisa fokus mencari behavior yang membingungkan, visual issue, requirement yang belum jelas, atau risk yang belum tercakup di automation request.

Setelah itu, gabungkan hasil dari QA dan agent sebelum menentukan scope test dan apa saja yang perlu diverifikasi.

Playwright juga menyediakan Test Agents: `planner`, `generator`, dan `healer`. Plan, locator, wait, atau fix yang dihasilkan agent tetap perlu di-review. Pastikan hasilnya sesuai dengan product intent dan expected result yang memang ingin diverifikasi.

Nggak perlu membuka semua panel untuk setiap test. Mulai dari masalah yang ingin dicari, lalu gunakan bagian DevTools atau Playwright yang paling membantu menjawabnya.

## Kalau test fail, mulai cek dari mana?

Coba bayangin test untuk menyimpan profile mengalami timeout. Saat dicek manual, kamu menemukan:

* click pada button berhasil mengirim request;
* response-nya `422` dengan validation message;
* UI nggak menampilkan error; dan
* button kembali `enabled`.

Dalam kondisi seperti ini, menunggu lima detik lagi nggak akan membuat request menjadi success. Ganti locator juga nggak membantu karena button yang benar sebenarnya sudah berhasil diklik.

Yang lebih berguna adalah:

1. Cek payload request dan response body.
2. Pastikan apakah test data yang digunakan melanggar business rule.
3. Cek apakah UI seharusnya menampilkan validation message dari response tersebut.
4. Kalau masalahnya ada di test data, perbaiki setup test. Kalau UI seharusnya menampilkan error tapi nggak muncul, report sebagai bug.
5. Simpan informasi yang cukup di test report atau log supaya saat fail lagi kita bisa membedakan apakah masalahnya ada di test data atau aplikasi.

Menambah `waitForTimeout`, retry, atau mengabaikan response hanya akan membuat root cause lebih sulit ditemukan.

Kalau kamu mendapat test dari screenshot, requirement singkat, atau hasil generate, jangan langsung anggap semua asumsi di dalamnya benar. Cek dulu:

* Element apa yang sebenarnya ingin digunakan, dan bagaimana browser mengenalinya?
* Apakah locator dipilih berdasarkan informasi dari element atau cuma berdasarkan CSS styling?
* Kalau ada wait, sebenarnya test sedang menunggu apa: perubahan state, request, response, navigation, atau event lain?
* Apakah assertion benar-benar verify expected result, atau cuma memastikan action berhasil dilakukan?
* Apakah ada URL, response, status message, atau timing yang diasumsikan tanpa dicek langsung?
* Apa yang bisa dicek lewat DevTools untuk memastikan asumsi tersebut benar?

Kalau kesimpulannya masih cuma **“kayaknya code-nya jalan”**, berarti masih ada bagian yang perlu dicek.

## Coba cek pemahamanmu

Saat mencoba update profile secara manual, kamu melihat flow berikut:

```text
Klik “Save changes”
→ PATCH /api/profile mengembalikan 422
→ nggak ada error yang muncul di UI
→ button kembali enabled
```

Ada usulan untuk memperbaiki test dengan menambah sleep lima detik dan memastikan URL tetap sama.

Coba jawab:

1. Dari flow di atas, bagian mana yang sudah kita tahu benar-benar terjadi, dan bagian mana yang masih perlu dikonfirmasi ke requirement?
2. Apa yang perlu kamu cek berikutnya di DevTools?
3. Kenapa menambah sleep dan mengecek URL belum cukup untuk verify expected result?
4. Setelah requirement-nya jelas, kemungkinan masalahnya ada di test setup atau memang bug di aplikasi?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Request berhasil dikirim, response-nya `422`, error nggak muncul di UI, dan button kembali `enabled`. Itu semua sudah kita lihat langsung. Yang masih perlu dikonfirmasi adalah apakah test data tersebut seharusnya valid dan bagaimana UI seharusnya menangani response `422`.
* Cek payload, response body, test data yang dikirim, error di Console, serta apakah ada error message atau status di DOM.
* Menambah sleep cuma membuat test menunggu lebih lama sebelum mendapatkan hasil yang sama. URL yang tetap sama juga belum membuktikan apakah profile berhasil disimpan atau user mendapatkan feedback yang benar.
* Kalau test data-nya memang nggak valid, perbaiki setup test lalu verify expected result yang benar. Kalau datanya valid atau UI seharusnya menampilkan error dari response tersebut, report bug di API atau UI sesuai root cause yang ditemukan.

Yang penting, cari tahu dulu penyebab test fail sebelum mengubah code test.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa mengikuti satu user action dari awal sampai akhir, mengecek element dan context-nya, membandingkan state sebelum dan setelah action, serta menggunakan Network dan Console untuk membantu mencari penyebab saat flow gagal.

Dengan ini, Module 2 selesai.

Di Module 3, kita akan mulai menjalankan test Playwright. Sebelum masuk ke code, kamu sekarang sudah punya dasar untuk menentukan element apa yang perlu ditemukan, state apa yang harus berubah, dan expected result apa yang perlu diverifikasi.
