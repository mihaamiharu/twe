---
title: 'Atur Typed Option, Worker Scope, dan Automatic Fixture dengan Aman (Optional)'
description: 'Gunakan advanced fixture hanya kalau resource bisa dipisahkan dengan aman, cleanup-nya jelas, dan waktu setup yang dihemat memang terasa.'
---

## Setelah lesson ini, kamu bisa

- membedakan option untuk mengatur test dari fixture yang membuat resource;
- memberi type pada test-scoped dan worker-scoped fixture dengan benar;
- membuat resource yang unik untuk setiap worker dan membersihkannya dengan aman;
- memakai automatic fixture untuk diagnostic kecil yang memang dibutuhkan banyak test; serta
- mengenali kapan hubungan antar-fixture sudah terlalu rumit dan perlu disederhanakan.

## Kenapa ini penting buat QA

Advanced fixture bisa mengurangi setup mahal yang terus berulang dan membuat banyak test memakai cara setup yang sama. Masalahnya, design seperti ini juga bisa menyebabkan failure yang sulit di-debug: beberapa worker memakai account yang sama, automatic fixture menjalankan action tersembunyi, cleanup menghapus data yang masih dipakai test lain, atau urutan setup sudah nggak bisa dijelaskan.

Tambahkan advanced fixture hanya kalau jelas siapa yang membuat dan membersihkan resource, atau kalau hasil pengukuran menunjukkan setup memang jauh lebih cepat. Banyaknya fixture bukan tanda bahwa test suite lebih mature. Helper sederhana dan test-scoped fixture sering kali lebih mudah dirawat.

Lesson ini optional. Kamu boleh melewatinya tanpa menghambat Module 8. Pelajari lebih lanjut kalau test suite memang membutuhkan option yang bisa diatur per project, resource khusus untuk setiap worker, atau diagnostic yang berjalan automatic.

Kalau coding agent mengusulkan design seperti ini, anggap fixture graph yang dibuatnya sebagai proposal. Team tetap perlu mengecek ownership, isolation, dan cleanup setiap resource sebelum memakainya di seluruh test suite.

## Cara berpikir yang perlu kamu pegang

Bedakan empat hal berikut:

```text
Option          → input yang bisa diatur; nggak membuat atau membersihkan resource
Test fixture    → membuat resource untuk satu test
Worker fixture  → membuat resource untuk satu worker process
Automatic       → berjalan walaupun test nggak memintanya dari parameter
```

Untuk setiap worker-scoped resource, kamu harus bisa menjelaskan alur ini:

```text
Satu worker membuat resource → test yang aman memakainya → worker yang sama melakukan cleanup
```

Kalau beberapa worker mengubah account yang sama di server, browser context yang terpisah tetap nggak bisa mencegah race condition.

## Coba kita bedah contoh nyata

Misalnya test suite mendukung UI locale yang bisa diatur dan proses membuat account cukup mahal. Setiap worker membutuhkan satu account yang unik, sementara setiap test tetap mendapatkan signed-in browser context baru.

### 1. Tentukan option dan scope setiap fixture

```ts
import { randomUUID } from 'node:crypto';

import {
  test as base,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
} from '@playwright/test';

type TestOptions = {
  appLocale: 'en' | 'id';
};

type TestFixtures = {
  signedInPage: Page;
};

type WorkerFixtures = {
  workerAccount: { id: string; email: string };
};
```

`appLocale` adalah input yang bisa diatur dari project. `signedInPage` dibuat untuk satu test, sedangkan `workerAccount` dibuat untuk satu worker.

### 2. Atur setup dan cleanup setiap resource

```ts
export const test = base.extend<TestOptions & TestFixtures, WorkerFixtures>({
  appLocale: ['en', { option: true }],

  workerAccount: [
    async ({}, use, workerInfo) => {
      const runId = process.env.TEST_RUN_ID ?? `local-${randomUUID()}`;
      const account = await createTestAccount({
        uniqueKey: `${runId}-${workerInfo.project.name}-${workerInfo.workerIndex}`,
      });

      try {
        await use(account);
      } finally {
        await deleteTestAccount(account.id);
      }
    },
    { scope: 'worker' },
  ],

  signedInPage: async ({ browser, workerAccount, appLocale }, use) => {
    const storageState = await createStorageState(workerAccount.id);
    const context: BrowserContext = await browser.newContext({
      locale: appLocale,
      storageState,
    });
    try {
      const page = await context.newPage();
      await use(page);
    } finally {
      await context.close();
    }
  },
});
```

Worker fixture ini nggak menyimpan password di source code. Fixture meminta account unik dari test-support utility yang memang diberi akses, lalu menghapus account tersebut di dalam `finally`. `workerIndex` hanya unik dalam satu run. Tambahkan CI run ID atau identifier run lain ke `uniqueKey` supaya account dari dua run yang berbeda nggak memakai ID yang sama. Random fallback membantu mencegah collision saat dijalankan secara local.

Test-scoped fixture membuat browser context dan page baru untuk setiap test. Block `finally` tetap menutup context ketika page gagal dibuat atau test fail. Account worker hanya aman dipakai beberapa test kalau semua test tersebut nggak mengubah profile, permission, saved address, preference, atau account-level state lainnya. Kalau state itu ikut diuji, gunakan account terpisah untuk setiap test.

Option tadi bisa dioverride dari configuration:

```ts
projects: [
  { name: 'english', use: { appLocale: 'en' } },
  { name: 'indonesian', use: { appLocale: 'id' } },
];
```

Jangan otomatis menjalankan setiap scenario di semua locale project. Pilih scenario berdasarkan locale yang memang didukung dan product risk yang perlu dicek.

### 3. Gunakan automatic fixture untuk diagnostic kecil

Automatic fixture berikut menyimpan browser console message saat test fail:

```ts
type Diagnostics = {
  captureConsole: void;
};

export const testWithDiagnostics = test.extend<Diagnostics>({
  captureConsole: [
    async ({ signedInPage }, use, testInfo) => {
      const messages: string[] = [];
      const collect = (message: ConsoleMessage) => {
        messages.push(message.text());
      };

      signedInPage.on('console', collect);
      try {
        await use();
      } finally {
        signedInPage.off('console', collect);
      }

      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('browser-console', {
          body: messages.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});
```

Fixture ini hanya mengumpulkan diagnostic dan hasilnya terlihat di artifact ketika test fail. Listener dipasang pada `signedInPage` yang sama dengan page yang diterima test, lalu dihapus di dalam `finally` supaya nggak tetap aktif saat fixture lain melanjutkan teardown. Sebelum menyimpan atau membagikan artifact, cek apakah console message berisi secret atau personal data.

## Kapan pendekatan ini cocok dipakai?

Gunakan typed option ketika project atau group test perlu mengatur input yang stabil, seperti locale atau feature mode. Test data biasa tetap berada di test; jangan pindahkan setiap baris data menjadi global option.

Gunakan worker scope untuk service atau resource mahal yang aman dipakai oleh satu worker. Contohnya data referensi yang nggak pernah diubah, service instance yang terpisah, atau account unik per worker yang hanya dipakai oleh read-only scenario.

Gunakan automatic fixture untuk diagnostic kecil yang memang perlu dijalankan pada semua test yang relevan. Karena fixture berjalan tanpa diminta dari parameter test, jangan gunakan automatic fixture untuk business setup, navigation, atau membuat mutable test data.

Tetap gunakan test scope kalau belum jelas apakah resource aman dipakai bersama. Kalau setup mulai memperlambat suite, ukur dulu bagian yang mahal lalu tentukan resource mana yang benar-benar aman untuk di-share.

## Kalau gagal, mulai cek dari mana?

| Yang terjadi                                         | Kemungkinan penyebab                                  | Cek dulu                                                   |
| ---------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Test hanya fail ketika memakai beberapa worker       | Beberapa worker mengubah account yang sama di server  | Run ID, generated ID, account setiap worker, `workerIndex` |
| Test menjalankan setup yang nggak pernah diminta     | Automatic fixture diterapkan terlalu luas             | Fixture `{ auto: true }` dan test object yang di-import    |
| Worker restart meninggalkan record                   | Cleanup nggak berjalan atau ID resource nggak unik    | Block `finally`, error saat setup, dan resource ID         |
| Fixture timeout terlihat nggak berkaitan dengan test | Fixture lambat memakai timeout sendiri                | Durasi fixture dan fixture timeout yang digunakan          |
| Mengubah satu option membuat banyak worker baru      | Worker fixture bergantung pada worker-scoped option   | Scope option dan parameter worker fixture                  |
| Nggak ada yang bisa menjelaskan urutan setup         | Hubungan antar-fixture terlalu dalam atau tersembunyi | Gambar urutan dependency, setup, dan teardown              |

Worker process bisa restart setelah test fail. Gunakan CI run ID atau identifier run lain yang stabil, lalu gabungkan dengan nama project dan `workerIndex`. Cleanup dan setup berikutnya juga perlu aman ketika run sebelumnya terputus di tengah jalan.

Jangan langsung memaksa seluruh suite memakai satu worker untuk menghilangkan race. Cari dulu resource apa yang dipakai bersama dan test mana yang mengubahnya. Satu worker hanya menyembunyikan masalah tersebut sekaligus membuat feedback dari parallel run menjadi lebih lambat.

## Review hasil kerja dengan bantuan AI

Sebelum menerima advanced fixture buatan AI, tanyakan:

- Apakah value ini hanya sebuah option, resource untuk satu test, atau resource untuk satu worker?
- Berapa banyak waktu yang dihemat oleh worker scope, dan kenapa resource-nya aman dipakai beberapa test?
- State apa di server yang bisa diubah oleh test?
- Apakah setiap worker memakai ID yang unik, termasuk setelah worker restart?
- Apakah cleanup menghapus resource yang tepat saat test pass maupun fail?
- Bisakah automatic fixture membocorkan secret atau mengubah starting page scenario?
- Apakah urutan dependency, setup, dan teardown masih mudah dijelaskan?
- Apakah satu option tanpa sengaja membuat ulang banyak worker atau menambah jumlah project?
- Apakah helper atau test-scoped fixture biasa lebih mudah dibaca?
- Apakah AI mengarang account factory, akses untuk membuat storage state, atau cleanup API?

Untuk setiap mutable resource yang dipakai bersama, minta diagram yang menunjukkan siapa yang membuat, memakai, dan menghapusnya. Kalau urutan setup dan teardown nggak bisa dijelaskan, fixture tersebut belum siap digunakan.

## Coba cek pemahamanmu

AI membuat worker-scoped fixture dengan satu account `admin@example.test`. Semua worker memakai storage-state file yang sama. Test mengedit permission dan profile setting. Automatic fixture juga membuka `/admin` sebelum setiap test.

Temukan resource yang saling bertabrakan dan action yang berjalan tanpa terlihat di test. Bagian mana yang kamu pertahankan, ubah scope-nya, atau hapus?

## Bandingkan dengan cara pikir ini

Salah satu respons yang masuk akal:

- Jangan share satu mutable admin account atau storage-state file ke beberapa worker.
- Buat account unik per worker hanya kalau semua test yang memakainya nggak mengubah account-level state. Kalau state tersebut berubah, gunakan account per test.
- Beri setiap test browser context baru meskipun authentication state yang aman dipakai ulang.
- Jangan memasukkan storage state ke repository, dan pastikan satu worker nggak menimpa file worker lain.
- Hapus automatic navigation karena action tersebut menyembunyikan starting page dan memengaruhi test yang perlu membuka route lain.
- Pertahankan automatic diagnostic hanya kalau kecil, hasilnya terlihat di artifact, sudah dibersihkan dari data sensitif, dan berguna untuk semua test yang memakai fixture tersebut.
- Dokumentasikan cleanup dan cara membersihkan account yang tertinggal ketika run terputus.

Advanced fixture baru layak digunakan kalau lebih mudah menjelaskan siapa yang membuat, mengubah, dan membersihkan setiap resource dibandingkan versi sederhananya.

## Sebelum lanjut

Sekarang kamu seharusnya bisa membedakan option dari resource, memilih test atau worker scope, lalu menolak advanced fixture yang menyembunyikan action atau membuat beberapa test mengubah mutable state yang sama.

Lesson ini optional. Core Module 8 tetap sama: pilih abstraction terkecil yang membuat test lebih mudah dirawat, tunjukkan resource yang dibutuhkan test, dan buat setiap setting test suite mudah dijelaskan.
