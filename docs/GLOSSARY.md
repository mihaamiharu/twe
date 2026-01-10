# Glossary of Terms

## Platform Terms

### Challenge

An interactive coding or testing exercise. Challenges come in different types (JavaScript, Playwright, Selector) and difficulties.

### Playground

The integrated development environment (IDE) component where users solve challenges. It consists of the Instructions panel, Monaco Code Editor, and Live Preview/Console.

### Shim

A lightweight compatibility layer. In this project, the **Playwright Shim** is a client-side library that mimics the official Playwright syntax (`page.click`, `expect`) but executes using standard DOM APIs in the browser, avoiding the need for a backend execution server.

### XP (Experience Points)

Points awarded for completing challenges. The amount depends on the difficulty tier. XP accumulation drives the leveling system.

---

## Testing & QA Terminology

### Assertion

A statement in a test that verifies that a specific condition is true.
_Example:_ `expect(page.url()).toContain('/dashboard')`

### DOM (Document Object Model)

The data representation of the objects that comprise the structure and content of a document on the web.

### E2E Testing (End-to-End)

A testing methodology that validates the entire software from start to finish. Our Playwright challenges mimic this style of testing.

### Locator

A way to find element(s) on a page. Playwright emphasizes user-facing locators (e.g., `getByRole`, `getByText`).

### Selector

A string pattern used to identify elements. Common types are CSS Selectors (`.class`, `#id`) and XPath (`//div[@id='root']`).

### SDET (Software Development Engineer in Test)

A technical testing role that focuses on writing code to test code (automation).

### TDD (Test-Driven Development)

A software development process where you write tests before writing the code that makes the tests pass.
