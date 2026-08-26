---
title: 'Web-First Assertions That Prove Behavior'
description: 'Assert observable outcomes with retrying Playwright assertions and avoid checks that pass too early.'
---

## An action is not proof

```ts
await page.getByRole('button', { name: 'Save profile' }).click();
```

This can succeed even if the save request fails afterward. A test becomes useful when it proves the expected outcome:

```ts
await expect(page.getByRole('status')).toHaveText('Profile saved');
```

## Prefer web-first assertions

Playwright locator assertions retry until they pass or reach the assertion timeout:

```ts
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
await expect(page.getByLabel('Email')).toHaveValue('qa@example.com');
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(page.getByRole('listitem')).toHaveCount(3);
await expect(page).toHaveURL(/\/dashboard$/);
```

In contrast, this reads one moment and gives no automatic retry:

```ts
expect(await locator.textContent()).toBe('Saved');
```

Use a one-time value assertion when a snapshot is intentionally what you need. Do not use it accidentally for changing UI.

## Assert the smallest sufficient evidence

For an order submission, a confirmation heading and order identifier may be sufficient. Checking twenty unrelated fields makes the test noisy and harder to diagnose.

Avoid implementation-only evidence such as a CSS class if the user-visible state can be asserted. A class changing from `loading` to `loaded` does not prove the correct account data appeared.

## Negative assertions need a known starting point

```ts
await expect(page.getByRole('dialog')).toBeHidden();
```

This can pass immediately because the dialog was never shown. When disappearance is the behavior, first establish the prior state or trigger it explicitly:

```ts
await expect(dialog).toBeVisible();
await dialog.getByRole('button', { name: 'Close' }).click();
await expect(dialog).toBeHidden();
```

## Soft assertions

`expect.soft` records a failure and lets the test continue, but the test still fails at the end. Use it for a group of independent diagnostics, not to continue a workflow whose prerequisite already failed.

## Assertion review

For every assertion, ask:

- Which risk does it cover?
- Could it pass before the action has its intended effect?
- Could it pass on the wrong element or wrong account?
- Will its failure explain what changed?

The strongest assertion is not the most detailed one. It is the smallest reliable proof of the scenario’s outcome.
