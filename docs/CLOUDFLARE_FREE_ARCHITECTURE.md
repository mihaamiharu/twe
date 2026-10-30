# Strict $0 architecture work — October 31, 2026

The owner chose a strict $0 target and deferred production cutover. This supersedes the Paid recommendation in the first hosted-preview report. No billing change, production import or domain change is authorized by this investigation. Existing passwords, sessions, data, SSR/SEO, admin functions and custom OG behavior remain in scope. Email stays provider-undecided behind configurable HTTP transport.

## Proposed compute layout

Keep Static Assets serving files directly. A thin Worker handles access/security/maintenance and forwards dynamic requests to one application Durable Object placed near APAC D1. The object executes the existing Start handler, authentication and OG renderer. D1 remains the only application database; object storage would be unused. A fixed object name bounds instance count and simplifies account-wide compute budgeting. This adds a regional compute hop and a single-object throughput limit, which require measurement.

SQLite-backed Durable Objects are available on Free, with a documented default 30-second invocation CPU budget. Current Free allowances include 100,000 object requests and 13,000 GB-s of duration daily. These are separate from the gateway Worker's 10 ms CPU ceiling. Exceeding a Free allowance must mean availability loss, not a paid fallback. See [DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/) and [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

## Execution order and evidence gates

1. Deploy a protected synthetic probe outside the product. Compare the existing Better Auth scrypt path with equivalent native `node:crypto` scrypt, keeping parameters, NFKC normalization and stored hash encoding unchanged. Measure gateway and object invocations separately. Do not weaken password derivation to meet a CPU number.
2. If the compute boundary works, move the unchanged application handler behind it in preview. Verify body/URL/header/cookie/stream transport, request-context isolation, password/session compatibility, admin enforcement, concurrent rewards, injected failures and dynamic/static OG. Keep production untouched.
3. Make local workerd and the owner's later E2E exercise the same boundary. Consolidate checks at the candidate gate; do not run Playwright on the owner's behalf.
4. Measure request CPU, object duration, memory, latency, D1 rows and account-wide quota headroom. Include startup and first/repeated requests. A small successful sample is not proof of sustained Free feasibility.
5. Require confirmation that the deployment account is on Free, with no paid overage path, plus owner E2E and the existing provider/recovery/cutover gates. The limited API token could not read subscription state; the `standard` default usage-model response is insufficient billing evidence. Do not downgrade an account or alter another project's resources automatically.

The `spikes/free-runtime` probe is synthetic only. It has no database, product routes, mail, AI or GitHub integration, and writes no object storage. Its use of SQLite-backed class registration is solely for Free-plan-compatible compute. Broader public-page prerendering and native-crypto integration remain options only if measurements justify them; no product features have been removed.

## Initial isolated result

The protected probe deployed as version `357c4e3b-a0ea-4a8d-a08b-8d2d3523ebd5`. All nine authorized requests passed and unauthorized access returned 401. Captured gateway CPU was 0–1 ms; object native scrypt was 76–81 ms and existing Better Auth scrypt 142–148 ms. Both matched the same synthetic stored-hash vector. Native hashing alone does not meet the ordinary Worker CPU budget. The compute boundary is promising; full-app context/transport, resource budgets and actual Free-account deployment remain unproven. See [sanitized samples](reports/cloudflare-free-probe-20261031.json).
