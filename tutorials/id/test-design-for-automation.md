---
title: 'Rancang Test Positif dan Negatif yang Terfokus'
description: 'Ubah risiko menjadi skenario independen dengan state terkendali, boundary bermakna, dan kegagalan yang mudah didiagnosis.'
---

## Mulai dari risiko, bukan cakupan layar

“Uji halaman checkout” terlalu luas. Identifikasi kegagalan yang penting:

- pelanggan valid tidak dapat membeli produk tersedia;
- produk habis dapat dibeli;
- pembayaran ditolak tetapi ditampilkan berhasil;
- pelanggan dapat melihat order pelanggan lain.

Setiap risiko membutuhkan setup, action, dan bukti berbeda.

## Positif dan negatif belum cukup

Happy path membuktikan alur bernilai bekerja. Kasus negatif harus mencakup aturan dan boundary penting—bukan setiap string acak yang invalid.

```text
Dengan produk tersedia dan pelanggan aktif
Ketika pelanggan menyelesaikan checkout dengan pembayaran valid
Maka order dibuat satu kali dan identifier-nya terlihat
```

```text
Dengan produk habis
Ketika pelanggan mencoba menambahkannya
Maka cart line tidak dibuat dan panduan ketersediaan ditampilkan
```

## Jaga skenario tetap independen

Test B tidak boleh bergantung pada Test A untuk membuat akun. Dependency menyebabkan kegagalan berdasarkan urutan dan menghambat eksekusi paralel.

Siapkan state melalui fixture, API, database utility, atau setup UI stabil sesuai risiko. Bersihkan data jika shared environment membutuhkannya. Gunakan identifier unik jika parallel worker dapat bertabrakan.

## Satu perilaku, bukti secukupnya

“Satu assertion per test” bukan aturan. Sebuah skenario dapat membutuhkan beberapa assertion untuk membuktikan satu perilaku, misalnya URL, heading konfirmasi, dan nomor order. Hindari menggabungkan perilaku tidak terkait hanya untuk menghemat setup.

## Waspadai test dengan jalur opsional

```ts
if (await cookieBanner.isVisible()) {
  await cookieBanner.getByRole('button', { name: 'Accept' }).click();
}
```

Ini mungkin valid sebagai shared setup jika banner memang nondeterministik di environment tersebut. Ini adalah logika test buruk jika banner itu sendiri sedang diuji. Kendalikan state dan buat expectation eksplisit.

## Buat kegagalan mudah didiagnosis

Gunakan judul dan step deskriptif:

```ts
test('declined card leaves order uncreated', async ({ page }) => {
  await test.step('submit a declined payment', async () => {
    // action
  });

  await test.step('show decline without an order number', async () => {
    // assertions
  });
});
```

Jangan menangkap assertion error, menggantinya dengan `console.log`, atau mengulang action sampai kebetulan berhasil. Kegagalan yang dapat dipercaya adalah bagian dari feedback produk.

## Tinjau skenario hasil generate

Hapus happy path duplikat, setup UI yang seharusnya berada di lapisan lebih rendah, assertion di luar risiko, dependency shared state, serta secret dalam judul atau log. Pertahankan portfolio terkecil yang memberi cakupan risiko berguna.
