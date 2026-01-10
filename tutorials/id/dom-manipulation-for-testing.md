---
title: 'Manipulasi DOM untuk Pengujian'
description: 'Belajar kapan harus keluar dari kotak otomatisasi standar dan melakukan operasi bedah pada DOM.'
---

# Manipulasi DOM untuk Pengujian

Belajar kapan harus keluar dari kotak otomatisasi standar dan melakukan operasi bedah pada DOM.

## Mental Model: Ahli Bedah (The Surgeon)

Anggap alat otomatisasi tes kamu (Playwright/Cypress) sebagai **Dokter Umum**.
Seringkali, memeriksa tanda vital (membaca teks) dan meresepkan obat (mengklik tombol) sudah cukup.

**Manipulasi DOM Langsung** adalah **Pembedahan**.
Ini invasif. Kamu membedah pasien (halaman browser) untuk memperbaiki sesuatu di dalam.

- **Risiko**: Tinggi. Kamu mungkin melewati validasi yang akan dihadapi pengguna sungguhan.
- **Kekuatan**: Mutlak. Kamu bisa mengubah nilai, atribut, atau status apa pun secara instan.

Gunakan pembedahan hanya ketika perawatan non-invasif gagal.

---

## Strategi: Prinsip "Glass Box"

Dalam pengujian "Black Box", kamu hanya menyentuh apa yang disentuh pengguna.
Dalam pengujian "Glass Box", kamu bisa melihat ke dalam dan menyentuh roda giginya.

**Gunakan Manipulasi DOM untuk:**

1. **Setup (Injecting State)**: Mempercepat aplikasi ke status tertentu.
   - _Contoh_: Menyuntikkan token JWT ke LocalStorage agar kamu tidak perlu login via UI setiap saat.
2. **Teardown (Cleanup)**: Mereset aplikasi.
3. **Membaca Deep State**: Memeriksa properti yang tidak terlihat (contoh, `data-analytics-id`).

**Hindari Manipulasi DOM untuk:**

1. **Interaksi**: Jangan gunakan `element.click()` di JS. Gunakan `page.click()` di Playwright.

---

## Kasus Dunia Nyata: Date Picker yang Tidak Bisa Diklik

**Skenario**:
Kamu sedang mengetes formulir "Booking Penerbangan".
Date picker pihak ketiga yang umum menutupi field `<input>` yang sebenarnya.
Playwright mencoba mengklik input, tapi date picker menghalanginya. Tes menjadi _flaky_.

**Pendekatan Ahli Bedah**:
Daripada melawan lapisan UI, lakukan pembedahan. Set nilai langsung pada input.

```javascript
// "Pembedahan" - Memintas lapisan UI
await page.evaluate(() => {
  const dateInput = document.querySelector('#depart-date');
  dateInput.value = '2025-12-25';
  // Vital: Beritahu React/Angular bahwa nilai berubah
  dateInput.dispatchEvent(new Event('input', { bubbles: true }));
});
```

**Override yang Valid**:
Kita tidak mengetes _library Date Picker_ (itu tugas pembuat library). Kita mengetes _Logika Booking_.
Dengan memintas gangguan UI, kita memastikan Logika Booking kita dites dengan kuat (_robust_).

---

## Jebakan-Jebakan (Traps)

### Jebakan #1: Jebakan Trusted Event

**Kejahatan**: Menggunakan `element.click()` di JavaScript untuk "mengklik" tombol.
**Realitanya**:

- Klik pengguna asli memicu: `mousedown`, `focus`, `mouseup`, `click`.
- Klik JS memicu: `click` saja.
  **Risikonya**: Kamu mungkin mengklik tombol yang sebenarnya tertutup modal atau dinonaktifkan oleh CSS. Tes lulus, tapi pengguna terblokir.
  **Solusinya**: Selalu gunakan klik native framework kamu (`page.click()`), yang memeriksa visibilitas dan aksiabilitas.

### Jebakan #2: Diskoneksi React/State

**Kejahatan**: `input.value = 'hello'`
**Realitanya**: Framework modern (React, Vue) melihat state internal mereka, bukan DOM. Mengubah DOM tidak mengupdate React.
**Solusinya**: Kamu harus mengirimkan _event_ (`dispatchEvent(new Event('input'))`) setelah mengubah nilai untuk membangunkan framework.

---

## Alat Bedah Esensial

### 1. `document.querySelector` (Pisau Bedah)

Menemukan elemen cocok pertama.

```javascript
const btn = document.querySelector('.submit-btn');
```

### 2. `document.querySelectorAll` (Jaring)

Menemukan semua kecocokan. Mengembalikan NodeList.

```javascript
const links = document.querySelectorAll('a');
// Konversi ke Array untuk filter
const pdfs = [...links].filter((link) => link.href.endsWith('.pdf'));
```

### 3. `element.closest()` (Pelacak)

Berjalan NAIK ke atas pohon (_tree_). Bagus untuk menemukan kontainer sebuah tombol.

```javascript
const row = deleteBtn.closest('tr'); // Menemukan barisnya!
```

---
