# AI-Assisted QA Workflow — Learner Starter Repository

This repository is the local workspace for the free **AI-Assisted QA Workflow** course on TestingWithEkki.

You create your own repository from the public course template, complete the exercises locally, and keep your QA artifacts with your Playwright + TypeScript code. Public visibility is recommended for portfolio evidence; private visibility is acceptable when needed.

## Prelaunch status

This directory is the staging copy of the learner template. The public GitHub template and the course-approved scheduling target have not been published yet.

- Course page: `/id/courses/ai-assisted-qa-workflow`
- Public template repository: pending course-author publication
- `TARGET_BASE_URL`: pending course-author confirmation

Do not substitute a different target or create a real booking while these values are pending.

## Safety boundary

- Use only the course-approved public scheduling target.
- Use synthetic names, email addresses, and notes.
- Stop before final booking, cancellation, or rescheduling.
- Do not scrape, load-test, probe vulnerabilities, or automate uncontrolled accounts.
- Never commit `.env`, credentials, tokens, personal data, or real booking information.

## Requirements

- Node.js 20 or newer; use an active LTS release
- npm
- Git
- A code editor and terminal

The committed lockfile currently resolves Playwright 1.62.1. Use `npm ci` to preserve the locked dependency set.

## Start locally

```text
1. Create your repository from the GitHub template using “Use this template”.
2. Clone your new repository and enter its directory.
3. Install dependencies: npm ci
4. Install Playwright browsers: npx playwright install
5. Copy .env.example to .env and set TARGET_BASE_URL to the approved target.
6. Run the smoke test: npm run test:smoke
```

The expected smoke-test result is one passing test against the approved target. If `TARGET_BASE_URL` is blank, Playwright reports one skipped test; that means setup is incomplete, not that the smoke test passed. If the approved target is unavailable, save the original output and classify the issue before changing the test.

## Operating-system notes

### Windows PowerShell

```powershell
Copy-Item .env.example .env
npm ci
npx playwright install
npm run test:smoke
```

### macOS and Linux

```bash
cp .env.example .env
npm ci
npx playwright install
npm run test:smoke
```

If Linux browser dependencies are missing, inspect the packages before using `npx playwright install --with-deps`. Do not use `sudo npm ci`.

## Checkpoint workspace

| Checkpoint          | Main evidence location          |
| ------------------- | ------------------------------- |
| 01 Requirements     | `docs/requirements/`            |
| 02 Test design      | `docs/test-cases/`              |
| 03 Test writing     | `docs/test-cases/`              |
| 04 Automation       | `tests/`                        |
| 05 Execution        | `docs/reports/` and `evidence/` |
| 06 Failure triage   | `docs/reports/` and `evidence/` |
| 07 Quality decision | `docs/reports/`                 |
| Reflections         | `reflections/`                  |

## Test commands

```text
npm test                 Run the learner test suite.
npm run test:smoke       Run the approved-target smoke test.
npm run test:triage      Open the seeded triage exercise.
npm run typecheck        Check TypeScript without emitting files.
npx playwright show-report reports/playwright
                         Open the generated HTML report.
```

The seeded triage test is intentionally marked as a learning exercise. Follow `docs/reports/failure-packet.md`, remove the `test.fixme` marker only when you are ready to investigate it, and keep the initial failure evidence.

## Portfolio checklist

- [ ] Requirements notes and risk list
- [ ] Prioritized test scenarios
- [ ] Test cases and automation candidates
- [ ] Playwright test code
- [ ] Sanitized execution evidence
- [ ] Failure classification and hypothesis checks
- [ ] Updated test or defect report
- [ ] Quality summary and residual-risk decision
- [ ] Reflections for all seven checkpoints and the capstone

## Course ownership

The course narrative, videos, progress, XP, and completion state live on TestingWithEkki. This repository owns local execution, QA artifacts, and portfolio evidence. The instructor reference solution is not included in this template.
