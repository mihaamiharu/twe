---
title: 'Susun Advanced Fixture Tanpa Shared-State Trap (Optional)'
description: 'Gunakan typed option, worker-owned resource, dan automatic fixture hanya saat lifecycle serta maintenance cost-nya benar-benar justified.'
---

## Setelah lesson ini, kamu bisa

- membedakan configurable test option dari resource fixture;
- memberi type pada test-scoped dan worker-scoped fixture dengan benar;
- merancang worker-scoped resource yang punya unique ownership dan cleanup;
- memakai automatic fixture untuk small observable cross-cutting behavior; serta
- mengenali kapan advanced fixture graph sebaiknya disederhanakan.

## Kenapa ini penting buat QA

Advanced fixture bisa mengurangi expensive repeated setup dan memberi consistent interface ke suite besar. Tapi di sinilah failure yang paling susah juga sering muncul: mutable account dishare antarkerja, automatic behavior tersembunyi, cleanup merusak test berikutnya, atau dependency graph yang nggak bisa dijelaskan siapa pun.

Complexity baru justified kalau hasilnya clearer ownership, safer lifecycle, atau measured setup saving yang memang besar. Advanced fixture bukan maturity badge. Clear helper dan test-scoped fixture bisa jadi design yang lebih profesional.

Lesson ini adalah optional depth. Core lesson sudah membahas default test-scoped design; kamu boleh melewatinya tanpa memblokir Module 8 kecuali suite memang punya kebutuhan nyata untuk configurable option, worker-owned resource, atau automatic diagnostic.

## Cara berpikir yang perlu kamu pegang

Pisahkan empat konsep ini:

```text
Option          → configurable input; nggak punya resource lifecycle sendiri
Test fixture    → resource milik satu test
Worker fixture  → resource milik satu worker process
Automatic       → tetap berjalan walaupun test nggak memintanya secara eksplisit
```

Untuk setiap worker-scoped resource, kamu harus bisa membuktikan ownership statement ini:

```text
Satu worker membuatnya → hanya safe consumer yang memakai → worker itu membersihkan
```

Kalau beberapa worker bisa memutasi server-side identity yang sama, browser isolation nggak akan mencegah race.

## Coba kita bedah contoh nyata

Coba bayangin suite mendukung configurable UI locale dan butuh satu expensive unique account per worker. Setiap test tetap mendapat fresh signed-in browser context.

### 1. Definisikan option dan fixture scope

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

`appLocale` adalah input. `signedInPage` dimiliki satu test. `workerAccount` dimiliki satu worker.

### 2. Susun lifecycle-nya

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

Worker fixture ini nggak menyimpan password di source. Dia meminta unique account dari authorized test-support utility, lalu menghapus exact account tersebut di `finally`. `workerIndex` hanya unique di dalam satu run, jadi sertakan stable CI run ID atau run namespace lain kalau support system bisa menerimanya; random fallback untuk local run mencegah collision biasa.

Test-scoped fixture membuat fresh context dan page untuk setiap test. `finally`-nya tetap menutup context kalau page creation atau consumer test gagal. Reuse account baru aman kalau test-test itu nggak memutasi account-level state yang sama. Kalau mereka mengubah profile, permission, saved address, atau preference, kita butuh isolation yang lebih kuat.

Option tadi bisa dioverride dari configuration:

```ts
projects: [
  { name: 'english', use: { appLocale: 'en' } },
  { name: 'indonesian', use: { appLocale: 'id' } },
];
```

Jangan otomatis membuat locale project untuk setiap scenario. Pilih project portfolio berdasarkan supported behavior dan risk.

### 3. Tambahkan automatic behavior hanya kalau layak disembunyikan

Automatic fixture bisa menyimpan browser console message saat test gagal:

```ts
type Diagnostics = {
  captureConsole: void;
};

export const testWithDiagnostics = test.extend<Diagnostics>({
  captureConsole: [
    async ({ page }, use, testInfo) => {
      const messages: string[] = [];
      const collect = (message: ConsoleMessage) => {
        messages.push(message.text());
      };

      page.on('console', collect);
      try {
        await use();
      } finally {
        page.off('console', collect);
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

Behavior-nya kecil, diagnostic, dan terlihat di failure artifact. Listener dihapus dalam `finally` supaya test failure nggak meninggalkannya menempel ke fixture work berikutnya. Tetap review log untuk secret atau personal data sebelum artifact disimpan atau dibagikan.

## Kapan pendekatan ini cocok dipakai?

Pakai typed option saat project atau test group perlu mengonfigurasi stable input seperti locale atau feature mode. Jangan ubah ordinary test-data row menjadi global option.

Pakai worker scope untuk expensive service atau resource yang aman dimiliki satu worker. Kandidat yang masuk akal misalnya immutable reference data, isolated service instance, atau unique worker account yang hanya dipakai read-only scenario.

Pakai automatic fixture untuk small cross-cutting diagnostic atau policy yang memang harus berlaku ke semua relevant test. Karena invocation-nya tersembunyi, automatic fixture bukan tempat yang tepat untuk business setup, navigation, atau mutable data creation.

Tetap gunakan default test-scoped design saat ownership belum jelas. Kalau measured setup cost menjadi masalah, optimasi setelah tahu resource mana yang benar-benar aman untuk dishare.

## Kalau gagal, mulai cek dari mana?

| Observation                                  | Kemungkinan advanced-fixture problem         | Yang pertama diperiksa                              |
| -------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Failure cuma muncul dengan beberapa worker   | Worker share mutable server-side identity    | Run namespace, generated ID, account ownership, worker index |
| Test menjalankan setup yang nggak diminta    | Automatic fixture terlalu luas               | Fixture `{ auto: true }` dan imported test object   |
| Worker restart meninggalkan record           | Cleanup hilang atau identity nggak unique    | `finally`, setup failure path, retained resource ID |
| Fixture timeout terlihat nggak terkait test  | Slow fixture memiliki time budget            | Fixture duration dan configured fixture timeout     |
| Ganti satu option membuat banyak worker baru | Worker fixture bergantung pada worker option | Option scope dan worker-fixture signature           |
| Nggak ada yang tahu setup order              | Dependency graph terlalu dalam atau implicit | Gambar dependency dan reverse teardown order        |

Worker process bisa restart setelah failure. Pakai stable run namespace kalau tersedia, sertakan project dan worker identity, lalu design cleanup dan next setup supaya interrupted run tetap bisa dipulihkan dengan aman.

Jangan menyelesaikan race dengan memaksa seluruh suite menjadi satu worker sebelum memahami shared resource-nya. Itu cuma menyembunyikan ownership defect dan menghilangkan useful parallel feedback.

## Review hasil buatan AI

Sebelum menerima generated advanced fixture, tanyakan:

- Value ini option, test resource, atau worker resource?
- Kenapa worker scope lebih aman dan materially faster daripada test scope di sini?
- Server-side state mana yang bisa dimutasi consumer?
- Apakah identity setiap worker unique, termasuk setelah restart?
- Apakah cleanup berjalan untuk exact owned resource saat sukses maupun gagal?
- Bisakah automatic behavior mengekspos secret atau mengubah scenario?
- Apakah fixture dependency tetap shallow dan mudah dijelaskan?
- Apakah option tanpa sengaja mengubah worker reuse atau melipatgandakan project?
- Apakah helper atau ordinary test-scoped fixture lebih jelas?
- Apakah AI mengarang account factory, storage-state authority, atau cleanup API?

Minta lifecycle diagram atau written ownership contract untuk setiap shared mutable resource. Kalau setup dan teardown order-nya nggak bisa dijelaskan, abstraction-nya belum siap.

## Coba cek pemahamanmu

AI membuat worker-scoped fixture dengan satu account `admin@example.test`. Semua worker memakai storage-state file yang sama. Test mengedit permission dan profile setting. Automatic fixture juga membuka `/admin` sebelum setiap test.

Temukan race dan hidden behavior-nya. Bagian mana yang kamu pertahankan, ubah scope-nya, atau hapus?

## Bandingkan dengan cara pikir ini

Salah satu respons yang masuk akal:

- Jangan share satu mutable admin identity atau storage-state file ke beberapa worker.
- Buat unique account per worker hanya kalau semua test yang memakainya read-only terhadap account-level state; kalau tidak, gunakan per-test identity atau isolation boundary lain.
- Beri setiap test fresh context walaupun safe authentication state direuse.
- Jangan commit storage state dan pastikan satu worker nggak menimpa file worker lain.
- Hapus automatic navigation karena dia menyembunyikan business-relevant starting step dan memengaruhi test yang butuh route lain.
- Pertahankan automatic diagnostic hanya kalau kecil, observable, sudah disanitasi, dan berguna untuk semua imported test.
- Dokumentasikan cleanup dan interrupted-run recovery untuk setiap generated account.

Advanced design baru layak kalau ownership-nya justru lebih explicit daripada versi sederhananya.

## Sebelum lanjut

Sekarang kamu seharusnya bisa membedakan option dari resource, memodelkan test dan worker ownership, lalu menolak advanced fixture design yang menyembunyikan behavior atau share mutable state dengan unsafe.

Lesson ini optional. Menyelesaikannya nggak menggantikan core outcome Module 8: pilih abstraction terkecil yang maintainable, buat dependency explicit, dan encode suite policy secara deliberate.
