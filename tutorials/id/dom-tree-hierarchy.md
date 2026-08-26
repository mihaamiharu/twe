---
title: 'Membaca DOM Aktif dan State UI'
description: 'Gunakan hierarki yang bermakna dan transisi state untuk memahami UI yang berulang dan terus berubah.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan perbedaan antara HTML awal, DOM aktif, dan UI yang terlihat;
- memakai hubungan parent, child, ancestor, descendant, dan sibling untuk menjelaskan konteks halaman;
- membatasi kontrol yang berulang ke produk, row, dialog, atau region yang tepat;
- menjelaskan interaksi sebagai transisi state sebelum–aksi–sesudah; serta
- mendiagnosis ambiguitas karena elemen berulang atau proses render ulang.

## Kenapa ini penting buat QA

Coba bayangin sebuah halaman keranjang punya tiga button bernama “Remove.” Saat testing manual, kamu tahu button mana yang dimiliki “Mechanical Keyboard” karena posisinya ada di dalam row produk tersebut.

Otomasi nggak bisa dengan aman memilih “button Remove yang pertama.” Urutannya bisa berubah, produk baru bisa disisipkan, atau halaman bisa mengganti row setelah harga diperbarui.

Masalahnya bukan karena halaman punya button yang berulang. Itu hal yang normal. Masalah muncul saat kita kehilangan konteks bermakna yang menghubungkan setiap aksi ke data yang tepat.

Supaya bisa mengotomasi UI modern dengan andal, QA perlu membaca halaman sebagai pohon yang aktif dan memikirkan bagaimana pohon itu berubah.

## Cara berpikir yang perlu kamu pegang

Document Object Model (DOM) adalah model objek halaman yang sedang aktif di browser. DOM bukan:

- screenshot tampilan halaman;
- component tree internal milik React, Vue, atau framework lain; atau
- sekadar teks HTML yang pertama kali dikirim server.

JavaScript bisa menambah, menghapus, mengurutkan ulang, atau mengganti node DOM setelah response awal. Atribut dan property juga bisa berubah. DOM saat ini adalah struktur yang dipakai otomasi pada saat itu.

Di dalam pohon tersebut:

| Hubungan   | Artinya                                              |
| ---------- | ---------------------------------------------------- |
| Parent     | Elemen yang langsung membungkus elemen lain          |
| Child      | Elemen yang berada langsung di dalam elemen lain     |
| Ancestor   | Semua elemen pembungkus yang posisinya lebih tinggi  |
| Descendant | Semua elemen di dalamnya yang posisinya lebih rendah |
| Sibling    | Elemen-elemen yang punya parent yang sama            |

![Pohon DOM keranjang memakai row produk sebagai konteks bermakna, lalu berubah setelah satu produk dihapus.](/images/tutorials/live-dom-context.svg)

_Jalur yang berguna adalah “button Remove di dalam row Mechanical Keyboard,” bukan semua wrapper dari root halaman sampai button._

Pegang dua aturan ini:

1. **Batasi berdasarkan makna.** Gunakan row produk, dialog, navigation region, atau container lain yang bisa dikenali sebagai konteks.
2. **Amati transisinya.** Jelaskan apa yang ada sebelum aksi dan apa yang seharusnya ada setelahnya.

## Coba kita bedah contoh nyata

Perhatikan keranjang sederhana berikut:

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

Kedua elemen `<li>` adalah sibling. Heading, quantity, dan button di masing-masing row adalah descendant dari satu row produk. Row itulah yang memberi konteks tambahan untuk “Remove.”

Tulis dulu tujuan testing-nya:

```text
Sebelum: keranjang berisi Mechanical Keyboard dan Wireless Mouse
Aksi: hapus Mechanical Keyboard
Sesudah: row keyboard sudah tidak ada dan row mouse tetap ada
```

Setelah itu, test Playwright bisa mempertahankan hubungan tersebut:

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

Ide pentingnya bukan syntax persisnya. Test mencari container yang bermakna, menemukan aksi di dalamnya, lalu mengamati transisinya.

Playwright locator juga mencari elemen pada DOM saat action atau assertion dijalankan. Kalau framework melakukan render ulang di antara dua operasi, locator akan mencari elemen terbaru yang masih cocok. Ini lebih aman daripada menganggap referensi elemen mentah dari beberapa saat sebelumnya akan selalu mewakili halaman yang sama.

### State dinamis adalah bagian dari pohon

Satu layar bisa melewati beberapa state:

```text
loading → populated → updating → populated
                    ↘ error
```

State penting bisa berupa:

- konten loading, empty, error, dan populated;
- kontrol enabled, disabled, checked, selected, atau expanded;
- dialog, menu, dan overlay yang baru dipasang belakangan;
- row yang ditambah, dihapus, atau diurutkan ulang setelah data berubah.

Test perlu membuktikan state yang relevan bagi pengguna. Nama component internal atau CSS class sembarang biasanya belum menjadi bukti yang cukup.

## Kapan pendekatan ini cocok dipakai?

Gunakan hierarki DOM sebagai konteks bermakna saat halaman berisi card, row, list item, section, dialog, atau kontrol berulang dengan nama yang sama.

Jangan menuliskan setiap wrapper sebagai jalur CSS atau XPath yang panjang. Container layout sering ditambah saat redesign walaupun perilaku pengguna nggak berubah. Hierarki baru berguna kalau container-nya sendiri menjelaskan makna produk.

API browser seperti `parentElement`, `children`, dan `querySelectorAll` berguna untuk belajar dan melakukan inspeksi di DevTools. Di dalam test Playwright, utamakan locator dan filter yang menjaga makna dari sudut pandang pengguna. Traversal DOM mentah adalah teknik investigasi, bukan arsitektur test default.

Pilihan berdasarkan posisi seperti `first()` atau `nth(0)` hanya tepat ketika urutan memang menjadi bagian dari requirement. Jangan pakai keduanya sebagai jalan pintas untuk target yang ambigu.

## Kalau gagal, mulai cek dari mana?

Coba bayangin action berikut gagal karena menemukan dua elemen:

```ts
await page.getByRole('button', { name: 'Remove' }).click();
```

Kegagalan ini sebenarnya memberi bukti yang berguna: deskripsi target di dalam test belum lengkap.

Mulai investigasi dengan urutan berikut:

1. Ada berapa button yang cocok di halaman aktif?
2. Produk, row, dialog, atau region mana yang memiliki button tujuan?
3. Apakah container itu punya identitas yang menghadap pengguna dan cukup stabil?
4. Apakah UI masih loading atau mengganti row ketika test berjalan?
5. State sebelum dan sesudah apa yang membuktikan row yang benar sudah berubah?

Jalan pintas yang menggoda adalah:

```ts
await page.getByRole('button', { name: 'Remove' }).first().click();
```

Kode itu hanya menyembunyikan ambiguitas. Kalau urutan keranjang berubah, test bisa menghapus produk yang salah lalu tetap melanjutkan langkah berikutnya. Perbaiki konteks yang hilang.

Jalan pintas lemah lainnya adalah selector panjang seperti `#app > div > ul > li:nth-child(1) > button`. Selector tersebut merekam layout saat ini, bukan hubungan antardata di produk.

## Review hasil buatan AI

Test buatan AI sering menunjukkan apakah pembuatnya benar-benar memahami hubungan DOM. Cari tanda peringatan berikut:

- locator global untuk kontrol yang muncul berulang;
- `first()` atau `nth()` tanpa requirement urutan;
- jalur CSS atau XPath lengkap yang melewati wrapper layout;
- referensi elemen mentah yang disimpan melewati proses update;
- assertion yang memeriksa class, bukan state yang dilihat pengguna; atau
- klik tanpa bukti sebelum dan sesudah.

Sebelum menerima kodenya, minta AI menyebutkan container tujuan, ambiguitas yang sedang diselesaikan, dan transisi state yang diharapkan.

## Coba cek pemahamanmu

Halaman riwayat pesanan punya satu row untuk setiap order. Semua row memiliki button “Review.” Ketika diklik, button tersebut membuka dialog untuk order yang dipilih.

Kamu perlu me-review order `A104`. Coba jelaskan:

1. Container mana yang harus memberi konteks?
2. Aksi mana yang berada di dalam konteks tersebut?
3. Apa yang harus benar sebelum dan sesudah aksi?
4. Kenapa memilih button “Review” pertama berisiko?
5. Apa yang akan kamu periksa kalau dialog yang benar nggak terbuka?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Gunakan row dengan identitas order `A104` yang terlihat sebagai container bermakna.
- Temukan button “Review” di dalam row tersebut, bukan button global.
- Sebelum aksi, row `A104` harus ada dan dialog review-nya belum terbuka. Sesudah aksi, dialog yang menyebut order `A104` harus terlihat.
- Row pertama bisa berubah ketika order diurutkan, difilter, atau ditambah. Posisi nggak membuktikan identitas.
- Kalau dialog yang salah terbuka, periksa row di DOM aktif, identitas aksesibel row tersebut, jumlah kontrol yang cocok, dan apakah aplikasi mengganti atau mengurutkan ulang node saat aksi berlangsung.

Pendekatan lain bisa saja benar kalau produk menyediakan identitas stabil yang berbeda. Namun, aksi dan buktinya tetap harus terhubung ke order yang sama.

## Sebelum lanjut

Kamu sekarang seharusnya bisa menjelaskan di mana sebuah kontrol berada, kenapa konteks itu bermakna, dan bagaimana DOM aktif perlu berubah setelah interaksi—tanpa bergantung pada posisi atau jalur wrapper lengkap.

Di lesson berikutnya, kita akan memakai DevTools dan alat investigasi Playwright untuk mengumpulkan bukti tersebut dari halaman nyata sebelum memilih kode test.
