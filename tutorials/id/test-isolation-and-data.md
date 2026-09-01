---
title: 'Siapkan Starting State yang Terkontrol'
description: 'Atur test data, login state, dependency, dan cleanup supaya setiap test mulai dari kondisi yang jelas dan tetap aman saat dijalankan secara parallel.'
---

## Setelah lesson ini, kamu bisa

- menentukan semua kondisi yang harus sudah siap sebelum test dijalankan;
- memilih setup lewat UI, API, atau test utility sesuai dengan kebutuhan scenario;
- menentukan cara menyiapkan authentication state untuk read-only test dan test yang mengubah data;
- menggunakan network mocking tanpa melewatkan integration yang memang ingin diuji; serta
- mengatur test data dan cleanup supaya test tetap aman saat dijalankan secara parallel.

## Kenapa ini penting buat QA

Pernah nggak sih test kelihatannya fail saat action pertama dijalankan, padahal masalahnya sudah terjadi dari setup sebelumnya?

Misalnya customer ternyata sudah punya order, account yang sama diubah oleh test lain, authentication state sudah expired, atau cleanup dari run sebelumnya nggak selesai.

Locator dan assertion di test tersebut mungkin sebenarnya sudah benar. Masalahnya, kondisi awal yang dibutuhkan oleh scenario belum benar-benar disiapkan atau dikontrol.

Saat manual testing, kita biasanya punya precondition yang jelas: gunakan customer baru, siapkan produk yang available, atau pastikan belum ada order.

Di automation, precondition seperti ini perlu dibuat menjadi setup yang repeatable. Jangan mengandalkan environment kebetulan sedang berada di kondisi yang benar.

## Cara berpikir yang perlu kamu pegang

Starting state yang reliable biasanya terdiri dari beberapa hal:

```text
Reliable scenario
    = browser session yang terpisah
    + test data yang dikontrol
    + authentication yang jelas
    + external dependency yang sesuai
    + cleanup yang aman
```

Setiap bagian perlu dipikirkan secara terpisah. Browser context baru memang memisahkan session di browser, tapi data yang dibuat oleh test tetap ada di backend sampai test tersebut membersihkan atau mengelolanya dengan benar.

Saat menyiapkan starting state, cek beberapa hal ini:

| Yang perlu ditentukan                        | Contoh                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| Data apa yang dibuat untuk test?             | Satu order khusus untuk test ini                             |
| Bagaimana data dibuat?                       | Lewat test API sebelum UI interaction                        |
| Account mana yang digunakan?                 | Customer account yang tidak dipakai bersamaan oleh test lain |
| Dependency mana yang tetap real?             | Order service tetap real, notification service di-mock       |
| Cleanup apa yang dibutuhkan?                 | Hapus order berdasarkan ID yang dibuat saat setup            |
| Data apa yang bisa bentrok dengan test lain? | Account preference atau fixed order reference                |

Cara menyiapkan state tetap harus mengikuti hal yang ingin diuji.

Setup lewat UI nggak otomatis lebih baik atau lebih realistis. Kalau UI bukan bagian dari behavior yang ingin diuji, setup lewat API atau test utility bisa lebih cepat, lebih jelas, dan lebih reliable.

## Coba kita bedah contoh nyata

Requirement-nya adalah:

> Customer bisa cancel submitted order miliknya sendiri dan melihat status order berubah menjadi canceled.

Behavior yang ingin diuji dimulai dari order detail page.

Register user, login, browsing product, dan menyelesaikan checkout adalah behavior lain. Kalau semuanya diulang di cancellation test, test jadi lebih panjang, lebih lambat, dan ketika fail root cause-nya lebih sulit diketahui.

### 1. Tentukan starting state lebih dulu

```text
Test data: satu submitted order milik customer yang digunakan test
Cara membuat data: lewat test API
Authentication: customer account yang tidak dipakai bersamaan oleh test lain
External dependency: order service tetap real; notification delivery tidak diuji
Cleanup: hapus hanya order yang dibuat oleh test berdasarkan returned ID
Risiko saat parallel: account dan order reference tidak boleh dipakai bersama oleh test lain
```

### 2. Siapkan hanya data yang dibutuhkan oleh scenario

```ts
test('customer cancels an owned order', async ({ page, request }) => {
  // Request client punya scope test, tapi order yang dibuat tetap tersimpan di backend.
  const response = await request.post('/api/test/orders', {
    data: { status: 'submitted', owner: 'current-test-customer' },
  });

  expect(response.ok()).toBe(true);

  const order: { id: string; reference: string } = await response.json();

  try {
    await page.goto(`/orders/${order.id}`);

    await expect(
      page.getByRole('heading', { name: `Order ${order.reference}` }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Cancel order' }).click();

    await expect(page.getByRole('status')).toHaveText('Order canceled');
  } finally {
    const cleanupResponse = await request.delete(
      `/api/test/orders/${order.id}`,
    );

    expect(cleanupResponse.ok() || cleanupResponse.status() === 404).toBe(true);
  }
});
```

Cek dulu apakah setup API berhasil sebelum menggunakan data dari response-nya.

Gunakan `order.id` dari hasil setup untuk membuka order yang tepat dan menghapus record yang sama di dalam `finally`. Cleanup menerima response sukses atau `404` supaya tetap aman kalau order sudah lebih dulu terhapus.

Pendekatan ini cocok kalau project memang sudah punya test API atau helper yang dibuat khusus untuk menyiapkan data automation.

Pastikan endpoint atau helper tersebut memang disediakan dan diotorisasi untuk testing. Jangan membuat undocumented backdoor di production hanya supaya setup test lebih cepat.

### 3. Pilih cara login sesuai dengan data yang akan diubah

Reuse authentication state bisa mempercepat setup, tapi account yang digunakan tetap memakai data yang sama di backend.

| Scenario                                            | Pendekatan yang lebih aman                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| Public atau signed-out behavior                     | Mulai tanpa authentication state                                            |
| Banyak read-only test menggunakan account yang sama | Gunakan kembali storage state yang sudah disiapkan                          |
| Test mengubah account atau data di backend          | Gunakan account berbeda untuk setiap worker atau test                       |
| Satu scenario membutuhkan beberapa role             | Gunakan browser context dan authentication state terpisah untuk setiap role |
| Login adalah behavior yang sedang diuji             | Jalankan real sign-in flow di scenario tersebut                             |

File authentication state bisa berisi cookie atau credential yang memungkinkan seseorang menggunakan session test account.

Jangan commit file seperti `playwright/.auth/user.json` ke repository. Simpan dengan aman dan buat ulang kalau session-nya sudah expired.

### 4. Gunakan network mocking hanya kalau memang dibutuhkan

Misalnya aplikasi harus menampilkan fallback ketika recommendation service sedang unavailable. Kita bisa mengontrol response menjadi `503`:

```ts
await page.route('**/api/recommendations', async (route) => {
  await route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Unavailable' }),
  });
});

await page.goto('/store');

await expect(page.getByRole('status')).toHaveText(
  'Recommendations are temporarily unavailable',
);
```

Pasang `page.route()` sebelum request tersebut dikirim.

Mock seperti ini berguna ketika kita memang ingin menguji bagaimana aplikasi merespons kondisi tertentu yang sulit dibuat secara konsisten di environment.

Tapi jangan mock service yang sebenarnya menjadi bagian penting dari integration yang sedang diuji.

Misalnya, checkout test dengan payment service yang sepenuhnya di-mock tidak bisa memastikan integration dengan real payment service benar-benar bekerja.

Gunakan mock sesuai kebutuhan scenario, dan tetap punya test lain untuk integration yang memang perlu diuji secara real.

### 5. Cleanup hanya data yang dibuat oleh test

Saat cleanup, gunakan ID atau reference dari data yang memang dibuat oleh test tersebut.

Hindari cleanup yang terlalu luas seperti **“delete all test orders”**, karena bisa ikut menghapus data yang sedang digunakan oleh test lain.

Cleanup juga jangan menjadi satu-satunya cara menjaga test tetap terisolasi. Kalau starting state hanya bisa benar karena cleanup dari run sebelumnya berhasil, interrupted run bisa membuat test berikutnya ikut bermasalah.

## Kapan pendekatan ini cocok dipakai?

Gunakan UI untuk setup kalau setup flow memang bagian dari behavior yang sedang diuji, atau kalau project belum punya cara lain untuk menyiapkan state tersebut.

Kalau setup bukan bagian dari behavior yang ingin diuji, gunakan API atau test utility yang memang tersedia di project untuk menyiapkan data lebih cepat dan konsisten.

Authentication state bisa digunakan kembali kalau test hanya membaca data atau account tersebut aman digunakan oleh beberapa test sekaligus.

Tapi browser context baru yang login dengan account yang sama tetap menggunakan data account yang sama di backend. Kalau test mengubah profile, preference, order, atau data lain, pastikan test lain nggak menggunakan data yang sama secara bersamaan.

Gunakan network mocking untuk membuat kondisi tertentu yang sulit dibuat secara konsisten, misalnya service mengembalikan error `503`.

Tapi jangan mock service yang integration-nya justru sedang diuji. Kalau payment integration adalah bagian penting dari checkout scenario, tetap butuh test yang menggunakan real integration tersebut.

Untuk test data, lebih baik buat data secukupnya untuk scenario daripada bergantung pada environment dengan banyak seed data yang digunakan bersama.

Reference data yang benar-benar read-only masih bisa digunakan bersama. Hindari menggunakan real customer data, real credential, atau copy data production.

Jangan langsung mematikan parallel execution hanya karena beberapa test memakai resource yang sama. Coba pisahkan account dan test data terlebih dahulu.

Kalau memang ada beberapa test yang nggak aman dijalankan bersamaan karena resource-nya terbatas, baru jalankan group tersebut secara serial dan dokumentasikan alasannya.

## Kalau gagal, mulai cek dari mana?

Masalah pada starting state biasanya punya pola yang cukup jelas:

| Yang terlihat                                              | Kemungkinan penyebab                                                         | Yang perlu dicek                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Test pass saat dijalankan sendiri, tapi fail saat parallel | Beberapa test memakai account atau data yang sama                            | Account ID, record ID, worker yang menjalankan test, dan urutan request |
| Run pertama pass, tapi run berikutnya fail                 | Data dari run sebelumnya masih tersisa atau cleanup nggak selesai            | Hasil setup, ID data yang dibuat, dan kondisi data di environment       |
| Banyak test tiba-tiba redirect ke sign-in                  | Authentication state sudah expired atau tidak valid                          | Hasil auth setup, cookie, dan response dari server                      |
| Test untuk mocked error kadang tetap memanggil real API    | `page.route()` dipasang terlalu terlambat atau URL pattern-nya salah         | Network trace sebelum navigation atau action                            |
| Setup berhasil, tapi UI nggak menemukan data               | Salah environment, data belum tersedia, atau setup sebenarnya belum berhasil | Response body, environment URL, dan record yang dibuat                  |

Kalau masalahnya ada di setup atau test data, perbaiki bagian tersebut terlebih dahulu.

Jangan langsung menambah sleep setelah setup kalau belum ada alasan bahwa backend memang membutuhkan waktu sebelum data siap.

Jangan juga retry pembuatan data tanpa kontrol karena bisa membuat duplicate record terus bertambah.

Kalau test saling bentrok saat parallel, jangan langsung mengubah seluruh suite menjadi satu worker. Cari dulu account atau data mana yang digunakan bersama.

Saat review setup dan test data, cek beberapa hal ini:

- Apakah test menggunakan API, account, credential, atau cleanup endpoint yang memang sudah tersedia dan boleh digunakan?
- Apakah setup memastikan data yang dibutuhkan benar-benar berhasil dibuat sebelum UI menggunakannya?
- Apakah beberapa test atau worker menggunakan account atau mutable data yang sama?
- Apakah ID atau reference yang dibuat bisa sama ketika beberapa test berjalan secara parallel?
- Apakah authentication state tersimpan di repository, muncul di log, atau bisa diakses oleh orang yang nggak seharusnya?
- Apakah mock membuat test tidak lagi menguji integration yang sebenarnya ingin diuji?
- Apakah `page.route()` dipasang sebelum request yang ingin di-mock dikirim?
- Apakah cleanup hanya menghapus data yang dibuat oleh test tersebut?
- Kalau setup fail, apakah error-nya langsung menjelaskan masalah setup atau malah baru terlihat sebagai UI timeout?

Memindahkan setup ke helper nggak otomatis membuatnya aman atau reliable. Kita tetap perlu tahu data apa yang dibuat, apa yang diubah, dan apa yang perlu dibersihkan setelah test selesai.

## Coba cek pemahamanmu

Sebuah test suite menggunakan satu saved admin account. Hook `beforeAll` membuat satu order, lalu tiga test mengubah order yang sama dengan cara berbeda. Setelah semua test selesai, `afterAll` menghapus order tersebut.

Suite ini pass saat dijalankan dengan satu worker, tapi mulai fail saat test berjalan parallel atau ketika run sebelumnya berhenti sebelum cleanup selesai.

`beforeAll` dan `afterAll` hanya berlaku untuk worker yang menjalankan test tersebut. Kalau beberapa test di dalam worker yang sama memakai dan mengubah data yang sama, mereka tetap bisa saling memengaruhi.

Masalah juga bisa muncul kalau worker restart atau `afterAll` nggak sempat selesai, karena data dari run sebelumnya bisa tetap tertinggal.

Coba rancang ulang setup test tersebut. Tentukan data apa yang masih aman digunakan bersama, data apa yang harus dibuat terpisah, kapan setup dilakukan, dan bagaimana cleanup-nya.

## Bandingkan dengan cara pikir ini

Contoh jawaban:

- Jangan biarkan beberapa test yang berjalan parallel mengubah admin account dan order yang sama.
- Kalau test mengubah data di level account, gunakan account berbeda untuk setiap worker atau test sesuai kebutuhan.
- Buat order yang dibutuhkan oleh masing-masing test lewat API atau test utility, lalu simpan ID yang dikembalikan.
- Data catalog yang benar-benar read-only masih bisa digunakan bersama.
- Cleanup setiap order berdasarkan ID yang dibuat oleh test tersebut, dan pastikan cleanup tetap aman kalau order-nya sudah tidak ada.
- Setiap test harus tetap bisa dijalankan sendiri tanpa bergantung pada data yang dibuat oleh `beforeAll`.
- Kalau cleanup dari run sebelumnya nggak selesai, run berikutnya tetap aman karena membuat data baru dengan ID atau reference yang berbeda.

Kita nggak perlu membuat semua data menjadi terpisah. Yang penting, data yang bisa berubah nggak dipakai bersama oleh beberapa test tanpa kontrol yang jelas.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menentukan starting state yang dibutuhkan test, memilih cara setup dan authentication yang sesuai, mengontrol dependency, serta merancang cleanup supaya test tetap aman saat dijalankan secara parallel.

Di lesson berikutnya, kita akan mulai dari test yang fail lalu mencari root cause berdasarkan error, trace, screenshot, network, dan informasi lain yang tersedia.

Kalau starting state sudah dikontrol dengan baik, proses debugging jadi lebih mudah karena kemungkinan masalah dari setup dan test data sudah jauh berkurang.
