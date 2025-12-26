# XPath for Test Automation

Master XPath selectors to unlock powerful DOM navigation capabilities that CSS cannot provide.

## The Mental Model: The File System

Think of the DOM as your computer's **File System**.

* `/` is the Root (Effectively `C:\` or `/`).
* A `div` is a Folder.
* An `input` is a File.

**CSS** is like a "Quick Search" (Spotlight/Windows Search) – it finds files by name or tag regardless of where they are.
**XPath** is like the Terminal/Command Line – it gives you precise control to navigate the path, go up directories (`../`), and filter by complex metadata.

---

## The Strategy: The Sniper Approach

XPath is powerful but verbose and often slower than CSS.
**Strategy**: Use CSS as your machine gun (default choice), and XPath as your sniper rifle (specialized use cases).

### When to use the Sniper (XPath)

1. **Navigating UP**: You found a "Delete" button and need to find the specific `row` it belongs to. CSS cannot go up (yet).
    * `//button[text()="Delete"]/ancestor::tr`
2. **Matching Text**: You need to find a button specifically labeled "Submit".
    * `//button[text()="Submit"]`
3. **Complex Logic**: You need an element that resembles "X" OR "Y" but NOT "Z".

---

## The Toolset: Essential XPath Capabilities

### 1. The Basics

* **Root**: `/html/body` (Absolute path - AVOID this!)
* **Anywhere**: `//input` (Relative path - USE this!)
* **Predicates**: `//button[@type="submit"]` (Conditions in brackets `[]`)

### 2. The Superpowers (Axes)

This is why we use XPath. We can move in any direction.

* **Parent**: `/..` or `/parent::div`
  * `//span[@id="error"]/..` (Go up one level)
* **Ancestor**: `/ancestor::form`
  * `//button/ancestor::div[@class="modal"]` (Go up until you hit the modal)
* **Following Sibling**: `/following-sibling::input`
  * `//label[text()="Email"]/following-sibling::input` (Find the input next to the label)

### 3. Text Matching

* **Exact Match**: `text()="Value"`
  * `//button[text()="Save"]` (Case sensitive!)
* **Contains**: `contains(text(), "Value")`
  * `//div[contains(text(), "Success")]`
* **Normalize Space**: `normalize-space()="Value"`
  * `//h1[normalize-space()="Welcome Back"]` (Ignores hidden newlines/spaces)

---

## The Traps

### Trap #1: The Brittle Chain (Absolute Paths)

**Scenario**: Copying XPath from Chrome DevTools.
**The Code**: `/html/body/div[2]/div/div[3]/form/button`
**The Problem**: If *anything* changes in the structure (e.g., a wrapper div is added), this path breaks.
**Fix**: Use a relative path with a unique attribute: `//form[@id="login"]//button`.

### Trap #2: The Text Trap

**Scenario**: `//button[text()=" Submit "]`
**The Problem**: Whitespace! If the HTML is formatted like:

```html
<button>
  Submit
</button>
```

The text actually contains newlines and spaces.
**The Fix**: Always use `normalize-space()` for robustness: `//button[normalize-space()="Submit"]`.

### Trap #3: The Performance Tax

**Scenario**: `//*[contains(text(), "Login")]`
**The Problem**: Starting with `//*` forces the browser to scan *every single element* in the DOM. On large pages, this is slow.
**The Fix**: Be specific. `//a[contains(text(), "Login")]` scans only links.

---

## Challenge: Refactor This Selector

**Bad Selector**:

```xpath
/html/body/div[1]/main/div/table/tbody/tr[2]/td[5]/button
```

**The DOM**:

```html
<table id="users">
  <tr data-user-id="101">
    <td>John Doe</td>
    <!-- ... -->
    <td><button>Delete</button></td>
  </tr>
</table>
```

**Better Selector**:

```xpath
//tr[@data-user-id="101"]//button[text()="Delete"]
```

---

## Ready to Practice?

Test your new mental model with these challenges:

1. [XPath Basics](/challenges/xpath-basics) - Directories and Files.
2. [Text Content](/challenges/xpath-text-content) - The Sniper Scope.
3. [Parent/Ancestor](/challenges/xpath-parent-ancestor) - Climbing the Tree.
