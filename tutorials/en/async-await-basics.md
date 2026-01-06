---
title: "Async/Await Basics for Testing"
description: "Master the art of "waiting" to eliminate flaky tests forever."
---

# Async/Await Basics for Testing

Master the art of "waiting" to eliminate flaky tests forever.

## The Mental Model: The Coffee Shop

Imagine a **Synchronous** world (Vending Machine):

1. You insert money.
2. You press "A1".
3. The chip falls.
4. You take it.

* *Constraint*: You **cannot** do anything else until Step 4 is done. You are blocked.

Now imagine an **Asynchronous** world (Coffee Shop):

1. You order a Latte ("Request").
2. Barista gives you a **Ticket Number** ("Promise").
3. You step aside and check Instagram ("Non-blocking").
4. Barista calls your number ("Resolution").
5. You grab the coffee ("Await").

**In Javascript:**

* `Promise` = The Ticket.
* `async/await` = Standing at the counter refusing to move until your coffee is ready.

---

## The Strategy: The "Await Everything" Rule

In modern test automation (Playwright/Puppeteer), 99% of commands interact with a browser process that lives *outside* your script.

**Rule**: If your line of code touches the browser, **await it**.

* Detailed Check:
  * Does it click? `await page.click()`
  * Does it type? `await page.typed()`
  * Does it navigate? `await page.goto()`
  * Does it verify? `await expect(page).toHaveURL()`

**Exception**:
Code that runs purely inside your *Node.js* process (like calculating `1 + 1` or transforming a string) does not need await.

---

## The Real World Case: The Ghost User

**The Scenario**:
You wrote a robust test that creates a new user via API, then logs in with that user on the frontend to test the Dashboard.

**The Code (Buggy)**:

```javascript
test('User can see dashboard', async ({ page }) => {
  // 1. Create User (API)
  api.post('/users', { name: 'Ghost', id: '123' }); // ⚠️ OOPS

  // 2. Login (UI)
  await page.goto('/login');
  await page.fill('#username', 'Ghost');
  await page.click('#login-btn');
});
```

**The Failure**:
"Invalid Credentials". Why?
Because you didn't `await` step 1. You fired the API request (ordered the coffee) and immediately tried to drink it (Login) before the server processed the creation.

**The Fix**:

```javascript
await api.post('/users', { ... });
```

---

## The Traps

### Trap #1: The Fire-and-Forget

**The Code**: `page.click('#submit')` (without await)
**The Consequence**: The script sends the "click" signal and immediately moves to the assertion. The assertion might run *millseconds* before the click actually happens in the browser.
**Result**: Extremely flaky tests that pass 50% of the time.

### Trap #2: The Slow-Motion Race

**The Code**:

```javascript
// Creating 3 users
await createUser('A'); // 1 sec
await createUser('B'); // 1 sec
await createUser('C'); // 1 sec
// Total: 3 seconds
```

**The Problem**: You are standing in line for 3 separate coffees, one by one.
**The Fix**: Order them all at once (Parallelism).

```javascript
await Promise.all([
  createUser('A'),
  createUser('B'),
  createUser('C')
]);
// Total: 1 second
```

---

## Quick Reference

| Action | Code | Meaning |
| :--- | :--- | :--- |
| **Start Async Function** | `async function foo() { ... }` | "I will use await inside." |
| **Pause Execution** | `await promise` | "Stop here until done." |
| **Parallelize** | `await Promise.all([p1, p2])` | "Wait for ALL of these." |
| **Race** | `await Promise.race([p1, p2])` | "Wait for FIRST of these." |

---

