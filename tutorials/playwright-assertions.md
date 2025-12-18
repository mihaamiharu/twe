# Playwright Assertions

Verify your test expectations with Playwright's rich assertion library.

---

## Auto-Retrying Assertions

Playwright assertions automatically retry until the condition is met or timeout:

```javascript
// Will retry for up to 5 seconds (default)
await expect(page.locator('.spinner')).toBeHidden();
```

---

## Visibility

```javascript
// Check visibility
await expect(page.locator('#modal')).toBeVisible();
await expect(page.locator('.loader')).toBeHidden();
await expect(page.locator('.error')).not.toBeVisible();
```

---

## Text Content

```javascript
// Exact match
await expect(page.locator('h1')).toHaveText('Welcome');

// Partial match
await expect(page.locator('p')).toContainText('hello');

// Regex
await expect(page.locator('.status')).toHaveText(/success/i);
```

---

## Input Values

```javascript
await expect(page.locator('#email')).toHaveValue('test@example.com');
await expect(page.locator('#search')).toHaveValue('');  // Empty
```

---

## State Assertions

```javascript
// Checked state
await expect(page.locator('#terms')).toBeChecked();
await expect(page.locator('#opt-out')).not.toBeChecked();

// Disabled/Enabled
await expect(page.locator('#submit')).toBeDisabled();
await expect(page.locator('#next')).toBeEnabled();

// Editable
await expect(page.locator('#notes')).toBeEditable();
```

---

## Attributes

```javascript
await expect(page.locator('a')).toHaveAttribute('href', '/home');
await expect(page.locator('img')).toHaveAttribute('src', /\.jpg$/);
```

---

## Element Count

```javascript
await expect(page.locator('.item')).toHaveCount(5);
await expect(page.locator('.error')).toHaveCount(0);
```

---

## Page Assertions

```javascript
// URL
await expect(page).toHaveURL('https://example.com/login');
await expect(page).toHaveURL(/\/dashboard$/);

// Title
await expect(page).toHaveTitle('Welcome');
await expect(page).toHaveTitle(/Dashboard/);
```

---

## Soft Assertions

Continue after failures:

```javascript
// Regular - stops on failure
await expect(locator).toHaveText('A');

// Soft - continues on failure
await expect.soft(locator).toHaveText('A');
await expect.soft(locator).toHaveText('B');
// Failures collected, test continues
```

---

## Quick Reference

| Assertion | Description |
|-----------|-------------|
| `toBeVisible()` | Element visible |
| `toBeHidden()` | Element hidden |
| `toHaveText()` | Exact text match |
| `toContainText()` | Contains text |
| `toHaveValue()` | Input value |
| `toBeChecked()` | Checkbox checked |
| `toBeEnabled()` | Not disabled |
| `toHaveAttribute()` | Has attribute |
| `toHaveCount()` | Element count |
| `toHaveURL()` | Page URL |
| `toHaveTitle()` | Page title |

---

## Practice Challenges

1. [toBeVisible & toBeHidden](/challenges/pw-to-be-visible)
2. [toHaveText](/challenges/pw-to-have-text)
3. [toHaveValue](/challenges/pw-to-have-value)
4. [State Assertions](/challenges/pw-state-assertions)
5. [toHaveAttribute](/challenges/pw-to-have-attribute)
6. [toHaveCount](/challenges/pw-to-have-count)
7. [Page Assertions](/challenges/pw-page-assertions)
8. [Soft Assertions](/challenges/pw-soft-assertions)

---

## Next Steps

Continue with [Playwright Wait Strategies](/tutorials/playwright-waits) to handle async operations.
