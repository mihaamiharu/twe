---
title: 'Pilih Evidence yang Benar-Benar Membuktikan Outcome'
description: 'Ubah product expectation menjadi sekumpulan kecil user-observable Playwright assertion yang cukup dan melakukan retry.'
---

## Setelah lesson ini, kamu bisa

- mengubah product risk menjadi observable test claim;
- memilih assertion untuk content, control state, form value, collection size, atau navigation state;
- membedakan auto-retrying web assertion dari one-time value check;
- menghindari negative assertion yang lulus sebelum behavior terjadi; serta
- me-review generated assertion yang lemah, berlebihan, atau hanya memeriksa implementation detail.

## Kenapa ini penting buat QA

Di Module 5 kita belajar cara menunggu observable outcome. Sekarang pertanyaannya lebih sulit: outcome mana yang benar-benar membuktikan requirement?

Coba bayangin checkout test diakhiri dengan:

```ts
await expect(page.getByRole('button', { name: 'Place order' })).toBeHidden();
```

Button-nya memang hilang. Tapi apakah order berhasil dibuat? Apakah produk yang benar terbeli? Jangan-jangan aplikasi malah menampilkan payment error. Assertion itu bisa benar secara teknis, sementara test-nya tetap membuktikan hal yang salah.

Sebagai manual QA, kamu sebenarnya sudah membuat judgment ini setiap kali membandingkan actual dan expected result. Di automation, expected-result contract tersebut kita ubah menjadi code. Green test hanya bernilai kalau evidence-nya mendukung product claim yang penting.

## Cara berpikir yang perlu kamu pegang

Bangun assertion dari risk, bukan dari elemen yang paling gampang di-inspect:

```text
Product risk
     ↓
Claim yang wajib dibuktikan test
     ↓
Observable evidence yang tersedia untuk user
     ↓
Matcher yang menjelaskan evidence tersebut
```

![Product risk diubah menjadi claim yang presisi, claim didukung user-observable evidence, lalu setiap evidence memakai Playwright assertion yang sesuai.](/images/tutorials/assertion-evidence-chain.svg)

_Matcher adalah pilihan implementasi terakhir. Evidence design harus datang lebih dulu._

Untuk skenario order:

- **Risk:** payment berhasil tapi order tidak dibuat.
- **Claim:** satu order dikonfirmasi untuk intended purchase.
- **Evidence:** confirmation heading, generated order number, dan intended item summary.
- **Matcher:** exact atau appropriately scoped text assertion.

“Click selesai,” “spinner hilang,” atau “container punya class `success`” mungkin menjelaskan intermediate implementation state. Ketiganya belum cukup kecuali requirement memang menjadikan state tersebut sebagai bagian kontrak.

Secara umum, assertion Playwright punya dua behavior:

| Assertion style                                 | Behavior                                        | Biasanya dipakai untuk                          |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `await expect(locator).toHaveText(...)`         | Re-fetch dan retry sampai expected atau timeout | Browser UI yang berubah                         |
| `await expect(locator).toBeEnabled()`           | Re-fetch dan retry                              | Control state setelah transition                |
| `await expect(page).toHaveURL(...)`             | Retry terhadap page URL                         | Route yang memang bagian expected result        |
| `expect(await locator.textContent()).toBe(...)` | Membaca dan membandingkan satu momen            | Deliberate snapshot tanpa retry                 |
| `expect(calculatedValue).toBe(...)`             | Membandingkan in-memory value satu kali         | Synchronous code atau result yang sudah selesai |

Untuk browser state yang bisa berubah secara asynchronous, pilih Playwright async web assertion dan jangan lupa `await`.

## Coba kita bedah contoh nyata

Requirement registrasinya seperti ini:

> Invalid email atau password harus memblokir registrasi dan memberi guidance. Saat keduanya valid, guidance hilang dan Register bisa digunakan.

Risk utamanya bukan sekadar “ada error.” Risk-nya adalah invalid data bisa disubmit atau valid data tetap terblokir.

### 1. Ubah requirement menjadi claim

Sebelum menulis matcher, sebutkan hal yang harus dibuktikan:

1. Known invalid starting state menampilkan email guidance.
2. Register tidak tersedia selama data invalid.
3. Memperbaiki data menghilangkan email guidance.
4. Register tersedia ketika required data sudah valid.

Empat claim ini masih menjelaskan satu behavior: registration availability mengikuti validation state.

### 2. Pakai evidence yang sesuai dengan setiap claim

```ts
const email = page.getByLabel('Email');
const password = page.getByLabel('Password');
const emailError = page.getByRole('alert');
const register = page.getByRole('button', { name: 'Register' });

await expect(emailError).toHaveText('Invalid email format');
await expect(register).toBeDisabled();
```

`toHaveText()` membuktikan content, bukan sekadar visibility. Kalau requirement hanya mengatakan sebuah alert muncul, `toBeVisible()` mungkin cukup. Di sini specific guidance-nya penting, jadi text assertion lebih kuat tapi tetap fokus.

`toBeDisabled()` langsung menjelaskan user capability. Memeriksa `class="disabled"` hanya membuktikan salah satu kemungkinan implementasi.

### 3. Buat valid state

```ts
await email.fill('rani@example.com');
await password.fill('validpass123');
```

Action method membuat intended value. Method tersebut belum membuktikan validation result.

### 4. Assert state transition

```ts
await expect(emailError).toBeHidden();
await expect(register).toBeEnabled();
```

Negative visibility assertion ini bermakna karena test sudah membuktikan alert memang muncul pada controlled invalid state. Assertion-nya nggak bisa lulus hanya karena alert dari awal tidak pernah dirender.

Enabled assertion membuktikan bagian kedua dari behavior. Test nggak perlu meng-inspect semua CSS class, HTML attribute, atau validation function.

### 5. Pilih matcher berdasarkan evidence contract

| Evidence yang dibuktikan                  | Assertion yang berguna             | Pertanyaan saat review                                              |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Exact status atau heading                 | `toHaveText('Profile saved')`      | Apakah seluruh message harus sama?                                  |
| Stable phrase di dynamic content          | `toContainText('Order confirmed')` | Bisakah phrase muncul pada state yang salah?                        |
| User bisa melihat control                 | `toBeVisible()`                    | Apakah visibility saja cukup membuktikan content?                   |
| User bisa atau tidak bisa memakai control | `toBeEnabled()` / `toBeDisabled()` | Apakah capability memang business rule-nya?                         |
| Checkbox choice                           | `toBeChecked()`                    | Apakah required starting state sudah dikontrol?                     |
| Live input value                          | `toHaveValue()`                    | Apakah form value, bukan surrounding text, yang penting?            |
| Exact list atau result size               | `toHaveCount()`                    | Apakah jumlahnya punya product meaning?                             |
| Route tercapai                            | `toHaveURL()`                      | Apakah URL bagian kontrak atau cuma implementasi?                   |
| Link target atau required DOM contract    | `toHaveAttribute()`                | Apakah user-visible behavior akan menjadi evidence yang lebih baik? |

Exact matching cocok ketika complete message memang menjadi kontrak. Partial text atau regular expression cocok saat stable phrase dikelilingi generated ID, tanggal, atau localized detail. Jangan membuat matching lebih luas hanya supaya expected result nggak perlu dirawat.

## Kapan pendekatan ini cocok dipakai?

Gunakan auto-retrying locator dan page assertion untuk browser state yang bisa berubah setelah navigation, action, rendering, atau server response. Gunakan one-time generic assertion untuk value yang sudah tersimpan di memory atau saat snapshot pada satu momen memang disengaja.

Utamakan user-observable evidence: meaningful text, accessible state, live value, count, dan route ketika routing memang penting. Attribute assertion cocok saat attribute itu sendiri menjadi requirement—misalnya link wajib menuju safe destination. Jangan menjadikannya pengganti default untuk user-facing outcome yang lebih jelas.

Gunakan beberapa assertion ketika satu behavior memang membutuhkan beberapa evidence. “Satu assertion per test” bukan quality rule. Tapi jangan juga meng-assert semua field yang terlihat. Itu menambah noise dan membuat test terikat ke unrelated change. Pertahankan kumpulan terkecil yang bisa meyakinkan reviewer bahwa claim-nya benar.

Gunakan hard assertion untuk prerequisite dan evidence yang harus menghentikan skenario saat gagal. Gunakan `expect.soft()` untuk independent diagnostics yang tetap berguna jika dikumpulkan. Soft failure tetap membuat test gagal di akhir. Jangan melanjutkan business action yang bergantung pada failed soft prerequisite; periksa `test.info().errors` atau gunakan hard assertion sebelum lanjut.

## Kalau gagal, mulai cek dari mana?

Saat assertion gagal, periksa expected contract sekaligus observed surface:

1. Apakah action dan starting state benar-benar menghasilkan skenario yang di-assert?
2. Apakah locator punya scope ke account, card, row, dialog, atau page yang tepat?
3. Apakah matcher sesuai jenis evidence—text, value, state, count, atau URL?
4. Apakah exact expectation-nya salah, atau broad expectation justru menyembunyikan content yang salah?
5. Apakah outcome muncul di page atau frame lain?
6. Apakah ini product defect, stale expected result, missing synchronization, atau test assumption yang salah?

Jangan mengganti failed exact assertion menjadi `toContainText('Success')` sebelum tahu content mana yang memang sengaja dinamis. Jangan menaikkan assertion timeout kalau expected state nggak mungkin terjadi. Jangan menangkap assertion error lalu hanya menulis log; failure itu adalah product feedback.

Untuk absence check yang lulus terlalu cepat, buktikan positive precondition lebih dulu atau sinkronkan dengan outcome lain yang memastikan relevant transition memang terjadi.

## Review hasil buatan AI

Untuk setiap generated assertion, tanyakan:

- Product risk dan claim mana yang didukung assertion ini?
- Apakah assertion memeriksa sesuatu yang diamati user atau hanya implementation detail?
- Apakah visibility dipakai padahal exact content atau capability yang penting?
- Apakah text matching terlalu luas sampai wrong message bisa lulus?
- Apakah negative assertion punya known positive starting state?
- Apakah one-time `textContent()`, `isVisible()`, atau `count()` snapshot dipakai pada changing UI?
- Apakah unrelated assertion ikut dimasukkan hanya karena elemennya gampang dicari?
- Apakah `expect.soft()` membuat dependent action tetap berjalan setelah prerequisite rusak?
- Apakah failure-nya menjelaskan product behavior yang berubah?

Generated matcher gampang dibuat. Evidence selection membutuhkan product knowledge dan QA judgment.

## Coba cek pemahamanmu

Review generated test berikut:

```ts
await page.getByRole('button', { name: 'Delete address' }).click();

await expect(page.locator('.address-card')).not.toHaveClass(/loading/);
await expect(page.getByText('Address')).not.toBeVisible();
await expect(page.locator('body')).toContainText('Success');
```

Requirement-nya mengatakan address bernama **Office Jakarta** dihapus dan status mengumumkan **Address deleted**. Address lain harus tetap ada.

Jelaskan assertion mana yang lemah atau ambigu, evidence apa yang perlu mengenali address yang benar, dan bagaimana caramu mencegah absence check lulus terhadap state yang salah.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Beri scope ke address card bernama Office Jakarta sebelum delete action supaya target identity eksplisit.
- Buktikan intended card visible sebelum menghapusnya.
- Setelah action, assert exact atau sufficiently precise status `Address deleted`.
- Assert card Office Jakarta hilang, misalnya dengan scoped count zero atau hidden assertion yang sesuai.
- Jangan meng-assert seluruh text “Address” hilang karena address lain harus tetap ada.
- Hapus loading-class check kecuali implementation detail itu sendiri memang requirement.

Status membuktikan transition selesai; scoped absence membuktikan record yang benar sudah hilang.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mulai dari product claim, memilih smallest sufficient user-observable evidence, lalu mengimplementasikannya dengan retrying assertion yang tepat tanpa sekadar mengumpulkan matcher.

Selesaikan integrated Core Practice tentang form validation state. Latihan fokus untuk visibility, text, value, state, count, attribute, dan soft assertion tetap menjadi Additional Practice. Lesson berikutnya memakai evidence design ini di dalam test portfolio yang lebih luas dan berbasis product risk.
