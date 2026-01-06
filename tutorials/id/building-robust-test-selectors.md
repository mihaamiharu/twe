---
title: "Membangun Test Selector yang Robust"
description: "Belajar menulis selector yang tahan terhadap perubahan UI dan menjaga test suite kamu tetap andal."
---

# Membangun Test Selector yang Robust

Belajar menulis *selector* yang tahan terhadap perubahan UI dan menjaga *test suite* kamu tetap andal (*reliable*).

## Mental Model: Jangkar (The Anchor)

Bayangkan tes otomatis kamu adalah sebuah kapal yang mengapung di lautan badai (UI aplikasi kamu yang terus berubah).
Untuk menjaga kapal agar tidak hanyut atau menabrak, kamu perlu melempar **jangkar**.

* **Jangkar Lemah**: Mengikat kapal ke batang kayu yang lewat (*class* CSS dinamis atau ID yang di-generate otomatis). Saat kayu bergerak, kapalmu hanyut. Tes gagal.
* **Jangkar Kuat**: Mengikat kapal ke dasar laut (*attribute* tes khusus). Tidak peduli seberapa ganas badai di permukaan, kapalmu tetap diam.

Dalam QA, tujuan kita adalah menambatkan tes kita pada hal-hal yang **tidak pernah berubah** secara tidak sengaja.

---

## Kasus Dunia Nyata: Bencana "Tombol Merah"

**Skenario**:
Seorang QA Engineer, Alex, sedang mengotomatisasi alur *checkout* untuk situs e-commerce besar.
Alex melihat tombol "Buy Now". Warnanya merah dan besar.
Alex menulis *selector* ini: `.btn-red.btn-lg`

**Kejadian**:
Tiga bulan kemudian, tim Marketing memutuskan bahwa "Hijau" mengonversi lebih baik daripada "Merah".
Mereka melakukan *update* CSS: `.btn-red` diganti dengan `.btn-green`.
Mereka menyentuh *nol* logika JavaScript. Tombol berfungsi persis sama.

**Dampaknya**:

* Alur *checkout* biasanya diverifikasi oleh 50 *test case* berbeda (Guest checkout, Member checkout, Coupon checkout, error handling, dll).
* **SEMUA 50 tes gagal dalam semalam.**
* Alex menghabiskan 4 jam memperbarui setiap file tes tunggal.

**Pelajaran**:
Jangan pernah menambatkan jangkar kamu pada sesuatu yang sementara seperti gaya (*style*/CSS) atau lokasi (struktur XPath). Tambatkan pada **fungsinya**.

---

## Strategi: Layer Ketahanan (Resiliency Layers)

Saat memilih *selector*, turunlah melalui lapisan-lapisan ini sampai kamu menemukan kecocokan. Berhenti pada yang pertama yang berhasil.

1. **The Contract Layer** (Standar Emas)
    * Atribut eksplisit yang disepakati oleh Dev dan QA.
    * `data-testid`, `data-cy`, `data-automation-id`
    * *Kenapa*: Developer melihat ini dan berpikir "Peringatan: Tes bergantung pada ini."
    * *Contoh*: `[data-testid="submit-order"]`

2. **The Accessibility Layer** (Standar Perak)
    * Bagaimana *screen reader* melihat aplikasi.
    * `aria-label`, `role="button"`, `alt`
    * *Kenapa*: Mengubah ini merusak fungsionalitas untuk pengguna tunanetra, jadi mereka stabil.
    * *Contoh*: `[aria-label="Submit Order"]`

3. **The Semantic Layer** (Standar Perunggu)
    * Atribut HTML standar yang menyiratkan fungsi.
    * `name`, `type`, `id` (jika manual)
    * *Kenapa*: `type="submit"` mendefinisikan perilaku. Itu tidak akan berubah kecuali perilakunya berubah.
    * *Contoh*: `button[type="submit"]`

4. **The Structural Layer** (Zona Bahaya)
    * Posisi di dalam DOM.
    * Path, Siblings, Classes.
    * *Kenapa*: Ini berubah setiap kali sebuah `div` ditambahkan untuk *styling*.
    * *Contoh*: `div > div > button.primary`

---

## Jebakan-Jebakan (The Traps)

### Jebakan #1: Selector yang Terkait Erat (Tightly Coupled)

**Kode**: `div.content-wrapper > form.login-form > button.btn-primary`
**Kenapa gagal**: *Selector* ini tahu terlalu banyak. Dia tahu nama *wrapper*, *class* form, dan warna tombol. Jika *salah satu* dari ketiganya berubah, tes gagal.
**Solusi**: Lepaskan keterkaitan (*Decouple*). Cukup temukan tombol submit-nya. `form [type="submit"]`.

### Jebakan #2: Jebakan Konten Teks

**Kode**: `//button[text()="Log In"]`
**Kenapa gagal**: Copywriter mengubahnya jadi "Sign In". Atau "Login" (satu kata). Atau kamu melokalkan aplikasi ke Bahasa Spanyol (`Iniciar sesión`).
**Solusi**: Gunakan ID/Atribut untuk logika (`[data-testid="login"]`). Gunakan teks HANYA saat memverifikasi konten teks itu benar.

### Jebakan #3: ID Auto-Generated

**Kode**: `#input-r15c`
**Kenapa gagal**: Framework seperti React/Vue men-generate ini untuk menangani *accessibility linking*. Bagian `r15c` berubah setiap rilis atau *re-render*.
**Solusi**: Gunakan atribut `name` atau pencocokan parsial jika awalan stabil (`[id^="user-input-"]`).

---

## Tantangan: Refactor untuk Ketahanan

**Skenario**: Kamu perlu memilih tombol "Save" di dalam modal pengaturan.

**Selector Saat Ini**:

```css
.modal-content .footer button.btn-blue
```

**Opsi yang Diusulkan**:

1. `button` (Terlalu umum)
2. `//div[@class="modal"]//button[2]` (Posisi rapuh)
3. `[aria-label="Save Settings"]` (Accessible & Stabil)
4. `[data-testid="save-settings"]` (Kontrak - Terbaik)

**Tugas Kamu**: Periksa *test suite* kamu sendiri. Terapkan strategi "Layer Ketahanan". Jika kamu menemukan *selector* `div` yang umum, ganti dengan Data Attribute atau Accessibility selector hari ini.
