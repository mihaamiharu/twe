# AI-Assisted QA Workflow — Course Brief

**Status:** Agreed pilot direction; implementation baseline
**Phase:** Free-first validation
**Audience:** Manual QA professionals and QA professionals transitioning to QA automation; not a complete-beginner course

## Purpose

Teach a practical, end-to-end QA workflow in which AI accelerates the work without replacing QA judgment. The course should demonstrate how a learner moves from a requirement to a defensible quality decision.

## Product boundary

TestingWithEkki is the canonical course home. It owns the learning sequence, videos, explanations, progress, XP, assignments, and reflections.

A dedicated course companion repository is the learner’s local workspace. It owns the Playwright + TypeScript setup, sample requirements, QA artifacts, test code, local execution, and evidence.

The course is AI-tool agnostic. Learners may use ChatGPT, Claude, Copilot, or another capable tool, but the required automation stack for the pilot is Playwright + TypeScript.

## Course promise

By completing the pilot, a learner can take a small scheduling feature from requirements through test design, automation, execution, failure triage, defect communication, and a final risk-based quality summary.

“All tests passed” is not the final learning outcome. The learner must explain what was tested, what was not tested, what failures mean, and what residual risk remains.

## Pilot format

The pilot is a video-led hybrid course:

1. A concise explanatory video
2. A course-owned artifact or checklist
3. An AI-assisted activity
4. A local Playwright + TypeScript exercise
5. A reflection or evidence checkpoint

All seven checkpoints are available from day one. The course has one overview page and one dedicated page per checkpoint. Learners may navigate freely, but the course presents a recommended sequence. Login is required for progress tracking; there is no waitlist or email gate.

### Workflow modules

| Module | Learner practice | Evidence produced |
| --- | --- | --- |
| Requirements analysis | Identify ambiguity, scope, assumptions, and risks in a sample PRD | Requirements notes and risk list |
| Test design | Ask AI for candidate scenarios, critique coverage, and prioritize tests | Test strategy and prioritized scenarios |
| Test writing | Turn scenarios into clear test cases and automation candidates | Test cases and automation map |
| Automation | Implement selected checks with Playwright + TypeScript | Executable test code |
| Execution | Run tests locally and collect results | Test report, screenshots, or traces |
| Failure triage | Classify failures as test, product, environment, or data problems | Triage notes and hypotheses |
| Fix and verification | Correct the test or document the product defect, then re-run | Updated test or defect report |
| Quality decision | Summarize evidence, gaps, and residual risk | Release-quality recommendation |

## Practice target

The pilot uses a public scheduling page, such as a Calendly event page, as an observable system under test. The course supplies a fictional PRD and acceptance criteria for a narrow scheduling feature; the PRD is not presented as the vendor’s actual specification.

Practice must remain low-volume and functional. Learners must not scrape, load-test, probe vulnerabilities, submit real personal data, or create uncontrolled real bookings. A link controlled by the course author and synthetic data should be used whenever a state-changing flow is required.

The current TestingWithEkki challenge executor is a client-side Playwright shim, so live third-party browser automation is outside the in-platform playground boundary. Learners run the real Playwright tests locally from the companion repository.

## AI learning rule

Every AI-assisted activity follows this pattern:

> AI proposes → learner verifies → learner edits → learner justifies

The course should preserve the learner’s prompt, AI output, changes, and final reasoning where practical. AI output is an input to QA work, never the assessment answer.

## Capstone

Given the sample scheduling requirement, the learner must:

- identify risks and ambiguities;
- produce prioritized scenarios and test cases;
- implement a small Playwright suite;
- execute it locally;
- triage at least one failure;
- distinguish a test failure from a product defect;
- report evidence and residual risk.

Completion requires all seven checkpoint exercises and the capstone. Learners record evidence and reflections in their own companion repository; TestingWithEkki tracks completion rather than receiving artifact uploads.

## Review model

Learners may request optional review after completing the full repository and capstone. The private reviewer workspace uses AI to prepare a checkpoint-by-checkpoint draft with evidence, concerns, suggested feedback, and uncertainty. The course owner makes the final judgment and sends feedback manually. Review does not affect completion, XP, or achievements.

## Success measures for the pilot

- Course start-to-completion rate
- Capstone completion rate
- Time to first successful local test run
- Percentage of learners producing all required artifacts
- Learner-reported confidence in the workflow
- Progression from the course into the existing Web Testing track

## Explicitly deferred

- Paid courses and payment flows
- XP redemption for money or discounts
- A general embedded AI assistant
- A new dedicated demo application
- Live third-party automation inside TestingWithEkki
- CI/CD and live external CI runs
- Learner-facing embedded AI review or automatic grading
- Learner artifact uploads to TestingWithEkki
- Expansion into multiple QA disciplines before this pilot is validated
