# AI-Assisted QA Workflow — Course Manifest and Route Contract

**Task:** QA-001

**Status:** Stable pilot contract; lesson content is authored in QA-002.

The machine-readable source of truth is [`manifest.json`](../../../content/courses/ai-assisted-qa-workflow/manifest.json). The reusable checkpoint authoring structure and Indonesian outline are defined in [`COURSE-CONTENT-TEMPLATE.md`](./COURSE-CONTENT-TEMPLATE.md) and [`content.json`](../../../content/courses/ai-assisted-qa-workflow/id/content.json). The manifest is intentionally separate from the tutorial registry because this course is a multi-checkpoint learning package, not an existing tutorial.

## Course contract

| Field               | Contract                              |
| ------------------- | ------------------------------------- |
| Course slug         | `ai-assisted-qa-workflow`             |
| Default locale      | `id`                                  |
| Available locales   | `id` only                             |
| Authentication      | Required for course progress tracking |
| Capstone ID         | `ai-assisted-qa-workflow.capstone`    |
| Capstone checkpoint | `07-quality-summary`                  |

The course is available in Indonesian first. A valid English URL must not display Indonesian content: the content loader returns no manifest for `en` rather than falling back. Invalid locales remain governed by the existing locale route validation.

## Route contract

The route patterns use the existing TanStack Router `$param` convention:

| Page       | Pattern                                                    | Indonesian example                                                |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Overview   | `/$locale/courses/$courseSlug`                             | `/id/courses/ai-assisted-qa-workflow`                             |
| Checkpoint | `/$locale/courses/$courseSlug/checkpoints/$checkpointSlug` | `/id/courses/ai-assisted-qa-workflow/checkpoints/01-requirements` |

The overview is the canonical course destination. All seven checkpoints are available from day one and may be opened freely; ordering is the recommended sequence.

## Checkpoint identifiers

These slugs align with the companion repository checkpoint folders. Reflection and completion IDs are stable namespaced identifiers and must be reused by later progress flows.

| Order | Slug                 | Companion path       | Reflection ID                                                       | Completion ID                                                       |
| ----: | -------------------- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
|     1 | `01-requirements`    | `01-requirements`    | `ai-assisted-qa-workflow.checkpoints.01-requirements.reflection`    | `ai-assisted-qa-workflow.checkpoints.01-requirements.completion`    |
|     2 | `02-test-design`     | `02-test-design`     | `ai-assisted-qa-workflow.checkpoints.02-test-design.reflection`     | `ai-assisted-qa-workflow.checkpoints.02-test-design.completion`     |
|     3 | `03-test-writing`    | `03-test-writing`    | `ai-assisted-qa-workflow.checkpoints.03-test-writing.reflection`    | `ai-assisted-qa-workflow.checkpoints.03-test-writing.completion`    |
|     4 | `04-automation`      | `04-automation`      | `ai-assisted-qa-workflow.checkpoints.04-automation.reflection`      | `ai-assisted-qa-workflow.checkpoints.04-automation.completion`      |
|     5 | `05-execution`       | `05-execution`       | `ai-assisted-qa-workflow.checkpoints.05-execution.reflection`       | `ai-assisted-qa-workflow.checkpoints.05-execution.completion`       |
|     6 | `06-triage`          | `06-triage`          | `ai-assisted-qa-workflow.checkpoints.06-triage.reflection`          | `ai-assisted-qa-workflow.checkpoints.06-triage.completion`          |
|     7 | `07-quality-summary` | `07-quality-summary` | `ai-assisted-qa-workflow.checkpoints.07-quality-summary.reflection` | `ai-assisted-qa-workflow.checkpoints.07-quality-summary.completion` |

This task defines identifiers and routing only. It does not create UI routes, lesson content, reflection prompts, completion handlers, XP rules, or new course database tables.
