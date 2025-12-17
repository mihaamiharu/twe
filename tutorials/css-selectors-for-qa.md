# CSS Selectors for QA Engineers

Master the art of writing robust, maintainable CSS selectors for test automation.

## Why Selectors Matter in QA

In test automation, selectors are your primary way to interact with web elements. A good selector is:
- **Stable** - Doesn't break when UI changes
- **Readable** - Team members understand it instantly  
- **Fast** - Performs well even with complex DOM
- **Maintainable** - Easy to update when needed

> **Pro Tip**: Spend time crafting good selectors upfront. It saves hours of debugging later.

---

## Basic Selectors Deep Dive

### ID Selectors

The most specific selector. Use for unique elements.

```css
#login-btn
#user-email
#submit-form
```

**When to use:**
- Element has a stable, unique ID
- ID won't change between deployments
- Need maximum specificity

**Anti-pattern:**
```css
#btn-v2-new-2023  /* ❌ Version in ID = brittle */
```

### Class Selectors

Target elements by class name. Can match multiple elements.

```css
.button
.error-message
.form-field
```

**When to use:**
- Styling classes that won't change
- Multiple elements share the class
- Less specific than ID

**Pro pattern:**
```css
.alert.alert-danger  /* ✅ Combine classes for specificity */
```

### Tag Selectors

Select by HTML element type.

```css
button
input
div
```

**When to use:**
- Generic element selection
- Combined with other selectors
- Testing semantic HTML

---

## Combinators for Relationships

Combinators let you select elements based on their relationship to others.

### Descendant (space)

Select all descendants at any level.

```css
form input        /* All inputs inside form */
.container button /* All buttons inside .container */
```

### Child (>)

Select direct children only.

```css
ul > li           /* Direct li children of ul */
.menu > .item     /* Direct .item children of .menu */
```

**Comparison:**

```html
<div class="parent">
  <span>Child</span>
  <div>
    <span>Grandchild</span>
  </div>
</div>
```

```css
.parent span      /* Matches BOTH spans */
.parent > span    /* Matches ONLY "Child" */
```

### Adjacent Sibling (+)

Select the immediate next sibling.

```css
label + input     /* Input right after label */
h2 + p            /* First paragraph after h2 */
```

### General Sibling (~)

Select all following siblings.

```css
h2 ~ p            /* All paragraphs after h2 */
.error ~ input    /* All inputs after .error */
```

---

## Attribute Selectors for Flexibility

### Exact Match

```css
[type="text"]           /* Input with type="text" */
[data-testid="login"]   /* Element with data-testid */
```

### Starts With (^=)

```css
[id^="user"]            /* ID starts with "user" */
[class^="btn"]          /* Class starts with "btn" */
```

### Ends With ($=)

```css
[href$=".pdf"]          /* Links ending in .pdf */
[src$=".jpg"]           /* Images ending in .jpg */
```

### Contains (*=)

```css
[class*="button"]       /* Class contains "button" */
[href*="login"]         /* URL contains "login" */
```

### Use Case Example

```html
<button data-test="submit-form-btn">Submit</button>
<button data-test="cancel-form-btn">Cancel</button>
```

```css
[data-test^="submit"]   /* Selects Submit button */
[data-test*="form"]     /* Selects both buttons */
```

---

## Pseudo-classes for State

### Interactive States

```css
button:hover          /* Button being hovered */
input:focus           /* Input with focus */
a:active              /* Link being clicked */
```

### Form States

```css
input:disabled        /* Disabled input */
input:checked         /* Checked checkbox/radio */
input:required        /* Required field */
option:selected       /* Selected option */
```

### Position-based

```css
li:first-child        /* First li */
li:last-child         /* Last li */
li:nth-child(2)       /* Second li */
li:nth-child(odd)     /* Odd li elements */
```

### Testing Example

```css
/* Test that first error displays */
.error-list li:first-child

/* Test that submit button is disabled */
button[type="submit"]:disabled

/* Test checked checkboxes */
input[type="checkbox"]:checked
```

---

## Best Practices for Test Automation

### 1. Use Data Attributes

Dedicated test attributes separate concerns.

```html
<button data-testid="submit-btn" class="btn-primary">
  Submit
</button>
```

```css
[data-testid="submit-btn"]  /* ✅ Stable */
.btn-primary                /* ❌ Styling may change */
```

### 2. Avoid Overly Specific Selectors

```css
/* ❌ Too specific - brittle */
div.container > div:nth-child(3) > form > div > button

/* ✅ Just enough - stable */
form [data-testid="submit"]
```

### 3. Prioritize Accessibility Selectors

```css
/* ✅ Semantic and accessible */
button[aria-label="Close dialog"]
input[aria-labelledby="email-label"]
```

### 4. Combine for Precision

```css
/* Precise without being brittle */
form.login-form button[type="submit"]
.modal-dialog .close-button
```

---

## Common Pitfalls to Avoid

### ❌ Position-dependent Selectors

```css
div:nth-child(5)  /* Breaks if order changes */
```

### ❌ Generated IDs

```css
#element-12345    /* Changes on each load */
```

### ❌ Styling Classes Only

```css
.red-button       /* Class describes style, not function */
```

### ❌ Too Generic

```css
div               /* Matches too many elements */
button            /* Which button? */
```

---

## Quick Reference

| Selector | Example | Use Case |
|----------|---------|----------|
| `#id` | `#login` | Unique element |
| `.class` | `.button` | Styled groups |
| `tag` | `button` | Element type |
| `[attr]` | `[type]` | Has attribute |
| `[attr="val"]` | `[data-test="submit"]` | Exact match |
| `[attr*="val"]` | `[class*="btn"]` | Contains |
| `:hover` | `a:hover` | Interactive state |
| `:disabled` | `input:disabled` | Form state |
| `parent child` | `form input` | Descendant |
| `parent > child` | `ul > li` | Direct child |

---

## Practice Challenges

Ready to test your knowledge? Try these challenges:

1. [Selector 101: ID & Class](/challenges/selector-101-id-class)
2. [Tag Selectors](/challenges/tag-selectors)  
3. [Child & Descendant](/challenges/child-descendant)
4. [Attribute Selectors](/challenges/attribute-selectors)
5. [Pseudo-classes](/challenges/pseudo-classes)

---

## Next Steps

- Try the [XPath for Test Automation](/tutorials/xpath-for-test-automation) tutorial
- Learn [Building Robust Test Selectors](/tutorials/building-robust-test-selectors)
- Compare with [Selector Decision Framework](/tutorials/selector-decision-framework)
