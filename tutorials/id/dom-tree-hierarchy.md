---
title: 'Pondasi 2: Membaca DOM Tree (Hirarki)'
description: 'Otomatisasi itu soal konteks. Belajar cara navigasi "Hirarki Element" dari sebuah halaman web.'
---

> **Intinya:** Otomatisasi itu soal konteks. Kamu harus tau cara navigasi di "Hirarki Element" halaman web supaya script-mu nggak nyasar.

Pas browser buka sebuah website, dia bakal ngerubah kode HTML tadi jadi struktur yang namanya **DOM (Document Object Model)**. Bayangin DOM ini kayak Hirarki Element di mana setiap elemen itu saling nyambung satu sama lain.

## 1. Metafora "Pohon": Akar dan Cabang

![DOM Tree Model](/images/tutorials/dom-tree-model.png)

Setiap halaman web itu bermula dari satu elemen "root" (akar), yaitu: `<html>`. Semuanya tumbuh dari situ.

* **The Root (Akar):** Tag `<html>`. Ini nenek moyang semuanya.
* **The Branches (Cabang):** `<head>` (isi data rahasia kayak metadata) dan `<body>` (isi semua yang kamu liat di layar).
* **The Leaves (Daun):** Elemen paling ujung, kayak tombol, teks, atau gambar.

---

## 2. Hubungan Parent-Child (Nesting)

![Container View](/images/tutorials/dom-container-view.png)

Pas ada elemen yang ditaruh di dalem elemen lain, itu namanya **Nesting**. Dari sinilah muncul hubungan **Parent-Child** (Orang Tua - Anak).

* **Parent:** Elemen luar yang ngebungkus elemen lain.
* **Child:** Elemen yang "tinggal" di dalem si parent.

**Contoh Kodenya:**

```html
<form id="login-form">
  <input type="text" name="username">
</form>
```

Di contoh ini:

* `<form>` adalah **Parent**.
* `<input>` adalah **Child**.

> [!TIP]
> **Kenapa ini penting buat QA:** Kadang, tombol "Login" itu nggak punya ID unik, tapi "Login Form"-nya punya ID. Kamu bisa perintahin script automation-mu gini: "Cariin Login Form (Parent), terus cariin tombol (Child) yang ada di dalemnya."

---

## 3. Siblings: Hidup di Level yang Sama

Elemen yang punya Parent yang sama disebut **Siblings** (Saudara Kandung). Mereka ini sejajar di dalam hirarki.

**Contoh Kodenya:**

```html
<ul>
  <li>Home</li>
  <li>About</li>
  <li>Contact</li>
</ul>
```

Di sini, ketiga tag `<li>` adalah **Siblings** karena mereka semua anak dari parent yang sama, yaitu `<ul>`.

> [!TIP]
> **Kenapa ini penting buat QA:** Kamu bakal sering pake hubungan saudara ini pas mau nyari elemen berdasarkan tetangganya. Contoh: "Cari label yang tulisannya 'Email', terus isi kolom input tepat di sebelahnya."

---

## 4. Memahami Nesting dan Indentation

![Indentation Guide](/images/tutorials/dom-indentation-guide.png)

Kalo kodenya ditulis dengan rapi, kamu bakal liat elemen "anak" itu agak menjorok ke kanan (ada spasi di depannya). Ini ngebantu kita buat ngeliat hirarki dengan cepet.

* **Kode yang menjorok (Indented):** Biasanya nunjukkin kalo dia itu **Child** dari baris di atasnya.
* **Kode yang sejajar (Aligned):** Nunjukkin kalo elemen-elemen itu adalah **Siblings**.

**Bandingin tampilan "Berantakan" vs "Rapi":**

```html
<div><form><label>Name</label><input></form></div>

<div>
  <form>
    <label>Name</label>
    <input>
  </form>
</div>
```

---

## 5. Realita: Deket di Layar ≠ Deket di Kode

Salah satu jebakan buat pemula adalah ngira kalau dua tombol posisinya deketan di layar, berarti mereka "saudara" di kodenya.

**Seringkali ini salah.** Developer pake "Containers" (kayak `<div>` atau `<span>`) buat ngerapiin tampilan. Dua tombol bisa aja keliatan tetanggaan di layar, tapi di struktur kodenya, mereka bisa ada di "cabang" pohon yang beda jauh.

> [!IMPORTANT]
> **Aturannya:** Selalu percaya sama struktur DOM tree yang ada di **DevTools**, jangan cuma percaya sama apa yang mata kamu liat di UI.

---

## Checklist Rangkuman

Biar makin jago soal DOM tree, pastiin kamu bisa:

1. Nentuin mana **Parent** dari sebuah elemen.
2. Tau elemen mana aja yang jadi **Siblings** (punya parent yang sama).
3. Pake **Indentation** (jarak spasi) buat ngenalin elemen mana yang masuk ke dalem elemen lain.

---

## 6. Bacaan Lanjut (Deep Dive)

Kalo mau eksplor lebih teknis soal struktur DOM:

### Dokumentasi Resmi (MDN)

* **[Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)**: Penjelasan lengkap soal apa itu DOM sebenernya.
* **[Traversing the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Node)**: Dokumentasi detail soal istilah kayak `parentNode`, `childNodes`, dan `nextSibling`.

---

Gimana, makin kebayang kan cara navigasi di "tree" website?
