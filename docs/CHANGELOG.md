# Changelog

All notable changes to the TestingWithEkki project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Recent Activity**: Fixed an issue where duplicate submissions for the same challenge clogged the feed, and increased fetch limit to reveal older unique activities.

### Added (Previous)

- Comprehensive documentation: ERD, ADRs, Glossary.
- Detailed database schema for User, Content, and Progress domains.

## [0.2.0] - 2025-12-25

### Added

- **Gamification System**: XP, Levels, and Achievements.
- **Leaderboards**: Global and monthly rankings.
- **Bug Reporting**: In-app bug reporting tool.
- Database seeding scripts for all content tiers (Basic to Expert).

### Changed

- Migrated authentication to BetterAuth v1.1.
- Updated challenge executor to support async/await patterns properly.

## [0.1.0] - 2025-12-01

### Added

- Initial release of the platform.
- **Playground**: Monaco Editor with client-side Playwright shim.
- **Tutorials**: Markdown-based tutorial rendering.
- **Authentication**: Email/Password and Google OAuth.
- **Tech Stack**: TanStack Start, Drizzle ORM, Tailwind CSS.
