---
title: 'Dasar-Dasar Async/Await untuk Pengujian'
description: "Kuasai seni 'menunggu' untuk membasmi tes flaky selamanya."
---

# Dasar-Dasar Async/Await untuk Pengujian

Kuasai seni "menunggu" untuk membasmi tes _flaky_ selamanya.

## Mental Model: Kedai Kopi

Bayangkan dunia **Sinkron** (Mesin Penjual Otomatis):

1. Kamu masukkan uang.
2. Kamu tekan "A1".
3. Keripik jatuh.
4. Kamu mengambilnya.

- _Kendala_: Kamu **tidak bisa** melakukan hal lain sampai Langkah 4 selesai. Kamu terblokir.

Sekarang bayangkan dunia **Asinkron** (Kedai Kopi):

1. Kamu memesan Latte ("Request").
2. Barista memberimu **Nomor Tiket** ("Promise").
3. Kamu minggir dan cek Instagram ("Non-blocking").
4. Barista memanggil nomormu ("Resolution").
5. Kamu mengambil kopinya ("Await").

**Dalam Javascript:**

- `Promise` = Tiket.
- `async/await` = Berdiri di meja kasir menolak pindah sampai kopimu siap.

---

## Strategi: Aturan "Await Segalanya"

Dalam otomatisasi tes modern (Playwright/Puppeteer), 99% perintah berinteraksi dengan proses browser yang hidup _di luar_ skrip kamu.

**Aturan**: Jika baris kodemu menyentuh browser, **await itu**.

- Cek Detail:
  - Apakah dia mengklik? `await page.click()`
  - Apakah dia mengetik? `await page.typed()`
  - Apakah dia menavigasi? `await page.goto()`
  - Apakah dia memverifikasi? `await expect(page).toHaveURL()`

**Pengecualian**:
Kode yang berjalan murni di dalam proses _Node.js_ kamu (seperti menghitung `1 + 1` atau mengubah string) tidak butuh await.

---

## Kasus Dunia Nyata: Pengguna Hantu (The Ghost User)

**Skenario**:
Kamu menulis tes kuat yang membuat pengguna baru via API, lalu login dengan pengguna itu di frontend untuk mengetes Dashboard.

**Kode (Buggy)**:

```javascript
test('User can see dashboard', async ({ page }) => {
  // 1. Create User (API)
  api.post('/users', { name: 'Ghost', id: '123' }); // ⚠️ OOPS

  // 2. Login (UI)
  await page.goto('/login');
  await page.fill('#username', 'Ghost');
  await page.click('#login-btn');
});
```

**Kegagalan**:
"Invalid Credentials". Kenapa?
Karena kamu tidak men-`await` langkah 1. Kamu menembakkan request API (pesan kopi) dan segera mencoba meminumnya (Login) sebelum server memproses pembuatannya.

**Solusinya**:

```javascript
await api.post('/users', { ... });
```

---

## Jebakan-Jebakan (Traps)

### Jebakan #1: Fire-and-Forget (Tembak dan Lupakan)

**Kodenya**: `page.click('#submit')` (tanpa await)
**Akibatnya**: Skrip mengirim sinyal "klik" dan segera pindah ke asersi. Asersi mungkin berjalan _milidetik_ sebelum klik benar-benar terjadi di browser.
**Hasilnya**: Tes yang sangat _flaky_ yang hanya lulus 50% dari waktu.

### Jebakan #2: Balapan Gerak Lambat (Slow-Motion Race)

**Kodenya**:

```javascript
// Membuat 3 user
await createUser('A'); // 1 dtk
await createUser('B'); // 1 dtk
await createUser('C'); // 1 dtk
// Total: 3 detik
```

**Masalahnya**: Kamu berdiri mengantre untuk 3 kopi terpisah, satu per satu.
**Solusinya**: Pesan semuanya sekaligus (Paralelisme).

```javascript
await Promise.all([createUser('A'), createUser('B'), createUser('C')]);
// Total: 1 detik
```

---

## Referensi Cepat

| Aksi                   | Kode                           | Arti                                |
| :--------------------- | :----------------------------- | :---------------------------------- |
| **Mulai Fungsi Async** | `async function foo() { ... }` | "Saya akan gunakan await di dalam." |
| **Jeda Eksekusi**      | `await promise`                | "Berhenti di sini sampai selesai."  |
| **Paralelkan**         | `await Promise.all([p1, p2])`  | "Tunggu SEMUA ini."                 |
| **Balapan**            | `await Promise.race([p1, p2])` | "Tunggu yang PERTAMA dari ini."     |

---
