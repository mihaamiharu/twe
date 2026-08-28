---
title: 'Gunakan TypeScript untuk Menemukan Kesalahan Test Code Lebih Awal'
description: 'Gunakan TypeScript untuk membuat test data dan helper lebih jelas sebelum test dijalankan, sambil tetap mengecek data yang diterima saat runtime dan behavior aplikasi.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan bagaimana TypeScript membantu menemukan type error sebelum test dijalankan;
- membaca inferred type, explicit type, union type, dan optional property di dalam test code;
- menentukan kapan explicit type membantu membuat shared test data atau helper lebih mudah dibaca dan di-review;
- memperbaiki type mismatch tanpa langsung menggunakan `any` atau unsafe cast; dan
- membedakan feedback dari TypeScript dengan validation yang baru bisa dilakukan saat runtime dan verification terhadap behavior aplikasi.

## Kenapa ini penting buat QA

JavaScript sebenarnya sudah cukup untuk menulis dan menjalankan Playwright test. TypeScript mulai terasa lebih berguna ketika test suite makin besar dan banyak test menggunakan test data, helper, fixture, configuration, atau API model yang sama.

JavaScript adalah dynamically typed language. Setiap value punya type saat runtime, tapi variable atau function parameter nggak otomatis dibatasi hanya untuk satu type. Akibatnya, value dengan type yang nggak sesuai bisa terus digunakan dan masalahnya baru terlihat ketika code path tersebut dijalankan.

Contohnya:

```js
const checkoutCase = {
  quantity: '2',
  expectedResult: 'sucess',
};

function nextQuantity(quantity) {
  return quantity + 1;
}

nextQuantity(checkoutCase.quantity); // '21', bukan 3
```

Di sini `quantity` ternyata berupa string, jadi `quantity + 1` menghasilkan `'21'`, bukan `3`.

Ada juga typo pada `expectedResult`: `'sucess'` seharusnya `'success'`. JavaScript tetap membiarkan code tersebut berjalan, dan masalahnya mungkin baru terlihat ketika bagian tersebut benar-benar digunakan. Bahkan typo seperti ini bisa membuat test masuk ke condition yang salah tanpa error yang jelas.

Dengan TypeScript, kita bisa menentukan type yang seharusnya digunakan:

```ts
type CheckoutCase = {
  quantity: number;
  expectedResult: 'success' | 'out-of-stock';
};

const checkoutCase: CheckoutCase = {
  quantity: '2',
  expectedResult: 'sucess',
};
```

Ketika compiler check project dijalankan, TypeScript bisa menunjukkan bahwa:

* `quantity` seharusnya `number`, bukan `string`; dan
* `expectedResult` hanya boleh `'success'` atau `'out-of-stock'`.

Dengan begitu, masalah seperti ini bisa ditemukan sebelum test dijalankan di browser.

Inilah salah satu manfaat utama TypeScript untuk QA automation: kesalahan di test code bisa ditemukan lebih awal, saat penyebabnya masih lebih mudah dipahami dan diperbaiki.

TypeScript tetap nggak bisa memastikan behavior aplikasi sudah benar. TypeScript membantu kita menjaga test code dan test data tetap sesuai dengan type yang sudah ditentukan, sementara behavior aplikasi tetap harus diverifikasi saat test dijalankan.

## Cara berpikir yang perlu kamu pegang

TypeScript membantu mengecek code sebelum JavaScript dijalankan:

```text
JavaScript code + type yang diketahui TypeScript
                    ↓
TypeScript mengecek apakah ada type yang nggak sesuai
                    ↓
Type nggak ikut digunakan saat runtime
                    ↓
JavaScript tetap berjalan dengan value yang sebenarnya
                    ↓
Behavior aplikasi tetap harus diverifikasi lewat test
```

Ada tiga area yang perlu dibedakan:

| Area                        | Yang bisa dibantu TypeScript                                          | Yang tetap perlu dicek saat runtime                                                    |
| --------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Test data dan perhitungan   | Field yang hilang, type value yang salah, atau result label yang typo | Apakah test data tersebut memang sesuai dengan scenario yang ingin diuji               |
| Helper atau fixture         | Argument atau return value yang type-nya sudah nggak sesuai           | Apakah setup benar-benar berhasil saat test dijalankan                                 |
| Environment, API, atau file | Penggunaan value yang masih optional atau `unknown`                   | Apakah datanya benar-benar tersedia dan structure-nya sesuai dengan yang kita harapkan |

TypeScript paling membantu untuk code dan data structure yang memang kita kontrol sendiri.

Kalau data berasal dari API, environment variable, file, atau source lain saat runtime, datanya tetap perlu dicek sebelum digunakan.

TypeScript juga membantu editor memberikan autocomplete, menemukan penggunaan code, dan menunjukkan bagian lain yang ikut terdampak saat kita melakukan refactor.

Manfaat ini makin terasa ketika test suite mulai besar dan code yang sama digunakan oleh banyak test, QA engineer, atau coding agent.

## Coba kita bedah contoh nyata

Sebuah checkout test suite punya test data yang dipakai oleh beberapa test:

```ts
type CheckoutResult = 'success' | 'out-of-stock';

type CheckoutCase = {
  productName: string;
  unitPrice: number;
  quantity: number;
  expectedResult: CheckoutResult;
  couponCode?: string;
};

const checkoutCase: CheckoutCase = {
  productName: 'Mechanical Keyboard',
  unitPrice: 120,
  quantity: 2,
  expectedResult: 'success',
};
```

Dengan type seperti ini, beberapa kesalahan di test data jadi lebih mudah ditemukan:

* `unitPrice` dan `quantity` harus berupa `number`;
* `expectedResult` hanya boleh menggunakan value yang memang sudah ditentukan, yaitu `'success'` atau `'out-of-stock'`;
* setiap test case harus punya semua field yang wajib; dan
* `couponCode?` boleh tidak ada karena coupon memang optional.

Kalau seseorang menulis `expectedResult: 'sucess'` atau lupa menambahkan `productName`, TypeScript bisa langsung menunjukkan error sebelum test dijalankan di browser.

### Gunakan explicit type di bagian yang memang perlu

Function yang digunakan untuk perhitungan bisa menentukan dengan jelas type input dan output-nya:

```ts
function expectedSubtotal(testCase: CheckoutCase): number {
  return testCase.unitPrice * testCase.quantity;
}

const subtotal = expectedSubtotal(checkoutCase);
```

Kalau saat refactor `quantity` berubah menjadi `string`, TypeScript bisa menunjukkan function atau bagian code lain yang masih mengharapkan `quantity` sebagai `number`.

Dengan begitu, kita nggak perlu menebak-nebak data seperti apa yang seharusnya diterima oleh function tersebut.

### Gunakan inference kalau type-nya sudah jelas

TypeScript sudah bisa menentukan type secara otomatis untuk banyak variable:

```ts
const taxRate = 0.11; // inferred sebagai number
const subtotal = expectedSubtotal(checkoutCase); // inferred sebagai number
const productNames = ['Mouse', 'Keyboard']; // inferred sebagai string[]
```

Di contoh seperti ini, menambahkan `: number` atau `: string[]` lagi biasanya nggak memberi informasi tambahan yang berarti.

Explicit type lebih berguna saat kita ingin memperjelas structure data yang dipakai bersama, input dan output function, atau bagian code lain yang memang perlu punya type yang jelas.

### Gunakan union dan optional property dengan jelas

Union membantu membatasi value yang memang boleh digunakan. Optional property menunjukkan bahwa sebuah value memang boleh tidak ada.

```ts
if (checkoutCase.couponCode) {
  await page.getByLabel('Coupon code').fill(checkoutCase.couponCode);
}
```

Condition ini masuk akal karena `couponCode` memang optional. Test hanya perlu mengisi field tersebut kalau value-nya tersedia.

Jangan menambahkan `?` hanya karena kita belum yakin sebuah field akan selalu ada. Gunakan optional property hanya kalau field tersebut memang boleh tidak tersedia sesuai dengan kebutuhan test data atau behavior yang diuji.

### Tetap cek value yang baru tersedia saat runtime

Environment variable bisa saja tidak tersedia saat test dijalankan:

```ts
const password = process.env.TEST_PASSWORD;

if (!password) {
  throw new Error('TEST_PASSWORD is required for the login scenario');
}

await page.getByLabel('Password').fill(password);
```

Guard ini melakukan dua hal. Pertama, test langsung fail dengan error yang jelas kalau configuration belum tersedia. Kedua, setelah guard tersebut, TypeScript tahu bahwa `password` sudah pasti berupa `string`, bukan lagi `string | undefined`.

Bandingkan dengan cara singkat yang nggak aman:

```ts
const password = process.env.TEST_PASSWORD as string;
```

`as string` hanya memberi tahu TypeScript untuk menganggap value tersebut sebagai `string`. Kalau environment variable-nya ternyata nggak ada, value-nya tetap `undefined` saat runtime.

Hal yang sama berlaku untuk API response. Kita bisa saja cast response menjadi `OrderResponse`, padahal response yang sebenarnya adalah error page atau JSON dengan structure yang berbeda:

```ts
type OrderResponse = {
  id: string;
  status: 'created';
};

const body = (await response.json()) as OrderResponse;
```

Cast tersebut hanya mengubah cara TypeScript membaca value tersebut. Cast tidak melakukan validation terhadap data yang benar-benar diterima dari API.

Kalau structure response belum bisa dipastikan, gunakan `unknown` terlebih dahulu lalu cek field penting sebelum datanya digunakan:

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

Untuk API response yang lebih kompleks, sebaiknya gunakan runtime schema atau validation yang memang sudah digunakan di project, daripada terus menambahkan inline check satu per satu.

## Kapan pendekatan ini cocok dipakai?

JavaScript bisa saja cukup untuk eksperimen kecil atau script yang memang hanya digunakan sementara. TypeScript mulai terasa lebih berguna ketika test suite makin besar, banyak code yang digunakan bersama, dikerjakan oleh beberapa orang, sering di-refactor, atau menggunakan generated code yang tetap perlu di-review.

Gunakan inference kalau type sebuah value sudah jelas. Tambahkan explicit type ketika type tersebut membantu memperjelas bagian yang digunakan oleh banyak test, seperti:

* shared test data;
* parameter dan return value dari helper;
* fixture dan configuration;
* value tertentu yang memang dibatasi, seperti product state; dan
* API model setelah response-nya divalidasi saat runtime.

Gunakan union kalau sebuah value hanya boleh menggunakan beberapa pilihan tertentu. Gunakan optional property hanya kalau value tersebut memang boleh tidak ada.

Saat review test code, hindari menggunakan `any` hanya untuk menghilangkan TypeScript error. `any` membuat TypeScript berhenti melakukan type checking pada value tersebut.

Kalau data baru diterima saat runtime dan structure-nya belum bisa dipastikan, seperti API response, gunakan `unknown` lalu cek value yang diperlukan sebelum menggunakannya.

Di sisi lain, nggak semua variable perlu diberi explicit type. Kita juga nggak perlu membuat type atau generic yang kompleks untuk test sederhana. Type yang terlalu kompleks justru bisa membuat test lebih sulit dibaca dan di-maintain.

Playwright bisa menjalankan test yang ditulis dengan TypeScript, tapi itu bukan berarti seluruh project otomatis sudah melewati TypeScript type checking. Karena itu, jalankan type check secara terpisah di local workflow atau CI:

```bash
npx tsc -p tsconfig.json --noEmit
npx playwright test
```

Kalau repository sudah punya script sendiri untuk type checking dan menjalankan test, gunakan command yang memang sudah dikonfigurasi di project tersebut.

## Kalau gagal, mulai cek dari mana?

Misalnya generated code ini nggak punya warning merah di editor:

```ts
type User = {
  email: string;
  role: 'customer' | 'admin';
};

const user = (await response.json()) as User;
await page.getByText(user.email).click();
```

Saat runtime, `user.email` ternyata `undefined` karena endpoint mengembalikan `{ "error": "unauthorized" }`.

Mulai diagnosis dari boundary-nya:

1. Apa status dan body yang sebenarnya dikembalikan endpoint?
2. Baris mana yang mengklaim sebuah type tanpa memeriksa value?
3. Apakah setup seharusnya melakukan authentication dulu atau fail berdasarkan response status?
4. Runtime validation apa yang cocok untuk response tersebut?
5. Behavior yang dilihat user apa yang masih perlu dibuktikan lewat Playwright assertion?

Mengganti cast menjadi `as unknown as User` hanya menyembunyikan masalah lebih dalam. Menambahkan `any` membuang feedback, bukan memperbaiki kontrak.

Review TypeScript dalam dua tahap.

Pertama, periksa compile-time contract:

- Apakah shared data dan helper boundary punya type yang jelas?
- Apakah union dan optional property memang berdasarkan product rule?
- Apakah inference dipakai ketika value-nya sudah jelas?
- Apakah code menambahkan interface atau generic yang sebenarnya nggak diperlukan?
- Apakah unsafe assertion menyembunyikan mismatch yang berguna?

Lalu, periksa kejujuran runtime-nya:

- Apakah external data diperiksa sebelum dipercaya oleh typed code?
- Apakah environment variable dijaga dengan guard sebelum dipakai?
- Apakah optional chaining bisa menyembunyikan required data yang hilang?
- Apakah setup benar-benar menghasilkan state yang digambarkan oleh type?
- Apakah Playwright assertion tetap membuktikan behavior aplikasi?

Type yang rapi adalah maintenance evidence yang berguna. Type bukan pengganti test result yang meaningful.

## Coba cek pemahamanmu

Review dua case berikut:

```ts
type TestUser = {
  email: string;
  role: 'customer' | 'admin';
};

const controlledUser: TestUser = {
  email: 'qa@example.com',
  role: 'superuser',
};

const response = await request.get('/api/test-user');
const apiUser = (await response.json()) as TestUser;
```

Coba jawab:

1. TypeScript error apa yang muncul pada `controlledUser`?
2. Kenapa TypeScript tetap menerima `apiUser` sebagai `TestUser`, meskipun response dari API belum tentu sesuai?
3. Apa yang perlu dicek sebelum data dari API digunakan sebagai `TestUser`?
4. Kenapa menggunakan `any` justru membuat kita kehilangan type checking yang berguna saat review?
5. Setelah datanya sudah valid, behavior aplikasi apa yang tetap perlu diverifikasi lewat test?

## Bandingkan dengan cara pikir ini

Contoh jawaban:

* `superuser` tidak termasuk dalam union `'customer' | 'admin'`, jadi TypeScript akan menunjukkan bahwa value tersebut tidak sesuai dengan type `TestUser`.
* Cast hanya memberi tahu TypeScript untuk menganggap data tersebut memiliki structure yang sudah ditentukan. Cast tidak mengecek response status, content type, atau field yang benar-benar diterima dari API.
* Cek response status dan validasi field penting menggunakan runtime validation yang memang digunakan di project sebelum datanya dipakai sebagai `TestUser`.
* `any` membuat kita kehilangan type checking yang berguna dan bisa membuat type yang salah ikut digunakan di bagian code lain tanpa warning.
* Data yang valid baru memastikan setup test sudah sesuai. Behavior aplikasi tetap perlu diverifikasi dengan Playwright assertion berdasarkan expected result dari scenario.

## Sebelum lanjut

Sekarang kamu seharusnya sudah bisa menjelaskan kenapa TypeScript mulai berguna ketika test suite berkembang, membaca dan memperbaiki type error sederhana, menentukan kapan explicit type memang membantu, serta mengenali code yang terlihat aman di TypeScript tetapi masih berisiko fail saat runtime.

Module 3 selesai setelah kamu menyelesaikan empat Core lesson dan tiga Core Practice yang fokus pada Playwright test pertama, penggunaan JavaScript untuk QA automation, dan asynchronous setup.

Exercise TypeScript menjadi Additional Practice karena runner saat ini bisa menjalankan code dan melihat runtime result, tetapi belum bisa mengecek TypeScript compiler error secara langsung atau memastikan data yang diterima saat runtime sesuai dengan type yang didefinisikan.

Selanjutnya, di Module 4 kamu akan menggabungkan pemahaman tentang role, accessible name, DOM context, code, dan behavior aplikasi untuk memilih locator yang lebih reliable.
