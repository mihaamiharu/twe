/**
 * Basic Tier Challenges Seed Script
 * 
 * Seeds the database with Basic tier CSS and XPath selector challenges.
 * Run with: bun run db:seed:basic
 */

import { db } from './index';
import { challenges, testCases } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================================
// CSS SELECTOR CHALLENGES (10)
// ============================================================================

const cssChallenges = [
    // Challenge 1: Selector 101 - ID & Class
    {
        slug: 'css-selector-101-id-class',
        title: 'Selector 101: ID & Class',
        description: 'Learn to select elements using ID (#) and class (.) selectors.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 10,
        order: 1,
        instructions: `# Selector 101: ID & Class

The two most fundamental CSS selectors are **ID** and **class** selectors.

## ID Selector (\`#\`)
- Targets a **single unique element**
- Syntax: \`#elementId\`
- Example: \`#submit-btn\` selects \`<button id="submit-btn">\`

## Class Selector (\`.\`)
- Targets **all elements** with that class
- Syntax: \`.className\`
- Example: \`.btn\` selects all elements with \`class="btn"\`

## Your Task
Select the **login button** using its ID.

> **Hint:** Look for the element's \`id\` attribute in the HTML preview.
`,
        htmlContent: `<div class="login-page">
  <h1>Welcome Back</h1>
  <form class="login-form">
    <input type="text" id="username" placeholder="Username" class="input-field" />
    <input type="password" id="password" placeholder="Password" class="input-field" />
    <button type="submit" id="login-btn" class="btn btn-primary">Login</button>
    <button type="button" class="btn btn-link">Forgot Password?</button>
  </form>
</div>`,
        starterCode: '',
        hints: [
            'Look at the button element that says "Login"',
            'The button has an id attribute - use # to select by ID',
            'The answer is #login-btn'
        ],
        tags: ['css', 'selector', 'id', 'class', 'basic'],
        targetSelector: '#login-btn',
    },

    // Challenge 2: Tag Selectors
    {
        slug: 'css-tag-selectors',
        title: 'Tag Selectors',
        description: 'Select elements by their HTML tag name.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 10,
        order: 2,
        instructions: `# Tag Selectors

The simplest CSS selector targets elements by their **tag name**.

## Tag Selector
- Syntax: \`tagname\`
- Selects **all elements** of that type
- Example: \`button\` selects all \`<button>\` elements

## Common Tags
- \`div\`, \`span\`, \`p\` - Container/text elements
- \`a\` - Links
- \`button\`, \`input\` - Form elements
- \`h1\`, \`h2\`, \`h3\` - Headings
- \`ul\`, \`li\` - Lists

## Your Task
Select the **paragraph** element that contains the welcome message.

> **Note:** Tag selectors can match multiple elements!
`,
        htmlContent: `<div class="welcome-section">
  <h1>Welcome to Our App</h1>
  <p>Thank you for joining us. We're excited to have you here!</p>
  <div class="actions">
    <button class="btn">Get Started</button>
    <a href="/learn">Learn More</a>
  </div>
</div>`,
        starterCode: '',
        hints: [
            'Look for the <p> tag in the HTML',
            'Tag selectors are just the element name without any prefix',
            'The answer is: p'
        ],
        tags: ['css', 'selector', 'tag', 'basic'],
        targetSelector: 'p',
    },

    // Challenge 3: Child & Descendant
    {
        slug: 'css-child-descendant',
        title: 'Child & Descendant',
        description: 'Learn the difference between child (>) and descendant selectors.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 15,
        order: 3,
        instructions: `# Child & Descendant Selectors

These selectors target elements based on their relationship to other elements.

## Descendant Selector (space)
- Syntax: \`parent descendant\`
- Selects **all matching elements** inside the parent (any depth)
- Example: \`div p\` selects all \`<p>\` inside any \`<div>\`

## Child Selector (\`>\`)
- Syntax: \`parent > child\`
- Selects only **direct children**
- Example: \`div > p\` selects \`<p>\` that are immediate children of \`<div>\`

## Visual Example
\`\`\`html
<div>
  <p>Direct child ✓ (matched by div > p)</p>
  <section>
    <p>Nested child ✓ (only matched by div p)</p>
  </section>
</div>
\`\`\`

## Your Task
Select the **list items** that are direct children of the navigation \`<ul>\`.

> **Hint:** Use the child combinator \`>\`
`,
        htmlContent: `<nav class="main-nav">
  <ul class="nav-menu">
    <li class="nav-item">Home</li>
    <li class="nav-item">Products
      <ul class="dropdown">
        <li>Product 1</li>
        <li>Product 2</li>
      </ul>
    </li>
    <li class="nav-item">Contact</li>
  </ul>
</nav>`,
        starterCode: '',
        hints: [
            'You want to select <li> elements that are direct children of .nav-menu',
            'Use the > combinator for direct children',
            'The answer is: .nav-menu > li or ul.nav-menu > li'
        ],
        tags: ['css', 'selector', 'child', 'descendant', 'basic'],
        targetSelector: '.nav-menu > li',
    },

    // Challenge 4: Attribute Selectors
    {
        slug: 'css-attribute-selectors',
        title: 'Attribute Selectors',
        description: 'Target elements by their HTML attributes.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 20,
        order: 4,
        instructions: `# Attribute Selectors

Attribute selectors let you target elements based on their attributes.

## Basic Attribute Selectors
| Selector | Description |
|----------|-------------|
| \`[attr]\` | Has the attribute |
| \`[attr="value"]\` | Exact match |
| \`[attr^="value"]\` | Starts with |
| \`[attr$="value"]\` | Ends with |
| \`[attr*="value"]\` | Contains |

## Examples
\`\`\`css
[type="email"]        /* Input with type="email" */
[data-testid="login"] /* Element with data-testid */
[href^="https"]       /* Links starting with https */
[class*="btn"]        /* Class contains "btn" */
\`\`\`

## Your Task
Select the **email input** field using an attribute selector.

> **Tip:** \`data-*\` attributes are great for test automation!
`,
        htmlContent: `<form class="signup-form">
  <div class="form-group">
    <label>Name</label>
    <input type="text" name="name" data-testid="name-input" placeholder="Your name" />
  </div>
  <div class="form-group">
    <label>Email</label>
    <input type="email" name="email" data-testid="email-input" placeholder="your@email.com" />
  </div>
  <div class="form-group">
    <label>Password</label>
    <input type="password" name="password" data-testid="password-input" placeholder="••••••••" />
  </div>
  <button type="submit">Sign Up</button>
</form>`,
        starterCode: '',
        hints: [
            'Look at the input with type="email"',
            'You can use [type="email"] or [data-testid="email-input"]',
            'The answer is: [type="email"] or input[type="email"]'
        ],
        tags: ['css', 'selector', 'attribute', 'basic'],
        targetSelector: '[type="email"]',
    },

    // Challenge 5: Nth-child Magic
    {
        slug: 'css-nth-child',
        title: 'Nth-child Magic',
        description: 'Select elements by their position using :nth-child().',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 25,
        order: 5,
        instructions: `# Nth-child Selector

The \`:nth-child()\` pseudo-class selects elements by their position.

## Syntax Options
| Selector | Description |
|----------|-------------|
| \`:nth-child(2)\` | Second element |
| \`:nth-child(odd)\` | Odd positions (1, 3, 5...) |
| \`:nth-child(even)\` | Even positions (2, 4, 6...) |
| \`:nth-child(3n)\` | Every 3rd element |
| \`:first-child\` | First element |
| \`:last-child\` | Last element |

## Examples
\`\`\`css
li:nth-child(2)     /* Second list item */
tr:nth-child(odd)   /* Odd table rows */
div:last-child      /* Last div in parent */
\`\`\`

## Your Task
Select the **third item** in the todo list.
`,
        htmlContent: `<div class="todo-app">
  <h2>My Tasks</h2>
  <ul class="todo-list">
    <li class="todo-item">Buy groceries</li>
    <li class="todo-item">Call mom</li>
    <li class="todo-item">Finish project</li>
    <li class="todo-item">Go to gym</li>
    <li class="todo-item">Read book</li>
  </ul>
</div>`,
        starterCode: '',
        hints: [
            'Use :nth-child() to select by position',
            'The third item is at position 3',
            'The answer is: .todo-item:nth-child(3) or li:nth-child(3)'
        ],
        tags: ['css', 'selector', 'nth-child', 'pseudo-class', 'basic'],
        targetSelector: 'li:nth-child(3)',
    },

    // Challenge 6: Sibling Selectors
    {
        slug: 'css-sibling-selectors',
        title: 'Sibling Selectors',
        description: 'Select elements based on their siblings.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 25,
        order: 6,
        instructions: `# Sibling Selectors

Sibling selectors target elements that share the same parent.

## Adjacent Sibling (\`+\`)
- Syntax: \`element + sibling\`
- Selects the **immediately following** sibling
- Example: \`h1 + p\` selects a \`<p>\` right after \`<h1>\`

## General Sibling (\`~\`)
- Syntax: \`element ~ sibling\`
- Selects **all following** siblings
- Example: \`h1 ~ p\` selects all \`<p>\` after \`<h1>\`

## Visual Example
\`\`\`html
<div>
  <h1>Title</h1>
  <p>First paragraph ✓ (h1 + p)</p>
  <p>Second paragraph ✓ (h1 ~ p only)</p>
</div>
\`\`\`

## Your Task
Select the **paragraph immediately after** the main heading.
`,
        htmlContent: `<article>
  <h1 class="title">Breaking News</h1>
  <p class="lead">This is the lead paragraph with important info.</p>
  <p>More details about the story...</p>
  <p>Even more content here...</p>
  <footer>Published today</footer>
</article>`,
        starterCode: '',
        hints: [
            'You need the paragraph directly after h1',
            'Use the adjacent sibling combinator +',
            'The answer is: h1 + p'
        ],
        tags: ['css', 'selector', 'sibling', 'basic'],
        targetSelector: 'h1 + p',
    },

    // Challenge 7: Pseudo-classes
    {
        slug: 'css-pseudo-classes',
        title: 'Pseudo-classes',
        description: 'Select elements based on their state.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 30,
        order: 7,
        instructions: `# Pseudo-classes

Pseudo-classes select elements based on their **state** or **position**.

## State Pseudo-classes
| Selector | Description |
|----------|-------------|
| \`:hover\` | Mouse is over element |
| \`:focus\` | Element has focus |
| \`:active\` | Being clicked |
| \`:disabled\` | Disabled inputs |
| \`:checked\` | Checked checkboxes/radios |

## Structural Pseudo-classes
| Selector | Description |
|----------|-------------|
| \`:first-child\` | First child of parent |
| \`:last-child\` | Last child of parent |
| \`:empty\` | No children |

## Your Task
Select the **disabled input** field.

> **Note:** In automation, \`:disabled\` helps verify form states!
`,
        htmlContent: `<form class="settings-form">
  <div class="form-group">
    <label>Username (locked)</label>
    <input type="text" value="john_doe" disabled />
  </div>
  <div class="form-group">
    <label>Display Name</label>
    <input type="text" value="John Doe" placeholder="Your display name" />
  </div>
  <div class="form-group">
    <label>Email</label>
    <input type="email" value="john@example.com" />
  </div>
  <button type="submit">Save Changes</button>
</form>`,
        starterCode: '',
        hints: [
            'Look for the input that has the disabled attribute',
            'Use the :disabled pseudo-class',
            'The answer is: input:disabled'
        ],
        tags: ['css', 'selector', 'pseudo-class', 'state', 'basic'],
        targetSelector: 'input:disabled',
    },

    // Challenge 8: Combining Selectors
    {
        slug: 'css-combining-selectors',
        title: 'Combining Selectors',
        description: 'Chain multiple selectors for precise targeting.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 35,
        order: 8,
        instructions: `# Combining Selectors

You can chain selectors to be more specific and precise.

## Chaining Techniques
| Pattern | Meaning |
|---------|---------|
| \`div.class\` | div with class |
| \`.class1.class2\` | Has both classes |
| \`#id.class\` | ID and class |
| \`element[attr]\` | Tag with attribute |

## Examples
\`\`\`css
button.btn.primary      /* <button class="btn primary"> */
input[type="text"].form-control
div.container > p.lead  /* Direct child with class */
\`\`\`

## Your Task
Select the **primary action button** (it has both "btn" and "primary" classes).
`,
        htmlContent: `<div class="card">
  <h3>Upgrade to Pro</h3>
  <p>Get access to premium features!</p>
  <div class="card-actions">
    <button class="btn secondary">Learn More</button>
    <button class="btn primary">Upgrade Now</button>
  </div>
</div>
<div class="footer">
  <button class="btn text">Cancel</button>
</div>`,
        starterCode: '',
        hints: [
            'The button has two classes: "btn" and "primary"',
            'Chain them together without space',
            'The answer is: .btn.primary or button.btn.primary'
        ],
        tags: ['css', 'selector', 'combining', 'chaining', 'basic'],
        targetSelector: '.btn.primary',
    },

    // Challenge 9: Real Form Challenge
    {
        slug: 'css-real-form',
        title: 'Real Form Challenge',
        description: 'Apply your skills to a realistic form layout.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 40,
        order: 9,
        instructions: `# Real Form Challenge

Let's put your skills together on a realistic form!

## Scenario
You're automating tests for a checkout form. You need to select the **credit card number input**.

## Tips for Finding Elements
1. **Start with unique attributes** - IDs are most reliable
2. **Use data attributes** - \`data-testid\` is test-friendly
3. **Combine when needed** - Be specific but not fragile

## Your Task
Select the **credit card number input** field.

> **Real-world tip:** In test automation, prefer \`data-testid\` attributes when available!
`,
        htmlContent: `<div class="checkout-form">
  <h2>Payment Details</h2>
  
  <div class="form-section">
    <h3>Card Information</h3>
    <div class="form-row">
      <label>Card Number</label>
      <input type="text" id="card-number" data-testid="card-input" placeholder="1234 5678 9012 3456" />
    </div>
    <div class="form-row split">
      <div>
        <label>Expiry Date</label>
        <input type="text" id="expiry" placeholder="MM/YY" />
      </div>
      <div>
        <label>CVV</label>
        <input type="text" id="cvv" placeholder="123" />
      </div>
    </div>
  </div>
  
  <div class="form-section">
    <h3>Billing Address</h3>
    <input type="text" id="address" placeholder="Street address" />
    <input type="text" id="city" placeholder="City" />
  </div>
  
  <button type="submit" class="btn primary">Pay Now</button>
</div>`,
        starterCode: '',
        hints: [
            'Look for the card number input - it has multiple unique identifiers',
            'You can use #card-number or [data-testid="card-input"]',
            'The answer is: #card-number or [data-testid="card-input"]'
        ],
        tags: ['css', 'selector', 'form', 'practical', 'basic'],
        targetSelector: '#card-number',
    },

    // Challenge 10: Dynamic Elements
    {
        slug: 'css-dynamic-elements',
        title: 'Dynamic Elements',
        description: 'Handle elements without stable IDs or classes.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'css-basics',
        xpReward: 50,
        order: 10,
        instructions: `# Dynamic Elements

Sometimes elements don't have stable IDs or unique classes. Here's how to handle them.

## Strategies for Dynamic Elements
1. **Use data attributes** - \`[data-*]\` selectors
2. **Use attribute contains** - \`[class*="partial"]\`
3. **Use structural selectors** - \`:nth-child()\`, \`:first-of-type\`
4. **Combine with parent** - Navigate from stable element

## Example: Element with Dynamic ID
\`\`\`html
<button id="btn-a7x9z">Submit</button>  <!-- ID changes! -->
<button data-action="submit">Submit</button>  <!-- Stable! -->
\`\`\`

Better selector: \`[data-action="submit"]\`

## Your Task
Select the **delete button** for the second item. The buttons don't have unique IDs!

> **Tip:** Combine position with class for precision.
`,
        htmlContent: `<ul class="item-list">
  <li class="item" data-id="item-1">
    <span class="item-name">First Item</span>
    <div class="item-actions">
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Delete</button>
    </div>
  </li>
  <li class="item" data-id="item-2">
    <span class="item-name">Second Item</span>
    <div class="item-actions">
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Delete</button>
    </div>
  </li>
  <li class="item" data-id="item-3">
    <span class="item-name">Third Item</span>
    <div class="item-actions">
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Delete</button>
    </div>
  </li>
</ul>`,
        starterCode: '',
        hints: [
            'You need the delete button in the second list item',
            'Use :nth-child(2) to select the second item',
            'The answer is: .item:nth-child(2) .btn-delete or li:nth-child(2) .btn-delete'
        ],
        tags: ['css', 'selector', 'dynamic', 'practical', 'basic'],
        targetSelector: '.item:nth-child(2) .btn-delete',
    },
];

// ============================================================================
// XPATH CHALLENGES (10)
// ============================================================================

const xpathChallenges = [
    // Challenge 1: XPath Basics
    {
        slug: 'xpath-basics-101',
        title: 'XPath Basics',
        description: 'Learn the fundamentals: absolute vs relative paths.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 10,
        order: 11,
        instructions: `# XPath Basics

XPath (XML Path Language) is a query language for selecting nodes from an HTML/XML document.

## Absolute vs Relative XPath

### Absolute XPath (\`/\`)
- Starts from the **root element**
- Begins with single slash: \`/\`
- Example: \`/html/body/div/button\`
- ⚠️ **Fragile** - breaks if structure changes

### Relative XPath (\`//\`)
- Starts from **anywhere** in the document
- Begins with double slash: \`//\`
- Example: \`//button\`
- ✅ **Flexible** - more maintainable

## Your Task
Select the **submit button** using a relative XPath.

> **Best Practice:** Always prefer relative XPath for test automation!
`,
        htmlContent: `<div class="contact-page">
  <h1>Contact Us</h1>
  <form id="contact-form">
    <input type="text" name="name" placeholder="Your Name" />
    <input type="email" name="email" placeholder="Your Email" />
    <textarea name="message" placeholder="Your Message"></textarea>
    <button type="submit">Send Message</button>
  </form>
</div>`,
        starterCode: '',
        hints: [
            'Use // at the start for a relative XPath',
            'Select by element name: //button',
            'The answer is: //button'
        ],
        tags: ['xpath', 'selector', 'basics', 'basic'],
        targetSelector: '//button',
    },

    // Challenge 2: Attribute Matching
    {
        slug: 'xpath-attribute-matching',
        title: 'Attribute Matching',
        description: 'Select elements using attribute conditions.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 15,
        order: 12,
        instructions: `# XPath Attribute Matching

XPath uses \`@\` to reference attributes within predicates \`[]\`.

## Syntax
\`\`\`xpath
//element[@attribute="value"]
\`\`\`

## Examples
\`\`\`xpath
//input[@type="email"]       // Input with type="email"
//button[@id="submit"]       // Button with specific ID
//div[@class="container"]    // Div with exact class
//a[@href]                   // All links with href
\`\`\`

## Your Task
Select the **password input** field using its type attribute.
`,
        htmlContent: `<div class="login-container">
  <h2>Sign In</h2>
  <form>
    <div class="field">
      <input type="text" name="username" placeholder="Username" />
    </div>
    <div class="field">
      <input type="password" name="password" placeholder="Password" />
    </div>
    <div class="field">
      <input type="checkbox" name="remember" id="remember" />
      <label for="remember">Remember me</label>
    </div>
    <button type="submit">Login</button>
  </form>
</div>`,
        starterCode: '',
        hints: [
            'Look for input with type="password"',
            'Use @ to reference the type attribute',
            'The answer is: //input[@type="password"]'
        ],
        tags: ['xpath', 'selector', 'attribute', 'basic'],
        targetSelector: '//input[@type="password"]',
    },

    // Challenge 3: Text Content
    {
        slug: 'xpath-text-content',
        title: 'Text Content',
        description: 'Select elements by their text content.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 20,
        order: 13,
        instructions: `# XPath Text Content

XPath can select elements based on their text content using \`text()\`.

## Syntax Options
| Function | Description |
|----------|-------------|
| \`text()="exact"\` | Exact text match |
| \`contains(text(), "partial")\` | Contains text |
| \`normalize-space()="text"\` | Ignores extra whitespace |

## Examples
\`\`\`xpath
//button[text()="Submit"]           // Exact match
//a[text()="Learn More"]            // Link with exact text
//span[contains(text(), "Price")]   // Contains "Price"
\`\`\`

## Your Task
Select the **"Add to Cart"** button using its text.
`,
        htmlContent: `<div class="product-card">
  <img src="/product.jpg" alt="Wireless Headphones" />
  <h3>Wireless Headphones</h3>
  <p class="price">$99.99</p>
  <div class="actions">
    <button class="btn outline">View Details</button>
    <button class="btn primary">Add to Cart</button>
  </div>
</div>`,
        starterCode: '',
        hints: [
            'Use text() to match button text',
            'The exact text is "Add to Cart"',
            'The answer is: //button[text()="Add to Cart"]'
        ],
        tags: ['xpath', 'selector', 'text', 'basic'],
        targetSelector: '//button[text()="Add to Cart"]',
    },

    // Challenge 4: Contains & Starts-with
    {
        slug: 'xpath-contains-starts-with',
        title: 'Contains & Starts-with',
        description: 'Use partial matching for flexible selections.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 25,
        order: 14,
        instructions: `# Contains & Starts-with

When exact matching is too rigid, use partial match functions.

## Functions
| Function | Description |
|----------|-------------|
| \`contains(@attr, "value")\` | Attribute contains value |
| \`starts-with(@attr, "value")\` | Attribute starts with |
| \`contains(text(), "text")\` | Text contains |

## Examples
\`\`\`xpath
//div[contains(@class, "card")]      // Class contains "card"
//input[starts-with(@id, "user")]    // ID starts with "user"
//button[contains(text(), "Save")]   // Text contains "Save"
\`\`\`

## When to Use
- **Dynamic classes** with changing suffixes
- **Generated IDs** with stable prefixes
- **Partial text** matching

## Your Task
Select the **error message** div (has a class containing "error").
`,
        htmlContent: `<form class="registration-form">
  <div class="form-group">
    <input type="email" class="input" placeholder="Email" />
    <div class="message error-message">Please enter a valid email address</div>
  </div>
  <div class="form-group">
    <input type="password" class="input" placeholder="Password" />
    <div class="message hint-message">Password must be at least 8 characters</div>
  </div>
  <div class="form-group">
    <input type="password" class="input" placeholder="Confirm Password" />
    <div class="message success-message">Passwords match!</div>
  </div>
  <button type="submit">Register</button>
</form>`,
        starterCode: '',
        hints: [
            'Look for a div with class containing "error"',
            'Use contains() function for partial matching',
            'The answer is: //div[contains(@class, "error")]'
        ],
        tags: ['xpath', 'selector', 'contains', 'starts-with', 'basic'],
        targetSelector: '//div[contains(@class, "error")]',
    },

    // Challenge 5: Parent/Ancestor
    {
        slug: 'xpath-parent-ancestor',
        title: 'Parent/Ancestor',
        description: 'Navigate UP the DOM tree.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 30,
        order: 15,
        instructions: `# Parent & Ancestor Axes

XPath can navigate UP the DOM tree - something CSS cannot do!

## Axes
| Axis | Description |
|------|-------------|
| \`parent::\` | Direct parent |
| \`ancestor::\` | All ancestors |
| \`..\` | Shorthand for parent |

## Examples
\`\`\`xpath
//input[@id="email"]/parent::div     // Parent div of input
//span[@class="error"]/ancestor::form // Form containing error
//button/..                           // Parent of button
\`\`\`

## Why This Matters
- Find the **row** containing an error
- Get the **form** from child input
- Navigate from **known element** to related container

## Your Task  
Find the **list item (li)** that contains the "Settings" link.
`,
        htmlContent: `<nav class="sidebar">
  <ul class="menu">
    <li class="menu-item">
      <a href="/dashboard">Dashboard</a>
    </li>
    <li class="menu-item">
      <a href="/profile">Profile</a>
    </li>
    <li class="menu-item active">
      <a href="/settings">Settings</a>
    </li>
    <li class="menu-item">
      <a href="/logout">Logout</a>
    </li>
  </ul>
</nav>`,
        starterCode: '',
        hints: [
            'First find the link with text "Settings"',
            'Then navigate up to its parent li',
            'The answer is: //a[text()="Settings"]/parent::li or //a[text()="Settings"]/..'
        ],
        tags: ['xpath', 'selector', 'parent', 'ancestor', 'basic'],
        targetSelector: '//a[text()="Settings"]/parent::li',
    },

    // Challenge 6: Following-sibling
    {
        slug: 'xpath-following-sibling',
        title: 'Following-sibling',
        description: 'Navigate to elements that come after.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 35,
        order: 16,
        instructions: `# Following-sibling Axis

Navigate to siblings that come AFTER the current element.

## Axes
| Axis | Description |
|------|-------------|
| \`following-sibling::\` | All following siblings |
| \`preceding-sibling::\` | All preceding siblings |

## Examples
\`\`\`xpath
//label[text()="Email"]/following-sibling::input
//h2/following-sibling::p[1]           // First p after h2
//dt[text()="Price"]/following-sibling::dd
\`\`\`

## Use Cases
- Find the **input** for a specific **label**
- Get the **value** next to a **label** in definition lists
- Navigate in **forms** with label-input pairs

## Your Task
Select the **input** field that follows the "Username" label.
`,
        htmlContent: `<form class="user-form">
  <div class="field-row">
    <label>Full Name</label>
    <input type="text" name="fullname" placeholder="John Doe" />
  </div>
  <div class="field-row">
    <label>Username</label>
    <input type="text" name="username" placeholder="johndoe" />
  </div>
  <div class="field-row">
    <label>Phone</label>
    <input type="tel" name="phone" placeholder="+1 234 567 890" />
  </div>
</form>`,
        starterCode: '',
        hints: [
            'Find the label with text "Username" first',
            'Then use following-sibling to get the next input',
            'The answer is: //label[text()="Username"]/following-sibling::input'
        ],
        tags: ['xpath', 'selector', 'following-sibling', 'basic'],
        targetSelector: '//label[text()="Username"]/following-sibling::input',
    },

    // Challenge 7: Multiple Conditions
    {
        slug: 'xpath-multiple-conditions',
        title: 'Multiple Conditions',
        description: 'Combine conditions with and/or operators.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 35,
        order: 17,
        instructions: `# Multiple Conditions

Combine multiple conditions using logical operators.

## Operators
| Operator | Description |
|----------|-------------|
| \`and\` | Both conditions must be true |
| \`or\` | Either condition can be true |
| \`not()\` | Negates the condition |

## Examples
\`\`\`xpath
//input[@type="text" and @required]
//button[@disabled or @aria-disabled="true"]
//input[not(@disabled)]
//div[@class="alert" and contains(text(), "error")]
\`\`\`

## Your Task
Select the button that is both **type="submit"** AND has the **"primary"** class.
`,
        htmlContent: `<div class="dialog">
  <h2>Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <div class="dialog-actions">
    <button type="button" class="btn secondary">Cancel</button>
    <button type="button" class="btn danger">Delete</button>
    <button type="submit" class="btn primary">Confirm</button>
  </div>
</div>`,
        starterCode: '',
        hints: [
            'You need both type="submit" AND class containing "primary"',
            'Use the "and" operator to combine conditions',
            'The answer is: //button[@type="submit" and contains(@class, "primary")]'
        ],
        tags: ['xpath', 'selector', 'and', 'or', 'conditions', 'basic'],
        targetSelector: '//button[@type="submit" and contains(@class, "primary")]',
    },

    // Challenge 8: Position & Indexing
    {
        slug: 'xpath-position-indexing',
        title: 'Position & Indexing',
        description: 'Select elements by their position.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 40,
        order: 18,
        instructions: `# Position & Indexing

XPath uses 1-based indexing to select elements by position.

## Position Functions
| Syntax | Description |
|--------|-------------|
| \`[1]\` | First element |
| \`[last()]\` | Last element |
| \`[position()=2]\` | Second element |
| \`[position()>1]\` | All except first |
| \`[position()<4]\` | First three |

## Examples
\`\`\`xpath
//ul/li[1]              // First list item
//table/tr[last()]      // Last table row  
//div[@class="item"][2] // Second matching div
(//button)[3]           // Third button on page
\`\`\`

## ⚠️ Important Note
- \`//div[1]\` = First div **within each parent**
- \`(//div)[1]\` = First div **on the entire page**

## Your Task
Select the **last item** in the navigation menu.
`,
        htmlContent: `<nav class="top-nav">
  <ul class="nav-list">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>`,
        starterCode: '',
        hints: [
            'Use last() to get the final element',
            'Select the li elements within nav',
            'The answer is: //nav//li[last()] or //ul/li[last()]'
        ],
        tags: ['xpath', 'selector', 'position', 'indexing', 'basic'],
        targetSelector: '//ul/li[last()]',
    },

    // Challenge 9: Normalize-space
    {
        slug: 'xpath-normalize-space',
        title: 'Normalize-space',
        description: 'Handle whitespace in text content.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 45,
        order: 19,
        instructions: `# Normalize-space

Real HTML often has inconsistent whitespace. \`normalize-space()\` handles this.

## What It Does
- Strips leading/trailing whitespace
- Collapses multiple spaces to single space

## Examples
\`\`\`html
<button>  Submit   Form  </button>
\`\`\`

\`\`\`xpath
// Won't match:
//button[text()="Submit Form"]

// Will match:
//button[normalize-space()="Submit Form"]
\`\`\`

## Common Uses
\`\`\`xpath
//button[normalize-space()="Submit"]
//span[normalize-space(text())="Hello World"]
//*[normalize-space()="Search"]
\`\`\`

## Your Task
Select the button with text "   Save Changes   " (has extra whitespace).
`,
        htmlContent: `<div class="form-actions">
  <button type="button" class="btn">
    Cancel
  </button>
  <button type="button" class="btn secondary">
    Save Draft
  </button>
  <button type="submit" class="btn primary">
    Save Changes
  </button>
</div>`,
        starterCode: '',
        hints: [
            'The button text has whitespace that text()= won\'t match',
            'Use normalize-space() to handle the whitespace',
            'The answer is: //button[normalize-space()="Save Changes"]'
        ],
        tags: ['xpath', 'selector', 'normalize-space', 'whitespace', 'basic'],
        targetSelector: '//button[normalize-space()="Save Changes"]',
    },

    // Challenge 10: Complex XPath
    {
        slug: 'xpath-complex-table',
        title: 'Complex XPath: Tables',
        description: 'Navigate complex table structures.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'xpath-basics',
        xpReward: 50,
        order: 20,
        instructions: `# Complex XPath: Tables

Tables are common in web apps. Let's master navigating them!

## Table Structure
\`\`\`html
<table>
  <thead>
    <tr><th>Header</th></tr>
  </thead>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
\`\`\`

## Common Patterns
\`\`\`xpath
// Cell by row and column
//table//tr[2]/td[3]

// Row containing specific text
//tr[td[text()="John"]]

// Cell in same row as another cell
//td[text()="John"]/following-sibling::td[1]
\`\`\`

## Your Task
Select the **status cell** for the order with ID "ORD-002".

> **Hint:** First find the row with that order ID, then get the status column.
`,
        htmlContent: `<table class="orders-table">
  <thead>
    <tr>
      <th>Order ID</th>
      <th>Customer</th>
      <th>Amount</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ORD-001</td>
      <td>Alice Johnson</td>
      <td>$150.00</td>
      <td class="status shipped">Shipped</td>
    </tr>
    <tr>
      <td>ORD-002</td>
      <td>Bob Smith</td>
      <td>$89.99</td>
      <td class="status pending">Pending</td>
    </tr>
    <tr>
      <td>ORD-003</td>
      <td>Carol White</td>
      <td>$220.50</td>
      <td class="status delivered">Delivered</td>
    </tr>
  </tbody>
</table>`,
        starterCode: '',
        hints: [
            'Find the row that contains "ORD-002"',
            'Then select the td with class "status" or the 4th td',
            'The answer is: //tr[td[text()="ORD-002"]]/td[4] or //td[text()="ORD-002"]/following-sibling::td[@class="status pending"]'
        ],
        tags: ['xpath', 'selector', 'table', 'complex', 'basic'],
        targetSelector: '//tr[td[text()="ORD-002"]]/td[4]',
    },
];

// ============================================================================
// CSS vs XPATH COMPARISON CHALLENGES (3)
// ============================================================================

const comparisonChallenges = [
    // Challenge 1: Same Element, Two Ways
    {
        slug: 'selector-comparison-same-element',
        title: 'Same Element, Two Ways',
        description: 'Write both CSS and XPath for the same element.',
        type: 'CSS_SELECTOR' as const, // Start with CSS
        difficulty: 'EASY' as const,
        category: 'selector-comparison',
        xpReward: 30,
        order: 21,
        instructions: `# Same Element, Two Ways

Often you can select the same element with either CSS or XPath. Let's compare!

## The Target
Select the **Search button** in the form below.

## CSS Approach
\`\`\`css
#search-btn          /* By ID */
button[type="submit"]
.search-form button
\`\`\`

## XPath Approach
\`\`\`xpath
//*[@id="search-btn"]
//button[@type="submit"]
//form[@class="search-form"]//button
\`\`\`

## Your Task (CSS)
Write a CSS selector to select the search button.

> **Note:** Toggle to XPath to try the same element with XPath!
`,
        htmlContent: `<header class="main-header">
  <div class="logo">MySite</div>
  <form class="search-form">
    <input type="text" placeholder="Search..." class="search-input" />
    <button type="submit" id="search-btn" class="btn search-btn">Search</button>
  </form>
  <nav class="user-nav">
    <button class="btn">Login</button>
  </nav>
</header>`,
        starterCode: '',
        hints: [
            'The button has an ID: search-btn',
            'In CSS, use # for ID selectors',
            'The answer is: #search-btn'
        ],
        tags: ['css', 'xpath', 'comparison', 'basic'],
        targetSelector: '#search-btn',
    },

    // Challenge 2: When XPath Wins
    {
        slug: 'selector-when-xpath-wins',
        title: 'When XPath Wins',
        description: 'A scenario where XPath can do what CSS cannot.',
        type: 'XPATH_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'selector-comparison',
        xpReward: 35,
        order: 22,
        instructions: `# When XPath Wins

There are things XPath can do that CSS **cannot**:

## XPath Exclusive Features
1. ✅ **Navigate UP** (parent, ancestor)
2. ✅ **Select by text content** (text())
3. ✅ **Preceding siblings**
4. ✅ **Complex conditions**

## The Challenge
Find the **product card** (div.product-card) that contains "Out of Stock" text.

With CSS, you'd need JavaScript. With XPath, it's one line!

## Your Task
Write an XPath to select the product card containing "Out of Stock".

> **Tip:** Use \`contains()\` to check for text within children.
`,
        htmlContent: `<div class="products-grid">
  <div class="product-card">
    <h3>Wireless Mouse</h3>
    <p class="price">$29.99</p>
    <span class="stock in-stock">In Stock</span>
    <button class="btn">Add to Cart</button>
  </div>
  <div class="product-card">
    <h3>Mechanical Keyboard</h3>
    <p class="price">$89.99</p>
    <span class="stock out-of-stock">Out of Stock</span>
    <button class="btn" disabled>Unavailable</button>
  </div>
  <div class="product-card">
    <h3>USB Hub</h3>
    <p class="price">$19.99</p>
    <span class="stock in-stock">In Stock</span>
    <button class="btn">Add to Cart</button>
  </div>
</div>`,
        starterCode: '',
        hints: [
            'You need to find a div that contains "Out of Stock" text',
            'Use contains() or .// to check descendant text',
            'The answer is: //div[@class="product-card" and .//span[contains(text(), "Out of Stock")]]'
        ],
        tags: ['xpath', 'comparison', 'text', 'parent', 'basic'],
        targetSelector: '//div[contains(@class, "product-card") and .//text()[contains(., "Out of Stock")]]',
    },

    // Challenge 3: The Faster Selector
    {
        slug: 'selector-performance',
        title: 'The Faster Selector',
        description: 'Understand selector performance implications.',
        type: 'CSS_SELECTOR' as const,
        difficulty: 'EASY' as const,
        category: 'selector-comparison',
        xpReward: 40,
        order: 23,
        instructions: `# Selector Performance

In general, **CSS selectors are faster** than XPath in modern browsers.

## Performance Ranking (Fastest → Slowest)
1. 🏆 **ID selector** - \`#myId\`
2. 🥈 **Class selector** - \`.myClass\`
3. 🥉 **Tag selector** - \`div\`
4. ⚡ **Attribute selector** - \`[data-testid]\`
5. 🐢 **Complex XPath** - \`//div[contains(@class, "x")]//span\`

## Best Practices
- Prefer **ID** when available
- Use **data-testid** for test automation
- Keep selectors **short and specific**
- Avoid **overly complex** XPath

## Your Task
Select the submit button using the **most performant** selector.

> **Hint:** ID is the fastest!
`,
        htmlContent: `<form id="contact-form" class="form contact-form modern-design">
  <div class="form-group">
    <input type="text" id="name-field" data-testid="name" class="input" placeholder="Name" />
  </div>
  <div class="form-group">
    <input type="email" id="email-field" data-testid="email" class="input" placeholder="Email" />
  </div>
  <div class="form-group">
    <textarea id="message-field" data-testid="message" class="input textarea" placeholder="Message"></textarea>
  </div>
  <div class="form-actions">
    <button type="reset" id="reset-btn" class="btn secondary">Clear</button>
    <button type="submit" id="submit-btn" data-testid="submit" class="btn primary">Send Message</button>
  </div>
</form>`,
        starterCode: '',
        hints: [
            'ID selectors are the fastest',
            'The submit button has id="submit-btn"',
            'The answer is: #submit-btn'
        ],
        tags: ['css', 'performance', 'best-practices', 'basic'],
        targetSelector: '#submit-btn',
    },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedBasicChallenges() {
    console.log('🌱 Seeding Basic tier challenges...\n');

    try {
        // ====================================================================
        // STEP 1: Clear existing challenges (except keep test cases temporarily)
        // ====================================================================
        console.log('🧹 Cleaning up existing challenges...');

        // Get existing challenge IDs
        const existingChallenges = await db.select({ id: challenges.id }).from(challenges);
        const existingIds = existingChallenges.map(c => c.id);

        if (existingIds.length > 0) {
            // Delete test cases for existing challenges
            await db.delete(testCases).where(inArray(testCases.challengeId, existingIds));
            console.log(`   Deleted test cases for ${existingIds.length} challenges`);

            // Delete existing challenges
            await db.delete(challenges);
            console.log(`   Deleted ${existingIds.length} existing challenges`);
        }

        // ====================================================================
        // STEP 2: Insert CSS Selector Challenges
        // ====================================================================
        console.log('\n📘 Creating CSS Selector challenges...');

        for (const challenge of cssChallenges) {
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

            // Add test case for selector validation
            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: `Selector should correctly match the target element`,
                input: { selector: challenge.targetSelector },
                expectedOutput: { matchCount: 1 },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order}. ${challenge.title}`);
        }

        // ====================================================================
        // STEP 3: Insert XPath Challenges
        // ====================================================================
        console.log('\n📙 Creating XPath challenges...');

        for (const challenge of xpathChallenges) {
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

            // Add test case
            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: `XPath should correctly match the target element`,
                input: { xpath: challenge.targetSelector },
                expectedOutput: { matchCount: 1 },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order}. ${challenge.title}`);
        }

        // ====================================================================
        // STEP 4: Insert Comparison Challenges
        // ====================================================================
        console.log('\n📗 Creating CSS vs XPath comparison challenges...');

        for (const challenge of comparisonChallenges) {
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

            // Add test case
            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: `Selector should correctly match the target element`,
                input: { selector: challenge.targetSelector },
                expectedOutput: { matchCount: 1 },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order}. ${challenge.title}`);
        }

        // ====================================================================
        // SUMMARY
        // ====================================================================
        const totalChallenges = cssChallenges.length + xpathChallenges.length + comparisonChallenges.length;

        console.log('\n' + '='.repeat(50));
        console.log('✨ Basic tier seeding complete!');
        console.log('='.repeat(50));
        console.log(`📊 Summary:`);
        console.log(`   • CSS Selector challenges: ${cssChallenges.length}`);
        console.log(`   • XPath challenges: ${xpathChallenges.length}`);
        console.log(`   • Comparison challenges: ${comparisonChallenges.length}`);
        console.log(`   • Total: ${totalChallenges} challenges`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Run the seed function
seedBasicChallenges()
    .then(() => {
        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed database:', error);
        process.exit(1);
    });
