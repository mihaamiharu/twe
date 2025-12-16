# Selector Decision Framework

A practical guide to choosing between CSS and XPath selectors for maximum effectiveness.

## The Decision Framework

Use this decision tree when writing selectors:

```
START
  ↓
Can you use getByRole/getByLabel? → YES → ✅ Use it (best option)
  ↓ NO
Does element have data-testid? → YES → ✅ Use [data-testid="..."]
  ↓ NO
Need to navigate UP the DOM? → YES → ✅ Use XPath (parent/ancestor)
  ↓ NO
Need exact text match? → YES → ✅ Use XPath (text()="...")
  ↓ NO
Simple ID or class? → YES → ✅ Use CSS (#id or .class)
  ↓ NO
Need complex text matching? → YES → ✅ Use XPath (contains, normalize-space)
  ↓ NO
Attribute matching? → 
  ↓
  Exact match? → YES → ✅ Use CSS [attr="value"]
  ↓ NO
  Partial match? → YES → Consider XPath or CSS [attr*="value"]
```

---

## CSS Advantages & Use Cases

### ✅ Use CSS When:

#### 1. Simple Selection

```css
#login-btn              /* ID */
.error-message          /* Class */
button[type="submit"]   /* Attribute */
```

**Why**: Cleaner syntax, easier to read.

#### 2. Performance Matters

```css
.product-card           /* ~10-30% faster than XPath */
#user-profile
```

**Why**: Browsers optimize CSS selector engines.

#### 3. Pseudo-classes Needed

```css
input:disabled
li:nth-child(2n)       /* Even items */
button:hover
input:checked
```

**Why**: XPath has no equivalent.

#### 4. Child/Sibling (Forward Only)

```css
ul > li                /* Direct child */
h2 + p                 /* Adjacent sibling */
h2 ~ p                 /* General sibling */
```

**Why**: CSS syntax is more concise.

#### 5. Team Preference

Most web developers know CSS better than XPath.

```css
.modal .close-btn      /* Familiar to frontend team */
```

---

## XPath Advantages & Use Cases

### ✅ Use XPath When:

#### 1. Navigating UP the DOM

```xpath
//button//ancestor::form
//input[@id="email"]//parent::div
```

**Why**: CSS cannot traverse upward. XPath's killer feature.

**Real Example**:
```html
<form id="checkout">
  <div>
    <button>Submit Order</button>
  </div>
</form>
```

Task: "Find the form containing the Submit Order button"

```xpath
✅ //button[text()="Submit Order"]//ancestor::form
❌ CSS: No way to do this!
```

#### 2. Exact Text Matching

```xpath
//button[text()="Submit"]
//a[text()="Learn More"]
```

**Why**: CSS has no text matching (`:contains()` is non-standard).

#### 3. Complex Text Operations

```xpath
//div[normalize-space(text())="Hello World"]
//span[contains(text(), "Error")]
//button[starts-with(text(), "Submit")]
```

**Why**: XPath has built-in text functions.

#### 4. Attribute Partial Matching (More Flexible)

```xpath
//input[starts-with(@id, "user-")]
//div[contains(@class, "alert")]
```

**Why**: More readable than CSS `[attr^="..."]` for complex cases.

#### 5. Following/Preceding Siblings

```xpath
//label[@for="email"]//following-sibling::input
//div[@class="error"]//preceding-sibling::label
```

**Why**: CSS only does following siblings (`~`), not preceding.

---

## Performance Benchmarks

Based on real-world testing:

| Selector Type | CSS Speed | XPath Speed | Winner |
|---------------|-----------|-------------|---------|
| Simple ID | 1ms | 1.3ms | CSS |
| Simple Class | 1ms | 1.3ms | CSS |
| Attribute | 2ms | 2.5ms | CSS |
| Text match | N/A | 3ms | XPath only |
| Parent nav | N/A | 4ms | XPath only |
| Complex combo | 5ms | 6ms | CSS |

**Takeaway**: CSS is generally 10-30% faster, but difference is negligible for most tests (<5ms).

---

## Readability Matters

### CSS Wins: Simple Cases

```css
/* ✅ Clean and readable */
#submit-btn
.error-message
input[type="email"]
```

vs

```xpath
/* ❌ Verbose */
//*[@id="submit-btn"]
//*[@class="error-message"]
//input[@type="email"]
```

### XPath Wins: Complex Logic

```xpath
/* ✅ Clear intent */
//button[text()="Submit" and contains(@class, "primary")]
```

vs

```css
/* ❌ Can't do text matching in CSS */
button.primary  /* Must assume text separately */
```

---

## Real-World Scenarios

### Scenario 1: Login Form

**Goal**: Fill email and click submit

**Best Approach**:
```typescript
// ✅ Accessibility-first (best)
await page.getByLabel('Email').fill('test@example.com');
await page.getByRole('button', { name: 'Log In' }).click();

// ✅ CSS with data attributes (good)
await page.locator('[data-testid="email-input"]').fill('test@example.com');
await page.locator('[data-testid="login-submit"]').click();
```

**Why**: Simple selectors, no need for XPath.

### Scenario 2: Nested Navigation

**Goal**: Find the section containing a specific link

```html
<section id="unknown-id">
  <nav>
    <a href="/dashboard">Dashboard</a>
  </nav>
</section>
```

**Best Approach**:
```xpath
// ✅ XPath (CSS can't go up)
//a[text()="Dashboard"]//ancestor::section
```

**Why**: Need to navigate UP from link to section.

### Scenario 3: Dynamic Table

**Goal**: Find row with specific text in second column

```html
<table>
  <tr>
    <td>John</td>
    <td>Active</td>
    <td>Edit</td>
  </tr>
</table>
```

**Best Approach**:
```xpath
// ✅ XPath with text matching
//tr[td[2][text()="Active"]]//td[3]//button
```

**Why**: Need text matching + position logic.

### Scenario 4: Error Validation

**Goal**: Check if error appears near specific input

```html
<div>
  <input id="email" />
  <span class="error">Invalid email</span>
</div>
```

**Best Approach**:
```xpath
// ✅ XPath (check sibling)
//input[@id="email"]//following-sibling::span[@class="error"]
```

or

```css
/* ✅ CSS (if error always follows input) */
#email ~ .error
```

**Why**: Both work, choose based on team preference.

---

## Team Standards

### Establish Guidelines

Create a team selector style guide:

```markdown
## Our Selector Standards

1. **Always prefer**: getByRole, getByLabel (Playwright/Testing Library)
2. **Second choice**: data-testid attributes
3. **CSS for**: Simple ID/class selection
4. **XPath for**: Text matching, upward navigation
5. **Avoid**: nth-child, generated IDs, styling classes
```

### Code Review Checklist

- [ ] Uses most readable selector for the task?
- [ ] Follows team standards?
- [ ] Includes comment if selector is complex?
- [ ] No hard-coded positions (nth-child)?

---

## Quick Reference Chart

| Need | CSS | XPath | Winner |
|------|-----|-------|--------|
| ID | `#id` | `//*[@id="id"]` | CSS |
| Class | `.class` | `//*[@class="class"]` | CSS |
| Attribute | `[attr="val"]` | `//*[@attr="val"]` | CSS |
| Text exact | ❌ | `//tag[text()="exact"]` | XPath |
| Text contains | ❌ | `//tag[contains(text(), "part")]` | XPath |
| Parent | ❌ | `//child//parent::tag` | XPath |
| Ancestor | ❌ | `//child//ancestor::tag` | XPath |
| Following sib | `prev ~ next` | `//prev//following-sibling::next` | CSS |
| Preceding sib | ❌ | `//next//preceding-sibling::prev` | XPath |
| Nth child | `:nth-child(n)` | `//tag[n]` | CSS |
| Disabled | `:disabled` | ❌ | CSS |
| Checked | `:checked` | ❌ | CSS |

---

## Decision Examples

### Example 1

**Task**: Click submit button

**Options**:
```typescript
// 🥇 Best - accessibility
await page.getByRole('button', { name: 'Submit' }).click();

// 🥈 Good - data attribute  
await page.locator('[data-testid="submit"]').click();

// 🥉 OK - CSS ID
await page.locator('#submit-btn').click();

// 👎 Avoid - brittle
await page.locator('form > div > button.btn-primary').click();
```

### Example 2

**Task**: Verify error message contains "invalid"

**Options**:
```typescript
// 🥇 Best - XPath text matching
await expect(page.locator('//span[contains(text(), "invalid")]')).toBeVisible();

// 👎 Can't do in pure CSS
// Would need to get text separately
```

### Example 3

**Task**: Find parent form of an input

**Options**:
```typescript
// 🥇 Only option - XPath
await page.locator('//input[@id="email"]//ancestor::form');

// ❌ Impossible in CSS
```

---

## Practice Challenges

Apply the framework to real scenarios:

1. [Same Element, Two Ways](/challenges/same-element-two-ways) - Practice both CSS and XPath
2. [When XPath Wins](/challenges/when-xpath-wins) - XPath-only scenarios
3. [The Faster Selector](/challenges/faster-selector) - Optimize performance

---

## Final Recommendation

**Default Stack**:
1. **First**: Playwright's semantic selectors (`getByRole`, `getByLabel`)
2. **Second**: `data-testid` attributes with CSS
3. **CSS for**: Simple selections (ID, class, attribute)
4. **XPath for**: Upward navigation, text matching, complex logic

**This gives you:**
- Most readable tests (semantic selectors)
- Good performance (CSS when possible)
- Full power when needed (XPath for complex cases)

---

## Next Steps

- Deep dive into [CSS Selectors for QA Engineers](/tutorials/css-selectors-for-qa)
- Master [XPath for Test Automation](/tutorials/xpath-for-test-automation)
- Apply lessons in [Building Robust Test Selectors](/tutorials/building-robust-test-selectors)
