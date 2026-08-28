---
title: 'Run, Read, and Diagnose Your First Playwright Test'
description: 'Run one focused scenario, explain each responsibility in the test, and use its result as QA evidence.'
---

## After this lesson, you can

- locate the important files and commands in a Playwright project;
- explain the jobs of `test`, `page`, a locator, an action, and `expect`;
- run one file or one named test while learning and debugging;
- distinguish a passing action from an asserted product outcome; and
- use a failure message to choose the next investigation step.

## Why this matters for QA

Your first Playwright file may be twenty lines long and completely green. That does not yet mean you can trust it.

Can you explain which product risk it checks? Do you know what starting environment it uses? If it fails, can you tell whether the application, test data, locator, or configuration is wrong?

The goal of a first test is not to produce a large automation suite. It is to complete one feedback loop you understand:

```text
QA intent → test code → browser behavior → observable evidence → useful result
```

One small test you can explain and diagnose is a stronger foundation than ten scenarios you cannot review.

## The mental model

A Playwright test is an executable QA contract. Several responsibilities work together:

| Part                   | Responsibility                                         |
| ---------------------- | ------------------------------------------------------ |
| `test`                 | Names and contains one independently runnable scenario |
| Fixture such as `page` | Provides the isolated test environment                 |
| Locator                | Describes how the test finds a user-facing target      |
| Action                 | Asks the browser to perform behavior                   |
| `expect`               | States the evidence that must eventually be true       |
| Runner                 | Executes, reports, and preserves failure information   |

When reviewing a test, label each line before asking whether it is correct:

| Layer            | Question it answers                         | Example                                      |
| ---------------- | -------------------------------------------- | -------------------------------------------- |
| Test intent      | What product risk is this scenario checking? | Customer can open the cart                   |
| Playwright API   | How does the test drive or observe the UI?   | `page.goto`, `getByRole`, `click`, `expect`  |
| JavaScript       | How are values and control flow expressed?  | `async`, `await`, and template literals      |
| Test data        | Which concrete inputs and expectations apply? | `'/app/products.html'`, `'Cart'`, and `'Your cart'` |

These layers can appear on the same line, but they are not the same responsibility. A locator does not define the product risk, and a TypeScript annotation does not turn test data into runtime truth.

![A focused Playwright feedback loop connects QA intent, one test, browser behavior, observable evidence, and a diagnostic result.](/images/tutorials/first-test-feedback-loop.svg)

_Green is useful only when the test's observable evidence matches the original QA intent._

You will see `async` and `await` in the first test. For now, read `await` as “this test depends on this asynchronous operation finishing.” Lesson 3 explains the exact guarantee and its limits.

## Work through a realistic example

Suppose the product risk is:

> A customer activates the Cart link but does not reach the cart page.

Starting state: the Practice application is open on `/app/products.html`.

Action: activate the **Cart** link.

Expected result to verify:

- the **Your cart** heading is visible.

The Core Practice supplies both pages for this exact flow. In a team repository, the same test requires the real application and its starting route to exist before Playwright runs.

### 1. Open the right project

In a team repository, use its documented install and test commands. Do not run a scaffolding command inside an existing project without checking what is already configured.

For a new learning sandbox, Playwright can initialize a project:

```bash
npm init playwright@latest
```

A typical result includes:

```text
playwright.config.ts    runner, browser, and environment configuration
tests/                  test files
package.json            project commands and dependencies
test-results/           artifacts from a run, when produced
```

The exact structure can differ. Read the repository rather than assuming every team uses the default.

### 2. Confirm the environment contract

A `baseURL` lets tests navigate with product-relative paths:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
});
```

Environment-specific URLs belong in configuration, not repeated across every scenario. Secrets such as passwords and tokens do not belong in committed source code.

A `baseURL` only tells Playwright where to send a relative navigation. It does not create the application or a missing route.

### 3. Read the complete test by responsibility

```ts
import { test, expect } from '@playwright/test';

test('customer can open the cart', async ({ page }) => {
  await page.goto('/app/products.html');

  await page.getByRole('link', { name: 'Cart' }).click();

  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
});
```

Connect each line to the QA intent:

- the title reports the behavior being checked;
- `{ page }` asks the runner for an isolated browser page fixture;
- `goto` establishes the page where the action begins;
- `getByRole` describes the Cart link as users perceive it;
- `click` performs the action; and
- the assertion proves the resulting page through content the customer can see.

The click is not the evidence. It only requests the action. Without the assertion, the test could finish without proving that the cart page appeared.

### 4. Run the smallest useful scope

In Core Practice, use **Run Code**. TWE supplies the application pages and executes the starter test against them.

In a local team repository, use its documented command. Common focused Playwright commands look like this:

```bash
npx playwright test tests/cart.spec.ts
npx playwright test -g "customer can open the cart"
npx playwright test --headed
npx playwright test --ui
```

These commands assume that the repository already contains the named test and a runnable application. Start with one file or one title so the result remains easy to connect to your change. Use headed mode when seeing the browser helps. Use UI Mode when you need step-by-step evidence and DOM snapshots.

After the run, do not stop at whether the test passed or failed. Read the test title, failing line, expected result, actual result, and available artifacts such as a screenshot, trace, or log. Use that evidence to decide what to inspect next.

## When to use it—and when not to

Run a narrow test while learning, changing one scenario, or diagnosing a local failure. Run a broader relevant group after the focused test passes. The full suite belongs later in the confidence-building workflow, not after every keystroke.

Use the repository's package-manager script when the team wraps Playwright with environment setup. `npx playwright test` is useful, but it may skip steps encoded in `npm test`, `bun run test:e2e`, or another project command.

Do not create a new Playwright scaffold just because no test is immediately visible. First inspect `package.json`, configuration files, test directories, and repository documentation.

Do not add more scenarios until you can explain the first one's state, action, evidence, and failure output.

## When it fails

Suppose the test times out on this line:

```ts
await page.getByRole('link', { name: 'Cart' }).click();
```

The tempting workaround is a sleep or a CSS path copied from DevTools. Start with evidence instead:

1. Did navigation to `/app/products.html` succeed?
2. What URL and page content exist at the failure point?
3. Is the control a link, and what accessible name does the browser expose?
4. Is there one matching control, none, or several?
5. Did the application show an error, login page, or loading state instead?

If the product renamed the link to “Shopping cart,” update the test only after confirming that behavior is intended. If the page unexpectedly redirects to login, changing the locator would hide the real starting-state problem.

A longer timeout does not repair a wrong environment, missing test data, or incorrect identity.

Before running an unfamiliar test, review it line by line:

- Does the title describe one product behavior?
- Is the starting URL and state valid in this repository?
- Does it assume visible text, a test ID, credentials, or a route without evidence?
- Does each action support the stated risk?
- Is there an assertion for the observable outcome?
- Are fixed sleeps or broad catch blocks hiding uncertainty?
- Can you run just this scenario and explain its failure?

Treat unfamiliar code as a draft connected to assumptions, not as discovered product truth.

## Check your understanding

Review this test:

```ts
test('customer opens account settings', async ({ page }) => {
  await page.goto('/account');
  await page.getByRole('link', { name: 'Settings' }).click();
});
```

Answer:

1. What starting state and action does it express?
2. What important responsibility is missing?
3. What observable evidence could prove the intended outcome?
4. Which command would you use to run only this named test?
5. If the link is not found, what would you inspect before changing the locator?

## Compare your reasoning

One reasonable answer is:

- The test starts on `/account` and activates the Settings link.
- It has no assertion, so it does not prove that account settings opened.
- Useful evidence could be a visible “Account settings” heading or another page-specific element customers rely on. The exact evidence should follow the product requirement.
- Run `npx playwright test -g "customer opens account settings"`, or use the repository's equivalent wrapper command.
- Inspect the loaded URL, current page state, role, accessible name, match count, and any unexpected redirect or error before changing the locator.

## Before you continue

You should now be able to open the project, explain each responsibility in one Playwright test, run it narrowly, and use its result to decide what to inspect next.

Complete the Core Practice by opening the supplied Cart page with a user-facing locator and proving its heading is visible with a web-first assertion. Then the next lesson will give you just enough JavaScript to change test data and small pieces of test logic without turning the learning path into a general programming course.
