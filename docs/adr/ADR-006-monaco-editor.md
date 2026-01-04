# ADR-006: Monaco Editor Integration

**Date:** 2025-12-10  
**Status:** Accepted

## Context

The core value proposition of the platform is the coding playground. Users need a rich code editing experience that feels like a professional IDE (VS Code).

## Options Considered

1. **Monaco Editor**: The code editor that powers VS Code.
   - *Pros:* IntelliSense, minimap, syntax highlighting, validation, familiar shortcuts.
   - *Cons:* Heavy bundle size.
2. **CodeMirror**: Lightweight, extensible.
   - *Pros:* Smaller footprint.
   - *Cons:* Setup for "IDE-like" features (IntelliSense) is complex.
3. **Ace Editor**: Older, stable.
   - *Cons:* Handles modern features less well than Monaco.

## Decision

We chose **Monaco Editor** (`@monaco-editor/react`).

## Consequences

- **User Experience**: Users get a top-tier editing experience with TypeScript autocompletion out of the box.
- **Performance**: We must use lazy loading or specific Vite plugins to ensure the heavy editor code doesn't block initial page load.
- **Complexity**: Setting up custom type definitions for our "Playwright Shim" requires configuring the Monaco language service.
