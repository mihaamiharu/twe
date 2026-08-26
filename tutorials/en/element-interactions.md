---
title: 'User-Like Actions'
description: 'Choose the action that matches the control and use keyboard-level input only when behavior depends on individual events.'
---

## Match the action to the control

Playwright actions communicate intent and include relevant readiness checks:

```ts
await page.getByRole('button', { name: 'Add to cart' }).click();
await page.getByLabel('Email').fill('qa@example.com');
await page.getByLabel('Remember me').check();
await page.getByLabel('Country').selectOption('ID');
```

Use `check()` for a checkbox rather than blindly clicking it. If it is already checked, `check()` leaves it checked. That makes the desired state explicit.

## Fill versus sequential key presses

`fill()` focuses an editable control, sets its value, and dispatches input behavior. It is the normal choice for forms.

```ts
await page.getByLabel('Search').fill('playwright');
```

Use `pressSequentially()` only when the application depends on individual key events—for example an autocomplete that reacts to each character:

```ts
await page.getByLabel('Search').pressSequentially('playwright', {
  delay: 50,
});
```

A delay is not a synchronization strategy. The resulting suggestions still need an observable assertion.

## Keyboard and focus behavior

Prefer pressing keys through a focused locator:

```ts
const search = page.getByRole('searchbox');
await search.fill('invoice 1042');
await search.press('Enter');
```

Use `page.keyboard` when global keyboard state is the behavior under test. Verify focus explicitly when focus itself matters:

```ts
await search.focus();
await expect(search).toBeFocused();
```

## Specialized interactions

```ts
await page.getByText('Products').hover();
await source.dragTo(target);
await page.getByLabel('Resume').setInputFiles('fixtures/resume.pdf');
```

A string passed to `setInputFiles` is a filesystem path resolved from the process working directory. Use an in-memory file payload when a real fixture file is unnecessary.

## Forced actions are diagnostic signals

`click({ force: true })` bypasses some actionability checks. It may be valid for a deliberately unusual control, but it often hides an overlay, disabled state, or product defect. Record why normal user interaction is impossible before keeping it.

Every action should lead to evidence. The next lesson explains what Playwright waits for before the action and what your test must still wait for afterward.
