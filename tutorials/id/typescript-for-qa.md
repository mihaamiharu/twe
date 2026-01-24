---
title: 'TypeScript buat QA: Kenapa & Gimana?'
description: 'Pahami kenapa TypeScript jadi standar wajib otomatisasi modern dan gimana cara pakainya di tes kamu.'
---

## 1. Kenapa sih pake TypeScript?

Kalo JavaScript itu ibarat nyetir mobil biasa, TypeScript itu kayak nyetir mobil canggih yang punya fitur **Anti Tabrakan**. Dia gak ngatur kamu mau pergi ke mana, tapi dia bakal ngerem otomatis kalo kamu mau ngelakuin kesalahan konyol—bahkan sebelum mesinnya nyala.

### Masalahnya: "Error Diem-diem"

Di JavaScript, kamu bisa gak sengaja ngasih data `angka` (number) padahal sistem maunya `teks` (string). Kamu gak bakal sadar itu salah sampe tesnya jalan dan gagal 5 menit kemudian. Ngeselin, kan?

### Solusinya: "Satpam Galak" (Static Checking)

TypeScript nangkep error-error ini **pas kamu lagi ngetik**. Editor kamu (kayak VS Code atau playground ini) bakal langsung ngasih garis merah. "Woy, ini salah tipe!".

---

## 2. Anotasi Tipe Dasar

Di TypeScript, kita pake titik dua `:` buat "ngasih label" ke komputer: variabel ini isinya tipe apa.

### Variabel

```typescript
const username: string = "qa_user"; // Isinya harus teks
const loginRetries: number = 3;     // Isinya harus angka
const isSuccess: boolean = false;   // Isinya cuma true/false
```

### Fungsi

Di sini TypeScript paling berguna buat QA. Kamu bisa bikin aturan main buat fungsi helper kamu.

```typescript
function login(user: string, attempts: number): boolean {
    // TypeScript ngejamin 'user' PASTI teks 
    // dan 'attempts' PASTI angka. Gak bakal lolos kalo salah.
    return true;
}
```

---

## 3. Interface: Cetak Biru (Blueprint)

Pas kita ngurus data tes yang ribet (kayak respons JSON dari API), kita pake **Interface** buat ngejelasin bentuk datanya.

```typescript
interface TestCase {
    name: string;
    priority: 'high' | 'low'; // Cuma boleh 'high' atau 'low'
    timeout?: number;        // Opsional (tanda tanya), boleh ada boleh enggak
}

const loginTest: TestCase = {
    name: "Login Valid",
    priority: "high"
    // timeout gak ditulis gapapa, soalnya opsional
};
```

---

## 4. Manfaat Nyata buat QA Engineer

1. **Autocomplete Sakti:** Pas kamu ketik `page.`, editor langsung ngasih tau menu apa aja yang tersedia. Gak perlu nebak-nebak lagi "ini pake `click()` apa `onClick()` ya?".
2. **Anti Rusak (Refactoring):** Kalo kamu ganti nama properti di Page Object, TypeScript bakal ngasih tau **semua** file tes yang jadi error gara-gara perubahan itu. Gak ada yang kelewat.
3. **Dokumentasi Otomatis:** Gak perlu nulis komentar panjang lebar soal cara pake fungsi. Tipe datanya udah ngejelasin semuanya.

---

## 5. Aturan Main Engineering (Wajib Patuh!)

Biar TypeScript beneran guna, tim kita punya dua aturan keramat:

### Aturan #1: Haram Hukumnya Pake `any`

Pake `any` itu sama aja matiin otak TypeScript. Itu ibarat kamu matiin fitur anti-tabrakan di mobil cuma gara-gara bunyinya berisik.

* **JANGAN:** `let data: any = response.json();` (Mata tertutup)
* **GAS:** `let data: LoginResponse = response.json();` (Aman terkendali)

### Aturan #2: Data Luar Wajib Pake Interface

Kalo ada data dari luar (API, Database, Config), **WAJIB** punya Interface. Jangan pernah "nebak-nebak buah manggis" isi respons API. Definisikan dulu strukturnya.

> **Pro Tip:** Ada tools yang bisa bikinin interface otomatis dari data JSON loh!

---

## 6. Kotak Perkakas QA (The Cheat Sheet)

| Konsep | Kegunaan buat Kita | Contoh |
| --- | --- | --- |
| **`Promise<void>`** | Tipe buat fungsi async yang gak balikin nilai | `async function step(): Promise<void>` |
| **`Partial<T>`** | Buat update data seuprit (gak full) | `const patchData: Partial<User> = { name: 'Bob' }` |
| **`Page` / `Locator`** | Tipe wajib Playwright | `function clickBtn(page: Page)` |
| **`Record<string, T>`** | Buat objek dinamis / map | `const headers: Record<string, string>` |

---

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
