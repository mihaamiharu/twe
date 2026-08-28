---
title: 'Membaca DOM Aktif dan State UI'
description: 'Gunakan hierarki yang bermakna dan transisi state untuk memahami UI yang berulang dan terus berubah.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan perbedaan antara HTML awal, DOM yang sedang digunakan browser, dan UI yang terlihat oleh user;
- menggunakan hubungan `parent`, `child`, `ancestor`, `descendant`, dan `sibling` untuk memahami posisi dan konteks sebuah element;
- menentukan scope yang tepat ketika ada beberapa element dengan fungsi atau nama yang sama, misalnya di product card, table row, dialog, atau bagian halaman tertentu;
- menjelaskan perubahan state sebelum action dilakukan dan setelah action selesai; serta
- mendiagnosis masalah ketika automation menemukan lebih dari satu element yang cocok atau ketika DOM berubah setelah halaman di-render ulang.


## Kenapa ini penting buat QA

Coba bayangin halaman cart punya tiga button bernama **“Remove.”** Saat manual testing, kamu tahu button mana yang harus dipilih untuk **“Mechanical Keyboard”** karena button tersebut ada di product row yang sama.

Automation nggak bisa asal memilih **button Remove yang pertama**. Urutan produk bisa berubah, produk baru bisa ditambahkan, atau DOM bisa berubah setelah data di halaman di-update.

![Halaman cart menampilkan tiga row produk dengan button Remove yang sama, sementara row Mechanical Keyboard ditandai sebagai konteks target.](/images/tutorials/cart-row-context-ui.png)

Punya beberapa button dengan nama yang sama itu normal. Masalahnya muncul kalau automation nggak punya konteks yang cukup untuk tahu button mana yang berkaitan dengan produk yang ingin kita test.

Karena itu, QA perlu memahami struktur DOM dan bagaimana DOM bisa berubah setelah user berinteraksi dengan halaman.

## Cara berpikir yang perlu kamu pegang

**Document Object Model (DOM)** adalah struktur halaman yang dibentuk browser dari HTML dan digunakan saat halaman berjalan.

DOM bukan:

* screenshot dari tampilan halaman;
* component tree internal milik React, Vue, atau framework lain; atau
* sekadar HTML awal yang pertama kali diterima browser.

Setelah halaman dibuka, JavaScript bisa menambah, menghapus, memindahkan, atau mengganti element di DOM. Attribute dan property dari sebuah element juga bisa berubah.

Karena itu, struktur DOM yang kita lihat saat ini belum tentu sama dengan HTML awalnya. Automation akan berinteraksi dengan DOM sesuai kondisi halaman pada saat test dijalankan.

![HTML awal menjadi DOM aktif yang bisa di-update JavaScript, sementara framework component tree dan rendered UI tetap menjadi representasi yang berbeda.](/images/tutorials/live-dom-model.png)

DOM punya struktur seperti tree. Setiap element bisa punya hubungan dengan element lain:

| Hubungan   | Artinya                                                            |
| ---------- | ------------------------------------------------------------------ |
| Parent     | Element yang langsung membungkus element lain                      |
| Child      | Element yang langsung berada di dalam element lain                 |
| Ancestor   | Parent atau element lain di atasnya dalam struktur DOM             |
| Descendant | Child atau element lain yang berada di bawahnya dalam struktur DOM |
| Sibling    | Element yang punya parent yang sama                                |


![Pohon DOM keranjang memakai row produk sebagai konteks bermakna, lalu berubah setelah satu produk dihapus.](/images/tutorials/live-dom-context.svg)

Yang penting bukan mencari semua wrapper dari root halaman sampai button, tapi menemukan konteks yang tepat.

Contohnya:

> **button “Remove” yang ada di product row “Mechanical Keyboard”**

Pegang dua prinsip ini:

1. **Tentukan scope yang tepat.** Gunakan product row, dialog, navigation, atau container lain yang membantu automation menemukan element yang benar.
2. **Perhatikan perubahan state.** Tentukan kondisi sebelum action dilakukan dan expected result setelahnya.

## Coba kita bedah contoh nyata

Perhatikan cart sederhana berikut:

```html
<ul aria-label="Cart items">
  <li>
    <h2>Mechanical Keyboard</h2>
    <p>Quantity: 1</p>
    <button>Remove</button>
  </li>

  <li>
    <h2>Wireless Mouse</h2>
    <p>Quantity: 1</p>
    <button>Remove</button>
  </li>
</ul>
```

Kedua `<li>` tersebut adalah `sibling`.

Di dalam setiap product row ada heading, quantity, dan button **“Remove”**. Semua element tersebut adalah `descendant` dari row yang sama.

Karena ada dua button dengan nama **“Remove”**, nama button saja belum cukup. Product row memberi context tambahan supaya automation tahu button mana yang harus dipilih.

Sebelum menulis locator atau code, tentukan dulu test intent-nya:

```text
Before: cart berisi Mechanical Keyboard dan Wireless Mouse
Action: hapus Mechanical Keyboard
After: product row Mechanical Keyboard sudah tidak ada, sementara Wireless Mouse tetap ada
```

Setelah itu, test Playwright bisa menggunakan context yang sama:

```ts
const keyboardRow = page
  .getByRole('listitem')
  .filter({ hasText: 'Mechanical Keyboard' });

const mouseRow = page
  .getByRole('listitem')
  .filter({ hasText: 'Wireless Mouse' });

await keyboardRow.getByRole('button', { name: 'Remove' }).click();

await expect(keyboardRow).toHaveCount(0);
await expect(mouseRow).toHaveCount(1);
```

Yang penting bukan syntax-nya, tapi cara berpikirnya: cari dulu product row yang tepat, lakukan action di dalam row tersebut, lalu verify perubahan state setelah action selesai.

Playwright locator juga akan mencari element yang cocok saat action atau assertion dijalankan. Jadi kalau halaman melakukan re-render di antara dua step, locator akan mencari element terbaru yang masih sesuai.

Ini lebih aman daripada menyimpan element dari kondisi sebelumnya lalu menganggap element tersebut masih merepresentasikan halaman setelah DOM berubah.

### DOM bisa berubah mengikuti state halaman

Dalam satu flow, halaman bisa melewati beberapa state:

```text
loading → populated → updating → populated
                    ↘ error
```

State yang perlu diperhatikan misalnya:

* halaman sedang `loading`, `empty`, `error`, atau sudah menampilkan data;
* element dalam kondisi `enabled`, `disabled`, `checked`, `selected`, atau `expanded`;
* dialog, menu, atau overlay yang baru muncul setelah user melakukan action;
* row yang ditambahkan, dihapus, atau berubah urutan setelah data di-update.

Automated test perlu verify state yang memang relevan dari sisi user.

Nama internal component atau CSS class saja biasanya belum cukup untuk membuktikan bahwa expected result benar-benar tercapai.

## Kapan pendekatan ini cocok dipakai?

Gunakan struktur DOM sebagai context ketika halaman punya beberapa card, row, list item, section, dialog, atau element dengan nama yang sama.

Jangan langsung membuat CSS selector atau XPath yang panjang dengan mengikuti semua wrapper dari atas ke bawah. Struktur layout bisa berubah saat UI di-redesign, walaupun behavior yang diuji tetap sama.

Scope berdasarkan container akan lebih berguna kalau container tersebut memang membantu kita membedakan element yang ingin ditest. Misalnya, cari dulu product row **“Mechanical Keyboard”**, lalu cari button **“Remove”** di dalam row tersebut.

API browser seperti `parentElement`, `children`, dan `querySelectorAll` tetap berguna saat kita perlu memahami atau mengecek struktur DOM lewat DevTools.

Di Playwright, lebih baik gunakan locator dan filter yang tetap punya context yang jelas dari sisi user. Traversal DOM secara manual sebaiknya dipakai hanya saat memang diperlukan, bukan sebagai cara pertama untuk mencari element.

Method seperti `first()` atau `nth(0)` boleh digunakan kalau urutan element memang penting untuk scenario yang sedang ditest. Jangan pakai hanya karena locator menemukan lebih dari satu element.

## Kalau test fail, mulai cek dari mana?

Coba bayangin action berikut fail karena Playwright menemukan dua element yang cocok:

```ts
await page.getByRole('button', { name: 'Remove' }).click();
```

Ini berarti locator-nya belum cukup spesifik. Test belum memberi context yang cukup untuk menentukan button **“Remove”** mana yang harus dipilih.

Coba cek beberapa hal ini:

1. Ada berapa button **“Remove”** di halaman?
2. Button yang ingin dipilih ada di product row, dialog, atau bagian halaman yang mana?
3. Apakah bagian tersebut punya informasi yang cukup untuk membedakannya dari yang lain, misalnya nama produk?
4. Apakah halaman masih loading atau melakukan re-render saat test berjalan?
5. Setelah action dilakukan, perubahan apa yang harus diverifikasi untuk memastikan product row yang benar sudah berubah?

Jalan pintas yang sering terlihat praktis adalah:

```ts
await page.getByRole('button', { name: 'Remove' }).first().click();
```

Test mungkin jadi jalan, tapi kita belum menyelesaikan masalah sebenarnya. Kalau urutan produk berubah, `first()` bisa memilih button milik produk yang berbeda.

Lebih baik tambahkan context yang memang membedakan targetnya. Misalnya, cari dulu product row **“Mechanical Keyboard”**, lalu cari button **“Remove”** di dalam row tersebut.

Hal yang sama berlaku untuk selector panjang seperti:

```text
#app > div > ul > li:nth-child(1) > button
```

Selector seperti ini terlalu bergantung pada struktur halaman saat ini. Kalau wrapper atau urutan element berubah, selector bisa ikut rusak walaupun behavior yang ingin diuji sebenarnya tetap sama.

Sebelum memakai locator tersebut, cek dulu apakah masih ada masalah seperti ini:

* locator mencari element secara global padahal ada beberapa element dengan nama atau fungsi yang sama;
* memakai `first()` atau `nth()` hanya supaya test bisa jalan;
* CSS selector atau XPath terlalu panjang dan mengikuti banyak wrapper;
* menyimpan element lalu tetap menggunakannya setelah DOM berubah;
* assertion hanya mengecek CSS class, bukan state atau expected result yang dilihat user; atau
* melakukan click tanpa jelas kondisi sebelum action dan apa yang harus berubah setelahnya.

Sebelum lanjut memakai code tersebut, pastikan kamu bisa menjelaskan tiga hal: **element mana yang sebenarnya ingin dituju, kenapa locator sebelumnya menemukan lebih dari satu target, dan perubahan apa yang harus terjadi setelah action dilakukan.**

## Coba cek pemahamanmu

Halaman order history punya satu row untuk setiap order. Setiap row punya button **“Review”**. Ketika diklik, button tersebut akan membuka dialog untuk order yang dipilih.

Kamu ingin me-review order `A104`. Coba jawab:

1. Bagian mana yang sebaiknya digunakan sebagai context untuk menemukan order `A104`?
2. Action apa yang perlu dilakukan di dalam row tersebut?
3. Apa yang harus ada sebelum action dilakukan, dan apa yang harus berubah setelahnya?
4. Kenapa memilih button **“Review”** pertama bisa bermasalah?
5. Apa yang perlu dicek kalau dialog untuk order `A104` nggak terbuka?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* Gunakan row yang menampilkan order `A104` sebagai context.
* Cari button **“Review”** di dalam row tersebut, bukan langsung mencari button secara global.
* Sebelum action dilakukan, row `A104` harus ada dan dialog review belum terbuka. Setelah button diklik, dialog untuk order `A104` harus tampil.
* Jangan bergantung pada button pertama karena urutan order bisa berubah saat data di-sort, di-filter, atau ada order baru.
* Kalau dialog yang salah terbuka, cek apakah locator sudah mengarah ke row `A104`, ada berapa button **“Review”** yang cocok, dan apakah DOM berubah atau row di-render ulang saat action dilakukan.

Cara lain juga bisa benar kalau aplikasi punya identifier lain yang lebih stabil. Yang penting, action dan expected result tetap mengarah ke order yang sama.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menentukan context dari sebuah element, memahami kenapa context tersebut dibutuhkan, dan menjelaskan perubahan state yang harus terjadi setelah user melakukan action.

Di lesson berikutnya, kita akan menggunakan DevTools dan Playwright untuk mengecek langsung informasi tersebut dari halaman sebelum menentukan locator atau menulis test.
