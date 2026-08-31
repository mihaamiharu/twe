---
title: 'Gunakan XPath Hanya Saat Memang Dibutuhkan'
description: 'Pelajari cara membaca, memperbaiki, dan memigrasikan XPath dari test legacy, tanpa menjadikannya pilihan utama untuk test Playwright baru.'
---

## Setelah lesson ini, kamu bisa

* membaca bentuk XPath yang sering ditemukan di automation code;
* menjelaskan kenapa absolute XPath biasanya mudah rusak ketika structure halaman berubah;
* menentukan kapan XPath yang sudah ada cukup diperbaiki dan kapan sebaiknya dimigrasikan;
* mengubah XPath yang bergantung pada hubungan antar-element menjadi locator Playwright yang menggunakan scope yang jelas; dan
* mendiagnosis XPath yang gagal karena text, index, multiple match, iframe, atau shadow root.

## Kenapa ini penting buat QA

Pernah nggak kamu masuk ke tim baru lalu menemukan banyak Selenium test dengan XPath seperti ini?

```xpath
//tr[td[normalize-space()='ORD-1042']]//button[normalize-space()='Refund']
```

Menulis ulang seluruh test suite saat itu juga mungkin nggak realistis. Test tersebut masih digunakan dan tetap perlu dirawat.

Sebagai QA, kamu perlu bisa membaca element apa yang dicari oleh XPath, mengecek kenapa locator-nya fail, lalu menentukan apakah cukup diperbaiki atau lebih baik dimigrasikan ke locator Playwright.

Memahami XPath membantu kita menjaga test coverage yang sudah ada. Tapi untuk Playwright test baru, XPath biasanya bukan pilihan utama karena Playwright sudah menyediakan locator yang lebih dekat dengan cara user mengenali element, seperti role, label, text, dan locator composition.

Lesson ini optional. Kamu nggak perlu bisa menulis XPath dari ingatan untuk menyelesaikan Module 4.

## Cara berpikir yang perlu kamu pegang

XPath mencari element berdasarkan posisi atau hubungannya di dalam DOM:

```text
Element yang menjadi titik awal
              ↓
Kondisi atau hubungan yang digunakan
              ↓
Element target
```

Coba baca XPath berikut dari kiri ke kanan:

```xpath
//tr[td[normalize-space()='ORD-1042']]/td[4]
```

* `//tr` mencari element `tr` di bawah context saat ini;
* `[td[...]]` menyaring row yang punya cell sesuai kondisi di dalamnya;
* `normalize-space()='ORD-1042'` membandingkan text setelah whitespace di awal, akhir, dan antar-kata dirapikan; dan
* `/td[4]` memilih cell keempat yang menjadi direct child dari setiap row yang cocok.

XPath tersebut bisa menemukan target yang tepat hari ini, tapi belum tentu tetap reliable setelah markup berubah.

Expression yang spesifik tetap bisa mudah rusak. Cek apakah tag, posisi, dan hubungan antar-element yang digunakan memang penting untuk scenario, atau hanya kebetulan mengikuti structure HTML saat ini.

Di lesson ini, fokus kita adalah memahami target yang ingin ditemukan, lalu menjaga intent tersebut saat XPath diperbaiki atau dimigrasikan.

## Coba kita bedah contoh nyata

Sebuah test lama digunakan untuk melakukan refund pada order tertentu:

```ts
const refund = page.locator(
  "xpath=//tr[td[normalize-space()='ORD-1042']]//button[normalize-space()='Refund']",
);

await refund.click();
```

Tujuan test sebenarnya adalah:

> Di dalam row untuk order `ORD-1042`, klik button **Refund**.

### 1. Pisahkan tujuan test dari syntax XPath

Untuk scenario ini, hubungan yang dibutuhkan adalah:

```text
Row untuk order ORD-1042
            ↓
Button Refund di dalam row tersebut
```

Kalau table-nya punya semantic yang benar, tujuan yang sama bisa ditulis dengan locator Playwright:

```ts
const orderRow = page.getByRole('row').filter({
  has: page.getByRole('cell', {
    name: 'ORD-1042',
    exact: true,
  }),
});

await orderRow.getByRole('button', { name: 'Refund' }).click();
```

Versi ini memilih row berdasarkan cell dengan order ID yang exact, lalu mencari button **Refund** hanya di dalam row tersebut.

Intent test jadi lebih mudah dibaca karena locator-nya langsung menunjukkan row, cell, dan button yang digunakan. Test juga nggak lagi bergantung pada cara XPath menangani whitespace.

### 2. Tetap verify hasil setelah action

XPath lama dan locator penggantinya hanya menjelaskan element mana yang diklik. Keduanya belum membuktikan bahwa refund berhasil diproses.

Tambahkan assertion untuk hasil yang memang perlu dilihat oleh test:

```ts
await expect(page.getByRole('status')).toHaveText(
  'Refund requested for ORD-1042',
);
```

Migration belum selesai kalau kita hanya mengganti syntax locator tetapi menghilangkan assertion, atau menambahkan expected result yang sebenarnya nggak ada di product requirement.

### 3. Pahami bentuk XPath yang sering muncul

Kamu nggak perlu menghafal seluruh grammar XPath. Cukup pahami bentuk yang sering muncul di test legacy supaya kamu bisa membaca dependency-nya.

```xpath
//button
//input[@name='email']
//tr[td[normalize-space()='ORD-1042']]
//label[normalize-space()='Email']/following-sibling::input[1]
//button[@type='submit' and not(@disabled)]
(//button)[3]
```

| Bentuk                | Artinya                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `//`                  | Mencari descendant dari context saat ini                                 |
| `@name`               | Membaca attribute `name`                                                 |
| `[...]`               | Menyaring element berdasarkan kondisi                                    |
| `normalize-space()`   | Merapikan whitespace sebelum text dibandingkan                           |
| `following-sibling::` | Mencari sibling setelah element saat ini dengan parent yang sama          |
| `not(...)`            | Memilih element yang tidak memenuhi kondisi di dalamnya                   |
| `[1]`                 | Memilih node pertama dari sequence tempat index tersebut digunakan        |

Posisi tanda kurung bisa mengubah hasil XPath.

```xpath
//button[1]
(//button)[1]
```

`//button[1]` menerapkan index pada step `button` di masing-masing context, sehingga hasilnya masih bisa lebih dari satu button. `(//button)[1]` mengumpulkan semua button yang cocok terlebih dahulu, lalu memilih hasil pertama.

Karena itu, jangan menganggap semua penggunaan `[1]` punya arti yang sama.

### 4. Hindari absolute XPath

```xpath
/html/body/div[2]/main/div[1]/form/button
```

XPath ini bergantung pada seluruh route dari root document sampai ke target. Setiap wrapper dan index harus tetap berada di posisi yang sama.

Kalau layout berubah atau wrapper baru ditambahkan, XPath bisa fail walaupun button yang dibutuhkan user masih ada dan tetap berfungsi.

Relative XPath yang dimulai dari identifier yang jelas biasanya lebih mudah dibaca dan dirawat. Tapi relative XPath juga nggak otomatis reliable.

```xpath
//div[4]/div[2]
```

Expression tersebut tetap bergantung pada tag dan posisi tanpa menjelaskan element apa yang sebenarnya dibutuhkan oleh scenario.

## Kapan pendekatan ini cocok dipakai?

Gunakan XPath ketika kamu perlu merawat test suite yang sudah ada, menginvestigasi hubungan antar-element pada legacy DOM, atau membuat solusi sementara sambil menunggu perbaikan markup atau testability.

Pertimbangkan migration kalau role, label, visible text, filter, atau test ID bisa menjelaskan target dengan lebih jelas. Prioritaskan XPath yang sering fail atau berada di area product yang sering berubah.

Kamu nggak harus menulis ulang semua XPath yang masih stabil hanya supaya seluruh suite terlihat lebih modern.

Untuk Playwright test baru, jangan langsung memilih XPath hanya karena lebih mudah berpindah ke parent atau sibling. Locator composition dan `filter({ has })` biasanya bisa menunjukkan context dan target dengan lebih jelas.

Hindari partial match yang terlalu umum seperti:

```xpath
//div[contains(@class, 'item')]
```

`contains()` hanya mengecek apakah attribute `class` mengandung text `item`. Akibatnya, class seperti `items` atau `unwanted-item` juga bisa ikut match.

Kalau class name memang sengaja digunakan sebagai identifier yang stabil, CSS class selector seperti `.item` biasanya lebih jelas karena mencari class token, bukan sekadar substring.

## Kalau gagal, mulai cek dari mana?

Misalnya XPath untuk button **Refund** sekarang tidak menemukan element.

Cek beberapa hal ini:

1. Apakah test sudah berada di halaman order dan table-nya sudah ter-load?
2. Apakah order `ORD-1042` memang ada di test data yang digunakan?
3. Apakah text **Refund** berubah karena locale atau perubahan wording dari product?
4. Apakah button dipindahkan ke luar row atau ke component lain?
5. Apakah `normalize-space()` masih sesuai dengan structure text yang sekarang?
6. Apakah target berada di iframe atau shadow root?

XPath tidak bisa menembus shadow root di Playwright. Closed shadow root juga tidak didukung oleh locator biasa.

XPath, seperti CSS locator, juga tidak langsung mencari element di dalam iframe. Kalau target berada di iframe, gunakan frame context yang benar terlebih dahulu. Mengganti XPath dengan expression lain nggak akan menyelesaikan boundary tersebut.

Kalau XPath menemukan beberapa element, cari context apa yang masih kurang. Jangan langsung menambahkan `[1]` kalau posisi pertama bukan bagian dari requirement, karena test bisa melakukan action pada record yang salah.

Kalau XPath terus rusak setiap markup berubah, migration atau perbaikan testability di product mungkin lebih berguna daripada menambahkan patch baru lagi.

Saat review atau memperbaiki XPath, cek beberapa hal ini:

* Element atau record apa yang sebenarnya ingin ditemukan oleh scenario?
* Apakah setiap axis, kondisi, dan index memang diperlukan?
* Apakah `contains()` bisa match dengan class atau text lain yang nggak dimaksud?
* Apakah `text()` mengasumsikan text berada langsung di dalam element, padahal mungkin ada nested element?
* Apakah `normalize-space()` hanya merapikan whitespace, atau malah menyembunyikan perubahan wording?
* Apakah role, label, filter, atau test ID bisa menjelaskan target dengan lebih jelas?
* Apakah `[1]` ditambahkan hanya supaya multiple match hilang?
* Apakah target berada di iframe atau shadow root?
* Setelah migration, apakah test masih verify hasil yang sama?

XPath yang berhasil menemukan element belum tentu memilih target yang benar untuk scenario.

## Coba cek pemahamanmu

Review XPath berikut:

```xpath
(//button[contains(@class, 'delete')])[1]
```

Scenario perlu menghapus invoice `INV-778` dari table yang punya banyak button **Delete**.

Jelaskan:

1. Kenapa XPath tersebut bisa memilih button yang salah?
2. Informasi apa yang masih kurang untuk menentukan invoice yang tepat?
3. Bagaimana XPath bisa diperbaiki sementara supaya mencari row `INV-778` terlebih dahulu?
4. Bagaimana intent yang sama bisa ditulis dengan locator Playwright?
5. Hasil apa yang perlu diverifikasi setelah invoice dihapus?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* XPath tersebut menggunakan partial class match dan memilih button pertama di seluruh hasil. Nggak ada bagian yang menunjukkan invoice `INV-778`.
* Context yang masih kurang adalah row dengan invoice number `INV-778` secara exact.
* Untuk sementara, XPath bisa mencari row yang berisi `INV-778`, lalu mencari button **Delete** hanya di dalam row tersebut tanpa menggunakan global `[1]`.
* Di Playwright, cari row berdasarkan role, filter dengan cell `INV-778` secara exact, lalu cari button **Delete** di dalam row tersebut.
* Setelah action, verify bahwa invoice `INV-778` sudah tidak ada di table atau confirmation khusus untuk invoice tersebut muncul, sesuai product requirement.

Kalau table atau row belum punya semantic atau identifier yang cukup jelas, mungkin dibutuhkan perbaikan markup atau penambahan test ID sebelum locator yang reliable bisa dibuat.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membaca bentuk XPath yang umum ditemukan di test legacy, menginvestigasi kenapa XPath fail, dan menjaga tujuan test saat locator diperbaiki atau dimigrasikan.

Lesson ini optional dan tidak wajib untuk menyelesaikan Module 4. Standalone Practice tentang XPath juga hanya digunakan sebagai latihan tambahan.

Setelah tiga Core lesson dan dua Core Practice di Module 4 selesai, kamu bisa lanjut ke Module 5 untuk menggunakan locator dalam action, navigation, dan synchronization.
