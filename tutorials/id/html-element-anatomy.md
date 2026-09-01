---
title: 'Membaca HTML lewat Role, Accessible Name, dan State'
description: 'Periksa role, accessible name, dan state yang penting sebelum memilih automation code.'
---

## Setelah lesson ini, kamu bisa

- mengenali semantic role, accessible name, dan state yang relevan dari sebuah element;
- menjelaskan kenapa native HTML element biasanya lebih mudah dipahami dan di-automate dibanding generic element yang hanya dibuat clickable;
- membedakan attribute yang digunakan untuk styling, informasi yang dikenali user, dan attribute yang membantu testability; serta
- me-review potongan markup sederhana untuk menemukan risiko accessibility dan web automation.

Kamu nggak perlu menghafal semua HTML tag atau aturan ARIA. Targetnya adalah bisa membaca markup secukupnya untuk memahami bagaimana browser mengenali sebuah element dan menentukan cara yang tepat untuk mengujinya.

## Kenapa ini penting buat QA

Pernah nggak sih saat manual testing kamu bisa klik kontrol bertuliskan “Create account”, tapi automated test justru nggak menemukan button dengan nama tersebut?

Bisa jadi dari tampilannya element itu seperti button, padahal HTML-nya cuma div atau element lain yang dibuat clickable.

Hal yang sama bisa terjadi pada input. Teks yang kelihatan seperti label belum tentu benar-benar terhubung ke input tersebut.

Selector juga bisa kelihatan aman karena test masih pass hari ini, padahal selector-nya bergantung pada CSS class yang bisa berubah kapan saja saat UI di-update atau di-redesign.
Saat manual testing, kita masih bisa memahami element dari tampilan dan konteks di halaman. Automation nggak punya kemampuan itu. Ia membutuhkan informasi yang jelas dan konsisten dari markup supaya element yang sama bisa ditemukan lagi.

Ini juga berkaitan dengan accessibility. Screen reader menggunakan informasi dari HTML dan ARIA untuk memahami apakah sebuah element adalah button, input, link, atau element lain.

Jadi, sebelum bertanya “Selector apa yang harus dipakai?”, tanyakan tiga hal ini dulu:

1. Element ini sebenarnya apa?
2. Bagaimana user mengenali element tersebut?
3. State apa yang menunjukkan bahwa behavior yang ingin diuji benar-benar terjadi?

## Cara berpikir yang perlu kamu pegang

Browser nggak cuma menampilkan HTML begitu saja. Browser membaca HTML, membentuk **Document Object Model (DOM)**, lalu memprosesnya bersama CSS dan JavaScript sampai menjadi halaman yang kita lihat dan gunakan.

Sebagai manusia, kita melihat hasil akhirnya di layar. Automation bekerja dari informasi yang tersedia di halaman, termasuk struktur DOM dan informasi accessibility seperti **role, accessible name,** dan **state** dari sebuah element.

![Browser mengubah markup menjadi DOM aktif, UI yang terlihat, dan informasi aksesibilitas yang bisa diperiksa QA sebelum menentukan kontrak automation.](/images/tutorials/ui-meaning-layers.svg)

_Dasarkan web automation pada UI aktif yang bermakna, bukan pada satu atribut yang disalin dari markup awal._

Untuk element yang bisa di-interact, ada tiga hal yang perlu diperhatikan:

| Yang dilihat    | Pertanyaan                              | Contoh                                                     |
| --------------- | --------------------------------------- | ---------------------------------------------------------- |
| Role            | Element ini sebenarnya apa?             | button, textbox, checkbox, link                            |
| Accessible name | User mengenali element ini sebagai apa? | “Create account” atau “Work email”                         |
| State           | Kondisinya sekarang seperti apa?        | required, checked, expanded, disabled, atau value saat ini |

Native HTML element biasanya sudah punya role secara otomatis. Contohnya, `<button>` akan dikenali sebagai button dan `<input type="checkbox">` akan dikenali sebagai checkbox.
ARIA bisa digunakan kalau informasi accessibility yang dibutuhkan belum tersedia dari HTML. Tapi jangan menambahkan ARIA kalau native HTML element sebenarnya sudah memberikan informasi yang benar.

**Accessible name** juga berbeda dari `id`, `name`, atau CSS class. Ini adalah nama yang digunakan browser untuk mengenali sebuah element dari sisi accessibility.

Tergantung element-nya, accessible name bisa berasal dari teks yang terlihat, `<label>` yang terhubung ke input, `aria-labelledby`, `aria-label`, atau `alt` pada image.

Aturannya cukup banyak, jadi sebagai QA engineer kita nggak perlu menebak hanya dari HTML. Yang lebih penting adalah mengecek bagaimana browser benar-benar mengenali **role, accessible name,** dan **state** dari element tersebut.

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

Sebagai QA, kita nggak perlu menghafal syntax-nya. Coba lihat informasi apa yang bisa kita ambil dari markup tersebut:

* Field email dikenali sebagai `textbox`.
* Accessible name-nya adalah **“Work email”** karena `<label>` terhubung ke input melalui `for` dan `id`.
* Attribute `required` memberi tahu bahwa field ini wajib diisi.
* Teks **“Use the address provided by your company.”** memberi informasi tambahan tentang field, tapi nama field-nya tetap **“Work email”**.
* Tombol submit dikenali sebagai `button` dengan accessible name **“Create account”**.

Nanti di Playwright, kita bisa mencari element menggunakan informasi yang sama:

```ts
const email = page.getByRole('textbox', { name: 'Work email' });
const submit = page.getByRole('button', { name: 'Create account' });
```

Dua baris ini bukan sekadar selector. Playwright menggunakan **role** dan **accessible name** yang tersedia dari halaman untuk menemukan element yang dimaksud.

Kalau locator tersebut nggak menemukan element, jangan langsung ganti ke selector yang lebih rumit. Cek dulu bagaimana browser sebenarnya mengenali element tersebut.

Sekarang bandingkan dengan markup berikut:

```html
<span>Work email</span>
<input class="field field--wide" placeholder="name@company.com" />
<div class="primary-button" onclick="submitAccount()">Create account</div>
```

Mulai kelihatan beberapa masalah:

* Teks **“Work email”** terlihat seperti label, tapi browser nggak mengenalinya sebagai label untuk input tersebut.
* `placeholder` bisa memberi petunjuk tentang format input, tapi sebaiknya nggak digunakan sebagai pengganti label yang jelas.
* `<div>` yang dibuat clickable nggak otomatis dikenali sebagai `button` dan belum tentu punya keyboard serta focus behavior yang sesuai.
* CSS class seperti `field--wide` atau `primary-button` menjelaskan tampilan. Class tersebut bisa berubah saat UI di-update tanpa ada perubahan pada behavior yang sedang kita test.

Kalau masalahnya ada di markup, solusi terbaik biasanya adalah memperbaiki markup tersebut.

Selector yang lebih rumit mungkin bisa membuat automated test tetap berjalan, tapi nggak memperbaiki accessibility atau testability dari element yang sebenarnya.

### Attribute, property, dan current state

HTML awal belum tentu menunjukkan kondisi element saat ini.

Contohnya:

```html
<input id="quantity" type="number" value="1" />
```

Awalnya field punya value `1`. Setelah user mengubahnya menjadi `3`, nilai yang sedang digunakan oleh halaman bisa sudah menjadi `3`, sementara attribute `value="1"` masih menunjukkan nilai awalnya.

Hal yang sama bisa terjadi pada attribute seperti `disabled` atau `aria-expanded`. JavaScript bisa mengubah nilainya ketika user berinteraksi dengan halaman.

Karena itu, **View Source** saja nggak cukup untuk melihat kondisi element setelah halaman berjalan. Untuk melihat kondisi saat ini, cek DOM serta property atau state element langsung lewat browser DevTools.

## Kapan pendekatan ini cocok dipakai?

Gunakan **role, accessible name,** dan **state** ketika element memang punya identitas yang jelas dari sisi user, seperti form, button, link, dialog, menu, status message, dan UI interaktif lainnya.

Kalau element nggak punya identitas yang cukup jelas atau wording di UI memang sering berubah, kita bisa menggunakan test attribute yang eksplisit seperti `data-testid`.

`data-testid` bisa membantu membuat element lebih mudah dan stabil untuk ditemukan oleh automation. Tapi jangan pakai `data-testid` sebagai jalan pintas kalau markup-nya sendiri masih bermasalah, misalnya input nggak punya label atau element clickable sebenarnya bukan button.

CSS attribute atau class tetap bisa berguna saat kita perlu mengecek struktur tertentu. Tapi class yang dibuat hanya untuk styling biasanya lebih mudah berubah ketika UI di-update, jadi kurang ideal kalau dijadikan selector utama.

Hal yang sama berlaku untuk XPath. Kalau element sudah bisa ditemukan dengan jelas lewat **role, accessible name,** atau test attribute yang memang dibuat untuk automation, biasanya nggak perlu memakai XPath yang lebih kompleks.

Kita akan membahas pilihan locator ini lebih dalam di Module 4.

Role-based locator juga bukan berarti semua accessibility testing sudah selesai. Locator seperti ini bisa membantu menemukan masalah tertentu, tapi tetap nggak menggantikan accessibility audit, keyboard testing, atau testing langsung menggunakan screen reader.

## Kalau test fail, mulai cek dari mana?

Coba bayangin test timeout di bagian ini:

```ts
await page.getByRole('button', { name: 'Create account' }).click();
```

Di halaman, tulisan **“Create account”** memang terlihat. Tapi sebelum langsung ganti locator, cek dulu element-nya:

1. Apakah HTML-nya benar-benar menggunakan `<button>`, atau cuma element lain yang dibuat terlihat dan behave seperti button?
2. Role apa yang dikenali browser?
3. Accessible name apa yang dikenali browser?
4. Apakah element sedang `disabled`, hidden, atau berubah setelah halaman selesai render?
5. Apakah ada lebih dari satu element dengan role dan accessible name yang sama?

Kalau ternyata produknya menggunakan `<div>` yang dibuat clickable, kita mungkin masih bisa membuat test jalan dengan CSS selector. Tapi itu belum memperbaiki masalah pada element-nya.

Kalau memungkinkan, perbaiki markup-nya terlebih dahulu. Kalau belum bisa diubah, gunakan fallback selector yang paling jelas dan catat limitation tersebut supaya tim tahu kenapa locator itu diperlukan.

Menambah fixed delay juga bukan solusi untuk masalah seperti ini. Menunggu lebih lama nggak akan membuat `<div>` berubah menjadi button atau membuat label yang salah menjadi benar.

Sebelum memakai markup atau locator, cek dulu beberapa hal ini:

* Apakah sudah menggunakan native HTML element kalau memang tersedia?
* Apakah setiap form control punya label yang jelas?
* Apakah ARIA memang digunakan untuk accessibility, bukan sekadar tempat menaruh data untuk automation?
* Apakah locator-nya sesuai dengan role dan accessible name yang dikenali browser?
* Apakah selector bergantung pada CSS class yang sebenarnya cuma digunakan untuk styling dan bisa berubah?
* Bisakah kamu menjelaskan state atau expected result apa yang akan diverifikasi oleh assertion tersebut?

Jangan langsung pakai markup atau locator tersebut tanpa dicek. Cocokkan dulu dengan halaman yang benar-benar berjalan dan behavior yang memang diharapkan.

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

1. Apa **role, accessible name,** dan **state** dari checkbox tersebut?
2. Apa **role** dan **accessible name** dari button yang hanya menampilkan icon?
3. Informasi mana yang memang menggambarkan behavior dari sisi user, dan mana yang hanya bagian dari implementation?
4. Apa yang perlu kamu cek langsung di browser sebelum memastikan jawabanmu benar?

## Bandingkan dengan cara pikir ini

Contoh jawaban:
* Input tersebut adalah checkbox dengan accessible name **“Email alerts”** dan state awal `checked`.
* Element yang hanya menampilkan icon adalah `button` dengan accessible name **“Remove Mechanical Keyboard”**. SVG-nya diberi `aria-hidden="true"` supaya nggak ikut terbaca sebagai bagian dari accessible name.
* Label, fungsi button, nama produk, dan state `checked` adalah informasi yang relevan dari sisi user. Sementara `id` element dan struktur SVG lebih berkaitan dengan implementation.
* Cek DOM dan informasi accessibility langsung di browser untuk memastikan role, accessible name, dan current state yang benar, terutama setelah JavaScript mengubah halaman.

State bisa berubah setelah user berinteraksi. Jadi, jangan hanya mengandalkan HTML awal—cek kondisi element yang benar-benar sedang berjalan di browser.

## Sebelum lanjut

Saat melihat kontrol penting, kamu sekarang seharusnya bisa menjelaskan kontrol itu apa, bagaimana pengguna mengenalinya, state mana yang penting, dan apakah markup-nya memberi kontrak automation yang bermakna.

Di lesson berikutnya, kita akan menempatkan kontrol tersebut di dalam pohon DOM yang aktif. Konteks ini penting ketika nama yang sama muncul lebih dari sekali dan ketika halaman mengganti atau menghapus elemen setelah sebuah aksi.
