---
title: 'Wait for Navigation and Browser Events in the Right Order'
description: 'Wait for URL changes, popups, downloads, and dialogs without missing events, then verify the result on the correct page or frame.'
---

## After this lesson, you can

- decide what to verify after full navigation, client-side routing, or a same-page update;
- wait for a popup or download before running the action that triggers it;
- handle browser dialogs without freezing the page;
- determine when an element needs to be located through a frame context; and
- diagnose why a popup, download, dialog, or page change did not appear as expected.

## Why this matters for QA

An action does not always finish on the page where it started.

“Open invoice” might navigate the current tab, open a new tab, or download a PDF. “Delete account” might show a browser confirmation dialog. A payment form might live inside an iframe owned by another service.

If the test waits in the wrong place, increasing the timeout will not fix it.

For example, the test may wait for a heading on the current page when that heading appears in a new tab. It may also start waiting for a download after the download has already begun.

You need to know where an action produces its result. If that result is a fast browser event, start waiting before running the action.

## The mental model

First decide where the action will produce its result:

```text
Run an action
      ↓
Where does the outcome appear?
      ├─ Same page or URL       → run the action, then wait with an assertion
      ├─ Browser event          → start waiting first, then run the action
      └─ Another page or iframe → use the correct page or frame, then locate the element
```

For one-time events, order matters:

![The reliable event pattern registers the promise before the trigger, while triggering first can lose a fast popup or download.](/images/tutorials/event-listener-before-trigger.svg)

_Create the event promise first, but do not await it until after the action that produces the event._

Starting with this is wrong:

```ts
const download = await page.waitForEvent('download');
await page.getByRole('button', { name: 'Export' }).click();
```

The first line waits for an event that the second line has not triggered, so the click is never reached.

Triggering first and registering later is also risky because a fast event can occur between the two lines.

## Work through a realistic example

An order history page has three behaviors:

- selecting Order history changes the current route;
- Open invoice launches an HTML invoice in a new tab; and
- Download PDF emits a download.

There is also a Cancel order action that opens a browser confirmation dialog.

### 1. Wait for the page to change, then verify the result

```ts
await page.getByRole('link', { name: 'Order history' }).click();

await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

A full page navigation and client-side routing can look the same to a user.

`toHaveURL()` waits until the URL matches. The heading confirms that the **Order history** content has appeared.

Choose assertions based on the requirement. Sometimes the heading is enough. If the URL change is also part of the scenario, verify both.

Do not wait for a generic load state and assume the page is ready. The browser can finish loading before application data appears. A single-page application can also update without a full page load.

### 2. Wait for the popup before running the action

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await popupPromise;

await expect(invoicePage).toHaveURL(/\/invoices\/1042$/);
await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

Create `popupPromise` before `click()` so the popup event cannot be missed.

After the popup opens, use `invoicePage` for locators and assertions that belong to the new page.

If the application can create a new page that is not specifically tied to the current page, a browser-context page event may be the appropriate scope. Choose the narrowest event source that matches the product behavior.

### 3. Wait for the download, then verify the result

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download PDF' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('invoice-1042.pdf');
await download.saveAs('artifacts/invoice-1042.pdf');
```

The `download` event confirms that the download started.

You can then verify what matters to the scenario, such as the generated filename.

If the file contents are part of the requirement, inspect them with an appropriate parser or another check. Calling `saveAs()` alone does not prove that the file contains the correct invoice.

Downloaded files are temporary and are deleted when the browser context closes unless you save them elsewhere.

In a real project, save them in the folder used for test artifacts and avoid committing output that contains sensitive data.

### 4. Handle the dialog before running the action

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('Cancel order 1042?');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Cancel order' }).click();
await expect(page.getByRole('status')).toHaveText('Order cancelled');
```

Playwright automatically dismisses a dialog when there is no listener.

Once you register a listener, it must call `accept()` or `dismiss()`. Otherwise, the page keeps waiting for the dialog and the triggering `click()` can hang.

The dialog assertion proves the correct confirmation appeared. The final status proves the accepted action produced its application outcome.

### 5. Use the correct frame when an element is inside an iframe

An iframe is not a one-time event. It is another document embedded in the page:

```ts
const paymentFrame = page.frameLocator('[title="Secure payment"]');

await paymentFrame.getByLabel('Card number').fill('4242 4242 4242 4242');
```

If the element is inside an iframe, use `frameLocator()` first and then locate the element inside that frame as usual.

Do not add `frameLocator()` only because a locator cannot find an element. Check in DevTools that the element is inside an iframe, then identify the frame with a stable attribute such as its `title`.

## When to use it—and when not to

Use a retried URL or UI assertion when the result appears on the current page. Do not manually coordinate a load event when user-visible state already expresses readiness more clearly.

Use `waitForEvent('popup')` or `waitForEvent('download')` when the one-time browser event is part of the scenario. Start the promise before the trigger, then await it afterward.

Use a dialog handler only when the test needs to control or inspect a real browser dialog. Application-styled modals are regular DOM elements; locate them by dialog role and interact normally.

Use `frameLocator()` only across a confirmed iframe boundary. A new tab is a `Page`, not a frame. A native browser dialog is neither.

File upload is also not a download event. `setInputFiles()` interacts with a file input and the application should expose an observable validation or uploaded state. The focused upload exercise is mapped to the first lesson's Additional Practice.

Avoid `waitForLoadState('networkidle')` as a general readiness shortcut. Prefer the route, heading, status, or control state the scenario actually promises.

## When it fails

When a test times out after an action, first check where that action should produce its result:

1. Did the action update the current page, navigate it, open a popup, or start a download?
2. Was the event promise or dialog handler registered before the trigger?
3. Did you accidentally await the promise before performing the trigger?
4. Are locators and assertions using the new `Page` or the original page?
5. Is the target inside an iframe, and did you enter the correct frame?
6. Did a dialog listener forget to accept or dismiss the dialog?
7. Did the event occur but the later business assertion fail?

Use traces and screenshots to see what happened after the action.

For a download, inspect its failure information and suggested filename. For a popup, inspect the pages open in the browser context. For an iframe, its URL or title can help you identify the correct frame while debugging.

Review navigation and event code with these questions:

- Does the test wait in the right place for the result?
- Is every one-time event promise created before its triggering action?
- Is the promise awaited after, rather than before, that action?
- Does a popup assertion operate on the popup `Page`?
- Does a dialog handler always accept or dismiss?
- Is an application modal being confused with a native dialog?
- Is `networkidle` being used as a generic readiness guess?
- Does a download check meaningful evidence, not only call `saveAs()`?
- Was an iframe boundary confirmed rather than assumed?
- Is there an assertion for the business result after the browser event?

The method can be correct while the order is still wrong. Make sure the test knows which event to wait for, when to start waiting, and which page or frame owns the final assertion.

## Check your understanding

Review this invoice test:

```ts
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await page.waitForEvent('popup');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Invoice 1042')).toBeVisible();
```

The link opens a new tab immediately, and that tab renders a heading named Invoice 1042.

Explain:

1. Where is the race?
2. Which lines still wait or assert on the original page?
3. How should the promise, trigger, and new-page assertion be ordered?
4. What observable condition should replace generic network idle?

## Compare your reasoning

One reasonable answer is:

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await popupPromise;

await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

The popup wait starts before `click()` so the event cannot be missed.

After the new tab opens, the test uses `invoicePage` for the assertion on that tab.

There is no need to wait for `networkidle`. The **Invoice 1042** heading is a clearer condition that proves the expected invoice has appeared.

## Before you continue

You should now be able to classify an outcome by browser surface, order one-time event waits safely, and distinguish a new page, native dialog, download, and iframe.

This lesson has no separate Core Practice because the current standalone playground cannot reliably simulate popup and download event ordering.

The iframe drill remains Additional Practice.

Module 5 completion depends on the two earlier Core Practices: choosing actions based on the required state or behavior, and waiting for observable results without fixed sleeps.
