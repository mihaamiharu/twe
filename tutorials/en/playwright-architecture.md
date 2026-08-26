---
title: 'Browser Contexts and Test Isolation'
description: 'Understand the Playwright objects that keep tests realistic, independent, and safe to run in parallel.'
---

## The useful object model

```text
Browser
└── BrowserContext (isolated session)
    ├── Page (tab)
    └── Page (another tab)
```

A browser process can host multiple contexts. Each context behaves like a separate incognito-style session with its own cookies, local storage, and permissions. Pages inside one context share that session.

Playwright Test normally supplies a fresh context and page for each test:

```ts
test('customer sees an empty cart', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});
```

That isolation is a core reliability feature, not disposable overhead.

## Model multiple users with contexts

```ts
test('agent replies to a customer', async ({ browser }) => {
  const customerContext = await browser.newContext();
  const agentContext = await browser.newContext();

  const customerPage = await customerContext.newPage();
  const agentPage = await agentContext.newPage();

  // Each page has a separate authenticated session.

  await customerContext.close();
  await agentContext.close();
});
```

Do this only when the scenario truly needs concurrent roles. Most tests should use the standard `page` fixture.

## Browser coverage is not brand equivalence

Playwright runs Chromium, Firefox, and WebKit engines. WebKit testing provides useful coverage for Safari-like engine behavior, but Playwright WebKit is not branded Safari. Use real-device or vendor-browser testing when product risk requires exact branded browser/device coverage.

## Protocol trivia is not the curriculum goal

Playwright communicates with each supported browser using its own integration. The practical consequences matter more than memorizing protocol names:

- isolated contexts are cheap enough for test-level isolation;
- locators re-resolve against the live DOM;
- actions include browser-aware readiness checks;
- traces can combine DOM snapshots, actions, network, and errors.

## Isolation checklist

A test should be able to run alone, after another test, in a different order, and in parallel without changing its result. If it cannot, investigate shared accounts, shared records, cached state, server limits, or cleanup—not the browser engine architecture.
