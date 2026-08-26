---
title: 'Helper, Component Object, dan Page Object'
description: 'Pilih abstraksi terkecil yang mengurangi perawatan tanpa menyembunyikan maksud test.'
---

## Duplikasi tidak otomatis menjadi masalah

Dua test yang mengulang locator jelas mungkin lebih mudah dipahami daripada abstraksi besar yang dibuat terlalu awal. Ekstrak kode ketika pengulangan mewakili konsep domain stabil atau ketika satu perubahan membutuhkan banyak edit terkoordinasi.

## Mulai dengan helper terfokus

```ts
async function signIn(page: Page, user: TestUser) {
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}
```

Helper ini memberi nama pada satu perilaku lengkap dan menjaga kondisi sukses tetap dekat.

## Component object untuk widget berulang

```ts
export class CartPanel {
  constructor(private readonly root: Locator) {}

  item(name: string) {
    return this.root.getByRole('listitem').filter({ hasText: name });
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }
}
```

Component object sering lebih reusable daripada object satu halaman penuh karena aplikasi modern memakai widget yang sama di berbagai halaman.

## Page object ketika halaman adalah boundary domain stabil

```ts
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login');
  }

  async submit(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  error() {
    return this.page.getByRole('alert');
  }
}
```

Test menjaga assertion khusus skenario tetap terlihat:

```ts
await login.submit('qa@example.com', 'wrong');
await expect(login.error()).toHaveText('Invalid credentials');
```

Helper juga boleh memeriksa invariant seperti “login selesai” ketika hasil tersebut menjadi bagian kontrak helper. “Jangan pernah menaruh assertion di page object” bukan hukum universal.

## Tanda bahaya

- satu class menyalin setiap element halaman;
- method generik seperti `clickButton(name)` menyembunyikan maksud locator;
- assertion tersembunyi sampai judul test tidak lagi menjelaskan perilaku;
- page object saling memanggil dalam rantai navigation panjang;
- test tidak dapat melakukan jalur alternatif valid tanpa mengubah abstraksi.

Pilih helper, component object, atau page object berdasarkan pola perubahan—bukan tren.
