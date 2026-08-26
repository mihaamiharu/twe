---
title: 'Synchronize Navigation and One-Time Browser Events'
description: 'Follow outcomes across routes, popups, downloads, dialogs, and frames without creating event-order races.'
---

## After this lesson, you can

- choose observable evidence for full navigation, client-side routing, and same-page updates;
- capture a popup or download by registering its wait before the triggering action;
- handle browser dialogs without freezing the page;
- recognize an iframe as a separate document context; and
- diagnose tests that wait on the wrong browser surface.

## Why this matters for QA

An action does not always finish on the page where it started.

“Open invoice” might navigate the current tab, open a new tab, or download a PDF. “Delete account” might show a browser confirmation dialog. A payment form might live inside an iframe owned by another service.

If the test assumes the wrong surface, increasing the timeout will never make it correct. It may wait for a heading on the original page while the actual heading is in a popup, or start listening for a download after the download has already begun.

The QA skill here is not memorizing five APIs. It is identifying where the product behavior becomes observable and arranging the test so a one-time signal cannot be missed.

## The mental model

First classify the outcome:

```text
Trigger an action
      ↓
Where does the outcome appear?
      ├─ Current page state or URL → act, then use a retried assertion
      ├─ One-time event            → register promise/handler, then act
      └─ Separate document context → enter that page/frame, then locate normally
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

An order history page has three invoice behaviors:

- selecting Order history changes the current route;
- Open invoice launches an HTML invoice in a new tab; and
- Download PDF emits a download.

There is also a Cancel order action that opens a browser confirmation dialog.

### 1. Synchronize current-page navigation with user evidence

```ts
await page.getByRole('link', { name: 'Order history' }).click();

await expect(page).toHaveURL(/\/orders$/);
await expect(
  page.getByRole('heading', { name: 'Order history' }),
).toBeVisible();
```

A full document navigation and a client-side route can look the same to a user. `toHaveURL()` retries until the URL matches; the heading proves the route rendered meaningful content. Use whichever evidence the requirement needs—sometimes the heading is enough, while a routing requirement may justify both.

Avoid waiting for a generic load state and assuming the feature is ready. The browser can finish loading before application data appears, and a single-page application may update without a new document load.

### 2. Capture a popup without a race

```ts
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await popupPromise;

await expect(invoicePage).toHaveURL(/\/invoices\/1042$/);
await expect(
  invoicePage.getByRole('heading', { name: 'Invoice 1042' }),
).toBeVisible();
```

`popupPromise` starts observing before the click. The test awaits the new `Page` after the action, then uses normal locators and assertions on that page.

If the application can create a new page that is not specifically tied to the current page, a browser-context page event may be the appropriate scope. Choose the narrowest event source that matches the product behavior.

### 3. Capture and inspect a download

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download PDF' }).click();
const download = await downloadPromise;

expect(download.suggestedFilename()).toBe('invoice-1042.pdf');
await download.saveAs('artifacts/invoice-1042.pdf');
```

The event proves a download began. The filename assertion verifies one user-relevant property. If file contents carry the real risk, inspect them with an appropriate parser or downstream check; merely saving the file is not proof that it contains the correct invoice.

Downloaded files are temporary for the browser context unless saved elsewhere. Use explicit artifact locations in a real project and avoid committing sensitive output.

### 4. Handle a dialog before the trigger

```ts
page.once('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('Cancel order 1042?');
  await dialog.accept();
});

await page.getByRole('button', { name: 'Cancel order' }).click();
await expect(page.getByRole('status')).toHaveText('Order cancelled');
```

Playwright automatically dismisses dialogs when there is no listener. Once you register a dialog listener, that listener must accept or dismiss the dialog; otherwise the page remains blocked and the triggering action can hang.

The dialog assertion proves the correct confirmation appeared. The final status proves the accepted action produced its application outcome.

### 5. Cross a frame boundary deliberately

An iframe is not a one-time event. It is another document embedded in the page:

```ts
const paymentFrame = page.frameLocator('[title="Secure payment"]');

await paymentFrame.getByLabel('Card number').fill('4242 4242 4242 4242');
```

After entering the frame context, use the same semantic locator strategy you would use on the main page. Do not add `frameLocator()` just because a control is hard to find. Confirm in DevTools that the control is actually inside an iframe, and prefer a meaningful frame title or other stable contract.

## When to use it—and when not to

Use a retried URL or UI assertion when the result appears on the current page. Do not manually coordinate a load event when user-visible state already expresses readiness more clearly.

Use `waitForEvent('popup')` or `waitForEvent('download')` when the one-time browser event is part of the scenario. Start the promise before the trigger, then await it afterward.

Use a dialog handler only when the test needs to control or inspect a real browser dialog. Application-styled modals are regular DOM elements; locate them by dialog role and interact normally.

Use `frameLocator()` only across a confirmed iframe boundary. A new tab is a `Page`, not a frame. A native browser dialog is neither.

File upload is also not a download event. `setInputFiles()` interacts with a file input and the application should expose an observable validation or uploaded state. The focused upload exercise is mapped to the first lesson's Additional Practice.

Avoid `waitForLoadState('networkidle')` as a general readiness shortcut. Prefer the route, heading, status, or control state the scenario actually promises.

## When it fails

When a post-action wait times out, map the product behavior before changing timing:

1. Did the action update the current page, navigate it, open a popup, or start a download?
2. Was the event promise or dialog handler registered before the trigger?
3. Did you accidentally await the promise before performing the trigger?
4. Are locators and assertions using the new `Page` or the original page?
5. Is the target inside an iframe, and did you enter the correct frame?
6. Did a dialog listener forget to accept or dismiss the dialog?
7. Did the event occur but the later business assertion fail?

Use traces and screenshots to see which surfaces exist after the action. For downloads, inspect failure information and the suggested filename. For popups, inspect all pages in the context. For frames, inspect frame URLs and titles only as diagnostic clues; keep the final locator tied to a maintainable contract.

## Review generated work

Review generated navigation and event code with these questions:

- Does it identify the surface where the outcome appears?
- Is every one-time event promise created before its triggering action?
- Is the promise awaited after, rather than before, that action?
- Does a popup assertion operate on the popup `Page`?
- Does a dialog handler always accept or dismiss?
- Is an application modal being confused with a native dialog?
- Is `networkidle` being used as a generic readiness guess?
- Does a download check meaningful evidence, not only call `saveAs()`?
- Was an iframe boundary confirmed rather than assumed?
- Is there an assertion for the business result after the browser event?

AI often produces the right APIs in the wrong order. Event ordering and surface ownership are review responsibilities.

## Check your understanding

Review this generated invoice test:

```ts
await page.getByRole('link', { name: 'Open invoice' }).click();
const invoicePage = await page.waitForEvent('popup');
await page.waitForLoadState('networkidle');
await expect(page.getByText('Invoice 1042')).toBeVisible();
```

The link opens a new tab immediately, and that tab renders a heading named Invoice 1042.

Explain:

1. Where is the race?
2. Which line waits on the wrong page?
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

The event observation begins before the trigger, the new `Page` is captured afterward, and the assertion runs on the surface that owns the invoice. The heading—not network silence—defines the user-visible readiness needed by this scenario.

## Before you continue

You should now be able to classify an outcome by browser surface, order one-time event waits safely, and distinguish a new page, native dialog, download, and iframe.

This lesson has no separate Core Practice because the current standalone playground cannot faithfully exercise popup and download event ordering. The iframe drill remains Additional Practice. Module 5 completion instead depends on the two earlier Core Practices: deliberate state-based actions and observable outcome synchronization.
