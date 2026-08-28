---
title: 'Investigate the UI Before You Automate It'
description: 'Use DevTools and Playwright investigation tools to turn visible behavior into an evidence-backed automation contract.'
---

## After this lesson, you can

- inspect a control's live DOM, accessibility information, and changing state;
- trace a user action across visible UI, console messages, requests, and browser events;
- separate evidence used for diagnosis from evidence that proves the user outcome;
- capture a short investigation note before writing a test; and
- challenge proposed locators, waits, and assumptions with browser evidence.

## Why this matters for QA

Pasting a selector into a test feels fast—until it finds two controls, stops matching after a redesign, or clicks successfully while the application request fails.

When that happens, adding another selector or a longer delay is still guessing. The browser already contains better evidence:

- the live element and its computed accessibility information;
- the state before and after an action;
- requests and responses behind the transition;
- console errors; and
- events such as navigation, a popup, or a download.

DevTools is not only for developers. For QA, it is where a vague observation becomes a testable explanation.

## The mental model

Use an evidence loop:

```text
Observe manually
    ↓
Inspect the control and its context
    ↓
Perform one action
    ↓
Compare UI state and supporting technical evidence
    ↓
Write the smallest useful automation contract
```

Different tools answer different questions:

| Evidence source                 | Useful question                                                      |
| ------------------------------- | -------------------------------------------------------------------- |
| Elements                        | What live node, attributes, and relationships exist now?             |
| Accessibility information       | What role, accessible name, and state are exposed?                   |
| Console                         | Did the page report a JavaScript error or useful diagnostic message? |
| Network                         | Which request ran, with what payload, status, and response?          |
| Playwright UI Mode or Inspector | What did the test locate, wait for, and observe at each step?        |

Network and console evidence can explain why a UI transition failed. They do not automatically replace the visible outcome a user needs. If the risk is “the user cannot tell that the profile was saved,” a `200` response alone does not prove success.

## Work through a realistic example

The profile page has a “Save changes” button. After a successful save, the user should see “Changes saved.” An early test looks like this:

```ts
await page.locator('#root > div:nth-child(2) > form > button').click();
await page.waitForTimeout(3000);
```

It clicks and waits, but proves nothing. Investigate the flow manually before repairing it.

### 1. Inspect the control

In **Elements** and its accessibility information, confirm:

- the control is a button;
- its accessible name is “Save changes”;
- it is enabled after a valid edit is ready to save;
- the surrounding form is the profile form, not another form on the page.

Do not copy the full DOM path. Record the meaning you discovered.

### 2. Observe the transition

Change one profile field and click the button once. Compare before and after:

```text
Before: valid unsaved change, enabled “Save changes” button, no success status
Action: activate “Save changes”
During: button may become disabled while the request is pending
After: visible status says “Changes saved”
```

### 3. Use supporting evidence

In **Network**, find the profile update request. Inspect its method, payload, status, and response. If it returns an error, check whether the page explains that failure to the user. Check **Console** for an exception if the UI never updates.

This evidence helps classify the failure:

- no request: the action or client-side validation may have blocked submission;
- failed response: investigate the request, data, or server behavior;
- successful response but no confirmation: investigate the UI transition;
- visible confirmation with a failing test: investigate the locator or assertion.

### 4. Define the automation contract

The test intent can now be expressed clearly:

```ts
const saveButton = page.getByRole('button', { name: 'Save changes' });

await saveButton.click();
await expect(page.getByRole('status')).toHaveText('Changes saved');
```

The button locator follows the control's user-facing identity. The assertion proves the outcome the user receives. The network request remains valuable diagnostic evidence, but it is not the only proof.

## When to use it—and when not to

Use browser DevTools before automating an unfamiliar flow, when a control's identity is unclear, when state changes dynamically, or when a failure could originate in the UI, request, response, or browser event.

Use the **Console** for small investigations such as:

```js
document.querySelectorAll('button').length;
document.activeElement;
document.querySelector('[aria-expanded="true"]');
```

These queries help you inspect the page. They are not automatically the locators a Playwright test should keep.

Use Playwright's tools when a test already exists:

- `npx playwright test --ui` to move through test steps and compare DOM snapshots;
- `npx playwright test --debug` to open the Inspector and step through actions;
- `page.pause()` as a temporary local breakpoint at a specific point; and
- the locator picker or code generator to propose a locator for review.

Generated locators are useful hypotheses. Keep one only when you can explain why it represents stable product meaning. Remove temporary `page.pause()` calls before committing the test.

Do not inspect every panel for every simple test. Start from the risk and open the evidence source that can answer the next question.

## When it fails

Suppose a save test times out. During manual investigation you observe:

- the button click starts a request;
- the response is `422` with a validation message;
- no error is shown in the UI; and
- the button becomes enabled again.

Waiting five more seconds will not turn that response into success. Changing the locator will not help because the intended control was already activated.

The useful next steps are:

1. Inspect the request payload and response body.
2. Confirm whether the test data violates a known rule.
3. Check whether the product should display the returned validation message.
4. Fix the data if the test setup is wrong, or report the missing user feedback if the product is wrong.
5. Preserve enough evidence to distinguish those two causes on the next run.

The tempting workaround—`waitForTimeout`, extra retries, or ignoring the response—only makes diagnosis slower.

Before accepting a test proposed from a screenshot or short requirement, ask:

- Which live element and accessible identity did it assume?
- Did it choose a selector from styling or from product meaning?
- Does its wait correspond to an observable state, request, or event?
- Does the assertion prove the user outcome or only that the click happened?
- Does it assume a URL, response, status message, or timing rule without evidence?
- What DevTools evidence would confirm or reject each assumption?

If the answer is “the code probably works,” the investigation is not finished.

## Check your understanding

You manually submit a valid profile change and observe this sequence:

```text
Click “Save changes”
→ PATCH /api/profile returns 422
→ no visible error appears
→ the button becomes enabled again
```

A proposed test change adds a five-second sleep and checks that the URL did not change.

Explain:

1. Which observations are facts and which product expectation still needs confirmation?
2. What evidence would you inspect next?
3. Why do the sleep and URL check fail to prove the intended outcome?
4. What defect or setup problem might you report after confirming the requirement?

## Compare your reasoning

One reasonable answer is:

- The request, `422` response, missing visible error, and re-enabled button are observed facts. Whether the data should be accepted and which error the UI should show must be confirmed against the product rule.
- Inspect the payload, response body, submitted test data, console, and the live status/error region.
- A sleep only delays the same failure. An unchanged URL says nothing about whether the profile was saved or whether the user received useful feedback.
- If the data is invalid, repair the setup and assert the intended outcome. If the data is valid or the response error should be surfaced, report the corresponding API or UI defect with the captured evidence.

The key is to classify the failure before changing test code.

## Before you continue

You should now be able to investigate one user action, record the control's identity and context, compare before-and-after state, and use network or console evidence to explain a failure.

That completes Module 2. You are ready to run your first Playwright test in Module 3 because you can now explain what the test should locate, what state should change, and which evidence would make its result meaningful.
