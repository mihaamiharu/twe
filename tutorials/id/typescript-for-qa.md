---
title: 'Review TypeScript Tanpa Menganggap Type sebagai Bukti'
description: 'Gunakan TypeScript untuk memperjelas kontrak test sambil tetap memeriksa runtime data dan perilaku produk.'
---

## Setelah lesson ini, kamu bisa

- membaca inferred type, explicit annotation, union, dan optional property di dalam test;
- memilih bagian yang membutuhkan explicit type supaya kontrak QA lebih gampang direview;
- mempersempit optional value dengan runtime guard, bukan unsafe cast;
- menjelaskan kenapa TypeScript type tidak bisa memvalidasi API response atau outcome produk; dan
- mereview kode test hasil generate yang memakai `any`, unsafe assertion, atau confidence yang menyesatkan.

## Kenapa ini penting buat QA

Coba bayangin kode hasil generate yang nggak punya warning merah di editor, tapi langsung gagal saat dijalankan:

```ts
const password = process.env.TEST_PASSWORD as string;
await page.getByLabel('Password').fill(password);
```

`as string` cuma meminta TypeScript memercayai penulis kode. Ia tidak membuat environment variable yang hilang tiba-tiba tersedia saat runtime.

Masalah yang sama bisa terjadi pada API data. Sebuah cast dapat mengklaim server mengembalikan order, padahal response aslinya adalah error page atau JSON dengan shape yang berbeda.

TypeScript tetap berguna karena membuat kontrak data yang diinginkan lebih terlihat dan menangkap banyak kesalahan kode lebih awal. Sebagai QA, kamu juga perlu tahu di mana confidence itu berakhir.

## Cara berpikir yang perlu kamu pegang

TypeScript menambahkan compile-time review layer:

```text
Source code + informasi type
            ↓
Type checking menemukan penggunaan yang tidak kompatibel
            ↓
Type dihapus saat kode menjadi JavaScript
            ↓
Runtime data dan perilaku produk tetap membutuhkan bukti
```

Bayangkan ada dua boundary:

| Boundary                          | Pertanyaan yang berguna                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Di dalam test code yang dipercaya | Apakah setiap value dipakai secara konsisten dengan kontrak yang diinginkan?                |
| Data yang masuk saat runtime      | Apakah environment, API, file, atau produk benar-benar memberikan value yang kita harapkan? |

TypeScript membantu boundary pertama. Boundary kedua masih membutuhkan runtime check, controlled setup, atau assertion.

## Coba kita bedah contoh nyata

Checkout suite menggunakan case yang terkontrol:

```ts
type CheckoutCase = {
  productName: string;
  quantity: number;
  expectedResult: 'success' | 'out-of-stock';
  couponCode?: string;
};

const checkoutCase: CheckoutCase = {
  productName: 'Mechanical Keyboard',
  quantity: 1,
  expectedResult: 'success',
};
```

Baca informasi yang disampaikan type tersebut:

- `productName` harus dipakai sebagai string di dalam typed code;
- `quantity` harus berupa number;
- union hanya menerima dua result label yang sudah didokumentasikan; dan
- `couponCode?` boleh tidak tersedia.

Ini membantu proses review. Type tersebut tidak membuktikan produk benar-benar ada, inventory sudah terkontrol, atau checkout akan berhasil.

### Pakai inference untuk local value yang sudah jelas

```ts
const quantity = 2; // inferred sebagai number
const productNames = ['Mouse', 'Keyboard']; // inferred sebagai string[]
```

Menulis ulang `: number` dan `: string[]` tidak menambah banyak informasi di sini. Explicit type paling berguna pada boundary seperti shared test data, input dan output helper, configuration, API model, dan custom fixture.

### Persempit optional runtime value

Environment variable bisa saja tidak tersedia:

```ts
const password = process.env.TEST_PASSWORD;

if (!password) {
  throw new Error('TEST_PASSWORD is required for the login scenario');
}

await page.getByLabel('Password').fill(password);
```

Guard tersebut melakukan dua hal. Ia menghasilkan runtime failure yang jujur dan mempersempit TypeScript type dari `string | undefined` menjadi `string` setelah condition itu.

Bandingkan dengan shortcut yang tidak aman:

```ts
const password = process.env.TEST_PASSWORD as string;
```

Cast tersebut menghilangkan warning tanpa menambah bukti.

### Perlakukan external data sebagai unknown sampai diperiksa

```ts
type OrderResponse = {
  id: string;
  status: 'created';
};

const body = (await response.json()) as OrderResponse;
```

Cast ini tidak memvalidasi response. Untuk runtime data yang penting, gunakan schema validator milik project atau explicit check sebelum memakai datanya. Pemeriksaan kecil bisa dimulai seperti ini:

```ts
const body: unknown = await response.json();

if (
  typeof body !== 'object' ||
  body === null ||
  !('id' in body) ||
  typeof body.id !== 'string'
) {
  throw new Error('Order response did not contain a string id');
}

const orderId = body.id;
```

Kontrak response yang lebih besar sebaiknya dikelola dengan runtime schema, bukan tumpukan inline check yang makin panjang.

## Kapan pendekatan ini cocok dipakai?

Gunakan inference untuk local value yang sudah jelas. Tambahkan explicit type saat boundary atau reusable contract akan lebih mudah direview: helper parameter, shared case data, fixture, configuration, dan API shape yang didukung.

Gunakan union kalau sebuah value hanya boleh berasal dari beberapa pilihan yang sudah didokumentasikan. Gunakan optional property hanya kalau ketiadaan value memang valid—bukan karena penulis kode belum yakin datanya ada atau tidak.

Hindari `any` saat mereview kode. `any` mematikan type checking yang berguna di sekitar value tersebut. Untuk untrusted data, lebih baik gunakan `unknown` karena kamu perlu menunjukkan bukti sebelum memakainya.

Jangan memberi annotation pada setiap variable atau membuat type system yang kompleks untuk test kecil. Type complexity juga punya maintenance cost.

Jangan menganggap command Playwright test selalu melakukan type checking project secara lengkap. Playwright bisa mengubah dan menjalankan TypeScript, tapi compiler check terpisah sebaiknya tetap dijalankan secara lokal atau di CI:

```bash
npx tsc -p tsconfig.json --noEmit
npx playwright test
```

Gunakan script yang sudah dikonfigurasi repository kalau command-nya berbeda.

## Kalau gagal, mulai cek dari mana?

Misalnya editor menerima kode ini:

```ts
type User = { email: string };

const user = (await response.json()) as User;
await page.getByText(user.email).click();
```

Saat runtime, `user.email` ternyata `undefined` karena response-nya adalah `{ "error": "unauthorized" }`.

Mulai diagnosis dari boundary:

1. Apa isi status dan body response yang sebenarnya?
2. Baris mana yang mengklaim sebuah type tanpa mengecek value?
3. Apakah test setup seharusnya melakukan authentication dulu atau fail berdasarkan response status?
4. Runtime validation apa yang cocok untuk data ini?
5. Outcome yang dilihat pengguna apa yang masih perlu di-assert setelahnya?

Mengganti cast menjadi `as unknown as User` hanya menyembunyikan masalah lebih dalam. Menambahkan `any` membuang feedback, bukan memperbaiki kontrak.

Perbaiki setup dan validasi runtime response sebelum memakai field-nya.

## Review hasil buatan AI

Review TypeScript hasil generate dalam dua tahap.

Pertama, periksa type contract:

- Apakah shared data dan helper boundary memiliki type yang jelas?
- Apakah union dan optional property memang berasal dari product rule?
- Apakah inference dipakai saat value-nya sudah jelas?
- Apakah AI menambahkan interface atau generic yang sebenarnya tidak diperlukan?

Lalu periksa kejujuran runtime-nya:

- Apakah `any` mematikan type checking?
- Apakah `as` mengklaim untrusted data punya shape tertentu tanpa validasi?
- Apakah environment variable dipaksa menjadi string tanpa guard?
- Apakah optional chaining bisa menyembunyikan required data yang hilang?
- Apakah runtime assertion masih membuktikan outcome produk?

Type yang rapi adalah maintenance evidence yang berguna. Type bukan pengganti hasil test yang meaningful.

## Coba cek pemahamanmu

Review kode ini:

```ts
type TestUser = {
  email: string;
  role: 'customer' | 'admin';
};

const response = await request.get('/api/test-user');
const user = (await response.json()) as TestUser;

await expect(page.getByText(user.email)).toBeVisible();
```

Jelaskan:

1. Kontrak berguna apa yang disampaikan `TestUser`?
2. Hal apa yang gagal dibuktikan oleh cast tersebut?
3. Status check atau runtime data check apa yang masih hilang?
4. Apa yang dibuktikan final assertion—dan apa yang tidak dibuktikannya?

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Type tersebut mendokumentasikan bahwa trusted test code mengharapkan email berupa string dan salah satu dari dua role yang didukung.
- Cast tidak membuktikan endpoint mengembalikan shape tersebut. Cast hanya meminta TypeScript memperlakukan value itu sebagai `TestUser`.
- Periksa response status dan validasi field penting memakai pendekatan runtime validation yang digunakan project sebelum memakai datanya.
- Assertion membuktikan bahwa text yang sama dengan email akhirnya terlihat. Assertion itu tidak membuktikan response valid, user yang ditampilkan memiliki role yang diharapkan, atau seluruh skenario berhasil kalau bukti tersebut belum ikut diamati.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa membaca kontrak TypeScript yang kecil, membedakan inference dari annotation yang berguna, menjaga optional runtime value, dan mempertanyakan unsafe cast di dalam kode hasil generate.

Module 3 selesai setelah kamu menuntaskan empat Core lesson dan tiga Core Practice yang terintegrasi: Playwright test pertama dengan bukti observable, JavaScript case yang fokus pada QA, dan asynchronous setup task. TypeScript syntax drill tetap menjadi Additional Practice karena menyelesaikan drill tidak sama dengan membuktikan runtime behavior atau review judgment.

Kamu siap masuk Module 4. Di sana, role, accessible name, DOM context, code literacy, dan runtime evidence dari tiga module pertama akan digabungkan untuk membuat keputusan locator yang reliable.
