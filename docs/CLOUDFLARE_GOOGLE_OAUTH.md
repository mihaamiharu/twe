# Replacement Google OAuth setup — November 2, 2026

The owner authorized replacing the inaccessible historical OAuth project with a new dedicated project, `twe-auth-20261102` (TestingWithEkki Auth), controlled by the TWE owner's personal Google account. The historical project was not deleted, modified or assumed to be deleted. New credentials do not revoke the inaccessible old client's credentials or existing grants.

## Clients and runtime secrets

| Client                    | Authorized JavaScript origin                   | Authorized redirect URI                                                 | Activation                                             |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| TWE Cloudflare Preview    | `https://twe-preview.ekkisyam2310.workers.dev` | `https://twe-preview.ekkisyam2310.workers.dev/api/auth/callback/google` | Installed in preview Worker secrets                    |
| TWE Cloudflare Production | `https://testingwithekki.com`                  | `https://testingwithekki.com/api/auth/callback/google`                  | Installed in live production Worker; owner Keychain copy retained |

Each client has its own ID/secret. There are no wildcard callbacks or localhost callbacks on either client. A separate development client is needed if Google sign-in is later enabled locally. The existing local email/password flow is unchanged.

The approved identity scopes are `openid`, `email`, and `profile`, declared as Google's non-sensitive `openid`, `userinfo.email`, and `userinfo.profile` scopes. No Gmail, Drive, Cloud or other API scope is requested. Better Auth's current Google provider requests these three scopes and derives its callback from `BETTER_AUTH_URL`.

Credentials are stored as separate entries in this Mac's login Keychain under `com.testingwithekki.google-oauth.preview.20261102` and `com.testingwithekki.google-oauth.production.20261102`, with their matching client IDs as the account identifiers. Each password is base64-encoded JSON containing that client's configuration. Readback was verified without printing the values. The two temporary plaintext credential files were removed only after both Keychain copies were independently rechecked. No all-application Keychain access was enabled and no existing item was overwritten.

Preview uses only its own `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` Cloudflare Worker secrets. The GitHub deployment workflow does not need these runtime credentials; do not put them in source, VITE variables, public GitHub issues, logs or PRs. Production credentials were installed during the approved standby configuration step; production now serves the root custom domain from Cloudflare with maintenance disabled. Retain the existing `BETTER_AUTH_SECRET` and user/provider records.

## Consent and release state

The owner approved Google's API Services User Data Policy, the new credentials and the final publishing confirmation. The app is now External / In production; its initial setup used Testing with the owner as its single test user. Homepage, privacy and terms links are saved. Google's verification centre says no data-access verification is required for these non-sensitive scopes. Custom branding remains unverified and Google says it is not being shown to users. The Google account selected as support contact is shown to consent-screen users; project notifications use the existing business admin address. Google publishing is complete. Production website activation subsequently completed under the approved cutover; publishing alone did not establish that activation or prove a migrated Google login.

The focused hosted request check passed: preview returns a Google authorization URL using the replacement preview client, the exact callback, authorization-code response type, state protection, cookies and only `email openid profile`. That request check alone was configuration evidence. The owner subsequently completed Google sign-in and supplied a preview `/en` screenshot with the signed-in avatar; this records an owner-confirmed initial login pass. It does not establish repeat-login, migrated-account or role behavior. See [the setup evidence](reports/cloudflare-google-oauth-20261102.json).

Before closing the OAuth release gate:

1. Initial owner Google sign-in passed. During consolidated release validation, confirm logout and repeat sign-in, no duplicate user creation and server-controlled roles.
2. Verify a migrated existing Google account keeps its user ID, provider linkage and progress. Google identifies an account by stable `sub`; retain the application's stored Google provider account ID. A new OAuth client does not make old client-bound access/refresh tokens valid for that client. Do not unlink accounts or replace user rows to work around token failures.
3. Publishing completed with explicit owner approval. Custom branding verification remains separate if the owner wants branding displayed; no sensitive/restricted scope review is required. Verify the actual consent and callback during the approved production flow.
4. The production pair is installed in the live Worker with the preserved origin/session secret. A new Google-provider account was observed after opening traffic, with no case-insensitive email collision against source users; a migrated existing Google callback has not been independently confirmed. See [cutover evidence](reports/cloudflare-production-cutover-20261102.json).

References: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Better Auth Google configuration](https://better-auth.com/docs/authentication/google).
