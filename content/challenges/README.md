# Challenge Creation Guidelines

This document outlines the standard procedure for adding and maintaining challenges in the TWE platform. Our challenges are data-driven, defined in JSON files, and executed within a secure playground environment.

## 📂 Content Structure

Challenges are grouped by tier in the `content/challenges/` directory:

- `beginner.json`: JavaScript & DOM fundamentals.
- `intermediate.json`: Playwright basics (locators, actions, assertions).
- `e2e.json`: Advanced Playwright patterns (POM, multi-page flows).

### File Structure (JSON)

Each file contains a root object with a `challenges` array.

```json
{
  "tier": "beginner", // 'beginner' | 'intermediate' | 'e2e'
  "challenges": [
    // ... Challenge Objects
  ]
}
```

## 🧩 Challenge Object Schema

Every challenge must adhere to the `Challenge` interface defined in `src/components/challenges/playground/types.ts`.

### Common Fields (Required)

| Field | Type | Description |
|-------|------|-------------|
| `slug` | `string` | Unique identifier (kebab-case). Used in URLs. |
| `type` | `string` | `JAVASCRIPT`, `PLAYWRIGHT`, `TYPESCRIPT` |
| `difficulty` | `string` | `EASY`, `MEDIUM`, `HARD` |
| `category` | `string` | Grouping for UI filters (e.g., `js-fundamentals`, `playwright-locators`). |
| `xpReward` | `number` | XP awarded upon completion. |
| `order` | `number` | Sequencing order. |
| `title` | `object` | Localized titles: `{ "en": "...", "id": "..." }` |
| `description` | `object` | Short description: `{ "en": "...", "id": "..." }` |
| `instructions` | `object` | Markdown instructions: `{ "en": "...", "id": "..." }` |
| `starterCode` | `string` | Initial code displayed in the editor. |
| `solution` | `string` | Reference solution code (hidden until solved/unlocked). |
| `tags` | `string[]` | Keywords for search and filtering. |

---

## 🚀 Challenge Types & Validation

Validation logic varies by `type`. The `Playground` component (`useChallengeExecution.ts`) handles this.

### 1. JavaScript / TypeScript Challenges (`type: "JAVASCRIPT"`)

Focussed on logic, syntax, and DOM manipulation.

**Validation Mechanism:**
The user's code is executed. usage of `return` usually yields the result. We compare the **returned value** against the expected output.

**Required Params:**

- `testCases`: An array of test scenarios. Currently, we mostly use a single strict-equality check.

```json
"testCases": [
    {
        "description": "Returns the expected output",
        "expectedOutput": "4", // The value expected from the user's script
        "isHidden": false
    }
]
```

**Optional Params:**

- `htmlContent`: A string of HTML to render in the mini-browser to test DOM interactions.

**Example Logic:**
User Code:

```javascript
const x = 2;
const result = x * 2;
// The playground appends: if (typeof result !== "undefined") return result;
```

Playground compares `result` (4) with `expectedOutput` ("4").

### 2. Playwright / E2E Challenges (`type: "PLAYWRIGHT"`)

Focussed on browser automation, locators, and assertions.

**Validation Mechanism:**
The user's code (Playwright script) is executed against a virtualized app (VFS).
Success is determined if:

1. The Playwright test runner returns `PASSED`.
2. (Optional) Assertions were actually made (to prevent empty passing tests).
3. (Optional) The DOM state matches `expectedState` after execution.

**Required Params:**

- `files` (For E2E): A virtual file system defining the app under test.
  - Keys are absolute paths (e.g., `/pages/LoginPage.ts`, `/app/index.html`).
  - Values are file contents strings.
- `htmlContent` (For simple Playwright): If `files` is not used, this provides a single-page HTML context.

**Validation Params:**

- `expectedState` (Optional): Validates the *side effects* of the user's code on the DOM.
  - Useful for checking if a button click *actually* changed something, independent of the user's own assertions.

```json
"expectedState": [
    {
        "selector": "#welcome-message", // CSS Selector to check
        "visible": true,                // Should be visible?
        "containsText": "Welcome!"      // Should contain this text?
    }
]
```

**Note on Assertions:**
For categories like `playwright-assertions`, the playground enforces that `result.assertionCount > 0`. If the user writes no `expect(...)` calls, it fails even if the script runs without error.

---

## 🛠️ Step-by-Step: Adding a New Challenge

1. **Choose the JSON File**: Determine if it's `beginner`, `intermediate`, or `e2e`.
2. **Define Metadata**: Set a unique `slug` and appropriate `xpReward`.
3. **Write Content**:
    - **Instructions**: Use Markdown. Explain the concept, provide examples, and state the user's task clearly.
    - **Localization**: Provide both English (`en`) and Indonesian (`id`) text.
4. **Prepare the Environment**:
    - For **JS**: Create the `htmlContent` (if DOM is needed) and decide on the `testCases`.
    - For **Playwright**: Create the HTML/JS for the app they will test (`htmlContent` or `files`).
5. **Set Validation**:
    - **JS**: Calculate the answer and put it in `testCases[0].expectedOutput`.
    - **PW**: Write a `solution` script that passes. If the challenge involves a UI change (like clicking a button), add an `expectedState` rule to verify that change happened.

## ⚠️ Common Pitfalls

- **Missing `result` Variable (JS)**: In JS challenges, the validation logic often looks for a variable named `result` or the last returned value. Ensure instructions tell the user to "Store the answer in `result`".
- **Empty Tests (PW)**: Users might run an empty test which passes by default. The `isAssertionChallenge` check in `useChallengeExecution.ts` prevents this for assertion-focused challenges.
- **VFS Paths**: In `e2e.json`, ensure file paths are absolute (e.g., `/app/index.html`), or the internal router might fail.

## 💡 Best Practices

- **XP Rewards**:
  - Easy: 15-30 XP
  - Medium: 35-60 XP
  - Hard: 65-100 XP
- **Tags**: Add generic tags (`javascript`, `playwright`) and specific ones (`cookies`, `local-storage`) to help with search.
- **Starter Code**: Don't give an empty editor. Provide comments, variable setups, or imports (`import { test, expect } ...`) to reduce boilerplate friction.
