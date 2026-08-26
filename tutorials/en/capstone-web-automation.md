---
title: 'Capstone: Build, Review, Debug, and Ship'
description: 'Integrate the path into a small end-to-end suite whose decisions you can explain and maintain.'
---

## The assignment

Build a small suite for one valuable product flow. It must remain understandable without memorizing one exact solution.

Your suite must include:

1. one happy-path scenario;
2. one meaningful negative or boundary scenario;
3. controlled, independent starting state;
4. user-facing locators or documented test contracts;
5. web-first assertions on business-relevant outcomes;
6. no fixed sleeps and no unexplained forced actions;
7. a small maintainable organization appropriate to its size;
8. CI-ready configuration and failure artifacts.

## Review a flawed generated test

The capstone includes code with typical AI-generated defects: a structural selector, fixed wait, shared state assumption, weak assertion, and swallowed error. Do not merely make it green. For each change, identify:

```text
Observed problem:
Risk of leaving it:
Evidence used:
Repair:
Why the repair matches user behavior:
```

Different correct Playwright syntax is acceptable when the behavior and reasoning remain sound.

## Suggested suite shape

```text
tests/
  checkout.spec.ts
pages-or-components/
  checkout.ts          only if the abstraction earns its place
fixtures/
  test-data.ts
playwright.config.ts
```

Do not add a page object or custom fixture solely to satisfy the rubric. Explain why a plain test/helper is sufficient or why an abstraction reduces a real change cost.

## Evidence package

Provide:

- the passing test output;
- a captured failure trace or equivalent diagnostic artifact;
- a short root-cause note for the repaired test;
- browser/project coverage and why it was chosen;
- known limitations and the next highest-value scenario.

## Completion standard

The learning path is complete when all core lessons and Core Practice challenges are complete, including the debugging checkpoint and this capstone. Optional lessons and Additional Practice remain available for depth but do not block completion.

AI assistance is allowed. You must still be able to walk through starting state, each locator contract, action/outcome synchronization, assertion evidence, isolation strategy, and failure diagnosis. If you cannot explain a generated line, it is not yet maintainable code.

## Final self-review

Run the tests independently, in a different order, and more than once. Review the first-run result—not only retry success. A practical automation engineer ships a feedback system the team can trust, not just a script that once passed.
