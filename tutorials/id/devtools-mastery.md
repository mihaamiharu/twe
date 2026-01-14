---
title: 'Pondasi 3: Menguasai Browser DevTools'
description: 'Inspect tool itu senjata paling sakti buat QA Engineer. Belajar cara pakenya buat "ngintip" kode website apa pun.'
---

> **Pesan Singkat:** *Inspect tool* adalah senjata paling ampuh buat QA Engineer. Pelajari cara pakenya buat "ngintip" kode di balik website apa pun.

Sebelum kamu mulai nulis *selector*, kamu kudu nemuin dulu elemennya di dalem kode. Kita bakal sering mainan di tab **Elements** yang ada di Developer Tools (DevTools) browser.

## 1. Tool "Select"

Cara paling *sat-set* buat nemuin elemen adalah pake tool **Select**.

![The Select Tool Action](/images/tutorials/devtools-select-tool.png)

* **Cara pakenya:** Buka DevTools (Klik kanan di mana aja terus pilih **Inspect**, atau pencet `F12`). Klik ikon kecil gambar "panah dalem kotak" di pojok kiri atas jendela DevTools.
* **Aksinya:** Arahin mouse ke halaman web. Pas kamu gerakin mouse, browser bakal nge-*highlight* elemen yang dilewatin. Klik salah satu, dan kodenya bakal otomatis loncat ke baris yang pas di tab **Elements**.

---

## 2. Tab Elements: Blueprint "Live"

Beda sama "View Source" yang cuma nampilin kode mentah dari server, tab **Elements** nampilin **Live DOM** (DOM yang lagi jalan).

* **Kenapa ini penting:** Website modern (yang pake React, Angular, atau Vue) kodenya berubah-ubah terus pas kamu klik sana-sini. Tab Elements ngasih liat kode persis seperti kondisinya *detik ini juga*.
* **Apa yang dicari:** Di sinilah tempat kamu nyari **Tags**, **Attributes**, dan **Values** yang udah kita bahas di Pondasi 1.

---

## 3. Searching dan Verifying (Ctrl + F)

Salah satu "dosa besar" pas bikin automation adalah bikin *selector* yang nemuin **lima** elemen padahal kamu cuma mau klik **satu**. Kamu bisa ngecek keunikan *selector*-mu langsung di DevTools.

![Uniqueness Validator](/images/tutorials/devtools-uniqueness.png)

* **Workflow-nya:**
    1. Pas lagi di tab Elements, tekan `Ctrl + F` (atau `Cmd + F`).
    2. Ketik CSS *selector* kamu (contoh: `#login-button`).
    3. Liat angka di sebelah kanan kolom search (contoh: "1 of 1").

> [!CAUTION]
> **Targetnya:** Kalo tulisannya "1 of 3", berarti *selector* kamu terlalu umum. Kamu perlu nambahin detail lagi biar dia jadi unik (spesifik cuma satu).

---

## 4. Console: Tempat Main (Playground) Automation

Tab **Console** itu ibarat tempat kamu bisa "ngobrol" langsung sama browser. Ini tempat terbaik buat ngetes apakah *selector* kamu beneran jalan sebelum kamu *copy-paste* ke script test.

![Console Object Proof](/images/tutorials/devtools-console-proof.png)

* **Ngetes Selector:** Ketik `document.querySelector('selector-kamu-di-sini')` terus tekan Enter.
  * Kalo browser munculin elemennya, berarti *selector* kamu valid.
  * Kalo balikannya `null`, berarti browser nggak nemu apa-apa.

> [!TIP]
> **Shortcut $0:** Kalo kamu lagi nge-*highlight* elemen di tab **Elements**, coba pindah ke **Console** terus ketik `$0`. Browser bakal ngasih tau elemen apa itu. Ini trik buat mastiin kamu lagi liat objek yang bener.

---

## 5. Tab "Styles": Cek Visibilitas

Kadang script kita gagal gara-gara elemennya "Hidden" (sembunyi) atau "Covered" (ketutup elemen lain).

* **Cara ceknya:** Klik elemennya, terus liat panel **Styles** di sebelah kanan.
* **Apa yang dicari:** Cari properti kayak `display: none` atau `visibility: hidden`. Kalo ini aktif, tools automation kamu (kayak Selenium, Cypress, atau Playwright) mungkin nggak bakal bisa klik elemen itu, walaupun *selector*-nya udah bener.

---

## Checklist Rangkuman

Biar makin jago pake DevTools, pastiin kamu bisa:

1. Pake **Select tool** buat loncat ke tombol atau kolom input tertentu di kode.
2. Pake `Ctrl + F` buat mastiin *selector* kamu **unik** (1 of 1).
3. Pake **Console** buat konfirmasi kalo browser "melihat" elemen yang sama kayak yang kamu maksud.

---

## 6. Bacaan Lanjut (Deep Dive)

Kuasai toolkit bawaan browser kamu lewat sini:

### Dokumentasi Resmi (Chrome)

* **[Chrome DevTools Overview](https://developer.chrome.com/docs/devtools/)**: Pusat info buat semua fitur DevTools.
* **[Inspect DOM Elements](https://developer.chrome.com/docs/devtools/dom)**: Bahasan dalem soal ngedit dan debugging HTML.
* **[Console Overview](https://developer.chrome.com/docs/devtools/console)**: Belajar cara nulis log dan jalanin JavaScript secara interaktif.
