/**
 * Basic Tier Challenges Seed Script
 * 
 * Seeds the database with Basic tier CSS and XPath selector challenges.
 * Run with: bun run db:seed:basic
 */

import { db } from './index';
import { challenges, testCases, tutorials } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================================
// CSS SELECTOR CHALLENGES (10)
// ============================================================================

// ============================================================================
// CSS SELECTOR CHALLENGES (10)
// ============================================================================

// Helper to get tutorial ID by slug
async function getTutorialId(slug: string) {
  const tutorial = await db.query.tutorials.findFirst({
    where: eq(tutorials.slug, slug),
  });
  return tutorial?.id;
}

// ============================================================================
// CSS SELECTOR CHALLENGES
// ============================================================================

export const cssChallenges = [
  // ==========================================================================
  // MODULE 1: THE FOUNDATIONS
  // ==========================================================================

  // 1.1 ID & Class
  {
    slug: 'css-selector-101-id-class',
    title: 'ID & Class Selectors', // Removed "1.1 Concept:"
    description: 'Master the two most fundamental building blocks of CSS selection.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 10,
    order: 1,
    instructions: `# The Fundamentals: ID & Class
    
In the world of web automation and testing, **reliability is king**. The most robust tests rely on stable identifiers.

## 1. The ID Selector (\`#\`)
An ID is unique—it acts like a fingerprint for an element. If an element has an ID, it is almost always the best way to select it.
- **Syntax:** \`#elementId\`
- **Example:** \`#submit-btn\` targets \`<button id="submit-btn">\`

## 2. The Class Selector (\`.\`)
Classes are reusable. They identify a *type* of element rather than a specific instance.
- **Syntax:** \`.className\`
- **Example:** \`.primary-btn\` targets all buttons with that style.

## Your Mission
You need to click the **Login** button.
Since this is a critical action, the developers have given it a unique ID. Use it!
`,
    htmlContent: `<div class="login-wrapper">
  <h1>System Login</h1>
  <form class="login-form">
    <div class="input-group">
      <input type="text" id="username" placeholder="Username" />
    </div>
    <div class="input-group">
      <input type="password" id="password" placeholder="Password" />
    </div>
    <div class="actions">
      <button type="submit" id="login-btn" class="btn btn-primary">Login</button>
      <a href="#" class="forgot-link">Forgot Password?</a>
    </div>
  </form>
</div>`,
    starterCode: '',
    hints: [
      'The login button has a unique id="login-btn"',
      'In CSS, we use the hash symbol (#) to target an ID',
      'Try: #login-btn'
    ],
    tags: ['beginner', 'css', 'basics', 'id', 'class'],
    targetSelector: '#login-btn',
  },

  // 1.2 Tag Selectors
  {
    slug: 'css-tag-selectors',
    title: 'Tag Name Selectors', // Removed "Drill"
    description: 'Select elements purely by their HTML tag type.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 10,
    order: 2,
    instructions: `# Tag Selection

Sometimes you want to target broad categories of elements rather than specific ones. **Tag selectors** allow you to do just that.

## How it works
You simply use the name of the HTML tag.
- \`p\` targets all **paragraphs**.
- \`div\` targets all **containers**.
- \`a\` targets all **links**.

> **Pro Tip:** In real automation, tag selectors are rare because they are too generic. However, they are powerful when combined with other selectors (e.g., "get me the \`span\` inside this button").

## Your Mission
Select the main **paragraph** of text in the welcome card.
`,
    htmlContent: `<div class="welcome-card">
  <h2>Welcome Aboard</h2>
  <p>Thank you for joining our platform. We are excited to see what you build!</p>
  <button class="btn">Get Started</button>
</div>`,
    starterCode: '',
    hints: ['The text is inside a <p> tag', 'Use the tag name directly', 'Answer: p'],
    tags: ['beginner', 'css', 'basics', 'tag'],
    targetSelector: 'p',
  },

  // 1.3 Combining Basics
  {
    slug: 'css-combining-basics',
    title: 'Combining Selectors', // Removed "Drill"
    description: 'Increase specificity by chaining tags and classes together.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 20,
    order: 3,
    instructions: `# Specificity through Combination

A single class name isn't always enough using a generic class like \`.error\`? It might be applied to a label, a div, or a span.

To be more precise, you can **chain** selectors.

## The Pattern
\`tag.className\`

This tells the browser: "Find me a \`<tag>\` that ALSO has this \`.class\`".

### Examples
- \`div.sidebar\` -> Only divs with the sidebar class.
- \`button.primary\` -> Only buttons with the primary class.

## Your Mission
There are multiple "error" styles on the page. Your goal is to select only the **Error Message Banner**, which is a \`div\`. Do not select the error label inside the span.
`,
    htmlContent: `<div class="notification-area">
  <div class="msg success">Update successful</div>
  
  <!-- Target -->
  <div class="msg error">Connection failed</div>
  
  <form>
    <label>Username <span class="error">*</span></label>
    <input type="text" />
  </form>
</div>`,
    starterCode: '',
    hints: [
      'We want the element that is a <div> AND has class "error"',
      'Do not put spaces between the tag and class',
      'Answer: div.error'
    ],
    tags: ['beginner', 'css', 'basics', 'combining'],
    targetSelector: 'div.error',
  },

  // 1.4 The Legacy Page
  {
    slug: 'css-foundations-boss',
    title: 'Scenario: Legacy App Testing',
    description: 'Use selector chaining to identify a specific button in a messy layout.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 50,
    order: 4,
    instructions: `# Scenario: Legacy App Testing

You've just joined a new project. The code is old ("legacy") and messy. 
- There are **no IDs** to be found. 
- The class names like \`.btn\` and \`.primary\` are reused everywhere.
- You cannot change the HTML code.

## Your Mission
You need to write a stable selector for the **"Sign Up"** button in the Hero section.

## Strategy
To identify this specific needle in the haystack, you must be hyper-specific. Identify every trait it has:
1. It is a \`button\` tag.
2. It has the \`btn\` class.
3. It has the \`primary\` class.
4. It has the \`large\` class.

Chain these together to create a selector that helps ensure you don't accidentally click the wrong button.
`,
    htmlContent: `<div class="legacy-wrapper">
  <div class="top-bar">
    <button class="btn small">Login</button>
    <button class="btn primary small">Stats</button>
  </div>
  
  <section class="hero-section">
    <h1>Start your journey</h1>
    <!-- This is your target -->
    <button class="btn primary large">Sign Up</button>
  </section>
  
  <div class="footer">
    <button class="btn large text-only">Back to Top</button>
  </div>
</div>`,
    starterCode: '',
    hints: [
      'Combine the tag and all 3 classes',
      'Format: tag.class1.class2.class3',
      'Answer: button.btn.primary.large'
    ],
    tags: ['beginner', 'css', 'basics', 'scenario'],
    targetSelector: 'button.btn.primary.large',
  },

  // ==========================================================================
  // MODULE 2: RELATIVE SELECTION
  // ==========================================================================

  // 2.1 Child vs Descendant
  {
    slug: 'css-child-descendant',
    title: 'Child vs Descendant',
    description: 'Understand how to traverse down the DOM tree.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 15,
    order: 5,
    instructions: `# Hierarchy: Child vs Descendant

Web pages are trees. Elements live inside other elements. Understanding how to drill down is crucial.

## 1. The Descendant Selector (Space)
\`parent child\`
This is a "fuzzy" search. It finds elements deeply nested anywhere inside the parent.
*   \`div p\` matches a paragraph inside a div, even if it's 10 levels deep.

## 2. The Direct Child Selector (\`>\`)
\`parent > child\`
This is a "strict" search. It only finds elements that are **direct children** (immediate nesting).

## Your Mission
Select only the top-level **menu items** in the navigation bar. 
Do **not** select the items inside the dropdown submenu. Use the direct child selector to ensure precision.
`,
    htmlContent: `<nav class="main-nav">
  <ul class="nav-menu">
    <!-- These are direct children -->
    <li class="nav-item">Home</li>
    <li class="nav-item">
      Products
      <!-- Nested Dropdown -->
      <ul class="submenu">
        <li>Electronics (Do not select)</li>
        <li>Books (Do not select)</li>
      </ul>
    </li>
    <li class="nav-item">Contact</li>
  </ul>
</nav>`,
    starterCode: '',
    hints: [
      'The menu container is .nav-menu',
      'The items are <li> tags',
      'Use > to stop it from going into the submenu',
      'Answer: .nav-menu > li'
    ],
    tags: ['beginner', 'css', 'relationships', 'child'],
    targetSelector: '.nav-menu > li',
  },

  // 2.2 Siblings
  {
    slug: 'css-sibling-selectors',
    title: 'Sibling Selectors',
    description: 'Select elements based on what comes before them.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 25,
    order: 6,
    instructions: `# Sibling Relationships

Sometimes an element is hard to identify, but it lives **right next** to something easy to identify.

## The Adjacent Sibling (\`+\`)
\`element + sibling\`
This selects the element that comes **immediately after**.

### Use Case
"I need the error message that appears right after the email input."
-> \`input[type="email"] + .error-msg\`

## Your Mission
Select the **subtitle paragraph** that appears immediately after the main **Heading 1**.
`,
    htmlContent: `<article class="blog-post">
  <h1 class="post-title">The Future of Web Testing</h1>
  
  <!-- Target -->
  <p class="subtitle">Why selectors specificy matters more than ever.</p>
  
  <p class="content">Web testing has evolved significantly...</p>
</article>`,
    starterCode: '',
    hints: [
      'Find the h1',
      'Use the + symbol to get the next element',
      'Answer: h1 + p'
    ],
    tags: ['beginner', 'css', 'relationships', 'siblings'],
    targetSelector: 'h1 + p',
  },

  // 2.3 Deep Nesting
  {
    slug: 'css-family-drill',
    title: 'Drill: Deep Nesting',
    description: 'Drill down a specific path to distinguish identical elements.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 30,
    order: 7,
    instructions: `# Precision through Pathing

When a page has multiple identical components (like multiple "Cards"), you need to specify **which one** you are talking about by describing its ancestors.

## The Scenario
We have a User Profile card and a Footer area. Both contain a \`<span>\`.
You need to select the span inside the **Profile Card content**.

## Your Mission
Construct a "path" selector that walks down the tree:
1. Start at the \`.profile-card\`
2. Go into the \`.card-content\`
3. Select the \`span\`

\`Card -> Content -> Span\`
`,
    htmlContent: `<div class="layout">
  <div class="profile-card">
    <div class="card-header">
      <h3>User Profile</h3>
    </div>
    <div class="card-content">
      <!-- Target -->
      <span>Premium Member</span>
    </div>
  </div>
  
  <div class="footer">
    <div class="footer-content">
      <span>Copyright 2024</span>
    </div>
  </div>
</div>`,
    starterCode: '',
    hints: [
      'Chain the classes with spaces for descendant selection',
      'Pattern: .parent .child .grandchild',
      'Answer: .profile-card .card-content span'
    ],
    tags: ['beginner', 'css', 'relationships', 'drill'],
    targetSelector: '.profile-card .card-content span',
  },

  // 2.4 Mega Menu
  {
    slug: 'css-navigation-boss',
    title: 'Scenario: Nested Navigation',
    description: 'Navigate a deeply nested menu structure to find a hidden link.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'css-basics',
    xpReward: 60,
    order: 8,
    instructions: `# Scenario: Nested Navigation

Navigations can be widely complex structures of nested lists. 

## The Scenario
You are automating a test for a user's account settings. You need to click the **"Logout"** button.
However, the text "Logout" might change based on language settings, so you shouldn't rely on text. You should rely on its **structural location**.

## Your Mission
Select the link (\`a\`) that lives inside the **Action Item** of the **Profile Dropdown**.

## Structure Map
1.  Top level item: \`#user-menu\`
2.  Dropdown container: \`.dropdown-list\`
3.  List item: \`.action-item\`
4.  Link: \`a\`
`,
    htmlContent: `<nav class="navbar">
  <ul class="nav-root">
    <li>Home</li>
    <li id="user-menu">
      My Account
      <ul class="dropdown-list">
        <li>Settings</li>
        <li>Billing</li>
        <li class="action-item">
          <!-- Target -->
          <a href="/logout">Logout</a>
        </li>
      </ul>
    </li>
  </ul>
</nav>`,
    starterCode: '',
    hints: [
      'Start with the ID: #user-menu',
      'Descend into .dropdown-list',
      'Find the .action-item',
      'Target the link inside',
      'Answer: #user-menu .dropdown-list .action-item a'
    ],
    tags: ['beginner', 'css', 'relationships', 'scenario'],
    targetSelector: '#user-menu .dropdown-list .action-item a',
  },

  // ==========================================================================
  // MODULE 3: ATTRIBUTES & STATES
  // ==========================================================================

  // 3.1 Attributes
  {
    slug: 'css-attribute-selectors',
    title: 'Attribute Selectors',
    description: 'Target elements by any HTML attribute for maximum robustness.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 20,
    order: 9,
    instructions: `# The Power of Attributes

Classes are for styling. IDs are for uniqueness. But sometimes, the most semantic way to find an element is by **what it does** or **what data it holds**.

CSS allows you to select by *any* HTML attribute.

## Common Patterns
- **Input Types:** \`[type="email"]\`, \`[type="checkbox"]\`
- **Test IDs:** \`[data-testid="submit-btn"]\` (The gold standard for testing!)
- **Links:** \`[href="/home"]\`

## Your Mission
Select the **email input**. Use its \`type\` attribute to distinguish it from the name input.
`,
    htmlContent: `<form class="contact-form">
  <div class="row">
    <label>Full Name</label>
    <input type="text" name="fullname" />
  </div>
  <div class="row">
    <label>Email Address</label>
    <input type="email" name="email" />
  </div>
  <button>Send</button>
</form>`,
    starterCode: '',
    hints: [
      'The syntax is [attribute="value"]',
      'Target the input with type="email"',
      'Answer: [type="email"]'
    ],
    tags: ['beginner', 'css', 'attributes'],
    targetSelector: '[type="email"]',
  },

  // 3.2 Validation States
  {
    slug: 'css-validation-states',
    title: 'Form Validation States',
    description: 'Select elements based on their validity state (:invalid, :required).',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 30,
    order: 10,
    instructions: `# Testing Form Logic

When testing forms, you often need to verify that validation is working. "Does the form look red when I type a bad email?"

CSS provides pseudo-classes to detect these states dynamically.

## Key State Selectors
*   \`:required\` - The input *must* be filled out.
*   \`:invalid\` - The current value is wrong (e.g., "abc" in an email field).
*   \`:valid\` - The current value is correct.

## Your Mission
Select the **email input** that is currently **invalid**. 
(In the background, we've pre-filled it with "not-an-email" to trigger this state.)
`,
    htmlContent: `<form class="login-form">
  <div class="form-group">
    <label>Email</label>
    <input type="email" value="not-an-email" required /> <!-- This is invalid -->
    <span class="error-text">Please enter a valid email</span>
  </div>
  <div class="form-group">
    <label>Password</label>
    <input type="password" value="secret123" required /> <!-- This is valid -->
  </div>
</form>`,
    starterCode: '',
    hints: [
      'You are looking for an input tag',
      'It should specifically be in the :invalid state',
      'Answer: input:invalid'
    ],
    tags: ['beginner', 'css', 'states', 'validation'],
    targetSelector: 'input:invalid',
  },

  // 3.3 Functional Pseudos
  {
    slug: 'css-functional-pseudo',
    title: 'Advanced Filtering (:not & :is)',
    description: 'Power moves: Exclude elements or match groups.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 40,
    order: 11,
    instructions: `# Advanced Filtering

Modern CSS selectors give you logic gates. The most useful one for testing is **Negation**.

## The \`:not()\` Selector
"Select everything that is X, but NOT Y."

### Use Case
"Select all active user cards, but ignore the ones that are suspended."

## Your Mission
Select the user card that has the class \`.active\`, but does **not** have the class \`.suspended\`.
`,
    htmlContent: `<div class="user-list">
  <!-- This one is active AND suspended. Ignore it. -->
  <div class="user-card active suspended">
    <h3>Bad Actor</h3>
    <span class="badge">Suspended</span>
  </div>

  <!-- This is your target. Active, healthy user. -->
  <div class="user-card active">
    <h3>Good User</h3>
    <span class="badge">Active</span>
  </div>

  <div class="user-card inactive">
    <h3>Old User</h3>
  </div>
</div>`,
    starterCode: '',
    hints: [
      'Base selector: .user-card.active',
      'Filter: :not(.suspended)',
      'Combine them',
      'Answer: .user-card.active:not(.suspended)'
    ],
    tags: ['beginner', 'css', 'states', 'functional'],
    targetSelector: '.user-card.active:not(.suspended)',
  },

  // 3.4 Unfriendly Form
  {
    slug: 'css-forms-boss',
    title: 'Scenario: Dynamic Forms',
    description: 'Select a highly specific input based on what it is NOT.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'css-basics',
    xpReward: 60,
    order: 12,
    instructions: `# Scenario: Dynamic Forms

You're testing a dynamic form where fields appear and disappear, or change states. You can't rely on simple classes. You need to select an element by its **properties**.

## Your Mission
Select the **Phone Number** input.

## Constraints
To ensure you have the right one, your selector must enforce these rules:
1.  Type is **tel**.
2.  It is **optional** (not required).
3.  It is **enabled** (not disabled).
4.  It is **not focused** (the user hasn't clicked it yet).

Synthesize all your knowledge of attributes and pseudo-classes.
`,
    htmlContent: `<form class="complex-form">
  <div class="row">
    <input type="text" placeholder="Name" required />
  </div>
  
  <div class="row">
    <!-- Target -->
    <input type="tel" placeholder="Phone (Optional)" />
  </div>
  
  <div class="row">
    <input type="tel" placeholder="Fax (Disabled)" disabled />
  </div>
  
  <div class="row">
    <input type="email" placeholder="Email" required class="focus" />
  </div>
</form>`,
    starterCode: '',
    hints: [
      'Attribute: [type="tel"]',
      'State: :optional',
      'Negation: :not(:disabled)',
      'Negation: :not(:focus)',
      'Answer: input[type="tel"]:optional:not(:disabled)'
    ],
    tags: ['beginner', 'css', 'states', 'scenario'],
    targetSelector: 'input[type="tel"]:optional:not(:disabled)',
  },

  // ==========================================================================
  // MODULE 4: STRUCTURAL PRECISION
  // ==========================================================================

  // 4.1 Nth-Child
  {
    slug: 'css-nth-child',
    title: 'Position Indexing (Nth-Child)',
    description: 'Select elements by their exact numerical position.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'css-basics',
    xpReward: 20,
    order: 13,
    instructions: `# Selecting by Index

Sometimes elements are identical (like a list of items), and the only way to distinguish them is **position**.

## The \`:nth-child(n)\` Selector
This selects the element that is the **n-th child** of its parent.

- \`:nth-child(1)\`: First item.
- \`:nth-child(3)\`: Third item.
- \`:last-child\`: The end of the list.

## Your Mission
Select the **3rd** item in the feature list.
`,
    htmlContent: `<ul class="features">
  <li>Fast Performance</li>
  <li>Secure by Default</li>
  <!-- Target -->
  <li>Cloud Sync</li>
  <li>Offline Mode</li>
</ul>`,
    starterCode: '',
    hints: [
      'Use :nth-child(3)',
      'Answer: li:nth-child(3)'
    ],
    tags: ['beginner', 'css', 'structure'],
    targetSelector: 'li:nth-child(3)',
  },

  // 4.2 Type vs Child
  {
    slug: 'css-nth-type-vs-child',
    title: 'Nth-Type vs Nth-Child',
    description: 'Resolve the confusion between counting children and counting types.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 30,
    order: 14,
    instructions: `# The "Indices" Trap

One of the most common mistakes in CSS selectors is confusing \`:nth-child\` with \`:nth-of-type\`.

## The Difference
*   **\`:nth-child(2)\`**: "Am I the **2nd element overall** in this container?"
*   **\`:nth-of-type(2)\`**: "Am I the **2nd element of my specific tag type**?"

If you have a \`<h1>\` followed by two \`<p>\` tags:
*   The first \`<p>\` is \`nth-child(2)\` (because h1 is #1).
*   The first \`<p>\` is \`nth-of-type(1)\` (because it's the first paragraph).

## Your Mission
Select the **second paragraph** in the article.
Note that it is **not** the second child element!
`,
    htmlContent: `<article>
  <h1>The News</h1>
  <img src="banner.jpg" />
  
  <p>Introductory paragraph.</p>
  
  <!-- Target -->
  <p>The main details of the story.</p>
  
  <div class="ad">Advertisement</div>
</article>`,
    starterCode: '',
    hints: [
      'Use :nth-of-type to count only the <p> tags',
      'Answer: p:nth-of-type(2)'
    ],
    tags: ['beginner', 'css', 'structure'],
    targetSelector: 'p:nth-of-type(2)',
  },

  // 4.3 Table Cell Targeting
  {
    slug: 'css-table-drill',
    title: 'Table Cell Targeting',
    description: 'Navigate table structure to select specific cells by row and column.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 35,
    order: 15,
    instructions: `# Precision Table Navigation

Tables have a predictable structure: \`table > tbody > tr > td\`.
Each row resets the child counter, so you can target specific cells.

## The Pattern
- **Row selection:** \`tr:nth-child(n)\` targets the nth row
- **Column selection:** \`td:nth-child(n)\` targets the nth cell in a row
- **Combined:** \`tr:nth-child(2) > td:nth-child(3)\` = Row 2, Column 3

## Your Mission
Select the **Status** cell (3rd column) from the **2nd data row**.

## Tip
The \`tbody\` contains only data rows. The header is in \`thead\`.
`,
    htmlContent: `<table class="user-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Johnson</td>
      <td>alice@example.com</td>
      <td>Active</td>
    </tr>
    <tr>
      <td>Bob Smith</td>
      <td>bob@example.com</td>
      <!-- Target -->
      <td>Pending</td>
    </tr>
    <tr>
      <td>Carol White</td>
      <td>carol@example.com</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>`,
    starterCode: '',
    hints: [
      'Start with tbody to scope to data rows only',
      'Target the 2nd row: tr:nth-child(2)',
      'Target the 3rd column: td:nth-child(3)',
      'Answer: tbody tr:nth-child(2) td:nth-child(3)'
    ],
    tags: ['beginner', 'css', 'structure', 'table', 'drill'],
    targetSelector: 'tbody tr:nth-child(2) td:nth-child(3)',
  },

  // 4.4 Striped Grid
  {
    slug: 'css-table-boss',
    title: 'Scenario: Admin Grid',
    description: 'Master advanced structural patterns in data tables.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'css-basics',
    xpReward: 70,
    order: 16,
    instructions: `# Scenario: Admin Grid

Data grids (tables) are common in admin panels. You often need to interact with a specific button in a specific row.

## The Pattern
We have a table where every **Odd Row** (1, 3, 5...) is a "Data Row" that contains an **Edit Button**.
(The even rows might be details or spacers).

## Your Mission
Write a selector that targets the **Edit Button** in the **Last Column** of every **Odd Row**.

## Breakdown
1.  Target rows: \`tr\` that are odd.
2.  Target cell: \`td\` that is the last one in that row.
3.  Target content: The \`button\` inside that cell.
`,
    htmlContent: `<table class="data-grid">
  <tbody>
    <!-- Row 1 (Odd) -->
    <tr>
      <td>User 1</td>
      <td>2024-01-01</td>
      <td class="actions"><button>Edit</button></td>
    </tr>
    <!-- Row 2 (Even) -->
    <tr class="spacer">
      <td colspan="3">Details...</td>
    </tr>
    <!-- Row 3 (Odd) -->
    <tr>
      <td>User 2</td>
      <td>2024-01-02</td>
      <td class="actions"><button>Edit</button></td>
    </tr>
  </tbody>
</table>`,
    starterCode: '',
    hints: [
      'Odd rows: tr:nth-child(odd)',
      'Last cell: td:last-child',
      'Button inside: button',
      'Answer: tr:nth-child(odd) td:last-child button'
    ],
    tags: ['beginner', 'css', 'structure', 'scenario', 'table'],
    targetSelector: 'tr:nth-child(odd) td:last-child button',
  },

  // Extra
  {
    slug: 'css-dynamic-elements',
    title: 'Handling Dynamic Elements',
    description: 'Select elements when IDs are unstable or random.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'css-basics',
    xpReward: 40,
    order: 17,
    instructions: `# Challenge: Unstable IDs

Modern React/Vue/Angular apps often generate random IDs like \`#input-23423\`. These change every time you reload the page. **You cannot rely on them.**

## Strategy
If the ID is useless, use structure. 
"I want the Delete button that lives inside the Second Item in the list."

## Your Mission
Select the **Delete** button for the **Second List Item**.
Ignore the ID tokens.
`,
    htmlContent: `<ul class="items">
  <li>
    <span>Item A</span>
    <button class="del">Delete</button>
  </li>
  <li>
    <span>Item B</span>
    <!-- Target -->
    <button class="del">Delete</button>
  </li>
  <li>
    <span>Item C</span>
    <button class="del">Delete</button>
  </li>
</ul>`,
    starterCode: '',
    hints: [
      'Target the 2nd list item: li:nth-child(2)',
      'Target the delete button inside: .del',
      'Answer: li:nth-child(2) .del'
    ],
    tags: ['beginner', 'css', 'dynamic'],
    targetSelector: 'li:nth-child(2) .del',
  },
];

// ============================================================================
// XPATH CHALLENGES (10)
// ============================================================================

export const xpathChallenges = [
  // Challenge 1: XPath Basics
  {
    slug: 'xpath-basics-101',
    title: 'XPath Basics',
    description: 'Learn the fundamentals: absolute vs relative paths.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'xpath-basics',
    xpReward: 10,
    order: 18,
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
    tags: ['beginner', 'xpath', 'selector', 'basics', 'basic'],
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
    order: 19,
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
    tags: ['beginner', 'xpath', 'selector', 'attribute', 'basic'],
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
    order: 20,
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
    tags: ['beginner', 'xpath', 'selector', 'text', 'basic'],
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
    order: 21,
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
    tags: ['beginner', 'xpath', 'selector', 'contains', 'starts-with', 'basic'],
    targetSelector: '//div[contains(@class, "error")]',
  },

  // Challenge 4b: Fundamentals Boss (NEW - Unit 1 Boss Fight)
  {
    slug: 'xpath-fundamentals-boss',
    title: 'Scenario: Legacy Login',
    description: 'Combine all fundamental XPath skills to locate elements in a legacy app.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'xpath-basics',
    xpReward: 55,
    order: 22,
    instructions: `# Scenario: Legacy Login Form

You're automating tests for a legacy application. The HTML is messy:
- IDs are dynamically generated (useless!)
- Classes are generic and reused everywhere
- But the **text content** is stable

## The Challenge
Find the **"Sign In"** button. It's buried in the form, and there are multiple buttons on the page.

## What You Know
1. The button contains the text "Sign In"
2. It's inside a form with class containing "login"
3. There's also a "Sign Up" button elsewhere (don't select that!)

## Your Mission
Write an XPath that finds the exact "Sign In" button inside the login form.

> **Tip:** Combine \`contains()\` for the class AND \`text()\` for the button text!
`,
    htmlContent: `<div class="page-wrapper">
  <header>
    <nav class="main-nav">
      <button id="nav-btn-12345" class="btn nav-btn">Menu</button>
      <button id="nav-btn-67890" class="btn nav-btn">Sign Up</button>
    </nav>
  </header>
  
  <main class="content">
    <form id="form-abc123" class="form login-form">
      <h2>Welcome Back</h2>
      <div class="field">
        <input type="email" id="input-xyz789" class="input" placeholder="Email" />
      </div>
      <div class="field">
        <input type="password" id="input-xyz790" class="input" placeholder="Password" />
      </div>
      <div class="actions">
        <button type="button" class="btn secondary">Forgot Password</button>
        <button type="submit" class="btn primary">Sign In</button>
      </div>
    </form>
  </main>
</div>`,
    starterCode: '',
    hints: [
      'First, scope to the login form: //form[contains(@class, "login")]',
      'Then find the button with text: //button[text()="Sign In"]',
      'Combine them: //form[contains(@class, "login")]//button[text()="Sign In"]'
    ],
    tags: ['beginner', 'xpath', 'selector', 'scenario', 'fundamentals'],
    targetSelector: '//form[contains(@class, "login")]//button[text()="Sign In"]',
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
    order: 23,
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
    tags: ['beginner', 'xpath', 'selector', 'parent', 'ancestor', 'basic'],
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
    order: 24,
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
    tags: ['beginner', 'xpath', 'selector', 'following-sibling', 'basic'],
    targetSelector: '//label[text()="Username"]/following-sibling::input',
  },

  // Challenge 6b: Preceding-sibling (NEW - Unit 2 Drill)
  {
    slug: 'xpath-preceding-sibling',
    title: 'Preceding-sibling',
    description: 'Navigate to elements that come before.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'EASY' as const,
    category: 'xpath-basics',
    xpReward: 35,
    order: 25,
    instructions: `# Preceding-sibling Axis

Navigate to siblings that come BEFORE the current element.

## The Reverse Direction
| Axis | Description |
|------|-------------|
| \`following-sibling::\` | Elements AFTER |
| \`preceding-sibling::\` | Elements BEFORE |

## Use Cases
- Find the **label** for a specific **error message**
- Get the **header** above a content section
- Navigate BACKWARDS from a known element

## Examples
\`\`\`xpath
//span[@class="error"]/preceding-sibling::label
//div[@class="content"]/preceding-sibling::h2
\`\`\`

## Your Task
An error message appeared! Find the **label** that comes before the error message.
`,
    htmlContent: `<form class="registration-form">
  <div class="field-group">
    <label>Email Address</label>
    <input type="email" name="email" />
    <span class="hint">We'll never share your email</span>
  </div>
  <div class="field-group">
    <label>Password</label>
    <input type="password" name="password" />
    <span class="error">Password must be at least 8 characters</span>
  </div>
  <div class="field-group">
    <label>Confirm Password</label>
    <input type="password" name="confirm" />
  </div>
</form>`,
    starterCode: '',
    hints: [
      'First find the error message: //span[@class="error"]',
      'Then navigate backwards to the label',
      'The answer is: //span[@class="error"]/preceding-sibling::label'
    ],
    tags: ['beginner', 'xpath', 'selector', 'preceding-sibling', 'basic'],
    targetSelector: '//span[@class="error"]/preceding-sibling::label',
  },

  // Challenge 6c: Traversal Boss (NEW - Unit 2 Boss Fight)
  {
    slug: 'xpath-traversal-boss',
    title: 'Scenario: Error Recovery',
    description: 'Navigate from an error to fix the input that caused it.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'xpath-basics',
    xpReward: 60,
    order: 26,
    instructions: `# Scenario: Error Recovery

You're building an error handler. When a validation error appears, you need to focus the input that caused it.

## The Challenge
The page shows an error message: **"Invalid email format"**

Your task: Find the **input field** that is associated with this error.

## Navigation Strategy
1. Find the error message by its text
2. Navigate UP to the parent container
3. Find the INPUT within that container

## Your Mission
Select the **input** element that belongs to the field showing "Invalid email format".

> **Hint:** Combine \`ancestor::\` and descendant navigation!
`,
    htmlContent: `<form class="checkout-form">
  <div class="form-field">
    <label>Full Name</label>
    <input type="text" name="name" value="John Doe" />
    <span class="validation valid">✓ Looks good</span>
  </div>
  <div class="form-field has-error">
    <label>Email</label>
    <input type="email" name="email" value="invalid-email" />
    <span class="validation error">Invalid email format</span>
  </div>
  <div class="form-field">
    <label>Phone</label>
    <input type="tel" name="phone" value="+1234567890" />
    <span class="validation valid">✓ Valid number</span>
  </div>
</form>`,
    starterCode: '',
    hints: [
      'Find the error span: //span[text()="Invalid email format"]',
      'Go up to parent container: /ancestor::div',
      'Then find the input: //input',
      'The answer is: //span[text()="Invalid email format"]/ancestor::div[@class="form-field has-error"]//input'
    ],
    tags: ['beginner', 'xpath', 'selector', 'ancestor', 'traversal', 'scenario'],
    targetSelector: '//span[text()="Invalid email format"]/ancestor::div//input',
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
    order: 27,
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
    tags: ['beginner', 'xpath', 'selector', 'and', 'or', 'conditions', 'basic'],
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
    order: 28,
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
    tags: ['beginner', 'xpath', 'selector', 'position', 'indexing', 'basic'],
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
    order: 29,
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
    tags: ['beginner', 'xpath', 'selector', 'normalize-space', 'whitespace', 'basic'],
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
    order: 30,
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
    tags: ['beginner', 'xpath', 'selector', 'table', 'complex', 'basic'],
    targetSelector: '//tr[td[text()="ORD-002"]]/td[4]',
  },

  // Challenge 11: Axes Master
  {
    slug: 'xpath-axes-master',
    title: 'Axes Master',
    description: 'Navigate freely with preceding and following axes.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'MEDIUM' as const,
    category: 'xpath-advanced',
    xpReward: 65,
    order: 31,
    instructions: `# XPath Axes: Preceding & Following

Standard navigation usually goes DOWN (child) or SIDEWAYS (siblings).
Axes let you jump comfortably anywhere in the document flow.

## The "Everything Else" Axes
| Axis | Description |
|---|---|
| \`following::\` | EVERYTHING after the closing tag of current node |
| \`preceding::\` | EVERYTHING before the opening tag of current node |

These differ from \`following-sibling::\` because they **ignore nesting**. They just scroll down (or up) the HTML source code.

## Scenario
You found a User Header ("Alice") and need to click the "Edit" button that appears physically after it in a completely different container.

\`\`\`xpath
//h3[text()="Alice"]/following::button[1]
\`\`\`
This grabs the *very next button* in the DOM after Alice's header, regardless of <div> nesting.

## Your Task
Find the **"Edit" button** that appears after "Product A".

> **Warning:** Don't confuse with \`following-sibling\`. The button is NOT a sibling, it's in a different container!
`,
    htmlContent: `<div class="product-list">
  <div class="header-section">
    <h3>Product A</h3>
    <span class="badge">New</span>
  </div>
  <div class="details-section">
    <p>Price: $10</p>
  </div>
  <div class="actions-section">
    <button class="btn">View</button>
    <button class="btn">Edit</button>
  </div>
  
  <hr>

  <div class="header-section">
    <h3>Product B</h3>
  </div>
  <div class="actions-section">
    <button class="btn">View</button>
    <button class="btn">Edit</button>
  </div>
</div>`,
    starterCode: '',
    hints: [
      'The "Edit" button is seemingly unrelated in structure',
      'But it appears AFTER "Product B" in the source order',
      'Use the following:: axis',
      'The answer is: //h3[text()="Product A"]/following::button[text()="Edit"][1]'
    ],
    tags: ['beginner', 'xpath', 'selector', 'axes', 'advanced'],
    targetSelector: '//h3[text()="Product A"]/following::button[text()="Edit"][1]',
  },

  // Challenge 12: Advanced Boss (NEW - Unit 3 Boss Fight)
  {
    slug: 'xpath-advanced-boss',
    title: 'Scenario: Admin User Management',
    description: 'Master advanced XPath to navigate a complex admin table.',
    type: 'XPATH_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'xpath-advanced',
    xpReward: 80,
    order: 32,
    instructions: `# Scenario: Admin User Management

You're automating an admin dashboard. The user table is complex:
- Multiple columns with different data types
- Action buttons in each row
- You need to find a specific button for a specific user

## The Challenge
Find the **"Delete"** button for the user named **"John Doe"** who has the role **"Admin"**.

## Why This Is Hard
- There are multiple "John Doe" users (one is Admin, one is Editor)
- There are multiple "Delete" buttons
- You must use ALL conditions to find the right one

## Your Mission
Write an XPath that:
1. Finds the row containing BOTH "John Doe" AND "Admin"
2. Selects the Delete button in that row

> **Tip:** Use \`and\` to combine multiple cell conditions in a single row predicate!
`,
    htmlContent: `<table class="admin-users-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Smith</td>
      <td>alice@example.com</td>
      <td>Admin</td>
      <td class="status active">Active</td>
      <td class="actions">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </td>
    </tr>
    <tr>
      <td>John Doe</td>
      <td>john.editor@example.com</td>
      <td>Editor</td>
      <td class="status active">Active</td>
      <td class="actions">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </td>
    </tr>
    <tr>
      <td>John Doe</td>
      <td>john.admin@example.com</td>
      <td>Admin</td>
      <td class="status active">Active</td>
      <td class="actions">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </td>
    </tr>
    <tr>
      <td>Bob Wilson</td>
      <td>bob@example.com</td>
      <td>Viewer</td>
      <td class="status inactive">Inactive</td>
      <td class="actions">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </td>
    </tr>
  </tbody>
</table>`,
    starterCode: '',
    hints: [
      'Find a row that has BOTH conditions: td with "John Doe" AND td with "Admin"',
      'Pattern: //tr[td[text()="X"] and td[text()="Y"]]',
      'Then find the delete button: //button[text()="Delete"]',
      'Answer: //tr[td[text()="John Doe"] and td[text()="Admin"]]//button[text()="Delete"]'
    ],
    tags: ['beginner', 'xpath', 'selector', 'advanced', 'table', 'scenario'],
    targetSelector: '//tr[td[text()="John Doe"] and td[text()="Admin"]]//button[text()="Delete"]',
  },
];

// ============================================================================
// CSS vs XPATH COMPARISON CHALLENGES (3)
// ============================================================================

export const comparisonChallenges = [
  // Challenge 1: Same Element, Two Ways
  {
    slug: 'selector-comparison-same-element',
    title: 'Same Element, Two Ways',
    description: 'Write both CSS and XPath for the same element.',
    type: 'CSS_SELECTOR' as const, // Start with CSS
    difficulty: 'EASY' as const,
    category: 'selector-comparison',
    xpReward: 30,
    order: 33,
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
    tags: ['beginner', 'css', 'xpath', 'comparison', 'basic'],
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
    order: 34,
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
    tags: ['beginner', 'xpath', 'comparison', 'text', 'parent', 'basic'],
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
    order: 35,
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
    tags: ['beginner', 'css', 'performance', 'best-practices', 'basic'],
    targetSelector: '#submit-btn',
  },

  // Challenge 4: Comparison Boss (NEW - Unit 4 Boss Fight)
  {
    slug: 'selector-comparison-boss',
    title: 'Scenario: Choose Your Weapon',
    description: 'Analyze a real scenario and pick the optimal selector strategy.',
    type: 'CSS_SELECTOR' as const,
    difficulty: 'HARD' as const,
    category: 'selector-comparison',
    xpReward: 70,
    order: 36,
    instructions: `# Scenario: Choose Your Weapon

You're writing tests for a shopping cart. You need to find a specific element, but you must choose wisely.

## The Challenge
Find the **"Remove"** button for the product named **"Wireless Mouse"**.

## The Trade-offs
| Approach | Selector | Pros | Cons |
|----------|----------|------|------|
| **CSS** | Complex chaining | Fast execution | Can't use text |
| **XPath** | Text-based | Human readable | Slightly slower |

## Decision Criteria
- If the element has a **stable ID or data-testid**: Use CSS
- If you need to find by **text content**: Use XPath
- If you need to navigate **UP** the DOM: Use XPath

## Your Mission
Look at the HTML. The product name "Wireless Mouse" is visible, but we want the button.

**For THIS scenario**, write a **CSS selector** that works.

> **Hint:** Look for data attributes or class patterns that uniquely identify the product row!
`,
    htmlContent: `<div class="shopping-cart">
  <h2>Your Cart (2 items)</h2>
  
  <div class="cart-item" data-product-id="prod-101">
    <img src="/mouse.jpg" alt="Wireless Mouse" />
    <div class="item-details">
      <h3 class="product-name">Wireless Mouse</h3>
      <span class="price">$29.99</span>
      <span class="quantity">Qty: 1</span>
    </div>
    <div class="item-actions">
      <button class="btn update">Update</button>
      <button class="btn remove">Remove</button>
    </div>
  </div>
  
  <div class="cart-item" data-product-id="prod-202">
    <img src="/keyboard.jpg" alt="Mechanical Keyboard" />
    <div class="item-details">
      <h3 class="product-name">Mechanical Keyboard</h3>
      <span class="price">$89.99</span>
      <span class="quantity">Qty: 1</span>
    </div>
    <div class="item-actions">
      <button class="btn update">Update</button>
      <button class="btn remove">Remove</button>
    </div>
  </div>
  
  <div class="cart-summary">
    <span class="total">Total: $119.98</span>
    <button class="btn checkout">Checkout</button>
  </div>
</div>`,
    starterCode: '',
    hints: [
      'Notice each cart-item has a data-product-id attribute',
      'The Wireless Mouse has data-product-id="prod-101"',
      'Use attribute selector: [data-product-id="prod-101"]',
      'Answer: [data-product-id="prod-101"] .remove'
    ],
    tags: ['beginner', 'css', 'xpath', 'comparison', 'scenario', 'decision'],
    targetSelector: '[data-product-id="prod-101"] .remove',
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedBasicChallenges() {
  console.log('🌱 Seeding Basic tier challenges...\n');

  try {
    // ====================================================================
    // STEP 1: Clear existing challenges (only for this seed)
    // ====================================================================
    console.log('🧹 Cleaning up existing challenges...');

    // Combine all challenges in this seed
    const allChallenges = [...cssChallenges, ...xpathChallenges, ...comparisonChallenges];
    const slugs = allChallenges.map(c => c.slug);

    // Find existing challenges with these slugs
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



    // Get Tutorial IDs
    const cssTutorialId = await getTutorialId('css-selectors-for-qa');
    const xpathTutorialId = await getTutorialId('xpath-for-test-automation');

    console.log('🔗 Linking to tutorials:');
    console.log(`   - CSS: ${cssTutorialId ? '✅ Found' : '❌ Not Found'}`);
    console.log(`   - XPath: ${xpathTutorialId ? '✅ Found' : '❌ Not Found'}`);

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
        tags: challenge.tags,
        tutorialId: cssTutorialId,
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
        tags: challenge.tags,
        tutorialId: xpathTutorialId,
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
// Run the seed function if executed directly
export { seedBasicChallenges };

if (import.meta.main) {
  seedBasicChallenges()
    .then(() => {
      console.log('\n🎉 Database seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed database:', error);
      process.exit(1);
    });
}
