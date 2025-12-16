# XPath for Test Automation

Master XPath selectors to unlock powerful DOM navigation capabilities that CSS can't provide.

## XPath Basics: // vs /

XPath provides two fundamental path types:

### Absolute Path (/)

Starts from document root. Exact path to element.

```xpath
/html/body/div/form/button
```

**Pros:** Very specific  
**Cons:** Extremely brittle - breaks if DOM structure changes

### Relative Path (//)

Searches from anywhere in the document.

```xpath
//button[@type="submit"]
//form//input
```

**Pros:** Flexible and robust  
**Cons:** Can match multiple elements

> **Best Practice**: Use relative paths (`//`) almost always. Absolute paths break too easily.

---

## Axes for Navigation

XPath axes let you navigate relationships in the DOM that CSS cannot reach.

### Parent Axis

Navigate UP to parent element.

```xpath
//input[@id="email"]//parent::div
//button//parent::form
```

**Use Case**: Find the form containing a specific button.

### Ancestor Axis

Navigate UP to any ancestor.

```xpath
//button//ancestor::form
//input//ancestor::div[@class="container"]
```

**CSS Equivalent**: None! This is XPath's superpower.

### Following-sibling Axis

Navigate to siblings that come AFTER.

```xpath
//label[@for="email"]//following-sibling::input
//h2//following-sibling::p[1]
```

### Preceding-sibling Axis

Navigate to siblings that come BEFORE.

```xpath
//input//preceding-sibling::label
```

### Child Axis

Direct children only.

```xpath
//ul/child::li
//form/child::div
```

### Descendant Axis

All children at any level.

```xpath
//form//descendant::input
```

---

## Powerful XPath Functions

### contains()

Match partial text or attribute values.

```xpath
//button[contains(text(), "Submit")]
//div[contains(@class, "error")]
//a[contains(@href, "login")]
```

**Real-world Example**:
```html
<button class="btn btn-primary btn-large">Submit Form</button>
```

```xpath
//button[contains(@class, "btn-primary")]  /* ✅ Works */
//button[@class="btn-primary"]              /* ❌ Fails - not exact match */
```

### starts-with()

Match elements starting with specific text.

```xpath
//input[starts-with(@id, "user")]
//div[starts-with(@class, "alert")]
```

**Use Case**: Dynamic IDs with prefixes.

```html
<input id="user-12345" />
<input id="user-67890" />
```

```xpath
//input[starts-with(@id, "user")]  /* Matches both */
```

### text()

Match by exact text content.

```xpath
//button[text()="Submit"]
//a[text()="Learn More"]
//span[text()="Error"]
```

**Case Sensitive!**
```xpath
//button[text()="Submit"]   /* ✅ Matches "Submit" */
//button[text()="submit"]   /* ❌ No match */
```

### normalize-space()

Remove leading/trailing whitespace and collapse multiple spaces.

```xpath
//button[normalize-space(text())="Submit"]
//span[normalize-space()="Error Message"]
```

**Critical for reliability**:
```html
<button>
  
  Submit  
  
</button>
```

```xpath
//button[text()="Submit"]                        /* ❌ Fails */
//button[normalize-space(text())="Submit"]       /* ✅ Works */
```

---

## Predicates and Filtering

### Attribute Predicates

```xpath
//input[@type="text"]
//button[@id="submit"]
//div[@data-testid="modal"]
```

### Position-based Predicates

```xpath
//li[1]              /* First li */
//li[last()]         /* Last li */
//li[position()=2]   /* Second li */
```

**Warning**: XPath is 1-indexed, not 0-indexed!

### Multiple Conditions with AND

```xpath
//input[@type="text" and @required]
//button[@type="submit" and contains(@class, "primary")]
//div[@class="modal" and @aria-hidden="false"]
```

### Multiple Conditions with OR

```xpath
//input[@type="text" or @type="email"]
//button[text()="Submit" or text()="Save"]
```

---

## Complex Expressions

### Combining Functions and Predicates

```xpath
/* Button with partial class AND containing text */
//button[contains(@class, "btn") and contains(text(), "Submit")]

/* Input that starts with ID and is required */
//input[starts-with(@id, "user") and @required]

/* First div containing specific text */
//div[contains(text(), "Error")][1]
```

### Navigating

 with Axes in Predicates

```xpath
/* Input whose parent div has error class */
//input[parent::div[contains(@class, "error")]]

/* Button whose ancestor form has specific ID */
//button[ancestor::form[@id="login-form"]]

/* Label followed by required input */
//label[following-sibling::input[@required]]
```

---

## XPath vs CSS: Decision Guide

### Use XPath When:

✅ **Navigating UP the DOM**
```xpath
//button//ancestor::form  /* Find form containing button */
```

✅ **Selecting by exact text**
```xpath
//button[text()="Submit"]
```

✅ **Complex text matching**
```xpath
//div[normalize-space(text())="Error Message"]
```

✅ **Sibling relationships**
```xpath
//label//following-sibling::input
```

### Use CSS When:

✅ **Simple class/ID selection**
```css
#submit-btn
.error-message
```

✅ **Better performance needed**
- CSS is generally 10-30% faster

✅ **Team prefers CSS syntax**
- More familiar to web developers

✅ **Pseudo-classes**
```css
input:disabled
li:nth-child(2n)
```

---

## Performance Considerations

### Slow XPath

```xpath
//*                                    /* Searches EVERYTHING */
//div//div//div//button                /* Too many levels */
//*[contains(@class, "btn")]           /* Wildcard match all */
```

### Fast XPath

```xpath
//button[@type="submit"]               /* Specific tag */
//form[@id="login"]//input             /* Scoped search */
//*[@data-testid="submit"]             /* Direct attribute */
```

**Pro Tip**: Start with specific tag names, not `//*`.

---

## Common Patterns

### Find by Partial Class

```xpath
//div[contains(concat(" ", @class, " "), " target-class ")]
```

### Find by Attribute Exists

```xpath
//input[@disabled]
//button[@aria-label]
```

### Find by Multiple Attributes

```xpath
//input[@type="email"][@name="user_email"]
```

### Find Nth Element

```xpath
(//div[@class="item"])[3]  /* Third .item div */
```

### Find by Text in Child

```xpath
//div[.//span[text()="Active"]]
```

---

## Debugging XPath

### Test in Browser Console

```javascript
$x("//button[text()='Submit']")         // Returns array
$x("//button[text()='Submit']")[0]       // First match
```

### Chrome DevTools

1. Open Elements tab
2. Press `Ctrl+F` (or `Cmd+F` on Mac)
3. Type your XPath expression
4. See matches highlighted

---

## Quick Reference

| Pattern | Example | Use Case |
|---------|---------|----------|
| By tag | `//button` | Find buttons |
| By attribute | `//input[@type="text"]` | Find text inputs |
| By text | `//a[text()="Login"]` | Find link by text |
| Contains text | `//div[contains(text(), "Error")]` | Partial text match |
| Parent | `//input//parent::form` | Find parent form |
| Ancestor | `//button//ancestor::div[@class="modal"]` | Find modal  ancestor |
| Following sibling | `//label//following-sibling::input` | Input after label |
| AND condition | `//input[@type="text" and @required]` | Multiple conditions |
| Position | `//li[1]` | First item |
| Normalize space | `//button[normalize-space()="Submit"]` | Trim whitespace |

---

## Practice Challenges

Ready to test your XPath skills? Try these challenges:

1. [XPath Basics](/challenges/xpath-basics)
2. [Attribute Matching](/challenges/xpath-attribute-matching)
3. [Text Content](/challenges/xpath-text-content)
4. [Contains & Starts-with](/challenges/xpath-contains-starts-with)
5. [Parent/Ancestor](/challenges/xpath-parent-ancestor)
6. [Following-sibling](/challenges/xpath-following-sibling)
7. [Normalize-space](/challenges/xpath-normalize-space)

---

## Next Steps

- Compare with [CSS Selectors for QA Engineers](/tutorials/css-selectors-for-qa)
- Learn [Building Robust Test Selectors](/tutorials/building-robust-test-selectors)
- Master [Selector Decision Framework](/tutorials/selector-decision-framework)
