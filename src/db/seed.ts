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

> [!NOTE]
> **The Mental Model**: Think of CSS Selectors like a **Mailing Address**.
> *   **Tag**: "Deliver to every House" (Broad)
> *   **Class**: "Deliver to every Blue House" (Specific Group)
> *   **ID**: "Deliver to 123 Maple Street" (Unique Location)

CSS selectors are the GPS coordinates of the web. In automation, we use them to tell our bots exactly which element to interact with.

## 1. The Big Three

### Element Selector (The "City")
Selects generally by type. Good for lists, bad for specific buttons.
\`\`\`css
button { color: blue; } /* Grabs EVERY button */
\`\`\`

### Class Selector (The "Neighborhood")
Selects a group of elements.
\`\`\`css
.btn-primary { background: blue; } /* Grabs all primary buttons */
\`\`\`

> [!TIP]
> **Strategy**: Use classes when you want to test a *type* of component (e.g., "All primary buttons should be blue").

### ID Selector (The "Exact Address")
Selects a single, unique element.
\`\`\`css
#submit-login { width: 100%; }
\`\`\`

> [!IMPORTANT]
> **Best Practice**: IDs are the Gold Standard for automation because they are (supposed to be) unique. If an element has an ID, use it!

## 2. Advanced Targeting

### Attribute Selectors
When you don't have a clean ID or Class, look for attributes.
\`\`\`css
[type="submit"]       /* The submit button */
[data-testid="login"] /* A custom test attribute (The Holy Grail!) */
\`\`\`

### Combinators (The Directions)
Sometimes you need to say "The input *inside* the login form".
\`\`\`css
.login-form input  /* Space = Descendant (any level deep) */
.login-form > div  /* > = Direct Child (immediate level only) */
\`\`\`

> [!CAUTION]
> **The Trap**: Avoid overly strict chains like \`div > div > ul > li > span\`.
> This is "Brittle". If a developer adds one extra \`div\` wrapper, your test breaks.
> **Fix**: Use specific attributes or shorter chains like \`.card .title\`.

## 3. Practice
Ready to try? The challenges below will ask you to find elements using these exact patterns.
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

        const xpathContent = `# XPath Selectors Basics

> [!NOTE]
> **The Mental Model**: Think of XPath like **File System Paths**.
> *   \`/html/body/div\`: Absolute Path (Fragile). Like \`C:/Users/Docs/File.txt\`.
> *   \`//div[@id="main"]\`: Relative Search (Robust). Like "Search whole drive for folder named 'main'".

When CSS selectors hit a wall (like "Parent of this button"), XPath is your heavy lifter.

## 1. The Syntax

### Absolute vs Relative
\`\`\`xpath
/html/body/div/p  /* Absolute: Starts from root (Don't use this!) */
//p              /* Relative: Finds 'p' anywhere */
\`\`\`

> [!CAUTION]
> **The Trap**: Copying XPath from Chrome/Firefox often gives you \`/html/body/...\`.
> **Fix**: Always write your own relative XPaths using attributes.

## 2. The Power Moves

### Text Matching (The Superpower)
CSS can't do this. XPath can.
\`\`\`xpath
//button[text()="Submit"]
//div[contains(text(), "Welcome")]
\`\`\`
> [!TIP]
> **Strategy**: Use this for buttons with dynamic IDs but stable text (e.g., "Save", "Cancel").

### Attributes
Just like CSS, but slightly more verbose.
\`\`\`xpath
//input[@id="username"]
//a[@href="/login"]
\`\`\`

### Traversal (Going Up!)
CSS only goes down. XPath goes both ways.
\`\`\`xpath
//span[text()="Price"]/parent::div  /* Finds the div containing the Price span */
\`\`\`

## 3. Practice
Use the challenges below to master these pathfinding skills.
`;


        let xpathTutorial = (await db.insert(tutorials).values({
            slug: 'xpath-selectors-basics',
            title: 'XPath Selectors Basics',
            description: 'Master the power of XPath for complex DOM navigation.',
            content: xpathContent,
            order: 2,
            estimatedMinutes: 15,
            tags: ['xpath', 'selectors', 'intermediate'],
            isPublished: true,
            viewCount: 0,
        }).onConflictDoUpdate({
            target: tutorials.slug,
            set: {
                content: xpathContent,
                title: 'XPath Selectors Basics',
                description: 'Master the power of XPath for complex DOM navigation.',
                estimatedMinutes: 15,
                tags: ['xpath', 'selectors', 'intermediate'],
                isPublished: true,
                order: 2
            }
        }).returning())[0];

        if (!xpathTutorial) {
            console.log('   Tutorial already exists, fetching...');
            [xpathTutorial] = await db.select().from(tutorials).where(eq(tutorials.slug, 'xpath-selectors-basics'));
        }

        if (xpathTutorial) {
            console.log(`   Tutorial: ${xpathTutorial.title}`);
        }

        let playwrightTutorial = (await db.insert(tutorials).values({
            slug: 'playwright-basics',
            title: 'Playwright Basics',
            description: 'Start automating with the modern, reliable browser automation tool.',
            content: `# Playwright Basics

> [!NOTE]
> **The Mental Model**: Think of Playwright like a **Universal Remote Control**.
> *   **Browser**: The TV.
> *   **Playwright Script**: The buttons you press.
> *   **You**: The one holding the remote (writing the script).

You aren't "in" the browser. You are sending signals to it.

## 1. The Superpower: Auto-Waiting
In older tools (Selenium), you had to say "Wait for button... is it there?... okay click".
Playwright is smart. When you say \`click\`, it automatically:
1.  Checks if element exists.
2.  Checks if it's visible.
3.  Checks if it's stable (not moving).
4.  Checks if it's not covered by something else.
5.  CLICKS!

> [!TIP]
> **Strategy**: Trust the auto-wait. Don't add random \`sleep(5000)\` commands. That's flimsy.

## 2. Basic Actions

### Navigation
Go to a website.
\`\`\`javascript
await page.goto('https://example.com');
\`\`\`

### Interaction
Clicking and Typing.
\`\`\`javascript
await page.click('#submit-btn');
await page.fill('#email', 'demo@test.com');
\`\`\`

> [!CAUTION]
> **The Trap**: Racing the Browser.
> Even with auto-waiting, if your page loads data *after* a click, you might need to wait for that specific data.
> **Fix**: Use \`await expect(locator).toBeVisible()\` to be sure.

## 3. Assertions (The Test)
An automation script without assertions is just a robot clicking things.
\`\`\`javascript
await expect(page.locator('#success')).toContainText('Welcome!');
\`\`\`
`,
            order: 3,
            estimatedMinutes: 20,
            tags: ['playwright', 'javascript', 'automation'],
            isPublished: true,
            viewCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!playwrightTutorial) {
            console.log('   Tutorial already exists, fetching...');
            [playwrightTutorial] = await db.select().from(tutorials).where(eq(tutorials.slug, 'playwright-basics'));
        }

        if (playwrightTutorial) {
            console.log(`   Tutorial: ${playwrightTutorial.title}`);
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
            tutorialId: cssTutorial.id,
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
            tutorialId: xpathTutorial.id,
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
            tutorialId: playwrightTutorial.id,
            isPublished: true,
            completionCount: 0,
        }).onConflictDoNothing().returning())[0];

        if (!jsChallenge) {
            [jsChallenge] = await db.select().from(challenges).where(eq(challenges.slug, 'click-the-button-playwright'));
        }

        // Force update the tutorial link (in case it existed but was orphaned)
        if (jsChallenge && playwrightTutorial) {
            await db.update(challenges)
                .set({ tutorialId: playwrightTutorial.id })
                .where(eq(challenges.id, jsChallenge.id));
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
