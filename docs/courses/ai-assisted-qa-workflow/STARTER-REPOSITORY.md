# AI-Assisted QA Workflow — Starter Repository Plan

## Role

The starter repository is a companion workspace, not a second course platform. Learners clone it, follow the course checkpoints, run Playwright locally, and keep their QA artifacts with their code.

## Learner-facing layout

```text
ai-assisted-qa-workflow-starter/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── playwright.config.ts
├── .env.example
├── docs/
│   ├── requirements/
│   ├── test-cases/
│   ├── reports/
│   └── README.md
├── tests/
├── evidence/
├── reflections/
└── test-data/
```

The repository is a public GitHub template. Learners use **Use this template** to create an independent repository for their portfolio. The learner repository must not contain the private instructor/reference solution.

The learner-facing contract is Node.js LTS, npm, Playwright, and TypeScript with reproducible local setup instructions. CI is intentionally out of scope for the pilot.

## Checkpoint model

Each checkpoint should be independently usable and linked from the corresponding TestingWithEkki lesson:

1. `01-requirements` — PRD, acceptance criteria, assumptions, and risks
2. `02-test-design` — strategy, scenarios, and AI critique
3. `03-test-writing` — test cases and automation candidates
4. `04-automation` — Playwright starter tests
5. `05-execution` — results and evidence
6. `06-triage` — seeded or recorded failure analysis
7. `07-quality-summary` — final report and residual risk

Checkpoints should be represented by clearly named files, folders, or commits rather than hidden application state. Learners should be able to compare their work with a reference only after attempting the activity. The instructor/reference solution remains in a separate private repository.

## Safety and privacy

- Store no real Calendly credentials, calendar tokens, or personal invitee data.
- Use synthetic names, email addresses, and answers.
- Prefer a public event link controlled by the course author.
- Do not automate booking, cancellation, or rescheduling against an uncontrolled account.
- Do not include scraping, load testing, security probing, or bypass instructions.
- Document that external-site behavior can change and that environment failures are valid triage scenarios.

## Repository README requirements

The README should explain:

- the course link and checkpoint map;
- supported Node.js LTS and Playwright versions;
- npm installation and first-run commands;
- how to configure the authorized target URL;
- how to run smoke, functional, and regression tests;
- how to save evidence without committing sensitive data;
- how to report an external-site change or environment failure;
- where the reference materials become available.

The setup guide must provide one universal workflow plus separate Windows, macOS, and Linux instructions. It must include a small smoke test against the course-approved target URL.

## Separation of ownership

| Concern | Canonical location |
| --- | --- |
| Course narrative, videos, progress, XP | TestingWithEkki |
| Requirements and QA artifact templates | Companion repository, linked from TestingWithEkki |
| Executable tests and local evidence | Companion repository |
| AI provider choice for learner activities | Learner |
| Automation framework | Playwright + TypeScript |
| External target behavior | Observed public target, within authorized limits |
| Portfolio evidence | Learner-owned public repository created from the template |
| Instructor review | Private TestingWithEkki reviewer workspace; raw artifacts deleted after processing |
