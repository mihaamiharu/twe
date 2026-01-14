---
title: 'Interaksi Elemen (Langkah "Act")'
description: 'Ngerubah aksi manusia jadi perintah otomatis pake logika interaksi yang tangguh.'
---

> **Intinya:** Kita mau nerjemahin apa yang biasa dilakuin tangan manusia (klik, ngetik) jadi kode yang nggak gampang *error* walau internet lagi lemot atau animasi web lagi rame.

## 1. Logika Actionability (Kesiapan Elemen)

![Actionability Checklist](/images/tutorials/interaction-actionability-check.png)

Sebelum *tool* otomatisasi ngejalanin aksinya, dia bakal ngecek dulu: "Ini elemennya udah **siap** belum?". Kalo cek ini gagal, script kamu bakal *timeout*. Ini bagus karena nyegah script nge-klik sesuatu yang user asli pun sebenernya nggak bisa liat.

* **Attached:** Elemennya udah nempel di dalem kode HTML.
* **Visible:** Elemennya nggak lagi disembunyiin pake trik CSS (kayak `display: none`).
* **Stable:** Elemennya udah berhenti gerak. Ini penting banget buat tombol yang muncul pake animasi *sliding* atau *fade-in*.
* **Enabled:** Elemennya nggak lagi dipasang status *disabled* (biasanya warnanya abu-abu dan nggak bisa diklik).

---

## 2. Perintah Interaksi Standar

Ini adalah "makanan sehari-hari" di 90% *automated test* yang bakal kamu bikin.

### A. Clicking (Klik)

Dipake buat tombol, link, *checkbox*, dan *radio button*.

* **Logikanya:** Simulasiin klik mouse tepat di tengah-tengah elemen.
* **Catatan:** Klik yang sukses nggak selalu berarti halamannya langsung berubah. Kadang aplikasi lagi sibuk nunggu data dari server di balik layar.

### B. Input Teks (Fill vs. Type)

* **Fill:** Langsung "ceplos" masukin teksnya sekaligus. Ini jauh lebih cepet dan jadi standar buat kebanyakan test.
* **Type:** Simulasiin orang ngetik satu-satu pake keyboard.
* *Kapan pakenya?* Pake ini cuma kalo kamu mau ngetes fitur pencarian yang hasilnya langsung muncul tiap kali kita ngetik satu huruf (*search-as-you-type*).

### C. Selection (Pilih Dropdown)

Dipake khusus buat tag `<select>`.

* **Logikanya:** Langsung nembak ke *value* atau label yang kamu mau.
* **Tips:** Jangan dibiasain nge-klik *dropdown*-nya dulu baru nge-klik isinya sebagai dua langkah. Pake perintah `select` bawaan biar lebih stabil.

---

## 3. Interaksi Kompleks

Kadang elemen web agak manja dan butuh perlakuan khusus.

### A. Hovering (Melayang)

![Hover Interaction Interaction](/images/tutorials/interaction-hover.png)

Pake ini buat menu yang baru muncul pas mouse ada di atasnya (kayak menu *dropdown* navigasi atau *tooltip*).

### B. Focusing (Fokus)

Bikin elemen jadi "aktif".

* **Kasusnya:** Berguna banget buat ngetes pesan error yang baru muncul pas kita klik kolomnya terus kita tinggalin (istilah teknisnya "blurring").

### C. Keyboard Press (Tekan Tombol)

Buat aksi selain mouse, kayak tombol Enter, Escape, atau Tab.

* **Contoh:** Abis ngetik kata kunci, langsung perintahin `Press("Enter")` daripada capek-capek nyari tombol "Cari".

---

## 4. Kenapa Interaksi Bisa Gagal?

Pas script kamu gagal nge-klik sesuatu, biasanya penyebabnya adalah:

| Tipe Gagal | Apa yang Terjadi? | Solusinya |
| --- | --- | --- |
| **Action Intercepted** | Targetnya ketutup elemen lain (misal: ada *loading spinner* atau *popup* iklan). | Tunggu sampe penghalangnya ilang dulu. |
| **Silent Failure** | Script ngerasa udah klik, tapi aplikasinya belum "siap" nerima perintah. | Tambahin perintah tunggu (*wait*) sampe aplikasi bener-bener siap. |
| **Element Disabled** | Tombolnya ada, tapi lagi mati (misal: tombol "Daftar" belum nyala karena form belum lengkap). | Pastiin semua data di langkah sebelumnya udah diisi bener. |

![Action Intercepted Overlay](/images/tutorials/interaction-intercepted.png)

### ⚠️ Bahaya "Forced" Click

Banyak *tools* punya fitur `force: true`. Ini bakal maksa nge-klik walaupun elemennya ketutup atau nggak keliatan.

> [!CAUTION]
> **Saran Pro:** Jangan gampang kegoda pake *force click*. Kalo user asli nggak bisa klik tombolnya karena ketutup iklan, ya otomatisasi kamu juga jangan maksa nge-klik. Nanti malah *bug* aslinya nggak ketauan!

---

## 5. Checklist Rangkuman

* Gunakan `Fill` biar test jalan cepet, pake `Type` cuma kalo mau simulasi ngetik beneran.
* Pastiin elemennya diem dan keliatan (*stable & visible*) sebelum diklik.
* Jangan pake "Force Click" kecuali bener-bener terdesak dan kamu tau resikonya.

---

## 6. Bacaan Lanjut (Deep Dive)

### Dokumentasi Resmi (MDN)

* **[MouseEvent (Click)](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)**: Detail teknis apa yang terjadi di browser pas ada klik.
* **[InputEvent vs Change Event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)**: Bedanya ngetik satu karakter sama masukin nilai sekaligus.

---

Wah, sekarang kamu udah paham gimana cara "berinteraksi" sama elemen web!
