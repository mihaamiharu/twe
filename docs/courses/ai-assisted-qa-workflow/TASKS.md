# AI-Assisted QA Workflow — Task Backlog

This is the local implementation backlog for the pilot. Each task should be implemented and verified independently. Once the backlog is stable, mirror approved tasks into GitHub Issues according to the repository issue-tracker convention.

## Working rules

- Read `CONTEXT.md`, `COURSE-BRIEF.md`, `STARTER-REPOSITORY.md`, and `IMPLEMENTATION-PLAN.md` before starting a task.
- Work on one task at a time.
- Preserve unrelated user changes.
- Keep the pilot local-first; do not add CI or payment work.
- Add or update tests for behavior changes.
- Run the narrowest relevant verification command, then the broader checks when practical.
- Update the task status and record important decisions in the relevant docs.

## Phase 0 — Contracts and content

### [x] QA-001 — Define course content manifest and route contract

**Outcome:** The course has stable slugs, ordering, locale availability, checkpoint metadata, and route expectations.

**Acceptance criteria:**

- Course slug and seven checkpoint slugs are documented.
- Indonesian availability is explicit.
- English routes do not fall back to Indonesian content.
- Overview and checkpoint route shapes are documented.
- Completion and reflection identifiers are stable.

### [x] QA-002 — Define checkpoint content template

**Outcome:** Every checkpoint follows the same authoring structure.

**Acceptance criteria:**

- The template includes objective, video, written lesson, AI activity, exercise, evidence checklist, reflection, and completion action.
- The seven checkpoint content outlines are drafted.
- The capstone requirements are linked from the final checkpoint.

### [x] QA-003 — Define completion, XP, and achievement behavior

**Outcome:** Course completion reuses existing progression behavior without introducing a new currency or assessment system.

**Acceptance criteria:**

- Checkpoint completion is self-attested.
- Existing XP behavior is reused where practical.
- One course completion achievement is specified.
- AI or human review cannot change completion, XP, or achievement state.

**Implementation decision:** Course checkpoints and the capstone reuse hidden,
course-tagged tutorial records and the existing `progress` rows rather than a
new course table. A first checkpoint completion awards the existing 25 XP;
duplicates and capstone completion award 0 XP. The
`ai-assisted-qa-workflow-complete` achievement is awarded once after all seven
checkpoints and the capstone are complete. Completion accepts Indonesian
self-attestation only and does not read AI or human review state.

## Phase 1 — Learner vertical slice

### [x] QA-010 — Build the course overview page

**Outcome:** A learner can understand the course and start the recommended sequence.

**Acceptance criteria:**

- The Indonesian overview shows audience, outcome, prerequisites, seven checkpoints, capstone, and setup requirements.
- The page links to Start Here and each checkpoint.
- The page is protected according to the existing course access decision.

**Implementation decision:** The overview is served at
`/id/courses/ai-assisted-qa-workflow` beneath the existing authenticated locale
layout. It loads Indonesian manifest/content and existing progress through
`getCourseOverview`, uses a `#start-here` orientation section, and exposes
checkpoint links only; detail pages remain deferred to QA-012 onward. English
course content is not used as a fallback.

### [x] QA-011 — Build Start Here orientation

**Outcome:** A learner can prepare their machine and create the starter repository.

**Acceptance criteria:**

- Common npm workflow is documented.
- Windows, macOS, and Linux instructions are included.
- `TARGET_BASE_URL` configuration is explained.
- The learner can run a small Playwright smoke test.
- Setup failures have troubleshooting guidance.

**Implementation decision:** Start Here is a dedicated Indonesian page at
`/$locale/courses/$courseSlug/start-here` beneath the authenticated locale
layout. Setup guidance is stored in the localized course content document and
covers the local npm workflow, public-template ownership, OS notes,
troubleshooting, expected smoke output, and public-target safety boundaries.
The page does not execute Playwright, call GitHub, or upload artifacts.

### [x] QA-012 — Build checkpoint 1: requirements analysis

**Outcome:** A learner can analyze the fictional scheduling PRD and record assumptions and risks.

**Acceptance criteria:**

- The page includes the agreed lesson format.
- The learner is directed to the repository PRD and requirements template.
- The evidence checklist and reflection are clear.
- Completion can be recorded without uploading artifacts.

**Implementation decision:** The Indonesian checkpoint is served at
`/$locale/courses/$courseSlug/checkpoints/$checkpointSlug` beneath the existing
authenticated locale layout, with the stable `01-requirements` slug. It uses
`getCourseOverview` (which loads the typed manifest/content and existing
course-tagged progress), renders the lesson Markdown and planned video metadata,
and shows the AI workflow, local repository paths, evidence, reflection, and
self-attestation sections. Completion calls the QA-003
`completeCourseCheckpoint` contract with both confirmations; it does not upload
artifacts, embed video, or perform AI review. The next checkpoint is linked by
its stable path, but checkpoints 2–7 remain unimplemented.

### [x] QA-013 — Add checkpoint reflection and completion flow

**Outcome:** A learner can confirm evidence, answer a reflection prompt, and complete checkpoint 1.

**Acceptance criteria:**

- Reflection prompts are visible before completion.
- Completion is self-attested and requires both the exercise and reflection confirmations.
- Completion is idempotent.
- Existing progress and XP behavior is preserved.
- The next recommended checkpoint is shown.

**Verification:** QA-012 already delivered the complete checkpoint-1 reflection
and completion UI, so QA-013 added no duplicate page work. The reflection card
is rendered before the completion card; completion is gated until both
self-attestation checkboxes are checked; the server schema requires both
confirmation values to be literal `true`; and an already-completed checkpoint
renders its recorded state without a second completion action. Existing course
progress tests verify that the first checkpoint completion awards the existing
25 XP and a duplicate completion awards 0 XP without changing state. The
course progress loader preserves existing `progress` rows, and the page shows
the stable link to checkpoint 2 (`02-test-design`) as the next recommendation.

Focused verification passed:

`./.runtime/bun/bin/bun test --preload ./src/tests/bun-preload.ts src/tests/unit/course-checkpoint.test.tsx src/tests/unit/course-content.test.ts`

16 tests passed.

## Phase 2 — Full learner course

### [ ] QA-020 — Add checkpoints 2–7 and capstone

**Outcome:** All course exercises are available from day one.

**Acceptance criteria:**

- Every checkpoint follows the content template.
- The seeded failure and quality-decision exercise are clearly explained.
- The capstone requires evidence from the complete workflow.

#### [x] QA-020-02 — AI-assisted test design

**Outcome:** A learner can use AI to propose candidate test scenarios, critique
coverage, and prioritize a defensible test design without treating AI output as
the answer.

**Acceptance criteria:**

- The Indonesian checkpoint uses the stable `02-test-design` slug beneath the authenticated course route.
- The page includes the typed objective, written lesson, portable AI activity, local exercise, evidence checklist, reflection, and self-attested completion action.
- The next checkpoint is linked at the stable `03-test-writing` path.
- Video remains planned metadata only; no embeds, uploads, review, CI, or new persistence are added.

**Implementation decision:** The existing authenticated checkpoint route now
allowlists `02-test-design` alongside checkpoint 1 and selects the checkpoint
from the route parameter. The existing typed content loader, progress contract,
completion mutation, and shared checkpoint page remain the source of truth.

**Verification:** Focused route, content, and component tests cover the stable
Indonesian slug, checkpoint-2 content, planned-video state, self-attestation
gating, and the next-checkpoint link.

#### [x] QA-020-03 — Test writing

**Outcome:** A learner can turn prioritized scenarios into clear, observable test cases and automation candidates.

**Acceptance criteria:**

- The Indonesian checkpoint uses the stable `03-test-writing` slug beneath the authenticated course route.
- The page includes the typed objective, written lesson, scenario-to-test-case AI activity, local exercise, automation-candidate guidance, evidence, reflection, and self-attested completion action.
- The next checkpoint is linked at the stable `04-automation` path.
- Video remains planned metadata only; no embeds, uploads, review, CI, or new persistence are added.

**Implementation decision:** The existing parameter-driven checkpoint route
allowlists `03-test-writing`, selects the checkpoint from the typed Indonesian
content document, and reuses the shared renderer, generic confirmation labels,
progress contract, and completion mutation.

**Verification:** Focused route, content, component, and completion tests cover
the stable slug, checkpoint-specific SEO metadata, test-writing content,
self-attestation gating, next-checkpoint navigation, and idempotent existing
progress behavior.

#### [x] QA-020-04 — Playwright automation

**Outcome:** A learner can implement selected test cases as a small Playwright + TypeScript suite.

**Implementation decision:** The existing parameterized checkpoint route now
allowlists `04-automation` and provides checkpoint-specific SEO metadata. The
page reuses the typed Indonesian content loader, shared renderer, existing
self-attested completion contract, and the stable link to `05-execution`.
Playwright execution remains local to the companion repository; TestingWithEkki
does not run live browser automation or receive artifacts.

**Verification:** Focused route, content, component, and completion tests cover
the stable slug, automation-specific metadata and lesson, locator/assertion and
maintainability guidance, local exercise and evidence contract, self-attestation
gating, next-checkpoint navigation, and idempotent existing progress behavior.

#### [ ] QA-020-05 — Test execution and evidence

**Outcome:** A learner can run the suite locally and capture sanitized execution evidence.

#### [ ] QA-020-06 — Failure triage

**Outcome:** A learner can classify a failed check and record evidence-backed hypotheses for test, product, environment, or data causes.

#### [ ] QA-020-07 — Quality decision and capstone

**Outcome:** A learner can verify a fix or communicate a defect, then make a risk-based quality decision in the capstone.

### [ ] QA-021 — Add course navigation and progress display

**Outcome:** Learners can move through the course and understand their progress.

**Acceptance criteria:**

- Previous/next links work.
- Free navigation remains available.
- Recommended sequence is visible.
- Completed checkpoints are visually distinct.

### [ ] QA-022 — Add allowlisted video embeds

**Outcome:** Unlisted course videos render safely inside checkpoint pages.

**Acceptance criteria:**

- Only approved YouTube embed URLs are accepted.
- Raw arbitrary iframe HTML is not enabled.
- Missing videos have a useful fallback state.
- Video metadata is localized.

## Phase 3 — Starter repository

### [ ] QA-030 — Create the public GitHub template repository

**Outcome:** Learners can create an independent portfolio repository from the template.

**Acceptance criteria:**

- Template repository is public.
- README explains `Use this template` and course ownership.
- Node.js LTS, npm, and Playwright setup are documented.
- `package-lock.json` is committed.
- No reference solution is included.

### [ ] QA-031 — Add PRD, artifact templates, reflections, and evidence structure

**Outcome:** Learners have everything required to produce portfolio evidence.

**Acceptance criteria:**

- Fictional PRD and acceptance criteria are included.
- Test-case, execution, failure-analysis, quality-summary, and reflection templates are included.
- Folder README files explain expected contents.
- Public-repository safety guidance is included.

### [ ] QA-032 — Add deterministic failure practice

**Outcome:** Learners can practice failure triage without depending entirely on external-site behavior.

**Acceptance criteria:**

- A deliberately broken test is included.
- Captured evidence or a triage packet is included.
- The exercise distinguishes test, product, environment, and data failures.
- The solution remains private.

### [ ] QA-033 — Validate setup on all supported operating systems

**Outcome:** The setup path works on Windows, macOS, and Linux.

**Acceptance criteria:**

- Smoke test runs on all three operating systems.
- Commands do not depend on Bash-only behavior.
- Troubleshooting notes cover common browser-install and environment failures.

## Phase 4 — Private AI review workspace

### [ ] QA-040 — Add admin-only review access

**Outcome:** Only the course owner/admin can access the review workspace.

**Acceptance criteria:**

- Unauthenticated and non-admin users are denied.
- Access is permission-based, not exposed through a public route.
- Learners cannot see AI drafts or other learners’ reviews.

### [ ] QA-041 — Add selected-file review input

**Outcome:** The reviewer can select relevant files for one checkpoint at a time.

**Acceptance criteria:**

- Reviewer selects a checkpoint.
- Reviewer provides only relevant artifacts.
- Whole-repository fetching and arbitrary URL fetching are not required.
- Raw inputs are deleted after processing.

### [ ] QA-042 — Add standardized structured AI review

**Outcome:** AI produces a consistent draft that the reviewer can verify.

**Acceptance criteria:**

- Output contains status, evidence, concerns, suggestions, confidence, and uncertainty.
- Evidence cites filenames, sections, or line numbers where possible.
- Standard rubric prompt is versioned.
- Reviewer notes can add private context.

### [ ] QA-043 — Add reviewer editing and private feedback preparation

**Outcome:** The reviewer can edit the draft and prepare a message for manual sending.

**Acceptance criteria:**

- Reviewer can set final status per checkpoint.
- Reviewer can add final notes.
- Draft and final feedback are stored without raw uploaded artifacts.
- No automatic learner email is sent.
- Review status does not affect course completion or XP.

## Phase 5 — Pilot and launch

### [ ] QA-050 — Run private pilot

**Outcome:** 5–10 learners complete the course and provide feedback.

**Acceptance criteria:**

- All seven checkpoints are available from day one.
- At least five learners participate.
- At least four run the first local test successfully.
- At least three complete all checkpoints and the capstone.
- Seeded failure classification is reviewed.
- No critical safety or privacy issue is found.

### [ ] QA-051 — Prepare Threads campaign

**Outcome:** Threads drives learners to the course overview page.

**Acceptance criteria:**

- Launch thread explains the seven-step workflow.
- Weekly supporting posts are prepared.
- Course overview is the canonical CTA.
- No waitlist or email gate is promoted.

### [ ] QA-052 — Capture pilot feedback and decide next scope

**Outcome:** Pilot evidence informs the next iteration.

**Acceptance criteria:**

- Checkpoint reflections are collected.
- Final survey covers setup, clarity, AI usefulness, and confidence.
- A few completers and abandoners are interviewed.
- Friction points are recorded and prioritized.
- Monetization, CI, and broader tracks remain deferred unless evidence supports revisiting them.
