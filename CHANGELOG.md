# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-09-01

### Added

- **Rebrand v1**: Introduced a refreshed TestingWithEkki product experience across the shared shell, homepage, account, profile, about, contact, Labs, leaderboard, and empty states.
- **Learn and Practice**: Added guided curriculum modules, URL-driven discovery and filtering, progress tracking, completion rewards, practice preview mode, and a focused practice workspace.
- **Web Automation Curriculum**: Added a comprehensive bilingual curriculum refresh with clearer lesson structure, visual learning aids, runnable examples, and aligned practice challenges.
- **Practice Grading**: Added runtime traces, source-policy checks, evidence-based validation, and TypeScript-aware grading for practice challenges.
- **UI Redesign**: Implemented a "Modern/Premium" aesthetic for the Admin Challenges page with glassmorphism, gradient text, and animations.
- **Recent Activity**: Added a new vertical timeline design to the Profile page, replacing the basic list view.
- **Animations**: Integrated `framer-motion` for smooth entrance and interactivity in Admin tables and lists.

### Changed

- **Public Learning Architecture**: Replaced the legacy public Tutorials and Challenges catalogs with the unified Learn and Practice routes.
- **Practice Workspace**: Refined the multi-file editor, preview flow, mobile layouts, network recovery, reduced-motion behavior, and execution feedback.
- **Release Operations**: Added guarded production curriculum reset and synchronization tooling for the Curriculum v2 rollout.
- **Database Seeding**: Enhanced `seed.ts` to perform a deep cleanup of `challenges` and `testCases` tables before seeding, ensuring removal of legacy data.
- **User Settings**: Improved defensive coding in `user.fn.ts` to prevent crashes when user data (like stats or activity) is missing or empty.
- **Profile Page**: Simplified the "Submission Activity" section by removing the Heatmap component.

### Removed

- **Legacy Learning Assets**: Retired obsolete tutorial illustrations and the former public Tutorials and Challenges catalog surfaces during the Learn/Practice migration.
- **Legacy Components**: Removed `ActivityHeatmap.tsx` and its associated data fetching logic.
- **Legacy Challenges**: Removed obsolete challenges "CSS Help", "XPath Master", and "JS Intro" from the database and seed scripts.
- **Unused Code**: Removed `heatmapData` type definitions and logic from the backend.

### Fixed

- **Practice Grading**: Hardened capstone and evidence-based grading against bypasses and improved recovery from failed execution paths.
- **Release Readiness**: Improved mobile and responsive behavior, leaderboard alignment, SEO coverage, and cross-locale end-to-end test coverage.
- **Crash**: Fixed an issue where the Settings/Profile page would crash for new users with no activity data.
- **Readability**: Improved text contrast for achievement badges in the Success Dialog.
