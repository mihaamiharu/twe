# Challenge Progression: Manual QA → QA Automation Engineer

**Created:** December 16, 2025  
**Purpose:** Define the learning path and challenge progression for QA professionals transitioning from manual testing to automation engineering.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BASIC          → BEGINNER      → INTERMEDIATE   → EXPERT              │
│  (Selectors)      (JS + DOM)      (Playwright)     (Real-World)        │
├─────────────────────────────────────────────────────────────────────────┤
│  CSS Selectors    JS Basics       Basic Actions    Page Object Model   │
│  XPath            DOM Traversal   Assertions       Data-Driven Tests   │
│  DevTools         Variables       Page Navigation  Advanced Patterns   │
│  Locator Logic    Functions       Wait Strategies  CI/CD Integration   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 TIER 1: BASIC (CSS & XPath Selectors)

> **Goal:** Build the foundation that ALL automation relies on - finding elements

### 1.1 CSS Selector Challenges

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Selector 101: ID & Class** | Select element by ID and class | 10 | basic |
| 2 | **Tag Selectors** | Select all buttons, inputs, links | 10 | basic |
| 3 | **Child & Descendant** | `div > p` vs `div p` - understand the difference | 15 | basic |
| 4 | **Attribute Selectors** | `[type="text"]`, `[data-testid="login"]` | 20 | basic |
| 5 | **Nth-child Magic** | Select 2nd item, last item, odd/even items | 25 | basic |
| 6 | **Sibling Selectors** | `+` and `~` adjacent/general sibling | 25 | basic |
| 7 | **Pseudo-classes** | `:hover`, `:focus`, `:disabled`, `:checked` | 30 | basic |
| 8 | **Combining Selectors** | Chain multiple conditions together | 35 | basic |
| 9 | **Real Form Challenge** | Select specific elements in a complex form | 40 | basic |
| 10 | **Dynamic Elements** | Handle elements without stable IDs | 50 | basic |

### 1.2 XPath Challenges

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **XPath Basics** | `//div`, `/html/body` - absolute vs relative | 10 | basic |
| 2 | **Attribute Matching** | `//input[@type='text']` | 15 | basic |
| 3 | **Text Content** | `//button[text()='Submit']` | 20 | basic |
| 4 | **Contains & Starts-with** | `//div[contains(@class, 'card')]` | 25 | basic |
| 5 | **Parent/Ancestor** | Navigate UP the DOM tree | 30 | basic |
| 6 | **Following-sibling** | Find elements relative to others | 35 | basic |
| 7 | **Multiple Conditions** | `and`, `or` operators | 35 | basic |
| 8 | **Position & Indexing** | `[1]`, `[last()]`, `[position()>2]` | 40 | basic |
| 9 | **Normalize-space** | Handle whitespace issues | 45 | basic |
| 10 | **Complex XPath** | Real-world table/dropdown navigation | 50 | basic |

### 1.3 CSS vs XPath Comparison Challenges

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Same Element, Two Ways** | Write both CSS and XPath for given element | 30 | basic |
| 2 | **When XPath Wins** | Scenarios where CSS can't do it | 35 | basic |
| 3 | **The Faster Selector** | Understand performance implications | 40 | basic |

---

## 🔵 TIER 2: BEGINNER (JavaScript & DOM)

> **Goal:** Learn the programming basics needed for automation

### 2.1 JavaScript Fundamentals

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Variables & Types** | `let`, `const`, strings, numbers, booleans | 15 | beginner |
| 2 | **Arrays for Test Data** | Create and manipulate test data arrays | 20 | beginner |
| 3 | **Objects for Tests** | Test case objects with properties | 25 | beginner |
| 4 | **If-Else Logic** | Conditional test flows | 25 | beginner |
| 5 | **Loops in Testing** | Iterate over test data | 30 | beginner |
| 6 | **Functions Basics** | Create reusable test helpers | 35 | beginner |
| 7 | **Arrow Functions** | Modern syntax for callbacks | 35 | beginner |
| 8 | **Array Methods** | `map`, `filter`, `find` for test data | 40 | beginner |
| 9 | **String Methods** | `includes`, `trim`, `split` for assertions | 40 | beginner |
| 10 | **Destructuring** | Clean test data extraction | 45 | beginner |

### 2.2 DOM Understanding

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **querySelector vs All** | Single vs multiple element selection | 20 | beginner |
| 2 | **Get Element Properties** | `textContent`, `value`, `getAttribute` | 25 | beginner |
| 3 | **Check Element State** | `disabled`, `checked`, `hidden` | 30 | beginner |
| 4 | **Parent/Child Navigation** | DOM traversal with JavaScript | 35 | beginner |
| 5 | **Event Listeners** | Understanding click, input events | 40 | beginner |
| 6 | **Form Interaction** | Get/set form values | 45 | beginner |
| 7 | **Table Data Extraction** | Get data from HTML tables | 50 | beginner |
| 8 | **Wait for Element** | Check if element exists/visible | 55 | beginner |

### 2.3 Async/Await Basics

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Understanding Promises** | Why async matters in testing | 30 | beginner |
| 2 | **Async Functions** | `async function` syntax | 35 | beginner |
| 3 | **Await Basics** | Wait for operations | 40 | beginner |
| 4 | **Sequential Actions** | Multiple awaits in order | 45 | beginner |
| 5 | **Try-Catch in Tests** | Handle expected failures | 50 | beginner |

---

## 🟡 TIER 3: INTERMEDIATE (Playwright Basics)

> **Goal:** Apply selectors + JS knowledge to real automation

### 3.1 Playwright Navigation & Actions

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Page Navigation** | `goto`, `url`, `title` | 40 | intermediate |
| 2 | **Click Actions** | Different click scenarios | 45 | intermediate |
| 3 | **Fill & Type** | Input text into fields | 50 | intermediate |
| 4 | **Select Dropdowns** | `selectOption` variations | 55 | intermediate |
| 5 | **Checkbox & Radio** | Toggle and verify state | 55 | intermediate |
| 6 | **Keyboard Actions** | `press`, `type` with modifiers | 60 | intermediate |
| 7 | **Hover & Focus** | Mouse and focus actions | 60 | intermediate |
| 8 | **File Upload** | `setInputFiles` | 70 | intermediate |
| 9 | **Drag & Drop** | Complex interactions | 80 | intermediate |
| 10 | **iFrames** | Working with embedded content | 85 | intermediate |

### 3.2 Playwright Locators (Advanced)

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **getByRole** | Accessibility-first locators | 50 | intermediate |
| 2 | **getByText** | Text-based selection | 50 | intermediate |
| 3 | **getByLabel** | Form accessibility | 55 | intermediate |
| 4 | **getByPlaceholder** | Input placeholders | 55 | intermediate |
| 5 | **getByTestId** | Custom test attributes | 60 | intermediate |
| 6 | **Locator Chaining** | `.filter()`, `.first()`, `.nth()` | 70 | intermediate |
| 7 | **Frame Locators** | Handle iframes | 80 | intermediate |
| 8 | **List/Items** | Multiple elements handling | 75 | intermediate |

### 3.3 Assertions

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **toBeVisible/toBeHidden** | Visibility assertions | 45 | intermediate |
| 2 | **toHaveText** | Text content validation | 50 | intermediate |
| 3 | **toHaveValue** | Input value checks | 50 | intermediate |
| 4 | **toBeChecked/toBeDisabled** | State assertions | 55 | intermediate |
| 5 | **toHaveAttribute** | Attribute verification | 60 | intermediate |
| 6 | **toHaveCount** | Multiple elements | 65 | intermediate |
| 7 | **toHaveURL/toHaveTitle** | Page-level assertions | 60 | intermediate |
| 8 | **Soft Assertions** | Continue on failure | 70 | intermediate |

### 3.4 Wait Strategies

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Auto-wait Understanding** | Playwright's built-in waits | 50 | intermediate |
| 2 | **waitForSelector** | Explicit element waits | 55 | intermediate |
| 3 | **waitForLoadState** | Page load strategies | 60 | intermediate |
| 4 | **waitForResponse** | API response waits | 75 | intermediate |
| 5 | **waitForFunction** | Custom wait conditions | 85 | intermediate |
| 6 | **Timeout Configuration** | Custom timeout handling | 70 | intermediate |

---

## 🔴 TIER 4: EXPERT (Real-World Patterns)

> **Goal:** Production-ready automation engineering

### 4.1 Page Object Model

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **First Page Object** | Basic POM structure | 80 | expert |
| 2 | **Encapsulate Actions** | Methods for user flows | 85 | expert |
| 3 | **Page Components** | Reusable UI components | 90 | expert |
| 4 | **Page Navigation** | Method chaining between pages | 95 | expert |
| 5 | **Base Page Class** | Inheritance for common actions | 100 | expert |

### 4.2 Data-Driven Testing

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **Parameterized Tests** | Same test, different data | 75 | expert |
| 2 | **Test Data from JSON** | External data files | 80 | expert |
| 3 | **CSV Test Data** | Tabular test data | 85 | expert |
| 4 | **Dynamic Data Generation** | Faker.js integration | 90 | expert |
| 5 | **Environment-Based Data** | Different data per env | 100 | expert |

### 4.3 Advanced Patterns

| # | Challenge Name | Description | XP | Difficulty |
|---|----------------|-------------|-----|------------|
| 1 | **API + UI Testing** | Hybrid test approach | 100 | expert |
| 2 | **State Setup via API** | Bypass UI for setup | 110 | expert |
| 3 | **Screenshot on Failure** | Debugging artifacts | 90 | expert |
| 4 | **Video Recording** | Test documentation | 95 | expert |
| 5 | **Retry Logic** | Flaky test handling | 100 | expert |
| 6 | **Parallel Execution** | Speed optimization | 120 | expert |
| 7 | **Cross-browser Testing** | Multiple browsers | 110 | expert |
| 8 | **Mobile Viewport** | Responsive testing | 100 | expert |

---

## Key Insights for Manual QA → Automation Transition

### What Manual QAs Already Know (Leverage This!)
1. ✅ **Test case design** - They understand what to test
2. ✅ **Bug identification** - They know what's wrong
3. ✅ **User flows** - They understand the application
4. ✅ **Edge cases** - They think about boundaries

### What They Need to Learn
1. 🆕 **Selector Strategy** - How to find elements reliably
2. 🆕 **Programming Basics** - Variables, loops, functions
3. 🆕 **Async Thinking** - Web timing issues
4. 🆕 **Debugging** - Understanding failures
5. 🆕 **Maintenance** - Keeping tests working

### Suggested "Bridge" Challenges
Specific challenges that connect manual QA experience to automation:

| Challenge | Description |
|-----------|-------------|
| **"Convert This Test Case"** | Given manual test steps, write automation |
| **"Debug This Failure"** | Analyze a failing test, identify the issue |
| **"Find the Flaky Test"** | Identify timing issues in existing code |
| **"Selector Review"** | Critique selector choices, suggest better ones |
| **"Test Data Design"** | Create comprehensive test data sets |

---

## Recommended Challenge Distribution

For a balanced learning path:

| Tier | Challenges | % of Total | Focus |
|------|------------|------------|-------|
| Basic | 25-30 | 30% | Selectors, DevTools |
| Beginner | 20-25 | 25% | JavaScript, DOM |
| Intermediate | 25-30 | 30% | Playwright Basics |
| Expert | 10-15 | 15% | Real-World Patterns |

---

## Implementation Notes

### Challenge Types by Tier

| Tier | Primary Type | Executor Needed |
|------|--------------|-----------------|
| Basic | `selector` | CSS/XPath validator |
| Beginner | `javascript` | JS executor |
| Intermediate | `playwright` | Mocked Playwright |
| Expert | `playwright` | Mocked Playwright + complex scenarios |

### Category Mapping

- `css-selectors` - CSS Selector challenges
- `xpath` - XPath challenges  
- `javascript` - JavaScript fundamentals
- `dom` - DOM understanding
- `playwright-basics` - Navigation, actions, assertions
- `playwright-advanced` - POM, data-driven, patterns
