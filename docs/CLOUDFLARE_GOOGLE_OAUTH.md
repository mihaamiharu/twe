# Replacement Google OAuth setup — November 2, 2026

The owner authorized replacing the inaccessible historical OAuth project with a new dedicated project, `twe-auth-20261102` (TestingWithEkki Auth), controlled by the TWE owner's personal Google account. The historical project was not deleted, modified or assumed to be deleted. New credentials do not revoke the inaccessible old client's credentials or existing grants.

## Clients and runtime secrets

| Client                    | Authorized JavaScript origin                   | Authorized redirect URI                                                 | Activation                                             |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| TWE Cloudflare Preview    | `https://twe-preview.ekkisyam2310.workers.dev` | `https://twe-preview.ekkisyam2310.workers.dev/api/auth/callback/google` | Installed in preview Worker secrets                    |
| TWE Cloudflare Production | `https://testingwithekki.com`                  | `https://testingwithekki.com/api/auth/callback/google`                  | Stored in owner Keychain; production remains unchanged |

Each client has its own ID/secret. There are no wildcard callbacks or localhost callbacks on either client. A separate development client is needed if Google sign-in is later enabled locally. The existing local email/password flow is unchanged.

The approved identity scopes are `openid`, `email`, and `profile`, declared as Google's non-sensitive `openid`, `userinfo.email`, and `userinfo.profile` scopes. No Gmail, Drive, Cloud or other API scope is requested. Better Auth's current Google provider requests these three scopes and derives its callback from `BETTER_AUTH_URL`.

Credentials are stored as separate entries in this Mac's login Keychain under `com.testingwithekki.google-oauth.preview.20261102` and `com.testingwithekki.google-oauth.production.20261102`, with their matching client IDs as the account identifiers. Each password is base64-encoded JSON containing that client's configuration. Readback was verified without printing the values. The two temporary plaintext credential files were removed only after both Keychain copies were independently rechecked. No all-application Keychain access was enabled and no existing item was overwritten.

Preview uses only its own `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` Cloudflare Worker secrets. The GitHub deployment workflow does not need these runtime credentials; do not put them in source, VITE variables, public GitHub issues, logs or PRs. Production credentials remain in Keychain until the approved production configuration/cutover step. Retain the existing `BETTER_AUTH_SECRET` and user/provider records.

## Consent and release state

The owner approved Google's API Services User Data Policy and the new credentials. The app remains External / Testing with the owner account as its single test user. Homepage, privacy and terms links are saved; the app has not been published. The Google account selected as support contact is shown to consent-screen users; project notifications use the existing business admin address. Publishing the app and production activation remain separate release steps.

The focused hosted request check passed: preview returns a Google authorization URL using the replacement preview client, the exact callback, authorization-code response type, state protection, cookies and only `email openid profile`. This is configuration evidence, not a completed Google sign-in. See [the setup evidence](reports/cloudflare-google-oauth-20261102.json).

Before closing the OAuth release gate:

1. Complete an owner Google sign-in through preview and confirm callback, session, logout and repeat sign-in. Confirm no duplicate user is created and roles stay server-controlled.
2. Verify a migrated existing Google account keeps its user ID, provider linkage and progress. Google identifies an account by stable `sub`; retain the application's stored Google provider account ID. A new OAuth client does not make old client-bound access/refresh tokens valid for that client. Do not unlink accounts or replace user rows to work around token failures.
3. Finish production branding/domain requirements and deliberately publish the consent app before general-user release. Testing-mode access is not public production readiness.
4. Install only the production client pair during the approved release preparation, retaining the production auth origin and session secret; then verify the production flow after the approved cutover.

References: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Better Auth Google configuration](https://better-auth.com/docs/authentication/google).
