# Challenge Solutions & Achievements Reference

This document provides **3 solution options** for each challenge:

1. **Correct & Compliant**: The intended best-practice solution.
2. **Correct & Non-Compliant**: Works technically, but is fragile or bad practice.
3. **Almost Correct**: Common mistakes that look right but fail.

---

## Table of Contents

1. [Achievements](#achievements)
2. [Basic Tier (CSS/XPath Selectors)](#basic-tier-cssxpath-selectors)
3. [Beginner Tier (JavaScript)](#beginner-tier-javascript)
4. [Intermediate Tier (Playwright)](#intermediate-tier-playwright)
5. [Expert Tier (Advanced Patterns)](#expert-tier-advanced-patterns)
6. [E2E Tier (Full Flows)](#e2e-tier-full-flows)

---

## Achievements

### Milestones & Challenges

| Icon | Name               | Description                   | XP   |
| ---- | ------------------ | ----------------------------- | ---- |
| 🎯   | First Steps        | Complete your first challenge | 50   |
| 📖   | Eager Learner      | Complete your first tutorial  | 25   |
| 🔥   | Getting Warmed Up  | Complete 10 challenges        | 100  |
| ⚡   | Challenge Accepted | Complete 25 challenges        | 200  |
| 🏆   | Halfway Hero       | Complete 50 challenges        | 500  |
| 👑   | Completionist      | Complete all 88 challenges    | 1000 |

### Streak Achievements

| Icon | Name              | Description   | XP  |
| ---- | ----------------- | ------------- | --- |
| 🔥   | On Fire           | 3-day streak  | 50  |
| ⚡   | Week Warrior      | 7-day streak  | 100 |
| 💪   | Two Week Champion | 14-day streak | 200 |
| 🏆   | Monthly Master    | 30-day streak | 500 |

### XP Milestones

| Icon | Name         | Description  | XP  |
| ---- | ------------ | ------------ | --- |
| ✨   | XP Starter   | Earn 100 XP  | 25  |
| 💫   | XP Hunter    | Earn 500 XP  | 50  |
| 🌟   | XP Collector | Earn 1000 XP | 100 |
| ⭐   | XP Master    | Earn 2500 XP | 200 |
| 🌠   | XP Legend    | Earn 5000 XP | 500 |

### Tier Masters

| Icon | Name                | Description                    | XP  |
| ---- | ------------------- | ------------------------------ | --- |
| 🎨   | Selector Specialist | Complete all Basic tier        | 150 |
| 💛   | JavaScript Hero     | Complete all Beginner tier     | 200 |
| 🎭   | Playwright Pro      | Complete all Intermediate tier | 300 |
| 🚀   | Automation Expert   | Complete all Advanced tier     | 400 |

### Secret Boss Achievements 🔒

| Icon | Name                | Boss Fight               | XP  |
| ---- | ------------------- | ------------------------ | --- |
| 🏗️   | JS Architect        | Test Data Generator      | 300 |
| 🕷️   | DOMinator           | Dashboard Scraper        | 300 |
| ⏳   | Async Avenger       | API Data Aggregator      | 300 |
| 🛒   | Action Hero         | E-Commerce Checkout      | 400 |
| 🎯   | Locator Legend      | Dynamic Product Grid     | 400 |
| 🔍   | Sherlock Homes      | Form Validation Suite    | 400 |
| ⚡   | Time Wizard         | Polling Dashboard        | 400 |
| ✈️   | POM Pilot           | Multi-Page POM           | 500 |
| 💾   | Data Dynamo         | Cross-Browser Data Suite | 500 |
| 🛠️   | Infrastructure Idol | Self-Healing Test Suite  | 500 |
| 🔄   | Integration Icon    | E2E Pipeline Integration | 500 |

---

## Basic Tier (CSS/XPath Selectors)

### CSS Selectors

#### css-selector-101-id-class - ID & Class Selectors

**Type 1: Correct & Compliant**

```css
#login-btn
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on generic attribute/tag combination, less stable than ID.*

```css
button[type="submit"]
```

**Type 3: Almost Correct**
*Bug: Uses dot (.) for ID instead of hash (#).*

```css
.login-btn
```

#### css-tag-selectors - Tag Name Selectors

**Type 1: Correct & Compliant**

```css
p
```

**Type 2: Correct & Non-Compliant**
*Why: Overly specific path for a generic tag request.*

```css
div.welcome-card > p
```

**Type 3: Almost Correct**
*Bug: Treating the tag name as a class.*

```css
.p
```

#### css-combining-basics - Combining Selectors

**Type 1: Correct & Compliant**

```css
div.error
```

**Type 2: Correct & Non-Compliant**
*Why: Selects all error classes, including the span (which we want to avoid).*

```css
.error
```

**Type 3: Almost Correct**
*Bug: The space creates a descendant selector (div containing error) instead of combined.*

```css
div .error
```

#### css-foundations-boss - Scenario: Legacy App Testing

**Type 1: Correct & Compliant**

```css
button.btn.primary.large
```

**Type 2: Correct & Non-Compliant**
*Why: Ignores the 'large' requirement, risking other primary buttons.*

```css
button.btn.primary
```

**Type 3: Almost Correct**
*Bug: Spaces between classes imply nesting, not combination.*

```css
button .btn .primary .large
```

#### css-child-descendant - Child vs Descendant

**Type 1: Correct & Compliant**

```css
.nav-menu > li
```

**Type 2: Correct & Non-Compliant**
*Why: Uses descendant space, selecting nested submenu items too.*

```css
.nav-menu li
```

**Type 3: Almost Correct**
*Bug: Wrong direction of bracket (invalid syntax).*

```css
.nav-menu < li
```

#### css-sibling-selectors - Sibling Selectors

**Type 1: Correct & Compliant**

```css
h1 + p
```

**Type 2: Correct & Non-Compliant**
*Why: Uses general sibling (~), which works here but isn't strictly "immediately after".*

```css
h1 ~ p
```

**Type 3: Almost Correct**
*Bug: Uses child combinator instead of sibling.*

```css
h1 > p
```

#### css-family-drill - Drill: Deep Nesting

**Type 1: Correct & Compliant**

```css
.profile-card .card-content span
```

**Type 2: Correct & Non-Compliant**
*Why: Skipping the middle content layer, less specific.*

```css
.profile-card span
```

**Type 3: Almost Correct**
*Bug: Uses direct child selectors where descendants are needed (or structure doesn't support it).*

```css
.profile-card > span
```

#### css-navigation-boss - Scenario: Nested Navigation

**Type 1: Correct & Compliant**

```css
#user-menu .dropdown-list .action-item a
```

**Type 2: Correct & Non-Compliant**
*Why: Jumping straight to link, missing safety of container context.*

```css
.action-item a
```

**Type 3: Almost Correct**
*Bug: targeting the list item instead of the link.*

```css
#user-menu .dropdown-list .action-item
```

#### css-attribute-selectors - Attribute Selectors

**Type 1: Correct & Compliant**

```css
[type="email"]
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on name attribute which is less standardized.*

```css
[name="email"]
```

**Type 3: Almost Correct**
*Bug: Missing quotes (often works but bad practice) or brackets.*

```css
type="email"
```

#### css-validation-states - Form Validation States

**Type 1: Correct & Compliant**

```css
input:invalid
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on typical error class rather than browser state.*

```css
.error
```

**Type 3: Almost Correct**
*Bug: Wrong pseudo-class name.*

```css
input:error
```

#### css-functional-pseudo - Advanced Filtering (:not & :is)

**Type 1: Correct & Compliant**

```css
.user-card.active:not(.suspended)
```

**Type 2: Correct & Non-Compliant**
*Why: Explicitly selecting 'active' without excluding 'suspended' (might catch bad actors).*

```css
.user-card.active
```

**Type 3: Almost Correct**
*Bug: Negating the wrong class.*

```css
.user-card:not(.active)
```

#### css-forms-boss - Scenario: Dynamic Forms

**Type 1: Correct & Compliant**

```css
input[type="tel"]:optional:not(:disabled)
```

**Type 2: Correct & Non-Compliant**
*Why: Missing the 'optional' check.*

```css
input[type="tel"]:not(:disabled)
```

**Type 3: Almost Correct**
*Bug: Forgetting that 'disabled' is a pseudo-class.*

```css
input[type="tel"]:optional:not([disabled])
```

#### css-nth-child - Position Indexing (Nth-Child)

**Type 1: Correct & Compliant**

```css
li:nth-child(3)
```

**Type 2: Correct & Non-Compliant**
*Why: Searching by text content (which CSS can't do, but people try).*

```css
li[text="Cloud Sync"]
```

**Type 3: Almost Correct**
*Bug: Used 0-based indexing (programming) instead of 1-based (CSS).*

```css
li:nth-child(2)
```

#### css-nth-type-vs-child - Nth-Type vs Nth-Child

**Type 1: Correct & Compliant**

```css
p:nth-of-type(2)
```

**Type 2: Correct & Non-Compliant**
*Why: Uses nth-child, which counts the image tag and fails.*

```css
p:nth-child(2)
```

**Type 3: Almost Correct**
*Bug: Syntax error.*

```css
p:nth-type(2)
```

#### css-table-drill - Table Cell Targeting

**Type 1: Correct & Compliant**

```css
tbody tr:nth-child(2) td:nth-child(3)
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on text content assumption or skips tbody.*

```css
tr:nth-child(2) td:nth-child(3)
```

**Type 3: Almost Correct**
*Bug: Swapped row and column indices.*

```css
tbody tr:nth-child(3) td:nth-child(2)
```

#### css-table-boss - Scenario: Admin Grid

**Type 1: Correct & Compliant**

```css
tr:nth-child(odd) td:last-child button
```

**Type 2: Correct & Non-Compliant**
*Why: Uses 'even' instead of 'odd'.*

```css
tr:nth-child(even) td:last-child button
```

**Type 3: Almost Correct**
*Bug: Forgetting to go into the last cell before finding the button.*

```css
tr:nth-child(odd) button
```

#### css-dynamic-elements - Handling Dynamic Elements

**Type 1: Correct & Compliant**

```css
li:nth-child(2) .del
```

**Type 2: Correct & Non-Compliant**
*Why: Trying to use the unstable ID.*

```css
#unstable-id-123
```

**Type 3: Almost Correct**
*Bug: Selecting all delete buttons.*

```css
.del
```

### XPath Selectors

#### xpath-selector-101 - XPath Basics

**Type 1: Correct & Compliant**
```xpath
//h1
```

**Type 2: Correct & Non-Compliant**
*Why: Absolute path is extremely brittle.*
```xpath
/html/body/div/h1
```

**Type 3: Almost Correct**
*Bug: Missing double slash for recursive search.*
```xpath
/h1
```

#### xpath-attributes - Attribute Selection

**Type 1: Correct & Compliant**
```xpath
//*[@id="login"]
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on structural index.*
```xpath
//div[1]
```

**Type 3: Almost Correct**
*Bug: Invalid syntax (missing @ for attribute).*
```xpath
//id="login"
```

#### xpath-text-exact - Selecting by Text

**Type 1: Correct & Compliant**
```xpath
//button[text()="Submit"]
```

**Type 2: Correct & Non-Compliant**
*Why: Selects any button, ignores the text requirement.*
```xpath
//button
```

**Type 3: Almost Correct**
*Bug: Treating text() as an attribute.*
```xpath
//button[@text="Submit"]
```

#### xpath-contains-starts-with - Partial Matches

**Type 1: Correct & Compliant**
```xpath
//div[contains(@class, "error")]
```

**Type 2: Correct & Non-Compliant**
*Why: Exact match fails if the element has multiple classes.*
```xpath
//div[@class="error"]
```

**Type 3: Almost Correct**
*Bug: Missing the attribute to check against.*
```xpath
//div[contains("error")]
```

#### xpath-fundamentals-boss - Scenario: Legacy Login

**Type 1: Correct & Compliant**
```xpath
//form[contains(@class, "login")]//button[text()="Sign In"]
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on global index.*
```xpath
(//button)[2]
```

**Type 3: Almost Correct**
*Bug: Exact class match instead of contains.*
```xpath
//form[@class="login"]//button
```

#### xpath-parent-ancestor - Parent/Ancestor

**Type 1: Correct & Compliant**
```xpath
//a[text()="Settings"]/parent::li
```

**Type 2: Correct & Non-Compliant**
*Why: Relies on index.*
```xpath
//ul/li[3]
```

**Type 3: Almost Correct**
*Bug: Missing valid axis syntax (::tag).*
```xpath
//a[text()="Settings"]/parent
```

#### xpath-following-sibling - Following Value

**Type 1: Correct & Compliant**
```xpath
//label[text()="Username"]/following-sibling::input
```

**Type 2: Correct & Non-Compliant**
*Why: Bypasses the requirement to link label and input.*
```xpath
//input[@name="username"]
```

**Type 3: Almost Correct**
*Bug: Assumes nesting instead of sibling relationship.*
```xpath
//label/input
```

#### xpath-preceding-sibling - Reverse Navigation

**Type 1: Correct & Compliant**
```xpath
//span[@class="error"]/preceding-sibling::label
```

**Type 2: Correct & Non-Compliant**
*Why: Direct selection ignores the relationship.*
```xpath
//label[text()="Password"]
```

**Type 3: Almost Correct**
*Bug: Confusing preceding axis with sibling specific one.*
```xpath
//span[@class="error"]/preceding::label
```

#### xpath-traversal-boss - Scenario: Error Recovery

**Type 1: Correct & Compliant**
```xpath
//span[text()="Invalid email format"]/ancestor::div//input
```

**Type 2: Correct & Non-Compliant**
*Why: Cheating by using the value directly.*
```xpath
//input[@value="invalid-email"]
```

**Type 3: Almost Correct**
*Bug: Assuming direct parent.*
```xpath
//span/parent/input
```

#### xpath-multiple-conditions - Multiple Conditions

**Type 1: Correct & Compliant**
```xpath
//button[@type="submit" and contains(@class, "primary")]
```

**Type 2: Correct & Non-Compliant**
*Why: Incomplete, misses the class check.*
```xpath
//button[@type="submit"]
```

**Type 3: Almost Correct**
*Bug: Using & instead of 'and'.*
```xpath
//button[@type="submit" & @class="primary"]
```

#### xpath-position-indexing - Position & Indexing

**Type 1: Correct & Compliant**
```xpath
//ul/li[last()]
```

**Type 2: Correct & Non-Compliant**
*Why: Hardcoded index breaks if list length changes.*
```xpath
//ul/li[5]
```

**Type 3: Almost Correct**
*Bug: Python-style negative indexing doesn't work.*
```xpath
//ul/li[-1]
```

#### xpath-normalize-space - Handling Whitespace

**Type 1: Correct & Compliant**
```xpath
//button[normalize-space()="Save Changes"]
```

**Type 2: Correct & Non-Compliant**
*Why: Exact match fails due to padding.*
```xpath
//button[text()="Save Changes"]
```

**Type 3: Almost Correct**
*Bug: Using JS trim method in XPath.*
```xpath
//button[text().trim()="Save Changes"]
```

#### xpath-complex-table - Complex Tables

**Type 1: Correct & Compliant**
```xpath
//tr[td[text()="ORD-002"]]/td[4]
```

**Type 2: Correct & Non-Compliant**
*Why: Row index.*
```xpath
//tr[2]/td[4]
```

**Type 3: Almost Correct**
*Bug: Trying to verify text on the row itself.*
```xpath
//tr[text()="ORD-002"]/td[4]
```

#### xpath-axes-master - Axes Master

**Type 1: Correct & Compliant**
```xpath
//h3[text()="Product A"]/following::button[text()="Edit"][1]
```

**Type 2: Correct & Non-Compliant**
*Why: Global index.*
```xpath
(//button[text()="Edit"])[1]
```

**Type 3: Almost Correct**
*Bug: Using sibling axis when elements are not siblings.*
```xpath
//h3/following-sibling::button
```

#### xpath-advanced-boss - Scenario: Admin User

**Type 1: Correct & Compliant**
```xpath
//tr[td[text()="John Doe"] and td[text()="Admin"]]//button[text()="Delete"]
```

**Type 2: Correct & Non-Compliant**
*Why: Index based.*
```xpath
//tr[2]//button[2]
```

**Type 3: Almost Correct**
*Bug: Invalid syntax for multiple text checks.*
```xpath
//tr[text()="John Doe" and "Admin"]
```

#### selector-comparison-same-element - Same Element Two Ways

**Type 1: Correct & Compliant**
```css
#search-btn
```

**Type 2: Correct & Non-Compliant**
*Why: Instruction asked for CSS.*
```xpath
//*[@id="search-btn"]
```

**Type 3: Almost Correct**
*Bug: Missing the hash for ID.*
```css
search-btn
```

#### selector-when-xpath-wins - XPath Exclusive Features

**Type 1: Correct & Compliant**
```xpath
//div[contains(@class, "product-card") and .//text()[contains(., "Out of Stock")]]
```

**Type 2: Correct & Non-Compliant**
*Why: CSS cannot select by text content.*
```css
/* Not Possible */
```

**Type 3: Almost Correct**
*Bug: jQuery syntax, not valid standard CSS.*
```css
.product-card:contains("Out of Stock")
```

#### selector-performance - Performance

**Type 1: Correct & Compliant**
```css
#submit-btn
```

**Type 2: Correct & Non-Compliant**
*Why: Complex XPath is slower than ID.*
```xpath
//button[@id="submit-btn"]
```

**Type 3: Almost Correct**
*Bug: Class selector is slower than ID.*
```css
.btn.primary
```

#### selector-comparison-boss - Scenario: Best Selector

**Type 1: Correct & Compliant**
```css
[data-product-id="prod-101"] .remove
```

**Type 2: Correct & Non-Compliant**
*Why: XPath used where CSS is sufficient and faster.*
```xpath
//div[@data-product-id="prod-101"]//button
```

**Type 3: Almost Correct**
*Bug: Relying on index.*
```css
.cart-item:first-child .remove
```

## Beginner Tier (JavaScript)

### Fundamentals

#### js-variables-types - Variables & Types

**Type 1: Correct & Compliant**
```javascript
const testName = "Login Test";
let passCount = 0;
passCount++;
const result = passCount;
```

**Type 2: Correct & Non-Compliant**
*Why: Usage of `var` is outdated and bad practice.*
```javascript
var testName = "Login Test";
var passCount = 0;
passCount = passCount + 1;
var result = passCount;
```

**Type 3: Almost Correct**
*Bug: Attempting to reassign a `const` variable.*
```javascript
const passCount = 0;
passCount++; // error
```

#### js-arrays-test-data - Arrays

**Type 1: Correct & Compliant**
```javascript
const users = ["admin", "editor", "viewer"];
users.push("guest");
const result = users;
```

**Type 2: Correct & Non-Compliant**
*Why: Using explicit Array constructor is verbose and unnecessary.*
```javascript
let users = new Array("admin", "editor", "viewer");
users[users.length] = "guest";
```

**Type 3: Almost Correct**
*Bug: String concatenation instead of array method.*
```javascript
const users = ["admin"] + "guest";
```

#### js-objects-for-tests - Objects

**Type 1: Correct & Compliant**
```javascript
const config = { env: "staging", retries: 3 };
config.retries = 5;
const result = config;
```

**Type 2: Correct & Non-Compliant**
*Why: Bracket notation for known properties is non-idiomatic.*
```javascript
config["retries"] = 5;
```

**Type 3: Almost Correct**
*Bug: Reassigning the const object reference instead of mutating property.*
```javascript
const config = { env: "staging", retries: 3 };
config = { env: "staging", retries: 5 }; // error
```

#### js-if-else-logic - Conditionals

**Type 1: Correct & Compliant**
```javascript
let status;
if (attempts >= 3) {
  status = "failed";
} else {
  status = "retry";
}
const result = status;
```

**Type 2: Correct & Non-Compliant**
*Why: Compact but harder to debug if logic grows.*
```javascript
const status = (attempts >= 3) ? "failed" : "retry";
```

**Type 3: Almost Correct**
*Bug: Using single `=` (assignment) inside condition.*
```javascript
if (attempts = 3) { ... }
```

#### js-loops-testing - Loops

**Type 1: Correct & Compliant**
```javascript
let total = 0;
for (const price of prices) {
  total += price;
}
const result = total;
```

**Type 2: Correct & Non-Compliant**
*Why: C-style loop is verbose and prone to off-by-one errors.*
```javascript
for (let i = 0; i < prices.length; i++) {
  total = total + prices[i];
}
```

**Type 3: Almost Correct**
*Bug: Using `price` variable outside loop scope.*
```javascript
for (const price of prices) { ... }
return price; // undefined or error
```

#### js-functions-basics - Functions

**Type 1: Correct & Compliant**
```javascript
function formatUser(name, role) {
  return `${name} (${role})`;
}
const result = formatUser("Alice", "Admin");
```

**Type 2: Correct & Non-Compliant**
*Why: Function expression syntax can be confusing for simple named functions.*
```javascript
const formatUser = function(name, role) { ... }
```

**Type 3: Almost Correct**
*Bug: Missing `return` keyword.*
```javascript
function formatUser(name, role) {
  `${name} (${role})`;
}
```

#### js-arrow-functions - Arrow Functions

**Type 1: Correct & Compliant**
```javascript
const getStatus = (code) => code === 200 ? "OK" : "Error";
const result = getStatus(200);
```

**Type 2: Correct & Non-Compliant**
*Why: Explicit return block is unnecessary for one-liners.*
```javascript
const getStatus = (code) => {
  return code === 200 ? "OK" : "Error";
}
```

**Type 3: Almost Correct**
*Bug: Including braces but forgetting `return`.*
```javascript
const getStatus = (code) => { code === 200 ? "OK" : "Error" } // returns undefined
```

#### js-array-methods - Array Methods (Map/Filter)

**Type 1: Correct & Compliant**
```javascript
const activeUsers = users.filter(user => user.isActive);
const result = activeUsers;
```

**Type 2: Correct & Non-Compliant**
*Why: Using `map` where `filter` is intended results in [true, false, true] arrays.*
```javascript
const result = users.map(user => user.isActive);
```

**Type 3: Almost Correct**
*Bug: Forgetting that `filter` returns a new array, not mutating.*
```javascript
users.filter(user => user.isActive);
// users is unchanged
```

#### js-string-methods - String Manipulation

**Type 1: Correct & Compliant**
```javascript
const id = url.split("/").pop();
const result = id;
```

**Type 2: Correct & Non-Compliant**
*Why: indexOf/substring calculation is fragile.*
```javascript
const id = url.substring(url.lastIndexOf("/") + 1);
```

**Type 3: Almost Correct**
*Bug: Python indexing syntax.*
```javascript
const id = url.split("/")[-1];
```

#### js-destructuring - Destructuring

**Type 1: Correct & Compliant**
```javascript
const { status, data: { id } } = response;
const result = id;
```

**Type 2: Correct & Non-Compliant**
*Why: Dot notation chaining is less clean for deep access.*
```javascript
const id = response.data.id;
```

**Type 3: Almost Correct**
*Bug: Destructuring to wrong variable name.*
```javascript
const { id } = response; // id is inside data, not root
```

#### js-fundamentals-boss - Test Data Generator

**Type 1: Correct & Compliant**
```javascript
function createTestUser(role = "Guest") {
  return {
    id: Date.now(),
    username: `test_${role.toLowerCase()}`,
    role: role,
    isActive: true
  };
}
const result = createTestUser("Admin");
```

**Type 2: Correct & Non-Compliant**
*Why: Hardcoded values reduce reusability reliability.*
```javascript
function createTestUser() {
  return { id: 123, role: "Guest" };
}
```

**Type 3: Almost Correct**
*Bug: Function modifies global state instead of returning object.*
```javascript
let user;
function create() { user = { ... }; }
```

### DOM Interaction

#### dom-queryselector-vs-all - Selection

**Type 1: Correct & Compliant**
```javascript
const count = document.querySelectorAll(".item").length;
const result = count;
```

**Type 2: Correct & Non-Compliant**
*Why: getElementsByClassName returns live HTMLCollection (older API).*
```javascript
const count = document.getElementsByClassName("item").length;
```

**Type 3: Almost Correct**
*Bug: querySelector returns first element, has no .length property.*
```javascript
const count = document.querySelector(".item").length;
```

#### dom-element-properties - properties

**Type 1: Correct & Compliant**
```javascript
const text = document.querySelector("#welcome-msg").textContent;
const result = text;
```

**Type 2: Correct & Non-Compliant**
*Why: innerHTML parses HTML, potential security risk (XSS).*
```javascript
const text = document.querySelector("#welcome-msg").innerHTML;
```

**Type 3: Almost Correct**
*Bug: innerText is layout-dependent and slower.*
```javascript
const text = document.querySelector("#welcome-msg").innerText;
```

#### dom-check-element-state - States

**Type 1: Correct & Compliant**
```javascript
const isEnabled = !document.querySelector("#submit").disabled;
const result = isEnabled;
```

**Type 2: Correct & Non-Compliant**
*Why: Checking 'disabled' attribute string existence instead of property.*
```javascript
const isEnabled = document.querySelector("#submit").getAttribute("disabled") === null;
```

**Type 3: Almost Correct**
*Bug: Checking style.display for enabled state.*
```javascript
const isEnabled = document.querySelector("#submit").style.display !== "none";
```

#### dom-parent-child-navigation - Traversal

**Type 1: Correct & Compliant**
```javascript
const parentTag = document.querySelector(".error-msg").parentElement.tagName;
const result = parentTag;
```

**Type 2: Correct & Non-Compliant**
*Why: parentNode can return non-element nodes (like text).*
```javascript
const parentTag = document.querySelector(".error-msg").parentNode.tagName;
```

**Type 3: Almost Correct**
*Bug: .parent does not exist.*
```javascript
const parentTag = document.querySelector(".error-msg").parent.tagName;
```

#### dom-event-listeners - Events

**Type 1: Correct & Compliant**
```javascript
document.querySelector("#submit-btn").click();
const result = "clicked";
```

**Type 2: Correct & Non-Compliant**
*Why: Manual event dispatch is overkill for simple clicks.*
```javascript
document.querySelector("#submit-btn").dispatchEvent(new Event("click"));
```

**Type 3: Almost Correct**
*Bug: Calling the on-handler directly.*
```javascript
document.querySelector("#submit-btn").onclick(); // null if not set
```

#### dom-form-interaction - Forms

**Type 1: Correct & Compliant**
```javascript
const input = document.querySelector("#username");
input.value = "testuser";
const result = input.value;
```

**Type 2: Correct & Non-Compliant**
*Why: Setting attribute doesn't always update current value property.*
```javascript
input.setAttribute("value", "testuser");
```

**Type 3: Almost Correct**
*Bug: Input uses value, not textContent.*
```javascript
input.textContent = "testuser";
```

#### dom-table-data-extraction - Tables

**Type 1: Correct & Compliant**
```javascript
const cells = Array.from(document.querySelectorAll("td"));
const result = cells.map(td => td.textContent);
```

**Type 2: Correct & Non-Compliant**
*Why: Manual push loop.*
```javascript
const result = [];
const cells = document.querySelectorAll("td");
for (let i = 0; i < cells.length; i++) {
  result.push(cells[i].textContent);
}
```

**Type 3: Almost Correct**
*Bug: Mapping over NodeList directly (not supported in older browsers/environments).*
```javascript
const result = document.querySelectorAll("td").map(td => ...);
```

#### dom-wait-for-element - Waiting

**Type 1: Correct & Compliant**
```javascript
/* Simulated wait logic */
if (document.querySelector("#modal")) {
  result = "found";
}
```

**Type 2: Correct & Non-Compliant**
*Why: Busy waiting loop freezes browser.*
```javascript
while(!document.querySelector("#modal")) { ... }
```

**Type 3: Almost Correct**
*Bug: setTimeout doesn't pause execution flow.*
```javascript
setTimeout(() => { ... }, 1000);
// code continues immediately here
```

#### dom-boss - Dashboard Scraper

**Type 1: Correct & Compliant**
```javascript
const items = Array.from(document.querySelectorAll(".card"));
const data = items.map(card => ({
  title: card.querySelector("h3").textContent,
  price: card.querySelector(".price").textContent
}));
const result = data;
```

**Type 2: Correct & Non-Compliant**
*Why: Regex parsing content.*
```javascript
const html = document.body.innerHTML;
const matches = html.match(/class="card".*?h3>(.*?)<\/h3/g);
```

**Type 3: Almost Correct**
*Bug: Selectors scoped to document instead of card.*
```javascript
// returns same title for all items
const title = document.querySelector("h3").textContent; 
```

### Async JavaScript

#### async-understanding-promises - Promises

**Type 1: Correct & Compliant**
```javascript
const result = await myPromise();
```

**Type 2: Correct & Non-Compliant**
*Why: mixing await and .then().*
```javascript
const result = await myPromise().then(r => r);
```

**Type 3: Almost Correct**
*Bug: forgetting await returns the Promise object, not value.*
```javascript
const result = myPromise();
```

#### async-await-basics - Async/Await

**Type 1: Correct & Compliant**
```javascript
async function getData() {
  const data = await fetchApi();
  return data;
}
const result = await getData();
```

**Type 2: Correct & Non-Compliant**
*Why: Using .then chaining inside async function.*
```javascript
async function getData() {
  return fetchApi().then(data => data);
}
```

**Type 3: Almost Correct**
*Bug: Await only works in async functions.*
```javascript
function getData() {
  const data = await fetchApi(); // SyntaxError
}
```

#### async-error-handling - Try/Catch

**Type 1: Correct & Compliant**
```javascript
try {
  await riskyOperation();
} catch (error) {
  return "fallback";
}
```

**Type 2: Correct & Non-Compliant**
*Why: Ignoring errors silently.*
```javascript
try { await riskyOperation(); } catch (e) {}
```

**Type 3: Almost Correct**
*Bug: Catching outside the async boundary.*
```javascript
try {
  riskyOperation(); // missing await, error won't be caught here
} catch (e) { ... }
```

#### async-parallel-execution - Parallel

**Type 1: Correct & Compliant**
```javascript
const [a, b, c] = await Promise.all([getA(), getB(), getC()]);
const result = a + b + c;
```

**Type 2: Correct & Non-Compliant**
*Why: Sequential execution is slower.*
```javascript
const a = await getA();
const b = await getB();
const c = await getC();
```

**Type 3: Almost Correct**
*Bug: Promise.race returns only first one.*
```javascript
const result = await Promise.race([getA(), getB(), getC()]);
```

#### async-testing-patterns - Retry

**Type 1: Correct & Compliant**
```javascript
for (let i = 0; i < 3; i++) {
  try {
    await flakyOperation();
    break;
  } catch (e) {
    if (i === 2) throw e;
  }
}
```

**Type 2: Correct & Non-Compliant**
*Why: Recursion depth limit usage.*
```javascript
async function retry(n) {
  if (n===0) throw err;
  try { ... } catch { return retry(n-1); }
}
```

**Type 3: Almost Correct**
*Bug: Infinite loop possibility.*
```javascript
while(true) {
  try { await op(); break; } catch (e) {} 
}
```

#### async-boss - API Aggregator

**Type 1: Correct & Compliant**
```javascript
const [users, orders, products] = await Promise.all([
  getUsers(), getOrders(), getProducts()
]);
const result = users.length + orders.length + products.length;
```

**Type 2: Correct & Non-Compliant**
*Why: Slow sequential.*
```javascript
const users = await getUsers();
const orders = await getOrders();
// ...
```

**Type 3: Almost Correct**
*Bug: Forgetting to await the Promise.all result.*
```javascript
const values = Promise.all([...]);
const result = values.length; // undefined
```

## Intermediate Tier (Playwright)

### Actions

#### pw-page-navigation - Navigation

**Type 1: Correct & Compliant**
```javascript
await page.goto('/dashboard');
```

**Type 2: Correct & Non-Compliant**
*Why: Clicking links is valid E2E behavior but slower/flaky for setup steps.*
```javascript
await page.click('a[href="/dashboard"]');
```

**Type 3: Almost Correct**
*Bug: Confusing Playwright with Selenium/Puppeteer method names.*
```javascript
await page.navigateTo('/dashboard');
```

#### pw-click-actions - Clicking

**Type 1: Correct & Compliant**
```javascript
await page.click('#submit-btn');
```

**Type 2: Correct & Non-Compliant**
*Why: Bypassing Playwright's auto-wait and actionability checks.*
```javascript
await page.evaluate(() => document.querySelector('#submit-btn').click());
```

**Type 3: Almost Correct**
*Bug: Forgetting await, which causes race conditions.*
```javascript
page.click('#submit-btn');
```

#### pw-fill-type - Text Input

**Type 1: Correct & Compliant**
```javascript
await page.fill('#username', 'testuser');
```

**Type 2: Correct & Non-Compliant**
*Why: .type() simulates keystrokes (slower, deprecated for simple fill).*
```javascript
await page.type('#username', 'testuser');
```

**Type 3: Almost Correct**
*Bug: Missing selector argument.*
```javascript
await page.fill('testuser');
```

#### pw-select-dropdowns - Select Options

**Type 1: Correct & Compliant**
```javascript
await page.selectOption('select#country', 'US');
```

**Type 2: Correct & Non-Compliant**
*Why: Manually clicking options is flaky vs the native select handler.*
```javascript
await page.click('select#country');
await page.click('option[value="US"]');
```

**Type 3: Almost Correct**
*Bug: Wrong method name.*
```javascript
await page.select('select#country', 'US');
```

#### pw-checkbox-radio - Checkboxes

**Type 1: Correct & Compliant**
```javascript
await page.check('#agree-terms');
```

**Type 2: Correct & Non-Compliant**
*Why: Click toggles value (might uncheck if already checked).*
```javascript
await page.click('#agree-terms');
```

**Type 3: Almost Correct**
*Bug: Invalid method.*
```javascript
await page.setChecked('#agree-terms', true);
```

#### pw-keyboard-actions - Keyboard

**Type 1: Correct & Compliant**
```javascript
await page.press('#search', 'Enter');
```

**Type 2: Correct & Non-Compliant**
*Why: Global keyboard press assumes correct focus implicitly.*
```javascript
await page.keyboard.press('Enter');
```

**Type 3: Almost Correct**
*Bug: Typing the key name string literally.*
```javascript
await page.fill('#search', '{Enter}');
```

#### pw-hover-focus - Hover

**Type 1: Correct & Compliant**
```javascript
await page.hover('.dropdown-trigger');
```

**Type 2: Correct & Non-Compliant**
*Why: Focus is not the same as hover (mouse over).*
```javascript
await page.focus('.dropdown-trigger');
```

**Type 3: Almost Correct**
*Bug: Using raw mouse coordinates (fragile).*
```javascript
await page.mouse.move(100, 200);
```

#### pw-file-upload - File Upload

**Type 1: Correct & Compliant**
```javascript
await page.setInputFiles('#upload', 'data.csv');
```

**Type 2: Correct & Non-Compliant**
*Why: Expecting system dialog to open (Playwright can't interact with OS dialogs).*
```javascript
await page.click('#upload');
```

**Type 3: Almost Correct**
*Bug: Singular method name.*
```javascript
await page.setInputFile('#upload', 'data.csv');
```

#### pw-drag-drop - Drag and Drop

**Type 1: Correct & Compliant**
```javascript
await page.dragAndDrop('#source', '#target');
```

**Type 2: Correct & Non-Compliant**
*Why: Manual mouse events are verbose and error-prone.*
```javascript
await page.hover('#source');
await page.mouse.down();
await page.hover('#target');
await page.mouse.up();
```

**Type 3: Almost Correct**
*Bug: Method does not exist.*
```javascript
await page.drag('#source').to('#target');
```

#### pw-iframes - Frames

**Type 1: Correct & Compliant**
```javascript
await page.frameLocator('#payment-frame').locator('#cc-number').fill('1234');
```

**Type 2: Correct & Non-Compliant**
*Why: Accessing frame by index is fragile.*
```javascript
await page.frames()[1].fill('#cc-number', '1234');
```

**Type 3: Almost Correct**
*Bug: Treating iframe as regular element.*
```javascript
await page.locator('#payment-frame #cc-number').fill('1234');
```

#### pw-dynamic-table - Dynamic Tables

**Type 1: Correct & Compliant**
```javascript
await page.locator('tr', { has: page.locator('text=Invoice #101') }).locator('.status').textContent();
```

**Type 2: Correct & Non-Compliant**
*Why: Iterating elements in JS is slow.*
```javascript
const rows = await page.$$('tr');
for (const row of rows) { ... }
```

**Type 3: Almost Correct**
*Bug: Invalid filter syntax.*
```javascript
await page.locator('tr').filter('text=Invoice #101')...
```

#### pw-actions-boss - Scenario: Form Flow

**Type 1: Correct & Compliant**
```javascript
await page.fill('#email', 'user@example.com');
await page.fill('#password', 'secret123');
await page.check('#newsletter');
await page.click('button[type="submit"]');
```

**Type 2: Correct & Non-Compliant**
*Why: Using tab navigation to reach fields (fragile).*
```javascript
await page.click('#email');
await page.keyboard.type('user@example.com');
await page.keyboard.press('Tab');
```

**Type 3: Almost Correct**
*Bug: Chaining actions without await.*
```javascript
page.fill(...).fill(...).click(...);
```

### Locators

#### pw-locator-intro - Locator Basics

**Type 1: Correct & Compliant**
```javascript
await page.locator('#submit').click();
```

**Type 2: Correct & Non-Compliant**
*Why: Legacy selector text syntax used directly in action.*
```javascript
await page.click('id=submit');
```

**Type 3: Almost Correct**
*Bug: Using $ (Puppeteer syntax).*
```javascript
await page.$('#submit').click();
```

#### pw-get-by-role - getByRole

**Type 1: Correct & Compliant**
```javascript
await page.getByRole('button', { name: 'Submit' }).click();
```

**Type 2: Correct & Non-Compliant**
*Why: CSS selector is less accessible-friendly.*
```javascript
await page.locator('button.submit-class').click();
```

**Type 3: Almost Correct**
*Bug: Case sensitivity or wrong role name.*
```javascript
await page.getByRole('Button', { name: 'Submit' });
```

#### pw-get-by-text - getByText

**Type 1: Correct & Compliant**
```javascript
await page.getByText('Welcome, User').toBeVisible();
```

**Type 2: Correct & Non-Compliant**
*Why: XPath for simple text match.*
```javascript
await page.locator('//*[text()="Welcome, User"]');
```

**Type 3: Almost Correct**
*Bug: Wrong method for partial text (unless configured).*
```javascript
await page.getByText('Welcome', { exact: true });
```

#### pw-get-by-label - getByLabel

**Type 1: Correct & Compliant**
```javascript
await page.getByLabel('Password').fill('secret');
```

**Type 2: Correct & Non-Compliant**
*Why: Relying on input ID instead of user-facing label.*
```javascript
await page.locator('#pwd-input-123').fill('secret');
```

**Type 3: Almost Correct**
*Bug: Label text must match exactly (default).*
```javascript
await page.getByLabel('Pass'); // if label is "Password"
```

#### pw-get-by-placeholder - getByPlaceholder

**Type 1: Correct & Compliant**
```javascript
await page.getByPlaceholder('mm/dd/yyyy').fill('01/01/2024');
```

**Type 2: Correct & Non-Compliant**
*Why: Using generic input selector.*
```javascript
await page.locator('input[type="date"]').fill('01/01/2024');
```

**Type 3: Almost Correct**
*Bug: Confusion with Label.*
```javascript
await page.getByLabel('mm/dd/yyyy');
```

#### pw-get-by-testid - getByTestId

**Type 1: Correct & Compliant**
```javascript
await page.getByTestId('submit-order').click();
```

**Type 2: Correct & Non-Compliant**
*Why: Using attribute selector manually.*
```javascript
await page.locator('[data-testid="submit-order"]').click();
```

**Type 3: Almost Correct**
*Bug: Forgetting that test-id is configured (default "data-testid").*
```javascript
await page.getByTestId('#submit-order'); // id hash not needed
```

#### pw-locator-chaining - Chaining

**Type 1: Correct & Compliant**
```javascript
await page.locator('form').getByRole('button').click();
```

**Type 2: Correct & Non-Compliant**
*Why: Long monolithic CSS selector.*
```javascript
await page.locator('form > div > button');
```

**Type 3: Almost Correct**
*Bug: Attempting to chain actions instead of locators.*
```javascript
await page.locator('form').click().getByRole('button');
```

#### pw-frame-locators - List Items

**Type 1: Correct & Compliant**
```javascript
const items = page.getByRole('listitem');
await expect(items).toHaveCount(3);
```

**Type 2: Correct & Non-Compliant**
*Why: Using XPath count.*
```javascript
const count = await page.locator('//li').count();
```

**Type 3: Almost Correct**
*Bug: Expecting array of elements.*
```javascript
const items = await page.getByRole('listitem');
items.length; // Locator is not an array
```

#### pw-list-items - Filtering

**Type 1: Correct & Compliant**
```javascript
await page.getByRole('listitem')
    .filter({ hasText: 'Product A' })
    .getByRole('button')
    .click();
```

**Type 2: Correct & Non-Compliant**
*Why: Using loop to find element.*
```javascript
const rows = await page.$$('li');
for (const row of rows) {
   if ((await row.textContent()).includes('Product A')) { ... }
}
```

**Type 3: Almost Correct**
*Bug: chaining finds ALL buttons in ALL items.*
```javascript
await page.getByRole('listitem').getByRole('button').click();
```

#### pw-locators-boss - Scenario: Dynamic Grid

**Type 1: Correct & Compliant**
```javascript
await page.locator('.product-card')
    .filter({ hasText: 'Gaming Laptop' })
    .getByRole('button', { name: 'Add to Cart' })
    .click();
```

**Type 2: Correct & Non-Compliant**
*Why: CSS Structural selector.*
```javascript
await page.locator('.product-card:nth-child(2) .btn').click();
```

**Type 3: Almost Correct**
*Bug: Imprecise text filter matches multiple items.*
```javascript
await page.locator('.product-card').filter({ hasText: 'Laptop' })...
```

### Assertions

#### pw-to-be-visible - Visibility

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('#modal')).toBeVisible();
```

**Type 2: Correct & Non-Compliant**
*Why: Manual boolean assertion loses auto-retry capability.*
```javascript
const isVisible = await page.isVisible('#modal');
expect(isVisible).toBe(true);
```

**Type 3: Almost Correct**
*Bug: Passing string selector to expect instead of locator.*
```javascript
await expect('#modal').toBeVisible();
```

#### pw-to-have-text - Text Content

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('h1')).toHaveText('Welcome');
```

**Type 2: Correct & Non-Compliant**
*Why: toContain matches substrings, toHaveText matches exact (by default).*
```javascript
await expect(page.locator('h1')).toContainText('Welcome');
```

**Type 3: Almost Correct**
*Bug: Using Jest matcher on Playwright object.*
```javascript
expect(page.locator('h1').textContent()).toBe('Welcome');
```

#### pw-to-have-value - Input Value

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('#email')).toHaveValue('test@x.com');
```

**Type 2: Correct & Non-Compliant**
*Why: checking "value" attribute vs current property state.*
```javascript
await expect(page.locator('#email')).toHaveAttribute('value', 'test@x.com');
```

**Type 3: Almost Correct**
*Bug: Trying to read value directly in expect.*
```javascript
await expect(page.inputValue('#email')).toBe('test@x.com');
```

#### pw-state-assertions - Element State

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('#agree')).toBeChecked();
```

**Type 2: Correct & Non-Compliant**
*Why: Manual assertion.*
```javascript
expect(await page.isChecked('#agree')).toBeTruthy();
```

**Type 3: Almost Correct**
*Bug: toBeSelected used for checkbox (it's for dropdown options).*
```javascript
await expect(page.locator('#agree')).toBeSelected();
```

#### pw-to-have-attribute - Attributes

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('img')).toHaveAttribute('alt', 'Logo');
```

**Type 2: Correct & Non-Compliant**
*Why: No retry logic.*
```javascript
const alt = await page.getAttribute('img', 'alt');
expect(alt).toBe('Logo');
```

**Type 3: Almost Correct**
*Bug: toHaveProperty is for JS objects.*
```javascript
await expect(page.locator('img')).toHaveProperty('alt', 'Logo');
```

#### pw-to-have-count - List Count

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('.item')).toHaveCount(5);
```

**Type 2: Correct & Non-Compliant**
*Why: .count() is immediate, doesn't wait for list to populate.*
```javascript
expect(await page.locator('.item').count()).toBe(5);
```

**Type 3: Almost Correct**
*Bug: Checking length of locator.*
```javascript
expect(page.locator('.item').length).toBe(5);
```

#### pw-soft-assertions - Soft Assertions

**Type 1: Correct & Compliant**
```javascript
await expect.soft(page.locator('.item')).toBeVisible();
```

**Type 2: Correct & Non-Compliant**
*Why: Try/catch blocks suppress errors but don't report them properly.*
```javascript
try { await expect(page.locator('.item')).toBeVisible(); } catch(e) {}
```

**Type 3: Almost Correct**
*Bug: Invalid syntax.*
```javascript
await softExpect(page.locator('.item')).toBeVisible();
```

#### pw-assertions-boss - Scenario: Validation

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('#submit')).toBeDisabled();
await page.fill('#email', 'valid@x.com');
await page.fill('#password', '12345678');
await expect(page.locator('#submit')).toBeEnabled();
```

**Type 2: Correct & Non-Compliant**
*Why: Checking class names instead of semantic state.*
```javascript
await expect(page.locator('#submit')).toHaveClass(/disabled/);
```

**Type 3: Almost Correct**
*Bug: Missing await on expectations.*
```javascript
expect(page.locator('#submit')).toBeEnabled();
```

### Waits

#### pw-auto-wait - Auto-Wait

**Type 1: Correct & Compliant**
```javascript
// Just perform the action, Playwright waits automatically
await page.click('#delayed-btn');
```

**Type 2: Correct & Non-Compliant**
*Why: Redundant explicit wait.*
```javascript
await page.waitForSelector('#delayed-btn');
await page.click('#delayed-btn');
```

**Type 3: Almost Correct**
*Bug: Hardcoded sleep.*
```javascript
await page.waitForTimeout(1000);
await page.click('#delayed-btn');
```

#### pw-wait-for-selector - Explicit Wait

**Type 1: Correct & Compliant**
```javascript
await page.waitForSelector('#spinner', { state: 'hidden' });
```

**Type 2: Correct & Non-Compliant**
*Why: Guessing the time.*
```javascript
await page.waitForTimeout(5000);
```

**Type 3: Almost Correct**
*Bug: Default state is 'visible', so this waits for spinner to appear, not hide.*
```javascript
await page.waitForSelector('#spinner');
```

#### pw-wait-for-load-state - Load States

**Type 1: Correct & Compliant**
```javascript
await page.waitForLoadState('networkidle');
```

**Type 2: Correct & Non-Compliant**
*Why: 'load' fires too early for SPAs, 'networkidle' is safer for initial data.*
```javascript
await page.waitForLoadState('load');
```

**Type 3: Almost Correct**
*Bug: Invalid state string.*
```javascript
await page.waitForLoadState('complete');
```

#### pw-wait-for-response - API Response

**Type 1: Correct & Compliant**
```javascript
const response = await page.waitForResponse(resp => 
  resp.url().includes('/api/data') && resp.status() === 200
);
```

**Type 2: Correct & Non-Compliant**
*Why: Only checking URL, ignoring failed (500) responses.*
```javascript
await page.waitForResponse('/api/data');
```

**Type 3: Almost Correct**
*Bug: Race condition - defining wait AFTER action.*
```javascript
await page.click('#load');
await page.waitForResponse('/api/data'); // Too late!
```

#### pw-wait-for-function - Custom Wait

**Type 1: Correct & Compliant**
```javascript
await page.waitForFunction(() => document.querySelector('#counter').textContent === '3');
```

**Type 2: Correct & Non-Compliant**
*Why: Polling loop in Node.js context is slower.*
```javascript
while(true) {
  const t = await page.textContent('#counter');
  if (t === '3') break;
}
```

**Type 3: Almost Correct**
*Bug: Passing external variable without arg.*
```javascript
const target = '3';
await page.waitForFunction(() => document.body.innerText === target); // target undefined in browser
```

#### pw-timeout-config - Timeouts

**Type 1: Correct & Compliant**
```javascript
await page.click('#slow-btn', { timeout: 10000 });
```

**Type 2: Correct & Non-Compliant**
*Why: Changing global timeout affects future tests.*
```javascript
page.setDefaultTimeout(10000);
await page.click('#slow-btn');
```

**Type 3: Almost Correct**
*Bug: Wrong argument position.*
```javascript
await page.click('#slow-btn', 10000);
```

#### pw-waits-boss - Scenario: Polling

**Type 1: Correct & Compliant**
```javascript
await expect(page.locator('#status')).toHaveText('Connected');
await expect(page.locator('#data')).toContainText('Data received');
const result = await page.locator('#data').textContent();
```

**Type 2: Correct & Non-Compliant**
*Why: Hard waits correspond to specific timing, which might change.*
```javascript
await page.waitForTimeout(2000);
```

**Type 3: Almost Correct**
*Bug: Waiting for selector only checks presence, not text update.*
```javascript
await page.waitForSelector('#data'); 
// passes immediately even if empty
```

## Expert Tier (Advanced Patterns)

### Page Object Model

#### pw-first-page-object - Class Structure

**Type 1: Correct & Compliant**
```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-btn');
  }
}
```

**Type 2: Correct & Non-Compliant**
*Why: Defining selectors inside methods repeats code and makes maintenance harder.*
```javascript
class LoginPage {
  constructor(page) { this.page = page; }
  async login() {
    await this.page.fill('#username', ...);
  }
}
```

**Type 3: Almost Correct**
*Bug: Storing Elements (async) instead of Locators (sync) in constructor.*
```javascript
class LoginPage {
  constructor(page) {
    // This fails because await isn't allowed here
    this.button = await page.$('#btn'); 
  }
}
```

#### pw-encapsulate-actions - Methods

**Type 1: Correct & Compliant**
```javascript
async login(user, pass) {
  await this.usernameInput.fill(user);
  await this.passwordInput.fill(pass);
  await this.loginButton.click();
}
```

**Type 2: Correct & Non-Compliant**
*Why: Hardcoded credentials inside method limit reusability.*
```javascript
async login() {
  await this.usernameInput.fill("admin");
  await this.passwordInput.fill("secret");
  await this.loginButton.click();
}
```

**Type 3: Almost Correct**
*Bug: Forgetting one await causes race conditions.*
```javascript
async login(user, pass) {
  this.usernameInput.fill(user); // missing await
  await this.loginButton.click();
}
```

#### pw-page-components - Components

**Type 1: Correct & Compliant**
```javascript
class Navigation {
  constructor(page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Home' });
  }
}
```

**Type 2: Correct & Non-Compliant**
*Why: Putting navigation logic inside every Page Object duplicates code.*
```javascript
class DashboardPage {
  // ... imports navigation methods directly
}
class ProfilePage {
  // ... copies same navigation methods
}
```

**Type 3: Almost Correct**
*Bug: Passing 'this' instead of 'page' to component.*
```javascript
this.nav = new Navigation(this);
```

#### pw-fluent-navigation - Fluent Pattern

**Type 1: Correct & Compliant**
```javascript
async gotoProfile() {
  await this.profileIcon.click();
  return new ProfilePage(this.page);
}
// Usage: await (await home.gotoProfile()).updateBio();
```

**Type 2: Correct & Non-Compliant**
*Why: Returning `this` leads to incorrect chaining state if page changed.*
```javascript
async gotoProfile() {
  await this.profileIcon.click();
  return this;
}
```

**Type 3: Almost Correct**
*Bug: Missing await on the click before returning new page.*
```javascript
async gotoProfile() {
  this.profileIcon.click();
  return new ProfilePage(this.page);
}
```

#### pw-base-page-class - Inheritance

**Type 1: Correct & Compliant**
```javascript
class BasePage {
  constructor(page) { this.page = page; }
  async navigate(path) { await this.page.goto(path); }
}
class LoginPage extends BasePage { ... }
```

**Type 2: Correct & Non-Compliant**
*Why: Duplicating common logic in every class.*
```javascript
class LoginPage { 
  async navigate(path) { await this.page.goto(path); }
}
class HomePage {
  async navigate(path) { await this.page.goto(path); }
}
```

**Type 3: Almost Correct**
*Bug: Forgetting super(page) call.*
```javascript
class LoginPage extends BasePage {
  constructor(page) {
    this.loginBtn = ...; // ReferenceError: Must call super constructor
  }
}
```

#### pw-pom-boss - Scenario: Multi-Page POM

**Type 1: Correct & Compliant**
```javascript
const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.login('user', 'pass');
const dashboard = new DashboardPage(page);
await expect(dashboard.welcomeMessage).toBeVisible();
```

**Type 2: Correct & Non-Compliant**
*Why: Mixing POM and raw script commands.*
```javascript
const loginPage = new LoginPage(page);
await loginPage.login('user', 'pass');
await page.locator('.welcome').waitFor(); // Raw usage breaks abstraction
```

**Type 3: Almost Correct**
*Bug: Instantiating page object before page is ready.*
```javascript
const dashboard = new DashboardPage(page);
// Login happens here... navigation changes...
// dashboard.welcomeMessage might be stale? (Actually locators are lazy, so this is subtle. But often context is lost if frame changes).*
```

### Data Driven Testing

#### pw-parameterized-tests - Loops

**Type 1: Correct & Compliant**
```javascript
const users = ['Alice', 'Bob', 'Charlie'];
for (const user of users) {
  await testLogin(user);
}
```

**Type 2: Correct & Non-Compliant**
*Why: Copy-pasting test blocks.*
```javascript
await testLogin('Alice');
await testLogin('Bob');
await testLogin('Charlie');
```

**Type 3: Almost Correct**
*Bug: forEach with async/await acts unexpectedly.*
```javascript
users.forEach(async user => {
  await testLogin(user); // Promises are not awaited by forEach
});
```

#### pw-test-data-json - JSON Data

**Type 1: Correct & Compliant**
```javascript
import data from './data.json';
await page.fill('#username', data.username);
```

**Type 2: Correct & Non-Compliant**
*Why: Inline object is hard to manage for large datasets.*
```javascript
const data = { username: "..." };
```

**Type 3: Almost Correct**
*Bug: require without json assertion (in ES modules).*
```javascript
import data from './data.json' assert { type: 'json' }; // Syntax varies by env
```

#### pw-csv-test-data - CSV Parsing

**Type 1: Correct & Compliant**
```javascript
import { parse } from 'csv-parse/sync';
const records = parse(csvContent, { columns: true });
```

**Type 2: Correct & Non-Compliant**
*Why: Manual string splitting is fragile (e.g., commas inside quotes).*
```javascript
const rows = csvContent.split('\n').map(r => r.split(','));
```

**Type 3: Almost Correct**
*Bug: Async read inside sync context.*
```javascript
const records = await parse(file); // If parse is sync, await is useless but harmless. If async, must await.
```

#### pw-dynamic-data - Faker

**Type 1: Correct & Compliant**
```javascript
const email = `user_${Date.now()}@test.com`;
await page.fill('#email', email);
```

**Type 2: Correct & Non-Compliant**
*Why: Hardcoded "random" data causes collision.*
```javascript
await page.fill('#email', 'user_123@test.com');
```

**Type 3: Almost Correct**
*Bug: Generating random data but not saving it for verification.*
```javascript
await page.fill('#email', key);
// later: expect(page).toHaveText(key); // Variable undefined or different call
```

#### pw-environment-data - Env Vars

**Type 1: Correct & Compliant**
```javascript
await page.goto(process.env.BASE_URL);
```

**Type 2: Correct & Non-Compliant**
*Why: Committing secrets/config to code.*
```javascript
await page.goto('https://staging.mysite.com');
```

**Type 3: Almost Correct**
*Bug: Typos in env var name.*
```javascript
process.env.BaseURL // undefined (case sensitive)
```

#### pw-data-driven-boss - Scenario: Cross-Browser

**Type 1: Correct & Compliant**
```javascript
// playwright.config.ts projects configuration
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

**Type 2: Correct & Non-Compliant**
*Why: Manual browser launch in test file.*
```javascript
const browser = await chromium.launch();
// ...
const browser2 = await firefox.launch();
```

**Type 3: Almost Correct**
*Bug: Incomplete device emulation.*
```javascript
use: { browserName: 'chromium' } // Missing viewport/agent settings
```


### Infrastructure & Integration

#### pw-api-ui-testing - Hybrid Testing

**Type 1: Correct & Compliant**
```javascript
const response = await request.post('/api/users', {
  data: { name: 'TestUser' }
});
expect(response.ok()).toBeTruthy();
```

**Type 2: Correct & Non-Compliant**
*Why: Running API calls in browser context is slower and less powerful.*
```javascript
await page.evaluate(() => {
  return fetch('/api/users', { method: 'POST', ... });
});
```

**Type 3: Almost Correct**
*Bug: Forgetting to await the request.*
```javascript
request.post('/api/users'); // Fire and forget, no validation
```

#### pw-state-setup-api - Auth State

**Type 1: Correct & Compliant**
```javascript
// playwright.config.ts
projects: [
  { 
    name: 'setup', 
    testMatch: /.*\.setup\.ts/ 
  },
  {
    name: 'e2e',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  }
];
```

**Type 2: Correct & Non-Compliant**
*Why: Logging in via UI before every single test file.*
```javascript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill(...);
  await page.click(...);
});
```

**Type 3: Almost Correct**
*Bug: Path to storage state incorrect or not created.*
```javascript
use: { storageState: 'user.json' } // File not found usually
```

#### pw-screenshot-failure - Screenshots

**Type 1: Correct & Compliant**
```javascript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
}
```

**Type 2: Correct & Non-Compliant**
*Why: 'on' fills storage with useless images of passing tests.*
```javascript
use: { screenshot: 'on' }
```

**Type 3: Almost Correct**
*Bug: Invalid option string.*
```javascript
use: { screenshot: 'true' }
```

#### pw-video-recording - Video

**Type 1: Correct & Compliant**
```javascript
use: {
  video: 'retain-on-failure',
}
```

**Type 2: Correct & Non-Compliant**
*Why: Always recording slows down execution significantly.*
```javascript
use: { video: 'on' }
```

**Type 3: Almost Correct**
*Bug: Misspelled property.*
```javascript
use: { recordVideo: 'on' }
```

#### pw-retry-logic - Retries

**Type 1: Correct & Compliant**
```javascript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

**Type 2: Correct & Non-Compliant**
*Why: Excessive retries hide real bugs/instability.*
```javascript
retries: 10,
```

**Type 3: Almost Correct**
*Bug: Setting retry in the test body (it's a config option).*
```javascript
test('my test', async ({ page }) => {
  test.retry(2); // Not valid API like this
});
```

#### pw-parallel-execution - Parallelism

**Type 1: Correct & Compliant**
```javascript
// playwright.config.ts
fullyParallel: true,
workers: '50%',
```

**Type 2: Correct & Non-Compliant**
*Why: Serial execution is too slow for large suites.*
```javascript
workers: 1,
```

**Type 3: Almost Correct**
*Bug: Conflict with serial mode.*
```javascript
test.describe.serial('group', () => { ... }); 
// + fullyParallel: true in config causes confusion
```

#### pw-mobile-viewport - Mobile Testing

**Type 1: Correct & Compliant**
```javascript
use: {
  ...devices['iPhone 12'],
}
```

**Type 2: Correct & Non-Compliant**
*Why: Only setting viewport size misses touch events and User Agent.*
```javascript
use: {
  viewport: { width: 375, height: 667 },
  hasTouch: true,
}
```

**Type 3: Almost Correct**
*Bug: Typos in device name.*
```javascript
...devices['Iphone 12'] // Case sensitive
```

#### pw-infrastructure-boss - Self-Healing Test Suite

**Type 1: Correct & Compliant**
```javascript
async function retryAction(action, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      await action();
      return 'passed';
    } catch (e) {
      if (i === attempts - 1) {
        await page.screenshot({ path: 'failure.png' });
        throw e;
      }
    }
  }
}
```

**Type 2: Correct & Non-Compliant**
*Why: Silent failure.*
```javascript
try { await action(); } catch(e) { console.log('failed'); }
```

**Type 3: Almost Correct**
*Bug: Rethrowing without screenshot.*
```javascript
catch (e) { throw e; } // Missed the requirement
```

#### pw-integration-boss - E2E Pipeline Integration

**Type 1: Correct & Compliant**
```javascript
test('Full User Flow', async ({ page }) => {
  // 1. Setup
  await setupUserData(); 
  // 2. Login
  await page.goto('/login');
  await page.fill('#u', 'test');
  await page.fill('#p', 'pass');
  await page.click('#submit');
  // 3. Verify
  await expect(page.locator('.dashboard')).toBeVisible();
  // 4. Teardown
  await cleanupUserData();
});
```

**Type 2: Correct & Non-Compliant**
*Why: No cleanup leaves dirty data.*
```javascript
test('Flow', async ({ page }) => {
  await page.goto('/login');
  // ... create data
  // End of test
});
```

**Type 3: Almost Correct**
*Bug: Cleanup fails if test fails (should use try/finally or afterEach).*
```javascript
await setup();
await test(); // if this throws
await cleanup(); // this never runs
```

## E2E Tier (Full Flows)

### Scenarios

#### e2e-login-flow - Login Flow

**Type 1: Correct & Compliant**
```javascript
import { test, expect } from '@playwright/test';

test('User can log in', async ({ page }) => {
  await page.goto('/login.html');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await expect(page.locator('#welcome-message')).toBeVisible();
  await expect(page).toHaveURL('/dashboard.html');
});
```

**Type 2: Correct & Non-Compliant**
*Why: Hardcoded pauses.*
```javascript
await page.goto('/login.html');
await page.fill('#username', 'testuser');
await page.waitForTimeout(1000); // Bad practice
await page.click('button');
await page.waitForTimeout(2000); // Bad practice
const visible = await page.isVisible('#welcome-message');
expect(visible).toBe(true);
```

**Type 3: Almost Correct**
*Bug: Wrong selector for welcome message.*
```javascript
await expect(page.locator('.welcome')).toBeVisible(); // Class instead of ID
```
