---
title: 'Rawat XPath Tanpa Menjadikannya Default Modern'
description: 'Baca, diagnosis, dan migrasikan XPath legacy sambil mengenali kasus terbatas ketika XPath masih menjadi jembatan yang praktis.'
---

## Setelah lesson ini, kamu bisa

- membaca relative XPath yang dibentuk dari descendant, attribute, predicate, dan relationship;
- menjelaskan kenapa absolute XPath biasanya menjadi automation contract yang rapuh;
- mengenali kapan merawat XPath masih praktis dan kapan migration lebih bernilai;
- menerjemahkan relationship-based XPath menjadi locator composition Playwright; dan
- mendiagnosis failure XPath yang melibatkan text, position, multiple match, atau shadow DOM.

## Kenapa ini penting buat QA

Pernah nggak sih kamu masuk ke tim baru lalu menemukan ratusan Selenium test seperti ini?

```xpath
//tr[td[normalize-space()='ORD-1042']]//button[normalize-space()='Refund']
```

Menulis ulang seluruh suite saat itu juga mungkin nggak realistis. Kamu tetap harus memahami elemen apa yang dipilih, menginvestigasi failure, lalu menentukan apakah local repair atau migration memberi value lebih besar.

XPath literacy membantu kamu menjaga risk coverage yang sudah ada. Menjadikan XPath default untuk Playwright test baru justru membawa DOM dependency lama ke tool yang sudah menyediakan user-facing contract lebih jelas.

Lesson ini optional karena menulis XPath dari ingatan bukan syarat menyelesaikan modern locator path.

## Cara berpikir yang perlu kamu pegang

XPath menjelaskan route atau relationship di dalam live document tree:

```text
Candidate anchor
      ↓
Predicate atau relationship
      ↓
Target node
```

Baca expression ini dari kiri ke kanan:

```xpath
//tr[td[normalize-space()='ORD-1042']]/td[4]
```

- `//tr` mencari descendant table row;
- `[td[...]]` mempertahankan row yang punya cell dengan nested condition tersebut;
- `normalize-space()='ORD-1042'` membandingkan normalized string content; dan
- `/td[4]` memilih direct cell keempat dari setiap row yang tersisa.

Expression bisa sangat presisi hari ini, tapi tetap menjadi kontrak jangka panjang yang lemah. Precision menjelaskan current match; resilience bergantung pada apakah relationship yang ditulis memang menyatakan product meaning yang stabil.

Tujuan lesson ini adalah menjaga meaning saat maintenance, bukan menghafal grammar XPath. Baca anchor, relationship, target, dan evidence, lalu bandingkan apakah Playwright contract yang lebih jelas bisa menyatakan intent yang sama.

## Coba kita bedah contoh nyata

Test lama melakukan refund untuk satu order:

```ts
const refund = page.locator(
  "xpath=//tr[td[normalize-space()='ORD-1042']]//button[normalize-space()='Refund']",
);

await refund.click();
```

Makna yang sebenarnya adalah:

> Di row untuk order ORD-1042, aktifkan button Refund.

### 1. Pisahkan makna yang berguna dari XPath syntax

Relationship yang berguna bukan “descendant `tr` dengan descendant `td`.” Maknanya adalah:

```text
Order row yang dikenali lewat order ID
                  ↓
Refund action di dalam row tersebut
```

Makna itu biasanya bisa dinyatakan langsung dengan Playwright:

```ts
const orderRow = page.getByRole('row').filter({
  has: page.getByRole('cell', {
    name: 'ORD-1042',
    exact: true,
  }),
});

await orderRow.getByRole('button', { name: 'Refund' }).click();
```

Versi migration menunjukkan row, cell, dan button semantics. Ia juga tidak lagi mengikat action ke whitespace handling milik XPath.

### 2. Tambahkan observable evidence

Baik locator lama maupun baru belum membuktikan refund berhasil. Pertahankan outcome skenarionya:

```ts
await expect(page.getByRole('status')).toHaveText(
  'Refund requested for ORD-1042',
);
```

Migration belum selesai kalau hanya mengganti selector syntax lalu menghilangkan atau mengarang assertion.

### 3. Baca bentuk yang kemungkinan kamu temui

```xpath
//button
//input[@name='email']
//tr[td[normalize-space()='ORD-1042']]
//label[normalize-space()='Email']/following-sibling::input[1]
//button[@type='submit' and not(@disabled)]
(//button)[3]
```

| Bentuk                | Makna                                                    |
| --------------------- | -------------------------------------------------------- |
| `//`                  | Mencari descendant dari current context                  |
| `@name`               | Membaca attribute                                        |
| `[...]`               | Memfilter candidate dengan predicate                     |
| `normalize-space()`   | Melakukan trim dan collapse whitespace pada string value |
| `following-sibling::` | Berpindah ke sibling berikutnya dengan parent yang sama  |
| `not(...)`            | Membalik condition                                       |
| `[1]`                 | Node pertama pada selected sequence saat ini             |

Tanda kurung bisa mengubah sequence mana yang terkena index. `//button[1]` dan `(//button)[1]` tidak selalu menjelaskan set yang sama.

### 4. Hindari absolute document route

```xpath
/html/body/div[2]/main/div[1]/form/button
```

Path ini membuat setiap wrapper dan index menjadi bagian kontrak. Layout change bisa merusaknya walaupun user behavior yang sama masih tersedia.

Relative XPath yang di-anchor ke meaningful identifier mungkin lebih mudah dibaca dan dirawat, tapi kata “relative” tidak otomatis berarti robust. `//div[4]/div[2]` tetaplah positional structure tanpa domain meaning.

## Kapan pendekatan ini cocok dipakai?

Gunakan XPath saat merawat suite yang sudah ada, menginvestigasi relationship tidak biasa di legacy DOM, atau membuat short-lived bridge sambil menunggu perbaikan semantics atau testability contract.

Lakukan migration saat role, label, visible-content locator, filter, atau test ID bisa menyatakan intent yang sama dengan lebih jelas. Prioritaskan area yang sering gagal atau sering berubah daripada menulis ulang semua legacy expression yang stabil hanya demi style.

Jangan memperkenalkan XPath ke Playwright scenario baru hanya karena parent atau sibling navigation terasa nyaman. Locator composition dan `filter({ has })` biasanya menjaga relationship lebih dekat dengan user atau domain meaning.

Hindari partial match yang terlalu luas seperti:

```xpath
//div[contains(@class, 'item')]
```

Expression ini memeriksa substring, bukan class token. Artinya, class `items` atau `unwanted-item` juga bisa ikut cocok. Kalau class memang supported contract, token-aware match atau CSS class syntax lebih jelas.

## Kalau gagal, mulai cek dari mana?

Misalnya refund XPath sekarang menghasilkan nol node.

Periksa:

1. Apakah test sudah mencapai order table dan memuat expected data?
2. Apakah `ORD-1042` masih ada, atau test data/setup-nya salah?
3. Apakah visible Refund wording berubah karena locale atau product copy?
4. Apakah button pindah ke luar row atau ke component lain?
5. Apakah whitespace normalization sesuai dengan text structure yang sebenarnya?
6. Apakah target berada di iframe atau shadow root?

XPath tidak menembus shadow root di Playwright. Closed shadow root juga tidak didukung normal locator. XPath, seperti CSS, tidak menembus boundary iframe; pilih frame context yang benar lebih dulu. Berpindah dari satu XPath expression ke expression lain nggak akan memperbaiki boundary tersebut.

Kalau beberapa node cocok, cari domain context yang hilang. Menambahkan `[1]` tanpa membuktikan bahwa first position memang penting bisa diam-diam mengoperasikan record yang salah.

Kalau XPath rusak setiap markup bergeser, migration atau perbaikan product testability mungkin jauh lebih bernilai daripada local patch berikutnya.

Saat me-review atau memperbaiki XPath, tanyakan:

- Makna user atau domain apa yang sedang didekati expression tersebut?
- Apakah setiap axis, predicate, dan index punya alasan?
- Apakah `contains()` melakukan partial class atau text match yang tidak aman?
- Apakah `text()` berasumsi direct text node saat nested content mungkin ada?
- Apakah `normalize-space()` hanya menyelesaikan whitespace, atau malah menyembunyikan wording change?
- Bisakah role, label, filter, atau test ID menyatakan relationship dengan lebih baik?
- Apakah `[1]` ditambahkan hanya untuk menghilangkan multiple match?
- Apakah expression terhalang iframe atau shadow root?
- Apakah skenario tetap meng-assert intended result setelah migration?

Expression yang berhasil dievaluasi belum tentu menjadi test contract yang tepat.

## Coba cek pemahamanmu

Review XPath ini:

```xpath
(//button[contains(@class, 'delete')])[1]
```

Intent-nya adalah menghapus invoice `INV-778` dari table yang memiliki banyak Delete button.

Jelaskan:

1. Asumsi apa yang membuat expression ini berisiko?
2. Domain identity apa yang hilang?
3. Bagaimana relationship-based XPath bisa memperbaikinya untuk sementara?
4. Bagaimana kamu menyatakan intent dengan Playwright locator?
5. Result apa yang perlu di-assert setelah action?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Expression bergantung pada partial class match dan first document position. Nggak ada yang mengenali invoice `INV-778`.
- Context yang hilang adalah invoice row dengan exact invoice number tersebut.
- Temporary XPath bisa mencari row yang berisi `INV-778` lebih dulu, lalu menemukan Delete button di dalamnya tanpa global `[1]`.
- Di Playwright, cari row berdasarkan role, filter dengan exact invoice cell, lalu cari Delete button di dalam row tersebut.
- Assert invoice `INV-778` hilang atau invoice-specific confirmation muncul, sesuai product requirement.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membaca dan mendiagnosis bentuk XPath yang umum di legacy automation, menjaga domain meaning saat migration, dan menjelaskan kenapa relative syntax saja nggak menjamin resilience.

Lesson optional ini dan standalone XPath practice apa pun tidak menghalangi completion Module 4. Setelah tiga Core lesson dan dua Core Practice selesai, kamu siap masuk Module 5 untuk memakai reliable locator dalam action, navigation, dan synchronization.
