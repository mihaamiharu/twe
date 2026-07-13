# TestingWithEkki — Cozy Quest Learning Redesign

## 1. Brand Decision

Keep the primary brand name:

# **TestingWithEkki**

The name is still relevant because it clearly communicates:

- The subject: software testing
- The creator-led nature of the platform
- A personal learning experience
- Room for tutorials, challenges, content, mentoring, automation, and AI-assisted testing

The new visual theme should become the **world and experience of TestingWithEkki**, not replace the brand.

### Recommended brand structure

**Primary brand**

> TestingWithEkki

**Descriptor**

> Learn modern software testing through guided paths and practical challenges.

**Possible experience names**

- The Testing Journey
- Testing Field Guide
- Software Testing Quest

Example:

> **TestingWithEkki**  
> Explore software testing through concepts, practice, and real-world quests.

---

## 2. Target Design Direction

### Theme name

# **Cozy Quest Learning**

### Style composition

- 60% modern gamified learning interface
- 25% illustrated storybook
- 15% cozy fantasy / cottagecore

The website should still feel like a credible technical education platform.

It should **not** look like:

- A children’s game
- A full medieval RPG
- A generic fantasy template
- A heavily textured parchment website
- A decorative site that sacrifices technical readability

---

## 3. Core Design Principles

### Brand atmosphere

The website should feel:

- Warm
- Thoughtful
- Adventurous
- Technical
- Personal
- Calm
- Structured

The visual world can be inspired by:

- Field journals
- Illustrated maps
- Nature
- Exploration
- Quests
- Learning paths
- Stamps
- Badges
- Travel journals

### Technical-content rule

Fantasy and storybook styling should support the learning experience, not replace the technical interface.

Code blocks, editors, tables, diagrams, forms, filters, and documentation should remain:

- Clean
- Modern
- High contrast
- Easy to scan
- Free from distracting texture

---

## 4. Visual System

### Typography

Use three clear typography roles.

#### Display headings

Use a readable storybook serif such as:

- Fraunces
- Lora
- Source Serif
- Libre Baskerville

Use this only for:

- Hero headings
- Major page titles
- Section titles
- Important editorial statements

#### Body and interface

Keep a clean sans-serif such as:

- Outfit
- Inter
- Manrope
- Source Sans 3

Use this for:

- Paragraphs
- Navigation
- Buttons
- Forms
- Cards
- Metadata
- Tutorials

#### Code and technical metadata

Keep a monospace font such as:

- Fira Code
- JetBrains Mono
- IBM Plex Mono

### Suggested color palette

```css
--background: #F7F2E7;
--surface: #FFFDF7;
--surface-muted: #EAE3D5;

--text-primary: #2D2A24;
--text-secondary: #6F695E;

--forest: #526A4A;
--teal: #5F918B;
--gold: #C8A35D;
--clay: #B77A61;

--border: #CFC4AE;
--success: #668458;
--danger: #A45E55;
```

These values can be adjusted for accessibility and compatibility with the existing theme system.

### UI treatment

Use:

- Warm paper-like page backgrounds
- Cream cards
- Soft borders
- Restrained shadows
- Illustrated landscapes in hero sections and empty states
- Botanical ornaments
- Map-inspired details
- Progress trails
- Stamps
- Badges
- Quest markers
- Small decorative textures

Avoid:

- Excessive gradients
- Heavy glassmorphism
- Strong glow effects
- Large areas of parchment texture
- Decorative fonts for body text
- Fantasy terminology that hides the actual feature
- Low-contrast beige-on-beige interfaces

---

## 5. Information and Feature Mapping

Fantasy labels should act as supporting language. Technical meaning should remain clear.

| Current feature | Redesigned concept |
|---|---|
| Tutorials | Field Guide |
| Challenges | Quest Board |
| Learning tracks | Adventure Paths |
| Curriculum stages | Journey Regions |
| Dashboard | Adventure Journal |
| Achievements | Badges or Relics |
| Leaderboard | Hall of Testers |
| Daily activity | Daily Quest |
| Progress | Journey Progress |
| Profile | Tester Profile |
| XP | Experience |

Keep technical names unchanged, including:

- Software Testing
- Test Design
- API Testing
- Web Testing
- Mobile Testing
- Playwright
- Automation
- AI-Assisted Testing

Example:

> **Quest Board**  
> Practical software testing challenges

This is better than replacing the term entirely with an unclear fantasy phrase.

---

## 6. Proposed Page Redesign

### Homepage

The homepage should introduce TestingWithEkki as a guided software-testing journey.

Suggested sections:

1. Illustrated hero
2. Primary CTA to start learning
3. Secondary CTA to browse the Field Guide
4. Learning statistics
5. Adventure Path / curriculum map
6. Featured quests
7. Learning philosophy
8. Community or progress highlights
9. Final CTA

Possible hero copy:

> **Your Adventure in Software Testing**  
> Learn concepts, practise with real challenges, and build confidence step by step.

### Tutorials list

Present tutorials as the **Field Guide**.

Suggested layout:

- Page title and illustrated header
- Search
- Topic filters
- Difficulty filters
- Learning-progress filters
- Category sidebar on desktop
- Tutorial cards or rows
- Clear completion status
- Bookmark state
- Estimated reading time

Keep the layout practical and information-dense.

### Tutorial detail

Use a clean reading layout.

Suggested structure:

- Breadcrumb
- Tutorial title
- Topic and difficulty
- Reading time
- Progress
- Main article
- Table of contents
- Code blocks
- Notes or checkpoints
- Related tutorials
- Next step

Decorative styling should remain outside the main reading surface.

### Challenges list

Present challenges as the **Quest Board**.

Suggested components:

- Topic filters
- Difficulty filters
- Completion filters
- XP rewards
- Challenge cards
- Bookmark state
- Progress state
- Estimated time
- Required knowledge

### Challenge detail

Present challenge detail as a focused quest page.

Suggested structure:

- Quest title
- Description
- Scenario
- Objective
- Requirements
- Progress
- Reward
- Technical workspace
- Validation result
- Hints
- Solution or explanation

The technical workspace must remain modern and free from decorative textures.

### Dashboard

Present the dashboard as the **Adventure Journal**.

Suggested widgets:

- Current level
- XP
- Completed quests
- Learning streak
- Badges
- Active learning paths
- Daily quest
- Recent achievements
- Recommended next step
- Saved tutorials
- Progress by topic

### Leaderboard

Present the leaderboard as the **Hall of Testers**.

Keep:

- Clear rankings
- Time filters
- XP
- Completed challenges
- Streaks
- User profile links

Use trophies, badges, and rank markers sparingly.

### About page

Keep the About page personal and professional.

The storybook theme can appear in:

- Section dividers
- Timeline markers
- Illustrations
- Career journey layout
- Personal values

Do not turn the professional history into RPG character lore.

---

## 7. Reusable Component Ideas

Possible reusable primitives:

- `PageContainer`
- `SectionHeading`
- `QuestCard`
- `TutorialCard`
- `ProgressTrail`
- `Badge`
- `Relic`
- `StatPill`
- `IllustratedPanel`
- `PaperSurface`
- `TechnicalSurface`
- `EmptyState`
- `CTAButton`
- `JourneyMap`
- `AchievementStamp`
- `TopicTag`

### Surface distinction

Use at least two main surface types.

#### PaperSurface

For:

- Marketing sections
- Progress cards
- Quest summaries
- Illustrated content
- Achievements

#### TechnicalSurface

For:

- Code
- Tables
- Forms
- Editors
- Logs
- Technical exercises
- Detailed tutorial content

This prevents the fantasy theme from making technical areas difficult to use.

---

## 8. Accessibility Requirements

The redesign should:

- Meet WCAG AA contrast where practical
- Preserve visible keyboard focus
- Support keyboard navigation
- Respect reduced-motion preferences
- Provide accessible labels for icons
- Avoid text embedded inside important illustrations
- Avoid low-contrast decorative text
- Preserve clear heading hierarchy
- Maintain usable touch targets
- Keep mobile navigation simple
- Avoid relying on color alone for state

---

## 9. Dark Theme Direction

The dark theme can be presented as a:

# **Night Camp**

Possible characteristics:

- Deep charcoal or dark forest background
- Warm cream text
- Muted green surfaces
- Low-intensity gold highlights
- Lantern-inspired accent lighting
- Minimal texture
- Clean technical panels

Avoid turning dark mode into a black-and-gold medieval interface.

---

## 10. Engineering Constraints

The implementation should:

- Preserve current routes
- Preserve localization
- Preserve SEO metadata
- Preserve authentication
- Preserve analytics
- Preserve application behaviour
- Preserve responsive behaviour
- Reuse existing components where practical
- Avoid unnecessary architecture rewrites
- Avoid large dependencies unless justified
- Avoid modifying generated files
- Keep existing tests
- Respect repository conventions
- Avoid commits or pushes unless explicitly requested

---

## 11. Recommended Rollout

Do not redesign the entire platform in one pass.

### Phase 1 — Foundation and homepage

- Design tokens
- Typography
- Shared background
- Header
- Footer
- Core reusable primitives
- Homepage

### Phase 2 — Field Guide

- Tutorials list
- Search
- Filters
- Tutorial cards
- Tutorial detail
- Reading layout
- Code blocks
- Table of contents

### Phase 3 — Quest Board

- Challenge list
- Filters
- Challenge cards
- Challenge detail
- Progress
- Validation states
- Technical workspace

### Phase 4 — Adventure Journal

- Dashboard
- XP
- Levels
- Achievements
- Profile
- Learning paths
- Daily quests

### Phase 5 — Supporting pages

- Leaderboard
- About page
- Empty states
- Error pages
- Authentication pages

### Phase 6 — Final polish

- Dark theme
- Responsive refinement
- Accessibility audit
- Visual regression tests
- Performance review
- Cross-browser review

---

# Codex Prompts

## Prompt 1 — Audit and Planning

Use this in a new Codex thread inside the existing TestingWithEkki repository.

Attach:

- The original Side Quests screenshot
- The four-style UI reference image
- The TestingWithEkki redesign mockup
- Current screenshots of the homepage, tutorials, challenges, dashboard, and leaderboard when available

Start in Plan mode.

```text
I want to redesign the existing TestingWithEkki website into a new visual theme.

Project:
TestingWithEkki is a software-testing learning platform containing tutorials,
technical challenges, progress tracking, XP, achievements, leaderboards, code
examples, localization, and personal-brand content.

Reference direction:
Use the attached images as visual references, not as layouts to copy exactly.

Target theme:
“Cozy Quest Learning”

Style composition:
- 60% modern gamified learning dashboard
- 25% illustrated storybook
- 15% cozy fantasy / cottagecore

The final product must still feel like a credible technical education platform.
It must not look like a children’s game, generic fantasy template, or full
medieval RPG interface.

Goal:
Audit the existing repository and produce a detailed redesign plan before
changing any code.

First inspect:
- Current framework, dependencies, routing, and component structure
- Existing design tokens and global styles
- Homepage structure
- Tutorials and tutorial-detail pages
- Challenges and challenge-detail pages
- Dashboard and progress UI
- Leaderboard
- About page
- Header, footer, mobile navigation, and dark mode
- Localization and the /en route structure
- Code editor, code blocks, tables, forms, filters, dialogs, and states
- Existing tests, linting, build commands, and visual-test setup

Design requirements:

1. Brand and atmosphere
- Warm, adventurous, thoughtful, and technical
- Inspired by field journals, illustrated maps, nature, exploration, and quests
- Avoid dark medieval styling, excessive parchment, ornamental clutter,
  childish illustrations, and low-contrast text

2. Typography
- Storybook-style serif only for display headings
- Clean sans-serif for body text and UI
- Monospace for code and technical metadata
- Maintain strong readability in long tutorials

3. Suggested palette
- Background: #F7F2E7
- Surface: #FFFDF7
- Muted surface: #EAE3D5
- Primary text: #2D2A24
- Secondary text: #6F695E
- Forest: #526A4A
- Teal: #5F918B
- Gold: #C8A35D
- Clay: #B77A61
- Border: #CFC4AE

You may adjust these values for accessibility and compatibility with the
existing theme system.

4. Experience mapping
- Tutorials may be presented as a Field Guide
- Challenges may be presented as a Quest Board
- Curriculum tracks may become Adventure Paths
- Dashboard may resemble an Adventure Journal
- Achievements may resemble badges or relics
- Leaderboard may be presented as the Hall of Testers
- Progress may use trails, map markers, stamps, and journey indicators

Keep technical names such as API Testing, Test Design, Playwright, Automation,
and Software Testing unchanged.

5. Technical-content rules
- Code blocks, editors, tables, technical diagrams, and forms must stay clean
  and modern
- Do not apply paper textures behind code
- Do not sacrifice readability for theme
- Do not hide information inside decorative interactions
- Do not make essential navigation rely on fantasy terminology alone

6. Engineering constraints
- Preserve current routes, content, localization, SEO metadata, authentication,
  analytics, and application behaviour
- Preserve responsive behaviour
- Avoid unnecessary architecture rewrites
- Reuse existing components where practical
- Avoid adding large dependencies unless clearly justified
- Do not modify generated files
- Do not remove existing tests
- Respect the repository’s current conventions
- Do not commit or push anything

7. Accessibility
- Meet WCAG AA contrast where practical
- Maintain visible focus states
- Respect reduced-motion preferences
- Support keyboard navigation
- Provide accessible labels for decorative and functional icons
- Avoid text embedded inside important illustrations

Deliverables for this planning phase:
A. Summary of the current frontend architecture
B. Inventory of pages and shared components affected
C. Current visual-design problems and inconsistencies
D. Proposed information architecture changes, if any
E. Proposed design-token system
F. Component-by-component redesign proposal
G. Responsive and accessibility strategy
H. Dark-theme strategy, preferably a “night camp” variant
I. Implementation phases ordered from lowest to highest risk
J. Exact files expected to change in Phase 1
K. Risks, assumptions, and questions that require my decision

Do not edit any files yet.

After presenting the plan, wait for my approval.
```

---

## Prompt 2 — Implement Phase 1

Use this only after reviewing and approving the Codex audit.

```text
Proceed with Phase 1 only.

Phase 1 scope:
- Add or update the global design tokens
- Implement typography foundations
- Redesign the shared page background
- Redesign header and footer
- Create reusable themed primitives
- Redesign the homepage only
- Preserve all existing homepage content and behaviour
- Do not redesign internal tutorial or challenge pages yet

Reusable primitives should include, where appropriate:
- PageContainer
- SectionHeading
- QuestCard
- ProgressTrail
- Badge or Relic
- StatPill
- IllustratedPanel
- PaperSurface
- TechnicalSurface
- EmptyState
- CTAButton

Visual rules:
- Decorative texture must be subtle
- Use CSS styling before introducing image assets
- Keep illustrations optional and replaceable
- Technical components must remain clean
- Avoid excessive gradients, glows, or glassmorphism
- Avoid copying the reference screenshot literally

Implementation process:
1. Inspect relevant files again.
2. Explain the intended changes briefly.
3. Implement Phase 1.
4. Run formatting, linting, type checks, tests, and production build.
5. Run the application locally when possible.
6. Review desktop and mobile layouts.
7. Fix regressions discovered during verification.
8. Summarize changed files, verification results, and remaining issues.

Do not commit or push.
Stop after Phase 1 so I can review the result.
```

---

## Prompt 3 — Implement the Field Guide

```text
Proceed with Phase 2 only: Field Guide.

Scope:
- Redesign the tutorials catalogue
- Redesign tutorial cards or list rows
- Redesign search, filters, category navigation, and progress states
- Redesign the tutorial-detail reading layout
- Add a clean table of contents
- Preserve all existing tutorial content, routes, metadata, localization, and behaviour
- Keep code blocks and technical content inside clean TechnicalSurface components
- Do not redesign challenges or the dashboard yet

Requirements:
- Use the approved Cozy Quest Learning design system
- Use storybook serif only for major headings
- Keep body text highly readable
- Do not place paper texture behind code
- Preserve bookmarks, completion states, links, and navigation
- Ensure the mobile tutorial layout remains practical
- Verify long-form content, code blocks, tables, lists, callouts, and overflow states

Process:
1. Inspect all relevant tutorial files and components.
2. Explain the planned changes.
3. Implement the phase.
4. Run formatting, linting, type checks, tests, and production build.
5. Review desktop and mobile layouts.
6. Fix regressions.
7. Summarize changes and remaining issues.

Do not commit or push.
Stop after Phase 2.
```

---

## Prompt 4 — Implement the Quest Board

```text
Proceed with Phase 3 only: Quest Board.

Scope:
- Redesign the challenges catalogue
- Redesign challenge cards
- Redesign challenge filters and status indicators
- Redesign challenge-detail pages
- Redesign quest progress, rewards, difficulty, prerequisites, and completion states
- Preserve all current challenge logic, validation, routes, content, localization, and behaviour
- Keep technical workspaces, editors, logs, and validation output modern and clean
- Do not redesign the dashboard or leaderboard yet

Requirements:
- Use clear supporting labels such as “Quest Board” and “Testing Challenges”
- Do not hide technical meaning behind fantasy terms
- Keep completion, locked, active, failed, and passed states distinguishable without relying on color alone
- Keep code, tables, and validation output inside TechnicalSurface components
- Verify empty states, loading states, error states, and mobile behaviour

Process:
1. Inspect all challenge-related files.
2. Explain the planned changes.
3. Implement the phase.
4. Run formatting, linting, type checks, tests, and production build.
5. Review desktop and mobile layouts.
6. Fix regressions.
7. Summarize changes and remaining issues.

Do not commit or push.
Stop after Phase 3.
```

---

## Prompt 5 — Implement Adventure Journal and Hall of Testers

```text
Proceed with Phase 4 and Phase 5 only.

Scope:
- Redesign the dashboard as the Adventure Journal
- Redesign XP, levels, streaks, achievements, badges, and learning paths
- Redesign the user profile
- Redesign the leaderboard as the Hall of Testers
- Redesign the About page
- Preserve all current data, logic, routes, localization, SEO metadata, and behaviour

Dashboard requirements:
- Current level
- XP progress
- Completed quests
- Learning streak
- Active learning paths
- Daily quest
- Recent achievements
- Recommended next step
- Saved tutorials

Leaderboard requirements:
- Clear rankings
- Time filters
- XP
- Completed challenges
- Streaks
- Current-user highlighting
- Accessible ranking indicators

About-page requirements:
- Remain professional and personal
- Use the journey metaphor only as a visual framework
- Do not rewrite career history as fantasy character lore

Process:
1. Inspect relevant files.
2. Explain the planned changes.
3. Implement the phase.
4. Run formatting, linting, type checks, tests, and production build.
5. Review desktop and mobile layouts.
6. Fix regressions.
7. Summarize changes and remaining issues.

Do not commit or push.
Stop after these phases.
```

---

## Prompt 6 — Final Polish

```text
Proceed with the final polish phase.

Scope:
- Complete the Night Camp dark theme
- Audit responsive behaviour across all redesigned pages
- Audit accessibility
- Audit visual consistency
- Add or update visual regression tests where appropriate
- Review performance and asset loading
- Review cross-browser behaviour
- Fix inconsistent spacing, typography, borders, shadows, and states

Accessibility checks:
- Color contrast
- Focus visibility
- Keyboard navigation
- Screen-reader labels
- Heading hierarchy
- Reduced motion
- Touch targets
- Form labels
- Error states
- State communication without relying on color alone

Performance checks:
- Image dimensions and formats
- Lazy loading
- Font loading
- Bundle impact
- Avoid unnecessary dependencies
- Avoid large decorative assets where CSS or SVG is sufficient

Verification:
- Formatting
- Linting
- Type checks
- Tests
- Production build
- Desktop review
- Tablet review
- Mobile review
- Light theme
- Dark theme

Summarize:
- Final changed files
- Verification results
- Accessibility findings
- Performance findings
- Remaining known issues
- Recommended future improvements

Do not commit or push.
```

---

## 12. Optional `AGENTS.md` Instruction

Add this only after the visual direction is approved.

```md
## TestingWithEkki design direction

The product uses the “Cozy Quest Learning” visual system:

- Modern technical learning product first
- Illustrated storybook and cozy-fantasy elements second
- Display serif for major headings only
- Sans-serif for body and interface text
- Monospace for code and technical metadata
- Warm cream surfaces, forest/teal accents, restrained gold details
- Decorative styling must never reduce technical readability
- Code, tables, forms, and editors use clean TechnicalSurface components
- Preserve accessibility, responsive behaviour, localization, and SEO
- Avoid full medieval RPG styling, excessive parchment, or childish visuals
```

---

## 13. How to Refer to This Plan Later

Suggested phrases:

> Follow `testingwithekki-cozy-quest-redesign-plan.md`.

> Continue with Phase 2 from the Cozy Quest Learning redesign plan.

> Review the repository against the design principles in the redesign plan before editing files.

> Use the approved Cozy Quest Learning tokens and component rules from the redesign plan.

> Do not redesign outside the current phase defined in the redesign plan.
