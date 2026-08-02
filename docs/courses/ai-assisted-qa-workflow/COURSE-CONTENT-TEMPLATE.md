# AI-Assisted QA Workflow — Checkpoint Content Template

**Task:** QA-002

The machine-readable Indonesian outline lives at [`content.json`](../../../content/courses/ai-assisted-qa-workflow/id/content.json). It uses the reusable structure below for every checkpoint and the capstone. The outline is content only; it does not create UI routes, database tables, artifact uploads, or automatic grading.

## Authoring structure

| Field               | Shape                                                   | Authoring guidance                                                                                                                              |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`             | string                                                  | Short learner-facing title for the unit.                                                                                                        |
| `objective`         | string                                                  | One outcome the learner can demonstrate after the unit.                                                                                         |
| `video`             | status, title, duration, focus                          | Video metadata only. The pilot starts with `planned`; safe embed handling is a later task.                                                      |
| `writtenLesson`     | Markdown string                                         | The written explanation rendered by the existing Markdown renderer. Use headings, lists, tables, code fences, and supported alerts when useful. |
| `aiActivity`        | goal, prompt, learner actions, expected output          | Preserve the workflow: AI proposes → learner verifies → learner edits → learner justifies.                                                      |
| `localExercise`     | repository paths, instructions, artifacts, safety notes | Link to the learner-run companion repository and keep execution within the authorized target boundary.                                          |
| `evidenceChecklist` | list of strings                                         | Concrete evidence the learner should have before self-attesting completion.                                                                     |
| `reflectionPrompts` | list of strings                                         | Prompts that make the learner explain judgment, gaps, and uncertainty.                                                                          |
| `completionAction`  | stable ID, label, requirements, self-attested flag      | Completion is a learner confirmation. The action must not imply artifact upload or automated grading.                                           |

## Checkpoint rules

Each checkpoint also carries its manifest `slug`, `order`, `reflectionId`, and `completionId`. The content loader validates these values against the QA-001 manifest so content cannot silently drift from the route and progress contract.

The seven Indonesian outlines are:

1. `01-requirements` — facts, ambiguity, assumptions, scope, and risk.
2. `02-test-design` — candidate scenarios, coverage critique, and prioritization.
3. `03-test-writing` — clear test cases and automation candidates.
4. `04-automation` — a small Playwright + TypeScript suite.
5. `05-execution` — local runs and sanitized evidence.
6. `06-triage` — classification of test, product, environment, and data failures.
7. `07-quality-summary` — fix or defect communication, re-run, and residual risk.

The final checkpoint contains `capstoneReference: "ai-assisted-qa-workflow.capstone"`. This links the checkpoint to the capstone outline in the same document.

## Capstone extension

The capstone uses the same eight fields and adds:

- `id` and `reflectionId` for stable future progress wiring;
- `requirements` for the end-to-end scheduling workflow;
- evidence that covers all seven checkpoints, at least one failure triage, and a final risk-based quality decision.

All content is currently under the `id` locale. English content is intentionally absent and must not be supplied through a fallback loader.
