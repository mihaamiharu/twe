---
title: 'Strategi CSS Selector (Langkah "Find")'
description: 'Teknik buat nentuin elemen secara tangguh dan gampang dikelola untuk otomatisasi testing.'
---

> **Goal:** Belajar cara nulis *selector* yang tangguh, gampang di-*maintenance*, dan "tahan banting" meskipun tampilan UI berubah.

## 1. Pendahuluan: Tangguh vs. Ringkih

*CSS Selector* itu ibarat alamat yang dipake *script* kamu buat nemuin elemen di DOM.

* **Selector Ringkih (Brittle):** Ngandelin properti yang gampang banget berubah. Biasanya karena struktur DOM yang terlalu panjang atau *style* yang nggak nentu.
* *Contoh:* `div > div:nth-child(3) > span` (Satu `div` geser, *script* langsung *error*).

* **Selector Tangguh (Robust):** Ngandelin atribut yang stabil, kayak ID unik atau nama fungsional.
* *Contoh:* `[name="user_email"]`

Di dunia kerja profesional, kita ngutamain **Stabilitas**. *Selector* yang rusak cuma gara-gara ada tambahan satu `div` itu namanya **Technical Debt** (utang teknis) yang bikin pusing di kemudian hari.

---

## 2. Daftar Prioritas Selector (Terbaik ke Terburuk)

![Stable vs Unstable Selector](/images/tutorials/css-stable-vs-unstable.png)

Pas lagi *inspect* elemen, cek urutan prioritas ini biar *test* kamu awet jangka panjang:

### Prioritas 1: Test Attributes (Kontrak Resmi)

![Selector Robustness Pyramid](/images/tutorials/css-robustness-pyramid.png)

* **Syntax:** `[data-testid="value"]`, `[data-cy="value"]`
* **Kenapa:** Ini adalah "kontrak resmi" antara QA dan Developer. Atribut ini emang dibikin khusus buat testing, jadi nggak bakal keganggu sama urusan desain (*styling*).
* **Best Practice:** Kalo elemennya nggak punya *test ID*, jangan sungkan buat minta Developer nambahin.

### Prioritas 2: Unique Functional IDs

* **Kenapa:** Secara aturan HTML, ID itu harusnya unik dalam satu halaman.
* **Risiko:** Hati-hati sama **Dynamic ID**. Kalo ID-nya keliatan kayak acakan angka/huruf yang berubah tiap di-*refresh* (contoh: `ember123`), mending jangan dipake.

### Prioritas 3: Accessible Names (A11y)

* **Syntax:** `[name="value"]`, `[aria-label="value"]`, `[alt="value"]`
* **Kenapa:** Atribut ini ngebantu pengguna disabilitas (pake *screen reader*). Developer biasanya jarang ngerubah ini karena bisa ngerusak fitur aksesibilitas web tersebut.

### Prioritas 4: Compound Selectors

* **Syntax:** `.class[attribute="value"]`
* **Kenapa:** Gabungin *class* dan atribut bikin pencarian jadi lebih spesifik tanpa harus terpaku sama urutan pohon DOM.

### Prioritas 5: Full DOM Paths (Anti-Pattern)

* **Syntax:** `/html/body/div[1]/div[3]/form...`
* **Kenapa:** Ini bikin *test* kamu "terikat mati" sama *layout* visual. Begitu ada *update* UI dikit aja, *test* kamu bakal gagal total. **Hindari sebisa mungkin!**

---

## 3. Nanganin CSS Modern (Tailwind & Dynamic Classes)

Framework modern kayak Tailwind sering pake *utility classes* yang kelihatannya berantakan atau gampang berubah.

**Masalahnya:**

```html
<button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
```

Di sini nggak ada ID, nggak ada Name, dan nggak ada atribut fungsional sama sekali.

**Kenapa ini jadi "jalan buntu" buat CSS biasa:**

1. **CSS nggak bisa baca teks:** Kamu nggak bisa bikin *pure* CSS selector yang isinya: "Cari tombol yang ada tulisan 'Login'".
2. **Class itu soal visual:** Kalo kamu targetin `.bg-blue-500`, *test* kamu bakal gagal pas desainer ganti warna tombol jadi hijau, padahal fungsi loginnya masih normal.

### Solusinya (Urutan Langkah Engineering)

#### A. Pake Parent Anchor (Konteks)

Cari wadah (*container*) terdekat yang punya identitas unik, baru cari tombol di dalemnya.

* **Selector:** `.login-form button`

#### B. Pake Positional Pseudo-classes

Kalo tombol itu selalu jadi yang pertama di wadahnya, pake *positional selector*.

* **Selector:** `button:first-of-type`

#### C. Modifikasi HTML (Cara Paling Pro)

Kalo bener-bener nggak ada celah buat bikin *selector* yang unik, cara paling bener adalah **ubah kodenya**. Tambahin `data-testid` biar elemennya "Testable".

* **Update Kode:** `<button data-testid="login-submit" ...>`
* **Selector:** `[data-testid="login-submit"]`

---

## 4. Cheatsheet Syntax Penting

Empat pola ini udah nyakup 90% kebutuhan kamu pas bikin otomatisasi:

| Tipe | Syntax | Deskripsi |
| --- | --- | --- |
| **Attribute** | `[type="submit"]` | Harus sama persis (*Exact match*). |
| **Contains** | `[class*="error"]` | Cocok kalo kata "error" ada di bagian mana aja. |
| **Starts With** | `[id^="user_"]` | Cocok buat ID dinamis yang awalannya stabil (misal: `user_1`). |
| **Descendant** | `form input` | Cari `input` apa aja yang ada di dalem `form`. |
| **Direct Child** | `.card > .title` | Cari `.title` yang bener-bener anak langsung dari `.card`. |
| **Sibling** | `label + input` | Cari `input` yang posisinya tepat setelah `label`. |

---

## 5. Anti-Pattern (Hal yang Harus Dihindari)

### Copas langsung dari DevTools

Browser sering ngasih *path* yang panjang banget (kayak `#app > div:nth-child(2)...`). Ini bawaannya ringkih banget. Selalu tulis *selector* buatanmu sendiri biar lebih bersih.

### Milih berdasarkan Teks Konten

Hindari milih elemen cuma berdasarkan teksnya (misal: "Kirim"). Teks itu gampang berubah gara-gara urusan *marketing* atau pas website-nya ganti bahasa (*localization*). Andalin atribut teknis aja.

---

## Tantangan: Coba Refactor Selector Ini

**Selector Ringkih:**
`body > div.container > div.main-content > form > div:nth-child(2) > input.form-control`

**Struktur DOM:**

```html
<form class="login-form">
  <div class="field-group">
    <label>Email</label>
    <input type="email" name="user_email" class="px-4 py-2 bg-gray-100 border rounded" />
  </div>
</form>
```

**Solusi Refactor:**

* **Terbaik:** `[name="user_email"]` (Stabil, unik, dan fungsional).
* **Alternatif:** `.login-form input[type="email"]` (Cukup spesifik karena dibatasi di dalem form login).

---

## 6. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi

* **[CSS Selectors Guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)**: Kamus lengkap buat semua jenis selector.

### Best Practice Industri

* **[Testing Library Priority](https://testing-library.com/docs/queries/about/#priority)**: Belajar filosofi kenapa kita harus milih elemen berdasarkan apa yang "Dilihat User" (Role, Label, Text) dibanding detail kode.

---

Selesai! Strategi *selector* ini bakal nentuin seberapa sering kamu harus benerin *script* yang rusak di masa depan.
