# Challenge Solutions & Achievements Reference

This document provides **2 solution options** for each challenge, plus a complete list of achievements.

---

## Table of Contents

1. [Achievements](#achievements)
2. [Basic Tier (CSS/XPath Selectors)](#basic-tier-cssxpath-selectors)
3. [Beginner Tier (JavaScript)](#beginner-tier-javascript)
4. [Intermediate Tier (Playwright)](#intermediate-tier-playwright)
5. [Expert Tier (Advanced Patterns)](#expert-tier-advanced-patterns)

---

## Achievements

### Milestones & Challenges

| Icon | Name | Description | XP |
|------|------|-------------|-----|
| 🎯 | First Steps | Complete your first challenge | 50 |
| 📖 | Eager Learner | Complete your first tutorial | 25 |
| 🔥 | Getting Warmed Up | Complete 10 challenges | 100 |
| ⚡ | Challenge Accepted | Complete 25 challenges | 200 |
| 🏆 | Halfway Hero | Complete 50 challenges | 500 |
| 👑 | Completionist | Complete all 88 challenges | 1000 |

### Streak Achievements

| Icon | Name | Description | XP |
|------|------|-------------|-----|
| 🔥 | On Fire | 3-day streak | 50 |
| ⚡ | Week Warrior | 7-day streak | 100 |
| 💪 | Two Week Champion | 14-day streak | 200 |
| 🏆 | Monthly Master | 30-day streak | 500 |

### XP Milestones

| Icon | Name | Description | XP |
|------|------|-------------|-----|
| ✨ | XP Starter | Earn 100 XP | 25 |
| 💫 | XP Hunter | Earn 500 XP | 50 |
| 🌟 | XP Collector | Earn 1000 XP | 100 |
| ⭐ | XP Master | Earn 2500 XP | 200 |
| 🌠 | XP Legend | Earn 5000 XP | 500 |

### Tier Masters

| Icon | Name | Description | XP |
|------|------|-------------|-----|
| 🎨 | Selector Specialist | Complete all Basic tier | 150 |
| 💛 | JavaScript Hero | Complete all Beginner tier | 200 |
| 🎭 | Playwright Pro | Complete all Intermediate tier | 300 |
| 🚀 | Automation Expert | Complete all Advanced tier | 400 |

### Secret Boss Achievements 🔒

| Icon | Name | Boss Fight | XP |
|------|------|------------|-----|
| 🏗️ | JS Architect | Test Data Generator | 300 |
| 🕷️ | DOMinator | Dashboard Scraper | 300 |
| ⏳ | Async Avenger | API Data Aggregator | 300 |
| 🛒 | Action Hero | E-Commerce Checkout | 400 |
| 🎯 | Locator Legend | Dynamic Product Grid | 400 |
| 🔍 | Sherlock Homes | Form Validation Suite | 400 |
| ⚡ | Time Wizard | Polling Dashboard | 400 |
| ✈️ | POM Pilot | Multi-Page POM | 500 |
| 💾 | Data Dynamo | Cross-Browser Data Suite | 500 |
| 🛠️ | Infrastructure Idol | Self-Healing Test Suite | 500 |
| 🔄 | Integration Icon | E2E Pipeline Integration | 500 |

---

## Basic Tier (CSS/XPath Selectors)

### css-selector-101-id-class

**Target: Login button**

```css
/* Option 1: ID selector */
#login-btn

/* Option 2: Combined selector */
button#login-btn
```

### css-tag-selectors

**Target: Paragraph text**

```css
/* Option 1: Tag selector */
p

/* Option 2: Descendant selector */
.welcome-card p
```

### css-combining-basics

**Target: Error div (not span)**

```css
/* Option 1: Tag + class */
div.error

/* Option 2: Descendant path */
.notification-area div.error
```

### css-foundations-boss

**Target: Sign Up button**

```css
/* Option 1: All classes */
button.btn.primary.large

/* Option 2: With parent context */
.hero-section button.btn.primary.large
```

### css-child-descendant

**Target: Top-level menu items only**

```css
/* Option 1: Direct child */
.nav-menu > li

/* Option 2: With class */
.nav-menu > .nav-item
```

### css-sibling-selectors

**Target: Subtitle after h1**

```css
/* Option 1: Adjacent sibling */
h1 + p

/* Option 2: With class */
h1.post-title + p.subtitle
```

### css-family-drill

**Target: Span in profile card content**

```css
/* Option 1: Descendant path */
.profile-card .card-content span

/* Option 2: Direct children */
.profile-card > .card-content > span
```

---

## Beginner Tier (JavaScript)

### js-variables-types

```javascript
// Option 1: Standard
const testName = "Login Test";
let passCount = 0;
passCount++;
const result = passCount;

// Option 2: Increment style
const testName = "Login Test";
let passCount = 0;
passCount = passCount + 1;
const result = passCount;
```

### js-arrays-test-data

```javascript
// Option 1: Direct push
const testCredentials = ["admin", "user", "guest"];
testCredentials.push("superadmin");
const result = testCredentials.length;

// Option 2: Spread operator
const testCredentials = ["admin", "user", "guest"];
const updated = [...testCredentials, "superadmin"];
const result = updated.length;
```

### js-objects-for-tests

```javascript
// Option 1: Direct increment
const testUser = {
    email: "test@example.com",
    isActive: true,
    loginCount: 5
};
testUser.loginCount++;
const result = testUser.loginCount;

// Option 2: Assignment
const testUser = {
    email: "test@example.com",
    isActive: true,
    loginCount: 5
};
testUser.loginCount = testUser.loginCount + 1;
const result = testUser.loginCount;
```

### js-if-else-logic

```javascript
// Option 1: If-else chain
let result;
if (passCount === totalTests) {
    result = "ALL_PASSED";
} else if (passCount > 0) {
    result = "PARTIAL";
} else {
    result = "ALL_FAILED";
}

// Option 2: Ternary nested
const result = passCount === totalTests ? "ALL_PASSED" 
             : passCount > 0 ? "PARTIAL" 
             : "ALL_FAILED";
```

### js-loops-testing

```javascript
// Option 1: for...of
for (const score of scores) {
    if (score >= 80) result++;
}

// Option 2: forEach
scores.forEach(score => {
    if (score >= 80) result++;
});
```

### js-functions-basics

```javascript
// Option 1: Function declaration
function calculatePassRate(passed, total) {
    return (passed / total) * 100;
}
const result = calculatePassRate(7, 10);

// Option 2: Arrow function
const calculatePassRate = (passed, total) => (passed / total) * 100;
const result = calculatePassRate(7, 10);
```

### js-arrow-functions

```javascript
// Option 1: Short arrow functions
const isPositive = n => n > 0;
const square = n => n * n;
const result = square(8);

// Option 2: With explicit return
const isPositive = (n) => { return n > 0; };
const square = (n) => { return n * n; };
const result = square(8);
```

### js-array-methods

```javascript
// Option 1: Filter + length
const result = testResults.filter(t => t.status === "passed").length;

// Option 2: Reduce
const result = testResults.reduce((count, t) => 
    t.status === "passed" ? count + 1 : count, 0);
```

### js-string-methods

```javascript
// Option 1: Trim + split
const trimmed = rawMessage.trim();
const parts = trimmed.split(": ");
const result = parts[1];

// Option 2: Chain
const result = rawMessage.trim().split(": ")[1];
```

### js-destructuring

```javascript
// Option 1: Destructure + ternary
const { testName, duration, status } = testResult;
const result = status === "passed" ? duration : 0;

// Option 2: Inline
const { duration, status } = testResult;
const result = status === "passed" ? duration : 0;
```

### DOM Challenges

### dom-queryselector-vs-all

```javascript
// Option 1: Standard
const title = document.querySelector('#title');
const items = document.querySelectorAll('.item');
const result = items.length;

// Option 2: Chained
const result = document.querySelectorAll('.item').length;
```

### dom-element-properties

```javascript
// Option 1: Separate variables
const price = Number(document.querySelector('.price').textContent);
const qty = Number(document.querySelector('#quantity').value);
const result = price * qty;

// Option 2: Inline
const result = Number(document.querySelector('.price').textContent) 
             * Number(document.querySelector('#quantity').value);
```

### dom-check-element-state

```javascript
// Option 1: For loop
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
let result = 0;
for (const cb of checkboxes) {
    if (cb.checked) result++;
}

// Option 2: Filter
const result = [...document.querySelectorAll('input[type="checkbox"]')]
    .filter(cb => cb.checked).length;
```

### dom-parent-child-navigation

```javascript
// Option 1: Standard navigation
const active = document.querySelector('.active');
const result = active.parentElement.children.length;

// Option 2: Direct parent query
const result = document.querySelector('.tabs').children.length;
```

### dom-event-listeners

```javascript
// Option 1: Multiple clicks
const btn = document.querySelector('#increment');
btn.click(); btn.click(); btn.click();
const result = Number(document.querySelector('#count').textContent);

// Option 2: Loop
const btn = document.querySelector('#increment');
for (let i = 0; i < 3; i++) btn.click();
const result = Number(document.querySelector('#count').textContent);
```

### dom-form-interaction

```javascript
// Option 1: Set and get
document.querySelector('#username').value = 'testuser';
document.querySelector('#password').value = 'secret123';
const result = document.querySelector('#username').value + ':' + document.querySelector('#password').value;

// Option 2: Destructure
const [user, pass] = ['#username', '#password'].map(s => {
    const el = document.querySelector(s);
    el.value = s === '#username' ? 'testuser' : 'secret123';
    return el.value;
});
const result = user + ':' + pass;
```

### Async Challenges

### async-understanding-promises

```javascript
// Option 1: Await
const myPromise = new Promise((resolve) => resolve(42));
const result = await myPromise;

// Option 2: Variable assignment
const myPromise = Promise.resolve(42);
const result = await myPromise;
```

### async-await-basics

```javascript
// Option 1: Async function declaration
async function doubleValue() {
    const value = await getValue();
    return value * 2;
}
const result = await doubleValue();

// Option 2: Arrow function
const doubleValue = async () => {
    const value = await getValue();
    return value * 2;
};
const result = await doubleValue();
```

### async-error-handling

```javascript
// Option 1: Try-catch block
async function safeOperation() {
    try {
        await riskyOperation();
    } catch (error) {
        return 'fallback';
    }
}
const result = await safeOperation();

// Option 2: Catch method
const result = await riskyOperation().catch(() => 'fallback');
```

### async-parallel-execution

```javascript
// Option 1: Promise.all with destructuring
const [a, b, c] = await Promise.all([getA(), getB(), getC()]);
const result = a + b + c;

// Option 2: Promise.all with reduce
const values = await Promise.all([getA(), getB(), getC()]);
const result = values.reduce((sum, v) => sum + v, 0);
```

---

## Intermediate Tier (Playwright)

### pw-click-actions

```javascript
// Option 1: Multiple clicks
await page.click('#increment');
await page.click('#increment');
await page.click('#increment');
const result = await page.locator('#count').textContent();

// Option 2: Loop
for (let i = 0; i < 3; i++) {
    await page.click('#increment');
}
const result = await page.locator('#count').textContent();
```

### pw-fill-type

```javascript
// Option 1: Using fill
await page.fill('#email', 'qa@test.com');
await page.fill('#password', 'secret123');
const result = await page.locator('#email').inputValue();

// Option 2: Using locator.fill
await page.locator('#email').fill('qa@test.com');
await page.locator('#password').fill('secret123');
const result = await page.locator('#email').inputValue();
```

### pw-select-dropdowns

```javascript
// Option 1: By value
await page.selectOption('#language', 'javascript');
const result = await page.locator('#language').inputValue();

// Option 2: By label
await page.selectOption('#language', { label: 'JavaScript' });
const result = await page.locator('#language').inputValue();
```

### pw-checkbox-radio

```javascript
// Option 1: Using check
await page.check('#terms');
const result = await page.isChecked('#terms');

// Option 2: Using locator
await page.locator('#terms').check();
const result = await page.locator('#terms').isChecked();
```

### pw-keyboard-actions

```javascript
// Option 1: Fill + press
await page.fill('#search', 'Playwright');
await page.press('#search', 'Enter');
const result = await page.locator('#results').textContent();

// Option 2: Type + keyboard
await page.locator('#search').fill('Playwright');
await page.keyboard.press('Enter');
const result = await page.locator('#results').textContent();
```

### pw-hover-focus

```javascript
// Option 1: Using hover
await page.hover('#menu-btn');
const result = await page.locator('#dropdown').textContent();

// Option 2: Using locator hover
await page.locator('#menu-btn').hover();
const result = await page.locator('#dropdown').textContent();
```

### pw-drag-drop

```javascript
// Option 1: dragTo method
await page.locator('#item-a').dragTo(page.locator('#dropzone'));
const result = await page.locator('#dropzone').textContent();

// Option 2: Manual drag
await page.locator('#item-a').hover();
await page.mouse.down();
await page.locator('#dropzone').hover();
await page.mouse.up();
const result = await page.locator('#dropzone').textContent();
```

### pw-iframes

```javascript
// Option 1: frameLocator
const frame = page.frameLocator('#embed');
const result = await frame.locator('#frame-content').textContent();

// Option 2: frame by name
const frame = page.frame({ name: 'embed' });
const result = await frame.locator('#frame-content').textContent();
```

### pw-get-by-role

```javascript
// Option 1: getByRole with name
await page.getByRole('button', { name: 'Sign Up' }).click();
const result = await page.locator('#result').textContent();

// Option 2: getByRole with exact
await page.getByRole('button', { name: /sign up/i }).click();
const result = await page.locator('#result').textContent();
```

### pw-get-by-text

```javascript
// Option 1: Substring match
await page.getByText('Click me').click();
const result = await page.locator('#output').textContent();

// Option 2: Regex match
await page.getByText(/click me/i).click();
const result = await page.locator('#output').textContent();
```

---

## Expert Tier (Advanced Patterns)

### pw-first-page-object

```javascript
// Option 1: Fill then click
async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
}

// Option 2: Using page methods
async login(email, password) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('#submit');
}
```

### pw-encapsulate-actions

```javascript
// Option 1: Direct click and textContent
async addItem() {
    await this.addButton.click();
}
async getTotal() {
    return await this.totalLabel.textContent();
}

// Option 2: Using page methods
async addItem() {
    await this.page.click('#add-item');
}
async getTotal() {
    return await this.page.locator('#total').textContent();
}
```

### pw-page-components

```javascript
// Option 1: Direct locator methods
async logout() {
    await this.logoutButton.click();
}
async getStatus() {
    return await this.status.textContent();
}

// Option 2: With wait
async logout() {
    await this.logoutButton.click();
    await this.page.waitForTimeout(100);
}
async getStatus() {
    return await this.status.innerText();
}
```

### pw-fluent-navigation

```javascript
// Option 1: Standard pattern
async getWelcomeMessage() {
    return await this.welcomeText.textContent();
}
async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    return new HomePage(this.page);
}

// Option 2: With wait for navigation
async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForSelector('#welcome');
    return new HomePage(this.page);
}
```

### pw-base-page-class

```javascript
// Option 1: Using page.title()
async getPageTitle() {
    return await this.page.title();
}
async getProductName() {
    return await this.productName.textContent();
}

// Option 2: Using locator
async getPageTitle() {
    return await this.page.title();
}
async getProductName() {
    return await this.page.locator('h1').innerText();
}
```

### pw-parameterized-tests

```javascript
// Option 1: For...of loop
for (const { a, b, expected } of testCases) {
    await page.fill('#num1', String(a));
    await page.fill('#num2', String(b));
    await page.click('#add');
    const result = await page.locator('#result').textContent();
    if (result === expected) passed++;
}

// Option 2: forEach with async
for (let i = 0; i < testCases.length; i++) {
    const { a, b, expected } = testCases[i];
    await page.fill('#num1', a.toString());
    await page.fill('#num2', b.toString());
    await page.click('#add');
    if (await page.locator('#result').textContent() === expected) passed++;
}
```

### pw-test-data-json

```javascript
// Option 1: Get last user
const lastUser = usersData[usersData.length - 1];
await page.fill('#name', lastUser.name);
await page.click('#greet');
const result = await page.locator('#greeting').textContent();

// Option 2: Using at()
const lastUser = usersData.at(-1);
await page.fill('#name', lastUser.name);
await page.click('#greet');
const result = await page.locator('#greeting').textContent();
```

### pw-csv-test-data

```javascript
// Option 1: Manual parse
const lines = csvData.split('\n').slice(1);
const rows = lines.map(line => {
    const [name, role, expected] = line.split(',');
    return { name, role, expected };
});
const bobRow = rows[1];
await page.fill('#username', bobRow.name);
await page.click('#welcome');
const result = await page.locator('#message').textContent();

// Option 2: Destructuring in map
const [, bobData] = csvData.split('\n').slice(1).map(line => line.split(','));
await page.fill('#username', bobData[0]);
await page.click('#welcome');
const result = await page.locator('#message').textContent();
```

### pw-environment-data

```javascript
// Option 1: Object lookup
const config = envConfig[currentEnv];
await page.fill('#env', currentEnv);
await page.fill('#email', config.email);
await page.click('#login');
const result = await page.locator('#status').textContent();

// Option 2: Destructuring
const { email } = envConfig[currentEnv];
await page.fill('#env', currentEnv);
await page.fill('#email', email);
await page.click('#login');
const result = await page.locator('#status').textContent();
```

---

## Notes

- **CSS/XPath challenges**: Type the selector directly (no code needed)
- **JavaScript challenges**: Result must be stored in `result` variable
- **Playwright challenges**: `page` object is pre-defined
- **Expert challenges**: Complete the method implementations

Good luck testing! 🚀
