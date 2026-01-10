---
title: 'CSS Selectors untuk QA Engineer'
description: 'Kuasai seni menulis CSS selector yang robust dan maintainable untuk test automation.'
---

# CSS Selectors untuk QA Engineer

Kuasai seni menulis _CSS selector_ yang _robust_ dan _maintainable_ untuk _test automation_.

## Mental Model: DOM sebagai Peta

Bayangkan HTML DOM (_Document Object Model_) sebagai kota yang sangat besar dan luas. Skrip _test automation_-mu adalah seorang pengunjung yang mencoba menemukan gedung tertentu (sebuah elemen) untuk berinteraksi.

Sebuah **CSS Selector** adalah alamat yang kamu berikan kepada pengunjung tersebut.

- **Alamat Buruk**: "Pergi ke gedung biru ke-3 di sebelah kiri setelah pohon besar."
  - _Kenapa ini gagal_: Jika seseorang mengecat gedungnya jadi merah atau menebang pohonnya, pengunjungmu akan tersesat. Ini adalah _selector_ yang **brittle** (rapuh).
- **Alamat Bagus**: "Jalan Sudirman No. 123".
  - _Kenapa ini berhasil_: Bahkan jika gedungnya direnovasi, alamatnya tetap sama. Ini adalah _selector_ yang **robust**.

Dalam QA, tujuan kita adalah menulis "alamat" yang tetap bertahan bahkan ketika "kota" (UI) berubah di sekitarnya.

---

## Strategi: Hirarki Robustness

Tidak semua _selector_ diciptakan setara. Ketika menginspeksi sebuah elemen, cari atribut dengan urutan prioritas berikut:

1. **Unique Test APIs** (Terbaik)
   - `data-testid`, `data-cy`, `data-automation-id`
   - _Kenapa_: Ini adalah kontrak eksplisit antara _developer_ dan QA. Mereka jarang berubah karena alasan _styling_.
   - _Contoh_: `[data-testid="submit-login"]`

2. **Unique Functional IDs** (Bagus)
   - `id="..."`
   - _Kenapa_: ID harus unik per halaman, tapi hati-hati dengan ID dinamis yang di-generate oleh _framework_ (contoh: `id="input-xv92"`).
   - _Contoh_: `#user-email`

3. **Unique Accessible Names** (Bagus)
   - `aria-label`, `name`, `alt`
   - _Kenapa_: Ini mempengaruhi _usability_, jadi mereka lebih jarang berubah sembarangan dibanding _class_.
   - _Contoh_: `[name="password"]`, `[aria-label="Tutup modal"]`

4. **Kombinasi Kompleks** (Oke)
   - Menggabungkan _class_ atau atribut untuk menciptakan keunikan.
   - _Contoh_: `form.login-form button[type="submit"]`

5. **Struktural/Path** (Hindari)
   - Bergantung pada struktur DOM atau urutan.
   - _Contoh_: `div > div:nth-child(3) > span`

---

## Toolset: Selector Esensial

### 1. Dasar-Dasar

- **ID**: `#submit` cocok dengan `id="submit"`
- **Class**: `.btn` cocok dengan `class="... btn ..."`
- **Tag**: `input` cocok dengan elemen `<input>`

### 2. Kekuatan Atribut

Atribut adalah teman terbaikmu ketika ID tidak tersedia.

- **Exact Match**: `[type="submit"]`
- **Contains**: `[class*="success"]` (Cocok dengan "alert-success", "success-msg")
- **Starts With**: `[id^="user_"]` (Cocok dengan "user_123", "user_abc")
- **Ends With**: `[href$=".pdf"]` (Bagus untuk mengecek tipe file)

### 3. Hubungan tanpa XPath

CSS bisa menangani hubungan _parental_ lebih baik dari yang kamu kira.

- **Descendant (Spasi)**: `form input`
  - _Arti_: Input apapun _di dalam_ form, tidak peduli seberapa dalam.
- **Direct Child (>)**: `.card > .title`
  - _Arti_: Hanya title yang merupakan anak _langsung_ dari card.
- **Next Sibling (+)**: `label + input`
  - _Arti_: Input yang berada tepat setelah label.

---

## Jebakan-Jebakan (The Traps)

### Jebakan #1: Jebakan Copy-Paste

**Skenario**: Kamu klik kanan elemen di Chrome DevTools dan pilih "Copy > Copy selector".
**Hasilnya**: `#app > div:nth-child(2) > div > form > div:nth-child(3) > input`
**Masalahnya**: Jika _developer_ menambahkan satu _div_ saja di mana pun dalam rantai itu, tes kamu akan gagal.
**Solusinya**: Baca DOM-nya sendiri. Cari atribut unik di dekat elemen tersebut dan tulis _selector_ yang pendek dan spesifik seperti `form [name="email"]`.

### Jebakan #2: Jebakan Status Quo (Classes)

**Skenario**: Menggunakan `.btn-primary` untuk menemukan tombol _submit_.
**Masalahnya**: "Primary" adalah _style_. Jika tim desain mengubah warna tombol jadi "secondary" atau "success", tes kamu akan rusak meskipun tombolnya masih berfungsi.
**Solusinya**: Gunakan atribut fungsional (`type="submit"`) atau konten teks (jika menggunakan _tools_ seperti Playwright/Cypress yang mendukungnya), atau minta `data-testid`.

### Jebakan #3: Ilusi ID Dinamis

**Skenario**: Kelihatannya seperti ID! `<input id="ember123">`.
**Masalahnya**: Banyak _framework_ (React, Ember, Angular) men-generate angka-angka ini. Kali berikutnya kamu _reload_, mungkin jadinya `ember456`.
**Solusinya**: Cari atribut yang _tidak_ terlihat acak. Gunakan "Starts With" (`^=`) jika ID punya prefix stabil seperti `id="user-12345"` -> `[id^="user-"]`.

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
