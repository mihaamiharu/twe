/**
 * Database Seed Script
 * 
 * Seeds the database with sample data for development and testing.
 * Run with: bun run db:seed
 */

import { db } from './index';
import { users, tutorials, challenges, testCases, achievements } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // ============================================================================
        // SEED USER (for leaderboard)
        // ============================================================================
        console.log('👤 Creating sample user...');

        let sampleUser = (await db.insert(users).values({
            email: 'demo@testingwithekki.com',
            emailVerified: true,
            name: 'Demo User',
            xp: 250,
            level: 3,
            profileVisibility: 'PUBLIC',
            showOnLeaderboard: true,
        }).onConflictDoNothing().returning())[0];

        if (!sampleUser) {
            console.log('   User already exists, fetching...');
            [sampleUser] = await db.select().from(users).where(eq(users.email, 'demo@testingwithekki.com'));
        }

        if (sampleUser) {
            console.log(`   User: ${sampleUser.name} (${sampleUser.email})`);
        }

        // ============================================================================
        // SEED TUTORIAL
        // ============================================================================
        console.log('📚 Creating sample tutorial...');

        let cssTutorial = (await db.insert(tutorials).values({
            slug: 'css-selectors-basics',
            title: 'CSS Selectors Basics',
            description: 'Learn the fundamentals of CSS selectors for web testing and automation.',
            content: `# CSS Selectors Basics

CSS selectors are patterns used to select and target HTML elements. They're essential for web testing and automation.

## Types of Selectors

### 1. Element Selector
Selects all elements of a given type.
\`\`\`css
p { color: blue; }
\`\`\`

### 2. Class Selector
Selects elements with a specific class (prefixed with \`.\`).
\`\`\`css
.highlight { background: yellow; }
\`\`\`

### 3. ID Selector
Selects an element with a specific ID (prefixed with \`#\`).
\`\`\`css
#header { font-size: 24px; }
\`\`\`

### 4. Attribute Selector
Selects elements based on attributes.
\`\`\`css
[type="submit"] { cursor: pointer; }
\`\`\`

## Combining Selectors

You can combine selectors for more specific targeting:

- \`div.container\` - div with class "container"
- \`#form input\` - input inside element with id "form"
- \`.btn.primary\` - element with both "btn" and "primary" classes

## Practice

Try the CSS Selector challenges to practice what you've learned!
`,
            order: 1,
            estimatedMinutes: 10,
            tags: ['css', 'selectors', 'basics'],
            isPublished: true,
            viewCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!cssTutorial) {
            console.log('   Tutorial already exists, fetching...');
            [cssTutorial] = await db.select().from(tutorials).where(eq(tutorials.slug, 'css-selectors-basics'));
        }

        if (cssTutorial) {
            console.log(`   Tutorial: ${cssTutorial.title}`);
        }

        // ============================================================================
        // SEED CHALLENGES
        // ============================================================================
        console.log('🎯 Creating sample challenges...');

        // 1. CSS Selector Challenge
        let cssChallenge = (await db.insert(challenges).values({
            slug: 'select-the-button',
            title: 'Select the Button',
            description: 'Use a CSS selector to target the submit button.',
            type: 'CSS_SELECTOR',
            difficulty: 'EASY',
            xpReward: 25,
            order: 1,
            instructions: `# Select the Button

Your task is to write a CSS selector that targets the submit button.

## Goal
Write a selector that uniquely identifies the submit button in the HTML below.

## Tips
- Look for unique attributes like \`id\`, \`class\`, or \`type\`
- You can use element selectors combined with attributes
- Keep your selector as simple as possible
`,
            htmlContent: `<div class="form-container">
  <h2>Contact Form</h2>
  <form id="contact-form">
    <input type="text" id="name" placeholder="Your name" />
    <input type="email" id="email" placeholder="Your email" />
    <textarea id="message" placeholder="Your message"></textarea>
    <button type="submit" id="submit-btn" class="btn btn-primary">Submit</button>
  </form>
</div>`,
            starterCode: '',
            tags: ['css', 'selector', 'beginner'],
            isPublished: true,
            completionCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!cssChallenge) {
            [cssChallenge] = await db.select().from(challenges).where(eq(challenges.slug, 'select-the-button'));
        }
        console.log(`   Challenge: ${cssChallenge.title} (CSS_SELECTOR)`);

        // 2. XPath Selector Challenge
        let xpathChallenge = (await db.insert(challenges).values({
            slug: 'xpath-find-link',
            title: 'Find the Link with XPath',
            description: 'Use XPath to locate the navigation link.',
            type: 'XPATH_SELECTOR',
            difficulty: 'MEDIUM',
            xpReward: 50,
            order: 2,
            instructions: `# Find the Link with XPath

Your task is to write an XPath expression that locates the "About" link in the navigation.

## Goal
Write an XPath that uniquely identifies the About link.

## XPath Basics
- \`//a\` - selects all anchor elements
- \`//a[@href]\` - selects anchors with href attribute
- \`//a[text()='About']\` - selects anchor with exact text
- \`//nav//a\` - selects anchors inside nav element

## Tips
- XPath expressions start with \`//\` for relative paths
- Use \`@\` to reference attributes
- Text content can be matched with \`text()\`
`,
            htmlContent: `<header>
  <nav class="main-nav">
    <ul>
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/about" class="nav-link" id="about-link">About</a></li>
      <li><a href="/contact" class="nav-link">Contact</a></li>
    </ul>
  </nav>
</header>`,
            starterCode: '',
            tags: ['xpath', 'selector', 'intermediate'],
            isPublished: true,
            completionCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!xpathChallenge) {
            [xpathChallenge] = await db.select().from(challenges).where(eq(challenges.slug, 'xpath-find-link'));
        }
        console.log(`   Challenge: ${xpathChallenge.title} (XPATH_SELECTOR)`);

        // 3. JavaScript/Playwright Challenge
        let jsChallenge = (await db.insert(challenges).values({
            slug: 'click-the-button-playwright',
            title: 'Click the Button',
            description: 'Write Playwright code to click the submit button.',
            type: 'PLAYWRIGHT',
            difficulty: 'EASY',
            xpReward: 30,
            order: 3,
            instructions: `# Click the Button

Your task is to write Playwright code that clicks the submit button.

## Goal
Use Playwright's \`page.click()\` method to click the submit button.

## Playwright Methods
\`\`\`javascript
// Click by selector
await page.click('#submit-btn');

// Click by role
await page.getByRole('button', { name: 'Submit' }).click();

// Click by text
await page.getByText('Submit').click();
\`\`\`

## Tips
- You have access to a \`page\` object
- Use the browser DevTools to inspect elements
- Your code should wait for the click to complete
`,
            htmlContent: `<div class="app">
  <h1>Welcome!</h1>
  <p>Click the button below to continue.</p>
  <button id="submit-btn" onclick="this.textContent='Clicked!'; this.style.backgroundColor='#22c55e';">
    Submit
  </button>
</div>`,
            starterCode: `// Write your Playwright code here
// Use page.click() to click the submit button

`,
            tags: ['playwright', 'javascript', 'beginner'],
            isPublished: true,
            completionCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!jsChallenge) {
            [jsChallenge] = await db.select().from(challenges).where(eq(challenges.slug, 'click-the-button-playwright'));
        }
        console.log(`   Challenge: ${jsChallenge.title} (PLAYWRIGHT)`);

        // ============================================================================
        // SEED TEST CASES
        // ============================================================================
        console.log('✅ Creating test cases...');

        // Delete existing test cases for these challenges to avoid duplicates (simpler than upsert for non-unique items)
        await db.delete(testCases).where(eq(testCases.challengeId, cssChallenge.id));
        await db.delete(testCases).where(eq(testCases.challengeId, xpathChallenge.id));
        await db.delete(testCases).where(eq(testCases.challengeId, jsChallenge.id));

        await db.insert(testCases).values([
            {
                challengeId: cssChallenge.id,
                description: 'Selector should match the submit button',
                input: { selector: '#submit-btn' },
                expectedOutput: { matchCount: 1 },
                isHidden: false,
                order: 1,
            },
            {
                challengeId: xpathChallenge.id,
                description: 'XPath should match the About link',
                input: { xpath: '//a[@id="about-link"]' },
                expectedOutput: { matchCount: 1 },
                isHidden: false,
                order: 1,
            },
            {
                challengeId: jsChallenge.id,
                description: 'Code should click the button',
                input: { action: 'click' },
                expectedOutput: { buttonText: 'Clicked!' },
                isHidden: false,
                order: 1,
            },
        ]);

        console.log('   Created/Updated 3 test cases');

        // ============================================================================
        // SEED ACHIEVEMENTS
        // ============================================================================
        console.log('🏆 Creating achievements...');

        await db.insert(achievements).values([
            {
                slug: 'first-challenge',
                name: 'First Steps',
                description: 'Complete your first challenge',
                icon: '🎯',
                category: 'challenges',
                requirementType: 'challenge_count',
                requirementValue: 1,
                xpReward: 10,
                isSecret: false,
            },
            {
                slug: 'selector-novice',
                name: 'Selector Novice',
                description: 'Complete 5 selector challenges',
                icon: '🔍',
                category: 'challenges',
                requirementType: 'selector_challenge_count',
                requirementValue: 5,
                xpReward: 25,
                isSecret: false,
            },
            {
                slug: 'quick-learner',
                name: 'Quick Learner',
                description: 'Complete your first tutorial',
                icon: '📖',
                category: 'tutorials',
                requirementType: 'tutorial_count',
                requirementValue: 1,
                xpReward: 10,
                isSecret: false,
            },
        ]).onConflictDoNothing();

        console.log('   Created achievements');

        // ============================================================================
        // DONE
        // ============================================================================
        console.log('\n✨ Seeding complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed database:', error);
        process.exit(1);
    });
