# Strict $0 architecture work — October 31, 2026

The owner chose a strict $0 target and deferred production cutover. This supersedes the Paid recommendation in the first hosted-preview report. No billing change, production import or domain change is authorized by this investigation. Existing passwords, sessions, data, SSR/SEO, admin functions and custom OG behavior remain in scope. The original provider-undecided HTTP preparation was superseded on November 1 by the owner’s selection of existing Spacemail SMTP; HTTP remains supported. SMTP sockets must close within each bounded request so they do not retain object-active duration.

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

## Full application candidate

Runtime source `fb48add` is deployed only to twe-preview as version `40ff8186-03e1-456e-bab9-2b956aaa8ca0`. The Worker now forwards dynamic requests to AppRuntime; D1, all auth algorithms/data and public HTML/OG behavior are retained. Local/test configs use the same boundary. Builds fail if AppRuntime is not exported, and deployment preflight requires its binding plus the SQLite class migration.

Local HTTP and hosted preview smoke passed, as did all 30 D1 integration tests, targeted auth checks, lint/typecheck and the Worker build. Eight concurrent learner/admin server-session requests retained their identities. Three hosted submissions added one completion and 10 XP, and an injected later failure left the resulting state unchanged. No Playwright, actual email/Google/AI/GitHub delivery or production cutover ran.

Captured gateway CPU was 0–1 ms across SSR/auth/OG/server functions. Object CPU samples included Home 21–34 ms, Learn 30–43 ms, Practice 48–58 ms, login 183–187 ms and a custom OG render 37 ms. See [separate execution-model samples](reports/cloudflare-durable-preview-20261031.json). All captured outcomes were ok. These observations support the compute boundary; they do not prove p99, controlled cold starts, memory, billed duration or account-wide Free quota/billing acceptance. Production remains deferred.

CLI data tooling now creates a short-lived data-only proxy config without compute declarations; this avoids misleading class-export warnings while preserving the app's real local workerd boundary. D1 access, private `.dev.vars` resolution, auth and temporary-file cleanup were verified. AppRuntime uses no business/object storage. A future storage/timer/sharding change needs an explicit quota/recovery review.

A bounded six-request mixed check (two logins, two custom OG renders, Learn SSR and Practice SSR) also completed with all responses 200. This checks one mixed concurrency scenario; it is not peak-memory or quota acceptance evidence.

## Partial-day resource audit — November 1, 2026

After refreshing the existing CLI OAuth session, read-only GraphQL analytics became available without expanding permissions. The account currently lists two SQLite-backed Durable Object namespaces (preview and the inactive Free-runtime probe), four D1 databases and 745,472 reported D1 bytes. No other namespace or database was modified. The actual Workers subscription/no-paid-overage state still lacks billing evidence; analytics access does not establish the plan.

In the captured partial UTC day, preview gateway CPU peaked at 5.934 ms, below the 8 ms target in this sample. Reported object duration totaled 2.066 GB-s with no exceeded-CPU/memory errors. The object's reported periodic memory peak was 116,876,938 bytes: only 11,123,062 bytes below a conservative decimal 128 MB comparison. This is limited observed headroom, and periodic samples can miss short peaks. The report retains provider percentile statistics as estimates rather than claiming production p99 acceptance.

The bounded workload passed 28 HTTP requests: 12 distinct dynamic OG PNGs plus two six-task concurrent rounds combining user/admin login/session/logout, OG and Learn/Practice SSR. Rounds were separated by 11 seconds because an earlier unspaced attempt correctly triggered the preserved shared-IP sign-in limiter. No limiter was weakened and partial attempts are not called passes. No mail, Google, AI or GitHub delivery occurred.

A useful independent bound follows from the published fixed 128 MB object allocation: one continuously active object uses at most 86,400 × 0.128 = **11,059.2 GB-s/day**, below the 13,000 GB-s/day Free allowance without assuming hibernation. That leaves 1,940.8 GB-s (about 4.21 aggregate object-hours) for every other object on the account. Two continuously active objects exceed Free. This is a budget inference, not measured billing or approval to keep multiple environments/probes active. Preserve the fixed object name and budget preview/probes separately at cutover.

See [the sanitized audit](reports/cloudflare-free-readiness-20261101.json). Controlled hosted cold starts, broader resource/load/traffic acceptance and account billing confirmation remain open. A full synthetic remote-preview SQL archive also passed encrypted recovery into fresh local workerd after fixing schema/data restore ordering; see the backup recovery report. Google project access was deferred at the owner's request, and remains a cutover gate.
