# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-03

### Added

- **UI Redesign**: Implemented a "Modern/Premium" aesthetic for the Admin Challenges page with glassmorphism, gradient text, and animations.
- **Recent Activity**: Added a new vertical timeline design to the Profile page, replacing the basic list view.
- **Animations**: Integrated `framer-motion` for smooth entrance and interactivity in Admin tables and lists.

### Changed

- **Database Seeding**: Enhanced `seed.ts` to perform a deep cleanup of `challenges` and `testCases` tables before seeding, ensuring removal of legacy data.
- **User Settings**: Improved defensive coding in `user.fn.ts` to prevent crashes when user data (like stats or activity) is missing or empty.
- **Profile Page**: Simplified the "Submission Activity" section by removing the Heatmap component.

### Removed

- **Legacy Components**: Removed `ActivityHeatmap.tsx` and its associated data fetching logic.
- **Legacy Challenges**: Removed obsolete challenges "CSS Help", "XPath Master", and "JS Intro" from the database and seed scripts.
- **Unused Code**: Removed `heatmapData` type definitions and logic from the backend.

### Fixed

- **Crash**: Fixed an issue where the Settings/Profile page would crash for new users with no activity data.
- **Readability**: Improved text contrast for achievement badges in the Success Dialog.
