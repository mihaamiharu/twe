---
title: "XPath untuk Test Automation"
description: "Kuasai selector XPath untuk membuka kemampuan navigasi DOM yang kuat yang tidak bisa disediakan oleh CSS."
---

# XPath untuk Test Automation

Kuasai *selector* XPath untuk membuka kemampuan navigasi DOM yang kuat yang tidak bisa disediakan oleh CSS.

## Mental Model: File System

Bayangkan DOM komputer-mu sebagai **File System**.

* `/` adalah Root (Efektifnya `C:\` atau `/`).
* `div` adalah Folder.
* `input` adalah File.

**CSS** itu seperti "Quick Search" (Spotlight/Windows Search) – dia menemukan file berdasarkan nama atau tag tidak peduli di mana mereka berada.
**XPath** itu seperti Terminal/Command Line – dia memberimu kontrol presisi untuk menavigasi jalur (*path*), naik direktori (`../`), dan memfilter berdasarkan metadata yang kompleks.

---

## Strategi: Pendekatan Sniper

XPath itu kuat tapi *verbose* (panjang lebar) dan seringkali lebih lambat dari CSS.
**Strategi**: Gunakan CSS sebagai senapan mesin-mu (pilihan *default*), dan XPath sebagai senapan *sniper*-mu (kasus penggunaan khusus).

### Kapan menggunakan Sniper (XPath)

1. **Navigasi NAIK (Up)**: Kamu menemukan tombol "Delete" dan perlu mencari `row` spesifik tempat tombol itu berada. CSS belum bisa naik ke atas.
    * `//button[text()="Delete"]/ancestor::tr`
2. **Matching Teks**: Kamu perlu menemukan tombol yang secara spesifik berlabel "Submit".
    * `//button[text()="Submit"]`
3. **Logika Kompleks**: Kamu perlu elemen yang menyerupai "X" ATAU "Y" tapi BUKAN "Z".

---

## Toolset: Kemampuan Esensial XPath

### 1. Dasar-Dasar

* **Root**: `/html/body` (Absolute path - HINDARI ini!)
* **Di mana saja**: `//input` (Relative path - GUNAKAN ini!)
* **Predikat**: `//button[@type="submit"]` (Kondisi di dalam kurung `[]`)

### 2. Kekuatan Super (Axes)

Inilah kenapa kita pakai XPath. Kita bisa bergerak ke arah mana saja.

* **Parent**: `/..` atau `/parent::div`
  * `//span[@id="error"]/..` (Naik satu level)
* **Ancestor**: `/ancestor::form`
  * `//button/ancestor::div[@class="modal"]` (Naik terus sampai  menabrak modal)
* **Following Sibling**: `/following-sibling::input`
  * `//label[text()="Email"]/following-sibling::input` (Cari input di sebelah label)

### 3. Pencocokan Teks (Text Matching)

* **Exact Match**: `text()="Value"`
  * `//button[text()="Save"]` (Case sensitive!)
* **Contains**: `contains(text(), "Value")`
  * `//div[contains(text(), "Success")]`
* **Normalize Space**: `normalize-space()="Value"`
  * `//h1[normalize-space()="Welcome Back"]` (Mengabaikan spasi/baris baru yang tersembunyi)

---

## Jebakan-Jebakan (Traps)

### Jebakan #1: Rantai Rapuh (Absolute Paths)

**Skenario**: Menyalin XPath dari Chrome DevTools.
**Kodenya**: `/html/body/div[2]/div/div[3]/form/button`
**Masalahnya**: Jika *ada apa pun* yang berubah dalam struktur (contoh: div pembungkus ditambahkan), *path* ini akan rusak.
**Solusinya**: Gunakan *relative path* dengan atribut unik: `//form[@id="login"]//button`.

### Jebakan #2: Jebakan Teks

**Skenario**: `//button[text()=" Submit "]`
**Masalahnya**: Whitespace! Jika HTML-nya diformat seperti:

```html
<button>
  Submit
</button>
```

Teks sebenarnya mengandung baris baru dan spasi.
**Solusinya**: Selalu gunakan `normalize-space()` untuk ketahanan (*robustness*): `//button[normalize-space()="Submit"]`.

### Jebakan #3: Pajak Performa

**Skenario**: `//*[contains(text(), "Login")]`
**Masalahnya**: Memulai dengan `//*` memaksa browser untuk memindai *setiap elemen tunggal* di DOM. Pada halaman besar, ini lambat.
**Solusinya**: Jadilah spesifik. `//a[contains(text(), "Login")]` hanya memindai *link*.

---

## Tantangan: Refactor Selector Ini

**Selector Buruk**:

```xpath
/html/body/div[1]/main/div/table/tbody/tr[2]/td[5]/button
```

**DOM-nya**:

```html
<table id="users">
  <tr data-user-id="101">
    <td>John Doe</td>
    <!-- ... -->
    <td><button>Delete</button></td>
  </tr>
</table>
```

**Selector Lebih Baik**:

```xpath
//tr[@data-user-id="101"]//button[text()="Delete"]
```
