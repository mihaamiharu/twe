# TestingWithEkki Rebrand V1 — Phase 0 Baseline

This document records the current product and data boundaries that the Rebrand V1 implementation must preserve. It is an implementation guardrail, not a new curriculum or product specification.

Baseline branch: `main` at `a8763ec` (`Chore/typescript ci hardening (#204)`).

## Product route boundaries

- `/$locale/tutorials` is the existing tutorial library and remains the technical route for the public Learn surface.
- `/$locale/tutorials/$slug` renders a lesson and owns reading progress, completion, related challenges, and next-lesson behavior.
- `/$locale/challenges` is the existing standalone Practice library.
- `/$locale/challenges/$slug` is the interactive challenge workspace.
- `/$locale/profile` is authenticated and currently exposes aggregate user progress, XP, achievements, and activity.
- There is currently no Labs route or explicit Learning Path route.

Public labels may change during the rebrand while these URLs remain compatible.

## Content and data boundaries

### Filesystem content

- Tutorial ordering and lesson metadata come from `tutorials/registry.json` and lesson content files.
- Challenge content comes from the JSON files under `content/challenges/`.
- The current content sources are authoritative for what exists today.

The registry has ordered tutorials and related challenges, but it does not define an approved module/path model, current learning position, lock state, or new curriculum counts.

### Database state

Database-backed state includes:

- authentication/session data
- tutorial and challenge records synchronized from content
- user tutorial reading/completion progress
- challenge completion and submissions
- XP, levels, achievements, and recent activity
- contact messages and newsletter subscribers

Rebrand UI must read these existing data boundaries rather than introducing display-only statistics.

## Behavior to preserve

- Public users can browse tutorials and challenges without signing in.
- Authenticated routes use the existing BetterAuth session and middleware boundaries.
- Tutorial completion continues through the existing server function and achievement flow.
- Practice URL state continues to represent search, track, completion visibility, view mode, and tier filters.
- Challenge execution remains client-side where it is today.
- Challenge submission continues to distinguish Practice mode from first completion.
- First completion remains the source of XP, level-up, achievement, and progress updates.
- Existing query invalidation and cache behavior remains intact.

## Approved rebrand constraints

- Warm editorial surfaces are for reading, discovery, learning, Practice browsing, Labs, About, Contact, and Profile.
- The actual challenge workspace remains explicitly dark and technical.
- Instrument Sans is the primary family; IBM Plex Mono is the technical family.
- The palette, geometry, spacing, motion, and reduced-motion requirements come from `twe-rebrand-spec-v1.md`.
- Curriculum labels, lesson counts, durations, locks, path progress, and future products must come from approved real data or remain unspecified.

## Known gaps intentionally deferred

- Learning Path modules and current-position data are not modeled yet.
- Smart Continue Learning is deferred until reliable current-position data exists.
- Contact Topic requires schema/server support and may remain deferred while the working contact flow is redesigned.
- Labs begins as a static Coming Soon surface only.
- Existing hardcoded or stale visible statistics must be removed or replaced when their surfaces are touched.

## Phase boundary

Phase 0 documents the baseline and contracts. Phase 1 may introduce shared design tokens, typography, global surface treatment, primitive styling, reduced-motion behavior, and the route-scoped workspace foundation. Navigation, footer, homepage, Learn, Practice, Labs, About, Contact, Profile, and user-menu product changes belong to later phases.
