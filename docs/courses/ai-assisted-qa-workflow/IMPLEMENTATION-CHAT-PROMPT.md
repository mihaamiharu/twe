# Implementation Chat Prompt

Copy and adapt the prompt below when starting a fresh implementation chat.

```text
You are implementing one scoped task for TestingWithEkki.

First read these files completely:

- /home/ez151/twe/CONTEXT.md
- /home/ez151/twe/docs/courses/ai-assisted-qa-workflow/COURSE-BRIEF.md
- /home/ez151/twe/docs/courses/ai-assisted-qa-workflow/STARTER-REPOSITORY.md
- /home/ez151/twe/docs/courses/ai-assisted-qa-workflow/IMPLEMENTATION-PLAN.md
- /home/ez151/twe/docs/courses/ai-assisted-qa-workflow/TASKS.md

Then inspect the existing implementation patterns relevant to the task. Preserve unrelated user changes and do not broaden the scope.

Task to implement:

- ID: [TASK ID]
- Title: [TASK TITLE]

Requirements:

1. Implement only this task and the minimum supporting changes required.
2. Follow the repository's TanStack Start, server-function, authentication, localization, and filesystem-first content conventions.
3. Do not add CI, payments, learner artifact uploads, GitHub API integration, or unrelated course features.
4. Use `apply_patch` for local edits.
5. Add or update tests for behavior changes.
6. Run the narrowest relevant checks, then broader checks when practical.
7. Report changed files, verification commands, results, and any remaining risks.

Before editing, briefly state your understanding of the task and the files you expect to touch. If the task conflicts with the locked decisions, stop and explain the conflict instead of silently changing scope.
```

## Recommended first implementation prompt

Use this for the first build task:

```text
Implement QA-001: Define the AI-Assisted QA Workflow course content manifest and route contract.

Read the required project and course documents first. Inspect the existing tutorial registry, content loader, localized route conventions, authentication layout, and progress/completion functions.

Create the smallest maintainable content contract that supports:

- course slug `ai-assisted-qa-workflow`;
- Indonesian-only availability for the pilot;
- one overview page;
- seven ordered checkpoint slugs;
- a capstone reference;
- stable checkpoint identifiers for reflections and completion;
- no English fallback;
- no new generalized course database tables unless the existing architecture cannot support the contract.

Do not build the UI yet. Update the relevant content types, manifest/content files, and documentation only where necessary. Add focused tests for the manifest and locale availability. Do not change unrelated tutorials or challenges.
```
