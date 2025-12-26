# Selector Decision Framework

A practical guide to choosing between CSS and XPath selectors for maximum effectiveness.

## The Mental Model: The Flowchart

When inspecting an element, run this rapid decision logic in your head:

1. **Can I use a Test API?** (`data-testid`)
    * **YES**: Stop. Use it.
    * **NO**: Go to step 2.

2. **Can I use a Semantic Attribute?** (`name`, `type`, `role`, `aria-label`)
    * **YES**: Stop. Use it (CSS).
    * **NO**: Go to step 3.

3. **Do I need Superpowers?** (Text matching, Parent/Ancestor traversal)
    * **YES**: Switch to XPath immediately.
    * **NO**: Use CSS Class/ID (if stable).

---

## The Real World Case: The Hybrid Approach

**The Scenario**:
You are testing a User Management dashboard. You need to click the "Delete" button for a specific user, "John Doe".
The table has 50 rows. The "Delete" button has no unique ID.

**The Pure CSS Attempt (Failure)**:

```css
/* Brittle: Relies on John being the 3rd row */
tr:nth-child(3) .delete-btn 
```

**The Pure XPath Attempt (Verbose)**:

```xpath
//table[@class="user-table"]//tr[td[text()="John Doe"]]//button[text()="Delete"]
```

**The Hybrid Approach (Success)**:
Combine the best of both worlds. Use a high-level locator for the container, then filter.

* **Logic**: Find the row by Text ("John Doe"), then find the Button inside that row.
* **Playwright Implementation**:

    ```typescript
    await page.getByRole('row')
              .filter({ hasText: 'John Doe' })
              .getByRole('button', { name: 'Delete' })
              .click();
    ```

**The Lesson**:
Don't be a purist. Real-world applications often require mixing strategies (`Role` + `Text Filter`) to achieve robustness.

---

## The Strategy: The 3-Second Rule

When writing a selector, apply the **3-Second Rule**:

> If you have to stare at the DOM for more than 3 seconds to construct a CSS selector, **switch to XPath** (or a Text/Role selector).

**Why?**

* CSS is great for simple things: `.btn-primary`, `#login`.
* If you find yourself writing `div > div:nth-child(2) > span + input`, you have already lost. The selector is brittle and hard to read.
* XPath `//label[text()="Email"]/following-sibling::input` is verbose, but it's **readable logic**.

---

## The Traps

### Trap #1: The Purist Trap

**The Mindset**: "XPath is slow/bad. I must use CSS for everything."
**The Result**: You write crazy CSS hacks like `:not(:empty) + div` to simulate parent selection, or use brittle `nth-child` chains.
**The Fix**: Embrace XPath for what it's good at (Navigation & Text). Modern browser XPath engines are incredibly fast (often <1ms diff vs CSS).

### Trap #2: The Over-Optimization Trap

**The Mindset**: "I need the absolute fastest selector."
**The Reality**:

* Selector A (CSS): 1ms execution
* Selector B (XPath): 2ms execution
* Network Request: 500ms
* React Render: 50ms
**The Fix**: Selector performance is negligible compared to network/rendering. Optimize for **Maintenance** first, Performance second.

---

## Quick Reference

| Requirement | Preferred Tool | Example |
| :--- | :--- | :--- |
| **Unique Attribute** | CSS | `[data-testid="submit"]` |
| **Form Input** | CSS | `input[name="email"]` |
| **Exact Text** | XPath | `//button[text()="Save"]` |
| **Contains Text** | XPath | `//div[contains(text(), "Error")]` |
| **Parent/Ancestor** | XPath | `//input/ancestor::form` |
| **Sibling Preceding** | XPath | `//td/preceding-sibling::td` |
| **Fastest Readability** | CSS | `.card-header` |

---

## Ready to Practice?

Test your decision-making skills:

1. [Same Element, Two Ways](/challenges/same-element-two-ways) - Compare CSS vs XPath.
2. [When XPath Wins](/challenges/when-xpath-wins) - Scenarios where CSS fails.
3. [The Faster Selector](/challenges/faster-selector) - Does speed matter?
