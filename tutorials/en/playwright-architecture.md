---
title: 'Treat the Browser Context as a Test Boundary'
description: 'Use Playwright’s browser, context, and page model to separate client sessions without confusing browser isolation with backend-data isolation.'
---

## After this lesson, you can

- explain the responsibility of a browser, browser context, and page;
- predict which state is shared or separated across pages and contexts;
- use the default `page` fixture for ordinary isolated tests;
- choose separate contexts for a genuine multi-user scenario; and
- diagnose whether a suite failure comes from browser state or shared backend state.

## Why this matters for QA

A test passes when you run it alone, but fails after another test. The second test is unexpectedly signed in, a dismissed banner stays dismissed, or a cart already contains an item.

Manual testers naturally reset the browser, switch profiles, or use an incognito window when they need a clean session. Automated tests need the same boundary to be explicit and repeatable.

With the standard end-to-end setup, Playwright Test gives each test a fresh browser context by default. That prevents browser-session state from leaking between tests. But it does not reset the application database, restore inventory, or give every test a different account. Reliability starts by knowing exactly where this boundary ends.

## The mental model

Think of the objects as nested responsibility boundaries:

```text
Worker process
└── Browser (may be reused within this worker)
    ├── BrowserContext for Test A
    │   └── Page: one tab in Test A's session
    └── BrowserContext for Test B
        └── Page: one tab in Test B's session
```

Playwright may reuse the `Browser` fixture within a worker for efficiency. The usual test boundary is the fresh `BrowserContext` and its default `Page`, not the browser process itself.

![A browser contains isolated contexts for separate tests, while pages inside a context belong to the same client session; backend records remain outside that browser boundary.](/images/tutorials/context-isolation-boundary.svg)

_A fresh context isolates browser-side session state. Shared application data needs its own strategy._

The responsibilities are:

| Object           | Think of it as                       | What it decides                                                    |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `Browser`        | The running browser engine, often reused within a worker | Hosts one or more independent sessions                             |
| `BrowserContext` | One test-scoped isolated browser profile/session | Cookies, storage, permissions, and pages belonging to that session; configured `storageState` may preload authentication |
| `Page`           | One tab or popup                     | Navigation and interaction with one browser surface                |

Two pages in the same context belong to the same browser session. Separate contexts do not share that client-session state.

However, both contexts can still call the same backend with the same account. Browser isolation does **not** automatically separate:

- customer, order, or inventory records;
- email inboxes or one-time codes;
- rate limits and queues;
- mutable feature flags; or
- any other server-side resource.

That distinction explains many “but every test already gets a new page” failures.

## Work through a realistic example

Start with the normal case: one user, one behavior.

```ts
test('a guest cart starts empty', async ({ page }) => {
  await page.goto('/cart');
  await expect(
    page.getByRole('heading', { name: 'Your cart is empty' }),
  ).toBeVisible();
});
```

The built-in `page` belongs to a fresh test-scoped context created for this test. “Fresh” means an isolated lifecycle; configured `storageState` can still preload authentication rather than starting signed out. You do not need to launch a browser or create another context yourself.

Now consider a support-chat requirement:

> A signed-in customer sends a message, and a support agent sees and replies to that same conversation.

This scenario genuinely needs two independent authenticated sessions at the same time:

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

The two contexts separate customer cookies and agent cookies. The conversation itself is intentionally shared backend data because that is the behavior under test.

Closing manually created contexts in `finally` releases resources and gives Playwright a chance to finish artifacts even when an assertion fails.

Notice what would be wrong with opening two pages in one context for this scenario: both pages would belong to one session, so signing in as the agent could replace the customer session. A second tab is a second surface, not a second user.

## When to use it—and when not to

Use the default `page` fixture for almost every ordinary test. It already provides the clean browser context that test-level isolation needs.

Create additional contexts inside one test when the product behavior truly involves concurrent identities or independent sessions—for example, buyer and seller, customer and agent, or two participants in a collaboration flow.

Use another page in the same context for a popup or multi-tab flow that should keep the same signed-in session. Do not use another page to represent a different identity.

Do not launch a new browser per test merely to get isolation; contexts provide that boundary more efficiently. Do not reuse one page or context across unrelated tests to save setup time. That trades away a major reliability guarantee.

Browser-engine coverage belongs to the later cross-browser module. Protocol names and browser internals are not required to make good isolation decisions here.

## When it fails

Suppose an account-settings test passes alone but fails during parallel execution because the expected language is already changed.

Start by separating two hypotheses:

1. **Client-session leak:** a later test received cookies or storage from an earlier test.
2. **Backend collision:** fresh contexts signed in with the same account and modified the same server-side preference.

Inspect the failed run:

- Did each test receive its own context and page fixture?
- Which account identity did each request use?
- Does a fresh context still show the changed language?
- Does the failure disappear when each worker receives a different account?

If a brand-new context still receives the modified preference from the server, creating more contexts will not fix it. The state is outside the browser boundary. The next lesson will define ownership for that data.

Do not immediately make the suite serial, add retries, or clear random storage keys. Those actions can hide the collision without identifying which state is shared.

When reviewing context-management code, check:

- Does the scenario genuinely require more than the default `page` fixture?
- Are separate users represented by separate contexts, not merely separate tabs?
- Are manually created contexts closed even when the test fails?
- Is authentication state appropriate for each role?
- Does the explanation incorrectly claim that a new context resets backend data?
- Is shared product data intentional and controlled?
- Does the implementation launch extra browsers or contexts without a product reason?

More contexts do not automatically mean more isolation. The boundary must match the state that can collide.

## Check your understanding

A marketplace test creates two pages from the default context. The first page signs in as a buyer, the second signs in as a seller, and then the first page unexpectedly behaves as the seller. A proposed repair clears cookies on the first page before every assertion.

Explain the real modeling mistake, the smallest architectural repair, and which marketplace data still needs a separate isolation plan after that repair.

## Compare your reasoning

One reasonable answer is:

- Both pages belong to one context, so they do not represent independent authenticated sessions.
- Create a buyer context and a seller context, then create one page inside each.
- Do not clear cookies during the behavior; that destroys the session the test is trying to model.
- The listing, order, and account records still live on the backend. Give the test deliberate ownership of them and prevent other workers from mutating the same records.

Separate contexts repair the client-session model. They do not solve shared database ownership.

## Before you continue

You should now be able to explain the browser–context–page hierarchy, rely on the default test boundary, and introduce extra contexts only for real multi-session behavior.

The next lesson extends isolation beyond the browser. You will define how each test owns its authentication, server data, external dependencies, cleanup, and parallel-collision risk.
