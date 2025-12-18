# Playwright Navigation & Actions

Master page navigation and user interactions with Playwright.

---

## Page Navigation

```javascript
// Navigate to URL
await page.goto('https://example.com');
await page.goto('/login');  // Relative path

// Get page info
const url = page.url();
const title = await page.title();

// Navigation options
await page.goto('/page', { 
    waitUntil: 'networkidle',
    timeout: 30000
});
```

---

## Click Actions

```javascript
// Basic click
await page.click('#submit-btn');
await page.locator('.menu-item').click();

// Click variations
await page.dblclick('#item');                    // Double-click
await page.click('#menu', { button: 'right' });  // Right-click
await page.click('#link', { force: true });      // Force click
await page.click('#btn', { clickCount: 3 });     // Triple-click
```

---

## Form Inputs

### Fill vs Type

```javascript
// fill() - Replaces entire value (fast)
await page.fill('#email', 'test@example.com');

// type() - Types character by character
await page.type('#search', 'hello', { delay: 100 });

// Clear and fill
await page.locator('#input').clear();
await page.locator('#input').fill('new value');

// Get value
const value = await page.locator('#input').inputValue();
```

### Dropdowns

```javascript
// By value
await page.selectOption('#country', 'usa');

// By label
await page.selectOption('#size', { label: 'Large' });

// Multiple selection
await page.selectOption('#colors', ['red', 'blue']);
```

### Checkboxes & Radio

```javascript
await page.check('#agree');
await page.uncheck('#newsletter');

const isChecked = await page.isChecked('#terms');
```

---

## Keyboard Actions

```javascript
// Press single key
await page.press('#input', 'Enter');
await page.press('body', 'Escape');

// Key combinations
await page.press('#editor', 'Control+a');
await page.press('#editor', 'Control+c');

// Type with delay
await page.type('#search', 'text', { delay: 50 });
```

---

## Mouse Actions

```javascript
// Hover
await page.hover('#menu-item');
await page.locator('.dropdown').hover();

// Focus/Blur
await page.focus('#email');
await page.locator('#input').blur();

// Drag and Drop
await page.locator('#source').dragTo(page.locator('#target'));
```

---

## File Upload

```javascript
// Single file
await page.setInputFiles('#upload', 'path/to/file.pdf');

// Multiple files
await page.setInputFiles('#upload', ['file1.jpg', 'file2.jpg']);

// Clear files
await page.setInputFiles('#upload', []);
```

---

## Working with iFrames

```javascript
// Access iframe content
const frame = page.frameLocator('#embed');
await frame.locator('button').click();

// By name or URL
const frame = page.frame({ name: 'my-frame' });
const frame = page.frame({ url: /embed/ });
```

---

## Quick Reference

| Action | Code |
|--------|------|
| Navigate | `page.goto('/path')` |
| Click | `page.click('#btn')` |
| Fill input | `page.fill('#input', 'text')` |
| Select option | `page.selectOption('#sel', 'val')` |
| Check box | `page.check('#cb')` |
| Press key | `page.press('#el', 'Enter')` |
| Hover | `page.hover('#el')` |
| Upload | `page.setInputFiles('#f', 'file')` |
| Drag/Drop | `locator.dragTo(target)` |
| iFrame | `page.frameLocator('#frame')` |

---

## Practice Challenges

1. [Page Navigation](/challenges/pw-page-navigation)
2. [Click Actions](/challenges/pw-click-actions)
3. [Fill & Type](/challenges/pw-fill-type)
4. [Select Dropdowns](/challenges/pw-select-dropdowns)
5. [Checkbox & Radio](/challenges/pw-checkbox-radio)
6. [Keyboard Actions](/challenges/pw-keyboard-actions)
7. [Hover & Focus](/challenges/pw-hover-focus)
8. [File Upload](/challenges/pw-file-upload)
9. [Drag & Drop](/challenges/pw-drag-drop)
10. [Working with iFrames](/challenges/pw-iframes)

---

## Next Steps

Continue with [Playwright Locators](/tutorials/playwright-locators) to master advanced element selection.
