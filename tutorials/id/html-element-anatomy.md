---
title: 'Membaca HTML lewat Role, Accessible Name, dan State'
description: 'Periksa role, accessible name, dan state yang penting sebelum memilih automation code.'
---

## Setelah lesson ini, kamu bisa

- mengenali semantic role, accessible name, dan state yang relevan dari sebuah elemen;
- menjelaskan kenapa elemen HTML native biasanya memberi kontrak yang lebih jelas daripada elemen generik yang dibuat bisa diklik;
- membedakan atribut untuk styling, identitas yang dilihat pengguna, dan kontrak testability; serta
- me-review potongan markup kecil untuk menemukan risiko accessibility dan web automation.

Kamu nggak perlu menghafal semua tag HTML atau aturan ARIA. Targetnya adalah bisa membaca halaman secukupnya supaya keputusan QA-mu punya dasar yang jelas.

## Kenapa ini penting buat QA

Pernah nggak sih kamu bisa mengklik kontrol bertuliskan “Create account” saat manual testing, tetapi automated test malah nggak menemukan button dengan nama tersebut?

Bisa jadi kontrol itu terlihat seperti button tanpa benar-benar punya semantik button. Teks yang kelihatan mungkin nggak terhubung ke input di sebelahnya. Selector buatan AI mungkin berhasil hari ini, tetapi ternyata bergantung pada class styling yang berubah saat redesign berikutnya.

Saat manual testing, kita sering bisa menebak dari layout dan konteks. Browser automation membutuhkan identitas yang bisa ditemukan ulang secara konsisten. Pengguna teknologi bantu juga membutuhkan kejelasan yang sama.

Jadi, sebelum bertanya, “Selector apa yang harus ditulis?”, tanyakan tiga hal ini dulu:

1. Kontrol ini sebenarnya apa?
2. Bagaimana pengguna mengenalinya?
3. State apa yang membuktikan perilaku yang sedang kita periksa?

## Cara berpikir yang perlu kamu pegang

Browser nggak cuma menampilkan response HTML. Browser mengubah markup menjadi Document Object Model (DOM) yang aktif, menerapkan tampilan dan perilaku, lalu menyediakan informasi aksesibilitas yang mewakili makna, nama, dan state.

![Browser mengubah markup menjadi DOM aktif, UI yang terlihat, dan informasi aksesibilitas yang bisa diperiksa QA sebelum menentukan kontrak automation.](/images/tutorials/ui-meaning-layers.svg)

_Dasarkan web automation pada UI aktif yang bermakna, bukan pada satu atribut yang disalin dari markup awal._

Untuk elemen interaktif, baca tiga lapisan ini:

| Lapisan         | Pertanyaan                                             | Contoh                                                     |
| --------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Role            | Kontrol ini jenisnya apa?                              | button, textbox, checkbox, link                            |
| Accessible name | Bagaimana pengguna atau teknologi bantu membedakannya? | “Create account” atau “Work email”                         |
| State           | Apa yang sedang berlaku sekarang?                      | required, checked, expanded, disabled, atau value saat ini |

Elemen HTML bawaan sering menyediakan role secara otomatis. `<button>` punya semantik button. `<input type="checkbox">` punya semantik checkbox. ARIA bisa menambahkan informasi yang memang belum tersedia, tetapi menambah ARIA yang berulang nggak otomatis memperbaiki HTML yang kurang jelas.

Accessible name berbeda dari `id`, `name`, atau CSS class. Accessible name adalah nama yang dihitung browser berdasarkan aturan aksesibilitas. Tergantung jenis kontrolnya, nama ini bisa berasal dari teks yang terlihat, `<label>` yang terhubung, `aria-labelledby`, `aria-label`, alternative text, atau sumber lain yang didukung.

Aturannya punya detail dan pengecualian. Sebagai QA engineer, jangan menebak hanya dari kode. Periksa informasi yang benar-benar diberikan browser.

## Coba kita bedah contoh nyata

Tim produk sedang membuat form pendaftaran akun:

```html
<form aria-labelledby="account-heading">
  <h1 id="account-heading">Create your account</h1>

  <label for="work-email">Work email</label>
  <input
    id="work-email"
    name="email"
    type="email"
    required
    aria-describedby="email-hint"
  />
  <p id="email-hint">Use the address provided by your company.</p>

  <button type="submit">Create account</button>
</form>
```

Coba baca sebagai kontrak QA, bukan sebagai syntax yang harus dihafal:

- Field email punya role bawaan `textbox`.
- Accessible name-nya adalah “Work email” karena `<label>` terhubung lewat `for` dan `id`.
- `required` adalah state atau batasan yang relevan.
- Teks bantuan menjelaskan field, tetapi nggak menggantikan namanya.
- Kontrol submit adalah button bawaan dengan nama “Create account.”

Nanti, Playwright bisa menyatakan identitas yang sama seperti yang dipahami pengguna:

```ts
const email = page.getByRole('textbox', { name: 'Work email' });
const submit = page.getByRole('button', { name: 'Create account' });
```

Dua baris itu bukan selector ajaib. Keduanya adalah klaim tentang informasi yang diberikan browser. Kalau klaimnya salah, inspeksi seharusnya membantu kita menemukan alasannya.

Sekarang bandingkan dengan markup yang maknanya kurang jelas:

```html
<span>Work email</span>
<input class="field field--wide" placeholder="name@company.com" />
<div class="primary-button" onclick="submitAccount()">Create account</div>
```

Mulai kelihatan beberapa risikonya:

- Teks yang terlihat nggak terhubung secara programatis ke input.
- Placeholder adalah petunjuk, bukan pengganti label tetap yang bisa diandalkan.
- `<div>` yang bisa diklik nggak otomatis memiliki semantik button, perilaku keyboard, atau perilaku focus.
- Class tersebut menjelaskan tampilan dan bisa berubah tanpa ada perubahan pada perilaku produk.

Perbaikan terkuat biasanya memperjelas markup produknya. Selector yang rumit mungkin bisa menyembunyikan testability yang buruk, tetapi nggak bisa memberikan semantik yang hilang kepada pengguna.

### Atribut, property, dan state saat ini

HTML awal belum tentu sama dengan state yang sedang digunakan pengguna. Contohnya:

```html
<input id="quantity" type="number" value="1" />
```

Setelah pengguna mengubah field menjadi `3`, property `value` saat ini bisa bernilai `3`, sementara atribut `value` awal masih mewakili nilai awal atau default. JavaScript juga bisa menambah atau menghapus atribut seperti `disabled` atau `aria-expanded` ketika halaman sedang berjalan.

Itulah kenapa “View Source” saja nggak cukup untuk memahami perilaku dinamis. Periksa DOM aktif dan state yang sedang dilihat pengguna.

## Kapan pendekatan ini cocok dipakai?

Gunakan role, accessible name, dan state ketika perilakunya merupakan bagian dari apa yang dipahami pengguna: form, button, link, dialog, menu, status message, dan UI interaktif lainnya.

Gunakan kontrak test yang eksplisit seperti `data-testid` ketika nggak ada identitas yang menghadap pengguna dan cukup stabil, atau ketika wording produk memang sengaja berubah-ubah. Test ID bisa memperbaiki testability, tetapi jangan dipakai untuk menyamarkan label yang hilang atau semantik kontrol yang rusak.

Atribut CSS bisa membantu saat memeriksa struktur. Bukan berarti semuanya buruk, tetapi class yang dibuat hanya untuk styling biasanya menjadi kontrak perilaku yang lebih lemah. XPath juga nggak diperlukan kalau role, name, atau kontrak test eksplisit sudah menyatakan tujuannya. Pilihan ini akan kita bedah lebih dalam di Modul 4.

Jangan menjadikan setiap detail aksesibilitas sebagai browser test. Role-based locator memberi feedback yang berguna, tetapi nggak menggantikan accessibility audit, keyboard testing, atau testing langsung dengan teknologi bantu.

## Kalau gagal, mulai cek dari mana?

Coba bayangin test buatan AI mengalami timeout di sini:

```ts
await page.getByRole('button', { name: 'Create account' }).click();
```

Di halaman terlihat tulisan “Create account.” Sebelum mengganti locator, periksa kontrolnya:

1. Apakah DOM aktif berisi `<button>` bawaan atau hanya elemen generik yang diberi tampilan seperti button?
2. Role apa yang diberikan browser?
3. Accessible name apa yang diberikan browser?
4. Apakah kontrol sedang disabled, tersembunyi, atau diganti setelah render?
5. Apakah ada lebih dari satu kontrol dengan role dan name yang sama?

Kalau produk memakai `<div>` yang bisa diklik, mengganti test dengan jalur CSS panjang mungkin membuat klik berhasil. Namun, itu hanya menyembunyikan masalah accessibility dan testability. Utamakan perbaikan kontrol. Kalau kode produk belum bisa diubah, catat keterbatasannya dan gunakan kontrak fallback eksplisit yang paling kecil.

Fixed delay bukan diagnosis. Waktu tunggu nggak akan mengubah elemen generik menjadi button atau menghubungkan label yang terpisah.

## Review hasil buatan AI

AI bisa menghasilkan markup atau locator yang terlihat masuk akal tanpa memeriksa hasil yang dihitung browser. Review dengan pertanyaan berikut:

- Apakah elemen HTML bawaan digunakan ketika memang tersedia?
- Apakah setiap form control punya label yang bermakna?
- Apakah ARIA benar-benar menjelaskan UI, atau malah dipakai sebagai tempat data test sembarang?
- Apakah locator yang diusulkan sesuai dengan role dan accessible name sebenarnya?
- Apakah class styling dianggap sebagai kontrak produk yang stabil?
- Bisakah kamu menjelaskan state apa yang akan dibuktikan assertion-nya?

Kode buatan AI baru berupa hipotesis sampai cocok dengan halaman aktif dan perilaku produk yang diharapkan.

## Coba cek pemahamanmu

Review markup berikut:

```html
<label for="email-alerts">Email alerts</label>
<input id="email-alerts" type="checkbox" checked />

<button type="button" aria-label="Remove Mechanical Keyboard">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
```

Tanpa menulis test, coba jawab:

1. Apa role, accessible name, dan state input saat ini?
2. Apa role dan accessible name dari kontrol yang hanya menampilkan icon?
3. Detail mana yang menjelaskan perilaku pengguna, dan mana yang hanya menjadi struktur implementasi?
4. Apa yang akan kamu periksa di browser sebelum mempercayai jawabanmu?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Input tersebut adalah checkbox bernama “Email alerts,” dan markup saat ini menunjukkan bahwa kondisi awalnya checked.
- Kontrol dengan icon adalah button bernama “Remove Mechanical Keyboard.” SVG disembunyikan dari accessibility tree supaya nggak mengganggu nama button.
- Label, makna button, identitas produk, dan checked state menjelaskan perilaku yang bisa dipahami pengguna. ID elemen dan struktur SVG mendukung implementasi, tetapi bukan perilakunya.
- Periksa DOM aktif dan informasi aksesibilitas untuk memastikan nama yang dihitung dan state saat ini, terutama setelah JavaScript berjalan.

State bisa berubah setelah interaksi. Jadi, browser yang sedang aktif tetap menjadi sumber bukti.

## Sebelum lanjut

Saat melihat kontrol penting, kamu sekarang seharusnya bisa menjelaskan kontrol itu apa, bagaimana pengguna mengenalinya, state mana yang penting, dan apakah markup-nya memberi kontrak automation yang bermakna.

Di lesson berikutnya, kita akan menempatkan kontrol tersebut di dalam pohon DOM yang aktif. Konteks ini penting ketika nama yang sama muncul lebih dari sekali dan ketika halaman mengganti atau menghapus elemen setelah sebuah aksi.
