# Bundled content and delivery — issue #250

Work is integrated on `release/cloudflare-migration`. Runtime/build/parity checks remain deferred to #256. This document distinguishes implemented source changes from remaining migration work.

## Bundled Learn and Practice sources

`src/server/content-catalog.server.ts` now imports a deterministic server-only snapshot instead of opening files during requests. `scripts/generate-content-manifest.ts` is the only module that reads the editorial source directories for this snapshot.

The source of truth remains `tutorials/registry.json`, the active `content/challenges/*.json` tiers and localized tutorial Markdown. Do not edit `src/server/generated/content-manifest.json` directly. It is tracked so direct Bun consumers have an input even without starting Vite; it is never copied into `public/`.

The generator sorts Markdown filenames, includes only regular `.md` files from the supported locales, uses explicit active challenge tiers, writes atomically, and leaves an unchanged snapshot untouched. It includes no production database records, credentials or machine-specific paths. The existing catalog parsers, frontmatter handling, missing-locale English fallback, duplicate/relationship validation, caches, ordering and publication overlays remain in the catalog layer.

Vite regenerates the snapshot before module transformation and watches editorial changes during development. `db:sync` regenerates it before importing the sync scripts. The manual source-generation command is:

```sh
bun run content:generate
```

Initial generation captured 56 Markdown documents. This was source generation, not an application build or test run. API/runtime parity and HMR behavior still need verification in #256. Challenge solutions remain server source data; check the final client bundle does not accidentally include the snapshot.

## Route and cache policy

The existing root loader fetches authentication and consent, and the header is personalized. Keeping that behavior means the initial migration must not prerender or publicly cache those HTML responses. An anonymous prerender shell plus authenticated client refresh would be a separate implementation and validation task; it is not silently enabled here.

`src/start.ts` registers a request middleware shared by SSR, server routes and server functions. It defaults dynamic responses to `Cache-Control: private, no-store` and varies on cookies. Successful cookie-free public machine documents retain their existing public cache policy. QA hosts and `workers.dev` responses receive noindex headers.

| Surface                                               | Initial delivery                                            | Reason                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Hashed JS/CSS/fonts, images, browser `esbuild.wasm`   | Static Assets                                               | Serve outside the Start handler; hashed assets may use immutable caching             |
| Localized home/about/legal/contact/labs/changelog     | Dynamic SSR, private/no-store                               | Shared root includes session/consent-dependent output                                |
| Learn/Practice lists and details                      | Bundled editorial source plus dynamic SSR, private/no-store | Publication overlays, progress and personalized shell remain dynamic                 |
| Profile, dashboard/leaderboard, admin and auth routes | Dynamic, private/no-store                                   | User/role/session state must not enter a shared cache                                |
| Server functions                                      | Dynamic, private/no-store                                   | They can return authenticated application data                                       |
| `robots.txt`, `sitemap.xml`                           | Public machine routes, existing short cache policy          | They expose public crawl/catalog metadata without the personalized shell             |
| Known OG cards                                        | Static PNG assets with one-hour public caching              | SEO links bypass application rendering; legacy query URLs redirect to the same cards |
| Arbitrary `/api/og` PNG responses                     | Dynamic render and bounded image cache                      | Legacy title/type/difficulty/XP queries remain available                             |

The content snapshot removes request-time filesystem dependencies, not Worker execution for HTML. Do not claim public HTML bypasses Workers. The public/static acceptance goal still requires a final route-by-route decision and measured CPU budget; the existing UI/session behavior is preserved initially.

## Remaining work in #250

- Complete OG runtime/visual/crawler validation in #256. The source implementation now prepares static known cards and a conditional Workers WASM fallback for arbitrary legacy queries, with no request-time disk/font fetching. See `docs/CLOUDFLARE_OG.md` for the prepared 222-card source manifest and explicit unverified items.
- Full-product Static Assets wiring and protected synthetic preview deployment are complete. Keep the unrelated original spike separate.
- Record final built asset count/maximum file size and verify editor/Wasm, media, locale fallback, sitemap/robots/canonical/redirect behavior and cache invalidation in #256.
- Verify headers and signed-in navigation in the real runtime, including no session/profile/consent leakage through shared caches.

#250 remains open for browser/visual/crawler parity and the remaining release gates. PNG generation/dimensions, bundle guards, asset sizes, local HTTP and focused hosted-preview checks are recorded in CLOUDFLARE_READINESS.md; the earlier source-only status is superseded by that evidence.
