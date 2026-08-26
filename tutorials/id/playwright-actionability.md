---
title: 'Pisahkan Kesiapan Action dari Sinkronisasi Outcome'
description: 'Pahami apa yang ditunggu Playwright sebelum action dan tentukan observable application state yang membuktikan skenario sesudahnya.'
---

## Setelah lesson ini, kamu bisa

- menjelaskan actionability sebagai kesiapan yang spesifik untuk tiap action, bukan universal checklist;
- memisahkan target readiness, interaction, application transition, dan expected outcome;
- melakukan sinkronisasi dengan retried assertion, bukan fixed sleep;
- mendiagnosis action timeout tanpa menyembunyikannya dengan force atau timeout lebih besar; serta
- me-review generated wait dengan menyebutkan kondisi yang mengakhirinya.

## Kenapa ini penting buat QA

Coba bayangin ada profile page dengan button Save. Button-nya enabled, Playwright berhasil melakukan click, lalu test selesai hijau. Beberapa saat kemudian server menolak update tersebut.

Apakah test sudah membuktikan profile berhasil disimpan? Belum. Test baru membuktikan button bisa di-click.

Kebingungan ini biasanya menghasilkan dua masalah:

- false confidence, karena action berhasil tanpa outcome assertion; dan
- flaky test, karena fixed sleep menebak kapan aplikasi seharusnya ready.

Playwright menghilangkan banyak mechanical waiting, tapi Playwright tidak tahu business result mana yang penting. Itu tetap bagian dari test design kita sebagai QA.

## Cara berpikir yang perlu kamu pegang

Pisahkan flow menjadi empat bagian:

```text
1. Target ready untuk action ini
              ↓
2. Interaction dilakukan
              ↓
3. Application transition
              ↓
4. Observable expected outcome
```

![Test intent memilih action, Playwright memeriksa action-specific readiness, lalu test tetap menunggu observable application outcome.](/images/tutorials/action-readiness-outcome.svg)

_Auto-waiting melindungi batas interaction. Web assertion melakukan sinkronisasi dengan product outcome._

Actionability bukan satu checklist yang dipakai untuk semua method. Playwright memeriksa kondisi yang relevan untuk action tertentu:

| Action           | Visible | Stable | Receives events | Enabled | Editable |
| ---------------- | ------- | ------ | --------------- | ------- | -------- |
| `click()`        | Ya      | Ya     | Ya              | Ya      | Tidak    |
| `fill()`         | Ya      | Tidak  | Ya              | Ya      | Ya       |
| `check()`        | Ya      | Ya     | Ya              | Ya      | Tidak    |
| `selectOption()` | Ya      | Tidak  | Ya              | Ya      | Tidak    |

Playwright juga menyelesaikan satu intended element untuk single-target action. Strictness contract ini sudah dibahas di Module 4.

Semua check tadi menjawab, “Bisakah Playwright melakukan action ini seperti pengguna?” Check tersebut tidak menjawab, “Apakah server berhasil menyimpan profile?”

## Coba kita bedah contoh nyata

Requirement-nya seperti ini:

> Saat user mengubah display name lalu menyimpan, page menampilkan “Profile saved” dan nama baru tetap terlihat.

Aplikasi men-disable Save selama proses submit, lalu memperbarui sebuah status region.

### 1. Jalankan action yang menjelaskan intent

```ts
const displayName = page.getByLabel('Display name');
const saveButton = page.getByRole('button', { name: 'Save profile' });
const status = page.getByRole('status');

await displayName.fill('Rani QA');
await saveButton.click();
```

Sebelum `click()` dikirim, Playwright menunggu sampai button ditemukan secara unik, visible, stable, bisa menerima pointer event, dan enabled. Kalau ada overlay yang menutupinya atau button terus disabled, action akan gagal daripada berpura-pura pengguna berhasil melakukan click.

Click yang berhasil tetap belum membuktikan save request sudah selesai.

### 2. Tentukan observable outcome

```ts
await expect(status).toHaveText('Profile saved');
await expect(displayName).toHaveValue('Rani QA');
```

Web assertion Playwright melakukan retry sampai expected condition terpenuhi atau assertion timeout habis. Jadi status assertion melakukan sinkronisasi dengan application transition tanpa menebak durasinya.

Assertion yang tepat tergantung risk. Saved message mungkin cukup untuk satu skenario. Skenario persistence yang lebih kuat mungkin perlu reload lalu memastikan value tetap ada. Jangan otomatis menambahkan semua assertion; buktikan requirement yang sedang diuji.

### 3. Pahami kenapa fixed sleep lebih lemah

```ts
await saveButton.click();
await page.waitForTimeout(2000);
await expect(status).toHaveText('Profile saved');
```

Code ini selalu menunggu dua detik, baik update-nya selesai dalam 100 milidetik maupun 1,9 detik. Test tetap gagal kalau environment membutuhkan 2,1 detik, dan membuang waktu ketika aplikasi cepat. Yang lebih penting, sleep tidak menjelaskan arti ready.

Assertion-nya sudah menyebutkan kondisi yang dibutuhkan: status menjadi “Profile saved.” Biarkan kondisi itu yang mengakhiri wait.

### 4. Bedakan action timeout dan outcome timeout

Kalau `saveButton.click()` timeout, investigasi target sebelum save request:

- Apakah form validation membuat button tetap disabled?
- Apakah loading mask atau cookie banner menghalangi pointer event?
- Apakah animation membuat target tidak stable?
- Apakah locator menemukan hidden duplicate?

Kalau click berhasil tapi `toHaveText('Profile saved')` timeout, investigasi setelah action:

- Apakah request gagal?
- Apakah aplikasi menampilkan error?
- Apakah assertion mengamati status region atau page yang salah?
- Apakah requirement sebenarnya mengharapkan state transition lain?

Itu dua kelompok failure yang berbeda. Memisahkan readiness dan outcome membuat trace serta error message lebih berguna.

### 5. Pakai one-time event ketika event itu adalah outcome

Sebagian outcome tidak muncul sebagai same-page DOM state. Button Export bisa menghasilkan download:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('customers.csv');
```

Listener dimulai sebelum click supaya test tidak melewatkan event yang cepat. Lesson berikutnya membahas event pattern ini dan browser surface lain dengan lebih detail.

## Kapan pendekatan ini cocok dipakai?

Andalkan normal Playwright action untuk action readiness. Gunakan web assertion seperti `toBeVisible()`, `toHaveText()`, `toHaveValue()`, atau `toHaveURL()` saat observable UI atau navigation state membuktikan outcome.

Gunakan `waitForEvent()` saat one-time browser event—misalnya download atau popup—adalah behavior yang perlu ditangkap. Daftarkan event sebelum trigger.

Gunakan explicit network wait hanya kalau network response memang kontraknya atau memberi koordinasi penting yang tidak bisa dijelaskan UI. Successful response tidak otomatis membuktikan user-visible result.

Jangan menambah `waitForLoadState('networkidle')` sebagai aturan universal “page sudah ready.” Aplikasi modern bisa mempertahankan analytics, polling, atau streaming connection. Dokumentasi Playwright juga tidak menyarankan network idle sebagai test-readiness signal. Pilih URL, heading, control state, atau product-specific evidence lain.

Jangan memakai timeout yang lebih besar untuk mendefinisikan readiness. Timeout adalah batas maksimal kesabaran, bukan kondisi yang sedang ditunggu.

## Kalau gagal, mulai cek dari mana?

Tentukan dulu batas mana yang gagal:

1. **Locator resolution:** tidak ada atau ada beberapa control yang match.
2. **Action readiness:** intended control tidak pernah interactable untuk action tersebut.
3. **Interaction side effect:** action terjadi, tapi aplikasi mengambil path yang tidak diharapkan.
4. **Outcome evidence:** expected observable condition tidak pernah muncul.
5. **Wrong surface:** outcome terbuka di popup, frame, dialog, download, atau page lain.

Gunakan Playwright error, trace, DOM snapshot, screenshot, console, dan network evidence untuk menempatkan failure di salah satu batas tersebut.

`click({ force: true })` mungkin melewati readiness symptom tanpa memperbaiki produk atau test. Timeout lebih besar mungkin cuma menunda failure yang sama. Test retry bisa membantu mengklasifikasikan infrastructure noise, tapi tidak memperbaiki synchronization yang hilang. Kalau test hanya lulus setelah retry, test itu tetap perlu didiagnosis.

## Review hasil buatan AI

Untuk setiap action dan wait dalam generated code, tanyakan:

- Readiness apa yang sebenarnya sudah diperiksa Playwright untuk action ini?
- Observable condition apa yang membuktikan business outcome?
- Apakah `waitForTimeout()` cuma menebak durasi transition?
- Apakah timeout value disalahartikan sebagai readiness condition?
- Apakah `force` menyembunyikan target yang tertutup, disabled, tidak stable, atau salah?
- Apakah code menunggu network idle tanpa product-specific reason?
- Kalau network response ditunggu, apakah test tetap memverifikasi yang dilihat user?
- Bisakah outcome muncul di browser surface lain?

Generated code sering menambah wait karena terlihat aman. Sebuah wait baru bermakna kalau kamu bisa menyebutkan kondisi yang mengakhirinya dan kenapa kondisi itu penting.

## Coba cek pemahamanmu

Review test berikut:

```ts
await page.getByRole('button', { name: 'Submit claim' }).click({
  force: true,
});
await page.waitForTimeout(3000);
expect(await page.getByText('Submitted').isVisible()).toBe(true);
```

Button Submit claim disabled sampai semua required evidence di-upload. Setelah submission, server secara asynchronous memperbarui status region menjadi “Claim submitted.”

Jelaskan:

1. Business signal apa yang mungkin disembunyikan oleh `force`?
2. Outcome condition apa yang perlu menggantikan fixed sleep?
3. Kenapa immediate `isVisible()` snapshot lebih lemah daripada web assertion?
4. Bagaimana membedakan action-readiness failure dari submission-outcome failure?

## Bandingkan dengan cara pikir ini

Salah satu pendekatan yang masuk akal:

- upload required evidence atau assert bahwa disabled button memang benar mewakili invalid form state;
- gunakan normal `click()` supaya Playwright melindungi user interaction boundary;
- pakai `await expect(page.getByRole('status')).toHaveText('Claim submitted')` untuk retry terhadap observable result;
- diagnosis click failure dengan memeriksa target readiness dan validation state; serta
- diagnosis assertion failure dengan memeriksa request, error UI, dan final application state setelah click berhasil.

Improved test-nya bukan menunggu dengan kurang serius. Test tersebut menunggu kondisi yang lebih bermakna.

## Sebelum lanjut

Sekarang kamu seharusnya bisa menjelaskan batas yang ditangani Playwright auto-waiting dan bagian yang tetap membutuhkan outcome synchronization dari skenario.

Selesaikan Core Practice yang menyimpan profile lalu menunggu observable status tanpa `waitForTimeout()`. Dynamic-table exercise tetap menjadi Additional Practice karena pelajaran utamanya adalah menerapkan locator composition pada UI yang berubah, bukan membuktikan completion Module 5.
