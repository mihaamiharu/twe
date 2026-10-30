# Synthetic Free-compute probe

This isolated Worker investigates the strict-$0 design in [the architecture plan](../../docs/CLOUDFLARE_FREE_ARCHITECTURE.md). It is separate from both the full app and the original D1 feasibility spike. Do not bind production credentials or data.

`/noble` verifies a public synthetic password vector with the existing Better Auth implementation; `/native` derives the same vector using Node scrypt; `/ping` is a baseline. Parameters and Unicode normalization are identical. A thin Worker gates requests with the preview Basic token, then forwards to one APAC-hinted SQLite-backed Durable Object. The object does not use storage. All responses are private/noindex. No arbitrary benchmark input is accepted.

```sh
bunx wrangler deploy --config spikes/free-runtime/wrangler.jsonc --dry-run
# Supply PREVIEW_ACCESS_TOKEN through Wrangler's secret store, never this file.
bunx wrangler deploy --config spikes/free-runtime/wrangler.jsonc
bunx wrangler tail --config spikes/free-runtime/wrangler.jsonc --format json
```

Measure Worker and Durable Object CPU separately. Local wall-clock time is not a hosted CPU measurement. A successful deployment on an account with unknown billing status does not establish that it is running on Free. No production cutover or paid service is permitted by this fixture.
