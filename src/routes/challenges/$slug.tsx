import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { ChallengePlayground, type Challenge } from '@/components/challenges';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/challenges/$slug')({
    component: ChallengeDetailPage,
});

// Mock challenge data - will be replaced with database queries
const challengeData: Record<string, Challenge> = {
    'click-the-button': {
        id: '1',
        slug: 'click-the-button',
        title: 'Click the Button',
        description: 'Learn to click elements using Playwright',
        type: 'PLAYWRIGHT',
        difficulty: 'Easy',
        xp: 50,
        instructions: `# Click the Button

Write Playwright code to click the submit button.

## Your Task

Use the \`page.click()\` method to click the button with the text "Submit".

## Example

\`\`\`javascript
// Click using selector
await page.click('#button-id');

// Or using text
await page.getByRole('button', { name: 'Submit' }).click();
\`\`\`

## Tips

- Look for the button's ID, class, or text content
- You can use CSS selectors or Playwright's built-in locators
`,
        starterCode: `// Write your code here
// Hint: Use page.click() to click the submit button

`,
        htmlContent: `
<div style="text-align: center; padding: 20px;">
  <h2>Submit Form</h2>
  <p>Click the button below to submit the form.</p>
  <button id="submit-btn" onclick="this.textContent = 'Clicked!'; this.style.backgroundColor = '#22c55e';">
    Submit
  </button>
</div>
`,
        targetSelector: '#submit-btn',
        hints: [
            { id: '1', content: 'Look for the button element in the preview', xpCost: 5 },
            { id: '2', content: 'The button has an id attribute', xpCost: 10 },
            { id: '3', content: 'Use page.click("#submit-btn")', xpCost: 15 },
        ],
    },
    'select-the-heading': {
        id: '2',
        slug: 'select-the-heading',
        title: 'Select the Heading',
        description: 'Practice CSS selectors by selecting a heading',
        type: 'CSS_SELECTOR',
        difficulty: 'Easy',
        xp: 30,
        instructions: `# Select the Heading

Use CSS selectors to select the main heading on the page.

## Your Task

Write a CSS selector that selects the heading element with the class "main-title".

## CSS Selector Basics

| Selector | Description |
|----------|-------------|
| \`h1\` | Selects all h1 elements |
| \`.class\` | Selects elements with class |
| \`#id\` | Selects element with id |

## Tips

- Classes are prefixed with a dot (.)
- IDs are prefixed with a hash (#)
`,
        starterCode: '',
        htmlContent: `
<div style="padding: 20px;">
  <h1 class="main-title">Welcome to the Page</h1>
  <p>This is some paragraph text.</p>
  <h2>Subtitle</h2>
  <p>More content here.</p>
</div>
`,
        targetSelector: ['.main-title', 'h1.main-title', 'h1'],
        hints: [
            { id: '1', content: 'Look for the class name on the h1 element', xpCost: 5 },
            { id: '2', content: 'Use .main-title as the selector', xpCost: 10 },
        ],
    },
    'form-fill': {
        id: '3',
        slug: 'form-fill',
        title: 'Fill the Form',
        description: 'Learn to fill form inputs with Playwright',
        type: 'PLAYWRIGHT',
        difficulty: 'Medium',
        xp: 100,
        instructions: `# Fill the Form

Use Playwright to fill out a login form.

## Your Task

1. Fill the email input with "test@example.com"
2. Fill the password input with "secret123"
3. Click the Login button

## Methods

\`\`\`javascript
// Fill an input field
await page.fill('#email', 'value');

// Or using label
await page.getByLabel('Email').fill('value');
\`\`\`
`,
        starterCode: `// Fill the email input
await page.fill('#email', 'test@example.com');

// Fill the password input


// Click the login button

`,
        htmlContent: `
<div style="max-width: 300px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
  <h2 style="margin-bottom: 16px;">Login</h2>
  <form id="login-form">
    <label for="email" style="display: block; margin-bottom: 4px;">Email</label>
    <input type="email" id="email" placeholder="Enter email" style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px;">
    
    <label for="password" style="display: block; margin-bottom: 4px;">Password</label>
    <input type="password" id="password" placeholder="Enter password" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 4px;">
    
    <button type="button" id="login-btn" onclick="document.getElementById('result').textContent = 'Login successful!'" style="width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Login
    </button>
  </form>
  <p id="result" style="margin-top: 12px; color: #22c55e;"></p>
</div>
`,
        hints: [
            { id: '1', content: 'Use page.fill() to fill input fields', xpCost: 10 },
            { id: '2', content: 'The password input has id="password"', xpCost: 15 },
        ],
    },
};

function ChallengeDetailPage() {
    const { slug } = useParams({ from: '/challenges/$slug' });
    const challenge = challengeData[slug];

    const handleSubmit = useCallback((code: string, passed: boolean) => {
        if (passed) {
            console.log('Challenge passed! Code:', code);
            // TODO: Submit to API, award XP, etc.
            alert(`🎉 Congratulations! You earned ${challenge?.xp || 0} XP!`);
        }
    }, [challenge?.xp]);

    if (!challenge) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        The requested challenge could not be found.
                    </p>
                    <Link
                        to="/challenges"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Challenges
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ChallengePlayground challenge={challenge} onSubmit={handleSubmit} />
        </div>
    );
}
