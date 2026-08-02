# AI-Assisted QA Workflow — Implementation Plan

**Status:** Ready for implementation
**Scope:** Free pilot, local-first
**Primary locale:** Indonesian (`id`)
**Audience:** Manual QA professionals transitioning to QA automation

## Outcome

Deliver a free, video-led hybrid course on TestingWithEkki that teaches a complete AI-assisted QA workflow using Playwright + TypeScript. Learners use their own machines and a public GitHub template repository as their workspace and portfolio evidence.

The course is complete when a learner finishes all seven checkpoints and the capstone. Optional review feedback does not affect completion, XP, or achievements.

## Locked decisions

### Course experience

- TestingWithEkki is the canonical course home.
- The course is available in Indonesian first; do not show Indonesian content under the English locale.
- The course overview is the canonical destination from Threads.
- Login is required to track progress; there is no waitlist or email gate.
- All seven checkpoints are available from day one.
- Learners may navigate freely, but the course recommends a sequence.
- Each checkpoint has a dedicated page containing a video, written guide, exercise, evidence checklist, reflection, and completion action.
- Playwright fundamentals and JavaScript/TypeScript preparation are advisory links, not hard prerequisites.
- The course uses an authorized, course-approved public scheduling page and a fictional course-owned PRD. Learners stop before real booking submission.

### Seven checkpoints

1. Requirements analysis
2. AI-assisted test design
3. Writing test cases
4. Creating Playwright automation
5. Executing tests and capturing evidence
6. Debugging and classifying failures
7. Fixing tests and making a quality decision

The capstone combines all seven checkpoints into one end-to-end scheduling workflow.

### Learner repository

- Use a public GitHub template repository, not a fork.
- Learners create their own repository from the template and use it as portfolio evidence.
- Use Node.js LTS, npm, and a committed `package-lock.json`.
- Support Windows, macOS, and Linux with a universal workflow plus OS-specific instructions.
- Include the fictional PRD, blank artifact templates, seeded failure, reflection files, and portfolio README.
- Public repositories are recommended by default, with a private option documented.
- Never commit credentials, personal data, real booking data, or uncontrolled test targets.
- Keep the instructor/reference solution repository private.
- Do not add CI in the pilot.

### Progress and assessment

- Reuse the existing tutorial completion and XP flow where practical.
- Award existing checkpoint XP and one course completion achievement.
- Completion is self-attested after the learner confirms the exercise and reflection are complete.
- Use the rubric labels `Meets expectations` and `Needs revision`.
- Learners may revise indefinitely.
- Optional review is requested only after all seven checkpoints and the capstone are complete.

### Private AI review

The reviewer workspace is part of the pilot but is built after the learner-facing course flow.

- Access is restricted to the course owner/admin account.
- The reviewer selects relevant files for one checkpoint at a time.
- The platform generates a structured AI draft using one standardized rubric prompt and optional private reviewer notes.
- The draft cites filenames, sections, or line numbers and flags uncertainty.
- The reviewer edits the draft, sets final statuses, and manually sends private feedback.
- AI never awards completion, XP, achievements, or certification.
- Raw uploaded artifacts are deleted after processing.
- Retain only the repository URL, structured draft, final feedback, and review status.
- Provide one initial full-repository review and one follow-up review after revision.

## Delivery phases

### Phase 0 — Content and contracts

Finalize the course manifest, route shape, checkpoint slugs, lesson format, completion contract, starter repository contract, and review rubric before implementing UI.

### Phase 1 — Learner vertical slice

Build the course overview, Start Here orientation, checkpoint 1, one reflection flow, one completion flow, and the local starter-repository setup path. Validate this slice with a real learner workflow before expanding.

### Phase 2 — Full learner course

Add checkpoints 2–7, capstone guidance, video embeds, navigation, progress display, localized copy, and the completion achievement.

### Phase 3 — Starter repository

Create and validate the public GitHub template, including the fictional PRD, templates, setup scripts, cross-platform instructions, seeded failure, and safety guidance. Keep the solution repository private.

### Phase 4 — Private AI review

Add the admin-only review workspace, selected-file input, structured AI draft, evidence references, reviewer editing, retention/deletion behavior, and manual feedback preparation.

### Phase 5 — Pilot and Threads launch

Run a private pilot with 5–10 learners. Keep all course checkpoints available from day one and use a weekly Threads campaign that points to the course overview page.

## Out of scope for this pilot

- CI/CD and live external CI runs
- Payments, paid courses, and XP discounts
- Learner-facing embedded AI assistant
- Automatic grading or automatic feedback delivery
- In-app artifact submission for learners
- GitHub API integration or arbitrary repository fetching
- A new demo application
- Real booking, cancellation, or rescheduling
- English course content before the Indonesian pilot is validated

## Definition of pilot-ready

- A learner can create the template repository and run the first local smoke test on Windows, macOS, and Linux.
- A learner can complete all seven checkpoints and the capstone using the course and repository.
- Progress, reflections, XP, and course completion work without artifact uploads.
- The owner can review a completed repository through the private AI-assisted workspace.
- The owner can edit and manually send private feedback.
- No critical privacy, safety, target, or data-handling issue is present.
