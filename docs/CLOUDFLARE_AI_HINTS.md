# DeepSeek hint activation

The owner chose existing DeepSeek account credit on November 2, 2026. The existing local credential passed read-only `/user/balance` and `/models` checks: credit is available and `deepseek-flash` is listed. Those initial checks sent no generation request. The owner subsequently approved exactly one synthetic preview attempt up to US$0.02, which passed as recorded below. No raw balance amount was retained, and no new API credential, billing subscription or production configuration was created.

## Request and spending boundaries

New generation requires authentication, a known D1/catalog challenge, `DEEPSEEK_API_KEY` and a valid positive `AI_HINT_DAILY_LIMIT`. Missing, zero or malformed cap configuration disables new calls. Values are decimal integers from 1 through 9999. Production remains disabled until its own approved configuration.

Cached hints are returned before spending checks. Before each new provider attempt, the server atomically reserves a per-user 30-second cooldown and a shared D1 allowance for the 24 hours anchored at the first accepted request. The shared counter is per database/environment, not per user or object instance. Failed, invalid-context or uncertain attempts are not refunded; lowering the cap takes effect against the existing count. This cap limits attempts, not a guaranteed dollar balance or concurrent object duration. Provider usage elsewhere on the same account is outside this application's cap.

Caller inputs are bounded to a 160-character slug, 16,000-character attempt, ten 2,000-character static hints and the supported `en` / `id` locales. The assembled system and user prompt must fit 32,000 UTF-8 bytes; oversized content is rejected without a provider call. The provider receives challenge context and submitted code, not account email, user ID, session or credentials. User-submitted code can contain sensitive text; use synthetic code for the operator check and review user-facing privacy guidance before release.

The client uses fixed HTTPS `api.deepseek.com`, `deepseek-flash`, explicit non-thinking mode (`reasoning_effort: none`), a 1,024-token output cap, 25-second timeout and zero automatic retries. Only a nonempty answer ending with `finish_reason: stop` is accepted and stored; truncated/interrupted answers are failures. Timeout does not prove that upstream processing or billing stopped. Logs omit prompts, code, model answers, keys and provider error bodies.

## Approved preview check — November 2, 2026

Guarded source `f898c7c` passed typecheck, targeted lint and the preview build. It deployed as Worker version `2f487d0b-fee1-47c7-afd5-656c69d56f11` before activation. The two new policy tests and all full suites remain unrun, deferred to consolidated release validation as requested. The production deploy wrapper requires the cap setting alongside the key.

The owner approved an owner Keychain copy, preview-only key installation, a one-request cap and exactly one synthetic generation attempt up to **US$0.02** from existing credit. Keychain service `com.testingwithekki.deepseek.preview.20261102` / account `twe-preview` holds a read-back-verified owner copy. No key was placed in GitHub Actions or production, and no top-up or recurring purchase was made. The current rate card was checked before the request; prompt/output bounds were assessed against peak rates.

An existing synthetic preview learner requested a hint for public `css-attribute-selectors` using `.synthetic-example`. Its challenge progress row was absent before the check. Exactly one generation attempt succeeded in **2,630 ms** through the app's real authenticated HTTP server-function endpoint. D1 stored the returned hint with `used_hint` set. The English answer identified the selector mistake and gave a syntax example using an unrelated attribute; this is a narrow quality observation, not broad hint-quality acceptance.

The operator then set `AI_HINT_DAILY_LIMIT=0`. With new generation disabled, the same request returned the identical stored hint and left the shared allowance count at one. Only the exact newly created synthetic progress row was deleted, with guards for its user/challenge IDs, hint text and untouched completion/attempt fields. An uncached request afterward returned `AI hints are not enabled.` without consuming another allowance. The synthetic session was signed out and its temporary private session file removed. Rate-limit rows were left to expire normally. No other user record was changed.

The resulting active preview Worker version is `f738ca85-aad8-46ea-a73e-916dca90e3d1` at 100%. The key remains in preview and owner Keychain, but **new generation remains disabled** until a separate ongoing allowance is agreed. There was no automatic retry. Two balance samples showed no visible debit; that does not establish a final exact per-call charge or free usage because of rounding, billing delay or unrelated account activity. Raw balances were not retained.

See [sanitized activation and live-check evidence](reports/cloudflare-ai-hints-20261102.json).

Full unit/D1 integration, owner browser/E2E, multilingual hint quality, completed-challenge behavior, billing reconciliation and production budget acceptance remain consolidated release gates. The daily request cap is not a substitute for account-wide credit monitoring.

References checked November 2: [model pricing](https://api-docs.deepseek.com/quick_start/pricing/), [chat parameters and stop reasons](https://api-docs.deepseek.com/api/create-chat-completion/), [read-only balance API](https://api-docs.deepseek.com/api/get-user-balance/).
