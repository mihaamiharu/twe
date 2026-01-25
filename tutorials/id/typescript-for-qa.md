---
title: 'TypeScript buat QA: Kenapa & Gimana?'
description: 'Pahami kenapa TypeScript jadi standar wajib otomatisasi modern dan gimana cara pakainya di tes kamu.'
---

## 1. Perbedaan Inti: JS vs. TS

Bayangkan JavaScript sebagai "Pertunjukan Langsung" dan TypeScript sebagai "Gladi Resik."

**JavaScript (Dinamis):** Dia tidak memeriksa tipe data sampai kode benar-benar berjalan. Jika ada typo, kamu baru tahu 5 menit setelah tes jalan dan gagal.

**TypeScript (Statis):** Dia menambahkan "Pengecekan Pra-terbang" (Pre-flight Check). Dia menangkap error saat kamu *sedang menulis kode*. IDE kamu akan langsung memberi garis merah pada error, menyelamatkanmu dari siklus "Jalankan, Gagal, Perbaiki."

### Perbandingan Sekilas

![Ringkasan Feedback Loop](/images/tutorials/ts-feedback-loop.png)

| Fitur | JavaScript (JS) | TypeScript (TS) |
| :--- | :--- | :--- |
| **Penemuan Error** | Saat Runtime (Tes crash). | Saat Compile-time (Pas ngoding). |
| **Refactoring** | Bahaya. Ganti nama method cuma modal "find and replace" itu judi. | Aman. IDE mengupdate semua referensi di seluruh suite secara instan. |
| **Setup** | Nol setup. Tinggal jalan. | Butuh `tsconfig.json` dan compiler. |

## 2. Anotasi Tipe Dasar (Cara yang Benar)

Di TypeScript, kita pakai titik dua `:` untuk mendefinisikan tipe. Namun, TS modern itu pintar—gunakan **Inference** (tebakan otomatis) untuk variabel simpel dan **Annotations** (label manual) untuk logika kompleks.

```typescript
// Inference: TS tahu tipe ini secara otomatis. Jangan lebay kasih label!
const loginRetries = 3; 
const isSuccess = false;

// Annotation: Wajib buat parameter fungsi biar aman.
function login(user: string, attempts: number): boolean {
    return true;
}
```

## 3. Interface: "Kontrak Pengujian" Kamu

![Peta Interface](/images/tutorials/ts-interface-map.png)

Saat menangani data tes yang kompleks (seperti respon API atau Profil User), gunakan **Interfaces** untuk memverifikasi struktur data.

```typescript
interface TestCase {
    name: string;
    priority: 'high' | 'low'; // Union type: mencegah typo kayak 'High'
    timeout?: number;        // Properti opsional
}

const loginTest: TestCase = {
    name: "Valid Login",
    priority: "high"
};
```

## 4. Aturan "SDET" Profesional

Untuk mendapatkan manfaat penuh TypeScript di framework otomatisasi, ikuti tiga aturan emas ini:

### Visualisasi Keamanan

![Gerbang Tipe](/images/tutorials/ts-type-gate.png)

1. **Hindari `any` sebisa mungkin**: Pakai `any` itu mematikan sistem keamanan. Kalau kamu tidak yakin tipenya (misal dari API dinamis), gunakan `unknown`.
2. **Jangan Paksa Tipe (`as`)**: Jangan memaksa tipe pakai `data as User`. Kalau datanya aslinya salah, tes kamu lolos tapi asersi bakal gagal. Gunakan **Type Guards** untuk memverifikasi data itu ada.
3. **Mode Ketat (Strict Mode)**: Pastikan `tsconfig.json` kamu ada `"strict": true`. Ini memaksamu menangani elemen `null` atau `undefined`, yang jadi penyebab utama tes *flaky*.

## 5. Kotak Perkakas QA (The QA Power Toolkit)

| Utility | Kegunaan di QA | Contoh |
| :--- | :--- | :--- |
| **`Promise<void>`** | Tipe return buat langkah tes async. | `async function step(): Promise<void>` |
| **`Partial<T>`** | Buat request API "Patch" atau "Update". | `const update: Partial<User> = { name: 'Bob' }` |
| **`Record<K, V>`** | Header dinamis atau map config. | `const headers: Record<string, string>` |

## 7. Bacaan Lanjut (Deep Dive)

### Sumber Resmi

* **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)**: Kitab sucinya TypeScript.
* **[Playwright TypeScript Guide](https://playwright.dev/docs/test-typescript)**: Cara setting TS khusus buat Playwright.

### Permata Komunitas

* **[Total TypeScript](https://www.totaltypescript.com/tutorials)**: Tutorial visual yang keren banget buat belajar konsep advanced.
* **[TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)**: Buku gratis yang ngejelasin "Kenapa"-nya dengan enak.

---

## Misi Kamu

Langsung aja gas ke **TypeScript Challenges** buat ngelatih otot koding kamu! Kita bakal mulai dari yang gampang dulu (anotasi dasar) sampe bikin utility tes yang canggih & aman.
