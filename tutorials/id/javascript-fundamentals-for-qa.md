---
title: 'Fundamental Modern JavaScript (ES6) buat Automation'
description: 'Pahami dasar-dasar ES6 "Seperlunya Saja" yang wajib dikuasai buat otomatisasi tes.'
---

> **Prinsip Dasar:** Jangan pusingin semua fitur JavaScript. Kita cuma belajar bagian yang beneran kepake buat gerakin browser secara otomatis.

## 1. Mental Model: Remote Control

Jangan bayangin dirimu sebagai *developer* yang lagi bikin aplikasi rumit. Bayangin dirimu lagi ngendaliin **Drone Pake Remote Control** (Browser).

* **Drone (Browser):** Dia hidup di dunia terpisah. Punya hukum fisikanya sendiri (loading, rendering) dan butuh waktu buat gerak.
* **Remote (JavaScript):** Ini alat di tangan kamu. Isinya tombol perintah kayak "Gerak Kiri" atau "Klik Tombol".
* **Delay (Jeda):** Karena drone-nya jauh, selalu ada jeda antara kamu mencet tombol sampai drone-nya beneran gerak. Kamu harus nunggu sinyal "Perintah Berhasil" sebelum lanjut ke langkah berikutnya.

---

## 2. Variables: Cara Modern

Di ES6, kita cuma pake dua cara buat nyimpen data. Lupakan `var` (itu "ember bocor" masa lalu yang bikin banyak bug).

### `const` (Standar Utama)

Pake ini buat data tes yang nggak bakal berubah selama tes jalan (misal: URL, *selector*, atau nilai *timeout*).

* **Contoh:** `const loginButton = '.btn-primary';`

### `let` (Variabel Dinamis)

Pake ini cuma kalo nilainya **harus** berubah, misalnya buat ngitung berapa kali tes diulang (*retry count*).

* **Contoh:** `let retryCount = 0;`

---

## 3. Tipe Data & Koleksi: Bukti (Evidence)

### Strings & Template Literals

ES6 ngenalin **Template Literals** pake *backticks* ( ` ). Ini sakti banget buat "nyuntik" variabel langsung ke dalem *selector*.

* **Cara Lama:** `'button[name="' + btnName + '"]'` (Ribet dan gampang salah kutip).
* **Cara ES6:** ``button[name="${btnName}"]`` (Bersih dan gampang dibaca).

### Booleans (Saklar)

Cuma ada `true` (nyala) atau `false` (mati). Dipake buat ngecek status, misal: "Apakah tombolnya udah muncul?"

### Arrays (Daftar Antrian)

Kumpulan item yang berurutan. Di JS, kita mulai ngitung dari angka **0**.

* **Contoh:** `const menuItems = ['Home', 'About', 'Contact'];`

### Objects (Profil Lengkap)

Dipake buat ngegrup data yang saling berkaitan, kayak profil user buat testing.

```javascript
const testUser = {
  username: 'qa_ninja',
  role: 'admin',
  isPremium: true
};
```

![Array vs Object Comparison](/images/tutorials/js-array-vs-object.png)

---

## 4. Perbandingan & Percabangan: Keputusan "JIKA"

### Operator Perbandingan

Kita pake ini buat bandingin hasil asli vs ekspektasi:

* `===` (Strict Equal): Bener-bener sama persis.
* `!==` (Not Equal): Cek kalau ada yang beda (buat *negative test*).

### Percabangan (If/Else)

Dipake buat nanganin kondisi lingkungan atau elemen yang munculnya opsional, kayak *popup cookies*.

**Kasus Nyata QA: Lewatin Popup**

```javascript
const isPopupVisible = await page.isVisible('#cookie-banner');

if (isPopupVisible) {
  await page.click('#accept-cookies');
}
// Abis itu baru lanjut ke tes inti
```

![Logic Branching Flowchart](/images/tutorials/js-logic-flow-popup.png)

---

## 5. Async / Await: Ngatur "Jeda Sinyal"

Ini bagian **paling penting**. Browser itu lambat, sedangkan kode JavaScript itu sangat cepet. Kalau kamu nggak pake `await`, script kamu bakal "nabrak" karena nyoba verifikasi hasil sebelum halamannya selesai *loading*.

* **`async`**: Taruh di depan fungsi buat bilang: "Misi ini butuh waktu."
* **`await`**: Taruh di depan aksi buat bilang: "Tahan dulu di sini sampai si Drone ngirim sinyal 'Oke, udah beres!'."

**Logika di Automation:**

```javascript
// ✅ Cara yang Bener: Sabar Menunggu
await page.goto('https://app.com'); // Tunggu loading beres
await page.fill('#user', 'admin');   // Tunggu teks terisi
await page.click('#submit');        // Tunggu klik terproses
```

![Async/Await Sequence Diagram](/images/tutorials/js-async-sequence.png)

---

## 6. Aturan Engineering "Linear"

### Aturan #1: Tetap "Linear dan Simple"

Jangan bikin logika tes yang terlalu pinter. Tes itu harusnya lurus: `Langkah A -> Langkah B -> Cek Hasil`. Kalau kebanyakan `if/else` di dalem tes, nanti kamu malah bingung yang gagal itu **Aplikasi**-nya atau **Logika Tes** kamu yang keribetan.

### Aturan #2: Destructuring (Bongkar Muat)

Cara cepet buat ambil data dari objek.

* **Mending:** `const { username, role } = testUser;`
* **Daripada:** `const username = testUser.username;`

---

## 7. Kotak Perkakas Kontroller QA

| Konsep | Kegunaan buat Kamu | Contoh |
| --- | --- | --- |
| **Template Literals** | Bikin selector dinamis | ``li:has-text("${productName}")`` |
| **Arrow Functions** | Nulis blok tes yang ringkas | `async () => { ... }` |
| **Logical AND (&&)** | Cek dua syarat sekaligus | `if (isLoggedIn && isAdmin)` |
| **Async/Await** | Mastiin script nggak "balapan" | `await page.click('#login');` |

---

## 8. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi (MDN)

* **[Async/Await Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)**: Penjelasan teknis resmi soal *promises* dan cara nunggu.
* **[Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)**: Gimana cara kerja *backticks* di belakang layar.

### Standar Modern

* **[Modern JavaScript Tutorial](https://javascript.info/)**: Sumber favorit komunitas buat belajar JS "Modern" (ES6+) dari nol.
* **[Destructuring Assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)**: Panduan detail soal "bongkar muatan" objek data.
