# OG image migration — issue #250

Implemented on `release/cloudflare-migration`. Source generation is complete; PNG rendering, builds, runtime checks, visual comparison and CPU measurements are deferred to #256. This is implementation progress, not proof of Workers compatibility or Free-tier feasibility.

## Public image paths

The OG source manifest currently contains 222 distinct Home, default, Learn and Practice cards derived only from published editorial content in the two supported locales. Identical visible cards share an asset. Current SEO helpers select the matching `/og/<identity-hash>.png` path directly, so those image requests can be served by Static Assets without running the application.

The filename hashes the stable card identity, not the PNG bytes or title. A font/template/title edit updates the same identity's PNG. Consequently these images use a one-hour public cache rather than an immutable cache. The existing Bun static server already uses that policy for non-Vite assets; `public/_headers` specifies it for Workers Static Assets.

Existing `/api/og` query URLs remain supported. Known queries redirect to their static PNG; arbitrary queries use the dynamic renderer and return PNG, retaining the `title`, `type`, `difficulty` and `xp` behavior. Home type matching is case insensitive and still ignores the other card parameters. Empty/default parameters and zero XP retain their existing display meaning. The existing static-banner error fallback remains.

## Source generation versus rendering

`scripts/generate-og-assets.ts` has two explicit modes:

```sh
# Generates JSON source metadata and bundled font data; no image rendering.
bun run og:manifest

# Renders known PNGs into the ignored public/og directory.
bun run og:generate
```

Only the first mode was executed during implementation. It generated `src/lib/generated/og-catalog.json` (public card-key/path lookup) and `src/server/generated/og-resources.json` (server-only bundled font bytes). Do not edit these files by hand. Source-manifest paths are preparation for a subsequent asset build; a clean checkout does not yet contain their PNGs.

The Vite plugin generates images before public-directory copying, and watches editorial/template/resource changes during development. It serializes generation, writes images/manifests atomically, and uses fingerprints in ignored `.tanstack/og-images.json` to avoid unnecessary rendering. Missing output files are regenerated even if the fingerprint matches. It publishes the manifests only after all referenced PNGs are ready. The illustration is read only during build-time generation and is not embedded in the Worker resource manifest.

Content parsing and English fallback use the same frontmatter helper as the runtime catalog. No production database or user data is read. Font files come from the already installed Fontsource package; no Google Fonts or other network request is needed for rendering. Build failures stop the asset pipeline instead of publishing references to incomplete output.

## Runtime renderer selection

Package imports select separate implementations:

| Runtime                              | Layout                                                            | PNG                                                                  |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Build tools and existing Bun runtime | Existing `satori` 0.19.1                                          | Existing native `@resvg/resvg-js`                                    |
| Cloudflare `workerd`                 | Pinned `@cf-wasm/satori` 0.4.2, using its precompiled Yoga import | Pinned `@resvg/resvg-wasm` 2.6.2 with a static `.wasm` module import |

The Worker path does not select the native renderer or compile WASM from fetched/decoded bytes. Satori's ordinary bundled entry dynamically initializes WASM, so swapping only the PNG renderer would be insufficient. The Workers layout wrapper depends on Satori 0.32.0; its output must be visually compared with the legacy renderer. The existing React card templates were retained.

Dynamic requests use bundled WOFF font bytes, no filesystem reads and no font network calls. Resvg initializes once per isolate; image bytes are copied before WASM objects are freed. A per-isolate LRU retains at most 16 PNGs or 8 MiB, and identical simultaneous requests share their render promise. This cache is disposable performance state, not a globally consistent quota or rate limiter.

Known Home images are generated ahead of time, so their illustration need not enter the Worker bundle. The public lookup module contains only published card keys and paths; it must never import the server font/resource module or challenge solution snapshot.

## Deferred release checks

- Build from a clean checkout and confirm all 222 expected PNG assets are emitted/copied before deployment. Count the complete built assets and maximum file size against the selected plan's current limits.
- Verify full-product Worker resolution picks the `workerd` implementations and static WASM modules; verify no native renderer, runtime filesystem loader or Google Fonts fetch is in that graph.
- Compare Home/Learn/Practice and arbitrary dynamic cards across Bun/Workers, including font metrics, wrapping, Unicode text and 1200×630 PNG dimensions.
- Exercise legacy query defaults, case handling, zero XP, custom titles/types, redirects, failure fallback and crawler behavior. Update previous SEO expectations to account for static image URLs.
- Verify public/client bundles exclude server resources and challenge solutions; verify private dynamic responses and preview noindex headers remain correct.
- Verify empty-cache generation, source changes/new locale documents, watch-mode regeneration, deployment cache invalidation and existing card identity URL stability.
- Measure cold/warm CPU and memory for arbitrary dynamic rendering. Static common cards do not establish that arbitrary rendering fits Workers Free.

The full product still needs its final Worker/Static Assets binding integration after the schema/runtime port. No PNG render, application build, tests, preview request, deployment or production change was performed for this slice.

References: [Cloudflare non-JavaScript modules](https://developers.cloudflare.com/workers/vite-plugin/reference/non-javascript-modules/), [Satori](https://github.com/vercel/satori), [CF WASM Satori source](https://github.com/fineshopdesign/cf-wasm/tree/main/packages/satori).
