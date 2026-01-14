---
title: 'Pondasi 1: Anatomi HTML Element'
description: 'Belajar cara baca "blueprint" halaman web sebelum gas pol bikin otomatisasi.'
---

> **Pesan Singkat:** Luangkan waktu buat paham "blueprint" web sebelum kamu mulai bikin script automation.

Dari perspektif user, mungkin kita cuma liat tombol "Login" yang cantik. Tapi sebagai Automation Engineer, kita kudu bisa ngeliat **kode** yang ngebentuk tombol itu. HTML (*HyperText Markup Language*) itu ibarat bahasa yang dipake buat bikin *blueprint*-nya.

## 1. Struktur Dasar

![HTML Element Anatomy](/images/tutorials/html-anatomy-diagram.png)

Biasanya, satu elemen itu isinya ada tiga bagian utama:

* **Opening Tag (Tag Pembuka):** Ngasih tau browser di mana elemen itu dimulai (contoh: `<button>`).
* **Content (Isi):** Teks atau elemen lain yang ada di dalemnya (contoh: `Login`).
* **Closing Tag (Tag Penutup):** Ngasih tau browser kalo elemennya udah beres (contoh: `</button>`).

**Contoh simpelnya:**
`<button>Submit</button>`

---

## 2. Attribute dan Value

![HTML Attribute Anatomy](/images/tutorials/html-attribute-anatomy.png)

Nah, ini bagian paling penting buat orang QA. **Attribute** itu info tambahan tentang suatu elemen. Posisinya selalu ada di dalem **Opening Tag**.

Anggap aja attribute itu **Key** (kunci) dan isinya adalah **Value** (nilai).

**Contoh:**
`<input type="text" id="username" placeholder="Masukkan nama kamu">`

* **Attribute (Key):** `type` | **Value:** `"text"`
* **Attribute (Key):** `id` | **Value:** `"username"`
* **Attribute (Key):** `placeholder` | **Value:** `"Masukkan nama kamu"`

> [!TIP]
> **QA Pro-Tip:** Pas kamu nulis *automation script*, intinya kamu lagi merintahin komputer: "Tolong cariin elemen yang **id**-nya itu **username**."

---

## 3. Tag Umum yang Wajib Kamu Kenal

Kamu nggak perlu jago coding kayak Web Developer, tapi minimal harus kenal sama "balok susun" ini karena cara nanganinnya di automation beda-beda:

| Tag | Fungsi | Kenapa Penting buat QA? |
| --- | --- | --- |
| `<a>` | Link | Biasanya di-**click** buat pindah halaman. Ciri khasnya punya attribute `href`. |
| `<button>` | Tombol | Di-**click** buat kirim form atau jalanin aksi tertentu. |
| `<input>` | Kolom Isian | Tempat kamu ngetik atau **type** (send keys). |
| `<div>` | Wadah (Box) | Kotak buat ngerapiin layout. User nggak liat, tapi sering dipake buat nyari elemen di dalemnya. |
| `<span>` | Wadah Teks | Biasanya buat teks kecil kayak pesan error atau label. |

---

## 4. Bedanya Text Content vs. Attributes

![Text vs Attribute](/images/tutorials/html-text-vs-attribute.png)

Banyak Automation Engineer pemula yang sering ketuker antara **Text** sama **Attribute**.

* **Text:** Ada di *antara* tag pembuka dan penutup. Ini yang keliatan langsung sama user di layar.
* **Attribute:** Ada di *dalem* tag pembuka. Ini data "di balik layar" yang dipake browser atau developer.

**Biar jelas, liat contoh ini:**
`<button id="login-btn">Login Sekarang</button>`

* **Attribute Value:** `login-btn` (Dipake script buat nyari tombolnya).
* **Text Content:** `Login Sekarang` (Dipake buat mastiin teks yang muncul ke user udah bener).

---

## 5. Self-Closing Tags

![Normal vs Self-Closing](/images/tutorials/html-self-closing.png)

Nggak semua elemen itu punya "Tag Penutup" atau "Isi Teks". Ada yang namanya **Self-Closing Tags** karena mereka berdiri sendiri dan nggak perlu nutup apa-apa.

**Contohnya:**

* `<input type="text">` (Kolom input)
* `<img src="logo.png">` (Gambar)
* `<br>` (Ganti baris)

**Kenapa harus tau?** Biar pas kamu lagi ngeliat struktur web (DOM), kamu nggak bingung kok nggak ada penutupnya kayak `</input>`. Itu bukan **bug**, emang emang desainnya begitu.

---

## Checklist Rangkuman

Sebelum lanjut ke materi berikutnya, pastiin kamu udah oke sama hal ini:

1. Bisa tau mana **Tag Name** dari sebuah elemen?
2. Bisa bedain mana **Attribute** dan mana **Value**-nya?
3. Paham bedanya **attribute ID** sama **Text content**?

---

## 6. Mau Belajar Lebih Dalem?

Kalo kamu penasaran sama dokumentasi resminya, cek di sini:

### Dokumentasi MDN (Bahasa Inggris)

* **[Anatomy of an HTML Element](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started#anatomy_of_an_html_element)**: Penjelasan visual soal tag, attribute, dan cara nyusunnya.
* **[HTML Attributes Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)**: Daftar lengkap attribute yang sering dipake kayak `id`, `class`, dan lain-lain.
