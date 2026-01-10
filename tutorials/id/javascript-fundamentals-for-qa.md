---
title: 'Fundamental JavaScript untuk QA Engineer'
description: 'Kuasai esensi JavaScript yang kamu butuhkan untuk otomatisasi tes.'
---

# Fundamental JavaScript untuk QA Engineer

Kuasai esensi JavaScript yang kamu butuhkan untuk otomatisasi tes.

## Mental Model: Konsol adalah Lab Kamu

Jangan anggap dirimu sebagai "Software Developer" yang membangun aplikasi kompleks.
Anggap dirimu sebagai **Ilmuwan di Lab**.

- **Aplikasi** adalah eksperimen yang berjalan di dalam kandang.
- **JavaScript** adalah papan klip (_clipboard_) dan alat observasi kamu.

Kamu menggunakan JS untuk **menyiapkan data** (_setup_), **menyentuh eksperimen** (interaksi), dan **mencatat hasil** (_assertions_). Kamu tidak perlu tahu cara membangun kandangnya (_class_ kompleks, _inheritance_, webpack), kamu hanya perlu tahu cara membaca papan klipnya.

---

## Strategi: Prinsip "Cukup Saja"

JavaScript itu sangat luas. Untuk QA, kamu hanya butuh sekitar 20% dari bahasanya untuk melakukan 90% pekerjaan.

### 1. Variabel: Label

Gunakan `const` untuk semuanya. Gunakan `let` hanya jika kamu _benar-benar_ perlu mengubahnya nanti.

- **Bagus**: `const url = 'https://google.com';` (Label stabil)
- **Buruk**: `var x = 5;` (Ember bocor lama)

### 2. Tipe Data: Bukti (The Evidence)

- **String**: Apa yang kamu lihat di layar. `const text = "Login Gagal";`
- **Boolean**: Bendera logika. `const isVisible = true;`
- **Object**: Data tes kamu. `const user = { name: "Alice", id: 123 };`
- **Array**: Daftar hal-hal. `const errors = ["Email wajib", "Password terlalu pendek"];`

### 3. Fungsi: Eksperimen yang Bisa Dipakai Ulang

Jangan tulis kode setup yang sama 50 kali. Bungkuslah.

```javascript
const createTestUser = () => {
  return { username: `user_${Date.now()}`, password: 'secure' };
};
```

---

## Kasus Dunia Nyata: Promise yang Flaky

**Skenario**:
Sebuah tes mengklik tombol "Load Data" dan segera memeriksa apakah tabel memiliki baris.

```javascript
await page.click('#load-btn');
const rows = page.locator('tr').count(); // Mengembalikan 0 ❌
expect(rows).toBeGreaterThan(0);
```

**Misterinya**:
"Tapi secara manual berhasil!"
Tes gagal karena JavaScript itu **asinkron** (_asynchronous_). Klik terjadi, dan JS segera menjalankan baris berikutnya _sebelum_ server merespons.

**Solusinya**:
Pahami **Promises** dan `await`. Kamu harus memberitahu JS untuk "jeda" sampai aksinya selesai.

```javascript
await page.click('#load-btn');
// Tunggu sampai baris benar-benar muncul
await expect(page.locator('tr')).toHaveCount(5);
```

**Pelajaran**:
Dalam QA, waktu tidak linear. Kamu harus secara eksplisit menunggu semesta untuk mengejar skrip kamu.

---

## Jebakan-Jebakan (Traps)

### Jebakan #1: Perangkap Over-Engineering

**Kejahatan**: Menulis loop dan logika kompleks di dalam tes.

```javascript
// ❌ BURUK
if (user.role === 'admin') {
  for (let i = 0; i < 5; i++) {
    // ... logika kompleks
  }
}
```

**Masalahnya**: Tes harus **linear** dan **bodoh**. Jika tes kamu punya logika kompleks, siapa yang mengetes tesnya?
**Solusinya**: Jaga tes tetap datar. `Langkah 1 -> Langkah 2 -> Assert`. Jika kamu butuh logika, buat tes terpisah untuk skenario terpisah.

### Jebakan #2: Tipe "Any"

**Kejahatan**: Menggunakan `any` di TypeScript atau mengabaikan tipe.
**Masalahnya**: Kamu bertindak seolah properti ada padahal tidak.
`const id = response.data.user_id;` -> Tes lulus, tapi `id` itu `undefined` karena API berubah jadi `userId`.
**Solusinya**: Definisikan _interface_ untuk data tes kamu. Itu menangkap bug sebelum kamu menjalankan tes.

---

## Referensi Cepat: Toolkit QA

| Konsep                | Penggunaan di QA         | Contoh                                                    |
| :-------------------- | :----------------------- | :-------------------------------------------------------- |
| **Template Literals** | Selector dinamis         | `` `[data-id="${userId}"]` ``                             |
| **Destructuring**     | Ekstrak data API         | `const { token } = response.body;`                        |
| **Arrow Functions**   | Callback pendek          | `users.filter(u => u.active)`                             |
| **Spread Operator**   | Menggabungkan config tes | `const finalConfig = { ...defaultConfig, ...overrides };` |
| **Async/Await**       | Menunggu UI              | `await page.click();`                                     |

---
