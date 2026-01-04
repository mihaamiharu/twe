# ADR-001: TanStack Start Framework

**Date:** 2025-12-01  
**Status:** Accepted

## Context

We need a modern, full-stack React framework to build the TestingWithEkki platform. The platform requires server-side rendering (SSR) for SEO (tutorials), fast client-side navigation (SPA feel), and type-safe routing.

## Options Considered

1. **Next.js (App Router)**: The industry standard. Powerful but complex, heavy, and moved away from standard web APIs.
2. **Remix**: Excellent web standards focus, but uncertainty after React Router merger news.
3. **TanStack Start**: New contender, built on TanStack Router. Offers robust type-safety and leverages the TanStack ecosystem (Query, Form, Table) which we already plan to use.
4. **Vite (SPA Only)**: Simple, but poor SEO for tutorials without complex workarounds.

## Decision

We chose **TanStack Start**.

## Consequences

### Positive

- **Type-Safe Routing**: Best-in-class type safety for routes, params, and search params.
- **Server Functions**: Easy RPC-like server communication without manually defining API routes.
- **Unified Ecosystem**: Integration with TanStack Query and other TanStack libraries is seamless.
- **Performance**: Built on Vite, offering excellent dev server performance.

### Negative

- **Maturity**: It is a newer framework compared to Next.js, so community resources and third-party integrations are fewer.
- **Breaking Changes**: As it stabilizes, minor breaking changes might occur.
