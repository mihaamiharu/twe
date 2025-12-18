/**
 * Intermediate Tier Challenges Seed Script
 * 
 * Seeds the database with Playwright Basics challenges.
 * Run with: bun run db:seed:intermediate
 */

import { db } from './index';
import { challenges, testCases } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================================
// NAVIGATION & ACTIONS CHALLENGES (10)
// ============================================================================

const navigationChallenges = [
  {
    slug: 'pw-page-navigation',
    title: 'Page Navigation',
    description: 'Navigate to pages and verify URLs and titles.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 40,
    order: 401,
    instructions: `# Page Navigation

Master the fundamentals of navigating between pages!

## Core Methods

\`\`\`javascript
await page.goto('https://example.com');
await page.url();    // Get current URL
await page.title();  // Get page title
\`\`\`

## Navigation Options

\`\`\`javascript
await page.goto('/login', { 
    waitUntil: 'networkidle' 
});
\`\`\`

## Your Task
1. Navigate to the login page
2. Verify the URL contains "login"
3. Store the page title in \`result\`
`,
    htmlContent: `<div class="app">
  <h1>Login Page</h1>
  <form>
    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />
    <button type="submit">Sign In</button>
  </form>
</div>`,
    starterCode: `// Navigate to login page
await page.goto('/login');

// Get the page title
const result = await page.title();`,
    expectedOutput: 'Login Page',
    hints: ['Use page.goto() to navigate', 'page.title() returns the document title'],
    tags: ['playwright', 'navigation', 'intermediate'],
  },
  {
    slug: 'pw-click-actions',
    title: 'Click Actions',
    description: 'Master different types of click interactions.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 45,
    order: 402,
    instructions: `# Click Actions

Playwright offers several click methods!

## Basic Click

\`\`\`javascript
await page.click('#submit-btn');
await page.locator('.menu').click();
\`\`\`

## Click Variations

\`\`\`javascript
await page.dblclick('#item');     // Double-click
await page.click('#menu', { button: 'right' });  // Right-click
await page.click('#link', { force: true });      // Force click
\`\`\`

## Your Task
1. Click the increment button 3 times
2. Get the counter value
`,
    htmlContent: `<div class="counter">
  <span id="count">0</span>
  <button id="increment" onclick="document.getElementById('count').textContent = Number(document.getElementById('count').textContent) + 1">+</button>
</div>`,
    starterCode: `// Click the button 3 times
await page.click('#increment');
await page.click('#increment');
await page.click('#increment');

// Get the counter value
const result = await page.locator('#count').textContent();`,
    expectedOutput: '3',
    hints: ['Use page.click() with a selector', 'Call click multiple times for multiple clicks'],
    tags: ['playwright', 'click', 'actions', 'intermediate'],
  },
  {
    slug: 'pw-fill-type',
    title: 'Fill & Type',
    description: 'Input text into form fields.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 50,
    order: 403,
    instructions: `# Fill & Type

Two ways to enter text in Playwright!

## fill() - Replace All

\`\`\`javascript
await page.fill('#email', 'test@example.com');
\`\`\`

## type() - Character by Character

\`\`\`javascript
await page.type('#search', 'hello', { delay: 100 });
\`\`\`

## Clear and Fill

\`\`\`javascript
await page.locator('#input').clear();
await page.locator('#input').fill('new value');
\`\`\`

## Your Task
1. Fill the email field with "qa@test.com"
2. Fill the password field with "secret123"
3. Get the email field value
`,
    htmlContent: `<form class="login-form">
  <input type="email" id="email" placeholder="Email" />
  <input type="password" id="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>`,
    starterCode: `// Fill the form fields
await page.fill('#email', 'qa@test.com');
await page.fill('#password', 'secret123');

// Get the email value
const result = await page.locator('#email').inputValue();`,
    expectedOutput: 'qa@test.com',
    hints: ['Use fill() to set input values', 'Use inputValue() to read input values'],
    tags: ['playwright', 'fill', 'type', 'forms', 'intermediate'],
  },
  {
    slug: 'pw-select-dropdowns',
    title: 'Select Dropdowns',
    description: 'Work with select elements and dropdowns.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 55,
    order: 404,
    instructions: `# Select Dropdowns

Playwright makes dropdown selection easy!

## Select by Value

\`\`\`javascript
await page.selectOption('#country', 'usa');
\`\`\`

## Select by Label

\`\`\`javascript
await page.selectOption('#size', { label: 'Large' });
\`\`\`

## Select Multiple

\`\`\`javascript
await page.selectOption('#colors', ['red', 'blue']);
\`\`\`

## Your Task
1. Select "JavaScript" from the language dropdown
2. Get the selected value
`,
    htmlContent: `<form>
  <label>Choose Language:</label>
  <select id="language">
    <option value="">Select...</option>
    <option value="python">Python</option>
    <option value="javascript">JavaScript</option>
    <option value="typescript">TypeScript</option>
  </select>
</form>`,
    starterCode: `// Select JavaScript from dropdown
await page.selectOption('#language', 'javascript');

// Get the selected value
const result = await page.locator('#language').inputValue();`,
    expectedOutput: 'javascript',
    hints: ['selectOption takes the value attribute', 'Use inputValue() to get selected option'],
    tags: ['playwright', 'select', 'dropdown', 'intermediate'],
  },
  {
    slug: 'pw-checkbox-radio',
    title: 'Checkbox & Radio',
    description: 'Toggle checkboxes and radio buttons.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 55,
    order: 405,
    instructions: `# Checkbox & Radio

Toggle and verify checkbox/radio state!

## Check/Uncheck

\`\`\`javascript
await page.check('#agree');
await page.uncheck('#newsletter');
\`\`\`

## Verify State

\`\`\`javascript
await page.isChecked('#terms');  // true/false
\`\`\`

## Locator Methods

\`\`\`javascript
await page.locator('#option').check();
const checked = await page.locator('#option').isChecked();
\`\`\`

## Your Task
1. Check the "Accept Terms" checkbox
2. Verify it's checked
`,
    htmlContent: `<form>
  <label>
    <input type="checkbox" id="terms" />
    Accept Terms & Conditions
  </label>
  <label>
    <input type="checkbox" id="newsletter" />
    Subscribe to Newsletter
  </label>
</form>`,
    starterCode: `// Check the terms checkbox
await page.check('#terms');

// Verify it's checked
const result = await page.isChecked('#terms');`,
    expectedOutput: 'true',
    hints: ['Use check() to check a checkbox', 'isChecked() returns boolean'],
    tags: ['playwright', 'checkbox', 'radio', 'intermediate'],
  },
  {
    slug: 'pw-keyboard-actions',
    title: 'Keyboard Actions',
    description: 'Simulate keyboard input and shortcuts.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 60,
    order: 406,
    instructions: `# Keyboard Actions

Simulate keyboard input!

## Press Keys

\`\`\`javascript
await page.press('#input', 'Enter');
await page.press('body', 'Escape');
\`\`\`

## Key Combinations

\`\`\`javascript
await page.press('#editor', 'Control+a');
await page.press('#editor', 'Control+c');
\`\`\`

## Type with Delay

\`\`\`javascript
await page.type('#search', 'playwright', { delay: 50 });
\`\`\`

## Your Task
1. Focus the search input
2. Type "Playwright" 
3. Press Enter to search
4. Get the search results text
`,
    htmlContent: `<div class="search-app">
  <input type="text" id="search" placeholder="Search..." />
  <div id="results"></div>
</div>
<script>
  document.getElementById('search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('results').textContent = 'Results for: ' + e.target.value;
    }
  });
</script>`,
    starterCode: `// Type in search and press Enter
await page.fill('#search', 'Playwright');
await page.press('#search', 'Enter');

// Get search results
const result = await page.locator('#results').textContent();`,
    expectedOutput: 'Results for: Playwright',
    hints: ['Use press() for keyboard events', 'Enter key triggers the search'],
    tags: ['playwright', 'keyboard', 'press', 'intermediate'],
  },
  {
    slug: 'pw-hover-focus',
    title: 'Hover & Focus',
    description: 'Mouse hover and focus actions.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 60,
    order: 407,
    instructions: `# Hover & Focus

Trigger hover states and focus events!

## Hover

\`\`\`javascript
await page.hover('#menu-item');
await page.locator('.dropdown').hover();
\`\`\`

## Focus

\`\`\`javascript
await page.focus('#email');
await page.locator('#input').focus();
\`\`\`

## Blur

\`\`\`javascript
await page.locator('#input').blur();
\`\`\`

## Your Task
1. Hover over the menu button to reveal dropdown
2. Get the dropdown content text
`,
    htmlContent: `<div class="menu">
  <button id="menu-btn">Menu</button>
  <div id="dropdown" style="display: none;">Dropdown Content</div>
</div>
<script>
  document.getElementById('menu-btn').addEventListener('mouseenter', () => {
    document.getElementById('dropdown').style.display = 'block';
  });
</script>`,
    starterCode: `// Hover to show dropdown
await page.hover('#menu-btn');

// Get dropdown text
const result = await page.locator('#dropdown').textContent();`,
    expectedOutput: 'Dropdown Content',
    hints: ['hover() triggers mouseenter event', 'Dropdown becomes visible on hover'],
    tags: ['playwright', 'hover', 'focus', 'intermediate'],
  },
  {
    slug: 'pw-file-upload',
    title: 'File Upload',
    description: 'Handle file upload inputs.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 70,
    order: 408,
    instructions: `# File Upload

Upload files in your tests!

## setInputFiles

\`\`\`javascript
await page.setInputFiles('#upload', 'path/to/file.pdf');
\`\`\`

## Multiple Files

\`\`\`javascript
await page.setInputFiles('#upload', [
    'file1.jpg',
    'file2.jpg'
]);
\`\`\`

## Clear Files

\`\`\`javascript
await page.setInputFiles('#upload', []);
\`\`\`

## Your Task
1. Upload a test file
2. Verify the filename is displayed
`,
    htmlContent: `<div class="uploader">
  <input type="file" id="file-input" />
  <span id="filename">No file selected</span>
</div>
<script>
  document.getElementById('file-input').addEventListener('change', (e) => {
    document.getElementById('filename').textContent = e.target.files[0]?.name || 'No file';
  });
</script>`,
    starterCode: `// Upload a file (simulated in sandbox)
await page.locator('#file-input').setInputFiles({
    name: 'test-report.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('test content')
});

// Get the displayed filename
const result = await page.locator('#filename').textContent();`,
    expectedOutput: 'test-report.pdf',
    hints: ['setInputFiles accepts file objects', 'The change event updates the display'],
    tags: ['playwright', 'upload', 'files', 'intermediate'],
  },
  {
    slug: 'pw-drag-drop',
    title: 'Drag & Drop',
    description: 'Perform drag and drop operations.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 80,
    order: 409,
    instructions: `# Drag & Drop

Complex mouse interactions!

## dragTo Method

\`\`\`javascript
await page.locator('#source').dragTo(page.locator('#target'));
\`\`\`

## Manual Drag

\`\`\`javascript
await page.locator('#item').hover();
await page.mouse.down();
await page.locator('#dropzone').hover();
await page.mouse.up();
\`\`\`

## Your Task
1. Drag Item A to the drop zone
2. Verify it was dropped
`,
    htmlContent: `<div class="drag-demo">
  <div id="item-a" draggable="true" style="padding:10px;background:#eee;cursor:move;">Item A</div>
  <div id="dropzone" style="padding:20px;border:2px dashed #999;margin-top:10px;">Drop here</div>
</div>
<script>
  const item = document.getElementById('item-a');
  const zone = document.getElementById('dropzone');
  item.addEventListener('dragstart', (e) => e.dataTransfer.setData('text', e.target.id));
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.textContent = 'Dropped: Item A';
  });
</script>`,
    starterCode: `// Drag item to drop zone
await page.locator('#item-a').dragTo(page.locator('#dropzone'));

// Verify drop
const result = await page.locator('#dropzone').textContent();`,
    expectedOutput: 'Dropped: Item A',
    hints: ['dragTo() handles the full drag operation', 'The drop event updates the text'],
    tags: ['playwright', 'drag', 'drop', 'intermediate'],
  },
  {
    slug: 'pw-iframes',
    title: 'Working with iFrames',
    description: 'Access and interact with embedded iframes.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-navigation',
    xpReward: 85,
    order: 410,
    instructions: `# Working with iFrames

Access content inside iframes!

## Frame by Name/URL

\`\`\`javascript
const frame = page.frame({ name: 'my-frame' });
const frame = page.frame({ url: /embed/ });
\`\`\`

## frameLocator

\`\`\`javascript
const frame = page.frameLocator('#widget-frame');
await frame.locator('button').click();
\`\`\`

## Get All Frames

\`\`\`javascript
const frames = page.frames();
\`\`\`

## Your Task
1. Access the iframe content
2. Get the text inside the iframe
`,
    htmlContent: `<div class="page">
  <h1>Main Page</h1>
  <iframe id="embed" srcdoc="<div id='frame-content'>Hello from iframe!</div>"></iframe>
</div>`,
    starterCode: `// Access iframe content using frameLocator
const frame = page.frameLocator('#embed');
const result = await frame.locator('#frame-content').textContent();`,
    expectedOutput: 'Hello from iframe!',
    hints: ['frameLocator creates a locator scoped to iframe', 'Then use normal locator methods'],
    tags: ['playwright', 'iframe', 'frames', 'intermediate'],
  },
];

// ============================================================================
// ADVANCED LOCATORS CHALLENGES (8)
// ============================================================================

const locatorChallenges = [
  {
    slug: 'pw-get-by-role',
    title: 'getByRole',
    description: 'Use accessibility-first locators with getByRole.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 50,
    order: 501,
    instructions: `# getByRole

Accessibility-first locators are the recommended approach!

## Common Roles

\`\`\`javascript
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'Home' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Agree' });
page.getByRole('heading', { level: 1 });
\`\`\`

## Why getByRole?

- Tests user-visible behavior
- Works with screen readers
- More resilient to changes

## Your Task
1. Find the button with role "button" and name "Sign Up"
2. Click it and get the result
`,
    htmlContent: `<div class="signup">
  <h1>Join Us</h1>
  <button onclick="document.getElementById('result').textContent = 'Signed up!'">Sign Up</button>
  <div id="result"></div>
</div>`,
    starterCode: `// Find button by role
const signUpBtn = page.getByRole('button', { name: 'Sign Up' });
await signUpBtn.click();

// Get result
const result = await page.locator('#result').textContent();`,
    expectedOutput: 'Signed up!',
    hints: ['getByRole uses ARIA roles', 'name matches accessible name'],
    tags: ['playwright', 'locators', 'accessibility', 'intermediate'],
  },
  {
    slug: 'pw-get-by-text',
    title: 'getByText',
    description: 'Find elements by their text content.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 50,
    order: 502,
    instructions: `# getByText

Find elements by visible text!

## Exact Match

\`\`\`javascript
page.getByText('Hello World');
\`\`\`

## Substring Match

\`\`\`javascript
page.getByText('Hello', { exact: false });
\`\`\`

## Regex Match

\`\`\`javascript
page.getByText(/welcome/i);  // Case insensitive
\`\`\`

## Your Task
1. Find the element containing "Click me"
2. Click it
3. Get the result
`,
    htmlContent: `<div class="demo">
  <span class="clickable" onclick="document.getElementById('output').textContent = 'Clicked!'">Click me to continue</span>
  <div id="output"></div>
</div>`,
    starterCode: `// Find by text (substring match)
const element = page.getByText('Click me');
await element.click();

// Get output
const result = await page.locator('#output').textContent();`,
    expectedOutput: 'Clicked!',
    hints: ['getByText searches visible text', 'Use exact: false for partial match'],
    tags: ['playwright', 'locators', 'text', 'intermediate'],
  },
  {
    slug: 'pw-get-by-label',
    title: 'getByLabel',
    description: 'Find form inputs by their label text.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 55,
    order: 503,
    instructions: `# getByLabel

Perfect for form accessibility!

## How It Works

\`\`\`javascript
// Finds input associated with label "Email"
page.getByLabel('Email');
\`\`\`

## Works With

- \`<label for="id">\` + \`<input id="id">\`
- \`<label><input>Name</label>\` (wrapped)
- \`aria-labelledby\` attribute

## Your Task
1. Fill the "Username" input
2. Fill the "Password" input
3. Get the username value
`,
    htmlContent: `<form>
  <label for="user">Username</label>
  <input type="text" id="user" />
  
  <label for="pass">Password</label>
  <input type="password" id="pass" />
</form>`,
    starterCode: `// Fill by label
await page.getByLabel('Username').fill('testuser');
await page.getByLabel('Password').fill('secret123');

// Get username value
const result = await page.getByLabel('Username').inputValue();`,
    expectedOutput: 'testuser',
    hints: ['getByLabel matches label text', 'Works with for/id association'],
    tags: ['playwright', 'locators', 'forms', 'accessibility', 'intermediate'],
  },
  {
    slug: 'pw-get-by-placeholder',
    title: 'getByPlaceholder',
    description: 'Find inputs by placeholder text.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 55,
    order: 504,
    instructions: `# getByPlaceholder

Find inputs by their placeholder!

## Usage

\`\`\`javascript
page.getByPlaceholder('Enter your email');
page.getByPlaceholder('Search...');
\`\`\`

## Best For

- Inputs without visible labels
- Search boxes
- Quick prototypes

## Your Task
1. Fill the search input (placeholder: "Search...")
2. Get the input value
`,
    htmlContent: `<div class="search-bar">
  <input type="text" placeholder="Search..." />
</div>`,
    starterCode: `// Find by placeholder
await page.getByPlaceholder('Search...').fill('Playwright testing');

// Get value
const result = await page.getByPlaceholder('Search...').inputValue();`,
    expectedOutput: 'Playwright testing',
    hints: ['Matches placeholder attribute exactly', 'Use for inputs without labels'],
    tags: ['playwright', 'locators', 'placeholder', 'intermediate'],
  },
  {
    slug: 'pw-get-by-testid',
    title: 'getByTestId',
    description: 'Use custom test attributes for reliable selection.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 60,
    order: 505,
    instructions: `# getByTestId

Use custom test IDs for stable locators!

## Default Attribute

\`\`\`javascript
// Finds data-testid="submit-btn"
page.getByTestId('submit-btn');
\`\`\`

## Configure Custom Attribute

\`\`\`javascript
// In playwright.config.ts
use: {
  testIdAttribute: 'data-test-id'
}
\`\`\`

## Best Practices

- Add test IDs during development
- Use semantic names
- Keep them stable

## Your Task
1. Click the button with testid "add-to-cart"
2. Get the cart count
`,
    htmlContent: `<div class="product">
  <h3>Widget Pro</h3>
  <button data-testid="add-to-cart" onclick="document.getElementById('cart-count').textContent = '1'">Add to Cart</button>
  <span id="cart-count">0</span>
</div>`,
    starterCode: `// Click by test ID
await page.getByTestId('add-to-cart').click();

// Get cart count
const result = await page.locator('#cart-count').textContent();`,
    expectedOutput: '1',
    hints: ['getByTestId matches data-testid by default', 'Configure custom attribute if needed'],
    tags: ['playwright', 'locators', 'testid', 'intermediate'],
  },
  {
    slug: 'pw-locator-chaining',
    title: 'Locator Chaining',
    description: 'Chain locators with filter, first, nth.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 70,
    order: 506,
    instructions: `# Locator Chaining

Refine locators with chaining methods!

## filter()

\`\`\`javascript
page.locator('.item').filter({ hasText: 'Active' });
page.locator('.row').filter({ has: page.locator('.icon') });
\`\`\`

## first(), last(), nth()

\`\`\`javascript
page.locator('li').first();
page.locator('li').last();
page.locator('li').nth(2);  // Third item (0-indexed)
\`\`\`

## Chaining

\`\`\`javascript
page.locator('.list')
    .locator('.item')
    .filter({ hasText: 'Active' })
    .first();
\`\`\`

## Your Task
1. Get the second item in the list
2. Return its text
`,
    htmlContent: `<ul class="menu">
  <li>Home</li>
  <li>Products</li>
  <li>About</li>
  <li>Contact</li>
</ul>`,
    starterCode: `// Get second item using nth (0-indexed)
const secondItem = page.locator('.menu li').nth(1);
const result = await secondItem.textContent();`,
    expectedOutput: 'Products',
    hints: ['nth() is 0-indexed', 'Use filter() to narrow down matches'],
    tags: ['playwright', 'locators', 'chaining', 'intermediate'],
  },
  {
    slug: 'pw-frame-locators',
    title: 'Frame Locators',
    description: 'Work with iframes using frameLocator.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 80,
    order: 507,
    instructions: `# Frame Locators

Access iframe content with frameLocator!

## Basic Usage

\`\`\`javascript
const frame = page.frameLocator('#my-iframe');
await frame.locator('button').click();
\`\`\`

## Chain with Locators

\`\`\`javascript
page.frameLocator('iframe')
    .locator('.content')
    .getByRole('button');
\`\`\`

## Nested Frames

\`\`\`javascript
page.frameLocator('#outer')
    .frameLocator('#inner')
    .locator('div');
\`\`\`

## Your Task
1. Access the iframe
2. Click the button inside
3. Get the result text
`,
    htmlContent: `<div class="container">
  <iframe id="widget" srcdoc="<button onclick='this.parentNode.innerHTML=&quot;Button clicked!&quot;'>Click Inside</button>"></iframe>
</div>`,
    starterCode: `// Access iframe and click button
const frame = page.frameLocator('#widget');
await frame.locator('button').click();

// Get iframe content
const result = await frame.locator('body').textContent();`,
    expectedOutput: 'Button clicked!',
    hints: ['frameLocator returns a locator scoped to iframe', 'Chain with regular locator methods'],
    tags: ['playwright', 'locators', 'iframe', 'intermediate'],
  },
  {
    slug: 'pw-list-items',
    title: 'List & Items',
    description: 'Handle multiple elements efficiently.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-locators',
    xpReward: 75,
    order: 508,
    instructions: `# List & Items

Work with multiple elements!

## Count Elements

\`\`\`javascript
const count = await page.locator('.item').count();
\`\`\`

## Get All Text

\`\`\`javascript
const texts = await page.locator('.item').allTextContents();
\`\`\`

## Iterate

\`\`\`javascript
const items = page.locator('.item');
for (let i = 0; i < await items.count(); i++) {
    await items.nth(i).click();
}
\`\`\`

## All Inner Texts

\`\`\`javascript
const allTexts = await page.locator('li').allInnerTexts();
\`\`\`

## Your Task
1. Count the number of list items
2. Return the count as string
`,
    htmlContent: `<ul class="todo-list">
  <li>Buy groceries</li>
  <li>Walk the dog</li>
  <li>Write tests</li>
  <li>Review PRs</li>
  <li>Deploy app</li>
</ul>`,
    starterCode: `// Count list items
const items = page.locator('.todo-list li');
const count = await items.count();
const result = String(count);`,
    expectedOutput: '5',
    hints: ['count() returns number of matched elements', 'Convert to string for output'],
    tags: ['playwright', 'locators', 'lists', 'multiple', 'intermediate'],
  },
];

// ============================================================================
// ASSERTIONS CHALLENGES (8)
// ============================================================================

const assertionChallenges = [
  {
    slug: 'pw-to-be-visible',
    title: 'toBeVisible & toBeHidden',
    description: 'Assert element visibility states.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 45,
    order: 601,
    instructions: `# toBeVisible & toBeHidden

Check if elements are visible or hidden!

## Visibility Assertions

\`\`\`javascript
await expect(page.locator('#modal')).toBeVisible();
await expect(page.locator('.spinner')).toBeHidden();
await expect(page.locator('.menu')).not.toBeVisible();
\`\`\`

## Common Use Cases

- Modals appearing/disappearing
- Loading spinners
- Conditional UI elements

## Your Task
1. Click to show the modal
2. Assert the modal is visible
`,
    htmlContent: `<div class="app">
  <button id="show" onclick="document.getElementById('modal').style.display = 'block'">Show Modal</button>
  <div id="modal" style="display: none;">Modal Content</div>
</div>`,
    starterCode: `// Show the modal
await page.click('#show');

// Assert modal is visible
await expect(page.locator('#modal')).toBeVisible();
const result = 'visible';`,
    expectedOutput: 'visible',
    hints: ['expect().toBeVisible() checks visibility', 'Element must be in DOM and visible'],
    tags: ['playwright', 'assertions', 'visibility', 'intermediate'],
  },
  {
    slug: 'pw-to-have-text',
    title: 'toHaveText',
    description: 'Assert element text content.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 50,
    order: 602,
    instructions: `# toHaveText

Validate text content!

## Exact Match

\`\`\`javascript
await expect(page.locator('h1')).toHaveText('Welcome');
\`\`\`

## Partial Match

\`\`\`javascript
await expect(page.locator('p')).toContainText('hello');
\`\`\`

## Regex

\`\`\`javascript
await expect(page.locator('.status')).toHaveText(/success/i);
\`\`\`

## Your Task
1. Assert the heading has text "Hello World"
2. Assert the paragraph contains "Playwright"
`,
    htmlContent: `<div class="content">
  <h1>Hello World</h1>
  <p>Welcome to Playwright testing framework!</p>
</div>`,
    starterCode: `// Assert heading text
await expect(page.locator('h1')).toHaveText('Hello World');

// Assert paragraph contains text
await expect(page.locator('p')).toContainText('Playwright');
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toHaveText checks exact match', 'toContainText checks substring'],
    tags: ['playwright', 'assertions', 'text', 'intermediate'],
  },
  {
    slug: 'pw-to-have-value',
    title: 'toHaveValue',
    description: 'Assert input field values.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 50,
    order: 603,
    instructions: `# toHaveValue

Check input field values!

## Text Inputs

\`\`\`javascript
await expect(page.locator('#email')).toHaveValue('test@example.com');
\`\`\`

## Empty Value

\`\`\`javascript
await expect(page.locator('#search')).toHaveValue('');
\`\`\`

## Regex Match

\`\`\`javascript
await expect(page.locator('#phone')).toHaveValue(/\\d{3}-\\d{4}/);
\`\`\`

## Your Task
1. Fill the email input
2. Assert it has the correct value
`,
    htmlContent: `<form>
  <input type="email" id="email" placeholder="Enter email" />
</form>`,
    starterCode: `// Fill the input
await page.fill('#email', 'qa@test.com');

// Assert value
await expect(page.locator('#email')).toHaveValue('qa@test.com');
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toHaveValue checks input value', 'Works with text inputs, textareas, select'],
    tags: ['playwright', 'assertions', 'forms', 'intermediate'],
  },
  {
    slug: 'pw-state-assertions',
    title: 'State Assertions',
    description: 'Assert checkbox, disabled, and other states.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 55,
    order: 604,
    instructions: `# State Assertions

Check element states!

## Checked State

\`\`\`javascript
await expect(page.locator('#terms')).toBeChecked();
await expect(page.locator('#opt-out')).not.toBeChecked();
\`\`\`

## Disabled/Enabled

\`\`\`javascript
await expect(page.locator('#submit')).toBeDisabled();
await expect(page.locator('#next')).toBeEnabled();
\`\`\`

## Editable/ReadOnly

\`\`\`javascript
await expect(page.locator('#notes')).toBeEditable();
\`\`\`

## Your Task
1. Check the terms checkbox
2. Assert it is checked
3. Assert submit button is enabled
`,
    htmlContent: `<form>
  <label><input type="checkbox" id="terms" /> Accept Terms</label>
  <button id="submit">Submit</button>
</form>`,
    starterCode: `// Check the checkbox
await page.check('#terms');

// Assert state
await expect(page.locator('#terms')).toBeChecked();
await expect(page.locator('#submit')).toBeEnabled();
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toBeChecked for checkboxes/radios', 'toBeEnabled/toBeDisabled for buttons'],
    tags: ['playwright', 'assertions', 'state', 'intermediate'],
  },
  {
    slug: 'pw-to-have-attribute',
    title: 'toHaveAttribute',
    description: 'Assert element attributes.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 60,
    order: 605,
    instructions: `# toHaveAttribute

Check element attributes!

## Exact Attribute Value

\`\`\`javascript
await expect(page.locator('a')).toHaveAttribute('href', '/home');
\`\`\`

## Attribute Exists

\`\`\`javascript
await expect(page.locator('img')).toHaveAttribute('alt');
\`\`\`

## Regex Match

\`\`\`javascript
await expect(page.locator('img')).toHaveAttribute('src', /\\.jpg$/);
\`\`\`

## Your Task
1. Assert the link has href "/about"
2. Assert the image has alt attribute
`,
    htmlContent: `<nav>
  <a href="/about">About Us</a>
  <img src="logo.png" alt="Company Logo" />
</nav>`,
    starterCode: `// Assert href attribute
await expect(page.locator('a')).toHaveAttribute('href', '/about');

// Assert alt attribute exists
await expect(page.locator('img')).toHaveAttribute('alt', 'Company Logo');
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toHaveAttribute(name, value)', 'Second arg is optional to just check existence'],
    tags: ['playwright', 'assertions', 'attributes', 'intermediate'],
  },
  {
    slug: 'pw-to-have-count',
    title: 'toHaveCount',
    description: 'Assert number of elements.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 65,
    order: 606,
    instructions: `# toHaveCount

Check number of matching elements!

## Count Assertion

\`\`\`javascript
await expect(page.locator('.item')).toHaveCount(5);
await expect(page.locator('.error')).toHaveCount(0);
\`\`\`

## After Adding Items

\`\`\`javascript
await page.click('#add');
await expect(page.locator('li')).toHaveCount(4);
\`\`\`

## Your Task
1. Count the list items (should be 4)
2. Add a new item
3. Assert count is now 5
`,
    htmlContent: `<ul id="list">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
  <li>Item 4</li>
</ul>
<button id="add" onclick="document.getElementById('list').innerHTML += '<li>New Item</li>'">Add Item</button>`,
    starterCode: `// Initial count
await expect(page.locator('#list li')).toHaveCount(4);

// Add item
await page.click('#add');

// Assert new count
await expect(page.locator('#list li')).toHaveCount(5);
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toHaveCount checks exact count', 'Auto-retries until count matches'],
    tags: ['playwright', 'assertions', 'count', 'intermediate'],
  },
  {
    slug: 'pw-page-assertions',
    title: 'Page Assertions',
    description: 'Assert URL and page title.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 60,
    order: 607,
    instructions: `# Page Assertions

Check URL and title!

## URL Assertion

\`\`\`javascript
await expect(page).toHaveURL('https://example.com/login');
await expect(page).toHaveURL(/\\/dashboard$/);
\`\`\`

## Title Assertion

\`\`\`javascript
await expect(page).toHaveTitle('Welcome');
await expect(page).toHaveTitle(/Dashboard/);
\`\`\`

## Your Task
1. Navigate to the page
2. Assert the title matches
`,
    htmlContent: `<html>
  <head><title>Test Page</title></head>
  <body>
    <h1>Welcome</h1>
  </body>
</html>`,
    starterCode: `// Assert page title
await expect(page).toHaveTitle('Test Page');
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['toHaveTitle works on page object', 'Can use string or regex'],
    tags: ['playwright', 'assertions', 'url', 'title', 'intermediate'],
  },
  {
    slug: 'pw-soft-assertions',
    title: 'Soft Assertions',
    description: 'Continue test execution after assertion failures.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-assertions',
    xpReward: 70,
    order: 608,
    instructions: `# Soft Assertions

Continue after failures!

## Regular vs Soft

\`\`\`javascript
// Regular - stops on failure
await expect(locator).toHaveText('A');

// Soft - continues on failure
await expect.soft(locator).toHaveText('A');
\`\`\`

## Use Cases

- Form validation (check all fields)
- Dashboard verification
- Batch assertions

## Check for Failures

\`\`\`javascript
const errors = expect.soft.errors;
\`\`\`

## Your Task
1. Use soft assertions to check multiple elements
2. All assertions should pass
`,
    htmlContent: `<div class="form-status">
  <div id="name-status" class="valid">✓ Name valid</div>
  <div id="email-status" class="valid">✓ Email valid</div>
  <div id="pass-status" class="valid">✓ Password valid</div>
</div>`,
    starterCode: `// Use soft assertions to check all statuses
await expect.soft(page.locator('#name-status')).toContainText('valid');
await expect.soft(page.locator('#email-status')).toContainText('valid');
await expect.soft(page.locator('#pass-status')).toContainText('valid');
const result = 'passed';`,
    expectedOutput: 'passed',
    hints: ['expect.soft continues after failure', 'Collect all errors at end'],
    tags: ['playwright', 'assertions', 'soft', 'intermediate'],
  },
];

// ============================================================================
// WAIT STRATEGIES CHALLENGES (6)
// ============================================================================

const waitChallenges = [
  {
    slug: 'pw-auto-wait',
    title: 'Auto-Wait Understanding',
    description: 'Understand Playwright built-in waiting.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 50,
    order: 701,
    instructions: `# Auto-Wait Understanding

Playwright auto-waits for most actions!

## Built-in Waiting

Playwright automatically waits for:
- Element to be visible
- Element to be stable
- Element to receive events
- Element to be enabled

\`\`\`javascript
// Auto-waits for button to be ready
await page.click('#submit');

// Auto-waits for input to be ready
await page.fill('#email', 'test@example.com');
\`\`\`

## No Manual Waits Needed

\`\`\`javascript
// DON'T do this:
await page.waitForSelector('#btn');
await page.click('#btn');

// DO this:
await page.click('#btn');  // Auto-waits internally
\`\`\`

## Your Task
1. Click a button that appears after delay
2. Playwright auto-waits for it
`,
    htmlContent: `<div class="demo">
  <div id="content"></div>
</div>
<script>
  setTimeout(() => {
    document.getElementById('content').innerHTML = '<button id="delayed-btn" onclick="this.textContent=\\'Clicked!\\'">Click Me</button>';
  }, 100);
</script>`,
    starterCode: `// Playwright auto-waits for the button to appear
await page.click('#delayed-btn');

// Get the button text
const result = await page.locator('#delayed-btn').textContent();`,
    expectedOutput: 'Clicked!',
    hints: ['Playwright auto-waits up to 30 seconds', 'No need for explicit waits'],
    tags: ['playwright', 'waits', 'auto-wait', 'intermediate'],
  },
  {
    slug: 'pw-wait-for-selector',
    title: 'waitForSelector',
    description: 'Wait explicitly for elements to appear.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 55,
    order: 702,
    instructions: `# waitForSelector

Wait for specific element states!

## Basic Usage

\`\`\`javascript
await page.waitForSelector('#modal');
\`\`\`

## Wait States

\`\`\`javascript
// Wait for visible (default)
await page.waitForSelector('#elem', { state: 'visible' });

// Wait for hidden
await page.waitForSelector('.spinner', { state: 'hidden' });

// Wait for attached to DOM
await page.waitForSelector('#content', { state: 'attached' });

// Wait for detached from DOM
await page.waitForSelector('#popup', { state: 'detached' });
\`\`\`

## Your Task
1. Wait for the spinner to hide
2. Get the result text
`,
    htmlContent: `<div class="app">
  <div id="spinner">Loading...</div>
  <div id="result" style="display:none;">Data loaded!</div>
</div>
<script>
  setTimeout(() => {
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('result').style.display = 'block';
  }, 100);
</script>`,
    starterCode: `// Wait for spinner to hide
await page.waitForSelector('#spinner', { state: 'hidden' });

// Get result
const result = await page.locator('#result').textContent();`,
    expectedOutput: 'Data loaded!',
    hints: ['state: hidden waits for element to be hidden', 'Useful for loading indicators'],
    tags: ['playwright', 'waits', 'selector', 'intermediate'],
  },
  {
    slug: 'pw-wait-for-load-state',
    title: 'waitForLoadState',
    description: 'Wait for page load states.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 60,
    order: 703,
    instructions: `# waitForLoadState

Wait for page load states!

## Load States

\`\`\`javascript
// Wait for document loaded
await page.waitForLoadState('load');

// Wait for DOM ready
await page.waitForLoadState('domcontentloaded');

// Wait for network idle
await page.waitForLoadState('networkidle');
\`\`\`

## After Navigation

\`\`\`javascript
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
\`\`\`

## Your Task
1. Navigate and wait for DOM ready
2. Get the page title
`,
    htmlContent: `<html>
  <head><title>Dashboard</title></head>
  <body>
    <h1>Welcome to Dashboard</h1>
  </body>
</html>`,
    starterCode: `// Wait for DOM to be ready
await page.waitForLoadState('domcontentloaded');

// Get page title
const result = await page.title();`,
    expectedOutput: 'Dashboard',
    hints: ['domcontentloaded is faster than load', 'networkidle waits for no network activity'],
    tags: ['playwright', 'waits', 'load', 'intermediate'],
  },
  {
    slug: 'pw-wait-for-response',
    title: 'waitForResponse',
    description: 'Wait for specific API responses.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 75,
    order: 704,
    instructions: `# waitForResponse

Wait for API responses!

## Basic Usage

\`\`\`javascript
const response = await page.waitForResponse('/api/users');
\`\`\`

## With Pattern

\`\`\`javascript
const response = await page.waitForResponse(
    resp => resp.url().includes('/api/') && resp.status() === 200
);
\`\`\`

## With Action

\`\`\`javascript
const [response] = await Promise.all([
    page.waitForResponse('/api/save'),
    page.click('#save')
]);
const data = await response.json();
\`\`\`

## Your Task
1. Trigger an API call
2. Wait for the response
3. Display success message
`,
    htmlContent: `<div class="api-demo">
  <button id="load" onclick="fetch('/api/data').then(() => document.getElementById('status').textContent = 'API Success')">Load Data</button>
  <div id="status"></div>
</div>`,
    starterCode: `// Wait for API response while clicking
const [response] = await Promise.all([
    page.waitForResponse('/api/data'),
    page.click('#load')
]);

// Get status text
const result = await page.locator('#status').textContent();`,
    expectedOutput: 'API Success',
    hints: ['Use Promise.all to wait and trigger together', 'waitForResponse returns Response object'],
    tags: ['playwright', 'waits', 'api', 'response', 'intermediate'],
  },
  {
    slug: 'pw-wait-for-function',
    title: 'waitForFunction',
    description: 'Wait for custom JavaScript conditions.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 85,
    order: 705,
    instructions: `# waitForFunction

Wait for custom conditions!

## Basic Usage

\`\`\`javascript
await page.waitForFunction(() => window.myApp.isReady);
\`\`\`

## With Arguments

\`\`\`javascript
await page.waitForFunction(
    selector => document.querySelector(selector)?.textContent === 'Ready',
    '#status'
);
\`\`\`

## DOM Condition

\`\`\`javascript
await page.waitForFunction(() => {
    const items = document.querySelectorAll('.item');
    return items.length >= 5;
});
\`\`\`

## Your Task
1. Wait for counter to reach 3
2. Get the final value
`,
    htmlContent: `<div class="counter-demo">
  <span id="counter">0</span>
</div>
<script>
  let count = 0;
  const interval = setInterval(() => {
    count++;
    document.getElementById('counter').textContent = count;
    if (count >= 5) clearInterval(interval);
  }, 50);
</script>`,
    starterCode: `// Wait for counter to reach 3
await page.waitForFunction(() => {
    const counter = document.getElementById('counter');
    return parseInt(counter.textContent) >= 3;
});

// Get counter value
const result = await page.locator('#counter').textContent();`,
    expectedOutput: '3',
    hints: ['waitForFunction runs in page context', 'Return true when condition is met'],
    tags: ['playwright', 'waits', 'function', 'custom', 'intermediate'],
  },
  {
    slug: 'pw-timeout-config',
    title: 'Timeout Configuration',
    description: 'Configure custom timeouts.',
    type: 'PLAYWRIGHT' as const,
    difficulty: 'MEDIUM' as const,
    category: 'playwright-waits',
    xpReward: 70,
    order: 706,
    instructions: `# Timeout Configuration

Customize timeout behavior!

## Action Timeout

\`\`\`javascript
await page.click('#btn', { timeout: 5000 });
await page.fill('#input', 'text', { timeout: 10000 });
\`\`\`

## Navigation Timeout

\`\`\`javascript
await page.goto('/slow-page', { timeout: 60000 });
\`\`\`

## Wait Timeout

\`\`\`javascript
await page.waitForSelector('#elem', { timeout: 3000 });
\`\`\`

## Global Config

\`\`\`javascript
// In playwright.config.ts
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
\`\`\`

## Your Task
1. Click an element with custom timeout
2. Verify it worked
`,
    htmlContent: `<div class="timeout-demo">
  <button id="fast-btn" onclick="this.textContent = 'Done!'">Quick Click</button>
</div>`,
    starterCode: `// Click with short timeout (element is immediately available)
await page.click('#fast-btn', { timeout: 1000 });

// Get button text
const result = await page.locator('#fast-btn').textContent();`,
    expectedOutput: 'Done!',
    hints: ['Timeout is in milliseconds', 'Default timeout is 30000ms'],
    tags: ['playwright', 'waits', 'timeout', 'config', 'intermediate'],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedIntermediateChallenges() {
  console.log('🌱 Seeding Intermediate tier (Playwright Basics) challenges...\n');

  try {
    const allChallenges = [...navigationChallenges, ...locatorChallenges, ...assertionChallenges, ...waitChallenges];

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

    console.log('\n🎭 Creating Navigation & Actions challenges...');
    for (const challenge of navigationChallenges) {
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
        hints: challenge.hints,
        tags: challenge.tags,
        isPublished: true,
        completionCount: 0,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 400}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    console.log('\n🎯 Creating Advanced Locators challenges...');
    for (const challenge of locatorChallenges) {
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
        hints: challenge.hints,
        tags: challenge.tags,
        isPublished: true,
        completionCount: 0,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 500}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    console.log('\n✅ Creating Assertions challenges...');
    for (const challenge of assertionChallenges) {
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
        hints: challenge.hints,
        tags: challenge.tags,
        isPublished: true,
        completionCount: 0,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 600}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    console.log('\n⏳ Creating Wait Strategies challenges...');
    for (const challenge of waitChallenges) {
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
        hints: challenge.hints,
        tags: challenge.tags,
        isPublished: true,
        completionCount: 0,
      }).returning();

      await db.insert(testCases).values({
        challengeId: inserted.id,
        description: 'Code should produce the expected output',
        input: { code: challenge.starterCode },
        expectedOutput: { value: challenge.expectedOutput },
        isHidden: false,
        order: 1,
      });

      console.log(`   ✅ ${challenge.order - 700}. ${challenge.title} (${challenge.xpReward} XP)`);
    }

    const navXP = navigationChallenges.reduce((sum, c) => sum + c.xpReward, 0);
    const locatorXP = locatorChallenges.reduce((sum, c) => sum + c.xpReward, 0);
    const assertXP = assertionChallenges.reduce((sum, c) => sum + c.xpReward, 0);
    const waitXP = waitChallenges.reduce((sum, c) => sum + c.xpReward, 0);

    console.log('\n' + '='.repeat(50));
    console.log('✨ Intermediate tier seeding complete!');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   • Navigation & Actions: ${navigationChallenges.length} challenges (${navXP} XP)`);
    console.log(`   • Advanced Locators: ${locatorChallenges.length} challenges (${locatorXP} XP)`);
    console.log(`   • Assertions: ${assertionChallenges.length} challenges (${assertXP} XP)`);
    console.log(`   • Wait Strategies: ${waitChallenges.length} challenges (${waitXP} XP)`);
    console.log(`   • Total: ${allChallenges.length} challenges (${navXP + locatorXP + assertXP + waitXP} XP)`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seedIntermediateChallenges()
  .then(() => {
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
