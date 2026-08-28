---
title: 'Pilih Kontrak Locator yang Sesuai dengan Intent Test'
description: 'Pilih role, label, visible content, atau kontrak test eksplisit berdasarkan hal yang perlu dikenali skenario.'
---

## Setelah lesson ini, kamu bisa

- memilih locator Playwright berdasarkan makna yang harus dijaga oleh test;
- menjelaskan harmless change apa yang seharusnya bisa dilewati locator dan meaningful change apa yang seharusnya membuatnya gagal;
- memverifikasi accessible name, label, test ID, dan wording produk di live UI sebelum memilih kontrak;
- menjelaskan kenapa CSS atau XPath hanya menjadi fallback untuk target tertentu; dan
- mendiagnosis locator yang menemukan nol atau beberapa elemen sebelum melemahkannya.

## Kenapa ini penting buat QA

Coba bayangin AI membuat checkout test dengan locator seperti ini:

```ts
page.locator('div.checkout > div:nth-child(3) > button.primary');
```

Hari ini test-nya pass. Besok designer menambah wrapper, lalu test gagal padahal checkout masih berfungsi. Seseorang menyalin selector yang lebih panjang dari DevTools, test kembali hijau, lalu dianggap selesai.

Masalah sebaliknya juga berbahaya. Kalau button sungguhan kehilangan semantik button-nya, mengganti `getByRole('button')` dengan class CSS bisa membuat automation hijau sambil menyembunyikan accessibility regression.

Locator bukan sekadar jalan menuju elemen. Locator adalah keputusan tentang perubahan produk mana yang seharusnya berpengaruh pada test.

## Cara berpikir yang perlu kamu pegang

Anggap setiap locator sebagai kontrak antara intent QA dan halaman aktif:

```text
Makna apa yang harus bertahan dari harmless change?
                         ↓
Sinyal halaman mana yang menyatakan makna itu?
                         ↓
Perubahan apa yang seharusnya membuat test gagal?
```

Mulai dari intent test, bukan dari preferensi selector. Tentukan evidence yang perlu dijaga oleh test, lalu periksa live DOM dan accessibility information untuk melihat kontrak apa yang benar-benar tersedia.

![Keputusan locator dimulai dari intent test, lalu memilih kontrak yang menghadap pengguna, kontrak engineering, atau implementation fallback berdasarkan makna yang perlu dijaga.](/images/tutorials/locator-contract-decision.svg)

_Nggak ada locator ladder yang selalu berlaku. Kontrak yang tepat bergantung pada hal yang perlu dikenali test._

Gunakan sinyal halaman yang sesuai dengan risiko:

| Locator                     | Kontrak yang dinyatakan                    | Cocok saat                                                              |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `getByRole(role, { name })` | Semantic role dan accessible name          | Pengguna mengaktifkan atau mengenali control atau landmark              |
| `getByLabel(text)`          | Label yang terhubung dengan form control   | Hubungan label dan field memang penting                                 |
| `getByText(text)`           | Konten yang dilihat pengguna               | Wording atau pesan yang ditampilkan adalah bukti                        |
| `getByAltText(text)`        | Text alternative dari elemen seperti image | Tujuan yang disampaikan image memang penting                            |
| `getByPlaceholder(text)`    | Wording placeholder                        | Placeholder memang menjadi kontrak yang tersedia dan disengaja          |
| `getByTestId(id)`           | Kesepakatan engineering yang eksplisit     | Wording atau semantik pengguna nggak bisa mengenali target dengan jelas |
| `locator(css)`              | Hubungan DOM atau attribute                | Implementation fallback memang diperlukan                               |
| `locator('xpath=...')`      | Path atau hubungan DOM                     | Merawat markup legacy atau sangat sulit                                 |

Accessible name nggak selalu sama dengan text mentah di dalam elemen. Nilainya bisa berasal dari `label`, `aria-label`, `aria-labelledby`, alternative text image, atau contained content sesuai accessibility rules.

Test ID bisa reliable karena tim sepakat menjaganya. Test ID tidak membuktikan bahwa pengguna bisa memahami atau mengoperasikan elemen tersebut.

Sebelum menulis kode, sebutkan targetnya, evidence yang harus dihasilkan, dan meaningful change yang seharusnya membuat test gagal. Setelah itu, verifikasi bahwa live DOM memang menyediakan signal yang kamu pilih. Dengan begitu, review locator hasil generate tetap terikat pada intent QA, bukan preferensi selector.

## Coba kita bedah contoh nyata

Risikonya adalah:

> Customer mengubah delivery address, tapi alamat baru tidak tersimpan.

Halaman berisi street field dengan label, button Save address, dan status message setelah operasi berhasil.

### 1. Mulai dari behavior, bukan DOM

Customer mengenali field dari label-nya:

```ts
const street = page.getByLabel('Street address');
```

Kontrak ini seharusnya bertahan saat generated `id` berubah, input mendapat wrapper baru, atau styling class diganti. Locator seharusnya gagal kalau field nggak lagi terhubung dengan label—feedback yang berguna untuk usability dan accessibility.

Customer mengenali action sebagai button bernama Save address:

```ts
const saveAddress = page.getByRole('button', {
  name: 'Save address',
});
```

Memakai role tanpa name akan ambigu kalau halaman juga punya button Cancel, Delete, atau Save payment.

### 2. Hubungkan action dengan observable evidence

```ts
await street.fill('18 Market Street');
await saveAddress.click();

await expect(page.getByRole('status')).toHaveText('Delivery address updated');
```

Locator field dan button menyatakan interaksi pengguna. Status assertion menyatakan hasil produk yang bisa diamati. Satu jenis locator nggak harus mengerjakan semua tanggung jawab.

### 3. Tentukan apa yang seharusnya berubah karena localization

Kalau skenario ini memeriksa experience bahasa Indonesia, kontrak yang terlihat seharusnya memakai label, nama button, dan result text bahasa Indonesia.

Kalau tim menjalankan satu workflow lintas bahasa dan wording bukan risikonya, test ID yang sudah disepakati bisa mengenali action:

```ts
await page.getByTestId('save-delivery-address').click();
```

Kalau kualitas localization penting, tetap assert hasil terlokalisasi secara terpisah. Beralih ke test ID hanya supaya nggak perlu merawat localized expectation yang valid justru melemahkan test.

### 4. Perlakukan semantik yang hilang sebagai bukti

Misalnya halaman memakai custom control seperti ini:

```html
<div class="save-action">Save address</div>
```

CSS locator memang bisa mencapainya, tapi itu tidak membuat control menjadi accessible atau keyboard-operable. Catat defect produk atau testability gap-nya. Implementation locator sementara adalah jembatan, bukan final strategy yang perlu dipertahankan.

## Kapan pendekatan ini cocok dipakai?

Gunakan role dan accessible name saat skenario bergantung pada cara pengguna mengenali atau mengaktifkan control. Gunakan label saat hubungan field-label menjadi kontrak. Gunakan visible text saat wording atau displayed content adalah buktinya.

Gunakan test ID ketika tim sengaja membutuhkan kontrak engineering yang language-independent atau non-user-facing—misalnya chart canvas atau technical counter tanpa visible identity yang berguna.

Placeholder bisa dipakai untuk menemukan field, tapi placeholder tidak menggantikan proper label. Jangan sampai placeholder locator yang berhasil malah menyembunyikan accessibility problem.

Jangan memilih locator hanya karena paling pendek, paling baru, atau berada di urutan pertama sebuah preference list. Jangan memakai regular expression kalau exact stable name justru lebih baik untuk menunjukkan wording change yang tidak disengaja.

Gunakan CSS atau XPath hanya setelah kamu bisa menjelaskan kenapa user-facing locator, composition, atau explicit test contract belum bisa menyatakan target dengan baik.

## Kalau gagal, mulai cek dari mana?

Misalnya locator ini tidak menemukan apa pun:

```ts
page.getByRole('button', { name: 'Save address' });
```

Sebelum menggantinya dengan `button.primary`, periksa:

1. Apakah test sudah mencapai halaman dan state yang diharapkan?
2. Apakah target benar-benar dikenali sebagai button di accessibility tree?
3. Accessible name apa yang dikenali browser?
4. Apakah control berada di dialog, iframe, atau browser context lain? Iframe membutuhkan frame context sendiri; mengganti selector tidak akan menembus boundary tersebut.
5. Apakah wording diterjemahkan atau memang sengaja diubah?
6. Apakah control hilang, disabled, atau digantikan error state?

Kalau beberapa elemen cocok, cari tahu apakah halaman berisi repeated component atau accessible name yang duplikat. Lesson 2 akan menunjukkan cara memberi scope tanpa memakai posisi sebagai shortcut.

Mengganti ke CSS selector yang lebih luas, menambahkan `.first()`, atau mengubah semua name menjadi regular expression longgar bisa menyembunyikan alasan kontraknya gagal.

## Review hasil kerja dengan bantuan AI

Untuk setiap locator hasil generate, tanyakan:

- Makna pengguna, domain, atau engineering apa yang dinyatakan?
- Harmless change apa yang seharusnya bisa dilewati?
- Meaningful regression apa yang seharusnya membuat locator gagal?
- Apakah AI mengarang visible text, ARIA attribute, atau test ID?
- Apakah test ID memang didukung tim produk atau cuma diasumsikan?
- Apakah regular expression menyembunyikan wording difference yang nggak diharapkan?
- Apakah AI mengganti semantic failure dengan structural selector?
- Apakah locator bisa menemukan lebih dari satu elemen di starting state sungguhan?

Generated selector adalah proposal. Verifikasi terhadap live DOM, accessibility information, product language, dan test intent.

## Coba cek pemahamanmu

Review locator hasil generate untuk payment form ini:

```ts
const cardNumber = page.locator('#field-9281');
const pay = page.getByText(/pay/i);
const receiptChart = page.getByRole('img', { name: 'chart' });
```

Produk memiliki:

- visible label “Card number” yang terhubung dengan input;
- dua control yang mengandung kata “pay”: “Pay now” dan “Payment help”; dan
- canvas dengan automation contract `data-testid="receipt-chart"` yang sudah disepakati.

Untuk setiap locator:

1. Pilih kontrak yang lebih sesuai.
2. Jelaskan harmless change apa yang seharusnya bisa dilewati.
3. Jelaskan product change apa yang seharusnya membuatnya gagal.
4. Tentukan informasi apa yang perlu diverifikasi sebelum menulis final locator.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Gunakan `getByLabel('Card number')` supaya generated ID dan wrapper change nggak berpengaruh, sementara label association yang rusak tetap terlihat.
- Gunakan `getByRole('button', { name: 'Pay now' })` supaya interactive control yang dituju unik dan perubahan action name direview dengan sengaja.
- Gunakan `getByTestId('receipt-chart')` karena canvas punya engineering contract yang disepakati dan nggak punya user-facing identity yang berguna untuk skenario ini.
- Verifikasi live accessible name, role elemen, locale, dan konvensi test ID daripada memercayai deskripsi tertulis begitu saja.

Requirement produk yang berbeda bisa mengubah pilihan, tapi setiap pilihan harus punya kontrak yang jelas.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa memilih locator dari test intent, menjelaskan perubahan apa yang boleh dilewati, dan menginvestigasi nol atau beberapa match tanpa langsung jatuh ke struktur DOM.

Selesaikan Core Practice yang memakai role, accessible name, action, dan observable outcome. Lesson berikutnya akan membahas repeated card, row, dan dialog ketika locator yang baik masih membutuhkan scope yang bermakna.
