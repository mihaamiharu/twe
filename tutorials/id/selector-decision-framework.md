---
title: 'Framework Keputusan Selector'
description: 'Panduan praktis untuk memilih antara selector CSS dan XPath untuk efektivitas maksimal.'
---

# Framework Keputusan Selector

Panduan praktis untuk memilih antara selector CSS dan XPath untuk efektivitas maksimal.

## Mental Model: Flowchart

Ketika menginspeksi sebuah elemen, jalankan logika keputusan cepat ini di kepalamu:

1. **Bisakah saya pakai Test API?** (`data-testid`)
   - **YA**: Berhenti. Gunakan itu.
   - **TIDAK**: Lanjut ke langkah 2.

2. **Bisakah saya pakai Semantic Attribute?** (`name`, `type`, `role`, `aria-label`)
   - **YA**: Berhenti. Gunakan itu (CSS).
   - **TIDAK**: Lanjut ke langkah 3.

3. **Apakah saya butuh Kekuatan Super?** (Pencocokan teks, penelusuran Parent/Ancestor)
   - **YA**: Beralih ke XPath segera.
   - **TIDAK**: Gunakan CSS Class/ID (jika stabil).

---

## Kasus Dunia Nyata: Pendekatan Hybrid

**Skenario**:
Kamu sedang mengetes dashboard Manajemen User. Kamu perlu klik tombol "Delete" untuk user tertentu, "John Doe".
Tabelnya punya 50 baris. Tombol "Delete" tidak punya ID unik.

**Percobaan CSS Murni (Gagal)**:

```css
/* Rapuh: Bergantung pada John yang ada di baris ke-3 */
tr: nth-child(3) .delete-btn;
```

**Percobaan XPath Murni (Bertele-tele)**:

```xpath
//table[@class="user-table"]//tr[td[text()="John Doe"]]//button[text()="Delete"]
```

**Pendekatan Hybrid (Sukses)**:
Gabungkan yang terbaik dari kedua dunia. Gunakan _locator_ level tinggi untuk container, lalu filter.

- **Logikanya**: Temukan baris berdasarkan Teks ("John Doe"), lalu temukan Tombol di dalam baris itu.
- **Implementasi Playwright**:

  ```typescript
  await page
    .getByRole('row')
    .filter({ hasText: 'John Doe' })
    .getByRole('button', { name: 'Delete' })
    .click();
  ```

**Pelajaran**:
Jangan jadi purist. Aplikasi dunia nyata seringkali membutuhkan strategi campuran (`Role` + `Text Filter`) untuk mencapai ketahanan (_robustness_).

---

## Strategi: Aturan 3 Detik

Saat menulis sebuah _selector_, terapkan **Aturan 3 Detik**:

> Jika kamu harus menatap DOM lebih dari 3 detik untuk menyusun sebuah _selector_ CSS, **beralihlah ke XPath** (atau selector Text/Role).

**Kenapa?**

- CSS bagus untuk hal-hal simpel: `.btn-primary`, `#login`.
- Jika kamu mendapati dirimu menulis `div > div:nth-child(2) > span + input`, kamu sudah kalah. _Selector_ itu rapuh dan sulit dibaca.
- XPath `//label[text()="Email"]/following-sibling::input` memang panjang, tapi itu **logika yang bisa dibaca**.

---

## Jebakan-Jebakan (Traps)

### Jebakan #1: Jebakan Purist

**Pola Pikir**: "XPath itu lambat/buruk. Saya harus pakai CSS untuk semuanya."
**Hasilnya**: Kamu menulis _hacks_ CSS gila seperti `:not(:empty) + div` untuk mensimulasikan seleksi _parent_, atau menggunakan rantai `nth-child` yang rapuh.
**Solusinya**: Rangkul XPath untuk keahliannya (Navigasi & Teks). Mesin XPath browser modern sangat cepat (seringkali selisih <1ms vs CSS).

### Jebakan #2: Jebakan Over-Optimisasi

**Pola Pikir**: "Saya butuh selector yang paling cepat mutlak."
**Realitanya**:

- Selector A (CSS): eksekusi 1ms
- Selector B (XPath): eksekusi 2ms
- Network Request: 500ms
- React Render: 50ms

**Solusinya**: Performa _selector_ dapat diabaikan dibandingkan dengan _network/rendering_. Optimalkan untuk **Maintenance** dulu, Performa belakangan.

---

## Referensi Cepat

| Kebutuhan                | Tool Pilihan | Contoh                             |
| :----------------------- | :----------- | :--------------------------------- |
| **Atribut Unik**         | CSS          | `[data-testid="submit"]`           |
| **Input Form**           | CSS          | `input[name="email"]`              |
| **Teks Persis**          | XPath        | `//button[text()="Save"]`          |
| **Mengandung Teks**      | XPath        | `//div[contains(text(), "Error")]` |
| **Parent/Ancestor**      | XPath        | `//input/ancestor::form`           |
| **Sibling Sebelumnya**   | XPath        | `//td/preceding-sibling::td`       |
| **Keterbacaan Tercepat** | CSS          | `.card-header`                     |
