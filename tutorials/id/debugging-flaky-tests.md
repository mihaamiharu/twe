---
title: 'Diagnosis Failure dari Evidence'
description: 'Reproduce failure, buat competing hypothesis, periksa artifact yang tepat, lalu verifikasi root-cause repair di kondisi yang mengeksposnya.'
---

## Setelah lesson ini, kamu bisa

- membedakan failure symptom dari root cause;
- mereproduksi failure dalam kondisi yang mengeksposnya;
- menggunakan error, trace, UI Mode, screenshot, video, console, dan network evidence secara deliberate;
- mengklasifikasikan kemungkinan locator, synchronization, state, product, environment, atau test-logic cause; serta
- memverifikasi repair tanpa bergantung pada force, fixed wait, blind retry, atau reduced parallelism.

## Kenapa ini penting buat QA

Red test memberi tahu bahwa observed result nggak sesuai expectation. Red test belum otomatis memberi tahu penyebabnya.

Assertion timeout bisa terjadi karena product defect, wrong test data, ambiguous locator, missing outcome, failed API, atau incorrect expectation. Kalau kamu langsung menaikkan timeout, symptom-nya berubah tapi kamu belum belajar system mana yang salah.

Module 5 bertanya kondisi aplikasi apa yang harus ditunggu oleh sebuah action. Lesson ini dimulai saat kondisi itu tetap gagal: klasifikasikan boundary yang mungkin bermasalah—locator, timing, state/data, product, environment, atau test logic—lalu kumpulkan evidence sebelum mengubah test.

Debugging adalah QA investigation. Discipline yang kita pakai untuk reproduce dan isolate manual defect juga berlaku di sini: simpan evidence, tantang assumption, lalu buat perubahan terkecil yang menjelaskan failure.

## Cara berpikir yang perlu kamu pegang

Gunakan evidence loop, bukan patch loop:

```text
Observed symptom
      ↓
First meaningful failure
      ↓
Competing hypotheses
      ↓
Evidence yang membedakan hypothesis
      ↓
Root cause dan targeted repair
      ↓
Ulangi pada exposing conditions
```

![Debugging loop bergerak dari observed symptom ke first meaningful failure, competing hypothesis, distinguishing evidence, root cause, targeted repair, dan stress verification.](/images/tutorials/debugging-evidence-loop.svg)

_Satu green rerun belum cukup kalau repair-nya nggak menjelaskan evidence dan nggak bertahan pada original condition._

Klasifikasikan hypothesis-nya, bukan sekadar error message:

| Hypothesis category         | Distinguishing evidence yang berguna                                |
| --------------------------- | ------------------------------------------------------------------- |
| Locator                     | Match count, accessible name, scope, frame, DOM snapshot            |
| Synchronization             | Action timeline dan apakah intended outcome pernah muncul           |
| Starting state atau data    | Account, record ID, setup response, execution order, worker         |
| Product defect              | User-visible result ditambah console atau network behavior          |
| Environment atau dependency | Service response, configuration, resource pressure, browser/project |
| Test logic                  | Wrong expectation, optional branch, swallowed error, stale helper   |

Beberapa hypothesis bisa cocok dengan symptom yang sama. Evidence harus membantu membuang alternative yang salah.

## Coba kita bedah contoh nyata

Sebuah cancellation test biasanya lulus di lokal, tapi gagal saat parallel CI:

```text
Expected: “Order canceled”
Received: “Order was already canceled”
```

Failure terlihat di status assertion. Itu belum membuktikan assertion-nya flaky.

### 1. Reproduce secara fokus tanpa menghilangkan kondisinya

Jalankan focused test sendirian, lalu sengaja kembalikan concurrency:

```bash
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --workers=1
npx playwright test tests/cancel-order.spec.ts -g "customer cancels order" --repeat-each=10 --workers=4
```

Kalau failure hanya muncul dengan beberapa worker, parallel state menjadi strong hypothesis. Jangan hapus parallelism secara permanen dulu; untuk sekarang pressure tersebut justru memberi diagnostic signal.

### 2. Mulai dari first meaningful failure

Baca error paling awal yang berhubungan dengan product expectation. Error “element not found” atau cleanup setelahnya mungkin hanya consequence dari state change sebelumnya.

Catat:

```text
First failing expectation: cancellation status
Expected state: satu submitted order yang dimiliki test ini
Actual state: order yang sama sudah canceled
Exposing condition: repeated parallel execution
```

### 3. Buat competing hypothesis

| Hypothesis                           | Evidence yang mendukung                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| Click terkirim dua kali              | Dua cancel action atau request dari satu test                  |
| UI menampilkan stale message         | Cancel request sukses tapi DOM menunjukkan earlier response    |
| Test lain cancel order yang sama     | Worker berbeda memakai account dan order ID yang sama          |
| Product cancellation endpoint defect | Satu request pada submitted unique order menghasilkan conflict |

Jangan edit code sebelum evidence membedakan penjelasan tersebut.

### 4. Periksa execution timeline

Simpan trace untuk failed run lewat Playwright configuration:

```ts
export default defineConfig({
  use: {
    trace: 'retain-on-failure',
  },
});
```

Buka retained trace:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Periksa action timeline, locator detail, before/after DOM snapshot, console message, dan network request milik failed run. UI Mode berguna saat reproduce secara lokal:

```bash
npx playwright test --ui
```

Dalam contoh ini, evidence menunjukkan:

- test ini click Cancel satu kali;
- request-nya menuju `/api/orders/ORD-1042/cancel`;
- server memberi `409 Already canceled`;
- trace worker lain memakai account dan order ID yang sama beberapa saat sebelumnya; serta
- setiap test memang menerima fresh browser context.

Root cause-nya adalah shared backend data, bukan browser-session leak atau slow assertion.

### 5. Perbaiki assumption

Buat atau allocate satu submitted order per test, lalu navigate memakai returned ID-nya. Kalau account-level state juga mutable, sediakan worker-safe account. Pertahankan status assertion karena assertion tersebut masih menjelaskan product contract yang benar.

Repair-nya mengubah ownership, bukan timing.

### 6. Verify di original pressure

Jalankan ulang focused test dengan concurrency dan repetition yang sebelumnya mengekspos problem. Setelah itu, jalankan neighboring suite untuk mendeteksi unintended effect.

Satu passing rerun bisa terjadi karena kebetulan. Verification yang berguna menunjukkan repaired assumption tetap controlled di repeated parallel run.

## Kapan pendekatan ini cocok dipakai?

Gunakan first error dan call log untuk quick local failure. Gunakan Inspector atau `--debug` saat kamu perlu step through action dan live-edit locator. Gunakan UI Mode untuk interactive timeline exploration. Gunakan retained trace untuk CI failure karena artifact tersebut menyimpan action, snapshot, console, dan network evidence dari actual run.

Screenshot menjawab “page-nya terlihat seperti apa pada momen ini?” Video membantu melihat sequence dan movement. Trace menghubungkan action dengan before/after DOM, log, network, timing, dan error. Kumpulkan artifact terkecil yang cukup untuk membedakan hypothesis.

Retry bisa mengekspos bahwa sebuah test flaky: Playwright menandai test yang gagal pada run pertama lalu lulus saat retry sebagai flaky. Retry bisa menjaga broader CI run tetap bergerak, tapi itu bukan evidence bahwa test sudah repaired. Investigasi failed attempt dan pertimbangkan membuat CI gagal pada flaky test saat team siap menjaga signal tersebut.

Jangan gunakan `force: true` untuk melewati unexplained actionability failure. Jangan tambahkan fixed wait untuk state atau data problem. Jangan ganti precise expected result menjadi `toBeTruthy()`. Jangan membuat dependent test serial sebelum dependency-nya ditemukan dan memang sengaja diterima.

## Kalau gagal, mulai cek dari mana?

Debugging process ikut menjadi unreliable ketika evidence hilang atau experiment mengubah terlalu banyak variable.

Kalau failure nggak bisa direproduce di lokal:

1. Bandingkan browser project, environment, worker count, retry, test data, dan feature configuration.
2. Simpan first failed attempt, bukan hanya successful retry.
3. Gunakan `--repeat-each` atau targeted parallel execution untuk meningkatkan suspected pressure.
4. Tambahkan safe diagnostic attachment di sekitar disputed state, bukan arbitrary sleep.
5. Catat frequency dan condition daripada menyebut failure-nya “random.”

Kalau trace menunjukkan target memang nggak pernah ada, menaikkan locator timeout nggak akan membuat missing data muncul. Kalau forced click sukses, investigasi apa yang sebelumnya menutup, disable, detach, atau mengganti target. Kalau beberapa unrelated change membuat test green, kembali ke satu hypothesis per perubahan supaya repair tetap bisa dijelaskan.

Artifact bisa berisi credential, cookie, personal data, request body, dan internal URL. Batasi retention serta access, lalu sanitize evidence sebelum membagikannya ke luar authorized team atau ke AI system.

## Review hasil kerja dengan bantuan AI

Berikan AI exact error, relevant code, sanitized observation, dan known execution condition. Setelah itu review jawabannya:

- Apakah AI memisahkan symptom dari root cause?
- Apakah AI memberi beberapa plausible hypothesis, bukan satu confident guess?
- Evidence apa yang membedakan hypothesis tersebut?
- Apakah proposed change mengontrol assumption atau hanya menekan failure?
- Apakah AI menambah `waitForTimeout`, `force`, broad retry, serial mode, atau weaker assertion?
- Apakah AI mengarang API response, environment detail, atau product requirement?
- Bisakah repair diverifikasi di original failure condition?
- Sudahkah secret dan personal data dihapus dari artifact yang diberikan?

AI bisa membantu menyusun hypothesis. Test owner tetap bertanggung jawab membuktikan hypothesis mana yang sesuai evidence.

## Coba cek pemahamanmu

AI assistant menawarkan empat fix untuk test yang lulus sendiri tapi kadang gagal dengan empat worker:

1. naikkan assertion timeout dari 5 menjadi 30 detik;
2. set `workers: 1`;
3. tambahkan dua retry;
4. periksa apakah worker berbagi account dan record ID yang sama, lalu allocate owned data dan ulangi parallel run.

Trace menunjukkan failed request menerima `409 Already processed`. Kelompokkan suggestion tersebut sebagai diagnosis, temporary mitigation, atau symptom masking. Jelaskan apa yang akan kamu ubah dan bagaimana cara memverifikasinya.

## Bandingkan dengan cara pikir ini

Salah satu jawaban yang masuk akal:

- Suggestion 4 adalah diagnosis path karena 409 dan parallel-only condition mengarah ke shared server-side resource. Konfirmasi identity antar-worker, lalu beri setiap test atau worker owned mutable data.
- Satu worker bisa menjadi temporary containment untuk external system yang memang constrained, tapi harus narrow dan terdokumentasi—bukan default repair di sini.
- Retry bisa menunjukkan dan melaporkan flakiness atau menjaga unrelated CI work berjalan, tapi shared-state cause-nya tetap ada.
- Assertion timeout lebih panjang nggak berhubungan dengan server response yang mengatakan operation sudah pernah terjadi.
- Verifikasi ownership repair dengan repeated multi-worker execution, lalu periksa kalau masih ada first-attempt failure.

Assertion yang benar boleh tetap dipakai. Hidden precondition-nya yang perlu diperbaiki.

## Sebelum lanjut

Sekarang kamu seharusnya bisa reproduce failure, membuat competing hypothesis, memilih evidence yang membedakannya, memperbaiki underlying assumption, lalu memverifikasi hasil pada kondisi yang sebelumnya mengekspos failure.

Selesaikan integrated Core Practice dengan memperbaiki flawed test yang menargetkan order yang salah dan menyamarkan evidence. Module 7 selesai ketika ketiga Core lesson dibaca dan Core Practice tersebut lulus. Module 8 akan memakai reliability boundary ini untuk menentukan kapan helper, page object, fixture, dan configuration meningkatkan maintainability, bukan menyembunyikan state.
