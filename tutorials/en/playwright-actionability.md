---
title: 'Actionability Is Not Outcome Synchronization'
description: 'Understand action-specific readiness checks and wait for the application result your scenario actually needs.'
---

## What actionability protects

Before an action, Playwright resolves the locator and performs checks relevant to that action. For example, `click()` needs one element that is visible, stable, able to receive events, and enabled. `fill()` needs an element that is visible, enabled, and editable; it does not use the same check set as a click.

If those conditions do not become true within the action timeout, the action fails with diagnostic detail.

```ts
await page.getByRole('button', { name: 'Pay now' }).click();
```

This protects against clicking a moving, covered, or disabled target. It is not a statement that payment finished.

## Separate three moments

```text
1. Target ready for action
2. Action dispatched/completed
3. Application reached the expected outcome
```

Playwright handles much of moments 1 and 2. Your scenario must define moment 3:

```ts
await page.getByRole('button', { name: 'Pay now' }).click();

await expect(
  page.getByRole('heading', { name: 'Payment confirmed' }),
).toBeVisible();
```

The web-first assertion repeatedly checks the confirmation. No fixed sleep is needed.

## Wait for events when they are the product behavior

Sometimes the action produces an event rather than same-page UI. Start listening before the action:

```ts
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;
await download.saveAs('artifacts/orders.csv');
```

The same pattern applies to popups and other one-time events.

## Do not hide uncertainty

Avoid:

```ts
await page.waitForTimeout(2000);
await button.click({ force: true });
```

The sleep guesses time; force bypasses evidence that a user cannot interact. Diagnose the actual state: loading indicator, overlay, wrong data, animation, or disabled business rule.

Retries rerun failed tests and can provide resilience against infrastructure noise, but they do not correct missing synchronization. A test that only passes on retry remains a debugging target.

## Review generated waits

For every wait, ask what observable condition ends it. For every action, ask what outcome proves it worked. If neither answer is explicit, the test is vulnerable to races or false passes.
