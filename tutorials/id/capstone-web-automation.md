---
title: 'Capstone: Buktikan Checkout Feedback System yang Trustworthy'
description: 'Review dan repair generated checkout test, jelaskan evidence-nya, lalu pisahkan in-platform proof dari real-project shipping evidence.'
---

## Setelah lesson ini, kamu bisa

- mengubah satu valuable checkout risk menjadi focused recovery scenario;
- mereview generated code untuk locator, action, waiting, assertion, dan error-handling defect;
- menjustifikasi smallest maintainable organization untuk scenario tersebut;
- menjelaskan keputusan Module 1–9 yang dibuktikan repaired test; serta
- membedakan apa yang diverifikasi in-platform Practice dari kebutuhan real CI delivery.

## Kenapa ini penting buat QA

Capstone seharusnya nggak memberi reward karena kamu hafal banyak Playwright method. Capstone harus menunjukkan apakah kamu bisa mereview untrustworthy test, menjaga product risk-nya, memperbaiki broken assumption, lalu menjelaskan kenapa feedback akhirnya layak dipercaya.

AI bisa menghasilkan test yang berjalan tapi menyembunyikan semua important QA decision. Structural selector bisa menargetkan control yang salah, forced click bisa melewati product problem, fixed wait cuma menunda failure, dan swallowed assertion bisa membuat result hijau tanpa membuktikan apa pun.

Final capability di path ini bukan “buat framework panjang.” Capability-nya adalah “hasilkan dan pertanggungjawabkan trustworthy signal.”

## Cara berpikir yang perlu kamu pegang

Perlakukan capstone quality sebagai chain of proof:

```text
Valuable product risk
  + controlled starting state
  + action yang sesuai user behavior
  + observable business evidence
  + independent dan diagnosable execution
  + maintainable organization
  + repeatable delivery policy
  + penjelasan limitation
  = trustworthy automation feedback
```

Kalau satu link hilang, green execution bisa melebih-lebihkan apa yang benar-benar dibuktikan test.

Capstone menghubungkan seluruh path lewat empat proof area:

| Proof area                       | Keputusan module sebelumnya yang diterapkan              |
| -------------------------------- | -------------------------------------------------------- |
| Risk dan scenario design         | Automation judgment dan meaningful assertion             |
| UI contract dan browser behavior | DOM inspection, locator, action, dan synchronization     |
| Reliability dan maintainability  | Isolation, debugging, smallest useful abstraction        |
| Shipping dan team feedback       | Reproducible CI, coverage, evidence, gate, dan ownership |

Baris keempat adalah review lens, bukan automated claim tentang apa yang sudah di-ship oleh Practice. Practice membuktikan bagian browser-level dari chain ini; CI delivery dan team ownership tetap membutuhkan evidence dari real repository.

## Coba kita bedah contoh nyata

Product rule-nya:

> Quantity minimal 1. Setelah memperbaiki invalid quantity, customer bisa place order dan melihat confirmed quantity.

Ini satu coherent recovery risk—bukan dua unrelated test yang dipaksa jadi satu:

```text
Starting state: fresh checkout page tanpa confirmation
Action 1: submit quantity 0
Evidence 1: validation alert menjelaskan rule; confirmation belum muncul
Action 2: perbaiki quantity menjadi 2 lalu submit lagi
Evidence 2: stale alert hilang; confirmation melaporkan 2 items
```

Generated starter sengaja dibuat lemah:

```ts
test('checkout', async ({ page }) => {
  await page.goto('/app/checkout.html');
  await page.locator('main > form > input').fill('2');
  await page.locator('main > form > button').click({ force: true });
  await page.waitForTimeout(1000);

  try {
    expect(await page.locator('.message').textContent()).toBeTruthy();
  } catch {
    console.log('ignore intermittent checkout issue');
  }
});
```

Review dulu sebelum rewrite:

| Observed problem                   | Risk kalau dibiarkan                                 | Repair direction                                       |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Title cuma `checkout`              | Report nggak menjelaskan protected behavior          | Namai recovery outcome                                 |
| Structural `main > form` selector  | DOM rearrangement merusak test tanpa behavior change | Gunakan label dan role contract                        |
| Hanya quantity `2` yang dimasukkan | Minimum-quantity rule nggak pernah diuji             | Submit invalid boundary sebelum memperbaikinya         |
| `{ force: true }`                  | Test melewati unexplained actionability protection   | Gunakan normal click dan investigasi readiness         |
| `waitForTimeout(1000)`             | Waktu menggantikan observable condition              | Tunggu lewat web-first assertion pada alert/status     |
| `textContent()` + `toBeTruthy()`   | Hampir semua non-empty message bisa lulus            | Assert exact validation dan confirmed quantity         |
| `try/catch` menelan assertion      | Broken checkout masih bisa dilaporkan hijau          | Biarkan meaningful assertion failure menggagalkan test |

### Tulis evidence contract sebelum final code

```text
Locator contract:
- Quantity field dikenali lewat label.
- Place order dikenali lewat button role dan name.
- Validation dan confirmation memakai alert/status semantic.

Assertion evidence:
- Alert punya exact minimum rule setelah invalid submit.
- Alert hidden setelah valid correction.
- Confirmation visible dan mengandung “2 items”.

Forbidden masks:
- nggak ada fixed sleep;
- nggak ada unexplained force;
- nggak ada `evaluate` atau direct DOM manipulation;
- nggak ada weak truthiness claim;
- nggak ada swallowed error.
```

Full repair dikerjakan di attached Core Practice. Practice memeriksa ordered submit sequence dan state setelah setiap submit, selain final DOM state dan required Playwright method. Reasoning di atas adalah contract-nya; exact variable name bebas.

### Pilih smallest maintainable organization

Satu scenario nggak otomatis membutuhkan page object, fixture framework, atau multi-folder architecture. Clear test dengan beberapa named locator bisa jadi design terbaik.

Extract helper atau component hanya kalau dia melokalkan meaningful repeated change tanpa menyembunyikan validation dan recovery step. Jelaskan boundary yang kamu pilih.

### Pisahkan automated proof dari shipping proof

In-platform Practice bisa menjalankan browser behavior, memverifikasi ordered invalid-to-recovery submit sequence, memeriksa final page state, dan mengecek required Playwright method. Practice ini nggak bisa menjalankan real GitHub Actions job, menilai edited `playwright.config.ts`, mengupload trace, atau menilai written browser rationale. Proof area shipping/team feedback di atas adalah contextual awareness, bukan delivery claim yang sudah selesai.

Untuk real-project portfolio extension, sediakan juga:

- reproducible local dan CI command;
- trigger serta browser/project portfolio beserta alasannya;
- satu retained failed-run artifact atau equivalent diagnostic package;
- short root-cause note untuk original generated defect;
- known limitation suite dan next highest-value risk; serta
- evidence bahwa scenario lulus sendiri, berulang kali, dan pada intended parallelism.

Jangan klaim platform sudah memverifikasi deliverable yang memang belum bisa diverifikasi.

## Kapan pendekatan ini cocok dipakai?

Pakai recovery scenario kalau risk-nya memang customer harus bisa memperbaiki rejected input lalu lanjut dengan aman. Pakai separate independent test kalau valid dan invalid behavior punya starting state, ownership, atau failure meaning yang berbeda.

Jaga capstone scope cukup kecil supaya setiap decision bisa dijelaskan. Satu flow yang dalam dan trustworthy adalah evidence yang lebih baik daripada sepuluh copied script.

Pakai page atau component object hanya saat scenario menunjukkan stable repeated boundary. Pakai fixture hanya saat named dependency butuh lifecycle. Capstone rubric bukan alasan menambah architecture yang nggak dibutuhkan suite.

Pakai in-platform Practice sebagai satu browser-level code-repair checkpoint yang terintegrasi. Pakai real repository dan CI provider untuk portfolio-level shipping evidence. Jangan anggap simulated browser challenge membuktikan secret, runner, deployment, atau artifact sudah dikonfigurasi secara aman.

## Kalau gagal, mulai cek dari mana?

| Green-looking result                     | Missing proof                                            | Evidence atau repair                                 |
| ---------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| Confirmation muncul setelah quantity `2` | Ordered recovery sequence mungkin belum dijalankan      | Assert invalid state sebelum correction              |
| Assertion method ada di code             | Bisa saja assertion berada dalam swallowed error         | Hapus catch dan lihat deliberate failing version     |
| Test lulus sekali                        | State, ordering, atau timing masih mungkin unstable      | Repeat sendiri dan di intended execution condition   |
| Code dibagi menjadi beberapa class       | Abstraction mungkin hide, bukan localize behavior        | Hubungkan boundary ke real change pattern            |
| Browser challenge lulus                  | CI target, secret, coverage, dan artifact belum terbukti | Jalankan portfolio extension di real repository      |
| Retry lulus                              | Original failure tetap instability signal                | Periksa first-attempt evidence dan repair root cause |

Jangan melemahkan rubric karena generated code susah direpair. Jangan tambahkan sleep, forced action, broad catch, atau global timeout hanya untuk mendapatkan green output.

## Review hasil buatan AI

Lakukan final generated-code review:

- Exact product risk apa yang dilindungi test?
- Apakah starting state controlled dan independent?
- Apakah locator contract mengekspresikan user atau documented engineering meaning?
- Apakah setiap action menunggu observable application outcome?
- Apakah setiap assertion akan gagal saat meaningful product regression terjadi?
- Apakah error dibiarkan menggagalkan test dengan useful evidence?
- Apakah force, retry, timeout, atau conditional menyembunyikan unexplained problem?
- Apakah code menambah abstraction yang benar-benar membayar maintenance cost-nya?
- Bisakah scenario berjalan sendiri, berulang kali, dan di intended project?
- CI, browser, artifact, serta security claim mana yang masih di luar platform verification?
- Bisakah kamu menjelaskan setiap important generated line tanpa bertanya lagi ke AI?

Bantuan AI diperbolehkan. Responsibility atas claim tetap ada di reviewer.

## Coba cek pemahamanmu

Seseorang memperbaiki starter dengan mengganti selector dan menghapus fixed wait. Dia tetap memakai `{ force: true }`, hanya mengassert confirmation visible, lalu menyebut capstone selesai karena dua kali lulus di browser challenge.

Review claim tersebut. Identifikasi apa yang dibuktikan test, apa yang masih lemah, dan shipping evidence mana yang belum ada.

## Bandingkan dengan cara pikir ini

Salah satu review yang masuk akal:

- Semantic selector memperbaiki UI contract, dan menghapus fixed wait memperbaiki synchronization.
- Unexplained forced click masih melewati readiness signal dan harus dihapus atau dijustifikasi lewat evidence.
- Visibility saja nggak membuktikan minimum rule atau confirmed quantity.
- Recovery contract butuh exact invalid evidence, alert clearance, dan confirmation `2 items`.
- Dua passing run berguna, tapi belum menguji intended ordering, parallelism, atau CI reconstruction.
- Browser challenge nggak membuktikan workflow configuration, target validation, secret safety, project coverage, artifact retention, atau triage ownership.
- Selesaikan Core Practice, lalu buat item tersebut secara terpisah kalau ingin menampilkan real-project portfolio.

Targetnya adalah claim dengan boundary yang akurat: strong evidence untuk browser recovery sequence, tanpa melebih-lebihkan CI delivery atau team ownership yang belum bisa diverifikasi Practice.

## Sebelum lanjut

Sekarang kamu seharusnya bisa mereview dan merepair checkout recovery test, menjustifikasi contract serta organization-nya, lalu menjelaskan boundary antara platform-verified behavior dan real-project shipping evidence.

Module ini selesai saat tiga Core lesson-nya dan satu `pw-capstone-checkout` Core Practice selesai. TWE mencatat Web Automation path selesai saat semua Core lesson dan Core Practice di Module 1–9 selesai. Optional lesson dan Additional Practice nggak memblokir kedua status tersebut. Practical readiness tetap berarti membawa decision ini ke authorized real repository tempat CI, artifact, environment, dan team ownership bisa diamati secara langsung.
