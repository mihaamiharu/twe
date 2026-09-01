# Search discoverability

TestingWithEkki uses crawlable, server-rendered localized pages as the source of truth for search and generative-engine discovery.

- Public English and Indonesian pages emit localized title, description, Open Graph, Twitter, canonical, and hreflang metadata.
- Account, administrative, error, and verification destinations use `noindex, nofollow` and are excluded from the sitemap.
- JSON-LD uses stable `@id` references for TestingWithEkki, Ekki Syam Sugiardi, the WebSite, articles, and learning resources.
- `robots.txt` allows ordinary search/reference retrieval, keeps OAI-SearchBot allowed, and blocks the configured training crawlers. Production Cloudflare rules remain authoritative for the deployed edge policy.

No `llms.txt` is shipped. There is no broadly adopted requirement for it, and the site already exposes its people-first content, metadata, structured entities, and crawl policy through standard HTML, JSON-LD, robots, and sitemap mechanisms. Adding a parallel summary would create another document to keep synchronized without a concrete consumer requirement.
