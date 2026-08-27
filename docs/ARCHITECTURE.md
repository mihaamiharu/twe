# Challenge Executor Architecture

This document explains how the challenge execution system works - from user code input to validation.

## Overview

The challenge executor runs user-submitted Playwright-style code in a **sandboxed browser iframe**. It provides a shim layer that mimics Playwright's API using DOM operations.

## Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as ChallengePlayground
    participant Exec as iframe-executor
    participant Iframe as Sandboxed Iframe
    participant Shim as playwright-shim

    User->>UI: Write code & click Run
    UI->>Exec: executePlaywrightCode(code, html)
    Exec->>Exec: Lazy TypeScript-aware source policy analysis
    Exec->>Iframe: Create iframe with HTML content
    Exec->>Iframe: Inject page, expect, test objects
    Exec->>Iframe: Execute user code via eval()
    Iframe->>Shim: Traced learner page/locator calls
    Shim->>Iframe: DOM operations (querySelector, click)
    Shim-->>Exec: Return results / throw errors
    Exec->>Exec: Record assertion matchers and suppressed failures
    Exec->>UI: Pure validation decision (source + runtime evidence)
    Exec-->>UI: ExecutionResult {status, logs, traces, assertionCount}
    UI-->>User: Display pass/fail + logs
```

## Component Responsibilities

### `ChallengePlayground.tsx`

- UI component with code editor and preview
- Calls executor and displays results
- Handles submission to server on success

### `iframe-executor.ts`

- Creates sandboxed iframe with HTML content
- Injects polyfills (fetch mocking, dialog handling)
- Executes user code with timeout protection
- Collects logs and assertion results
- Lazily loads the TypeScript compiler API for AST source-policy findings
- Injects a learner-facing page proxy and returns runtime method/action/assertion evidence
- Keeps ordered interaction-sequence and final DOM-state validation in the executor

### `source-policy-analyzer.ts`, `runtime-trace.ts`, and `challenge-validator.ts`

- The source analyzer walks TypeScript syntax, so comments and strings are not treated as calls. It resolves ordinary member calls plus common bracket, alias, destructuring, and `bind` forms.
- The runtime trace wraps only the page and locators exposed to learner code. Raw shim calls remain private, so internal locator composition is not counted as learner evidence.
- `challenge-validator.ts` is a pure grading decision. The React hook only supplies execution results and localized presentation strings.
- Strict executed-evidence checks are opt-in through the challenge validation policy; existing Practice contracts retain their source-based behavior.

### `playwright-shim.ts` (MockedPlaywrightPage)

- Implements Playwright's Page API using DOM
- Provides: `locator()`, `click()`, `fill()`, `waitForSelector()`
- Auto-wait behavior for element visibility
- Visual highlighting for debugging

### `selector-validator.ts`

- Validates CSS and XPath selectors
- Used for selector-only challenges

## Execution Context

```text
┌─────────────────────────────────────────────┐
│  Main Window (App)                          │
│  ┌───────────────────────────────────────┐  │
│  │  Sandboxed Iframe                     │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  User HTML Content              │  │  │
│  │  │  + Injected Scripts             │  │  │
│  │  │  + MockedPlaywrightPage (page)  │  │  │
│  │  │  + expect() assertions          │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

| Decision               | Rationale                              |
| ---------------------- | -------------------------------------- |
| Client-side execution  | No server load, instant feedback       |
| Iframe sandbox         | Isolates user code from main app       |
| Playwright API shim    | Teaches real-world automation patterns |
| Synthetic events       | Works in browser (not CDP)             |
| Layered capstone validation | AST source policy plus learner runtime evidence |
| State-based validation | Simple, reliable for educational use   |

## Limitations

1. **Untrusted Events**: Synthetic events have `isTrusted: false`
2. **No Network Spying**: Cannot verify actual fetch calls were made
3. **Simplified Visibility**: Basic `display:none` check, not full Playwright logic
4. **Educational boundary**: This is not a security sandbox. A learner who deliberately tampers with the iframe runtime, replaces exposed objects before use, or exploits an unsupported JavaScript construct may still game a challenge. The capstone policy catches ordinary bad patterns and dead-code/alias bypasses, not hostile sandbox-escape attempts.

## File Locations

```text
src/core/executor/
├── index.ts              # Barrel export
├── iframe-executor.ts    # Main execution engine
├── playwright-shim.ts    # Playwright API implementation
├── source-policy-analyzer.ts # Lazy AST source findings
├── runtime-trace.ts       # Learner page/locator runtime evidence
├── challenge-validator.ts # Pure challenge grading decision
└── selector-validator.ts # CSS/XPath validation
```

## Related Documentation

- [TDD.md](./TDD.md) - Technical Design Document
- [app_flows.md](./app_flows.md) - Application user flows
- [solutions.md](./solutions.md) - Challenge solutions reference
