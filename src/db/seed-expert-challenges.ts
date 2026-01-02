/**
 * Expert Tier Challenges Seed Script
 * 
 * Seeds the database with Expert tier Playwright challenges.
 * Run with: bun run db:seed:expert
 */

import { db } from './index';
import { challenges, testCases, tutorials } from './schema';
import { eq, inArray } from 'drizzle-orm';

// Helper to get tutorial ID
async function getTutorialId(slug: string) {
  const result = await db.select({ id: tutorials.id }).from(tutorials).where(eq(tutorials.slug, slug));
  return result[0]?.id || null;
}

// ============================================================================
// PAGE OBJECT MODEL CHALLENGES (5)
// ============================================================================

export const pomChallenges = [
  {
    slug: 'pw-first-page-object',
    title: 'First Page Object',
    description: 'Create your first Page Object class.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 80,
    order: 801,
    instructions: `# First Page Object

Create a basic Page Object Model class!

## What is POM?

Page Object Model separates page structure from tests:

\`\`\`javascript
class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.submitButton = page.locator('#submit');
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}
\`\`\`

## Benefits

- **Reusability** - Use same page in multiple tests
- **Maintainability** - Change selector in one place
- **Readability** - Tests read like user stories

## Your Task
1. Create a LoginPage class
2. Use it to login with test credentials
3. Return the success message
`,
    htmlContent: `<div class="login-page">
  <h1>Login</h1>
  <form id="login-form">
    <input type="email" id="email" placeholder="Email" />
    <input type="password" id="password" placeholder="Password" />
    <button type="button" id="submit" onclick="document.getElementById('message').textContent = 'Welcome, test@qa.com!'">Login</button>
  </form>
  <div id="message"></div>
</div>`,
    starterCode: `// Define the Page Object
class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.submitButton = page.locator('#submit');
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}

// Use the Page Object
const loginPage = new LoginPage(page);
await loginPage.login('test@qa.com', 'password123');

// Get result
const result = await page.locator('#message').textContent();`,
    expectedOutput: 'Welcome, test@qa.com!',
    tags: ['playwright', 'pom', 'page-object', 'expert'],
  },
  {
    slug: 'pw-encapsulate-actions',
    title: 'Encapsulate Actions',
    description: 'Create meaningful methods for user flows.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 85,
    order: 802,
    instructions: `# Encapsulate Actions

Create methods that represent user workflows!

## Action Methods

\`\`\`javascript
class ProductPage {
    async addToCart(quantity = 1) {
        await this.quantityInput.fill(String(quantity));
        await this.addButton.click();
    }

    async selectSize(size) {
        await this.sizeDropdown.selectOption(size);
    }

    async getPrice() {
        return await this.priceLabel.textContent();
    }
}
\`\`\`

## Best Practices

- Methods should do one thing well
- Use descriptive names
- Return useful values when needed

## Your Task
1. Create a CartPage with addItem and getTotal methods
2. Add 2 items to cart
3. Return the cart total
`,
    htmlContent: `<div class="cart-page">
  <div id="items"></div>
  <button id="add-item" onclick="addItem()">Add Item ($10)</button>
  <div id="total">Total: $0</div>
</div>
<script>
  let total = 0;
  function addItem() {
    total += 10;
    document.getElementById('total').textContent = 'Total: $' + total;
  }
</script>`,
    starterCode: `// Define CartPage with encapsulated actions
class CartPage {
    constructor(page) {
        this.page = page;
        this.addButton = page.locator('#add-item');
        this.totalLabel = page.locator('#total');
    }

    async addItem() {
        await this.addButton.click();
    }

    async getTotal() {
        return await this.totalLabel.textContent();
    }
}

// Use the Page Object
const cartPage = new CartPage(page);
await cartPage.addItem();
await cartPage.addItem();

// Get result
const result = await cartPage.getTotal();`,
    expectedOutput: 'Total: $20',
    tags: ['playwright', 'pom', 'actions', 'expert'],
  },
  {
    slug: 'pw-page-components',
    title: 'Page Components',
    description: 'Create reusable UI components.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 90,
    order: 803,
    instructions: `# Page Components

Extract reusable UI components!

## Component Pattern

\`\`\`javascript
class SearchComponent {
    constructor(page) {
        this.container = page.locator('.search-box');
        this.input = this.container.locator('input');
        this.button = this.container.locator('button');
    }

    async search(term) {
        await this.input.fill(term);
        await this.button.click();
    }
}
\`\`\`

## Use in Pages

\`\`\`javascript
class HomePage {
    constructor(page) {
        this.search = new SearchComponent(page);
        this.navigation = new NavComponent(page);
    }
}
\`\`\`

## Your Task
1. Create a HeaderComponent with logout method
2. Create a DashboardPage that uses HeaderComponent
3. Click logout and return the result
`,
    htmlContent: `<div class="dashboard">
  <header class="header">
    <span class="user">John Doe</span>
    <button id="logout" onclick="document.getElementById('status').textContent = 'Logged out!'">Logout</button>
  </header>
  <main>
    <h1>Dashboard</h1>
    <div id="status"></div>
  </main>
</div>`,
    starterCode: `// Reusable Header Component
class HeaderComponent {
    constructor(page) {
        this.container = page.locator('.header');
        this.logoutButton = this.container.locator('#logout');
        this.userName = this.container.locator('.user');
    }

    async logout() {
        await this.logoutButton.click();
    }

    async getUserName() {
        return await this.userName.textContent();
    }
}

// Dashboard Page using component
class DashboardPage {
    constructor(page) {
        this.page = page;
        this.header = new HeaderComponent(page);
        this.status = page.locator('#status');
    }

    async getStatus() {
        return await this.status.textContent();
    }
}

// Use composed page object
const dashboard = new DashboardPage(page);
await dashboard.header.logout();

const result = await dashboard.getStatus();`,
    expectedOutput: 'Logged out!',
    tags: ['playwright', 'pom', 'components', 'expert'],
  },
  {
    slug: 'pw-fluent-navigation',
    title: 'Page Navigation Pattern',
    description: 'Implement method chaining between pages.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 95,
    order: 804,
    instructions: `# Page Navigation Pattern

Methods should return the next page!

## Fluent Navigation

\`\`\`javascript
class LoginPage {
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        return new DashboardPage(this.page);
    }
}

// Usage
const dashboard = await loginPage.login('user', 'pass');
await dashboard.doSomething();
\`\`\`

## Benefits

- Clear flow between pages
- Type safety (with TypeScript)
- Self-documenting tests

## Your Task
1. Login should return HomePage
2. HomePage should have getWelcomeMessage 
3. Chain the calls and return the message
`,
    htmlContent: `<div id="app">
  <div id="login-view">
    <input id="email" placeholder="Email" />
    <input id="password" type="password" placeholder="Password" />
    <button id="login-btn" onclick="showHome()">Login</button>
  </div>
  <div id="home-view" style="display:none;">
    <h1 id="welcome">Welcome back!</h1>
  </div>
</div>
<script>
  function showHome() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('home-view').style.display = 'block';
  }
</script>`,
    starterCode: `// HomePage returned after login
class HomePage {
    constructor(page) {
        this.page = page;
        this.welcomeText = page.locator('#welcome');
    }

    async getWelcomeMessage() {
        return await this.welcomeText.textContent();
    }
}

// LoginPage returns HomePage
class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('#login-btn');
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        return new HomePage(this.page);
    }
}

// Chain navigation
const loginPage = new LoginPage(page);
const homePage = await loginPage.login('test@qa.com', 'pass');
const result = await homePage.getWelcomeMessage();`,
    expectedOutput: 'Welcome back!',
    tags: ['playwright', 'pom', 'navigation', 'fluent', 'expert'],
  },
  {
    slug: 'pw-base-page-class',
    title: 'Base Page Class',
    description: 'Use inheritance for common actions.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 100,
    order: 805,
    instructions: `# Base Page Class

Share common functionality via inheritance!

## Base Class Pattern

\`\`\`javascript
class BasePage {
    constructor(page) {
        this.page = page;
    }

    async getTitle() {
        return await this.page.title();
    }

    async waitForLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    async screenshot(name) {
        await this.page.screenshot({ path: name });
    }
}

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.emailInput = page.locator('#email');
    }
}
\`\`\`

## Your Task
1. Create BasePage with getPageTitle method
2. Create ProductPage extending BasePage
3. Call inherited method and return title
`,
    htmlContent: `<html>
  <head><title>Product Details</title></head>
  <body>
    <div class="product-page">
      <h1>Amazing Widget</h1>
      <p class="price">$99.99</p>
      <button id="buy">Buy Now</button>
    </div>
  </body>
</html>`,
    starterCode: `// Base class with common methods
class BasePage {
    constructor(page) {
        this.page = page;
    }

    async getPageTitle() {
        return await this.page.title();
    }

    async waitForReady() {
        await this.page.waitForLoadState('domcontentloaded');
    }
}

// ProductPage inherits from BasePage
class ProductPage extends BasePage {
    constructor(page) {
        super(page);
        this.productName = page.locator('h1');
        this.price = page.locator('.price');
        this.buyButton = page.locator('#buy');
    }

    async getProductName() {
        return await this.productName.textContent();
    }
}

// Use inherited method
const productPage = new ProductPage(page);
const result = await productPage.getPageTitle();`,
    expectedOutput: 'Product Details',
    tags: ['playwright', 'pom', 'inheritance', 'base-class', 'expert'],
  },

  // Challenge 6: POM Boss
  {
    slug: 'pw-pom-boss',
    title: 'Scenario: Full E2E with Multi-Page POM',
    description: 'Build a complete Page Object system for an e-commerce flow.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-pom',
    xpReward: 120,
    order: 806,
    instructions: `# Scenario: Full E2E with Multi-Page POM

Build a complete Page Object architecture for an e-commerce checkout flow.

## The Challenge

Create POMs for:
1. **ProductPage** - Add item to cart
2. **CartPage** - View cart, proceed to checkout
3. **CheckoutPage** - Complete order

Navigate through all pages using fluent patterns and return the order confirmation.

## Your Mission

Chain all page objects together in a realistic e-commerce flow!

> **Tip:** Each page should return the next page for fluent navigation!
`,
    htmlContent: `<div id="app">
  <div id="product-page">
    <h1>Widget Pro</h1>
    <button id="add-to-cart" onclick="showCart()">Add to Cart</button>
  </div>
  <div id="cart-page" style="display:none;">
    <h2>Your Cart</h2>
    <p>Widget Pro x1</p>
    <button id="checkout" onclick="showCheckout()">Checkout</button>
  </div>
  <div id="checkout-page" style="display:none;">
    <h2>Checkout</h2>
    <button id="place-order" onclick="showConfirmation()">Place Order</button>
  </div>
  <div id="confirmation" style="display:none;">
    <h2>Order #12345 Confirmed!</h2>
  </div>
</div>
<script>
  function showCart() {
    document.getElementById('product-page').style.display = 'none';
    document.getElementById('cart-page').style.display = 'block';
  }
  function showCheckout() {
    document.getElementById('cart-page').style.display = 'none';
    document.getElementById('checkout-page').style.display = 'block';
  }
  function showConfirmation() {
    document.getElementById('checkout-page').style.display = 'none';
    document.getElementById('confirmation').style.display = 'block';
  }
</script>`,
    starterCode: `// Page Objects
class ProductPage {
    constructor(page) { this.page = page; }
    // Implement addToCart...
}

class CartPage {
    constructor(page) { this.page = page; }
    // Implement checkout...
}

class CheckoutPage {
    constructor(page) { this.page = page; }
    // Implement placeOrder...
}

// E2E Flow
const productPage = new ProductPage(page);

// Chain the flow...

const result = "";`,
    expectedOutput: 'Order #12345 Confirmed!',
    tags: ['playwright', 'pom', 'e2e', 'scenario', 'boss', 'expert'],
  },
];

// ============================================================================
// DATA-DRIVEN TESTING CHALLENGES (5)
// ============================================================================

export const dataDrivenChallenges = [
  {
    slug: 'pw-parameterized-tests',
    title: 'Parameterized Tests',
    description: 'Run same test with different data.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 75,
    order: 901,
    instructions: `# Parameterized Tests

Run the same test with different inputs!

## Test.each Pattern

\`\`\`javascript
const testCases = [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
];

for (const { input, expected } of testCases) {
    // Run test with each data set
    await page.fill('#input', input);
    await page.click('#uppercase');
    const result = await page.locator('#output').textContent();
    console.log(result === expected ? 'PASS' : 'FAIL');
}
\`\`\`

## Your Task
1. Define test data for 3 calculations
2. Loop through and verify each
3. Return count of passed tests
`,
    htmlContent: `<div class="calculator">
  <input id="num1" type="number" placeholder="Number 1" />
  <input id="num2" type="number" placeholder="Number 2" />
  <button id="add" onclick="document.getElementById('result').textContent = Number(document.getElementById('num1').value) + Number(document.getElementById('num2').value)">Add</button>
  <div id="result"></div>
</div>`,
    starterCode: `// Test data
const testCases = [
    { a: 2, b: 3, expected: '5' },
    { a: 10, b: 5, expected: '15' },
    { a: 0, b: 0, expected: '0' },
];

let passed = 0;

// Run parameterized tests - Write your loop here!


const result = String(passed);`,
    expectedOutput: '3',
    tags: ['playwright', 'data-driven', 'parameterized', 'expert'],
  },
  {
    slug: 'pw-test-data-json',
    title: 'Test Data from JSON',
    description: 'Load test data from external files.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 80,
    order: 902,
    instructions: `# Test Data from JSON

Externalize your test data!

## JSON Data File

\`\`\`json
// users.json
[
    { "email": "user1@test.com", "name": "User One" },
    { "email": "user2@test.com", "name": "User Two" }
]
\`\`\`

## Load in Tests

\`\`\`javascript
const users = require('./users.json');
// or: import users from './users.json';

for (const user of users) {
    await test.step(\`Test user: \${user.name}\`, async () => {
        // Test with this user's data
    });
}
\`\`\`

## Your Task
1. Use the provided user data
2. Fill the form for last user
3. Return the greeting
`,
    htmlContent: `<div class="greeting-app">
  <input id="name" placeholder="Enter name" />
  <button id="greet" onclick="document.getElementById('greeting').textContent = 'Hello, ' + document.getElementById('name').value + '!'">Greet</button>
  <div id="greeting"></div>
</div>`,
    starterCode: `// Simulated JSON data (normally loaded from file)
const usersData = [
    { name: "Alice", role: "Admin" },
    { name: "Bob", role: "Editor" },
    { name: "Charlie", role: "Viewer" }
];

// Use last user from data to fill the form
// Your code here

const result = await page.locator('#greeting').textContent();`,
    expectedOutput: 'Hello, Charlie!',
    tags: ['playwright', 'data-driven', 'json', 'expert'],
  },
  {
    slug: 'pw-csv-test-data',
    title: 'CSV Test Data',
    description: 'Use tabular data for tests.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 85,
    order: 903,
    instructions: `# CSV Test Data

Tabular data for comprehensive testing!

## Parse CSV

\`\`\`javascript
const csv = \`name,email,expected
Alice,alice@test.com,Welcome Alice
Bob,bob@test.com,Welcome Bob\`;

const rows = csv.split('\\n').slice(1);
const data = rows.map(row => {
    const [name, email, expected] = row.split(',');
    return { name, email, expected };
});
\`\`\`

## Benefits

- Easy to edit in spreadsheets
- Non-technical friendly
- Bulk test cases

## Your Task
1. Parse the CSV data
2. Test with the second row
3. Return the welcome message
`,
    htmlContent: `<div class="welcome-app">
  <input id="username" placeholder="Username" />
  <button id="welcome" onclick="document.getElementById('message').textContent = 'Welcome ' + document.getElementById('username').value">Welcome</button>
  <div id="message"></div>
</div>`,
    starterCode: `// CSV data (normally from file)
const csvData = \`name,role,expected
Alice,Admin,Welcome Alice
Bob,Editor,Welcome Bob
Charlie,Viewer,Welcome Charlie\`;

// 1. Parse CSV
// Your code here

// 2. Test with second row
// Your code here

const result = await page.locator('#message').textContent();`,
    expectedOutput: 'Welcome Bob',
    tags: ['playwright', 'data-driven', 'csv', 'expert'],
  },
  {
    slug: 'pw-dynamic-data',
    title: 'Dynamic Data Generation',
    description: 'Generate test data with Faker.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 90,
    order: 904,
    instructions: `# Dynamic Data Generation

Generate realistic test data!

## Using Faker.js

\`\`\`javascript
import { faker } from '@faker-js/faker';

const user = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
};
\`\`\`

## Benefits

- Unique data each run
- Realistic values
- Edge case discovery

## Simulated Faker

\`\`\`javascript
function generateEmail() {
    const id = Math.random().toString(36).substr(2, 5);
    return \`user_\${id}@test.com\`;
}
\`\`\`

## Your Task
1. Generate a random username
2. Submit the form
3. Return the confirmation
`,
    htmlContent: `<div class="signup">
  <input id="username" placeholder="Username" />
  <button id="signup" onclick="document.getElementById('confirm').textContent = 'Registered: ' + document.getElementById('username').value">Sign Up</button>
  <div id="confirm"></div>
</div>`,
    starterCode: `// Dynamic data generator (simulated Faker)
function generateUsername() {
    const adjectives = ['Quick', 'Smart', 'Cool', 'Fast'];
    const nouns = ['Fox', 'Bear', 'Eagle', 'Wolf'];
    // Implement random username generation
    return "User_123"; 
}

// Use generated data
// Your code here

// The result will start with "Registered: "
const text = await page.locator('#confirm').textContent();
const result = text.startsWith('Registered: ') ? 'success' : 'failed';`,
    expectedOutput: 'success',
    tags: ['playwright', 'data-driven', 'faker', 'dynamic', 'expert'],
  },
  {
    slug: 'pw-environment-data',
    title: 'Environment-Based Data',
    description: 'Different data per environment.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 100,
    order: 905,
    instructions: `# Environment-Based Data

Different data for dev/staging/prod!

## Config Pattern

\`\`\`javascript
const config = {
    dev: {
        baseURL: 'http://localhost:3000',
        user: { email: 'dev@test.com' }
    },
    staging: {
        baseURL: 'https://staging.example.com',
        user: { email: 'staging@test.com' }
    },
    prod: {
        baseURL: 'https://example.com',
        user: { email: 'prod@test.com' }
    }
};

const env = process.env.TEST_ENV || 'dev';
const { baseURL, user } = config[env];
\`\`\`

## Your Task
1. Select config based on environment
2. Use the correct user email
3. Return the environment name
`,
    htmlContent: `<div class="env-app">
  <input id="env" placeholder="Environment" />
  <input id="email" placeholder="Email" />
  <button id="login" onclick="document.getElementById('status').textContent = 'Logged into ' + document.getElementById('env').value">Login</button>
  <div id="status"></div>
</div>`,
    starterCode: `// Environment configs
const envConfig = {
    dev: { url: 'localhost', email: 'dev@test.com' },
    staging: { url: 'staging.app.com', email: 'staging@test.com' },
    prod: { url: 'app.com', email: 'prod@test.com' }
};

// Select environment (simulated)
const currentEnv = 'staging';

// Select correct config and fill form
// Your code here

const result = await page.locator('#status').textContent();`,
    expectedOutput: 'Logged into staging',
    tags: ['playwright', 'data-driven', 'environment', 'config', 'expert'],
  },

  // Challenge 6: Data-Driven Boss
  {
    slug: 'pw-data-driven-boss',
    title: 'Scenario: Cross-Browser Data Suite',
    description: 'Run comprehensive data-driven tests across multiple scenarios.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-data-driven',
    xpReward: 110,
    order: 906,
    instructions: `# Scenario: Cross-Browser Data Suite

Build a comprehensive test suite that combines multiple data sources.

## The Challenge

1. Load user credentials from JSON-like data
2. Load test scenarios from CSV-like data
3. Run all combinations and count passing tests
4. All 4 tests should pass

## Your Mission

Combine parameterized testing with external data to create a robust test suite!

> **Tip:** Nested loops for user × scenario combinations!
`,
    htmlContent: `<div class="login-app">
  <input id="email" placeholder="Email" />
  <input id="password" type="password" placeholder="Password" />
  <button id="login" onclick="tryLogin()">Login</button>
  <div id="result"></div>
</div>
<script>
  const validUsers = ['alice@test.com', 'bob@test.com'];
  function tryLogin() {
    const email = document.getElementById('email').value;
    const isValid = validUsers.includes(email);
    document.getElementById('result').textContent = isValid ? 'Success' : 'Failed';
  }
</script>`,
    starterCode: `// User data (JSON-like)
const users = [
    { email: 'alice@test.com', password: 'pass1' },
    { email: 'bob@test.com', password: 'pass2' }
];

// Test scenarios (CSV-like)
const scenarios = ['login', 'verify'];

let passed = 0;

// Run data-driven tests
// Tip: Use nested loops to run each scenario for each user

const result = String(passed);`,
    expectedOutput: '4',
    tags: ['playwright', 'data-driven', 'scenario', 'boss', 'expert'],
  },
];

// ============================================================================
// ADVANCED PATTERNS CHALLENGES (8)
// ============================================================================

export const advancedPatternsChallenges = [
  {
    slug: 'pw-api-ui-testing',
    title: 'API + UI Testing',
    description: 'Combine API and UI testing approaches.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 100,
    order: 1101,
    instructions: `# API + UI Testing

Hybrid testing for efficiency!

## Use API for Speed

\`\`\`javascript
// Fast setup via API
const response = await request.post('/api/users', {
    data: { name: 'Test User', email: 'test@qa.com' }
});
const userId = response.json().id;

// UI verification
await page.goto(\`/users/\${userId}\`);
await expect(page.locator('h1')).toHaveText('Test User');
\`\`\`

## Your Task
1. Create data via "API" (simulated)
2. Verify it appears in UI
3. Return confirmation
`,
    htmlContent: `<div id="app">
  <button id="create-api" onclick="createViaApi()">Create via API</button>
  <div id="user-display" style="display:none;">
    <h2 id="user-name"></h2>
    <p>Created via API!</p>
  </div>
</div>
<script>
  function createViaApi() {
    document.getElementById('user-name').textContent = 'API User';
    document.getElementById('user-display').style.display = 'block';
  }
</script>`,
    starterCode: `// Simulate API call with click (in real tests, use request)
// Your code here

// UI verification
// Your code here

const result = ""; // Set result based on verification`,
    expectedOutput: 'hybrid-success',
    tags: ['playwright', 'api', 'hybrid', 'expert'],
  },
  {
    slug: 'pw-state-setup-api',
    title: 'State Setup via API',
    description: 'Bypass UI for faster test setup.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 110,
    order: 1102,
    instructions: `# State Setup via API

Skip slow UI flows for setup!

## Login via API

\`\`\`javascript
// Instead of filling login form...
const response = await request.post('/api/login', {
    data: { email: 'user@test.com', password: 'pass' }
});
const { token } = await response.json();

// Set auth state
await page.evaluate(token => {
    localStorage.setItem('authToken', token);
}, token);
\`\`\`

## Your Task
1. Set authentication state directly
2. Access protected content
3. Return the protected message
`,
    htmlContent: `<div id="app">
  <div id="login-view">
    <button id="set-auth" onclick="setAuth()">Set Auth State</button>
  </div>
  <div id="protected" style="display:none;">
    <h1>Protected Content</h1>
    <p id="message">Welcome, authenticated user!</p>
  </div>
</div>
<script>
  function setAuth() {
    localStorage.setItem('isAuthenticated', 'true');
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('protected').style.display = 'block';
  }
</script>`,
    starterCode: `// Set auth state via "API" (simulated)
// Your code here

// Access protected content
const result = await page.locator('#message').textContent();`,
    expectedOutput: 'Welcome, authenticated user!',
    tags: ['playwright', 'api', 'setup', 'expert'],
  },
  {
    slug: 'pw-screenshot-failure',
    title: 'Screenshot on Failure',
    description: 'Capture screenshots for debugging.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-infrastructure',
    xpReward: 90,
    order: 1001,
    instructions: `# Screenshot on Failure

Capture evidence for debugging!

## Auto Screenshots

\`\`\`javascript
// playwright.config.ts
use: {
    screenshot: 'only-on-failure',
}
\`\`\`

## Manual Screenshots

\`\`\`javascript
await page.screenshot({ path: 'debug.png' });
await page.screenshot({ path: 'full.png', fullPage: true });
await element.screenshot({ path: 'element.png' });
\`\`\`

## Your Task
1. Perform an action
2. Take a screenshot (simulated)
3. Return confirmation
`,
    htmlContent: `<div id="app">
  <button id="action" onclick="doAction()">Do Action</button>
  <div id="result"></div>
</div>
<script>
  function doAction() {
    document.getElementById('result').textContent = 'Screenshot: captured';
  }
</script>`,
    starterCode: `// Perform action
// Your code here

// In real tests: await page.screenshot({ path: 'test.png' })
// Simulated screenshot capture

const result = await page.locator('#result').textContent();`,
    expectedOutput: 'Screenshot: captured',
    tags: ['playwright', 'screenshot', 'debugging', 'expert'],
  },
  {
    slug: 'pw-video-recording',
    title: 'Video Recording',
    description: 'Record test execution for analysis.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-infrastructure',
    xpReward: 95,
    order: 1002,
    instructions: `# Video Recording

Record tests for review!

## Config

\`\`\`javascript
// playwright.config.ts
use: {
    video: 'on-first-retry', // or 'on', 'retain-on-failure'
}
\`\`\`

## Access Video

\`\`\`javascript
// In test
await page.video()?.saveAs('test.webm');
\`\`\`

## Your Task
1. Enable recording (simulated)
2. Perform actions
3. Return recording status
`,
    htmlContent: `<div id="app">
  <button id="record" onclick="startRecording()">Start Recording</button>
  <button id="stop" onclick="stopRecording()" style="display:none;">Stop</button>
  <div id="status"></div>
</div>
<script>
  function startRecording() {
    document.getElementById('status').textContent = 'Recording...';
    document.getElementById('record').style.display = 'none';
    document.getElementById('stop').style.display = 'inline';
  }
  function stopRecording() {
    document.getElementById('status').textContent = 'Video: saved';
    document.getElementById('stop').style.display = 'none';
  }
</script>`,
    starterCode: `// Start recording
// Your code here

// Perform actions (simulated)
// Your code here

const result = await page.locator('#status').textContent();`,
    expectedOutput: 'Video: saved',
    tags: ['playwright', 'video', 'recording', 'expert'],
  },
  {
    slug: 'pw-retry-logic',
    title: 'Retry Logic',
    description: 'Handle flaky tests with retries.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-infrastructure',
    xpReward: 100,
    order: 1003,
    instructions: `# Retry Logic

Handle flaky tests!

## Config Retries

\`\`\`javascript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
\`\`\`

## Per-Test Retry

\`\`\`javascript
test('flaky test', async ({ page }) => {
    test.info().annotations.push({ type: 'retry', description: '3' });
    // test code
});
\`\`\`

## Your Task
1. Simulate a flaky action (succeeds on retry)
2. Implement retry pattern
3. Return success status
`,
    htmlContent: `<div id="app">
  <button id="flaky" onclick="flakyAction()">Flaky Button</button>
  <div id="result"></div>
</div>
<script>
  let attempts = 0;
  function flakyAction() {
    attempts++;
    if (attempts >= 2) {
      document.getElementById('result').textContent = 'Success on retry';
    } else {
      document.getElementById('result').textContent = 'Failed, try again';
    }
  }
</script>`,
    starterCode: `// First attempt (may fail)
await page.click('#flaky');
let result = await page.locator('#result').textContent();

// Retry logic - Implement retry if failed
// Your code here`,
    expectedOutput: 'Success on retry',
    tags: ['playwright', 'retry', 'flaky', 'expert'],
  },
  {
    slug: 'pw-parallel-execution',
    title: 'Parallel Execution',
    description: 'Run tests in parallel for speed.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-infrastructure',
    xpReward: 120,
    order: 1004,
    instructions: `# Parallel Execution

Speed up test runs!

## Config

\`\`\`javascript
// playwright.config.ts
workers: process.env.CI ? 4 : undefined,
fullyParallel: true,
\`\`\`

## Test Isolation

Each test gets fresh browser context.

## Considerations

- Tests must be independent
- No shared state between tests
- Each test sets up own data

## Your Task
1. Run "parallel" operations
2. Aggregate results
3. Return combined output
`,
    htmlContent: `<div id="app">
  <button id="task1" onclick="runTask(1)">Task 1</button>
  <button id="task2" onclick="runTask(2)">Task 2</button>
  <button id="task3" onclick="runTask(3)">Task 3</button>
  <div id="results"></div>
</div>
<script>
  const completed = [];
  function runTask(n) {
    completed.push(n);
    document.getElementById('results').textContent = 'Completed: ' + completed.length + '/3';
  }
</script>`,
    starterCode: `// Run tasks in parallel (simulated)
// Use Promise.all()
// Your code here

const result = await page.locator('#results').textContent();`,
    expectedOutput: 'Completed: 3/3',
    tags: ['playwright', 'parallel', 'performance', 'expert'],
  },
  {
    slug: 'pw-cross-browser',
    title: 'Cross-browser Testing',
    description: 'Test across multiple browsers.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 110,
    order: 1103,
    instructions: `# Cross-browser Testing

Test on Chromium, Firefox, WebKit!

## Config

\`\`\`javascript
// playwright.config.ts
projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
\`\`\`

## Browser-Specific Tests

\`\`\`javascript
test('safari only', async ({ browserName }) => {
    test.skip(browserName !== 'webkit');
    // Safari-specific test
});
\`\`\`

## Your Task
1. Detect "browser" type
2. Show browser-specific message
3. Return confirmation
`,
    htmlContent: `<div id="app">
  <select id="browser">
    <option value="">Select Browser</option>
    <option value="chromium">Chromium</option>
    <option value="firefox">Firefox</option>
    <option value="webkit">WebKit</option>
  </select>
  <button id="test" onclick="runTest()">Run Test</button>
  <div id="result"></div>
</div>
<script>
  function runTest() {
    const browser = document.getElementById('browser').value;
    document.getElementById('result').textContent = 'Tested on: ' + browser;
  }
</script>`,
    starterCode: `// Select browser (simulated cross-browser)
// Your code here

// Run test
// Your code here

const result = await page.locator('#result').textContent();`,
    expectedOutput: 'Tested on: chromium',
    tags: ['playwright', 'cross-browser', 'compatibility', 'expert'],
  },
  {
    slug: 'pw-mobile-viewport',
    title: 'Mobile Viewport Testing',
    description: 'Test responsive designs.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 100,
    order: 1104,
    instructions: `# Mobile Viewport Testing

Test responsive layouts!

## Device Emulation

\`\`\`javascript
// playwright.config.ts
{ 
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] }
}
\`\`\`

## Manual Viewport

\`\`\`javascript
await page.setViewportSize({ width: 375, height: 667 });
\`\`\`

## Your Task
1. Set mobile viewport (simulated)
2. Check mobile layout
3. Return layout type
`,
    htmlContent: `<div id="app">
  <select id="viewport">
    <option value="">Select Viewport</option>
    <option value="desktop">Desktop (1920x1080)</option>
    <option value="tablet">Tablet (768x1024)</option>
    <option value="mobile">Mobile (375x667)</option>
  </select>
  <button id="apply" onclick="applyViewport()">Apply</button>
  <div id="layout"></div>
</div>
<script>
  function applyViewport() {
    const vp = document.getElementById('viewport').value;
    document.getElementById('layout').textContent = 'Layout: ' + vp;
  }
</script>`,
    starterCode: `// Set mobile viewport (simulated)
// Your code here

const result = await page.locator('#layout').textContent();`,
    expectedOutput: 'Layout: mobile',
    tags: ['playwright', 'mobile', 'responsive', 'viewport', 'expert'],
  },
  // Challenge 8: CSV Workflow
  {
    slug: 'pw-csv-workflow',
    title: 'CSV Processing Workflow',
    description: 'Upload CSV, process data, and verify export.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 100,
    order: 1105,
    instructions: `# CSV Workflow

Simulate a realistic business flow: Upload -> Process -> Download.

## Workflows
1. **Upload:** Use \`setInputFiles\`
2. **Process:** Wait for button enablement
3. **Download:** Since we are in a customized environment, we verify the **UI Feedback** representing the download or the link generation.

## Your Task
1. Upload a file named "users.csv"
2. Wait for the "Process" button to become enabled
3. Click "Process"
4. Wait for and return the success message text ("Export Complete")

> **Note:** The "Export Complete" message appears after a simulated backend process.
`,
    htmlContent: `<div class="csv-tool">
  <h3>Bulk User Import</h3>
  <input type="file" id="upload" accept=".csv" />
  <div id="preview" style="margin: 10px 0; min-height: 50px; border: 1px solid #ddd; padding: 10px;">
    No file selected used.
  </div>
  <button id="process-btn" disabled>Process Import</button>
  <div id="status-area" style="margin-top: 10px; font-weight: bold; color: green;"></div>
</div>
<script>
  const upload = document.getElementById('upload');
  const preview = document.getElementById('preview');
  const btn = document.getElementById('process-btn');
  const status = document.getElementById('status-area');

  upload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        preview.textContent = "Preview: 3 users found (Alice, Bob, Charlie)";
        preview.style.backgroundColor = "#f9f9f9";
        // Enable button after "parsing" delay
        setTimeout(() => {
            btn.disabled = false;
        }, 500);
    }
  });

  btn.addEventListener('click', () => {
    btn.textContent = "Processing...";
    btn.disabled = true;
    
    // Simulate backend work
    setTimeout(() => {
        btn.textContent = "Process Import";
        status.textContent = "Export Complete";
        
        // Add a download link
        const link = document.createElement('a');
        link.href = "#";
        link.textContent = "Download Result Report";
        status.appendChild(document.createElement('br'));
        status.appendChild(link);
    }, 1500);
  });
</script>`,
    starterCode: `// 1. Upload the file
// Your code here

// 2. Wait for Process button to be enabled (state: 'visible' implies present, but we check enabled)
const btn = page.locator('#process-btn');
// Your code here

// 3. Click Process
// Your code here

// 4. Wait for success message
// Your code here

// Return the text for validation
const result = await page.locator('#status-area').textContent();`,
    expectedOutput: 'Export CompleteDownload Result Report', // textContent includes children
    tags: ['playwright', 'upload', 'workflow', 'csv', 'advanced'],
  },

  // Challenge 10: Test Infrastructure Boss
  {
    slug: 'pw-infrastructure-boss',
    title: 'Scenario: Self-Healing Test Suite',
    description: 'Build robust test infrastructure with retry, screenshot, and reporting.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-infrastructure',
    xpReward: 115,
    order: 1005,
    instructions: `# Scenario: Self-Healing Test Suite

Build test infrastructure that handles flaky tests gracefully.

## The Challenge

Create a test helper that:
1. Retries failed actions up to 3 times
2. Takes a screenshot on final failure
3. Returns the test result status

## Your Mission

Implement robust retry logic that makes your tests more reliable!

> **Tip:** Use try/catch and a retry loop!
`,
    htmlContent: `<div class="flaky-app">
  <button id="action" onclick="flakyClick()">Click Me</button>
  <div id="result"></div>
  <div id="screenshot-area"></div>
</div>
<script>
  let attempts = 0;
  function flakyClick() {
    attempts++;
    // Succeeds on 3rd attempt
    if (attempts >= 3) {
      document.getElementById('result').textContent = 'Success after ' + attempts + ' attempts';
    } else {
      document.getElementById('result').textContent = 'Failed - attempt ' + attempts;
    }
  }
</script>`,
    starterCode: `// Retry helper with screenshot on failure
async function retryWithScreenshot(action, maxRetries = 3) {
    // Implement retry logic here using try/catch loop
    
    return 'failed-with-screenshot';
}

// Use the retry helper
const result = await retryWithScreenshot(async () => {
    await page.click('#action');
});`,
    expectedOutput: 'passed',
    tags: ['playwright', 'infrastructure', 'retry', 'scenario', 'boss', 'expert'],
  },

  // Challenge 11: Integration Patterns Boss
  {
    slug: 'pw-integration-boss',
    title: 'Scenario: E2E Pipeline Integration',
    description: 'Build a test that combines API setup, UI verification, and cleanup.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'HARD' as const,
    category: 'playwright-integration-patterns',
    xpReward: 125,
    order: 1106,
    instructions: `# Scenario: E2E Pipeline Integration

Create a complete integration test with setup, test, and teardown phases.

## The Challenge

Build a test that:
1. **Setup**: Create test data via "API"
2. **Test**: Verify data in UI
3. **Verify**: Check all assertions
4. **Teardown**: Clean up test data

## Your Mission

Implement all phases and return the final verification status!

> **Tip:** Structure your test with clear setup/test/teardown phases!
`,
    htmlContent: `<div id="app">
  <button id="setup" onclick="setupData()">Setup Data</button>
  <div id="data-display" style="display:none;">
    <h2 id="user-name"></h2>
    <p id="user-email"></p>
  </div>
  <button id="cleanup" onclick="cleanup()" style="display:none;">Cleanup</button>
  <div id="status"></div>
</div>
<script>
  function setupData() {
    document.getElementById('user-name').textContent = 'Test User';
    document.getElementById('user-email').textContent = 'test@example.com';
    document.getElementById('data-display').style.display = 'block';
    document.getElementById('cleanup').style.display = 'block';
    document.getElementById('status').textContent = 'Setup complete';
  }
  function cleanup() {
    document.getElementById('data-display').style.display = 'none';
    document.getElementById('status').textContent = 'Cleanup complete';
  }
</script>`,
    starterCode: `// 1. Setup Phase - Create test data
// ...

// 2. Test Phase - Verify UI
// ...

// 3. Assertion Phase
// ...

// 4. Teardown Phase - Cleanup
// ...

// Return integration result
const result = "";`,
    expectedOutput: 'integration-passed',
    tags: ['playwright', 'integration', 'e2e', 'pipeline', 'scenario', 'boss', 'expert'],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedExpertChallenges() {
  console.log('🌱 Seeding Expert tier (Real-World Patterns) challenges...\n');

  try {
    // Fetch Tutorial IDs
    const pomTutorialId = await getTutorialId('playwright-pom');
    const dataTutorialId = await getTutorialId('playwright-data-driven');
    const advancedTutorialId = await getTutorialId('playwright-advanced-patterns');

    console.log('   🔗 Linking to tutorials:');
    console.log(`      - POM: ${pomTutorialId ? '✅ Found' : '❌ Not Found'}`);
    console.log(`      - Data Driven: ${dataTutorialId ? '✅ Found' : '❌ Not Found'}`);
    console.log(`      - Advanced: ${advancedTutorialId ? '✅ Found' : '❌ Not Found'}`);

    const allChallenges = [...pomChallenges, ...dataDrivenChallenges, ...advancedPatternsChallenges];

    console.log('🔍 Checking for existing challenges...');
    const slugs = allChallenges.map(c => c.slug);
    const existing = await db.select({ slug: challenges.slug })
      .from(challenges)
      .where(inArray(challenges.slug, slugs));

    if (existing.length > 0) {
      console.log(`   Found ${existing.length} existing challenges, updating...`);

      for (const slug of existing.map(e => e.slug)) {
        const challenge = await db.select().from(challenges).where(eq(challenges.slug, slug));
        if (challenge[0]) {
          await db.delete(testCases).where(eq(testCases.challengeId, challenge[0].id));
        }
      }
      await db.delete(challenges).where(inArray(challenges.slug, slugs));
    }

    console.log('\n📦 Creating Page Object Model challenges...');
    for (const challenge of pomChallenges) {
      const [inserted] = await db.insert(challenges).values({
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xpReward,
        order: challenge.order,
        instructions: challenge.instructions,
        htmlContent: challenge.htmlContent,
        starterCode: challenge.starterCode,
        tags: [...challenge.tags, 'coming-soon'],
        isPublished: true,
        completionCount: 0,
        tutorialId: pomTutorialId,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 800}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    console.log('\n📊 Creating Data-Driven Testing challenges...');
    for (const challenge of dataDrivenChallenges) {
      const [inserted] = await db.insert(challenges).values({
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xpReward,
        order: challenge.order,
        instructions: challenge.instructions,
        htmlContent: challenge.htmlContent,
        starterCode: challenge.starterCode,
        tags: [...challenge.tags, 'coming-soon'],
        isPublished: true,
        completionCount: 0,
        tutorialId: dataTutorialId,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 900}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    console.log('\n🚀 Creating Advanced Patterns challenges...');
    for (const challenge of advancedPatternsChallenges) {
      const [inserted] = await db.insert(challenges).values({
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xpReward,
        order: challenge.order,
        instructions: challenge.instructions,
        htmlContent: challenge.htmlContent,
        starterCode: challenge.starterCode,
        tags: [...challenge.tags, 'coming-soon'],
        isPublished: true,
        completionCount: 0,
        tutorialId: advancedTutorialId,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 1000}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    const pomXP = pomChallenges.reduce((sum, c) => sum + c.xpReward, 0);
    const dataXP = dataDrivenChallenges.reduce((sum, c) => sum + c.xpReward, 0);
    const advXP = advancedPatternsChallenges.reduce((sum, c) => sum + c.xpReward, 0);

    console.log('\n' + '='.repeat(50));
    console.log('✨ Expert tier seeding complete!');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   • Page Object Model: ${pomChallenges.length} challenges (${pomXP} XP)`);
    console.log(`   • Data-Driven Testing: ${dataDrivenChallenges.length} challenges (${dataXP} XP)`);
    console.log(`   • Advanced Patterns: ${advancedPatternsChallenges.length} challenges (${advXP} XP)`);
    console.log(`   • Total: ${allChallenges.length} challenges (${pomXP + dataXP + advXP} XP)`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export { seedExpertChallenges };

// Run the seed function if executed directly
if (import.meta.main) {
  seedExpertChallenges()
    .then(() => {
      console.log('\n🎉 Database seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed database:', error);
      process.exit(1);
    });
}
