# Plan: Architectural & Documentation Alignment

**Objective**: Standardize server function validation patterns and align file naming conventions with project guidelines.

## Key Files & Context
- **Docs**: `GEMINI.md`, `AGENTS.md`, `dev-workflow-agent.md`, `docs/API.md`.
- **Server Functions**: `src/server/*.fn.ts`.
- **Components**: `src/components/**/*.tsx` (specifically those in `PascalCase`).

## Implementation Steps

### 1. Documentation Update (Validator & Pathing)
- **Files**: `GEMINI.md`, `AGENTS.md`, `dev-workflow-agent.md`, `docs/API.md`.
- **Changes**:
    - Replace `.validator()` with `.inputValidator()` in code examples and guidelines.
    - Correct the stated location of server functions from `src/lib/*.fn.ts` to `src/server/*.fn.ts`.
    - Update the sample code snippets to match the 2026 best practices identified (Standard Schema support, implicit context).

### 2. Surgical Renaming of Components
- **Task**: Rename `PascalCase.tsx` files to `kebab-case.tsx` in `src/components` and its subdirectories.
- **List of renamos**:
    - `src/components/analytics/GoogleAnalytics.tsx` -> `src/components/analytics/google-analytics.tsx`
    - `src/components/AnimatedCounter.tsx` -> `src/components/animated-counter.tsx`
    - `src/components/auth/AuthGuardDialog.tsx` -> `src/components/auth/auth-guard-dialog.tsx`
    - `src/components/auth/GoogleOAuthButton.tsx` -> `src/components/auth/google-oauth-button.tsx`
    - `src/components/auth/LoginForm.tsx` -> `src/components/auth/login-form.tsx`
    - `src/components/auth/RegisterForm.tsx" -> "src/components/auth/register-form.tsx"
    - `src/components/BugReportDialog.tsx" -> "src/components/bug-report-dialog.tsx"
    - `src/components/challenges/ChallengeCard.tsx" -> "src/components/challenges/challenge-card.tsx"
    - `src/components/challenges/ChallengePlayground.tsx" -> "src/components/challenges/challenge-playground.tsx"
    - `src/components/challenges/ChallengeSkeleton.tsx" -> "src/components/challenges/challenge-skeleton.tsx"
    - `src/components/challenges/ChallengeSuccessDialog.tsx" -> "src/components/challenges/challenge-success-dialog.tsx"
    - `src/components/challenges/ChallengeTierProgress.tsx" -> "src/components/challenges/challenge-tier-progress.tsx"
    - `src/components/challenges/CodeEditor.tsx" -> "src/components/challenges/code-editor.tsx"
    - `src/components/challenges/ConsoleOutput.tsx" -> "src/components/challenges/console-output.tsx"
    - `src/components/challenges/FileExplorer.tsx" -> "src/components/challenges/file-explorer.tsx"
    - `src/components/challenges/MultiTabEditor.tsx" -> "src/components/challenges/multi-tab-editor.tsx"
    - `src/components/challenges/playground/EditorPanel.tsx" -> "src/components/challenges/playground/editor-panel.tsx"
    - `src/components/challenges/playground/HintConfirmDialog.tsx" -> "src/components/challenges/playground/hint-confirm-dialog.tsx"
    - `src/components/challenges/playground/HintDisplayPanel.tsx" -> "src/components/challenges/playground/hint-display-panel.tsx"
    - `src/components/challenges/playground/LoadingOverlay.tsx" -> "src/components/challenges/playground/loading-overlay.tsx"
    - `src/components/challenges/playground/PlaygroundDesktopLayout.tsx" -> "src/components/challenges/playground/playground-desktop-layout.tsx"
    - `src/components/challenges/playground/PlaygroundGoalBar.tsx" -> "src/components/challenges/playground/playground-goal-bar.tsx"
    - `src/components/challenges/playground/PlaygroundHeader.tsx" -> "src/components/challenges/playground/playground-header.tsx"
    - `src/components/challenges/playground/PlaygroundMobileLayout.tsx" -> "src/components/challenges/playground/playground-mobile-layout.tsx"
    - `src/components/challenges/playground/PracticeModeBanner.tsx" -> "src/components/challenges/playground/practice-mode-banner.tsx"
    - `src/components/challenges/playground/ResetConfirmDialog.tsx" -> "src/components/challenges/playground/reset-confirm-dialog.tsx"
    - `src/components/challenges/playground/ResultsPanel.tsx" -> "src/components/challenges/playground/results-panel.tsx"
    - `src/components/challenges/playground/SelectorPanel.tsx" -> "src/components/challenges/playground/selector-panel.tsx"
    - `src/components/challenges/preview/IframeContainer.tsx" -> "src/components/challenges/preview/iframe-container.tsx"
    - `src/components/challenges/preview/PreviewFooter.tsx" -> "src/components/challenges/preview/preview-footer.tsx"
    - `src/components/challenges/preview/PreviewHeader.tsx" -> "src/components/challenges/preview/preview-header.tsx"
    - `src/components/challenges/SelectorInput.tsx" -> "src/components/challenges/selector-input.tsx"
    - `src/components/challenges/TestResults.tsx" -> "src/components/challenges/test-results.tsx"
    - `src/components/challenges/TierSkipTip.tsx" -> "src/components/challenges/tier-skip-tip.tsx"
    - `src/components/challenges/WebComponentPreview.tsx" -> "src/components/challenges/web-component-preview.tsx"
    - `src/components/CodeBlock.tsx" -> "src/components/code-block.tsx"
    - `src/components/CookieConsent.tsx" -> "src/components/cookie-consent.tsx"
    - `src/components/DefaultErrorComponent.tsx" -> "src/components/default-error-component.tsx"
    - `src/components/Footer.tsx" -> "src/components/footer.tsx"
    - `src/components/gamification/AchievementBadge.tsx" -> "src/components/gamification/achievement-badge.tsx"
    - `src/components/gamification/LevelUpNotification.tsx" -> "src/components/gamification/level-up-notification.tsx"
    - `src/components/gamification/XPProgressBar.tsx" -> "src/components/gamification/xp-progress-bar.tsx"
    - `src/components/Header.tsx" -> "src/components/header.tsx"
    - `src/components/I18nProvider.tsx" -> "src/components/i18n-provider.tsx"
    - `src/components/LanguageSwitcher.tsx" -> "src/components/language-switcher.tsx"
    - `src/components/MarkdownRenderer.tsx" -> "src/components/markdown-renderer.tsx"
    - `src/components/NotFound.tsx" -> "src/components/not-found.tsx"
    - `src/components/OgImageTemplate.tsx" -> "src/components/og-image-template.tsx"
    - `src/components/PlaywrightDemo.tsx" -> "src/components/playwright-demo.tsx"
    - `src/components/SelectorDemo.tsx" -> "src/components/selector-demo.tsx"
    - `src/components/Spinner.tsx" -> "src/components/spinner.tsx"
    - `src/components/tutorials/TableOfContents.tsx" -> "src/components/tutorials/table-of-contents.tsx"
    - `src/components/UserMenu.tsx" -> "src/components/user-menu.tsx"

### 3. Update Imports
- **Task**: Global search and replace for all renamed component paths.
- **Tools**: Use `grep` to find occurrences and `replace` (or `sed` via shell) to update them.

## Verification & Testing
- Run `bun run dev` to ensure the application still loads correctly.
- Run `bun run test` to verify that unit tests still pass.
- Check one or two routes manually to ensure components are rendering.
- Verify that `GEMINI.md` and `AGENTS.md` now correctly describe the implementation.
