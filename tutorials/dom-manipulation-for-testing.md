# DOM Manipulation for Testing

Learn to find and interact with DOM elements for test automation.

## Why DOM Understanding Matters

As a test automation engineer, you'll constantly:

- **Find elements** to interact with
- **Read element properties** for assertions
- **Check element states** (visible, enabled, checked)
- **Navigate the DOM** to find related elements

---

## Finding Elements

### querySelector - Get One Element

```javascript
// By ID
document.querySelector('#login-btn');

// By class
document.querySelector('.submit-button');

// By attribute
document.querySelector('[data-testid="login"]');

// Complex selector
document.querySelector('form input[type="email"]');
```

### querySelectorAll - Get All Elements

```javascript
const buttons = document.querySelectorAll('button');
console.log(buttons.length);  // Count
console.log(buttons[0]);      // First button
```

> **Pro Tip**: `querySelectorAll` returns a NodeList. Use `[...nodeList]` to convert to an array for methods like `.filter()`.

---

## Reading Element Properties

### Text Content

```javascript
const heading = document.querySelector('h1');
heading.textContent;  // All text inside
heading.innerText;    // Visible text only
```

### Input Values

```javascript
const input = document.querySelector('#email');
input.value;  // Current value
```

### Attributes

```javascript
const link = document.querySelector('a');
link.getAttribute('href');    // "/about"
link.hasAttribute('target');  // true/false
```

---

## Checking Element State

### Form Element States

```javascript
const button = document.querySelector('button');
const checkbox = document.querySelector('#terms');

button.disabled;    // Is button disabled?
checkbox.checked;   // Is checkbox checked?
input.required;     // Is input required?
```

### Visibility

```javascript
const element = document.querySelector('.modal');
element.hidden;  // Has hidden attribute?

// Check computed styles
const style = window.getComputedStyle(element);
style.display;     // "none" or "block"
style.visibility;  // "hidden" or "visible"
```

---

## DOM Navigation

### Parent/Child

```javascript
const button = document.querySelector('button');

button.parentElement;      // Direct parent
button.closest('.card');   // Nearest ancestor with class

const list = document.querySelector('ul');
list.children;             // All child elements
list.firstElementChild;    // First child
list.lastElementChild;     // Last child
```

### Siblings

```javascript
const item = document.querySelector('.active');
item.nextElementSibling;       // Next sibling
item.previousElementSibling;   // Previous sibling
```

---

## Modifying Elements

### Setting Values

```javascript
// Text inputs
document.querySelector('#email').value = 'test@example.com';

// Checkboxes
document.querySelector('#terms').checked = true;

// Text content
document.querySelector('h1').textContent = 'New Title';
```

### Triggering Events

```javascript
const button = document.querySelector('#submit');
button.click();  // Simulate click

// Custom event
button.dispatchEvent(new Event('click'));
```

---

## Practical Patterns

### Check If Element Exists

```javascript
const modal = document.querySelector('.modal');
if (modal) {
    console.log('Modal is in the DOM');
}
```

### Count Elements

```javascript
const items = document.querySelectorAll('.list-item');
if (items.length === 5) {
    console.log('Correct number of items');
}
```

### Extract Table Data

```javascript
const tbody = document.querySelector('tbody');
const data = [];

for (const row of tbody.rows) {
    data.push({
        name: row.cells[0].textContent,
        price: row.cells[1].textContent
    });
}
```

---

## Quick Reference

| Task | Code |
|------|------|
| Find by ID | `querySelector('#id')` |
| Find by class | `querySelector('.class')` |
| Find all | `querySelectorAll('.class')` |
| Get text | `.textContent` |
| Get input value | `.value` |
| Check if checked | `.checked` |
| Check if disabled | `.disabled` |
| Get parent | `.parentElement` |
| Get children | `.children` |
| Click element | `.click()` |

---

## Practice Challenges

Continue your learning with these challenges:

1. [querySelector vs querySelectorAll](/challenges/dom-queryselector-vs-all)
2. [Get Element Properties](/challenges/dom-element-properties)
3. [Check Element State](/challenges/dom-check-element-state)
4. [Parent/Child Navigation](/challenges/dom-parent-child-navigation)
5. [Form Interaction](/challenges/dom-form-interaction)
6. [Table Data Extraction](/challenges/dom-table-data-extraction)

---

## Next Steps

- Complete all DOM challenges to solidify your understanding
- Learn about [Async/Await Basics](/tutorials/async-await-basics) (coming soon)
- Start building real test automation with Playwright
