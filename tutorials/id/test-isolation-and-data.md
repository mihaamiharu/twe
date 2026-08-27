---
title: 'Bangun Starting State yang Terkontrol'
description: 'Rancang ownership yang eksplisit untuk test data, authentication, dependency, cleanup, dan parallel execution.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan complete starting-state contract milik sebuah test;
- memilih UI, API, atau trusted test utility untuk setup berdasarkan risk;
- memilih authentication-state strategy yang aman untuk read-only dan state-changing test;
- memakai network mocking tanpa menghilangkan integration yang sedang diuji; serta
- mengenali data ownership dan cleanup design yang tetap aman saat parallel.

## Kenapa ini penting buat QA

Pernah nggak sih test kelihatannya gagal pada click pertama, padahal masalahnya sudah terjadi jauh sebelum itu? Customer-nya sudah punya order, shared account diubah worker lain, authentication file expired, atau cleanup kemarin nggak sempat jalan.

Test code-nya bisa terlihat benar karena locator dan assertion memang sesuai UI. Hidden problem-nya adalah skenario tersebut nggak pernah memiliki starting state-nya sendiri.

Manual QA test case biasanya punya precondition: pakai customer baru, siapkan available item, atau pastikan belum ada order. Automation harus mengubah precondition tersebut menjadi repeatable setup, bukan berharap environment kebetulan siap.

## Cara berpikir yang perlu kamu pegang

Perlakukan starting state sebagai contract dengan beberapa owner:

```text
Reliable scenario
    = isolated browser session
    + owned server-side data
    + deliberate authentication
    + controlled external dependencies
    + safe cleanup and collision strategy
```

Ini adalah boundary yang terpisah. Browser context yang baru mengisolasi client-session state, tetapi record yang dibuat oleh setup tetap menjadi server-side state bersama sampai test memberi owner dan rencana cleanup yang jelas.

State contract yang berguna menjawab:

| Pertanyaan tentang state     | Contoh jawaban                                       |
| ---------------------------- | ---------------------------------------------------- |
| Data apa yang dimiliki test? | Satu order yang dibuat khusus untuk test ini         |
| Bagaimana data dibuat?       | Supported test API sebelum UI interaction            |
| Siapa yang authenticated?    | Worker-safe customer account                         |
| Dependency mana yang real?   | Order service real; notification service dibuat fake |
| Cleanup apa yang dibutuhkan? | Hapus owned order berdasarkan returned ID            |
| Apa yang bisa collision?     | Account preference dan fixed order reference         |

Setup layer yang tepat ditentukan oleh hal yang ingin dibuktikan test. Setup nggak otomatis lebih realistis hanya karena melewati UI lebih banyak.

## Coba kita bedah contoh nyata

Requirement-nya adalah:

> Customer bisa cancel submitted order miliknya sendiri dan melihat order berubah menjadi canceled.

Behavior yang diuji dimulai di order detail page. Register user, login, browsing product, dan menyelesaikan checkout adalah risk yang berbeda. Mengulang semuanya membuat cancellation test lambat dan sulit didiagnosis.

### 1. Tulis state contract lebih dulu

```text
Owned data: satu submitted order milik test customer
Creation method: supported test API
Authentication: worker-safe customer state
External dependencies: real order service; notification delivery tidak di-assert
Cleanup: hapus hanya returned order ID; toleransi kalau data sudah dihapus
Parallel collision risk: account dan order reference tidak boleh shared
```

### 2. Buat hanya server state yang dibutuhkan

```ts
test('customer cancels an owned order', async ({ page, request }) => {
  // Request client punya scope test; order yang dibuatnya tidak otomatis terisolasi di server.
  const response = await request.post('/api/test/orders', {
    data: { status: 'submitted', owner: 'current-test-customer' },
  });

  expect(response.ok()).toBe(true);
  const order: { id: string; reference: string } = await response.json();

  await page.goto(`/orders/${order.id}`);
  await expect(
    page.getByRole('heading', { name: `Order ${order.reference}` }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Cancel order' }).click();
  await expect(page.getByRole('status')).toHaveText('Order canceled');
});
```

API response diperiksa sebelum datanya digunakan. Order ID dari setup menunjukkan record persis yang harus ditampilkan UI dan nanti dibersihkan.

Pattern ini mengasumsikan aplikasi punya authorized test-support endpoint dan fixture `request` dikonfigurasi untuk intended test identity. Jangan membuat undocumented production backdoor hanya supaya test lebih pendek.

### 3. Pilih authentication strategy dari mutation risk

Reuse authenticated browser state bisa mempercepat setup, tapi account di baliknya tetap berada di server.

| Skenario                                              | Arah yang lebih aman                                       |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| Public atau signed-out behavior                       | Mulai dengan empty browser state                           |
| Banyak read-only test bisa memakai satu account       | Reuse satu prepared storage state                          |
| Test mengubah account atau shared server-side state   | Sediakan account berbeda per worker atau per test          |
| Satu skenario memiliki beberapa role                  | Pakai context dan state terpisah untuk setiap role         |
| Authentication itu sendiri adalah behavior yang diuji | Jalankan real sign-in flow di skenario yang fokus tersebut |

Stored authentication state bisa berisi sensitive cookies dan header yang dapat dipakai untuk menyamar sebagai test account. Jangan commit file seperti `playwright/.auth/user.json`, batasi aksesnya, dan regenerate expired state dengan aman.

### 4. Kontrol network hanya saat memang membantu skenario

Misalnya produk harus menampilkan fallback yang jelas ketika recommendation service unavailable. Controlled 503 response tepat digunakan:

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

Register route sebelum request bisa dimulai. Mock tersebut membuat rare dependency response menjadi deliberate.

Tapi fully mocked payment flow nggak bisa membuktikan real checkout integration bekerja. Pertahankan integration yang disebut oleh test sebagai real, lalu dokumentasikan coverage apa yang hilang karena mock.

### 5. Bersihkan hanya data yang dimiliki test

Cleanup harus memakai returned record identity dan tetap aman kalau record tersebut sudah dihapus. Hindari operation luas seperti “delete all test orders” karena bisa menghapus data milik worker lain.

Cleanup adalah safety net, bukan satu-satunya isolation mechanism. Kalau setup bergantung pada cleanup kemarin, interrupted run bisa merusak run berikutnya.

## Kapan pendekatan ini cocok dipakai?

Gunakan UI setup saat setup flow memang menjadi bagian behavior atau nggak ada trusted lower-level setup surface. Gunakan API call atau owned test utility untuk precondition di luar risk skenario.

Gunakan shared authenticated state hanya ketika concurrent test nggak bisa saling mengganggu lewat account tersebut. Fresh context yang memuat account sama nggak membuat server-side setting-nya menjadi unique.

Gunakan network interception untuk membuat deliberate dependency response, menghilangkan nondeterminism di luar integration yang diuji, atau mereproduksi rare error. Jangan mock component yang real integration-nya justru ingin dibuktikan test.

Pilih unique dan minimal data daripada reusable seed environment yang besar. Reuse immutable reference data kalau memang benar-benar read-only. Hindari production personal data, real credential, dan copied customer record.

Jangan mematikan seluruh parallelism hanya karena satu group berbagi constrained resource. Isolasi account dan data lebih dulu. Kalau kelompok kecil memang nggak aman dijalankan bersamaan, constrain kelompok itu secara sengaja dan terdokumentasi.

## Kalau gagal, mulai cek dari mana?

State failure biasanya meninggalkan evidence yang bisa dikenali:

| Yang terlihat                                 | Kemungkinan state problem                                       | Evidence yang diperiksa                      |
| --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Lulus sendiri, gagal saat parallel            | Shared account atau record collision                            | ID, worker identity, request timeline        |
| Run pertama lulus, run lokal berikutnya gagal | Persistent server data atau incomplete cleanup                  | Setup response, owned ID, environment record |
| Semua test mendadak redirect ke sign-in       | Expired atau invalid authentication state                       | Auth setup result, cookie, server response   |
| Mocked error test kadang memanggil real API   | Route terlalu lambat dipasang atau pattern salah                | Network trace sebelum navigation/action      |
| Setup sukses tapi UI nggak menemukan data     | Wrong environment, delayed backend state, atau weak setup check | Response body, environment URL, record query |

Perbaiki ownership atau setup contract-nya. Jangan menambah sleep setelah setup tanpa evidence adanya asynchronous state transition. Jangan retry data creation sampai duplicate record menumpuk. Jangan sembunyikan collision dengan mengubah semua test menjadi satu worker.

## Review hasil buatan AI

Saat me-review generated setup dan data code, tanyakan:

- Apakah code mengarang test API, account, credential, atau cleanup endpoint?
- Apakah setup membuktikan required record sudah dibuat sebelum dipakai UI?
- Test atau worker mana yang memiliki setiap mutable account dan record?
- Bisakah dua parallel run menghasilkan identity yang sama?
- Apakah stored authentication state di-commit, masuk log, atau diberikan ke AI?
- Apakah mock menghilangkan integration yang disebut oleh test?
- Apakah route dipasang sebelum request dimulai?
- Bisakah cleanup menghapus data milik test lain?
- Apakah failed setup memberi failure yang jelas atau malah misleading UI timeout?

Generated setup nggak otomatis aman hanya karena disembunyikan di helper. Kamu tetap perlu memahami authority dan side effect-nya.

## Coba cek pemahamanmu

Sebuah suite memakai satu saved admin account. Hook `beforeAll` membuat satu order, tiga test mengubah order yang sama dengan cara berbeda, lalu hook `afterAll` menghapusnya. Suite lulus dengan satu worker, tapi gagal saat parallel atau setelah interrupted run.

`beforeAll` dan `afterAll` punya scope pada worker process yang relevan, bukan boundary universal untuk seluruh suite. Keduanya tetap bisa membuat state yang dipakai bersama oleh beberapa test dalam worker itu, dan restart worker atau cleanup yang terhenti bisa meninggalkan state tersebut.

Rancang ulang state contract-nya. Tentukan apa yang boleh tetap shared, apa yang harus unique, di mana setup dilakukan, dan bagaimana cleanup harus bekerja.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Jangan biarkan parallel test memodifikasi satu admin account dan satu order yang sama.
- Beri setiap worker atau test account yang sesuai kalau account-level state ikut berubah.
- Buat required order per test lewat supported API atau test utility, lalu simpan returned ID-nya.
- Biarkan immutable catalog data shared hanya kalau test nggak bisa memodifikasinya.
- Cleanup setiap owned order berdasarkan ID dengan idempotent operation.
- Pastikan setiap test bisa dijalankan sendiri tanpa bergantung pada side effect `beforeAll`.
- Anggap interrupted cleanup bisa dipulihkan karena run berikutnya membuat unique owned data.

Tujuannya bukan menghilangkan seluruh shared infrastructure. Tujuannya adalah menghilangkan ambiguous ownership untuk mutable state.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menulis complete state contract dan memilih setup, authentication, dependency, serta cleanup strategy yang tetap jelas saat parallel execution.

Lesson berikutnya dimulai dari sebuah failure lalu bekerja mundur lewat evidence. Controlled state memberi baseline yang bisa dipercaya: kalau test masih gagal, hidden assumption-nya sudah jauh lebih sedikit.
