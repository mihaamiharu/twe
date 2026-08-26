---
title: 'Navigation, Popups, Dialogs, Downloads, and Frames'
description: 'Handle browser surfaces and events by waiting for the behavior that creates them.'
---

## Navigation and URL outcomes

Modern actions may cause full navigation, client-side routing, or an in-place update. Assert what the user should observe:

```ts
await page.getByRole('link', { name: 'Order history' }).click();
await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

The URL and heading together give stronger evidence than waiting for a generic load state.

## Popups and downloads

Register the event wait before the triggering action so the event cannot occur between two lines:

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

## Dialogs

Browser dialogs pause page interaction. Register a handler and assert its content when the message matters:

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.message()).toContain('Delete this account');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Delete account' }).click();
```

## Frames

An iframe has its own document. Cross the boundary explicitly, then use normal locator strategy inside it:

```ts
const payment = page.frameLocator('[title="Secure payment"]');
await payment.getByLabel('Card number').fill('4242 4242 4242 4242');
```

Do not add frame handling until inspection confirms the control is actually inside a frame.

## File upload

```ts
await page
  .getByLabel('Attach evidence')
  .setInputFiles('tests/fixtures/failure.png');
await expect(page.getByText('failure.png')).toBeVisible();
```

The path must exist in the real runner. Keep small, non-sensitive fixtures under version control or create an in-memory payload.

## Choose the correct surface

When a test hangs after an action, inspect whether the outcome occurred in another page, frame, dialog, download, or network-only response. Waiting on the wrong surface cannot become reliable by increasing the timeout.
