---
title: 'Element Interactions (The "Act" Step)'
description: 'Translating human actions into automated commands using robust interaction logic.'
---

> Translating human actions into automated commands using robust interaction logic.

## 1. Actionability Logic

![Actionability Checklist](/images/tutorials/interaction-actionability-check.png)

Before an automation tool performs an action, it validates that the element is **ready**. If these checks fail, the "Act" step will timeout. This prevents scripts from clicking on elements that a real user could not see or use.

* **Attached:** The element exists in the HTML.
* **Visible:** The element is not hidden by CSS (`display: none` or `visibility: hidden`).
* **Stable:** The element has stopped moving (crucial for buttons that slide in via animation).
* **Enabled:** The element is not in a disabled state.

---

## 2. Standard Interaction Commands

These are the core actions used in 90% of automated tests.

### A. Clicking (Click)

Used for buttons, links, checkboxes, and radio buttons.

* **The Logic:** Simulates a mouse click at the center of the element.
* **The Loophole:** A successful click does not always mean the UI has changed. Modern apps often perform background network requests after a click.

### B. Inputting Text (Fill vs. Type)

* **Fill:** Injects the value immediately. This is the industry standard for speed.
* **Type:** Simulates individual key presses.
  * **Use Case for Type:** Use this only when testing "live" features, like a search-as-you-type bar that triggers results with every keystroke.

### C. Selection (Select)

Used specifically for `<select>` tags.

* **The Logic:** Directly targets the value or label of an option.
* **Best Practice:** Avoid clicking the dropdown and then clicking the item as two separate steps. Use the native select command to avoid timing issues.

---

## 3. Complex Interactions

Some elements require specific mouse or keyboard states to become active.

### A. Hovering (Hover)

![Hover Interaction Interaction](/images/tutorials/interaction-hover.png)

Used for tooltips or menus that appear only when a mouse is positioned over them.

* **The Logic:** Moves the virtual cursor to the element without clicking.

### B. Focusing (Focus)

Used to make an element the "active" part of the page.

* **Use Case:** Testing error messages that only appear when a user clicks into a field and then clicks away ("blurring").

### C. Keyboard Press (Press)

Used for non-mouse actions like Enter, Escape, or Tab.

* **Example:** Typing a search term and then using `Press("Enter")` instead of finding a search button.

---

## 4. Interaction Failures and Anti-Patterns

When an interaction fails in a professional environment, it usually falls into one of these categories:

| Failure Type | Technical Cause | Recommended Fix |
| :--- | :--- | :--- |
| **Action Intercepted** | Another element (like a "Loading" spinner) is covering the target. | Wait for the overlay to disappear before acting. |
| **Silent Failure** | The tool clicks, but the app's JavaScript "Listener" isn't ready. | Ensure the app is fully loaded or wait for a specific network response. |
| **Element Disabled** | The button is present but unclickable (e.g., form incomplete). | Review the data entry steps preceding this action. |

![Action Intercepted Overlay](/images/tutorials/interaction-intercepted.png)

### The "Forced" Click Trap

Most tools allow a `force: true` parameter. This bypasses actionability checks (like visibility).

> [!CAUTION]
> **The Rule:** If a real user cannot click a button because it is covered by a popup, your automation should not click it either. Forced actions hide UI bugs.

---

## 5. Summary Checklist

* **Intent:** Choose `Fill` for speed and `Type` only for keyboard-triggered logic.
* **Actionability:** Ensure the element is visible and stable before the action.

---

## 6. Further Reading (Deep Dive)

Understand the events that fire when you "Act."

### Official Documentation (MDN)

* **[MouseEvent (Click)](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)**: What actually happens in the browser when `click()` is called.
* **[InputEvent vs Change Event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)**: The technical difference between typing a character (Input) and committing the value (Change).
