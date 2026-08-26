---
title: 'Navigasi, Popup, Dialog, Download, dan Frame'
description: 'Tangani surface dan event browser dengan menunggu perilaku yang menciptakannya.'
---

## Navigation dan hasil URL

Action modern dapat menyebabkan full navigation, client-side routing, atau update di halaman yang sama. Periksa hal yang seharusnya diamati pengguna:

```ts
await page.getByRole('link', { name: 'Order history' }).click();
await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

URL dan heading bersama-sama memberi bukti lebih kuat daripada menunggu generic load state.

## Popup dan download

Daftarkan event wait sebelum action pemicu agar event tidak terjadi di antara dua baris:

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoice = await popupPromise;
await expect(invoice).toHaveURL(/invoice/);
```

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download receipt' }).click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toBe('receipt.pdf');
```

## Dialog

Browser dialog menghentikan interaksi halaman. Daftarkan handler dan periksa kontennya ketika pesan memang penting:

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.message()).toContain('Delete this account');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Delete account' }).click();
```

## Frame

Iframe memiliki document sendiri. Lewati batasnya secara eksplisit, lalu gunakan strategi locator normal di dalamnya:

```ts
const payment = page.frameLocator('[title="Secure payment"]');
await payment.getByLabel('Card number').fill('4242 4242 4242 4242');
```

Jangan menambah frame handling sebelum inspeksi membuktikan kontrol memang berada di dalam frame.

## File upload

```ts
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
await expect(page.getByText('failure.png')).toBeVisible();
```

Path harus tersedia di runner nyata. Simpan fixture kecil yang tidak sensitif dalam version control atau buat payload in-memory.

## Pilih surface yang benar

Ketika test macet setelah action, inspeksi apakah hasil muncul di page lain, frame, dialog, download, atau response network saja. Menunggu surface yang salah tidak menjadi andal hanya karena timeout diperbesar.
