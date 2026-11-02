# DeepSeek hint activation

The owner chose existing DeepSeek account credit on November 2, 2026. The existing local credential passed read-only `/user/balance` and `/models` checks: credit is available and `deepseek-flash` is listed. No generation request was sent, no balance amount was retained, and no new credential, billing subscription or production configuration was created.

## Request and spending boundaries

New generation requires authentication, a known D1/catalog challenge, `DEEPSEEK_API_KEY` and a valid positive `AI_HINT_DAILY_LIMIT`. Missing, zero or malformed cap configuration disables new calls. Values are decimal integers from 1 through 9999. Production remains disabled until its own approved configuration.

Cached hints are returned before spending checks. Before each new provider attempt, the server atomically reserves a per-user 30-second cooldown and a shared D1 allowance for the 24 hours anchored at the first accepted request. The shared counter is per database/environment, not per user or object instance. Failed, invalid-context or uncertain attempts are not refunded; lowering the cap takes effect against the existing count. This cap limits attempts, not a guaranteed dollar balance or concurrent object duration. Provider usage elsewhere on the same account is outside this application's cap.

Caller inputs are bounded to a 160-character slug, 16,000-character attempt, ten 2,000-character static hints and the supported `en` / `id` locales. The assembled system and user prompt must fit 32,000 UTF-8 bytes; oversized content is rejected without a provider call. The provider receives challenge context and submitted code, not account email, user ID, session or credentials. User-submitted code can contain sensitive text; use synthetic code for the operator check and review user-facing privacy guidance before release.

The client uses fixed HTTPS `api.deepseek.com`, `deepseek-flash`, explicit non-thinking mode (`reasoning_effort: none`), a 1,024-token output cap, 25-second timeout and zero automatic retries. Only a nonempty answer ending with `finish_reason: stop` is accepted and stored; truncated/interrupted answers are failures. Timeout does not prove that upstream processing or billing stopped. Logs omit prompts, code, model answers, keys and provider error bodies.

## Proposed bounded preview check

After approval, retain an owner copy of the existing key in this Mac's login Keychain and install only preview `DEEPSEEK_API_KEY` plus `AI_HINT_DAILY_LIMIT=1`. Deploy the guarded source before installing these settings. Use an existing synthetic preview learner to request exactly one short hint through the app. Verify successful response, D1 hint persistence and reuse without another generation request. Remove only the synthetic progress record created for this check and disable further new generation after the test; retain cached production/user records untouched. Do not retry an uncertain paid request.

The proposed approval ceiling is **one generation attempt and US$0.02**, deducted from existing credit, with synthetic public challenge content only. Confirm the current rate card again before the request. The 32 KB prompt and 1,024 output-token limits leave room below that ceiling at the November 2 peak rates. No top-up, recurring purchase, production key installation or wider test is included.

Full unit/D1 integration, owner browser/E2E, multilingual hint quality, completed-challenge behavior, billing reconciliation and production budget acceptance remain consolidated release gates. The daily request cap is not a substitute for account-wide credit monitoring.

References checked November 2: [model pricing](https://api-docs.deepseek.com/quick_start/pricing/), [chat parameters and stop reasons](https://api-docs.deepseek.com/api/create-chat-completion/), [read-only balance API](https://api-docs.deepseek.com/api/get-user-balance/).
