---
title: 'Assertions (The "Verify" Step)'
description: 'Defining success and failure by validating the state of the application.'
---

> Defining success and failure by validating the state of the application.

## 1. The Logic of an Assertion

In manual testing, you perform an action and then use your eyes to confirm the result. In automation, you must explicitly tell the tool what "Success" looks like.

An assertion typically follows this structure:

`[Actual State] + [Comparison] + [Expected State]`

* **Example:** The `[Current URL]` (Actual) + `[Should Equal]` (Comparison) + `["/dashboard"]` (Expected).

---

## 2. Types of Assertions

In professional automation, we categorize assertions based on what they are checking.

### A. State Assertions

These check if an element is in the correct mode after an action.

* `IsVisible`: Did the success message appear?
* `IsEnabled`: Is the "Submit" button now clickable?
* `IsChecked`: Did the checkbox stay selected after the click?

### B. Content Assertions

These check the data inside the elements.

* `ToHaveText`: Does the header say "Welcome, User"?
* `ToContain`: Does the error message contain the word "Invalid"?
* `ToHaveValue`: Is the input field currently holding the correct email address?

### C. Navigation Assertions

These check the "Where" of the application.

* `ToHaveURL`: Did the page redirect to the login screen?
* `ToHaveTitle`: Does the browser tab show the correct page name?

---

## 3. Web-First (Auto-Retrying) Assertions

This is a core concept in modern tools like Playwright.

In the past, tests were "flaky" because the script would check the assertion before the page had finished loading. Modern assertions are **Asynchronous**. They don't just check once and fail; they wait and re-check the condition for a few seconds (usually 5 seconds) before giving up.

![Web-First Assertion Diagram](/images/tutorials/assertion-web-first.png)

* **The Loophole:** If you use a "Generic" assertion (like a basic math check in JavaScript) instead of a "Web-First" assertion, the tool won't wait. It will fail instantly if the element hasn't appeared yet.
* **Rule:** Always use assertions that are tied to the element's lifecycle.

---

## 4. Positive vs. Negative Assertions

A good test suite checks both what *should* happen and what *should not* happen.

* **Positive:** "The Login button should be visible."
* **Negative:** "The Error Message should NOT be visible."

> [!WARNING]
> **QA Warning:** Be careful with Negative Assertions. If a test passes because an element is "Not Visible," make sure it's because the element is actually gone, not because your selector is wrong.

---

## 5. Assertion Anti-Patterns

### The "Empty" Test

A script that logs in, clicks five buttons, and then ends without checking a single thing.

* **The Result:** The test will always pass as long as the site doesn't crash, even if the data displayed is completely wrong.

### Soft Assertions (Misuse)

A "Soft Assertion" allows the test to keep running even if it fails.

* **The Risk:** If you use soft assertions for critical steps (like checking if a user logged in), the rest of the test is a waste of time. Only use soft assertions for non-critical visual checks.

---

## Summary Checklist

1. **Define the Goal:** What specific change proves this action worked? (URL change? Text appear? Button enabled?)
2. **Use Web-First Logic:** Ensure your tool is waiting for the state to settle before failing.
3. **Verify the Negative:** Check that error messages disappear when they are supposed to.
4. **One Goal Per Test:** Avoid "Assertion Soup." Each test should prove one specific functional outcome.

---

## 6. Further Reading (Deep Dive)

Validating "Truth" is a science.

### Official Documentation

* **[Playwright Assertions](https://playwright.dev/docs/test-assertions)**: The guide to "Web-First" checking that never sleeps.
* **[Jest Expect API](https://jestjs.io/docs/expect)**: Playwright uses an Expect API compatible with Jest. This acts as the "Dictionary" of every check possible (e.g., `.toBeGreaterThan()`).

### Technical Logic (MDN)

* **[console.assert()](https://developer.mozilla.org/en-US/docs/Web/API/console/assert)**: How manual assertions work in vanilla JavaScript.
