# Challenge Solutions Reference

This document contains the **official solutions** for all coding challenges, extracted directly from the challenge definitions.

---

## Table of Contents

- [Basic Tier (CSS Selectors)](#basic-tier-css-selectors)
- [Basic Tier (XPath Selectors)](#basic-tier-xpath-selectors)
- [Beginner Tier (JavaScript)](#beginner-tier-javascript)
- [Beginner Tier (DOM)](#beginner-tier-dom)
- [Beginner Tier (Async)](#beginner-tier-async)
- [Intermediate Tier (Playwright Actions)](#intermediate-tier-playwright-actions)
- [Intermediate Tier (Playwright Locators)](#intermediate-tier-playwright-locators)
- [Intermediate Tier (Playwright Assertions)](#intermediate-tier-playwright-assertions)
- [TypeScript Tier](#typescript-tier)
- [E2E Tier (POM)](#e2e-tier-pom)

---

## Basic Tier (CSS Selectors)

### css-selector-101-id-class - ID & Class Selectors

```css
#login-btn
```

### css-tag-selectors - Tag Name Selectors

```css
p
```

### css-combining-basics - Combining Selectors

```css
div.error
```

### css-foundations-boss - Scenario: Legacy App Testing

```css
button.btn.primary.large
```

### css-child-descendant - Child vs Descendant

```css
.nav-menu > li
```

### css-sibling-selectors - Sibling Selectors

```css
h1 + p
```

### css-family-drill - Drill: Deep Nesting

```css
.profile-card .card-content span
```

### css-navigation-boss - Scenario: Nested Navigation

```css
#user-menu .dropdown-list .action-item a
```

### css-attribute-selectors - Attribute Selectors

```css
[type="email"]
```

### css-validation-states - Form Validation States

```css
input:invalid
```

### css-functional-pseudo - Advanced Filtering (:not & :is)

```css
.user-card.active:not(.suspended)
```

### css-forms-boss - Scenario: Dynamic Forms

```css
input[type="tel"]:optional:not(:disabled)
```

### css-nth-child - Position Indexing (Nth-Child)

```css
li:nth-child(3)
```

### css-nth-type-vs-child - Nth-Type vs Nth-Child

```css
p:nth-of-type(2)
```

### css-table-drill - Table Cell Targeting

```css
tbody tr:nth-child(2) td:nth-child(3)
```

### css-table-boss - Scenario: Admin Grid

```css
tr:nth-child(odd) td:last-child button
```

### css-dynamic-elements - Handling Dynamic Elements

```css
li:nth-child(2) .del
```

---

## Basic Tier (XPath Selectors)

### xpath-basics-101 - XPath Basics

```xpath
//button
```

### xpath-attribute-matching - Attribute Matching

```xpath
//input[@type="password"]
```

### xpath-text-content - Text Content

```xpath
//button[text()="Add to Cart"]
```

### xpath-contains-starts-with - Contains & Starts-with

```xpath
//div[contains(@class, "error")]
```

### xpath-fundamentals-boss - Scenario: Legacy Login

```xpath
//form[contains(@class, "login")]//button[text()="Sign In"]
```

### xpath-parent-ancestor - Parent/Ancestor

```xpath
//a[text()="Settings"]/parent::li
```

### xpath-following-sibling - Following-sibling

```xpath
//label[text()="Username"]/following-sibling::input
```

### xpath-preceding-sibling - Preceding-sibling

```xpath
//span[@class="error"]/preceding-sibling::label
```

### xpath-traversal-boss - Scenario: Error Recovery

```xpath
//span[text()="Invalid email format"]/ancestor::div//input
```

### xpath-multiple-conditions - Multiple Conditions

```xpath
//button[@type="submit" and contains(@class, "primary")]
```

### xpath-position-indexing - Position & Indexing

```xpath
//ul/li[last()]
```

### xpath-normalize-space - Normalize-Space (Whitespace)

```xpath
//p[normalize-space()="Contact Us"]
```

### xpath-complex-table - Complex Table Selection

```xpath
//table//tr[td[1][text()="Alice"]]/td[3]
```

### xpath-axes-master - Axes Master

```xpath
//h3[text()="Scheduled"]/following-sibling::ul/li[last()]
```

### xpath-advanced-boss - Scenario: Dynamic Dashboard

```xpath
//div[contains(@class, "widget")]//span[normalize-space()="Error"]/ancestor::div[contains(@class, "card")]//button[text()="Retry"]
```

### selector-comparison-same-element - Same Element, Two Ways

```css
#add-to-cart
```

### selector-when-xpath-wins - When XPath Wins

```xpath
//button[text()="Submit Order"]
```

### selector-performance - Performance Consideration

```css
[data-testid="checkout-btn"]
```

### selector-comparison-boss - Scenario: Best Selector

```css
[data-product-id="prod-101"] .remove
```

---

## Beginner Tier (JavaScript)

### js-variables-types - Variables & Types

```javascript
const testName = "Login Test";
let passCount = 0;
passCount++;
const result = passCount;
```

### js-arrays-test-data - Arrays for Test Data

```javascript
const users = ["admin", "user", "guest"];
const result = users[1];
```

### js-objects-for-tests - Objects for Test Fixtures

```javascript
const testUser = {
  name: "Admin",
  role: "admin",
  active: true
};
const result = testUser.name;
```

### js-if-else-logic - Conditional Logic

```javascript
const score = 75;
let grade;
if (score >= 90) {
  grade = "A";
} else if (score >= 70) {
  grade = "B";
} else {
  grade = "C";
}
const result = grade;
```

### js-loops-testing - Loops for Testing

```javascript
const items = ["apple", "banana", "cherry"];
let result = "";
for (const item of items) {
  result += item + " ";
}
```

### js-functions-basics - Functions

```javascript
function greet(name) {
  return "Hello, " + name + "!";
}
const result = greet("Tester");
```

### js-arrow-functions - Arrow Functions

```javascript
const double = (x) => x * 2;
const result = double(5);
```

### js-array-methods - Array Methods

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const result = doubled;
```

### js-string-methods - String Methods

```javascript
const text = "  Hello World  ";
const result = text.trim().toLowerCase();
```

### js-destructuring - Destructuring

```javascript
const user = { name: "Alice", age: 30, role: "admin" };
const { name, role } = user;
const result = `${name} is ${role}`;
```

### js-fundamentals-boss - Boss: Test Data Generator

```javascript
function createTestUser(id) {
  return {
    id: id,
    email: `user_${id}@test.com`,
    username: `testuser_${id}`,
    createdAt: new Date().toISOString()
  };
}
const result = createTestUser(5);
```

---

## Beginner Tier (DOM)

### dom-queryselector-vs-all - querySelector vs querySelectorAll

```javascript
const items = document.querySelectorAll('.item');
const result = items.length;
```

### dom-element-properties - Element Properties

```javascript
const heading = document.querySelector('h1');
const result = heading.textContent;
```

### dom-check-element-state - Check Element State

```javascript
const btn = document.querySelector('#submit');
const result = !btn.disabled;
```

### dom-parent-child-navigation - Parent/Child Navigation

```javascript
const child = document.querySelector('.child');
const result = child.parentElement.className;
```

### dom-event-listeners - Event Listeners

```javascript
const btn = document.querySelector('#btn');
btn.click();
const result = document.querySelector('#status').textContent;
```

### dom-form-interaction - Form Interaction

```javascript
const input = document.querySelector('#username');
input.value = 'testuser';
const result = input.value;
```

### dom-table-data-extraction - Table Data Extraction

```javascript
const cells = document.querySelectorAll('tbody td');
const result = Array.from(cells).map(c => c.textContent);
```

### dom-wait-for-element - Wait for Element

```javascript
// Uses polling pattern
const el = document.querySelector('#dynamic');
const result = el ? el.textContent : 'not found';
```

### dom-boss - Boss: Dashboard Scraper

```javascript
const cards = document.querySelectorAll('.card');
const result = Array.from(cards).map(card => ({
  title: card.querySelector('h3').textContent,
  value: card.querySelector('.value').textContent
}));
```

---

## Beginner Tier (Async)

### async-understanding-promises - Understanding Promises

```javascript
const result = await fetchData();
```

### async-await-basics - Async/Await Basics

```javascript
async function getData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}
const result = await getData();
```

### async-error-handling - Error Handling

```javascript
try {
  const result = await riskyOperation();
} catch (error) {
  console.error('Failed:', error.message);
}
```

### async-parallel-execution - Parallel Execution

```javascript
const [users, products] = await Promise.all([
  fetchUsers(),
  fetchProducts()
]);
const result = { users, products };
```

### async-testing-patterns - Testing Patterns

```javascript
async function retryUntil(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxAttempts - 1) throw e;
    }
  }
}
```

### async-boss - Boss: API Aggregator

```javascript
const [users, orders, stats] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
  fetchStats()
]);
const result = {
  totalUsers: users.length,
  totalOrders: orders.length,
  revenue: stats.revenue
};
```

---

## Intermediate Tier (Playwright Actions)

### pw-click-actions - Click Actions

```javascript
import { test, expect } from '@playwright/test';

test('click and verify', async ({ page }) => {
  await page.click('#increment');
  await expect(page.locator('#count')).toHaveText('1');
});
```

### pw-fill-type - Fill & Type

```javascript
import { test, expect } from '@playwright/test';

test('fill username', async ({ page }) => {
  await page.fill('#username', 'testuser');
  await expect(page.locator('#username')).toHaveValue('testuser');
});
```

### pw-select-dropdowns - Select Dropdowns

```javascript
import { test, expect } from '@playwright/test';

test('select dropdown', async ({ page }) => {
  await page.selectOption('#country', 'us');
  await expect(page.locator('#country')).toHaveValue('us');
});
```

### pw-checkbox-radio - Checkbox & Radio

```javascript
import { test, expect } from '@playwright/test';

test('check and verify', async ({ page }) => {
  await page.check('#agree');
  await expect(page.locator('#agree')).toBeChecked();
});
```

### pw-keyboard-actions - Keyboard Actions

```javascript
import { test, expect } from '@playwright/test';

test('keyboard', async ({ page }) => {
  await page.fill('#search', 'playwright');
  await page.press('#search', 'Enter');
  await expect(page.locator('#results')).toBeVisible();
});
```

### pw-hover-focus - Hover & Focus

```javascript
import { test, expect } from '@playwright/test';

test('hover', async ({ page }) => {
  await page.hover('#menu');
  await expect(page.locator('#dropdown')).toBeVisible();
});
```

### pw-file-upload - File Upload

```javascript
import { test, expect } from '@playwright/test';

test('upload file', async ({ page }) => {
  await page.setInputFiles('#upload', 'test.txt');
  await expect(page.locator('#file-name')).toHaveText('test.txt');
});
```

### pw-drag-drop - Drag and Drop

```javascript
import { test, expect } from '@playwright/test';

test('drag and drop', async ({ page }) => {
  await page.locator('#source').dragTo(page.locator('#target'));
  await expect(page.locator('#target')).toContainText('Dropped!');
});
```

### pw-iframes - Working with Iframes

```javascript
import { test, expect } from '@playwright/test';

test('interact with iframe', async ({ page }) => {
  const frame = page.frameLocator('#payment-frame');
  await frame.locator('#card').fill('4111111111111111');
  await expect(frame.locator('#card')).toHaveValue('4111111111111111');
});
```

### pw-dynamic-table - Dynamic Table

```javascript
import { test, expect } from '@playwright/test';

test('table row', async ({ page }) => {
  const row = page.locator('tr').filter({ hasText: 'Alice' });
  await expect(row.locator('.status')).toHaveText('Active');
});
```

### pw-actions-boss - Scenario: E-Commerce Checkout

```javascript
import { test, expect } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  await page.fill('#email', 'test@test.com');
  await page.fill('#card', '4111111111111111');
  await page.selectOption('#expiry-month', '12');
  await page.selectOption('#expiry-year', '2025');
  await page.fill('#cvv', '123');
  await page.check('#terms');
  await page.click('#place-order');
  await expect(page.locator('#confirmation')).toBeVisible();
});
```

---

## Intermediate Tier (Playwright Locators)

### pw-locator-intro - Locator Intro

```javascript
import { test, expect } from '@playwright/test';

test('locator basics', async ({ page }) => {
  const btn = page.locator('#submit');
  await btn.click();
  await expect(page.locator('#result')).toBeVisible();
});
```

### pw-get-by-role - getByRole

```javascript
import { test, expect } from '@playwright/test';

test('role locator', async ({ page }) => {
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('#msg')).toHaveText('Submitted!');
});
```

### pw-get-by-text - getByText

```javascript
import { test, expect } from '@playwright/test';

test('text locator', async ({ page }) => {
  await page.getByText('Learn more').click();
  await expect(page).toHaveURL(/\/about/);
});
```

### pw-get-by-label - getByLabel

```javascript
import { test, expect } from '@playwright/test';

test('label locator', async ({ page }) => {
  await page.getByLabel('Email').fill('test@example.com');
  await expect(page.getByLabel('Email')).toHaveValue('test@example.com');
});
```

### pw-get-by-placeholder - getByPlaceholder

```javascript
import { test, expect } from '@playwright/test';

test('placeholder locator', async ({ page }) => {
  await page.getByPlaceholder('Search...').fill('playwright');
  await expect(page.locator('#results')).toBeVisible();
});
```

### pw-get-by-testid - getByTestId

```javascript
import { test, expect } from '@playwright/test';

test('testid locator', async ({ page }) => {
  await page.getByTestId('submit-btn').click();
  await expect(page.getByTestId('success-msg')).toBeVisible();
});
```

### pw-locator-chaining - Locator Chaining

```javascript
import { test, expect } from '@playwright/test';

test('chained locator', async ({ page }) => {
  await page.locator('.card').filter({ hasText: 'Premium' }).getByRole('button').click();
  await expect(page.locator('#msg')).toHaveText('Premium selected!');
});
```

### pw-frame-locators - Frame Locators

```javascript
import { test, expect } from '@playwright/test';

test('frame locator', async ({ page }) => {
  const frame = page.frameLocator('#editor-frame');
  await frame.locator('#content').fill('Hello World');
  await expect(frame.locator('#content')).toHaveValue('Hello World');
});
```

### pw-list-items - List Items

```javascript
import { test, expect } from '@playwright/test';

test('count items', async ({ page }) => {
  await expect(page.locator('.todo-list li')).toHaveCount(5);
});
```

### pw-locators-boss - Scenario: Dynamic Product Grid

```javascript
import { test, expect } from '@playwright/test';

test('dynamic filter', async ({ page }) => {
  const product = page.locator('.product')
    .filter({ hasText: 'Pro' })
    .filter({ hasText: 'In Stock' });
  
  await product.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.locator('#msg')).toHaveText('Added Widget Pro!');
});
```

---

## Intermediate Tier (Playwright Assertions)

### pw-to-be-visible - toBeVisible & toBeHidden

```javascript
import { test, expect } from '@playwright/test';

test('check visibility', async ({ page }) => {
  await page.getByRole('button', { name: 'Show Modal' }).click();
  await expect(page.locator('#modal')).toBeVisible();
});
```

### pw-to-have-text - toHaveText

```javascript
import { test, expect } from '@playwright/test';

test('text assertions', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Hello World');
  await expect(page.locator('p')).toContainText('Playwright');
});
```

### pw-to-have-value - toHaveValue

```javascript
import { test, expect } from '@playwright/test';

test('check input value', async ({ page }) => {
  const email = page.locator('#email');
  await email.fill('test@example.com');
  await expect(email).toHaveValue('test@example.com');
});
```

### pw-state-assertions - State Assertions

```javascript
import { test, expect } from '@playwright/test';

test('check states', async ({ page }) => {
  await page.check('#terms');
  await expect(page.locator('#terms')).toBeChecked();
  await expect(page.locator('#submit')).toBeEnabled();
});
```

### pw-to-have-attribute - toHaveAttribute

```javascript
import { test, expect } from '@playwright/test';

test('check attributes', async ({ page }) => {
  await expect(page.locator('a')).toHaveAttribute('href', '/about');
  await expect(page.locator('img')).toHaveAttribute('alt');
});
```

### pw-to-have-count - toHaveCount

```javascript
import { test, expect } from '@playwright/test';

test('check count', async ({ page }) => {
  const items = page.locator('#list li');
  await expect(items).toHaveCount(4);
  await page.click('#add');
  await expect(items).toHaveCount(5);
});
```

### pw-soft-assertions - Soft Assertions

```javascript
import { test, expect } from '@playwright/test';

test('soft assertions', async ({ page }) => {
  await expect.soft(page.locator('#name-status')).toBeVisible();
  await expect.soft(page.locator('#email-status')).toBeVisible();
  await expect.soft(page.locator('#pass-status')).toBeVisible();
});
```

### pw-assertions-boss - Scenario: Form Validation Suite

```javascript
import { test, expect } from '@playwright/test';

test('form validation', async ({ page }) => {
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('.hint')).toBeVisible();
  await expect(page.locator('#submit')).toBeDisabled();
  
  await page.fill('#email', 'test@test.com');
  await page.fill('#password', 'password123');
  
  await expect(page.locator('#submit')).toBeEnabled();
});
```

---

## TypeScript Tier

### ts-type-annotations - Type Annotations (Clean Code)

**Expected Output:**

```
10
```

### ts-function-types - Function Types

**Expected Output:**

```
Score: 85
```

### ts-interfaces-basics - Interfaces Basics

**Expected Output:**

```
120
```

### ts-union-types - Union Types

**Expected Output:**

```
high
```

### ts-optional-properties - Optional Properties (Edge Case)

**Expected Output:**

```
0
```

### ts-type-aliases - Type Aliases

**Expected Output:**

```
30
```

### ts-type-inference - Type Inference

**Expected Output:**

```
string
```

### ts-generics-intro - Generics (API Helper)

**Expected Output:**

```
abc-123
```

### ts-utility-types - Utility Types: Partial

**Expected Output:**

```
5
```

### ts-fundamentals-boss - Boss: The User Factory

**Expected Output:**

```
user_5@test.com
```

---

## E2E Tier (POM)

### pom-login-basics - POM Basics: Successful Login

```javascript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('testuser', 'password123');
  await expect(page.locator('#welcome-message')).toContainText('Welcome, testuser!');
});
```

### pom-login-failures - POM: Testing Failures

```javascript
import { test, expect } from '@playwright/test';

test('should show error for invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('wronguser', 'wrongpass');
  
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(page).toHaveURL('/app/login.html');
});
```

### pom-multi-page - POM: Multi-Page User Journey

```javascript
import { test, expect } from '@playwright/test';

test('should update profile name', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  const dashboardPage = await loginPage.login('testuser', 'password123');

  const profilePage = await dashboardPage.goToProfile();
  await profilePage.updateName('QA Tester');
  
  const dashboardAgain = await profilePage.backToDashboard();
  await expect(dashboardAgain.welcomeMsg).toContainText('Welcome, QA Tester');
});
```
