# Dynamic OG rendering and memory boundaries

Common curriculum/home cards are generated at build time and served as Static Assets. Custom legacy OG query URLs render inside the same fixed AppRuntime Durable Object as SSR; D1 remains the business database. No additional object, external rendering service, paid plan or per-user object is introduced.

## Fonts and layout

The renderer retains Instrument Sans for the brand/Latin text and loads matching self-hosted Noto Sans, Noto Sans Arabic, Noto Sans JP and monochrome Noto Emoji subsets when needed. This covers the tested Cyrillic, Arabic, Japanese and joined-emoji cases; it is not a promise of every Unicode character. Unsupported or over-complex text receives an uncached 422 response rather than missing-glyph boxes.

`scripts/generate-og-fonts.ts` copies the pinned Fontsource packages' WOFF subsets and original OFL license notices into generated `public/og-fonts/` assets. Filenames are SHA-256 content addresses. The checked-in manifest holds only their paths, lengths and Unicode ranges. Build/setup dependency installation supplies the fonts; requests never send titles to a third-party font service. Build-time and runtime cards use the same pinned Satori version. Runtime fetches use only the existing Assets binding and generated SHA-256 paths.

Titles preserve grapheme clusters, normalize whitespace and bound text size. Three lines of text are clamped with an ellipsis in a fixed title area; badge/reward areas are separate. Very long unbroken words wrap within the card. The image stays 1200×630 and retains XP zero.

## Resource limits

- One render runs at a time; at most four distinct renders may be active/queued. Duplicate keys share work.
- Additional distinct work receives uncached 503 with `Retry-After: 1`. Normal API responses do not expose cache keys or title data in logs.
- The PNG LRU holds at most eight entries / 2 MiB. Font binary caching is capped at 256 KiB; one render may select at most twelve subsets / 512 KiB.
- The workerd adapter reduces Satori's retained loader combinations to two and its per-loader shaped-run cache to 32 entries. Native font handles retain upstream cleanup behavior.
- Resvg image/renderer allocations are freed in `finally` blocks. Satori uses statically imported layout and HarfBuzz WASM modules.

`scripts/satori-workerd.plugin.ts` adapts only the exact pinned Satori 0.63.2 standalone source. Its Emscripten HarfBuzz bootstrap otherwise assumes `self.location` and attempts runtime WASM compilation, both incompatible with this workerd path. The adapter supplies the compiled HarfBuzz module plus fourteen precompiled callback conversion modules. HarfBuzz otherwise tries to compile those tiny callback wrappers during startup too. Unknown callback signatures are rejected, startup conversion failures reject the promise, and every source anchor is checked exactly once. Dependency upgrades must review these anchors, rebuild and repeat the hosted checks; a mismatch fails the build rather than silently removing the protection.

These are bounded-work controls, not production capacity acceptance. Validate actual gateway CPU separately from object memory/duration and include other active namespaces in account-wide quotas.

## Verification

Focused tests validate all fourteen callback signatures against the pinned wrapper and cover grapheme bounds, actual title layout, duplicate coalescing, overload, cache hit/eviction, and queue recovery after a rejected title. The owner's full Playwright release run remains separate. The [November 2 hosted evidence](reports/cloudflare-og-readiness-20261102.json) records the 96-request pass, inspected glyph/layout cases, bounded overload behavior, scoped resource samples and remaining capacity limits.

Use `cf:measure:preview` for bounded route/role/OG checks. For provider memory samples scoped to a study, `cf:audit:free` accepts an optional positive UTC window of at most one hour after its private report path:

```sh
bun run cf:audit:free /absolute/private/report.json 2026-11-01T23:00:00Z 2026-11-01T23:10:00Z
```

Daily quota totals remain separate from that window. Periodic/sampled analytics can miss peaks or arrive late; empty periodic groups are explicitly missing evidence, not zero memory. Do not infer production p99 or unlimited capacity from a small synthetic study.

References: [Workers WASM support](https://developers.cloudflare.com/workers/runtime-apis/webassembly/), [Satori standalone/WASM support](https://github.com/vercel/satori#standalone-build-of-satori), [Fontsource Noto Sans JP](https://fontsource.org/fonts/noto-sans-jp/about), [Durable Object limits](https://developers.cloudflare.com/durable-objects/platform/limits/).
