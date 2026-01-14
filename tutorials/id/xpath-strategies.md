---
title: 'XPath ("Pintu Darurat" di Automation)'
description: 'Pake XML Path Language buat nyelesain masalah pencarian elemen yang ribet yang nggak bisa ditangani sama CSS.'
---

> **Intinya:** Anggap XPath sebagai "Pintu Darurat". Kita pake ini pas CSS *selector* udah nggak sanggup lagi nemuin elemen yang kita mau.

## 1. Kenapa XPath Dibutuhin?

CSS aslinya didesain buat desainer supaya bisa ngasih gaya (*style*) ke halaman web. Sedangkan XPath didesain buat navigasi struktur data dokumen. Makanya, XPath itu jauh lebih **sakti** tapi juga sedikit lebih rumit.

Di otomatisasi modern, kita pake XPath khusus buat dua "Kekuatan Super" yang nggak dimiliki CSS:

1. **Nyari berdasarkan Teks:** Nemuin elemen berdasarkan kata-kata yang keliatan langsung sama user.
2. **Hubungan Dinamis:** Nemuin elemen berdasarkan orang tua (*parent*) atau saudara (*sibling*)-nya (bisa gerak naik-turun di silsilah elemen).

---

## 2. Absolute vs. Relative Paths

Ini adalah perbedaan teknis paling krusial yang harus kamu tau biar script-mu nggak gampang *error*.

### The Absolute Path (Jangan Dipake!)

* **Syntax:** `/html/body/div[1]/section/div/button`
* **Logika:** Peta kaku dari urutan paling atas dokumen sampai ke bawah.
* **Masalahnya:** Kalau developer nambahin satu `<div>` aja buat ngebungkus konten, seluruh jalurnya bakal rusak. **Jangan pernah pake ini di *test suite* profesional.**

### The Relative Path (Standar Baku)

* **Syntax:** `//button`
* **Logika:** Tanda garis miring ganda (`//`) itu artinya: "Cari **di mana aja** di dalem DOM satu tombol ini, nggak peduli dia ngumpet di cabang mana."

![XPath Absolute vs Relative Path](/images/tutorials/xpath-absolute-relative.png)

---

## 3. Menguasai "Kekuatan Super" XPath

### Kekuatan Super #1: Pencocokan Teks (Text Matching)

Kayak yang udah dibahas sebelumnya, CSS itu "buta huruf"—dia nggak bisa baca teks di layar. XPath bisa nargetin kata-kata yang persis sama atau cuma sebagian (*partial match*).

* **Exact Match (Persis):** `//button[text()='Login']`
* **Partial Match (Mengandung kata):** `//p[contains(text(), 'Error')]`
* *Kasus nyata:* Pas teksnya bisa berubah dikit (contoh: "Error: Password Salah" vs "Error: Sistem Down"). Selama ada kata "Error", elemennya ketemu.

### Kekuatan Super #2: The Axes (Navigasi Silsilah)

XPath ngebolehin kamu buat "jalan-jalan" di DOM Tree (Pondasi 2) ke arah mana aja, nggak cuma turun ke bawah.

* **Parent Axis (Ke Atas):** `//input[@id='username']/parent::div`
* *Logika:* Cari kolom input-nya dulu, terus ambil "kotak" (*container*) tempat dia tinggal.

* **Sibling Axis (Ke Samping):** `//label[text()='Email']/following-sibling::input`
* *Logika:* Cari label yang tulisannya 'Email', terus isi kolom input yang ada tepat di sebelahnya.

![XPath Axes Navigation](/images/tutorials/xpath-axes-navigation.png)

---

## 4. Cheatsheet Syntax XPath

| Goal | Syntax XPath | Bandingan sama CSS |
| --- | --- | --- |
| **Cari by ID** | `//*[@id='user']` | `#user` |
| **Cari by Class** | `//*[contains(@class, 'btn')]` | `.btn` |
| **Cari by Text** | `//*[text()='Submit']` | **Nggak Bisa** |
| **Gerak ke Parent** | `//button/..` | **Nggak Bisa** |

![CSS vs XPath Comparison Map](/images/tutorials/xpath-vs-css-map.png)

---

## 5. Checklist Rangkuman: Kapan Harus Pake XPath?

1. **Pake CSS secara default:** Karena browser lebih cepet prosesnya dan kodenya lebih enak dibaca manusia.
2. **Pake XPath kalo butuh Teks:** Kalo elemennya nggak punya atribut unik (ID/Class) dan teks adalah satu-satunya penanda yang stabil.
3. **Pake XPath buat Logika Rumit:** Kalo kamu butuh nemuin baris di tabel berdasarkan nilai yang ada di salah satu kolomnya.
4. **Haram hukumnya pake "Full XPath":** Kalo *selector* kamu diawali `/html/`, segera hapus dan tulis ulang pake `//` (Relative).

---

## 6. Bacaan Lanjut (Deep Dive)

Kalo kamu lagi butuh "Pintu Darurat" ini, cek referensi berikut:

### Dokumentasi Resmi (MDN)

* **[Introduction to XPath](https://developer.mozilla.org/en-US/docs/Web/XPath/Introduction_to_using_XPath_in_JavaScript)**: Cara kerja dasar XPath di browser.
* **[XPath Functions](https://developer.mozilla.org/en-US/docs/Web/XPath/Functions)**: Daftar fungsi sakti kayak `contains()`, `starts-with()`, dan `text()`.

### Cheat Sheets Populer

* **[DevHints XPath Cheat Sheet](https://devhints.io/xpath)**: Contekan cepet buat syntax yang sering dipake kayak `//ul/li` atau cari tombol berdasarkan teks.

---

Selesai! Sekarang kamu udah punya dua senjata utama: **CSS Selector** buat yang simpel dan cepat, serta **XPath** buat yang ribet dan butuh logika silsilah.
