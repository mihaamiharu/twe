# Gap Analysis: TestingWithEkki vs. Target References

**Date:** January 2, 2026
**Target References:** LeetCode, Linear, Exercism, Playwright Try

This document analyzes the current implementation of TestingWithEkki (TWE) against the desired "Premium/Dark Mode" aesthetic and functional benchmarks.

## 1. User Interface & Layout

### Challenge Playground (Reference: LeetCode)

| Feature         | Current Implementation            | Target State (Reference)    | Gap / Action Item                                                                                |
| --------------- | --------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Split Pane**  | Static 50/50 Grid (`grid-cols-2`) | Resizable Split Panes       | **High**: Implement `react-resizable-panels` to allow users to resizing the editor/instructions. |
| **Output View** | List of Test Results (Pass/Fail)  | Tabbed Console / Test Cases | **Medium**: Add a "Console" tab to view raw `console.log` output for debugging.                  |
| **Mobile View** | Tabs (Instructions/Preview)       | Responsive Stack            | Current mobile tabs are good, but verify vertical stacking for Editor/Results.                   |

### Dashboard & Tracks (Reference: Exercism)

| Feature         | Current Implementation               | Target State (Reference)               | Gap / Action Item                                                                                       |
| --------------- | ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Progression** | Flat Grid of Tutorials               | Structured "Tracks" (e.g., "Web Path") | **Medium**: Visually group content into "Tracks" or "Syllabus" rather than a loose collection of cards. |
| **Visuals**     | "Glass Cards" with Brutalist borders | Clean, Minimal Track Cards             | **Medium**: Remove heavy borders from cards; use subtle gradients and progress bars.                    |

## 2. Design System & Aesthetics

### Visual Identity (Reference: Linear / Vercel)

**Current State:** "Soft Brutalism"

- Heavy Borders: `border-2 border-black` (even in dark mode).
- Hard Shadows: `box-shadow: 2px 2px 0px`.
- High Contrast: Pure Black/White elements.

**Target State:** "Modern Premium" (Linear-like)

- **Borders:** Subtle, 1px alpha-blended borders (e.g., `border-white/10`).
- **Shadows:** Soft glow or diffuse shadows (e.g., `shadow-xl shadow-brand/5`).
- **Colors:** "50 Shades of Grey" (Slate 900 to Slate 50), avoiding pure black.

**The Conflict:** The project explicitly adopted "Soft Brutalism" recently. Moving to "Linear Style" requires a significant rollback of the `styles.css` and component classes (removing `hard-shadow`, `border-2`).

**Recommendation:**
Shift towards **"Refined Industrial"**—keep the _layout_ strict (like Brutalism) but refine the _interactivity_ and _borders_ to be thinner and cleaner (like Linear).

- Change `border-2` -> `border`.
- Remove `hard-shadow` in Dark Mode.
- Use `zinc` or `slate` grays instead of strict B/W.

## 3. Editor Experience (Reference: Playwright Try / VS Code)

| Feature      | Current Implementation     | Target State (Reference)           | Gap / Action Item                                                                                                             |
| ------------ | -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Theme**    | Custom "Slate" Theme       | VS Code Default Dark / GitHub Dark | **Low**: Current theme is close, but could be polished to match GitHub Dark exactly for familiarity.                          |
| **Feedback** | Toast Notifications + List | Terminal-like Output               | **Medium**: Replicate the "Terminal" feel. Use a monospaced font for the results area with colored text (`formatted output`). |

## 4. Proposed Implementation Plan

1. **Layout Upgrade:**
   - Install `react-resizable-panels`.
   - Refactor `ChallengePlayground.tsx` to use resizable grouping.

2. **Design Refinement (The "Linear" Shift):**
   - Update `globals.css`:
     - Set `--border` to be subtle in dark mode.
     - Redefine `.glass-card` to use 1px borders and slight noise texture instead of 2px solid.
   - Component Cleanup: Remove `border-2` and `hard-shadow` classes from `Card`, `Button`, and `Badge` components.

3. **Console/Terminal Feature:**
   - Create a `ConsoleOutput` component.
   - Capture `console.log` from the executed code (in `challenge-executor.ts`) and display it.

4. **Track Visualization:**
   - Create a `TrackCard` component that groups related tutorials.
   - Update `src/routes/tutorials/index.tsx` to display tracks.
