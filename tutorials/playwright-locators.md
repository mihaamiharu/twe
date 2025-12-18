# Playwright Locators

Master the art of finding elements with Playwright's powerful locator API.

---

## Recommended Locators

Playwright recommends using semantic locators in this order:

1. **getByRole** - Accessibility-first (best)
2. **getByText** - For visible text
3. **getByLabel** - For form fields
4. **getByPlaceholder** - For inputs
5. **getByTestId** - For test-specific IDs
6. **locator()** - CSS/XPath fallback

---

## getByRole

Find elements by their ARIA role:

```javascript
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'Home' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Agree' });
page.getByRole('heading', { level: 1 });
page.getByRole('listitem');
```

---

## getByText

Find by visible text content:

```javascript
// Exact match
page.getByText('Hello World');

// Substring match
page.getByText('Hello', { exact: false });

// Regex
page.getByText(/welcome/i);
```

---

## getByLabel

Find form inputs by label:

```javascript
page.getByLabel('Email');
page.getByLabel('Password');
page.getByLabel('Remember me');
```

---

## getByPlaceholder

Find by placeholder text:

```javascript
page.getByPlaceholder('Search...');
page.getByPlaceholder('Enter email');
```

---

## getByTestId

Find by test ID attribute:

```javascript
// Default: data-testid
page.getByTestId('submit-button');
page.getByTestId('user-avatar');
```

---

## Locator Chaining

Refine selections with chaining:

```javascript
// filter()
page.locator('.item').filter({ hasText: 'Active' });
page.locator('.row').filter({ has: page.locator('.icon') });

// Positional
page.locator('li').first();
page.locator('li').last();
page.locator('li').nth(2);  // Third (0-indexed)

// Chain multiple
page.locator('.list')
    .locator('.item')
    .filter({ hasText: 'Active' })
    .first();
```

---

## Frame Locators

Access iframe content:

```javascript
const frame = page.frameLocator('#my-iframe');
await frame.locator('button').click();

// Nested frames
page.frameLocator('#outer')
    .frameLocator('#inner')
    .locator('div');
```

---

## Working with Lists

Handle multiple elements:

```javascript
// Count
const count = await page.locator('.item').count();

// Get all text
const texts = await page.locator('li').allTextContents();

// Iterate
const items = page.locator('.item');
for (let i = 0; i < await items.count(); i++) {
    await items.nth(i).click();
}
```

---

## Quick Reference

| Method | Example |
|--------|---------|
| getByRole | `getByRole('button', {name: 'X'})` |
| getByText | `getByText('Hello')` |
| getByLabel | `getByLabel('Email')` |
| getByPlaceholder | `getByPlaceholder('Search')` |
| getByTestId | `getByTestId('id')` |
| filter | `.filter({hasText: 'x'})` |
| nth | `.nth(0)`, `.first()`, `.last()` |
| frameLocator | `frameLocator('#f')` |
| count | `.count()` |

---

## Practice Challenges

1. [getByRole](/challenges/pw-get-by-role)
2. [getByText](/challenges/pw-get-by-text)
3. [getByLabel](/challenges/pw-get-by-label)
4. [getByPlaceholder](/challenges/pw-get-by-placeholder)
5. [getByTestId](/challenges/pw-get-by-testid)
6. [Locator Chaining](/challenges/pw-locator-chaining)
7. [Frame Locators](/challenges/pw-frame-locators)
8. [List & Items](/challenges/pw-list-items)

---

## Next Steps

Continue with [Playwright Assertions](/tutorials/playwright-assertions) to validate your test expectations.
