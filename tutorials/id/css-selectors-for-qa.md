---
title: "CSS Selectors untuk QA Engineer"
description: "Kuasai seni menulis CSS selector yang robust dan maintainable untuk test automation."
---

# CSS Selectors untuk QA Engineer

Kuasai seni menulis *CSS selector* yang *robust* dan *maintainable* untuk *test automation*.

## Mental Model: DOM sebagai Peta

Bayangkan HTML DOM (*Document Object Model*) sebagai kota yang sangat besar dan luas. Skrip *test automation*-mu adalah seorang pengunjung yang mencoba menemukan gedung tertentu (sebuah elemen) untuk berinteraksi.

Sebuah **CSS Selector** adalah alamat yang kamu berikan kepada pengunjung tersebut.

* **Alamat Buruk**: "Pergi ke gedung biru ke-3 di sebelah kiri setelah pohon besar."
  * *Kenapa ini gagal*: Jika seseorang mengecat gedungnya jadi merah atau menebang pohonnya, pengunjungmu akan tersesat. Ini adalah *selector* yang **brittle** (rapuh).
* **Alamat Bagus**: "Jalan Sudirman No. 123".
  * *Kenapa ini berhasil*: Bahkan jika gedungnya direnovasi, alamatnya tetap sama. Ini adalah *selector* yang **robust**.

Dalam QA, tujuan kita adalah menulis "alamat" yang tetap bertahan bahkan ketika "kota" (UI) berubah di sekitarnya.

---

## Strategi: Hirarki Robustness

Tidak semua *selector* diciptakan setara. Ketika menginspeksi sebuah elemen, cari atribut dengan urutan prioritas berikut:

1. **Unique Test APIs** (Terbaik)
    * `data-testid`, `data-cy`, `data-automation-id`
    * *Kenapa*: Ini adalah kontrak eksplisit antara *developer* dan QA. Mereka jarang berubah karena alasan *styling*.
    * *Contoh*: `[data-testid="submit-login"]`

2. **Unique Functional IDs** (Bagus)
    * `id="..."`
    * *Kenapa*: ID harus unik per halaman, tapi hati-hati dengan ID dinamis yang di-generate oleh *framework* (contoh: `id="input-xv92"`).
    * *Contoh*: `#user-email`

3. **Unique Accessible Names** (Bagus)
    * `aria-label`, `name`, `alt`
    * *Kenapa*: Ini mempengaruhi *usability*, jadi mereka lebih jarang berubah sembarangan dibanding *class*.
    * *Contoh*: `[name="password"]`, `[aria-label="Tutup modal"]`

4. **Kombinasi Kompleks** (Oke)
    * Menggabungkan *class* atau atribut untuk menciptakan keunikan.
    * *Contoh*: `form.login-form button[type="submit"]`

5. **Struktural/Path** (Hindari)
    * Bergantung pada struktur DOM atau urutan.
    * *Contoh*: `div > div:nth-child(3) > span`

---

## Toolset: Selector Esensial

### 1. Dasar-Dasar

* **ID**: `#submit` cocok dengan `id="submit"`
* **Class**: `.btn` cocok dengan `class="... btn ..."`
* **Tag**: `input` cocok dengan elemen `<input>`

### 2. Kekuatan Atribut

Atribut adalah teman terbaikmu ketika ID tidak tersedia.

* **Exact Match**: `[type="submit"]`
* **Contains**: `[class*="success"]` (Cocok dengan "alert-success", "success-msg")
* **Starts With**: `[id^="user_"]` (Cocok dengan "user_123", "user_abc")
* **Ends With**: `[href$=".pdf"]` (Bagus untuk mengecek tipe file)

### 3. Hubungan tanpa XPath

CSS bisa menangani hubungan *parental* lebih baik dari yang kamu kira.

* **Descendant (Spasi)**: `form input`
  * *Arti*: Input apapun *di dalam* form, tidak peduli seberapa dalam.
* **Direct Child (>)**: `.card > .title`
  * *Arti*: Hanya title yang merupakan anak *langsung* dari card.
* **Next Sibling (+)**: `label + input`
  * *Arti*: Input yang berada tepat setelah label.

---

## Jebakan-Jebakan (The Traps)

### Jebakan #1: Jebakan Copy-Paste

**Skenario**: Kamu klik kanan elemen di Chrome DevTools dan pilih "Copy > Copy selector".
**Hasilnya**: `#app > div:nth-child(2) > div > form > div:nth-child(3) > input`
**Masalahnya**: Jika *developer* menambahkan satu *div* saja di mana pun dalam rantai itu, tes kamu akan gagal.
**Solusinya**: Baca DOM-nya sendiri. Cari atribut unik di dekat elemen tersebut dan tulis *selector* yang pendek dan spesifik seperti `form [name="email"]`.

### Jebakan #2: Jebakan Status Quo (Classes)

**Skenario**: Menggunakan `.btn-primary` untuk menemukan tombol *submit*.
**Masalahnya**: "Primary" adalah *style*. Jika tim desain mengubah warna tombol jadi "secondary" atau "success", tes kamu akan rusak meskipun tombolnya masih berfungsi.
**Solusinya**: Gunakan atribut fungsional (`type="submit"`) atau konten teks (jika menggunakan *tools* seperti Playwright/Cypress yang mendukungnya), atau minta `data-testid`.

### Jebakan #3: Ilusi ID Dinamis

**Skenario**: Kelihatannya seperti ID! `<input id="ember123">`.
**Masalahnya**: Banyak *framework* (React, Ember, Angular) men-generate angka-angka ini. Kali berikutnya kamu *reload*, mungkin jadinya `ember456`.
**Solusinya**: Cari atribut yang *tidak* terlihat acak. Gunakan "Starts With" (`^=`) jika ID punya prefix stabil seperti `id="user-12345"` -> `[id^="user-"]`.

---

## Tantangan: Refactor Selector Ini

**Selector Buruk**:

```css
body > div.container > div.main-content > form > div:nth-child(2) > input.form-control
```

**DOM-nya**:

```html
<form class="login-form">
  <div class="field-group">
    <label>Email</label>
    <input type="email" name="user_email" class="form-control" />
  </div>
</form>
```

**Selector Lebih Baik**:

```css
/* Opsi 1: Atribut (Terbaik) */
[name="user_email"]

/* Opsi 2: Kontekstual (Bagus) */
.login-form input[type="email"]
```
