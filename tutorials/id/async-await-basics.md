---
title: "Fundamental Async/Await"
description: "Ngatur eksekusi asynchronous biar tes stabil dan nggak gagal gara-gara masalah timing."
---

## 1. Mental Model: Kedai Kopi

Di dunia Browser yang sifatnya **Asynchronous**, alur kerjanya beda sama nulis urutan instruksi biasa. Anggap aja kayak kamu lagi di kedai kopi:

1. **Request (Pesan):** Kamu pesan satu Latte.
2. **Promise (Janji/Tiket):** Barista nggak langsung ngasih kopinya, tapi ngasih kamu **Nomor Antrian (Tiket)**. Kamu belum pegang kopinya, cuma "janji" kalau kopinya lagi dibikin.
3. **Await (Nunggu):** Kamu berdiri di depan kasir dan nggak mau pindah ke langkah selanjutnya (misal: nyari tempat duduk) sampai nomor kamu dipanggil dan kopinya jadi.

### Urutan Penundaan (Delay)

Tanpa `await`, script kamu bakal lari duluan ninggalin browser yang masih sibuk *loading*. Dengan `await`, mereka bakal jalan bareng secara sinkron.

![Async/Await Sequence Delay](/images/tutorials/async-await-sequence.png)

---

## 2. Strateginya: Aturan "Tunggu Semuanya"

Otomatisasi tes modern itu berinteraksi sama proses browser yang hidup di *luar* script kamu. Karena sinyal butuh waktu buat nyampai (lewat internet atau proses render), kamu harus anggap hampir semua interaksi sebagai kejadian yang "perlu ditunggu".

**Aturannya:** Kalau baris kode kamu nyentuh browser, **wajib di-await (tungguin dia).**

```javascript
await page.goto('/login');  // Tunggu halamannya terbuka
await page.click('#submit'); // Tunggu kliknya terdaftar
```

---

## 3. Kasus Nyata: User Hantu

Kalau kamu ngirim permintaan (request) API buat bikin user tapi nggak kamu `await`, itu ibarat kamu nyoba minum kopi padahal baristanya baru aja mau mulai giling biji kopinya. Kamu bakal dapet gelas kosong!

```javascript
await api.post('/users', { name: 'Ghost' }); // Tunggu sampai "Tiket"-nya selesai diproses jadi data asli!
```

### Tiket vs. Kopi

Kata kunci `await` itu fungsinya ngerubah **Promise** (Tiket/Janji) jadi **Hasil Sebenarnya** (Kopi/Data).

![Promise Ticket vs Coffee](/images/tutorials/async-await-promise-states.png)

---

## 4. Jebakan Batman

Hati-hati, ada dua kesalahan klasik yang sering bikin QA junior pusing:

### Jebakan #1: Fire-and-Forget (Tembak Lari)

Nulis `page.click('#submit')` tanpa kata kunci `await`. Script kamu bakal ngirim sinyal "klik" terus langsung kabur ke baris selanjutnya. Hasilnya? Pengecekan (*assertion*) mungkin bakal jalan hitungan *milidetik* sebelum browser sempat ngeproses klik itu. Tes kamu bakal gagal secara acak alias **flaky**.

### Jebakan #2: Static Sleep (Tidur Kaku)

Pake perintah `page.waitForTimeout(5000)` (maksa script tidur mati selama 5 detik).

* **Masalahnya:** Kalau halaman selesai *loading* dalam 1 detik, kamu buang-buang 4 detik. Kalau ternyata butuh 6 detik, tes tetep bakal gagal.
* **Solusinya:** Gunakan `await` bareng *locator* atau *assertion*. Mereka itu "pintar" dan bakal nunggu persis selama yang dibutuhkan, lalu lanjut secepat kilat begitu kondisinya terpenuhi.

---

## 5. Referensi Cepat

### Alur Kontrol

Gimana `await` bisa nge-*pause* langkah tes kamu tanpa bikin komputer nge-*freeze*.

![Async Control Flowchart](/images/tutorials/async-await-flowchart.png)

| Aksi | Kode | Artinya |
| --- | --- | --- |
| **Mulai Fungsi Async** | `async () => { ... }` | "Siap-siap, blok kode ini bakal banyak nunggu-nunggu." |
| **Pause Eksekusi** | `await action()` | "Berhenti dulu di sini sampai aksi ini beneran kelar." |
| **Verifikasi** | `await expect(...)` | "Tunggu sampai tampilan UI sesuai sama yang kita mau." |

---

## 6. Bacaan Lanjut (Deep Dive)

Kalau kamu mau bener-bener paham gimana "waktu" diatur di JavaScript:

### Dokumentasi Resmi (MDN)

* **[Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)**: Penjelasan teknis dan aturan penulisan syntax resminya.

### Visualisasi & Mekanika

* **[Loupe (Event Loop Visualizer)](http://latentflip.com/loupe/)**: Ini alat yang keren banget buat ngeliat gimana "Call Stack" dan "Callback Queue" kerja secara *real-time*.
* **[JavaScript.info: The Event Loop](https://javascript.info/event-loop)**: Buat kamu yang pengen tau bedanya *Microtasks* (Promises) vs *Macrotasks* (setTimeout).

---

Selesai! Dengan paham `async/await`, kamu sudah resmi punya "SIM" buat nyetir *script automation* dengan aman dan stabil.
