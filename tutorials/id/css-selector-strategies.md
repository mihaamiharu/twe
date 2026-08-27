---
title: 'Baca CSS Selector Tanpa Menjadikannya Default'
description: 'Inspeksi, review, dan perbaiki CSS locator fallback sambil tetap mengutamakan intent pengguna dan kontrak test yang didukung.'
---

## Setelah lesson ini, kamu bisa

- membaca bentuk CSS selector yang paling sering muncul di automation code;
- menjelaskan DOM fact yang menjadi dependency sebuah selector;
- membedakan supported attribute contract dari styling dan structural detail;
- mengenali kapan CSS fallback memang layak dipakai di Playwright; dan
- mendiagnosis nol atau beberapa match tanpa menambah selector depth yang nggak perlu.

## Kenapa ini penting buat QA

Walaupun memakai Playwright modern, kamu tetap akan menemukan CSS:

- test lama memakai `#submit-order`;
- generated code menyalin path panjang dari DevTools;
- third-party widget punya semantik yang buruk;
- production defect harus diinvestigasi lewat live DOM; atau
- tim belum menambahkan testability contract yang berguna.

Kamu butuh CSS literacy secukupnya untuk mereview dan merawat kondisi nyata tersebut. Kamu nggak perlu menjadikan hafalan CSS syntax sebagai tujuan learning path.

Asumsi yang berbahaya adalah menganggap selector menjadi reliable saat makin panjang atau kebetulan menemukan tepat satu elemen hari ini.

## Cara berpikir yang perlu kamu pegang

CSS selector menjelaskan implementation evidence:

```text
Selector
   ↓
DOM fact yang menjadi dependency
   ↓
Elemen yang cocok dengan fact tersebut sekarang
```

Kualitas maintenance bergantung pada ownership, bukan syntax saja.

CSS bukan anak tangga berikutnya dalam locator ladder yang universal. Periksa dulu user-facing contract, locator composition, dan test ID yang sudah disepakati. Gunakan CSS hanya saat implementation fact memang menjadi kontrak yang disengaja, halaman bersifat legacy atau third-party, atau semantics yang hilang merupakan testability gap yang jelas.

| DOM fact  | Pertanyaan yang perlu diajukan                                                             |
| --------- | ------------------------------------------------------------------------------------------ |
| Tag       | Apakah element type memang bagian supported behavior?                                      |
| ID        | Apakah sengaja dibuat stabil atau generated per build/session?                             |
| Class     | Apakah domain contract atau cuma output styling/framework?                                 |
| Attribute | Siapa yang memiliki attribute ini, dan bolehkah value-nya berubah tanpa mengubah behavior? |
| Hierarchy | Apakah parent-child relationship bermakna atau cuma markup sekarang?                       |
| Position  | Apakah urutan memang behavior yang diuji?                                                  |

Satu unique match memang dibutuhkan banyak action, tapi uniqueness hari ini nggak membuktikan stability besok.

## Coba kita bedah contoh nyata

Halaman invoice legacy belum punya row semantics yang berguna. Suite-nya berisi:

```ts
const overdueRows = page.locator('.invoice-table > tbody > tr:nth-child(2)');
```

Risikonya adalah:

> Semua invoice yang ditandai overdue oleh aplikasi muncul di overdue collection.

### 1. Baca asumsi dari selector yang ada

Selector tersebut bergantung pada:

- styling class bernama `invoice-table`;
- direct child `tbody`;
- direct child `tr`; dan
- overdue record selalu berada di posisi kedua.

Nggak ada satu pun yang menyatakan “ditandai overdue.” Row baru, sorting change, atau wrapper bisa mengubah record yang dipilih tanpa mengubah product rule.

### 2. Inspeksi live DOM untuk supported signal

Misalnya aplikasi merender:

```html
<tr data-state="overdue">
  <td>INV-1042</td>
  <td>Overdue</td>
</tr>
```

Product team mengonfirmasi bahwa `data-state` adalah maintained state contract yang dipakai component, bukan temporary styling hook.

Fallback yang lebih kecil bisa menyatakan implementation state tersebut:

```ts
const overdueRows = page.locator('tr[data-state="overdue"]');

await expect(overdueRows).toHaveCount(2);
```

Ini tetap CSS contract. Pilihan ini masuk akal karena skenario memang menginspeksi supported DOM state dan halaman belum punya user-facing collection contract yang lebih baik.

Kalau visible text “Overdue” adalah actual user evidence, role/text locator mungkin lebih tepat. Kalau `data-state` nggak dijamin stabil, minta explicit test ID atau perbaikan semantics daripada menyatakan stabilitas sendiri.

### 3. Baca syntax yang diperlukan untuk diagnosis

Kamu nggak perlu menghafal grammar CSS. Kenali bentuk-bentuk di bawah supaya bisa menjelaskan dependency generated selector dan perubahan apa yang bisa membuatnya gagal.

```css
button                         /* tag */
#account-menu                  /* id */
.error-message                /* class */
[name="email"]                /* exact attribute */
input[type="email"]           /* tag plus attribute */
.menu a                       /* descendant di level mana pun */
.menu > a                     /* direct child */
h2 + p                        /* adjacent sibling */
input:checked                 /* current CSS state */
li:nth-child(3)               /* child ketiga jika berupa li */
p:nth-of-type(2)              /* p kedua di antara sibling p */
.card:not(.disabled)          /* class tanpa class lain */
```

Lebih banyak bagian bisa mempersempit match, tapi setiap bagian juga menambah maintenance dependency.

### 4. Bedakan class token dari partial string

CSS class selection memakai token:

```css
.error
```

Attribute substring check berbeda:

```css
[class*="error"]
```

Selector kedua juga bisa cocok dengan class seperti `errorless`. Jangan pakai partial matching kecuali partial text memang documented contract.

### 5. Perlakukan posisi dengan jujur

```css
.results > li:nth-child(1)
```

Selector ini cocok kalau requirement memang khusus membahas first ranked result. Selector ini lemah kalau test hanya membutuhkan result untuk invoice `INV-1042`.

Posisi nggak selalu buruk. Posisi yang tidak didokumentasikan sebagai requirement-lah yang bermasalah.

## Kapan pendekatan ini cocok dipakai?

Gunakan CSS saat menginspeksi live DOM, merawat suite lama, menangani third-party markup, atau bergantung pada supported DOM attribute yang memang nggak bisa dinyatakan built-in locator dengan jelas.

Gunakan `getByTestId` daripada raw `[data-testid="..."]` kalau tim mengadopsi Playwright test-ID contract. Cara itu menyampaikan intent dan mengikuti custom test-ID attribute yang mungkin sudah dikonfigurasi.

Untuk user workflow biasa, utamakan role, label, visible text, locator composition, atau test ID. Minta semantics atau testability yang lebih baik kalau CSS selector harus menyimpan structural route yang panjang.

Jangan memilih CSS karena terlihat lebih cepat. Browser, network, aplikasi, dan assertion time biasanya jauh lebih besar daripada micro-difference selector. Optimalkan makna, diagnosis, dan maintenance.

Jangan berasumsi ID selalu stabil, class selalu tidak stabil, atau data attribute pasti aman hanya dari penamaannya. Verifikasi cara aplikasi mengelolanya.

## Kalau gagal, mulai cek dari mana?

Misalnya selector ini tiba-tiba menemukan nol elemen:

```ts
page.locator('.btn.btn-primary.checkout-submit');
```

Periksa:

1. Apakah halaman dan state yang diharapkan sudah dimuat?
2. Clause mana yang berhenti cocok?
3. Apakah class berubah karena redesign atau build system?
4. Apakah control hilang, disabled, atau pindah ke context lain?
5. Apakah sekarang ada role, label, atau test ID yang lebih sesuai?
6. Apakah selector awal bergantung pada styling, bukan supported contract?

Kalau beberapa elemen cocok, jangan terus menambah ancestor sampai tersisa satu. Cari dulu user, domain, atau component context yang hilang.

Untuk structural selector, bandingkan expected ancestor chain dengan kondisi sekarang. Perbaiki kontraknya daripada menyalin path yang lebih panjang lagi.

### Shadow DOM boundary

Playwright locator, termasuk CSS locator, biasanya bekerja melalui open shadow root. XPath tidak menembus shadow root, dan closed shadow root tidak didukung. Zero match bisa berasal dari boundary limitation, bukan syntax error.

## Review hasil buatan AI

Saat AI mengusulkan CSS, tanyakan:

- DOM fact apa yang menjadi dependency setiap bagian selector?
- Apakah fact tersebut supported contract atau current implementation detail?
- Apakah ada generated ID, hashed class, atau positional wrapper?
- Apakah selector menemukan intended element atau cuma menemukan satu elemen?
- Bisakah role, label, text, composition, atau test ID menyatakan intent dengan lebih baik?
- Apakah `nth-child` menyembunyikan ambiguitas yang seharusnya diinvestigasi?
- Apakah AI menganggap class name pasti menyatakan product state?
- Apakah selector melewati shadow-root atau iframe boundary dengan benar?

Lebih pendek tidak selalu lebih baik, tapi setiap extra segment harus punya alasan.

## Coba cek pemahamanmu

Review tiga candidate selector untuk invoice scenario:

```css
.table-striped > tbody > tr:nth-child(2)
tr[data-state="overdue"]
[class*="overdue"]
```

Jelaskan:

1. DOM fact apa yang menjadi dependency setiap selector.
2. Harmless change apa yang bisa merusak atau mengubah maknanya.
3. Kesepakatan tim apa yang membuat attribute selector bisa dipercaya.
4. Kapan posisi menjadi kontrak yang benar.
5. User-facing locator apa yang perlu dipertimbangkan kalau visible text “Overdue” adalah bukti sebenarnya.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Selector pertama bergantung pada styling class, exact table hierarchy, dan posisi kedua. Selector itu hanya tepat kalau semua fact tersebut memang sedang diuji.
- `tr[data-state="overdue"]` bergantung pada tag row dan exact state attribute. Ini masuk akal kalau component team mendukung state contract tersebut dan test memang menginspeksinya.
- `[class*="overdue"]` bergantung pada partial class string dan bisa cocok dengan value lain; kontraknya paling nggak eksplisit.
- Posisi valid saat memeriksa ranking, sorting, atau ordered slot tertentu.
- Kalau customer-visible status menjadi kontrak, beri scope ke row yang relevan lalu cari exact visible status text.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membaca CSS selector umum, menyatakan maintenance dependency-nya, dan menjelaskan CSS fallback tanpa mencampur unique current match dengan durable test contract.

CSS syntax drill tetap menjadi Additional Practice dan tidak menghalangi completion Module 4. Lesson XPath berikutnya juga optional; gunakan kalau pekerjaanmu melibatkan suite legacy atau DOM relationship yang masih bergantung pada XPath.
