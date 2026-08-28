---
title: 'Jadikan Browser Context sebagai Boundary Test'
description: 'Gunakan model browser, context, dan page milik Playwright untuk memisahkan client session tanpa mengira browser isolation juga mengisolasi backend data.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan responsibility dari browser, browser context, dan page;
- memprediksi state mana yang shared atau terpisah antar-page dan context;
- memakai default fixture `page` untuk test yang biasa;
- memilih context terpisah untuk skenario multi-user yang memang membutuhkannya; serta
- mendiagnosis apakah suite failure berasal dari browser state atau shared backend state.

## Kenapa ini penting buat QA

Pernah nggak sih sebuah test lulus saat dijalankan sendirian, tapi gagal setelah test lain? Tiba-tiba test kedua sudah login, dismissed banner tetap hilang, atau cart-nya sudah berisi item.

Saat manual testing, kita biasanya reset browser, ganti profile, atau membuka incognito window kalau butuh session bersih. Automated test juga membutuhkan boundary yang jelas dan repeatable.

Dengan setup end-to-end standar, Playwright Test memberi browser context baru untuk setiap test. Ini mencegah browser-session state bocor antar-test. Tapi context baru nggak me-reset database aplikasi, mengembalikan inventory, atau otomatis memberi akun berbeda ke setiap test. Reliability dimulai dari tahu persis di mana boundary ini berakhir.

## Cara berpikir yang perlu kamu pegang

Bayangkan object Playwright sebagai responsibility boundary yang bertingkat:

```text
Worker process
└── Browser (bisa dipakai ulang di dalam worker ini)
    ├── BrowserContext untuk Test A
    │   └── Page: satu tab di session milik Test A
    └── BrowserContext untuk Test B
        └── Page: satu tab di session milik Test B
```

Playwright bisa memakai ulang fixture `Browser` di dalam satu worker demi efisiensi. Boundary test yang biasanya kita pedulikan adalah `BrowserContext` baru beserta `Page` bawaannya, bukan proses browsernya.

![Satu browser berisi isolated context untuk test yang berbeda, sementara page di dalam satu context menjadi bagian client session yang sama; backend record tetap berada di luar browser boundary.](/images/tutorials/context-isolation-boundary.svg)

_Fresh context mengisolasi browser-side session state. Shared application data membutuhkan strategi sendiri._

Responsibility-nya seperti ini:

| Object           | Bayangkan sebagai                     | Hal yang ditentukan                                           |
| ---------------- | ------------------------------------- | ------------------------------------------------------------- |
| `Browser`        | Browser engine yang sedang berjalan, biasanya dipakai ulang di dalam worker | Menampung satu atau beberapa independent session              |
| `BrowserContext` | Satu isolated browser profile/session untuk scope satu test | Cookies, storage, permission, dan page milik session tersebut; `storageState` yang dikonfigurasi bisa mengisi authentication lebih dulu |
| `Page`           | Satu tab atau popup                   | Navigation dan interaction pada satu browser surface          |

Dua page di dalam context yang sama menjadi bagian browser session yang sama. Context yang berbeda nggak berbagi client-session state tersebut.

Tapi kedua context masih bisa memanggil backend yang sama dengan account yang sama. Browser isolation **nggak** otomatis memisahkan:

- customer, order, atau inventory record;
- email inbox atau one-time code;
- rate limit dan queue;
- mutable feature flag; atau
- server-side resource lainnya.

Perbedaan inilah yang menjelaskan banyak failure dengan alasan “padahal setiap test sudah dapat page baru.”

## Coba kita bedah contoh nyata

Mulai dari kasus normal: satu user, satu behavior.

```ts
test('a guest cart starts empty', async ({ page }) => {
  await page.goto('/cart');
  await expect(
    page.getByRole('heading', { name: 'Your cart is empty' }),
  ).toBeVisible();
});
```

Built-in `page` ini menjadi bagian fresh context dengan scope test yang dibuat khusus untuk test tersebut. “Fresh” berarti lifecycle-nya terisolasi; `storageState` yang dikonfigurasi tetap bisa mengisi authentication sehingga session tidak harus selalu signed out. Kamu nggak perlu launch browser atau membuat context lain sendiri.

Sekarang coba bayangin requirement support chat:

> Customer yang sudah login mengirim message, lalu support agent melihat dan membalas conversation yang sama.

Skenario ini memang membutuhkan dua independent authenticated session secara bersamaan:

```ts
test('agent replies to a customer', async ({ browser }) => {
  const customerContext = await browser.newContext({
    storageState: 'playwright/.auth/customer.json',
  });
  const agentContext = await browser.newContext({
    storageState: 'playwright/.auth/agent.json',
  });

  try {
    const customerPage = await customerContext.newPage();
    const agentPage = await agentContext.newPage();

    await customerPage.goto('/support');
    await agentPage.goto('/agent/inbox');

    await customerPage.getByLabel('Message').fill('Where is my order?');
    await customerPage.getByRole('button', { name: 'Send' }).click();

    await expect(agentPage.getByText('Where is my order?')).toBeVisible();
    await agentPage.getByLabel('Reply').fill('It ships today.');
    await agentPage.getByRole('button', { name: 'Reply' }).click();

    await expect(customerPage.getByText('It ships today.')).toBeVisible();
  } finally {
    await customerContext.close();
    await agentContext.close();
  }
});
```

Dua context tersebut memisahkan cookie milik customer dan agent. Conversation-nya justru sengaja menjadi shared backend data karena itulah behavior yang sedang diuji.

Menutup manually created context di dalam `finally` melepaskan resource dan memberi Playwright kesempatan menyelesaikan artifact meskipun assertion gagal.

Sekarang kelihatan kenapa dua page dalam satu context adalah model yang salah untuk skenario ini. Keduanya masih menjadi satu session, jadi login sebagai agent bisa mengganti customer session. Tab kedua adalah surface kedua, bukan user kedua.

## Kapan pendekatan ini cocok dipakai?

Gunakan default fixture `page` untuk hampir semua test biasa. Fixture tersebut sudah memberi clean browser context yang dibutuhkan test-level isolation.

Buat context tambahan di dalam satu test saat product behavior memang melibatkan concurrent identity atau independent session—misalnya buyer dan seller, customer dan agent, atau dua participant dalam collaboration flow.

Gunakan page lain dalam context yang sama untuk popup atau multi-tab flow yang memang harus mempertahankan signed-in session yang sama. Jangan pakai page kedua untuk mewakili identity berbeda.

Nggak perlu launch browser baru per test hanya untuk mendapat isolation; context sudah menyediakan boundary itu dengan lebih efisien. Jangan reuse satu page atau context untuk unrelated test demi menghemat setup time. Kamu akan kehilangan reliability guarantee yang penting.

Browser-engine coverage akan dibahas di module cross-browser. Nama protocol dan browser internal nggak dibutuhkan untuk membuat isolation decision yang baik di sini.

## Kalau gagal, mulai cek dari mana?

Misalnya account-settings test lulus sendiri, tapi gagal saat parallel karena language preference-nya sudah berubah.

Pisahkan dua hypothesis ini:

1. **Client-session leak:** test berikutnya menerima cookie atau storage dari test sebelumnya.
2. **Backend collision:** fresh context login memakai account yang sama lalu mengubah server-side preference yang sama.

Periksa failed run-nya:

- Apakah setiap test menerima context dan page fixture sendiri?
- Account identity mana yang dipakai setiap request?
- Apakah fresh context tetap menampilkan language yang sudah berubah?
- Apakah failure hilang ketika setiap worker memakai account berbeda?

Kalau context yang benar-benar baru tetap menerima modified preference dari server, menambah context nggak akan memperbaikinya. State tersebut berada di luar browser boundary. Lesson berikutnya akan menentukan ownership untuk data itu.

Jangan langsung membuat seluruh suite serial, menambah retry, atau menghapus random storage key. Langkah tersebut bisa menyembunyikan collision tanpa menemukan state mana yang sebenarnya shared.

Saat me-review context-management code, periksa:

- Apakah skenarionya memang membutuhkan lebih dari default fixture `page`?
- Apakah user berbeda dimodelkan dengan context berbeda, bukan sekadar tab berbeda?
- Apakah manually created context tetap ditutup saat test gagal?
- Apakah authentication state sesuai untuk setiap role?
- Apakah penjelasannya keliru menganggap context baru ikut me-reset backend data?
- Apakah shared product data memang intentional dan controlled?
- Apakah implementasinya launch browser atau context tambahan tanpa product reason?

Lebih banyak context nggak otomatis berarti isolation lebih baik. Boundary-nya harus sesuai dengan state yang bisa bertabrakan.

## Coba cek pemahamanmu

Sebuah marketplace test membuat dua page dari default context. Page pertama login sebagai buyer, page kedua login sebagai seller, lalu page pertama tiba-tiba ikut menjadi seller. Usulan perbaikannya adalah clear cookies pada page pertama sebelum setiap assertion.

Jelaskan modeling mistake yang sebenarnya, architectural repair terkecil, dan marketplace data mana yang masih membutuhkan isolation plan setelah repair tersebut.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Kedua page berada di context yang sama, jadi keduanya nggak mewakili independent authenticated session.
- Buat buyer context dan seller context, lalu buat satu page di masing-masing context.
- Jangan clear cookies di tengah behavior karena itu menghancurkan session yang sedang dimodelkan.
- Listing, order, dan account record tetap berada di backend. Beri test deliberate ownership dan cegah worker lain memodifikasi record yang sama.

Context terpisah memperbaiki client-session model. Context tersebut belum menyelesaikan shared database ownership.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menjelaskan hierarchy browser–context–page, mengandalkan default test boundary, dan menambah context hanya untuk behavior yang memang membutuhkan beberapa session.

Lesson berikutnya memperluas isolation ke luar browser. Kamu akan menentukan bagaimana setiap test memiliki authentication, server data, external dependency, cleanup, dan parallel-collision risk-nya sendiri.
