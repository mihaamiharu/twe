# Playwright Wait Strategies

Master timing and synchronization in your Playwright tests.

---

## Auto-Wait (Built-in)

Playwright automatically waits for:
- Element to be **visible**
- Element to be **stable** (no animations)
- Element to be **enabled**
- Element to receive **events**

```javascript
// Auto-waits for button to be clickable
await page.click('#submit');
```

---

## waitForSelector

```javascript
// Wait for visible (default)
await page.waitForSelector('#modal');

// Wait for hidden
await page.waitForSelector('.spinner', { state: 'hidden' });

// Wait for attached to DOM
await page.waitForSelector('#elem', { state: 'attached' });

// Wait for detached
await page.waitForSelector('#popup', { state: 'detached' });
```

---

## waitForLoadState

```javascript
// DOM ready
await page.waitForLoadState('domcontentloaded');

// Full load + resources
await page.waitForLoadState('load');

// Network idle
await page.waitForLoadState('networkidle');
```

---

## waitForResponse

```javascript
// Wait for specific URL
const resp = await page.waitForResponse('/api/users');

// With action
const [response] = await Promise.all([
    page.waitForResponse('/api/save'),
    page.click('#save')
]);
```

---

## waitForFunction

```javascript
// Custom JavaScript condition
await page.waitForFunction(() => {
    return document.querySelectorAll('.item').length >= 5;
});

// With arguments
await page.waitForFunction(
    sel => document.querySelector(sel)?.textContent === 'Ready',
    '#status'
);
```

---

## Timeout Configuration

```javascript
// Per-action timeout
await page.click('#btn', { timeout: 5000 });

// In config
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

---

## Quick Reference

| Method | Use Case |
|--------|----------|
| Auto-wait | Default (most actions) |
| `waitForSelector` | Specific element states |
| `waitForLoadState` | Page loading |
| `waitForResponse` | API calls |
| `waitForFunction` | Custom conditions |
| `{ timeout: ms }` | Custom timeouts |

---

## Practice Challenges

1. [Auto-Wait Understanding](/challenges/pw-auto-wait)
2. [waitForSelector](/challenges/pw-wait-for-selector)
3. [waitForLoadState](/challenges/pw-wait-for-load-state)
4. [waitForResponse](/challenges/pw-wait-for-response)
5. [waitForFunction](/challenges/pw-wait-for-function)
6. [Timeout Configuration](/challenges/pw-timeout-config)
