---
title: 'Use Browser Contexts to Isolate Each Test'
description: 'Understand how Playwright browsers, contexts, and pages separate test sessions while backend data remains shared unless you control it.'
---

## After this lesson, you can

- explain the role of a browser, browser context, and page in Playwright;
- distinguish state shared across pages from state separated by browser contexts;
- use Playwright's default `page` fixture without creating another context for every test;
- create separate contexts when a scenario needs multiple users; and
- diagnose whether a failure comes from browser state or shared backend data.

## Why this matters for QA

A test passes when you run it alone but fails after another test. The next test is already signed in, a dismissed banner stays hidden, or the cart already contains an item.

During manual testing, we may reset the browser, switch profiles, or open an incognito window when we need a clean session. Automated tests also need separate browser sessions.

With the standard Playwright Test setup, every test gets a fresh browser context. Cookies, local storage, and login state from the previous test do not carry over.

A fresh context does not reset backend data. Tests can still use the same database records, inventory, orders, or accounts.

You need to know which state the browser context isolates and which state still needs separate test data or setup.

## The mental model

Think of the Playwright objects like this:

```text
Worker process
└── Browser
    ├── BrowserContext for Test A
    │   └── Page: one tab in Test A's session
    └── BrowserContext for Test B
        └── Page: one tab in Test B's session
```

Playwright can use the same `Browser` for several tests inside one worker.

The `BrowserContext` separates the sessions. Each test receives a fresh context and a default `Page` inside that context.

![One browser contains separate contexts for different tests. Pages inside the same context use the same session, while backend data remains outside the browser context.](/images/tutorials/context-isolation-boundary.svg)

_A fresh browser context separates the browser session. Backend data still needs to be controlled separately._

Read the relationship like this:

| Object           | Think of it as             | What it contains                                               |
| ---------------- | -------------------------- | -------------------------------------------------------------- |
| `Browser`        | A running browser          | One or more browser contexts                                   |
| `BrowserContext` | A separate browser session | Cookies, storage, permissions, authentication state, and pages |
| `Page`           | One tab or popup           | Navigation and interactions on that page                       |

Two `Page` objects inside the same `BrowserContext` use the same session. For example, both pages can use the same cookies and login state.

Pages in different contexts have separate browser sessions.

However, both contexts can still use the same backend and test data. A fresh browser context does **not** automatically separate:

- customer, order, or inventory records;
- email inboxes or one-time codes;
- rate limits and queues;
- feature flags that can change; or
- any other server-side resource.

If tests still interfere with each other even though each has its own context, check whether they use the same account, order, inventory, or other backend data.

## Work through a realistic example

Start with a simple case: one user and one behavior.

```ts
test('a guest cart starts empty', async ({ page }) => {
  await page.goto('/cart');
  await expect(
    page.getByRole('heading', { name: 'Your cart is empty' }),
  ).toBeVisible();
});
```

The `page` fixture is already created inside a fresh browser context for this test.

Fresh means that another test's session does not carry over. If the project configures `storageState`, the context can still start in an authenticated state.

For a test like this, you do not need to launch a browser or create another context.

Now consider this support-chat requirement:

> A signed-in customer sends a message, and a support agent sees and replies to that same conversation.

This scenario needs two users signed in at the same time with separate sessions:

```ts
test('agent replies to a customer', async ({ browser }) => {
  const customerContext = await browser.newContext({
    storageState: 'playwright/.auth/customer.json',
  });
  const agentContext = await browser.newContext({
    storageState: 'playwright/.auth/agent.json',
  });

  try {
    const customerPage = await customerContext.newPage();
    const agentPage = await agentContext.newPage();

    await customerPage.goto('/support');
    await agentPage.goto('/agent/inbox');

    await customerPage.getByLabel('Message').fill('Where is my order?');
    await customerPage.getByRole('button', { name: 'Send' }).click();

    await expect(agentPage.getByText('Where is my order?')).toBeVisible();
    await agentPage.getByLabel('Reply').fill('It ships today.');
    await agentPage.getByRole('button', { name: 'Reply' }).click();

    await expect(customerPage.getByText('It ships today.')).toBeVisible();
  } finally {
    await customerContext.close();
    await agentContext.close();
  }
});
```

`customerContext` and `agentContext` separate the cookies and login session for each user.

The conversation remains shared backend data because that is the behavior under test: the customer and agent interact with the same conversation.

Contexts created manually also need to be closed after the test. The `finally` block closes them even when the test fails.

Two `Page` objects inside one context would not work for this multi-user scenario because they still share one session.

If one page signs in as the agent, it can replace the customer session used by the other page.

Use separate browser contexts when a test needs two users signed in at the same time.

## When to use it—and when not to

Use Playwright's default `page` fixture when a test needs one user and one browser session.

Create additional browser contexts when a scenario needs several users with separate sessions at the same time, such as a buyer and seller, customer and agent, or two users in a collaboration flow.

Use another `Page` inside the same context for popups or multi-tab flows that belong to the same user.

Do not use two pages in one context to represent different users because they still share the same session.

You also do not need to launch a new browser for every test to separate sessions. Browser contexts already provide that boundary.

Do not reuse one page or context across unrelated tests only to save setup time. State from an earlier test can affect the next one.

For now, focus on the difference between `Browser`, `BrowserContext`, and `Page`. Differences between browser engines are covered in the cross-browser module.

## When it fails

Suppose an account-settings test passes alone but fails during parallel execution because the language preference has already changed.

Check these two possibilities:

1. **Another test's session carried over:** cookies or storage from an earlier test are still being used.
2. **The tests share backend data:** each context is fresh, but the tests sign in with the same account and change the same server-side preference.

During debugging, check:

- Did each test receive its own context and page fixture?
- Which account does each test use?
- Does a fresh context still show the changed language?
- Does the failure disappear when each worker receives a different account?

If a fresh browser context still receives the changed language preference, the problem is not the browser session. The data has changed on the backend.

Creating another context will not fix that problem. The next lesson explains how to control test data and backend state.

Do not immediately make the suite serial, add retries, or clear random storage keys only to make the test pass. First identify which data or state the tests share.

When reviewing code that creates browser contexts, check:

- Does the scenario genuinely require more than the default `page` fixture?
- Are separate users represented by separate contexts, not merely separate tabs?
- Are manually created contexts closed even when the test fails?
- Is authentication state appropriate for each role?
- Does the code assume that a fresh context also resets backend data?
- If several tests share data, is that required by the scenario and properly controlled?
- Does the code create another browser or context without a clear need?

More browser contexts do not always make a test more isolated. You still need to know which state lives in the browser and which state is shared on the backend.

## Check your understanding

A marketplace test creates two `Page` objects inside the same browser context. The first page signs in as a buyer, then the second signs in as a seller. After that, the first page also behaves as the seller.

Someone proposes clearing cookies on the first page before every assertion.

Explain:

1. What is wrong with the test setup?
2. What is the smallest change that fixes the session model?
3. After separating the buyer and seller sessions, which marketplace data still needs to be controlled so tests do not interfere with each other?

## Compare your reasoning

One possible answer is:

- Both `Page` objects are inside the same browser context, so they use the same session. They cannot represent a separately signed-in buyer and seller.
- Create one browser context for the buyer and another for the seller, then use one `Page` inside each context.
- Do not clear cookies in the middle of the scenario because that changes the session the test is using.
- Listings, orders, accounts, and other backend data can still be shared by several tests. Control that data so another test cannot change the records this scenario uses.

Separate browser contexts fix the buyer and seller sessions. Backend data still needs its own isolation strategy.

## Before you continue

You should now be able to explain the relationship between `Browser`, `BrowserContext`, and `Page`, use Playwright's default fixture without creating unnecessary contexts, and create separate contexts when a scenario needs several users with different sessions.

The next lesson covers isolation outside the browser: authentication, test data, external dependencies, cleanup, and conflicts between tests running in parallel.
