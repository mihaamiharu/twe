# ADR-003: Client-Side Playwright Shim

**Date:** 2025-12-05  
**Status:** Accepted

## Context

The platform allows users to write Playwright automation code to solve challenges. Ensuring secure code execution is the biggest technical risk. Running untrusted code on the server requires complex sandboxing (Docker/micro-VMs) and incurs high infrastructure costs.

## Options Considered

1. **Server-Side Execution (Docker)**: Real Playwright running in containers.
   - *Pros:* 100% faithful execution, screenshots, full browser features.
   - *Cons:* High cost, complex orchestration, security risks, slow feedback loop.
2. **Server-Side vm2**: Node.js sandbox.
   - *Pros:* Faster than Docker.
   - *Cons:* Security vulnerabilities (vm2 is deprecated), no DOM access without JSDOM.
3. **Client-Side Iframe Shim**: Mock Playwright API running in the user's browser.
   - *Pros:* Zero server cost, infinite scalability, instant feedback, DOM access via iframe.
   - *Cons:* Not "real" Playwright (simulated events), limited to single page interactions.

## Decision

We chose **Option 3: Client-Side Iframe Shim**.

## Rationale

For an educational platform teaching *syntax* and *concepts*, full browser automation is overkill for Phase 1. A shim that implements `page.click()`, `page.fill()`, and `expect()` using native DOM APIs inside an isolated iframe is sufficient for learning selectors and logic.

## Consequences

### Positive

- **Security**: Code runs in user's browser; server is never at risk.
- **Cost**: $0 infrastructure cost for execution.
- **Speed**: Instant execution results.

### Negative

- **Fidelity**: Cannot test true browser behaviors (network events, multiple tabs).
- **Maintenance**: We must maintain a "shim" library that mimics Playwright's API surface.
