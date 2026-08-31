---
title: 'Gunakan CSS Selector Hanya Saat Dibutuhkan'
description: 'Pelajari cara membaca dan memperbaiki CSS selector saat memang perlu digunakan, tanpa menjadikannya pilihan utama untuk setiap locator.'
---

## Setelah lesson ini, kamu bisa

* membaca bentuk CSS selector yang paling sering muncul di automation code;
* menjelaskan bagian DOM atau attribute apa yang membuat sebuah CSS selector bekerja;
* membedakan attribute yang memang stabil untuk automation dengan class styling atau detail structure HTML;
* mengenali kapan CSS selector memang perlu digunakan sebagai fallback di Playwright; dan
* mendiagnosis locator yang tidak menemukan element atau menemukan lebih dari satu element tanpa membuat selector menjadi semakin panjang dan kompleks.

## Kenapa ini penting buat QA

Walaupun sudah menggunakan Playwright, kamu tetap akan menemukan CSS selector dalam banyak situasi:

* test lama masih memakai `#submit-order`;
* ada test yang menggunakan selector panjang hasil copy dari DevTools;
* third-party widget sulit ditemukan lewat role, label, atau locator lain;
* production issue perlu dicek langsung lewat DOM; atau
* aplikasi belum punya attribute atau locator yang cukup stabil untuk automation.

Karena itu, kamu tetap perlu memahami CSS selector secukupnya untuk membaca, review, dan memperbaiki test yang sudah ada.

Tapi tujuan lesson ini bukan menghafal semua syntax CSS.

Yang perlu dihindari adalah menganggap selector semakin reliable hanya karena semakin panjang, atau karena kebetulan hanya menemukan satu element saat test dijalankan hari ini.

## Cara berpikir yang perlu kamu pegang

CSS selector bekerja berdasarkan detail yang ada di DOM:

```text
CSS selector
     ↓
Tag, ID, class, attribute, atau posisi yang digunakan
     ↓
Element yang cocok dengan detail tersebut
```

Karena itu, sebelum memakai CSS selector, cek dulu detail apa yang dijadikan dependency dan seberapa stabil detail tersebut.

CSS juga bukan otomatis menjadi pilihan berikutnya ketika role, label, atau text locator nggak cocok. Cek dulu apakah target masih bisa ditemukan lewat context yang lebih jelas, combination locator, atau `data-testid` yang memang sudah digunakan oleh tim.

Gunakan CSS ketika memang ada alasan yang jelas, misalnya halaman legacy, third-party component, atau attribute tertentu yang memang dijaga tetap stabil untuk automation.

| Bagian yang digunakan | Yang perlu dicek                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Tag                   | Apakah jenis element tersebut memang penting untuk scenario?                              |
| ID                    | Apakah ID-nya stabil atau generated setiap build/session?                                 |
| Class                 | Apakah class tersebut memang stabil, atau hanya digunakan untuk styling/framework?        |
| Attribute             | Siapa yang mengelolanya, dan apakah tim sepakat menjaga value-nya tetap stabil?            |
| Hierarchy             | Apakah hubungan parent-child memang penting, atau cuma mengikuti structure HTML saat ini? |
| Position              | Apakah urutan element memang bagian dari behavior yang diuji?                             |

Menemukan tepat satu element hari ini belum berarti selector tersebut akan tetap reliable setelah UI berubah.

## Coba kita bedah contoh nyata

Halaman invoice legacy belum punya markup yang cukup jelas untuk membedakan setiap row. Test suite saat ini memakai:

```ts
const overdueRows = page.locator('.invoice-table > tbody > tr:nth-child(2)');
```

Test data yang digunakan berisi dua invoice dengan status overdue. Risikonya adalah:

> Semua invoice yang berstatus overdue harus muncul di daftar overdue.

### 1. Baca asumsi dari selector yang ada

Selector tersebut bergantung pada:

* class `invoice-table`;
* `tbody` sebagai direct child;
* `tr` sebagai direct child; dan
* invoice overdue selalu berada di posisi kedua.

Masalahnya, nggak ada bagian dari selector tersebut yang benar-benar menunjukkan bahwa row itu adalah invoice overdue.

Kalau ada row baru, urutan berubah, atau structure HTML diubah, selector bisa menunjuk invoice yang berbeda padahal behavior aplikasinya masih sama.

### 2. Cek DOM untuk mencari attribute yang memang stabil

Misalnya aplikasi merender:

```html
<tr data-state="overdue">
  <td>INV-1042</td>
  <td>Overdue</td>
</tr>
```

Product team mengonfirmasi bahwa `data-state` memang digunakan untuk menunjukkan status invoice dan dijaga tetap stabil oleh component, bukan hanya attribute sementara untuk styling.

Dalam kondisi seperti ini, CSS selector yang lebih sederhana bisa digunakan:

```ts
const overdueRows = page.locator('tr[data-state="overdue"]');

await expect(overdueRows).toHaveCount(2);
```

CSS masih digunakan di sini, tapi ada alasan yang jelas: scenario memang perlu menemukan invoice berdasarkan status `overdue`, dan halaman belum punya locator lain yang lebih sesuai.

Kalau text **“Overdue”** yang tampil di UI memang menjadi bagian penting dari scenario, locator berbasis text mungkin lebih tepat.

Kalau `data-state` ternyata nggak dijamin stabil, lebih baik diskusikan penambahan `data-testid` atau perbaikan markup dengan developer daripada menganggap attribute tersebut aman untuk automation.

### 3. Pahami syntax CSS yang sering muncul

Kamu nggak perlu menghafal semua syntax CSS. Cukup pahami bentuk-bentuk yang sering muncul supaya kamu bisa membaca selector dan tahu bagian DOM apa yang dijadikan acuan.

```css
button                         /* tag */
#account-menu                  /* id */
.error-message                /* class */
[name="email"]                /* exact attribute */
input[type="email"]           /* tag + attribute */
.menu a                       /* descendant di level mana pun */
.menu > a                     /* direct child */
li:nth-child(3)               /* child ketiga jika berupa li */
```

Semakin banyak bagian yang ditambahkan ke selector, match memang bisa jadi lebih spesifik. Tapi semakin banyak juga detail DOM yang harus tetap sama supaya selector tersebut terus bekerja.

### 4. Bedakan class name dengan partial match

CSS class selector mencari class name yang sesuai:

```css
.error
```

Sedangkan attribute selector berikut hanya mencari text yang mengandung `error`:

```css
[class*="error"]
```

Selector kedua juga bisa match dengan class seperti `errorless`.

Karena itu, jangan gunakan partial match kalau yang sebenarnya dibutuhkan adalah class name atau attribute value yang exact.

### 5. Gunakan index hanya kalau memang penting

```css
.results > li:nth-child(1)
```

Selector ini masuk akal kalau requirement memang ingin mengecek result yang berada di urutan pertama.

Tapi kalau test hanya perlu menemukan invoice `INV-1042`, bergantung pada index justru membuat selector lebih mudah salah ketika urutan berubah.

Index bukan selalu pilihan yang buruk. Masalahnya muncul ketika test bergantung pada index, padahal index tersebut sebenarnya bukan bagian dari requirement.

## Kapan pendekatan ini cocok dipakai?

Gunakan CSS saat perlu mengecek DOM secara langsung, merawat test suite lama, menangani third-party markup, atau menggunakan attribute tertentu yang memang stabil tapi sulit ditemukan dengan built-in locator Playwright.

Kalau tim memang menggunakan test ID, lebih baik pakai `getByTestId()` daripada menulis `[data-testid="..."]` secara langsung. Selain lebih jelas, cara ini juga mengikuti konfigurasi test ID yang digunakan oleh project.

Untuk user flow biasa, tetap utamakan role, label, visible text, combination locator, atau test ID.

Kalau CSS selector sampai harus bergantung pada banyak parent, child, class, atau index, cek dulu apakah markup atau testability-nya bisa diperbaiki daripada terus membuat selector semakin panjang.

Jangan memilih CSS hanya karena kelihatannya lebih cepat. Dalam automation test, perbedaan performa antar-selector biasanya jauh lebih kecil dibanding waktu yang digunakan untuk membuka browser, menunggu network, menjalankan aplikasi, dan melakukan assertion.

Lebih penting memilih locator yang mudah dipahami, mudah di-debug, dan mudah di-maintain.

Jangan juga berasumsi bahwa ID pasti stabil, class pasti tidak stabil, atau `data-*` attribute pasti aman untuk automation hanya dari namanya. Cek dulu bagaimana attribute tersebut dibuat dan digunakan oleh aplikasi.

## Kalau gagal, mulai cek dari mana?

Misalnya selector ini tiba-tiba tidak menemukan element:

```ts
page.locator('.btn.btn-primary.checkout-submit');
```

Cek beberapa hal ini:

1. Apakah test sudah berada di halaman dan state yang benar?
2. Bagian mana dari selector yang sudah nggak match?
3. Apakah class berubah karena redesign atau perubahan dari build system?
4. Apakah element-nya hilang, disabled, atau pindah ke context lain?
5. Apakah sekarang ada role, label, atau test ID yang lebih sesuai?
6. Apakah selector awal terlalu bergantung pada styling?

Kalau selector menemukan beberapa element, jangan langsung menambah parent atau ancestor sampai hanya tersisa satu.

Cari dulu context yang bisa membedakan target yang benar, misalnya card, row, dialog, atau bagian halaman tertentu.

Kalau selector memang bergantung pada structure DOM, cek bagian structure mana yang berubah. Jangan langsung copy path yang lebih panjang dari DevTools. Perbaiki selector berdasarkan kondisi halaman yang sebenarnya dan kebutuhan test scenario.

### Perhatikan Shadow DOM dan iframe

Playwright locator, termasuk CSS locator, biasanya bisa menemukan element di dalam open shadow root. Tapi XPath tidak bisa digunakan menembus shadow root, dan closed shadow root juga tidak didukung.

CSS dan XPath locator juga tidak langsung mencari element di dalam iframe. Kalau target ada di iframe, pastikan locator menggunakan frame yang tepat terlebih dahulu.

Jadi, kalau locator tidak menemukan element, masalahnya belum tentu ada di syntax selector. Bisa saja element tersebut berada di shadow root atau iframe yang belum ditangani dengan benar.

Saat review CSS selector, cek beberapa hal ini:

* Bagian DOM apa yang digunakan oleh selector?
* Apakah ID, class, atau attribute tersebut memang stabil?
* Apakah ada generated ID, hashed class, atau penggunaan index yang mudah berubah?
* Apakah selector benar-benar menemukan element yang dimaksud oleh scenario, atau hanya kebetulan menemukan satu element?
* Apakah role, label, text, combination locator, atau test ID bisa digunakan dengan lebih jelas?
* Apakah `nth-child()` hanya digunakan untuk menghindari locator yang menemukan beberapa element?
* Apakah selector menganggap class tertentu selalu menunjukkan product state?
* Kalau element berada di shadow root atau iframe, apakah locator sudah mengaksesnya dengan cara yang benar?

Selector yang lebih pendek belum tentu lebih baik. Tapi setiap bagian yang ditambahkan harus memang diperlukan untuk menemukan target yang tepat.

## Coba cek pemahamanmu

Review tiga CSS selector berikut untuk invoice scenario:

```css
.table-striped > tbody > tr:nth-child(2)
tr[data-state="overdue"]
[class*="overdue"]
```

Jelaskan:

1. Bagian DOM apa yang digunakan oleh masing-masing selector?
2. Perubahan UI atau DOM seperti apa yang bisa membuat selector tersebut fail atau menunjuk element yang berbeda?
3. Apa yang perlu dikonfirmasi dengan tim sebelum `data-state="overdue"` dianggap cukup stabil untuk automation?
4. Kapan penggunaan index seperti `nth-child(2)` memang sesuai dengan requirement?
5. Kalau text **“Overdue”** yang tampil ke user memang penting untuk scenario, locator lain apa yang sebaiknya dipertimbangkan?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Selector pertama bergantung pada class `table-striped`, structure table yang exact, dan row di index kedua. Selector seperti ini hanya masuk akal kalau detail tersebut memang penting untuk requirement.
* `tr[data-state="overdue"]` bergantung pada tag `tr` dan attribute `data-state="overdue"`. Selector ini bisa digunakan kalau tim memang menjaga attribute tersebut tetap stabil dan test memang perlu menemukan invoice berdasarkan status itu.
* `[class*="overdue"]` hanya mencari class yang mengandung text `overdue`, jadi bisa ikut match dengan value lain yang sebenarnya tidak dimaksud.
* Menggunakan index masuk akal kalau test memang mengecek ranking, sorting, atau item pada urutan tertentu.
* Kalau status **“Overdue”** yang tampil ke user memang penting untuk scenario, tentukan dulu row yang tepat lalu verify text **“Overdue”** di dalam row tersebut.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membaca CSS selector yang umum digunakan, memahami detail DOM yang membuat selector tersebut bekerja, dan menentukan kapan CSS memang layak digunakan sebagai fallback.

Basic Practice untuk CSS syntax tetap tersedia kalau kamu ingin latihan tambahan, tapi tidak wajib untuk menyelesaikan Module 4.

Lesson berikutnya tentang XPath juga optional. Lesson tersebut lebih relevan kalau kamu bekerja dengan test suite legacy atau locator yang masih banyak bergantung pada XPath.
